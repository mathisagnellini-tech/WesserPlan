import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Plus, User, Trash2, MapPin } from 'lucide-react';
import type { Zone, Mairie, ViewMode } from './types';
import { LEADERS, orgTheme, parseWeekString } from './helpers';
import { DocRequiredModal, ContactEditModal, type ToastSeverity } from './MairieModals';
import { ZoneTimeManager } from './MairieWidgets';
import { MairieCard } from './MairieCard';
import { Tooltip } from '@/components/ui/Tooltip';
import { ORG_LIST, ORGANIZATIONS } from '@/constants/organizations';

interface ZoneCardProps {
    zone: Zone;
    assignedMairies: Mairie[];
    availableMairies: Mairie[];
    viewMode: ViewMode;
    currentNavigationWeek: number;
    onUpdateZone: (id: string, field: keyof Zone, value: string | number) => void;
    onAddMairie: (zoneId: string, mairieId: number) => void;
    onRemoveMairie: (mairieId: number) => void;
    onUpdateMairieStatus: (mairieId: number, status: string) => void;
    onUpdateMairieProgress: (mairieId: number, step: number) => void;
    onAddMairieComment: (mairieId: number, text: string) => void;
    onDeleteMairieComment: (mairieId: number, commentId: string) => void;
    onEditMairieComment: (mairieId: number, commentId: string, text: string) => void;
    onToggleMairieCommentFavorite: (mairieId: number, commentId: string) => void;
    onAddMairieContact: (mairieId: number, nom: string, num: string, email?: string) => void;
    onUpdateMairieContactInfo: (mairieId: number, field: 'tel' | 'email', value: string) => void;
    onOpenDetail: (mairie: Mairie) => void;
    onDeleteZone: (id: string) => void;
    onShowToast: (msg: string, severity?: ToastSeverity) => void;
    onExtendMairie: (mairieId: number) => void;
    onSetMairieDuration: (mairieId: number, d: number) => void;
}

export const ZoneCard: React.FC<ZoneCardProps> = ({
    zone, assignedMairies, availableMairies, viewMode, currentNavigationWeek,
    onUpdateZone, onAddMairie, onRemoveMairie, onUpdateMairieStatus, onUpdateMairieProgress,
    onAddMairieComment, onDeleteMairieComment, onEditMairieComment, onToggleMairieCommentFavorite,
    onAddMairieContact, onUpdateMairieContactInfo, onOpenDetail, onDeleteZone,
    onShowToast, onExtendMairie, onSetMairieDuration,
}) => {
    const [search, setSearch] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const [docModalMairieId, setDocModalMairieId] = useState<number | null>(null);
    const [editContactState, setEditContactState] = useState<{ mairieId: number; field: 'tel' | 'email'; currentVal: string } | null>(null);

    const filteredAvailable = useMemo(() => {
        if (!search) return [];
        return availableMairies.filter((m) => m.nom.toLowerCase().includes(search.toLowerCase())).slice(0, 5);
    }, [search, availableMairies]);

    const displayMairies = useMemo(() => {
        return assignedMairies.filter((m) => {
            const parsed = parseWeekString(m.semaineDemandee);
            return parsed?.week === currentNavigationWeek;
        });
    }, [assignedMairies, currentNavigationWeek]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearching(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDocConfirm = (docName: string) => {
        if (docModalMairieId) {
            onUpdateMairieProgress(docModalMairieId, 3);
            onUpdateMairieStatus(docModalMairieId, 'Action requise');
            onAddMairieComment(docModalMairieId, `[DOC] Requis : ${docName}`);
            onShowToast('Statut mis à jour : Documents requis', 'success');
            setDocModalMairieId(null);
        }
    };

    const handleContactEditConfirm = (val: string) => {
        if (editContactState) {
            onUpdateMairieContactInfo(editContactState.mairieId, editContactState.field, val);
            onShowToast(`${editContactState.field === 'tel' ? 'Téléphone' : 'Email'} mis à jour !`, 'success');
            setEditContactState(null);
        }
    };

    const theme = orgTheme(zone.organization);
    const zoneOrg = zone.organization === 'all' ? null : zone.organization;
    const brandColor = zoneOrg ? ORGANIZATIONS[zoneOrg].color : '#FF5B2B';

    return (
        <div className={`flex flex-col rounded-3xl border-2 ${theme.border} bg-white dark:bg-[var(--bg-card-solid)] shadow-sm overflow-hidden mb-8`}>
            <DocRequiredModal isOpen={docModalMairieId !== null} onClose={() => setDocModalMairieId(null)} onConfirm={handleDocConfirm} />
            {editContactState && (
                <ContactEditModal
                    isOpen
                    onClose={() => setEditContactState(null)}
                    onConfirm={handleContactEditConfirm}
                    field={editContactState.field}
                    currentValue={editContactState.currentVal}
                />
            )}
            <div className={`px-6 py-4 border-b ${theme.border} flex items-center justify-between gap-3 bg-opacity-50 ${theme.bg}`}>
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-1.5 h-9 rounded-full" style={{ backgroundColor: brandColor }} />
                    {viewMode === 'grid' ? (
                        <input
                            className="display text-[22px] tracking-tight bg-transparent border-none focus:ring-0 p-0 text-[var(--text-primary)] w-full max-w-[300px]"
                            value={zone.name}
                            onChange={(e) => onUpdateZone(zone.id, 'name', e.target.value)}
                            aria-label="Nom de la zone"
                        />
                    ) : (
                        <h3 className="display text-[22px] tracking-tight leading-tight text-[var(--text-primary)]">{zone.name}</h3>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2 bg-white dark:bg-[var(--bg-card-solid)] px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] shadow-sm">
                        <User size={15} strokeWidth={2.2} className="text-[var(--text-muted)]" />
                        {viewMode === 'grid' ? (
                            <Tooltip
                                comingSoon
                                content="L'attribution d'un chef de zone sera persistée dès que la table team_leaders sera reliée."
                            >
                                <select
                                    value={zone.leader}
                                    onChange={(e) => onUpdateZone(zone.id, 'leader', e.target.value)}
                                    disabled
                                    aria-label="Chef de zone"
                                    className="text-[13px] font-medium tracking-tight bg-transparent border-none rounded py-0.5 px-1 focus:ring-0 outline-none cursor-not-allowed text-[var(--text-muted)]"
                                >
                                    {LEADERS.map((l) => (
                                        <option key={l} value={l}>{l}</option>
                                    ))}
                                </select>
                            </Tooltip>
                        ) : (
                            <span className="text-[13px] font-medium text-[var(--text-primary)] tracking-tight px-1">{zone.leader}</span>
                        )}
                        {viewMode === 'grid' && (
                            <div className="ml-1 pl-2 border-l border-[var(--border-subtle)]">
                                <ZoneTimeManager
                                    startWeek={zone.startWeek}
                                    duration={zone.defaultDuration}
                                    onUpdateStart={(w) => onUpdateZone(zone.id, 'startWeek', w)}
                                    onUpdateDuration={(d) => onUpdateZone(zone.id, 'defaultDuration', d)}
                                    currentWeek={currentNavigationWeek}
                                />
                            </div>
                        )}
                        {viewMode === 'list' && (
                            <div className="ml-1 pl-2 border-l border-[var(--border-subtle)] flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-secondary)]">
                                <span className="num bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md tracking-tight">
                                    Démarré S{zone.startWeek}
                                </span>
                                <span className="num bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-md tracking-tight">
                                    Semaine {Math.max(1, currentNavigationWeek - zone.startWeek + 1)} / {zone.defaultDuration}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5">
                        {viewMode === 'grid' ? (
                            <select
                                value={zone.organization}
                                onChange={(e) => onUpdateZone(zone.id, 'organization', e.target.value)}
                                aria-label="Organisation de la zone"
                                className={`text-[13px] font-medium tracking-tight bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-xl py-1.5 px-2.5 focus:ring-0 outline-none cursor-pointer ${theme.color}`}
                            >
                                {ORG_LIST.map((org) => (
                                    <option key={org} value={org}>
                                        {ORGANIZATIONS[org].shortName}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className={`text-[13px] font-medium tracking-tight bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-xl py-1.5 px-2.5 ${theme.color}`}>
                                {zoneOrg ? ORGANIZATIONS[zoneOrg].shortName : zone.organization}
                            </div>
                        )}
                        {viewMode === 'grid' && (
                            <button
                                type="button"
                                onClick={() => onDeleteZone(zone.id)}
                                aria-label="Supprimer la zone"
                                className="ml-1 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/15 rounded-lg transition active:translate-y-[1px]"
                            >
                                <Trash2 size={15} strokeWidth={2.2} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <div className="p-5 flex flex-col gap-5 bg-slate-50/50 dark:bg-slate-800/30">
                {viewMode === 'grid' && (
                    <div className="relative max-w-md" ref={searchRef}>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" size={15} strokeWidth={2.2} />
                            <input
                                type="text"
                                placeholder="Ajouter une commune à cette zone…"
                                aria-label="Ajouter une commune"
                                className="field-input !pl-9"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setIsSearching(true);
                                }}
                                onFocus={() => setIsSearching(true)}
                            />
                        </div>
                        {isSearching && search.length > 0 && (
                            <div role="listbox" className="modal-shell absolute z-20 w-full mt-2 overflow-hidden">
                                {filteredAvailable.length > 0 ? (
                                    filteredAvailable.map((m) => (
                                        <button
                                            type="button"
                                            role="option"
                                            aria-selected="false"
                                            key={m.id}
                                            className="w-full text-left px-3.5 py-2.5 hover:bg-orange-50 dark:hover:bg-orange-500/10 cursor-pointer flex justify-between items-center group border-b border-[var(--border-subtle)] last:border-0 transition active:translate-y-[1px]"
                                            onClick={() => {
                                                onAddMairie(zone.id, m.id);
                                                setSearch('');
                                                setIsSearching(false);
                                            }}
                                        >
                                            <span className="text-[13px] font-medium text-[var(--text-primary)] tracking-tight">{m.nom}</span>
                                            <Plus size={15} strokeWidth={2.2} className="text-orange-500 dark:text-orange-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-3.5 py-3 text-[12px] text-[var(--text-muted)] italic tracking-tight">
                                        Aucune commune trouvée (ou déjà assignée).
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'flex flex-col gap-6'}>
                    {displayMairies.length > 0 ? (
                        displayMairies.map((m) => {
                            const seriesMairies = m.serieId ? assignedMairies.filter((zm) => zm.serieId === m.serieId) : [m];
                            const totalWeeks = seriesMairies.length;
                            const sortedSeries = seriesMairies.sort((a, b) => a.semaineDemandee.localeCompare(b.semaineDemandee));
                            const currentRank = sortedSeries.findIndex((x) => x.id === m.id) + 1;
                            const firstMairie = seriesMairies[0];
                            const seriesStartWeek = parseWeekString(firstMairie.semaineDemandee)?.week ?? currentNavigationWeek;
                            return (
                                <MairieCard
                                    key={m.id}
                                    mairie={m}
                                    zoneOrg={zone.organization}
                                    zoneDuration={zone.defaultDuration}
                                    zoneStartWeek={seriesStartWeek}
                                    viewMode={viewMode}
                                    seriesInfo={{ rank: currentRank, total: totalWeeks }}
                                    currentNavigationWeek={currentNavigationWeek}
                                    onRemove={() => onRemoveMairie(m.id)}
                                    onStatusChange={(s) => onUpdateMairieStatus(m.id, s)}
                                    onProgressChange={(s) => onUpdateMairieProgress(m.id, s)}
                                    onAddComment={(t) => onAddMairieComment(m.id, t)}
                                    onDeleteComment={(cId) => onDeleteMairieComment(m.id, cId)}
                                    onEditComment={(cId, txt) => onEditMairieComment(m.id, cId, txt)}
                                    onToggleFavorite={(cId) => onToggleMairieCommentFavorite(m.id, cId)}
                                    onAddContact={(n, v, e) => onAddMairieContact(m.id, n, v, e)}
                                    onUpdateContact={(f, v) => onUpdateMairieContactInfo(m.id, f, v)}
                                    onClick={() => onOpenDetail(m)}
                                    onShowToast={(msg) => onShowToast(msg, 'info')}
                                    onDocRequest={() => setDocModalMairieId(m.id)}
                                    onRequestContactEdit={(f, val) => setEditContactState({ mairieId: m.id, field: f, currentVal: val })}
                                    onExtendWeek={() => onExtendMairie(m.id)}
                                    onSetDuration={(d) => onSetMairieDuration(m.id, d)}
                                />
                            );
                        })
                    ) : (
                        <div className="col-span-full py-10 flex flex-col items-center justify-center text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)] rounded-2xl bg-white/50 dark:bg-[var(--bg-card-solid)]/50">
                            <MapPin size={32} strokeWidth={2.2} className="mb-3 opacity-40" />
                            <span className="text-[14px] font-medium tracking-tight text-[var(--text-secondary)]">
                                Cette zone est vide pour la semaine <span className="num">{currentNavigationWeek}</span>.
                            </span>
                            <span className="text-[12px] tracking-tight mt-1">
                                Ajoutez des communes via la barre de recherche ci-dessus{viewMode === 'grid' ? '' : ' (vue grille uniquement)'}.
                            </span>
                        </div>
                    )}
                </div>
            </div>
            <div className="px-6 py-3 bg-white dark:bg-[var(--bg-card-solid)] border-t border-[var(--border-subtle)] flex justify-between text-[12px] font-medium text-[var(--text-secondary)] tracking-tight">
                <span className="num">
                    {assignedMairies.length} mairie{assignedMairies.length !== 1 ? 's' : ''} à contacter (S{currentNavigationWeek})
                </span>
                <span className="num">
                    Total · {assignedMairies.reduce((acc, m) => acc + m.population, 0).toLocaleString('fr-FR')} habitants
                </span>
            </div>
        </div>
    );
};
