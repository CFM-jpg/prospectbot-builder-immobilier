// api/send-email.js - Vercel Serverless Function pour Brevo 
// Force redeploy - env vars loaded
export default async function handler(req, res) {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Gestion OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Vérifier que c'est une requête POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { senderName, senderEmail, subject, template, recipients } = req.body;

    // Validation des données
    if (!senderName || !senderEmail || !subject || !template || !recipients || recipients.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Données manquantes. Veuillez fournir senderName, senderEmail, subject, template et recipients.' 
      });
    }

    // Récupérer la clé API depuis les variables d'environnement
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    
    if (!BREVO_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        error: 'Clé API Brevo non configurée. Ajoutez BREVO_API_KEY dans les variables d\'environnement Vercel.' 
      });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Envoyer un email à chaque destinataire
    for (const recipient of recipients) {
      try {
        // Remplacer les variables dans le template
        let personalizedContent = template
          .replace(/{name}/g, recipient.name || 'Prospect')
          .replace(/{email}/g, recipient.email || '')
          .replace(/{role}/g, recipient.role || '')
          .replace(/{company}/g, recipient.company || '');

        // Préparer la requête Brevo
        const brevoPayload = {
          sender: {
            name: senderName,
            email: senderEmail
          },
          to: [
            {
              email: recipient.email,
              name: recipient.name || 'Prospect'
            }
          ],
          subject: subject,
          htmlContent: personalizedContent.replace(/\n/g, '<br>')
        };

        // Appel API Brevo
        const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': BREVO_API_KEY,
            'content-type': 'application/json'
          },
          body: JSON.stringify(brevoPayload)
        });

        if (brevoResponse.ok) {
          successCount++;
        } else {
          const errorData = await brevoResponse.json();
          errorCount++;
          errors.push({
            recipient: recipient.email,
            error: errorData.message || 'Erreur inconnue'
          });
        }

        // Délai entre chaque email (rate limiting)
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (emailError) {
        errorCount++;
        errors.push({
          recipient: recipient.email,
          error: emailError.message
        });
      }
    }

    // Réponse finale
    return res.status(200).json({
      success: true,
      sent: successCount,
      failed: errorCount,
      total: recipients.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Erreur serveur:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur serveur interne'
    });
  }
}
