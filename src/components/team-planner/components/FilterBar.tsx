import React from 'react';
import { FilterState } from '../types';
import { X, Check } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onClear: () => void;
  availableNgos: string[];
}

const FilterGroup: React.FC<{
  label: string;
  options: string[];
  selected: string[];
  onChange: (val: string) => void;
}> = ({ label, options, selected, onChange }) => {
  return (
    <div className="flex flex-col gap-2 min-w-fit">
      <span className="eyebrow pl-0.5">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isActive = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={`px-2.5 py-1 rounded-lg text-[12px] font-medium tracking-tight border flex items-center gap-1.5 transition active:translate-y-[1px] ${
                isActive
                  ? 'bg-orange-50 text-orange-700 border-orange-200 ring-1 ring-orange-100 dark:bg-orange-500/15 dark:text-orange-200 dark:border-orange-500/30 dark:ring-orange-500/25'
                  : 'bg-white text-slate-600 border-[var(--border-subtle)] hover:border-orange-200 hover:text-orange-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-orange-500/30 dark:hover:text-orange-200'
              }`}
            >
              {isActive && <Check size={11} strokeWidth={2.6} />}
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, onClear, availableNgos }) => {
  const hasActiveFilters = Object.values(filters).some((arr) => (arr as string[]).length > 0);
  const totalActive = Object.values(filters).reduce<number>(
    (acc, curr) => acc + (curr as string[]).length,
    0,
  );

  return (
    <div className="w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/50 dark:border-slate-700/50 animate-in slide-in-from-top-2 duration-300 z-40 sticky top-16">
      <div className="px-6 py-4 flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between overflow-x-auto custom-scrollbar-light">

        <div className="flex gap-6 items-start">
            <FilterGroup
                label="Rôle"
                options={['Teamleader', 'Fundraiser']}
                selected={filters.roles}
                onChange={(val) => onFilterChange('roles', val)}
            />

            <div className="w-px bg-slate-200/60 dark:bg-slate-700/60 self-stretch my-1" />

            <FilterGroup
                label="Contrat"
                options={['Signed', 'Pending', 'Not Sent']}
                selected={filters.contractStatus}
                onChange={(val) => onFilterChange('contractStatus', val)}
            />

            <div className="w-px bg-slate-200/60 dark:bg-slate-700/60 self-stretch my-1" />

            <FilterGroup
                label="Tags"
                options={['Permis', 'Senior', 'Junior', 'Homme', 'Femme']}
                selected={filters.tags}
                onChange={(val) => onFilterChange('tags', val)}
            />

            <div className="w-px bg-slate-200/60 dark:bg-slate-700/60 self-stretch my-1" />

            <FilterGroup
                label="Mission / ONG"
                options={availableNgos}
                selected={filters.ngos}
                onChange={(val) => onFilterChange('ngos', val)}
            />
        </div>

        <div className="flex items-center gap-3 ml-auto pl-4 border-l border-slate-200/60 dark:border-slate-700/60 h-full">
            {hasActiveFilters && (
                <button
                    onClick={onClear}
                    className="btn-ghost !px-2.5 !py-1.5 !text-[12px] hover:!bg-red-50 hover:!text-red-600 dark:hover:!bg-red-500/15 dark:hover:!text-red-300"
                >
                    <X size={13} strokeWidth={2.2} /> Effacer
                </button>
            )}
            <div className="num eyebrow leading-none px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-[var(--border-subtle)]">
                {totalActive} filtre{totalActive > 1 ? 's' : ''} actif{totalActive > 1 ? 's' : ''}
            </div>
        </div>
      </div>
    </div>
  );
};
