// pages/liquidite.js
import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/useAuth';

const COULEUR_MAP = {
  green:  { hex: '#16a34a', bg: 'rgba(22,163,74,0.08)',  border: 'rgba(22,163,74,0.25)'  },
  blue:   { hex: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)' },
  orange: { hex: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)' },
  red:    { hex: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)'  },
};

const COMMUNES_SUGGESTIONS = [
  { label: 'Paris 1er', code: '75101' },
  { label: 'Paris 16e', code: '75116' },
  { label: 'Lyon 6e', code: '69386' },
  { label: 'Bordeaux', code: '33063' },
  { label: 'Marseille 8e', code: '13208' },
  { label: 'Nantes', code: '44109' },
  { label: 'Toulouse', code: '31555' },
  { label: 'Nice', code: '06088' },
];

function ScoreArc({ score, couleur }) {
  const c = COULEUR_MAP[couleur] || COULEUR_MAP.blue;
  const pct = (score || 0) / 100;
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ * 0.75;
  const gap = circ - dash;

  return (
    <svg width="140" height="100" viewBox="0 0 140 100" style={{ overflow: 'visible' }}>
      {/* Track */}
      <circle cx="70" cy="80" r={r} fill="none"
        stroke="rgba(255,255,255,0.06)" strokeWidth="10"
        strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
        strokeDashoffset={circ * 0.125}
        strokeLinecap="round"
        transform="rotate(-225 70 80)"
      />
      {/* Fill */}
      <circle cx="70" cy="80" r={r} fill="none"
        stroke={c.hex} strokeWidth="10"
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={circ * 0.125}
        strokeLinecap="round"
        transform="rotate(-225 70 80)"
        style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }}
      />
      {/* Score */}
      <text x="70" y="74" textAnchor="middle" fill={c.hex}
        style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 600 }}>
        {score ?? '—'}
      </text>
      <text x="70" y="90" textAnchor="middle" fill="rgba(255,255,255,0.3)"
        style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10 }}>
        /100
      </text>
    </svg>
  );
}

function StatPill({ label, value, couleur }) {
  const c = COULEUR_MAP[couleur] || COULEUR_MAP.blue;
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: c.hex, fontWeight: 500 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3, letterSpacing: '0.3px' }}>{label}</div>
    </div>
  );
}

export default function LiquiditePage() {
  const router = useRouter();
  const { agent } = useAuth();

  const [ville, setVille] = useState('');
  const [codeCommune, setCodeCommune] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  const handleSearch = async (codeOverride, villeOverride) => {
    const code = codeOverride || codeCommune;
    const v = villeOverride || ville;
    if (!code && !v) return setError('Entrez un code commune ou une ville');

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const params = new URLSearchParams();
      if (code) params.set('code_commune', code);
      else params.set('ville', v);

      const res = await fetch(`/api/immobilier/liquidite?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setResult({ ...data, ville: villeOverride || ville || code });
      setHistory(h => [{ code, ville: v || code, score: data.score, label: data.label, couleur: data.couleur }, ...h.slice(0, 4)]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const c = result ? (COULEUR_MAP[result.couleur] || COULEUR_MAP.blue) : null;

  return (
    <>
      <Head>
        <title>Score liquidité — ProspectBot</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
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
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        input:focus { outline: none; }
        input::placeholder { color: rgba(255,255,255,0.2); }
        .suggest-chip:hover { background: rgba(212,168,83,0.12) !important; border-color: rgba(212,168,83,0.35) !important; color: #d4a853 !important; }
        .history-row:hover { background: rgba(255,255,255,0.04) !important; }
      `}</style>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 40px', background: 'rgba(8,8,9,0.85)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <a href="/immobilier" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 19, color: '#d4a853', fontStyle: 'italic', textDecoration: 'none', letterSpacing: 1 }}>ProspectBot</a>
          <div style={{ display: 'flex', gap: 4 }}>
            {[['Biens', '/immobilier'], ['Acheteurs', '/acheteurs'], ['Vendeurs', '/vendeurs-potentiels'], ['Liquidité', '/liquidite'], ['Portefeuille', '/analyse-portefeuille'], ['Rapport', '/rapport-pdf']].map(([label, href]) => (
              <a key={href} href={href} style={{ fontSize: 12.5, padding: '5px 11px', borderRadius: 6, color: href === '/liquidite' ? '#d4a853' : 'rgba(255,255,255,0.35)', background: href === '/liquidite' ? 'rgba(212,168,83,0.08)' : 'transparent', textDecoration: 'none', transition: 'all 0.15s' }}>{label}</a>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>{agent?.name}</div>
      </nav>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '100px 32px 60px', position: 'relative', zIndex: 1, animation: 'fadeUp 0.5s both' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(212,168,83,0.08)', border: '1px solid rgba(212,168,83,0.2)', borderRadius: 30, padding: '4px 14px', fontSize: 11, color: '#d4a853', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 18 }}>
            Données DVF officielles
          </div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 44, fontWeight: 300, color: '#f0f0f0', letterSpacing: '-0.5px', lineHeight: 1.1, marginBottom: 10 }}>
            Score de <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg, #8b6914, #d4a853)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>liquidité</em>
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', fontWeight: 300, lineHeight: 1.6 }}>
            Analysez la dynamique d'un marché local : volume de transactions, délai de vente et score 0-100.
          </p>
        </div>

        {/* Search */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '24px', marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                value={ville}
                onChange={e => setVille(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Ville (ex: Lyon)"
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '11px 14px', fontSize: 14, color: '#e8e8e8', fontFamily: 'DM Sans, sans-serif' }}
              />
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                value={codeCommune}
                onChange={e => setCodeCommune(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Code commune (ex: 75056)"
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '11px 14px', fontSize: 14, color: '#e8e8e8', fontFamily: 'DM Sans, sans-serif' }}
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              style={{ padding: '11px 22px', background: loading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #8b6914, #d4a853)', border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 600, color: loading ? 'rgba(255,255,255,0.2)' : '#0a0a0a', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 7 }}
            >
              {loading ? <><span style={{ display: 'inline-block', width: 13, height: 13, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#e8e8e8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Analyse...</> : 'Analyser →'}
            </button>
          </div>

          {/* Suggestions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginRight: 4 }}>Suggestions :</span>
            {COMMUNES_SUGGESTIONS.map(s => (
              <button key={s.code} className="suggest-chip"
                onClick={() => { setVille(s.label); setCodeCommune(s.code); handleSearch(s.code, s.label); }}
                style={{ fontSize: 11.5, padding: '4px 11px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, fontSize: 13, color: '#ef4444', marginBottom: 24 }}>{error}</div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', animation: 'pulse 1.5s infinite' }}>Analyse des transactions DVF en cours…</div>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div style={{ animation: 'fadeUp 0.4s both' }}>
            {/* Score card principal */}
            <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 16, padding: '32px', marginBottom: 16, display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <ScoreArc score={result.score} couleur={result.couleur} />
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, color: c.hex, marginTop: 6 }}>{result.label}</div>
                {result.fromCache && (
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>Cache · {result.cacheAge}h</div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
                  {result.ville || result.code_commune}
                </div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, fontWeight: 300 }}>
                  {result.conseil}
                </p>
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 16 }}>
              <StatPill label="Transactions / trimestre" value={result.details?.volumeMoyenTrimestriel ?? '—'} couleur={result.couleur} />
              <StatPill label="Délai moyen estimé" value={result.details?.delaiMoyenJours ? `${result.details.delaiMoyenJours}j` : '—'} couleur={result.couleur} />
              <StatPill label="Transactions analysées" value={result.details?.nbTransactionsAnalysees ?? '—'} couleur={result.couleur} />
              <StatPill label="Trimestres couverts" value={result.details?.nbTrimestres ?? '—'} couleur={result.couleur} />
            </div>

            {/* CTA vers rapport */}
            <div style={{ display: 'flex', gap: 10 }}>
              <a href={`/rapport-pdf?ville=${encodeURIComponent(result.ville || '')}&code=${result.code_commune || ''}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'linear-gradient(135deg, #8b6914, #d4a853)', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#0a0a0a', textDecoration: 'none' }}>
                Générer le rapport PDF →
              </a>
              <button onClick={() => { setResult(null); setVille(''); setCodeCommune(''); }}
                style={{ padding: '10px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, fontSize: 13, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                Nouvelle recherche
              </button>
            </div>
          </div>
        )}

        {/* Historique */}
        {history.length > 0 && !result && (
          <div style={{ marginTop: 32 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>Recherches récentes</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {history.map((h, i) => {
                const hc = COULEUR_MAP[h.couleur] || COULEUR_MAP.blue;
                return (
                  <div key={i} className="history-row"
                    onClick={() => handleSearch(h.code, h.ville)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.15s' }}>
                    <span style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)' }}>{h.ville}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, color: hc.hex }}>{h.label}</span>
                      <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, color: hc.hex, fontWeight: 600 }}>{h.score}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </>
  );
}
