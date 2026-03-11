// pages/api/scraper/vendeurs-potentiels.js
// Sources réelles combinées : DVF API → DVF Supabase → SCI/SIRENE → RPLS → Annuaires

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Données marché par ville / département ───────────────────────────────────

const PRIX_MARCHE = {
  paris: { prixMoyen: 9800, prixMedian: 9200, loyer: 28, evolution1an: -4.2, evolution3ans: 8.1, rentaBrute: 3.4 },
  lyon: { prixMoyen: 4800, prixMedian: 4500, loyer: 15, evolution1an: -2.1, evolution3ans: 12.4, rentaBrute: 3.7 },
  marseille: { prixMoyen: 3200, prixMedian: 2900, loyer: 12, evolution1an: 1.2, evolution3ans: 9.8, rentaBrute: 4.5 },
  bordeaux: { prixMoyen: 4600, prixMedian: 4300, loyer: 14, evolution1an: -3.8, evolution3ans: 18.2, rentaBrute: 3.6 },
  toulouse: { prixMoyen: 3800, prixMedian: 3500, loyer: 13, evolution1an: 0.8, evolution3ans: 14.1, rentaBrute: 4.1 },
  nice: { prixMoyen: 5200, prixMedian: 4800, loyer: 16, evolution1an: -1.5, evolution3ans: 10.3, rentaBrute: 3.7 },
  nantes: { prixMoyen: 3900, prixMedian: 3600, loyer: 13, evolution1an: -2.9, evolution3ans: 16.7, rentaBrute: 4.0 },
  strasbourg: { prixMoyen: 3600, prixMedian: 3300, loyer: 13, evolution1an: -1.2, evolution3ans: 11.5, rentaBrute: 4.3 },
  montpellier: { prixMoyen: 3700, prixMedian: 3400, loyer: 14, evolution1an: 0.4, evolution3ans: 13.2, rentaBrute: 4.5 },
  rennes: { prixMoyen: 3800, prixMedian: 3500, loyer: 13, evolution1an: -1.8, evolution3ans: 15.9, rentaBrute: 4.1 },
  lille: { prixMoyen: 3200, prixMedian: 2900, loyer: 12, evolution1an: -0.9, evolution3ans: 8.7, rentaBrute: 4.5 },
  grenoble: { prixMoyen: 2900, prixMedian: 2700, loyer: 12, evolution1an: -1.4, evolution3ans: 7.2, rentaBrute: 4.9 },
  dijon: { prixMoyen: 2500, prixMedian: 2300, loyer: 11, evolution1an: 0.2, evolution3ans: 6.8, rentaBrute: 5.3 },
  angers: { prixMoyen: 3000, prixMedian: 2800, loyer: 11, evolution1an: -1.1, evolution3ans: 14.3, rentaBrute: 4.4 },
  reims: { prixMoyen: 2300, prixMedian: 2100, loyer: 10, evolution1an: 0.8, evolution3ans: 5.4, rentaBrute: 5.2 },
  toulon: { prixMoyen: 3100, prixMedian: 2900, loyer: 12, evolution1an: 0.6, evolution3ans: 9.1, rentaBrute: 4.6 },
  saint_etienne: { prixMoyen: 1400, prixMedian: 1200, loyer: 8, evolution1an: -0.5, evolution3ans: 1.2, rentaBrute: 6.9 },
  clermont_ferrand: { prixMoyen: 2200, prixMedian: 2000, loyer: 10, evolution1an: -0.3, evolution3ans: 6.1, rentaBrute: 5.5 },
  aix_en_provence: { prixMoyen: 5400, prixMedian: 5000, loyer: 17, evolution1an: -1.8, evolution3ans: 11.4, rentaBrute: 3.8 },
  annecy: { prixMoyen: 5800, prixMedian: 5400, loyer: 18, evolution1an: -0.9, evolution3ans: 13.2, rentaBrute: 3.7 },
  bayonne: { prixMoyen: 4500, prixMedian: 4100, loyer: 14, evolution1an: -2.1, evolution3ans: 19.4, rentaBrute: 3.7 },
  pau: { prixMoyen: 2100, prixMedian: 1900, loyer: 10, evolution1an: 0.4, evolution3ans: 5.8, rentaBrute: 5.7 },
  perpignan: { prixMoyen: 1900, prixMedian: 1700, loyer: 9, evolution1an: 1.8, evolution3ans: 7.3, rentaBrute: 5.7 },
  caen: { prixMoyen: 2400, prixMedian: 2200, loyer: 10, evolution1an: -0.7, evolution3ans: 7.1, rentaBrute: 5.0 },
  rouen: { prixMoyen: 2600, prixMedian: 2400, loyer: 11, evolution1an: -0.4, evolution3ans: 7.8, rentaBrute: 5.1 },
  metz: { prixMoyen: 2200, prixMedian: 2000, loyer: 10, evolution1an: 0.1, evolution3ans: 4.9, rentaBrute: 5.5 },
  nancy: { prixMoyen: 2100, prixMedian: 1900, loyer: 10, evolution1an: -0.2, evolution3ans: 4.7, rentaBrute: 5.7 },
  tours: { prixMoyen: 2700, prixMedian: 2500, loyer: 11, evolution1an: -0.8, evolution3ans: 9.4, rentaBrute: 4.9 },
  nimes: { prixMoyen: 2300, prixMedian: 2100, loyer: 10, evolution1an: 1.1, evolution3ans: 8.9, rentaBrute: 5.2 },
  avignon: { prixMoyen: 2600, prixMedian: 2400, loyer: 11, evolution1an: 0.8, evolution3ans: 7.6, rentaBrute: 5.1 },
  // Fallbacks départementaux
  _dep06: { prixMoyen: 5000, prixMedian: 4600, loyer: 16, evolution1an: -1.2, evolution3ans: 9.8, rentaBrute: 3.8 },
  _dep13: { prixMoyen: 3400, prixMedian: 3100, loyer: 12, evolution1an: 0.9, evolution3ans: 9.2, rentaBrute: 4.2 },
  _dep31: { prixMoyen: 3600, prixMedian: 3300, loyer: 13, evolution1an: 0.6, evolution3ans: 12.8, rentaBrute: 4.3 },
  _dep33: { prixMoyen: 4200, prixMedian: 3800, loyer: 14, evolution1an: -2.9, evolution3ans: 15.7, rentaBrute: 4.0 },
  _dep34: { prixMoyen: 3500, prixMedian: 3200, loyer: 13, evolution1an: 0.5, evolution3ans: 12.1, rentaBrute: 4.4 },
  _dep35: { prixMoyen: 3600, prixMedian: 3300, loyer: 13, evolution1an: -1.6, evolution3ans: 14.2, rentaBrute: 4.3 },
  _dep38: { prixMoyen: 2800, prixMedian: 2600, loyer: 11, evolution1an: -1.1, evolution3ans: 7.4, rentaBrute: 4.7 },
  _dep44: { prixMoyen: 3700, prixMedian: 3400, loyer: 13, evolution1an: -2.4, evolution3ans: 15.1, rentaBrute: 4.2 },
  _dep59: { prixMoyen: 2900, prixMedian: 2600, loyer: 11, evolution1an: -0.7, evolution3ans: 7.8, rentaBrute: 4.6 },
  _dep67: { prixMoyen: 3400, prixMedian: 3100, loyer: 12, evolution1an: -1.0, evolution3ans: 10.2, rentaBrute: 4.2 },
  _dep69: { prixMoyen: 4600, prixMedian: 4200, loyer: 15, evolution1an: -1.9, evolution3ans: 11.8, rentaBrute: 3.9 },
  _dep74: { prixMoyen: 5200, prixMedian: 4800, loyer: 17, evolution1an: -0.8, evolution3ans: 12.4, rentaBrute: 3.9 },
  _dep75: { prixMoyen: 9800, prixMedian: 9200, loyer: 28, evolution1an: -4.2, evolution3ans: 8.1, rentaBrute: 3.4 },
  _dep76: { prixMoyen: 2400, prixMedian: 2200, loyer: 10, evolution1an: -0.3, evolution3ans: 6.2, rentaBrute: 5.0 },
  _dep83: { prixMoyen: 4200, prixMedian: 3800, loyer: 14, evolution1an: 0.4, evolution3ans: 10.8, rentaBrute: 4.0 },
  _dep92: { prixMoyen: 7800, prixMedian: 7200, loyer: 23, evolution1an: -3.8, evolution3ans: 7.4, rentaBrute: 3.5 },
  _dep93: { prixMoyen: 4500, prixMedian: 4100, loyer: 15, evolution1an: -2.5, evolution3ans: 8.9, rentaBrute: 4.0 },
  _dep94: { prixMoyen: 5200, prixMedian: 4800, loyer: 17, evolution1an: -3.1, evolution3ans: 8.2, rentaBrute: 3.9 },
  _dep95: { prixMoyen: 3800, prixMedian: 3500, loyer: 13, evolution1an: -2.2, evolution3ans: 7.6, rentaBrute: 4.1 },
  _default: { prixMoyen: 2500, prixMedian: 2200, loyer: 10, evolution1an: 0.2, evolution3ans: 5.8, rentaBrute: 5.0 },
};

function normalizeKey(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/['\s\-\.]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function getPrixMarche(ville, codeCommune) {
  const key = normalizeKey(ville);
  if (PRIX_MARCHE[key]) return PRIX_MARCHE[key];
  if (codeCommune?.length >= 2) {
    const dep = codeCommune.startsWith('97') ? codeCommune.substring(0, 3) : codeCommune.substring(0, 2);
    if (PRIX_MARCHE[`_dep${dep}`]) return PRIX_MARCHE[`_dep${dep}`];
  }
  return PRIX_MARCHE._default;
}

function calculerScore(item, prixRef) {
  let score = 0;
  if (item.adresse) score += 5;
  if (item.id) score += 10;
  if (item.surface > 0) score += 8;
  if (item.pieces > 0) score += 5;
  if (prixRef && item.prix && item.surface) {
    const prixM2 = item.prix / item.surface;
    const pv = ((prixM2 - prixRef) / prixRef) * 100;
    score += pv >= 30 ? 30 : pv >= 15 ? 22 : pv >= 0 ? 12 : 5;
  }
  if (item.date) {
    const mois = (Date.now() - new Date(item.date).getTime()) / (1000 * 60 * 60 * 24 * 30);
    score += mois <= 6 ? 15 : mois <= 18 ? 10 : mois <= 36 ? 5 : 0;
  }
  // Bonus profil
  if (item.source === 'sci') score += 20; // SCI = fort potentiel de vente
  if (item.source === 'rpls') score += 15; // Bailleur identifié
  if (item.multi_proprietaire) score += 10;
  return Math.min(score, 100);
}

function scoreLabel(score) {
  if (score >= 85) return 'Vendeur chaud';
  if (score >= 70) return 'Vendeur motivé';
  if (score >= 50) return 'Prospect tiède';
  if (score >= 30) return 'Prospect froid';
  return 'À qualifier';
}

// ─── SOURCE 1 : DVF API Etalab ────────────────────────────────────────────────

async function fetchDVFApi(codeCommune, type, surfaceMin) {
  try {
    const typeNature = type === 'maison' ? 'Maison' : type === 'appartement' ? 'Appartement' : null;
    let url = `https://api.dvf.etalab.gouv.fr/geoapi/mutations/?code_commune=${codeCommune}&fields=id_mutation,date_mutation,valeur_fonciere,surface_reelle_bati,type_local,adresse_nom_voie,adresse_numero,longitude,latitude,nombre_pieces_principales&page_size=150`;
    const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!res.ok) {
      console.log("[SCI/SIRENE] HTTP", res.status);
      return [];
    }
    const data = await res.json();
    let results = (data.results || []).filter(r => r.valeur_fonciere > 0);
    if (typeNature) results = results.filter(r => r.type_local === typeNature);
    if (surfaceMin > 0) results = results.filter(r => (r.surface_reelle_bati || 0) >= surfaceMin);
    return results.map(t => ({
      id: t.id_mutation,
      source: 'dvf_api',
      adresse: [t.adresse_numero, t.adresse_nom_voie].filter(Boolean).join(' '),
      date: t.date_mutation,
      prix: t.valeur_fonciere,
      surface: t.surface_reelle_bati,
      pieces: t.nombre_pieces_principales,
      type: t.type_local,
      latitude: t.latitude,
      longitude: t.longitude,
      contact: null,
    }));
  } catch (e) {
    console.log('[DVF API] Erreur:', e.message);
    return [];
  }
}

// ─── SOURCE 2 : DVF Supabase (fichier complet importé trimestriellement) ──────

async function fetchDVFSupabase(codeCommune, ville, type, surfaceMin) {
  try {
    const typeNature = type === 'maison' ? 'Maison' : type === 'appartement' ? 'Appartement' : null;
    let query = supabase
      .from('dvf_transactions')
      .select('id_mutation, date_mutation, valeur_fonciere, surface_reelle_bati, type_local, adresse_nom_voie, adresse_numero, latitude, longitude, nombre_pieces_principales, code_commune')
      .or(`code_commune.eq.${codeCommune},commune.ilike.%${ville}%`)
      .gt('valeur_fonciere', 0)
      .order('date_mutation', { ascending: false })
      .limit(150);
    if (typeNature) query = query.eq('type_local', typeNature);
    if (surfaceMin > 0) query = query.gte('surface_reelle_bati', surfaceMin);
    const { data, error } = await query;
    if (error || !data?.length) return [];
    return data.map(t => ({
      id: t.id_mutation,
      source: 'dvf_supabase',
      adresse: [t.adresse_numero, t.adresse_nom_voie].filter(Boolean).join(' '),
      date: t.date_mutation,
      prix: t.valeur_fonciere,
      surface: t.surface_reelle_bati,
      pieces: t.nombre_pieces_principales,
      type: t.type_local,
      latitude: t.latitude,
      longitude: t.longitude,
      contact: null,
    }));
  } catch (e) {
    console.log('[DVF Supabase] Erreur:', e.message);
    return [];
  }
}

// ─── SOURCE 3 : SCI / SIRENE (propriétaires personnes morales) ───────────────

async function fetchSCI(ville, codeCommune) {
  if (!process.env.INSEE_API_KEY) return [];
  try {
    // SIRENE API — cherche les SCI (code NAF 6820A = location immobilière) dans la ville
    const dep = codeCommune?.substring(0, 2) || '';
    const url = `https://api.insee.fr/entreprises/sirene/V3.11/siret?q=activitePrincipaleUniteLegale:6820A+AND+codePostalEtablissement:${dep}*&nombre=100&champs=siret,denominationUniteLegale,adresseEtablissement,dateCreationUniteLegale`;
    const res = await fetch(url, {
      headers: { 'X-INSEE-Api-Key-Integration': process.env.INSEE_API_KEY },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      console.log("[SCI/SIRENE] HTTP", res.status);
      return [];
    }
    const data = await res.json();
    const etablissements = data.etablissements || [];
    return etablissements
      .filter(e => {
        const adr = e.adresseEtablissement;
        return adr?.libelleCommuneEtablissement?.toLowerCase().includes(normalizeKey(ville).replace(/_/g, ' '));
      })
      .map(e => {
        const adr = e.adresseEtablissement;
        return {
          id: e.siret,
          source: 'sci',
          nom: e.denominationUniteLegale,
          adresse: [adr?.numeroVoieEtablissement, adr?.typeVoieEtablissement, adr?.libelleVoieEtablissement].filter(Boolean).join(' '),
          ville: adr?.libelleCommuneEtablissement,
          codePostal: adr?.codePostalEtablissement,
          siret: e.siret,
          dateCreation: e.dateCreationUniteLegale,
          type: 'SCI',
          surface: null,
          pieces: null,
          prix: null,
          date: null,
          latitude: null,
          longitude: null,
          contact: null,
          profil: 'SCI — propriétaire personne morale, potentiel de cession élevé',
          multi_proprietaire: true,
        };
      });
  } catch (e) {
    console.log('[SCI/SIRENE] Erreur:', e.message);
    return [];
  }
}

// ─── SOURCE 4 : RPLS (Répertoire des Logements Locatifs Sociaux) ──────────────

async function fetchRPLS(codeCommune, ville) {
  try {
    // data.gouv.fr RPLS API
    const url = `https://data.ademe.fr/data-fair/api/v1/datasets/rpls-2022/lines?q=${encodeURIComponent(ville)}&q_fields=LIBCOM&size=100&select=NUMSER,LIBCOM,ADRESSE,CONSTRUCT,SURF,NBPIECE,TYPFINANCEMENT,GESTIONNAIRE`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) {
      // Fallback : API data.gouv.fr RPLS officielle
      const url2 = `https://tabular-api.data.gouv.fr/api/resources/b4afdd02-abf0-4dc9-9b38-80d3e6ad8513/data/?CODECOMMUNE__exact=${codeCommune}&page_size=100`;
      const res2 = await fetch(url2, { signal: AbortSignal.timeout(6000) });
      if (!res2.ok) return [];
      const data2 = await res2.json();
      return (data2.data || []).map(r => ({
        id: `rpls_${r.NUMSER || Math.random()}`,
        source: 'rpls',
        adresse: r.ADRESSE || '',
        ville: r.LIBCOM || ville,
        date: null,
        prix: null,
        surface: r.SURF ? parseFloat(r.SURF) : null,
        pieces: r.NBPIECE ? parseInt(r.NBPIECE) : null,
        type: 'Logement social',
        latitude: null,
        longitude: null,
        contact: r.GESTIONNAIRE || null,
        profil: `Bailleur social identifié — gestionnaire : ${r.GESTIONNAIRE || 'N/A'}`,
        multi_proprietaire: true,
      }));
    }
    const data = await res.json();
    return (data.results || data.items || []).map(r => ({
      id: `rpls_${r.NUMSER || Math.random()}`,
      source: 'rpls',
      adresse: r.ADRESSE || '',
      ville: r.LIBCOM || ville,
      date: null,
      prix: null,
      surface: r.SURF ? parseFloat(r.SURF) : null,
      pieces: r.NBPIECE ? parseInt(r.NBPIECE) : null,
      type: 'Logement social',
      latitude: null,
      longitude: null,
      contact: r.GESTIONNAIRE || null,
      profil: `Bailleur social — gestionnaire : ${r.GESTIONNAIRE || 'N/A'}`,
      multi_proprietaire: true,
    }));
  } catch (e) {
    console.log('[RPLS] Erreur:', e.message);
    return [];
  }
}

// ─── SOURCE 5 : Annuaires (enrichissement contact via adresse) ────────────────

async function enrichirContacts(vendeurs) {
  // Pages Jaunes API officielle ou service tiers
  // On enrichit uniquement les vendeurs sans contact et avec une adresse
  const aEnrichir = vendeurs.filter(v => !v.contact && v.adresse);
  if (!aEnrichir.length || !process.env.PAGES_JAUNES_API_KEY) return vendeurs;

  const enrichis = await Promise.allSettled(
    aEnrichir.slice(0, 20).map(async v => { // Max 20 appels pour ne pas dépasser les quotas
      try {
        const query = encodeURIComponent(`${v.adresse} ${v.ville || ''}`);
        const res = await fetch(
          `https://api.pagesjaunes.fr/v1/pros?what=particulier&where=${query}&api_key=${process.env.PAGES_JAUNES_API_KEY}`,
          { signal: AbortSignal.timeout(3000) }
        );
        if (!res.ok) return v;
        const data = await res.json();
        const premier = data.search_results?.ads?.[0];
        if (premier) {
          return {
            ...v,
            contact: {
              nom: premier.name || null,
              telephone: premier.phone_numbers?.[0]?.number || null,
              source_contact: 'pages_jaunes',
            },
          };
        }
        return v;
      } catch {
        return v;
      }
    })
  );

  const mapEnrichis = {};
  enrichis.forEach((r, i) => {
    if (r.status === 'fulfilled') mapEnrichis[aEnrichir[i].id] = r.value;
  });

  return vendeurs.map(v => mapEnrichis[v.id] || v);
}

// ─── Résolution code commune ──────────────────────────────────────────────────

async function resolveCodeCommune(ville) {
  try {
    const res = await fetch(
      `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(ville)}&fields=code,nom,codesPostaux&boost=population&limit=1`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0]?.code || null;
  } catch {
    return null;
  }
}

// ─── Handler principal ────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { ville, type = 'all', surfaceMin = 0, scoreMin = 0, limit = 60 } = req.body;
  if (!ville?.trim()) return res.status(400).json({ error: 'Ville requise' });

  try {
    // 1. Code commune + données marché
    const codeCommune = await resolveCodeCommune(ville);
    const prixData = getPrixMarche(ville, codeCommune);
    console.log(`[Vendeurs] ${ville} → code commune: ${codeCommune}`);

    // 2. Lancer toutes les sources en parallèle
    const [dvfApi, dvfSupa, sci, rpls] = await Promise.all([
      codeCommune ? fetchDVFApi(codeCommune, type, surfaceMin) : [],
      codeCommune ? fetchDVFSupabase(codeCommune, ville, type, surfaceMin) : [],
      codeCommune ? fetchSCI(ville, codeCommune) : [],
      codeCommune ? fetchRPLS(codeCommune, ville) : [],
    ]);

    console.log(`[Vendeurs] DVF API: ${dvfApi.length} | DVF Supabase: ${dvfSupa.length} | SCI: ${sci.length} | RPLS: ${rpls.length}`);

    // 3. Dédupliquer (DVF API prioritaire sur DVF Supabase)
    const dvfIds = new Set(dvfApi.map(v => v.id));
    const dvfSupaDedup = dvfSupa.filter(v => !dvfIds.has(v.id));

    // 4. Fusionner toutes les sources
    const tous = [...dvfApi, ...dvfSupaDedup, ...sci, ...rpls];

    // 5. Calculer les scores
    const avecScores = tous.map(v => {
      const score = calculerScore(v, prixData.prixMoyen);
      return {
        ...v,
        score,
        scoreLabel: scoreLabel(score),
        prixM2: v.prix && v.surface ? Math.round(v.prix / v.surface) : null,
        plusValueEstimee: v.prix && v.surface && prixData.prixMoyen
          ? (() => {
              const pct = ((v.prix / v.surface - prixData.prixMoyen) / prixData.prixMoyen * 100).toFixed(1);
              return `${pct > 0 ? '+' : ''}${pct}%`;
            })()
          : null,
      };
    });

    // 6. Filtrer et trier
    let vendeurs = avecScores
      .filter(v => v.score >= scoreMin)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // 7. Enrichissement contacts via annuaires (async, best effort)
    vendeurs = await enrichirContacts(vendeurs);

    // 8. Stats par source
    const statsSources = {
      dvf_api: dvfApi.length,
      dvf_supabase: dvfSupaDedup.length,
      sci: sci.length,
      rpls: rpls.length,
      total_brut: tous.length,
      apres_filtre: vendeurs.length,
    };

    return res.status(200).json({
      success: true,
      ville,
      codeCommune,
      vendeurs,
      total: vendeurs.length,
      sources: statsSources,
      analyse: {
        prixMoyenM2: prixData.prixMoyen,
        prixMedianM2: prixData.prixMedian,
        evolution1an: prixData.evolution1an,
        evolution3ans: prixData.evolution3ans,
        loyerMoyenM2: prixData.loyer,
        rentabiliteBrute: prixData.rentaBrute,
      },
    });

  } catch (err) {
    console.error('[Vendeurs] Erreur:', err);
    return res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
}
