import React, { useState, useEffect } from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';

const translations = {
  en: {
    searchPlaceholder: "For example: Where is CR7's team",
  },
  fr: {
    searchPlaceholder: "Rechercher une equipe, un lieu...",
  }
};

export const DashboardHeader: React.FC<{ lang: 'en' | 'fr'; onLangChange: () => void; t: (key: keyof typeof translations.en) => string; }> = ({ lang, onLangChange, t }) => {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const dateString = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <header className="flex items-center gap-3 md:gap-6 mb-4 md:mb-6 h-12 md:h-16">
      <div className="relative flex-grow">
        <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
        <input type="text" placeholder={t('searchPlaceholder')} className="w-full bg-white/50 dark:bg-[var(--input-bg)] pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl border border-transparent focus:border-gray-200 dark:focus:border-[var(--input-border)] focus:ring-1 focus:ring-gray-200 dark:focus:ring-[var(--input-border)] outline-none transition-all shadow-sm text-sm md:text-base dark:text-[var(--text-primary)] dark:placeholder-[var(--text-muted)]" />
      </div>

      <div className="hidden md:flex flex-col items-end justify-center px-4 border-r border-gray-200/50 dark:border-[var(--border-subtle)]">
        <div className="text-3xl font-black text-[var(--text-primary)] leading-none tracking-tight">
            {timeString}
        </div>
        <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide first-letter:uppercase">
            {dateString}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        <button onClick={onLangChange} className="hidden sm:flex items-center gap-2 text-slate-600 dark:text-[var(--text-secondary)] font-bold bg-white dark:bg-[var(--bg-card-solid)] px-3 py-2 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
          {lang.toUpperCase()} <ChevronDown size={16} />
        </button>
        <button className="relative p-2 md:p-2.5 bg-white dark:bg-[var(--bg-card-solid)] rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-[var(--text-secondary)]">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 md:top-2 md:right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[var(--bg-card-solid)]"></span>
        </button>
      </div>
    </header>
  );
};

export { translations };
