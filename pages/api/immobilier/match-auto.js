// pages/api/immobilier/match-auto.js
// API Matching Automatique - Version Supabase

import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // 1. Récupérer tous les acheteurs actifs
    const { data: acheteurs, error: errorAcheteurs } = await supabaseAdmin
      .from('acheteurs')
      .select('*')
      .eq('statut', 'actif');

    if (errorAcheteurs) throw errorAcheteurs;

    // 2. Récupérer tous les biens disponibles
    const { data: biens, error: errorBiens } = await supabaseAdmin
      .from('biens')
      .select('*')
      .eq('statut', 'disponible');

    if (errorBiens) throw errorBiens;

    let nouveauxMatchs = 0;
    const matchsCreated = [];

    // 3. Pour chaque acheteur, chercher les matchs
    for (const acheteur of acheteurs || []) {
      for (const bien of biens || []) {
        // Vérifier si le match existe déjà
        const { data: matchExistant } = await supabaseAdmin
          .from('matches')
          .select('id')
          .eq('acheteur_id', acheteur.id)
          .eq('bien_id', bien.id)
          .single();

        if (matchExistant) continue;

        // Calculer le score de matching
        const score = calculerScore(acheteur, bien);

        // Si le score est suffisant (>= 60%), créer le match
        if (score >= 60) {
          const nouveauMatch = {
            acheteur_id: acheteur.id,
            bien_id: bien.id,
            score: score,
            statut: 'nouveau',
            acheteur_nom: acheteur.nom,
            acheteur_email: acheteur.email,
            bien_reference: bien.reference,
            bien_adresse: bien.adresse,
            bien_prix: bien.prix,
            bien_type: bien.type,
            email_envoye: false,
            created_at: new Date().toISOString()
          };

          const { data, error } = await supabaseAdmin
            .from('matches')
            .insert([nouveauMatch])
            .select()
            .single();

          if (!error && data) {
            nouveauxMatchs++;
            matchsCreated.push(data);
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `Matching terminé`,
      stats: {
        acheteursAnalyses: acheteurs?.length || 0,
        biensAnalyses: biens?.length || 0,
        nouveauxMatchs: nouveauxMatchs
      },
      matchs: matchsCreated
    });

  } catch (error) {
    console.error('Erreur matching automatique:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du matching automatique',
      details: error.message
    });
  }
}

// Fonction de calcul du score de matching
function calculerScore(acheteur, bien) {
  let score = 0;

  // 1. Budget (30%)
  if (bien.prix <= acheteur.budget_max) {
    score += 30;
  } else if (bien.prix <= acheteur.budget_max * 1.1) {
    score += 15; // Dépassement léger acceptable
  }

  // 2. Type de bien (20%)
  if (acheteur.type_bien) {
    const typesSouhaites = Array.isArray(acheteur.type_bien) 
      ? acheteur.type_bien 
      : [acheteur.type_bien];
    
    if (typesSouhaites.includes(bien.type)) {
      score += 20;
    }
  } else {
    score += 20; // Pas de préférence = compatible
  }

  // 3. Localisation (20%)
  if (acheteur.villes) {
    const villesSouhaitees = Array.isArray(acheteur.villes) 
      ? acheteur.villes 
      : [acheteur.villes];
    
    const matchVille = villesSouhaitees.some(ville => 
      bien.ville?.toLowerCase().includes(ville.toLowerCase()) ||
      ville.toLowerCase().includes(bien.ville?.toLowerCase())
    );
    
    if (matchVille) {
      score += 20;
    }
  } else {
    score += 20; // Pas de préférence = compatible
  }

  // 4. Surface (15%)
  if (acheteur.surface_min && acheteur.surface_max) {
    if (bien.surface >= acheteur.surface_min && bien.surface <= acheteur.surface_max) {
      score += 15;
    } else if (bien.surface >= acheteur.surface_min * 0.9) {
      score += 7;
    }
  } else {
    score += 15; // Pas de critère = compatible
  }

  // 5. Nombre de pièces (15%)
  if (acheteur.pieces_min) {
    if (bien.pieces >= acheteur.pieces_min) {
      score += 15;
    } else if (bien.pieces >= acheteur.pieces_min - 1) {
      score += 7;
    }
  } else {
    score += 15; // Pas de critère = compatible
  }

  return Math.round(score);
}
