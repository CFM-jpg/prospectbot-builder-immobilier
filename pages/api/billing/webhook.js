import Stripe from 'stripe';
import { supabase } from '../../../lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = { api: { bodyParser: false } };

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

const PLAN_BY_PRICE = {
  [process.env.STRIPE_PRICE_PRO]: 'pro',
  [process.env.STRIPE_PRICE_AGENCE]: 'agence',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      // Paiement réussi → activer le plan
      case 'checkout.session.completed': {
        const session = event.data.object;
        const agentEmail = session.metadata?.agent_email;
        const plan = session.metadata?.plan;
        if (agentEmail && plan) {
          await supabase.from('agents').update({
            plan,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
          }).eq('email', agentEmail);
        }
        break;
      }

      // Abonnement mis à jour (upgrade/downgrade via portail)
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const priceId = subscription.items.data[0]?.price.id;
        const newPlan = PLAN_BY_PRICE[priceId];
        if (newPlan && subscription.customer) {
          await supabase.from('agents').update({ plan: newPlan })
            .eq('stripe_customer_id', subscription.customer);
        }
        break;
      }

      // Abonnement annulé → retour au gratuit
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        if (subscription.customer) {
          await supabase.from('agents').update({ plan: 'gratuit', stripe_subscription_id: null })
            .eq('stripe_customer_id', subscription.customer);
        }
        break;
      }

      // Paiement échoué → on peut notifier mais on ne dégrade pas immédiatement
      case 'invoice.payment_failed': {
        console.log('Payment failed for customer:', event.data.object.customer);
        break;
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
    return res.status(500).end();
  }

  res.status(200).json({ received: true });
}
