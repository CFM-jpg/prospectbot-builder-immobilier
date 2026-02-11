// pages/api/B2B/scraper.js - VERSION ANTI-BLOCAGE RENFORCÉE
import { supabaseAdmin } from '../../../lib/supabase';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, platform, keywords, prospects, cssSelector } = req.body;

  try {
    // ========== IMPORT MANUEL DE PROSPECTS ==========
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

    // ========== SCRAPING D'URL ==========
    if (url) {
      console.log('🔍 Scraping URL:', url);
      
      // Validation URL
      let validUrl;
      try {
        validUrl = new URL(url);
      } catch (urlError) {
        return res.status(400).json({
          error: 'URL invalide',
          message: 'Format attendu : https://exemple.com/page',
          success: false
        });
      }

      // ⚠️ DÉTECTION DE SITES PROBLÉMATIQUES
      const blockedDomains = [
        'linkedin.com', 'facebook.com', 'twitter.com', 'x.com',
        'instagram.com', 'youtube.com', 'tiktok.com'
      ];
      
      const isBlockedDomain = blockedDomains.some(domain => 
        validUrl.hostname.includes(domain)
      );

      if (isBlockedDomain) {
        return res.status(403).json({
          error: 'Site protégé',
          message: `${validUrl.hostname} bloque le scraping automatique. Ces sites nécessitent leur API officielle.`,
          suggestion: 'Essayez plutôt un site d\'entreprise classique (ex: site vitrine PME, page contact)',
          success: false
        });
      }

      // ========== HEADERS ANTI-BLOCAGE RENFORCÉS ==========
      const headers = {
        // User-Agent ultra-réaliste (Chrome Windows)
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        
        // Accept headers complets
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        
        // Security headers
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        
        // Cache
        'Cache-Control': 'max-age=0',
        'Upgrade-Insecure-Requests': '1',
        
        // Referer (simule visite depuis Google)
        'Referer': 'https://www.google.com/',
        
        // Connection
        'Connection': 'keep-alive',
        
        // DNT
        'DNT': '1'
      };

      // Timeout avec AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 secondes

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: headers,
          redirect: 'follow'
        });

        clearTimeout(timeoutId);

        // ========== GESTION ERREUR 999 ==========
        if (response.status === 999) {
          return res.status(403).json({
            error: 'Erreur 999 - Accès refusé',
            message: 'Ce site détecte et bloque les scrapers automatiques.',
            solution: 'Solutions possibles :\n1. Utiliser l\'API officielle du site\n2. Contacter le propriétaire pour autorisation\n3. Essayer un autre site moins protégé',
            technical: 'HTTP 999 est un code personnalisé anti-scraping',
            success: false
          });
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        
        // Vérifier si le HTML contient du contenu réel
        if (html.length < 100) {
          return res.status(400).json({
            error: 'Réponse vide ou invalide',
            message: 'Le site n\'a pas retourné de contenu exploitable.',
            success: false
          });
        }

        const $ = cheerio.load(html);

        // ========== COLLECTIONS ==========
        const foundEmails = new Set();
        const foundPhones = new Set();
        const foundLinkedInUrls = new Set();
        let companyName = '';
        
        // ========== EXTRACTION EMAILS ==========
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const textContent = $.text();
        
        // Regex dans le texte
        const emailMatches = textContent.match(emailRegex) || [];
        const blacklist = [
          'example.com', 'domain.com', 'sentry.io', 'wixpress.com',
          'placeholder.com', 'yoursite.com', 'test.com', 'dummy.com'
        ];
        
        emailMatches.forEach(email => {
          const isBlacklisted = blacklist.some(domain => email.includes(domain));
          if (!isBlacklisted) {
            foundEmails.add(email.toLowerCase().trim());
          }
        });

        // Liens mailto
        $('a[href^="mailto:"]').each((i, el) => {
          const email = $(el).attr('href').replace('mailto:', '').split('?')[0].trim();
          if (email && email.includes('@')) {
            foundEmails.add(email.toLowerCase());
          }
        });

        // Sélecteur CSS
        if (cssSelector) {
          $(cssSelector).each((i, el) => {
            const text = $(el).text();
            const matches = text.match(emailRegex) || [];
            matches.forEach(email => foundEmails.add(email.toLowerCase().trim()));
          });
        }

        // Éléments contact
        const contactSelectors = [
          '.contact-email', '.email', '[class*="email"]', '[id*="email"]',
          '.contact-info', '.contact', '[class*="contact"]',
          'footer', '.footer', '#footer', 'aside'
        ];
        
        contactSelectors.forEach(selector => {
          $(selector).each((i, el) => {
            const text = $(el).text();
            const matches = text.match(emailRegex) || [];
            matches.forEach(email => {
              const isBlacklisted = blacklist.some(domain => email.includes(domain));
              if (!isBlacklisted) {
                foundEmails.add(email.toLowerCase().trim());
              }
            });
          });
        });

        // ========== EXTRACTION TÉLÉPHONES ==========
        const phoneRegex = /(\+33|0033|0)[1-9][\s.-]?(\d{2}[\s.-]?){4}|(\+\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{2,4}/g;
        const phoneMatches = textContent.match(phoneRegex) || [];
        phoneMatches.forEach(phone => {
          const cleaned = phone.replace(/[\s.-]/g, '');
          if (cleaned.length >= 10 && cleaned.length <= 15) {
            foundPhones.add(phone.trim());
          }
        });

        // ========== EXTRACTION LINKEDIN ==========
        $('a[href*="linkedin.com"]').each((i, el) => {
          const linkedinUrl = $(el).attr('href');
          if (linkedinUrl && linkedinUrl.includes('/in/')) {
            foundLinkedInUrls.add(linkedinUrl);
          }
        });

        // ========== NOM ENTREPRISE ==========
        companyName = 
          $('meta[property="og:site_name"]').attr('content') ||
          $('meta[name="author"]').attr('content') ||
          $('meta[property="og:title"]').attr('content')?.split('|')[0]?.trim() ||
          $('title').text().split('|')[0].split('-')[0].split('–')[0].trim() ||
          $('h1').first().text().trim() ||
          validUrl.hostname.replace('www.', '').split('.')[0];

        // ========== CRÉATION PROSPECTS ==========
        const prospectsData = [];
        
        if (foundEmails.size > 0) {
          const phonesArray = Array.from(foundPhones);
          const linkedInArray = Array.from(foundLinkedInUrls);
          
          foundEmails.forEach((email, index) => {
            const emailParts = email.split('@')[0].split('.');
            const firstName = emailParts[0] ? emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1) : '';
            const lastName = emailParts[1] ? emailParts[1].charAt(0).toUpperCase() + emailParts[1].slice(1) : '';
            
            prospectsData.push({
              first_name: firstName,
              last_name: lastName,
              email: email,
              company: companyName,
              phone: phonesArray[Math.min(index, phonesArray.length - 1)] || '',
              linkedin_url: linkedInArray[Math.min(index, linkedInArray.length - 1)] || '',
              position: '',
              industry: '',
              source: `scraping_${validUrl.hostname}`,
              notes: `Scraped from ${url}`
            });
          });
        }

        console.log(`✅ ${foundEmails.size} emails, ${foundPhones.size} téléphones`);

        return res.status(200).json({
          success: true,
          url: url,
          company: companyName,
          emails: Array.from(foundEmails),
          phones: Array.from(foundPhones),
          linkedin_urls: Array.from(foundLinkedInUrls),
          prospects: prospectsData,
          count: prospectsData.length,
          message: prospectsData.length > 0 
            ? `${prospectsData.length} prospect(s) trouvé(s)` 
            : 'Aucun email trouvé sur cette page. Le site peut ne pas afficher d\'emails publiquement.'
        });

      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          return res.status(408).json({
            error: 'Timeout',
            message: 'Le site met trop de temps à répondre (>20s).',
            success: false
          });
        }
        
        throw fetchError;
      }
    }

    return res.status(400).json({
      error: 'URL ou prospects requis',
      success: false
    });

  } catch (error) {
    console.error('❌ Scraper error:', error);
    
    let errorMessage = 'Erreur inconnue';
    let userMessage = error.message;
    
    if (error.message.includes('999')) {
      errorMessage = 'Site protégé (Erreur 999)';
      userMessage = 'Ce site bloque activement le scraping. Essayez un autre site.';
    } else if (error.message.includes('403')) {
      errorMessage = 'Accès interdit';
      userMessage = 'Le site refuse l\'accès aux robots. Essayez un site moins protégé.';
    } else if (error.message.includes('404')) {
      errorMessage = 'Page introuvable';
      userMessage = 'Vérifiez l\'URL, la page n\'existe pas.';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      message: userMessage,
      success: false 
    });
  }
}
