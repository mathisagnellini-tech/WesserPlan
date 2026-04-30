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
            className="app-surface fixed inset-0 z-[9999] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
        >
            <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm transition-opacity" onClick={onClose} aria-hidden="true" />
            <div
                ref={dialogRef}
                className="modal-shell relative w-full max-w-2xl flex flex-col max-h-[90vh] animate-fade-in"
            >
                <div className="modal-accent-strip px-6 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-orange-50 text-orange-600 ring-1 ring-orange-100 dark:bg-orange-500/15 dark:ring-orange-500/25">
                            <Send size={16} strokeWidth={2.2} />
                        </div>
                        <div className="min-w-0">
                            <h2 id={titleId} className="display text-[var(--text-primary)] text-xl tracking-tight leading-tight">
                                Validation de la prospection
                            </h2>
                            <p className="eyebrow leading-none mt-1">récapitulatif de votre demande de zone</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Fermer" className="btn-ghost !p-2 shrink-0">
                        <X size={16} strokeWidth={2.2} />
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

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="kpi-card !p-4 relative text-center">
                            <div className="relative z-10">
                                <span className="num display block text-orange-700 dark:text-orange-300 text-[24px] tracking-tight leading-none">{stats.count}</span>
                                <span className="eyebrow leading-none mt-2 block">communes</span>
                            </div>
                        </div>
                        <div className="kpi-card !p-4 relative text-center">
                            <div className="relative z-10">
                                <span className="num display block text-emerald-700 dark:text-emerald-300 text-[24px] tracking-tight leading-none">{(stats.pop / 1000).toFixed(1)}k</span>
                                <span className="eyebrow leading-none mt-2 block">habitants</span>
                            </div>
                        </div>
                        <div className="kpi-card !p-4 relative text-center">
                            <div className="relative z-10">
                                <span className="num display block text-orange-700 dark:text-orange-300 text-[24px] tracking-tight leading-none">{stats.zones}</span>
                                <span className="eyebrow leading-none mt-2 block">zones estimées</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor={`${titleId}-zone`} className="field-label">Nom de la zone</label>
                            <input
                                id={`${titleId}-zone`}
                                ref={initialFocusRef}
                                type="text"
                                value={zoneName}
                                onChange={(e) => setZoneName(e.target.value)}
                                placeholder={`Zone ${communes[0]?.properties.nom ?? ''}`}
                                aria-invalid={!!nameError}
                                aria-describedby={nameError ? `${titleId}-zone-err` : undefined}
                                className={`field-input ${nameError ? 'is-error' : ''}`}
                            />
                            {nameError && (
                                <p id={`${titleId}-zone-err`} className="field-error">{nameError}</p>
                            )}
                        </div>
                        <div>
                            <span className="field-label">Organisation</span>
                            <div className="flex gap-1.5 flex-wrap" role="radiogroup" aria-label="Organisation">
                                {ORG_LIST.map((org) => (
                                    <button
                                        type="button"
                                        key={org}
                                        role="radio"
                                        aria-checked={selectedOrg === org}
                                        onClick={() => setSelectedOrg(org)}
                                        className={`flex-1 min-w-[60px] py-2 rounded-lg text-[12px] font-medium tracking-tight transition active:translate-y-[1px] border ${
                                            selectedOrg === org
                                                ? 'bg-orange-600 text-white border-orange-600 shadow-[0_8px_20px_-10px_rgba(255,91,43,0.7)]'
                                                : 'bg-white dark:bg-[var(--bg-card-solid)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-orange-200 dark:hover:border-orange-500/30'
                                        }`}
                                    >
                                        {orgShortName(org)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/25 rounded-xl p-4 flex items-start gap-3">
                        <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} strokeWidth={2.2} />
                        <div>
                            <h4 className="text-[13px] font-medium text-amber-900 dark:text-amber-200 tracking-tight mb-1">Actions automatiques</h4>
                            <p className="text-[12px] text-amber-800/85 dark:text-amber-200/85 leading-relaxed tracking-tight">
                                En validant : une <b>zone sera créée</b>, les communes seront <b>assignées à {orgShortName(selectedOrg)}</b>, et leur statut passera en <b>« En cours »</b>.
                            </p>
                        </div>
                    </div>

                    <div>
                        <h4 className="eyebrow leading-none mb-2 flex items-center gap-1.5">
                            <ListIcon size={11} strokeWidth={2.4} className="text-orange-500" /> Communes ciblées
                        </h4>
                        <div className="bg-slate-50/60 dark:bg-slate-800/40 rounded-xl border border-[var(--border-subtle)] max-h-48 overflow-y-auto p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {communes.map((c) => (
                                <div key={c.properties.code} className="bg-white dark:bg-[var(--bg-card-solid)] px-2.5 py-1.5 rounded-md border border-[var(--border-subtle)] shadow-sm flex justify-between items-center text-[12px] tracking-tight">
                                    <span className="font-medium text-[var(--text-primary)]">{c.properties.nom}</span>
                                    <span className="num text-[var(--text-muted)]">{c.properties.population.toLocaleString('fr-FR')} hab.</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-50/60 dark:bg-slate-800/40 border-t border-[var(--border-subtle)] flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
                    <button type="button" onClick={handleConfirm} disabled={isSubmitting} className="btn-primary">
                        {isSubmitting ? <Loader2 size={14} className="animate-spin" strokeWidth={2.2} /> : <Send size={14} strokeWidth={2.2} />}
                        {isSubmitting ? 'Création…' : 'Confirmer &amp; créer la zone'}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};
