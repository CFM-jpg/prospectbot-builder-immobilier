// pages/api/cron/workflow-cron.js
import { supabaseAdmin } from '../../../lib/supabase';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'noreply@prospectbot.fr';

export default async function handler(req, res) {
  // Sécurité Vercel Cron
  const authHeader = req.headers.authorization;
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('Workflow CRON started at', new Date().toISOString());

  let executed = 0;
  let errors = 0;

  try {
    // Récupérer tous les workflows actifs
    const { data: workflows, error: wfError } = await supabaseAdmin
      .from('workflows')
      .select('*')
      .eq('active', true);

    if (wfError) throw wfError;
    if (!workflows || workflows.length === 0) {
      return res.status(200).json({ success: true, message: 'Aucun workflow actif', executed: 0 });
    }

    console.log(`${workflows.length} workflow(s) actif(s) trouvé(s)`);

    for (const workflow of workflows) {
      try {
        if (workflow.trigger === 'new_prospect') {
          const count = await handleNewProspectWorkflow(workflow);
          executed += count;
        } else if (workflow.trigger === 'new_match') {
          const count = await handleNewMatchWorkflow(workflow);
          executed += count;
        }
      } catch (err) {
        console.error(`Erreur workflow ${workflow.id}:`, err.message);
        errors++;
      }
    }

    console.log(`Workflow CRON terminé: ${executed} actions, ${errors} erreurs`);
    return res.status(200).json({ success: true, executed, errors });

  } catch (error) {
    console.error('Erreur fatale workflow CRON:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// ── Trigger: nouveau prospect chatbot ─────────────────────────────────────────

async function handleNewProspectWorkflow(workflow) {
  // Récupérer les conversations non traitées par ce workflow pour cet agent
  const { data: conversations, error } = await supabaseAdmin
    .from('chatbot_conversations')
    .select('*')
    .eq('agent_email', workflow.agent_email)
    .eq('workflow_processed', false)
    .not('visitor_email', 'is', null)
    .order('created_at', { ascending: true })
    .limit(20);

  if (error) throw error;
  if (!conversations || conversations.length === 0) return 0;

  let count = 0;

  for (const conv of conversations) {
    try {
      // Envoyer email de bienvenue au prospect
      await sendEmail({
        to: conv.visitor_email,
        toName: conv.visitor_email.split('@')[0],
        fromName: 'ProspectBot',
        fromEmail: BREVO_SENDER_EMAIL,
        subject: 'Merci pour votre message',
        body: `Bonjour,\n\nMerci d'avoir contacté notre service. Nous avons bien reçu votre message et nous vous répondrons dans les plus brefs délais.\n\nCordialement,\nL'équipe`,
      });

      // Envoyer notification à l'agent
      await sendEmail({
        to: workflow.agent_email,
        toName: 'Agent',
        fromName: 'ProspectBot',
        fromEmail: BREVO_SENDER_EMAIL,
        subject: `Nouveau prospect : ${conv.visitor_email}`,
        body: `Bonjour,\n\nUn nouveau prospect a contacté votre chatbot.\n\nEmail : ${conv.visitor_email}\nDate : ${new Date(conv.created_at).toLocaleString('fr-FR')}\nStatut : ${conv.qualified ? 'Qualifié' : 'Non qualifié'}\n\nConnectez-vous à ProspectBot pour voir la conversation complète.\n\nCordialement,\nProspectBot`,
      });

      // Marquer comme traité
      await supabaseAdmin
        .from('chatbot_conversations')
        .update({ workflow_processed: true, workflow_processed_at: new Date().toISOString() })
        .eq('id', conv.id);

      count++;
      await delay(200);
    } catch (err) {
      console.error(`Erreur traitement conversation ${conv.id}:`, err.message);
    }
  }

  return count;
}

// ── Trigger: nouveau match immobilier ─────────────────────────────────────────

async function handleNewMatchWorkflow(workflow) {
  // Récupérer les matches non notifiés pour cet agent
  const { data: matches, error } = await supabaseAdmin
    .from('matches')
    .select(`
      *,
      acheteur:acheteurs(*),
      bien:biens(*)
    `)
    .eq('agent_email', workflow.agent_email)
    .eq('workflow_notified', false)
    .gte('score', 60)
    .order('created_at', { ascending: true })
    .limit(20);

  if (error) throw error;
  if (!matches || matches.length === 0) return 0;

  let count = 0;

  for (const match of matches) {
    try {
      if (!match.acheteur?.email || !match.bien) continue;

      const bien = match.bien;
      const acheteur = match.acheteur;

      // Email à l'acheteur
      await sendEmail({
        to: acheteur.email,
        toName: acheteur.nom || acheteur.email,
        fromName: 'ProspectBot Immobilier',
        fromEmail: BREVO_SENDER_EMAIL,
        subject: `Nouveau bien correspondant à vos critères — ${bien.titre || bien.ville || 'Bien immobilier'}`,
        body: `Bonjour ${acheteur.nom || ''},\n\nNous avons trouvé un bien qui correspond à vos critères de recherche.\n\n${bien.titre || 'Bien immobilier'}\nVille : ${bien.ville || 'N/A'}\nPrix : ${bien.prix ? bien.prix.toLocaleString('fr-FR') + ' €' : 'N/A'}\nSurface : ${bien.surface ? bien.surface + ' m²' : 'N/A'}\nScore de correspondance : ${match.score}%\n\nConnectez-vous à votre espace pour voir tous les détails.\n\nCordialement,\nProspectBot`,
      });

      // Notification à l'agent
      await sendEmail({
        to: workflow.agent_email,
        toName: 'Agent',
        fromName: 'ProspectBot',
        fromEmail: BREVO_SENDER_EMAIL,
        subject: `Match ${match.score}% — ${acheteur.nom || acheteur.email} / ${bien.titre || bien.ville}`,
        body: `Bonjour,\n\nUn nouveau match a été détecté.\n\nAcheteur : ${acheteur.nom || acheteur.email}\nBien : ${bien.titre || bien.ville}\nScore : ${match.score}%\n\nL'acheteur a été notifié automatiquement.\n\nCordialement,\nProspectBot`,
      });

      // Marquer comme notifié
      await supabaseAdmin
        .from('matches')
        .update({ workflow_notified: true, workflow_notified_at: new Date().toISOString() })
        .eq('id', match.id);

      count++;
      await delay(200);
    } catch (err) {
      console.error(`Erreur traitement match ${match.id}:`, err.message);
    }
  }

  return count;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function sendEmail({ to, toName, fromName, fromEmail, subject, body }) {
  if (!BREVO_API_KEY) throw new Error('BREVO_API_KEY non configurée');

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to, name: toName }],
      subject,
      htmlContent: body.replace(/\n/g, '<br>'),
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Erreur Brevo');
  }

  return await res.json();
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
