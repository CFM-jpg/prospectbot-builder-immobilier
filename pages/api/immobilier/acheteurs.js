// pages/api/immobilier/acheteurs.js

import { supabaseAdmin } from '../../../lib/supabase';
import { getSession } from '../../../lib/auth';
import { getPlanFeatures } from '../../../lib/planConfig';

export default async function handler(req, res) {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Non authentifié' });
  const agentEmail = session.email;

  // GET
  if (req.method === 'GET') {
    try {
      const { statut } = req.query;
      let query = supabaseAdmin.from('acheteurs').select('*').eq('agent_email', agentEmail);
      if (statut) query = query.eq('statut', statut);
      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json({ success: true, data: data || [], total: data?.length || 0 });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Erreur récupération acheteurs', details: error.message });
    }
  }

  // POST
  else if (req.method === 'POST') {
    try {
      const acheteurData = req.body;
      if (!acheteurData.nom || !acheteurData.email) {
        return res.status(400).json({ success: false, error: 'Nom et email requis' });
      }

      // Vérification limite plan (par agent)
      const features = getPlanFeatures(session.plan, session.role);
      if (features.acheteursLimit !== Infinity) {
        const { count } = await supabaseAdmin
          .from('acheteurs')
          .select('*', { count: 'exact', head: true })
          .eq('agent_email', agentEmail);
        if (count >= features.acheteursLimit) {
          return res.status(403).json({
            success: false,
            error: `Limite atteinte — votre plan ${session.plan} est limité à ${features.acheteursLimit} acheteurs.`,
            limitReached: true,
            limit: features.acheteursLimit,
          });
        }
      }

      // Email déjà utilisé par cet agent
      const { data: existant } = await supabaseAdmin
        .from('acheteurs').select('id').eq('email', acheteurData.email).eq('agent_email', agentEmail).single();
      if (existant) return res.status(409).json({ success: false, error: 'Un acheteur avec cet email existe déjà' });

      const { data, error } = await supabaseAdmin
        .from('acheteurs')
        .insert([{ ...acheteurData, agent_email: agentEmail, statut: acheteurData.statut || 'actif', created_at: new Date().toISOString() }])
        .select().single();
      if (error) throw error;
      return res.status(201).json({ success: true, data, message: 'Acheteur créé avec succès' });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Erreur création acheteur', details: error.message });
    }
  }

  // PUT
  else if (req.method === 'PUT') {
    try {
      const { id, ...updateData } = req.body;
      if (!id) return res.status(400).json({ success: false, error: 'ID manquant' });
      const { data, error } = await supabaseAdmin
        .from('acheteurs')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id).eq('agent_email', agentEmail)
        .select().single();
      if (error) throw error;
      return res.status(200).json({ success: true, data, message: 'Acheteur mis à jour' });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Erreur mise à jour acheteur', details: error.message });
    }
  }

  // DELETE
  else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id) return res.status(400).json({ success: false, error: 'ID manquant' });
      const { error } = await supabaseAdmin.from('acheteurs').delete().eq('id', id).eq('agent_email', agentEmail);
      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Acheteur supprimé' });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Erreur suppression acheteur', details: error.message });
    }
  }

  else return res.status(405).json({ error: 'Méthode non autorisée' });
}
