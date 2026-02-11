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

  // États pour le scraper
  const [scraperForm, setScraperForm] = useState({
    url: '',
    selector: ''
  });
  const [scrapedData, setScrapedData] = useState([]);

  // États pour les workflows
  const [workflowForm, setWorkflowForm] = useState({
    name: '',
    trigger: 'new_prospect',
    actions: []
  });
  const [workflows, setWorkflows] = useState([]);

  // États pour l'envoi d'emails
  const [emailForm, setEmailForm] = useState({
    recipients: [],
    subject: '',
    content: ''
  });
  const [selectedProspects, setSelectedProspects] = useState([]);

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
        setStats(prev => ({
          ...prev,
          emailsSent: data.campaigns?.reduce((sum, c) => sum + (c.sent_count || 0), 0) || 0
        }));
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

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setLoading(true);

    const recipients = selectedProspects.length > 0 
      ? selectedProspects 
      : emailForm.recipients.split(',').map(e => e.trim()).filter(Boolean);

    if (recipients.length === 0) {
      alert('⚠️ Veuillez sélectionner au moins un destinataire');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/B2B/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients,
          subject: emailForm.subject,
          htmlContent: emailForm.content,
          senderName: 'ProspectBot',
          senderEmail: 'contact@prospectbot.com'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(`✅ ${data.sent} emails envoyés avec succès !`);
        setEmailForm({ recipients: [], subject: '', content: '' });
        setSelectedProspects([]);
        setStats(prev => ({
          ...prev,
          emailsSent: prev.emailsSent + data.sent
        }));
      } else {
        alert(`❌ Erreur: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Erreur réseau: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScraping = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/B2B/scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: scraperForm.url,
          selector: scraperForm.selector
        })
      });

      const data = await response.json();
      
      if (response.ok && data.emails) {
        setScrapedData(data.emails);
        alert(`✅ ${data.emails.length} emails extraits avec succès !`);
      } else {
        alert('❌ Aucune donnée extraite');
      }
    } catch (error) {
      alert('❌ Erreur lors du scraping: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddScrapedProspects = async () => {
    if (scrapedData.length === 0) return;
    
    setLoading(true);
    try {
      let addedCount = 0;
      
      for (const email of scrapedData) {
        const response = await fetch('/api/B2B/chatbot-conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lead_email: email,
            message: 'Prospect ajouté via scraping',
            source: 'web_scraping'
          })
        });

        if (response.ok) addedCount++;
      }

      alert(`✅ ${addedCount} prospects ajoutés à la base de données !`);
      setScrapedData([]);
      setScraperForm({ url: '', selector: '' });
      loadDashboardData();
    } catch (error) {
      alert('❌ Erreur lors de l\'ajout des prospects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async (e) => {
    e.preventDefault();
    
    const newWorkflow = {
      id: Date.now(),
      name: workflowForm.name,
      trigger: workflowForm.trigger,
      actions: workflowForm.actions,
      active: true,
      created_at: new Date().toISOString()
    };

    setWorkflows([...workflows, newWorkflow]);
    setWorkflowForm({ name: '', trigger: 'new_prospect', actions: [] });
    alert('✅ Workflow créé avec succès !');
  };

  const handleAddWorkflowAction = (actionType) => {
    const action = {
      id: Date.now(),
      type: actionType,
      params: {}
    };
    
    setWorkflowForm({
      ...workflowForm,
      actions: [...workflowForm.actions, action]
    });
  };

  const handleRemoveWorkflowAction = (actionId) => {
    setWorkflowForm({
      ...workflowForm,
      actions: workflowForm.actions.filter(a => a.id !== actionId)
    });
  };

  const handleToggleProspect = (email) => {
    setSelectedProspects(prev => 
      prev.includes(email)
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
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
            {activeSection === 'scraper' && 'Extrayez des emails depuis n\'importe quel site web'}
            {activeSection === 'workflows' && 'Créez des automatisations personnalisées'}
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
              {/* Conversations récentes */}
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
          <div className="space-y-6">
            {/* Liste des prospects */}
            {conversations.length > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">
                  👥 Sélectionner des prospects ({selectedProspects.length} sélectionné{selectedProspects.length > 1 ? 's' : ''})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {conversations.map((conv, i) => (
                    conv.lead_email && (
                      <div 
                        key={i}
                        onClick={() => handleToggleProspect(conv.lead_email)}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          selectedProspects.includes(conv.lead_email)
                            ? 'bg-purple-600/30 border border-purple-500'
                            : 'bg-gray-700/30 hover:bg-gray-700/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white">{conv.lead_email}</span>
                          <input
                            type="checkbox"
                            checked={selectedProspects.includes(conv.lead_email)}
                            onChange={() => {}}
                            className="w-5 h-5"
                          />
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Formulaire d'envoi */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
              <form onSubmit={handleSendEmail} className="space-y-6">
                <div>
                  <label className="block text-gray-300 mb-2">
                    Destinataires (emails séparés par des virgules)
                  </label>
                  <input
                    type="text"
                    value={emailForm.recipients}
                    onChange={(e) => setEmailForm({...emailForm, recipients: e.target.value})}
                    placeholder="contact@example.com, user@domain.com"
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    disabled={selectedProspects.length > 0}
                  />
                  {selectedProspects.length > 0 && (
                    <p className="text-sm text-purple-400 mt-2">
                      {selectedProspects.length} prospect(s) sélectionné(s) ci-dessus
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Sujet</label>
                  <input
                    type="text"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                    placeholder="Votre sujet ici..."
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Contenu (HTML supporté)</label>
                  <textarea
                    value={emailForm.content}
                    onChange={(e) => setEmailForm({...emailForm, content: e.target.value})}
                    placeholder="<p>Bonjour,</p><p>Je vous contacte au sujet de...</p>"
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
                  {loading ? '⏳ Envoi...' : `📨 Envoyer ${selectedProspects.length > 0 ? `à ${selectedProspects.length} prospect(s)` : 'l\'email'}`}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Web Scraper */}
        {activeSection === 'scraper' && (
          <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
              <form onSubmit={handleScraping} className="space-y-6">
                <div>
                  <label className="block text-gray-300 mb-2">URL du site à scraper</label>
                  <input
                    type="url"
                    value={scraperForm.url}
                    onChange={(e) => setScraperForm({...scraperForm, url: e.target.value})}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">
                    Sélecteur CSS (optionnel)
                  </label>
                  <input
                    type="text"
                    value={scraperForm.selector}
                    onChange={(e) => setScraperForm({...scraperForm, selector: e.target.value})}
                    placeholder=".contact-email, #email-address..."
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Si vide, le scraper cherchera tous les emails sur la page
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
                >
                  {loading ? '⏳ Extraction...' : '🔍 Lancer le scraping'}
                </button>
              </form>
            </div>

            {/* Résultats du scraping */}
            {scrapedData.length > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-green-600">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">
                    ✅ {scrapedData.length} email{scrapedData.length > 1 ? 's' : ''} extrait{scrapedData.length > 1 ? 's' : ''}
                  </h3>
                  <button
                    onClick={handleAddScrapedProspects}
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all disabled:opacity-50"
                  >
                    {loading ? '⏳ Ajout...' : '➕ Ajouter à la base'}
                  </button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {scrapedData.map((email, i) => (
                    <div key={i} className="p-3 bg-gray-700/30 rounded-lg">
                      <span className="text-white font-mono">📧 {email}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Workflows */}
        {activeSection === 'workflows' && (
          <div className="space-y-6">
            {/* Formulaire de création */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
              <form onSubmit={handleCreateWorkflow} className="space-y-6">
                <div>
                  <label className="block text-gray-300 mb-2">Nom du workflow</label>
                  <input
                    type="text"
                    value={workflowForm.name}
                    onChange={(e) => setWorkflowForm({...workflowForm, name: e.target.value})}
                    placeholder="Ex: Nurturing automatique nouveaux leads"
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Déclencheur</label>
                  <select
                    value={workflowForm.trigger}
                    onChange={(e) => setWorkflowForm({...workflowForm, trigger: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="new_prospect">Nouveau prospect</option>
                    <option value="email_opened">Email ouvert</option>
                    <option value="link_clicked">Lien cliqué</option>
                    <option value="form_submitted">Formulaire soumis</option>
                    <option value="chatbot_conversation">Conversation chatbot</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-4">Actions du workflow</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => handleAddWorkflowAction('send_email')}
                      className="p-3 bg-blue-600/20 border border-blue-600 rounded-lg text-blue-400 hover:bg-blue-600/30 transition-all"
                    >
                      📧 Envoyer email
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddWorkflowAction('wait')}
                      className="p-3 bg-orange-600/20 border border-orange-600 rounded-lg text-orange-400 hover:bg-orange-600/30 transition-all"
                    >
                      ⏱️ Attendre
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddWorkflowAction('tag_prospect')}
                      className="p-3 bg-green-600/20 border border-green-600 rounded-lg text-green-400 hover:bg-green-600/30 transition-all"
                    >
                      🏷️ Ajouter tag
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddWorkflowAction('notify_team')}
                      className="p-3 bg-purple-600/20 border border-purple-600 rounded-lg text-purple-400 hover:bg-purple-600/30 transition-all"
                    >
                      🔔 Notifier équipe
                    </button>
                  </div>

                  {/* Liste des actions */}
                  {workflowForm.actions.length > 0 && (
                    <div className="space-y-2">
                      {workflowForm.actions.map((action, i) => (
                        <div key={action.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                          <span className="text-white">
                            {i + 1}. {
                              action.type === 'send_email' ? '📧 Envoyer un email' :
                              action.type === 'wait' ? '⏱️ Attendre' :
                              action.type === 'tag_prospect' ? '🏷️ Ajouter un tag' :
                              action.type === 'notify_team' ? '🔔 Notifier l\'équipe' :
                              action.type
                            }
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveWorkflowAction(action.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {workflowForm.actions.length === 0 && (
                    <p className="text-gray-500 text-center py-4">Aucune action ajoutée</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={workflowForm.actions.length === 0}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
                >
                  ⚡ Créer le workflow
                </button>
              </form>
            </div>

            {/* Liste des workflows créés */}
            {workflows.length > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">
                  📋 Workflows actifs ({workflows.length})
                </h3>
                <div className="space-y-3">
                  {workflows.map((workflow, i) => (
                    <div key={workflow.id} className="p-4 bg-gray-700/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{workflow.name}</span>
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                          Actif
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">
                        <p>Déclencheur: {workflow.trigger}</p>
                        <p>{workflow.actions.length} action(s)</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
