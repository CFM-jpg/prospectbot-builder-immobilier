// pages/api/B2B/scraper.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, selector } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL requise' });
  }

  // Validation URL basique
  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'URL invalide' });
  }

  try {
    const scraperApiKey = process.env.SCRAPER_API_KEY;

    let fetchUrl;

    if (scraperApiKey) {
      // Utilise ScraperAPI pour bypasser les blocages
      fetchUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(url)}`;
    } else {
      // Fallback direct (peut être bloqué par certains sites)
      fetchUrl = url;
    }

    const response = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 15000,
    });

    if (!response.ok) {
      return res.status(400).json({ error: `Impossible d'accéder à la page (${response.status})` });
    }

    const html = await response.text();

    // Extraction des emails par regex
    const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
    const allMatches = html.match(emailRegex) || [];

    // Nettoyage et déduplication
    const blacklist = [
      'example.com', 'test.com', 'domain.com', 'email.com',
      'sentry.io', 'wix.com', 'wordpress.com', 'jquery',
      '.png', '.jpg', '.gif', '.svg', '.css', '.js'
    ];

    const emails = [...new Set(
      allMatches
        .map(e => e.toLowerCase().trim())
        .filter(e => {
          if (e.length > 100) return false;
          if (blacklist.some(b => e.includes(b))) return false;
          if (e.startsWith('no-reply') || e.startsWith('noreply')) return false;
          // Vérif format basique
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
    });

  } catch (error) {
    console.error('Erreur scraper:', error);
    return res.status(500).json({
      error: error.message || 'Erreur lors du scraping',
      success: false,
    });
  }
}
