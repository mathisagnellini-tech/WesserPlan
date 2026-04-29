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

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Add New Relationship */}
            <div className="bg-white dark:bg-[var(--bg-card-solid)] p-4 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                        <Plus size={14} className="text-orange-500" /> Ajouter une relation
                    </h3>
                </div>

                <div className="relative">
                    <input
                        type="text"
                        placeholder="Rechercher un collègue..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                    {searchQuery.length > 1 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[var(--bg-card-solid)] rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden z-20">
                            {searchResults.map((p: Person) => (
                                <div key={p.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between group cursor-pointer border-b border-slate-50 dark:border-slate-800 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <img src={p.photoUrl} className="w-8 h-8 rounded-full object-cover" alt={p.name} />
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{p.name}</span>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { onAddRelationship(p.id, 'affinity'); setSearchQuery(''); }} className="p-1.5 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/30" title="Affinité"><Heart size={14} /></button>
                                        <button onClick={() => { onAddRelationship(p.id, 'synergy'); setSearchQuery(''); }} className="p-1.5 bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-500/30" title="Synergie"><Zap size={14} /></button>
                                        <button onClick={() => { onAddRelationship(p.id, 'conflict'); setSearchQuery(''); }} className="p-1.5 bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/30" title="Conflit"><AlertTriangle size={14} /></button>
                                    </div>
                                </div>
                            ))}
                            {searchResults.length === 0 && (
                                <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500 italic">Aucun résultat</div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Active Relationships */}
            <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-3 flex items-center gap-2 pl-2">
                    <Users size={14} className="text-slate-400" /> Relations Actives
                </h3>
                <div className="space-y-2">
                    {myRelationships.length > 0 ? myRelationships.map(rel => {
                        const otherId = rel.sourceId === person.id ? rel.targetId : rel.sourceId;
                        const other = allPeople[otherId];
                        if (!other) return null;

                        const config = {
                            affinity: { icon: Heart, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', label: 'Affinité' },
                            synergy: { icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100', label: 'Synergie' },
                            conflict: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', label: 'Conflit' }
                        }[rel.type];

                        const Icon = config.icon;

                        return (
                            <div key={rel.id} className={`flex items-center justify-between p-3 rounded-xl border ${config.border} bg-white dark:bg-[var(--bg-card-solid)] shadow-sm`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${config.bg} ${config.color}`}>
                                        <Icon size={14} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{other.name}</div>
                                        <div className={`text-[10px] font-bold uppercase ${config.color}`}>{config.label}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onRemoveRelationship(rel.id)}
                                    className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        );
                    }) : (
                        <div className="text-center p-6 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-2xl text-slate-400 dark:text-slate-500 text-sm">
                            Aucune relation active.
                        </div>
                    )}
                </div>
            </div>

            {/* Past Teammates (History) */}
            <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-3 flex items-center gap-2 pl-2">
                    <History size={14} className="text-slate-400" /> Historique (Déjà travaillé ensemble)
                </h3>
                <div className="space-y-2">
                    {pastTeammates.length > 0 ? pastTeammates.map((teammate: Person) => {
                        const hasRel = myRelationships.some(r => r.sourceId === teammate.id || r.targetId === teammate.id);

                        return (
                            <div key={teammate.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                                <div className="flex items-center gap-3">
                                    <img src={teammate.photoUrl} className="w-8 h-8 rounded-full grayscale opacity-70" alt={teammate.name} />
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{teammate.name}</span>
                                </div>
                                {!hasRel && (
                                    <button
                                        onClick={() => onAddRelationship(teammate.id, 'synergy')}
                                        className="px-3 py-1.5 bg-white dark:bg-[var(--bg-card-solid)] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-orange-600 hover:border-orange-200 shadow-sm transition-all flex items-center gap-1"
                                    >
                                        <Zap size={10} /> Créer Synergie
                                    </button>
                                )}
                                {hasRel && (
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase px-2">Lié</span>
                                )}
                            </div>
                        );
                    }) : (
                        <div className="text-center p-4 text-slate-400 dark:text-slate-500 text-xs italic">
                            Aucun historique commun trouvé.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
