import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function ImmobilierDashboard() {
  const [biens, setBiens] = useState([]);
  const [acheteurs, setAcheteurs] = useState([]);
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState({
    totalBiens: 0,
    totalAcheteurs: 0,
    totalMatches: 0,
    revenusEstimes: 0
  });
  const [activeTab, setActiveTab] = useState('biens');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsRes = await fetch('/api/immobilier/stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch biens
      const biensRes = await fetch('/api/immobilier/biens');
      const biensData = await biensRes.json();
      setBiens(biensData);

      // Fetch acheteurs
      const acheteursRes = await fetch('/api/immobilier/acheteurs');
      const acheteursData = await acheteursRes.json();
      setAcheteurs(acheteursData);

      // Fetch matches
      const matchesRes = await fetch('/api/immobilier/matches');
      const matchesData = await matchesRes.json();
      setMatches(matchesData);

      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setLoading(false);
    }
  };

  const lancerMatchingAuto = async () => {
    try {
      const res = await fetch('/api/immobilier/match-auto', {
        method: 'POST'
      });
      const data = await res.json();
      
      if (data.success) {
        alert(`${data.nouveauxMatches} nouveaux matchs créés !`);
        fetchData(); // Recharger les données
      }
    } catch (error) {
      console.error('Erreur lors du matching:', error);
      alert('Erreur lors du matching automatique');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard Immobilier - ProspectBot</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🏠 Dashboard Immobilier
            </h1>
            <p className="text-gray-600">
              Gestion des biens, acheteurs et matchings automatiques
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Biens Actifs</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalBiens}</p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Acheteurs</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalAcheteurs}</p>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Matchs Actifs</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalMatches}</p>
                </div>
                <div className="bg-purple-100 rounded-full p-3">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Revenus Estimés</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.revenusEstimes.toLocaleString()}€</p>
                </div>
                <div className="bg-yellow-100 rounded-full p-3">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="mb-8">
            <button
              onClick={lancerMatchingAuto}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Lancer le Matching Automatique
            </button>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('biens')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'biens'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🏠 Biens ({biens.length})
                </button>
                <button
                  onClick={() => setActiveTab('acheteurs')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'acheteurs'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  👤 Acheteurs ({acheteurs.length})
                </button>
                <button
                  onClick={() => setActiveTab('matches')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'matches'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🎯 Matchs ({matches.length})
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Tab Biens */}
              {activeTab === 'biens' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Surface</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ville</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {biens.map((bien) => (
                        <tr key={bien.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bien.titre}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bien.prix?.toLocaleString()}€</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bien.surface} m²</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bien.ville}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bien.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              bien.statut === 'disponible' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {bien.statut}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab Acheteurs */}
              {activeTab === 'acheteurs' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ville</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {acheteurs.map((acheteur) => (
                        <tr key={acheteur.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{acheteur.nom}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{acheteur.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{acheteur.telephone}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{acheteur.budget_max?.toLocaleString()}€</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{acheteur.ville_recherchee}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{acheteur.type_bien}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab Matches */}
              {activeTab === 'matches' && (
                <div className="space-y-4">
                  {matches.map((match) => (
                    <div key={match.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">🏠</span>
                            <h3 className="font-semibold text-gray-900">{match.bien_titre}</h3>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">👤</span>
                            <p className="text-gray-600">{match.acheteur_nom}</p>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>📍 {match.bien_ville}</span>
                            <span>💰 {match.bien_prix?.toLocaleString()}€</span>
                            <span>📏 {match.bien_surface} m²</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl font-bold text-blue-600">{match.score_compatibilite}%</span>
                          </div>
                          <span className={`px-3 py-1 text-xs rounded-full ${
                            match.statut === 'nouveau' 
                              ? 'bg-blue-100 text-blue-800'
                              : match.statut === 'contacte'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {match.statut}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
