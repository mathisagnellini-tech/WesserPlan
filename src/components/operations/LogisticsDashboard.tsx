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

    const cornerIcon = (Icon: typeof Euro, tint = 'orange') => (
        <div
            className={`absolute top-3 right-3 h-8 w-8 rounded-xl flex items-center justify-center
                ${tint === 'orange'
                    ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-100 dark:bg-orange-500/15 dark:ring-orange-500/25'
                    : tint === 'amber'
                    ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-500/15 dark:ring-amber-500/25'
                    : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-600/40'}`}
        >
            <Icon size={15} strokeWidth={2.2} />
        </div>
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-3 mb-8">
            {/* Hero: Coût moyen / nuit — operational lever */}
            <div className="kpi-card kpi-card--hero relative">
                {cornerIcon(Euro)}
                <div className="relative z-10 flex flex-col h-full justify-between gap-2 pr-10">
                    <p className="eyebrow">Coût moyen par nuit</p>
                    <div className="flex items-end justify-between gap-3">
                        <p className="num display text-[var(--text-primary)] leading-none text-[44px] md:text-[56px]">
                            {avgCostPerNight}<span className="text-[28px] md:text-[34px] align-top ml-0.5">€</span>
                        </p>
                        <p className="eyebrow text-right text-[10px] leading-tight max-w-[10ch] -mb-0.5">
                            coût total / nuits cumulées
                        </p>
                    </div>
                </div>
            </div>

            <div className="kpi-card relative">
                {cornerIcon(Users)}
                <div className="relative z-10 flex flex-col h-full justify-between gap-2 pr-10">
                    <p className="eyebrow">Personnes hébergées</p>
                    <p className="num text-[var(--text-primary)] leading-none text-[26px] md:text-[30px] font-semibold tracking-tight">
                        {peopleHoused}
                    </p>
                    <p className="eyebrow text-[10px] -mt-1">
                        sur <span className="num">{housings.length}</span> logement{housings.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            <div className="kpi-card relative">
                {cornerIcon(Wallet)}
                <div className="relative z-10 flex flex-col h-full justify-between gap-2 pr-10">
                    <p className="eyebrow">Coût total</p>
                    <p className="num text-[var(--text-primary)] leading-none text-[26px] md:text-[30px] font-semibold tracking-tight">
                        {totalCost.toLocaleString('fr-FR')}<span className="text-[18px] ml-0.5">€</span>
                    </p>
                    <p className="eyebrow text-[10px] -mt-1">cumul logements affichés</p>
                </div>
            </div>

            <div className="kpi-card relative">
                {cornerIcon(carsWithRecentDamage === 0 ? ShieldCheck : AlertTriangle, carsWithRecentDamage === 0 ? 'slate' : 'amber')}
                <div className="relative z-10 flex flex-col h-full justify-between gap-2 pr-10">
                    <p className="eyebrow">Alertes flotte</p>
                    {carsWithRecentDamage === 0 ? (
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 tracking-tight">
                            Aucune alerte
                        </p>
                    ) : (
                        <p className="text-sm font-medium text-red-700 dark:text-red-400 tracking-tight">
                            <span className="num">{carsWithRecentDamage}</span> choc{carsWithRecentDamage > 1 ? 's' : ''} récent{carsWithRecentDamage > 1 ? 's' : ''} <span className="text-[var(--text-muted)]">· &lt; 30 j</span>
                        </p>
                    )}
                    <p className="eyebrow text-[10px] -mt-1">
                        <span className="num">{cars.length}</span> véhicule{cars.length !== 1 ? 's' : ''} suivi{cars.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>
        </div>
    );
};
