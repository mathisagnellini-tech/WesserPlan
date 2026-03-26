import React from 'react';
import type { Horaires } from './types';

export const LEADERS = ["Thomas R.", "Sarah L.", "Moussa D.", "Julie B.", "Alexandre K.", "Non assigné"];

export const ETAPES_PROGRESSION = [
    "À traiter",
    "Mail 1",
    "À appeler",
    "Doc. requis",
    "Mail Final"
];

export const ORGS_CONFIG: Record<string, { color: string, bg: string, border: string, label: string, glow: string }> = {
    'msf': { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'MSF', glow: 'hover:shadow-red-500/20 hover:border-red-300' },
    'unicef': { color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', label: 'UNICEF', glow: 'hover:shadow-orange-500/20 hover:border-orange-300' },
    'wwf': { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'WWF', glow: 'hover:shadow-green-500/20 hover:border-green-300' },
    'mdm': { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', label: 'MDM', glow: 'hover:shadow-orange-500/20 hover:border-orange-300' }
};

export const getISOWeek = (date: Date = new Date()) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export const getCalculatedWeekString = (startWeek: number, offset: number) => {
    let week = startWeek + offset;
    let year = 2025;
    while (week > 52) {
        week -= 52;
        year++;
    }
    return `${year}-W${week.toString().padStart(2, '0')}`;
};

export const getDateFromWeek = (weekStr: string) => {
    if (!weekStr) return new Date();
    const [yearStr, weekNumStr] = weekStr.split('-W');
    const year = parseInt(yearStr);
    const week = parseInt(weekNumStr);

    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4)
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());

    return ISOweekStart;
};

export const getDateFromWeekNumber = (weekNum: number) => {
    return getDateFromWeek(`2025-W${weekNum}`);
};

export const isMairieOpen = (horaires: Horaires): boolean => {
    const now = new Date();
    const days = ['di', 'lu', 'ma', 'me', 'je', 've', 'sa'];
    const dayCode = days[now.getDay()];
    const time = now.getHours() * 60 + now.getMinutes();

    if (!horaires[dayCode]) return false;

    return horaires[dayCode].some(creneau => {
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
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' }).format(d);
};

export const formatCommentText = (text: string) => {
    const regex = /(\d{1,2}[-\/]\d{1,2}(?:[-\/]\d{2,4})?)|(\d{1,2}[h:]\d{2})/gi;
    const parts = text.split(regex);
    return (
        React.createElement('span', null,
            parts.map((part, i) => {
                if (!part) return null;
                if (part.match(regex)) {
                    return React.createElement('span', { key: i, className: "text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-500/15 px-1 rounded" }, part);
                }
                return React.createElement('span', { key: i }, part);
            })
        )
    );
};

export const standardHoraires = {
    lu: ["09:00-12:00", "14:00-17:00"],
    ma: ["09:00-12:00", "14:00-17:00"],
    me: ["09:00-12:00"],
    je: ["09:00-12:00", "14:00-18:00"],
    ve: ["09:00-12:00", "14:00-16:00"],
};
