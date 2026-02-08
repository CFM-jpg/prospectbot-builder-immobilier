/**
 * API : Inscription d'un acheteur immobilier
 * POST /api/immobilier/inscription-acheteur
 */

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    nom,
    prenom,
    email,
    telephone,
    type_bien,
    budget_min,
    budget_max,
    villes,
    pieces_min,
    consent
  } = req.body;

  // Validation
  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email requis'
    });
  }

  if (!budget_max) {
    return res.status(400).json({
      success: false,
      error: 'Budget maximum requis'
    });
  }

  if (!consent) {
    return res.status(400).json({
      success: false,
      error: 'Le consentement RGPD est obligatoire'
    });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Vérifier si l'email existe déjà
    const { data: existing } = await supabase
      .from('acheteurs')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Cet email est déjà inscrit'
      });
    }

    // Insérer l'acheteur
    const { data, error } = await supabase
      .from('acheteurs')
      .insert({
        nom,
        prenom,
        email,
        telephone,
        type_bien: type_bien || 'Appartement',
        budget_min: budget_min ? parseInt(budget_min) : null,
        budget_max: parseInt(budget_max),
        villes: Array.isArray(villes) ? villes : [villes],
        pieces_min: pieces_min ? parseInt(pieces_min) : null,
        statut: 'actif',
        source: 'landing_page',
        consent_date: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur insertion acheteur:', error);
      throw error;
    }

    console.log(`✅ Nouvel acheteur inscrit : ${email}`);

    // TODO: Envoyer email de confirmation via Brevo
    // await sendConfirmationEmail(email, prenom);

    return res.status(200).json({
      success: true,
      message: 'Inscription réussie ! Vous recevrez des alertes par email.',
      acheteur: {
        id: data.id,
        email: data.email,
        criteres: {
          type_bien: data.type_bien,
          budget: `${data.budget_min || 0} - ${data.budget_max}€`,
          villes: data.villes
        }
      }
    });

  } catch (error) {
    console.error('Erreur inscription acheteur:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
