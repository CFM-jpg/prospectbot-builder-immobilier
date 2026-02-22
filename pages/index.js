import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>ProspectBot</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet" />
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
          --gold: #d4a853;
          --gold-dim: rgba(212,168,83,0.12);
          --violet: #7c6af7;
          --violet-dim: rgba(124,106,247,0.12);
        }

        .page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }

        /* Header */
        .header {
          text-align: center;
          margin-bottom: 64px;
        }
        .logo-mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px; height: 48px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          margin-bottom: 28px;
        }
        .logo-dot {
          width: 12px; height: 12px;
          border-radius: 50%;
          background: conic-gradient(var(--gold) 0%, var(--violet) 100%);
        }
        .site-name {
          font-family: 'DM Serif Display', serif;
          font-size: 13px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 20px;
        }
        .headline {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(36px, 6vw, 56px);
          line-height: 1.1;
          letter-spacing: -1.5px;
          color: var(--text);
          max-width: 520px;
          margin: 0 auto 16px;
        }
        .headline em {
          font-style: italic;
          color: var(--text-dim);
        }
        .tagline {
          font-size: 15px;
          color: var(--text-muted);
          max-width: 380px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* Cards */
        .cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          width: 100%;
          max-width: 680px;
        }
        .card {
          position: relative;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 32px 28px;
          text-decoration: none;
          display: block;
          transition: border-color 0.2s, transform 0.2s;
          overflow: hidden;
        }
        .card:hover {
          border-color: var(--border-hover);
          transform: translateY(-2px);
        }
        .card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .card.gold::before { background: linear-gradient(90deg, transparent, var(--gold), transparent); }
        .card.violet::before { background: linear-gradient(90deg, transparent, var(--violet), transparent); }
        .card:hover::before { opacity: 1; }

        .card-icon {
          width: 40px; height: 40px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
          font-size: 18px;
        }
        .gold .card-icon { background: var(--gold-dim); }
        .violet .card-icon { background: var(--violet-dim); }

        .card-category {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .gold .card-category { color: var(--gold); }
        .violet .card-category { color: var(--violet); }

        .card-title {
          font-family: 'DM Serif Display', serif;
          font-size: 22px;
          color: var(--text);
          letter-spacing: -0.5px;
          margin-bottom: 10px;
        }
        .card-desc {
          font-size: 13px;
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .card-features {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 28px;
        }
        .feature {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: var(--text-dim);
        }
        .feature-dot {
          width: 4px; height: 4px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .gold .feature-dot { background: var(--gold); }
        .violet .feature-dot { background: var(--violet); }

        .card-cta {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .cta-text {
          font-size: 13px;
          font-weight: 500;
        }
        .gold .cta-text { color: var(--gold); }
        .violet .cta-text { color: var(--violet); }
        .cta-arrow {
          font-size: 18px;
          transition: transform 0.15s;
        }
        .card:hover .cta-arrow { transform: translateX(3px); }

        /* Footer */
        .footer {
          margin-top: 48px;
          text-align: center;
        }
        .footer p {
          font-size: 12px;
          color: var(--text-muted);
        }
        .version {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          font-size: 11px;
          color: var(--text-muted);
          margin-bottom: 12px;
        }
        .version-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); }

        @media (max-width: 600px) {
          .cards { grid-template-columns: 1fr; }
          .headline { font-size: 36px; }
          .header { margin-bottom: 40px; }
        }
      `}</style>

      <div className="page">
        <div className="header">
          <div className="logo-mark">
            <div className="logo-dot" />
          </div>
          <div className="site-name">ProspectBot</div>
          <h1 className="headline">
            Prospection <em>intelligente</em> pour vos clients
          </h1>
          <p className="tagline">
            Choisissez votre module selon votre activité — immobilier ou B2B.
          </p>
        </div>

        <div className="cards">
          {/* Immobilier */}
          <Link href="/immobilier">
            <a className="card gold">
              <div className="card-icon">⬡</div>
              <div className="card-category">Immobilier</div>
              <div className="card-title">Gestion de biens</div>
              <div className="card-desc">
                Scrapez les annonces, gérez votre portefeuille et matchez vos acheteurs automatiquement.
              </div>
              <div className="card-features">
                <div className="feature"><span className="feature-dot" />Scraping Bien'ici, SeLoger, LeBonCoin</div>
                <div className="feature"><span className="feature-dot" />Matching acheteurs automatique</div>
                <div className="feature"><span className="feature-dot" />Notifications email via Brevo</div>
              </div>
              <div className="card-cta">
                <span className="cta-text">Accéder au module</span>
                <span className="cta-arrow">→</span>
              </div>
            </a>
          </Link>

          {/* B2B */}
          <Link href="/b2b">
            <a className="card violet">
              <div className="card-icon">◈</div>
              <div className="card-category">B2B</div>
              <div className="card-title">Prospection B2B</div>
              <div className="card-desc">
                Qualifiez vos leads, automatisez vos campagnes email et configurez des workflows sur mesure.
              </div>
              <div className="card-features">
                <div className="feature"><span className="feature-dot" />Chatbot de qualification</div>
                <div className="feature"><span className="feature-dot" />Campagnes email automatisées</div>
                <div className="feature"><span className="feature-dot" />Scraper de contacts web</div>
              </div>
              <div className="card-cta">
                <span className="cta-text">Accéder au module</span>
                <span className="cta-arrow">→</span>
              </div>
            </a>
          </Link>
        </div>

        <div className="footer">
          <div className="version">
            <span className="version-dot" />
            Version 1.0
          </div>
          <p>Mis à jour le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>
    </>
  );
}
