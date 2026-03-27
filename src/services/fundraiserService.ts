import { api } from '@/lib/apiClient';
import type { FundraisersKanbanResponseDto } from '@/types/api';

const BASE = '/api/France/Web';

export const fundraiserService = {
  getKanban(params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api.get<FundraisersKanbanResponseDto>(`${BASE}/Fundraiser/GetFundraisersKanban${query}`);
  },

  getPerformance(params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api.get(`${BASE}/Fundraiser/GetFundraisersPerformance${query}`);
  },

  getTopPerformers(params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api.get(`${BASE}/Fundraiser/GetTopPerformers${query}`);
  },

  getIndividualLiveStats(params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return api.get(`${BASE}/Fundraiser/GetIndividualLiveStats${query}`);
  },

  getPersonRecord(personId: number) {
    return api.get(`${BASE}/Person/GetPersonRecord?personId=${personId}`);
  },
};
