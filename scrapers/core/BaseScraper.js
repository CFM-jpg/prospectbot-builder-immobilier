// core/BaseScraper.js

const config = require('../config/scraper-config');
const utils = require('./utils');

/**
 * Classe de base pour tous les scrapers
 * Fournit les fonctionnalités communes
 */
class BaseScraper {
  constructor(name, options = {}) {
    this.name = name;
    this.options = { ...config, ...options };
    this.results = [];
    this.errors = [];
    this.stats = {
      startTime: null,
      endTime: null,
      itemsScraped: 0,
      itemsSaved: 0,
      errors: 0,
      duplicates: 0
    };
  }

  /**
   * Initialisation du scraper (à override)
   */
  async initialize() {
    utils.log(`🚀 Initialisation du scraper ${this.name}`, 'info');
    this.stats.startTime = new Date();
  }

  /**
   * Scraping principal (à override)
   * @param {Object} params - Paramètres de recherche
   */
  async scrape(params) {
    throw new Error('La méthode scrape() doit être implémentée');
  }

  /**
   * Validation des données (à override)
   * @param {Object} item - Item à valider
   */
  validate(item) {
    // Validation de base
    if (!item || typeof item !== 'object') {
      return { valid: false, errors: ['Item invalide'] };
    }
    
    return { valid: true, errors: [] };
  }

  /**
   * Transformation des données (à override)
   * @param {Object} item - Item brut
   */
  transform(item) {
    // Transformation de base
    return {
      ...item,
      scraped_at: new Date().toISOString(),
      scraper_name: this.name,
      source: this.options.source || this.name
    };
  }

  /**
   * Ajoute un résultat valide
   */
  addResult(item) {
    const validation = this.validate(item);
    
    if (!validation.valid) {
      utils.log(`⚠️ Item invalide: ${validation.errors.join(', ')}`, 'warn');
      this.stats.errors++;
      return false;
    }
    
    const transformedItem = this.transform(item);
    
    // Vérification doublon
    const hash = utils.generateHash(transformedItem);
    const isDuplicate = this.results.some(r => r._hash === hash);
    
    if (isDuplicate) {
      utils.log(`⚠️ Doublon détecté`, 'warn');
      this.stats.duplicates++;
      return false;
    }
    
    transformedItem._hash = hash;
    this.results.push(transformedItem);
    this.stats.itemsScraped++;
    
    return true;
  }

  /**
   * Gère une erreur
   */
  handleError(error, context = '') {
    const errorObj = {
      message: error.message,
      context,
      timestamp: new Date().toISOString()
    };
    
    this.errors.push(errorObj);
    this.stats.errors++;
    
    utils.log(`❌ Erreur (${context}): ${error.message}`, 'error');
  }

  /**
   * Sauvegarde dans Supabase
   */
  async saveToSupabase(tableName) {
    if (this.results.length === 0) {
      utils.log('⚠️ Aucun résultat à sauvegarder', 'warn');
      return { success: false, saved: 0 };
    }

    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        this.options.supabase.url,
        this.options.supabase.serviceKey
      );

      // Supprime le hash temporaire avant sauvegarde
      const itemsToSave = this.results.map(({ _hash, ...item }) => item);

      const { data, error } = await supabase
        .from(tableName)
        .upsert(itemsToSave, { 
          onConflict: 'email',  // Ou autre champ unique
          ignoreDuplicates: true 
        });

      if (error) throw error;

      this.stats.itemsSaved = data?.length || itemsToSave.length;
      utils.log(`✅ ${this.stats.itemsSaved} items sauvegardés dans ${tableName}`, 'success');

      return { success: true, saved: this.stats.itemsSaved };
    } catch (error) {
      this.handleError(error, 'saveToSupabase');
      return { success: false, saved: 0, error: error.message };
    }
  }

  /**
   * Finalisation et rapport
   */
  async finalize() {
    this.stats.endTime = new Date();
    const duration = (this.stats.endTime - this.stats.startTime) / 1000;
    
    utils.log(`\n📊 RAPPORT ${this.name}`, 'info');
    utils.log(`⏱️  Durée: ${duration.toFixed(2)}s`, 'info');
    utils.log(`✅ Items scrapés: ${this.stats.itemsScraped}`, 'success');
    utils.log(`💾 Items sauvegardés: ${this.stats.itemsSaved}`, 'success');
    utils.log(`⚠️  Doublons: ${this.stats.duplicates}`, 'warn');
    utils.log(`❌ Erreurs: ${this.stats.errors}`, 'error');
    
    return {
      name: this.name,
      stats: this.stats,
      results: this.results,
      errors: this.errors
    };
  }

  /**
   * Exécute le scraper complet (workflow)
   */
  async run(params, saveToTable = null) {
    try {
      await this.initialize();
      
      utils.log(`🎯 Démarrage scraping avec params: ${JSON.stringify(params)}`, 'info');
      await this.scrape(params);
      
      if (saveToTable) {
        await this.saveToSupabase(saveToTable);
      }
      
      return await this.finalize();
    } catch (error) {
      this.handleError(error, 'run');
      return await this.finalize();
    }
  }

  /**
   * Utilitaires réutilisables
   */
  async delay(min, max) {
    return utils.randomDelay(min, max);
  }

  getUserAgent() {
    return utils.getRandomUserAgent();
  }

  cleanText(text) {
    return utils.cleanText(text);
  }

  extractPrice(text) {
    return utils.extractPrice(text);
  }

  extractSurface(text) {
    return utils.extractSurface(text);
  }

  extractPieces(text) {
    return utils.extractPieces(text);
  }

  extractEmail(text) {
    return utils.extractEmail(text);
  }

  extractPhone(text) {
    return utils.extractPhone(text);
  }
}

module.exports = BaseScraper;
