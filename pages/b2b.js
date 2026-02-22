import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '../lib/useAuth';

// ─── Config ───────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Vue d\'ensemble' },
  { id: 'chatbot', label: 'Chatbot' },
  { id: 'campaigns', label: 'Campagnes email' },
  { id: 'email-sender', label: 'Envoi email' },
  { id: 'scraper', label: 'Scraper web' },
  { id: 'workflows', label: 'Workflows' },
];

const WORKFLOW_TRIGGERS = [
  { value: 'new_prospect', label: 'Nouveau prospect' },
  { value: 'email_opened', label: 'Email ouvert' },
  { value: 'link_clicked', label: 'Lien cliqué' },
  { value: 'form_submitted', label: 'Formulaire soumis' },
  { value: 'chatbot_conversation', label: 'Conversation chatbot' },
];

const WORKFLOW_ACTIONS = [
  { type: 'send_email', label: 'Envoyer un email' },
  { type: 'wait', label: 'Délai d\'attente' },
  { type: 'tag_prospect', label: 'Ajouter un tag' },
  { type: 'notify_team', label: 'Notifier l\'équipe' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function B2BDashboard() {
  const { agent, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  const [conversations, setConversations] = useState([]);
  const [campaigns, setCampaigns] = useState([]);

  const [stats, setStats] = useState({
    prospects: 0,
    leads: 0,
    emailsSent: 0,
    conversions: 0,
  });

  // Chatbot form
  const [chatbotForm, setChatbotForm] = useState({ name: '', greeting: '', targetAudience: '' });
  const [chatbotStatus, setChatbotStatus] = useState(null);

  // Campaign form
  const [campaignForm, setCampaignForm] = useState({ name: '', subject: '', content: '' });
  const [campaignStatus, setCampaignStatus] = useState(null);

  // Email sender
  const [emailForm, setEmailForm] = useState({ recipients: '', subject: '', content: '', senderName: '', senderEmail: '' });
  const [selectedProspects, setSelectedProspects] = useState([]);
  const [emailStatus, setEmailStatus] = useState(null);

  // Scraper
  const [scraperForm, setScraperForm] = useState({ url: '', selector: '' });
  const [scrapedEmails, setScrapedEmails] = useState([]);
  const [scraperStatus, setScraperStatus] = useState(null);

  // Workflows
  const [workflowForm, setWorkflowForm] = useState({ name: '', trigger: 'new_prospect', actions: [] });
  const [workflows, setWorkflows] = useState([]);
  const [workflowStatus, setWorkflowStatus] = useState(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [convRes, campRes] = await Promise.all([
        fetch('/api/B2B/chatbot-conversations'),
        fetch('/api/B2B/email-automation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'list_campaigns' }) }),
      ]);
      if (convRes.ok) {
        const d = await convRes.json();
        const convs = d.conversations || [];
        setConversations(convs);
        setStats(prev => ({ ...prev, prospects: convs.length, leads: convs.filter(c => c.lead_email || c.visitor_email).length }));
      }
      if (campRes.ok) {
        const d = await campRes.json();
        const camps = d.campaigns || [];
        setCampaigns(camps);
        setStats(prev => ({ ...prev, emailsSent: camps.reduce((s, c) => s + (c.sent_count || 0), 0) }));
      }
    } catch (err) { console.error(err); }
  };

  // ── Chatbot ────────────────────────────────────────────────────────────────

  const handleCreateChatbot = async (e) => {
    e.preventDefault();
    setLoading(true);
    setChatbotStatus(null);
    try {
      const res = await fetch('/api/B2B/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: chatbotForm.name,
          welcomeMessage: chatbotForm.greeting,
          questions: [{ text: chatbotForm.targetAudience || 'Comment puis-je vous aider ?' }],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setChatbotStatus({ success: true });
        setChatbotForm({ name: '', greeting: '', targetAudience: '' });
      } else {
        setChatbotStatus({ success: false, error: data.error });
      }
    } catch (err) {
      setChatbotStatus({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // ── Campaigns ──────────────────────────────────────────────────────────────

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    setLoading(true);
    setCampaignStatus(null);
    try {
      const res = await fetch('/api/B2B/email-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_campaign', title: campaignForm.name, description: campaignForm.content }),
      });
      const data = await res.json();
      if (res.ok) {
        setCampaignStatus({ success: true });
        setCampaignForm({ name: '', subject: '', content: '' });
        loadAll();
      } else {
        setCampaignStatus({ success: false, error: data.error });
      }
    } catch (err) {
      setCampaignStatus({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // ── Email Sender ───────────────────────────────────────────────────────────

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setEmailStatus(null);
    const recipients = selectedProspects.length > 0
      ? selectedProspects.map(email => ({ email }))
      : emailForm.recipients.split(',').map(e => ({ email: e.trim() })).filter(e => e.email);
    if (recipients.length === 0) { setEmailStatus({ success: false, error: 'Aucun destinataire' }); setLoading(false); return; }
    try {
      const res = await fetch('/api/B2B/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients,
          subject: emailForm.subject,
          template: emailForm.content,
          senderName: emailForm.senderName,
          senderEmail: emailForm.senderEmail,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailStatus({ success: true, sent: data.sent });
        setEmailForm({ recipients: '', subject: '', content: '', senderName: '', senderEmail: '' });
        setSelectedProspects([]);
      } else {
        setEmailStatus({ success: false, error: data.error });
      }
    } catch (err) {
      setEmailStatus({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const toggleProspect = (email) => {
    setSelectedProspects(prev => prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]);
  };

  // ── Scraper ────────────────────────────────────────────────────────────────

  const handleScrape = async (e) => {
    e.preventDefault();
    setLoading(true);
    setScraperStatus(null);
    setScrapedEmails([]);
    try {
      const res = await fetch('/api/B2B/scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scraperForm.url, selector: scraperForm.selector }),
      });
      const data = await res.json();
      if (res.ok) {
        setScrapedEmails(data.emails || []);
        setScraperStatus({ success: true, count: (data.emails || []).length });
      } else {
        setScraperStatus({ success: false, error: data.error || 'Erreur lors du scraping' });
      }
    } catch (err) {
      setScraperStatus({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // ── Workflows ──────────────────────────────────────────────────────────────

  const addAction = (type) => {
    setWorkflowForm(prev => ({ ...prev, actions: [...prev.actions, { id: Date.now(), type }] }));
  };

  const removeAction = (id) => {
    setWorkflowForm(prev => ({ ...prev, actions: prev.actions.filter(a => a.id !== id) }));
  };

  const handleCreateWorkflow = (e) => {
    e.preventDefault();
    if (workflowForm.actions.length === 0) return;
    setWorkflows(prev => [...prev, { ...workflowForm, id: Date.now(), active: true }]);
    setWorkflowStatus({ success: true });
    setWorkflowForm({ name: '', trigger: 'new_prospect', actions: [] });
    setTimeout(() => setWorkflowStatus(null), 3000);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Head>
        <title>B2B Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #0f0f11; color: #e8e8e8; min-height: 100vh; }

        :root {
          --bg: #0f0f11;
          --surface: #17171a;
          --surface2: #1f1f24;
          --border: rgba(255,255,255,0.07);
          --border-hover: rgba(255,255,255,0.14);
          --text: #e8e8e8;
          --text-muted: #6b6b78;
          --text-dim: #a0a0ae;
          --accent: #7c6af7;
          --accent-dim: rgba(124,106,247,0.12);
          --accent-border: rgba(124,106,247,0.3);
          --green: #3ecf8e;
          --green-dim: rgba(62,207,142,0.1);
          --red: #f04444;
          --red-dim: rgba(240,68,68,0.1);
          --blue: #5b8dee;
          --blue-dim: rgba(91,141,238,0.1);
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a30; border-radius: 2px; }

        .layout { display: flex; min-height: 100vh; }

        .sidebar {
          width: 220px; flex-shrink: 0;
          background: var(--surface); border-right: 1px solid var(--border);
          display: flex; flex-direction: column;
          position: sticky; top: 0; height: 100vh; overflow-y: auto;
        }
        .sidebar-logo { padding: 28px 20px 20px; border-bottom: 1px solid var(--border); }
        .sidebar-logo h1 { font-family: 'DM Serif Display', serif; font-size: 18px; color: var(--accent); letter-spacing: -0.3px; }
        .sidebar-logo p { font-size: 11px; color: var(--text-muted); margin-top: 3px; letter-spacing: 0.5px; text-transform: uppercase; }
        .sidebar-nav { padding: 16px 12px; flex: 1; }
        .sidebar-footer { padding: 14px 12px; border-top: 1px solid var(--border); }
        .agent-info { padding: 10px 12px; background: var(--surface2); border-radius: 8px; margin-bottom: 8px; }
        .agent-name { font-size: 13px; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .agent-role { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
        .logout-btn { display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 12px; font-size: 13px; color: var(--text-muted); background: none; border: 1px solid var(--border); border-radius: 8px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; text-align: left; }
        .logout-btn:hover { color: #f04444; border-color: rgba(240,68,68,0.3); background: rgba(240,68,68,0.05); }

        .nav-item {
          display: flex; align-items: center; padding: 9px 12px;
          border-radius: 8px; cursor: pointer; font-size: 13.5px; font-weight: 400;
          color: var(--text-muted); transition: all 0.15s; margin-bottom: 2px;
          border: none; background: none; width: 100%; text-align: left;
        }
        .nav-item:hover { color: var(--text); background: var(--surface2); }
        .nav-item.active { color: var(--accent); background: var(--accent-dim); font-weight: 500; }
        .nav-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; margin-right: 10px; opacity: 0.5; }
        .nav-item.active .nav-dot { opacity: 1; }

        .back-btn {
          display: block; width: 100%; padding: 9px 12px;
          font-size: 12.5px; color: var(--text-muted); background: none;
          border: 1px solid var(--border); border-radius: 8px; cursor: pointer;
          text-align: left; transition: all 0.15s;
        }
        .back-btn:hover { color: var(--text); border-color: var(--border-hover); }

        .main { flex: 1; overflow-y: auto; padding: 40px 48px; max-width: 1100px; }
        .page-header { margin-bottom: 36px; }
        .page-title { font-family: 'DM Serif Display', serif; font-size: 26px; font-weight: 400; color: var(--text); letter-spacing: -0.5px; }
        .page-subtitle { font-size: 13.5px; color: var(--text-muted); margin-top: 6px; }

        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 36px; }
        .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 22px 20px; transition: border-color 0.15s; }
        .stat-card:hover { border-color: var(--border-hover); }
        .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text-muted); font-weight: 500; }
        .stat-value { font-size: 30px; font-family: 'DM Serif Display', serif; color: var(--text); margin-top: 8px; letter-spacing: -1px; }
        .stat-sub { font-size: 12px; color: var(--text-muted); margin-top: 4px; }

        .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 28px; margin-bottom: 20px; }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .card-title { font-size: 14px; font-weight: 500; color: var(--text); }
        .card-link { font-size: 12px; color: var(--accent); cursor: pointer; background: none; border: none; padding: 0; }
        .card-link:hover { opacity: 0.8; }

        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

        .list-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border); }
        .list-item:last-child { border-bottom: none; }
        .list-item-main { font-size: 13.5px; color: var(--text); font-weight: 500; }
        .list-item-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
        .list-item-right { text-align: right; font-size: 13px; color: var(--text); font-weight: 500; }
        .list-item-right small { display: block; font-size: 11px; color: var(--text-muted); font-weight: 400; }

        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
        .badge-accent { background: var(--accent-dim); color: var(--accent); }
        .badge-green { background: var(--green-dim); color: var(--green); }
        .badge-neutral { background: var(--surface2); color: var(--text-muted); }
        .badge-red { background: var(--red-dim); color: var(--red); }

        label { display: block; font-size: 12px; font-weight: 500; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 7px; }
        input[type="text"], input[type="email"], input[type="url"], select, textarea {
          width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px;
          padding: 10px 13px; font-size: 13.5px; color: var(--text); font-family: 'DM Sans', sans-serif;
          outline: none; transition: border-color 0.15s;
        }
        input:focus, select:focus, textarea:focus { border-color: var(--accent-border); }
        input::placeholder, textarea::placeholder { color: var(--text-muted); }
        select option { background: #1f1f24; }
        textarea { resize: vertical; line-height: 1.6; }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-group { margin-bottom: 16px; }

        .btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 10px 20px; border-radius: 8px; font-size: 13.5px; font-weight: 500;
          font-family: 'DM Sans', sans-serif; cursor: pointer; border: none; transition: all 0.15s;
        }
        .btn-primary { background: var(--accent); color: #fff; }
        .btn-primary:hover { opacity: 0.9; }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-secondary { background: var(--surface2); color: var(--text-dim); border: 1px solid var(--border); }
        .btn-secondary:hover { border-color: var(--border-hover); color: var(--text); }
        .btn-ghost { background: transparent; color: var(--text-muted); border: 1px solid var(--border); }
        .btn-ghost:hover { color: var(--text); border-color: var(--border-hover); }
        .btn-danger { background: var(--red-dim); color: var(--red); border: 1px solid transparent; }
        .btn-full { width: 100%; }

        .spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.2); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .alert { padding: 12px 16px; border-radius: 8px; font-size: 13px; margin-bottom: 20px; border: 1px solid; }
        .alert-success { background: var(--green-dim); border-color: var(--green); color: var(--green); }
        .alert-error { background: var(--red-dim); border-color: var(--red); color: var(--red); }
        .alert-warning { background: var(--accent-dim); border-color: var(--accent-border); color: var(--accent); }

        .empty { text-align: center; padding: 48px 20px; color: var(--text-muted); font-size: 13.5px; }
        .empty strong { display: block; font-size: 15px; color: var(--text-dim); margin-bottom: 8px; }

        /* Prospects list */
        .prospect-row { display: flex; align-items: center; padding: 12px 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface2); margin-bottom: 8px; cursor: pointer; transition: border-color 0.15s; }
        .prospect-row:hover { border-color: var(--border-hover); }
        .prospect-row.selected { border-color: var(--accent-border); background: var(--accent-dim); }
        .prospect-check { width: 16px; height: 16px; border-radius: 4px; border: 1.5px solid var(--border); margin-right: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .prospect-check.checked { background: var(--accent); border-color: var(--accent); }
        .prospect-check.checked::after { content: ''; width: 8px; height: 5px; border-left: 2px solid #fff; border-bottom: 2px solid #fff; transform: rotate(-45deg) translate(1px, -1px); }

        /* Workflow */
        .action-btns { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
        .action-btn { padding: 12px; border-radius: 8px; background: var(--surface2); border: 1px solid var(--border); color: var(--text-dim); font-size: 13px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; text-align: center; }
        .action-btn:hover { border-color: var(--accent-border); color: var(--text); }
        .action-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 8px; font-size: 13px; color: var(--text-dim); }

        /* Scraper results */
        .email-pill { display: inline-flex; align-items: center; padding: 6px 12px; background: var(--surface2); border: 1px solid var(--border); border-radius: 6px; font-size: 12.5px; color: var(--text-dim); font-family: monospace; margin: 4px; }

        /* Quick actions */
        .quick-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .quick-action-btn { padding: 16px; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; color: var(--text-dim); font-size: 13.5px; font-weight: 500; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s; text-align: left; }
        .quick-action-btn:hover { border-color: var(--accent-border); color: var(--text); }
        .quick-action-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }

        .workflow-card { background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 18px 20px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }

        @media (max-width: 900px) {
          .sidebar { display: none; }
          .main { padding: 24px 20px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .two-col { grid-template-columns: 1fr; }
          .form-grid { grid-template-columns: 1fr; }
          .action-btns { grid-template-columns: 1fr 1fr; }
          .quick-actions { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <h1>B2B Pro</h1>
            <p>Prospection</p>
          </div>
          <nav className="sidebar-nav">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="nav-dot" />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="sidebar-footer">
            {agent && (
              <>
                <div className="agent-info">
                  <div className="agent-name">{agent.name}</div>
                  <div className="agent-role">{agent.role === 'admin' ? 'Administrateur' : 'Agent'}</div>
                </div>
                <button className="logout-btn" onClick={logout}>
                  <span>←</span> Déconnexion
                </button>
              </>
            )}
          </div>
        </aside>

        {/* Main */}
        <main className="main">

          {/* ── Dashboard ── */}
          {activeTab === 'dashboard' && (
            <>
              <div className="page-header">
                <h2 className="page-title">Vue d'ensemble</h2>
                <p className="page-subtitle">Performances de prospection B2B</p>
              </div>

              <div className="stats-grid">
                {[
                  { label: 'Prospects', value: stats.prospects, sub: 'conversations entrantes' },
                  { label: 'Leads qualifiés', value: stats.leads, sub: 'avec email identifié' },
                  { label: 'Emails envoyés', value: stats.emailsSent, sub: 'via Brevo' },
                  { label: 'Workflows actifs', value: workflows.length, sub: 'automatisations' },
                ].map((s, i) => (
                  <div key={i} className="stat-card">
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-sub">{s.sub}</div>
                  </div>
                ))}
              </div>

              <div className="two-col">
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Conversations récentes</span>
                    <button className="card-link" onClick={() => setActiveTab('chatbot')}>Voir tout</button>
                  </div>
                  {conversations.length === 0
                    ? <div className="empty"><strong>Aucune conversation</strong>Les leads de votre chatbot apparaîtront ici</div>
                    : conversations.slice(0, 5).map((c, i) => (
                      <div key={i} className="list-item">
                        <div>
                          <div className="list-item-main">{c.visitor_email || c.lead_email || 'Visiteur anonyme'}</div>
                          <div className="list-item-sub">{c.qualification_reason || 'Non catégorisé'}</div>
                        </div>
                        <div className="list-item-right">
                          <span className={`badge ${c.qualified ? 'badge-green' : 'badge-neutral'}`}>
                            {c.qualified ? 'Qualifié' : 'Froid'}
                          </span>
                          <small>{new Date(c.created_at).toLocaleDateString('fr-FR')}</small>
                        </div>
                      </div>
                    ))
                  }
                </div>

                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Campagnes email</span>
                    <button className="card-link" onClick={() => setActiveTab('campaigns')}>Voir tout</button>
                  </div>
                  {campaigns.length === 0
                    ? <div className="empty"><strong>Aucune campagne</strong>Créez votre première séquence email</div>
                    : campaigns.slice(0, 5).map((c, i) => (
                      <div key={i} className="list-item">
                        <div>
                          <div className="list-item-main">{c.title || c.name || 'Campagne sans nom'}</div>
                          <div className="list-item-sub">{c.campaign_type || 'manuel'}</div>
                        </div>
                        <div className="list-item-right">
                          <span className={`badge ${c.status === 'active' ? 'badge-green' : 'badge-neutral'}`}>
                            {c.status === 'active' ? 'Actif' : c.status || 'Brouillon'}
                          </span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <span className="card-title">Actions rapides</span>
                </div>
                <div className="quick-actions">
                  <button className="quick-action-btn" onClick={() => setActiveTab('chatbot')}>
                    <div className="quick-action-label">Chatbot</div>
                    Créer un chatbot
                  </button>
                  <button className="quick-action-btn" onClick={() => setActiveTab('campaigns')}>
                    <div className="quick-action-label">Email</div>
                    Nouvelle campagne
                  </button>
                  <button className="quick-action-btn" onClick={() => setActiveTab('workflows')}>
                    <div className="quick-action-label">Automation</div>
                    Configurer un workflow
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── Chatbot ── */}
          {activeTab === 'chatbot' && (
            <>
              <div className="page-header">
                <h2 className="page-title">Chatbot</h2>
                <p className="page-subtitle">Créez et gérez vos chatbots de qualification</p>
              </div>
              <div className="two-col" style={{ alignItems: 'flex-start' }}>
                <div className="card">
                  <div className="card-title" style={{ marginBottom: 20 }}>Créer un chatbot</div>
                  {chatbotStatus?.success && <div className="alert alert-success">Chatbot créé avec succès</div>}
                  {chatbotStatus?.error && <div className="alert alert-error">{chatbotStatus.error}</div>}
                  <form onSubmit={handleCreateChatbot}>
                    <div className="form-group"><label>Nom *</label><input type="text" value={chatbotForm.name} onChange={e => setChatbotForm({ ...chatbotForm, name: e.target.value })} placeholder="Assistant commercial" required /></div>
                    <div className="form-group"><label>Message de bienvenue *</label><textarea value={chatbotForm.greeting} onChange={e => setChatbotForm({ ...chatbotForm, greeting: e.target.value })} placeholder="Bonjour ! Comment puis-je vous aider ?" rows={4} required /></div>
                    <div className="form-group"><label>Public cible</label><input type="text" value={chatbotForm.targetAudience} onChange={e => setChatbotForm({ ...chatbotForm, targetAudience: e.target.value })} placeholder="PME, professionnels B2B…" /></div>
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                      {loading ? <><span className="spinner" /> Création…</> : 'Créer le chatbot'}
                    </button>
                  </form>
                </div>

                <div className="card">
                  <div className="card-title" style={{ marginBottom: 20 }}>Conversations reçues</div>
                  {conversations.length === 0
                    ? <div className="empty"><strong>Aucune conversation</strong>Les interactions avec votre chatbot apparaîtront ici</div>
                    : conversations.map((c, i) => (
                      <div key={i} className="list-item">
                        <div>
                          <div className="list-item-main">{c.visitor_email || c.lead_email || 'Anonyme'}</div>
                          <div className="list-item-sub">{c.qualification_reason || '—'}</div>
                        </div>
                        <span className={`badge ${c.qualified ? 'badge-green' : 'badge-neutral'}`}>
                          {c.qualified ? 'Qualifié' : 'Froid'}
                        </span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </>
          )}

          {/* ── Campaigns ── */}
          {activeTab === 'campaigns' && (
            <>
              <div className="page-header">
                <h2 className="page-title">Campagnes email</h2>
                <p className="page-subtitle">Automatisez vos séquences de prospection</p>
              </div>
              <div className="two-col" style={{ alignItems: 'flex-start' }}>
                <div className="card">
                  <div className="card-title" style={{ marginBottom: 20 }}>Nouvelle campagne</div>
                  {campaignStatus?.success && <div className="alert alert-success">Campagne créée</div>}
                  {campaignStatus?.error && <div className="alert alert-error">{campaignStatus.error}</div>}
                  <form onSubmit={handleCreateCampaign}>
                    <div className="form-group"><label>Nom *</label><input type="text" value={campaignForm.name} onChange={e => setCampaignForm({ ...campaignForm, name: e.target.value })} placeholder="Offre de lancement" required /></div>
                    <div className="form-group"><label>Sujet de l'email *</label><input type="text" value={campaignForm.subject} onChange={e => setCampaignForm({ ...campaignForm, subject: e.target.value })} placeholder="Découvrez notre solution…" required /></div>
                    <div className="form-group"><label>Contenu</label><textarea value={campaignForm.content} onChange={e => setCampaignForm({ ...campaignForm, content: e.target.value })} placeholder="Rédigez votre email ici (HTML supporté)…" rows={8} /></div>
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                      {loading ? <><span className="spinner" /> Création…</> : 'Créer la campagne'}
                    </button>
                  </form>
                </div>

                <div className="card">
                  <div className="card-title" style={{ marginBottom: 20 }}>Campagnes actives</div>
                  {campaigns.length === 0
                    ? <div className="empty"><strong>Aucune campagne</strong>Créez votre première séquence</div>
                    : campaigns.map((c, i) => (
                      <div key={i} className="list-item">
                        <div>
                          <div className="list-item-main">{c.title || c.name}</div>
                          <div className="list-item-sub">{c.campaign_type || 'manuel'} · {new Date(c.created_at).toLocaleDateString('fr-FR')}</div>
                        </div>
                        <span className={`badge ${c.status === 'active' ? 'badge-green' : 'badge-neutral'}`}>
                          {c.status === 'active' ? 'Actif' : 'Brouillon'}
                        </span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </>
          )}

          {/* ── Email Sender ── */}
          {activeTab === 'email-sender' && (
            <>
              <div className="page-header">
                <h2 className="page-title">Envoi d'emails</h2>
                <p className="page-subtitle">Contactez vos prospects directement</p>
              </div>
              <div className="two-col" style={{ alignItems: 'flex-start' }}>
                <div>
                  <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                      {selectedProspects.length > 0 ? `${selectedProspects.length} sélectionné${selectedProspects.length > 1 ? 's' : ''}` : 'Leads qualifiés'}
                    </span>
                  </div>
                  {conversations.filter(c => c.visitor_email || c.lead_email).length === 0
                    ? <div className="empty"><strong>Aucun lead</strong>Les leads avec email apparaîtront ici</div>
                    : conversations.filter(c => c.visitor_email || c.lead_email).map((c, i) => {
                      const email = c.visitor_email || c.lead_email;
                      const selected = selectedProspects.includes(email);
                      return (
                        <div key={i} className={`prospect-row ${selected ? 'selected' : ''}`} onClick={() => toggleProspect(email)}>
                          <div className={`prospect-check ${selected ? 'checked' : ''}`} />
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text)' }}>{email}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.qualification_reason || '—'}</div>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>

                <div className="card">
                  <div className="card-title" style={{ marginBottom: 20 }}>Composer</div>
                  {emailStatus?.success && <div className="alert alert-success">{emailStatus.sent} email{emailStatus.sent > 1 ? 's' : ''} envoyé{emailStatus.sent > 1 ? 's' : ''}</div>}
                  {emailStatus?.error && <div className="alert alert-error">{emailStatus.error}</div>}
                  <form onSubmit={handleSendEmail}>
                    <div className="form-grid" style={{ marginBottom: 16 }}>
                      <div><label>Expéditeur (nom)</label><input type="text" value={emailForm.senderName} onChange={e => setEmailForm({ ...emailForm, senderName: e.target.value })} required /></div>
                      <div><label>Expéditeur (email)</label><input type="email" value={emailForm.senderEmail} onChange={e => setEmailForm({ ...emailForm, senderEmail: e.target.value })} required /></div>
                    </div>
                    {selectedProspects.length === 0 && (
                      <div className="form-group">
                        <label>Destinataires (séparés par virgule)</label>
                        <input type="text" value={emailForm.recipients} onChange={e => setEmailForm({ ...emailForm, recipients: e.target.value })} placeholder="contact@exemple.com, autre@exemple.com" />
                      </div>
                    )}
                    <div className="form-group"><label>Sujet</label><input type="text" value={emailForm.subject} onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })} placeholder="Objet de votre message" required /></div>
                    <div className="form-group"><label>Message</label><textarea value={emailForm.content} onChange={e => setEmailForm({ ...emailForm, content: e.target.value })} placeholder="Rédigez votre message…" rows={7} required /></div>
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                      {loading ? <><span className="spinner" /> Envoi…</> : `Envoyer${selectedProspects.length > 0 ? ` à ${selectedProspects.length} destinataire${selectedProspects.length > 1 ? 's' : ''}` : ''}`}
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}

          {/* ── Scraper ── */}
          {activeTab === 'scraper' && (
            <>
              <div className="page-header">
                <h2 className="page-title">Scraper web</h2>
                <p className="page-subtitle">Extrayez des contacts depuis n'importe quel site</p>
              </div>
              <div className="card">
                {scraperStatus?.success && (
                  <div className="alert alert-success">{scraperStatus.count} email{scraperStatus.count > 1 ? 's' : ''} extrait{scraperStatus.count > 1 ? 's' : ''}</div>
                )}
                {scraperStatus?.error && <div className="alert alert-error">{scraperStatus.error}</div>}
                <form onSubmit={handleScrape}>
                  <div className="form-group"><label>URL du site *</label><input type="url" value={scraperForm.url} onChange={e => setScraperForm({ ...scraperForm, url: e.target.value })} placeholder="https://example.com/contact" required /></div>
                  <div className="form-group">
                    <label>Sélecteur CSS <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optionnel)</span></label>
                    <input type="text" value={scraperForm.selector} onChange={e => setScraperForm({ ...scraperForm, selector: e.target.value })} placeholder=".email, #contact-email…" />
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Sans sélecteur, tous les emails de la page sont extraits automatiquement</p>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? <><span className="spinner" /> Extraction…</> : 'Lancer l\'extraction'}
                  </button>
                </form>

                {scrapedEmails.length > 0 && (
                  <div style={{ marginTop: 28 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <span className="card-title">{scrapedEmails.length} email{scrapedEmails.length > 1 ? 's' : ''} trouvé{scrapedEmails.length > 1 ? 's' : ''}</span>
                      <button className="btn btn-secondary" onClick={() => setActiveTab('email-sender')}>
                        Envoyer un email à ces contacts
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                      {scrapedEmails.map((email, i) => (
                        <span key={i} className="email-pill">{email}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Workflows ── */}
          {activeTab === 'workflows' && (
            <>
              <div className="page-header">
                <h2 className="page-title">Workflows</h2>
                <p className="page-subtitle">Automatisez vos séquences de prospection</p>
              </div>
              <div className="two-col" style={{ alignItems: 'flex-start' }}>
                <div className="card">
                  <div className="card-title" style={{ marginBottom: 20 }}>Créer un workflow</div>
                  {workflowStatus?.success && <div className="alert alert-success">Workflow créé</div>}
                  <form onSubmit={handleCreateWorkflow}>
                    <div className="form-group"><label>Nom *</label><input type="text" value={workflowForm.name} onChange={e => setWorkflowForm({ ...workflowForm, name: e.target.value })} placeholder="Nurturing nouveaux leads" required /></div>
                    <div className="form-group">
                      <label>Déclencheur</label>
                      <select value={workflowForm.trigger} onChange={e => setWorkflowForm({ ...workflowForm, trigger: e.target.value })}>
                        {WORKFLOW_TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Actions</label>
                      <div className="action-btns">
                        {WORKFLOW_ACTIONS.map(a => (
                          <button key={a.type} type="button" className="action-btn" onClick={() => addAction(a.type)}>
                            + {a.label}
                          </button>
                        ))}
                      </div>
                      {workflowForm.actions.length === 0
                        ? <p style={{ fontSize: 12.5, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>Aucune action ajoutée</p>
                        : workflowForm.actions.map((a, i) => (
                          <div key={a.id} className="action-item">
                            <span>{i + 1}. {WORKFLOW_ACTIONS.find(wa => wa.type === a.type)?.label || a.type}</span>
                            <button type="button" onClick={() => removeAction(a.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}>×</button>
                          </div>
                        ))
                      }
                    </div>
                    <button type="submit" className="btn btn-primary btn-full" disabled={workflowForm.actions.length === 0}>
                      Créer le workflow
                    </button>
                  </form>
                </div>

                <div>
                  <div className="card-title" style={{ marginBottom: 14, fontSize: 13 }}>Workflows actifs</div>
                  {workflows.length === 0
                    ? <div className="empty"><strong>Aucun workflow</strong>Configurez votre première automatisation</div>
                    : workflows.map((w, i) => (
                      <div key={i} className="workflow-card">
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{w.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                            {WORKFLOW_TRIGGERS.find(t => t.value === w.trigger)?.label} · {w.actions.length} action{w.actions.length > 1 ? 's' : ''}
                          </div>
                        </div>
                        <span className="badge badge-green">Actif</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </>
          )}

        </main>
      </div>
    </>
  );
}
