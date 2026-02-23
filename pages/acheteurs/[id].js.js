// pages/acheteurs/[id].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function AcheteurDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/immobilier/acheteurs/${id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const scoreColor = (score) => {
    if (score >= 80) return '#4ade80';
    if (score >= 60) return '#f59e0b';
    return '#6b7280';
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatBudget = (n) => {
    if (!n) return '—';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  };

  const initials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) return (
    <div style={styles.loadingScreen}>
      <div style={styles.spinner} />
      <p style={{ color: '#6b7280', fontFamily: 'DM Sans, sans-serif', marginTop: 16 }}>Chargement...</p>
    </div>
  );

  if (!data || !data.acheteur) return (
    <div style={styles.loadingScreen}>
      <p style={{ color: '#ef4444', fontFamily: 'DM Sans, sans-serif' }}>Acheteur introuvable</p>
      <Link href="/immobilier" style={styles.backLinkError}>← Retour au dashboard</Link>
    </div>
  );

  const { acheteur, matches, emails } = data;

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble' },
    { id: 'criteres', label: 'Critères' },
    { id: 'matches', label: `Correspondances (${matches.length})` },
    { id: 'emails', label: `Emails (${emails.length})` },
  ];

  return (
    <>
      <Head>
        <title>{acheteur.nom || 'Acheteur'} — ProspectBot</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <div style={styles.page}>
        {/* Topbar */}
        <div style={styles.topbar}>
          <Link href="/immobilier" style={styles.backBtn}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Dashboard
          </Link>
          <span style={styles.breadcrumb}>Acheteurs / {acheteur.nom || 'Sans nom'}</span>
        </div>

        <div style={styles.container}>
          {/* Header acheteur */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.avatar}>{initials(acheteur.nom)}</div>
              <div>
                <h1 style={styles.name}>{acheteur.nom || 'Sans nom'}</h1>
                <div style={styles.headerMeta}>
                  {acheteur.email && (
                    <a href={`mailto:${acheteur.email}`} style={styles.metaChip}>
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg>
                      {acheteur.email}
                    </a>
                  )}
                  {acheteur.telephone && (
                    <a href={`tel:${acheteur.telephone}`} style={styles.metaChip}>
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 0117 2.18 2 2 0 0119.92 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L23.09 9.91a16 16 0 006.29 6.29l1.18-1.18a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                      {acheteur.telephone}
                    </a>
                  )}
                  <span style={styles.dateChip}>Inscrit le {formatDate(acheteur.created_at)}</span>
                </div>
              </div>
            </div>

            <div style={styles.headerRight}>
              <div style={styles.budgetCard}>
                <span style={styles.budgetLabel}>Budget max</span>
                <span style={styles.budgetValue}>{formatBudget(acheteur.budget_max)}</span>
              </div>
              <div style={styles.statPill}>
                <span style={{ color: '#4ade80', fontWeight: 600 }}>{matches.length}</span>
                <span style={{ color: '#9ca3af', fontSize: 12 }}>correspondances</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={styles.tabBar}>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{ ...styles.tab, ...(activeTab === t.id ? styles.tabActive : {}) }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Contenu tabs */}
          <div style={styles.content}>

            {/* VUE D'ENSEMBLE */}
            {activeTab === 'overview' && (
              <div style={styles.overviewGrid}>
                {/* Infos contact */}
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>Contact & Budget</h3>
                  <div style={styles.infoList}>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Nom</span>
                      <span style={styles.infoValue}>{acheteur.nom || '—'}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Email</span>
                      <span style={styles.infoValue}>{acheteur.email || '—'}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Téléphone</span>
                      <span style={styles.infoValue}>{acheteur.telephone || '—'}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Budget min</span>
                      <span style={styles.infoValue}>{formatBudget(acheteur.budget_min)}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Budget max</span>
                      <span style={{ ...styles.infoValue, color: '#c9a96e', fontWeight: 600 }}>{formatBudget(acheteur.budget_max)}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Source</span>
                      <span style={styles.infoValue}>{acheteur.source || 'Manuel'}</span>
                    </div>
                  </div>
                </div>

                {/* Résumé critères */}
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>Recherche en résumé</h3>
                  <div style={styles.infoList}>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Type de bien</span>
                      <span style={styles.infoValue}>{acheteur.type_bien || 'Tous'}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Localisation</span>
                      <span style={styles.infoValue}>{acheteur.ville || acheteur.departement || '—'}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Surface min</span>
                      <span style={styles.infoValue}>{acheteur.surface_min ? `${acheteur.surface_min} m²` : '—'}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Pièces min</span>
                      <span style={styles.infoValue}>{acheteur.pieces_min ? `${acheteur.pieces_min} pièces` : '—'}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Statut</span>
                      <span style={{ ...styles.infoValue, color: acheteur.actif ? '#4ade80' : '#ef4444' }}>
                        {acheteur.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Meilleures correspondances */}
                <div style={{ ...styles.card, gridColumn: '1 / -1' }}>
                  <h3 style={styles.cardTitle}>Top correspondances</h3>
                  {matches.length === 0 ? (
                    <p style={styles.emptyText}>Aucune correspondance pour le moment</p>
                  ) : (
                    <div style={styles.matchesList}>
                      {matches.slice(0, 5).map((m, i) => (
                        <Link href={`/biens/${m.bien_id}`} key={i} style={styles.matchRow}>
                          <div style={styles.matchInfo}>
                            <span style={styles.matchTitle}>{m.bien?.titre || 'Bien sans titre'}</span>
                            <span style={styles.matchSub}>{m.bien?.ville} · {m.bien?.surface ? `${m.bien.surface} m²` : ''}</span>
                          </div>
                          <div style={styles.matchRight}>
                            <span style={styles.matchPrice}>{formatBudget(m.bien?.prix)}</span>
                            <div style={{ ...styles.scoreBadge, background: scoreColor(m.score) + '20', color: scoreColor(m.score) }}>
                              {m.score}%
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CRITÈRES */}
            {activeTab === 'criteres' && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Critères de recherche détaillés</h3>
                <div style={styles.criteresGrid}>
                  {[
                    { label: 'Type de bien', value: acheteur.type_bien },
                    { label: 'Ville / Zone', value: acheteur.ville },
                    { label: 'Département', value: acheteur.departement },
                    { label: 'Code postal', value: acheteur.code_postal },
                    { label: 'Budget minimum', value: formatBudget(acheteur.budget_min) },
                    { label: 'Budget maximum', value: formatBudget(acheteur.budget_max) },
                    { label: 'Surface minimum', value: acheteur.surface_min ? `${acheteur.surface_min} m²` : null },
                    { label: 'Surface maximum', value: acheteur.surface_max ? `${acheteur.surface_max} m²` : null },
                    { label: 'Pièces minimum', value: acheteur.pieces_min },
                    { label: 'Chambres minimum', value: acheteur.chambres_min },
                    { label: 'Jardin', value: acheteur.jardin ? 'Oui' : null },
                    { label: 'Terrasse', value: acheteur.terrasse ? 'Oui' : null },
                    { label: 'Parking', value: acheteur.parking ? 'Oui' : null },
                    { label: 'Cave', value: acheteur.cave ? 'Oui' : null },
                    { label: 'Piscine', value: acheteur.piscine ? 'Oui' : null },
                    { label: 'Notes', value: acheteur.notes },
                  ].map((item, i) => item.value ? (
                    <div key={i} style={styles.critereItem}>
                      <span style={styles.critereLabel}>{item.label}</span>
                      <span style={styles.critereValue}>{item.value}</span>
                    </div>
                  ) : null)}
                </div>
              </div>
            )}

            {/* CORRESPONDANCES */}
            {activeTab === 'matches' && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Toutes les correspondances</h3>
                {matches.length === 0 ? (
                  <p style={styles.emptyText}>Aucune correspondance trouvée</p>
                ) : (
                  <div style={styles.matchesList}>
                    {matches.map((m, i) => (
                      <Link href={`/biens/${m.bien_id}`} key={i} style={styles.matchRow}>
                        <div style={{ ...styles.matchRank, color: i < 3 ? '#c9a96e' : '#4b5563' }}>#{i + 1}</div>
                        <div style={styles.matchInfo}>
                          <span style={styles.matchTitle}>{m.bien?.titre || 'Bien sans titre'}</span>
                          <span style={styles.matchSub}>
                            {[m.bien?.ville, m.bien?.surface ? `${m.bien.surface} m²` : null, m.bien?.pieces ? `${m.bien.pieces} pièces` : null].filter(Boolean).join(' · ')}
                          </span>
                        </div>
                        <div style={styles.matchRight}>
                          <span style={styles.matchPrice}>{formatBudget(m.bien?.prix)}</span>
                          <div style={{ ...styles.scoreBadge, background: scoreColor(m.score) + '20', color: scoreColor(m.score) }}>
                            {m.score}%
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* EMAILS */}
            {activeTab === 'emails' && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Historique des emails</h3>
                {emails.length === 0 ? (
                  <p style={styles.emptyText}>Aucun email envoyé pour le moment</p>
                ) : (
                  <div style={styles.emailsList}>
                    {emails.map((email, i) => (
                      <div key={i} style={styles.emailRow}>
                        <div style={{ ...styles.emailStatus, background: email.status === 'sent' ? '#4ade8020' : '#ef444420', color: email.status === 'sent' ? '#4ade80' : '#ef4444' }}>
                          {email.status === 'sent' ? '✓' : '✗'}
                        </div>
                        <div style={styles.emailInfo}>
                          <span style={styles.emailSubject}>{email.subject || 'Sans objet'}</span>
                          <span style={styles.emailMeta}>
                            {formatDate(email.sent_at)}
                            {email.bien_id && ` · Bien #${email.bien_id}`}
                          </span>
                        </div>
                        <div style={{ ...styles.emailBadge, background: email.opened ? '#4ade8015' : 'transparent', color: email.opened ? '#4ade80' : '#6b7280' }}>
                          {email.opened ? 'Ouvert' : 'Non ouvert'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0f0f0f',
    fontFamily: 'DM Sans, sans-serif',
  },
  loadingScreen: {
    minHeight: '100vh',
    background: '#0f0f0f',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 32,
    height: 32,
    border: '2px solid #1f1f1f',
    borderTop: '2px solid #c9a96e',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  topbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '16px 32px',
    borderBottom: '1px solid #1a1a1a',
    background: '#0a0a0a',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#9ca3af',
    textDecoration: 'none',
    fontSize: 14,
    fontFamily: 'DM Sans, sans-serif',
    transition: 'color 0.2s',
  },
  breadcrumb: {
    color: '#4b5563',
    fontSize: 13,
    fontFamily: 'DM Sans, sans-serif',
  },
  backLinkError: {
    color: '#c9a96e',
    textDecoration: 'none',
    fontFamily: 'DM Sans, sans-serif',
    marginTop: 16,
  },
  container: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '40px 32px',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 40,
    gap: 24,
    flexWrap: 'wrap',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #c9a96e, #8b6914)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    fontWeight: 600,
    color: '#0f0f0f',
    fontFamily: 'DM Serif Display, serif',
    flexShrink: 0,
  },
  name: {
    fontFamily: 'DM Serif Display, serif',
    fontSize: 28,
    color: '#f5f0e8',
    margin: '0 0 10px 0',
    fontWeight: 400,
  },
  headerMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  metaChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: '#9ca3af',
    fontSize: 13,
    textDecoration: 'none',
    background: '#1a1a1a',
    padding: '4px 10px',
    borderRadius: 20,
    border: '1px solid #262626',
  },
  dateChip: {
    color: '#6b7280',
    fontSize: 13,
    background: '#1a1a1a',
    padding: '4px 10px',
    borderRadius: 20,
    border: '1px solid #262626',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  budgetCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    background: '#1a1a1a',
    border: '1px solid #262626',
    borderRadius: 12,
    padding: '12px 20px',
  },
  budgetLabel: {
    fontSize: 11,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 4,
  },
  budgetValue: {
    fontSize: 22,
    fontFamily: 'DM Serif Display, serif',
    color: '#c9a96e',
    fontWeight: 400,
  },
  statPill: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: '#1a1a1a',
    border: '1px solid #262626',
    borderRadius: 12,
    padding: '12px 20px',
    gap: 2,
  },
  tabBar: {
    display: 'flex',
    gap: 4,
    borderBottom: '1px solid #1a1a1a',
    marginBottom: 32,
  },
  tab: {
    background: 'none',
    border: 'none',
    padding: '10px 18px',
    color: '#6b7280',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'DM Sans, sans-serif',
    borderBottom: '2px solid transparent',
    marginBottom: -1,
    transition: 'color 0.2s',
  },
  tabActive: {
    color: '#c9a96e',
    borderBottomColor: '#c9a96e',
  },
  content: {},
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20,
  },
  card: {
    background: '#141414',
    border: '1px solid #1f1f1f',
    borderRadius: 16,
    padding: '24px 28px',
  },
  cardTitle: {
    fontFamily: 'DM Serif Display, serif',
    fontSize: 18,
    color: '#f5f0e8',
    fontWeight: 400,
    margin: '0 0 20px 0',
  },
  infoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #1a1a1a',
  },
  infoLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#d1d5db',
    fontWeight: 500,
  },
  criteresGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  critereItem: {
    background: '#1a1a1a',
    borderRadius: 10,
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  critereLabel: {
    fontSize: 11,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  critereValue: {
    fontSize: 15,
    color: '#e5e7eb',
    fontWeight: 500,
  },
  matchesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  matchRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '14px 16px',
    borderRadius: 10,
    background: '#1a1a1a',
    marginBottom: 6,
    textDecoration: 'none',
    transition: 'background 0.2s',
    cursor: 'pointer',
  },
  matchRank: {
    fontSize: 13,
    fontWeight: 600,
    width: 28,
    flexShrink: 0,
  },
  matchInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  matchTitle: {
    fontSize: 14,
    color: '#e5e7eb',
    fontWeight: 500,
  },
  matchSub: {
    fontSize: 12,
    color: '#6b7280',
  },
  matchRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  matchPrice: {
    fontSize: 14,
    color: '#c9a96e',
    fontWeight: 600,
  },
  scoreBadge: {
    fontSize: 12,
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: 20,
  },
  emailsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  emailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 16px',
    borderRadius: 10,
    background: '#1a1a1a',
  },
  emailStatus: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  emailInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  emailSubject: {
    fontSize: 14,
    color: '#e5e7eb',
    fontWeight: 500,
  },
  emailMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  emailBadge: {
    fontSize: 12,
    padding: '3px 10px',
    borderRadius: 20,
    border: '1px solid #262626',
  },
  emptyText: {
    color: '#4b5563',
    fontSize: 14,
    textAlign: 'center',
    padding: '32px 0',
  },
};
