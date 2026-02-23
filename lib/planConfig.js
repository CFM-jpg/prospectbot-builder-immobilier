// lib/planConfig.js
// Source unique de vérité pour les features par plan

export const PLANS = {
  gratuit: {
    label: 'Gratuit',
    features: {
      scraping: true,
      scrapingLimit: 50,          // annonces/jour
      acheteurs: true,
      acheteursLimit: 5,
      alertesEmail: true,
      matchAuto: false,
      publicationMultiSites: false,
      generationIA: false,
      crm: false,
      stats: false,
      b2b: false,
    },
  },
  pro: {
    label: 'Pro',
    features: {
      scraping: true,
      scrapingLimit: Infinity,
      acheteurs: true,
      acheteursLimit: Infinity,
      alertesEmail: true,
      matchAuto: true,
      publicationMultiSites: true,
      generationIA: true,
      crm: true,
      stats: false,
      b2b: false,
    },
  },
  agence: {
    label: 'Agence',
    features: {
      scraping: true,
      scrapingLimit: Infinity,
      acheteurs: true,
      acheteursLimit: Infinity,
      alertesEmail: true,
      matchAuto: true,
      publicationMultiSites: true,
      generationIA: true,
      crm: true,
      stats: true,
      b2b: true,
    },
  },
};

// Retourne les features d'un plan (admin = agence)
export function getPlanFeatures(plan, role) {
  if (role === 'admin') return PLANS.agence.features;
  return PLANS[plan]?.features || PLANS.gratuit.features;
}

// Vérifie si une feature est accessible
export function canAccess(feature, plan, role) {
  const features = getPlanFeatures(plan, role);
  return !!features[feature];
}
