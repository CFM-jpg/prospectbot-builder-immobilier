// pages/api/cron/email-cron.js
import { supabaseAdmin } from '../../../lib/supabase';

// Configuration Brevo
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export default async function handler(req, res) {
  // Vérifier que c'est bien Vercel Cron qui appelle
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.log('Unauthorized cron attempt');
    // En développement, on laisse passer pour les tests
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  console.log('🚀 Email CRON started at', new Date().toISOString());

  try {
    // 1. Récupérer tous les emails en attente
    const { data: pendingEmails, error: fetchError } = await supabaseAdmin
      .from('email_queue')
      .select(`
        *,
        campaign:email_campaigns(*),
        prospect:prospects(*),
        template:email_templates(*)
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .limit(50); // Limite pour éviter de surcharger

    if (fetchError) {
      console.error('Error fetching pending emails:', fetchError);
      throw fetchError;
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log('✅ No pending emails to send');
      return res.status(200).json({
        success: true,
        message: 'No emails to send',
        sent: 0
      });
    }

    console.log(`📧 Found ${pendingEmails.length} emails to send`);

    let sentCount = 0;
    let errorCount = 0;

    // 2. Envoyer chaque email
    for (const emailJob of pendingEmails) {
      try {
        // Vérifier que toutes les données nécessaires sont présentes
        if (!emailJob.prospect || !emailJob.template || !emailJob.campaign) {
          console.error('Missing data for email:', emailJob.id);
          await markEmailAsError(emailJob.id, 'Données manquantes (prospect/template/campaign)');
          errorCount++;
          continue;
        }

        // Vérifier que le prospect a un email
        if (!emailJob.prospect.email) {
          console.error('No email for prospect:', emailJob.prospect.id);
          await markEmailAsError(emailJob.id, 'Prospect sans adresse email');
          errorCount++;
          continue;
        }

        // Personnaliser le template avec les données du prospect
        const personalizedSubject = replaceVariables(
          emailJob.template.subject,
          emailJob.prospect
        );
        const personalizedBody = replaceVariables(
          emailJob.template.body,
          emailJob.prospect
        );

        // Envoyer via Brevo
        const brevoResponse = await fetch(BREVO_API_URL, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'api-key': BREVO_API_KEY
          },
          body: JSON.stringify({
            sender: {
              name: emailJob.campaign.title || 'NestLead',
              email: process.env.BREVO_SENDER_EMAIL || 'noreply@votreentreprise.com'
            },
            to: [{
              email: emailJob.prospect.email,
              name: `${emailJob.prospect.first_name || ''} ${emailJob.prospect.last_name || ''}`.trim()
            }],
            subject: personalizedSubject,
            htmlContent: personalizedBody.replace(/\n/g, '<br>')
          })
        });

        if (!brevoResponse.ok) {
          const errorData = await brevoResponse.json();
          console.error('Brevo API error:', errorData);
          await markEmailAsError(emailJob.id, `Erreur Brevo: ${errorData.message || 'Unknown'}`);
          errorCount++;
          continue;
        }

        const brevoData = await brevoResponse.json();
        console.log(`✅ Email sent to ${emailJob.prospect.email}`);

        // Marquer l'email comme envoyé dans la queue
        await supabaseAdmin
          .from('email_queue')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', emailJob.id);

        // Logger l'envoi
        await supabaseAdmin
          .from('email_logs')
          .insert([{
            campaign_id: emailJob.campaign_id,
            prospect_id: emailJob.prospect_id,
            template_id: emailJob.template_id,
            sent_at: new Date().toISOString(),
            status: 'sent',
            brevo_message_id: brevoData.messageId || null
          }]);

        sentCount++;

        // Pause de 200ms entre chaque envoi pour respecter les limites Brevo
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (emailError) {
        console.error('Error sending email:', emailError);
        await markEmailAsError(emailJob.id, emailError.message);
        errorCount++;
      }
    }

    console.log(`✅ CRON finished: ${sentCount} sent, ${errorCount} errors`);

    return res.status(200).json({
      success: true,
      sent: sentCount,
      errors: errorCount,
      message: `${sentCount} email(s) envoyé(s), ${errorCount} erreur(s)`
    });

  } catch (error) {
    console.error('Fatal CRON error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// ========== HELPER FUNCTIONS ==========

async function markEmailAsError(emailId, errorMessage) {
  await supabaseAdmin
    .from('email_queue')
    .update({
      status: 'error',
      error_message: errorMessage,
      sent_at: new Date().toISOString()
    })
    .eq('id', emailId);
}

function replaceVariables(text, prospect) {
  let result = text;
  
  const variables = {
    prenom: prospect.first_name || '',
    nom: prospect.last_name || '',
    email: prospect.email || '',
    entreprise: prospect.company || '',
    poste: prospect.position || '',
    secteur: prospect.industry || '',
    name: `${prospect.first_name || ''} ${prospect.last_name || ''}`.trim()
  };

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
    result = result.replace(regex, value);
  }

  return result;
}
