// pages/api/immobilier/prospecter.js
import { createClient } from '@supabase/supabase-js';
import { getSession } from '../../../lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function sendBrevoEmail({ to, subject, html }) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  if (!BREVO_API_KEY) { console.warn('[Prospecter] BREVO_API_KEY manquante'); return; }
  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'accept': 'application/json', 'api-key': BREVO_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({
      sender: { name: 'NestLead', email: 'noreply@nestlead.fr' },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = getSession(req);
  if (!user) return res.status(401).json({ error: 'Non authentifié' });

  const { vendeur } = req.body;
  if (!vendeur?.id) return res.status(400).json({ error: 'Vendeur requis' });

  try {
    // ── 1. Sauvegarder dans vendeurs_prospectes ───────────────────────────────
    const { error: insertError } = await supabase
      .from('vendeurs_prospectes')
      .upsert({
        user_id: user.id,
        vendeur_id: String(vendeur.id),
        adresse: vendeur.adresse || null,
        ville: vendeur.ville || null,
        code_commune: vendeur.code_commune || null,
        prix: vendeur.prix || null,
        surface: vendeur.surface || null,
        pieces: vendeur.pieces || null,
        type: vendeur.type || null,
        date_transaction: vendeur.date || vendeur.date_mutation || null,
        score: vendeur.score || null,
        score_label: vendeur.scoreLabel || null,
        prix_m2: vendeur.prixM2 || null,
        plus_value_estimee: vendeur.plusValueEstimee || null,
        source: vendeur.source || null,
        latitude: vendeur.latitude || null,
        longitude: vendeur.longitude || null,
        statut: 'a_contacter',
      }, { onConflict: 'user_id,vendeur_id' });

    if (insertError) {
      console.error('[Prospecter] Insert error:', insertError);
      return res.status(500).json({ error: 'Erreur sauvegarde' });
    }

    // ── 2. Créer dans prospects (CRM) ─────────────────────────────────────────
    const adresseFull = [vendeur.adresse, vendeur.ville].filter(Boolean).join(', ');
    await supabase.from('prospects').upsert({
      user_id: user.id,
      nom: adresseFull || `Vendeur ${vendeur.source?.toUpperCase() || 'DVF'}`,
      type: 'vendeur',
      statut: 'a_contacter',
      source: `vendeur_${vendeur.source || 'dvf'}`,
      score: vendeur.score || null,
      adresse: vendeur.adresse || null,
      ville: vendeur.ville || null,
      surface: vendeur.surface || null,
      prix_estime: vendeur.prix || null,
      notes: [
        vendeur.scoreLabel ? `Score : ${vendeur.scoreLabel} (${vendeur.score}/100)` : null,
        vendeur.prixM2 ? `Prix m² achat : ${vendeur.prixM2} €/m²` : null,
        vendeur.plusValueEstimee ? `Plus-value estimée : ${vendeur.plusValueEstimee}` : null,
        vendeur.date || vendeur.date_mutation ? `Transaction DVF : ${(vendeur.date || vendeur.date_mutation)?.substring(0, 10)}` : null,
      ].filter(Boolean).join(' | '),
    }, { onConflict: 'user_id,nom' })
    .then(({ error }) => { if (error) console.warn('[Prospecter] CRM warning:', error.message); });

    // ── 3. Email via Brevo ────────────────────────────────────────────────────
    if (user.email) {
      const dateStr = (vendeur.date || vendeur.date_mutation)?.substring(0, 10) || 'N/A';
      await sendBrevoEmail({
        to: user.email,
        subject: `🏠 Vendeur prospecté — ${vendeur.adresse || adresseFull || 'Nouveau contact'}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <div style="background:#1a1a2e;padding:20px;border-radius:8px 8px 0 0;">
              <h2 style="color:#fff;margin:0;">🏠 Nouveau vendeur prospecté</h2>
              <p style="color:#aaa;margin:4px 0 0;">NestLead — Alerte CRM</p>
            </div>
            <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:8px 0;color:#6b7280;width:140px;">Adresse</td><td style="font-weight:600;">${vendeur.adresse || '—'}</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;">Ville</td><td>${vendeur.ville || '—'}</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;">Type</td><td>${vendeur.type || '—'}</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;">Surface</td><td>${vendeur.surface ? `${vendeur.surface} m²` : '—'}</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;">Prix achat</td><td>${vendeur.prix ? `${Number(vendeur.prix).toLocaleString('fr-FR')} €` : '—'}</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;">Prix m²</td><td>${vendeur.prixM2 ? `${vendeur.prixM2} €/m²` : '—'}</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;">Plus-value est.</td><td style="color:#16a34a;font-weight:600;">${vendeur.plusValueEstimee || '—'}</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;">Date transaction</td><td>${dateStr}</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;">Score NestLead</td><td><strong>${vendeur.score || 0}/100</strong> — ${vendeur.scoreLabel || '—'}</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;">Source</td><td>${vendeur.source?.toUpperCase() || 'DVF'}</td></tr>
              </table>
              ${vendeur.latitude && vendeur.longitude ? `<div style="margin-top:16px;"><a href="https://www.google.com/maps?q=${vendeur.latitude},${vendeur.longitude}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Voir sur Maps ↗</a></div>` : ''}
              <p style="margin-top:24px;color:#9ca3af;font-size:12px;">Ce vendeur a été ajouté à votre pipeline CRM NestLead avec le statut "À contacter".</p>
            </div>
          </div>`,
      }).catch(e => console.warn('[Prospecter] Email warning:', e.message));
    }

    return res.status(200).json({ success: true, message: 'Vendeur sauvegardé, ajouté au CRM et email envoyé.' });

  } catch (err) {
    console.error('[Prospecter] Erreur:', err);
    return res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
}
