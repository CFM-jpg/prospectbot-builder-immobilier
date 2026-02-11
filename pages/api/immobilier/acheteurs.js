// pages/api/immobilier/acheteurs.js
// API Acheteurs - Version Supabase

import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  // GET - Récupérer la liste des acheteurs
  if (req.method === 'GET') {
    try {
      const { statut } = req.query;

      let query = supabaseAdmin.from('acheteurs').select('*');

      // Filtre par statut si fourni
      if (statut) {
        query = query.eq('statut', statut);
      }

      // Tri par date de création (plus récents en premier)
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: data || [],
        total: data?.length || 0
      });

    } catch (error) {
      console.error('Erreur récupération acheteurs:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des acheteurs',
        details: error.message
      });
    }
  }

  // POST - Créer un nouvel acheteur
  else if (req.method === 'POST') {
    try {
      const acheteurData = req.body;

      // Validation basique
      if (!acheteurData.nom || !acheteurData.email) {
        return res.status(400).json({
          success: false,
          error: 'Nom et email requis'
        });
      }

      // Vérifier si l'email existe déjà
      const { data: existant } = await supabaseAdmin
        .from('acheteurs')
        .select('id')
        .eq('email', acheteurData.email)
        .single();

      if (existant) {
        return res.status(409).json({
          success: false,
          error: 'Un acheteur avec cet email existe déjà'
        });
      }

      // Créer l'acheteur
      const { data, error } = await supabaseAdmin
        .from('acheteurs')
        .insert([{
          ...acheteurData,
          statut: acheteurData.statut || 'actif',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        data: data,
        message: 'Acheteur créé avec succès'
      });

    } catch (error) {
      console.error('Erreur création acheteur:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la création de l\'acheteur',
        details: error.message
      });
    }
  }

  // PUT - Mettre à jour un acheteur
  else if (req.method === 'PUT') {
    try {
      const { id, ...updateData } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID de l\'acheteur manquant'
        });
      }

      const { data, error } = await supabaseAdmin
        .from('acheteurs')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: data,
        message: 'Acheteur mis à jour avec succès'
      });

    } catch (error) {
      console.error('Erreur mise à jour acheteur:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour de l\'acheteur',
        details: error.message
      });
    }
  }

  // DELETE - Supprimer un acheteur
  else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID de l\'acheteur manquant'
        });
      }

      const { error } = await supabaseAdmin
        .from('acheteurs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Acheteur supprimé avec succès'
      });

    } catch (error) {
      console.error('Erreur suppression acheteur:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la suppression de l\'acheteur',
        details: error.message
      });
    }
  }

  else {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
