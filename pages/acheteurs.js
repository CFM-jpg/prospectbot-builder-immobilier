// pages/acheteurs.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/useAuth';

const STATUTS = ['actif', 'inactif', 'acquis'];
const TYPES = ['appartement', 'maison', 'terrain', 'local commercial', 'autre'];

const NAV_LINKS = [
  ['Dashboard', '/immobilier'],
  ['Biens', '/biens'],
  ['Acheteurs', '/acheteurs'],
  ['Matches', '/matches'],
  ['Vendeurs', '/vendeurs-potentiels'],
  ['Liquidité', '/liquidite'],
  ['Portefeuille', '/analyse-portefeuille'],
  ['Rapport PDF', '/rapport-pdf'],
];

function StatBox({ label, value, color = '#d4a853' }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, color, fontWeight: 500 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{label}</div>
    </div>
  );
}

export default function AcheteursPage() {
  const router = useRouter();
  const { agent } = useAuth();

  const [acheteurs, setAcheteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [selected, setSelected] = useState(null); // acheteur détail

  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', telephone: '',
    budget_min: '', budget_max: '', surface_min: '', surface_max: '',
    pieces_min: '', villes: '', type_bien: [],
    avec_jardin: false, avec_parking: false, avec_balcon: false, avec_terrasse: false,
    notes: '', statut: 'actif',
  });

  const fetchAcheteurs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtreStatut) params.set('statut', filtreStatut);
      const res = await fetch(`/api/immobilier/acheteurs?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAcheteurs(data.data || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAcheteurs(); }, [filtreStatut]);

  const handleSave = async () => {
    if (!form.nom || !form.email) return setError('Nom et email requis');
    setSaving(true); setError('');
    try {
      const body = {
        ...form,
        budget_min: form.budget_min ? parseInt(form.budget_min) : 0,
        budget_max: form.budget_max ? parseInt(form.budget_max) : 0,
        surface_min: form.surface_min ? parseInt(form.surface_min) : null,
        surface_max: form.surface_max ? parseInt(form.surface_max) : null,
        pieces_min: form.pieces_min ? parseInt(form.pieces_min) : null,
        villes: form.villes ? form.villes.split(',').map(v => v.trim()).filter(Boolean) : [],
      };
      const res = await fetch('/api/immobilier/acheteurs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowForm(false);
      setForm({ nom: '', prenom: '', email: '', telephone: '', budget_min: '', budget_max: '', surface_min: '', surface_max: '', pieces_min: '', villes: '', type_bien: [], avec_jardin: false, avec_parking: false, avec_balcon: false, avec_terrasse: false, notes: '', statut: 'actif' });
      fetchAcheteurs();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet acheteur ?')) return;
    await fetch(`/api/immobilier/acheteurs?id=${id}`, { method: 'DELETE' });
    fetchAcheteurs();
    if (selected?.id === id) setSelected(null);
  };

  const filtered = acheteurs.filter(a =>
    !search || a.nom?.toLowerCase().includes(search.toLowerCase()) || a.email?.toLowerCase().includes(search.toLowerCase()) || a.villes?.some(v => v.toLowerCase().includes(search.toLowerCase()))
  );

  const actifs = acheteurs.filter(a => a.statut === 'actif').length;
  const budgetMoyen = acheteurs.length ? Math.round(acheteurs.reduce((s, a) => s + (a.budget_max || 0), 0) / acheteurs.length) : 0;

  return (
    <>
      <Head>
        <title>Acheteurs — ProspectBot</title>
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
          <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {NAV_LINKS.map(([label, href]) => (
              <a key={href} href={href} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, color: href === '/acheteurs' ? '#d4a853' : 'rgba(255,255,255,0.35)', background: href === '/acheteurs' ? 'rgba(212,168,83,0.08)' : 'transparent', textDecoration: 'none' }}>{label}</a>
            ))}
          </div>
        </div>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>{agent?.name}</span>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '88px 28px 60px', position: 'relative', zIndex: 1, animation: 'fadeUp 0.45s both' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 40, fontWeight: 300, color: '#f0f0f0', letterSpacing: '-0.5px' }}>
              Acheteurs <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg,#8b6914,#d4a853)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>actifs</em>
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{acheteurs.length} acheteur{acheteurs.length > 1 ? 's' : ''} enregistré{acheteurs.length > 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => setShowForm(true)} style={{ padding: '10px 20px', background: 'linear-gradient(135deg,#8b6914,#d4a853)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#0a0a0a', cursor: 'pointer' }}>
            + Ajouter un acheteur
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
          <StatBox label="Total" value={acheteurs.length} />
          <StatBox label="Actifs" value={actifs} color="#16a34a" />
          <StatBox label="Budget moyen max" value={budgetMoyen ? `${Math.round(budgetMoyen / 1000)}k€` : '—'} />
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom, email, ville…"
            style={{ flex: 1, minWidth: 200, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '9px 14px', fontSize: 13, color: '#e8e8e8' }} />
          <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '9px 14px', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
            <option value="">Tous statuts</option>
            {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {error && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 13, color: '#ef4444', marginBottom: 16 }}>{error}</div>}

        {/* Liste */}
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: 'rgba(255,255,255,0.25)', marginBottom: 8 }}>Aucun acheteur</div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', marginBottom: 16 }}>Ajoutez votre premier acheteur pour commencer le matching.</p>
            <button onClick={() => setShowForm(true)} style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#8b6914,#d4a853)', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, color: '#0a0a0a', cursor: 'pointer' }}>+ Ajouter</button>
          </div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
            {/* Header tableau */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1.5fr 1fr 80px', gap: 0, padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              <span>Nom</span><span>Email</span><span>Budget max</span><span>Villes</span><span>Statut</span><span></span>
            </div>
            {filtered.map((a, i) => (
              <div key={a.id} className="row"
                style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1.5fr 1fr 80px', gap: 0, padding: '13px 18px', borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: 'pointer', transition: 'background 0.15s', alignItems: 'center' }}
                onClick={() => setSelected(a === selected ? null : a)}>
                <span style={{ fontSize: 14, color: '#e8e8e8', fontWeight: 400 }}>{a.nom}{a.prenom ? ` ${a.prenom}` : ''}</span>
                <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)' }}>{a.email}</span>
                <span style={{ fontSize: 13, color: '#d4a853', fontFamily: 'Cormorant Garamond, serif' }}>{a.budget_max ? `${(a.budget_max / 1000).toFixed(0)}k€` : '—'}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{Array.isArray(a.villes) ? a.villes.slice(0, 2).join(', ') : (a.villes || '—')}</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: a.statut === 'actif' ? 'rgba(22,163,74,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${a.statut === 'actif' ? 'rgba(22,163,74,0.25)' : 'rgba(255,255,255,0.1)'}`, color: a.statut === 'actif' ? '#16a34a' : 'rgba(255,255,255,0.35)', display: 'inline-block' }}>{a.statut}</span>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="del-btn" onClick={e => { e.stopPropagation(); handleDelete(a.id); }}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: 14, transition: 'color 0.15s' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Détail acheteur */}
        {selected && (
          <div style={{ marginTop: 16, background: 'rgba(212,168,83,0.04)', border: '1px solid rgba(212,168,83,0.15)', borderRadius: 12, padding: '20px 24px', animation: 'fadeUp 0.3s both' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: '#f0f0f0' }}>{selected.nom} {selected.prenom}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{selected.email} {selected.telephone ? `· ${selected.telephone}` : ''}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 10 }}>
              {[
                ['Budget', selected.budget_min && selected.budget_max ? `${(selected.budget_min/1000).toFixed(0)}k – ${(selected.budget_max/1000).toFixed(0)}k €` : selected.budget_max ? `max ${(selected.budget_max/1000).toFixed(0)}k €` : '—'],
                ['Surface', selected.surface_min || selected.surface_max ? `${selected.surface_min || '?'} – ${selected.surface_max || '?'} m²` : '—'],
                ['Pièces min', selected.pieces_min || '—'],
                ['Villes', Array.isArray(selected.villes) ? selected.villes.join(', ') : (selected.villes || '—')],
                ['Types', Array.isArray(selected.type_bien) ? selected.type_bien.join(', ') : (selected.type_bien || '—')],
              ].map(([k, v]) => (
                <div key={k} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 7, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{v}</div>
                </div>
              ))}
            </div>
            {selected.notes && <p style={{ marginTop: 12, fontSize: 13, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>{selected.notes}</p>}
          </div>
        )}
      </div>

      {/* Modal ajout */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '28px 32px', width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', animation: 'fadeUp 0.3s both' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 300, color: '#f0f0f0' }}>Nouvel acheteur</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>

            {error && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 13, color: '#ef4444', marginBottom: 16 }}>{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[['nom','Nom *'],['prenom','Prénom'],['email','Email *'],['telephone','Téléphone'],['budget_min','Budget min (€)'],['budget_max','Budget max (€)'],['surface_min','Surface min (m²)'],['surface_max','Surface max (m²)'],['pieces_min','Pièces min'],['villes','Villes (séparées par virgule)']].map(([key, label]) => (
                <div key={key} style={{ gridColumn: ['villes','email','nom'].includes(key) ? 'span 2' : 'span 1' }}>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 5 }}>{label}</label>
                  <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '9px 12px', fontSize: 13, color: '#e8e8e8' }} />
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 6 }}>Types de biens</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {TYPES.map(t => (
                  <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type_bien: f.type_bien.includes(t) ? f.type_bien.filter(x => x !== t) : [...f.type_bien, t] }))}
                    style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, border: `1px solid ${form.type_bien.includes(t) ? 'rgba(212,168,83,0.5)' : 'rgba(255,255,255,0.1)'}`, background: form.type_bien.includes(t) ? 'rgba(212,168,83,0.1)' : 'transparent', color: form.type_bien.includes(t) ? '#d4a853' : 'rgba(255,255,255,0.35)', cursor: 'pointer' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              {[['avec_jardin','Jardin'],['avec_parking','Parking'],['avec_balcon','Balcon'],['avec_terrasse','Terrasse']].map(([key, label]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} style={{ accentColor: '#d4a853' }} />
                  {label}
                </label>
              ))}
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 5 }}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
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
