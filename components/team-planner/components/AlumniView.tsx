import React, { useState, useMemo } from 'react';
import { Person } from '../types';
import { PersonCard } from './PersonCard';
import { GraduationCap, Briefcase, Users, Search, Filter, ArrowUpRight, Calendar, Star, TrendingUp } from 'lucide-react';

interface AlumniViewProps {
  alumni: Person[];
  onInfoClick: (person: Person) => void;
  onAddToIncoming: (person: Person) => void;
}

// --- SUB-COMPONENTS FOR UI CONSISTENCY ---

const StatCard: React.FC<{ label: string; value: string | number; trend?: string; icon: React.ElementType; color: string }> = ({ label, value, trend, icon: Icon, color }) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex items-start justify-between group hover:border-slate-300 transition-all">
        <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
            {trend && <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 mt-1"><TrendingUp size={10} /> {trend}</div>}
        </div>
        <div className={`p-2.5 rounded-xl ${color} bg-opacity-10 text-opacity-100 group-hover:scale-110 transition-transform duration-500`}>
            <Icon size={20} className={color.replace('bg-', 'text-')} />
        </div>
    </div>
);

const SegmentedControl: React.FC<{ options: { id: string; label: string; count?: number }[]; active: string; onChange: (id: any) => void }> = ({ options, active, onChange }) => (
    <div className="flex p-1 bg-slate-200/50 rounded-xl w-fit backdrop-blur-sm border border-slate-200/50">
        {options.map((opt) => {
            const isActive = active === opt.id;
            return (
                <button
                    key={opt.id}
                    onClick={() => onChange(opt.id)}
                    className={`
                        px-4 py-1.5 rounded-[10px] text-xs font-bold transition-all duration-200 flex items-center gap-2
                        ${isActive 
                            ? 'bg-white text-slate-900 shadow-sm scale-[1.02] ring-1 ring-black/5' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }
                    `}
                >
                    {opt.label}
                    {opt.count !== undefined && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${isActive ? 'bg-slate-100 text-slate-600' : 'bg-slate-300/50 text-slate-500'}`}>
                            {opt.count}
                        </span>
                    )}
                </button>
            );
        })}
    </div>
);

export const AlumniView: React.FC<AlumniViewProps> = ({ alumni, onInfoClick, onAddToIncoming }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'Student' | 'Other'>('all');
  const [localSearch, setLocalSearch] = useState('');

  // --- DERIVED DATA ---
  const filteredAlumni = useMemo(() => {
      let data = alumni;
      
      // Filter by Tab
      if (activeTab !== 'all') {
          data = data.filter(p => p.alumniCategory === activeTab);
      }

      // Filter by Search
      if (localSearch) {
          const lower = localSearch.toLowerCase();
          data = data.filter(p => 
              p.name.toLowerCase().includes(lower) || 
              p.origin.toLowerCase().includes(lower) ||
              p.role.toLowerCase().includes(lower)
          );
      }

      // Sort: Students returning soon first, then recent contact
      return data.sort((a, b) => {
          if (a.returnDate?.includes('2025') && !b.returnDate?.includes('2025')) return -1;
          if (!a.returnDate?.includes('2025') && b.returnDate?.includes('2025')) return 1;
          return 0;
      });
  }, [alumni, activeTab, localSearch]);

  // KPIs
  const totalAlumni = alumni.length;
  const totalStudents = alumni.filter(p => p.alumniCategory === 'Student').length;
  const highPerformers = alumni.filter(p => p.drRate >= 18).length;
  const returningSoon = alumni.filter(p => p.returnDate && p.returnDate.includes('2025')).length;

  return (
    <div className="w-full h-full flex flex-col bg-[#F8FAFC]">
        {/* --- HEADER DASHBOARD --- */}
        <div className="pt-8 pb-6 px-8 border-b border-slate-200/60 bg-white/50 backdrop-blur-xl sticky top-0 z-30">
            <div className="max-w-[1600px] mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-2 flex items-center gap-3">
                            Alumni Network
                            <span className="px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest translate-y-0.5">
                                v2.4
                            </span>
                        </h1>
                        <p className="text-slate-500 font-medium text-sm max-w-lg leading-relaxed">
                            Plateforme centralisée de gestion des talents et historique des collaborateurs terrain. 
                            Suivi des carrières et réintégration.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={16} />
                            <input 
                                type="text" 
                                placeholder="Filtrer les profils..." 
                                value={localSearch}
                                onChange={(e) => setLocalSearch(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all w-64 shadow-sm"
                            />
                        </div>
                        <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 hover:shadow-md transition-all active:scale-95">
                            <Filter size={18} />
                        </button>
                    </div>
                </div>

                {/* KPIs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard 
                        label="Total Alumni" 
                        value={totalAlumni} 
                        icon={Users} 
                        color="bg-slate-900" 
                    />
                    <StatCard 
                        label="Vivier Étudiant" 
                        value={totalStudents} 
                        trend="+12% vs N-1"
                        icon={GraduationCap} 
                        color="bg-orange-600" 
                    />
                    <StatCard 
                        label="Top Performers" 
                        value={highPerformers} 
                        icon={Star} 
                        color="bg-amber-500" 
                    />
                    <StatCard 
                        label="Retours Prévus '25" 
                        value={returningSoon} 
                        trend="Priorité Haute"
                        icon={Calendar} 
                        color="bg-emerald-500" 
                    />
                </div>
            </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar-light px-8 py-8">
            <div className="max-w-[1600px] mx-auto">
                
                {/* Toolbar */}
                <div className="flex items-center justify-between mb-6">
                    <SegmentedControl 
                        active={activeTab} 
                        onChange={setActiveTab}
                        options={[
                            { id: 'all', label: 'Vue Globale', count: totalAlumni },
                            { id: 'Student', label: 'Étudiants', count: totalStudents },
                            { id: 'Other', label: 'Professionnels', count: totalAlumni - totalStudents },
                        ]} 
                    />
                    
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        Trier par: <span className="text-slate-700 cursor-pointer hover:underline">Date de retour</span>
                        <ArrowUpRight size={12} />
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {filteredAlumni.map((person, index) => (
                        <div key={person.id} className="w-full animate-in fade-in zoom-in-95 duration-500 relative group/card" style={{ animationDelay: `${index * 30}ms` }}>
                            <PersonCard 
                                person={person}
                                index={index}
                                totalCards={filteredAlumni.length}
                                density="standard"
                                viewMode="performance"
                                onClick={() => {}}
                                onInfoClick={() => onInfoClick(person)}
                            />
                            {/* Quick Action Overlay */}
                            <div className="absolute top-4 right-14 opacity-0 group-hover/card:opacity-100 transition-opacity z-20">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onAddToIncoming(person); }}
                                    className="bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 transform hover:scale-105 transition-all"
                                >
                                    <Calendar size={12} />
                                    Planifier Retour
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredAlumni.length === 0 && (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl mt-8">
                        <Users size={48} className="mb-4 opacity-50" />
                        <p className="font-medium">Aucun profil ne correspond à votre recherche.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
