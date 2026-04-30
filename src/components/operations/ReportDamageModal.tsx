import React, { useId, useRef, useState } from 'react';
import { ShieldCheck, Camera, CheckCircle2, Loader2, AlertCircle, X } from 'lucide-react';
import type { CarType } from './types';
import { useDialogA11y } from '@/hooks/useDialogA11y';

type DamagePayload = { part: string; type: string; detail: string };

const PART_OPTIONS = [
    'Pare-choc avant',
    'Pare-choc arrière',
    'Aile avant',
    'Aile arrière',
    'Portière',
    'Capot',
    'Toit',
    'Pare-brise',
    'Vitre latérale',
    'Roue / Jante',
    'Rétroviseur',
    'Habitacle',
    'Autre',
];

const TYPE_OPTIONS = [
    'Rayure',
    'Bosse',
    'Choc',
    'Bris de glace',
    'Crevaison',
    'Tâche',
    'Casse',
    'Autre',
];

export const ReportDamageModal: React.FC<{
    car: CarType;
    onClose: () => void;
    onReport: (damage: DamagePayload) => Promise<void> | void;
}> = ({ car, onClose, onReport }) => {
    const [step, setStep] = useState<1 | 2>(1);
    const [part, setPart] = useState<string>(PART_OPTIONS[0]);
    const [type, setType] = useState<string>(TYPE_OPTIONS[0]);
    const [detail, setDetail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const titleId = useId();
    const closeRef = useRef<HTMLButtonElement>(null);
    const { dialogRef } = useDialogA11y({ isOpen: true, onClose, initialFocusRef: closeRef });

    const handleConfirm = async () => {
        setSubmitError(null);
        setIsSubmitting(true);
        try {
            await onReport({ part, type, detail: detail.trim() });
            onClose();
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement du sinistre');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="app-surface fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className="modal-shell relative w-full max-w-md outline-none"
            >
                {/* Header */}
                <div className="modal-accent-strip px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-orange-50 text-orange-600 ring-1 ring-orange-100 dark:bg-orange-500/15 dark:ring-orange-500/25 shrink-0">
                            <ShieldCheck size={16} strokeWidth={2.2} />
                        </div>
                        <div className="min-w-0">
                            <h3 id={titleId} className="display text-[var(--text-primary)] text-lg leading-none">
                                État des lieux
                            </h3>
                            <p className="num eyebrow mt-1 leading-none truncate">
                                {car.brand} · {car.plate}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="stepper">
                            <span className="dot" data-active={step === 1}></span>
                            <span className="dot" data-active={step === 2}></span>
                            <span className="num">{step}/2</span>
                        </div>
                        <button
                            ref={closeRef}
                            type="button"
                            onClick={onClose}
                            aria-label="Fermer"
                            className="btn-ghost !p-1.5"
                        >
                            <X size={15} strokeWidth={2.2} />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {step === 1 && (
                        <div className="space-y-4">
                            <button
                                type="button"
                                className="w-full px-4 py-6 border border-dashed border-[var(--border-subtle)] rounded-2xl flex flex-col items-center justify-center bg-slate-50/60 dark:bg-slate-800/40 hover:border-orange-300 hover:bg-orange-50/60 dark:hover:bg-orange-500/10 active:translate-y-[1px] transition cursor-pointer group"
                            >
                                <div className="h-10 w-10 rounded-xl bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] flex items-center justify-center mb-2 shadow-sm group-hover:border-orange-200">
                                    <Camera size={16} strokeWidth={2.2} className="text-orange-600" />
                                </div>
                                <span className="text-[13px] font-medium text-[var(--text-primary)] tracking-tight">
                                    Prendre une photo du choc
                                </span>
                                <span className="eyebrow mt-1">facultatif</span>
                            </button>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="field-label">Partie</label>
                                    <select
                                        className="field-input"
                                        value={part}
                                        onChange={e => setPart(e.target.value)}
                                    >
                                        {PART_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="field-label">Type</label>
                                    <select
                                        className="field-input"
                                        value={type}
                                        onChange={e => setType(e.target.value)}
                                    >
                                        {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="field-label">Description</label>
                                <textarea
                                    className="field-input"
                                    rows={3}
                                    placeholder="Ex : rayure 10 cm sur le pare-choc arrière droit, parking…"
                                    value={detail}
                                    onChange={e => setDetail(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="btn-secondary flex-1"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    disabled={!detail.trim()}
                                    className="btn-primary flex-1"
                                >
                                    Continuer
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="text-center py-2 animate-fade-in">
                            <div className="h-14 w-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-emerald-50 ring-1 ring-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:ring-emerald-500/25 dark:text-emerald-300">
                                <CheckCircle2 size={26} strokeWidth={2.2} />
                            </div>
                            <h4 className="display text-[var(--text-primary)] text-lg leading-tight">
                                Confirmer le signalement
                            </h4>
                            <p className="text-[13px] text-[var(--text-secondary)] tracking-tight mt-1">
                                <span className="font-medium text-[var(--text-primary)]">{part}</span>
                                <span className="text-[var(--text-muted)]"> · </span>
                                {type}
                            </p>
                            {detail && (
                                <p className="text-[12px] text-[var(--text-muted)] mt-3 px-2 italic leading-relaxed">
                                    « {detail} »
                                </p>
                            )}

                            {submitError && (
                                <div
                                    role="alert"
                                    className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/25 text-red-700 dark:text-red-300 mt-5 text-left"
                                >
                                    <AlertCircle size={14} strokeWidth={2.2} className="mt-0.5 flex-shrink-0" />
                                    <p className="text-xs font-medium tracking-tight">{submitError}</p>
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    disabled={isSubmitting}
                                    className="btn-secondary flex-1"
                                >
                                    Retour
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirm}
                                    disabled={isSubmitting}
                                    className="btn-primary flex-1"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 size={14} className="animate-spin" strokeWidth={2.2} /> Envoi…</>
                                    ) : (
                                        'Enregistrer'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
