import React, { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Library } from 'lucide-react';
import { dataLibraryData } from '@/constants';
import { GoldenHourWidget, WeatherCorrelatorWidget, GenomeWidget, SeismographWidget } from '@/components/wplan/DataLabWidgets';
import { useDialogA11y } from '@/hooks/useDialogA11y';

interface DataLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDeptCode?: string | null;
}

const DataLibraryModal: React.FC<DataLibraryModalProps> = ({ isOpen, onClose, selectedDeptCode }) => {
    const titleId = useId();
    const closeRef = useRef<HTMLButtonElement>(null);
    const { dialogRef } = useDialogA11y({ isOpen, onClose, initialFocusRef: closeRef });

    if (!isOpen) return null;

    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="app-surface fixed inset-0 z-[200] animate-fade-in flex items-center justify-center p-4"
        >
            <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-md" onClick={onClose} aria-hidden="true" />
            <div ref={dialogRef} className="modal-shell relative w-full max-w-6xl h-[90vh] flex flex-col">
                <header className="modal-accent-strip flex justify-between items-center p-6 border-b border-[var(--border-subtle)] sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-orange-50 text-orange-600 ring-1 ring-orange-100 dark:bg-orange-500/15 dark:ring-orange-500/25">
                            <Library size={18} strokeWidth={2.2} />
                        </div>
                        <div>
                            <h3 id={titleId} className="display text-slate-900 dark:text-white text-2xl tracking-tight leading-none">
                                Data Lab
                            </h3>
                            <p className="eyebrow leading-none mt-1.5">
                                observatoire terrain &amp; intelligence augmentée
                            </p>
                        </div>
                    </div>
                    <button ref={closeRef} type="button" onClick={onClose} aria-label="Fermer" className="btn-ghost !p-2">
                        <X size={16} strokeWidth={2.2} />
                    </button>
                </header>

                <div className="overflow-y-auto custom-scrollbar p-7">
                    <div className="mb-10">
                        <h4 className="eyebrow leading-none mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            Insights temps réel
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <GoldenHourWidget />
                            <WeatherCorrelatorWidget deptCode={selectedDeptCode || undefined} />
                            <GenomeWidget />
                            <SeismographWidget />
                        </div>
                    </div>

                    <div className="mb-6">
                        <h4 className="eyebrow leading-none mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                            Catalogue de données
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {dataLibraryData.categories.map((category) => (
                                <div
                                    key={category.nom}
                                    className="bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl p-5 border border-[var(--border-subtle)] shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_24px_-16px_rgba(15,23,42,0.06)] hover:border-orange-200 dark:hover:border-orange-500/30 transition group"
                                >
                                    <h5 className="text-[13px] font-medium text-orange-700 dark:text-orange-300 tracking-tight mb-3 flex items-center justify-between">
                                        {category.nom}
                                        <span className="num eyebrow leading-none px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 border border-[var(--border-subtle)]">
                                            {category.items.length}
                                        </span>
                                    </h5>
                                    <div className="flex flex-wrap gap-1.5">
                                        {category.items.map((item) => (
                                            <span
                                                key={item}
                                                className="text-[11px] font-medium tracking-tight px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-[var(--border-subtle)] group-hover:border-orange-200 dark:group-hover:border-orange-500/30 transition cursor-default"
                                            >
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default DataLibraryModal;
