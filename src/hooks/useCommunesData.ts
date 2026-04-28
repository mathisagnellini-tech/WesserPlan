import { useState, useMemo, useEffect, useRef } from 'react';
import { Commune, Organization } from '@/types';
import { MapCommuneFeature, ProspectHistoryItem } from '@/components/communes/types';
import { useCommunesStore } from '@/stores/communesStore';
import { communesService } from '@/services/communesService';
import { supabasePlan } from '@/lib/supabase';
import { withAudit } from '@/lib/audit';

export function useCommunesData() {
    // Read from Zustand store instead of local state
    const selectedOrg = useCommunesStore((s) => s.selectedOrg);
    const setSelectedOrg = useCommunesStore((s) => s.setSelectedOrg);
    const search = useCommunesStore((s) => s.search);
    const setSearch = useCommunesStore((s) => s.setSearch);
    const mode = useCommunesStore((s) => s.mode);
    const setMode = useCommunesStore((s) => s.setMode);

    // Filters from store
    const selectedRegions = useCommunesStore((s) => s.selectedRegions);
    const setSelectedRegions = useCommunesStore((s) => s.setSelectedRegions);
    const selectedDepts = useCommunesStore((s) => s.selectedDepts);
    const setSelectedDepts = useCommunesStore((s) => s.setSelectedDepts);
    const selectedStatuses = useCommunesStore((s) => s.selectedStatuses);
    const toggleStatus = useCommunesStore((s) => s.toggleStatus);
    const resetStatuses = useCommunesStore((s) => s.resetStatuses);

    // Region filter
    const activeRegion = useCommunesStore((s) => s.activeRegion);
    const setActiveRegion = useCommunesStore((s) => s.setActiveRegion);

    // Selected commune from store
    const selectedCommuneId = useCommunesStore((s) => s.selectedCommuneId);
    const setSelectedCommuneId = useCommunesStore((s) => s.setSelectedCommuneId);

    // Data
    const [localCommunes, setLocalCommunes] = useState<Commune[]>([]);
    const [totalCommunes, setTotalCommunes] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    // Local-only: no Supabase table for prospect history yet — keep sample seed.
    const [pastRequests, setPastRequests] = useState<ProspectHistoryItem[]>([
        {
            id: 'req-1',
            date: new Date(Date.now() - 86400000 * 2),
            communeCount: 12,
            totalPop: 45000,
            zoneCount: "5.6",
            communesList: [
                { nom: 'Saverne', lat: 48.74, lng: 7.36 },
                { nom: 'Marmoutier', lat: 48.69, lng: 7.38 },
                { nom: 'Wasselonne', lat: 48.63, lng: 7.44 }
            ]
        }
    ]);
    const [validationData, setValidationData] = useState<{ communes: MapCommuneFeature[], stats: any } | null>(null);
    const [validationError, setValidationError] = useState<Error | null>(null);
    const [validationSuccess, setValidationSuccess] = useState<{ zoneName: string; count: number } | null>(null);

    // Derive effective filters from Sets (single-select)
    const effectiveRegion = selectedRegions.size > 0
        ? Array.from(selectedRegions)[0]
        : activeRegion;
    const effectiveDept = selectedDepts.size > 0
        ? Array.from(selectedDepts)[0]
        : null;

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();
    useEffect(() => {
        searchTimerRef.current = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(searchTimerRef.current);
    }, [search]);

    const hasFilters = selectedOrg !== 'all' || effectiveRegion || effectiveDept || debouncedSearch.length >= 2;

    // Load from Supabase (plan.town_halls)
    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setError(null);

        // When 'all' with no filters/search, show nothing
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
              }).then(r => ({ communes: r.data, total: r.total }))
            : communesService.getByOrganization(selectedOrg).then(c => ({ communes: c, total: c.length }));

        loadData
            .then(({ communes, total }) => {
                if (cancelled) return;
                setLocalCommunes(communes);
                setTotalCommunes(total);
            })
            .catch((err: Error) => {
                if (cancelled) return;
                setLocalCommunes([]);
                setTotalCommunes(0);
                setError(err);
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedOrg, effectiveRegion, effectiveDept, debouncedSearch]);

    // Derive selectedCommune from store's selectedCommuneId
    const selectedCommune = useMemo(() => {
        if (selectedCommuneId === null) return null;
        return localCommunes.find(c => c.id === selectedCommuneId) || null;
    }, [localCommunes, selectedCommuneId]);

    const setSelectedCommune = (commune: Commune | null) => {
        setSelectedCommuneId(commune ? commune.id : null);
    };

    const handleUpdateCommune = async (id: number, updates: Partial<Commune>) => {
        // Optimistic local update
        setLocalCommunes(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

        // Map Commune fields → DB columns understood by communesService.update
        const dbUpdates: Parameters<typeof communesService.update>[1] = {};
        if (updates.email !== undefined) dbUpdates.email = updates.email ?? '';
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone ?? '';
        if (updates.maire !== undefined) dbUpdates.mayor = updates.maire;
        if (updates.statut !== undefined) {
            const reverseMap: Record<string, string> = {
                'pas_demande': 'pending',
                'informe': 'in_progress',
                'refuse': 'refused',
                'telescope': 'action_required',
                'fait': 'accepted',
            };
            dbUpdates.status = reverseMap[updates.statut] ?? 'pending';
        }

        // Nothing to persist (e.g. only client-only fields touched) → bail
        if (Object.keys(dbUpdates).length === 0) return;

        try {
            await communesService.update(id, dbUpdates);
        } catch (err) {
            console.error('Commune update failed', err);
            // Revert optimistic update by refetching the row
            const fresh = await communesService.getById(id).catch(() => null);
            if (fresh) {
                setLocalCommunes(prev => prev.map(c => c.id === id ? fresh : c));
            }
            setError(err instanceof Error ? err : new Error('Commune update failed'));
        }
    };

    const handleMapValidationRequest = (selectedFeatures: MapCommuneFeature[]) => {
        const pop = selectedFeatures.reduce((acc, f) => acc + f.properties.population, 0);
        setValidationData({
            communes: selectedFeatures,
            stats: {
                count: selectedFeatures.length,
                pop: pop,
                zones: (pop / 8000).toFixed(1)
            }
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
            // 1. Get town_hall IDs matching the selected INSEE codes
            const inseeCodes = communes.map(c => c.properties.code);
            const { data: matchedTownHalls } = await supabasePlan
                .from('town_halls')
                .select('id')
                .in('insee_code', inseeCodes);

            const townHallIds = (matchedTownHalls ?? []).map((t: { id: number }) => t.id);

            // 2. Create zone in plan.zones
            const currentWeek = new Date().toISOString().slice(0, 4) + '-W' + String(Math.ceil((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 604800000)).padStart(2, '0');
            const { error: zoneError } = await supabasePlan
                .from('zones')
                .insert(withAudit({
                    zone_name: zoneName,
                    organization: org,
                    deployment_weeks: [currentWeek],
                    color: org === 'msf' ? '#dc2626' : org === 'unicef' ? '#38bdf8' : org === 'wwf' ? '#16a34a' : '#1e3a8a',
                    town_hall_ids: townHallIds,
                }, 'insert'));

            if (zoneError) throw zoneError;

            // 3. Update town_halls: assign org + set status to in_progress
            if (townHallIds.length > 0) {
                const { error: updateError } = await supabasePlan
                    .from('town_halls')
                    .update(withAudit({
                        organization: org,
                        status: 'in_progress',
                    }, 'update'))
                    .in('id', townHallIds);

                if (updateError) throw updateError;
            }

            // 4. Add to local history
            const newHistoryItem: ProspectHistoryItem = {
                id: `req-${Date.now()}`,
                date: new Date(),
                communeCount: stats.count,
                totalPop: stats.pop,
                zoneCount: stats.zones,
                communesList: communes.map(c => ({
                    nom: c.properties.nom,
                    lat: c.properties.lat || 0,
                    lng: c.properties.lng || 0
                }))
            };
            setPastRequests(prev => [newHistoryItem, ...prev]);

            // 5. Close & confirm
            setValidationData(null);
            setValidationSuccess({ zoneName, count: townHallIds.length });

        } catch (err) {
            console.error('Validation failed:', err);
            setValidationError(err instanceof Error ? err : new Error('Erreur lors de la création de la zone.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Fetch regions + departments from Supabase
    const [availableRegionsOptions, setAvailableRegionsOptions] = useState<{ value: string; label: string }[]>([]);
    const [allDepts, setAllDepts] = useState<{ value: string; label: string; region: string }[]>([]);
    const [geoError, setGeoError] = useState<Error | null>(null);

    useEffect(() => {
        communesService.getRegionsAndDepartments()
            .then(({ regions, departments }) => {
                setAvailableRegionsOptions(regions);
                setAllDepts(departments);
            })
            .catch((err: Error) => setGeoError(err));
    }, []);

    // Filter departments by selected region (activeRegion is a plain string, reliable)
    const availableDeptsOptions = useMemo(() => {
        if (activeRegion) {
            return allDepts.filter(d => d.region === activeRegion);
        }
        return allDepts;
    }, [allDepts, activeRegion]);

    // Client-side filtering: only status (search + geo are server-side)
    const filteredCommunes = useMemo(() => {
        if (selectedStatuses.size === 0) return localCommunes;
        return localCommunes.filter(c => selectedStatuses.has(c.statut));
    }, [localCommunes, selectedStatuses]);

    return {
        // Mode
        mode, setMode,
        // Org
        selectedOrg, setSelectedOrg,
        // Region
        activeRegion, setActiveRegion,
        // Search
        search, setSearch,
        // Filters
        selectedRegions, setSelectedRegions,
        selectedDepts, setSelectedDepts,
        selectedStatuses, toggleStatus, resetStatuses,
        availableRegionsOptions, availableDeptsOptions,
        // Data
        localCommunes, filteredCommunes, totalCommunes,
        selectedCommune, setSelectedCommune,
        handleUpdateCommune,
        isLoading, isSubmitting, effectiveDept,
        // Errors / surfacing
        error,
        geoError,
        validationError,
        validationSuccess,
        setValidationError,
        setValidationSuccess,
        // Map/Prospection
        pastRequests,
        validationData, setValidationData,
        handleMapValidationRequest, handleConfirmValidation,
    };
}
