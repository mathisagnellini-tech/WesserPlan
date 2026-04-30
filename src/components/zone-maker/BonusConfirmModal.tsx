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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="app-surface fixed inset-0 bg-slate-950/55 backdrop-blur-sm z-[1100] flex items-center justify-center p-6 animate-in fade-in duration-300"
    >
      <div ref={dialogRef} className="modal-shell w-full max-w-lg flex flex-col animate-in zoom-in duration-300">
        <div className="modal-accent-strip p-6 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-orange-50 text-orange-600 ring-1 ring-orange-100 dark:bg-orange-500/15 dark:ring-orange-500/25">
              <Zap size={18} strokeWidth={2.2} />
            </div>
            <h3 id={titleId} className="display text-slate-900 dark:text-white text-2xl tracking-tight leading-tight">
              Confirmer la zone bonus
            </h3>
          </div>
          <p className="eyebrow leading-none mt-3">Les communes ajoutées n’augmenteront pas la durée de la zone cible.</p>
        </div>

        <div className="p-7 space-y-6 overflow-y-auto max-h-[60vh]">
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/25 rounded-2xl p-5 flex items-center gap-4">
            <div className="num w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center display text-[18px] tracking-tight">
              {selectedCluster.code}
            </div>
            <div className="leading-tight">
              <div className="num display text-emerald-900 dark:text-emerald-200 text-[22px] tracking-tight leading-none">
                +{bonusImpacts.addedPop.toLocaleString('fr-FR')} hab.
              </div>
              <div className="num text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1.5 tracking-tight">
                Travail additionnel absorbé · total {selectedCluster.durationWeeks} sem.
              </div>
            </div>
          </div>

          <div className="flex justify-center -my-3 relative z-10">
            <div className="bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-full p-2 shadow-md">
              <ArrowRight className="text-slate-400 dark:text-slate-500" size={15} strokeWidth={2.2} />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="eyebrow leading-none px-1">Détails des transferts</h4>
            {bonusImpacts.sources.length > 0 ? bonusImpacts.sources.map((src, i) => (
              <div
                key={i}
                className={`border rounded-2xl p-5 flex items-center justify-between transition ${
                  src.isLow
                    ? 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/25 ring-1 ring-red-100 dark:ring-red-500/15'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-[var(--border-subtle)]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`num w-11 h-11 rounded-xl flex items-center justify-center display text-[16px] tracking-tight ${
                      src.isLow ? 'bg-red-600 text-white' : 'bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900'
                    }`}
                  >
                    {src.code}
                  </div>
                  <div className="leading-tight">
                    <div className={`num display text-[18px] tracking-tight leading-none ${src.isLow ? 'text-red-900 dark:text-red-200' : 'text-slate-900 dark:text-white'}`}>
                      −{src.lostPop.toLocaleString('fr-FR')} hab.
                    </div>
                    <div className={`num text-[11px] font-medium mt-1.5 tracking-tight ${src.isLow ? 'text-red-600 dark:text-red-300' : 'text-slate-500 dark:text-slate-400'}`}>
                      {src.communes.length} commune{src.communes.length > 1 ? 's' : ''} transférée{src.communes.length > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/25 rounded-2xl p-5 text-center">
                <p className="text-[13px] text-orange-900 dark:text-orange-200 font-medium tracking-tight">
                  Uniquement des communes non-assignées.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-[var(--border-subtle)] bg-slate-50/60 dark:bg-slate-800/40 flex gap-3">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1">Annuler</button>
          <button ref={confirmRef} type="button" onClick={onConfirm} className="btn-primary flex-[2]">
            Confirmer la zone bonus
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default BonusConfirmModal;
