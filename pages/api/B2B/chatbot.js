// pages/api/B2B/chatbot.js
import { supabaseAdmin } from '../../../lib/supabase';
import { getSession } from '../../../lib/auth';

export default async function handler(req, res) {

  // Récupère l'agent connecté depuis le cookie de session
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Non authentifié' });
  const agentEmail = session.email;

  // GET — lister les chatbots de CET agent uniquement
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('chatbots')
        .select('*')
        .eq('agent_email', agentEmail)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json({ success: true, chatbots: data || [] });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // POST — créer un chatbot lié à cet agent
  if (req.method === 'POST') {
    try {
      const { name, color, avatar, welcomeMessage, questions } = req.body;

      if (!name || !welcomeMessage || !questions || questions.length === 0) {
        return res.status(400).json({ error: 'Nom, message de bienvenue et au moins une question requis.' });
      }

      const { data, error } = await supabaseAdmin
        .from('chatbots')
        .insert([{
          agent_email: agentEmail,
          name,
          color: color || '#d4a853',
          avatar: avatar || '🤖',
          welcome_message: welcomeMessage,
          questions: JSON.stringify(questions),
          status: 'active',
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      return res.status(200).json({ success: true, chatbot: data[0] });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // PUT — mettre à jour (vérifier que le chatbot appartient à cet agent)
  if (req.method === 'PUT') {
    try {
      const { id, name, color, avatar, welcomeMessage, questions } = req.body;
      if (!id) return res.status(400).json({ error: 'ID requis' });

      const { data, error } = await supabaseAdmin
        .from('chatbots')
        .update({ name, color, avatar, welcome_message: welcomeMessage, questions: JSON.stringify(questions), updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('agent_email', agentEmail)
        .select();

      if (error) throw error;
      return res.status(200).json({ success: true, chatbot: data[0] });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // DELETE — supprimer (vérifier que le chatbot appartient à cet agent)
  if (req.method === 'DELETE') {
    try {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID requis' });

      const { error } = await supabaseAdmin
        .from('chatbots')
        .delete()
        .eq('id', id)
        .eq('agent_email', agentEmail);

      if (error) throw error;
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
