import React from 'react';
import { Commune, Organization, CommuneStatus } from '@/types';
import { statusMap } from '@/constants';
import { ORG_LIST, ORGANIZATIONS } from '@/constants/organizations';
import { Search, MapPin, Users, Euro, Check, List as ListIcon, Map as MapIcon, MousePointer2, History } from 'lucide-react';
import { QuickStatusDropdown } from '@/components/communes/QuickStatusDropdown';
import { MiniZoneVisualizer } from '@/components/communes/MiniZoneVisualizer';
import { ProspectHistoryItem } from '@/components/communes/types';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

const STATUS_BORDER: Record<CommuneStatus, string> = {
    pas_demande: 'border-slate-200 dark:border-slate-700',
    informe: 'border-amber-200 dark:border-amber-500/30',
    refuse: 'border-red-200 dark:border-red-500/30',
    telescope: 'border-purple-200 dark:border-purple-500/30',
    fait: 'border-emerald-200 dark:border-emerald-500/30',
};

interface CommuneListPanelProps {
    mode: 'list' | 'map';
    setMode: (mode: 'list' | 'map') => void;
    selectedOrg: Organization | 'all';
    setSelectedOrg: (org: Organization | 'all') => void;
    activeRegion: string | null;
    setActiveRegion: (region: string | null) => void;
    isLoading?: boolean;
    loadError?: Error | null;
    geoError?: Error | null;
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
    activeRegion, setActiveRegion,
    isLoading,
    loadError,
    geoError,
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
                    <h2 className="display text-[var(--text-primary)] text-xl tracking-tight leading-tight flex items-center gap-2">
                        {mode === 'list' ? <ListIcon size={18} strokeWidth={2.2} className="text-orange-600"/> : <MapIcon size={18} strokeWidth={2.2} className="text-emerald-600"/>}
                        {mode === 'list' ? 'Liste des communes' : 'Prospection · carte'}
                    </h2>
                    <div className="seg shrink-0">
                        <button
                            onClick={() => setMode('list')}
                            data-active={mode === 'list'}
                            title="Vue liste"
                            aria-label="Vue liste"
                        >
                            <ListIcon size={14} strokeWidth={2.2} />
                        </button>
                        <button
                            onClick={() => setMode('map')}
                            data-active={mode === 'map'}
                            title="Vue prospection"
                            aria-label="Vue prospection"
                        >
                            <MapIcon size={14} strokeWidth={2.2} />
                        </button>
                    </div>
                </div>

                {/* Org Switcher — driven by canonical ORG_LIST. Logos sit on top
                    of the abbreviated label (back-office org assets). */}
                <div className="flex gap-1.5 flex-wrap" role="radiogroup" aria-label="Organisation">
                    <button
                        type="button"
                        role="radio"
                        aria-checked={selectedOrg === 'all'}
                        onClick={() => setSelectedOrg('all')}
                        className={`flex-1 min-w-[60px] py-1.5 rounded-lg text-[12px] font-medium tracking-tight transition active:translate-y-[1px] border ${selectedOrg === 'all' ? 'bg-orange-50 text-orange-700 border-orange-200 ring-1 ring-orange-100 dark:bg-orange-500/15 dark:text-orange-200 dark:border-orange-500/30 dark:ring-orange-500/25' : 'bg-white dark:bg-[var(--bg-card-solid)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-orange-200 dark:hover:border-orange-500/30'}`}
                    >
                        Toutes
                    </button>
                    {ORG_LIST.map((org) => {
                        const info = ORGANIZATIONS[org];
                        const isActive = selectedOrg === org;
                        return (
                            <button
                                type="button"
                                key={org}
                                role="radio"
                                aria-checked={isActive}
                                onClick={() => setSelectedOrg(org)}
                                title={info.name}
                                className={`flex-1 min-w-[60px] py-1 px-1.5 rounded-lg text-[12px] font-medium tracking-tight transition active:translate-y-[1px] border flex items-center justify-center gap-1.5 ${isActive ? 'bg-orange-50 text-orange-700 border-orange-200 ring-1 ring-orange-100 dark:bg-orange-500/15 dark:text-orange-200 dark:border-orange-500/30 dark:ring-orange-500/25' : 'bg-white dark:bg-[var(--bg-card-solid)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-orange-200 dark:hover:border-orange-500/30'}`}
                            >
                                <img src={info.logo} alt="" aria-hidden="true" className="h-3.5 w-auto rounded-sm bg-white p-px" />
                                <span>{info.shortName}</span>
                            </button>
                        );
                    })}
                </div>


                {/* Filters Section */}
                <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]/50">
                    {mode === 'list' && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" size={14} strokeWidth={2.2}/>
                            <input
                                type="text"
                                placeholder="Rechercher une ville…"
                                className="field-input !pl-9"
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
                            className="w-full px-3 pr-8 py-2.5 text-xs font-semibold rounded-lg border border-[var(--border-subtle)] bg-slate-50 dark:bg-slate-800/50 text-[var(--text-primary)] focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20 transition-colors appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] dark:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_8px_center] bg-no-repeat"
                        >
                            <option value="">Toutes les régions</option>
                            {availableRegionsOptions.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>

                        <select
                            key={activeRegion ?? 'all'}
                            value={selectedDepts.size > 0 ? Array.from(selectedDepts)[0] : ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedDepts(val ? new Set([val]) : new Set());
                            }}
                            disabled={!activeRegion}
                            className="w-full px-3 pr-8 py-2.5 text-xs font-semibold rounded-lg border border-[var(--border-subtle)] bg-slate-50 dark:bg-slate-800/50 text-[var(--text-primary)] focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20 transition-colors appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] dark:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_8px_center] bg-no-repeat disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-[image:none]"
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
                                        className={`px-2 py-1.5 rounded-md text-[11px] font-medium tracking-tight border transition active:translate-y-[1px] flex items-center justify-center gap-1
                                        ${isSelected
                                            ? `${conf.bg} ${conf.color} ${STATUS_BORDER[status]}`
                                            : 'bg-white dark:bg-[var(--bg-card-solid)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-orange-200 dark:hover:border-orange-500/30'
                                        }`}
                                    >
                                        {isSelected && <Check size={10} strokeWidth={3}/>}
                                        {conf.text}
                                    </button>
                                );
                            })}
                            {selectedStatuses.size > 0 && (
                                <button onClick={resetStatuses} className="text-[11px] text-[var(--text-secondary)] hover:text-orange-600 underline px-1 tracking-tight">
                                    Reset
                                </button>
                            )}
                        </div>
                    )}

                    {mode === 'map' && (
                        <div className="p-3 bg-orange-50 dark:bg-orange-500/10 rounded-xl border border-orange-100 dark:border-orange-500/25 text-[12px] text-orange-800 dark:text-orange-200 tracking-tight">
                            <p className="font-medium flex items-center gap-1.5">
                                <MousePointer2 size={12} strokeWidth={2.2}/> Mode prospection
                            </p>
                            <p className="opacity-85 mt-1 leading-relaxed">
                                Sélectionnez les départements ci-dessus pour charger la carte, puis utilisez le pinceau pour sélectionner des communes.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {mode === 'list' && (
                <>
                    <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-2">
                        {loadError ? (
                            <ErrorState
                                title="Erreur de chargement des communes"
                                error={loadError}
                            />
                        ) : geoError ? (
                            <ErrorState
                                title="Erreur de chargement des régions"
                                error={geoError}
                            />
                        ) : isLoading ? (
                            <LoadingState />
                        ) : selectedOrg === 'all' && filteredCommunes.length === 0 ? (
                            <EmptyState
                                icon={<MapPin size={22} />}
                                title="Sélectionnez une région ou un département"
                                message="Utilisez les filtres ci-dessus pour afficher les communes."
                            />
                        ) : filteredCommunes.length > 0 ? (
                            filteredCommunes.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => setSelectedCommune(c)}
                                    className={`p-3 rounded-xl border transition cursor-pointer active:translate-y-[1px] ${selectedCommune?.id === c.id ? 'bg-orange-50 dark:bg-orange-500/15 border-orange-200 dark:border-orange-500/25 ring-1 ring-orange-100 dark:ring-orange-500/25' : 'bg-white dark:bg-[var(--bg-card-solid)] border-[var(--border-subtle)] hover:border-orange-200 dark:hover:border-orange-500/30 hover:shadow-md'}`}
                                >
                                    <div className="flex justify-between items-start mb-2 gap-2">
                                        <h3 className="text-[14px] font-medium text-[var(--text-primary)] tracking-tight">{c.nom}</h3>
                                        <QuickStatusDropdown
                                            currentStatus={c.statut}
                                            onSelect={(newStatus) => onUpdateCommune(c.id, { statut: newStatus })}
                                        />
                                    </div>
                                    <div className="num flex items-center gap-3 text-[11px] text-[var(--text-secondary)] tracking-tight">
                                        <div className="flex items-center gap-1"><MapPin size={11} strokeWidth={2.2}/> {c.departement}</div>
                                        <div className="flex items-center gap-1"><Users size={11} strokeWidth={2.2}/> {c.population.toLocaleString('fr-FR')}</div>
                                        <div className="flex items-center gap-1"><Euro size={11} strokeWidth={2.2}/> {c.revenue}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <EmptyState
                                title="Aucune commune"
                                message="Aucune commune ne correspond aux filtres."
                            />
                        )}
                    </div>
                    <div className="num p-3 bg-slate-50/60 dark:bg-slate-800/40 border-t border-[var(--border-subtle)] text-center text-[12px] font-medium text-[var(--text-secondary)] tracking-tight">
                        {filteredCommunes.length}{totalCommunes > filteredCommunes.length ? ` sur ${totalCommunes.toLocaleString('fr-FR')}` : ''} communes
                    </div>
                </>
            )}

            {/* HISTORY SIDEBAR FOR MAP MODE */}
            {mode === 'map' && (
                <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-3">
                     <h3 className="eyebrow leading-none flex items-center gap-1.5 mb-1">
                        <History size={11} strokeWidth={2.4}/> Mes dernières demandes
                     </h3>
                     {pastRequests.length === 0 && (
                        <EmptyState
                            title="Aucune demande envoyée"
                            message="Validez une sélection pour la voir apparaître ici."
                        />
                     )}
                     {pastRequests.map(req => (
                         <div key={req.id} className="bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-xl p-3 shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-500/30 transition">
                             <div className="flex justify-between items-start mb-2">
                                 <div className="leading-tight">
                                     <span className="num eyebrow leading-none">{req.date.toLocaleDateString('fr-FR')}</span>
                                     <div className="num text-[14px] font-medium text-[var(--text-primary)] tracking-tight mt-1">{req.communeCount} communes</div>
                                 </div>
                                 <div className="text-right leading-tight">
                                     <div className="num text-[11px] font-medium text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-500/15 px-2 py-0.5 rounded-md tracking-tight">{req.zoneCount} zones</div>
                                     <div className="num text-[11px] text-[var(--text-muted)] mt-1 tracking-tight">{(req.totalPop/1000).toFixed(1)}k hab.</div>
                                 </div>
                             </div>

                             <div className="mb-2">
                                 <MiniZoneVisualizer points={req.communesList} />
                             </div>

                             <div className="text-[12px] text-[var(--text-secondary)] tracking-tight truncate">
                                 {req.communesList.slice(0, 3).map(c => c.nom).join(', ')}…
                             </div>
                         </div>
                     ))}
                </div>
            )}
        </div>
    );
};
