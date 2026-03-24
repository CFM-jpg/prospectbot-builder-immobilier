// pages/api/immobilier/rapport-pdf.js
// Génère un rapport marché PDF brandé pour un prospect
// Moteur choisi par le client : ?engine=pdflib (défaut, léger) ou ?engine=puppeteer (beau)
// Retourne le PDF en binaire (application/pdf)

import { supabaseAdmin } from '../../../lib/supabase';
import { getSession } from '../../../lib/auth';

// ─── Génération HTML du rapport (utilisé par les deux moteurs) ────────────────
function buildReportHTML({ agent, zone, dvf, liquidite, rapport }) {
  const { score, label, couleur, conseil, details } = liquidite;
  const couleurHex = { green: '#16a34a', blue: '#2563eb', orange: '#ea580c', red: '#dc2626' }[couleur] || '#6b7280';

  const prixM2 = dvf.prixMoyenM2 ? `${Math.round(dvf.prixMoyenM2).toLocaleString('fr-FR')} €/m²` : 'N/A';
  const prixMin = dvf.prixMin ? `${Math.round(dvf.prixMin / 1000)}k€` : 'N/A';
  const prixMax = dvf.prixMax ? `${Math.round(dvf.prixMax / 1000)}k€` : 'N/A';
  const nbTx = dvf.nbTransactions || details?.nbTransactionsAnalysees || 0;
  const delai = details?.delaiMoyenJours ? `~${details.delaiMoyenJours} jours` : 'N/A';
  const volumeTrim = details?.volumeMoyenTrimestriel || 0;

  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #fff; color: #111; font-size: 13px; }

  .page { width: 210mm; min-height: 297mm; padding: 12mm 14mm; }

  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #d4a853; padding-bottom: 10px; margin-bottom: 20px; }
  .brand { font-size: 22px; color: #d4a853; font-style: italic; font-weight: 700; letter-spacing: 1px; }
  .brand-sub { font-size: 10px; color: #888; margin-top: 2px; }
  .header-right { text-align: right; font-size: 10px; color: #666; line-height: 1.6; }

  /* Title block */
  .title-block { background: #0f0f11; color: #fff; border-radius: 10px; padding: 18px 22px; margin-bottom: 20px; }
  .title-block h1 { font-size: 20px; font-weight: 300; letter-spacing: -0.3px; margin-bottom: 4px; }
  .title-block p { font-size: 11px; color: rgba(255,255,255,0.5); }
  .zone-tag { display: inline-block; background: rgba(212,168,83,0.15); border: 1px solid rgba(212,168,83,0.4); color: #d4a853; border-radius: 6px; padding: 3px 10px; font-size: 11px; margin-top: 8px; }

  /* Score card */
  .score-section { display: flex; gap: 14px; margin-bottom: 20px; }
  .score-card { flex: 0 0 160px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; text-align: center; }
  .score-number { font-size: 52px; font-weight: 700; line-height: 1; color: ${couleurHex}; }
  .score-label { font-size: 11px; font-weight: 600; color: ${couleurHex}; margin-top: 4px; }
  .score-sub { font-size: 10px; color: #888; margin-top: 2px; }
  .score-desc { flex: 1; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; }
  .score-desc h3 { font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 8px; }
  .score-desc p { font-size: 11px; color: #4b5563; line-height: 1.6; }

  /* Stats grid */
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
  .stat-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; text-align: center; }
  .stat-value { font-size: 20px; font-weight: 700; color: #111; }
  .stat-label { font-size: 10px; color: #6b7280; margin-top: 2px; }

  /* Sections */
  .section { margin-bottom: 20px; }
  .section-title { font-size: 12px; font-weight: 600; color: #374151; border-left: 3px solid #d4a853; padding-left: 8px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }

  /* Conseil IA */
  .conseil-box { background: linear-gradient(135deg, #fffbeb, #fef3c7); border: 1px solid #fcd34d; border-radius: 8px; padding: 14px 16px; }
  .conseil-box .icon { font-size: 16px; margin-bottom: 6px; }
  .conseil-box p { font-size: 11px; color: #92400e; line-height: 1.7; }

  /* Argumentaire */
  .arg-list { list-style: none; }
  .arg-list li { font-size: 11px; color: #374151; padding: 6px 0; border-bottom: 1px solid #f3f4f6; padding-left: 16px; position: relative; line-height: 1.5; }
  .arg-list li:before { content: '→'; position: absolute; left: 0; color: #d4a853; font-weight: 700; }
  .arg-list li:last-child { border-bottom: none; }

  /* Signature agent */
  .agent-card { background: #0f0f11; color: #fff; border-radius: 10px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; margin-top: 24px; }
  .agent-info h3 { font-size: 14px; font-weight: 600; color: #d4a853; }
  .agent-info p { font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 2px; }
  .agent-contact { text-align: right; font-size: 10px; color: rgba(255,255,255,0.6); line-height: 1.8; }

  /* Footer */
  .footer { margin-top: 16px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 9px; color: #9ca3af; display: flex; justify-content: space-between; }

  /* Trend bar */
  .trend-bar { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin-top: 6px; }
  .trend-fill { height: 100%; background: ${couleurHex}; border-radius: 4px; width: ${score ?? 0}%; }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div>
      <div class="brand">ProspectBot</div>
      <div class="brand-sub">Analyse de marché immobilier</div>
    </div>
    <div class="header-right">
      <div>Rapport confidentiel</div>
      <div>Généré le ${today}</div>
      <div>Données DVF officielles</div>
    </div>
  </div>

  <!-- Title -->
  <div class="title-block">
    <h1>Analyse de marché</h1>
    <p>Rapport personnalisé basé sur les transactions officielles DVF</p>
    <div class="zone-tag">📍 ${zone.ville}${zone.codePostal ? ` (${zone.codePostal})` : ''}</div>
  </div>

  <!-- Score liquidité -->
  <div class="score-section">
    <div class="score-card">
      <div class="score-number">${score ?? '—'}</div>
      <div class="score-label">${label}</div>
      <div class="score-sub">Score liquidité /100</div>
      <div class="trend-bar"><div class="trend-fill"></div></div>
    </div>
    <div class="score-desc">
      <h3>Interprétation du score</h3>
      <p>${conseil || 'Analyse basée sur les transactions DVF officielles de la zone.'}</p>
    </div>
  </div>

  <!-- Stats clés -->
  <div class="stats-grid">
    <div class="stat-box">
      <div class="stat-value">${prixM2}</div>
      <div class="stat-label">Prix moyen m²</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${prixMin} – ${prixMax}</div>
      <div class="stat-label">Fourchette de prix</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${volumeTrim}</div>
      <div class="stat-label">Transactions / trimestre</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${delai}</div>
      <div class="stat-label">Délai moyen estimé</div>
    </div>
  </div>

  <!-- Conseil IA -->
  <div class="section">
    <div class="section-title">Analyse IA du marché</div>
    <div class="conseil-box">
      <div class="icon">💡</div>
      <p>${rapport?.analyseIA || conseil || 'Ce secteur présente une dynamique de marché notable. Contactez votre agent pour une analyse personnalisée.'}</p>
    </div>
  </div>

  <!-- Argumentaire vendeur -->
  <div class="section">
    <div class="section-title">Argumentaire pour votre prospect</div>
    <ul class="arg-list">
      ${(rapport?.arguments || [
        `Le marché de ${zone.ville} enregistre en moyenne ${volumeTrim} transactions par trimestre, confirmant une demande soutenue.`,
        `Le prix moyen au m² s'établit à ${prixM2}, permettant d'estimer précisément la valeur de votre bien.`,
        `Le score de liquidité de ${score ?? '?'}/100 indique que ${label.toLowerCase()} — les conditions sont favorables pour vendre.`,
        `Les données officielles DVF (Direction des Finances Publiques) garantissent la fiabilité de cette analyse.`,
      ]).map(a => `<li>${a}</li>`).join('')}
    </ul>
  </div>

  <!-- Signature agent -->
  <div class="agent-card">
    <div class="agent-info">
      <h3>${agent.name || 'Votre agent immobilier'}</h3>
      <p>Agent immobilier certifié · ProspectBot</p>
    </div>
    <div class="agent-contact">
      <div>${agent.email}</div>
      ${agent.telephone ? `<div>${agent.telephone}</div>` : ''}
      ${agent.agence ? `<div>${agent.agence}</div>` : ''}
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <span>Source : Données DVF — Direction Générale des Finances Publiques · Etalab</span>
    <span>ProspectBot © ${new Date().getFullYear()} · Rapport confidentiel</span>
  </div>

</div>
</body>
</html>`;
}

// ─── Moteur pdf-lib ───────────────────────────────────────────────────────────
// Génération légère sans Chrome — structure simple mais propre
async function generateWithPdfLib(htmlContent) {
  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Note : pdf-lib ne rend pas HTML — on extrait les données du HTML et on les dessine
  // Pour un vrai rendu HTML→PDF, utiliser puppeteer (engine=puppeteer)
  // Ici on génère un PDF structuré avec les données

  page.drawText('Rapport non disponible en mode pdf-lib basique.', {
    x: 50, y: 800, size: 12, font, color: rgb(0, 0, 0),
  });
  page.drawText('Utilisez engine=puppeteer pour le rendu complet.', {
    x: 50, y: 780, size: 10, font, color: rgb(0.4, 0.4, 0.4),
  });

  return await pdfDoc.save();
}

// ─── Moteur Puppeteer ─────────────────────────────────────────────────────────
async function generateWithPuppeteer(htmlContent) {
  // Utilise PDFShift — pas de Puppeteer/Chromium, fonctionne sur Vercel
  const apiKey = process.env.PDFSHIFT_API_KEY;
  if (!apiKey) throw new Error("PDFSHIFT_API_KEY manquante dans les variables d'environnement Vercel");

  const response = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({
      source: htmlContent,
      format: 'A4',
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
      disable_backgrounds: false,
      landscape: false,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error('PDFShift erreur ' + response.status + ' : ' + err);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ─── Handler principal ────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Non authentifié' });

  const {
    engine = 'puppeteer',   // 'puppeteer' | 'pdflib'
    zone,                   // { ville, codePostal, codeCommune }
    liquidite,              // résultat de /api/immobilier/liquidite
    dvf,                    // { prixMoyenM2, prixMin, prixMax, nbTransactions }
    rapport,                // { analyseIA, arguments[] } — optionnel, généré par Claude si absent
    agentData,              // override agent info (téléphone, agence, etc.)
  } = req.body;

  if (!zone?.ville) {
    return res.status(400).json({ error: 'zone.ville requis' });
  }

  if (!liquidite) {
    return res.status(400).json({ error: 'Données de liquidité requises (appelez /api/immobilier/liquidite d\'abord)' });
  }

  try {
    // Récupérer infos agent
    const { data: agentDB } = await supabaseAdmin
      .from('agents')
      .select('name, email, telephone, agence')
      .eq('email', session.email)
      .single();

    const agent = { ...agentDB, ...agentData };

    // Générer l'analyse IA si pas fournie
    let rapportFinal = rapport;
    if (!rapportFinal?.analyseIA && process.env.ANTHROPIC_API_KEY) {
      try {
        const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 600,
            system: 'Tu es un expert en analyse de marché immobilier. Génère des analyses concises et percutantes pour des agents immobiliers. Réponds en JSON uniquement, sans markdown.',
            messages: [{
              role: 'user',
              content: `Génère une analyse de marché pour un rapport PDF destiné à un prospect vendeur.

Zone : ${zone.ville}
Score liquidité : ${liquidite.score}/100 — ${liquidite.label}
Prix moyen m² : ${dvf?.prixMoyenM2 ? Math.round(dvf.prixMoyenM2) + ' €/m²' : 'N/A'}
Volume trimestriel : ${liquidite.details?.volumeMoyenTrimestriel || 0} transactions
Délai estimé : ${liquidite.details?.delaiMoyenJours || '?'} jours

Réponds UNIQUEMENT avec ce JSON :
{
  "analyseIA": "<paragraphe percutant 3-4 phrases pour convaincre le vendeur>",
  "arguments": ["<argument 1>", "<argument 2>", "<argument 3>", "<argument 4>"]
}`,
            }],
          }),
        });
        const aiData = await aiRes.json();
        const text = aiData.content?.[0]?.text || '';
        rapportFinal = JSON.parse(text.replace(/```json|```/g, '').trim());
      } catch (e) {
        console.warn('[RapportPDF] IA fallback:', e.message);
      }
    }

    // Construire le HTML
    const html = buildReportHTML({ agent, zone, dvf: dvf || {}, liquidite, rapport: rapportFinal });

    // Générer le PDF selon le moteur choisi
    let pdfBuffer;
    if (engine === 'pdflib') {
      pdfBuffer = await generateWithPdfLib(html);
    } else {
      pdfBuffer = await generateWithPuppeteer(html);
    }

    // Option : sauvegarder dans Supabase Storage et retourner une URL signée
    const saveToStorage = req.body.saveToStorage === true;
    if (saveToStorage) {
      const safeEmail = session.email.replace(/[^a-zA-Z0-9]/g, '_');
      const safeVille = zone.ville.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `rapports/${safeEmail}/${safeVille}_${Date.now()}.pdf`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('rapports-marche')
        .upload(filename, pdfBuffer, { contentType: 'application/pdf', upsert: true });

      if (uploadError) {
        return res.status(500).json({ success: false, error: `Erreur upload Storage : ${uploadError.message}` });
      }

      const { data: signedUrl } = await supabaseAdmin.storage
        .from('rapports-marche')
        .createSignedUrl(filename, 60 * 60 * 24 * 7); // 7 jours

      return res.status(200).json({
        success: true,
        url: signedUrl?.signedUrl,
        filename,
      });
    }

    // Retourner le PDF directement
    const ville = zone.ville.replace(/\s+/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="rapport_marche_${ville}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.status(200).send(Buffer.from(pdfBuffer));

  } catch (error) {
    console.error('[RapportPDF] Erreur:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/*
── SUPABASE STORAGE À CRÉER ────────────────────────────────────────────────────
-- Créer un bucket "rapports-marche" dans Supabase Storage (mode privé)
-- Les URLs signées durent 7 jours

── PACKAGES REQUIS ─────────────────────────────────────────────────────────────
npm i pdf-lib
npm i puppeteer-core @sparticuz/chromium  ← seulement si engine=puppeteer

── VARIABLES ENV ────────────────────────────────────────────────────────────────
ANTHROPIC_API_KEY=...  (déjà configurée)
──────────────────────────────────────────────────────────────────────────────
*/
