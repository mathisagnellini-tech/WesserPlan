import React from 'react';
import { Clock, CloudRain, Fingerprint, Activity, UserPlus, Loader2 } from 'lucide-react';
import { useDepartmentWeather } from '@/hooks/useWeather';
import EmptyState from '@/components/ui/EmptyState';
import { Tooltip } from '@/components/ui/Tooltip';

// Placeholder widgets — kept in the UI per product decision to preview the
// shape of the future Data Lab. Each one wears a "Bientôt disponible" tooltip
// so users know the figures aren't real yet. Replace once the supporting
// endpoints/datasets exist.

export const GoldenHourWidget: React.FC = () => {
    return (
        <Tooltip
            comingSoon
            content="L'horloge thermique sera calculée à partir des historiques de conversion par tranche horaire dès que l'endpoint /Quality/HourlyConversion sera disponible."
        >
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700/50 flex flex-col items-center justify-center relative overflow-hidden group hover:border-orange-500/30 transition-all">
                <div className="absolute top-0 right-0 p-3 opacity-50 group-hover:opacity-100 transition-opacity">
                    <Clock size={20} className="text-orange-400" />
                </div>
                <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Horloge Thermique</h4>
                <div className="relative w-32 h-32 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-amber-400 border-r-amber-400 rotate-45 shadow-[0_0_15px_rgba(251,191,36,0.4)]"></div>
                    <div className="text-center z-10">
                        <p className="text-2xl font-black text-white">17h45</p>
                        <p className="text-xs font-bold text-slate-400">-</p>
                        <p className="text-2xl font-black text-white">19h15</p>
                    </div>
                </div>
                <p className="text-center text-xs text-orange-300 mt-3 font-medium">Pic de conversion (+24%)</p>
            </div>
        </Tooltip>
    );
};

interface WeatherCorrelatorWidgetProps {
    /** Department code to fetch weather for. Required — no silent fallback. */
    deptCode?: string;
}

export const WeatherCorrelatorWidget: React.FC<WeatherCorrelatorWidgetProps> = ({ deptCode }) => {
    if (!deptCode) {
        return (
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700/50 flex flex-col relative overflow-hidden group hover:border-orange-500/30 transition-all">
                <div className="absolute top-0 right-0 p-3 opacity-50">
                    <CloudRain size={20} className="text-orange-400" />
                </div>
                <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                    Weather-Correlator
                </h4>
                <EmptyState
                    title="Sélectionnez un département"
                    message="Cliquez sur un département de la carte pour voir la corrélation météo locale."
                />
            </div>
        );
    }
    const { data: weatherData, isLoading, error } = useDepartmentWeather(deptCode);

    const barHeights = React.useMemo(() => {
        if (weatherData?.daily.precipitationSum && weatherData.daily.precipitationSum.length >= 7) {
            const precip = weatherData.daily.precipitationSum.slice(0, 7);
            const maxPrecip = Math.max(...precip, 1);
            return precip.map((p) => Math.max(5, Math.round((p / maxPrecip) * 90)));
        }
        return [40, 60, 30, 80, 20, 90, 50];
    }, [weatherData]);

    const dayLabels = React.useMemo(() => {
        if (weatherData?.daily.date && weatherData.daily.date.length >= 7) {
            const shortDays = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
            return weatherData.daily.date.slice(0, 7).map((d) => shortDays[new Date(d).getDay()]);
        }
        return ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    }, [weatherData]);

    const alertText = React.useMemo(() => {
        if (error) return 'Données météo indisponibles.';
        if (weatherData?.daily.precipitationSum) {
            const maxPrecip = Math.max(...weatherData.daily.precipitationSum.slice(0, 7));
            if (maxPrecip >= 3) return `Alert: Précipitations jusqu'à ${maxPrecip.toFixed(1)}mm prévues.`;
            if (maxPrecip > 0) return `Précipitations légères (max ${maxPrecip.toFixed(1)}mm).`;
            return 'Aucune précipitation prévue cette semaine.';
        }
        return 'Chute de 40% dès 3mm de pluie/h.';
    }, [weatherData, error]);

    return (
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700/50 flex flex-col relative overflow-hidden group hover:border-orange-500/30 transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-50 group-hover:opacity-100 transition-opacity">
                {isLoading ? <Loader2 size={20} className="text-orange-400 animate-spin" /> : <CloudRain size={20} className="text-orange-400" />}
            </div>
            <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                Weather-Correlator
                <span className="ml-2 text-orange-400 normal-case">Dépt {deptCode}</span>
            </h4>
            <div className="flex-grow flex items-end gap-1 h-32 mt-2">
                {barHeights.map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end gap-1 h-full group/bar">
                        <div style={{ height: `${100 - h}%` }} className="bg-orange-500/30 w-full rounded-t-sm relative"></div>
                        <div style={{ height: `${h}%` }} className="bg-amber-400/80 w-full rounded-t-sm shadow-[0_0_10px_rgba(251,191,36,0.3)]"></div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono">
                {dayLabels.map((d, i) => (
                    <span key={i}>{d}</span>
                ))}
            </div>
            <p className="text-xs text-slate-300 mt-3">
                <span className="text-red-400 font-bold">{error ? 'Erreur:' : 'Alert:'}</span> {alertText}
            </p>
        </div>
    );
};

export const GenomeWidget: React.FC = () => {
    return (
        <Tooltip
            comingSoon
            content="Le profil donateur idéal sera dérivé des cohortes de signatures par INSEE / âge / habitat dès que l'endpoint /Donors/PersonaCluster sera disponible."
        >
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700/50 flex flex-col relative overflow-hidden group hover:border-orange-500/30 transition-all">
                <div className="absolute top-0 right-0 p-3 opacity-50 group-hover:opacity-100 transition-opacity">
                    <Fingerprint size={20} className="text-orange-400" />
                </div>
                <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Génome Donateur (S42)</h4>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-purple-600 p-0.5 shadow-lg shadow-purple-500/20">
                        <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                            <UserPlus size={28} className="text-white" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">AGE</span>
                            <span className="text-lg font-black text-white">42 ans</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">REV</span>
                            <span className="text-sm font-bold text-green-400">32k€ / an</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">HAB</span>
                            <span className="text-sm font-medium text-slate-300">Maison Indiv.</span>
                        </div>
                    </div>
                </div>
                <div className="mt-4 w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-400 to-purple-500 w-[75%] h-full"></div>
                </div>
                <p className="text-[10px] text-right text-slate-500 mt-1 font-mono">Match Index: 94%</p>
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
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700/50 flex flex-col relative overflow-hidden group hover:border-orange-500/30 transition-all">
                <div className="absolute top-0 right-0 p-3 opacity-50 group-hover:opacity-100 transition-opacity">
                    <Activity size={20} className="text-red-400" />
                </div>
                <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Sismographe Objections</h4>
                <div className="flex flex-wrap gap-2 items-center justify-center h-full content-center">
                    <span className="text-2xl font-black text-white animate-pulse">POUVOIR D'ACHAT</span>
                    <span className="text-sm font-bold text-slate-500">Pas le temps</span>
                    <span className="text-base font-bold text-slate-400">Déjà donateur</span>
                    <span className="text-xs font-medium text-slate-600">Méfiance</span>
                    <span className="text-lg font-bold text-red-400">SCANDALE</span>
                </div>
            </div>
        </Tooltip>
    );
};
