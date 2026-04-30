import React from 'react';
import { CommuneStatus } from './types';
import { COMMUNE_STATUSES } from './constants';
import { Filter, ChevronUp, ChevronDown } from 'lucide-react';

interface FilterPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  visibleStatuses: Set<CommuneStatus>;
  onToggleStatus: (status: CommuneStatus) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ isOpen, onToggle, visibleStatuses, onToggleStatus }) => {
  return (
    <div className="app-surface absolute bottom-8 left-8 z-[500] pointer-events-none">
      <div className={`modal-shell pointer-events-auto w-72 transition-all duration-400 ${isOpen ? 'max-h-[420px]' : 'max-h-16'}`}>
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)] active:translate-y-[1px] transition"
        >
          <span className="text-[13px] font-medium text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Filter size={14} strokeWidth={2.2} className="text-orange-600" /> Visibilité
          </span>
          {isOpen ? <ChevronDown size={15} strokeWidth={2.2} /> : <ChevronUp size={15} strokeWidth={2.2} />}
        </button>
        <div className="p-3 space-y-1">
          {COMMUNE_STATUSES.map(status => (
            <label
              key={status.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition border border-transparent hover:border-[var(--border-subtle)] group"
            >
              <input
                type="checkbox"
                checked={visibleStatuses.has(status.id as CommuneStatus)}
                onChange={() => onToggleStatus(status.id as CommuneStatus)}
                className="w-4 h-4 rounded border-2 border-slate-300 dark:border-slate-600 text-orange-600 focus:ring-orange-500/20 cursor-pointer"
              />
              <div className="flex items-center gap-2.5 flex-grow">
                <span
                  className="w-3 h-3 rounded-full ring-2 ring-white dark:ring-slate-800"
                  style={{ background: status.color }}
                />
                <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 tracking-tight">
                  {status.label}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
