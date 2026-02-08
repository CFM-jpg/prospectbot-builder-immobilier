/**
 * API : Stopper un scraper en cours d'exécution
 * POST /api/scrapers/stop
 */

import { createClient } from '@supabase/supabase-js';

// Store pour les scrapers en cours (en production, utilisez Redis)
const runningScrapers = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { scraperId } = req.body;

  if (!scraperId) {
    return res.status(400).json({ 
      success: false,
      error: 'scraperId requis' 
    });
  }

  try {
    // Vérifier si le scraper est en cours
    const scraper = runningScrapers.get(scraperId);

    if (!scraper) {
      return res.status(404).json({
        success: false,
        error: 'Aucun scraper avec cet ID en cours d\'exécution',
        scraperId
      });
    }

    // Marquer pour arrêt
    scraper.shouldStop = true;

    // Si le scraper a un process Puppeteer, le fermer
    if (scraper.browser) {
      await scraper.browser.close();
    }

    // Retirer de la liste
    runningScrapers.delete(scraperId);

    // Logger l'arrêt dans Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    await supabase.from('scraper_logs').insert({
      scraper_id: scraperId,
      action: 'stopped',
      status: 'cancelled',
      stopped_at: new Date().toISOString(),
      stopped_by: 'user'
    });

    return res.status(200).json({
      success: true,
      message: 'Scraper arrêté avec succès',
      scraperId,
      stoppedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur arrêt scraper:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Fonction utilitaire pour enregistrer un scraper en cours
 * À appeler depuis run.js
 */
export function registerRunningScraper(id, scraperInstance) {
  runningScrapers.set(id, {
    id,
    scraper: scraperInstance,
    startedAt: new Date(),
    shouldStop: false
  });
}

/**
 * Fonction pour vérifier si un scraper doit s'arrêter
 * À appeler régulièrement dans la boucle de scraping
 */
export function shouldStopScraper(id) {
  const scraper = runningScrapers.get(id);
  return scraper ? scraper.shouldStop : false;
}

/**
 * Fonction pour retirer un scraper de la liste (fin normale)
 */
export function unregisterScraper(id) {
  runningScrapers.delete(id);
}

/**
 * Obtenir tous les scrapers en cours
 */
export function getRunningScrapers() {
  return Array.from(runningScrapers.values()).map(s => ({
    id: s.id,
    startedAt: s.startedAt,
    duration: Math.floor((new Date() - s.startedAt) / 1000) + 's'
  }));
}
