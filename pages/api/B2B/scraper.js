// pages/api/B2B/scraper.js
// 🚀 SCRAPER ULTIME - Version sans erreur d'import Puppeteer
// Fonctionne sur Vercel FREE sans problème !

import * as cheerio from 'cheerio';
import { supabaseAdmin } from '../../../lib/supabase';

// ========================================
// 🎯 CONFIGURATION
// ========================================

const CONFIG = {
  // Activer/désactiver les méthodes
  enablePuppeteer: process.env.ENABLE_PUPPETEER === 'true',
  enableAPIs: process.env.ENABLE_APIS === 'true',
  
  // Clés API (optionnelles)
  hunterApiKey: process.env.HUNTER_API_KEY || null,
  clearbitApiKey: process.env.CLEARBIT_API_KEY || null,
  apolloApiKey: process.env.APOLLO_API_KEY || null,
  
  // Limites
  maxUrlsPerRequest: 5,
  requestTimeout: 15000,
  delayBetweenRequests: 2000,
};

// ========================================
// 🆓 MÉTHODE 1 : SCRAPING GRATUIT (Cheerio)
// ========================================

async function scrapeSiteWebGratuit(websiteUrl) {
  try {
    console.log(`📍 Scraping gratuit: ${websiteUrl}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.requestTimeout);
    
    const response = await fetch(websiteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Referer': 'https://www.google.com/'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { 
        method: 'gratuit-cheerio',
        success: false, 
        status: response.status,
        error: `HTTP ${response.status}`
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const data = {
      company: '',
      emails: [],
      phones: [],
      address: '',
      website: websiteUrl,
      socialMedia: {},
      description: ''
    };

    // Nom de l'entreprise
    data.company = $('meta[property="og:site_name"]').attr('content') 
      || $('meta[name="application-name"]').attr('content')
      || $('title').text().split('|')[0].split('-')[0].trim()
      || $('h1').first().text().trim();

    // Description
    data.description = $('meta[name="description"]').attr('content') || '';

    // Chercher dans toute la page
    const fullText = $('body').text();
    
    // Emails (regex + mailto)
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emailsFromText = fullText.match(emailRegex) || [];
    
    $('a[href^="mailto:"]').each((i, elem) => {
      const email = $(elem).attr('href').replace('mailto:', '').split('?')[0].trim();
      if (email) emailsFromText.push(email);
    });
    
    // Filtrer emails invalides
    data.emails = [...new Set(emailsFromText)]
      .filter(e => 
        !e.includes('example.com') && 
        !e.includes('sentry') && 
        !e.includes('wixpress') &&
        !e.includes('placeholder') &&
        e.length < 50
      )
      .slice(0, 5);

    // Téléphones (regex + tel:)
    const phoneRegex = /(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}/g;
    const phonesFromText = fullText.match(phoneRegex) || [];
    
    $('a[href^="tel:"]').each((i, elem) => {
      const phone = $(elem).attr('href').replace('tel:', '').trim();
      if (phone) phonesFromText.push(phone);
    });
    
    data.phones = [...new Set(phonesFromText)]
      .map(p => p.replace(/\s+/g, ' ').trim())
      .slice(0, 3);

    // Réseaux sociaux
    data.socialMedia.linkedin = $('a[href*="linkedin.com/company"]').attr('href') || '';
    data.socialMedia.facebook = $('a[href*="facebook.com"]').attr('href') || '';
    data.socialMedia.twitter = $('a[href*="twitter.com"], a[href*="x.com"]').attr('href') || '';
    data.socialMedia.instagram = $('a[href*="instagram.com"]').attr('href') || '';

    // Adresse
    const addressSelectors = [
      '[itemprop="address"]',
      '.address',
      '[class*="address"]',
      'address',
      '.footer'
    ];
    
    for (const selector of addressSelectors) {
      const addressText = $(selector).text();
      const match = addressText.match(/\d{1,5}\s+[\w\s]+,?\s*\d{5}\s+[\w\s]+/);
      if (match) {
        data.address = match[0].trim();
        break;
      }
    }

    return {
      method: 'gratuit-cheerio',
      success: true,
      data: data,
      foundContacts: data.emails.length > 0 || data.phones.length > 0
    };

  } catch (error) {
    return {
      method: 'gratuit-cheerio',
      success: false,
      error: error.message
    };
  }
}

// ========================================
// 🔍 MÉTHODE 2 : GOOGLE SEARCH GRATUIT
// ========================================

async function searchViaGoogle(companyName, location = 'France') {
  try {
    console.log(`🔍 Google search: ${companyName}`);
    
    const query = `"${companyName}" ${location} (email OR contact OR téléphone OR "nous contacter")`;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=10`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        'Referer': 'https://www.google.com/'
      }
    });

    if (!response.ok) {
      return { 
        method: 'google-search',
        success: false,
        blocked: response.status === 403 || response.status === 429
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const results = [];
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex = /(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}/g;
    
    $('.g, .tF2Cxc').each((i, elem) => {
      const link = $(elem).find('a').first().attr('href');
      const snippet = $(elem).text();
      
      const emails = snippet.match(emailRegex) || [];
      const phones = snippet.match(phoneRegex) || [];
      
      if (emails.length > 0 || phones.length > 0) {
        results.push({
          url: link,
          emails: [...new Set(emails)],
          phones: [...new Set(phones)],
          snippet: snippet.substring(0, 200)
        });
      }
    });

    const allEmails = [];
    const allPhones = [];
    
    results.forEach(r => {
      allEmails.push(...r.emails);
      allPhones.push(...r.phones);
    });

    return {
      method: 'google-search',
      success: true,
      data: {
        emails: [...new Set(allEmails)].slice(0, 5),
        phones: [...new Set(allPhones)].slice(0, 3),
        sources: results.length
      },
      foundContacts: allEmails.length > 0 || allPhones.length > 0
    };

  } catch (error) {
    return {
      method: 'google-search',
      success: false,
      error: error.message
    };
  }
}

// ========================================
// 📊 MÉTHODE 3 : OPENCORPORATES (Gratuit)
// ========================================

async function searchOpenCorporates(companyName, jurisdiction = 'fr') {
  try {
    console.log(`📊 OpenCorporates: ${companyName}`);
    
    const query = encodeURIComponent(companyName);
    const url = `https://api.opencorporates.com/v0.4/companies/search?q=${query}&jurisdiction_code=${jurisdiction}`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (!response.ok) {
      return { method: 'opencorporates', success: false };
    }

    const data = await response.json();
    
    if (data.results?.companies && data.results.companies.length > 0) {
      const company = data.results.companies[0].company;
      
      return {
        method: 'opencorporates',
        success: true,
        data: {
          name: company.name,
          companyNumber: company.company_number,
          address: company.registered_address_in_full,
          status: company.current_status,
          incorporationDate: company.incorporation_date,
          jurisdiction: company.jurisdiction_code
        }
      };
    }

    return { method: 'opencorporates', success: false };

  } catch (error) {
    return {
      method: 'opencorporates',
      success: false,
      error: error.message
    };
  }
}

// ========================================
// 🤖 MÉTHODE 4 : PUPPETEER (Import dynamique)
// ========================================

async function scrapeWithPuppeteer(websiteUrl) {
  if (!CONFIG.enablePuppeteer) {
    return {
      method: 'puppeteer',
      success: false,
      disabled: true,
      message: 'Puppeteer désactivé. Activez avec ENABLE_PUPPETEER=true et installez les dépendances.'
    };
  }

  try {
    console.log(`🤖 Puppeteer: ${websiteUrl}`);
    
    // ⚠️ Import dynamique uniquement si activé
    const puppeteerModule = process.env.NODE_ENV === 'development' 
      ? await import('puppeteer')
      : await import('puppeteer-core');
    
    const chromiumModule = process.env.NODE_ENV !== 'development'
      ? await import('@sparticuz/chromium')
      : null;

    const puppeteer = puppeteerModule.default;
    const chromium = chromiumModule?.default;

    const browser = await puppeteer.launch({
      args: chromium?.args || ['--no-sandbox'],
      defaultViewport: chromium?.defaultViewport || { width: 1920, height: 1080 },
      executablePath: chromium ? await chromium.executablePath() : undefined,
      headless: chromium?.headless !== false,
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await page.goto(websiteUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(2000);

    const data = await page.evaluate(() => {
      const result = {
        company: document.querySelector('h1')?.textContent?.trim() || document.title,
        emails: [],
        phones: []
      };

      const bodyText = document.body.innerText;
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      result.emails = [...new Set(bodyText.match(emailRegex) || [])].slice(0, 5);

      const phoneRegex = /(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}/g;
      result.phones = [...new Set(bodyText.match(phoneRegex) || [])].slice(0, 3);

      return result;
    });

    await browser.close();

    return {
      method: 'puppeteer',
      success: true,
      data: data,
      foundContacts: data.emails.length > 0 || data.phones.length > 0
    };

  } catch (error) {
    return {
      method: 'puppeteer',
      success: false,
      error: error.message
    };
  }
}

// ========================================
// 📥 MÉTHODE 5 : IMPORT CSV
// ========================================

async function parseImportFile(fileContent, fileType = 'csv') {
  try {
    console.log(`📥 Import ${fileType}`);
    
    const prospects = [];

    if (fileType === 'csv') {
      const lines = fileContent.split('\n').filter(line => line.trim());
      if (lines.length === 0) return { method: 'import', success: false };
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const prospect = {};
        
        headers.forEach((header, index) => {
          prospect[header] = values[index] || '';
        });
        
        if (prospect.Email || prospect.email || prospect['First Name']) {
          prospects.push({
            firstName: prospect['First Name'] || prospect.firstName || '',
            lastName: prospect['Last Name'] || prospect.lastName || '',
            email: prospect.Email || prospect.email || '',
            company: prospect.Company || prospect.company || '',
            phone: prospect.Phone || prospect.phone || ''
          });
        }
      }
    }

    return {
      method: 'import',
      success: true,
      data: { prospects },
      count: prospects.length
    };

  } catch (error) {
    return {
      method: 'import',
      success: false,
      error: error.message
    };
  }
}

// ========================================
// 🔗 CONSOLIDATION
// ========================================

function consolidateResults(results, companyName, websiteUrl) {
  const consolidated = {
    company: companyName || '',
    emails: [],
    phones: [],
    address: '',
    website: websiteUrl || '',
    socialMedia: {},
    description: '',
    sources: []
  };

  results.forEach(result => {
    if (!result.success) return;

    consolidated.sources.push(result.method);

    if (result.data) {
      if (result.data.company || result.data.name) {
        consolidated.company = consolidated.company || result.data.company || result.data.name;
      }

      if (result.data.emails) {
        consolidated.emails.push(...result.data.emails);
      }

      if (result.data.phones) {
        consolidated.phones.push(...result.data.phones);
      }

      if (result.data.address) {
        consolidated.address = consolidated.address || result.data.address;
      }

      if (result.data.socialMedia) {
        consolidated.socialMedia = { ...consolidated.socialMedia, ...result.data.socialMedia };
      }

      if (result.data.description) {
        consolidated.description = consolidated.description || result.data.description;
      }
    }
  });

  consolidated.emails = [...new Set(consolidated.emails)].filter(Boolean);
  consolidated.phones = [...new Set(consolidated.phones)].filter(Boolean);

  return consolidated;
}

// ========================================
// 🚀 HANDLER API
// ========================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    mode = 'auto',
    companyName,
    websiteUrl,
    location = 'France',
    fileContent,
    fileType,
    methods = [],
    saveToSupabase = true,
    returnRawResults = false
  } = req.body;

  try {
    const results = [];
    let methodsToUse = [];

    // Déterminer les méthodes
    if (mode === 'auto') {
      methodsToUse = ['cheerio', 'google', 'opencorporates'];
      if (CONFIG.enablePuppeteer) methodsToUse.push('puppeteer');
    } else if (mode === 'gratuit') {
      methodsToUse = ['cheerio', 'google', 'opencorporates'];
    } else if (mode === 'custom') {
      methodsToUse = methods;
    }

    console.log(`🎯 Mode: ${mode}, Méthodes: ${methodsToUse.join(', ')}`);

    // Import CSV
    if (fileContent) {
      const result = await parseImportFile(fileContent, fileType);
      results.push(result);
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          mode: 'import',
          data: result.data,
          count: result.count
        });
      }
    }

    // Exécuter les méthodes
    for (const method of methodsToUse) {
      if (results.length > 0) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenRequests));
      }

      let result;

      switch (method) {
        case 'cheerio':
          if (websiteUrl) {
            result = await scrapeSiteWebGratuit(websiteUrl);
            results.push(result);
          }
          break;

        case 'google':
          if (companyName) {
            result = await searchViaGoogle(companyName, location);
            results.push(result);
          }
          break;

        case 'opencorporates':
          if (companyName) {
            result = await searchOpenCorporates(companyName);
            results.push(result);
          }
          break;

        case 'puppeteer':
          if (websiteUrl) {
            result = await scrapeWithPuppeteer(websiteUrl);
            results.push(result);
          }
          break;
      }
    }

    // Consolider
    const consolidatedData = consolidateResults(results, companyName, websiteUrl);

    // Sauvegarder dans Supabase
    if (saveToSupabase && consolidatedData.emails.length > 0 && supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from('prospects')
        .insert({
          company: consolidatedData.company,
          email: consolidatedData.emails[0],
          phone: consolidatedData.phones[0] || '',
          address: consolidatedData.address,
          website: consolidatedData.website,
          description: consolidatedData.description,
          source: `scraper-${mode}`,
          raw_data: JSON.stringify(consolidatedData)
        });

      if (error) {
        console.error('Supabase error:', error);
      }
    }

    // Stats
    const stats = {
      total: results.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      disabled: results.filter(r => r.disabled).length
    };

    return res.status(200).json({
      success: true,
      mode: mode,
      stats: stats,
      data: consolidatedData,
      foundContacts: consolidatedData.emails.length > 0 || consolidatedData.phones.length > 0,
      ...(returnRawResults && { rawResults: results })
    });

  } catch (error) {
    console.error('Scraper error:', error);
    return res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
