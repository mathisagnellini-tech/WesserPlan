
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Copy, History, Undo2, Redo2, BarChart2, User, Briefcase, Search, ListFilter, Zap, Monitor, Activity, Users, LayoutDashboard, MapPin, ArrowLeft } from 'lucide-react';

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const modSymbol = isMac ? '⌘' : 'Ctrl+';

export type ViewMode = 'performance' | 'identity' | 'hr';
export type PageMode = 'board' | 'alumni' | 'map';

interface NavbarProps {
    currentWeekLabel: string;
    currentDateRange: string;
    hasPrev: boolean;
    hasNext: boolean;
    onPrev: () => void;
    onNext: () => void;
    onDuplicate: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    actionLog: string[];
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    isFilterOpen: boolean;
    onToggleFilter: () => void;
    activeFilterCount: number;
    onToggleCommand: () => void;
    isHeatmapMode: boolean;
    onToggleHeatmap: () => void;
    isLinkingMode: boolean;
    onToggleLinking: () => void;
    isCinemaMode: boolean;
    onToggleCinema: () => void;
    onSearchClick: () => void;
    onAutoSynergy: () => void;
    pageMode: PageMode;
    onPageModeChange: (mode: PageMode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
    currentWeekLabel,
    currentDateRange,
    hasPrev,
    hasNext,
    onPrev,
    onNext,
    onDuplicate,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    actionLog,
    viewMode,
    onViewModeChange,
    isFilterOpen,
    onToggleFilter,
    activeFilterCount,
    isHeatmapMode,
    onToggleHeatmap,
    isLinkingMode,
    onToggleLinking,
    isCinemaMode,
    onToggleCinema,
    onSearchClick,
    onAutoSynergy,
    pageMode,
    onPageModeChange
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const navigate = useNavigate();
  if (isCinemaMode) return null;

  return (
    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/50 dark:border-slate-700/50 sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
      <div className="flex items-center px-3 py-2 gap-2 flex-wrap">
        {/* Back */}
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0"
          title="Retour au Dashboard"
        >
          <ArrowLeft size={16} />
        </button>

        {/* Page mode tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
          <button
            onClick={() => onPageModeChange('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${pageMode === 'board' ? 'bg-white dark:bg-slate-700 text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <LayoutDashboard size={14} /> Tableau
          </button>
          <button
            onClick={() => onPageModeChange('alumni')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${pageMode === 'alumni' ? 'bg-white dark:bg-slate-700 text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <Users size={14} /> Anciens
          </button>
          <button
            onClick={() => onPageModeChange('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${pageMode === 'map' ? 'bg-white dark:bg-slate-700 text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <MapPin size={14} /> Carte
          </button>
        </div>

        {/* Week selector (board only) */}
        {pageMode === 'board' && (
          <div className="flex items-center bg-white/50 dark:bg-slate-800/50 rounded-xl border border-white/60 dark:border-slate-700 p-1 shadow-sm shrink-0">
            <button onClick={onPrev} disabled={!hasPrev} className={`p-1 rounded-lg transition-colors ${!hasPrev ? 'text-gray-300' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'}`}>
              <ChevronLeft size={14} />
            </button>
            <div className="flex flex-col items-center px-3">
              <span className="text-xs font-bold text-slate-800 dark:text-white tracking-wide">{currentWeekLabel}</span>
              <span className="text-[9px] font-medium text-orange-600">{currentDateRange}</span>
            </div>
            <button onClick={onNext} disabled={!hasNext} className={`p-1 rounded-lg transition-colors ${!hasNext ? 'text-gray-300' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'}`}>
              <ChevronRight size={14} />
            </button>
          </div>
        )}


        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions toolbar (board only) */}
        {pageMode === 'board' && (
          <div className="flex items-center bg-slate-100/80 dark:bg-slate-800/80 rounded-lg border border-slate-200/50 dark:border-slate-700/50 p-1 gap-1 shrink-0">
            <button
              onClick={onDuplicate}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold text-slate-500 hover:text-orange-600 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all"
              title="Dupliquer la semaine"
            >
              <Copy size={12} /> Dupliquer
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 my-auto" />
            <button
              onClick={onToggleHeatmap}
              className={`p-1.5 rounded-md transition-colors ${isHeatmapMode ? 'bg-white dark:bg-slate-700 text-red-500 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
              title="Heatmap"
            >
              <Activity size={14} />
            </button>
            <button
              onClick={onToggleLinking}
              className={`p-1.5 rounded-md transition-colors ${isLinkingMode ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
              title="Mode Liaison"
            >
              <Zap size={14} />
            </button>
            <button
              onClick={onAutoSynergy}
              className="p-1.5 rounded-md text-slate-500 hover:text-orange-600 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-colors"
              title="Synergies"
            >
              <Users size={14} />
            </button>
            <button
              onClick={onToggleCinema}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-colors"
              title="Mode Cinéma"
            >
              <Monitor size={14} />
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 my-auto" />
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-1.5 rounded-md transition-colors ${!canUndo ? 'text-gray-300 cursor-not-allowed' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm'}`}
              title="Annuler"
            >
              <Undo2 size={14} />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-1.5 rounded-md transition-colors ${!canRedo ? 'text-gray-300 cursor-not-allowed' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm'}`}
              title="Rétablir"
            >
              <Redo2 size={14} />
            </button>
          </div>
        )}

        {/* Search, Filter, History */}
        <div className="flex items-center bg-slate-100/80 dark:bg-slate-800/80 rounded-lg border border-slate-200/50 dark:border-slate-700/50 p-1 gap-1 shrink-0">
          <button
            onClick={onSearchClick}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all"
            title={`Rechercher (${modSymbol}K)`}
          >
            <Search size={14} />
            <span className="text-[10px] font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-1 py-0.5">{modSymbol}K</span>
          </button>
          {pageMode === 'board' && (
            <>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 my-auto" />
              <button
                onClick={onToggleFilter}
                className={`relative p-1.5 rounded-md transition-all ${isFilterOpen || activeFilterCount > 0
                  ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'
                }`}
                title="Filtres"
              >
                <ListFilter size={14} />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-orange-600 text-white text-[8px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </>
          )}
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 my-auto" />
          <div className="relative">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-1.5 rounded-md transition-colors ${showHistory ? 'text-orange-600 bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'}`}
              title="Historique"
            >
              <History size={14} />
            </button>
            {showHistory && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-[var(--bg-card-solid)] border border-slate-100 dark:border-slate-800 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Historique récent</h3>
                </div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar-light">
                  {actionLog.length > 0 ? (
                    <div className="flex flex-col">
                      {actionLog.map((action, i) => (
                        <div key={i} className="px-4 py-3 border-b border-slate-50 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          {action}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-xs text-slate-400 italic text-center">Aucune action récente.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
