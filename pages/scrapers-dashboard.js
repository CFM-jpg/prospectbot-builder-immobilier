import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function ScrapersDashboard() {
  const [scrapers, setScrapers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningScrapers, setRunningScrapers] = useState(new Set());

  useEffect(() => {
    loadScrapers();
    loadStats();
    const interval = setInterval(() => {
      loadScrapers();
      loadStats();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadScrapers = async () => {
    try {
      const res = await fetch('/api/scrapers/list');
      const data = await res.json();
      if (data.success) {
        setScrapers(data.scrapers);
      }
    } catch (error) {
      console.error('Erreur chargement scrapers:', error);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch('/api/scrapers/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
      setLoading(false);
    }
  };

  const runScraper = async (scraperName) => {
    setRunningScrapers(prev => new Set([...prev, scraperName]));
    try {
      const res = await fetch('/api/scrapers/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scraper: scraperName })
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ ${scraperName} lancé avec succès!`);
        loadScrapers();
        loadStats();
      } else {
        alert(`❌ Erreur: ${data.error}`);
      }
    } catch (error) {
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setRunningScrapers(prev => {
        const newSet = new Set(prev);
        newSet.delete(scraperName);
        return newSet;
      });
    }
  };

  const stopScraper = async (scraperName) => {
    try {
      const res = await fetch('/api/scrapers/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scraper: scraperName })
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ ${scraperName} arrêté!`);
        loadScrapers();
      } else {
        alert(`❌ Erreur: ${data.error}`);
      }
    } catch (error) {
      alert(`❌ Erreur: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard Scrapers - ProspectBot</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">
                🤖 Dashboard Scrapers
              </h1>
              <div className="flex space-x-4">
                <a 
                  href="/immobilier"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  📊 Dashboard Immobilier
                </a>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Scrapers</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.total_scrapers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Actifs</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.active_scrapers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Résultats</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.total_results.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Aujourd'hui</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.today_results}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scrapers List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Scrapers Disponibles</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {scrapers.map((scraper) => (
                <div key={scraper.name} className="px-6 py-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">{scraper.name}</h3>
                        {scraper.status === 'running' && (
                          <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                            En cours
                          </span>
                        )}
                        {scraper.status === 'idle' && (
                          <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Inactif
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{scraper.description}</p>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span>📊 {scraper.total_results.toLocaleString()} résultats</span>
                        {scraper.last_run && (
                          <span>🕐 Dernier: {new Date(scraper.last_run).toLocaleString('fr-FR')}</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-6 flex space-x-3">
                      {scraper.status === 'idle' ? (
                        <button
                          onClick={() => runScraper(scraper.name)}
                          disabled={runningScrapers.has(scraper.name)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {runningScrapers.has(scraper.name) ? (
                            <>
                              <span className="inline-block animate-spin mr-2">⚙️</span>
                              Lancement...
                            </>
                          ) : (
                            '▶️ Lancer'
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => stopScraper(scraper.name)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                          ⏹️ Arrêter
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">CRON automatique activé</h3>
                <p className="mt-1 text-sm text-blue-700">
                  Les scrapers immobiliers tournent automatiquement tous les jours à 2h00 du matin (configuré dans vercel.json)
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
