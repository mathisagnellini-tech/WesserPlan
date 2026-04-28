-- ============================================
-- WesserPlan — Migration 006
-- plan.activities — real occurred_at timestamp
-- ============================================
--
-- The original schema (003) stored `time` and `date` as TEXT — they're display
-- strings ("09:00", "Auj.", "Hier", "12/04") rather than real timestamps. That
-- means the dashboard activity feed cannot be sorted, filtered, or queried by
-- chronology — only by `created_at` (insertion time, not event time).
--
-- This migration adds an `occurred_at TIMESTAMPTZ` column. Existing rows are
-- backfilled with `created_at` as a best-effort approximation. Going forward,
-- the frontend writes occurred_at as the source of truth; the legacy
-- `time` / `date` text columns remain (still NOT NULL in 003) and are kept
-- in sync via derived values, so any external reader that still consumes them
-- continues to work.
--
-- Idempotent.
-- ============================================

BEGIN;

-- 1. Add the new column nullable so the backfill can run.
ALTER TABLE plan.activities
  ADD COLUMN IF NOT EXISTS occurred_at TIMESTAMPTZ;

-- 2. Backfill any null rows with their created_at value.
UPDATE plan.activities
   SET occurred_at = created_at
 WHERE occurred_at IS NULL;

-- 3. Tighten the constraint and add a default for new rows.
ALTER TABLE plan.activities
  ALTER COLUMN occurred_at SET NOT NULL,
  ALTER COLUMN occurred_at SET DEFAULT NOW();

-- 4. Index for chronological queries (sort by event time, not insert time).
CREATE INDEX IF NOT EXISTS idx_activities_occurred_at
  ON plan.activities(occurred_at DESC);

COMMIT;

-- ══════════════════════════════════════════════
-- POST-MIGRATION
-- ══════════════════════════════════════════════
-- Frontend (src/services/activityService.ts) writes occurred_at as the real
-- timestamp of the event. The legacy `time` / `date` columns are still
-- populated with derived display strings for backward compatibility.
-- ══════════════════════════════════════════════
