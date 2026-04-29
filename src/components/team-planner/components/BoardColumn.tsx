import React, { useMemo, useState, useRef, useLayoutEffect, memo } from 'react';
import { Column, Person, Relationship } from '../types';
import { PersonCard } from './PersonCard';
import { Plus, MapPin, MoreHorizontal, UserPlus, Sun, Cloud, CloudRain, AlertOctagon, GripVertical, Car, Home, Flame, Handshake, Snowflake, Zap, Loader2 } from 'lucide-react';
import { ViewMode, ViewDensity } from '../TeamPlannerApp';
import { useWeather } from '@/hooks/useWeather';

interface BoardColumnProps {
  column: Column;
  cards: Person[];
  density: ViewDensity;
  viewMode: ViewMode;
  draggingCardId: string | null;
  highlightedCardId: string | null;
  selectedCardIds?: string[]; // New prop
  relationships?: Relationship[]; // Passed from App for conflict detection
  isHeatmapMode?: boolean; // Passed from App
  showRelationships?: boolean; // New prop for Link Mode
  isLinkingMode?: boolean; // New prop
  linkSourceId?: string | null; // New prop
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, targetColId: string) => void;
  onCardDragStart: (e: React.DragEvent<HTMLDivElement>, cardId: string, colId: string) => void;
  onLink?: (targetId: string) => void; // New prop for Link Mode
  
  // Column Dragging Props
  onColumnDragStart: (e: React.DragEvent<HTMLDivElement>, colId: string) => void;
  onColumnDrop: (e: React.DragEvent<HTMLDivElement>, targetColId: string) => void;

  onCardClick: (person: Person, e: React.MouseEvent) => void; // Updated signature
  onInfoClick: (person: Person) => void;
  onResize: (expanded: boolean) => void; 
  onHeaderClick: () => void;
}

// Updated Gradient Logic for NGO Colors
const getGradientHeader = (bgClass: string) => {
    // Specific NGO Colors
    if (bgClass.includes('cyan')) return 'bg-gradient-to-br from-cyan-400 via-cyan-500 to-orange-600'; // UNICEF
    if (bgClass.includes('emerald')) return 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-700'; // WWF
    if (bgClass.includes('green')) return 'bg-gradient-to-br from-green-500 via-green-600 to-emerald-700'; // Greenpeace
    if (bgClass.includes('yellow')) return 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600'; // Amnesty
    
    // Generic Fallbacks
    if (bgClass.includes('orange-700')) return 'bg-gradient-to-br from-orange-700 via-orange-800 to-orange-900';
    if (bgClass.includes('blue')) return 'bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700';
    if (bgClass.includes('red')) return 'bg-gradient-to-br from-red-500 via-rose-600 to-pink-700';
    if (bgClass.includes('purple')) return 'bg-gradient-to-br from-purple-500 via-violet-600 to-orange-700';
    if (bgClass.includes('orange')) return 'bg-gradient-to-br from-orange-400 via-orange-500 to-red-600';
    
    return 'bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800';
}

// Use Memo to prevent full re-renders of the board when a single card is dragged
export const BoardColumn = memo<BoardColumnProps>(({
  column,
  cards,
  density,
  viewMode,
  draggingCardId,
  highlightedCardId,
  selectedCardIds = [], // Default to empty array
  relationships = [],
  isHeatmapMode = false,
  showRelationships = false,
  isLinkingMode = false,
  linkSourceId = null,
  onDragOver,
  onDrop,
  onCardDragStart,
  onColumnDragStart,
  onColumnDrop,
  onCardClick,
  onInfoClick,
  onHeaderClick,
  onLink
}) => {
  const [isOver, setIsOver] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [isDraggingColumn, setIsDraggingColumn] = useState(false);
  
  const averageDr = useMemo(() => {
    if (cards.length === 0) return 0;
    const total = cards.reduce((acc, card) => acc + (card.drRate || 0), 0);
    return (total / cards.length).toFixed(1);
  }, [cards]);

  // --- SYNERGY & CONFLICT LOGIC ---
  const { synergyScore, teamVibe, conflictData } = useMemo(() => {
      let score = 50; // Base score
      let conflicts = 0;
      let affinities = 0;
      let draggingConflict = false;
      let draggingAffinity = false;

      // Internal relationships
      relationships.forEach(rel => {
          const sourceInTeam = cards.some(c => c.id === rel.sourceId);
          const targetInTeam = cards.some(c => c.id === rel.targetId);
          
          if (sourceInTeam && targetInTeam) {
              if (rel.type === 'conflict') {
                  score -= 20;
                  conflicts++;
              } else if (rel.type === 'affinity') {
                  score += 15;
                  affinities++;
              }
          }
      });

      // Dragging preview logic
      if (isOver && draggingCardId) {
          relationships.forEach(rel => {
              if (rel.sourceId === draggingCardId || rel.targetId === draggingCardId) {
                  const otherId = rel.sourceId === draggingCardId ? rel.targetId : rel.sourceId;
                  if (cards.some(c => c.id === otherId)) {
                      if (rel.type === 'conflict') {
                          score -= 20;
                          draggingConflict = true;
                      } else if (rel.type === 'affinity') {
                          score += 15;
                          draggingAffinity = true;
                      }
                  }
              }
          });
      }

      score = Math.max(0, Math.min(100, score));

      let vibe: 'explosif' | 'soudé' | 'froid' | 'neutre' = 'neutre';
      if (conflicts > 0 || draggingConflict) vibe = 'explosif';
      else if (affinities > 1 || draggingAffinity) vibe = 'soudé';
      else if (cards.length > 2 && affinities === 0) vibe = 'froid';

      return { 
          synergyScore: score, 
          teamVibe: vibe,
          conflictData: { hasConflict: conflicts > 0 || draggingConflict, draggingConflict, draggingAffinity }
      };
  }, [cards, relationships, isOver, draggingCardId]);

  // --- Grid Slot Logic ---
  const targetCapacity = 10; 
  const showAddButton = cards.length < targetCapacity;

  // --- AUTO ZOOM LOGIC ---
  useLayoutEffect(() => {
    if (density === 'standard' || !scrollContainerRef.current) {
        setZoomScale(1);
        return;
    }

    const calculateScale = () => {
        if (!scrollContainerRef.current) return;
        const availableHeight = scrollContainerRef.current.clientHeight;
        
        let contentHeight = 0;
        const BUFFER = 20; 
        
        if (density === 'compact') {
            const CARD_HEIGHT = 64;
            const GAP = 8;
            const PADDING_Y = 16; 
            contentHeight = PADDING_Y + (cards.length * (CARD_HEIGHT + GAP));
            if (showAddButton) contentHeight += 32 + GAP; 
        } else if (density === 'tiny') {
            const CARD_HEIGHT = 40; 
            const MARGIN_Y = 8; 
            const PADDING_Y = 8; 
            contentHeight = PADDING_Y + (cards.length * (CARD_HEIGHT + MARGIN_Y));
        }
        contentHeight += BUFFER;

        if (contentHeight > availableHeight && availableHeight > 100) {
            setZoomScale(Math.min(availableHeight / contentHeight, 1));
        } else {
            setZoomScale(1);
        }
    };

    calculateScale();
    const observer = new ResizeObserver(calculateScale);
    if (scrollContainerRef.current) observer.observe(scrollContainerRef.current);
    return () => observer.disconnect();
  }, [cards.length, density, showAddButton]);


  const isDimmed = draggingCardId !== null && !isOver;
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      // Only highlight if dragging a card (not a column) or if specifically designed
      if (e.dataTransfer.types.includes('card')) {
        setIsOver(true);
      }
      if (e.dataTransfer.types.includes('column') && draggingCardId === null) {
          setIsOver(true);
      }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsOver(false);
      }
  };

  const handleDropLocal = (e: React.DragEvent<HTMLDivElement>, colId: string) => {
      setIsOver(false);
      
      const type = e.dataTransfer.getData('type');
      if (type === 'column') {
          onColumnDrop(e, colId);
      } else {
          onDrop(e, colId);
      }
  }

  const handleColumnDragStartLocal = (e: React.DragEvent<HTMLDivElement>) => {
      setIsDraggingColumn(true);
      onColumnDragStart(e, column.id);
  }

  const handleColumnDragEndLocal = () => {
      setIsDraggingColumn(false);
  }

  const gradientClass = getGradientHeader(column.color);

  // Mission Data Helpers
  const zoneName = column.missionData?.zone.name || 'Zone Inconnue';
  const shortZone = zoneName.substring(0, 3).toUpperCase();

  // Real weather from API (uses zone coordinates if available)
  const zoneLat = column.missionData?.zone.lat;
  const zoneLng = column.missionData?.zone.lng;
  const { data: weatherData, isLoading: weatherLoading } = useWeather(zoneLat, zoneLng);
  const weatherTemp = weatherData?.current.temperature ?? (column.missionData?.zone.weather.temp || 0);
  const weatherCondition = weatherData?.current.condition ?? '';
  const weatherIcon = weatherData?.current.icon;
  
  // Height for Ghost Placeholder
  const ghostHeight = density === 'compact' ? 'h-[64px]' : (density === 'tiny' ? 'h-10 w-10 rounded-full' : 'h-[120px]');

  const widthClass = density === 'compact' ? 'min-w-[220px] w-[220px]' : (density === 'tiny' ? 'min-w-[72px] w-[72px]' : 'min-w-[360px] w-[360px]');
  const gapClass = density === 'compact' ? 'gap-2' : (density === 'tiny' ? 'gap-2' : 'gap-3');
  const overflowClass = 'overflow-y-auto custom-scrollbar-light';

  return (
    <div 
      onDragOver={onDragOver}
      onDrop={(e) => handleDropLocal(e, column.id)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      className={`
        relative flex flex-col h-full max-h-full transition-all duration-300 cubic-bezier(0.2, 0.8, 0.2, 1)
        ${widthClass}
        ${density === 'tiny' ? 'rounded-full' : 'rounded-[32px]'}
        
        /* Column Container Glass Effect */
        bg-slate-100/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/40 dark:border-slate-700/40
        shadow-[0_4px_30px_rgba(0,0,0,0.03)]

        ${isOver ? (conflictData.hasConflict ? 'ring-2 ring-red-500 bg-red-50/80 dark:bg-red-900/30 scale-[1.01]' : 'ring-2 ring-orange-500/50 scale-[1.005] bg-orange-50/50 dark:bg-orange-900/30') : ''}
        ${isDimmed ? 'opacity-50 blur-[1px]' : 'opacity-100'}
        ${isDraggingColumn ? 'opacity-30 scale-95' : 'opacity-100'}
      `}
    >
      {/* --- COLUMN HEADER (DRAGGABLE) --- */}
      <div 
          onClick={onHeaderClick}
          draggable={density !== 'tiny'} // Only draggable in standard/compact
          onDragStart={handleColumnDragStartLocal}
          onDragEnd={handleColumnDragEndLocal}
          className={`
            relative flex-shrink-0 overflow-hidden cursor-grab active:cursor-grabbing group select-none shadow-lg transition-colors
            ${conflictData.hasConflict && isOver ? 'bg-red-600' : gradientClass}
            ${density === 'tiny' ? 'h-[72px] rounded-full flex items-center justify-center p-0 mb-4 mt-0 mx-0 aspect-square' : 'rounded-t-[32px]'}
            ${density === 'compact' ? 'p-4' : (density === 'standard' ? 'p-6' : '')}
          `}
      >
          {/* Noise Texture */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
          
          {/* Conflict Warning Overlay */}
          {conflictData.hasConflict && isOver && (
             <div className="absolute inset-0 flex items-center justify-center bg-red-600/90 z-20 animate-pulse">
                <div className="flex flex-col items-center text-white">
                    <AlertOctagon size={32} />
                    <span className="text-xs font-black uppercase mt-1">Conflit !</span>
                </div>
             </div>
          )}

          {/* STANDARD & COMPACT HEADER CONTENT */}
          {density !== 'tiny' && !conflictData.hasConflict && (
              <div className="relative z-10 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                           {/* Drag Handle Indicator (Subtle) */}
                           <GripVertical size={14} className="text-white/40 mr-1" />
                           <span className="flex items-center gap-1.5 text-[10px] font-bold text-white uppercase tracking-[0.15em] opacity-90 truncate max-w-[140px] bg-black/10 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-sm">
                               <MapPin size={10} strokeWidth={3} /> {zoneName}
                           </span>
                      </div>
                      
                      {/* Weather + Vibe */}
                      <div className="flex items-center gap-1.5">
                        {weatherLoading ? (
                          <div className="bg-black/20 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-sm">
                            <Loader2 size={10} className="animate-spin text-white/60" />
                          </div>
                        ) : weatherData ? (
                          <div className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-sm text-[9px] font-bold text-white/90" title={weatherCondition}>
                            <span>{Math.round(weatherTemp)}°</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Vibe Indicator */}
                      <div className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-sm" title={`Ambiance: ${teamVibe}`}>
                          {teamVibe === 'explosif' && <Flame size={12} className="text-red-400 animate-pulse" />}
                          {teamVibe === 'soudé' && <Handshake size={12} className="text-emerald-400" />}
                          {teamVibe === 'froid' && <Snowflake size={12} className="text-orange-300" />}
                          {teamVibe === 'neutre' && <Zap size={12} className="text-yellow-400" />}
                      </div>
                  </div>
                  
                  <div className="py-1">
                      <h2 className={`font-[800] text-white leading-none tracking-tighter drop-shadow-md font-sans ${density === 'compact' ? 'text-xl' : 'text-3xl'}`}>
                          {column.title.split(' ').slice(0, 2).join(' ')}
                      </h2>
                      <div className="text-[10px] font-bold text-orange-50 uppercase tracking-widest mt-1 opacity-80 pl-0.5">{column.title.split(' ').slice(2).join(' ')}</div>
                  </div>
                  
                  <div className={`flex items-end justify-between border-t border-white/10 ${density === 'compact' ? 'pt-3 mt-1' : 'pt-4 mt-2'}`}>
                      <div className="flex items-center gap-3">
                          {/* Synergy Score Bar */}
                          <div className="flex flex-col gap-0.5 w-16">
                              <div className="flex justify-between text-[9px] font-bold text-white/80 uppercase">
                                  <span>Synergie</span>
                                  <span>{synergyScore}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                                  <div 
                                      className={`h-full rounded-full transition-all duration-500 ${synergyScore > 75 ? 'bg-emerald-400' : synergyScore < 40 ? 'bg-red-400' : 'bg-yellow-400'}`}
                                      style={{ width: `${synergyScore}%` }}
                                  />
                              </div>
                          </div>
                          
                          {/* Logistics Gauges */}
                          <div className="flex items-center gap-1.5">
                                {/* Car Gauge */}
                                <div className="flex items-center gap-1 bg-black/20 px-1.5 py-1 rounded-md border border-white/10 backdrop-blur-sm" title={`Voiture: ${column.missionData?.car.seats || 5} places`}>
                                    <Car size={10} className={`text-white/80 ${cards.length > (column.missionData?.car.seats || 5) ? 'text-red-400 animate-pulse' : ''}`} />
                                    <div className="flex gap-0.5">
                                        {Array.from({ length: column.missionData?.car.seats || 5 }).map((_, i) => (
                                            <div 
                                                key={i} 
                                                className={`w-0.5 h-1.5 rounded-sm ${i < cards.length ? (cards.length > (column.missionData?.car.seats || 5) ? 'bg-red-400' : 'bg-white') : 'bg-white/20'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                {/* Housing Gauge */}
                                <div className="flex items-center gap-1 bg-black/20 px-1.5 py-1 rounded-md border border-white/10 backdrop-blur-sm" title={`Logement: ${column.missionData?.housing.capacity || 6} lits`}>
                                    <Home size={10} className={`text-white/80 ${cards.length > (column.missionData?.housing.capacity || 6) ? 'text-red-400 animate-pulse' : ''}`} />
                                    <div className="flex gap-0.5">
                                        {Array.from({ length: column.missionData?.housing.capacity || 6 }).map((_, i) => (
                                            <div 
                                                key={i} 
                                                className={`w-0.5 h-1.5 rounded-sm ${i < cards.length ? (cards.length > (column.missionData?.housing.capacity || 6) ? 'bg-red-400' : 'bg-white') : 'bg-white/20'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                          </div>
                      </div>
                      <div className={`flex items-center justify-center rounded-full bg-white dark:bg-[var(--bg-card-solid)] text-slate-900 dark:text-white shadow-[0_4px_10px_rgba(0,0,0,0.1)] ${density === 'compact' ? 'w-6 h-6 text-xs' : 'w-9 h-9 text-sm'}`}>
                          <span className="font-black">{cards.length}</span>
                      </div>
                  </div>
              </div>
          )}
          
           {/* TINY HEADER */}
          {density === 'tiny' && (
              <div className="relative z-10 flex flex-col items-center justify-center text-white">
                  <span className="text-[10px] font-black uppercase tracking-tight leading-none drop-shadow-md">{shortZone}</span>
                  <div className="mt-1 w-5 h-5 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-900 dark:text-white text-[10px] font-black flex items-center justify-center shadow-lg border border-white/50 dark:border-slate-600">
                      {cards.length}
                  </div>
              </div>
          )}
      </div>

      {/* --- SCROLLABLE BODY --- */}
      <div 
        ref={scrollContainerRef}
        className={`flex-1 overflow-x-hidden ${overflowClass} ${density === 'tiny' ? 'p-1 px-2 flex flex-col items-center' : (density === 'compact' ? 'p-2' : 'p-4')}`}
      >
          <div
            style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center', width: density === 'tiny' ? 'auto' : `${100 / zoomScale}%` }}
            className={`flex flex-col transition-transform duration-300 ease-out ${gapClass} ${density === 'tiny' ? 'items-center' : 'w-full'}`}
          >
              {cards.map((card, index) => {
                  const isFeatured = index === 0 && (card.role === 'Teamleader');
                  return (
                      <PersonCard
                          key={card.id}
                          person={card}
                          index={index}
                          totalCards={cards.length}
                          isDragging={draggingCardId === card.id || (selectedCardIds?.includes(card.id) && draggingCardId !== null)}
                          isFeatured={isFeatured}
                          isSelected={highlightedCardId === card.id || selectedCardIds?.includes(card.id)}
                          density={density}
                          viewMode={viewMode}
                          isHeatmapMode={isHeatmapMode}
                          showRelationships={showRelationships}
                          isLinkingMode={isLinkingMode}
                          linkSourceId={linkSourceId}
                          onLink={onLink}
                          onDragStart={(e) => onCardDragStart(e, card.id, column.id)}
                          onClick={(e) => onCardClick(card, e)} // Pass event
                          onInfoClick={() => onInfoClick(card)}
                      />
                  );
              })}

              {/* --- GHOST DROP PLACEHOLDER --- */}
              {isOver && draggingCardId && !cards.find(c => c.id === draggingCardId) && (
                  <div className={`
                    border-2 border-dashed rounded-[20px] flex-shrink-0 animate-pulse flex items-center justify-center
                    ${conflictData.draggingConflict ? 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-500' : (conflictData.draggingAffinity ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500' : 'border-slate-300/60 dark:border-slate-600/60 bg-slate-50/50 dark:bg-slate-800/50')}
                    ${ghostHeight}
                    ${density === 'tiny' ? 'my-1' : ''}
                  `}>
                      {conflictData.draggingConflict && <span className="text-xs font-bold">Conflit !</span>}
                      {conflictData.draggingAffinity && <span className="text-xs font-bold">Synergie +</span>}
                  </div>
              )}

              {/* Add Button */}
              {showAddButton && density !== 'tiny' && (
                  <button className={`
                      group relative border border-dashed border-slate-300/60 dark:border-slate-600/60 hover:border-orange-500/50 hover:bg-orange-50/50 dark:hover:bg-orange-900/30 transition-all duration-300 flex items-center justify-center flex-shrink-0
                      ${density === 'compact' ? 'w-full h-8 rounded-xl' : 'w-full h-[70px] rounded-[24px]'}
                  `}>
                       <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 group-hover:text-orange-600 dark:group-hover:text-orange-400 font-bold transition-transform group-hover:scale-110">
                           <UserPlus size={density === 'compact' ? 14 : 20} />
                       </div>
                  </button>
              )}
              {density === 'standard' && <div className="h-4 w-full flex-shrink-0"></div>}
          </div>
      </div>
    </div>
  );
});
