import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, ChevronRight, Copy, History, Undo2, Redo2, Search, ListFilter,
    Zap, Monitor, Activity, Users, LayoutDashboard, MapPin, ArrowLeft,
} from 'lucide-react';

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

const ToolButton: React.FC<{
    onClick: () => void;
    title: string;
    active?: boolean;
    activeTone?: 'orange' | 'rose' | 'indigo';
    disabled?: boolean;
    children: React.ReactNode;
}> = ({ onClick, title, active = false, activeTone = 'orange', disabled = false, children }) => {
    const tone = active
        ? activeTone === 'rose'
            ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300 ring-1 ring-rose-100 dark:ring-rose-500/25'
            : activeTone === 'indigo'
            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300 ring-1 ring-indigo-100 dark:ring-indigo-500/25'
            : 'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300 ring-1 ring-orange-100 dark:ring-orange-500/25'
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700';
    return (
        <button
            onClick={onClick}
            title={title}
            disabled={disabled}
            className={`p-1.5 rounded-md transition active:translate-y-[1px] ${tone} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
            {children}
        </button>
    );
};

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
    onPageModeChange,
}) => {
    const [showHistory, setShowHistory] = useState(false);
    const navigate = useNavigate();
    if (isCinemaMode) return null;

    return (
        <div className="bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border-b border-white/50 dark:border-slate-700/50 sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
            <div className="flex items-center px-3 py-2 gap-2 flex-wrap">
                {/* Back */}
                <button
                    onClick={() => navigate('/')}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition active:translate-y-[1px] shrink-0"
                    title="Retour au tableau de bord"
                >
                    <ArrowLeft size={15} strokeWidth={2.2} />
                </button>

                {/* Page mode tabs */}
                <div className="seg shrink-0">
                    <button
                        onClick={() => onPageModeChange('board')}
                        data-active={pageMode === 'board'}
                    >
                        <LayoutDashboard size={14} strokeWidth={2.2} /> Tableau
                    </button>
                    <button
                        onClick={() => onPageModeChange('alumni')}
                        data-active={pageMode === 'alumni'}
                    >
                        <Users size={14} strokeWidth={2.2} /> Anciens
                    </button>
                    <button
                        onClick={() => onPageModeChange('map')}
                        data-active={pageMode === 'map'}
                    >
                        <MapPin size={14} strokeWidth={2.2} /> Carte
                    </button>
                </div>

                {/* Week selector (board only) */}
                {pageMode === 'board' && (
                    <div className="flex items-center bg-white dark:bg-[var(--bg-card-solid)] rounded-xl border border-[var(--border-subtle)] p-1 shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_24px_-16px_rgba(15,23,42,0.06)] shrink-0">
                        <button
                            onClick={onPrev}
                            disabled={!hasPrev}
                            aria-label="Semaine précédente"
                            className={`p-1.5 rounded-md transition active:translate-y-[1px] ${
                                !hasPrev ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            <ChevronLeft size={14} strokeWidth={2.2} />
                        </button>
                        <div className="flex flex-col items-center px-3 leading-none">
                            <span className="num text-[12px] font-medium text-slate-800 dark:text-white tracking-tight">
                                {currentWeekLabel}
                            </span>
                            <span className="num text-[10px] font-medium text-orange-600 dark:text-orange-300 tracking-tight mt-0.5">
                                {currentDateRange}
                            </span>
                        </div>
                        <button
                            onClick={onNext}
                            disabled={!hasNext}
                            aria-label="Semaine suivante"
                            className={`p-1.5 rounded-md transition active:translate-y-[1px] ${
                                !hasNext ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            <ChevronRight size={14} strokeWidth={2.2} />
                        </button>
                    </div>
                )}

                <div className="flex-1" />

                {/* Actions toolbar (board only) */}
                {pageMode === 'board' && (
                    <div className="flex items-center bg-slate-100/80 dark:bg-slate-800/80 rounded-lg border border-[var(--border-subtle)] p-1 gap-1 shrink-0">
                        <button
                            onClick={onDuplicate}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-300 hover:bg-white dark:hover:bg-slate-700 transition active:translate-y-[1px] tracking-tight"
                            title="Dupliquer la semaine"
                        >
                            <Copy size={12} strokeWidth={2.2} /> Dupliquer
                        </button>
                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 my-auto" />
                        <ToolButton onClick={onToggleHeatmap} title="Heatmap" active={isHeatmapMode} activeTone="rose">
                            <Activity size={14} strokeWidth={2.2} />
                        </ToolButton>
                        {/* Linking mode now uses indigo, not the bright purple AI tint */}
                        <ToolButton onClick={onToggleLinking} title="Mode liaison" active={isLinkingMode} activeTone="indigo">
                            <Zap size={14} strokeWidth={2.2} />
                        </ToolButton>
                        <ToolButton onClick={onAutoSynergy} title="Synergies">
                            <Users size={14} strokeWidth={2.2} />
                        </ToolButton>
                        <ToolButton onClick={onToggleCinema} title="Mode cinéma">
                            <Monitor size={14} strokeWidth={2.2} />
                        </ToolButton>
                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 my-auto" />
                        <ToolButton onClick={onUndo} title="Annuler" disabled={!canUndo}>
                            <Undo2 size={14} strokeWidth={2.2} />
                        </ToolButton>
                        <ToolButton onClick={onRedo} title="Rétablir" disabled={!canRedo}>
                            <Redo2 size={14} strokeWidth={2.2} />
                        </ToolButton>
                    </div>
                )}

                {/* Search, Filter, History */}
                <div className="flex items-center bg-slate-100/80 dark:bg-slate-800/80 rounded-lg border border-[var(--border-subtle)] p-1 gap-1 shrink-0">
                    <button
                        onClick={onSearchClick}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition active:translate-y-[1px] tracking-tight"
                        title={`Rechercher (${modSymbol}K)`}
                    >
                        <Search size={14} strokeWidth={2.2} />
                        <span className="num text-[10px] font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-1 py-0.5 tracking-tight">
                            {modSymbol}K
                        </span>
                    </button>
                    {pageMode === 'board' && (
                        <>
                            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 my-auto" />
                            <ToolButton
                                onClick={onToggleFilter}
                                title="Filtres"
                                active={isFilterOpen || activeFilterCount > 0}
                            >
                                <span className="relative inline-flex">
                                    <ListFilter size={14} strokeWidth={2.2} />
                                    {activeFilterCount > 0 && (
                                        <span className="num absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-orange-600 text-white text-[8px] font-medium flex items-center justify-center tracking-tight">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </span>
                            </ToolButton>
                        </>
                    )}
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 my-auto" />
                    <div className="relative">
                        <ToolButton onClick={() => setShowHistory(!showHistory)} title="Historique" active={showHistory}>
                            <History size={14} strokeWidth={2.2} />
                        </ToolButton>
                        {showHistory && (
                            <div className="modal-shell absolute top-full right-0 mt-2 w-64 z-50">
                                <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-slate-50/50 dark:bg-slate-800/50">
                                    <h3 className="eyebrow leading-none">Historique récent</h3>
                                </div>
                                <div className="max-h-60 overflow-y-auto custom-scrollbar-light">
                                    {actionLog.length > 0 ? (
                                        <div className="flex flex-col">
                                            {actionLog.map((action, i) => (
                                                <div
                                                    key={i}
                                                    className="px-4 py-3 border-b border-slate-50 dark:border-slate-800 text-[12px] text-slate-600 dark:text-slate-400 tracking-tight last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                                >
                                                    {action}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 text-[12px] text-slate-400 dark:text-slate-500 italic text-center tracking-tight">
                                            Aucune action récente.
                                        </div>
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
