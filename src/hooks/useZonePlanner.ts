import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { recalculateSchedule, calculateDuration, getZoneStatus, generateClusters, clusterPersistence } from '@/services/clusteringService';
import { Cluster, ClusteringResult, Commune, GeoFeature, CommuneStatus } from '@/components/zone-maker/types';
import {
  API_GEO_URL, TARGET_COMMUNES_LIST, DEPT_CODE, CLUSTER_COLORS, MIN_1W, TARGET_POPULATION
} from '@/components/zone-maker/constants';
import { useZoneStore } from '@/stores/zoneStore';
import { reporter } from '@/lib/observability';
import { computeIsoWeek } from '@/lib/isoWeek';
import { ORGANIZATIONS } from '@/constants/organizations';

// NGO list for the zone-maker. Brand colours come from the canonical
// ORGANIZATIONS constant where available; the others (HI, 4P, FA) are
// zone-maker-specific placeholders until they're added to the canonical
// org constant or removed from the workflow.
export const ASSOCIATIONS = [
  { id: 'MSF', label: 'MSF', color: ORGANIZATIONS.msf.color },
  { id: 'MDM', label: 'MDM', color: ORGANIZATIONS.mdm.color },
  { id: 'UNICEF', label: 'UNICEF', color: ORGANIZATIONS.unicef.color },
  { id: 'WWF', label: 'WWF', color: ORGANIZATIONS.wwf.color },
  { id: 'AIDES', label: 'AIDES', color: ORGANIZATIONS.aides.color },
  { id: 'HI', label: 'HI', color: '#0055a4' },
  { id: '4P', label: '4P', color: '#4a90e2' },
  { id: 'FA', label: 'FA', color: '#f39c12' },
];

// Real ISO week — was previously hardcoded to 2 (a year-2024 leftover).
export const getCurrentWeek = () => computeIsoWeek(new Date());
/** @deprecated Prefer `getCurrentWeek()` so the value tracks the calendar. */
export const CURRENT_WEEK = getCurrentWeek();

const newClusterId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `cl-${crypto.randomUUID()}`;
  }
  return `cl-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export function useZonePlanner() {
  const selectedNGO = useZoneStore((s) => s.selectedNGO);
  const setSelectedNGO = useZoneStore((s) => s.setSelectedNGO);
  const selectedClusterId = useZoneStore((s) => s.selectedClusterId);
  const setSelectedClusterId = useZoneStore((s) => s.setSelectedClusterId);

  const [ngoStates, setNgoStates] = useState<Record<string, ClusteringResult>>({});

  const [data, setData] = useState<ClusteringResult>({ clusters: [], unclustered: [] });
  const [history, setHistory] = useState<ClusteringResult[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Derive selectedCluster from store's selectedClusterId
  const selectedCluster = useMemo(() => {
    if (!selectedClusterId) return null;
    return data.clusters.find(c => c.id === selectedClusterId) ?? null;
  }, [selectedClusterId, data.clusters]);

  const setSelectedCluster = useCallback((cluster: Cluster | null) => {
    setSelectedClusterId(cluster?.id ?? null);
  }, [setSelectedClusterId]);

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

  // Persistence state (per-NGO)
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedNgosRef = useRef<Set<string>>(new Set());

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

  const [geoLoadError, setGeoLoadError] = useState<Error | null>(null);
  const [geoReloadKey, setGeoReloadKey] = useState(0);
  const retryGeoLoad = useCallback(() => setGeoReloadKey((k) => k + 1), []);

  useEffect(() => {
    const ctrl = new AbortController();
    const loadData = async () => {
      setIsLoading(true);
      setGeoLoadError(null);
      try {
        const response = await fetch(API_GEO_URL, { signal: ctrl.signal });
        if (!response.ok) throw new Error(`GeoAPI ${response.status}`);
        const geoJson = await response.json();
        if (ctrl.signal.aborted) return;
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

        // Compute neighbors via shared geometry vertices \u2014 required for the
        // BFS-based generateClusters() algorithm to expand beyond single
        // communes. Without this, every cluster is one commune wide.
        const flattenCoords = (geometry: GeoFeature['geometry']): string[] => {
          const coords: string[] = [];
          const extract = (list: any[]) => {
            if (list.length === 2 && typeof list[0] === 'number' && typeof list[1] === 'number') {
              coords.push(`${list[0].toFixed(4)},${list[1].toFixed(4)}`);
            } else {
              list.forEach(item => extract(item));
            }
          };
          extract(geometry.coordinates);
          return coords;
        };
        const vertexMap = new Map<string, string[]>();
        initialCommunes.forEach(c => {
          const uniqueVertices = new Set(flattenCoords(c.feature.geometry));
          uniqueVertices.forEach(v => {
            if (!vertexMap.has(v)) vertexMap.set(v, []);
            vertexMap.get(v)!.push(c.id);
          });
        });
        const byId = new Map(initialCommunes.map(c => [c.id, c]));
        vertexMap.forEach(communeIds => {
          if (communeIds.length > 1) {
            for (let i = 0; i < communeIds.length; i++) {
              for (let j = i + 1; j < communeIds.length; j++) {
                const c1 = byId.get(communeIds[i]);
                const c2 = byId.get(communeIds[j]);
                if (c1 && c2) {
                  if (!c1.neighbors.includes(c2.id)) c1.neighbors.push(c2.id);
                  if (!c2.neighbors.includes(c1.id)) c2.neighbors.push(c1.id);
                }
              }
            }
          }
        });

        if (!ctrl.signal.aborted) setCommunes(initialCommunes);
      } catch (err) {
        if (ctrl.signal.aborted) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        reporter.error('zone-maker GeoJSON load failed', err, { source: 'useZonePlanner' });
        setGeoLoadError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!ctrl.signal.aborted) setIsLoading(false);
      }
    };
    loadData();
    return () => ctrl.abort();
  }, [geoReloadKey]);

  // Hydrate clusters for the active NGO from Supabase (once per NGO).
  useEffect(() => {
    if (communes.length === 0) return;
    if (hydratedNgosRef.current.has(selectedNGO)) return;
    let cancelled = false;
    (async () => {
      try {
        const lookup = new Map<string, Commune>(communes.map(c => [c.id, c]));
        const stored = await clusterPersistence.loadAll(selectedNGO, lookup);
        if (cancelled) return;
        hydratedNgosRef.current.add(selectedNGO);
        if (stored.length > 0) {
          const next: ClusteringResult = { clusters: stored, unclustered: [] };
          setData(next);
          setNgoStates(prev => ({ ...prev, [selectedNGO]: next }));
        }
      } catch (err) {
        if (cancelled) return;
        reporter.error('cluster load failed', err, { source: 'useZonePlanner', tags: { ngo: selectedNGO } });
        setPersistenceError(err instanceof Error ? err.message : 'Erreur de chargement des zones');
      }
    })();
    return () => { cancelled = true; };
  }, [communes, selectedNGO]);

  // Debounced save: persist whenever the active NGO's clusters change.
  useEffect(() => {
    if (!hydratedNgosRef.current.has(selectedNGO)) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const ngoToSave = selectedNGO;
    const clustersToSave = data.clusters;
    saveTimerRef.current = setTimeout(() => {
      clusterPersistence.replaceAll(ngoToSave, clustersToSave)
        .catch(err => {
          reporter.error('cluster save failed', err, { source: 'useZonePlanner', tags: { ngo: ngoToSave } });
          setPersistenceError(err instanceof Error ? err.message : 'Erreur de sauvegarde des zones');
        });
    }, 500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [data.clusters, selectedNGO]);

  /**
   * Generate clusters automatically from communes flagged ASKED for the
   * current NGO. Replaces any existing clusters in local state (which the
   * debounced save effect will then sync to Supabase).
   */
  const handleGenerate = useCallback(() => {
    const askedCommunes = communes.filter(c => c.status === 'ASKED');
    // Mark hydrated so the save effect triggers (e.g. when generating before
    // a remote load completes, or when clearing all clusters to empty).
    hydratedNgosRef.current.add(selectedNGO);
    if (askedCommunes.length === 0) {
      pushToHistory(data);
      setData(prev => ({ ...prev, clusters: [] }));
      return;
    }
    pushToHistory(data);
    const result = generateClusters({
      communes: askedCommunes,
      targetPop: TARGET_POPULATION,
    });
    setData({ clusters: result.clusters, unclustered: result.unclustered });
    setSelectedCluster(null);
  }, [communes, data, selectedNGO, setSelectedCluster]);

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
      id: newClusterId(),
      code: `${DEPT_CODE}${letterPart}`,
      communes: selectedComs,
      totalPopulation: pop,
      color: CLUSTER_COLORS[index % CLUSTER_COLORS.length],
      durationWeeks: calculateDuration(pop),
      startWeek: 0,
      assignedTeam: 0,
      sortLat: selectedComs[0]?.centroid?.[1] || 0,
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

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cnffContent);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err) {
      reporter.error('clipboard write failed', err, { source: 'useZonePlanner' });
    }
  }, [cnffContent]);

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
    handleGenerate,
    persistenceError,
    geoLoadError,
    retryGeoLoad,
  };
}
