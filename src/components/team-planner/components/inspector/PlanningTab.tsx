import React from 'react';
import { Calendar, Check, History } from 'lucide-react';
import { Person } from '../../types';

export const PlanningTab: React.FC<{ person: Person }> = ({ person }) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Next availability — single warm orange (replaces the orange→purple AI gradient) */}
            <div className="relative rounded-2xl p-6 overflow-hidden text-white shadow-[0_8px_24px_-12px_rgba(255,91,43,0.4)]"
                 style={{
                    background: 'linear-gradient(135deg, #FF5B2B 0%, #C2410C 100%)',
                 }}
            >
                <div className="absolute top-0 right-0 p-4 opacity-15 pointer-events-none">
                    <Calendar size={88} strokeWidth={2} />
                </div>
                <div className="relative z-10">
                    <div className="text-orange-100 text-[11px] font-medium tracking-tight mb-1.5">Prochaine disponibilité</div>
                    <div className="num display text-[32px] leading-none tracking-tight">
                        {person.nextAvailability || 'Inconnue'}
                    </div>
                    <div className="mt-4 inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-medium tracking-tight">
                        <Check size={11} strokeWidth={2.4} /> Confirmé
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div>
                <h3 className="eyebrow leading-none mb-3 flex items-center gap-1.5 pl-1">
                    <History size={11} strokeWidth={2.4} className="text-slate-400" /> Historique &amp; prévisions
                </h3>

                <div className="relative pl-3">
                    <div className="absolute left-[18px] top-2 bottom-4 w-px bg-slate-100 dark:bg-slate-700" />

                    {person.planningHistory?.map((week, idx) => {
                        const isCurrent = week.weekNumber === 3;

                        let dotColor = 'bg-slate-200 dark:bg-slate-600';
                        let statusText = 'Repos';

                        if (week.status === 'worked') {
                            dotColor = 'bg-emerald-500';
                            statusText = `Mission · ${week.location}`;
                        } else if (week.status === 'planned') {
                            dotColor = 'bg-orange-500';
                            statusText = `Prévu · ${week.location || 'à définir'}`;
                        } else if (week.status === 'available') {
                            dotColor = 'bg-orange-300 dark:bg-orange-400';
                            statusText = 'Disponible';
                        }

                        return (
                            <div key={idx} className="relative flex gap-3 pb-5 last:pb-0 group">
                                <div className={`relative z-10 w-5 h-5 rounded-full ring-4 ring-white dark:ring-slate-900 flex-shrink-0 ${dotColor}`} />
                                <div className={`flex-1 p-3.5 rounded-xl border transition tracking-tight ${
                                    isCurrent
                                        ? 'bg-white dark:bg-[var(--bg-card-solid)] border-[var(--border-subtle)] shadow-md'
                                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 opacity-90 hover:opacity-100'
                                }`}>
                                    <div className="flex justify-between items-start mb-0.5 gap-2">
                                        <span className={`num text-[12px] font-medium tracking-tight ${isCurrent ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {week.label}
                                        </span>
                                        {isCurrent && (
                                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25 text-[10px] font-medium rounded-md tracking-tight">
                                                en cours
                                            </span>
                                        )}
                                    </div>
                                    <div className="num text-[11px] text-slate-400 dark:text-slate-500 mb-1.5 tracking-tight">{week.dateRange}</div>
                                    <div className="text-[13px] font-medium text-slate-700 dark:text-slate-300 tracking-tight">
                                        {statusText}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
