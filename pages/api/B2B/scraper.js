// pages/api/B2B/scraper-gratuit.js
// Scraper 100% GRATUIT sans Puppeteer
// Fonctionne sur Vercel Free !

import * as cheerio from 'cheerio';
import { supabaseAdmin } from '../../../lib/supabase';

// 🎯 STRATÉGIE : Scraper les sites qui ne bloquent PAS

// Liste de sites gratuits et scrapables
const SOURCES_GRATUITES = {
  // Annuaires open-source
  openCorporates: 'https://opencorporates.com',
  
  // Pages publiques LinkedIn (via Google)
  linkedinViaGoogle: 'https://www.google.com/search?q=site:linkedin.com',
  
  // Sites vitrine PME (pas protégés)
  sitesVitrines: true
};

// 🔧 MÉTHODE 1 : GOOGLE SEARCH SCRAPING (la plus efficace)
// Google trouve les infos de contact que les sites cachent
async function searchContactsViaGoogle(companyName, location = 'France') {
  try {
    const query = `"${companyName}" ${location} (email OR contact OR téléphone)`;
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
      return { method: 'google', blocked: true };
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const results = [];
    
    // Extraire les résultats de recherche
    $('.g').each((i, elem) => {
      const link = $(elem).find('a').attr('href');
      const snippet = $(elem).find('.VwiC3b').text();
      
      // Chercher emails et téléphones dans les snippets
      const emails = snippet.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
      const phones = snippet.match(/(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}/g) || [];
      
      if (emails.length > 0 || phones.length > 0) {
        results.push({
          url: link,
          emails: [...new Set(emails)],
          phones: [...new Set(phones)],
          snippet: snippet.substring(0, 200)
        });
      }
    });

    return {
      method: 'google',
      success: true,
      results: results
    };

  } catch (error) {
    console.error('Google search error:', error.message);
    return { method: 'google', error: error.message };
  }
}

// 🔧 MÉTHODE 2 : SCRAPER LE SITE WEB DIRECT DE L'ENTREPRISE
// Si tu as l'URL du site web, scrape la page contact
async function scrapeSiteWeb(websiteUrl) {
  try {
    const response = await fetch(websiteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      return { success: false, status: response.status };
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const data = {
      company: '',
      emails: [],
      phones: [],
      address: '',
      socialMedia: {}
    };

    // Nom de l'entreprise
    data.company = $('meta[property="og:site_name"]').attr('content') 
      || $('title').text().split('|')[0].trim()
      || $('h1').first().text().trim();

    // Chercher dans toute la page
    const fullText = $('body').text();
    
    // Emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = fullText.match(emailRegex) || [];
    data.emails = [...new Set(emails)].filter(e => 
      !e.includes('example.com') && 
      !e.includes('sentry') && 
      !e.includes('google')
    ).slice(0, 5);

    // Téléphones français
    const phoneRegex = /(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}/g;
    const phones = fullText.match(phoneRegex) || [];
    data.phones = [...new Set(phones)].slice(0, 3);

    // Liens mailto
    $('a[href^="mailto:"]').each((i, elem) => {
      const email = $(elem).attr('href').replace('mailto:', '').split('?')[0];
      if (email && !data.emails.includes(email)) {
        data.emails.push(email);
      }
    });

    // Liens tel
    $('a[href^="tel:"]').each((i, elem) => {
      const phone = $(elem).attr('href').replace('tel:', '').trim();
      if (phone && !data.phones.includes(phone)) {
        data.phones.push(phone);
      }
    });

    // Réseaux sociaux
    data.socialMedia.linkedin = $('a[href*="linkedin.com"]').attr('href') || '';
    data.socialMedia.facebook = $('a[href*="facebook.com"]').attr('href') || '';
    data.socialMedia.twitter = $('a[href*="twitter.com"], a[href*="x.com"]').attr('href') || '';

    // Adresse (chercher dans footer et section contact)
    const addressText = $('.footer, .contact, [class*="address"]').text();
    const addressMatch = addressText.match(/\d{1,5}\s+[\w\s]+,\s*\d{5}\s+[\w\s]+/);
    if (addressMatch) {
      data.address = addressMatch[0];
    }

    return {
      success: true,
      data: data,
      foundContacts: data.emails.length > 0 || data.phones.length > 0
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// 🔧 MÉTHODE 3 : OPENCORPORATES (base de données publique)
async function searchOpenCorporates(companyName, jurisdiction = 'fr') {
  try {
    const query = encodeURIComponent(companyName);
    const url = `https://api.opencorporates.com/v0.4/companies/search?q=${query}&jurisdiction_code=${jurisdiction}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!response.ok) {
      return { success: false };
    }

    const data = await response.json();
    
    if (data.results && data.results.companies) {
      return {
        success: true,
        companies: data.results.companies.map(item => ({
          name: item.company.name,
          companyNumber: item.company.company_number,
          jurisdiction: item.company.jurisdiction_code,
          address: item.company.registered_address_in_full,
          status: item.company.current_status,
          incorporationDate: item.company.incorporation_date,
          companyType: item.company.company_type,
          url: item.company.opencorporates_url
        }))
      };
    }

    return { success: false };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 🔧 MÉTHODE 4 : EXTRAIRE DEPUIS UN FICHIER CSV/EXCEL
// L'utilisateur peut uploader un export LinkedIn Sales Navigator
async function parseImportFile(fileContent, fileType = 'csv') {
  try {
    const prospects = [];

    if (fileType === 'csv') {
      const lines = fileContent.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const prospect = {};
        
        headers.forEach((header, index) => {
          prospect[header] = values[index]?.trim() || '';
        });
        
        if (prospect.Email || prospect['First Name']) {
          prospects.push(prospect);
        }
      }
    }

    return {
      success: true,
      prospects: prospects,
      count: prospects.length
    };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 🚀 HANDLER API PRINCIPAL
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    method = 'auto',  // 'google', 'website', 'opencorporates', 'import'
    companyName,
    websiteUrl,
    location = 'France',
    fileContent,
    fileType,
    saveToSupabase = true
  } = req.body;

  try {
    let results = [];

    // STRATÉGIE AUTO : Essayer plusieurs méthodes
    if (method === 'auto') {
      console.log('🎯 Mode AUTO : essai de toutes les méthodes gratuites...');

      // 1. Si on a un site web, scraper direct
      if (websiteUrl) {
        console.log('📍 Tentative scraping site web...');
        const websiteResult = await scrapeSiteWeb(websiteUrl);
        if (websiteResult.success && websiteResult.foundContacts) {
          results.push({ method: 'website', ...websiteResult });
        }
      }

      // 2. Recherche Google pour trouver des contacts
      if (companyName) {
        console.log('🔍 Tentative Google search...');
        const googleResult = await searchContactsViaGoogle(companyName, location);
        if (googleResult.success && googleResult.results.length > 0) {
          results.push(googleResult);
        }

        // 3. OpenCorporates pour infos légales
        console.log('📊 Tentative OpenCorporates...');
        const ocResult = await searchOpenCorporates(companyName);
        if (ocResult.success) {
          results.push({ method: 'opencorporates', ...ocResult });
        }
      }

    } else if (method === 'google') {
      const result = await searchContactsViaGoogle(companyName, location);
      results.push(result);

    } else if (method === 'website') {
      const result = await scrapeSiteWeb(websiteUrl);
      results.push(result);

    } else if (method === 'opencorporates') {
      const result = await searchOpenCorporates(companyName);
      results.push(result);

    } else if (method === 'import') {
      const result = await parseImportFile(fileContent, fileType);
      results.push(result);
    }

    // Consolider les résultats
    const consolidatedData = consolidateResults(results, companyName);

    // Sauvegarder dans Supabase
    if (saveToSupabase && consolidatedData.emails.length > 0 && supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from('prospects')
        .insert({
          company: consolidatedData.company || companyName,
          email: consolidatedData.emails[0],
          phone: consolidatedData.phones[0] || '',
          address: consolidatedData.address || '',
          website: websiteUrl || '',
          source: 'scraper-gratuit',
          raw_data: JSON.stringify(consolidatedData)
        });

      if (error) {
        console.error('Supabase error:', error);
      }
    }

    return res.status(200).json({
      success: true,
      data: consolidatedData,
      methods: results.map(r => r.method),
      foundContacts: consolidatedData.emails.length > 0 || consolidatedData.phones.length > 0
    });

  } catch (error) {
    console.error('Scraper error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Fonction pour consolider les résultats de plusieurs méthodes
function consolidateResults(results, companyName) {
  const consolidated = {
    company: companyName || '',
    emails: [],
    phones: [],
    address: '',
    socialMedia: {},
    sources: []
  };

  results.forEach(result => {
    if (!result.success) return;

    // Website data
    if (result.data) {
      consolidated.company = result.data.company || consolidated.company;
      consolidated.emails.push(...(result.data.emails || []));
      consolidated.phones.push(...(result.data.phones || []));
      consolidated.address = result.data.address || consolidated.address;
      if (result.data.socialMedia) {
        consolidated.socialMedia = { ...consolidated.socialMedia, ...result.data.socialMedia };
      }
    }

    // Google results
    if (result.results) {
      result.results.forEach(item => {
        consolidated.emails.push(...item.emails);
        consolidated.phones.push(...item.phones);
      });
    }

    // OpenCorporates
    if (result.companies && result.companies[0]) {
      const company = result.companies[0];
      consolidated.company = company.name || consolidated.company;
      consolidated.address = company.address || consolidated.address;
    }

    consolidated.sources.push(result.method);
  });

  // Dédupliquer
  consolidated.emails = [...new Set(consolidated.emails)];
  consolidated.phones = [...new Set(consolidated.phones)];

  return consolidated;
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
