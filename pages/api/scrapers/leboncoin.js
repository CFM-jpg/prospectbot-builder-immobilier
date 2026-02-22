// pages/api/scrapers/leboncoin.js
import { supabaseAdmin } from '../../../lib/supabase';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const {
      ville = 'paris',
      rayon = 20,
      prixMin = 0,
      prixMax = 500000,
      type = 'maison'
    } = req.query;

    const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;
    if (!SCRAPER_API_KEY) {
      return res.status(500).json({ error: 'SCRAPER_API_KEY non configurée' });
    }

    const targetUrl = construireURLLeBonCoin({ ville, rayon, prixMin, prixMax, type });
    console.log('Scraping LeBonCoin via ScraperAPI...', targetUrl);

    const scraperUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&render=true`;

    const response = await fetch(scraperUrl);
    if (!response.ok) throw new Error(`ScraperAPI erreur: ${response.status}`);

    const html = await response.text();
    const $ = cheerio.load(html);
    const annonces = [];

    $('[data-qa-id="aditem_container"]').each((index, element) => {
      try {
        const $a = $(element);
        const titre = $a.find('[data-qa-id="aditem_title"]').text().trim();
        const prix = extrairePrix($a.find('[data-qa-id="aditem_price"]').text());
        const lien = $a.find('a').attr('href');
        const localisation = $a.find('[data-qa-id="aditem_location"]').text().trim();
        const image = $a.find('img').attr('src');
        const description = $a.find('[data-qa-id="aditem_description"]').text();

        if (titre && prix) {
          annonces.push({
            source: 'leboncoin',
            reference: `LBC-${Date.now()}-${index}`,
            titre,
            prix,
            adresse: localisation,
            ville: extraireVille(localisation),
            surface: extraireSurface(description + ' ' + titre),
            pieces: extrairePieces(titre + ' ' + description),
            description,
            lien: lien ? `https://www.leboncoin.fr${lien}` : null,
            image,
            type: determinerType(titre),
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
      source: 'leboncoin',
      date: new Date().toISOString(),
      parametres: { ville, rayon, prixMin, prixMax, type },
      resultat: { annoncesTouvees: annonces.length, nouvellesAnnonces }
    }]);

    return res.status(200).json({
      success: true,
      message: 'Scraping LeBonCoin terminé',
      stats: { annoncesTouvees: annonces.length, nouvellesAnnonces },
      annonces
    });

  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

function construireURLLeBonCoin({ ville, rayon, prixMin, prixMax, type }) {
  const params = new URLSearchParams({
    category: type === 'appartement' ? '10' : '9',
    locations: ville,
    searchRadius: rayon * 1000,
    price: `${prixMin}-${prixMax}`
  });
  return `https://www.leboncoin.fr/recherche?${params.toString()}`;
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

function determinerType(titre) {
  const t = titre.toLowerCase();
  if (t.includes('appartement')) return 'appartement';
  if (t.includes('maison')) return 'maison';
  if (t.includes('terrain')) return 'terrain';
  return 'autre';
}
