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

    const { data: biens, error } = await supabase
      .from('biens_immobiliers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json(biens || []);

  } catch (error) {
    console.error('Erreur API biens:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: error.message 
    });
  }
}
