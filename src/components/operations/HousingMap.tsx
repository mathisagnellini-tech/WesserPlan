import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-providers';
import type { Housing } from './types';
import { MOCK_ZONES } from './helpers';

interface HousingMapProps {
    housings: Housing[];
    smartZoneId: string;
    onSelectHousing: (h: Housing) => void;
}

export const HousingMap: React.FC<HousingMapProps> = ({ housings, smartZoneId, onSelectHousing }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);

    useEffect(() => {
        if (mapRef.current && !mapInstance.current) {
            const map = L.map(mapRef.current, { zoomControl: false }).setView([46.6, 2.5], 6);
            const isDark = document.documentElement.classList.contains('dark');
            (L.tileLayer as any).provider(isDark ? 'CartoDB.DarkMatter' : 'CartoDB.Positron').addTo(map);
            L.control.zoom({ position: 'topright' }).addTo(map);
            mapInstance.current = map;
        }

        if (mapInstance.current) {
            const map = mapInstance.current;
            // Clear existing layers
            map.eachLayer((layer: any) => {
                if (!(layer as any)._url) map.removeLayer(layer); // Keep tiles, remove markers/vectors
            });

            // 1. Draw Target Zone (if selected)
            if (smartZoneId) {
                 const zone = MOCK_ZONES.find(z => z.id === smartZoneId);
                 if (zone) {
                    // Zone Circle
                    L.circle([zone.lat, zone.lng], {
                        color: '#3b82f6',
                        fillColor: '#3b82f6',
                        fillOpacity: 0.1,
                        radius: zone.radius * 1000
                    }).addTo(map);

                    // Zone Center
                    const targetIcon = L.divIcon({
                        html: `<div class="relative flex items-center justify-center">
                                <div class="absolute w-4 h-4 bg-orange-600 rounded-full animate-ping"></div>
                                <div class="relative w-3 h-3 bg-orange-600 rounded-full border border-white shadow-sm"></div>
                            </div>`,
                        className: 'bg-transparent border-none',
                        iconSize: [24, 24],
                        iconAnchor: [12, 12]
                    });
                    L.marker([zone.lat, zone.lng], { icon: targetIcon, zIndexOffset: 1000 })
                        .addTo(map)
                        .bindPopup(`<b>Zone: ${zone.name}</b>`);
                 }
            }

            // 2. Draw Housing Markers
            const bounds = L.latLngBounds([]);

            housings.forEach((h: any) => {
                const iconHtml = `<div class="w-8 h-8 bg-white dark:bg-[var(--bg-card-solid)] rounded-full border-2 border-white flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer text-sm relative">
                                    🏠
                                    ${h._matchLabel ? `<span class="absolute -top-2 -right-2 w-3 h-3 rounded-full ${h._matchColor}"></span>` : ''}
                                  </div>`;
                const icon = L.divIcon({ html: iconHtml, className: 'bg-transparent', iconSize: [32, 32], iconAnchor: [16, 16] });

                const marker = L.marker([h.lat, h.lng], { icon }).addTo(map);

                marker.on('click', () => onSelectHousing(h));

                bounds.extend([h.lat, h.lng]);
            });

            if (bounds.isValid()) {
                 map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
            } else {
                 map.setView([46.6, 2.5], 6);
            }

            setTimeout(() => map.invalidateSize(), 100);
        }
    }, [housings, smartZoneId, onSelectHousing]);

    return (
        <div className="h-[600px] w-full rounded-2xl overflow-hidden border border-[var(--border-subtle)] shadow-sm relative animate-fade-in">
            <div ref={mapRef} className="h-full w-full z-0"></div>
        </div>
    );
};
