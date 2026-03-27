import { api } from '@/lib/apiClient';
import type { OrganizationDto } from '@/types/api';

export const organizationService = {
  getOrganizations() {
    return api.get<OrganizationDto[]>('/api/France/Web/Organizations/GetOrganizations');
  },
};
