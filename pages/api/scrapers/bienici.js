// pages/api/scrapers/bienici.js
import { supabaseAdmin } from '../../../lib/supabase';

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

    const filters = {
      size: 24,
      from: 0,
      filters: {
        ranges: {
          prix: { min: parseInt(prixMin), max: parseInt(prixMax) },
          ...(surfaceMin > 0 && { surfaceArea: { min: parseInt(surfaceMin) } })
        },
        terms: {
          propertyType: [type === 'appartement' ? 'flat' : 'house']
        },
        places: [{ summary: ville }]
      },
      sortBy: 'publicationDate',
      sortOrder: 'desc'
    };

    const targetUrl = `https://www.bienici.com/realEstateAds.json?filters=${encodeURIComponent(JSON.stringify(filters))}`;
    const scraperUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}`;

    console.log("Appel API Bien'ici via ScraperAPI...", ville);

    const response = await fetch(scraperUrl);
    if (!response.ok) throw new Error(`ScraperAPI erreur: ${response.status}`);

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error("Réponse non JSON — Bien'ici a peut-être bloqué la requête");
    }

    const annonces = [];

    if (data.realEstateAds && Array.isArray(data.realEstateAds)) {
      data.realEstateAds.forEach((ad, index) => {
        try {
          annonces.push({
            source: 'bienici',
            reference: `BI-${ad.id || Date.now()}-${index}`,
            titre: ad.title || `${ad.propertyType} à ${ad.city}`,
            prix: ad.price || null,
            adresse: ad.address || '',
            ville: ad.city || ville,
            code_postal: ad.postalCode || '',
            surface: ad.surfaceArea || null,
            pieces: ad.roomsQuantity || null,
            chambres: ad.bedroomsQuantity || null,
            description: ad.description || '',
            lien: ad.id ? `https://www.bienici.com/annonce/${ad.id}` : null,
            image: ad.photos && ad.photos[0] ? ad.photos[0].url : null,
            type: determinerType(ad.propertyType),
            statut: 'disponible',
            dpe: ad.energyClassification || null,
            created_at: new Date().toISOString()
          });
        } catch (e) {
          console.error('Erreur traitement annonce:', e);
        }
      });
    }

    let nouvellesAnnonces = 0;
    for (const annonce of annonces) {
      const { data: existe } = await supabaseAdmin
        .from('biens')
        .select('id')
        .eq('reference', annonce.reference)
        .single();

      if (!existe) {
        const { error } = await supabaseAdmin.from('biens').insert([annonce]);
        if (!error) nouvellesAnnonces++;
      }
    }

    await supabaseAdmin.from('scraper_logs').insert([{
      source: 'bienici',
      date: new Date().toISOString(),
      parametres: { ville, prixMin, prixMax, surfaceMin, type },
      resultat: { annoncesTouvees: annonces.length, nouvellesAnnonces }
    }]);

    return res.status(200).json({
      success: true,
      message: "Scraping Bien'ici terminé",
      stats: { annoncesTouvees: annonces.length, nouvellesAnnonces },
      annonces
    });

  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

function determinerType(propertyType) {
  const map = {
    flat: 'appartement',
    house: 'maison',
    land: 'terrain',
    parking: 'parking',
    office: 'commercial',
    shop: 'commercial'
  };
  return map[propertyType] || 'autre';
}
