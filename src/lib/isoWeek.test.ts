import { describe, expect, it } from 'vitest';
import { computeIsoWeek, weeksInIsoYear } from './isoWeek';

describe('weeksInIsoYear', () => {
  it('returns 53 for years where Jan 1 is Thursday (2026, 2032)', () => {
    expect(weeksInIsoYear(2026)).toBe(53);
    expect(weeksInIsoYear(2032)).toBe(53);
  });

  it('returns 53 for leap years where Jan 1 is Wednesday (2020)', () => {
    expect(weeksInIsoYear(2020)).toBe(53);
  });

  it('returns 52 for ordinary years', () => {
    expect(weeksInIsoYear(2024)).toBe(52);
    expect(weeksInIsoYear(2025)).toBe(52);
    expect(weeksInIsoYear(2027)).toBe(52);
    expect(weeksInIsoYear(2028)).toBe(52);
  });
});

describe('computeIsoWeek', () => {
  it('treats Jan 1 of a year that starts on a Thursday as week 1', () => {
    // Jan 1 2026 is a Thursday → week 1.
    expect(computeIsoWeek(new Date(2026, 0, 1))).toBe(1);
  });

  it('treats Jan 1 2024 (Monday) as week 1', () => {
    expect(computeIsoWeek(new Date(2024, 0, 1))).toBe(1);
  });

  it('treats Jan 1 2023 (Sunday) as week 52 of 2022', () => {
    expect(computeIsoWeek(new Date(2023, 0, 1))).toBe(52);
  });

  it('handles mid-year dates', () => {
    // April 28 2026 is a Tuesday in ISO week 18.
    expect(computeIsoWeek(new Date(2026, 3, 28))).toBe(18);
  });
});
