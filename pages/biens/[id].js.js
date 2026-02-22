// pages/biens/[id].js

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/useAuth';

export default function BienDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { agent, logout } = useAuth();

  const [bien, setBien] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/immobilier/biens/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error || !d.data) { setNotFound(true); }
        else { setBien(d.data); setMatches(d.matches || []); }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const fmt = (n) => n ? n.toLocaleString('fr-FR') + ' €' : '—';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  const photos = bien?.photos?.length ? bien.photos : bien?.image ? [bien.image] : [];
  const TYPES = { maison: 'Maison', appartement: 'Appartement', terrain: 'Terrain', commercial: 'Local commercial', autre: 'Autre' };
  const SOURCES = { bienici: "Bien'ici", seloger: 'SeLoger', leboncoin: 'LeBonCoin' };
  const scoreColor = (s) => s >= 80 ? '#3ecf8e' : s >= 60 ? '#d4a853' : '#a0a0ae';

  return (
    <>
      <Head>
        <title>{bien?.titre || 'Détail du bien'} — Immo Pro</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',sans-serif;background:#0f0f11;color:#e8e8e8;min-height:100vh}
        :root{
          --bg:#0f0f11;--surface:#17171a;--surface2:#1f1f24;
          --border:rgba(255,255,255,0.07);--bh:rgba(255,255,255,0.14);
          --text:#e8e8e8;--muted:#6b6b78;--dim:#a0a0ae;
          --accent:#d4a853;--accent-dim:rgba(212,168,83,0.12);--accent-b:rgba(212,168,83,0.3);
          --green:#3ecf8e;--green-dim:rgba(62,207,142,0.1);
          --red:#f04444;--red-dim:rgba(240,68,68,0.1);
          --blue:#5b8dee;--blue-dim:rgba(91,141,238,0.1);
          --orange:#f97316;--orange-dim:rgba(249,115,22,0.1);
        }
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#2a2a30;border-radius:2px}

        .topbar{
          position:sticky;top:0;z-index:50;
          background:rgba(15,15,17,0.92);backdrop-filter:blur(12px);
          border-bottom:1px solid var(--border);
          height:56px;padding:0 40px;
          display:flex;align-items:center;justify-content:space-between;
        }
        .topbar-left{display:flex;align-items:center;gap:14px}
        .back-btn{
          display:inline-flex;align-items:center;gap:6px;
          padding:7px 14px;background:var(--surface);border:1px solid var(--border);
          border-radius:8px;color:var(--dim);font-size:13px;
          cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s;
        }
        .back-btn:hover{border-color:var(--bh);color:var(--text)}
        .breadcrumb{font-size:12.5px;color:var(--muted);display:flex;align-items:center;gap:7px}
        .crumb{cursor:pointer;transition:color .15s}.crumb:hover{color:var(--dim)}
        .topbar-right{display:flex;align-items:center;gap:10px}
        .agent-chip{display:flex;align-items:center;gap:7px;padding:5px 12px;background:var(--surface);border:1px solid var(--border);border-radius:20px;font-size:12px;color:var(--dim)}
        .dot-g{width:6px;height:6px;border-radius:50%;background:var(--green)}
        .logout-t{padding:6px 12px;border-radius:8px;font-size:12px;color:var(--muted);background:none;border:1px solid var(--border);cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s}
        .logout-t:hover{color:var(--red);border-color:rgba(240,68,68,.3)}

        .page{max-width:1160px;margin:0 auto;padding:36px 40px 80px}

        .state-center{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:14px;text-align:center;color:var(--muted)}
        .state-center strong{font-family:'DM Serif Display',serif;font-size:22px;color:var(--dim);display:block}
        .spin{width:28px;height:28px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .7s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}

        .hero{display:grid;grid-template-columns:1fr 360px;gap:28px;margin-bottom:28px;align-items:start}

        .gallery-main{
          aspect-ratio:16/9;background:var(--surface);border:1px solid var(--border);
          border-radius:14px;overflow:hidden;position:relative;
          display:flex;align-items:center;justify-content:center;margin-bottom:8px;
        }
        .gallery-main img{width:100%;height:100%;object-fit:cover;display:block}
        .g-empty{display:flex;flex-direction:column;align-items:center;gap:10px;color:var(--muted);font-size:13px}
        .g-empty-icon{width:56px;height:56px;border:1px solid var(--border);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;background:var(--surface2)}
        .g-status{position:absolute;top:14px;left:14px;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600}
        .g-src{position:absolute;bottom:12px;right:12px;padding:3px 9px;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);border-radius:5px;font-size:11px;color:rgba(255,255,255,.65)}
        .g-nav{position:absolute;top:50%;transform:translateY(-50%);width:34px;height:34px;border-radius:50%;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,.1);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;transition:background .15s}
        .g-nav:hover{background:rgba(0,0,0,.7)}.g-prev{left:12px}.g-next{right:12px}
        .g-counter{position:absolute;bottom:12px;left:12px;padding:3px 8px;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);border-radius:5px;font-size:11px;color:rgba(255,255,255,.7)}
        .thumbs{display:flex;gap:7px;overflow-x:auto}
        .thumb{width:68px;height:50px;border-radius:7px;overflow:hidden;flex-shrink:0;border:2px solid transparent;cursor:pointer;transition:border-color .15s;background:var(--surface2)}
        .thumb.on{border-color:var(--accent)}.thumb img{width:100%;height:100%;object-fit:cover}

        .info-panel{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:26px;position:sticky;top:68px}
        .info-type{font-size:11px;text-transform:uppercase;letter-spacing:.8px;color:var(--muted);font-weight:600;margin-bottom:7px}
        .info-title{font-family:'DM Serif Display',serif;font-size:21px;color:var(--text);letter-spacing:-.3px;line-height:1.3;margin-bottom:8px}
        .info-loc{font-size:13px;color:var(--muted);margin-bottom:20px}
        .info-price{font-family:'DM Serif Display',serif;font-size:34px;color:var(--text);letter-spacing:-1.5px;line-height:1}
        .info-psqm{font-size:12px;color:var(--muted);margin-top:5px;margin-bottom:22px}
        .specs-mini{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:22px}
        .spec-m{background:var(--surface2);border-radius:8px;padding:11px 13px}
        .spec-m-l{font-size:10px;text-transform:uppercase;letter-spacing:.4px;color:var(--muted);font-weight:600;margin-bottom:3px}
        .spec-m-v{font-size:15px;font-weight:500;color:var(--text)}
        .div{border:none;border-top:1px solid var(--border);margin:18px 0}
        .cta{display:flex;align-items:center;justify-content:center;width:100%;padding:12px;border-radius:10px;font-size:13.5px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;text-decoration:none;text-align:center;transition:all .15s;margin-bottom:9px;border:none}
        .cta-g{background:var(--accent);color:#0f0f11}.cta-g:hover{opacity:.9}
        .cta-o{background:none;color:var(--dim);border:1px solid var(--border)}.cta-o:hover{border-color:var(--bh);color:var(--text)}
        .meta-rows{display:flex;flex-direction:column;gap:9px}
        .meta-r{display:flex;justify-content:space-between;align-items:center;font-size:13px}
        .meta-k{color:var(--muted)}.meta-v{color:var(--dim);font-weight:500}

        .body-grid{display:grid;grid-template-columns:1fr 360px;gap:28px;align-items:start}
        .body-left{display:flex;flex-direction:column;gap:20px}

        .sec{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:22px}
        .sec-title{font-size:11.5px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--muted);margin-bottom:16px;display:flex;align-items:center;justify-content:space-between}
        .desc-text{font-size:14px;color:var(--dim);line-height:1.78}
        .carac-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
        .carac{background:var(--surface2);border-radius:8px;padding:13px}
        .carac-l{font-size:10px;text-transform:uppercase;letter-spacing:.4px;color:var(--muted);margin-bottom:4px}
        .carac-v{font-size:14px;font-weight:500;color:var(--text)}
        .equip-wrap{display:flex;flex-wrap:wrap;gap:8px}
        .equip{padding:6px 12px;border-radius:6px;font-size:12.5px;background:var(--surface2);border:1px solid var(--border);color:var(--dim)}
        .equip.on{background:var(--green-dim);border-color:rgba(62,207,142,.2);color:var(--green)}

        .match-item{display:flex;align-items:center;padding:13px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:9px;margin-bottom:8px;gap:14px;transition:border-color .15s}
        .match-item:hover{border-color:var(--bh)}
        .match-av{width:36px;height:36px;border-radius:50%;background:var(--accent-dim);border:1px solid var(--accent-b);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;color:var(--accent);flex-shrink:0;font-family:'DM Serif Display',serif}
        .match-name{font-size:13.5px;font-weight:500;color:var(--text)}
        .match-email{font-size:11.5px;color:var(--muted);margin-top:2px}
        .match-budget{font-size:11px;color:var(--dim);margin-top:2px}
        .score-wrap{text-align:right;flex-shrink:0}
        .score-num{font-family:'DM Serif Display',serif;font-size:20px;letter-spacing:-.5px}
        .score-lbl{font-size:10px;color:var(--muted)}
        .score-bar{height:3px;background:var(--border);border-radius:2px;margin-top:5px;width:56px}
        .score-fill{height:100%;border-radius:2px}

        .dpe{width:36px;height:36px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#fff}
        .dpe-A{background:#00b050}.dpe-B{background:#5bc235}.dpe-C{background:#a8d100}
        .dpe-D{background:#ffcc00;color:#333}.dpe-E{background:#f7921e}.dpe-F{background:#e55a1c}.dpe-G{background:#c0001c}

        .badge{display:inline-block;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:500}
        .b-green{background:var(--green-dim);color:var(--green)}
        .b-red{background:var(--red-dim);color:var(--red)}
        .b-orange{background:var(--orange-dim);color:var(--orange)}
        .b-blue{background:var(--blue-dim);color:var(--blue)}
        .b-neutral{background:var(--surface2);color:var(--muted)}
        .b-gold{background:var(--accent-dim);color:var(--accent)}

        @media(max-width:960px){
          .topbar{padding:0 20px}.page{padding:24px 20px 60px}
          .hero,.body-grid{grid-template-columns:1fr}.info-panel{position:static}
          .carac-grid{grid-template-columns:1fr 1fr}
        }
      `}</style>

      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-left">
          <button className="back-btn" onClick={() => router.back()}>← Retour</button>
          <div className="breadcrumb">
            <span className="crumb" onClick={() => router.push('/immobilier')}>Annonces</span>
            <span style={{ opacity: .4 }}>/</span>
            <span style={{ color: 'var(--dim)' }}>
              {bien?.titre ? (bien.titre.length > 40 ? bien.titre.slice(0, 40) + '…' : bien.titre) : 'Détail du bien'}
            </span>
          </div>
        </div>
        {agent && (
          <div className="topbar-right">
            <div className="agent-chip"><span className="dot-g" />{agent.name}</div>
            <button className="logout-t" onClick={logout}>Déconnexion</button>
          </div>
        )}
      </header>

      <div className="page">

        {loading && (
          <div className="state-center">
            <div className="spin" />
            <p>Chargement du bien…</p>
          </div>
        )}

        {!loading && notFound && (
          <div className="state-center">
            <strong>Bien introuvable</strong>
            <p style={{ fontSize: 13 }}>Ce bien n'existe pas ou a été supprimé.</p>
            <button className="back-btn" style={{ marginTop: 8 }} onClick={() => router.push('/immobilier')}>← Retour aux annonces</button>
          </div>
        )}

        {!loading && bien && (
          <>
            {/* Hero */}
            <div className="hero">
              {/* Galerie */}
              <div>
                <div className="gallery-main">
                  {photos.length > 0 ? (
                    <>
                      <img src={photos[activeImg]} alt={bien.titre} />
                      {photos.length > 1 && (
                        <>
                          <button className="g-nav g-prev" onClick={() => setActiveImg(i => (i - 1 + photos.length) % photos.length)}>‹</button>
                          <button className="g-nav g-next" onClick={() => setActiveImg(i => (i + 1) % photos.length)}>›</button>
                          <div className="g-counter">{activeImg + 1} / {photos.length}</div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="g-empty">
                      <div className="g-empty-icon">⬡</div>
                      <span>Aucune photo disponible</span>
                    </div>
                  )}
                  {bien.statut && bien.statut !== 'disponible' && (
                    <div className="g-status" style={bien.statut === 'vendu' ? { background: 'var(--red-dim)', color: 'var(--red)' } : { background: 'var(--orange-dim)', color: 'var(--orange)' }}>
                      {bien.statut === 'vendu' ? 'Vendu' : 'Sous compromis'}
                    </div>
                  )}
                  {bien.source && <div className="g-src">{SOURCES[bien.source] || bien.source}</div>}
                </div>
                {photos.length > 1 && (
                  <div className="thumbs">
                    {photos.map((p, i) => (
                      <div key={i} className={`thumb ${activeImg === i ? 'on' : ''}`} onClick={() => setActiveImg(i)}>
                        <img src={p} alt="" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Panel infos */}
              <div className="info-panel">
                <div className="info-type">
                  {TYPES[bien.type] || 'Bien immobilier'}
                  {bien.source && <span style={{ opacity: .6 }}> · {SOURCES[bien.source] || bien.source}</span>}
                </div>
                <div className="info-title">{bien.titre || 'Sans titre'}</div>
                <div className="info-loc">◎ {[bien.ville, bien.code_postal].filter(Boolean).join(' ') || 'Localisation non renseignée'}</div>

                <div className="info-price">{fmt(bien.prix)}</div>
                {bien.prix && bien.surface && (
                  <div className="info-psqm">{Math.round(bien.prix / bien.surface).toLocaleString('fr-FR')} €/m²</div>
                )}

                <div className="specs-mini">
                  {bien.surface && <div className="spec-m"><div className="spec-m-l">Surface</div><div className="spec-m-v">{bien.surface} m²</div></div>}
                  {bien.pieces && <div className="spec-m"><div className="spec-m-l">Pièces</div><div className="spec-m-v">{bien.pieces}</div></div>}
                  {bien.chambres && <div className="spec-m"><div className="spec-m-l">Chambres</div><div className="spec-m-v">{bien.chambres}</div></div>}
                  {bien.etage !== null && bien.etage !== undefined && <div className="spec-m"><div className="spec-m-l">Étage</div><div className="spec-m-v">{bien.etage === 0 ? 'RDC' : `${bien.etage}ᵉ`}</div></div>}
                </div>

                <hr className="div" />

                {bien.lien
                  ? <a href={bien.lien} target="_blank" rel="noopener noreferrer" className="cta cta-g">Voir l'annonce originale →</a>
                  : <button className="cta cta-g" disabled style={{ opacity: .4, cursor: 'default' }}>Pas de lien disponible</button>
                }
                <button className="cta cta-o" onClick={() => router.push('/immobilier')}>Retour aux annonces</button>

                <hr className="div" />

                <div className="meta-rows">
                  {bien.reference && <div className="meta-r"><span className="meta-k">Référence</span><span className="meta-v" style={{ fontFamily: 'monospace', fontSize: 11 }}>{bien.reference}</span></div>}
                  <div className="meta-r"><span className="meta-k">Ajouté le</span><span className="meta-v">{fmtDate(bien.created_at)}</span></div>
                  <div className="meta-r">
                    <span className="meta-k">Statut</span>
                    <span className={`badge ${bien.statut === 'vendu' ? 'b-red' : bien.statut === 'sous_compromis' ? 'b-orange' : 'b-green'}`}>
                      {bien.statut === 'vendu' ? 'Vendu' : bien.statut === 'sous_compromis' ? 'Sous compromis' : 'Disponible'}
                    </span>
                  </div>
                  {bien.dpe && (
                    <div className="meta-r">
                      <span className="meta-k">DPE / GES</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <div className={`dpe dpe-${bien.dpe}`}>{bien.dpe}</div>
                        {bien.ges && <div className={`dpe dpe-${bien.ges}`}>{bien.ges}</div>}
                      </div>
                    </div>
                  )}
                  {matches.length > 0 && <div className="meta-r"><span className="meta-k">Acheteurs matchés</span><span className="badge b-gold">{matches.length}</span></div>}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="body-grid">
              <div className="body-left">

                {bien.description && (
                  <div className="sec">
                    <div className="sec-title">Description</div>
                    <p className="desc-text">{bien.description}</p>
                  </div>
                )}

                <div className="sec">
                  <div className="sec-title">Caractéristiques</div>
                  <div className="carac-grid">
                    <div className="carac"><div className="carac-l">Type</div><div className="carac-v">{TYPES[bien.type] || '—'}</div></div>
                    {bien.surface && <div className="carac"><div className="carac-l">Surface</div><div className="carac-v">{bien.surface} m²</div></div>}
                    {bien.pieces && <div className="carac"><div className="carac-l">Pièces</div><div className="carac-v">{bien.pieces} pièce{bien.pieces > 1 ? 's' : ''}</div></div>}
                    {bien.chambres && <div className="carac"><div className="carac-l">Chambres</div><div className="carac-v">{bien.chambres}</div></div>}
                    {bien.sdb && <div className="carac"><div className="carac-l">Salles de bain</div><div className="carac-v">{bien.sdb}</div></div>}
                    {bien.ville && <div className="carac"><div className="carac-l">Ville</div><div className="carac-v">{bien.ville}</div></div>}
                    {bien.code_postal && <div className="carac"><div className="carac-l">Code postal</div><div className="carac-v">{bien.code_postal}</div></div>}
                    {bien.prix && bien.surface && <div className="carac"><div className="carac-l">Prix / m²</div><div className="carac-v">{Math.round(bien.prix / bien.surface).toLocaleString('fr-FR')} €</div></div>}
                    {bien.annee_construction && <div className="carac"><div className="carac-l">Construction</div><div className="carac-v">{bien.annee_construction}</div></div>}
                    {bien.etage !== null && bien.etage !== undefined && <div className="carac"><div className="carac-l">Étage</div><div className="carac-v">{bien.etage === 0 ? 'RDC' : `${bien.etage}ᵉ étage`}</div></div>}
                    {bien.charges && <div className="carac"><div className="carac-l">Charges</div><div className="carac-v">{bien.charges.toLocaleString('fr-FR')} €/mois</div></div>}
                  </div>
                </div>

                {(bien.jardin || bien.terrasse || bien.balcon || bien.parking || bien.cave || bien.ascenseur || bien.piscine || bien.gardien) && (
                  <div className="sec">
                    <div className="sec-title">Équipements</div>
                    <div className="equip-wrap">
                      {[
                        { k: 'jardin', l: 'Jardin' }, { k: 'terrasse', l: 'Terrasse' },
                        { k: 'balcon', l: 'Balcon' }, { k: 'parking', l: 'Parking' },
                        { k: 'cave', l: 'Cave' }, { k: 'ascenseur', l: 'Ascenseur' },
                        { k: 'piscine', l: 'Piscine' }, { k: 'gardien', l: 'Gardien' },
                      ].map(e => (
                        <span key={e.k} className={`equip ${bien[e.k] ? 'on' : ''}`}>{e.l}</span>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Colonne droite */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                <div className="sec">
                  <div className="sec-title">
                    <span>Acheteurs correspondants</span>
                    {matches.length > 0 && <span className="badge b-gold">{matches.length}</span>}
                  </div>

                  {matches.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--muted)', fontSize: 13 }}>
                      <div style={{ fontSize: 28, marginBottom: 10, opacity: .3 }}>◎</div>
                      Aucun acheteur ne correspond<br />encore à ce bien
                    </div>
                  ) : (
                    [...matches].sort((a, b) => b.score - a.score).map((m, i) => (
                      <div key={i} className="match-item">
                        <div className="match-av">{(m.acheteur_nom || 'A').charAt(0).toUpperCase()}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="match-name">{m.acheteur_nom || 'Acheteur'}</div>
                          <div className="match-email">{m.acheteur_email || '—'}</div>
                          {(m.budget_min || m.budget_max) && (
                            <div className="match-budget">
                              {m.budget_min?.toLocaleString('fr-FR')} € → {m.budget_max?.toLocaleString('fr-FR')} €
                            </div>
                          )}
                        </div>
                        <div className="score-wrap">
                          <div className="score-num" style={{ color: scoreColor(m.score) }}>{m.score}%</div>
                          <div className="score-lbl">match</div>
                          <div className="score-bar">
                            <div className="score-fill" style={{ width: `${m.score}%`, background: scoreColor(m.score) }} />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="sec">
                  <div className="sec-title">Informations</div>
                  <div className="meta-rows">
                    <div className="meta-r"><span className="meta-k">Source</span><span className="badge b-blue">{SOURCES[bien.source] || bien.source || '—'}</span></div>
                    {bien.reference && <div className="meta-r"><span className="meta-k">Référence</span><span className="meta-v" style={{ fontFamily: 'monospace', fontSize: 11 }}>{bien.reference}</span></div>}
                    <div className="meta-r"><span className="meta-k">Importé le</span><span className="meta-v">{fmtDate(bien.created_at)}</span></div>
                    {bien.updated_at && <div className="meta-r"><span className="meta-k">Mis à jour</span><span className="meta-v">{fmtDate(bien.updated_at)}</span></div>}
                    {bien.lien && (
                      <div className="meta-r">
                        <span className="meta-k">Annonce</span>
                        <a href={bien.lien} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>Voir l'original →</a>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
