// pages/admin/import-dvf.js
// Page admin pour lancer l'import DVF de tous les départements séquentiellement

import { useState } from 'react';
import Head from 'next/head';

const DEPARTEMENTS = [
  '01','02','03','04','05','06','07','08','09','10',
  '11','12','13','14','15','16','17','18','19','21',
  '22','23','24','25','26','27','28','29','2A','2B',
  '30','31','32','33','34','35','36','37','38','39',
  '40','41','42','43','44','45','46','47','48','49',
  '50','51','52','53','54','55','56','57','58','59',
  '60','61','62','63','64','65','66','67','68','69',
  '70','71','72','73','74','75','76','77','78','79',
  '80','81','82','83','84','85','86','87','88','89',
  '90','91','92','93','94','95',
];

const DEP_NAMES = {
  '01':'Ain','02':'Aisne','03':'Allier','04':'Alpes-de-Haute-Provence','05':'Hautes-Alpes',
  '06':'Alpes-Maritimes','07':'Ardèche','08':'Ardennes','09':'Ariège','10':'Aube',
  '11':'Aude','12':'Aveyron','13':'Bouches-du-Rhône','14':'Calvados','15':'Cantal',
  '16':'Charente','17':'Charente-Maritime','18':'Cher','19':'Corrèze','21':'Côte-d\'Or',
  '22':'Côtes-d\'Armor','23':'Creuse','24':'Dordogne','25':'Doubs','26':'Drôme',
  '27':'Eure','28':'Eure-et-Loir','29':'Finistère','2A':'Corse-du-Sud','2B':'Haute-Corse',
  '30':'Gard','31':'Haute-Garonne','32':'Gers','33':'Gironde','34':'Hérault',
  '35':'Ille-et-Vilaine','36':'Indre','37':'Indre-et-Loire','38':'Isère','39':'Jura',
  '40':'Landes','41':'Loir-et-Cher','42':'Loire','43':'Haute-Loire','44':'Loire-Atlantique',
  '45':'Loiret','46':'Lot','47':'Lot-et-Garonne','48':'Lozère','49':'Maine-et-Loire',
  '50':'Manche','51':'Marne','52':'Haute-Marne','53':'Mayenne','54':'Meurthe-et-Moselle',
  '55':'Meuse','56':'Morbihan','57':'Moselle','58':'Nièvre','59':'Nord',
  '60':'Oise','61':'Orne','62':'Pas-de-Calais','63':'Puy-de-Dôme','64':'Pyrénées-Atlantiques',
  '65':'Hautes-Pyrénées','66':'Pyrénées-Orientales','67':'Bas-Rhin','68':'Haut-Rhin','69':'Rhône',
  '70':'Haute-Saône','71':'Saône-et-Loire','72':'Sarthe','73':'Savoie','74':'Haute-Savoie',
  '75':'Paris','76':'Seine-Maritime','77':'Seine-et-Marne','78':'Yvelines','79':'Deux-Sèvres',
  '80':'Somme','81':'Tarn','82':'Tarn-et-Garonne','83':'Var','84':'Vaucluse',
  '85':'Vendée','86':'Vienne','87':'Haute-Vienne','88':'Vosges','89':'Yonne',
  '90':'Territoire de Belfort','91':'Essonne','92':'Hauts-de-Seine','93':'Seine-Saint-Denis',
  '94':'Val-de-Marne','95':'Val-d\'Oise',
};

export default function ImportDVFPage() {
  const [adminKey, setAdminKey] = useState('');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState({});
  const [currentDep, setCurrentDep] = useState(null);
  const [progress, setProgress] = useState(0);
  const [totalInserted, setTotalInserted] = useState(0);
  const [selectedDeps, setSelectedDeps] = useState(DEPARTEMENTS);

  const toggleDep = (dep) => {
    setSelectedDeps(prev =>
      prev.includes(dep) ? prev.filter(d => d !== dep) : [...prev, dep]
    );
  };

  const startImport = async () => {
    if (!adminKey) return alert('Clé admin requise');
    setRunning(true);
    setResults({});
    setProgress(0);
    setTotalInserted(0);

    let inserted = 0;
    for (let i = 0; i < selectedDeps.length; i++) {
      const dep = selectedDeps[i];
      setCurrentDep(dep);
      setProgress(Math.round((i / selectedDeps.length) * 100));

      try {
        const res = await fetch('/api/admin/import-dvf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dep, adminKey }),
        });
        const data = await res.json();
        inserted += data.inserted || 0;
        setTotalInserted(inserted);
        setResults(prev => ({ ...prev, [dep]: data }));
      } catch (err) {
        setResults(prev => ({ ...prev, [dep]: { success: false, error: err.message, inserted: 0 } }));
      }

      // Pause 2s entre chaque département pour éviter surcharge
      await new Promise(r => setTimeout(r, 2000));
    }

    setProgress(100);
    setCurrentDep(null);
    setRunning(false);
  };

  const done = Object.keys(results).length;
  const errors = Object.values(results).filter(r => !r.success).length;
  const successes = Object.values(results).filter(r => r.success).length;

  return (
    <>
      <Head><title>Import DVF — Admin</title></Head>
      <div style={{ minHeight: '100vh', background: '#080809', color: '#e8e8e8', fontFamily: 'DM Sans, sans-serif', padding: 40 }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e8e8e8', marginBottom: 8 }}>
              📦 Import DVF → Supabase
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
              Importe les transactions immobilières officielles (data.gouv.fr) dans ta base Supabase.
              Durée estimée : ~3-5 min par département.
            </p>
          </div>

          {/* Auth */}
          <div style={{ background: '#17171a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Clé Admin (variable ADMIN_SECRET_KEY dans Vercel)
            </label>
            <input
              type="password"
              value={adminKey}
              onChange={e => setAdminKey(e.target.value)}
              placeholder="••••••••••••"
              style={{ width: '100%', background: '#0f0f11', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', color: '#e8e8e8', fontSize: 14, fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Sélection départements */}
          <div style={{ background: '#17171a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#e8e8e8' }}>
                Départements à importer ({selectedDeps.length}/{DEPARTEMENTS.length})
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setSelectedDeps(DEPARTEMENTS)} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Tous</button>
                <button onClick={() => setSelectedDeps([])} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Aucun</button>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {DEPARTEMENTS.map(dep => {
                const result = results[dep];
                const isSelected = selectedDeps.includes(dep);
                const bg = result
                  ? result.success ? 'rgba(62,207,142,0.15)' : 'rgba(240,68,68,0.15)'
                  : isSelected ? 'rgba(212,168,83,0.1)' : 'rgba(255,255,255,0.03)';
                const border = result
                  ? result.success ? 'rgba(62,207,142,0.4)' : 'rgba(240,68,68,0.4)'
                  : isSelected ? 'rgba(212,168,83,0.3)' : 'rgba(255,255,255,0.07)';
                const color = result
                  ? result.success ? '#3ecf8e' : '#f04444'
                  : isSelected ? '#d4a853' : 'rgba(255,255,255,0.3)';
                return (
                  <button
                    key={dep}
                    onClick={() => !running && toggleDep(dep)}
                    title={DEP_NAMES[dep]}
                    style={{ padding: '4px 10px', borderRadius: 6, background: bg, border: `1px solid ${border}`, color, fontSize: 12, fontWeight: 600, cursor: running ? 'default' : 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s', minWidth: 36 }}
                  >
                    {dep}
                    {result && <span style={{ marginLeft: 3 }}>{result.success ? '✓' : '✗'}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progression */}
          {(running || done > 0) && (
            <div style={{ background: '#17171a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 14, color: '#e8e8e8', fontWeight: 600 }}>
                  {running ? `Import en cours — département ${currentDep} (${DEP_NAMES[currentDep] || ''})` : 'Import terminé ✓'}
                </span>
                <span style={{ fontSize: 13, color: '#d4a853' }}>{progress}%</span>
              </div>
              <div style={{ height: 6, background: '#1f1f24', borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg, #8b6914, #d4a853)', width: `${progress}%`, transition: 'width 0.5s ease', borderRadius: 3 }} />
              </div>
              <div style={{ display: 'flex', gap: 24 }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                  <span style={{ color: '#3ecf8e', fontWeight: 600 }}>{successes}</span> succès
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                  <span style={{ color: '#f04444', fontWeight: 600 }}>{errors}</span> erreurs
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                  <span style={{ color: '#d4a853', fontWeight: 600 }}>{totalInserted.toLocaleString('fr-FR')}</span> transactions importées
                </div>
              </div>
            </div>
          )}

          {/* Bouton lancer */}
          <button
            onClick={startImport}
            disabled={running || selectedDeps.length === 0 || !adminKey}
            style={{
              width: '100%', padding: '14px 24px',
              background: running ? '#1f1f24' : 'linear-gradient(135deg, #8b6914, #d4a853)',
              color: running ? 'rgba(255,255,255,0.3)' : '#0f0f11',
              border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
              cursor: running || !adminKey ? 'not-allowed' : 'pointer',
              fontFamily: 'DM Sans, sans-serif', marginBottom: 24,
            }}
          >
            {running
              ? `⏳ Import en cours… (${done}/${selectedDeps.length} départements)`
              : `🚀 Lancer l'import — ${selectedDeps.length} département(s)`}
          </button>

          {/* Résultats détaillés */}
          {done > 0 && (
            <div style={{ background: '#17171a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#e8e8e8', marginBottom: 14 }}>Résultats détaillés</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
                {Object.entries(results).map(([dep, r]) => (
                  <div key={dep} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: r.success ? 'rgba(62,207,142,0.05)' : 'rgba(240,68,68,0.05)', border: `1px solid ${r.success ? 'rgba(62,207,142,0.15)' : 'rgba(240,68,68,0.15)'}` }}>
                    <span style={{ fontSize: 13, color: '#e8e8e8', fontWeight: 600 }}>
                      {dep} — {DEP_NAMES[dep]}
                    </span>
                    <span style={{ fontSize: 12, color: r.success ? '#3ecf8e' : '#f04444' }}>
                      {r.success ? `✓ ${(r.inserted || 0).toLocaleString('fr-FR')} insérées` : `✗ ${r.error}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
