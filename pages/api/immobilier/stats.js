// pages/api/immobilier/stats.js

import { supabaseAdmin } from '../../../lib/supabase';
import { getSession } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' });

  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Non authentifié' });
  const agentEmail = session.email;

  try {
    const { count: totalBiens } = await supabaseAdmin
      .from('biens').select('*', { count: 'exact', head: true }).eq('agent_email', agentEmail);

    const { count: totalAcheteurs } = await supabaseAdmin
      .from('acheteurs').select('*', { count: 'exact', head: true }).eq('agent_email', agentEmail);

    const { count: totalMatches } = await supabaseAdmin
      .from('matches').select('*', { count: 'exact', head: true }).eq('agent_email', agentEmail);

    const { data: biensData } = await supabaseAdmin
      .from('biens').select('prix').eq('agent_email', agentEmail).not('prix', 'is', null);
    const prixMoyen = biensData?.length
      ? Math.round(biensData.reduce((s, b) => s + (b.prix || 0), 0) / biensData.length) : 0;

    const { data: acheteursData } = await supabaseAdmin
      .from('acheteurs').select('budget_max').eq('agent_email', agentEmail).not('budget_max', 'is', null);
    const budgetMoyen = acheteursData?.length
      ? Math.round(acheteursData.reduce((s, a) => s + (a.budget_max || 0), 0) / acheteursData.length) : 0;

    const tauxMatching = totalAcheteurs > 0 ? Math.round((totalMatches / totalAcheteurs) * 100) : 0;

    const dateSemainePassee = new Date();
    dateSemainePassee.setDate(dateSemainePassee.getDate() - 7);
    const { count: nouveauxMatches } = await supabaseAdmin
      .from('matches').select('*', { count: 'exact', head: true })
      .eq('agent_email', agentEmail).gte('created_at', dateSemainePassee.toISOString());

    return res.status(200).json({
      success: true,
      data: { totalBiens: totalBiens || 0, totalAcheteurs: totalAcheteurs || 0, totalMatches: totalMatches || 0, prixMoyen, budgetMoyen, tauxMatching, nouveauxMatches: nouveauxMatches || 0 }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Erreur statistiques', details: error.message });
  }
}
