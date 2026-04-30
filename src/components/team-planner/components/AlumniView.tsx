import React, { useState, useMemo } from 'react';
import { Person } from '../types';
import { PersonCard } from './PersonCard';
import { GraduationCap, Users, Search, Filter, ArrowUpRight, Calendar, Star, TrendingUp } from 'lucide-react';

interface AlumniViewProps {
  alumni: Person[];
  onInfoClick: (person: Person) => void;
  onAddToIncoming: (person: Person) => void;
}

const StatCard: React.FC<{
    label: string;
    value: string | number;
    trend?: string;
    icon: React.ElementType;
    tone?: 'orange' | 'amber' | 'emerald' | 'slate';
}> = ({ label, value, trend, icon: Icon, tone = 'slate' }) => {
    const toneClass =
        tone === 'orange'
            ? 'bg-orange-50 text-orange-600 ring-orange-100 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/25'
            : tone === 'amber'
            ? 'bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/25'
            : tone === 'emerald'
            ? 'bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25'
            : 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-600/40';

    return (
        <div className="kpi-card relative">
            <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="eyebrow leading-none">{label}</p>
                    <h3 className="num display text-[var(--text-primary)] text-[28px] leading-none tracking-tight mt-2">
                        {value}
                    </h3>
                    {trend && (
                        <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-2 tracking-tight">
                            <TrendingUp size={11} strokeWidth={2.4} /> {trend}
                        </div>
                    )}
                </div>
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center ring-1 ${toneClass}`}>
                    <Icon size={15} strokeWidth={2.2} />
                </div>
            </div>
        </div>
    );
};

const SegmentedControl: React.FC<{
    options: { id: string; label: string; count?: number }[];
    active: string;
    onChange: (id: any) => void;
}> = ({ options, active, onChange }) => (
    <div className="seg">
        {options.map((opt) => (
            <button key={opt.id} onClick={() => onChange(opt.id)} data-active={active === opt.id}>
                {opt.label}
                {opt.count !== undefined && (
                    <span className="num ml-1 px-1.5 py-0.5 rounded-md text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 tracking-tight">
                        {opt.count}
                    </span>
                )}
            </button>
        ))}
    </div>
);

export const AlumniView: React.FC<AlumniViewProps> = ({ alumni, onInfoClick, onAddToIncoming }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'Student' | 'Other'>('all');
  const [localSearch, setLocalSearch] = useState('');

  const filteredAlumni = useMemo(() => {
      let data = alumni;
      if (activeTab !== 'all') {
          data = data.filter(p => p.alumniCategory === activeTab);
      }
      if (localSearch) {
          const lower = localSearch.toLowerCase();
          data = data.filter(p =>
              p.name.toLowerCase().includes(lower) ||
              p.origin.toLowerCase().includes(lower) ||
              p.role.toLowerCase().includes(lower)
          );
      }
      return data.sort((a, b) => {
          if (a.returnDate?.includes('2025') && !b.returnDate?.includes('2025')) return -1;
          if (!a.returnDate?.includes('2025') && b.returnDate?.includes('2025')) return 1;
          return 0;
      });
  }, [alumni, activeTab, localSearch]);

  const totalAlumni = alumni.length;
  const totalStudents = alumni.filter(p => p.alumniCategory === 'Student').length;
  const highPerformers = alumni.filter(p => p.drRate >= 18).length;
  const returningSoon = alumni.filter(p => p.returnDate && p.returnDate.includes('2025')).length;

  return (
    <div className="app-surface w-full h-full flex flex-col bg-[#F8FAFC] dark:bg-slate-950">
        {/* Header */}
        <div className="pt-8 pb-6 px-8 border-b border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl sticky top-0 z-30">
            <div className="max-w-[1600px] mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-7">
                    <div>
                        <h1 className="display text-slate-900 dark:text-white text-[40px] leading-none tracking-tight mb-2 flex items-center gap-3">
                            Alumni network
                            <span className="num text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-[var(--border-subtle)] text-slate-500 dark:text-slate-400 tracking-tight translate-y-1">
                                v2.4
                            </span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-[13px] tracking-tight max-w-lg leading-relaxed">
                            Suivi des talents terrain, historique des collaborations, planification du retour.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative group">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors pointer-events-none"
                                size={14}
                                strokeWidth={2.2}
                            />
                            <input
                                type="text"
                                placeholder="Filtrer les profils…"
                                value={localSearch}
                                onChange={(e) => setLocalSearch(e.target.value)}
                                className="field-input !pl-9 w-64"
                            />
                        </div>
                        <button className="btn-secondary !p-2" aria-label="Filtres avancés">
                            <Filter size={15} strokeWidth={2.2} />
                        </button>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard label="Total alumni" value={totalAlumni} icon={Users} tone="slate" />
                    <StatCard
                        label="Vivier étudiant"
                        value={totalStudents}
                        trend="+12 % vs n-1"
                        icon={GraduationCap}
                        tone="orange"
                    />
                    <StatCard label="Top performers" value={highPerformers} icon={Star} tone="amber" />
                    <StatCard
                        label="Retours prévus 2025"
                        value={returningSoon}
                        trend="priorité haute"
                        icon={Calendar}
                        tone="emerald"
                    />
                </div>
            </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar-light px-8 py-8">
            <div className="max-w-[1600px] mx-auto">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <SegmentedControl
                        active={activeTab}
                        onChange={setActiveTab}
                        options={[
                            { id: 'all', label: 'Vue globale', count: totalAlumni },
                            { id: 'Student', label: 'Étudiants', count: totalStudents },
                            { id: 'Other', label: 'Professionnels', count: totalAlumni - totalStudents },
                        ]}
                    />

                    <div className="eyebrow flex items-center gap-1.5 leading-none">
                        Trier par
                        <span className="text-slate-700 dark:text-slate-300 cursor-pointer hover:underline tracking-tight">
                            date de retour
                        </span>
                        <ArrowUpRight size={11} strokeWidth={2.4} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {filteredAlumni.map((person, index) => (
                        <div
                            key={person.id}
                            className="w-full animate-in fade-in zoom-in-95 duration-500 relative group/card"
                            style={{ animationDelay: `${index * 30}ms` }}
                        >
                            <PersonCard
                                person={person}
                                index={index}
                                totalCards={filteredAlumni.length}
                                density="standard"
                                viewMode="performance"
                                onClick={() => {}}
                                onInfoClick={() => onInfoClick(person)}
                            />
                            <div className="absolute top-4 right-14 opacity-0 group-hover/card:opacity-100 transition-opacity z-20">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onAddToIncoming(person); }}
                                    className="btn-primary !text-[11px] !px-3 !py-1.5"
                                >
                                    <Calendar size={11} strokeWidth={2.4} />
                                    Planifier le retour
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredAlumni.length === 0 && (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-400 border border-dashed border-[var(--border-subtle)] rounded-3xl mt-8">
                        <Users size={36} strokeWidth={2.2} className="mb-3 opacity-50" />
                        <p className="text-[13px] tracking-tight">Aucun profil ne correspond à votre recherche.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
