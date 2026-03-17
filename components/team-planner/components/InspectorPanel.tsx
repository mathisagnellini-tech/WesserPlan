import React, { useEffect, useState } from 'react';
import { X, MapPin, Mail, Phone, TrendingDown, Star, ChevronRight, Lock, FileText, Car, CreditCard, PieChart, Check, ShieldCheck, Activity, Calendar, Users, Heart, Zap, AlertTriangle, Plus, History, MessageSquare, EyeOff, Eye, Briefcase, Circle, CheckCircle2 } from 'lucide-react';
import { Person, Relationship, PrivateNote } from '../types';

interface InspectorPanelProps {
  person: Person;
  allPeople: Record<string, Person>; // Need access to all people for names
  relationships: Relationship[];
  onClose: () => void;
  onAddRelationship: (targetId: string, type: 'affinity' | 'conflict' | 'synergy') => void;
  onRemoveRelationship: (relId: string) => void;
}

const LightTag: React.FC<{ label: string }> = ({ label }) => (
  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 tracking-wide shadow-sm">
    {label}
  </span>
);

export const InspectorPanel: React.FC<InspectorPanelProps> = ({ person, allPeople, relationships, onClose, onAddRelationship, onRemoveRelationship }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'dates' | 'docs' | 'relations' | 'private'>('info');
  
  // Security State
  const [pin, setPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [secureView, setSecureView] = useState<'none' | 'cni' | 'license' | 'badge' | 'score' | 'notes'>('none');

  // Search State for adding relations
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Small delay to ensure CSS transition triggers
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 350); // Match transition duration
  };

  // Filter relationships involving this person
  const myRelationships = relationships.filter(r => r.sourceId === person.id || r.targetId === person.id);

  // Get past teammates objects
  const pastTeammates = (person.pastTeammates || [])
    .map(id => allPeople[id])
    .filter((p): p is Person => !!p);

  // Filter for search
  const searchResults = searchQuery.length > 1 
    ? Object.values(allPeople).filter((p: Person) => 
        p.id !== person.id && 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !myRelationships.some(r => r.sourceId === p.id || r.targetId === p.id) // Exclude existing relations
      ).slice(0, 5)
    : [];

  const handleSecureAccess = (view: 'cni' | 'license' | 'badge' | 'score' | 'notes') => {
      if (isUnlocked) {
          setSecureView(view);
      } else {
          setSecureView(view); // Set intent
          setShowPinInput(true);
      }
  };

  const handlePinSubmit = () => {
      if (pin === '2003') {
          setIsUnlocked(true);
          setShowPinInput(false);
          setPin('');
          // If we were trying to access notes, stay on that tab/view
      } else {
          alert('Code incorrect');
          setPin('');
      }
  };

  if (!person) return null;

  return (
    <>
      {/* Backdrop - High Z-Index */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-[4px] z-[100] transition-opacity duration-300 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Main Panel - iOS Sheet Style - Ultra Light */}
      <div 
        className={`
            fixed top-4 bottom-4 right-4 w-[440px] z-[110] rounded-[36px] 
            bg-white dark:bg-slate-900 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-white/40 dark:border-slate-700
            flex flex-col overflow-hidden
            transform transition-all duration-500 cubic-bezier(0.19, 1, 0.22, 1)
            ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-[40px] opacity-0'}
        `}
      >
        {/* --- HERO HEADER --- */}
        <div className="relative h-72 flex-shrink-0 bg-slate-50 overflow-hidden group">
             <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                <img src={person.photoUrl} className="w-full h-full object-cover" alt={person.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent opacity-60" />
             </div>

             <button 
                onClick={handleClose}
                className="absolute top-5 right-5 p-2.5 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md transition-all border border-white/20 z-20"
            >
                <X size={20} />
            </button>

            <div className="absolute bottom-0 left-0 right-0 p-8 pt-20 bg-gradient-to-t from-black/80 to-transparent">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 shadow-sm mb-3">
                    <MapPin size={12} className="text-white" />
                    <span className="text-xs font-bold text-white uppercase tracking-wide">{person.origin}</span>
                </div>
                <h2 className="text-4xl font-black text-white leading-none tracking-tight mb-2 drop-shadow-lg">{person.name}</h2>
                <div className="text-lg text-white/80 font-medium">{person.role}</div>
            </div>
        </div>

        {/* --- TABS --- */}
        <div className="px-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 sticky top-0 overflow-x-auto no-scrollbar py-2">
            {['info', 'dates', 'docs', 'relations', 'private'].map((tab) => (
                <button 
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`
                        px-4 py-2.5 rounded-full text-xs font-bold transition-all capitalize whitespace-nowrap
                        ${activeTab === tab 
                            ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20' 
                            : 'bg-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700'}
                    `}
                >
                    {tab === 'info' ? 'Profil' : tab === 'dates' ? 'Planning' : tab === 'docs' ? 'Sécurité' : tab === 'relations' ? 'Relations' : 'Privé'}
                </button>
            ))}
        </div>

        {/* --- SCROLLABLE CONTENT --- */}
        <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar-light bg-slate-50/30">
            
            {activeTab === 'info' && (
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
            )}

            {activeTab === 'relations' && (
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
                                className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                            />
                            {searchQuery.length > 1 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[var(--bg-card-solid)] rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden z-20">
                                    {searchResults.map((p: Person) => (
                                        <div key={p.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between group cursor-pointer border-b border-slate-50 dark:border-slate-800 last:border-0">
                                            <div className="flex items-center gap-3">
                                                <img src={p.photoUrl} className="w-8 h-8 rounded-full object-cover" alt={p.name} />
                                                <span className="text-sm font-bold text-slate-700">{p.name}</span>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { onAddRelationship(p.id, 'affinity'); setSearchQuery(''); }} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100" title="Affinité"><Heart size={14} /></button>
                                                <button onClick={() => { onAddRelationship(p.id, 'synergy'); setSearchQuery(''); }} className="p-1.5 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100" title="Synergie"><Zap size={14} /></button>
                                                <button onClick={() => { onAddRelationship(p.id, 'conflict'); setSearchQuery(''); }} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Conflit"><AlertTriangle size={14} /></button>
                                            </div>
                                        </div>
                                    ))}
                                    {searchResults.length === 0 && (
                                        <div className="p-4 text-center text-xs text-slate-400 italic">Aucun résultat</div>
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
                                                <div className="text-sm font-bold text-slate-800">{other.name}</div>
                                                <div className={`text-[10px] font-bold uppercase ${config.color}`}>{config.label}</div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => onRemoveRelationship(rel.id)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                );
                            }) : (
                                <div className="text-center p-6 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-sm">
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
                                // Check if relationship already exists
                                const hasRel = myRelationships.some(r => r.sourceId === teammate.id || r.targetId === teammate.id);

                                return (
                                    <div key={teammate.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-3">
                                            <img src={teammate.photoUrl} className="w-8 h-8 rounded-full grayscale opacity-70" alt={teammate.name} />
                                            <span className="text-sm font-medium text-slate-600">{teammate.name}</span>
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
                                            <span className="text-[10px] font-bold text-slate-400 uppercase px-2">Lié</span>
                                        )}
                                    </div>
                                );
                            }) : (
                                <div className="text-center p-4 text-slate-400 text-xs italic">
                                    Aucun historique commun trouvé.
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            )}

            {activeTab === 'dates' && (
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
                                const isCurrent = week.weekNumber === 3; // Mock logic for "current"
                                
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
            )}

            {activeTab === 'docs' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-5 bg-orange-50 rounded-[28px] border border-orange-100 flex gap-4">
                        <div className="p-2 bg-white text-orange-500 rounded-xl h-fit shadow-sm"><Lock size={18} /></div>
                        <div>
                            <h4 className="font-bold text-orange-900 text-sm mb-1">Zone Sécurisée</h4>
                            <p className="text-xs text-orange-800/70 leading-relaxed font-medium">
                                L'accès aux documents nécessite une authentification PIN manager.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { id: 'cni', icon: FileText, label: 'Identité', color: 'text-orange-600', bg: 'bg-orange-50' },
                            { id: 'license', icon: Car, label: 'Permis', color: 'text-orange-600', bg: 'bg-orange-50' },
                            { id: 'badge', icon: CreditCard, label: 'Badge', color: 'text-purple-600', bg: 'bg-purple-50' },
                            { id: 'score', icon: PieChart, label: 'Scorecard', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        ].map((item) => (
                            <button 
                                key={item.id}
                                onClick={() => handleSecureAccess(item.id as any)}
                                className="bg-white dark:bg-[var(--bg-card-solid)] p-6 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 flex flex-col items-center gap-3 group active:scale-95"
                            >
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${item.bg} ${item.color} group-hover:scale-110 transition-transform shadow-sm`}>
                                    <item.icon size={24} />
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white text-sm">{item.label}</span>
                                {isUnlocked ? (
                                    <div className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold flex items-center gap-1">
                                        <Check size={10} /> Déverrouillé
                                    </div>
                                ) : (
                                    <Lock size={14} className="text-slate-300" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'private' && (
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
                                onClick={() => setShowPinInput(true)}
                                className="px-8 py-3 bg-white text-slate-900 rounded-full font-bold text-sm hover:bg-slate-100 transition-colors shadow-lg shadow-white/10"
                            >
                                Déverrouiller
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2 mb-2">
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <MessageSquare size={14} className="text-slate-400" /> Notes & Échanges
                                </h3>
                                <div className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold flex items-center gap-1">
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
                                                <span className="text-xs font-bold text-slate-500 uppercase">{note.type}</span>
                                            </div>
                                            <span className="text-[10px] font-medium text-slate-400">{note.date}</span>
                                        </div>
                                        <p className="text-sm text-slate-700 leading-relaxed font-medium mb-3">
                                            "{note.content}"
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                {note.author.charAt(0)}
                                            </div>
                                            <span className="text-xs text-slate-400 font-medium">Par {note.author}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-[24px] text-slate-400 text-sm italic">
                                    Aucune note privée enregistrée.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

        </div>
      </div>

      {/* Security PIN Modal */}
      {showPinInput && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/40 backdrop-blur-xl animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-sm text-center animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                      <ShieldCheck size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Code PIN</h3>
                  <p className="text-slate-500 text-sm mb-8 font-medium">Entrez "2003" pour accéder</p>
                  
                  <input 
                    autoFocus
                    type="password" 
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full text-center text-4xl font-black tracking-[0.5em] text-slate-900 dark:text-white border-none focus:outline-none bg-transparent placeholder:text-slate-200 mb-8"
                    placeholder="••••"
                  />

                  <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setShowPinInput(false)} className="py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">Annuler</button>
                      <button onClick={handlePinSubmit} className="py-4 rounded-2xl font-bold bg-slate-900 text-white hover:bg-black transition-colors shadow-lg shadow-slate-900/20">Valider</button>
                  </div>
              </div>
          </div>
      )}

      {/* Secure Content Viewer */}
      {isUnlocked && secureView !== 'none' && secureView !== 'notes' && !showPinInput && (
           <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/20 backdrop-blur-xl animate-in fade-in">
               <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden max-w-2xl w-full max-h-[80vh] flex flex-col animate-in zoom-in-95">
                   <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                       <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 ml-2">Document Sécurisé</h3>
                       <button onClick={() => setSecureView('none')} className="p-2 bg-white dark:bg-[var(--bg-card-solid)] rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white shadow-sm transition-colors"><X size={20}/></button>
                   </div>
                   <div className="p-10 bg-slate-50 flex items-center justify-center flex-1 overflow-auto">
                        {secureView === 'score' ? (
                            <div className="w-full bg-white dark:bg-[var(--bg-card-solid)] p-8 rounded-[24px] shadow-sm text-center border border-slate-100 dark:border-slate-800">
                                <div className="text-7xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">A+</div>
                                <div className="text-slate-400 font-bold uppercase tracking-widest text-sm">Score Global</div>
                            </div>
                        ) : (
                             person.documents[secureView as keyof typeof person.documents] ? (
                                <img src={person.documents[secureView as keyof typeof person.documents]} className="max-w-full rounded-2xl shadow-lg border border-white" alt="Document" />
                             ) : (
                                <div className="text-slate-400 font-medium italic">Document non disponible</div>
                             )
                        )}
                   </div>
               </div>
           </div>
      )}
    </>
  );
};
