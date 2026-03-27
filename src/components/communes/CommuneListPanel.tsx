import React from 'react';
import { Commune, Organization, CommuneStatus } from '@/types';
import { statusMap } from '@/constants';
import { Search, MapPin, Users, Euro, Check, List as ListIcon, Map as MapIcon, MousePointer2, History, Loader2 } from 'lucide-react';
import { QuickStatusDropdown } from '@/components/communes/QuickStatusDropdown';
import { MultiSelectFilter } from '@/components/communes/MultiSelectFilter';
import { SingleSelectFilter } from '@/components/communes/SingleSelectFilter';
import { MiniZoneVisualizer } from '@/components/communes/MiniZoneVisualizer';
import { ProspectHistoryItem } from '@/components/communes/types';

interface CommuneListPanelProps {
    mode: 'list' | 'map';
    setMode: (mode: 'list' | 'map') => void;
    selectedOrg: Organization | 'all';
    setSelectedOrg: (org: Organization | 'all') => void;
    activeRegion: string | null;
    setActiveRegion: (region: string | null) => void;
    availableSupabaseRegions: { region: string; count: number }[];
    isLoading?: boolean;
    search: string;
    setSearch: (search: string) => void;
    selectedRegions: Set<string>;
    setSelectedRegions: (regions: Set<string>) => void;
    selectedDepts: Set<string>;
    setSelectedDepts: (depts: Set<string>) => void;
    selectedStatuses: Set<CommuneStatus>;
    toggleStatus: (status: CommuneStatus) => void;
    resetStatuses: () => void;
    availableRegionsOptions: { value: string; label: string }[];
    availableDeptsOptions: { value: string; label: string }[];
    filteredCommunes: Commune[];
    totalCommunes: number;
    selectedCommune: Commune | null;
    setSelectedCommune: (commune: Commune | null) => void;
    onUpdateCommune: (id: number, updates: Partial<Commune>) => void;
    pastRequests: ProspectHistoryItem[];
}

export const CommuneListPanel: React.FC<CommuneListPanelProps> = ({
    mode, setMode,
    selectedOrg, setSelectedOrg,
    activeRegion, setActiveRegion, availableSupabaseRegions,
    isLoading,
    search, setSearch,
    selectedRegions, setSelectedRegions,
    selectedDepts, setSelectedDepts,
    selectedStatuses, toggleStatus, resetStatuses,
    availableRegionsOptions, availableDeptsOptions,
    filteredCommunes, totalCommunes,
    selectedCommune, setSelectedCommune,
    onUpdateCommune,
    pastRequests,
}) => {
    return (
        <div className="w-full md:w-[480px] flex flex-col bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl shadow-sm border border-[var(--border-subtle)] overflow-hidden flex-shrink-0">
            <div className="p-4 border-b border-[var(--border-subtle)] bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                        {mode === 'list' ? <ListIcon className="text-orange-600"/> : <MapIcon className="text-emerald-600"/>}
                        {mode === 'list' ? 'Liste des Communes' : 'Prospection Carte'}
                    </h2>
                    {/* MODE SWITCHER */}
                    <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-lg">
                        <button
                            onClick={() => setMode('list')}
                            className={`p-2 rounded-md transition-all ${mode === 'list' ? 'bg-white dark:bg-[var(--bg-card-solid)] text-orange-600 shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                            title="Vue Liste"
                        >
                            <ListIcon size={18} />
                        </button>
                        <button
                            onClick={() => setMode('map')}
                            className={`p-2 rounded-md transition-all ${mode === 'map' ? 'bg-white dark:bg-[var(--bg-card-solid)] text-emerald-600 shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                            title="Vue Prospection"
                        >
                            <MapIcon size={18} />
                        </button>
                    </div>
                </div>

                {/* Org Switcher */}
                <div className="flex gap-2">
                     <button
                        onClick={() => setSelectedOrg('all')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase transition-all border ${selectedOrg === 'all' ? 'bg-slate-800 dark:bg-slate-600 text-white border-slate-800 dark:border-slate-600' : 'bg-white dark:bg-[var(--bg-card-solid)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                     >
                         Tous
                     </button>
                     {(['msf', 'unicef', 'wwf', 'mdm'] as Organization[]).map(org => (
                         <button
                            key={org}
                            onClick={() => setSelectedOrg(org)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase transition-all border ${selectedOrg === org ? 'bg-slate-800 text-white border-slate-800' : 'bg-white dark:bg-[var(--bg-card-solid)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                         >
                             {org}
                         </button>
                     ))}
                </div>


                {/* Filters Section */}
                <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]/50">
                    {mode === 'list' && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16}/>
                            <input
                                type="text"
                                placeholder="Rechercher une ville..."
                                className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-[var(--bg-card-solid)]"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Region & Department Dropdowns */}
                    <div className="space-y-2">
                        <select
                            value={activeRegion ?? ''}
                            onChange={(e) => {
                                const val = e.target.value || null;
                                setActiveRegion(val);
                                setSelectedRegions(val ? new Set([val]) : new Set());
                                setSelectedDepts(new Set());
                            }}
                            className="w-full px-3 pr-8 py-2.5 text-xs font-semibold rounded-lg border border-[var(--border-subtle)] bg-slate-50 dark:bg-slate-800/50 text-[var(--text-primary)] focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20 transition-colors appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_8px_center] bg-no-repeat"
                        >
                            <option value="">Toutes les régions</option>
                            {availableRegionsOptions.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>

                        <select
                            value={selectedDepts.size > 0 ? Array.from(selectedDepts)[0] : ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedDepts(val ? new Set([val]) : new Set());
                            }}
                            disabled={availableDeptsOptions.length === 0}
                            className="w-full px-3 pr-8 py-2.5 text-xs font-semibold rounded-lg border border-[var(--border-subtle)] bg-slate-50 dark:bg-slate-800/50 text-[var(--text-primary)] focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20 transition-colors appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_8px_center] bg-no-repeat disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-[image:none]"
                        >
                            <option value="">{activeRegion ? 'Tous les départements' : 'Sélectionner une région d\'abord'}</option>
                            {availableDeptsOptions.map(d => (
                                <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                        </select>
                    </div>

                    {mode === 'list' && (
                        <div className="grid grid-cols-5 gap-1.5">
                            {(['pas_demande', 'informe', 'refuse', 'telescope', 'fait'] as CommuneStatus[]).map(status => {
                                const isSelected = selectedStatuses.has(status);
                                const conf = statusMap[status];
                                return (
                                    <button
                                        key={status}
                                        onClick={() => toggleStatus(status)}
                                        className={`px-2 py-1.5 rounded-md text-[10px] font-bold uppercase border transition-all flex items-center justify-center gap-1
                                        ${isSelected
                                            ? `${conf.bg} ${conf.color} border-${conf.color.split('-')[1]}-200 shadow-sm`
                                            : 'bg-white dark:bg-[var(--bg-card-solid)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:border-slate-300 dark:hover:border-slate-500'
                                        }`}
                                    >
                                        {isSelected && <Check size={10} strokeWidth={4}/>}
                                        {conf.text}
                                    </button>
                                );
                            })}
                            {selectedStatuses.size > 0 && (
                                <button onClick={resetStatuses} className="text-[10px] text-[var(--text-muted)] underline px-1">Reset</button>
                            )}
                        </div>
                    )}

                    {mode === 'map' && (
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg border border-orange-100 dark:border-orange-500/20 text-xs text-orange-800 dark:text-orange-300">
                            <p className="font-bold flex items-center gap-1"><MousePointer2 size={12}/> Mode Prospection</p>
                            <p className="opacity-80 mt-1">Sélectionnez les départements ci-dessus pour charger la carte, puis utilisez le pinceau pour sélectionner des communes.</p>
                        </div>
                    )}
                </div>
            </div>

            {mode === 'list' && (
                <>
                    <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-2">
                        {isLoading ? (
                            <div className="p-8 flex items-center justify-center gap-2 text-[var(--text-muted)] text-sm">
                                <Loader2 size={16} className="animate-spin" /> Chargement...
                            </div>
                        ) : selectedOrg === 'all' && filteredCommunes.length === 0 ? (
                            <div className="p-8 text-center text-[var(--text-muted)] text-sm">
                                <MapPin size={24} className="mx-auto mb-2 opacity-40" />
                                <p className="font-semibold">Sélectionnez une région ou un département</p>
                                <p className="text-xs mt-1">Utilisez les filtres ci-dessous pour afficher les communes.</p>
                            </div>
                        ) : filteredCommunes.length > 0 ? (
                            filteredCommunes.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => setSelectedCommune(c)}
                                    className={`p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md ${selectedCommune?.id === c.id ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-500/20 ring-1 ring-orange-200 dark:ring-orange-500/20' : 'bg-white dark:bg-[var(--bg-card-solid)] border-[var(--border-subtle)] hover:border-orange-100 dark:hover:border-orange-500/30'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-[var(--text-primary)]">{c.nom}</h3>
                                        <QuickStatusDropdown
                                            currentStatus={c.statut}
                                            onSelect={(newStatus) => onUpdateCommune(c.id, { statut: newStatus })}
                                        />
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                                        <div className="flex items-center gap-1"><MapPin size={12}/> {c.departement}</div>
                                        <div className="flex items-center gap-1"><Users size={12}/> {c.population.toLocaleString()}</div>
                                        <div className="flex items-center gap-1"><Euro size={12}/> {c.revenue}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-[var(--text-muted)] text-sm italic">
                                Aucune commune ne correspond aux filtres.
                            </div>
                        )}
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-[var(--border-subtle)] text-center text-xs font-bold text-[var(--text-secondary)]">
                        {filteredCommunes.length}{totalCommunes > filteredCommunes.length ? ` sur ${totalCommunes.toLocaleString()}` : ''} communes
                    </div>
                </>
            )}

            {/* HISTORY SIDEBAR FOR MAP MODE */}
            {mode === 'map' && (
                <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-4">
                     <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2 mb-2">
                        <History size={16}/> Mes dernières demandes
                     </h3>
                     {pastRequests.map(req => (
                         <div key={req.id} className="bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
                             <div className="flex justify-between items-start mb-2">
                                 <div>
                                     <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{req.date.toLocaleDateString()}</span>
                                     <div className="font-bold text-[var(--text-primary)]">{req.communeCount} Communes</div>
                                 </div>
                                 <div className="text-right">
                                     <div className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 rounded">{req.zoneCount} Zones</div>
                                     <div className="text-[10px] text-[var(--text-muted)]">{(req.totalPop/1000).toFixed(1)}k hab.</div>
                                 </div>
                             </div>

                             {/* Mini Map Visualizer */}
                             <div className="mb-2">
                                 <MiniZoneVisualizer points={req.communesList} />
                             </div>

                             <div className="text-xs text-[var(--text-secondary)] truncate">
                                 {req.communesList.slice(0, 3).map(c => c.nom).join(', ')}...
                             </div>
                         </div>
                     ))}
                </div>
            )}
        </div>
    );
};
