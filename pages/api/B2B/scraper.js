// pages/api/B2B/scraper.js
import { supabaseAdmin } from '../../../lib/supabase';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, platform, keywords, prospects, cssSelector } = req.body;

  try {
    // Si des prospects sont fournis directement (import manuel)
    if (prospects && Array.isArray(prospects) && prospects.length > 0) {
      const insertData = prospects.map(prospect => ({
        first_name: prospect.firstName || prospect.first_name || '',
        last_name: prospect.lastName || prospect.last_name || '',
        email: prospect.email || '',
        company: prospect.company || '',
        position: prospect.position || '',
        linkedin_url: prospect.linkedinUrl || prospect.linkedin_url || '',
        phone: prospect.phone || '',
        industry: prospect.industry || '',
        source: platform || 'manual'
      }));

      const { data, error } = await supabaseAdmin
        .from('prospects')
        .insert(insertData)
        .select();

      if (error) throw error;

      return res.status(200).json({ 
        success: true, 
        prospects: data,
        count: data.length 
      });
    }

    // Si une URL est fournie, on scrape réellement
    if (url) {
      console.log('🔍 Scraping URL:', url);
      
      // Fetch la page avec un User-Agent navigateur pour éviter les blocages
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 15000 // 15 secondes max
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Liste pour stocker les résultats
      const foundEmails = new Set();
      const foundPhones = new Set();
      let companyName = '';
      
      // 1. EXTRACTION DES EMAILS
      // Méthode 1: Regex dans tout le texte
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const textContent = $.text();
      const emailMatches = textContent.match(emailRegex) || [];
      emailMatches.forEach(email => {
        // Filtrer les emails inutiles
        if (!email.includes('example.com') && 
            !email.includes('domain.com') && 
            !email.includes('sentry.io') &&
            !email.includes('wixpress.com')) {
          foundEmails.add(email.toLowerCase().trim());
        }
      });

      // Méthode 2: Liens mailto
      $('a[href^="mailto:"]').each((i, el) => {
        const email = $(el).attr('href').replace('mailto:', '').split('?')[0].trim();
        if (email && email.includes('@')) {
          foundEmails.add(email.toLowerCase());
        }
      });

      // Méthode 3: Sélecteur CSS personnalisé si fourni
      if (cssSelector) {
        $(cssSelector).each((i, el) => {
          const text = $(el).text();
          const matches = text.match(emailRegex) || [];
          matches.forEach(email => foundEmails.add(email.toLowerCase().trim()));
        });
      }

      // Méthode 4: Recherche dans des éléments spécifiques
      const contactSelectors = [
        '.contact-email', '.email', '[class*="email"]', '[id*="email"]',
        '.contact-info', '.contact', '[class*="contact"]',
        'footer', '.footer', '#footer'
      ];
      
      contactSelectors.forEach(selector => {
        $(selector).each((i, el) => {
          const text = $(el).text();
          const matches = text.match(emailRegex) || [];
          matches.forEach(email => {
            if (!email.includes('example.com') && !email.includes('domain.com')) {
              foundEmails.add(email.toLowerCase().trim());
            }
          });
        });
      });

      // 2. EXTRACTION DES TÉLÉPHONES
      const phoneRegex = /(\+33|0033|0)[1-9][\s.-]?(\d{2}[\s.-]?){4}|(\+\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{2,4}/g;
      const phoneMatches = textContent.match(phoneRegex) || [];
      phoneMatches.forEach(phone => {
        const cleaned = phone.replace(/[\s.-]/g, '');
        if (cleaned.length >= 10) {
          foundPhones.add(phone.trim());
        }
      });

      // 3. EXTRACTION DU NOM D'ENTREPRISE
      // Essayer plusieurs méthodes
      companyName = 
        $('meta[property="og:site_name"]').attr('content') ||
        $('meta[name="author"]').attr('content') ||
        $('title').text().split('|')[0].split('-')[0].trim() ||
        $('h1').first().text().trim() ||
        '';

      // 4. CRÉATION DES PROSPECTS
      const prospectsData = [];
      
      if (foundEmails.size > 0) {
        foundEmails.forEach(email => {
          // Essayer de deviner le prénom/nom depuis l'email
          const emailParts = email.split('@')[0].split('.');
          const firstName = emailParts[0] ? emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1) : '';
          const lastName = emailParts[1] ? emailParts[1].charAt(0).toUpperCase() + emailParts[1].slice(1) : '';
          
          prospectsData.push({
            first_name: firstName,
            last_name: lastName,
            email: email,
            company: companyName,
            phone: Array.from(foundPhones)[0] || '', // Premier téléphone trouvé
            linkedin_url: '',
            position: '',
            industry: '',
            source: `scraping_${new URL(url).hostname}`,
            notes: `Scraped from ${url}`
          });
        });
      }

      // 5. RETOURNER LES RÉSULTATS
      console.log(`✅ Trouvé ${foundEmails.size} emails, ${foundPhones.size} téléphones`);

      return res.status(200).json({
        success: true,
        url: url,
        company: companyName,
        emails: Array.from(foundEmails),
        phones: Array.from(foundPhones),
        prospects: prospectsData,
        count: prospectsData.length,
        message: `${prospectsData.length} prospect(s) trouvé(s)`
      });
    }

    // Si ni URL ni prospects fournis
    return res.status(400).json({
      error: 'URL ou liste de prospects requise',
      message: 'Veuillez fournir une URL à scraper ou une liste de prospects à importer'
    });

  } catch (error) {
    console.error('❌ Scraper error:', error);
    
    // Messages d'erreur plus clairs
    let errorMessage = error.message;
    if (error.message.includes('fetch')) {
      errorMessage = 'Impossible d\'accéder au site. Le site peut bloquer les requêtes automatiques.';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Le site met trop de temps à répondre. Essayez un autre site.';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: error.message,
      success: false 
    });
  }
}
