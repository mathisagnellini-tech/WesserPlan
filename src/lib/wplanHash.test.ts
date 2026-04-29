import { describe, expect, it } from 'vitest';
import { hashCode } from './wplanHash';

describe('hashCode', () => {
  it('returns a non-negative integer for any non-empty input', () => {
    expect(hashCode('abc')).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(hashCode('abc'))).toBe(true);
  });

  it('returns 0 for an empty string', () => {
    expect(hashCode('')).toBe(0);
  });

  it('is deterministic across calls', () => {
    expect(hashCode('Seine-Maritime')).toBe(hashCode('Seine-Maritime'));
  });

  it('differentiates similar inputs', () => {
    expect(hashCode('density:75')).not.toBe(hashCode('income:75'));
    expect(hashCode('75')).not.toBe(hashCode('76'));
  });
});
