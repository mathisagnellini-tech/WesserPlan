import React from 'react';
import { Calendar, Check, History } from 'lucide-react';
import { Person } from '../../types';

export const PlanningTab: React.FC<{ person: Person }> = ({ person }) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Next Availability Card */}
            <div className="bg-gradient-to-br from-orange-500 to-purple-600 p-6 rounded-[28px] shadow-lg text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                    <Calendar size={100} />
                </div>
                <div className="relative z-10">
                    <div className="text-orange-100 text-xs font-bold uppercase tracking-widest mb-1">Prochaine Disponibilité</div>
                    <div className="text-3xl font-black tracking-tight">{person.nextAvailability || "Inconnue"}</div>
                    <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold">
                        <Check size={12} /> Confirmé
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2 pl-2">
                    <History size={14} className="text-slate-400" /> Historique & Prévisions
                </h3>

                <div className="relative pl-4 space-y-0">
                    {/* Vertical Line */}
                    <div className="absolute left-[27px] top-2 bottom-4 w-0.5 bg-slate-100" />

                    {person.planningHistory?.map((week, idx) => {
                        const isCurrent = week.weekNumber === 3;

                        let statusColor = 'bg-slate-200';
                        let statusText = 'Repos';

                        if (week.status === 'worked') {
                            statusColor = 'bg-emerald-500';
                            statusText = `Mission : ${week.location}`;
                        } else if (week.status === 'planned') {
                            statusColor = 'bg-orange-500';
                            statusText = `Prévu : ${week.location || 'À définir'}`;
                        } else if (week.status === 'available') {
                            statusColor = 'bg-orange-400';
                            statusText = 'Disponible';
                        }

                        return (
                            <div key={idx} className="relative flex gap-4 pb-6 last:pb-0 group">
                                {/* Dot */}
                                <div className={`
                                    relative z-10 w-6 h-6 rounded-full border-4 border-white shadow-sm flex-shrink-0
                                    ${statusColor}
                                `} />

                                {/* Content */}
                                <div className={`
                                    flex-1 p-4 rounded-2xl border transition-all
                                    ${isCurrent ? 'bg-white dark:bg-[var(--bg-card-solid)] border-slate-200 dark:border-slate-700 shadow-md scale-[1.02]' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 opacity-80 hover:opacity-100'}
                                `}>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-xs font-bold uppercase tracking-wide ${isCurrent ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                                            {week.label}
                                        </span>
                                        {isCurrent && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">En cours</span>}
                                    </div>
                                    <div className="text-xs text-slate-400 font-medium mb-2">{week.dateRange}</div>
                                    <div className="flex items-center gap-2 font-bold text-slate-700 text-sm">
                                        {statusText}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};
