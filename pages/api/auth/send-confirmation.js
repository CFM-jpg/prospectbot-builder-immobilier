// pages/api/auth/send-confirmation.js

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, plan } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Champs manquants.' });

  const planLabel = plan === 'pro' ? 'Pro' : plan === 'agence' ? 'Agence' : 'Gratuit';

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
        subject: '✅ Bienvenue sur ProspectBot — Votre compte est créé',
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

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f0f11,#1a1712);padding:36px 40px 28px;border-bottom:1px solid rgba(212,168,83,0.2);">
              <p style="margin:0;font-size:22px;color:#d4a853;font-style:italic;letter-spacing:1px;">ProspectBot</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <h1 style="margin:0 0 8px 0;font-size:28px;font-weight:300;color:#f0f0f0;letter-spacing:-0.5px;">
                Bienvenue, ${name} 👋
              </h1>
              <p style="margin:0 0 28px 0;font-size:14px;color:rgba(255,255,255,0.4);line-height:1.6;">
                Votre compte ProspectBot a bien été créé.
              </p>

              <!-- Plan badge -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:rgba(212,168,83,0.1);border:1px solid rgba(212,168,83,0.3);border-radius:8px;padding:12px 20px;">
                    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Votre plan</p>
                    <p style="margin:0;font-size:20px;color:#d4a853;font-weight:500;">${planLabel}</p>
                  </td>
                </tr>
              </table>

              <!-- Steps -->
              <p style="margin:0 0 16px 0;font-size:13px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:1px;">Pour commencer</p>

              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
                ${[
                  { n: '1', text: 'Connectez-vous à votre dashboard' },
                  { n: '2', text: 'Ajoutez vos premiers acheteurs' },
                  { n: '3', text: 'Lancez votre premier scraping' },
                ].map(s => `
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;height:28px;background:rgba(212,168,83,0.1);border:1px solid rgba(212,168,83,0.25);border-radius:50%;text-align:center;vertical-align:middle;">
                          <span style="font-size:11px;color:#d4a853;font-weight:600;">${s.n}</span>
                        </td>
                        <td style="padding-left:14px;font-size:13.5px;color:rgba(255,255,255,0.55);">${s.text}</td>
                      </tr>
                    </table>
                  </td>
                </tr>`).join('')}
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/login"
                      style="display:inline-block;background:linear-gradient(135deg,#8b6914,#d4a853);color:#0a0a0a;text-decoration:none;font-size:14px;font-weight:700;padding:14px 36px;border-radius:10px;letter-spacing:0.3px;">
                      Accéder à mon dashboard →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.2);line-height:1.6;">
                Vous recevez cet email car vous venez de créer un compte sur ProspectBot.<br/>
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
</html>
        `,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Brevo error:', err);
      // On ne bloque pas l'inscription si l'email échoue
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Send confirmation error:', err);
    return res.status(200).json({ success: true }); // Ne pas bloquer l'inscription
  }
}
