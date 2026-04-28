-- ============================================
-- WesserPlan — Migration 005
-- Team-planner board persistence
-- ============================================
--
-- Persists the team-planner Kanban board state per (org, year, week).
-- Board JSON is stored as a single JSONB blob (BoardData).
-- Idempotent: safe to re-run.
-- ============================================

BEGIN;

CREATE TABLE IF NOT EXISTS plan.team_planner_boards (
  id BIGSERIAL PRIMARY KEY,
  org_id TEXT NOT NULL,
  year INT NOT NULL,
  week_index INT NOT NULL,
  board_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_oid TEXT,
  updated_by_oid TEXT,
  UNIQUE (org_id, year, week_index)
);

CREATE INDEX IF NOT EXISTS idx_tpb_org_week ON plan.team_planner_boards(org_id, year, week_index);

ALTER TABLE plan.team_planner_boards DISABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS team_planner_boards_updated_at ON plan.team_planner_boards;
CREATE TRIGGER team_planner_boards_updated_at BEFORE UPDATE ON plan.team_planner_boards
  FOR EACH ROW EXECUTE FUNCTION plan.update_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON plan.team_planner_boards TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE plan.team_planner_boards_id_seq TO anon, authenticated;

COMMIT;

-- ══════════════════════════════════════════════
-- POST-MIGRATION
-- ══════════════════════════════════════════════
-- Frontend service: src/services/teamPlannerService.ts
-- Hook integration: src/components/team-planner/hooks/useTeamBoard.ts
-- Boards are upserted on (org_id, year, week_index). Audit columns are
-- stamped from the frontend via withAudit() (Azure AD OID, honor system).
-- ══════════════════════════════════════════════
