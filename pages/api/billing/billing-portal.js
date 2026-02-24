import { getSession } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Non authentifié.' });

  // Récupère le stripe_customer_id de l'agent
  const { data: agent } = await supabase
    .from('agents')
    .select('stripe_customer_id, plan')
    .eq('email', session.email)
    .single();

  if (!agent?.stripe_customer_id) {
    return res.status(400).json({ error: 'Aucun abonnement actif trouvé.' });
  }

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: agent.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/immobilier`,
    });
    return res.status(200).json({ url: portalSession.url });
  } catch (err) {
    console.error('Portal error:', err);
    return res.status(500).json({ error: 'Erreur Stripe.' });
  }
}
