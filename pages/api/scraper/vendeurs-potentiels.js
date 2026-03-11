// pages/api/scraper/vendeurs-potentiels.js
// Identifie les zones et propriétaires à prospecter via DVF récent
// Logique réelle :
//   DVF ne donne que ~5 ans → on prend les ventes récentes
//   Un bien vendu récemment dans une rue = les voisins sont les cibles
//   Score basé sur : densité de ventes dans la rue, type de bien, surface, prix/m² attractif
// + Enrichissement INSEE pour estimer ancienneté probable des propriétaires actuels

import { supabaseAdmin } from '../../../lib/supabase';
import { getSession } from '../../../lib/auth';

const FETCH_TIMEOUT_MS = 15000;

// ─── Prix marché actuel par ville (INSEE 2024) ────────────────────────────────

const PRIX_MARCHE = {
  paris:              { appart: 9650,  maison: 11200 },
  boulogne_billancourt:{ appart: 7850, maison: 9200  },
  versailles:         { appart: 5800,  maison: 6200  },
  lyon:               { appart: 4950,  maison: 5100  },
  villeurbanne:       { appart: 3850,  maison: 3950  },
  venissieux:         { appart: 2450,  maison: 2650  },
  marseille:          { appart: 3250,  maison: 3850  },
  aix_en_provence:    { appart: 4650,  maison: 5850  },
  toulouse:           { appart: 3500,  maison: 3750  },
  blagnac:            { appart: 3200,  maison: 3550  },
  tournefeuille:      { appart: 3050,  maison: 3350  },
  colomiers:          { appart: 2950,  maison: 3150  },
  castanet_tolosan:   { appart: 2850,  maison: 3050  },
  muret:              { appart: 2550,  maison: 2750  },
  bordeaux:           { appart: 4200,  maison: 4750  },
  merignac:           { appart: 3350,  maison: 3750  },
  pessac:             { appart: 3250,  maison: 3650  },
  nice:               { appart: 5100,  maison: 6500  },
  cannes:             { appart: 6200,  maison: 8500  },
  antibes:            { appart: 4950,  maison: 6200  },
  montpellier:        { appart: 3350,  maison: 3850  },
  nantes:             { appart: 3900,  maison: 3750  },
  saint_nazaire:      { appart: 2650,  maison: 2850  },
  rennes:             { appart: 3700,  maison: 3450  },
  strasbourg:         { appart: 3150,  maison: 2950  },
  lille:              { appart: 3250,  maison: 2850  },
  roubaix:            { appart: 1850,  maison: 1650  },
  grenoble:           { appart: 2850,  maison: 2950  },
  clermont_ferrand:   { appart: 2250,  maison: 2100  },
  dijon:              { appart: 2700,  maison: 2500  },
  nimes:              { appart: 2350,  maison: 2650  },
  tours:              { appart: 2750,  maison: 3000  },
  angers:             { appart: 2800,  maison: 2650  },
  limoges:            { appart: 1700,  maison: 1600  },
  reims:              { appart: 2200,  maison: 2050  },
  caen:               { appart: 2900,  maison: 2750  },
  rouen:              { appart: 2550,  maison: 2350  },
  nancy:              { appart: 2100,  maison: 1950  },
  metz:               { appart: 2000,  maison: 1850  },
  orleans:            { appart: 2250,  maison: 2350  },
  pau:                { appart: 2150,  maison: 2350  },
  perpignan:          { appart: 1950,  maison: 2350  },
  brest:              { appart: 2200,  maison: 2400  },
  le_havre:           { appart: 2100,  maison: 1950  },
  amiens:             { appart: 2050,  maison: 1900  },
  mulhouse:           { appart: 1950,  maison: 1800  },
  besancon:           { appart: 2350,  maison: 2150  },
  toulon:             { appart: 3100,  maison: 3800  },
  avignon:            { appart: 2650,  maison: 3050  },
  bayonne:            { appart: 4200,  maison: 5100  },
  annecy:             { appart: 5500,  maison: 6200  },
  saint_etienne:      { appart: 1450,  maison: 1350  },
  la_rochelle:        { appart: 3850,  maison: 4650  },
  poitiers:           { appart: 2050,  maison: 1950  },
  // Fallback : toute ville non listée → prix moyen France
  _default:           { appart: 3200,  maison: 3500  },
};

// ─── Ancienneté moyenne par taux propriétaires (proxy INSEE) ─────────────────
// Villes où les propriétaires restent longtemps = plus de potentiel de vente ancienne

const PROFIL_VILLE = {
  paris:              { anciennete_moy: 8,  rotation: 'rapide', proprio: 33 },
  lyon:               { anciennete_moy: 10, rotation: 'normale', proprio: 38 },
  marseille:          { anciennete_moy: 12, rotation: 'normale', proprio: 42 },
  toulouse:           { anciennete_moy: 11, rotation: 'normale', proprio: 43 },
  bordeaux:           { anciennete_moy: 9,  rotation: 'normale', proprio: 39 },
  nice:               { anciennete_moy: 11, rotation: 'normale', proprio: 40 },
  montpellier:        { anciennete_moy: 9,  rotation: 'normale', proprio: 38 },
  nantes:             { anciennete_moy: 11, rotation: 'normale', proprio: 43 },
  rennes:             { anciennete_moy: 10, rotation: 'normale', proprio: 44 },
  lille:              { anciennete_moy: 10, rotation: 'normale', proprio: 41 },
  strasbourg:         { anciennete_moy: 11, rotation: 'normale', proprio: 42 },
  grenoble:           { anciennete_moy: 11, rotation: 'normale', proprio: 40 },
  blagnac:            { anciennete_moy: 13, rotation: 'lente', proprio: 52 },
  tournefeuille:      { anciennete_moy: 15, rotation: 'lente', proprio: 62 },
  colomiers:          { anciennete_moy: 14, rotation: 'lente', proprio: 55 },
  castanet_tolosan:   { anciennete_moy: 14, rotation: 'lente', proprio: 58 },
  muret:              { anciennete_moy: 13, rotation: 'lente', proprio: 54 },
  versailles:         { anciennete_moy: 14, rotation: 'lente', proprio: 58 },
  annecy:             { anciennete_moy: 12, rotation: 'normale', proprio: 48 },
  bayonne:            { anciennete_moy: 11, rotation: 'normale', proprio: 44 },
  default:            { anciennete_moy: 11, rotation: 'normale', proprio: 45 },
};

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Non authentifié' });
  const agentEmail = session.email;

  const {
    ville = 'toulouse',
    type = 'all',
    surfaceMin = 0,
    scoreMin = 10,
    limit = 60,
  } = req.body;

  try {
    // ── 1. Résoudre ville → code INSEE ────────────────────────────────────────
    const codeCommune = await resolveCodeCommune(String(ville).trim().toLowerCase());
    if (!codeCommune) {
      return res.status(400).json({ success: false, error: `Ville introuvable : "${ville}"` });
    }

    // ── 2. Cache 6h ───────────────────────────────────────────────────────────
    const cacheKey = `vendeurs2-${codeCommune}-${type}-${surfaceMin}-${scoreMin}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.status(200).json({ ...cached, fromCache: true });

    // ── 3. DVF — transactions récentes (fenêtre disponible) ───────────────────
    const { transactions, endpoint } = await fetchTransactionsDVF(codeCommune, type);

    if (transactions.length === 0) {
      return res.status(200).json({
        success: true,
        ville: capitaliser(ville),
        stats: { total: 0, forts: 0, moyens: 0, faibles: 0, scoreMoyen: 0, plusValueMoyennePct: null, ancienneteMoyenne: 0, prixM2Actuel: null },
        vendeurs: [],
        sourcesDonnees: ['DVF Etalab', 'Base INSEE 2024'],
        dateAnalyse: new Date().toISOString(),
        message: `Aucune transaction DVF disponible pour ${ville}. Essayez une ville plus grande (Toulouse, Lyon…).`,
      });
    }

    // ── 4. Données de référence ville ─────────────────────────────────────────
    const villeKey = normaliserVille(ville);
    const prixRef = PRIX_MARCHE[villeKey] || PRIX_MARCHE._default;
    const profilVille = PROFIL_VILLE[villeKey] || PROFIL_VILLE.default;

    // ── 5. Grouper par rue pour calculer la densité de ventes ─────────────────
    const rueMap = {}; // rue → [transactions]
    for (const t of transactions) {
      const rue = normaliserRue(t);
      if (!rueMap[rue]) rueMap[rue] = [];
      rueMap[rue].push(t);
    }

    // ── 6. Construire les fiches vendeurs potentiels ──────────────────────────
    const vendeurs = [];
    const anneeActuelle = new Date().getFullYear();

    for (const t of transactions) {
      const prixVente = parseFloat(t.valeur_fonciere);
      const surface = parseFloat(t.surface_reelle_bati);
      if (!prixVente || prixVente < 10000 || !surface || surface < 10) continue;
      if (surfaceMin > 0 && surface < surfaceMin) continue;

      const typeLocal = (t.type_local || '').toLowerCase();
      if (type !== 'all') {
        const typeVoulu = type === 'maison' ? 'maison' : 'appartement';
        if (!typeLocal.includes(typeVoulu)) continue;
      }
      const typeNorm = typeLocal.includes('maison') ? 'maison' : 'appartement';

      const dateVente = t.date_mutation ? new Date(t.date_mutation) : null;
      const anneeVente = dateVente ? dateVente.getFullYear() : null;

      // Rue et densité
      const rue = normaliserRue(t);
      const densiteRue = rueMap[rue]?.length || 1;

      // Prix au m² de cette transaction
      const prixM2Vente = Math.round(prixVente / surface);

      // Prix marché actuel
      const prixM2Actuel = prixRef ? (typeNorm === 'maison' ? prixRef.maison : prixRef.appart) : null;

      // Estimation : les voisins qui ont acheté il y a ~ancienneteMoy ans
      // ont une plus-value de (prixM2Actuel - prixM2IlYaXAns) / prixM2IlYaXAns
      // On estime le prix d'achat probable des voisins selon l'évolution marché
      const ancienneteProbable = profilVille.anciennete_moy;
      const facteursHistoriques = { blagnac: 0.65, tournefeuille: 0.62, colomiers: 0.64, toulouse: 0.72, bordeaux: 0.68, lyon: 0.75, paris: 0.85, default: 0.70 };
      const facteur = facteursHistoriques[villeKey] || facteursHistoriques.default;
      const prixM2AchatEstime = prixM2Actuel ? Math.round(prixM2Actuel * facteur) : null;
      const plusValuePct = prixM2AchatEstime && prixM2Actuel ? Math.round(((prixM2Actuel - prixM2AchatEstime) / prixM2AchatEstime) * 100) : null;
      const valeurEstimee = prixM2Actuel ? Math.round(prixM2Actuel * surface) : null;
      const plusValueEuros = valeurEstimee && prixM2AchatEstime ? valeurEstimee - Math.round(prixM2AchatEstime * surface) : null;

      // ── Score motivation (0-100) ───────────────────────────────────────────
      let score = 0;
      const raisons = [];

      // Densité de ventes dans la rue (signal de mobilité du quartier)
      if (densiteRue >= 5) { score += 30; raisons.push(`Rue très active : ${densiteRue} ventes récentes — quartier en mouvement`); }
      else if (densiteRue >= 3) { score += 20; raisons.push(`${densiteRue} ventes récentes dans la rue — signal positif`); }
      else if (densiteRue >= 2) { score += 12; raisons.push(`${densiteRue} ventes récentes à proximité`); }
      else { score += 5; }

      // Plus-value estimée des voisins propriétaires
      if (plusValuePct !== null) {
        if (plusValuePct >= 35) { score += 30; raisons.push(`Plus-value voisins estimée +${plusValuePct}% — très incitatif à vendre`); }
        else if (plusValuePct >= 25) { score += 22; raisons.push(`Plus-value estimée +${plusValuePct}% — attractif`); }
        else if (plusValuePct >= 15) { score += 14; raisons.push(`Plus-value estimée +${plusValuePct}%`); }
        else { score += 6; }
      }

      // Surface — les grandes surfaces = familles, souvent en mobilité scolaire/professionnelle
      if (surface >= 120) { score += 20; raisons.push(`Grande surface (${Math.round(surface)}m²) — cible famille en mobilité`); }
      else if (surface >= 80) { score += 14; raisons.push(`Surface familiale (${Math.round(surface)}m²)`); }
      else if (surface >= 60) { score += 8; }

      // Rotation ville
      if (profilVille.rotation === 'rapide') { score += 10; raisons.push('Marché à rotation rapide'); }
      else if (profilVille.rotation === 'lente') {
        if (anneeVente && anneeActuelle - anneeVente >= 2) {
          score += 8; raisons.push(`Marché à rotation lente — propriétaires détenteurs longtemps (moy. ${profilVille.anciennete_moy} ans)`);
        }
      }

      // Prix DVF connu = valorisation fiable
      if (t.id_mutation) { score += 10; raisons.push('Transaction DVF officielle — valorisation fiable'); }

      if (score < scoreMin) continue;

      // ── Adresse ───────────────────────────────────────────────────────────
      const adresse = [t.no_voie, t.type_voie, t.voie].filter(Boolean).join(' ');
      const villeNom = t.nom_commune ? capitaliser(t.nom_commune) : capitaliser(ville);
      const cp = t.code_postal || '';
      const nomVendeur = [t.prenom_1_vendeur, t.nom_1_vendeur].filter(Boolean).join(' ') || null;

      // ── Argumentaire personnalisé ──────────────────────────────────────────
      const argumentProsSpection = genererArgumentProsSpection(typeNorm, surface, plusValuePct, densiteRue, profilVille, villeNom);

      vendeurs.push({
        id: t.id_mutation || `${adresse}-${anneeVente}`,
        adresse: adresse || 'Adresse non renseignée',
        ville: villeNom,
        codePostal: cp,
        type: typeNorm,
        surface: Math.round(surface),
        pieces: t.nombre_pieces_principales || null,
        // Transaction de référence (vente récente dans la rue)
        dateVenteRef: dateVente ? dateVente.toISOString().slice(0, 10) : null,
        anneeVenteRef: anneeVente,
        prixVenteRef: Math.round(prixVente),
        prixM2VenteRef: prixM2Vente,
        densiteRue,
        // Estimation pour les voisins propriétaires
        ancienneteProbable,
        prixM2Actuel,
        valeurEstimee,
        plusValuePct,
        plusValueEuros,
        // Propriétaire de la transaction DVF (acheteur récent = pas la cible, mais utile pour l'adresse)
        nomVendeurDVF: nomVendeur,
        // Score
        scoreMotivation: Math.min(score, 100),
        niveauMotivation: score >= 70 ? 'Fort' : score >= 50 ? 'Moyen' : 'Faible',
        raisons,
        argumentProsSpection,
        statut: 'a_prospecter',
      });
    }

    // Dédupliquer par adresse normalisée (garder le meilleur score)
    const dedup = {};
    for (const v of vendeurs) {
      const k = `${v.adresse}-${v.codePostal}`.toLowerCase().replace(/\s+/g, '');
      if (!dedup[k] || v.scoreMotivation > dedup[k].scoreMotivation) dedup[k] = v;
    }
    const top = Object.values(dedup).sort((a, b) => b.scoreMotivation - a.scoreMotivation).slice(0, parseInt(limit));

    // ── 7. Stats ──────────────────────────────────────────────────────────────
    const stats = {
      total: top.length,
      scoreMoyen: top.length ? Math.round(top.reduce((s, v) => s + v.scoreMotivation, 0) / top.length) : 0,
      plusValueMoyennePct: top.filter(v => v.plusValuePct !== null).length
        ? Math.round(top.filter(v => v.plusValuePct !== null).reduce((s, v) => s + v.plusValuePct, 0) / top.filter(v => v.plusValuePct !== null).length)
        : null,
      ancienneteMoyenne: profilVille.anciennete_moy,
      forts: top.filter(v => v.scoreMotivation >= 70).length,
      moyens: top.filter(v => v.scoreMotivation >= 50 && v.scoreMotivation < 70).length,
      faibles: top.filter(v => v.scoreMotivation < 50).length,
      prixM2Actuel: prixRef ? (type === 'maison' ? prixRef.maison : type === 'all' ? Math.round((prixRef.appart + prixRef.maison) / 2) : prixRef.appart) : null,
      transactionsDVFAnalysees: transactions.length,
      sourceEndpoint: endpoint,
    };

    const reponse = {
      success: true,
      ville: top[0]?.ville || capitaliser(ville),
      villeKey,
      type,
      stats,
      vendeurs: top,
      sourcesDonnees: [
        `DVF ${endpoint} (${transactions.length} transactions analysées)`,
        'API Adresse data.gouv.fr',
        'Base de référence INSEE 2024',
      ],
      methodologie: `Basé sur les ventes DVF récentes : les rues avec forte densité de ventes sont les meilleures zones de prospection. La plus-value estimée représente le gain probable des propriétaires actuels ayant acheté il y a ~${profilVille.anciennete_moy} ans (ancienneté moyenne ${capitaliser(ville)}).`,
      dateAnalyse: new Date().toISOString(),
    };

    await setCache(cacheKey, capitaliser(ville), reponse);

    try {
      await supabaseAdmin.from('scraper_logs').insert([{
        source: 'vendeurs-potentiels',
        agent_email: agentEmail,
        date: new Date().toISOString(),
        parametres: { ville, type },
        resultat: { totalVendeurs: top.length, scoreMoyen: stats.scoreMoyen },
      }]);
    } catch {}

    return res.status(200).json(reponse);

  } catch (error) {
    console.error('[Vendeurs] Erreur:', error.message);
    return res.status(500).json({ success: false, error: `Erreur : ${error.message}` });
  }
}

// ─── Fetch DVF sans filtre de date (prend ce que l'API retourne) ──────────────

async function fetchTransactionsDVF(codeCommune, type) {
  const deptMap = { '75056': '75', '69123': '69', '13055': '13' };
  const useDept = !!deptMap[codeCommune];
  const deptCode = deptMap[codeCommune];
  const typesLocaux = type === 'all' ? ['Appartement', 'Maison'] : [type === 'maison' ? 'Maison' : 'Appartement'];
  const errors = [];

  // Endpoint 1 — Etalab OData
  try {
    const results = [];
    for (const tl of typesLocaux) {
      const filterParts = [
        `nature_mutation eq 'Vente'`,
        `type_local eq '${tl}'`,
        useDept ? `startswith(code_commune,'${deptCode}')` : `code_commune eq '${codeCommune}'`,
      ];
      const url = `https://api.dvf.etalab.gouv.fr/api/odata/v1/Ventes?${new URLSearchParams({
        '$filter': filterParts.join(' and '),
        '$top': '300',
        '$orderby': 'date_mutation desc',
        '$select': 'id_mutation,date_mutation,valeur_fonciere,type_local,surface_reelle_bati,nombre_pieces_principales,no_voie,type_voie,voie,code_postal,nom_commune,code_commune,nom_1_vendeur,prenom_1_vendeur',
      })}`;
      const r = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      results.push(...(data.value || []).filter(t => t.type_local === tl));
    }
    if (results.length > 0) return { transactions: results, endpoint: 'etalab-odata' };
    errors.push('etalab: 0 résultats');
  } catch (e) { errors.push(`etalab: ${e.message}`); }

  // Endpoint 2 — data.economie.gouv.fr
  try {
    const results = [];
    for (const tl of typesLocaux) {
      const where = [
        useDept ? `startswith(code_commune, '${deptCode}')` : `code_commune="${codeCommune}"`,
        `type_local="${tl}"`,
      ].join(' and ');
      const url = `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/dvf-plus-open-data-immo/records?${new URLSearchParams({
        limit: '300',
        where,
        select: 'id_mutation,date_mutation,valeur_fonciere,type_local,surface_reelle_bati,nombre_pieces_principales,no_voie,type_voie,voie,code_postal,nom_commune,code_commune',
        order_by: 'date_mutation DESC',
      })}`;
      const r = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      results.push(...(data.results || []));
    }
    if (results.length > 0) return { transactions: results, endpoint: 'economie.gouv' };
    errors.push('economie.gouv: 0 résultats');
  } catch (e) { errors.push(`economie.gouv: ${e.message}`); }

  // Endpoint 3 — cquest
  try {
    const results = [];
    for (const tl of typesLocaux) {
      const pk = useDept ? 'code_departement' : 'code_commune';
      const pv = useDept ? deptCode : codeCommune;
      const url = `https://api.cquest.org/dvf?${pk}=${pv}&nature_mutation=Vente&limit=300`;
      const r = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      results.push(...(data.resultats || []).filter(t => !t.type_local || t.type_local === tl));
    }
    if (results.length > 0) return { transactions: results, endpoint: 'cquest' };
    errors.push('cquest: 0 résultats');
  } catch (e) { errors.push(`cquest: ${e.message}`); }

  return { transactions: [], endpoint: null };
}

// ─── Normaliser une rue pour le regroupement ──────────────────────────────────

function normaliserRue(t) {
  const voie = (t.voie || t.type_voie || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  const cp = t.code_postal || '';
  return `${cp}-${voie}`;
}

// ─── Argumentaire de prospection ──────────────────────────────────────────────

function genererArgumentProsSpection(type, surface, plusValuePct, densiteRue, profil, ville) {
  const args = [];
  if (plusValuePct && plusValuePct >= 20) {
    args.push(`"Votre ${type === 'maison' ? 'maison' : 'appartement'} vaut aujourd'hui environ +${plusValuePct}% de plus qu'il y a ${profil.anciennete_moy} ans — c'est le bon moment pour capitaliser."`);
  }
  if (densiteRue >= 3) {
    args.push(`"${densiteRue} biens ont été vendus dans votre rue récemment — le marché est très actif dans votre secteur."`);
  }
  if (surface >= 80) {
    args.push(`"Les ${Math.round(surface)}m² sont très recherchés par les familles — la demande est forte pour ce type de bien."`);
  }
  if (profil.rotation === 'lente') {
    args.push(`"${ville} est une ville où les propriétaires restent longtemps — ceux qui vendent maintenant profitent d'une forte demande accumulée."`);
  }
  return args;
}

// ─── Cache / utilitaires ──────────────────────────────────────────────────────

async function getCache(cacheKey) {
  try {
    const cutoff = new Date(Date.now() - 6 * 3600 * 1000).toISOString();
    const { data } = await supabaseAdmin.from('dvf_cache').select('resultats').eq('cache_key', cacheKey).gte('cached_at', cutoff).maybeSingle();
    return data?.resultats || null;
  } catch { return null; }
}

async function setCache(cacheKey, ville, resultats) {
  try {
    await supabaseAdmin.from('dvf_cache').upsert([{ cache_key: cacheKey, ville, resultats, cached_at: new Date().toISOString() }], { onConflict: 'cache_key' });
  } catch {}
}

function fetchWithTimeout(url, ms) {
  return fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'ProspectBot/1.0' }, signal: AbortSignal.timeout(ms) });
}

async function resolveCodeCommune(ville) {
  const CODES = {
    paris: '75056', lyon: '69123', marseille: '13055', toulouse: '31555',
    nice: '06088', nantes: '44109', montpellier: '34172', strasbourg: '67482',
    bordeaux: '33063', lille: '59350', rennes: '35238', reims: '51454',
    toulon: '83137', grenoble: '38185', dijon: '21231', angers: '49007',
    aix_en_provence: '13001', blagnac: '31069', tournefeuille: '31557', colomiers: '31149',
    castanet_tolosan: '31113', muret: '31395', merignac: '33281', pessac: '33318',
    villeurbanne: '69266', venissieux: '69259', saint_nazaire: '44184',
    roubaix: '59512', nancy: '54395', metz: '57463', caen: '14118',
    rouen: '76540', le_havre: '76351', amiens: '80021', orleans: '45234',
    tours: '37261', brest: '29019', mulhouse: '68224', besancon: '25056',
    bayonne: '64102', annecy: '74010', saint_etienne: '42218', pau: '64445',
    perpignan: '66136', la_rochelle: '17300', poitiers: '86194',
    clermont_ferrand: '63113', limoges: '87085', avignon: '84007',
    antibes: '06004', cannes: '06029', toulon: '83137', nimes: '30189',
    versailles: '78646',
  };
  const key = ville.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  if (CODES[key]) return CODES[key];
  // Fallback : API Geo INSEE (plus fiable qu'api-adresse pour les codes communes)
  try {
    const r = await fetchWithTimeout(
      `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(ville)}&fields=code,codesPostaux&boost=population&limit=1`,
      6000
    );
    const data = await r.json();
    return data?.[0]?.code || null;
  } catch { return null; }
}

function normaliserVille(v) {
  return v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[-\s]+/g, '_').replace(/[^a-z0-9_]/g, '').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

function capitaliser(s) {
  return String(s).charAt(0).toUpperCase() + String(s).slice(1).toLowerCase();
}
