// pages/api/scrapers/seloger.js
import { supabaseAdmin } from '../../../lib/supabase';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const {
      ville = 'paris',
      prixMin = 0,
      prixMax = 500000,
      surfaceMin = 0,
      type = 'maison'
    } = req.query;

    const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;
    if (!SCRAPER_API_KEY) {
      return res.status(500).json({ error: 'SCRAPER_API_KEY non configurée' });
    }

    const targetUrl = construireURLSeLoger({ ville, prixMin, prixMax, surfaceMin, type });
    console.log('Scraping SeLoger via ScraperAPI...', targetUrl);

    const scraperUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&render=true`;

    const response = await fetch(scraperUrl);
    if (!response.ok) throw new Error(`ScraperAPI erreur: ${response.status}`);

    const html = await response.text();
    const $ = cheerio.load(html);
    const annonces = [];

    $('.c-pa-list article').each((index, element) => {
      try {
        const $a = $(element);
        const titre = $a.find('.c-pa-link').text().trim();
        const prix = extrairePrix($a.find('.c-pa-price').text());
        const lien = $a.find('.c-pa-link').attr('href');
        const localisation = $a.find('.c-pa-city').text().trim();
        const image = $a.find('img').attr('src') || $a.find('img').attr('data-src');
        const carac = $a.find('.c-pa-criteria').text();
        const description = $a.find('.c-pa-description').text().trim();

        if (titre && prix) {
          annonces.push({
            source: 'seloger',
            reference: `SL-${Date.now()}-${index}`,
            titre,
            prix,
            adresse: localisation,
            ville: extraireVille(localisation),
            surface: extraireSurface(carac),
            pieces: extrairePieces(carac),
            description: description || carac,
            lien: lien ? `https://www.seloger.com${lien}` : null,
            image,
            type: determinerType(titre + ' ' + carac),
            statut: 'disponible',
            created_at: new Date().toISOString()
          });
        }
      } catch (e) { console.error('Erreur extraction:', e); }
    });

    let nouvellesAnnonces = 0;
    for (const annonce of annonces) {
      const { data: existe } = await supabaseAdmin.from('biens').select('id').eq('reference', annonce.reference).single();
      if (!existe) {
        const { error } = await supabaseAdmin.from('biens').insert([annonce]);
        if (!error) nouvellesAnnonces++;
      }
    }

    await supabaseAdmin.from('scraper_logs').insert([{
      source: 'seloger',
      date: new Date().toISOString(),
      parametres: { ville, prixMin, prixMax, surfaceMin, type },
      resultat: { annoncesTouvees: annonces.length, nouvellesAnnonces }
    }]);

    return res.status(200).json({
      success: true,
      message: 'Scraping SeLoger terminé',
      stats: { annoncesTouvees: annonces.length, nouvellesAnnonces },
      annonces
    });

  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

function construireURLSeLoger({ ville, prixMin, prixMax, surfaceMin, type }) {
  const typeCode = type === 'appartement' ? '2' : '1';
  const params = new URLSearchParams({
    types: typeCode,
    places: `[{"inseeCodes":["${ville}"]}]`,
    price: `${prixMin}/${prixMax}`,
    surface: `${surfaceMin}/NaN`,
    enterprise: '0',
    qsVersion: '1.0'
  });
  return `https://www.seloger.com/list.htm?${params.toString()}`;
}

function extrairePrix(t) {
  if (!t) return null;
  const m = t.match(/(\d+[\s.]?\d*)/);
  return m ? parseInt(m[1].replace(/[\s.]/g, '')) : null;
}

function extraireSurface(t) {
  if (!t) return null;
  const m = t.match(/(\d+)\s*m²/i);
  return m ? parseInt(m[1]) : null;
}

function extrairePieces(t) {
  if (!t) return null;
  const m = t.match(/(\d+)\s*(pièces?|p)/i);
  return m ? parseInt(m[1]) : null;
}

function extraireVille(t) {
  return t ? t.replace(/\(\d{5}\)/g, '').trim() : t;
}

function determinerType(texte) {
  const t = texte.toLowerCase();
  if (t.includes('appartement')) return 'appartement';
  if (t.includes('maison')) return 'maison';
  if (t.includes('terrain')) return 'terrain';
  if (t.includes('local') || t.includes('commerce')) return 'commercial';
  return 'autre';
}
