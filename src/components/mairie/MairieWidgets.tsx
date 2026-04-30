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
        <div className="relative text-[11px] font-medium text-[var(--text-secondary)] tracking-tight flex items-center gap-1 bg-white/50 dark:bg-[var(--bg-card-solid)]/50 px-2 py-1 rounded-md border border-[var(--border-subtle)]" ref={dropdownRef}>
            <span className="num">Semaine {rank} sur</span>
            <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={menuId}
                className="num text-orange-700 dark:text-orange-300 font-medium cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-500/15 px-1 rounded transition-colors select-none flex items-center active:translate-y-[1px]"
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
            >
                {total}
            </button>
            {isOpen && (
                <div id={menuId} role="listbox" className="modal-shell absolute top-full right-0 mt-1 z-50 flex flex-col min-w-[44px] overflow-hidden">
                    {[1, 2, 3, 4, 5].map((n) => (
                        <button
                            type="button"
                            role="option"
                            aria-selected={total === n}
                            key={n}
                            onClick={(e) => { e.stopPropagation(); onUpdateTotal(n); setIsOpen(false); }}
                            className={`num px-3 py-2 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 text-[12px] font-medium tracking-tight border-b border-[var(--border-subtle)] last:border-0 transition active:translate-y-[1px] ${total === n ? 'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-500/15' : 'text-[var(--text-secondary)]'}`}
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
        <div className="flex items-center gap-2 bg-slate-100/60 dark:bg-slate-800/60 p-1.5 rounded-lg border border-[var(--border-subtle)] ml-3">
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsStartOpen(!isStartOpen)}
                    aria-haspopup="listbox"
                    aria-expanded={isStartOpen}
                    aria-controls={menuId}
                    className="num flex items-center gap-1 px-2 py-1 bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-md hover:bg-slate-50 dark:hover:bg-slate-700/50 transition active:translate-y-[1px] text-[11px] font-medium text-[var(--text-primary)] tracking-tight"
                >
                    Début · S{startWeek} <ChevronDown size={10} strokeWidth={2.4} className="text-[var(--text-muted)]" />
                </button>
                {isStartOpen && (
                    <div id={menuId} role="listbox" className="modal-shell absolute top-full left-0 mt-1 overflow-y-auto max-h-[200px] z-50 w-20">
                        {yearWeeks.map((w) => (
                            <button
                                type="button"
                                role="option"
                                aria-selected={w === startWeek}
                                key={w}
                                className={`num block w-full text-left px-3 py-2 text-[12px] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 tracking-tight transition active:translate-y-[1px] ${w === startWeek ? 'bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 font-medium' : 'text-[var(--text-secondary)]'}`}
                                onClick={() => { onUpdateStart(w); setIsStartOpen(false); }}
                            >
                                S{w}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <span className="text-[var(--text-muted)]">·</span>
            <WeekRatioSelector rank={currentRank} total={duration} onUpdateTotal={onUpdateDuration} />
        </div>
    );
};
