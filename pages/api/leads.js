// pages/api/leads.js
// Sauvegarde des leads capturés sur la landing page

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, profile, type, source } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requis' });

  try {
    await supabase.from('leads').insert({
      email: email.toLowerCase().trim(),
      profile: profile || 'unknown',
      type: type || 'generic',
      source: source || 'landing',
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    // Non bloquant — la table leads peut ne pas encore exister
    console.warn('Lead save failed:', e.message);
  }

  // Envoyer une notif Brevo si configuré (optionnel)
  try {
    if (process.env.BREVO_API_KEY && process.env.LEAD_NOTIFICATION_EMAIL) {
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { name: 'ProspectBot', email: 'noreply@prospectbot.fr' },
          to: [{ email: process.env.LEAD_NOTIFICATION_EMAIL }],
          subject: `🎯 Nouveau lead ProspectBot — ${profile || 'inconnu'}`,
          htmlContent: `<p>Nouveau lead capturé :<br><strong>Email :</strong> ${email}<br><strong>Profil :</strong> ${profile}<br><strong>Source :</strong> ${source}</p>`,
        }),
      });
    }
  } catch {}

  return res.status(200).json({ success: true });
}

/*
── TABLE SUPABASE À CRÉER ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  profile TEXT,
  type TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_leads_email ON leads(email);
──────────────────────────────────────────────────────────────────────────────
*/
