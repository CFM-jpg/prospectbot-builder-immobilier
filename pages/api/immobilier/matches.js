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

    const { data: matches, error } = await supabase
      .from('matches_immobilier')
      .select('*')
      .order('score_compatibilite', { ascending: false });

    if (error) throw error;

    res.status(200).json(matches || []);

  } catch (error) {
    console.error('Erreur API matches:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: error.message 
    });
  }
}
