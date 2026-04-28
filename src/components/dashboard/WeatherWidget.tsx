import React, { useMemo } from 'react';
import { Cloud, Sun, TrendingUp } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartTooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, ChartTooltip);

interface CompactWeatherWidgetProps {
  avgTemp: number;
  condition: string;
  walkingScore: 'Excellente' | 'Bonne' | 'Difficile' | 'Extreme';
  hourlyTemperatures?: number[];
  hourlyTimes?: string[];
  dailyTempMax?: number[];
}

export const CompactWeatherWidget: React.FC<CompactWeatherWidgetProps> = ({
  avgTemp,
  condition,
  walkingScore,
  hourlyTemperatures,
  hourlyTimes,
  dailyTempMax,
}) => {
  const tempDelta = useMemo<number | null>(() => {
    if (!dailyTempMax || dailyTempMax.length < 2) return null;
    const today = dailyTempMax[0];
    const previous = dailyTempMax[1];
    if (typeof today !== 'number' || typeof previous !== 'number') return null;
    if (Number.isNaN(today) || Number.isNaN(previous)) return null;
    return Math.round(today - previous);
  }, [dailyTempMax]);

  // Only show the chart when we actually have ≥24h of real hourly data.
  // Previously we fabricated synthetic offsets from avgTemp when the API was
  // missing — that produced a believable-but-fake curve, which is worse than
  // showing nothing.
  const chartData = useMemo(() => {
    if (
      !hourlyTemperatures ||
      !hourlyTimes ||
      hourlyTemperatures.length < 24 ||
      hourlyTimes.length < 24
    ) {
      return null;
    }
    const labels: string[] = [];
    const dataPoints: number[] = [];
    for (let i = 0; i < 24; i += 4) {
      const date = new Date(hourlyTimes[i]);
      labels.push(`${date.getHours()}h`);
      dataPoints.push(hourlyTemperatures[i]);
    }
    return {
      labels,
      datasets: [
        {
          label: 'Temp (°C)',
          data: dataPoints,
          borderColor: '#fb923c',
          borderWidth: 2,
          backgroundColor: 'rgba(251, 146, 60, 0.2)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
      ],
    };
  }, [hourlyTemperatures, hourlyTimes]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true, mode: 'index' as const, intersect: false },
      },
      scales: {
        x: { display: false },
        y: { display: false, min: avgTemp - 10, max: avgTemp + 10 },
      },
      interaction: {
        mode: 'nearest' as const,
        axis: 'x' as const,
        intersect: false,
      },
    }),
    [avgTemp],
  );

  return (
    <div className="glass-card p-4 flex justify-between relative overflow-hidden h-full gap-4">
      {/* Left: Stats */}
      <div className="flex flex-col justify-between z-10 flex-shrink-0">
        <div>
          <h4 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1">
            Meteo Moyenne
          </h4>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-[var(--text-primary)] leading-none">{avgTemp}°</span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[var(--text-secondary)]">{condition}</span>
              {tempDelta !== null && (
                <span className="text-[10px] text-[var(--text-muted)] font-medium flex items-center gap-1">
                  <TrendingUp size={10} /> {tempDelta >= 0 ? '+' : ''}{tempDelta}° vs Hier
                </span>
              )}
            </div>
          </div>
        </div>
        <div
          className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 shadow-sm w-fit
            ${
              walkingScore === 'Excellente'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                : walkingScore === 'Bonne'
                ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400'
                : walkingScore === 'Difficile'
                ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400'
                : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
            }`}
        >
          {walkingScore === 'Excellente' ? <Sun size={12} /> : <Cloud size={12} />}
          Marche : {walkingScore}
        </div>
      </div>

      {/* Right: Chart (only when real data is available) */}
      <div className="flex-grow relative min-w-[80px] h-full">
        {chartData ? (
          <>
            <div className="absolute top-0 right-0 text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase">
              24h
            </div>
            <div className="h-full w-full pt-2">
              <Line data={chartData} options={chartOptions} />
            </div>
          </>
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide text-center">
              Données indisponibles
            </span>
          </div>
        )}
      </div>

      {/* Background Icon Decoration */}
      <Sun className="absolute -bottom-6 -right-6 text-amber-400/10 pointer-events-none" size={100} />
    </div>
  );
};
