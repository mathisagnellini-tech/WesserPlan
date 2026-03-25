import React from 'react';
import { BoardData, Column } from '../types';
import { MapPin } from 'lucide-react';

interface MapViewProps {
    data: BoardData;
    alumni?: any; // Add alumni prop to fix error if passed
    viewMode?: any; // Add viewMode prop
}

export const MapView: React.FC<MapViewProps> = ({ data }) => {
    // Mock coordinates for cities (approximate relative positions)
    const cityCoords: Record<string, { x: number, y: number }> = {
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
        'Besançon': { x: 75, y: 40 }
    };

    const columns = Object.values(data.columns) as Column[];

    return (
        <div className="flex-1 bg-slate-100 relative overflow-hidden flex items-center justify-center p-8 h-full">
            <div className="relative w-full max-w-5xl aspect-[1.4/1] bg-white rounded-3xl shadow-xl border border-slate-200 p-8 flex flex-col">
                <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
                    <MapPin className="text-orange-600" /> Carte des Missions
                </h2>
                
                {/* Map Container */}
                <div className="relative flex-1 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                     {/* Simplified France Map SVG Background */}
                     <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" preserveAspectRatio="none">
                        <path d="M45,95 L55,95 L65,85 L85,85 L90,75 L85,25 L75,15 L55,5 L45,5 L25,25 L15,35 L15,55 L25,75 L45,95 Z" fill="#64748b" />
                     </svg>
                     
                     {/* Grid Lines */}
                     <div className="absolute inset-0 pointer-events-none" 
                        style={{
                            backgroundImage: `linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)`,
                            backgroundSize: '40px 40px'
                        }}
                     />

                     {/* Pins */}
                     {columns.map((col, index) => {
                         const city = col.missionData?.zone.name || 'Paris';
                         // Default to center if city not found
                         const baseCoords = cityCoords[city] || { x: 50, y: 50 };
                         
                         // Add deterministic jitter based on column ID to avoid perfect overlap
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
                                 {/* Pin Marker */}
                                 <div className={`
                                    w-6 h-6 rounded-full ${col.color} ring-4 ring-white shadow-lg 
                                    flex items-center justify-center text-[10px] font-bold text-white
                                    group-hover:scale-125 transition-transform duration-300
                                 `}>
                                     {col.cardIds.length}
                                 </div>
                                 
                                 {/* Pulse Effect */}
                                 <div className={`absolute inset-0 rounded-full ${col.color} opacity-40 animate-ping -z-10`}></div>

                                 {/* Tooltip */}
                                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-white px-3 py-2 rounded-xl shadow-xl border border-slate-100 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none min-w-[140px] transform translate-y-2 group-hover:translate-y-0">
                                     <div className="text-xs font-black text-slate-800 uppercase tracking-tight mb-0.5">{col.title}</div>
                                     <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                         <MapPin size={10} /> {city}
                                     </div>
                                     <div className="mt-2 flex items-center gap-1">
                                         {col.cardIds.slice(0, 3).map((_, i) => (
                                             <div key={i} className="w-4 h-4 rounded-full bg-slate-200 border border-white"></div>
                                         ))}
                                         {col.cardIds.length > 3 && <span className="text-[9px] text-slate-400">+{col.cardIds.length - 3}</span>}
                                     </div>
                                     {/* Arrow */}
                                     <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white"></div>
                                 </div>
                             </div>
                         );
                     })}
                </div>
            </div>
        </div>
    );
};
