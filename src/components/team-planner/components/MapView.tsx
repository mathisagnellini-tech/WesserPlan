import React, { useMemo } from 'react';
import { BoardData, Column } from '../types';
import { MapPin, Users, Layers } from 'lucide-react';

interface MapViewProps {
    data: BoardData;
    alumni?: any;
    viewMode?: any;
}

// Approximate relative pin coordinates per major French city.
// Coordinates are normalized to the 0–100 viewBox used by the SVG below.
const cityCoords: Record<string, { x: number; y: number }> = {
    'Paris': { x: 50, y: 25 },
    'Lyon': { x: 65, y: 60 },
    'Marseille': { x: 68, y: 85 },
    'Bordeaux': { x: 30, y: 65 },
    'Lille': { x: 55, y: 10 },
    'Nantes': { x: 25, y: 45 },
    'Strasbourg': { x: 85, y: 25 },
    'Toulouse': { x: 45, y: 80 },
    'Nice': { x: 85, y: 80 },
    'Rennes': { x: 25, y: 35 },
    'Grenoble': { x: 70, y: 65 },
    'Dijon': { x: 65, y: 45 },
    'Angers': { x: 30, y: 40 },
    'Nîmes': { x: 60, y: 80 },
    'Clermont-Ferrand': { x: 55, y: 55 },
    'Le Mans': { x: 35, y: 35 },
    'Aix-en-Provence': { x: 70, y: 82 },
    'Brest': { x: 10, y: 30 },
    'Tours': { x: 40, y: 40 },
    'Amiens': { x: 50, y: 15 },
    'Annecy': { x: 75, y: 55 },
    'Limoges': { x: 45, y: 55 },
    'Metz': { x: 75, y: 20 },
    'Besançon': { x: 75, y: 40 },
};

// Slightly more detailed simplified outline of metropolitan France — 0–100 viewBox.
// Hits the major coastal landmarks (Channel, Atlantic, Mediterranean) and the
// eastern border so the silhouette is recognisable instead of a generic blob.
const FRANCE_PATH =
    'M44,5 L55,4 L62,8 L72,11 L84,17 L88,24 L91,31 L92,40 L91,49 L88,57 L91,62 L93,68 L92,75 L86,78 L78,82 L72,86 L65,90 L58,93 L52,94 L45,93 L38,90 L31,86 L24,80 L18,73 L13,64 L11,55 L11,46 L14,38 L19,30 L24,23 L31,17 L38,10 L44,5 Z';

export const MapView: React.FC<MapViewProps> = ({ data }) => {
    const columns = useMemo(() => Object.values(data.columns) as Column[], [data.columns]);

    // Stats for the floating overlay tile (top-right)
    const totalMissions = columns.length;
    const totalPeople = useMemo(
        () => columns.reduce((acc, c) => acc + c.cardIds.length, 0),
        [columns],
    );
    const distinctCities = useMemo(
        () => new Set(columns.map(c => c.missionData?.zone.name).filter(Boolean)).size,
        [columns],
    );

    return (
        <div className="app-surface relative flex-1 h-full w-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
            {/* Subtle grid background — uses Tailwind dark variant, not inline-style classList check */}
            <div
                className="absolute inset-0 pointer-events-none [background-image:linear-gradient(rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.06)_1px,transparent_1px)] dark:[background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:48px_48px]"
            />

            {/* Soft accent radial behind the silhouette */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage:
                        'radial-gradient(60% 60% at 50% 45%, rgba(255, 91, 43, 0.10), transparent 70%)',
                }}
            />

            {/* France silhouette — full-bleed, with stroke so it reads at large size */}
            <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
                aria-hidden="true"
            >
                <path
                    d={FRANCE_PATH}
                    className="fill-slate-200/60 stroke-slate-300 dark:fill-slate-800/40 dark:stroke-slate-700"
                    strokeWidth={0.4}
                    strokeLinejoin="round"
                />
            </svg>

            {/* Pins — same coordinate system as the SVG */}
            <div className="absolute inset-0">
                {columns.map((col) => {
                    const city = col.missionData?.zone.name || 'Paris';
                    const baseCoords = cityCoords[city] || { x: 50, y: 50 };

                    // Deterministic jitter so coincident cities don't stack on a single pixel.
                    const jitterX = (col.id.charCodeAt(col.id.length - 1) % 5) - 2.5;
                    const jitterY = (col.id.charCodeAt(col.id.length - 2) % 5) - 2.5;

                    const x = Math.max(5, Math.min(95, baseCoords.x + jitterX));
                    const y = Math.max(5, Math.min(95, baseCoords.y + jitterY));

                    return (
                        <div
                            key={col.id}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10 hover:z-50"
                            style={{ left: `${x}%`, top: `${y}%` }}
                        >
                            {/* Pin marker */}
                            <div
                                className={`num w-7 h-7 rounded-full ${col.color} ring-4 ring-white dark:ring-slate-900 shadow-lg flex items-center justify-center text-[11px] font-medium text-white tracking-tight group-hover:scale-110 transition-transform duration-200`}
                            >
                                {col.cardIds.length}
                            </div>

                            {/* Pulse */}
                            <div className={`absolute inset-0 rounded-full ${col.color} opacity-30 animate-ping -z-10`} />

                            {/* Tooltip */}
                            <div className="modal-shell absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none min-w-[160px] translate-y-2 group-hover:translate-y-0">
                                <div className="display text-slate-800 dark:text-white text-[15px] leading-tight tracking-tight mb-0.5">
                                    {col.title}
                                </div>
                                <div className="num eyebrow leading-none flex items-center gap-1">
                                    <MapPin size={10} strokeWidth={2.4} /> {city}
                                </div>
                                <div className="mt-2 flex items-center gap-1">
                                    {col.cardIds.slice(0, 3).map((_, i) => (
                                        <div key={i} className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 border border-white dark:border-slate-800" />
                                    ))}
                                    {col.cardIds.length > 3 && (
                                        <span className="num text-[10px] text-slate-400 dark:text-slate-500 tracking-tight">
                                            +{col.cardIds.length - 3}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Title overlay (top-left) */}
            <div className="map-overlay-card absolute top-4 left-4 md:top-6 md:left-6 px-4 py-3 rounded-2xl flex items-center gap-3 z-[5]">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-orange-50 text-orange-600 ring-1 ring-orange-100 dark:bg-orange-500/15 dark:ring-orange-500/25">
                    <MapPin size={18} strokeWidth={2.2} />
                </div>
                <div className="leading-tight">
                    <p className="eyebrow leading-none">Déploiement national</p>
                    <h2 className="display text-slate-900 dark:text-white text-lg md:text-xl leading-tight">
                        Carte des missions
                    </h2>
                </div>
            </div>

            {/* Stats overlay (top-right) */}
            <div className="map-overlay-card absolute top-4 right-4 md:top-6 md:right-6 px-4 py-3 rounded-2xl flex items-center gap-4 z-[5]">
                <div className="flex flex-col items-start leading-tight">
                    <span className="num display text-slate-900 dark:text-white text-lg leading-none tracking-tight">
                        {totalMissions}
                    </span>
                    <span className="eyebrow leading-none mt-1 flex items-center gap-1">
                        <Layers size={10} strokeWidth={2.4} /> missions
                    </span>
                </div>
                <span className="w-px h-8 bg-[var(--border-subtle)]" />
                <div className="flex flex-col items-start leading-tight">
                    <span className="num display text-slate-900 dark:text-white text-lg leading-none tracking-tight">
                        {totalPeople}
                    </span>
                    <span className="eyebrow leading-none mt-1 flex items-center gap-1">
                        <Users size={10} strokeWidth={2.4} /> personnes
                    </span>
                </div>
                <span className="w-px h-8 bg-[var(--border-subtle)] hidden md:block" />
                <div className="hidden md:flex flex-col items-start leading-tight">
                    <span className="num display text-slate-900 dark:text-white text-lg leading-none tracking-tight">
                        {distinctCities}
                    </span>
                    <span className="eyebrow leading-none mt-1 flex items-center gap-1">
                        <MapPin size={10} strokeWidth={2.4} /> villes
                    </span>
                </div>
            </div>

            {/* Empty state */}
            {columns.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="map-overlay-card px-5 py-4 rounded-2xl flex flex-col items-center gap-2 max-w-xs text-center">
                        <MapPin size={20} strokeWidth={2.2} className="text-orange-500" />
                        <p className="text-[13px] font-medium text-slate-700 dark:text-slate-200 tracking-tight">
                            Aucune mission cette semaine
                        </p>
                        <p className="eyebrow leading-tight">
                            Les pins apparaîtront ici dès qu’une équipe sera planifiée.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
