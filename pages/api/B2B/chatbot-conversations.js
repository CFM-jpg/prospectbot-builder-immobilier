// pages/api/B2B/chatbot-conversations.js
import { supabaseAdmin } from '../../../lib/supabase';
import { getSession } from '../../../lib/auth';

// ─── Exécution d'un workflow ──────────────────────────────────────────────────
async function executeWorkflow(workflow, prospect) {
  for (const action of (workflow.actions || [])) {
    try {
      switch (action.type) {
        case 'send_email': {
          const BREVO_API_KEY = process.env.BREVO_API_KEY;
          if (!BREVO_API_KEY) break;
          await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
            body: JSON.stringify({
              sender: { name: 'ProspectBot', email: process.env.BREVO_SENDER_EMAIL || 'noreply@prospectbot.fr' },
              to: [{ email: prospect.email, name: prospect.name || 'Prospect' }],
              subject: action.subject || `Bienvenue ${prospect.name || ''} !`,
              htmlContent: action.content || `<p>Bonjour ${prospect.name || ''},</p><p>Merci pour votre intérêt. Un agent vous recontactera bientôt.</p>`,
            }),
          });
          break;
        }
        case 'notify_team': {
          const BREVO_API_KEY = process.env.BREVO_API_KEY;
          const TEAM_EMAIL = process.env.TEAM_NOTIFICATION_EMAIL;
          if (!BREVO_API_KEY || !TEAM_EMAIL) break;
          await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
            body: JSON.stringify({
              sender: { name: 'ProspectBot', email: process.env.BREVO_SENDER_EMAIL || 'noreply@prospectbot.fr' },
              to: [{ email: TEAM_EMAIL }],
              subject: `🔔 Nouveau prospect : ${prospect.email}`,
              htmlContent: `<h2>Nouveau prospect</h2><p><strong>Email :</strong> ${prospect.email}</p><p><strong>Qualification :</strong> ${prospect.qualificationReason || '—'}</p><p><strong>Workflow :</strong> ${workflow.name}</p>`,
            }),
          });
          break;
        }
        case 'tag_prospect': {
          if (prospect.email) {
            await supabaseAdmin.from('prospects').update({ notes: `[Tag: ${workflow.name}] ${prospect.qualificationReason || ''}` }).eq('email', prospect.email);
          }
          break;
        }
        default: break;
      }
    } catch (err) {
      console.error(`Erreur action ${action.type}:`, err.message);
    }
  }
}

// ─── Handler principal ────────────────────────────────────────────────────────
export default async function handler(req, res) {

  // GET — lister les conversations de CET agent uniquement
  if (req.method === 'GET') {
    const session = getSession(req);
    if (!session) return res.status(401).json({ error: 'Non authentifié' });

    try {
      const { data, error } = await supabaseAdmin
        .from('chatbot_conversations')
        .select('*')
        .eq('agent_email', session.email)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return res.status(200).json({ success: true, conversations: data || [] });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, chatbot_id, visitor_email, visitor_name } = req.body;
  if (!message) return res.status(400).json({ error: 'Message requis' });

  // Récupérer l'agent_email depuis le chatbot_id
  let agentEmail = null;
  if (chatbot_id) {
    const { data: bot } = await supabaseAdmin.from('chatbots').select('agent_email').eq('id', chatbot_id).single();
    if (bot) agentEmail = bot.agent_email;
  }

  try {
    const messageLower = message.toLowerCase();
    let qualified = false;
    let qualificationReason = '';
    let reply = '';

    const strongInterest = ['prix', 'tarif', 'coût', 'combien', 'budget', 'demo', 'démo', 'essai', 'acheter', 'achat', 'commander', 'souscrire', 'rdv', 'rendez-vous', 'appeler'];
    const mediumInterest = ['information', 'renseignement', 'en savoir plus', 'détails', 'fonctionnalité', 'projet', 'besoin', 'recherche', 'solution'];
    const lowInterest = ['bonjour', 'salut', 'hello', 'hi', 'merci', 'ok'];

    if (strongInterest.some(k => messageLower.includes(k))) {
      qualified = true;
      if (['prix', 'tarif', 'coût', 'combien', 'budget'].some(k => messageLower.includes(k))) {
        qualificationReason = 'Demande de tarification';
        reply = "Je comprends que vous souhaitez connaître nos tarifs. Un conseiller va vous contacter sous 2h. Puis-je avoir votre email pour qu'il vous recontacte ?";
      } else if (['demo', 'démo', 'essai'].some(k => messageLower.includes(k))) {
        qualificationReason = 'Demande de démonstration';
        reply = "Excellent choix ! Un membre de notre équipe vous contactera dans les 24h pour planifier une démo. Pouvez-vous me donner votre email ?";
      } else if (['acheter', 'achat', 'commander', 'souscrire'].some(k => messageLower.includes(k))) {
        qualificationReason = "Intention d'achat immédiate";
        reply = "Parfait ! Un conseiller va vous accompagner. Il vous contactera sous 1h. Merci de me communiquer votre email.";
      } else {
        qualificationReason = 'Demande de contact direct';
        reply = "Avec plaisir ! Je transfère votre demande à un conseiller. À quelle heure préférez-vous être contacté ?";
      }
    } else if (mediumInterest.some(k => messageLower.includes(k))) {
      qualified = true;
      qualificationReason = "Recherche d'information";
      reply = "Je serais ravi de vous aider ! Pouvez-vous préciser votre secteur d'activité et vos objectifs ? Un conseiller pourra vous guider de manière personnalisée.";
    } else if (lowInterest.some(k => messageLower.includes(k))) {
      qualificationReason = 'Message générique';
      reply = "Bonjour ! Je suis là pour vous aider. Comment puis-je vous renseigner ?";
    } else {
      qualificationReason = 'Non catégorisé';
      reply = "Merci pour votre message ! Pourriez-vous préciser votre demande ? Un conseiller vous répondra rapidement.";
    }

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const detectedEmail = message.match(emailRegex);
    const finalEmail = visitor_email || (detectedEmail ? detectedEmail[0] : null);

    const phoneRegex = /(\+33|0033|0)[1-9][\s.-]?(\d{2}[\s.-]?){4}/;
    const detectedPhone = message.match(phoneRegex);
    const finalPhone = detectedPhone ? detectedPhone[0] : null;

    const { data, error } = await supabaseAdmin
      .from('chatbot_conversations')
      .insert([{
        agent_email: agentEmail,
        chatbot_id: chatbot_id || null,
        visitor_email: finalEmail,
        visitor_name: visitor_name || null,
        visitor_phone: finalPhone,
        messages: [
          { role: 'user', content: message, timestamp: new Date().toISOString() },
          { role: 'assistant', content: reply, timestamp: new Date().toISOString() }
        ],
        qualified,
        qualification_reason: qualificationReason,
        qualification_score: qualified ? (strongInterest.some(k => messageLower.includes(k)) ? 100 : 50) : 0,
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;

    // Création prospect si qualifié
    if (qualified && finalEmail) {
      try {
        const emailParts = finalEmail.split('@')[0].split('.');
        await supabaseAdmin.from('prospects').insert([{
          agent_email: agentEmail,
          first_name: visitor_name || (emailParts[0] ? emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1) : ''),
          last_name: emailParts[1] ? emailParts[1].charAt(0).toUpperCase() + emailParts[1].slice(1) : '',
          email: finalEmail,
          phone: finalPhone || '',
          source: 'chatbot',
          notes: `Qualification: ${qualificationReason}`,
          created_at: new Date().toISOString()
        }]);
      } catch {}
    }

    // Exécution workflows new_prospect liés à cet agent
    if (finalEmail && agentEmail) {
      try {
        const { data: activeWorkflows } = await supabaseAdmin
          .from('workflows')
          .select('*')
          .eq('active', true)
          .eq('trigger', 'new_prospect')
          .eq('agent_email', agentEmail);

        if (activeWorkflows && activeWorkflows.length > 0) {
          const prospect = { email: finalEmail, name: visitor_name || '', qualificationReason, score: qualified ? 100 : 0 };
          Promise.all(activeWorkflows.map(w => executeWorkflow(w, prospect))).catch(() => {});
        }
      } catch {}
    }

    res.status(200).json({ success: true, reply, qualified, qualification_reason: qualificationReason, detected_email: finalEmail, conversation: data[0] });

  } catch (error) {
    res.status(500).json({ error: error.message, success: false });
  }
}
