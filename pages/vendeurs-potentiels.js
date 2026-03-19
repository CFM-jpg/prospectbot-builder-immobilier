// pages/vendeurs-potentiels.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '../lib/useAuth';

const NAV_LINKS = [
  ['Dashboard', '/immobilier'], ['Biens', '/biens'], ['Acheteurs', '/acheteurs'],
  ['Matches', '/matches'], ['Vendeurs', '/vendeurs-potentiels'],
  ['Liquidité', '/liquidite'], ['Portefeuille', '/analyse-portefeuille'], ['Rapport PDF', '/rapport-pdf'],
];

const STATUTS_PIPELINE = [
  { id: 'a_contacter', label: 'À contacter', color: '#3b82f6' },
  { id: 'contacte', label: 'Contacté', color: '#d4a853' },
  { id: 'negociation', label: 'Négociation', color: '#8b5cf6' },
  { id: 'signe', label: 'Signé', color: '#16a34a' },
];

function ScoreLabel({ score, label }) {
  const color = score >= 70 ? '#16a34a' : score >= 40 ? '#d4a853' : '#f97316';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${color}14`, border: `1.5px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 13, color, fontWeight: 600 }}>{score}</span>
      </div>
      <span style={{ fontSize: 11, color, opacity: 0.85 }}>{label}</span>
    </div>
  );
}

export default function VendeursPotentielsPage() {
  const { agent } = useAuth();
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [view, setView] = useState('liste'); // 'liste' | 'kanban'
  const [updating, setUpdating] = useState(null);

  const fetchProspects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/immobilier/mes-prospects');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProspects(data.prospects || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProspects(); }, []);

  const handleStatut = async (id, statut) => {
    setUpdating(id);
    try {
      await fetch('/api/immobilier/mes-prospects', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, statut }),
      });
      setProspects(ps => ps.map(p => p.id === id ? { ...p, statut } : p));
    } catch (e) { setError(e.message); }
    finally { setUpdating(null); }
  };

  const filtered = prospects.filter(p => {
    if (filtreStatut && p.statut !== filtreStatut) return false;
    if (search && !p.adresse?.toLowerCase().includes(search.toLowerCase()) && !p.ville?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPlusValue = prospects.reduce((s, p) => {
    if (!p.plus_value_estimee) return s;
    const match = p.plus_value_estimee.match(/[\d\s]+/);
    return s + (match ? parseInt(match[0].replace(/\s/g, '')) : 0);
  }, 0);

  return (
    <>
      <Head><title>Vendeurs potentiels — ProspectBot</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',sans-serif;background:#080809;color:#e8e8e8;min-height:100vh}
        body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");opacity:0.4}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        input,select{font-family:'DM Sans',sans-serif}
        input:focus,select:focus{outline:none}
        input::placeholder{color:rgba(255,255,255,0.2)}
        .vrow:hover{background:rgba(255,255,255,0.03)!important}
      `}</style>

      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', background: 'rgba(8,8,9,0.9)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <a href="/immobilier" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, color: '#d4a853', fontStyle: 'italic', textDecoration: 'none' }}>ProspectBot</a>
          <div style={{ display: 'flex', gap: 2 }}>
            {NAV_LINKS.map(([label, href]) => (
              <a key={href} href={href} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, color: href === '/vendeurs-potentiels' ? '#d4a853' : 'rgba(255,255,255,0.35)', background: href === '/vendeurs-potentiels' ? 'rgba(212,168,83,0.08)' : 'transparent', textDecoration: 'none' }}>{label}</a>
            ))}
          </div>
        </div>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>{agent?.name}</span>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '88px 28px 60px', position: 'relative', zIndex: 1, animation: 'fadeUp 0.45s both' }}>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 40, fontWeight: 300, color: '#f0f0f0', letterSpacing: '-0.5px' }}>
              Vendeurs <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg,#8b6914,#d4a853)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>potentiels</em>
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{prospects.length} prospect{prospects.length > 1 ? 's' : ''} DVF prospecté{prospects.length > 1 ? 's' : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, overflow: 'hidden' }}>
              {[['liste', 'Liste'], ['kanban', 'Kanban']].map(([v, label]) => (
                <button key={v} onClick={() => setView(v)}
                  style={{ padding: '7px 14px', background: view === v ? 'rgba(212,168,83,0.1)' : 'transparent', border: 'none', borderRight: v === 'liste' ? '1px solid rgba(255,255,255,0.09)' : 'none', color: view === v ? '#d4a853' : 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 12.5, fontFamily: 'DM Sans, sans-serif' }}>{label}</button>
              ))}
            </div>
            <a href="/immobilier" style={{ padding: '9px 16px', background: 'linear-gradient(135deg,#8b6914,#d4a853)', borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: '#0a0a0a', textDecoration: 'none' }}>
              + Prospecter DVF
            </a>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
          {[
            ['Prospects', prospects.length, '#d4a853'],
            ['À contacter', prospects.filter(p => p.statut === 'a_contacter').length, '#3b82f6'],
            ['En cours', prospects.filter(p => ['contacte','negociation'].includes(p.statut)).length, '#8b5cf6'],
            ['Signés', prospects.filter(p => p.statut === 'signe').length, '#16a34a'],
          ].map(([label, val, color]) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, color, fontWeight: 500 }}>{val}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par adresse, ville…"
            style={{ flex: 1, minWidth: 200, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '9px 14px', fontSize: 13, color: '#e8e8e8' }} />
          <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
            <option value="">Tous statuts</option>
            {STATUTS_PIPELINE.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>

        {error && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 13, color: '#ef4444', marginBottom: 16 }}>{error}</div>}

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: 'rgba(255,255,255,0.25)', marginBottom: 8 }}>Aucun vendeur prospecté</div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', marginBottom: 16 }}>Utilisez l'outil DVF depuis le dashboard pour identifier des vendeurs potentiels.</p>
            <a href="/immobilier" style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#8b6914,#d4a853)', borderRadius: 7, fontSize: 13, fontWeight: 600, color: '#0a0a0a', textDecoration: 'none' }}>Aller au dashboard →</a>
          </div>
        ) : view === 'liste' ? (
          /* Vue liste */
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 140px', padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              <span>Bien</span><span>Prix achat</span><span>Plus-value est.</span><span>Prix m²</span><span>Score</span><span>Statut</span>
            </div>
            {filtered.map((p, i) => {
              const st = STATUTS_PIPELINE.find(s => s.id === p.statut) || STATUTS_PIPELINE[0];
              return (
                <div key={p.id} className="vrow"
                  style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 140px', padding: '13px 18px', borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center', transition: 'background 0.15s' }}>
                  <div>
                    <div style={{ fontSize: 13.5, color: '#e8e8e8' }}>{p.adresse || '—'}</div>
                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{p.ville} · {p.type} · {p.surface ? `${p.surface}m²` : '?'} · {p.pieces ? `${p.pieces}p` : '?'}</div>
                  </div>
                  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 14, color: '#d4a853' }}>{p.prix ? `${(p.prix / 1000).toFixed(0)}k€` : '—'}</span>
                  <span style={{ fontSize: 13, color: '#16a34a' }}>{p.plus_value_estimee || '—'}</span>
                  <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)' }}>{p.prix_m2 ? `${p.prix_m2} €/m²` : '—'}</span>
                  <div>{p.score ? <ScoreLabel score={p.score} label={p.score_label || ''} /> : '—'}</div>
                  <select value={p.statut || 'a_contacter'} onChange={e => handleStatut(p.id, e.target.value)}
                    disabled={updating === p.id}
                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${st.color}40`, borderRadius: 7, padding: '5px 8px', fontSize: 11.5, color: st.color, cursor: 'pointer', width: '100%' }}>
                    {STATUTS_PIPELINE.map(s => <option key={s.id} value={s.id} style={{ background: '#111113', color: '#e8e8e8' }}>{s.label}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
        ) : (
          /* Vue kanban */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {STATUTS_PIPELINE.map(col => {
              const colProspects = filtered.filter(p => (p.statut || 'a_contacter') === col.id);
              return (
                <div key={col.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                    <span style={{ fontSize: 12, color: col.color, fontWeight: 500 }}>{col.label}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginLeft: 'auto' }}>{colProspects.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {colProspects.map(p => (
                      <div key={p.id} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${col.color}25`, borderRadius: 10, padding: '13px 14px' }}>
                        <div style={{ fontSize: 13, color: '#e8e8e8', marginBottom: 4, fontWeight: 400 }}>{p.adresse || '—'}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>{p.ville} · {p.type}</div>
                        {p.prix && <div style={{ fontSize: 12, color: '#d4a853', fontFamily: 'Cormorant Garamond, serif', marginBottom: 4 }}>{(p.prix / 1000).toFixed(0)}k€</div>}
                        {p.plus_value_estimee && <div style={{ fontSize: 11, color: '#16a34a' }}>+val. {p.plus_value_estimee}</div>}
                        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                          {STATUTS_PIPELINE.filter(s => s.id !== col.id).map(s => (
                            <button key={s.id} onClick={() => handleStatut(p.id, s.id)} disabled={updating === p.id}
                              style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, border: `1px solid ${s.color}30`, background: 'transparent', color: s.color, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                              → {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {colProspects.length === 0 && (
                      <div style={{ padding: '20px 12px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 10, fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>Vide</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
