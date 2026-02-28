// pages/api/auth/register.js
import { supabaseAdmin } from '../../../lib/supabase';
import Stripe from 'stripe';
import crypto from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  pro: process.env.STRIPE_PRICE_PRO,
  agence: process.env.STRIPE_PRICE_AGENCE,
};

// Appel direct Brevo — sans passer par un fetch interne (ne fonctionne pas sur Vercel)
async function sendConfirmationEmail(name, email, plan, verificationToken) {
  const planLabel = plan === 'pro' ? 'Pro' : plan === 'agence' ? 'Agence' : 'Gratuit';
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${verificationToken}`;

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: 'ProspectBot',
          email: process.env.BREVO_SENDER_EMAIL,
        },
        to: [{ email, name }],
        subject: '✅ Confirmez votre adresse email — ProspectBot',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#080809;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080809;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#111113;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#0f0f11,#1a1712);padding:36px 40px 28px;border-bottom:1px solid rgba(212,168,83,0.2);">
              <p style="margin:0;font-size:22px;color:#d4a853;font-style:italic;letter-spacing:1px;">ProspectBot</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <h1 style="margin:0 0 8px 0;font-size:28px;font-weight:300;color:#f0f0f0;letter-spacing:-0.5px;">Bienvenue, ${name} 👋</h1>
              <p style="margin:0 0 28px 0;font-size:14px;color:rgba(255,255,255,0.4);line-height:1.6;">
                Votre compte ProspectBot <strong style="color:rgba(255,255,255,0.65);">Plan ${planLabel}</strong> a bien été créé.<br/>
                Il vous reste une étape : confirmer votre adresse email.
              </p>
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
                <tr>
                  <td align="center" style="background:rgba(212,168,83,0.06);border:1px solid rgba(212,168,83,0.2);border-radius:12px;padding:28px;">
                    <p style="margin:0 0 20px 0;font-size:13px;color:rgba(255,255,255,0.4);">Cliquez sur le bouton ci-dessous pour activer votre compte</p>
                    <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#8b6914,#d4a853);color:#0a0a0a;text-decoration:none;font-size:14px;font-weight:700;padding:14px 36px;border-radius:10px;letter-spacing:0.3px;">
                      Confirmer mon adresse email →
                    </a>
                    <p style="margin:20px 0 0 0;font-size:11px;color:rgba(255,255,255,0.2);">Ce lien expire dans 24 heures</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px 0;font-size:12px;color:rgba(255,255,255,0.2);">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
              <p style="margin:0;font-size:11px;color:rgba(212,168,83,0.5);word-break:break-all;">${verifyUrl}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.2);line-height:1.6;">
                Vous recevez cet email car vous venez de créer un compte sur ProspectBot.<br/>
                Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.<br/>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/mentions-legales" style="color:rgba(212,168,83,0.5);text-decoration:none;">Mentions légales</a>
                &nbsp;·&nbsp;
                <a href="mailto:contact@prospectbot.fr" style="color:rgba(212,168,83,0.5);text-decoration:none;">Contact</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Brevo error:', err);
    }
  } catch (err) {
    console.error('Send confirmation error:', err);
  }
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
