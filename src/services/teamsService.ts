import { api } from '@/lib/apiClient';
import type {
  TeamLeaderItemDto,
  TeamStatsDto,
  TeamsOverviewResponseDto,
} from '@/types/api';

const BASE = '/api/France/Web/Teams';

export const teamsService = {
  getTeamLeaders(params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api.get<TeamLeaderItemDto[]>(`${BASE}/GetTeamLeaders${query}`);
  },

  getTeamStats(params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api.get<TeamStatsDto>(`${BASE}/GetTeamStats${query}`);
  },

  getTeamDetails(params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api.get(`${BASE}/GetTeamDetails${query}`);
  },

  getTeamsOverview(params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api.get<TeamsOverviewResponseDto>(`${BASE}/GetTeamsOverview${query}`);
  },

  getTeamsPerformance(params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api.get(`${BASE}/GetTeamsPerformance${query}`);
  },
};
