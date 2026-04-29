import { useEffect, useRef } from 'react';
import { Commune } from '@/types';
import { statusMap } from '@/constants';
import L from 'leaflet';
import 'leaflet-providers';
import { useThemeStore } from '@/stores/themeStore';
import { escapeHtml } from '@/lib/htmlEscape';

const TILE_LIGHT = 'CartoDB.Positron';
const TILE_DARK = 'CartoDB.DarkMatter';

const STATUS_COLOR: Record<string, string> = {
    pas_demande: '#94a3b8',
    informe: '#f59e0b',
    refuse: '#ef4444',
    telescope: '#9333ea',
    fait: '#10b981',
};

export function useCommuneListMap(
    filteredCommunes: Commune[],
    mode: 'list' | 'map',
    onSelectCommune: (commune: Commune) => void,
) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const tileLayerRef = useRef<L.TileLayer | null>(null);
    const markersRef = useRef<L.CircleMarker[]>([]);
    const isDark = useThemeStore((s) => s.isDark);

    useEffect(() => {
        if (mode !== 'list') return;

        if (mapContainerRef.current && !mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([46.603354, 1.888334], 5.5);
            const tile = (L.tileLayer as unknown as { provider: (name: string) => L.TileLayer }).provider(
                isDark ? TILE_DARK : TILE_LIGHT,
            );
            tile.addTo(map);
            tileLayerRef.current = tile;
            L.control.zoom({ position: 'topright' }).addTo(map);
            mapInstanceRef.current = map;
        }

        const map = mapInstanceRef.current;
        if (!map) return;

        markersRef.current.forEach((m) => map.removeLayer(m));
        markersRef.current = [];

        filteredCommunes.forEach((c) => {
            if (c.lat && c.lng) {
                const color = STATUS_COLOR[c.statut] ?? '#3b82f6';
                const marker = L.circleMarker([c.lat, c.lng], {
                    radius: 6,
                    fillColor: color,
                    color: '#fff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8,
                }).addTo(map);

                // Popup HTML must escape every interpolated value — `c.nom` is
                // backend-controlled (Supabase town_halls.name).
                const statusLabel = statusMap[c.statut]?.text ?? c.statut;
                marker.bindPopup(
                    `<b>${escapeHtml(c.nom)}</b><br/>${escapeHtml(statusLabel)}`,
                );
                marker.on('click', () => onSelectCommune(c));
                markersRef.current.push(marker);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredCommunes, mode]);

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

    // Tear down the L.Map instance when the consuming component unmounts so
    // back-to-back navigations don't leak handlers / DOM nodes.
    useEffect(() => {
        return () => {
            const map = mapInstanceRef.current;
            if (map) {
                map.remove();
                mapInstanceRef.current = null;
                tileLayerRef.current = null;
                markersRef.current = [];
            }
        };
    }, []);

    return { mapContainerRef };
}
