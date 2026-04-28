import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Layers, Search, Check } from 'lucide-react';

interface MultiSelectDropdownProps {
  options: { value: string; label: string }[];
  selected: Set<string>;
  onSelectionChange: (value: string) => void;
  onClear: () => void;
  title: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selected,
  onSelectionChange,
  onClear,
  title,
  disabled = false,
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKey);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    return options.filter((opt) => opt.label.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [options, searchTerm]);

  const selectedLabel = useMemo(() => {
    if (selected.size === 0) return title;
    if (selected.size === 1) {
      const val = Array.from(selected)[0];
      return options.find((o) => o.value === val)?.label || val;
    }
    return `${selected.size} sélectionnés`;
  }, [selected, options, title]);

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 flex justify-between items-center shadow-sm group relative z-10
        ${
          disabled
            ? 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed'
            : isOpen
              ? 'bg-white dark:bg-[var(--bg-card-solid)] border-orange-500 ring-2 ring-orange-500/20'
              : 'bg-white dark:bg-[var(--bg-card-solid)] border-gray-200 dark:border-slate-700 hover:border-orange-300 hover:shadow-md text-[var(--text-primary)]'
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`p-2 rounded-lg ${selected.size > 0 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300' : 'bg-slate-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'}`}>
            {icon}
          </div>
          <div className="flex flex-col">
            <span className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${selected.size > 0 ? 'text-orange-600' : 'text-[var(--text-muted)]'}`}>
              {selected.size > 0 ? 'Filtre Actif' : 'Filtrer par'}
            </span>
            <span className={`font-bold truncate text-sm ${selected.size > 0 ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
              {selectedLabel}
            </span>
          </div>
        </div>
        <Layers
          size={18}
          className={`text-slate-500 dark:text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-orange-500' : 'group-hover:text-orange-500'}`}
        />
      </button>

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-multiselectable="true"
          aria-label={title}
          className="absolute top-[calc(100%+8px)] left-0 w-full min-w-0 sm:min-w-[320px] bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-xl shadow-2xl z-[100] overflow-hidden animate-fade-in flex flex-col max-h-[400px] ring-1 ring-black/5"
        >
          <div className="p-3 border-b border-[var(--border-subtle)] sticky top-0 bg-white dark:bg-[var(--bg-card-solid)] z-10">
            <div className="relative group">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="text"
                placeholder="Rechercher..."
                aria-label="Rechercher"
                className="w-full pl-10 pr-3 py-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] focus:bg-white dark:focus:bg-slate-800 focus:border-orange-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto p-2 custom-scrollbar flex-grow bg-white dark:bg-[var(--bg-card-solid)]">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(({ value, label }) => {
                const isSelected = selected.has(value);
                return (
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    key={value}
                    onClick={() => onSelectionChange(value)}
                    className={`w-full text-left flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all mb-1 border border-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/40
                    ${isSelected ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-100 dark:border-orange-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-[var(--text-secondary)] hover:border-slate-100 dark:hover:border-slate-700'}`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0
                      ${isSelected ? 'bg-orange-600 border-orange-600' : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}>
                      {isSelected && <Check size={12} className="text-white stroke-[3]" />}
                    </div>
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Aucun résultat trouvé</p>
              </div>
            )}
          </div>
          {selected.size > 0 && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-[var(--border-subtle)] flex justify-between items-center">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide ml-1">
                {selected.size} sélectionné(s)
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                Tout effacer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
