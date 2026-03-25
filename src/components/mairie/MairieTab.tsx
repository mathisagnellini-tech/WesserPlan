
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronDown, Mail, Phone, Clock, Search, CheckCircle2, AlertCircle, Filter, MoreHorizontal, PhoneCall, Send, MapPin, LayoutGrid, List as ListIcon, Briefcase, User, Lock, ParkingSquare, Plus, Trash2, UserCheck, Download, XCircle, Crown, X, GripVertical, UserPlus, Play, FileText, ArrowRight, ArrowLeft, MessageSquare, Check, Loader2, CalendarDays, ChevronRight, ChevronLeft, History, AlertTriangle, Pencil, Save, Ban, Copy, Edit2, Info, XSquare, Repeat, CalendarClock, Star, Timer } from 'lucide-react';
import { Organization } from '@/types';
import { departmentMap } from '@/constants';

// ... (Keep existing utility functions and constants: useLockBodyScroll, LEADERS, ETAPES_PROGRESSION, ORGS_CONFIG, TYPES interfaces, etc.)
// --- UTILS ---
const useLockBodyScroll = (isLocked: boolean) => {
    useEffect(() => {
        if (isLocked) {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = originalStyle; };
        }
    }, [isLocked]);
};

// --- CONSTANTS & LISTS ---
const LEADERS = ["Thomas R.", "Sarah L.", "Moussa D.", "Julie B.", "Alexandre K.", "Non assigné"];

const ETAPES_PROGRESSION = [
    "À traiter",
    "Mail 1",
    "À appeler",
    "Doc. requis",
    "Mail Final"
];

const ORGS_CONFIG: Record<string, { color: string, bg: string, border: string, label: string, glow: string }> = {
    'msf': { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'MSF', glow: 'hover:shadow-red-500/20 hover:border-red-300' },
    'unicef': { color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', label: 'UNICEF', glow: 'hover:shadow-orange-500/20 hover:border-orange-300' },
    'wwf': { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'WWF', glow: 'hover:shadow-green-500/20 hover:border-green-300' },
    'mdm': { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', label: 'MDM', glow: 'hover:shadow-orange-500/20 hover:border-orange-300' }
};

// --- TYPES ---
interface Horaires {
    [key: string]: string[]; 
}

interface Commentaire {
    id: string;
    date: string; // ISO string
    texte: string;
    isFavorite?: boolean;
}

interface AutreContact {
    id: string;
    nom: string;
    numero: string;
    email?: string; // Added email field
    type: 'tel' | 'mail';
}

interface Mairie {
  id: number;
  nom: string;
  region: string;
  departement: string;
  organization: Organization; // Default organization preference if any
  contact: { 
      email: string; 
      tel: string; 
      nomContact?: string; 
      fonctionContact?: string;
      autresContacts?: AutreContact[];
  };
  infos: {
      adresse: string;
      maire: string;
      digicode?: string;
      parking?: string;
      etage?: string;
  };
  horaires: Horaires;
  population: number;
  semaineDemandee: string;
  dateDemande: string;
  
  // Status & Progress
  etapeProgression: number; // 0 to 4 (index of ETAPES_PROGRESSION)
  statutGeneral: 'À traiter' | 'En cours' | 'Action requise' | 'Validé' | 'Refusé';
  
  commentaires: Commentaire[];
  zoneId?: string;
  
  // Multi-week series tracking
  serieId?: string; 
}

interface Zone {
    id: string;
    name: string;
    leader: string;
    organization: Organization | 'all'; // NGO assigned to this zone
    defaultDuration: number; // Duration in weeks (1, 2, 3...)
    startWeek: number; // New: Starting week of the mission
}

type ViewMode = 'list' | 'grid';

// --- HELPER FUNCTIONS ---
// (Keep all helper functions: getISOWeek, getCalculatedWeekString, getDateFromWeek, getDateFromWeekNumber, isMairieOpen, formatDateComment, formatDateShort, formatCommentText)
const getISOWeek = (date: Date = new Date()) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const getCalculatedWeekString = (startWeek: number, offset: number) => {
    let week = startWeek + offset;
    let year = 2025; // Hardcoded for this demo, usually dynamic
    while (week > 52) {
        week -= 52;
        year++;
    }
    return `${year}-W${week.toString().padStart(2, '0')}`;
};

const getDateFromWeek = (weekStr: string) => {
    if (!weekStr) return new Date();
    const [yearStr, weekNumStr] = weekStr.split('-W');
    const year = parseInt(yearStr);
    const week = parseInt(weekNumStr);
    
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4)
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
        
    return ISOweekStart;
};

const getDateFromWeekNumber = (weekNum: number) => {
    return getDateFromWeek(`2025-W${weekNum}`);
};

const isMairieOpen = (horaires: Horaires): boolean => {
    const now = new Date();
    const days = ['di', 'lu', 'ma', 'me', 'je', 've', 'sa'];
    const dayCode = days[now.getDay()];
    const time = now.getHours() * 60 + now.getMinutes(); 

    if (!horaires[dayCode]) return false;

    return horaires[dayCode].some(creneau => {
        const [start, end] = creneau.split('-');
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        const startTime = sh * 60 + sm;
        const endTime = eh * 60 + em;
        return time >= startTime && time < endTime;
    });
};

const formatDateComment = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date);
};

const formatDateShort = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' }).format(d);
};

const formatCommentText = (text: string) => {
    const regex = /(\d{1,2}[-\/]\d{1,2}(?:[-\/]\d{2,4})?)|(\d{1,2}[h:]\d{2})/gi;
    const parts = text.split(regex);
    return (
        <span>
            {parts.map((part, i) => {
                if (!part) return null;
                if (part.match(regex)) {
                    return <span key={i} className="text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-500/15 px-1 rounded">{part}</span>;
                }
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
};

// --- MOCK DATA ---
const standardHoraires: Horaires = {
    lu: ["09:00-12:00", "14:00-17:00"],
    ma: ["09:00-12:00", "14:00-17:00"],
    me: ["09:00-12:00"],
    je: ["09:00-12:00", "14:00-18:00"],
    ve: ["09:00-12:00", "14:00-16:00"],
};

const initialZones: Zone[] = [
    { id: 'z1', name: 'Zone A (Nord)', leader: 'Thomas R.', organization: 'msf', defaultDuration: 2, startWeek: 45 },
    { id: 'z2', name: 'Centre-Ville', leader: 'Sarah L.', organization: 'unicef', defaultDuration: 1, startWeek: 48 },
];

const initialMairieData: Mairie[] = [
    { 
        id: 1, nom: 'Saint-Herblain', region: 'Pays de la Loire', departement: '44', organization: 'msf',
        contact: { email: 'contact@saint-herblain.fr', tel: '02 28 25 20 00', nomContact: 'Mme. Dupont', fonctionContact: 'Secrétariat Général'}, 
        infos: { adresse: '2 Rue de l\'Hôtel de Ville, 44800 Saint-Herblain', maire: 'Bertrand Affilé', parking: 'Oui, derrière le bâtiment', etage: '1er étage, porte gauche' },
        horaires: standardHoraires,
        population: 46603, semaineDemandee: '2025-W45', dateDemande: '2025-10-27', 
        etapeProgression: 2, statutGeneral: 'Action requise', 
        commentaires: [
            { id: 'c1', date: '2024-09-15T10:30:00', texte: 'Rappeler impérativement le 12/10, la secrétaire est absente le lundi.', isFavorite: true },
            { id: 'c2', date: '2024-09-10T14:00:00', texte: 'Premier mail envoyé, pas de réponse.' }
        ],
        zoneId: 'z1',
        serieId: 'serie-1'
    },
    { 
        id: 2, nom: 'Rezé', region: 'Pays de la Loire', departement: '44', organization: 'unicef',
        contact: { email: 'mairie@mairie-reze.fr', tel: '02 40 84 42 00', nomContact: 'Accueil', fonctionContact: 'Standard'}, 
        infos: { adresse: 'Place Jean-Baptiste Daviais, 44400 Rezé', maire: 'Agnès Bourgeais', digicode: 'A45B (Portail arrière)' },
        horaires: { ...standardHoraires, sa: ["09:00-12:00"] },
        population: 42998, semaineDemandee: '2025-W46', dateDemande: '2025-11-03', 
        etapeProgression: 4, statutGeneral: 'Validé', 
        commentaires: [
             { id: 'c3', date: '2024-10-01T09:00:00', texte: 'Accord verbal reçu ce matin !' }
        ],
        zoneId: 'z1',
        serieId: 'serie-1'
    },
    { 
        id: 3, nom: 'Nantes', region: 'Pays de la Loire', departement: '44', organization: 'wwf',
        contact: { email: 'contact@nantesmetropole.fr', tel: '02 40 41 90 00'}, 
        infos: { adresse: '2 Rue de l\'Hôtel de Ville, 44000 Nantes', maire: 'Johanna Rolland' },
        horaires: standardHoraires,
        population: 318808, semaineDemandee: '2025-W48', dateDemande: '2025-11-17', 
        etapeProgression: 1, statutGeneral: 'En cours', 
        commentaires: [],
        zoneId: 'z2'
    },
    {
        id: 4, nom: 'Strasbourg', region: 'Grand Est', departement: '67', organization: 'msf',
        contact: { email: 'autorisations@strasbourg.eu', tel: '03 68 98 50 00' },
        infos: { adresse: '1 Parc de l\'Étoile, 67000 Strasbourg', maire: 'Jeanne Barseghian' },
        horaires: standardHoraires,
        population: 291313, semaineDemandee: '2025-W40', dateDemande: '2025-09-29',
        etapeProgression: 1, statutGeneral: 'En cours',
        commentaires: [],
    },
    {
        id: 5, nom: 'Colmar', region: 'Grand Est', departement: '68', organization: 'msf',
        contact: { email: 'contact@colmar.fr', tel: '03 89 20 68 68' },
        infos: { adresse: '1 Place de la Mairie, 68000 Colmar', maire: 'Eric Straumann' },
        horaires: standardHoraires,
        population: 67000, semaineDemandee: '2025-W40', dateDemande: '2025-09-29',
        etapeProgression: 0, statutGeneral: 'À traiter',
        commentaires: [],
    },
];

// ... (Keep Toast, RefusalModal, DocRequiredModal, ContactEditModal, MairieDetailModal, WeekRatioSelector, ZoneTimeManager, MairieCard components - no changes needed inside them, just ensuring they are preserved)
// (Omitting unchanged components code for brevity in this response block, assuming they are preserved from previous step)
const Toast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
    useEffect(() => { const timer = setTimeout(onClose, 4000); return () => clearTimeout(timer); }, [onClose]);
    return ( <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] animate-fade-in"> <div className="bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-slate-700"> <Loader2 size={18} className="text-orange-400 animate-spin" /> <span className="font-medium text-sm">{message}</span> </div> </div> );
};
const RefusalModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: (reason: string) => void }> = ({ isOpen, onClose, onConfirm }) => {
    useLockBodyScroll(isOpen); const [reason, setReason] = useState(''); if (!isOpen) return null;
    return ( <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm transition-all" onClick={onClose}> <div className="bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in" onClick={e => e.stopPropagation()}> <div className="flex items-center gap-3 mb-4 text-red-600"> <Ban size={28} /> <h3 className="text-xl font-bold">Motif du refus</h3> </div> <p className="text-[var(--text-secondary)] text-sm mb-4">La mairie refuse votre demande ? Une justification écrite est <span className="font-bold">obligatoire</span> pour valider ce statut.</p> <textarea className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none mb-4 min-h-[100px]" placeholder="Ex: Pas de disponibilité de salle, refus du maire..." value={reason} onChange={(e) => setReason(e.target.value)} autoFocus /> <div className="flex justify-end gap-3"> <button onClick={onClose} className="px-4 py-2 text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors">Annuler</button> <button onClick={() => { if(reason.trim()) { onConfirm(reason); setReason(''); onClose(); } }} disabled={!reason.trim()} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"> Valider le refus </button> </div> </div> </div> );
};
const DocRequiredModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: (docName: string) => void }> = ({ isOpen, onClose, onConfirm }) => {
    useLockBodyScroll(isOpen); const [docName, setDocName] = useState(''); if (!isOpen) return null;
    return ( <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm transition-all" onClick={onClose}> <div className="bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in" onClick={e => e.stopPropagation()}> <div className="flex items-center gap-3 mb-4 text-amber-600"> <FileText size={28} /> <h3 className="text-xl font-bold">Documents Requis</h3> </div> <p className="text-[var(--text-secondary)] text-sm mb-4">Quels documents la mairie demande-t-elle ? (ex: Kbis, Assurance...)</p> <textarea className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none mb-4 min-h-[100px]" placeholder="Liste des documents..." value={docName} onChange={(e) => setDocName(e.target.value)} autoFocus /> <div className="flex justify-end gap-3"> <button onClick={onClose} className="px-4 py-2 text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors">Annuler</button> <button onClick={() => { if(docName.trim()) { onConfirm(docName); setDocName(''); onClose(); } }} disabled={!docName.trim()} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"> Confirmer </button> </div> </div> </div> );
};
const ContactEditModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: (val: string) => void; field: 'tel' | 'email'; currentValue: string; }> = ({ isOpen, onClose, onConfirm, field, currentValue }) => {
    useLockBodyScroll(isOpen); const [value, setValue] = useState(currentValue); useEffect(() => { setValue(currentValue); }, [currentValue, isOpen]); if (!isOpen) return null; const label = field === 'tel' ? 'numéro de téléphone' : 'adresse email';
    return ( <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm transition-all" onClick={onClose}> <div className="bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl shadow-2xl w-full max-w-md p-0 overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}> <div className="bg-orange-50 dark:bg-orange-500/10 p-6 border-b border-orange-100 dark:border-orange-500/20 flex items-start gap-4"> <div className="bg-orange-100 dark:bg-orange-500/20 p-2 rounded-full shrink-0"> <AlertTriangle className="text-orange-600 dark:text-orange-400" size={24} /> </div> <div> <h3 className="text-lg font-bold text-orange-900 dark:text-orange-300 mb-1">Attention, modification sensible</h3> <p className="text-sm text-orange-800 dark:text-orange-300/80 leading-relaxed"> Vous désirez changer le <span className="font-bold">{label}</span> officiel de cette mairie. Attention, faites bien attention : cette modification est définitive et impactera les fiches de contact pour toute l'équipe. </p> </div> </div> <div className="p-6"> <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2"> Nouveau {field === 'tel' ? 'Numéro' : 'Email'} </label> <input type={field === 'tel' ? 'tel' : 'email'} className="w-full text-lg font-medium p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" value={value} onChange={(e) => setValue(e.target.value)} autoFocus /> </div> <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-[var(--border-subtle)] flex justify-end gap-3"> <button onClick={onClose} className="px-5 py-2.5 text-[var(--text-secondary)] hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-sm transition-colors"> Annuler </button> <button onClick={() => { onConfirm(value); onClose(); }} disabled={!value.trim() || value === currentValue} className="px-6 py-2.5 bg-orange-600 text-white hover:bg-orange-700 rounded-xl font-bold text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"> Valider la modification </button> </div> </div> </div> );
};
const MairieDetailModal: React.FC<{ mairie: Mairie | null; onClose: () => void; showToast: (msg: string) => void }> = ({ mairie, onClose, showToast }) => {
    useLockBodyScroll(!!mairie); if (!mairie) return null; const days = ['lu', 'ma', 'me', 'je', 've', 'sa', 'di']; const dayLabels = { lu: 'Lundi', ma: 'Mardi', me: 'Mercredi', je: 'Jeudi', ve: 'Vendredi', sa: 'Samedi', di: 'Dimanche' }; const currentDay = new Date().getDay() === 0 ? 'di' : days[new Date().getDay() - 1]; const handleGenerateDocs = () => { showToast("Une IA va vous fournir les éléments nécessaires à la poursuite de cette étape"); };
    return ( <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"> <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div> <div className="relative bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in"> <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center"> <div> <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2"> <Briefcase className="text-orange-600" /> {mairie.nom} </h2> <p className="text-sm text-[var(--text-secondary)]">{mairie.infos.adresse}</p> </div> <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20} /></button> </div> <div className="p-6 overflow-y-auto"> <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div className="space-y-4"> <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2"><UserCheck size={18} /> Décideurs & Contact</h3> <div className="bg-orange-50 dark:bg-orange-500/10 p-4 rounded-xl space-y-3"> <div> <p className="text-xs text-orange-600 font-semibold uppercase tracking-wider">Maire</p> <p className="font-medium text-[var(--text-primary)]">{mairie.infos.maire}</p> </div> {mairie.contact.nomContact && ( <div> <p className="text-xs text-orange-600 font-semibold uppercase tracking-wider">Gatekeeper / Secrétaire</p> <p className="font-medium text-[var(--text-primary)]">{mairie.contact.nomContact}</p> <p className="text-xs text-[var(--text-secondary)]">{mairie.contact.fonctionContact}</p> </div> )} <div className="pt-2 border-t border-orange-100 dark:border-orange-500/20 flex gap-3"> <a href={`tel:${mairie.contact.tel}`} className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-[var(--bg-card-solid)] py-2 rounded-lg shadow-sm text-sm font-medium text-[var(--text-primary)] hover:bg-slate-50 dark:hover:bg-slate-700/50"><Phone size={14}/> Appeler</a> <a href={`mailto:${mairie.contact.email}`} className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-[var(--bg-card-solid)] py-2 rounded-lg shadow-sm text-sm font-medium text-[var(--text-primary)] hover:bg-slate-50 dark:hover:bg-slate-700/50"><Mail size={14}/> Email</a> </div> </div> <button onClick={handleGenerateDocs} className="w-full mt-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2 font-semibold"> <FileText size={18} /> Générer documents </button> </div> <div> <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2 border-b pb-2"><Clock size={18} /> Horaires d'ouverture</h3> <div className="mt-3 space-y-1"> {days.map(day => { const isToday = day === currentDay; const slots = mairie.horaires[day]; return ( <div key={day} className={`flex justify-between text-sm py-1.5 px-3 rounded-lg ${isToday ? 'bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 font-medium' : ''}`}> <span className={`w-24 ${isToday ? 'text-green-800 dark:text-green-400' : 'text-[var(--text-secondary)]'}`}>{dayLabels[day as keyof typeof dayLabels]}</span> <div className="text-right"> {slots ? (slots.map((s, i) => <span key={i} className={`block ${isToday ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>{s}</span>)) : (<span className="text-[var(--text-muted)] italic">Fermé</span>)} </div> </div> ); })} </div> </div> </div> </div> </div> </div> );
};
const WeekRatioSelector: React.FC<{ rank: number; total: number; onUpdateTotal: (d: number) => void; }> = ({ rank, total, onUpdateTotal }) => {
    const [isOpen, setIsOpen] = useState(false); const dropdownRef = useRef<HTMLDivElement>(null);
    useEffect(() => { const handleClickOutside = (event: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) { setIsOpen(false); } }; document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, []);
    return ( <div className="relative text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1 bg-white/50 dark:bg-[var(--bg-card-solid)]/50 px-2 py-1 rounded-lg border border-[var(--border-subtle)]" ref={dropdownRef}> <span>Semaine {rank} sur</span> <div className="text-red-600 font-bold cursor-pointer hover:bg-red-50 px-1 rounded transition-colors select-none flex items-center" onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}> {total} </div> {isOpen && ( <div className="absolute top-full right-0 mt-1 bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] shadow-xl rounded-lg overflow-hidden z-50 flex flex-col min-w-[40px]"> {[1, 2, 3, 4, 5].map(n => ( <div key={n} onClick={(e) => { e.stopPropagation(); onUpdateTotal(n); setIsOpen(false); }} className={`px-3 py-2 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 font-bold text-xs border-b border-slate-50 last:border-0 ${total === n ? 'text-red-600 bg-red-50' : 'text-[var(--text-secondary)]'}`} > {n} </div> ))} </div> )} </div> );
};
const ZoneTimeManager: React.FC<{ startWeek: number; duration: number; onUpdateStart: (w: number) => void; onUpdateDuration: (d: number) => void; currentWeek: number; }> = ({ startWeek, duration, onUpdateStart, onUpdateDuration, currentWeek }) => {
    const [isStartOpen, setIsStartOpen] = useState(false); const currentRank = Math.max(1, currentWeek - startWeek + 1);
    return ( <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg border border-[var(--border-subtle)] ml-4"> <div className="relative"> <button onClick={() => setIsStartOpen(!isStartOpen)} className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-xs font-bold text-[var(--text-primary)]"> Start S{startWeek} <ChevronDown size={10} className="text-[var(--text-muted)]"/> </button> {isStartOpen && ( <div className="absolute top-full left-0 mt-1 bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] shadow-xl rounded-lg overflow-y-auto max-h-[200px] z-50 w-20"> {Array.from({length: 52}, (_, i) => i + 1).map(w => ( <div key={w} className={`px-3 py-2 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 ${w === startWeek ? 'bg-orange-50 text-orange-600 font-bold' : 'text-[var(--text-secondary)]'}`} onClick={() => { onUpdateStart(w); setIsStartOpen(false); }} > S{w} </div> ))} </div> )} </div> <span className="text-slate-300">|</span> <WeekRatioSelector rank={currentRank} total={duration} onUpdateTotal={onUpdateDuration} /> </div> );
};
const MairieCard: React.FC<{ mairie: Mairie, zoneOrg?: Organization | 'all', zoneDuration: number, zoneStartWeek?: number, viewMode: ViewMode, seriesInfo: { rank: number, total: number }, currentNavigationWeek: number, onRemove?: () => void, onStatusChange: (status: string) => void, onProgressChange: (stepIndex: number) => void, onAddComment: (text: string) => void, onDeleteComment: (commentId: string) => void, onEditComment: (commentId: string, newText: string) => void, onToggleFavorite: (commentId: string) => void, onAddContact: (nom: string, numero: string, email?: string) => void, onUpdateContact: (field: 'tel' | 'email', value: string) => void, onClick: () => void, onShowToast: (message: string) => void, onDocRequest: () => void, onRequestContactEdit: (field: 'tel' | 'email', currentVal: string) => void, onExtendWeek: () => void, onSetDuration: (d: number) => void }> = ({ mairie, zoneOrg, zoneDuration, zoneStartWeek, viewMode, seriesInfo, currentNavigationWeek, onRemove, onStatusChange, onProgressChange, onAddComment, onDeleteComment, onEditComment, onToggleFavorite, onAddContact, onUpdateContact, onClick, onShowToast, onDocRequest, onRequestContactEdit, onExtendWeek, onSetDuration }) => {
    const isOpen = isMairieOpen(mairie.horaires); const [commentInput, setCommentInput] = useState(""); const [showRefusal, setShowRefusal] = useState(false); const [isAddingContact, setIsAddingContact] = useState(false); const [newContactName, setNewContactName] = useState(""); const [newContactNum, setNewContactNum] = useState(""); const [newContactEmail, setNewContactEmail] = useState(""); const [editingCommentId, setEditingCommentId] = useState<string | null>(null); const [editCommentText, setEditCommentText] = useState(""); const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null); const orgKey = zoneOrg !== 'all' && zoneOrg ? zoneOrg : (mairie.organization || 'msf'); const theme = ORGS_CONFIG[orgKey] || ORGS_CONFIG['msf'];
    const handleSubmitComment = (e: React.FormEvent) => { e.preventDefault(); if (!commentInput.trim()) return; onAddComment(commentInput); setCommentInput(""); };
    const handleAddContactSubmit = (e: React.MouseEvent) => { e.stopPropagation(); if (newContactName && (newContactNum || newContactEmail)) { onAddContact(newContactName, newContactNum, newContactEmail); setNewContactName(""); setNewContactNum(""); setNewContactEmail(""); setIsAddingContact(false); } };
    const handleRemoveClick = (e: React.MouseEvent) => { e.stopPropagation(); if (onRemove && window.confirm(`Souhaitez-vous supprimer la mairie de ${mairie.nom} de la semaine ${mairie.semaineDemandee} ?`)) { onRemove(); } };
    const handleRefusal = (reason: string) => { onAddComment(`[REFUS] ${reason}`); onStatusChange('Refusé'); };
    const handleCopy = (text: string, e: React.MouseEvent) => { e.stopPropagation(); navigator.clipboard.writeText(text); onShowToast("Copié !"); };
    const handleEditClick = (field: 'tel' | 'email', currentVal: string, e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); onRequestContactEdit(field, currentVal); };
    const handleStepClick = (stepIdx: number, e: React.MouseEvent) => { e.stopPropagation(); if (stepIdx === 3) { onDocRequest(); } else { onProgressChange(stepIdx); } };
    const startEditComment = (c: Commentaire) => { setEditingCommentId(c.id); setEditCommentText(c.texte); };
    const saveEditComment = () => { if(editingCommentId && editCommentText.trim()) { onEditComment(editingCommentId, editCommentText); setEditingCommentId(null); setEditCommentText(""); } };
    const progressColors = [ 'bg-emerald-200 text-emerald-800', 'bg-emerald-300 text-emerald-900', 'bg-emerald-400 text-white', 'bg-emerald-500 text-white', 'bg-emerald-700 text-white' ];
    const deptName = departmentMap[mairie.departement] || ''; const displayDate = "08/10";

    if (viewMode === 'grid') {
        const favoriteComment = mairie.commentaires.find(c => c.isFavorite);
        const displayComment = favoriteComment || (mairie.commentaires.length > 0 ? mairie.commentaires[0] : null);
        return (
            <div onClick={onClick} className={`group relative bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col h-[200px] ${theme.glow}`}>
                 <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${theme.bg.replace('bg-', 'bg-').replace('50', '500')}`}></div>
                <div className="p-4 flex flex-col gap-1 border-b border-slate-50 pl-6 bg-slate-50/30 dark:bg-slate-800/20">
                    <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-[var(--text-primary)] text-lg leading-tight line-clamp-1 tracking-tight">{mairie.nom}</h4>
                        <div className="shrink-0"> <WeekRatioSelector rank={seriesInfo.rank} total={seriesInfo.total} onUpdateTotal={onSetDuration} /> </div>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wide truncate"> {mairie.departement} - {deptName} • {mairie.region} • {mairie.population.toLocaleString()} hab. </p>
                </div>
                <div className="p-4 flex-1 flex flex-col gap-3 pl-6">
                    {displayComment ? ( <div className={`mt-auto p-2 rounded text-xs border line-clamp-3 ${favoriteComment ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-slate-50 dark:bg-slate-800/50 border-[var(--border-subtle)] text-[var(--text-secondary)] italic'}`}> {favoriteComment && <Star size={10} className="inline mr-1 -mt-0.5 fill-yellow-500 text-yellow-500"/>} {formatCommentText(displayComment.texte)} </div> ) : ( <div className="mt-auto text-xs text-slate-300 italic">Aucune note...</div> )}
                </div>
                {onRemove && ( <button onClick={handleRemoveClick} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 bg-white dark:bg-[var(--bg-card-solid)] text-red-400 hover:text-red-600 rounded-full shadow-sm border border-[var(--border-subtle)] transition-all z-20"> <X size={14} /> </button> )}
            </div>
        );
    }

    return (
        <div className={`group relative bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-xl shadow-sm hover:shadow-lg transition-all flex flex-col ${theme.glow}`}>
            <RefusalModal isOpen={showRefusal} onClose={() => setShowRefusal(false)} onConfirm={handleRefusal} />
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${theme.bg.replace('bg-', 'bg-').replace('50', '500')}`}></div>
            {onRemove && ( <button onClick={handleRemoveClick} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-2 bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-full transition-all z-20" title="Supprimer la mairie"> <X size={20} /> </button> )}
            <div className="p-6 flex flex-col h-full gap-6 pl-7">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3">
                             <h4 className={`font-extrabold text-[var(--text-primary)] leading-tight text-3xl tracking-tight ${mairie.statutGeneral === 'Refusé' ? 'line-through text-[var(--text-muted)]' : ''}`}> {mairie.nom} </h4>
                             <button onClick={(e) => { e.stopPropagation(); onClick(); }} className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 text-[var(--text-secondary)] hover:text-orange-600 rounded-full text-xs font-bold transition-colors border border-[var(--border-subtle)] cursor-pointer"> <Info size={14}/> Information </button>
                            <div className={`flex items-center gap-2 ml-2 px-3 py-1 rounded-full border ${isOpen ? 'bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20' : 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20'}`}> <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div> <span className={`text-xs font-bold ${isOpen ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}> {isOpen ? "Mairie ouverte" : "Mairie fermée"} </span> </div>
                             {mairie.statutGeneral === 'Refusé' && <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded uppercase">Refusé</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5"> <p className="text-sm text-[var(--text-secondary)] font-semibold uppercase tracking-wide"> {mairie.departement} - {deptName} • {mairie.region} </p> <span className="text-slate-300">•</span> <p className="text-sm text-[var(--text-secondary)] font-semibold">{mairie.population.toLocaleString()} hab.</p> </div>
                        <div className="flex items-center gap-3 mt-4">
                            <div onClick={(e) => { e.stopPropagation(); onShowToast("Date liée à la demande dans NOS COMMUNES"); }} className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-[var(--border-subtle)] rounded-md text-xs font-bold text-[var(--text-secondary)] cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Date de la demande (Non modifiable)"> <Lock size={12} /> {displayDate} </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 w-full md:w-[450px]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2 w-full mt-6">
                             <button onClick={() => setShowRefusal(true)} className="px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-all border border-red-200 dark:border-red-500/20 hover:shadow-md hover:shadow-red-200 dark:hover:shadow-red-500/10 flex-shrink-0 flex items-center gap-2 font-bold text-xs" title="Refus de la mairie"> Refus </button>
                            <div className="flex items-center w-full h-8 rounded-lg overflow-hidden border border-[var(--border-subtle)] shadow-sm bg-slate-50 dark:bg-slate-800/50">
                                {ETAPES_PROGRESSION.map((step, idx) => {
                                    const isActive = idx === mairie.etapeProgression; const isCompleted = idx < mairie.etapeProgression;
                                    let bgClass = 'bg-slate-50 dark:bg-slate-800/50 text-[var(--text-muted)]'; if (isCompleted) bgClass = 'bg-emerald-100 text-emerald-600'; if (isActive) bgClass = 'bg-emerald-600 text-white font-bold shadow-md z-10';
                                    return ( <div key={idx} onClick={(e) => handleStepClick(idx, e)} className={`flex-1 h-full flex items-center justify-center cursor-pointer transition-all relative ${bgClass} ${idx !== 0 ? 'border-l border-white/50' : ''} ${isActive ? 'scale-105 transform' : 'hover:bg-slate-100 dark:hover:bg-slate-700'} `} > <span className="text-[10px] uppercase tracking-tight truncate px-1 text-center leading-none select-none"> {step} </span> </div> );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-4 justify-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col gap-3">
                             <div className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 shadow-sm group/btn"> <a href={`tel:${mairie.contact.tel}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity"> <div className="bg-white dark:bg-[var(--bg-card-solid)] p-2 rounded-full shadow-sm"> <PhoneCall size={20} className="text-green-600" /> </div> <span className="text-xl font-bold tracking-wide text-green-700 dark:text-green-400 font-mono">{mairie.contact.tel}</span> </a> <div className="flex gap-2 opacity-0 group-hover/btn:opacity-100 transition-opacity"> <button onClick={(e) => handleEditClick('tel', mairie.contact.tel, e)} className="p-1.5 bg-white dark:bg-[var(--bg-card-solid)] rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-500/20 shadow-sm cursor-pointer z-50"><Pencil size={14}/></button> <button onClick={(e) => handleCopy(mairie.contact.tel, e)} className="p-1.5 bg-white dark:bg-[var(--bg-card-solid)] rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-500/20 shadow-sm cursor-pointer z-50"><Copy size={14}/></button> </div> </div>
                             <div className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 shadow-sm group/btn"> <a href={`mailto:${mairie.contact.email}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity overflow-hidden"> <div className="bg-white dark:bg-[var(--bg-card-solid)] p-2 rounded-full shadow-sm flex-shrink-0"> <Mail size={20} className="text-orange-600" /> </div> <span className="text-base font-medium truncate text-orange-700 dark:text-orange-400 font-mono">{mairie.contact.email}</span> </a> <div className="flex gap-2 opacity-0 group-hover/btn:opacity-100 transition-opacity flex-shrink-0"> <button onClick={(e) => handleEditClick('email', mairie.contact.email, e)} className="p-1.5 bg-white dark:bg-[var(--bg-card-solid)] rounded-full text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-500/20 shadow-sm cursor-pointer z-50"><Pencil size={14}/></button> <button onClick={(e) => handleCopy(mairie.contact.email, e)} className="p-1.5 bg-white dark:bg-[var(--bg-card-solid)] rounded-full text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-500/20 shadow-sm cursor-pointer z-50"><Copy size={14}/></button> </div> </div>
                        </div>
                        <div className="space-y-2 pl-1">
                             {mairie.contact.autresContacts && mairie.contact.autresContacts.map(contact => ( <div key={contact.id} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]"> <User size={14} className="text-[var(--text-muted)]"/> <span className="font-medium">{contact.nom}</span> <span className="text-[var(--text-muted)]">-</span> <span className="font-mono">{contact.numero}</span> {contact.email && <span className="text-[var(--text-muted)] text-xs">({contact.email})</span>} </div> ))}
                             {isAddingContact ? ( <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-[var(--border-subtle)] flex flex-col gap-2 w-fit min-w-[250px] animate-fade-in shadow-sm"> <h5 className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Nouveau Contact</h5> <input type="text" placeholder="Nom (ex: Mme Dupuis)" className="text-sm p-1.5 rounded border border-[var(--border-subtle)] outline-none focus:border-orange-400" value={newContactName} onChange={e => setNewContactName(e.target.value)} autoFocus /> <input type="text" placeholder="Numéro (ex: 06...)" className="text-sm p-1.5 rounded border border-[var(--border-subtle)] outline-none focus:border-orange-400" value={newContactNum} onChange={e => setNewContactNum(e.target.value)} /> <input type="email" placeholder="Email (optionnel)" className="text-sm p-1.5 rounded border border-[var(--border-subtle)] outline-none focus:border-orange-400" value={newContactEmail} onChange={e => setNewContactEmail(e.target.value)} /> <div className="flex gap-2 mt-1"> <button onClick={handleAddContactSubmit} className="flex-1 bg-orange-600 text-white text-xs py-1.5 rounded hover:bg-orange-700 font-medium">Ajouter</button> <button onClick={(e) => { e.stopPropagation(); setIsAddingContact(false); }} className="flex-1 bg-slate-200 dark:bg-slate-700 text-[var(--text-secondary)] text-xs py-1.5 rounded hover:bg-slate-300">Annuler</button> </div> </div> ) : ( <button onClick={(e) => { e.stopPropagation(); setIsAddingContact(true); }} className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] hover:text-orange-600 transition-colors mt-2 px-2 py-1 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 w-fit"> <Pencil size={12} /> Ajouter un autre contact </button> )}
                        </div>
                    </div>
                    <div className="flex flex-col bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-[var(--border-subtle)] relative h-full min-h-[140px]" onClick={e => e.stopPropagation()}>
                        <div className="flex-1 overflow-y-auto mb-2 pr-1 space-y-2 custom-scrollbar max-h-[160px]">
                            {mairie.commentaires.length > 0 ? (
                                mairie.commentaires.map(c => {
                                    if (deletingCommentId === c.id) {
                                        return ( <div key={c.id} className="bg-red-50 border border-red-200 rounded p-2 text-center animate-fade-in flex flex-col items-center justify-center gap-2 min-h-[60px]"> <span className="text-xs font-bold text-red-600">Sûr de vouloir supprimer ?</span> <div className="flex gap-3"> <button onClick={() => onDeleteComment(c.id)} className="text-xs bg-red-600 text-white px-3 py-1 rounded font-bold hover:bg-red-700">Oui</button> <button onClick={() => setDeletingCommentId(null)} className="text-xs bg-white dark:bg-[var(--bg-card-solid)] text-[var(--text-secondary)] px-3 py-1 rounded font-bold border border-[var(--border-subtle)] hover:bg-slate-50 dark:hover:bg-slate-700/50">Non</button> </div> </div> );
                                    }
                                    if (editingCommentId === c.id) {
                                        return ( <div key={c.id} className="bg-white dark:bg-[var(--bg-card-solid)] border border-orange-200 rounded p-2 shadow-sm animate-fade-in"> <input className="w-full text-sm p-1 border border-[var(--border-subtle)] rounded outline-none focus:border-orange-400 mb-2" value={editCommentText} onChange={e => setEditCommentText(e.target.value)} autoFocus /> <div className="flex justify-end gap-2"> <button onClick={() => setEditingCommentId(null)} className="text-xs text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-700 px-2 py-1 rounded">Annuler</button> <button onClick={saveEditComment} className="text-xs bg-orange-600 text-white px-2 py-1 rounded font-bold hover:bg-orange-700">Enregistrer</button> </div> </div> );
                                    }
                                    return ( <div key={c.id} className={`group text-sm border-b border-[var(--border-subtle)] pb-2 last:border-0 relative ${c.texte.includes('[REFUS]') ? 'bg-red-50/50 -mx-2 px-2 rounded' : c.texte.includes('[DOC]') ? 'bg-amber-50/50 -mx-2 px-2 rounded' : ''} ${c.isFavorite ? 'bg-yellow-50/50 -mx-2 px-2 rounded' : ''}`}> <div className="flex justify-between items-center mb-0.5"> <span className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1"> {formatDateComment(c.date)} {c.isFavorite && <Star size={10} className="fill-yellow-500 text-yellow-500"/>} </span> <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-[var(--bg-card-solid)]/80 rounded px-1"> <button onClick={() => onToggleFavorite(c.id)} className={`p-1 rounded hover:bg-yellow-50 dark:hover:bg-yellow-500/10 ${c.isFavorite ? 'text-yellow-500' : 'text-[var(--text-muted)] hover:text-yellow-500'}`} title="Favori"> <Star size={12} fill={c.isFavorite ? "currentColor" : "none"} /> </button> <button onClick={() => startEditComment(c)} className="p-1 hover:text-orange-600 rounded hover:bg-orange-50 dark:hover:bg-orange-500/10" title="Modifier"> <Edit2 size={12} /> </button> <button onClick={() => setDeletingCommentId(c.id)} className="p-1 hover:text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-500/10" title="Supprimer"> <Trash2 size={12} /> </button> </div> </div> <p className={`leading-snug pr-8 ${c.texte.includes('[REFUS]') ? 'text-red-700 font-medium' : c.texte.includes('[DOC]') ? 'text-amber-700 font-medium' : 'text-[var(--text-primary)]'}`}> {formatCommentText(c.texte)} </p> </div> );
                                })
                            ) : ( <div className="h-full flex items-center justify-center text-slate-300 italic text-sm">Aucun commentaire</div> )}
                        </div>
                        <form onSubmit={handleSubmitComment} className="relative w-full mt-auto"> <input type="text" value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder="Ajouter une note..." className="w-full bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-lg pl-3 pr-9 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none text-[var(--text-primary)] shadow-sm" /> <button type="submit" disabled={!commentInput.trim()} className="absolute right-1 top-1 p-1 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:bg-slate-300 transition-colors"> <ArrowRight size={14} /> </button> </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ZoneCard: React.FC<{ zone: Zone, assignedMairies: Mairie[], availableMairies: Mairie[], viewMode: ViewMode, currentNavigationWeek: number, onUpdateZone: (id: string, field: keyof Zone, value: string | number) => void, onAddMairie: (zoneId: string, mairieId: number) => void, onRemoveMairie: (mairieId: number) => void, onUpdateMairieStatus: (mairieId: number, status: string) => void, onUpdateMairieProgress: (mairieId: number, step: number) => void, onAddMairieComment: (mairieId: number, text: string) => void, onDeleteMairieComment: (mairieId: number, commentId: string) => void, onEditMairieComment: (mairieId: number, commentId: string, text: string) => void, onToggleMairieCommentFavorite: (mairieId: number, commentId: string) => void, onAddMairieContact: (mairieId: number, nom: string, num: string, email?: string) => void, onUpdateMairieContactInfo: (mairieId: number, field: 'tel' | 'email', value: string) => void, onOpenDetail: (mairie: Mairie) => void, onDeleteZone: (id: string) => void, onShowToast: (msg: string) => void, onExtendMairie: (mairieId: number) => void, onSetMairieDuration: (mairieId: number, d: number) => void }> = ({ zone, assignedMairies, availableMairies, viewMode, currentNavigationWeek, onUpdateZone, onAddMairie, onRemoveMairie, onUpdateMairieStatus, onUpdateMairieProgress, onAddMairieComment, onDeleteMairieComment, onEditMairieComment, onToggleMairieCommentFavorite, onAddMairieContact, onUpdateMairieContactInfo, onOpenDetail, onDeleteZone, onShowToast, onExtendMairie, onSetMairieDuration }) => {
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
                        {isSearching && search.length > 0 && ( <div className="absolute z-20 w-full mt-2 bg-white dark:bg-[var(--bg-card-solid)] rounded-xl shadow-xl border border-[var(--border-subtle)] overflow-hidden"> {filteredAvailable.length > 0 ? ( filteredAvailable.map(m => ( <div key={m.id} className="px-4 py-3 hover:bg-orange-50 dark:hover:bg-orange-500/10 cursor-pointer flex justify-between items-center group border-b border-slate-50 dark:border-slate-700 last:border-0" onClick={() => { onAddMairie(zone.id, m.id); setSearch(""); setIsSearching(false); }} > <span className="text-base font-medium text-[var(--text-primary)]">{m.nom}</span> <Plus size={20} className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" /> </div> )) ) : ( <div className="px-4 py-3 text-sm text-[var(--text-muted)] italic">Aucune commune trouvée (ou déjà assignée).</div> )} </div> )}
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
