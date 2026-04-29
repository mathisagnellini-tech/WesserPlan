import type {
  ClusterAnalyticsResponseDto,
  WeeklyMetricDto,
} from '@/types/api';

// The backend's weekly-performance endpoint returns one row per
// (week, campaign). When the user filters to "all campaigns" we get N rows
// per week and must aggregate them like WesserDashboard does:
//  • donorsRecruited / activeTeams: SUM across campaigns
//  • productivity: weighted average by activeFundraisers
//  • activeFundraisers: prefer cluster-analytics tenure split
//    (w1 + w2To4 + w5Plus); fall back to summing weeklyPerf rows.

export interface AggregatedWeek {
  weekNumber: number;
  year: number;
  donorsRecruited: number;
  activeTeams: number;
  activeFundraisers: number;
  productivity: number;
}

export interface SelectedKpis {
  week: number;
  year: number;
  donorsRecruited: number;
  activeFundraisers: number;
  activeTeams: number;
  productivity: number;
  /** True when the chosen week is not the user-selected one (data-fallback). */
  isFallback: boolean;
}

export function aggregateWeek(rows: WeeklyMetricDto[]): AggregatedWeek {
  const donorsRecruited = rows.reduce((s, r) => s + (r.donorsRecruited ?? 0), 0);
  const activeTeams = rows.reduce((s, r) => s + (r.activeTeams ?? 0), 0);
  const sumFundraisers = rows.reduce((s, r) => s + (r.activeFundraisers ?? 0), 0);
  const weightedProd = rows.reduce(
    (s, r) => s + (r.productivity ?? 0) * (r.activeFundraisers ?? 0),
    0,
  );
  const productivity = sumFundraisers > 0 ? weightedProd / sumFundraisers : 0;
  return {
    weekNumber: rows[0].weekNumber,
    year: rows[0].year,
    donorsRecruited,
    activeTeams,
    activeFundraisers: sumFundraisers,
    productivity,
  };
}

export function fundraisersFromClusters(
  cluster: ClusterAnalyticsResponseDto | null | undefined,
  weekNumber: number,
  year: number,
): number | null {
  const bucket = cluster?.data?.find(
    (d) => d.weekNumber === weekNumber && (d.year === undefined || d.year === year),
  );
  const split = bucket?.fundraiserSplit;
  if (!split) return null;
  return (split.w1 ?? 0) + (split.w2To4 ?? 0) + (split.w5Plus ?? 0);
}

const isUseful = (a: AggregatedWeek): boolean =>
  a.donorsRecruited > 0 ||
  a.activeFundraisers > 0 ||
  a.activeTeams > 0 ||
  a.productivity > 0;

export function selectKpis(
  series: WeeklyMetricDto[] | null | undefined,
  cluster: ClusterAnalyticsResponseDto | null | undefined,
  selectedWeek: number,
  selectedYear: number,
): SelectedKpis | null {
  if (!series?.length) return null;

  const groups = new Map<string, WeeklyMetricDto[]>();
  for (const row of series) {
    const key = `${row.year}-${row.weekNumber}`;
    const arr = groups.get(key) ?? [];
    arr.push(row);
    groups.set(key, arr);
  }

  const selectedRows = groups.get(`${selectedYear}-${selectedWeek}`);
  const selected = selectedRows ? aggregateWeek(selectedRows) : null;

  let chosen = selected && isUseful(selected) ? selected : null;
  if (!chosen) {
    // Walk weeks descending until we find one with data.
    const sortedKeys = [...groups.keys()].sort((a, b) => {
      const [ya, wa] = a.split('-').map(Number);
      const [yb, wb] = b.split('-').map(Number);
      return yb - ya || wb - wa;
    });
    for (const k of sortedKeys) {
      const cand = aggregateWeek(groups.get(k)!);
      if (isUseful(cand)) {
        chosen = cand;
        break;
      }
    }
  }
  if (!chosen) return null;

  const tenureFR = fundraisersFromClusters(cluster, chosen.weekNumber, chosen.year);

  return {
    week: chosen.weekNumber,
    year: chosen.year,
    donorsRecruited: chosen.donorsRecruited,
    activeFundraisers: tenureFR ?? chosen.activeFundraisers,
    activeTeams: chosen.activeTeams,
    productivity: chosen.productivity,
    isFallback:
      !selected ||
      chosen.weekNumber !== selected.weekNumber ||
      chosen.year !== selected.year,
  };
}
