import React, { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Cluster } from './types';
import { Zap, ArrowRight } from 'lucide-react';
import { useDialogA11y } from '@/hooks/useDialogA11y';

interface BonusImpacts {
  addedPop: number;
  sources: { code: string; lostPop: number; finalPop: number; isLow: boolean; communes: string[] }[];
  hasAnyLowSource: boolean;
}

interface BonusConfirmModalProps {
  selectedCluster: Cluster;
  bonusImpacts: BonusImpacts;
  onCancel: () => void;
  onConfirm: () => void;
}

const BonusConfirmModal: React.FC<BonusConfirmModalProps> = ({ selectedCluster, bonusImpacts, onCancel, onConfirm }) => {
  const titleId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const { dialogRef } = useDialogA11y({ isOpen: true, onClose: onCancel, initialFocusRef: confirmRef });
  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div ref={dialogRef} className="bg-white dark:bg-[var(--bg-card-solid)] rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in duration-300">
        <div className="p-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-orange-600 text-white rounded-2xl shadow-lg shadow-orange-100 dark:shadow-orange-900/30"><Zap size={24} /></div>
            <h3 id={titleId} className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Confirmation Zone Bonus</h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest text-center">Les communes ajoutées n'augmenteront pas la durée de la zone cible.</p>
        </div>

        <div className="p-10 space-y-8 overflow-y-auto max-h-[60vh]">
          <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-[2rem] p-8 flex items-center gap-6">
            <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg">{selectedCluster.code}</div>
            <div className="space-y-1">
              <div className="text-emerald-900 dark:text-emerald-200 font-black text-xl leading-none">+{bonusImpacts.addedPop.toLocaleString()} hab.</div>
              <div className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Travail additionnel absorbé (Total : {selectedCluster.durationWeeks} sem.)</div>
            </div>
          </div>

          <div className="flex justify-center -my-4 relative z-10">
            <div className="bg-white dark:bg-[var(--bg-card-solid)] border border-slate-200 dark:border-slate-700 rounded-full p-3 shadow-md"><ArrowRight className="text-slate-400" size={20} /></div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Détails des transferts</h4>
            {bonusImpacts.sources.length > 0 ? bonusImpacts.sources.map((src, i) => (
              <div key={i} className={`border rounded-[2rem] p-8 flex items-center justify-between transition-all ${src.isLow ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 ring-2 ring-red-100 dark:ring-red-900/50 shadow-sm' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`}>
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg ${src.isLow ? 'bg-red-600' : 'bg-slate-700'}`}>{src.code}</div>
                  <div className="space-y-0.5">
                    <div className={`font-black text-lg leading-none ${src.isLow ? 'text-red-900 dark:text-red-200' : 'text-slate-900 dark:text-white'}`}>-{src.lostPop.toLocaleString()} hab.</div>
                    <div className={`text-[9px] font-bold uppercase tracking-wider ${src.isLow ? 'text-red-400' : 'text-slate-400'}`}>
                      {src.communes.length} commune(s) transférée(s)
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-800 rounded-[2rem] p-8 text-center">
                <p className="text-orange-900 dark:text-orange-200 font-black text-xs uppercase tracking-widest">Uniquement des communes non-assignées</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-10 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex gap-4">
          <button type="button" onClick={onCancel} className="flex-1 py-5 bg-white dark:bg-[var(--bg-card-solid)] border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">Annuler</button>
          <button ref={confirmRef} type="button" onClick={onConfirm} className="flex-[2] py-5 bg-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-2xl shadow-orange-100 dark:shadow-orange-900/30 hover:bg-orange-700 transition-all">Confirmer Zone Bonus</button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default BonusConfirmModal;
