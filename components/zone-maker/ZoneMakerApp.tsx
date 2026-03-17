
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { generateClusters, recalculateSchedule } from './services/clusteringService';
import { analyzeCluster } from './services/geminiService';
import MapCanvas from './MapCanvas';
import { Cluster, ClusteringResult, Commune, GeoFeature, MoveConfirmation, CommuneStatus, ScheduleChangeConfirmation, ScheduleImpact } from './types';
import { TARGET_POPULATION, API_GEO_URL, DEFAULT_MAX_POP_FILTER, COMMUNE_STATUSES, RAW_CSV_DATA } from './constants';
import { MapPin, RefreshCw, Sparkles, Info, Loader2, Calendar, Users, Settings, Edit3, Trash2, X, AlertTriangle, Check, ArrowRight, Filter, PieChart, BarChart3, Layers, Search, Download, Plus, Minus, Clock, CheckCircle, ArrowRightLeft } from 'lucide-react';

// Helper to parse CSV (simple version)
const parseCSV = (csv: string): Map<string, number> => {
    const lines = csv.trim().split('\n');
    const map = new Map<string, number>();
    // Skip header (index 0)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        // Split by comma
        const cols = line.split(',');
        const insee = cols[1];
        const pop = parseInt(cols[6] || '0', 10);
        
        if (insee && !isNaN(pop)) {
            map.set(insee, pop);
        }
    }
    return map;
};

const App: React.FC = () => {
  const [data, setData] = useState<ClusteringResult | null>(null);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Settings & Filters
  const [targetPop, setTargetPop] = useState(TARGET_POPULATION);
  const [defaultTeamCount, setDefaultTeamCount] = useState(2);
  const [weekOverrides, setWeekOverrides] = useState<Record<number, number>>({});
  const [maxPopFilter, setMaxPopFilter] = useState(DEFAULT_MAX_POP_FILTER);
  const [excludedCommunes, setExcludedCommunes] = useState<Set<string>>(new Set());
  const [statusFilters, setStatusFilters] = useState<Set<CommuneStatus>>(new Set(['TO_ASK']));
  const [showSettings, setShowSettings] = useState(false);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedCommuneId, setFocusedCommuneId] = useState<string | null>(null);

  // Edit Mode & Confirmation
  const [isEditMode, setIsEditMode] = useState(false);
  const [pendingMove, setPendingMove] = useState<MoveConfirmation | null>(null);
  const [pendingScheduleChange, setPendingScheduleChange] = useState<ScheduleChangeConfirmation | null>(null);

  // Helper: Calculate centroid
  const calculateCentroid = (geometry: any): [number, number] => {
    let coordinates = geometry.coordinates;
    if (geometry.type === 'Polygon') {
      coordinates = coordinates[0]; 
    } else if (geometry.type === 'MultiPolygon') {
      coordinates = coordinates[0][0];
    }
    
    if (!coordinates || coordinates.length === 0) return [0, 0];

    let x = 0, y = 0;
    coordinates.forEach((pt: number[]) => {
      x += pt[0];
      y += pt[1];
    });
    return [x / coordinates.length, y / coordinates.length];
  };

  // Helper: Flatten coordinates for adjacency
  const getFlattenedCoordinates = (geometry: any): string[] => {
    const coords: string[] = [];
    const extract = (list: any[]) => {
      if (list.length === 2 && typeof list[0] === 'number' && typeof list[1] === 'number') {
        const key = `${list[0].toFixed(4)},${list[1].toFixed(4)}`;
        coords.push(key);
      } else {
        list.forEach(item => extract(item));
      }
    };
    extract(geometry.coordinates);
    return coords;
  };

  // Fetch Data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(API_GEO_URL);
        if (!response.ok) throw new Error("Erreur chargement API Gouv");
        
        const geoJson = await response.json();
        const features = geoJson.features as GeoFeature[];

        // PARSE CSV DATA FOR TARGET LIST
        const csvCommunes = parseCSV(RAW_CSV_DATA);

        // 1. Initial Map with Merge
        const initialCommunes: Commune[] = features.map(f => {
            const insee = f.properties.code;
            const csvPop = csvCommunes.get(insee);
            
            // Determine status: if in CSV -> TO_ASK, else -> REFUSED (to show context but ignore in clusters)
            const status: CommuneStatus = csvPop !== undefined ? 'TO_ASK' : 'REFUSED';
            const population = csvPop !== undefined ? csvPop : (f.properties.population || 0);

            return {
                id: insee,
                name: f.properties.nom,
                population: population,
                feature: f,
                neighbors: [],
                centroid: calculateCentroid(f.geometry),
                status: status
            };
        });

        // 2. Compute Neighbors (Topology)
        const vertexMap = new Map<string, string[]>();
        initialCommunes.forEach(c => {
          const vertices = getFlattenedCoordinates(c.feature.geometry);
          const uniqueVertices = new Set(vertices);
          uniqueVertices.forEach(v => {
            if (!vertexMap.has(v)) vertexMap.set(v, []);
            vertexMap.get(v)?.push(c.id);
          });
        });

        vertexMap.forEach((communeIds) => {
          if (communeIds.length > 1) {
            for (let i = 0; i < communeIds.length; i++) {
              for (let j = i + 1; j < communeIds.length; j++) {
                const id1 = communeIds[i];
                const id2 = communeIds[j];
                const c1 = initialCommunes.find(c => c.id === id1);
                const c2 = initialCommunes.find(c => c.id === id2);
                if (c1 && c2) {
                  if (!c1.neighbors.includes(id2)) c1.neighbors.push(id2);
                  if (!c2.neighbors.includes(id1)) c2.neighbors.push(id1);
                }
              }
            }
          }
        });

        setCommunes(initialCommunes);
        // By default show TO_ASK and REFUSED to give context
        setStatusFilters(new Set(['TO_ASK', 'REFUSED']));

      } catch (err) {
        console.error(err);
        setError("Impossible de charger les frontières des communes.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []); 

  // Derived state
  const filteredCommunes = useMemo(() => {
    return communes.filter(c => 
      c.population <= maxPopFilter && 
      !excludedCommunes.has(c.id) &&
      statusFilters.has(c.status)
    );
  }, [communes, maxPopFilter, excludedCommunes, statusFilters]);

  // Search results
  const searchResults = useMemo(() => {
      if (!searchQuery || searchQuery.length < 2) return [];
      return filteredCommunes
        .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 5);
  }, [searchQuery, filteredCommunes]);

  const stats = useMemo(() => {
    const active = filteredCommunes.filter(c => c.status === 'TO_ASK');
    const totalPop = active.reduce((acc, c) => acc + c.population, 0);
    const avgZonePop = data && data.clusters.length > 0 
        ? Math.round(data.clusters.filter(c => c.code).reduce((acc, c) => acc + c.totalPopulation, 0) / data.clusters.filter(c => c.code).length) 
        : 0;
    
    return { totalCommunes: active.length, totalPop, avgZonePop };
  }, [filteredCommunes, data]);

  // Initial generation
  useEffect(() => {
    if (filteredCommunes.length > 0 && !data) {
        // Fix: generateClusters only expects 2 arguments
        const result = generateClusters(filteredCommunes, targetPop);
        setData(result);
    }
  }, [filteredCommunes, targetPop]); 

  const handleGenerate = useCallback(() => {
    if (filteredCommunes.length === 0) {
        setData({ clusters: [], unclustered: [] });
        return;
    }
    setIsLoading(true);
    setTimeout(() => {
        // Fix: generateClusters only expects 2 arguments
        const result = generateClusters(filteredCommunes, targetPop);
        setData(result);
        setSelectedCluster(null);
        setAnalysis('');
        setIsEditMode(false);
        setIsLoading(false);
    }, 100);
  }, [filteredCommunes, targetPop]);

  const handleClusterSelect = useCallback((cluster: Cluster) => {
    if (selectedCluster?.id !== cluster.id) setAnalysis(''); 
    const freshCluster = data?.clusters.find(c => c.id === cluster.id) || cluster;
    setSelectedCluster(freshCluster);
  }, [data, selectedCluster]);

  const calculateWeeks = (pop: number) => {
    let weeks = Math.round(pop / targetPop);
    if (weeks < 1) weeks = 1;
    return weeks;
  }

  const handleUpdateDuration = (clusterId: string, delta: number) => {
      if (!data) return;

      const targetCluster = data.clusters.find(c => c.id === clusterId);
      if (!targetCluster) return;

      const newDuration = Math.max(1, targetCluster.durationWeeks + delta);
      if (newDuration === targetCluster.durationWeeks) return;

      // Create a deep copy to simulate the change
      const currentClustersCopy = data.clusters.map(c => ({...c}));
      const updatedClusterCopy = currentClustersCopy.find(c => c.id === clusterId);
      
      if (updatedClusterCopy) {
          updatedClusterCopy.durationWeeks = newDuration;
      }

      // Simulate the schedule
      const rescheduledClusters = recalculateSchedule(currentClustersCopy, weekOverrides, defaultTeamCount);

      // Compare to find impacts
      const impacts: ScheduleImpact[] = [];
      rescheduledClusters.forEach(newC => {
          // Find original state
          const oldC = data.clusters.find(c => c.id === newC.id);
          if (!oldC) return;

          if (newC.id !== clusterId) {
             if (newC.startWeek !== oldC.startWeek || newC.assignedTeam !== oldC.assignedTeam) {
                 impacts.push({
                     clusterId: newC.id,
                     code: newC.code,
                     oldStartWeek: oldC.startWeek,
                     newStartWeek: newC.startWeek,
                     oldTeam: oldC.assignedTeam,
                     newTeam: newC.assignedTeam
                 });
             }
          }
      });

      setPendingScheduleChange({
          targetClusterId: clusterId,
          targetClusterCode: targetCluster.code,
          oldDuration: targetCluster.durationWeeks,
          newDuration: newDuration,
          impactedClusters: impacts,
          newSchedule: rescheduledClusters
      });
  };

  const confirmScheduleChange = () => {
      if (!pendingScheduleChange || !data) return;
      
      setData({ ...data, clusters: pendingScheduleChange.newSchedule });
      
      // Update selected cluster ref if needed
      if (selectedCluster && selectedCluster.id === pendingScheduleChange.targetClusterId) {
          const updated = pendingScheduleChange.newSchedule.find(c => c.id === pendingScheduleChange.targetClusterId);
          if (updated) setSelectedCluster(updated);
      }

      setPendingScheduleChange(null);
  };

  const handleMoveCommuneRequest = useCallback((communeId: string) => {
    if (!data || !selectedCluster) return;
    const sourceCluster = data.clusters.find(c => c.communes.some(com => com.id === communeId));
    if (!sourceCluster || sourceCluster.id === selectedCluster.id) return;
    const commune = sourceCluster.communes.find(c => c.id === communeId);
    if (!commune) return;

    const targetCluster = data.clusters.find(c => c.id === selectedCluster.id);
    if (!targetCluster) return;

    const impact: MoveConfirmation['impact'] = {
        source: {
            oldPop: sourceCluster.totalPopulation,
            newPop: sourceCluster.totalPopulation - commune.population,
            oldWeeks: sourceCluster.durationWeeks,
            newWeeks: calculateWeeks(sourceCluster.totalPopulation - commune.population)
        },
        target: {
            oldPop: targetCluster.totalPopulation,
            newPop: targetCluster.totalPopulation + commune.population,
            oldWeeks: targetCluster.durationWeeks,
            newWeeks: calculateWeeks(targetCluster.totalPopulation + commune.population)
        }
    };
    setPendingMove({
        communeId: commune.id,
        communeName: commune.name,
        communePop: commune.population,
        sourceClusterId: sourceCluster.id,
        sourceClusterCode: sourceCluster.code,
        targetClusterId: targetCluster.id,
        targetClusterCode: targetCluster.code,
        impact
    });
  }, [data, selectedCluster]);

  const confirmMove = () => {
    if (!pendingMove || !data) return;
    const { sourceClusterId, targetClusterId, communeId } = pendingMove;
    const sourceCluster = data.clusters.find(c => c.id === sourceClusterId);
    const targetCluster = data.clusters.find(c => c.id === targetClusterId);
    if (sourceCluster && targetCluster) {
        const communeIndex = sourceCluster.communes.findIndex(c => c.id === communeId);
        if (communeIndex > -1) {
            const [commune] = sourceCluster.communes.splice(communeIndex, 1);
            sourceCluster.totalPopulation -= commune.population;
            sourceCluster.durationWeeks = calculateWeeks(sourceCluster.totalPopulation);
            targetCluster.communes.push(commune);
            targetCluster.totalPopulation += commune.population;
            targetCluster.durationWeeks = calculateWeeks(targetCluster.totalPopulation);
            
            // Recalculate schedule because durations might have changed
            const rescheduled = recalculateSchedule([...data.clusters], weekOverrides, defaultTeamCount);
            
            setData({ ...data, clusters: rescheduled });
            setSelectedCluster({ ...targetCluster });
        }
    }
    setPendingMove(null);
  };

  const handleExportCSV = () => {
      if (!data) return;
      const headers = ['Zone', 'Equipe', 'Semaine Debut', 'Duree', 'Population Total', 'Commune', 'Pop Commune', 'Statut'];
      const rows: string[] = [];
      data.clusters.filter(c => c.code).forEach(cluster => {
          cluster.communes.forEach(commune => {
              rows.push([
                  cluster.code,
                  cluster.assignedTeam.toString(),
                  cluster.startWeek.toString(),
                  cluster.durationWeeks.toString(),
                  cluster.totalPopulation.toString(),
                  `"${commune.name}"`,
                  commune.population.toString(),
                  commune.status
              ].join(','));
          });
      });
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "planning_zones.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Helper handlers
  const handleExcludeCommune = (communeId: string) => { const newSet = new Set(excludedCommunes); newSet.add(communeId); setExcludedCommunes(newSet); };
  const handleIncludeCommune = (communeId: string) => { const newSet = new Set(excludedCommunes); newSet.delete(communeId); setExcludedCommunes(newSet); };
  const toggleStatusFilter = (statusId: string) => { const newSet = new Set(statusFilters); if (newSet.has(statusId as CommuneStatus)) { newSet.delete(statusId as CommuneStatus); } else { newSet.add(statusId as CommuneStatus); } setStatusFilters(newSet); };
  const handleAnalyze = async () => { if (!selectedCluster) return; setIsAnalyzing(true); const text = await analyzeCluster(selectedCluster); setAnalysis(text); setIsAnalyzing(false); };
  
  const modifyWeekTeamCount = (week: number, increment: number) => {
      const current = weekOverrides[week] !== undefined ? weekOverrides[week] : defaultTeamCount;
      const next = Math.max(1, Math.min(6, current + increment)); // Min 1, Max 6
      const newOverrides = { ...weekOverrides, [week]: next };
      setWeekOverrides(newOverrides);
      if (data) {
          const rescheduled = recalculateSchedule([...data.clusters], newOverrides, defaultTeamCount);
          setData({...data, clusters: rescheduled});
      }
  };

  const getCapacityForWeek = (w: number) => {
      if (weekOverrides[w] !== undefined) return weekOverrides[w];
      return defaultTeamCount;
  };

  const getPlanning = () => {
    if (!data) return [];
    // We determine the maximum week that contains data
    const maxDataWeek = data.clusters.length > 0 ? Math.max(...data.clusters.map(c => c.startWeek + c.durationWeeks - 1), 0) : 0;
    // We also check if we have overrides for weeks beyond current data (so they don't disappear)
    const maxOverrideWeek = Math.max(0, ...Object.keys(weekOverrides).map(k => Number(k)));
    const maxWeek = Math.max(maxDataWeek, maxOverrideWeek, 10); // Minimum 10 weeks to show

    const planning = [];
    for (let w = 1; w <= maxWeek; w++) {
      const capacity = getCapacityForWeek(w);
      const weekTeams: (Cluster | undefined)[] = [];
      
      for(let t = 1; t <= capacity; t++) {
        const cluster = data.clusters.find(c => c.assignedTeam === t && w >= c.startWeek && w < (c.startWeek + c.durationWeeks));
        // Logic: if it's the start week, we show the card. 
        // If it's a subsequent week of a multi-week cluster, we return 'undefined' but we will handle rendering a spacer.
        // If nothing is assigned, we return null (empty slot).
        const isStarting = cluster && cluster.startWeek === w;
        weekTeams.push(isStarting ? cluster : (cluster ? undefined : null));
      }
      planning.push({ week: w, capacity, teams: weekTeams });
    }
    return planning;
  };

  if (error) return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-500"><p>{error}</p></div>;

  const schedule = getPlanning();
  const maxCapacity = Math.max(defaultTeamCount, 2, ...(Object.values(weekOverrides) as number[])); // Calculate max columns needed
  const excludedList = communes.filter(c => excludedCommunes.has(c.id));

  return (
    <div className="min-h-screen flex flex-col md:flex-row text-slate-800 bg-white font-sans overflow-hidden">
      {/* Settings Modal - Keep Existing */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900"><Settings size={20} className="text-orange-600"/> Paramètres & Filtres</h3>
                    <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full"><X size={24} /></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-8">
                    <div>
                        <h4 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2"><Filter size={16} className="text-slate-500"/> Visibilité des Statuts</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           {COMMUNE_STATUSES.map(status => (
                               <label key={status.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50/50 cursor-pointer transition-all">
                                   <input type="checkbox" checked={statusFilters.has(status.id as CommuneStatus)} onChange={() => toggleStatusFilter(status.id)} className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300"/>
                                   <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: status.color }}></span><span className="text-sm font-medium text-slate-700">{status.label}</span></div>
                               </label>
                           ))}
                        </div>
                    </div>
                    <hr className="border-slate-100" />
                    <div>
                        <div className="flex justify-between items-center mb-4"><h4 className="font-bold text-sm text-slate-900 flex items-center gap-2"><Users size={16} className="text-slate-500"/> Filtre Population Max</h4><span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">{maxPopFilter.toLocaleString()} hab.</span></div>
                        <input type="range" min="10000" max="200000" step="5000" value={maxPopFilter} onChange={(e) => setMaxPopFilter(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"/>
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2"><Trash2 size={16} className="text-slate-500"/> Exclusions Manuelles ({excludedList.length})</h4>
                        {excludedList.length === 0 ? <div className="text-center p-6 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50"><p className="text-sm text-slate-400">Aucune commune exclue.</p></div> : 
                            <div className="bg-slate-50 border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-40 overflow-y-auto">
                                {excludedList.map(c => (
                                    <div key={c.id} className="p-3 flex justify-between items-center text-sm">
                                        <span className="font-medium text-slate-700">{c.name} <span className="text-slate-400 text-xs font-normal ml-1">({c.population})</span></span>
                                        <button onClick={() => handleIncludeCommune(c.id)} className="text-emerald-600 hover:bg-emerald-100 p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"><RefreshCw size={12} /> Restaurer</button>
                                    </div>
                                ))}
                            </div>
                        }
                    </div>
                </div>
                <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button onClick={() => setShowSettings(false)} className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-200 transition-colors">Fermer</button>
                    {/* Fix: removed 3 === 4 intentional comparison which was always false */}
                    <button onClick={() => { setShowSettings(false); handleGenerate(); }} className="bg-slate-900 hover:bg-black text-white px-5 py-2 rounded-lg font-medium shadow-lg shadow-slate-200 transition-all active:scale-95">Appliquer et Regénérer</button>
                </div>
            </div>
        </div>
      )}

      {/* Schedule Change Confirmation Modal */}
      {pendingScheduleChange && (
          <div className="fixed inset-0 bg-black/60 z-[1100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                      <Clock className="text-orange-600" size={24}/>
                      Confirmation Planning
                  </h3>
              </div>
              <div className="p-6 overflow-y-auto space-y-6">
                 <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center gap-4">
                     <div className="bg-orange-200 text-orange-800 font-bold p-3 rounded-lg text-lg text-center min-w-[60px]">
                         Zone {pendingScheduleChange.targetClusterCode}
                     </div>
                     <div>
                         <div className="text-sm font-bold text-slate-700 uppercase">Changement Durée</div>
                         <div className="flex items-center gap-2 text-lg font-medium text-slate-900">
                             <span>{pendingScheduleChange.oldDuration} sem.</span>
                             <ArrowRight size={18} className="text-slate-400"/>
                             <span className="font-bold text-orange-700">{pendingScheduleChange.newDuration} sem.</span>
                         </div>
                     </div>
                 </div>

                 <div>
                     <h4 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
                         <AlertTriangle size={16} className="text-amber-500"/>
                         Impacts Collatéraux ({pendingScheduleChange.impactedClusters.length})
                     </h4>
                     {pendingScheduleChange.impactedClusters.length === 0 ? (
                         <div className="text-sm text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">Aucun autre changement de planning.</div>
                     ) : (
                         <div className="bg-slate-50 border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-40 overflow-y-auto">
                             {pendingScheduleChange.impactedClusters.map(impact => (
                                 <div key={impact.clusterId} className="p-3 text-sm flex justify-between items-center">
                                     <span className="font-bold text-slate-700">Zone {impact.code}</span>
                                     <div className="flex items-center gap-3 text-xs">
                                         {impact.oldStartWeek !== impact.newStartWeek && (
                                             <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded">
                                                 <span className="text-slate-500">S{impact.oldStartWeek}</span>
                                                 <ArrowRight size={10} className="text-slate-300"/>
                                                 <span className="font-bold text-slate-800">S{impact.newStartWeek}</span>
                                             </div>
                                         )}
                                         {impact.oldTeam !== impact.newTeam && (
                                              <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded">
                                                 <span className="text-slate-500">Eq.{impact.oldTeam}</span>
                                                 <ArrowRight size={10} className="text-slate-300"/>
                                                 <span className="font-bold text-slate-800">Eq.{impact.newTeam}</span>
                                             </div>
                                         )}
                                     </div>
                                 </div>
                             ))}
                         </div>
                     )}
                 </div>
                 <p className="text-sm text-slate-500">
                     Modifier la durée de cette zone va déclencher un recalcul automatique du calendrier pour combler les vides ou décaler les zones suivantes.
                 </p>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
                  <button onClick={() => setPendingScheduleChange(null)} className="px-4 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-200 transition-colors">Annuler</button>
                  <button onClick={confirmScheduleChange} className="px-5 py-2 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 shadow-md flex items-center gap-2">Confirmer</button>
              </div>
            </div>
          </div>
      )}

      {/* Confirmation Modal - Move Commune */}
      {pendingMove && (
        <div className="fixed inset-0 bg-black/60 z-[1100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50"><h3 className="font-bold text-xl text-slate-900">Confirmer le déplacement</h3></div>
                <div className="p-6 space-y-6">
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Vous souhaitez ajouter <strong className="text-slate-900">{pendingMove.communeName}</strong> ({pendingMove.communePop.toLocaleString()} habitants) à la zone <strong className="text-emerald-700">{pendingMove.targetClusterCode}</strong>.
                        <br/><br/>
                        Cela fera passer cette zone à <strong>{pendingMove.impact.target.newPop.toLocaleString()}</strong> habitants (<strong>{pendingMove.impact.target.newWeeks}</strong> semaines).
                        <br/><br/>
                        L'ancienne zone <strong className="text-red-700">{pendingMove.sourceClusterCode}</strong> passera à <strong>{pendingMove.impact.source.newPop.toLocaleString()}</strong> habitants (<strong>{pendingMove.impact.source.newWeeks}</strong> semaines).
                        <br/><br/>
                        Souhaitez-vous refaire le calcul des zones en conséquence ?
                    </p>
                    <div className="relative pt-2">
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-full p-1 z-10 shadow-sm"><ArrowRight size={16} className="text-slate-400" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                                <div className="text-xs font-bold text-red-800 uppercase tracking-wider mb-2">Zone {pendingMove.sourceClusterCode}</div>
                                <div className="text-2xl font-bold text-red-900">{pendingMove.impact.source.newPop.toLocaleString()}</div>
                                <div className="text-xs text-red-600 mt-1">{pendingMove.impact.source.oldWeeks} sem. &rarr; <strong>{pendingMove.impact.source.newWeeks} sem.</strong></div>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">Zone {pendingMove.targetClusterCode}</div>
                                <div className="text-2xl font-bold text-emerald-900">{pendingMove.impact.target.newPop.toLocaleString()}</div>
                                <div className="text-xs text-emerald-600 mt-1">{pendingMove.impact.target.oldWeeks} sem. &rarr; <strong>{pendingMove.impact.target.newWeeks} sem.</strong></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
                    <button onClick={() => setPendingMove(null)} className="px-4 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-200 transition-colors">Non</button>
                    <button onClick={confirmMove} className="px-5 py-2 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 shadow-md flex items-center gap-2">Oui</button>
                </div>
            </div>
        </div>
      )}

      {/* Sidebar - PLANNING VIEW */}
      <aside className="w-full md:w-1/3 lg:w-[420px] bg-white border-r border-slate-200 flex flex-col h-screen overflow-hidden sticky top-0 shadow-xl z-30">
        <div className="p-6 border-b border-slate-100 flex-none bg-white">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 tracking-tight"><div className="bg-orange-600 text-white p-1.5 rounded-lg"><MapPin size={20} /></div>ZonePlanner</h1>
            <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors border border-transparent hover:border-slate-200" title="Paramètres & Filtres"><Settings size={20} /></button>
          </div>
          <div className="space-y-5 bg-slate-50 p-4 rounded-xl border border-slate-100">
             <div className="grid grid-cols-2 gap-5">
                <div>
                    <div className="flex justify-between mb-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Équipes par Défaut</label><span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">{defaultTeamCount}</span></div>
                    <input type="range" min="1" max="5" step="1" value={defaultTeamCount} onChange={(e) => setDefaultTeamCount(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600"/>
                </div>
                <div>
                    <div className="flex justify-between mb-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cible Hab.</label><span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">{targetPop/1000}k</span></div>
                    <input type="range" min="4000" max="20000" step="1000" value={targetPop} onChange={(e) => setTargetPop(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600"/>
                </div>
             </div>
             <div className="flex gap-2">
                 <button onClick={handleGenerate} disabled={isLoading} className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3 px-4 rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-[0.98]">
                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />} Regénérer
                 </button>
                 <button onClick={handleExportCSV} className="px-3 py-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors" title="Exporter CSV">
                    <Download size={18}/>
                 </button>
             </div>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50/50 pb-40">
          <div className="flex justify-between items-center px-2">
             <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2"><Calendar size={14} className="text-orange-500"/> Calendrier & Équipes</h2>
             <div className="text-[10px] text-slate-500 font-bold bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm">{schedule.length} semaines</div>
          </div>
          
          {/* Calendar Header with Dynamic Teams */}
          <div className="grid gap-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center" style={{ gridTemplateColumns: `50px repeat(${maxCapacity}, 1fr)` }}>
            <div>Sem.</div>
            {Array.from({length: maxCapacity}).map((_, i) => (<div key={i}>Eq. {i+1}</div>))}
          </div>

          <div className="space-y-3">
            {schedule.map((slot) => (
              <div key={slot.week} className="grid gap-3 items-stretch text-sm group/week" style={{ gridTemplateColumns: `50px repeat(${maxCapacity}, 1fr)` }}>
                {/* Week Column with Controls */}
                <div className="flex flex-col items-center justify-start py-1 border-r border-slate-200/50">
                    <div className="font-mono text-xs text-slate-500 font-bold mb-1">S{slot.week}</div>
                    <div className="flex flex-col items-center gap-0.5 bg-white border border-slate-200 rounded-md shadow-sm">
                        <button onClick={() => modifyWeekTeamCount(slot.week, 1)} className="text-slate-400 hover:text-orange-600 hover:bg-orange-50 w-full flex justify-center py-0.5 rounded-t"><Plus size={10} /></button>
                        <div className="text-[10px] font-bold text-slate-700 px-1">{slot.capacity}</div>
                        <button onClick={() => modifyWeekTeamCount(slot.week, -1)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 w-full flex justify-center py-0.5 rounded-b"><Minus size={10} /></button>
                    </div>
                </div>

                {/* Teams Columns */}
                {Array.from({length: maxCapacity}).map((_, idx) => {
                   if (idx >= slot.capacity) {
                       return <div key={idx} className="bg-slate-100/50 rounded-xl border border-transparent flex items-center justify-center"><div className="w-1 h-1 bg-slate-300 rounded-full"></div></div>;
                   }

                   const cluster = slot.teams[idx];
                   
                   if (cluster === null) {
                       return <div key={idx} className="rounded-xl border border-dashed border-slate-200 bg-white/50"></div>;
                   }

                   if (cluster === undefined) {
                       return <div key={idx}></div>; 
                   }

                   // IMPROVED CARD DESIGN
                   const rowSpan = cluster.durationWeeks;
                   const isMultiWeek = rowSpan > 1;
                   return (
                        <div key={idx} onClick={() => handleClusterSelect(cluster)} style={{ gridRow: `span ${rowSpan}` }}
                          className={`
                            rounded-xl border cursor-pointer transition-all relative overflow-hidden flex flex-col p-0
                            ${selectedCluster?.id === cluster.id 
                                ? 'bg-slate-800 border-slate-900 text-white shadow-lg ring-2 ring-orange-500/50 scale-[1.02] z-20' 
                                : 'bg-white border-slate-200 text-slate-700 hover:border-orange-300 hover:shadow-md hover:-translate-y-0.5 z-10'}
                          `}
                        >
                          <div className="flex h-full">
                              {/* Colored Strip */}
                              <div className="w-1.5 flex-none h-full" style={{ backgroundColor: cluster.color }}></div>
                              
                              <div className="flex-1 p-2 flex flex-col justify-between min-h-[70px]">
                                  <div>
                                      <div className="flex justify-between items-start">
                                         <span className="font-black text-sm tracking-tight leading-none">Zone {cluster.code}</span>
                                         {isMultiWeek && (
                                             <div className={`text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded ${selectedCluster?.id === cluster.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                 {rowSpan} sem.
                                             </div>
                                         )}
                                      </div>
                                      <div className={`text-[10px] mt-1 font-medium ${selectedCluster?.id === cluster.id ? 'text-slate-400' : 'text-slate-500'}`}>{(cluster.totalPopulation / 1000).toFixed(1)}k hab.</div>
                                  </div>
                                  
                                  {/* Dots for visual duration */}
                                  {isMultiWeek && (
                                     <div className="flex gap-1 mt-2 opacity-50">
                                         {Array.from({length: rowSpan}).map((_, i) => (
                                             <div key={i} className={`h-1 flex-1 rounded-full ${selectedCluster?.id === cluster.id ? 'bg-white' : 'bg-slate-300'}`}></div>
                                         ))}
                                     </div>
                                  )}
                              </div>
                          </div>
                        </div>
                   );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Details Panel - Updated with Time Management */}
        <div className={`absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-30 transition-transform duration-300 flex flex-col ${selectedCluster ? 'translate-y-0 max-h-[60%]' : 'translate-y-full h-0'}`}>
           {selectedCluster && (
            <>
              <div className="p-4 sm:p-5 border-b border-slate-100 bg-white z-10 sticky top-0 flex-none">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                     <div>
                        <h2 className="font-black text-2xl flex items-center gap-3 text-slate-900"><span className="w-4 h-4 rounded-full shadow-sm ring-2 ring-white" style={{ background: selectedCluster.color }}></span>Zone {selectedCluster.code}</h2>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-xs bg-slate-100 px-2.5 py-1 rounded-md text-slate-600 font-bold border border-slate-200">{selectedCluster.totalPopulation.toLocaleString()} hab.</span>
                            <span className="text-xs bg-orange-50 text-orange-700 px-2.5 py-1 rounded-md font-bold border border-orange-100 flex items-center gap-1"><Clock size={12}/> {selectedCluster.durationWeeks} semaine{selectedCluster.durationWeeks > 1 ? 's' : ''}</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                        <button onClick={() => setIsEditMode(!isEditMode)} className={`p-2.5 rounded-xl transition-all font-bold text-xs flex items-center gap-2 ${isEditMode ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-inner' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 shadow-sm'}`}><Edit3 size={16} />{isEditMode ? 'Mode Édition' : 'Modifier'}</button>
                        {!analysis && (<button onClick={handleAnalyze} disabled={isAnalyzing} className="p-2.5 rounded-xl bg-gradient-to-br from-purple-600 to-orange-600 text-white hover:shadow-lg hover:shadow-purple-200 transition-all active:scale-95" title="Analyser avec IA">{isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}</button>)}
                        <button onClick={() => setSelectedCluster(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={20} /></button>
                     </div>
                  </div>
                  
                  {/* TIME MANAGEMENT CONTROLS */}
                  <div className="mt-4 flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Calendar size={14}/> Gestion du Temps</div>
                      <div className="h-4 w-px bg-slate-200"></div>
                      <div className="flex items-center gap-2">
                           <button onClick={() => handleUpdateDuration(selectedCluster.id, -1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-colors" title="Réduire durée"><Minus size={14}/></button>
                           <span className="font-mono font-bold text-slate-700 w-8 text-center">{selectedCluster.durationWeeks}s</span>
                           <button onClick={() => handleUpdateDuration(selectedCluster.id, 1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-colors" title="Augmenter durée"><Plus size={14}/></button>
                      </div>
                      <div className="ml-auto">
                          <button onClick={() => handleUpdateDuration(selectedCluster.id, -1)} disabled={selectedCluster.durationWeeks <= 1} className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-200 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
                              <CheckCircle size={14}/> Terminer plus tôt
                          </button>
                      </div>
                  </div>

                  {isEditMode && (<div className="mt-3 text-xs bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-100 flex items-center gap-2 animate-in slide-in-from-top-2"><Info size={16} className="flex-shrink-0 text-amber-600"/><p>Cliquez sur une commune sur la carte pour l'ajouter à cette zone.</p></div>)}
              </div>
              <div className="overflow-y-auto p-3 bg-slate-50 flex-grow">
                 {analysis && (<div className="bg-white border border-purple-100 p-4 rounded-xl mb-4 shadow-sm text-sm prose prose-purple relative"><button onClick={() => setAnalysis('')} className="absolute top-2 right-2 text-slate-300 hover:text-slate-500"><X size={16}/></button><h4 className="font-bold text-purple-800 flex items-center gap-2 mb-2"><Sparkles size={16}/> Analyse IA</h4><div dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br/>') }} /></div>)}
                 <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                     <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-50 border-b border-slate-100"><tr><th className="px-4 py-3 font-semibold">Commune</th><th className="px-4 py-3 font-semibold text-right">Pop.</th><th className="px-4 py-3 font-semibold text-right"></th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                            {selectedCluster.communes.sort((a,b) => b.population - a.population).map(c => {
                                const statusDef = COMMUNE_STATUSES.find(s => s.id === c.status);
                                return (
                                    <tr key={c.id} className="group hover:bg-slate-50/80 transition-colors">
                                        <td className="px-4 py-2.5 font-medium text-slate-700 flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-slate-100 shadow-sm" style={{ backgroundColor: statusDef?.color || '#ccc' }} title={statusDef?.label}></div><span className="truncate">{c.name}</span></td>
                                        <td className="px-4 py-2.5 text-slate-500 font-mono text-xs text-right">{c.population.toLocaleString()}</td>
                                        <td className="px-4 py-2.5 text-right"><button onClick={(e) => { e.stopPropagation(); handleExcludeCommune(c.id); }} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors opacity-0 group-hover:opacity-100" title="Exclure de la liste"><Trash2 size={14} /></button></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                     </table>
                 </div>
              </div>
            </>
           )}
        </div>
      </aside>

      {/* Main Content (Map) - Updated MapCanvas usage */}
      <main className="flex-1 flex flex-col h-screen relative bg-slate-100">
        {/* KPI Dashboard */}
        <div className="absolute top-4 left-4 right-4 z-[400] flex justify-center pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md shadow-lg border border-slate-200/50 rounded-2xl p-2 px-6 flex items-center gap-6 pointer-events-auto max-w-4xl w-full justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Users size={20}/></div>
                    <div className="hidden sm:block">
                        <div className="text-xs text-slate-500 font-bold uppercase">Population</div>
                        <div className="text-lg font-black text-slate-800">{stats.totalPop.toLocaleString()}</div>
                    </div>
                </div>
                {/* SEARCH BAR */}
                <div className="flex-1 max-w-sm relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                       type="text" 
                       placeholder="Chercher une commune..." 
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white transition-all"
                    />
                    {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-[500]">
                            {searchResults.map(c => (
                                <button key={c.id} onClick={() => { setFocusedCommuneId(c.id); setSearchQuery(c.name); }} className="w-full text-left px-4 py-2 hover:bg-orange-50 text-sm flex justify-between items-center group">
                                    <span className="font-medium text-slate-700">{c.name}</span>
                                    <span className="text-xs text-slate-400 font-mono group-hover:text-orange-500">{c.population}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="hidden sm:flex items-center gap-3">
                     <div className="bg-amber-100 p-2 rounded-lg text-amber-600"><Layers size={20}/></div>
                    <div>
                        <div className="text-xs text-slate-500 font-bold uppercase">Communes</div>
                        <div className="text-lg font-black text-slate-800">{stats.totalCommunes}</div>
                    </div>
                </div>
            </div>
        </div>

        {/* Floating Legend */}
        <div className="absolute bottom-6 left-6 z-[400] bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-200 max-w-xs">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2"><Info size={14}/> Légende Carte</h4>
            <div className="space-y-2">
                {COMMUNE_STATUSES.map(s => (
                    <div key={s.id} className="flex items-center gap-3 text-sm">
                        <span className="w-3 h-3 rounded-full shadow-sm ring-1 ring-slate-100" style={{backgroundColor: s.color}}></span>
                        <span className="text-slate-700 font-medium">{s.label}</span>
                    </div>
                ))}
                <div className="flex items-center gap-3 text-sm mt-3 pt-3 border-t border-slate-100"><span className="w-3 h-3 rounded-full bg-slate-900 shadow-sm"></span><span className="text-slate-900 font-bold">Zone sélectionnée</span></div>
            </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 z-[500] flex flex-col items-center justify-center backdrop-blur-sm">
            <Loader2 className="animate-spin text-slate-900 mb-4" size={48} />
            <p className="text-slate-800 font-bold text-lg">Calcul de l'optimisation...</p>
          </div>
        )}

         {/* Map Container */}
         <div className="flex-grow w-full h-full relative z-0">
            {data && !isLoading && (
              <MapCanvas 
                clusters={data.clusters} 
                allCommunes={communes}
                onSelectCluster={handleClusterSelect} 
                selectedClusterId={selectedCluster?.id}
                isEditMode={isEditMode}
                isBrushMode={false}
                brushSelection={new Set()}
                onCommuneBrush={() => {}}
                onCommuneHover={() => {}}
                onCommuneClick={handleMoveCommuneRequest}
                focusedCommuneId={focusedCommuneId}
              />
            )}
            
            {!isLoading && filteredCommunes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
                    <div className="text-center max-w-md p-8">
                        <div className="bg-white p-4 rounded-full inline-block mb-4 shadow-sm"><Filter size={32} className="text-slate-400"/></div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Aucune commune affichée</h3>
                        <p className="text-slate-500">Modifiez les filtres dans le panneau de gauche pour voir des données.</p>
                        <button onClick={() => setShowSettings(true)} className="mt-4 text-orange-600 font-bold hover:underline">Ouvrir les paramètres</button>
                    </div>
                </div>
            )}
            
            <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] shadow-sm border border-slate-200 z-[400] text-slate-400 font-medium pointer-events-none">
               Données temps réel: geo.api.gouv.fr
            </div>
         </div>
      </main>
    </div>
  );
};

export default App;
