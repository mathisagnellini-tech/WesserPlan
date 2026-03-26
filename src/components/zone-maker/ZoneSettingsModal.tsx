import React from 'react';
import { Commune, CommuneStatus } from './types';
import { COMMUNE_STATUSES } from './constants';
import { Settings, X, Filter, Users, Trash2, RefreshCw } from 'lucide-react';

interface ZoneSettingsModalProps {
  onClose: () => void;
  statusFilters: Set<CommuneStatus>;
  onToggleStatusFilter: (statusId: string) => void;
  maxPopFilter: number;
  onMaxPopFilterChange: (val: number) => void;
  excludedList: Commune[];
  onIncludeCommune: (id: string) => void;
  onApplyAndRegenerate: () => void;
}

const ZoneSettingsModal: React.FC<ZoneSettingsModalProps> = ({
  onClose, statusFilters, onToggleStatusFilter,
  maxPopFilter, onMaxPopFilterChange,
  excludedList, onIncludeCommune, onApplyAndRegenerate,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-white"><Settings size={20} className="text-orange-600" /> Paramètres &amp; Filtres</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X size={24} /></button>
        </div>
        <div className="p-6 overflow-y-auto space-y-8">
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Filter size={16} className="text-slate-500 dark:text-slate-400" /> Visibilité des Statuts</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {COMMUNE_STATUSES.map(status => (
                <label key={status.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-orange-300 hover:bg-orange-50/50 dark:hover:bg-orange-900/20 cursor-pointer transition-all">
                  <input type="checkbox" checked={statusFilters.has(status.id as CommuneStatus)} onChange={() => onToggleStatusFilter(status.id)} className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 dark:border-slate-600" />
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: status.color }}></span><span className="text-sm font-medium text-slate-700 dark:text-slate-300">{status.label}</span></div>
                </label>
              ))}
            </div>
          </div>
          <hr className="border-slate-100 dark:border-slate-700" />
          <div>
            <div className="flex justify-between items-center mb-4"><h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2"><Users size={16} className="text-slate-500 dark:text-slate-400" /> Filtre Population Max</h4><span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">{maxPopFilter.toLocaleString()} hab.</span></div>
            <input type="range" min="10000" max="200000" step="5000" value={maxPopFilter} onChange={(e) => onMaxPopFilterChange(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-900" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Trash2 size={16} className="text-slate-500 dark:text-slate-400" /> Exclusions Manuelles ({excludedList.length})</h4>
            {excludedList.length === 0 ? <div className="text-center p-6 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50"><p className="text-sm text-slate-400">Aucune commune exclue.</p></div> :
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-700 max-h-40 overflow-y-auto">
                {excludedList.map(c => (
                  <div key={c.id} className="p-3 flex justify-between items-center text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{c.name} <span className="text-slate-400 text-xs font-normal ml-1">({c.population})</span></span>
                    <button onClick={() => onIncludeCommune(c.id)} className="text-emerald-600 hover:bg-emerald-100 p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"><RefreshCw size={12} /> Restaurer</button>
                  </div>
                ))}
              </div>
            }
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Fermer</button>
          <button onClick={onApplyAndRegenerate} className="bg-slate-900 dark:bg-orange-600 hover:bg-black dark:hover:bg-orange-700 text-white px-5 py-2 rounded-lg font-medium shadow-lg shadow-slate-200 dark:shadow-slate-900 transition-all active:scale-95">Appliquer et Regénérer</button>
        </div>
      </div>
    </div>
  );
};

export default ZoneSettingsModal;
