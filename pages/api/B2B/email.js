// pages/api/B2B/email.js
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prospectIds, subject, body } = req.body;

  if (!prospectIds || !Array.isArray(prospectIds) || prospectIds.length === 0) {
    return res.status(400).json({ error: 'prospectIds requis (array)' });
  }

  if (!subject || !body) {
    return res.status(400).json({ error: 'subject et body requis' });
  }

  try {
    const brevoApiKey = process.env.BREVO_API_KEY;

    if (!brevoApiKey) {
      return res.status(500).json({ error: 'BREVO_API_KEY non configurée' });
    }

    const { data: prospects, error } = await supabaseAdmin
      .from('prospects')
      .select('*')
      .in('id', prospectIds);

    if (error) throw error;

    if (!prospects || prospects.length === 0) {
      return res.status(404).json({ error: 'Aucun prospect trouvé' });
    }

    let sent = 0;
    const errors = [];

    for (const prospect of prospects) {
      if (!prospect.email) {
        errors.push({ prospectId: prospect.id, error: 'Pas d\'email' });
        continue;
      }

      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': brevoApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sender: { 
              email: process.env.BREVO_SENDER_EMAIL || 'contact@prospectbot.com', 
              name: 'ProspectBot' 
            },
            to: [{ email: prospect.email, name: `${prospect.first_name || ''} ${prospect.last_name || ''}`.trim() }],
            subject: subject,
            htmlContent: body.replace(/\n/g, '<br>')
          })
        });

        if (response.ok) {
          sent++;
        } else {
          const errorData = await response.json();
          errors.push({ 
            prospectId: prospect.id, 
            email: prospect.email, 
            error: errorData.message || 'Erreur Brevo' 
          });
        }

        // Pause de 100ms entre chaque envoi
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (emailError) {
        errors.push({ 
          prospectId: prospect.id, 
          email: prospect.email, 
          error: emailError.message 
        });
      }
    }

    res.status(200).json({ 
      success: true, 
      sent,
      total: prospects.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Erreur email:', error);
    res.status(500).json({ error: error.message });
  }
}
