import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, LayoutGrid, List as ListIcon, ChevronRight, ChevronLeft, Database } from 'lucide-react';
import { Organization } from '@/types/commune';
import type { Mairie, Zone, Commentaire, AutreContact, ViewMode } from './types';
import { getISOWeek, getCalculatedWeekString, ORGS_CONFIG, parseWeekString } from './helpers';
import { Toast, DocRequiredModal, ContactEditModal, MairieDetailModal, type ToastSeverity } from './MairieModals';
import { ZoneCard } from './ZoneCard';
import { MairieCard } from './MairieCard';
import { mairieService } from '@/services/mairieService';
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
                const [dbZones, result] = await Promise.all([
                    mairieService.getZones(),
                    mairieService.getMairies({
                        org: selectedOrgFilter,
                        page,
                        pageSize: PAGE_SIZE,
                        search: searchQuery || undefined,
                    }),
                ]);
                if (ctrl.signal.aborted) return;
                setMairies(result.data);
                setTotalCount(result.total);
                setZones(dbZones);
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

    const handleExtendMairie = (mairieId: number) => {
        setMairies((prevMairies) => {
            const sourceMairie = prevMairies.find((m) => m.id === mairieId);
            if (!sourceMairie) return prevMairies;
            let serieId = sourceMairie.serieId;
            let updatedMairies = [...prevMairies];
            if (!serieId) {
                serieId = `serie-${Date.now()}`;
                updatedMairies = updatedMairies.map((m) => (m.id === mairieId ? { ...m, serieId } : m));
            }
            const seriesMairies = updatedMairies.filter((m) => m.serieId === serieId);
            const sortedSeries = seriesMairies.sort((a, b) => a.semaineDemandee.localeCompare(b.semaineDemandee));
            const lastMairie = sortedSeries[sortedSeries.length - 1];
            const parsed = parseWeekString(lastMairie.semaineDemandee);
            const nextWeek = parsed
                ? getCalculatedWeekString(parsed.week, 1, parsed.year)
                : getCalculatedWeekString(currentWeek, 1, currentYear);
            const newMairie: Mairie = {
                ...sourceMairie,
                id: Date.now(),
                serieId,
                semaineDemandee: nextWeek,
                etapeProgression: 0,
                statutGeneral: 'À traiter',
                commentaires: [],
                dateDemande: new Date(new Date(lastMairie.dateDemande).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            };
            return [...updatedMairies, newMairie];
        });
        showToast('Mission prolongée d\'une semaine — bientôt persistée', 'info');
    };

    const handleSetMairieDuration = (mairieId: number, targetDuration: number) => {
        setMairies((prevMairies) => {
            const sourceMairie = prevMairies.find((m) => m.id === mairieId);
            if (!sourceMairie) return prevMairies;
            let serieId = sourceMairie.serieId;
            let updatedMairies = [...prevMairies];
            if (!serieId) {
                serieId = `serie-${Date.now()}`;
                updatedMairies = updatedMairies.map((m) => (m.id === mairieId ? { ...m, serieId } : m));
            }
            const seriesMairies = updatedMairies.filter((m) => m.serieId === serieId).sort((a, b) => a.semaineDemandee.localeCompare(b.semaineDemandee));
            const currentCount = seriesMairies.length;
            if (targetDuration > currentCount) {
                const needed = targetDuration - currentCount;
                let lastMairie = seriesMairies[seriesMairies.length - 1];
                for (let i = 0; i < needed; i++) {
                    const parsed = parseWeekString(lastMairie.semaineDemandee);
                    const nextWeek = parsed
                        ? getCalculatedWeekString(parsed.week, 1, parsed.year)
                        : getCalculatedWeekString(currentWeek, 1, currentYear);
                    const newMairie: Mairie = {
                        ...lastMairie,
                        id: Date.now() + i,
                        serieId,
                        semaineDemandee: nextWeek,
                        etapeProgression: 0,
                        statutGeneral: 'À traiter',
                        commentaires: [],
                        dateDemande: new Date(new Date(lastMairie.dateDemande).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    };
                    updatedMairies.push(newMairie);
                    lastMairie = newMairie;
                }
                showToast(`Durée ajustée à ${targetDuration} semaines — bientôt persistée`, 'info');
            } else if (targetDuration < currentCount) {
                const toRemoveCount = currentCount - targetDuration;
                const idsToRemove = seriesMairies.slice(-toRemoveCount).map((m) => m.id);
                updatedMairies = updatedMairies.filter((m) => !idsToRemove.includes(m.id));
                showToast(`Durée ajustée à ${targetDuration} semaines — bientôt persistée`, 'info');
            }
            return updatedMairies;
        });
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
        <section className="animate-fade-in h-full flex flex-col relative">
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

            <header className="mb-4 md:mb-8 flex flex-col gap-4 md:gap-6 flex-shrink-0">
                <div className="flex flex-col md:flex-row justify-between md:items-end mt-2 gap-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)]">Relations Mairie</h2>
                        <div className="flex items-center gap-3 mt-1 md:mt-2">
                            <p className="text-sm md:text-xl text-[var(--text-secondary)] font-medium">Suivi des prises de contact et organisation des tournées.</p>
                            <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                                <Database size={10} /> {totalCount.toLocaleString()} mairies
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 md:gap-3 items-center">
                        <div className="bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-xl p-1 flex items-center shadow-sm mr-4">
                            <button type="button" onClick={() => setViewMode('list')} aria-pressed={viewMode === 'list'} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-orange-100 text-orange-600' : 'text-[var(--text-muted)] hover:text-slate-600'}`} title="Vue Liste">
                                <ListIcon size={20} />
                            </button>
                            <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 mx-1"></div>
                            <button type="button" onClick={() => setViewMode('grid')} aria-pressed={viewMode === 'grid'} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-orange-100 text-orange-600' : 'text-[var(--text-muted)] hover:text-slate-600'}`} title="Vue Grille">
                                <LayoutGrid size={20} />
                            </button>
                        </div>
                        <div className="bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-xl p-1.5 flex items-center gap-2 shadow-sm mr-2">
                            <button type="button" onClick={prevWeek} aria-label="Semaine précédente" className="flex items-center gap-2 text-sm font-bold text-orange-600 bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 px-4 py-2 rounded-lg transition-colors">
                                <ChevronLeft size={16} /> Semaine {currentWeek > 1 ? currentWeek - 1 : yearWeeks}
                            </button>
                            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                            <select aria-label="Semaine" value={currentWeek} onChange={(e) => setCurrentWeek(Number(e.target.value))} className="bg-transparent text-[var(--text-primary)] font-bold text-lg py-1.5 px-3 rounded-lg focus:outline-none cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                                {weeks.map((w) => (<option key={w} value={w}>Semaine {w}</option>))}
                            </select>
                            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                            <button type="button" onClick={nextWeek} aria-label="Semaine suivante" className="flex items-center gap-2 text-sm font-bold text-orange-600 bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 px-4 py-2 rounded-lg transition-colors">
                                Semaine {currentWeek < yearWeeks ? currentWeek + 1 : 1} <ChevronRight size={16} />
                            </button>
                        </div>
                        <button type="button" onClick={handleAddZone} className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white font-bold text-lg rounded-xl hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200">
                            <Plus size={24} /> Créer une Zone
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex gap-1 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-[var(--border-subtle)] w-fit" role="radiogroup" aria-label="Filtre par organisation">
                        <button type="button" role="radio" aria-checked={selectedOrgFilter === 'all'} onClick={() => handleOrgFilterChange('all')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${selectedOrgFilter === 'all' ? 'bg-slate-800 dark:bg-slate-600 text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm'}`}>
                            TOUTES
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
                                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all uppercase flex items-center gap-2 ${isActive ? 'bg-slate-800 text-white shadow-md' : `text-[var(--text-secondary)] hover:bg-white dark:hover:bg-slate-700`}`}
                                >
                                    <img src={info.logo} alt="" aria-hidden="true" className="h-4 w-auto rounded-sm bg-white p-px" />
                                    <span>{conf.label}</span>
                                </button>
                            );
                        })}
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Rechercher une commune..."
                        aria-label="Rechercher une commune"
                        className="px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-card-solid)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] w-64 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    />
                    <span className="text-sm text-[var(--text-muted)] font-medium">{totalCount.toLocaleString()} résultats</span>
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
                <div className="mt-auto bg-slate-100 dark:bg-slate-800 rounded-3xl p-8 border-t border-[var(--border-subtle)]">
                    <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-3">
                        <ListIcon size={28} /> Communes Non Assignées ({unassignedMairies.length})
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
                <nav aria-label="Pagination" className="flex items-center justify-center gap-3 mt-8 mb-4">
                    <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={16} /> Précédent
                    </button>
                    <span aria-current="page" className="text-sm font-bold text-[var(--text-primary)]">
                        Page {page + 1} / {totalPages}
                    </span>
                    <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Suivant <ChevronRight size={16} />
                    </button>
                </nav>
            )}

            <MairieDetailModal mairie={selectedMairie} onClose={() => setSelectedMairie(null)} showToast={(msg, sev) => showToast(msg, sev ?? 'info')} />
        </section>
    );
}
