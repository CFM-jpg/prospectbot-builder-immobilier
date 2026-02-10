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
    // Compter les biens
    const { count: totalBiens, error: biensError } = await supabase
      .from('biens_immobiliers')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'disponible');

    if (biensError) throw biensError;

    // Compter les acheteurs
    const { count: totalAcheteurs, error: acheteursError } = await supabase
      .from('acheteurs')
      .select('*', { count: 'exact', head: true });

    if (acheteursError) throw acheteursError;

    // Compter les matches
    const { count: totalMatches, error: matchesError } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true });

    if (matchesError) throw matchesError;

    const stats = {
      total_biens: totalBiens || 0,
      total_acheteurs: totalAcheteurs || 0,
      total_matches: totalMatches || 0,
      revenus_potentiels: (totalMatches || 0) * 4500
    };

    return res.status(200).json({ success: true, stats });

  } catch (error) {
    console.error('Erreur stats:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      stats: {
        total_biens: 0,
        total_acheteurs: 0,
        total_matches: 0,
        revenus_potentiels: 0
      }
    });
  }
}
