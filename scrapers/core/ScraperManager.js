// core/ScraperManager.js

const LeBonCoinScraper = require('../immobilier/LeBonCoinScraper');
const GitHubScraper = require('../b2b/GitHubScraper');
// const PAPScraper = require('../immobilier/PAPScraper');
// const RedditScraper = require('../b2b/RedditScraper');
// ... autres scrapers

/**
 * Gestionnaire centralisé de tous les scrapers
 * Permet de lancer n'importe quel scraper facilement
 */
class ScraperManager {
  constructor() {
    this.scrapers = {
      // Immobilier
      leboncoin: LeBonCoinScraper,
      // pap: PAPScraper,
      // forums_immo: ForumsImmoScraper,
      
      // B2B
      github: GitHubScraper,
      // reddit: RedditScraper,
      // pagesjaunes: PagesJaunesScraper,
      // linkedin: LinkedInScraper
    };
    
    this.history = [];  // Historique des exécutions
  }

  /**
   * Liste tous les scrapers disponibles
   */
  listScrapers() {
    return Object.keys(this.scrapers).map(key => ({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      available: true
    }));
  }

  /**
   * Vérifie si un scraper existe
   */
  scraperExists(scraperId) {
    return scraperId in this.scrapers;
  }

  /**
   * Lance un scraper spécifique
   * @param {string} scraperId - ID du scraper (ex: 'leboncoin')
   * @param {Object} params - Paramètres de scraping
   * @param {Object} options - Options supplémentaires
   */
  async runScraper(scraperId, params = {}, options = {}) {
    if (!this.scraperExists(scraperId)) {
      throw new Error(`Scraper '${scraperId}' introuvable`);
    }

    console.log(`\n🚀 Lancement du scraper: ${scraperId}`);
    console.log(`📋 Paramètres:`, JSON.stringify(params, null, 2));

    const ScraperClass = this.scrapers[scraperId];
    const scraper = new ScraperClass(options);

    const startTime = Date.now();
    
    try {
      // Détermine la table Supabase selon le scraper
      const saveToTable = this.getTableName(scraperId);
      
      // Lance le scraping
      const result = await scraper.run(params, saveToTable);
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      // Enregistre dans l'historique
      const historyEntry = {
        scraperId,
        params,
        result: {
          success: result.stats.errors === 0,
          itemsScraped: result.stats.itemsScraped,
          itemsSaved: result.stats.itemsSaved,
          errors: result.stats.errors,
          duration: `${duration}s`
        },
        timestamp: new Date().toISOString()
      };
      
      this.history.push(historyEntry);
      
      console.log(`\n✅ Scraping terminé en ${duration}s`);
      
      return result;
    } catch (error) {
      console.error(`\n❌ Erreur lors du scraping:`, error);
      
      this.history.push({
        scraperId,
        params,
        result: {
          success: false,
          error: error.message
        },
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  /**
   * Détermine la table Supabase selon le scraper
   */
  getTableName(scraperId) {
    const mapping = {
      // Immobilier
      leboncoin: 'biens_immobiliers',
      pap: 'biens_immobiliers',
      forums_immo: 'acheteurs',
      
      // B2B
      github: 'prospects',
      reddit: 'prospects',
      pagesjaunes: 'prospects',
      linkedin: 'prospects'
    };
    
    return mapping[scraperId] || 'prospects';
  }

  /**
   * Lance plusieurs scrapers en parallèle
   */
  async runMultiple(scrapers) {
    console.log(`\n🚀 Lancement de ${scrapers.length} scrapers en parallèle`);
    
    const promises = scrapers.map(({ id, params, options }) => 
      this.runScraper(id, params, options)
        .catch(error => ({
          id,
          error: error.message,
          success: false
        }))
    );
    
    const results = await Promise.all(promises);
    
    const successful = results.filter(r => r.stats && r.stats.errors === 0).length;
    const failed = results.length - successful;
    
    console.log(`\n📊 Résultats globaux:`);
    console.log(`✅ Réussis: ${successful}/${results.length}`);
    console.log(`❌ Échoués: ${failed}/${results.length}`);
    
    return results;
  }

  /**
   * Lance tous les scrapers d'une catégorie
   */
  async runCategory(category) {
    const categories = {
      immobilier: ['leboncoin', 'pap'],
      b2b: ['github', 'reddit', 'pagesjaunes']
    };
    
    if (!(category in categories)) {
      throw new Error(`Catégorie '${category}' inconnue`);
    }
    
    const scraperIds = categories[category].filter(id => this.scraperExists(id));
    
    const scrapers = scraperIds.map(id => ({
      id,
      params: {},  // Paramètres par défaut
      options: {}
    }));
    
    return this.runMultiple(scrapers);
  }

  /**
   * Récupère l'historique des exécutions
   */
  getHistory(limit = 10) {
    return this.history.slice(-limit).reverse();
  }

  /**
   * Statistiques globales
   */
  getStats() {
    const total = this.history.length;
    const successful = this.history.filter(h => h.result.success).length;
    const failed = total - successful;
    
    const totalItemsScraped = this.history.reduce((sum, h) => 
      sum + (h.result.itemsScraped || 0), 0
    );
    
    const totalItemsSaved = this.history.reduce((sum, h) => 
      sum + (h.result.itemsSaved || 0), 0
    );
    
    return {
      totalExecutions: total,
      successful,
      failed,
      successRate: total > 0 ? ((successful / total) * 100).toFixed(1) + '%' : '0%',
      totalItemsScraped,
      totalItemsSaved,
      scrapers: this.listScrapers()
    };
  }

  /**
   * Nettoie l'historique
   */
  clearHistory() {
    this.history = [];
    console.log('🗑️ Historique nettoyé');
  }
}

// Export singleton
module.exports = new ScraperManager();
