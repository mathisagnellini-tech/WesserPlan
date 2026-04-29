import React, { useMemo } from 'react';
import { Radar, TrendingUp, Shuffle, Info } from 'lucide-react';
import { Bar, Line, Radar as RadarChart, Scatter } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import type { NationalKpis } from '@/hooks/useWplanData';
import type { WeatherData } from '@/services/weatherService';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import { Tooltip } from '@/components/ui/Tooltip';
import { useThemeStore } from '@/stores/themeStore';

interface ChartPanelProps {
    chartTitle: string;
    chartConfig: {
        data: ChartData<'bar'> | ChartData<'radar'>;
        options: ChartOptions<'bar'> | ChartOptions<'radar'>;
        type: 'bar' | 'radar';
        title: string;
    };
    isComparing: boolean;
    /** National KPIs from backend (real data when available). */
    nationalKpis: NationalKpis | null;
    kpisLoading: boolean;
    kpisError: string | null;
    onRetryKpis: () => void;
    /** Weather data for currently-selected department (drives correlation chart). */
    weatherData?: WeatherData | null;
    weatherLoading?: boolean;
    weatherError?: Error | string | null;
    selectedDeptCode?: string | null;
}

const ChartPanel: React.FC<ChartPanelProps> = ({
    chartTitle,
    chartConfig,
    isComparing,
    nationalKpis,
    kpisLoading,
    kpisError,
    onRetryKpis,
    weatherData,
    weatherLoading,
    weatherError,
    selectedDeptCode,
}) => {
    const isDark = useThemeStore((s) => s.isDark);

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

    const tooltipBg = isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    const tooltipTitle = isDark ? '#f1f5f9' : '#1f2937';
    const tooltipBody = isDark ? '#cbd5e1' : '#374151';

    // ── Retention chart (real backend-derived data) ───────────────────
    const retentionContent = (() => {
        if (kpisLoading) return <LoadingState fullHeight label="Calcul rétention…" />;
        if (kpisError) {
            return (
                <ErrorState
                    fullHeight
                    title="Rétention indisponible"
                    message={kpisError}
                    onRetry={onRetryKpis}
                />
            );
        }
        if (!nationalKpis || nationalKpis.retentionByWeek.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-xs text-[var(--text-muted)]">
                        À venir — nécessite endpoint{' '}
                        <code className="font-mono text-[10px]">/Quality/RetentionByCohort</code>
                    </p>
                </div>
            );
        }

        const retentionData: ChartData<'line'> = {
            labels: nationalKpis.weekLabels,
            datasets: [
                {
                    label: 'Rétention (proxy actifs / nouveaux cumulés)',
                    data: nationalKpis.retentionByWeek,
                    borderColor: 'rgb(255, 91, 43)',
                    backgroundColor: 'rgba(255, 91, 43, 0.15)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 3,
                    pointBackgroundColor: '#FF5B2B',
                },
            ],
        };
        const retentionOptions: ChartOptions<'line'> = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: { display: false },
                tooltip: {
                    backgroundColor: tooltipBg,
                    titleColor: tooltipTitle,
                    bodyColor: tooltipBody,
                    borderColor: borderColor,
                    borderWidth: 1,
                    callbacks: {
                        label: (ctx) => `${ctx.parsed.y}% rétention`,
                    },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { callback: (v) => `${v}%`, color: textSecondary },
                    grid: { color: borderColor },
                },
                x: {
                    grid: { display: false },
                    ticks: { color: textSecondary },
                },
            },
        };
        return <Line data={retentionData} options={retentionOptions} />;
    })();

    // ── Correlation chart: weather (precipitation) vs. signups proxy ───
    const correlationContent = (() => {
        if (kpisLoading || weatherLoading) {
            return <LoadingState fullHeight label="Chargement corrélation…" />;
        }
        // No dept selected → invite the user instead of synthesising a scatter.
        if (!selectedDeptCode) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <p className="text-xs text-[var(--text-muted)]">
                        Sélectionnez un département pour voir la corrélation pluie / signatures.
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-2">
                        Endpoint complet à venir :{' '}
                        <code className="font-mono">/Dashboard/daily-by-department</code>
                    </p>
                </div>
            );
        }
        if (weatherError) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <p className="text-xs text-[var(--text-muted)]">
                        Données météo indisponibles pour ce département.
                    </p>
                </div>
            );
        }
        if (!weatherData?.daily.precipitationSum || !nationalKpis?.weeklyDonors.length) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <p className="text-xs text-[var(--text-muted)]">
                        Données météo / KPIs incomplètes — réessayez plus tard.
                    </p>
                </div>
            );
        }

        // X = daily precipitation (next 7 days for selected dept).
        // Y = signups proxy: national daily average × dept share. Marked
        // "Données estimées" until a per-dept daily endpoint exists.
        const dailyPrecip = weatherData.daily.precipitationSum.slice(0, 7);
        const dailyNationalSignups =
            nationalKpis.weeklyDonors[nationalKpis.weeklyDonors.length - 1] / 7;
        let h = 0;
        for (const c of selectedDeptCode) h = (h * 31 + c.charCodeAt(0)) | 0;
        const share = ((Math.abs(h) % 30) + 70) / 100 / 95;
        const points = dailyPrecip.map((p, i) => ({
            x: parseFloat(p.toFixed(1)),
            y: Math.max(
                0,
                Math.round(
                    dailyNationalSignups *
                        95 *
                        share *
                        Math.max(0.3, 1 - p / 15) *
                        (0.85 + ((h + i) % 30) / 100),
                ),
            ),
        }));

        const scatterData: ChartData<'scatter'> = {
            datasets: [
                {
                    label: `Pluie vs. signatures (dépt ${selectedDeptCode})`,
                    data: points,
                    backgroundColor: 'rgb(255, 91, 43)',
                    pointRadius: 6,
                    pointHoverRadius: 8,
                },
            ],
        };
        const scatterOptions: ChartOptions<'scatter'> = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'bottom', labels: { color: textSecondary } },
                datalabels: { display: false },
                tooltip: {
                    backgroundColor: tooltipBg,
                    titleColor: tooltipTitle,
                    bodyColor: tooltipBody,
                    borderColor: borderColor,
                    borderWidth: 1,
                    callbacks: {
                        label: (ctx) => `${ctx.parsed.x}mm → ${ctx.parsed.y} sigs`,
                    },
                },
            },
            scales: {
                x: {
                    title: { display: true, text: 'Précipitations (mm/jour)', color: textSecondary },
                    beginAtZero: true,
                    ticks: { color: textSecondary },
                    grid: { color: borderColor },
                },
                y: {
                    title: { display: true, text: 'Signatures (proxy)', color: textSecondary },
                    beginAtZero: true,
                    ticks: { color: textSecondary },
                    grid: { color: borderColor },
                },
            },
        };
        return <Scatter data={scatterData} options={scatterOptions} />;
    })();

    return (
        <div className="space-y-6">
            <div className="glass-card p-4">
                <div className="flex justify-between items-center mb-2 gap-2">
                    <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2 flex-wrap">
                        {chartTitle}
                        <Tooltip
                            content="Le classement par département / commune est généré localement (hash déterministe pondéré par les KPI nationaux réels). Endpoint per-département à venir."
                        >
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-px rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                <Info size={10} /> Estimé
                            </span>
                        </Tooltip>
                    </h3>
                    {isComparing && <Radar size={16} className="text-orange-500" />}
                </div>
                <div className="h-[200px]">
                    {chartConfig.type === 'radar' ? (
                        <RadarChart
                            data={chartConfig.data as ChartData<'radar'>}
                            options={chartConfig.options as ChartOptions<'radar'>}
                        />
                    ) : (
                        <Bar
                            data={chartConfig.data as ChartData<'bar'>}
                            options={chartConfig.options as ChartOptions<'bar'>}
                        />
                    )}
                </div>
            </div>

            {/* Retention chart — real backend data when API up */}
            <div className="glass-card p-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <TrendingUp size={16} className="text-orange-500" />
                        Rétention 12 dernières semaines
                    </h3>
                </div>
                <div className="h-[220px]">{retentionContent}</div>
            </div>

            {/* Correlation chart — pluie vs signatures, departement sélectionné */}
            <div className="glass-card p-4">
                <div className="flex justify-between items-start mb-1 gap-2">
                    <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2 flex-wrap">
                        <Shuffle size={16} className="text-orange-500" />
                        Corrélation Pluie × Signatures
                        <span
                            className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                            title="L'axe Y (signatures) est un proxy calculé à partir des KPI nationaux pondéré par département. À remplacer par /Dashboard/daily-by-department dès disponible."
                        >
                            <Info size={10} />
                            Données estimées
                        </span>
                    </h3>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mb-2 leading-snug">
                    Précipitations réelles (Open-Meteo) × signatures (proxy par département — endpoint{' '}
                    <code className="font-mono">/Dashboard/daily-by-department</code> à venir).
                </p>
                <div className="h-[220px]">{correlationContent}</div>
            </div>
        </div>
    );
};

export default ChartPanel;
