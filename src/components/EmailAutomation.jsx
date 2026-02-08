// components/EmailAutomation.jsx 
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function EmailAutomation() {
  const [activeTab, setActiveTab] = useState('campaigns');
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [stats, setStats] = useState({ sent: 0, opened: 0, clicked: 0, openRate: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal states
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  // Form states
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    description: '',
    campaign_type: 'manual',
    status: 'draft'
  });

  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    body: '',
    variables: []
  });

  // ==========================================
  // API HELPERS avec gestion d'erreurs
  // ==========================================
  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(endpoint, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      // Vérifier si la réponse est OK
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Vérifier le Content-Type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Réponse non-JSON reçue: ${text.substring(0, 100)}`);
      }

      return await response.json();
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
  };

  // ==========================================
  // LOAD DATA
  // ==========================================
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (activeTab === 'campaigns') {
        await loadCampaigns();
        await loadStats();
      } else if (activeTab === 'templates') {
        await loadTemplates();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    try {
      const data = await apiCall('/api/email-automation?entity=campaigns');
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading campaigns:', err);
      setCampaigns([]);
      throw err;
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await apiCall('/api/email-automation?entity=templates');
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading templates:', err);
      setTemplates([]);
      throw err;
    }
  };

  const loadStats = async () => {
    try {
      const data = await apiCall('/api/email-automation?entity=stats');
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
      setStats({ sent: 0, opened: 0, clicked: 0, openRate: 0 });
    }
  };

  // ==========================================
  // CAMPAIGNS CRUD
  // ==========================================
  const createCampaign = async () => {
    setLoading(true);
    setError(null);

    try {
      await apiCall('/api/email-automation?entity=campaigns', {
        method: 'POST',
        body: JSON.stringify(campaignForm)
      });

      setShowCampaignModal(false);
      setCampaignForm({ title: '', description: '', campaign_type: 'manual', status: 'draft' });
      await loadCampaigns();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateCampaignStatus = async (id, status) => {
    setLoading(true);
    setError(null);

    try {
      await apiCall('/api/email-automation?entity=campaigns', {
        method: 'PUT',
        body: JSON.stringify({ id, status })
      });

      await loadCampaigns();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteCampaign = async (id) => {
    if (!confirm('Supprimer cette campagne ?')) return;

    setLoading(true);
    setError(null);

    try {
      await apiCall(`/api/email-automation?entity=campaigns&id=${id}`, {
        method: 'DELETE'
      });

      await loadCampaigns();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // TEMPLATES CRUD
  // ==========================================
  const createTemplate = async () => {
    setLoading(true);
    setError(null);

    try {
      // Extraire les variables du template
      const variables = extractVariables(templateForm.body);

      await apiCall('/api/email-automation?entity=templates', {
        method: 'POST',
        body: JSON.stringify({ ...templateForm, variables })
      });

      setShowTemplateModal(false);
      setTemplateForm({ name: '', subject: '', body: '', variables: [] });
      await loadTemplates();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (id) => {
    if (!confirm('Supprimer ce template ?')) return;

    setLoading(true);
    setError(null);

    try {
      await apiCall(`/api/email-automation?entity=templates&id=${id}`, {
        method: 'DELETE'
      });

      await loadTemplates();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // HELPERS
  // ==========================================
  const extractVariables = (text) => {
    const regex = /{{(.*?)}}/g;
    const matches = [...text.matchAll(regex)];
    return [...new Set(matches.map(m => m[1].trim()))];
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || colors.draft;
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            📧 Email Automation
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez vos campagnes email automatisées
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <strong>Erreur:</strong> {error}
          </div>
        )}

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm">Emails envoyés</div>
            <div className="text-3xl font-bold text-blue-600">{stats.sent}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm">Ouverts</div>
            <div className="text-3xl font-bold text-green-600">{stats.opened}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm">Cliqués</div>
            <div className="text-3xl font-bold text-purple-600">{stats.clicked}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm">Taux d'ouverture</div>
            <div className="text-3xl font-bold text-indigo-600">{stats.openRate}%</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex space-x-4 border-b mb-6">
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'campaigns'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              Campagnes
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'templates'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              Templates
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Chargement...</p>
            </div>
          )}

          {/* Campaigns Tab */}
          {!loading && activeTab === 'campaigns' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Mes campagnes</h2>
                <button
                  onClick={() => setShowCampaignModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  + Nouvelle campagne
                </button>
              </div>

              {campaigns.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Aucune campagne. Créez-en une pour commencer !
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map(campaign => (
                    <div key={campaign.id} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg">{campaign.title}</h3>
                          <p className="text-gray-600 text-sm">{campaign.description}</p>
                          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(campaign.status)}`}>
                            {campaign.status}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          {campaign.status === 'draft' && (
                            <button
                              onClick={() => updateCampaignStatus(campaign.id, 'active')}
                              className="text-green-600 hover:text-green-800 font-medium text-sm"
                            >
                              Activer
                            </button>
                          )}
                          {campaign.status === 'active' && (
                            <button
                              onClick={() => updateCampaignStatus(campaign.id, 'paused')}
                              className="text-yellow-600 hover:text-yellow-800 font-medium text-sm"
                            >
                              Pause
                            </button>
                          )}
                          <button
                            onClick={() => deleteCampaign(campaign.id)}
                            className="text-red-600 hover:text-red-800 font-medium text-sm"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Templates Tab */}
          {!loading && activeTab === 'templates' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Mes templates</h2>
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  + Nouveau template
                </button>
              </div>

              {templates.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Aucun template. Créez-en un pour commencer !
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map(template => (
                    <div key={template.id} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold">{template.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                          {template.variables && template.variables.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {template.variables.map(variable => (
                                <span key={variable} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                  {`{{${variable}}}`}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Campaign Modal */}
        {showCampaignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Nouvelle campagne</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Titre</label>
                  <input
                    type="text"
                    value={campaignForm.title}
                    onChange={(e) => setCampaignForm({...campaignForm, title: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Ex: Campagne Prospects Q1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={campaignForm.description}
                    onChange={(e) => setCampaignForm({...campaignForm, description: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    rows="3"
                    placeholder="Description de la campagne"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={campaignForm.campaign_type}
                    onChange={(e) => setCampaignForm({...campaignForm, campaign_type: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="manual">Manuel</option>
                    <option value="auto">Auto (Scraper)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCampaignModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
                <button
                  onClick={createCampaign}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Template Modal */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
              <h3 className="text-xl font-bold mb-4">Nouveau template</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom du template</label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Ex: Email de premier contact"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Sujet</label>
                  <input
                    type="text"
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm({...templateForm, subject: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Ex: Bonjour {{prenom}}, j'ai une proposition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Corps du message</label>
                  <textarea
                    value={templateForm.body}
                    onChange={(e) => setTemplateForm({...templateForm, body: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
                    rows="10"
                    placeholder="Bonjour {{prenom}},&#10;&#10;Je vous contacte au sujet de {{entreprise}}..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Utilisez {`{{prenom}}`}, {`{{nom}}`}, {`{{entreprise}}`}, {`{{poste}}`} pour personnaliser
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
                <button
                  onClick={createTemplate}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
