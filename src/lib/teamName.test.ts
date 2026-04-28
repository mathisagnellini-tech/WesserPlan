import { describe, expect, it } from 'vitest';
import {
  deptCodeForCoords,
  deptCodeForName,
  normalizeName,
  parseTeamName,
} from './teamName';

describe('normalizeName', () => {
  it('lowercases and strips combining accents', () => {
    expect(normalizeName('Côtes-d’Armor')).toBe("cotes-d’armor");
    expect(normalizeName('Hauts-de-Seine')).toBe('hauts-de-seine');
    expect(normalizeName('SEINE-MARITIME')).toBe('seine-maritime');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeName('  Paris  ')).toBe('paris');
  });
});

describe('parseTeamName', () => {
  it('parses the canonical 4-segment shape', () => {
    expect(parseTeamName('S18 - WWF - Seine-Maritime - Maeva C')).toEqual({
      weekLabel: 'S18',
      org: 'wwf',
      department: 'Seine-Maritime',
      leader: 'Maeva C',
    });
  });

  it('preserves dept names that contain " - " by re-joining them', () => {
    // 5 segments: week, org, dept-part-1, dept-part-2, leader. Department
    // gets the joined "dept-part-1 - dept-part-2".
    expect(parseTeamName('S03 - MSF - Provence - Alpes - Marie L')).toEqual({
      weekLabel: 'S03',
      org: 'msf',
      department: 'Provence - Alpes',
      leader: 'Marie L',
    });
  });

  it('lowercases the org key', () => {
    expect(parseTeamName('S01 - UNICEF - Paris - X').org).toBe('unicef');
  });

  it('returns the raw input as a best-effort leader for malformed input', () => {
    expect(parseTeamName('garbage')).toEqual({ leader: 'garbage' });
    expect(parseTeamName('only - two')).toEqual({ leader: 'only - two' });
  });

  it('returns empty object for falsy input', () => {
    expect(parseTeamName('')).toEqual({});
  });
});

describe('deptCodeForName', () => {
  it('resolves canonical names to dept codes', () => {
    expect(deptCodeForName('Paris')).toBe('75');
    expect(deptCodeForName('Seine-Maritime')).toBe('76');
  });

  it('is case- and accent-insensitive', () => {
    expect(deptCodeForName('CÔTES-D’ARMOR')).toBe(deptCodeForName('Côtes-d’Armor'));
  });

  it('returns undefined for unknown / missing input', () => {
    expect(deptCodeForName(undefined)).toBeUndefined();
    expect(deptCodeForName('Atlantis')).toBeUndefined();
  });
});

describe('deptCodeForCoords', () => {
  it('returns the closest dept capital', () => {
    // Paris is at ~48.85, 2.35 — Paris dept is "75".
    expect(deptCodeForCoords(48.85, 2.35)).toBe('75');
  });

  it('returns a valid dept code for any reasonable lat/lng', () => {
    const code = deptCodeForCoords(45.76, 4.84); // Lyon
    expect(code).toBeTypeOf('string');
    expect(code).not.toBe('');
  });
});
