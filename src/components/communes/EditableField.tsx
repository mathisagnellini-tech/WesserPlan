import React, { useEffect, useRef, useState } from 'react';
import { Save, Edit2 } from 'lucide-react';

export const EditableField: React.FC<{
    value: string;
    icon: React.ElementType;
    onSave: (val: string) => void;
    type?: string;
    label?: string;
}> = ({ value, icon: Icon, onSave, type = 'text', label }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);
    const isEditingRef = useRef(isEditing);
    isEditingRef.current = isEditing;

    // Only sync prop → tempValue when NOT editing — otherwise an unrelated
    // re-render (e.g. parent state change) would stomp the user's in-progress
    // input.
    useEffect(() => {
        if (!isEditingRef.current) setTempValue(value);
    }, [value]);

    const commit = () => {
        const trimmed = tempValue.trim();
        if (trimmed !== value) onSave(trimmed);
        setTempValue(trimmed);
        setIsEditing(false);
    };

    const cancel = () => {
        setTempValue(value);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-2 animate-fade-in w-full">
                <Icon size={16} className="text-[var(--text-muted)]" />
                <input
                    type={type}
                    aria-label={label ?? type}
                    className="flex-1 min-w-0 bg-white dark:bg-[var(--bg-card-solid)] border border-orange-300 dark:border-orange-500/40 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    autoFocus
                    onBlur={commit}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            commit();
                        }
                        if (e.key === 'Escape') {
                            e.preventDefault();
                            cancel();
                        }
                    }}
                />
                <button
                    type="button"
                    onClick={commit}
                    aria-label="Enregistrer"
                    className="p-1 bg-orange-100 dark:bg-orange-500/20 text-orange-600 rounded hover:bg-orange-200 dark:hover:bg-orange-500/30"
                >
                    <Save size={14} />
                </button>
            </div>
        );
    }

    const handleActivate = () => setIsEditing(true);

    return (
        <div
            role="button"
            tabIndex={0}
            aria-label={label ? `${label} — modifier` : 'Modifier'}
            onClick={handleActivate}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleActivate();
                }
            }}
            className="flex items-center justify-between group w-full cursor-pointer p-1 -ml-1 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 transition-colors"
        >
            <div className="flex items-center gap-2 min-w-0">
                <Icon size={16} className="text-[var(--text-muted)]" />
                <span className="text-[var(--text-primary)] font-medium truncate">{value || 'Non renseigné'}</span>
            </div>
            <Edit2 size={12} className="text-slate-300 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
};
