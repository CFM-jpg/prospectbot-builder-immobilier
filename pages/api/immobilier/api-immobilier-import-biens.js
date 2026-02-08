/**
 * API : Import de biens immobiliers
 * POST /api/immobilier/import-biens
 * 
 * Utilisé par votre partenaire pour envoyer les biens scrapés
 */

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authentification simple (en production, utilisez JWT)
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.PARTNER_API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'API key invalide'
    });
  }

  const { biens } = req.body;

  // Validation
  if (!biens || !Array.isArray(biens)) {
    return res.status(400).json({
      success: false,
      error: 'Le paramètre "biens" doit être un tableau'
    });
  }

  if (biens.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Le tableau de biens est vide'
    });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log(`📥 Import de ${biens.length} biens...`);

    const results = {
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    // Traiter chaque bien
    for (const bien of biens) {
      try {
        // Validation du bien
        if (!bien.url_annonce) {
          results.errors.push({
            bien: bien.titre || 'N/A',
            error: 'URL manquante'
          });
          results.skipped++;
          continue;
        }

        // Vérifier si le bien existe déjà (via URL unique)
        const { data: existing } = await supabase
          .from('biens_immobiliers')
          .select('id, prix')
          .eq('url_annonce', bien.url_annonce)
          .single();

        if (existing) {
          // Mettre à jour si le prix a changé
          if (existing.prix !== bien.prix) {
            await supabase
              .from('biens_immobiliers')
              .update({
                prix: bien.prix,
                updated_at: new Date().toISOString()
              })
              .eq('id', existing.id);

            console.log(`🔄 Bien mis à jour : ${bien.titre}`);
            results.updated++;
          } else {
            console.log(`⏭️  Bien déjà à jour : ${bien.titre}`);
            results.skipped++;
          }
          continue;
        }

        // Insérer le nouveau bien
        const { error } = await supabase
          .from('biens_immobiliers')
          .insert({
            titre: bien.titre,
            type_bien: bien.type_bien || 'Appartement',
            ville: bien.ville,
            quartier: bien.quartier || null,
            prix: bien.prix,
            surface: bien.surface || null,
            pieces: bien.pieces || null,
            description: bien.description || '',
            photos: bien.photos || [],
            telephone: bien.telephone || null,
            email: bien.email || null,
            url_annonce: bien.url_annonce,
            source: bien.source || 'partenaire',
            scraped_at: new Date().toISOString()
          });

        if (error) {
          console.error(`❌ Erreur insertion bien ${bien.titre}:`, error);
          results.errors.push({
            bien: bien.titre,
            error: error.message
          });
          continue;
        }

        console.log(`✅ Bien inséré : ${bien.titre}`);
        results.inserted++;

      } catch (error) {
        console.error(`❌ Erreur traitement bien:`, error);
        results.errors.push({
          bien: bien.titre || 'N/A',
          error: error.message
        });
      }
    }

    console.log('\n📊 Résultats de l\'import :');
    console.log(`✅ Insérés : ${results.inserted}`);
    console.log(`🔄 Mis à jour : ${results.updated}`);
    console.log(`⏭️  Ignorés : ${results.skipped}`);
    console.log(`❌ Erreurs : ${results.errors.length}`);

    return res.status(200).json({
      success: true,
      stats: {
        total: biens.length,
        inserted: results.inserted,
        updated: results.updated,
        skipped: results.skipped,
        errors: results.errors.length
      },
      errors: results.errors,
      message: `Import terminé : ${results.inserted} nouveaux biens, ${results.updated} mis à jour`
    });

  } catch (error) {
    console.error('❌ Erreur import biens:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
