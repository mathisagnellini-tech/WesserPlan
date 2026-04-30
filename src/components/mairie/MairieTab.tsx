import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, LayoutGrid, List as ListIcon, ChevronRight, ChevronLeft, Database } from 'lucide-react';
import { Organization } from '@/types/commune';
import type { Mairie, Zone, Commentaire, AutreContact, ViewMode } from './types';
import { getISOWeek, getCalculatedWeekString, ORGS_CONFIG, parseWeekString } from './helpers';
import { Toast, DocRequiredModal, ContactEditModal, MairieDetailModal, type ToastSeverity } from './MairieModals';
import { ZoneCard } from './ZoneCard';
import { MairieCard } from './MairieCard';
import { mairieService } from '@/services/mairieService';
import { mairiePageService } from '@/services/mairiePageService';
import type { MairieTeamLeaderDto } from '@/types/plan';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { reporter } from '@/lib/observability';
import { weeksInIsoYear } from '@/lib/isoWeek';
import { ORG_LIST, ORGANIZATIONS, ORG_FALLBACK_COLOR } from '@/constants/organizations';

const UI_TO_DB_STATUS: Record<Mairie['statutGeneral'], string> = {
    'À traiter': 'pending',
    'En cours': 'in_progress',
    'Action requise': 'action_required',
    'Validé': 'accepted',
    'Refusé': 'refused',
};

function stepToMailCallStatus(step: number): { mail_status: string; call_status: string } {
    switch (step) {
        case 1: return { mail_status: 'mail_1_to_resend', call_status: '' };
        case 2: return { mail_status: 'mail_1_sent', call_status: '' };
        case 3: return { mail_status: 'mail_1_sent', call_status: 'called' };
        case 4: return { mail_status: 'mail_final_sent', call_status: '' };
        case 0:
        default: return { mail_status: '', call_status: '' };
    }
}

const tempCommentId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `temp-${crypto.randomUUID()}`;
    }
    return `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export default function MairieTab() {
    const [zones, setZones] = useState<Zone[]>([]);
    const [mairies, setMairies] = useState<Mairie[]>([]);
    // Team leaders directory from the Mairie page bundle. Used to attach
    // a leader display name to each zone (read by ZoneCard via mairieService
    // today; the bundle gives us the canonical list once the backend lands).
    const [, setTeamLeaders] = useState<MairieTeamLeaderDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<unknown>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrgFilter, setSelectedOrgFilter] = useState<Organization | 'all'>('all');
    const [reloadTrigger, setReloadTrigger] = useState(0);
    const PAGE_SIZE = 50;

    // Latest zones reference for the debounced updateZone closure — reading
    // `zones` directly inside setTimeout would observe the value at schedule
    // time, not at fire time, leading to lost edits.
    const zonesRef = useRef<Zone[]>(zones);
    useEffect(() => { zonesRef.current = zones; }, [zones]);

    const zoneUpdateTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    useEffect(() => {
        const ctrl = new AbortController();
        setIsLoading(true);
        setError(null);

        const loadData = async () => {
            try {
                // Bundle endpoint failure must not block the Supabase-backed
                // editorial data — `Promise.allSettled` keeps the page usable
                // when the operational backend is down.
                const [dbZones, result, leadersBundle] = await Promise.all([
                    mairieService.getZones(),
                    mairieService.getMairies({
                        org: selectedOrgFilter,
                        page,
                        pageSize: PAGE_SIZE,
                        search: searchQuery || undefined,
                    }),
                    mairiePageService.getMairieData().catch((err) => {
                        reporter.warn('Mairie page bundle failed', err, { source: 'MairieTab' });
                        return null;
                    }),
                ]);
                if (ctrl.signal.aborted) return;
                setMairies(result.data);
                setTotalCount(result.total);
                setZones(dbZones);
                setTeamLeaders(leadersBundle?.teamLeaders ?? []);
            } catch (err) {
                if (ctrl.signal.aborted) return;
                reporter.error('Mairie load failed', err, { source: 'MairieTab' });
                setError(err);
            } finally {
                if (!ctrl.signal.aborted) setIsLoading(false);
            }
        };

        loadData();
        return () => ctrl.abort();
    }, [selectedOrgFilter, page, searchQuery, reloadTrigger]);

    const handleRetry = () => setReloadTrigger((t) => t + 1);

    const handleOrgFilterChange = (org: Organization | 'all') => {
        setSelectedOrgFilter(org);
        setPage(0);
    };

    const handleSearch = (q: string) => {
        setSearchQuery(q);
        setPage(0);
    };

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    const [selectedMairie, setSelectedMairie] = useState<Mairie | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [currentWeek, setCurrentWeek] = useState(getISOWeek());

    const [toastMessage, setToastMessage] = useState<{ message: string; severity: ToastSeverity } | null>(null);
    const showToast = useCallback((message: string, severity: ToastSeverity = 'info') => {
        setToastMessage({ message, severity });
    }, []);

    // Year-aware week list — handles 53-week ISO years (2026, 2032 …).
    const currentYear = new Date().getFullYear();
    const weeks = useMemo(() => Array.from({ length: weeksInIsoYear(currentYear) }, (_, i) => i + 1), [currentYear]);

    const [unassignedDocMairieId, setUnassignedDocMairieId] = useState<number | null>(null);
    const [unassignedContactEdit, setUnassignedContactEdit] = useState<{ mairieId: number; field: 'tel' | 'email'; currentVal: string } | null>(null);

    const [confirmZoneDelete, setConfirmZoneDelete] = useState<string | null>(null);

    const revertOnFailure = useCallback((label: string) => (err: unknown) => {
        const detail = err instanceof Error && err.message ? `: ${err.message}` : '';
        reporter.error(`Mairie mutation failed (${label})`, err, { source: 'MairieTab' });
        showToast(`Erreur — ${label} n'a pas pu être enregistré${detail}`, 'error');
        setReloadTrigger((t) => t + 1);
    }, [showToast]);

    const handleAddZone = async () => {
        const tempId = `z-temp-${Date.now()}`;
        const org: Organization = selectedOrgFilter === 'all' ? 'msf' : selectedOrgFilter;
        const startWeek = currentWeek;
        const deploymentWeeks = [getCalculatedWeekString(startWeek, 0), getCalculatedWeekString(startWeek, 1)];
        const optimisticZone: Zone = {
            id: tempId,
            name: `Nouvelle Zone ${zones.length + 1}`,
            leader: 'Non assigné',
            organization: org,
            defaultDuration: 2,
            startWeek,
            townHallIds: [],
        };
        setZones((prev) => [...prev, optimisticZone]);

        try {
            const created = await mairieService.createZone({
                zone_name: optimisticZone.name,
                organization: org,
                deployment_weeks: deploymentWeeks,
                color: ORGANIZATIONS[org]?.color ?? ORG_FALLBACK_COLOR,
                town_hall_ids: [],
            });
            setZones((prev) => prev.map((z) => (z.id === tempId ? created : z)));
        } catch (err) {
            setZones((prev) => prev.filter((z) => z.id !== tempId));
            revertOnFailure('création de la zone')(err);
        }
    };

    const handleDeleteZone = async (zoneId: string) => {
        const prevZones = zones;
        const prevMairies = mairies;
        setZones(zones.filter((z) => z.id !== zoneId));
        setMairies(mairies.map((m) => (m.zoneId === zoneId ? { ...m, zoneId: undefined } : m)));

        if (zoneId.startsWith('z-temp-')) return;

        try {
            await mairieService.deleteZone(zoneId);
        } catch (err) {
            setZones(prevZones);
            setMairies(prevMairies);
            revertOnFailure('suppression de la zone')(err);
        }
    };

    const handleUpdateZone = (id: string, field: keyof Zone, value: string | number) => {
        setZones((prev) => prev.map((z) => (z.id === id ? { ...z, [field]: value } : z)));

        if (id.startsWith('z-temp-')) return;

        const timerKey = `${id}-${field}`;
        if (zoneUpdateTimers.current[timerKey]) {
            clearTimeout(zoneUpdateTimers.current[timerKey]);
        }
        zoneUpdateTimers.current[timerKey] = setTimeout(() => {
            const updates: Parameters<typeof mairieService.updateZone>[1] = {};
            if (field === 'name') updates.zone_name = String(value);
            else if (field === 'organization') updates.organization = String(value);
            else if (field === 'startWeek' || field === 'defaultDuration') {
                // Read latest zones from the ref so we don't observe stale state.
                const z = zonesRef.current.find((zz) => zz.id === id);
                const startWeek = field === 'startWeek' ? Number(value) : (z?.startWeek ?? 1);
                const duration = field === 'defaultDuration' ? Number(value) : (z?.defaultDuration ?? 1);
                updates.deployment_weeks = Array.from({ length: duration }, (_, i) => getCalculatedWeekString(startWeek, i));
            } else {
                return;
            }
            mairieService.updateZone(id, updates).catch(revertOnFailure('mise à jour de la zone'));
        }, 500);
    };

    const handleAddMairieToZone = async (zoneId: string, mairieId: number) => {
        const zone = zones.find((z) => z.id === zoneId);
        if (!zone) return;
        const weekStr = getCalculatedWeekString(currentWeek, 0);
        const prevMairies = mairies;
        const prevZones = zones;

        const currentIds = zone.townHallIds ?? [];
        if (currentIds.includes(mairieId)) {
            setMairies(prevMairies.map((m) => (m.id === mairieId ? { ...m, zoneId, semaineDemandee: weekStr } : m)));
            return;
        }
        const newIds = [...currentIds, mairieId];

        setMairies(prevMairies.map((m) => (m.id === mairieId ? { ...m, zoneId, semaineDemandee: weekStr } : m)));
        setZones(prevZones.map((z) => (z.id === zoneId ? { ...z, townHallIds: newIds } : z)));

        if (zoneId.startsWith('z-temp-')) return;

        try {
            await mairieService.updateZone(zoneId, { town_hall_ids: newIds });
        } catch (err) {
            setMairies(prevMairies);
            setZones(prevZones);
            revertOnFailure("ajout de la mairie à la zone")(err);
        }
    };

    const handleRemoveMairieFromZone = async (mairieId: number) => {
        const target = mairies.find((m) => m.id === mairieId);
        if (!target?.zoneId) {
            setMairies((prev) => prev.map((m) => (m.id === mairieId ? { ...m, zoneId: undefined } : m)));
            return;
        }
        const zoneId = target.zoneId;
        const zone = zones.find((z) => z.id === zoneId);
        const prevMairies = mairies;
        const prevZones = zones;

        const currentIds = zone?.townHallIds ?? [];
        const newIds = currentIds.filter((id) => id !== mairieId);

        setMairies(prevMairies.map((m) => (m.id === mairieId ? { ...m, zoneId: undefined } : m)));
        if (zone) {
            setZones(prevZones.map((z) => (z.id === zoneId ? { ...z, townHallIds: newIds } : z)));
        }

        if (zoneId.startsWith('z-temp-')) return;

        try {
            await mairieService.updateZone(zoneId, { town_hall_ids: newIds });
        } catch (err) {
            setMairies(prevMairies);
            setZones(prevZones);
            revertOnFailure("retrait de la mairie de la zone")(err);
        }
    };

    const handleUpdateMairieStatus = async (mairieId: number, status: string) => {
        const prev = mairies;
        setMairies(prev.map((m) => (m.id === mairieId ? { ...m, statutGeneral: status as Mairie['statutGeneral'] } : m)));
        const dbStatus = UI_TO_DB_STATUS[status as Mairie['statutGeneral']] ?? 'pending';
        try {
            await mairieService.updateMairie(mairieId, { status: dbStatus });
        } catch (err) {
            setMairies(prev);
            revertOnFailure('mise à jour du statut')(err);
        }
    };

    const handleUpdateMairieProgress = async (mairieId: number, step: number) => {
        const prev = mairies;
        setMairies(prev.map((m) => (m.id === mairieId ? { ...m, etapeProgression: step } : m)));
        const { mail_status, call_status } = stepToMailCallStatus(step);
        try {
            await mairieService.updateMairie(mairieId, { mail_status, call_status });
        } catch (err) {
            setMairies(prev);
            revertOnFailure('mise à jour de la progression')(err);
        }
    };

    const handleAddMairieComment = async (mairieId: number, text: string) => {
        const tempId = tempCommentId();
        const newComment: Commentaire = { id: tempId, date: new Date().toISOString(), texte: text };
        const prev = mairies;
        setMairies(prev.map((m) => (m.id === mairieId ? { ...m, commentaires: [newComment, ...m.commentaires] } : m)));

        try {
            await mairieService.addComment(mairieId, text);
        } catch (err) {
            setMairies(prev);
            revertOnFailure('ajout du commentaire')(err);
        }
    };

    const handleDeleteMairieComment = async (mairieId: number, commentId: string) => {
        const prev = mairies;
        setMairies(prev.map((m) => (m.id === mairieId ? { ...m, commentaires: m.commentaires.filter((c) => c.id !== commentId) } : m)));

        if (commentId.startsWith('temp-')) return;
        const numericId = Number(commentId);
        if (!Number.isFinite(numericId)) return;

        try {
            await mairieService.deleteComment(numericId);
        } catch (err) {
            setMairies(prev);
            revertOnFailure('suppression du commentaire')(err);
        }
    };

    const handleEditMairieComment = async (mairieId: number, commentId: string, newText: string) => {
        const prev = mairies;
        setMairies(prev.map((m) => (m.id === mairieId ? { ...m, commentaires: m.commentaires.map((c) => (c.id === commentId ? { ...c, texte: newText } : c)) } : m)));

        if (commentId.startsWith('temp-')) return;
        const numericId = Number(commentId);
        if (!Number.isFinite(numericId)) return;

        try {
            await mairieService.updateComment(numericId, newText);
        } catch (err) {
            setMairies(prev);
            revertOnFailure('modification du commentaire')(err);
        }
    };

    const handleToggleMairieCommentFavorite = (mairieId: number, commentId: string) => {
        setMairies((prev) => prev.map((m) => {
            if (m.id !== mairieId) return m;
            return {
                ...m,
                commentaires: m.commentaires.map((c) => ({
                    ...c,
                    isFavorite: c.id === commentId ? !c.isFavorite : false,
                })),
            };
        }));
    };

    const handleAddMairieContact = async (mairieId: number, nom: string, numero: string, email?: string) => {
        const newContact: AutreContact = { id: Date.now().toString(), nom, numero, email, type: 'tel' };
        const prev = mairies;
        setMairies(prev.map((m) => (m.id === mairieId ? { ...m, contact: { ...m.contact, autresContacts: [...(m.contact.autresContacts || []), newContact] } } : m)));

        const extraContactUpdate = {
            additional_contact_2_name: nom,
            additional_contact_2_phone: numero,
            additional_contact_2_email: email ?? null,
        } as unknown as Parameters<typeof mairieService.updateMairie>[1];
        try {
            await mairieService.updateMairie(mairieId, extraContactUpdate);
        } catch (err) {
            setMairies(prev);
            revertOnFailure('ajout du contact')(err);
        }
    };

    const handleUpdateMairieContactInfo = async (mairieId: number, field: 'tel' | 'email', value: string) => {
        const prev = mairies;
        setMairies(prev.map((m) => (m.id === mairieId ? { ...m, contact: { ...m.contact, [field]: value } } : m)));

        const updates: Parameters<typeof mairieService.updateMairie>[1] = field === 'tel' ? { phone: value } : { email: value };

        try {
            await mairieService.updateMairie(mairieId, updates);
        } catch (err) {
            setMairies(prev);
            revertOnFailure('mise à jour du contact')(err);
        }
    };

    const handleExtendMairie = async (mairieId: number) => {
        try {
            await mairieService.extendMairie(mairieId);
            // Force a refetch so the updated `deployment_week` (and any
            // derived series view) is reflected from the canonical source.
            setReloadTrigger((t) => t + 1);
            showToast("Mission prolongée d'une semaine", 'success');
        } catch (err) {
            revertOnFailure('prolongation de la mission')(err);
        }
    };

    const handleSetMairieDuration = async (mairieId: number, targetDuration: number) => {
        try {
            await mairieService.setMairieDuration(mairieId, targetDuration);
            setReloadTrigger((t) => t + 1);
            showToast(`Durée ajustée à ${targetDuration} semaines`, 'success');
        } catch (err) {
            revertOnFailure('ajustement de la durée')(err);
        }
    };

    const yearWeeks = weeksInIsoYear(currentYear);
    const nextWeek = () => setCurrentWeek((w) => (w < yearWeeks ? w + 1 : 1));
    const prevWeek = () => setCurrentWeek((w) => (w > 1 ? w - 1 : yearWeeks));

    const visibleZones = useMemo(() => {
        if (selectedOrgFilter === 'all') return zones;
        return zones.filter((z) => z.organization === selectedOrgFilter || z.organization === 'all');
    }, [zones, selectedOrgFilter]);

    const unassignedMairies = useMemo(() => mairies.filter((m) => !m.zoneId), [mairies]);

    if (isLoading) {
        return <LoadingState fullHeight label="Chargement des mairies..." />;
    }

    if (error) {
        return (
            <ErrorState
                fullHeight
                title="Impossible de charger les mairies"
                error={error}
                onRetry={handleRetry}
            />
        );
    }

    return (
        <section className="app-surface animate-fade-in h-full flex flex-col relative">
            {toastMessage && (
                <Toast
                    message={toastMessage.message}
                    severity={toastMessage.severity}
                    onClose={() => setToastMessage(null)}
                />
            )}
            <DocRequiredModal
                isOpen={unassignedDocMairieId !== null}
                onClose={() => setUnassignedDocMairieId(null)}
                onConfirm={(docName) => {
                    if (unassignedDocMairieId) {
                        handleUpdateMairieProgress(unassignedDocMairieId, 3);
                        handleUpdateMairieStatus(unassignedDocMairieId, 'Action requise');
                        handleAddMairieComment(unassignedDocMairieId, `[DOC] Requis : ${docName}`);
                        showToast('Statut mis à jour : Documents requis', 'success');
                        setUnassignedDocMairieId(null);
                    }
                }}
            />
            {unassignedContactEdit && (
                <ContactEditModal
                    isOpen={true}
                    onClose={() => setUnassignedContactEdit(null)}
                    onConfirm={(val) => {
                        handleUpdateMairieContactInfo(unassignedContactEdit.mairieId, unassignedContactEdit.field, val);
                        showToast(`${unassignedContactEdit.field === 'tel' ? 'Téléphone' : 'Email'} mis à jour !`, 'success');
                        setUnassignedContactEdit(null);
                    }}
                    field={unassignedContactEdit.field}
                    currentValue={unassignedContactEdit.currentVal}
                />
            )}

            <ConfirmDialog
                isOpen={!!confirmZoneDelete}
                onClose={() => setConfirmZoneDelete(null)}
                onConfirm={() => {
                    if (confirmZoneDelete) handleDeleteZone(confirmZoneDelete);
                    setConfirmZoneDelete(null);
                }}
                title="Supprimer cette zone ?"
                message={
                    <>
                        Les communes assignées retourneront dans la liste <b>« Non assignées »</b>. Cette action est irréversible.
                    </>
                }
                variant="danger"
                confirmLabel="Supprimer"
            />

            <header className="mb-5 md:mb-7 flex flex-col gap-4 md:gap-5 flex-shrink-0">
                <div className="flex flex-col md:flex-row justify-between md:items-end mt-2 gap-4">
                    <div>
                        <h2 className="display text-[var(--text-primary)] text-[34px] md:text-[40px] leading-none tracking-tight">
                            Relations mairie
                        </h2>
                        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                            <p className="text-[13px] text-[var(--text-secondary)] tracking-tight">
                                Suivi des prises de contact et organisation des tournées.
                            </p>
                            <span className="num inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-500/25 tracking-tight">
                                <Database size={11} strokeWidth={2.4} /> {totalCount.toLocaleString('fr-FR')} mairies
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                        <div className="seg">
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                data-active={viewMode === 'list'}
                                aria-label="Vue liste"
                                title="Vue liste"
                            >
                                <ListIcon size={14} strokeWidth={2.2} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                data-active={viewMode === 'grid'}
                                aria-label="Vue grille"
                                title="Vue grille"
                            >
                                <LayoutGrid size={14} strokeWidth={2.2} />
                            </button>
                        </div>
                        <div className="flex items-center bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-xl p-1 shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_24px_-16px_rgba(15,23,42,0.06)]">
                            <button
                                type="button"
                                onClick={prevWeek}
                                aria-label="Semaine précédente"
                                className="num flex items-center gap-1 text-[12px] font-medium text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 px-2.5 py-1.5 rounded-md tracking-tight transition active:translate-y-[1px]"
                            >
                                <ChevronLeft size={14} strokeWidth={2.2} /> S{currentWeek > 1 ? currentWeek - 1 : yearWeeks}
                            </button>
                            <select
                                aria-label="Semaine"
                                value={currentWeek}
                                onChange={(e) => setCurrentWeek(Number(e.target.value))}
                                className="num bg-transparent text-[var(--text-primary)] font-medium text-[14px] py-1 px-2 rounded-md focus:outline-none cursor-pointer tracking-tight hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                                {weeks.map((w) => (<option key={w} value={w}>Semaine {w}</option>))}
                            </select>
                            <button
                                type="button"
                                onClick={nextWeek}
                                aria-label="Semaine suivante"
                                className="num flex items-center gap-1 text-[12px] font-medium text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 px-2.5 py-1.5 rounded-md tracking-tight transition active:translate-y-[1px]"
                            >
                                S{currentWeek < yearWeeks ? currentWeek + 1 : 1} <ChevronRight size={14} strokeWidth={2.2} />
                            </button>
                        </div>
                        <button type="button" onClick={handleAddZone} className="btn-primary !px-3.5 !py-2.5">
                            <Plus size={15} strokeWidth={2.4} /> Créer une zone
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="seg" role="radiogroup" aria-label="Filtre par organisation">
                        <button
                            type="button"
                            role="radio"
                            aria-checked={selectedOrgFilter === 'all'}
                            onClick={() => handleOrgFilterChange('all')}
                            data-active={selectedOrgFilter === 'all'}
                        >
                            Toutes
                        </button>
                        {ORG_LIST.map((org) => {
                            const conf = ORGS_CONFIG[org];
                            const info = ORGANIZATIONS[org];
                            const isActive = selectedOrgFilter === org;
                            return (
                                <button
                                    type="button"
                                    role="radio"
                                    aria-checked={isActive}
                                    key={org}
                                    onClick={() => handleOrgFilterChange(org)}
                                    title={info.name}
                                    data-active={isActive}
                                >
                                    <img src={info.logo} alt="" aria-hidden="true" className="h-3.5 w-auto rounded-sm bg-white p-px" />
                                    <span>{conf.label}</span>
                                </button>
                            );
                        })}
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Rechercher une commune…"
                        aria-label="Rechercher une commune"
                        className="field-input !w-64"
                    />
                    <span className="num eyebrow leading-none">{totalCount.toLocaleString('fr-FR')} résultats</span>
                </div>
            </header>

            <div className="flex flex-col gap-8 mb-12">
                {visibleZones.map((zone) => (
                    <ZoneCard
                        key={zone.id}
                        zone={zone}
                        viewMode={viewMode}
                        currentNavigationWeek={currentWeek}
                        assignedMairies={mairies.filter((m) => m.zoneId === zone.id)}
                        availableMairies={unassignedMairies}
                        onUpdateZone={handleUpdateZone}
                        onAddMairie={handleAddMairieToZone}
                        onRemoveMairie={handleRemoveMairieFromZone}
                        onUpdateMairieStatus={handleUpdateMairieStatus}
                        onUpdateMairieProgress={handleUpdateMairieProgress}
                        onAddMairieComment={handleAddMairieComment}
                        onDeleteMairieComment={handleDeleteMairieComment}
                        onEditMairieComment={handleEditMairieComment}
                        onToggleMairieCommentFavorite={handleToggleMairieCommentFavorite}
                        onAddMairieContact={handleAddMairieContact}
                        onUpdateMairieContactInfo={handleUpdateMairieContactInfo}
                        onOpenDetail={setSelectedMairie}
                        onDeleteZone={(id) => setConfirmZoneDelete(id)}
                        onShowToast={(msg) => showToast(msg, 'info')}
                        onExtendMairie={handleExtendMairie}
                        onSetMairieDuration={handleSetMairieDuration}
                    />
                ))}
            </div>

            {totalCount === 0 && visibleZones.length === 0 && (
                <EmptyState
                    title="Aucune mairie"
                    message="Aucune mairie ne correspond aux filtres actuels. Essayez d'élargir votre recherche ou de changer d'organisation."
                />
            )}

            {unassignedMairies.length > 0 && (
                <div className="mt-auto bg-slate-100/60 dark:bg-slate-800/40 rounded-3xl p-7 border border-[var(--border-subtle)]">
                    <h3 className="display text-[var(--text-primary)] text-xl tracking-tight leading-tight mb-5 flex items-center gap-2">
                        <ListIcon size={18} strokeWidth={2.2} className="text-orange-500" />
                        Communes non assignées <span className="num text-[var(--text-muted)] font-medium">({unassignedMairies.length})</span>
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {unassignedMairies.map((m) => {
                            const seriesMairies = m.serieId ? unassignedMairies.filter((zm) => zm.serieId === m.serieId) : [m];
                            const totalWeeks = seriesMairies.length;
                            const sortedSeries = seriesMairies.sort((a, b) => a.semaineDemandee.localeCompare(b.semaineDemandee));
                            const currentRank = sortedSeries.findIndex((x) => x.id === m.id) + 1;
                            const firstMairie = sortedSeries[0];
                            const seriesStartWeek = parseWeekString(firstMairie.semaineDemandee)?.week ?? currentWeek;
                            return (
                                <MairieCard
                                    key={m.id}
                                    mairie={m}
                                    zoneOrg={m.organization}
                                    zoneDuration={1}
                                    zoneStartWeek={seriesStartWeek}
                                    viewMode="grid"
                                    seriesInfo={{ rank: currentRank, total: totalWeeks }}
                                    currentNavigationWeek={currentWeek}
                                    onStatusChange={(s) => handleUpdateMairieStatus(m.id, s)}
                                    onProgressChange={(s) => handleUpdateMairieProgress(m.id, s)}
                                    onAddComment={(t) => handleAddMairieComment(m.id, t)}
                                    onDeleteComment={(cId) => handleDeleteMairieComment(m.id, cId)}
                                    onEditComment={(cId, txt) => handleEditMairieComment(m.id, cId, txt)}
                                    onToggleFavorite={(cId) => handleToggleMairieCommentFavorite(m.id, cId)}
                                    onAddContact={(n, v, e) => handleAddMairieContact(m.id, n, v, e)}
                                    onUpdateContact={(f, v) => handleUpdateMairieContactInfo(m.id, f, v)}
                                    onClick={() => setSelectedMairie(m)}
                                    onShowToast={(msg) => showToast(msg, 'info')}
                                    onDocRequest={() => setUnassignedDocMairieId(m.id)}
                                    onRequestContactEdit={(f, val) => setUnassignedContactEdit({ mairieId: m.id, field: f, currentVal: val })}
                                    onExtendWeek={() => handleExtendMairie(m.id)}
                                    onSetDuration={(d) => handleSetMairieDuration(m.id, d)}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {totalPages > 1 && (
                <nav aria-label="Pagination" className="flex items-center justify-center gap-3 mt-7 mb-4">
                    <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="btn-secondary !px-3 !py-2 !text-[12px]"
                    >
                        <ChevronLeft size={14} strokeWidth={2.2} /> Précédent
                    </button>
                    <span aria-current="page" className="num text-[12px] font-medium text-[var(--text-primary)] tracking-tight">
                        Page {page + 1} / {totalPages}
                    </span>
                    <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="btn-secondary !px-3 !py-2 !text-[12px]"
                    >
                        Suivant <ChevronRight size={14} strokeWidth={2.2} />
                    </button>
                </nav>
            )}

            <MairieDetailModal mairie={selectedMairie} onClose={() => setSelectedMairie(null)} showToast={(msg, sev) => showToast(msg, sev ?? 'info')} />
        </section>
    );
}
