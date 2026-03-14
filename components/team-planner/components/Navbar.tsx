
import React, { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Copy, History, Undo2, Redo2, BarChart2, User, Briefcase, Search, X, ListFilter, Zap, Monitor, Activity, Users, LayoutDashboard, MapPin } from 'lucide-react';

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
    // New Props
    onToggleCommand: () => void;
    isHeatmapMode: boolean;
    onToggleHeatmap: () => void;
    isLinkingMode: boolean; // New prop
    onToggleLinking: () => void; // New prop
    isCinemaMode: boolean;
    onToggleCinema: () => void;
    onSearchClick: () => void; // New prop
    onAutoSynergy: () => void; // New prop
    
    // Page Mode
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
    searchQuery,
    onSearchChange,
    isFilterOpen,
    onToggleFilter,
    activeFilterCount,
    onToggleCommand,
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
  const userPhoto = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&auto=format&fit=crop";

  if (isCinemaMode) return null; // Hide in cinema mode

  return (
    <header className="h-16 bg-white/70 backdrop-blur-xl border-b border-white/50 flex items-center px-6 justify-between sticky top-0 z-50 gap-4 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
      
      {/* Left: Branding & Week Nav */}
      <div className="flex items-center gap-6 flex-shrink-0">
          <div className="font-bold text-lg text-slate-800 flex items-center gap-2 mr-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-md shadow-blue-500/20"></div>
              <span className="hidden lg:inline tracking-tight">TeamPlanner</span>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-xl">
             <button 
                onClick={() => onPageModeChange('board')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${pageMode === 'board' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
             >
                 <LayoutDashboard size={14} /> Tableau
             </button>
             <button 
                onClick={() => onPageModeChange('alumni')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${pageMode === 'alumni' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
             >
                 <Users size={14} /> Nos Anciens
             </button>
             <button 
                onClick={() => onPageModeChange('map')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${pageMode === 'map' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
             >
                 <MapPin size={14} /> Carte
             </button>
          </div>
          
          {pageMode === 'board' && (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
            {/* Week Selector */}
            <div className="flex items-center bg-white/50 rounded-xl border border-white/60 p-1 shadow-sm">
                <button onClick={onPrev} disabled={!hasPrev} className={`p-1.5 rounded-lg transition-colors ${!hasPrev ? 'text-gray-300' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}>
                    <ChevronLeft size={16} />
                </button>
                <div className="flex flex-col items-center justify-center px-4 min-w-[120px]">
                    <span className="text-xs font-bold text-slate-800 tracking-wide">{currentWeekLabel}</span>
                    <span className="text-[9px] font-medium text-blue-600">{currentDateRange}</span>
                </div>
                <button onClick={onNext} disabled={!hasNext} className={`p-1.5 rounded-lg transition-colors ${!hasNext ? 'text-gray-300' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}>
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* View Mode Selector - Pill Style */}
            <div className="hidden xl:flex bg-slate-100/80 rounded-lg border border-slate-200/50 p-1 gap-1">
                <button 
                    onClick={() => onViewModeChange('performance')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'performance' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <BarChart2 size={12} /> Perf
                </button>
                <div className="w-px h-4 bg-slate-200 my-auto"></div>
                <button 
                    onClick={() => onViewModeChange('identity')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'identity' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <User size={12} /> Profil
                </button>
                <div className="w-px h-4 bg-slate-200 my-auto"></div>
                <button 
                    onClick={() => onViewModeChange('hr')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'hr' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Briefcase size={12} /> RH
                </button>
            </div>
          </div>
          )}
      </div>

      {/* Middle: Search Bar & Filters */}
      <div className="flex-1 max-w-lg hidden md:flex items-center gap-3">
           <button 
                onClick={onSearchClick}
                className="flex-1 flex items-center justify-between px-3 py-2 bg-slate-100/50 hover:bg-white border border-slate-200 rounded-xl text-sm text-slate-500 hover:text-slate-800 hover:shadow-sm transition-all group"
            >
                <span className="flex items-center gap-2"><Search size={14} /> Rechercher...</span>
                <span className="text-[10px] font-bold bg-white border border-slate-200 rounded px-1.5 py-0.5 group-hover:border-slate-300">⌘ K</span>
            </button>
          
          {pageMode === 'board' && (
          <button
            onClick={onToggleFilter}
            className={`
                relative p-2 rounded-xl border transition-all duration-200 flex items-center gap-2
                ${isFilterOpen || activeFilterCount > 0
                    ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-inner' 
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 shadow-sm'
                }
            `}
          >
              <ListFilter size={18} />
              {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                      {activeFilterCount}
                  </span>
              )}
          </button>
          )}
      </div>

      {/* Right: Actions & User */}
      <div className="flex items-center gap-4 justify-end relative flex-shrink-0">
           
           <div className="hidden lg:flex items-center bg-slate-100/80 rounded-lg border border-slate-200/50 p-1 gap-1">
                <button 
                    onClick={onDuplicate}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-slate-500 hover:text-blue-600 hover:bg-white hover:shadow-sm transition-all"
                    title="Dupliquer la semaine"
                >
                    <Copy size={12} /> <span className="hidden xl:inline">Dupliquer</span>
                </button>
                <div className="w-px h-4 bg-slate-200 my-auto"></div>
                <button 
                    onClick={onToggleHeatmap}
                    className={`p-1.5 rounded-md transition-colors ${isHeatmapMode ? 'bg-white text-red-500 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    title="Heatmap"
                >
                    <Activity size={16} />
                </button>
                <button 
                    onClick={onToggleLinking}
                    className={`p-1.5 rounded-md transition-colors ${isLinkingMode ? 'bg-purple-100 text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    title="Mode Liaison (Créer des relations)"
                >
                    <Zap size={16} />
                </button>
                <button 
                    onClick={onAutoSynergy}
                    className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-white hover:shadow-sm transition-colors"
                    title="Détection Auto Synergies"
                >
                    <Users size={16} />
                </button>
                <button 
                    onClick={onToggleCinema}
                    className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-sm transition-colors"
                    title="Mode Cinéma"
                >
                    <Monitor size={16} />
                </button>
            </div>

            <div className="h-6 w-px bg-slate-200"></div>

           <div className="hidden lg:flex items-center bg-slate-100/80 rounded-lg border border-slate-200/50 p-1 gap-1">
                <button 
                    onClick={onUndo} 
                    disabled={!canUndo}
                    className={`p-1.5 rounded-md transition-colors ${!canUndo ? 'text-gray-300 cursor-not-allowed' : 'text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-sm'}`}
                    title="Annuler"
                >
                    <Undo2 size={16} />
                </button>
                <div className="w-px h-4 bg-slate-200"></div>
                <button 
                    onClick={onRedo} 
                    disabled={!canRedo}
                    className={`p-1.5 rounded-md transition-colors ${!canRedo ? 'text-gray-300 cursor-not-allowed' : 'text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-sm'}`}
                    title="Rétablir"
                >
                    <Redo2 size={16} />
                </button>
            </div>

           
           {/* History Button & Dropdown */}
           <div className="relative">
               <button 
                onClick={() => setShowHistory(!showHistory)}
                className={`transition-colors ${showHistory ? 'text-blue-600' : 'text-slate-400 hover:text-slate-800'}`}
                title="Historique des actions"
               >
                 <History size={16} />
               </button>

               {showHistory && (
                   <div className="absolute top-full right-0 mt-4 w-64 bg-white border border-slate-100 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                       <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50">
                           <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Historique récent</h3>
                       </div>
                       <div className="max-h-60 overflow-y-auto custom-scrollbar-light">
                           {actionLog.length > 0 ? (
                               <div className="flex flex-col">
                                   {actionLog.map((action, i) => (
                                       <div key={i} className="px-4 py-3 border-b border-slate-50 text-xs text-slate-600 last:border-0 hover:bg-slate-50 transition-colors">
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

           <div className="h-6 w-px bg-slate-200"></div>

           {/* Removed redundant Carte button */}
           
           <div className="h-9 w-9 rounded-full border border-white shadow-md p-0.5 cursor-pointer hover:border-blue-200 transition-colors">
             <img src={userPhoto} alt="User" className="w-full h-full rounded-full object-cover" />
           </div>
      </div>
    </header>
  );
};
