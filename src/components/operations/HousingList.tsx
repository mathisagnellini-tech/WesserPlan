import React from 'react';
import { MapPin, User, Bed, Star, ArrowRight, Copy, Check } from 'lucide-react';
import type { Housing } from './types';

interface HousingListProps {
    housings: Housing[];
    copiedId: string | null;
    onSelect: (h: Housing) => void;
    onCopy: (text: string, id: string, e: React.MouseEvent) => void;
}

export const HousingList: React.FC<HousingListProps> = ({ housings, copiedId, onSelect, onCopy }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
            {housings.map((h: any) => (
                <div
                    key={h.id}
                    onClick={() => onSelect(h)}
                    className={`group bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer relative ${h._matchLabel === 'Top Match' ? 'border-green-400 ring-2 ring-green-100' : 'border-[var(--border-subtle)]'}`}
                >
                        {/* Smart Match Badges */}
                        {h._matchLabel && (
                            <div className={`absolute top-3 left-3 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg z-20 shadow-sm uppercase tracking-wide flex items-center gap-1 ${h._matchColor}`}>
                                {h._matchLabel === 'Top Match' && <Star size={10} fill="currentColor"/>}
                                {h._matchLabel} ({h._matchScore}%)
                            </div>
                        )}

                        {/* Card Header */}
                        <div className="h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-end p-4 relative">
                            <h3 className="font-extrabold text-xl text-[var(--text-primary)] leading-tight line-clamp-1 w-full pr-12">
                                {h.name}
                            </h3>
                        </div>

                        {/* Card Body */}
                        <div className="p-5 space-y-4 flex-grow">
                            <div className="flex items-start gap-3 group/addr">
                                <MapPin className={`mt-0.5 shrink-0 text-[var(--text-muted)]`} size={16} />
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-semibold text-[var(--text-secondary)] line-clamp-1">{h.address}</p>
                                        <button onClick={(e) => onCopy(h.address, h.id, e)} className="text-slate-300 hover:text-orange-500 transition-colors opacity-0 group-hover/addr:opacity-100">
                                            {copiedId === h.id ? <Check size={14} className="text-green-500"/> : <Copy size={14} />}
                                        </button>
                                    </div>
                                    {h._matchDistance !== undefined && (
                                        <p className="text-xs font-bold text-orange-600 mt-1">à {h._matchDistance.toFixed(1)} km de la zone</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {h.amenities.slice(0, 2).map((am: string) => (
                                    <span key={am} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-[var(--text-secondary)] px-2 py-1 rounded-md border border-[var(--border-subtle)]">{am}</span>
                                ))}
                                {h.amenities.length > 2 && <span className="text-[10px] text-[var(--text-muted)] px-1 py-1">+{h.amenities.length - 2}</span>}
                            </div>

                                <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)] border-dashed">
                                <div className="flex items-center gap-2">
                                    <User className="text-[var(--text-muted)]" size={16} />
                                    <span className="text-sm font-medium text-[var(--text-secondary)]">{h.people} pers.</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Bed className="text-[var(--text-muted)]" size={16} />
                                    <span className="text-sm font-medium text-[var(--text-secondary)]">{h.nights} nuits min.</span>
                                </div>
                            </div>
                        </div>

                        {/* Card Footer */}
                        <div className="p-4 border-t border-[var(--border-subtle)] flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30 group-hover:bg-orange-50/30 dark:group-hover:bg-orange-900/20 transition-colors">
                                <div>
                                <p className="text-lg font-extrabold text-[var(--text-primary)]">{h.cost} €</p>
                                </div>
                                <div className="flex items-center gap-1 text-orange-600 font-bold text-sm">
                                    Voir <ArrowRight size={16} />
                                </div>
                        </div>
                </div>
            ))}
        </div>
    );
};
