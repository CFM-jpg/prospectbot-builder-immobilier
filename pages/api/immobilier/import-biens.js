import { createClient } from '@supabase/supabase-js';

/**
 * API : Import de biens immobiliers
 * POST /api/immobilier/import-biens
 * 
 * Body attendu :
 * {
 *   biens: [
 *     {
 *       titre: string,
 *       description: string,
 *       prix: number,
 *       surface: number,
 *       ville: string,
 *       code_postal: string,
 *       type: string (appartement, maison, terrain),
 *       nb_pieces: number,
 *       statut: string (disponible, vendu, reserve)
 *     }
 *   ]
 * }
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vérification du secret CRON (sécurité)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({
      success: false,
      error: 'Non autorisé'
    });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { biens } = req.body;

    if (!biens || !Array.isArray(biens)) {
      return res.status(400).json({
        success: false,
        error: 'Format invalide. Attendu: { biens: [...] }'
      });
    }

    let biensImportes = 0;
    let biensErreurs = 0;
    const erreurs = [];

    for (const bien of biens) {
      try {
        // Vérifier si le bien existe déjà (par titre et ville)
        const { data: existant } = await supabase
          .from('biens_immobiliers')
          .select('id')
          .eq('titre', bien.titre)
          .eq('ville', bien.ville)
          .single();

        if (existant) {
          // Mettre à jour le bien existant
          const { error: updateError } = await supabase
            .from('biens_immobiliers')
            .update({
              description: bien.description,
              prix: bien.prix,
              surface: bien.surface,
              code_postal: bien.code_postal,
              type: bien.type,
              nb_pieces: bien.nb_pieces,
              statut: bien.statut || 'disponible',
              updated_at: new Date().toISOString()
            })
            .eq('id', existant.id);

          if (updateError) throw updateError;
        } else {
          // Créer un nouveau bien
          const { error: insertError } = await supabase
            .from('biens_immobiliers')
            .insert({
              titre: bien.titre,
              description: bien.description,
              prix: bien.prix,
              surface: bien.surface,
              ville: bien.ville,
              code_postal: bien.code_postal,
              type: bien.type,
              nb_pieces: bien.nb_pieces,
              statut: bien.statut || 'disponible'
            });

          if (insertError) throw insertError;
        }

        biensImportes++;

      } catch (error) {
        biensErreurs++;
        erreurs.push({
          bien: bien.titre,
          erreur: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      biensImportes,
      biensErreurs,
      total: biens.length,
      erreurs: erreurs.length > 0 ? erreurs : undefined
    });

  } catch (error) {
    console.error('Erreur import biens:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
}
