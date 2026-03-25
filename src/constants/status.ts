import { StatusMap } from '@/types';

export const statusMap: StatusMap = {
  'pas_demande': { text: 'Pas demand\u00e9', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
  'informe': { text: 'Inform\u00e9', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  'refuse': { text: 'Refus\u00e9', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  'telescope': { text: 'T\u00e9lescop\u00e9', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  'fait': { text: 'Faites', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' }
};
