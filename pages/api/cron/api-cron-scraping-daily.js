/**
 * CRON : Scraping automatique quotidien
 * GET /api/cron/scraping-daily
 * 
 * À configurer dans vercel.json :
 * {
 *   "crons": [{
 *     "path": "/api/cron/scraping-daily",
 *     "schedule": "0 6 * * *"
 *   }]
 * }
 */

export default async function handler(req, res) {
  // Vérification du secret CRON (sécurité)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ 
      success: false,
      error: 'Non autorisé' 
    });
  }

  console.log('🕐 CRON scraping quotidien - Démarrage');

  try {
    const results = [];

    // 1. Scraping LeBonCoin pour plusieurs villes
    const villes = ['Lyon', 'Villeurbanne', 'Bron'];

    for (const ville of villes) {
      try {
        console.log(`\n🏠 Scraping LeBonCoin - ${ville}...`);

        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/scrapers/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scraper: 'leboncoin',
            params: {
              ville,
              prixMax: 500000,
              surfaceMin: 50
            }
          })
        });

        const data = await response.json();

        results.push({
          scraper: 'leboncoin',
          ville,
          success: data.success,
          itemsScraped: data.stats?.itemsScraped || 0,
          itemsSaved: data.stats?.itemsSaved || 0
        });

        console.log(`✅ LeBonCoin ${ville} : ${data.stats?.itemsSaved || 0} biens`);

        // Attendre 30 secondes entre chaque ville
        await sleep(30000);

      } catch (error) {
        console.error(`❌ Erreur scraping LeBonCoin ${ville}:`, error);
        results.push({
          scraper: 'leboncoin',
          ville,
          success: false,
          error: error.message
        });
      }
    }

    // 2. Scraping GitHub pour prospects B2B
    try {
      console.log('\n💻 Scraping GitHub...');

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/scrapers/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scraper: 'github',
          params: {
            location: 'France',
            skills: ['React', 'Node.js', 'Vue.js'],
            minRepos: 5,
            maxResults: 50
          }
        })
      });

      const data = await response.json();

      results.push({
        scraper: 'github',
        success: data.success,
        itemsScraped: data.stats?.itemsScraped || 0,
        itemsSaved: data.stats?.itemsSaved || 0
      });

      console.log(`✅ GitHub : ${data.stats?.itemsSaved || 0} développeurs`);

    } catch (error) {
      console.error('❌ Erreur scraping GitHub:', error);
      results.push({
        scraper: 'github',
        success: false,
        error: error.message
      });
    }

    // 3. Lancer le matching automatique
    try {
      console.log('\n🔄 Matching automatique...');

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/immobilier/match-auto`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      results.push({
        action: 'matching',
        success: data.success,
        alertesEnvoyees: data.stats?.alertesEnvoyees || 0
      });

      console.log(`✅ Matching : ${data.stats?.alertesEnvoyees || 0} alertes envoyées`);

    } catch (error) {
      console.error('❌ Erreur matching:', error);
      results.push({
        action: 'matching',
        success: false,
        error: error.message
      });
    }

    // Résumé
    const totalScraped = results
      .filter(r => r.scraper)
      .reduce((sum, r) => sum + (r.itemsScraped || 0), 0);

    const totalSaved = results
      .filter(r => r.scraper)
      .reduce((sum, r) => sum + (r.itemsSaved || 0), 0);

    const totalAlertes = results
      .find(r => r.action === 'matching')?.alertesEnvoyees || 0;

    console.log('\n📊 RÉSUMÉ QUOTIDIEN :');
    console.log(`Total items scrapés : ${totalScraped}`);
    console.log(`Total items sauvegardés : ${totalSaved}`);
    console.log(`Total alertes envoyées : ${totalAlertes}`);

    return res.status(200).json({
      success: true,
      summary: {
        totalScraped,
        totalSaved,
        totalAlertes,
        executedAt: new Date().toISOString()
      },
      details: results
    });

  } catch (error) {
    console.error('❌ Erreur CRON scraping quotidien:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Fonction utilitaire pour attendre
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
