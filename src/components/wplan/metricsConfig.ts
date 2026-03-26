import React from 'react';
import { Users, Euro, Heart, TrendingUp, Vote, Briefcase, UserPlus, Building2, Sprout } from 'lucide-react';

export type MapMetric = 'density' | 'income' | 'donors' | 'visits' | 'politics' | 'unemployment' | 'age' | 'urbanity' | 'generosity_score';

export interface MetricConfig {
    label: string;
    icon: React.ReactNode;
    colors: string[];
    labels: string[];
    getValueColor: (val: number) => string;
}

export const METRICS_CONFIG: Record<MapMetric, MetricConfig> = {
    density: {
        label: 'Densité Pop.',
        icon: React.createElement(Users, { size: 16 }),
        colors: ['#ddd6fe', '#a78bfa', '#8b5cf6', '#6d28d9', '#4c1d95'],
        labels: ['< 50 hab/km²', '50-150', '150-500', '500-2000', '> 2000'],
        getValueColor: (val) => {
            if (val > 80) return '#4c1d95';
            if (val > 60) return '#6d28d9';
            if (val > 40) return '#8b5cf6';
            if (val > 20) return '#a78bfa';
            return '#ddd6fe';
        }
    },
    income: {
        label: 'Revenus Médian',
        icon: React.createElement(Euro, { size: 16 }),
        colors: ['#a7f3d0', '#34d399', '#10b981', '#059669', '#064e3b'],
        labels: ['< 18k€', '18-22k€', '22-28k€', '28-35k€', '> 35k€'],
        getValueColor: (val) => {
            if (val > 80) return '#064e3b';
            if (val > 60) return '#059669';
            if (val > 40) return '#10b981';
            if (val > 20) return '#34d399';
            return '#a7f3d0';
        }
    },
    donors: {
        label: 'Donateurs / Hab.',
        icon: React.createElement(Heart, { size: 16 }),
        colors: ['#bfdbfe', '#60a5fa', '#3b82f6', '#1d4ed8', '#1e3a8a'],
        labels: ['Très faible', 'Faible', 'Moyen', 'Élevé', 'Top performeur'],
        getValueColor: (val) => {
            if (val > 80) return '#1e3a8a';
            if (val > 60) return '#1d4ed8';
            if (val > 40) return '#3b82f6';
            if (val > 20) return '#60a5fa';
            return '#bfdbfe';
        }
    },
    visits: {
        label: 'Passages',
        icon: React.createElement(TrendingUp, { size: 16 }),
        colors: ['#fed7aa', '#fb923c', '#ea580c', '#c2410c', '#7c2d12'],
        labels: ['Jamais visité', '1 passage', '2-3 passages', '4-5 passages', 'Saturé (>5)'],
        getValueColor: (val) => {
            if (val > 80) return '#7c2d12';
            if (val > 60) return '#c2410c';
            if (val > 40) return '#ea580c';
            if (val > 20) return '#fb923c';
            return '#fed7aa';
        }
    },
    politics: {
        label: 'Politique',
        icon: React.createElement(Vote, { size: 16 }),
        colors: ['#1e40af', '#fbbf24', '#be185d'],
        labels: ['Dominante Droite', 'Centre / Indécis', 'Dominante Gauche'],
        getValueColor: (val) => {
            if (val < 33) return '#1e40af';
            if (val < 66) return '#fbbf24';
            return '#be185d';
        }
    },
    unemployment: {
        label: 'Chômage',
        icon: React.createElement(Briefcase, { size: 16 }),
        colors: ['#fecaca', '#f87171', '#ef4444', '#b91c1c', '#7f1d1d'],
        labels: ['< 5%', '5-7%', '7-9%', '9-12%', '> 12%'],
        getValueColor: (val) => {
            if (val > 80) return '#7f1d1d';
            if (val > 60) return '#b91c1c';
            if (val > 40) return '#ef4444';
            if (val > 20) return '#f87171';
            return '#fecaca';
        }
    },
    age: {
        label: 'Âge Moyen',
        icon: React.createElement(UserPlus, { size: 16 }),
        colors: ['#cffafe', '#22d3ee', '#0e7490', '#155e75', '#164e63'],
        labels: ['< 30 ans', '30-40 ans', '40-50 ans', '50-65 ans', '> 65 ans'],
        getValueColor: (val) => {
            if (val > 80) return '#164e63';
            if (val > 60) return '#155e75';
            if (val > 40) return '#0e7490';
            if (val > 20) return '#22d3ee';
            return '#cffafe';
        }
    },
    urbanity: {
        label: 'Rural / Urbain',
        icon: React.createElement(Building2, { size: 16 }),
        colors: ['#15803d', '#374151'],
        labels: ['Rural', 'Urbain'],
        getValueColor: (val) => {
            if (val > 50) return '#374151';
            return '#15803d';
        }
    },
    generosity_score: {
        label: 'Score Générosité',
        icon: React.createElement(Sprout, { size: 16 }),
        colors: ['#fbcfe8', '#f472b6', '#db2777', '#be185d'],
        labels: ['C', 'B', 'A', 'A+'],
        getValueColor: (val) => {
            if (val > 80) return '#be185d';
            if (val > 60) return '#db2777';
            if (val > 40) return '#f472b6';
            return '#fbcfe8';
        }
    }
};
