// pages/login.js

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const router = useRouter();
  const { redirect } = router.query;
  const canvasRef = useRef(null);

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.35 + 0.08,
    }));
    let frame;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,168,83,${p.alpha})`;
        ctx.fill();
      });
      particles.forEach((p, i) => {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = p.x - particles[j].x, dy = p.y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(212,168,83,${0.07 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); };
  }, []);

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
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'DM Sans', sans-serif; background: #080809; color: #e8e8e8; min-height: 100vh; overflow: hidden; }

        body::before {
          content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 1000;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          opacity: 0.4;
        }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes glowPulse { 0%, 100% { box-shadow: 0 0 40px rgba(212,168,83,0.15); } 50% { box-shadow: 0 0 70px rgba(212,168,83,0.3); } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }

        .page { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; position: relative; z-index: 1; }

        .panel-left { display: flex; flex-direction: column; justify-content: space-between; padding: 52px 56px; position: relative; overflow: hidden; border-right: 1px solid rgba(255,255,255,0.06); }
        .panel-left::after { content: ''; position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); width: 500px; height: 500px; background: radial-gradient(circle, rgba(212,168,83,0.07) 0%, transparent 70%); pointer-events: none; }
        .panel-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px); background-size: 48px 48px; }
        .panel-brand { position: relative; z-index: 1; animation: fadeUp 0.7s 0.1s both; }
        .logo { font-family: 'Cormorant Garamond', serif; font-size: 22px; color: #d4a853; letter-spacing: 1px; font-style: italic; }
        .panel-center { position: relative; z-index: 1; animation: fadeUp 0.7s 0.2s both; }
        .panel-tag { display: inline-flex; align-items: center; gap: 8px; background: rgba(212,168,83,0.1); border: 1px solid rgba(212,168,83,0.25); border-radius: 30px; padding: 5px 14px; font-size: 11.5px; color: #d4a853; letter-spacing: 0.5px; margin-bottom: 24px; }
        .panel-headline { font-family: 'Cormorant Garamond', serif; font-size: clamp(34px, 3.5vw, 46px); font-weight: 300; line-height: 1.1; letter-spacing: -0.5px; color: #f0f0f0; margin-bottom: 18px; }
        .panel-headline em { font-style: italic; background: linear-gradient(135deg, #8b6914, #d4a853, #f0d080); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .panel-sub { font-size: 14.5px; color: rgba(255,255,255,0.4); line-height: 1.7; max-width: 340px; font-weight: 300; }

        .module-cards { display: flex; gap: 12px; margin-top: 32px; }
        .module-card { flex: 1; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px; animation: float 4s ease-in-out infinite; }
        .module-card:nth-child(2) { animation-delay: 0.8s; }
        .module-icon { font-size: 20px; margin-bottom: 10px; }
        .module-name { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.8); margin-bottom: 4px; }
        .module-desc { font-size: 11.5px; color: rgba(255,255,255,0.35); line-height: 1.5; }
        .module-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-top: 10px; }

        .panel-stats { position: relative; z-index: 1; display: flex; gap: 36px; animation: fadeUp 0.7s 0.3s both; }
        .pstat-value { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 500; color: #d4a853; letter-spacing: -1px; line-height: 1; }
        .pstat-label { font-size: 11px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }

        .panel-right { display: flex; align-items: center; justify-content: center; padding: 48px 56px; }

        .form-wrapper { width: 100%; max-width: 360px; animation: fadeUp 0.7s 0.15s both; }
        .form-header { margin-bottom: 36px; }
        .form-title { font-family: 'Cormorant Garamond', serif; font-size: 36px; font-weight: 300; color: #f0f0f0; letter-spacing: -0.5px; margin-bottom: 6px; }
        .form-subtitle { font-size: 13.5px; color: rgba(255,255,255,0.4); font-weight: 300; }

        .error-box { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: rgba(240,68,68,0.08); border: 1px solid rgba(240,68,68,0.25); border-radius: 10px; font-size: 13px; color: #f04444; margin-bottom: 24px; animation: shake 0.3s ease; }
        .error-icon { width: 18px; height: 18px; border-radius: 50%; background: rgba(240,68,68,0.2); border: 1px solid rgba(240,68,68,0.4); color: #f04444; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

        .field { margin-bottom: 20px; }
        .field-label { display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.2px; color: rgba(255,255,255,0.35); margin-bottom: 8px; }
        .field-input-wrap { position: relative; }
        .field-input { width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.09); border-radius: 12px; padding: 14px 18px; font-size: 14px; color: #e8e8e8; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s, box-shadow 0.2s, background 0.2s; }
        .field-input:focus { border-color: rgba(212,168,83,0.45); box-shadow: 0 0 0 3px rgba(212,168,83,0.07); background: rgba(212,168,83,0.03); }
        .field-input::placeholder { color: rgba(255,255,255,0.2); }
        .field-input.has-toggle { padding-right: 50px; }
        .toggle-btn { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.25); padding: 4px; transition: color 0.15s; line-height: 1; display: flex; align-items: center; }
        .toggle-btn:hover { color: rgba(255,255,255,0.5); }

        .submit-btn { width: 100%; padding: 15px; background: linear-gradient(135deg, #8b6914, #d4a853); color: #0a0a0a; border: none; border-radius: 12px; font-size: 14.5px; font-weight: 700; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s, opacity 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 10px; letter-spacing: 0.3px; animation: glowPulse 3s infinite; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(212,168,83,0.35); }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.45; cursor: not-allowed; animation: none; }
        .spinner { width: 16px; height: 16px; border: 2px solid rgba(10,10,10,0.25); border-top-color: #0a0a0a; border-radius: 50%; animation: spin 0.6s linear infinite; }

        .form-footer { margin-top: 28px; padding-top: 22px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; }
        .form-footer p { font-size: 12px; color: rgba(255,255,255,0.25); line-height: 1.7; }
        .hint-box { margin-top: 14px; padding: 12px 14px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; font-size: 12px; color: rgba(255,255,255,0.3); line-height: 1.6; text-align: left; }
        .hint-box strong { font-size: 11px; color: rgba(255,255,255,0.4); display: block; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.8px; }
        .hint-box code { font-family: monospace; font-size: 11.5px; color: #d4a853; background: rgba(212,168,83,0.1); padding: 1px 6px; border-radius: 4px; }

        /* Module picker */
        .module-picker { width: 100%; max-width: 360px; animation: fadeUp 0.5s both; }
        .picker-title { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 300; color: #f0f0f0; letter-spacing: -0.5px; margin-bottom: 6px; }
        .picker-sub { font-size: 13.5px; color: rgba(255,255,255,0.35); margin-bottom: 32px; font-weight: 300; }
        .picker-card { display: flex; align-items: center; gap: 18px; padding: 20px 22px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.02); cursor: pointer; transition: border-color 0.2s, background 0.2s, transform 0.2s; margin-bottom: 12px; text-align: left; width: 100%; }
        .picker-card:hover { transform: translateY(-3px); }
        .picker-card.immo:hover { border-color: rgba(212,168,83,0.4); background: rgba(212,168,83,0.04); }
        .picker-card.b2b:hover { border-color: rgba(124,106,247,0.4); background: rgba(124,106,247,0.04); }
        .picker-icon { width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
        .picker-name { font-size: 15px; font-weight: 600; color: #e8e8e8; margin-bottom: 3px; }
        .picker-desc { font-size: 12.5px; color: rgba(255,255,255,0.35); line-height: 1.5; }
        .picker-arrow { margin-left: auto; color: rgba(255,255,255,0.2); font-size: 18px; flex-shrink: 0; transition: transform 0.2s, color 0.2s; }
        .picker-card:hover .picker-arrow { transform: translateX(4px); color: rgba(255,255,255,0.5); }

        @media (max-width: 768px) {
          .page { grid-template-columns: 1fr; overflow: auto; }
          .panel-left { display: none; }
          .panel-right { padding: 48px 28px; min-height: 100vh; align-items: center; }
          body { overflow: auto; }
        }
      `}</style>

      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

      <div className="page">

        {/* ── Panneau gauche ── */}
        <div className="panel-left">
          <div className="panel-grid" />
          <div className="panel-brand">
            <div className="logo">ProspectBot</div>
          </div>
          <div className="panel-center">
            <div className="panel-tag">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3ecf8e', display: 'inline-block' }} />
              340+ agents actifs
            </div>
            <h2 className="panel-headline">
              Scraping, matching<br />et publication <em>automatisés.</em>
            </h2>
            <p className="panel-sub">
              Scraping d'annonces, matching acheteurs et publication multi-sites — tout ce dont un agent immobilier a besoin.
            </p>
            <div className="module-cards">
              <div className="module-card">
                <div className="module-icon">🏠</div>
                <div className="module-name">Scraping annonces</div>
                <div className="module-desc">Récupérez les nouvelles annonces automatiquement depuis toutes les sources</div>
                <div className="module-dot" style={{ background: '#d4a853' }} />
              </div>
              <div className="module-card">
                <div className="module-icon">🎯</div>
                <div className="module-name">Matching acheteurs</div>
                <div className="module-desc">Associez chaque bien au bon acheteur en quelques secondes</div>
                <div className="module-dot" style={{ background: '#d4a853' }} />
              </div>
            </div>
          </div>
          <div className="panel-stats">
            <div>
              <div className="pstat-value">340+</div>
              <div className="pstat-label">Agents actifs</div>
            </div>
            <div>
              <div className="pstat-value">3h</div>
              <div className="pstat-label">Gagnées / jour</div>
            </div>
            <div>
              <div className="pstat-value">94%</div>
              <div className="pstat-label">Satisfaction</div>
            </div>
          </div>
        </div>

        {/* ── Panneau droit ── */}
        <div className="panel-right">

          {/* ── Formulaire de connexion ── */}
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
                    <button type="button" className="toggle-btn" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                      {showPassword ? (
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                </div>
                <button type="submit" className="submit-btn" disabled={loading || !form.email || !form.password}>
                  {loading ? (<><span className="spinner" /> Connexion…</>) : ('Se connecter →')}
                </button>
              </form>

              <div className="form-footer">
                <p>
                  Accès réservé aux agents autorisés.<br />
                  Contactez votre administrateur pour obtenir vos identifiants.
                </p>
                <div className="hint-box">
                  <strong>Identifiants par défaut</strong>
                  Email : <code>admin@prospectbot.fr</code><br />
                  Mot de passe : <code>admin123</code><br />
                  <span style={{ fontSize: 11, marginTop: 6, display: 'block' }}>
                    Modifiez via <code>ADMIN_EMAIL</code> et <code>ADMIN_PASSWORD</code>
                  </span>
                </div>
              </div>
            </div>

        </div>
      </div>
    </>
  );
}
