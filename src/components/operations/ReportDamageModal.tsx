import React, { useState } from 'react';
import { ShieldCheck, Camera, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import type { CarType } from './types';

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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10">
                <div className="p-6">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                        <ShieldCheck className="text-orange-500" /> État des lieux Digital
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-6">Véhicule : {car.brand} ({car.plate})</p>

                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-8 border-2 border-dashed border-[var(--border-subtle)] rounded-xl flex flex-col items-center justify-center text-[var(--text-muted)] hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors cursor-pointer group">
                                <Camera size={48} className="mb-2 group-hover:text-orange-500" />
                                <span className="font-bold text-sm">Prendre une photo du choc</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-1 block">Partie</label>
                                    <select
                                        className="w-full border border-[var(--border-subtle)] rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white dark:bg-[var(--bg-card-solid)]"
                                        value={part}
                                        onChange={e => setPart(e.target.value)}
                                    >
                                        {PART_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-1 block">Type</label>
                                    <select
                                        className="w-full border border-[var(--border-subtle)] rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white dark:bg-[var(--bg-card-solid)]"
                                        value={type}
                                        onChange={e => setType(e.target.value)}
                                    >
                                        {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-1 block">Description</label>
                                <textarea
                                    className="w-full border border-[var(--border-subtle)] rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none dark:bg-[var(--bg-card-solid)] dark:text-[var(--text-primary)]"
                                    rows={3}
                                    placeholder="Ex: Rayure 10cm sur le pare-choc arrière droit, suite à un choc parking…"
                                    value={detail}
                                    onChange={e => setDetail(e.target.value)}
                                ></textarea>
                            </div>
                            <button
                                onClick={() => setStep(2)}
                                disabled={!detail.trim()}
                                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                            >
                                Suivant
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="text-center py-6">
                            <CheckCircle2 size={64} className="text-green-500 mx-auto mb-4 animate-bounce" />
                            <h4 className="text-lg font-bold text-[var(--text-primary)]">Confirmer le signalement</h4>
                            <p className="text-sm text-[var(--text-secondary)] mb-2">{part} — {type}</p>
                            <p className="text-xs text-[var(--text-muted)] mb-6 px-4">{detail}</p>

                            {submitError && (
                                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-400 mb-4 text-left">
                                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                    <p className="text-xs font-medium">{submitError}</p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep(1)}
                                    disabled={isSubmitting}
                                    className="flex-1 px-6 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[var(--text-primary)] font-bold rounded-lg disabled:opacity-50"
                                >
                                    Retour
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isSubmitting}
                                    className="flex-1 px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 size={16} className="animate-spin" /> Envoi…</>
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
