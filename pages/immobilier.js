import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// ============================================================
// CONFIGURATION DES SITES DISPONIBLES
// L'agent choisit le site, il ne tape plus d'URL manuellement
// ============================================================
const SITES_DISPONIBLES = [
  {
    id: 'leboncoin',
    nom: 'Le Bon Coin',
    logo: '🟠',
    description: 'Particuliers & agences',
    apiRoute: '/api/scrapers/leboncoin',
    couleur: 'from-orange-500 to-orange-600'
  },
  {
    id: 'seloger',
    nom: 'SeLoger',
    logo: '🔵',
    description: 'Agences immobilières',
    apiRoute: '/api/scrapers/seloger',
    couleur: 'from-blue-500 to-blue-600'
  },
  {
    id: 'bienici',
    nom: "Bien'ici",
    logo: '🟢',
    description: 'Annonces premium',
    apiRoute: '/api/scrapers/bienici',
    couleur: 'from-green-500 to-green-600'
  }
];

const TYPES_BIENS = [
  { value: 'all', label: 'Tous les biens' },
  { value: 'maison', label: '🏡 Maison' },
  { value: 'appartement', label: '🏢 Appartement' },
  { value: 'terrain', label: '🌿 Terrain' },
  { value: 'commercial', label: '🏪 Local commercial' }
];

export default function ImmobilierDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [prospects, setProspects] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [biens, setBiens] = useState([]);
  const [biensFilter, setBiensFilter] = useState({ type: 'all', search: '' });
  const [stats, setStats] = useState({
    totalProspects: 0,
    activeListings: 0,
    emailsSent: 0,
    responseRate: 0
  });
  const [loading, setLoading] = useState(false);
  const [selectedProspects, setSelectedProspects] = useState([]);

  // Scraper form - plus d'URL manuelle
  const [scraperForm, setScraperForm] = useState({
    siteId: null,          // site sélectionné (leboncoin, seloger, bienici)
    location: '',
    propertyType: 'all',
    prixMin: '',
    prixMax: '',
    surfaceMin: ''
  });

  // Progression du scraping
  const [scrapingProgress, setScrapingProgress] = useState(null);
  // null | { status: 'running' | 'done' | 'error', message: string, count: number }

  const [emailForm, setEmailForm] = useState({
    subject: '',
    message: '',
    senderName: 'ProspectBot Immobilier',
    senderEmail: 'contact@prospectbot.com'
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const prospectsRes = await fetch('/api/B2B/chatbot-conversations');
      if (prospectsRes.ok) {
        const data = await prospectsRes.json();
        setProspects(data.conversations || []);
        setStats(prev => ({ ...prev, totalProspects: data.conversations?.length || 0 }));
      }
      const campaignsRes = await fetch('/api/B2B/email-automation');
      if (campaignsRes.ok) {
        const data = await campaignsRes.json();
        setCampaigns(data.campaigns || []);
      }
      const biensRes = await fetch('/api/immobilier/biens');
      if (biensRes.ok) {
        const data = await biensRes.json();
        setBiens(data.data || []);
        setStats(prev => ({ ...prev, activeListings: data.total || 0 }));
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  const handleScrape = async () => {
    if (!scraperForm.siteId) {
      alert('⚠️ Veuillez sélectionner un site');
      return;
    }
    if (!scraperForm.location.trim()) {
      alert('⚠️ Veuillez entrer une ville ou région');
      return;
    }

    setLoading(true);
    const site = SITES_DISPONIBLES.find(s => s.id === scraperForm.siteId);

    setScrapingProgress({
      status: 'running',
      message: `Recherche sur ${site.nom} en cours...`,
      count: 0
    });

    try {
      const params = new URLSearchParams({
        ville: scraperForm.location,
        type: scraperForm.propertyType === 'all' ? 'maison' : scraperForm.propertyType,
        ...(scraperForm.prixMin && { prixMin: scraperForm.prixMin }),
        ...(scraperForm.prixMax && { prixMax: scraperForm.prixMax }),
        ...(scraperForm.surfaceMin && { surfaceMin: scraperForm.surfaceMin })
      });

      const response = await fetch(`${site.apiRoute}?${params.toString()}`, {
        method: 'GET'
      });

      const data = await response.json();

      if (response.ok) {
        setScrapingProgress({
          status: 'done',
          message: `Scraping terminé avec succès !`,
          count: data.stats?.annoncesTouvees || 0,
          nouvelles: data.stats?.nouvellesAnnonces || 0
        });
        loadDashboardData();
      } else {
        setScrapingProgress({
          status: 'error',
          message: data.error || 'Une erreur est survenue'
        });
      }
    } catch (error) {
      setScrapingProgress({
        status: 'error',
        message: 'Erreur réseau : ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const resetScraper = () => {
    setScrapingProgress(null);
    setScraperForm({
      siteId: null,
      location: '',
      propertyType: 'all',
      prixMin: '',
      prixMax: '',
      surfaceMin: ''
    });
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (selectedProspects.length === 0) {
      alert('⚠️ Sélectionnez au moins un prospect');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/B2B/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: selectedProspects,
          subject: emailForm.subject,
          htmlContent: emailForm.message,
          senderName: emailForm.senderName,
          senderEmail: emailForm.senderEmail
        })
      });
      const data = await response.json();
      if (response.ok) {
        alert(`✅ ${data.sent} emails envoyés !`);
        setEmailForm({ subject: '', message: '', senderName: 'ProspectBot Immobilier', senderEmail: 'contact@prospectbot.com' });
        setSelectedProspects([]);
      } else {
        alert(`❌ Erreur: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Erreur réseau: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleProspectSelection = (email) => {
    setSelectedProspects(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const selectAllProspects = () => {
    if (selectedProspects.length === prospects.length) {
      setSelectedProspects([]);
    } else {
      setSelectedProspects(prospects.map(p => p.email || p.lead_email).filter(Boolean));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button onClick={() => router.push('/')} className="text-gray-400 hover:text-white transition-colors">
                ← Retour
              </button>
              <h1 className="text-2xl font-bold text-white">🏠 ProspectBot Immobilier</h1>
            </div>
            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">● En ligne</span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex space-x-2 bg-gray-800/30 backdrop-blur-sm p-1 rounded-lg">
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'scraper', label: '🔍 Scraper' },
            { id: 'biens', label: '🏠 Biens' },
            { id: 'prospects', label: '👥 Prospects' },
            { id: 'email', label: '📧 Email' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ===== DASHBOARD TAB ===== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Prospects', value: stats.totalProspects, icon: '👥', color: 'blue' },
                { label: 'Annonces actives', value: stats.activeListings, icon: '🏠', color: 'green' },
                { label: 'Emails envoyés', value: stats.emailsSent, icon: '📧', color: 'purple' },
                { label: 'Taux réponse', value: `${stats.responseRate}%`, icon: '📈', color: 'orange' }
              ].map((stat, i) => (
                <div key={i} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">{stat.label}</p>
                      <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                    </div>
                    <div className="text-4xl p-3 rounded-lg bg-gray-700/50">{stat.icon}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">📋 Derniers prospects</h3>
                <div className="space-y-3">
                  {prospects.slice(0, 5).map((prospect, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{prospect.lead_email || 'Email non renseigné'}</p>
                        <p className="text-gray-400 text-sm">{prospect.message || 'Aucun message'}</p>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(prospect.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                  {prospects.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Aucun prospect pour le moment</p>
                      <button onClick={() => setActiveTab('scraper')} className="mt-3 px-4 py-2 bg-blue-600/30 text-blue-400 rounded-lg text-sm hover:bg-blue-600/50 transition-colors">
                        → Lancer un scraping
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">📧 Campagnes email</h3>
                <div className="space-y-3">
                  {campaigns.slice(0, 5).map((campaign, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{campaign.name || 'Campagne sans nom'}</p>
                        <p className="text-gray-400 text-sm">{campaign.status || 'En attente'}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${campaign.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {campaign.status || 'Inactif'}
                      </span>
                    </div>
                  ))}
                  {campaigns.length === 0 && (
                    <p className="text-gray-500 text-center py-4">Aucune campagne active</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== SCRAPER TAB ===== */}
        {activeTab === 'scraper' && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-2">🔍 Scraper de prospects immobiliers</h2>
            <p className="text-gray-400 mb-8">Choisissez un site et renseignez vos critères — on s'occupe du reste.</p>

            {/* Résultat du scraping */}
            {scrapingProgress && (
              <div className={`mb-8 p-5 rounded-xl border ${
                scrapingProgress.status === 'running' ? 'bg-blue-500/10 border-blue-500/50' :
                scrapingProgress.status === 'done' ? 'bg-green-500/10 border-green-500/50' :
                'bg-red-500/10 border-red-500/50'
              }`}>
                {scrapingProgress.status === 'running' && (
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-blue-300 font-medium">{scrapingProgress.message}</p>
                  </div>
                )}
                {scrapingProgress.status === 'done' && (
                  <div>
                    <p className="text-green-400 font-bold text-lg mb-1">✅ {scrapingProgress.message}</p>
                    <p className="text-green-300">
                      <span className="font-bold">{scrapingProgress.count}</span> annonces trouvées •{' '}
                      <span className="font-bold">{scrapingProgress.nouvelles}</span> nouvelles ajoutées
                    </p>
                    <button onClick={resetScraper} className="mt-3 px-4 py-2 bg-green-600/30 text-green-400 rounded-lg text-sm hover:bg-green-600/50 transition-colors">
                      Nouveau scraping →
                    </button>
                  </div>
                )}
                {scrapingProgress.status === 'error' && (
                  <div>
                    <p className="text-red-400 font-bold mb-1">❌ Erreur</p>
                    <p className="text-red-300 text-sm">{scrapingProgress.message}</p>
                    <button onClick={resetScraper} className="mt-3 px-4 py-2 bg-red-600/30 text-red-400 rounded-lg text-sm hover:bg-red-600/50 transition-colors">
                      Réessayer →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Formulaire principal (masqué pendant/après scraping) */}
            {!scrapingProgress && (
              <div className="space-y-8">

                {/* ÉTAPE 1 — Choisir le site */}
                <div>
                  <p className="text-gray-300 font-semibold mb-4 text-sm uppercase tracking-wider">
                    Étape 1 — Choisir le site
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {SITES_DISPONIBLES.map(site => (
                      <button
                        key={site.id}
                        onClick={() => setScraperForm({ ...scraperForm, siteId: site.id })}
                        className={`p-5 rounded-xl border-2 text-left transition-all ${
                          scraperForm.siteId === site.id
                            ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20'
                            : 'border-gray-600 bg-gray-700/30 hover:border-gray-500 hover:bg-gray-700/50'
                        }`}
                      >
                        <div className="text-3xl mb-3">{site.logo}</div>
                        <p className="text-white font-bold text-lg">{site.nom}</p>
                        <p className="text-gray-400 text-sm mt-1">{site.description}</p>
                        {scraperForm.siteId === site.id && (
                          <span className="mt-3 inline-block px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                            ✓ Sélectionné
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ÉTAPE 2 — Localisation */}
                <div>
                  <p className="text-gray-300 font-semibold mb-4 text-sm uppercase tracking-wider">
                    Étape 2 — Localisation
                  </p>
                  <input
                    type="text"
                    value={scraperForm.location}
                    onChange={(e) => setScraperForm({ ...scraperForm, location: e.target.value })}
                    placeholder="Paris, Lyon, Marseille, Nantes..."
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-lg"
                  />
                </div>

                {/* ÉTAPE 3 — Filtres */}
                <div>
                  <p className="text-gray-300 font-semibold mb-4 text-sm uppercase tracking-wider">
                    Étape 3 — Filtres (optionnels)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Type de bien</label>
                      <select
                        value={scraperForm.propertyType}
                        onChange={(e) => setScraperForm({ ...scraperForm, propertyType: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                      >
                        {TYPES_BIENS.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Prix min (€)</label>
                      <input
                        type="number"
                        value={scraperForm.prixMin}
                        onChange={(e) => setScraperForm({ ...scraperForm, prixMin: e.target.value })}
                        placeholder="100 000"
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Prix max (€)</label>
                      <input
                        type="number"
                        value={scraperForm.prixMax}
                        onChange={(e) => setScraperForm({ ...scraperForm, prixMax: e.target.value })}
                        placeholder="500 000"
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Surface min (m²)</label>
                      <input
                        type="number"
                        value={scraperForm.surfaceMin}
                        onChange={(e) => setScraperForm({ ...scraperForm, surfaceMin: e.target.value })}
                        placeholder="50"
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Bouton lancer */}
                <button
                  onClick={handleScrape}
                  disabled={loading || !scraperForm.siteId || !scraperForm.location.trim()}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                    scraperForm.siteId && scraperForm.location.trim()
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600 shadow-lg shadow-blue-500/30'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center space-x-2">
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Scraping en cours...</span>
                    </span>
                  ) : (
                    `🚀 Lancer le scraping${scraperForm.siteId ? ' sur ' + SITES_DISPONIBLES.find(s => s.id === scraperForm.siteId)?.nom : ''}`
                  )}
                </button>

                {/* Indication si champs manquants */}
                {(!scraperForm.siteId || !scraperForm.location.trim()) && (
                  <p className="text-center text-gray-500 text-sm -mt-4">
                    {!scraperForm.siteId ? '👆 Sélectionnez un site pour continuer' : '👆 Entrez une ville pour continuer'}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== BIENS TAB ===== */}
        {activeTab === 'biens' && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">🏠 Biens immobiliers</h2>
                <p className="text-gray-400 text-sm mt-1">{biens.length} annonce{biens.length > 1 ? "s" : ""} dans la base</p>
              </div>
              <button onClick={() => setActiveTab("scraper")} className="px-4 py-2 bg-blue-600/30 text-blue-400 rounded-lg hover:bg-blue-600/50 transition-colors text-sm">
                + Nouveau scraping
              </button>
            </div>

            {/* Filtres */}
            <div className="flex space-x-4 mb-6">
              <input
                type="text"
                placeholder="Rechercher par ville, titre..."
                value={biensFilter.search}
                onChange={(e) => setBiensFilter({...biensFilter, search: e.target.value})}
                className="flex-1 px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <select
                value={biensFilter.type}
                onChange={(e) => setBiensFilter({...biensFilter, type: e.target.value})}
                className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">Tous les types</option>
                <option value="maison">🏡 Maison</option>
                <option value="appartement">🏢 Appartement</option>
                <option value="terrain">🌿 Terrain</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            {/* Liste des biens */}
            <div className="space-y-4">
              {biens
                .filter(b => {
                  const matchType = biensFilter.type === "all" || b.type === biensFilter.type;
                  const matchSearch = !biensFilter.search || 
                    b.titre?.toLowerCase().includes(biensFilter.search.toLowerCase()) ||
                    b.ville?.toLowerCase().includes(biensFilter.search.toLowerCase());
                  return matchType && matchSearch;
                })
                .map((bien, i) => (
                  <div key={i} className="p-5 bg-gray-700/30 rounded-xl border border-gray-600 hover:border-gray-500 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                            {bien.type || 'Autre'}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-600/50 text-gray-400 rounded text-xs">
                            {bien.source || 'inconnu'}
                          </span>
                        </div>
                        <h3 className="text-white font-semibold text-lg">{bien.titre || 'Sans titre'}</h3>
                        <p className="text-gray-400 text-sm mt-1">📍 {bien.ville || bien.adresse || 'Localisation inconnue'}</p>
                        {bien.description && (
                          <p className="text-gray-500 text-sm mt-2 line-clamp-2">{bien.description.slice(0, 120)}...</p>
                        )}
                        <div className="flex items-center space-x-4 mt-3">
                          {bien.surface && <span className="text-gray-300 text-sm">📐 {bien.surface} m²</span>}
                          {bien.pieces && <span className="text-gray-300 text-sm">🚪 {bien.pieces} pièces</span>}
                          <span className="text-gray-500 text-xs">{new Date(bien.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold text-white">{bien.prix ? bien.prix.toLocaleString("fr-FR") + " €" : "Prix NC"}</p>
                        {bien.lien && (
                          <a href={bien.lien} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block px-3 py-1 bg-blue-600/30 text-blue-400 rounded text-sm hover:bg-blue-600/50 transition-colors">
                            Voir l'annonce →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              {biens.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">Aucun bien dans la base</p>
                  <button onClick={() => setActiveTab("scraper")} className="mt-4 px-6 py-2 bg-blue-600/30 text-blue-400 rounded-lg hover:bg-blue-600/50 transition-colors">
                    → Lancer un scraping
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== PROSPECTS TAB ===== */}
        {activeTab === 'prospects' && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">👥 Liste des prospects</h2>
              <button onClick={selectAllProspects} className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                {selectedProspects.length === prospects.length ? '❌ Tout désélectionner' : '✅ Tout sélectionner'}
              </button>
            </div>
            <div className="space-y-3">
              {prospects.map((prospect, i) => {
                const email = prospect.email || prospect.lead_email;
                return (
                  <div key={i} className="flex items-center p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedProspects.includes(email)}
                      onChange={() => toggleProspectSelection(email)}
                      className="w-5 h-5 mr-4 accent-blue-600"
                    />
                    <div className="flex-1">
                      <p className="text-white font-medium">{email || 'Email non renseigné'}</p>
                      <p className="text-gray-400 text-sm">{prospect.message || prospect.conversation_history || 'Aucun message'}</p>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(prospect.created_at).toLocaleDateString()}</span>
                  </div>
                );
              })}
              {prospects.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">Aucun prospect trouvé</p>
                  <p className="text-gray-600 mt-2">Utilisez le scraper pour trouver des prospects</p>
                  <button onClick={() => setActiveTab('scraper')} className="mt-4 px-6 py-2 bg-blue-600/30 text-blue-400 rounded-lg hover:bg-blue-600/50 transition-colors">
                    → Aller au Scraper
                  </button>
                </div>
              )}
            </div>
            {selectedProspects.length > 0 && (
              <div className="mt-6 p-4 bg-blue-600/20 border border-blue-600 rounded-lg flex items-center justify-between">
                <p className="text-blue-400 font-medium">
                  ✅ {selectedProspects.length} prospect{selectedProspects.length > 1 ? 's' : ''} sélectionné{selectedProspects.length > 1 ? 's' : ''}
                </p>
                <button onClick={() => setActiveTab('email')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  Envoyer un email →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== EMAIL TAB ===== */}
        {activeTab === 'email' && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">📧 Envoyer un email aux prospects</h2>
            {selectedProspects.length === 0 && (
              <div className="mb-6 p-4 bg-yellow-600/20 border border-yellow-600 rounded-lg">
                <p className="text-yellow-400">⚠️ Sélectionnez d'abord des prospects dans l'onglet "Prospects"</p>
              </div>
            )}
            <form onSubmit={handleSendEmail} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">Nom de l'expéditeur</label>
                  <input type="text" value={emailForm.senderName} onChange={(e) => setEmailForm({ ...emailForm, senderName: e.target.value })} className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" required />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Email de l'expéditeur</label>
                  <input type="email" value={emailForm.senderEmail} onChange={(e) => setEmailForm({ ...emailForm, senderEmail: e.target.value })} className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" required />
                </div>
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Sujet de l'email</label>
                <input type="text" value={emailForm.subject} onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })} placeholder="Ex: Nouvelle opportunité immobilière" className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" required />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Message (HTML supporté)</label>
                <textarea value={emailForm.message} onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })} placeholder="<p>Bonjour,</p><p>Nous avons une nouvelle opportunité...</p>" rows={10} className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm" required />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                <div>
                  <p className="text-white font-medium">Destinataires sélectionnés</p>
                  <p className="text-gray-400 text-sm">{selectedProspects.length} prospect{selectedProspects.length > 1 ? 's' : ''}</p>
                </div>
                <button type="submit" disabled={loading || selectedProspects.length === 0} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? '📤 Envoi...' : `📧 Envoyer à ${selectedProspects.length} prospect${selectedProspects.length > 1 ? 's' : ''}`}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
