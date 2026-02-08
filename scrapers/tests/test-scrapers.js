// tests/test-scrapers.js

/**
 * Script de test pour les scrapers
 * Utilisation: node tests/test-scrapers.js
 */

require('dotenv').config({ path: '.env.local' });
const ScraperManager = require('../core/ScraperManager');

// Configuration des tests
const TESTS = {
  // Test LeBonCoin
  leboncoin: {
    enabled: true,
    params: {
      ville: 'Lyon',
      type: 'ventes',
      prixMin: 300000,
      prixMax: 400000,
      surfaceMin: 70,
      piecesMin: 3
    }
  },
  
  // Test GitHub
  github: {
    enabled: true,
    params: {
      skills: ['React', 'Node.js'],
      location: 'Paris',
      minRepos: 5,
      maxResults: 10  // Limité pour les tests
    }
  }
};

/**
 * Lance un test
 */
async function runTest(scraperId, params) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 TEST: ${scraperId.toUpperCase()}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    const result = await ScraperManager.runScraper(scraperId, params);
    
    console.log(`\n✅ Test ${scraperId} RÉUSSI`);
    console.log(`📊 Résultats:`);
    console.log(`   - Items scrapés: ${result.stats.itemsScraped}`);
    console.log(`   - Items sauvegardés: ${result.stats.itemsSaved}`);
    console.log(`   - Erreurs: ${result.stats.errors}`);
    console.log(`   - Doublons: ${result.stats.duplicates}`);
    
    if (result.results.length > 0) {
      console.log(`\n📄 Premier résultat:`);
      console.log(JSON.stringify(result.results[0], null, 2));
    }
    
    return { success: true, scraperId };
  } catch (error) {
    console.error(`\n❌ Test ${scraperId} ÉCHOUÉ`);
    console.error(`   Erreur: ${error.message}`);
    return { success: false, scraperId, error: error.message };
  }
}

/**
 * Lance tous les tests
 */
async function runAllTests() {
  console.log('\n🚀 LANCEMENT DES TESTS\n');
  
  const results = [];
  
  for (const [scraperId, config] of Object.entries(TESTS)) {
    if (config.enabled) {
      const result = await runTest(scraperId, config.params);
      results.push(result);
      
      // Délai entre tests
      if (Object.keys(TESTS).indexOf(scraperId) < Object.keys(TESTS).length - 1) {
        console.log(`\n⏳ Pause de 5 secondes avant le prochain test...\n`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  
  // Rapport final
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 RAPPORT FINAL DES TESTS`);
  console.log(`${'='.repeat(60)}\n`);
  
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;
  
  console.log(`✅ Tests réussis: ${successful}/${results.length}`);
  console.log(`❌ Tests échoués: ${failed}/${results.length}`);
  
  if (failed > 0) {
    console.log(`\n❌ Tests en échec:`);
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.scraperId}: ${r.error}`);
    });
  }
  
  // Statistiques globales
  console.log(`\n📈 Statistiques globales:`);
  const stats = ScraperManager.getStats();
  console.log(JSON.stringify(stats, null, 2));
}

// Fonction pour tester un seul scraper
async function testSingle(scraperId) {
  if (!TESTS[scraperId]) {
    console.error(`❌ Test "${scraperId}" introuvable`);
    console.log(`\n✅ Tests disponibles: ${Object.keys(TESTS).join(', ')}`);
    return;
  }
  
  await runTest(scraperId, TESTS[scraperId].params);
}

// Exécution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0 && args[0] !== 'all') {
    // Test spécifique
    testSingle(args[0]);
  } else {
    // Tous les tests
    runAllTests();
  }
}

module.exports = { runTest, runAllTests, testSingle };
