// pages/b2b-guide.js
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

const FEATURES = [
  {
    id: 'scraper',
    title: 'Scraper web',
    subtitle: 'Constituez votre base de contacts en quelques secondes',
    description: 'Entrez l\'URL d\'un site (promoteur, notaire, syndic, agence concurrente) et extrayez automatiquement tous les emails de contact disponibles. Construisez une liste de prospects qualifiés sans aucune saisie manuelle.',
    steps: [
      'Saisissez l\'URL d\'un site cible',
      'Le scraper analyse la page et extrait les emails',
      'Sélectionnez les contacts pertinents',
      'Transférez-les directement vers l\'email groupé',
    ],
    stat: '10x',
    statLabel: 'plus rapide qu\'une recherche manuelle',
  },
  {
    id: 'email',
    title: 'Email groupé',
    subtitle: 'Contactez des dizaines de prospects en un seul envoi',
    description: 'Rédigez un message une fois, personnalisez-le avec le nom du destinataire et envoyez-le à tous vos contacts B2B simultanément. Idéal pour les campagnes de mise en relation avec des promoteurs, notaires ou investisseurs.',
    steps: [
      'Importez vos contacts depuis le scraper ou manuellement',
      'Rédigez votre message avec personnalisation {name}',
      'Prévisualisez et validez l\'envoi',
      'Suivez le nombre d\'emails envoyés',
    ],
    stat: '1 min',
    statLabel: 'pour contacter 50 prospects',
  },
  {
    id: 'chatbot',
    title: 'Chatbot de qualification',
    subtitle: 'Captez des leads 24h/24 depuis votre site',
    description: 'Créez un assistant virtuel qui accueille les visiteurs de votre site, pose les bonnes questions et qualifie automatiquement les prospects. Chaque conversation est enregistrée avec le statut "Qualifié / Non qualifié".',
    steps: [
      'Créez votre chatbot en 2 minutes',
      'Copiez le lien public et partagez-le',
      'Les visiteurs discutent avec votre bot',
      'Consultez les conversations qualifiées dans le dashboard',
    ],
    stat: '24/7',
    statLabel: 'qualification automatique',
  },
  {
    id: 'workflows',
    title: 'Workflows automatisés',
    subtitle: 'Ne manquez plus aucun prospect entrant',
    description: 'Configurez des automatisations qui se déclenchent quand un prospect contacte votre chatbot ou qu\'un bien correspond à un acheteur. Email de bienvenue automatique, notification équipe — tout se fait sans intervention manuelle.',
    steps: [
      'Choisissez un déclencheur (nouveau prospect, nouveau match)',
      'Les actions s\'exécutent automatiquement',
      'Le prospect reçoit un email de bienvenue',
      'Vous êtes notifié pour intervenir au bon moment',
    ],
    stat: '0',
    statLabel: 'prospect oublié',
  },
];

const SCENARIOS = [
  {
    title: 'Prospection notaires & promoteurs',
    desc: 'Scrapez les sites des notaires et promoteurs de votre secteur, extrayez leurs emails, envoyez un message de mise en relation personnalisé. En 20 minutes, vous avez contacté 40 professionnels.',
  },
  {
    title: 'Qualification de leads entrants',
    desc: 'Intégrez le chatbot sur votre site vitrine. Chaque visiteur est accueilli, ses besoins sont identifiés, et vous recevez une notification uniquement pour les prospects qualifiés.',
  },
  {
    title: 'Suivi automatique des acheteurs',
    desc: 'Configurez un workflow "nouveau match immobilier" : dès qu\'un bien correspond à un acheteur, un email lui est envoyé automatiquement avec les détails du bien.',
  },
];

export default function B2BGuide() {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <>
      <Head>
        <title>Module B2B — Guide ProspectBot</title>
        <meta name="description" content="Découvrez comment le Module B2B de ProspectBot vous aide à prospecter, qualifier et automatiser votre activité immobilière." />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #080809;
          color: #e8e8e8;
          min-height: 100vh;
        }

        .page { max-width: 960px; margin: 0 auto; padding: 0 24px; }

        /* NAV */
        nav {
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 18px 0;
        }
        .nav-inner {
          max-width: 960px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .nav-logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 400;
          color: #e8e8e8;
          text-decoration: none;
          letter-spacing: 0.5px;
        }
        .nav-logo span { color: #d4a853; }
        .nav-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 20px;
          background: linear-gradient(135deg, #8b6914, #d4a853);
          color: #000;
          font-size: 13px;
          font-weight: 600;
          border-radius: 8px;
          text-decoration: none;
          letter-spacing: 0.2px;
          transition: opacity 0.2s;
        }
        .nav-cta:hover { opacity: 0.85; }

        /* HERO */
        .hero {
          padding: 80px 0 64px;
          text-align: center;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: rgba(212,168,83,0.08);
          border: 1px solid rgba(212,168,83,0.2);
          border-radius: 20px;
          font-size: 12px;
          color: #d4a853;
          font-family: 'DM Mono', monospace;
          letter-spacing: 0.5px;
          margin-bottom: 28px;
          text-transform: uppercase;
        }
        .hero-badge::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #d4a853;
        }
        .hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(36px, 6vw, 58px);
          font-weight: 300;
          color: #f0f0f0;
          line-height: 1.1;
          letter-spacing: -0.5px;
          margin-bottom: 20px;
        }
        .hero-title em {
          font-style: italic;
          color: #d4a853;
        }
        .hero-desc {
          font-size: 16px;
          color: rgba(255,255,255,0.45);
          line-height: 1.7;
          max-width: 540px;
          margin: 0 auto 40px;
          font-weight: 300;
        }
        .hero-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
        }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 28px;
          background: linear-gradient(135deg, #8b6914, #d4a853);
          color: #000;
          font-size: 14px;
          font-weight: 600;
          border-radius: 10px;
          text-decoration: none;
          transition: opacity 0.2s, transform 0.15s;
        }
        .btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 28px;
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.6);
          font-size: 14px;
          border-radius: 10px;
          text-decoration: none;
          border: 1px solid rgba(255,255,255,0.08);
          transition: all 0.2s;
        }
        .btn-secondary:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.85); }

        /* STATS BAR */
        .stats-bar {
          border-top: 1px solid rgba(255,255,255,0.05);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding: 28px 0;
          margin: 0 0 72px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: rgba(255,255,255,0.05);
        }
        .stat-item {
          background: #080809;
          padding: 20px 24px;
          text-align: center;
        }
        .stat-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px;
          font-weight: 400;
          color: #d4a853;
          line-height: 1;
          margin-bottom: 6px;
        }
        .stat-label {
          font-size: 12px;
          color: rgba(255,255,255,0.3);
          line-height: 1.4;
        }

        /* SECTION TITLE */
        .section-label {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: #d4a853;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(28px, 4vw, 38px);
          font-weight: 300;
          color: #f0f0f0;
          line-height: 1.2;
          margin-bottom: 14px;
        }
        .section-desc {
          font-size: 15px;
          color: rgba(255,255,255,0.4);
          line-height: 1.7;
          font-weight: 300;
          max-width: 480px;
        }

        /* FEATURES TABS */
        .features-section { margin-bottom: 80px; }
        .features-tabs {
          display: flex;
          gap: 0;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          margin-bottom: 40px;
          overflow-x: auto;
        }
        .feature-tab {
          padding: 14px 22px;
          font-size: 13.5px;
          font-weight: 500;
          color: rgba(255,255,255,0.35);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          white-space: nowrap;
          transition: all 0.2s;
          background: none;
          border-top: none;
          border-left: none;
          border-right: none;
          font-family: 'DM Sans', sans-serif;
          margin-bottom: -1px;
        }
        .feature-tab:hover { color: rgba(255,255,255,0.6); }
        .feature-tab.active {
          color: #d4a853;
          border-bottom-color: #d4a853;
        }
        .feature-panel {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: start;
        }
        .feature-stat-box {
          display: inline-flex;
          align-items: baseline;
          gap: 10px;
          padding: 16px 20px;
          background: rgba(212,168,83,0.06);
          border: 1px solid rgba(212,168,83,0.15);
          border-radius: 12px;
          margin-bottom: 24px;
        }
        .feature-stat-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 36px;
          font-weight: 400;
          color: #d4a853;
          line-height: 1;
        }
        .feature-stat-text {
          font-size: 13px;
          color: rgba(255,255,255,0.4);
          line-height: 1.4;
          max-width: 140px;
        }
        .feature-steps {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .feature-step {
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }
        .step-num {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: rgba(212,168,83,0.08);
          border: 1px solid rgba(212,168,83,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: #d4a853;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .step-text {
          font-size: 13.5px;
          color: rgba(255,255,255,0.55);
          line-height: 1.6;
          padding-top: 3px;
        }

        /* SCENARIOS */
        .scenarios-section { margin-bottom: 80px; }
        .scenarios-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 36px;
        }
        .scenario-card {
          background: #0e0e11;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 24px;
          transition: border-color 0.2s;
        }
        .scenario-card:hover { border-color: rgba(212,168,83,0.2); }
        .scenario-num {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: rgba(212,168,83,0.5);
          letter-spacing: 1px;
          margin-bottom: 12px;
        }
        .scenario-title {
          font-size: 14px;
          font-weight: 600;
          color: #e8e8e8;
          margin-bottom: 10px;
          line-height: 1.4;
        }
        .scenario-desc {
          font-size: 13px;
          color: rgba(255,255,255,0.35);
          line-height: 1.65;
          font-weight: 300;
        }

        /* CTA BLOCK */
        .cta-block {
          margin: 0 0 80px;
          background: linear-gradient(135deg, rgba(212,168,83,0.06), rgba(139,105,20,0.04));
          border: 1px solid rgba(212,168,83,0.15);
          border-radius: 20px;
          padding: 56px 48px;
          text-align: center;
        }
        .cta-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(28px, 4vw, 40px);
          font-weight: 300;
          color: #f0f0f0;
          margin-bottom: 14px;
          line-height: 1.2;
        }
        .cta-title em { font-style: italic; color: #d4a853; }
        .cta-desc {
          font-size: 15px;
          color: rgba(255,255,255,0.4);
          margin-bottom: 32px;
          line-height: 1.7;
          font-weight: 300;
        }
        .cta-price {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          color: rgba(255,255,255,0.25);
          margin-top: 16px;
          letter-spacing: 0.5px;
        }

        /* FOOTER */
        footer {
          border-top: 1px solid rgba(255,255,255,0.05);
          padding: 24px 0;
          text-align: center;
        }
        .footer-text {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: rgba(255,255,255,0.15);
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }

        @media (max-width: 680px) {
          .stats-bar { grid-template-columns: repeat(2, 1fr); }
          .feature-panel { grid-template-columns: 1fr; }
          .scenarios-grid { grid-template-columns: 1fr; }
          .cta-block { padding: 36px 24px; }
        }
      `}</style>

      <nav>
        <div className="nav-inner">
          <Link href="/" className="nav-logo">Prospect<span>Bot</span></Link>
          <Link href="/upgrade" className="nav-cta">Passer au plan Agence</Link>
        </div>
      </nav>

      <div className="page">

        {/* HERO */}
        <section className="hero">
          <div className="hero-badge">Module B2B — Plan Agence</div>
          <h1 className="hero-title">
            Prospectez comme<br /><em>une grande agence</em>
          </h1>
          <p className="hero-desc">
            Quatre outils intégrés pour trouver des contacts, les qualifier, les contacter en masse et automatiser votre suivi — sans quitter ProspectBot.
          </p>
          <div className="hero-actions">
            <Link href="/upgrade" className="btn-primary">Démarrer avec Agence — 169€/mois</Link>
            <Link href="/immobilier" className="btn-secondary">Retour au dashboard</Link>
          </div>
        </section>

        {/* STATS BAR */}
        <div className="stats-bar">
          <div className="stat-item">
            <div className="stat-num">4</div>
            <div className="stat-label">outils intégrés dans le dashboard</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">24/7</div>
            <div className="stat-label">qualification automatique des leads</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">1 min</div>
            <div className="stat-label">pour contacter 50 prospects</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">0</div>
            <div className="stat-label">prospect oublié avec les workflows</div>
          </div>
        </div>

        {/* FEATURES */}
        <section className="features-section">
          <div className="section-label">Les outils</div>
          <h2 className="section-title">Tout ce dont un agent immo a besoin pour prospecter en B2B</h2>

          <div className="features-tabs" style={{ marginTop: 32 }}>
            {FEATURES.map((f, i) => (
              <button key={f.id} className={`feature-tab${activeFeature === i ? ' active' : ''}`} onClick={() => setActiveFeature(i)}>
                {f.title}
              </button>
            ))}
          </div>

          {(() => {
            const f = FEATURES[activeFeature];
            return (
              <div className="feature-panel">
                <div>
                  <div className="feature-stat-box">
                    <span className="feature-stat-num">{f.stat}</span>
                    <span className="feature-stat-text">{f.statLabel}</span>
                  </div>
                  <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 400, color: '#f0f0f0', marginBottom: 12, lineHeight: 1.2 }}>{f.subtitle}</h3>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.75, fontWeight: 300 }}>{f.description}</p>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'DM Mono, monospace', marginBottom: 20 }}>Comment ça marche</div>
                  <div className="feature-steps">
                    {f.steps.map((step, i) => (
                      <div key={i} className="feature-step">
                        <div className="step-num">{i + 1}</div>
                        <div className="step-text">{step}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </section>

        {/* SCENARIOS */}
        <section className="scenarios-section">
          <div className="section-label">Cas d'usage</div>
          <h2 className="section-title">Ce que font concrètement les agents Agence</h2>
          <div className="scenarios-grid">
            {SCENARIOS.map((s, i) => (
              <div key={i} className="scenario-card">
                <div className="scenario-num">0{i + 1}</div>
                <div className="scenario-title">{s.title}</div>
                <div className="scenario-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="cta-block">
          <h2 className="cta-title">Prêt à passer à la<br /><em>vitesse supérieure ?</em></h2>
          <p className="cta-desc">Le Module B2B est inclus dans le plan Agence.<br />Accès immédiat à tous les outils dès la souscription.</p>
          <Link href="/upgrade" className="btn-primary" style={{ fontSize: 15, padding: '14px 36px' }}>
            Passer au plan Agence — 169€/mois
          </Link>
          <div className="cta-price">Sans engagement · Accès immédiat · Annulable à tout moment</div>
        </div>

      </div>

      <footer>
        <div className="footer-text">ProspectBot — Module B2B</div>
      </footer>
    </>
  );
}
