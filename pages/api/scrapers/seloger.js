// pages/api/scrapers/seloger.js
// API Scraper - SeLoger

import { connectToDatabase } from '../../../lib/mongodb';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  // Vérification de la méthode
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { db } = await connectToDatabase();
    
    // Paramètres de recherche
    const { 
      ville = 'rennes-35000', 
      prixMin = 0, 
      prixMax = 500000,
      surfaceMin = 0,
      type = 'maison'
    } = req.query;

    console.log('Scraping SeLoger...', { ville, prixMin, prixMax, surfaceMin, type });

    // URL de recherche SeLoger
    const url = construireURLSeLoger({ ville, prixMin, prixMax, surfaceMin, type });
    
    // Fetch de la page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extraction des annonces
    const annonces = [];
    
    // ATTENTION: Les sélecteurs SeLoger peuvent changer !
    // Ceci est un exemple, à adapter selon la structure HTML réelle
    $('.c-pa-list article').each((index, element) => {
      try {
        const $annonce = $(element);
        
        // Extraction des données
        const titre = $annonce.find('.c-pa-link').text().trim();
        const prix = extrairePrix($annonce.find('.c-pa-price').text());
        const lien = $annonce.find('.c-pa-link').attr('href');
        const ville = $annonce.find('.c-pa-city').text().trim();
        const image = $annonce.find('img').attr('src') || $annonce.find('img').attr('data-src');
        
        // Extraction des caractéristiques
        const caracteristiques = $annonce.find('.c-pa-criteria').text();
        const surface = extraireSurface(caracteristiques);
        const pieces = extrairePieces(caracteristiques);
        
        // Description
        const description = $annonce.find('.c-pa-description').text().trim();

        if (titre && prix) {
          annonces.push({
            source: 'seloger',
            reference: `SL-${Date.now()}-${index}`,
            titre: titre,
            prix: prix,
            adresse: ville,
            ville: extraireVille(ville),
            surface: surface || null,
            pieces: pieces || null,
            description: description || caracteristiques,
            lien: lien ? `https://www.seloger.com${lien}` : null,
            image: image,
            type: determinerType(titre + ' ' + caracteristiques),
            dateScrap: new Date(),
            statut: 'disponible'
          });
        }
      } catch (error) {
        console.error('Erreur extraction annonce SeLoger:', error);
      }
    });

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
      source: 'seloger',
      date: new Date(),
      parametres: { ville, prixMin, prixMax, surfaceMin, type },
      resultat: {
        annoncesTouvees: annonces.length,
        nouvellesAnnonces: nouvellesAnnonces
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Scraping SeLoger terminé',
      stats: {
        annoncesTouvees: annonces.length,
        nouvellesAnnonces: nouvellesAnnonces
      },
      annonces: annonces
    });

  } catch (error) {
    console.error('Erreur scraping SeLoger:', error);
    return res.status(500).json({ 
      error: 'Erreur lors du scraping',
      details: error.message 
    });
  }
}

// Construction de l'URL SeLoger
function construireURLSeLoger({ ville, prixMin, prixMax, surfaceMin, type }) {
  const typeCode = type === 'appartement' ? '2' : '1'; // 1=maison, 2=appart
  const baseURL = 'https://www.seloger.com/list.htm';
  
  const params = new URLSearchParams({
    types: typeCode,
    places: `[{"inseeCodes":[${ville}]}]`,
    price: `${prixMin}/${prixMax}`,
    surface: `${surfaceMin}/NaN`,
    enterprise: '0',
    qsVersion: '1.0'
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

// Extraction du nom de ville
function extraireVille(texte) {
  if (!texte) return texte;
  // Retirer le code postal s'il est présent
  return texte.replace(/\(\d{5}\)/g, '').trim();
}

// Détermination du type de bien
function determinerType(texte) {
  const texteLower = texte.toLowerCase();
  if (texteLower.includes('appartement') || texteLower.includes('appart')) {
    return 'appartement';
  } else if (texteLower.includes('maison')) {
    return 'maison';
  } else if (texteLower.includes('terrain')) {
    return 'terrain';
  } else if (texteLower.includes('local') || texteLower.includes('commerce')) {
    return 'commercial';
  }
  return 'autre';
}
