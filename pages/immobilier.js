import { useState, useEffect } from 'react';
import Head from 'next/head';

// ─── Configuration ────────────────────────────────────────────────────────────

const SITES = [
  {
    id: 'bienici',
    label: "Bien'ici",
    sublabel: 'Annonces premium',
    apiRoute: '/api/scrapers/bienici',
    active: true,
  },
  {
    id: 'seloger',
    label: 'SeLoger',
    sublabel: 'Agences immobilières',
    apiRoute: '/api/scrapers/seloger',
    active: true,
  },
  {
    id: 'leboncoin',
    label: 'Le Bon Coin',
    sublabel: 'Particuliers & agences',
    apiRoute: '/api/scrapers/leboncoin',
    active: true,
  },
];

const PROPERTY_TYPES = [
  { value: 'all', label: 'Tous' },
  { value: 'maison', label: 'Maison' },
  { value: 'appartement', label: 'Appartement' },
  { value: 'terrain', label: 'Terrain' },
  { value: 'commercial', label: 'Local commercial' },
];

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Vue d\'ensemble' },
  { id: 'scraper', label: 'Recherche' },
  { id: 'biens', label: 'Annonces' },
  { id: 'acheteurs', label: 'Acheteurs' },
  { id: 'matches', label: 'Correspondances' },
  { id: 'email', label: 'Emails' },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ImmobilierDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [biens, setBiens] = useState([]);
  const [acheteurs, setAcheteurs] = useState([]);
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedProspects, setSelectedProspects] = useState([]);
  const [biensFilter, setBiensFilter] = useState({ type: 'all', search: '' });

  const [scraperForm, setScraperForm] = useState({
    siteId: null,
    location: '',
    propertyType: 'all',
    prixMin: '',
    prixMax: '',
    surfaceMin: '',
  });
  const [scrapingProgress, setScrapingProgress] = useState(null);

  const [emailForm, setEmailForm] = useState({
    subject: '',
    message: '',
    senderName: '',
    senderEmail: '',
  });
  const [emailStatus, setEmailStatus] = useState(null);

  // Acheteur form
  const [acheteurForm, setAcheteurForm] = useState({
    nom: '', prenom: '', email: '', telephone: '',
    budget_max: '', surface_min: '', surface_max: '',
    pieces_min: '', villes: '', type_bien: [],
  });
  const [acheteurStatus, setAcheteurStatus] = useState(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [biensRes, acheteursRes, matchesRes, statsRes] = await Promise.all([
        fetch('/api/immobilier/biens'),
        fetch('/api/immobilier/acheteurs'),
        fetch('/api/immobilier/matches'),
        fetch('/api/immobilier/stats'),
      ]);
      if (biensRes.ok) { const d = await biensRes.json(); setBiens(d.data || []); }
      if (acheteursRes.ok) { const d = await acheteursRes.json(); setAcheteurs(d.data || []); }
      if (matchesRes.ok) { const d = await matchesRes.json(); setMatches(d.data || []); }
      if (statsRes.ok) { const d = await statsRes.json(); setStats(d.data || null); }
    } catch (err) { console.error(err); }
  };

  // ── Scraper ────────────────────────────────────────────────────────────────

  const handleScrape = async () => {
    if (!scraperForm.siteId || !scraperForm.location.trim()) return;
    const site = SITES.find(s => s.id === scraperForm.siteId);
    setLoading(true);
    setScrapingProgress({ status: 'running', message: `Recherche sur ${site.label}…` });
    try {
      const params = new URLSearchParams({
        ville: scraperForm.location,
        type: scraperForm.propertyType === 'all' ? 'maison' : scraperForm.propertyType,
        ...(scraperForm.prixMin && { prixMin: scraperForm.prixMin }),
        ...(scraperForm.prixMax && { prixMax: scraperForm.prixMax }),
        ...(scraperForm.surfaceMin && { surfaceMin: scraperForm.surfaceMin }),
      });
      const res = await fetch(`${site.apiRoute}?${params}`);
      const data = await res.json();
      if (res.ok) {
        setScrapingProgress({
          status: 'done',
          count: data.stats?.annoncesTouvees || 0,
          nouvelles: data.stats?.nouvellesAnnonces || 0,
        });
        loadAll();
      } else {
        setScrapingProgress({ status: 'error', message: data.error || 'Erreur inconnue' });
      }
    } catch (err) {
      setScrapingProgress({ status: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const resetScraper = () => {
    setScrapingProgress(null);
    setScraperForm({ siteId: null, location: '', propertyType: 'all', prixMin: '', prixMax: '', surfaceMin: '' });
  };

  // ── Email ──────────────────────────────────────────────────────────────────

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (selectedProspects.length === 0) return;
    setLoading(true);
    setEmailStatus(null);
    try {
      const res = await fetch('/api/B2B/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: selectedProspects.map(email => ({ email })),
          subject: emailForm.subject,
          template: emailForm.message,
          senderName: emailForm.senderName,
          senderEmail: emailForm.senderEmail,
        }),
      });
      const data = await res.json();
      setEmailStatus(res.ok ? { success: true, sent: data.sent } : { success: false, error: data.error });
    } catch (err) {
      setEmailStatus({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // ── Acheteur ───────────────────────────────────────────────────────────────

  const handleAjouterAcheteur = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAcheteurStatus(null);
    try {
      const payload = {
        ...acheteurForm,
        villes: acheteurForm.villes ? acheteurForm.villes.split(',').map(v => v.trim()) : [],
        budget_max: acheteurForm.budget_max ? parseInt(acheteurForm.budget_max) : null,
        surface_min: acheteurForm.surface_min ? parseInt(acheteurForm.surface_min) : null,
        surface_max: acheteurForm.surface_max ? parseInt(acheteurForm.surface_max) : null,
        pieces_min: acheteurForm.pieces_min ? parseInt(acheteurForm.pieces_min) : null,
      };
      const res = await fetch('/api/immobilier/acheteurs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setAcheteurStatus({ success: true });
        setAcheteurForm({ nom: '', prenom: '', email: '', telephone: '', budget_max: '', surface_min: '', surface_max: '', pieces_min: '', villes: '', type_bien: [] });
        loadAll();
      } else {
        setAcheteurStatus({ success: false, error: data.error });
      }
    } catch (err) {
      setAcheteurStatus({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleMatchAuto = async () => {
    setLoading(true);
    try {
      await fetch('/api/immobilier/match-auto', { method: 'POST' });
      loadAll();
    } finally {
      setLoading(false);
    }
  };

  const toggleProspect = (email) => {
    setSelectedProspects(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const filteredBiens = biens.filter(b => {
    const matchType = biensFilter.type === 'all' || b.type === biensFilter.type;
    const matchSearch = !biensFilter.search ||
      b.titre?.toLowerCase().includes(biensFilter.search.toLowerCase()) ||
      b.ville?.toLowerCase().includes(biensFilter.search.toLowerCase());
    return matchType && matchSearch;
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Head>
        <title>Immo Dashboard</title>
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
          --accent: #d4a853;
          --accent-dim: rgba(212,168,83,0.12);
          --accent-border: rgba(212,168,83,0.3);
          --green: #3ecf8e;
          --green-dim: rgba(62,207,142,0.1);
          --red: #f04444;
          --red-dim: rgba(240,68,68,0.1);
          --blue: #5b8dee;
          --blue-dim: rgba(91,141,238,0.1);
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a30; border-radius: 2px; }

        .layout { display: flex; min-height: 100vh; }

        /* Sidebar */
        .sidebar {
          width: 220px;
          flex-shrink: 0;
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
        }
        .sidebar-logo {
          padding: 28px 20px 20px;
          border-bottom: 1px solid var(--border);
        }
        .sidebar-logo h1 {
          font-family: 'DM Serif Display', serif;
          font-size: 18px;
          color: var(--accent);
          letter-spacing: -0.3px;
        }
        .sidebar-logo p {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 3px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .sidebar-nav { padding: 16px 12px; flex: 1; }
        .nav-item {
          display: flex;
          align-items: center;
          padding: 9px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13.5px;
          font-weight: 400;
          color: var(--text-muted);
          transition: all 0.15s;
          margin-bottom: 2px;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
        }
        .nav-item:hover { color: var(--text); background: var(--surface2); }
        .nav-item.active { color: var(--accent); background: var(--accent-dim); font-weight: 500; }
        .nav-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: currentColor;
          margin-right: 10px;
          opacity: 0.5;
        }
        .nav-item.active .nav-dot { opacity: 1; }

        /* Main */
        .main {
          flex: 1;
          overflow-y: auto;
          padding: 40px 48px;
          max-width: 1100px;
        }
        .page-header {
          margin-bottom: 36px;
        }
        .page-title {
          font-family: 'DM Serif Display', serif;
          font-size: 26px;
          font-weight: 400;
          color: var(--text);
          letter-spacing: -0.5px;
        }
        .page-subtitle {
          font-size: 13.5px;
          color: var(--text-muted);
          margin-top: 6px;
        }

        /* Stats grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 36px;
        }
        .stat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 22px 20px;
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .stat-card:hover { border-color: var(--border-hover); }
        .stat-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--text-muted);
          font-weight: 500;
        }
        .stat-value {
          font-size: 30px;
          font-family: 'DM Serif Display', serif;
          color: var(--text);
          margin-top: 8px;
          letter-spacing: -1px;
        }
        .stat-sub {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        /* Cards */
        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 28px;
          margin-bottom: 20px;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .card-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--text);
        }
        .card-link {
          font-size: 12px;
          color: var(--accent);
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
        }
        .card-link:hover { opacity: 0.8; }

        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

        /* List items */
        .list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
        }
        .list-item:last-child { border-bottom: none; }
        .list-item-main { font-size: 13.5px; color: var(--text); font-weight: 500; }
        .list-item-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
        .list-item-right { text-align: right; font-size: 13px; color: var(--text); font-weight: 500; }
        .list-item-right small { display: block; font-size: 11px; color: var(--text-muted); font-weight: 400; }

        /* Badge */
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.2px;
        }
        .badge-blue { background: var(--blue-dim); color: var(--blue); }
        .badge-green { background: var(--green-dim); color: var(--green); }
        .badge-gold { background: var(--accent-dim); color: var(--accent); }
        .badge-neutral { background: var(--surface2); color: var(--text-muted); }

        /* Score bar */
        .score-bar { height: 3px; background: var(--surface2); border-radius: 2px; margin-top: 6px; }
        .score-fill { height: 100%; border-radius: 2px; background: var(--accent); transition: width 0.4s; }

        /* Forms */
        label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 7px;
        }
        input[type="text"], input[type="email"], input[type="number"], input[type="tel"], select, textarea {
          width: 100%;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 10px 13px;
          font-size: 13.5px;
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.15s;
        }
        input:focus, select:focus, textarea:focus { border-color: var(--accent-border); }
        input::placeholder, textarea::placeholder { color: var(--text-muted); }
        select option { background: #1f1f24; }
        textarea { resize: vertical; line-height: 1.6; }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .form-group { margin-bottom: 16px; }

        /* Buttons */
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          border: none;
          transition: all 0.15s;
        }
        .btn-primary {
          background: var(--accent);
          color: #0f0f11;
        }
        .btn-primary:hover { opacity: 0.9; }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-secondary {
          background: var(--surface2);
          color: var(--text-dim);
          border: 1px solid var(--border);
        }
        .btn-secondary:hover { border-color: var(--border-hover); color: var(--text); }
        .btn-ghost {
          background: transparent;
          color: var(--text-muted);
          border: 1px solid var(--border);
        }
        .btn-ghost:hover { color: var(--text); border-color: var(--border-hover); }
        .btn-full { width: 100%; }

        /* Site selector */
        .site-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .site-card {
          padding: 18px 16px;
          border-radius: 10px;
          border: 1.5px solid var(--border);
          background: var(--surface2);
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
        }
        .site-card:hover { border-color: var(--border-hover); }
        .site-card.selected { border-color: var(--accent); background: var(--accent-dim); }
        .site-name { font-size: 14px; font-weight: 600; color: var(--text); }
        .site-sub { font-size: 12px; color: var(--text-muted); margin-top: 3px; }
        .site-check {
          display: inline-block;
          margin-top: 10px;
          font-size: 11px;
          color: var(--accent);
          font-weight: 500;
        }

        /* Step label */
        .step-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--text-muted);
          font-weight: 600;
          margin-bottom: 14px;
        }
        .step-block { margin-bottom: 28px; }

        /* Progress */
        .progress-box {
          padding: 20px 22px;
          border-radius: 10px;
          border: 1px solid;
          margin-bottom: 24px;
        }
        .progress-running { border-color: var(--blue); background: var(--blue-dim); }
        .progress-done { border-color: var(--green); background: var(--green-dim); }
        .progress-error { border-color: var(--red); background: var(--red-dim); }
        .progress-title { font-size: 14px; font-weight: 600; }
        .progress-sub { font-size: 13px; color: var(--text-dim); margin-top: 5px; }

        /* Spinner */
        .spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Bien card */
        .bien-card {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 12px;
          transition: border-color 0.15s;
        }
        .bien-card:hover { border-color: var(--border-hover); }
        .bien-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .bien-title { font-size: 14px; font-weight: 500; color: var(--text); margin-bottom: 6px; }
        .bien-meta { font-size: 12.5px; color: var(--text-muted); }
        .bien-price { font-family: 'DM Serif Display', serif; font-size: 20px; color: var(--text); text-align: right; }
        .bien-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }

        /* Match card */
        .match-card {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 18px 20px;
          margin-bottom: 10px;
        }
        .match-top { display: flex; justify-content: space-between; align-items: center; }
        .match-score {
          font-family: 'DM Serif Display', serif;
          font-size: 22px;
          color: var(--accent);
        }

        /* Acheteur card */
        .acheteur-card {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 18px 20px;
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        /* Prospect row */
        .prospect-row {
          display: flex;
          align-items: center;
          padding: 12px 14px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--surface2);
          margin-bottom: 8px;
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .prospect-row:hover { border-color: var(--border-hover); }
        .prospect-row.selected { border-color: var(--accent-border); background: var(--accent-dim); }
        .prospect-check {
          width: 16px; height: 16px;
          border-radius: 4px;
          border: 1.5px solid var(--border);
          margin-right: 12px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .prospect-check.checked { background: var(--accent); border-color: var(--accent); }
        .prospect-check.checked::after {
          content: '';
          width: 8px; height: 5px;
          border-left: 2px solid #0f0f11;
          border-bottom: 2px solid #0f0f11;
          transform: rotate(-45deg) translate(1px, -1px);
        }

        /* Alert */
        .alert {
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 20px;
          border: 1px solid;
        }
        .alert-success { background: var(--green-dim); border-color: var(--green); color: var(--green); }
        .alert-error { background: var(--red-dim); border-color: var(--red); color: var(--red); }
        .alert-warning { background: var(--accent-dim); border-color: var(--accent-border); color: var(--accent); }

        /* Empty state */
        .empty {
          text-align: center;
          padding: 48px 20px;
          color: var(--text-muted);
          font-size: 13.5px;
        }
        .empty strong { display: block; font-size: 15px; color: var(--text-dim); margin-bottom: 8px; }

        /* Filter row */
        .filter-row {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }
        .filter-row input { flex: 1; }
        .filter-row select { width: 160px; }

        /* Sticky bottom bar */
        .selection-bar {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--surface);
          border: 1px solid var(--border-hover);
          border-radius: 10px;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          z-index: 100;
        }
        .selection-bar p { font-size: 13px; color: var(--text-dim); }
        .selection-bar strong { color: var(--text); }

        .divider {
          border: none;
          border-top: 1px solid var(--border);
          margin: 24px 0;
        }

        @media (max-width: 900px) {
          .sidebar { display: none; }
          .main { padding: 24px 20px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .two-col { grid-template-columns: 1fr; }
          .form-grid { grid-template-columns: 1fr; }
          .form-grid-4 { grid-template-columns: 1fr 1fr; }
          .site-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <h1>Immo Pro</h1>
            <p>Tableau de bord</p>
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
        </aside>

        {/* Main */}
        <main className="main">

          {/* ── Dashboard ── */}
          {activeTab === 'dashboard' && (
            <>
              <div className="page-header">
                <h2 className="page-title">Vue d'ensemble</h2>
                <p className="page-subtitle">Activité du portefeuille en temps réel</p>
              </div>

              <div className="stats-grid">
                <div className="stat-card" onClick={() => setActiveTab('biens')}>
                  <div className="stat-label">Annonces</div>
                  <div className="stat-value">{stats?.totalBiens ?? biens.length}</div>
                  <div className="stat-sub">biens dans la base</div>
                </div>
                <div className="stat-card" onClick={() => setActiveTab('acheteurs')}>
                  <div className="stat-label">Acheteurs</div>
                  <div className="stat-value">{stats?.totalAcheteurs ?? acheteurs.length}</div>
                  <div className="stat-sub">profils actifs</div>
                </div>
                <div className="stat-card" onClick={() => setActiveTab('matches')}>
                  <div className="stat-label">Correspondances</div>
                  <div className="stat-value">{stats?.totalMatches ?? matches.length}</div>
                  <div className="stat-sub">matchs trouvés</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Prix moyen</div>
                  <div className="stat-value">
                    {stats?.prixMoyen
                      ? (stats.prixMoyen / 1000).toFixed(0) + 'k'
                      : '—'}
                  </div>
                  <div className="stat-sub">euros sur le marché</div>
                </div>
              </div>

              <div className="two-col">
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Dernières annonces</span>
                    <button className="card-link" onClick={() => setActiveTab('biens')}>Voir tout</button>
                  </div>
                  {biens.length === 0
                    ? <div className="empty"><strong>Aucune annonce</strong>Lancez un scraping pour commencer</div>
                    : biens.slice(0, 5).map((bien, i) => (
                      <div key={i} className="list-item">
                        <div>
                          <div className="list-item-main">{bien.titre?.slice(0, 40) || 'Sans titre'}</div>
                          <div className="list-item-sub">{bien.ville} · {bien.type}</div>
                        </div>
                        <div className="list-item-right">
                          {bien.prix ? bien.prix.toLocaleString('fr-FR') + ' €' : 'NC'}
                          <small>{new Date(bien.created_at).toLocaleDateString('fr-FR')}</small>
                        </div>
                      </div>
                    ))
                  }
                </div>

                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Meilleures correspondances</span>
                    <button className="card-link" onClick={() => setActiveTab('matches')}>Voir tout</button>
                  </div>
                  {matches.length === 0
                    ? <div className="empty"><strong>Aucun match</strong>Ajoutez des acheteurs et lancez le matching</div>
                    : matches.slice(0, 5).map((m, i) => (
                      <div key={i} className="list-item">
                        <div>
                          <div className="list-item-main">{m.acheteur_nom || 'Acheteur'}</div>
                          <div className="list-item-sub">{m.bien_adresse || m.bien_reference}</div>
                        </div>
                        <div className="list-item-right">
                          <span className="badge badge-gold">{m.score}%</span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </>
          )}

          {/* ── Scraper ── */}
          {activeTab === 'scraper' && (
            <>
              <div className="page-header">
                <h2 className="page-title">Recherche d'annonces</h2>
                <p className="page-subtitle">Sélectionnez une source et définissez vos critères</p>
              </div>

              {scrapingProgress && (
                <div className={`progress-box ${scrapingProgress.status === 'running' ? 'progress-running' : scrapingProgress.status === 'done' ? 'progress-done' : 'progress-error'}`}>
                  {scrapingProgress.status === 'running' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="spinner" />
                      <span className="progress-title" style={{ color: 'var(--blue)' }}>{scrapingProgress.message}</span>
                    </div>
                  )}
                  {scrapingProgress.status === 'done' && (
                    <div>
                      <div className="progress-title" style={{ color: 'var(--green)' }}>Recherche terminée</div>
                      <div className="progress-sub">
                        {scrapingProgress.count} annonces trouvées · {scrapingProgress.nouvelles} nouvelles ajoutées
                      </div>
                      <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={resetScraper}>Nouvelle recherche</button>
                    </div>
                  )}
                  {scrapingProgress.status === 'error' && (
                    <div>
                      <div className="progress-title" style={{ color: 'var(--red)' }}>Erreur</div>
                      <div className="progress-sub">{scrapingProgress.message}</div>
                      <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={resetScraper}>Réessayer</button>
                    </div>
                  )}
                </div>
              )}

              {!scrapingProgress && (
                <div className="card">
                  <div className="step-block">
                    <div className="step-label">1 — Source</div>
                    <div className="site-grid">
                      {SITES.map(site => (
                        <div
                          key={site.id}
                          className={`site-card ${scraperForm.siteId === site.id ? 'selected' : ''}`}
                          onClick={() => setScraperForm({ ...scraperForm, siteId: site.id })}
                        >
                          <div className="site-name">{site.label}</div>
                          <div className="site-sub">{site.sublabel}</div>
                          {scraperForm.siteId === site.id && <span className="site-check">Sélectionné</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="step-block">
                    <div className="step-label">2 — Localisation</div>
                    <input
                      type="text"
                      value={scraperForm.location}
                      onChange={e => setScraperForm({ ...scraperForm, location: e.target.value })}
                      placeholder="Paris, Lyon, Nantes…"
                    />
                  </div>

                  <div className="step-block">
                    <div className="step-label">3 — Filtres optionnels</div>
                    <div className="form-grid-4">
                      <div>
                        <label>Type</label>
                        <select value={scraperForm.propertyType} onChange={e => setScraperForm({ ...scraperForm, propertyType: e.target.value })}>
                          {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label>Prix min (€)</label>
                        <input type="number" value={scraperForm.prixMin} onChange={e => setScraperForm({ ...scraperForm, prixMin: e.target.value })} placeholder="100 000" />
                      </div>
                      <div>
                        <label>Prix max (€)</label>
                        <input type="number" value={scraperForm.prixMax} onChange={e => setScraperForm({ ...scraperForm, prixMax: e.target.value })} placeholder="500 000" />
                      </div>
                      <div>
                        <label>Surface min (m²)</label>
                        <input type="number" value={scraperForm.surfaceMin} onChange={e => setScraperForm({ ...scraperForm, surfaceMin: e.target.value })} placeholder="50" />
                      </div>
                    </div>
                  </div>

                  <button
                    className="btn btn-primary btn-full"
                    onClick={handleScrape}
                    disabled={loading || !scraperForm.siteId || !scraperForm.location.trim()}
                  >
                    {loading ? <><span className="spinner" style={{ borderTopColor: '#0f0f11', borderColor: 'rgba(0,0,0,0.2)' }} /> Recherche en cours…</> : 'Lancer la recherche'}
                  </button>
                  {(!scraperForm.siteId || !scraperForm.location.trim()) && (
                    <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
                      {!scraperForm.siteId ? 'Sélectionnez une source pour continuer' : 'Entrez une ville pour continuer'}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── Annonces ── */}
          {activeTab === 'biens' && (
            <>
              <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <h2 className="page-title">Annonces</h2>
                  <p className="page-subtitle">{biens.length} bien{biens.length > 1 ? 's' : ''} dans la base</p>
                </div>
                <button className="btn btn-secondary" onClick={() => setActiveTab('scraper')}>Nouvelle recherche</button>
              </div>

              <div className="filter-row">
                <input
                  type="text"
                  placeholder="Rechercher par ville, titre…"
                  value={biensFilter.search}
                  onChange={e => setBiensFilter({ ...biensFilter, search: e.target.value })}
                />
                <select value={biensFilter.type} onChange={e => setBiensFilter({ ...biensFilter, type: e.target.value })}>
                  {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {filteredBiens.length === 0
                ? <div className="empty"><strong>Aucune annonce</strong>Utilisez la recherche pour importer des biens</div>
                : filteredBiens.map((bien, i) => (
                  <div key={i} className="bien-card">
                    <div className="bien-top">
                      <div style={{ flex: 1 }}>
                        <div className="bien-title">{bien.titre || 'Sans titre'}</div>
                        <div className="bien-meta">{bien.ville || bien.adresse || 'Localisation inconnue'}</div>
                        {bien.description && (
                          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
                            {bien.description.slice(0, 140)}{bien.description.length > 140 ? '…' : ''}
                          </div>
                        )}
                        <div className="bien-tags">
                          <span className="badge badge-blue">{bien.type || 'autre'}</span>
                          <span className="badge badge-neutral">{bien.source || 'import'}</span>
                          {bien.surface && <span className="badge badge-neutral">{bien.surface} m²</span>}
                          {bien.pieces && <span className="badge badge-neutral">{bien.pieces} pièces</span>}
                        </div>
                      </div>
                      <div style={{ marginLeft: 20, textAlign: 'right', flexShrink: 0 }}>
                        <div className="bien-price">{bien.prix ? bien.prix.toLocaleString('fr-FR') + ' €' : '—'}</div>
                        {bien.lien && (
                          <a href={bien.lien} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', marginTop: 8, display: 'inline-block' }}>
                            Voir l'annonce
                          </a>
                        )}
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                          {new Date(bien.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              }
            </>
          )}

          {/* ── Acheteurs ── */}
          {activeTab === 'acheteurs' && (
            <>
              <div className="page-header">
                <h2 className="page-title">Acheteurs</h2>
                <p className="page-subtitle">{acheteurs.length} profil{acheteurs.length > 1 ? 's' : ''} enregistré{acheteurs.length > 1 ? 's' : ''}</p>
              </div>

              <div className="two-col">
                <div>
                  {acheteurs.length === 0
                    ? <div className="empty"><strong>Aucun acheteur</strong>Ajoutez votre premier profil ci-contre</div>
                    : acheteurs.map((a, i) => (
                      <div key={i} className="acheteur-card">
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{a.nom} {a.prenom}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{a.email}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                            Budget : {a.budget_max ? a.budget_max.toLocaleString('fr-FR') + ' €' : '—'}
                            {a.villes?.length ? ' · ' + (Array.isArray(a.villes) ? a.villes.join(', ') : a.villes) : ''}
                          </div>
                        </div>
                        <span className={`badge ${a.statut === 'actif' ? 'badge-green' : 'badge-neutral'}`}>{a.statut}</span>
                      </div>
                    ))
                  }
                </div>

                <div className="card">
                  <div className="card-title" style={{ marginBottom: 20 }}>Ajouter un acheteur</div>
                  {acheteurStatus?.success && <div className="alert alert-success">Acheteur ajouté avec succès</div>}
                  {acheteurStatus?.error && <div className="alert alert-error">{acheteurStatus.error}</div>}
                  <form onSubmit={handleAjouterAcheteur}>
                    <div className="form-grid" style={{ marginBottom: 16 }}>
                      <div><label>Nom *</label><input type="text" value={acheteurForm.nom} onChange={e => setAcheteurForm({ ...acheteurForm, nom: e.target.value })} required /></div>
                      <div><label>Prénom</label><input type="text" value={acheteurForm.prenom} onChange={e => setAcheteurForm({ ...acheteurForm, prenom: e.target.value })} /></div>
                    </div>
                    <div className="form-group"><label>Email *</label><input type="email" value={acheteurForm.email} onChange={e => setAcheteurForm({ ...acheteurForm, email: e.target.value })} required /></div>
                    <div className="form-group"><label>Téléphone</label><input type="tel" value={acheteurForm.telephone} onChange={e => setAcheteurForm({ ...acheteurForm, telephone: e.target.value })} /></div>
                    <div className="form-group"><label>Budget max (€)</label><input type="number" value={acheteurForm.budget_max} onChange={e => setAcheteurForm({ ...acheteurForm, budget_max: e.target.value })} /></div>
                    <div className="form-grid" style={{ marginBottom: 16 }}>
                      <div><label>Surface min (m²)</label><input type="number" value={acheteurForm.surface_min} onChange={e => setAcheteurForm({ ...acheteurForm, surface_min: e.target.value })} /></div>
                      <div><label>Pièces min</label><input type="number" value={acheteurForm.pieces_min} onChange={e => setAcheteurForm({ ...acheteurForm, pieces_min: e.target.value })} /></div>
                    </div>
                    <div className="form-group"><label>Villes recherchées (séparées par virgule)</label><input type="text" value={acheteurForm.villes} onChange={e => setAcheteurForm({ ...acheteurForm, villes: e.target.value })} placeholder="Paris, Lyon, Nantes" /></div>
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                      {loading ? <><span className="spinner" style={{ borderTopColor: '#0f0f11', borderColor: 'rgba(0,0,0,0.2)' }} /> Enregistrement…</> : 'Ajouter l\'acheteur'}
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}

          {/* ── Matches ── */}
          {activeTab === 'matches' && (
            <>
              <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <h2 className="page-title">Correspondances</h2>
                  <p className="page-subtitle">{matches.length} match{matches.length > 1 ? 's' : ''} trouvé{matches.length > 1 ? 's' : ''}</p>
                </div>
                <button className="btn btn-primary" onClick={handleMatchAuto} disabled={loading}>
                  {loading ? <><span className="spinner" style={{ borderTopColor: '#0f0f11', borderColor: 'rgba(0,0,0,0.2)' }} /> Calcul…</> : 'Recalculer les matchs'}
                </button>
              </div>

              {matches.length === 0
                ? <div className="empty"><strong>Aucune correspondance</strong>Ajoutez des acheteurs et cliquez sur "Recalculer les matchs"</div>
                : matches.map((m, i) => (
                  <div key={i} className="match-card">
                    <div className="match-top">
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{m.acheteur_nom}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                          {m.bien_reference} · {m.bien_adresse}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>
                          {m.bien_prix ? m.bien_prix.toLocaleString('fr-FR') + ' €' : '—'}
                          {m.bien_type && <span className="badge badge-neutral" style={{ marginLeft: 8 }}>{m.bien_type}</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="match-score">{m.score}%</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>compatibilité</div>
                      </div>
                    </div>
                    <div className="score-bar" style={{ marginTop: 14 }}>
                      <div className="score-fill" style={{ width: `${m.score}%` }} />
                    </div>
                  </div>
                ))
              }
            </>
          )}

          {/* ── Email ── */}
          {activeTab === 'email' && (
            <>
              <div className="page-header">
                <h2 className="page-title">Envoi d'emails</h2>
                <p className="page-subtitle">Sélectionnez des destinataires et rédigez votre message</p>
              </div>

              <div className="two-col" style={{ alignItems: 'flex-start' }}>
                <div>
                  <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                      {selectedProspects.length > 0 ? `${selectedProspects.length} sélectionné${selectedProspects.length > 1 ? 's' : ''}` : 'Sélectionnez des destinataires'}
                    </span>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '6px 12px', fontSize: 12 }}
                      onClick={() => {
                        const emails = acheteurs.filter(a => a.email).map(a => a.email);
                        setSelectedProspects(selectedProspects.length === emails.length ? [] : emails);
                      }}
                    >
                      {selectedProspects.length === acheteurs.filter(a => a.email).length ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </button>
                  </div>
                  {acheteurs.length === 0
                    ? <div className="empty"><strong>Aucun acheteur</strong>Ajoutez d'abord des profils</div>
                    : acheteurs.filter(a => a.email).map((a, i) => {
                      const selected = selectedProspects.includes(a.email);
                      return (
                        <div key={i} className={`prospect-row ${selected ? 'selected' : ''}`} onClick={() => toggleProspect(a.email)}>
                          <div className={`prospect-check ${selected ? 'checked' : ''}`} />
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text)' }}>{a.nom} {a.prenom}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.email}</div>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>

                <div className="card">
                  <div className="card-title" style={{ marginBottom: 20 }}>Composer l'email</div>
                  {emailStatus?.success && <div className="alert alert-success">{emailStatus.sent} email{emailStatus.sent > 1 ? 's' : ''} envoyé{emailStatus.sent > 1 ? 's' : ''}</div>}
                  {emailStatus?.error && <div className="alert alert-error">{emailStatus.error}</div>}
                  {selectedProspects.length === 0 && <div className="alert alert-warning">Sélectionnez au moins un destinataire</div>}
                  <form onSubmit={handleSendEmail}>
                    <div className="form-grid" style={{ marginBottom: 16 }}>
                      <div><label>Nom expéditeur</label><input type="text" value={emailForm.senderName} onChange={e => setEmailForm({ ...emailForm, senderName: e.target.value })} required /></div>
                      <div><label>Email expéditeur</label><input type="email" value={emailForm.senderEmail} onChange={e => setEmailForm({ ...emailForm, senderEmail: e.target.value })} required /></div>
                    </div>
                    <div className="form-group"><label>Sujet</label><input type="text" value={emailForm.subject} onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })} placeholder="Objet de votre message" required /></div>
                    <div className="form-group">
                      <label>Message</label>
                      <textarea value={emailForm.message} onChange={e => setEmailForm({ ...emailForm, message: e.target.value })} placeholder="Rédigez votre message ici…" rows={8} required />
                    </div>
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading || selectedProspects.length === 0}>
                      {loading
                        ? <><span className="spinner" style={{ borderTopColor: '#0f0f11', borderColor: 'rgba(0,0,0,0.2)' }} /> Envoi…</>
                        : `Envoyer à ${selectedProspects.length} destinataire${selectedProspects.length > 1 ? 's' : ''}`
                      }
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}

        </main>
      </div>
    </>
  );
}
