// pages/api/cron/send-notifications.js
// API Cron - Envoi des notifications par email - Version Supabase + Brevo

import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // Vérification du token Vercel Cron (sécurité)
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  try {
    // 1. Récupérer les matchs non notifiés
    const { data: matchsNonNotifies, error } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('statut', 'nouveau')
      .eq('email_envoye', false);

    if (error) throw error;

    let emailsEnvoyes = 0;
    const notifications = [];

    // 2. Pour chaque match, envoyer une notification
    for (const match of matchsNonNotifies || []) {
      try {
        // Récupérer les détails du bien
        const { data: bien } = await supabaseAdmin
          .from('biens')
          .select('*')
          .eq('id', match.bien_id)
          .single();

        // Récupérer les détails de l'acheteur
        const { data: acheteur } = await supabaseAdmin
          .from('acheteurs')
          .select('*')
          .eq('id', match.acheteur_id)
          .single();

        if (!bien || !acheteur) continue;

        // Envoyer l'email via Brevo
        const emailEnvoye = await envoyerEmailBrevo({
          to: acheteur.email,
          toName: acheteur.nom,
          subject: `🏡 Nouveau bien correspondant à vos critères (${match.score}% de compatibilité)`,
          htmlContent: genererEmailHTML(acheteur, bien, match)
        });

        if (emailEnvoye) {
          // Marquer le match comme notifié
          await supabaseAdmin
            .from('matches')
            .update({
              email_envoye: true,
              date_notification: new Date().toISOString()
            })
            .eq('id', match.id);

          emailsEnvoyes++;
          notifications.push({
            matchId: match.id,
            email: acheteur.email,
            bienReference: bien.reference
          });
        }

      } catch (error) {
        console.error(`Erreur envoi email pour match ${match.id}:`, error);
      }
    }

    // 3. Logger l'exécution
    await supabaseAdmin.from('cron_logs').insert([{
      type: 'send-notifications',
      date: new Date().toISOString(),
      resultat: {
        matchsTraites: matchsNonNotifies?.length || 0,
        emailsEnvoyes: emailsEnvoyes
      }
    }]);

    return res.status(200).json({
      success: true,
      message: 'Notifications envoyées',
      stats: {
        matchsTraites: matchsNonNotifies?.length || 0,
        emailsEnvoyes: emailsEnvoyes
      },
      notifications: notifications
    });

  } catch (error) {
    console.error('Erreur cron send-notifications:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'envoi des notifications',
      details: error.message
    });
  }
}

// Fonction pour générer le HTML de l'email
function genererEmailHTML(acheteur, bien, match) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; margin: 0; }
        .bien-card { background: white; padding: 20px; border-radius: 8px; margin: 10px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .score { font-size: 32px; font-weight: bold; color: #10b981; margin: 10px 0; }
        .detail { margin: 12px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .detail:last-child { border-bottom: none; }
        .label { font-weight: 600; color: #6b7280; display: inline-block; width: 120px; }
        .value { color: #111827; }
        .cta { background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; 
               border-radius: 8px; display: inline-block; margin: 20px 0; font-weight: 600; }
        .cta:hover { background: #1d4ed8; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🏡 Nouveau bien correspondant !</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Nous avons trouvé un bien qui pourrait vous intéresser</p>
        </div>
        
        <div class="content">
          <p>Bonjour <strong>${acheteur.nom}</strong>,</p>
          
          <p>Excellente nouvelle ! Nous avons trouvé un bien qui correspond parfaitement à vos critères de recherche :</p>
          
          <div class="bien-card">
            <div class="score">${match.score}% de compatibilité</div>
            
            <h2 style="margin: 10px 0; color: #111827;">${bien.type} - ${bien.reference}</h2>
            
            <div class="detail">
              <span class="label">📍 Adresse :</span>
              <span class="value">${bien.adresse}, ${bien.ville}</span>
            </div>
            
            <div class="detail">
              <span class="label">💰 Prix :</span>
              <span class="value"><strong>${bien.prix?.toLocaleString('fr-FR')} €</strong></span>
            </div>
            
            <div class="detail">
              <span class="label">📐 Surface :</span>
              <span class="value">${bien.surface} m²</span>
            </div>
            
            <div class="detail">
              <span class="label">🚪 Pièces :</span>
              <span class="value">${bien.pieces} pièce${bien.pieces > 1 ? 's' : ''}</span>
            </div>
            
            ${bien.description ? `
              <div class="detail">
                <span class="label">📝 Description :</span>
                <div style="margin-top: 8px; color: #4b5563;">${bien.description}</div>
              </div>
            ` : ''}
          </div>
          
          <center>
            <a href="${process.env.NEXT_PUBLIC_URL || 'https://prospectbot-builder-immobilier.vercel.app'}/bien/${bien.id}" class="cta">
              Voir le bien en détail
            </a>
          </center>
          
          <p style="margin-top: 30px; color: #4b5563;">
            Ce bien correspond à <strong>${match.score}%</strong> de vos critères de recherche. 
            N'hésitez pas à nous contacter pour plus d'informations ou pour organiser une visite.
          </p>
        </div>
        
        <div class="footer">
          <p>Vous recevez cet email car vous êtes inscrit sur notre plateforme de recherche immobilière.</p>
          <p style="margin-top: 10px;">
            <a href="${process.env.NEXT_PUBLIC_URL || 'https://prospectbot-builder-immobilier.vercel.app'}/preferences/${acheteur.id}" style="color: #2563eb;">
              Gérer mes préférences
            </a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Fonction pour envoyer l'email via Brevo (anciennement Sendinblue)
async function envoyerEmailBrevo({ to, toName, subject, htmlContent }) {
  try {
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'cfm.contact49@gmail.com';
    
    if (!BREVO_API_KEY) {
      console.error('BREVO_API_KEY non configurée');
      return false;
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: {
          name: 'ProspectBot Immobilier',
          email: BREVO_SENDER_EMAIL
        },
        to: [{
          email: to,
          name: toName
        }],
        subject: subject,
        htmlContent: htmlContent
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erreur Brevo:', errorData);
      return false;
    }

    return true;

  } catch (error) {
    console.error('Erreur envoi email Brevo:', error);
    return false;
  }
}
