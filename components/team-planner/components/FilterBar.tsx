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
  colorClass?: string;
}> = ({ label, options, selected, onChange, colorClass = "bg-blue-600" }) => {
  return (
    <div className="flex flex-col gap-2 min-w-fit">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isActive = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 flex items-center gap-1.5
                ${isActive 
                  ? `${colorClass} text-white border-transparent shadow-md transform scale-105` 
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }
              `}
            >
              {isActive && <Check size={10} strokeWidth={4} />}
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

  return (
    <div className="w-full bg-white/60 backdrop-blur-xl border-b border-white/50 animate-in slide-in-from-top-2 duration-300 z-40 sticky top-16">
      <div className="px-6 py-4 flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between overflow-x-auto custom-scrollbar-light">
        
        <div className="flex gap-8 items-start">
            {/* Roles */}
            <FilterGroup 
                label="Rôle" 
                options={['Teamleader', 'Fundraiser']} 
                selected={filters.roles} 
                onChange={(val) => onFilterChange('roles', val)}
                colorClass="bg-purple-600"
            />

            <div className="w-px bg-slate-200/60 self-stretch my-1"></div>

            {/* Status */}
            <FilterGroup 
                label="Contrat" 
                options={['Signed', 'Pending', 'Not Sent']} 
                selected={filters.contractStatus} 
                onChange={(val) => onFilterChange('contractStatus', val)}
                colorClass="bg-emerald-600"
            />

            <div className="w-px bg-slate-200/60 self-stretch my-1"></div>

            {/* Tags */}
            <FilterGroup 
                label="Tags" 
                options={['Permis', 'Senior', 'Junior', 'Homme', 'Femme']} 
                selected={filters.tags} 
                onChange={(val) => onFilterChange('tags', val)}
                colorClass="bg-amber-500"
            />

            <div className="w-px bg-slate-200/60 self-stretch my-1"></div>

             {/* NGOs */}
             <FilterGroup 
                label="Mission / ONG" 
                options={availableNgos} 
                selected={filters.ngos} 
                onChange={(val) => onFilterChange('ngos', val)}
                colorClass="bg-slate-800"
            />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 ml-auto pl-4 border-l border-slate-200/60 h-full">
            {hasActiveFilters && (
                <button 
                    onClick={onClear}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                    <X size={14} /> Effacer
                </button>
            )}
            <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Filtres Actifs: {Object.values(filters).reduce((acc: number, curr) => acc + (curr as string[]).length, 0)}
            </div>
        </div>
      </div>
    </div>
  );
};