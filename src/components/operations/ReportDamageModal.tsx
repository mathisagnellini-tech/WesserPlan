import React, { useState } from 'react';
import { ShieldCheck, Camera, CheckCircle2 } from 'lucide-react';
import type { CarType } from './types';

export const ReportDamageModal: React.FC<{ car: CarType, onClose: () => void, onReport: (desc: string) => void }> = ({ car, onClose, onReport }) => {
    const [step, setStep] = useState(1);
    const [desc, setDesc] = useState("");

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10">
                <div className="p-6">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                        <ShieldCheck className="text-orange-500"/> État des lieux Digital
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-6">Véhicule : {car.brand} ({car.plate})</p>

                    {step === 1 && (
                        <div className="space-y-4">
                             <div className="bg-slate-50 dark:bg-slate-800/50 p-8 border-2 border-dashed border-[var(--border-subtle)] rounded-xl flex flex-col items-center justify-center text-[var(--text-muted)] hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors cursor-pointer group">
                                 <Camera size={48} className="mb-2 group-hover:text-orange-500"/>
                                 <span className="font-bold text-sm">Prendre une photo du choc</span>
                             </div>
                             <div>
                                 <label className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-1 block">Description</label>
                                 <textarea
                                    className="w-full border border-[var(--border-subtle)] rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none dark:bg-[var(--bg-card-solid)] dark:text-[var(--text-primary)]"
                                    rows={3}
                                    placeholder="Ex: Rayure pare-choc arrière droit..."
                                    value={desc}
                                    onChange={e => setDesc(e.target.value)}
                                 ></textarea>
                             </div>
                             <button
                                onClick={() => setStep(2)}
                                disabled={!desc}
                                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                             >
                                 Suivant
                             </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="text-center py-6">
                            <CheckCircle2 size={64} className="text-green-500 mx-auto mb-4 animate-bounce" />
                            <h4 className="text-lg font-bold text-[var(--text-primary)]">Signalement Enregistré</h4>
                            <p className="text-sm text-[var(--text-secondary)] mb-6">Le manager de flotte a été notifié.</p>
                            <button
                                onClick={() => { onReport(desc); onClose(); }}
                                className="px-6 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[var(--text-primary)] font-bold rounded-lg"
                            >
                                Fermer
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
