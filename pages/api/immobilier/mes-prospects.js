// pages/api/immobilier/mes-prospects.js
import { createClient } from '@supabase/supabase-js';
import { getSession } from '../../../lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const user = getSession(req);
  if (!user) return res.status(401).json({ error: 'Non authentifié' });

  // GET — charger les prospects
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('vendeurs_prospectes')
      .select('*')
      .eq('user_id', user.email)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ prospects: data || [] });
  }

  // PATCH — mettre à jour le statut
  if (req.method === 'PATCH') {
    const { id, statut } = req.body;
    if (!id || !statut) return res.status(400).json({ error: 'id et statut requis' });

    const STATUTS_VALIDES = ['a_contacter', 'contacte', 'negociation', 'signe'];
    if (!STATUTS_VALIDES.includes(statut)) return res.status(400).json({ error: 'Statut invalide' });

    const { error } = await supabase
      .from('vendeurs_prospectes')
      .update({ statut })
      .eq('id', id)
      .eq('user_id', user.email);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
