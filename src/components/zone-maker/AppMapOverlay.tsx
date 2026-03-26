import React from 'react';
import { Commune, Cluster, ClusteringResult } from './types';
import { COMMUNE_STATUSES } from './constants';
import MapCanvas from './MapCanvas';
import { Users, Search, Layers, Info, Loader2, Filter } from 'lucide-react';

interface AppMapOverlayProps {
  stats: { totalPop: number; totalCommunes: number };
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
  searchResults: Commune[];
  onSearchResultClick: (commune: Commune) => void;
  isLoading: boolean;
  data: ClusteringResult | null;
  communes: Commune[];
  filteredCommunesCount: number;
  selectedCluster: Cluster | null;
  isEditMode: boolean;
  focusedCommuneId: string | null;
  onClusterSelect: (cluster: Cluster) => void;
  onCommuneClick: (communeId: string) => void;
  onShowSettings: () => void;
}

const AppMapOverlay: React.FC<AppMapOverlayProps> = ({
  stats, searchQuery, onSearchQueryChange, searchResults, onSearchResultClick,
  isLoading, data, communes, filteredCommunesCount,
  selectedCluster, isEditMode, focusedCommuneId,
  onClusterSelect, onCommuneClick, onShowSettings,
}) => {
  return (
    <main className="flex-1 flex flex-col h-screen relative bg-slate-100 dark:bg-slate-800">
      {/* KPI Dashboard */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex justify-center pointer-events-none">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg border border-slate-200/50 dark:border-slate-700/50 rounded-2xl p-2 px-6 flex items-center gap-6 pointer-events-auto max-w-4xl w-full justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg text-orange-600"><Users size={20} /></div>
            <div className="hidden sm:block">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Population</div>
              <div className="text-lg font-black text-slate-800 dark:text-white">{stats.totalPop.toLocaleString()}</div>
            </div>
          </div>
          {/* SEARCH BAR */}
          <div className="flex-1 max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Chercher une commune..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white dark:focus:bg-slate-700 dark:text-white transition-all"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-[500]">
                {searchResults.map(c => (
                  <button key={c.id} onClick={() => onSearchResultClick(c)} className="w-full text-left px-4 py-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-sm flex justify-between items-center group">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{c.name}</span>
                    <span className="text-xs text-slate-400 font-mono group-hover:text-orange-500">{c.population}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg text-amber-600"><Layers size={20} /></div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Communes</div>
              <div className="text-lg font-black text-slate-800 dark:text-white">{stats.totalCommunes}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Legend */}
      <div className="absolute bottom-6 left-6 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-xs">
        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2"><Info size={14} /> Légende Carte</h4>
        <div className="space-y-2">
          {COMMUNE_STATUSES.map(s => (
            <div key={s.id} className="flex items-center gap-3 text-sm">
              <span className="w-3 h-3 rounded-full shadow-sm ring-1 ring-slate-100 dark:ring-slate-700" style={{ backgroundColor: s.color }}></span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">{s.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-3 text-sm mt-3 pt-3 border-t border-slate-100 dark:border-slate-700"><span className="w-3 h-3 rounded-full bg-slate-900 dark:bg-white shadow-sm"></span><span className="text-slate-900 dark:text-white font-bold">Zone sélectionnée</span></div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 z-[500] flex flex-col items-center justify-center backdrop-blur-sm">
          <Loader2 className="animate-spin text-slate-900 dark:text-white mb-4" size={48} />
          <p className="text-slate-800 dark:text-white font-bold text-lg">Calcul de l'optimisation...</p>
        </div>
      )}

      {/* Map Container */}
      <div className="flex-grow w-full h-full relative z-0">
        {data && !isLoading && (
          <MapCanvas
            clusters={data.clusters}
            allCommunes={communes}
            onSelectCluster={onClusterSelect}
            selectedClusterId={selectedCluster?.id}
            isEditMode={isEditMode}
            isBrushMode={false}
            brushSelection={new Set()}
            onCommuneBrush={() => {}}
            onCommuneHover={() => {}}
            onCommuneClick={onCommuneClick}
            focusedCommuneId={focusedCommuneId}
          />
        )}

        {!isLoading && filteredCommunesCount === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 z-10">
            <div className="text-center max-w-md p-8">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-full inline-block mb-4 shadow-sm"><Filter size={32} className="text-slate-400" /></div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Aucune commune affichée</h3>
              <p className="text-slate-500 dark:text-slate-400">Modifiez les filtres dans le panneau de gauche pour voir des données.</p>
              <button onClick={onShowSettings} className="mt-4 text-orange-600 font-bold hover:underline">Ouvrir les paramètres</button>
            </div>
          </div>
        )}

        <div className="absolute bottom-4 right-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] shadow-sm border border-slate-200 dark:border-slate-700 z-[400] text-slate-400 font-medium pointer-events-none">
          Données temps réel: geo.api.gouv.fr
        </div>
      </div>
    </main>
  );
};

export default AppMapOverlay;
