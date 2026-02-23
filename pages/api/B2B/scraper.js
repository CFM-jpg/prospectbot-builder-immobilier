// pages/api/B2B/scraper.js

export const config = {
  maxDuration: 30,
};

async function fetchWithJina(url, signal) {
  const jinaUrl = `https://r.jina.ai/${url}`;
  const response = await fetch(jinaUrl, {
    headers: {
      'Accept': 'text/plain',
      'X-No-Cache': 'true',
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Jina HTTP ${response.status}`);
  }

  return await response.text();
}

async function fetchDirect(url, signal) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Direct HTTP ${response.status}`);
  }

  return await response.text();
}

function extractEmails(text) {
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const allMatches = text.match(emailRegex) || [];

  const blacklist = [
    'example.com', 'test.com', 'domain.com', 'email.com',
    'sentry.io', 'wix.com', 'wordpress.com', 'jquery',
    'w3.org', 'schema.org', 'google.com', 'facebook.com',
    'twitter.com', 'linkedin.com', 'instagram.com', 'jina.ai',
    '.png', '.jpg', '.gif', '.svg', '.css', '.js', '.woff',
  ];

  const emails = [...new Set(
    allMatches
      .map(e => e.toLowerCase().trim())
      .filter(e => {
        if (e.length > 100) return false;
        if (blacklist.some(b => e.includes(b))) return false;
        if (e.startsWith('no-reply') || e.startsWith('noreply')) return false;
        const parts = e.split('@');
        if (parts.length !== 2) return false;
        if (parts[0].length < 1 || parts[1].length < 3) return false;
        if (!parts[1].includes('.')) return false;
        return true;
      })
  )];

  return { emails, rawCount: allMatches.length };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL requise' });
  }

  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'URL invalide' });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  let text = null;
  let via = null;

  try {
    // Essai 1 : Jina AI
    try {
      text = await fetchWithJina(url, controller.signal);
      via = 'jina.ai';
    } catch (jinaError) {
      console.warn('Jina failed, fallback direct:', jinaError.message);
      // Essai 2 : fetch direct
      text = await fetchDirect(url, controller.signal);
      via = 'direct';
    }

    clearTimeout(timeoutId);

    const { emails, rawCount } = extractEmails(text);

    return res.status(200).json({
      success: true,
      emails,
      count: emails.length,
      url,
      debug: {
        via,
        textLength: text.length,
        rawEmailsFound: rawCount,
        afterFilter: emails.length,
      },
    });

  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Erreur scraper:', error);
    const message = error.name === 'AbortError'
      ? 'Timeout — le site met trop de temps à répondre'
      : error.message || 'Erreur lors du scraping';
    return res.status(500).json({
      error: message,
      success: false,
    });
  }
}
