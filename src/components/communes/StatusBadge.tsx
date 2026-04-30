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
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium tracking-tight ${config.bg} ${config.color} ${interactive ? 'group/badge' : ''}`}
        >
            <Icon size={11} strokeWidth={2.4} />
            {config.text}
            {interactive && <ChevronDown size={10} strokeWidth={2.4} className="opacity-0 group-hover/badge:opacity-100 transition-opacity ml-0.5" />}
        </span>
    );
};
