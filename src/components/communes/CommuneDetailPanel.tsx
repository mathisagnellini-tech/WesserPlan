import React from 'react';
import { Commune } from '@/types';
import { departmentMap } from '@/constants';
import { Users, Euro, Clock, Info, Phone, Mail, History, Calendar, AlertTriangle, X } from 'lucide-react';
import { QuickStatusDropdown } from '@/components/communes/QuickStatusDropdown';
import { EditableField } from '@/components/communes/EditableField';
import { orgColor } from '@/constants/organizations';

interface CommuneDetailPanelProps {
    commune: Commune | null;
    onUpdateCommune: (id: number, updates: Partial<Commune>) => void;
    updateError?: Error | null;
    onDismissUpdateError?: () => void;
}

export const CommuneDetailPanel: React.FC<CommuneDetailPanelProps> = ({
    commune,
    onUpdateCommune,
    updateError,
    onDismissUpdateError,
}) => {
    if (!commune) {
        return (
            <div className="glass-card p-8 flex items-center justify-center text-[var(--text-muted)] font-medium">
                Sélectionnez une commune pour voir les détails
            </div>
        );
    }

    return (
        <div className="glass-card p-6 animate-fade-in flex flex-col gap-6 overflow-y-auto custom-scrollbar max-h-[50vh]">
            {updateError && (
                <div role="alert" className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/20 rounded-xl p-3 flex items-start gap-3">
                    <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                    <div className="flex-1">
                        <h4 className="font-bold text-red-800 dark:text-red-300 text-xs uppercase mb-0.5">Modification non enregistrée</h4>
                        <p className="text-xs text-red-800 dark:text-red-300">
                            {updateError.message || 'La sauvegarde a échoué. Réessayez.'}
                        </p>
                    </div>
                    {onDismissUpdateError && (
                        <button
                            type="button"
                            onClick={onDismissUpdateError}
                            aria-label="Masquer le message"
                            className="text-red-700 dark:text-red-300 hover:opacity-70"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            )}

            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-black text-[var(--text-primary)] mb-1">{commune.nom}</h2>
                    <p className="text-[var(--text-secondary)] font-medium text-lg">{departmentMap[commune.departement]} ({commune.departement})</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Statut Actuel</p>
                    <QuickStatusDropdown
                        currentStatus={commune.statut}
                        onSelect={(s) => onUpdateCommune(commune.id, { statut: s })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-[var(--border-subtle)] flex flex-col items-center">
                    <Users className="text-orange-500 mb-1" size={20} />
                    <span className="text-lg font-black text-[var(--text-primary)]">{commune.population.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Habitants</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-[var(--border-subtle)] flex flex-col items-center">
                    <Euro className="text-emerald-500 mb-1" size={20} />
                    <span className="text-lg font-black text-[var(--text-primary)]">{commune.revenue}</span>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Rev. Médian</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-[var(--border-subtle)] flex flex-col items-center">
                    <Clock className="text-purple-500 mb-1" size={20} />
                    <span className="text-lg font-black text-[var(--text-primary)]">{commune.passage}</span>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Dernier Passage</span>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Info size={16} /> Administration
                </h3>
                <div className="bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-xl p-4 space-y-3 shadow-sm">
                    <div>
                        <p className="text-xs text-[var(--text-muted)] font-bold uppercase">Maire Actuel</p>
                        <p className="text-base font-bold text-[var(--text-primary)]">{commune.maire}</p>
                    </div>
                    <div className="border-t border-[var(--border-subtle)] pt-3 space-y-2">
                        <EditableField
                            icon={Phone}
                            label="Téléphone"
                            value={commune.phone || ''}
                            onSave={(val) => onUpdateCommune(commune.id, { phone: val })}
                            type="tel"
                        />
                        <EditableField
                            icon={Mail}
                            label="Email"
                            value={commune.email || ''}
                            onSave={(val) => onUpdateCommune(commune.id, { email: val })}
                            type="email"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-2">
                <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <History size={16} /> Historique des Passages
                </h3>
                {commune.historiquePassages ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(commune.historiquePassages).map(([org, dates]: [string, string[]]) => (
                            <div key={org} className="bg-slate-50 dark:bg-slate-800/50 border border-[var(--border-subtle)] rounded-xl p-3 shadow-sm">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[var(--border-subtle)]">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: orgColor(org) }}
                                    />
                                    <span className="text-xs font-black uppercase text-[var(--text-primary)]">{org}</span>
                                </div>
                                <div className="space-y-1.5">
                                    {dates.map((date, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs text-[var(--text-secondary)] bg-white dark:bg-[var(--bg-card-solid)] px-2 py-1 rounded border border-[var(--border-subtle)]">
                                            <Calendar size={12} className="text-[var(--text-muted)]" />
                                            <span className="font-medium">{date}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-[var(--border-subtle)] text-[var(--text-muted)] text-sm italic">
                        Aucun historique de passage enregistré pour cette commune.
                    </div>
                )}
            </div>
        </div>
    );
};
