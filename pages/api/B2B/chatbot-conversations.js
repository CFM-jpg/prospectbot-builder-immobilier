// pages/api/B2B/chatbot-conversations.js
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message requis' });
  }

  try {
    const reply = 'Merci pour votre message ! Un conseiller vous contactera.';

    const { data, error } = await supabaseAdmin
      .from('chatbot_conversations')
      .insert({ 
        messages: [
          { role: 'user', content: message },
          { role: 'assistant', content: reply }
        ],
        qualified: false 
      })
      .select();

    if (error) throw error;

    res.status(200).json({ success: true, reply, conversation: data });
  } catch (error) {
    console.error('Erreur chatbot conversation:', error);
    res.status(500).json({ error: error.message });
  }
}
