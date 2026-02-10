import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Récupérer les matches avec les informations des acheteurs et biens
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        *,
        acheteurs!inner(nom, prenom, email),
        biens_immobiliers!inner(titre, ville, prix)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Formatter les données pour l'affichage
    const formattedMatches = (matches || []).map(match => ({
      id: match.id,
      score_match: match.score_match,
      statut: match.statut,
      created_at: match.created_at,
      acheteur_nom: `${match.acheteurs.prenom} ${match.acheteurs.nom}`,
      acheteur_email: match.acheteurs.email,
      bien_titre: match.biens_immobiliers.titre,
      bien_ville: match.biens_immobiliers.ville,
      bien_prix: match.biens_immobiliers.prix
    }));

    return res.status(200).json({ 
      success: true, 
      matches: formattedMatches 
    });

  } catch (error) {
    console.error('Erreur récupération matches:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      matches: []
    });
  }
}
