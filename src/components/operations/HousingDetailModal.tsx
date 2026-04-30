import React, { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, User, Bed, Star, CheckCircle2, Phone } from 'lucide-react';
import type { Housing } from './types';
import { getWeekNumberLabel } from './helpers';
import { useDialogA11y } from '@/hooks/useDialogA11y';

interface HousingDetailModalProps {
    housing: Housing | null;
    onClose: () => void;
}

// Desaturated org tone classes — replaces the old saturated red/orange/green
// 600 fills which violated the audit's "keep saturation < 80%" rule.
const orgTone = (org: string) => {
    switch (org) {
        case 'MSF':
            return 'bg-red-50 text-red-700 ring-1 ring-red-100 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/25';
        case 'UNICEF':
            return 'bg-sky-50 text-sky-700 ring-1 ring-sky-100 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/25';
        default:
            return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25';
    }
};

export const HousingDetailModal: React.FC<HousingDetailModalProps> = ({ housing, onClose }) => {
    const titleId = useId();
    const closeRef = useRef<HTMLButtonElement>(null);
    const isOpen = housing !== null;
    const { dialogRef } = useDialogA11y({ isOpen, onClose, initialFocusRef: closeRef });

    if (!housing) return null;

    const nightlyRate = housing.nights > 0 ? (housing.cost / housing.nights).toFixed(0) : null;

    return createPortal(
        <div className="app-surface fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div
                className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className="modal-shell relative w-full max-w-2xl flex flex-col max-h-[90vh] outline-none"
            >
                {/* Header — accent strip with intentional placeholder, org chip, week badge */}
                <div className="modal-accent-strip h-32 relative border-b border-[var(--border-subtle)]">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="inline-flex items-center gap-2 text-[var(--text-muted)]">
                            <MapPin size={16} strokeWidth={2.2} className="text-orange-600/70" />
                            <span className="text-[12px] font-medium tracking-tight">
                                <span className="num">{housing.region}</span> · département <span className="num">{housing.dept}</span>
                            </span>
                        </div>
                    </div>
                    <button
                        ref={closeRef}
                        type="button"
                        onClick={onClose}
                        aria-label="Fermer"
                        className="btn-ghost !absolute top-3 right-3 !p-2 bg-white/85 dark:bg-[var(--bg-card-solid)]/85 backdrop-blur-sm border border-[var(--border-subtle)]"
                    >
                        <X size={16} strokeWidth={2.2} />
                    </button>
                    <div className="absolute bottom-3 left-5 flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-medium tracking-tight ${orgTone(housing.org)}`}>
                            Utilisé par {housing.org}
                        </span>
                        <span className="num px-2.5 py-1 rounded-lg text-[11px] font-medium tracking-tight bg-orange-50 text-orange-700 ring-1 ring-orange-100 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/25">
                            {getWeekNumberLabel(housing.date)}
                        </span>
                    </div>
                </div>

                <div className="p-7 overflow-y-auto">
                    {/* Title row */}
                    <div className="flex justify-between items-start gap-6 mb-6">
                        <div className="min-w-0">
                            <h2
                                id={titleId}
                                className="display text-[28px] text-[var(--text-primary)] leading-tight mb-1"
                            >
                                {housing.name}
                            </h2>
                            <p className="text-[13px] text-[var(--text-secondary)] tracking-tight">{housing.address}</p>
                        </div>
                        <div className="text-right shrink-0">
                            <div className="num display text-[28px] text-[var(--text-primary)] leading-none tracking-tight">
                                {housing.cost.toLocaleString('fr-FR')}<span className="text-[18px] ml-0.5">€</span>
                            </div>
                            <div className="eyebrow mt-1">coût total</div>
                            {nightlyRate && (
                                <div className="num text-[12px] text-[var(--text-secondary)] tracking-tight mt-1.5">
                                    {nightlyRate} € / nuit
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stat tiles — kpi-card primitive, compact */}
                    <div className="grid grid-cols-3 gap-3 mb-7">
                        <div className="kpi-card !p-4 relative">
                            <div className="relative z-10 flex flex-col items-start gap-2">
                                <User size={15} strokeWidth={2.2} className="text-orange-600" />
                                <p className="num text-[var(--text-primary)] text-[20px] font-semibold leading-none tracking-tight">
                                    {housing.people}
                                </p>
                                <p className="eyebrow leading-none">personnes</p>
                            </div>
                        </div>
                        <div className="kpi-card !p-4 relative">
                            <div className="relative z-10 flex flex-col items-start gap-2">
                                <Bed size={15} strokeWidth={2.2} className="text-orange-600" />
                                <p className="num text-[var(--text-primary)] text-[20px] font-semibold leading-none tracking-tight">
                                    {housing.nights}
                                </p>
                                <p className="eyebrow leading-none">nuits min.</p>
                            </div>
                        </div>
                        <div className="kpi-card !p-4 relative">
                            <div className="relative z-10 flex flex-col items-start gap-2">
                                <Star size={15} strokeWidth={2.2} className="text-amber-500" fill="currentColor" />
                                <p className="num text-[var(--text-primary)] text-[20px] font-semibold leading-none tracking-tight">
                                    {housing.rating}<span className="text-[var(--text-muted)] text-[14px] font-medium">/5</span>
                                </p>
                                <p className="eyebrow leading-none">avis équipe</p>
                            </div>
                        </div>
                    </div>

                    {/* Comment + amenities */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-7">
                        <div>
                            <h3 className="text-[13px] font-medium text-[var(--text-primary)] mb-2.5 tracking-tight">
                                Commentaire chef d’équipe
                            </h3>
                            {housing.comment ? (
                                <blockquote className="relative pl-3 border-l-2 border-orange-300 dark:border-orange-500/40 text-[13px] text-[var(--text-secondary)] italic leading-relaxed">
                                    {housing.comment}
                                    <footer className="not-italic mt-2 text-[11px] font-medium text-[var(--text-muted)]">
                                        — {housing.lead}
                                    </footer>
                                </blockquote>
                            ) : (
                                <p className="text-[13px] text-[var(--text-muted)] italic">Aucun commentaire spécifique.</p>
                            )}
                        </div>
                        <div>
                            <h3 className="text-[13px] font-medium text-[var(--text-primary)] mb-2.5 tracking-tight">
                                Commodités
                            </h3>
                            {housing.amenities.length > 0 ? (
                                <ul className="space-y-1.5">
                                    {housing.amenities.map(am => (
                                        <li key={am} className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
                                            <CheckCircle2 size={13} strokeWidth={2.4} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                            {am}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-[13px] text-[var(--text-muted)]">Aucune commodité renseignée.</p>
                            )}
                        </div>
                    </div>

                    {/* Owner footer */}
                    <div className="border-t border-[var(--border-subtle)] pt-5 flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-700/40 ring-1 ring-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
                                <User size={17} strokeWidth={2.2} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[13px] font-medium text-[var(--text-primary)] tracking-tight truncate">
                                    {housing.ownerName}
                                </p>
                                <p className="eyebrow leading-tight">{housing.channel}</p>
                            </div>
                        </div>
                        {housing.owner ? (
                            <a
                                href={`tel:${housing.owner.replace(/\s+/g, '')}`}
                                className="btn-primary num"
                            >
                                <Phone size={14} strokeWidth={2.2} /> {housing.owner}
                            </a>
                        ) : (
                            <span className="btn-secondary cursor-not-allowed opacity-60">
                                <Phone size={14} strokeWidth={2.2} /> Téléphone indisponible
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
};
