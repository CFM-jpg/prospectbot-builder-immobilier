// pages/api/immobilier/biens.js
// API Biens - Version Supabase

import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  // GET - Récupérer la liste des biens
  if (req.method === 'GET') {
    try {
      const { statut, type, villeRecherche, prixMin, prixMax } = req.query;

      let query = supabaseAdmin.from('biens').select('*');

      // Filtres optionnels
      if (statut) {
        query = query.eq('statut', statut);
      }
      if (type) {
        query = query.eq('type', type);
      }
      if (villeRecherche) {
        query = query.ilike('ville', `%${villeRecherche}%`);
      }
      if (prixMin) {
        query = query.gte('prix', parseInt(prixMin));
      }
      if (prixMax) {
        query = query.lte('prix', parseInt(prixMax));
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
      console.error('Erreur récupération biens:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des biens',
        details: error.message
      });
    }
  }

  // POST - Créer un nouveau bien
  else if (req.method === 'POST') {
    try {
      const bienData = req.body;

      // Validation basique
      if (!bienData.reference || !bienData.type || !bienData.prix) {
        return res.status(400).json({
          success: false,
          error: 'Données manquantes (reference, type, prix requis)'
        });
      }

      // Vérifier si la référence existe déjà
      const { data: existant } = await supabaseAdmin
        .from('biens')
        .select('id')
        .eq('reference', bienData.reference)
        .single();

      if (existant) {
        return res.status(409).json({
          success: false,
          error: 'Un bien avec cette référence existe déjà'
        });
      }

      // Créer le bien
      const { data, error } = await supabaseAdmin
        .from('biens')
        .insert([{
          ...bienData,
          statut: bienData.statut || 'disponible',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        data: data,
        message: 'Bien créé avec succès'
      });

    } catch (error) {
      console.error('Erreur création bien:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la création du bien',
        details: error.message
      });
    }
  }

  // PUT - Mettre à jour un bien
  else if (req.method === 'PUT') {
    try {
      const { id, ...updateData } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID du bien manquant'
        });
      }

      const { data, error } = await supabaseAdmin
        .from('biens')
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
        message: 'Bien mis à jour avec succès'
      });

    } catch (error) {
      console.error('Erreur mise à jour bien:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour du bien',
        details: error.message
      });
    }
  }

  // DELETE - Supprimer un bien
  else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID du bien manquant'
        });
      }

      const { error } = await supabaseAdmin
        .from('biens')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Bien supprimé avec succès'
      });

    } catch (error) {
      console.error('Erreur suppression bien:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la suppression du bien',
        details: error.message
      });
    }
  }

  else {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
