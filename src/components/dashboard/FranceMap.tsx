import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { TeamData, GlobalWeather } from '@/mocks/dashboardMocks';

export { generateTeamsData } from '@/mocks/dashboardMocks';
export type { TeamData, GlobalWeather } from '@/mocks/dashboardMocks';

function createDivIcon(team: TeamData): L.DivIcon {
    const pinHtml = `
        <div class="relative group cursor-pointer" style="transform: translateY(-20px);">
            <div style="background-color: ${team.color};" class="w-12 h-12 rounded-full border-4 border-white shadow-lg flex items-center justify-center relative z-20 group-hover:scale-110 transition-transform duration-200">
                 <div class="text-white">${team.icon}</div>
            </div>
            <div style="border-top-color: ${team.color};" class="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] absolute left-1/2 -translate-x-1/2 top-[40px] z-10"></div>
            <div class="w-8 h-2 bg-black/20 blur-sm rounded-full absolute left-1/2 -translate-x-1/2 top-[52px]"></div>
        </div>
    `;

    return L.divIcon({
        html: pinHtml,
        className: 'bg-transparent',
        iconSize: [48, 60],
        iconAnchor: [24, 60],
        popupAnchor: [0, -60]
    });
}

function buildPopupContent(team: TeamData): string {
    return `
      <style>
        .dark .leaflet-popup-content-wrapper { background: var(--bg-card-solid) !important; color: var(--text-primary) !important; }
        .dark .leaflet-popup-tip { background: var(--bg-card-solid) !important; }
        .dark .wp-popup-border { border-color: #334155 !important; }
        .dark .wp-popup-heading { color: var(--text-primary) !important; }
        .dark .wp-popup-sub { color: var(--text-secondary) !important; }
        .dark .wp-popup-label { color: var(--text-muted) !important; }
        .dark .wp-popup-value { color: var(--text-primary) !important; }
        .dark .wp-popup-icon-bg { background: #1e293b !important; color: var(--text-secondary) !important; }
        .dark .wp-popup-car-badge { background: #334155 !important; color: var(--text-primary) !important; }
      </style>
      <div style="font-family: 'Inter', sans-serif; min-width: 240px; padding: 4px;">
        <div class="wp-popup-border" style="display:flex; align-items:center; gap:10px; margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid #f1f5f9;">
            <div style="background:${team.color}; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                ${team.icon.replace('width="20"', 'width="18"').replace('height="20"', 'height="18"')}
            </div>
            <div>
                <h3 class="wp-popup-heading" style="font-weight: 800; margin:0; color: #1e293b; font-size:15px; letter-spacing: -0.02em;">${team.name}</h3>
                <span class="wp-popup-sub" style="font-size: 11px; color:#64748b; font-weight:600; text-transform:uppercase;">Lead: ${team.leader}</span>
            </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:12px;">
            <div style="display:flex; align-items:start; gap:10px;">
                <div class="wp-popup-icon-bg" style="background:#f1f5f9; padding:6px; border-radius:8px; color:#64748b;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                </div>
                <div style="flex:1;">
                    <p class="wp-popup-label" style="margin:0; font-size:10px; text-transform:uppercase; color:#94a3b8; font-weight:700; letter-spacing:0.5px;">Logement</p>
                    <p class="wp-popup-value" style="margin:2px 0 0 0; font-size:12px; font-weight:600; color:#334155; line-height:1.3;">${team.housing}</p>
                </div>
            </div>

            <div style="display:flex; align-items:start; gap:10px;">
                <div class="wp-popup-icon-bg" style="background:#f1f5f9; padding:6px; border-radius:8px; color:#64748b;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                </div>
                <div style="flex:1;">
                    <p class="wp-popup-label" style="margin:0; font-size:10px; text-transform:uppercase; color:#94a3b8; font-weight:700; letter-spacing:0.5px;">Vehicule</p>
                    <p class="wp-popup-car-badge" style="margin:2px 0 0 0; font-size:12px; font-weight:600; color:#334155; font-family:monospace; background:#e2e8f0; display:inline-block; padding:2px 6px; border-radius:4px;">${team.car}</p>
                </div>
            </div>
        </div>
      </div>
    `;
}

export const FranceMap: React.FC<{ teams: TeamData[] }> = ({ teams }) => {
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    const tileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    return (
        <MapContainer
            center={[46.603354, 1.888334]}
            zoom={6}
            zoomControl={false}
            attributionControl={false}
            className="h-full w-full rounded-2xl shadow-inner bg-slate-100 dark:bg-slate-800 z-0 relative"
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer url={tileUrl} />
            {teams.map((team) => (
                <Marker
                    key={team.id}
                    position={team.coords}
                    icon={createDivIcon(team)}
                >
                    <Popup>
                        <div dangerouslySetInnerHTML={{ __html: buildPopupContent(team) }} />
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};
