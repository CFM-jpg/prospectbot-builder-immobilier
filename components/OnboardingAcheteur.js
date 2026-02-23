// components/OnboardingAcheteur.js
// Onboarding guidé pour inscrire un nouvel acheteur étape par étape
// Usage: <OnboardingAcheteur onComplete={(data) => handleSave(data)} onClose={() => setShow(false)} />

import { useState } from 'react';

const STEPS = [
  { id: 'identite', title: 'Qui est votre client ?', subtitle: 'Informations de contact' },
  { id: 'budget', title: 'Quel est son budget ?', subtitle: 'Fourchette de prix' },
  { id: 'bien', title: 'Quel type de bien ?', subtitle: 'Nature et surface' },
  { id: 'localisation', title: 'Où cherche-t-il ?', subtitle: 'Zone géographique' },
  { id: 'options', title: 'Des critères spécifiques ?', subtitle: 'Options et équipements' },
  { id: 'recap', title: 'Récapitulatif', subtitle: 'Vérifiez avant d\'enregistrer' },
];

const TYPES_BIEN = ['Appartement', 'Maison', 'Villa', 'Studio', 'Loft', 'Terrain', 'Local commercial', 'Tous'];

export default function OnboardingAcheteur({ onComplete, onClose }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    nom: '',
    email: '',
    telephone: '',
    budget_min: '',
    budget_max: '',
    type_bien: 'Tous',
    surface_min: '',
    surface_max: '',
    pieces_min: '',
    chambres_min: '',
    ville: '',
    departement: '',
    code_postal: '',
    jardin: false,
    terrasse: false,
    parking: false,
    cave: false,
    piscine: false,
    notes: '',
  });

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: null }));
  };

  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (!form.nom.trim()) e.nom = 'Nom requis';
      if (!form.email.trim()) e.email = 'Email requis';
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email invalide';
    }
    if (step === 1) {
      if (!form.budget_max) e.budget_max = 'Budget maximum requis';
    }
    if (step === 3) {
      if (!form.ville.trim() && !form.departement.trim() && !form.code_postal.trim()) {
        e.ville = 'Au moins un critère de localisation requis';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (!validateStep()) return;
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const goPrev = () => setStep(s => Math.max(s - 1, 0));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        budget_min: form.budget_min ? parseInt(form.budget_min) : null,
        budget_max: form.budget_max ? parseInt(form.budget_max) : null,
        surface_min: form.surface_min ? parseInt(form.surface_min) : null,
        surface_max: form.surface_max ? parseInt(form.surface_max) : null,
        pieces_min: form.pieces_min ? parseInt(form.pieces_min) : null,
        chambres_min: form.chambres_min ? parseInt(form.chambres_min) : null,
        actif: true,
      };
      const res = await fetch('/api/immobilier/inscription-acheteur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        onComplete && onComplete(data.acheteur);
      } else {
        alert('Erreur lors de l\'enregistrement : ' + (data.error || 'Erreur inconnue'));
      }
    } catch (err) {
      alert('Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  const formatBudget = (n) => {
    if (!n) return '—';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  };

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div style={overlay}>
      <div style={modal}>
        {/* Header */}
        <div style={header}>
          <div>
            <p style={stepLabel}>Étape {step + 1} sur {STEPS.length} — {currentStep.subtitle}</p>
            <h2 style={modalTitle}>{currentStep.title}</h2>
          </div>
          <button onClick={onClose} style={closeBtn}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Progress */}
        <div style={progressWrap}>
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              style={{
                ...progressSegment,
                background: i <= step ? '#c9a96e' : '#262626',
                opacity: i === step ? 1 : i < step ? 0.6 : 0.3,
              }}
            />
          ))}
        </div>

        {/* Form */}
        <div style={body}>

          {/* IDENTITÉ */}
          {step === 0 && (
            <div style={fieldGroup}>
              <Field label="Nom complet *" error={errors.nom}>
                <input
                  style={{ ...input, ...(errors.nom ? inputError : {}) }}
                  placeholder="Jean Dupont"
                  value={form.nom}
                  onChange={e => set('nom', e.target.value)}
                />
              </Field>
              <Field label="Email *" error={errors.email}>
                <input
                  style={{ ...input, ...(errors.email ? inputError : {}) }}
                  type="email"
                  placeholder="jean@email.fr"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                />
              </Field>
              <Field label="Téléphone">
                <input
                  style={input}
                  placeholder="06 00 00 00 00"
                  value={form.telephone}
                  onChange={e => set('telephone', e.target.value)}
                />
              </Field>
            </div>
          )}

          {/* BUDGET */}
          {step === 1 && (
            <div style={fieldGroup}>
              <div style={row2}>
                <Field label="Budget minimum">
                  <div style={inputWithUnit}>
                    <input
                      style={{ ...input, paddingRight: 40 }}
                      type="number"
                      placeholder="100000"
                      value={form.budget_min}
                      onChange={e => set('budget_min', e.target.value)}
                    />
                    <span style={unit}>€</span>
                  </div>
                </Field>
                <Field label="Budget maximum *" error={errors.budget_max}>
                  <div style={inputWithUnit}>
                    <input
                      style={{ ...input, paddingRight: 40, ...(errors.budget_max ? inputError : {}) }}
                      type="number"
                      placeholder="300000"
                      value={form.budget_max}
                      onChange={e => set('budget_max', e.target.value)}
                    />
                    <span style={unit}>€</span>
                  </div>
                </Field>
              </div>
              {form.budget_max && (
                <div style={budgetPreview}>
                  <span style={{ color: '#6b7280', fontSize: 13 }}>Budget max :</span>
                  <span style={{ color: '#c9a96e', fontSize: 22, fontFamily: 'DM Serif Display, serif' }}>
                    {formatBudget(form.budget_max)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TYPE DE BIEN */}
          {step === 2 && (
            <div style={fieldGroup}>
              <Field label="Type de bien">
                <div style={typesGrid}>
                  {TYPES_BIEN.map(t => (
                    <button
                      key={t}
                      onClick={() => set('type_bien', t)}
                      style={{
                        ...typeBtn,
                        background: form.type_bien === t ? '#c9a96e15' : '#1a1a1a',
                        borderColor: form.type_bien === t ? '#c9a96e' : '#262626',
                        color: form.type_bien === t ? '#c9a96e' : '#9ca3af',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </Field>
              <div style={row2}>
                <Field label="Surface min (m²)">
                  <div style={inputWithUnit}>
                    <input style={{ ...input, paddingRight: 40 }} type="number" placeholder="50" value={form.surface_min} onChange={e => set('surface_min', e.target.value)} />
                    <span style={unit}>m²</span>
                  </div>
                </Field>
                <Field label="Surface max (m²)">
                  <div style={inputWithUnit}>
                    <input style={{ ...input, paddingRight: 40 }} type="number" placeholder="150" value={form.surface_max} onChange={e => set('surface_max', e.target.value)} />
                    <span style={unit}>m²</span>
                  </div>
                </Field>
              </div>
              <div style={row2}>
                <Field label="Pièces minimum">
                  <input style={input} type="number" placeholder="3" value={form.pieces_min} onChange={e => set('pieces_min', e.target.value)} />
                </Field>
                <Field label="Chambres minimum">
                  <input style={input} type="number" placeholder="2" value={form.chambres_min} onChange={e => set('chambres_min', e.target.value)} />
                </Field>
              </div>
            </div>
          )}

          {/* LOCALISATION */}
          {step === 3 && (
            <div style={fieldGroup}>
              <Field label="Ville ou zone" error={errors.ville}>
                <input
                  style={{ ...input, ...(errors.ville ? inputError : {}) }}
                  placeholder="Paris, Lyon, Bordeaux..."
                  value={form.ville}
                  onChange={e => set('ville', e.target.value)}
                />
              </Field>
              <div style={row2}>
                <Field label="Département">
                  <input style={input} placeholder="75, 69, 33..." value={form.departement} onChange={e => set('departement', e.target.value)} />
                </Field>
                <Field label="Code postal">
                  <input style={input} placeholder="75001" value={form.code_postal} onChange={e => set('code_postal', e.target.value)} />
                </Field>
              </div>
              <p style={hint}>Remplissez au moins un champ de localisation. Plus c'est précis, meilleurs seront les matchs.</p>
            </div>
          )}

          {/* OPTIONS */}
          {step === 4 && (
            <div style={fieldGroup}>
              <Field label="Équipements souhaités">
                <div style={optionsGrid}>
                  {[
                    { key: 'jardin', label: '🌿 Jardin' },
                    { key: 'terrasse', label: '☀️ Terrasse' },
                    { key: 'parking', label: '🚗 Parking' },
                    { key: 'cave', label: '📦 Cave' },
                    { key: 'piscine', label: '🏊 Piscine' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => set(opt.key, !form[opt.key])}
                      style={{
                        ...optionBtn,
                        background: form[opt.key] ? '#4ade8015' : '#1a1a1a',
                        borderColor: form[opt.key] ? '#4ade80' : '#262626',
                        color: form[opt.key] ? '#4ade80' : '#9ca3af',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Notes internes">
                <textarea
                  style={{ ...input, height: 100, resize: 'vertical', paddingTop: 12 }}
                  placeholder="Préférences particulières, situation personnelle..."
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                />
              </Field>
            </div>
          )}

          {/* RÉCAP */}
          {step === 5 && (
            <div style={recapGrid}>
              <RecapItem label="Nom" value={form.nom} />
              <RecapItem label="Email" value={form.email} />
              <RecapItem label="Téléphone" value={form.telephone || '—'} />
              <RecapItem label="Budget" value={`${form.budget_min ? formatBudget(form.budget_min) + ' — ' : ''}${formatBudget(form.budget_max)}`} highlight />
              <RecapItem label="Type de bien" value={form.type_bien} />
              <RecapItem label="Surface" value={form.surface_min || form.surface_max ? `${form.surface_min || '?'} — ${form.surface_max || '?'} m²` : '—'} />
              <RecapItem label="Pièces min" value={form.pieces_min || '—'} />
              <RecapItem label="Localisation" value={[form.ville, form.departement, form.code_postal].filter(Boolean).join(', ') || '—'} />
              <RecapItem label="Équipements" value={['jardin', 'terrasse', 'parking', 'cave', 'piscine'].filter(k => form[k]).join(', ') || 'Aucun'} />
              {form.notes && <RecapItem label="Notes" value={form.notes} fullWidth />}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={footer}>
          <button onClick={goPrev} style={{ ...btnSecondary, opacity: step === 0 ? 0 : 1, pointerEvents: step === 0 ? 'none' : 'all' }}>
            ← Retour
          </button>
          {isLast ? (
            <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Enregistrement...' : 'Enregistrer l\'acheteur ✓'}
            </button>
          ) : (
            <button onClick={goNext} style={btnPrimary}>
              Continuer →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      {children}
      {error && <p style={errorMsg}>{error}</p>}
    </div>
  );
}

function RecapItem({ label, value, highlight, fullWidth }) {
  return (
    <div style={{ ...recapItem, gridColumn: fullWidth ? '1 / -1' : 'auto' }}>
      <span style={recapLabel}>{label}</span>
      <span style={{ ...recapValue, color: highlight ? '#c9a96e' : '#e5e7eb' }}>{value}</span>
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
  maxWidth: 560,
  margin: 20,
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
};

const header = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  padding: '28px 32px 20px',
};

const stepLabel = {
  fontSize: 12,
  color: '#6b7280',
  fontFamily: 'DM Sans, sans-serif',
  margin: '0 0 6px 0',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const modalTitle = {
  fontFamily: 'DM Serif Display, serif',
  fontSize: 24,
  color: '#f5f0e8',
  fontWeight: 400,
  margin: 0,
};

const closeBtn = {
  background: '#1f1f1f',
  border: '1px solid #262626',
  borderRadius: 8,
  padding: '8px',
  cursor: 'pointer',
  color: '#9ca3af',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const progressWrap = {
  display: 'flex',
  gap: 4,
  padding: '0 32px 20px',
};

const progressSegment = {
  flex: 1,
  height: 3,
  borderRadius: 2,
  transition: 'all 0.3s',
};

const body = {
  padding: '8px 32px',
  overflowY: 'auto',
  flex: 1,
};

const footer = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '20px 32px 28px',
  borderTop: '1px solid #1f1f1f',
};

const fieldGroup = {};

const labelStyle = {
  display: 'block',
  fontSize: 13,
  color: '#9ca3af',
  marginBottom: 8,
  fontFamily: 'DM Sans, sans-serif',
};

const input = {
  width: '100%',
  background: '#1a1a1a',
  border: '1px solid #262626',
  borderRadius: 10,
  padding: '11px 14px',
  color: '#e5e7eb',
  fontSize: 14,
  fontFamily: 'DM Sans, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const inputError = {
  borderColor: '#ef4444',
};

const errorMsg = {
  color: '#ef4444',
  fontSize: 12,
  margin: '6px 0 0 2px',
  fontFamily: 'DM Sans, sans-serif',
};

const inputWithUnit = {
  position: 'relative',
};

const unit = {
  position: 'absolute',
  right: 14,
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#6b7280',
  fontSize: 13,
  pointerEvents: 'none',
};

const row2 = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
};

const budgetPreview = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: '#1a1a1a',
  border: '1px solid #262626',
  borderRadius: 12,
  padding: '14px 18px',
  marginTop: 8,
};

const typesGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 8,
  marginBottom: 16,
};

const typeBtn = {
  padding: '10px 8px',
  borderRadius: 10,
  border: '1px solid',
  cursor: 'pointer',
  fontSize: 13,
  fontFamily: 'DM Sans, sans-serif',
  transition: 'all 0.2s',
};

const optionsGrid = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginBottom: 16,
};

const optionBtn = {
  padding: '10px 16px',
  borderRadius: 10,
  border: '1px solid',
  cursor: 'pointer',
  fontSize: 13,
  fontFamily: 'DM Sans, sans-serif',
  transition: 'all 0.2s',
};

const hint = {
  fontSize: 12,
  color: '#4b5563',
  fontFamily: 'DM Sans, sans-serif',
  margin: '4px 0 0 2px',
  fontStyle: 'italic',
};

const recapGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 10,
};

const recapItem = {
  background: '#1a1a1a',
  border: '1px solid #1f1f1f',
  borderRadius: 10,
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const recapLabel = {
  fontSize: 11,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontFamily: 'DM Sans, sans-serif',
};

const recapValue = {
  fontSize: 14,
  fontWeight: 500,
  fontFamily: 'DM Sans, sans-serif',
};

const btnPrimary = {
  background: 'linear-gradient(135deg, #8b6914, #c9a96e)',
  color: '#0f0f0f',
  border: 'none',
  borderRadius: 10,
  padding: '11px 24px',
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
  padding: '11px 18px',
  fontSize: 14,
  cursor: 'pointer',
  fontFamily: 'DM Sans, sans-serif',
};
