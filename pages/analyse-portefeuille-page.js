// pages/analyse-portefeuille.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/useAuth';

const PRIORITE_STYLE = {
  haute:    { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',   label: 'Haute' },
  normale:  { color: '#d4a853', bg: 'rgba(212,168,83,0.08)',  border: 'rgba(212,168,83,0.2)',  label: 'Normale' },
  basse:    { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.2)',  label: 'Basse' },
};

const TENDANCE_STYLE = {
  hausse:  { icon: '↑', color: '#16a34a', label: 'En hausse' },
  baisse:  { icon: '↓', color: '#ef4444', label: 'En baisse' },
  stable:  { icon: '→', color: '#d4a853', label: 'Stable' },
};

const SCORE_COULEUR = {
  green:  '#16a34a',
  blue:   '#3b82f6',
  orange: '#f97316',
  red:    '#ef4444',
};

function MandatCard({ item, onRapport }) {
  const [open, setOpen] = useState(false);
  const { bien, liquidite, analyse } = item;
  const p = PRIORITE_STYLE[analyse.priorite] || PRIORITE_STYLE.normale;
  const t = TENDANCE_STYLE[liquidite?.tendance] || TENDANCE_STYLE.stable;
  const scoreColor = SCORE_COULEUR[liquidite?.couleur] || '#d4a853';

  const joursMarch = bien.created_at
    ? Math.round((Date.now() - new Date(bien.created_at)) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div style={{ background: analyse.alerte ? 'rgba(239,68,68,0.03)' : 'rgba(255,255,255,0.02)', border: `1px solid ${analyse.alerte ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s' }}>

      {/* Header carte */}
      <div style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}
        onClick={() => setOpen(o => !o)}>

        {/* Score liquidité */}
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${scoreColor}14`, border: `2px solid ${scoreColor}40`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, fontWeight: 600, color: scoreColor, lineHeight: 1 }}>{liquidite?.score ?? '—'}</span>
          <span style={{ fontSize: 8, color: scoreColor, opacity: 0.7 }}>/100</span>
        </div>

        {/* Infos bien */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, color: '#f0f0f0', fontWeight: 400 }}>
              {bien.type} — {bien.ville}
            </span>
            {analyse.alerte && (
              <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontWeight: 600 }}>⚠ Alerte</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {bien.prix && <span style={{ fontSize: 12, color: '#d4a853' }}>{bien.prix.toLocaleString('fr-FR')} €</span>}
            {bien.surface && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{bien.surface} m²</span>}
            {bien.reference && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Réf. {bien.reference}</span>}
            {joursMarch !== null && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{joursMarch}j en vente</span>}
          </div>
        </div>

        {/* Badges droite */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
          <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: p.bg, border: `1px solid ${p.border}`, color: p.color, fontWeight: 600 }}>
            {p.label}
          </span>
          {liquidite?.tendance && (
            <span style={{ fontSize: 11, color: t.color }}>{t.icon} {t.label}</span>
          )}
        </div>

        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </div>

      {/* Détail déplié */}
      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', animation: 'fadeUp 0.2s both' }}>

          {/* Conseil IA */}
          <div style={{ background: 'rgba(212,168,83,0.05)', border: '1px solid rgba(212,168,83,0.15)', borderRadius: 8, padding: '14px 16px', margin: '16px 0 12px' }}>
            <div style={{ fontSize: 10, color: 'rgba(212,168,83,0.6)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Conseil IA</div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, fontWeight: 300 }}>{analyse.conseil}</p>
          </div>

          {/* Action recommandée */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 7, border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.8px', whiteSpace: 'nowrap' }}>Action →</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{analyse.action}</span>
          </div>

          {/* Stats marché */}
          {liquidite && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
              {[
                ['Score liquidité', `${liquidite.score}/100`],
                ['Tx / trimestre', liquidite.details?.volumeMoyenTrimestriel ?? '—'],
                ['Délai estimé', liquidite.details?.delaiMoyenJours ? `${liquidite.details.delaiMoyenJours}j` : '—'],
              ].map(([label, val]) => (
                <div key={label} style={{ textAlign: 'center', padding: '10px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 7, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, color: scoreColor }}>{val}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* CTA rapport */}
          <button onClick={() => onRapport(bien)}
            style={{ fontSize: 12.5, padding: '8px 16px', background: 'linear-gradient(135deg, #8b6914, #d4a853)', border: 'none', borderRadius: 7, color: '#0a0a0a', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
            Générer le rapport PDF pour ce bien →
          </button>
        </div>
      )}
    </div>
  );
}

export default function AnalysePortefeuillePage() {
  const router = useRouter();
  const { agent } = useAuth();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [filtrePriorite, setFiltrePriorite] = useState('tous');
  const [filtreAlerte, setFiltreAlerte] = useState(false);

  const fetchAnalyse = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/immobilier/analyse-portefeuille');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalyse(); }, []);

  const handleRapport = (bien) => {
    router.push(`/rapport-pdf?ville=${encodeURIComponent(bien.ville || '')}&code=${bien.code_postal || ''}`);
  };

  const analyses = data?.analyses || [];
  const filtrees = analyses.filter(a => {
    if (filtreAlerte && !a.analyse.alerte) return false;
    if (filtrePriorite !== 'tous' && a.analyse.priorite !== filtrePriorite) return false;
    return true;
  });

  return (
    <>
      <Head>
        <title>Analyse portefeuille — ProspectBot</title>
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
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .filter-btn:hover { border-color: rgba(212,168,83,0.3) !important; color: rgba(255,255,255,0.6) !important; }
      `}</style>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 40px', background: 'rgba(8,8,9,0.85)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <a href="/immobilier" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 19, color: '#d4a853', fontStyle: 'italic', textDecoration: 'none', letterSpacing: 1 }}>ProspectBot</a>
          <div style={{ display: 'flex', gap: 4 }}>
            {[['Biens', '/immobilier'], ['Acheteurs', '/acheteurs'], ['Vendeurs', '/vendeurs-potentiels'], ['Liquidité', '/liquidite'], ['Portefeuille', '/analyse-portefeuille'], ['Rapport', '/rapport-pdf']].map(([label, href]) => (
              <a key={href} href={href} style={{ fontSize: 12.5, padding: '5px 11px', borderRadius: 6, color: href === '/analyse-portefeuille' ? '#d4a853' : 'rgba(255,255,255,0.35)', background: href === '/analyse-portefeuille' ? 'rgba(212,168,83,0.08)' : 'transparent', textDecoration: 'none' }}>{label}</a>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>{agent?.name}</div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '100px 32px 60px', position: 'relative', zIndex: 1, animation: 'fadeUp 0.5s both' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(212,168,83,0.08)', border: '1px solid rgba(212,168,83,0.2)', borderRadius: 30, padding: '4px 14px', fontSize: 11, color: '#d4a853', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 14 }}>
              IA + DVF
            </div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 44, fontWeight: 300, color: '#f0f0f0', letterSpacing: '-0.5px', lineHeight: 1.1, marginBottom: 8 }}>
              Analyse <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg, #8b6914, #d4a853)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>portefeuille</em>
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', fontWeight: 300 }}>Chaque mandat comparé aux tendances DVF de sa zone. Conseils IA et alertes automatiques.</p>
          </div>
          <button onClick={fetchAnalyse} disabled={loading}
            style={{ padding: '10px 18px', background: loading ? 'rgba(255,255,255,0.04)' : 'rgba(212,168,83,0.08)', border: '1px solid rgba(212,168,83,0.2)', borderRadius: 8, fontSize: 13, color: loading ? 'rgba(255,255,255,0.2)' : '#d4a853', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0, marginTop: 36 }}>
            {loading ? <><span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(212,168,83,0.2)', borderTopColor: '#d4a853', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Analyse…</> : '↻ Actualiser'}
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, fontSize: 13, color: '#ef4444', marginBottom: 24 }}>{error}</div>
        )}

        {/* Loading */}
        {loading && !data && (
          <div style={{ padding: '48px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', animation: 'pulse 1.5s infinite' }}>Analyse DVF en cours pour chaque mandat…</div>
          </div>
        )}

        {data && !loading && (
          <>
            {/* KPIs + résumé global */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
              {[
                ['Mandats analysés', data.nbMandats, '#d4a853'],
                ['Alertes actives', data.nbAlertes, data.nbAlertes > 0 ? '#ef4444' : '#16a34a'],
                ['Dernière analyse', 'Maintenant', 'rgba(255,255,255,0.4)'],
              ].map(([label, val, color]) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, color, fontWeight: 500 }}>{val}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Résumé IA global */}
            {data.resumeGlobal && (
              <div style={{ background: 'rgba(212,168,83,0.05)', border: '1px solid rgba(212,168,83,0.15)', borderRadius: 12, padding: '18px 20px', marginBottom: 20 }}>
                <div style={{ fontSize: 10, color: 'rgba(212,168,83,0.6)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Résumé IA du portefeuille</div>
                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, fontWeight: 300 }}>{data.resumeGlobal}</p>
              </div>
            )}

            {/* Alertes rapides */}
            {data.nbAlertes > 0 && (
              <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>⚠ {data.nbAlertes} mandat{data.nbAlertes > 1 ? 's' : ''} nécessitent votre attention</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {data.alertes.map((a, i) => (
                    <span key={i} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                      {a.bien.type} — {a.bien.ville}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Filtres */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Filtrer :</span>
              {['tous', 'haute', 'normale', 'basse'].map(p => (
                <button key={p} className="filter-btn" onClick={() => setFiltrePriorite(p)}
                  style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, border: `1px solid ${filtrePriorite === p ? 'rgba(212,168,83,0.4)' : 'rgba(255,255,255,0.08)'}`, background: filtrePriorite === p ? 'rgba(212,168,83,0.08)' : 'transparent', color: filtrePriorite === p ? '#d4a853' : 'rgba(255,255,255,0.35)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s', textTransform: 'capitalize' }}>
                  {p === 'tous' ? 'Toutes priorités' : `Priorité ${p}`}
                </button>
              ))}
              <button className="filter-btn" onClick={() => setFiltreAlerte(f => !f)}
                style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, border: `1px solid ${filtreAlerte ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`, background: filtreAlerte ? 'rgba(239,68,68,0.08)' : 'transparent', color: filtreAlerte ? '#ef4444' : 'rgba(255,255,255,0.35)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' }}>
                ⚠ Alertes seulement
              </button>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginLeft: 4 }}>{filtrees.length} résultat{filtrees.length > 1 ? 's' : ''}</span>
            </div>

            {/* Liste mandats */}
            {filtrees.length === 0 && (
              <div style={{ padding: '32px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
                Aucun mandat ne correspond aux filtres sélectionnés.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtrees.map((item, i) => (
                <MandatCard key={item.bien.id || i} item={item} onRapport={handleRapport} />
              ))}
            </div>

            {/* Message si pas de mandats du tout */}
            {data.nbMandats === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }}>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>Aucun mandat actif</div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', marginBottom: 20 }}>Ajoutez des biens disponibles pour analyser votre portefeuille.</p>
                <a href="/immobilier" style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #8b6914, #d4a853)', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#0a0a0a', textDecoration: 'none' }}>Ajouter un bien →</a>
              </div>
            )}
          </>
        )}

      </div>
    </>
  );
}
