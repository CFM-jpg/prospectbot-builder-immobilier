// pages/api/B2B/scraper.js

export const config = {
  maxDuration: 30,
};

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

  try {
    const jinaUrl = `https://r.jina.ai/${url}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const response = await fetch(jinaUrl, {
      headers: {
        'Accept': 'text/plain',
        'X-No-Cache': 'true',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return res.status(400).json({
        error: `Impossible d'accéder à la page (HTTP ${response.status})`,
        success: false,
      });
    }

    const text = await response.text();

    // Extraction emails par regex sur le texte propre retourné par Jina
    const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
    const allMatches = text.match(emailRegex) || [];

    const blacklist = [
      'example.com', 'test.com', 'domain.com', 'email.com',
      'sentry.io', 'wix.com', 'wordpress.com', 'jquery',
      'w3.org', 'schema.org', 'google.com', 'facebook.com',
      'twitter.com', 'linkedin.com', 'instagram.com',
      'jina.ai',
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

    return res.status(200).json({
      success: true,
      emails,
      count: emails.length,
      url,
      debug: {
        via: 'jina.ai',
        textLength: text.length,
        rawEmailsFound: allMatches.length,
        afterFilter: emails.length,
      },
    });

  } catch (error) {
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
