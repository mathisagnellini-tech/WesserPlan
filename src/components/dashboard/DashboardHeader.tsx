import React, { useState, useEffect } from 'react';
import { Bell, ChevronDown, CalendarDays } from 'lucide-react';
import type { CampaignMetricsDto } from '@/types/api';

const translations = {
  en: {
    week: 'Week',
    year: 'Year',
    campaign: 'Campaign',
    allCampaigns: 'All campaigns',
  },
  fr: {
    week: 'Semaine',
    year: 'Année',
    campaign: 'Campagne',
    allCampaigns: 'Toutes les campagnes',
  },
};

export interface DashboardHeaderProps {
  lang: 'en' | 'fr';
  onLangChange: () => void;
  t: (key: keyof typeof translations.en) => string;
  week: number;
  year: number;
  setWeek: (w: number) => void;
  setYear: (y: number) => void;
  selectedCampaignId: string | null;
  setSelectedCampaignId: (id: string | null) => void;
  campaigns: CampaignMetricsDto[];
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  lang,
  onLangChange,
  t,
  week,
  year,
  setWeek,
  setYear,
  selectedCampaignId,
  setSelectedCampaignId,
  campaigns,
}) => {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const dateString = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const weeks = Array.from({ length: 52 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  const selectClasses =
    'bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-bold text-sm px-3 py-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors';

  return (
    <header className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6 h-12 md:h-16 flex-wrap">
      {/* Week selector */}
      <div className="flex items-center gap-2 bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-xl p-1.5 shadow-sm">
        <CalendarDays size={16} className="text-orange-600 ml-1" />
        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
          {t('week')}
        </label>
        <select
          value={week}
          onChange={(e) => setWeek(Number(e.target.value))}
          className="bg-transparent text-[var(--text-primary)] font-bold text-sm py-1 px-2 rounded-lg focus:outline-none cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
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
          className="bg-transparent text-[var(--text-primary)] font-bold text-sm py-1 px-2 rounded-lg focus:outline-none cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Campaign filter */}
      <select
        value={selectedCampaignId ?? ''}
        onChange={(e) => setSelectedCampaignId(e.target.value === '' ? null : e.target.value)}
        className={selectClasses}
        aria-label={t('campaign')}
      >
        <option value="">{t('allCampaigns')}</option>
        {campaigns.map((c) => (
          <option key={c.campaignId} value={c.campaignId}>
            {c.name}
          </option>
        ))}
      </select>

      <div className="flex-grow" />

      <div className="hidden md:flex flex-col items-end justify-center px-3 border-r border-gray-200/50 dark:border-[var(--border-subtle)]">
        <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide first-letter:uppercase">
          {dateString}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        <button
          onClick={onLangChange}
          aria-label={`Changer la langue (actuel : ${lang.toUpperCase()})`}
          className="hidden sm:flex items-center gap-2 text-slate-600 dark:text-[var(--text-secondary)] font-bold bg-white dark:bg-[var(--bg-card-solid)] px-3 py-2 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          {lang.toUpperCase()} <ChevronDown size={16} />
        </button>
        <button
          type="button"
          aria-label="Notifications"
          className="relative p-2 md:p-2.5 bg-white dark:bg-[var(--bg-card-solid)] rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-[var(--text-secondary)]"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 md:top-2 md:right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[var(--bg-card-solid)]"></span>
        </button>
      </div>
    </header>
  );
};

export { translations };
