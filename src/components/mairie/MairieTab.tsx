
import React, { useState, useMemo } from 'react';
import { Plus, LayoutGrid, List as ListIcon, ChevronRight, ChevronLeft, MapPin } from 'lucide-react';
import { Organization } from '@/types/commune';
import type { Mairie, Zone, Commentaire, AutreContact, ViewMode } from './types';
import { getISOWeek, getCalculatedWeekString, standardHoraires, ORGS_CONFIG } from './helpers';
import { Toast, DocRequiredModal, ContactEditModal, MairieDetailModal } from './MairieModals';
import { ZoneCard } from './ZoneCard';
import { MairieCard } from './MairieCard';

// --- MOCK DATA ---
const initialZones: Zone[] = [
    { id: 'z1', name: 'Zone A (Nord)', leader: 'Thomas R.', organization: 'msf', defaultDuration: 2, startWeek: 45 },
    { id: 'z2', name: 'Centre-Ville', leader: 'Sarah L.', organization: 'unicef', defaultDuration: 1, startWeek: 48 },
];

const initialMairieData: Mairie[] = [
    { id: 1, nom: 'Saint-Herblain', region: 'Pays de la Loire', departement: '44', organization: 'msf', contact: { email: 'contact@saint-herblain.fr', tel: '02 28 25 20 00', nomContact: 'Mme. Dupont', fonctionContact: 'Secrétariat Général'}, infos: { adresse: '2 Rue de l\'Hôtel de Ville, 44800 Saint-Herblain', maire: 'Bertrand Affilé', parking: 'Oui, derrière le bâtiment', etage: '1er étage, porte gauche' }, horaires: standardHoraires, population: 46603, semaineDemandee: '2025-W45', dateDemande: '2025-10-27', etapeProgression: 2, statutGeneral: 'Action requise', commentaires: [ { id: 'c1', date: '2024-09-15T10:30:00', texte: 'Rappeler impérativement le 12/10, la secrétaire est absente le lundi.', isFavorite: true }, { id: 'c2', date: '2024-09-10T14:00:00', texte: 'Premier mail envoyé, pas de réponse.' } ], zoneId: 'z1', serieId: 'serie-1' },
    { id: 2, nom: 'Rezé', region: 'Pays de la Loire', departement: '44', organization: 'unicef', contact: { email: 'mairie@mairie-reze.fr', tel: '02 40 84 42 00', nomContact: 'Accueil', fonctionContact: 'Standard'}, infos: { adresse: 'Place Jean-Baptiste Daviais, 44400 Rezé', maire: 'Agnès Bourgeais', digicode: 'A45B (Portail arrière)' }, horaires: { ...standardHoraires, sa: ["09:00-12:00"] }, population: 42998, semaineDemandee: '2025-W46', dateDemande: '2025-11-03', etapeProgression: 4, statutGeneral: 'Validé', commentaires: [ { id: 'c3', date: '2024-10-01T09:00:00', texte: 'Accord verbal reçu ce matin !' } ], zoneId: 'z1', serieId: 'serie-1' },
    { id: 3, nom: 'Nantes', region: 'Pays de la Loire', departement: '44', organization: 'wwf', contact: { email: 'contact@nantesmetropole.fr', tel: '02 40 41 90 00'}, infos: { adresse: '2 Rue de l\'Hôtel de Ville, 44000 Nantes', maire: 'Johanna Rolland' }, horaires: standardHoraires, population: 318808, semaineDemandee: '2025-W48', dateDemande: '2025-11-17', etapeProgression: 1, statutGeneral: 'En cours', commentaires: [], zoneId: 'z2' },
    { id: 4, nom: 'Strasbourg', region: 'Grand Est', departement: '67', organization: 'msf', contact: { email: 'autorisations@strasbourg.eu', tel: '03 68 98 50 00' }, infos: { adresse: '1 Parc de l\'Étoile, 67000 Strasbourg', maire: 'Jeanne Barseghian' }, horaires: standardHoraires, population: 291313, semaineDemandee: '2025-W40', dateDemande: '2025-09-29', etapeProgression: 1, statutGeneral: 'En cours', commentaires: [] },
    { id: 5, nom: 'Colmar', region: 'Grand Est', departement: '68', organization: 'msf', contact: { email: 'contact@colmar.fr', tel: '03 89 20 68 68' }, infos: { adresse: '1 Place de la Mairie, 68000 Colmar', maire: 'Eric Straumann' }, horaires: standardHoraires, population: 67000, semaineDemandee: '2025-W40', dateDemande: '2025-09-29', etapeProgression: 0, statutGeneral: 'À traiter', commentaires: [] },
];

export default function MairieTab() {
    const [zones, setZones] = useState<Zone[]>(initialZones);
    const [mairies, setMairies] = useState<Mairie[]>(initialMairieData);
    const [selectedMairie, setSelectedMairie] = useState<Mairie | null>(null);
    const [selectedOrgFilter, setSelectedOrgFilter] = useState<Organization | 'all'>('all');
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [currentWeek, setCurrentWeek] = useState(getISOWeek());
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const weeks = Array.from({ length: 52 }, (_, i) => i + 1);
    const [unassignedDocMairieId, setUnassignedDocMairieId] = useState<number|null>(null);
    const [unassignedContactEdit, setUnassignedContactEdit] = useState<{ mairieId: number, field: 'tel' | 'email', currentVal: string } | null>(null);

    const handleAddZone = () => { const newId = `z${zones.length + 1}-${Date.now()}`; setZones([...zones, { id: newId, name: `Nouvelle Zone ${zones.length + 1}`, leader: 'Non assigné', organization: selectedOrgFilter === 'all' ? 'msf' : selectedOrgFilter, defaultDuration: 2, startWeek: currentWeek }]); };
    const handleDeleteZone = (zoneId: string) => { if (confirm("Supprimer cette zone ? Les communes retourneront dans la liste 'Non assignées'.")) { setZones(zones.filter(z => z.id !== zoneId)); setMairies(mairies.map(m => m.zoneId === zoneId ? { ...m, zoneId: undefined } : m)); } };
    const handleUpdateZone = (id: string, field: keyof Zone, value: string | number) => { setZones(zones.map(z => z.id === id ? { ...z, [field]: value } : z)); };
    const handleAddMairieToZone = (zoneId: string, mairieId: number) => { const weekStr = getCalculatedWeekString(currentWeek, 0); setMairies(prev => prev.map(m => m.id === mairieId ? { ...m, zoneId, semaineDemandee: weekStr } : m)); };
    const handleRemoveMairieFromZone = (mairieId: number) => { setMairies(prev => prev.map(m => m.id === mairieId ? { ...m, zoneId: undefined } : m)); };
    const handleUpdateMairieStatus = (mairieId: number, status: string) => { setMairies(prev => prev.map(m => m.id === mairieId ? { ...m, statutGeneral: status as any } : m)); };
    const handleUpdateMairieProgress = (mairieId: number, step: number) => { setMairies(prev => prev.map(m => m.id === mairieId ? { ...m, etapeProgression: step } : m)); };
    const handleAddMairieComment = (mairieId: number, text: string) => { const newComment: Commentaire = { id: Date.now().toString(), date: new Date().toISOString(), texte: text }; setMairies(prev => prev.map(m => m.id === mairieId ? { ...m, commentaires: [newComment, ...m.commentaires] } : m)); };
    const handleDeleteMairieComment = (mairieId: number, commentId: string) => { setMairies(prev => prev.map(m => m.id === mairieId ? { ...m, commentaires: m.commentaires.filter(c => c.id !== commentId) } : m)); };
    const handleEditMairieComment = (mairieId: number, commentId: string, newText: string) => { setMairies(prev => prev.map(m => m.id === mairieId ? { ...m, commentaires: m.commentaires.map(c => c.id === commentId ? { ...c, texte: newText } : c) } : m)); };
    const handleToggleMairieCommentFavorite = (mairieId: number, commentId: string) => { setMairies(prev => prev.map(m => { if (m.id !== mairieId) return m; return { ...m, commentaires: m.commentaires.map(c => ({ ...c, isFavorite: c.id === commentId ? !c.isFavorite : false })) }; })); };
    const handleAddMairieContact = (mairieId: number, nom: string, numero: string, email?: string) => { const newContact: AutreContact = { id: Date.now().toString(), nom, numero, email, type: 'tel' }; setMairies(prev => prev.map(m => m.id === mairieId ? { ...m, contact: { ...m.contact, autresContacts: [...(m.contact.autresContacts || []), newContact] } } : m)); };
    const handleUpdateMairieContactInfo = (mairieId: number, field: 'tel' | 'email', value: string) => { setMairies(prev => prev.map(m => m.id === mairieId ? { ...m, contact: { ...m.contact, [field]: value } } : m)); };
    const handleExtendMairie = (mairieId: number) => {
        setMairies(prevMairies => {
            const sourceMairie = prevMairies.find(m => m.id === mairieId); if (!sourceMairie) return prevMairies; let serieId = sourceMairie.serieId; let updatedMairies = [...prevMairies]; if (!serieId) { serieId = `serie-${Date.now()}`; updatedMairies = updatedMairies.map(m => m.id === mairieId ? { ...m, serieId: serieId } : m); }
            const seriesMairies = updatedMairies.filter(m => m.serieId === serieId); const sortedSeries = seriesMairies.sort((a, b) => a.semaineDemandee.localeCompare(b.semaineDemandee)); const lastMairie = sortedSeries[sortedSeries.length - 1];
            const [y, w] = lastMairie.semaineDemandee.split('-W'); const nextWeek = getCalculatedWeekString(parseInt(w), 1);
            const newMairie: Mairie = { ...sourceMairie, id: Date.now(), serieId: serieId, semaineDemandee: nextWeek, etapeProgression: 0, statutGeneral: 'À traiter', commentaires: [], dateDemande: new Date(new Date(lastMairie.dateDemande).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] };
            return [...updatedMairies, newMairie];
        }); setToastMessage("Mission prolongée d'une semaine !");
    };
    const handleSetMairieDuration = (mairieId: number, targetDuration: number) => {
        setMairies(prevMairies => {
            const sourceMairie = prevMairies.find(m => m.id === mairieId); if (!sourceMairie) return prevMairies; let serieId = sourceMairie.serieId; let updatedMairies = [...prevMairies]; if (!serieId) { serieId = `serie-${Date.now()}`; updatedMairies = updatedMairies.map(m => m.id === mairieId ? { ...m, serieId: serieId } : m); }
            const seriesMairies = updatedMairies.filter(m => m.serieId === serieId).sort((a, b) => a.semaineDemandee.localeCompare(b.semaineDemandee)); const currentCount = seriesMairies.length;
            if (targetDuration > currentCount) {
                const needed = targetDuration - currentCount; let lastMairie = seriesMairies[seriesMairies.length - 1];
                for(let i=0; i<needed; i++) { const [y, w] = lastMairie.semaineDemandee.split('-W'); const nextWeek = getCalculatedWeekString(parseInt(w), 1); const newMairie: Mairie = { ...lastMairie, id: Date.now() + i, serieId: serieId, semaineDemandee: nextWeek, etapeProgression: 0, statutGeneral: 'À traiter', commentaires: [], dateDemande: new Date(new Date(lastMairie.dateDemande).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }; updatedMairies.push(newMairie); lastMairie = newMairie; } setToastMessage(`Durée ajustée à ${targetDuration} semaines (Ajout)`);
            } else if (targetDuration < currentCount) { const toRemoveCount = currentCount - targetDuration; const idsToRemove = seriesMairies.slice(-toRemoveCount).map(m => m.id); updatedMairies = updatedMairies.filter(m => !idsToRemove.includes(m.id)); setToastMessage(`Durée ajustée à ${targetDuration} semaines (Réduction)`); }
            return updatedMairies;
        });
    };
    const nextWeek = () => { if (currentWeek < 52) setCurrentWeek(currentWeek + 1); else setCurrentWeek(1); };
    const prevWeek = () => { if (currentWeek > 1) setCurrentWeek(currentWeek - 1); else setCurrentWeek(52); };
    const visibleZones = useMemo(() => { if (selectedOrgFilter === 'all') return zones; return zones.filter(z => z.organization === selectedOrgFilter); }, [zones, selectedOrgFilter]);
    const unassignedMairies = useMemo(() => { let pool = mairies.filter(m => !m.zoneId); if (selectedOrgFilter !== 'all') { pool = pool.filter(m => m.organization === selectedOrgFilter); } return pool; }, [mairies, selectedOrgFilter]);

    return (
        <section className="animate-fade-in h-full flex flex-col relative">
            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
            <DocRequiredModal isOpen={unassignedDocMairieId !== null} onClose={() => setUnassignedDocMairieId(null)} onConfirm={(docName) => { if(unassignedDocMairieId) { handleUpdateMairieProgress(unassignedDocMairieId, 3); handleUpdateMairieStatus(unassignedDocMairieId, 'Action requise'); handleAddMairieComment(unassignedDocMairieId, `[DOC] Requis : ${docName}`); setToastMessage("Statut mis à jour : Documents requis"); setUnassignedDocMairieId(null); } }} />
            {unassignedContactEdit && ( <ContactEditModal isOpen={true} onClose={() => setUnassignedContactEdit(null)} onConfirm={(val) => { handleUpdateMairieContactInfo(unassignedContactEdit.mairieId, unassignedContactEdit.field, val); setToastMessage(`${unassignedContactEdit.field === 'tel' ? 'Téléphone' : 'Email'} mis à jour !`); setUnassignedContactEdit(null); }} field={unassignedContactEdit.field} currentValue={unassignedContactEdit.currentVal} /> )}

            <header className="mb-4 md:mb-8 flex flex-col gap-4 md:gap-6 flex-shrink-0">
                <div className="flex flex-col md:flex-row justify-between md:items-end mt-2 gap-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)]">Relations Mairie</h2>
                        <p className="text-sm md:text-xl text-[var(--text-secondary)] mt-1 md:mt-2 font-medium">Suivi des prises de contact et organisation des tournées.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 md:gap-3 items-center">
                         <div className="bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-xl p-1 flex items-center shadow-sm mr-4"> <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-orange-100 text-orange-600' : 'text-[var(--text-muted)] hover:text-slate-600'}`} title="Vue Liste"> <ListIcon size={20} /> </button> <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 mx-1"></div> <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-orange-100 text-orange-600' : 'text-[var(--text-muted)] hover:text-slate-600'}`} title="Vue Grille"> <LayoutGrid size={20} /> </button> </div>
                        <div className="bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-xl p-1.5 flex items-center gap-2 shadow-sm mr-2"> <button onClick={prevWeek} className="flex items-center gap-2 text-sm font-bold text-orange-600 bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 px-4 py-2 rounded-lg transition-colors"> <ChevronLeft size={16} /> Semaine {currentWeek > 1 ? currentWeek - 1 : 52} </button> <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div> <select value={currentWeek} onChange={(e) => setCurrentWeek(Number(e.target.value))} className="bg-transparent text-[var(--text-primary)] font-bold text-lg py-1.5 px-3 rounded-lg focus:outline-none cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"> {weeks.map(w => ( <option key={w} value={w}>Semaine {w}</option> ))} </select> <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div> <button onClick={nextWeek} className="flex items-center gap-2 text-sm font-bold text-orange-600 bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 px-4 py-2 rounded-lg transition-colors"> Semaine {currentWeek < 52 ? currentWeek + 1 : 1} <ChevronRight size={16} /> </button> </div>
                        <button onClick={handleAddZone} className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white font-bold text-lg rounded-xl hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200"> <Plus size={24} /> Créer une Zone </button>
                    </div>
                </div>

                <div className="flex gap-1 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-[var(--border-subtle)] w-fit">
                     <button onClick={() => setSelectedOrgFilter('all')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${selectedOrgFilter === 'all' ? 'bg-slate-800 text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-white hover:shadow-sm'}`}> TOUTES </button>
                    {Object.entries(ORGS_CONFIG).map(([key, conf]) => ( <button key={key} onClick={() => setSelectedOrgFilter(key as Organization)} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all uppercase ${selectedOrgFilter === key ? `${conf.bg.replace('50', '500')} text-white shadow-md` : `text-[var(--text-secondary)] hover:${conf.bg}`}`}> {conf.label} </button> ))}
                </div>
            </header>

            <div className="flex flex-col gap-8 mb-12">
                {visibleZones.map(zone => ( <ZoneCard key={zone.id} zone={zone} viewMode={viewMode} currentNavigationWeek={currentWeek} assignedMairies={mairies.filter(m => m.zoneId === zone.id)} availableMairies={unassignedMairies} onUpdateZone={handleUpdateZone} onAddMairie={handleAddMairieToZone} onRemoveMairie={handleRemoveMairieFromZone} onUpdateMairieStatus={handleUpdateMairieStatus} onUpdateMairieProgress={handleUpdateMairieProgress} onAddMairieComment={handleAddMairieComment} onDeleteMairieComment={handleDeleteMairieComment} onEditMairieComment={handleEditMairieComment} onToggleMairieCommentFavorite={handleToggleMairieCommentFavorite} onAddMairieContact={handleAddMairieContact} onUpdateMairieContactInfo={handleUpdateMairieContactInfo} onOpenDetail={setSelectedMairie} onDeleteZone={handleDeleteZone} onShowToast={(msg) => setToastMessage(msg)} onExtendMairie={handleExtendMairie} onSetMairieDuration={handleSetMairieDuration} /> ))}
            </div>

            {unassignedMairies.length > 0 && (
                <div className="mt-auto bg-slate-100 dark:bg-slate-800 rounded-3xl p-8 border-t border-[var(--border-subtle)]"> <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-3"> <ListIcon size={28} /> Communes Non Assignées ({unassignedMairies.length}) </h3> <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"> {unassignedMairies.map(m => { const seriesMairies = m.serieId ? unassignedMairies.filter(zm => zm.serieId === m.serieId) : [m]; const totalWeeks = seriesMairies.length; const sortedSeries = seriesMairies.sort((a,b) => a.semaineDemandee.localeCompare(b.semaineDemandee)); const currentRank = sortedSeries.findIndex(x => x.id === m.id) + 1; const firstMairie = sortedSeries[0]; const seriesStartWeek = parseInt(firstMairie.semaineDemandee.split('-W')[1]); return ( <MairieCard key={m.id} mairie={m} zoneOrg={m.organization} zoneDuration={1} zoneStartWeek={seriesStartWeek} viewMode="grid" seriesInfo={{ rank: currentRank, total: totalWeeks }} currentNavigationWeek={currentWeek} onStatusChange={(s) => handleUpdateMairieStatus(m.id, s)} onProgressChange={(s) => handleUpdateMairieProgress(m.id, s)} onAddComment={(t) => handleAddMairieComment(m.id, t)} onDeleteComment={(cId) => handleDeleteMairieComment(m.id, cId)} onEditComment={(cId, txt) => handleEditMairieComment(m.id, cId, txt)} onToggleFavorite={(cId) => handleToggleMairieCommentFavorite(m.id, cId)} onAddContact={(n, v, e) => handleAddMairieContact(m.id, n, v, e)} onUpdateContact={(f, v) => handleUpdateMairieContactInfo(m.id, f, v)} onClick={() => setSelectedMairie(m)} onShowToast={(msg) => setToastMessage(msg)} onDocRequest={() => setUnassignedDocMairieId(m.id)} onRequestContactEdit={(f, val) => setUnassignedContactEdit({ mairieId: m.id, field: f, currentVal: val })} onExtendWeek={() => handleExtendMairie(m.id)} onSetDuration={(d) => handleSetMairieDuration(m.id, d)} /> ); })} </div> </div>
            )}

            <MairieDetailModal mairie={selectedMairie} onClose={() => setSelectedMairie(null)} showToast={(msg) => setToastMessage(msg)} />
        </section>
    );
}
