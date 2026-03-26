import { useState, useMemo, useEffect } from 'react';
import { Commune, Organization, CommuneStatus } from '@/types';
import { communesData, departmentMap, departmentToRegionMap } from '@/constants';
import { MapCommuneFeature, ProspectHistoryItem } from '@/components/communes/types';

export function useCommunesData() {
    const [selectedOrg, setSelectedOrg] = useState<Organization>('msf');
    const [search, setSearch] = useState('');
    const [mode, setMode] = useState<'list' | 'map'>('list');

    // Filters
    const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set());
    const [selectedDepts, setSelectedDepts] = useState<Set<string>>(new Set());
    const [selectedStatuses, setSelectedStatuses] = useState<Set<CommuneStatus>>(new Set());

    // Data
    const [localCommunes, setLocalCommunes] = useState<Commune[]>([]);
    const [selectedCommune, setSelectedCommune] = useState<Commune | null>(null);
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

    // Init local data on mount or org change
    useEffect(() => {
        setLocalCommunes(communesData[selectedOrg]);
        setSelectedCommune(null);
    }, [selectedOrg]);

    // Update selected commune if local data changes
    useEffect(() => {
        if (selectedCommune) {
            const updated = localCommunes.find(c => c.id === selectedCommune.id);
            if (updated) setSelectedCommune(updated);
        }
    }, [localCommunes]);

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

    const toggleStatus = (status: CommuneStatus) => {
        const newSet = new Set(selectedStatuses);
        if (newSet.has(status)) {
            newSet.delete(status);
        } else {
            newSet.add(status);
        }
        setSelectedStatuses(newSet);
    };

    const resetStatuses = () => setSelectedStatuses(new Set());

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
        // Map/Prospection
        pastRequests,
        validationData, setValidationData,
        handleMapValidationRequest, handleConfirmValidation,
    };
}
