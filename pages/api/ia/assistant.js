// pages/api/ia/assistant.js
// IA unifiée NestLead — Claude comme cerveau central
// Actions : chat | score_lead | suggestions_biens | rediger_annonce

import { getSession } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';

const CLAUDE_MODEL = 'claude-sonnet-4-6';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

async function callClaude(systemPrompt, userPrompt, maxTokens = 1024) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY non configurée');

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Claude API ${res.status}: ${err.error?.message || 'Erreur inconnue'}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Non authentifié' });
  const agentEmail = session.email;

  const { action, ...payload } = req.body;

  try {
    switch (action) {
      case 'chat':
        return await handleChat(req, res, agentEmail, payload);
      case 'score_lead':
        return await handleScoreLead(req, res, agentEmail, payload);
      case 'suggestions_biens':
        return await handleSuggestions(req, res, agentEmail, payload);
      case 'rediger_annonce':
        return await handleRedigerAnnonce(req, res, agentEmail, payload);
      default:
        return res.status(400).json({ error: `Action inconnue : ${action}` });
    }
  } catch (err) {
    console.error('Erreur IA:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ─── 1. CHATBOT AVEC CONTEXTE RÉEL ──────────────────────────────────────────
// Le chatbot connaît les vrais biens, acheteurs et matches de l'agent

async function handleChat(req, res, agentEmail, { message, history = [], chatbot_id }) {
  if (!message) return res.status(400).json({ error: 'message requis' });

  // Récupérer le contexte réel de l'agent
  const [biensRes, acheteursRes, matchesRes] = await Promise.all([
    supabaseAdmin.from('biens').select('reference, type, ville, prix, surface, pieces, statut').eq('agent_email', agentEmail).eq('statut', 'disponible').limit(20),
    supabaseAdmin.from('acheteurs').select('nom, budget_max, villes, type_bien, statut').eq('agent_email', agentEmail).eq('statut', 'actif').limit(20),
    supabaseAdmin.from('matches').select('score, acheteur_nom, bien_reference, bien_prix').eq('agent_email', agentEmail).order('score', { ascending: false }).limit(10),
  ]);

  const biens = biensRes.data || [];
  const acheteurs = acheteursRes.data || [];
  const matches = matchesRes.data || [];

  // Si chatbot_id → récupérer le config du chatbot
  let chatbotConfig = null;
  if (chatbot_id) {
    const { data } = await supabaseAdmin.from('chatbots').select('*').eq('id', chatbot_id).single();
    chatbotConfig = data;
  }

  const systemPrompt = chatbotConfig
    ? `Tu es ${chatbotConfig.name || 'un assistant immobilier'}. ${chatbotConfig.welcome_message || ''}
Message d'accueil : ${chatbotConfig.welcome_message}
Tu représentes l'agence et tu dois qualifier les prospects, répondre à leurs questions et les orienter vers un rendez-vous.
Sois professionnel, chaleureux et concis. Réponds toujours en français.`
    : `Tu es l'assistant IA de NestLead, un outil de gestion immobilière.
Tu as accès aux données réelles de l'agent :

BIENS DISPONIBLES (${biens.length}) :
${biens.map(b => `- ${b.reference} | ${b.type} | ${b.ville} | ${b.prix?.toLocaleString('fr-FR')}€ | ${b.surface}m² | ${b.pieces}p`).join('\n') || 'Aucun bien disponible'}

ACHETEURS ACTIFS (${acheteurs.length}) :
${acheteurs.map(a => `- ${a.nom} | budget max ${a.budget_max?.toLocaleString('fr-FR')}€ | villes: ${Array.isArray(a.villes) ? a.villes.join(', ') : a.villes}`).join('\n') || 'Aucun acheteur actif'}

TOP MATCHES :
${matches.map(m => `- ${m.acheteur_nom} ↔ ${m.bien_reference} | score ${m.score}%`).join('\n') || 'Aucun match'}

Réponds en français, de façon concise et utile. Tu peux donner des conseils sur le matching, les biens, les acheteurs.`;

  // Construire l'historique de conversation
  const messages = [
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ];

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY non configurée' });

  const claudeRes = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      system: systemPrompt,
      messages,
    }),
  });

  if (!claudeRes.ok) throw new Error(`Claude API ${claudeRes.status}`);
  const data = await claudeRes.json();
  const reply = data.content?.[0]?.text || 'Désolé, je ne peux pas répondre en ce moment.';

  // Sauvegarder la conversation si c'est un chatbot public
  if (chatbot_id) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const detectedEmail = message.match(emailRegex)?.[0] || null;

    await supabaseAdmin.from('chatbot_conversations').insert([{
      agent_email: agentEmail,
      chatbot_id,
      visitor_email: detectedEmail,
      messages: [
        ...history,
        { role: 'user', content: message, timestamp: new Date().toISOString() },
        { role: 'assistant', content: reply, timestamp: new Date().toISOString() },
      ],
      qualified: !!detectedEmail,
      created_at: new Date().toISOString(),
    }]).catch(() => {});
  }

  return res.status(200).json({ success: true, reply });
}

// ─── 2. SCORING IA DES LEADS ─────────────────────────────────────────────────
// Analyse un prospect (chatbot ou B2B) et retourne un score + recommandations

async function handleScoreLead(req, res, agentEmail, { prospect }) {
  if (!prospect) return res.status(400).json({ error: 'prospect requis' });

  const systemPrompt = `Tu es un expert en qualification de leads immobiliers. 
Analyse le prospect et réponds UNIQUEMENT en JSON valide sans markdown ni backticks.`;

  const userPrompt = `Analyse ce prospect immobilier et donne un score de qualification :

Données prospect :
${JSON.stringify(prospect, null, 2)}

Réponds UNIQUEMENT avec ce JSON :
{
  "score": <nombre 0-100>,
  "niveau": "<froid|tiède|chaud|très_chaud>",
  "resume": "<résumé en 1 phrase>",
  "points_forts": ["<point 1>", "<point 2>"],
  "points_faibles": ["<point 1>"],
  "prochaine_action": "<action recommandée>",
  "urgence": "<faible|moyenne|haute>"
}`;

  const text = await callClaude(systemPrompt, userPrompt, 512);

  let scoring;
  try {
    scoring = JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return res.status(500).json({ error: 'Réponse IA invalide', raw: text });
  }

  // Sauvegarder le score si prospect a un id
  if (prospect.id) {
    await supabaseAdmin.from('prospects').update({
      ia_score: scoring.score,
      ia_niveau: scoring.niveau,
      ia_resume: scoring.resume,
      ia_scored_at: new Date().toISOString(),
    }).eq('id', prospect.id).catch(() => {});
  }

  return res.status(200).json({ success: true, scoring });
}

// ─── 3. SUGGESTIONS DE BIENS POUR UN ACHETEUR ────────────────────────────────
// Claude analyse un acheteur et suggère les meilleurs biens + explique pourquoi

async function handleSuggestions(req, res, agentEmail, { acheteur_id }) {
  if (!acheteur_id) return res.status(400).json({ error: 'acheteur_id requis' });

  // Récupérer l'acheteur
  const { data: acheteur, error: errA } = await supabaseAdmin
    .from('acheteurs').select('*').eq('id', acheteur_id).eq('agent_email', agentEmail).single();
  if (errA || !acheteur) return res.status(404).json({ error: 'Acheteur introuvable' });

  // Récupérer les biens disponibles
  const { data: biens } = await supabaseAdmin
    .from('biens').select('*').eq('agent_email', agentEmail).eq('statut', 'disponible').limit(50);

  if (!biens?.length) {
    return res.status(200).json({ success: true, suggestions: [], message: 'Aucun bien disponible' });
  }

  const systemPrompt = `Tu es un expert immobilier. Analyse les critères d'un acheteur et suggère les meilleurs biens.
Réponds UNIQUEMENT en JSON valide sans markdown.`;

  const userPrompt = `Acheteur :
- Budget max : ${acheteur.budget_max?.toLocaleString('fr-FR')}€
- Type souhaité : ${Array.isArray(acheteur.type_bien) ? acheteur.type_bien.join(', ') : acheteur.type_bien}
- Villes : ${Array.isArray(acheteur.villes) ? acheteur.villes.join(', ') : acheteur.villes}
- Surface min : ${acheteur.surface_min || 'non précisé'}m²
- Pièces min : ${acheteur.pieces_min || 'non précisé'}
- Notes : ${acheteur.notes || 'aucune'}

Biens disponibles :
${biens.map(b => `ID:${b.id} | ${b.type} | ${b.ville} | ${b.prix?.toLocaleString('fr-FR')}€ | ${b.surface}m² | ${b.pieces}p | ref:${b.reference}`).join('\n')}

Sélectionne les 5 meilleurs biens et explique pourquoi. JSON :
{
  "suggestions": [
    {
      "bien_id": "<uuid>",
      "bien_reference": "<ref>",
      "score_ia": <0-100>,
      "compatibilite": "<excellente|bonne|correcte>",
      "points_positifs": ["<point>"],
      "points_negatifs": ["<point>"],
      "message_acheteur": "<message personnalisé à envoyer à l'acheteur>"
    }
  ],
  "conseil_agent": "<conseil pour l'agent>"
}`;

  const text = await callClaude(systemPrompt, userPrompt, 1024);

  let result;
  try {
    result = JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return res.status(500).json({ error: 'Réponse IA invalide', raw: text });
  }

  return res.status(200).json({ success: true, ...result, acheteur_nom: acheteur.nom });
}

// ─── 4. RÉDACTION D'ANNONCE AMÉLIORÉE ────────────────────────────────────────
// Version améliorée de publier.js — prompt plus riche, meilleures annonces

async function handleRedigerAnnonce(req, res, agentEmail, { bien }) {
  if (!bien) return res.status(400).json({ error: 'bien requis' });

  const systemPrompt = `Tu es un expert en marketing immobilier et copywriting. 
Tu rédiges des annonces immobilières qui convertissent. Ton style est professionnel, accrocheur et authentique.
Réponds UNIQUEMENT en JSON valide sans markdown ni backticks.`;

  const userPrompt = `Rédige une annonce immobilière professionnelle et attractive pour ce bien.

DONNÉES DU BIEN :
- Type : ${bien.type} | Transaction : ${bien.transaction || 'vente'}
- Surface : ${bien.surface}m² | ${bien.pieces} pièces | ${bien.chambres || '?'} chambres
- Prix : ${bien.prix?.toLocaleString('fr-FR')}€${bien.transaction === 'location' ? '/mois' : ''}
- Ville : ${bien.ville}${bien.code_postal ? ` (${bien.code_postal})` : ''}
- DPE : ${bien.dpe || 'NC'} | GES : ${bien.ges || 'NC'}
- Étage : ${bien.etage || 'RDC'} | Ascenseur : ${bien.ascenseur ? 'Oui' : 'Non'}
- Équipements : ${[
    bien.balcon && 'balcon',
    bien.terrasse && 'terrasse',
    bien.jardin && 'jardin',
    bien.parking && 'parking',
    bien.cave && 'cave',
  ].filter(Boolean).join(', ') || 'standard'}
- Description libre : ${bien.description || ''}

CONSIGNES :
- Titre : accrocheur, max 80 caractères, met en avant le point fort principal
- Description : 400-600 mots, professionnelle, vendeuse, mentionne le quartier si possible
- Points forts : 4 éléments concis
- Description courte : max 150 caractères pour LeBonCoin
- Hashtags : 5 mots-clés SEO pour les portails

JSON :
{
  "titre": "<titre>",
  "description": "<description complète>",
  "pointsForts": ["<point 1>", "<point 2>", "<point 3>", "<point 4>"],
  "descriptionCourte": "<version courte>",
  "hashtags": ["<mot-clé 1>", "<mot-clé 2>", "<mot-clé 3>", "<mot-clé 4>", "<mot-clé 5>"],
  "accroche_email": "<accroche pour l'email aux acheteurs, 2 phrases max>"
}`;

  const text = await callClaude(systemPrompt, userPrompt, 1500);

  let annonce;
  try {
    annonce = JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return res.status(500).json({ error: 'Réponse IA invalide', raw: text });
  }

  return res.status(200).json({ success: true, annonce });
}
