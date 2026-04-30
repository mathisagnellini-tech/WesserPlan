import React from 'react';
import { Target, Zap, X, List as ListIcon, MapPin, ChevronDown } from 'lucide-react';
import type { TargetZone } from './types';

interface SmartMatcherProps {
    zones: TargetZone[];
    smartZoneId: string;
    viewMode: 'list' | 'map';
    onZoneChange: (id: string) => void;
    onViewModeChange: (mode: 'list' | 'map') => void;
}

export const SmartMatcher: React.FC<SmartMatcherProps> = ({ zones, smartZoneId, viewMode, onZoneChange, onViewModeChange }) => {
    const isActive = Boolean(smartZoneId);
    const hasZones = zones.length > 0;

    return (
        <div className="bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl border border-[var(--border-subtle)] shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_24px_-16px_rgba(15,23,42,0.08)] overflow-hidden">
            {/* Header row: title + démo badge on the left, view-mode toggle on the right.
                Wraps to two lines on narrow widths instead of duplicating the toggle. */}
            <div className="px-4 pt-3.5 flex items-center justify-between gap-3 flex-wrap">
                <div className="inline-flex items-center gap-2 min-w-0">
                    <Target size={14} strokeWidth={2.4} className="text-orange-500 shrink-0" />
                    <span className="text-[13px] font-medium text-[var(--text-primary)] tracking-tight">
                        Smart matcher
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="eyebrow leading-none hidden sm:inline">Vue</span>
                    <div className="seg shrink-0">
                        <button
                            type="button"
                            onClick={() => onViewModeChange('list')}
                            data-active={viewMode === 'list'}
                            aria-label="Vue liste"
                            title="Liste"
                        >
                            <ListIcon size={15} strokeWidth={2.2}/>
                        </button>
                        <button
                            type="button"
                            onClick={() => onViewModeChange('map')}
                            data-active={viewMode === 'map'}
                            aria-label="Vue carte"
                            title="Carte"
                        >
                            <MapPin size={15} strokeWidth={2.2}/>
                        </button>
                    </div>
                </div>
            </div>

            {/* Select row */}
            <div className="px-4 pt-2 pb-3">
                <div className="relative">
                    <select
                        className="num w-full appearance-none bg-slate-50 dark:bg-slate-800/50 border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium rounded-xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer tracking-tight hover:border-orange-200 dark:hover:border-orange-500/30 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        value={smartZoneId}
                        onChange={(e) => onZoneChange(e.target.value)}
                        aria-label="Zone de mission"
                        disabled={!hasZones}
                    >
                        <option value="">
                            {hasZones ? 'Sélectionner une zone de mission…' : 'Aucune zone disponible'}
                        </option>
                        {zones.map(z => (
                            <option key={z.id} value={z.id}>{z.name}</option>
                        ))}
                    </select>
                    <ChevronDown
                        size={15}
                        strokeWidth={2.2}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
                    />
                </div>
            </div>

            {/* Active-state strip — full-width, slim, no longer floating */}
            {isActive && (
                <div
                    role="status"
                    className="flex items-center gap-2.5 px-4 py-2 border-t border-orange-100 dark:border-orange-500/20 bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-500/10 dark:to-transparent animate-fade-in"
                >
                    <Zap size={13} strokeWidth={2.6} className="text-orange-600 dark:text-orange-300 shrink-0" />
                    <span className="text-[12px] font-medium text-orange-700 dark:text-orange-300 tracking-tight">
                        Tri intelligent actif
                    </span>
                    <span className="text-[12px] text-orange-700/70 dark:text-orange-300/70 tracking-tight">
                        · distance &amp; coût optimisés
                    </span>
                    <button
                        onClick={() => onZoneChange("")}
                        aria-label="Désactiver le tri intelligent"
                        className="ml-auto rounded-md p-1 text-orange-700/70 dark:text-orange-300/70 hover:bg-orange-100/70 dark:hover:bg-orange-500/15 hover:text-orange-700 dark:hover:text-orange-200 active:translate-y-[1px] transition"
                    >
                        <X size={13} strokeWidth={2.4}/>
                    </button>
                </div>
            )}
        </div>
    );
};
