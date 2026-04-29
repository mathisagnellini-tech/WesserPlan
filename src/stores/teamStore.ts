import { create } from 'zustand';

type PageMode = 'board' | 'alumni' | 'map';
type ViewMode = 'performance' | 'identity' | 'hr';
type ViewDensity = 'standard' | 'compact' | 'tiny';

interface TeamState {
  currentWeekIndex: number;
  selectedPersonId: string | null;
  pageMode: PageMode;
  viewMode: ViewMode;
  density: ViewDensity;

  setCurrentWeekIndex: (index: number) => void;
  setSelectedPersonId: (id: string | null) => void;
  setPageMode: (mode: PageMode) => void;
  setViewMode: (mode: ViewMode) => void;
  setDensity: (density: ViewDensity) => void;
}

export const useTeamStore = create<TeamState>((set) => ({
  currentWeekIndex: 0,
  selectedPersonId: null,
  pageMode: 'board',
  viewMode: 'performance',
  density: 'standard',

  setCurrentWeekIndex: (index) => set({ currentWeekIndex: index }),
  setSelectedPersonId: (id) => set({ selectedPersonId: id }),
  setPageMode: (mode) => set({ pageMode: mode }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setDensity: (density) => set({ density }),
}));
