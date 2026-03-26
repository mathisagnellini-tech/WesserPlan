import React from 'react';
import { Lock, FileText, Car, CreditCard, PieChart, Check } from 'lucide-react';

interface SecurityTabProps {
    isUnlocked: boolean;
    onSecureAccess: (view: 'cni' | 'license' | 'badge' | 'score') => void;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({ isUnlocked, onSecureAccess }) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-5 bg-orange-50 rounded-[28px] border border-orange-100 flex gap-4">
                <div className="p-2 bg-white text-orange-500 rounded-xl h-fit shadow-sm"><Lock size={18} /></div>
                <div>
                    <h4 className="font-bold text-orange-900 text-sm mb-1">Zone Sécurisée</h4>
                    <p className="text-xs text-orange-800/70 leading-relaxed font-medium">
                        L'accès aux documents nécessite une authentification PIN manager.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {[
                    { id: 'cni', icon: FileText, label: 'Identité', color: 'text-orange-600', bg: 'bg-orange-50' },
                    { id: 'license', icon: Car, label: 'Permis', color: 'text-orange-600', bg: 'bg-orange-50' },
                    { id: 'badge', icon: CreditCard, label: 'Badge', color: 'text-purple-600', bg: 'bg-purple-50' },
                    { id: 'score', icon: PieChart, label: 'Scorecard', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onSecureAccess(item.id as any)}
                        className="bg-white dark:bg-[var(--bg-card-solid)] p-6 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 flex flex-col items-center gap-3 group active:scale-95"
                    >
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${item.bg} ${item.color} group-hover:scale-110 transition-transform shadow-sm`}>
                            <item.icon size={24} />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{item.label}</span>
                        {isUnlocked ? (
                            <div className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold flex items-center gap-1">
                                <Check size={10} /> Déverrouillé
                            </div>
                        ) : (
                            <Lock size={14} className="text-slate-300" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};
