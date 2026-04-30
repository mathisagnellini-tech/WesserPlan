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
    <div className="app-surface fixed top-20 left-1/2 -translate-x-1/2 z-[900] w-full max-w-2xl px-6 pointer-events-none">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-[0_24px_60px_-24px_rgba(15,23,42,0.35),0_8px_24px_-16px_rgba(255,91,43,0.25)] rounded-2xl p-3 pointer-events-auto flex items-center justify-between border border-orange-200 dark:border-orange-500/30 ring-2 ring-orange-500/10 animate-in slide-in-from-top duration-400">
        <div className="flex items-center gap-3 ml-1">
          <div className="w-9 h-9 bg-orange-600 text-white rounded-xl flex items-center justify-center shadow-[0_8px_20px_-10px_rgba(255,91,43,0.7)]">
            <Pencil size={15} strokeWidth={2.2} className="animate-pulse" />
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-medium text-slate-900 dark:text-white tracking-tight">
              Mode zone bonus <span className="num text-slate-400">·</span> {selectedCluster?.code}
            </div>
            <p className="num text-orange-600 dark:text-orange-300 text-[11px] tracking-tight mt-0.5">
              {bonusSelectionCount} commune{bonusSelectionCount > 1 ? 's' : ''} sélectionnée{bonusSelectionCount > 1 ? 's' : ''} (durée conservée)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mr-1">
          <button onClick={onCancel} className="btn-ghost !text-[12px]">
            Annuler
          </button>
          <button
            onClick={onNext}
            disabled={bonusSelectionCount === 0}
            className="btn-primary !text-[12px] !px-4 !py-2"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
};

export default BonusModeHud;
