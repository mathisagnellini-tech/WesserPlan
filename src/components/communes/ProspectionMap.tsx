import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Organization } from '@/types';
import { Filter, Loader2, Eraser, Brush, ArrowRight, Check, Layers, Move } from 'lucide-react';
import L from 'leaflet';
import 'leaflet-providers';
import { MapCommuneFeature } from '@/components/communes/types';

export const ProspectionMap: React.FC<{
    departments: Set<string>;
    onValidationRequest: (selectedCommunes: MapCommuneFeature[]) => void;
}> = ({ departments, onValidationRequest }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
    const hasCenteredRef = useRef<boolean>(false);

    const [isLoading, setIsLoading] = useState(false);
    const [features, setFeatures] = useState<MapCommuneFeature[]>([]);
    const [filteredFeatures, setFilteredFeatures] = useState<MapCommuneFeature[]>([]);

    // Selection State
    const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
    const [tool, setTool] = useState<'move' | 'brush' | 'eraser'>('move');
    const [isMouseDown, setIsMouseDown] = useState(false);

    // Filters
    const [minPop, setMinPop] = useState(1000);
    const [minRevenue, setMinRevenue] = useState(20000);

    // History Layer State
    const [saturationOrg, setSaturationOrg] = useState<Organization | 'none'>('none');

    // Fetch Geometry based on selected departments
    useEffect(() => {
        const loadGeometry = async () => {
            if (departments.size === 0) return;
            setIsLoading(true);
            hasCenteredRef.current = false; // Reset zooming capability when depts change
            const deptsArray = Array.from(departments);
            let allFeatures: any[] = [];

            try {
                for (const deptCode of deptsArray) {
                    const res = await fetch(`https://geo.api.gouv.fr/departements/${deptCode}/communes?geometry=contour&format=geojson&type=commune-actuelle`);
                    if (res.ok) {
                        const data = await res.json();
                        // Enrich with mock revenue, centroid, and history
                        const enriched = data.features.map((f: any) => {
                            // Rough centroid
                            const coords = f.geometry.coordinates[0][0];
                            const lng = Array.isArray(coords) ? coords[0] : 0;
                            const lat = Array.isArray(coords) ? coords[1] : 0;

                            // Mock History Generation
                            const mockHistory: Record<string, string> = {};
                            ['msf', 'unicef', 'wwf', 'mdm'].forEach(org => {
                                // 40% chance of having been visited
                                if (Math.random() > 0.6) {
                                    // Date within last 2 years
                                    const daysAgo = Math.floor(Math.random() * 730);
                                    const d = new Date();
                                    d.setDate(d.getDate() - daysAgo);
                                    mockHistory[org] = d.toISOString().split('T')[0];
                                }
                            });

                            return {
                                ...f,
                                properties: {
                                    ...f.properties,
                                    revenue: Math.floor(Math.random() * (45000 - 16000) + 16000),
                                    lat,
                                    lng,
                                    history: mockHistory
                                }
                            };
                        });
                        allFeatures = [...allFeatures, ...enriched];
                    }
                }
                setFeatures(allFeatures);
            } catch (e) {
                console.error("Failed to load map data", e);
            } finally {
                setIsLoading(false);
            }
        };

        loadGeometry();
    }, [departments]);

    // Apply demographic filters
    useEffect(() => {
        const filtered = features.filter(f =>
            f.properties.population >= minPop &&
            f.properties.revenue >= minRevenue
        );
        setFilteredFeatures(filtered);
    }, [features, minPop, minRevenue]);

    // Handle Map Interactions (Painting)
    const handleInteraction = (code: string) => {
        if (!isMouseDown) return;
        if (tool === 'move') return;

        setSelectedCodes(prev => {
            const next = new Set(prev);
            if (tool === 'brush') next.add(code);
            else next.delete(code);
            return next;
        });
    };

    // Render Map
    useEffect(() => {
        if (!mapContainerRef.current) return;

        if (!mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([46.6, 1.8], 6);
            const isDark = document.documentElement.classList.contains('dark');
            (L.tileLayer as any).provider(isDark ? 'CartoDB.DarkMatter' : 'CartoDB.Positron').addTo(map);
            L.control.zoom({ position: 'topright' }).addTo(map);
            mapInstanceRef.current = map;

            // Global mouse listeners for brushing
            map.on('mousedown', () => setIsMouseDown(true));
            map.on('mouseup', () => setIsMouseDown(false));
            document.addEventListener('mouseup', () => setIsMouseDown(false));
        }

        const map = mapInstanceRef.current;

        // Toggle map dragging based on tool to allow "painting" without panning
        if (tool === 'brush' || tool === 'eraser') {
            map.dragging.disable();
        } else {
            map.dragging.enable();
        }

        if (geoJsonLayerRef.current) {
            map.removeLayer(geoJsonLayerRef.current);
        }

        if (filteredFeatures.length > 0) {
            const layer = L.geoJSON({ type: "FeatureCollection", features: filteredFeatures } as any, {
                style: (feature: any) => {
                    const isSelected = selectedCodes.has(feature.properties.code);

                    // Base style
                    let fillColor = '#94a3b8'; // Grey (default)
                    let fillOpacity = 0.3;

                    // History/Saturation Coloring Logic
                    if (saturationOrg !== 'none') {
                        const lastVisit = feature.properties.history?.[saturationOrg];
                        if (lastVisit) {
                            const date = new Date(lastVisit);
                            const now = new Date();
                            const diffMonths = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());

                            if (diffMonths < 6) {
                                fillColor = '#ef4444'; // Red (Saturated / Recent)
                                fillOpacity = 0.6;
                            } else if (diffMonths < 12) {
                                fillColor = '#f97316'; // Orange (Warning)
                                fillOpacity = 0.5;
                            } else {
                                fillColor = '#22c55e'; // Green (Safe / Old)
                                fillOpacity = 0.4;
                            }
                        } else {
                            fillColor = '#22c55e'; // Green (Never visited)
                            fillOpacity = 0.4;
                        }
                    }

                    // Selection override (Blue)
                    if (isSelected) {
                        fillColor = '#3b82f6';
                        fillOpacity = 0.8;
                    }

                    return {
                        fillColor: fillColor,
                        color: 'white',
                        weight: 0.5,
                        opacity: 1,
                        fillOpacity: fillOpacity
                    };
                },
                onEachFeature: (feature: any, layer: any) => {
                    const lastVisit = saturationOrg !== 'none' ? feature.properties.history?.[saturationOrg] : null;
                    const dateStr = lastVisit ? new Date(lastVisit).toLocaleDateString() : 'Jamais';

                    layer.bindTooltip(`
                        <div class="text-center font-sans">
                            <b>${feature.properties.nom}</b><br/>
                            ${feature.properties.population.toLocaleString()} hab.<br/>
                            <span class="text-xs text-emerald-600 font-bold">${feature.properties.revenue.toLocaleString()} €</span><br/>
                            ${saturationOrg !== 'none' ? `<span class="text-xs ${lastVisit ? 'text-[var(--text-secondary)]' : 'text-green-600'}">Dernier passage (${saturationOrg.toUpperCase()}): <b>${dateStr}</b></span>` : ''}
                        </div>
                    `, { sticky: true, direction: 'top' });

                    layer.on('mouseover', () => {
                        handleInteraction(feature.properties.code);
                    });
                    layer.on('mousedown', () => {
                        setIsMouseDown(true);
                        // Immediate click/interaction
                        if (tool !== 'move') {
                            setSelectedCodes(prev => {
                                const next = new Set(prev);
                                const code = feature.properties.code;
                                if (tool === 'eraser') next.delete(code);
                                else next.add(code);
                                return next;
                            });
                        }
                    });
                }
            }).addTo(map);

            geoJsonLayerRef.current = layer;

            // Only fit bounds ONCE per department load to prevent zooming in/out when filtering
            if (!hasCenteredRef.current) {
                 if (map.getBounds().contains(layer.getBounds())) {
                     // Do nothing if already visible
                 } else {
                     map.fitBounds(layer.getBounds());
                 }
                 hasCenteredRef.current = true;
            }
        }
    }, [filteredFeatures, selectedCodes, tool, isMouseDown, saturationOrg]);


    // Stats for Selection
    const selectedStats = useMemo(() => {
        let pop = 0;
        const selectedList: MapCommuneFeature[] = [];
        filteredFeatures.forEach(f => {
            if (selectedCodes.has(f.properties.code)) {
                pop += f.properties.population;
                selectedList.push(f);
            }
        });
        return { count: selectedList.length, pop, list: selectedList };
    }, [selectedCodes, filteredFeatures]);

    const zonesCount = (selectedStats.pop / 8000).toFixed(1);

    if (departments.size === 0) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-[var(--border-subtle)]">
                <div className="text-center text-[var(--text-muted)]">
                    <Filter size={48} className="mx-auto mb-4 opacity-50"/>
                    <p className="text-lg font-bold">Sélectionnez un ou plusieurs départements</p>
                    <p className="text-sm">Utilisez les filtres à gauche pour charger la carte.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-full w-full rounded-2xl overflow-hidden shadow-sm border border-[var(--border-subtle)]">
            {isLoading && (
                 <div className="absolute inset-0 z-[50] bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center flex-col">
                     <Loader2 size={48} className="text-orange-600 animate-spin mb-4"/>
                     <p className="font-bold text-[var(--text-primary)]">Chargement de la topographie...</p>
                 </div>
            )}

            {/* Toolbar - Top Left (Brush Tools) */}
            <div className="absolute top-4 left-4 z-[40] bg-white dark:bg-[var(--bg-card-solid)] p-3 rounded-xl shadow-lg border border-[var(--border-subtle)] flex flex-col gap-4 w-52 md:w-64">
                <h4 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                    <Filter size={14}/> Critères de Cinglage
                </h4>

                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-[var(--text-secondary)] font-bold">Pop. Min</span>
                        <span className="text-orange-600 font-bold">{minPop} hab.</span>
                    </div>
                    <input
                        type="range" min="0" max="5000" step="100"
                        value={minPop} onChange={(e) => setMinPop(Number(e.target.value))}
                        className="w-full accent-orange-600 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                {/* Revenu Filter Restored */}
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-[var(--text-secondary)] font-bold">Rev. Min</span>
                        <span className="text-emerald-600 font-bold">{minRevenue / 1000}k €</span>
                    </div>
                    <input
                        type="range" min="15000" max="45000" step="1000"
                        value={minRevenue} onChange={(e) => setMinRevenue(Number(e.target.value))}
                        className="w-full accent-emerald-600 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                     <button
                        onClick={() => setTool('move')}
                        className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all ${tool === 'move' ? 'bg-white dark:bg-[var(--bg-card-solid)] shadow text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                        title="Naviguer"
                    >
                        <Move size={16} />
                    </button>
                    <button
                        onClick={() => setTool('brush')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${tool === 'brush' ? 'bg-white dark:bg-[var(--bg-card-solid)] shadow text-orange-600' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                        title="Sélectionner"
                    >
                        <Brush size={16} />
                    </button>
                    <button
                        onClick={() => setTool('eraser')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${tool === 'eraser' ? 'bg-white dark:bg-[var(--bg-card-solid)] shadow text-red-600' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                        title="Effacer"
                    >
                        <Eraser size={16} />
                    </button>
                </div>
                {tool !== 'move' && <p className="text-[10px] text-center text-[var(--text-muted)]">Le déplacement carte est désactivé en mode Pinceau</p>}
            </div>

            {/* Toolbar - Top Right (History/Layer) */}
            <div className="absolute top-4 right-4 z-[40] bg-white dark:bg-[var(--bg-card-solid)] p-2 rounded-xl shadow-lg border border-[var(--border-subtle)]">
                <div className="flex items-center gap-2 px-2 pb-2 mb-2 border-b border-[var(--border-subtle)]">
                    <Layers size={14} className="text-[var(--text-muted)]"/>
                    <span className="text-xs font-bold text-[var(--text-primary)] uppercase">Calque de Saturation</span>
                </div>
                <div className="flex flex-col gap-1">
                    <button
                        onClick={() => setSaturationOrg('none')}
                        className={`px-3 py-2 text-xs font-bold rounded-lg text-left transition-colors ${saturationOrg === 'none' ? 'bg-slate-100 dark:bg-slate-800 text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
                    >
                        Aucun (Neutre)
                    </button>
                    {['msf', 'unicef', 'wwf', 'mdm'].map(org => (
                        <button
                            key={org}
                            onClick={() => setSaturationOrg(org as Organization)}
                            className={`px-3 py-2 text-xs font-bold rounded-lg text-left uppercase transition-colors flex justify-between items-center ${saturationOrg === org ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20' : 'text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
                        >
                            <span>Historique {org}</span>
                            {saturationOrg === org && <Check size={12}/>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Legend - Bottom Left */}
            {saturationOrg !== 'none' && (
                <div className="absolute bottom-6 left-6 z-[40] bg-white/90 dark:bg-[var(--bg-card-solid)]/90 backdrop-blur p-3 rounded-xl shadow-lg border border-[var(--border-subtle)] animate-fade-in">
                    <h5 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Légende Historique</h5>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></span>
                            <span className="text-xs font-bold text-[var(--text-primary)]">&lt; 6 Mois (Saturé)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm"></span>
                            <span className="text-xs font-bold text-[var(--text-primary)]">6 - 12 Mois (Attention)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></span>
                            <span className="text-xs font-bold text-[var(--text-primary)]">&gt; 1 An / Jamais (Libre)</span>
                        </div>
                        <div className="flex items-center gap-2 pt-1 mt-1 border-t border-[var(--border-subtle)]">
                            <span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm border border-white"></span>
                            <span className="text-xs font-bold text-orange-600">Votre Sélection</span>
                        </div>
                    </div>
                </div>
            )}

            <div ref={mapContainerRef} className="h-full w-full z-0 bg-slate-100 dark:bg-slate-800"></div>

            {/* Validation Bar - Bottom Center */}
            {selectedStats.count > 0 && (
                <div className="absolute bottom-6 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[40] bg-slate-900/95 backdrop-blur text-white p-3 md:p-4 rounded-2xl shadow-2xl flex flex-wrap md:flex-nowrap items-center gap-4 md:gap-8 animate-fade-in">
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase">Sélection</p>
                        <p className="text-xl font-black">{selectedStats.count} <span className="text-sm font-medium text-slate-400">communes</span></p>
                    </div>
                    <div className="hidden md:block w-px bg-white/20 h-8 self-center"></div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase">Potentiel Hab.</p>
                        <p className="text-xl font-black text-orange-400">{(selectedStats.pop / 1000).toFixed(1)}k</p>
                    </div>

                    <button
                        onClick={() => onValidationRequest(selectedStats.list)}
                        className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-orange-900/50 transition-all flex items-center gap-2 w-full md:w-auto md:ml-4 justify-center"
                    >
                        Valider <ArrowRight size={18}/>
                    </button>
                </div>
            )}
        </div>
    );
};
