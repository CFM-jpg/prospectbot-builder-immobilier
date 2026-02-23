// components/FeatureGate.js
// Entoure une feature et bloque si le plan ne suffit pas

import { canAccess, PLANS } from '../lib/planConfig';

// planRequired : le plan minimum requis pour cette feature
// feature : clé dans planConfig
// agent : objet agent du useAuth
export default function FeatureGate({ feature, agent, planRequired = 'pro', children }) {
  const plan = agent?.plan || 'gratuit';
  const role = agent?.role;

  if (canAccess(feature, plan, role)) {
    return <>{children}</>;
  }

  const requiredLabel = PLANS[planRequired]?.label || planRequired;

  return (
    <div style={{
      position: 'relative',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      {/* Contenu flouté */}
      <div style={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.5 }}>
        {children}
      </div>

      {/* Overlay upgrade */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(10, 10, 10, 0.75)',
        backdropFilter: 'blur(2px)',
        borderRadius: '12px',
        gap: '12px',
        padding: '24px',
        textAlign: 'center',
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="1.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <p style={{ color: '#f5f0e8', fontFamily: 'var(--font-body, serif)', fontSize: '15px', margin: 0 }}>
          Fonctionnalité réservée au plan <strong style={{ color: '#c9a96e' }}>{requiredLabel}</strong>
        </p>
        <a
          href="/#tarifs"
          style={{
            display: 'inline-block',
            padding: '8px 20px',
            background: 'linear-gradient(135deg, #c9a96e, #a07840)',
            color: '#fff',
            borderRadius: '6px',
            fontSize: '13px',
            fontFamily: 'var(--font-body, serif)',
            letterSpacing: '0.05em',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Voir les offres
        </a>
      </div>
    </div>
  );
}
