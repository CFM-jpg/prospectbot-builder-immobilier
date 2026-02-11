import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function B2BDashboard() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [chatbots, setChatbots] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({
    prospects: 0,
    leads: 0,
    emailsSent: 0,
    conversions: 0
  });
  const [loading, setLoading] = useState(false);

  // Formulaires
  const [chatbotForm, setChatbotForm] = useState({
    name: '',
    greeting: '',
    targetAudience: ''
  });
  const [emailCampaignForm, setEmailCampaignForm] = useState({
    name: '',
    subject: '',
    content: '',
    targetList: []
  });

  // Charger les données au montage
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Charger les conversations chatbot
      const convRes = await fetch('/api/B2B/chatbot-conversations');
      if (convRes.ok) {
        const data = await convRes.json();
        setConversations(data.conversations || []);
        setStats(prev => ({
          ...prev,
          prospects: data.conversations?.length || 0,
          leads: data.conversations?.filter(c => c.lead_email).length || 0
        }));
      }

      // Charger les campagnes email
      const campaignRes = await fetch('/api/B2B/email-automation');
      if (campaignRes.ok) {
        const data = await campaignRes.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  const handleCreateChatbot = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/B2B/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: chatbotForm.greeting,
          conversationId: `chatbot-${Date.now()}`
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('✅ Chatbot créé avec succès !');
        setChatbotForm({ name: '', greeting: '', targetAudience: '' });
        loadDashboardData();
      } else {
        alert(`❌ Erreur: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Erreur réseau: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmailCampaign = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/B2B/email-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignName: emailCampaignForm.name,
          recipients: emailCampaignForm.targetList,
          subject: emailCampaignForm.subject,
          htmlContent: emailCampaignForm.content
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('✅ Campagne email créée !');
        setEmailCampaignForm({ name: '', subject: '', content: '', targetList: [] });
        loadDashboardData();
      } else {
        alert(`❌ Erreur: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Erreur réseau: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (recipients, subject, content) => {
    setLoading(true);

    try {
      const response = await fetch('/api/B2B/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients,
          subject,
          htmlContent: content,
          senderName: 'ProspectBot',
          senderEmail: 'contact@prospectbot.com'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(`✅ ${data.sent} emails envoyés !`);
      } else {
        alert(`❌ Erreur: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Erreur réseau: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-gray-800/50 backdrop-blur-lg border-r border-gray-700">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              PB
            </div>
            <div>
              <h1 className="text-white font-bold">ProspectBot</h1>
              <p className="text-gray-400 text-xs">B2B Edition</p>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
              { id: 'chatbot', label: 'Chatbot Builder', icon: '🤖' },
              { id: 'email-auto', label: 'Email Auto', icon: '📧' },
              { id: 'email-sender', label: 'Email Sender', icon: '✉️' },
              { id: 'scraper', label: 'Web Scraper', icon: '🔍' },
              { id: 'workflows', label: 'Workflows', icon: '⚡' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  activeSection === item.id
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <button
            onClick={() => router.push('/')}
            className="w-full px-4 py-2 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            ← Retour accueil
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            {activeSection === 'dashboard' && '📊 Dashboard'}
            {activeSection === 'chatbot' && '🤖 Chatbot Builder'}
            {activeSection === 'email-auto' && '📧 Email Automation'}
            {activeSection === 'email-sender' && '✉️ Email Sender'}
            {activeSection === 'scraper' && '🔍 Web Scraper'}
            {activeSection === 'workflows' && '⚡ Workflows'}
          </h2>
          <p className="text-gray-400">
            {activeSection === 'dashboard' && 'Vue d\'ensemble de vos performances'}
            {activeSection === 'chatbot' && 'Créez et gérez vos chatbots intelligents'}
            {activeSection === 'email-auto' && 'Automatisez vos campagnes email'}
            {activeSection === 'email-sender' && 'Envoyez des emails personnalisés'}
            {activeSection === 'scraper' && 'Extrayez des données du web'}
            {activeSection === 'workflows' && 'Automatisez vos processus métier'}
          </p>
        </div>

        {/* Dashboard */}
        {activeSection === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Prospects', value: stats.prospects, icon: '👥', color: 'blue' },
                { label: 'Leads qualifiés', value: stats.leads, icon: '🎯', color: 'green' },
                { label: 'Emails envoyés', value: stats.emailsSent, icon: '📧', color: 'purple' },
                { label: 'Conversions', value: stats.conversions, icon: '💰', color: 'orange' }
              ].map((stat, i) => (
                <div key={i} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">{stat.label}</p>
                      <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                    </div>
                    <div className="text-4xl">{stat.icon}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chatbots actifs */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">🤖 Conversations récentes</h3>
                <div className="space-y-3">
                  {conversations.slice(0, 5).map((conv, i) => (
                    <div key={i} className="p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{conv.lead_email || 'Visiteur anonyme'}</span>
                        <span className="text-xs text-gray-500">{new Date(conv.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-400 text-sm line-clamp-2">{conv.message || 'Pas de message'}</p>
                    </div>
                  ))}
                  {conversations.length === 0 && (
                    <p className="text-gray-500 text-center py-4">Aucune conversation</p>
                  )}
                </div>
              </div>

              {/* Campagnes email */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">📧 Campagnes email</h3>
                <div className="space-y-3">
                  {campaigns.slice(0, 5).map((campaign, i) => (
                    <div key={i} className="p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{campaign.name || 'Campagne sans nom'}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          campaign.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {campaign.status || 'Inactif'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">{campaign.subject || 'Aucun sujet'}</p>
                    </div>
                  ))}
                  {campaigns.length === 0 && (
                    <p className="text-gray-500 text-center py-4">Aucune campagne</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">⚡ Actions rapides</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveSection('chatbot')}
                  className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg text-white font-medium hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                  🤖 Nouveau chatbot
                </button>
                <button
                  onClick={() => setActiveSection('email-auto')}
                  className="p-4 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg text-white font-medium hover:from-purple-700 hover:to-purple-800 transition-all"
                >
                  📧 Nouvelle campagne
                </button>
                <button
                  onClick={() => setActiveSection('workflows')}
                  className="p-4 bg-gradient-to-r from-green-600 to-green-700 rounded-lg text-white font-medium hover:from-green-700 hover:to-green-800 transition-all"
                >
                  ⚡ Nouveau workflow
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chatbot Builder */}
        {activeSection === 'chatbot' && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
            <form onSubmit={handleCreateChatbot} className="space-y-6">
              <div>
                <label className="block text-gray-300 mb-2">Nom du chatbot</label>
                <input
                  type="text"
                  value={chatbotForm.name}
                  onChange={(e) => setChatbotForm({...chatbotForm, name: e.target.value})}
                  placeholder="Ex: Assistant commercial"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Message de bienvenue</label>
                <textarea
                  value={chatbotForm.greeting}
                  onChange={(e) => setChatbotForm({...chatbotForm, greeting: e.target.value})}
                  placeholder="Bonjour ! Comment puis-je vous aider aujourd'hui ?"
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Public cible</label>
                <input
                  type="text"
                  value={chatbotForm.targetAudience}
                  onChange={(e) => setChatbotForm({...chatbotForm, targetAudience: e.target.value})}
                  placeholder="Ex: Professionnels B2B, PME..."
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
              >
                {loading ? '⏳ Création...' : '🚀 Créer le chatbot'}
              </button>
            </form>
          </div>
        )}

        {/* Email Automation */}
        {activeSection === 'email-auto' && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
            <form onSubmit={handleCreateEmailCampaign} className="space-y-6">
              <div>
                <label className="block text-gray-300 mb-2">Nom de la campagne</label>
                <input
                  type="text"
                  value={emailCampaignForm.name}
                  onChange={(e) => setEmailCampaignForm({...emailCampaignForm, name: e.target.value})}
                  placeholder="Ex: Offre de lancement"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Sujet de l'email</label>
                <input
                  type="text"
                  value={emailCampaignForm.subject}
                  onChange={(e) => setEmailCampaignForm({...emailCampaignForm, subject: e.target.value})}
                  placeholder="Découvrez notre nouvelle solution..."
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Contenu (HTML supporté)</label>
                <textarea
                  value={emailCampaignForm.content}
                  onChange={(e) => setEmailCampaignForm({...emailCampaignForm, content: e.target.value})}
                  placeholder="<p>Bonjour,</p><p>Nous avons le plaisir de vous présenter...</p>"
                  rows={10}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
              >
                {loading ? '⏳ Création...' : '🚀 Créer la campagne'}
              </button>
            </form>
          </div>
        )}

        {/* Email Sender */}
        {activeSection === 'email-sender' && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
            <div className="space-y-6">
              <div className="p-4 bg-blue-600/20 border border-blue-600 rounded-lg">
                <p className="text-blue-400">💡 Utilisez cette section pour envoyer des emails ponctuels à vos prospects</p>
              </div>
              
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">Sélectionnez des prospects dans le Dashboard</p>
                <button
                  onClick={() => setActiveSection('dashboard')}
                  className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Voir les prospects
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Web Scraper */}
        {activeSection === 'scraper' && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg mb-4">🔍 Fonctionnalité de scraping disponible</p>
              <p className="text-gray-500">Utilisez l'API /api/B2B/scraper pour extraire des données</p>
            </div>
          </div>
        )}

        {/* Workflows */}
        {activeSection === 'workflows' && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg mb-4">⚡ Créez des workflows automatisés</p>
              <p className="text-gray-500">Fonctionnalité en développement</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
