import { describe, expect, it } from 'vitest';
import { calculateDuration, getZoneStatus, recalculateSchedule } from './clusteringService';
import type { Cluster } from '@/components/zone-maker/types';
import { MIN_1W, MIN_2W, MIN_3W } from '@/components/zone-maker/constants';

const mkCluster = (overrides: Partial<Cluster>): Cluster => ({
  id: 'x',
  code: '25A',
  communes: [],
  totalPopulation: 8000,
  color: '#000',
  durationWeeks: 1,
  startWeek: 0,
  assignedTeam: 0,
  sortLat: 0,
  ...overrides,
});

describe('calculateDuration', () => {
  it('selects 1/2/3 week based on population thresholds', () => {
    expect(calculateDuration(MIN_1W)).toBe(1);
    expect(calculateDuration(MIN_2W)).toBe(2);
    expect(calculateDuration(MIN_3W)).toBe(3);
    expect(calculateDuration(0)).toBe(1);
  });
});

describe('getZoneStatus', () => {
  it('flags below-minimum population as invalid', () => {
    expect(getZoneStatus(0).valid).toBe(false);
    expect(getZoneStatus(MIN_1W - 1).valid).toBe(false);
  });
  it('flags valid populations as valid', () => {
    expect(getZoneStatus(MIN_1W).valid).toBe(true);
    expect(getZoneStatus(MIN_2W).valid).toBe(true);
    expect(getZoneStatus(MIN_3W).valid).toBe(true);
  });
});

describe('recalculateSchedule', () => {
  it('keeps draft clusters at startWeek 0', () => {
    const draft = mkCluster({ id: 'd1', assignedTeam: 0, startWeek: 0, durationWeeks: 1 });
    const result = recalculateSchedule([draft]);
    expect(result[0].startWeek).toBe(0);
  });

  it('places unpinned scheduled clusters at the earliest available week', () => {
    const a = mkCluster({ id: 'a', assignedTeam: 1, startWeek: 5, durationWeeks: 2 });
    const b = mkCluster({ id: 'b', assignedTeam: 1, startWeek: 6, durationWeeks: 1 });
    const result = recalculateSchedule([a, b], {}, 1);
    // a sorts first (startWeek 5 < 6) → starts at 1, occupies weeks 1-2.
    // b starts at 3.
    const ra = result.find((r) => r.id === 'a')!;
    const rb = result.find((r) => r.id === 'b')!;
    expect(ra.startWeek).toBe(1);
    expect(rb.startWeek).toBe(3);
  });

  it('respects pinned clusters as fixed obstacles', () => {
    const pinned = mkCluster({ id: 'p', assignedTeam: 1, startWeek: 3, durationWeeks: 2, isPinned: true });
    const other = mkCluster({ id: 'o', assignedTeam: 1, startWeek: 1, durationWeeks: 1 });
    const result = recalculateSchedule([pinned, other], {}, 1);
    const rp = result.find((r) => r.id === 'p')!;
    const ro = result.find((r) => r.id === 'o')!;
    expect(rp.startWeek).toBe(3); // pinned untouched
    expect(ro.startWeek).toBe(1); // other placed before
  });

  it('skips weeks where capacity drops below the cluster team', () => {
    const c = mkCluster({ id: 'c', assignedTeam: 2, startWeek: 1, durationWeeks: 1 });
    // Week 1 cap is 1 (only team 1 available); week 2 cap is 2 (team 2 available).
    const result = recalculateSchedule([c], { 1: 1, 2: 2 }, 2);
    expect(result[0].startWeek).toBe(2);
  });

  it('does not mutate the input array', () => {
    const a = mkCluster({ id: 'a', assignedTeam: 1, startWeek: 5, durationWeeks: 1 });
    const input = [a];
    recalculateSchedule(input, {}, 1);
    expect(input[0].startWeek).toBe(5);
  });
});
