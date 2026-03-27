import { useState, useMemo, useEffect } from 'react';
import { Commune } from '@/types';
import { communesData, departmentMap, departmentToRegionMap } from '@/constants';
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

    // Selected commune from store
    const selectedCommuneId = useCommunesStore((s) => s.selectedCommuneId);
    const setSelectedCommuneId = useCommunesStore((s) => s.setSelectedCommuneId);

    // Data
    const [localCommunes, setLocalCommunes] = useState<Commune[]>([]);
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

    // Try Supabase first, fall back to mock data
    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);

        communesService.getByOrganization(selectedOrg)
            .then(data => {
                if (cancelled) return;
                if (data.length > 0) {
                    setLocalCommunes(data);
                    setDataSource('supabase');
                } else {
                    // Supabase returned empty — use mocks
                    setLocalCommunes(communesData[selectedOrg]);
                    setDataSource('mock');
                }
            })
            .catch(() => {
                if (cancelled) return;
                // Supabase unavailable — use mocks
                setLocalCommunes(communesData[selectedOrg]);
                setDataSource('mock');
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => { cancelled = true; };
    }, [selectedOrg]);

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

    // Compute Options for filters
    const availableDeptsOptions = useMemo(() => {
        const allDepts = Object.keys(departmentMap).sort();
        return allDepts.map(code => ({ value: code, label: `${code} - ${departmentMap[code] || ''}` }));
    }, [localCommunes]);

    const availableRegionsOptions = useMemo(() => {
        const regions = new Set<string>(Object.values(departmentToRegionMap));
        return Array.from(regions).sort().map(r => ({ value: r, label: r }));
    }, []);

    const filteredCommunes = useMemo(() => {
        return localCommunes.filter(c => {
            const matchesSearch = c.nom.toLowerCase().includes(search.toLowerCase()) || c.departement.includes(search);
            const matchesStatus = selectedStatuses.size === 0 || selectedStatuses.has(c.statut);

            let matchesGeo = true;
            if (selectedRegions.size > 0 || selectedDepts.size > 0) {
                const region = departmentToRegionMap[c.departement];
                const inRegion = region ? selectedRegions.has(region) : false;
                const inDept = selectedDepts.has(c.departement);
                matchesGeo = inRegion || inDept;
            }

            return matchesSearch && matchesStatus && matchesGeo;
        });
    }, [localCommunes, search, selectedRegions, selectedDepts, selectedStatuses]);

    return {
        // Mode
        mode, setMode,
        // Org
        selectedOrg, setSelectedOrg,
        // Search
        search, setSearch,
        // Filters
        selectedRegions, setSelectedRegions,
        selectedDepts, setSelectedDepts,
        selectedStatuses, toggleStatus, resetStatuses,
        availableRegionsOptions, availableDeptsOptions,
        // Data
        localCommunes, filteredCommunes,
        selectedCommune, setSelectedCommune,
        handleUpdateCommune,
        isLoading, dataSource,
        // Map/Prospection
        pastRequests,
        validationData, setValidationData,
        handleMapValidationRequest, handleConfirmValidation,
    };
}
