import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet-providers';
import { eventData } from '@/constants';
import { METRICS_CONFIG } from '@/components/wplan/metricsConfig';
import type { MapMetric } from '@/components/wplan/metricsConfig';

interface UseWplanMapParams {
    regionGeoJSON: any;
    departmentGeoJSON: any;
    mapLevel: 'regions' | 'departments';
    viewingRegion: any | null;
    selectedItem: any | null;
    comparisonItem: any | null;
    isComparing: boolean;
    showEvents: boolean;
    activeMetric: MapMetric;
    filters: {
        regions: Set<string>;
        departments: Set<string>;
    };
    setSelectedItem: (item: any | null) => void;
    setComparisonItem: (item: any | null) => void;
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
    const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
    const eventMarkersRef = useRef<L.Marker[]>([]);

    const getMetricValue = useCallback((code: string, metric: MapMetric) => {
        // Deterministic per-(code, metric) value 0–99. Mix the metric name into the
        // hash so each metric paints a different pattern instead of all sharing one.
        const seed = `${metric}:${code}`;
        let hash = 0;
        for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
        return Math.abs(hash) % 100;
    }, []);

    const getMetricColor = useCallback((code: string, metric: MapMetric) => {
        return METRICS_CONFIG[metric].getValueColor(getMetricValue(code, metric));
    }, [getMetricValue]);

    // Initialize map
    useEffect(() => {
        if (mapContainerRef.current && !mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, { zoomControl: false, minZoom: 5, maxZoom: 10 }).setView([46.8, 2.8], 5.5);
            const isDark = document.documentElement.classList.contains('dark');
            const tileLayer = (L.tileLayer as any).provider(isDark ? 'CartoDB.DarkMatter' : 'CartoDB.Positron').addTo(map);
            (map as any)._tileLayer = tileLayer;
            L.control.zoom({ position: 'topright' }).addTo(map);
            mapInstanceRef.current = map;
        }

        const map = mapInstanceRef.current;
        if (!map || !regionGeoJSON || !departmentGeoJSON) return;

        // Event markers
        eventMarkersRef.current.forEach(m => map.removeLayer(m));
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
                popupAnchor: [0, -28]
            });

            eventData.forEach(event => {
                const popupContent = `
                    <div>
                        <h3 style="font-weight: 700; margin: 0 0 8px; color: var(--text-primary); font-size: 15px;">${event.name}</h3>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 13px;"><strong>Lieu:</strong> ${event.location}</p>
                    </div>
                `;
                const marker = L.marker([event.lat, event.lng], { icon: eventIcon })
                    .addTo(map)
                    .bindPopup(popupContent);
                eventMarkersRef.current.push(marker);
            });
        }

        // GeoJSON layer
        if (geoJsonLayerRef.current) map.removeLayer(geoJsonLayerRef.current);

        let features;
        if (viewingRegion) {
            const regionCode = viewingRegion.properties.code;
            features = departmentGeoJSON.features.filter((d: any) => d.properties.codeRegion === regionCode);
            if (filters.departments.size > 0) {
                features = features.filter((d: any) => filters.departments.has(d.properties.code));
            }
        } else if (mapLevel === 'regions') {
            features = regionGeoJSON.features;
            if (filters.regions.size > 0) {
                features = features.filter((f: any) => filters.regions.has(f.properties.nom));
            }
        } else {
            features = departmentGeoJSON.features;
            if (filters.departments.size > 0) {
                features = features.filter((d: any) => filters.departments.has(d.properties.code));
            }
        }
        const geoJsonData = { type: "FeatureCollection" as const, features: features };

        const style = (feature: any) => {
            const code = feature.properties.code;
            const baseColor = getMetricColor(code, activeMetric);

            if (selectedItem?.properties.code === code) return { weight: 3, color: '#FF5B2B', fillOpacity: 0.9, fillColor: baseColor };
            if (comparisonItem?.properties.code === code) return { weight: 3, color: '#3b82f6', fillOpacity: 0.9, fillColor: baseColor };

            const isDark = document.documentElement.classList.contains('dark');
            return {
                fillColor: baseColor,
                weight: 1.2,
                opacity: 1,
                color: isDark ? 'rgba(30,33,48,0.8)' : 'rgba(255,255,255,0.8)',
                dashArray: '',
                fillOpacity: 0.75
            };
        };

        const highlightFeature = (e: L.LeafletEvent) => {
            const layer = e.target;
            layer.setStyle({ weight: 2, color: '#1a1a1a', fillOpacity: 0.9 });
            layer.bringToFront();
        };

        const resetHighlight = (e: L.LeafletEvent) => {
            geoJsonLayerRef.current?.resetStyle(e.target);
        };

        const onEachFeature = (feature: any, layer: L.Layer) => {
            const code = feature.properties.code || '';
            const metricVal = getMetricValue(code, activeMetric);
            (layer as any).bindPopup(
                `<div class="text-sm font-sans">
                    <b class="text-base">${feature.properties.nom}</b><br>
                    <span class="text-gray-500">${code}</span>
                    <hr class="my-1 border-gray-200"/>
                    <div class="flex justify-between items-center">
                        <span>${METRICS_CONFIG[activeMetric].label}</span>
                        <b class="text-orange-600">${metricVal}</b>
                    </div>
                </div>`
            );
            (layer as any).on({
                mouseover: highlightFeature,
                mouseout: resetHighlight,
                click: () => {
                    if (!isComparing) {
                        setSelectedItem(feature);
                    } else {
                        if (!selectedItem) setSelectedItem(feature);
                        else if (!comparisonItem) setComparisonItem(feature);
                        else { setSelectedItem(feature); setComparisonItem(null); }
                    }
                }
            });
        };

        geoJsonLayerRef.current = L.geoJSON(geoJsonData as any, { style, onEachFeature }).addTo(map);

    }, [mapLevel, viewingRegion, selectedItem, comparisonItem, isComparing, showEvents, filters, regionGeoJSON, departmentGeoJSON, activeMetric, getMetricColor, getMetricValue, setSelectedItem, setComparisonItem]);

    // Invalidate map size on mount
    useEffect(() => {
        if (mapInstanceRef.current) {
            setTimeout(() => mapInstanceRef.current?.invalidateSize(), 150);
        }
    }, []);

    // Dark mode tile swap
    useEffect(() => {
        const observer = new MutationObserver(() => {
            const map = mapInstanceRef.current;
            if (!map) return;
            const isDark = document.documentElement.classList.contains('dark');
            const provider = isDark ? 'CartoDB.DarkMatter' : 'CartoDB.Positron';
            if ((map as any)._tileLayer) map.removeLayer((map as any)._tileLayer);
            (map as any)._tileLayer = (L.tileLayer as any).provider(provider).addTo(map);
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    return {
        mapContainerRef,
        mapInstanceRef,
    };
}
