/**
 * API : Statut des scrapers en cours d'exécution
 * GET /api/scrapers/status
 */

import { getRunningScrapers } from './stop';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const runningScrapers = getRunningScrapers();

    return res.status(200).json({
      success: true,
      running: runningScrapers.length,
      scrapers: runningScrapers,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur statut scrapers:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
