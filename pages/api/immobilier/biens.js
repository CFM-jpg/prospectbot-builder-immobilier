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
    const { data: biens, error } = await supabase
      .from('biens_immobiliers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ 
      success: true, 
      biens: biens || [] 
    });

  } catch (error) {
    console.error('Erreur récupération biens:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      biens: []
    });
  }
}
