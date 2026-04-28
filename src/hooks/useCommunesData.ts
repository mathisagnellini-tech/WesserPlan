import { useState, useMemo, useEffect, useRef } from 'react';
import { Commune, Organization } from '@/types';
import { MapCommuneFeature, ProspectHistoryItem } from '@/components/communes/types';
import { useCommunesStore } from '@/stores/communesStore';
import { communesService } from '@/services/communesService';
import { supabasePlan } from '@/lib/supabase';
import { withAudit } from '@/lib/audit';
import { reporter } from '@/lib/observability';
import { computeIsoWeek } from '@/lib/isoWeek';
import { uiStatusToDb } from '@/lib/communeStatus';
import { ORGANIZATIONS } from '@/constants/organizations';

export function useCommunesData() {
    // Read from Zustand store instead of local state
    const selectedOrg = useCommunesStore((s) => s.selectedOrg);
    const setSelectedOrg = useCommunesStore((s) => s.setSelectedOrg);
    const search = useCommunesStore((s) => s.search);
    const setSearch = useCommunesStore((s) => s.setSearch);
    const mode = useCommunesStore((s) => s.mode);
    const setMode = useCommunesStore((s) => s.setMode);

    const selectedRegions = useCommunesStore((s) => s.selectedRegions);
    const setSelectedRegions = useCommunesStore((s) => s.setSelectedRegions);
    const selectedDepts = useCommunesStore((s) => s.selectedDepts);
    const setSelectedDepts = useCommunesStore((s) => s.setSelectedDepts);
    const selectedStatuses = useCommunesStore((s) => s.selectedStatuses);
    const toggleStatus = useCommunesStore((s) => s.toggleStatus);
    const resetStatuses = useCommunesStore((s) => s.resetStatuses);

    const activeRegion = useCommunesStore((s) => s.activeRegion);
    const setActiveRegion = useCommunesStore((s) => s.setActiveRegion);

    const selectedCommuneId = useCommunesStore((s) => s.selectedCommuneId);
    const setSelectedCommuneId = useCommunesStore((s) => s.setSelectedCommuneId);

    const [localCommunes, setLocalCommunes] = useState<Commune[]>([]);
    const [totalCommunes, setTotalCommunes] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [updateError, setUpdateError] = useState<Error | null>(null);

    // Past prospect requests are stored client-only for now — the previous
    // hardcoded sample seed has been removed (it shipped to every user as if
    // they had a real history). Once a `plan.prospect_requests` table exists,
    // load it via service here.
    const [pastRequests, setPastRequests] = useState<ProspectHistoryItem[]>([]);

    const [validationData, setValidationData] = useState<{ communes: MapCommuneFeature[]; stats: { count: number; pop: number; zones: string } } | null>(null);
    const [validationError, setValidationError] = useState<Error | null>(null);
    const [validationSuccess, setValidationSuccess] = useState<{ zoneName: string; count: number } | null>(null);

    const effectiveRegion = selectedRegions.size > 0 ? Array.from(selectedRegions)[0] : activeRegion;
    const effectiveDept = selectedDepts.size > 0 ? Array.from(selectedDepts)[0] : null;

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => {
        searchTimerRef.current = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(searchTimerRef.current);
    }, [search]);

    const hasFilters = selectedOrg !== 'all' || effectiveRegion || effectiveDept || debouncedSearch.length >= 2;

    useEffect(() => {
        const ctrl = new AbortController();
        setIsLoading(true);
        setError(null);

        if (!hasFilters) {
            setLocalCommunes([]);
            setTotalCommunes(0);
            setIsLoading(false);
            return;
        }

        const loadData = selectedOrg === 'all'
            ? communesService.getAll(500, {
                region: effectiveRegion ?? undefined,
                departments: effectiveDept ? [effectiveDept] : undefined,
                search: debouncedSearch.length >= 2 ? debouncedSearch : undefined,
            }).then((r) => ({ communes: r.data, total: r.total }))
            : communesService.getByOrganization(selectedOrg).then((c) => ({ communes: c, total: c.length }));

        loadData
            .then(({ communes, total }) => {
                if (ctrl.signal.aborted) return;
                setLocalCommunes(communes);
                setTotalCommunes(total);
            })
            .catch((err: Error) => {
                if (ctrl.signal.aborted) return;
                setLocalCommunes([]);
                setTotalCommunes(0);
                setError(err);
                reporter.error('communes load failed', err, { source: 'useCommunesData' });
            })
            .finally(() => {
                if (!ctrl.signal.aborted) setIsLoading(false);
            });

        return () => ctrl.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedOrg, effectiveRegion, effectiveDept, debouncedSearch]);

    const selectedCommune = useMemo(() => {
        if (selectedCommuneId === null) return null;
        return localCommunes.find((c) => c.id === selectedCommuneId) || null;
    }, [localCommunes, selectedCommuneId]);

    const setSelectedCommune = (commune: Commune | null) => {
        setSelectedCommuneId(commune ? commune.id : null);
    };

    const handleUpdateCommune = async (id: number, updates: Partial<Commune>) => {
        // Optimistic local update
        setLocalCommunes((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
        setUpdateError(null);

        const dbUpdates: Parameters<typeof communesService.update>[1] = {};
        if (updates.email !== undefined) dbUpdates.email = updates.email ?? '';
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone ?? '';
        if (updates.maire !== undefined) dbUpdates.mayor = updates.maire;
        if (updates.statut !== undefined) {
            dbUpdates.status = uiStatusToDb(updates.statut);
        }

        if (Object.keys(dbUpdates).length === 0) return;

        try {
            await communesService.update(id, dbUpdates);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Commune update failed');
            reporter.error('Commune update failed', err, { source: 'useCommunesData', tags: { id } });
            // Revert optimistic update by refetching the row
            const fresh = await communesService.getById(id).catch(() => null);
            if (fresh) {
                setLocalCommunes((prev) => prev.map((c) => (c.id === id ? fresh : c)));
            }
            setUpdateError(error);
        }
    };

    const handleMapValidationRequest = (selectedFeatures: MapCommuneFeature[]) => {
        const pop = selectedFeatures.reduce((acc, f) => acc + f.properties.population, 0);
        setValidationData({
            communes: selectedFeatures,
            stats: {
                count: selectedFeatures.length,
                pop,
                zones: (pop / 8000).toFixed(1),
            },
        });
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirmValidation = async (org: Organization, zoneName: string) => {
        if (!validationData) return;
        setIsSubmitting(true);
        setValidationError(null);
        setValidationSuccess(null);

        const { communes, stats } = validationData;

        try {
            const inseeCodes = communes.map((c) => c.properties.code);
            const { data: matchedTownHalls, error: lookupError } = await supabasePlan
                .from('town_halls')
                .select('id')
                .in('insee_code', inseeCodes);
            if (lookupError) throw lookupError;

            const townHallIds = (matchedTownHalls ?? []).map((t: { id: number }) => t.id);

            const now = new Date();
            // ISO 8601 week label (`2026-W18`) — uses the shared computeIsoWeek
            // helper so years rolling over (week 53) and Jan 1 edge cases stay
            // correct. The previous inline math was naive day-count.
            const isoWeek = computeIsoWeek(now);
            const currentWeek = `${now.getFullYear()}-W${String(isoWeek).padStart(2, '0')}`;

            const { error: zoneError } = await supabasePlan
                .from('zones')
                .insert(
                    withAudit(
                        {
                            zone_name: zoneName,
                            organization: org,
                            deployment_weeks: [currentWeek],
                            color: ORGANIZATIONS[org]?.color ?? '#FF5B2B',
                            town_hall_ids: townHallIds,
                        },
                        'insert',
                    ),
                );
            if (zoneError) throw zoneError;

            if (townHallIds.length > 0) {
                const { error: updateError } = await supabasePlan
                    .from('town_halls')
                    .update(
                        withAudit(
                            {
                                organization: org,
                                status: 'in_progress',
                            },
                            'update',
                        ),
                    )
                    .in('id', townHallIds);
                if (updateError) throw updateError;
            }

            const newHistoryItem: ProspectHistoryItem = {
                id: `req-${Date.now()}`,
                date: new Date(),
                communeCount: stats.count,
                totalPop: stats.pop,
                zoneCount: stats.zones,
                communesList: communes.map((c) => ({
                    nom: c.properties.nom,
                    lat: c.properties.lat || 0,
                    lng: c.properties.lng || 0,
                })),
            };
            setPastRequests((prev) => [newHistoryItem, ...prev]);

            // Refresh visible communes so the new org assignment / status is
            // reflected in the list without a manual reload.
            try {
                if (selectedOrg === 'all') {
                    const refreshed = await communesService.getAll(500, {
                        region: effectiveRegion ?? undefined,
                        departments: effectiveDept ? [effectiveDept] : undefined,
                        search: debouncedSearch.length >= 2 ? debouncedSearch : undefined,
                    });
                    setLocalCommunes(refreshed.data);
                    setTotalCommunes(refreshed.total);
                }
            } catch (refreshErr) {
                reporter.warn('post-validation refresh failed', refreshErr, { source: 'useCommunesData' });
            }

            setValidationData(null);
            setValidationSuccess({ zoneName, count: townHallIds.length });
        } catch (err) {
            reporter.error('Validation failed', err, { source: 'useCommunesData' });
            setValidationError(err instanceof Error ? err : new Error('Erreur lors de la création de la zone.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const [availableRegionsOptions, setAvailableRegionsOptions] = useState<{ value: string; label: string }[]>([]);
    const [allDepts, setAllDepts] = useState<{ value: string; label: string; region: string }[]>([]);
    const [geoError, setGeoError] = useState<Error | null>(null);

    useEffect(() => {
        const ctrl = new AbortController();
        communesService
            .getRegionsAndDepartments()
            .then(({ regions, departments }) => {
                if (ctrl.signal.aborted) return;
                setAvailableRegionsOptions(regions);
                setAllDepts(departments);
            })
            .catch((err: Error) => {
                if (ctrl.signal.aborted) return;
                setGeoError(err);
                reporter.error('getRegionsAndDepartments failed', err, { source: 'useCommunesData' });
            });
        return () => ctrl.abort();
    }, []);

    const availableDeptsOptions = useMemo(() => {
        if (activeRegion) {
            return allDepts.filter((d) => d.region === activeRegion);
        }
        return allDepts;
    }, [allDepts, activeRegion]);

    const filteredCommunes = useMemo(() => {
        if (selectedStatuses.size === 0) return localCommunes;
        return localCommunes.filter((c) => selectedStatuses.has(c.statut));
    }, [localCommunes, selectedStatuses]);

    return {
        mode, setMode,
        selectedOrg, setSelectedOrg,
        activeRegion, setActiveRegion,
        search, setSearch,
        selectedRegions, setSelectedRegions,
        selectedDepts, setSelectedDepts,
        selectedStatuses, toggleStatus, resetStatuses,
        availableRegionsOptions, availableDeptsOptions,
        localCommunes, filteredCommunes, totalCommunes,
        selectedCommune, setSelectedCommune,
        handleUpdateCommune,
        isLoading, isSubmitting, effectiveDept,
        error,
        geoError,
        updateError,
        setUpdateError,
        validationError,
        validationSuccess,
        setValidationError,
        setValidationSuccess,
        pastRequests,
        validationData, setValidationData,
        handleMapValidationRequest, handleConfirmValidation,
    };
}
