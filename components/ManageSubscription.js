// components/ManageSubscription.js
import { useState } from 'react';

const PLAN_CONFIG = {
  gratuit: { label: 'Gratuit', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.25)' },
  pro:     { label: 'Pro',     color: '#d4a853', bg: 'rgba(212,168,83,0.1)',  border: 'rgba(212,168,83,0.3)'  },
  agence:  { label: 'Agence',  color: '#e8c96a', bg: 'rgba(232,201,106,0.1)', border: 'rgba(232,201,106,0.3)' },
};

export default function ManageSubscription({ plan }) {
  const [loading, setLoading] = useState(false);
  const cfg = PLAN_CONFIG[plan] || PLAN_CONFIG.gratuit;

  const handleManage = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || 'Erreur. Réessaie.');
    } catch { alert('Erreur réseau.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '5px 10px', borderRadius: '6px', alignSelf: 'flex-start',
        background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
        fontSize: '11px', fontWeight: '600', fontFamily: '"DM Sans", sans-serif',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
        Plan {cfg.label}
      </div>

      {plan === 'gratuit' ? (
        <a href="/register" style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '9px 14px', background: 'linear-gradient(135deg, #8b6914, #d4a853)',
          color: '#0a0a0a', borderRadius: '8px', fontSize: '12px', fontWeight: '700',
          textDecoration: 'none', fontFamily: '"DM Sans", sans-serif',
        }}>
          ⚡ Passer Pro — 59€/mois
        </a>
      ) : (
        <button onClick={handleManage} disabled={loading} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          padding: '9px 14px', background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
          borderRadius: '8px', fontSize: '12px', fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer', fontFamily: '"DM Sans", sans-serif', width: '100%',
        }}>
          {loading ? '...' : '⚙ Gérer mon abonnement'}
        </button>
      )}
    </div>
  );
}
