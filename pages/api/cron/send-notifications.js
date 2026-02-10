// pages/api/cron/send-notifications.js
// API Cron - Envoi des notifications par email

import { connectToDatabase } from '../../../lib/mongodb';

export default async function handler(req, res) {
  // Vérification de la méthode
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // Vérification du token Vercel Cron (sécurité)
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  try {
    const { db } = await connectToDatabase();

    // 1. Récupérer les matchs non notifiés
    const matchsNonNotifies = await db.collection('matches').find({ 
      statut: 'nouveau',
      emailEnvoye: { $ne: true }
    }).toArray();

    let emailsEnvoyes = 0;
    const notifications = [];

    // 2. Pour chaque match, envoyer une notification
    for (const match of matchsNonNotifies) {
      try {
        // Récupérer les détails du bien
        const bien = await db.collection('biens').findOne({ 
          _id: match.bienId 
        });

        // Récupérer les détails de l'acheteur
        const acheteur = await db.collection('acheteurs').findOne({ 
          _id: match.acheteurId 
        });

        if (!bien || !acheteur) continue;

        // Préparer le contenu de l'email
        const emailData = {
          to: acheteur.email,
          subject: `🏡 Nouveau bien correspondant à vos critères (${match.score}% de compatibilité)`,
          html: genererEmailHTML(acheteur, bien, match)
        };

        // Envoyer l'email (à adapter selon votre service d'envoi)
        const emailEnvoye = await envoyerEmail(emailData);

        if (emailEnvoye) {
          // Marquer le match comme notifié
          await db.collection('matches').updateOne(
            { _id: match._id },
            { 
              $set: { 
                emailEnvoye: true,
                dateNotification: new Date()
              } 
            }
          );

          emailsEnvoyes++;
          notifications.push({
            matchId: match._id,
            email: acheteur.email,
            bienReference: bien.reference
          });
        }

      } catch (error) {
        console.error(`Erreur envoi email pour match ${match._id}:`, error);
      }
    }

    // 3. Logger l'exécution
    await db.collection('cron_logs').insertOne({
      type: 'send-notifications',
      date: new Date(),
      resultat: {
        matchsTraites: matchsNonNotifies.length,
        emailsEnvoyes: emailsEnvoyes
      }
    });

    return res.status(200).json({
      success: true,
      message: `Notifications envoyées`,
      stats: {
        matchsTraites: matchsNonNotifies.length,
        emailsEnvoyes: emailsEnvoyes
      },
      notifications: notifications
    });

  } catch (error) {
    console.error('Erreur cron send-notifications:', error);
    return res.status(500).json({ 
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
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 20px; margin: 20px 0; }
        .bien-card { background: white; padding: 20px; border-radius: 8px; margin: 10px 0; }
        .score { font-size: 24px; font-weight: bold; color: #10b981; }
        .detail { margin: 10px 0; }
        .label { font-weight: bold; color: #6b7280; }
        .cta { background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; 
               border-radius: 5px; display: inline-block; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏡 Nouveau bien correspondant !</h1>
        </div>
        
        <div class="content">
          <p>Bonjour ${acheteur.nom},</p>
          
          <p>Nous avons trouvé un bien qui correspond à vos critères de recherche :</p>
          
          <div class="bien-card">
            <div class="score">${match.score}% de compatibilité</div>
            
            <h2>${bien.type} - ${bien.reference}</h2>
            
            <div class="detail">
              <span class="label">📍 Adresse :</span> ${bien.adresse}, ${bien.ville}
            </div>
            
            <div class="detail">
              <span class="label">💰 Prix :</span> ${bien.prix.toLocaleString('fr-FR')} €
            </div>
            
            <div class="detail">
              <span class="label">📐 Surface :</span> ${bien.surface} m²
            </div>
            
            <div class="detail">
              <span class="label">🚪 Pièces :</span> ${bien.pieces}
            </div>
            
            ${bien.description ? `
              <div class="detail">
                <span class="label">📝 Description :</span>
                <p>${bien.description}</p>
              </div>
            ` : ''}
          </div>
          
          <center>
            <a href="${process.env.NEXT_PUBLIC_URL}/bien/${bien._id}" class="cta">
              Voir le bien en détail
            </a>
          </center>
          
          <p style="margin-top: 20px;">
            Ce bien correspond à vos critères de recherche. N'hésitez pas à nous contacter 
            pour plus d'informations ou pour organiser une visite.
          </p>
        </div>
        
        <div class="footer">
          <p>Vous recevez cet email car vous êtes inscrit sur notre plateforme de recherche immobilière.</p>
          <p>Pour vous désinscrire, <a href="${process.env.NEXT_PUBLIC_URL}/unsubscribe/${acheteur._id}">cliquez ici</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Fonction pour envoyer l'email (à adapter selon votre service)
async function envoyerEmail(emailData) {
  // OPTION 1 : Utiliser un service comme SendGrid, Mailgun, etc.
  // Exemple avec fetch vers une API d'envoi d'email
  
  try {
    // Si vous utilisez un service externe d'email
    if (process.env.EMAIL_API_URL) {
      const response = await fetch(process.env.EMAIL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EMAIL_API_KEY}`
        },
        body: JSON.stringify(emailData)
      });
      
      return response.ok;
    }
    
    // OPTION 2 : Mode développement - juste logger
    console.log('Email à envoyer:', emailData);
    return true; // Simuler l'envoi en dev
    
  } catch (error) {
    console.error('Erreur envoi email:', error);
    return false;
  }
}
