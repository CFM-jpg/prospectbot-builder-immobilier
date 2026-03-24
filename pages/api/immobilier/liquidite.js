// pages/api/immobilier/liquidite.js
// Score de liquidité d'une zone basé sur les données DVF
// Calcule : nb jours moyen entre achats/reventes + volume trimestriel de transactions
// Cache Supabase 24h dans la table `liquidite_cache`

import { supabaseAdmin } from '../../../lib/supabase';
import { getSession } from '../../../lib/auth';

const CACHE_DURATION_HOURS = 24;

// ─── Résolution automatique ville → code_commune ─────────────────────────────
async function resolveCodeCommune(ville, codePostal = null) {
  try {
    // 1. Essai avec code postal si fourni (plus précis)
    if (codePostal) {
      const res = await fetch(
        `https://geo.api.gouv.fr/communes?codePostal=${codePostal}&fields=code,nom&limit=1`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.[0]?.code) return { code: data[0].code, nom: data[0].nom };
      }
    }

    // 2. Recherche par nom de ville
    const nomEncode = encodeURIComponent(ville.trim());
    const res = await fetch(
      `https://geo.api.gouv.fr/communes?nom=${nomEncode}&fields=code,nom,codesPostaux&boost=population&limit=1`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.[0]?.code) return { code: data[0].code, nom: data[0].nom };
    }
  } catch (e) {
    console.warn('[Liquidité] resolveCodeCommune erreur:', e.message);
  }
  return null;
}

// ─── Endpoints DVF (même stratégie fallback que le scraper existant) ──────────
const DVF_ENDPOINTS = [
  (codeCommune, limit) =>
    `https://api.dvf.etalab.gouv.fr/dvf/api/?code_commune=${codeCommune}&fields=date_mutation,valeur_fonciere,surface_reelle_bati,type_local&ordering=-date_mutation&page_size=${limit}`,
  (codeCommune, limit) =>
    `https://dvf.etalab.gouv.fr/api/dvf/?code_commune=${codeCommune}&fields=date_mutation,valeur_fonciere,surface_reelle_bati,type_local&ordering=-date_mutation&page_size=${limit}`,
];

async function fetchDVFTransactions(codeCommune, limit = 200) {
  for (const buildUrl of DVF_ENDPOINTS) {
    try {
      const url = buildUrl(codeCommune, limit);
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      return data.results || data.features || data || [];
    } catch {
      continue;
    }
  }
  return [];
}

// ─── Calcul du score liquidité ────────────────────────────────────────────────
function computeLiquidite(transactions) {
  if (!transactions.length) {
    return { score: null, label: 'Données insuffisantes', details: {} };
  }

  // 1. Volume trimestriel
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
    ? Math.round(quarters.reduce((a, b) => a + b, 0) / quarters.length)
    : 0;

  // 2. Délai moyen entre reventes (proxy : écart entre transactions sur le même type/surface)
  // On groupe par tranches de surface et on calcule l'écart médian entre transactions successives
  const sorted = [...transactions]
    .filter(t => t.date_mutation || t.properties?.date_mutation)
    .sort((a, b) => {
      const da = new Date(a.date_mutation || a.properties?.date_mutation);
      const db = new Date(b.date_mutation || b.properties?.date_mutation);
      return da - db;
    });

  const delais = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].date_mutation || sorted[i - 1].properties?.date_mutation);
    const curr = new Date(sorted[i].date_mutation || sorted[i].properties?.date_mutation);
    const jours = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
    if (jours > 0 && jours < 3650) delais.push(jours); // filtre aberrants (>10 ans)
  }

  const delaiMoyen = delais.length
    ? Math.round(delais.reduce((a, b) => a + b, 0) / delais.length)
    : null;

  // 3. Score composite 0-100
  // Volume : 200 tx/trim = 100pts, <20 = 0pts
  const scoreVolume = Math.min(100, Math.round((volumeMoyenTrimestriel / 200) * 100));

  // Délai : <30j = 100pts (très actif), >365j = 0pts
  let scoreDelai = 50; // neutre si pas calculable
  if (delaiMoyen !== null) {
    if (delaiMoyen <= 30) scoreDelai = 100;
    else if (delaiMoyen >= 365) scoreDelai = 0;
    else scoreDelai = Math.round(100 - ((delaiMoyen - 30) / 335) * 100);
  }

  const score = Math.round(scoreVolume * 0.5 + scoreDelai * 0.5);

  // 4. Label
  let label, couleur;
  if (score >= 75) { label = 'Marché très actif'; couleur = 'green'; }
  else if (score >= 50) { label = 'Marché fluide'; couleur = 'blue'; }
  else if (score >= 25) { label = 'Marché tendu'; couleur = 'orange'; }
  else { label = 'Marché peu liquide'; couleur = 'red'; }

  // 5. Interprétation agent
  let conseil;
  if (score >= 75) {
    conseil = `Ce secteur est très actif (${volumeMoyenTrimestriel} tx/trim). Les biens se vendent rapidement — argument fort pour fixer un prix ferme face à un vendeur hésitant.`;
  } else if (score >= 50) {
    conseil = `Marché équilibré avec ${volumeMoyenTrimestriel} transactions par trimestre. Délai moyen estimé : ${delaiMoyen ?? '?'} jours. Bonne dynamique pour vendre dans les 3 mois.`;
  } else if (score >= 25) {
    conseil = `Marché tendu : peu de transactions (${volumeMoyenTrimestriel}/trim). Prévoir un délai de vente plus long et une marge de négociation plus importante.`;
  } else {
    conseil = `Faible liquidité dans ce secteur. Peu d'acheteurs actifs. Recommander au vendeur un prix attractif pour déclencher rapidement une offre.`;
  }

  return {
    score,
    label,
    couleur,
    conseil,
    details: {
      volumeMoyenTrimestriel,
      delaiMoyenJours: delaiMoyen,
      nbTransactionsAnalysees: transactions.length,
      nbTrimestres: quarters.length,
    },
  };
}

// ─── Handler principal ────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' });

  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Non authentifié' });

  const { code_commune, ville, code_postal } = req.query;
  if (!code_commune && !ville) {
    return res.status(400).json({ error: 'ville requis' });
  }

  // Résolution automatique du code commune depuis la ville
  let resolvedCode = code_commune;
  let resolvedVille = ville;
  if (!resolvedCode && ville) {
    const resolved = await resolveCodeCommune(ville, code_postal);
    if (resolved) {
      resolvedCode = resolved.code;
      resolvedVille = resolved.nom;
    } else {
      return res.status(400).json({
        error: `Ville introuvable : "${ville}". Vérifiez l'orthographe.`,
      });
    }
  }

  const cacheKey = resolvedCode;

  try {
    // 1. Vérifier le cache Supabase
    const { data: cached } = await supabaseAdmin
      .from('liquidite_cache')
      .select('*')
      .eq('code_commune', cacheKey)
      .single();

    if (cached) {
      const age = (Date.now() - new Date(cached.updated_at).getTime()) / (1000 * 60 * 60);
      if (age < CACHE_DURATION_HOURS) {
        return res.status(200).json({
          success: true,
          fromCache: true,
          cacheAge: Math.round(age * 10) / 10,
          ...cached.data,
        });
      }
    }

    // 2. Fetch DVF
    const transactions = await fetchDVFTransactions(resolvedCode, 300);

    if (!transactions.length) {
      return res.status(200).json({
        success: true,
        fromCache: false,
        score: null,
        label: 'Données DVF non disponibles pour cette zone',
        conseil: 'Aucune transaction DVF trouvée. Vérifiez le code commune.',
        details: {},
      });
    }

    // 3. Calculer le score
    const result = computeLiquidite(transactions);

    // 4. Mettre en cache
    const cacheData = {
      code_commune: cacheKey,
      ville: resolvedVille || null,
      data: result,
      updated_at: new Date().toISOString(),
    };

    await supabaseAdmin
      .from('liquidite_cache')
      .upsert(cacheData, { onConflict: 'code_commune' });

    return res.status(200).json({
      success: true,
      fromCache: false,
      code_commune: resolvedCode,
      ville: resolvedVille,
      ...result,
    });
  } catch (error) {
    console.error('[Liquidité] Erreur:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/*
── TABLE SUPABASE À CRÉER ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS liquidite_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code_commune TEXT NOT NULL UNIQUE,
  ville TEXT,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_liquidite_code ON liquidite_cache(code_commune);
──────────────────────────────────────────────────────────────────────────────
*/
