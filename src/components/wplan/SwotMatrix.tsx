import React from 'react';
import { Lightbulb, AlertTriangle, Ban, CheckCircle2, TrendingUp } from 'lucide-react';
import type { NationalKpis, IsRealFlags } from '@/hooks/useWplanData';
import { DataSourceBadge } from '@/components/wplan/DataSourceBadge';

interface SwotMatrixProps {
    regionName: string | undefined;
    nationalKpis?: NationalKpis | null;
    isRealFlags?: IsRealFlags;
}

const SwotMatrix: React.FC<SwotMatrixProps> = ({ regionName, nationalKpis, isRealFlags }) => {
    const selectionIsReal =
        !!isRealFlags &&
        isRealFlags.signatures &&
        isRealFlags.avgDonation &&
        isRealFlags.retention &&
        isRealFlags.revenue;
    const lastRetention = nationalKpis?.retentionByWeek?.[nationalKpis.retentionByWeek.length - 1];
    const productivity = nationalKpis?.productivity;
    const avgDonation = nationalKpis?.avgMonthlyDonation;

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (typeof lastRetention === 'number') {
        if (lastRetention >= 60) strengths.push(`Rétention élevée (${lastRetention.toFixed(0)} %)`);
        else if (lastRetention < 30) weaknesses.push(`Rétention faible (${lastRetention.toFixed(0)} %)`);
    }
    if (typeof productivity === 'number') {
        if (productivity >= 1.5) strengths.push(`Productivité solide (${productivity.toFixed(1)} sigs/h)`);
        else if (productivity < 0.8) weaknesses.push(`Productivité en recul (${productivity.toFixed(1)} sigs/h)`);
    }
    if (typeof avgDonation === 'number' && avgDonation >= 25) {
        strengths.push(`Don moyen ${avgDonation.toFixed(0)} € / mois`);
    }

    if (!strengths.length) {
        strengths.push('Forte conversion périurbaine', 'Anciens donateurs fidèles (+6 mois)', 'Image de marque positive locale');
    }
    if (!weaknesses.length) {
        weaknesses.push('Saturation centre-ville', 'Coût par acquisition élevé');
    }

    const hasEditorialContent = !nationalKpis || !selectionIsReal;

    const quadrant = (
        Icon: typeof CheckCircle2,
        label: string,
        items: string[],
        tone: 'emerald' | 'amber' | 'orange' | 'red',
    ) => {
        const toneClass = {
            emerald: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/25',
            amber: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/25',
            orange: 'bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/25',
            red: 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/25',
        }[tone];
        const iconColor = {
            emerald: 'text-emerald-600 dark:text-emerald-300',
            amber: 'text-amber-600 dark:text-amber-300',
            orange: 'text-orange-600 dark:text-orange-300',
            red: 'text-red-600 dark:text-red-300',
        }[tone];
        const textColor = {
            emerald: 'text-emerald-900 dark:text-emerald-200',
            amber: 'text-amber-900 dark:text-amber-200',
            orange: 'text-orange-900 dark:text-orange-200',
            red: 'text-red-900 dark:text-red-200',
        }[tone];
        return (
            <div className={`p-4 rounded-2xl border ${toneClass}`}>
                <h4 className={`text-[12px] font-medium tracking-tight mb-2.5 flex items-center gap-1.5 ${iconColor}`}>
                    <Icon size={12} strokeWidth={2.4} /> {label}
                </h4>
                <ul className={`text-[12px] leading-relaxed tracking-tight space-y-1 list-disc list-inside ${textColor}`}>
                    {items.map(s => <li key={s}>{s}</li>)}
                </ul>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 gap-5 mt-5 relative z-0">
            <div className="glass-card p-6 flex flex-col">
                <h3 className="display text-[var(--text-primary)] text-xl tracking-tight leading-tight mb-4 flex items-center gap-2 flex-wrap">
                    <Lightbulb className="text-amber-500" size={18} strokeWidth={2.2} />
                    Matrice SWOT · {regionName || 'France entière'}
                    {hasEditorialContent && (
                        <DataSourceBadge
                            variant="synthetic"
                            title="Opportunités / menaces sont des recommandations éditoriales statiques. Forces / faiblesses utilisent les KPI nationaux réels lorsqu'ils sont disponibles, sinon des valeurs par défaut."
                        />
                    )}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 flex-grow">
                    {quadrant(CheckCircle2, 'Forces', strengths, 'emerald')}
                    {quadrant(AlertTriangle, 'Faiblesses', weaknesses, 'amber')}
                    {quadrant(TrendingUp, 'Opportunités', ['Marchés de Noël (T4)', 'Nouvelles zones résidentielles nord'], 'orange')}
                    {quadrant(Ban, 'Menaces', ['Météo difficile en janvier', 'Concurrence ONG accrue (S40–44)'], 'red')}
                </div>
            </div>
        </div>
    );
};

export default SwotMatrix;
