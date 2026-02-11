// pages/api/B2B/scraper-ultimate.js
// 🚀 SCRAPER ULTIME - Toutes les méthodes en un seul fichier
// Gratuit + Puppeteer + APIs + Import manuel

import * as cheerio from 'cheerio';
import { supabaseAdmin } from '../../../lib/supabase';

// ========================================
// 🎯 CONFIGURATION
// ========================================

const CONFIG = {
  // Activer/désactiver les méthodes
  enablePuppeteer: process.env.ENABLE_PUPPETEER === 'true', // false par défaut (évite erreurs)
  enableAPIs: process.env.ENABLE_APIS === 'true',            // false par défaut (gratuit)
  
  // Clés API (optionnelles)
  hunterApiKey: process.env.HUNTER_API_KEY || null,
  clearbitApiKey: process.env.CLEARBIT_API_KEY || null,
  apolloApiKey: process.env.APOLLO_API_KEY || null,
  
  // Limites
  maxUrlsPerRequest: 5,
  requestTimeout: 15000,
  delayBetweenRequests: 2000, // 2 secondes
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
    
    // Extraire des résultats de recherche
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

    // Consolider les résultats
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
// 🤖 MÉTHODE 4 : PUPPETEER (Optionnel)
// ========================================

async function scrapeWithPuppeteer(websiteUrl) {
  if (!CONFIG.enablePuppeteer) {
    return {
      method: 'puppeteer',
      success: false,
      disabled: true,
      message: 'Puppeteer désactivé. Activez avec ENABLE_PUPPETEER=true'
    };
  }

  try {
    console.log(`🤖 Puppeteer: ${websiteUrl}`);
    
    // Import dynamique de Puppeteer
    let puppeteer, chromium;
    
    if (process.env.NODE_ENV === 'development') {
      puppeteer = await import('puppeteer');
    } else {
      puppeteer = await import('puppeteer-core');
      chromium = await import('@sparticuz/chromium');
    }

    const browser = await puppeteer.default.launch({
      args: chromium?.args || ['--no-sandbox'],
      defaultViewport: chromium?.defaultViewport || { width: 1920, height: 1080 },
      executablePath: chromium ? await chromium.executablePath() : undefined,
      headless: chromium?.headless !== false,
    });

    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    await page.goto(websiteUrl, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await page.waitForTimeout(2000);

    const data = await page.evaluate(() => {
      const result = {
        company: document.querySelector('h1')?.textContent?.trim() || document.title,
        emails: [],
        phones: [],
        address: ''
      };

      // Emails
      const bodyText = document.body.innerText;
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      result.emails = [...new Set(bodyText.match(emailRegex) || [])].slice(0, 5);

      // Téléphones
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
// 💰 MÉTHODE 5 : HUNTER.IO (API payante)
// ========================================

async function findEmailWithHunter(domain, firstName = null, lastName = null) {
  if (!CONFIG.enableAPIs || !CONFIG.hunterApiKey) {
    return {
      method: 'hunter',
      success: false,
      disabled: true
    };
  }

  try {
    console.log(`💰 Hunter.io: ${domain}`);
    
    let url = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${CONFIG.hunterApiKey}`;
    
    if (firstName && lastName) {
      url = `https://api.hunter.io/v2/email-finder?domain=${domain}&first_name=${firstName}&last_name=${lastName}&api_key=${CONFIG.hunterApiKey}`;
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.data) {
      const emails = data.data.emails || [data.data.email];
      
      return {
        method: 'hunter',
        success: true,
        data: {
          emails: emails.filter(Boolean).map(e => e.value || e),
          confidence: data.data.score
        }
      };
    }

    return { method: 'hunter', success: false };

  } catch (error) {
    return {
      method: 'hunter',
      success: false,
      error: error.message
    };
  }
}

// ========================================
// 💼 MÉTHODE 6 : CLEARBIT (API payante)
// ========================================

async function enrichWithClearbit(domain) {
  if (!CONFIG.enableAPIs || !CONFIG.clearbitApiKey) {
    return {
      method: 'clearbit',
      success: false,
      disabled: true
    };
  }

  try {
    console.log(`💼 Clearbit: ${domain}`);
    
    const url = `https://company.clearbit.com/v2/companies/find?domain=${domain}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${CONFIG.clearbitApiKey}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        method: 'clearbit',
        success: true,
        data: {
          name: data.name,
          description: data.description,
          employees: data.metrics?.employees,
          industry: data.category?.industry,
          phone: data.phone,
          address: data.location
        }
      };
    }

    return { method: 'clearbit', success: false };

  } catch (error) {
    return {
      method: 'clearbit',
      success: false,
      error: error.message
    };
  }
}

// ========================================
// 🎯 MÉTHODE 7 : APOLLO.IO (API payante)
// ========================================

async function searchWithApollo(query, location = 'France') {
  if (!CONFIG.enableAPIs || !CONFIG.apolloApiKey) {
    return {
      method: 'apollo',
      success: false,
      disabled: true
    };
  }

  try {
    console.log(`🎯 Apollo.io: ${query}`);
    
    const url = 'https://api.apollo.io/v1/mixed_people/search';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': CONFIG.apolloApiKey
      },
      body: JSON.stringify({
        q_keywords: query,
        person_locations: [location],
        per_page: 10
      })
    });

    if (response.ok) {
      const data = await response.json();
      
      const prospects = data.people?.map(person => ({
        firstName: person.first_name,
        lastName: person.last_name,
        title: person.title,
        email: person.email,
        company: person.organization?.name,
        phone: person.phone_numbers?.[0]?.sanitized_number
      })) || [];

      return {
        method: 'apollo',
        success: true,
        data: { prospects }
      };
    }

    return { method: 'apollo', success: false };

  } catch (error) {
    return {
      method: 'apollo',
      success: false,
      error: error.message
    };
  }
}

// ========================================
// 📥 MÉTHODE 8 : IMPORT CSV/EXCEL
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
        
        if (prospect.Email || prospect.email || prospect['First Name'] || prospect.firstName) {
          prospects.push({
            firstName: prospect['First Name'] || prospect.firstName || '',
            lastName: prospect['Last Name'] || prospect.lastName || '',
            email: prospect.Email || prospect.email || '',
            company: prospect.Company || prospect.company || '',
            phone: prospect.Phone || prospect.phone || '',
            position: prospect.Position || prospect.Title || prospect.position || ''
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
// 🔗 FONCTION DE CONSOLIDATION
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
    companyNumber: '',
    industry: '',
    sources: []
  };

  results.forEach(result => {
    if (!result.success) return;

    consolidated.sources.push(result.method);

    if (result.data) {
      // Nom
      if (result.data.company || result.data.name) {
        consolidated.company = consolidated.company || result.data.company || result.data.name;
      }

      // Emails
      if (result.data.emails) {
        consolidated.emails.push(...result.data.emails);
      }
      if (result.data.email) {
        consolidated.emails.push(result.data.email);
      }

      // Téléphones
      if (result.data.phones) {
        consolidated.phones.push(...result.data.phones);
      }
      if (result.data.phone) {
        consolidated.phones.push(result.data.phone);
      }

      // Adresse
      if (result.data.address) {
        consolidated.address = consolidated.address || result.data.address;
      }

      // Réseaux sociaux
      if (result.data.socialMedia) {
        consolidated.socialMedia = { ...consolidated.socialMedia, ...result.data.socialMedia };
      }

      // Description
      if (result.data.description) {
        consolidated.description = consolidated.description || result.data.description;
      }

      // Numéro entreprise
      if (result.data.companyNumber) {
        consolidated.companyNumber = result.data.companyNumber;
      }

      // Industrie
      if (result.data.industry) {
        consolidated.industry = result.data.industry;
      }

      // Prospects (Apollo)
      if (result.data.prospects) {
        result.data.prospects.forEach(p => {
          if (p.email) consolidated.emails.push(p.email);
          if (p.phone) consolidated.phones.push(p.phone);
        });
      }
    }
  });

  // Dédupliquer
  consolidated.emails = [...new Set(consolidated.emails)].filter(Boolean);
  consolidated.phones = [...new Set(consolidated.phones)].filter(Boolean);

  return consolidated;
}

// ========================================
// 🚀 HANDLER API PRINCIPAL
// ========================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    // Mode de scraping
    mode = 'auto', // 'auto', 'gratuit', 'premium', 'custom'
    
    // Données d'entrée
    companyName,
    websiteUrl,
    location = 'France',
    domain,
    
    // Import
    fileContent,
    fileType,
    
    // Méthodes spécifiques
    methods = [],  // ['cheerio', 'google', 'opencorporates', 'puppeteer', 'hunter', 'clearbit', 'apollo']
    
    // Options
    saveToSupabase = true,
    returnRawResults = false
    
  } = req.body;

  try {
    const results = [];
    let methodsToUse = [];

    // Déterminer quelles méthodes utiliser
    if (mode === 'auto') {
      // MODE AUTO : Utilise toutes les méthodes gratuites disponibles
      methodsToUse = ['cheerio', 'google', 'opencorporates'];
      
      if (CONFIG.enablePuppeteer) methodsToUse.push('puppeteer');
      if (CONFIG.enableAPIs) methodsToUse.push('hunter', 'clearbit');
      
    } else if (mode === 'gratuit') {
      // MODE GRATUIT : Seulement méthodes gratuites
      methodsToUse = ['cheerio', 'google', 'opencorporates'];
      
    } else if (mode === 'premium') {
      // MODE PREMIUM : Toutes les méthodes payantes
      methodsToUse = ['puppeteer', 'hunter', 'clearbit', 'apollo'];
      
    } else if (mode === 'custom') {
      // MODE CUSTOM : Méthodes spécifiées par l'utilisateur
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
      // Délai entre méthodes pour éviter rate limiting
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

        case 'hunter':
          if (domain) {
            result = await findEmailWithHunter(domain);
            results.push(result);
          }
          break;

        case 'clearbit':
          if (domain) {
            result = await enrichWithClearbit(domain);
            results.push(result);
          }
          break;

        case 'apollo':
          if (companyName) {
            result = await searchWithApollo(companyName, location);
            results.push(result);
          }
          break;
      }
    }

    // Consolider les résultats
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
          industry: consolidatedData.industry,
          description: consolidatedData.description,
          source: `scraper-${mode}`,
          raw_data: JSON.stringify(consolidatedData)
        });

      if (error) {
        console.error('Supabase error:', error);
      }
    }

    // Statistiques
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
    responseLimit: false,
  },
  maxDuration: 60, // Nécessite Vercel Pro si > 10s
};
