import React from 'react';
import { Cluster } from './types';
import { MIN_1W } from './constants';
import { ASSOCIATIONS } from '@/hooks/useZonePlanner';
import {
  Sparkles, Hand, Eye, Package, Users, Undo2, Building2,
  FileText, Info, Trash2, AlertTriangle, Zap, UserPlus, UserMinus, Route, GripVertical, Wand2
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
  onGenerate?: () => void;
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
  sidebarWidth, sidebarRef, onGenerate,
}) => {
  return (
    <aside
      ref={sidebarRef}
      className="bg-slate-50/50 dark:bg-slate-900/50 flex flex-col max-h-[50vh] md:max-h-none md:h-full overflow-hidden shadow-[20px_0_60px_-15px_rgba(0,0,0,0.03)] z-30 transition-none border-r border-slate-200/60 dark:border-slate-700/60 zone-planner-sidebar"
      style={{ width: `${sidebarWidth}px`, minWidth: '320px' }}
    >
      {/* NGO selector */}
      <div className="flex-none p-7 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border-b border-slate-200/60 dark:border-slate-700/60">
        <h3 className="eyebrow leading-none mb-4 px-1">Organisation</h3>
        <div className="grid grid-cols-4 gap-2">
          {ASSOCIATIONS.map(ngo => (
            <button
              key={ngo.id}
              onClick={() => onNGOChange(ngo.id)}
              style={{
                '--ngo-color': ngo.color,
                boxShadow: selectedNGO === ngo.id ? `0 10px 20px -5px ${ngo.color}33` : 'none'
              } as React.CSSProperties}
              className={`group relative flex items-center justify-center px-2 py-2.5 rounded-xl transition-all duration-300 border-2 overflow-hidden active:translate-y-[1px] ${selectedNGO === ngo.id
                ? 'bg-[var(--ngo-color)] border-[var(--ngo-color)] text-white'
                : 'bg-white dark:bg-[var(--bg-card-solid)] border-[var(--border-subtle)] text-slate-500 dark:text-slate-400 hover:border-orange-200 dark:hover:border-orange-500/30 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              <span className="text-[12px] font-medium tracking-tight">{ngo.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Header + mode buttons */}
      <div className="p-7 border-b border-slate-200/40 dark:border-slate-700/40 flex-none bg-white/20 dark:bg-slate-800/20">
        <div className="flex justify-between items-center mb-7">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 text-white p-2.5 rounded-2xl shadow-[0_8px_20px_-10px_rgba(255,91,43,0.7)]">
              <Building2 size={20} strokeWidth={2.2} />
            </div>
            <h1 className="display text-slate-900 dark:text-white text-[28px] leading-none tracking-tight">{selectedNGO}</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleCNFF}
              title="Export CNFF"
              className={`p-2.5 rounded-xl border transition active:translate-y-[1px] ${showCNFF
                ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                : 'bg-white dark:bg-[var(--bg-card-solid)] border-[var(--border-subtle)] text-slate-500 hover:text-orange-600 hover:border-orange-200 dark:hover:border-orange-500/30'
              }`}
            >
              <FileText size={15} strokeWidth={2.2} />
            </button>
            <button
              onClick={onShowSectorPolicy}
              title="Information"
              className="p-2.5 bg-white dark:bg-[var(--bg-card-solid)] rounded-xl border border-[var(--border-subtle)] text-slate-500 hover:text-orange-600 hover:border-orange-200 dark:hover:border-orange-500/30 transition active:translate-y-[1px]"
            >
              <Info size={15} strokeWidth={2.2} />
            </button>
            <button
              onClick={onUndo}
              disabled={historyLength === 0}
              title="Annuler"
              className={`p-2.5 rounded-xl border transition active:translate-y-[1px] ${historyLength > 0
                ? 'bg-white dark:bg-[var(--bg-card-solid)] text-slate-700 dark:text-slate-200 border-[var(--border-subtle)] hover:text-orange-600 hover:border-orange-200 dark:hover:border-orange-500/30'
                : 'bg-white/50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 border-[var(--border-subtle)] cursor-not-allowed'
              }`}
            >
              <Undo2 size={15} strokeWidth={2.2} />
            </button>
            {onGenerate && (
              <button
                onClick={onGenerate}
                title="Générer les zones automatiquement"
                className="p-2.5 rounded-xl border bg-orange-600 text-white border-orange-600 hover:bg-orange-700 shadow-[0_8px_20px_-10px_rgba(255,91,43,0.7)] transition active:translate-y-[1px]"
              >
                <Wand2 size={15} strokeWidth={2.2} />
              </button>
            )}
          </div>
        </div>

        {/* Mode segmented control */}
        <div className="seg w-full !grid !grid-cols-3 !gap-1">
          <button
            onClick={onSetWatchMode}
            data-active={!isBrushMode && !isEditMode}
            className="!justify-center"
          >
            <Eye size={13} strokeWidth={2.2} /> Voir
          </button>
          <button
            onClick={onSetBrushMode}
            data-active={isBrushMode}
            className="!justify-center"
          >
            <Sparkles size={13} strokeWidth={2.2} /> Créer
          </button>
          <button
            onClick={onSetEditMode}
            data-active={isEditMode}
            className="!justify-center"
          >
            <Hand size={13} strokeWidth={2.2} /> Placer
          </button>
        </div>
      </div>

      {/* DRAFTS */}
      <div className={`flex-none bg-white/20 dark:bg-slate-800/20 border-b border-slate-200/40 dark:border-slate-700/40 transition-all duration-500 ${draftClusters.length === 0 ? 'h-0 opacity-0 overflow-hidden' : 'p-7 h-auto opacity-100'}`}>
        {draftClusters.length > 0 && (
          <>
            <h2 className="eyebrow leading-none flex items-center gap-1.5 mb-4 px-1">
              <Package size={11} className="text-slate-400" strokeWidth={2.4} /> Brouillons
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
              {draftClusters.map(c => {
                const isLow = c.totalPopulation < MIN_1W;
                return (
                  <div
                    key={c.id}
                    draggable={isEditMode}
                    onDragStart={(e) => e.dataTransfer.setData('clusterId', c.id)}
                    onClick={() => { if (!isBonusMode) onSelectCluster(c); }}
                    className={`flex-none w-44 bg-white dark:bg-[var(--bg-card-solid)] border rounded-2xl shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_24px_-16px_rgba(15,23,42,0.08)] transition hover:-translate-y-[2px] hover:shadow-[0_18px_40px_-20px_rgba(255,91,43,0.18)] overflow-hidden active:translate-y-0 ${isEditMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${selectedCluster?.id === c.id ? 'ring-2 ring-orange-300/50 border-orange-400' : 'border-[var(--border-subtle)] hover:border-orange-200 dark:hover:border-orange-500/30'} ${isLow ? '!border-red-200 dark:!border-red-500/30' : ''}`}
                  >
                    <div className="p-5 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="num display text-slate-900 dark:text-white text-[24px] tracking-tight leading-none">{c.code}</span>
                          {isLow && <AlertTriangle size={13} className="text-red-500 animate-pulse" strokeWidth={2.4} />}
                          {c.isBonus && <Zap size={13} className="text-emerald-500" strokeWidth={2.4} />}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteCluster(c.id); }}
                          aria-label="Supprimer le brouillon"
                          className="text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={12} strokeWidth={2.2} />
                        </button>
                      </div>
                      <div className="h-1 w-8 rounded-full mb-6" style={{ backgroundColor: c.color }} />
                      <div className="mt-auto flex items-center justify-between">
                        <div className={`num text-[12px] font-medium tracking-tight flex items-center gap-1.5 ${isLow ? 'text-red-600 dark:text-red-300' : 'text-slate-500 dark:text-slate-400'}`}>
                          <Users size={12} strokeWidth={2.2} className={isLow ? 'text-red-400' : 'text-slate-300 dark:text-slate-600'} />
                          {(c.totalPopulation / 1000).toFixed(1)}k
                        </div>
                        <div className="num text-[11px] font-medium text-white dark:text-slate-900 bg-slate-900 dark:bg-slate-200 px-2 py-0.5 rounded-md tracking-tight">
                          {c.durationWeeks} sem.
                        </div>
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
