import type { WeeklyMetricDto } from '@/types/api';

// Normalised national KPIs derived from the backend's weekly-performance
// payload. Keep this as a pure transform so it can be unit-tested without
// React, network, or chart.js.

export interface NationalKpis {
  weeklyDonors: number[];
  weekLabels: string[];
  activeFundraisers: number;
  activeTeams: number;
  productivity: number;
  avgMonthlyDonation: number;
  avgDonorAge: number;
  /** Cohort-style retention proxy: activeFundraisers / cumulative newcomers (%). */
  retentionByWeek: number[];
  weeklyVolume: number[];
}

const EMPTY_KPIS: NationalKpis = {
  weeklyDonors: [],
  weekLabels: [],
  activeFundraisers: 0,
  activeTeams: 0,
  productivity: 0,
  avgMonthlyDonation: 0,
  avgDonorAge: 0,
  retentionByWeek: [],
  weeklyVolume: [],
};

export function buildNationalKpis(weekly: WeeklyMetricDto[] | null | undefined): NationalKpis {
  if (!weekly?.length) return { ...EMPTY_KPIS };

  // Sort chronologically by (year, weekNumber). The previous implementation
  // mixed multiplications and additions in a single comparator expression
  // which silently produced wrong order across year boundaries — the explicit
  // tuple compare here is unambiguous.
  const sorted = [...weekly].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.weekNumber - b.weekNumber;
  });

  const weeklyDonors = sorted.map((w) => w.donorsRecruited ?? 0);
  const weekLabels = sorted.map((w) => `S${w.weekNumber}`);
  const weeklyVolume = sorted.map((w) => w.totalDailyRevenue ?? 0);

  let cumulativeNewcomers = 0;
  const retentionByWeek = sorted.map((w) => {
    cumulativeNewcomers += w.newcomers ?? 0;
    if (cumulativeNewcomers === 0) return 0;
    const ratio = ((w.activeFundraisers ?? 0) / cumulativeNewcomers) * 100;
    return Math.max(0, Math.min(100, parseFloat(ratio.toFixed(1))));
  });

  const last = sorted[sorted.length - 1];
  return {
    weeklyDonors,
    weekLabels,
    weeklyVolume,
    activeFundraisers: last.activeFundraisers ?? 0,
    activeTeams: last.activeTeams ?? 0,
    productivity: last.productivity ?? 0,
    avgMonthlyDonation: last.avgMonthlyDonation ?? 0,
    avgDonorAge: last.avgDonorAge ?? 0,
    retentionByWeek,
  };
}
