// pages/api/immobilier/import-biens.js

import { supabaseAdmin } from '../../../lib/supabase';
import { getSession } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Non authentifié' });
  const agentEmail = session.email;

  try {
    const { biens } = req.body;
    if (!Array.isArray(biens) || biens.length === 0) {
      return res.status(400).json({ success: false, error: 'Le champ "biens" doit être un tableau non vide' });
    }

    let biensImportes = 0, biensExistants = 0, erreursImport = 0;
    const resultats = [];

    for (const bien of biens) {
      try {
        if (!bien.reference) {
          erreursImport++;
          resultats.push({ reference: bien.reference || 'N/A', statut: 'erreur', message: 'Référence manquante' });
          continue;
        }

        const { data: existant } = await supabaseAdmin
          .from('biens').select('id').eq('reference', bien.reference).eq('agent_email', agentEmail).single();
        if (existant) {
          biensExistants++;
          resultats.push({ reference: bien.reference, statut: 'existant', message: 'Bien déjà existant' });
          continue;
        }

        const { data, error } = await supabaseAdmin
          .from('biens')
          .insert([{
            reference: bien.reference, type: bien.type || 'autre', titre: bien.titre || bien.reference,
            adresse: bien.adresse || '', ville: bien.ville || '', code_postal: bien.code_postal || bien.codePostal || '',
            prix: bien.prix || 0, surface: bien.surface || null, pieces: bien.pieces || null,
            chambres: bien.chambres || null, description: bien.description || '',
            source: bien.source || 'import', lien: bien.lien || null, image: bien.image || null,
            photos: bien.photos || [], statut: bien.statut || 'disponible',
            dpe: bien.dpe || null, ges: bien.ges || null, etage: bien.etage || null,
            ascenseur: bien.ascenseur || false, balcon: bien.balcon || false,
            terrasse: bien.terrasse || false, jardin: bien.jardin || false,
            parking: bien.parking || false, cave: bien.cave || false,
            agent_email: agentEmail, created_at: new Date().toISOString()
          }])
          .select().single();

        if (error) throw error;
        biensImportes++;
        resultats.push({ reference: bien.reference, statut: 'importé', id: data.id, message: 'Bien importé avec succès' });
      } catch (err) {
        erreursImport++;
        resultats.push({ reference: bien.reference, statut: 'erreur', message: err.message });
      }
    }

    return res.status(200).json({
      success: true, message: 'Import terminé',
      stats: { total: biens.length, biensImportes, biensExistants, erreursImport },
      resultats
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Erreur import biens', details: error.message });
  }
}
