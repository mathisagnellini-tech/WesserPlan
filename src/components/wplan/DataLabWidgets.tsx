import React from 'react';
import { Clock, CloudRain, Fingerprint, Activity, UserPlus, Loader2 } from 'lucide-react';
import { useDepartmentWeather } from '@/hooks/useWeather';
import EmptyState from '@/components/ui/EmptyState';
import { Tooltip } from '@/components/ui/Tooltip';
import { DataSourceBadge } from '@/components/wplan/DataSourceBadge';

// Shared widget shell (white card, hover orange ring, corner ghost icon)
const widgetClass =
    'bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl p-5 border border-[var(--border-subtle)] shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_24px_-16px_rgba(15,23,42,0.06)] flex flex-col relative overflow-hidden group hover:border-orange-200 dark:hover:border-orange-500/30 transition';

const WidgetHeader: React.FC<{ title: string; cornerIcon?: React.ReactNode; badge?: React.ReactNode }> = ({
    title,
    cornerIcon,
    badge,
}) => (
    <>
        {cornerIcon && (
            <div className="absolute top-3 right-3 opacity-50 group-hover:opacity-100 transition-opacity">
                {cornerIcon}
            </div>
        )}
        <div className="flex items-center gap-2 mb-3 flex-wrap pr-7">
            <h4 className="eyebrow leading-none">{title}</h4>
            {badge}
        </div>
    </>
);

export const GoldenHourWidget: React.FC = () => {
    return (
        <Tooltip
            comingSoon
            content="L'horloge thermique sera calculée à partir des historiques de conversion par tranche horaire dès que l'endpoint /Quality/HourlyConversion sera disponible."
        >
            <div className={`${widgetClass} items-center justify-center`}>
                <WidgetHeader
                    title="Horloge thermique"
                    cornerIcon={<Clock size={16} strokeWidth={2.2} className="text-orange-400" />}
                    badge={<DataSourceBadge variant="comingSoon" />}
                />
                <div className="relative w-28 h-28 flex items-center justify-center mt-1">
                    <div className="absolute inset-0 rounded-full border-2 border-slate-200 dark:border-slate-700" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-400 border-r-amber-400 rotate-45" />
                    <div className="text-center z-10 leading-tight">
                        <p className="num display text-slate-900 dark:text-white text-[20px] tracking-tight">17h45</p>
                        <p className="text-[11px] font-medium text-slate-400">à</p>
                        <p className="num display text-slate-900 dark:text-white text-[20px] tracking-tight">19h15</p>
                    </div>
                </div>
                <p className="num text-center text-[11px] text-orange-600 dark:text-orange-300 mt-3 font-medium tracking-tight">
                    Pic de conversion · +24 %
                </p>
            </div>
        </Tooltip>
    );
};

interface WeatherCorrelatorWidgetProps {
    deptCode?: string;
}

export const WeatherCorrelatorWidget: React.FC<WeatherCorrelatorWidgetProps> = ({ deptCode }) => {
    if (!deptCode) {
        return (
            <div className={widgetClass}>
                <WidgetHeader
                    title="Weather correlator"
                    cornerIcon={<CloudRain size={16} strokeWidth={2.2} className="text-orange-400" />}
                />
                <EmptyState
                    title="Sélectionnez un département"
                    message="Cliquez sur un département de la carte pour voir la corrélation météo locale."
                />
            </div>
        );
    }
    const { data: weatherData, isLoading, error } = useDepartmentWeather(deptCode);

    const hasWeather =
        !!weatherData?.daily.precipitationSum &&
        weatherData.daily.precipitationSum.length >= 7;

    const barHeights = React.useMemo(() => {
        if (!hasWeather) return [];
        const precip = weatherData!.daily.precipitationSum.slice(0, 7);
        const maxPrecip = Math.max(...precip, 1);
        return precip.map((p) => Math.max(5, Math.round((p / maxPrecip) * 90)));
    }, [hasWeather, weatherData]);

    const dayLabels = React.useMemo(() => {
        if (!hasWeather || !weatherData?.daily.date || weatherData.daily.date.length < 7) return [];
        const shortDays = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
        return weatherData.daily.date.slice(0, 7).map((d) => shortDays[new Date(d).getDay()]);
    }, [hasWeather, weatherData]);

    const alertText = React.useMemo(() => {
        if (!hasWeather) return null;
        const maxPrecip = Math.max(...weatherData!.daily.precipitationSum.slice(0, 7));
        if (maxPrecip >= 3) return `Précipitations jusqu'à ${maxPrecip.toFixed(1)} mm prévues.`;
        if (maxPrecip > 0) return `Précipitations légères (max ${maxPrecip.toFixed(1)} mm).`;
        return 'Aucune précipitation prévue cette semaine.';
    }, [hasWeather, weatherData]);

    return (
        <div className={widgetClass}>
            <WidgetHeader
                title={`Weather correlator · dépt ${deptCode}`}
                cornerIcon={isLoading
                    ? <Loader2 size={16} strokeWidth={2.2} className="text-orange-400 animate-spin" />
                    : <CloudRain size={16} strokeWidth={2.2} className="text-orange-400" />}
            />
            {isLoading ? (
                <div className="flex-grow flex items-center justify-center h-32 mt-1 text-[12px] text-slate-500 dark:text-slate-400 tracking-tight">
                    Chargement…
                </div>
            ) : error ? (
                <div className="flex-grow flex flex-col items-center justify-center h-32 mt-1 text-center px-2">
                    <p className="text-[12px] font-medium text-red-600 dark:text-red-300 tracking-tight">Données météo indisponibles</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 tracking-tight">
                        Le service Open-Meteo n'a pas répondu pour ce département.
                    </p>
                </div>
            ) : !hasWeather ? (
                <div className="flex-grow flex flex-col items-center justify-center h-32 mt-1 text-center px-2">
                    <p className="text-[12px] font-medium text-slate-600 dark:text-slate-300 tracking-tight">Aucune donnée disponible</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 tracking-tight">
                        Le bulletin <span className="num">7</span> jours est vide pour ce département.
                    </p>
                </div>
            ) : (
                <>
                    <div className="flex-grow flex items-end gap-1 h-28 mt-1">
                        {barHeights.map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col justify-end gap-1 h-full group/bar">
                                <div style={{ height: `${100 - h}%` }} className="bg-orange-500/25 w-full rounded-t-sm" />
                                <div style={{ height: `${h}%` }} className="bg-amber-400/85 w-full rounded-t-sm" />
                            </div>
                        ))}
                    </div>
                    <div className="num flex justify-between text-[10px] text-slate-500 dark:text-slate-500 mt-2 font-mono tracking-tight">
                        {dayLabels.map((d, i) => <span key={i}>{d}</span>)}
                    </div>
                    {alertText && (
                        <p className="text-[12px] text-slate-700 dark:text-slate-300 mt-3 tracking-tight">
                            <span className="text-orange-600 dark:text-orange-300 font-medium">Alerte :</span> {alertText}
                        </p>
                    )}
                </>
            )}
        </div>
    );
};

export const GenomeWidget: React.FC = () => {
    return (
        <Tooltip
            comingSoon
            content="Le profil donateur idéal sera dérivé des cohortes de signatures par INSEE / âge / habitat dès que l'endpoint /Donors/PersonaCluster sera disponible."
        >
            <div className={widgetClass}>
                <WidgetHeader
                    title="Génome donateur (S42)"
                    cornerIcon={<Fingerprint size={16} strokeWidth={2.2} className="text-orange-400" />}
                    badge={<DataSourceBadge variant="comingSoon" />}
                />
                <div className="flex items-center gap-4 mt-1">
                    {/* Avatar — single warm orange ring (replaces the previous orange→purple AI gradient) */}
                    <div
                        className="w-14 h-14 rounded-full p-0.5 shadow-[0_8px_20px_-10px_rgba(255,91,43,0.4)]"
                        style={{ background: 'linear-gradient(135deg, #FF5B2B 0%, #C2410C 100%)' }}
                    >
                        <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
                            <UserPlus size={22} strokeWidth={2.2} className="text-slate-700 dark:text-white" />
                        </div>
                    </div>
                    <div className="space-y-1.5 leading-tight">
                        <div className="flex items-center gap-2">
                            <span className="num text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded tracking-tight">
                                AGE
                            </span>
                            <span className="num display text-slate-900 dark:text-white text-[16px] tracking-tight">42 ans</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="num text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded tracking-tight">
                                REV
                            </span>
                            <span className="num text-[13px] font-medium text-emerald-600 dark:text-emerald-300 tracking-tight">
                                32 k€ / an
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="num text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded tracking-tight">
                                HAB
                            </span>
                            <span className="text-[12px] font-medium text-slate-700 dark:text-slate-300 tracking-tight">
                                Maison indiv.
                            </span>
                        </div>
                    </div>
                </div>
                <div className="mt-4 w-full bg-slate-100 dark:bg-slate-700/50 h-1 rounded-full overflow-hidden">
                    {/* Solid orange instead of orange→purple AI gradient */}
                    <div className="bg-orange-500 w-[75%] h-full" />
                </div>
                <p className="num text-[11px] text-right text-slate-500 dark:text-slate-400 mt-1 tracking-tight">
                    Match index · 94 %
                </p>
            </div>
        </Tooltip>
    );
};

export const SeismographWidget: React.FC = () => {
    return (
        <Tooltip
            comingSoon
            content="Le sismographe d'objections analysera les commentaires terrain (mairies + tournées) dès que la classification NLP sera branchée — endpoint /Quality/ObjectionsCluster."
        >
            <div className={widgetClass}>
                <WidgetHeader
                    title="Sismographe d'objections"
                    cornerIcon={<Activity size={16} strokeWidth={2.2} className="text-red-500 dark:text-red-400" />}
                    badge={<DataSourceBadge variant="comingSoon" />}
                />
                <div className="flex flex-wrap gap-2 items-center justify-center h-full content-center">
                    <span className="display text-slate-900 dark:text-white text-[20px] tracking-tight animate-pulse">Pouvoir d'achat</span>
                    <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400 tracking-tight">Pas le temps</span>
                    <span className="text-[14px] font-medium text-slate-700 dark:text-slate-300 tracking-tight">Déjà donateur</span>
                    <span className="text-[12px] font-medium text-slate-500 dark:text-slate-500 tracking-tight">Méfiance</span>
                    <span className="text-[15px] font-medium text-red-600 dark:text-red-300 tracking-tight">Scandale</span>
                </div>
            </div>
        </Tooltip>
    );
};
