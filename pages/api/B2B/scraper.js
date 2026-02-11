import { supabase } from './supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { platform, keywords } = req.body

  try {
    const { data: user } = await supabase.auth.getUser();
    const userId = user?.user?.id || '57a6dbda-b934-4a13-bafd-a28fb9dfbe0f'; // Fallback sur votre user_id

    const { data, error } = await supabase
        .from('prospects')
        .insert([{
            first_name: prospect.firstName,
            last_name: prospect.lastName,
            email: prospect.email,
            company: prospect.company,
            position: prospect.position,
            linkedin_url: prospect.linkedinUrl,
            user_id: userId
        }])
        .select();

    if (error) throw error;

    res.status(200).json({ success: true, prospects: data });
} catch (error) {
    console.error('Scraper error:', error);
    res.status(500).json({ error: error.message });
}