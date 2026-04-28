import { describe, expect, it } from 'vitest';
import { getCalculatedWeekString, parseWeekString } from './helpers';

describe('getCalculatedWeekString', () => {
  it('formats with leading-zero week and explicit base year', () => {
    expect(getCalculatedWeekString(5, 0, 2024)).toBe('2024-W05');
    expect(getCalculatedWeekString(5, 1, 2024)).toBe('2024-W06');
  });

  it('rolls over a 52-week year correctly', () => {
    // 2024 has 52 ISO weeks → S52 + 1 = next-year W01
    expect(getCalculatedWeekString(52, 1, 2024)).toBe('2025-W01');
  });

  it('rolls over a 53-week year correctly', () => {
    // 2026 has 53 ISO weeks (Jan 1 is Thursday) — S53 + 1 must land on 2027-W01
    expect(getCalculatedWeekString(53, 1, 2026)).toBe('2027-W01');
    expect(getCalculatedWeekString(52, 1, 2026)).toBe('2026-W53');
  });

  it('does not hardcode the year — defaults to the current year when omitted', () => {
    const thisYear = new Date().getFullYear();
    expect(getCalculatedWeekString(1, 0)).toBe(`${thisYear}-W01`);
  });

  it('handles multi-week offsets that span more than one year', () => {
    // 2025 has 52 weeks. Start at S50 + 5 → 2025-W50 + 5 = 2026-W03
    expect(getCalculatedWeekString(50, 5, 2025)).toBe('2026-W03');
  });
});

describe('parseWeekString', () => {
  it('parses a valid YYYY-WNN string', () => {
    expect(parseWeekString('2026-W18')).toEqual({ year: 2026, week: 18 });
  });

  it('returns null for malformed input', () => {
    expect(parseWeekString('')).toBeNull();
    expect(parseWeekString(undefined)).toBeNull();
    expect(parseWeekString('garbage')).toBeNull();
    expect(parseWeekString('2026/W18')).toBeNull();
  });

  it('rejects out-of-range week numbers', () => {
    expect(parseWeekString('2025-W53')).toBeNull(); // 2025 has 52 weeks
    expect(parseWeekString('2025-W00')).toBeNull();
    expect(parseWeekString('2026-W54')).toBeNull();
  });

  it('accepts week 53 in a 53-week year', () => {
    expect(parseWeekString('2026-W53')).toEqual({ year: 2026, week: 53 });
  });
});
