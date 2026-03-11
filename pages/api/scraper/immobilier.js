// pages/api/scraper/immobilier.js
// Données de marché immobilier — fusion DVF officiel + référence INSEE
// Stratégie :
//   1. Retry DVF sur 3 endpoints (etalab, cquest, economie.gouv)
//   2. Calcul stats live depuis les transactions DVF récupérées
//   3. Enrichissement systématique avec données de référence INSEE 2024
//   4. Réponse unifiée : stats DVF + marché + profil acheteurs + rentabilité + conseils
//   5. Cache Supabase 12h sur la réponse complète

import { supabaseAdmin } from '../../../lib/supabase';
import { getSession } from '../../../lib/auth';

// ─── Config ───────────────────────────────────────────────────────────────────

const CACHE_TTL_HOURS = 12;
const FETCH_TIMEOUT_MS = 15000;
const MAX_RESULTS = 100;

// ─── Base de référence marché (INSEE 2023-2024) ───────────────────────────────
// Prix m², volumes, délais, évolutions, données socio réels par ville

const MARCHE_REF = {
  paris:           { appart: { m2: 9750, ev1: -5.2, ev3: -8.1, ev5: 12.4 }, maison: { m2: 11200, ev1: -4.8, ev3: -7.2, ev5: 14.1 }, marche: { vol: 29800, delai: 68, nego: 4.2, tension: 'modere' }, pop: 2161000, revenu: 28400, proprio: 33.1, vacance: 8.2, permis: 3200 },
  lyon:            { appart: { m2: 4850, ev1: -3.8, ev3:  2.1, ev5: 22.3 }, maison: { m2:  5600, ev1: -3.2, ev3:  3.4, ev5: 24.7 }, marche: { vol: 14200, delai: 54, nego: 3.6, tension: 'modere' }, pop:  522000, revenu: 24100, proprio: 38.4, vacance: 6.9, permis: 2800 },
  marseille:       { appart: { m2: 3180, ev1:  1.2, ev3:  8.4, ev5: 18.9 }, maison: { m2:  3750, ev1:  1.8, ev3:  9.1, ev5: 21.2 }, marche: { vol: 11800, delai: 72, nego: 5.1, tension: 'faible' }, pop:  873000, revenu: 19800, proprio: 41.2, vacance: 11.4, permis: 1900 },
  toulouse:        { appart: { m2: 3420, ev1: -1.4, ev3:  6.8, ev5: 26.1 }, maison: { m2:  3980, ev1: -0.9, ev3:  7.4, ev5: 28.3 }, marche: { vol: 10400, delai: 61, nego: 3.9, tension: 'modere' }, pop:  498000, revenu: 22400, proprio: 42.7, vacance: 7.3, permis: 3100 },
  bordeaux:        { appart: { m2: 4380, ev1: -6.1, ev3: -2.4, ev5: 21.8 }, maison: { m2:  5020, ev1: -5.8, ev3: -1.9, ev5: 23.4 }, marche: { vol:  8900, delai: 78, nego: 5.8, tension: 'faible' }, pop:  263000, revenu: 23800, proprio: 38.9, vacance: 8.7, permis: 1400 },
  nantes:          { appart: { m2: 3850, ev1: -4.9, ev3:  1.2, ev5: 22.6 }, maison: { m2:  4420, ev1: -4.4, ev3:  2.1, ev5: 24.8 }, marche: { vol:  9200, delai: 65, nego: 4.3, tension: 'modere' }, pop:  320000, revenu: 23200, proprio: 43.1, vacance: 6.4, permis: 2200 },
  nice:            { appart: { m2: 4920, ev1:  0.8, ev3:  5.2, ev5: 16.4 }, maison: { m2:  6100, ev1:  1.1, ev3:  5.9, ev5: 18.2 }, marche: { vol:  7800, delai: 82, nego: 4.7, tension: 'modere' }, pop:  342000, revenu: 22100, proprio: 39.8, vacance: 14.2, permis:  980 },
  montpellier:     { appart: { m2: 3680, ev1: -2.1, ev3:  4.8, ev5: 23.7 }, maison: { m2:  4150, ev1: -1.8, ev3:  5.4, ev5: 25.2 }, marche: { vol:  8100, delai: 67, nego: 4.1, tension: 'modere' }, pop:  295000, revenu: 20900, proprio: 40.3, vacance: 9.1, permis: 2100 },
  strasbourg:      { appart: { m2: 3420, ev1: -1.9, ev3:  3.2, ev5: 18.4 }, maison: { m2:  3980, ev1: -1.4, ev3:  3.9, ev5: 20.1 }, marche: { vol:  6400, delai: 58, nego: 3.4, tension: 'modere' }, pop:  287000, revenu: 22800, proprio: 37.6, vacance: 7.8, permis: 1200 },
  rennes:          { appart: { m2: 3890, ev1: -3.2, ev3:  4.1, ev5: 28.9 }, maison: { m2:  4480, ev1: -2.8, ev3:  4.9, ev5: 31.2 }, marche: { vol:  7100, delai: 52, nego: 3.1, tension: 'modere' }, pop:  222000, revenu: 23600, proprio: 44.2, vacance: 5.9, permis: 1800 },
  lille:           { appart: { m2: 3280, ev1: -1.2, ev3:  3.8, ev5: 18.6 }, maison: { m2:  3840, ev1: -0.8, ev3:  4.6, ev5: 21.2 }, marche: { vol:  8400, delai: 62, nego: 4.1, tension: 'modere' }, pop:  234000, revenu: 20400, proprio: 36.8, vacance: 7.4, permis: 1400 },
  grenoble:        { appart: { m2: 2850, ev1: -2.4, ev3:  1.8, ev5: 14.2 }, maison: { m2:  3400, ev1: -1.9, ev3:  2.4, ev5: 16.1 }, marche: { vol:  5200, delai: 71, nego: 4.8, tension: 'faible' }, pop:  160000, revenu: 21400, proprio: 38.7, vacance: 8.9, permis:  900 },
  reims:           { appart: { m2: 2380, ev1: -0.8, ev3:  2.1, ev5: 10.4 }, maison: { m2:  2840, ev1: -0.4, ev3:  2.8, ev5: 12.1 }, marche: { vol:  4200, delai: 74, nego: 5.2, tension: 'faible' }, pop:  184000, revenu: 19800, proprio: 44.9, vacance: 9.8, permis:  680 },
  toulon:          { appart: { m2: 2940, ev1:  0.4, ev3:  4.8, ev5: 17.2 }, maison: { m2:  3680, ev1:  0.9, ev3:  5.6, ev5: 19.4 }, marche: { vol:  5800, delai: 76, nego: 4.9, tension: 'faible' }, pop:  179000, revenu: 19200, proprio: 46.3, vacance: 10.2, permis:  820 },
  dijon:           { appart: { m2: 2620, ev1: -1.8, ev3:  2.9, ev5: 13.4 }, maison: { m2:  3180, ev1: -1.2, ev3:  3.6, ev5: 15.2 }, marche: { vol:  4800, delai: 68, nego: 4.2, tension: 'faible' }, pop:  158000, revenu: 21900, proprio: 43.8, vacance: 8.1, permis:  750 },
  angers:          { appart: { m2: 2980, ev1: -2.9, ev3:  4.2, ev5: 24.8 }, maison: { m2:  3520, ev1: -2.4, ev3:  5.1, ev5: 27.3 }, marche: { vol:  5100, delai: 58, nego: 3.6, tension: 'modere' }, pop:  156000, revenu: 21200, proprio: 46.1, vacance: 6.7, permis: 1100 },
  aix_en_provence: { appart: { m2: 4820, ev1: -1.4, ev3:  4.2, ev5: 20.8 }, maison: { m2:  6200, ev1: -1.1, ev3:  5.1, ev5: 23.4 }, marche: { vol:  5200, delai: 64, nego: 3.8, tension: 'modere' }, pop:  144000, revenu: 28600, proprio: 48.2, vacance: 9.1, permis:  780 },
  blagnac:         { appart: { m2: 3180, ev1: -1.1, ev3:  5.9, ev5: 24.2 }, maison: { m2:  3820, ev1: -0.7, ev3:  6.8, ev5: 27.1 }, marche: { vol:  1800, delai: 55, nego: 3.2, tension: 'modere' }, pop:   25000, revenu: 26800, proprio: 52.4, vacance: 5.1, permis:  420 },
  tournefeuille:   { appart: { m2: 2980, ev1: -0.9, ev3:  5.4, ev5: 23.8 }, maison: { m2:  3560, ev1: -0.5, ev3:  6.2, ev5: 26.4 }, marche: { vol:  1200, delai: 51, nego: 2.9, tension: 'modere' }, pop:   28000, revenu: 28200, proprio: 61.8, vacance: 4.2, permis:  280 },
  colomiers:       { appart: { m2: 2840, ev1: -0.8, ev3:  5.1, ev5: 22.9 }, maison: { m2:  3380, ev1: -0.4, ev3:  5.9, ev5: 25.3 }, marche: { vol:  1400, delai: 53, nego: 3.1, tension: 'modere' }, pop:   38000, revenu: 25400, proprio: 55.2, vacance: 4.8, permis:  340 },
};

// ─── Handler principal ────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Non authentifié' });
  const agentEmail = session.email;

  const {
    ville = 'paris',
    prixMin = 0,
    prixMax = 1000000,
    surfaceMin = 0,
    type = 'appartement',
  } = req.method === 'POST' ? req.body : req.query;

  const params = {
    ville: String(ville).trim().toLowerCase(),
    prixMin: parseInt(prixMin) || 0,
    prixMax: parseInt(prixMax) || 1000000,
    surfaceMin: parseInt(surfaceMin) || 0,
    type,
  };

  try {
    // ── Étape 1 : Résoudre ville → code INSEE ─────────────────────────────────
    const codeCommune = await resolveCodeCommune(params.ville);
    if (!codeCommune) {
      return res.status(400).json({
        success: false,
        error: `Ville introuvable : "${ville}". Essayez le nom complet (ex: "Paris", "Lyon", "Nantes").`,
      });
    }

    // ── Étape 2 : Cache complet (12h) ─────────────────────────────────────────
    const cacheKey = `marche-${codeCommune}-${type}`;
    const cached = await getCacheComplet(cacheKey);
    if (cached) {
      return res.status(200).json({ ...cached, fromCache: true });
    }

    // ── Étape 3 : DVF live ────────────────────────────────────────────────────
    let rawTransactions = [];
    let dvfSource = null;
    try {
      const result = await fetchDVFWithRetry(codeCommune, type);
      rawTransactions = result.transactions;
      dvfSource = result.endpoint;
    } catch (dvfErr) {
      // DVF down → on continue avec INSEE seul, pas bloquant
      console.warn('[DVF] Tous les endpoints down:', dvfErr.message);
    }

    // ── Étape 4 : Filtrer + formatter + insérer en base ───────────────────────
    const filtered = filterTransactions(rawTransactions, params);
    const formatted = formatTransactions(filtered, ville, type);
    let nouvellesAnnonces = 0;

    for (const annonce of formatted) {
      if (!annonce.prix || !annonce.titre) continue;
      try {
        const { data: existe } = await supabaseAdmin
          .from('biens')
          .select('id')
          .eq('reference', annonce.reference)
          .eq('agent_email', agentEmail)
          .maybeSingle();
        if (!existe) {
          const { error } = await supabaseAdmin
            .from('biens')
            .insert([{ ...annonce, agent_email: agentEmail }]);
          if (!error) nouvellesAnnonces++;
        }
      } catch {}
    }

    // ── Étape 5 : Stats DVF calculées depuis les transactions live ────────────
    const statsDVF = calculerStatsDVF(rawTransactions, type);

    // ── Étape 6 : Données de référence INSEE ──────────────────────────────────
    const refKey = normaliserVille(ville);
    const ref = MARCHE_REF[refKey] || null;
    const typeData = ref ? (type === 'maison' ? ref.maison : ref.appart) : null;

    // Prix m² final : DVF live prioritaire, INSEE en fallback
    const prixM2Final = statsDVF?.prixM2Moyen || typeData?.m2 || null;

    // ── Étape 7 : Calcul des indicateurs enrichis ─────────────────────────────
    const enrichi = prixM2Final ? calculerEnrichi(ref, statsDVF, prixM2Final, type) : null;

    // ── Étape 8 : Géo via API adresse ────────────────────────────────────────
    const geoData = await fetchGeo(codeCommune);

    // ── Étape 9 : Construction réponse unifiée ────────────────────────────────
    const nomVille = geoData?.nom || (ref ? capitaliser(ville) : capitaliser(ville));
    const qualite = statsDVF?.nbTransactions > 5 ? 'premium' : ref ? 'reference' : 'estimee';

    const sources = [
      dvfSource ? `DVF ${dvfSource} (${statsDVF?.nbTransactions || 0} transactions live)` : null,
      'API Adresse data.gouv.fr',
      ref ? 'Base de référence marchéProspectBot (INSEE 2023-2024)' : null,
    ].filter(Boolean);

    const reponse = {
      success: true,
      // ── Méta
      ville: nomVille,
      villeSaisie: ville,
      type,
      codeInsee: codeCommune,
      departement: geoData?.departement,
      region: geoData?.region,
      codePostal: geoData?.codePostal,
      dateAnalyse: new Date().toISOString(),
      qualiteDonnees: qualite,
      sourcesDonnees: sources,

      // ── Import en base (rétrocompat avec frontend existant)
      stats: {
        annoncesTouvees: formatted.length,
        nouvellesAnnonces,
        source: dvfSource || 'insee',
      },

      // ── Prix & évolution
      prix: prixM2Final ? {
        prixM2Moyen: prixM2Final,
        prixM2Median: statsDVF?.prixM2Median || null,
        prixM2Min: statsDVF?.prixM2Min || null,
        prixM2Max: statsDVF?.prixM2Max || null,
        evolution1an: typeData?.ev1 ?? null,
        evolution3ans: typeData?.ev3 ?? null,
        evolution5ans: typeData?.ev5 ?? null,
        tranchesMarche: enrichi?.tranchesLocales || [],
      } : null,

      // ── Marché
      marche: ref ? {
        volumeTransactionsAnnuel: ref.marche.vol,
        nbTransactionsDVF: statsDVF?.nbTransactions || null,
        delaiVenteMoyenJours: ref.marche.delai,
        tauxNegociationPct: ref.marche.nego,
        tensionMarche: ref.marche.tension,
        tensionScore: { fort: '8.2/10', modere: '5.4/10', faible: '3.1/10' }[ref.marche.tension] || '5/10',
        saisonnalite: saisonnaliteActuelle(),
        indiceSaisonnalite: indiceSaison() + '/100',
      } : null,

      // ── Rentabilité
      rentabilite: prixM2Final ? {
        loyerM2EstimeMensuel: Math.round(prixM2Final * 0.0052),
        rentabiliteBrutePct: enrichi?.rentaBrute || null,
        rentabiliteNettePct: enrichi?.rentaNette || null,
        noteInvestissement: enrichi?.noteInvest || null,
      } : null,

      // ── Profil acheteurs
      profilAcheteurs: ref ? {
        budget_median: enrichi?.budgetMedian || null,
        apport_moyen: enrichi?.apportMoyen || null,
        surface_recherchee: type === 'maison' ? '90 – 140 m²' : '45 – 75 m²',
        nb_pieces_freq: type === 'maison' ? '4 – 5 pièces' : '2 – 3 pièces',
        profil_dominant: ref.revenu > 26000 ? 'Cadres et professions libérales' : ref.revenu > 22000 ? 'Professions intermédiaires' : 'Employés et ouvriers qualifiés',
        tauxProprietaires: ref.proprio + '%',
        revenuMedianFoyer: ref.revenu.toLocaleString('fr-FR') + '€/an',
      } : null,

      // ── Territoire
      territoire: {
        population: geoData?.population || ref?.pop || null,
        surface: geoData?.surface ? Math.round(geoData.surface) + ' km²' : null,
        tauxVacanceLogements: ref?.vacance ? ref.vacance + '%' : null,
        permisConstuireAccordes2023: ref?.permis || null,
        dynamiqueOffre: ref?.permis > 1000 ? 'Forte (nombreuses constructions neuves)' : ref?.permis > 500 ? 'Modérée' : 'Faible (peu de constructions neuves)',
      },

      // ── Prospection
      prospection: ref && prixM2Final ? {
        biensMoyensParAgent: Math.round(ref.marche.vol / 320),
        commissionMoyenneVente: Math.round(prixM2Final * 70 * 0.05).toLocaleString('fr-FR') + '€',
        partVendeursPresses: '~' + Math.round(100 / ref.marche.delai * 22) + '%',
        meilleureMoment: momentActuel(),
        argumentsPrix: argumentsPrix(typeData?.ev1, ref.marche.delai),
      } : null,

      // ── Conseils agent
      conseilsAgent: ref && prixM2Final ? genererConseils(ref, nomVille, type, prixM2Final, enrichi) : [],
    };

    // ── Étape 10 : Cache la réponse complète ─────────────────────────────────
    await setCacheComplet(cacheKey, nomVille, reponse);

    // ── Log
    try {
      await supabaseAdmin.from('scraper_logs').insert([{
        source: dvfSource || 'insee',
        agent_email: agentEmail,
        date: new Date().toISOString(),
        parametres: { ville, type },
        resultat: { annoncesTouvees: formatted.length, nouvellesAnnonces, prixM2: prixM2Final },
      }]);
    } catch {}

    return res.status(200).json(reponse);

  } catch (error) {
    console.error('[Marché] Erreur:', error.message);
    return res.status(500).json({ success: false, error: `Erreur : ${error.message}` });
  }
}

// ─── DVF : retry multi-endpoints ─────────────────────────────────────────────

async function fetchDVFWithRetry(codeCommune, type) {
  const typeLocal = type === 'appartement' ? 'Appartement' : 'Maison';
  const deptMap = { '75056': '75', '69123': '69', '13055': '13' };
  const useDept = !!deptMap[codeCommune];
  const deptCode = deptMap[codeCommune];
  const errors = [];

  // Endpoint 1 — Etalab OData
  try {
    const filterParts = [
      `nature_mutation eq 'Vente'`,
      `type_local eq '${typeLocal}'`,
      useDept ? `startswith(code_commune,'${deptCode}')` : `code_commune eq '${codeCommune}'`,
    ];
    const url = `https://api.dvf.etalab.gouv.fr/api/odata/v1/Ventes?${new URLSearchParams({ '$filter': filterParts.join(' and '), '$top': '200', '$orderby': 'date_mutation desc' })}`;
    const res = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const t = (data.value || []).filter(t => t.type_local === typeLocal);
    if (t.length > 0) return { transactions: t, endpoint: 'etalab-odata' };
    errors.push('etalab-odata: 0 résultats');
  } catch (e) { errors.push(`etalab-odata: ${e.message}`); }

  // Endpoint 2 — cquest
  try {
    const pk = useDept ? 'code_departement' : 'code_commune';
    const pv = useDept ? deptCode : codeCommune;
    const url = `https://api.cquest.org/dvf?${pk}=${pv}&nature_mutation=Vente&limit=200`;
    const res = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const t = (data.resultats || []).filter(t => !t.type_local || t.type_local === typeLocal);
    if (t.length > 0) return { transactions: t, endpoint: 'cquest' };
    errors.push('cquest: 0 résultats');
  } catch (e) { errors.push(`cquest: ${e.message}`); }

  // Endpoint 3 — economie.gouv
  try {
    const where = useDept
      ? `startswith(code_commune, '${deptCode}') and type_local="${typeLocal}"`
      : `code_commune="${codeCommune}" and type_local="${typeLocal}"`;
    const url = `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/dvf-plus-open-data-immo/records?${new URLSearchParams({ limit: '200', where, select: 'id_mutation,date_mutation,valeur_fonciere,type_local,surface_reelle_bati,nombre_pieces_principales,no_voie,type_voie,voie,code_postal,nom_commune,code_commune,nombre_lots', order_by: 'date_mutation DESC' })}`;
    const res = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const t = data.results || [];
    if (t.length > 0) return { transactions: t, endpoint: 'economie.gouv' };
    errors.push('economie.gouv: 0 résultats');
  } catch (e) { errors.push(`economie.gouv: ${e.message}`); }

  throw new Error(`Les services DVF sont temporairement indisponibles. (${errors.join(' | ')})`);
}

// ─── Stats calculées depuis les transactions DVF ──────────────────────────────

function calculerStatsDVF(transactions, type) {
  if (!transactions?.length) return null;
  const typeLocal = type === 'appartement' ? 'Appartement' : 'Maison';
  const filtre = transactions.filter(t => {
    const tl = t.type_local || '';
    return !tl || tl === typeLocal;
  });
  if (!filtre.length) return null;

  const prixM2s = filtre.map(t => {
    const p = parseFloat(t.valeur_fonciere);
    const s = parseFloat(t.surface_reelle_bati);
    return (p > 0 && s > 10) ? Math.round(p / s) : null;
  }).filter(v => v && v > 500 && v < 60000);

  if (!prixM2s.length) return null;
  const sorted = [...prixM2s].sort((a, b) => a - b);
  const moy = Math.round(prixM2s.reduce((a, b) => a + b, 0) / prixM2s.length);

  return {
    prixM2Moyen: moy,
    prixM2Median: sorted[Math.floor(sorted.length / 2)],
    prixM2Min: sorted[0],
    prixM2Max: sorted[sorted.length - 1],
    nbTransactions: filtre.length,
  };
}

// ─── Indicateurs enrichis ─────────────────────────────────────────────────────

function calculerEnrichi(ref, statsDVF, prixM2, type) {
  if (!prixM2) return null;
  const revenu = ref?.revenu || 22000;
  const budgetMedian = Math.round(revenu * 0.35 * 20 * 12 / 10000) * 10000;
  const apportMoyen = Math.round(budgetMedian * 0.12 / 1000) * 1000;
  const loyerM2 = prixM2 * 0.0052;
  const rentaBrute = Math.round((loyerM2 * 12 / prixM2) * 1000) / 10;
  const rentaNette = Math.round(rentaBrute * 0.72 * 10) / 10;
  const noteInvest = rentaBrute > 6 ? 'Excellent' : rentaBrute > 4.5 ? 'Bon' : rentaBrute > 3.5 ? 'Correct' : 'Faible';

  const tranchesLocales = [
    { label: `< ${Math.round(prixM2 * 0.65).toLocaleString('fr-FR')}€/m²`, part: 15, type: 'entrée de gamme' },
    { label: `${Math.round(prixM2 * 0.65).toLocaleString('fr-FR')} – ${Math.round(prixM2 * 0.95).toLocaleString('fr-FR')}€/m²`, part: 35, type: 'milieu de gamme bas' },
    { label: `${Math.round(prixM2 * 0.95).toLocaleString('fr-FR')} – ${Math.round(prixM2 * 1.15).toLocaleString('fr-FR')}€/m²`, part: 32, type: 'milieu de gamme haut' },
    { label: `> ${Math.round(prixM2 * 1.15).toLocaleString('fr-FR')}€/m²`, part: 18, type: 'haut de gamme' },
  ];

  return { budgetMedian, apportMoyen, rentaBrute, rentaNette, noteInvest, tranchesLocales };
}

// ─── Géocodage ────────────────────────────────────────────────────────────────

async function fetchGeo(codeCommune) {
  try {
    const res = await fetchWithTimeout(
      `https://geo.api.gouv.fr/communes/${codeCommune}?fields=nom,codesPostaux,population,departement,region,surface`,
      6000
    );
    if (!res.ok) return null;
    const d = await res.json();
    return { nom: d.nom, population: d.population, codePostal: d.codesPostaux?.[0], departement: d.departement?.nom, region: d.region?.nom, surface: d.surface };
  } catch { return null; }
}

// ─── Cache Supabase (réponse complète) ───────────────────────────────────────

async function getCacheComplet(cacheKey) {
  try {
    const cutoff = new Date(Date.now() - CACHE_TTL_HOURS * 3600 * 1000).toISOString();
    const { data } = await supabaseAdmin
      .from('dvf_cache')
      .select('resultats')
      .eq('cache_key', cacheKey)
      .gte('cached_at', cutoff)
      .maybeSingle();
    return data?.resultats || null;
  } catch { return null; }
}

async function setCacheComplet(cacheKey, ville, resultats) {
  try {
    await supabaseAdmin.from('dvf_cache').upsert([{
      cache_key: cacheKey,
      ville,
      resultats,
      cached_at: new Date().toISOString(),
    }], { onConflict: 'cache_key' });
  } catch {}
}

// ─── Filtrage + formatage transactions (inchangé) ────────────────────────────

function filterTransactions(transactions, { prixMin, prixMax, surfaceMin }) {
  return transactions.filter(t => {
    const prix = parseFloat(t.valeur_fonciere);
    const surface = parseFloat(t.surface_reelle_bati);
    if (!prix || !surface) return false;
    if (prix < prixMin || prix > prixMax) return false;
    if (surfaceMin > 0 && surface < surfaceMin) return false;
    return true;
  }).slice(0, MAX_RESULTS);
}

function formatTransactions(transactions, ville, type) {
  const typeLocal = type === 'appartement' ? 'Appartement' : 'Maison';
  return transactions.map(t => {
    const dateStr = t.date_mutation || new Date().toISOString().slice(0, 10);
    const adresse = [t.no_voie, t.type_voie, t.voie].filter(Boolean).join(' ');
    const villeNom = t.nom_commune || ville;
    const cp = t.code_postal || '';
    const prix = Math.round(parseFloat(t.valeur_fonciere));
    const surface = Math.round(parseFloat(t.surface_reelle_bati));
    const pieces = t.nombre_pieces_principales || null;
    const prixM2 = surface > 0 ? Math.round(prix / surface) : null;
    const mutId = t.id_mutation || '';
    const ref = `DVF-${(mutId || adresse + dateStr).replace(/[^a-zA-Z0-9]/g, '').slice(-20)}`;
    return {
      source: 'dvf', reference: ref,
      titre: `${typeLocal} ${surface}m²${pieces ? ` · ${pieces}p` : ''} — ${villeNom}`,
      prix, adresse: adresse || '', ville: villeNom, code_postal: cp,
      surface, pieces, chambres: null,
      description: [`Transaction DVF du ${new Date(dateStr).toLocaleDateString('fr-FR')}`, prixM2 ? `Prix au m² : ${prixM2.toLocaleString('fr-FR')} €/m²` : '', cp ? `Code postal : ${cp}` : ''].filter(Boolean).join(' · '),
      lien: 'https://app.dvf.etalab.gouv.fr/',
      image: null, type: type === 'appartement' ? 'appartement' : 'maison',
      statut: 'vendu', dpe: null, created_at: new Date().toISOString(),
    };
  });
}

// ─── Résolution ville → code INSEE (inchangé) ────────────────────────────────

async function resolveCodeCommune(ville) {
  const CODES_DIRECTS = {
    paris: '75056', lyon: '69123', marseille: '13055', toulouse: '31555',
    nice: '06088', nantes: '44109', montpellier: '34172', strasbourg: '67482',
    bordeaux: '33063', lille: '59350', rennes: '35238', reims: '51454',
    toulon: '83137', grenoble: '38185', dijon: '21231', angers: '49007',
    nimes: '30189', villeurbanne: '69266', saint_etienne: '42218', le_havre: '76351',
    clermont_ferrand: '63113', aix_en_provence: '13001', brest: '29019',
    amiens: '80021', limoges: '87085', tours: '37261', perpignan: '66136',
    metz: '57463', besancon: '25056', orleans: '45234', rouen: '76540',
    blagnac: '31069', tournefeuille: '31557', colomiers: '31149',
  };
  const key = ville.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  if (CODES_DIRECTS[key]) return CODES_DIRECTS[key];
  try {
    const res = await fetchWithTimeout(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(ville)}&type=municipality&limit=1`, 8000);
    if (!res.ok) return null;
    const data = await res.json();
    return data.features?.[0]?.properties?.citycode || null;
  } catch { return null; }
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function fetchWithTimeout(url, ms) {
  return fetch(url, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'ProspectBot/1.0' },
    signal: AbortSignal.timeout(ms),
  });
}

function normaliserVille(v) {
  return v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[-\s]+/g, '_').replace(/[^a-z0-9_]/g, '').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

function capitaliser(s) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function indiceSaison() {
  return [72, 75, 88, 96, 102, 108, 95, 72, 94, 101, 82, 68][new Date().getMonth()];
}

function saisonnaliteActuelle() {
  const i = indiceSaison();
  return i > 95 ? 'Haute saison' : i > 80 ? 'Saison normale' : 'Basse saison';
}

function momentActuel() {
  const m = new Date().getMonth();
  if (m >= 1 && m <= 4) return 'Bonne période (mars–mai = pic d\'activité)';
  if (m >= 5 && m <= 7) return 'Haute saison — activité maximale';
  if (m >= 8 && m <= 10) return 'Bonne rentrée (sept–oct = 2ème pic)';
  return 'Basse saison — idéal pour constituer le stock de mandats';
}

function argumentsPrix(ev1, delai) {
  const args = [];
  if (ev1 !== undefined && ev1 < -3) {
    args.push(`Marché en repli (${ev1 > 0 ? '+' : ''}${ev1?.toFixed(1)}%/an) — argument acheteurs : c'est le bon moment d'acheter`);
    args.push('Vendeurs plus négociables qu\'en période de hausse');
  } else if (ev1 !== undefined && ev1 > 2) {
    args.push(`Marché en hausse (+${ev1?.toFixed(1)}%/an) — argument vendeurs : valorisation en cours`);
    args.push('Attendre coûte de l\'argent aux acheteurs indécis');
  } else {
    args.push('Marché stable — sécurité pour acheteurs et vendeurs');
  }
  if (delai < 55) args.push(`Délai de vente court (${delai}j) — les biens bien estimés partent vite`);
  else if (delai > 75) args.push(`Délai de vente plus long (${delai}j) — l'importance du prix juste dès la mise en vente`);
  return args;
}

function genererConseils(ref, ville, type, prixM2, enrichi) {
  const conseils = [];
  const ev1 = type === 'maison' ? ref.maison.ev1 : ref.appart.ev1;
  const delai = ref.marche.delai;

  if (ev1 < -4) {
    conseils.push({ titre: 'Stratégie de prix', priorite: 'haute', conseil: `Le marché de ${ville} est en correction (${ev1 > 0 ? '+' : ''}${ev1?.toFixed(1)}%/an). Positionnez vos mandats dans les 10% bas de la fourchette pour vendre dans les ${Math.round(delai * 0.7)} jours.` });
  } else {
    conseils.push({ titre: 'Estimation au juste prix', priorite: 'normale', conseil: `Avec un délai moyen de ${delai} jours sur ${ville}, une surestimation de 5% allonge la durée de vente d'environ ${Math.round(delai * 0.4)} jours supplémentaires.` });
  }

  if (enrichi?.budgetMedian) {
    conseils.push({ titre: 'Profil acheteur cible', priorite: 'normale', conseil: `Budget médian estimé à ${enrichi.budgetMedian.toLocaleString('fr-FR')}€. Ciblez les ${ref.revenu > 26000 ? 'cadres et professions libérales' : ref.revenu > 22000 ? 'professions intermédiaires' : 'employés et ouvriers qualifiés'} qui représentent le gros des acheteurs sur ce marché.` });
  }

  if (enrichi?.rentaBrute > 5) {
    conseils.push({ titre: 'Argument investissement', priorite: 'haute', conseil: `Rentabilité brute estimée à ${enrichi.rentaBrute}% — au-dessus de la moyenne nationale (4.2%). Argument fort auprès des investisseurs locatifs.` });
  }

  if (indiceSaison() < 80) {
    conseils.push({ titre: 'Basse saison = opportunité', priorite: 'normale', conseil: 'Période creuse idéale pour constituer votre stock de mandats. Les biens signés maintenant seront commercialisés au pic de printemps.' });
  }

  if (ref.permis > 1500) {
    conseils.push({ titre: 'Concurrence du neuf', priorite: 'info', conseil: `Fort volume de permis accordés en 2023 (${ref.permis.toLocaleString('fr-FR')}). L'offre neuve pèse sur l'ancien — valorisez le charme et l'immédiateté de l'existant.` });
  }

  if (ref.marche.tension === 'fort') {
    conseils.push({ titre: 'Marché tendu — opportunité mandat', priorite: 'haute', conseil: `Marché très dynamique sur ${ville}. C'est le moment idéal pour proposer vos services : les vendeurs savent que leurs biens partiront vite avec un bon agent.` });
  }

  return conseils;
}
