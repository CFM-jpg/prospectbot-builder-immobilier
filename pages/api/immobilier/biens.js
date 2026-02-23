// pages/api/immobilier/biens.js

import { supabaseAdmin } from '../../../lib/supabase';
import { getSession } from '../../../lib/auth';

export default async function handler(req, res) {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Non authentifié' });
  const agentEmail = session.email;

  // GET
  if (req.method === 'GET') {
    try {
      const { statut, type, villeRecherche, prixMin, prixMax } = req.query;
      let query = supabaseAdmin.from('biens').select('*').eq('agent_email', agentEmail);
      if (statut) query = query.eq('statut', statut);
      if (type) query = query.eq('type', type);
      if (villeRecherche) query = query.ilike('ville', `%${villeRecherche}%`);
      if (prixMin) query = query.gte('prix', parseInt(prixMin));
      if (prixMax) query = query.lte('prix', parseInt(prixMax));
      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json({ success: true, data: data || [], total: data?.length || 0 });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Erreur récupération biens', details: error.message });
    }
  }

  // POST
  else if (req.method === 'POST') {
    try {
      const bienData = req.body;
      if (!bienData.reference || !bienData.type || !bienData.prix) {
        return res.status(400).json({ success: false, error: 'Données manquantes (reference, type, prix requis)' });
      }
      const { data: existant } = await supabaseAdmin
        .from('biens').select('id').eq('reference', bienData.reference).eq('agent_email', agentEmail).single();
      if (existant) return res.status(409).json({ success: false, error: 'Un bien avec cette référence existe déjà' });

      const { data, error } = await supabaseAdmin
        .from('biens')
        .insert([{ ...bienData, agent_email: agentEmail, statut: bienData.statut || 'disponible', created_at: new Date().toISOString() }])
        .select().single();
      if (error) throw error;
      return res.status(201).json({ success: true, data, message: 'Bien créé avec succès' });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Erreur création bien', details: error.message });
    }
  }

  // PUT
  else if (req.method === 'PUT') {
    try {
      const { id, ...updateData } = req.body;
      if (!id) return res.status(400).json({ success: false, error: 'ID manquant' });
      const { data, error } = await supabaseAdmin
        .from('biens')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id).eq('agent_email', agentEmail)
        .select().single();
      if (error) throw error;
      return res.status(200).json({ success: true, data, message: 'Bien mis à jour' });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Erreur mise à jour bien', details: error.message });
    }
  }

  // DELETE
  else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id) return res.status(400).json({ success: false, error: 'ID manquant' });
      const { error } = await supabaseAdmin.from('biens').delete().eq('id', id).eq('agent_email', agentEmail);
      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Bien supprimé' });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Erreur suppression bien', details: error.message });
    }
  }

  else return res.status(405).json({ error: 'Méthode non autorisée' });
}
