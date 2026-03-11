// pages/api/admin/import-dvf.js
// Importe un département DVF dans Supabase
// Appelé séquentiellement par la page admin pour chaque département

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DVF_BASE_URL = 'https://files.data.gouv.fr/geo-dvf/latest/csv';

export const config = {
  maxDuration: 60, // max Vercel
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Sécurité basique
  const { dep, adminKey } = req.body;
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  if (!dep) return res.status(400).json({ error: 'Département requis' });

  try {
    const url = `${DVF_BASE_URL}/${dep}/mutations.csv.gz`;
    console.log(`[DVF Import] Téléchargement département ${dep}...`);

    // Téléchargement du fichier CSV.gz
    const fileRes = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!fileRes.ok) {
      return res.status(200).json({
        success: false,
        dep,
        error: `Fichier non disponible (HTTP ${fileRes.status})`,
        inserted: 0,
      });
    }

    // Décompression gzip + parsing CSV en mémoire
    const buffer = await fileRes.arrayBuffer();
    const { DecompressionStream } = await import('node:stream/web');
    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    const reader = ds.readable.getReader();

    writer.write(new Uint8Array(buffer));
    writer.close();

    let csvText = '';
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      csvText += decoder.decode(value, { stream: true });
    }

    // Parsing CSV
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV avec gestion des guillemets
      const values = [];
      let inQuote = false;
      let current = '';
      for (const ch of line) {
        if (ch === '"') { inQuote = !inQuote; continue; }
        if (ch === ',' && !inQuote) { values.push(current); current = ''; continue; }
        current += ch;
      }
      values.push(current);

      const row = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || null; });

      // Filtrer uniquement les biens immobiliers avec surface
      if (!row.valeur_fonciere || !row.surface_reelle_bati) continue;
      if (!['Appartement', 'Maison', 'Terrain', 'Local industriel. commercial ou assimilé'].includes(row.type_local)) continue;
      const surface = parseFloat(row.surface_reelle_bati?.replace(',', '.'));
      if (!surface || surface <= 0) continue;

      rows.push({
        id_mutation: row.id_mutation,
        date_mutation: row.date_mutation || null,
        valeur_fonciere: parseFloat(row.valeur_fonciere?.replace(',', '.')) || null,
        surface_reelle_bati: surface,
        type_local: row.type_local,
        adresse_nom_voie: row.adresse_nom_voie || null,
        adresse_numero: row.adresse_numero || null,
        code_postal: row.code_postal || null,
        commune: row.nom_commune || null,
        code_commune: row.code_commune || null,
        latitude: parseFloat(row.latitude?.replace(',', '.')) || null,
        longitude: parseFloat(row.longitude?.replace(',', '.')) || null,
        nombre_pieces_principales: parseInt(row.nombre_pieces_principales) || null,
      });
    }

    console.log(`[DVF Import] Département ${dep} : ${rows.length} lignes valides`);

    // Insert par batch de 500
    let inserted = 0;
    const BATCH = 500;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const { error } = await supabase
        .from('dvf_transactions')
        .upsert(batch, { onConflict: 'id_mutation,date_mutation', ignoreDuplicates: true });
      if (error) {
        console.error(`[DVF Import] Erreur batch dep ${dep}:`, error.message);
      } else {
        inserted += batch.length;
      }
    }

    return res.status(200).json({
      success: true,
      dep,
      total: rows.length,
      inserted,
    });

  } catch (err) {
    console.error(`[DVF Import] Erreur département ${dep}:`, err.message);
    return res.status(200).json({
      success: false,
      dep,
      error: err.message,
      inserted: 0,
    });
  }
}
