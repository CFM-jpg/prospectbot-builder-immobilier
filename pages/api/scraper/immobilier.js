// pages/api/scrapers/immobilier.js
// Scraper unifié — résultats RÉELS uniquement (0 si rien trouvé, jamais de données fictives)

import { supabaseAdmin } from '../../../lib/supabase';
import { getSession } from '../../../lib/auth';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Non authentifié' });
  const agentEmail = session.email;

  const {
    source = 'bienici',   // 'bienici' | 'leboncoin' | 'seloger'
    ville = 'paris',
    prixMin = 0,
    prixMax = 1000000,
    surfaceMin = 0,
    type = 'appartement', // 'appartement' | 'maison'
    rayon = 20,
  } = req.method === 'POST' ? req.body : req.query;

  const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;
  if (!SCRAPER_API_KEY) {
    return res.status(500).json({
      success: false,
      error: 'SCRAPER_API_KEY non configurée',
      annonces: [],
      stats: { annoncesTouvees: 0, nouvellesAnnonces: 0, source },
    });
  }

  try {
    let annonces = [];

    if (source === 'bienici') {
      annonces = await scraperBienici({ ville, prixMin, prixMax, surfaceMin, type, SCRAPER_API_KEY });
    } else if (source === 'leboncoin') {
      annonces = await scraperLeBonCoin({ ville, prixMin, prixMax, type, rayon, SCRAPER_API_KEY });
    } else if (source === 'seloger') {
      annonces = await scraperSeLoger({ ville, prixMin, prixMax, surfaceMin, type, SCRAPER_API_KEY });
    } else {
      return res.status(400).json({ success: false, error: `Source inconnue : ${source}`, annonces: [] });
    }

    // Sauvegarde en base — uniquement les vraies annonces avec données réelles
    let nouvellesAnnonces = 0;
    const annoncesInsereees = [];

    for (const annonce of annonces) {
      // On n'insère pas une annonce sans données essentielles
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

    // Log scraper
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
      stats: {
        annoncesTouvees: annonces.length,
        nouvellesAnnonces,
        source,
      },
      annonces: annoncesInsereees,
    });

  } catch (error) {
    console.error(`Erreur scraper ${source}:`, error.message);

    // Distinguer les erreurs de blocage des vraies erreurs
    const isBlocked = error.message?.includes('403') || error.message?.includes('blocked') || error.message?.includes('captcha');

    return res.status(isBlocked ? 429 : 500).json({
      success: false,
      error: isBlocked
        ? `${source} a bloqué la requête. Essayez plus tard ou vérifiez votre quota ScraperAPI.`
        : `Erreur lors du scraping de ${source} : ${error.message}`,
      annonces: [],
      stats: { annoncesTouvees: 0, nouvellesAnnonces: 0, source },
    });
  }
}

// ─── BienIci ─────────────────────────────────────────────────────────────────

async function scraperBienici({ ville, prixMin, prixMax, surfaceMin, type, SCRAPER_API_KEY }) {
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
  const scraperUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&render=true&country_code=fr&premium=true`;

  const response = await fetch(scraperUrl, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`ScraperAPI HTTP ${response.status}`);

  const text = await response.text();

  // Détection blocage — ScraperAPI renvoie du HTML en cas d'erreur
  if (text.trim().startsWith('<') || text.includes('<!DOCTYPE')) {
    throw new Error('BienIci a bloqué la requête (captcha ou rate limit ScraperAPI)');
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Réponse non-JSON de BienIci — site probablement bloqué");
  }

  if (!data.realEstateAds || !Array.isArray(data.realEstateAds)) {
    return []; // Pas d'annonces — résultat vide réel
  }

  return data.realEstateAds
    .filter(ad => ad.id && ad.price && ad.city) // Uniquement annonces avec données essentielles
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

// ─── LeBonCoin ───────────────────────────────────────────────────────────────

async function scraperLeBonCoin({ ville, prixMin, prixMax, type, rayon, SCRAPER_API_KEY }) {
  const params = new URLSearchParams({
    category: type === 'appartement' ? '10' : '9',
    locations: ville,
    price: `${prixMin}-${prixMax}`,
  });
  if (parseInt(rayon) > 0) params.set('searchRadius', parseInt(rayon) * 1000);

  const targetUrl = `https://www.leboncoin.fr/recherche?${params.toString()}`;
  const scraperUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&render=true&country_code=fr&premium=true`;

  const response = await fetch(scraperUrl, { signal: AbortSignal.timeout(25000) });
  if (!response.ok) throw new Error(`ScraperAPI HTTP ${response.status}`);

  const html = await response.text();

  // Vérifier que c'est bien de l'HTML et pas une page d'erreur
  if (html.trim().startsWith('<html') && html.includes('Unauthorized')) {
    throw new Error('Clé ScraperAPI invalide ou quota épuisé');
  }
  if (!html.includes('leboncoin') && !html.includes('annonce')) {
    throw new Error('LeBonCoin a bloqué la requête (captcha ou rate limit)');
  }

  const $ = cheerio.load(html);
  const annonces = [];

  $('[data-qa-id="aditem_container"]').each((index, element) => {
    try {
      const $a = $(element);
      const titre = $a.find('[data-qa-id="aditem_title"]').text().trim();
      const prixText = $a.find('[data-qa-id="aditem_price"]').text();
      const prix = extrairePrix(prixText);
      const lien = $a.find('a').attr('href');
      const localisation = $a.find('[data-qa-id="aditem_location"]').text().trim();
      const image = $a.find('img').attr('src');
      const description = $a.find('[data-qa-id="aditem_description"]').text().trim();

      // Skip les annonces sans données essentielles
      if (!titre || !prix || !lien) return;

      // Référence stable basée sur le lien (pas sur Date.now)
      const refBase = lien.replace(/[^a-zA-Z0-9]/g, '').slice(-20);

      annonces.push({
        source: 'leboncoin',
        reference: `LBC-${refBase}`,
        titre,
        prix,
        adresse: localisation,
        ville: extraireVille(localisation),
        surface: extraireSurface(description + ' ' + titre),
        pieces: extrairePieces(titre + ' ' + description),
        description,
        lien: `https://www.leboncoin.fr${lien}`,
        image: image || null,
        type: type === 'appartement' ? 'appartement' : 'maison',
        statut: 'disponible',
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Erreur extraction LBC:', e.message);
    }
  });

  return annonces;
}

// ─── SeLoger ─────────────────────────────────────────────────────────────────

async function scraperSeLoger({ ville, prixMin, prixMax, surfaceMin, type, SCRAPER_API_KEY }) {
  const typeCode = type === 'appartement' ? '2' : '1';
  const params = new URLSearchParams({
    types: typeCode,
    places: `[{"inseeCodes":["${ville}"]}]`,
    price: `${prixMin}/${prixMax}`,
    surface: `${surfaceMin || 0}/NaN`,
    enterprise: '0',
    qsVersion: '1.0',
  });

  const targetUrl = `https://www.seloger.com/list.htm?${params.toString()}`;
  const scraperUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&render=true&country_code=fr&premium=true`;

  const response = await fetch(scraperUrl, { signal: AbortSignal.timeout(25000) });
  if (!response.ok) throw new Error(`ScraperAPI HTTP ${response.status}`);

  const html = await response.text();

  if (html.trim().startsWith('<html') && html.includes('Unauthorized')) {
    throw new Error('Clé ScraperAPI invalide ou quota épuisé');
  }
  if (!html.includes('seloger') && !html.includes('annonce')) {
    throw new Error('SeLoger a bloqué la requête (captcha ou rate limit)');
  }

  const $ = cheerio.load(html);
  const annonces = [];

  $('.c-pa-list article').each((index, element) => {
    try {
      const $a = $(element);
      const titre = $a.find('.c-pa-link').text().trim();
      const prixText = $a.find('.c-pa-price').text();
      const prix = extrairePrix(prixText);
      const lien = $a.find('.c-pa-link').attr('href');
      const localisation = $a.find('.c-pa-city').text().trim();
      const image = $a.find('img').attr('src') || $a.find('img').attr('data-src');
      const carac = $a.find('.c-pa-criteria').text();
      const description = $a.find('.c-pa-description').text().trim();

      if (!titre || !prix) return;

      const refBase = (lien || titre + prix).replace(/[^a-zA-Z0-9]/g, '').slice(-20);

      annonces.push({
        source: 'seloger',
        reference: `SL-${refBase}`,
        titre,
        prix,
        adresse: localisation,
        ville: extraireVille(localisation),
        surface: extraireSurface(carac),
        pieces: extrairePieces(carac),
        description: description || carac,
        lien: lien ? `https://www.seloger.com${lien}` : null,
        image: image || null,
        type: type === 'appartement' ? 'appartement' : 'maison',
        statut: 'disponible',
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Erreur extraction SeLoger:', e.message);
    }
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
