// pages/api/auth/register.js
import { supabaseAdmin } from '../../../lib/supabase';
import Stripe from 'stripe';
import crypto from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  pro: process.env.STRIPE_PRICE_PRO,
  agence: process.env.STRIPE_PRICE_AGENCE,
};

async function sendConfirmationEmail(name, email, plan, verificationToken) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/send-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, plan, verificationToken }),
    });
  } catch {}
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, password, plan } = req.body;

  if (!name || !email || !password || !plan) {
    return res.status(400).json({ error: 'Champs manquants.' });
  }

  // Email déjà utilisé ?
  const { data: existing } = await supabaseAdmin
    .from('agents')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();

  if (existing) {
    return res.status(409).json({ error: 'Cet email est déjà utilisé.' });
  }

  // Génère un token de vérification
  const verificationToken = crypto.randomBytes(32).toString('hex');

  // Plan gratuit — création directe
  if (plan === 'gratuit') {
    const { error } = await supabaseAdmin.from('agents').insert({
      email: email.toLowerCase(),
      password,
      name,
      role: 'agent',
      plan: 'gratuit',
      email_verified: false,
      verification_token: verificationToken,
    });
    if (error) return res.status(500).json({ error: 'Erreur lors de la création du compte.' });
    await sendConfirmationEmail(name, email, plan, verificationToken);
    return res.status(200).json({ success: true });
  }

  // Plan payant — Stripe Checkout
  const priceId = PRICE_IDS[plan];
  if (!priceId) return res.status(400).json({ error: 'Plan invalide.' });

  // Crée le compte en avance (plan gratuit, sera upgradé par le webhook)
  const { error: insertError } = await supabaseAdmin.from('agents').insert({
    email: email.toLowerCase(),
    password,
    name,
    role: 'agent',
    plan: 'gratuit',
    email_verified: false,
    verification_token: verificationToken,
  });

  if (insertError) return res.status(500).json({ error: 'Erreur lors de la création du compte.' });

  // Envoie l'email de confirmation avant la redirection Stripe
  await sendConfirmationEmail(name, email, plan, verificationToken);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email.toLowerCase(),
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/login?registered=1&plan=${plan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/register?cancelled=1`,
      metadata: { agent_email: email.toLowerCase(), plan },
    });
    return res.status(200).json({ checkoutUrl: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    await supabaseAdmin.from('agents').delete().eq('email', email.toLowerCase());
    return res.status(500).json({ error: 'Erreur de paiement. Réessaie.' });
  }
}
