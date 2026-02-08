/**
 * API : Liste tous les scrapers disponibles
 * GET /api/scrapers/list
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Liste des scrapers disponibles
    const scrapers = [
      {
        id: 'leboncoin',
        name: 'LeBonCoin',
        category: 'immobilier',
        description: 'Scraper de biens immobiliers sur LeBonCoin',
        params: [
          { name: 'ville', type: 'string', required: true, example: 'Lyon' },
          { name: 'type', type: 'string', required: false, example: 'ventes', default: 'ventes' },
          { name: 'prixMin', type: 'number', required: false, example: 300000 },
          { name: 'prixMax', type: 'number', required: false, example: 400000 },
          { name: 'surfaceMin', type: 'number', required: false, example: 70 },
          { name: 'piecesMin', type: 'number', required: false, example: 3 }
        ],
        enabled: true,
        avgDuration: '5-10 minutes'
      },
      {
        id: 'pap',
        name: 'PAP (Particulier à Particulier)',
        category: 'immobilier',
        description: 'Scraper de biens immobiliers sur PAP.fr',
        params: [
          { name: 'ville', type: 'string', required: true, example: 'Lyon' },
          { name: 'prixMax', type: 'number', required: false, example: 400000 },
          { name: 'typeBien', type: 'string', required: false, example: 'appartement' }
        ],
        enabled: false,
        avgDuration: '3-5 minutes',
        note: 'En développement'
      },
      {
        id: 'github',
        name: 'GitHub',
        category: 'b2b',
        description: 'Scraper de profils développeurs sur GitHub',
        params: [
          { name: 'skills', type: 'array', required: true, example: ['React', 'Node.js'] },
          { name: 'location', type: 'string', required: true, example: 'Paris' },
          { name: 'minRepos', type: 'number', required: false, example: 5, default: 0 },
          { name: 'minFollowers', type: 'number', required: false, example: 10, default: 0 },
          { name: 'language', type: 'string', required: false, example: 'JavaScript' },
          { name: 'maxResults', type: 'number', required: false, example: 50, default: 30 }
        ],
        enabled: true,
        avgDuration: '2-3 minutes'
      },
      {
        id: 'reddit',
        name: 'Reddit',
        category: 'b2b',
        description: 'Scraper de posts et commentaires Reddit',
        params: [
          { name: 'subreddit', type: 'string', required: true, example: 'vosfinances' },
          { name: 'keywords', type: 'array', required: false, example: ['immobilier', 'achat'] },
          { name: 'maxPosts', type: 'number', required: false, example: 100, default: 50 }
        ],
        enabled: false,
        avgDuration: '5 minutes',
        note: 'En développement'
      },
      {
        id: 'linkedin',
        name: 'LinkedIn',
        category: 'b2b',
        description: 'Scraper de profils professionnels LinkedIn',
        params: [
          { name: 'keywords', type: 'string', required: true, example: 'CEO startup Paris' },
          { name: 'location', type: 'string', required: false, example: 'Paris' },
          { name: 'maxResults', type: 'number', required: false, example: 50, default: 30 }
        ],
        enabled: false,
        avgDuration: '10-15 minutes',
        note: 'Risque de ban - À utiliser avec modération'
      }
    ];

    // Filtres optionnels
    const { category, enabled } = req.query;

    let filteredScrapers = scrapers;

    if (category) {
      filteredScrapers = filteredScrapers.filter(s => s.category === category);
    }

    if (enabled !== undefined) {
      const isEnabled = enabled === 'true';
      filteredScrapers = filteredScrapers.filter(s => s.enabled === isEnabled);
    }

    // Statistiques
    const stats = {
      total: scrapers.length,
      enabled: scrapers.filter(s => s.enabled).length,
      disabled: scrapers.filter(s => !s.enabled).length,
      byCategory: {
        immobilier: scrapers.filter(s => s.category === 'immobilier').length,
        b2b: scrapers.filter(s => s.category === 'b2b').length
      }
    };

    return res.status(200).json({
      success: true,
      scrapers: filteredScrapers,
      stats
    });

  } catch (error) {
    console.error('Erreur liste scrapers:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
