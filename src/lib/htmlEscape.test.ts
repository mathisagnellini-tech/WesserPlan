import { describe, expect, it } from 'vitest';
import { escapeHtml, safeColor } from './htmlEscape';

describe('escapeHtml', () => {
  it('escapes the six dangerous HTML metacharacters', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;&#47;script&gt;',
    );
  });

  it('escapes ampersands first to avoid double-encoding', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B');
    expect(escapeHtml('a&amp;b')).toBe('a&amp;amp;b');
  });

  it('escapes single quotes and backticks', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s');
    expect(escapeHtml('`x`')).toBe('&#96;x&#96;');
  });

  it('returns empty string for null / undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('coerces non-strings via String()', () => {
    expect(escapeHtml(42)).toBe('42');
    expect(escapeHtml(true)).toBe('true');
  });

  it('passes through plain text unchanged', () => {
    expect(escapeHtml('Seine-Maritime · Maeva')).toBe('Seine-Maritime · Maeva');
  });
});

describe('safeColor', () => {
  it('accepts valid hex colors', () => {
    expect(safeColor('#fff', '#000')).toBe('#fff');
    expect(safeColor('#FF5B2B', '#000')).toBe('#FF5B2B');
    expect(safeColor('#1234abcd', '#000')).toBe('#1234abcd');
  });

  it('accepts rgb / rgba / hsl / hsla', () => {
    expect(safeColor('rgb(255, 0, 0)', '#000')).toBe('rgb(255, 0, 0)');
    expect(safeColor('rgba(0,0,0,0.5)', '#000')).toBe('rgba(0,0,0,0.5)');
    expect(safeColor('hsl(120, 50%, 50%)', '#000')).toBe('hsl(120, 50%, 50%)');
  });

  it('accepts CSS color keywords', () => {
    expect(safeColor('orange', '#000')).toBe('orange');
    expect(safeColor('red', '#000')).toBe('red');
  });

  it('rejects style-injection attempts', () => {
    expect(safeColor('red; background: url(/x)', '#000')).toBe('#000');
    expect(safeColor('expression(alert(1))', '#000')).toBe('#000');
    expect(safeColor('"; alert(1); //', '#000')).toBe('#000');
    expect(safeColor('<script>', '#000')).toBe('#000');
  });

  it('rejects non-strings', () => {
    expect(safeColor(undefined, '#fff')).toBe('#fff');
    expect(safeColor(null, '#fff')).toBe('#fff');
    expect(safeColor(42, '#fff')).toBe('#fff');
  });

  it('trims whitespace before validating', () => {
    expect(safeColor('  #ff0000  ', '#000')).toBe('#ff0000');
  });
});
