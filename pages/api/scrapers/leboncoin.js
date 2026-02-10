// pages/api/scrapers/leboncoin.js
// API Scraper - Le Bon Coin

import { connectToDatabase } from '../../../lib/mongodb';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  // Vérification de la méthode
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { db } = await connectToDatabase();
    
    // Paramètres de recherche (peuvent être passés en query params)
    const { 
      ville = 'rennes', 
      rayon = 20, 
      prixMin = 0, 
      prixMax = 500000,
      type = 'maison'
    } = req.query;

    console.log('Scraping Le Bon Coin...', { ville, rayon, prixMin, prixMax, type });

    // URL de recherche Le Bon Coin
    const url = construireURLLeBonCoin({ ville, rayon, prixMin, prixMax, type });
    
    // Fetch de la page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extraction des annonces
    const annonces = [];
    
    // ATTENTION: Les sélecteurs Le Bon Coin peuvent changer !
    // Ceci est un exemple, à adapter selon la structure HTML réelle
    $('[data-qa-id="aditem_container"]').each((index, element) => {
      try {
        const $annonce = $(element);
        
        // Extraction des données
        const titre = $annonce.find('[data-qa-id="aditem_title"]').text().trim();
        const prix = extrairePrix($annonce.find('[data-qa-id="aditem_price"]').text());
        const lien = $annonce.find('a').attr('href');
        const ville = $annonce.find('[data-qa-id="aditem_location"]').text().trim();
        const image = $annonce.find('img').attr('src');
        
        // Extraction de la surface (si disponible)
        const description = $annonce.find('[data-qa-id="aditem_description"]').text();
        const surface = extraireSurface(description);
        const pieces = extrairePieces(titre + ' ' + description);

        if (titre && prix) {
          annonces.push({
            source: 'leboncoin',
            reference: `LBC-${Date.now()}-${index}`,
            titre: titre,
            prix: prix,
            adresse: ville,
            ville: ville,
            surface: surface || null,
            pieces: pieces || null,
            description: description,
            lien: lien ? `https://www.leboncoin.fr${lien}` : null,
            image: image,
            type: determinerType(titre),
            dateScrap: new Date(),
            statut: 'disponible'
          });
        }
      } catch (error) {
        console.error('Erreur extraction annonce:', error);
      }
    });

    // Sauvegarder les nouvelles annonces dans la base de données
    let nouvellesAnnonces = 0;
    for (const annonce of annonces) {
      // Vérifier si l'annonce existe déjà
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
      source: 'leboncoin',
      date: new Date(),
      parametres: { ville, rayon, prixMin, prixMax, type },
      resultat: {
        annoncesTouvees: annonces.length,
        nouvellesAnnonces: nouvellesAnnonces
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Scraping Le Bon Coin terminé',
      stats: {
        annoncesTouvees: annonces.length,
        nouvellesAnnonces: nouvellesAnnonces
      },
      annonces: annonces
    });

  } catch (error) {
    console.error('Erreur scraping Le Bon Coin:', error);
    return res.status(500).json({ 
      error: 'Erreur lors du scraping',
      details: error.message 
    });
  }
}

// Construction de l'URL Le Bon Coin
function construireURLLeBonCoin({ ville, rayon, prixMin, prixMax, type }) {
  const baseURL = 'https://www.leboncoin.fr/recherche';
  const params = new URLSearchParams({
    category: type === 'appartement' ? '10' : '9', // 9=maison, 10=appart
    locations: ville,
    searchRadius: rayon * 1000, // Convertir en mètres
    price: `${prixMin}-${prixMax}`
  });
  
  return `${baseURL}?${params.toString()}`;
}

// Extraction du prix
function extrairePrix(texte) {
  if (!texte) return null;
  const match = texte.match(/(\d+[\s.]?\d*)/);
  return match ? parseInt(match[1].replace(/[\s.]/g, '')) : null;
}

// Extraction de la surface
function extraireSurface(texte) {
  if (!texte) return null;
  const match = texte.match(/(\d+)\s*m²/i);
  return match ? parseInt(match[1]) : null;
}

// Extraction du nombre de pièces
function extrairePieces(texte) {
  if (!texte) return null;
  const match = texte.match(/(\d+)\s*(pièces?|p)/i);
  return match ? parseInt(match[1]) : null;
}

// Détermination du type de bien
function determinerType(titre) {
  const titreLower = titre.toLowerCase();
  if (titreLower.includes('appartement') || titreLower.includes('appart')) {
    return 'appartement';
  } else if (titreLower.includes('maison')) {
    return 'maison';
  } else if (titreLower.includes('terrain')) {
    return 'terrain';
  }
  return 'autre';
}
