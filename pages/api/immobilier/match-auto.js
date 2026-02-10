import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Récupérer tous les biens disponibles
    const { data: biens, error: biensError } = await supabase
      .from('biens_immobiliers')
      .select('*')
      .eq('statut', 'disponible');

    if (biensError) throw biensError;

    // Récupérer tous les acheteurs
    const { data: acheteurs, error: acheteursError } = await supabase
      .from('acheteurs_immobilier')
      .select('*');

    if (acheteursError) throw acheteursError;

    let nouveauxMatches = 0;

    // Pour chaque acheteur, trouver les biens compatibles
    for (const acheteur of acheteurs) {
      for (const bien of biens) {
        // Vérifier si le match existe déjà
        const { data: matchExistant } = await supabase
          .from('matches_immobilier')
          .select('id')
          .eq('acheteur_id', acheteur.id)
          .eq('bien_id', bien.id)
          .single();

        if (matchExistant) continue; // Skip si match existe déjà

        // Calculer le score de compatibilité
        let score = 0;

        // Compatibilité de prix (40 points max)
        if (bien.prix <= acheteur.budget_max) {
          const ratio = bien.prix / acheteur.budget_max;
          score += Math.round(40 * (1 - Math.abs(ratio - 0.9))); // Bonus si proche de 90% du budget
        }

        // Compatibilité de ville (30 points max)
        if (bien.ville?.toLowerCase() === acheteur.ville_recherchee?.toLowerCase()) {
          score += 30;
        }

        // Compatibilité de type (20 points max)
        if (bien.type?.toLowerCase() === acheteur.type_bien?.toLowerCase()) {
          score += 20;
        }

        // Compatibilité de surface (10 points max)
        if (acheteur.surface_min && bien.surface >= acheteur.surface_min) {
          score += 10;
        }

        // Créer le match si le score est >= 50%
        if (score >= 50) {
          const { error: insertError } = await supabase
            .from('matches_immobilier')
            .insert({
              acheteur_id: acheteur.id,
              bien_id: bien.id,
              acheteur_nom: acheteur.nom,
              acheteur_email: acheteur.email,
              acheteur_telephone: acheteur.telephone,
              bien_titre: bien.titre,
              bien_prix: bien.prix,
              bien_surface: bien.surface,
              bien_ville: bien.ville,
              bien_type: bien.type,
              score_compatibilite: score,
              statut: 'nouveau'
            });

          if (!insertError) {
            nouveauxMatches++;
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      nouveauxMatches,
      message: `${nouveauxMatches} nouveaux matchs créés`
    });

  } catch (error) {
    console.error('Erreur matching auto:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur',
      details: error.message 
    });
  }
}
