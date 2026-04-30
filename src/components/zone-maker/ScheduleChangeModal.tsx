import React from 'react';
import { ScheduleChangeConfirmation } from './types';
import { Clock, AlertTriangle, ArrowRight } from 'lucide-react';

interface ScheduleChangeModalProps {
  change: ScheduleChangeConfirmation;
  onCancel: () => void;
  onConfirm: () => void;
}

const ScheduleChangeModal: React.FC<ScheduleChangeModalProps> = ({ change, onCancel, onConfirm }) => {
  return (
    <div className="app-surface fixed inset-0 bg-slate-950/55 z-[1100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="modal-shell w-full max-w-lg animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-[var(--border-subtle)] bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-orange-50 text-orange-600 ring-1 ring-orange-100 dark:bg-orange-500/15 dark:ring-orange-500/25">
            <Clock size={16} strokeWidth={2.2} />
          </div>
          <h3 className="display text-slate-900 dark:text-white text-xl tracking-tight leading-tight">
            Confirmation planning
          </h3>
        </div>
        <div className="p-5 overflow-y-auto space-y-5">
          <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/25 rounded-xl p-4 flex items-center gap-4">
            <div className="num display bg-orange-100 dark:bg-orange-500/25 text-orange-700 dark:text-orange-200 px-3 py-1.5 rounded-md text-[15px] tracking-tight min-w-[60px] text-center">
              {change.targetClusterCode}
            </div>
            <div>
              <div className="eyebrow leading-none">Changement de durée</div>
              <div className="flex items-center gap-2 num text-[15px] font-medium text-slate-900 dark:text-white tracking-tight mt-1.5">
                <span>{change.oldDuration} sem.</span>
                <ArrowRight size={14} className="text-slate-400" strokeWidth={2.2} />
                <span className="text-orange-700 dark:text-orange-300">{change.newDuration} sem.</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="eyebrow leading-none mb-2.5 flex items-center gap-1.5">
              <AlertTriangle size={11} strokeWidth={2.4} className="text-amber-500" />
              Impacts collatéraux <span className="num">({change.impactedClusters.length})</span>
            </h4>
            {change.impactedClusters.length === 0 ? (
              <div className="text-[12px] text-slate-500 dark:text-slate-400 italic bg-slate-50/60 dark:bg-slate-800/40 p-3 rounded-xl border border-[var(--border-subtle)] text-center tracking-tight">
                Aucun autre changement de planning.
              </div>
            ) : (
              <div className="bg-slate-50/60 dark:bg-slate-800/40 border border-[var(--border-subtle)] rounded-xl divide-y divide-slate-100 dark:divide-slate-700 max-h-40 overflow-y-auto">
                {change.impactedClusters.map(impact => (
                  <div key={impact.clusterId} className="p-3 text-[13px] flex justify-between items-center tracking-tight">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Zone {impact.code}</span>
                    <div className="flex items-center gap-2">
                      {impact.oldStartWeek !== impact.newStartWeek && (
                        <div className="num flex items-center gap-1 bg-white dark:bg-slate-800 border border-[var(--border-subtle)] px-2 py-0.5 rounded-md text-[11px]">
                          <span className="text-slate-500 dark:text-slate-400">S{impact.oldStartWeek}</span>
                          <ArrowRight size={9} className="text-slate-300" strokeWidth={2.2} />
                          <span className="font-medium text-slate-800 dark:text-white">S{impact.newStartWeek}</span>
                        </div>
                      )}
                      {impact.oldTeam !== impact.newTeam && (
                        <div className="num flex items-center gap-1 bg-white dark:bg-slate-800 border border-[var(--border-subtle)] px-2 py-0.5 rounded-md text-[11px]">
                          <span className="text-slate-500 dark:text-slate-400">Éq.{impact.oldTeam}</span>
                          <ArrowRight size={9} className="text-slate-300" strokeWidth={2.2} />
                          <span className="font-medium text-slate-800 dark:text-white">Éq.{impact.newTeam}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed tracking-tight">
            Modifier la durée de cette zone va déclencher un recalcul automatique du calendrier pour combler les vides ou décaler les zones suivantes.
          </p>
        </div>
        <div className="p-4 bg-slate-50/60 dark:bg-slate-800/40 border-t border-[var(--border-subtle)] flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary">Annuler</button>
          <button onClick={onConfirm} className="btn-primary">Confirmer</button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleChangeModal;
