// pages/api/immobilier/analyse-portefeuille.js
// Compare les mandats de l'agent avec les tendances DVF de leur zone
// Claude génère un conseil par mandat + alerte email si marché en baisse
// Peut être appelé manuellement ou via le cron quotidien

import { supabaseAdmin } from '../../../lib/supabase';
import { getSession } from '../../../lib/auth';

const CLAUDE_MODEL = 'claude-sonnet-4-6';

// ─── Fetch score liquidité depuis le cache ou l'API ───────────────────────────
async function getLiquidite(codeCommune, ville) {
  const cacheKey = codeCommune || ville?.toLowerCase().replace(/\s+/g, '_');
  if (!cacheKey) return null;

  // 1. Chercher en cache
  const { data: cached } = await supabaseAdmin
    .from('liquidite_cache')
    .select('data, updated_at')
    .eq('code_commune', cacheKey)
    .single();

  if (cached) {
    const age = (Date.now() - new Date(cached.updated_at).getTime()) / (1000 * 60 * 60);
    if (age < 24) return cached.data;
  }

  // 2. Fetch DVF si cache expiré
  const endpoints = [
    `https://api.dvf.etalab.gouv.fr/dvf/api/?code_commune=${cacheKey}&fields=date_mutation,valeur_fonciere,surface_reelle_bati,type_local&ordering=-date_mutation&page_size=200`,
    `https://dvf.etalab.gouv.fr/api/dvf/?code_commune=${cacheKey}&fields=date_mutation,valeur_fonciere,surface_reelle_bati,type_local&ordering=-date_mutation&page_size=200`,
  ];

  let transactions = [];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const data = await res.json();
      transactions = data.results || data.features || data || [];
      if (transactions.length) break;
    } catch { continue; }
  }

  if (!transactions.length) return null;

  // Calcul score (même logique que liquidite.js)
  const byQuarter = {};
  for (const t of transactions) {
    const date = t.date_mutation || t.properties?.date_mutation;
    if (!date) continue;
    const d = new Date(date);
    const quarter = `${d.getFullYear()}-Q${Math.ceil((d.getMonth() + 1) / 3)}`;
    byQuarter[quarter] = (byQuarter[quarter] || 0) + 1;
  }
  const quarters = Object.values(byQuarter);
  const volumeMoyenTrimestriel = quarters.length
    ? Math.round(quarters.reduce((a, b) => a + b, 0) / quarters.length) : 0;

  const sorted = [...transactions]
    .filter(t => t.date_mutation || t.properties?.date_mutation)
    .sort((a, b) => new Date(a.date_mutation || a.properties?.date_mutation) - new Date(b.date_mutation || b.properties?.date_mutation));

  const delais = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].date_mutation || sorted[i - 1].properties?.date_mutation);
    const curr = new Date(sorted[i].date_mutation || sorted[i].properties?.date_mutation);
    const jours = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
    if (jours > 0 && jours < 3650) delais.push(jours);
  }
  const delaiMoyen = delais.length ? Math.round(delais.reduce((a, b) => a + b, 0) / delais.length) : null;

  const scoreVolume = Math.min(100, Math.round((volumeMoyenTrimestriel / 200) * 100));
  let scoreDelai = 50;
  if (delaiMoyen !== null) {
    if (delaiMoyen <= 30) scoreDelai = 100;
    else if (delaiMoyen >= 365) scoreDelai = 0;
    else scoreDelai = Math.round(100 - ((delaiMoyen - 30) / 335) * 100);
  }
  const score = Math.round(scoreVolume * 0.5 + scoreDelai * 0.5);

  let label;
  if (score >= 75) label = 'Marché très actif';
  else if (score >= 50) label = 'Marché fluide';
  else if (score >= 25) label = 'Marché tendu';
  else label = 'Marché peu liquide';

  const prixList = transactions
    .filter(t => (t.valeur_fonciere || t.properties?.valeur_fonciere) && (t.surface_reelle_bati || t.properties?.surface_reelle_bati))
    .map(t => {
      const val = parseFloat(t.valeur_fonciere || t.properties?.valeur_fonciere);
      const surf = parseFloat(t.surface_reelle_bati || t.properties?.surface_reelle_bati);
      return surf > 0 ? val / surf : null;
    })
    .filter(Boolean);

  const prixMoyenM2 = prixList.length ? Math.round(prixList.reduce((a, b) => a + b, 0) / prixList.length) : null;

  // Tendance : comparer les 2 derniers trimestres
  const quarterKeys = Object.keys(byQuarter).sort();
  let tendance = 'stable';
  if (quarterKeys.length >= 2) {
    const last = byQuarter[quarterKeys[quarterKeys.length - 1]];
    const prev = byQuarter[quarterKeys[quarterKeys.length - 2]];
    if (last < prev * 0.8) tendance = 'baisse';
    else if (last > prev * 1.2) tendance = 'hausse';
  }

  const result = { score, label, tendance, details: { volumeMoyenTrimestriel, delaiMoyenJours: delaiMoyen, prixMoyenM2 } };

  // Mettre en cache
  await supabaseAdmin.from('liquidite_cache').upsert(
    { code_commune: cacheKey, ville, data: result, updated_at: new Date().toISOString() },
    { onConflict: 'code_commune' }
  );

  return result;
}

// ─── Analyse IA d'un mandat via Claude ───────────────────────────────────────
async function analyserMandat(bien, liquidite) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { conseil: 'Clé API Anthropic non configurée.', priorite: 'normale', action: 'Vérifier la configuration' };
  }

  const prompt = `Tu es un conseiller expert en stratégie immobilière.
Analyse ce mandat en fonction des données de marché et génère un conseil actionnable pour l'agent.
Réponds UNIQUEMENT en JSON valide, sans markdown.

MANDAT :
- Bien : ${bien.type} à ${bien.ville}
- Prix affiché : ${bien.prix ? bien.prix.toLocaleString('fr-FR') + ' €' : 'N/A'}
- Surface : ${bien.surface ? bien.surface + ' m²' : 'N/A'}
- Statut : ${bien.statut}
- En vente depuis : ${bien.created_at ? Math.round((Date.now() - new Date(bien.created_at)) / (1000 * 60 * 60 * 24)) + ' jours' : 'N/A'}

MARCHÉ LOCAL :
- Score liquidité : ${liquidite?.score ?? 'N/A'}/100 — ${liquidite?.label ?? 'N/A'}
- Tendance récente : ${liquidite?.tendance ?? 'N/A'}
- Prix moyen m² : ${liquidite?.details?.prixMoyenM2 ? liquidite.details.prixMoyenM2 + ' €/m²' : 'N/A'}
- Volume trimestriel : ${liquidite?.details?.volumeMoyenTrimestriel ?? 'N/A'} transactions

JSON attendu :
{
  "conseil": "<conseil en 2-3 phrases, concret et actionnable pour l'agent>",
  "priorite": "<haute|normale|basse>",
  "action": "<action recommandée en une ligne>",
  "alerte": <true|false>,
  "alerteRaison": "<si alerte true, la raison en une phrase>"
}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch (e) {
    console.warn('[AnalysePortefeuille] IA fallback pour', bien.reference, ':', e.message);
    return {
      conseil: `Le marché de ${bien.ville} est ${liquidite?.label?.toLowerCase() ?? 'en cours d\'analyse'}. Vérifiez le positionnement prix du bien.`,
      priorite: liquidite?.tendance === 'baisse' ? 'haute' : 'normale',
      action: 'Revoir le prix si le bien est en vente depuis plus de 60 jours',
      alerte: liquidite?.tendance === 'baisse',
      alerteRaison: liquidite?.tendance === 'baisse' ? 'Marché en baisse dans ce secteur' : null,
    };
  }
}

// ─── Envoi email d'alerte Brevo ───────────────────────────────────────────────
async function envoyerAlerteEmail(agentEmail, alertes) {
  if (!process.env.BREVO_API_KEY || !alertes.length) return;

  const lignes = alertes.map(a => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;">
        <strong>${a.bien.type} — ${a.bien.ville}</strong><br/>
        <span style="color:#6b7280;font-size:12px;">${a.bien.reference || ''} · ${a.bien.prix?.toLocaleString('fr-FR') ?? '?'} €</span>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#dc2626;font-size:12px;">${a.analyse.alerteRaison || 'Marché en baisse'}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#374151;">${a.analyse.action}</td>
    </tr>`).join('');

  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify({
      sender: { name: 'ProspectBot', email: process.env.BREVO_SENDER_EMAIL || 'noreply@nestlead.fr' },
      to: [{ email: agentEmail }],
      subject: `⚠️ ${alertes.length} mandat${alertes.length > 1 ? 's' : ''} dans un marché en baisse — Action requise`,
      htmlContent: `
<div style="font-family:sans-serif;max-width:620px;margin:0 auto;padding:24px;">
  <div style="background:#0f0f11;padding:20px 24px;border-radius:10px 10px 0 0;">
    <p style="color:#d4a853;font-style:italic;font-size:18px;margin:0;">ProspectBot</p>
    <h2 style="color:#fff;margin:6px 0 0;font-size:16px;font-weight:400;">Alerte portefeuille — marchés en baisse</h2>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:none;padding:20px 24px;border-radius:0 0 10px 10px;">
    <p style="color:#374151;margin-bottom:16px;">Voici vos mandats situés dans des zones où le marché montre des signes de ralentissement :</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="padding:8px 12px;text-align:left;font-weight:600;color:#374151;">Mandat</th>
          <th style="padding:8px 12px;text-align:left;font-weight:600;color:#374151;">Alerte</th>
          <th style="padding:8px 12px;text-align:left;font-weight:600;color:#374151;">Action recommandée</th>
        </tr>
      </thead>
      <tbody>${lignes}</tbody>
    </table>
    <p style="margin-top:20px;color:#6b7280;font-size:12px;">Connectez-vous à ProspectBot pour voir l'analyse complète de votre portefeuille.</p>
  </div>
</div>`,
    }),
  }).catch(e => console.warn('[AnalysePortefeuille] Email warning:', e.message));
}

// ─── Handler principal ────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // Authentification : session normale ou token cron
  let agentEmail;
  const authHeader = req.headers.authorization;
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (isCron) {
    // Appelé depuis le cron — traiter tous les agents
    const { data: agents } = await supabaseAdmin.from('agents').select('email').eq('plan', 'pro').or('plan.eq.agence');
    if (!agents?.length) return res.status(200).json({ success: true, message: 'Aucun agent Pro/Agence' });

    let totalAlertes = 0;
    for (const agent of agents) {
      try {
        const result = await analyserPortefeuille(agent.email, true);
        totalAlertes += result.alertes?.length || 0;
      } catch (e) {
        console.error('[AnalysePortefeuille cron] Erreur pour', agent.email, ':', e.message);
      }
    }
    return res.status(200).json({ success: true, agentsTraites: agents.length, totalAlertes });
  }

  // Appel manuel — agent connecté
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Non authentifié' });
  agentEmail = session.email;

  try {
    const result = await analyserPortefeuille(agentEmail, false);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('[AnalysePortefeuille] Erreur:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// ─── Logique d'analyse (partagée cron + manuel) ───────────────────────────────
async function analyserPortefeuille(agentEmail, sendEmail) {
  // 1. Récupérer les mandats actifs
  const { data: biens, error } = await supabaseAdmin
    .from('biens')
    .select('*')
    .eq('agent_email', agentEmail)
    .eq('statut', 'disponible');

  if (error) throw error;
  if (!biens?.length) {
    return { message: 'Aucun mandat actif', analyses: [], alertes: [], resumeGlobal: null };
  }

  // 2. Analyser chaque mandat
  const analyses = [];
  const alertes = [];

  // Regrouper par ville pour limiter les appels DVF
  const villesUniques = [...new Set(biens.map(b => b.code_postal || b.ville).filter(Boolean))];
  const liquiditeByZone = {};

  for (const zone of villesUniques) {
    try {
      liquiditeByZone[zone] = await getLiquidite(zone, biens.find(b => b.code_postal === zone || b.ville === zone)?.ville);
      await new Promise(r => setTimeout(r, 200)); // rate limit DVF
    } catch (e) {
      console.warn('[AnalysePortefeuille] DVF échec pour zone', zone, ':', e.message);
    }
  }

  for (const bien of biens) {
    const zoneKey = bien.code_postal || bien.ville;
    const liquidite = liquiditeByZone[zoneKey] || null;

    const analyse = await analyserMandat(bien, liquidite);
    const entry = { bien, liquidite, analyse };
    analyses.push(entry);

    if (analyse.alerte) alertes.push(entry);
  }

  // 3. Résumé global via Claude
  let resumeGlobal = null;
  if (biens.length > 0 && process.env.ANTHROPIC_API_KEY) {
    try {
      const mandatsResume = analyses.map(a =>
        `- ${a.bien.type} ${a.bien.ville} ${a.bien.prix?.toLocaleString('fr-FR') ?? '?'}€: score liquidité ${a.liquidite?.score ?? '?'}/100 (${a.liquidite?.tendance ?? 'stable'}), priorité ${a.analyse.priorite}`
      ).join('\n');

      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: `Tu es un conseiller en stratégie immobilière. Génère un résumé exécutif du portefeuille de cet agent en 3 phrases max. Sois direct et actionnable.

PORTEFEUILLE (${biens.length} mandats) :
${mandatsResume}

Alertes actives : ${alertes.length}

Résumé exécutif (texte simple, pas de JSON) :`,
          }],
        }),
      });
      const aiData = await aiRes.json();
      resumeGlobal = aiData.content?.[0]?.text || null;
    } catch (e) {
      console.warn('[AnalysePortefeuille] Résumé global IA échec:', e.message);
    }
  }

  // 4. Sauvegarder l'analyse en base
  await supabaseAdmin.from('analyses_portefeuille').upsert({
    agent_email: agentEmail,
    nb_mandats: biens.length,
    nb_alertes: alertes.length,
    resume_global: resumeGlobal,
    analyses: analyses.map(a => ({
      bien_id: a.bien.id,
      bien_reference: a.bien.reference,
      ville: a.bien.ville,
      liquidite_score: a.liquidite?.score,
      liquidite_label: a.liquidite?.label,
      tendance: a.liquidite?.tendance,
      conseil: a.analyse.conseil,
      priorite: a.analyse.priorite,
      action: a.analyse.action,
      alerte: a.analyse.alerte,
    })),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'agent_email' });

  // 5. Email d'alerte si demandé et alertes présentes
  if (sendEmail && alertes.length > 0) {
    await envoyerAlerteEmail(agentEmail, alertes);
  }

  return {
    nbMandats: biens.length,
    nbAlertes: alertes.length,
    resumeGlobal,
    analyses: analyses.map(a => ({
      bien: { id: a.bien.id, reference: a.bien.reference, type: a.bien.type, ville: a.bien.ville, prix: a.bien.prix, surface: a.bien.surface, statut: a.bien.statut },
      liquidite: a.liquidite,
      analyse: a.analyse,
    })),
    alertes: alertes.map(a => ({
      bien: { id: a.bien.id, reference: a.bien.reference, type: a.bien.type, ville: a.bien.ville, prix: a.bien.prix },
      analyse: a.analyse,
    })),
  };
}

/*
── TABLE SUPABASE À CRÉER ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analyses_portefeuille (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_email TEXT NOT NULL UNIQUE,
  nb_mandats INTEGER DEFAULT 0,
  nb_alertes INTEGER DEFAULT 0,
  resume_global TEXT,
  analyses JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_analyses_agent ON analyses_portefeuille(agent_email);

── CRON VERCEL (vercel.json) ────────────────────────────────────────────────────
{
  "crons": [
    { "path": "/api/immobilier/analyse-portefeuille", "schedule": "0 8 * * *" }
  ]
}
Le cron appelle avec Authorization: Bearer CRON_SECRET
──────────────────────────────────────────────────────────────────────────────
*/
