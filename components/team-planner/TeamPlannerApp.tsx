
import React, { useState, useMemo, useEffect } from 'react';
import { initialData, alumniData, generateIncomingPeople } from './constants';
import { BoardData, Person, Column, FilterState, Relationship } from './types';
import { InspectorPanel } from './components/InspectorPanel';
import { MissionInspector } from './components/MissionInspector';
import { BoardColumn } from './components/BoardColumn';
import { Navbar, PageMode } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { ConnectionLayer } from './components/ConnectionLayer';
import { DynamicIsland } from './components/DynamicIsland';
import { CommandPalette } from './components/CommandPalette';
import { AlumniView } from './components/AlumniView'; // New Import
import { MapView } from './components/MapView';
import { LayoutGrid, Rows, GitMerge, Grip, Maximize, Minimize, MapPin, Handshake, Flame, Zap } from 'lucide-react';

export type ViewMode = 'performance' | 'identity' | 'hr';
export type ViewDensity = 'standard' | 'compact' | 'tiny';

const getWeekDateRange = (weekOffset: number) => {
    const baseDate = new Date(2025, 0, 19); 
    const targetDate = new Date(baseDate);
    targetDate.setDate(baseDate.getDate() + (weekOffset * 7));
    
    const endDate = new Date(targetDate);
    endDate.setDate(targetDate.getDate() + 6);

    const startStr = targetDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const endStr = endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

    // Calculate absolute week number
    const startOfYear = new Date(2025, 0, 1);
    const diff = targetDate.getTime() - startOfYear.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const weekNumber = Math.ceil((diff + oneWeek) / oneWeek);

    return {
        label: `Semaine ${weekNumber}`,
        dates: `Du ${startStr} au ${endStr}`
    };
};

export default function App() {
  const [weeksData, setWeeksData] = useState<Record<number, BoardData>>({ 0: initialData });
  const [currentWeekIndex, setCurrentWeekIndex] = useState<number>(0);
  const [incomingPeople, setIncomingPeople] = useState<Person[]>(generateIncomingPeople(8)); // Generate 8 incoming people
  const [departingPeople, setDepartingPeople] = useState<Person[]>([]); // New: Departing people
  
  // Page Mode (Board vs Alumni)
  const [pageMode, setPageMode] = useState<PageMode>('board');

  // Density & View
  const [density, setDensity] = useState<ViewDensity>('standard');
  const [showRelationships, setShowRelationships] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('performance');
  
  // Power User Features
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isHeatmapMode, setIsHeatmapMode] = useState(false);
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [isLinkingMode, setIsLinkingMode] = useState(false); // New state
  const [linkSourceId, setLinkSourceId] = useState<string | null>(null); // New state

  const [searchQuery, setSearchQuery] = useState('');
  
  // Filtering State
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
      roles: [],
      contractStatus: [],
      tags: [],
      ngos: []
  });
  
  // Undo/Redo & History State
  const [history, setHistory] = useState<{ past: BoardData[], future: BoardData[] }>({ past: [], future: [] });
  const [actionLog, setActionLog] = useState<string[]>([]);
  
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<Column | null>(null);

  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [highlightedCardId, setHighlightedCardId] = useState<string | null>(null);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]); // New: Multi-select state

  const currentData = weeksData[currentWeekIndex] || initialData;

  // --- SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setIsCommandOpen(prev => !prev);
        }
        // Clear selection on Escape
        if (e.key === 'Escape') {
            setSelectedCardIds([]);
            setHighlightedCardId(null);
            setSelectedPerson(null);
            setLinkSourceId(null); // Clear link source
            if (isLinkingMode) setIsLinkingMode(false); // Optional: Exit link mode? No, keep it.
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLinkingMode]);

  // --- MULTI-SELECT & LINKING HANDLER ---
  const handleCardClick = (person: Person, e: React.MouseEvent) => {
      e.stopPropagation();
      
      if (isLinkingMode) {
          if (linkSourceId === null) {
              setLinkSourceId(person.id);
              setActionLog(prev => [`Source de liaison: ${person.name}`, ...prev]);
          } else if (linkSourceId === person.id) {
              setLinkSourceId(null); // Deselect
          } else {
              // Target selected -> Open Modal
              setRelationshipCreation({ sourceId: linkSourceId, targetId: person.id });
              setLinkSourceId(null); // Reset after selection
          }
          return;
      }

      if (e.metaKey || e.ctrlKey) {
          // Toggle selection
          setSelectedCardIds(prev => {
              if (prev.includes(person.id)) return prev.filter(id => id !== person.id);
              return [...prev, person.id];
          });
      } else {
          // Single select (or clear others)
          setSelectedPerson(person);
          setHighlightedCardId(person.id);
          setSelectedCardIds([person.id]);
      }
  };

  // --- HISTORY MANAGEMENT ---
  const addToHistory = (newData: BoardData, action: string) => {
      setHistory(prev => ({
          past: [...prev.past, currentData],
          future: []
      }));
      setWeeksData(prev => ({ ...prev, [currentWeekIndex]: newData }));
      setActionLog(prev => [action, ...prev].slice(0, 50)); 
  };

  const handleUndo = () => {
      if (history.past.length === 0) return;
      const previous = history.past[history.past.length - 1];
      const newPast = history.past.slice(0, -1);
      
      setHistory({
          past: newPast,
          future: [currentData, ...history.future]
      });
      setWeeksData(prev => ({ ...prev, [currentWeekIndex]: previous }));
      setActionLog(prev => ["↩️ Annulation", ...prev]);
  };

  const handleRedo = () => {
      if (history.future.length === 0) return;
      const next = history.future[0];
      const newFuture = history.future.slice(1);

      setHistory({
          past: [...history.past, currentData],
          future: newFuture
      });
      setWeeksData(prev => ({ ...prev, [currentWeekIndex]: next }));
      setActionLog(prev => ["↩️ Rétablissement", ...prev]);
  };

  // --- ACTIONS ---

  const handleDuplicateWeek = () => {
      const newWeekIndex = currentWeekIndex + 1;
      
      // 1. Deep copy current data
      const newColumns: Record<string, Column> = {};
      const newCards: Record<string, Person> = {};
      
      // Copy cards (excluding departing people)
      (Object.values(currentData.cards) as Person[]).forEach(card => {
          if (!departingPeople.some(p => p.id === card.id)) {
              newCards[card.id] = { ...card };
          }
      });

      // Copy columns and update cardIds
      (Object.values(currentData.columns) as Column[]).forEach(col => {
          newColumns[col.id] = {
              ...col,
              cardIds: col.cardIds.filter(id => newCards[id]) // Only keep cards that weren't removed
          };
      });

      // 2. Add Incoming People to the first column (Unassigned/First Team)
      const firstColId = currentData.columnOrder[0];
      incomingPeople.forEach(p => {
          newCards[p.id] = { ...p, isNewArrival: true }; // Ensure they are marked
          newColumns[firstColId].cardIds.push(p.id);
      });

      const newBoardData: BoardData = {
          columns: newColumns,
          cards: newCards,
          columnOrder: [...currentData.columnOrder],
          relationships: [...currentData.relationships]
      };

      setWeeksData(prev => ({
          ...prev,
          [newWeekIndex]: newBoardData
      }));
      
      // Reset Flux State
      setIncomingPeople(generateIncomingPeople(5)); // Generate new random arrivals for the *following* week
      setDepartingPeople([]); // Clear departures
      
      setCurrentWeekIndex(newWeekIndex);
      setActionLog(prev => [`Semaine dupliquée (Arrivées: +${incomingPeople.length}, Départs: -${departingPeople.length})`, ...prev]);
  };

  const handleColumnResize = (colId: string, expanded: boolean) => {
      const column = currentData.columns[colId];
      const newData = {
          ...currentData,
          columns: {
              ...currentData.columns,
              [colId]: { ...column, isExpanded: expanded }
          }
      };
      addToHistory(newData, expanded ? `Extension équipe ${column.title}` : `Réduction équipe ${column.title}`);
  };

  const handleUpdateColumn = (columnId: string, updates: Partial<Column> | any) => {
    // Handle specific MissionData updates if passed nested
    const column = currentData.columns[columnId];
    let newColumn = { ...column, ...updates };
    
    // Deep merge for missionData if present in updates (simplified for this use case)
    if (updates.missionData) {
        newColumn.missionData = {
            ...column.missionData!,
            ...updates.missionData,
            zone: { ...column.missionData!.zone, ...updates.missionData.zone },
            car: { ...column.missionData!.car, ...updates.missionData.car },
            housing: { ...column.missionData!.housing, ...updates.missionData.housing }
        };
    }

    const newData = {
        ...currentData,
        columns: {
            ...currentData.columns,
            [columnId]: newColumn
        }
    };
    addToHistory(newData, `Modification équipe ${column.title}`);
    // Update local selection to reflect changes immediately in modal
    setSelectedColumn(newColumn);
  };

  const handlePrevWeek = () => { if (currentWeekIndex > 0) setCurrentWeekIndex(currentWeekIndex - 1); };
  const handleNextWeek = () => { if (weeksData[currentWeekIndex + 1]) setCurrentWeekIndex(currentWeekIndex + 1); };

  const columns = Object.values(currentData.columns) as Column[];
  const totalCards = columns.reduce((acc, col) => acc + col.cardIds.length, 0);
  const totalSlots = columns.reduce((acc, col) => acc + (col.isExpanded ? 10 : 5), 0);
  const fillRate = totalSlots > 0 ? Math.round((totalCards / totalSlots) * 100) : 0;
  
  const totalScore = columns.reduce((acc, col) => {
      return acc + col.cardIds.reduce((sum, id) => sum + (currentData.cards[id]?.drRate || 0), 0);
  }, 0);
  const averageScore = totalCards > 0 ? +(totalScore / totalCards).toFixed(1) : 0;

  const redZones = columns.filter(col => col.cardIds.length < 3).length;

  // --- FILTER HELPERS ---
  const handleFilterChange = (key: keyof FilterState, value: string) => {
      setFilters(prev => {
          const current = prev[key];
          if (current.includes(value)) {
              return { ...prev, [key]: current.filter(item => item !== value) };
          } else {
              return { ...prev, [key]: [...current, value] };
          }
      });
  };

  const handleClearFilters = () => {
      setFilters({ roles: [], contractStatus: [], tags: [], ngos: [] });
  };

  // Extract available NGO names for the filter
  const availableNgos = useMemo(() => {
      const set = new Set<string>();
      (Object.values(currentData.columns) as Column[]).forEach(col => {
          const ngo = col.title.split(' ')[0];
          if(ngo) set.add(ngo);
      });
      return Array.from(set);
  }, [currentData]);


  // --- DRAG AND DROP (CARDS) ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, cardId: string, sourceColId: string) => {
    // If dragging a card that is NOT in the selection, reset selection to just this card
    if (!selectedCardIds.includes(cardId)) {
        setSelectedCardIds([cardId]);
    }
    
    setDraggingCardId(cardId);
    e.dataTransfer.setData('cardId', cardId);
    e.dataTransfer.setData('sourceColId', sourceColId);
    e.dataTransfer.setData('type', 'card'); // Mark as card
    e.dataTransfer.effectAllowed = 'move';
    setHighlightedCardId(null);
  };

  const handleIncomingDragStart = (e: React.DragEvent<HTMLDivElement>, cardId: string) => {
      e.dataTransfer.setData('cardId', cardId);
      e.dataTransfer.setData('sourceColId', 'incoming'); // Special ID for incoming
      e.dataTransfer.setData('type', 'card');
      setDraggingCardId(cardId);
  };

  const handleDepartureDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const cardId = e.dataTransfer.getData('cardId');
      if (!cardId) return;

      // Find the person in current board
      let person: Person | undefined;
      (Object.values(currentData.cards) as Person[]).forEach(p => {
          if (p.id === cardId) person = p;
      });

      if (person) {
          // Check if already in departing
          if (!departingPeople.some(p => p.id === person!.id)) {
              setDepartingPeople(prev => [...prev, person!]);
              setActionLog(prev => [`Départ planifié pour ${person!.name}`, ...prev]);
          }
      }
      setDraggingCardId(null);
  };

  const handleRemoveDeparture = (personId: string) => {
      setDepartingPeople(prev => prev.filter(p => p.id !== personId));
  };

  // --- RELATIONSHIP LINKING ---
  const handleLink = (targetId: string) => {
      if (!draggingCardId || draggingCardId === targetId) return;
      
      // Check if relationship already exists
      const existingRel = currentData.relationships.find(r => 
          (r.sourceId === draggingCardId && r.targetId === targetId) ||
          (r.sourceId === targetId && r.targetId === draggingCardId)
      );

      if (existingRel) {
          // Toggle or remove? For now, let's just notify
          alert('Une relation existe déjà entre ces personnes.');
          return;
      }

      // Simple prompt for now (could be a modal)
      // In a real app, use a proper UI dialog
      const type = window.confirm(`Créer une relation entre ces personnes ?\n\nOK pour "Affinité" (Vert)\nAnnuler pour "Conflit" (Rouge)`) 
          ? 'affinity' 
          : 'conflict';
      
      // Wait, confirm/cancel is binary. User might want to cancel the action.
      // Let's use a custom small overlay or just default to affinity and let them change it?
      // Or use window.prompt?
      // "affinity", "conflict", "synergy"
      
      // Let's just add "Affinity" by default for now, or cycle?
      // User asked for "quick input".
      // Let's try: Left click drop = Affinity, Right click drop? No.
      
      // Let's just add it as Affinity and show a toast saying "Affinity created. Click to change."
      // But we don't have a toast system yet.
      
      // Let's use a simple confirm for Conflict vs Affinity.
      // Actually, let's use a cleaner approach:
      // If we drop, we add an 'affinity'. If they want conflict, they can edit it (if we had edit UI).
      // But user specifically asked for "friendship/conflict".
      
      // Hacky but effective for prototype:
      // Use a custom state to show a "Relationship Creator" modal.
      setRelationshipCreation({ sourceId: draggingCardId, targetId });
  };

  const [relationshipCreation, setRelationshipCreation] = useState<{sourceId: string, targetId: string} | null>(null);

  const confirmRelationship = (type: 'affinity' | 'conflict' | 'synergy') => {
      if (!relationshipCreation) return;
      
      const newRel: Relationship = {
          id: `rel-${Date.now()}`,
          sourceId: relationshipCreation.sourceId,
          targetId: relationshipCreation.targetId,
          type
      };
      
      const newData = {
          ...currentData,
          relationships: [...currentData.relationships, newRel]
      };
      
      addToHistory(newData, `Nouvelle relation: ${type}`);
      setRelationshipCreation(null);
      setDraggingCardId(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetColId: string) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('cardId');
    const sourceColId = e.dataTransfer.getData('sourceColId');

    if (!cardId || !sourceColId || sourceColId === targetColId) {
        setDraggingCardId(null);
        return;
    }

    // Handle Drop from Incoming
    if (sourceColId === 'incoming') {
        const personIndex = incomingPeople.findIndex(p => p.id === cardId);
        if (personIndex === -1) return;

        const person = { ...incomingPeople[personIndex], isNewArrival: true }; // Mark as new arrival
        
        // Remove from incoming
        const newIncoming = [...incomingPeople];
        newIncoming.splice(personIndex, 1);
        setIncomingPeople(newIncoming);

        // Add to board
        const newData = { ...currentData };
        // Add card to global cards
        newData.cards[person.id] = person;
        // Add to target column
        const targetCol = newData.columns[targetColId];
        newData.columns[targetColId] = {
            ...targetCol,
            cardIds: [...targetCol.cardIds, person.id]
        };

        addToHistory(newData, `Ajout de ${person.name} depuis les arrivées vers ${targetCol.title}`);
        setDraggingCardId(null);
        return;
    }

    const sourceCol = currentData.columns[sourceColId];
    const targetCol = currentData.columns[targetColId];
    
    // Determine which cards to move
    const cardsToMove = selectedCardIds.includes(cardId) ? selectedCardIds : [cardId];
    
    // Filter out cards that are not in the source column (sanity check)
    const validCardIds = cardsToMove.filter(id => sourceCol.cardIds.includes(id));
    
    if (validCardIds.length === 0) return;

    const newSourceCardIds = sourceCol.cardIds.filter(id => !validCardIds.includes(id));
    const newTargetCardIds = [...targetCol.cardIds, ...validCardIds];

    const newData = {
      ...currentData,
      columns: {
        ...currentData.columns,
        [sourceColId]: { ...sourceCol, cardIds: newSourceCardIds },
        [targetColId]: { ...targetCol, cardIds: newTargetCardIds },
      },
    };

    const personNames = validCardIds.map(id => currentData.cards[id].name).join(', ');
    addToHistory(newData, `Déplacement de ${validCardIds.length > 1 ? `${validCardIds.length} personnes` : personNames} vers ${targetCol.title}`);
    
    setDraggingCardId(null);
    setSelectedCardIds([]); // Clear selection after drop
  };

  // --- DRAG AND DROP (COLUMNS) ---
  const handleColumnDragStart = (e: React.DragEvent<HTMLDivElement>, colId: string) => {
      e.dataTransfer.setData('colId', colId);
      e.dataTransfer.setData('type', 'column'); // Mark as column
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleColumnDrop = (e: React.DragEvent<HTMLDivElement>, targetColId: string) => {
      e.preventDefault();
      const sourceColId = e.dataTransfer.getData('colId');
      if (!sourceColId || sourceColId === targetColId) return;

      const newColumnOrder = [...currentData.columnOrder];
      const sourceIndex = newColumnOrder.indexOf(sourceColId);
      const targetIndex = newColumnOrder.indexOf(targetColId);

      newColumnOrder.splice(sourceIndex, 1);
      newColumnOrder.splice(targetIndex, 0, sourceColId);

      const newData = {
          ...currentData,
          columnOrder: newColumnOrder
      };
      
      const colTitle = currentData.columns[sourceColId].title;
      addToHistory(newData, `Déplacement équipe ${colTitle}`);
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setHighlightedCardId(null);
    }
  };

  const handleAddToIncoming = (person: Person) => {
      // Check if already in incoming
      if (incomingPeople.some(p => p.id === person.id)) return;
      
      // Create a copy with new arrival status
      const newPerson = { 
          ...person, 
          id: `returning-${person.id}-${Date.now()}`, // Ensure unique ID
          isNewArrival: true,
          isAlumni: false, // Convert from alumni to active
          weeksOfExperience: person.weeksOfExperience || 20, // Assume senior
          tags: [...person.tags.filter(t => t !== 'Ancien'), 'Senior']
      };
      
      setIncomingPeople(prev => [...prev, newPerson]);
      setPageMode('board'); // Switch back to board to see the result
      setIsCommandOpen(false); // Close command palette if open
      setActionLog(prev => [`Ajout de ${person.name} aux arrivées`, ...prev]);
  };

  // --- RELATIONSHIP HANDLERS ---
  const handleAddRelationship = (targetId: string, type: 'affinity' | 'conflict' | 'synergy') => {
      if (!selectedPerson) return;
      
      const newRel: Relationship = {
          id: `rel-${Date.now()}`,
          sourceId: selectedPerson.id,
          targetId: targetId,
          type
      };

      const newHistory = { past: [...history.past, currentData], future: [] };
      setHistory(newHistory);

      const newData = {
          ...currentData,
          relationships: [...currentData.relationships, newRel]
      };

      const newWeeksData = { ...weeksData };
      newWeeksData[currentWeekIndex] = newData;
      setWeeksData(newWeeksData);
      
      setActionLog(prev => [`Relation ajoutée: ${type} entre ${selectedPerson.name} et ${currentData.cards[targetId]?.name}`, ...prev]);
  };

  const handleRemoveRelationship = (relId: string) => {
      const newHistory = { past: [...history.past, currentData], future: [] };
      setHistory(newHistory);

      const newData = {
          ...currentData,
          relationships: currentData.relationships.filter(r => r.id !== relId)
      };

      const newWeeksData = { ...weeksData };
      newWeeksData[currentWeekIndex] = newData;
      setWeeksData(newWeeksData);
      
      setActionLog(prev => [`Relation supprimée`, ...prev]);
  };

  // --- AUTO SYNERGY DETECTION ---
  const handleAutoSynergy = () => {
      let newRels: Relationship[] = [];
      const existingRelKeys = new Set(currentData.relationships.map(r => 
          [r.sourceId, r.targetId].sort().join('-')
      ));

      // Iterate through all columns
      Object.values(currentData.columns).forEach((col: Column) => {
          const members = col.cardIds.map(id => currentData.cards[id]);
          
          // Check every pair in the team
          for (let i = 0; i < members.length; i++) {
              for (let j = i + 1; j < members.length; j++) {
                  const p1 = members[i];
                  const p2 = members[j];
                  const key = [p1.id, p2.id].sort().join('-');

                  // If they have worked together before AND no relationship exists
                  if (!existingRelKeys.has(key)) {
                      const p1KnowsP2 = p1.pastTeammates?.includes(p2.id);
                      const p2KnowsP1 = p2.pastTeammates?.includes(p1.id);

                      if (p1KnowsP2 || p2KnowsP1) {
                          newRels.push({
                              id: `auto-rel-${Date.now()}-${i}-${j}`,
                              sourceId: p1.id,
                              targetId: p2.id,
                              type: 'synergy' // Default to synergy for past teammates
                          });
                          existingRelKeys.add(key);
                      }
                  }
              }
          }
      });

      if (newRels.length > 0) {
          const newHistory = { past: [...history.past, currentData], future: [] };
          setHistory(newHistory);

          const newData = {
              ...currentData,
              relationships: [...currentData.relationships, ...newRels]
          };

          const newWeeksData = { ...weeksData };
          newWeeksData[currentWeekIndex] = newData;
          setWeeksData(newWeeksData);
          
          setActionLog(prev => [`Auto-Synergie: ${newRels.length} relations créées`, ...prev]);
          alert(`${newRels.length} synergies détectées et créées automatiquement !`);
      } else {
          alert("Aucune nouvelle synergie détectée basées sur l'historique.");
      }
  };

  const weekInfo = getWeekDateRange(currentWeekIndex);
  const isFocusMode = (showRelationships || highlightedCardId !== null) && !searchQuery;
  const activeFilterCount = Object.values(filters).flat().length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 text-slate-900 dark:text-white font-sans overflow-hidden flex flex-col selection:bg-orange-200">
      
      <div 
        className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none" 
        style={{
            backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
        }}
      />
      <div className="fixed inset-0 bg-gradient-to-t from-orange-50/50 dark:from-slate-900/50 to-transparent pointer-events-none z-0" />

      <Navbar 
        currentWeekLabel={weekInfo.label}
        currentDateRange={weekInfo.dates}
        hasPrev={currentWeekIndex > 0}
        hasNext={!!weeksData[currentWeekIndex + 1]}
        onPrev={handlePrevWeek}
        onNext={handleNextWeek}
        onDuplicate={handleDuplicateWeek}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        actionLog={actionLog}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isFilterOpen={showFilters}
        onToggleFilter={() => setShowFilters(!showFilters)}
        activeFilterCount={activeFilterCount}
        onToggleCommand={() => setIsCommandOpen(true)}
        isHeatmapMode={isHeatmapMode}
        onToggleHeatmap={() => setIsHeatmapMode(!isHeatmapMode)}
        isLinkingMode={isLinkingMode}
        onToggleLinking={() => setIsLinkingMode(!isLinkingMode)}
        isCinemaMode={isCinemaMode}
        onToggleCinema={() => setIsCinemaMode(!isCinemaMode)}
        onSearchClick={() => setIsCommandOpen(true)}
        onAutoSynergy={handleAutoSynergy} // Pass handler
        pageMode={pageMode}
        onPageModeChange={setPageMode}
      />
      
      {/* COMMAND PALETTE */}
      <CommandPalette 
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        actions={[
            { id: 'map', label: pageMode === 'map' ? 'Quitter la Carte' : 'Vue Carte', icon: MapPin, perform: () => setPageMode(pageMode === 'map' ? 'board' : 'map') },
            { id: 'board', label: 'Aller au Tableau de Bord', icon: LayoutGrid, perform: () => setPageMode('board') },
            { id: 'alumni', label: 'Aller aux Anciens', icon: LayoutGrid, perform: () => setPageMode('alumni') },
            { id: 'cinema', label: isCinemaMode ? 'Quitter le mode Cinéma' : 'Mode Cinéma', icon: isCinemaMode ? Minimize : Maximize, perform: () => setIsCinemaMode(!isCinemaMode), shortcut: 'Shift+C' },
            { id: 'heatmap', label: isHeatmapMode ? 'Désactiver Heatmap' : 'Activer Heatmap', icon: Grip, perform: () => setIsHeatmapMode(!isHeatmapMode), shortcut: 'Shift+H' },
            { id: 'filters', label: 'Effacer les filtres', icon: Rows, perform: handleClearFilters },
            { id: 'relations', label: showRelationships ? 'Masquer Relations' : 'Afficher Relations', icon: GitMerge, perform: () => setShowRelationships(!showRelationships) },
            { id: 'undo', label: 'Annuler', icon: GitMerge, perform: handleUndo, shortcut: 'Ctrl+Z' },
            { id: 'redo', label: 'Rétablir', icon: GitMerge, perform: handleRedo, shortcut: 'Ctrl+Y' },
            { id: 'compact', label: 'Vue Compacte', icon: Rows, perform: () => setDensity('compact') },
            { id: 'standard', label: 'Vue Standard', icon: LayoutGrid, perform: () => setDensity('standard') },
            { id: 'tiny', label: 'Vue Ultra Compacte', icon: Grip, perform: () => setDensity('tiny') },
        ]}
      />

      {showFilters && pageMode === 'board' && !isCinemaMode && (
          <FilterBar 
            filters={filters} 
            onFilterChange={handleFilterChange} 
            onClear={handleClearFilters}
            availableNgos={availableNgos}
          />
      )}

      {pageMode === 'alumni' ? (
          <AlumniView 
            alumni={alumniData} 
            onInfoClick={setSelectedPerson} 
            onAddToIncoming={handleAddToIncoming}
          />
      ) : pageMode === 'map' ? (
          <MapView data={currentData} alumni={alumniData} viewMode={viewMode} />
      ) : (
        <main 
            className={`flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar-light relative p-6 pb-2 transition-all duration-700 z-10 ${isCinemaMode ? 'pt-6' : ''}`}
            id="board-container"
            onClick={handleBackgroundClick}
        >
            <div className="min-w-fit h-full flex flex-col relative">
                <ConnectionLayer 
                    relationships={currentData.relationships || []} 
                    cards={currentData.cards} 
                    draggingCardId={draggingCardId} 
                    highlightedCardId={highlightedCardId}
                    showAll={showRelationships}
                    isCompact={density === 'compact'}
                />

                {!isCinemaMode && (
                    <div className="fixed top-[88px] left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
                        <div className="pointer-events-auto">
                            <DynamicIsland 
                                incomingPeople={incomingPeople} 
                                departingPeople={departingPeople}
                                onDragStart={handleIncomingDragStart}
                                onDepartureDrop={handleDepartureDrop}
                                onRemoveDeparture={handleRemoveDeparture}
                                viewMode={viewMode}
                                totalActiveCount={Object.keys(currentData.cards).length}
                            />
                        </div>
                    </div>
                )}

                {!isCinemaMode && (
                    <div className="flex justify-between items-end mb-4 z-10 sticky left-0 px-2 w-[calc(100vw-48px)]">
                        <div className={`flex flex-col transition-opacity duration-500 ${isFocusMode ? 'opacity-40 blur-[1px]' : 'opacity-100'}`}>
                            <h2 className="text-slate-900 dark:text-white font-black text-3xl tracking-tight">Vue d'ensemble</h2>
                            <span className="text-slate-500 text-sm font-medium mt-1">
                                {searchQuery ? `Recherche: "${searchQuery}"` : (
                                <>
                                    {viewMode === 'performance' && "Performance commerciale et objectifs."}
                                    {viewMode === 'identity' && "Profils, âges et origines géographiques."}
                                    {viewMode === 'hr' && "Contrats, disponibilités et permis."}
                                </>
                                )}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowRelationships(!showRelationships)}
                                className={`
                                    relative group overflow-hidden px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 border flex items-center gap-2
                                    ${showRelationships 
                                        ? 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-500/30' 
                                        : 'bg-white dark:bg-[var(--bg-card-solid)] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 shadow-sm'
                                    }
                                `}
                            >
                                <GitMerge size={14} className={`transition-transform duration-300 ${showRelationships ? 'scale-110' : 'group-hover:scale-110'}`} />
                                <span>Relations</span>
                            </button>

                            <div className="bg-white dark:bg-[var(--bg-card-solid)] p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1 shadow-sm">
                                <button 
                                    onClick={() => setDensity('standard')}
                                    className={`p-2 rounded-lg transition-all duration-200 ${density === 'standard' ? 'bg-slate-100 text-slate-900 shadow-inner' : 'text-slate-400 hover:text-slate-700'}`}
                                    title="Vue Détaillée"
                                >
                                    <LayoutGrid size={16} />
                                </button>
                                <button 
                                    onClick={() => setDensity('compact')}
                                    className={`p-2 rounded-lg transition-all duration-200 ${density === 'compact' ? 'bg-slate-100 text-slate-900 shadow-inner' : 'text-slate-400 hover:text-slate-700'}`}
                                    title="Vue Compacte"
                                >
                                    <Rows size={16} />
                                </button>
                                <button 
                                    onClick={() => setDensity('tiny')}
                                    className={`p-2 rounded-lg transition-all duration-200 ${density === 'tiny' ? 'bg-slate-100 text-slate-900 shadow-inner' : 'text-slate-400 hover:text-slate-700'}`}
                                    title="Vue Ultra Compacte"
                                >
                                    <Grip size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {isCinemaMode && (
                    <button 
                        onClick={() => setIsCinemaMode(false)}
                        className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2 rounded-full shadow-lg font-bold text-sm hover:scale-105 transition-transform"
                    >
                        Quitter le mode Cinéma
                    </button>
                )}

                <div className={`
                    flex flex-row gap-6 h-full pb-4
                    ${isFocusMode ? 'opacity-90' : 'opacity-100'} 
                `}>
                {currentData.columnOrder.map((colId) => {
                    const column = currentData.columns[colId];
                    
                    if (filters.ngos.length > 0) {
                        const isMatch = filters.ngos.some(ngo => column.title.includes(ngo));
                        if (!isMatch) return null;
                    }

                    let cards = column.cardIds.map((cardId) => currentData.cards[cardId]);

                    // --- CARD FILTERING ---
                    cards = cards.filter(card => {
                        if (searchQuery) {
                            const lowerQuery = searchQuery.toLowerCase();
                            const matchesSearch = card.name.toLowerCase().includes(lowerQuery) || 
                                                card.role.toLowerCase().includes(lowerQuery) ||
                                                card.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
                            if (!matchesSearch) return false;
                        }
                        if (filters.roles.length > 0 && !filters.roles.includes(card.role)) return false;
                        if (filters.contractStatus.length > 0 && !filters.contractStatus.includes(card.contractStatus)) return false;
                        if (filters.tags.length > 0) {
                            const hasTag = card.tags.some(t => filters.tags.includes(t));
                            if (!hasTag) return false;
                        }
                        return true;
                    });

                    return (
                    <BoardColumn
                        key={column.id}
                        column={column}
                        cards={cards}
                        density={density}
                        viewMode={viewMode}
                        draggingCardId={draggingCardId}
                        highlightedCardId={highlightedCardId}
                        selectedCardIds={selectedCardIds} // Pass selection
                        // Passing new props
                        relationships={currentData.relationships}
                        isHeatmapMode={isHeatmapMode}
                        showRelationships={showRelationships} // Pass prop
                        isLinkingMode={isLinkingMode} // Pass prop
                        linkSourceId={linkSourceId} // Pass prop
                        onLink={handleLink} // Pass handler
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onCardDragStart={handleDragStart}
                        onColumnDragStart={handleColumnDragStart}
                        onColumnDrop={handleColumnDrop}
                        onCardClick={handleCardClick} // Use new handler
                        onInfoClick={(person) => setSelectedPerson(person)}
                        onResize={(expanded) => handleColumnResize(column.id, expanded)}
                        onHeaderClick={() => setSelectedColumn(column)}
                    />
                    );
                })}
                </div>
            </div>
        </main>
      )}

      {selectedPerson && (
        <InspectorPanel 
          person={selectedPerson} 
          allPeople={currentData.cards} // Pass all cards
          relationships={currentData.relationships} // Pass relationships
          onClose={() => setSelectedPerson(null)} 
          onAddRelationship={handleAddRelationship} // Pass handler
          onRemoveRelationship={handleRemoveRelationship} // Pass handler
        />
      )}

      {selectedColumn && (
          <MissionInspector
              column={selectedColumn}
              onClose={() => setSelectedColumn(null)}
              onUpdate={(updates) => handleUpdateColumn(selectedColumn.id, updates)}
          />
      )}

      {/* RELATIONSHIP CREATION MODAL */}
      {relationshipCreation && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl p-6 shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 text-center">Créer une Relation</h3>
                  <div className="flex flex-col gap-3">
                      <button 
                          onClick={() => confirmRelationship('affinity')}
                          className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors font-bold"
                      >
                          <div className="p-2 bg-emerald-200 rounded-full"><Handshake size={20} /></div>
                          <div>
                              <div className="text-sm">Affinité</div>
                              <div className="text-[10px] opacity-70">Ils travaillent bien ensemble</div>
                          </div>
                      </button>
                      <button 
                          onClick={() => confirmRelationship('conflict')}
                          className="flex items-center gap-3 p-3 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors font-bold"
                      >
                          <div className="p-2 bg-red-200 rounded-full"><Flame size={20} /></div>
                          <div>
                              <div className="text-sm">Conflit</div>
                              <div className="text-[10px] opacity-70">Tensions ou désaccords</div>
                          </div>
                      </button>
                      <button 
                          onClick={() => confirmRelationship('synergy')}
                          className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors font-bold"
                      >
                          <div className="p-2 bg-orange-200 rounded-full"><Zap size={20} /></div>
                          <div>
                              <div className="text-sm">Synergie Pure</div>
                              <div className="text-[10px] opacity-70">Productivité exceptionnelle</div>
                          </div>
                      </button>
                  </div>
                  <button 
                      onClick={() => setRelationshipCreation(null)}
                      className="mt-4 w-full py-2 text-slate-400 font-bold text-xs hover:text-slate-600 dark:hover:text-slate-300"
                  >
                      Annuler
                  </button>
              </div>
          </div>
      )}
    </div>
  );
}
