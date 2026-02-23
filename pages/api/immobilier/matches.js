// pages/api/immobilier/matches.js

import { supabaseAdmin } from '../../../lib/supabase';
import { getSession } from '../../../lib/auth';

export default async function handler(req, res) {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Non authentifié' });
  const agentEmail = session.email;

  // GET
  if (req.method === 'GET') {
    try {
      const { statut, acheteurId, bienId } = req.query;
      let query = supabaseAdmin.from('matches').select('*').eq('agent_email', agentEmail);
      if (statut) query = query.eq('statut', statut);
      if (acheteurId) query = query.eq('acheteur_id', acheteurId);
      if (bienId) query = query.eq('bien_id', bienId);
      query = query.order('score', { ascending: false }).order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json({ success: true, data: data || [], total: data?.length || 0 });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Erreur récupération matches', details: error.message });
    }
  }

  // POST
  else if (req.method === 'POST') {
    try {
      const matchData = req.body;
      if (!matchData.acheteur_id || !matchData.bien_id) {
        return res.status(400).json({ success: false, error: 'acheteur_id et bien_id requis' });
      }
      const { data: existant } = await supabaseAdmin
        .from('matches').select('id').eq('acheteur_id', matchData.acheteur_id).eq('bien_id', matchData.bien_id).single();
      if (existant) return res.status(409).json({ success: false, error: 'Ce match existe déjà' });

      const { data, error } = await supabaseAdmin
        .from('matches')
        .insert([{ ...matchData, agent_email: agentEmail, statut: matchData.statut || 'nouveau', created_at: new Date().toISOString() }])
        .select().single();
      if (error) throw error;
      return res.status(201).json({ success: true, data, message: 'Match créé avec succès' });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Erreur création match', details: error.message });
    }
  }

  // PUT
  else if (req.method === 'PUT') {
    try {
      const { id, ...updateData } = req.body;
      if (!id) return res.status(400).json({ success: false, error: 'ID manquant' });
      const { data, error } = await supabaseAdmin
        .from('matches')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id).eq('agent_email', agentEmail)
        .select().single();
      if (error) throw error;
      return res.status(200).json({ success: true, data, message: 'Match mis à jour' });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Erreur mise à jour match', details: error.message });
    }
  }

  // DELETE
  else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id) return res.status(400).json({ success: false, error: 'ID manquant' });
      const { error } = await supabaseAdmin.from('matches').delete().eq('id', id).eq('agent_email', agentEmail);
      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Match supprimé' });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Erreur suppression match', details: error.message });
    }
  }

  else return res.status(405).json({ error: 'Méthode non autorisée' });
}
