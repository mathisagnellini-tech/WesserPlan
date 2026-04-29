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
    <div className="fixed inset-0 bg-black/60 z-[1100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="text-orange-600" size={24} />
            Confirmation Planning
          </h3>
        </div>
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 rounded-xl p-4 flex items-center gap-4">
            <div className="bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 font-bold p-3 rounded-lg text-lg text-center min-w-[60px]">
              Zone {change.targetClusterCode}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase">Changement Durée</div>
              <div className="flex items-center gap-2 text-lg font-medium text-slate-900 dark:text-white">
                <span>{change.oldDuration} sem.</span>
                <ArrowRight size={18} className="text-slate-400" />
                <span className="font-bold text-orange-700">{change.newDuration} sem.</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              Impacts Collatéraux ({change.impactedClusters.length})
            </h4>
            {change.impactedClusters.length === 0 ? (
              <div className="text-sm text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700 text-center">Aucun autre changement de planning.</div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-700 max-h-40 overflow-y-auto">
                {change.impactedClusters.map(impact => (
                  <div key={impact.clusterId} className="p-3 text-sm flex justify-between items-center">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Zone {impact.code}</span>
                    <div className="flex items-center gap-3 text-xs">
                      {impact.oldStartWeek !== impact.newStartWeek && (
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded">
                          <span className="text-slate-500 dark:text-slate-400">S{impact.oldStartWeek}</span>
                          <ArrowRight size={10} className="text-slate-300" />
                          <span className="font-bold text-slate-800 dark:text-white">S{impact.newStartWeek}</span>
                        </div>
                      )}
                      {impact.oldTeam !== impact.newTeam && (
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded">
                          <span className="text-slate-500 dark:text-slate-400">Eq.{impact.oldTeam}</span>
                          <ArrowRight size={10} className="text-slate-300" />
                          <span className="font-bold text-slate-800 dark:text-white">Eq.{impact.newTeam}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Modifier la durée de cette zone va déclencher un recalcul automatique du calendrier pour combler les vides ou décaler les zones suivantes.
          </p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Annuler</button>
          <button onClick={onConfirm} className="px-5 py-2 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 shadow-md flex items-center gap-2">Confirmer</button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleChangeModal;
