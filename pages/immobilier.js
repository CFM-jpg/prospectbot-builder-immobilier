import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ImmobilierDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [prospects, setProspects] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({
    totalProspects: 0,
    activeListings: 0,
    emailsSent: 0,
    responseRate: 0
  });
  const [loading, setLoading] = useState(false);
  const [selectedProspects, setSelectedProspects] = useState([]);

  // Formulaires
  const [scraperForm, setScraperForm] = useState({
    url: '',
    location: '',
    propertyType: 'all'
  });
  const [emailForm, setEmailForm] = useState({
    subject: '',
    message: '',
    senderName: 'ProspectBot Immobilier',
    senderEmail: 'contact@prospectbot.com'
  });

  // Charger les données au montage
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Charger les prospects depuis l'API
      const prospectsRes = await fetch('/api/B2B/chatbot-conversations');
      if (prospectsRes.ok) {
        const data = await prospectsRes.json();
        setProspects(data.conversations || []);
        setStats(prev => ({ ...prev, totalProspects: data.conversations?.length || 0 }));
      }

      // Charger les campagnes email
      const campaignsRes = await fetch('/api/B2B/email-automation');
      if (campaignsRes.ok) {
        const data = await campaignsRes.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  const handleScrape = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/B2B/scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: scraperForm.url,
          filters: {
            location: scraperForm.location,
            propertyType: scraperForm.propertyType
          }
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(`✅ ${data.prospects?.length || 0} prospects trouvés !`);
        loadDashboardData(); // Recharger les données
        setScraperForm({ url: '', location: '', propertyType: 'all' });
      } else {
        alert(`❌ Erreur: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Erreur réseau: ' + error.message);
    } finally {
      setLoading(false);
    }
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
      prev.includes(email)
        ? prev.filter(e => e !== email)
        : [...prev, email]
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
              <button
                onClick={() => router.push('/')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Retour
              </button>
              <h1 className="text-2xl font-bold text-white">🏠 ProspectBot Immobilier</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                ● En ligne
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex space-x-2 bg-gray-800/30 backdrop-blur-sm p-1 rounded-lg">
          {[
            { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
            { id: 'scraper', label: '🔍 Scraper', icon: '🔍' },
            { id: 'prospects', label: '👥 Prospects', icon: '👥' },
            { id: 'email', label: '📧 Email', icon: '📧' }
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
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
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
                    <div className={`text-4xl bg-${stat.color}-500/20 p-3 rounded-lg`}>
                      {stat.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Prospects */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">📋 Derniers prospects</h3>
                <div className="space-y-3">
                  {prospects.slice(0, 5).map((prospect, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors">
                      <div>
                        <p className="text-white font-medium">{prospect.lead_email || 'Email non renseigné'}</p>
                        <p className="text-gray-400 text-sm">{prospect.message || 'Aucun message'}</p>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(prospect.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                  {prospects.length === 0 && (
                    <p className="text-gray-500 text-center py-4">Aucun prospect pour le moment</p>
                  )}
                </div>
              </div>

              {/* Recent Campaigns */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">📧 Campagnes email</h3>
                <div className="space-y-3">
                  {campaigns.slice(0, 5).map((campaign, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors">
                      <div>
                        <p className="text-white font-medium">{campaign.name || 'Campagne sans nom'}</p>
                        <p className="text-gray-400 text-sm">{campaign.status || 'En attente'}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        campaign.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
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

        {/* Scraper Tab */}
        {activeTab === 'scraper' && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">🔍 Scraper de prospects immobiliers</h2>
            <form onSubmit={handleScrape} className="space-y-6">
              <div>
                <label className="block text-gray-300 mb-2">URL du site à scraper</label>
                <input
                  type="url"
                  value={scraperForm.url}
                  onChange={(e) => setScraperForm({...scraperForm, url: e.target.value})}
                  placeholder="https://www.seloger.com/immobilier/..."
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">Localisation</label>
                  <input
                    type="text"
                    value={scraperForm.location}
                    onChange={(e) => setScraperForm({...scraperForm, location: e.target.value})}
                    placeholder="Paris, Lyon, Marseille..."
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Type de bien</label>
                  <select
                    value={scraperForm.propertyType}
                    onChange={(e) => setScraperForm({...scraperForm, propertyType: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">Tous</option>
                    <option value="apartment">Appartement</option>
                    <option value="house">Maison</option>
                    <option value="land">Terrain</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '🔄 Scraping en cours...' : '🚀 Lancer le scraping'}
              </button>
            </form>
          </div>
        )}

        {/* Prospects Tab */}
        {activeTab === 'prospects' && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">👥 Liste des prospects</h2>
              <button
                onClick={selectAllProspects}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
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
                </div>
              )}
            </div>

            {selectedProspects.length > 0 && (
              <div className="mt-6 p-4 bg-blue-600/20 border border-blue-600 rounded-lg">
                <p className="text-blue-400 font-medium">
                  ✅ {selectedProspects.length} prospect{selectedProspects.length > 1 ? 's' : ''} sélectionné{selectedProspects.length > 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Email Tab */}
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
                  <input
                    type="text"
                    value={emailForm.senderName}
                    onChange={(e) => setEmailForm({...emailForm, senderName: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Email de l'expéditeur</label>
                  <input
                    type="email"
                    value={emailForm.senderEmail}
                    onChange={(e) => setEmailForm({...emailForm, senderEmail: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Sujet de l'email</label>
                <input
                  type="text"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                  placeholder="Ex: Nouvelle opportunité immobilière"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Message (HTML supporté)</label>
                <textarea
                  value={emailForm.message}
                  onChange={(e) => setEmailForm({...emailForm, message: e.target.value})}
                  placeholder="<p>Bonjour,</p><p>Nous avons une nouvelle opportunité...</p>"
                  rows={10}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
                  required
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                <div>
                  <p className="text-white font-medium">Destinataires sélectionnés</p>
                  <p className="text-gray-400 text-sm">{selectedProspects.length} prospect{selectedProspects.length > 1 ? 's' : ''}</p>
                </div>
                <button
                  type="submit"
                  disabled={loading || selectedProspects.length === 0}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
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
