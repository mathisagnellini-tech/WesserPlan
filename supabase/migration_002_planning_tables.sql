-- ============================================
-- WesserPlan - Planning Tables Migration
-- Tables: mairies, zones, activities
-- Exécuter dans SQL Editor de Supabase
-- ============================================

-- Table des zones (groupes de mairies)
CREATE TABLE IF NOT EXISTS zones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  leader TEXT NOT NULL DEFAULT 'Non assigné',
  organization TEXT NOT NULL DEFAULT 'msf',
  default_duration INTEGER NOT NULL DEFAULT 2,
  start_week INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des mairies (city hall relations)
CREATE TABLE IF NOT EXISTS mairies (
  id BIGSERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  region TEXT NOT NULL,
  departement TEXT NOT NULL,
  organization TEXT NOT NULL CHECK (organization IN ('msf', 'unicef', 'wwf', 'mdm')),
  contact JSONB NOT NULL DEFAULT '{}',
  infos JSONB NOT NULL DEFAULT '{}',
  horaires JSONB NOT NULL DEFAULT '{}',
  population INTEGER NOT NULL DEFAULT 0,
  semaine_demandee TEXT,
  date_demande TEXT,
  etape_progression INTEGER NOT NULL DEFAULT 0,
  statut_general TEXT NOT NULL DEFAULT 'À traiter' CHECK (statut_general IN ('À traiter', 'En cours', 'Action requise', 'Validé', 'Refusé')),
  commentaires JSONB NOT NULL DEFAULT '[]',
  zone_id TEXT REFERENCES zones(id) ON DELETE SET NULL,
  serie_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des activités (dashboard feed)
CREATE TABLE IF NOT EXISTS activities (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'info',
  text TEXT NOT NULL,
  author TEXT NOT NULL,
  time TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mairies_organization ON mairies(organization);
CREATE INDEX IF NOT EXISTS idx_mairies_zone_id ON mairies(zone_id);
CREATE INDEX IF NOT EXISTS idx_mairies_statut ON mairies(statut_general);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);

-- Triggers
CREATE TRIGGER zones_updated_at BEFORE UPDATE ON zones FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER mairies_updated_at BEFORE UPDATE ON mairies FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE mairies ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON zones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON mairies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON activities FOR ALL USING (true) WITH CHECK (true);
