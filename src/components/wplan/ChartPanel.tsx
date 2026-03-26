import React from 'react';
import { Radar, TrendingUp, Shuffle } from 'lucide-react';
import { Bar, Radar as RadarChart } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';

interface ChartPanelProps {
    chartTitle: string;
    chartConfig: {
        data: ChartData<'bar'> | ChartData<'radar'>;
        options: ChartOptions<'bar'> | ChartOptions<'radar'>;
        type: 'bar' | 'radar';
        title: string;
    };
    isComparing: boolean;
}

const ChartPanel: React.FC<ChartPanelProps> = ({ chartTitle, chartConfig, isComparing }) => {
    return (
        <div className="space-y-6">
            <div className="glass-card p-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-[var(--text-primary)]">{chartTitle}</h3>
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
            {/* Placeholder for Retention Chart */}
            <div className="glass-card p-4 flex flex-col items-center justify-center h-[250px] bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-3">
                    <TrendingUp size={24} className="text-[var(--text-muted)]" />
                </div>
                <h3 className="font-semibold text-[var(--text-secondary)]">Chart possible</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">Emplacement réservé</p>
            </div>
            {/* Placeholder for Correlation Chart */}
            <div className="glass-card p-4 flex flex-col items-center justify-center h-[250px] bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-3">
                    <Shuffle size={24} className="text-[var(--text-muted)]" />
                </div>
                <h3 className="font-semibold text-[var(--text-secondary)]">Chart possible</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">Emplacement réservé</p>
            </div>
        </div>
    );
};

export default ChartPanel;
