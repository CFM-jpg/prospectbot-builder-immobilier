// pages/biens.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '../lib/useAuth';

const NAV_LINKS = [
  ['Dashboard', '/immobilier'], ['Biens', '/biens'], ['Acheteurs', '/acheteurs'],
  ['Matches', '/matches'], ['Vendeurs', '/vendeurs-potentiels'],
  ['Liquidité', '/liquidite'], ['Portefeuille', '/analyse-portefeuille'], ['Rapport PDF', '/rapport-pdf'],
];
const TYPES = ['appartement', 'maison', 'terrain', 'local commercial', 'autre'];
const STATUTS = ['disponible', 'vendu', 'loué', 'sous compromis'];

function StatBox({ label, value, color = '#d4a853' }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, color, fontWeight: 500 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{label}</div>
    </div>
  );
}

export default function BiensPage() {
  const { agent } = useAuth();
  const [biens, setBiens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [filtreType, setFiltreType] = useState('');
  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState({
    reference: '', type: 'appartement', titre: '', adresse: '', ville: '',
    code_postal: '', prix: '', surface: '', pieces: '', chambres: '',
    description: '', dpe: '', ges: '', etage: '', ascenseur: false,
    balcon: false, terrasse: false, jardin: false, parking: false, cave: false,
    statut: 'disponible',
  });

  const fetchBiens = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtreStatut) params.set('statut', filtreStatut);
      if (filtreType) params.set('type', filtreType);
      const res = await fetch(`/api/immobilier/biens?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBiens(data.data || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBiens(); }, [filtreStatut, filtreType]);

  const handleSave = async () => {
    if (!form.reference || !form.type || !form.prix) return setError('Référence, type et prix requis');
    setSaving(true); setError('');
    try {
      const body = { ...form, prix: parseFloat(form.prix), surface: form.surface ? parseFloat(form.surface) : null, pieces: form.pieces ? parseInt(form.pieces) : null, chambres: form.chambres ? parseInt(form.chambres) : null, etage: form.etage ? parseInt(form.etage) : null };
      const res = await fetch('/api/immobilier/biens', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowForm(false);
      setForm({ reference: '', type: 'appartement', titre: '', adresse: '', ville: '', code_postal: '', prix: '', surface: '', pieces: '', chambres: '', description: '', dpe: '', ges: '', etage: '', ascenseur: false, balcon: false, terrasse: false, jardin: false, parking: false, cave: false, statut: 'disponible' });
      fetchBiens();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce bien ?')) return;
    await fetch(`/api/immobilier/biens?id=${id}`, { method: 'DELETE' });
    fetchBiens();
    if (selected?.id === id) setSelected(null);
  };

  const filtered = biens.filter(b => !search || b.titre?.toLowerCase().includes(search.toLowerCase()) || b.ville?.toLowerCase().includes(search.toLowerCase()) || b.reference?.toLowerCase().includes(search.toLowerCase()));

  const disponibles = biens.filter(b => b.statut === 'disponible').length;
  const prixMoyen = biens.length ? Math.round(biens.reduce((s, b) => s + (b.prix || 0), 0) / biens.length) : 0;

  const STATUT_STYLE = { disponible: { color: '#16a34a', bg: 'rgba(22,163,74,0.1)', border: 'rgba(22,163,74,0.25)' }, vendu: { color: '#d4a853', bg: 'rgba(212,168,83,0.1)', border: 'rgba(212,168,83,0.25)' }, loué: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)' }, 'sous compromis': { color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)' } };

  return (
    <>
      <Head><title>Biens — ProspectBot</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',sans-serif;background:#080809;color:#e8e8e8;min-height:100vh}
        body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");opacity:0.4}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        input,textarea,select{font-family:'DM Sans',sans-serif}
        input:focus,textarea:focus,select:focus{outline:none}
        input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.2)}
        .row:hover{background:rgba(255,255,255,0.03)!important}
        .del-btn:hover{color:#ef4444!important}
      `}</style>

      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', background: 'rgba(8,8,9,0.9)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <a href="/immobilier" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, color: '#d4a853', fontStyle: 'italic', textDecoration: 'none' }}>ProspectBot</a>
          <div style={{ display: 'flex', gap: 2 }}>
            {NAV_LINKS.map(([label, href]) => (
              <a key={href} href={href} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, color: href === '/biens' ? '#d4a853' : 'rgba(255,255,255,0.35)', background: href === '/biens' ? 'rgba(212,168,83,0.08)' : 'transparent', textDecoration: 'none' }}>{label}</a>
            ))}
          </div>
        </div>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>{agent?.name}</span>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '88px 28px 60px', position: 'relative', zIndex: 1, animation: 'fadeUp 0.45s both' }}>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 40, fontWeight: 300, color: '#f0f0f0', letterSpacing: '-0.5px' }}>
              Biens & <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg,#8b6914,#d4a853)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>mandats</em>
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{biens.length} bien{biens.length > 1 ? 's' : ''} enregistré{biens.length > 1 ? 's' : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/import-biens" style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, fontSize: 12.5, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Importer CSV</a>
            <button onClick={() => setShowForm(true)} style={{ padding: '10px 20px', background: 'linear-gradient(135deg,#8b6914,#d4a853)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#0a0a0a', cursor: 'pointer' }}>+ Ajouter un bien</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
          <StatBox label="Total" value={biens.length} />
          <StatBox label="Disponibles" value={disponibles} color="#16a34a" />
          <StatBox label="Prix moyen" value={prixMoyen ? `${Math.round(prixMoyen / 1000)}k€` : '—'} />
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par titre, ville, référence…"
            style={{ flex: 1, minWidth: 200, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '9px 14px', fontSize: 13, color: '#e8e8e8' }} />
          <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
            <option value="">Tous statuts</option>
            {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filtreType} onChange={e => setFiltreType(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
            <option value="">Tous types</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {error && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 13, color: '#ef4444', marginBottom: 16 }}>{error}</div>}

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: 'rgba(255,255,255,0.25)', marginBottom: 8 }}>Aucun bien</div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', marginBottom: 16 }}>Ajoutez votre premier mandat.</p>
            <button onClick={() => setShowForm(true)} style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#8b6914,#d4a853)', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, color: '#0a0a0a', cursor: 'pointer' }}>+ Ajouter</button>
          </div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1.5fr 1fr 1fr 1fr 80px', padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              <span>Réf.</span><span>Bien</span><span>Ville</span><span>Prix</span><span>Surface</span><span>Statut</span><span></span>
            </div>
            {filtered.map((b, i) => {
              const s = STATUT_STYLE[b.statut] || STATUT_STYLE.disponible;
              return (
                <div key={b.id} className="row"
                  style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1.5fr 1fr 1fr 1fr 80px', padding: '13px 18px', borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: 'pointer', transition: 'background 0.15s', alignItems: 'center' }}
                  onClick={() => setSelected(b === selected ? null : b)}>
                  <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>{b.reference}</span>
                  <span style={{ fontSize: 13.5, color: '#e8e8e8' }}>{b.titre || `${b.type} ${b.ville}`}</span>
                  <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)' }}>{b.ville}{b.code_postal ? ` (${b.code_postal})` : ''}</span>
                  <span style={{ fontSize: 13, color: '#d4a853', fontFamily: 'Cormorant Garamond, serif' }}>{b.prix ? `${(b.prix / 1000).toFixed(0)}k€` : '—'}</span>
                  <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)' }}>{b.surface ? `${b.surface} m²` : '—'}</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: s.bg, border: `1px solid ${s.border}`, color: s.color, display: 'inline-block' }}>{b.statut}</span>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <a href={`/rapport-pdf?ville=${encodeURIComponent(b.ville || '')}&code=${b.code_postal || ''}`}
                      title="Rapport PDF" style={{ fontSize: 13, color: 'rgba(212,168,83,0.5)', textDecoration: 'none', padding: '2px 4px' }} onClick={e => e.stopPropagation()}>📄</a>
                    <button className="del-btn" onClick={e => { e.stopPropagation(); handleDelete(b.id); }}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: 14, transition: 'color 0.15s' }}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selected && (
          <div style={{ marginTop: 16, background: 'rgba(212,168,83,0.04)', border: '1px solid rgba(212,168,83,0.15)', borderRadius: 12, padding: '20px 24px', animation: 'fadeUp 0.3s both' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: '#f0f0f0' }}>{selected.titre || `${selected.type} — ${selected.ville}`}</div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 8 }}>
              {[['Adresse', selected.adresse || '—'], ['DPE', selected.dpe || '—'], ['GES', selected.ges || '—'], ['Étage', selected.etage ?? '—'], ['Pièces', selected.pieces || '—'], ['Chambres', selected.chambres || '—']].map(([k, v]) => (
                <div key={k} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 7, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{k}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {[['ascenseur','Ascenseur'],['balcon','Balcon'],['terrasse','Terrasse'],['jardin','Jardin'],['parking','Parking'],['cave','Cave']].filter(([k]) => selected[k]).map(([k, label]) => (
                <span key={k} style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: 'rgba(212,168,83,0.08)', border: '1px solid rgba(212,168,83,0.2)', color: '#d4a853' }}>{label}</span>
              ))}
            </div>
            {selected.description && <p style={{ marginTop: 10, fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{selected.description}</p>}
            <div style={{ marginTop: 12 }}>
              <a href={`/rapport-pdf?ville=${encodeURIComponent(selected.ville || '')}&code=${selected.code_postal || ''}`}
                style={{ fontSize: 12.5, padding: '8px 16px', background: 'linear-gradient(135deg,#8b6914,#d4a853)', borderRadius: 7, color: '#0a0a0a', fontWeight: 600, textDecoration: 'none' }}>
                Générer rapport PDF →
              </a>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '28px 32px', width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', animation: 'fadeUp 0.3s both' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 300, color: '#f0f0f0' }}>Nouveau bien</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>
            {error && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 13, color: '#ef4444', marginBottom: 16 }}>{error}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[['reference','Référence *'],['titre','Titre'],['adresse','Adresse'],['ville','Ville'],['code_postal','Code postal'],['prix','Prix (€) *'],['surface','Surface (m²)'],['pieces','Pièces'],['chambres','Chambres'],['dpe','DPE'],['ges','GES'],['etage','Étage']].map(([key, label]) => (
                <div key={key} style={{ gridColumn: ['adresse','titre'].includes(key) ? 'span 2' : 'span 1' }}>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 5 }}>{label}</label>
                  <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '9px 12px', fontSize: 13, color: '#e8e8e8' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 5 }}>Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '9px 12px', fontSize: 13, color: '#e8e8e8' }}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 5 }}>Statut</label>
                <select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '9px 12px', fontSize: 13, color: '#e8e8e8' }}>
                  {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              {[['ascenseur','Ascenseur'],['balcon','Balcon'],['terrasse','Terrasse'],['jardin','Jardin'],['parking','Parking'],['cave','Cave']].map(([key, label]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} style={{ accentColor: '#d4a853' }} />
                  {label}
                </label>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 5 }}>Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '9px 12px', fontSize: 13, color: '#e8e8e8', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '11px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, fontSize: 13, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 2, padding: '11px', background: 'linear-gradient(135deg,#8b6914,#d4a853)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#0a0a0a', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                {saving ? <><span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#0a0a0a', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Enregistrement…</> : 'Enregistrer →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
