import { api } from '@/lib/apiClient';
import type {
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

  getTeamsForWeek(params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api.get<TeamListItemDto[]>(`${BASE}/Teams/GetTeamsForWeek${query}`);
  },

  getTeamsOverview(params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api.get(`${BASE}/Teams/GetTeamsOverview${query}`);
  },

  getClusterAnalytics(weeks = 12, campaignId?: string) {
    const params = new URLSearchParams({ weeks: String(weeks) });
    if (campaignId) params.set('campaign_id', campaignId);
    return api.get(`${BASE}/Dashboard/cluster-analytics?${params}`);
  },
};
