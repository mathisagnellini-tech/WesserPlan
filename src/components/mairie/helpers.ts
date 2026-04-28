import React from 'react';
import type { Horaires } from './types';
import type { Organization } from '@/types/commune';
import { ORGANIZATIONS } from '@/constants/organizations';
import { weeksInIsoYear } from '@/lib/isoWeek';

// Placeholder leader list — kept while there is no team_leaders table backing
// the dropdown. The UI surfaces this as a "Bientôt disponible" affordance.
export const LEADERS = ['Thomas R.', 'Sarah L.', 'Moussa D.', 'Julie B.', 'Alexandre K.', 'Non assigné'];

export const ETAPES_PROGRESSION = [
  'À traiter',
  'Mail 1',
  'À appeler',
  'Doc. requis',
  'Mail Final',
];

// Tailwind class theme keyed off Organization. Brand colours come from the
// canonical ORGANIZATIONS constant; this map adds the Tailwind shorthand
// used by the existing markup. Keep keys in sync with Organization values.
export const ORGS_CONFIG: Record<Organization, { color: string; bg: string; border: string; label: string; glow: string; brandColor: string }> = {
  msf:           { color: 'text-red-600',      bg: 'bg-red-50',     border: 'border-red-200',     label: 'MSF',           glow: 'hover:shadow-red-500/20 hover:border-red-300',     brandColor: ORGANIZATIONS.msf.color },
  unicef:        { color: 'text-sky-500',      bg: 'bg-sky-50',     border: 'border-sky-200',     label: 'UNICEF',        glow: 'hover:shadow-sky-500/20 hover:border-sky-300',     brandColor: ORGANIZATIONS.unicef.color },
  wwf:           { color: 'text-green-600',    bg: 'bg-green-50',   border: 'border-green-200',   label: 'WWF',           glow: 'hover:shadow-green-500/20 hover:border-green-300', brandColor: ORGANIZATIONS.wwf.color },
  mdm:           { color: 'text-blue-700',     bg: 'bg-blue-50',    border: 'border-blue-200',    label: 'MDM',           glow: 'hover:shadow-blue-500/20 hover:border-blue-300',   brandColor: ORGANIZATIONS.mdm.color },
  aides:         { color: 'text-pink-600',     bg: 'bg-pink-50',    border: 'border-pink-200',    label: 'AIDES',         glow: 'hover:shadow-pink-500/20 hover:border-pink-300',   brandColor: ORGANIZATIONS.aides.color },
  armeedusalut:  { color: 'text-rose-700',     bg: 'bg-rose-50',    border: 'border-rose-200',    label: 'Armée du Salut', glow: 'hover:shadow-rose-500/20 hover:border-rose-300',   brandColor: ORGANIZATIONS.armeedusalut.color },
};

export const orgTheme = (org: Organization | 'all' | undefined) => {
  if (!org || org === 'all') return ORGS_CONFIG.msf;
  return ORGS_CONFIG[org] ?? ORGS_CONFIG.msf;
};

export const getISOWeek = (date: Date = new Date()) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

// Build a `YYYY-WNN` label from a starting week and a positive offset, rolling
// over years correctly when the starting year has 53 ISO weeks. The previous
// implementation hardcoded `year = 2025` and assumed 52-week years, producing
// wrong labels for every zone created after 2025-12-31.
export const getCalculatedWeekString = (startWeek: number, offset: number, baseYear: number = new Date().getFullYear()): string => {
  let week = startWeek + offset;
  let year = baseYear;
  // Walk forward until the week fits inside the year's actual ISO range.
  let yearMax = weeksInIsoYear(year);
  while (week > yearMax) {
    week -= yearMax;
    year++;
    yearMax = weeksInIsoYear(year);
  }
  return `${year}-W${week.toString().padStart(2, '0')}`;
};

// Parse a `YYYY-WNN` label into a structured object. Returns null when the
// shape is unexpected so callers can guard against NaN.
export function parseWeekString(value: string | undefined | null): { year: number; week: number } | null {
  if (!value) return null;
  const match = /^(\d{4})-W(\d{1,2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(week)) return null;
  if (week < 1 || week > weeksInIsoYear(year)) return null;
  return { year, week };
}

export const getDateFromWeek = (weekStr: string): Date => {
  const parsed = parseWeekString(weekStr);
  if (!parsed) return new Date();
  const { year, week } = parsed;

  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  return ISOweekStart;
};

export const getDateFromWeekNumber = (weekNum: number, year: number = new Date().getFullYear()): Date => {
  return getDateFromWeek(`${year}-W${weekNum.toString().padStart(2, '0')}`);
};

export const isMairieOpen = (horaires: Horaires): boolean => {
  const now = new Date();
  const days = ['di', 'lu', 'ma', 'me', 'je', 've', 'sa'];
  const dayCode = days[now.getDay()];
  const time = now.getHours() * 60 + now.getMinutes();
  if (!horaires[dayCode]) return false;
  return horaires[dayCode].some((creneau) => {
    const [start, end] = creneau.split('-');
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startTime = sh * 60 + sm;
    const endTime = eh * 60 + em;
    return time >= startTime && time < endTime;
  });
};

export const formatDateComment = (isoString: string) => {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date);
};

export const formatDateShort = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' }).format(d);
};

export const formatCommentText = (text: string) => {
  const regex = /(\d{1,2}[-/]\d{1,2}(?:[-/]\d{2,4})?)|(\d{1,2}[h:]\d{2})/gi;
  const parts = text.split(regex);
  return React.createElement(
    'span',
    null,
    parts.map((part, i) => {
      if (!part) return null;
      if (part.match(regex)) {
        return React.createElement(
          'span',
          { key: i, className: 'text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-500/15 px-1 rounded' },
          part,
        );
      }
      return React.createElement('span', { key: i }, part);
    }),
  );
};

export const standardHoraires = {
  lu: ['09:00-12:00', '14:00-17:00'],
  ma: ['09:00-12:00', '14:00-17:00'],
  me: ['09:00-12:00'],
  je: ['09:00-12:00', '14:00-18:00'],
  ve: ['09:00-12:00', '14:00-16:00'],
};
