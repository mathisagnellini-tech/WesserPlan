
import React, { memo } from 'react';
import { Person } from '../types';
import { Car, HeartPulse, Info, MapPin, FileCheck, FileWarning, Clock, Crown, Zap, Shield, PhoneCall, Calendar, TrendingUp, TrendingDown, Minus, AlertTriangle, AlertCircle, UserX } from 'lucide-react';
import { ViewMode, ViewDensity } from '../TeamPlannerApp';

interface PersonCardProps {
  person: Person;
  index: number;
  totalCards: number;
  isDragging?: boolean;
  isFeatured?: boolean;
  isSelected?: boolean;
  density: ViewDensity;
  viewMode?: ViewMode;
  isHeatmapMode?: boolean; 
  showRelationships?: boolean; // New prop
  isLinkingMode?: boolean; // New prop
  linkSourceId?: string | null; // New prop
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onClick: (e: React.MouseEvent) => void;
  onInfoClick: () => void;
  onLink?: (targetId: string) => void; // New prop
}

export const PersonCard = memo<PersonCardProps>(({ 
  person, 
  isDragging, 
  isSelected = false,
  density = 'standard',
  viewMode = 'performance',
  isHeatmapMode = false,
  showRelationships = false,
  isLinkingMode = false,
  linkSourceId = null,
  onDragStart, 
  onClick,
  onInfoClick,
  onLink
}) => {
  
  const isLeader = person.role === 'Teamleader' || person.tags.includes('Teamleader');
  const isAlumni = person.isAlumni;

  // Linking State
  const isLinkSource = linkSourceId === person.id;
  const canBeLinkTarget = isLinkingMode && linkSourceId && !isLinkSource;

  // --- LINKING HANDLERS ---
  const handleDragOver = (e: React.DragEvent) => {
      if (showRelationships && onLink && !isDragging) {
          e.preventDefault();
          e.stopPropagation();
      }
  };

  const handleDrop = (e: React.DragEvent) => {
      if (showRelationships && onLink && !isDragging) {
          e.preventDefault();
          e.stopPropagation();
          onLink(person.id);
      }
  };


  // --- SENIORITY LOGIC ---
  const getSeniorityColor = () => {
      if (isHeatmapMode) return { bg: '', border: '', text: '' };
      
      // New Arrival Override
      if (person.isNewArrival) {
          return { bg: 'bg-cyan-400', border: 'border-cyan-400', text: 'text-cyan-600' };
      }

      // Leader always gets Gold
      if (isLeader) return { bg: 'bg-amber-400', border: 'border-amber-400', text: 'text-amber-500' };

      const weeks = person.weeksOfExperience || 1;
      switch(weeks) {
          case 1: return { bg: 'bg-yellow-400', border: 'border-yellow-400', text: 'text-yellow-500' };
          case 2: return { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-600' };
          case 3: return { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-600' };
          case 4: return { bg: 'bg-rose-500', border: 'border-rose-500', text: 'text-rose-600' };
          default: return { bg: 'bg-slate-200', border: 'border-slate-400', text: 'text-slate-400' }; // 5+ weeks: Visible border
      }
  };
  const seniorityColors = getSeniorityColor();

  // --- HEATMAP LOGIC ---
  const getHeatmapStyle = () => {
    if (!isHeatmapMode) return '';
    if (person.drRate >= 20) return 'bg-emerald-500 border-emerald-400 text-white';
    if (person.drRate >= 15) return 'bg-emerald-100 border-emerald-200';
    if (person.drRate >= 12) return 'bg-white dark:bg-[var(--bg-card-solid)] border-slate-200 dark:border-slate-700';
    return 'bg-red-500 border-red-400 text-white';
  };

  const heatmapClass = getHeatmapStyle();
  const forceWhiteText = isHeatmapMode && (person.drRate >= 20 || person.drRate < 12);

  // --- SCORE LOGIC ---
  const objective = person.objective || 15;
  const scoreColor = person.drRate >= objective ? 'text-emerald-600' : (person.drRate >= objective * 0.8 ? 'text-amber-600' : 'text-red-600');
  const barColor = person.drRate >= objective ? 'bg-emerald-500' : (person.drRate >= objective * 0.8 ? 'bg-amber-500' : 'bg-red-500');

  // --- DELTA LOGIC ---
  const delta = person.previousDrRate ? +(person.drRate - person.previousDrRate).toFixed(1) : 0;
  const deltaColor = delta > 0 ? 'text-emerald-600' : (delta < 0 ? 'text-red-500' : 'text-slate-400');
  const DeltaIcon = delta > 0 ? TrendingUp : (delta < 0 ? TrendingDown : Minus);

  // --- ALERT LOGIC ---
  const getAlertConfig = () => {
      if (!person.alertType && !person.isWarning) return null;
      switch(person.alertType) {
          case 'absent': return { label: 'Absent', color: 'bg-red-100 text-red-700 border-red-200', icon: UserX };
          case 'performance': return { label: 'Perf.', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: TrendingDown };
          case 'admin': return { label: 'Admin', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: FileWarning };
          case 'medical': return { label: 'Médical', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: HeartPulse };
          default: return { label: 'Alerte', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle };
      }
  };
  const alertConfig = getAlertConfig();

  // --- NGO EXPERIENCE LOGIC ---
  // If they have NEVER worked with the NGO (hasWorkedWithNgo === false), show a warning
  const showNgoWarning = person.hasWorkedWithNgo === false; 

  // --- HELPERS ---
  const getMetricConfig = (val: number) => {
      if (isHeatmapMode && forceWhiteText) return { color: 'text-white', bg: 'bg-white/20', ring: 'ring-white/30' };
      if (val >= 20) return { color: 'text-emerald-600', bg: 'bg-emerald-400/10', ring: 'ring-emerald-500/20' };
      if (val >= 15) return { color: 'text-orange-600', bg: 'bg-orange-400/10', ring: 'ring-orange-500/20' };
      return { color: 'text-amber-600', bg: 'bg-amber-400/10', ring: 'ring-amber-500/20' };
  };
  const metricConfig = getMetricConfig(person.drRate);

  // --- ALUMNI RENDER LOGIC ---
  const renderAlumniRightContent = () => {
     return (
        <div className="flex flex-col items-end justify-center gap-1.5 h-full min-w-[110px]">
            <div className="text-right">
                <div className={`text-[9px] uppercase font-bold ${forceWhiteText ? 'text-white/70' : 'text-slate-400'} mb-0.5 flex items-center justify-end gap-1`}>
                    <Calendar size={10} /> Dispo
                </div>
                <div className={`text-xs font-black ${forceWhiteText ? 'text-white bg-white/20' : 'text-slate-700 dark:text-slate-200 bg-white/60 dark:bg-slate-800/60'} px-2 py-1 rounded-md border ${forceWhiteText ? 'border-white/30' : 'border-slate-100 dark:border-slate-800'} text-right shadow-sm backdrop-blur-sm`}>
                    {person.returnDate}
                </div>
            </div>
            <div className="text-right">
                <div className={`text-[9px] uppercase font-bold ${forceWhiteText ? 'text-white/70' : 'text-slate-400'} mb-0.5 flex items-center justify-end gap-1`}>
                    <PhoneCall size={10} /> Contact
                </div>
                <div className={`text-[10px] font-bold ${forceWhiteText ? 'text-white/90 bg-white/10' : 'text-slate-500 bg-slate-100/50'} px-2 py-0.5 rounded-full`}>
                    {person.lastContact}
                </div>
            </div>
        </div>
     );
  };

  const renderActiveRightContent = (layout: 'stack' | 'row' = 'stack') => {
      switch (viewMode) {
          case 'identity':
              if (layout === 'row') {
                 return (
                     <div className="flex items-center gap-2 pr-2">
                         <span className={`text-[11px] font-semibold ${forceWhiteText ? 'text-white/80' : 'text-slate-500'}`}>{person.age}a</span>
                         <span className={`w-px h-3 ${forceWhiteText ? 'bg-white/30' : 'bg-slate-300/50'}`}></span>
                         <span className={`text-[10px] font-bold uppercase tracking-wide ${forceWhiteText ? 'text-white' : 'text-slate-600'}`}>{person.origin.substring(0,3)}</span>
                     </div>
                 );
              }
              return (
                  <div className="flex flex-col items-end justify-center h-full">
                      <div className={`${forceWhiteText ? 'text-white' : 'text-slate-800'} font-bold text-lg leading-none mb-1 tracking-tight`}>{person.age}</div>
                      <div className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full ring-1 backdrop-blur-sm truncate max-w-[80px]
                        ${forceWhiteText ? 'text-white bg-white/20 ring-white/30' : 'text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 ring-slate-200/50'}
                      `}>
                          <MapPin size={9} /> {person.origin.split(',')[0]}
                      </div>
                  </div>
              );
              
          case 'hr':
              const hrStatusColor = person.contractStatus === 'Signed' ? (forceWhiteText ? 'text-white' : 'text-emerald-600') : (forceWhiteText ? 'text-white' : 'text-amber-600');
              const HrIcon = person.contractStatus === 'Signed' ? FileCheck : FileWarning;
              
              if (layout === 'row') {
                  return (
                      <div className="flex items-center gap-2 pr-2">
                          <div className={`flex items-center gap-1 text-[10px] font-bold uppercase ${hrStatusColor}`}>
                              <HrIcon size={12} /> {person.contractStatus}
                          </div>
                      </div>
                  );
              }

              return (
                  <div className="flex flex-col items-end justify-center h-full gap-1">
                        <div className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${person.contractStatus === 'Signed' 
                            ? (forceWhiteText ? 'bg-white/20 text-white border-white/30' : 'bg-emerald-50 text-emerald-600 border-emerald-100') 
                            : (forceWhiteText ? 'bg-white/20 text-white border-white/30' : 'bg-amber-50 text-amber-600 border-amber-100')
                        }`}>
                            {person.contractStatus === 'Signed' ? 'Contrat OK' : 'En Attente'}
                        </div>
                        <div className="flex items-center gap-1">
                             <div className={`p-1 rounded-full ${person.hasLicense ? (forceWhiteText ? 'bg-white/20 text-white' : 'bg-orange-50 text-orange-500') : (forceWhiteText ? 'bg-white/10 text-white/50' : 'bg-slate-100 text-slate-300')}`}>
                                 <Car size={10} />
                             </div>
                             <div className={`p-1 rounded-full ${person.medicalVisit ? (forceWhiteText ? 'bg-white/20 text-white' : 'bg-purple-50 text-purple-500') : (forceWhiteText ? 'bg-white/10 text-white/50' : 'bg-slate-100 text-slate-300')}`}>
                                 <HeartPulse size={10} />
                             </div>
                        </div>
                  </div>
              );

          case 'performance':
          default:
              if (layout === 'row') {
                   return (
                        <div className="flex items-center gap-3 pr-2">
                             <div className="flex items-baseline gap-1">
                                 <span className={`text-sm font-black ${forceWhiteText ? 'text-white' : scoreColor}`}>{person.drRate}</span>
                                 <span className={`text-[9px] font-bold uppercase ${forceWhiteText ? 'text-white/70' : 'text-slate-400'}`}>DR</span>
                             </div>
                        </div>
                   );
              }

              return (
                  <div className="flex flex-col items-end justify-center h-full">
                      <div className="flex items-end gap-1.5 mb-0.5">
                          <div className={`text-2xl font-black leading-none tracking-tighter ${forceWhiteText ? 'text-white' : scoreColor}`}>
                              {person.drRate}
                          </div>
                          {/* Delta Indicator */}
                          <div className={`flex items-center text-[10px] font-bold mb-0.5 ${forceWhiteText ? 'text-white/80' : deltaColor}`}>
                              <DeltaIcon size={10} />
                              <span>{Math.abs(delta)}</span>
                          </div>
                      </div>
                      
                      {/* Objective Context */}
                      <div className={`text-[9px] font-bold mb-1 ${forceWhiteText ? 'text-white/60' : 'text-slate-400'}`}>
                          / obj. {objective}
                      </div>

                      <div className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md backdrop-blur-md flex items-center gap-1
                          ${metricConfig.bg} ${metricConfig.color} ring-1 inset-0 ${metricConfig.ring}
                      `}>
                          {person.drRate >= 15 && <Zap size={8} className="fill-current" />}
                          Quality: {person.qualityScore}%
                      </div>
                  </div>
              );
      }
  };

  // --- MAIN RENDER ---

  // Compact View
  if (density === 'compact') {
      return (
        <div 
          onClick={onClick}
          draggable={!isAlumni && !isLinkingMode} // Disable drag in link mode
          onDragStart={onDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            relative group flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 select-none overflow-hidden
            ${isHeatmapMode ? heatmapClass : `bg-white dark:bg-[var(--bg-card-solid)] hover:bg-slate-50 dark:hover:bg-slate-800 border-2 ${seniorityColors.border}`}
            ${isDragging ? 'opacity-50 scale-95 shadow-none' : 'shadow-sm hover:shadow-md hover:scale-[1.01] hover:-translate-y-0.5'}
            ${isSelected ? 'ring-2 ring-orange-500 z-10' : ''}
            ${showRelationships && !isDragging ? 'hover:ring-2 hover:ring-purple-400 hover:bg-purple-50 cursor-crosshair' : ''}
            ${isLinkingMode ? (isLinkSource ? 'ring-4 ring-purple-500 bg-purple-50 z-20 scale-105' : (canBeLinkTarget ? 'hover:ring-4 hover:ring-purple-300 hover:scale-105 cursor-crosshair' : 'opacity-60 grayscale-[0.5]')) : 'cursor-grab active:cursor-grabbing'}
          `}
        >

            <div className="relative flex-shrink-0">
                <img 
                    src={person.photoUrl} 
                    alt={person.name} 
                    className={`w-10 h-10 rounded-full object-cover shadow-sm border-2 ${forceWhiteText ? 'border-white/30' : 'border-white'}`}
                />
                {isLeader && (
                    <div className="absolute -top-1 -right-1 bg-amber-400 text-white p-0.5 rounded-full border border-white shadow-sm">
                        <Crown size={8} fill="currentColor" />
                    </div>
                )}
            </div>
            
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <h3 className={`font-bold text-sm pr-2 ${forceWhiteText ? 'text-white' : 'text-slate-900'}`}>{person.name}</h3>
                </div>
                <div className={`text-xs truncate ${forceWhiteText ? 'text-white/80' : 'text-slate-500'}`}>{person.role}</div>
            </div>

            <div className="flex-shrink-0">
                {isAlumni ? (
                    <div className={`text-[10px] font-bold ${forceWhiteText ? 'text-white' : 'text-slate-500'}`}>{person.returnDate}</div>
                ) : (
                    renderActiveRightContent('row')
                )}
            </div>
        </div>
      );
  }

  // Tiny View
  if (density === 'tiny') {
       return (
          <div 
            onClick={onClick}
            draggable={!isAlumni && !isLinkingMode}
            onDragStart={onDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`
                relative w-10 h-10 rounded-full transition-transform duration-200 hover:scale-110 shadow-sm
                ${isSelected ? 'ring-2 ring-orange-500 ring-offset-2' : ''}
                ${isHeatmapMode ? heatmapClass.replace('bg-', 'border-') + ' border-2' : `ring-2 ${seniorityColors.border} ring-offset-1`}
                ${showRelationships && !isDragging ? 'hover:ring-4 hover:ring-purple-400 cursor-crosshair' : ''}
                ${isLinkingMode ? (isLinkSource ? 'ring-4 ring-purple-500 scale-110 z-20' : (canBeLinkTarget ? 'hover:ring-4 hover:ring-purple-300 cursor-crosshair' : 'opacity-60')) : 'cursor-pointer'}
            `}
            title={`${person.name} - ${person.drRate}`}
          >
              <img src={person.photoUrl} className="w-full h-full rounded-full object-cover" alt={person.name} />
              {isLeader && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border border-white flex items-center justify-center">
                      <Crown size={6} className="text-white fill-current" />
                  </div>
              )}
          </div>
       );
  }

  // Standard View (Main)
  // Revert Alumni style to match Board style: Glassmorphism background, standard text colors unless heatmap
  return (
    <div
      onClick={onClick}
      draggable={!isAlumni && !isLinkingMode} 
      onDragStart={onDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        relative group rounded-2xl p-4 transition-all duration-300 select-none overflow-hidden
        ${isHeatmapMode ? heatmapClass : `bg-gradient-to-b from-white/90 to-white/50 dark:from-slate-800/90 dark:to-slate-800/50 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]`}
        ${isDragging ? 'opacity-40 scale-95 rotate-2 shadow-none' : 'hover:-translate-y-1 hover:scale-[1.02]'}
        ${isSelected ? 'ring-2 ring-orange-500 z-10' : ''}
        ${(person.isWarning || alertConfig) && !isHeatmapMode ? 'ring-1 ring-red-400/50 bg-red-50/50' : ''}
        ${!isHeatmapMode && !isSelected ? `border-2 ${seniorityColors.border}` : ''}
        ${showRelationships && !isDragging ? 'hover:ring-2 hover:ring-purple-400 hover:bg-purple-50 cursor-crosshair' : ''}
        ${isLinkingMode ? (isLinkSource ? 'ring-4 ring-purple-500 bg-purple-50 z-20 scale-105 shadow-xl' : (canBeLinkTarget ? 'hover:ring-4 hover:ring-purple-300 hover:scale-105 cursor-crosshair' : 'opacity-60 grayscale-[0.5]')) : 'cursor-grab active:cursor-grabbing'}
      `}
    >
      
      {/* New Arrival Badge */}
      {person.isNewArrival && !isHeatmapMode && (
          <div className="absolute top-0 right-0 bg-cyan-400 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-bl-xl shadow-sm z-20">
              New
          </div>
      )}

      {/* Top Section: Avatar & Info */}
      <div className="flex items-start gap-4 mb-4 relative z-10">
        <div className="relative">
             <div className="w-14 h-14 rounded-xl overflow-hidden shadow-lg border-2 border-white group-hover:shadow-xl transition-shadow">
                <img 
                    src={person.photoUrl} 
                    alt={person.name} 
                    className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110`} 
                />
             </div>
             {isLeader && (
                 <div className="absolute -top-2 -right-2 bg-gradient-to-br from-amber-300 to-amber-500 text-white p-1 rounded-lg shadow-md border border-white rotate-12 transform group-hover:rotate-0 transition-all">
                     <Crown size={10} fill="currentColor" />
                 </div>
             )}
        </div>

        <div className="flex-1 min-w-0 py-0.5">
            {/* Name - No Truncation */}
            <h3 className={`font-[800] text-[13px] leading-tight mb-0.5 whitespace-normal break-words ${forceWhiteText ? 'text-white' : 'text-slate-800'}`}>
                {person.name}
            </h3>
            <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${forceWhiteText ? 'text-white/80' : 'text-slate-400'}`}>
                {person.role.toUpperCase()}
            </div>
            
            <div className="flex flex-wrap gap-1">
                {/* Alert Badge */}
                {alertConfig && !isHeatmapMode && (
                    <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg border flex items-center gap-1 ${alertConfig.color}`}>
                        <alertConfig.icon size={8} />
                        {alertConfig.label}
                    </div>
                )}

                {/* NGO Experience Warning */}
                {showNgoWarning && !isHeatmapMode && (
                     <div className="text-[9px] font-bold px-1.5 py-0.5 rounded-lg border bg-orange-50 text-orange-600 border-orange-200 flex items-center gap-1" title="Jamais travaillé avec cette asso">
                        <Info size={8} />
                        New Asso
                    </div>
                )}

                {person.tags.slice(0, 1).map((tag, i) => (
                    <span
                        key={i}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg border
                           ${forceWhiteText
                               ? 'bg-white/20 border-white/30 text-white'
                               : (tag === 'Senior' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-100 text-slate-500 border-slate-200')}
                           flex items-center gap-1
                        `}
                    >
                        {tag === 'Senior' && <Zap size={8} fill="currentColor" />}
                        {tag}
                    </span>
                ))}
            </div>
        </div>
      </div>

      {/* Info Button - Hover Only */}
      <button 
        onClick={(e) => { e.stopPropagation(); onInfoClick(); }}
        className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0
            ${forceWhiteText ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white dark:bg-[var(--bg-card-solid)] text-slate-400 hover:text-orange-600 shadow-sm'}
        `}
      >
        <Info size={14} />
      </button>

      {/* Bottom Section: Metrics or Alumni Info */}
      <div className={`pt-3 border-t ${forceWhiteText ? 'border-white/20' : 'border-slate-100 dark:border-slate-800'}`}>
          <div className="flex items-center justify-between h-10">
              {isAlumni ? (
                  <>
                    <div className="flex flex-col justify-center">
                         <div className={`text-[9px] font-bold uppercase ${forceWhiteText ? 'text-white/70' : 'text-slate-400'} mb-1`}>
                             {person.tags.includes('Student') ? 'Étudiant' : 'Ancien'}
                         </div>
                         <div className={`text-xs font-bold ${forceWhiteText ? 'text-white bg-white/20' : 'text-slate-700 bg-slate-100/50'} px-2 py-1 rounded-md w-fit`}>
                             {person.tags.includes('Student') ? 'Vivier' : 'Indép.'}
                         </div>
                    </div>
                    {renderAlumniRightContent()}
                  </>
              ) : (
                  <>
                     <div className="flex items-center">
                         {viewMode === 'identity' && (
                             <div className="flex -space-x-2">
                                 {[1,2,3].map(i => (
                                     <div key={i} className={`w-6 h-6 rounded-full border-2 ${forceWhiteText ? 'border-white/20 bg-white/20' : 'border-white bg-slate-100'} flex items-center justify-center text-[8px] font-bold text-slate-400`}>
                                         <Clock size={10} />
                                     </div>
                                 ))}
                             </div>
                         )}
                         {viewMode === 'hr' && (
                            <div className="text-[10px] font-medium text-slate-400 leading-tight">
                                Contrat<br/>
                                <span className={forceWhiteText ? 'text-white' : 'text-slate-900'}>{person.startDate}</span>
                            </div>
                         )}
                         {viewMode === 'performance' && (
                            <div className="flex flex-col">
                                <span className={`text-[9px] font-bold uppercase ${forceWhiteText ? 'text-white/70' : 'text-slate-400'}`}>Objectif</span>
                                <div className={`h-1.5 w-16 rounded-full mt-1 ${forceWhiteText ? 'bg-white/30' : 'bg-slate-100'} overflow-hidden`}>
                                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min((person.drRate / objective) * 100, 100)}%` }}></div>
                                </div>
                            </div>
                         )}
                     </div>

                     {renderActiveRightContent('stack')}
                  </>
              )}
          </div>
      </div>
      
    </div>
  );
});
