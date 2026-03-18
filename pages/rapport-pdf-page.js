// pages/rapport-pdf.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/useAuth';

const ENGINES = [
  { id: 'puppeteer', label: 'Puppeteer', desc: 'Rendu HTML complet, mise en page parfaite', badge: 'Recommandé', icon: '✦' },
  { id: 'pdflib', label: 'PDF-lib', desc: 'Léger, rapide, sans Chrome', badge: 'Rapide', icon: '◆' },
];

function StepBadge({ n, active, done }) {
  return (
    <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 600, fontFamily: 'DM Sans, sans-serif', transition: 'all 0.3s', background: done ? 'linear-gradient(135deg, #8b6914, #d4a853)' : active ? 'rgba(212,168,83,0.12)' : 'rgba(255,255,255,0.04)', border: `1.5px solid ${done ? 'transparent' : active ? 'rgba(212,168,83,0.4)' : 'rgba(255,255,255,0.1)'}`, color: done ? '#0a0a0a' : active ? '#d4a853' : 'rgba(255,255,255,0.25)' }}>
      {done ? '✓' : n}
    </div>
  );
}

export default function RapportPDFPage() {
  const router = useRouter();
  const { agent } = useAuth();

  // Pré-remplir depuis l'URL (venant de /liquidite)
  const [ville, setVille] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [codeCommune, setCodeCommune] = useState('');
  const [engine, setEngine] = useState('puppeteer');
  const [saveToStorage, setSaveToStorage] = useState(false);

  const [step, setStep] = useState(1); // 1 = zone, 2 = options, 3 = génération
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { url } ou blob

  useEffect(() => {
    if (router.query.ville) setVille(decodeURIComponent(router.query.ville));
    if (router.query.code) setCodeCommune(router.query.code);
    if (router.query.ville || router.query.code) setStep(2);
  }, [router.query]);

  const handleGenerate = async () => {
    if (!ville && !codeCommune) return setError('Ville ou code commune requis');
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Étape 1 : récupérer la liquidité
      setLoadingStep('Analyse du marché DVF…');
      const params = new URLSearchParams();
      if (codeCommune) params.set('code_commune', codeCommune);
      else params.set('ville', ville);

      const liqRes = await fetch(`/api/immobilier/liquidite?${params}`);
      const liqData = await liqRes.json();
      if (!liqRes.ok) throw new Error(liqData.error || 'Erreur analyse liquidité');

      // Étape 2 : générer le PDF
      setLoadingStep('Génération du rapport PDF…');
      const pdfRes = await fetch('/api/immobilier/rapport-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engine,
          saveToStorage,
          zone: { ville, codePostal, codeCommune },
          liquidite: liqData,
          dvf: { prixMoyenM2: liqData.details?.prixMoyenM2 },
        }),
      });

      if (!pdfRes.ok) {
        const err = await pdfRes.json();
        throw new Error(err.error || 'Erreur génération PDF');
      }

      if (saveToStorage) {
        const data = await pdfRes.json();
        setResult({ type: 'url', url: data.url, filename: data.filename });
      } else {
        const blob = await pdfRes.blob();
        const url = URL.createObjectURL(blob);
        setResult({ type: 'blob', url, filename: `rapport_marche_${ville || codeCommune}.pdf` });
      }

      setStep(3);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.filename;
    a.click();
  };

  return (
    <>
      <Head>
        <title>Rapport PDF marché — ProspectBot</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #080809; color: #e8e8e8; min-height: 100vh; }
        body::before {
          content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          opacity: 0.4;
        }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        input:focus { outline: none; }
        input::placeholder { color: rgba(255,255,255,0.2); }
        .engine-card:hover { border-color: rgba(212,168,83,0.3) !important; }
        .toggle:checked { accent-color: #d4a853; }
      `}</style>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 40px', background: 'rgba(8,8,9,0.85)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <a href="/immobilier" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 19, color: '#d4a853', fontStyle: 'italic', textDecoration: 'none', letterSpacing: 1 }}>ProspectBot</a>
          <div style={{ display: 'flex', gap: 4 }}>
            {[['Biens', '/immobilier'], ['Acheteurs', '/acheteurs'], ['Vendeurs', '/vendeurs-potentiels'], ['Liquidité', '/liquidite'], ['Portefeuille', '/analyse-portefeuille'], ['Rapport', '/rapport-pdf']].map(([label, href]) => (
              <a key={href} href={href} style={{ fontSize: 12.5, padding: '5px 11px', borderRadius: 6, color: href === '/rapport-pdf' ? '#d4a853' : 'rgba(255,255,255,0.35)', background: href === '/rapport-pdf' ? 'rgba(212,168,83,0.08)' : 'transparent', textDecoration: 'none' }}>{label}</a>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>{agent?.name}</div>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '100px 32px 60px', position: 'relative', zIndex: 1, animation: 'fadeUp 0.5s both' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(212,168,83,0.08)', border: '1px solid rgba(212,168,83,0.2)', borderRadius: 30, padding: '4px 14px', fontSize: 11, color: '#d4a853', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 18 }}>
            Rapport brandé
          </div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 44, fontWeight: 300, color: '#f0f0f0', letterSpacing: '-0.5px', lineHeight: 1.1, marginBottom: 10 }}>
            Rapport <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg, #8b6914, #d4a853)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>marché PDF</em>
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', fontWeight: 300 }}>
            Générez un rapport PDF à envoyer à vos prospects vendeurs, basé sur les données DVF officielles.
          </p>
        </div>

        {/* Steps indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
          {['Zone', 'Options', 'Téléchargement'].map((label, i) => {
            const n = i + 1;
            const active = step === n;
            const done = step > n;
            return (
              <div key={n} style={{ display: 'flex', alignItems: 'center', flex: n < 3 ? 1 : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: done ? 'pointer' : 'default' }} onClick={() => done && setStep(n)}>
                  <StepBadge n={n} active={active} done={done} />
                  <span style={{ fontSize: 12.5, color: active ? '#d4a853' : done ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>{label}</span>
                </div>
                {n < 3 && <div style={{ flex: 1, height: 1, background: done ? 'rgba(212,168,83,0.3)' : 'rgba(255,255,255,0.07)', margin: '0 12px' }} />}
              </div>
            );
          })}
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, fontSize: 13, color: '#ef4444', marginBottom: 20 }}>{error}</div>
        )}

        {/* Step 1 : Zone */}
        {step === 1 && (
          <div style={{ animation: 'fadeUp 0.3s both' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>Zone analysée</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 6 }}>Ville *</label>
                  <input value={ville} onChange={e => setVille(e.target.value)}
                    placeholder="ex : Lyon" style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#e8e8e8', fontFamily: 'DM Sans, sans-serif' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 6 }}>Code postal</label>
                  <input value={codePostal} onChange={e => setCodePostal(e.target.value)}
                    placeholder="ex : 69006" style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#e8e8e8', fontFamily: 'DM Sans, sans-serif' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 6 }}>Code commune INSEE (pour DVF)</label>
                <input value={codeCommune} onChange={e => setCodeCommune(e.target.value)}
                  placeholder="ex : 69123 (optionnel mais recommandé pour la précision)" style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#e8e8e8', fontFamily: 'DM Sans, sans-serif' }} />
              </div>
            </div>
            <button onClick={() => { if (!ville) return setError('Ville requise'); setError(''); setStep(2); }}
              style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #8b6914, #d4a853)', border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 600, color: '#0a0a0a', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
              Suivant →
            </button>
          </div>
        )}

        {/* Step 2 : Options */}
        {step === 2 && (
          <div style={{ animation: 'fadeUp 0.3s both' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>Zone : <span style={{ color: '#d4a853' }}>{ville}{codePostal ? ` (${codePostal})` : ''}</span></div>

              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>Moteur PDF</div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                {ENGINES.map(e => (
                  <div key={e.id} className="engine-card"
                    onClick={() => setEngine(e.id)}
                    style={{ flex: 1, borderRadius: 10, padding: '16px', cursor: 'pointer', border: `1.5px solid ${engine === e.id ? 'rgba(212,168,83,0.45)' : 'rgba(255,255,255,0.07)'}`, background: engine === e.id ? 'rgba(212,168,83,0.06)' : 'rgba(255,255,255,0.01)', transition: 'all 0.2s', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: -8, right: 10, fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: engine === e.id ? 'linear-gradient(135deg, #8b6914, #d4a853)' : 'rgba(255,255,255,0.07)', color: engine === e.id ? '#0a0a0a' : 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{e.badge}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${engine === e.id ? '#d4a853' : 'rgba(255,255,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {engine === e.id && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#d4a853' }} />}
                      </div>
                      <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, color: engine === e.id ? '#d4a853' : 'rgba(255,255,255,0.6)' }}>{e.label}</span>
                    </div>
                    <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>{e.desc}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Sauvegarder dans Supabase Storage</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>Génère une URL signée partageable (7 jours)</div>
                </div>
                <input type="checkbox" className="toggle" checked={saveToStorage} onChange={e => setSaveToStorage(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#d4a853' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, fontSize: 13, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>← Retour</button>
              <button onClick={handleGenerate} disabled={loading}
                style={{ flex: 1, padding: '12px 24px', background: loading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #8b6914, #d4a853)', border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 600, color: loading ? 'rgba(255,255,255,0.2)' : '#0a0a0a', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? (
                  <><span style={{ display: 'inline-block', width: 13, height: 13, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#e8e8e8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />{loadingStep || 'Génération…'}</>
                ) : 'Générer le rapport →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 : Résultat */}
        {step === 3 && result && (
          <div style={{ animation: 'fadeUp 0.4s both' }}>
            <div style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 16, padding: '36px', textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 48, color: '#16a34a', marginBottom: 12 }}>✓</div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 300, color: '#f0f0f0', marginBottom: 8 }}>Rapport généré</h2>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.4)', marginBottom: 24, fontWeight: 300 }}>
                Rapport marché pour <strong style={{ color: '#d4a853' }}>{ville}</strong> — prêt à envoyer à votre prospect.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={handleDownload}
                  style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #8b6914, #d4a853)', border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 600, color: '#0a0a0a', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  Télécharger le PDF ↓
                </button>
                {result.type === 'blob' && (
                  <a href={result.url} target="_blank" rel="noopener noreferrer"
                    style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                    Prévisualiser ↗
                  </a>
                )}
                {result.type === 'url' && (
                  <button onClick={() => navigator.clipboard.writeText(result.url)}
                    style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, fontSize: 13, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                    Copier le lien
                  </button>
                )}
                <button onClick={() => { setStep(1); setResult(null); setVille(''); setCodePostal(''); setCodeCommune(''); }}
                  style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, fontSize: 13, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  Nouveau rapport
                </button>
              </div>
            </div>

            {result.type === 'url' && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>Lien Supabase (valide 7 jours)</div>
                <div style={{ fontSize: 12, color: 'rgba(212,168,83,0.7)', wordBreak: 'break-all' }}>{result.url}</div>
              </div>
            )}
          </div>
        )}

      </div>
    </>
  );
}
