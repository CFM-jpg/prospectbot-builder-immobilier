import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function ImmobilierDashboard() {
  const [biens, setBiens] = useState([]);
  const [acheteurs, setAcheteurs] = useState([]);
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('biens');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      // Charger les statistiques
      const statsRes = await fetch('/api/immobilier/stats');
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // Charger les biens
      const biensRes = await fetch('/api/immobilier/biens');
      const biensData = await biensRes.json();
      if (biensData.success) {
        setBiens(biensData.biens);
      }

      // Charger les acheteurs
      const acheteursRes = await fetch('/api/immobilier/acheteurs');
      const acheteursData = await acheteursRes.json();
      if (acheteursData.success) {
        setAcheteurs(acheteursData.acheteurs);
      }

      // Charger les matches
      const matchesRes = await fetch('/api/immobilier/matches');
      const matchesData = await matchesRes.json();
      if (matchesData.success) {
        setMatches(matchesData.matches);
      }

      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      setLoading(false);
    }
  };

  const lancerMatchAuto = async () => {
    if (!confirm('Lancer le matching automatique pour tous les acheteurs ?')) return;
    
    try {
      const res = await fetch('/api/immobilier/match-auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ ${data.matches_created} nouveaux matchs créés!`);
        loadData();
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard Immobilier - ProspectBot</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">
                🏠 Dashboard Immobilier
              </h1>
              <div className="flex space-x-4">
                <a 
                  href="/scrapers-dashboard"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  🤖 Dashboard Scrapers
                </a>
                <a 
                  href="/inscription-acheteur"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  👤 Landing Page
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Biens Disponibles</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.total_biens}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Acheteurs Inscrits</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.total_acheteurs}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Matchs Créés</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.total_matches}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Revenus Potentiels</p>
                    <p className="text-2xl font-semibold text-gray-900">{(stats.total_matches * 4500).toLocaleString()}€</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="mb-6">
            <button
              onClick={lancerMatchAuto}
              className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition shadow-lg"
            >
              🎯 Lancer le Matching Automatique
            </button>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('biens')}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === 'biens'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  🏠 Biens ({biens.length})
                </button>
                <button
                  onClick={() => setActiveTab('acheteurs')}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === 'acheteurs'
                      ? 'border-b-2 border-green-500 text-green-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  👤 Acheteurs ({acheteurs.length})
                </button>
                <button
                  onClick={() => setActiveTab('matches')}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === 'matches'
                      ? 'border-b-2 border-purple-500 text-purple-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  🎯 Matchs ({matches.length})
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Tab Biens */}
              {activeTab === 'biens' && (
                <div className="space-y-4">
                  {biens.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Aucun bien disponible</p>
                  ) : (
                    biens.map((bien) => (
                      <div key={bien.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
                        <div className="flex justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900">{bien.titre}</h3>
                            <p className="text-sm text-gray-500 mt-1">{bien.ville} - {bien.type_bien}</p>
                            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                              <span>💰 {bien.prix.toLocaleString()}€</span>
                              <span>📐 {bien.surface}m²</span>
                              <span>🛏️ {bien.pieces} pièces</span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              bien.statut === 'disponible' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {bien.statut}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab Acheteurs */}
              {activeTab === 'acheteurs' && (
                <div className="space-y-4">
                  {acheteurs.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Aucun acheteur inscrit</p>
                  ) : (
                    acheteurs.map((acheteur) => (
                      <div key={acheteur.id} className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition">
                        <div className="flex justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900">{acheteur.nom} {acheteur.prenom}</h3>
                            <p className="text-sm text-gray-500 mt-1">📧 {acheteur.email} | 📱 {acheteur.telephone}</p>
                            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                              <span>💰 Budget: {acheteur.budget_min.toLocaleString()}-{acheteur.budget_max.toLocaleString()}€</span>
                              <span>📍 {acheteur.ville_recherche}</span>
                              <span>🏠 {acheteur.type_bien}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab Matches */}
              {activeTab === 'matches' && (
                <div className="space-y-4">
                  {matches.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Aucun match créé</p>
                  ) : (
                    matches.map((match) => (
                      <div key={match.id} className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">🎯</span>
                              <div>
                                <h3 className="font-semibold text-gray-900">Match #{match.id}</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  Score: {match.score_match}% | Créé le {new Date(match.created_at).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-4">
                              <div className="bg-white p-3 rounded">
                                <p className="text-xs text-gray-500">ACHETEUR</p>
                                <p className="font-medium">{match.acheteur_nom}</p>
                              </div>
                              <div className="bg-white p-3 rounded">
                                <p className="text-xs text-gray-500">BIEN</p>
                                <p className="font-medium">{match.bien_titre}</p>
                              </div>
                            </div>
                          </div>
                          <div className="ml-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              match.statut === 'nouveau' ? 'bg-blue-100 text-blue-800' :
                              match.statut === 'contacte' ? 'bg-yellow-100 text-yellow-800' :
                              match.statut === 'vente' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {match.statut}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Business Info */}
          <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-3">💰 Modèle d'Apporteur d'Affaires</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-purple-700 font-medium">Commission par vente</p>
                <p className="text-2xl font-bold text-purple-900">4 500€</p>
              </div>
              <div>
                <p className="text-purple-700 font-medium">Revenus mensuels potentiels</p>
                <p className="text-2xl font-bold text-purple-900">{(stats?.total_matches * 4500 * 0.3).toLocaleString()}€</p>
                <p className="text-xs text-purple-600">Basé sur 30% de conversion</p>
              </div>
              <div>
                <p className="text-purple-700 font-medium">ROI estimé</p>
                <p className="text-2xl font-bold text-purple-900">1400%+</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
