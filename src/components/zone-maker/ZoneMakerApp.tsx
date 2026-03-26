import React from 'react';
import { useZoneMakerApp } from '@/hooks/useZoneMakerApp';
import ZoneSettingsModal from './ZoneSettingsModal';
import ScheduleChangeModal from './ScheduleChangeModal';
import MoveConfirmModal from './MoveConfirmModal';
import AppSidebar from './AppSidebar';
import AppMapOverlay from './AppMapOverlay';

const App: React.FC = () => {
  const zm = useZoneMakerApp();

  if (zm.error) return <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400"><p>{zm.error}</p></div>;

  return (
    <div className="min-h-screen flex flex-col md:flex-row text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 font-sans overflow-hidden">
      {/* Settings Modal */}
      {zm.showSettings && (
        <ZoneSettingsModal
          onClose={() => zm.setShowSettings(false)}
          statusFilters={zm.statusFilters}
          onToggleStatusFilter={zm.toggleStatusFilter}
          maxPopFilter={zm.maxPopFilter}
          onMaxPopFilterChange={zm.setMaxPopFilter}
          excludedList={zm.excludedList}
          onIncludeCommune={zm.handleIncludeCommune}
          onApplyAndRegenerate={() => { zm.setShowSettings(false); zm.handleGenerate(); }}
        />
      )}

      {/* Schedule Change Confirmation Modal */}
      {zm.pendingScheduleChange && (
        <ScheduleChangeModal
          change={zm.pendingScheduleChange}
          onCancel={() => zm.setPendingScheduleChange(null)}
          onConfirm={zm.confirmScheduleChange}
        />
      )}

      {/* Move Commune Confirmation Modal */}
      {zm.pendingMove && (
        <MoveConfirmModal
          move={zm.pendingMove}
          onCancel={() => zm.setPendingMove(null)}
          onConfirm={zm.confirmMove}
        />
      )}

      {/* Sidebar */}
      <AppSidebar
        isLoading={zm.isLoading}
        defaultTeamCount={zm.defaultTeamCount}
        onDefaultTeamCountChange={zm.setDefaultTeamCount}
        targetPop={zm.targetPop}
        onTargetPopChange={zm.setTargetPop}
        onGenerate={zm.handleGenerate}
        onExportCSV={zm.handleExportCSV}
        onShowSettings={() => zm.setShowSettings(true)}
        schedule={zm.schedule}
        maxCapacity={zm.maxCapacity}
        selectedCluster={zm.selectedCluster}
        onClusterSelect={zm.handleClusterSelect}
        onModifyWeekTeamCount={zm.modifyWeekTeamCount}
        isEditMode={zm.isEditMode}
        onToggleEditMode={() => zm.setIsEditMode(!zm.isEditMode)}
        analysis={zm.analysis}
        onClearAnalysis={() => zm.setAnalysis('')}
        isAnalyzing={zm.isAnalyzing}
        onAnalyze={zm.handleAnalyze}
        onCloseDetail={() => zm.setSelectedCluster(null)}
        onUpdateDuration={zm.handleUpdateDuration}
        onExcludeCommune={zm.handleExcludeCommune}
      />

      {/* Map area */}
      <AppMapOverlay
        stats={zm.stats}
        searchQuery={zm.searchQuery}
        onSearchQueryChange={zm.setSearchQuery}
        searchResults={zm.searchResults}
        onSearchResultClick={(c) => { zm.setFocusedCommuneId(c.id); zm.setSearchQuery(c.name); }}
        isLoading={zm.isLoading}
        data={zm.data}
        communes={zm.communes}
        filteredCommunesCount={zm.filteredCommunes.length}
        selectedCluster={zm.selectedCluster}
        isEditMode={zm.isEditMode}
        focusedCommuneId={zm.focusedCommuneId}
        onClusterSelect={zm.handleClusterSelect}
        onCommuneClick={zm.handleMoveCommuneRequest}
        onShowSettings={() => zm.setShowSettings(true)}
      />
    </div>
  );
};

export default App;
