import React from 'react';
import { Cluster } from './types';
import { MIN_1W } from './constants';
import { CURRENT_WEEK } from '@/hooks/useZonePlanner';
import { Users, UserPlus, UserMinus, Route, AlertTriangle, Zap } from 'lucide-react';

interface ScheduleSlot {
  week: number;
  capacity: number;
  teams: ({ cluster: Cluster; weekIndex: number } | null)[];
}

interface ScheduleGridProps {
  schedule: ScheduleSlot[];
  maxCapacity: number;
  isCompact: boolean;
  visibleTeamPath: number | null;
  onToggleTeamPath: (team: number) => void;
  onModifyWeekTeamCount: (week: number, increment: number) => void;
  selectedCluster: Cluster | null;
  isBonusMode: boolean;
  isEditMode: boolean;
  dragOverCell: { week: number; team: number } | null;
  setDragOverCell: (cell: { week: number; team: number } | null) => void;
  onManualMoveRequest: (clusterId: string, team: number, week: number) => void;
  onSelectCluster: (c: Cluster) => void;
}

const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  schedule, maxCapacity, isCompact,
  visibleTeamPath, onToggleTeamPath, onModifyWeekTeamCount,
  selectedCluster, isBonusMode, isEditMode,
  dragOverCell, setDragOverCell, onManualMoveRequest, onSelectCluster,
}) => {
  return (
    <div className="flex-grow overflow-y-auto px-8 pt-10 space-y-4 bg-transparent pb-48">
      {/* Header */}
      <div className={`grid sticky top-0 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl z-20 -mx-8 px-8 py-5 border-b border-slate-200/40 dark:border-slate-700/40 ${isCompact ? 'gap-3' : 'gap-6'}`} style={{ gridTemplateColumns: `60px repeat(${maxCapacity}, 1fr)` }}>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center flex flex-col justify-center">Week</div>
        {Array.from({ length: maxCapacity }).map((_, i) => (
          <div key={i} className="text-[10px] font-black text-slate-900 dark:text-white text-center uppercase tracking-[0.15em] flex items-center justify-center gap-2">
            <Users size={12} className="text-slate-300" strokeWidth={2.2} /> Eq. {i + 1}
            <button
              onClick={() => onToggleTeamPath(i + 1)}
              className={`ml-1 p-1.5 rounded-lg transition-all ${visibleTeamPath === i + 1 ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-300 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30'}`}
              title="Afficher le trajet sur la carte"
            >
              <Route size={10} strokeWidth={2.5} />
            </button>
          </div>
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-3">
        {schedule.map((slot) => {
          let bgThemeClass = "bg-white/40 dark:bg-slate-800/40";
          let weekLabelTheme = "bg-white dark:bg-[var(--bg-card-solid)] border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white shadow-sm";

          if (slot.week < CURRENT_WEEK) {
            bgThemeClass = "bg-slate-100/30 dark:bg-slate-800/30 opacity-60";
            weekLabelTheme = "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600";
          } else if (slot.week === CURRENT_WEEK) {
            bgThemeClass = "bg-gradient-to-r from-emerald-50/50 dark:from-emerald-900/30 to-white dark:to-slate-800/40 border-y-emerald-100/50 dark:border-y-emerald-800/50 border-l-4 border-l-emerald-400";
            weekLabelTheme = "bg-emerald-100 dark:bg-emerald-900/50 border-emerald-200 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 shadow-lg shadow-emerald-100/50 dark:shadow-emerald-900/50 ring-2 ring-white dark:ring-emerald-800";
          } else if (slot.week === CURRENT_WEEK + 1) {
            bgThemeClass = "bg-gradient-to-r from-rose-50/40 dark:from-rose-900/20 to-white dark:to-slate-800/40 border-y-rose-100/30 dark:border-y-rose-800/30 border-l-4 border-l-rose-300 dark:border-l-rose-600";
            weekLabelTheme = "bg-rose-50 dark:bg-rose-900/40 border-rose-100 dark:border-rose-800 text-rose-800 dark:text-rose-200 shadow-sm";
          }

          return (
            <div key={slot.week}
              className={`grid p-3 items-stretch transition-all duration-500 rounded-[2.5rem] border border-transparent ${bgThemeClass} ${isCompact ? 'gap-3' : 'gap-6'}`}
              style={{ gridTemplateColumns: `60px repeat(${maxCapacity}, 1fr)` }}>
              <div className="flex flex-col items-center gap-4 py-2">
                <div className={`font-black text-[11px] px-3 py-2 rounded-2xl border transition-all ${weekLabelTheme}`}>S{slot.week}</div>
                <div className="flex flex-col items-center gap-1.5 bg-white/60 dark:bg-slate-800/60 p-1.5 rounded-2xl shadow-inner border border-slate-100/50 dark:border-slate-700/50">
                  <button onClick={() => onModifyWeekTeamCount(slot.week, 1)} className="p-1.5 text-slate-300 hover:text-orange-600 transition-colors"><UserPlus size={11} strokeWidth={2.5} /></button>
                  <div className="text-[10px] font-black text-slate-500 dark:text-slate-400">{slot.capacity}</div>
                  <button onClick={() => onModifyWeekTeamCount(slot.week, -1)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"><UserMinus size={11} strokeWidth={2.5} /></button>
                </div>
              </div>
              {Array.from({ length: maxCapacity }).map((_, idx) => {
                if (idx >= slot.capacity) return <div key={idx} className="bg-slate-200/5 dark:bg-slate-700/5 rounded-[2rem] border border-dashed border-slate-200/40 dark:border-slate-700/40"></div>;
                const teamData = slot.teams[idx];
                const isTarget = dragOverCell?.week === slot.week && dragOverCell?.team === (idx + 1);

                if (teamData === null) return <div key={idx} onDragOver={(e) => { if (isEditMode) e.preventDefault(); setDragOverCell({ week: slot.week, team: idx + 1 }); }} onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const cid = e.dataTransfer.getData('clusterId'); if (cid) onManualMoveRequest(cid, idx + 1, slot.week); }} className={`w-full h-full min-h-[90px] rounded-[2rem] border-2 border-dashed transition-all duration-300 ${isTarget ? 'bg-orange-50/50 dark:bg-orange-900/20 border-orange-400 scale-[1.02]' : 'border-slate-200/40 dark:border-slate-700/40 bg-white/20 dark:bg-slate-800/20 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700'}`}></div>;

                if (teamData) {
                  const { cluster, weekIndex } = teamData;
                  const isLow = cluster.totalPopulation < MIN_1W;
                  return (
                    <div key={idx} onDragOver={(e) => { if (isEditMode) e.preventDefault(); setDragOverCell({ week: slot.week, team: idx + 1 }); }} onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const cid = e.dataTransfer.getData('clusterId'); if (cid) onManualMoveRequest(cid, idx + 1, slot.week); }} className={`rounded-[2rem] transition-all duration-500 ${isTarget && isEditMode ? 'scale-[1.05] z-40' : ''}`}>
                      <div onClick={() => { if (!isBonusMode) onSelectCluster(cluster); }} draggable={isEditMode} onDragStart={(e) => e.dataTransfer.setData('clusterId', cluster.id)} className={`h-full rounded-[2rem] border flex flex-col relative overflow-hidden transition-all duration-500 shadow-[0_15px_35px_-12px_rgba(0,0,0,0.06)] ${selectedCluster?.id === cluster.id ? 'ring-[3px] ring-orange-500/15 border-orange-500 shadow-2xl scale-[1.03] z-20' : 'bg-white dark:bg-[var(--bg-card-solid)] border-slate-100/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-xl hover:-translate-y-1'} ${isLow ? 'border-red-200 dark:border-red-800 bg-red-50/10 dark:bg-red-900/10' : ''}`}>
                        <div className={`${isCompact ? 'p-4' : 'p-6'} pb-3 flex flex-col`}>
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <span className={`font-black text-slate-900 dark:text-white leading-none tracking-tighter ${isCompact ? 'text-xl' : 'text-2xl'}`}>{cluster.code}</span>
                              {isLow && <AlertTriangle size={16} className="text-red-600 animate-pulse" strokeWidth={2.5} />}
                              {cluster.isBonus && <Zap size={15} className="text-emerald-500" strokeWidth={2.5} />}
                            </div>
                            {isCompact && (
                              <span className="bg-slate-900 text-white px-2 py-1 rounded-lg text-[9px] font-black tracking-wider uppercase shadow-sm">{cluster.durationWeeks}s</span>
                            )}
                          </div>
                          <div className="h-1.5 w-10 rounded-full mt-2" style={{ backgroundColor: cluster.color }}></div>
                        </div>
                        <div className={`${isCompact ? 'px-4 py-3' : 'px-6 py-4'} flex-grow flex items-center`}>
                          <div className={`text-[11px] font-black uppercase flex items-center gap-2 ${isLow ? 'text-red-600' : 'text-slate-400'} ${cluster.isBonus ? 'text-emerald-600' : ''}`}>
                            <Users size={isCompact ? 13 : 15} strokeWidth={2.2} className={isLow ? 'text-red-400' : (cluster.isBonus ? 'text-emerald-400' : 'text-slate-200')} />
                            {(cluster.totalPopulation / 1000).toFixed(1)}k
                          </div>
                        </div>
                        {!isCompact && (
                          <div className="px-6 py-4 bg-slate-50/30 dark:bg-slate-800/30 border-t border-slate-100/50 dark:border-slate-800/50 flex items-center justify-between">
                            <span className="bg-slate-900 text-white px-2.5 py-1 rounded-xl text-[9px] font-black tracking-[0.15em] shadow-sm uppercase">{cluster.durationWeeks} semaines</span>
                            {cluster.isBonus && <span className="text-emerald-600 text-[10px] font-black uppercase tracking-tighter flex items-center gap-1.5"><Zap size={12} strokeWidth={2.5} /> Zone Bonus</span>}
                          </div>
                        )}
                        {/* PROGRESS INDICATOR (X/Y) */}
                        {cluster.durationWeeks > 1 && (
                          <div className={`absolute bottom-3 right-4 flex items-center ${isCompact ? 'bottom-2 right-3' : 'bottom-3 right-4'}`}>
                            <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm tracking-tighter">
                              {weekIndex}/{cluster.durationWeeks}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return <div key={idx}></div>;
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScheduleGrid;
