import React from 'react';
import { Euro, Users, Wallet, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { Housing, CarType } from './types';

export const LogisticsDashboard: React.FC<{ housings: Housing[], cars: CarType[] }> = ({ housings, cars }) => {
    const totalCost = housings.reduce((acc, h) => acc + h.cost, 0);
    const totalNights = housings.reduce((acc, h) => acc + h.nights, 0);
    const avgCostPerNight = totalNights > 0 ? (totalCost / totalNights).toFixed(0) : '0';

    // Personnes hébergées: real sum of people across housings.
    // Removed the previous "Taux d'Occupation" ratio which assumed a fake
    // capacity of 8 per housing (no capacity column exists in the schema).
    const peopleHoused = housings.reduce((acc, h) => acc + h.people, 0);

    // Fleet alerts derived from real `cars` data only.
    // Note: cars schema has no `next_service` column — service-due alerts
    // cannot be computed and were removed (previously hardcoded "J-5").
    // Recent damages = any damage recorded within the last 30 days.
    const now = Date.now();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const carsWithRecentDamage = cars.filter(c =>
        (c.damages ?? []).some(d => {
            const t = new Date(d.date).getTime();
            return !isNaN(t) && (now - t) < THIRTY_DAYS_MS;
        })
    ).length;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl p-4 border border-[var(--border-subtle)] shadow-sm flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Euro size={48} />
                </div>
                <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Coût Moyen / Nuit</h4>
                <div className="flex items-end gap-2 mt-2">
                    <span className="text-3xl font-black text-[var(--text-primary)]">{avgCostPerNight}€</span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Coût total / nuits cumulées</p>
            </div>

            <div className="bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl p-4 border border-[var(--border-subtle)] shadow-sm flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Users size={48} />
                </div>
                <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Personnes Hébergées</h4>
                <div className="flex items-end gap-2 mt-2">
                    <span className="text-3xl font-black text-[var(--text-primary)]">{peopleHoused}</span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">{housings.length} logement(s)</p>
            </div>

            <div className="bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl p-4 border border-[var(--border-subtle)] shadow-sm flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Wallet size={48} />
                </div>
                <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Coût Total</h4>
                <div className="flex items-end gap-2 mt-2">
                    <span className="text-3xl font-black text-[var(--text-primary)]">{totalCost.toLocaleString('fr-FR')}€</span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Cumul logements affichés</p>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between relative overflow-hidden text-slate-900 dark:text-white">
                <div className="absolute right-0 top-0 p-3 opacity-20">
                    <AlertTriangle size={48} />
                </div>
                <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Alertes Flotte</h4>
                <div className="mt-2 space-y-2">
                    {carsWithRecentDamage === 0 ? (
                        <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-300">
                            <ShieldCheck size={14}/>
                            <span>Aucune alerte</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-300">
                            <AlertTriangle size={14}/>
                            <span>{carsWithRecentDamage} choc{carsWithRecentDamage > 1 ? 's' : ''} récent{carsWithRecentDamage > 1 ? 's' : ''} (&lt; 30j)</span>
                        </div>
                    )}
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-2">{cars.length} véhicule(s) suivi(s)</p>
            </div>
        </div>
    );
};
