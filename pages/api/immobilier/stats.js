// pages/api/immobilier/stats.js
// API Statistiques - Version Supabase

import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // 1. Total biens
    const { count: totalBiens } = await supabaseAdmin
      .from('biens')
      .select('*', { count: 'exact', head: true });

    // 2. Total acheteurs
    const { count: totalAcheteurs } = await supabaseAdmin
      .from('acheteurs')
      .select('*', { count: 'exact', head: true });

    // 3. Total matches
    const { count: totalMatches } = await supabaseAdmin
      .from('matches')
      .select('*', { count: 'exact', head: true });

    // 4. Prix moyen des biens
    const { data: biensData } = await supabaseAdmin
      .from('biens')
      .select('prix')
      .not('prix', 'is', null);

    const prixMoyen = biensData && biensData.length > 0
      ? Math.round(biensData.reduce((sum, b) => sum + (b.prix || 0), 0) / biensData.length)
      : 0;

    // 5. Budget moyen des acheteurs
    const { data: acheteursData } = await supabaseAdmin
      .from('acheteurs')
      .select('budget_max')
      .not('budget_max', 'is', null);

    const budgetMoyen = acheteursData && acheteursData.length > 0
      ? Math.round(acheteursData.reduce((sum, a) => sum + (a.budget_max || 0), 0) / acheteursData.length)
      : 0;

    // 6. Calcul du taux de matching
    const tauxMatching = totalAcheteurs > 0
      ? Math.round((totalMatches / totalAcheteurs) * 100)
      : 0;

    // 7. Nouveaux matches cette semaine
    const dateSemainePassee = new Date();
    dateSemainePassee.setDate(dateSemainePassee.getDate() - 7);

    const { count: nouveauxMatches } = await supabaseAdmin
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', dateSemainePassee.toISOString());

    const stats = {
      totalBiens: totalBiens || 0,
      totalAcheteurs: totalAcheteurs || 0,
      totalMatches: totalMatches || 0,
      prixMoyen: prixMoyen,
      budgetMoyen: budgetMoyen,
      tauxMatching: tauxMatching,
      nouveauxMatches: nouveauxMatches || 0
    };

    return res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Erreur récupération stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques',
      details: error.message
    });
  }
}
