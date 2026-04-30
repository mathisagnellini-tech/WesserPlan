import React from 'react';
import { AlertTriangle, ShieldCheck, Camera, History } from 'lucide-react';
import type { CarType } from './types';

interface VehicleSectionProps {
    cars: CarType[];
    onReportDamage: (car: CarType) => void;
}

// Stripped-down vehicle card: only renders plate + brand + damages today.
// plan.vehicles also carries owner / km / next_service / fuel_declared /
// tank_size / lat / lng — surface them here when the design needs them.
export const VehicleSection: React.FC<VehicleSectionProps> = ({ cars, onReportDamage }) => {
    return (
        <div className="animate-fade-in space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {cars.map(car => {
                    const damages = car.damages ?? [];
                    const hasDamages = damages.length > 0;
                    const latestDamage = hasDamages ? damages[0] : null;
                    return (
                        <div key={car.id} className="bg-white dark:bg-[var(--bg-card-solid)] rounded-[20px] border border-[var(--border-subtle)] shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_24px_-16px_rgba(15,23,42,0.08)] overflow-hidden flex flex-col">
                            {/* Header: plate + brand only (the two real fields) */}
                            <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                                <div>
                                    <h3 className="font-medium text-[17px] text-[var(--text-primary)] tracking-tight flex items-center gap-2">
                                        {car.brand || 'Véhicule'}
                                        <span
                                            className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700/60 text-[var(--text-secondary)] text-[11px] rounded-md tracking-wider"
                                            style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace' }}
                                        >
                                            {car.plate}
                                        </span>
                                    </h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-[11px] font-medium text-[var(--text-muted)] tracking-tight">Sinistres</p>
                                    <p
                                        className="text-[17px] font-semibold text-[var(--text-primary)] tracking-tight leading-none mt-0.5"
                                        style={{ fontVariantNumeric: 'tabular-nums' }}
                                    >
                                        {damages.length}
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                                {/* Left: Damage status + recent history */}
                                <div className="space-y-4">
                                    <div className={`p-3 rounded-xl border flex items-center gap-3 ${hasDamages ? 'bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-500/20 text-red-700 dark:text-red-300' : 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300'}`}>
                                        {hasDamages ? <AlertTriangle size={18} strokeWidth={2.2}/> : <ShieldCheck size={18} strokeWidth={2.2}/>}
                                        <div>
                                            <p className="text-[13px] font-medium tracking-tight">{hasDamages ? 'Sinistre signalé' : 'État conforme'}</p>
                                            {latestDamage && <p className="text-[11px] opacity-80 mt-0.5">{latestDamage.description}</p>}
                                        </div>
                                    </div>

                                    {hasDamages && (
                                        <div>
                                            <h4 className="text-[11px] font-medium text-[var(--text-muted)] tracking-tight mb-2 flex items-center gap-1.5">
                                                <History size={11} strokeWidth={2.4}/> Historique
                                            </h4>
                                            <ul className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                                {damages.slice(0, 5).map((d, idx) => (
                                                    <li key={idx} className="text-[12px] text-[var(--text-secondary)] flex justify-between gap-2">
                                                        <span className="truncate">{d.description}</span>
                                                        <span
                                                            className="text-[var(--text-muted)] flex-shrink-0"
                                                            style={{ fontVariantNumeric: 'tabular-nums' }}
                                                        >
                                                            {new Date(d.date).toLocaleDateString('fr-FR')}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Right: Actions (only the action backed by a real endpoint) */}
                                <div className="flex flex-col gap-3 justify-center">
                                    <button
                                        onClick={() => onReportDamage(car)}
                                        className="w-full py-3 bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-500/22 border border-orange-200 dark:border-orange-500/25 rounded-xl font-medium text-[13px] tracking-tight flex items-center justify-center gap-2 active:translate-y-[1px] transition focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
                                    >
                                        <Camera size={16} strokeWidth={2.2}/> Reporter un dégât
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
