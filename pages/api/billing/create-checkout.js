// pages/api/billing/create-checkout.js
import { getSession } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  pro: process.env.STRIPE_PRICE_PRO,
  agence: process.env.STRIPE_PRICE_AGENCE,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Non authentifié.' });

  const { plan } = req.body;
  const priceId = PRICE_IDS[plan];
  if (!priceId) return res.status(400).json({ error: 'Plan invalide.' });

  // Récupère l'agent depuis Supabase
  const { data: agent } = await supabaseAdmin
    .from('agents')
    .select('email, name, stripe_customer_id')
    .eq('email', session.email)
    .single();

  if (!agent) return res.status(404).json({ error: 'Agent introuvable.' });

  try {
    const checkoutParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/immobilier?upgraded=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade?cancelled=1`,
      metadata: { agent_email: agent.email, plan },
    };

    // Si l'agent a déjà un customer Stripe, on le réutilise
    if (agent.stripe_customer_id) {
      checkoutParams.customer = agent.stripe_customer_id;
    } else {
      checkoutParams.customer_email = agent.email;
    }

    const stripeSession = await stripe.checkout.sessions.create(checkoutParams);
    return res.status(200).json({ checkoutUrl: stripeSession.url });
  } catch (err) {
    console.error('Stripe error:', err);
    return res.status(500).json({ error: 'Erreur Stripe. Réessaie.' });
  }
}
