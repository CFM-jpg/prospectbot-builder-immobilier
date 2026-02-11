// pages/immobilier.js
// Dashboard Immobilier - Version Supabase

import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function DashboardImmobilier() {
  const [stats, setStats] = useState(null);
  const [biens, setBiens] = useState([]);
  const [acheteurs, setAcheteurs] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats');

  // Charger les données au montage
  useEffect(() => {
    chargerDonnees();
  }, []);

  async function chargerDonnees() {
    setLoading(true);
    try {
      // Charger les stats
      const statsRes = await fetch('/api/immobilier/stats');
      const statsData = await statsRes.json();
      setStats(statsData.data);

      // Charger les biens
      const biensRes = await fetch('/api/immobilier/biens');
      const biensData = await biensRes.json();
      setBiens(biensData.data || []);

      // Charger les acheteurs
      const acheteursRes = await fetch('/api/immobilier/acheteurs');
      const acheteursData = await acheteursRes.json();
      setAcheteurs(acheteursData.data || []);

      // Charger les matches
      const matchesRes = await fetch('/api/immobilier/matches');
      const matchesData = await matchesRes.json();
      setMatches(matchesData.data || []);

    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  }

  // Lancer le matching automatique
  async function lancerMatching() {
    try {
      const res = await fetch('/api/immobilier/match-auto', {
        method: 'POST'
      });
      const data = await res.json();
      alert(`${data.stats?.nouveauxMatchs || 0} nouveaux matchs créés !`);
      chargerDonnees(); // Recharger les données
    } catch (error) {
      console.error('Erreur matching:', error);
      alert('Erreur lors du matching');
    }
  }

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
        <title>Dashboard Immobilier</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                🏡 Dashboard Immobilier
              </h1>
              <button
                onClick={lancerMatching}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                ⚡ Lancer le matching
              </button>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600">Biens disponibles</div>
              <div className="text-3xl font-bold text-blue-600">
                {stats?.totalBiens || 0}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600">Acheteurs actifs</div>
              <div className="text-3xl font-bold text-green-600">
                {stats?.totalAcheteurs || 0}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600">Matchs actifs</div>
              <div className="text-3xl font-bold text-purple-600">
                {stats?.totalMatches || 0}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600">Taux de matching</div>
              <div className="text-3xl font-bold text-orange-600">
                {stats?.tauxMatching || 0}%
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {['stats', 'biens', 'acheteurs', 'matches'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 text-sm font-medium ${
                      activeTab === tab
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab === 'stats' && '📊 Statistiques'}
                    {tab === 'biens' && '🏠 Biens'}
                    {tab === 'acheteurs' && '👥 Acheteurs'}
                    {tab === 'matches' && '🎯 Matches'}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Onglet Stats */}
              {activeTab === 'stats' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold mb-4">📊 Statistiques détaillées</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded">
                      <div className="text-sm text-gray-600">Prix moyen des biens</div>
                      <div className="text-2xl font-bold">
                        {stats?.prixMoyen?.toLocaleString('fr-FR')} €
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded">
                      <div className="text-sm text-gray-600">Budget moyen acheteurs</div>
                      <div className="text-2xl font-bold">
                        {stats?.budgetMoyen?.toLocaleString('fr-FR')} €
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Onglet Biens */}
              {activeTab === 'biens' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">🏠 Liste des biens ({biens.length})</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ville</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Surface</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {biens.slice(0, 10).map((bien) => (
                          <tr key={bien.id}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{bien.reference}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{bien.type}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{bien.ville}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{bien.prix?.toLocaleString('fr-FR')} €</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{bien.surface} m²</td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                bien.statut === 'disponible' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {bien.statut}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Onglet Acheteurs */}
              {activeTab === 'acheteurs' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">👥 Liste des acheteurs ({acheteurs.length})</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget max</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type recherché</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {acheteurs.slice(0, 10).map((acheteur) => (
                          <tr key={acheteur.id}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{acheteur.nom}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{acheteur.email}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{acheteur.budget_max?.toLocaleString('fr-FR')} €</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{acheteur.type_bien}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                acheteur.statut === 'actif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {acheteur.statut}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Onglet Matches */}
              {activeTab === 'matches' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">🎯 Matches ({matches.length})</h2>
                  <div className="space-y-4">
                    {matches.slice(0, 10).map((match) => (
                      <div key={match.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold text-lg">{match.acheteur_nom}</div>
                            <div className="text-sm text-gray-600">{match.acheteur_email}</div>
                            <div className="mt-2">
                              <div className="text-sm font-medium">🏠 {match.bien_reference}</div>
                              <div className="text-sm text-gray-600">{match.bien_adresse}</div>
                              <div className="text-sm font-semibold">{match.bien_prix?.toLocaleString('fr-FR')} €</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">{match.score}%</div>
                            <div className="text-xs text-gray-500">compatibilité</div>
                            <span className={`mt-2 inline-block px-2 py-1 rounded-full text-xs ${
                              match.statut === 'nouveau' ? 'bg-blue-100 text-blue-800' : 
                              match.statut === 'contacte' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-green-100 text-green-800'
                            }`}>
                              {match.statut}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
