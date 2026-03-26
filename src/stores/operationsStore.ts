import { create } from 'zustand';

interface OperationsState {
  activeSubTab: 'housing' | 'cars' | 'stats';
  viewMode: 'list' | 'map';
  selectedHousingId: string | null;
  reportingCarId: string | null;

  setActiveSubTab: (tab: 'housing' | 'cars' | 'stats') => void;
  setViewMode: (mode: 'list' | 'map') => void;
  setSelectedHousingId: (id: string | null) => void;
  setReportingCarId: (id: string | null) => void;
}

export const useOperationsStore = create<OperationsState>((set) => ({
  activeSubTab: 'housing',
  viewMode: 'list',
  selectedHousingId: null,
  reportingCarId: null,

  setActiveSubTab: (tab) => set({ activeSubTab: tab }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedHousingId: (id) => set({ selectedHousingId: id }),
  setReportingCarId: (id) => set({ reportingCarId: id }),
}));
