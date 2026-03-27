-- ============================================
-- WesserPlan — Create `plan` schema
-- Clean break: move town_hall_* tables + create new planning tables
-- RLS disabled, service key auth
-- ============================================

-- IMPORTANT: After running this migration, add 'plan' to Supabase API settings:
-- Project Settings → API → Exposed schemas → add "plan"

BEGIN;

-- ══════════════════════════════════════════════
-- 1. CREATE SCHEMA
-- ══════════════════════════════════════════════
CREATE SCHEMA IF NOT EXISTS plan;

-- Grant usage to service role and anon (needed for PostgREST)
GRANT USAGE ON SCHEMA plan TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA plan TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA plan TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA plan GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA plan GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA plan GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;

-- ══════════════════════════════════════════════
-- 2. DROP VIEW (depends on tables we're moving)
-- ══════════════════════════════════════════════
DROP VIEW IF EXISTS public.town_hall_comments_with_details;

-- ══════════════════════════════════════════════
-- 3. MOVE EXISTING TABLES (rename = instant, no data copy)
-- ══════════════════════════════════════════════

-- Move organizations first (referenced by entries FK)
ALTER TABLE public.town_hall_organizations SET SCHEMA plan;
ALTER TABLE plan.town_hall_organizations RENAME TO organizations;

-- Move team_leaders (referenced by entries)
ALTER TABLE public.town_hall_team_leaders SET SCHEMA plan;
ALTER TABLE plan.town_hall_team_leaders RENAME TO team_leaders;

-- Move entries (main table, 34K rows)
ALTER TABLE public.town_hall_entries SET SCHEMA plan;
ALTER TABLE plan.town_hall_entries RENAME TO town_halls;

-- Move comments (FK → town_halls)
ALTER TABLE public.town_hall_comments SET SCHEMA plan;
ALTER TABLE plan.town_hall_comments RENAME TO comments;

-- Move communication_logs (FK → town_halls)
ALTER TABLE public.town_hall_communication_logs SET SCHEMA plan;
ALTER TABLE plan.town_hall_communication_logs RENAME TO communication_logs;

-- Move social_media (FK → town_halls)
ALTER TABLE public.town_hall_social_media SET SCHEMA plan;
ALTER TABLE plan.town_hall_social_media RENAME TO social_media;

-- Move zones
ALTER TABLE public.town_hall_zones SET SCHEMA plan;
ALTER TABLE plan.town_hall_zones RENAME TO zones;

-- ══════════════════════════════════════════════
-- 4. RECREATE VIEW in plan schema
-- ══════════════════════════════════════════════
CREATE VIEW plan.comments_with_details AS
SELECT
  c.id,
  c.town_hall_entry_id,
  c.scope,
  c.content,
  c.created_at,
  c.updated_at,
  th.name AS town_hall_name,
  th.email AS town_hall_email,
  th.phone AS town_hall_phone
FROM plan.comments c
JOIN plan.town_halls th ON c.town_hall_entry_id = th.id;

-- ══════════════════════════════════════════════
-- 5. DISABLE RLS on all moved tables
-- ══════════════════════════════════════════════
ALTER TABLE plan.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE plan.team_leaders DISABLE ROW LEVEL SECURITY;
ALTER TABLE plan.town_halls DISABLE ROW LEVEL SECURITY;
ALTER TABLE plan.comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE plan.communication_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE plan.social_media DISABLE ROW LEVEL SECURITY;
ALTER TABLE plan.zones DISABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════
-- 6. CREATE NEW TABLES
-- ══════════════════════════════════════════════

-- Activities (dashboard feed)
CREATE TABLE plan.activities (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'info',
  text TEXT NOT NULL,
  author TEXT NOT NULL,
  time TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE plan.activities DISABLE ROW LEVEL SECURITY;
CREATE INDEX idx_activities_created ON plan.activities(created_at DESC);

-- Housings (accommodation logistics)
CREATE TABLE plan.housings (
  id BIGSERIAL PRIMARY KEY,
  week TEXT,
  zone TEXT,
  name TEXT NOT NULL,
  lead TEXT,
  region TEXT,
  dept TEXT,
  org TEXT,
  people INTEGER DEFAULT 0,
  nights INTEGER DEFAULT 0,
  date_start DATE,
  date_end DATE,
  cost_reservation NUMERIC(10,2) DEFAULT 0,
  cost_additional NUMERIC(10,2) DEFAULT 0,
  has_insurance BOOLEAN DEFAULT FALSE,
  cost_total NUMERIC(10,2) DEFAULT 0,
  receipt_ok BOOLEAN DEFAULT FALSE,
  channel TEXT,
  address TEXT,
  owner_name TEXT,
  owner_phone TEXT,
  rating INTEGER DEFAULT 3,
  dept_score INTEGER,
  team_note TEXT,
  status TEXT DEFAULT 'Honorée',
  refund_amount NUMERIC(10,2) DEFAULT 0,
  cost_final NUMERIC(10,2) DEFAULT 0,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  amenities TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE plan.housings DISABLE ROW LEVEL SECURITY;
CREATE INDEX idx_housings_org ON plan.housings(org);
CREATE INDEX idx_housings_week ON plan.housings(week);

-- Vehicles (fleet management)
CREATE TABLE plan.vehicles (
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
ALTER TABLE plan.vehicles DISABLE ROW LEVEL SECURITY;

-- Clusters (zone-maker geographic planning)
CREATE TABLE plan.clusters (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  custom_suffix TEXT,
  commune_ids TEXT[] DEFAULT '{}',
  total_population INTEGER DEFAULT 0,
  color TEXT,
  duration_weeks INTEGER DEFAULT 1,
  start_week INTEGER DEFAULT 1,
  assigned_team INTEGER DEFAULT 0,
  sort_lat DOUBLE PRECISION,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_bonus BOOLEAN DEFAULT FALSE,
  ngo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE plan.clusters DISABLE ROW LEVEL SECURITY;
CREATE INDEX idx_clusters_ngo ON plan.clusters(ngo);

-- ══════════════════════════════════════════════
-- 7. UPDATED_AT TRIGGERS for new tables
-- ══════════════════════════════════════════════

-- Reusable trigger function (may already exist from original schema)
CREATE OR REPLACE FUNCTION plan.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER housings_updated_at BEFORE UPDATE ON plan.housings
  FOR EACH ROW EXECUTE FUNCTION plan.update_updated_at();

CREATE TRIGGER vehicles_updated_at BEFORE UPDATE ON plan.vehicles
  FOR EACH ROW EXECUTE FUNCTION plan.update_updated_at();

CREATE TRIGGER clusters_updated_at BEFORE UPDATE ON plan.clusters
  FOR EACH ROW EXECUTE FUNCTION plan.update_updated_at();

-- ══════════════════════════════════════════════
-- 8. GRANT on new tables + sequences
-- ══════════════════════════════════════════════
GRANT ALL ON ALL TABLES IN SCHEMA plan TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA plan TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA plan TO anon, authenticated, service_role;

COMMIT;

-- ══════════════════════════════════════════════
-- POST-MIGRATION CHECKLIST:
-- ══════════════════════════════════════════════
-- 1. In Supabase Dashboard → Project Settings → API → "Exposed schemas"
--    Add: plan
--
-- 2. Update WesserDashboard to query plan.town_halls instead of public.town_hall_entries
--    (or add plan to its Supabase client schema option)
--
-- 3. Update WesserPlan mairieService.ts to use schema: 'plan'
-- ══════════════════════════════════════════════
