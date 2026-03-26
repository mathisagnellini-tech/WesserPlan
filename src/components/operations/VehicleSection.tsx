import React from 'react';
import { Navigation, User, Gauge, Calendar, AlertTriangle, ShieldCheck, Camera } from 'lucide-react';
import type { CarType } from './types';

interface VehicleSectionProps {
    cars: CarType[];
    onReportDamage: (car: CarType) => void;
}

export const VehicleSection: React.FC<VehicleSectionProps> = ({ cars, onReportDamage }) => {
    return (
        <div className="animate-fade-in space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {cars.map(car => {
                    const hasDamages = car.damages && car.damages.length > 0;
                    return (
                        <div key={car.id} className="bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl border border-[var(--border-subtle)] shadow-sm overflow-hidden flex flex-col">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                                <div>
                                    <h3 className="font-bold text-lg text-[var(--text-primary)] flex items-center gap-2">
                                        {car.brand}
                                        <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-[var(--text-secondary)] text-xs rounded font-mono">{car.plate}</span>
                                    </h3>
                                    <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1 mt-1">
                                        <Navigation size={14} /> {car.where}
                                    </p>
                                </div>
                                <div className="text-right">
                                     <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Conducteur</p>
                                     <div className="flex items-center gap-1 justify-end font-semibold text-[var(--text-primary)]">
                                         <User size={14} /> {car.owner}
                                     </div>
                                </div>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow">
                                {/* Left: Stats */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-[var(--text-secondary)] font-medium"><Gauge size={18} /> Kilométrage</div>
                                        <span className="font-bold text-[var(--text-primary)]">{car.km.toLocaleString()} km</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                        <div className="bg-orange-500 h-full rounded-full" style={{ width: '65%' }}></div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center gap-2 text-[var(--text-secondary)] font-medium"><Calendar size={18} /> Entretien</div>
                                        <span className="font-bold text-[var(--text-primary)]">{car.service}</span>
                                    </div>

                                    {/* Damage Status */}
                                    <div className={`mt-4 p-3 rounded-xl border flex items-center gap-3 ${hasDamages ? 'bg-red-50 border-red-100 text-red-800' : 'bg-green-50 border-green-100 text-green-800'}`}>
                                        {hasDamages ? <AlertTriangle size={20}/> : <ShieldCheck size={20}/>}
                                        <div>
                                            <p className="text-xs font-bold uppercase">{hasDamages ? 'Sinistre Signalé' : 'État conforme'}</p>
                                            {hasDamages && <p className="text-xs opacity-80">{car.damages?.[0].description}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Actions */}
                                <div className="flex flex-col gap-3 justify-center">
                                    <button
                                        onClick={() => onReportDamage(car)}
                                        className="w-full py-3 bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Camera size={18}/> Déclarer Choc
                                    </button>
                                    <button className="w-full py-3 bg-white dark:bg-[var(--bg-card-solid)] text-[var(--text-secondary)] hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-[var(--border-subtle)] rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                                        <User size={18}/> Changer Conducteur
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
