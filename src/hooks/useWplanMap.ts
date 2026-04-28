import { useCallback, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-providers';
import { eventData } from '@/constants';
import { METRICS_CONFIG } from '@/components/wplan/metricsConfig';
import type { MapMetric } from '@/components/wplan/metricsConfig';
import { useThemeStore } from '@/stores/themeStore';
import { escapeHtml } from '@/lib/htmlEscape';
import { hashCode } from '@/lib/wplanHash';

const TILE_LIGHT = 'CartoDB.Positron';
const TILE_DARK = 'CartoDB.DarkMatter';

interface UseWplanMapParams {
    regionGeoJSON: GeoJSON.FeatureCollection | null;
    departmentGeoJSON: GeoJSON.FeatureCollection | null;
    mapLevel: 'regions' | 'departments';
    viewingRegion: GeoJSON.Feature | null;
    selectedItem: GeoJSON.Feature | null;
    comparisonItem: GeoJSON.Feature | null;
    isComparing: boolean;
    showEvents: boolean;
    activeMetric: MapMetric;
    filters: {
        regions: Set<string>;
        departments: Set<string>;
    };
    setSelectedItem: (item: GeoJSON.Feature | null) => void;
    setComparisonItem: (item: GeoJSON.Feature | null) => void;
}

export function useWplanMap({
    regionGeoJSON,
    departmentGeoJSON,
    mapLevel,
    viewingRegion,
    selectedItem,
    comparisonItem,
    isComparing,
    showEvents,
    activeMetric,
    filters,
    setSelectedItem,
    setComparisonItem,
}: UseWplanMapParams) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const tileLayerRef = useRef<L.TileLayer | null>(null);
    const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
    const eventMarkersRef = useRef<L.Marker[]>([]);

    const isDark = useThemeStore((s) => s.isDark);

    const getMetricValue = useCallback((code: string, metric: MapMetric) => {
        // Mix the metric name into the seed so different metrics produce
        // different patterns rather than all sharing one.
        return hashCode(`${metric}:${code}`) % 100;
    }, []);

    const getMetricColor = useCallback((code: string, metric: MapMetric) => {
        return METRICS_CONFIG[metric].getValueColor(getMetricValue(code, metric));
    }, [getMetricValue]);

    // Init map (once). Tracks tile layer + cleans up on unmount.
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            minZoom: 5,
            maxZoom: 10,
        }).setView([46.8, 2.8], 5.5);

        const tile = (L.tileLayer as unknown as { provider: (name: string) => L.TileLayer }).provider(
            isDark ? TILE_DARK : TILE_LIGHT,
        );
        tile.addTo(map);
        tileLayerRef.current = tile;
        L.control.zoom({ position: 'topright' }).addTo(map);
        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
            tileLayerRef.current = null;
            geoJsonLayerRef.current = null;
            eventMarkersRef.current = [];
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Swap tile layer when theme toggles. Wired through the canonical
    // useThemeStore — replaces the previous MutationObserver hack.
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

    // Render markers + GeoJSON layer.
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !regionGeoJSON || !departmentGeoJSON) return;

        // Event markers — escape every interpolated string from the
        // event constant before injecting into the popup HTML.
        eventMarkersRef.current.forEach((m) => map.removeLayer(m));
        eventMarkersRef.current = [];
        if (showEvents) {
            const eventIcon = L.divIcon({
                html: `<div class="relative flex items-center justify-center">
                       <div class="absolute w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75"></div>
                       <div class="relative text-2xl z-10">📍</div>
                   </div>`,
                className: 'bg-transparent border-none',
                iconSize: [24, 24],
                iconAnchor: [12, 24],
                popupAnchor: [0, -28],
            });

            eventData.forEach((event) => {
                const popupContent = `
                <div>
                    <h3 style="font-weight: 700; margin: 0 0 8px; color: var(--text-primary); font-size: 15px;">${escapeHtml(event.name)}</h3>
                    <p style="margin: 0; color: var(--text-secondary); font-size: 13px;"><strong>Lieu:</strong> ${escapeHtml(event.location)}</p>
                </div>`;
                const marker = L.marker([event.lat, event.lng], { icon: eventIcon })
                    .addTo(map)
                    .bindPopup(popupContent);
                eventMarkersRef.current.push(marker);
            });
        }

        if (geoJsonLayerRef.current) map.removeLayer(geoJsonLayerRef.current);

        let features: GeoJSON.Feature[];
        if (viewingRegion) {
            const regionCode = (viewingRegion.properties as { code?: string } | null)?.code;
            features = (departmentGeoJSON.features as GeoJSON.Feature[]).filter(
                (d) => (d.properties as { codeRegion?: string } | null)?.codeRegion === regionCode,
            );
            if (filters.departments.size > 0) {
                features = features.filter((d) => filters.departments.has((d.properties as { code?: string } | null)?.code ?? ''));
            }
        } else if (mapLevel === 'regions') {
            features = regionGeoJSON.features as GeoJSON.Feature[];
            if (filters.regions.size > 0) {
                features = features.filter((f) => filters.regions.has((f.properties as { nom?: string } | null)?.nom ?? ''));
            }
        } else {
            features = departmentGeoJSON.features as GeoJSON.Feature[];
            if (filters.departments.size > 0) {
                features = features.filter((d) => filters.departments.has((d.properties as { code?: string } | null)?.code ?? ''));
            }
        }
        const geoJsonData: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features };

        const style = (feature: GeoJSON.Feature | undefined): L.PathOptions => {
            if (!feature) return {};
            const code = (feature.properties as { code?: string } | null)?.code ?? '';
            const baseColor = getMetricColor(code, activeMetric);
            const selectedCode = (selectedItem?.properties as { code?: string } | null)?.code;
            const comparisonCode = (comparisonItem?.properties as { code?: string } | null)?.code;
            if (selectedCode === code) return { weight: 3, color: '#FF5B2B', fillOpacity: 0.9, fillColor: baseColor };
            if (comparisonCode === code) return { weight: 3, color: '#3b82f6', fillOpacity: 0.9, fillColor: baseColor };
            return {
                fillColor: baseColor,
                weight: 1.2,
                opacity: 1,
                color: isDark ? 'rgba(30,33,48,0.8)' : 'rgba(255,255,255,0.8)',
                dashArray: '',
                fillOpacity: 0.75,
            };
        };

        const highlightFeature = (e: L.LeafletEvent) => {
            const layer = e.target as L.Path;
            layer.setStyle({ weight: 2, color: isDark ? '#fff' : '#1a1a1a', fillOpacity: 0.9 });
            (layer as unknown as { bringToFront: () => void }).bringToFront();
        };

        const resetHighlight = (e: L.LeafletEvent) => {
            geoJsonLayerRef.current?.resetStyle(e.target as L.Path);
        };

        const onEachFeature = (feature: GeoJSON.Feature, layer: L.Layer) => {
            const props = (feature.properties ?? {}) as { code?: string; nom?: string };
            const code = props.code ?? '';
            const nom = props.nom ?? '';
            const metricVal = getMetricValue(code, activeMetric);
            const metricLabel = METRICS_CONFIG[activeMetric].label;

            // Every interpolated string is escaped — `nom` and `code` come
            // from a public CDN GeoJSON; treat as untrusted defence-in-depth.
            const popupHtml =
                `<div class="text-sm font-sans">` +
                `<b class="text-base">${escapeHtml(nom)}</b><br>` +
                `<span class="text-slate-600 dark:text-slate-400">${escapeHtml(code)}</span>` +
                `<hr class="my-1 border-[var(--border-subtle)]"/>` +
                `<div class="flex justify-between items-center">` +
                `<span>${escapeHtml(metricLabel)}</span>` +
                `<b class="text-orange-600">${escapeHtml(String(metricVal))}</b>` +
                `</div>` +
                `</div>`;
            (layer as L.Layer & { bindPopup: (s: string) => void }).bindPopup(popupHtml);

            layer.on({
                mouseover: highlightFeature,
                mouseout: resetHighlight,
                click: () => {
                    if (!isComparing) {
                        setSelectedItem(feature);
                    } else if (!selectedItem) {
                        setSelectedItem(feature);
                    } else if (!comparisonItem) {
                        setComparisonItem(feature);
                    } else {
                        setSelectedItem(feature);
                        setComparisonItem(null);
                    }
                },
            });
        };

        geoJsonLayerRef.current = L.geoJSON(geoJsonData, { style, onEachFeature }).addTo(map);
    }, [
        mapLevel,
        viewingRegion,
        selectedItem,
        comparisonItem,
        isComparing,
        showEvents,
        filters,
        regionGeoJSON,
        departmentGeoJSON,
        activeMetric,
        getMetricColor,
        getMetricValue,
        isDark,
        setSelectedItem,
        setComparisonItem,
    ]);

    // Recompute map size when its container resizes (new layouts, sidebar
    // collapse, window resize). ResizeObserver replaces the previous brittle
    // setTimeout(150) one-shot.
    useEffect(() => {
        const container = mapContainerRef.current;
        const map = mapInstanceRef.current;
        if (!container || !map) return;
        const observer = new ResizeObserver(() => map.invalidateSize());
        observer.observe(container);
        // Trigger one initial invalidation in case the layout settled before
        // the observer attached.
        map.invalidateSize();
        return () => observer.disconnect();
    }, [regionGeoJSON, departmentGeoJSON]);

    return {
        mapContainerRef,
        mapInstanceRef,
    };
}
