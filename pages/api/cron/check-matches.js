// pages/api/cron/check-matches.js
// API Cron - Vérification quotidienne des matchs automatiques

import { connectToDatabase } from '../../../lib/mongodb';

export default async function handler(req, res) {
  // Vérification de la méthode
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // Vérification du token Vercel Cron (sécurité)
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  try {
    const { db } = await connectToDatabase();

    // 1. Récupérer tous les acheteurs actifs
    const acheteurs = await db.collection('acheteurs').find({ 
      statut: 'actif' 
    }).toArray();

    // 2. Récupérer tous les biens disponibles
    const biens = await db.collection('biens').find({ 
      statut: 'disponible' 
    }).toArray();

    let nouveauxMatchs = 0;
    const matchsCreated = [];

    // 3. Pour chaque acheteur, chercher les matchs
    for (const acheteur of acheteurs) {
      for (const bien of biens) {
        // Vérifier si le match existe déjà
        const matchExistant = await db.collection('matches').findOne({
          acheteurId: acheteur._id,
          bienId: bien._id
        });

        if (matchExistant) continue;

        // Calculer le score de matching
        const score = calculerScore(acheteur, bien);

        // Si le score est suffisant (>= 60%), créer le match
        if (score >= 60) {
          const nouveauMatch = {
            acheteurId: acheteur._id,
            bienId: bien._id,
            score: score,
            statut: 'nouveau',
            dateCreation: new Date(),
            acheteurNom: acheteur.nom,
            acheteurEmail: acheteur.email,
            bienReference: bien.reference,
            bienAdresse: bien.adresse,
            bienPrix: bien.prix,
            bienType: bien.type
          };

          await db.collection('matches').insertOne(nouveauMatch);
          nouveauxMatchs++;
          matchsCreated.push(nouveauMatch);
        }
      }
    }

    // 4. Logger l'exécution
    await db.collection('cron_logs').insertOne({
      type: 'check-matches',
      date: new Date(),
      resultat: {
        acheteursAnalyses: acheteurs.length,
        biensAnalyses: biens.length,
        nouveauxMatchs: nouveauxMatchs
      }
    });

    return res.status(200).json({
      success: true,
      message: `Vérification terminée`,
      stats: {
        acheteursAnalyses: acheteurs.length,
        biensAnalyses: biens.length,
        nouveauxMatchs: nouveauxMatchs
      },
      matchs: matchsCreated
    });

  } catch (error) {
    console.error('Erreur cron check-matches:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de la vérification des matchs',
      details: error.message 
    });
  }
}

// Fonction de calcul du score de matching
function calculerScore(acheteur, bien) {
  let score = 0;
  let criteres = 0;

  // 1. Budget (30%)
  if (bien.prix <= acheteur.budgetMax) {
    score += 30;
  } else if (bien.prix <= acheteur.budgetMax * 1.1) {
    score += 15; // Dépassement léger acceptable
  }
  criteres++;

  // 2. Type de bien (20%)
  if (acheteur.typeBien && acheteur.typeBien.includes(bien.type)) {
    score += 20;
  }
  criteres++;

  // 3. Localisation (20%)
  if (acheteur.villes && acheteur.villes.some(ville => 
    bien.ville.toLowerCase().includes(ville.toLowerCase())
  )) {
    score += 20;
  }
  criteres++;

  // 4. Surface (15%)
  if (acheteur.surfaceMin && acheteur.surfaceMax) {
    if (bien.surface >= acheteur.surfaceMin && bien.surface <= acheteur.surfaceMax) {
      score += 15;
    } else if (bien.surface >= acheteur.surfaceMin * 0.9) {
      score += 7;
    }
  } else {
    score += 15; // Pas de critère = compatible
  }
  criteres++;

  // 5. Nombre de pièces (15%)
  if (acheteur.piecesMin) {
    if (bien.pieces >= acheteur.piecesMin) {
      score += 15;
    } else if (bien.pieces >= acheteur.piecesMin - 1) {
      score += 7;
    }
  } else {
    score += 15; // Pas de critère = compatible
  }
  criteres++;

  return Math.round(score);
}
