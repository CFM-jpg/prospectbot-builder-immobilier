import { supabase } from './supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { prospectIds, subject, body } = req.body

  try {
    const brevoApiKey = process.env.BREVO_API_KEY

    const { data: prospects } = await supabase
      .from('prospects')
      .select('*')
      .in('id', prospectIds)

    let sent = 0
    for (const prospect of prospects) {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: { email: 'contact@prospectbot.com', name: 'ProspectBot' },
          to: [{ email: prospect.email }],
          subject: subject,
          htmlContent: body
        })
      })

      if (response.ok) sent++
    }

    res.status(200).json({ success: true, sent })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}