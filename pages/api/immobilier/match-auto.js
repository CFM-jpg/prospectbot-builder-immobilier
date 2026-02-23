// pages/api/immobilier/match-auto.js

import { supabaseAdmin } from '../../../lib/supabase';
import { getSession } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Non authentifié' });
  const agentEmail = session.email;

  try {
    // Acheteurs actifs de cet agent
    const { data: acheteurs, error: errorAcheteurs } = await supabaseAdmin
      .from('acheteurs').select('*').eq('statut', 'actif').eq('agent_email', agentEmail);
    if (errorAcheteurs) throw errorAcheteurs;

    // Biens disponibles de cet agent
    const { data: biens, error: errorBiens } = await supabaseAdmin
      .from('biens').select('*').eq('statut', 'disponible').eq('agent_email', agentEmail);
    if (errorBiens) throw errorBiens;

    let nouveauxMatchs = 0;
    const matchsCreated = [];

    for (const acheteur of acheteurs || []) {
      for (const bien of biens || []) {
        const { data: matchExistant } = await supabaseAdmin
          .from('matches').select('id').eq('acheteur_id', acheteur.id).eq('bien_id', bien.id).single();
        if (matchExistant) continue;

        const score = calculerScore(acheteur, bien);
        if (score >= 60) {
          const { data, error } = await supabaseAdmin
            .from('matches')
            .insert([{
              acheteur_id: acheteur.id, bien_id: bien.id, score,
              statut: 'nouveau', agent_email: agentEmail,
              acheteur_nom: acheteur.nom, acheteur_email: acheteur.email,
              bien_reference: bien.reference, bien_adresse: bien.adresse,
              bien_prix: bien.prix, bien_type: bien.type,
              email_envoye: false, created_at: new Date().toISOString()
            }])
            .select().single();
          if (!error && data) { nouveauxMatchs++; matchsCreated.push(data); }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Matching terminé',
      stats: { acheteursAnalyses: acheteurs?.length || 0, biensAnalyses: biens?.length || 0, nouveauxMatchs },
      matchs: matchsCreated
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Erreur matching automatique', details: error.message });
  }
}

function calculerScore(acheteur, bien) {
  let score = 0;
  if (bien.prix <= acheteur.budget_max) score += 30;
  else if (bien.prix <= acheteur.budget_max * 1.1) score += 15;
  if (acheteur.type_bien) {
    const types = Array.isArray(acheteur.type_bien) ? acheteur.type_bien : [acheteur.type_bien];
    if (types.includes(bien.type)) score += 20;
  } else score += 20;
  if (acheteur.villes) {
    const villes = Array.isArray(acheteur.villes) ? acheteur.villes : [acheteur.villes];
    if (villes.some(v => bien.ville?.toLowerCase().includes(v.toLowerCase()) || v.toLowerCase().includes(bien.ville?.toLowerCase()))) score += 20;
  } else score += 20;
  if (acheteur.surface_min && acheteur.surface_max) {
    if (bien.surface >= acheteur.surface_min && bien.surface <= acheteur.surface_max) score += 15;
    else if (bien.surface >= acheteur.surface_min * 0.9) score += 7;
  } else score += 15;
  if (acheteur.pieces_min) {
    if (bien.pieces >= acheteur.pieces_min) score += 15;
    else if (bien.pieces >= acheteur.pieces_min - 1) score += 7;
  } else score += 15;
  return Math.round(score);
}
