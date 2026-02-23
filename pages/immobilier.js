import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../lib/useAuth';
import { canAccess } from '../lib/planConfig';

// ─── Configuration ────────────────────────────────────────────────────────────

const SITES = [
  { id: 'bienici', label: "Bien'ici", sublabel: 'Annonces premium', apiRoute: '/api/scrapers/bienici', active: true },
  { id: 'seloger', label: 'SeLoger', sublabel: 'Agences immobilières', apiRoute: '/api/scrapers/seloger', active: true },
  { id: 'leboncoin', label: 'Le Bon Coin', sublabel: 'Particuliers & agences', apiRoute: '/api/scrapers/leboncoin', active: true },
];

const PROPERTY_TYPES = [
  { value: 'all', label: 'Tous' },
  { value: 'maison', label: 'Maison' },
  { value: 'appartement', label: 'Appartement' },
  { value: 'terrain', label: 'Terrain' },
  { value: 'commercial', label: 'Local commercial' },
];

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Vue d\'ensemble' },
  { id: 'scraper', label: 'Recherche' },
  { id: 'biens', label: 'Annonces' },
  { id: 'acheteurs', label: 'Acheteurs' },
  { id: 'matches', label: 'Correspondances' },
  { id: 'email', label: 'Emails' },
  { id: 'publication', label: 'Publier une annonce' },
];

const TYPES_BIEN = ['Appartement', 'Maison', 'Villa', 'Studio', 'Loft', 'Terrain', 'Local commercial', 'Tous'];

const ONBOARDING_STEPS = [
  { id: 'bienvenue', icon: '🏠', title: null, desc: 'Votre assistant immobilier automatisé. En quelques minutes, découvrez comment ProspectBot trouve, trie et notifie vos acheteurs automatiquement.', highlight: null },
  { id: 'biens', icon: '🏗️', title: 'Les annonces', desc: 'ProspectBot scrape automatiquement LeBonCoin, SeLoger et BienIci pour récupérer les nouvelles annonces. Vous pouvez aussi importer des biens manuellement.', highlight: 'Onglet "Annonces" dans la sidebar' },
  { id: 'acheteurs', icon: '👤', title: 'Gérez vos acheteurs', desc: 'Ajoutez vos clients avec leurs critères de recherche : budget, localisation, surface, type de bien. Plus les critères sont précis, meilleurs sont les matchs.', highlight: 'Onglet "Acheteurs" dans la sidebar' },
  { id: 'matching', icon: '⚡', title: 'Le matching automatique', desc: 'Chaque bien est comparé à chaque acheteur. Un score de 0 à 100% est calculé selon le budget, la surface, la localisation et les critères spécifiques.', highlight: 'Onglet "Correspondances"' },
  { id: 'emails', icon: '✉️', title: 'Alertes email automatiques', desc: 'Quand un bien correspond à plus de 60% aux critères d\'un acheteur, un email lui est envoyé automatiquement via Brevo. Vous pouvez aussi envoyer manuellement.', highlight: 'Onglet "Emails"' },
  { id: 'publication', icon: '📢', title: 'Publiez vos annonces', desc: 'Créez une annonce en quelques minutes et diffusez-la sur LeBonCoin, SeLoger, BienIci et PAP.fr. Le texte est généré automatiquement par IA.', highlight: 'Onglet "Publier une annonce"' },
  { id: 'checklist', icon: '✅', title: 'Checklist de démarrage', desc: 'Avant de commencer, vérifiez que tout est bien configuré.', highlight: null },
];

const CHECKLIST_ITEMS = [
  { id: 'supabase', label: 'Supabase connecté (NEXT_PUBLIC_SUPABASE_URL)' },
  { id: 'brevo', label: 'Clé API Brevo configurée pour les emails' },
  { id: 'acheteur', label: 'Au moins 1 acheteur ajouté dans le système' },
  { id: 'scraper', label: 'Premier scraping lancé pour récupérer des biens' },
  { id: 'match', label: 'Matching calculé au moins une fois' },
];

// ─── Publication — constantes ─────────────────────────────────────────────────

const PLATEFORMES_PUBLICATION = [
  { id: 'leboncoin', nom: 'LeBonCoin', logo: '🟠', description: 'API Pro (clé requise) · Lien direct sinon' },
  { id: 'seloger',   nom: 'SeLoger',   logo: '🔵', description: 'Flux partenaire (clé requise) · Lien direct sinon' },
  { id: 'bienici',   nom: 'BienIci',   logo: '🟢', description: 'Groupe SeLoger · même clé API' },
  { id: 'pap',       nom: 'PAP.fr',    logo: '🔴', description: 'Lien pré-rempli (pas d\'API)' },
  { id: 'logic_immo',nom: 'Logic-Immo',logo: '🟡', description: 'API partenaire (clé requise)' },
];

const TYPE_BIENS_PUB = ['Appartement', 'Maison', 'Studio', 'Loft', 'Villa', 'Terrain', 'Commerce', 'Bureau'];
const DPE_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const EQUIPEMENTS_LIST = [
  'Parking', 'Garage', 'Cave', 'Balcon', 'Terrasse', 'Jardin',
  'Piscine', 'Ascenseur', 'Digicode', 'Gardien', 'Interphone',
  'Double vitrage', 'Parquet', 'Cuisine équipée', 'Fibre optique',
];

const STATUS_CONFIG = {
  publie:        { label: 'Publié',          color: '#3ecf8e', bg: 'rgba(62,207,142,0.08)',  border: 'rgba(62,207,142,0.3)'  },
  lien_direct:   { label: 'Lien direct',     color: '#d4a853', bg: 'rgba(212,168,83,0.08)',  border: 'rgba(212,168,83,0.3)'  },
  non_configure: { label: 'Non configuré',   color: '#6b6b78', bg: 'rgba(107,107,120,0.08)', border: 'rgba(107,107,120,0.3)' },
  erreur:        { label: 'Erreur',          color: '#f04444', bg: 'rgba(240,68,68,0.08)',   border: 'rgba(240,68,68,0.3)'   },
};

// ─── Onboarding Agent ─────────────────────────────────────────────────────────

function OnboardingAgent({ agentName, onComplete }) {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [checklist, setChecklist] = useState({ supabase: false, brevo: false, acheteur: false, scraper: false, match: false });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('pb_checklist') || '{}');
      if (Object.keys(saved).length) setChecklist(c => ({ ...c, ...saved }));
    } catch {}
  }, []);

  const goNext = () => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => { setStep(s => Math.min(s + 1, ONBOARDING_STEPS.length - 1)); setAnimating(false); }, 180);
  };

  const goPrev = () => {
    if (animating || step === 0) return;
    setAnimating(true);
    setTimeout(() => { setStep(s => Math.max(s - 1, 0)); setAnimating(false); }, 180);
  };

  const toggleCheck = (key) => {
    const updated = { ...checklist, [key]: !checklist[key] };
    setChecklist(updated);
    try { localStorage.setItem('pb_checklist', JSON.stringify(updated)); } catch {}
  };

  const cur = ONBOARDING_STEPS[step];
  const isLast = step === ONBOARDING_STEPS.length - 1;
  const checkDone = Object.values(checklist).filter(Boolean).length;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#17171a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, width: '100%', maxWidth: 500, margin: 20, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ height: 3, background: '#1f1f24' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, #8b6914, #d4a853)', width: `${((step + 1) / ONBOARDING_STEPS.length) * 100}%`, transition: 'width 0.4s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '20px 32px 0' }}>
          {ONBOARDING_STEPS.map((s, i) => (
            <div key={s.id} onClick={() => i < step && setStep(i)} style={{ width: 7, height: 7, borderRadius: '50%', background: i === step ? '#d4a853' : i < step ? 'rgba(212,168,83,0.5)' : '#2a2a30', transform: i === step ? 'scale(1.4)' : 'scale(1)', transition: 'all 0.3s', cursor: i < step ? 'pointer' : 'default' }} />
          ))}
        </div>
        <div style={{ padding: '24px 36px 12px', textAlign: 'center', opacity: animating ? 0 : 1, transition: 'opacity 0.18s' }}>
          <div style={{ fontSize: 46, marginBottom: 18 }}>{cur.icon}</div>
          <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 24, color: '#e8e8e8', fontWeight: 400, margin: '0 0 12px 0' }}>
            {step === 0 ? `Bonjour, ${agentName} 👋` : cur.title}
          </h2>
          <p style={{ fontSize: 14, color: '#6b6b78', lineHeight: 1.65, margin: '0 0 18px 0' }}>{cur.desc}</p>
          {cur.highlight && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(212,168,83,0.1)', border: '1px solid rgba(212,168,83,0.25)', borderRadius: 8, padding: '7px 14px', color: '#d4a853', fontSize: 13, marginBottom: 8 }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {cur.highlight}
            </div>
          )}
          {cur.id === 'checklist' && (
            <div style={{ textAlign: 'left', marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#6b6b78', fontSize: 12 }}>Progression</span>
                <span style={{ color: '#d4a853', fontSize: 12, fontWeight: 600 }}>{checkDone}/{CHECKLIST_ITEMS.length}</span>
              </div>
              <div style={{ height: 4, background: '#1f1f24', borderRadius: 2, marginBottom: 12, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#3ecf8e', borderRadius: 2, width: `${(checkDone / CHECKLIST_ITEMS.length) * 100}%`, transition: 'width 0.4s' }} />
              </div>
              {CHECKLIST_ITEMS.map(item => (
                <div key={item.id} onClick={() => toggleCheck(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 10, border: `1px solid ${checklist[item.id] ? 'rgba(62,207,142,0.35)' : 'rgba(255,255,255,0.07)'}`, background: checklist[item.id] ? 'rgba(62,207,142,0.07)' : '#1f1f24', cursor: 'pointer', marginBottom: 7, transition: 'all 0.2s' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${checklist[item.id] ? '#3ecf8e' : '#4b5563'}`, background: checklist[item.id] ? '#3ecf8e' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                    {checklist[item.id] && <svg width="9" height="9" fill="none" stroke="#0f0f11" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <span style={{ fontSize: 13, color: checklist[item.id] ? '#6b6b78' : '#d1d5db', textDecoration: checklist[item.id] ? 'line-through' : 'none' }}>{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 36px 26px', gap: 12 }}>
          <button onClick={goPrev} style={{ background: '#1f1f24', color: '#a0a0ae', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '9px 18px', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: step === 0 ? 0 : 1, pointerEvents: step === 0 ? 'none' : 'all' }}>← Précédent</button>
          <button onClick={onComplete} style={{ background: 'none', border: 'none', color: '#4b5563', fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', textDecoration: 'underline' }}>Passer</button>
          {isLast
            ? <button onClick={onComplete} style={{ background: 'linear-gradient(135deg, #8b6914, #d4a853)', color: '#0f0f11', border: 'none', borderRadius: 10, padding: '9px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Commencer →</button>
            : <button onClick={goNext} style={{ background: 'linear-gradient(135deg, #8b6914, #d4a853)', color: '#0f0f11', border: 'none', borderRadius: 10, padding: '9px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Suivant →</button>
          }
        </div>
      </div>
    </div>
  );
}

// ─── Onboarding Acheteur ──────────────────────────────────────────────────────

const ACHETEUR_STEPS = [
  { id: 'identite', title: 'Qui est votre client ?', sub: 'Informations de contact' },
  { id: 'budget', title: 'Quel est son budget ?', sub: 'Fourchette de prix' },
  { id: 'bien', title: 'Quel type de bien ?', sub: 'Nature et surface' },
  { id: 'localisation', title: 'Où cherche-t-il ?', sub: 'Zone géographique' },
  { id: 'options', title: 'Des critères spécifiques ?', sub: 'Options et équipements' },
  { id: 'recap', title: 'Récapitulatif', sub: 'Vérifiez avant d\'enregistrer' },
];

function OnboardingAcheteur({ onComplete, onClose }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', telephone: '',
    budget_min: '', budget_max: '',
    type_bien: 'Tous', surface_min: '', surface_max: '', pieces_min: '', chambres_min: '',
    ville: '', departement: '', code_postal: '',
    jardin: false, terrasse: false, parking: false, cave: false, piscine: false,
    notes: '',
  });

  const set = (key, val) => { setForm(f => ({ ...f, [key]: val })); setErrors(e => ({ ...e, [key]: null })); };

  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (!form.nom.trim()) e.nom = 'Nom requis';
      if (!form.email.trim()) e.email = 'Email requis';
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email invalide';
    }
    if (step === 1 && !form.budget_max) e.budget_max = 'Budget maximum requis';
    if (step === 3 && !form.ville.trim() && !form.departement.trim() && !form.code_postal.trim()) e.ville = 'Au moins un critère de localisation requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => { if (validateStep()) setStep(s => Math.min(s + 1, ACHETEUR_STEPS.length - 1)); };
  const goPrev = () => setStep(s => Math.max(s - 1, 0));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        nom: `${form.nom} ${form.prenom}`.trim(),
        email: form.email,
        telephone: form.telephone,
        budget_min: form.budget_min ? parseInt(form.budget_min) : null,
        budget_max: form.budget_max ? parseInt(form.budget_max) : null,
        type_bien: form.type_bien === 'Tous' ? null : form.type_bien,
        surface_min: form.surface_min ? parseInt(form.surface_min) : null,
        surface_max: form.surface_max ? parseInt(form.surface_max) : null,
        pieces_min: form.pieces_min ? parseInt(form.pieces_min) : null,
        chambres_min: form.chambres_min ? parseInt(form.chambres_min) : null,
        villes: form.ville ? [form.ville] : [],
        departement: form.departement,
        code_postal: form.code_postal,
        jardin: form.jardin, terrasse: form.terrasse, parking: form.parking, cave: form.cave, piscine: form.piscine,
        notes: form.notes,
        actif: true,
      };
      const res = await fetch('/api/immobilier/acheteurs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        onComplete && onComplete(data.data);
        if (data.data?.id) router.push(`/acheteurs/${data.data.id}`);
      } else {
        alert('Erreur : ' + (data.error || 'Erreur inconnue'));
      }
    } catch (err) {
      alert('Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n) => n ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n) : '—';
  const cur = ACHETEUR_STEPS[step];
  const isLast = step === ACHETEUR_STEPS.length - 1;

  const inputStyle = (err) => ({ width: '100%', background: '#1f1f24', border: `1px solid ${err ? '#f04444' : 'rgba(255,255,255,0.07)'}`, borderRadius: 8, padding: '10px 13px', fontSize: 13.5, color: '#e8e8e8', fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box' });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#17171a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, width: '100%', maxWidth: 540, margin: 20, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '26px 30px 16px' }}>
          <div>
            <p style={{ fontSize: 11, color: '#6b6b78', fontFamily: 'DM Sans, sans-serif', margin: '0 0 5px 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Étape {step + 1} / {ACHETEUR_STEPS.length} — {cur.sub}</p>
            <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, color: '#e8e8e8', fontWeight: 400, margin: 0 }}>{cur.title}</h2>
          </div>
          <button onClick={onClose} style={{ background: '#1f1f24', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#a0a0ae', display: 'flex' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ display: 'flex', gap: 4, padding: '0 30px 18px' }}>
          {ACHETEUR_STEPS.map((s, i) => (
            <div key={s.id} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? '#d4a853' : '#2a2a30', opacity: i === step ? 1 : i < step ? 0.6 : 0.3, transition: 'all 0.3s' }} />
          ))}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 30px' }}>
          {step === 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6b6b78', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>Nom *</label>
                <input style={inputStyle(errors.nom)} placeholder="Dupont" value={form.nom} onChange={e => set('nom', e.target.value)} />
                {errors.nom && <p style={{ color: '#f04444', fontSize: 11, marginTop: 4 }}>{errors.nom}</p>}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6b6b78', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>Prénom</label>
                <input style={inputStyle()} placeholder="Jean" value={form.prenom} onChange={e => set('prenom', e.target.value)} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ display: 'block', fontSize: 12, color: '#6b6b78', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>Email *</label>
                <input style={inputStyle(errors.email)} type="email" placeholder="jean.dupont@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
                {errors.email && <p style={{ color: '#f04444', fontSize: 11, marginTop: 4 }}>{errors.email}</p>}
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ display: 'block', fontSize: 12, color: '#6b6b78', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>Téléphone</label>
                <input style={inputStyle()} type="tel" placeholder="06 12 34 56 78" value={form.telephone} onChange={e => set('telephone', e.target.value)} />
              </div>
            </div>
          )}
          {step === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6b6b78', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>Budget min (€)</label>
                <input style={inputStyle()} type="number" placeholder="100 000" value={form.budget_min} onChange={e => set('budget_min', e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6b6b78', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>Budget max (€) *</label>
                <input style={inputStyle(errors.budget_max)} type="number" placeholder="350 000" value={form.budget_max} onChange={e => set('budget_max', e.target.value)} />
                {errors.budget_max && <p style={{ color: '#f04444', fontSize: 11, marginTop: 4 }}>{errors.budget_max}</p>}
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#6b6b78', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Type de bien</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {TYPES_BIEN.map(t => (
                    <button key={t} onClick={() => set('type_bien', t)} style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${form.type_bien === t ? '#d4a853' : 'rgba(255,255,255,0.07)'}`, background: form.type_bien === t ? 'rgba(212,168,83,0.12)' : '#1f1f24', color: form.type_bien === t ? '#d4a853' : '#a0a0ae', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' }}>{t}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#6b6b78', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>Surface min (m²)</label>
                  <input style={inputStyle()} type="number" placeholder="40" value={form.surface_min} onChange={e => set('surface_min', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#6b6b78', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>Surface max (m²)</label>
                  <input style={inputStyle()} type="number" placeholder="120" value={form.surface_max} onChange={e => set('surface_max', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#6b6b78', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>Pièces min</label>
                  <input style={inputStyle()} type="number" placeholder="2" value={form.pieces_min} onChange={e => set('pieces_min', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#6b6b78', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>Chambres min</label>
                  <input style={inputStyle()} type="number" placeholder="1" value={form.chambres_min} onChange={e => set('chambres_min', e.target.value)} />
                </div>
              </div>
            </div>
          )}
          {step === 3 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ display: 'block', fontSize: 12, color: '#6b6b78', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>Ville</label>
                <input style={inputStyle(errors.ville)} placeholder="Paris, Lyon, Bordeaux..." value={form.ville} onChange={e => set('ville', e.target.value)} />
                {errors.ville && <p style={{ color: '#f04444', fontSize: 11, marginTop: 4 }}>{errors.ville}</p>}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6b6b78', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>Département</label>
                <input style={inputStyle()} placeholder="75, 69, 33..." value={form.departement} onChange={e => set('departement', e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6b6b78', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>Code postal</label>
                <input style={inputStyle()} placeholder="75001" value={form.code_postal} onChange={e => set('code_postal', e.target.value)} />
              </div>
              <p style={{ gridColumn: '1/-1', fontSize: 12, color: '#4b5563', fontStyle: 'italic' }}>Remplissez au moins un champ. Plus c'est précis, meilleurs seront les matchs.</p>
            </div>
          )}
          {step === 4 && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#6b6b78', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Équipements souhaités</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[{ k: 'jardin', l: ' Jardin' }, { k: 'terrasse', l: ' Terrasse' }, { k: 'parking', l: ' Parking' }, { k: 'cave', l: ' Cave' }, { k: 'piscine', l: ' Piscine' }].map(opt => (
                    <button key={opt.k} onClick={() => set(opt.k, !form[opt.k])} style={{ padding: '9px 16px', borderRadius: 9, border: `1px solid ${form[opt.k] ? '#3ecf8e' : 'rgba(255,255,255,0.07)'}`, background: form[opt.k] ? 'rgba(62,207,142,0.1)' : '#1f1f24', color: form[opt.k] ? '#3ecf8e' : '#a0a0ae', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' }}>{opt.l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6b6b78', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>Notes internes</label>
                <textarea style={{ ...inputStyle(), height: 90, resize: 'vertical', paddingTop: 10, lineHeight: 1.6 }} placeholder="Préférences particulières, situation personnelle..." value={form.notes} onChange={e => set('notes', e.target.value)} />
              </div>
            </div>
          )}
          {step === 5 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { l: 'Nom', v: `${form.nom} ${form.prenom}`.trim() || '—' },
                { l: 'Email', v: form.email || '—' },
                { l: 'Téléphone', v: form.telephone || '—' },
                { l: 'Budget', v: `${form.budget_min ? fmt(form.budget_min) + ' — ' : ''}${fmt(form.budget_max)}`, gold: true },
                { l: 'Type de bien', v: form.type_bien },
                { l: 'Surface', v: form.surface_min || form.surface_max ? `${form.surface_min || '?'} — ${form.surface_max || '?'} m²` : '—' },
                { l: 'Pièces min', v: form.pieces_min || '—' },
                { l: 'Localisation', v: [form.ville, form.departement, form.code_postal].filter(Boolean).join(', ') || '—' },
                { l: 'Équipements', v: ['jardin', 'terrasse', 'parking', 'cave', 'piscine'].filter(k => form[k]).join(', ') || 'Aucun' },
              ].map((item, i) => (
                <div key={i} style={{ background: '#1f1f24', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '11px 14px' }}>
                  <div style={{ fontSize: 11, color: '#6b6b78', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{item.l}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: item.gold ? '#d4a853' : '#e8e8e8' }}>{item.v}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '18px 30px 26px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 16 }}>
          <button onClick={goPrev} style={{ background: '#1f1f24', color: '#a0a0ae', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, padding: '10px 18px', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: step === 0 ? 0 : 1, pointerEvents: step === 0 ? 'none' : 'all' }}>← Retour</button>
          {isLast
            ? <button onClick={handleSave} disabled={saving} style={{ background: 'linear-gradient(135deg, #8b6914, #d4a853)', color: '#0f0f11', border: 'none', borderRadius: 9, padding: '10px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: saving ? 0.7 : 1 }}>{saving ? 'Enregistrement...' : 'Enregistrer ✓'}</button>
            : <button onClick={goNext} style={{ background: 'linear-gradient(135deg, #8b6914, #d4a853)', color: '#0f0f11', border: 'none', borderRadius: 9, padding: '10px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Continuer →</button>
          }
        </div>
      </div>
    </div>
  );
}

// ─── Publication Modal ────────────────────────────────────────────────────────

const PUB_ETAPES = ['Bien', 'Détails', 'Photos', 'Texte IA', 'Plateformes'];

function PublicationModal({ onClose, onSuccess }) {
  const [etape, setEtape] = useState(0);
  const [loading, setLoading] = useState(false);
  const [texteGenere, setTexteGenere] = useState(null);
  const [resultats, setResultats] = useState(null);
  const [plateformesSelectionnees, setPlateformesSelectionnees] = useState(['leboncoin', 'seloger', 'bienici', 'pap']);
  const [bien, setBien] = useState({
    type: 'Appartement', transaction: 'vente',
    surface: '', pieces: '', chambres: '', prix: '',
    ville: '', codePostal: '', etage: '', ascenseur: false,
    charges: '', depot: '', dpe: 'C', ges: 'C',
    equipements: [], photos: [], descriptionLibre: '',
  });

  const upd = (k, v) => setBien(p => ({ ...p, [k]: v }));
  const toggleEq = (eq) => setBien(p => ({ ...p, equipements: p.equipements.includes(eq) ? p.equipements.filter(e => e !== eq) : [...p.equipements, eq] }));
  const togglePl = (id) => setPlateformesSelectionnees(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handlePhotos = (e) => {
    const urls = Array.from(e.target.files).map(f => URL.createObjectURL(f));
    upd('photos', [...bien.photos, ...urls]);
  };

  const genererTexte = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/immobilier/publier', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generer', bien }),
      });
      const data = await res.json();
      if (data.texte) { setTexteGenere(data.texte); setEtape(3); }
    } catch {
      setTexteGenere({
        titre: `${bien.type} ${bien.surface}m² - ${bien.ville}`,
        description: `${bien.type} de ${bien.surface}m² à ${bien.ville}. ${bien.pieces} pièces dont ${bien.chambres} chambres. DPE ${bien.dpe}. ${bien.descriptionLibre}`,
        pointsForts: [`${bien.surface}m²`, `${bien.pieces} pièces`, `DPE ${bien.dpe}`, bien.ville],
        descriptionCourte: `${bien.type} ${bien.surface}m² ${bien.pieces}p - ${bien.ville}`,
      });
      setEtape(3);
    } finally { setLoading(false); }
  };

  const publier = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/immobilier/publier', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publier', bien: { ...bien, texteGenere }, plateformes: plateformesSelectionnees }),
      });
      const data = await res.json();
      if (data.resultats) { setResultats(data.resultats); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const iStyle = { width: '100%', background: '#1f1f24', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 13px', fontSize: 13.5, color: '#e8e8e8', fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box' };
  const taStyle = { ...iStyle, resize: 'vertical', minHeight: 90, lineHeight: 1.6, paddingTop: 10 };
  const toggleStyle = (active) => ({ padding: '8px 14px', borderRadius: 8, border: `1px solid ${active ? '#d4a853' : 'rgba(255,255,255,0.07)'}`, background: active ? 'rgba(212,168,83,0.1)' : '#1f1f24', color: active ? '#d4a853' : '#a0a0ae', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' });
  const lbl = { display: 'block', fontSize: 12, color: '#6b6b78', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 };

  const canProceed = () => {
    if (etape === 0) return bien.surface && bien.pieces && bien.prix && bien.ville && bien.codePostal;
    if (etape === 3) return !!texteGenere;
    return true;
  };

  const handleNext = () => {
    if (etape === 2) { genererTexte(); return; }
    if (etape === 4 && !resultats) { publier(); return; }
    if (etape === 4 && resultats) { onSuccess?.(); onClose(); return; }
    setEtape(e => e + 1);
  };

  const nextLabel = () => {
    if (etape === 2) return loading ? ' Génération...' : ' Générer le texte';
    if (etape === 4 && !resultats) return loading ? 'Publication...' : ` Publier sur ${plateformesSelectionnees.length} site${plateformesSelectionnees.length > 1 ? 's' : ''}`;
    if (etape === 4 && resultats) return 'Terminer ✓';
    return 'Continuer →';
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#17171a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, width: '100%', maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, color: '#e8e8e8', fontWeight: 400, margin: 0 }}>Publier une annonce</h2>
          <button onClick={onClose} style={{ background: '#1f1f24', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#a0a0ae', display: 'flex' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', gap: 4, padding: '14px 28px' }}>
          {PUB_ETAPES.map((s, i) => (
            <div key={s} style={{ flex: 1, textAlign: 'center', padding: '7px 4px', borderRadius: 8, fontSize: 12, fontFamily: 'DM Sans, sans-serif', fontWeight: i === etape ? 600 : 400, color: i < etape ? '#d4a853' : i === etape ? '#e8e8e8' : '#4b5563', background: i === etape ? '#1f1f24' : 'transparent', border: `1px solid ${i === etape ? 'rgba(212,168,83,0.3)' : i < etape ? 'rgba(212,168,83,0.15)' : 'transparent'}`, transition: 'all 0.3s' }}>
              {i < etape ? '✓ ' : ''}{s}
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 28px 20px' }}>

          {/* Étape 0 — Bien */}
          {etape === 0 && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={lbl}>Transaction</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['vente', 'location'].map(t => <button key={t} style={toggleStyle(bien.transaction === t)} onClick={() => upd('transaction', t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>)}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Type de bien</label>
                  <select style={iStyle} value={bien.type} onChange={e => upd('type', e.target.value)}>
                    {TYPE_BIENS_PUB.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div><label style={lbl}>Surface (m²)</label><input style={iStyle} type="number" placeholder="75" value={bien.surface} onChange={e => upd('surface', e.target.value)} /></div>
                <div><label style={lbl}>Pièces</label><input style={iStyle} type="number" placeholder="3" value={bien.pieces} onChange={e => upd('pieces', e.target.value)} /></div>
                <div><label style={lbl}>Chambres</label><input style={iStyle} type="number" placeholder="2" value={bien.chambres} onChange={e => upd('chambres', e.target.value)} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div><label style={lbl}>Prix (€){bien.transaction === 'location' ? '/mois' : ''}</label><input style={iStyle} type="number" placeholder={bien.transaction === 'location' ? '1200' : '250000'} value={bien.prix} onChange={e => upd('prix', e.target.value)} /></div>
                <div><label style={lbl}>Ville</label><input style={iStyle} type="text" placeholder="Paris" value={bien.ville} onChange={e => upd('ville', e.target.value)} /></div>
              </div>
              <div><label style={lbl}>Code postal</label><input style={{ ...iStyle, maxWidth: 160 }} type="text" placeholder="75001" value={bien.codePostal} onChange={e => upd('codePostal', e.target.value)} /></div>
            </div>
          )}

          {/* Étape 1 — Détails */}
          {etape === 1 && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div><label style={lbl}>Étage</label><input style={iStyle} type="number" placeholder="2" value={bien.etage} onChange={e => upd('etage', e.target.value)} /></div>
                <div><label style={lbl}>DPE</label><select style={iStyle} value={bien.dpe} onChange={e => upd('dpe', e.target.value)}>{DPE_OPTIONS.map(d => <option key={d}>{d}</option>)}</select></div>
                <div><label style={lbl}>GES</label><select style={iStyle} value={bien.ges} onChange={e => upd('ges', e.target.value)}>{DPE_OPTIONS.map(d => <option key={d}>{d}</option>)}</select></div>
              </div>
              {bien.transaction === 'location' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                  <div><label style={lbl}>Charges (€/mois)</label><input style={iStyle} type="number" placeholder="80" value={bien.charges} onChange={e => upd('charges', e.target.value)} /></div>
                  <div><label style={lbl}>Dépôt de garantie (€)</label><input style={iStyle} type="number" placeholder="2400" value={bien.depot} onChange={e => upd('depot', e.target.value)} /></div>
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Ascenseur</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[true, false].map(v => <button key={String(v)} style={toggleStyle(bien.ascenseur === v)} onClick={() => upd('ascenseur', v)}>{v ? 'Oui' : 'Non'}</button>)}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Équipements</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  {EQUIPEMENTS_LIST.map(eq => <button key={eq} style={toggleStyle(bien.equipements.includes(eq))} onClick={() => toggleEq(eq)}>{eq}</button>)}
                </div>
              </div>
              <div><label style={lbl}>Description libre (optionnel)</label><textarea style={taStyle} placeholder="Ajoutez des détails pour enrichir l'annonce..." value={bien.descriptionLibre} onChange={e => upd('descriptionLibre', e.target.value)} /></div>
            </div>
          )}

          {/* Étape 2 — Photos */}
          {etape === 2 && (
            <div>
              <div style={{ border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 12, padding: 32, textAlign: 'center', cursor: 'pointer', background: '#0f0f11', marginBottom: 16 }} onClick={() => document.getElementById('pub-photo-input').click()}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                <p style={{ color: '#6b6b78', fontFamily: 'DM Sans, sans-serif', fontSize: 14, margin: 0 }}>Cliquez pour ajouter des photos</p>
                <p style={{ color: '#4b5563', fontFamily: 'DM Sans, sans-serif', fontSize: 12, marginTop: 4 }}>JPG, PNG · Max 10 photos</p>
                <input id="pub-photo-input" type="file" accept="image/*" multiple hidden onChange={handlePhotos} />
              </div>
              {bien.photos.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {bien.photos.map((p, i) => (
                    <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden' }}>
                      <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => upd('photos', bien.photos.filter((_, j) => j !== i))} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', width: 22, height: 22, borderRadius: '50%', cursor: 'pointer', fontSize: 12 }}>×</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#4b5563', fontFamily: 'DM Sans, sans-serif', fontSize: 13, textAlign: 'center' }}>Vous pouvez passer cette étape et ajouter les photos directement sur chaque site.</p>
              )}
            </div>
          )}

          {/* Étape 3 — Texte IA */}
          {etape === 3 && (
            <div>
              {!texteGenere ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}></div>
                  <p style={{ color: '#6b6b78', fontFamily: 'DM Sans, sans-serif', marginBottom: 20 }}>Générez automatiquement un texte d'annonce optimisé.</p>
                  <button style={{ background: 'linear-gradient(135deg, #8b6914, #d4a853)', color: '#0f0f11', border: 'none', borderRadius: 10, padding: '11px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }} onClick={genererTexte} disabled={loading}>
                    {loading ? 'Génération...' : ' Générer'}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div><label style={lbl}>Titre</label><input style={iStyle} value={texteGenere.titre} onChange={e => setTexteGenere(p => ({ ...p, titre: e.target.value }))} /></div>
                  <div><label style={lbl}>Description complète</label><textarea style={{ ...taStyle, minHeight: 130 }} value={texteGenere.description} onChange={e => setTexteGenere(p => ({ ...p, description: e.target.value }))} /></div>
                  <div><label style={lbl}>Description courte (LeBonCoin)</label><textarea style={{ ...taStyle, minHeight: 60 }} value={texteGenere.descriptionCourte} onChange={e => setTexteGenere(p => ({ ...p, descriptionCourte: e.target.value }))} /></div>
                  <div>
                    <label style={lbl}>Points forts</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {texteGenere.pointsForts?.map((p, i) => <span key={i} style={{ background: 'rgba(212,168,83,0.1)', border: '1px solid rgba(212,168,83,0.3)', color: '#d4a853', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>{p}</span>)}
                    </div>
                  </div>
                  <button style={{ background: '#1f1f24', color: '#6b6b78', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', alignSelf: 'flex-start' }} onClick={genererTexte} disabled={loading}> Régénérer</button>
                </div>
              )}
            </div>
          )}

          {/* Étape 4 — Plateformes + résultats */}
          {etape === 4 && (
            <div>
              {!resultats ? (
                <>
                  <p style={{ fontSize: 13, color: '#6b6b78', fontFamily: 'DM Sans, sans-serif', marginBottom: 16 }}>Sélectionnez les plateformes de diffusion :</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                    {PLATEFORMES_PUBLICATION.map(pl => (
                      <div key={pl.id} onClick={() => togglePl(pl.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: 12, cursor: 'pointer', background: plateformesSelectionnees.includes(pl.id) ? '#1f1f24' : '#17171a', border: `1px solid ${plateformesSelectionnees.includes(pl.id) ? 'rgba(212,168,83,0.4)' : 'rgba(255,255,255,0.07)'}`, transition: 'all 0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 20 }}>{pl.logo}</span>
                          <div>
                            <p style={{ margin: 0, color: '#e8e8e8', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 14 }}>{pl.nom}</p>
                            <p style={{ margin: 0, color: '#4b5563', fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>{pl.description}</p>
                          </div>
                        </div>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${plateformesSelectionnees.includes(pl.id) ? '#d4a853' : '#2a2a30'}`, background: plateformesSelectionnees.includes(pl.id) ? '#d4a853' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}>
                          {plateformesSelectionnees.includes(pl.id) && <span style={{ color: '#0f0f11', fontSize: 11, fontWeight: 'bold' }}>✓</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, color: '#d4a853', marginBottom: 16 }}>Résultats de publication</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {Object.entries(resultats).map(([id, data]) => {
                      const pl = PLATEFORMES_PUBLICATION.find(p => p.id === id);
                      const cfg = STATUS_CONFIG[data.status] || STATUS_CONFIG.erreur;
                      return (
                        <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: 12, background: '#1f1f24', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 20 }}>{pl?.logo}</span>
                            <div>
                              <p style={{ margin: 0, color: '#e8e8e8', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 14 }}>{pl?.nom}</p>
                              <p style={{ margin: 0, color: '#4b5563', fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>{data.message || cfg.label}</p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontFamily: 'DM Sans, sans-serif', fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
                            {data.url && <a href={data.url} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontFamily: 'DM Sans, sans-serif', fontWeight: 600, background: '#2a2a30', color: '#d4a853', border: '1px solid rgba(255,255,255,0.07)', textDecoration: 'none' }}>{data.status === 'publie' ? 'Voir →' : 'Publier →'}</a>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '18px 28px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {etape > 0 && !resultats
            ? <button style={{ background: '#1f1f24', color: '#a0a0ae', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, padding: '10px 18px', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }} onClick={() => setEtape(e => e - 1)}>← Retour</button>
            : <div />
          }
          <button style={{ background: 'linear-gradient(135deg, #8b6914, #d4a853)', color: '#0f0f11', border: 'none', borderRadius: 9, padding: '10px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: canProceed() ? 1 : 0.45 }}
            onClick={handleNext} disabled={!canProceed() || loading}>
            {nextLabel()}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Publication Dashboard (onglet) ──────────────────────────────────────────

function PublicationDashboard() {
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);

  const charger = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/immobilier/publier');
      const data = await res.json();
      setAnnonces(data.annonces || []);
    } catch { setAnnonces([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { charger(); }, []);

  const totalPublies = annonces.reduce((acc, a) => acc + Object.values(a.resultats_publication || {}).filter(r => r.status === 'publie').length, 0);
  const totalLiens = annonces.reduce((acc, a) => acc + Object.values(a.resultats_publication || {}).filter(r => r.status === 'lien_direct').length, 0);

  return (
    <div>
      {/* Top */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <h2 className="page-title">Publication d'annonces</h2>
          <p className="page-subtitle">Créez et diffusez vos annonces sur LeBonCoin, SeLoger, BienIci et PAP</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nouvelle annonce</button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card"><div className="stat-label">Annonces créées</div><div className="stat-value">{annonces.length}</div><div className="stat-sub">dans l'historique</div></div>
        <div className="stat-card"><div className="stat-label">Publications auto</div><div className="stat-value">{totalPublies}</div><div className="stat-sub">via API</div></div>
        <div className="stat-card"><div className="stat-label">Liens directs</div><div className="stat-value">{totalLiens}</div><div className="stat-sub">à publier manuellement</div></div>
        <div className="stat-card"><div className="stat-label">Plateformes</div><div className="stat-value">5</div><div className="stat-sub">disponibles</div></div>
      </div>

      {/* Bannière config */}
      <div style={{ background: 'rgba(212,168,83,0.06)', border: '1px solid rgba(212,168,83,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', gap: 12 }}>
        <span style={{ fontSize: 18, marginTop: 1 }}></span>
        <div>
          <p style={{ margin: '0 0 4px 0', fontSize: 13, color: '#d4a853', fontWeight: 600 }}>Configuration des APIs partenaires</p>
          <p style={{ margin: 0, fontSize: 12.5, color: '#6b6b78', lineHeight: 1.6 }}>
            Pour activer la publication automatique, ajoutez dans Vercel → Settings → Env Variables :{' '}
            <code style={{ background: '#1f1f24', padding: '1px 6px', borderRadius: 4, color: '#d4a853', fontSize: 12 }}>LEBONCOIN_API_KEY</code>{', '}
            <code style={{ background: '#1f1f24', padding: '1px 6px', borderRadius: 4, color: '#d4a853', fontSize: 12 }}>SELOGER_API_KEY</code>{', '}
            <code style={{ background: '#1f1f24', padding: '1px 6px', borderRadius: 4, color: '#d4a853', fontSize: 12 }}>ANTHROPIC_API_KEY</code>.
            Sans ces clés, les annonces fonctionnent avec des liens directs.
          </p>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#4b5563' }}>Chargement...</div>
      ) : annonces.length === 0 ? (
        <div className="empty">
          <strong>📝 Aucune annonce publiée</strong>
          Cliquez sur "+ Nouvelle annonce" pour créer et diffuser votre première annonce
          <br /><br />
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Créer une annonce</button>
        </div>
      ) : (
        annonces.map((annonce, i) => {
          const b = annonce.bien_data || {};
          const res = annonce.resultats_publication || {};
          const isSelected = selected === i;
          return (
            <div key={i}>
              <div style={{ background: isSelected ? '#1f1f24' : 'var(--surface2)', border: `1px solid ${isSelected ? 'rgba(212,168,83,0.3)' : 'var(--border)'}`, borderRadius: 10, padding: '18px 20px', marginBottom: 10, cursor: 'pointer', transition: 'all 0.15s' }}
                onClick={() => setSelected(isSelected ? null : i)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
                      {annonce.texte_genere?.titre || `${b.type} ${b.surface}m² - ${b.ville}`}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {b.surface}m² · {b.pieces}p · {b.prix?.toLocaleString('fr-FR')}€{b.transaction === 'location' ? '/mois' : ''} · {b.ville}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{annonce.created_at ? new Date(annonce.created_at).toLocaleDateString('fr-FR') : '—'}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {Object.entries(res).map(([plId, data]) => {
                    const pl = PLATEFORMES_PUBLICATION.find(p => p.id === plId);
                    const cfg = STATUS_CONFIG[data.status] || STATUS_CONFIG.erreur;
                    return <span key={plId} style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontFamily: 'DM Sans, sans-serif', fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{pl?.logo} {pl?.nom}</span>;
                  })}
                </div>
              </div>
              {isSelected && (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px', marginBottom: 12, marginTop: -6 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent)', marginBottom: 14 }}>Statut par plateforme</div>
                  {Object.entries(res).map(([plId, data]) => {
                    const pl = PLATEFORMES_PUBLICATION.find(p => p.id === plId);
                    const cfg = STATUS_CONFIG[data.status] || STATUS_CONFIG.erreur;
                    return (
                      <div key={plId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border)', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 18 }}>{pl?.logo}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{pl?.nom}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{data.message || cfg.label}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
                          {data.url && <a href={data.url} target="_blank" rel="noopener noreferrer" style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: 'var(--surface)', color: 'var(--accent)', border: '1px solid var(--border)', textDecoration: 'none' }}>{data.status === 'publie' ? 'Voir →' : 'Publier →'}</a>}
                        </div>
                      </div>
                    );
                  })}
                  {annonce.texte_genere?.description && (
                    <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Texte généré</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{annonce.texte_genere.description}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {showModal && <PublicationModal onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); charger(); }} />}
    </div>
  );
}

// ─── UpgradeGate ──────────────────────────────────────────────────────────────

const PLAN_LABELS = { gratuit: 'Gratuit', pro: 'Pro', agence: 'Agence' };

function UpgradeGate({ planRequired, plan, featureLabel }) {
  const requiredLabel = PLAN_LABELS[planRequired] || planRequired;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: 340, padding: 40, textAlign: 'center', gap: 20,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="1.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <div>
        <p style={{ color: 'var(--text)', fontSize: 16, fontWeight: 500, margin: '0 0 8px' }}>
          {featureLabel}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
          Cette fonctionnalité est réservée au plan <strong style={{ color: '#c9a96e' }}>{requiredLabel}</strong>.
          {' '}Votre plan actuel : <strong style={{ color: 'var(--text-dim)' }}>{PLAN_LABELS[plan] || plan}</strong>.
        </p>
      </div>
      <a
        href="/#tarifs"
        style={{
          display: 'inline-block', padding: '10px 24px',
          background: 'linear-gradient(135deg, #c9a96e, #a07840)',
          color: '#fff', borderRadius: 8, fontSize: 13,
          fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.04em',
          textDecoration: 'none', fontWeight: 600,
        }}
      >
        Voir les offres
      </a>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ImmobilierDashboard() {
  const { agent, logout, plan, isPro, isAgence } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Helper : peut accéder à une feature ?
  const can = (feature) => canAccess(feature, plan, agent?.role);
  const [biens, setBiens] = useState([]);
  const [acheteurs, setAcheteurs] = useState([]);
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedProspects, setSelectedProspects] = useState([]);
  const [biensFilter, setBiensFilter] = useState({ type: 'all', search: '' });

  const [scraperForm, setScraperForm] = useState({ siteId: null, location: '', propertyType: 'all', prixMin: '', prixMax: '', surfaceMin: '' });
  const [scrapingProgress, setScrapingProgress] = useState(null);

  const [emailForm, setEmailForm] = useState({ subject: '', message: '', senderName: '', senderEmail: '' });
  const [emailStatus, setEmailStatus] = useState(null);

  const [showOnboardingAgent, setShowOnboardingAgent] = useState(false);
  const [showOnboardingAcheteur, setShowOnboardingAcheteur] = useState(false);

  useEffect(() => {
    loadAll();
    try {
      const done = localStorage.getItem('pb_onboarding_done');
      if (!done) setTimeout(() => setShowOnboardingAgent(true), 400);
    } catch {}
  }, []);

  const handleOnboardingAgentComplete = () => {
    setShowOnboardingAgent(false);
    try { localStorage.setItem('pb_onboarding_done', '1'); } catch {}
  };

  const handleOnboardingAcheteurComplete = () => {
    setShowOnboardingAcheteur(false);
    loadAll();
  };

  const loadAll = async () => {
    try {
      const [biensRes, acheteursRes, matchesRes, statsRes] = await Promise.all([
        fetch('/api/immobilier/biens'),
        fetch('/api/immobilier/acheteurs'),
        fetch('/api/immobilier/matches'),
        fetch('/api/immobilier/stats'),
      ]);
      if (biensRes.ok) { const d = await biensRes.json(); setBiens(d.data || []); }
      if (acheteursRes.ok) { const d = await acheteursRes.json(); setAcheteurs(d.data || []); }
      if (matchesRes.ok) { const d = await matchesRes.json(); setMatches(d.data || []); }
      if (statsRes.ok) { const d = await statsRes.json(); setStats(d.data || null); }
    } catch (err) { console.error(err); }
  };

  const handleScrape = async () => {
    if (!scraperForm.siteId || !scraperForm.location.trim()) return;
    const site = SITES.find(s => s.id === scraperForm.siteId);
    setLoading(true);
    setScrapingProgress({ status: 'running', message: `Recherche sur ${site.label}…` });
    try {
      const params = new URLSearchParams({
        ville: scraperForm.location,
        type: scraperForm.propertyType === 'all' ? 'maison' : scraperForm.propertyType,
        ...(scraperForm.prixMin && { prixMin: scraperForm.prixMin }),
        ...(scraperForm.prixMax && { prixMax: scraperForm.prixMax }),
        ...(scraperForm.surfaceMin && { surfaceMin: scraperForm.surfaceMin }),
      });
      const res = await fetch(`${site.apiRoute}?${params}`);
      const data = await res.json();
      if (res.ok) {
        setScrapingProgress({ status: 'done', count: data.stats?.annoncesTouvees || 0, nouvelles: data.stats?.nouvellesAnnonces || 0 });
        loadAll();
      } else {
        setScrapingProgress({ status: 'error', message: data.error || 'Erreur inconnue' });
      }
    } catch (err) {
      setScrapingProgress({ status: 'error', message: err.message });
    } finally { setLoading(false); }
  };

  const resetScraper = () => {
    setScrapingProgress(null);
    setScraperForm({ siteId: null, location: '', propertyType: 'all', prixMin: '', prixMax: '', surfaceMin: '' });
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (selectedProspects.length === 0) return;
    setLoading(true);
    setEmailStatus(null);
    try {
      const res = await fetch('/api/B2B/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients: selectedProspects.map(email => ({ email })), subject: emailForm.subject, template: emailForm.message, senderName: emailForm.senderName, senderEmail: emailForm.senderEmail }),
      });
      const data = await res.json();
      setEmailStatus(res.ok ? { success: true, sent: data.sent } : { success: false, error: data.error });
    } catch (err) {
      setEmailStatus({ success: false, error: err.message });
    } finally { setLoading(false); }
  };

  const handleMatchAuto = async () => {
    setLoading(true);
    try {
      await fetch('/api/immobilier/match-auto', { method: 'POST' });
      loadAll();
    } finally { setLoading(false); }
  };

  const toggleProspect = (email) => {
    setSelectedProspects(prev => prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]);
  };

  const filteredBiens = biens.filter(b => {
    const matchType = biensFilter.type === 'all' || b.type === biensFilter.type;
    const matchSearch = !biensFilter.search || b.titre?.toLowerCase().includes(biensFilter.search.toLowerCase()) || b.ville?.toLowerCase().includes(biensFilter.search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <>
      <Head>
        <title>Immo Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'DM Sans', sans-serif; background: #080809; color: #e8e8e8; min-height: 100vh; overflow-x: hidden; }
        body::before {
          content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 1000;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          opacity: 0.4;
        }
        :root {
          --bg: #080809; --surface: #111113; --surface2: #17171a;
          --border: rgba(255,255,255,0.07); --border-hover: rgba(255,255,255,0.14);
          --text: #e8e8e8; --text-muted: #6b6b78; --text-dim: #a0a0ae;
          --accent: #d4a853; --accent-dim: rgba(212,168,83,0.10); --accent-border: rgba(212,168,83,0.3);
          --green: #3ecf8e; --green-dim: rgba(62,207,142,0.1);
          --red: #f04444; --red-dim: rgba(240,68,68,0.1);
          --blue: #5b8dee; --blue-dim: rgba(91,141,238,0.1);
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(212,168,83,0.2); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(212,168,83,0.35); }
        .layout { display: flex; min-height: 100vh; }
        .sidebar { width: 220px; flex-shrink: 0; background: rgba(255,255,255,0.02); border-right: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
        .sidebar-logo { padding: 28px 20px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .sidebar-logo h1 { font-family: 'Cormorant Garamond', serif; font-size: 20px; color: var(--accent); letter-spacing: 0.5px; font-style: italic; }
        .sidebar-logo p { font-size: 11px; color: var(--text-muted); margin-top: 3px; letter-spacing: 1px; text-transform: uppercase; }
        .sidebar-nav { padding: 16px 12px; flex: 1; }
        .sidebar-footer { padding: 14px 12px; border-top: 1px solid rgba(255,255,255,0.06); }
        .agent-info { padding: 10px 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; margin-bottom: 8px; }
        .agent-name { font-size: 13px; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .agent-role { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
        .logout-btn { display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 12px; font-size: 13px; color: var(--text-muted); background: none; border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; text-align: left; }
        .logout-btn:hover { color: #f04444; border-color: rgba(240,68,68,0.3); background: rgba(240,68,68,0.05); }
        .help-btn { display: flex; align-items: center; gap: 8px; width: 100%; padding: 7px 12px; font-size: 12px; color: var(--text-muted); background: none; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: color 0.15s; text-align: left; margin-bottom: 6px; }
        .help-btn:hover { color: var(--accent); }
        .nav-item { display: flex; align-items: center; padding: 9px 12px; border-radius: 8px; cursor: pointer; font-size: 13.5px; font-weight: 400; color: rgba(255,255,255,0.45); transition: all 0.15s; margin-bottom: 2px; border: none; background: none; width: 100%; text-align: left; letter-spacing: 0.2px; }
        .nav-item:hover { color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.04); }
        .nav-item.active { color: var(--accent); background: var(--accent-dim); font-weight: 500; }
        .nav-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; margin-right: 10px; opacity: 0.5; }
        .nav-item.active .nav-dot { opacity: 1; }
        .nav-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 8px 0; }
        .main { flex: 1; overflow-y: auto; padding: 40px 48px; max-width: 1100px; }
        .page-header { margin-bottom: 36px; }
        .page-title { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 300; color: var(--text); letter-spacing: -0.5px; }
        .page-subtitle { font-size: 13.5px; color: var(--text-muted); margin-top: 6px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 36px; }
        .stat-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 22px 20px; cursor: pointer; transition: border-color 0.2s, transform 0.2s; }
        .stat-card:hover { border-color: rgba(212,168,83,0.25); transform: translateY(-2px); }
        .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-muted); font-weight: 500; }
        .stat-value { font-size: 36px; font-family: 'Cormorant Garamond', serif; color: var(--accent); margin-top: 8px; letter-spacing: -1px; font-weight: 500; }
        .stat-sub { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
        .card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 28px; margin-bottom: 20px; transition: border-color 0.2s; }
        .card:hover { border-color: rgba(255,255,255,0.1); }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .card-title { font-size: 14px; font-weight: 500; color: var(--text); letter-spacing: 0.2px; }
        .card-link { font-size: 12px; color: var(--accent); cursor: pointer; background: none; border: none; padding: 0; }
        .card-link:hover { opacity: 0.8; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .list-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border); }
        .list-item:last-child { border-bottom: none; }
        .list-item-main { font-size: 13.5px; color: var(--text); font-weight: 500; }
        .list-item-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
        .list-item-right { text-align: right; font-size: 13px; color: var(--text); font-weight: 500; }
        .list-item-right small { display: block; font-size: 11px; color: var(--text-muted); font-weight: 400; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; letter-spacing: 0.2px; }
        .badge-blue { background: var(--blue-dim); color: var(--blue); }
        .badge-green { background: var(--green-dim); color: var(--green); }
        .badge-gold { background: var(--accent-dim); color: var(--accent); }
        .badge-neutral { background: var(--surface2); color: var(--text-muted); }
        .score-bar { height: 3px; background: var(--surface2); border-radius: 2px; margin-top: 6px; }
        .score-fill { height: 100%; border-radius: 2px; background: var(--accent); transition: width 0.4s; }
        label { display: block; font-size: 12px; font-weight: 500; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 7px; }
        input[type="text"], input[type="email"], input[type="number"], input[type="tel"], select, textarea { width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.09); border-radius: 10px; padding: 10px 13px; font-size: 13.5px; color: var(--text); font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.15s; }
        input:focus, select:focus, textarea:focus { border-color: var(--accent-border); background: rgba(212,168,83,0.03); }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2); }
        select option { background: #111113; }
        textarea { resize: vertical; line-height: 1.6; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .form-group { margin-bottom: 16px; }
        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: 10px; font-size: 13.5px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; border: none; transition: all 0.15s; }
        .btn-primary { background: linear-gradient(135deg, #8b6914, #d4a853); color: #0a0a0a; box-shadow: 0 4px 20px rgba(212,168,83,0.2); }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(212,168,83,0.35); }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
        .btn-secondary { background: rgba(255,255,255,0.04); color: var(--text-dim); border: 1px solid rgba(255,255,255,0.09); }
        .btn-secondary:hover { border-color: rgba(255,255,255,0.14); color: var(--text); }
        .btn-ghost { background: transparent; color: var(--text-muted); border: 1px solid rgba(255,255,255,0.09); }
        .btn-ghost:hover { color: var(--text); border-color: rgba(255,255,255,0.14); }
        .btn-full { width: 100%; }
        .site-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .site-card { padding: 18px 16px; border-radius: 12px; border: 1.5px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.02); cursor: pointer; transition: all 0.15s; text-align: left; }
        .site-card:hover { border-color: rgba(255,255,255,0.14); }
        .site-card.selected { border-color: var(--accent-border); background: var(--accent-dim); }
        .site-name { font-size: 14px; font-weight: 600; color: var(--text); }
        .site-sub { font-size: 12px; color: var(--text-muted); margin-top: 3px; }
        .site-check { display: inline-block; margin-top: 10px; font-size: 11px; color: var(--accent); font-weight: 500; }
        .step-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: var(--text-muted); font-weight: 600; margin-bottom: 14px; }
        .step-block { margin-bottom: 28px; }
        .progress-box { padding: 20px 22px; border-radius: 12px; border: 1px solid; margin-bottom: 24px; }
        .progress-running { border-color: rgba(91,141,238,0.3); background: rgba(91,141,238,0.08); }
        .progress-done { border-color: rgba(62,207,142,0.3); background: rgba(62,207,142,0.08); }
        .progress-error { border-color: rgba(240,68,68,0.3); background: rgba(240,68,68,0.08); }
        .progress-title { font-size: 14px; font-weight: 600; }
        .progress-sub { font-size: 13px; color: var(--text-dim); margin-top: 5px; }
        .spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.2); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .bien-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 20px; margin-bottom: 12px; transition: border-color 0.2s, transform 0.2s; cursor: pointer; }
        .bien-card:hover { border-color: rgba(212,168,83,0.3); transform: translateY(-2px); }
        .bien-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .bien-title { font-size: 14px; font-weight: 500; color: var(--text); margin-bottom: 6px; }
        .bien-meta { font-size: 12.5px; color: var(--text-muted); }
        .bien-price { font-family: 'Cormorant Garamond', serif; font-size: 22px; color: var(--accent); text-align: right; font-weight: 500; }
        .bien-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
        .match-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 18px 20px; margin-bottom: 10px; transition: border-color 0.2s; }
        .match-card:hover { border-color: rgba(212,168,83,0.25); }
        .match-top { display: flex; justify-content: space-between; align-items: center; }
        .match-score { font-family: 'Cormorant Garamond', serif; font-size: 26px; color: var(--accent); font-weight: 500; }
        .acheteur-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 18px 20px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; text-decoration: none; transition: border-color 0.2s, transform 0.2s; cursor: pointer; }
        .acheteur-card:hover { border-color: rgba(212,168,83,0.3); transform: translateY(-2px); }
        .prospect-row { display: flex; align-items: center; padding: 12px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.02); margin-bottom: 8px; cursor: pointer; transition: border-color 0.15s; }
        .prospect-row:hover { border-color: rgba(255,255,255,0.14); }
        .prospect-row.selected { border-color: var(--accent-border); background: var(--accent-dim); }
        .prospect-check { width: 16px; height: 16px; border-radius: 4px; border: 1.5px solid rgba(255,255,255,0.15); margin-right: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .prospect-check.checked { background: var(--accent); border-color: var(--accent); }
        .prospect-check.checked::after { content: ''; width: 8px; height: 5px; border-left: 2px solid #0f0f11; border-bottom: 2px solid #0f0f11; transform: rotate(-45deg) translate(1px, -1px); }
        .alert { padding: 12px 16px; border-radius: 10px; font-size: 13px; margin-bottom: 20px; border: 1px solid; }
        .alert-success { background: rgba(62,207,142,0.08); border-color: rgba(62,207,142,0.3); color: var(--green); }
        .alert-error { background: rgba(240,68,68,0.08); border-color: rgba(240,68,68,0.3); color: var(--red); }
        .alert-warning { background: var(--accent-dim); border-color: var(--accent-border); color: var(--accent); }
        .empty { text-align: center; padding: 48px 20px; color: var(--text-muted); font-size: 13.5px; }
        .empty strong { display: block; font-size: 15px; color: var(--text-dim); margin-bottom: 8px; }
        .filter-row { display: flex; gap: 12px; margin-bottom: 20px; }
        .filter-row input { flex: 1; }
        .filter-row select { width: 160px; }
        .divider { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 24px 0; }
        label { display: block; font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 7px; }
        input[type="text"], input[type="email"], input[type="number"], input[type="tel"], select, textarea { width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.09); border-radius: 10px; padding: 10px 13px; font-size: 13.5px; color: var(--text); font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.15s; }
        input:focus, select:focus, textarea:focus { border-color: var(--accent-border); background: rgba(212,168,83,0.03); }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2); }
        select option { background: #111113; }
        textarea { resize: vertical; line-height: 1.6; }
        @media (max-width: 900px) {
          .sidebar { display: none; }
          .main { padding: 24px 20px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .two-col { grid-template-columns: 1fr; }
          .form-grid { grid-template-columns: 1fr; }
          .form-grid-4 { grid-template-columns: 1fr 1fr; }
          .site-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <h1>Immo Pro</h1>
            <p>Tableau de bord</p>
          </div>
          <nav className="sidebar-nav">
            {NAV_ITEMS.filter(i => i.id !== 'publication').map(item => (
              <button key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}>
                <span className="nav-dot" />
                {item.label}
              </button>
            ))}
            <div className="nav-divider" />
            <button className={`nav-item ${activeTab === 'publication' ? 'active' : ''}`} onClick={() => setActiveTab('publication')}>
              <span className="nav-dot" />
               Publier une annonce
            </button>
          </nav>
          {agent && (
            <div className="sidebar-footer">
              <div className="agent-info">
                <div className="agent-name">{agent.name}</div>
                <div className="agent-role">{agent.role === 'admin' ? 'Administrateur' : 'Agent'}</div>
              </div>
              <div style={{
                display: 'inline-block',
                padding: '3px 10px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: 8,
                background: plan === 'agence' ? 'rgba(201,169,110,0.15)' : plan === 'pro' ? 'rgba(62,207,142,0.1)' : 'rgba(255,255,255,0.05)',
                color: plan === 'agence' ? '#c9a96e' : plan === 'pro' ? '#3ecf8e' : '#6b6b78',
                border: `1px solid ${plan === 'agence' ? 'rgba(201,169,110,0.3)' : plan === 'pro' ? 'rgba(62,207,142,0.2)' : 'rgba(255,255,255,0.07)'}`,
              }}>
                {plan === 'agence' ? 'Agence' : plan === 'pro' ? 'Pro' : 'Gratuit'}
              </div>
              <button className="help-btn" onClick={() => setShowOnboardingAgent(true)}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Revoir le tutoriel
              </button>
              <button className="logout-btn" onClick={logout}>
                <span>←</span> Déconnexion
              </button>
            </div>
          )}
        </aside>

        {/* Main */}
        <main className="main">

          {/* ── Dashboard ── */}
          {activeTab === 'dashboard' && (
            <>
              <div className="page-header">
                <h2 className="page-title">Vue d'ensemble</h2>
                <p className="page-subtitle">Activité du portefeuille en temps réel</p>
              </div>
              <div className="stats-grid">
                <div className="stat-card" onClick={() => setActiveTab('biens')}>
                  <div className="stat-label">Annonces</div>
                  <div className="stat-value">{stats?.totalBiens ?? biens.length}</div>
                  <div className="stat-sub">biens dans la base</div>
                </div>
                <div className="stat-card" onClick={() => setActiveTab('acheteurs')}>
                  <div className="stat-label">Acheteurs</div>
                  <div className="stat-value">{stats?.totalAcheteurs ?? acheteurs.length}</div>
                  <div className="stat-sub">profils actifs</div>
                </div>
                <div className="stat-card" onClick={() => setActiveTab('matches')}>
                  <div className="stat-label">Correspondances</div>
                  <div className="stat-value">{stats?.totalMatches ?? matches.length}</div>
                  <div className="stat-sub">matchs trouvés</div>
                </div>
                <div className="stat-card" onClick={() => setActiveTab('publication')}>
                  <div className="stat-label">Prix moyen</div>
                  <div className="stat-value">{stats?.prixMoyen ? (stats.prixMoyen / 1000).toFixed(0) + 'k' : '—'}</div>
                  <div className="stat-sub">euros sur le marché</div>
                </div>
              </div>
              <div className="two-col">
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Dernières annonces</span>
                    <button className="card-link" onClick={() => setActiveTab('biens')}>Voir tout</button>
                  </div>
                  {biens.length === 0
                    ? <div className="empty"><strong>Aucune annonce</strong>Lancez un scraping pour commencer</div>
                    : biens.slice(0, 5).map((bien, i) => (
                      <div key={i} className="list-item" style={{ cursor: 'pointer' }} onClick={() => router.push(`/biens/${bien.id}`)}>
                        <div>
                          <div className="list-item-main">{bien.titre?.slice(0, 40) || 'Sans titre'}</div>
                          <div className="list-item-sub">{bien.ville} · {bien.type}</div>
                        </div>
                        <div className="list-item-right">
                          {bien.prix ? bien.prix.toLocaleString('fr-FR') + ' €' : 'NC'}
                          <small>{new Date(bien.created_at).toLocaleDateString('fr-FR')}</small>
                        </div>
                      </div>
                    ))
                  }
                </div>
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Meilleures correspondances</span>
                    <button className="card-link" onClick={() => setActiveTab('matches')}>Voir tout</button>
                  </div>
                  {matches.length === 0
                    ? <div className="empty"><strong>Aucun match</strong>Ajoutez des acheteurs et lancez le matching</div>
                    : matches.slice(0, 5).map((m, i) => (
                      <div key={i} className="list-item">
                        <div>
                          <div className="list-item-main">{m.acheteur_nom || 'Acheteur'}</div>
                          <div className="list-item-sub">{m.bien_adresse || m.bien_reference}</div>
                        </div>
                        <div className="list-item-right">
                          <span className="badge badge-gold">{m.score}%</span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </>
          )}

          {/* ── Scraper ── */}
          {activeTab === 'scraper' && (
            <>
              <div className="page-header">
                <h2 className="page-title">Recherche d'annonces</h2>
                <p className="page-subtitle">Sélectionnez une source et définissez vos critères</p>
              </div>
              {scrapingProgress && (
                <div className={`progress-box ${scrapingProgress.status === 'running' ? 'progress-running' : scrapingProgress.status === 'done' ? 'progress-done' : 'progress-error'}`}>
                  {scrapingProgress.status === 'running' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="spinner" />
                      <span className="progress-title" style={{ color: 'var(--blue)' }}>{scrapingProgress.message}</span>
                    </div>
                  )}
                  {scrapingProgress.status === 'done' && (
                    <div>
                      <div className="progress-title" style={{ color: 'var(--green)' }}>Recherche terminée</div>
                      <div className="progress-sub">{scrapingProgress.count} annonces trouvées · {scrapingProgress.nouvelles} nouvelles ajoutées</div>
                      <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={resetScraper}>Nouvelle recherche</button>
                    </div>
                  )}
                  {scrapingProgress.status === 'error' && (
                    <div>
                      <div className="progress-title" style={{ color: 'var(--red)' }}>Erreur</div>
                      <div className="progress-sub">{scrapingProgress.message}</div>
                      <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={resetScraper}>Réessayer</button>
                    </div>
                  )}
                </div>
              )}
              {!scrapingProgress && (
                <div className="card">
                  <div className="step-block">
                    <div className="step-label">1 — Source</div>
                    <div className="site-grid">
                      {SITES.map(site => (
                        <div key={site.id} className={`site-card ${scraperForm.siteId === site.id ? 'selected' : ''}`} onClick={() => setScraperForm({ ...scraperForm, siteId: site.id })}>
                          <div className="site-name">{site.label}</div>
                          <div className="site-sub">{site.sublabel}</div>
                          {scraperForm.siteId === site.id && <span className="site-check">Sélectionné</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="step-block">
                    <div className="step-label">2 — Localisation</div>
                    <input type="text" value={scraperForm.location} onChange={e => setScraperForm({ ...scraperForm, location: e.target.value })} placeholder="Paris, Lyon, Nantes…" />
                  </div>
                  <div className="step-block">
                    <div className="step-label">3 — Filtres optionnels</div>
                    <div className="form-grid-4">
                      <div><label>Type</label><select value={scraperForm.propertyType} onChange={e => setScraperForm({ ...scraperForm, propertyType: e.target.value })}>{PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                      <div><label>Prix min (€)</label><input type="number" value={scraperForm.prixMin} onChange={e => setScraperForm({ ...scraperForm, prixMin: e.target.value })} placeholder="100 000" /></div>
                      <div><label>Prix max (€)</label><input type="number" value={scraperForm.prixMax} onChange={e => setScraperForm({ ...scraperForm, prixMax: e.target.value })} placeholder="500 000" /></div>
                      <div><label>Surface min (m²)</label><input type="number" value={scraperForm.surfaceMin} onChange={e => setScraperForm({ ...scraperForm, surfaceMin: e.target.value })} placeholder="50" /></div>
                    </div>
                  </div>
                  <button className="btn btn-primary btn-full" onClick={handleScrape} disabled={loading || !scraperForm.siteId || !scraperForm.location.trim()}>
                    {loading ? <><span className="spinner" style={{ borderTopColor: '#0f0f11', borderColor: 'rgba(0,0,0,0.2)' }} /> Recherche en cours…</> : 'Lancer la recherche'}
                  </button>
                  {(!scraperForm.siteId || !scraperForm.location.trim()) && (
                    <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
                      {!scraperForm.siteId ? 'Sélectionnez une source pour continuer' : 'Entrez une ville pour continuer'}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── Annonces ── */}
          {activeTab === 'biens' && (
            <>
              <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <h2 className="page-title">Annonces</h2>
                  <p className="page-subtitle">{biens.length} bien{biens.length > 1 ? 's' : ''} dans la base</p>
                </div>
                <button className="btn btn-secondary" onClick={() => setActiveTab('scraper')}>Nouvelle recherche</button>
              </div>
              <div className="filter-row">
                <input type="text" placeholder="Rechercher par ville, titre…" value={biensFilter.search} onChange={e => setBiensFilter({ ...biensFilter, search: e.target.value })} />
                <select value={biensFilter.type} onChange={e => setBiensFilter({ ...biensFilter, type: e.target.value })}>
                  {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {filteredBiens.length === 0
                ? <div className="empty"><strong>Aucune annonce</strong>Utilisez la recherche pour importer des biens</div>
                : filteredBiens.map((bien, i) => (
                  <div key={i} className="bien-card" onClick={() => router.push(`/biens/${bien.id}`)}>
                    <div className="bien-top">
                      <div style={{ flex: 1 }}>
                        <div className="bien-title">{bien.titre || 'Sans titre'}</div>
                        <div className="bien-meta">{bien.ville || bien.adresse || 'Localisation inconnue'}</div>
                        {bien.description && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>{bien.description.slice(0, 140)}{bien.description.length > 140 ? '…' : ''}</div>}
                        <div className="bien-tags">
                          <span className="badge badge-blue">{bien.type || 'autre'}</span>
                          <span className="badge badge-neutral">{bien.source || 'import'}</span>
                          {bien.surface && <span className="badge badge-neutral">{bien.surface} m²</span>}
                          {bien.pieces && <span className="badge badge-neutral">{bien.pieces} pièces</span>}
                        </div>
                      </div>
                      <div style={{ marginLeft: 20, textAlign: 'right', flexShrink: 0 }}>
                        <div className="bien-price">{bien.prix ? bien.prix.toLocaleString('fr-FR') + ' €' : '—'}</div>
                        <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 8 }}>Voir le détail →</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{new Date(bien.created_at).toLocaleDateString('fr-FR')}</div>
                      </div>
                    </div>
                  </div>
                ))
              }
            </>
          )}

          {/* ── Acheteurs ── */}
          {activeTab === 'acheteurs' && (
            <>
              <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <h2 className="page-title">Acheteurs</h2>
                  <p className="page-subtitle">{acheteurs.length} profil{acheteurs.length > 1 ? 's' : ''} enregistré{acheteurs.length > 1 ? 's' : ''}</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowOnboardingAcheteur(true)}>+ Ajouter un acheteur</button>
              </div>
              {acheteurs.length === 0
                ? (
                  <div className="empty">
                    <strong>Aucun acheteur</strong>
                    Cliquez sur "Ajouter un acheteur" pour enregistrer votre premier profil
                    <br /><br />
                    <button className="btn btn-primary" onClick={() => setShowOnboardingAcheteur(true)}>+ Ajouter un acheteur</button>
                  </div>
                )
                : acheteurs.map((a, i) => (
                  <Link key={i} href={`/acheteurs/${a.id}`} className="acheteur-card">
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{a.nom} {a.prenom}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{a.email}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        Budget : {a.budget_max ? a.budget_max.toLocaleString('fr-FR') + ' €' : '—'}
                        {a.villes?.length ? ' · ' + (Array.isArray(a.villes) ? a.villes.join(', ') : a.villes) : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className={`badge ${a.statut === 'actif' ? 'badge-green' : 'badge-neutral'}`}>{a.statut || 'actif'}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>→</span>
                    </div>
                  </Link>
                ))
              }
            </>
          )}

          {/* ── Matches ── */}
          {activeTab === 'matches' && (
            <>
              {!can('matchAuto') ? (
                <UpgradeGate planRequired="pro" plan={plan} featureLabel="Correspondances automatiques" />
              ) : (
                <>
                  <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <h2 className="page-title">Correspondances</h2>
                      <p className="page-subtitle">{matches.length} match{matches.length > 1 ? 's' : ''} trouvé{matches.length > 1 ? 's' : ''}</p>
                    </div>
                    <button className="btn btn-primary" onClick={handleMatchAuto} disabled={loading}>
                      {loading ? <><span className="spinner" style={{ borderTopColor: '#0f0f11', borderColor: 'rgba(0,0,0,0.2)' }} /> Calcul…</> : 'Recalculer les matchs'}
                    </button>
                  </div>
                  {matches.length === 0
                    ? <div className="empty"><strong>Aucune correspondance</strong>Ajoutez des acheteurs et cliquez sur "Recalculer les matchs"</div>
                    : matches.map((m, i) => (
                      <div key={i} className="match-card">
                        <div className="match-top">
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{m.acheteur_nom}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{m.bien_reference} · {m.bien_adresse}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>
                              {m.bien_prix ? m.bien_prix.toLocaleString('fr-FR') + ' €' : '—'}
                              {m.bien_type && <span className="badge badge-neutral" style={{ marginLeft: 8 }}>{m.bien_type}</span>}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div className="match-score">{m.score}%</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>compatibilité</div>
                          </div>
                        </div>
                        <div className="score-bar" style={{ marginTop: 14 }}>
                          <div className="score-fill" style={{ width: `${m.score}%` }} />
                        </div>
                      </div>
                    ))
                  }
                </>
              )}
            </>
          )}

          {/* ── Email ── */}
          {activeTab === 'email' && (
            <>
              <div className="page-header">
                <h2 className="page-title">Envoi d'emails</h2>
                <p className="page-subtitle">Sélectionnez des destinataires et rédigez votre message</p>
              </div>
              <div className="two-col" style={{ alignItems: 'flex-start' }}>
                <div>
                  <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                      {selectedProspects.length > 0 ? `${selectedProspects.length} sélectionné${selectedProspects.length > 1 ? 's' : ''}` : 'Sélectionnez des destinataires'}
                    </span>
                    <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => {
                      const emails = acheteurs.filter(a => a.email).map(a => a.email);
                      setSelectedProspects(selectedProspects.length === emails.length ? [] : emails);
                    }}>
                      {selectedProspects.length === acheteurs.filter(a => a.email).length ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </button>
                  </div>
                  {acheteurs.length === 0
                    ? <div className="empty"><strong>Aucun acheteur</strong>Ajoutez d'abord des profils</div>
                    : acheteurs.filter(a => a.email).map((a, i) => {
                      const selected = selectedProspects.includes(a.email);
                      return (
                        <div key={i} className={`prospect-row ${selected ? 'selected' : ''}`} onClick={() => toggleProspect(a.email)}>
                          <div className={`prospect-check ${selected ? 'checked' : ''}`} />
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text)' }}>{a.nom} {a.prenom}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.email}</div>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
                <div className="card">
                  <div className="card-title" style={{ marginBottom: 20 }}>Composer l'email</div>
                  {emailStatus?.success && <div className="alert alert-success">{emailStatus.sent} email{emailStatus.sent > 1 ? 's' : ''} envoyé{emailStatus.sent > 1 ? 's' : ''}</div>}
                  {emailStatus?.error && <div className="alert alert-error">{emailStatus.error}</div>}
                  {selectedProspects.length === 0 && <div className="alert alert-warning">Sélectionnez au moins un destinataire</div>}
                  <form onSubmit={handleSendEmail}>
                    <div className="form-grid" style={{ marginBottom: 16 }}>
                      <div><label>Nom expéditeur</label><input type="text" value={emailForm.senderName} onChange={e => setEmailForm({ ...emailForm, senderName: e.target.value })} required /></div>
                      <div><label>Email expéditeur</label><input type="email" value={emailForm.senderEmail} onChange={e => setEmailForm({ ...emailForm, senderEmail: e.target.value })} required /></div>
                    </div>
                    <div className="form-group"><label>Sujet</label><input type="text" value={emailForm.subject} onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })} placeholder="Objet de votre message" required /></div>
                    <div className="form-group">
                      <label>Message</label>
                      <textarea value={emailForm.message} onChange={e => setEmailForm({ ...emailForm, message: e.target.value })} placeholder="Rédigez votre message ici…" rows={8} required />
                    </div>
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading || selectedProspects.length === 0}>
                      {loading ? <><span className="spinner" style={{ borderTopColor: '#0f0f11', borderColor: 'rgba(0,0,0,0.2)' }} /> Envoi…</> : `Envoyer à ${selectedProspects.length} destinataire${selectedProspects.length > 1 ? 's' : ''}`}
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}

          {/* ── Publication ── */}
          {activeTab === 'publication' && (
            can('publicationMultiSites')
              ? <PublicationDashboard />
              : <UpgradeGate planRequired="pro" plan={plan} featureLabel="Publication multi-sites & génération IA" />
          )}

        </main>
      </div>

      {/* Onboarding Agent */}
      {showOnboardingAgent && (
        <OnboardingAgent agentName={agent?.name || 'Agent'} onComplete={handleOnboardingAgentComplete} />
      )}

      {/* Onboarding Acheteur */}
      {showOnboardingAcheteur && (
        <OnboardingAcheteur onComplete={handleOnboardingAcheteurComplete} onClose={() => setShowOnboardingAcheteur(false)} />
      )}
    </>
  );
}
