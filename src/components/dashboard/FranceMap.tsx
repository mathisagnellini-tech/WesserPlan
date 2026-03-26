import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// SVG Icons for map markers
const svgs = {
    wwf: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7h6V5a3 3 0 0 0-3-3Z"/><path d="M19 8a3 3 0 0 0-3 3v4h6v-4a3 3 0 0 0-3-3Z"/><path d="M5 8a3 3 0 0 0-3 3v4h6v-4a3 3 0 0 0-3-3Z"/><path d="M12 14a5 5 0 0 0-5 5v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2a5 5 0 0 0-5-5Z"/></svg>`,
    msf: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>`,
    mdm: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
    unicef: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 20.5a3.5 3.5 0 1 0-7 0 3.5 3.5 0 0 0 7 0Z"/><path d="M12 17v-3"/><path d="M8 10a4 4 0 0 1 8 0"/></svg>`
};

export interface TeamData {
    id: string;
    name: string;
    coords: [number, number];
    color: string;
    icon: string;
    leader: string;
    housing: string;
    car: string;
    weather: { t: number; c: string; icon: string };
}

export interface GlobalWeather {
    temp: number;
    condition: string;
    walking: 'Excellente' | 'Bonne' | 'Difficile' | 'Extreme';
}

export function generateTeamsData(): { teams: TeamData[]; weather: GlobalWeather } {
    const orgConfigs = [
        { id: 'wwf', color: '#16a34a', icon: svgs.wwf, name: 'WWF' },
        { id: 'msf', color: '#dc2626', icon: svgs.msf, name: 'MSF' },
        { id: 'mdm', color: '#1e3a8a', icon: svgs.mdm, name: 'MDM' },
        { id: 'unicef', color: '#38bdf8', icon: svgs.unicef, name: 'UNICEF' }
    ];

    const bounds = { latMin: 44.0, latMax: 49.0, lngMin: -0.5, lngMax: 6.5 };
    const leaders = ['Thomas', 'Sarah', 'Julie', 'Marc', 'Lucas', 'Emma', 'Hugo', 'Chloe'];
    const housingAddresses = [
        "12 Rue des Fleurs, Lyon", "5 Av. Jean Jaures, Strasbourg", "Gite du Lac, Annecy",
        "Appart'Hotel Centre, Nantes", "Camping des Pins, Bordeaux", "Maison Bleue, Lille",
        "Residence Etudiante, Toulouse", "Villa des Roses, Nice"
    ];
    const carPlates = [
        "GB-123-HZ", "AA-999-BB", "ET-404-OK", "XW-007-JB",
        "FY-555-RR", "KL-888-MP", "ZE-111-AZ", "PO-222-MN"
    ];
    const weathers = [
        { t: 18, c: "Ensoleille", icon: "sun" },
        { t: 14, c: "Nuageux", icon: "cloud" },
        { t: 9, c: "Pluvieux", icon: "rain" },
        { t: 22, c: "Grand Soleil", icon: "sunny" },
        { t: 11, c: "Vent", icon: "wind" }
    ];

    const teamsData: TeamData[] = [];

    orgConfigs.forEach((org, idx) => {
        for (let i = 0; i < 2; i++) {
            const w = weathers[Math.floor(Math.random() * weathers.length)];
            teamsData.push({
                id: `${org.id}-${i}`,
                name: `Equipe ${org.name} ${i + 1}`,
                coords: [
                    bounds.latMin + Math.random() * (bounds.latMax - bounds.latMin),
                    bounds.lngMin + Math.random() * (bounds.lngMax - bounds.lngMin)
                ],
                color: org.color,
                icon: org.icon,
                leader: leaders[(idx * 2 + i) % leaders.length],
                housing: housingAddresses[(idx * 2 + i) % housingAddresses.length],
                car: carPlates[(idx * 2 + i) % carPlates.length],
                weather: w
            });
        }
    });

    const avgTemp = Math.round(teamsData.reduce((acc, t) => acc + t.weather.t, 0) / teamsData.length);
    let walkCond: GlobalWeather['walking'] = 'Bonne';
    if (avgTemp > 25) walkCond = 'Difficile';
    else if (avgTemp < 5) walkCond = 'Extreme';
    else if (avgTemp >= 15 && avgTemp <= 22) walkCond = 'Excellente';

    const conditions = teamsData.map(t => t.weather.c);
    const domCond = conditions.sort((a, b) =>
        conditions.filter(v => v === a).length - conditions.filter(v => v === b).length
    ).pop() || '-';

    return {
        teams: teamsData,
        weather: { temp: avgTemp, condition: domCond, walking: walkCond }
    };
}

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
        .dark .wp-popup-weather-box { background: #1e293b !important; border-color: #334155 !important; }
        .dark .wp-popup-weather-label { color: var(--text-secondary) !important; }
        .dark .wp-popup-weather-temp { color: var(--text-primary) !important; }
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

            <div class="wp-popup-weather-box" style="background-color:#f8fafc; padding:10px; border-radius:10px; display:flex; align-items:center; justify-content:space-between; margin-top:4px; border:1px solid #e2e8f0;">
                <span class="wp-popup-weather-label" style="font-size:11px; font-weight:600; color:#475569;">Meteo locale</span>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="wp-popup-weather-temp" style="font-size:14px; font-weight:800; color:#1e293b;">${team.weather.t}°C</span>
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
