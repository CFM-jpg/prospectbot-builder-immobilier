import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

// ─── Lead capture API (simple Supabase insert) ────────────────────────────────
async function saveLead(data) {
  try {
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch {}
}

// ─── Hook scroll reveal ───────────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

// ─── Animated counter ────────────────────────────────────────────────────────
function Counter({ target, suffix = '', duration = 1800 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setVal(Math.floor(eased * target));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, duration]);
  return <span ref={ref}>{val.toLocaleString('fr-FR')}{suffix}</span>;
}

// ─── Live demo simulator ──────────────────────────────────────────────────────
const DEMO_BIENS = [
  { titre: 'Appartement 3P Haussmannien', ville: 'Paris 8e', prix: '680 000 €', surface: '78m²', dpe: 'C', source: 'SeLoger' },
  { titre: 'Maison avec jardin', ville: 'Lyon Confluence', prix: '420 000 €', surface: '112m²', dpe: 'B', source: 'LeBonCoin' },
  { titre: 'Studio vue mer', ville: 'Nice Promenade', prix: '195 000 €', surface: '28m²', dpe: 'D', source: 'BienIci' },
  { titre: 'Loft industriel rénové', ville: 'Bordeaux Saint-Michel', prix: '340 000 €', surface: '95m²', dpe: 'B', source: 'SeLoger' },
];
const DEMO_ACHETEURS = [
  { nom: 'Marie D.', budget: '700 000 €', type: 'Appartement', ville: 'Paris', surface: '70m²+' },
  { nom: 'Thomas L.', budget: '450 000 €', type: 'Maison', ville: 'Lyon', surface: '90m²+' },
];

function LiveDemo() {
  const [step, setStep] = useState(0);
  const [matching, setMatching] = useState(false);
  const [matches, setMatches] = useState([]);
  const [bienIdx, setBienIdx] = useState(0);
  const [scanLine, setScanLine] = useState(0);

  useEffect(() => {
    if (step !== 1) return;
    const interval = setInterval(() => {
      setBienIdx(i => (i + 1) % DEMO_BIENS.length);
    }, 800);
    setTimeout(() => {
      clearInterval(interval);
      setMatching(true);
      setTimeout(() => {
        setMatches([
          { bien: DEMO_BIENS[0], acheteur: DEMO_ACHETEURS[0], score: 94 },
          { bien: DEMO_BIENS[1], acheteur: DEMO_ACHETEURS[1], score: 87 },
        ]);
        setStep(2);
        setMatching(false);
      }, 1200);
    }, DEMO_BIENS.length * 800 + 400);
  }, [step]);

  useEffect(() => {
    if (!matching) return;
    const i = setInterval(() => setScanLine(l => (l + 1) % 100), 16);
    return () => clearInterval(i);
  }, [matching]);

  const reset = () => { setStep(0); setMatches([]); setBienIdx(0); setMatching(false); };

  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,168,83,0.2)', borderRadius: 20, overflow: 'hidden', maxWidth: 720, margin: '0 auto' }}>
      {/* Terminal header */}
      <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
        <span style={{ marginLeft: 12, fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>ProspectBot — Live Demo</span>
      </div>

      <div style={{ padding: '28px 32px' }}>
        {step === 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <svg width="36" height="36" fill="none" stroke="rgba(212,168,83,0.6)" strokeWidth="1.2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="8 21 12 17 16 21"/></svg>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, marginBottom: 8, fontFamily: 'DM Sans, sans-serif' }}>
              Voyez ProspectBot en action
            </p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 28, fontFamily: 'DM Sans, sans-serif' }}>
              Simulation réelle : scraping → matching → résultats
            </p>
            <button onClick={() => setStep(1)}
              style={{ background: 'linear-gradient(135deg, #8b6914, #d4a853)', color: '#0a0a0a', border: 'none', borderRadius: 12, padding: '13px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', boxShadow: '0 0 40px rgba(212,168,83,0.3)' }}>
              ▶ Lancer la démo
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3ecf8e', boxShadow: '0 0 8px #3ecf8e', animation: 'pulse 1s infinite' }} />
              <span style={{ color: '#3ecf8e', fontSize: 13, fontFamily: 'monospace' }}>Scraping en cours — {DEMO_BIENS.length} sites analysés</span>
            </div>
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', padding: 20, marginBottom: 16 }}>
              {matching && (
                <div style={{ position: 'absolute', left: 0, top: `${scanLine}%`, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #d4a853, transparent)', opacity: 0.8, zIndex: 10, transition: 'top 0.016s linear' }} />
              )}
              <div style={{ fontFamily: 'monospace', fontSize: 13 }}>
                {DEMO_BIENS.map((b, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', opacity: matching || i <= bienIdx ? 1 : 0.2, transition: 'opacity 0.3s', color: i === bienIdx && !matching ? '#d4a853' : 'rgba(255,255,255,0.6)' }}>
                    <span>{b.titre}</span>
                    <span style={{ color: '#3ecf8e' }}>{b.prix}</span>
                  </div>
                ))}
              </div>
              {matching && (
                <div style={{ textAlign: 'center', paddingTop: 16 }}>
                  <span style={{ color: '#d4a853', fontSize: 13, fontFamily: 'monospace' }}>Calcul des correspondances…</span>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <svg width="16" height="16" fill="none" stroke="#3ecf8e" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              <span style={{ color: '#3ecf8e', fontSize: 14, fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>{matches.length} correspondances trouvées — emails envoyés automatiquement</span>
            </div>
            {matches.map((m, i) => (
              <div key={i} style={{ background: 'rgba(212,168,83,0.06)', border: '1px solid rgba(212,168,83,0.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 12, animation: `fadeUp 0.4s ${i * 0.15}s both` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: 4, fontFamily: 'DM Sans, sans-serif' }}>{m.bien.titre}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif' }}>{m.bien.ville} · {m.bien.prix} · {m.bien.source}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 24, fontFamily: 'Cormorant Garamond, serif', color: '#d4a853', fontWeight: 600 }}>{m.score}%</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans, sans-serif' }}>match</div>
                  </div>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg, #8b6914, #d4a853)', borderRadius: 2, width: `${m.score}%`, transition: 'width 1s ease' }} />
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(212,168,83,0.8)', fontFamily: 'DM Sans, sans-serif' }}>
                  — Email envoyé à {m.acheteur.nom}
                </div>
              </div>
            ))}
            <button onClick={reset} style={{ marginTop: 8, background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 18px', color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>↺ Rejouer</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Floating CTA ─────────────────────────────────────────────────────────────
function FloatingCTA({ onCapture }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!dismissed) setVisible(true);
    }, 18000);
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 1.5 && !dismissed) setVisible(true);
    };
    window.addEventListener('scroll', onScroll);
    return () => { clearTimeout(timer); window.removeEventListener('scroll', onScroll); };
  }, [dismissed]);

  if (!visible || dismissed) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await saveLead({ email, type: 'floating_cta', source: 'landing' });
    setSent(true);
    onCapture?.({ email });
    setTimeout(() => setDismissed(true), 2000);
  };

  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 900, animation: 'slideUp 0.4s ease' }}>
      <div style={{ background: '#111113', border: '1px solid rgba(212,168,83,0.4)', borderRadius: 16, padding: '20px 24px', width: 300, boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(212,168,83,0.1)' }}>
        <button onClick={() => setDismissed(true)} style={{ position: 'absolute', top: 12, right: 14, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
        {!sent ? (
          <>
            <div style={{ marginBottom: 8 }}>
              <svg width="20" height="20" fill="none" stroke="#d4a853" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#e8e8e8', fontFamily: 'DM Sans, sans-serif', marginBottom: 6 }}>Essai gratuit 14 jours</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif', marginBottom: 14 }}>Rejoignez 340+ agents qui automatisent leur prospection</p>
            <form onSubmit={handleSubmit}>
              <input type="email" required placeholder="votre@email.fr" value={email} onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 13px', color: '#e8e8e8', fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
              <button type="submit" style={{ width: '100%', background: 'linear-gradient(135deg, #8b6914, #d4a853)', color: '#0a0a0a', border: 'none', borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                Démarrer gratuitement →
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <svg width="28" height="28" fill="none" stroke="#3ecf8e" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="20 6 9 17 4 12" stroke="#3ecf8e"/></svg>
            </div>
            <p style={{ color: '#3ecf8e', fontSize: 14, fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>Parfait ! On vous contacte sous 24h.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const [heroEmail, setHeroEmail] = useState('');
  // ✅ MODIF — Suppression heroProfile (tabs supprimés), ajout heroSecteur
  const [heroSecteur, setHeroSecteur] = useState('');
  const [heroSent, setHeroSent] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [capturedLeads, setCapturedLeads] = useState(0);

  useScrollReveal();

  // Canvas particles background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.4 + 0.1,
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
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(212,168,83,${0.08 * (1 - dist / 120)})`;
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

  // Scroll nav
  useEffect(() => {
    const fn = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Testimonial auto-rotate
  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(i => (i + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);

  // ✅ MODIF — handleHeroSubmit simplifié (plus de heroProfile)
  const handleHeroSubmit = async (e) => {
    e.preventDefault();
    await saveLead({ email: heroEmail, secteur: heroSecteur, profile: 'agent', source: 'hero', type: 'hero_cta' });
    setHeroSent(true);
    setCapturedLeads(l => l + 1);
    setTimeout(() => router.push('/login'), 1500);
  };

  const handleCapture = () => setCapturedLeads(l => l + 1);

  return (
    <>
      <Head>
        <title>ProspectBot — Trouvez des mandats sans prospection manuelle</title>
        <meta name="description" content="ProspectBot surveille LeBonCoin, SeLoger et BienIci, matche chaque bien avec vos acheteurs et envoie les alertes automatiquement. Essai gratuit 14 jours." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #080809; color: #e8e8e8; font-family: 'DM Sans', sans-serif; overflow-x: hidden; }

        /* Grain overlay */
        body::before {
          content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 1000;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          opacity: 0.4;
        }

        /* Scroll reveal */
        [data-reveal] { opacity: 0; transform: translateY(28px); transition: opacity 0.7s ease, transform 0.7s ease; }
        [data-reveal][data-delay="1"] { transition-delay: 0.1s; }
        [data-reveal][data-delay="2"] { transition-delay: 0.2s; }
        [data-reveal][data-delay="3"] { transition-delay: 0.3s; }
        [data-reveal][data-delay="4"] { transition-delay: 0.4s; }
        [data-reveal][data-delay="5"] { transition-delay: 0.5s; }
        [data-reveal][data-delay="6"] { transition-delay: 0.6s; }
        [data-reveal].revealed { opacity: 1; transform: translateY(0); }

        /* Animations */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes heroReveal { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes glowPulse { 0%, 100% { box-shadow: 0 0 40px rgba(212,168,83,0.2); } 50% { box-shadow: 0 0 80px rgba(212,168,83,0.4); } }

        /* Nav */
        .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 20px 48px; display: flex; align-items: center; justify-content: space-between; transition: all 0.3s; }
        .nav.scrolled { background: rgba(8,8,9,0.9); backdrop-filter: blur(12px); padding: 14px 48px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .nav-logo { font-family: 'Cormorant Garamond', serif; font-size: 22px; color: #d4a853; letter-spacing: 1px; font-style: italic; }
        .nav-links { display: flex; align-items: center; gap: 32px; }
        .nav-link { font-size: 13.5px; color: rgba(255,255,255,0.5); text-decoration: none; transition: color 0.2s; letter-spacing: 0.3px; }
        .nav-link:hover { color: #d4a853; }
        .nav-cta { background: linear-gradient(135deg, #8b6914, #d4a853); color: #0a0a0a; border: none; borderRadius: 10px; padding: 9px 22px; font-size: 13.5px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; border-radius: 10px; transition: transform 0.2s, box-shadow 0.2s; }
        .nav-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(212,168,83,0.35); }

        /* Sections */
        section { position: relative; z-index: 2; }

        /* Hero */
        .hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 120px 48px 80px; text-align: center; position: relative; overflow: hidden; }
        .hero-glow { position: absolute; top: 30%; left: 50%; transform: translate(-50%, -50%); width: 600px; height: 600px; background: radial-gradient(ellipse, rgba(212,168,83,0.08) 0%, transparent 70%); pointer-events: none; }
        .hero-tag { display: inline-flex; align-items: center; gap: 8px; background: rgba(212,168,83,0.1); border: 1px solid rgba(212,168,83,0.25); border-radius: 30px; padding: 6px 16px; font-size: 12.5px; color: #d4a853; letter-spacing: 0.5px; margin-bottom: 28px; animation: heroReveal 0.8s 0.1s both; }
        .hero-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(52px, 7vw, 88px); font-weight: 300; line-height: 1.05; letter-spacing: -1px; color: #f0f0f0; margin-bottom: 20px; animation: heroReveal 0.8s 0.2s both; }
        .hero-title em { font-style: italic; background: linear-gradient(135deg, #8b6914, #d4a853, #f0d080); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .hero-sub { font-size: 18px; color: rgba(255,255,255,0.45); line-height: 1.7; max-width: 560px; margin: 0 auto 40px; font-weight: 300; animation: heroReveal 0.8s 0.3s both; }
        .hero-form { animation: heroReveal 0.8s 0.4s both; }

        /* Capture form */
        .capture-form { display: flex; flex-direction: column; gap: 10px; max-width: 460px; margin: 0 auto; }
        .capture-input { width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 13px 18px; color: #e8e8e8; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s; }
        .capture-input:focus { border-color: rgba(212,168,83,0.5); }
        .capture-input::placeholder { color: rgba(255,255,255,0.3); }
        .capture-btn { background: linear-gradient(135deg, #8b6914, #d4a853); color: #0a0a0a; border: none; border-radius: 12px; padding: 15px 24px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; white-space: nowrap; transition: transform 0.2s, box-shadow 0.2s; animation: glowPulse 3s infinite; width: 100%; }
        .capture-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(212,168,83,0.4); }

        /* Stats band */
        .stats-band { padding: 60px 48px; border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); max-width: 900px; margin: 0 auto; text-align: center; gap: 40px; }
        .stat-num { font-family: 'Cormorant Garamond', serif; font-size: 52px; font-weight: 500; color: #d4a853; line-height: 1; }
        .stat-label { font-size: 13px; color: rgba(255,255,255,0.4); margin-top: 6px; letter-spacing: 0.3px; }

        /* Section layout */
        .section { padding: 100px 48px; max-width: 1100px; margin: 0 auto; }
        .section-tag { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #d4a853; margin-bottom: 16px; }
        .section-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(36px, 4vw, 52px); font-weight: 300; line-height: 1.15; color: #f0f0f0; margin-bottom: 20px; }
        .section-title em { font-style: italic; color: #d4a853; }
        .section-sub { font-size: 16px; color: rgba(255,255,255,0.45); line-height: 1.7; max-width: 540px; font-weight: 300; }

        /* Features */
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 56px; }
        .feature-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 28px; transition: border-color 0.3s, transform 0.3s; }
        .feature-card:hover { border-color: rgba(212,168,83,0.3); transform: translateY(-4px); }
        .feature-icon { font-size: 28px; margin-bottom: 16px; display: block; animation: float 4s ease-in-out infinite; }
        .feature-title { font-size: 16px; font-weight: 600; color: #e8e8e8; margin-bottom: 10px; }
        .feature-desc { font-size: 13.5px; color: rgba(255,255,255,0.4); line-height: 1.65; }
        .feature-tag { display: inline-block; margin-top: 14px; padding: 3px 10px; background: rgba(212,168,83,0.1); border: 1px solid rgba(212,168,83,0.2); border-radius: 20px; font-size: 11px; color: #d4a853; }

        /* How it works */
        .steps-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; margin-top: 56px; position: relative; }
        .steps-grid::before { content: ''; position: absolute; top: 28px; left: 10%; right: 10%; height: 1px; background: linear-gradient(90deg, transparent, rgba(212,168,83,0.3), transparent); }
        .step-item { text-align: center; padding: 0 20px; }
        .step-num { width: 56px; height: 56px; border-radius: 50%; background: rgba(212,168,83,0.08); border: 1px solid rgba(212,168,83,0.3); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-family: 'Cormorant Garamond', serif; font-size: 22px; color: #d4a853; position: relative; z-index: 2; }
        .step-title { font-size: 14px; font-weight: 600; color: #e8e8e8; margin-bottom: 8px; }
        .step-desc { font-size: 13px; color: rgba(255,255,255,0.35); line-height: 1.6; }

        /* Testimonials */
        .testimonials-section { padding: 100px 48px; background: linear-gradient(180deg, transparent, rgba(212,168,83,0.03), transparent); }
        .testimonials-inner { max-width: 800px; margin: 0 auto; }
        .testimonial-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(212,168,83,0.15); border-radius: 20px; padding: 40px 48px; position: relative; }
        .testimonial-quote { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-style: italic; color: rgba(255,255,255,0.8); line-height: 1.6; margin-bottom: 24px; }
        .testimonial-quote::before { content: '"'; font-size: 60px; color: rgba(212,168,83,0.2); position: absolute; top: 20px; left: 40px; line-height: 1; font-family: 'Cormorant Garamond', serif; }
        .testimonial-author { display: flex; align-items: center; gap: 14px; }
        .testimonial-avatar { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #8b6914, #d4a853); display: flex; align-items: center; justify-content: center; font-size: 18px; color: #0a0a0a; font-weight: 700; }
        .testimonial-name { font-size: 14px; font-weight: 600; color: #e8e8e8; }
        .testimonial-role { font-size: 12px; color: rgba(255,255,255,0.35); margin-top: 2px; }
        .testimonial-dots { display: flex; justify-content: center; gap: 8px; margin-top: 28px; }
        .t-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.15); cursor: pointer; transition: all 0.3s; }
        .t-dot.active { background: #d4a853; transform: scale(1.3); }

        /* Profiles section */
        .profiles-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 48px; }
        .profile-card { border-radius: 16px; padding: 32px 28px; cursor: pointer; transition: all 0.3s; border: 1px solid; }
        .profile-card:hover { transform: translateY(-6px); }

        /* CTA final */
        .cta-section { padding: 120px 48px; text-align: center; position: relative; overflow: hidden; }
        .cta-bg { position: absolute; inset: 0; background: radial-gradient(ellipse at center, rgba(212,168,83,0.06) 0%, transparent 70%); pointer-events: none; }
        .cta-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(40px, 5vw, 64px); font-weight: 300; color: #f0f0f0; margin-bottom: 20px; }
        .cta-sub { font-size: 16px; color: rgba(255,255,255,0.4); margin-bottom: 40px; max-width: 460px; margin-left: auto; margin-right: auto; line-height: 1.7; }

        /* Footer */
        .footer { padding: 40px 48px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; }
        .footer-logo { font-family: 'Cormorant Garamond', serif; font-size: 18px; color: rgba(212,168,83,0.6); font-style: italic; }
        .footer-links { display: flex; gap: 24px; }
        .footer-link { font-size: 12.5px; color: rgba(255,255,255,0.25); text-decoration: none; transition: color 0.2s; }
        .footer-link:hover { color: rgba(255,255,255,0.5); }

        @media (max-width: 900px) {
          .nav { padding: 16px 24px; }
          .nav-links { display: none; }
          .hero { padding: 100px 24px 60px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .section { padding: 60px 24px; }
          .features-grid { grid-template-columns: 1fr; }
          .steps-grid { grid-template-columns: repeat(2, 1fr); gap: 32px; }
          .steps-grid::before { display: none; }
          .profiles-grid { grid-template-columns: 1fr; }
          .footer { flex-direction: column; gap: 16px; text-align: center; }
        }
      `}</style>

      {/* Canvas particles */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

      {/* Nav */}
      <nav className={`nav ${navScrolled ? 'scrolled' : ''}`}>
        <div className="nav-logo">ProspectBot</div>
        <div className="nav-links">
          <a href="#fonctionnalites" className="nav-link">Fonctionnalités</a>
          <a href="#demo" className="nav-link">Démo</a>
          <a href="#temoignages" className="nav-link">Témoignages</a>
          <a href="#tarifs" className="nav-link">Tarifs</a>
        </div>
        <button className="nav-cta" onClick={() => router.push('/login')}>Se connecter →</button>
      </nav>

      {/* ── HERO ── */}
      {/* ✅ MODIF — Nouveau hero orienté résultat, sans tabs profil */}
      <section className="hero">
        <div className="hero-glow" />
        <div style={{ position: 'relative', zIndex: 2 }}>

          {/* ✅ MODIF 1 — Tag de réassurance immédiate */}
          <div className="hero-tag">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3ecf8e', display: 'inline-block' }} />
            ✓ 340+ agents actifs · Essai gratuit 14 jours
          </div>

          {/* ✅ MODIF 2 — Headline orientée résultat */}
          <h1 className="hero-title">
            Trouvez des mandats<br />
            <em>sans prospection manuelle.</em>
          </h1>

          {/* ✅ MODIF 3 — Sous-headline centrée sur le bénéfice agent */}
          <p className="hero-sub">
            ProspectBot surveille LeBonCoin, SeLoger et BienIci, détecte les opportunités
            et contacte vos acheteurs automatiquement — pendant que vous vous concentrez sur vos clients.
          </p>

          {/* ✅ MODIF 4 — Formulaire simplifié : email + secteur, sans tabs */}
          <div className="hero-form">
            {!heroSent ? (
              <form className="capture-form" onSubmit={handleHeroSubmit}>
                <input
                  type="email"
                  required
                  placeholder="Votre email professionnel"
                  value={heroEmail}
                  onChange={e => setHeroEmail(e.target.value)}
                  className="capture-input"
                />
                <input
                  type="text"
                  placeholder="Votre secteur (ex : Angers, 49...)"
                  value={heroSecteur}
                  onChange={e => setHeroSecteur(e.target.value)}
                  className="capture-input"
                />
                <button type="submit" className="capture-btn">
                  Démarrer mon essai gratuit →
                </button>
              </form>
            ) : (
              <div style={{ padding: '16px 24px', background: 'rgba(62,207,142,0.1)', border: '1px solid rgba(62,207,142,0.3)', borderRadius: 12, display: 'inline-block', animation: 'fadeUp 0.4s ease' }}>
                <span style={{ color: '#3ecf8e', fontSize: 15, fontWeight: 600 }}>Parfait — Redirection en cours…</span>
              </div>
            )}

            {/* ✅ MODIF 5 — Ligne de réassurance plus visible et structurée */}
            <div style={{
              marginTop: 18,
              display: 'flex',
              gap: 20,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              {['✓ 14 jours gratuits', '✓ Sans carte bancaire', '✓ Mise en place en 5 min'].map((item, i) => (
                <span key={i} style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: 0.3, animation: 'float 2s ease-in-out infinite' }}>
          <div style={{ width: 1, height: 40, background: 'linear-gradient(180deg, transparent, #d4a853)' }} />
          <span style={{ fontSize: 10, letterSpacing: 2, color: '#d4a853' }}>SCROLL</span>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="stats-band">
        <div className="stats-grid">
          {[
            { num: 340, suffix: '+', label: 'Agents actifs' },
            { num: 3, suffix: 'h', label: 'Gagnées par jour' },
            { num: 28000, suffix: '+', label: 'Biens scrappés' },
            { num: 94, suffix: '%', label: 'Taux de satisfaction' },
          ].map((s, i) => (
            <div key={i} data-reveal data-delay={String(i + 1)}>
              <div className="stat-num"><Counter target={s.num} suffix={s.suffix} /></div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FONCTIONNALITÉS ── */}
      <section id="fonctionnalites">
        <div className="section">
          <div data-reveal><div className="section-tag">Fonctionnalités</div></div>
          <div data-reveal data-delay="1">
            <h2 className="section-title">Tout ce dont un agent<br /><em>a besoin, en un seul endroit.</em></h2>
          </div>
          <div data-reveal data-delay="2"><p className="section-sub">De la veille automatique à la publication multi-plateforme — ProspectBot couvre l'intégralité du workflow immobilier.</p></div>

          <div className="features-grid">
            {[
              { icon: (<svg width="22" height="22" fill="none" stroke="#d4a853" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>), title: 'Scraping automatique', desc: 'LeBonCoin, SeLoger, BienIci scraped en temps réel. Nouvelles annonces détectées en moins de 15 minutes.', tag: 'Automatique', delay: '1' },
              { icon: (<svg width="22" height="22" fill="none" stroke="#d4a853" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>), title: 'Matching intelligent', desc: 'Algorithme de scoring 0-100% par budget, surface, localisation et critères spécifiques. Chaque acheteur reçoit uniquement les biens qui lui correspondent.', tag: 'IA', delay: '2' },
              { icon: (<svg width="22" height="22" fill="none" stroke="#d4a853" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>), title: 'Alertes instantanées', desc: 'Email automatique envoyé à chaque acheteur dès qu\'un bien dépasse 60% de compatibilité. Via Brevo, delivrabilité optimale.', tag: 'Brevo', delay: '3' },
              { icon: (<svg width="22" height="22" fill="none" stroke="#d4a853" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>), title: 'Publication multi-sites', desc: 'Rédigez une annonce, publiez-la sur LeBonCoin, SeLoger, BienIci et PAP en un clic. Texte généré par IA.', tag: 'Nouveau', delay: '4' },
              { icon: (<svg width="22" height="22" fill="none" stroke="#d4a853" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>), title: 'CRM acheteurs', desc: 'Fiche complète par acheteur : critères, budget, historique des alertes reçues, correspondances en cours.', tag: 'CRM', delay: '5' },
              { icon: (<svg width="22" height="22" fill="none" stroke="#d4a853" strokeWidth="1.5" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>), title: 'Analytics & stats', desc: 'Tableau de bord temps réel : prix moyen du marché, taux de matching, évolution du portefeuille.', tag: 'Data', delay: '6' },
            ].map((f, i) => (
              <div key={i} className="feature-card" data-reveal data-delay={f.delay}>
                <span className="feature-icon" style={{ animationDelay: `${i * 0.5}s`, display: 'block', marginBottom: 16 }}>{f.icon}</span>
                <div className="feature-title">{f.title}</div>
                <p className="feature-desc">{f.desc}</p>
                <span className="feature-tag">{f.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(212,168,83,0.02)' }}>
        <div className="section">
          <div style={{ textAlign: 'center', marginBottom: 0 }}>
            <div data-reveal><div className="section-tag" style={{ textAlign: 'center' }}>Comment ça marche</div></div>
            <div data-reveal data-delay="1"><h2 className="section-title" style={{ textAlign: 'center' }}>Opérationnel en <em>4 minutes.</em></h2></div>
          </div>
          <div className="steps-grid">
            {[
              { n: '1', title: 'Créez votre compte', desc: 'Inscription en 2 minutes, aucune carte de crédit requise.', delay: '1' },
              { n: '2', title: 'Ajoutez vos acheteurs', desc: 'Budget, localisation, type de bien — les critères de matching.', delay: '2' },
              { n: '3', title: 'Lancez le scraping', desc: 'ProspectBot analyse les sites et importe automatiquement les nouvelles annonces.', delay: '3' },
              { n: '4', title: 'Recevez les matchs', desc: 'Chaque correspondance est envoyée directement à votre acheteur.', delay: '4' },
            ].map((s, i) => (
              <div key={i} className="step-item" data-reveal data-delay={s.delay}>
                <div className="step-num">{s.n}</div>
                <div className="step-title">{s.title}</div>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEMO INTERACTIVE ── */}
      <section id="demo">
        <div className="section">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
            <div>
              <div data-reveal><div className="section-tag">Démo live</div></div>
              <div data-reveal data-delay="1">
                <h2 className="section-title">Voyez-le tourner <em>en direct.</em></h2>
              </div>
              <div data-reveal data-delay="2">
                <p className="section-sub">Cliquez sur "Lancer la démo" et observez ProspectBot scraper les annonces, calculer les scores de matching et envoyer les alertes — le tout en quelques secondes.</p>
              </div>
              <div data-reveal data-delay="3" style={{ marginTop: 32 }}>
                {[
                  '4 sources scrappées simultanément',
                  'Score calculé en temps réel',
                  'Email envoyé automatiquement',
                  'Historique complet tracé',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4a853', flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div data-reveal data-delay="2">
              <LiveDemo />
            </div>
          </div>
        </div>
      </section>

      {/* ── PROFILS ── */}
      <section id="profils">
        <div className="section">
          <div style={{ textAlign: 'center' }}>
            <div data-reveal><div className="section-tag" style={{ textAlign: 'center' }}>Pour qui ?</div></div>
            <div data-reveal data-delay="1"><h2 className="section-title" style={{ textAlign: 'center' }}>Un outil conçu pour <em>chaque profil.</em></h2></div>
          </div>
          <div className="profiles-grid">
            {[
              {
                icon: (<svg width="28" height="28" fill="none" stroke="#d4a853" strokeWidth="1.3" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>),
                title: 'Agents immobiliers',
                desc: 'Automatisez votre veille concurrentielle, gérez votre portefeuille acheteurs et publiez vos annonces sur tous les sites en un clic.',
                color: 'rgba(212,168,83,0.08)', border: 'rgba(212,168,83,0.2)',
                cta: 'Essai gratuit 14j', delay: '1',
              },
              {
                icon: (<svg width="28" height="28" fill="none" stroke="rgba(91,141,238,0.8)" strokeWidth="1.3" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>),
                title: 'Acheteurs',
                desc: 'Recevez une alerte dès qu\'un bien correspondant à vos critères est publié. Ne ratez plus jamais la bonne affaire.',
                color: 'rgba(91,141,238,0.06)', border: 'rgba(91,141,238,0.2)',
                cta: 'Créer mon alerte', delay: '2',
              },
              {
                icon: (<svg width="28" height="28" fill="none" stroke="rgba(62,207,142,0.8)" strokeWidth="1.3" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>),
                title: 'Vendeurs',
                desc: 'Publiez votre bien sur LeBonCoin, SeLoger, BienIci et PAP simultanément. Annonce rédigée par IA en 2 minutes.',
                color: 'rgba(62,207,142,0.06)', border: 'rgba(62,207,142,0.2)',
                cta: 'Publier mon bien', delay: '3',
              },
            ].map((p, i) => (
              <div key={i} className="profile-card" data-reveal data-delay={p.delay}
                style={{ background: p.color, borderColor: p.border }}
                onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                <div style={{ marginBottom: 16 }}>{p.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#e8e8e8', marginBottom: 12, fontFamily: 'DM Sans, sans-serif' }}>{p.title}</h3>
                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, marginBottom: 24 }}>{p.desc}</p>
                <button style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 20px', color: '#e8e8e8', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s' }}>
                  {p.cta} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ── */}
      <section id="temoignages" className="testimonials-section">
        <div className="testimonials-inner">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div data-reveal><div className="section-tag" style={{ textAlign: 'center' }}>Témoignages</div></div>
            <div data-reveal data-delay="1"><h2 className="section-title" style={{ textAlign: 'center' }}>Ce qu'ils en <em>disent.</em></h2></div>
          </div>
          <div data-reveal data-delay="2">
            <div className="testimonial-card">
              <p className="testimonial-quote" style={{ paddingLeft: 32 }}>
                {TESTIMONIALS[activeTestimonial].quote}
              </p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{TESTIMONIALS[activeTestimonial].initials}</div>
                <div>
                  <div className="testimonial-name">{TESTIMONIALS[activeTestimonial].name}</div>
                  <div className="testimonial-role">{TESTIMONIALS[activeTestimonial].role}</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="#d4a853"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  ))}
                </div>
              </div>
            </div>
            <div className="testimonial-dots">
              {TESTIMONIALS.map((_, i) => (
                <div key={i} className={`t-dot ${i === activeTestimonial ? 'active' : ''}`} onClick={() => setActiveTestimonial(i)} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="cta-section">
        <div className="cta-bg" />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div data-reveal><h2 className="cta-title">Prêt à automatiser<br /><em>votre prospection ?</em></h2></div>
          <div data-reveal data-delay="1"><p className="cta-sub">Rejoignez les 340+ agents qui font confiance à ProspectBot pour gérer leur portefeuille acheteurs.</p></div>
          <div data-reveal data-delay="2" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/login')}
              style={{ background: 'linear-gradient(135deg, #8b6914, #d4a853)', color: '#0a0a0a', border: 'none', borderRadius: 14, padding: '16px 36px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', boxShadow: '0 0 60px rgba(212,168,83,0.25)', transition: 'transform 0.2s' }}>
              Démarrer mon essai gratuit →
            </button>
            <button onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '16px 32px', fontSize: 16, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s' }}>
              Voir la démo
            </button>
          </div>
          <p data-reveal data-delay="3" style={{ marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>
            14 jours gratuits · Sans carte de crédit · Support 7j/7
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="footer-logo">ProspectBot</div>
        <div className="footer-links">
          <a href="/login" className="footer-link">Connexion</a>
          <a href="#" className="footer-link">Mentions légales</a>
          <a href="#" className="footer-link">Contact</a>
        </div>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>© 2025 ProspectBot</span>
      </footer>

      {/* Floating CTA */}
      <FloatingCTA onCapture={handleCapture} />
    </>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote: "Avant ProspectBot, je passais 3h par jour à scraper manuellement les annonces. Maintenant, tout arrive tout seul dans mon dashboard. J'ai doublé mon portefeuille acheteurs en 2 mois.",
    name: 'Sarah M.',
    role: 'Agente immobilière indépendante, Paris',
    initials: 'S',
  },
  {
    quote: "La fonction de publication multi-sites est un game changer. Je remplis un formulaire, l'IA rédige le texte, et mon annonce est sur 4 sites en 3 minutes. Incroyable.",
    name: 'Julien D.',
    role: 'Directeur d\'agence, Lyon',
    initials: 'J',
  },
  {
    quote: "Le système de matching est bluffant. Mes acheteurs reçoivent exactement les biens qui leur correspondent, et moi je passe moins de temps à faire du tri. Mes clients sont ravis.",
    name: 'Amandine L.',
    role: 'Conseillère immobilière, Bordeaux',
    initials: 'A',
  },
  {
    quote: "J'ai essayé 3 autres outils avant ProspectBot. Aucun n'avait ce niveau d'automatisation. L'alerte email arrive avant même que j'ouvre SeLoger le matin.",
    name: 'Marc T.',
    role: 'Agent immobilier, Nantes',
    initials: 'M',
  },
];
