import React, { useEffect, useState, useMemo } from 'react';
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

export function useWplanData() {
    const [regionGeoJSON, setRegionGeoJSON] = useState<any>(null);
    const [departmentGeoJSON, setDepartmentGeoJSON] = useState<any>(null);
    const [mapLevel, setMapLevel] = useState<'regions' | 'departments'>('regions');
    const [viewingRegion, setViewingRegion] = useState<any | null>(null);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [comparisonItem, setComparisonItem] = useState<any | null>(null);
    const [isComparing, setIsComparing] = useState(false);
    const [showEvents, setShowEvents] = useState(false);
    const [isDataLibraryOpen, setIsDataLibraryOpen] = useState(false);
    const [activeMetric, setActiveMetric] = useState<MapMetric>('density');
    const [filters, setFilters] = useState<WplanFilters>({
        regions: new Set<string>(),
        departments: new Set<string>(),
    });
    const [chartTitle, setChartTitle] = useState("Top Départements (Signatures)");

    // Data fetching
    useEffect(() => {
        Promise.all([
            fetch("https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions.geojson").then(res => res.json()),
            fetch("https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements.geojson").then(res => res.json())
        ]).then(([regionData, departmentData]) => {
            departmentData.features = departmentData.features.filter((f: any) =>
                parseInt(f.properties.code) < 96 || f.properties.code.startsWith('2A') || f.properties.code.startsWith('2B')
            );
            setRegionGeoJSON(regionData);
            setDepartmentGeoJSON(departmentData);
        });
    }, []);

    // Mock data helpers
    const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

    const getMockCommunesForDepartment = (deptCode: string) => {
        const hashCode = (str: string) => {
            let hash = 0;
            if (str.length === 0) return hash;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return hash;
        };
        const count = 5 + (Math.abs(hashCode(deptCode)) % 5);
        const communes = [];
        for (let i = 0; i < count; i++) {
            const name = `Commune ${deptCode}-${i + 1}`;
            const sigs = 5 + (Math.abs(hashCode(name)) % 45);
            communes.push({ name, sigs });
        }
        return communes.sort((a, b) => b.sigs - a.sigs);
    };

    const topRegionsData = useMemo(() => {
        if (!regionGeoJSON || !departmentGeoJSON) return [];
        const regionSigs: Record<string, number> = {};
        departmentGeoJSON.features.forEach((dept: any) => {
            const regionName = dept.properties.nomRegion;
            if (!regionSigs[regionName]) regionSigs[regionName] = 0;
            regionSigs[regionName] += rand(10, 80);
        });
        return Object.entries(regionSigs).map(([name, sigs]) => ({ name, sigs })).sort((a, b) => b.sigs - a.sigs).slice(0, 10);
    }, [regionGeoJSON, departmentGeoJSON]);

    const generateDataForItem = (item: any) => {
        if (!item) return { signatures: 412, contacts: 8420, conversion: 4.9, retention: [92, 86, 78], revenue: 27500 };
        const factor = item.properties.code ? (parseInt(item.properties.code.slice(0, 2)) / 95) : 0.5;
        const signatures = Math.floor(20 + factor * 100);
        const revenue = rand(19000, 38000);
        return {
            signatures,
            contacts: Math.floor(signatures * (18 + rand(0, 5))),
            conversion: parseFloat((signatures / (signatures * (18 + rand(0, 5))) * 100).toFixed(1)),
            retention: [rand(88, 95), rand(80, 87), rand(72, 79)],
            revenue,
        };
    };

    const data = useMemo(() => {
        const france = generateDataForItem(null);
        const selected = selectedItem ? generateDataForItem(selectedItem) : (viewingRegion ? generateDataForItem(viewingRegion) : france);
        const comparison = comparisonItem ? generateDataForItem(comparisonItem) : null;
        return { france, selected, comparison };
    }, [selectedItem, comparisonItem, viewingRegion]);

    const selectedRegionName = useMemo(() => selectedItem?.properties.nom || viewingRegion?.properties.nom, [selectedItem, viewingRegion]);

    // Filter options
    const regionOptions = useMemo(() =>
        regionGeoJSON
            ? regionGeoJSON.features.map((f: any) => ({ value: f.properties.nom, label: f.properties.nom })).sort((a: any, b: any) => a.label.localeCompare(b.label))
            : [],
        [regionGeoJSON]
    );

    const departmentOptions = useMemo(() =>
        departmentGeoJSON
            ? departmentGeoJSON.features.map((f: any) => ({ value: f.properties.code, label: `${f.properties.code} - ${f.properties.nom}` })).sort((a: any, b: any) => a.label.localeCompare(b.label))
            : [],
        [departmentGeoJSON]
    );

    const handleMultiSelectChange = (filterName: 'regions' | 'departments', value: string) => {
        setFilters(f => {
            const newSet = new Set(f[filterName]);
            if (newSet.has(value)) newSet.delete(value); else newSet.add(value);
            return { ...f, [filterName]: newSet };
        });
    };

    const handleClearFilter = (filterName: 'regions' | 'departments') => {
        setFilters(f => ({ ...f, [filterName]: new Set() }));
    };

    // Chart config
    const textSecondary = useMemo(() => {
        if (typeof document === 'undefined') return '#6b7280';
        return getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#6b7280';
    }, []);

    const borderColor = useMemo(() => {
        if (typeof document === 'undefined') return '#e5e7eb';
        return getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#e5e7eb';
    }, []);

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
            const radarData: ChartData<'radar'> = {
                labels: ['Volume Sigs', 'Revenu Moyen', 'Taux Conversion', 'Rétention 1m', 'Saturation'],
                datasets: [
                    {
                        label: selectedItem.properties.nom,
                        data: [85, 65, 90, 80, 40],
                        backgroundColor: 'rgba(255, 91, 43, 0.2)',
                        borderColor: '#FF5B2B',
                        pointBackgroundColor: '#FF5B2B',
                    },
                    {
                        label: comparisonItem.properties.nom,
                        data: [60, 85, 70, 60, 70],
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: '#3b82f6',
                        pointBackgroundColor: '#3b82f6',
                    }
                ]
            };
            const radarOptions: ChartOptions<'radar'> = {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: borderColor },
                        grid: { color: borderColor },
                        pointLabels: { color: textSecondary, font: { size: 11 } },
                        ticks: { display: false }
                    }
                },
                plugins: {
                    legend: { display: true, labels: { color: textSecondary } },
                    datalabels: { display: false }
                }
            };
            return { data: radarData, options: radarOptions, type: 'radar' as const, title: 'Comparaison Profil' };
        }

        // Bar chart scenarios
        let chartData: { labels: string[], values: number[] };
        let newTitle: string;

        const isSelectedDepartment = selectedItem && mapLevel === 'departments';
        const isSelectedRegion = selectedItem && mapLevel === 'regions';

        if (isSelectedDepartment) {
            const deptCode = selectedItem.properties.code;
            const deptName = selectedItem.properties.nom;
            newTitle = `Top Communes (${deptName})`;
            const communesData = getMockCommunesForDepartment(deptCode);
            chartData = { labels: communesData.map(c => c.name), values: communesData.map(c => c.sigs) };
        } else if (isSelectedRegion || viewingRegion) {
            const regionFeature = isSelectedRegion ? selectedItem : viewingRegion;
            newTitle = `Top Départements (${regionFeature.properties.nom})`;
            const regionCode = regionFeature.properties.code;
            const deptsForRegion = departmentGeoJSON.features.filter((d: any) => String(d.properties.codeRegion) === String(regionCode));
            const deptsData = deptsForRegion.map((d: any) => ({ name: d.properties.nom, sigs: rand(10, 80) })).sort((a: any, b: any) => b.sigs - a.sigs).slice(0, 5);
            chartData = { labels: deptsData.map((d: any) => d.name), values: deptsData.map((d: any) => d.sigs) };
        } else {
            newTitle = "Top 10 Départements (National)";
            const allDepts = departmentGeoJSON.features.map((f: any) => ({
                name: f.properties.nom,
                code: f.properties.code,
                sigs: rand(20, 100)
            })).sort((a: any, b: any) => b.sigs - a.sigs).slice(0, 10);
            chartData = { labels: allDepts.map((d: any) => d.name), values: allDepts.map((d: any) => d.sigs) };
        }

        const barData: ChartData<'bar'> = {
            labels: chartData.labels,
            datasets: [{ data: chartData.values, backgroundColor: ['#3b82f6'], borderRadius: 6 }]
        };
        const barOptions: ChartOptions<'bar'> = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: {
                    color: 'white',
                    anchor: 'end',
                    align: 'top',
                    font: { weight: 'bold' }
                }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: borderColor }, ticks: { color: textSecondary } },
                x: { grid: { display: false }, ticks: { color: textSecondary } }
            },
        };
        return { data: barData, options: barOptions, type: 'bar' as const, title: newTitle };
    }, [data.selected, departmentGeoJSON, regionGeoJSON, viewingRegion, selectedItem, comparisonItem, isComparing, topRegionsData, mapLevel, borderColor, textSecondary, chartTitle]);

    // Update chart title when config changes
    useEffect(() => {
        setChartTitle(chartConfig.title);
    }, [chartConfig.title]);

    const handleBackToRegions = (mapInstanceRef: React.RefObject<L.Map | null>) => {
        setViewingRegion(null);
        setMapLevel('regions');
        setSelectedItem(null);
        setComparisonItem(null);
        setFilters(f => ({ ...f, departments: new Set() }));
        mapInstanceRef.current?.setView([46.8, 2.8], 5.5);
    };

    const handleSetMapLevel = (level: 'regions' | 'departments') => {
        setMapLevel(level);
        setViewingRegion(null);
        setSelectedItem(null);
    };

    const handleToggleCompare = () => {
        setIsComparing(p => !p);
        setSelectedItem(null);
        setComparisonItem(null);
    };

    return {
        regionGeoJSON,
        departmentGeoJSON,
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
        regionOptions,
        departmentOptions,
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
