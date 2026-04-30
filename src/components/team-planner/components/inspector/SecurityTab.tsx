import React from 'react';
import { Lock, FileText, Car, CreditCard, PieChart, Check } from 'lucide-react';

interface SecurityTabProps {
    isUnlocked: boolean;
    onSecureAccess: (view: 'cni' | 'license' | 'badge' | 'score') => void;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({ isUnlocked, onSecureAccess }) => {
    // Single warm accent palette — replaces the previous orange/orange/purple/emerald mix
    // (purple was an AI-fingerprint accent that clashed with the brand orange).
    const tiles = [
        { id: 'cni' as const, icon: FileText, label: 'Identité' },
        { id: 'license' as const, icon: Car, label: 'Permis' },
        { id: 'badge' as const, icon: CreditCard, label: 'Badge' },
        { id: 'score' as const, icon: PieChart, label: 'Scorecard' },
    ];

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-4 bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/25 flex gap-3 items-start">
                <div className="p-1.5 bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-300 rounded-lg ring-1 ring-orange-100 dark:ring-orange-500/25 h-fit">
                    <Lock size={14} strokeWidth={2.2} />
                </div>
                <div>
                    <h4 className="text-[13px] font-medium text-orange-900 dark:text-orange-200 tracking-tight mb-0.5">
                        Zone sécurisée
                    </h4>
                    <p className="text-[12px] text-orange-800/70 dark:text-orange-200/70 leading-relaxed tracking-tight">
                        L’accès aux documents est réservé aux managers authentifiés.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {tiles.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onSecureAccess(item.id)}
                        className="bg-white dark:bg-[var(--bg-card-solid)] p-5 rounded-2xl border border-[var(--border-subtle)] shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_24px_-16px_rgba(15,23,42,0.06)] hover:border-orange-200 dark:hover:border-orange-500/30 hover:shadow-md transition flex flex-col items-center gap-2.5 group active:translate-y-[1px]"
                    >
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-orange-50 text-orange-600 ring-1 ring-orange-100 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/25 group-hover:scale-105 transition-transform">
                            <item.icon size={18} strokeWidth={2.2} />
                        </div>
                        <span className="text-[13px] font-medium text-slate-900 dark:text-white tracking-tight">{item.label}</span>
                        {isUnlocked ? (
                            <div className="px-2 py-0.5 bg-emerald-50 ring-1 ring-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25 rounded-md text-[10px] font-medium flex items-center gap-1 tracking-tight">
                                <Check size={9} strokeWidth={2.4} /> Déverrouillé
                            </div>
                        ) : (
                            <Lock size={13} strokeWidth={2.2} className="text-slate-300 dark:text-slate-600" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};
