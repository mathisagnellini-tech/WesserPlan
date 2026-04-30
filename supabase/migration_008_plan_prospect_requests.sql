-- ============================================
-- WesserPlan — Migration 008
-- plan.prospect_requests — past prospection requests log
-- ============================================
--
-- Backing table for the communes "Past prospection requests" feature, which
-- currently lives only in client-side state (useCommunesData.ts). One row per
-- prospection attempt against a town hall by a given organization.
--
-- `organization` stores canonical org IDs from src/constants/organizations.ts
-- (`msf`, `unicef`, `mdm`, `wwf`, `aides`, `armeedusalut`). It is intentionally
-- TEXT (not an enum) to match the rest of the plan schema and to avoid a
-- schema migration every time a new partner org is added.
--
-- RLS disabled (matches the rest of the plan schema — auth is honor-system
-- via the audit columns until the FINISH_PLAN.md "Future / Deferred" RLS
-- rollout). Identity is captured via created_by_oid / updated_by_oid.
--
-- Idempotent: safe to re-run.
-- ============================================

BEGIN;

-- ── 1. Table ──
CREATE TABLE IF NOT EXISTS plan.prospect_requests (
  id              BIGSERIAL PRIMARY KEY,
  town_hall_id    BIGINT NOT NULL REFERENCES plan.town_halls(id) ON DELETE CASCADE,
  organization    TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted', 'refused', 'expired')),
  requested_at    TIMESTAMPTZ DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ,
  notes           TEXT,
  created_by_oid  TEXT,
  updated_by_oid  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE plan.prospect_requests DISABLE ROW LEVEL SECURITY;

-- ── 2. Indexes ──
CREATE INDEX IF NOT EXISTS idx_prospect_requests_town_hall
  ON plan.prospect_requests(town_hall_id);

CREATE INDEX IF NOT EXISTS idx_prospect_requests_org_status
  ON plan.prospect_requests(organization, status);

CREATE INDEX IF NOT EXISTS idx_prospect_requests_requested_at
  ON plan.prospect_requests(requested_at DESC);

-- ── 3. updated_at trigger (uses plan.update_updated_at() from migration 003) ──
DROP TRIGGER IF EXISTS prospect_requests_updated_at ON plan.prospect_requests;
CREATE TRIGGER prospect_requests_updated_at BEFORE UPDATE ON plan.prospect_requests
  FOR EACH ROW EXECUTE FUNCTION plan.update_updated_at();

-- ── 4. Grants (matches the rest of plan schema) ──
GRANT SELECT, INSERT, UPDATE, DELETE ON plan.prospect_requests
  TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE plan.prospect_requests_id_seq
  TO anon, authenticated, service_role;

COMMIT;

-- ══════════════════════════════════════════════
-- POST-MIGRATION
-- ══════════════════════════════════════════════
-- Frontend (src/hooks/useCommunesData.ts and the new prospectRequestsService)
-- should replace the in-memory `pastProspectRequests` array with reads/writes
-- against plan.prospect_requests, stamping created_by_oid / updated_by_oid
-- from useAuthStore on every mutation.
-- ══════════════════════════════════════════════
