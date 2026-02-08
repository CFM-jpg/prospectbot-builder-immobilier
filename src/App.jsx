import React, { useState, useEffect } from 'react';
import { Bot, Mail, Search, Workflow, Home, MessageSquare, Send, Database, Settings, Play, Pause, Trash2, Plus, Download, Upload, Eye, Edit, Save, ChevronRight, Users, BarChart3, Zap, Target, Globe } from 'lucide-react';
import ChatbotBuilder from './components/ChatbotBuilder';

export default function ProspectBotBuilder() {
// API Helper Functions
const callAPI = async (endpoint, data) => {
  const response = await fetch(`/api/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return await response.json()
}
  const [activeTab, setActiveTab] = useState('dashboard');
  const [chatbots, setChatbots] = useState([
    { id: 1, name: 'Qualification Lead B2B', status: 'active', conversations: 47, qualified: 23 },
    { id: 2, name: 'Support Client', status: 'paused', conversations: 12, qualified: 8 }
  ]);
  const [emailCampaigns, setEmailCampaigns] = useState([
    { id: 1, name: 'Campagne SaaS Tech', sent: 234, opened: 156, clicked: 45, status: 'active' },
    { id: 2, name: 'Relance Prospects', sent: 89, opened: 34, clicked: 12, status: 'active' }
  ]);
  const [scrapers, setScrapers] = useState([
    { id: 1, name: 'LinkedIn IT Managers', collected: 156, status: 'running' },
    { id: 2, name: 'Sites Web Concurrents', collected: 89, status: 'completed' }
  ]);
  const [workflows, setWorkflows] = useState([
    { id: 1, name: 'Prospection Complète', steps: 5, leads: 234, status: 'active' },
    { id: 2, name: 'Nurturing Leads', steps: 3, leads: 89, status: 'active' }
  ]);

  // Chatbot Builder State
  const [selectedChatbot, setSelectedChatbot] = useState(null);
  const [chatbotMessages, setChatbotMessages] = useState([
    { type: 'bot', text: 'Bonjour ! Je suis là pour qualifier vos besoins.' },
    { type: 'question', text: 'Quel est votre secteur d\'activité ?', options: ['Tech', 'Finance', 'Santé', 'Autre'] },
  ]);

  // Email Automation State
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [emailSequence, setEmailSequence] = useState([
    { day: 0, subject: 'Introduction à notre solution', template: 'Bonjour {{prenom}},\n\nJe me permets de vous contacter...' },
    { day: 3, subject: 'Rappel et ressources', template: 'Bonjour {{prenom}},\n\nVoici quelques ressources...' }
  ]);

  // Scraper State
  const [scrapingUrl, setScrapingUrl] = useState('');
  const [scrapedData, setScrapedData] = useState([]);
  const [scraping, setScraping] = useState(false);

  // Workflow Builder State
  const [workflowSteps, setWorkflowSteps] = useState([
    { id: 1, type: 'scraper', name: 'Collecter prospects LinkedIn', config: {} },
    { id: 2, type: 'chatbot', name: 'Qualifier via chatbot', config: {} },
    { id: 3, type: 'email', name: 'Envoyer séquence email', config: {} }
  ]);

  // ========== NOUVEAU : EMAIL SENDER BREVO STATE ==========
  const [emailSenderForm, setEmailSenderForm] = useState({
    senderName: '',
    senderEmail: '',
    subject: '',
    template: 'Bonjour {name},\n\nVoici un message personnalisé pour vous.\n\nCordialement,'
  });
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [emailStats, setEmailStats] = useState({
    sent: 0,
    opened: 0,
    clicked: 0
  });

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Tableau de Bord
          </h1>
          <p className="text-gray-600">Vue d'ensemble de vos campagnes de prospection</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
            <Plus size={18} />
            Nouveau Workflow
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Users size={32} />
            <span className="text-blue-100 text-sm font-semibold">+12% ce mois</span>
          </div>
          <div className="text-3xl font-bold mb-1">1,234</div>
          <div className="text-blue-100">Prospects Totaux</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Target size={32} />
            <span className="text-green-100 text-sm font-semibold">+8% ce mois</span>
          </div>
          <div className="text-3xl font-bold mb-1">456</div>
          <div className="text-green-100">Leads Qualifiés</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Mail size={32} />
            <span className="text-purple-100 text-sm font-semibold">3 actives</span>
          </div>
          <div className="text-3xl font-bold mb-1">789</div>
          <div className="text-purple-100">Emails Envoyés</div>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Zap size={32} />
            <span className="text-pink-100 text-sm font-semibold">24% taux</span>
          </div>
          <div className="text-3xl font-bold mb-1">189</div>
          <div className="text-pink-100">Conversions</div>
        </div>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Chatbots Actifs</h3>
            <Bot className="text-indigo-600" size={24} />
          </div>
          <div className="space-y-3">
            {chatbots.map(bot => (
              <div key={bot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${bot.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <div>
                    <div className="font-semibold text-gray-800">{bot.name}</div>
                    <div className="text-sm text-gray-500">{bot.conversations} conversations · {bot.qualified} qualifiés</div>
                  </div>
                </div>
                <ChevronRight className="text-gray-400" size={20} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Campagnes Email</h3>
            <Mail className="text-purple-600" size={24} />
          </div>
          <div className="space-y-3">
            {emailCampaigns.map(campaign => (
              <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{campaign.name}</div>
                  <div className="text-sm text-gray-500">
                    {campaign.sent} envoyés · {Math.round((campaign.opened / campaign.sent) * 100)}% ouverture
                  </div>
                </div>
                <ChevronRight className="text-gray-400" size={20} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderChatbotBuilder = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Chatbot Builder</h1>
          <p className="text-gray-600">Créez des conversations intelligentes pour qualifier vos leads</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
          <Plus size={18} />
          Nouveau Chatbot
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chatbot List */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Mes Chatbots</h3>
          <div className="space-y-3">
            {chatbots.map(bot => (
              <div 
                key={bot.id}
                onClick={() => setSelectedChatbot(bot)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedChatbot?.id === bot.id 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-gray-800">{bot.name}</div>
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    bot.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {bot.status === 'active' ? 'Actif' : 'Pausé'}
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {bot.conversations} conversations · {bot.qualified} qualifiés
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-all">
            + Créer un nouveau chatbot
          </button>
        </div>

        {/* Chatbot Preview */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Aperçu de Conversation</h3>
          <div className="bg-gradient-to-b from-indigo-50 to-purple-50 rounded-xl p-4 h-96 overflow-y-auto space-y-3">
            {chatbotMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.type === 'bot' ? 'justify-start' : 'justify-end'}`}>
                {msg.type === 'bot' ? (
                  <div className="bg-white rounded-lg p-3 shadow-sm max-w-xs">
                    <div className="text-sm text-gray-800">{msg.text}</div>
                    {msg.options && (
                      <div className="mt-2 space-y-1">
                        {msg.options.map((opt, i) => (
                          <button 
                            key={i}
                            className="block w-full text-left px-3 py-1 bg-indigo-50 text-indigo-700 rounded text-xs hover:bg-indigo-100"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-indigo-600 text-white rounded-lg p-3 shadow-sm max-w-xs">
                    <div className="text-sm">{msg.text}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex gap-2">
            <input 
              type="text"
              placeholder="Taper un message de test..."
              className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
            />
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Configuration du Flow</h3>
        <div className="space-y-3">
          <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">1</div>
              <input 
                type="text"
                placeholder="Message de bienvenue"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                defaultValue="Bonjour ! Je suis là pour qualifier vos besoins."
              />
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">2</div>
              <input 
                type="text"
                placeholder="Question à poser"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                defaultValue="Quel est votre secteur d'activité ?"
              />
            </div>
            <div className="ml-11 flex flex-wrap gap-2">
              <input type="text" placeholder="Option 1" className="px-3 py-1 border border-gray-200 rounded text-sm" defaultValue="Tech" />
              <input type="text" placeholder="Option 2" className="px-3 py-1 border border-gray-200 rounded text-sm" defaultValue="Finance" />
              <input type="text" placeholder="Option 3" className="px-3 py-1 border border-gray-200 rounded text-sm" defaultValue="Santé" />
              <button className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded text-sm">+ Ajouter</button>
            </div>
          </div>
          <button className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-all">
            + Ajouter une étape
          </button>
        </div>
      </div>
    </div>
  );

  const renderEmailAutomation = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Email Automation</h1>
          <p className="text-gray-600">Créez des séquences d'emails automatisées pour vos prospects</p>
        </div>
        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all flex items-center gap-2">
          <Plus size={18} />
          Nouvelle Campagne
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign List */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Mes Campagnes</h3>
          <div className="space-y-3">
            {emailCampaigns.map(campaign => (
              <div 
                key={campaign.id}
                onClick={() => setSelectedCampaign(campaign)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedCampaign?.id === campaign.id 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-gray-800">{campaign.name}</div>
                  <div className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    Active
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                  <div>
                    <div className="font-semibold">{campaign.sent}</div>
                    <div>Envoyés</div>
                  </div>
                  <div>
                    <div className="font-semibold">{Math.round((campaign.opened / campaign.sent) * 100)}%</div>
                    <div>Ouverture</div>
                  </div>
                  <div>
                    <div className="font-semibold">{Math.round((campaign.clicked / campaign.sent) * 100)}%</div>
                    <div>Clics</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Email Sequence */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Séquence d'Emails</h3>
          <div className="space-y-4">
            {emailSequence.map((email, idx) => (
              <div key={idx} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
                    J+{email.day}
                  </div>
                  <input 
                    type="text"
                    defaultValue={email.subject}
                    className="flex-1 px-3 py-2 bg-white border border-purple-200 rounded-lg font-semibold text-gray-800"
                  />
                </div>
                <textarea 
                  defaultValue={email.template}
                  rows={4}
                  className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg text-sm text-gray-700 resize-none"
                />
              </div>
            ))}
            <button className="w-full px-4 py-2 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:border-purple-400 hover:bg-purple-50 transition-all">
              + Ajouter un email à la séquence
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm font-semibold text-blue-800 mb-2">💡 Variables disponibles</div>
            <div className="flex flex-wrap gap-2 text-xs">
              {['{{prenom}}', '{{nom}}', '{{entreprise}}', '{{poste}}', '{{secteur}}'].map(v => (
                <code key={v} className="px-2 py-1 bg-white border border-blue-300 rounded text-blue-700">
                  {v}
                </code>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWebScraper = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Web Scraper</h1>
          <p className="text-gray-600">Collectez automatiquement des informations sur vos prospects</p>
        </div>
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2">
          <Plus size={18} />
          Nouveau Scraper
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scraper Configuration */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Type de Scraping</label>
              <select className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none">
                <option>LinkedIn - Profils</option>
                <option>LinkedIn - Entreprises</option>
                <option>Sites Web - Emails</option>
                <option>Sites Web - Contacts</option>
                <option>Annuaires Professionnels</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">URL ou Recherche</label>
              <input 
                type="text"
                value={scrapingUrl}
                onChange={(e) => setScrapingUrl(e.target.value)}
                placeholder="Ex: linkedin.com/search/results/people..."
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Critères de Filtrage</label>
              <div className="space-y-2">
                <input 
                  type="text"
                  placeholder="Poste (ex: CEO, CTO, Directeur)"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                />
                <input 
                  type="text"
                  placeholder="Secteur (ex: Tech, Finance)"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                />
                <input 
                  type="text"
                  placeholder="Localisation (ex: Paris, France)"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={async () => {
                  setScraping(true);
                  try {
                    const result = await callAPI('scraper', {
                      platform: scrapingUrl.includes('linkedin') ? 'linkedin' : 'web',
                      keywords: scrapingUrl,
                      filters: {}
                    });
                    
                    if (result.success && result.prospects) {
                      setScrapedData(result.prospects.map(p => ({
                        name: `${p.first_name} ${p.last_name}`,
                        role: p.position || 'N/A',
                        company: p.company || 'N/A',
                        linkedin: p.linkedin_url || '',
                        email: p.email || ''
                      })));
                      alert(`✅ ${result.prospects.length} prospects scrapés !`);
                    } else {
                      alert('⚠️ Aucun prospect trouvé');
                    }
                  } catch (error) {
                    alert('❌ Erreur : ' + error.message);
                  }
                  setScraping(false);
                }}
                disabled={scraping}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                {scraping ? '🔄 Scraping en cours...' : '🚀 Lancer le Scraping'}
              </button>
              <button className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all">
                💾 Sauvegarder Config
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Résultats ({scrapedData.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {scrapedData.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Search size={48} className="mx-auto mb-3 opacity-50" />
                <p>Aucun résultat pour le moment</p>
                <p className="text-sm">Lancez un scraping pour voir les données</p>
              </div>
            ) : (
              scrapedData.map((prospect, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="font-semibold text-gray-800">{prospect.name}</div>
                  <div className="text-sm text-gray-600">{prospect.role} • {prospect.company}</div>
                  <div className="text-xs text-gray-500 mt-1">{prospect.email || 'Email non trouvé'}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderWorkflowBuilder = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Workflow Builder</h1>
          <p className="text-gray-600">Automatisez vos processus de prospection de bout en bout</p>
        </div>
        <button className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all flex items-center gap-2">
          <Plus size={18} />
          Nouveau Workflow
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Mes Workflows</h3>
        <div className="space-y-3">
          {workflows.map(workflow => (
            <div key={workflow.id} className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-gray-800">{workflow.name}</div>
                <div className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  {workflow.status === 'active' ? 'Actif' : 'Inactif'}
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {workflow.steps} étapes · {workflow.leads} leads générés
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Constructeur de Workflow</h3>
        <div className="space-y-3">
          {workflowSteps.map((step, idx) => (
            <div key={step.id} className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center font-bold">
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-800">{step.name}</div>
                <div className="text-xs text-gray-500">Type: {step.type}</div>
              </div>
              <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-all">
                Configurer
              </button>
            </div>
          ))}
          <button className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-pink-400 hover:text-pink-600 transition-all">
            + Ajouter une étape
          </button>
        </div>
      </div>
    </div>
  );

  // ========== NOUVEAU : EMAIL SENDER BREVO ==========
  const renderEmailSender = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent mb-2">
            Email Sender Pro
          </h1>
          <p className="text-gray-600">Envoyez des emails personnalisés à vos prospects avec Brevo</p>
        </div>
        <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2 shadow-lg">
          <Send size={18} />
          Tester l'Email
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Send size={28} />
          </div>
          <div className="text-3xl font-bold mb-1">{emailStats.sent}</div>
          <div className="text-blue-100">Emails Envoyés</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Eye size={28} />
          </div>
          <div className="text-3xl font-bold mb-1">{emailStats.opened}</div>
          <div className="text-green-100">Emails Ouverts</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Target size={28} />
          </div>
          <div className="text-3xl font-bold mb-1">{emailStats.clicked}</div>
          <div className="text-purple-100">Clics</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Configuration */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 space-y-4">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Configuration de l'Email</h3>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nom de l'expéditeur</label>
            <input 
              type="text"
              value={emailSenderForm.senderName}
              onChange={(e) => setEmailSenderForm({...emailSenderForm, senderName: e.target.value})}
              placeholder="Ex: Thomas Dupont"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email expéditeur</label>
            <input 
              type="email"
              value={emailSenderForm.senderEmail}
              onChange={(e) => setEmailSenderForm({...emailSenderForm, senderEmail: e.target.value})}
              placeholder="Ex: thomas@votreentreprise.com"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">⚠️ Doit être vérifié dans votre compte Brevo</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Sujet de l'email</label>
            <input 
              type="text"
              value={emailSenderForm.subject}
              onChange={(e) => setEmailSenderForm({...emailSenderForm, subject: e.target.value})}
              placeholder="Ex: Découvrez notre solution"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Template de l'email</label>
            <textarea 
              value={emailSenderForm.template}
              onChange={(e) => setEmailSenderForm({...emailSenderForm, template: e.target.value})}
              rows={8}
              placeholder="Bonjour {name},..."
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
            />
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-xs font-semibold text-blue-800 mb-1">💡 Variables disponibles</div>
              <div className="flex flex-wrap gap-2 text-xs">
                {['{name}', '{email}', '{role}', '{company}'].map(v => (
                  <code key={v} className="px-2 py-1 bg-white border border-blue-300 rounded text-blue-700">
                    {v}
                  </code>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recipients Selection */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Destinataires ({selectedRecipients.length})
          </h3>

          {selectedRecipients.length > 0 && (
            <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-purple-800">
                  {selectedRecipients.length} prospect{selectedRecipients.length > 1 ? 's' : ''} sélectionné{selectedRecipients.length > 1 ? 's' : ''}
                </span>
                <button 
                  onClick={() => setSelectedRecipients([])}
                  className="text-xs text-purple-600 hover:text-purple-800 font-semibold"
                >
                  Tout désélectionner
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {scrapedData.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Users size={48} className="mx-auto mb-3 opacity-50" />
                <p>Aucun prospect disponible</p>
                <p className="text-sm">Utilisez le Web Scraper pour collecter des prospects</p>
              </div>
            ) : (
              scrapedData.map((prospect, idx) => {
                const isSelected = selectedRecipients.some(r => r.email === prospect.email);
                return (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedRecipients(selectedRecipients.filter(r => r.email !== prospect.email));
                      } else {
                        setSelectedRecipients([...selectedRecipients, prospect]);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-300'
                      }`}>
                        {isSelected && <div className="text-white text-xs">✓</div>}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{prospect.name}</div>
                        <div className="text-sm text-gray-600">{prospect.role} • {prospect.company}</div>
                        <div className="text-xs text-gray-500">{prospect.email || 'Email non disponible'}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {scrapedData.length > 0 && (
            <button 
              onClick={() => {
                if (selectedRecipients.length === scrapedData.length) {
                  setSelectedRecipients([]);
                } else {
                  setSelectedRecipients(scrapedData);
                }
              }}
              className="w-full mt-4 px-4 py-2 border-2 border-purple-300 rounded-lg text-purple-600 hover:bg-purple-50 transition-all font-semibold"
            >
              {selectedRecipients.length === scrapedData.length ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
          )}
        </div>
      </div>

      {/* Send Button */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Prêt à envoyer ?</h3>
            <p className="text-sm text-gray-600">
              {selectedRecipients.length} email{selectedRecipients.length > 1 ? 's' : ''} sera{selectedRecipients.length > 1 ? 'ont' : ''} envoyé{selectedRecipients.length > 1 ? 's' : ''}
            </p>
          </div>
          <button 
            onClick={async () => {
              if (selectedRecipients.length === 0) {
                alert('⚠️ Veuillez sélectionner au moins un destinataire');
                return;
              }
              if (!emailSenderForm.senderName || !emailSenderForm.senderEmail || !emailSenderForm.subject) {
                alert('⚠️ Veuillez remplir tous les champs obligatoires');
                return;
              }

              setSendingEmails(true);
              try {
                const result = await callAPI('send-email', {
                  senderName: emailSenderForm.senderName,
                  senderEmail: emailSenderForm.senderEmail,
                  subject: emailSenderForm.subject,
                  template: emailSenderForm.template,
                  recipients: selectedRecipients
                });

                if (result.success) {
                  alert(`✅ ${result.sent} email(s) envoyé(s) avec succès !`);
                  setEmailStats({
                    sent: emailStats.sent + result.sent,
                    opened: emailStats.opened,
                    clicked: emailStats.clicked
                  });
                  setSelectedRecipients([]);
                } else {
                  alert('❌ Erreur lors de l\'envoi : ' + (result.error || 'Erreur inconnue'));
                }
              } catch (error) {
                alert('❌ Erreur : ' + error.message);
              }
              setSendingEmails(false);
            }}
            disabled={sendingEmails || selectedRecipients.length === 0}
            className={`px-8 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              sendingEmails || selectedRecipients.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg'
            }`}
          >
            <Send size={20} />
            {sendingEmails ? '📧 Envoi en cours...' : `🚀 Envoyer ${selectedRecipients.length} email${selectedRecipients.length > 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-gray-900 via-indigo-900 to-purple-900 text-white shadow-2xl z-50">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center shadow-lg">
              <Zap size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">ProspectBot</h1>
              <p className="text-xs text-gray-300">Builder v1.0</p>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'dashboard', icon: Home, label: 'Dashboard', color: 'blue' },
              { id: 'chatbot', icon: Bot, label: 'Chatbot Builder', color: 'indigo' },
              { id: 'email', icon: Mail, label: 'Email Auto', color: 'purple' },
              { id: 'emailsender', icon: Send, label: 'Email Sender', color: 'pink' },
              { id: 'scraper', icon: Search, label: 'Web Scraper', color: 'green' },
              { id: 'workflow', icon: Workflow, label: 'Workflows', color: 'pink' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === item.id
                    ? 'bg-white text-gray-900 shadow-lg'
                    : 'text-gray-300 hover:bg-white/10'
                }`}
              >
                <item.icon size={20} />
                <span className="font-semibold">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-sm font-bold">
              MP
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">Mon Profil</div>
              <div className="text-xs text-gray-300">Version Personnelle</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'chatbot' && <ChatbotBuilder />}
        {activeTab === 'email' && renderEmailAutomation()}
        {activeTab === 'emailsender' && renderEmailSender()}
        {activeTab === 'scraper' && renderWebScraper()}
        {activeTab === 'workflow' && renderWorkflowBuilder()}
      </div>
    </div>
  );
}


