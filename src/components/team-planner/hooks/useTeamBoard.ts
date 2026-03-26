
import React, { useState } from 'react';
import { initialData, generateIncomingPeople } from '../constants';
import { BoardData, Person, Column, Relationship } from '../types';
import type { PageMode } from '../components/Navbar';

export const getWeekDateRange = (weekOffset: number) => {
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

export function useTeamBoard() {
  const [weeksData, setWeeksData] = useState<Record<number, BoardData>>({ 0: initialData });
  const [currentWeekIndex, setCurrentWeekIndex] = useState<number>(0);
  const [incomingPeople, setIncomingPeople] = useState<Person[]>(generateIncomingPeople(8));
  const [departingPeople, setDepartingPeople] = useState<Person[]>([]);

  // Undo/Redo & History State
  const [history, setHistory] = useState<{ past: BoardData[], future: BoardData[] }>({ past: [], future: [] });
  const [actionLog, setActionLog] = useState<string[]>([]);

  // Selection state
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<Column | null>(null);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [highlightedCardId, setHighlightedCardId] = useState<string | null>(null);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  const currentData = weeksData[currentWeekIndex] || initialData;

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

  // --- WEEK NAVIGATION ---
  const handlePrevWeek = () => { if (currentWeekIndex > 0) setCurrentWeekIndex(currentWeekIndex - 1); };
  const handleNextWeek = () => { if (weeksData[currentWeekIndex + 1]) setCurrentWeekIndex(currentWeekIndex + 1); };

  const handleDuplicateWeek = () => {
      const newWeekIndex = currentWeekIndex + 1;

      const newColumns: Record<string, Column> = {};
      const newCards: Record<string, Person> = {};

      (Object.values(currentData.cards) as Person[]).forEach(card => {
          if (!departingPeople.some(p => p.id === card.id)) {
              newCards[card.id] = { ...card };
          }
      });

      (Object.values(currentData.columns) as Column[]).forEach(col => {
          newColumns[col.id] = {
              ...col,
              cardIds: col.cardIds.filter(id => newCards[id])
          };
      });

      const firstColId = currentData.columnOrder[0];
      incomingPeople.forEach(p => {
          newCards[p.id] = { ...p, isNewArrival: true };
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

      setIncomingPeople(generateIncomingPeople(5));
      setDepartingPeople([]);

      setCurrentWeekIndex(newWeekIndex);
      setActionLog(prev => [`Semaine dupliquée (Arrivées: +${incomingPeople.length}, Départs: -${departingPeople.length})`, ...prev]);
  };

  // --- COLUMN ACTIONS ---
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
    const column = currentData.columns[columnId];
    let newColumn = { ...column, ...updates };

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
    setSelectedColumn(newColumn);
  };

  // --- DRAG AND DROP (CARDS) ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, cardId: string, sourceColId: string) => {
    if (!selectedCardIds.includes(cardId)) {
        setSelectedCardIds([cardId]);
    }

    setDraggingCardId(cardId);
    e.dataTransfer.setData('cardId', cardId);
    e.dataTransfer.setData('sourceColId', sourceColId);
    e.dataTransfer.setData('type', 'card');
    e.dataTransfer.effectAllowed = 'move';
    setHighlightedCardId(null);
  };

  const handleIncomingDragStart = (e: React.DragEvent<HTMLDivElement>, cardId: string) => {
      e.dataTransfer.setData('cardId', cardId);
      e.dataTransfer.setData('sourceColId', 'incoming');
      e.dataTransfer.setData('type', 'card');
      setDraggingCardId(cardId);
  };

  const handleDepartureDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const cardId = e.dataTransfer.getData('cardId');
      if (!cardId) return;

      let person: Person | undefined;
      (Object.values(currentData.cards) as Person[]).forEach(p => {
          if (p.id === cardId) person = p;
      });

      if (person) {
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

        const person = { ...incomingPeople[personIndex], isNewArrival: true };

        const newIncoming = [...incomingPeople];
        newIncoming.splice(personIndex, 1);
        setIncomingPeople(newIncoming);

        const newData = { ...currentData };
        newData.cards[person.id] = person;
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

    const cardsToMove = selectedCardIds.includes(cardId) ? selectedCardIds : [cardId];
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
    setSelectedCardIds([]);
  };

  // --- DRAG AND DROP (COLUMNS) ---
  const handleColumnDragStart = (e: React.DragEvent<HTMLDivElement>, colId: string) => {
      e.dataTransfer.setData('colId', colId);
      e.dataTransfer.setData('type', 'column');
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
      if (incomingPeople.some(p => p.id === person.id)) return;

      const newPerson = {
          ...person,
          id: `returning-${person.id}-${Date.now()}`,
          isNewArrival: true,
          isAlumni: false,
          weeksOfExperience: person.weeksOfExperience || 20,
          tags: [...person.tags.filter(t => t !== 'Ancien'), 'Senior']
      };

      setIncomingPeople(prev => [...prev, newPerson]);
      setActionLog(prev => [`Ajout de ${person.name} aux arrivées`, ...prev]);
  };

  // --- COMPUTED VALUES ---
  const columns = Object.values(currentData.columns) as Column[];
  const totalCards = columns.reduce((acc, col) => acc + col.cardIds.length, 0);
  const totalSlots = columns.reduce((acc, col) => acc + (col.isExpanded ? 10 : 5), 0);
  const fillRate = totalSlots > 0 ? Math.round((totalCards / totalSlots) * 100) : 0;

  const totalScore = columns.reduce((acc, col) => {
      return acc + col.cardIds.reduce((sum, id) => sum + (currentData.cards[id]?.drRate || 0), 0);
  }, 0);
  const averageScore = totalCards > 0 ? +(totalScore / totalCards).toFixed(1) : 0;
  const redZones = columns.filter(col => col.cardIds.length < 3).length;

  const weekInfo = getWeekDateRange(currentWeekIndex);

  return {
    // State
    currentData,
    currentWeekIndex,
    weeksData,
    incomingPeople,
    departingPeople,
    history,
    actionLog,
    selectedPerson,
    selectedColumn,
    draggingCardId,
    highlightedCardId,
    selectedCardIds,

    // Setters
    setSelectedPerson,
    setSelectedColumn,
    setHighlightedCardId,
    setSelectedCardIds,
    setActionLog,
    setDraggingCardId,

    // Actions
    handleUndo,
    handleRedo,
    handlePrevWeek,
    handleNextWeek,
    handleDuplicateWeek,
    handleColumnResize,
    handleUpdateColumn,
    handleDragStart,
    handleIncomingDragStart,
    handleDepartureDrop,
    handleRemoveDeparture,
    handleDragOver,
    handleDrop,
    handleColumnDragStart,
    handleColumnDrop,
    handleBackgroundClick,
    handleAddToIncoming,
    addToHistory,

    // Computed
    columns,
    totalCards,
    fillRate,
    averageScore,
    redZones,
    weekInfo,
  };
}
