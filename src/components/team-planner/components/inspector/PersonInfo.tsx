import React from 'react';
import { Mail, Phone, TrendingDown, Star, ChevronRight, Activity } from 'lucide-react';
import { Person } from '../../types';

const LightTag: React.FC<{ label: string }> = ({ label }) => (
  <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-[var(--border-subtle)] tracking-tight">
    {label}
  </span>
);

export const PersonInfo: React.FC<{ person: Person }> = ({ person }) => {
    return (
        <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
                {person.tags.map(tag => <LightTag key={tag} label={tag} />)}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="kpi-card !p-5 relative">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg ring-1 ring-orange-100 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/25">
                                <TrendingDown size={13} strokeWidth={2.2} />
                            </div>
                            <span className="eyebrow leading-none">Performance</span>
                        </div>
                        <div className="num display text-slate-900 dark:text-white text-[28px] leading-none tracking-tight">
                            {person.drRate}
                        </div>
                    </div>
                </div>
                <div className="kpi-card !p-5 relative">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg ring-1 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/25">
                                <Star size={13} strokeWidth={2.2} />
                            </div>
                            <span className="eyebrow leading-none">Qualité</span>
                        </div>
                        <div className="num display text-slate-900 dark:text-white text-[28px] leading-none tracking-tight">
                            {person.qualityScore}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bio */}
            <div>
                <h3 className="eyebrow leading-none mb-2.5 flex items-center gap-1.5 pl-1">
                    <Activity size={11} strokeWidth={2.4} className="text-slate-400" /> Bio
                </h3>
                <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-400 bg-white dark:bg-[var(--bg-card-solid)] p-5 rounded-2xl border border-[var(--border-subtle)] shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_24px_-16px_rgba(15,23,42,0.06)] tracking-tight">
                    {person.bio || 'Aucune information disponible.'}
                </p>
            </div>

            {/* Actions */}
            <div className="space-y-2">
                <button className="w-full bg-white dark:bg-[var(--bg-card-solid)] p-4 rounded-2xl border border-[var(--border-subtle)] shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_24px_-16px_rgba(15,23,42,0.06)] hover:border-orange-200 dark:hover:border-orange-500/30 transition flex items-center justify-between group active:translate-y-[1px]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 ring-1 ring-[var(--border-subtle)] flex items-center justify-center text-slate-500 group-hover:bg-orange-50 group-hover:text-orange-600 group-hover:ring-orange-100 dark:group-hover:bg-orange-500/15 dark:group-hover:text-orange-300 dark:group-hover:ring-orange-500/25 transition-colors">
                            <Mail size={15} strokeWidth={2.2} />
                        </div>
                        <div className="text-left">
                            <div className="eyebrow leading-none">Email</div>
                            <div className="text-[13px] font-medium text-slate-900 dark:text-white tracking-tight mt-0.5">{person.email}</div>
                        </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-orange-500" strokeWidth={2.2} />
                </button>
                <button className="w-full bg-white dark:bg-[var(--bg-card-solid)] p-4 rounded-2xl border border-[var(--border-subtle)] shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_24px_-16px_rgba(15,23,42,0.06)] hover:border-emerald-200 dark:hover:border-emerald-500/30 transition flex items-center justify-between group active:translate-y-[1px]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 ring-1 ring-[var(--border-subtle)] flex items-center justify-center text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:ring-emerald-100 dark:group-hover:bg-emerald-500/15 dark:group-hover:text-emerald-300 dark:group-hover:ring-emerald-500/25 transition-colors">
                            <Phone size={15} strokeWidth={2.2} />
                        </div>
                        <div className="text-left">
                            <div className="eyebrow leading-none">Téléphone</div>
                            <div className="num text-[13px] font-medium text-slate-900 dark:text-white tracking-tight mt-0.5">{person.phone}</div>
                        </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-emerald-500" strokeWidth={2.2} />
                </button>
            </div>
        </div>
    );
};
