-- ============================================
-- 🗄️ SCHÉMA BASE DE DONNÉES SUPABASE
-- ProspectBot - Système de scraping immobilier
-- ============================================

-- 1️⃣ TABLE : biens_immobiliers
-- Stocke tous les biens immobiliers scrapés
CREATE TABLE IF NOT EXISTS biens_immobiliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  type_bien TEXT NOT NULL DEFAULT 'Appartement',
  ville TEXT NOT NULL,
  quartier TEXT,
  prix INTEGER NOT NULL,
  surface DECIMAL,
  pieces INTEGER,
  description TEXT,
  photos TEXT[], -- Array de URLs d'images
  telephone TEXT,
  email TEXT,
  url_annonce TEXT UNIQUE NOT NULL, -- URL unique de l'annonce
  source TEXT NOT NULL, -- 'leboncoin', 'pap', 'partenaire', etc.
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_biens_ville ON biens_immobiliers(ville);
CREATE INDEX IF NOT EXISTS idx_biens_type ON biens_immobiliers(type_bien);
CREATE INDEX IF NOT EXISTS idx_biens_prix ON biens_immobiliers(prix);
CREATE INDEX IF NOT EXISTS idx_biens_source ON biens_immobiliers(source);
CREATE INDEX IF NOT EXISTS idx_biens_created ON biens_immobiliers(created_at DESC);

-- 2️⃣ TABLE : acheteurs
-- Stocke les acheteurs inscrits aux alertes
CREATE TABLE IF NOT EXISTS acheteurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT,
  prenom TEXT,
  email TEXT UNIQUE NOT NULL,
  telephone TEXT,
  type_bien TEXT NOT NULL DEFAULT 'Appartement',
  budget_min INTEGER,
  budget_max INTEGER NOT NULL,
  villes TEXT[] NOT NULL, -- Array de villes recherchées
  pieces_min INTEGER,
  statut TEXT NOT NULL DEFAULT 'actif', -- 'actif', 'inactif', 'desabonne'
  source TEXT DEFAULT 'landing_page', -- 'landing_page', 'import', 'api'
  consent_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour le matching
CREATE INDEX IF NOT EXISTS idx_acheteurs_statut ON acheteurs(statut);
CREATE INDEX IF NOT EXISTS idx_acheteurs_type ON acheteurs(type_bien);
CREATE INDEX IF NOT EXISTS idx_acheteurs_budget ON acheteurs(budget_min, budget_max);
CREATE INDEX IF NOT EXISTS idx_acheteurs_villes ON acheteurs USING GIN(villes);

-- 3️⃣ TABLE : alertes_envoyees
-- Log de toutes les alertes envoyées aux acheteurs
CREATE TABLE IF NOT EXISTS alertes_envoyees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acheteur_id UUID NOT NULL REFERENCES acheteurs(id) ON DELETE CASCADE,
  bien_id UUID NOT NULL REFERENCES biens_immobiliers(id) ON DELETE CASCADE,
  date_envoi TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_ouvert BOOLEAN DEFAULT FALSE,
  email_clique BOOLEAN DEFAULT FALSE,
  date_ouverture TIMESTAMP WITH TIME ZONE,
  date_clic TIMESTAMP WITH TIME ZONE,
  UNIQUE(acheteur_id, bien_id) -- Éviter les doublons d'alertes
);

-- Index pour les statistiques
CREATE INDEX IF NOT EXISTS idx_alertes_acheteur ON alertes_envoyees(acheteur_id);
CREATE INDEX IF NOT EXISTS idx_alertes_bien ON alertes_envoyees(bien_id);
CREATE INDEX IF NOT EXISTS idx_alertes_date ON alertes_envoyees(date_envoi DESC);

-- 4️⃣ TABLE : scraper_logs
-- Logs des exécutions de scrapers
CREATE TABLE IF NOT EXISTS scraper_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scraper_id TEXT NOT NULL, -- 'leboncoin', 'github', etc.
  action TEXT NOT NULL, -- 'started', 'completed', 'failed', 'stopped'
  status TEXT, -- 'success', 'error', 'cancelled'
  items_scraped INTEGER DEFAULT 0,
  items_saved INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  duration_seconds INTEGER,
  error_message TEXT,
  params JSONB, -- Paramètres utilisés pour le scraping
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  stopped_at TIMESTAMP WITH TIME ZONE,
  stopped_by TEXT, -- 'user', 'system', 'timeout'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour monitoring
CREATE INDEX IF NOT EXISTS idx_logs_scraper ON scraper_logs(scraper_id);
CREATE INDEX IF NOT EXISTS idx_logs_status ON scraper_logs(status);
CREATE INDEX IF NOT EXISTS idx_logs_date ON scraper_logs(created_at DESC);

-- 5️⃣ TABLE : prospects_b2b
-- Stocke les prospects B2B (GitHub, LinkedIn, etc.)
CREATE TABLE IF NOT EXISTS prospects_b2b (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT,
  prenom TEXT,
  email TEXT,
  username TEXT,
  plateforme TEXT NOT NULL, -- 'github', 'linkedin', 'reddit', etc.
  profile_url TEXT UNIQUE NOT NULL,
  bio TEXT,
  localisation TEXT,
  competences TEXT[],
  repos_count INTEGER,
  followers_count INTEGER,
  language TEXT,
  company TEXT,
  score_qualite INTEGER, -- Score de 0 à 100
  metadata JSONB, -- Données additionnelles flexibles
  source TEXT NOT NULL,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche B2B
CREATE INDEX IF NOT EXISTS idx_prospects_plateforme ON prospects_b2b(plateforme);
CREATE INDEX IF NOT EXISTS idx_prospects_localisation ON prospects_b2b(localisation);
CREATE INDEX IF NOT EXISTS idx_prospects_competences ON prospects_b2b USING GIN(competences);
CREATE INDEX IF NOT EXISTS idx_prospects_score ON prospects_b2b(score_qualite DESC);

-- ============================================
-- 🔄 FONCTIONS ET TRIGGERS
-- ============================================

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_biens_updated_at ON biens_immobiliers;
CREATE TRIGGER update_biens_updated_at
  BEFORE UPDATE ON biens_immobiliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_acheteurs_updated_at ON acheteurs;
CREATE TRIGGER update_acheteurs_updated_at
  BEFORE UPDATE ON acheteurs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prospects_updated_at ON prospects_b2b;
CREATE TRIGGER update_prospects_updated_at
  BEFORE UPDATE ON prospects_b2b
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 📊 VUES UTILES
-- ============================================

-- Vue : Statistiques globales
CREATE OR REPLACE VIEW stats_globales AS
SELECT
  (SELECT COUNT(*) FROM biens_immobiliers) as total_biens,
  (SELECT COUNT(*) FROM acheteurs WHERE statut = 'actif') as acheteurs_actifs,
  (SELECT COUNT(*) FROM alertes_envoyees WHERE date_envoi >= NOW() - INTERVAL '30 days') as alertes_30j,
  (SELECT COUNT(*) FROM prospects_b2b) as total_prospects_b2b,
  (SELECT COUNT(*) FROM scraper_logs WHERE created_at >= NOW() - INTERVAL '7 days') as scrapers_7j;

-- Vue : Biens par ville
CREATE OR REPLACE VIEW biens_par_ville AS
SELECT
  ville,
  COUNT(*) as nombre_biens,
  AVG(prix) as prix_moyen,
  MIN(prix) as prix_min,
  MAX(prix) as prix_max
FROM biens_immobiliers
GROUP BY ville
ORDER BY nombre_biens DESC;

-- Vue : Performance des scrapers
CREATE OR REPLACE VIEW performance_scrapers AS
SELECT
  scraper_id,
  COUNT(*) as executions_total,
  SUM(items_saved) as items_sauvegardes_total,
  AVG(duration_seconds) as duree_moyenne,
  COUNT(*) FILTER (WHERE status = 'success') as executions_reussies,
  COUNT(*) FILTER (WHERE status = 'error') as executions_echouees
FROM scraper_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY scraper_id
ORDER BY items_sauvegardes_total DESC;

-- ============================================
-- ✅ VÉRIFICATION
-- ============================================

-- Afficher toutes les tables créées
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Afficher toutes les vues créées
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================
-- 🔐 POLITIQUES RLS (Row Level Security)
-- Optionnel : À activer si vous voulez restreindre l'accès
-- ============================================

-- Activer RLS sur les tables
-- ALTER TABLE biens_immobiliers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE acheteurs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE alertes_envoyees ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE prospects_b2b ENABLE ROW LEVEL SECURITY;

-- Exemple de politique : Les acheteurs ne voient que leurs propres données
-- CREATE POLICY "Acheteurs peuvent voir leurs propres données"
--   ON acheteurs FOR SELECT
--   USING (auth.uid() = id);

-- ============================================
-- 📝 NOTES D'UTILISATION
-- ============================================
/*
1. Copiez ce script SQL
2. Allez dans Supabase > SQL Editor
3. Créez une nouvelle query
4. Collez ce script et exécutez-le
5. Vérifiez que toutes les tables sont créées dans l'onglet Table Editor

IMPORTANT:
- Les tables utilisent des UUID comme clés primaires
- Les index sont créés pour optimiser les requêtes fréquentes
- Les triggers mettent à jour automatiquement updated_at
- Les vues facilitent les statistiques et le monitoring
*/
