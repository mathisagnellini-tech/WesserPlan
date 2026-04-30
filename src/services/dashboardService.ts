import { api } from '@/lib/apiClient';
import type { GetDashboardDataResponseDto } from '@/types/plan';

const BASE = '/api/France/Web/Plan';

export const dashboardService = {
  /**
   * Single page-bundle endpoint that hydrates the entire Dashboard tab in
   * one round-trip — KPIs, campaigns, cluster analytics, and the teams list
   * for the requested (week, year, campaign) tuple.
   *
   * Replaces the four legacy per-domain calls (`getWeeklyPerformance`,
   * `getCampaigns`, `getClusterAnalytics`, `getTeamsForWeek`).
   */
  getDashboardData(week: number, year: number, campaignId?: string) {
    const params = new URLSearchParams({
      week: String(week),
      year: String(year),
    });
    if (campaignId) params.set('campaign_id', campaignId);
    return api.get<GetDashboardDataResponseDto>(
      `${BASE}/Dashboard/Get?${params}`,
    );
  },
};
