// pages/upgrade.js
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/useAuth';

const PLANS = [
  {
    id: 'gratuit',
    name: 'Gratuit',
    price: '0€',
    period: '',
    color: '#6b6b78',
    accentBg: 'rgba(107,107,120,0.06)',
    accentBorder: 'rgba(107,107,120,0.3)',
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

export default function UpgradePage() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const { agent, plan: currentPlan } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pré-sélectionne le plan suivant
  useEffect(() => {
    if (currentPlan === 'gratuit') setSelectedPlan('pro');
    else if (currentPlan === 'pro') setSelectedPlan('agence');
    else setSelectedPlan('pro');
  }, [currentPlan]);

  // Particles
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

  const handleUpgrade = async () => {
    if (selectedPlan === 'gratuit') return router.push('/immobilier');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Erreur. Réessaie.');
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
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
        <title>Changer de plan — ProspectBot</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #080809; color: #e8e8e8; min-height: 100vh; }
        body::before {
          content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 1000;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          opacity: 0.4;
        }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '100%', maxWidth: 560, animation: 'fadeUp 0.6s both' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <a href="/immobilier" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: '#d4a853', fontStyle: 'italic', textDecoration: 'none', letterSpacing: 1 }}>
              ProspectBot
            </a>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 38, fontWeight: 300, color: '#f0f0f0', letterSpacing: '-0.5px', margin: '16px 0 8px' }}>
              Changer de plan
            </h1>
            {agent && (
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.35)', fontWeight: 300 }}>
                Connecté en tant que <span style={{ color: '#d4a853' }}>{agent.name}</span> — Plan actuel : <span style={{ color: 'rgba(255,255,255,0.6)' }}>{currentPlan || 'Gratuit'}</span>
              </p>
            )}
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'rgba(240,68,68,0.08)', border: '1px solid rgba(240,68,68,0.25)', borderRadius: 10, fontSize: 13, color: '#f04444', marginBottom: 24 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(240,68,68,0.2)', border: '1px solid rgba(240,68,68,0.4)', color: '#f04444', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>!</div>
              {error}
            </div>
          )}

          {/* Plans */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {PLANS.map(p => {
              const isCurrent = p.id === currentPlan;
              const isSelected = selectedPlan === p.id;
              return (
                <div key={p.id}
                  style={{
                    borderRadius: 12, padding: '16px 18px', cursor: isCurrent ? 'default' : 'pointer',
                    border: `1px solid ${isSelected ? p.accentBorder : 'rgba(255,255,255,0.08)'}`,
                    background: isSelected ? p.accentBg : 'rgba(255,255,255,0.02)',
                    opacity: isCurrent && !isSelected ? 0.5 : 1,
                    position: 'relative', transition: 'all 0.2s',
                  }}
                  onClick={() => !isCurrent && setSelectedPlan(p.id)}
                >
                  {p.badge && !isCurrent && (
                    <div style={{ position: 'absolute', top: -9, right: 14, fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 999, background: 'linear-gradient(135deg, #8b6914, #d4a853)', color: '#0a0a0a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {p.badge}
                    </div>
                  )}
                  {isCurrent && (
                    <div style={{ position: 'absolute', top: -9, right: 14, fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Plan actuel
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingRight: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${isSelected ? p.color : 'rgba(255,255,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />}
                      </div>
                      <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 400, color: p.color }}>{p.name}</span>
                    </div>
                    <div>
                      <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 500, color: p.color }}>{p.price}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans, sans-serif' }}>{p.period}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {p.features.map(f => (
                      <span key={f} style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', borderRadius: 4, padding: '2px 7px' }}>✓ {f}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <button
            onClick={handleUpgrade}
            disabled={loading || selectedPlan === currentPlan}
            style={{
              width: '100%', padding: 14,
              background: selectedPlan === currentPlan ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #8b6914, #d4a853)',
              border: 'none', borderRadius: 10,
              fontSize: 14.5, fontWeight: 600,
              color: selectedPlan === currentPlan ? 'rgba(255,255,255,0.25)' : '#0a0a0a',
              cursor: selectedPlan === currentPlan || loading ? 'not-allowed' : 'pointer',
              fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.3px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? (
              <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(10,10,10,0.3)', borderTopColor: '#0a0a0a', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Chargement...</>
            ) : selectedPlan === currentPlan ? (
              'Plan déjà actif'
            ) : selectedPlan === 'gratuit' ? (
              'Retour au dashboard →'
            ) : (
              `Passer au plan ${plan?.name} — ${plan?.price}${plan?.period} →`
            )}
          </button>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>
            <a href="/immobilier" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>← Retour au dashboard</a>
          </p>
        </div>
      </div>
    </>
  );
}
