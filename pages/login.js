// pages/login.js

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const router = useRouter();
  const { redirect } = router.query;

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(redirect || '/immobilier');
      } else {
        setError(data.error || 'Identifiants incorrects');
      }
    } catch (err) {
      setError('Erreur réseau, veuillez réessayer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Connexion — ProspectBot</title>
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
          --border-focus: rgba(212,168,83,0.4);
          --text: #e8e8e8;
          --text-muted: #6b6b78;
          --text-dim: #a0a0ae;
          --accent: #d4a853;
          --accent-dim: rgba(212,168,83,0.1);
          --red: #f04444;
          --red-dim: rgba(240,68,68,0.1);
        }

        .page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        /* Left panel — décoratif */
        .panel-left {
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          position: relative;
          overflow: hidden;
        }

        /* Grille de fond décorative */
        .panel-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        /* Cercle lumineux au centre */
        .panel-left::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(212,168,83,0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        .panel-brand {
          position: relative;
          z-index: 1;
        }

        .logo-mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px; height: 44px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 12px;
          margin-bottom: 20px;
        }
        .logo-dot {
          width: 14px; height: 14px;
          border-radius: 50%;
          background: conic-gradient(var(--accent) 0%, rgba(212,168,83,0.3) 100%);
        }

        .brand-name {
          font-family: 'DM Serif Display', serif;
          font-size: 13px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        .panel-center {
          position: relative;
          z-index: 1;
          text-align: center;
        }

        .panel-headline {
          font-family: 'DM Serif Display', serif;
          font-size: 38px;
          line-height: 1.15;
          letter-spacing: -1px;
          color: var(--text);
          margin-bottom: 16px;
        }
        .panel-headline em {
          font-style: italic;
          color: var(--text-dim);
        }
        .panel-sub {
          font-size: 14px;
          color: var(--text-muted);
          line-height: 1.6;
          max-width: 300px;
          margin: 0 auto;
        }

        /* Stats décoratifs */
        .panel-stats {
          position: relative;
          z-index: 1;
          display: flex;
          gap: 32px;
        }
        .pstat-value {
          font-family: 'DM Serif Display', serif;
          font-size: 28px;
          color: var(--text);
          letter-spacing: -1px;
        }
        .pstat-label {
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 3px;
        }

        /* Right panel — formulaire */
        .panel-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 40px;
        }

        .form-wrapper {
          width: 100%;
          max-width: 380px;
        }

        .form-header {
          margin-bottom: 40px;
        }
        .form-title {
          font-family: 'DM Serif Display', serif;
          font-size: 28px;
          color: var(--text);
          letter-spacing: -0.5px;
          margin-bottom: 8px;
        }
        .form-subtitle {
          font-size: 13.5px;
          color: var(--text-muted);
        }

        /* Error */
        .error-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          background: var(--red-dim);
          border: 1px solid rgba(240,68,68,0.25);
          border-radius: 8px;
          font-size: 13px;
          color: var(--red);
          margin-bottom: 24px;
          animation: shake 0.3s ease;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .error-icon {
          width: 16px; height: 16px;
          border-radius: 50%;
          background: var(--red);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* Form fields */
        .field {
          margin-bottom: 18px;
        }
        .field-label {
          display: block;
          font-size: 11.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.7px;
          color: var(--text-muted);
          margin-bottom: 8px;
        }
        .field-input-wrap {
          position: relative;
        }
        .field-input {
          width: 100%;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 13px 16px;
          font-size: 14px;
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .field-input:focus {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px rgba(212,168,83,0.06);
        }
        .field-input::placeholder { color: var(--text-muted); }
        .field-input.has-toggle { padding-right: 48px; }

        .toggle-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          font-size: 14px;
          padding: 4px;
          transition: color 0.15s;
          line-height: 1;
        }
        .toggle-btn:hover { color: var(--text-dim); }

        /* Submit */
        .submit-btn {
          width: 100%;
          padding: 14px;
          background: var(--accent);
          color: #0f0f11;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 8px;
          letter-spacing: 0.2px;
        }
        .submit-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(15,15,17,0.25);
          border-top-color: #0f0f11;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Footer form */
        .form-footer {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid var(--border);
          text-align: center;
        }
        .form-footer p {
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.6;
        }
        .form-footer strong {
          color: var(--text-dim);
          font-weight: 500;
        }

        /* Hint */
        .hint-box {
          margin-top: 16px;
          padding: 10px 14px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.5;
        }
        .hint-box code {
          font-family: monospace;
          font-size: 11px;
          color: var(--accent);
          background: rgba(212,168,83,0.1);
          padding: 1px 5px;
          border-radius: 3px;
        }

        @media (max-width: 768px) {
          .page { grid-template-columns: 1fr; }
          .panel-left { display: none; }
          .panel-right { padding: 32px 24px; align-items: flex-start; padding-top: 60px; }
        }
      `}</style>

      <div className="page">
        {/* Panneau gauche */}
        <div className="panel-left">
          <div className="panel-brand">
            <div className="logo-mark"><div className="logo-dot" /></div>
            <div className="brand-name">ProspectBot</div>
          </div>

          <div className="panel-center">
            <h2 className="panel-headline">
              Votre outil de<br />prospection <em>sur mesure</em>
            </h2>
            <p className="panel-sub">
              Immobilier et B2B — scraping, matching et emails automatisés dans une seule plateforme.
            </p>
          </div>

          <div className="panel-stats">
            <div>
              <div className="pstat-value">2</div>
              <div className="pstat-label">Modules</div>
            </div>
            <div>
              <div className="pstat-value">∞</div>
              <div className="pstat-label">Annonces</div>
            </div>
            <div>
              <div className="pstat-value">Auto</div>
              <div className="pstat-label">Matching</div>
            </div>
          </div>
        </div>

        {/* Panneau droit — formulaire */}
        <div className="panel-right">
          <div className="form-wrapper">
            <div className="form-header">
              <h1 className="form-title">Connexion</h1>
              <p className="form-subtitle">Accédez à votre espace de travail</p>
            </div>

            {error && (
              <div className="error-box">
                <div className="error-icon">!</div>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="field">
                <label className="field-label">Adresse email</label>
                <input
                  className="field-input"
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="votre@email.fr"
                  autoComplete="email"
                  required
                  autoFocus
                />
              </div>

              <div className="field">
                <label className="field-label">Mot de passe</label>
                <div className="field-input-wrap">
                  <input
                    className="field-input has-toggle"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="toggle-btn"
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={loading || !form.email || !form.password}
              >
                {loading ? (
                  <><span className="spinner" /> Connexion…</>
                ) : (
                  'Se connecter'
                )}
              </button>
            </form>

            <div className="form-footer">
              <p>
                Accès réservé aux agents autorisés.<br />
                Contactez votre administrateur pour obtenir vos identifiants.
              </p>
              <div className="hint-box" style={{ marginTop: 12, textAlign: 'left' }}>
                <strong style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Identifiants par défaut</strong>
                Email : <code>admin@prospectbot.fr</code><br />
                Mot de passe : <code>admin123</code><br />
                <span style={{ fontSize: 11, marginTop: 6, display: 'block', color: 'var(--text-muted)' }}>
                  Modifiez ces valeurs via les variables d'environnement <code>ADMIN_EMAIL</code> et <code>ADMIN_PASSWORD</code>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
