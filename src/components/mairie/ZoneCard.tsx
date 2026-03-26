import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Plus, User, Trash2, MapPin } from 'lucide-react';
import { Organization } from '@/types/commune';
import type { Zone, Mairie, ViewMode } from './types';
import { LEADERS, ORGS_CONFIG } from './helpers';
import { DocRequiredModal, ContactEditModal } from './MairieModals';
import { ZoneTimeManager } from './MairieWidgets';
import { MairieCard } from './MairieCard';

export const ZoneCard: React.FC<{ zone: Zone, assignedMairies: Mairie[], availableMairies: Mairie[], viewMode: ViewMode, currentNavigationWeek: number, onUpdateZone: (id: string, field: keyof Zone, value: string | number) => void, onAddMairie: (zoneId: string, mairieId: number) => void, onRemoveMairie: (mairieId: number) => void, onUpdateMairieStatus: (mairieId: number, status: string) => void, onUpdateMairieProgress: (mairieId: number, step: number) => void, onAddMairieComment: (mairieId: number, text: string) => void, onDeleteMairieComment: (mairieId: number, commentId: string) => void, onEditMairieComment: (mairieId: number, commentId: string, text: string) => void, onToggleMairieCommentFavorite: (mairieId: number, commentId: string) => void, onAddMairieContact: (mairieId: number, nom: string, num: string, email?: string) => void, onUpdateMairieContactInfo: (mairieId: number, field: 'tel' | 'email', value: string) => void, onOpenDetail: (mairie: Mairie) => void, onDeleteZone: (id: string) => void, onShowToast: (msg: string) => void, onExtendMairie: (mairieId: number) => void, onSetMairieDuration: (mairieId: number, d: number) => void }> = ({ zone, assignedMairies, availableMairies, viewMode, currentNavigationWeek, onUpdateZone, onAddMairie, onRemoveMairie, onUpdateMairieStatus, onUpdateMairieProgress, onAddMairieComment, onDeleteMairieComment, onEditMairieComment, onToggleMairieCommentFavorite, onAddMairieContact, onUpdateMairieContactInfo, onOpenDetail, onDeleteZone, onShowToast, onExtendMairie, onSetMairieDuration }) => {
    const [search, setSearch] = useState(""); const [isSearching, setIsSearching] = useState(false); const searchRef = useRef<HTMLDivElement>(null); const [docModalMairieId, setDocModalMairieId] = useState<number | null>(null); const [editContactState, setEditContactState] = useState<{ mairieId: number, field: 'tel' | 'email', currentVal: string } | null>(null);
    const filteredAvailable = useMemo(() => { if (!search) return []; return availableMairies.filter(m => m.nom.toLowerCase().includes(search.toLowerCase())).slice(0, 5); }, [search, availableMairies]);
    const displayMairies = useMemo(() => { return assignedMairies.filter(m => { const weekPart = m.semaineDemandee.split('-W')[1]; return parseInt(weekPart) === currentNavigationWeek; }); }, [assignedMairies, currentNavigationWeek]);
    useEffect(() => { const handleClickOutside = (event: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(event.target as Node)) { setIsSearching(false); } }; document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, []);
    const handleDocConfirm = (docName: string) => { if (docModalMairieId) { onUpdateMairieProgress(docModalMairieId, 3); onUpdateMairieStatus(docModalMairieId, 'Action requise'); onAddMairieComment(docModalMairieId, `[DOC] Requis : ${docName}`); onShowToast("Statut mis à jour : Documents requis"); setDocModalMairieId(null); } };
    const handleContactEditConfirm = (val: string) => { if (editContactState) { onUpdateMairieContactInfo(editContactState.mairieId, editContactState.field, val); onShowToast(`${editContactState.field === 'tel' ? 'Téléphone' : 'Email'} mis à jour !`); setEditContactState(null); } };
    const orgTheme = zone.organization !== 'all' ? ORGS_CONFIG[zone.organization] : ORGS_CONFIG['msf']; const borderColor = orgTheme.border; const headerBg = orgTheme.bg;
    const currentZoneRank = Math.max(1, currentNavigationWeek - zone.startWeek + 1);

    return (
        <div className={`flex flex-col rounded-3xl border-2 ${borderColor} bg-white dark:bg-[var(--bg-card-solid)] shadow-sm overflow-hidden mb-8`}>
            <DocRequiredModal isOpen={docModalMairieId !== null} onClose={() => setDocModalMairieId(null)} onConfirm={handleDocConfirm} />
            {editContactState && ( <ContactEditModal isOpen={true} onClose={() => setEditContactState(null)} onConfirm={handleContactEditConfirm} field={editContactState.field} currentValue={editContactState.currentVal} /> )}
            <div className={`px-6 py-4 border-b ${borderColor} flex items-center justify-between bg-opacity-50 ${headerBg}`}>
                <div className="flex items-center gap-4">
                    <div className={`w-2 h-10 rounded-full ${orgTheme.color.replace('text-', 'bg-')}`}></div>
                    {viewMode === 'grid' ? (
                        <input className="font-extrabold text-2xl bg-transparent border-none focus:ring-0 p-0 text-[var(--text-primary)] w-full max-w-[300px]" value={zone.name} onChange={(e) => onUpdateZone(zone.id, 'name', e.target.value)} />
                    ) : ( <h3 className="font-extrabold text-2xl text-[var(--text-primary)]">{zone.name}</h3> )}
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white dark:bg-[var(--bg-card-solid)] px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] shadow-sm">
                        <User size={20} className="text-[var(--text-muted)]"/>
                        {viewMode === 'grid' ? (
                            <select value={zone.leader} onChange={(e) => onUpdateZone(zone.id, 'leader', e.target.value)} className="text-lg font-bold bg-transparent border-none rounded py-0.5 px-1 focus:ring-0 outline-none cursor-pointer text-[var(--text-primary)]"> {LEADERS.map(l => <option key={l} value={l}>{l}</option>)} </select>
                        ) : ( <span className="text-lg font-bold text-[var(--text-primary)] px-1">{zone.leader}</span> )}
                        {viewMode === 'grid' && ( <div className="ml-2 pl-2 border-l border-[var(--border-subtle)]"> <ZoneTimeManager startWeek={zone.startWeek} duration={zone.defaultDuration} onUpdateStart={(w) => onUpdateZone(zone.id, 'startWeek', w)} onUpdateDuration={(d) => onUpdateZone(zone.id, 'defaultDuration', d)} currentWeek={currentNavigationWeek} /> </div> )}
                        {viewMode === 'list' && ( <div className="ml-2 pl-2 border-l border-[var(--border-subtle)] flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]"> <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Commencé en S{zone.startWeek}</span> <span className="bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-1 rounded">Semaine {Math.max(1, currentNavigationWeek - zone.startWeek + 1)} sur {zone.defaultDuration}</span> </div> )}
                    </div>
                    <div className="flex items-center gap-2">
                        {viewMode === 'grid' ? (
                            <select value={zone.organization} onChange={(e) => onUpdateZone(zone.id, 'organization', e.target.value)} className={`text-lg font-bold uppercase bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-lg py-2 px-3 focus:ring-0 outline-none cursor-pointer shadow-sm ${orgTheme.color}`}> <option value="msf">MSF</option> <option value="unicef">UNICEF</option> <option value="wwf">WWF</option> <option value="mdm">MDM</option> </select>
                        ) : ( <div className={`text-lg font-bold uppercase bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-lg py-2 px-3 shadow-sm ${orgTheme.color}`}> {zone.organization} </div> )}
                        {viewMode === 'grid' && ( <button onClick={() => onDeleteZone(zone.id)} className="ml-2 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"> <Trash2 size={24} /> </button> )}
                    </div>
                </div>
            </div>
            <div className="p-6 flex flex-col gap-6 bg-slate-50/50 dark:bg-slate-800/30">
                {viewMode === 'grid' && (
                    <div className="relative max-w-md" ref={searchRef}>
                        <div className="relative"> <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={20} /> <input type="text" placeholder="Ajouter une commune à cette zone..." className="w-full pl-11 pr-4 py-3 text-base bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-xl shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" value={search} onChange={(e) => { setSearch(e.target.value); setIsSearching(true); }} onFocus={() => setIsSearching(true)} /> </div>
                        {isSearching && search.length > 0 && ( <div className="absolute z-20 w-full mt-2 bg-white dark:bg-[var(--bg-card-solid)] rounded-xl shadow-xl border border-[var(--border-subtle)] overflow-hidden"> {filteredAvailable.length > 0 ? ( filteredAvailable.map(m => ( <div key={m.id} className="px-4 py-3 hover:bg-orange-50 dark:hover:bg-orange-500/10 cursor-pointer flex justify-between items-center group border-b border-slate-100 dark:border-slate-700 last:border-0" onClick={() => { onAddMairie(zone.id, m.id); setSearch(""); setIsSearching(false); }} > <span className="text-base font-medium text-[var(--text-primary)]">{m.nom}</span> <Plus size={20} className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" /> </div> )) ) : ( <div className="px-4 py-3 text-sm text-[var(--text-muted)] italic">Aucune commune trouvée (ou déjà assignée).</div> )} </div> )}
                    </div>
                )}
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'flex flex-col gap-6'}>
                    {displayMairies.length > 0 ? (
                        displayMairies.map(m => {
                            const seriesMairies = m.serieId ? assignedMairies.filter(zm => zm.serieId === m.serieId) : [m]; const totalWeeks = seriesMairies.length; const sortedSeries = seriesMairies.sort((a,b) => a.semaineDemandee.localeCompare(b.semaineDemandee)); const currentRank = sortedSeries.findIndex(x => x.id === m.id) + 1; const firstMairie = seriesMairies[0]; const seriesStartWeek = parseInt(firstMairie.semaineDemandee.split('-W')[1]);
                            return ( <MairieCard key={m.id} mairie={m} zoneOrg={zone.organization} zoneDuration={zone.defaultDuration} zoneStartWeek={seriesStartWeek} viewMode={viewMode} seriesInfo={{ rank: currentRank, total: totalWeeks }} currentNavigationWeek={currentNavigationWeek} onRemove={() => onRemoveMairie(m.id)} onStatusChange={(s) => onUpdateMairieStatus(m.id, s)} onProgressChange={(s) => onUpdateMairieProgress(m.id, s)} onAddComment={(t) => onAddMairieComment(m.id, t)} onDeleteComment={(cId) => onDeleteMairieComment(m.id, cId)} onEditComment={(cId, txt) => onEditMairieComment(m.id, cId, txt)} onToggleFavorite={(cId) => onToggleMairieCommentFavorite(m.id, cId)} onAddContact={(n, v, e) => onAddMairieContact(m.id, n, v, e)} onUpdateContact={(f, v) => onUpdateMairieContactInfo(m.id, f, v)} onClick={() => onOpenDetail(m)} onShowToast={onShowToast} onDocRequest={() => setDocModalMairieId(m.id)} onRequestContactEdit={(f, val) => setEditContactState({ mairieId: m.id, field: f, currentVal: val })} onExtendWeek={() => onExtendMairie(m.id)} onSetDuration={(d) => onSetMairieDuration(m.id, d)} /> );
                        })
                    ) : (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center text-[var(--text-muted)] border-2 border-dashed border-[var(--border-subtle)] rounded-2xl bg-white/50 dark:bg-[var(--bg-card-solid)]/50"> <MapPin size={48} className="mb-4 opacity-30"/> <span className="text-lg font-medium">Cette zone est vide pour la semaine {currentNavigationWeek}.</span> <span className="text-sm">Ajoutez des communes via la barre de recherche ci-dessus {viewMode === 'grid' ? '(Vue Grille uniquement)' : ''}.</span> </div>
                    )}
                </div>
            </div>
            <div className="px-6 py-3 bg-white dark:bg-[var(--bg-card-solid)] border-t border-[var(--border-subtle)] flex justify-between text-sm font-semibold text-[var(--text-secondary)]"> <span>{assignedMairies.length} Mairies à contacter (S{currentNavigationWeek})</span> <span>Total : {assignedMairies.reduce((acc, m) => acc + m.population, 0).toLocaleString()} Habitants</span> </div>
        </div>
    );
};
