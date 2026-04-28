import React from 'react';
import { AlertTriangle, ShieldCheck, Camera, History } from 'lucide-react';
import type { CarType } from './types';

interface VehicleSectionProps {
    cars: CarType[];
    onReportDamage: (car: CarType) => void;
}

// Stripped-down vehicle card: only renders fields that exist in the cars schema.
// Removed (no backing column / always empty):
//   - "Conducteur" / car.owner   — no driver column on cars.vehicles
//   - "Kilométrage" / car.km     — no odometer column populated
//   - "Prochaine révision" / car.service — no service-date column
//   - Maintenance progress bar   — fabricated 65% width with no metric
//   - "Changer Conducteur" button — no driver column to update
// Re-add these once the schema gains the corresponding columns.
export const VehicleSection: React.FC<VehicleSectionProps> = ({ cars, onReportDamage }) => {
    return (
        <div className="animate-fade-in space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {cars.map(car => {
                    const damages = car.damages ?? [];
                    const hasDamages = damages.length > 0;
                    const latestDamage = hasDamages ? damages[0] : null;
                    return (
                        <div key={car.id} className="bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl border border-[var(--border-subtle)] shadow-sm overflow-hidden flex flex-col">
                            {/* Header: plate + brand only (the two real fields) */}
                            <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                                <div>
                                    <h3 className="font-bold text-lg text-[var(--text-primary)] flex items-center gap-2">
                                        {car.brand || 'Véhicule'}
                                        <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-[var(--text-primary)] text-xs rounded font-mono">{car.plate}</span>
                                    </h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Sinistres</p>
                                    <p className="font-semibold text-[var(--text-primary)]">{damages.length}</p>
                                </div>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow">
                                {/* Left: Damage status + recent history */}
                                <div className="space-y-4">
                                    <div className={`p-3 rounded-xl border flex items-center gap-3 ${hasDamages ? 'bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-500/20 text-red-800 dark:text-red-300' : 'bg-green-50 dark:bg-green-900/30 border-green-100 dark:border-green-500/20 text-green-800 dark:text-green-300'}`}>
                                        {hasDamages ? <AlertTriangle size={20}/> : <ShieldCheck size={20}/>}
                                        <div>
                                            <p className="text-xs font-bold uppercase">{hasDamages ? 'Sinistre signalé' : 'État conforme'}</p>
                                            {latestDamage && <p className="text-xs opacity-80">{latestDamage.description}</p>}
                                        </div>
                                    </div>

                                    {hasDamages && (
                                        <div>
                                            <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 flex items-center gap-1">
                                                <History size={12}/> Historique
                                            </h4>
                                            <ul className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                                {damages.slice(0, 5).map((d, idx) => (
                                                    <li key={idx} className="text-xs text-[var(--text-secondary)] flex justify-between gap-2">
                                                        <span className="truncate">{d.description}</span>
                                                        <span className="text-[var(--text-muted)] flex-shrink-0">{new Date(d.date).toLocaleDateString('fr-FR')}</span>
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
                                        className="w-full py-3 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50 border border-orange-200 dark:border-orange-500/20 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Camera size={18}/> Reporter dégât
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
