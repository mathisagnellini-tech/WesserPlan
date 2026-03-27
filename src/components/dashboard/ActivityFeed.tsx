import React, { useState, useEffect } from 'react';
import { Activity, Home, Ban, CheckCircle2, CalendarDays, Flag, Clock, Plus, X } from 'lucide-react';
import { activityService, type ActivityItem } from '@/services/activityService';

// Add Event Modal
const AddEventModal: React.FC<{ isOpen: boolean; onClose: () => void; onAdd: (e: ActivityItem) => void }> = ({ isOpen, onClose, onAdd }) => {
    const [type, setType] = useState('housing');
    const [text, setText] = useState('');
    const [time, setTime] = useState('09:00');
    const [dateMode, setDateMode] = useState('today');
    const [specificDate, setSpecificDate] = useState('');

    if(!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let finalDateStr = "Auj.";
        if (dateMode === 'yesterday') finalDateStr = "Hier";
        if (dateMode === 'specific') {
            const d = new Date(specificDate);
            finalDateStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        }

        onAdd({
            id: Date.now(),
            type,
            text,
            author: "Moi",
            time,
            date: finalDateStr
        });
        onClose();
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
                     <button type="submit" className="w-full bg-orange-600 text-white font-bold py-2 rounded-lg hover:bg-orange-700 transition-colors">Ajouter</button>
                 </form>
             </div>
        </div>
    );
};

const FALLBACK_ACTIVITIES: ActivityItem[] = [
    { id: 1, type: 'housing', text: "Logement ajoute (Lyon)", author: "Sarah L.", time: "10:45", date: "Auj." },
    { id: 2, type: 'refusal', text: "Refus Mairie Colmar", author: "Thomas R.", time: "09:30", date: "Auj." },
    { id: 3, type: 'done', text: "Zone B terminee", author: "Equipe 4", time: "16:00", date: "Hier" },
];

export const ActivityFeed: React.FC = () => {
    const [activities, setActivities] = useState<ActivityItem[]>(FALLBACK_ACTIVITIES);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Try loading from Supabase
    useEffect(() => {
        activityService.getRecent(20)
            .then(data => { if (data.length > 0) setActivities(data); })
            .catch(() => { /* keep fallback */ });
    }, []);

    const handleAddEvent = (newEvent: ActivityItem) => {
        setActivities([newEvent, ...activities]);
        // Persist to Supabase (fire-and-forget)
        activityService.create(newEvent).catch(() => {});
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
                {activities.map((act) => (
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

            {/* Main Event Highlight */}
            <div className="p-4 bg-gradient-to-br from-orange-600 to-orange-700 text-white m-4 rounded-xl shadow-lg shadow-orange-500/30 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                     <Flag size={60} />
                 </div>
                 <div className="relative z-10">
                     <div className="flex items-center gap-2 mb-1 opacity-90">
                         <CalendarDays size={14} />
                         <span className="text-xs font-bold uppercase tracking-wider">Main Event</span>
                     </div>
                     <h4 className="font-black text-lg leading-tight mb-2">Debut Campagne Handicap International</h4>
                     <div className="flex items-center gap-2 text-xs font-medium bg-white/20 w-fit px-2 py-1 rounded-lg backdrop-blur-sm">
                         <Clock size={12} />
                         1er Mars 2025
                     </div>
                 </div>
            </div>
        </div>
    );
};
