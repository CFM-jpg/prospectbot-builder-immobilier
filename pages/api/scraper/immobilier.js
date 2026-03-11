// pages/api/scraper/immobilier.js
// Scraper unifié — appels directs sans ScraperAPI

import { supabaseAdmin } from '../../../lib/supabase';
import { getSession } from '../../../lib/auth';
import * as cheerio from 'cheerio';

// Headers communs qui imitent un vrai navigateur Chrome français
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
};

// Fetch robuste avec retry automatique (2 tentatives)
async function fetchWithRetry(url, options = {}, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(options.timeout || 20000),
      });
      return res;
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Non authentifié' });
  const agentEmail = session.email;

  const {
    source = 'bienici',
    ville = 'paris',
    prixMin = 0,
    prixMax = 1000000,
    surfaceMin = 0,
    type = 'appartement',
    rayon = 20,
  } = req.method === 'POST' ? req.body : req.query;

  try {
    let annonces = [];

    if (source === 'bienici') {
      annonces = await scraperBienici({ ville, prixMin, prixMax, surfaceMin, type });
    } else if (source === 'leboncoin') {
      annonces = await scraperLeBonCoin({ ville, prixMin, prixMax, type, rayon });
    } else if (source === 'seloger') {
      annonces = await scraperSeLoger({ ville, prixMin, prixMax, surfaceMin, type });
    } else {
      return res.status(400).json({ success: false, error: `Source inconnue : ${source}`, annonces: [] });
    }

    let nouvellesAnnonces = 0;
    const annoncesInsereees = [];

    for (const annonce of annonces) {
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
            annoncesInsereees.push({ ...annonce, id: data.id });
          }
        }
      } catch (err) {
        console.error('Erreur insert annonce:', err.message);
      }
    }

    await supabaseAdmin.from('scraper_logs').insert([{
      source,
      agent_email: agentEmail,
      date: new Date().toISOString(),
      parametres: { ville, prixMin, prixMax, surfaceMin, type },
      resultat: { annoncesTouvees: annonces.length, nouvellesAnnonces },
    }]).catch(() => {});

    return res.status(200).json({
      success: true,
      message: annonces.length === 0
        ? `Aucune annonce trouvée sur ${source} pour ces critères`
        : `${nouvellesAnnonces} nouvelles annonces importées (${annonces.length} trouvées)`,
      stats: { annoncesTouvees: annonces.length, nouvellesAnnonces, source },
      annonces: annoncesInsereees,
    });

  } catch (error) {
    console.error(`Erreur scraper ${source}:`, error.message);
    const isBlocked = error.message?.includes('403') || error.message?.includes('bloqué') || error.message?.includes('captcha');
    return res.status(isBlocked ? 429 : 500).json({
      success: false,
      error: isBlocked
        ? `${source} a bloqué la requête. Réessayez dans quelques minutes.`
        : `Erreur scraping ${source} : ${error.message}`,
      annonces: [],
      stats: { annoncesTouvees: 0, nouvellesAnnonces: 0, source },
    });
  }
}

// ─── BienIci — API JSON directe ──────────────────────────────────────────────

async function scraperBienici({ ville, prixMin, prixMax, surfaceMin, type }) {
  const filters = {
    size: 24,
    from: 0,
    filters: {
      ranges: {
        prix: { min: parseInt(prixMin), max: parseInt(prixMax) },
        ...(parseInt(surfaceMin) > 0 && { surfaceArea: { min: parseInt(surfaceMin) } }),
      },
      terms: {
        propertyType: [type === 'appartement' ? 'flat' : 'house'],
      },
      places: [{ summary: ville }],
    },
    sortBy: 'publicationDate',
    sortOrder: 'desc',
  };

  const targetUrl = `https://www.bienici.com/realEstateAds.json?filters=${encodeURIComponent(JSON.stringify(filters))}`;

  const response = await fetchWithRetry(targetUrl, {
    headers: {
      ...BROWSER_HEADERS,
      'Accept': 'application/json, text/plain, */*',
      'Referer': 'https://www.bienici.com/recherche/achat/france/appartement',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
    },
    timeout: 20000,
  });

  if (!response.ok) throw new Error(`BienIci HTTP ${response.status}`);

  const text = await response.text();
  if (text.trim().startsWith('<')) throw new Error('BienIci a bloqué la requête (réponse HTML)');

  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error('Réponse non-JSON de BienIci'); }

  if (!data.realEstateAds || !Array.isArray(data.realEstateAds)) return [];

  return data.realEstateAds
    .filter(ad => ad.id && ad.price && ad.city)
    .map(ad => ({
      source: 'bienici',
      reference: `BI-${ad.id}`,
      titre: ad.title || `${mapType(ad.propertyType)} ${ad.surfaceArea ? ad.surfaceArea + 'm²' : ''} à ${ad.city}`,
      prix: ad.price,
      adresse: ad.address || '',
      ville: ad.city,
      code_postal: ad.postalCode || '',
      surface: ad.surfaceArea || null,
      pieces: ad.roomsQuantity || null,
      chambres: ad.bedroomsQuantity || null,
      description: ad.description || '',
      lien: `https://www.bienici.com/annonce/${ad.id}`,
      image: ad.photos?.[0]?.url || null,
      type: mapType(ad.propertyType),
      statut: 'disponible',
      dpe: ad.energyClassification || null,
      created_at: new Date().toISOString(),
    }));
}

// ─── LeBonCoin — API interne JSON ────────────────────────────────────────────

async function scraperLeBonCoin({ ville, prixMin, prixMax, type, rayon }) {
  // Coordonnées principales des villes françaises
  const COORDS = {
    paris: { lat: 48.8566, lng: 2.3522 },
    lyon: { lat: 45.7640, lng: 4.8357 },
    marseille: { lat: 43.2965, lng: 5.3698 },
    bordeaux: { lat: 44.8378, lng: -0.5792 },
    toulouse: { lat: 43.6047, lng: 1.4442 },
    nantes: { lat: 47.2184, lng: -1.5536 },
    nice: { lat: 43.7102, lng: 7.2620 },
    lille: { lat: 50.6292, lng: 3.0573 },
    strasbourg: { lat: 48.5734, lng: 7.7521 },
    rennes: { lat: 48.1173, lng: -1.6778 },
  };

  const villeKey = ville.toLowerCase().replace(/[^a-z]/g, '');
  const coords = COORDS[villeKey] || COORDS['paris'];

  const payload = JSON.stringify({
    filters: {
      category: { id: type === 'appartement' ? '10' : '9' },
      enums: { ad_type: ['offer'] },
      location: {
        area: { lat: coords.lat, lng: coords.lng, radius: parseInt(rayon) * 1000 },
      },
      ranges: {
        price: { min: parseInt(prixMin), max: parseInt(prixMax) },
      },
    },
    limit: 35,
    offset: 0,
    sort_by: 'time',
    sort_order: 'desc',
    owner_type: 'all',
  });

  const response = await fetchWithRetry('https://api.leboncoin.fr/api/adfinder/v1/search', {
    method: 'POST',
    headers: {
      ...BROWSER_HEADERS,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api_key': 'ba0c2dad52b3565c9eabb20a0b1d0b44',
      'Referer': 'https://www.leboncoin.fr/',
      'Origin': 'https://www.leboncoin.fr',
    },
    body: payload,
    timeout: 25000,
  });

  if (!response.ok) throw new Error(`LeBonCoin API HTTP ${response.status}`);

  const text = await response.text();
  if (text.trim().startsWith('<')) throw new Error('LeBonCoin a bloqué la requête');

  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error('Réponse non-JSON de LeBonCoin'); }

  if (!data.ads || !Array.isArray(data.ads)) return [];

  return data.ads
    .filter(ad => ad.subject && ad.price?.[0])
    .map(ad => {
      const attrs = {};
      (ad.attributes || []).forEach(a => { attrs[a.key] = a.value; });
      return {
        source: 'leboncoin',
        reference: `LBC-${ad.list_id}`,
        titre: ad.subject,
        prix: ad.price?.[0] || null,
        adresse: ad.location?.city_label || ad.location?.city || '',
        ville: ad.location?.city || '',
        code_postal: ad.location?.zipcode || '',
        surface: attrs.square ? parseInt(attrs.square) : null,
        pieces: attrs.rooms ? parseInt(attrs.rooms) : null,
        chambres: attrs.bedrooms ? parseInt(attrs.bedrooms) : null,
        description: ad.body || '',
        lien: `https://www.leboncoin.fr/annonce/${ad.list_id}`,
        image: ad.images?.urls_large?.[0] || ad.images?.urls?.[0] || null,
        type: type === 'appartement' ? 'appartement' : 'maison',
        statut: 'disponible',
        created_at: new Date().toISOString(),
      };
    });
}

// ─── SeLoger — API JSON interne ──────────────────────────────────────────────

async function scraperSeLoger({ ville, prixMin, prixMax, surfaceMin, type }) {
  const typeCode = type === 'appartement' ? '2' : '1';

  // Utiliser l'endpoint de recherche JSON de SeLoger
  const params = new URLSearchParams({
    types: typeCode,
    places: JSON.stringify([{ summary: ville }]),
    price: `${prixMin}/${prixMax}`,
    surface: `${surfaceMin || 0}/NaN`,
    enterprise: '0',
    qsVersion: '1.0',
    nb_results: '25',
  });

  const targetUrl = `https://www.seloger.com/list.htm?${params.toString()}`;

  const response = await fetchWithRetry(targetUrl, {
    headers: {
      ...BROWSER_HEADERS,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Referer': 'https://www.seloger.com/',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
    },
    timeout: 25000,
  });

  if (!response.ok) throw new Error(`SeLoger HTTP ${response.status}`);

  const html = await response.text();

  // Extraire le JSON embarqué dans le HTML (SeLoger injecte les données en JSON dans le HTML)
  const jsonMatch = html.match(/window\.__REDUXSTORE__\s*=\s*({.+?});\s*<\/script>/s)
    || html.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});\s*<\/script>/s)
    || html.match(/"classified":\s*(\[.+?\])/s);

  if (jsonMatch) {
    try {
      const storeData = JSON.parse(jsonMatch[1]);
      const listings = storeData?.results?.listings
        || storeData?.classified
        || storeData?.listingData?.listings
        || [];

      if (Array.isArray(listings) && listings.length > 0) {
        return listings.slice(0, 25).map(ad => ({
          source: 'seloger',
          reference: `SL-${ad.id || ad.classifiedId}`,
          titre: ad.title || ad.publicationTitle || `${type} à ${ville}`,
          prix: ad.pricing?.squareMeterPrice ? null : (ad.pricing?.price || ad.price || null),
          adresse: ad.location?.displayAddress || ad.city || '',
          ville: ad.city || ville,
          code_postal: ad.postalCode || '',
          surface: ad.surface || null,
          pieces: ad.rooms || null,
          chambres: ad.bedRoomsQuantity || null,
          description: ad.description || '',
          lien: ad.classifiedURL || `https://www.seloger.com/annonces/${ad.id}.htm`,
          image: ad.photos?.[0] || null,
          type,
          statut: 'disponible',
          created_at: new Date().toISOString(),
        })).filter(a => a.prix && a.titre);
      }
    } catch {}
  }

  // Fallback : parsing HTML avec cheerio
  if (!html.includes('seloger')) throw new Error('SeLoger a bloqué la requête');

  const $ = cheerio.load(html);
  const annonces = [];

  $('.c-pa-list article, [data-testid="sl.list-item"]').each((i, el) => {
    try {
      const $a = $(el);
      const titre = $a.find('.c-pa-link, [data-testid="sl.title"]').text().trim();
      const prixText = $a.find('.c-pa-price, [data-testid="sl.price"]').text();
      const prix = extrairePrix(prixText);
      const lien = $a.find('a').attr('href');
      const localisation = $a.find('.c-pa-city, [data-testid="sl.location"]').text().trim();
      const carac = $a.find('.c-pa-criteria').text();
      if (!titre || !prix) return;
      const refBase = (lien || titre + prix).replace(/[^a-zA-Z0-9]/g, '').slice(-20);
      annonces.push({
        source: 'seloger',
        reference: `SL-${refBase}`,
        titre, prix,
        adresse: localisation,
        ville: extraireVille(localisation),
        surface: extraireSurface(carac),
        pieces: extrairePieces(carac),
        description: carac,
        lien: lien ? `https://www.seloger.com${lien}` : null,
        image: $a.find('img').attr('src') || null,
        type,
        statut: 'disponible',
        created_at: new Date().toISOString(),
      });
    } catch {}
  });

  return annonces;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extrairePrix(t) {
  if (!t) return null;
  const m = t.replace(/\s/g, '').match(/(\d[\d.,]*)/);
  if (!m) return null;
  const val = parseInt(m[1].replace(/[.,]/g, ''));
  return val > 0 ? val : null;
}

function extraireSurface(t) {
  if (!t) return null;
  const m = t.match(/(\d+)\s*m[²2]/i);
  return m ? parseInt(m[1]) : null;
}

function extrairePieces(t) {
  if (!t) return null;
  const m = t.match(/(\d+)\s*(pièces?|p\.?\s|rooms?)/i);
  return m ? parseInt(m[1]) : null;
}

function extraireVille(t) {
  if (!t) return '';
  return t.replace(/\s*\(\d{5}\)\s*/g, '').trim();
}

function mapType(propertyType) {
  const map = { flat: 'appartement', house: 'maison', land: 'terrain', parking: 'parking', office: 'commercial', shop: 'commercial' };
  return map[propertyType] || 'autre';
}
