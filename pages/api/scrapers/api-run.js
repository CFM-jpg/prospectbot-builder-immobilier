// pages/api/scrapers/run.js

import ScraperManager from '../../../scrapers/core/ScraperManager';

/**
 * API générique pour lancer n'importe quel scraper
 * 
 * POST /api/scrapers/run
 * Body: {
 *   scraper: "leboncoin",  // ou "github", "reddit", etc.
 *   params: { ville: "Lyon", ... },
 *   options: {}  // optionnel
 * }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Méthode non autorisée',
      allowedMethods: ['POST']
    });
  }

  try {
    const { scraper, params, options } = req.body;

    // Validation
    if (!scraper) {
      return res.status(400).json({ 
        error: 'Paramètre "scraper" requis',
        availableScrapers: ScraperManager.listScrapers()
      });
    }

    if (!ScraperManager.scraperExists(scraper)) {
      return res.status(404).json({
        error: `Scraper "${scraper}" introuvable`,
        availableScrapers: ScraperManager.listScrapers()
      });
    }

    console.log(`🚀 API: Lancement scraper ${scraper}`);

    // Lance le scraper
    const result = await ScraperManager.runScraper(scraper, params || {}, options || {});

    return res.status(200).json({
      success: true,
      scraper,
      stats: result.stats,
      itemsScraped: result.stats.itemsScraped,
      itemsSaved: result.stats.itemsSaved,
      errors: result.stats.errors,
      message: `Scraping terminé : ${result.stats.itemsSaved} items sauvegardés`
    });

  } catch (error) {
    console.error('❌ Erreur API:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
