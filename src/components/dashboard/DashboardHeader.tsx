import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, RefreshCw } from 'lucide-react';
import { weeksInIsoYear } from '@/lib/isoWeek';
import type { CampaignMetricsDto } from '@/types/api';

const translations = {
  en: {
    week: 'Week',
    year: 'Year',
    campaign: 'Campaign',
    allCampaigns: 'All campaigns',
    refresh: 'Refresh',
    updatedJustNow: 'Updated just now',
    updatedMinutesAgo: 'Updated {n}m ago',
    updatedHoursAgo: 'Updated {n}h ago',
  },
  fr: {
    week: 'Semaine',
    year: 'Année',
    campaign: 'Campagne',
    allCampaigns: 'Toutes les campagnes',
    refresh: 'Actualiser',
    updatedJustNow: 'Mis à jour à l’instant',
    updatedMinutesAgo: 'Il y a {n} min',
    updatedHoursAgo: 'Il y a {n} h',
  },
};

export interface DashboardHeaderProps {
  lang: 'en' | 'fr';
  t: (key: keyof typeof translations.en) => string;
  week: number;
  year: number;
  setWeek: (w: number) => void;
  setYear: (y: number) => void;
  selectedCampaignId: string | null;
  setSelectedCampaignId: (id: string | null) => void;
  campaigns: CampaignMetricsDto[];
  onRefresh: () => void;
  isRefreshing?: boolean;
  lastUpdated: number | null;
}

// Pure date math — keep outside the component so the formatter doesn't
// re-allocate on every render.
function formatLastUpdated(ts: number | null, t: DashboardHeaderProps['t'], tick: number): string {
  if (!ts) return '';
  // `tick` is read so the caller can re-render via state without us ignoring it.
  void tick;
  const diffMs = Date.now() - ts;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return t('updatedJustNow');
  if (minutes < 60) return t('updatedMinutesAgo').replace('{n}', String(minutes));
  const hours = Math.floor(minutes / 60);
  return t('updatedHoursAgo').replace('{n}', String(hours));
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  lang,
  t,
  week,
  year,
  setWeek,
  setYear,
  selectedCampaignId,
  setSelectedCampaignId,
  campaigns,
  onRefresh,
  isRefreshing = false,
  lastUpdated,
}) => {
  // Day rollover only matters once per day — schedule the next update to fire
  // at the next local-midnight rather than polling every minute.
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0, 0, 5,
    );
    const ms = Math.max(60_000, nextMidnight.getTime() - now.getTime());
    const t = setTimeout(() => setToday(new Date()), ms);
    return () => clearTimeout(t);
  }, [today]);

  // Tick the "updated Xmin ago" label every 30s without re-rendering anything
  // expensive (the whole header is light).
  const [updatedTick, setUpdatedTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setUpdatedTick((n) => n + 1), 30_000);
    return () => clearInterval(i);
  }, []);

  const dateString = today.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const weeks = useMemo(
    () => Array.from({ length: weeksInIsoYear(year) }, (_, i) => i + 1),
    [year],
  );
  const currentYear = new Date().getFullYear();
  // Cap the upper bound at the current calendar year — selecting a future year
  // produces no data and an empty UI with no explanation. Keep the two prior
  // years for historical lookback.
  const years = [currentYear - 2, currentYear - 1, currentYear];

  // If the selected week falls outside the new year's max (e.g. picking a
  // 52-week year while week=53 is selected), clamp it.
  useEffect(() => {
    const max = weeksInIsoYear(year);
    if (week > max) setWeek(max);
  }, [year, week, setWeek]);

  const updatedLabel = formatLastUpdated(lastUpdated, t, updatedTick);

  const innerSelectClasses =
    'bg-transparent text-[var(--text-primary)] font-bold text-sm py-1 px-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700';

  return (
    <header className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6 h-12 md:h-16 flex-wrap">
      {/* Combined Week / Year / Campaign filter pill */}
      <div className="flex items-center gap-2 bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-xl p-1.5 shadow-sm">
        <CalendarDays size={16} className="text-orange-600 ml-1" />
        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
          {t('week')}
        </label>
        <select
          value={week}
          onChange={(e) => setWeek(Number(e.target.value))}
          className={innerSelectClasses}
        >
          {weeks.map((w) => (
            <option key={w} value={w}>
              S{w}
            </option>
          ))}
        </select>
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />
        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
          {t('year')}
        </label>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className={innerSelectClasses}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />
        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
          {t('campaign')}
        </label>
        <select
          value={selectedCampaignId ?? ''}
          onChange={(e) => setSelectedCampaignId(e.target.value === '' ? null : e.target.value)}
          className={innerSelectClasses}
          aria-label={t('campaign')}
        >
          <option value="">{t('allCampaigns')}</option>
          {campaigns.map((c) => (
            <option key={c.campaignId} value={c.campaignId}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-grow" />

      {updatedLabel && (
        <span
          className="hidden md:inline text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider"
          aria-live="polite"
        >
          {updatedLabel}
        </span>
      )}

      <div className="hidden lg:flex flex-col items-end justify-center px-3 border-r border-gray-200/50 dark:border-[var(--border-subtle)]">
        <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide first-letter:uppercase">
          {dateString}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label={t('refresh')}
          aria-busy={isRefreshing}
          title={t('refresh')}
          className="flex items-center gap-1.5 text-slate-600 dark:text-[var(--text-secondary)] font-bold bg-white dark:bg-[var(--bg-card-solid)] px-2.5 py-2 md:px-3 md:py-2 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-[var(--bg-card-solid)] focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : undefined} />
          <span className="hidden md:inline text-xs">{t('refresh')}</span>
        </button>
      </div>
    </header>
  );
};

export { translations };
