// pages/api/scraper/immobilier.js
// Scraper basé sur les APIs officielles du gouvernement français
// - API Adresse (api-adresse.data.gouv.fr) : géocodage ville → code INSEE
// - DVF Etalab (api.cquest.org/dvf) : transactions immobilières réelles
// Zéro blocage, zéro clé API requise, données 100% réelles

import { supabaseAdmin } from '../../../lib/supabase';
import { getSession } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Non authentifié' });
  const agentEmail = session.email;

  const {
    ville = 'paris',
    prixMin = 0,
    prixMax = 1000000,
    surfaceMin = 0,
    type = 'appartement',
    source = 'dvf',
  } = req.method === 'POST' ? req.body : req.query;

  try {
    // Étape 1 : Résoudre la ville en code INSEE via API Adresse
    const codeCommune = await resolveCodeCommune(ville);
    if (!codeCommune) {
      return res.status(400).json({
        success: false,
        error: `Ville introuvable : "${ville}". Essayez avec le nom complet (ex: "Paris", "Lyon", "Marseille").`,
        annonces: [],
        stats: { annoncesTouvees: 0, nouvellesAnnonces: 0, source: 'dvf' },
      });
    }

    // Étape 2 : Récupérer les transactions DVF
    const annonces = await scraperDVF({
      codeCommune,
      ville,
      prixMin: parseInt(prixMin),
      prixMax: parseInt(prixMax),
      surfaceMin: parseInt(surfaceMin),
      type,
    });

    // Étape 3 : Sauvegarder en base
    let nouvellesAnnonces = 0;
    const annoncesInsereees = [];

    for (const annonce of annonces) {
      if (!annonce.prix || !annonce.titre) continue;
      try {
        const { data: existe } = await supabaseAdmin
          .from('biens')
          .select('id')
          .eq('reference', annonce.reference)
          .eq('agent_email', agentEmail)
          .maybeSingle();

        if (!existe) {
          const { data, error } = await supabaseAdmin
            .from('biens')
            .insert([{ ...annonce, agent_email: agentEmail }])
            .select('id')
            .single();

          if (!error && data) {
            nouvellesAnnonces++;
            annoncesInsereees.push({ ...annonce, id: data.id });
          }
        }
      } catch (err) {
        console.error('Erreur insert:', err.message);
      }
    }

    // Log
    try {
      await supabaseAdmin.from('scraper_logs').insert([{
        source: 'dvf',
        agent_email: agentEmail,
        date: new Date().toISOString(),
        parametres: { ville, prixMin, prixMax, surfaceMin, type },
        resultat: { annoncesTouvees: annonces.length, nouvellesAnnonces },
      }]);
    } catch {}

    return res.status(200).json({
      success: true,
      message: annonces.length === 0
        ? `Aucune transaction trouvée à ${ville} pour ces critères`
        : `${nouvellesAnnonces} nouvelles transactions importées (${annonces.length} trouvées)`,
      stats: { annoncesTouvees: annonces.length, nouvellesAnnonces, source: 'dvf' },
      annonces: annoncesInsereees,
    });

  } catch (error) {
    console.error('Erreur scraper DVF:', error.message);
    return res.status(500).json({
      success: false,
      error: `Erreur : ${error.message}`,
      annonces: [],
      stats: { annoncesTouvees: 0, nouvellesAnnonces: 0, source: 'dvf' },
    });
  }
}

// ─── Résolution ville → code INSEE ──────────────────────────────────────────

async function resolveCodeCommune(ville) {
  // Codes INSEE directs pour les grandes villes (évite un appel API)
  const CODES_DIRECTS = {
    paris: '75056', lyon: '69123', marseille: '13055', toulouse: '31555',
    nice: '06088', nantes: '44109', montpellier: '34172', strasbourg: '67482',
    bordeaux: '33063', lille: '59350', rennes: '35238', reims: '51454',
    toulon: '83137', grenoble: '38185', dijon: '21231', angers: '49007',
    nimes: '30189', villeurbanne: '69266', saint_etienne: '42218', le_havre: '76351',
    clermont_ferrand: '63113', aix_en_provence: '13001', brest: '29019',
    amiens: '80021', limoges: '87085', tours: '37261', perpignan: '66136',
    metz: '57463', besancon: '25056', orleans: '45234', rouen: '76540',
  };

  const key = ville.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_');

  if (CODES_DIRECTS[key]) return CODES_DIRECTS[key];

  // Fallback : API Adresse pour les autres villes
  try {
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(ville)}&type=municipality&limit=1`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.features?.[0]?.properties?.citycode || null;
  } catch {
    return null;
  }
}

// ─── Scraper DVF ─────────────────────────────────────────────────────────────

async function scraperDVF({ codeCommune, ville, prixMin, prixMax, surfaceMin, type }) {
  const typeLocal = type === 'appartement' ? 'Appartement' : 'Maison';

  // Paris, Lyon, Marseille → requête par département (les arrondissements ont chacun leur code)
  const deptMap = { '75056': '75', '69123': '69', '13055': '13' };
  const useDept = !!deptMap[codeCommune];
  const paramKey = useDept ? 'code_departement' : 'code_commune';
  const paramVal = useDept ? deptMap[codeCommune] : codeCommune;

  const url = `https://api.cquest.org/dvf?${paramKey}=${paramVal}&nature_mutation=Vente&limit=100`;

  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`DVF API HTTP ${res.status}`);

  const data = await res.json();
  const transactions = data.resultats || [];

  return transactions
    .filter(t => {
      if (!t.valeur_fonciere || !t.surface_reelle_bati) return false;
      if (t.type_local !== typeLocal) return false;
      if (t.valeur_fonciere < prixMin || t.valeur_fonciere > prixMax) return false;
      if (surfaceMin > 0 && t.surface_reelle_bati < surfaceMin) return false;
      return true;
    })
    .slice(0, 30)
    .map(t => {
      const dateStr = t.date_mutation || new Date().toISOString().slice(0, 10);
      const adresse = [t.no_voie, t.type_voie, t.voie].filter(Boolean).join(' ');
      const villeNom = t.nom_commune || ville;
      const cp = t.code_postal || '';
      const prix = Math.round(t.valeur_fonciere);
      const surface = Math.round(t.surface_reelle_bati);
      const pieces = t.nombre_pieces_principales || null;
      const prixM2 = surface > 0 ? Math.round(prix / surface) : null;

      return {
        source: 'dvf',
        reference: `DVF-${t.id_mutation || (adresse + dateStr).replace(/[^a-zA-Z0-9]/g, '').slice(-16)}`,
        titre: `${typeLocal} ${surface}m²${pieces ? ` · ${pieces}p` : ''} — ${villeNom}`,
        prix,
        adresse: adresse || '',
        ville: villeNom,
        code_postal: cp,
        surface,
        pieces,
        chambres: null,
        description: [
          `Transaction DVF du ${new Date(dateStr).toLocaleDateString('fr-FR')}`,
          prixM2 ? `Prix au m² : ${prixM2.toLocaleString('fr-FR')} €/m²` : '',
          t.nombre_lots ? `${t.nombre_lots} lot(s)` : '',
          cp ? `Code postal : ${cp}` : '',
        ].filter(Boolean).join(' · '),
        lien: `https://app.dvf.etalab.gouv.fr/?lat=${t.latitude || ''}&lng=${t.longitude || ''}&zoom=16`,
        image: null,
        type: type === 'appartement' ? 'appartement' : 'maison',
        statut: 'vendu',
        dpe: null,
        created_at: new Date().toISOString(),
      };
    });
}
