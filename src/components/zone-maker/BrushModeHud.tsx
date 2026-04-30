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
    <div className="app-surface absolute top-8 left-1/2 -translate-x-1/2 z-[500] w-full max-w-2xl px-6 pointer-events-none">
      <div className="modal-shell pointer-events-auto flex items-center justify-between gap-5 p-5 animate-in slide-in-from-top-6 duration-500">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-[0_8px_20px_-10px_rgba(255,91,43,0.7)]">
            <Sparkles size={20} strokeWidth={2.2} />
          </div>
          <div className="leading-tight">
            <div className="num display text-slate-900 dark:text-white text-[28px] tracking-tight leading-none">
              {brushStats.pop.toLocaleString('fr-FR')} <span className="text-[18px] font-medium text-slate-400">hab.</span>
            </div>
            <div
              className={`text-[11px] font-medium tracking-tight px-2 py-0.5 rounded-md inline-flex mt-1.5 ${brushStats.status.color} bg-slate-50 dark:bg-slate-800 border border-[var(--border-subtle)]`}
            >
              {brushStats.status.label} <span className="opacity-70 mx-1">·</span> <span className="num">{brushStats.count}</span> communes
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            aria-label="Effacer la sélection"
            title="Effacer tout"
            className="btn-ghost !p-3 hover:!text-red-500 hover:!bg-red-50 dark:hover:!bg-red-500/15"
          >
            <Eraser size={18} strokeWidth={2.2} />
          </button>
          <button
            onClick={onValidate}
            disabled={!brushStats.status.valid}
            className="btn-primary !px-5 !py-3"
          >
            <CheckCircle2 size={15} strokeWidth={2.4} /> Créer la zone
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrushModeHud;
