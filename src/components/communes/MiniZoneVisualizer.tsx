import React from 'react';

export const MiniZoneVisualizer: React.FC<{ points: {lat: number, lng: number}[] }> = ({ points }) => {
    if (!points || points.length === 0) return <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-lg"></div>;

    // Calculate bounds
    const lats = points.map(p => p.lat);
    const lngs = points.map(p => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Normalize and plot
    return (
        <div className="w-full h-24 bg-slate-100 dark:bg-slate-800 rounded-lg relative overflow-hidden border border-[var(--border-subtle)]">
            {points.map((p, idx) => {
                // Simple linear normalization to 10-90% range to keep padding
                const y = 90 - ((p.lat - minLat) / (maxLat - minLat || 1)) * 80; // Invert Y for CSS top
                const x = 10 + ((p.lng - minLng) / (maxLng - minLng || 1)) * 80;
                return (
                    <div
                        key={idx}
                        className="absolute w-1.5 h-1.5 bg-orange-500 rounded-full opacity-60"
                        style={{ top: `${y}%`, left: `${x}%` }}
                    />
                );
            })}
            <div className="absolute bottom-1 right-1 text-[8px] font-bold text-[var(--text-muted)] uppercase">Mini-Map</div>
        </div>
    );
};
