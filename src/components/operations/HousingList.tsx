import React from 'react';
import { MapPin, User, Bed, Star, ArrowRight, Copy, Check } from 'lucide-react';
import type { Housing } from './types';

interface HousingListProps {
    housings: Housing[];
    copiedId: string | null;
    onSelect: (h: Housing) => void;
    onCopy: (text: string, id: string, e: React.MouseEvent) => void;
}

const matchTone = (label?: string) => {
    switch (label) {
        case 'Top Match':
            return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25';
        case 'Trop Loin':
            return 'bg-red-50 text-red-700 ring-1 ring-red-100 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/25';
        case 'Correct':
            return 'bg-orange-50 text-orange-700 ring-1 ring-orange-100 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/25';
        default:
            return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-700/40 dark:text-slate-200 dark:ring-slate-600/40';
    }
};

const matchLabelLower = (label?: string) => {
    switch (label) {
        case 'Top Match': return 'top match';
        case 'Trop Loin': return 'trop loin';
        case 'Correct': return 'correct';
        default: return label?.toLowerCase() ?? '';
    }
};

export const HousingList: React.FC<HousingListProps> = ({ housings, copiedId, onSelect, onCopy }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
            {housings.map((h: any) => {
                const isTopMatch = h._matchLabel === 'Top Match';
                return (
                    <div
                        key={h.id}
                        onClick={() => onSelect(h)}
                        className={`group bg-white dark:bg-[var(--bg-card-solid)] rounded-[20px] border shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_24px_-16px_rgba(15,23,42,0.08)] hover:shadow-[0_18px_40px_-20px_rgba(255,91,43,0.18)] hover:-translate-y-[2px] hover:border-orange-200 dark:hover:border-orange-500/30 transition duration-200 overflow-hidden flex flex-col cursor-pointer relative ${
                            isTopMatch
                                ? 'border-emerald-300/70 dark:border-emerald-500/40'
                                : 'border-[var(--border-subtle)]'
                        }`}
                    >
                        {/* Match badge */}
                        {h._matchLabel && (
                            <div className={`absolute top-3 left-3 text-[11px] font-medium px-2 py-1 rounded-lg z-20 inline-flex items-center gap-1 tracking-tight ${matchTone(h._matchLabel)}`}>
                                {isTopMatch && <Star size={10} fill="currentColor" strokeWidth={0} />}
                                {matchLabelLower(h._matchLabel)} <span className="opacity-70">·</span>
                                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{h._matchScore}%</span>
                            </div>
                        )}

                        {/* Card header — subtle accent stripe instead of generic slate gradient */}
                        <div
                            className="h-[72px] flex items-end p-4 relative"
                            style={{
                                backgroundImage:
                                    'radial-gradient(120% 80% at 100% 0%, rgba(255, 91, 43, 0.08), transparent 60%), linear-gradient(180deg, rgba(15,23,42,0.02), transparent)',
                            }}
                        >
                            <h3 className="font-semibold text-lg text-[var(--text-primary)] tracking-tight leading-tight line-clamp-1 w-full pr-12">
                                {h.name}
                            </h3>
                        </div>

                        {/* Card body */}
                        <div className="p-5 space-y-4 flex-grow">
                            <div className="flex items-start gap-3 group/addr">
                                <MapPin className="mt-0.5 shrink-0 text-[var(--text-muted)]" size={15} strokeWidth={2.2} />
                                <div className="flex-grow min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-medium text-[var(--text-secondary)] line-clamp-1">{h.address}</p>
                                        <button
                                            onClick={(e) => onCopy(h.address, h.id, e)}
                                            aria-label="Copier l'adresse"
                                            className="text-slate-400 dark:text-slate-500 hover:text-orange-500 transition-colors opacity-0 group-hover/addr:opacity-100 active:translate-y-[1px]"
                                        >
                                            {copiedId === h.id ? <Check size={13} className="text-emerald-500"/> : <Copy size={13} />}
                                        </button>
                                    </div>
                                    {h._matchDistance !== undefined && (
                                        <p className="text-[11px] font-medium text-orange-600 dark:text-orange-300 mt-1 tracking-tight">
                                            à <span style={{ fontVariantNumeric: 'tabular-nums' }}>{h._matchDistance.toFixed(1)}</span> km de la zone
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                                {h.amenities.slice(0, 2).map((am: string) => (
                                    <span key={am} className="text-[11px] bg-slate-50 dark:bg-slate-800/60 text-[var(--text-secondary)] px-2 py-0.5 rounded-md border border-[var(--border-subtle)] tracking-tight">{am}</span>
                                ))}
                                {h.amenities.length > 2 && (
                                    <span className="text-[11px] text-[var(--text-muted)] px-1 py-0.5 tracking-tight">
                                        +{h.amenities.length - 2}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)] border-dashed">
                                <div className="flex items-center gap-1.5">
                                    <User className="text-[var(--text-muted)]" size={14} strokeWidth={2.2} />
                                    <span className="text-[13px] font-medium text-[var(--text-secondary)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                        {h.people} pers.
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Bed className="text-[var(--text-muted)]" size={14} strokeWidth={2.2} />
                                    <span className="text-[13px] font-medium text-[var(--text-secondary)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                        {h.nights} nuits min.
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Card footer */}
                        <div className="px-5 py-3.5 border-t border-[var(--border-subtle)] flex items-center justify-between bg-slate-50/40 dark:bg-slate-900/30 group-hover:bg-orange-50/40 dark:group-hover:bg-orange-500/10 transition-colors">
                            <p
                                className="text-[20px] font-semibold text-[var(--text-primary)] tracking-tight leading-none"
                                style={{ fontVariantNumeric: 'tabular-nums' }}
                            >
                                {h.cost}<span className="text-base ml-0.5">€</span>
                            </p>
                            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-300 font-medium text-[13px] tracking-tight group-hover:gap-1.5 transition-all">
                                Voir <ArrowRight size={14} strokeWidth={2.2} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
