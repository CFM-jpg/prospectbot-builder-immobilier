// components/QuestionnaireOffre.js
// Questionnaire interactif pour recommander le meilleur plan
// Usage : <QuestionnaireOffre /> sur la landing page dans la section #tarifs

import { useState } from 'react';

const QUESTIONS = [
  {
    id: 'profil',
    question: 'Quel est votre profil ?',
    options: [
      { value: 'agent_solo', label: 'Agent indépendant', desc: 'Je travaille seul' },
      { value: 'equipe', label: 'Petite équipe', desc: '2 à 5 personnes' },
      { value: 'agence', label: 'Agence immobilière', desc: 'Structure établie' },
      { value: 'promoteur', label: 'Promoteur / Investisseur', desc: 'Volume important' },
    ],
  },
  {
    id: 'biens_mois',
    question: 'Combien de nouveaux biens gérez-vous par mois ?',
    options: [
      { value: 'moins_5', label: 'Moins de 5', desc: 'Activité modérée' },
      { value: '5_20', label: '5 à 20', desc: 'Activité régulière' },
      { value: 'plus_20', label: 'Plus de 20', desc: 'Fort volume' },
    ],
  },
  {
    id: 'acheteurs',
    question: 'Combien d\'acheteurs suivez-vous en ce moment ?',
    options: [
      { value: 'moins_10', label: 'Moins de 10', desc: 'Portefeuille réduit' },
      { value: '10_50', label: '10 à 50', desc: 'Portefeuille actif' },
      { value: 'plus_50', label: 'Plus de 50', desc: 'Large portefeuille' },
    ],
  },
  {
    id: 'besoins',
    question: 'Quels sont vos besoins prioritaires ?',
    multiple: true,
    options: [
      { value: 'scraping', label: 'Scraping automatique', desc: 'Trouver des biens' },
      { value: 'ia', label: 'Intelligence artificielle', desc: 'Matching & rédaction' },
      { value: 'publication', label: 'Publication multi-sites', desc: 'LeBonCoin, SeLoger...' },
      { value: 'emails', label: 'Emails automatiques', desc: 'Alertes acheteurs' },
      { value: 'stats', label: 'Statistiques avancées', desc: 'Performance & reporting' },
      { value: 'b2b', label: 'Prospection B2B', desc: 'Trouver des vendeurs' },
    ],
  },
  {
    id: 'objectif',
    question: 'Quel est votre objectif principal ?',
    options: [
      { value: 'decouverte', label: 'Découvrir l\'outil', desc: 'Sans engagement' },
      { value: 'optimiser', label: 'Optimiser mon activité', desc: 'Gagner du temps' },
      { value: 'scaler', label: 'Développer mon agence', desc: 'Croissance rapide' },
    ],
  },
  {
    id: 'budget',
    question: 'Quel budget mensuel envisagez-vous ?',
    options: [
      { value: 'gratuit', label: 'Gratuit d\'abord', desc: 'Tester sans risque' },
      { value: 'flexible', label: 'Jusqu\'à 59€/mois', desc: 'Investissement raisonnable' },
      { value: 'professionnel', label: '59€ et plus', desc: 'ROI professionnel' },
    ],
  },
];

const PLAN_COLORS = {
  gratuit: { bg: '#4ade8010', border: '#4ade8040', text: '#4ade80', btn: 'linear-gradient(135deg, #22c55e, #4ade80)' },
  pro:     { bg: '#c9a96e10', border: '#c9a96e40', text: '#c9a96e', btn: 'linear-gradient(135deg, #8b6914, #c9a96e)' },
  agence:  { bg: '#a78bfa10', border: '#a78bfa40', text: '#a78bfa', btn: 'linear-gradient(135deg, #7c3aed, #a78bfa)' },
};

export default function QuestionnaireOffre() {
  const [etape, setEtape] = useState(0); // 0 = intro, 1-N = questions, N+1 = résultat
  const [reponses, setReponses] = useState({});
  const [resultat, setResultat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState(null);

  const totalEtapes = QUESTIONS.length;
  const questionIndex = etape - 1;
  const questionCourante = QUESTIONS[questionIndex];
  const estIntro = etape === 0;
  const estResultat = etape === totalEtapes + 1;
  const progress = estResultat ? 100 : Math.round((etape / totalEtapes) * 100);

  const selectionner = (questionId, valeur, multiple) => {
    if (multiple) {
      const current = reponses[questionId] || [];
      const newVal = current.includes(valeur)
        ? current.filter(v => v !== valeur)
        : [...current, valeur];
      setReponses(r => ({ ...r, [questionId]: newVal }));
    } else {
      setReponses(r => ({ ...r, [questionId]: valeur }));
      // Auto-avance pour les questions simples (après 300ms)
      setTimeout(() => suivant(questionId, multiple ? reponses[questionId] : valeur), 300);
    }
  };

  const suivant = async (lastId, lastVal) => {
    if (etape < totalEtapes) {
      setEtape(e => e + 1);
    } else {
      // Dernière question → calculer
      await calculerRecommandation();
    }
  };

  const calculerRecommandation = async () => {
    setLoading(true);
    setErreur(null);
    try {
      const res = await fetch('/api/recommande-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reponses }),
      });
      const data = await res.json();
      if (data.success) {
        setResultat(data);
        setEtape(totalEtapes + 1);
      } else {
        setErreur(data.error || 'Erreur lors du calcul');
      }
    } catch (e) {
      setErreur('Erreur réseau. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const recommencer = () => {
    setEtape(0);
    setReponses({});
    setResultat(null);
    setErreur(null);
  };

  const s = styles;

  // ─── INTRO ────────────────────────────────────────────────────────────────
  if (estIntro) {
    return (
      <div style={s.wrapper}>
        <div style={s.card}>
          <h2 style={s.introTitle}>Trouvez votre offre idéale</h2>
          <p style={s.introDesc}>
            Répondez à 6 questions en moins d'une minute.<br />
            Notre algorithme vous recommande le plan parfait pour votre activité.
          </p>
          <div style={s.introFeatures}>
            {['Analyse personnalisée', 'Recommandation instantanée', 'Sans inscription'].map(f => (
              <span key={f} style={s.introFeature}>✓ {f}</span>
            ))}
          </div>
          <button style={s.btnPrimary} onClick={() => setEtape(1)}>
            Commencer le questionnaire →
          </button>
        </div>
      </div>
    );
  }

  // ─── RÉSULTAT ────────────────────────────────────────────────────────────
  if (estResultat && resultat) {
    const { recommandation, alternatives } = resultat;
    const colors = PLAN_COLORS[recommandation.plan];

    return (
      <div style={s.wrapper}>
        <div style={{ ...s.card, maxWidth: 560 }}>
          {/* En-tête résultat */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 8, fontFamily: 'DM Sans, sans-serif' }}>
              Notre recommandation pour vous
            </p>
            <h2 style={{ ...s.introTitle, marginBottom: 6 }}>
              Plan <span style={{ color: colors.text }}>{recommandation.nom}</span>
            </h2>
            <p style={{ color: colors.text, fontSize: 28, fontWeight: 700, fontFamily: 'DM Serif Display, serif', margin: 0 }}>
              {recommandation.prix}
            </p>
            <div style={{ ...s.confidenceBadge, background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}>
              {recommandation.confidence}% de compatibilité
            </div>
          </div>

          {/* Pourquoi ce plan */}
          <div style={{ ...s.pourquoiBox, background: colors.bg, borderColor: colors.border }}>
            <p style={{ color: '#9ca3af', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px 0' }}>Pourquoi ce plan ?</p>
            <p style={{ color: '#e5e7eb', fontSize: 14, margin: 0, lineHeight: 1.6, fontFamily: 'DM Sans, sans-serif' }}>
              {recommandation.pourquoi}
            </p>
          </div>

          {/* Features incluses */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: '#6b7280', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px 0' }}>Inclus dans ce plan</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {recommandation.features.map(f => (
                <div key={f} style={s.featureItem}>
                  <span style={{ color: colors.text }}>✓</span>
                  <span style={{ color: '#d1d5db', fontSize: 13 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA principal */}
          <a href={recommandation.url} style={{ ...s.btnCTA, background: colors.btn }}>
            {recommandation.cta} →
          </a>

          {/* Alternatives */}
          {alternatives?.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <p style={{ color: '#4b5563', fontSize: 12, textAlign: 'center', marginBottom: 12 }}>Ou comparer avec</p>
              <div style={{ display: 'flex', gap: 10 }}>
                {alternatives.map(alt => {
                  const altColors = PLAN_COLORS[alt.id];
                  return (
                    <a key={alt.id} href={alt.url} style={{ ...s.altBtn, border: `1px solid ${altColors.border}`, color: altColors.text }}>
                      {alt.nom}
                      <span style={{ color: '#4b5563', fontSize: 11, display: 'block' }}>{alt.prix}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          <button onClick={recommencer} style={s.btnRecommencer}>
            ↩ Refaire le questionnaire
          </button>
        </div>
      </div>
    );
  }

  // ─── QUESTION ────────────────────────────────────────────────────────────
  const reponseQuestion = reponses[questionCourante?.id];
  const aRepondu = questionCourante?.multiple
    ? Array.isArray(reponseQuestion) && reponseQuestion.length > 0
    : !!reponseQuestion;

  return (
    <div style={s.wrapper}>
      <div style={s.card}>
        {/* Progress */}
        <div style={s.progressBar}>
          <div style={{ ...s.progressFill, width: `${progress}%` }} />
        </div>
        <p style={s.progressText}>{etape}/{totalEtapes}</p>

        {/* Question */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h3 style={s.questionTitle}>{questionCourante.question}</h3>
          {questionCourante.multiple && (
            <p style={{ color: '#4b5563', fontSize: 13, margin: 0 }}>Sélectionnez tout ce qui s'applique</p>
          )}
        </div>

        {/* Options */}
        <div style={{ display: 'grid', gridTemplateColumns: questionCourante.options.length > 3 ? '1fr 1fr' : '1fr', gap: 10, marginBottom: 24 }}>
          {questionCourante.options.map(opt => {
            const isSelected = questionCourante.multiple
              ? Array.isArray(reponseQuestion) && reponseQuestion.includes(opt.value)
              : reponseQuestion === opt.value;

            return (
              <button
                key={opt.value}
                onClick={() => selectionner(questionCourante.id, opt.value, questionCourante.multiple)}
                style={{
                  ...s.optionBtn,
                  background: isSelected ? '#c9a96e15' : '#0f0f0f',
                  border: `1px solid ${isSelected ? '#c9a96e60' : '#1f1f1f'}`,
                  color: isSelected ? '#c9a96e' : '#d1d5db',
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 14 }}>{opt.label}</span>
                <span style={{ fontSize: 12, color: isSelected ? '#c9a96e80' : '#4b5563', display: 'block', marginTop: 2 }}>
                  {opt.desc}
                </span>
                {isSelected && <span style={{ position: 'absolute', top: 10, right: 12, color: '#c9a96e', fontSize: 16 }}>✓</span>}
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {etape > 1 && (
            <button onClick={() => setEtape(e => e - 1)} style={s.btnBack}>← Précédent</button>
          )}
          {questionCourante.multiple && (
            <button
              onClick={suivant}
              disabled={!aRepondu || loading}
              style={{ ...s.btnPrimary, flex: 1, opacity: (!aRepondu || loading) ? 0.4 : 1 }}
            >
              {loading ? 'Calcul...' : etape === totalEtapes ? 'Voir ma recommandation →' : 'Suivant →'}
            </button>
          )}
        </div>

        {erreur && (
          <p style={{ color: '#f87171', fontSize: 13, textAlign: 'center', marginTop: 12 }}>{erreur}</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    justifyContent: 'center',
    padding: '0 16px',
  },
  card: {
    background: '#0f0f0f',
    border: '1px solid #1f1f1f',
    borderRadius: 20,
    padding: '36px 32px',
    width: '100%',
    maxWidth: 480,
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  introTitle: {
    fontFamily: 'DM Serif Display, serif',
    fontSize: 26,
    color: '#f5f0e8',
    fontWeight: 400,
    textAlign: 'center',
    margin: '0 0 12px 0',
  },
  introDesc: {
    color: '#9ca3af',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 1.65,
    margin: '0 0 24px 0',
    fontFamily: 'DM Sans, sans-serif',
  },
  introFeatures: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 28,
  },
  introFeature: {
    color: '#6b7280',
    fontSize: 13,
    fontFamily: 'DM Sans, sans-serif',
    textAlign: 'center',
  },
  btnPrimary: {
    width: '100%',
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #8b6914, #c9a96e)',
    color: '#0f0f0f',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'DM Sans, sans-serif',
    letterSpacing: '0.02em',
  },
  progressBar: {
    height: 4,
    background: '#1f1f1f',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #8b6914, #c9a96e)',
    borderRadius: 2,
    transition: 'width 0.4s ease',
  },
  progressText: {
    color: '#4b5563',
    fontSize: 12,
    textAlign: 'right',
    margin: '0 0 24px 0',
    fontFamily: 'DM Sans, sans-serif',
  },
  questionTitle: {
    fontFamily: 'DM Serif Display, serif',
    fontSize: 20,
    color: '#f5f0e8',
    fontWeight: 400,
    margin: '0 0 6px 0',
  },
  optionBtn: {
    position: 'relative',
    textAlign: 'left',
    padding: '14px 16px',
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: 'DM Sans, sans-serif',
  },
  btnBack: {
    padding: '12px 18px',
    background: '#1a1a1a',
    border: '1px solid #262626',
    borderRadius: 10,
    color: '#6b7280',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'DM Sans, sans-serif',
  },
  confidenceBadge: {
    display: 'inline-block',
    padding: '4px 14px',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'DM Sans, sans-serif',
    marginTop: 12,
  },
  pourquoiBox: {
    padding: '16px 18px',
    borderRadius: 12,
    border: '1px solid',
    marginBottom: 20,
  },
  featureItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: '8px 10px',
    background: '#141414',
    borderRadius: 8,
    fontFamily: 'DM Sans, sans-serif',
  },
  btnCTA: {
    display: 'block',
    width: '100%',
    padding: '14px 24px',
    color: '#0f0f0f',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    textAlign: 'center',
    textDecoration: 'none',
    fontFamily: 'DM Sans, sans-serif',
    cursor: 'pointer',
  },
  altBtn: {
    flex: 1,
    display: 'block',
    padding: '10px 14px',
    borderRadius: 10,
    textAlign: 'center',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: 13,
    fontFamily: 'DM Sans, sans-serif',
    background: 'transparent',
  },
  btnRecommencer: {
    display: 'block',
    width: '100%',
    marginTop: 16,
    padding: '10px',
    background: 'none',
    border: 'none',
    color: '#374151',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'DM Sans, sans-serif',
    textDecoration: 'underline',
  },
};
