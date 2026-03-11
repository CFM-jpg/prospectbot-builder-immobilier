// pages/api/scraper/vendeurs-potentiels.js
// Identifie les propriétaires susceptibles de vendre via les données DVF
// Logique : biens achetés il y a 7-15 ans → plus-value estimée → score motivation vendeur
// Source : DVF Etalab + API Adresse + prix marché actuel (base INSEE)

import { supabaseAdmin } from '../../../lib/supabase';
import { getSession } from '../../../lib/auth';

const FETCH_TIMEOUT_MS = 15000;

// ─── Prix marché actuel par ville (INSEE 2024) ─────────────────────────────────
// Utilisé pour calculer la plus-value estimée

const PRIX_MARCHE = {
  paris: { appart: 9750, maison: 11200 }, lyon: { appart: 4850, maison: 5600 },
  marseille: { appart: 3180, maison: 3750 }, toulouse: { appart: 3420, maison: 3980 },
  bordeaux: { appart: 4380, maison: 5020 }, nantes: { appart: 3850, maison: 4420 },
  nice: { appart: 4920, maison: 6100 }, montpellier: { appart: 3680, maison: 4150 },
  strasbourg: { appart: 3420, maison: 3980 }, rennes: { appart: 3890, maison: 4480 },
  lille: { appart: 3280, maison: 3840 }, grenoble: { appart: 2850, maison: 3400 },
  reims: { appart: 2380, maison: 2840 }, toulon: { appart: 2940, maison: 3680 },
  dijon: { appart: 2620, maison: 3180 }, angers: { appart: 2980, maison: 3520 },
  aix_en_provence: { appart: 4820, maison: 6200 },
  blagnac: { appart: 3180, maison: 3820 },
  tournefeuille: { appart: 2980, maison: 3560 },
  colomiers: { appart: 2840, maison: 3380 },
};

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Non authentifié' });
  const agentEmail = session.email;

  const {
    ville = 'toulouse',
    type = 'all', // 'appartement' | 'maison' | 'all'
    anneeMin = new Date().getFullYear() - 15,
    anneeMax = new Date().getFullYear() - 7,
    surfaceMin = 0,
    plusValueMin = 0, // % minimum de plus-value estimée
    scoreMin = 30,    // score motivation minimum
    limit = 50,
  } = req.body;

  try {
    // ── 1. Résoudre ville → code INSEE ────────────────────────────────────────
    const codeCommune = await resolveCodeCommune(String(ville).trim().toLowerCase());
    if (!codeCommune) {
      return res.status(400).json({ success: false, error: `Ville introuvable : "${ville}"` });
    }

    // ── 2. Cache Supabase 6h ──────────────────────────────────────────────────
    const cacheKey = `vendeurs-${codeCommune}-${type}-${anneeMin}-${anneeMax}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.status(200).json({ ...cached, fromCache: true });

    // ── 3. Récupérer les transactions DVF de la période cible ─────────────────
    const transactions = await fetchTransactionsDVF(codeCommune, ville, type, anneeMin, anneeMax);

    // ── 4. Prix marché actuel pour la ville ───────────────────────────────────
    const villeKey = normaliserVille(ville);
    const prixRef = PRIX_MARCHE[villeKey] || null;

    // ── 5. Calcul score + filtrage ────────────────────────────────────────────
    const vendeurs = [];
    const anneeActuelle = new Date().getFullYear();

    for (const t of transactions) {
      const prixAchat = parseFloat(t.valeur_fonciere);
      const surface = parseFloat(t.surface_reelle_bati);
      if (!prixAchat || prixAchat < 10000 || !surface || surface < 10) continue;
      if (surfaceMin > 0 && surface < surfaceMin) continue;

      const dateAchat = t.date_mutation ? new Date(t.date_mutation) : null;
      if (!dateAchat) continue;
      const anneeAchat = dateAchat.getFullYear();
      const anciennete = anneeActuelle - anneeAchat;
      if (anciennete < 1) continue;

      const typeLocal = t.type_local || '';
      const typeNorm = typeLocal.toLowerCase().includes('maison') ? 'maison' : 'appartement';

      // Prix marché actuel pour ce type
      const prixM2Actuel = prixRef ? (typeNorm === 'maison' ? prixRef.maison : prixRef.appart) : null;
      const valeurActuelle = prixM2Actuel ? Math.round(prixM2Actuel * surface) : null;
      const plusValueEuros = valeurActuelle ? valeurActuelle - prixAchat : null;
      const plusValuePct = plusValueEuros ? Math.round((plusValueEuros / prixAchat) * 100) : null;

      // Filtre plus-value minimum
      if (plusValueMin > 0 && (plusValuePct === null || plusValuePct < plusValueMin)) continue;

      // ── Score de motivation vendeur (0-100) ────────────────────────────────
      let score = 0;
      let raisons = [];

      // Ancienneté (0-40 pts) — pic à 10 ans, décroît après 15 ans
      if (anciennete >= 7 && anciennete <= 10) { score += 40; raisons.push(`Acheté il y a ${anciennete} ans — fenêtre idéale`); }
      else if (anciennete > 10 && anciennete <= 15) { score += 32; raisons.push(`Acheté il y a ${anciennete} ans — bien mûr`); }
      else if (anciennete > 15 && anciennete <= 20) { score += 20; raisons.push(`Acheté il y a ${anciennete} ans`); }
      else if (anciennete > 20) { score += 12; raisons.push(`Propriété ancienne (${anciennete} ans)`); }
      else { score += 5; } // < 7 ans

      // Plus-value (0-30 pts)
      if (plusValuePct !== null) {
        if (plusValuePct >= 40) { score += 30; raisons.push(`+${plusValuePct}% de plus-value estimée — très incitatif`); }
        else if (plusValuePct >= 25) { score += 22; raisons.push(`+${plusValuePct}% de plus-value — attractif`); }
        else if (plusValuePct >= 15) { score += 14; raisons.push(`+${plusValuePct}% de plus-value`); }
        else if (plusValuePct >= 0) { score += 6; }
        else { raisons.push('Marché en baisse sur la période'); }
      }

      // Surface > 80m² = famille, souvent en mobilité (0-20 pts)
      if (surface >= 120) { score += 20; raisons.push(`Grande surface (${Math.round(surface)}m²) — profil familial mobile`); }
      else if (surface >= 80) { score += 14; raisons.push(`Surface familiale (${Math.round(surface)}m²)`); }
      else if (surface >= 60) { score += 8; }

      // Prix d'achat DVF connu avec précision (0-10 pts)
      if (t.id_mutation && prixAchat > 50000) { score += 10; raisons.push('Transaction DVF officielle — valorisation fiable'); }

      // Filtre score minimum
      if (score < scoreMin) continue;

      // ── Construction adresse lisible ───────────────────────────────────────
      const adresse = [t.no_voie, t.type_voie, t.voie].filter(Boolean).join(' ');
      const villeNom = t.nom_commune ? capitaliser(t.nom_commune) : capitaliser(ville);
      const cp = t.code_postal || '';

      // Nom probable du propriétaire via DVF (champ vendeur si dispo, sinon prénom_vendeur_1)
      // DVF expose : nom_1_vendeur, prenom_1_vendeur (quand personne physique)
      const nomVendeur = [t.prenom_1_vendeur, t.nom_1_vendeur].filter(Boolean).join(' ') || null;

      vendeurs.push({
        id: t.id_mutation || `${adresse}-${anneeAchat}`,
        adresse: adresse || 'Adresse non renseignée',
        ville: villeNom,
        codePostal: cp,
        type: typeNorm,
        surface: Math.round(surface),
        pieces: t.nombre_pieces_principales || null,
        // Acquisition
        dateAchat: dateAchat.toISOString().slice(0, 10),
        anneeAchat,
        anciennete,
        prixAchat: Math.round(prixAchat),
        prixAchatM2: Math.round(prixAchat / surface),
        // Valeur actuelle estimée
        prixM2Actuel,
        valeurActuelle,
        plusValueEuros,
        plusValuePct,
        // Propriétaire
        nomProprietaire: nomVendeur,
        // Score
        scoreMotivation: Math.min(score, 100),
        niveauMotivation: score >= 70 ? 'Fort' : score >= 50 ? 'Moyen' : 'Faible',
        raisons,
        // Action
        statut: 'a_prospecter',
      });
    }

    // Trier par score décroissant
    vendeurs.sort((a, b) => b.scoreMotivation - a.scoreMotivation);
    const top = vendeurs.slice(0, parseInt(limit));

    // ── 6. Stats globales ─────────────────────────────────────────────────────
    const stats = {
      total: top.length,
      scoreMoyen: top.length ? Math.round(top.reduce((s, v) => s + v.scoreMotivation, 0) / top.length) : 0,
      plusValueMoyennePct: top.filter(v => v.plusValuePct !== null).length
        ? Math.round(top.filter(v => v.plusValuePct !== null).reduce((s, v) => s + v.plusValuePct, 0) / top.filter(v => v.plusValuePct !== null).length)
        : null,
      ancienneteMoyenne: top.length ? Math.round(top.reduce((s, v) => s + v.anciennete, 0) / top.length) : 0,
      forts: top.filter(v => v.scoreMotivation >= 70).length,
      moyens: top.filter(v => v.scoreMotivation >= 50 && v.scoreMotivation < 70).length,
      faibles: top.filter(v => v.scoreMotivation < 50).length,
      prixM2Actuel: prixRef ? (type === 'maison' ? prixRef.maison : type === 'all' ? Math.round((prixRef.appart + prixRef.maison) / 2) : prixRef.appart) : null,
    };

    const reponse = {
      success: true,
      ville: top[0]?.ville || capitaliser(ville),
      villeKey,
      type,
      filtres: { anneeMin, anneeMax, surfaceMin, plusValueMin, scoreMin },
      stats,
      vendeurs: top,
      sourcesDonnees: ['DVF Etalab (Ministère des Finances)', 'API Adresse data.gouv.fr', 'Base de référence prix INSEE 2024'],
      dateAnalyse: new Date().toISOString(),
    };

    // ── 7. Cache + log ────────────────────────────────────────────────────────
    await setCache(cacheKey, capitaliser(ville), reponse);

    try {
      await supabaseAdmin.from('scraper_logs').insert([{
        source: 'vendeurs-potentiels',
        agent_email: agentEmail,
        date: new Date().toISOString(),
        parametres: { ville, type, anneeMin, anneeMax },
        resultat: { totalVendeurs: top.length, scoreMoyen: stats.scoreMoyen },
      }]);
    } catch {}

    return res.status(200).json(reponse);

  } catch (error) {
    console.error('[Vendeurs] Erreur:', error.message);
    return res.status(500).json({ success: false, error: `Erreur : ${error.message}` });
  }
}

// ─── Fetch DVF sur la période cible ───────────────────────────────────────────

async function fetchTransactionsDVF(codeCommune, ville, type, anneeMin, anneeMax) {
  const deptMap = { '75056': '75', '69123': '69', '13055': '13' };
  const useDept = !!deptMap[codeCommune];
  const deptCode = deptMap[codeCommune];

  const typesLocaux = type === 'all' ? ['Appartement', 'Maison'] : [type === 'maison' ? 'Maison' : 'Appartement'];
  const dateDebut = `${anneeMin}-01-01`;
  const dateFin = `${anneeMax}-12-31`;

  const errors = [];

  // Endpoint 1 — Etalab OData
  try {
    const results = [];
    for (const tl of typesLocaux) {
      const filterParts = [
        `nature_mutation eq 'Vente'`,
        `type_local eq '${tl}'`,
        `date_mutation ge ${dateDebut}`,
        `date_mutation le ${dateFin}`,
        useDept ? `startswith(code_commune,'${deptCode}')` : `code_commune eq '${codeCommune}'`,
      ];
      const url = `https://api.dvf.etalab.gouv.fr/api/odata/v1/Ventes?${new URLSearchParams({
        '$filter': filterParts.join(' and '),
        '$top': '200',
        '$orderby': 'date_mutation desc',
        '$select': 'id_mutation,date_mutation,valeur_fonciere,type_local,surface_reelle_bati,nombre_pieces_principales,no_voie,type_voie,voie,code_postal,nom_commune,code_commune,nom_1_vendeur,prenom_1_vendeur,nombre_lots',
      })}`;
      const res = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      results.push(...(data.value || []).filter(t => t.type_local === tl));
    }
    if (results.length > 0) return results;
    errors.push('etalab: 0 résultats');
  } catch (e) { errors.push(`etalab: ${e.message}`); }

  // Endpoint 2 — data.economie.gouv.fr
  try {
    const results = [];
    for (const tl of typesLocaux) {
      const where = [
        useDept ? `startswith(code_commune, '${deptCode}')` : `code_commune="${codeCommune}"`,
        `type_local="${tl}"`,
        `date_mutation>="${dateDebut}"`,
        `date_mutation<="${dateFin}"`,
      ].join(' and ');
      const url = `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/dvf-plus-open-data-immo/records?${new URLSearchParams({
        limit: '200',
        where,
        select: 'id_mutation,date_mutation,valeur_fonciere,type_local,surface_reelle_bati,nombre_pieces_principales,no_voie,type_voie,voie,code_postal,nom_commune,code_commune,nombre_lots',
        order_by: 'date_mutation DESC',
      })}`;
      const res = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      results.push(...(data.results || []));
    }
    if (results.length > 0) return results;
    errors.push('economie.gouv: 0 résultats');
  } catch (e) { errors.push(`economie.gouv: ${e.message}`); }

  // Endpoint 3 — cquest (sans filtre date, on filtre après)
  try {
    const results = [];
    for (const tl of typesLocaux) {
      const pk = useDept ? 'code_departement' : 'code_commune';
      const pv = useDept ? deptCode : codeCommune;
      const url = `https://api.cquest.org/dvf?${pk}=${pv}&nature_mutation=Vente&limit=300`;
      const res = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const filtered = (data.resultats || []).filter(t => {
        if (t.type_local && t.type_local !== tl) return false;
        const year = t.date_mutation ? new Date(t.date_mutation).getFullYear() : null;
        return year && year >= anneeMin && year <= anneeMax;
      });
      results.push(...filtered);
    }
    if (results.length > 0) return results;
    errors.push('cquest: 0 résultats');
  } catch (e) { errors.push(`cquest: ${e.message}`); }

  // Aucun résultat — retourner tableau vide plutôt qu'erreur
  console.warn('[Vendeurs] Aucune transaction trouvée:', errors.join(' | '));
  return [];
}

// ─── Cache Supabase 6h ────────────────────────────────────────────────────────

async function getCache(cacheKey) {
  try {
    const cutoff = new Date(Date.now() - 6 * 3600 * 1000).toISOString();
    const { data } = await supabaseAdmin
      .from('dvf_cache')
      .select('resultats')
      .eq('cache_key', cacheKey)
      .gte('cached_at', cutoff)
      .maybeSingle();
    return data?.resultats || null;
  } catch { return null; }
}

async function setCache(cacheKey, ville, resultats) {
  try {
    await supabaseAdmin.from('dvf_cache').upsert([{
      cache_key: cacheKey, ville, resultats,
      cached_at: new Date().toISOString(),
    }], { onConflict: 'cache_key' });
  } catch {}
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function fetchWithTimeout(url, ms) {
  return fetch(url, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'ProspectBot/1.0' },
    signal: AbortSignal.timeout(ms),
  });
}

async function resolveCodeCommune(ville) {
  const CODES = {
    paris: '75056', lyon: '69123', marseille: '13055', toulouse: '31555',
    nice: '06088', nantes: '44109', montpellier: '34172', strasbourg: '67482',
    bordeaux: '33063', lille: '59350', rennes: '35238', reims: '51454',
    toulon: '83137', grenoble: '38185', dijon: '21231', angers: '49007',
    aix_en_provence: '13001', blagnac: '31069', tournefeuille: '31557', colomiers: '31149',
  };
  const key = ville.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  if (CODES[key]) return CODES[key];
  try {
    const res = await fetchWithTimeout(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(ville)}&type=municipality&limit=1`, 6000);
    const data = await res.json();
    return data.features?.[0]?.properties?.citycode || null;
  } catch { return null; }
}

function normaliserVille(v) {
  return v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[-\s]+/g, '_').replace(/[^a-z0-9_]/g, '').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

function capitaliser(s) {
  return String(s).charAt(0).toUpperCase() + String(s).slice(1).toLowerCase();
}
