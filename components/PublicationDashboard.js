// components/PublicationDashboard.js
// Onglet de gestion des annonces publiées — vue d'ensemble + statuts par plateforme

import { useState, useEffect } from 'react';
import PublicationModal from './PublicationModal';

const PLATEFORME_META = {
  leboncoin: { nom: 'LeBonCoin', logo: '🟠', couleur: '#FF6E14' },
  seloger:   { nom: 'SeLoger',   logo: '🔵', couleur: '#003189' },
  bienici:   { nom: 'BienIci',   logo: '🟢', couleur: '#00B074' },
  pap:       { nom: 'PAP.fr',    logo: '🔴', couleur: '#E30613' },
  logic_immo:{ nom: 'Logic-Immo',logo: '🟡', couleur: '#F5A623' },
};

const STATUS_CONFIG = {
  publie:        { label: 'Publié',         color: '#00b074', bg: '#00b07415', border: '#00b07430' },
  lien_direct:   { label: 'Lien direct',    color: '#C9A84C', bg: '#C9A84C15', border: '#C9A84C30' },
  non_configure: { label: 'Non configuré',  color: '#555',    bg: '#55555515', border: '#55555530' },
  erreur:        { label: 'Erreur',         color: '#ff4444', bg: '#ff444415', border: '#ff444430' },
};

export default function PublicationDashboard() {
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [annonceSelectionnee, setAnnonceSelectionnee] = useState(null);

  const chargerAnnonces = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/immobilier/publier');
      const data = await res.json();
      setAnnonces(data.annonces || []);
    } catch (e) {
      setAnnonces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { chargerAnnonces(); }, []);

  const styles = {
    container: { padding: '0' },
    topBar: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: '24px',
    },
    sectionTitle: {
      fontFamily: '"DM Serif Display", Georgia, serif',
      fontSize: '20px', color: '#fff', margin: 0,
    },
    btnPublier: {
      padding: '10px 22px', borderRadius: '10px',
      background: 'linear-gradient(135deg, #C9A84C, #e8c96a)',
      color: '#0a0a0a', fontFamily: '"DM Sans", sans-serif',
      fontSize: '14px', fontWeight: '700', border: 'none', cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s',
      boxShadow: '0 4px 16px #C9A84C30',
    },
    statsRow: {
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '16px', marginBottom: '28px',
    },
    statCard: {
      background: '#0f0f0f', border: '1px solid #1a1a1a',
      borderRadius: '12px', padding: '18px 20px',
    },
    statNum: {
      fontFamily: '"DM Serif Display", Georgia, serif',
      fontSize: '28px', color: '#C9A84C', margin: 0,
    },
    statLabel: {
      fontFamily: '"DM Sans", sans-serif',
      fontSize: '12px', color: '#555', marginTop: '4px',
      textTransform: 'uppercase', letterSpacing: '0.5px',
    },
    emptyState: {
      textAlign: 'center', padding: '60px 20px',
      background: '#0a0a0a', border: '1px solid #1a1a1a',
      borderRadius: '16px',
    },
    emptyIcon: { fontSize: '48px', marginBottom: '16px' },
    emptyText: {
      fontFamily: '"DM Sans", sans-serif',
      color: '#555', fontSize: '15px', marginBottom: '8px',
    },
    emptySubtext: {
      fontFamily: '"DM Sans", sans-serif',
      color: '#333', fontSize: '13px',
    },
    annonceCard: (selected) => ({
      background: selected ? '#141414' : '#0a0a0a',
      border: `1px solid ${selected ? '#C9A84C44' : '#1a1a1a'}`,
      borderRadius: '12px', padding: '18px 20px',
      marginBottom: '12px', cursor: 'pointer',
      transition: 'all 0.2s',
    }),
    annonceHeader: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      marginBottom: '12px',
    },
    annonceTitre: {
      fontFamily: '"DM Serif Display", Georgia, serif',
      fontSize: '16px', color: '#fff', margin: 0,
    },
    annonceDate: {
      fontFamily: '"DM Sans", sans-serif',
      fontSize: '12px', color: '#444',
    },
    annonceMeta: {
      display: 'flex', gap: '16px', marginBottom: '14px',
    },
    metaItem: {
      fontFamily: '"DM Sans", sans-serif',
      fontSize: '13px', color: '#888',
    },
    metaValue: { color: '#C9A84C', fontWeight: '600' },
    plateformesRow: {
      display: 'flex', gap: '8px', flexWrap: 'wrap',
    },
    plateformeBadge: (status) => {
      const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.erreur;
      return {
        padding: '4px 10px', borderRadius: '20px',
        fontSize: '11px', fontFamily: '"DM Sans", sans-serif', fontWeight: '600',
        background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
        display: 'flex', alignItems: 'center', gap: '4px',
      };
    },
    detailPanel: {
      background: '#0f0f0f', border: '1px solid #1a1a1a',
      borderRadius: '16px', padding: '24px',
      marginTop: '24px',
    },
    detailTitle: {
      fontFamily: '"DM Serif Display", Georgia, serif',
      fontSize: '18px', color: '#C9A84C', marginBottom: '20px',
    },
    detailPlateforme: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 16px', borderRadius: '10px',
      background: '#0a0a0a', border: '1px solid #1a1a1a',
      marginBottom: '10px',
    },
    linkBtn: {
      padding: '6px 14px', borderRadius: '8px',
      background: '#1a1a1a', color: '#C9A84C',
      border: '1px solid #2a2a2a', textDecoration: 'none',
      fontFamily: '"DM Sans", sans-serif', fontSize: '12px', fontWeight: '600',
    },
    configBanner: {
      background: '#1a0f0022', border: '1px solid #C9A84C22',
      borderRadius: '12px', padding: '16px 20px',
      marginBottom: '24px',
      display: 'flex', alignItems: 'flex-start', gap: '12px',
    },
    configIcon: { fontSize: '20px', marginTop: '2px' },
    configText: {
      fontFamily: '"DM Sans", sans-serif', fontSize: '13px', color: '#888',
    },
    configTitle: { color: '#C9A84C', fontWeight: '600', marginBottom: '4px' },
  };

  // Stats
  const totalPublies = annonces.reduce((acc, a) => {
    const res = a.resultats_publication || {};
    return acc + Object.values(res).filter(r => r.status === 'publie').length;
  }, 0);
  const totalLiens = annonces.reduce((acc, a) => {
    const res = a.resultats_publication || {};
    return acc + Object.values(res).filter(r => r.status === 'lien_direct').length;
  }, 0);
  const apisConnectees = ['LEBONCOIN_API_KEY', 'SELOGER_API_KEY'].filter(k =>
    typeof window !== 'undefined' && false // côté client on ne peut pas voir les env vars
  ).length;

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <h2 style={styles.sectionTitle}>Publication d'annonces</h2>
        <button style={styles.btnPublier} onClick={() => setShowModal(true)}>
          + Nouvelle annonce
        </button>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <p style={styles.statNum}>{annonces.length}</p>
          <p style={styles.statLabel}>Annonces créées</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statNum}>{totalPublies}</p>
          <p style={styles.statLabel}>Publications auto</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statNum}>{totalLiens}</p>
          <p style={styles.statLabel}>Liens directs</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statNum}>5</p>
          <p style={styles.statLabel}>Plateformes dispo</p>
        </div>
      </div>

      {/* Bannière config APIs */}
      <div style={styles.configBanner}>
        <span style={styles.configIcon}>⚙️</span>
        <div>
          <p style={{ ...styles.configText, ...styles.configTitle }}>Configuration des APIs partenaires</p>
          <p style={styles.configText}>
            Pour activer la publication automatique, ajoutez vos clés dans Vercel → Settings → Environment Variables :{' '}
            <code style={{ background: '#1a1a1a', padding: '2px 6px', borderRadius: '4px', color: '#C9A84C', fontSize: '12px' }}>LEBONCOIN_API_KEY</code>,{' '}
            <code style={{ background: '#1a1a1a', padding: '2px 6px', borderRadius: '4px', color: '#C9A84C', fontSize: '12px' }}>SELOGER_API_KEY</code>,{' '}
            <code style={{ background: '#1a1a1a', padding: '2px 6px', borderRadius: '4px', color: '#C9A84C', fontSize: '12px' }}>ANTHROPIC_API_KEY</code>.
            Sans clé, les annonces sont générées et les liens directs fonctionnent.
          </p>
        </div>
      </div>

      {/* Liste annonces */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#444', fontFamily: '"DM Sans", sans-serif' }}>
          Chargement...
        </div>
      ) : annonces.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📝</div>
          <p style={styles.emptyText}>Aucune annonce publiée pour l'instant.</p>
          <p style={styles.emptySubtext}>Cliquez sur "+ Nouvelle annonce" pour créer et diffuser votre première annonce.</p>
        </div>
      ) : (
        <div>
          {annonces.map((annonce, i) => {
            const b = annonce.bien_data || {};
            const res = annonce.resultats_publication || {};
            const isSelected = annonceSelectionnee?.id === annonce.id;

            return (
              <div key={annonce.id || i}>
                <div style={styles.annonceCard(isSelected)}
                  onClick={() => setAnnonceSelectionnee(isSelected ? null : annonce)}>
                  <div style={styles.annonceHeader}>
                    <h3 style={styles.annonceTitre}>
                      {annonce.texte_genere?.titre || `${b.type} ${b.surface}m² - ${b.ville}`}
                    </h3>
                    <span style={styles.annonceDate}>
                      {new Date(annonce.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  <div style={styles.annonceMeta}>
                    <span style={styles.metaItem}>
                      <span style={styles.metaValue}>{b.surface}m²</span> · {b.pieces}p · {b.chambres}ch
                    </span>
                    <span style={styles.metaItem}>
                      <span style={styles.metaValue}>
                        {b.prix?.toLocaleString('fr-FR')}€{b.transaction === 'location' ? '/mois' : ''}
                      </span>
                    </span>
                    <span style={styles.metaItem}>{b.ville} ({b.codePostal})</span>
                  </div>

                  <div style={styles.plateformesRow}>
                    {Object.entries(res).map(([pl, data]) => {
                      const meta = PLATEFORME_META[pl];
                      return (
                        <span key={pl} style={styles.plateformeBadge(data.status)}>
                          {meta?.logo} {meta?.nom}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Panneau détail */}
                {isSelected && (
                  <div style={styles.detailPanel}>
                    <p style={styles.detailTitle}>Statut par plateforme</p>
                    {Object.entries(res).map(([pl, data]) => {
                      const meta = PLATEFORME_META[pl];
                      const cfg = STATUS_CONFIG[data.status] || STATUS_CONFIG.erreur;
                      return (
                        <div key={pl} style={styles.detailPlateforme}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '20px' }}>{meta?.logo}</span>
                            <div>
                              <p style={{ margin: 0, color: '#fff', fontFamily: '"DM Sans", sans-serif', fontWeight: '600', fontSize: '14px' }}>
                                {meta?.nom}
                              </p>
                              <p style={{ margin: 0, color: '#555', fontSize: '12px', fontFamily: '"DM Sans", sans-serif' }}>
                                {data.message || cfg.label}
                              </p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span style={{
                              padding: '4px 10px', borderRadius: '20px',
                              fontSize: '11px', fontFamily: '"DM Sans", sans-serif', fontWeight: '600',
                              background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                            }}>{cfg.label}</span>
                            {data.url && (
                              <a href={data.url} target="_blank" rel="noopener noreferrer" style={styles.linkBtn}>
                                {data.status === 'publie' ? 'Voir l\'annonce →' : 'Publier →'}
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {annonce.texte_genere && (
                      <div style={{ marginTop: '20px', padding: '16px', background: '#0a0a0a', borderRadius: '10px', border: '1px solid #1a1a1a' }}>
                        <p style={{ color: '#C9A84C', fontSize: '12px', fontFamily: '"DM Sans", sans-serif', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>
                          Texte généré
                        </p>
                        <p style={{ color: '#888', fontSize: '13px', fontFamily: '"DM Sans", sans-serif', lineHeight: '1.6' }}>
                          {annonce.texte_genere.description}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <PublicationModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); chargerAnnonces(); }}
        />
      )}
    </div>
  );
}
