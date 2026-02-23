// pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
    title: 'Scraping automatique',
    desc: 'LeBonCoin, SeLoger et BienIci sont scrapés en temps réel. Vos annonces arrivent sans que vous ayez à chercher.',
    tag: 'Collecte',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    ),
    title: 'Matching intelligent',
    desc: 'Chaque bien est comparé à chaque acheteur. Un score de compatibilité est calculé selon le budget, la surface et la localisation.',
    tag: 'Analyse',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,12 2,6"/>
      </svg>
    ),
    title: 'Alertes automatiques',
    desc: 'Dès qu\'un bien correspond à plus de 60% aux critères d\'un acheteur, un email personnalisé lui est envoyé via Brevo.',
    tag: 'Notification',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Gestion des acheteurs',
    desc: 'Créez des profils détaillés avec critères, budget et préférences. Retrouvez en un clic toutes les correspondances et l\'historique emails.',
    tag: 'CRM',
  },
];

const BENEFITS = [
  { num: '3×', label: 'plus de mises en relation', sub: 'vs prospection manuelle' },
  { num: '−80%', label: 'de temps sur la veille', sub: 'scraping automatisé 24/7' },
  { num: '100%', label: 'des acheteurs notifiés', sub: 'dès la nouvelle annonce' },
];

const STEPS = [
  { n: '01', title: 'Ajoutez vos acheteurs', desc: 'Renseignez leurs critères : budget, localisation, surface, type de bien.' },
  { n: '02', title: 'Lancez le scraping', desc: 'L\'outil collecte les annonces sur les principales plateformes en quelques secondes.' },
  { n: '03', title: 'Le matching se fait seul', desc: 'Un score de compatibilité est calculé pour chaque paire bien / acheteur.' },
  { n: '04', title: 'Vos clients reçoivent les biens', desc: 'Les alertes email partent automatiquement. Vous n\'avez plus qu\'à conclure.' },
];

export default function IndexPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 80);
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <Head>
        <title>ProspectBot — Prospection immobilière automatisée</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Scraping, matching et emails automatisés pour agents immobiliers. Trouvez le bon bien pour le bon acheteur, automatiquement." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'DM Sans', sans-serif; background: #0a0a0c; color: #e2e2e2; min-height: 100vh; overflow-x: hidden; }

        :root {
          --bg: #0a0a0c;
          --surface: #131316;
          --surface2: #1c1c21;
          --border: rgba(255,255,255,0.06);
          --border-h: rgba(255,255,255,0.12);
          --text: #e2e2e2;
          --muted: #64646e;
          --dim: #9898a6;
          --gold: #c9a96e;
          --gold-dim: rgba(201,169,110,0.1);
          --gold-border: rgba(201,169,110,0.25);
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #2a2a32; border-radius: 2px; }

        /* NAV */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 48px; height: 64px;
          transition: background 0.3s, border-color 0.3s;
          border-bottom: 1px solid transparent;
        }
        .nav.scrolled {
          background: rgba(10,10,12,0.92);
          border-bottom-color: var(--border);
          backdrop-filter: blur(12px);
        }
        .nav-logo {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none;
        }
        .nav-logo-mark {
          width: 32px; height: 32px;
          background: var(--surface2);
          border: 1px solid var(--border-h);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
        }
        .nav-logo-dot {
          width: 10px; height: 10px; border-radius: 50%;
          background: conic-gradient(var(--gold), rgba(201,169,110,0.3));
        }
        .nav-logo-name {
          font-family: 'DM Serif Display', serif;
          font-size: 15px; color: var(--text); letter-spacing: 0.3px;
        }
        .nav-cta {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 18px;
          background: var(--gold);
          color: #0a0a0c;
          border: none; border-radius: 8px;
          font-size: 13px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer; text-decoration: none;
          transition: opacity 0.15s;
        }
        .nav-cta:hover { opacity: 0.88; }

        /* HERO */
        .hero {
          min-height: 100vh;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center;
          padding: 120px 24px 80px;
          position: relative;
          overflow: hidden;
        }

        /* Grille de fond */
        .hero::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%);
        }

        /* Halo doré */
        .hero::after {
          content: '';
          position: absolute;
          top: 30%; left: 50%;
          transform: translate(-50%, -50%);
          width: 600px; height: 400px;
          background: radial-gradient(ellipse, rgba(201,169,110,0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        .hero-inner {
          position: relative; z-index: 1;
          max-width: 760px;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .hero-inner.visible { opacity: 1; transform: translateY(0); }

        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 5px 14px;
          background: var(--gold-dim);
          border: 1px solid var(--gold-border);
          border-radius: 20px;
          font-size: 12px; color: var(--gold); font-weight: 500;
          margin-bottom: 28px;
          letter-spacing: 0.3px;
        }
        .hero-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

        .hero-title {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(40px, 6vw, 68px);
          line-height: 1.08;
          letter-spacing: -2px;
          color: var(--text);
          margin-bottom: 24px;
        }
        .hero-title em {
          font-style: italic;
          color: var(--gold);
        }

        .hero-sub {
          font-size: 17px;
          color: var(--dim);
          line-height: 1.65;
          max-width: 520px;
          margin: 0 auto 40px;
          font-weight: 300;
        }

        .hero-actions {
          display: flex; align-items: center; justify-content: center; gap: 14px;
          flex-wrap: wrap;
        }
        .btn-primary-hero {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 28px;
          background: var(--gold);
          color: #0a0a0c;
          border: none; border-radius: 10px;
          font-size: 14.5px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer; text-decoration: none;
          transition: opacity 0.15s, transform 0.15s;
          letter-spacing: 0.2px;
        }
        .btn-primary-hero:hover { opacity: 0.9; transform: translateY(-2px); }

        .btn-ghost-hero {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 24px;
          background: transparent;
          color: var(--dim);
          border: 1px solid var(--border-h);
          border-radius: 10px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer; text-decoration: none;
          transition: color 0.15s, border-color 0.15s;
        }
        .btn-ghost-hero:hover { color: var(--text); border-color: var(--border-h); }

        /* Scroll indicator */
        .scroll-hint {
          position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          color: var(--muted); font-size: 11px; letter-spacing: 1px; text-transform: uppercase;
          animation: fadeInUp 1s ease 1s both;
        }
        .scroll-arrow { animation: bounce 2s infinite; }
        @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(5px); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        /* SECTION BASE */
        .section { padding: 100px 48px; max-width: 1140px; margin: 0 auto; }
        .section-label {
          font-size: 11px; font-weight: 600; letter-spacing: 2px;
          text-transform: uppercase; color: var(--gold); margin-bottom: 14px;
        }
        .section-title {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(28px, 3.5vw, 42px);
          letter-spacing: -1px; color: var(--text);
          line-height: 1.15; margin-bottom: 16px;
        }
        .section-title em { font-style: italic; color: var(--dim); }
        .section-sub {
          font-size: 15px; color: var(--dim); line-height: 1.65;
          max-width: 500px; font-weight: 300;
        }

        /* FEATURES */
        .features-header { margin-bottom: 56px; }
        .features-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .feature-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 32px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s, transform 0.2s;
        }
        .feature-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,169,110,0.3), transparent);
          opacity: 0; transition: opacity 0.3s;
        }
        .feature-card:hover { border-color: var(--border-h); transform: translateY(-2px); }
        .feature-card:hover::before { opacity: 1; }

        .feature-tag {
          display: inline-block;
          padding: 3px 10px;
          background: var(--gold-dim);
          border: 1px solid var(--gold-border);
          border-radius: 4px;
          font-size: 10px; font-weight: 600; color: var(--gold);
          letter-spacing: 0.8px; text-transform: uppercase;
          margin-bottom: 20px;
        }
        .feature-icon {
          width: 44px; height: 44px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: var(--gold); margin-bottom: 18px;
        }
        .feature-title {
          font-family: 'DM Serif Display', serif;
          font-size: 20px; color: var(--text);
          font-weight: 400; margin-bottom: 10px;
        }
        .feature-desc {
          font-size: 14px; color: var(--dim);
          line-height: 1.65; font-weight: 300;
        }

        /* BENEFITS */
        .benefits-section {
          padding: 0 48px 100px;
          max-width: 1140px; margin: 0 auto;
        }
        .benefits-inner {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 64px;
          position: relative; overflow: hidden;
        }
        .benefits-inner::after {
          content: '';
          position: absolute; top: 0; right: 0;
          width: 400px; height: 400px;
          background: radial-gradient(circle at top right, rgba(201,169,110,0.05), transparent 60%);
          pointer-events: none;
        }
        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 48px;
          margin-top: 48px;
        }
        .benefit-item { position: relative; z-index: 1; }
        .benefit-num {
          font-family: 'DM Serif Display', serif;
          font-size: 52px; color: var(--gold);
          letter-spacing: -2px; line-height: 1;
          margin-bottom: 10px;
        }
        .benefit-label {
          font-size: 15px; font-weight: 500; color: var(--text);
          margin-bottom: 4px;
        }
        .benefit-sub { font-size: 13px; color: var(--muted); }

        /* HOW IT WORKS */
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2px;
          margin-top: 56px;
          position: relative;
        }
        .steps-grid::before {
          content: '';
          position: absolute;
          top: 28px; left: 10%; right: 10%;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--border-h), var(--gold-border), var(--border-h), transparent);
        }
        .step-item { padding: 0 20px; position: relative; }
        .step-num {
          width: 56px; height: 56px;
          background: var(--surface2);
          border: 1px solid var(--gold-border);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-family: 'DM Serif Display', serif;
          font-size: 16px; color: var(--gold);
          margin-bottom: 20px;
          position: relative; z-index: 1;
          background: var(--bg);
        }
        .step-title {
          font-size: 14px; font-weight: 600; color: var(--text);
          margin-bottom: 8px;
        }
        .step-desc { font-size: 13px; color: var(--dim); line-height: 1.6; font-weight: 300; }

        /* CTA FINAL */
        .cta-section {
          padding: 0 48px 120px;
          max-width: 1140px; margin: 0 auto;
        }
        .cta-inner {
          background: linear-gradient(135deg, #131316 0%, #1a1608 100%);
          border: 1px solid var(--gold-border);
          border-radius: 24px;
          padding: 80px 64px;
          text-align: center;
          position: relative; overflow: hidden;
        }
        .cta-inner::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(201,169,110,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,169,110,0.03) 1px, transparent 1px);
          background-size: 36px 36px;
        }
        .cta-inner::after {
          content: '';
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 500px; height: 300px;
          background: radial-gradient(ellipse, rgba(201,169,110,0.08), transparent 70%);
          pointer-events: none;
        }
        .cta-title {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(28px, 4vw, 46px);
          letter-spacing: -1.5px; color: var(--text);
          margin-bottom: 16px; position: relative; z-index: 1;
        }
        .cta-sub {
          font-size: 15px; color: var(--dim);
          max-width: 440px; margin: 0 auto 40px;
          line-height: 1.65; font-weight: 300;
          position: relative; z-index: 1;
        }

        /* MODULE CARDS */
        .modules-row {
          display: flex; gap: 16px; justify-content: center;
          flex-wrap: wrap; position: relative; z-index: 1;
        }
        .module-card {
          background: rgba(10,10,12,0.7);
          border: 1px solid var(--border-h);
          border-radius: 14px;
          padding: 28px 36px;
          text-align: left; text-decoration: none;
          transition: border-color 0.2s, transform 0.2s, background 0.2s;
          min-width: 220px;
        }
        .module-card:hover { border-color: var(--gold-border); transform: translateY(-3px); background: rgba(201,169,110,0.04); }
        .module-label {
          font-size: 11px; font-weight: 600; letter-spacing: 1.5px;
          text-transform: uppercase; color: var(--muted); margin-bottom: 8px;
        }
        .module-name {
          font-family: 'DM Serif Display', serif;
          font-size: 22px; color: var(--text);
          margin-bottom: 6px;
        }
        .module-sub { font-size: 12.5px; color: var(--muted); }
        .module-arrow {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; color: var(--gold);
          margin-top: 14px; font-weight: 500;
        }

        /* FOOTER */
        .footer {
          border-top: 1px solid var(--border);
          padding: 32px 48px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .footer-logo {
          font-family: 'DM Serif Display', serif;
          font-size: 14px; color: var(--muted);
        }
        .footer-right { font-size: 12px; color: var(--muted); }

        /* DIVIDER */
        .section-divider {
          border: none; border-top: 1px solid var(--border);
          max-width: 1140px; margin: 0 auto;
        }

        @media (max-width: 900px) {
          .section, .benefits-section, .cta-section { padding-left: 24px; padding-right: 24px; }
          .nav { padding: 0 24px; }
          .features-grid { grid-template-columns: 1fr; }
          .benefits-grid { grid-template-columns: 1fr; gap: 32px; }
          .benefits-inner { padding: 40px 28px; }
          .steps-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
          .steps-grid::before { display: none; }
          .cta-inner { padding: 48px 28px; }
          .footer { flex-direction: column; gap: 12px; text-align: center; }
        }
      `}</style>

      {/* NAV */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <Link href="/" className="nav-logo">
          <div className="nav-logo-mark"><div className="nav-logo-dot" /></div>
          <span className="nav-logo-name">ProspectBot</span>
        </Link>
        <Link href="/login" className="nav-cta">
          Se connecter →
        </Link>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className={`hero-inner ${visible ? 'visible' : ''}`}>
          <div className="hero-badge">
            <div className="hero-badge-dot" />
            Outil de prospection pour agents immobiliers
          </div>

          <h1 className="hero-title">
            Trouvez le bon bien<br />
            pour le bon acheteur,<br />
            <em>automatiquement</em>
          </h1>

          <p className="hero-sub">
            ProspectBot scrape les annonces, calcule les correspondances et envoie les alertes à vos clients — pendant que vous vous concentrez sur la vente.
          </p>

          <div className="hero-actions">
            <Link href="/login?redirect=/immobilier" className="btn-primary-hero">
              Accéder au dashboard →
            </Link>
            <a href="#comment" className="btn-ghost-hero">
              Comment ça marche
            </a>
          </div>
        </div>

        <div className="scroll-hint">
          <span>Découvrir</span>
          <span className="scroll-arrow">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
          </span>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section">
        <div className="features-header">
          <div className="section-label">Fonctionnalités</div>
          <h2 className="section-title">Tout ce dont vous avez<br /><em>besoin, rien de plus</em></h2>
          <p className="section-sub">Un outil pensé pour les agents immo qui veulent gagner du temps sans sacrifier la qualité de leur suivi client.</p>
        </div>

        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-tag">{f.tag}</div>
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="section-divider" />

      {/* BENEFITS */}
      <section className="benefits-section" style={{ paddingTop: 100 }}>
        <div className="benefits-inner">
          <div className="section-label">Résultats</div>
          <h2 className="section-title">Ce que ça change<br /><em>au quotidien</em></h2>
          <p className="section-sub">Des chiffres concrets sur ce que l'automatisation apporte aux agents qui l'utilisent.</p>
          <div className="benefits-grid">
            {BENEFITS.map((b, i) => (
              <div key={i} className="benefit-item">
                <div className="benefit-num">{b.num}</div>
                <div className="benefit-label">{b.label}</div>
                <div className="benefit-sub">{b.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* HOW IT WORKS */}
      <section className="section" id="comment">
        <div style={{ marginBottom: 0 }}>
          <div className="section-label">Processus</div>
          <h2 className="section-title">En 4 étapes,<br /><em>tout est automatisé</em></h2>
        </div>

        <div className="steps-grid">
          {STEPS.map((s, i) => (
            <div key={i} className="step-item">
              <div className="step-num">{s.n}</div>
              <div className="step-title">{s.title}</div>
              <p className="step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="section-divider" />

      {/* CTA FINAL */}
      <section className="cta-section" style={{ paddingTop: 100 }}>
        <div className="cta-inner">
          <h2 className="cta-title">Prêt à prospecter<br />sans effort ?</h2>
          <p className="cta-sub">
            Connectez-vous à votre espace de travail et commencez à matcher vos acheteurs avec les meilleures annonces du marché.
          </p>
          <div className="modules-row">
            <Link href="/login?redirect=/immobilier" className="module-card">
              <div className="module-label">Module</div>
              <div className="module-name">Immobilier</div>
              <div className="module-sub">Scraping · Matching · Alertes</div>
              <div className="module-arrow">Accéder <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
            </Link>
            <Link href="/login?redirect=/b2b" className="module-card">
              <div className="module-label">Module</div>
              <div className="module-name">B2B</div>
              <div className="module-sub">Chatbot · Campagnes · Scraper</div>
              <div className="module-arrow">Accéder <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-logo">ProspectBot</div>
        <div className="footer-right">Outil réservé aux agents autorisés</div>
      </footer>
    </>
  );
}
