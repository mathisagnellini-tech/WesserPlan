-- ============================================
-- WesserPlan — Migration 004
-- Audit columns: created_by_oid / updated_by_oid
-- ============================================
--
-- Adds Azure AD objectIdentifier audit columns to all plan tables.
-- The OID is stamped from the frontend (honor system — anon key, no RLS yet).
-- When RLS is enabled later (see FINISH_PLAN.md "Future / Deferred"), these
-- columns become enforceable identity, not just audit metadata.
--
-- Idempotent: safe to re-run.
-- ============================================

BEGIN;

-- ── plan.town_halls ──
ALTER TABLE plan.town_halls
  ADD COLUMN IF NOT EXISTS created_by_oid TEXT,
  ADD COLUMN IF NOT EXISTS updated_by_oid TEXT;

-- ── plan.zones ──
ALTER TABLE plan.zones
  ADD COLUMN IF NOT EXISTS created_by_oid TEXT,
  ADD COLUMN IF NOT EXISTS updated_by_oid TEXT;

-- ── plan.comments ──
ALTER TABLE plan.comments
  ADD COLUMN IF NOT EXISTS created_by_oid TEXT,
  ADD COLUMN IF NOT EXISTS updated_by_oid TEXT;

-- ── plan.housings ──
ALTER TABLE plan.housings
  ADD COLUMN IF NOT EXISTS created_by_oid TEXT,
  ADD COLUMN IF NOT EXISTS updated_by_oid TEXT;

-- ── plan.vehicles ──
ALTER TABLE plan.vehicles
  ADD COLUMN IF NOT EXISTS created_by_oid TEXT,
  ADD COLUMN IF NOT EXISTS updated_by_oid TEXT;

-- ── plan.clusters ──
ALTER TABLE plan.clusters
  ADD COLUMN IF NOT EXISTS created_by_oid TEXT,
  ADD COLUMN IF NOT EXISTS updated_by_oid TEXT;

-- ── plan.activities (dashboard activity feed lives in plan, not public) ──
ALTER TABLE plan.activities
  ADD COLUMN IF NOT EXISTS created_by_oid TEXT,
  ADD COLUMN IF NOT EXISTS updated_by_oid TEXT;

-- Indexes for lookup by user (lightweight — we do show "edited by" UIs)
CREATE INDEX IF NOT EXISTS idx_town_halls_updated_by_oid ON plan.town_halls(updated_by_oid);
CREATE INDEX IF NOT EXISTS idx_zones_updated_by_oid       ON plan.zones(updated_by_oid);
CREATE INDEX IF NOT EXISTS idx_comments_created_by_oid    ON plan.comments(created_by_oid);
CREATE INDEX IF NOT EXISTS idx_housings_updated_by_oid    ON plan.housings(updated_by_oid);
CREATE INDEX IF NOT EXISTS idx_vehicles_updated_by_oid    ON plan.vehicles(updated_by_oid);
CREATE INDEX IF NOT EXISTS idx_clusters_updated_by_oid    ON plan.clusters(updated_by_oid);
CREATE INDEX IF NOT EXISTS idx_activities_updated_by_oid  ON plan.activities(updated_by_oid);

COMMIT;

-- ══════════════════════════════════════════════
-- POST-MIGRATION
-- ══════════════════════════════════════════════
-- Frontend services (Phase 4 of FINISH_PLAN.md) stamp these columns on every
-- insert/update by reading the OID from useAuthStore. Existing rows have NULL
-- in these columns until the next time they're updated.
-- ══════════════════════════════════════════════
