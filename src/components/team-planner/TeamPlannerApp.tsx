
import React, { useState, useEffect } from 'react';
import { Person } from './types';
import { InspectorPanel } from './components/InspectorPanel';
import { MissionInspector } from './components/MissionInspector';
import { BoardColumn } from './components/BoardColumn';
import { Navbar, PageMode } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { ConnectionLayer } from './components/ConnectionLayer';
import { DynamicIsland } from './components/DynamicIsland';
import { CommandPalette } from './components/CommandPalette';
import { AlumniView } from './components/AlumniView';
import { MapView } from './components/MapView';
import { BoardHeader } from './components/BoardHeader';
import { RelationshipModal } from './components/RelationshipModal';
import { useTeamBoard } from './hooks/useTeamBoard';
import { useTeamFilters } from './hooks/useTeamFilters';
import { useTeamRelationships } from './hooks/useTeamRelationships';
import { useTeamStore } from '@/stores/teamStore';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { LayoutGrid, Rows, GitMerge, Grip, Maximize, Minimize, MapPin, CalendarX, AlertTriangle } from 'lucide-react';

export type ViewMode = 'performance' | 'identity' | 'hr';
export type ViewDensity = 'standard' | 'compact' | 'tiny';

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const mod = isMac ? '⌘' : 'Ctrl';
const modKey = (key: string) => `${mod}+${key}`;

export default function App() {
  const board = useTeamBoard();
  const filtering = useTeamFilters(board.currentData);

  // Persisted state from Zustand store
  const pageMode = useTeamStore((s) => s.pageMode) as PageMode;
  const setPageMode = useTeamStore((s) => s.setPageMode);
  const density = useTeamStore((s) => s.density) as ViewDensity;
  const setDensity = useTeamStore((s) => s.setDensity);
  const viewMode = useTeamStore((s) => s.viewMode) as ViewMode;
  const setViewMode = useTeamStore((s) => s.setViewMode);
  const setStoreSelectedPersonId = useTeamStore((s) => s.setSelectedPersonId);

  // Sync selectedPerson with store
  useEffect(() => {
    setStoreSelectedPersonId(board.selectedPerson?.id ?? null);
  }, [board.selectedPerson, setStoreSelectedPersonId]);

  // Power User Features (ephemeral)
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isHeatmapMode, setIsHeatmapMode] = useState(false);
  const [isCinemaMode, setIsCinemaMode] = useState(false);

  const relationships = useTeamRelationships({
    currentData: board.currentData,
    currentWeekIndex: board.currentWeekIndex,
    weeksData: board.weeksData,
    selectedPerson: board.selectedPerson,
    history: board.history,
    addToHistory: board.addToHistory,
    setActionLog: board.setActionLog,
    setDraggingCardId: board.setDraggingCardId,
  });

  // --- SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setIsCommandOpen(prev => !prev);
        }
        if (e.key === 'Escape') {
            board.setSelectedCardIds([]);
            board.setHighlightedCardId(null);
            board.setSelectedPerson(null);
            relationships.setLinkSourceId(null);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [relationships.isLinkingMode]);

  // --- CARD CLICK HANDLER (merges linking + selection) ---
  const handleCardClick = (person: Person, e: React.MouseEvent) => {
      e.stopPropagation();

      if (relationships.handleCardClickForLinking(person)) return;

      if (e.metaKey || e.ctrlKey) {
          board.setSelectedCardIds(prev => {
              if (prev.includes(person.id)) return prev.filter(id => id !== person.id);
              return [...prev, person.id];
          });
      } else {
          board.setSelectedPerson(person);
          board.setHighlightedCardId(person.id);
          board.setSelectedCardIds([person.id]);
      }
  };

  // --- ALUMNI ADD ---
  const handleAddToIncoming = (person: Person) => {
      board.handleAddToIncoming(person);
      setPageMode('board');
      setIsCommandOpen(false);
  };

  const isFocusMode = (relationships.showRelationships || board.highlightedCardId !== null) && !filtering.searchQuery;

  // --- COMMAND PALETTE ACTIONS ---
  const commandActions = [
      { id: 'map', label: pageMode === 'map' ? 'Quitter la Carte' : 'Vue Carte', icon: MapPin, perform: () => setPageMode(pageMode === 'map' ? 'board' : 'map') },
      { id: 'board', label: 'Aller au Tableau de Bord', icon: LayoutGrid, perform: () => setPageMode('board') },
      { id: 'alumni', label: 'Aller aux Anciens', icon: LayoutGrid, perform: () => setPageMode('alumni') },
      { id: 'cinema', label: isCinemaMode ? 'Quitter le mode Cinéma' : 'Mode Cinéma', icon: isCinemaMode ? Minimize : Maximize, perform: () => setIsCinemaMode(!isCinemaMode), shortcut: 'Shift+C' },
      { id: 'heatmap', label: isHeatmapMode ? 'Désactiver Heatmap' : 'Activer Heatmap', icon: Grip, perform: () => setIsHeatmapMode(!isHeatmapMode), shortcut: 'Shift+H' },
      { id: 'filters', label: 'Effacer les filtres', icon: Rows, perform: filtering.handleClearFilters },
      { id: 'relations', label: relationships.showRelationships ? 'Masquer Relations' : 'Afficher Relations', icon: GitMerge, perform: () => relationships.setShowRelationships(!relationships.showRelationships) },
      { id: 'undo', label: 'Annuler', icon: GitMerge, perform: board.handleUndo, shortcut: modKey('Z') },
      { id: 'redo', label: 'Rétablir', icon: GitMerge, perform: board.handleRedo, shortcut: modKey('Y') },
      { id: 'compact', label: 'Vue Compacte', icon: Rows, perform: () => setDensity('compact') },
      { id: 'standard', label: 'Vue Standard', icon: LayoutGrid, perform: () => setDensity('standard') },
      { id: 'tiny', label: 'Vue Ultra Compacte', icon: Grip, perform: () => setDensity('tiny') },
  ];

  return (
    <div className="app-surface min-h-screen bg-[#F8FAFC] dark:bg-slate-900 text-slate-900 dark:text-white overflow-hidden flex flex-col selection:bg-orange-200">
      <div className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none" style={{ backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
      <div className="fixed inset-0 bg-gradient-to-t from-orange-50/50 dark:from-slate-900/50 to-transparent pointer-events-none z-0" />

      <Navbar
        currentWeekLabel={board.weekInfo.label}
        currentDateRange={board.weekInfo.dates}
        hasPrev={board.currentWeekIndex > 0}
        hasNext={!!board.weeksData[board.currentWeekIndex + 1]}
        onPrev={board.handlePrevWeek}
        onNext={board.handleNextWeek}
        onDuplicate={board.handleDuplicateWeek}
        onUndo={board.handleUndo}
        onRedo={board.handleRedo}
        canUndo={board.history.past.length > 0}
        canRedo={board.history.future.length > 0}
        actionLog={board.actionLog}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={filtering.searchQuery}
        onSearchChange={filtering.setSearchQuery}
        isFilterOpen={filtering.showFilters}
        onToggleFilter={() => filtering.setShowFilters(!filtering.showFilters)}
        activeFilterCount={filtering.activeFilterCount}
        onToggleCommand={() => setIsCommandOpen(true)}
        isHeatmapMode={isHeatmapMode}
        onToggleHeatmap={() => setIsHeatmapMode(!isHeatmapMode)}
        isLinkingMode={relationships.isLinkingMode}
        onToggleLinking={() => relationships.setIsLinkingMode(!relationships.isLinkingMode)}
        isCinemaMode={isCinemaMode}
        onToggleCinema={() => setIsCinemaMode(!isCinemaMode)}
        onSearchClick={() => setIsCommandOpen(true)}
        onAutoSynergy={relationships.handleAutoSynergy}
        pageMode={pageMode}
        onPageModeChange={setPageMode}
      />

      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} actions={commandActions} />

      {filtering.showFilters && pageMode === 'board' && !isCinemaMode && (
          <FilterBar filters={filtering.filters} onFilterChange={filtering.handleFilterChange} onClear={filtering.handleClearFilters} availableNgos={filtering.availableNgos} />
      )}

      {pageMode === 'alumni' ? (
          <>
              {board.fundraisersError && (
                  <div role="alert" className="mx-8 mt-4 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 flex items-start gap-2">
                      <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-amber-800 dark:text-amber-300">
                          <p className="font-semibold">Données alumni indisponibles</p>
                          <p className="opacity-80">L'endpoint <code className="font-mono">/Plan/Fundraisers/Kanban</code> n'a pas répondu — la liste reste vide.</p>
                      </div>
                  </div>
              )}
              <AlumniView alumni={board.alumniData} onInfoClick={board.setSelectedPerson} onAddToIncoming={handleAddToIncoming} />
          </>
      ) : pageMode === 'map' ? (
          <MapView data={board.currentData} alumni={board.alumniData} viewMode={viewMode} />
      ) : (
        <main className={`flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar-light relative p-6 pb-2 transition-all duration-700 z-10 ${isCinemaMode ? 'pt-6' : ''}`} id="board-container" onClick={board.handleBackgroundClick}>
            <div className="min-w-fit h-full flex flex-col relative">
                <ConnectionLayer relationships={board.currentData.relationships || []} cards={board.currentData.cards} draggingCardId={board.draggingCardId} highlightedCardId={board.highlightedCardId} showAll={relationships.showRelationships} isCompact={density === 'compact'} />

                {!isCinemaMode && (
                    <div className="fixed top-[88px] left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
                        <div className="pointer-events-auto">
                            <DynamicIsland incomingPeople={board.incomingPeople} departingPeople={board.departingPeople} onDragStart={board.handleIncomingDragStart} onDepartureDrop={board.handleDepartureDrop} onRemoveDeparture={board.handleRemoveDeparture} viewMode={viewMode} totalActiveCount={Object.keys(board.currentData.cards).length} />
                        </div>
                    </div>
                )}

                {!isCinemaMode && (
                    <BoardHeader
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        density={density}
                        onDensityChange={setDensity}
                        showRelationships={relationships.showRelationships}
                        onToggleRelationships={() => relationships.setShowRelationships(!relationships.showRelationships)}
                        searchQuery={filtering.searchQuery}
                        isFocusMode={isFocusMode}
                        lastSaved={board.lastSaved}
                        isSaving={board.isSaving}
                        saveError={board.saveError}
                        onRetrySave={board.retrySave}
                    />
                )}

                {isCinemaMode && (
                    <button onClick={() => setIsCinemaMode(false)} className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2 rounded-full shadow-lg font-bold text-sm hover:scale-105 transition-transform">
                        Quitter le mode Cinéma
                    </button>
                )}

                {board.loadError ? (
                    <div className="flex-1 flex items-center justify-center">
                        <ErrorState
                            title="Impossible de charger le planning"
                            error={board.loadError}
                            onRetry={() => window.location.reload()}
                        />
                    </div>
                ) : board.isLoadingWeek && !board.hasBoardForCurrentWeek ? (
                    <div className="flex-1 flex items-center justify-center">
                        <LoadingState label="Chargement du planning…" />
                    </div>
                ) : !board.hasBoardForCurrentWeek ? (
                    <div className="flex-1 flex items-center justify-center">
                        <EmptyState
                            title="Aucun planning pour cette semaine"
                            message="Dupliquez la semaine précédente pour démarrer ou attendez la synchronisation des données."
                            icon={<CalendarX size={22} />}
                        />
                    </div>
                ) : (
                    <div className={`flex flex-row gap-6 pb-4 items-stretch flex-1 ${isFocusMode ? 'opacity-90' : 'opacity-100'}`}>
                    {board.currentData.columnOrder.map((colId) => {
                        const column = board.currentData.columns[colId];
                        if (!filtering.shouldShowColumn(column)) return null;

                        const cards = filtering.filterCards(column.cardIds.map((cardId) => board.currentData.cards[cardId]));

                        return (
                        <BoardColumn
                            key={column.id}
                            column={column}
                            cards={cards}
                            density={density}
                            viewMode={viewMode}
                            draggingCardId={board.draggingCardId}
                            highlightedCardId={board.highlightedCardId}
                            selectedCardIds={board.selectedCardIds}
                            relationships={board.currentData.relationships}
                            isHeatmapMode={isHeatmapMode}
                            showRelationships={relationships.showRelationships}
                            isLinkingMode={relationships.isLinkingMode}
                            linkSourceId={relationships.linkSourceId}
                            onLink={(targetId) => relationships.handleLink(targetId, board.draggingCardId)}
                            onDragOver={board.handleDragOver}
                            onDrop={board.handleDrop}
                            onCardDragStart={board.handleDragStart}
                            onColumnDragStart={board.handleColumnDragStart}
                            onColumnDrop={board.handleColumnDrop}
                            onCardClick={handleCardClick}
                            onInfoClick={(person) => board.setSelectedPerson(person)}
                            onResize={(expanded) => board.handleColumnResize(column.id, expanded)}
                            onHeaderClick={() => board.setSelectedColumn(column)}
                        />
                        );
                    })}
                    </div>
                )}
            </div>
        </main>
      )}

      {board.selectedPerson && (
        <InspectorPanel
          person={board.selectedPerson}
          allPeople={board.currentData.cards}
          relationships={board.currentData.relationships}
          onClose={() => board.setSelectedPerson(null)}
          onAddRelationship={relationships.handleAddRelationship}
          onRemoveRelationship={relationships.handleRemoveRelationship}
        />
      )}

      {board.selectedColumn && (
          <MissionInspector
              column={board.selectedColumn}
              onClose={() => board.setSelectedColumn(null)}
              onUpdate={(updates) => board.handleUpdateColumn(board.selectedColumn!.id, updates)}
          />
      )}

      {relationships.relationshipCreation && (
          <RelationshipModal onConfirm={relationships.confirmRelationship} onCancel={() => relationships.setRelationshipCreation(null)} />
      )}
    </div>
  );
}
