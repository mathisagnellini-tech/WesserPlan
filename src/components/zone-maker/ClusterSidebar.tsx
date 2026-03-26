import React from 'react';
import { Cluster } from './types';
import { MIN_1W } from './constants';
import { ASSOCIATIONS } from '@/hooks/useZonePlanner';
import {
  Sparkles, Hand, Eye, Package, Users, Undo2, Building2,
  FileText, Info, Trash2, AlertTriangle, Zap, UserPlus, UserMinus, Route, GripVertical
} from 'lucide-react';
import ScheduleGrid from './ScheduleGrid';

interface ScheduleSlot {
  week: number;
  capacity: number;
  teams: ({ cluster: Cluster; weekIndex: number } | null)[];
}

interface ClusterSidebarProps {
  selectedNGO: string;
  onNGOChange: (id: string) => void;
  showCNFF: boolean;
  onToggleCNFF: () => void;
  onShowSectorPolicy: () => void;
  historyLength: number;
  onUndo: () => void;
  isBrushMode: boolean;
  isEditMode: boolean;
  isBonusMode: boolean;
  onSetBrushMode: () => void;
  onSetEditMode: () => void;
  onSetWatchMode: () => void;
  draftClusters: Cluster[];
  selectedCluster: Cluster | null;
  onSelectCluster: (c: Cluster) => void;
  onDeleteCluster: (id: string) => void;
  schedule: ScheduleSlot[];
  maxCapacity: number;
  isCompact: boolean;
  visibleTeamPath: number | null;
  onToggleTeamPath: (team: number) => void;
  onModifyWeekTeamCount: (week: number, increment: number) => void;
  dragOverCell: { week: number; team: number } | null;
  setDragOverCell: (cell: { week: number; team: number } | null) => void;
  onManualMoveRequest: (clusterId: string, team: number, week: number) => void;
  sidebarWidth: number;
  sidebarRef: React.RefObject<HTMLElement | null>;
}

const ClusterSidebar: React.FC<ClusterSidebarProps> = ({
  selectedNGO, onNGOChange, showCNFF, onToggleCNFF, onShowSectorPolicy,
  historyLength, onUndo,
  isBrushMode, isEditMode, isBonusMode,
  onSetBrushMode, onSetEditMode, onSetWatchMode,
  draftClusters, selectedCluster, onSelectCluster, onDeleteCluster,
  schedule, maxCapacity, isCompact,
  visibleTeamPath, onToggleTeamPath, onModifyWeekTeamCount,
  dragOverCell, setDragOverCell, onManualMoveRequest,
  sidebarWidth, sidebarRef,
}) => {
  return (
    <aside
      ref={sidebarRef}
      className="bg-slate-50/50 dark:bg-slate-900/50 flex flex-col max-h-[50vh] md:max-h-none md:h-screen overflow-hidden md:sticky top-0 shadow-[20px_0_60px_-15px_rgba(0,0,0,0.03)] z-30 transition-none border-r border-slate-200/60 dark:border-slate-700/60 zone-planner-sidebar"
      style={{ width: `${sidebarWidth}px`, minWidth: '320px' }}
    >
      {/* NGO selector */}
      <div className="flex-none p-8 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border-b border-slate-200/60 dark:border-slate-700/60">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-5 px-1">Organisation</h3>
        <div className="grid grid-cols-4 gap-3">
          {ASSOCIATIONS.map(ngo => (
            <button
              key={ngo.id}
              onClick={() => onNGOChange(ngo.id)}
              style={{
                '--ngo-color': ngo.color,
                boxShadow: selectedNGO === ngo.id ? `0 10px 20px -5px ${ngo.color}33` : 'none'
              } as React.CSSProperties}
              className={`group relative flex items-center justify-center px-2 py-3 rounded-full transition-all duration-400 border-2 overflow-hidden active:scale-90 ${selectedNGO === ngo.id
                ? 'bg-[var(--ngo-color)] border-[var(--ngo-color)] text-white'
                : 'bg-white dark:bg-[var(--bg-card-solid)] border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <span className="text-[11px] font-black tracking-tight">{ngo.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Header + mode buttons */}
      <div className="p-8 border-b border-slate-200/40 dark:border-slate-700/40 flex-none bg-white/20 dark:bg-slate-800/20">
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-5">
            <div className="bg-orange-600 text-white p-3 rounded-2xl shadow-2xl shadow-orange-100 dark:shadow-orange-900/30"><Building2 size={24} strokeWidth={2.5} /></div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{selectedNGO}</h1>
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={onToggleCNFF} className={`p-3 rounded-2xl border transition-all ${showCNFF ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white dark:bg-[var(--bg-card-solid)] border-slate-100 dark:border-slate-800 text-slate-400 hover:text-orange-600 hover:border-orange-100 dark:hover:border-orange-800 shadow-sm'}`} title="Export CNFF">
              <FileText size={18} strokeWidth={2.2} />
            </button>
            <button onClick={onShowSectorPolicy} className="p-3 bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-orange-600 hover:border-orange-100 dark:hover:border-orange-800 transition-all shadow-sm"><Info size={18} strokeWidth={2.2} /></button>
            <button onClick={onUndo} disabled={historyLength === 0} className={`p-3 rounded-2xl border transition-all ${historyLength > 0 ? 'bg-white dark:bg-[var(--bg-card-solid)] text-slate-900 dark:text-white border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm' : 'bg-white/50 dark:bg-slate-800/50 text-slate-200 dark:text-slate-600 border-slate-100 dark:border-slate-800 shadow-none cursor-not-allowed'}`}><Undo2 size={18} strokeWidth={2.2} /></button>
          </div>
        </div>

        {/* SEGMENTED CONTROL */}
        <div className="bg-slate-200/40 dark:bg-slate-700/40 p-1.5 rounded-full flex gap-1 border border-slate-200/50 dark:border-slate-700/50">
          <button
            onClick={onSetWatchMode}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-full text-[10px] font-black tracking-wider transition-all duration-300 ${(!isBrushMode && !isEditMode) ? 'bg-white dark:bg-[var(--bg-card-solid)] text-slate-900 dark:text-white shadow-xl shadow-slate-100/50 dark:shadow-slate-900/50 scale-[1.02]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <Eye size={14} strokeWidth={2.5} /> WATCH
          </button>
          <button
            onClick={onSetBrushMode}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-full text-[10px] font-black tracking-wider transition-all duration-300 ${isBrushMode ? 'bg-white dark:bg-[var(--bg-card-solid)] text-orange-600 shadow-xl shadow-orange-100/50 dark:shadow-orange-900/50 scale-[1.02]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <Sparkles size={14} strokeWidth={2.5} /> CRÉER
          </button>
          <button
            onClick={onSetEditMode}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-full text-[10px] font-black tracking-wider transition-all duration-300 ${isEditMode ? 'bg-white dark:bg-[var(--bg-card-solid)] text-orange-600 shadow-xl shadow-orange-100/50 dark:shadow-orange-900/50 scale-[1.02]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <Hand size={14} strokeWidth={2.5} /> PLACER
          </button>
        </div>
      </div>

      {/* DRAFTS */}
      <div className={`flex-none bg-white/20 dark:bg-slate-800/20 border-b border-slate-200/40 dark:border-slate-700/40 transition-all duration-500 ${draftClusters.length === 0 ? 'h-0 opacity-0 overflow-hidden' : 'p-8 h-auto opacity-100'}`}>
        {draftClusters.length > 0 && (
          <>
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2.5 mb-6 px-1"><Package size={14} className="text-slate-300" strokeWidth={2.5} /> Brouillons</h2>
            <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar">
              {draftClusters.map(c => {
                const isLow = c.totalPopulation < MIN_1W;
                return (
                  <div key={c.id} draggable={isEditMode} onDragStart={(e) => e.dataTransfer.setData('clusterId', c.id)} onClick={() => { if (!isBonusMode) onSelectCluster(c); }} className={`flex-none w-48 bg-white dark:bg-[var(--bg-card-solid)] border rounded-[2rem] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] transition-all hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 overflow-hidden ${isEditMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${selectedCluster?.id === c.id ? 'ring-[3px] ring-orange-500/20 border-orange-500 shadow-orange-50 dark:shadow-orange-900/20' : 'border-slate-100 dark:border-slate-800'} ${isLow ? 'border-red-100 dark:border-red-800 ring-2 ring-red-500/5' : ''}`}>
                    <div className="p-6 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="font-black text-slate-900 dark:text-white text-2xl tracking-tighter leading-none">{c.code}</span>
                          {isLow && <AlertTriangle size={15} className="text-red-500 animate-pulse" strokeWidth={2.5} />}
                          {c.isBonus && <Zap size={15} className="text-emerald-500" strokeWidth={2.5} />}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteCluster(c.id); }} className="text-slate-200 dark:text-slate-600 hover:text-red-500 transition-colors p-1"><Trash2 size={13} strokeWidth={2.2} /></button>
                      </div>
                      <div className="h-1.5 w-10 rounded-full mb-8" style={{ backgroundColor: c.color }}></div>
                      <div className="mt-auto flex items-center justify-between">
                        <div className={`text-[11px] font-black uppercase flex items-center gap-2 ${isLow ? 'text-red-600' : 'text-slate-400'}`}><Users size={14} strokeWidth={2.2} className={isLow ? 'text-red-400' : 'text-slate-200'} /> {(c.totalPopulation / 1000).toFixed(1)}k</div>
                        <div className="text-[10px] font-black text-white bg-slate-900 px-2.5 py-1 rounded-xl uppercase tracking-wider shadow-sm">{c.durationWeeks}s</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* CALENDAR */}
      <ScheduleGrid
        schedule={schedule}
        maxCapacity={maxCapacity}
        isCompact={isCompact}
        visibleTeamPath={visibleTeamPath}
        onToggleTeamPath={onToggleTeamPath}
        onModifyWeekTeamCount={onModifyWeekTeamCount}
        selectedCluster={selectedCluster}
        isBonusMode={isBonusMode}
        isEditMode={isEditMode}
        dragOverCell={dragOverCell}
        setDragOverCell={setDragOverCell}
        onManualMoveRequest={onManualMoveRequest}
        onSelectCluster={onSelectCluster}
      />
    </aside>
  );
};

export default ClusterSidebar;
