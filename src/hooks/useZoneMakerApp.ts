import { useState, useEffect, useCallback, useMemo } from 'react';
import { generateClusters, recalculateSchedule } from '@/services/clusteringService';
import { analyzeCluster } from '@/services/geminiService';
import { Cluster, ClusteringResult, Commune, GeoFeature, MoveConfirmation, CommuneStatus, ScheduleChangeConfirmation, ScheduleImpact } from '@/components/zone-maker/types';
import { TARGET_POPULATION, API_GEO_URL, DEFAULT_MAX_POP_FILTER, RAW_CSV_DATA } from '@/components/zone-maker/constants';

// Helper to parse CSV (simple version)
const parseCSV = (csv: string): Map<string, number> => {
  const lines = csv.trim().split('\n');
  const map = new Map<string, number>();
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cols = line.split(',');
    const insee = cols[1];
    const pop = parseInt(cols[6] || '0', 10);
    if (insee && !isNaN(pop)) {
      map.set(insee, pop);
    }
  }
  return map;
};

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
  coordinates.forEach((pt: number[]) => { x += pt[0]; y += pt[1]; });
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

export function useZoneMakerApp() {
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
        const csvCommunes = parseCSV(RAW_CSV_DATA);

        const initialCommunes: Commune[] = features.map(f => {
          const insee = f.properties.code;
          const csvPop = csvCommunes.get(insee);
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

        // Compute Neighbors
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
  };

  const handleUpdateDuration = (clusterId: string, delta: number) => {
    if (!data) return;
    const targetCluster = data.clusters.find(c => c.id === clusterId);
    if (!targetCluster) return;
    const newDuration = Math.max(1, targetCluster.durationWeeks + delta);
    if (newDuration === targetCluster.durationWeeks) return;

    const currentClustersCopy = data.clusters.map(c => ({ ...c }));
    const updatedClusterCopy = currentClustersCopy.find(c => c.id === clusterId);
    if (updatedClusterCopy) {
      updatedClusterCopy.durationWeeks = newDuration;
    }
    const rescheduledClusters = recalculateSchedule(currentClustersCopy, weekOverrides, defaultTeamCount);

    const impacts: ScheduleImpact[] = [];
    rescheduledClusters.forEach(newC => {
      const oldC = data.clusters.find(c => c.id === newC.id);
      if (!oldC) return;
      if (newC.id !== clusterId) {
        if (newC.startWeek !== oldC.startWeek || newC.assignedTeam !== oldC.assignedTeam) {
          impacts.push({
            clusterId: newC.id, code: newC.code,
            oldStartWeek: oldC.startWeek, newStartWeek: newC.startWeek,
            oldTeam: oldC.assignedTeam, newTeam: newC.assignedTeam
          });
        }
      }
    });

    setPendingScheduleChange({
      targetClusterId: clusterId, targetClusterCode: targetCluster.code,
      oldDuration: targetCluster.durationWeeks, newDuration: newDuration,
      impactedClusters: impacts, newSchedule: rescheduledClusters
    });
  };

  const confirmScheduleChange = () => {
    if (!pendingScheduleChange || !data) return;
    setData({ ...data, clusters: pendingScheduleChange.newSchedule });
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
      communeId: commune.id, communeName: commune.name, communePop: commune.population,
      sourceClusterId: sourceCluster.id, sourceClusterCode: sourceCluster.code,
      targetClusterId: targetCluster.id, targetClusterCode: targetCluster.code,
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
          cluster.code, cluster.assignedTeam.toString(), cluster.startWeek.toString(),
          cluster.durationWeeks.toString(), cluster.totalPopulation.toString(),
          `"${commune.name}"`, commune.population.toString(), commune.status
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

  const handleExcludeCommune = (communeId: string) => { const newSet = new Set(excludedCommunes); newSet.add(communeId); setExcludedCommunes(newSet); };
  const handleIncludeCommune = (communeId: string) => { const newSet = new Set(excludedCommunes); newSet.delete(communeId); setExcludedCommunes(newSet); };
  const toggleStatusFilter = (statusId: string) => { const newSet = new Set(statusFilters); if (newSet.has(statusId as CommuneStatus)) { newSet.delete(statusId as CommuneStatus); } else { newSet.add(statusId as CommuneStatus); } setStatusFilters(newSet); };
  const handleAnalyze = async () => { if (!selectedCluster) return; setIsAnalyzing(true); const text = await analyzeCluster(selectedCluster); setAnalysis(text); setIsAnalyzing(false); };

  const modifyWeekTeamCount = (week: number, increment: number) => {
    const current = weekOverrides[week] !== undefined ? weekOverrides[week] : defaultTeamCount;
    const next = Math.max(1, Math.min(6, current + increment));
    const newOverrides = { ...weekOverrides, [week]: next };
    setWeekOverrides(newOverrides);
    if (data) {
      const rescheduled = recalculateSchedule([...data.clusters], newOverrides, defaultTeamCount);
      setData({ ...data, clusters: rescheduled });
    }
  };

  const getCapacityForWeek = (w: number) => {
    if (weekOverrides[w] !== undefined) return weekOverrides[w];
    return defaultTeamCount;
  };

  const getPlanning = () => {
    if (!data) return [];
    const maxDataWeek = data.clusters.length > 0 ? Math.max(...data.clusters.map(c => c.startWeek + c.durationWeeks - 1), 0) : 0;
    const maxOverrideWeek = Math.max(0, ...Object.keys(weekOverrides).map(k => Number(k)));
    const maxWeek = Math.max(maxDataWeek, maxOverrideWeek, 10);
    const planning = [];
    for (let w = 1; w <= maxWeek; w++) {
      const capacity = getCapacityForWeek(w);
      const weekTeams: (Cluster | undefined)[] = [];
      for (let t = 1; t <= capacity; t++) {
        const cluster = data.clusters.find(c => c.assignedTeam === t && w >= c.startWeek && w < (c.startWeek + c.durationWeeks));
        const isStarting = cluster && cluster.startWeek === w;
        weekTeams.push(isStarting ? cluster : (cluster ? undefined : null));
      }
      planning.push({ week: w, capacity, teams: weekTeams });
    }
    return planning;
  };

  const schedule = getPlanning();
  const maxCapacity = Math.max(defaultTeamCount, 2, ...(Object.values(weekOverrides) as number[]));
  const excludedList = communes.filter(c => excludedCommunes.has(c.id));

  return {
    // State
    data, communes, selectedCluster, setSelectedCluster,
    analysis, setAnalysis, isAnalyzing, isLoading, error,
    targetPop, setTargetPop, defaultTeamCount, setDefaultTeamCount,
    weekOverrides, maxPopFilter, setMaxPopFilter,
    excludedCommunes, statusFilters,
    showSettings, setShowSettings,
    searchQuery, setSearchQuery, focusedCommuneId, setFocusedCommuneId,
    isEditMode, setIsEditMode,
    pendingMove, setPendingMove,
    pendingScheduleChange, setPendingScheduleChange,

    // Derived
    filteredCommunes, searchResults, stats, schedule, maxCapacity, excludedList,

    // Actions
    handleGenerate, handleClusterSelect, handleUpdateDuration,
    confirmScheduleChange, handleMoveCommuneRequest, confirmMove,
    handleExportCSV, handleExcludeCommune, handleIncludeCommune,
    toggleStatusFilter, handleAnalyze, modifyWeekTeamCount,
  };
}
