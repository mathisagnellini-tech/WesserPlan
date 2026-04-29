import React from 'react';
import { Info, MapPin } from 'lucide-react';
import { METRICS_CONFIG } from '@/components/wplan/metricsConfig';
import type { MapMetric } from '@/components/wplan/metricsConfig';
import { Tooltip } from '@/components/ui/Tooltip';
import { METRICS_BACKEND_MAP } from '@/hooks/useWplanData';

interface MapPanelProps {
    mapContainerRef: React.RefObject<HTMLDivElement | null>;
    regionGeoJSON: any;
    departmentGeoJSON: any;
    activeMetric: MapMetric;
    mapLevel: 'regions' | 'departments';
    selectedItem: any | null;
    comparisonItem: any | null;
    viewingRegion: any | null;
    isComparing: boolean;
    showEvents: boolean;
    onActiveMetricChange: (metric: MapMetric) => void;
    onShowEventsChange: (show: boolean) => void;
}

const MapPanel: React.FC<MapPanelProps> = ({
    mapContainerRef,
    regionGeoJSON,
    departmentGeoJSON,
    activeMetric,
    mapLevel,
    selectedItem,
    comparisonItem,
    viewingRegion,
    isComparing,
    showEvents,
    onActiveMetricChange,
    onShowEventsChange,
}) => {
    return (
        <div className="lg:col-span-2 glass-card p-4 flex flex-col">
            <div className="flex flex-col gap-4 mb-3 border-b border-[var(--border-subtle)] pb-3">
                <div className="flex justify-between items-center">
                    <h3 className="font-extrabold text-xl sm:text-2xl text-[var(--text-primary)] flex items-center gap-2 flex-wrap">
                        {isComparing ? (
                            <>
                                <span className={selectedItem ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-slate-500'}>
                                    {selectedItem ? (
                                        <>
                                            {selectedItem.properties.nom}
                                            {mapLevel === 'departments' && (
                                                <span className="text-base font-normal ml-1 opacity-75">
                                                    ({selectedItem.properties.code})
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        'Sélection 1'
                                    )}
                                </span>
                                <span className="text-sm text-[var(--text-muted)] font-bold uppercase bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                    VS
                                </span>
                                <span className={comparisonItem ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-slate-500'}>
                                    {comparisonItem ? (
                                        <>
                                            {comparisonItem.properties.nom}
                                            {mapLevel === 'departments' && (
                                                <span className="text-base font-normal ml-1 opacity-75">
                                                    ({comparisonItem.properties.code})
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        'Sélection 2'
                                    )}
                                </span>
                            </>
                        ) : (
                            <>
                                <MapPin className="text-orange-600" />
                                {selectedItem ? (
                                    <>
                                        {selectedItem.properties.nom}
                                        {mapLevel === 'departments' && (
                                            <span className="text-xl text-[var(--text-secondary)] font-normal ml-2">
                                                ({selectedItem.properties.code})
                                            </span>
                                        )}
                                    </>
                                ) : viewingRegion ? (
                                    viewingRegion.properties.nom
                                ) : (
                                    'France Entière'
                                )}
                            </>
                        )}
                    </h3>
                    <label className="flex items-center gap-2 text-sm cursor-pointer bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition h-[32px] border border-transparent">
                        <span className="text-[var(--text-secondary)] text-xs font-medium px-1">Events</span>
                        <input
                            type="checkbox"
                            checked={showEvents}
                            onChange={(e) => onShowEventsChange(e.target.checked)}
                            className="h-4 w-4 rounded accent-orange-500"
                        />
                    </label>
                </div>

                {/* METRIC SELECTOR — every metric is wrapped in a tooltip
                    explaining whether it draws on real backend data or
                    deterministic placeholders, so users never confuse the two. */}
                <div className="flex flex-wrap gap-2 pb-2">
                    {Object.entries(METRICS_CONFIG).map(([key, config]) => {
                        const metric = key as MapMetric;
                        const source = METRICS_BACKEND_MAP[metric];
                        const isPlaceholder = source === 'static' || source === 'backend';
                        // Both sources are currently rendered from a deterministic
                        // hash. Once a backend endpoint exists, swap METRICS_BACKEND_MAP
                        // entry to a different value to disable the disclaimer.
                        return (
                            <Tooltip
                                key={key}
                                comingSoon={isPlaceholder}
                                content={
                                    source === 'backend'
                                        ? "Endpoint backend prévu — affichage actuellement basé sur un hash déterministe pour préserver la lisibilité de la carte."
                                        : "Donnée statique INSEE / dataset public — aucune source backend dynamique n'est prévue côté Wesser."
                                }
                            >
                                <button
                                    type="button"
                                    onClick={() => onActiveMetricChange(metric)}
                                    aria-pressed={activeMetric === key}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border
                                    ${
                                        activeMetric === key
                                            ? 'bg-slate-800 dark:bg-orange-600 text-white border-slate-800 dark:border-orange-600 shadow-md transform scale-105'
                                            : 'bg-white dark:bg-[var(--bg-card-solid)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                                >
                                    {config.icon}
                                    {config.label}
                                </button>
                            </Tooltip>
                        );
                    })}
                </div>
            </div>

            <div className="relative flex-grow min-h-[350px] sm:min-h-[500px] rounded-xl overflow-hidden border border-[var(--border-subtle)] z-0">
                <div id="wplan-map" ref={mapContainerRef} className="absolute inset-0 bg-slate-100 dark:bg-slate-800"></div>
                {(!regionGeoJSON || !departmentGeoJSON) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 z-10 text-[var(--text-primary)]">
                        Chargement de la carte...
                    </div>
                )}

                {/* DYNAMIC LEGEND */}
                <div className="absolute top-4 left-4 bg-white/90 dark:bg-[var(--bg-card-solid)] backdrop-blur-sm p-3 rounded-xl border border-[var(--border-subtle)] shadow-lg z-[500] min-w-[160px]">
                    <div className="flex items-center justify-between gap-2 mb-2 border-b border-[var(--border-subtle)] pb-1">
                        <h4 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider">
                            {METRICS_CONFIG[activeMetric].label}
                        </h4>
                        <Tooltip
                            content="Le découpage par région / département est généré localement (hash déterministe) — les chiffres ne sont pas issus d'un endpoint backend pour cette métrique."
                        >
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-px rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                <Info size={10} /> Estimé
                            </span>
                        </Tooltip>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        {METRICS_CONFIG[activeMetric].colors.map((color, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <span
                                    className="w-4 h-4 rounded shadow-sm border border-black/5 dark:border-white/10"
                                    style={{ backgroundColor: color }}
                                ></span>
                                <span className="text-xs text-[var(--text-secondary)] font-medium">
                                    {METRICS_CONFIG[activeMetric].labels[idx]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {isComparing && !selectedItem && !comparisonItem && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-semibold z-[50] pointer-events-none">
                        Sélectionnez une première zone sur la carte
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapPanel;
