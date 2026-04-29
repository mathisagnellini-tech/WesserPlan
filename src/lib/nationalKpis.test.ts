import { describe, expect, it } from 'vitest';
import { buildNationalKpis } from './nationalKpis';
import type { WeeklyMetricDto } from '@/types/api';

const makeRow = (overrides: Partial<WeeklyMetricDto> = {}): WeeklyMetricDto => ({
  week: '2026-W01',
  weekNumber: 1,
  year: 2026,
  startDate: '2026-01-05',
  endDate: '2026-01-11',
  campaignId: 'c1',
  name: 'Default',
  donorsRecruited: 0,
  productivity: 0,
  avgMonthlyDonation: 0,
  avgDonorAge: 0,
  activeFundraisers: 0,
  activeTeams: 0,
  newcomers: 0,
  totalDailyRevenue: 0,
  ...overrides,
});

describe('buildNationalKpis', () => {
  it('returns the empty shape for null / [] input', () => {
    const empty = buildNationalKpis(null);
    expect(empty.weeklyDonors).toEqual([]);
    expect(empty.activeFundraisers).toBe(0);
    expect(buildNationalKpis([]).weekLabels).toEqual([]);
  });

  it('sorts chronologically across year boundaries', () => {
    // Out of order across two years — must sort 2025-W52, 2026-W01, 2026-W02.
    const rows = [
      makeRow({ year: 2026, weekNumber: 2, donorsRecruited: 30 }),
      makeRow({ year: 2025, weekNumber: 52, donorsRecruited: 10 }),
      makeRow({ year: 2026, weekNumber: 1, donorsRecruited: 20 }),
    ];
    const k = buildNationalKpis(rows);
    expect(k.weeklyDonors).toEqual([10, 20, 30]);
    expect(k.weekLabels).toEqual(['S52', 'S1', 'S2']);
  });

  it('takes the last sorted row for the trailing scalars', () => {
    const rows = [
      makeRow({ year: 2026, weekNumber: 1, activeFundraisers: 100, productivity: 1.0 }),
      makeRow({ year: 2026, weekNumber: 2, activeFundraisers: 120, productivity: 1.5 }),
    ];
    const k = buildNationalKpis(rows);
    expect(k.activeFundraisers).toBe(120);
    expect(k.productivity).toBe(1.5);
  });

  it('computes retention as a 0..100 percentage of cumulative newcomers', () => {
    const rows = [
      makeRow({ year: 2026, weekNumber: 1, newcomers: 50, activeFundraisers: 50 }),
      makeRow({ year: 2026, weekNumber: 2, newcomers: 50, activeFundraisers: 75 }),
    ];
    const k = buildNationalKpis(rows);
    // Week 1: 50/50 = 100%; week 2: 75/(50+50) = 75%.
    expect(k.retentionByWeek).toEqual([100, 75]);
  });

  it('clamps retention to [0, 100]', () => {
    const rows = [
      makeRow({ year: 2026, weekNumber: 1, newcomers: 10, activeFundraisers: 1000 }),
    ];
    expect(buildNationalKpis(rows).retentionByWeek).toEqual([100]);
  });

  it('returns 0 retention when no newcomers have been recorded yet', () => {
    const rows = [
      makeRow({ year: 2026, weekNumber: 1, newcomers: 0, activeFundraisers: 200 }),
    ];
    expect(buildNationalKpis(rows).retentionByWeek).toEqual([0]);
  });

  it('treats missing fields as 0 instead of NaN', () => {
    const rows = [
      makeRow({
        year: 2026,
        weekNumber: 1,
        donorsRecruited: undefined as unknown as number,
        totalDailyRevenue: undefined as unknown as number,
        newcomers: undefined as unknown as number,
        activeFundraisers: undefined as unknown as number,
      }),
    ];
    const k = buildNationalKpis(rows);
    expect(k.weeklyDonors).toEqual([0]);
    expect(k.weeklyVolume).toEqual([0]);
    expect(k.retentionByWeek).toEqual([0]);
  });
});
