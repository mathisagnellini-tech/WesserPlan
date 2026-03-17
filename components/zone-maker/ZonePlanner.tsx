import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { recalculateSchedule, calculateDuration, getZoneStatus } from './services/clusteringService';
import MapCanvas from './MapCanvas';
import { Cluster, ClusteringResult, Commune, GeoFeature, CommuneStatus } from './types';
import { 
  API_GEO_URL, TARGET_COMMUNES_LIST, DEPT_CODE, COMMUNE_STATUSES, CLUSTER_COLORS, MIN_1W, MAX_1W, MIN_2W, MAX_2W, MIN_3W, MAX_3W
} from './constants';
import { MapPin, Sparkles, X, Clock, Hand, Search, Package, Users, ShieldCheck, UserPlus, UserMinus, Eraser, CheckCircle2, Trash2, Undo2, Filter, ChevronUp, ChevronDown, Eye, EyeOff, Route, Info, GripVertical, Building2, FileText, Copy, Check, Pencil, AlertCircle, ArrowRight, AlertTriangle, Zap, BarChart3, Target } from 'lucide-react';

// Semaine de référence pour le style dynamique
const CURRENT_WEEK = 2;

const ASSOCIATIONS = [
  { id: 'MSF', label: 'MSF', color: '#ee0000' },
  { id: 'MDM', label: 'MDM', color: '#0095ff' },
  { id: 'UNICEF', label: 'UNICEF', color: '#1ca9e1' },
  { id: 'WWF', label: 'WWF', color: '#111111' },
  { id: 'AIDES', label: 'AIDES', color: '#e4002b' },
  { id: 'HI', label: 'HI', color: '#0055a4' },
  { id: '4P', label: '4P', color: '#4a90e2' },
  { id: 'FA', label: 'FA', color: '#f39c12' }
];

const ZonePlanner: React.FC = () => {
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

  // Sauvegarde auto du planning actuel
  useEffect(() => {
    if (!isLoading) {
      setNgoStates(prev => ({
        ...prev,
        [selectedNGO]: data
      }));
    }
  }, [data, selectedNGO, isLoading]);

  // Changement d'ONG
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
      
      const selectedCommunes = communes.filter(c => brushSelection.has(c.id));
      const pop = selectedCommunes.reduce((sum, c) => sum + c.population, 0);
      const index = data.clusters.length;
      
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      let letterPart = index < 26 ? letters[index] : letters[Math.floor(index / 26) - 1] + letters[index % 26];

      const newCluster: Cluster = {
          id: `cluster-${Date.now()}`,
          code: `${DEPT_CODE}${letterPart}`,
          communes: selectedCommunes,
          totalPopulation: pop,
          color: CLUSTER_COLORS[index % CLUSTER_COLORS.length],
          durationWeeks: calculateDuration(pop),
          startWeek: 0,
          assignedTeam: 0,
          sortLat: selectedCommunes[0]?.centroid?.[1] || 0
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

        // NOUVELLE LOGIQUE : On peut sélectionner si c'est dans un autre cluster OU si c'est non-assigné mais "demandé"
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
            durationWeeks: target.durationWeeks, // Durée conservée
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
      const clustersCopy = data.clusters.map(c => ({...c}));
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
      setData({...data, clusters: rescheduled});
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
      for(let t = 1; t <= capacity; t++) {
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
  const [dragOverCell, setDragOverCell] = useState<{week: number, team: number} | null>(null);

  const toggleStatusVisibility = (status: CommuneStatus) => {
      setVisibleStatuses(prev => {
          const next = new Set(prev);
          if (next.has(status)) next.delete(status);
          else next.add(status);
          return next;
      });
  };

  // Logique CNFF : Extraction structurée des données
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

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC] font-sans overflow-hidden" 
         onDragOver={(e) => e.preventDefault()} 
         onDrop={(e) => { 
           e.preventDefault(); 
           const cid = e.dataTransfer.getData('clusterId'); 
           if (cid && !dragOverCell) handlePutBackToDraft(cid); 
           setDragOverCell(null); 
         }}>
      
      {/* HUD MODE SELECTION BONUS */}
      {isBonusMode && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[900] w-full max-w-2xl px-8 pointer-events-none">
              <div className="bg-white/95 backdrop-blur-xl shadow-2xl rounded-full p-4 pointer-events-auto flex items-center justify-between border border-blue-200 ring-4 ring-blue-600/10 animate-in slide-in-from-top duration-500">
                  <div className="flex items-center gap-4 ml-2">
                      <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-100">
                          <Pencil size={18} className="animate-pulse" />
                      </div>
                      <div className="space-y-0.5">
                          <div className="text-slate-900 font-black text-sm tracking-tight leading-none uppercase">Mode Zone Bonus : {selectedCluster?.code}</div>
                          <p className="text-blue-600 text-[9px] font-black uppercase tracking-widest">{bonusSelection.size} commune(s) sélectionnée(s) (durée conservée)</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-2 mr-1">
                      <button onClick={() => { setIsBonusMode(false); setBonusSelection(new Set()); }} className="px-5 py-2.5 text-slate-400 hover:text-slate-600 rounded-full text-[10px] font-black uppercase tracking-wider transition-all">Annuler</button>
                      <button 
                        onClick={() => setShowBonusConfirm(true)} 
                        disabled={bonusSelection.size === 0}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider disabled:opacity-30 transition-all shadow-xl active:scale-95"
                      >
                        Suivant
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL INFO / POLITIQUE SECTORIELLE & STATS */}
      {showSectorPolicy && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1100] flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
                  <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className="p-4 bg-slate-900 text-white rounded-[1.5rem] shadow-xl"><Info size={28} strokeWidth={2.5}/></div>
                        <div>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Information Plan</h3>
                            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">{selectedNGO} • Réglementation & Chiffres</p>
                        </div>
                      </div>
                      <button onClick={() => setShowSectorPolicy(false)} className="p-4 bg-white hover:bg-slate-100 border border-slate-200 rounded-[1.5rem] transition-all"><X size={24}/></button>
                  </div>
                  
                  <div className="p-10 space-y-10 overflow-y-auto max-h-[70vh]">
                      {/* STATISTIQUES ACTUELLES */}
                      <div className="space-y-6">
                          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] px-1 flex items-center gap-3"><BarChart3 size={16}/> État actuel du déploiement</h4>
                          <div className="grid grid-cols-2 gap-6">
                                <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8 space-y-2">
                                    <div className="text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><Target size={14}/> Zones créées</div>
                                    <div className="text-4xl font-black text-slate-900 tracking-tighter">{data.clusters.length}</div>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8 space-y-2">
                                    <div className="text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><Users size={14}/> Population totale</div>
                                    <div className="text-4xl font-black text-slate-900 tracking-tighter">
                                        {(data.clusters.reduce((sum, c) => sum + c.totalPopulation, 0) / 1000).toFixed(1)}k
                                    </div>
                                </div>
                          </div>
                      </div>

                      {/* RÈGLES DE DIMENSIONNEMENT */}
                      <div className="space-y-6">
                          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] px-1 flex items-center gap-3"><Clock size={16}/> Règles de dimensionnement</h4>
                          <div className="space-y-3">
                              <div className="flex items-center justify-between p-6 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                  <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-black text-sm">1S</div>
                                      <span className="text-emerald-900 font-black text-sm">Semaine (Standard)</span>
                                  </div>
                                  <span className="text-emerald-700 font-bold text-xs">{MIN_1W.toLocaleString()} - {MAX_1W.toLocaleString()} hab.</span>
                              </div>
                              <div className="flex items-center justify-between p-6 bg-blue-50 border border-blue-100 rounded-2xl">
                                  <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-sm">2S</div>
                                      <span className="text-blue-900 font-black text-sm">Semaine (Double)</span>
                                  </div>
                                  <span className="text-blue-700 font-bold text-xs">{MIN_2W.toLocaleString()} - {MAX_2W.toLocaleString()} hab.</span>
                              </div>
                              <div className="flex items-center justify-between p-6 bg-purple-50 border border-purple-100 rounded-2xl">
                                  <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center font-black text-sm">3S</div>
                                      <span className="text-purple-900 font-black text-sm">Semaine (Triple)</span>
                                  </div>
                                  <span className="text-purple-700 font-bold text-xs">{MIN_3W.toLocaleString()} - {MAX_3W.toLocaleString()} hab.</span>
                              </div>
                          </div>
                          <div className="p-6 bg-amber-50 border border-amber-100 rounded-[1.5rem] flex gap-4">
                              <AlertCircle className="text-amber-600 shrink-0" size={20}/>
                              <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                  Une zone sous les <span className="font-black">{MIN_1W.toLocaleString()} habitants</span> est considérée comme "Insuffisante". Utilisez le mode <span className="font-black text-blue-600">ZONE BONUS</span> pour absorbé des communes orphelines sans impacter la durée de votre planning.
                              </p>
                          </div>
                      </div>
                  </div>

                  <div className="p-10 border-t border-slate-100 bg-slate-50/50">
                      <button onClick={() => setShowSectorPolicy(false)} className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">Compris</button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL DE CONFIRMATION BONUS */}
      {showBonusConfirm && bonusImpacts && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1100] flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in duration-300">
                  <div className="p-10 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100"><Zap size={24}/></div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Confirmation Zone Bonus</h3>
                      </div>
                      <p className="text-slate-500 font-bold text-xs uppercase tracking-widest text-center">Les communes ajoutées n'augmenteront pas la durée de la zone cible.</p>
                  </div>
                  
                  <div className="p-10 space-y-8 overflow-y-auto max-h-[60vh]">
                      <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-8 flex items-center gap-6">
                        <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg">{selectedCluster?.code}</div>
                        <div className="space-y-1">
                            <div className="text-emerald-900 font-black text-xl leading-none">+{bonusImpacts.addedPop.toLocaleString()} hab.</div>
                            <div className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">Travail additionnel absorbé (Total : {selectedCluster?.durationWeeks} sem.)</div>
                        </div>
                      </div>

                      <div className="flex justify-center -my-4 relative z-10">
                          <div className="bg-white border border-slate-200 rounded-full p-3 shadow-md"><ArrowRight className="text-slate-400" size={20}/></div>
                      </div>

                      <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Détails des transferts</h4>
                          {bonusImpacts.sources.length > 0 ? bonusImpacts.sources.map((src, i) => (
                              <div key={i} className={`border rounded-[2rem] p-8 flex items-center justify-between transition-all ${src.isLow ? 'bg-red-50 border-red-200 ring-2 ring-red-100 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                                  <div className="flex items-center gap-6">
                                      <div className={`w-14 h-14 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg ${src.isLow ? 'bg-red-600' : 'bg-slate-700'}`}>{src.code}</div>
                                      <div className="space-y-0.5">
                                          <div className={`font-black text-lg leading-none ${src.isLow ? 'text-red-900' : 'text-slate-900'}`}>-{src.lostPop.toLocaleString()} hab.</div>
                                          <div className={`text-[9px] font-bold uppercase tracking-wider ${src.isLow ? 'text-red-400' : 'text-slate-400'}`}>
                                              {src.communes.length} commune(s) transférée(s)
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          )) : (
                              <div className="bg-blue-50 border border-blue-100 rounded-[2rem] p-8 text-center">
                                  <p className="text-blue-900 font-black text-xs uppercase tracking-widest">Uniquement des communes non-assignées</p>
                              </div>
                          )}
                      </div>
                  </div>

                  <div className="p-10 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                      <button onClick={() => setShowBonusConfirm(false)} className="flex-1 py-5 bg-white border border-slate-200 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition-all">Annuler</button>
                      <button onClick={applyBonusTransfer} className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all">Confirmer Zone Bonus</button>
                  </div>
              </div>
          </div>
      )}

      {/* SIDEBAR - PISTE 1 SOFT UI */}
      <aside 
        ref={sidebarRef}
        className="bg-slate-50/50 flex flex-col max-h-[50vh] md:max-h-none md:h-screen overflow-hidden md:sticky top-0 shadow-[20px_0_60px_-15px_rgba(0,0,0,0.03)] z-30 transition-none border-r border-slate-200/60 zone-planner-sidebar"
        style={{ width: `${sidebarWidth}px`, minWidth: '320px' }}
      >
        <div className="flex-none p-8 bg-white/40 backdrop-blur-sm border-b border-slate-200/60">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-5 px-1">Organisation</h3>
            <div className="grid grid-cols-4 gap-3">
                {ASSOCIATIONS.map(ngo => (
                    <button 
                        key={ngo.id} 
                        onClick={() => handleNGOChange(ngo.id)}
                        style={{ 
                          '--ngo-color': ngo.color,
                          boxShadow: selectedNGO === ngo.id ? `0 10px 20px -5px ${ngo.color}33` : 'none'
                        } as React.CSSProperties}
                        className={`group relative flex items-center justify-center px-2 py-3 rounded-full transition-all duration-400 border-2 overflow-hidden active:scale-90 ${selectedNGO === ngo.id 
                            ? 'bg-[var(--ngo-color)] border-[var(--ngo-color)] text-white' 
                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:text-slate-600'}`}
                    >
                        <span className="text-[11px] font-black tracking-tight">{ngo.label}</span>
                    </button>
                ))}
            </div>
        </div>

        <div className="p-8 border-b border-slate-200/40 flex-none bg-white/20">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-5">
                <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-2xl shadow-blue-100"><Building2 size={24} strokeWidth={2.5} /></div> 
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{selectedNGO}</h1>
            </div>
            <div className="flex items-center gap-2.5">
                <button onClick={() => setShowCNFF(!showCNFF)} className={`p-3 rounded-2xl border transition-all ${showCNFF ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 shadow-sm'}`} title="Export CNFF">
                    <FileText size={18} strokeWidth={2.2} />
                </button>
                <button onClick={() => setShowSectorPolicy(true)} className="p-3 bg-white rounded-2xl border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm"><Info size={18} strokeWidth={2.2} /></button>
                <button onClick={handleUndo} disabled={history.length === 0} className={`p-3 rounded-2xl border transition-all ${history.length > 0 ? 'bg-white text-slate-900 border-slate-100 hover:bg-slate-50 shadow-sm' : 'bg-white/50 text-slate-200 border-slate-100 shadow-none cursor-not-allowed'}`}><Undo2 size={18} strokeWidth={2.2} /></button>
            </div>
          </div>
          
          {/* SEGMENTED CONTROL UPDATED WITH WATCH MODE */}
          <div className="bg-slate-200/40 p-1.5 rounded-full flex gap-1 border border-slate-200/50">
            <button 
              onClick={() => { setIsBrushMode(false); setIsEditMode(false); setIsBonusMode(false); }} 
              className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-full text-[10px] font-black tracking-wider transition-all duration-300 ${(!isBrushMode && !isEditMode) ? 'bg-white text-slate-900 shadow-xl shadow-slate-100/50 scale-[1.02]' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Eye size={14} strokeWidth={2.5} /> WATCH
            </button>
            <button 
              onClick={() => { setIsBrushMode(true); setIsEditMode(false); setIsBonusMode(false); }} 
              className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-full text-[10px] font-black tracking-wider transition-all duration-300 ${isBrushMode ? 'bg-white text-blue-600 shadow-xl shadow-blue-100/50 scale-[1.02]' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Sparkles size={14} strokeWidth={2.5} /> CRÉER
            </button>
            <button 
              onClick={() => { setIsEditMode(true); setIsBrushMode(false); setIsBonusMode(false); }} 
              className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-full text-[10px] font-black tracking-wider transition-all duration-300 ${isEditMode ? 'bg-white text-orange-600 shadow-xl shadow-orange-100/50 scale-[1.02]' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Hand size={14} strokeWidth={2.5} /> PLACER
            </button>
          </div>
        </div>

        {/* BROUILLONS */}
        <div className={`flex-none bg-white/20 border-b border-slate-200/40 transition-all duration-500 ${draftClusters.length === 0 ? 'h-0 opacity-0 overflow-hidden' : 'p-8 h-auto opacity-100'}`}>
            {draftClusters.length > 0 && (
                <>
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2.5 mb-6 px-1"><Package size={14} className="text-slate-300" strokeWidth={2.5}/> Brouillons</h2>
                    <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar">
                        {draftClusters.map(c => {
                            const isLow = c.totalPopulation < MIN_1W;
                            return (
                            <div key={c.id} draggable={isEditMode} onDragStart={(e) => e.dataTransfer.setData('clusterId', c.id)} onClick={() => { if(!isBonusMode) setSelectedCluster(c); }} className={`flex-none w-48 bg-white border rounded-[2rem] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] transition-all hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 overflow-hidden ${isEditMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${selectedCluster?.id === c.id ? 'ring-[3px] ring-blue-500/20 border-blue-500 shadow-blue-50' : 'border-slate-100'} ${isLow ? 'border-red-100 ring-2 ring-red-500/5' : ''}`}>
                                <div className="p-6 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2.5">
                                            <span className="font-black text-slate-900 text-2xl tracking-tighter leading-none">{c.code}</span>
                                            {isLow && <AlertTriangle size={15} className="text-red-500 animate-pulse" strokeWidth={2.5} />}
                                            {c.isBonus && <Zap size={15} className="text-emerald-500" strokeWidth={2.5} />}
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); deleteCluster(c.id); }} className="text-slate-200 hover:text-red-500 transition-colors p-1"><Trash2 size={13} strokeWidth={2.2}/></button>
                                    </div>
                                    <div className="h-1.5 w-10 rounded-full mb-8" style={{ backgroundColor: c.color }}></div>
                                    <div className="mt-auto flex items-center justify-between">
                                        {/* Fix: Added quotes around text-slate-200 */}
                                        <div className={`text-[11px] font-black uppercase flex items-center gap-2 ${isLow ? 'text-red-600' : 'text-slate-400'}`}><Users size={14} strokeWidth={2.2} className={isLow ? 'text-red-400' : 'text-slate-200'}/> {(c.totalPopulation/1000).toFixed(1)}k</div>
                                        <div className="text-[10px] font-black text-white bg-slate-900 px-2.5 py-1 rounded-xl uppercase tracking-wider shadow-sm">{c.durationWeeks}s</div>
                                    </div>
                                </div>
                            </div>
                        )})}
                    </div>
                </>
            )}
        </div>

        {/* CALENDRIER */}
        <div className="flex-grow overflow-y-auto px-8 pt-10 space-y-4 bg-transparent pb-48">
          <div className={`grid sticky top-0 bg-slate-50/80 backdrop-blur-xl z-20 -mx-8 px-8 py-5 border-b border-slate-200/40 ${isCompact ? 'gap-3' : 'gap-6'}`} style={{ gridTemplateColumns: `60px repeat(${maxCapacity}, 1fr)` }}>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center flex flex-col justify-center">Week</div>
                {Array.from({length: maxCapacity}).map((_, i) => (
                    <div key={i} className={`text-[10px] font-black text-slate-900 text-center uppercase tracking-[0.15em] flex items-center justify-center gap-2`}>
                        <Users size={12} className="text-slate-300" strokeWidth={2.2}/> Eq. {i+1}
                        {/* BOUTON DE TRAJET RESTAURÉ */}
                        <button 
                          onClick={() => setVisibleTeamPath(visibleTeamPath === i + 1 ? null : i + 1)}
                          className={`ml-1 p-1.5 rounded-lg transition-all ${visibleTeamPath === i + 1 ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:text-blue-500 hover:bg-blue-50'}`}
                          title="Afficher le trajet sur la carte"
                        >
                          <Route size={10} strokeWidth={2.5} />
                        </button>
                    </div>
                ))}
          </div>
          <div className="space-y-3">
            {schedule.map((slot) => {
              let bgThemeClass = "bg-white/40";
              let weekLabelTheme = "bg-white border-slate-100 text-slate-900 shadow-sm";

              if (slot.week < CURRENT_WEEK) {
                  bgThemeClass = "bg-slate-100/30 opacity-60";
                  weekLabelTheme = "bg-slate-50 border-slate-200 text-slate-300";
              } else if (slot.week === CURRENT_WEEK) {
                  // VERT (ÉMERAUDE) POUR LE PRÉSENT
                  bgThemeClass = "bg-gradient-to-r from-emerald-50/50 to-white border-y-emerald-100/50 border-l-4 border-l-emerald-400";
                  weekLabelTheme = "bg-emerald-100 border-emerald-200 text-emerald-900 shadow-lg shadow-emerald-100/50 ring-2 ring-white";
              } else if (slot.week === CURRENT_WEEK + 1) {
                  // ROUGE CLAIR DÉGRADÉ POUR LA SEMAINE PROCHAINE
                  bgThemeClass = "bg-gradient-to-r from-rose-50/40 to-white border-y-rose-100/30 border-l-4 border-l-rose-300";
                  weekLabelTheme = "bg-rose-50 border-rose-100 text-rose-800 shadow-sm";
              }

              return (
                <div key={slot.week} 
                     className={`grid p-3 items-stretch transition-all duration-500 rounded-[2.5rem] border border-transparent ${bgThemeClass} ${isCompact ? 'gap-3' : 'gap-6'}`} 
                     style={{ gridTemplateColumns: `60px repeat(${maxCapacity}, 1fr)` }}>
                  <div className="flex flex-col items-center gap-4 py-2">
                      <div className={`font-black text-[11px] px-3 py-2 rounded-2xl border transition-all ${weekLabelTheme}`}>S{slot.week}</div>
                      <div className="flex flex-col items-center gap-1.5 bg-white/60 p-1.5 rounded-2xl shadow-inner border border-slate-100/50">
                          <button onClick={() => modifyWeekTeamCount(slot.week, 1)} className="p-1.5 text-slate-300 hover:text-blue-600 transition-colors"><UserPlus size={11} strokeWidth={2.5}/></button>
                          <div className="text-[10px] font-black text-slate-500">{slot.capacity}</div>
                          <button onClick={() => modifyWeekTeamCount(slot.week, -1)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"><UserMinus size={11} strokeWidth={2.5}/></button>
                      </div>
                  </div>
                  {Array.from({length: maxCapacity}).map((_, idx) => {
                     if (idx >= slot.capacity) return <div key={idx} className="bg-slate-200/5 rounded-[2rem] border border-dashed border-slate-200/40"></div>;
                     const teamData = slot.teams[idx];
                     const isTarget = dragOverCell?.week === slot.week && dragOverCell?.team === (idx + 1);
                     
                     if (teamData === null) return <div key={idx} onDragOver={(e) => { if(isEditMode) e.preventDefault(); setDragOverCell({ week: slot.week, team: idx + 1 }); }} onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const cid = e.dataTransfer.getData('clusterId'); if (cid) handleManualMoveRequest(cid, idx + 1, slot.week); }} className={`w-full h-full min-h-[90px] rounded-[2rem] border-2 border-dashed transition-all duration-300 ${isTarget ? 'bg-blue-50/50 border-blue-400 scale-[1.02]' : 'border-slate-200/40 bg-white/20 hover:bg-white/60 hover:border-slate-200'}`}></div>;

                     if (teamData) {
                        const { cluster, weekIndex } = teamData;
                        const isLow = cluster.totalPopulation < MIN_1W;
                        return (
                         <div key={idx} onDragOver={(e) => { if(isEditMode) e.preventDefault(); setDragOverCell({ week: slot.week, team: idx + 1 }); }} onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const cid = e.dataTransfer.getData('clusterId'); if (cid) handleManualMoveRequest(cid, idx + 1, slot.week); }} className={`rounded-[2rem] transition-all duration-500 ${isTarget && isEditMode ? 'scale-[1.05] z-40' : ''}`}>
                            <div onClick={() => { if(!isBonusMode) setSelectedCluster(cluster); }} draggable={isEditMode} onDragStart={(e) => e.dataTransfer.setData('clusterId', cluster.id)} className={`h-full rounded-[2rem] border flex flex-col relative overflow-hidden transition-all duration-500 shadow-[0_15px_35px_-12px_rgba(0,0,0,0.06)] ${selectedCluster?.id === cluster.id ? 'ring-[3px] ring-blue-500/15 border-blue-500 shadow-2xl scale-[1.03] z-20' : 'bg-white border-slate-100/80 hover:border-slate-300 hover:shadow-xl hover:-translate-y-1'} ${isLow ? 'border-red-200 bg-red-50/10' : ''}`}>
                                  <div className={`${isCompact ? 'p-4' : 'p-6'} pb-3 flex flex-col`}>
                                      <div className="flex justify-between items-start">
                                          <div className="flex items-center gap-3">
                                              <span className={`font-black text-slate-900 leading-none tracking-tighter ${isCompact ? 'text-xl' : 'text-2xl'}`}>{cluster.code}</span>
                                              {isLow && <AlertTriangle size={16} className="text-red-600 animate-pulse" strokeWidth={2.5}/>}
                                              {cluster.isBonus && <Zap size={15} className="text-emerald-500" strokeWidth={2.5}/>}
                                          </div>
                                          {isCompact && (
                                              <span className="bg-slate-900 text-white px-2 py-1 rounded-lg text-[9px] font-black tracking-wider uppercase shadow-sm">{cluster.durationWeeks}s</span>
                                          )}
                                      </div>
                                      <div className="h-1.5 w-10 rounded-full mt-2" style={{ backgroundColor: cluster.color }}></div>
                                  </div>
                                  <div className={`${isCompact ? 'px-4 py-3' : 'px-6 py-4'} flex-grow flex items-center`}>
                                      {/* Fix: Added quotes around text-slate-200 */}
                                      <div className={`text-[11px] font-black uppercase flex items-center gap-2 ${isLow ? 'text-red-600' : 'text-slate-400'} ${cluster.isBonus ? 'text-emerald-600' : ''}`}>
                                          <Users size={isCompact ? 13 : 15} strokeWidth={2.2} className={isLow ? 'text-red-400' : (cluster.isBonus ? 'text-emerald-400' : 'text-slate-200')}/> 
                                          {(cluster.totalPopulation/1000).toFixed(1)}k
                                      </div>
                                  </div>
                                  {!isCompact && (
                                      <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100/50 flex items-center justify-between">
                                          <span className="bg-slate-900 text-white px-2.5 py-1 rounded-xl text-[9px] font-black tracking-[0.15em] shadow-sm uppercase">{cluster.durationWeeks} semaines</span>
                                          {cluster.isBonus && <span className="text-emerald-600 text-[10px] font-black uppercase tracking-tighter flex items-center gap-1.5"><Zap size={12} strokeWidth={2.5}/> Zone Bonus</span>}
                                      </div>
                                  )}
                                  {/* PROGRESS INDICATOR (X/Y) */}
                                  {cluster.durationWeeks > 1 && (
                                      <div className={`absolute bottom-3 right-4 flex items-center ${isCompact ? 'bottom-2 right-3' : 'bottom-3 right-4'}`}>
                                          <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-lg border border-slate-200 shadow-sm tracking-tighter">
                                              {weekIndex}/{cluster.durationWeeks}
                                          </span>
                                      </div>
                                  )}
                              </div>
                         </div>
                        );
                     }
                     return <div key={idx}></div>;
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      <div 
        className={`w-1 hover:w-2 bg-slate-200/50 hover:bg-blue-300/50 cursor-col-resize transition-all z-40 relative group hidden md:block ${isResizing ? 'bg-blue-500 w-2' : ''}`}
        onMouseDown={startResizing}
      >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-full p-2 shadow-xl opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
            <GripVertical size={14} className="text-slate-400"/>
          </div>
      </div>

      <main className="flex-1 h-screen relative bg-[#F1F5F9] overflow-hidden">
        {/* VUE CNFF (OVERLAY) */}
        {showCNFF && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-3xl z-[800] p-12 overflow-y-auto animate-in fade-in slide-in-from-bottom-8 duration-600">
                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="flex items-center justify-between sticky top-0 bg-white/60 backdrop-blur-md z-10 py-8 border-b border-slate-100">
                        <div>
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-slate-900 text-white rounded-[1.5rem] shadow-2xl shadow-slate-200"><FileText size={32} strokeWidth={2.5}/></div>
                                <div>
                                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">Export CNFF</h2>
                                    <div className="flex items-center gap-3 mt-3">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: ASSOCIATIONS.find(a => a.id === selectedNGO)?.color || '#000' }}></div>
                                        <p className="text-slate-500 font-black uppercase text-[11px] tracking-[0.25em]">{selectedNGO} • Format Officiel</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={copyToClipboard} className={`flex items-center gap-4 px-12 py-6 rounded-[1.5rem] text-[15px] font-black uppercase tracking-wider transition-all shadow-2xl active:scale-95 ${hasCopied ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-300'}`}>
                                {hasCopied ? <Check size={22} strokeWidth={2.5}/> : <Copy size={22} strokeWidth={2.5}/>}
                                {hasCopied ? 'Copié !' : 'Copier tout'}
                            </button>
                            <button onClick={() => setShowCNFF(false)} className="p-6 bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-200 rounded-[1.5rem] transition-all shadow-sm">
                                <X size={28} strokeWidth={2.5}/>
                            </button>
                        </div>
                    </div>
                    
                    <div className="grid gap-10 pb-20">
                        {cnffData.length > 0 ? cnffData.map((w, idx) => (
                            <div key={idx} className="bg-white border border-slate-100 rounded-[3rem] p-12 shadow-[0_25px_60px_-20px_rgba(0,0,0,0.04)] group hover:border-blue-200 transition-all duration-400">
                                <div className="flex items-center gap-5 mb-10">
                                    <div className="px-5 py-2 bg-slate-100 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em]">Semaine {w.week}</div>
                                    <div className="h-px flex-grow bg-slate-100 group-hover:bg-blue-50 transition-colors"></div>
                                </div>
                                <div className="columns-1 sm:columns-2 md:columns-3 gap-10 space-y-4">
                                    {w.towns.map((town, tIdx) => (
                                        <div key={tIdx} className="flex items-start gap-3">
                                            <span className="text-slate-200 font-mono mt-0.5">–</span>
                                            <span className="text-[14px] font-mono font-bold text-slate-700 uppercase tracking-tight selection:bg-blue-100">
                                                {town}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )) : (
                            <div className="bg-white border border-slate-100 border-dashed rounded-[4rem] p-32 text-center shadow-inner">
                                <FileText className="mx-auto mb-8 text-slate-100" size={80} strokeWidth={1.5}/>
                                <p className="text-2xl font-black text-slate-900 tracking-tight mb-3">Aucun déploiement planifié</p>
                                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest leading-relaxed">Placez des zones dans le calendrier pour générer le rapport CNFF.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* HUD PINCEAU */}
        {isBrushMode && (
            <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[500] w-full max-w-2xl px-8 pointer-events-none">
                <div className="bg-white/95 backdrop-blur-3xl shadow-[0_30px_70px_-15px_rgba(0,0,0,0.12)] border border-white/50 rounded-[2.5rem] p-8 pointer-events-auto ring-1 ring-black/5 flex items-center justify-between animate-in slide-in-from-top-6 duration-600">
                    <div className="flex items-center gap-8">
                        <div className="w-20 h-20 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-blue-200">
                            <Sparkles size={32} strokeWidth={2.5}/>
                        </div>
                        <div className="space-y-1.5">
                            <div className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
                                {brushStats.pop.toLocaleString()} hab.
                            </div>
                            <div className={`text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl inline-block ${brushStats.status.color} bg-slate-50 border border-slate-100/50 shadow-sm`}>
                                {brushStats.status.label} • {brushStats.count} communes
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-5">
                        <button onClick={() => setBrushSelection(new Set())} className="p-5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-[1.5rem] transition-all" title="Effacer tout"><Eraser size={26} strokeWidth={2.2}/></button>
                        <button onClick={validateManualZone} disabled={!brushStats.status.valid} className="flex items-center gap-4 px-10 py-6 bg-blue-600 text-white rounded-[1.5rem] text-[14px] font-black uppercase tracking-wider hover:bg-blue-700 disabled:opacity-30 disabled:grayscale transition-all shadow-xl shadow-blue-200 active:scale-95">
                            <CheckCircle2 size={20} strokeWidth={2.5}/> Créer Zone
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* HUD FILTRES STATUTS */}
        <div className="absolute bottom-12 left-12 z-[500] pointer-events-none">
            <div className={`bg-white/95 backdrop-blur-2xl border border-white/40 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] rounded-[2.5rem] overflow-hidden transition-all duration-500 pointer-events-auto w-80 ${isFilterPanelOpen ? 'max-h-[500px] shadow-2xl' : 'max-h-20 shadow-xl'}`}>
                <button onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)} className="w-full flex items-center justify-between px-10 py-7 border-b border-slate-100/50">
                    <span className="text-[12px] font-black text-slate-900 uppercase tracking-[0.25em] flex items-center gap-4"><Filter size={18} strokeWidth={2.5}/> Visibilité</span>
                    {isFilterPanelOpen ? <ChevronDown size={18} strokeWidth={2.5}/> : <ChevronUp size={18} strokeWidth={2.5}/>}
                </button>
                <div className="p-7 space-y-3.5">
                    {COMMUNE_STATUSES.map(status => (
                        <label key={status.id} className="flex items-center gap-5 px-5 py-4.5 rounded-[1.5rem] hover:bg-slate-50 cursor-pointer transition-all border border-transparent hover:border-slate-100 group">
                            <input 
                                type="checkbox" 
                                checked={visibleStatuses.has(status.id as CommuneStatus)} 
                                onChange={() => toggleStatusVisibility(status.id as CommuneStatus)}
                                className="w-6 h-6 rounded-lg border-2 border-slate-200 text-blue-600 focus:ring-blue-500/20 transition-all cursor-pointer"
                            />
                            <div className="flex items-center gap-4 flex-grow">
                                <div className="w-4 h-4 rounded-full shadow-inner ring-2 ring-white" style={{ background: status.color }}></div>
                                <span className="text-[13px] font-black text-slate-800 uppercase tracking-wide">{status.label}</span>
                            </div>
                        </label>
                    ))}
                </div>
            </div>
        </div>

        {/* RECHERCHE */}
        {!isBrushMode && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[400] w-full max-w-xl px-12 pointer-events-none">
              <div className="bg-white/90 backdrop-blur-xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] border border-white/50 rounded-[2.5rem] p-4 flex items-center gap-4 pointer-events-auto ring-1 ring-black/5 hover:bg-white hover:shadow-2xl transition-all duration-500">
                  <Search className="ml-6 text-slate-300" size={22} strokeWidth={2.5} />
                  <input type="text" placeholder="Rechercher une commune..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 px-5 py-4 bg-transparent text-[15px] font-black tracking-tight focus:outline-none text-slate-800 placeholder:text-slate-300"/>
              </div>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-white/70 z-[700] flex flex-col items-center justify-center backdrop-blur-3xl">
            <div className="w-20 h-20 border-6 border-blue-600/10 border-t-blue-600 rounded-full animate-spin mb-8 shadow-2xl shadow-blue-100"></div>
            <p className="text-slate-900 font-black text-3xl tracking-tight uppercase">Chargement...</p>
          </div>
        )}

         <div className="w-full h-full relative z-0">
            {communes.length > 0 && !isLoading && (
              <MapCanvas 
                clusters={data.clusters} 
                allCommunes={visibleCommunes}
                onSelectCluster={handleSelectCluster} 
                onCommuneClick={handleCommuneClick}
                selectedClusterId={selectedCluster?.id} 
                isEditMode={isEditMode} 
                isBrushMode={isBrushMode}
                brushSelection={brushSelection}
                bonusSelection={bonusSelection} 
                onCommuneBrush={handleCommuneBrush}
                onCommuneHover={setHoveredCommune}
                visibleTeamPath={visibleTeamPath}
              />
            )}
         </div>

         {/* DETAILS PANEL */}
         <div className={`fixed bottom-12 right-12 w-full max-w-lg z-[600] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${selectedCluster ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-[120%] opacity-0 scale-90'}`}>
           {selectedCluster && (
            <div className="bg-white/95 backdrop-blur-3xl border border-white/50 shadow-[0_45px_100px_-25px_rgba(0,0,0,0.18)] rounded-[3.5rem] overflow-hidden flex flex-col">
              <div className="p-12 border-b border-slate-100/60 flex items-center justify-between bg-white/40">
                  <div className="flex items-center gap-10">
                      <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center text-white text-4xl font-black shadow-2xl transition-transform hover:scale-110 duration-500" style={{ background: selectedCluster.color, boxShadow: `0 25px 50px -12px ${selectedCluster.color}66` }}>{selectedCluster.code}</div>
                      <div>
                        <div className="flex items-center gap-4">
                            <h2 className="font-black text-5xl text-slate-900 tracking-tighter leading-none">Zone {selectedCluster.code}</h2>
                            <button 
                                onClick={() => { setIsBonusMode(!isBonusMode); setBonusSelection(new Set()); }} 
                                className={`px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2.5 border-2 shadow-sm ${isBonusMode ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50 hover:border-slate-200'} ${selectedCluster.isBonus ? 'text-emerald-600 border-emerald-100 bg-emerald-50/50' : ''}`}
                            >
                                {isBonusMode ? <Check size={14} strokeWidth={3}/> : <Zap size={14} strokeWidth={3}/>}
                                {isBonusMode ? 'Sélection...' : 'ZONE BONUS'}
                            </button>
                        </div>
                        <div className="flex gap-5 mt-4">
                            {/* Fix: Added quotes around text-slate-200 */}
                            <span className={`text-[12px] font-black uppercase tracking-widest flex items-center gap-2.5 px-4 py-2 rounded-2xl border-2 transition-all ${selectedCluster.totalPopulation < MIN_1W ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50/50 text-slate-400 border-slate-100'} ${selectedCluster.isBonus ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : ''}`}>
                                {selectedCluster.totalPopulation < MIN_1W && <AlertTriangle size={16} className="text-red-500 animate-pulse" strokeWidth={2.5}/>}
                                <Users size={16} strokeWidth={2.5} className={selectedCluster.totalPopulation < MIN_1W ? 'text-red-400' : (selectedCluster.isBonus ? 'text-emerald-500' : 'text-slate-200')}/> 
                                {selectedCluster.totalPopulation.toLocaleString()} hab.
                            </span>
                            <span className="text-[12px] font-black text-white uppercase tracking-widest flex items-center gap-2.5 bg-slate-900 px-4 py-2 rounded-2xl shadow-xl"><Clock size={16} strokeWidth={2.5} className="text-slate-500"/> {selectedCluster.durationWeeks} sem.</span>
                        </div>
                      </div>
                  </div>
                  <button onClick={() => { setSelectedCluster(null); setIsBonusMode(false); setBonusSelection(new Set()); }} className="p-5 bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-[1.5rem] transition-all"><X size={28} strokeWidth={2.5}/></button>
              </div>
              <div className="p-10 bg-slate-50/10 max-h-[35vh] overflow-y-auto custom-scrollbar">
                 {selectedCluster.isBonus && (
                     <div className="mb-8 p-6 bg-emerald-50 border-2 border-emerald-100/50 rounded-[2rem] flex gap-5 items-center shadow-sm">
                        <Zap size={28} strokeWidth={2.5} className="text-emerald-600 shrink-0"/>
                        <div className="space-y-1">
                           <p className="text-[11px] text-emerald-900 font-black uppercase tracking-[0.1em]">Zone optimisée (Bonus)</p>
                           <p className="text-[11px] text-emerald-600 font-bold uppercase leading-relaxed tracking-tight">Travail additionnel absorbé dans le planning initial.</p>
                        </div>
                    </div>
                 )}
                 {selectedCluster.totalPopulation < MIN_1W && (
                     <div className="mb-8 p-6 bg-red-50 border-2 border-red-100/50 rounded-[2rem] flex gap-5 items-center animate-pulse-subtle shadow-sm">
                         <AlertTriangle size={28} strokeWidth={2.5} className="text-red-600 shrink-0"/>
                         <div className="space-y-1">
                            <p className="text-[11px] text-red-900 font-black uppercase tracking-[0.1em]">Population insuffisante</p>
                            <p className="text-[11px] text-red-600 font-bold uppercase leading-relaxed tracking-tight">Sous le seuil des {MIN_1W.toLocaleString()} hab. Fusionnez ou complétez.</p>
                         </div>
                     </div>
                 )}
                 <div className="grid grid-cols-2 gap-5 pb-4">
                    {selectedCluster.communes.map(c => (
                        <div key={c.id} className="p-6 bg-white border border-slate-100/80 rounded-[1.5rem] text-[12px] font-black text-slate-800 uppercase flex flex-col gap-1.5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                            <span className="truncate tracking-tight">{c.name}</span>
                            <span className="text-[10px] text-blue-600 tracking-widest font-bold">{c.population.toLocaleString()} habitants</span>
                        </div>
                    ))}
                 </div>
              </div>
              <div className="p-10 bg-white/60 border-t border-slate-100/60 flex justify-end gap-5">
                  <button onClick={() => handlePutBackToDraft(selectedCluster.id)} className="px-10 py-5 bg-slate-100 text-slate-500 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Retirer</button>
                  <button onClick={() => deleteCluster(selectedCluster.id)} className="px-10 py-5 bg-red-50 text-red-600 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-red-100 transition-all">Supprimer</button>
              </div>
            </div>
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