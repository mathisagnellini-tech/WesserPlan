import { api } from '@/lib/apiClient';
import type { GetTeamPlannerDataResponseDto } from '@/types/plan';

const BASE = '/api/France/Web/Plan';

/**
 * Backend page-bundle for the team planner tab.
 *
 * Kept separate from `teamPlannerService` (which persists Kanban boards to
 * Supabase) so the two distinct concerns — board persistence vs. roster
 * fetch — don't share a module surface. The Supabase service writes board
 * state per (org, year, week); this service hydrates the roster (active /
 * newcomers / alumni / team leaders) from the operational backend.
 */
export const teamPlannerPageService = {
  /**
   * Returns the entire team-planner roster for a given campaign year. The
   * backend pre-classifies fundraisers into `active`, `newcomers` and
   * `alumni` so the frontend no longer has to filter `weeksWorked` /
   * `isActive` client-side.
   */
  getTeamPlannerData(campaignYear: number) {
    const params = new URLSearchParams({
      campaignYear: String(campaignYear),
    });
    return api.get<GetTeamPlannerDataResponseDto>(
      `${BASE}/TeamPlanner/Get?${params}`,
    );
  },
};
