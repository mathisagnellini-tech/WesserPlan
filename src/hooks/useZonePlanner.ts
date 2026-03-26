import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { recalculateSchedule, calculateDuration, getZoneStatus } from '@/services/clusteringService';
import { Cluster, ClusteringResult, Commune, GeoFeature, CommuneStatus } from '@/components/zone-maker/types';
import {
  API_GEO_URL, TARGET_COMMUNES_LIST, DEPT_CODE, CLUSTER_COLORS, MIN_1W
} from '@/components/zone-maker/constants';

export const ASSOCIATIONS = [
  { id: 'MSF', label: 'MSF', color: '#ee0000' },
  { id: 'MDM', label: 'MDM', color: '#0095ff' },
  { id: 'UNICEF', label: 'UNICEF', color: '#1ca9e1' },
  { id: 'WWF', label: 'WWF', color: '#111111' },
  { id: 'AIDES', label: 'AIDES', color: '#e4002b' },
  { id: 'HI', label: 'HI', color: '#0055a4' },
  { id: '4P', label: '4P', color: '#4a90e2' },
  { id: 'FA', label: 'FA', color: '#f39c12' }
];

export const CURRENT_WEEK = 2;

export function useZonePlanner() {
  const [selectedNGO, setSelectedNGO] = useState(ASSOCIATIONS[0].id);
  const [ngoStates, setNgoStates] = useState<Record<string, ClusteringResult>>({});

  const [data, setData] = useState<ClusteringResult>({ clusters: [], unclustered: [] });
  const [history, setHistory] = useState<ClusteringResult[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [defaultTeamCount, setDefaultTeamCount] = useState(2);
  const [weekOverrides, setWeekOverrides] = useState<Record<number, number>>({});

  const [searchQuery, setSearchQuery] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isBrushMode, setIsBrushMode] = useState(false);
  const [isBonusMode, setIsBonusMode] = useState(false);
  const [bonusSelection, setBonusSelection] = useState<Set<string>>(new Set());
  const [showBonusConfirm, setShowBonusConfirm] = useState(false);

  const [showCNFF, setShowCNFF] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [brushSelection, setBrushSelection] = useState<Set<string>>(new Set());
  const [hoveredCommune, setHoveredCommune] = useState<Commune | null>(null);

  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  const [visibleStatuses, setVisibleStatuses] = useState<Set<CommuneStatus>>(new Set(['ASKED']));
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isolatedWeek, setIsolatedWeek] = useState<number | null>(null);
  const [visibleTeamPath, setVisibleTeamPath] = useState<number | null>(null);
  const [showSectorPolicy, setShowSectorPolicy] = useState(false);

  // Auto-save current planning
  useEffect(() => {
    if (!isLoading) {
      setNgoStates(prev => ({
        ...prev,
        [selectedNGO]: data
      }));
    }
  }, [data, selectedNGO, isLoading]);

  // NGO change
  const handleNGOChange = (ngoId: string) => {
    setSelectedCluster(null);
    setHistory([]);
    setIsBrushMode(false);
    setIsBonusMode(false);
    setBonusSelection(new Set());
    setShowCNFF(false);
    setBrushSelection(new Set());

    setSelectedNGO(ngoId);
    if (ngoStates[ngoId]) {
      setData(ngoStates[ngoId]);
    } else {
      setData({ clusters: [], unclustered: [] });
    }
  };

  const pushToHistory = (currentState: ClusteringResult) => {
    setHistory(prev => [JSON.parse(JSON.stringify(currentState)), ...prev].slice(0, 10));
  };

  const handleUndo = () => {
    if (history.length > 0) {
      setData(history[0]);
      setHistory(prev => prev.slice(1));
    }
  };

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((mouseMoveEvent: MouseEvent) => {
    if (isResizing) {
      const newWidth = mouseMoveEvent.clientX;
      if (newWidth >= 300 && newWidth <= 800) {
        setSidebarWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(API_GEO_URL);
        const geoJson = await response.json();
        const features = geoJson.features as GeoFeature[];
        const targetNamesSet = new Set(TARGET_COMMUNES_LIST.map(n => n.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")));

        const initialCommunes: Commune[] = features.map(f => {
          const normalizedName = f.properties.nom.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          let status: CommuneStatus = 'NON_ASKED';
          if (targetNamesSet.has(normalizedName)) status = 'ASKED';

          return {
            id: f.properties.code,
            name: f.properties.nom,
            population: f.properties.population || 0,
            feature: f,
            neighbors: [],
            centroid: ((): [number, number] => {
              let ring: number[][] = [];
              if (f.geometry.type === 'Polygon') ring = (f.geometry.coordinates as number[][][])[0];
              else if (f.geometry.type === 'MultiPolygon') ring = (f.geometry.coordinates as number[][][][])[0][0];
              if (!ring || ring.length === 0) return [0, 0];
              let x = 0, y = 0;
              ring.forEach((pt: number[]) => { x += pt[0]; y += pt[1]; });
              return [x / ring.length, y / ring.length];
            })(),
            status: status
          };
        });
        setCommunes(initialCommunes);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleCommuneBrush = (communeId: string, forceState?: boolean) => {
    setBrushSelection(prev => {
      const next = new Set(prev);
      const shouldAdd = forceState !== undefined ? forceState : !prev.has(communeId);
      if (shouldAdd) next.add(communeId);
      else next.delete(communeId);
      return next;
    });
  };

  const visibleCommunes = useMemo(() => {
    let filtered = communes.filter(c => visibleStatuses.has(c.status));
    if (isolatedWeek !== null) {
      const activeClusters = data.clusters.filter(c =>
        isolatedWeek >= c.startWeek &&
        isolatedWeek < (c.startWeek + c.durationWeeks)
      );
      const activeCommuneIds = new Set(activeClusters.flatMap(c => c.communes.map(com => com.id)));
      filtered = filtered.filter(c => activeCommuneIds.has(c.id));
    }
    return filtered;
  }, [communes, visibleStatuses, isolatedWeek, data.clusters]);

  const brushStats = useMemo(() => {
    const selectedCommunes = communes.filter(c => brushSelection.has(c.id));
    const pop = selectedCommunes.reduce((sum, c) => sum + c.population, 0);
    return {
      pop,
      count: selectedCommunes.length,
      duration: calculateDuration(pop),
      status: getZoneStatus(pop)
    };
  }, [brushSelection, communes]);

  const validateManualZone = () => {
    if (brushSelection.size === 0) return;
    pushToHistory(data);

    const selectedComs = communes.filter(c => brushSelection.has(c.id));
    const pop = selectedComs.reduce((sum, c) => sum + c.population, 0);
    const index = data.clusters.length;

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let letterPart = index < 26 ? letters[index] : letters[Math.floor(index / 26) - 1] + letters[index % 26];

    const newCluster: Cluster = {
      id: `cluster-${Date.now()}`,
      code: `${DEPT_CODE}${letterPart}`,
      communes: selectedComs,
      totalPopulation: pop,
      color: CLUSTER_COLORS[index % CLUSTER_COLORS.length],
      durationWeeks: calculateDuration(pop),
      startWeek: 0,
      assignedTeam: 0,
      sortLat: selectedComs[0]?.centroid?.[1] || 0
    };

    setData(prev => ({ ...prev, clusters: [...prev.clusters, newCluster] }));
    setBrushSelection(new Set());
    setIsBrushMode(false);
  };

  const deleteCluster = (id: string) => {
    pushToHistory(data);
    setData(prev => ({ ...prev, clusters: prev.clusters.filter(c => c.id !== id) }));
    if (selectedCluster?.id === id) setSelectedCluster(null);
  };

  const handleCommuneClick = useCallback((communeId: string) => {
    if (isBonusMode && selectedCluster) {
      const sourceCluster = data.clusters.find(c => c.communes.some(com => com.id === communeId));
      const targetCommune = communes.find(c => c.id === communeId);

      const isTransferable = sourceCluster && sourceCluster.id !== selectedCluster.id;
      const isUnassignedAsked = !sourceCluster && targetCommune?.status === 'ASKED';

      if (isTransferable || isUnassignedAsked) {
        setBonusSelection(prev => {
          const next = new Set(prev);
          if (next.has(communeId)) next.delete(communeId);
          else next.add(communeId);
          return next;
        });
      }
    } else {
      const cluster = data.clusters.find(c => c.communes.some(com => com.id === communeId));
      if (cluster) {
        setSelectedCluster(cluster);
        setIsBonusMode(false);
        setBonusSelection(new Set());
      }
    }
  }, [isBonusMode, selectedCluster, data.clusters, communes]);

  const handleSelectCluster = useCallback((cluster: Cluster) => {
    if (!isBonusMode) {
      setSelectedCluster(cluster);
      setIsBonusMode(false);
      setBonusSelection(new Set());
    }
  }, [isBonusMode]);

  const bonusImpacts = useMemo(() => {
    if (bonusSelection.size === 0 || !selectedCluster) return null;

    const selectedComs = communes.filter(c => bonusSelection.has(c.id));
    const totalAddedPop = selectedComs.reduce((sum, c) => sum + c.population, 0);

    const sourceImpacts: Record<string, { code: string, lostPop: number, finalPop: number, isLow: boolean, communes: string[] }> = {};
    selectedComs.forEach(com => {
      const cluster = data.clusters.find(c => c.communes.some(c2 => c2.id === com.id));
      if (cluster) {
        if (!sourceImpacts[cluster.id]) {
          sourceImpacts[cluster.id] = { code: cluster.code, lostPop: 0, finalPop: cluster.totalPopulation, isLow: false, communes: [] };
        }
        sourceImpacts[cluster.id].lostPop += com.population;
        sourceImpacts[cluster.id].finalPop -= com.population;
        sourceImpacts[cluster.id].isLow = sourceImpacts[cluster.id].finalPop < MIN_1W;
        sourceImpacts[cluster.id].communes.push(com.name);
      }
    });

    return {
      addedPop: totalAddedPop,
      sources: Object.values(sourceImpacts),
      hasAnyLowSource: Object.values(sourceImpacts).some(s => s.isLow)
    };
  }, [bonusSelection, selectedCluster, communes, data.clusters]);

  const applyBonusTransfer = () => {
    if (!selectedCluster || bonusSelection.size === 0) return;

    pushToHistory(data);
    const selectedComs = communes.filter(c => bonusSelection.has(c.id));

    const newClusters = data.clusters.map(cluster => {
      const comsToRemove = cluster.communes.filter(c => bonusSelection.has(c.id));
      if (comsToRemove.length > 0) {
        const updatedCommunes = cluster.communes.filter(c => !bonusSelection.has(c.id));
        const newPop = updatedCommunes.reduce((sum, c) => sum + c.population, 0);
        return {
          ...cluster,
          communes: updatedCommunes,
          totalPopulation: newPop,
          durationWeeks: calculateDuration(newPop)
        };
      }
      return cluster;
    });

    const targetClusterIdx = newClusters.findIndex(c => c.id === selectedCluster.id);
    if (targetClusterIdx !== -1) {
      const target = newClusters[targetClusterIdx];
      const updatedCommunes = [...target.communes, ...selectedComs];
      const newPop = updatedCommunes.reduce((sum, c) => sum + c.population, 0);

      newClusters[targetClusterIdx] = {
        ...target,
        communes: updatedCommunes,
        totalPopulation: newPop,
        durationWeeks: target.durationWeeks,
        isBonus: true
      };
      setSelectedCluster(newClusters[targetClusterIdx]);
    }

    const rescheduled = recalculateSchedule(newClusters, weekOverrides, defaultTeamCount);
    setData({ ...data, clusters: rescheduled });

    setIsBonusMode(false);
    setBonusSelection(new Set());
    setShowBonusConfirm(false);
  };

  const handleManualMoveRequest = useCallback((clusterId: string, team: number, week: number) => {
    pushToHistory(data);
    const clustersCopy = data.clusters.map(c => ({ ...c }));
    const updated = clustersCopy.find(c => c.id === clusterId);
    if (updated) {
      updated.assignedTeam = team;
      updated.startWeek = week;
    }
    const rescheduled = recalculateSchedule(clustersCopy, weekOverrides, defaultTeamCount);
    setData({ ...data, clusters: rescheduled });
  }, [data, weekOverrides, defaultTeamCount]);

  const modifyWeekTeamCount = (week: number, increment: number) => {
    const current = weekOverrides[week] !== undefined ? weekOverrides[week] : defaultTeamCount;
    const next = Math.max(1, Math.min(10, current + increment));
    const newOverrides = { ...weekOverrides, [week]: next };
    setWeekOverrides(newOverrides);
    const rescheduled = recalculateSchedule([...data.clusters], newOverrides, defaultTeamCount);
    setData({ ...data, clusters: rescheduled });
  };

  const handlePutBackToDraft = useCallback((clusterId: string) => {
    pushToHistory(data);
    const clustersCopy = data.clusters.map(c => c.id === clusterId ? { ...c, assignedTeam: 0, startWeek: 0 } : c);
    const rescheduled = recalculateSchedule(clustersCopy, weekOverrides, defaultTeamCount);
    setData({ ...data, clusters: rescheduled });
  }, [data, weekOverrides, defaultTeamCount]);

  const maxCapacity = useMemo(() => {
    const overrideValues = Object.values(weekOverrides) as number[];
    return Math.max(defaultTeamCount, ...overrideValues, 1);
  }, [defaultTeamCount, weekOverrides]);

  const isCompact = maxCapacity > 3;

  const schedule = useMemo(() => {
    const maxDataWeek = data.clusters.length > 0 ? Math.max(...data.clusters.map(c => c.startWeek + c.durationWeeks - 1), 0) : 0;
    const maxWeek = Math.max(maxDataWeek, 12);
    const planning = [];
    for (let w = 1; w <= maxWeek; w++) {
      const capacity = weekOverrides[w] || defaultTeamCount;
      const weekTeams: ({ cluster: Cluster; weekIndex: number } | null)[] = [];
      for (let t = 1; t <= capacity; t++) {
        const cluster = data.clusters.find(c => c.assignedTeam === t && w >= c.startWeek && w < (c.startWeek + c.durationWeeks));
        if (cluster) {
          weekTeams.push({ cluster, weekIndex: w - cluster.startWeek + 1 });
        } else {
          weekTeams.push(null);
        }
      }
      planning.push({ week: w, capacity, teams: weekTeams });
    }
    return planning;
  }, [data, defaultTeamCount, weekOverrides]);

  const draftClusters = useMemo(() => data.clusters.filter(c => c.assignedTeam === 0), [data]);

  const [dragOverCell, setDragOverCell] = useState<{ week: number, team: number } | null>(null);

  const toggleStatusVisibility = (status: CommuneStatus) => {
    setVisibleStatuses(prev => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  // CNFF data
  const cnffData = useMemo(() => {
    const weeks: { week: number; towns: string[] }[] = [];
    const normalize = (str: string) => str.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const townsAlreadyListed = new Set<string>();

    schedule.forEach(slot => {
      const activeClusters = data.clusters.filter(c =>
        slot.week >= c.startWeek && slot.week < (c.startWeek + c.durationWeeks) && c.assignedTeam > 0
      );

      if (activeClusters.length > 0) {
        const newTownsThisWeek = new Set<string>();
        activeClusters.forEach(c => {
          c.communes.forEach(com => {
            const name = normalize(com.name);
            if (!townsAlreadyListed.has(name)) {
              newTownsThisWeek.add(name);
              townsAlreadyListed.add(name);
            }
          });
        });

        if (newTownsThisWeek.size > 0) {
          weeks.push({
            week: slot.week,
            towns: Array.from(newTownsThisWeek).sort()
          });
        }
      }
    });
    return weeks;
  }, [schedule, data.clusters]);

  const cnffContent = useMemo(() => {
    return cnffData.map(w => `Semaine ${w.week} :\n${w.towns.map(t => ` - ${t}`).join('\n')}`).join('\n\n');
  }, [cnffData]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cnffContent);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return {
    // State
    selectedNGO, data, communes, selectedCluster, isLoading,
    searchQuery, setSearchQuery,
    isEditMode, setIsEditMode,
    isBrushMode, setIsBrushMode,
    isBonusMode, setIsBonusMode,
    bonusSelection, setBonusSelection,
    showBonusConfirm, setShowBonusConfirm,
    showCNFF, setShowCNFF,
    hasCopied, brushSelection, setBrushSelection,
    hoveredCommune, setHoveredCommune,
    sidebarWidth, sidebarRef, isResizing,
    visibleStatuses, isFilterPanelOpen, setIsFilterPanelOpen,
    isolatedWeek, setIsolatedWeek,
    visibleTeamPath, setVisibleTeamPath,
    showSectorPolicy, setShowSectorPolicy,
    history, defaultTeamCount, weekOverrides,
    dragOverCell, setDragOverCell,

    // Derived
    visibleCommunes, brushStats, bonusImpacts,
    maxCapacity, isCompact, schedule, draftClusters,
    cnffData, cnffContent,

    // Actions
    handleNGOChange, handleUndo,
    startResizing,
    handleCommuneBrush, validateManualZone, deleteCluster,
    handleCommuneClick, handleSelectCluster,
    applyBonusTransfer, handleManualMoveRequest,
    modifyWeekTeamCount, handlePutBackToDraft,
    toggleStatusVisibility, copyToClipboard,
    setSelectedCluster,
  };
}
