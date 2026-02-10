// pages/api/scrapers/bienici.js
// API Scraper - Bien'ici

import { connectToDatabase } from '../../../lib/mongodb';

export default async function handler(req, res) {
  // Vérification de la méthode
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { db } = await connectToDatabase();
    
    // Paramètres de recherche
    const { 
      ville = 'rennes', 
      prixMin = 0, 
      prixMax = 500000,
      surfaceMin = 0,
      type = 'maison'
    } = req.query;

    console.log('Scraping Bien\'ici...', { ville, prixMin, prixMax, surfaceMin, type });

    // Bien'ici utilise une API GraphQL
    const query = construireQueryBienici({ ville, prixMin, prixMax, surfaceMin, type });
    
    // Appel de l'API Bien'ici
    const response = await fetch('https://www.bienici.com/realEstateAds.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify(query)
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    const annonces = [];

    // Traitement des résultats
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
            codePostal: ad.postalCode || '',
            surface: ad.surfaceArea || null,
            pieces: ad.roomsQuantity || null,
            chambres: ad.bedroomsQuantity || null,
            description: ad.description || '',
            lien: ad.id ? `https://www.bienici.com/annonce/${ad.id}` : null,
            image: ad.photos && ad.photos[0] ? ad.photos[0].url : null,
            photos: ad.photos ? ad.photos.map(p => p.url) : [],
            type: determinerType(ad.propertyType),
            dateScrap: new Date(),
            statut: 'disponible',
            // Informations supplémentaires
            dpe: ad.energyClassification || null,
            ges: ad.greenhouseGasClassification || null,
            charges: ad.charges || null,
            etage: ad.floor || null
          });
        } catch (error) {
          console.error('Erreur traitement annonce Bien\'ici:', error);
        }
      });
    }

    // Sauvegarder les nouvelles annonces
    let nouvellesAnnonces = 0;
    for (const annonce of annonces) {
      const existe = await db.collection('biens').findOne({ 
        reference: annonce.reference 
      });
      
      if (!existe) {
        await db.collection('biens').insertOne(annonce);
        nouvellesAnnonces++;
      }
    }

    // Logger le scraping
    await db.collection('scraper_logs').insertOne({
      source: 'bienici',
      date: new Date(),
      parametres: { ville, prixMin, prixMax, surfaceMin, type },
      resultat: {
        annoncesTouvees: annonces.length,
        nouvellesAnnonces: nouvellesAnnonces
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Scraping Bien\'ici terminé',
      stats: {
        annoncesTouvees: annonces.length,
        nouvellesAnnonces: nouvellesAnnonces
      },
      annonces: annonces
    });

  } catch (error) {
    console.error('Erreur scraping Bien\'ici:', error);
    return res.status(500).json({ 
      error: 'Erreur lors du scraping',
      details: error.message 
    });
  }
}

// Construction de la requête pour l'API Bien'ici
function construireQueryBienici({ ville, prixMin, prixMax, surfaceMin, type }) {
  return {
    filters: {
      propertyType: [type === 'appartement' ? 'flat' : 'house'],
      price: {
        min: prixMin,
        max: prixMax
      },
      surfaceArea: {
        min: surfaceMin
      },
      location: {
        text: ville
      }
    },
    page: 1,
    resultsPerPage: 24,
    sortBy: 'relevance',
    sortOrder: 'desc'
  };
}

// Détermination du type de bien
function determinerType(propertyType) {
  const typeMap = {
    'flat': 'appartement',
    'house': 'maison',
    'land': 'terrain',
    'parking': 'parking',
    'office': 'commercial',
    'shop': 'commercial'
  };
  
  return typeMap[propertyType] || 'autre';
}
