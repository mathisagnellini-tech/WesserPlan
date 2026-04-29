import React from 'react';
import { Target, Zap, X, List as ListIcon, MapPin } from 'lucide-react';
import { MOCK_ZONES } from './helpers';

interface SmartMatcherProps {
    smartZoneId: string;
    viewMode: 'list' | 'map';
    onZoneChange: (id: string) => void;
    onViewModeChange: (mode: 'list' | 'map') => void;
}

export const SmartMatcher: React.FC<SmartMatcherProps> = ({ smartZoneId, viewMode, onZoneChange, onViewModeChange }) => {
    return (
        <div className="bg-white dark:bg-[var(--bg-card-solid)] p-4 rounded-2xl border border-[var(--border-subtle)] shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-grow">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-1 block flex items-center gap-2">
                    <Target size={14} className="text-orange-500"/> Smart Matcher
                </label>
                <select
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-[var(--border-subtle)] text-[var(--text-primary)] font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                    value={smartZoneId}
                    onChange={(e) => onZoneChange(e.target.value)}
                >
                    <option value="">Sélectionner une Zone de Mission...</option>
                    {MOCK_ZONES.map(z => (
                        <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                </select>
            </div>
            {smartZoneId && (
                <div className="flex items-center gap-4 px-4 py-2 bg-orange-50 dark:bg-orange-900/30 rounded-xl border border-orange-100 dark:border-orange-500/20 text-sm text-orange-800 dark:text-orange-300 animate-fade-in">
                    <Zap size={20} className="text-yellow-500 fill-current"/>
                    <div>
                        <span className="font-bold block">Tri Intelligent Actif</span>
                        <span className="text-xs opacity-80">Optimisation distance & coût</span>
                    </div>
                    <button onClick={() => onZoneChange("")} className="bg-white dark:bg-[var(--bg-card-solid)] p-1 rounded-full hover:bg-orange-100 dark:hover:bg-orange-900/40 transition"><X size={14}/></button>
                </div>
            )}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-[var(--border-subtle)] h-fit">
                <button onClick={() => onViewModeChange('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-[var(--bg-card-solid)] text-orange-600 shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`} title="Liste"><ListIcon size={20}/></button>
                <button onClick={() => onViewModeChange('map')} className={`p-2 rounded-lg transition-colors ${viewMode === 'map' ? 'bg-white dark:bg-[var(--bg-card-solid)] text-orange-600 shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`} title="Carte"><MapPin size={20}/></button>
            </div>
        </div>
    );
};
