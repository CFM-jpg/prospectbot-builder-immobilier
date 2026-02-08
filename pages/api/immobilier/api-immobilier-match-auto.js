/**
 * API : Matching automatique biens ↔ acheteurs
 * POST /api/immobilier/match-auto
 * 
 * À appeler via CRON quotidien ou manuellement
 */

import { createClient } from '@supabase/supabase-js';

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

    console.log('🔄 Démarrage du matching automatique...');

    // 1. Récupérer les nouveaux biens (dernières 24h)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: nouveauxBiens, error: errorBiens } = await supabase
      .from('biens_immobiliers')
      .select('*')
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false });

    if (errorBiens) {
      throw new Error(`Erreur récupération biens: ${errorBiens.message}`);
    }

    console.log(`📦 ${nouveauxBiens?.length || 0} nouveaux biens trouvés`);

    let totalMatches = 0;
    let alertesEnvoyees = 0;
    const matchDetails = [];

    // 2. Pour chaque bien, trouver les acheteurs correspondants
    for (const bien of nouveauxBiens || []) {
      console.log(`\n🏠 Traitement : ${bien.titre}`);

      // Critères de matching
      const { data: acheteursCorrespondants, error: errorAcheteurs } = await supabase
        .from('acheteurs')
        .select('*')
        .eq('type_bien', bien.type_bien)
        .contains('villes', [bien.ville])
        .lte('budget_min', bien.prix)
        .gte('budget_max', bien.prix)
        .eq('statut', 'actif');

      if (errorAcheteurs) {
        console.error(`❌ Erreur matching pour bien ${bien.id}:`, errorAcheteurs);
        continue;
      }

      console.log(`👥 ${acheteursCorrespondants?.length || 0} acheteurs matchés`);

      // 3. Envoyer alerte à chaque acheteur
      for (const acheteur of acheteursCorrespondants || []) {
        try {
          // Vérifier si alerte déjà envoyée
          const { data: dejaEnvoye } = await supabase
            .from('alertes_envoyees')
            .select('id')
            .eq('acheteur_id', acheteur.id)
            .eq('bien_id', bien.id)
            .single();

          if (dejaEnvoye) {
            console.log(`⏭️  Alerte déjà envoyée à ${acheteur.email}`);
            continue;
          }

          // Envoyer l'alerte par email
          const alerteEnvoyee = await envoyerAlerteBien(acheteur, bien);

          if (alerteEnvoyee) {
            // Logger l'envoi
            await supabase.from('alertes_envoyees').insert({
              acheteur_id: acheteur.id,
              bien_id: bien.id,
              date_envoi: new Date().toISOString(),
              email_ouvert: false,
              email_clique: false
            });

            alertesEnvoyees++;
            console.log(`✅ Alerte envoyée à ${acheteur.email}`);
          }

        } catch (error) {
          console.error(`❌ Erreur envoi alerte à ${acheteur.email}:`, error);
        }
      }

      totalMatches += acheteursCorrespondants?.length || 0;

      matchDetails.push({
        bien: {
          id: bien.id,
          titre: bien.titre,
          ville: bien.ville,
          prix: bien.prix
        },
        matches: acheteursCorrespondants?.length || 0
      });
    }

    console.log('\n✅ Matching terminé !');
    console.log(`📊 Total matches : ${totalMatches}`);
    console.log(`📧 Alertes envoyées : ${alertesEnvoyees}`);

    return res.status(200).json({
      success: true,
      stats: {
        nouveauxBiens: nouveauxBiens?.length || 0,
        totalMatches,
        alertesEnvoyees,
        tauxEnvoi: nouveauxBiens?.length > 0 
          ? Math.round((alertesEnvoyees / totalMatches) * 100) + '%'
          : '0%'
      },
      details: matchDetails,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur matching automatique:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Fonction pour envoyer une alerte email via Brevo
 */
async function envoyerAlerteBien(acheteur, bien) {
  try {
    // TODO: Intégrer avec Brevo API
    // const brevoApiKey = process.env.BREVO_API_KEY;
    
    console.log(`📧 Envoi email à ${acheteur.email} pour bien ${bien.titre}`);

    // Simulation d'envoi
    // En production, appeler l'API Brevo ici
    
    /*
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'ProspectBot Immo', email: 'noreply@prospectbot.fr' },
        to: [{ email: acheteur.email, name: `${acheteur.prenom} ${acheteur.nom}` }],
        subject: `🏠 Nouveau bien - ${bien.type_bien} ${bien.ville} - ${bien.prix}€`,
        htmlContent: `
          <h2>Bonjour ${acheteur.prenom},</h2>
          <p>Un nouveau bien correspond à vos critères :</p>
          <ul>
            <li><strong>Type :</strong> ${bien.type_bien}</li>
            <li><strong>Ville :</strong> ${bien.ville}</li>
            <li><strong>Prix :</strong> ${bien.prix.toLocaleString('fr-FR')}€</li>
            <li><strong>Surface :</strong> ${bien.surface}m²</li>
            <li><strong>Pièces :</strong> ${bien.pieces}</li>
          </ul>
          <p>${bien.description}</p>
          <a href="${bien.url_annonce}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Voir l'annonce
          </a>
        `
      })
    });
    
    return response.ok;
    */

    // Pour l'instant, retourner true (simulation)
    return true;

  } catch (error) {
    console.error('Erreur envoi email:', error);
    return false;
  }
}
