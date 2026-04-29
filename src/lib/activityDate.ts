// Date helpers for the dashboard activity feed. Kept as pure functions in lib
// so they're independently testable from the React component tree.

export type DateMode = 'today' | 'yesterday' | 'specific';

/** Convert a form (date-mode + HH:MM time) into a real ISO 8601 timestamp. */
export function buildOccurredAt(dateMode: DateMode, specificDate: string, time: string, now: Date = new Date()): string {
  // Default malformed or missing parts to 0 so we never construct an invalid Date.
  const [rawHh, rawMm] = time.split(':');
  const hh = Number.isFinite(Number(rawHh)) ? Number(rawHh) : 0;
  const mm = Number.isFinite(Number(rawMm)) ? Number(rawMm) : 0;
  const base = new Date(now);
  if (dateMode === 'yesterday') {
    base.setDate(base.getDate() - 1);
  } else if (dateMode === 'specific' && specificDate) {
    const parts = specificDate.split('-').map(Number);
    if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
      base.setFullYear(parts[0], parts[1] - 1, parts[2]);
    }
  }
  base.setHours(hh, mm, 0, 0);
  return base.toISOString();
}

/** Format an ISO timestamp into the (HH:MM, "Auj." | "Hier" | "DD/MM") pair shown in the feed. */
export function formatActivityDate(iso: string, now: Date = new Date()): { time: string; date: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { time: '--:--', date: '—' };
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const ymd = (x: Date) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
  if (ymd(d) === ymd(now)) return { time, date: 'Auj.' };
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (ymd(d) === ymd(yesterday)) return { time, date: 'Hier' };
  return {
    time,
    date: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
  };
}
