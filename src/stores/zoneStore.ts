import { create } from 'zustand';

interface ZoneState {
  selectedNGO: string;
  selectedClusterId: string | null;

  setSelectedNGO: (ngo: string) => void;
  setSelectedClusterId: (id: string | null) => void;
}

export const useZoneStore = create<ZoneState>((set) => ({
  selectedNGO: 'MSF',
  selectedClusterId: null,

  setSelectedNGO: (ngo) => set({ selectedNGO: ngo, selectedClusterId: null }),
  setSelectedClusterId: (id) => set({ selectedClusterId: id }),
}));
