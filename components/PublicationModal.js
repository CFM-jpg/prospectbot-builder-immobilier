// components/PublicationModal.js
// Modal de création + publication d'annonce immobilière

import { useState, useCallback } from 'react';

const PLATEFORMES = [
  {
    id: 'leboncoin',
    nom: 'LeBonCoin',
    logo: '🟠',
    couleur: '#FF6E14',
    description: 'API Pro disponible',
    requis: 'LEBONCOIN_API_KEY',
  },
  {
    id: 'seloger',
    nom: 'SeLoger',
    logo: '🔵',
    couleur: '#003189',
    description: 'Flux partenaire',
    requis: 'SELOGER_API_KEY',
  },
  {
    id: 'bienici',
    nom: 'BienIci',
    logo: '🟢',
    couleur: '#00B074',
    description: 'Groupe SeLoger',
    requis: 'SELOGER_API_KEY',
  },
  {
    id: 'pap',
    nom: 'PAP.fr',
    logo: '🔴',
    couleur: '#E30613',
    description: 'Lien pré-rempli',
    requis: null,
  },
  {
    id: 'logic_immo',
    nom: 'Logic-Immo',
    logo: '🟡',
    couleur: '#F5A623',
    description: 'API partenaire',
    requis: 'LOGIC_IMMO_API_KEY',
  },
];

const ETAPES = ['Bien', 'Détails', 'Photos', 'Texte IA', 'Publication'];

const TYPE_BIENS = ['Appartement', 'Maison', 'Studio', 'Loft', 'Villa', 'Terrain', 'Commerce', 'Bureau'];
const DPE_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const EQUIPEMENTS_LIST = [
  'Parking', 'Garage', 'Cave', 'Balcon', 'Terrasse', 'Jardin',
  'Piscine', 'Ascenseur', 'Digicode', 'Gardien', 'Interphone',
  'Double vitrage', 'Parquet', 'Cuisine équipée', 'Fibre optique',
];

export default function PublicationModal({ onClose, onSuccess }) {
  const [etape, setEtape] = useState(0);
  const [loading, setLoading] = useState(false);
  const [texteGenere, setTexteGenere] = useState(null);
  const [resultats, setResultats] = useState(null);
  const [plateformesSelectionnees, setPlateformesSelectionnees] = useState(['leboncoin', 'seloger', 'bienici', 'pap']);

  const [bien, setBien] = useState({
    type: 'Appartement',
    transaction: 'vente',
    surface: '',
    pieces: '',
    chambres: '',
    prix: '',
    ville: '',
    codePostal: '',
    etage: '',
    ascenseur: false,
    charges: '',
    depot: '',
    dpe: 'C',
    ges: 'C',
    equipements: [],
    photos: [],
    descriptionLibre: '',
  });

  const updateBien = (key, value) => setBien(prev => ({ ...prev, [key]: value }));

  const toggleEquipement = (eq) => {
    setBien(prev => ({
      ...prev,
      equipements: prev.equipements.includes(eq)
        ? prev.equipements.filter(e => e !== eq)
        : [...prev.equipements, eq],
    }));
  };

  const togglePlateforme = (id) => {
    setPlateformesSelectionnees(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files);
    const urls = files.map(f => URL.createObjectURL(f));
    updateBien('photos', [...bien.photos, ...urls]);
  };

  const genererTexte = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/immobilier/publier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generer', bien }),
      });
      const data = await res.json();
      if (data.texte) {
        setTexteGenere(data.texte);
        setEtape(3);
      }
    } catch (e) {
      // Fallback
      setTexteGenere({
        titre: `${bien.type} ${bien.surface}m² - ${bien.ville}`,
        description: `Beau ${bien.type.toLowerCase()} de ${bien.surface}m² situé à ${bien.ville}. ${bien.pieces} pièces dont ${bien.chambres} chambres. DPE ${bien.dpe}. ${bien.descriptionLibre}`,
        pointsForts: [`${bien.surface}m²`, `${bien.pieces} pièces`, `DPE ${bien.dpe}`, bien.ville],
        descriptionCourte: `${bien.type} ${bien.surface}m² ${bien.pieces}p - ${bien.ville}`,
      });
      setEtape(3);
    } finally {
      setLoading(false);
    }
  };

  const publier = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/immobilier/publier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'publier',
          bien: { ...bien, texteGenere },
          plateformes: plateformesSelectionnees,
        }),
      });
      const data = await res.json();
      if (data.resultats) {
        setResultats(data.resultats);
        setEtape(4);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    overlay: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px', backdropFilter: 'blur(4px)',
    },
    modal: {
      background: '#0f0f0f', border: '1px solid #2a2a2a',
      borderRadius: '16px', width: '100%', maxWidth: '720px',
      maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
    },
    header: {
      padding: '24px 28px 20px',
      borderBottom: '1px solid #1a1a1a',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    },
    title: {
      fontFamily: '"DM Serif Display", Georgia, serif',
      fontSize: '22px', color: '#fff', margin: 0,
    },
    closeBtn: {
      background: 'none', border: '1px solid #2a2a2a', color: '#666',
      width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '18px', transition: 'all 0.2s',
    },
    progress: {
      padding: '16px 28px',
      borderBottom: '1px solid #1a1a1a',
      display: 'flex', gap: '8px', alignItems: 'center',
    },
    step: (active, done) => ({
      flex: 1, textAlign: 'center',
      padding: '8px 4px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: active ? '600' : '400',
      color: done ? '#C9A84C' : active ? '#fff' : '#444',
      background: active ? '#1a1a1a' : 'transparent',
      border: `1px solid ${active ? '#C9A84C' : done ? '#C9A84C33' : '#1a1a1a'}`,
      transition: 'all 0.3s',
      cursor: 'default',
    }),
    body: {
      flex: 1, overflowY: 'auto', padding: '28px',
    },
    footer: {
      padding: '20px 28px',
      borderTop: '1px solid #1a1a1a',
      display: 'flex', justifyContent: 'space-between', gap: '12px',
    },
    btn: {
      padding: '10px 24px', borderRadius: '10px', fontFamily: '"DM Sans", sans-serif',
      fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
      border: 'none',
    },
    btnPrimary: {
      background: 'linear-gradient(135deg, #C9A84C, #e8c96a)',
      color: '#0a0a0a', flex: 1,
    },
    btnSecondary: {
      background: '#1a1a1a', color: '#888', border: '1px solid #2a2a2a',
    },
    label: {
      display: 'block', fontSize: '12px', color: '#888',
      fontFamily: '"DM Sans", sans-serif', fontWeight: '500',
      marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px',
    },
    input: {
      width: '100%', background: '#141414', border: '1px solid #2a2a2a',
      borderRadius: '10px', padding: '10px 14px', color: '#fff',
      fontFamily: '"DM Sans", sans-serif', fontSize: '14px',
      boxSizing: 'border-box', outline: 'none',
    },
    select: {
      width: '100%', background: '#141414', border: '1px solid #2a2a2a',
      borderRadius: '10px', padding: '10px 14px', color: '#fff',
      fontFamily: '"DM Sans", sans-serif', fontSize: '14px',
      boxSizing: 'border-box', outline: 'none',
    },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' },
    fieldGroup: { marginBottom: '20px' },
    sectionTitle: {
      fontFamily: '"DM Serif Display", Georgia, serif',
      fontSize: '16px', color: '#C9A84C', marginBottom: '16px', marginTop: '8px',
    },
    toggle: (active) => ({
      padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
      fontSize: '13px', fontFamily: '"DM Sans", sans-serif', fontWeight: '500',
      background: active ? '#C9A84C22' : '#141414',
      border: `1px solid ${active ? '#C9A84C' : '#2a2a2a'}`,
      color: active ? '#C9A84C' : '#666',
      transition: 'all 0.2s',
    }),
    textarea: {
      width: '100%', background: '#141414', border: '1px solid #2a2a2a',
      borderRadius: '10px', padding: '12px 14px', color: '#fff',
      fontFamily: '"DM Sans", sans-serif', fontSize: '14px',
      boxSizing: 'border-box', outline: 'none', resize: 'vertical', minHeight: '100px',
    },
  };

  // ── Étape 0 : Infos principales ──
  const renderEtape0 = () => (
    <div>
      <p style={styles.sectionTitle}>Informations principales</p>
      <div style={styles.fieldGroup}>
        <div style={styles.grid2}>
          <div>
            <label style={styles.label}>Transaction</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['vente', 'location'].map(t => (
                <button key={t} style={styles.toggle(bien.transaction === t)}
                  onClick={() => updateBien('transaction', t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={styles.label}>Type de bien</label>
            <select style={styles.select} value={bien.type} onChange={e => updateBien('type', e.target.value)}>
              {TYPE_BIENS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={styles.fieldGroup}>
        <div style={styles.grid3}>
          <div>
            <label style={styles.label}>Surface (m²)</label>
            <input style={styles.input} type="number" placeholder="75" value={bien.surface}
              onChange={e => updateBien('surface', e.target.value)} />
          </div>
          <div>
            <label style={styles.label}>Pièces</label>
            <input style={styles.input} type="number" placeholder="3" value={bien.pieces}
              onChange={e => updateBien('pieces', e.target.value)} />
          </div>
          <div>
            <label style={styles.label}>Chambres</label>
            <input style={styles.input} type="number" placeholder="2" value={bien.chambres}
              onChange={e => updateBien('chambres', e.target.value)} />
          </div>
        </div>
      </div>

      <div style={styles.fieldGroup}>
        <div style={styles.grid2}>
          <div>
            <label style={styles.label}>Prix (€){bien.transaction === 'location' ? '/mois' : ''}</label>
            <input style={styles.input} type="number" placeholder={bien.transaction === 'location' ? '1200' : '250000'}
              value={bien.prix} onChange={e => updateBien('prix', e.target.value)} />
          </div>
          <div>
            <label style={styles.label}>Ville</label>
            <input style={styles.input} type="text" placeholder="Paris" value={bien.ville}
              onChange={e => updateBien('ville', e.target.value)} />
          </div>
        </div>
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>Code postal</label>
        <input style={{ ...styles.input, maxWidth: '200px' }} type="text" placeholder="75001"
          value={bien.codePostal} onChange={e => updateBien('codePostal', e.target.value)} />
      </div>
    </div>
  );

  // ── Étape 1 : Détails avancés ──
  const renderEtape1 = () => (
    <div>
      <p style={styles.sectionTitle}>Détails & Diagnostics</p>

      <div style={styles.fieldGroup}>
        <div style={styles.grid3}>
          <div>
            <label style={styles.label}>Étage</label>
            <input style={styles.input} type="number" placeholder="2" value={bien.etage}
              onChange={e => updateBien('etage', e.target.value)} />
          </div>
          <div>
            <label style={styles.label}>DPE</label>
            <select style={styles.select} value={bien.dpe} onChange={e => updateBien('dpe', e.target.value)}>
              {DPE_OPTIONS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={styles.label}>GES</label>
            <select style={styles.select} value={bien.ges} onChange={e => updateBien('ges', e.target.value)}>
              {DPE_OPTIONS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      {bien.transaction === 'location' && (
        <div style={styles.fieldGroup}>
          <div style={styles.grid2}>
            <div>
              <label style={styles.label}>Charges (€/mois)</label>
              <input style={styles.input} type="number" placeholder="80" value={bien.charges}
                onChange={e => updateBien('charges', e.target.value)} />
            </div>
            <div>
              <label style={styles.label}>Dépôt de garantie (€)</label>
              <input style={styles.input} type="number" placeholder="2400" value={bien.depot}
                onChange={e => updateBien('depot', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      <div style={styles.fieldGroup}>
        <label style={styles.label}>Ascenseur</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[true, false].map(v => (
            <button key={v.toString()} style={styles.toggle(bien.ascenseur === v)}
              onClick={() => updateBien('ascenseur', v)}>
              {v ? 'Oui' : 'Non'}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>Équipements</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
          {EQUIPEMENTS_LIST.map(eq => (
            <button key={eq} style={styles.toggle(bien.equipements.includes(eq))}
              onClick={() => toggleEquipement(eq)}>
              {eq}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>Description libre (optionnel)</label>
        <textarea style={styles.textarea} placeholder="Ajoutez des détails supplémentaires pour enrichir l'annonce..."
          value={bien.descriptionLibre} onChange={e => updateBien('descriptionLibre', e.target.value)} />
      </div>
    </div>
  );

  // ── Étape 2 : Photos ──
  const renderEtape2 = () => (
    <div>
      <p style={styles.sectionTitle}>Photos</p>
      <div style={{
        border: '2px dashed #2a2a2a', borderRadius: '12px',
        padding: '32px', textAlign: 'center', cursor: 'pointer',
        background: '#0a0a0a', marginBottom: '20px',
        transition: 'border-color 0.2s',
      }}
        onClick={() => document.getElementById('photo-input').click()}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
        <p style={{ color: '#888', fontFamily: '"DM Sans", sans-serif', fontSize: '14px', margin: 0 }}>
          Cliquez pour ajouter des photos
        </p>
        <p style={{ color: '#444', fontFamily: '"DM Sans", sans-serif', fontSize: '12px', marginTop: '4px' }}>
          JPG, PNG · Max 10 photos
        </p>
        <input id="photo-input" type="file" accept="image/*" multiple hidden onChange={handlePhotos} />
      </div>

      {bien.photos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {bien.photos.map((p, i) => (
            <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: '10px', overflow: 'hidden' }}>
              <img src={p} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                onClick={() => updateBien('photos', bien.photos.filter((_, j) => j !== i))}
                style={{
                  position: 'absolute', top: '4px', right: '4px',
                  background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff',
                  width: '22px', height: '22px', borderRadius: '50%', cursor: 'pointer', fontSize: '12px',
                }}>×</button>
            </div>
          ))}
        </div>
      )}

      {bien.photos.length === 0 && (
        <p style={{ color: '#555', fontFamily: '"DM Sans", sans-serif', fontSize: '13px', textAlign: 'center' }}>
          Vous pouvez passer cette étape et ajouter les photos directement sur chaque site de publication.
        </p>
      )}
    </div>
  );

  // ── Étape 3 : Texte généré ──
  const renderEtape3 = () => (
    <div>
      <p style={styles.sectionTitle}>Texte généré par IA</p>

      {!texteGenere ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>✨</div>
          <p style={{ color: '#888', fontFamily: '"DM Sans", sans-serif', marginBottom: '20px' }}>
            Générez automatiquement un texte d'annonce optimisé pour chaque plateforme.
          </p>
          <button style={{ ...styles.btn, ...styles.btnPrimary, flex: 'none', padding: '12px 32px' }}
            onClick={genererTexte} disabled={loading}>
            {loading ? 'Génération en cours...' : '✨ Générer le texte'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={styles.label}>Titre</label>
            <input style={styles.input} value={texteGenere.titre}
              onChange={e => setTexteGenere(prev => ({ ...prev, titre: e.target.value }))} />
          </div>
          <div>
            <label style={styles.label}>Description complète</label>
            <textarea style={{ ...styles.textarea, minHeight: '140px' }}
              value={texteGenere.description}
              onChange={e => setTexteGenere(prev => ({ ...prev, description: e.target.value }))} />
          </div>
          <div>
            <label style={styles.label}>Description courte (LeBonCoin)</label>
            <textarea style={{ ...styles.textarea, minHeight: '60px' }}
              value={texteGenere.descriptionCourte}
              onChange={e => setTexteGenere(prev => ({ ...prev, descriptionCourte: e.target.value }))} />
          </div>
          <div>
            <label style={styles.label}>Points forts</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {texteGenere.pointsForts?.map((p, i) => (
                <span key={i} style={{
                  background: '#C9A84C22', border: '1px solid #C9A84C44',
                  color: '#C9A84C', padding: '4px 12px', borderRadius: '20px',
                  fontSize: '13px', fontFamily: '"DM Sans", sans-serif',
                }}>{p}</span>
              ))}
            </div>
          </div>
          <button style={{ ...styles.btn, background: '#1a1a1a', color: '#666', border: '1px solid #2a2a2a', alignSelf: 'flex-start' }}
            onClick={genererTexte} disabled={loading}>
            🔄 Régénérer
          </button>
        </div>
      )}
    </div>
  );

  // ── Étape 4 : Sélection plateformes + résultats ──
  const renderEtape4 = () => (
    <div>
      {!resultats ? (
        <>
          <p style={styles.sectionTitle}>Choisir les plateformes</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {PLATEFORMES.map(pl => (
              <div key={pl.id}
                onClick={() => togglePlateforme(pl.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px', borderRadius: '12px', cursor: 'pointer',
                  background: plateformesSelectionnees.includes(pl.id) ? '#1a1a1a' : '#0a0a0a',
                  border: `1px solid ${plateformesSelectionnees.includes(pl.id) ? '#C9A84C' : '#2a2a2a'}`,
                  transition: 'all 0.2s',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>{pl.logo}</span>
                  <div>
                    <p style={{ margin: 0, color: '#fff', fontFamily: '"DM Sans", sans-serif', fontWeight: '600', fontSize: '14px' }}>
                      {pl.nom}
                    </p>
                    <p style={{ margin: 0, color: '#555', fontSize: '12px', fontFamily: '"DM Sans", sans-serif' }}>
                      {pl.description}
                    </p>
                  </div>
                </div>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  border: `2px solid ${plateformesSelectionnees.includes(pl.id) ? '#C9A84C' : '#333'}`,
                  background: plateformesSelectionnees.includes(pl.id) ? '#C9A84C' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}>
                  {plateformesSelectionnees.includes(pl.id) && (
                    <span style={{ color: '#000', fontSize: '11px', fontWeight: 'bold' }}>✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <p style={styles.sectionTitle}>Résultats de publication</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(resultats).map(([id, resultat]) => {
              const pl = PLATEFORMES.find(p => p.id === id);
              const isPublie = resultat.status === 'publie';
              const isLien = resultat.status === 'lien_direct';
              const isErreur = resultat.status === 'erreur';
              const isNonConfig = resultat.status === 'non_configure';

              return (
                <div key={id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px', borderRadius: '12px',
                  background: '#0f0f0f', border: '1px solid #1a1a1a',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>{pl?.logo}</span>
                    <div>
                      <p style={{ margin: 0, color: '#fff', fontFamily: '"DM Sans", sans-serif', fontWeight: '600', fontSize: '14px' }}>
                        {pl?.nom}
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', fontFamily: '"DM Sans", sans-serif', color: '#666' }}>
                        {resultat.message || (isPublie ? 'Publié avec succès' : '')}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '11px',
                      fontFamily: '"DM Sans", sans-serif', fontWeight: '600',
                      background: isPublie ? '#00b07422' : isLien ? '#C9A84C22' : isNonConfig ? '#33333322' : '#ff000022',
                      color: isPublie ? '#00b074' : isLien ? '#C9A84C' : isNonConfig ? '#555' : '#ff4444',
                      border: `1px solid ${isPublie ? '#00b07444' : isLien ? '#C9A84C44' : isNonConfig ? '#333' : '#ff444444'}`,
                    }}>
                      {isPublie ? '✓ Publié' : isLien ? '🔗 Lien direct' : isNonConfig ? '⚙ Non configuré' : '✕ Erreur'}
                    </span>
                    {(isPublie || isLien) && resultat.url && (
                      <a href={resultat.url} target="_blank" rel="noopener noreferrer"
                        style={{
                          padding: '6px 14px', borderRadius: '8px', fontSize: '12px',
                          fontFamily: '"DM Sans", sans-serif', fontWeight: '600',
                          background: '#1a1a1a', color: '#C9A84C',
                          border: '1px solid #2a2a2a', textDecoration: 'none',
                        }}>
                        {isPublie ? 'Voir' : 'Publier →'}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );

  const canProceed = () => {
    if (etape === 0) return bien.surface && bien.pieces && bien.prix && bien.ville && bien.codePostal;
    if (etape === 1) return true;
    if (etape === 2) return true;
    if (etape === 3) return !!texteGenere;
    return true;
  };

  const handleNext = () => {
    if (etape === 2) { genererTexte(); return; }
    if (etape === 3) { setEtape(4); return; }
    if (etape === 4 && !resultats) { publier(); return; }
    if (etape === 4 && resultats) { onSuccess?.(); onClose(); return; }
    setEtape(e => e + 1);
  };

  const nextLabel = () => {
    if (etape === 2) return loading ? '✨ Génération...' : '✨ Générer le texte';
    if (etape === 3) return 'Choisir les plateformes →';
    if (etape === 4 && !resultats) return loading ? 'Publication en cours...' : `🚀 Publier sur ${plateformesSelectionnees.length} site${plateformesSelectionnees.length > 1 ? 's' : ''}`;
    if (etape === 4 && resultats) return 'Terminer ✓';
    return 'Continuer →';
  };

  return (
    <div style={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Publier une annonce</h2>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div style={styles.progress}>
          {ETAPES.map((s, i) => (
            <div key={s} style={styles.step(i === etape, i < etape)}>
              {i < etape ? '✓ ' : ''}{s}
            </div>
          ))}
        </div>

        <div style={styles.body}>
          {etape === 0 && renderEtape0()}
          {etape === 1 && renderEtape1()}
          {etape === 2 && renderEtape2()}
          {etape === 3 && renderEtape3()}
          {etape === 4 && renderEtape4()}
        </div>

        <div style={styles.footer}>
          {etape > 0 && !resultats ? (
            <button style={{ ...styles.btn, ...styles.btnSecondary }}
              onClick={() => setEtape(e => e - 1)}>
              ← Retour
            </button>
          ) : <div />}
          <button
            style={{ ...styles.btn, ...styles.btnPrimary, opacity: canProceed() ? 1 : 0.5 }}
            onClick={handleNext}
            disabled={!canProceed() || loading}>
            {nextLabel()}
          </button>
        </div>
      </div>
    </div>
  );
}
