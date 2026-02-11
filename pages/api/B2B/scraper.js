// pages/api/B2B/scraper.js
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { platform, keywords, prospects } = req.body;

  if (!platform) {
    return res.status(400).json({ error: 'Platform requis' });
  }

  try {
    // Si des prospects sont fournis directement
    if (prospects && Array.isArray(prospects) && prospects.length > 0) {
      const insertData = prospects.map(prospect => ({
        first_name: prospect.firstName || prospect.first_name || '',
        last_name: prospect.lastName || prospect.last_name || '',
        email: prospect.email || '',
        company: prospect.company || '',
        position: prospect.position || '',
        linkedin_url: prospect.linkedinUrl || prospect.linkedin_url || '',
        phone: prospect.phone || '',
        industry: prospect.industry || '',
        source: platform || 'manual'
      }));

      const { data, error } = await supabaseAdmin
        .from('prospects')
        .insert(insertData)
        .select();

      if (error) throw error;

      return res.status(200).json({ 
        success: true, 
        prospects: data,
        count: data.length 
      });
    }

    // Sinon, message que le scraping automatique n'est pas encore implémenté
    return res.status(200).json({
      success: true,
      message: `Scraping ${platform} avec mots-clés: ${keywords || 'aucun'}`,
      info: 'Le scraping automatique sera implémenté prochainement. Utilisez l\'import manuel pour l\'instant.',
      prospects: []
    });

  } catch (error) {
    console.error('Scraper error:', error);
    res.status(500).json({ error: error.message });
  }
}
