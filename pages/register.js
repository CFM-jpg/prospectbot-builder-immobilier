// pages/register.js
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

const PLANS = [
  {
    id: 'gratuit',
    name: 'Gratuit',
    price: '0€',
    period: '',
    color: '#6b7280',
    accentBg: 'rgba(107,114,128,0.06)',
    accentBorder: 'rgba(107,114,128,0.3)',
    features: ['5 acheteurs max', 'Scraping limité', 'Accès basique'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '59€',
    period: '/mois',
    badge: 'Populaire',
    color: '#d4a853',
    accentBg: 'rgba(212,168,83,0.06)',
    accentBorder: 'rgba(212,168,83,0.4)',
    features: ['Acheteurs illimités', 'Scraping illimité', 'Alertes email', 'Match automatique', 'Publication multi-sites', 'Génération IA', 'CRM'],
  },
  {
    id: 'agence',
    name: 'Agence',
    price: '169€',
    period: '/mois',
    badge: 'Complet',
    color: '#e8c96a',
    accentBg: 'rgba(232,201,106,0.06)',
    accentBorder: 'rgba(232,201,106,0.4)',
    features: ['Tout Pro inclus', 'Stats avancées', 'Module B2B', 'Support prioritaire'],
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      r: Math.random() * 1.5 + 0.5, alpha: Math.random() * 0.35 + 0.08,
    }));
    let frame;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,168,83,${p.alpha})`; ctx.fill();
      });
      particles.forEach((p, i) => {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = p.x - particles[j].x, dy = p.y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(212,168,83,${0.07 * (1 - dist / 130)})`; ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      });
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); };
  }, []);

  const handleInfoSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.password) return setError('Tous les champs sont requis.');
    if (form.password !== form.confirm) return setError('Les mots de passe ne correspondent pas.');
    if (form.password.length < 6) return setError('Mot de passe trop court (6 caractères minimum).');
    setStep(2);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, plan: selectedPlan }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Erreur lors de la création du compte.');
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        router.push('/login?registered=1');
      }
    } catch {
      setError('Erreur réseau. Réessaie.');
    } finally {
      setLoading(false);
    }
  };

  const plan = PLANS.find(p => p.id === selectedPlan);

  return (
    <>
      <Head>
        <title>Créer un compte — ProspectBot</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'DM Sans', sans-serif; background: #080809; color: #e8e8e8; min-height: 100vh; }
        body::before {
          content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 1000;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          opacity: 0.4;
        }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        @keyframes spin { to { transform: rotate(360deg); } }

        .page { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; position: relative; z-index: 1; }

        .panel-left { display: flex; flex-direction: column; justify-content: space-between; padding: 52px 56px; position: relative; overflow: hidden; border-right: 1px solid rgba(255,255,255,0.06); }
        .panel-left::after { content: ''; position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); width: 500px; height: 500px; background: radial-gradient(circle, rgba(212,168,83,0.07) 0%, transparent 70%); pointer-events: none; }
        .panel-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px); background-size: 48px 48px; }
        .panel-brand { position: relative; z-index: 1; animation: fadeUp 0.7s 0.1s both; }
        .logo { font-family: 'Cormorant Garamond', serif; font-size: 22px; color: #d4a853; letter-spacing: 1px; font-style: italic; }
        .panel-center { position: relative; z-index: 1; animation: fadeUp 0.7s 0.2s both; }
        .panel-tag { display: inline-flex; align-items: center; gap: 8px; background: rgba(212,168,83,0.1); border: 1px solid rgba(212,168,83,0.25); border-radius: 30px; padding: 5px 14px; font-size: 11.5px; color: #d4a853; letter-spacing: 0.5px; margin-bottom: 24px; }
        .panel-headline { font-family: 'Cormorant Garamond', serif; font-size: clamp(34px, 3.5vw, 44px); font-weight: 300; line-height: 1.1; letter-spacing: -0.5px; color: #f0f0f0; margin-bottom: 18px; }
        .panel-headline em { font-style: italic; background: linear-gradient(135deg, #8b6914, #d4a853, #f0d080); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .panel-sub { font-size: 14.5px; color: rgba(255,255,255,0.4); line-height: 1.7; max-width: 340px; font-weight: 300; }
        .panel-stats { position: relative; z-index: 1; display: flex; gap: 36px; animation: fadeUp 0.7s 0.3s both; }
        .pstat-value { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 500; color: #d4a853; letter-spacing: -1px; line-height: 1; }
        .pstat-label { font-size: 11px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }

        .perks { margin-top: 28px; display: flex; flex-direction: column; gap: 12px; }
        .perk { display: flex; align-items: center; gap: 12px; }
        .perk-check { width: 20px; height: 20px; border-radius: 50%; background: rgba(212,168,83,0.12); border: 1px solid rgba(212,168,83,0.3); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .perk-text { font-size: 14px; color: rgba(255,255,255,0.45); font-weight: 300; }

        .panel-right { display: flex; align-items: flex-start; justify-content: center; padding: 52px 56px; overflow-y: auto; min-height: 100vh; }
        .form-wrapper { width: 100%; max-width: 400px; animation: fadeUp 0.7s 0.15s both; padding-bottom: 40px; }

        .stepper { display: flex; align-items: center; margin-bottom: 36px; }
        .step-item { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.25); transition: color 0.3s; }
        .step-item.active { color: #d4a853; }
        .step-item.done { color: rgba(212,168,83,0.5); }
        .step-num { width: 22px; height: 22px; border-radius: 50%; border: 1.5px solid currentColor; display: flex; align-items: center; justify-content: center; font-size: 10px; flex-shrink: 0; }
        .step-line { flex: 1; height: 1px; background: rgba(255,255,255,0.08); margin: 0 14px; }

        .form-header { margin-bottom: 32px; }
        .form-title { font-family: 'Cormorant Garamond', serif; font-size: 36px; font-weight: 300; color: #f0f0f0; letter-spacing: -0.5px; margin-bottom: 6px; }
        .form-subtitle { font-size: 13.5px; color: rgba(255,255,255,0.4); font-weight: 300; }

        .error-box { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: rgba(240,68,68,0.08); border: 1px solid rgba(240,68,68,0.25); border-radius: 10px; font-size: 13px; color: #f04444; margin-bottom: 24px; animation: shake 0.3s ease; }
        .error-icon { width: 18px; height: 18px; border-radius: 50%; background: rgba(240,68,68,0.2); border: 1px solid rgba(240,68,68,0.4); color: #f04444; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

        .success-box { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: rgba(62,207,142,0.08); border: 1px solid rgba(62,207,142,0.25); border-radius: 10px; font-size: 13px; color: #3ecf8e; margin-bottom: 24px; }

        .field { margin-bottom: 20px; }
        .field-label { display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.2px; color: rgba(255,255,255,0.35); margin-bottom: 8px; }
        .field-input { width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 13px 16px; font-size: 14px; color: #e8e8e8; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s, background 0.2s; }
        .field-input:focus { border-color: rgba(212,168,83,0.5); background: rgba(212,168,83,0.03); }
        .field-input::placeholder { color: rgba(255,255,255,0.2); }
        .field-input-wrap { position: relative; }
        .field-input.has-toggle { padding-right: 44px; }
        .toggle-btn { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.3); padding: 0; }
        .toggle-btn:hover { color: rgba(255,255,255,0.6); }

        .submit-btn { width: 100%; padding: 14px; background: linear-gradient(135deg, #8b6914, #d4a853); border: none; border-radius: 10px; font-size: 14.5px; font-weight: 600; color: #0a0a0a; cursor: pointer; font-family: 'DM Sans', sans-serif; letter-spacing: 0.3px; transition: opacity 0.2s, transform 0.2s; margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .submit-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(10,10,10,0.3); border-top-color: #0a0a0a; border-radius: 50%; animation: spin 0.7s linear infinite; }

        .plans-grid { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
        .plan-card { border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); padding: 16px 18px; cursor: pointer; position: relative; transition: all 0.2s; background: rgba(255,255,255,0.02); }
        .plan-card:hover { border-color: rgba(212,168,83,0.25); }
        .plan-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; padding-right: 28px; }
        .plan-name-wrap { display: flex; align-items: center; gap: 10px; }
        .plan-radio { width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: border-color 0.2s; }
        .plan-radio-dot { width: 8px; height: 8px; border-radius: 50%; }
        .plan-name { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 400; }
        .plan-price { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 500; }
        .plan-period { font-size: 11px; color: rgba(255,255,255,0.3); font-family: 'DM Sans', sans-serif; }
        .plan-badge { position: absolute; top: -9px; right: 14px; font-size: 10px; font-weight: 700; padding: 2px 10px; border-radius: 999px; letter-spacing: 0.5px; text-transform: uppercase; background: linear-gradient(135deg, #8b6914, #d4a853); color: #0a0a0a; }
        .plan-feats { display: flex; flex-wrap: wrap; gap: 5px; }
        .plan-feat { font-size: 11px; color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.04); border-radius: 4px; padding: 2px 7px; }

        .btn-row { display: flex; gap: 10px; margin-top: 4px; }
        .btn-back { flex: 0 0 auto; padding: 14px 18px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.4); cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
        .btn-back:hover { border-color: rgba(255,255,255,0.18); color: rgba(255,255,255,0.7); }
        .btn-row .submit-btn { flex: 1; margin-top: 0; }

        .form-footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; font-size: 13px; color: rgba(255,255,255,0.25); }
        .form-footer a { color: #d4a853; text-decoration: none; font-weight: 500; }
        .form-footer a:hover { text-decoration: underline; }

        @media (max-width: 768px) {
          .page { grid-template-columns: 1fr; }
          .panel-left { display: none; }
          .panel-right { padding: 40px 24px; min-height: 100vh; align-items: flex-start; }
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
              Rejoignez les agents<br />qui automatisent <em>leur prospection.</em>
            </h2>
            <p className="panel-sub">
              Scraping d'annonces, matching acheteurs et publication multi-sites — tout ce dont un agent immobilier a besoin.
            </p>
            <div className="perks">
              {[
                'Démarrez gratuitement, sans carte bancaire',
                'Passez Pro en 1 clic quand vous êtes prêt',
                'Résiliez ou changez de plan à tout moment',
                'Données 100% sécurisées sur Supabase',
              ].map(t => (
                <div className="perk" key={t}>
                  <div className="perk-check">
                    <svg width="10" height="10" fill="none" stroke="#d4a853" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <span className="perk-text">{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="panel-stats">
            <div><div className="pstat-value">340+</div><div className="pstat-label">Agents actifs</div></div>
            <div><div className="pstat-value">3h</div><div className="pstat-label">Gagnées / jour</div></div>
            <div><div className="pstat-value">94%</div><div className="pstat-label">Satisfaction</div></div>
          </div>
        </div>

        {/* ── Panneau droit ── */}
        <div className="panel-right">
          <div className="form-wrapper">

            <div className="stepper">
              <div className={`step-item ${step === 1 ? 'active' : 'done'}`}>
                <div className="step-num">{step > 1 ? '✓' : '1'}</div>
                Informations
              </div>
              <div className="step-line" />
              <div className={`step-item ${step === 2 ? 'active' : ''}`}>
                <div className="step-num">2</div>
                Votre plan
              </div>
            </div>

            <div className="form-header">
              <h1 className="form-title">{step === 1 ? 'Créer un compte' : 'Choisir un plan'}</h1>
              <p className="form-subtitle">
                {step === 1 ? 'Renseignez vos informations de connexion' : 'Modifiable à tout moment depuis votre dashboard'}
              </p>
            </div>

            {error && <div className="error-box"><div className="error-icon">!</div>{error}</div>}
            {router.query.registered === '1' && !error && (
              <div className="success-box">✓ Compte créé. Connectez-vous.</div>
            )}

            {step === 1 && (
              <form onSubmit={handleInfoSubmit} autoComplete="off">
                <div className="field">
                  <label className="field-label">Nom complet</label>
                  <input className="field-input" type="text" placeholder="Jean Dupont" autoFocus
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="field">
                  <label className="field-label">Adresse email</label>
                  <input className="field-input" type="email" placeholder="jean@agence.fr"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="field">
                  <label className="field-label">Mot de passe</label>
                  <div className="field-input-wrap">
                    <input className="field-input has-toggle" type={showPassword ? 'text' : 'password'}
                      placeholder="6 caractères minimum" value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })} />
                    <button type="button" className="toggle-btn" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                      {showPassword
                        ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                    </button>
                  </div>
                </div>
                <div className="field">
                  <label className="field-label">Confirmer le mot de passe</label>
                  <input className="field-input" type="password" placeholder="••••••••"
                    value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} />
                </div>
                <button type="submit" className="submit-btn"
                  disabled={!form.name || !form.email || !form.password || !form.confirm}>
                  Continuer →
                </button>
              </form>
            )}

            {step === 2 && (
              <div>
                <div className="plans-grid">
                  {PLANS.map(p => (
                    <div key={p.id}
                      className="plan-card"
                      style={selectedPlan === p.id
                        ? { borderColor: p.accentBorder, background: p.accentBg }
                        : {}}
                      onClick={() => setSelectedPlan(p.id)}
                    >
                      {p.badge && <div className="plan-badge">{p.badge}</div>}
                      <div className="plan-top">
                        <div className="plan-name-wrap">
                          <div className="plan-radio"
                            style={selectedPlan === p.id ? { borderColor: p.color } : {}}>
                            {selectedPlan === p.id && <div className="plan-radio-dot" style={{ background: p.color }} />}
                          </div>
                          <span className="plan-name" style={{ color: p.color }}>{p.name}</span>
                        </div>
                        <div>
                          <span className="plan-price" style={{ color: p.color }}>{p.price}</span>
                          <span className="plan-period">{p.period}</span>
                        </div>
                      </div>
                      <div className="plan-feats">
                        {p.features.map(f => <span key={f} className="plan-feat">✓ {f}</span>)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="btn-row">
                  <button className="btn-back" onClick={() => { setStep(1); setError(''); }}>← Retour</button>
                  <button className="submit-btn" onClick={handleFinalSubmit} disabled={loading}>
                    {loading
                      ? <><span className="spinner" />Chargement...</>
                      : selectedPlan === 'gratuit'
                        ? 'Créer mon compte gratuit →'
                        : `Payer ${plan?.price}${plan?.period} →`}
                  </button>
                </div>
              </div>
            )}

            <div className="form-footer">
              <p>Déjà un compte ? <a href="/login">Se connecter</a></p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
