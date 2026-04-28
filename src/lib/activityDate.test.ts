import { describe, expect, it } from 'vitest';
import { buildOccurredAt, formatActivityDate } from './activityDate';

describe('buildOccurredAt', () => {
  // Anchor "now" so the test is deterministic across timezones.
  const now = new Date(2026, 3, 28, 15, 30, 0); // Tue 28 Apr 2026, 15:30 local

  it('uses today + provided HH:MM by default', () => {
    const iso = buildOccurredAt('today', '', '09:00', now);
    const d = new Date(iso);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(3);
    expect(d.getDate()).toBe(28);
    expect(d.getHours()).toBe(9);
    expect(d.getMinutes()).toBe(0);
  });

  it('shifts to yesterday', () => {
    const iso = buildOccurredAt('yesterday', '', '14:00', now);
    const d = new Date(iso);
    expect(d.getDate()).toBe(27);
    expect(d.getHours()).toBe(14);
  });

  it('parses an ISO date for "specific" mode', () => {
    const iso = buildOccurredAt('specific', '2024-12-25', '08:30', now);
    const d = new Date(iso);
    expect(d.getFullYear()).toBe(2024);
    expect(d.getMonth()).toBe(11);
    expect(d.getDate()).toBe(25);
    expect(d.getHours()).toBe(8);
    expect(d.getMinutes()).toBe(30);
  });

  it('coerces malformed time to 00:00', () => {
    const iso = buildOccurredAt('today', '', 'bogus', now);
    const d = new Date(iso);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });

  it('falls back to "today" when specific mode is given an empty date', () => {
    const iso = buildOccurredAt('specific', '', '10:00', now);
    const d = new Date(iso);
    expect(d.getDate()).toBe(28);
  });
});

describe('formatActivityDate', () => {
  const now = new Date(2026, 3, 28, 15, 0, 0);

  it('renders today as "Auj." with HH:MM', () => {
    const same = new Date(2026, 3, 28, 9, 5, 0).toISOString();
    expect(formatActivityDate(same, now)).toEqual({ time: '09:05', date: 'Auj.' });
  });

  it('renders yesterday as "Hier"', () => {
    const yesterday = new Date(2026, 3, 27, 17, 30, 0).toISOString();
    expect(formatActivityDate(yesterday, now)).toEqual({ time: '17:30', date: 'Hier' });
  });

  it('renders older dates as DD/MM', () => {
    const older = new Date(2026, 0, 5, 8, 0, 0).toISOString();
    expect(formatActivityDate(older, now)).toEqual({ time: '08:00', date: '05/01' });
  });

  it('zero-pads single-digit hours and minutes', () => {
    const t = new Date(2026, 3, 28, 7, 4, 0).toISOString();
    expect(formatActivityDate(t, now).time).toBe('07:04');
  });

  it('returns sentinel placeholders for an invalid timestamp', () => {
    expect(formatActivityDate('not-a-date', now)).toEqual({ time: '--:--', date: '—' });
  });
});
