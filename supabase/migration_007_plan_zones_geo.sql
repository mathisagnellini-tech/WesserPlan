-- ============================================
-- WesserPlan — Migration 007
-- plan.zones — geographic centroid + radius + computed view
-- ============================================
--
-- Gives `plan.zones` real geographic data so the operations SmartMatcher and
-- HousingMap can compute distances against real zone centroids instead of
-- hard-coded fallbacks.
--
-- Three optional manual-override columns are added to plan.zones:
--   - centroid_lat / centroid_lng — manual override of the zone centroid
--   - radius_km                  — manual override of the zone radius
--
-- A companion view `plan.zones_with_geo` exposes the same columns plus
-- computed defaults (averaged from member town halls' lat/lng, with a 25 km
-- radius fallback). The frontend should query the view, not the table, when it
-- needs the resolved geography. Writes still go to the underlying table.
--
-- Join key: plan.zones.town_hall_ids (BIGINT[]) → plan.town_halls.id.
-- This matches the existing array-membership pattern used in mairieService.ts.
--
-- Idempotent: safe to re-run.
-- ============================================

BEGIN;

-- ── 1. Manual-override columns on plan.zones ──
ALTER TABLE plan.zones
  ADD COLUMN IF NOT EXISTS centroid_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS centroid_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS radius_km    DOUBLE PRECISION DEFAULT 25;

-- ── 2. Computed view: resolved centroid + radius ──
-- LEFT JOIN so zones with no member town halls still appear (geo cols NULL).
-- COALESCE(manual override, AVG of members, NULL/25) — manual override always wins.
CREATE OR REPLACE VIEW plan.zones_with_geo AS
SELECT
  z.*,
  COALESCE(z.centroid_lat, AVG(th.latitude))  AS geo_lat,
  COALESCE(z.centroid_lng, AVG(th.longitude)) AS geo_lng,
  COALESCE(z.radius_km, 25)                   AS geo_radius_km
FROM plan.zones z
LEFT JOIN plan.town_halls th
  ON th.id = ANY (z.town_hall_ids)
GROUP BY z.id;

-- ── 3. Grants ──
GRANT SELECT ON plan.zones_with_geo TO anon, authenticated, service_role;

COMMIT;

-- ══════════════════════════════════════════════
-- POST-MIGRATION
-- ══════════════════════════════════════════════
-- 1. Frontend services that need a zone's resolved geography (operations
--    SmartMatcher, HousingMap) should SELECT from plan.zones_with_geo and
--    use geo_lat / geo_lng / geo_radius_km. Writes still target plan.zones.
--
-- 2. To override a zone's centroid manually (e.g. when the average of member
--    town halls falls in a lake), UPDATE plan.zones SET centroid_lat = ...,
--    centroid_lng = ... WHERE id = '...';
-- ══════════════════════════════════════════════
