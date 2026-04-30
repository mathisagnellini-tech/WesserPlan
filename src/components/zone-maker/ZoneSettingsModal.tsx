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
    <div className="app-surface fixed inset-0 bg-slate-950/55 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="modal-shell w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="modal-accent-strip p-5 border-b border-[var(--border-subtle)] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-orange-50 text-orange-600 ring-1 ring-orange-100 dark:bg-orange-500/15 dark:ring-orange-500/25">
              <Settings size={16} strokeWidth={2.2} />
            </div>
            <h3 className="display text-slate-900 dark:text-white text-xl tracking-tight leading-tight">
              Paramètres &amp; filtres
            </h3>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="btn-ghost !p-2">
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-7">
          <div>
            <h4 className="eyebrow leading-none mb-3 flex items-center gap-1.5">
              <Filter size={11} strokeWidth={2.4} className="text-slate-400" /> Visibilité des statuts
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {COMMUNE_STATUSES.map(status => (
                <label
                  key={status.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-subtle)] hover:border-orange-200 dark:hover:border-orange-500/30 hover:bg-orange-50/50 dark:hover:bg-orange-500/10 cursor-pointer transition"
                >
                  <input
                    type="checkbox"
                    checked={statusFilters.has(status.id as CommuneStatus)}
                    onChange={() => onToggleStatusFilter(status.id)}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500/20 border-slate-300 dark:border-slate-600"
                  />
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full ring-2 ring-white dark:ring-slate-800" style={{ backgroundColor: status.color }} />
                    <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 tracking-tight">{status.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <hr className="border-[var(--border-subtle)]" />
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="eyebrow leading-none flex items-center gap-1.5">
                <Users size={11} strokeWidth={2.4} className="text-slate-400" /> Population max
              </h4>
              <span className="num text-[12px] font-medium bg-slate-50 dark:bg-slate-800 border border-[var(--border-subtle)] px-2.5 py-1 rounded-md text-slate-700 dark:text-slate-300 tracking-tight">
                {maxPopFilter.toLocaleString('fr-FR')} hab.
              </span>
            </div>
            <input
              type="range"
              min="10000"
              max="200000"
              step="5000"
              value={maxPopFilter}
              onChange={(e) => onMaxPopFilterChange(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-600"
            />
          </div>
          <div>
            <h4 className="eyebrow leading-none mb-3 flex items-center gap-1.5">
              <Trash2 size={11} strokeWidth={2.4} className="text-slate-400" /> Exclusions manuelles <span className="num">({excludedList.length})</span>
            </h4>
            {excludedList.length === 0 ? (
              <div className="text-center p-5 border border-dashed border-[var(--border-subtle)] rounded-xl bg-slate-50/40 dark:bg-slate-800/40">
                <p className="text-[12px] text-slate-400 italic tracking-tight">Aucune commune exclue.</p>
              </div>
            ) : (
              <div className="bg-slate-50/40 dark:bg-slate-800/40 border border-[var(--border-subtle)] rounded-xl divide-y divide-[var(--border-subtle)] max-h-40 overflow-y-auto">
                {excludedList.map(c => (
                  <div key={c.id} className="p-3 flex justify-between items-center text-[13px] tracking-tight">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {c.name} <span className="num text-slate-400 text-[11px] font-normal ml-1">({c.population})</span>
                    </span>
                    <button
                      onClick={() => onIncludeCommune(c.id)}
                      className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/15 px-2 py-1 rounded-md flex items-center gap-1 text-[11px] font-medium transition active:translate-y-[1px] tracking-tight"
                    >
                      <RefreshCw size={11} strokeWidth={2.4} /> Restaurer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="p-4 border-t border-[var(--border-subtle)] bg-slate-50/60 dark:bg-slate-800/40 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Fermer</button>
          <button onClick={onApplyAndRegenerate} className="btn-primary">Appliquer &amp; régénérer</button>
        </div>
      </div>
    </div>
  );
};

export default ZoneSettingsModal;
