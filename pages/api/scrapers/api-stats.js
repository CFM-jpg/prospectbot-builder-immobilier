// pages/api/scrapers/stats.js

import ScraperManager from '../../../scrapers/core/ScraperManager';

/**
 * API pour obtenir les statistiques des scrapers
 * 
 * GET /api/scrapers/stats
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Méthode non autorisée',
      allowedMethods: ['GET']
    });
  }

  try {
    const stats = ScraperManager.getStats();
    const history = ScraperManager.getHistory(20);  // 20 dernières exécutions

    return res.status(200).json({
      success: true,
      stats,
      recentExecutions: history,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur API:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
