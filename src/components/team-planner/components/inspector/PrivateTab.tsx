import React from 'react';
import { EyeOff, Eye, MessageSquare } from 'lucide-react';
import { Person } from '../../types';

interface PrivateTabProps {
    person: Person;
    isUnlocked: boolean;
    onRequestUnlock: () => void;
}

export const PrivateTab: React.FC<PrivateTabProps> = ({ person, isUnlocked, onRequestUnlock }) => {
    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!isUnlocked ? (
                <div className="flex flex-col items-center justify-center p-9 bg-slate-900 rounded-2xl text-center shadow-lg">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-5 backdrop-blur-sm ring-1 ring-white/10">
                        <EyeOff size={24} className="text-white/60" strokeWidth={2.2} />
                    </div>
                    <h3 className="display text-white text-xl leading-tight mb-2">Contenu confidentiel</h3>
                    <p className="text-white/55 text-[13px] mb-6 max-w-[220px] leading-relaxed tracking-tight">
                        Les notes privées et l’historique des conversations sont masqués.
                    </p>
                    <button
                        onClick={onRequestUnlock}
                        className="px-6 py-2.5 bg-white text-slate-900 rounded-xl text-[13px] font-medium tracking-tight hover:bg-slate-100 active:translate-y-[1px] transition shadow-lg shadow-white/10"
                    >
                        Déverrouiller
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="eyebrow leading-none flex items-center gap-1.5">
                            <MessageSquare size={11} strokeWidth={2.4} className="text-slate-400" /> Notes &amp; échanges
                        </h3>
                        <div className="px-2 py-0.5 bg-emerald-50 ring-1 ring-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25 rounded-md text-[10px] font-medium flex items-center gap-1 tracking-tight">
                            <Eye size={9} strokeWidth={2.4} /> Visible
                        </div>
                    </div>

                    {person.privateNotes && person.privateNotes.length > 0 ? (
                        person.privateNotes.map((note) => (
                            <div key={note.id} className="bg-white dark:bg-[var(--bg-card-solid)] p-4 rounded-2xl border border-[var(--border-subtle)] shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_24px_-16px_rgba(15,23,42,0.06)] hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-2.5">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${
                                            note.type === 'incident' ? 'bg-red-500' :
                                            note.type === 'feedback' ? 'bg-orange-500' : 'bg-slate-300'
                                        }`} />
                                        <span className="eyebrow leading-none">{note.type}</span>
                                    </div>
                                    <span className="num text-[10px] font-medium text-slate-400 dark:text-slate-500 tracking-tight">{note.date}</span>
                                </div>
                                <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed mb-2.5 tracking-tight italic">
                                    « {note.content} »
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-tight">
                                        {note.author.charAt(0)}
                                    </div>
                                    <span className="text-[11px] text-slate-400 dark:text-slate-500 tracking-tight">Par {note.author}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-6 text-center border border-dashed border-[var(--border-subtle)] rounded-2xl text-slate-400 dark:text-slate-500 text-[13px] italic tracking-tight">
                            Aucune note privée enregistrée.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
