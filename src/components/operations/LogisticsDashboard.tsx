import React from 'react';
import { Euro, Bed, Wallet, AlertTriangle, TrendingDown, Calendar } from 'lucide-react';
import type { Housing, CarType } from './types';

export const LogisticsDashboard: React.FC<{ housings: Housing[], cars: CarType[] }> = ({ housings, cars }) => {
    const totalCost = housings.reduce((acc, h) => acc + h.cost, 0);
    const totalNights = housings.reduce((acc, h) => acc + h.nights, 0);
    const avgCostPerNight = totalNights > 0 ? (totalCost / totalNights).toFixed(0) : 0;

    // Occupancy (Mock: capacity used vs available)
    const totalCapacity = housings.reduce((acc, h) => acc + (h.people > 0 ? 8 : 0), 0); // Mock max capacity 8 per housing
    const usedCapacity = housings.reduce((acc, h) => acc + h.people, 0);
    const occupancyRate = totalCapacity > 0 ? Math.round((usedCapacity / totalCapacity) * 100) : 0;

    const budgetTotal = 5000;
    const budgetUsed = totalCost;
    const budgetPercent = Math.round((budgetUsed / budgetTotal) * 100);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl p-4 border border-[var(--border-subtle)] shadow-sm flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Euro size={48} />
                </div>
                <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Coût Moyen / Nuit</h4>
                <div className="flex items-end gap-2 mt-2">
                    <span className="text-3xl font-black text-[var(--text-primary)]">{avgCostPerNight}€</span>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded mb-1 flex items-center gap-1">
                        <TrendingDown size={10} /> -5%
                    </span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Objectif: &lt; 30€/pers/nuit</p>
            </div>

            <div className="bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl p-4 border border-[var(--border-subtle)] shadow-sm flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Bed size={48} />
                </div>
                <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Taux d'Occupation</h4>
                <div className="flex items-end gap-2 mt-2">
                    <span className="text-3xl font-black text-[var(--text-primary)]">{occupancyRate}%</span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded mb-1 ${occupancyRate < 70 ? 'text-red-600 bg-red-50' : 'text-orange-600 bg-orange-50'}`}>
                        {occupancyRate < 70 ? 'Sous-optimisé' : 'Optimal'}
                    </span>
                </div>
                 {/* Mini Bar */}
                 <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${occupancyRate}%` }}></div>
                </div>
            </div>

            <div className="bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl p-4 border border-[var(--border-subtle)] shadow-sm flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Wallet size={48} />
                </div>
                <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Budget Hebdo (S42)</h4>
                <div className="flex items-end gap-2 mt-2">
                    <span className="text-3xl font-black text-[var(--text-primary)]">{budgetUsed}€</span>
                    <span className="text-xs font-bold text-[var(--text-muted)] mb-1">/ {budgetTotal}€</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden relative">
                    <div className={`h-full rounded-full transition-all duration-500 ${budgetPercent > 90 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${budgetPercent}%` }}></div>
                </div>
                <p className={`text-[10px] mt-1 font-bold ${budgetPercent > 90 ? 'text-red-500' : 'text-emerald-600'}`}>
                    {budgetPercent > 90 ? 'Attention budget critique' : 'Budget maîtrisé'}
                </p>
            </div>

            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-sm flex flex-col justify-between relative overflow-hidden text-white">
                <div className="absolute right-0 top-0 p-3 opacity-20">
                    <AlertTriangle size={48} />
                </div>
                <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Alertes Flotte</h4>
                <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-orange-300">
                        <Calendar size={14}/>
                        <span>1 Véhicule en révision (J-5)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-red-300">
                        <AlertTriangle size={14}/>
                        <span>1 Choc signalé non réparé</span>
                    </div>
                </div>
                <button className="mt-auto text-xs font-bold text-center bg-white/10 hover:bg-white/20 py-2 rounded-lg transition-colors">
                    Voir Parc Auto
                </button>
            </div>
        </div>
    );
};
