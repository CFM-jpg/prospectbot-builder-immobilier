import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Compter les biens actifs
    const { count: totalBiens } = await supabase
      .from('biens_immobiliers')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'disponible');

    // Compter les acheteurs
    const { count: totalAcheteurs } = await supabase
      .from('acheteurs_immobilier')
      .select('*', { count: 'exact', head: true });

    // Compter les matchs actifs
    const { count: totalMatches } = await supabase
      .from('matches_immobilier')
      .select('*', { count: 'exact', head: true })
      .in('statut', ['nouveau', 'contacte']);

    // Calculer les revenus estimés (commission de 3% sur les biens matchés)
    const { data: matchedBiens } = await supabase
      .from('matches_immobilier')
      .select('bien_prix')
      .in('statut', ['nouveau', 'contacte']);

    const revenusEstimes = matchedBiens?.reduce((total, match) => {
      return total + (match.bien_prix * 0.03);
    }, 0) || 0;

    res.status(200).json({
      totalBiens: totalBiens || 0,
      totalAcheteurs: totalAcheteurs || 0,
      totalMatches: totalMatches || 0,
      revenusEstimes: Math.round(revenusEstimes)
    });

  } catch (error) {
    console.error('Erreur API stats:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: error.message 
    });
  }
}
