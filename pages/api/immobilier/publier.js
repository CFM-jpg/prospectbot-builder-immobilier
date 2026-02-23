// pages/api/immobilier/publier.js
// Génération IA du texte d'annonce + publication via APIs partenaires

import { getSession } from '../../../lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ─────────────────────────────────────────────
// Générateur de texte d'annonce via Claude API
// ─────────────────────────────────────────────
async function generateAnnonce(bien) {
  const prompt = `Tu es un expert en rédaction d'annonces immobilières. Génère une annonce professionnelle et attractive pour ce bien :

Type : ${bien.type} | ${bien.transaction}
Surface : ${bien.surface}m² | ${bien.pieces} pièces | ${bien.chambres} chambres
Prix : ${bien.prix.toLocaleString('fr-FR')}€${bien.transaction === 'location' ? '/mois' : ''}
Localisation : ${bien.ville} (${bien.codePostal})
DPE : ${bien.dpe} | GES : ${bien.ges}
Étage : ${bien.etage || 'RDC'} | Ascenseur : ${bien.ascenseur ? 'Oui' : 'Non'}
Charges : ${bien.charges || 0}€/mois | Dépôt de garantie : ${bien.depot || 0}€
Équipements : ${bien.equipements?.join(', ') || 'Non renseigné'}
Description libre : ${bien.descriptionLibre || ''}

Génère un JSON avec ces champs UNIQUEMENT (sans markdown, sans backticks) :
{
  "titre": "titre accrocheur 80 caractères max",
  "description": "description complète 500-800 caractères, professionnelle et vendeuse",
  "pointsForts": ["point fort 1", "point fort 2", "point fort 3", "point fort 4"],
  "descriptionCourte": "version courte 150 caractères pour LeBonCoin"
}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    return JSON.parse(text);
  } catch (e) {
    // Fallback si API non configurée
    return {
      titre: `${bien.type} ${bien.surface}m² - ${bien.ville}`,
      description: `${bien.type} de ${bien.surface}m² situé à ${bien.ville}. ${bien.pieces} pièces dont ${bien.chambres} chambres. DPE : ${bien.dpe}. ${bien.descriptionLibre || ''}`,
      pointsForts: [`${bien.surface}m²`, `${bien.pieces} pièces`, `DPE ${bien.dpe}`, bien.ville],
      descriptionCourte: `${bien.type} ${bien.surface}m² ${bien.pieces}p - ${bien.ville} - ${bien.prix.toLocaleString('fr-FR')}€`,
    };
  }
}

// ─────────────────────────────────────────────
// Connecteurs par plateforme
// ─────────────────────────────────────────────

// LeBonCoin Pro API (nécessite clé partenaire)
async function publierLeBonCoin(bien, texte) {
  const apiKey = process.env.LEBONCOIN_API_KEY;
  if (!apiKey) return { status: 'non_configure', message: 'Clé API LeBonCoin manquante' };

  try {
    const payload = {
      subject: texte.titre,
      body: texte.description,
      price: bien.prix,
      category_id: bien.transaction === 'location' ? '10' : '9', // 9=vente, 10=location
      location: { city: bien.ville, zipcode: bien.codePostal },
      attributes: {
        square: bien.surface.toString(),
        rooms: bien.pieces.toString(),
        energy_rate: bien.dpe,
        ges: bien.ges,
      },
      images: bien.photos || [],
    };

    const res = await fetch('https://api.leboncoin.fr/api/v1/ads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      return { status: 'publie', adId: data.adId, url: `https://www.leboncoin.fr/annonces/${data.adId}` };
    }
    return { status: 'erreur', message: `Erreur ${res.status}` };
  } catch (e) {
    return { status: 'erreur', message: e.message };
  }
}

// SeLoger / BienIci (groupe SeLoger - même API)
async function publierSeLoger(bien, texte, plateforme = 'seloger') {
  const apiKey = process.env.SELOGER_API_KEY;
  if (!apiKey) return { status: 'non_configure', message: 'Clé API SeLoger manquante' };

  try {
    // Format XML standard flux SeLoger
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<annonces>
  <annonce>
    <reference>${bien.id || Date.now()}</reference>
    <typeTransaction>${bien.transaction === 'location' ? 'L' : 'V'}</typeTransaction>
    <typeBien>${bien.type}</typeBien>
    <titre>${texte.titre}</titre>
    <descriptif>${texte.description}</descriptif>
    <prix>${bien.prix}</prix>
    <surface>${bien.surface}</surface>
    <nbPieces>${bien.pieces}</nbPieces>
    <nbChambres>${bien.chambres}</nbChambres>
    <codePostal>${bien.codePostal}</codePostal>
    <ville>${bien.ville}</ville>
    <dpe>${bien.dpe}</dpe>
    <ges>${bien.ges}</ges>
    <charges>${bien.charges || 0}</charges>
    <photos>${(bien.photos || []).map(p => `<photo>${p}</photo>`).join('')}</photos>
  </annonce>
</annonces>`;

    const res = await fetch(`https://flux.seloger.com/api/v2/annonces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'X-Api-Key': apiKey,
      },
      body: xml,
    });

    if (res.ok) {
      const data = await res.json();
      const domain = plateforme === 'bienici' ? 'bienici.com' : 'seloger.com';
      return { status: 'publie', adId: data.id, url: `https://www.${domain}/annonce/${data.id}` };
    }
    return { status: 'erreur', message: `Erreur ${res.status}` };
  } catch (e) {
    return { status: 'erreur', message: e.message };
  }
}

// PAP.fr — pas d'API, génère un lien pré-rempli
function getLienPAP(bien, texte) {
  const params = new URLSearchParams({
    typebien: bien.type === 'appartement' ? 'appartement' : 'maison',
    typeannonce: bien.transaction === 'location' ? 'location' : 'vente',
    surface: bien.surface,
    nbpieces: bien.pieces,
    prix: bien.prix,
    codepostal: bien.codePostal,
    ville: bien.ville,
    texte: texte.descriptionCourte,
  });
  return {
    status: 'lien_direct',
    url: `https://www.pap.fr/deposer-annonce?${params.toString()}`,
    message: 'PAP ne propose pas d\'API — cliquez pour pré-remplir le formulaire',
  };
}

// Leboncoin lien de secours sans API
function getLienLeBonCoin(bien, texte) {
  return {
    status: 'lien_direct',
    url: `https://www.leboncoin.fr/deposer-annonce`,
    texteGenere: texte,
    message: 'Copiez le texte généré et publiez manuellement',
  };
}

// SeLoger lien de secours sans API
function getLienSeLoger(bien, texte) {
  return {
    status: 'lien_direct',
    url: `https://www.seloger.com/deposer-annonce`,
    texteGenere: texte,
    message: 'Accès pro requis — copiez le texte généré',
  };
}

// ─────────────────────────────────────────────
// Handler principal
// ─────────────────────────────────────────────
export default async function handler(req, res) {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Non authentifié' });

  if (req.method === 'POST') {
    const { action, bien, plateformes } = req.body;

    // Générer le texte d'annonce
    if (action === 'generer') {
      try {
        const texte = await generateAnnonce(bien);
        return res.status(200).json({ success: true, texte });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    // Publier sur les plateformes sélectionnées
    if (action === 'publier') {
      const texte = bien.texteGenere;
      const resultats = {};

      const taches = plateformes.map(async plateforme => {
        switch (plateforme) {
          case 'leboncoin':
            resultats.leboncoin = process.env.LEBONCOIN_API_KEY
              ? await publierLeBonCoin(bien, texte)
              : getLienLeBonCoin(bien, texte);
            break;
          case 'seloger':
            resultats.seloger = process.env.SELOGER_API_KEY
              ? await publierSeLoger(bien, texte, 'seloger')
              : getLienSeLoger(bien, texte);
            break;
          case 'bienici':
            resultats.bienici = process.env.SELOGER_API_KEY
              ? await publierSeLoger(bien, texte, 'bienici')
              : { status: 'lien_direct', url: 'https://www.bienici.com/deposer-annonce', message: 'Accès pro requis' };
            break;
          case 'pap':
            resultats.pap = getLienPAP(bien, texte);
            break;
          case 'logic_immo':
            resultats.logic_immo = { status: 'lien_direct', url: 'https://www.logic-immo.com/deposer-annonce', message: 'Clé API Logic-Immo requise' };
            break;
        }
      });

      await Promise.all(taches);

      // Sauvegarder en base
      try {
        await supabase.from('annonces_publiees').insert({
          agent_email: session.email,
          bien_data: bien,
          texte_genere: texte,
          resultats_publication: resultats,
          created_at: new Date().toISOString(),
        });
      } catch (e) {
        // Pas bloquant si la table n'existe pas encore
        console.warn('Supabase insert failed:', e.message);
      }

      return res.status(200).json({ success: true, resultats });
    }

    return res.status(400).json({ error: 'Action inconnue' });
  }

  // GET — récupérer les annonces publiées
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('annonces_publiees')
        .select('*')
        .eq('agent_email', session.email)
        .order('created_at', { ascending: false });

      if (error) return res.status(200).json({ annonces: [] });
      return res.status(200).json({ annonces: data || [] });
    } catch (e) {
      return res.status(200).json({ annonces: [] });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}
