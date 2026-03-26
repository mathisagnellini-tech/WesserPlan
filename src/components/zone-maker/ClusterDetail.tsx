import React from 'react';
import { Cluster } from './types';
import { MIN_1W } from './constants';
import { X, Clock, Users, AlertTriangle, Zap, Check } from 'lucide-react';

interface ClusterDetailProps {
  selectedCluster: Cluster;
  isBonusMode: boolean;
  onToggleBonusMode: () => void;
  onClose: () => void;
  onPutBackToDraft: (id: string) => void;
  onDelete: (id: string) => void;
}

const ClusterDetail: React.FC<ClusterDetailProps> = ({
  selectedCluster,
  isBonusMode,
  onToggleBonusMode,
  onClose,
  onPutBackToDraft,
  onDelete,
}) => {
  return (
    <div className={`fixed bottom-12 right-12 w-full max-w-lg z-[600] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] translate-x-0 opacity-100 scale-100`}>
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border border-white/50 dark:border-slate-700/50 shadow-[0_45px_100px_-25px_rgba(0,0,0,0.18)] rounded-[3.5rem] overflow-hidden flex flex-col">
        <div className="p-12 border-b border-slate-100/60 dark:border-slate-800/60 flex items-center justify-between bg-white/40 dark:bg-slate-800/40">
          <div className="flex items-center gap-10">
            <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center text-white text-4xl font-black shadow-2xl transition-transform hover:scale-110 duration-500" style={{ background: selectedCluster.color, boxShadow: `0 25px 50px -12px ${selectedCluster.color}66` }}>{selectedCluster.code}</div>
            <div>
              <div className="flex items-center gap-4">
                <h2 className="font-black text-5xl text-slate-900 dark:text-white tracking-tighter leading-none">Zone {selectedCluster.code}</h2>
                <button
                  onClick={onToggleBonusMode}
                  className={`px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2.5 border-2 shadow-sm ${isBonusMode ? 'bg-orange-600 text-white border-orange-600 shadow-orange-200 dark:shadow-orange-900/30' : 'bg-white dark:bg-[var(--bg-card-solid)] text-slate-400 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700'} ${selectedCluster.isBonus ? 'text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/30' : ''}`}
                >
                  {isBonusMode ? <Check size={14} strokeWidth={3} /> : <Zap size={14} strokeWidth={3} />}
                  {isBonusMode ? 'Sélection...' : 'ZONE BONUS'}
                </button>
              </div>
              <div className="flex gap-5 mt-4">
                <span className={`text-[12px] font-black uppercase tracking-widest flex items-center gap-2.5 px-4 py-2 rounded-2xl border-2 transition-all ${selectedCluster.totalPopulation < MIN_1W ? 'bg-red-50 dark:bg-red-900/30 text-red-600 border-red-100 dark:border-red-800' : 'bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 border-slate-100 dark:border-slate-700'} ${selectedCluster.isBonus ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' : ''}`}>
                  {selectedCluster.totalPopulation < MIN_1W && <AlertTriangle size={16} className="text-red-500 animate-pulse" strokeWidth={2.5} />}
                  <Users size={16} strokeWidth={2.5} className={selectedCluster.totalPopulation < MIN_1W ? 'text-red-400' : (selectedCluster.isBonus ? 'text-emerald-500' : 'text-slate-200')} />
                  {selectedCluster.totalPopulation.toLocaleString()} hab.
                </span>
                <span className="text-[12px] font-black text-white uppercase tracking-widest flex items-center gap-2.5 bg-slate-900 px-4 py-2 rounded-2xl shadow-xl"><Clock size={16} strokeWidth={2.5} className="text-slate-500" /> {selectedCluster.durationWeeks} sem.</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-[1.5rem] transition-all"><X size={28} strokeWidth={2.5} /></button>
        </div>
        <div className="p-10 bg-slate-50/10 dark:bg-slate-800/10 max-h-[35vh] overflow-y-auto custom-scrollbar">
          {selectedCluster.isBonus && (
            <div className="mb-8 p-6 bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-100/50 dark:border-emerald-800/50 rounded-[2rem] flex gap-5 items-center shadow-sm">
              <Zap size={28} strokeWidth={2.5} className="text-emerald-600 shrink-0" />
              <div className="space-y-1">
                <p className="text-[11px] text-emerald-900 dark:text-emerald-200 font-black uppercase tracking-[0.1em]">Zone optimisée (Bonus)</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold uppercase leading-relaxed tracking-tight">Travail additionnel absorbé dans le planning initial.</p>
              </div>
            </div>
          )}
          {selectedCluster.totalPopulation < MIN_1W && (
            <div className="mb-8 p-6 bg-red-50 dark:bg-red-900/30 border-2 border-red-100/50 dark:border-red-800/50 rounded-[2rem] flex gap-5 items-center animate-pulse-subtle shadow-sm">
              <AlertTriangle size={28} strokeWidth={2.5} className="text-red-600 shrink-0" />
              <div className="space-y-1">
                <p className="text-[11px] text-red-900 dark:text-red-200 font-black uppercase tracking-[0.1em]">Population insuffisante</p>
                <p className="text-[11px] text-red-600 dark:text-red-400 font-bold uppercase leading-relaxed tracking-tight">Sous le seuil des {MIN_1W.toLocaleString()} hab. Fusionnez ou complétez.</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-5 pb-4">
            {selectedCluster.communes.map(c => (
              <div key={c.id} className="p-6 bg-white dark:bg-[var(--bg-card-solid)] border border-slate-100/80 dark:border-slate-800/80 rounded-[1.5rem] text-[12px] font-black text-slate-800 dark:text-slate-200 uppercase flex flex-col gap-1.5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                <span className="truncate tracking-tight">{c.name}</span>
                <span className="text-[10px] text-orange-600 tracking-widest font-bold">{c.population.toLocaleString()} habitants</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-10 bg-white/60 dark:bg-slate-800/60 border-t border-slate-100/60 dark:border-slate-800/60 flex justify-end gap-5">
          <button onClick={() => onPutBackToDraft(selectedCluster.id)} className="px-10 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">Retirer</button>
          <button onClick={() => onDelete(selectedCluster.id)} className="px-10 py-5 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-900/50 transition-all">Supprimer</button>
        </div>
      </div>
    </div>
  );
};

export default ClusterDetail;
