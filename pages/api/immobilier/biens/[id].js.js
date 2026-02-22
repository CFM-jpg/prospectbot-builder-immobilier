// pages/api/immobilier/biens/[id].js
// Récupère un bien spécifique par son ID

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) return res.status(400).json({ error: 'ID manquant' });

  try {
    const { data, error } = await supabase
      .from('biens')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Bien introuvable' });
    }

    // Récupère aussi les matches pour ce bien
    const { data: matchesData } = await supabase
      .from('matches')
      .select(`
        score,
        acheteurs (
          id,
          nom,
          email,
          budget_min,
          budget_max,
          villes,
          surface_min,
          pieces_min
        )
      `)
      .eq('bien_id', id)
      .order('score', { ascending: false });

    const matches = (matchesData || []).map(m => ({
      score: m.score,
      acheteur_nom: m.acheteurs?.nom,
      acheteur_email: m.acheteurs?.email,
      acheteur_id: m.acheteurs?.id,
      budget_min: m.acheteurs?.budget_min,
      budget_max: m.acheteurs?.budget_max,
    }));

    return res.status(200).json({ data, matches });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
