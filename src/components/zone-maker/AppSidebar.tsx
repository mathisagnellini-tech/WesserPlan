import React from 'react';
import { Cluster, CommuneStatus } from './types';
import { COMMUNE_STATUSES } from './constants';
import {
  MapPin, RefreshCw, Sparkles, Info, Loader2, Calendar, Users, Settings, Edit3,
  Trash2, X, Plus, Minus, Clock, CheckCircle, Download
} from 'lucide-react';

interface ScheduleSlot {
  week: number;
  capacity: number;
  teams: (Cluster | undefined | null)[];
}

interface AppSidebarProps {
  isLoading: boolean;
  defaultTeamCount: number;
  onDefaultTeamCountChange: (val: number) => void;
  targetPop: number;
  onTargetPopChange: (val: number) => void;
  onGenerate: () => void;
  onExportCSV: () => void;
  onShowSettings: () => void;
  schedule: ScheduleSlot[];
  maxCapacity: number;
  selectedCluster: Cluster | null;
  onClusterSelect: (cluster: Cluster) => void;
  onModifyWeekTeamCount: (week: number, increment: number) => void;

  // Detail panel props
  isEditMode: boolean;
  onToggleEditMode: () => void;
  analysis: string;
  onClearAnalysis: () => void;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  onCloseDetail: () => void;
  onUpdateDuration: (clusterId: string, delta: number) => void;
  onExcludeCommune: (communeId: string) => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({
  isLoading, defaultTeamCount, onDefaultTeamCountChange,
  targetPop, onTargetPopChange, onGenerate, onExportCSV, onShowSettings,
  schedule, maxCapacity, selectedCluster, onClusterSelect, onModifyWeekTeamCount,
  isEditMode, onToggleEditMode,
  analysis, onClearAnalysis, isAnalyzing, onAnalyze,
  onCloseDetail, onUpdateDuration, onExcludeCommune,
}) => {
  return (
    <aside className="w-full md:w-1/3 lg:w-[420px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col h-screen overflow-hidden sticky top-0 shadow-xl z-30">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex-none bg-white dark:bg-slate-900">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight"><div className="bg-orange-600 text-white p-1.5 rounded-lg"><MapPin size={20} /></div>ZonePlanner</h1>
          <button onClick={onShowSettings} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700" title="Paramètres & Filtres"><Settings size={20} /></button>
        </div>
        <div className="space-y-5 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <div className="flex justify-between mb-2"><label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Équipes par Défaut</label><span className="text-[10px] font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-sm">{defaultTeamCount}</span></div>
              <input type="range" min="1" max="5" step="1" value={defaultTeamCount} onChange={(e) => onDefaultTeamCountChange(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-600" />
            </div>
            <div>
              <div className="flex justify-between mb-2"><label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cible Hab.</label><span className="text-[10px] font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-sm">{targetPop / 1000}k</span></div>
              <input type="range" min="4000" max="20000" step="1000" value={targetPop} onChange={(e) => onTargetPopChange(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-600" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onGenerate} disabled={isLoading} className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3 px-4 rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-[0.98]">
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />} Regénérer
            </button>
            <button onClick={onExportCSV} className="px-3 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors" title="Exporter CSV">
              <Download size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-800/30 pb-40">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-2"><Calendar size={14} className="text-orange-500" /> Calendrier &amp; Équipes</h2>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md shadow-sm">{schedule.length} semaines</div>
        </div>

        <div className="grid gap-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center" style={{ gridTemplateColumns: `50px repeat(${maxCapacity}, 1fr)` }}>
          <div>Sem.</div>
          {Array.from({ length: maxCapacity }).map((_, i) => (<div key={i}>Eq. {i + 1}</div>))}
        </div>

        <div className="space-y-3">
          {schedule.map((slot) => (
            <div key={slot.week} className="grid gap-3 items-stretch text-sm group/week" style={{ gridTemplateColumns: `50px repeat(${maxCapacity}, 1fr)` }}>
              <div className="flex flex-col items-center justify-start py-1 border-r border-slate-200/50 dark:border-slate-700/50">
                <div className="font-mono text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">S{slot.week}</div>
                <div className="flex flex-col items-center gap-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-sm">
                  <button onClick={() => onModifyWeekTeamCount(slot.week, 1)} className="text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 w-full flex justify-center py-0.5 rounded-t"><Plus size={10} /></button>
                  <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300 px-1">{slot.capacity}</div>
                  <button onClick={() => onModifyWeekTeamCount(slot.week, -1)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full flex justify-center py-0.5 rounded-b"><Minus size={10} /></button>
                </div>
              </div>

              {Array.from({ length: maxCapacity }).map((_, idx) => {
                if (idx >= slot.capacity) {
                  return <div key={idx} className="bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-transparent flex items-center justify-center"><div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div></div>;
                }
                const cluster = slot.teams[idx];
                if (cluster === null) {
                  return <div key={idx} className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/30"></div>;
                }
                if (cluster === undefined) {
                  return <div key={idx}></div>;
                }
                const rowSpan = cluster.durationWeeks;
                const isMultiWeek = rowSpan > 1;
                return (
                  <div key={idx} onClick={() => onClusterSelect(cluster)} style={{ gridRow: `span ${rowSpan}` }}
                    className={`rounded-xl border cursor-pointer transition-all relative overflow-hidden flex flex-col p-0
                      ${selectedCluster?.id === cluster.id
                        ? 'bg-slate-800 border-slate-900 text-white shadow-lg ring-2 ring-orange-500/50 scale-[1.02] z-20'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-orange-300 hover:shadow-md hover:-translate-y-0.5 z-10'}`}
                  >
                    <div className="flex h-full">
                      <div className="w-1.5 flex-none h-full" style={{ backgroundColor: cluster.color }}></div>
                      <div className="flex-1 p-2 flex flex-col justify-between min-h-[70px]">
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="font-black text-sm tracking-tight leading-none">Zone {cluster.code}</span>
                            {isMultiWeek && (
                              <div className={`text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded ${selectedCluster?.id === cluster.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                {rowSpan} sem.
                              </div>
                            )}
                          </div>
                          <div className={`text-[10px] mt-1 font-medium ${selectedCluster?.id === cluster.id ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>{(cluster.totalPopulation / 1000).toFixed(1)}k hab.</div>
                        </div>
                        {isMultiWeek && (
                          <div className="flex gap-1 mt-2 opacity-50">
                            {Array.from({ length: rowSpan }).map((_, i) => (
                              <div key={i} className={`h-1 flex-1 rounded-full ${selectedCluster?.id === cluster.id ? 'bg-white' : 'bg-slate-300'}`}></div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Details Panel */}
      <div className={`absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-30 transition-transform duration-300 flex flex-col ${selectedCluster ? 'translate-y-0 max-h-[60%]' : 'translate-y-full h-0'}`}>
        {selectedCluster && (
          <>
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 z-10 sticky top-0 flex-none">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h2 className="font-black text-2xl flex items-center gap-3 text-slate-900 dark:text-white"><span className="w-4 h-4 rounded-full shadow-sm ring-2 ring-white dark:ring-slate-800" style={{ background: selectedCluster.color }}></span>Zone {selectedCluster.code}</h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-700">{selectedCluster.totalPopulation.toLocaleString()} hab.</span>
                    <span className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-2.5 py-1 rounded-md font-bold border border-orange-100 dark:border-orange-800/30 flex items-center gap-1"><Clock size={12} /> {selectedCluster.durationWeeks} semaine{selectedCluster.durationWeeks > 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={onToggleEditMode} className={`p-2.5 rounded-xl transition-all font-bold text-xs flex items-center gap-2 ${isEditMode ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30 shadow-inner' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm'}`}><Edit3 size={16} />{isEditMode ? 'Mode Édition' : 'Modifier'}</button>
                  {!analysis && (<button onClick={onAnalyze} disabled={isAnalyzing} className="p-2.5 rounded-xl bg-gradient-to-br from-purple-600 to-orange-600 text-white hover:shadow-lg hover:shadow-purple-200 transition-all active:scale-95" title="Analyser avec IA">{isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}</button>)}
                  <button onClick={onCloseDetail} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"><X size={20} /></button>
                </div>
              </div>

              {/* TIME MANAGEMENT */}
              <div className="mt-4 flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2"><Calendar size={14} /> Gestion du Temps</div>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
                <div className="flex items-center gap-2">
                  <button onClick={() => onUpdateDuration(selectedCluster.id, -1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-200 hover:text-orange-600 transition-colors" title="Réduire durée"><Minus size={14} /></button>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300 w-8 text-center">{selectedCluster.durationWeeks}s</span>
                  <button onClick={() => onUpdateDuration(selectedCluster.id, 1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-200 hover:text-orange-600 transition-colors" title="Augmenter durée"><Plus size={14} /></button>
                </div>
                <div className="ml-auto">
                  <button onClick={() => onUpdateDuration(selectedCluster.id, -1)} disabled={selectedCluster.durationWeeks <= 1} className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-200 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
                    <CheckCircle size={14} /> Terminer plus tôt
                  </button>
                </div>
              </div>

              {isEditMode && (<div className="mt-3 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-3 rounded-lg border border-amber-100 dark:border-amber-800/30 flex items-center gap-2 animate-in slide-in-from-top-2"><Info size={16} className="flex-shrink-0 text-amber-600 dark:text-amber-400" /><p>Cliquez sur une commune sur la carte pour l'ajouter à cette zone.</p></div>)}
            </div>
            <div className="overflow-y-auto p-3 bg-slate-50 dark:bg-slate-800/50 flex-grow">
              {analysis && (<div className="bg-white dark:bg-slate-800 border border-purple-100 dark:border-purple-800/30 p-4 rounded-xl mb-4 shadow-sm text-sm prose prose-purple dark:prose-invert relative"><button onClick={onClearAnalysis} className="absolute top-2 right-2 text-slate-300 hover:text-slate-500"><X size={16} /></button><h4 className="font-bold text-purple-800 dark:text-purple-300 flex items-center gap-2 mb-2"><Sparkles size={16} /> Analyse IA</h4><div dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br/>') }} /></div>)}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700"><tr><th className="px-4 py-3 font-semibold">Commune</th><th className="px-4 py-3 font-semibold text-right">Pop.</th><th className="px-4 py-3 font-semibold text-right"></th></tr></thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {selectedCluster.communes.sort((a, b) => b.population - a.population).map(c => {
                      const statusDef = COMMUNE_STATUSES.find(s => s.id === c.status);
                      return (
                        <tr key={c.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300 flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-slate-100 dark:ring-slate-700 shadow-sm" style={{ backgroundColor: statusDef?.color || '#ccc' }} title={statusDef?.label}></div><span className="truncate">{c.name}</span></td>
                          <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 font-mono text-xs text-right">{c.population.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-right"><button onClick={(e) => { e.stopPropagation(); onExcludeCommune(c.id); }} className="text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded transition-colors opacity-0 group-hover:opacity-100" title="Exclure de la liste"><Trash2 size={14} /></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;
