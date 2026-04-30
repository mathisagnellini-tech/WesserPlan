import React, { useState } from 'react';
import { X, Heart, Zap, AlertTriangle, Plus, History, Users } from 'lucide-react';
import { Person, Relationship } from '../../types';

interface RelationsListProps {
    person: Person;
    allPeople: Record<string, Person>;
    relationships: Relationship[];
    onAddRelationship: (targetId: string, type: 'affinity' | 'conflict' | 'synergy') => void;
    onRemoveRelationship: (relId: string) => void;
}

export const RelationsList: React.FC<RelationsListProps> = ({ person, allPeople, relationships, onAddRelationship, onRemoveRelationship }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const myRelationships = relationships.filter(r => r.sourceId === person.id || r.targetId === person.id);

    const pastTeammates = (person.pastTeammates || [])
        .map(id => allPeople[id])
        .filter((p): p is Person => !!p);

    const searchResults = searchQuery.length > 1
        ? Object.values(allPeople).filter((p: Person) =>
            p.id !== person.id &&
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !myRelationships.some(r => r.sourceId === p.id || r.targetId === p.id)
          ).slice(0, 5)
        : [];

    const config = {
        affinity: {
            icon: Heart,
            label: 'Affinité',
            tone: 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25',
        },
        synergy: {
            icon: Zap,
            label: 'Synergie',
            tone: 'bg-orange-50 text-orange-700 ring-orange-100 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/25',
        },
        conflict: {
            icon: AlertTriangle,
            label: 'Conflit',
            tone: 'bg-red-50 text-red-700 ring-red-100 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/25',
        },
    } as const;

    return (
        <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Add new relationship */}
            <div className="bg-white dark:bg-[var(--bg-card-solid)] p-4 rounded-2xl border border-[var(--border-subtle)] shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_24px_-16px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="eyebrow leading-none flex items-center gap-1.5">
                        <Plus size={11} strokeWidth={2.4} className="text-orange-500" /> Ajouter une relation
                    </h3>
                </div>

                <div className="relative">
                    <input
                        type="text"
                        placeholder="Rechercher un collègue…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="field-input"
                    />
                    {searchQuery.length > 1 && (
                        <div className="modal-shell absolute top-full left-0 right-0 mt-2 overflow-hidden z-20">
                            {searchResults.map((p: Person) => (
                                <div
                                    key={p.id}
                                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between group cursor-pointer border-b border-[var(--border-subtle)] last:border-0"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <img src={p.photoUrl} className="w-7 h-7 rounded-full object-cover" alt={p.name} />
                                        <span className="text-[13px] font-medium text-slate-700 dark:text-slate-200 tracking-tight truncate">
                                            {p.name}
                                        </span>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => { onAddRelationship(p.id, 'affinity'); setSearchQuery(''); }}
                                            className="p-1.5 bg-emerald-50 ring-1 ring-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25 rounded-md hover:scale-105 active:translate-y-[1px] transition"
                                            title="Affinité"
                                        >
                                            <Heart size={12} strokeWidth={2.2} />
                                        </button>
                                        <button
                                            onClick={() => { onAddRelationship(p.id, 'synergy'); setSearchQuery(''); }}
                                            className="p-1.5 bg-orange-50 ring-1 ring-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/25 rounded-md hover:scale-105 active:translate-y-[1px] transition"
                                            title="Synergie"
                                        >
                                            <Zap size={12} strokeWidth={2.2} />
                                        </button>
                                        <button
                                            onClick={() => { onAddRelationship(p.id, 'conflict'); setSearchQuery(''); }}
                                            className="p-1.5 bg-red-50 ring-1 ring-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/25 rounded-md hover:scale-105 active:translate-y-[1px] transition"
                                            title="Conflit"
                                        >
                                            <AlertTriangle size={12} strokeWidth={2.2} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {searchResults.length === 0 && (
                                <div className="p-4 text-center text-[12px] text-slate-400 dark:text-slate-500 italic tracking-tight">
                                    Aucun résultat
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Active relationships */}
            <div>
                <h3 className="eyebrow leading-none mb-3 flex items-center gap-1.5 pl-1">
                    <Users size={11} strokeWidth={2.4} className="text-slate-400" /> Relations actives
                </h3>
                <div className="space-y-2">
                    {myRelationships.length > 0 ? myRelationships.map(rel => {
                        const otherId = rel.sourceId === person.id ? rel.targetId : rel.sourceId;
                        const other = allPeople[otherId];
                        if (!other) return null;
                        const cfg = config[rel.type];
                        const Icon = cfg.icon;

                        return (
                            <div key={rel.id} className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card-solid)] shadow-sm">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`p-1.5 rounded-lg ring-1 ${cfg.tone}`}>
                                        <Icon size={13} strokeWidth={2.2} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[13px] font-medium text-slate-800 dark:text-slate-200 tracking-tight truncate">{other.name}</div>
                                        <div className={`eyebrow leading-none mt-0.5`} style={{ color: 'currentColor' }}>{cfg.label.toLowerCase()}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onRemoveRelationship(rel.id)}
                                    className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/15 rounded-md transition active:translate-y-[1px]"
                                    aria-label="Retirer la relation"
                                >
                                    <X size={13} strokeWidth={2.2} />
                                </button>
                            </div>
                        );
                    }) : (
                        <div className="text-center p-5 border border-dashed border-[var(--border-subtle)] rounded-2xl text-slate-400 dark:text-slate-500 text-[13px] italic tracking-tight">
                            Aucune relation active.
                        </div>
                    )}
                </div>
            </div>

            {/* Past teammates */}
            <div>
                <h3 className="eyebrow leading-none mb-3 flex items-center gap-1.5 pl-1">
                    <History size={11} strokeWidth={2.4} className="text-slate-400" /> Historique commun
                </h3>
                <div className="space-y-2">
                    {pastTeammates.length > 0 ? pastTeammates.map((teammate: Person) => {
                        const hasRel = myRelationships.some(r => r.sourceId === teammate.id || r.targetId === teammate.id);

                        return (
                            <div key={teammate.id} className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-subtle)] bg-slate-50/40 dark:bg-slate-800/40">
                                <div className="flex items-center gap-3 min-w-0">
                                    <img src={teammate.photoUrl} className="w-7 h-7 rounded-full grayscale opacity-70" alt={teammate.name} />
                                    <span className="text-[13px] font-medium text-slate-600 dark:text-slate-300 tracking-tight truncate">{teammate.name}</span>
                                </div>
                                {!hasRel ? (
                                    <button
                                        onClick={() => onAddRelationship(teammate.id, 'synergy')}
                                        className="btn-secondary !px-2.5 !py-1 !text-[11px]"
                                    >
                                        <Zap size={10} strokeWidth={2.4} /> Créer une synergie
                                    </button>
                                ) : (
                                    <span className="eyebrow leading-none px-2">lié</span>
                                )}
                            </div>
                        );
                    }) : (
                        <div className="text-center p-4 text-slate-400 dark:text-slate-500 text-[12px] italic tracking-tight">
                            Aucun historique commun trouvé.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
