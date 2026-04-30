import React, { useEffect, useState } from 'react';
import { LayoutGrid, Rows, GitMerge, Grip, BarChart2, User, Briefcase, Cloud, CloudOff, Check, Loader2 } from 'lucide-react';
import type { ViewMode, ViewDensity } from '../TeamPlannerApp';

interface BoardHeaderProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    density: ViewDensity;
    onDensityChange: (density: ViewDensity) => void;
    showRelationships: boolean;
    onToggleRelationships: () => void;
    searchQuery: string;
    isFocusMode: boolean;
    lastSaved?: Date | null;
    isSaving?: boolean;
    saveError?: Error | null;
    onRetrySave?: () => void;
}

function formatRelativeTime(date: Date): string {
    const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (seconds < 5) return "à l'instant";
    if (seconds < 60) return `il y a ${seconds} s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours} h`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const SaveIndicator: React.FC<{
    lastSaved?: Date | null;
    isSaving?: boolean;
    saveError?: Error | null;
    onRetry?: () => void;
}> = ({ lastSaved, isSaving, saveError, onRetry }) => {
    const [, setTick] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setTick((n) => n + 1), 10000);
        return () => clearInterval(id);
    }, []);

    const baseChip =
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium tracking-tight border';

    if (saveError) {
        return (
            <button
                onClick={onRetry}
                title={saveError.message}
                className={`${baseChip} bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-100 dark:border-red-500/25 hover:bg-red-100 dark:hover:bg-red-500/20 active:translate-y-[1px] transition`}
            >
                <CloudOff size={12} strokeWidth={2.2} /> Erreur — réessayer
            </button>
        );
    }

    if (isSaving) {
        return (
            <div
                className={`${baseChip} bg-white/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-[var(--border-subtle)] shadow-sm`}
            >
                <Loader2 size={12} className="animate-spin" strokeWidth={2.2} /> Enregistrement…
            </div>
        );
    }

    if (lastSaved) {
        return (
            <div
                title={lastSaved.toLocaleString('fr-FR')}
                className={`${baseChip} bg-white/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-[var(--border-subtle)] shadow-sm`}
            >
                <Check size={12} className="text-emerald-500" strokeWidth={2.4} /> Enregistré {formatRelativeTime(lastSaved)}
            </div>
        );
    }

    return (
        <div
            className={`${baseChip} bg-white/80 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border-[var(--border-subtle)] shadow-sm`}
        >
            <Cloud size={12} strokeWidth={2.2} /> Non enregistré
        </div>
    );
};

export const BoardHeader: React.FC<BoardHeaderProps> = ({
    viewMode,
    onViewModeChange,
    density,
    onDensityChange,
    showRelationships,
    onToggleRelationships,
    searchQuery,
    isFocusMode,
    lastSaved,
    isSaving,
    saveError,
    onRetrySave,
}) => {
    return (
        <div className="mb-4 z-10 sticky left-0 px-2 w-[calc(100vw-48px)]">
            {/* Title */}
            <div className={`transition-opacity duration-500 ${isFocusMode ? 'opacity-40 blur-[1px]' : 'opacity-100'}`}>
                <h2 className="display text-slate-900 dark:text-white text-[34px] leading-none tracking-tight">
                    Team planner
                </h2>
                <span className="block text-slate-500 dark:text-slate-400 text-[13px] tracking-tight mt-1">
                    {searchQuery ? (
                        <>Recherche : <span className="text-slate-700 dark:text-slate-200">« {searchQuery} »</span></>
                    ) : (
                        <>
                            {viewMode === 'performance' && 'Performance commerciale et objectifs.'}
                            {viewMode === 'identity' && 'Profils, âges et origines géographiques.'}
                            {viewMode === 'hr' && 'Contrats, disponibilités et permis.'}
                        </>
                    )}
                </span>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
                {/* View mode */}
                <div className="seg">
                    <button onClick={() => onViewModeChange('performance')} data-active={viewMode === 'performance'}>
                        <BarChart2 size={13} strokeWidth={2.2} /> Perf
                    </button>
                    <button onClick={() => onViewModeChange('identity')} data-active={viewMode === 'identity'}>
                        <User size={13} strokeWidth={2.2} /> Profil
                    </button>
                    <button onClick={() => onViewModeChange('hr')} data-active={viewMode === 'hr'}>
                        <Briefcase size={13} strokeWidth={2.2} /> RH
                    </button>
                </div>

                {/* Density + Relations */}
                <div className="seg items-center">
                    <button
                        onClick={() => onDensityChange('standard')}
                        data-active={density === 'standard'}
                        title="Vue détaillée"
                        aria-label="Vue détaillée"
                    >
                        <LayoutGrid size={13} strokeWidth={2.2} />
                    </button>
                    <button
                        onClick={() => onDensityChange('compact')}
                        data-active={density === 'compact'}
                        title="Vue compacte"
                        aria-label="Vue compacte"
                    >
                        <Rows size={13} strokeWidth={2.2} />
                    </button>
                    <button
                        onClick={() => onDensityChange('tiny')}
                        data-active={density === 'tiny'}
                        title="Vue ultra-compacte"
                        aria-label="Vue ultra-compacte"
                    >
                        <Grip size={13} strokeWidth={2.2} />
                    </button>
                    <span className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
                    <button onClick={onToggleRelationships} data-active={showRelationships}>
                        <GitMerge size={13} strokeWidth={2.2} /> Relations
                    </button>
                </div>

                <div className="ml-auto">
                    <SaveIndicator
                        lastSaved={lastSaved}
                        isSaving={isSaving}
                        saveError={saveError}
                        onRetry={onRetrySave}
                    />
                </div>
            </div>
        </div>
    );
};
