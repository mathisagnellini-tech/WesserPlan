import { useEffect, useRef } from 'react';
import { Commune } from '@/types';
import { statusMap } from '@/constants';
import L from 'leaflet';
import 'leaflet-providers';

export function useCommuneListMap(
    filteredCommunes: Commune[],
    mode: 'list' | 'map',
    onSelectCommune: (commune: Commune) => void,
) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.CircleMarker[]>([]);

    useEffect(() => {
        if (mode !== 'list') return;

        if (!L) return;

        if (mapContainerRef.current && !mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([46.603354, 1.888334], 5.5);
            const isDarkMode = document.documentElement.classList.contains('dark');
            (L.tileLayer as any).provider(isDarkMode ? 'CartoDB.DarkMatter' : 'CartoDB.Positron').addTo(map);
            L.control.zoom({ position: 'topright' }).addTo(map);
            mapInstanceRef.current = map;
        }

        const map = mapInstanceRef.current;
        if (map) {
            markersRef.current.forEach(m => map.removeLayer(m));
            markersRef.current = [];

            filteredCommunes.forEach(c => {
                if (c.lat && c.lng) {
                    let color = '#3b82f6';
                    if (c.statut === 'fait') color = '#10b981';
                    else if (c.statut === 'refuse') color = '#ef4444';
                    else if (c.statut === 'telescope') color = '#9333ea';
                    else if (c.statut === 'informe') color = '#f59e0b';
                    else if (c.statut === 'pas_demande') color = '#94a3b8';

                    const marker = L.circleMarker([c.lat, c.lng], {
                        radius: 6,
                        fillColor: color,
                        color: '#fff',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.8
                    }).addTo(map);

                    marker.bindPopup(`<b>${c.nom}</b><br/>${statusMap[c.statut]?.text || c.statut}`);
                    marker.on('click', () => onSelectCommune(c));
                    markersRef.current.push(marker);
                }
            });
        }
    }, [filteredCommunes, mode]);

    return { mapContainerRef };
}
