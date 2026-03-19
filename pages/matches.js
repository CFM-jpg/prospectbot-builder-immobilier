// pages/matches.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '../lib/useAuth';

const NAV_LINKS = [
  ['Dashboard', '/immobilier'], ['Biens', '/biens'], ['Acheteurs', '/acheteurs'],
  ['Matches', '/matches'], ['Vendeurs', '/vendeurs-potentiels'],
  ['Liquidité', '/liquidite'], ['Portefeuille', '/analyse-portefeuille'], ['Rapport PDF', '/rapport-pdf'],
];

function ScoreBadge({ score }) {
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#d4a853' : '#f97316';
  const bg = score >= 80 ? 'rgba(22,163,74,0.1)' : score >= 60 ? 'rgba(212,168,83,0.1)' : 'rgba(249,115,22,0.1)';
  const border = score >= 80 ? 'rgba(22,163,74,0.3)' : score >= 60 ? 'rgba(212,168,83,0.3)' : 'rgba(249,115,22,0.3)';
  return (
    <div style={{ width: 48, height: 48, borderRadius: '50%', background: bg, border: `2px solid ${border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, color, fontWeight: 600, lineHeight: 1 }}>{score}</span>
      <span style={{ fontSize: 8, color, opacity: 0.7 }}>%</span>
    </div>
  );
}

export default function MatchesPage() {
  const { agent } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [search, setSearch] = useState('');

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtreStatut) params.set('statut', filtreStatut);
      const res = await fetch(`/api/immobilier/matches?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMatches(data.data || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMatches(); }, [filtreStatut]);

  const handleMatchAuto = async () => {
    setRunning(true); setError('');
    try {
      const res = await fetch('/api/immobilier/match-auto', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchMatches();
      alert(`✓ ${data.stats.nouveauxMatchs} nouveau${data.stats.nouveauxMatchs > 1 ? 'x' : ''} match${data.stats.nouveauxMatchs > 1 ? 's' : ''} détecté${data.stats.nouveauxMatchs > 1 ? 's' : ''}`);
    } catch (e) { setError(e.message); }
    finally { setRunning(false); }
  };

  const handleUpdateStatut = async (id, statut) => {
    await fetch('/api/immobilier/matches', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, statut }) });
    fetchMatches();
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce match ?')) return;
    await fetch(`/api/immobilier/matches?id=${id}`, { method: 'DELETE' });
    fetchMatches();
  };

  const filtered = matches.filter(m => !search ||
    m.acheteur_nom?.toLowerCase().includes(search.toLowerCase()) ||
    m.bien_reference?.toLowerCase().includes(search.toLowerCase()) ||
    m.bien_adresse?.toLowerCase().includes(search.toLowerCase())
  );

  const nouveaux = matches.filter(m => m.statut === 'nouveau').length;
  const scoresMoyen = matches.length ? Math.round(matches.reduce((s, m) => s + (m.score || 0), 0) / matches.length) : 0;

  const STATUT_OPTS = ['nouveau', 'contacté', 'visite', 'offre', 'signé', 'rejeté'];
  const STATUT_COLOR = { nouveau: '#3b82f6', contacté: '#d4a853', visite: '#8b5cf6', offre: '#f97316', signé: '#16a34a', rejeté: 'rgba(255,255,255,0.25)' };

  return (
    <>
      <Head><title>Matches — ProspectBot</title>
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
        .match-row:hover{background:rgba(255,255,255,0.03)!important}
        .del-btn:hover{color:#ef4444!important}
      `}</style>

      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', background: 'rgba(8,8,9,0.9)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <a href="/immobilier" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, color: '#d4a853', fontStyle: 'italic', textDecoration: 'none' }}>ProspectBot</a>
          <div style={{ display: 'flex', gap: 2 }}>
            {NAV_LINKS.map(([label, href]) => (
              <a key={href} href={href} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, color: href === '/matches' ? '#d4a853' : 'rgba(255,255,255,0.35)', background: href === '/matches' ? 'rgba(212,168,83,0.08)' : 'transparent', textDecoration: 'none' }}>{label}</a>
            ))}
          </div>
        </div>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>{agent?.name}</span>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '88px 28px 60px', position: 'relative', zIndex: 1, animation: 'fadeUp 0.45s both' }}>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 40, fontWeight: 300, color: '#f0f0f0', letterSpacing: '-0.5px' }}>
              <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg,#8b6914,#d4a853)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Matches</em> acheteur / bien
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{matches.length} match{matches.length > 1 ? 's' : ''} · {nouveaux} nouveau{nouveaux > 1 ? 'x' : ''}</p>
          </div>
          <button onClick={handleMatchAuto} disabled={running}
            style={{ padding: '10px 20px', background: running ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#8b6914,#d4a853)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: running ? 'rgba(255,255,255,0.3)' : '#0a0a0a', cursor: running ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
            {running ? <><span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#e8e8e8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Matching…</> : '⚡ Lancer le matching auto'}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, color: '#d4a853', fontWeight: 500 }}>{matches.length}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>Total matches</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, color: '#3b82f6', fontWeight: 500 }}>{nouveaux}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>Nouveaux</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, color: scoresMoyen >= 80 ? '#16a34a' : '#d4a853', fontWeight: 500 }}>{scoresMoyen}%</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>Score moyen</div>
          </div>
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par acheteur, référence…"
            style={{ flex: 1, minWidth: 200, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '9px 14px', fontSize: 13, color: '#e8e8e8' }} />
          <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
            <option value="">Tous statuts</option>
            {STATUT_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {error && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 13, color: '#ef4444', marginBottom: 16 }}>{error}</div>}

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: 'rgba(255,255,255,0.25)', marginBottom: 8 }}>Aucun match</div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', marginBottom: 16 }}>Lancez le matching automatique pour détecter les correspondances acheteur/bien.</p>
            <button onClick={handleMatchAuto} style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#8b6914,#d4a853)', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, color: '#0a0a0a', cursor: 'pointer' }}>⚡ Lancer le matching</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(m => (
              <div key={m.id} className="match-row"
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, transition: 'background 0.15s' }}>

                <ScoreBadge score={m.score} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, color: '#e8e8e8', fontWeight: 400 }}>{m.acheteur_nom}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>↔</span>
                    <span style={{ fontSize: 13.5, color: '#d4a853', fontFamily: 'Cormorant Garamond, serif' }}>{m.bien_reference}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {m.bien_adresse && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{m.bien_adresse}</span>}
                    {m.bien_prix && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{(m.bien_prix / 1000).toFixed(0)}k€</span>}
                    {m.bien_type && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>{m.bien_type}</span>}
                  </div>
                </div>

                {/* Sélecteur statut */}
                <select value={m.statut || 'nouveau'} onChange={e => handleUpdateStatut(m.id, e.target.value)}
                  onClick={e => e.stopPropagation()}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '5px 10px', fontSize: 12, color: STATUT_COLOR[m.statut] || '#e8e8e8', cursor: 'pointer' }}>
                  {STATUT_OPTS.map(s => <option key={s} value={s} style={{ background: '#111113', color: '#e8e8e8' }}>{s}</option>)}
                </select>

                {m.email_envoye && (
                  <span title="Email envoyé" style={{ fontSize: 16, opacity: 0.5 }}>✉</span>
                )}

                <button className="del-btn" onClick={() => handleDelete(m.id)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: 14, transition: 'color 0.15s', flexShrink: 0 }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
