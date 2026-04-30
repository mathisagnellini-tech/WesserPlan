import React, { useMemo } from 'react';
import { Cluster } from './types';
import { MIN_1W } from './constants';
import { X, Clock, Users, AlertTriangle, Zap, Check, CloudSun, Loader2 } from 'lucide-react';
import { useWeather } from '@/hooks/useWeather';

interface ClusterDetailProps {
  selectedCluster: Cluster;
  isBonusMode: boolean;
  onToggleBonusMode: () => void;
  onClose: () => void;
  onPutBackToDraft: (id: string) => void;
  onDelete: (id: string) => void;
}

const ClusterDetail: React.FC<ClusterDetailProps> = ({
  selectedCluster,
  isBonusMode,
  onToggleBonusMode,
  onClose,
  onPutBackToDraft,
  onDelete,
}) => {
  const centroid = useMemo(() => {
    const communesWithCentroid = selectedCluster.communes.filter(c => c.centroid);
    if (communesWithCentroid.length === 0) return undefined;
    const avgLat = communesWithCentroid.reduce((sum, c) => sum + c.centroid![0], 0) / communesWithCentroid.length;
    const avgLng = communesWithCentroid.reduce((sum, c) => sum + c.centroid![1], 0) / communesWithCentroid.length;
    return { lat: avgLat, lng: avgLng };
  }, [selectedCluster.communes]);

  const { data: weatherData, isLoading: weatherLoading } = useWeather(centroid?.lat, centroid?.lng);
  const isLow = selectedCluster.totalPopulation < MIN_1W;

  return (
    <div className="app-surface fixed bottom-8 right-8 w-full max-w-lg z-[600] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] translate-x-0 opacity-100 scale-100">
      <div className="modal-shell flex flex-col">
        <div className="p-7 border-b border-[var(--border-subtle)] flex items-start justify-between gap-4 bg-white/40 dark:bg-slate-800/40">
          <div className="flex items-start gap-5 min-w-0">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white num display text-[26px] tracking-tight shadow-lg shrink-0"
              style={{ background: selectedCluster.color, boxShadow: `0 16px 32px -16px ${selectedCluster.color}88` }}
            >
              {selectedCluster.code}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="display text-slate-900 dark:text-white text-[28px] tracking-tight leading-none">
                  Zone {selectedCluster.code}
                </h2>
                <button
                  onClick={onToggleBonusMode}
                  className={`px-3 py-1 rounded-lg text-[11px] font-medium tracking-tight transition active:translate-y-[1px] flex items-center gap-1.5 border ${
                    isBonusMode
                      ? 'bg-orange-600 text-white border-orange-600 shadow-[0_8px_20px_-10px_rgba(255,91,43,0.7)]'
                      : selectedCluster.isBonus
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
                      : 'bg-white dark:bg-[var(--bg-card-solid)] text-slate-500 dark:text-slate-400 border-[var(--border-subtle)] hover:border-orange-200 hover:text-orange-700'
                  }`}
                >
                  {isBonusMode ? <Check size={11} strokeWidth={2.6} /> : <Zap size={11} strokeWidth={2.4} />}
                  {isBonusMode ? 'Sélection…' : 'Zone bonus'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`num text-[12px] font-medium tracking-tight flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${
                  isLow
                    ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/25'
                    : selectedCluster.isBonus
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/25'
                    : 'bg-slate-50 text-slate-500 border-[var(--border-subtle)]'
                }`}>
                  {isLow && <AlertTriangle size={11} className="text-red-500 animate-pulse" strokeWidth={2.4} />}
                  <Users size={11} strokeWidth={2.4} className={isLow ? 'text-red-400' : (selectedCluster.isBonus ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600')} />
                  {selectedCluster.totalPopulation.toLocaleString('fr-FR')} hab.
                </span>
                <span className="num text-[12px] font-medium text-white tracking-tight flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-md">
                  <Clock size={11} strokeWidth={2.4} className="text-slate-300" /> {selectedCluster.durationWeeks} sem.
                </span>
                {weatherLoading ? (
                  <span className="text-[12px] font-medium tracking-tight flex items-center gap-1.5 bg-orange-50 dark:bg-orange-500/15 text-orange-600 dark:text-orange-300 px-2.5 py-1 rounded-md border border-orange-100 dark:border-orange-500/25">
                    <Loader2 size={11} strokeWidth={2.4} className="animate-spin" />
                  </span>
                ) : weatherData ? (
                  <span
                    className="num text-[12px] font-medium tracking-tight flex items-center gap-1.5 bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 px-2.5 py-1 rounded-md border border-orange-100 dark:border-orange-500/25"
                    title={weatherData.current.condition}
                  >
                    <CloudSun size={11} strokeWidth={2.4} className="text-amber-500" />
                    {Math.round(weatherData.current.temperature)} °C
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="btn-ghost !p-2.5"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>

        <div className="p-6 bg-slate-50/30 dark:bg-slate-800/20 max-h-[40vh] overflow-y-auto custom-scrollbar">
          {selectedCluster.isBonus && (
            <div className="mb-5 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/25 rounded-2xl flex gap-3 items-center">
              <Zap size={18} strokeWidth={2.4} className="text-emerald-600 dark:text-emerald-300 shrink-0" />
              <div className="leading-tight">
                <p className="text-[13px] text-emerald-900 dark:text-emerald-200 font-medium tracking-tight">Zone optimisée (bonus)</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 tracking-tight">
                  Travail additionnel absorbé dans le planning initial.
                </p>
              </div>
            </div>
          )}
          {isLow && (
            <div className="mb-5 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/25 rounded-2xl flex gap-3 items-center">
              <AlertTriangle size={18} strokeWidth={2.4} className="text-red-600 dark:text-red-300 shrink-0" />
              <div className="leading-tight">
                <p className="text-[13px] text-red-900 dark:text-red-200 font-medium tracking-tight">Population insuffisante</p>
                <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5 tracking-tight">
                  Sous le seuil des <span className="num">{MIN_1W.toLocaleString('fr-FR')}</span> hab. Fusionnez ou complétez.
                </p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            {selectedCluster.communes.map(c => (
              <div
                key={c.id}
                className="p-3.5 bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-xl flex flex-col gap-1 shadow-sm hover:border-orange-200 dark:hover:border-orange-500/30 hover:-translate-y-[1px] transition"
              >
                <span className="text-[12px] font-medium text-slate-800 dark:text-slate-200 tracking-tight truncate">
                  {c.name}
                </span>
                <span className="num text-[11px] text-orange-600 dark:text-orange-300 tracking-tight">
                  {c.population.toLocaleString('fr-FR')} habitants
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-white/50 dark:bg-slate-800/40 border-t border-[var(--border-subtle)] flex justify-end gap-3">
          <button onClick={() => onPutBackToDraft(selectedCluster.id)} className="btn-secondary">
            Retirer
          </button>
          <button
            onClick={() => onDelete(selectedCluster.id)}
            className="btn-secondary !bg-red-50 !text-red-700 !border-red-100 hover:!border-red-200 dark:!bg-red-500/15 dark:!text-red-300 dark:!border-red-500/25"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClusterDetail;
