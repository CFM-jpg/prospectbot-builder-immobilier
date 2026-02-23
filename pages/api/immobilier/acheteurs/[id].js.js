// pages/api/immobilier/acheteurs/[id].js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { id } = req.query;

  try {
    // Récupérer l'acheteur
    const { data: acheteur, error: acheteurError } = await supabase
      .from('acheteurs')
      .select('*')
      .eq('id', id)
      .single();

    if (acheteurError || !acheteur) {
      return res.status(404).json({ error: 'Acheteur non trouvé' });
    }

    // Récupérer les correspondances avec les biens
    const { data: matches } = await supabase
      .from('matches')
      .select(`
        *,
        bien:biens(*)
      `)
      .eq('acheteur_id', id)
      .order('score', { ascending: false })
      .limit(20);

    // Récupérer l'historique des emails envoyés
    const { data: emails } = await supabase
      .from('email_logs')
      .select('*')
      .eq('acheteur_id', id)
      .order('sent_at', { ascending: false })
      .limit(50);

    return res.status(200).json({
      acheteur,
      matches: matches || [],
      emails: emails || [],
    });
  } catch (err) {
    console.error('Erreur API acheteur:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
