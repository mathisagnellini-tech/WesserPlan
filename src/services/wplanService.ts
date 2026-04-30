import { api } from '@/lib/apiClient';
import type { GetWplanDataResponseDto } from '@/types/plan';

const BASE = '/api/France/Web/Plan';

export const wplanService = {
  /**
   * Single page-bundle endpoint for the Wplan tab. Returns national KPIs,
   * per-département breakdowns, hourly conversion curve, age distribution
   * histogram and a weekly time series in one round-trip.
   *
   * Replaces the per-domain calls previously made to dashboardService and
   * donorsService for this tab.
   */
  getWplanData(
    week: number,
    year: number,
    campaignId?: string,
    dept?: string,
  ) {
    const params = new URLSearchParams({
      week: String(week),
      year: String(year),
    });
    if (campaignId) params.set('campaign_id', campaignId);
    if (dept) params.set('dept', dept);
    return api.get<GetWplanDataResponseDto>(
      `${BASE}/Wplan/Get?${params}`,
    );
  },
};
