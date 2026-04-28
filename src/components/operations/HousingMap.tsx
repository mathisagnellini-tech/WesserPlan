import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-providers';
import type { Housing } from './types';
import { MOCK_ZONES } from './helpers';
import { useThemeStore } from '@/stores/themeStore';
import { escapeHtml, safeColor } from '@/lib/htmlEscape';
import { reporter } from '@/lib/observability';

interface HousingMapProps {
    housings: Housing[];
    smartZoneId: string;
    onSelectHousing: (h: Housing) => void;
}

// Tailwind utility class -> hex used by safeColor for the match-status dot
// rendered inside the Leaflet divIcon. Keeping a small whitelist avoids
// embedding arbitrary class strings into HTML.
const MATCH_DOT_COLORS: Record<string, string> = {
    'bg-green-700': '#15803d',
    'bg-red-600': '#dc2626',
    'bg-orange-600': '#ea580c',
    'bg-slate-600': '#475569',
};

type LeafletProvider = (name: string) => L.TileLayer;

export const HousingMap: React.FC<HousingMapProps> = ({ housings, smartZoneId, onSelectHousing }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);
    const tileLayerRef = useRef<L.TileLayer | null>(null);
    const isDark = useThemeStore((s) => s.isDark);

    // Init map once.
    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;
        const map = L.map(mapRef.current, { zoomControl: false }).setView([46.6, 2.5], 6);
        const provider = (L.tileLayer as unknown as { provider: LeafletProvider }).provider;
        const tile = provider(isDark ? 'CartoDB.DarkMatter' : 'CartoDB.Positron').addTo(map);
        tileLayerRef.current = tile;
        L.control.zoom({ position: 'topright' }).addTo(map);
        mapInstance.current = map;

        return () => {
            map.remove();
            mapInstance.current = null;
            tileLayerRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Swap tile layer when theme changes — avoids MutationObserver / classList hacks.
    useEffect(() => {
        const map = mapInstance.current;
        if (!map) return;
        if (tileLayerRef.current) {
            map.removeLayer(tileLayerRef.current);
        }
        const provider = (L.tileLayer as unknown as { provider: LeafletProvider }).provider;
        tileLayerRef.current = provider(isDark ? 'CartoDB.DarkMatter' : 'CartoDB.Positron').addTo(map);
    }, [isDark]);

    // Render markers / zone overlay.
    useEffect(() => {
        const map = mapInstance.current;
        if (!map) return;

        // Remove only non-tile layers (markers, circles, etc).
        map.eachLayer((layer) => {
            if (!(layer instanceof L.TileLayer)) {
                map.removeLayer(layer);
            }
        });

        // 1. Draw Target Zone (if selected)
        if (smartZoneId) {
            const zone = MOCK_ZONES.find(z => z.id === smartZoneId);
            if (zone) {
                L.circle([zone.lat, zone.lng], {
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.1,
                    radius: zone.radius * 1000,
                }).addTo(map);

                const targetIcon = L.divIcon({
                    html: `<div class="relative flex items-center justify-center">
                                <div class="absolute w-4 h-4 bg-orange-600 rounded-full animate-ping"></div>
                                <div class="relative w-3 h-3 bg-orange-600 rounded-full border border-white shadow-sm"></div>
                            </div>`,
                    className: 'bg-transparent border-none',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                });
                L.marker([zone.lat, zone.lng], { icon: targetIcon, zIndexOffset: 1000 })
                    .addTo(map)
                    .bindPopup(`<b>Zone: ${escapeHtml(zone.name)}</b>`);
            }
        }

        // 2. Draw Housing Markers
        const bounds = L.latLngBounds([]);

        housings.forEach((h) => {
            const matchLabel = h._matchLabel;
            const dotColor = h._matchColor ? safeColor(MATCH_DOT_COLORS[h._matchColor] ?? '', '#475569') : '';
            const dotHtml = matchLabel && dotColor
                ? `<span class="absolute -top-2 -right-2 w-3 h-3 rounded-full" style="background:${dotColor}"></span>`
                : '';
            const iconHtml = `<div class="w-8 h-8 bg-white dark:bg-[var(--bg-card-solid)] rounded-full border-2 border-white dark:border-slate-700 flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer text-sm relative">
                                    🏠
                                    ${dotHtml}
                                  </div>`;
            const icon = L.divIcon({ html: iconHtml, className: 'bg-transparent', iconSize: [32, 32], iconAnchor: [16, 16] });

            const marker = L.marker([h.lat, h.lng], { icon }).addTo(map);
            marker.on('click', () => onSelectHousing(h));
            bounds.extend([h.lat, h.lng]);
        });

        try {
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
            } else {
                map.setView([46.6, 2.5], 6);
            }
        } catch (err) {
            reporter.error('Failed to fit map bounds', err, { source: 'operations/HousingMap' });
        }

        const sizeTimer = setTimeout(() => {
            if (mapInstance.current) mapInstance.current.invalidateSize();
        }, 100);
        return () => clearTimeout(sizeTimer);
    }, [housings, smartZoneId, onSelectHousing]);

    return (
        <div className="h-[600px] w-full rounded-2xl overflow-hidden border border-[var(--border-subtle)] shadow-sm relative animate-fade-in">
            <div ref={mapRef} className="h-full w-full z-0"></div>
        </div>
    );
};
