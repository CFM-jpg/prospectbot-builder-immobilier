// components/OnboardingAgent.js
// Onboarding interactif pour l'agent au premier lancement
// Usage: <OnboardingAgent onComplete={() => setShowOnboarding(false)} agentName="Jean" />

import { useState, useEffect } from 'react';

const STEPS = [
  {
    id: 'bienvenue',
    icon: '🏠',
    title: 'Bienvenue sur ProspectBot',
    description: 'Votre assistant immobilier automatisé. En quelques minutes, découvrez comment ProspectBot trouve, trie et notifie vos acheteurs automatiquement.',
    action: null,
  },
  {
    id: 'biens',
    icon: '🏗️',
    title: 'Les biens immobiliers',
    description: 'ProspectBot scrape automatiquement LeBonCoin, SeLoger et BienIci pour récupérer les nouvelles annonces. Vous pouvez aussi importer des biens manuellement.',
    highlight: 'Onglet "Biens" dans la sidebar',
    action: null,
  },
  {
    id: 'acheteurs',
    icon: '👤',
    title: 'Gérez vos acheteurs',
    description: 'Ajoutez vos clients avec leurs critères de recherche : budget, localisation, surface, type de bien. Plus les critères sont précis, meilleurs sont les matchs.',
    highlight: 'Onglet "Acheteurs" dans la sidebar',
    action: null,
  },
  {
    id: 'matching',
    icon: '⚡',
    title: 'Le matching automatique',
    description: 'Chaque bien est comparé à chaque acheteur. Un score de 0 à 100% est calculé selon le budget, la surface, la localisation et les critères spécifiques.',
    highlight: 'Onglet "Correspondances"',
    action: null,
  },
  {
    id: 'emails',
    icon: '✉️',
    title: 'Alertes email automatiques',
    description: 'Quand un bien correspond à plus de 60% aux critères d\'un acheteur, un email lui est envoyé automatiquement via Brevo. Vous pouvez aussi envoyer manuellement.',
    highlight: 'Onglet "Emails"',
    action: null,
  },
  {
    id: 'checklist',
    icon: '✅',
    title: 'Checklist de démarrage',
    description: 'Avant de commencer, vérifiez que tout est bien configuré.',
    action: 'checklist',
  },
];

const CHECKLIST_ITEMS = [
  { id: 'supabase', label: 'Supabase connecté (NEXT_PUBLIC_SUPABASE_URL)', key: 'supabase' },
  { id: 'brevo', label: 'Clé API Brevo configurée pour les emails', key: 'brevo' },
  { id: 'acheteur', label: 'Au moins 1 acheteur ajouté dans le système', key: 'acheteur' },
  { id: 'scraper', label: 'Premier scraping lancé pour récupérer des biens', key: 'scraper' },
  { id: 'match', label: 'Matching calculé au moins une fois', key: 'match' },
];

export default function OnboardingAgent({ onComplete, agentName = 'Agent', initialChecklist = {} }) {
  const [step, setStep] = useState(0);
  const [checklist, setChecklist] = useState({
    supabase: initialChecklist.supabase || false,
    brevo: initialChecklist.brevo || false,
    acheteur: initialChecklist.acheteur || false,
    scraper: initialChecklist.scraper || false,
    match: initialChecklist.match || false,
  });
  const [animating, setAnimating] = useState(false);

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const checklistDone = Object.values(checklist).filter(Boolean).length;

  const goNext = () => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setStep(s => Math.min(s + 1, STEPS.length - 1));
      setAnimating(false);
    }, 200);
  };

  const goPrev = () => {
    if (animating || step === 0) return;
    setAnimating(true);
    setTimeout(() => {
      setStep(s => Math.max(s - 1, 0));
      setAnimating(false);
    }, 200);
  };

  const toggleCheck = (key) => {
    setChecklist(c => ({ ...c, [key]: !c[key] }));
    // Persiste dans localStorage
    const updated = { ...checklist, [key]: !checklist[key] };
    try { localStorage.setItem('pb_checklist', JSON.stringify(updated)); } catch {}
  };

  // Charge la checklist depuis localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('pb_checklist') || '{}');
      if (Object.keys(saved).length) setChecklist(c => ({ ...c, ...saved }));
    } catch {}
  }, []);

  return (
    <div style={overlay}>
      <div style={modal}>
        {/* Progress bar */}
        <div style={progressBar}>
          <div style={{ ...progressFill, width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>

        {/* Step indicators */}
        <div style={stepDots}>
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              onClick={() => { if (i < step) setStep(i); }}
              style={{
                ...dot,
                background: i === step ? '#c9a96e' : i < step ? '#c9a96e60' : '#262626',
                cursor: i < step ? 'pointer' : 'default',
                transform: i === step ? 'scale(1.3)' : 'scale(1)',
              }}
            />
          ))}
        </div>

        {/* Contenu */}
        <div style={{ ...contentArea, opacity: animating ? 0 : 1, transition: 'opacity 0.2s' }}>
          <div style={iconWrap}>{currentStep.icon}</div>
          <h2 style={titleStyle}>
            {step === 0 ? `Bonjour, ${agentName} 👋` : currentStep.title}
          </h2>
          <p style={descStyle}>{currentStep.description}</p>

          {currentStep.highlight && (
            <div style={highlightBox}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {currentStep.highlight}
            </div>
          )}

          {/* Checklist */}
          {currentStep.action === 'checklist' && (
            <div style={checklistWrap}>
              <div style={checklistHeader}>
                <span style={{ color: '#9ca3af', fontSize: 13 }}>Progression</span>
                <span style={{ color: '#c9a96e', fontSize: 13, fontWeight: 600 }}>{checklistDone}/{CHECKLIST_ITEMS.length}</span>
              </div>
              <div style={checklistProgress}>
                <div style={{ ...checklistProgressFill, width: `${(checklistDone / CHECKLIST_ITEMS.length) * 100}%` }} />
              </div>
              {CHECKLIST_ITEMS.map(item => (
                <div
                  key={item.id}
                  onClick={() => toggleCheck(item.key)}
                  style={{
                    ...checkItem,
                    background: checklist[item.key] ? '#4ade8010' : '#1a1a1a',
                    borderColor: checklist[item.key] ? '#4ade8040' : '#262626',
                  }}
                >
                  <div style={{
                    ...checkbox,
                    background: checklist[item.key] ? '#4ade80' : 'transparent',
                    borderColor: checklist[item.key] ? '#4ade80' : '#4b5563',
                  }}>
                    {checklist[item.key] && (
                      <svg width="10" height="10" fill="none" stroke="#0f0f0f" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </div>
                  <span style={{ color: checklist[item.key] ? '#9ca3af' : '#d1d5db', fontSize: 14, textDecoration: checklist[item.key] ? 'line-through' : 'none' }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={actions}>
          <button onClick={goPrev} style={{ ...btnSecondary, opacity: step === 0 ? 0 : 1, pointerEvents: step === 0 ? 'none' : 'all' }}>
            ← Précédent
          </button>
          <button
            onClick={step === 0 ? () => {} : undefined}
            style={skipBtn}
            onClick={onComplete}
          >
            Passer l'intro
          </button>
          {isLast ? (
            <button onClick={onComplete} style={btnPrimary}>
              Commencer →
            </button>
          ) : (
            <button onClick={goNext} style={btnPrimary}>
              Suivant →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.85)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(4px)',
};

const modal = {
  background: '#141414',
  border: '1px solid #262626',
  borderRadius: 20,
  width: '100%',
  maxWidth: 520,
  margin: 20,
  overflow: 'hidden',
  boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
};

const progressBar = {
  height: 3,
  background: '#1f1f1f',
  width: '100%',
};

const progressFill = {
  height: '100%',
  background: 'linear-gradient(90deg, #8b6914, #c9a96e)',
  transition: 'width 0.4s ease',
};

const stepDots = {
  display: 'flex',
  justifyContent: 'center',
  gap: 8,
  padding: '24px 32px 0',
};

const dot = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  transition: 'all 0.3s',
};

const contentArea = {
  padding: '24px 36px 12px',
  textAlign: 'center',
};

const iconWrap = {
  fontSize: 48,
  marginBottom: 20,
  display: 'block',
};

const titleStyle = {
  fontFamily: 'DM Serif Display, serif',
  fontSize: 26,
  color: '#f5f0e8',
  fontWeight: 400,
  margin: '0 0 14px 0',
};

const descStyle = {
  fontSize: 15,
  color: '#9ca3af',
  lineHeight: 1.65,
  margin: '0 0 20px 0',
  fontFamily: 'DM Sans, sans-serif',
};

const highlightBox = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: '#c9a96e15',
  border: '1px solid #c9a96e30',
  borderRadius: 8,
  padding: '8px 14px',
  color: '#c9a96e',
  fontSize: 13,
  fontFamily: 'DM Sans, sans-serif',
  marginBottom: 8,
};

const checklistWrap = {
  textAlign: 'left',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  marginTop: 8,
};

const checklistHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: 4,
};

const checklistProgress = {
  height: 4,
  background: '#1f1f1f',
  borderRadius: 2,
  marginBottom: 12,
  overflow: 'hidden',
};

const checklistProgressFill = {
  height: '100%',
  background: '#4ade80',
  borderRadius: 2,
  transition: 'width 0.4s ease',
};

const checkItem = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid',
  cursor: 'pointer',
  transition: 'all 0.2s',
  fontFamily: 'DM Sans, sans-serif',
};

const checkbox = {
  width: 20,
  height: 20,
  borderRadius: 6,
  border: '2px solid',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'all 0.2s',
};

const actions = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '20px 36px 28px',
  gap: 12,
};

const btnPrimary = {
  background: 'linear-gradient(135deg, #8b6914, #c9a96e)',
  color: '#0f0f0f',
  border: 'none',
  borderRadius: 10,
  padding: '10px 22px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'DM Sans, sans-serif',
};

const btnSecondary = {
  background: '#1f1f1f',
  color: '#9ca3af',
  border: '1px solid #262626',
  borderRadius: 10,
  padding: '10px 18px',
  fontSize: 14,
  cursor: 'pointer',
  fontFamily: 'DM Sans, sans-serif',
  transition: 'opacity 0.3s',
};

const skipBtn = {
  background: 'none',
  border: 'none',
  color: '#4b5563',
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'DM Sans, sans-serif',
  textDecoration: 'underline',
};
