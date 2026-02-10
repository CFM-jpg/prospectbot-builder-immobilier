import { createClient } from '@supabase/supabase-js';

/**
 * API : Inscription d'un acheteur immobilier
 * POST /api/immobilier/inscription-acheteur
 * 
 * Body attendu :
 * {
 *   nom: string,
 *   email: string,
 *   telephone: string,
 *   budget_min: number,
 *   budget_max: number,
 *   ville_recherchee: string,
 *   type_bien: string (appartement, maison, terrain),
 *   surface_min: number,
 *   nb_pieces_min: number
 * }
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const {
      nom,
      email,
      telephone,
      budget_min,
      budget_max,
      ville_recherchee,
      type_bien,
      surface_min,
      nb_pieces_min
    } = req.body;

    // Validation des champs requis
    if (!nom || !email || !telephone || !budget_max || !ville_recherchee || !type_bien) {
      return res.status(400).json({
        success: false,
        error: 'Champs requis manquants',
        champsRequis: ['nom', 'email', 'telephone', 'budget_max', 'ville_recherchee', 'type_bien']
      });
    }

    // Vérifier si l'acheteur existe déjà (par email)
    const { data: existant } = await supabase
      .from('acheteurs_immobilier')
      .select('id, nom')
      .eq('email', email)
      .single();

    if (existant) {
      return res.status(409).json({
        success: false,
        error: 'Un acheteur avec cet email existe déjà',
        acheteur: existant
      });
    }

    // Créer le nouvel acheteur
    const { data: nouvelAcheteur, error: insertError } = await supabase
      .from('acheteurs_immobilier')
      .insert({
        nom,
        email,
        telephone,
        budget_min: budget_min || null,
        budget_max,
        ville_recherchee,
        type_bien,
        surface_min: surface_min || null,
        nb_pieces_min: nb_pieces_min || null
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Optionnel : Lancer un matching automatique pour cet acheteur
    const { data: biens } = await supabase
      .from('biens_immobiliers')
      .select('*')
      .eq('statut', 'disponible')
      .eq('ville', ville_recherchee)
      .eq('type', type_bien)
      .lte('prix', budget_max);

    let matchsCrees = 0;

    if (biens && biens.length > 0) {
      for (const bien of biens) {
        // Calculer le score de compatibilité
        let score = 0;

        // Prix
        if (bien.prix <= budget_max) {
          const ratio = bien.prix / budget_max;
          score += Math.round(40 * (1 - Math.abs(ratio - 0.9)));
        }

        // Ville
        if (bien.ville?.toLowerCase() === ville_recherchee?.toLowerCase()) {
          score += 30;
        }

        // Type
        if (bien.type?.toLowerCase() === type_bien?.toLowerCase()) {
          score += 20;
        }

        // Surface
        if (surface_min && bien.surface >= surface_min) {
          score += 10;
        }

        // Créer le match si score >= 50%
        if (score >= 50) {
          const { error: matchError } = await supabase
            .from('matches_immobilier')
            .insert({
              acheteur_id: nouvelAcheteur.id,
              bien_id: bien.id,
              acheteur_nom: nom,
              acheteur_email: email,
              acheteur_telephone: telephone,
              bien_titre: bien.titre,
              bien_prix: bien.prix,
              bien_surface: bien.surface,
              bien_ville: bien.ville,
              bien_type: bien.type,
              score_compatibilite: score,
              statut: 'nouveau'
            });

          if (!matchError) {
            matchsCrees++;
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Acheteur inscrit avec succès',
      acheteur: nouvelAcheteur,
      matchsCrees,
      biensDisponibles: biens?.length || 0
    });

  } catch (error) {
    console.error('Erreur inscription acheteur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
}
