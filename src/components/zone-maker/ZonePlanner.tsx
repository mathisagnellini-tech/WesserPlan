import React from 'react';
import { useZonePlanner } from '@/hooks/useZonePlanner';
import MapCanvas from './MapCanvas';
import ClusterSidebar from './ClusterSidebar';
import ClusterDetail from './ClusterDetail';
import CnffReport from './CnffReport';
import BrushModeHud from './BrushModeHud';
import BonusModeHud from './BonusModeHud';
import BonusConfirmModal from './BonusConfirmModal';
import SectorPolicyModal from './SectorPolicyModal';
import FilterPanel from './FilterPanel';
import { Search, GripVertical } from 'lucide-react';

const ZonePlanner: React.FC = () => {
  const zp = useZonePlanner();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC] dark:bg-slate-950 font-sans overflow-hidden"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const cid = e.dataTransfer.getData('clusterId');
        if (cid && !zp.dragOverCell) zp.handlePutBackToDraft(cid);
        zp.setDragOverCell(null);
      }}>

      {/* HUD MODE SELECTION BONUS */}
      {zp.isBonusMode && (
        <BonusModeHud
          selectedCluster={zp.selectedCluster}
          bonusSelectionCount={zp.bonusSelection.size}
          onCancel={() => { zp.setIsBonusMode(false); zp.setBonusSelection(new Set()); }}
          onNext={() => zp.setShowBonusConfirm(true)}
        />
      )}

      {/* MODAL INFO / POLITIQUE SECTORIELLE */}
      {zp.showSectorPolicy && (
        <SectorPolicyModal
          selectedNGO={zp.selectedNGO}
          data={zp.data}
          onClose={() => zp.setShowSectorPolicy(false)}
        />
      )}

      {/* MODAL DE CONFIRMATION BONUS */}
      {zp.showBonusConfirm && zp.bonusImpacts && zp.selectedCluster && (
        <BonusConfirmModal
          selectedCluster={zp.selectedCluster}
          bonusImpacts={zp.bonusImpacts}
          onCancel={() => zp.setShowBonusConfirm(false)}
          onConfirm={zp.applyBonusTransfer}
        />
      )}

      {/* SIDEBAR */}
      <ClusterSidebar
        selectedNGO={zp.selectedNGO}
        onNGOChange={zp.handleNGOChange}
        showCNFF={zp.showCNFF}
        onToggleCNFF={() => zp.setShowCNFF(!zp.showCNFF)}
        onShowSectorPolicy={() => zp.setShowSectorPolicy(true)}
        historyLength={zp.history.length}
        onUndo={zp.handleUndo}
        isBrushMode={zp.isBrushMode}
        isEditMode={zp.isEditMode}
        isBonusMode={zp.isBonusMode}
        onSetBrushMode={() => { zp.setIsBrushMode(true); zp.setIsEditMode(false); zp.setIsBonusMode(false); }}
        onSetEditMode={() => { zp.setIsEditMode(true); zp.setIsBrushMode(false); zp.setIsBonusMode(false); }}
        onSetWatchMode={() => { zp.setIsBrushMode(false); zp.setIsEditMode(false); zp.setIsBonusMode(false); }}
        draftClusters={zp.draftClusters}
        selectedCluster={zp.selectedCluster}
        onSelectCluster={(c) => zp.setSelectedCluster(c)}
        onDeleteCluster={zp.deleteCluster}
        schedule={zp.schedule}
        maxCapacity={zp.maxCapacity}
        isCompact={zp.isCompact}
        visibleTeamPath={zp.visibleTeamPath}
        onToggleTeamPath={(team) => zp.setVisibleTeamPath(zp.visibleTeamPath === team ? null : team)}
        onModifyWeekTeamCount={zp.modifyWeekTeamCount}
        dragOverCell={zp.dragOverCell}
        setDragOverCell={zp.setDragOverCell}
        onManualMoveRequest={zp.handleManualMoveRequest}
        sidebarWidth={zp.sidebarWidth}
        sidebarRef={zp.sidebarRef}
      />

      {/* Resize handle */}
      <div
        className={`w-1 hover:w-2 bg-slate-200/50 dark:bg-slate-700/50 hover:bg-orange-300/50 dark:hover:bg-orange-600/50 cursor-col-resize transition-all z-40 relative group hidden md:block ${zp.isResizing ? 'bg-orange-500 w-2' : ''}`}
        onMouseDown={zp.startResizing}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[var(--bg-card-solid)] border border-slate-200 dark:border-slate-700 rounded-full p-2 shadow-xl opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
          <GripVertical size={14} className="text-slate-400" />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 h-screen relative bg-[#F1F5F9] dark:bg-slate-950 overflow-hidden">
        {/* CNFF OVERLAY */}
        {zp.showCNFF && (
          <CnffReport
            selectedNGO={zp.selectedNGO}
            cnffData={zp.cnffData}
            hasCopied={zp.hasCopied}
            onCopy={zp.copyToClipboard}
            onClose={() => zp.setShowCNFF(false)}
          />
        )}

        {/* HUD BRUSH */}
        {zp.isBrushMode && (
          <BrushModeHud
            brushStats={zp.brushStats}
            onClear={() => zp.setBrushSelection(new Set())}
            onValidate={zp.validateManualZone}
          />
        )}

        {/* FILTER PANEL */}
        <FilterPanel
          isOpen={zp.isFilterPanelOpen}
          onToggle={() => zp.setIsFilterPanelOpen(!zp.isFilterPanelOpen)}
          visibleStatuses={zp.visibleStatuses}
          onToggleStatus={zp.toggleStatusVisibility}
        />

        {/* SEARCH */}
        {!zp.isBrushMode && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[400] w-full max-w-xl px-12 pointer-events-none">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] border border-white/50 dark:border-slate-700/50 rounded-[2.5rem] p-4 flex items-center gap-4 pointer-events-auto ring-1 ring-black/5 hover:bg-white dark:hover:bg-slate-900 hover:shadow-2xl transition-all duration-500">
              <Search className="ml-6 text-slate-300" size={22} strokeWidth={2.5} />
              <input type="text" placeholder="Rechercher une commune..." value={zp.searchQuery} onChange={(e) => zp.setSearchQuery(e.target.value)} className="flex-1 px-5 py-4 bg-transparent text-[15px] font-black tracking-tight focus:outline-none text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-500" />
            </div>
          </div>
        )}

        {/* Loading */}
        {zp.isLoading && (
          <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 z-[700] flex flex-col items-center justify-center backdrop-blur-3xl">
            <div className="w-20 h-20 border-6 border-orange-600/10 border-t-orange-600 rounded-full animate-spin mb-8 shadow-2xl shadow-orange-100 dark:shadow-orange-900/30"></div>
            <p className="text-slate-900 dark:text-white font-black text-3xl tracking-tight uppercase">Chargement...</p>
          </div>
        )}

        {/* MAP */}
        <div className="w-full h-full relative z-0">
          {zp.communes.length > 0 && !zp.isLoading && (
            <MapCanvas
              clusters={zp.data.clusters}
              allCommunes={zp.visibleCommunes}
              onSelectCluster={zp.handleSelectCluster}
              onCommuneClick={zp.handleCommuneClick}
              selectedClusterId={zp.selectedCluster?.id}
              isEditMode={zp.isEditMode}
              isBrushMode={zp.isBrushMode}
              brushSelection={zp.brushSelection}
              bonusSelection={zp.bonusSelection}
              onCommuneBrush={zp.handleCommuneBrush}
              onCommuneHover={zp.setHoveredCommune}
              visibleTeamPath={zp.visibleTeamPath}
            />
          )}
        </div>

        {/* DETAILS PANEL */}
        <div className={`fixed bottom-12 right-12 w-full max-w-lg z-[600] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${zp.selectedCluster ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-[120%] opacity-0 scale-90'}`}>
          {zp.selectedCluster && (
            <ClusterDetail
              selectedCluster={zp.selectedCluster}
              isBonusMode={zp.isBonusMode}
              onToggleBonusMode={() => { zp.setIsBonusMode(!zp.isBonusMode); zp.setBonusSelection(new Set()); }}
              onClose={() => { zp.setSelectedCluster(null); zp.setIsBonusMode(false); zp.setBonusSelection(new Set()); }}
              onPutBackToDraft={zp.handlePutBackToDraft}
              onDelete={zp.deleteCluster}
            />
          )}
        </div>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        input[type="checkbox"] { accent-color: #2563eb; }
        body { color: #0F172A; background-color: #F8FAFC; }
        .group:active { transform: scale(0.98); }
        font-mono { font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.98); }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default ZonePlanner;
