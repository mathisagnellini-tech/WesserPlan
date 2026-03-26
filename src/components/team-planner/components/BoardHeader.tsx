
import React from 'react';
import { LayoutGrid, Rows, GitMerge, Grip, BarChart2, User, Briefcase } from 'lucide-react';
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
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
    viewMode,
    onViewModeChange,
    density,
    onDensityChange,
    showRelationships,
    onToggleRelationships,
    searchQuery,
    isFocusMode,
}) => {
    return (
        <div className="mb-4 z-10 sticky left-0 px-2 w-[calc(100vw-48px)]">
            {/* Title */}
            <div className={`transition-opacity duration-500 ${isFocusMode ? 'opacity-40 blur-[1px]' : 'opacity-100'}`}>
                <h2 className="text-slate-900 dark:text-white font-black text-3xl tracking-tight">Team Planner</h2>
                <span className="text-slate-500 text-sm font-medium mt-1">
                    {searchQuery ? `Recherche: "${searchQuery}"` : (
                    <>
                        {viewMode === 'performance' && "Performance commerciale et objectifs."}
                        {viewMode === 'identity' && "Profils, âges et origines géographiques."}
                        {viewMode === 'hr' && "Contrats, disponibilités et permis."}
                    </>
                    )}
                </span>
            </div>

            {/* Board toolbar — single unified bar */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
                {/* View mode */}
                <div className="flex bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full border border-slate-200/50 dark:border-slate-700/50 p-1 gap-0.5 shadow-sm">
                    <button
                        onClick={() => onViewModeChange('performance')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === 'performance' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                        <BarChart2 size={12} /> Perf
                    </button>
                    <button
                        onClick={() => onViewModeChange('identity')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === 'identity' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                        <User size={12} /> Profil
                    </button>
                    <button
                        onClick={() => onViewModeChange('hr')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === 'hr' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                        <Briefcase size={12} /> RH
                    </button>
                </div>

                {/* Density + Relations — grouped */}
                <div className="flex bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full border border-slate-200/50 dark:border-slate-700/50 p-1 gap-0.5 shadow-sm items-center">
                    <button
                        onClick={() => onDensityChange('standard')}
                        className={`p-1.5 rounded-full transition-all duration-200 ${density === 'standard' ? 'bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-white shadow-inner' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        title="Vue Détaillée"
                    >
                        <LayoutGrid size={14} />
                    </button>
                    <button
                        onClick={() => onDensityChange('compact')}
                        className={`p-1.5 rounded-full transition-all duration-200 ${density === 'compact' ? 'bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-white shadow-inner' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        title="Vue Compacte"
                    >
                        <Rows size={14} />
                    </button>
                    <button
                        onClick={() => onDensityChange('tiny')}
                        className={`p-1.5 rounded-full transition-all duration-200 ${density === 'tiny' ? 'bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-white shadow-inner' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        title="Vue Ultra Compacte"
                    >
                        <Grip size={14} />
                    </button>
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
                    <button
                        onClick={onToggleRelationships}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all ${showRelationships
                            ? 'bg-orange-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                        <GitMerge size={12} /> Relations
                    </button>
                </div>
            </div>
        </div>
    );
};
