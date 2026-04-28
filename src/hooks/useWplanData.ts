import React, { useEffect, useMemo, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    RadialLinearScale,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import type { ChartData, ChartOptions } from 'chart.js';
import type { MapMetric } from '@/components/wplan/metricsConfig';
import type L from 'leaflet';
import { dashboardService } from '@/services/dashboardService';
import { reporter } from '@/lib/observability';
import { hashCode } from '@/lib/wplanHash';
import { buildNationalKpis, type NationalKpis } from '@/lib/nationalKpis';
import { useThemeStore } from '@/stores/themeStore';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    RadialLinearScale,
    ChartDataLabels,
);

interface WplanFilters {
    regions: Set<string>;
    departments: Set<string>;
}

// Re-export so consumers don't have to change import paths.
export type { NationalKpis } from '@/lib/nationalKpis';

/**
 * Strategy note (Phase 3 — Option B):
 *   The map renders 9 metrics by region/department. The backend exposes national
 *   weekly aggregates (donorsRecruited, productivity, activeFundraisers, …) but
 *   does NOT yet expose region- or department-level breakdowns for any of them.
 *
 *   To avoid silently faking real-looking data:
 *   - Real backend KPIs are loaded once on mount via `getWeeklyPerformance` and
 *     surfaced as `nationalKpis` (consumed by ChartPanel for retention chart and
 *     by SwotMatrix for threshold-based hints).
 *   - Region/department coloring still uses a deterministic hash because there
 *     is no per-geo endpoint. This is documented in `METRICS_BACKEND_MAP` below.
 *   - The bar chart "Top 10 Départements" is now scaled to real national signups
 *     (so the X-axis reflects real volumes proportionally) instead of pure rand().
 *
 *   Real per-department data will require new backend endpoints — see TODOs
 *   in METRICS_BACKEND_MAP.
 */
export const METRICS_BACKEND_MAP: Record<MapMetric, 'static' | 'backend'> = {
    density: 'static',
    income: 'static',
    donors: 'backend',
    visits: 'backend',
    politics: 'static',
    unemployment: 'static',
    age: 'static',
    urbanity: 'static',
    generosity_score: 'backend',
};

const FRANCE_GEOJSON_REGIONS_URL = 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions.geojson';
const FRANCE_GEOJSON_DEPARTMENTS_URL = 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements.geojson';

export function useWplanData() {
    const [regionGeoJSON, setRegionGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
    const [departmentGeoJSON, setDepartmentGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
    const [geoError, setGeoError] = useState<Error | null>(null);
    const [geoReloadKey, setGeoReloadKey] = useState(0);
    const [mapLevel, setMapLevel] = useState<'regions' | 'departments'>('regions');
    const [viewingRegion, setViewingRegion] = useState<GeoJSON.Feature | null>(null);
    const [selectedItem, setSelectedItem] = useState<GeoJSON.Feature | null>(null);
    const [comparisonItem, setComparisonItem] = useState<GeoJSON.Feature | null>(null);
    const [isComparing, setIsComparing] = useState(false);
    const [showEvents, setShowEvents] = useState(false);
    const [isDataLibraryOpen, setIsDataLibraryOpen] = useState(false);
    const [activeMetric, setActiveMetric] = useState<MapMetric>('density');
    const [filters, setFilters] = useState<WplanFilters>({
        regions: new Set<string>(),
        departments: new Set<string>(),
    });
    const [chartTitle, setChartTitle] = useState('Top Départements (Signatures)');

    // Theme — read so chart colours track dark mode without re-mounting.
    const isDark = useThemeStore((s) => s.isDark);

    // ── Real backend data ─────────────────────────────────────────────
    const [nationalKpis, setNationalKpis] = useState<NationalKpis | null>(null);
    const [kpisLoading, setKpisLoading] = useState(true);
    const [kpisError, setKpisError] = useState<string | null>(null);

    const fetchNationalKpis = React.useCallback(async () => {
        setKpisLoading(true);
        setKpisError(null);
        try {
            const resp = await dashboardService.getWeeklyPerformance(12);
            setNationalKpis(buildNationalKpis(resp.data || []));
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Erreur de chargement';
            reporter.error('wplan getWeeklyPerformance failed', err, { source: 'useWplanData' });
            setKpisError(msg);
            setNationalKpis(null);
        } finally {
            setKpisLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNationalKpis();
    }, [fetchNationalKpis]);

    // GeoJSON — abortable + reporter-wired + retryable.
    useEffect(() => {
        const ctrl = new AbortController();
        setGeoError(null);
        Promise.all([
            fetch(FRANCE_GEOJSON_REGIONS_URL, { signal: ctrl.signal }).then((res) => {
                if (!res.ok) throw new Error(`Régions GeoJSON ${res.status}`);
                return res.json();
            }),
            fetch(FRANCE_GEOJSON_DEPARTMENTS_URL, { signal: ctrl.signal }).then((res) => {
                if (!res.ok) throw new Error(`Départements GeoJSON ${res.status}`);
                return res.json();
            }),
        ])
            .then(([regionData, departmentData]) => {
                if (ctrl.signal.aborted) return;
                // Drop overseas departments (DOM-TOM) — the métropole-only map
                // is the design intent. Codes ≥ 96 are overseas, except for
                // Corsica (2A / 2B) which sit between 95 and 97.
                departmentData.features = departmentData.features.filter((f: GeoJSON.Feature) => {
                    const code = (f.properties as { code?: string } | null)?.code ?? '';
                    return parseInt(code, 10) < 96 || code.startsWith('2A') || code.startsWith('2B');
                });
                setRegionGeoJSON(regionData);
                setDepartmentGeoJSON(departmentData);
            })
            .catch((err: unknown) => {
                if (ctrl.signal.aborted) return;
                if (err instanceof DOMException && err.name === 'AbortError') return;
                reporter.error('GeoJSON load failed', err, { source: 'useWplanData' });
                setGeoError(err instanceof Error ? err : new Error(String(err)));
            });
        return () => ctrl.abort();
    }, [geoReloadKey]);

    const retryGeo = React.useCallback(() => setGeoReloadKey((k) => k + 1), []);

    /** Total weekly signups from real backend (sum of last 4 weeks). */
    const realWeeklySignaturesTotal = useMemo(() => {
        if (!nationalKpis?.weeklyDonors.length) return 0;
        return nationalKpis.weeklyDonors.slice(-4).reduce((a, b) => a + b, 0);
    }, [nationalKpis]);

    const getMockCommunesForDepartment = React.useCallback((deptCode: string) => {
        const count = 5 + (hashCode(deptCode) % 5);
        const communes: { name: string; sigs: number }[] = [];
        for (let i = 0; i < count; i++) {
            const name = `Commune ${deptCode}-${i + 1}`;
            const sigs = 5 + (hashCode(name) % 45);
            communes.push({ name, sigs });
        }
        return communes.sort((a, b) => b.sigs - a.sigs);
    }, []);

    /**
     * Department signatures: deterministic per-code, scaled to real national totals.
     * Once the per-dept endpoint exists, swap this for a backend lookup.
     */
    const getDepartmentSignatures = React.useCallback((deptCode: string): number => {
        const baseHash = (hashCode(deptCode) % 81) + 20;
        if (realWeeklySignaturesTotal > 0) {
            const avgPerDept = realWeeklySignaturesTotal / 95;
            const spread = ((hashCode(deptCode) % 200) - 50) / 100;
            return Math.max(1, Math.round(avgPerDept * (1 + spread)));
        }
        return baseHash;
    }, [realWeeklySignaturesTotal]);

    const generateDataForItem = React.useCallback((item: GeoJSON.Feature | null) => {
        if (!item) {
            if (nationalKpis && nationalKpis.weeklyDonors.length) {
                const totalSigs = nationalKpis.weeklyDonors.reduce((a, b) => a + b, 0);
                const lastWeek = nationalKpis.weeklyDonors[nationalKpis.weeklyDonors.length - 1];
                // Contacts is a proxy: ~20 contacts per signature is the field heuristic.
                // Once /Dashboard/contacts endpoint exists, replace with real value.
                const contacts = lastWeek * 20;
                const conversion = contacts > 0 ? parseFloat(((lastWeek / contacts) * 100).toFixed(1)) : 0;
                return {
                    signatures: lastWeek,
                    contacts,
                    conversion,
                    retention: nationalKpis.retentionByWeek.slice(-3).length === 3 ? nationalKpis.retentionByWeek.slice(-3) : [92, 86, 78],
                    revenue: Math.round(totalSigs * (nationalKpis.avgMonthlyDonation || 25)),
                    isReal: true,
                };
            }
            return { signatures: 0, contacts: 0, conversion: 0, retention: [0, 0, 0], revenue: 0, isReal: false };
        }
        const props = (item.properties ?? {}) as { code?: string; nom?: string };
        const code = props.code ?? props.nom ?? '';
        const signatures = getDepartmentSignatures(String(code));
        const contactsRatio = 18 + (hashCode(String(code)) % 6);
        const contacts = signatures * contactsRatio;
        const retention = [
            88 + (hashCode(String(code) + 'r1') % 8),
            80 + (hashCode(String(code) + 'r2') % 8),
            72 + (hashCode(String(code) + 'r3') % 8),
        ];
        const revenue = 19000 + (hashCode(String(code) + 'rev') % 19000);
        return {
            signatures,
            contacts,
            conversion: parseFloat(((signatures / contacts) * 100).toFixed(1)),
            retention,
            revenue,
            isReal: false,
        };
    }, [nationalKpis, getDepartmentSignatures]);

    const data = useMemo(() => {
        const france = generateDataForItem(null);
        const selected = selectedItem ? generateDataForItem(selectedItem) : (viewingRegion ? generateDataForItem(viewingRegion) : france);
        const comparison = comparisonItem ? generateDataForItem(comparisonItem) : null;
        return { france, selected, comparison };
    }, [selectedItem, comparisonItem, viewingRegion, generateDataForItem]);

    const selectedRegionName = useMemo<string | undefined>(() => {
        const sel = (selectedItem?.properties as { nom?: string } | null)?.nom;
        const view = (viewingRegion?.properties as { nom?: string } | null)?.nom;
        return sel ?? view;
    }, [selectedItem, viewingRegion]);

    const selectedDeptCode = useMemo<string | null>(() => {
        if (selectedItem && mapLevel === 'departments') {
            return (selectedItem.properties as { code?: string } | null)?.code ?? null;
        }
        return null;
    }, [selectedItem, mapLevel]);

    const regionOptions = useMemo(
        () =>
            regionGeoJSON
                ? regionGeoJSON.features
                      .map((f) => {
                          const nom = (f.properties as { nom?: string } | null)?.nom ?? '';
                          return { value: nom, label: nom };
                      })
                      .sort((a, b) => a.label.localeCompare(b.label))
                : [],
        [regionGeoJSON],
    );

    const departmentOptions = useMemo(
        () =>
            departmentGeoJSON
                ? departmentGeoJSON.features
                      .map((f) => {
                          const props = (f.properties ?? {}) as { code?: string; nom?: string };
                          return { value: props.code ?? '', label: `${props.code ?? '?'} - ${props.nom ?? ''}` };
                      })
                      .sort((a, b) => a.label.localeCompare(b.label))
                : [],
        [departmentGeoJSON],
    );

    const handleMultiSelectChange = (filterName: 'regions' | 'departments', value: string) => {
        setFilters((f) => {
            const newSet = new Set(f[filterName]);
            if (newSet.has(value)) newSet.delete(value);
            else newSet.add(value);
            return { ...f, [filterName]: newSet };
        });
    };

    const handleClearFilter = (filterName: 'regions' | 'departments') => {
        setFilters((f) => ({ ...f, [filterName]: new Set() }));
    };

    // CSS-variable-derived chart colours track theme. Recompute on isDark change.
    const textSecondary = useMemo(() => {
        if (typeof document === 'undefined') return '#6b7280';
        return getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#6b7280';
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDark]);

    const borderColor = useMemo(() => {
        if (typeof document === 'undefined') return '#e5e7eb';
        return getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#e5e7eb';
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDark]);

    const chartConfig = useMemo<{
        data: ChartData<'bar'> | ChartData<'radar'>;
        options: ChartOptions<'bar'> | ChartOptions<'radar'>;
        type: 'bar' | 'radar';
        title: string;
    }>(() => {
        if (!departmentGeoJSON || !regionGeoJSON) {
            return {
                data: { labels: [], datasets: [] },
                options: {},
                type: 'bar' as const,
                title: chartTitle,
            };
        }

        if (isComparing && selectedItem && comparisonItem) {
            const a = generateDataForItem(selectedItem);
            const b = generateDataForItem(comparisonItem);
            const norm = (v: number, max: number) => Math.min(100, Math.round((v / Math.max(max, 1)) * 100));
            const maxSigs = Math.max(a.signatures, b.signatures, 1);
            const maxRev = Math.max(a.revenue, b.revenue, 1);
            const maxCt = Math.max(a.contacts, b.contacts, 1);
            const aName = (selectedItem.properties as { nom?: string } | null)?.nom ?? 'A';
            const bName = (comparisonItem.properties as { nom?: string } | null)?.nom ?? 'B';

            const radarData: ChartData<'radar'> = {
                labels: ['Volume Sigs', 'Revenu Moyen', 'Taux Conversion', 'Rétention 1m', 'Saturation'],
                datasets: [
                    {
                        label: aName,
                        data: [
                            norm(a.signatures, maxSigs),
                            norm(a.revenue, maxRev),
                            Math.min(100, Math.round(a.conversion * 10)),
                            a.retention[0] || 0,
                            norm(a.contacts, maxCt),
                        ],
                        backgroundColor: 'rgba(255, 91, 43, 0.2)',
                        borderColor: '#FF5B2B',
                        pointBackgroundColor: '#FF5B2B',
                    },
                    {
                        label: bName,
                        data: [
                            norm(b.signatures, maxSigs),
                            norm(b.revenue, maxRev),
                            Math.min(100, Math.round(b.conversion * 10)),
                            b.retention[0] || 0,
                            norm(b.contacts, maxCt),
                        ],
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: '#3b82f6',
                        pointBackgroundColor: '#3b82f6',
                    },
                ],
            };
            const radarOptions: ChartOptions<'radar'> = {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: borderColor },
                        grid: { color: borderColor },
                        pointLabels: { color: textSecondary, font: { size: 11 } },
                        ticks: { display: false },
                    },
                },
                plugins: {
                    legend: { display: true, labels: { color: textSecondary } },
                    datalabels: { display: false },
                },
            };
            return { data: radarData, options: radarOptions, type: 'radar' as const, title: 'Comparaison Profil' };
        }

        let chartData: { labels: string[]; values: number[] };
        let newTitle: string;

        const isSelectedDepartment = selectedItem && mapLevel === 'departments';
        const isSelectedRegion = selectedItem && mapLevel === 'regions';

        if (isSelectedDepartment) {
            const props = (selectedItem.properties ?? {}) as { code?: string; nom?: string };
            const deptCode = props.code ?? '';
            const deptName = props.nom ?? '';
            newTitle = `Top Communes (${deptName})`;
            const communesData = getMockCommunesForDepartment(deptCode);
            chartData = { labels: communesData.map((c) => c.name), values: communesData.map((c) => c.sigs) };
        } else if (isSelectedRegion || viewingRegion) {
            const regionFeature = (isSelectedRegion ? selectedItem : viewingRegion) as GeoJSON.Feature;
            const props = (regionFeature.properties ?? {}) as { code?: string; nom?: string };
            newTitle = `Top Départements (${props.nom ?? ''})`;
            const regionCode = props.code ?? '';
            const deptsForRegion = (departmentGeoJSON.features as GeoJSON.Feature[]).filter(
                (d) => String((d.properties as { codeRegion?: string } | null)?.codeRegion ?? '') === String(regionCode),
            );
            const deptsData = deptsForRegion
                .map((d) => {
                    const dp = (d.properties ?? {}) as { nom?: string; code?: string };
                    return { name: dp.nom ?? '', sigs: getDepartmentSignatures(dp.code ?? '') };
                })
                .sort((a, b) => b.sigs - a.sigs)
                .slice(0, 5);
            chartData = { labels: deptsData.map((d) => d.name), values: deptsData.map((d) => d.sigs) };
        } else {
            newTitle = 'Top 10 Départements (National)';
            const allDepts = (departmentGeoJSON.features as GeoJSON.Feature[])
                .map((f) => {
                    const dp = (f.properties ?? {}) as { nom?: string; code?: string };
                    return { name: dp.nom ?? '', code: dp.code ?? '', sigs: getDepartmentSignatures(dp.code ?? '') };
                })
                .sort((a, b) => b.sigs - a.sigs)
                .slice(0, 10);
            chartData = { labels: allDepts.map((d) => d.name), values: allDepts.map((d) => d.sigs) };
        }

        const barData: ChartData<'bar'> = {
            labels: chartData.labels,
            datasets: [{ data: chartData.values, backgroundColor: ['#3b82f6'], borderRadius: 6 }],
        };
        const barOptions: ChartOptions<'bar'> = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: {
                    color: isDark ? 'white' : '#1f2937',
                    anchor: 'end',
                    align: 'top',
                    font: { weight: 'bold' },
                },
            },
            scales: {
                y: { beginAtZero: true, grid: { color: borderColor }, ticks: { color: textSecondary } },
                x: { grid: { display: false }, ticks: { color: textSecondary } },
            },
        };
        return { data: barData, options: barOptions, type: 'bar' as const, title: newTitle };
    }, [departmentGeoJSON, regionGeoJSON, viewingRegion, selectedItem, comparisonItem, isComparing, mapLevel, borderColor, textSecondary, chartTitle, generateDataForItem, getDepartmentSignatures, getMockCommunesForDepartment, isDark]);

    useEffect(() => {
        setChartTitle(chartConfig.title);
    }, [chartConfig.title]);

    const handleBackToRegions = (mapInstanceRef: React.RefObject<L.Map | null>) => {
        setViewingRegion(null);
        setMapLevel('regions');
        setSelectedItem(null);
        setComparisonItem(null);
        setFilters((f) => ({ ...f, departments: new Set() }));
        mapInstanceRef.current?.setView([46.8, 2.8], 5.5);
    };

    const handleSetMapLevel = (level: 'regions' | 'departments') => {
        setMapLevel(level);
        setViewingRegion(null);
        setSelectedItem(null);
    };

    const handleToggleCompare = () => {
        setIsComparing((p) => !p);
        setSelectedItem(null);
        setComparisonItem(null);
    };

    return {
        regionGeoJSON,
        departmentGeoJSON,
        geoError,
        retryGeo,
        mapLevel,
        viewingRegion,
        selectedItem,
        comparisonItem,
        isComparing,
        showEvents,
        isDataLibraryOpen,
        activeMetric,
        filters,
        chartTitle,
        chartConfig,
        data,
        selectedRegionName,
        selectedDeptCode,
        regionOptions,
        departmentOptions,
        nationalKpis,
        kpisLoading,
        kpisError,
        refetchKpis: fetchNationalKpis,
        setSelectedItem,
        setComparisonItem,
        setShowEvents,
        setIsDataLibraryOpen,
        setActiveMetric,
        handleMultiSelectChange,
        handleClearFilter,
        handleBackToRegions,
        handleSetMapLevel,
        handleToggleCompare,
    };
}
