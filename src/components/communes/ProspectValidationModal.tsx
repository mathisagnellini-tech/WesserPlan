import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Send, AlertTriangle, X, List as ListIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { MapCommuneFeature } from '@/components/communes/types';
import type { Organization } from '@/types/commune';
import { useDialogA11y } from '@/hooks/useDialogA11y';
import { ORG_LIST, orgShortName } from '@/constants/organizations';

export const ProspectValidationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (org: Organization, zoneName: string) => void;
    communes: MapCommuneFeature[];
    stats: { count: number; pop: number; zones: string };
    isSubmitting?: boolean;
    submitError?: Error | null;
    submitSuccess?: { zoneName: string; count: number } | null;
    onDismissError?: () => void;
    onDismissSuccess?: () => void;
}> = ({ isOpen, onClose, onConfirm, communes, stats, isSubmitting, submitError, submitSuccess, onDismissError, onDismissSuccess }) => {
    const [selectedOrg, setSelectedOrg] = useState<Organization>('msf');
    const [zoneName, setZoneName] = useState('');
    const [nameError, setNameError] = useState<string | null>(null);

    const titleId = useId();
    const initialFocusRef = useRef<HTMLInputElement>(null);
    const { dialogRef } = useDialogA11y({ isOpen, onClose, initialFocusRef });

    // Clear inline name error as the user edits.
    useEffect(() => {
        if (nameError) setNameError(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [zoneName]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        const trimmed = zoneName.trim();
        if (!trimmed) {
            setNameError('Le nom de zone est obligatoire');
            return;
        }
        if (trimmed.length < 2) {
            setNameError('Le nom de zone doit contenir au moins 2 caractères');
            return;
        }
        setNameError(null);
        onConfirm(selectedOrg, trimmed);
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} aria-hidden="true" />
            <div
                ref={dialogRef}
                className="relative bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-fade-in overflow-hidden"
            >
                <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center">
                    <div>
                        <h2 id={titleId} className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
                            <Send className="text-orange-600" size={24} />
                            Validation de la Prospection
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)]">Récapitulatif de votre demande de zone</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fermer"
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                    {submitSuccess && (
                        <div role="status" className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
                            <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                            <div className="flex-1">
                                <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm uppercase mb-1">Zone créée</h4>
                                <p className="text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">
                                    Zone <b>"{submitSuccess.zoneName}"</b> créée. {submitSuccess.count} communes assignées.
                                </p>
                            </div>
                            {onDismissSuccess && (
                                <button type="button" onClick={onDismissSuccess} aria-label="Masquer le message" className="text-emerald-700 dark:text-emerald-300 hover:opacity-70"><X size={16} /></button>
                            )}
                        </div>
                    )}

                    {submitError && (
                        <div role="alert" className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                            <div className="flex-1">
                                <h4 className="font-bold text-red-800 dark:text-red-300 text-sm uppercase mb-1">Erreur lors de la création</h4>
                                <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed">
                                    {submitError.message || 'Erreur lors de la création de la zone. Réessayez.'}
                                </p>
                            </div>
                            {onDismissError && (
                                <button type="button" onClick={onDismissError} aria-label="Masquer le message" className="text-red-700 dark:text-red-300 hover:opacity-70"><X size={16} /></button>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-xl border border-orange-100 dark:border-orange-500/20 text-center">
                            <span className="block text-2xl font-black text-orange-700 dark:text-orange-400">{stats.count}</span>
                            <span className="text-xs font-bold text-orange-400 uppercase">Communes</span>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/30 p-4 rounded-xl border border-emerald-100 dark:border-emerald-500/20 text-center">
                            <span className="block text-2xl font-black text-emerald-700 dark:text-emerald-400">{(stats.pop / 1000).toFixed(1)}k</span>
                            <span className="text-xs font-bold text-emerald-400 uppercase">Habitants</span>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-xl border border-purple-100 dark:border-purple-500/20 text-center">
                            <span className="block text-2xl font-black text-purple-700 dark:text-purple-400">{stats.zones}</span>
                            <span className="text-xs font-bold text-purple-400 uppercase">Zones Estimées</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor={`${titleId}-zone`} className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1.5">Nom de la zone</label>
                            <input
                                id={`${titleId}-zone`}
                                ref={initialFocusRef}
                                type="text"
                                value={zoneName}
                                onChange={(e) => setZoneName(e.target.value)}
                                placeholder={`Zone ${communes[0]?.properties.nom ?? ''}`}
                                aria-invalid={!!nameError}
                                aria-describedby={nameError ? `${titleId}-zone-err` : undefined}
                                className={`w-full px-3 py-2.5 text-sm rounded-lg border bg-[var(--input-bg)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 ${
                                    nameError ? 'border-red-500 focus:ring-red-500/30' : 'border-[var(--border-subtle)] focus:ring-orange-500/30'
                                }`}
                            />
                            {nameError && (
                                <p id={`${titleId}-zone-err`} className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">{nameError}</p>
                            )}
                        </div>
                        <div>
                            <span className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1.5">Organisation</span>
                            <div className="flex gap-1.5 flex-wrap" role="radiogroup" aria-label="Organisation">
                                {ORG_LIST.map((org) => (
                                    <button
                                        type="button"
                                        key={org}
                                        role="radio"
                                        aria-checked={selectedOrg === org}
                                        onClick={() => setSelectedOrg(org)}
                                        className={`flex-1 min-w-[60px] py-2 rounded-lg text-xs font-bold uppercase transition-all border ${
                                            selectedOrg === org
                                                ? 'bg-orange-600 text-white border-orange-600'
                                                : 'bg-white dark:bg-[var(--bg-card-solid)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-orange-300'
                                        }`}
                                    >
                                        {orgShortName(org)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                        <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                        <div>
                            <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm uppercase mb-1">Actions automatiques</h4>
                            <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                                En validant : une <b>zone sera créée</b>, les communes seront <b>assignées à {orgShortName(selectedOrg)}</b>, et leur statut passera en <b>"En cours"</b>.
                            </p>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-[var(--text-primary)] mb-2 text-sm flex items-center gap-2">
                            <ListIcon size={16} /> Liste des communes ciblées
                        </h4>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-[var(--border-subtle)] max-h-48 overflow-y-auto p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {communes.map((c) => (
                                <div key={c.properties.code} className="bg-white dark:bg-[var(--bg-card-solid)] px-3 py-2 rounded-lg border border-[var(--border-subtle)] shadow-sm flex justify-between items-center text-xs">
                                    <span className="font-bold text-[var(--text-primary)]">{c.properties.nom}</span>
                                    <span className="text-[var(--text-muted)]">{c.properties.population.toLocaleString()} hab.</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-[var(--border-subtle)] flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-[var(--text-secondary)] hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-sm transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-orange-600 text-white hover:bg-orange-700 rounded-xl font-bold text-sm shadow-lg shadow-orange-200 dark:shadow-orange-900/50 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        {isSubmitting ? 'Création...' : 'Confirmer & Créer la Zone'}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};
