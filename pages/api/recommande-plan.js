// pages/api/recommande-plan.js
// Analyse les réponses du questionnaire et recommande le meilleur plan
// Pas besoin d'être connecté — route publique

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { reponses } = req.body;
  if (!reponses || typeof reponses !== 'object') {
    return res.status(400).json({ error: 'reponses requis' });
  }

  // Algorithme de scoring basé sur les réponses
  // Chaque réponse contribue à un score Pro/Agence
  let scoreAgence = 0;
  let scorePro = 0;

  const {
    profil,        // 'agent_solo' | 'equipe' | 'agence' | 'promoteur'
    biens_mois,    // 'moins_5' | '5_20' | 'plus_20'
    acheteurs,     // 'moins_10' | '10_50' | 'plus_50'
    besoins,       // array: ['scraping', 'publication', 'ia', 'stats', 'b2b', 'emails']
    budget,        // 'gratuit' | 'flexible' | 'professionnel'
    objectif,      // 'decouverte' | 'optimiser' | 'scaler'
  } = reponses;

  // === Profil ===
  if (profil === 'agence' || profil === 'promoteur') scoreAgence += 30;
  else if (profil === 'equipe') { scorePro += 20; scoreAgence += 10; }
  else if (profil === 'agent_solo') scorePro += 10;

  // === Volume de biens ===
  if (biens_mois === 'plus_20') { scoreAgence += 25; scorePro += 10; }
  else if (biens_mois === '5_20') { scorePro += 20; scoreAgence += 5; }
  else if (biens_mois === 'moins_5') scorePro += 5;

  // === Acheteurs ===
  if (acheteurs === 'plus_50') { scoreAgence += 25; scorePro += 10; }
  else if (acheteurs === '10_50') { scorePro += 20; scoreAgence += 5; }
  else if (acheteurs === 'moins_10') scorePro += 5;

  // === Besoins ===
  const besoinsArr = Array.isArray(besoins) ? besoins : [];
  if (besoinsArr.includes('b2b')) scoreAgence += 20;
  if (besoinsArr.includes('stats')) scoreAgence += 15;
  if (besoinsArr.includes('ia')) { scorePro += 15; scoreAgence += 5; }
  if (besoinsArr.includes('publication')) { scorePro += 10; scoreAgence += 3; }
  if (besoinsArr.includes('scraping')) { scorePro += 10; scoreAgence += 3; }
  if (besoinsArr.includes('emails')) { scorePro += 8; scoreAgence += 2; }

  // === Budget ===
  if (budget === 'professionnel') { scoreAgence += 15; scorePro += 5; }
  else if (budget === 'flexible') scorePro += 10;
  else if (budget === 'gratuit') { scorePro -= 5; scoreAgence -= 10; }

  // === Objectif ===
  if (objectif === 'scaler') { scoreAgence += 20; scorePro += 5; }
  else if (objectif === 'optimiser') { scorePro += 15; scoreAgence += 5; }
  else if (objectif === 'decouverte') scorePro += 5;

  // === Décision finale ===
  let planRecommande;
  let confidence;

  if (scoreAgence >= 60) {
    planRecommande = 'agence';
    confidence = Math.min(95, 60 + scoreAgence - scorePro);
  } else if (scorePro >= 35 || scoreAgence >= 30) {
    planRecommande = 'pro';
    confidence = Math.min(90, 50 + scorePro - 10);
  } else {
    planRecommande = 'gratuit';
    confidence = 80;
  }

  // === Contenu personnalisé selon le plan ===
  const plans = {
    gratuit: {
      nom: 'Gratuit',
      prix: '0€/mois',
      couleur: '#4ade80',
      description: 'Parfait pour découvrir ProspectBot sans engagement.',
      pourquoi: genererPourquoi('gratuit', reponses),
      features: [
        '5 acheteurs maximum',
        'Scraping limité à 50 annonces/jour',
        'Alertes email automatiques',
        'Interface complète',
      ],
      limites: [
        'Pas de matching automatique',
        'Pas de génération IA',
        'Pas de publication multi-sites',
      ],
      cta: 'Commencer gratuitement',
      url: '/register?plan=gratuit',
    },
    pro: {
      nom: 'Pro',
      prix: '59€/mois',
      couleur: '#c9a96e',
      description: 'La solution complète pour l\'agent immobilier actif.',
      pourquoi: genererPourquoi('pro', reponses),
      features: [
        'Acheteurs illimités',
        'Scraping illimité',
        'Matching automatique IA',
        'Publication multi-sites (LeBonCoin, SeLoger...)',
        'Génération d\'annonces par IA',
        'CRM intégré',
        'Chatbot qualificateur',
        'Alertes email automatiques',
      ],
      limites: [
        'Stats avancées non incluses',
        'Outils B2B non inclus',
      ],
      cta: 'Démarrer avec Pro',
      url: '/register?plan=pro',
      badge: 'Recommandé',
    },
    agence: {
      nom: 'Agence',
      prix: '169€/mois',
      couleur: '#a78bfa',
      description: 'La puissance maximale pour les agences et équipes.',
      pourquoi: genererPourquoi('agence', reponses),
      features: [
        'Tout du plan Pro',
        'Statistiques avancées',
        'Outils de prospection B2B',
        'Plusieurs agents/collaborateurs',
        'Tableau de bord agence',
        'Support prioritaire',
        'API complète',
      ],
      limites: [],
      cta: 'Découvrir Agence',
      url: '/register?plan=agence',
    },
  };

  const planInfo = plans[planRecommande];
  const alternatives = Object.entries(plans)
    .filter(([key]) => key !== planRecommande)
    .map(([key, val]) => ({ id: key, nom: val.nom, prix: val.prix, url: val.url }));

  return res.status(200).json({
    success: true,
    recommandation: {
      plan: planRecommande,
      confidence: Math.round(confidence),
      ...planInfo,
    },
    alternatives,
    scores: { scoreAgence, scorePro },
  });
}

function genererPourquoi(plan, reponses) {
  const { profil, biens_mois, acheteurs, besoins = [], objectif } = reponses;

  if (plan === 'gratuit') {
    if (objectif === 'decouverte') return 'Vous débutez votre exploration — commencez sans risque et upgradez quand vous êtes prêt.';
    return 'Votre volume actuel correspond parfaitement au plan gratuit. Vous pourrez évoluer facilement.';
  }

  if (plan === 'pro') {
    const raisons = [];
    if (biens_mois === '5_20') raisons.push('votre volume de biens');
    if (acheteurs === '10_50') raisons.push('votre portefeuille acheteurs');
    if (besoins.includes('ia')) raisons.push('votre besoin en génération IA');
    if (besoins.includes('publication')) raisons.push('la publication multi-plateformes');
    if (profil === 'agent_solo' || profil === 'equipe') raisons.push('votre profil d\'agent actif');

    if (raisons.length === 0) return 'Le plan Pro couvre l\'ensemble de vos besoins avec toutes les fonctionnalités essentielles.';
    return `Le plan Pro est idéal pour ${raisons.slice(0, 2).join(' et ')}.`;
  }

  if (plan === 'agence') {
    const raisons = [];
    if (profil === 'agence' || profil === 'promoteur') raisons.push('votre structure d\'agence');
    if (acheteurs === 'plus_50') raisons.push('votre large portefeuille d\'acheteurs');
    if (biens_mois === 'plus_20') raisons.push('votre fort volume de biens');
    if (besoins.includes('stats')) raisons.push('votre besoin en statistiques avancées');
    if (besoins.includes('b2b')) raisons.push('vos besoins B2B');

    if (raisons.length === 0) return 'Le plan Agence vous offre toute la puissance nécessaire pour votre activité.';
    return `Le plan Agence est parfaitement adapté à ${raisons.slice(0, 2).join(' et ')}.`;
  }
}
