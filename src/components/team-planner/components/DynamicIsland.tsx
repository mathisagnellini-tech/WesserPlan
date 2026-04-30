import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, UserPlus, Zap, Sparkles, GraduationCap, Lock, Unlock, UserMinus, Users, ArrowRight, X } from 'lucide-react';
import { Person } from '../types';
import { PersonCard } from './PersonCard';
import { ViewMode } from '../TeamPlannerApp';

interface DynamicIslandProps {
  incomingPeople: Person[];
  departingPeople?: Person[];
  onDragStart: (e: React.DragEvent<HTMLDivElement>, cardId: string) => void;
  onDepartureDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  onRemoveDeparture?: (personId: string) => void;
  viewMode?: ViewMode;
  totalActiveCount?: number;
}

export const DynamicIsland: React.FC<DynamicIslandProps> = ({ 
    incomingPeople, 
    departingPeople = [], 
    onDragStart, 
    onDepartureDrop,
    onRemoveDeparture,
    viewMode = 'performance',
    totalActiveCount = 0
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [activeTab, setActiveTab] = useState<'new' | 'senior'>('new');
  const [activeSection, setActiveSection] = useState<'arrivals' | 'departures'>('arrivals');
  const [isDragOverDeparture, setIsDragOverDeparture] = useState(false);
  
  const isExpanded = isHovered || isLocked || isDragOverDeparture;
  const count = incomingPeople.length;
  const departureCount = departingPeople.length;
  const netChange = count - departureCount;

  // Split data
  const { newcomers, seniors } = useMemo(() => {
      const newP: Person[] = [];
      const senP: Person[] = [];
      incomingPeople.forEach(p => {
          if ((p.weeksOfExperience && p.weeksOfExperience < 2) || p.tags.includes('Nouveau')) {
              newP.push(p);
          } else {
              senP.push(p);
          }
      });
      return { newcomers: newP, seniors: senP };
  }, [incomingPeople]);

  // Auto-switch tab
  useEffect(() => {
      if (newcomers.length === 0 && seniors.length > 0) setActiveTab('senior');
      else if (newcomers.length > 0 && seniors.length === 0) setActiveTab('new');
  }, [newcomers.length, seniors.length]);

  const currentList = activeTab === 'new' ? newcomers : seniors;

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOverDeparture(true);
  };

  const handleDragLeave = () => {
      setIsDragOverDeparture(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      setIsDragOverDeparture(false);
      if (onDepartureDrop) onDepartureDrop(e);
  };

  return (
    <div 
      className="flex justify-center transition-all duration-500"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        onClick={() => !isLocked && setIsLocked(true)}
        className={`
          bg-slate-900/95 backdrop-blur-xl rounded-[32px] flex flex-col items-center transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer overflow-hidden relative z-50
          shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-white/10 ring-1 ring-black/50
          ${isExpanded ? 'w-[720px] h-[320px] p-5' : 'w-[480px] h-14 px-1'}
        `}
      >
        {/* Header / Collapsed State */}
        <div className={`flex items-center justify-between w-full ${isExpanded ? 'mb-6 px-2' : 'h-full px-4'}`}>
            
            {/* LEFT: ARRIVALS */}
            <div
                className={`flex items-center gap-3 group cursor-pointer transition-opacity ${activeSection === 'arrivals' ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
                onClick={(e) => { e.stopPropagation(); setActiveSection('arrivals'); }}
            >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isExpanded && activeSection === 'arrivals' ? 'bg-orange-500 text-white' : 'bg-white/10 text-orange-400'}`}>
                    <UserPlus size={14} strokeWidth={2.2} />
                </div>
                <div className="flex flex-col justify-center leading-tight">
                    <span className="text-[12px] font-medium text-white tracking-tight whitespace-nowrap flex items-center gap-2">
                        <span>Arrivées</span>
                        {!isExpanded && (
                            <>
                                <span className="text-white/20">·</span>
                                <span className="num text-orange-400">{count}</span>
                            </>
                        )}
                    </span>
                    {isExpanded && (
                        <span className="text-[10px] font-medium text-slate-400 tracking-tight">
                            Semaine prochaine
                        </span>
                    )}
                </div>
            </div>

            {/* CENTER: STATS */}
            <div className={`flex items-center gap-5 px-6 border-x border-white/10 ${isExpanded ? 'mx-auto' : ''}`}>
                 <div className="flex flex-col items-center leading-tight">
                     <span className="text-[10px] font-medium text-slate-400 tracking-tight">Effectif</span>
                     <span className="num text-[13px] font-semibold text-white tracking-tight">{totalActiveCount}</span>
                 </div>
                 <div className="flex flex-col items-center leading-tight">
                     <span className="text-[10px] font-medium text-slate-400 tracking-tight">Flux</span>
                     <span className={`num text-[13px] font-semibold tracking-tight ${netChange > 0 ? 'text-emerald-400' : netChange < 0 ? 'text-red-400' : 'text-slate-200'}`}>
                         {netChange > 0 ? '+' : ''}{netChange}
                     </span>
                 </div>
            </div>

            {/* RIGHT: DEPARTURES */}
            <div
                className={`
                    flex items-center gap-3 group transition rounded-xl p-1 cursor-pointer
                    ${activeSection === 'departures' ? 'opacity-100' : 'opacity-50 hover:opacity-100'}
                    ${isDragOverDeparture ? 'bg-red-500/20 ring-2 ring-red-500 scale-105' : ''}
                `}
                onClick={(e) => { e.stopPropagation(); setActiveSection('departures'); }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="flex flex-col justify-center items-end leading-tight">
                    <span className="text-[12px] font-medium text-white tracking-tight whitespace-nowrap flex items-center gap-2">
                        {!isExpanded && (
                            <>
                                <span className="num text-red-400">{departureCount}</span>
                                <span className="text-white/20">·</span>
                            </>
                        )}
                        <span>Départs</span>
                    </span>
                    {isExpanded && (
                        <span className="text-[10px] font-medium text-slate-400 tracking-tight">
                            Glisser ici pour retirer
                        </span>
                    )}
                </div>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isExpanded && activeSection === 'departures' ? 'bg-red-500 text-white' : 'bg-white/10 text-red-400'}`}>
                    <UserMinus size={14} strokeWidth={2.2} />
                </div>
            </div>

            {/* Chevron / Lock Indicator */}
            <div className="flex items-center gap-2 ml-2">
                {isExpanded && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsLocked(!isLocked); }}
                        className={`p-1.5 rounded-full transition-colors ${isLocked ? 'bg-white/20 text-white' : 'text-slate-500 hover:text-white hover:bg-white/10'}`}
                        title={isLocked ? "Déverrouiller" : "Verrouiller"}
                    >
                        {isLocked ? <Lock size={12} className="text-emerald-400" /> : <Unlock size={12} />}
                    </button>
                )}
                {!isExpanded && <ChevronDown size={12} className="text-white/30" />}
            </div>
        </div>

        {/* EXPANDED CONTENT AREA */}
        <div 
            className={`
                w-full flex-1 transition-all duration-500 delay-75 relative overflow-hidden flex flex-col
                ${isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none h-0'}
            `}
            onClick={(e) => e.stopPropagation()} 
        >
            {/* SECTION: ARRIVALS */}
            {activeSection === 'arrivals' && (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-300 w-full">
                    {/* Tabs */}
                    <div className="flex justify-center mb-4 flex-shrink-0">
                        <div className="flex bg-black/40 rounded-full p-1 border border-white/5 gap-1">
                            <button
                                onClick={() => setActiveTab('new')}
                                className={`px-3 py-1 rounded-full text-[11px] font-medium tracking-tight flex items-center gap-1.5 transition active:translate-y-[1px] ${activeTab === 'new' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Sparkles size={11} strokeWidth={2.2} />
                                Nouveaux <span className="num opacity-60 ml-0.5">{newcomers.length}</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('senior')}
                                className={`px-3 py-1 rounded-full text-[11px] font-medium tracking-tight flex items-center gap-1.5 transition active:translate-y-[1px] ${activeTab === 'senior' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                            >
                                <GraduationCap size={11} strokeWidth={2.2} />
                                Seniors <span className="num opacity-60 ml-0.5">{seniors.length}</span>
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-x-auto custom-scrollbar-dark flex items-center gap-3 px-1 pb-1 w-full">
                        {currentList.length === 0 ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2 border-2 border-dashed border-white/5 rounded-2xl bg-white/5">
                                <div className="p-2 rounded-full bg-white/5">
                                    {activeTab === 'new' ? <Sparkles size={16} className="opacity-50" /> : <GraduationCap size={16} className="opacity-50" />}
                                </div>
                                <span className="text-xs font-medium">Aucun profil dans cette catégorie</span>
                            </div>
                        ) : (
                            currentList.map((person, index) => (
                                <div key={person.id} className="flex-shrink-0 w-[200px]">
                                    <PersonCard 
                                        person={person} 
                                        index={index} 
                                        totalCards={count} 
                                        density="compact" 
                                        viewMode={viewMode} 
                                        onClick={() => {}} 
                                        onInfoClick={() => {}}
                                        onDragStart={(e) => onDragStart(e, person.id)}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* SECTION: DEPARTURES */}
            {activeSection === 'departures' && (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-300 w-full">
                    <div className="text-center mb-4 text-xs text-slate-400 flex-shrink-0">
                        Ces personnes seront retirées des équipes lors de la duplication de la semaine.
                    </div>
                    
                    <div className="flex-1 overflow-x-auto custom-scrollbar-dark flex items-center gap-3 px-1 pb-1 w-full">
                        {departingPeople.length === 0 ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2 border-2 border-dashed border-red-500/20 rounded-2xl bg-red-500/5">
                                <div className="p-2 rounded-full bg-red-500/10 text-red-400">
                                    <UserMinus size={16} />
                                </div>
                                <span className="text-xs font-medium">Glissez une carte ici pour planifier un départ</span>
                            </div>
                        ) : (
                            departingPeople.map((person, index) => (
                                <div key={person.id} className="flex-shrink-0 w-[200px] relative group">
                                    <div className="absolute -top-2 -right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => onRemoveDeparture && onRemoveDeparture(person.id)}
                                            className="bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors"
                                            title="Annuler le départ"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                    <div className="opacity-75 grayscale hover:grayscale-0 transition-all">
                                        <PersonCard 
                                            person={person} 
                                            index={index} 
                                            totalCards={departureCount} 
                                            density="compact" 
                                            viewMode={viewMode} 
                                            onClick={() => {}} 
                                            onInfoClick={() => {}}
                                            // No drag start for departures
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
