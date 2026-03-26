import { create } from 'zustand';
import type { Organization, CommuneStatus } from '@/types/commune';

interface CommunesState {
  selectedOrg: Organization;
  selectedCommuneId: number | null;
  mode: 'list' | 'map';
  search: string;
  selectedRegions: Set<string>;
  selectedDepts: Set<string>;
  selectedStatuses: Set<CommuneStatus>;

  setSelectedOrg: (org: Organization) => void;
  setSelectedCommuneId: (id: number | null) => void;
  setMode: (mode: 'list' | 'map') => void;
  setSearch: (search: string) => void;
  setSelectedRegions: (regions: Set<string>) => void;
  setSelectedDepts: (depts: Set<string>) => void;
  toggleStatus: (status: CommuneStatus) => void;
  resetStatuses: () => void;
}

export const useCommunesStore = create<CommunesState>((set) => ({
  selectedOrg: 'msf',
  selectedCommuneId: null,
  mode: 'list',
  search: '',
  selectedRegions: new Set(),
  selectedDepts: new Set(),
  selectedStatuses: new Set(),

  setSelectedOrg: (org) => set({ selectedOrg: org, selectedCommuneId: null }),
  setSelectedCommuneId: (id) => set({ selectedCommuneId: id }),
  setMode: (mode) => set({ mode }),
  setSearch: (search) => set({ search }),
  setSelectedRegions: (regions) => set({ selectedRegions: regions }),
  setSelectedDepts: (depts) => set({ selectedDepts: depts }),
  toggleStatus: (status) => set((state) => {
    const next = new Set(state.selectedStatuses);
    if (next.has(status)) next.delete(status);
    else next.add(status);
    return { selectedStatuses: next };
  }),
  resetStatuses: () => set({ selectedStatuses: new Set() }),
}));
