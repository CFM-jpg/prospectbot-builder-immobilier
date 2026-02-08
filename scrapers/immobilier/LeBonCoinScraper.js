// immobilier/LeBonCoinScraper.js

const BaseScraper = require('../core/BaseScraper');
const puppeteer = require('puppeteer');
const config = require('../config/scraper-config');

/**
 * Scraper LeBonCoin pour biens immobiliers
 * Utilise Puppeteer pour gérer le JavaScript
 */
class LeBonCoinScraper extends BaseScraper {
  constructor(options = {}) {
    super('LeBonCoin', options);
    this.browser = null;
    this.page = null;
  }

  /**
   * Initialise le navigateur
   */
  async initialize() {
    await super.initialize();
    
    this.browser = await puppeteer.launch(config.puppeteer);
    this.page = await this.browser.newPage();
    
    // Configure le User-Agent
    await this.page.setUserAgent(this.getUserAgent());
    
    // Configure le viewport
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Bloque les ressources inutiles (plus rapide)
    await this.page.setRequestInterception(true);
    this.page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['image', 'font', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });
  }

  /**
   * Construit l'URL de recherche
   */
  buildSearchUrl(params) {
    const {
      ville = '',
      type = 'ventes',  // ou 'locations'
      prixMin = null,
      prixMax = null,
      surfaceMin = null,
      piecesMin = null
    } = params;

    const baseUrl = 'https://www.leboncoin.fr/recherche';
    const searchParams = new URLSearchParams();

    // Catégorie (9 = ventes, 10 = locations)
    searchParams.append('category', type === 'ventes' ? '9' : '10');

    // Localisation
    if (ville) {
      searchParams.append('locations', ville);
    }

    // Prix
    if (prixMin) searchParams.append('price', `${prixMin}-${prixMax || ''}`);
    if (prixMax && !prixMin) searchParams.append('price', `-${prixMax}`);

    // Surface
    if (surfaceMin) searchParams.append('square', `${surfaceMin}-`);

    // Pièces
    if (piecesMin) searchParams.append('rooms', `${piecesMin}-`);

    return `${baseUrl}?${searchParams.toString()}`;
  }

  /**
   * Scrape une page de résultats
   */
  async scrapePage(url) {
    try {
      await this.page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Attend que les annonces se chargent
      await this.page.waitForSelector('[data-qa-id="aditem_container"]', { timeout: 10000 });

      // Extrait les données de toutes les annonces
      const annonces = await this.page.evaluate(() => {
        const items = [];
        const containers = document.querySelectorAll('[data-qa-id="aditem_container"]');

        containers.forEach(container => {
          try {
            // Titre
            const titreEl = container.querySelector('[data-qa-id="aditem_title"]');
            const titre = titreEl ? titreEl.textContent.trim() : null;

            // Prix
            const prixEl = container.querySelector('[data-qa-id="aditem_price"]');
            const prixText = prixEl ? prixEl.textContent.trim() : null;

            // URL de l'annonce
            const lienEl = container.querySelector('a[href*="/ventes_immobilieres/"]');
            const url = lienEl ? 'https://www.leboncoin.fr' + lienEl.getAttribute('href') : null;

            // Localisation
            const locEl = container.querySelector('[data-qa-id="aditem_location"]');
            const localisation = locEl ? locEl.textContent.trim() : null;

            // Attributs (surface, pièces)
            const attributsEl = container.querySelectorAll('[data-qa-id="aditem_attributes"]');
            let surface = null;
            let pieces = null;

            attributsEl.forEach(attr => {
              const text = attr.textContent;
              if (text.includes('m²')) {
                const match = text.match(/(\d+)\s*m²/);
                if (match) surface = parseInt(match[1]);
              }
              if (text.includes('pièce')) {
                const match = text.match(/(\d+)\s*pièce/);
                if (match) pieces = parseInt(match[1]);
              }
            });

            // Date de publication
            const dateEl = container.querySelector('[data-qa-id="aditem_date"]');
            const dateText = dateEl ? dateEl.textContent.trim() : null;

            if (titre && url) {
              items.push({
                titre,
                prix_texte: prixText,
                url,
                localisation,
                surface,
                pieces,
                date_publication: dateText
              });
            }
          } catch (e) {
            console.error('Erreur parsing annonce:', e);
          }
        });

        return items;
      });

      return annonces;
    } catch (error) {
      this.handleError(error, 'scrapePage');
      return [];
    }
  }

  /**
   * Scrape les détails d'une annonce
   */
  async scrapeDetails(url) {
    try {
      await this.page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      await this.delay(2000, 4000); // Délai anti-détection

      const details = await this.page.evaluate(() => {
        const data = {};

        // Description
        const descEl = document.querySelector('[data-qa-id="adview_description_container"]');
        data.description = descEl ? descEl.textContent.trim() : null;

        // Images
        const imgEls = document.querySelectorAll('[data-qa-id="slideshow_container"] img');
        data.photos = Array.from(imgEls).map(img => img.src).filter(Boolean);

        // Caractéristiques (tableau clé-valeur)
        const propEls = document.querySelectorAll('[data-qa-id="criteria_item"]');
        propEls.forEach(el => {
          const key = el.querySelector('[data-qa-id="criteria_item_key"]')?.textContent.trim();
          const value = el.querySelector('[data-qa-id="criteria_item_value"]')?.textContent.trim();
          if (key && value) {
            data[key.toLowerCase().replace(/\s+/g, '_')] = value;
          }
        });

        // Téléphone (si visible)
        const phoneEl = document.querySelector('[data-qa-id="adview_phone_number"]');
        data.telephone = phoneEl ? phoneEl.textContent.trim() : null;

        // Email du vendeur (rarement visible directement)
        data.email = null; // LeBonCoin masque les emails

        return data;
      });

      return details;
    } catch (error) {
      this.handleError(error, 'scrapeDetails');
      return {};
    }
  }

  /**
   * Scraping principal
   */
  async scrape(params) {
    const url = this.buildSearchUrl(params);
    console.log(`🔍 Scraping: ${url}`);

    // 1. Scrape la première page
    let annonces = await this.scrapePage(url);
    console.log(`✅ ${annonces.length} annonces trouvées`);

    // Limite le nombre d'annonces
    const maxItems = Math.min(annonces.length, this.options.limits.maxItemsPerRun);
    annonces = annonces.slice(0, maxItems);

    // 2. Pour chaque annonce, scrape les détails
    for (let i = 0; i < annonces.length; i++) {
      const annonce = annonces[i];
      
      console.log(`📄 [${i + 1}/${annonces.length}] ${annonce.titre}`);

      try {
        // Scrape détails
        const details = await this.scrapeDetails(annonce.url);

        // Combine données
        const item = {
          ...annonce,
          ...details,
          prix: this.extractPrice(annonce.prix_texte),
          ville: this.extractVille(annonce.localisation),
          type_bien: this.detectTypeBien(annonce.titre),
          source: 'leboncoin'
        };

        this.addResult(item);
      } catch (error) {
        this.handleError(error, `scrape annonce ${annonce.url}`);
      }

      // Délai entre annonces
      if (i < annonces.length - 1) {
        await this.delay();
      }
    }
  }

  /**
   * Extrait la ville depuis une localisation
   */
  extractVille(localisation) {
    if (!localisation) return null;
    
    // Format : "Lyon 3ème (69003)" ou "Villeurbanne"
    const match = localisation.match(/^([^(]+)/);
    return match ? match[1].trim() : null;
  }

  /**
   * Détecte le type de bien depuis le titre
   */
  detectTypeBien(titre) {
    if (!titre) return 'Autre';
    
    const titreLower = titre.toLowerCase();
    
    if (titreLower.includes('appartement') || /t\d|f\d/.test(titreLower)) {
      return 'Appartement';
    }
    if (titreLower.includes('maison') || titreLower.includes('villa')) {
      return 'Maison';
    }
    if (titreLower.includes('terrain')) {
      return 'Terrain';
    }
    if (titreLower.includes('garage') || titreLower.includes('parking')) {
      return 'Garage/Parking';
    }
    if (titreLower.includes('bureau') || titreLower.includes('local')) {
      return 'Local commercial';
    }
    
    return 'Autre';
  }

  /**
   * Validation spécifique LeBonCoin
   */
  validate(item) {
    const errors = [];

    if (!item.titre) errors.push('Titre manquant');
    if (!item.url) errors.push('URL manquante');
    if (!item.ville) errors.push('Ville manquante');
    if (!item.prix || item.prix <= 0) errors.push('Prix invalide');

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Transformation spécifique
   */
  transform(item) {
    const base = super.transform(item);
    
    return {
      ...base,
      // Normalisation
      ville: this.cleanText(item.ville),
      titre: this.cleanText(item.titre),
      description: this.cleanText(item.description),
      
      // Métadonnées
      url_annonce: item.url,
      scraped_from: 'leboncoin'
    };
  }

  /**
   * Nettoyage final
   */
  async finalize() {
    if (this.browser) {
      await this.browser.close();
    }
    return super.finalize();
  }
}

module.exports = LeBonCoinScraper;
