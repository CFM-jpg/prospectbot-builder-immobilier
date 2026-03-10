// pages/api/cron/cleanup-old-data.js
// API Cron - Nettoyage des données anciennes - Version Supabase

import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // Vérification du token Vercel Cron (sécurité)
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  try {
    const maintenant = new Date();
    const stats = {
      biensArchives: 0,
      matchsSupprimes: 0,
      logsSupprimes: 0,
      acheteursDesactives: 0
    };

    // 1. Archiver les biens vendus depuis plus de 90 jours
    const date90Jours = new Date(maintenant);
    date90Jours.setDate(date90Jours.getDate() - 90);

    const { data: biensArchivesData, error: errorArchive } = await supabaseAdmin
      .from('biens')
      .update({
        archive: true,
        date_archivage: maintenant.toISOString()
      })
      .eq('statut', 'vendu')
      .lt('date_vente', date90Jours.toISOString())
      .neq('archive', true)
      .select('id');

    if (!errorArchive) {
      stats.biensArchives = biensArchivesData?.length || 0;
    }

    // 2. Supprimer les matchs "rejetés" depuis plus de 30 jours
    const date30Jours = new Date(maintenant);
    date30Jours.setDate(date30Jours.getDate() - 30);

    const { data: matchsSupprimesData, error: errorMatches } = await supabaseAdmin
      .from('matches')
      .delete()
      .eq('statut', 'rejete')
      .lt('date_rejet', date30Jours.toISOString())
      .select('id');

    if (!errorMatches) {
      stats.matchsSupprimes = matchsSupprimesData?.length || 0;
    }

    // 3. Supprimer les logs de cron de plus de 180 jours
    const date180Jours = new Date(maintenant);
    date180Jours.setDate(date180Jours.getDate() - 180);

    const { data: logsSupprimesData, error: errorLogs } = await supabaseAdmin
      .from('cron_logs')
      .delete()
      .lt('date', date180Jours.toISOString())
      .select('id');

    if (!errorLogs) {
      stats.logsSupprimes = logsSupprimesData?.length || 0;
    }

    // 4. Désactiver les acheteurs inactifs depuis plus de 6 mois
    const date6Mois = new Date(maintenant);
    date6Mois.setMonth(date6Mois.getMonth() - 6);

    const { data: acheteursDesactivesData, error: errorAcheteurs } = await supabaseAdmin
      .from('acheteurs')
      .update({
        statut: 'inactif',
        raison_inactivite: 'Inactivité de plus de 6 mois',
        date_desactivation: maintenant.toISOString()
      })
      .eq('statut', 'actif')
      .or(`derniere_connexion.lt.${date6Mois.toISOString()},derniere_connexion.is.null`)
      .select('id');

    if (!errorAcheteurs) {
      stats.acheteursDesactives = acheteursDesactivesData?.length || 0;
    }

    // 5. Logger l'exécution
    await supabaseAdmin.from('cron_logs').insert([{
      type: 'cleanup-old-data',
      date: maintenant.toISOString(),
      resultat: stats
    }]);

    return res.status(200).json({
      success: true,
      message: 'Nettoyage terminé',
      stats: stats
    });

  } catch (error) {
    console.error('Erreur cron cleanup:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du nettoyage',
      details: error.message
    });
  }
}
