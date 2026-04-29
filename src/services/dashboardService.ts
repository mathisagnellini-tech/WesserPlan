import { api } from '@/lib/apiClient';
import type {
  ClusterAnalyticsResponseDto,
  GetDashboardWeeklyPerformanceResponseDto,
  GetDashboardCampaignsResponseDto,
  TeamListItemDto,
} from '@/types/api';

const BASE = '/api/France/Web';

export const dashboardService = {
  getWeeklyPerformance(weeks = 12, campaignId?: string, year?: number) {
    const params = new URLSearchParams({ weeks: String(weeks) });
    if (campaignId) params.set('campaign_id', campaignId);
    if (year) params.set('year', String(year));
    return api.get<GetDashboardWeeklyPerformanceResponseDto>(
      `${BASE}/Dashboard/weekly-performance?${params}`,
    );
  },

  getDailyPerformance(week: number, year: number, campaignId?: string) {
    const params = new URLSearchParams({ week: String(week), year: String(year) });
    if (campaignId) params.set('campaign_id', campaignId);
    return api.get(`${BASE}/Dashboard/daily-performance?${params}`);
  },

  getCampaigns(year?: number) {
    const params = year ? `?year=${year}` : '';
    return api.get<GetDashboardCampaignsResponseDto>(`${BASE}/Dashboard/campaigns${params}`);
  },

  getTeamsForWeek(week: number, year: number, campaignId?: string) {
    // Backend `GetTeamsForWeek` action binds query params by C# DTO field
    // names — the response uses `calendarWeek` / `campaignYear`, so the
    // request must use the same camelCase keys. Sending `week` / `year` /
    // `campaign_id` (the snake_case convention used by the Dashboard
    // controller) silently fails to bind, and the backend returns the same
    // unfiltered set every call — which is why the dashboard map looked
    // "stuck" when only the filters changed.
    const params = new URLSearchParams({
      calendarWeek: String(week),
      campaignYear: String(year),
    });
    if (campaignId) params.set('campaignId', campaignId);
    return api.get<TeamListItemDto[]>(
      `${BASE}/Teams/GetTeamsForWeek?${params}`,
    );
  },

  getTeamsOverview(params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api.get(`${BASE}/Teams/GetTeamsOverview${query}`);
  },

  getClusterAnalytics(weeks = 12, campaignId?: string, year?: number) {
    const params = new URLSearchParams({ weeks: String(weeks) });
    if (campaignId) params.set('campaign_id', campaignId);
    if (year) params.set('year', String(year));
    return api.get<ClusterAnalyticsResponseDto>(`${BASE}/Dashboard/cluster-analytics?${params}`);
  },
};
