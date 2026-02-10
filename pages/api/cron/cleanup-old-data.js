// pages/api/cron/cleanup-old-data.js
// API Cron - Nettoyage des données anciennes

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
    const maintenant = new Date();
    const stats = {
      biensArchives: 0,
      matchsSupprimes: 0,
      logsSupprimes: 0
    };

    // 1. Archiver les biens vendus depuis plus de 90 jours
    const date90Jours = new Date(maintenant);
    date90Jours.setDate(date90Jours.getDate() - 90);

    const biensAArchiver = await db.collection('biens').updateMany(
      {
        statut: 'vendu',
        dateVente: { $lt: date90Jours },
        archive: { $ne: true }
      },
      {
        $set: { 
          archive: true,
          dateArchivage: maintenant
        }
      }
    );
    stats.biensArchives = biensAArchiver.modifiedCount;

    // 2. Supprimer les matchs "rejetés" depuis plus de 30 jours
    const date30Jours = new Date(maintenant);
    date30Jours.setDate(date30Jours.getDate() - 30);

    const matchsSupprimes = await db.collection('matches').deleteMany({
      statut: 'rejete',
      dateRejet: { $lt: date30Jours }
    });
    stats.matchsSupprimes = matchsSupprimes.deletedCount;

    // 3. Supprimer les logs de cron de plus de 180 jours
    const date180Jours = new Date(maintenant);
    date180Jours.setDate(date180Jours.getDate() - 180);

    const logsSupprimes = await db.collection('cron_logs').deleteMany({
      date: { $lt: date180Jours }
    });
    stats.logsSupprimes = logsSupprimes.deletedCount;

    // 4. Désactiver les acheteurs inactifs depuis plus de 6 mois
    const date6Mois = new Date(maintenant);
    date6Mois.setMonth(date6Mois.getMonth() - 6);

    const acheteursDesactives = await db.collection('acheteurs').updateMany(
      {
        statut: 'actif',
        $or: [
          { derniereConnexion: { $lt: date6Mois } },
          { derniereConnexion: { $exists: false } }
        ]
      },
      {
        $set: { 
          statut: 'inactif',
          raisonInactivite: 'Inactivité de plus de 6 mois',
          dateDesactivation: maintenant
        }
      }
    );
    stats.acheteursDesactives = acheteursDesactives.modifiedCount;

    // 5. Logger l'exécution
    await db.collection('cron_logs').insertOne({
      type: 'cleanup-old-data',
      date: maintenant,
      resultat: stats
    });

    return res.status(200).json({
      success: true,
      message: 'Nettoyage terminé',
      stats: stats
    });

  } catch (error) {
    console.error('Erreur cron cleanup:', error);
    return res.status(500).json({ 
      error: 'Erreur lors du nettoyage',
      details: error.message 
    });
  }
}
