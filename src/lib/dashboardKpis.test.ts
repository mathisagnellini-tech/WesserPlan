import { describe, expect, it } from 'vitest';
import {
  aggregateWeek,
  fundraisersFromClusters,
  selectKpis,
} from './dashboardKpis';
import type {
  ClusterAnalyticsResponseDto,
  WeeklyMetricDto,
} from '@/types/api';

const baseRow: WeeklyMetricDto = {
  week: 'S18-2026',
  weekNumber: 18,
  year: 2026,
  startDate: '2026-04-27',
  endDate: '2026-05-03',
  campaignId: 'c1',
  name: 'Spring',
  donorsRecruited: 0,
  productivity: 0,
  avgMonthlyDonation: 0,
  avgDonorAge: 0,
  activeFundraisers: 0,
  activeTeams: 0,
  newcomers: 0,
  totalDailyRevenue: 0,
};

describe('aggregateWeek', () => {
  it('sums donorsRecruited and activeTeams across rows', () => {
    const result = aggregateWeek([
      { ...baseRow, donorsRecruited: 10, activeTeams: 3 },
      { ...baseRow, donorsRecruited: 7, activeTeams: 2 },
    ]);
    expect(result.donorsRecruited).toBe(17);
    expect(result.activeTeams).toBe(5);
  });

  it('weights productivity by activeFundraisers', () => {
    const result = aggregateWeek([
      { ...baseRow, productivity: 4, activeFundraisers: 10 }, // contributes 40
      { ...baseRow, productivity: 1, activeFundraisers: 30 }, // contributes 30
    ]);
    // Σ(prod * activeFR) / Σ(activeFR) = 70 / 40 = 1.75
    expect(result.productivity).toBeCloseTo(1.75, 5);
    expect(result.activeFundraisers).toBe(40);
  });

  it('returns 0 productivity when there are no fundraisers (avoids /0)', () => {
    const result = aggregateWeek([
      { ...baseRow, productivity: 5, activeFundraisers: 0 },
    ]);
    expect(result.productivity).toBe(0);
  });
});

describe('fundraisersFromClusters', () => {
  const cluster: ClusterAnalyticsResponseDto = {
    data: [
      {
        weekNumber: 18,
        year: 2026,
        fundraiserSplit: { w1: 4, w2To4: 8, w5Plus: 12 },
      },
      {
        weekNumber: 17,
        year: 2026,
        fundraiserSplit: { w1: 2, w2To4: 5, w5Plus: 9 },
      },
    ],
  };

  it('returns w1+w2To4+w5Plus for the matched week', () => {
    expect(fundraisersFromClusters(cluster, 18, 2026)).toBe(24);
    expect(fundraisersFromClusters(cluster, 17, 2026)).toBe(16);
  });

  it('returns null when the bucket or split is missing', () => {
    expect(fundraisersFromClusters(cluster, 99, 2026)).toBeNull();
    expect(fundraisersFromClusters(null, 18, 2026)).toBeNull();
    expect(fundraisersFromClusters(undefined, 18, 2026)).toBeNull();
  });

  it('treats missing tenure values as 0', () => {
    const c: ClusterAnalyticsResponseDto = {
      data: [{ weekNumber: 1, year: 2026, fundraiserSplit: { w1: 3 } }],
    };
    expect(fundraisersFromClusters(c, 1, 2026)).toBe(3);
  });
});

describe('selectKpis', () => {
  it('returns null when the series is empty / null', () => {
    expect(selectKpis(null, null, 18, 2026)).toBeNull();
    expect(selectKpis([], null, 18, 2026)).toBeNull();
  });

  it('aggregates rows for the selected (year, week)', () => {
    const series: WeeklyMetricDto[] = [
      { ...baseRow, weekNumber: 18, year: 2026, donorsRecruited: 10, activeTeams: 3, activeFundraisers: 12, productivity: 2 },
      { ...baseRow, weekNumber: 18, year: 2026, donorsRecruited: 5, activeTeams: 2, activeFundraisers: 8, productivity: 4 },
    ];
    const result = selectKpis(series, null, 18, 2026);
    expect(result).not.toBeNull();
    expect(result!.donorsRecruited).toBe(15);
    expect(result!.activeTeams).toBe(5);
    expect(result!.activeFundraisers).toBe(20);
    // Weighted: (2*12 + 4*8) / (12+8) = (24+32)/20 = 2.8
    expect(result!.productivity).toBeCloseTo(2.8, 5);
    expect(result!.isFallback).toBe(false);
  });

  it('falls back to the most recent useful week when the selected one is empty', () => {
    const series: WeeklyMetricDto[] = [
      { ...baseRow, weekNumber: 17, year: 2026, donorsRecruited: 9, activeTeams: 3, activeFundraisers: 11, productivity: 1 },
      { ...baseRow, weekNumber: 18, year: 2026 }, // all zeros — current in-progress week
    ];
    const result = selectKpis(series, null, 18, 2026);
    expect(result).not.toBeNull();
    expect(result!.week).toBe(17);
    expect(result!.isFallback).toBe(true);
  });

  it('prefers cluster-analytics tenure-based fundraisers over the row sum', () => {
    const series: WeeklyMetricDto[] = [
      { ...baseRow, weekNumber: 18, year: 2026, donorsRecruited: 1, activeFundraisers: 999 },
    ];
    const cluster: ClusterAnalyticsResponseDto = {
      data: [{ weekNumber: 18, year: 2026, fundraiserSplit: { w1: 1, w2To4: 2, w5Plus: 3 } }],
    };
    const result = selectKpis(series, cluster, 18, 2026);
    expect(result!.activeFundraisers).toBe(6);
  });

  it('returns null if no week has any useful data', () => {
    const series: WeeklyMetricDto[] = [
      { ...baseRow, weekNumber: 18, year: 2026 },
      { ...baseRow, weekNumber: 17, year: 2026 },
    ];
    expect(selectKpis(series, null, 18, 2026)).toBeNull();
  });
});
