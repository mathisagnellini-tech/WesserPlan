import { useState, useMemo, useEffect, useRef } from 'react';
import { Commune } from '@/types';
import { communesData } from '@/constants';
import { MapCommuneFeature, ProspectHistoryItem } from '@/components/communes/types';
import { useCommunesStore } from '@/stores/communesStore';
import { communesService } from '@/services/communesService';

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
    const [dataSource, setDataSource] = useState<'supabase' | 'mock'>('mock');
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

        // When 'all' with no filters/search, show nothing
        if (!hasFilters) {
            setLocalCommunes([]);
            setTotalCommunes(0);
            setDataSource('supabase');
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
                if (communes.length > 0) {
                    setLocalCommunes(communes);
                    setTotalCommunes(total);
                    setDataSource('supabase');
                } else if (selectedOrg !== 'all' && communesData[selectedOrg]) {
                    setLocalCommunes(communesData[selectedOrg]);
                    setTotalCommunes(communesData[selectedOrg].length);
                    setDataSource('mock');
                } else {
                    setLocalCommunes([]);
                    setTotalCommunes(0);
                    setDataSource('supabase');
                }
            })
            .catch(() => {
                if (cancelled) return;
                if (selectedOrg !== 'all' && communesData[selectedOrg]) {
                    setLocalCommunes(communesData[selectedOrg]);
                    setTotalCommunes(communesData[selectedOrg].length);
                    setDataSource('mock');
                } else {
                    setLocalCommunes([]);
                    setTotalCommunes(0);
                }
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

    const handleUpdateCommune = (id: number, updates: Partial<Commune>) => {
        setLocalCommunes(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
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

    const handleConfirmValidation = () => {
        if (!validationData) return;

        const { communes, stats } = validationData;

        // 1. Convert features to communes and add/update them
        const newCommunes: Commune[] = communes.map((f, idx) => ({
            id: Date.now() + idx,
            nom: f.properties.nom,
            departement: f.properties.code.substring(0, 2),
            population: f.properties.population,
            passage: 'Jamais',
            statut: 'pas_demande',
            maire: 'Non renseigné',
            revenue: `${Math.floor(f.properties.revenue)} €`,
            lat: 0,
            lng: 0,
            email: '',
            phone: ''
        }));

        setLocalCommunes(prev => [...prev, ...newCommunes]);

        // 2. Add to History
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

        // 3. Close & Reset
        setValidationData(null);
        alert(`Demande validée ! Email automatique programmé pour ${stats.count} mairies.`);
    };

    // Fetch regions + departments from Supabase
    const [availableRegionsOptions, setAvailableRegionsOptions] = useState<{ value: string; label: string }[]>([]);
    const [allDepts, setAllDepts] = useState<{ value: string; label: string; region: string }[]>([]);

    useEffect(() => {
        communesService.getRegionsAndDepartments()
            .then(({ regions, departments }) => {
                setAvailableRegionsOptions(regions);
                setAllDepts(departments);
            })
            .catch(() => {});
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

    // Available regions from Supabase (already fetched above)
    const availableSupabaseRegions = availableRegionsOptions;

    return {
        // Mode
        mode, setMode,
        // Org
        selectedOrg, setSelectedOrg,
        // Region
        activeRegion, setActiveRegion,
        availableSupabaseRegions,
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
        isLoading, dataSource,
        // Map/Prospection
        pastRequests,
        validationData, setValidationData,
        handleMapValidationRequest, handleConfirmValidation,
    };
}
