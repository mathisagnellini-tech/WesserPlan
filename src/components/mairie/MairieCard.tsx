import React, { useState } from 'react';
import { PhoneCall, Mail, User, X, ArrowRight, Info, Lock, Star, Pencil, Copy, Trash2, Edit2 } from 'lucide-react';
import { Organization } from '@/types/commune';
import { departmentMap } from '@/constants/departments';
import { ORGANIZATIONS } from '@/constants/organizations';
import type { Mairie, Commentaire, ViewMode } from './types';
import { ETAPES_PROGRESSION, isMairieOpen, formatDateComment, formatCommentText, formatDateShort, orgTheme } from './helpers';
import { RefusalModal, type ToastSeverity } from './MairieModals';
import { WeekRatioSelector } from './MairieWidgets';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Tooltip } from '@/components/ui/Tooltip';

interface MairieCardProps {
    mairie: Mairie;
    zoneOrg?: Organization | 'all';
    zoneDuration: number;
    zoneStartWeek?: number;
    viewMode: ViewMode;
    seriesInfo: { rank: number; total: number };
    currentNavigationWeek: number;
    onRemove?: () => void;
    onStatusChange: (status: string) => void;
    onProgressChange: (stepIndex: number) => void;
    onAddComment: (text: string) => void;
    onDeleteComment: (commentId: string) => void;
    onEditComment: (commentId: string, newText: string) => void;
    onToggleFavorite: (commentId: string) => void;
    onAddContact: (nom: string, numero: string, email?: string) => void;
    onUpdateContact: (field: 'tel' | 'email', value: string) => void;
    onClick: () => void;
    onShowToast: (message: string, severity?: ToastSeverity) => void;
    onDocRequest: () => void;
    onRequestContactEdit: (field: 'tel' | 'email', currentVal: string) => void;
    onExtendWeek: () => void;
    onSetDuration: (d: number) => void;
}

export const MairieCard: React.FC<MairieCardProps> = ({
    mairie, zoneOrg, viewMode, seriesInfo, onRemove, onStatusChange, onProgressChange,
    onAddComment, onDeleteComment, onEditComment, onToggleFavorite, onAddContact,
    onClick, onShowToast, onDocRequest, onRequestContactEdit, onSetDuration,
}) => {
    const isOpen = isMairieOpen(mairie.horaires);
    const [commentInput, setCommentInput] = useState('');
    const [showRefusal, setShowRefusal] = useState(false);
    const [confirmRemove, setConfirmRemove] = useState(false);
    const [isAddingContact, setIsAddingContact] = useState(false);
    const [newContactName, setNewContactName] = useState('');
    const [newContactNum, setNewContactNum] = useState('');
    const [newContactEmail, setNewContactEmail] = useState('');
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editCommentText, setEditCommentText] = useState('');
    const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

    const orgKey = (zoneOrg !== 'all' && zoneOrg ? zoneOrg : (mairie.organization || 'msf')) as Organization;
    const theme = orgTheme(orgKey);
    const brandColor = ORGANIZATIONS[orgKey]?.color ?? '#FF5B2B';

    const handleSubmitComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentInput.trim()) return;
        onAddComment(commentInput.trim());
        setCommentInput('');
    };

    const handleAddContactSubmit = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (newContactName && (newContactNum || newContactEmail)) {
            onAddContact(newContactName.trim(), newContactNum.trim(), newContactEmail.trim() || undefined);
            setNewContactName('');
            setNewContactNum('');
            setNewContactEmail('');
            setIsAddingContact(false);
        }
    };

    const handleRemoveClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmRemove(true);
    };

    const handleRefusal = (reason: string) => {
        onAddComment(`[REFUS] ${reason}`);
        onStatusChange('Refusé');
    };

    const handleCopy = async (text: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(text);
            onShowToast('Copié !', 'success');
        } catch {
            onShowToast('Impossible de copier', 'error');
        }
    };

    const handleEditClick = (field: 'tel' | 'email', currentVal: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onRequestContactEdit(field, currentVal);
    };

    const handleStepClick = (stepIdx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (stepIdx === 3) onDocRequest();
        else onProgressChange(stepIdx);
    };

    const startEditComment = (c: Commentaire) => {
        setEditingCommentId(c.id);
        setEditCommentText(c.texte);
    };

    const saveEditComment = () => {
        if (editingCommentId && editCommentText.trim()) {
            onEditComment(editingCommentId, editCommentText.trim());
            setEditingCommentId(null);
            setEditCommentText('');
        }
    };

    const deptName = departmentMap[mairie.departement] || '';
    const requestedDate = mairie.dateDemande ? formatDateShort(mairie.dateDemande) : null;

    if (viewMode === 'grid') {
        const favoriteComment = mairie.commentaires.find((c) => c.isFavorite);
        const displayComment = favoriteComment || (mairie.commentaires.length > 0 ? mairie.commentaires[0] : null);
        return (
            <>
                <ConfirmDialog
                    isOpen={confirmRemove}
                    onClose={() => setConfirmRemove(false)}
                    onConfirm={() => onRemove?.()}
                    title="Retirer cette mairie ?"
                    message={<>
                        La mairie de <b>{mairie.nom}</b> sera retirée de la semaine <b>{mairie.semaineDemandee}</b>. Vous pourrez la réassigner depuis les communes non assignées.
                    </>}
                    variant="warning"
                    confirmLabel="Retirer"
                />
                <div onClick={onClick} className={`group relative bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col h-[200px] ${theme.glow}`}>
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl" style={{ backgroundColor: brandColor }} />
                    <div className="p-4 flex flex-col gap-1 border-b border-slate-50 dark:border-slate-700 pl-6 bg-slate-50/30 dark:bg-slate-800/20">
                        <div className="flex justify-between items-start gap-2">
                            <h4 className="font-bold text-[var(--text-primary)] text-lg leading-tight line-clamp-1 tracking-tight">{mairie.nom}</h4>
                            <Tooltip
                                comingSoon
                                content="Étendre la mission sur plusieurs semaines sera persisté dès que la table town_hall_series sera ajoutée."
                            >
                                <div className="shrink-0">
                                    <WeekRatioSelector rank={seriesInfo.rank} total={seriesInfo.total} onUpdateTotal={onSetDuration} />
                                </div>
                            </Tooltip>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wide truncate">
                            {mairie.departement} - {deptName} • {mairie.region} • {mairie.population.toLocaleString()} hab.
                        </p>
                    </div>
                    <div className="p-4 flex-1 flex flex-col gap-3 pl-6">
                        {displayComment ? (
                            <div className={`mt-auto p-2 rounded text-xs border line-clamp-3 ${favoriteComment ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-500/20 text-yellow-800 dark:text-yellow-300' : 'bg-slate-50 dark:bg-slate-800/50 border-[var(--border-subtle)] text-[var(--text-secondary)] italic'}`}>
                                {favoriteComment && <Star size={10} className="inline mr-1 -mt-0.5 fill-yellow-500 text-yellow-500" />}
                                {formatCommentText(displayComment.texte)}
                            </div>
                        ) : (
                            <div className="mt-auto text-xs text-slate-500 dark:text-slate-400 italic">Aucune note...</div>
                        )}
                    </div>
                    {onRemove && (
                        <button
                            type="button"
                            onClick={handleRemoveClick}
                            aria-label="Retirer la mairie"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 bg-white dark:bg-[var(--bg-card-solid)] text-red-400 hover:text-red-600 rounded-full shadow-sm border border-[var(--border-subtle)] transition-all z-20"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </>
        );
    }

    return (
        <div className={`group relative bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-xl shadow-sm hover:shadow-lg transition-all flex flex-col ${theme.glow}`}>
            <RefusalModal isOpen={showRefusal} onClose={() => setShowRefusal(false)} onConfirm={handleRefusal} />
            <ConfirmDialog
                isOpen={confirmRemove}
                onClose={() => setConfirmRemove(false)}
                onConfirm={() => onRemove?.()}
                title="Retirer cette mairie ?"
                message={<>
                    La mairie de <b>{mairie.nom}</b> sera retirée de la semaine <b>{mairie.semaineDemandee}</b>. Vous pourrez la réassigner depuis les communes non assignées.
                </>}
                variant="warning"
                confirmLabel="Retirer"
            />
            <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl" style={{ backgroundColor: brandColor }} />
            {onRemove && (
                <button
                    type="button"
                    onClick={handleRemoveClick}
                    aria-label="Retirer la mairie"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-2 bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-full transition-all z-20"
                    title="Supprimer la mairie"
                >
                    <X size={20} />
                </button>
            )}
            <div className="p-6 flex flex-col h-full gap-6 pl-7">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3">
                            <h4 className={`font-extrabold text-[var(--text-primary)] leading-tight text-3xl tracking-tight ${mairie.statutGeneral === 'Refusé' ? 'line-through text-[var(--text-muted)]' : ''}`}>
                                {mairie.nom}
                            </h4>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onClick(); }}
                                className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-500/10 text-[var(--text-secondary)] hover:text-orange-600 dark:hover:text-orange-400 rounded-full text-xs font-bold transition-colors border border-[var(--border-subtle)] cursor-pointer"
                            >
                                <Info size={14} /> Information
                            </button>
                            <div className={`flex items-center gap-2 ml-2 px-3 py-1 rounded-full border ${isOpen ? 'bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20' : 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20'}`}>
                                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                <span className={`text-xs font-bold ${isOpen ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                    {isOpen ? 'Mairie ouverte' : 'Mairie fermée'}
                                </span>
                            </div>
                            {mairie.statutGeneral === 'Refusé' && (
                                <span className="px-2 py-1 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 text-xs font-bold rounded uppercase">Refusé</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                            <p className="text-sm text-[var(--text-secondary)] font-semibold uppercase tracking-wide">
                                {mairie.departement} - {deptName} • {mairie.region}
                            </p>
                            <span className="text-[var(--text-muted)]">•</span>
                            <p className="text-sm text-[var(--text-secondary)] font-semibold">{mairie.population.toLocaleString()} hab.</p>
                        </div>
                        {requestedDate && (
                            <div className="flex items-center gap-3 mt-4">
                                <div
                                    className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-[var(--border-subtle)] rounded-md text-xs font-bold text-[var(--text-secondary)] cursor-not-allowed"
                                    title="Date de la demande (non modifiable)"
                                >
                                    <Lock size={12} /> {requestedDate}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-1 w-full md:w-[450px]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2 w-full mt-6">
                            <button
                                type="button"
                                onClick={() => setShowRefusal(true)}
                                className="px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-all border border-red-200 dark:border-red-500/20 hover:shadow-md hover:shadow-red-200 dark:hover:shadow-red-500/10 flex-shrink-0 flex items-center gap-2 font-bold text-xs"
                                title="Refus de la mairie"
                            >
                                Refus
                            </button>
                            <div className="flex items-center w-full h-8 rounded-lg overflow-hidden border border-[var(--border-subtle)] shadow-sm bg-slate-50 dark:bg-slate-800/50" role="group" aria-label="Étape de progression">
                                {ETAPES_PROGRESSION.map((step, idx) => {
                                    const isActive = idx === mairie.etapeProgression;
                                    const isCompleted = idx < mairie.etapeProgression;
                                    let bgClass = 'bg-slate-50 dark:bg-slate-800/50 text-[var(--text-muted)]';
                                    if (isCompleted) bgClass = 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400';
                                    if (isActive) bgClass = 'bg-emerald-600 text-white font-bold shadow-md z-10';
                                    return (
                                        <button
                                            type="button"
                                            key={idx}
                                            onClick={(e) => handleStepClick(idx, e)}
                                            aria-pressed={isActive}
                                            className={`flex-1 h-full flex items-center justify-center cursor-pointer transition-all relative ${bgClass} ${idx !== 0 ? 'border-l border-[var(--border-subtle)]' : ''} ${isActive ? 'scale-105 transform' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                        >
                                            <span className="text-[10px] uppercase tracking-tight truncate px-1 text-center leading-none select-none">{step}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-4 justify-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col gap-3">
                            <div className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 shadow-sm group/btn">
                                <a href={`tel:${mairie.contact.tel}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                                    <div className="bg-white dark:bg-[var(--bg-card-solid)] p-2 rounded-full shadow-sm">
                                        <PhoneCall size={20} className="text-green-600" />
                                    </div>
                                    <span className="text-xl font-bold tracking-wide text-green-700 dark:text-green-400 font-mono">{mairie.contact.tel}</span>
                                </a>
                                <div className="flex gap-2 opacity-0 group-hover/btn:opacity-100 transition-opacity">
                                    <button type="button" onClick={(e) => handleEditClick('tel', mairie.contact.tel, e)} aria-label="Modifier le téléphone" className="p-1.5 bg-white dark:bg-[var(--bg-card-solid)] rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-500/20 shadow-sm cursor-pointer z-50">
                                        <Pencil size={14} />
                                    </button>
                                    <button type="button" onClick={(e) => handleCopy(mairie.contact.tel, e)} aria-label="Copier le téléphone" className="p-1.5 bg-white dark:bg-[var(--bg-card-solid)] rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-500/20 shadow-sm cursor-pointer z-50">
                                        <Copy size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 shadow-sm group/btn">
                                <a href={`mailto:${mairie.contact.email}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity overflow-hidden">
                                    <div className="bg-white dark:bg-[var(--bg-card-solid)] p-2 rounded-full shadow-sm flex-shrink-0">
                                        <Mail size={20} className="text-orange-600" />
                                    </div>
                                    <span className="text-base font-medium truncate text-orange-700 dark:text-orange-400 font-mono">{mairie.contact.email}</span>
                                </a>
                                <div className="flex gap-2 opacity-0 group-hover/btn:opacity-100 transition-opacity flex-shrink-0">
                                    <button type="button" onClick={(e) => handleEditClick('email', mairie.contact.email, e)} aria-label="Modifier l'email" className="p-1.5 bg-white dark:bg-[var(--bg-card-solid)] rounded-full text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-500/20 shadow-sm cursor-pointer z-50">
                                        <Pencil size={14} />
                                    </button>
                                    <button type="button" onClick={(e) => handleCopy(mairie.contact.email, e)} aria-label="Copier l'email" className="p-1.5 bg-white dark:bg-[var(--bg-card-solid)] rounded-full text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-500/20 shadow-sm cursor-pointer z-50">
                                        <Copy size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2 pl-1">
                            {mairie.contact.autresContacts && mairie.contact.autresContacts.map((contact) => (
                                <div key={contact.id} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                                    <User size={14} className="text-[var(--text-muted)]" />
                                    <span className="font-medium">{contact.nom}</span>
                                    <span className="text-[var(--text-muted)]">-</span>
                                    <span className="font-mono">{contact.numero}</span>
                                    {contact.email && <span className="text-[var(--text-muted)] text-xs">({contact.email})</span>}
                                </div>
                            ))}
                            {isAddingContact ? (
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-[var(--border-subtle)] flex flex-col gap-2 w-fit min-w-[250px] animate-fade-in shadow-sm">
                                    <h5 className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Nouveau Contact</h5>
                                    <input type="text" placeholder="Nom (ex: Mme Dupuis)" aria-label="Nom du contact" className="text-sm p-1.5 rounded border border-[var(--border-subtle)] outline-none focus:border-orange-400 bg-white dark:bg-slate-800 text-[var(--text-primary)]" value={newContactName} onChange={(e) => setNewContactName(e.target.value)} autoFocus />
                                    <input type="text" placeholder="Numéro (ex: 06...)" aria-label="Numéro" className="text-sm p-1.5 rounded border border-[var(--border-subtle)] outline-none focus:border-orange-400 bg-white dark:bg-slate-800 text-[var(--text-primary)]" value={newContactNum} onChange={(e) => setNewContactNum(e.target.value)} />
                                    <input type="email" placeholder="Email (optionnel)" aria-label="Email" className="text-sm p-1.5 rounded border border-[var(--border-subtle)] outline-none focus:border-orange-400 bg-white dark:bg-slate-800 text-[var(--text-primary)]" value={newContactEmail} onChange={(e) => setNewContactEmail(e.target.value)} />
                                    <div className="flex gap-2 mt-1">
                                        <button type="button" onClick={handleAddContactSubmit} className="flex-1 bg-orange-600 text-white text-xs py-1.5 rounded hover:bg-orange-700 font-medium">Ajouter</button>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); setIsAddingContact(false); }} className="flex-1 bg-slate-200 dark:bg-slate-700 text-[var(--text-secondary)] text-xs py-1.5 rounded hover:bg-slate-300 dark:hover:bg-slate-600">Annuler</button>
                                    </div>
                                </div>
                            ) : (
                                <button type="button" onClick={(e) => { e.stopPropagation(); setIsAddingContact(true); }} className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] hover:text-orange-600 transition-colors mt-2 px-2 py-1 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 w-fit">
                                    <Pencil size={12} /> Ajouter un autre contact
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-[var(--border-subtle)] relative h-full min-h-[140px]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex-1 overflow-y-auto mb-2 pr-1 space-y-2 custom-scrollbar max-h-[160px]">
                            {mairie.commentaires.length > 0 ? (
                                mairie.commentaires.map((c) => {
                                    if (deletingCommentId === c.id) {
                                        return (
                                            <div key={c.id} className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/20 rounded p-2 text-center animate-fade-in flex flex-col items-center justify-center gap-2 min-h-[60px]">
                                                <span className="text-xs font-bold text-red-600 dark:text-red-400">Sûr de vouloir supprimer ?</span>
                                                <div className="flex gap-3">
                                                    <button type="button" onClick={() => onDeleteComment(c.id)} className="text-xs bg-red-600 text-white px-3 py-1 rounded font-bold hover:bg-red-700">Oui</button>
                                                    <button type="button" onClick={() => setDeletingCommentId(null)} className="text-xs bg-white dark:bg-[var(--bg-card-solid)] text-[var(--text-secondary)] px-3 py-1 rounded font-bold border border-[var(--border-subtle)] hover:bg-slate-50 dark:hover:bg-slate-700/50">Non</button>
                                                </div>
                                            </div>
                                        );
                                    }
                                    if (editingCommentId === c.id) {
                                        return (
                                            <div key={c.id} className="bg-white dark:bg-[var(--bg-card-solid)] border border-orange-200 dark:border-orange-500/20 rounded p-2 shadow-sm animate-fade-in">
                                                <input className="w-full text-sm p-1 border border-[var(--border-subtle)] rounded outline-none focus:border-orange-400 mb-2 bg-white dark:bg-slate-800 text-[var(--text-primary)]" value={editCommentText} onChange={(e) => setEditCommentText(e.target.value)} autoFocus aria-label="Modifier le commentaire" />
                                                <div className="flex justify-end gap-2">
                                                    <button type="button" onClick={() => setEditingCommentId(null)} className="text-xs text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-700 px-2 py-1 rounded">Annuler</button>
                                                    <button type="button" onClick={saveEditComment} className="text-xs bg-orange-600 text-white px-2 py-1 rounded font-bold hover:bg-orange-700">Enregistrer</button>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div key={c.id} className={`group text-sm border-b border-[var(--border-subtle)] pb-2 last:border-0 relative ${c.texte.includes('[REFUS]') ? 'bg-red-50/50 dark:bg-red-900/20 -mx-2 px-2 rounded' : c.texte.includes('[DOC]') ? 'bg-amber-50/50 dark:bg-amber-900/20 -mx-2 px-2 rounded' : ''} ${c.isFavorite ? 'bg-yellow-50/50 dark:bg-yellow-900/20 -mx-2 px-2 rounded' : ''}`}>
                                            <div className="flex justify-between items-center mb-0.5">
                                                <span className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1">
                                                    {formatDateComment(c.date)} {c.isFavorite && <Star size={10} className="fill-yellow-500 text-yellow-500" />}
                                                </span>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-[var(--bg-card-solid)]/80 rounded px-1">
                                                    <Tooltip
                                                        comingSoon
                                                        content="Le marquage favori sera persisté dès l'ajout de la colonne is_favorite."
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => onToggleFavorite(c.id)}
                                                            aria-label="Marquer comme favori"
                                                            aria-pressed={!!c.isFavorite}
                                                            className={`p-1 rounded hover:bg-yellow-50 dark:hover:bg-yellow-500/10 ${c.isFavorite ? 'text-yellow-500' : 'text-[var(--text-muted)] hover:text-yellow-500'}`}
                                                        >
                                                            <Star size={12} fill={c.isFavorite ? 'currentColor' : 'none'} />
                                                        </button>
                                                    </Tooltip>
                                                    <button type="button" onClick={() => startEditComment(c)} aria-label="Modifier le commentaire" className="p-1 hover:text-orange-600 rounded hover:bg-orange-50 dark:hover:bg-orange-500/10">
                                                        <Edit2 size={12} />
                                                    </button>
                                                    <button type="button" onClick={() => setDeletingCommentId(c.id)} aria-label="Supprimer le commentaire" className="p-1 hover:text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-500/10">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className={`leading-snug pr-8 ${c.texte.includes('[REFUS]') ? 'text-red-700 dark:text-red-400 font-medium' : c.texte.includes('[DOC]') ? 'text-amber-700 dark:text-amber-400 font-medium' : 'text-[var(--text-primary)]'}`}>
                                                {formatCommentText(c.texte)}
                                            </p>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400 italic text-sm">Aucun commentaire</div>
                            )}
                        </div>
                        <form onSubmit={handleSubmitComment} className="relative w-full mt-auto">
                            <input type="text" value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder="Ajouter une note..." aria-label="Ajouter une note" className="w-full bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-lg pl-3 pr-9 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none text-[var(--text-primary)] shadow-sm" />
                            <button type="submit" disabled={!commentInput.trim()} aria-label="Envoyer la note" className="absolute right-1 top-1 p-1 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-colors">
                                <ArrowRight size={14} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
