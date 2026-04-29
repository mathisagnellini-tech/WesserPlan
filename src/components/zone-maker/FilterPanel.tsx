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
    <div className="absolute bottom-12 left-12 z-[500] pointer-events-none">
      <div className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/40 dark:border-slate-700/40 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] rounded-[2.5rem] overflow-hidden transition-all duration-500 pointer-events-auto w-80 ${isOpen ? 'max-h-[500px] shadow-2xl' : 'max-h-20 shadow-xl'}`}>
        <button onClick={onToggle} className="w-full flex items-center justify-between px-10 py-7 border-b border-slate-100/50 dark:border-slate-800/50">
          <span className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-[0.25em] flex items-center gap-4"><Filter size={18} strokeWidth={2.5} /> Visibilité</span>
          {isOpen ? <ChevronDown size={18} strokeWidth={2.5} /> : <ChevronUp size={18} strokeWidth={2.5} />}
        </button>
        <div className="p-7 space-y-3.5">
          {COMMUNE_STATUSES.map(status => (
            <label key={status.id} className="flex items-center gap-5 px-5 py-4.5 rounded-[1.5rem] hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800 group">
              <input
                type="checkbox"
                checked={visibleStatuses.has(status.id as CommuneStatus)}
                onChange={() => onToggleStatus(status.id as CommuneStatus)}
                className="w-6 h-6 rounded-lg border-2 border-slate-200 dark:border-slate-600 text-orange-600 focus:ring-orange-500/20 transition-all cursor-pointer"
              />
              <div className="flex items-center gap-4 flex-grow">
                <div className="w-4 h-4 rounded-full shadow-inner ring-2 ring-white dark:ring-slate-800" style={{ background: status.color }}></div>
                <span className="text-[13px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">{status.label}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
