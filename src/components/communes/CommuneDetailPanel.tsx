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
            <div className="app-surface glass-card p-8 flex items-center justify-center text-[var(--text-muted)] text-[13px] tracking-tight">
                Sélectionnez une commune pour voir les détails
            </div>
        );
    }

    return (
        <div className="app-surface glass-card p-6 animate-fade-in flex flex-col gap-5 overflow-y-auto custom-scrollbar max-h-[50vh]">
            {updateError && (
                <div role="alert" className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/25 rounded-xl p-3 flex items-start gap-3">
                    <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} strokeWidth={2.2} />
                    <div className="flex-1">
                        <h4 className="text-[12px] font-medium text-red-800 dark:text-red-300 tracking-tight mb-0.5">Modification non enregistrée</h4>
                        <p className="text-[12px] text-red-800/85 dark:text-red-300/85 tracking-tight">
                            {updateError.message || 'La sauvegarde a échoué. Réessayez.'}
                        </p>
                    </div>
                    {onDismissUpdateError && (
                        <button
                            type="button"
                            onClick={onDismissUpdateError}
                            aria-label="Masquer le message"
                            className="text-red-700 dark:text-red-300 hover:opacity-70 active:translate-y-[1px]"
                        >
                            <X size={13} strokeWidth={2.2} />
                        </button>
                    )}
                </div>
            )}

            <div className="flex justify-between items-start gap-3">
                <div>
                    <h2 className="display text-[var(--text-primary)] text-[28px] tracking-tight leading-tight mb-1">{commune.nom}</h2>
                    <p className="text-[var(--text-secondary)] text-[13px] tracking-tight">
                        {departmentMap[commune.departement]} <span className="num text-[var(--text-muted)]">({commune.departement})</span>
                    </p>
                </div>
                <div className="text-right">
                    <p className="eyebrow leading-none mb-1.5">Statut actuel</p>
                    <QuickStatusDropdown
                        currentStatus={commune.statut}
                        onSelect={(s) => onUpdateCommune(commune.id, { statut: s })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="kpi-card !p-4 relative">
                    <div className="relative z-10 flex flex-col items-start gap-2">
                        <Users className="text-orange-500" size={15} strokeWidth={2.2} />
                        <span className="num display text-[var(--text-primary)] text-[22px] leading-none tracking-tight">{commune.population.toLocaleString('fr-FR')}</span>
                        <span className="eyebrow leading-none">habitants</span>
                    </div>
                </div>
                <div className="kpi-card !p-4 relative">
                    <div className="relative z-10 flex flex-col items-start gap-2">
                        <Euro className="text-emerald-500" size={15} strokeWidth={2.2} />
                        <span className="num display text-[var(--text-primary)] text-[22px] leading-none tracking-tight">{commune.revenue}</span>
                        <span className="eyebrow leading-none">rev. médian</span>
                    </div>
                </div>
                <div className="kpi-card !p-4 relative">
                    <div className="relative z-10 flex flex-col items-start gap-2">
                        <Clock className="text-orange-500" size={15} strokeWidth={2.2} />
                        <span className="num display text-[var(--text-primary)] text-[22px] leading-none tracking-tight">{commune.passage}</span>
                        <span className="eyebrow leading-none">dernier passage</span>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="eyebrow leading-none mb-3 flex items-center gap-1.5">
                    <Info size={11} strokeWidth={2.4} className="text-orange-500" /> Administration
                </h3>
                <div className="bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-xl p-4 space-y-3 shadow-sm">
                    <div>
                        <p className="eyebrow leading-none">Maire actuel</p>
                        <p className="text-[14px] font-medium text-[var(--text-primary)] tracking-tight mt-1">{commune.maire}</p>
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

            <div className="pt-1">
                <h3 className="eyebrow leading-none mb-3 flex items-center gap-1.5">
                    <History size={11} strokeWidth={2.4} className="text-orange-500" /> Historique des passages
                </h3>
                {commune.historiquePassages ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(commune.historiquePassages).map(([org, dates]: [string, string[]]) => (
                            <div key={org} className="bg-slate-50/60 dark:bg-slate-800/40 border border-[var(--border-subtle)] rounded-xl p-3 shadow-sm">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[var(--border-subtle)]">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: orgColor(org) }}
                                    />
                                    <span className="text-[11px] font-medium tracking-tight text-[var(--text-primary)]">{org}</span>
                                </div>
                                <div className="space-y-1.5">
                                    {dates.map((date, idx) => (
                                        <div key={idx} className="num flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)] bg-white dark:bg-[var(--bg-card-solid)] px-2 py-1 rounded-md border border-[var(--border-subtle)] tracking-tight">
                                            <Calendar size={11} strokeWidth={2.2} className="text-[var(--text-muted)]" />
                                            <span className="font-medium">{date}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-5 bg-slate-50/60 dark:bg-slate-800/40 rounded-xl border border-dashed border-[var(--border-subtle)] text-[var(--text-muted)] text-[12px] italic tracking-tight">
                        Aucun historique de passage enregistré pour cette commune.
                    </div>
                )}
            </div>
        </div>
    );
};
