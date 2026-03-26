import React from 'react';
import { ArrowLeft, Library, Shuffle } from 'lucide-react';

interface WplanHeaderProps {
    mapLevel: 'regions' | 'departments';
    viewingRegion: any | null;
    isComparing: boolean;
    onSetMapLevel: (level: 'regions' | 'departments') => void;
    onOpenDataLibrary: () => void;
    onBackToRegions: () => void;
    onToggleCompare: () => void;
}

const WplanHeader: React.FC<WplanHeaderProps> = ({
    mapLevel,
    viewingRegion,
    isComparing,
    onSetMapLevel,
    onOpenDataLibrary,
    onBackToRegions,
    onToggleCompare,
}) => {
    return (
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4 md:mb-6">
            <h2 className="text-2xl md:text-3xl font-extrabold text-text-primary">DataWiz</h2>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <div className="inline-flex gap-1 p-1 rounded-lg bg-gray-200 dark:bg-slate-800">
                    <button
                        onClick={() => onSetMapLevel('regions')}
                        className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${mapLevel === 'regions' && !viewingRegion ? 'bg-white dark:bg-[var(--bg-card-solid)] shadow-sm' : 'text-text-secondary hover:bg-gray-300/50 dark:hover:bg-slate-700/50'}`}
                    >
                        Régions
                    </button>
                    <button
                        onClick={() => onSetMapLevel('departments')}
                        className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${mapLevel === 'departments' && !viewingRegion ? 'bg-white dark:bg-[var(--bg-card-solid)] shadow-sm' : 'text-text-secondary hover:bg-gray-300/50 dark:hover:bg-slate-700/50'}`}
                    >
                        Départements
                    </button>
                </div>
                <button
                    onClick={onOpenDataLibrary}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-white dark:bg-[var(--bg-card-solid)] rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors shadow-sm border border-border-color"
                >
                    <Library size={16} /> Bibliothèque
                </button>
                {viewingRegion && (
                    <button
                        onClick={onBackToRegions}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-gray-200 dark:bg-slate-800 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors"
                    >
                        <ArrowLeft size={16} /> Retour aux régions
                    </button>
                )}
                <button
                    onClick={onToggleCompare}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${isComparing ? 'bg-orange-500 text-white shadow-md' : 'bg-white dark:bg-[var(--bg-card-solid)] hover:bg-gray-50 dark:hover:bg-slate-800/50 border border-border-color'}`}
                >
                    <Shuffle size={16} /> {isComparing ? 'Mode Comparaison' : 'Comparer'}
                </button>
            </div>
        </header>
    );
};

export default WplanHeader;
