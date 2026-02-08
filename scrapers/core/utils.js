// core/utils.js

const config = require('../config/scraper-config');

/**
 * Pause l'exécution pendant un délai aléatoire
 * @param {number} min - Délai minimum en ms
 * @param {number} max - Délai maximum en ms
 */
async function randomDelay(min = config.delays.min, max = config.delays.max) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  console.log(`⏳ Attente de ${delay}ms...`);
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Récupère un User-Agent aléatoire
 */
function getRandomUserAgent() {
  const agents = config.userAgents;
  return agents[Math.floor(Math.random() * agents.length)];
}

/**
 * Nettoie et normalise un texte
 */
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')          // Espaces multiples → 1 espace
    .replace(/\n+/g, '\n')         // Retours ligne multiples → 1
    .trim();                       // Supprime espaces début/fin
}

/**
 * Extrait un prix depuis un texte
 * @param {string} text - Texte contenant un prix
 * @returns {number|null} Prix en nombre ou null
 */
function extractPrice(text) {
  if (!text) return null;
  
  // Patterns possibles : "350 000 €", "350000€", "350.000 EUR"
  const patterns = [
    /(\d+[\s\.]?\d*)\s*€/,
    /(\d+[\s\.]?\d*)\s*euros?/i,
    /(\d+[\s\.]?\d*)\s*EUR/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Supprime espaces et points, convertit en nombre
      return parseInt(match[1].replace(/[\s\.]/g, ''));
    }
  }
  
  return null;
}

/**
 * Extrait une surface depuis un texte
 */
function extractSurface(text) {
  if (!text) return null;
  
  const match = text.match(/(\d+[\.,]?\d*)\s*m[²2]/i);
  return match ? parseFloat(match[1].replace(',', '.')) : null;
}

/**
 * Extrait un nombre de pièces
 */
function extractPieces(text) {
  if (!text) return null;
  
  // Patterns : "T3", "3 pièces", "F4"
  const patterns = [
    /[TF](\d+)/i,
    /(\d+)\s*pi[èe]ces?/i,
    /(\d+)\s*p\b/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return parseInt(match[1]);
  }
  
  return null;
}

/**
 * Extrait un email depuis un texte
 */
function extractEmail(text) {
  if (!text) return null;
  
  const match = text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
  return match ? match[0] : null;
}

/**
 * Extrait un téléphone français
 */
function extractPhone(text) {
  if (!text) return null;
  
  // Formats : 06 12 34 56 78, 0612345678, +33 6 12 34 56 78
  const patterns = [
    /(\+33|0)\s*[1-9](?:[\s\.-]*\d{2}){4}/g,
    /0[1-9]\d{8}/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Normalise au format 0X XX XX XX XX
      let phone = match[0].replace(/[\s\.-]/g, '');
      if (phone.startsWith('+33')) {
        phone = '0' + phone.slice(3);
      }
      return phone.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
    }
  }
  
  return null;
}

/**
 * Génère un hash unique pour détecter les doublons
 */
function generateHash(obj) {
  const crypto = require('crypto');
  const str = JSON.stringify(obj);
  return crypto.createHash('md5').update(str).digest('hex');
}

/**
 * Vérifie si une URL est valide
 */
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Retry une fonction avec backoff exponentiel
 */
async function retryWithBackoff(fn, maxRetries = config.maxRetries) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = Math.min(1000 * Math.pow(2, i), 10000);
      console.log(`❌ Erreur, retry ${i + 1}/${maxRetries} dans ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Log avec timestamp
 */
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    success: '✅'
  }[level] || 'ℹ️';
  
  console.log(`[${timestamp}] ${prefix} ${message}`);
  
  // TODO: Sauvegarder dans un fichier si config.logging.saveToFile
}

/**
 * Formatte une adresse
 */
function formatAddress(address) {
  if (!address) return null;
  
  return cleanText(address)
    .replace(/,\s+/g, ', ')
    .replace(/\s+,/g, ',');
}

/**
 * Normalise une ville (majuscules, accents)
 */
function normalizeCity(city) {
  if (!city) return null;
  
  return city
    .toLowerCase()
    .replace(/[àáâã]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõ]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Vérifie si un objet est vide
 */
function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

/**
 * Calcule des statistiques sur un dataset
 */
function calculateStats(items) {
  if (!items || items.length === 0) {
    return { count: 0, avg: 0, min: 0, max: 0 };
  }
  
  const values = items.filter(v => v != null);
  
  return {
    count: values.length,
    avg: values.reduce((a, b) => a + b, 0) / values.length,
    min: Math.min(...values),
    max: Math.max(...values)
  };
}

module.exports = {
  randomDelay,
  getRandomUserAgent,
  cleanText,
  extractPrice,
  extractSurface,
  extractPieces,
  extractEmail,
  extractPhone,
  generateHash,
  isValidUrl,
  retryWithBackoff,
  log,
  formatAddress,
  normalizeCity,
  isEmpty,
  calculateStats
};
