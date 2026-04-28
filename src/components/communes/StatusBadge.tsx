import React from 'react';
import { CommuneStatus } from '@/types';
import { statusMap } from '@/constants';
import { Info, CheckCircle2, XCircle, Clock, Car, ChevronDown } from 'lucide-react';

const STATUS_ICON = {
    pas_demande: Clock,
    informe: Info,
    refuse: XCircle,
    telescope: Car,
    fait: CheckCircle2,
} as const;

export const StatusBadge: React.FC<{ status: CommuneStatus; interactive?: boolean }> = ({ status, interactive }) => {
    const config = statusMap[status] || { text: status, color: 'text-[var(--text-secondary)]', bg: 'bg-slate-100 dark:bg-slate-800' };
    const Icon = STATUS_ICON[status as keyof typeof STATUS_ICON] ?? Info;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${config.bg} ${config.color} ${interactive ? 'group/badge' : ''}`}
        >
            <Icon size={12} />
            {config.text}
            {interactive && <ChevronDown size={10} className="opacity-0 group-hover/badge:opacity-100 transition-opacity ml-1" />}
        </span>
    );
};
