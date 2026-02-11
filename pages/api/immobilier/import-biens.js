// pages/api/immobilier/import-biens.js
// API Import de biens - Version Supabase

import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { biens } = req.body;

    if (!Array.isArray(biens) || biens.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Le champ "biens" doit être un tableau non vide'
      });
    }

    let biensImportes = 0;
    let biensExistants = 0;
    let erreursImport = 0;
    const resultats = [];

    for (const bien of biens) {
      try {
        // Validation basique
        if (!bien.reference) {
          erreursImport++;
          resultats.push({
            reference: bien.reference || 'N/A',
            statut: 'erreur',
            message: 'Référence manquante'
          });
          continue;
        }

        // Vérifier si le bien existe déjà
        const { data: existant } = await supabaseAdmin
          .from('biens')
          .select('id')
          .eq('reference', bien.reference)
          .single();

        if (existant) {
          biensExistants++;
          resultats.push({
            reference: bien.reference,
            statut: 'existant',
            message: 'Bien déjà existant'
          });
          continue;
        }

        // Préparer les données du bien
        const bienData = {
          reference: bien.reference,
          type: bien.type || 'autre',
          titre: bien.titre || bien.reference,
          adresse: bien.adresse || '',
          ville: bien.ville || '',
          code_postal: bien.code_postal || bien.codePostal || '',
          prix: bien.prix || 0,
          surface: bien.surface || null,
          pieces: bien.pieces || null,
          chambres: bien.chambres || null,
          description: bien.description || '',
          source: bien.source || 'import',
          lien: bien.lien || null,
          image: bien.image || null,
          photos: bien.photos || [],
          statut: bien.statut || 'disponible',
          dpe: bien.dpe || null,
          ges: bien.ges || null,
          etage: bien.etage || null,
          ascenseur: bien.ascenseur || false,
          balcon: bien.balcon || false,
          terrasse: bien.terrasse || false,
          jardin: bien.jardin || false,
          parking: bien.parking || false,
          cave: bien.cave || false,
          created_at: new Date().toISOString()
        };

        // Insérer le bien
        const { data, error } = await supabaseAdmin
          .from('biens')
          .insert([bienData])
          .select()
          .single();

        if (error) throw error;

        biensImportes++;
        resultats.push({
          reference: bien.reference,
          statut: 'importé',
          id: data.id,
          message: 'Bien importé avec succès'
        });

      } catch (error) {
        erreursImport++;
        resultats.push({
          reference: bien.reference,
          statut: 'erreur',
          message: error.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Import terminé',
      stats: {
        total: biens.length,
        biensImportes: biensImportes,
        biensExistants: biensExistants,
        erreursImport: erreursImport
      },
      resultats: resultats
    });

  } catch (error) {
    console.error('Erreur import biens:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'import des biens',
      details: error.message
    });
  }
}
