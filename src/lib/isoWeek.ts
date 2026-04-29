// ISO 8601 week helpers. Years can have 52 or 53 ISO weeks — naively assuming
// 52 hides the last week of long years (2026, 2032, 2037, …) from selectors.

export function computeIsoWeek(d: Date): number {
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  utc.setUTCDate(utc.getUTCDate() + 4 - (utc.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function weeksInIsoYear(year: number): number {
  // A year has 53 ISO weeks iff Jan 1 is Thursday OR (it is leap AND Jan 1 is Wednesday).
  const jan1Dow = new Date(Date.UTC(year, 0, 1)).getUTCDay() || 7; // 1=Mon … 7=Sun
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  if (jan1Dow === 4) return 53;
  if (isLeap && jan1Dow === 3) return 53;
  return 52;
}
