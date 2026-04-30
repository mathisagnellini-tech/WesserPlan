
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BoardData, Person, Column } from '../types';
import { useTeamStore } from '@/stores/teamStore';
import { teamPlannerService } from '@/services/teamPlannerService';
import { teamPlannerPageService } from '@/services/teamPlannerPageService';
import { reporter } from '@/lib/observability';
import { computeIsoWeek } from '@/lib/isoWeek';
import { adaptFundraiserToPerson } from '../lib/fundraiserAdapter';

// Empty board used as a safe fallback for `currentData` when no week
// has been hydrated from Supabase yet. Consumers (filters, relationships,
// drag handlers) read columns/cards/columnOrder/relationships defensively
// and would crash if these were undefined.
const EMPTY_BOARD: BoardData = {
  columns: {},
  cards: {},
  columnOrder: [],
  relationships: [],
};

const DEFAULT_ORG_ID = 'msf';
const SAVE_DEBOUNCE_MS = 500;

const BASE_MONDAY = (() => {
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    d.setHours(0, 0, 0, 0);
    return d;
})();

const DEFAULT_YEAR = BASE_MONDAY.getFullYear();

export const getWeekDateRange = (weekOffset: number) => {
    const targetDate = new Date(BASE_MONDAY);
    targetDate.setDate(BASE_MONDAY.getDate() + (weekOffset * 7));

    const endDate = new Date(targetDate);
    endDate.setDate(targetDate.getDate() + 6);

    const startStr = targetDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const endStr = endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

    const weekNumber = computeIsoWeek(targetDate);

    return {
        label: `Semaine ${weekNumber}`,
        dates: `Du ${startStr} au ${endStr}`
    };
};

interface UseTeamBoardOptions {
  orgId?: string;
  year?: number;
}

type ColumnUpdates = Partial<Omit<Column, 'missionData'>> & {
  missionData?: {
    zone?: Partial<NonNullable<Column['missionData']>['zone']>;
    car?: Partial<NonNullable<Column['missionData']>['car']>;
    housing?: Partial<NonNullable<Column['missionData']>['housing']>;
  };
};

export function useTeamBoard(options: UseTeamBoardOptions = {}) {
  const orgId = options.orgId ?? DEFAULT_ORG_ID;
  const year = options.year ?? DEFAULT_YEAR;

  const storeWeekIndex = useTeamStore((s) => s.currentWeekIndex);
  const setStoreWeekIndex = useTeamStore((s) => s.setCurrentWeekIndex);

  const [weeksData, setWeeksData] = useState<Record<number, BoardData>>({});
  const [currentWeekIndex, setCurrentWeekIndexLocal] = useState<number>(storeWeekIndex);
  // Newcomers and alumni come pre-classified by the backend's TeamPlanner
  // page bundle (`/Plan/TeamPlanner/Get`). The frontend no longer filters
  // `weeksWorked` / `isActive` client-side. While the endpoint is not yet
  // implemented (backend may return 501) the arrays remain empty and
  // `fundraisersError` surfaces the failure.
  const [incomingPeople, setIncomingPeople] = useState<Person[]>([]);
  const [departingPeople, setDepartingPeople] = useState<Person[]>([]);
  const [alumniData, setAlumniData] = useState<Person[]>([]);
  const [fundraisersError, setFundraisersError] = useState<Error | null>(null);
  const [fundraisersLoading, setFundraisersLoading] = useState(true);

  // Undo/Redo & History State
  const [history, setHistory] = useState<{ past: BoardData[], future: BoardData[] }>({ past: [], future: [] });
  const [actionLog, setActionLog] = useState<string[]>([]);

  // Selection state
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<Column | null>(null);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [highlightedCardId, setHighlightedCardId] = useState<string | null>(null);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  // Persistence state
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<Error | null>(null);
  const [isLoadingWeek, setIsLoadingWeek] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  // Tracks weeks we've already attempted to load from Supabase (avoid re-loading on every state change)
  const loadedWeeksRef = useRef<Set<number>>(new Set());
  // Suppress the debounced save while we're hydrating a week from Supabase
  const suppressSaveRef = useRef(false);
  // Debounce timer for saves
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local weekIndex to store whenever it changes
  const setCurrentWeekIndex = (index: number) => {
    setCurrentWeekIndexLocal(index);
    setStoreWeekIndex(index);
  };

  // Sync from store to local when store changes externally
  useEffect(() => {
    setCurrentWeekIndexLocal(storeWeekIndex);
  }, [storeWeekIndex]);

  // --- LOAD FUNDRAISERS (newcomers + alumni) once on mount ---
  useEffect(() => {
    let cancelled = false;
    setFundraisersLoading(true);
    setFundraisersError(null);

    teamPlannerPageService
      .getTeamPlannerData(year)
      .then((resp) => {
        if (cancelled) return;
        // Bundle is pre-classified: newcomers (active && weeksWorked<=2)
        // and alumni (!isActive) are separate arrays — no client-side
        // filtering required.
        setIncomingPeople((resp?.newcomers ?? []).map(adaptFundraiserToPerson));
        setAlumniData((resp?.alumni ?? []).map(adaptFundraiserToPerson));
      })
      .catch((err) => {
        if (cancelled) return;
        // Likely a 501 NotImplemented while the backend is being filled
        // in. Keep the arrays empty (no fallback to fake data) and
        // surface the error via state.
        reporter.error('TeamPlanner page bundle load failed', err, {
          source: 'useTeamBoard',
        });
        setFundraisersError(err as Error);
      })
      .finally(() => {
        if (!cancelled) setFundraisersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const hasBoardForCurrentWeek = weeksData[currentWeekIndex] !== undefined;
  const currentData = weeksData[currentWeekIndex] ?? EMPTY_BOARD;

  // --- LOAD FROM SUPABASE on week change ---
  useEffect(() => {
    if (loadedWeeksRef.current.has(currentWeekIndex)) return;

    let cancelled = false;
    setIsLoadingWeek(true);
    setLoadError(null);

    teamPlannerService
      .load({ orgId, year, weekIndex: currentWeekIndex })
      .then((result) => {
        if (cancelled) return;
        loadedWeeksRef.current.add(currentWeekIndex);
        if (result) {
          // Hydrate from DB — suppress save while we apply the loaded state
          suppressSaveRef.current = true;
          setWeeksData((prev) => ({ ...prev, [currentWeekIndex]: result.boardData }));
          setLastSaved(new Date(result.updatedAt));
          // Release the suppression after the state has been committed
          queueMicrotask(() => {
            suppressSaveRef.current = false;
          });
        }
        // else: leave weeksData untouched. The consumer renders an empty
        // state when `hasBoardForCurrentWeek` is false (no row in DB and
        // we haven't generated one locally via handleDuplicateWeek).
      })
      .catch((err) => {
        if (cancelled) return;
        reporter.error('load failed', err, { source: 'useTeamBoard' });
        setLoadError(err as Error);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingWeek(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentWeekIndex, orgId, year]);

  // --- DEBOUNCED SAVE TRIGGER ---
  const triggerSave = useCallback(
    (board: BoardData, weekIdx: number) => {
      if (suppressSaveRef.current) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        setIsSaving(true);
        setSaveError(null);
        try {
          await teamPlannerService.save({ orgId, year, weekIndex: weekIdx, boardData: board });
          setLastSaved(new Date());
        } catch (err) {
          reporter.error('save failed', err, { source: 'useTeamBoard' });
          setSaveError(err as Error);
        } finally {
          setIsSaving(false);
        }
      }, SAVE_DEBOUNCE_MS);
    },
    [orgId, year],
  );

  // Cleanup pending timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Manual retry handler (for save error UI)
  const retrySave = useCallback(() => {
    const board = weeksData[currentWeekIndex];
    if (!board) return;
    triggerSave(board, currentWeekIndex);
  }, [triggerSave, weeksData, currentWeekIndex]);

  // --- HISTORY MANAGEMENT ---
  const addToHistory = (newData: BoardData, action: string) => {
      setHistory(prev => ({
          past: [...prev.past, currentData],
          future: []
      }));
      setWeeksData(prev => ({ ...prev, [currentWeekIndex]: newData }));
      setActionLog(prev => [action, ...prev].slice(0, 50));
      triggerSave(newData, currentWeekIndex);
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
      setActionLog(prev => ["↩️ Annulation", ...prev].slice(0, 50));
      triggerSave(previous, currentWeekIndex);
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
      setActionLog(prev => ["↩️ Rétablissement", ...prev].slice(0, 50));
      triggerSave(next, currentWeekIndex);
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

      setIncomingPeople([]);
      setDepartingPeople([]);

      // Mark the duplicated week as already "loaded" — no need to fetch from DB,
      // we just generated it locally. Save it on switch.
      loadedWeeksRef.current.add(newWeekIndex);

      setCurrentWeekIndex(newWeekIndex);
      setActionLog(prev => [`Semaine dupliquée (Arrivées: +${incomingPeople.length}, Départs: -${departingPeople.length})`, ...prev]);
      triggerSave(newBoardData, newWeekIndex);
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

  const handleUpdateColumn = (columnId: string, updates: ColumnUpdates) => {
    const column = currentData.columns[columnId];
    let newColumn: Column = { ...column, ...updates, missionData: column.missionData };

    if (updates.missionData) {
        newColumn.missionData = {
            ...column.missionData!,
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
    hasBoardForCurrentWeek,
    currentWeekIndex,
    weeksData,
    incomingPeople,
    departingPeople,
    alumniData,
    fundraisersError,
    fundraisersLoading,
    history,
    actionLog,
    selectedPerson,
    selectedColumn,
    draggingCardId,
    highlightedCardId,
    selectedCardIds,

    // Persistence state
    lastSaved,
    isSaving,
    saveError,
    isLoadingWeek,
    loadError,
    retrySave,

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
