// pages/api/immobilier/inscription-acheteur.js
// Route publique — pas de session requise
// L'agent_email est passé dans le body (lien public personnalisé par agent)

import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  try {
    const acheteurData = req.body;

    if (!acheteurData.nom || !acheteurData.email) {
      return res.status(400).json({ success: false, error: 'Le nom et l\'email sont obligatoires' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(acheteurData.email)) {
      return res.status(400).json({ success: false, error: 'Format d\'email invalide' });
    }

    // agent_email obligatoire pour rattacher l'acheteur
    if (!acheteurData.agent_email) {
      return res.status(400).json({ success: false, error: 'agent_email requis' });
    }

    const { data: existant } = await supabaseAdmin
      .from('acheteurs').select('id, nom, email')
      .eq('email', acheteurData.email).eq('agent_email', acheteurData.agent_email).single();
    if (existant) return res.status(409).json({ success: false, error: 'Un acheteur avec cet email est déjà inscrit', acheteur: existant });

    const nouvelAcheteur = {
      nom: acheteurData.nom, prenom: acheteurData.prenom || '',
      email: acheteurData.email, telephone: acheteurData.telephone || '',
      type_bien: acheteurData.type_bien || acheteurData.typeBien || [],
      budget_min: acheteurData.budget_min || acheteurData.budgetMin || 0,
      budget_max: acheteurData.budget_max || acheteurData.budgetMax || 0,
      surface_min: acheteurData.surface_min || acheteurData.surfaceMin || null,
      surface_max: acheteurData.surface_max || acheteurData.surfaceMax || null,
      pieces_min: acheteurData.pieces_min || acheteurData.piecesMin || null,
      pieces_max: acheteurData.pieces_max || acheteurData.piecesMax || null,
      chambres_min: acheteurData.chambres_min || acheteurData.chambresMin || null,
      villes: acheteurData.villes || [], departements: acheteurData.departements || [],
      avec_jardin: acheteurData.avec_jardin || false, avec_parking: acheteurData.avec_parking || false,
      avec_balcon: acheteurData.avec_balcon || false, avec_terrasse: acheteurData.avec_terrasse || false,
      notes: acheteurData.notes || '', statut: 'actif', source: acheteurData.source || 'inscription',
      agent_email: acheteurData.agent_email, created_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin.from('acheteurs').insert([nouvelAcheteur]).select().single();
    if (error) throw error;

    return res.status(201).json({ success: true, message: 'Inscription réussie', data });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Erreur lors de l\'inscription', details: error.message });
  }
}
