import React from 'react';
import { MapPin } from 'lucide-react';
import { METRICS_CONFIG } from '@/components/wplan/metricsConfig';
import type { MapMetric } from '@/components/wplan/metricsConfig';
import { Tooltip } from '@/components/ui/Tooltip';
import { DataSourceBadge } from '@/components/wplan/DataSourceBadge';
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
            <div className="flex flex-col gap-3 mb-3 border-b border-[var(--border-subtle)] pb-3">
                <div className="flex justify-between items-center gap-3">
                    <h3 className="display text-[var(--text-primary)] text-xl sm:text-2xl leading-tight tracking-tight flex items-center gap-2 flex-wrap">
                        {isComparing ? (
                            <>
                                <span className={selectedItem ? 'text-orange-600 dark:text-orange-300' : 'text-slate-400 dark:text-slate-500'}>
                                    {selectedItem ? (
                                        <>
                                            {selectedItem.properties.nom}
                                            {mapLevel === 'departments' && (
                                                <span className="num text-[14px] font-medium ml-1 opacity-70">
                                                    ({selectedItem.properties.code})
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        'Sélection 1'
                                    )}
                                </span>
                                <span className="num text-[11px] text-[var(--text-muted)] font-medium tracking-tight bg-slate-50 dark:bg-slate-800 border border-[var(--border-subtle)] px-2 py-0.5 rounded-md">
                                    vs
                                </span>
                                <span className={comparisonItem ? 'text-orange-600 dark:text-orange-300' : 'text-slate-400 dark:text-slate-500'}>
                                    {comparisonItem ? (
                                        <>
                                            {comparisonItem.properties.nom}
                                            {mapLevel === 'departments' && (
                                                <span className="num text-[14px] font-medium ml-1 opacity-70">
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
                                <MapPin className="text-orange-600" size={20} strokeWidth={2.2} />
                                {selectedItem ? (
                                    <>
                                        {selectedItem.properties.nom}
                                        {mapLevel === 'departments' && (
                                            <span className="num text-base text-[var(--text-secondary)] font-medium ml-2">
                                                ({selectedItem.properties.code})
                                            </span>
                                        )}
                                    </>
                                ) : viewingRegion ? (
                                    viewingRegion.properties.nom
                                ) : (
                                    'France entière'
                                )}
                            </>
                        )}
                    </h3>
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800 border border-[var(--border-subtle)] px-2.5 py-1.5 rounded-lg hover:border-orange-200 dark:hover:border-orange-500/30 transition shrink-0">
                        <span className="text-[var(--text-secondary)] text-[12px] font-medium tracking-tight">Évènements</span>
                        <input
                            type="checkbox"
                            checked={showEvents}
                            onChange={(e) => onShowEventsChange(e.target.checked)}
                            className="h-3.5 w-3.5 rounded accent-orange-600"
                        />
                    </label>
                </div>

                {/* Metric selector */}
                <div className="flex flex-wrap gap-1.5 pb-1">
                    {Object.entries(METRICS_CONFIG).map(([key, config]) => {
                        const metric = key as MapMetric;
                        const source = METRICS_BACKEND_MAP[metric];
                        const isPlaceholder = source === 'static' || source === 'backend';
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
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium tracking-tight whitespace-nowrap transition active:translate-y-[1px] border
                                    ${
                                        activeMetric === key
                                            ? 'bg-orange-50 text-orange-700 border-orange-200 ring-1 ring-orange-100 dark:bg-orange-500/15 dark:text-orange-200 dark:border-orange-500/30 dark:ring-orange-500/25'
                                            : 'bg-white dark:bg-[var(--bg-card-solid)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-orange-200 dark:hover:border-orange-500/30 hover:text-orange-700 dark:hover:text-orange-300'
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

                {/* Legend */}
                <div className="map-overlay-card absolute top-4 left-4 p-3 rounded-xl z-[500] min-w-[170px]">
                    <div className="flex items-center justify-between gap-2 mb-2 border-b border-[var(--border-subtle)] pb-1.5">
                        <h4 className="text-[12px] font-medium text-[var(--text-primary)] tracking-tight">
                            {METRICS_CONFIG[activeMetric].label}
                        </h4>
                        <DataSourceBadge
                            variant="synthetic"
                            title="Le découpage par région / département est généré localement (hash déterministe) — les chiffres ne sont pas issus d'un endpoint backend pour cette métrique."
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        {METRICS_CONFIG[activeMetric].colors.map((color, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <span
                                    className="w-3.5 h-3.5 rounded-md ring-1 ring-black/5 dark:ring-white/10"
                                    style={{ backgroundColor: color }}
                                />
                                <span className="text-[12px] text-[var(--text-secondary)] font-medium tracking-tight">
                                    {METRICS_CONFIG[activeMetric].labels[idx]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {isComparing && !selectedItem && !comparisonItem && (
                    <div className="map-overlay-card absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-[12px] font-medium tracking-tight text-[var(--text-primary)] z-[50] pointer-events-none">
                        Sélectionnez une première zone sur la carte
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapPanel;
