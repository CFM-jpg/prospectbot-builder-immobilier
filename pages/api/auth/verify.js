// pages/api/auth/verify.js
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) return res.redirect('/login?error=token_invalide');

  const { data: agent, error } = await supabaseAdmin
    .from('agents')
    .select('id, email_verified')
    .eq('verification_token', token)
    .single();

  if (error || !agent) return res.redirect('/login?error=token_invalide');
  if (agent.email_verified) return res.redirect('/login?verified=already');

  await supabaseAdmin
    .from('agents')
    .update({ email_verified: true, verification_token: null })
    .eq('verification_token', token);

  return res.redirect('/login?verified=1');
}
