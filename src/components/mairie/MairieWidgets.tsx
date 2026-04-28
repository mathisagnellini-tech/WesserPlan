import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { weeksInIsoYear } from '@/lib/isoWeek';

export const WeekRatioSelector: React.FC<{ rank: number; total: number; onUpdateTotal: (d: number) => void }> = ({ rank, total, onUpdateTotal }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const menuId = useId();
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    return (
        <div className="relative text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1 bg-white/50 dark:bg-[var(--bg-card-solid)]/50 px-2 py-1 rounded-lg border border-[var(--border-subtle)]" ref={dropdownRef}>
            <span>Semaine {rank} sur</span>
            <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={menuId}
                className="text-red-600 font-bold cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/30 px-1 rounded transition-colors select-none flex items-center"
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
            >
                {total}
            </button>
            {isOpen && (
                <div id={menuId} role="listbox" className="absolute top-full right-0 mt-1 bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] shadow-xl rounded-lg overflow-hidden z-50 flex flex-col min-w-[40px]">
                    {[1, 2, 3, 4, 5].map((n) => (
                        <button
                            type="button"
                            role="option"
                            aria-selected={total === n}
                            key={n}
                            onClick={(e) => { e.stopPropagation(); onUpdateTotal(n); setIsOpen(false); }}
                            className={`px-3 py-2 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 font-bold text-xs border-b border-slate-50 last:border-0 ${total === n ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30' : 'text-[var(--text-secondary)]'}`}
                        >
                            {n}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export const ZoneTimeManager: React.FC<{ startWeek: number; duration: number; onUpdateStart: (w: number) => void; onUpdateDuration: (d: number) => void; currentWeek: number }> = ({ startWeek, duration, onUpdateStart, onUpdateDuration, currentWeek }) => {
    const [isStartOpen, setIsStartOpen] = useState(false);
    const currentRank = Math.max(1, currentWeek - startWeek + 1);
    const menuId = useId();
    const yearWeeks = useMemo(() => Array.from({ length: weeksInIsoYear(new Date().getFullYear()) }, (_, i) => i + 1), []);
    return (
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg border border-[var(--border-subtle)] ml-4">
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsStartOpen(!isStartOpen)}
                    aria-haspopup="listbox"
                    aria-expanded={isStartOpen}
                    aria-controls={menuId}
                    className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-xs font-bold text-[var(--text-primary)]"
                >
                    Start S{startWeek} <ChevronDown size={10} className="text-[var(--text-muted)]" />
                </button>
                {isStartOpen && (
                    <div id={menuId} role="listbox" className="absolute top-full left-0 mt-1 bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] shadow-xl rounded-lg overflow-y-auto max-h-[200px] z-50 w-20">
                        {yearWeeks.map((w) => (
                            <button
                                type="button"
                                role="option"
                                aria-selected={w === startWeek}
                                key={w}
                                className={`block w-full text-left px-3 py-2 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 ${w === startWeek ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-bold' : 'text-[var(--text-secondary)]'}`}
                                onClick={() => { onUpdateStart(w); setIsStartOpen(false); }}
                            >
                                S{w}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <span className="text-slate-300">|</span>
            <WeekRatioSelector rank={currentRank} total={duration} onUpdateTotal={onUpdateDuration} />
        </div>
    );
};
