import React from 'react';
import { Cluster } from './types';
import { Pencil } from 'lucide-react';

interface BonusModeHudProps {
  selectedCluster: Cluster | null;
  bonusSelectionCount: number;
  onCancel: () => void;
  onNext: () => void;
}

const BonusModeHud: React.FC<BonusModeHudProps> = ({ selectedCluster, bonusSelectionCount, onCancel, onNext }) => {
  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[900] w-full max-w-2xl px-8 pointer-events-none">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl rounded-full p-4 pointer-events-auto flex items-center justify-between border border-orange-200 dark:border-orange-800 ring-4 ring-orange-600/10 animate-in slide-in-from-top duration-500">
        <div className="flex items-center gap-4 ml-2">
          <div className="w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-orange-100 dark:shadow-orange-900/30">
            <Pencil size={18} className="animate-pulse" />
          </div>
          <div className="space-y-0.5">
            <div className="text-slate-900 dark:text-white font-black text-sm tracking-tight leading-none uppercase">Mode Zone Bonus : {selectedCluster?.code}</div>
            <p className="text-orange-600 text-[9px] font-black uppercase tracking-widest">{bonusSelectionCount} commune(s) sélectionnée(s) (durée conservée)</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mr-1">
          <button onClick={onCancel} className="px-5 py-2.5 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full text-[10px] font-black uppercase tracking-wider transition-all">Annuler</button>
          <button
            onClick={onNext}
            disabled={bonusSelectionCount === 0}
            className="px-6 py-2.5 bg-orange-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider disabled:opacity-30 transition-all shadow-xl active:scale-95"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
};

export default BonusModeHud;
