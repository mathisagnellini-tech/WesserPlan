-- ============================================
-- WesserPlan - Schéma Supabase
-- Exécuter dans SQL Editor de Supabase
-- ============================================

-- Table des communes
CREATE TABLE communes (
  id BIGSERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  departement TEXT NOT NULL,
  population INTEGER NOT NULL DEFAULT 0,
  passage DATE,
  statut TEXT NOT NULL DEFAULT 'pas_demande' CHECK (statut IN ('pas_demande', 'informe', 'refuse', 'telescope', 'fait')),
  maire TEXT,
  revenue TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  email TEXT,
  phone TEXT,
  organisation TEXT NOT NULL CHECK (organisation IN ('msf', 'unicef', 'wwf', 'mdm')),
  historique_passages JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des logements
CREATE TABLE housings (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE,
  lead TEXT,
  region TEXT,
  dept TEXT,
  org TEXT,
  people INTEGER DEFAULT 0,
  nights INTEGER DEFAULT 0,
  cost NUMERIC(10,2) DEFAULT 0,
  channel TEXT,
  address TEXT,
  owner_phone TEXT,
  owner_name TEXT,
  rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  comment TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  amenities TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des véhicules
CREATE TABLE cars (
  id BIGSERIAL PRIMARY KEY,
  plate TEXT NOT NULL UNIQUE,
  brand TEXT NOT NULL,
  location TEXT,
  km INTEGER DEFAULT 0,
  next_service DATE,
  owner TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  fuel_declared INTEGER DEFAULT 0,
  tank_size INTEGER DEFAULT 50,
  damages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX idx_communes_organisation ON communes(organisation);
CREATE INDEX idx_communes_departement ON communes(departement);
CREATE INDEX idx_communes_statut ON communes(statut);
CREATE INDEX idx_housings_org ON housings(org);
CREATE INDEX idx_housings_dept ON housings(dept);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER communes_updated_at BEFORE UPDATE ON communes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER housings_updated_at BEFORE UPDATE ON housings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER cars_updated_at BEFORE UPDATE ON cars FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Activer RLS (Row Level Security) - ouvert pour l'instant
ALTER TABLE communes ENABLE ROW LEVEL SECURITY;
ALTER TABLE housings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

-- Policies : accès complet avec la clé anon (à restreindre plus tard si besoin)
CREATE POLICY "Allow all access" ON communes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON housings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON cars FOR ALL USING (true) WITH CHECK (true);
