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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!isUnlocked ? (
                <div className="flex flex-col items-center justify-center p-10 bg-slate-900 rounded-[32px] text-center shadow-lg">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm">
                        <EyeOff size={32} className="text-white/60" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Contenu Confidentiel</h3>
                    <p className="text-white/50 text-sm mb-8 max-w-[200px] leading-relaxed">
                        Les notes privées et l'historique des conversations sont masqués.
                    </p>
                    <button
                        onClick={onRequestUnlock}
                        className="px-8 py-3 bg-white text-slate-900 rounded-full font-bold text-sm hover:bg-slate-100 transition-colors shadow-lg shadow-white/10"
                    >
                        Déverrouiller
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2 mb-2">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                            <MessageSquare size={14} className="text-slate-400 dark:text-slate-500" /> Notes & Échanges
                        </h3>
                        <div className="px-2 py-1 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold flex items-center gap-1">
                            <Eye size={10} /> Visible
                        </div>
                    </div>

                    {person.privateNotes && person.privateNotes.length > 0 ? (
                        person.privateNotes.map((note) => (
                            <div key={note.id} className="bg-white dark:bg-[var(--bg-card-solid)] p-5 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${
                                            note.type === 'incident' ? 'bg-red-500' :
                                            note.type === 'feedback' ? 'bg-orange-500' : 'bg-slate-300'
                                        }`} />
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{note.type}</span>
                                    </div>
                                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{note.date}</span>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium mb-3">
                                    "{note.content}"
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                        {note.author.charAt(0)}
                                    </div>
                                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Par {note.author}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-[24px] text-slate-400 dark:text-slate-500 text-sm italic">
                            Aucune note privée enregistrée.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
