import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Home, Ban, CheckCircle2, Plus, X } from 'lucide-react';
import { activityService, type ActivityItem } from '@/services/activityService';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

// Add Event Modal
const AddEventModal: React.FC<{ isOpen: boolean; onClose: () => void; onAdd: (e: ActivityItem) => void | Promise<void> }> = ({ isOpen, onClose, onAdd }) => {
    const [type, setType] = useState('housing');
    const [text, setText] = useState('');
    const [time, setTime] = useState('09:00');
    const [dateMode, setDateMode] = useState('today');
    const [specificDate, setSpecificDate] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let finalDateStr = "Auj.";
        if (dateMode === 'yesterday') finalDateStr = "Hier";
        if (dateMode === 'specific') {
            const d = new Date(specificDate);
            finalDateStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        }

        setSubmitting(true);
        setSubmitError(null);
        try {
            await onAdd({
                id: Date.now(),
                type,
                text,
                author: "Moi",
                time,
                date: finalDateStr,
            });
            onClose();
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Erreur inconnue');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
             <div className="bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl shadow-xl w-full max-w-sm p-6 relative z-10 animate-fade-in">
                 <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X size={20}/></button>
                 <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Ajouter un evenement</h3>
                 <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                         <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Type</label>
                         <select value={type} onChange={e => setType(e.target.value)} className="w-full border border-[var(--input-border)] rounded-lg p-2 text-sm bg-[var(--input-bg)] dark:text-[var(--text-primary)] font-medium">
                             <option value="housing">Logement</option>
                             <option value="refusal">Refus Mairie</option>
                             <option value="done">Mission Terminee</option>
                             <option value="info">Information</option>
                         </select>
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Description</label>
                         <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="Ex: Logement valide a Lyon" className="w-full border border-[var(--input-border)] rounded-lg p-2 text-sm bg-[var(--input-bg)] dark:text-[var(--text-primary)] dark:placeholder-[var(--text-muted)]" required autoFocus/>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Heure</label>
                            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full border border-[var(--input-border)] rounded-lg p-2 text-sm bg-[var(--input-bg)] dark:text-[var(--text-primary)]"/>
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Jour</label>
                            <select value={dateMode} onChange={e => setDateMode(e.target.value)} className="w-full border border-[var(--input-border)] rounded-lg p-2 text-sm bg-[var(--input-bg)] dark:text-[var(--text-primary)]">
                                <option value="today">Aujourd'hui</option>
                                <option value="yesterday">Hier</option>
                                <option value="specific">Date...</option>
                            </select>
                         </div>
                     </div>
                     {dateMode === 'specific' && (
                         <div>
                             <input type="date" value={specificDate} onChange={e => setSpecificDate(e.target.value)} className="w-full border border-[var(--input-border)] rounded-lg p-2 text-sm bg-[var(--input-bg)] dark:text-[var(--text-primary)]" required/>
                         </div>
                     )}
                     {submitError && (
                         <p className="text-xs text-red-600 dark:text-red-400 font-medium">{submitError}</p>
                     )}
                     <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-orange-600 text-white font-bold py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'En cours…' : 'Ajouter'}
                    </button>
                 </form>
             </div>
        </div>
    );
};

export const ActivityFeed: React.FC = () => {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const load = useCallback(() => {
        let cancelled = false;
        setIsLoading(true);
        setError(null);
        activityService.getRecent(20)
            .then(data => { if (!cancelled) setActivities(data); })
            .catch(err => {
                if (cancelled) return;
                setError(err instanceof Error ? err : new Error(String(err)));
            })
            .finally(() => { if (!cancelled) setIsLoading(false); });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        const cleanup = load();
        return cleanup;
    }, [load]);

    const handleAddEvent = async (newEvent: ActivityItem) => {
        // Persist first; surface errors instead of fire-and-forget.
        const created = await activityService.create({
            type: newEvent.type,
            text: newEvent.text,
            author: newEvent.author,
            time: newEvent.time,
            date: newEvent.date,
        });
        setActivities(prev => [created, ...prev]);
    };

    const getIcon = (type: string) => {
        switch(type) {
            case 'housing': return <Home size={14} className="text-orange-600"/>;
            case 'refusal': return <Ban size={14} className="text-red-600"/>;
            case 'done': return <CheckCircle2 size={14} className="text-emerald-600"/>;
            default: return <Activity size={14} className="text-slate-600 dark:text-slate-400"/>;
        }
    };

    return (
        <div className="glass-card p-0 flex flex-col h-full overflow-hidden relative">
            <AddEventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddEvent} />

            <div className="p-4 border-b border-[var(--border-subtle)] bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Activity size={18} className="text-orange-600"/> Activite Recente
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] px-2 py-0.5 rounded text-[var(--text-secondary)]">Live</span>
                    <button onClick={() => setIsModalOpen(true)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-[var(--text-secondary)] hover:text-orange-600 transition-colors">
                        <Plus size={16} />
                    </button>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-3">
                {isLoading && <LoadingState fullHeight />}
                {!isLoading && error && (
                    <ErrorState
                        title="Impossible de charger l'activité"
                        error={error}
                        onRetry={load}
                        fullHeight
                    />
                )}
                {!isLoading && !error && activities.length === 0 && (
                    <EmptyState
                        title="Aucune activité récente"
                        message="Les nouveaux évenements apparaitront ici."
                    />
                )}
                {!isLoading && !error && activities.map((act) => (
                    <div key={act.id} className="flex gap-3 items-start group animate-fade-in">
                        <div className="flex flex-col items-center gap-1 min-w-[35px]">
                            <span className="text-[10px] font-bold text-[var(--text-secondary)]">{act.time}</span>
                            <span className="text-[8px] font-bold text-slate-300 dark:text-slate-600 uppercase">{act.date}</span>
                            <div className="h-full w-px bg-slate-100 dark:bg-slate-700 group-last:hidden"></div>
                        </div>
                        <div className="bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] p-2.5 rounded-xl shadow-sm flex-grow hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-1">
                                <div className={`p-1 rounded-md ${act.type === 'refusal' ? 'bg-red-50 dark:bg-red-900/30' : act.type === 'housing' ? 'bg-orange-50 dark:bg-orange-900/30' : act.type === 'done' ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-slate-50 dark:bg-slate-800'}`}>
                                    {getIcon(act.type)}
                                </div>
                                <span className="text-xs font-bold text-[var(--text-primary)]">{act.text}</span>
                            </div>
                            <p className="text-[10px] text-[var(--text-muted)] pl-8">Par {act.author}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* TODO: Re-introduce a "Main Event" highlight once the backend exposes a flagged
                top-priority activity (e.g. activity.type === 'main_event' or a dedicated
                campaign milestone endpoint). The previous hardcoded "Début Campagne Handicap
                International / 1er Mars 2025" banner has been removed because it cannot be
                kept truthful without a real data source. */}
        </div>
    );
};
