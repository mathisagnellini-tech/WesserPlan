import { api } from '@/lib/apiClient';
import type { GetMairieDataResponseDto } from '@/types/plan';

const BASE = '/api/France/Web/Plan';

/**
 * Backend page-bundle for the Mairie tab.
 *
 * Kept separate from `mairieService` (which is the Supabase persistence layer
 * for town halls, zones and comments) so the two responsibilities — local
 * editorial data vs. operational team-leader directory — don't share a
 * module surface.
 */
export const mairiePageService = {
  /**
   * Returns the team leaders directory used by the Mairie tab to attach a
   * leader to each zone.
   */
  getMairieData() {
    return api.get<GetMairieDataResponseDto>(`${BASE}/Mairie/Get`);
  },
};
