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
    <div className="app-surface fixed inset-0 bg-slate-950/55 z-[1100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="modal-shell w-full max-w-md animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b border-[var(--border-subtle)] bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="display text-slate-900 dark:text-white text-xl tracking-tight leading-tight">
            Confirmer le déplacement
          </h3>
        </div>
        <div className="p-5 space-y-5">
          <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed tracking-tight">
            Vous souhaitez ajouter <strong className="text-slate-900 dark:text-white">{move.communeName}</strong>
            <span className="num"> ({move.communePop.toLocaleString('fr-FR')} habitants)</span> à la zone{' '}
            <strong className="text-emerald-700 dark:text-emerald-300">{move.targetClusterCode}</strong>.
            <br /><br />
            Cela fera passer cette zone à <strong className="num">{move.impact.target.newPop.toLocaleString('fr-FR')}</strong> habitants
            (<strong className="num">{move.impact.target.newWeeks}</strong> semaines).
            <br /><br />
            L’ancienne zone <strong className="text-red-700 dark:text-red-300">{move.sourceClusterCode}</strong> passera à{' '}
            <strong className="num">{move.impact.source.newPop.toLocaleString('fr-FR')}</strong> habitants
            (<strong className="num">{move.impact.source.newWeeks}</strong> semaines).
          </p>
          <div className="relative pt-1">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 border border-[var(--border-subtle)] rounded-full p-1 z-10 shadow-sm">
              <ArrowRight size={13} className="text-slate-400" strokeWidth={2.2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/25 rounded-xl p-4 text-center">
                <div className="eyebrow leading-none mb-1.5">Zone {move.sourceClusterCode}</div>
                <div className="num display text-red-700 dark:text-red-300 text-[22px] tracking-tight leading-none">
                  {move.impact.source.newPop.toLocaleString('fr-FR')}
                </div>
                <div className="num text-[11px] text-red-600 dark:text-red-400 mt-1.5 tracking-tight">
                  {move.impact.source.oldWeeks} → <strong>{move.impact.source.newWeeks} sem.</strong>
                </div>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/25 rounded-xl p-4 text-center">
                <div className="eyebrow leading-none mb-1.5">Zone {move.targetClusterCode}</div>
                <div className="num display text-emerald-700 dark:text-emerald-300 text-[22px] tracking-tight leading-none">
                  {move.impact.target.newPop.toLocaleString('fr-FR')}
                </div>
                <div className="num text-[11px] text-emerald-600 dark:text-emerald-400 mt-1.5 tracking-tight">
                  {move.impact.target.oldWeeks} → <strong>{move.impact.target.newWeeks} sem.</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50/60 dark:bg-slate-800/40 border-t border-[var(--border-subtle)] flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary">Annuler</button>
          <button onClick={onConfirm} className="btn-primary">Confirmer</button>
        </div>
      </div>
    </div>
  );
};

export default MoveConfirmModal;
