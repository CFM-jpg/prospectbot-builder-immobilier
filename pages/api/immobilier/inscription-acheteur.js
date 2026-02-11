// pages/api/immobilier/inscription-acheteur.js
// API Inscription Acheteur - Version Supabase

import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const acheteurData = req.body;

    // Validation des champs obligatoires
    if (!acheteurData.nom || !acheteurData.email) {
      return res.status(400).json({
        success: false,
        error: 'Le nom et l\'email sont obligatoires'
      });
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(acheteurData.email)) {
      return res.status(400).json({
        success: false,
        error: 'Format d\'email invalide'
      });
    }

    // Vérifier si l'email existe déjà
    const { data: existant } = await supabaseAdmin
      .from('acheteurs')
      .select('id, nom, email')
      .eq('email', acheteurData.email)
      .single();

    if (existant) {
      return res.status(409).json({
        success: false,
        error: 'Un acheteur avec cet email est déjà inscrit',
        acheteur: existant
      });
    }

    // Préparer les données de l'acheteur
    const nouvelAcheteur = {
      nom: acheteurData.nom,
      prenom: acheteurData.prenom || '',
      email: acheteurData.email,
      telephone: acheteurData.telephone || '',
      
      // Critères de recherche
      type_bien: acheteurData.type_bien || acheteurData.typeBien || [],
      budget_min: acheteurData.budget_min || acheteurData.budgetMin || 0,
      budget_max: acheteurData.budget_max || acheteurData.budgetMax || 0,
      surface_min: acheteurData.surface_min || acheteurData.surfaceMin || null,
      surface_max: acheteurData.surface_max || acheteurData.surfaceMax || null,
      pieces_min: acheteurData.pieces_min || acheteurData.piecesMin || null,
      pieces_max: acheteurData.pieces_max || acheteurData.piecesMax || null,
      chambres_min: acheteurData.chambres_min || acheteurData.chambresMin || null,
      
      // Localisation
      villes: acheteurData.villes || [],
      departements: acheteurData.departements || [],
      
      // Critères optionnels
      avec_jardin: acheteurData.avec_jardin || acheteurData.avecJardin || false,
      avec_parking: acheteurData.avec_parking || acheteurData.avecParking || false,
      avec_balcon: acheteurData.avec_balcon || acheteurData.avecBalcon || false,
      avec_terrasse: acheteurData.avec_terrasse || acheteurData.avecTerrasse || false,
      
      // Informations complémentaires
      notes: acheteurData.notes || '',
      statut: 'actif',
      source: acheteurData.source || 'inscription',
      created_at: new Date().toISOString()
    };

    // Insérer l'acheteur
    const { data, error } = await supabaseAdmin
      .from('acheteurs')
      .insert([nouvelAcheteur])
      .select()
      .single();

    if (error) throw error;

    // Optionnel : Lancer le matching automatique pour ce nouvel acheteur
    if (acheteurData.lancerMatching !== false) {
      try {
        await rechercherMatchsPourAcheteur(data.id);
      } catch (matchError) {
        console.error('Erreur lors du matching initial:', matchError);
        // On ne bloque pas l'inscription si le matching échoue
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      data: data
    });

  } catch (error) {
    console.error('Erreur inscription acheteur:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'inscription',
      details: error.message
    });
  }
}

// Fonction pour rechercher les matchs pour un acheteur spécifique
async function rechercherMatchsPourAcheteur(acheteurId) {
  // Récupérer l'acheteur
  const { data: acheteur } = await supabaseAdmin
    .from('acheteurs')
    .select('*')
    .eq('id', acheteurId)
    .single();

  if (!acheteur) return;

  // Récupérer les biens disponibles
  const { data: biens } = await supabaseAdmin
    .from('biens')
    .select('*')
    .eq('statut', 'disponible');

  if (!biens || biens.length === 0) return;

  // Chercher les matchs
  for (const bien of biens) {
    const score = calculerScore(acheteur, bien);

    if (score >= 60) {
      // Vérifier si le match existe déjà
      const { data: existant } = await supabaseAdmin
        .from('matches')
        .select('id')
        .eq('acheteur_id', acheteur.id)
        .eq('bien_id', bien.id)
        .single();

      if (!existant) {
        await supabaseAdmin.from('matches').insert([{
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
        }]);
      }
    }
  }
}

// Fonction de calcul du score (identique à match-auto.js)
function calculerScore(acheteur, bien) {
  let score = 0;

  if (bien.prix <= acheteur.budget_max) {
    score += 30;
  } else if (bien.prix <= acheteur.budget_max * 1.1) {
    score += 15;
  }

  if (acheteur.type_bien) {
    const typesSouhaites = Array.isArray(acheteur.type_bien) 
      ? acheteur.type_bien 
      : [acheteur.type_bien];
    if (typesSouhaites.includes(bien.type)) {
      score += 20;
    }
  } else {
    score += 20;
  }

  if (acheteur.villes) {
    const villesSouhaitees = Array.isArray(acheteur.villes) 
      ? acheteur.villes 
      : [acheteur.villes];
    const matchVille = villesSouhaitees.some(ville => 
      bien.ville?.toLowerCase().includes(ville.toLowerCase())
    );
    if (matchVille) {
      score += 20;
    }
  } else {
    score += 20;
  }

  if (acheteur.surface_min && acheteur.surface_max) {
    if (bien.surface >= acheteur.surface_min && bien.surface <= acheteur.surface_max) {
      score += 15;
    } else if (bien.surface >= acheteur.surface_min * 0.9) {
      score += 7;
    }
  } else {
    score += 15;
  }

  if (acheteur.pieces_min) {
    if (bien.pieces >= acheteur.pieces_min) {
      score += 15;
    } else if (bien.pieces >= acheteur.pieces_min - 1) {
      score += 7;
    }
  } else {
    score += 15;
  }

  return Math.round(score);
}
