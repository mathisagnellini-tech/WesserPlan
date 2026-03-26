import React, { useState, useEffect } from 'react';
import { Save, Edit2 } from 'lucide-react';

export const EditableField: React.FC<{
    value: string;
    icon: React.ElementType;
    onSave: (val: string) => void;
    type?: string
}> = ({ value, icon: Icon, onSave, type = "text" }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);

    useEffect(() => { setTempValue(value); }, [value]);

    if (isEditing) {
        return (
            <div className="flex items-center gap-2 animate-fade-in w-full">
                <Icon size={16} className="text-[var(--text-muted)]"/>
                <input
                    type={type}
                    className="flex-1 min-w-0 bg-white dark:bg-[var(--bg-card-solid)] border border-orange-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') { onSave(tempValue); setIsEditing(false); }
                        if (e.key === 'Escape') { setTempValue(value); setIsEditing(false); }
                    }}
                />
                <button onClick={() => { onSave(tempValue); setIsEditing(false); }} className="p-1 bg-orange-100 text-orange-600 rounded hover:bg-orange-200"><Save size={14}/></button>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between group w-full cursor-pointer p-1 -ml-1 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors" onClick={() => setIsEditing(true)}>
             <div className="flex items-center gap-2 min-w-0">
                <Icon size={16} className="text-[var(--text-muted)]"/>
                <span className="text-[var(--text-primary)] font-medium truncate">{value || 'Non renseigné'}</span>
             </div>
             <Edit2 size={12} className="text-slate-300 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
};
