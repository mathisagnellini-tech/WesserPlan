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
        className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all duration-200 flex justify-between items-center group relative z-10 active:translate-y-[1px]
        ${
          disabled
            ? 'bg-slate-50 dark:bg-slate-800 border-[var(--border-subtle)] text-slate-400 dark:text-slate-500 cursor-not-allowed'
            : isOpen
              ? 'bg-white dark:bg-[var(--bg-card-solid)] border-orange-400 ring-2 ring-orange-500/15'
              : 'bg-white dark:bg-[var(--bg-card-solid)] border-[var(--border-subtle)] hover:border-orange-200 dark:hover:border-orange-500/30 text-[var(--text-primary)]'
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`p-2 rounded-lg ring-1 ${selected.size > 0 ? 'bg-orange-50 text-orange-600 ring-orange-100 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/25' : 'bg-slate-50 text-slate-500 ring-[var(--border-subtle)] dark:bg-slate-800 dark:text-slate-400'}`}>
            {icon}
          </div>
          <div className="flex flex-col leading-tight">
            <span className={`eyebrow leading-none ${selected.size > 0 ? '!text-orange-600 dark:!text-orange-300' : ''}`}>
              {selected.size > 0 ? 'Filtre actif' : 'Filtrer par'}
            </span>
            <span className={`text-[13px] font-medium tracking-tight truncate mt-1 ${selected.size > 0 ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
              {selectedLabel}
            </span>
          </div>
        </div>
        <Layers
          size={16}
          strokeWidth={2.2}
          className={`text-slate-400 dark:text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-orange-500' : 'group-hover:text-orange-500'}`}
        />
      </button>

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-multiselectable="true"
          aria-label={title}
          className="modal-shell absolute top-[calc(100%+8px)] left-0 w-full min-w-0 sm:min-w-[320px] z-[100] overflow-hidden animate-fade-in flex flex-col max-h-[420px]"
        >
          <div className="p-3 border-b border-[var(--border-subtle)] sticky top-0 bg-[var(--bg-card-solid)] z-10">
            <div className="relative group">
              <Search size={14} strokeWidth={2.2} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="text"
                placeholder="Rechercher…"
                aria-label="Rechercher"
                className="field-input !pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto p-2 custom-scrollbar flex-grow">
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
                    className={`w-full text-left flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition mb-1 border focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/40 active:translate-y-[1px]
                    ${isSelected
                      ? 'bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-200 border-orange-100 dark:border-orange-500/25'
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 text-[var(--text-secondary)]'}`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                      ${isSelected ? 'bg-orange-600 border-orange-600' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}>
                      {isSelected && <Check size={11} strokeWidth={3} className="text-white" />}
                    </div>
                    <span className="text-[13px] font-medium tracking-tight">{label}</span>
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center">
                <p className="text-[13px] text-slate-500 dark:text-slate-400 tracking-tight italic">Aucun résultat</p>
              </div>
            )}
          </div>
          {selected.size > 0 && (
            <div className="p-3 bg-slate-50/60 dark:bg-slate-800/40 border-t border-[var(--border-subtle)] flex justify-between items-center">
              <span className="num eyebrow leading-none ml-1">
                {selected.size} sélectionné{selected.size > 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="btn-ghost !text-[11px] !px-2.5 !py-1 hover:!text-red-600 hover:!bg-red-50 dark:hover:!bg-red-500/15"
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
