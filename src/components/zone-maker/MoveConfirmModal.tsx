import React from 'react';
import { MoveConfirmation } from './types';
import { ArrowRight } from 'lucide-react';

interface MoveConfirmModalProps {
  move: MoveConfirmation;
  onCancel: () => void;
  onConfirm: () => void;
}

const MoveConfirmModal: React.FC<MoveConfirmModalProps> = ({ move, onCancel, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-[1100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50"><h3 className="font-bold text-xl text-slate-900 dark:text-white">Confirmer le déplacement</h3></div>
        <div className="p-6 space-y-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Vous souhaitez ajouter <strong className="text-slate-900 dark:text-white">{move.communeName}</strong> ({move.communePop.toLocaleString()} habitants) à la zone <strong className="text-emerald-700">{move.targetClusterCode}</strong>.
            <br /><br />
            Cela fera passer cette zone à <strong>{move.impact.target.newPop.toLocaleString()}</strong> habitants (<strong>{move.impact.target.newWeeks}</strong> semaines).
            <br /><br />
            L'ancienne zone <strong className="text-red-700">{move.sourceClusterCode}</strong> passera à <strong>{move.impact.source.newPop.toLocaleString()}</strong> habitants (<strong>{move.impact.source.newWeeks}</strong> semaines).
            <br /><br />
            Souhaitez-vous refaire le calcul des zones en conséquence ?
          </p>
          <div className="relative pt-2">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 z-10 shadow-sm"><ArrowRight size={16} className="text-slate-400" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl p-4 text-center">
                <div className="text-xs font-bold text-red-800 dark:text-red-300 uppercase tracking-wider mb-2">Zone {move.sourceClusterCode}</div>
                <div className="text-2xl font-bold text-red-900 dark:text-red-200">{move.impact.source.newPop.toLocaleString()}</div>
                <div className="text-xs text-red-600 dark:text-red-400 mt-1">{move.impact.source.oldWeeks} sem. &rarr; <strong>{move.impact.source.newWeeks} sem.</strong></div>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-xl p-4 text-center">
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-2">Zone {move.targetClusterCode}</div>
                <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-200">{move.impact.target.newPop.toLocaleString()}</div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{move.impact.target.oldWeeks} sem. &rarr; <strong>{move.impact.target.newWeeks} sem.</strong></div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Non</button>
          <button onClick={onConfirm} className="px-5 py-2 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 shadow-md flex items-center gap-2">Oui</button>
        </div>
      </div>
    </div>
  );
};

export default MoveConfirmModal;
