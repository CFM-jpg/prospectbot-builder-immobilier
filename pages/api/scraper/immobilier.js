// pages/api/scraper/immobilier.js
// Données de marché immobilier via APIs DVF officielles françaises
// Stratégie : retry automatique sur 3 endpoints DVF + cache Supabase 24h
// Endpoints testés dans l'ordre :
//   1. api.dvf.etalab.gouv.fr (OData officiel)
//   2. api.cquest.org/dvf      (proxy communautaire)
//   3. data.economie.gouv.fr   (open data officiel)
// Si tous down → erreur claire renvoyée au client

import { supabaseAdmin } from '../../../lib/supabase';
import { getSession } from '../../../lib/auth';

// ─── Config ───────────────────────────────────────────────────────────────────

const CACHE_TTL_HOURS = 24;
const FETCH_TIMEOUT_MS = 15000;
const MAX_RESULTS = 30;

// ─── Handler principal ─────────────────────────────────────────────────────────

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
    // Étape 1 — Résoudre la ville en code INSEE
    const codeCommune = await resolveCodeCommune(params.ville);
    if (!codeCommune) {
      return res.status(400).json({
        success: false,
        error: `Ville introuvable : "${ville}". Essayez le nom complet (ex: "Paris", "Lyon", "Nantes").`,
        annonces: [],
        stats: { annoncesTouvees: 0, nouvellesAnnonces: 0, source: 'dvf' },
      });
    }

    // Étape 2 — Vérifier le cache Supabase (évite de re-appeler DVF si données fraîches)
    const cacheKey = `${codeCommune}-${type}`;
    const cached = await getCachedTransactions(cacheKey);
    let rawTransactions;
    let source;

    if (cached) {
      rawTransactions = cached;
      source = 'cache';
      console.log(`[DVF] Cache hit pour ${ville} (${rawTransactions.length} entrées)`);
    } else {
      // Étape 3 — Appeler DVF avec retry multi-endpoints
      const result = await fetchDVFWithRetry(codeCommune, type);
      rawTransactions = result.transactions;
      source = result.endpoint;
      console.log(`[DVF] ${rawTransactions.length} transactions via ${source}`);

      // Mettre en cache si résultats
      if (rawTransactions.length > 0) {
        await setCachedTransactions(cacheKey, ville, rawTransactions);
      }
    }

    // Filtrer selon les critères utilisateur
    const filtered = filterTransactions(rawTransactions, params);
    const formatted = formatTransactions(filtered, ville, type);

    // Étape 4 — Sauvegarder les nouvelles en base
    let nouvellesAnnonces = 0;
    const annoncesInserees = [];

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
          const { data, error } = await supabaseAdmin
            .from('biens')
            .insert([{ ...annonce, agent_email: agentEmail }])
            .select('id')
            .single();

          if (!error && data) {
            nouvellesAnnonces++;
            annoncesInserees.push({ ...annonce, id: data.id });
          }
        }
      } catch (err) {
        console.error('[DVF] Erreur insert bien:', err.message);
      }
    }

    // Log de l'analyse
    try {
      await supabaseAdmin.from('scraper_logs').insert([{
        source,
        agent_email: agentEmail,
        date: new Date().toISOString(),
        parametres: { ville, prixMin, prixMax, surfaceMin, type },
        resultat: { annoncesTouvees: formatted.length, nouvellesAnnonces },
      }]);
    } catch {}

    return res.status(200).json({
      success: true,
      message: formatted.length === 0
        ? `Aucune transaction trouvée à ${ville} pour ces critères`
        : `${nouvellesAnnonces} nouvelles transactions importées (${formatted.length} analysées)`,
      stats: { annoncesTouvees: formatted.length, nouvellesAnnonces, source },
      annonces: annoncesInserees,
    });

  } catch (error) {
    console.error('[DVF] Erreur scraper:', error.message);
    return res.status(500).json({
      success: false,
      error: `Erreur : ${error.message}`,
      annonces: [],
      stats: { annoncesTouvees: 0, nouvellesAnnonces: 0, source: 'dvf' },
    });
  }
}

// ─── Retry multi-endpoints DVF ─────────────────────────────────────────────────

async function fetchDVFWithRetry(codeCommune, type) {
  const typeLocal = type === 'appartement' ? 'Appartement' : 'Maison';
  const deptMap = { '75056': '75', '69123': '69', '13055': '13' };
  const useDept = !!deptMap[codeCommune];
  const deptCode = deptMap[codeCommune];

  const errors = [];

  // ── Endpoint 1 : API OData officielle Etalab ──────────────────────────────
  try {
    const filterParts = [
      `nature_mutation eq 'Vente'`,
      `type_local eq '${typeLocal}'`,
      useDept
        ? `startswith(code_commune,'${deptCode}')`
        : `code_commune eq '${codeCommune}'`,
    ];
    const params = new URLSearchParams({
      '$filter': filterParts.join(' and '),
      '$top': '100',
      '$orderby': 'date_mutation desc',
    });
    const url = `https://api.dvf.etalab.gouv.fr/api/odata/v1/Ventes?${params.toString()}`;
    const res = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const transactions = (data.value || []).filter(t => t.type_local === typeLocal);
    if (transactions.length > 0) return { transactions, endpoint: 'etalab-odata' };
    errors.push('etalab-odata: 0 résultats');
  } catch (e) {
    errors.push(`etalab-odata: ${e.message}`);
    console.warn('[DVF] Endpoint 1 échoué:', e.message);
  }

  // ── Endpoint 2 : api.cquest.org ───────────────────────────────────────────
  try {
    const paramKey = useDept ? 'code_departement' : 'code_commune';
    const paramVal = useDept ? deptCode : codeCommune;
    const url = `https://api.cquest.org/dvf?${paramKey}=${paramVal}&nature_mutation=Vente&limit=100`;
    const res = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const transactions = (data.resultats || []).filter(
      t => !t.type_local || t.type_local === typeLocal
    );
    if (transactions.length > 0) return { transactions, endpoint: 'cquest' };
    errors.push('cquest: 0 résultats');
  } catch (e) {
    errors.push(`cquest: ${e.message}`);
    console.warn('[DVF] Endpoint 2 échoué:', e.message);
  }

  // ── Endpoint 3 : data.economie.gouv.fr ───────────────────────────────────
  try {
    const whereClause = useDept
      ? `startswith(code_commune, '${deptCode}') and type_local="${typeLocal}"`
      : `code_commune="${codeCommune}" and type_local="${typeLocal}"`;
    const params = new URLSearchParams({
      limit: '100',
      where: whereClause,
      select: 'id_mutation,date_mutation,valeur_fonciere,type_local,surface_reelle_bati,nombre_pieces_principales,no_voie,type_voie,voie,code_postal,nom_commune,code_commune,nombre_lots',
      order_by: 'date_mutation DESC',
    });
    const url = `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/dvf-plus-open-data-immo/records?${params.toString()}`;
    const res = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const transactions = data.results || [];
    if (transactions.length > 0) return { transactions, endpoint: 'economie.gouv' };
    errors.push('economie.gouv: 0 résultats');
  } catch (e) {
    errors.push(`economie.gouv: ${e.message}`);
    console.warn('[DVF] Endpoint 3 échoué:', e.message);
  }

  // Tous les endpoints ont échoué
  throw new Error(
    `Les services DVF sont temporairement indisponibles. Réessayez dans quelques minutes. (${errors.join(' | ')})`
  );
}

// ─── Fetch avec timeout ────────────────────────────────────────────────────────

function fetchWithTimeout(url, ms) {
  return fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'ProspectBot/1.0',
    },
    signal: AbortSignal.timeout(ms),
  });
}

// ─── Cache Supabase ────────────────────────────────────────────────────────────

async function getCachedTransactions(cacheKey) {
  try {
    const cutoff = new Date(Date.now() - CACHE_TTL_HOURS * 3600 * 1000).toISOString();
    const { data } = await supabaseAdmin
      .from('dvf_cache')
      .select('transactions')
      .eq('cache_key', cacheKey)
      .gte('cached_at', cutoff)
      .maybeSingle();
    return data?.transactions || null;
  } catch {
    return null; // Table dvf_cache absente → pas bloquant
  }
}

async function setCachedTransactions(cacheKey, ville, transactions) {
  try {
    await supabaseAdmin
      .from('dvf_cache')
      .upsert([{
        cache_key: cacheKey,
        ville,
        transactions,
        cached_at: new Date().toISOString(),
      }], { onConflict: 'cache_key' });
  } catch {
    // Non bloquant
  }
}

// ─── Filtrage ──────────────────────────────────────────────────────────────────

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

// ─── Formatage pour la base ────────────────────────────────────────────────────

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
      source: 'dvf',
      reference: ref,
      titre: `${typeLocal} ${surface}m² ${pieces ? `· ${pieces}p ` : ''}— ${villeNom}`,
      prix,
      adresse: adresse || '',
      ville: villeNom,
      code_postal: cp,
      surface,
      pieces,
      chambres: null,
      description: [
        `Transaction DVF du ${new Date(dateStr).toLocaleDateString('fr-FR')}`,
        prixM2 ? `Prix au m² : ${prixM2.toLocaleString('fr-FR')} €/m²` : '',
        t.nombre_lots ? `${t.nombre_lots} lot(s)` : '',
        cp ? `Code postal : ${cp}` : '',
      ].filter(Boolean).join(' · '),
      lien: `https://app.dvf.etalab.gouv.fr/`,
      image: null,
      type: type === 'appartement' ? 'appartement' : 'maison',
      statut: 'vendu',
      dpe: null,
      created_at: new Date().toISOString(),
    };
  });
}

// ─── Résolution ville → code INSEE ────────────────────────────────────────────

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
  };

  const key = ville.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_');

  if (CODES_DIRECTS[key]) return CODES_DIRECTS[key];

  try {
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(ville)}&type=municipality&limit=1`;
    const res = await fetchWithTimeout(url, 8000);
    if (!res.ok) return null;
    const data = await res.json();
    return data.features?.[0]?.properties?.citycode || null;
  } catch {
    return null;
  }
}
