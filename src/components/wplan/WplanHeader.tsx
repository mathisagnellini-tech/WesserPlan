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
        <header className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 mb-5 md:mb-7">
            <div>
                <h2 className="display text-[var(--text-primary)] text-[34px] md:text-[40px] leading-none tracking-tight">
                    DataWiz
                </h2>
                <p className="eyebrow leading-none mt-2">analyse régionale &amp; départementale</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <div className="seg">
                    <button
                        onClick={() => onSetMapLevel('regions')}
                        data-active={mapLevel === 'regions' && !viewingRegion}
                    >
                        Régions
                    </button>
                    <button
                        onClick={() => onSetMapLevel('departments')}
                        data-active={mapLevel === 'departments' && !viewingRegion}
                    >
                        Départements
                    </button>
                </div>
                <button
                    onClick={onOpenDataLibrary}
                    className="btn-secondary !px-3 !py-2 !text-[12px]"
                >
                    <Library size={14} strokeWidth={2.2} /> Bibliothèque
                </button>
                {viewingRegion && (
                    <button
                        onClick={onBackToRegions}
                        className="btn-secondary !px-3 !py-2 !text-[12px]"
                    >
                        <ArrowLeft size={14} strokeWidth={2.2} /> Retour aux régions
                    </button>
                )}
                <button
                    onClick={onToggleCompare}
                    className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium tracking-tight rounded-xl transition active:translate-y-[1px] border ${
                        isComparing
                            ? 'bg-orange-600 text-white border-orange-600 shadow-[0_8px_20px_-10px_rgba(255,91,43,0.7)]'
                            : 'bg-white dark:bg-[var(--bg-card-solid)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-orange-200 dark:hover:border-orange-500/30 hover:text-orange-700 dark:hover:text-orange-300'
                    }`}
                >
                    <Shuffle size={14} strokeWidth={2.2} /> {isComparing ? 'Comparaison active' : 'Comparer'}
                </button>
            </div>
        </header>
    );
};

export default WplanHeader;
