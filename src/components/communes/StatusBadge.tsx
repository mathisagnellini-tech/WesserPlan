import React from 'react';
import { CommuneStatus } from '@/types';
import { statusMap } from '@/constants';
import { Info, CheckCircle2, XCircle, Clock, Car, ChevronDown } from 'lucide-react';

export const StatusBadge: React.FC<{ status: CommuneStatus, interactive?: boolean, onClick?: (e: React.MouseEvent) => void }> = ({ status, interactive, onClick }) => {
  const config = statusMap[status] || { text: status, color: 'text-[var(--text-secondary)]', bg: 'bg-slate-100 dark:bg-slate-800' };

  const getIcon = () => {
    switch(status) {
        case 'pas_demande': return Clock;
        case 'informe': return Info;
        case 'refuse': return XCircle;
        case 'telescope': return Car;
        case 'fait': return CheckCircle2;
        default: return Info;
    }
  };
  const Icon = getIcon();

  return (
    <span
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${config.bg} ${config.color} ${interactive ? 'cursor-pointer hover:brightness-95 hover:ring-1 hover:ring-black/5 transition-all group/badge' : ''}`}
    >
      <Icon size={12} />
      {config.text}
      {interactive && <ChevronDown size={10} className="opacity-0 group-hover/badge:opacity-100 transition-opacity ml-1"/>}
    </span>
  );
};
