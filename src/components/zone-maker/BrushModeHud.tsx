import React from 'react';
import { Sparkles, Eraser, CheckCircle2 } from 'lucide-react';

interface BrushStats {
  pop: number;
  count: number;
  duration: number;
  status: { label: string; color: string; valid: boolean };
}

interface BrushModeHudProps {
  brushStats: BrushStats;
  onClear: () => void;
  onValidate: () => void;
}

const BrushModeHud: React.FC<BrushModeHudProps> = ({ brushStats, onClear, onValidate }) => {
  return (
    <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[500] w-full max-w-2xl px-8 pointer-events-none">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl shadow-[0_30px_70px_-15px_rgba(0,0,0,0.12)] border border-white/50 dark:border-slate-700/50 rounded-[2.5rem] p-8 pointer-events-auto ring-1 ring-black/5 flex items-center justify-between animate-in slide-in-from-top-6 duration-600">
        <div className="flex items-center gap-8">
          <div className="w-20 h-20 bg-orange-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-orange-200 dark:shadow-orange-900/30">
            <Sparkles size={32} strokeWidth={2.5} />
          </div>
          <div className="space-y-1.5">
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
              {brushStats.pop.toLocaleString()} hab.
            </div>
            <div className={`text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl inline-block ${brushStats.status.color} bg-slate-50 dark:bg-slate-800 border border-slate-100/50 dark:border-slate-700/50 shadow-sm`}>
              {brushStats.status.label} &bull; {brushStats.count} communes
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <button onClick={onClear} className="p-5 text-slate-300 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-[1.5rem] transition-all" title="Effacer tout"><Eraser size={26} strokeWidth={2.2} /></button>
          <button onClick={onValidate} disabled={!brushStats.status.valid} className="flex items-center gap-4 px-10 py-6 bg-orange-600 text-white rounded-[1.5rem] text-[14px] font-black uppercase tracking-wider hover:bg-orange-700 disabled:opacity-30 disabled:grayscale transition-all shadow-xl shadow-orange-200 dark:shadow-orange-900/30 active:scale-95">
            <CheckCircle2 size={20} strokeWidth={2.5} /> Créer Zone
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrushModeHud;
