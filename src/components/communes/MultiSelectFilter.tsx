import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export const MultiSelectFilter: React.FC<{
    label: string;
    options: { value: string, label: string }[];
    selected: Set<string>;
    onChange: (newSet: Set<string>) => void;
}> = ({ label, options, selected, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const toggleOption = (val: string) => {
        const newSet = new Set(selected);
        if (newSet.has(val)) newSet.delete(val);
        else newSet.add(val);
        onChange(newSet);
    };

    const filteredOptions = options.filter(o => o.label.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="relative min-w-[140px]" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm border rounded-xl bg-white dark:bg-[var(--bg-card-solid)] transition-all
                ${selected.size > 0 ? 'border-orange-300 ring-1 ring-orange-100 text-orange-700' : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-orange-300'}`}
            >
                <div className="flex items-center gap-2 truncate">
                    <span className="font-bold truncate">
                        {selected.size === 0 ? label : `${selected.size} ${label}`}
                    </span>
                </div>
                <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`}/>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 max-h-64 flex flex-col bg-white dark:bg-[var(--bg-card-solid)] rounded-xl shadow-xl border border-[var(--border-subtle)] z-50 overflow-hidden">
                    <div className="p-2 border-b border-[var(--border-subtle)] sticky top-0 bg-white dark:bg-[var(--bg-card-solid)] z-10">
                        <input
                            type="text"
                            placeholder={`Chercher ${label}...`}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-[var(--border-subtle)] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-orange-400"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="overflow-y-auto p-1 custom-scrollbar">
                        {filteredOptions.length > 0 ? filteredOptions.map(opt => {
                            const isSelected = selected.has(opt.value);
                            return (
                                <div
                                    key={opt.value}
                                    onClick={() => toggleOption(opt.value)}
                                    className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer text-xs font-medium mb-0.5
                                    ${isSelected ? 'bg-orange-50 text-orange-700' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-[var(--text-primary)]'}`}
                                >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors
                                        ${isSelected ? 'bg-orange-600 border-orange-600' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-[var(--bg-card-solid)]'}`}>
                                        {isSelected && <Check size={10} className="text-white" strokeWidth={3}/>}
                                    </div>
                                    <span className="truncate">{opt.label}</span>
                                </div>
                            )
                        }) : (
                            <div className="p-4 text-center text-xs text-[var(--text-muted)]">Aucun résultat</div>
                        )}
                    </div>
                    {selected.size > 0 && (
                        <div className="p-2 border-t border-[var(--border-subtle)] bg-slate-50 dark:bg-slate-800/50">
                            <button
                                onClick={() => onChange(new Set())}
                                className="w-full py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                Réinitialiser
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
