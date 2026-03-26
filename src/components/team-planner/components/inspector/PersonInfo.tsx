import React from 'react';
import { Mail, Phone, TrendingDown, Star, ChevronRight, Activity } from 'lucide-react';
import { Person } from '../../types';

const LightTag: React.FC<{ label: string }> = ({ label }) => (
  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 tracking-wide shadow-sm">
    {label}
  </span>
);

export const PersonInfo: React.FC<{ person: Person }> = ({ person }) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Tags */}
            <div className="flex flex-wrap gap-2">
                {person.tags.map(tag => <LightTag key={tag} label={tag} />)}
            </div>

            {/* Stats Cards - Apple Widgets */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-white dark:bg-[var(--bg-card-solid)] rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <div className="p-1.5 bg-orange-50 text-orange-500 rounded-lg"><TrendingDown size={14} /></div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Perf.</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{person.drRate}</div>
                </div>
                <div className="p-5 bg-white dark:bg-[var(--bg-card-solid)] rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <div className="p-1.5 bg-amber-50 text-amber-500 rounded-lg"><Star size={14} /></div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Qualité</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{person.qualityScore}</div>
                </div>
            </div>

            {/* Bio Card */}
            <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-3 flex items-center gap-2 pl-2">
                    <Activity size={14} className="text-slate-400" /> Bio
                </h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 bg-white dark:bg-[var(--bg-card-solid)] p-6 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm">
                    {person.bio || "Aucune information disponible."}
                </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
                <button className="w-full bg-white dark:bg-[var(--bg-card-solid)] p-4 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between group active:scale-[0.98]">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
                            <Mail size={18} />
                        </div>
                        <div className="text-left">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Email</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">{person.email}</div>
                        </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-orange-500" />
                </button>
                <button className="w-full bg-white dark:bg-[var(--bg-card-solid)] p-4 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between group active:scale-[0.98]">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                            <Phone size={18} />
                        </div>
                        <div className="text-left">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Téléphone</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">{person.phone}</div>
                        </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500" />
                </button>
            </div>
        </div>
    );
};
