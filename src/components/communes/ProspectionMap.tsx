import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Organization } from '@/types';
import { Filter, Loader2, Eraser, Brush, ArrowRight, Check, Layers, Move, AlertTriangle } from 'lucide-react';
import L from 'leaflet';
import 'leaflet-providers';
import { MapCommuneFeature } from '@/components/communes/types';
import { communesService } from '@/services/communesService';
import { useThemeStore } from '@/stores/themeStore';
import { reporter } from '@/lib/observability';
import { escapeHtml } from '@/lib/htmlEscape';
import { firstVertex } from '@/lib/communeGeo';
import { ORG_LIST } from '@/constants/organizations';

// Tile providers keyed off theme — must re-key the layer when isDark flips.
const TILE_LIGHT = 'CartoDB.Positron';
const TILE_DARK = 'CartoDB.DarkMatter';

export const ProspectionMap: React.FC<{
    department: string | null;
    onValidationRequest: (selectedCommunes: MapCommuneFeature[]) => void;
}> = ({ department, onValidationRequest }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const tileLayerRef = useRef<L.TileLayer | null>(null);
    const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
    const hasCenteredRef = useRef<boolean>(false);
    const deptCodeMapRef = useRef<Record<string, string> | null>(null);

    const isDark = useThemeStore((s) => s.isDark);

    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState<Error | null>(null);
    const [features, setFeatures] = useState<MapCommuneFeature[]>([]);
    const [filteredFeatures, setFilteredFeatures] = useState<MapCommuneFeature[]>([]);

    const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
    const [tool, setTool] = useState<'move' | 'brush' | 'eraser'>('move');
    const [isMouseDown, setIsMouseDown] = useState(false);

    // Refs for stable closure access in Leaflet event handlers.
    const toolRef = useRef(tool);
    toolRef.current = tool;
    const isMouseDownRef = useRef(isMouseDown);
    isMouseDownRef.current = isMouseDown;

    const [minPop, setMinPop] = useState(0);
    const [minRevenue, setMinRevenue] = useState(0);

    const [saturationOrg, setSaturationOrg] = useState<Organization | 'none'>('none');

    // Fetch geometry whenever the department changes. AbortController so a
    // rapid switch can't race a stale response into setFeatures.
    useEffect(() => {
        if (!department) {
            setFeatures([]);
            setSelectedCodes(new Set());
            setLoadError(null);
            return;
        }

        const ctrl = new AbortController();
        setIsLoading(true);
        setLoadError(null);
        setFeatures([]);
        setSelectedCodes(new Set());
        hasCenteredRef.current = false;

        const load = async () => {
            try {
                if (!deptCodeMapRef.current) {
                    deptCodeMapRef.current = await communesService.getDeptCodeMap();
                }
                const deptCode = deptCodeMapRef.current[department] ?? department;

                const res = await fetch(
                    `https://geo.api.gouv.fr/departements/${encodeURIComponent(deptCode)}/communes?geometry=contour&format=geojson&type=commune-actuelle`,
                    { signal: ctrl.signal },
                );
                if (!res.ok) {
                    throw new Error(`GeoAPI ${res.status}`);
                }
                const data = await res.json();

                const realCommunes = await communesService.getCommunesByDeptCode(deptCode);
                if (ctrl.signal.aborted) return;

                const communeByInsee: Record<string, typeof realCommunes[0]> = {};
                for (const c of realCommunes) {
                    if (c.inseeCode) communeByInsee[c.inseeCode] = c;
                }

                const enriched: MapCommuneFeature[] = (data.features ?? []).map((f: MapCommuneFeature) => {
                    const inseeCode = f.properties.code;
                    const real = communeByInsee[inseeCode];
                    const centroid = firstVertex(f.geometry);
                    return {
                        ...f,
                        properties: {
                            ...f.properties,
                            revenue: real?.medianIncome ?? 0,
                            population: f.properties.population ?? real?.population ?? 0,
                            lat: real?.lat ?? centroid?.lat ?? 0,
                            lng: real?.lng ?? centroid?.lng ?? 0,
                            history: {},
                        },
                    };
                });
                if (ctrl.signal.aborted) return;
                setFeatures(enriched);
            } catch (e) {
                if (ctrl.signal.aborted) return;
                if (e instanceof DOMException && e.name === 'AbortError') return;
                reporter.error('ProspectionMap.loadGeometry failed', e, {
                    source: 'ProspectionMap',
                    tags: { department },
                });
                setLoadError(e instanceof Error ? e : new Error(String(e)));
            } finally {
                if (!ctrl.signal.aborted) setIsLoading(false);
            }
        };

        load();
        return () => ctrl.abort();
    }, [department]);

    useEffect(() => {
        const filtered = features.filter(
            (f) => f.properties.population >= minPop && f.properties.revenue >= minRevenue,
        );
        setFilteredFeatures(filtered);
    }, [features, minPop, minRevenue]);

    const handleInteraction = (code: string) => {
        if (!isMouseDownRef.current) return;
        if (toolRef.current === 'move') return;

        setSelectedCodes((prev) => {
            const next = new Set(prev);
            if (toolRef.current === 'brush') next.add(code);
            else next.delete(code);
            return next;
        });
    };

    // Init map (once). Track all DOM listeners so they're cleanly removed on
    // unmount — previously document-level mouseup + container dragstart leaked.
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            boxZoom: false,
            doubleClickZoom: false,
        }).setView([46.6, 1.8], 6);

        const tile = (L.tileLayer as unknown as { provider: (name: string) => L.TileLayer }).provider(
            isDark ? TILE_DARK : TILE_LIGHT,
        );
        tile.addTo(map);
        tileLayerRef.current = tile;
        L.control.zoom({ position: 'topright' }).addTo(map);
        mapInstanceRef.current = map;

        map.on('mousedown', () => setIsMouseDown(true));
        map.on('mouseup', () => setIsMouseDown(false));

        const onDocMouseUp = () => setIsMouseDown(false);
        document.addEventListener('mouseup', onDocMouseUp);

        const container = map.getContainer();
        const onDragStart = (e: Event) => e.preventDefault();
        const onContainerMouseDown = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'IMG') e.preventDefault();
        };
        container.addEventListener('dragstart', onDragStart);
        container.addEventListener('mousedown', onContainerMouseDown);
        container.style.userSelect = 'none';
        if (map.boxZoom) map.boxZoom.disable();

        return () => {
            document.removeEventListener('mouseup', onDocMouseUp);
            container.removeEventListener('dragstart', onDragStart);
            container.removeEventListener('mousedown', onContainerMouseDown);
            map.remove();
            mapInstanceRef.current = null;
            tileLayerRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Swap tile layer when theme toggles.
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;
        if (tileLayerRef.current) {
            map.removeLayer(tileLayerRef.current);
            tileLayerRef.current = null;
        }
        const tile = (L.tileLayer as unknown as { provider: (name: string) => L.TileLayer }).provider(
            isDark ? TILE_DARK : TILE_LIGHT,
        );
        tile.addTo(map);
        tileLayerRef.current = tile;
    }, [isDark]);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;
        if (tool === 'brush' || tool === 'eraser') {
            map.dragging.disable();
        } else {
            map.dragging.enable();
        }
    }, [tool]);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        if (geoJsonLayerRef.current) {
            map.removeLayer(geoJsonLayerRef.current);
            geoJsonLayerRef.current = null;
        }

        if (filteredFeatures.length > 0) {
            const layer = L.geoJSON({ type: 'FeatureCollection', features: filteredFeatures } as unknown as GeoJSON.FeatureCollection, {
                style: (feature) => {
                    if (!feature) return {};
                    const props = feature.properties as MapCommuneFeature['properties'];
                    const isSelected = selectedCodes.has(props.code);

                    let fillColor = '#94a3b8';
                    let fillOpacity = 0.3;

                    if (saturationOrg !== 'none') {
                        const lastVisit = props.history?.[saturationOrg];
                        if (lastVisit) {
                            const date = new Date(lastVisit);
                            const now = new Date();
                            const diffMonths =
                                (now.getFullYear() - date.getFullYear()) * 12 +
                                (now.getMonth() - date.getMonth());
                            if (diffMonths < 6) {
                                fillColor = '#ef4444';
                                fillOpacity = 0.6;
                            } else if (diffMonths < 12) {
                                fillColor = '#f97316';
                                fillOpacity = 0.5;
                            } else {
                                fillColor = '#22c55e';
                                fillOpacity = 0.4;
                            }
                        } else {
                            fillColor = '#22c55e';
                            fillOpacity = 0.4;
                        }
                    }

                    if (isSelected) {
                        fillColor = '#3b82f6';
                        fillOpacity = 0.8;
                    }

                    return {
                        fillColor,
                        color: 'white',
                        weight: 0.5,
                        opacity: 1,
                        fillOpacity,
                    };
                },
                onEachFeature: (feature, layer) => {
                    const props = feature.properties as MapCommuneFeature['properties'];
                    // Tooltip HTML: every interpolated value MUST be escaped.
                    const lastVisit = saturationOrg !== 'none' ? props.history?.[saturationOrg] : null;
                    const dateStr = lastVisit
                        ? new Date(lastVisit).toLocaleDateString()
                        : 'Jamais';
                    const pop = typeof props.population === 'number' ? props.population : 0;
                    const rev = typeof props.revenue === 'number' ? props.revenue : 0;
                    const orgUpper = saturationOrg !== 'none' ? saturationOrg.toUpperCase() : '';

                    const html =
                        `<div class="text-center font-sans">` +
                        `<b>${escapeHtml(props.nom)}</b><br/>` +
                        `${escapeHtml(pop.toLocaleString())} hab.<br/>` +
                        `<span class="text-xs text-emerald-700 dark:text-emerald-400 font-bold">${escapeHtml(rev.toLocaleString())} €</span><br/>` +
                        (saturationOrg !== 'none'
                            ? `<span class="text-xs ${lastVisit ? 'text-[var(--text-secondary)]' : 'text-green-600'}">Dernier passage (${escapeHtml(orgUpper)}): <b>${escapeHtml(dateStr)}</b></span>`
                            : '') +
                        `</div>`;

                    layer.bindTooltip(html, { sticky: true, direction: 'top' });

                    layer.on('mouseover', () => handleInteraction(props.code));
                    layer.on('mousedown', () => {
                        setIsMouseDown(true);
                        if (toolRef.current !== 'move') {
                            setSelectedCodes((prev) => {
                                const next = new Set(prev);
                                if (toolRef.current === 'eraser') next.delete(props.code);
                                else next.add(props.code);
                                return next;
                            });
                        }
                    });
                },
            }).addTo(map);

            geoJsonLayerRef.current = layer;

            if (!hasCenteredRef.current) {
                map.fitBounds(layer.getBounds(), { padding: [20, 20] });
                hasCenteredRef.current = true;
            }
        }

        return () => {
            if (geoJsonLayerRef.current && map) {
                map.removeLayer(geoJsonLayerRef.current);
                geoJsonLayerRef.current = null;
            }
        };
    }, [filteredFeatures, selectedCodes, saturationOrg]);

    const selectedStats = useMemo(() => {
        let pop = 0;
        const selectedList: MapCommuneFeature[] = [];
        filteredFeatures.forEach((f) => {
            if (selectedCodes.has(f.properties.code)) {
                pop += f.properties.population;
                selectedList.push(f);
            }
        });
        return { count: selectedList.length, pop, list: selectedList };
    }, [selectedCodes, filteredFeatures]);

    if (!department) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-[var(--border-subtle)]">
                <div className="text-center text-[var(--text-muted)]">
                    <Filter size={48} className="mx-auto mb-4 opacity-50" />
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
                    <Loader2 size={48} className="text-orange-600 animate-spin mb-4" />
                    <p className="font-bold text-[var(--text-primary)]">Chargement de la topographie...</p>
                </div>
            )}

            {loadError && !isLoading && (
                <div className="absolute inset-x-4 top-4 z-[60] bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/20 rounded-xl p-4 flex items-start gap-3" role="alert">
                    <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                        <h4 className="font-bold text-red-800 dark:text-red-300 text-sm uppercase mb-1">
                            Carte indisponible
                        </h4>
                        <p className="text-sm text-red-800 dark:text-red-300">
                            {loadError.message || 'Impossible de charger la topographie de ce département.'}
                        </p>
                    </div>
                </div>
            )}

            <div className="absolute top-4 left-4 z-[40] bg-white dark:bg-[var(--bg-card-solid)] p-3 rounded-xl shadow-lg border border-[var(--border-subtle)] flex flex-col gap-4 w-52 md:w-64">
                <h4 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                    <Filter size={14} /> Critères de Cinglage
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
                        aria-label="Population minimale"
                    />
                </div>

                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-[var(--text-secondary)] font-bold">Rev. Min</span>
                        <span className="text-emerald-600 font-bold">{minRevenue / 1000}k €</span>
                    </div>
                    <input
                        type="range" min="15000" max="45000" step="1000"
                        value={minRevenue} onChange={(e) => setMinRevenue(Number(e.target.value))}
                        className="w-full accent-emerald-600 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        aria-label="Revenu médian minimal"
                    />
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg" role="group" aria-label="Outil de sélection">
                    <button
                        type="button"
                        onClick={() => setTool('move')}
                        aria-pressed={tool === 'move'}
                        className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all ${tool === 'move' ? 'bg-white dark:bg-[var(--bg-card-solid)] shadow text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                        title="Naviguer"
                    >
                        <Move size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setTool('brush')}
                        aria-pressed={tool === 'brush'}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${tool === 'brush' ? 'bg-white dark:bg-[var(--bg-card-solid)] shadow text-orange-600' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                        title="Sélectionner"
                    >
                        <Brush size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setTool('eraser')}
                        aria-pressed={tool === 'eraser'}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${tool === 'eraser' ? 'bg-white dark:bg-[var(--bg-card-solid)] shadow text-red-600' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                        title="Effacer"
                    >
                        <Eraser size={16} />
                    </button>
                </div>
                {tool !== 'move' && <p className="text-[10px] text-center text-[var(--text-muted)]">Le déplacement carte est désactivé en mode Pinceau</p>}
            </div>

            <div className="absolute top-4 right-4 z-[40] bg-white dark:bg-[var(--bg-card-solid)] p-2 rounded-xl shadow-lg border border-[var(--border-subtle)]">
                <div className="flex items-center gap-2 px-2 pb-2 mb-2 border-b border-[var(--border-subtle)]">
                    <Layers size={14} className="text-[var(--text-muted)]" />
                    <span className="text-xs font-bold text-[var(--text-primary)] uppercase">Calque de Saturation</span>
                </div>
                <div className="flex flex-col gap-1">
                    <button
                        type="button"
                        onClick={() => setSaturationOrg('none')}
                        aria-pressed={saturationOrg === 'none'}
                        className={`px-3 py-2 text-xs font-bold rounded-lg text-left transition-colors ${saturationOrg === 'none' ? 'bg-slate-100 dark:bg-slate-800 text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
                    >
                        Aucun (Neutre)
                    </button>
                    {ORG_LIST.map((org) => (
                        <button
                            type="button"
                            key={org}
                            onClick={() => setSaturationOrg(org)}
                            aria-pressed={saturationOrg === org}
                            className={`px-3 py-2 text-xs font-bold rounded-lg text-left uppercase transition-colors flex justify-between items-center ${saturationOrg === org ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20' : 'text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
                        >
                            <span>Historique {org}</span>
                            {saturationOrg === org && <Check size={12} />}
                        </button>
                    ))}
                </div>
            </div>

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
                            <span className="text-xs font-bold text-orange-600 dark:text-orange-400">Votre Sélection</span>
                        </div>
                    </div>
                </div>
            )}

            <div ref={mapContainerRef} className="h-full w-full z-0 bg-slate-100 dark:bg-slate-800 select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none', outline: 'none' }}></div>

            {selectedStats.count > 0 && (
                <div className="absolute bottom-6 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[40] bg-slate-900/95 backdrop-blur text-white p-3 md:p-4 rounded-2xl shadow-2xl flex flex-wrap md:flex-nowrap items-center gap-4 md:gap-8 animate-fade-in">
                    <div>
                        <p className="text-slate-300 text-xs font-bold uppercase">Sélection</p>
                        <p className="text-xl font-black">{selectedStats.count} <span className="text-sm font-medium text-slate-300">communes</span></p>
                    </div>
                    <div className="hidden md:block w-px bg-white/20 h-8 self-center"></div>
                    <div>
                        <p className="text-slate-300 text-xs font-bold uppercase">Potentiel Hab.</p>
                        <p className="text-xl font-black text-orange-400">{(selectedStats.pop / 1000).toFixed(1)}k</p>
                    </div>

                    <button
                        type="button"
                        onClick={() => onValidationRequest(selectedStats.list)}
                        className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-orange-900/50 transition-all flex items-center gap-2 w-full md:w-auto md:ml-4 justify-center"
                    >
                        Valider <ArrowRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};
