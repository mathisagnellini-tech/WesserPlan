import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Ban,
  FileText,
  AlertTriangle,
  X,
  Briefcase,
  Clock,
  Phone,
  Mail,
  UserCheck,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useDialogA11y } from '@/hooks/useDialogA11y';
import { Tooltip } from '@/components/ui/Tooltip';
import type { Mairie } from './types';

export type ToastSeverity = 'info' | 'success' | 'error';

const TOAST_TONE: Record<ToastSeverity, { ring: string; icon: React.ReactNode }> = {
  info: {
    ring: 'border-slate-700',
    icon: <Info size={18} className="text-sky-300" />,
  },
  success: {
    ring: 'border-emerald-600/50',
    icon: <CheckCircle2 size={18} className="text-emerald-300" />,
  },
  error: {
    ring: 'border-red-600/60',
    icon: <AlertTriangle size={18} className="text-red-300" />,
  },
};

export const Toast: React.FC<{ message: string; severity?: ToastSeverity; onClose: () => void; durationMs?: number }> = ({
  message,
  severity = 'info',
  onClose,
  durationMs = 4000,
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [onClose, durationMs]);
  const tone = TOAST_TONE[severity];
  const live = severity === 'error' ? 'assertive' : 'polite';
  return (
    <div
      role={severity === 'error' ? 'alert' : 'status'}
      aria-live={live}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] animate-fade-in"
    >
      <div className={`bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border ${tone.ring}`}>
        {tone.icon}
        <span className="font-medium text-sm">{message}</span>
      </div>
    </div>
  );
};

export const RefusalModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: (reason: string) => void }> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const titleId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { dialogRef } = useDialogA11y({ isOpen, onClose, initialFocusRef: inputRef });

  if (!isOpen) return null;
  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div ref={dialogRef} className="relative bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-400">
          <Ban size={28} />
          <h3 id={titleId} className="text-xl font-bold text-[var(--text-primary)]">Motif du refus</h3>
        </div>
        <p className="text-[var(--text-secondary)] text-sm mb-4">
          La mairie refuse votre demande ? Une justification écrite est <span className="font-bold">obligatoire</span> pour valider ce statut.
        </p>
        <textarea
          ref={inputRef}
          className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none mb-4 min-h-[100px] bg-white dark:bg-slate-800 text-[var(--text-primary)]"
          placeholder="Ex: Pas de disponibilité de salle, refus du maire..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors">
            Annuler
          </button>
          <button
            type="button"
            onClick={() => {
              if (reason.trim()) {
                onConfirm(reason.trim());
                setReason('');
                onClose();
              }
            }}
            disabled={!reason.trim()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Valider le refus
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export const DocRequiredModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: (docName: string) => void }> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [docName, setDocName] = useState('');
  const titleId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { dialogRef } = useDialogA11y({ isOpen, onClose, initialFocusRef: inputRef });

  if (!isOpen) return null;
  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div ref={dialogRef} className="relative bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-4 text-amber-600 dark:text-amber-400">
          <FileText size={28} />
          <h3 id={titleId} className="text-xl font-bold text-[var(--text-primary)]">Documents Requis</h3>
        </div>
        <p className="text-[var(--text-secondary)] text-sm mb-4">
          Quels documents la mairie demande-t-elle ? (ex: Kbis, Assurance...)
        </p>
        <textarea
          ref={inputRef}
          className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none mb-4 min-h-[100px] bg-white dark:bg-slate-800 text-[var(--text-primary)]"
          placeholder="Liste des documents..."
          value={docName}
          onChange={(e) => setDocName(e.target.value)}
        />
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors">
            Annuler
          </button>
          <button
            type="button"
            onClick={() => {
              if (docName.trim()) {
                onConfirm(docName.trim());
                setDocName('');
                onClose();
              }
            }}
            disabled={!docName.trim()}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export const ContactEditModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (val: string) => void;
  field: 'tel' | 'email';
  currentValue: string;
}> = ({ isOpen, onClose, onConfirm, field, currentValue }) => {
  const [value, setValue] = useState(currentValue);
  useEffect(() => {
    setValue(currentValue);
  }, [currentValue, isOpen]);
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { dialogRef } = useDialogA11y({ isOpen, onClose, initialFocusRef: inputRef });

  if (!isOpen) return null;
  const label = field === 'tel' ? 'numéro de téléphone' : 'adresse email';
  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div ref={dialogRef} className="relative bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl shadow-2xl w-full max-w-md p-0 overflow-hidden animate-fade-in">
        <div className="bg-orange-50 dark:bg-orange-500/10 p-6 border-b border-orange-100 dark:border-orange-500/20 flex items-start gap-4">
          <div className="bg-orange-100 dark:bg-orange-500/20 p-2 rounded-full shrink-0">
            <AlertTriangle className="text-orange-600 dark:text-orange-400" size={24} />
          </div>
          <div>
            <h3 id={titleId} className="text-lg font-bold text-orange-900 dark:text-orange-300 mb-1">
              Attention, modification sensible
            </h3>
            <p className="text-sm text-orange-800 dark:text-orange-300/80 leading-relaxed">
              Vous désirez changer le <span className="font-bold">{label}</span> officiel de cette mairie. Attention, faites bien attention :
              cette modification est définitive et impactera les fiches de contact pour toute l'équipe.
            </p>
          </div>
        </div>
        <div className="p-6">
          <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
            Nouveau {field === 'tel' ? 'Numéro' : 'Email'}
          </label>
          <input
            ref={inputRef}
            type={field === 'tel' ? 'tel' : 'email'}
            className="w-full text-lg font-medium p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white dark:bg-slate-800 text-[var(--text-primary)]"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-[var(--border-subtle)] flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-[var(--text-secondary)] hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-sm transition-colors">
            Annuler
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(value.trim());
              onClose();
            }}
            disabled={!value.trim() || value === currentValue}
            className="px-6 py-2.5 bg-orange-600 text-white hover:bg-orange-700 rounded-xl font-bold text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Valider la modification
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export const MairieDetailModal: React.FC<{ mairie: Mairie | null; onClose: () => void; showToast: (msg: string, severity?: ToastSeverity) => void }> = ({
  mairie,
  onClose,
  showToast,
}) => {
  const isOpen = !!mairie;
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const { dialogRef } = useDialogA11y({ isOpen, onClose, initialFocusRef: closeRef });

  if (!mairie) return null;
  const days = ['lu', 'ma', 'me', 'je', 've', 'sa', 'di'];
  const dayLabels = { lu: 'Lundi', ma: 'Mardi', me: 'Mercredi', je: 'Jeudi', ve: 'Vendredi', sa: 'Samedi', di: 'Dimanche' };
  const currentDay = new Date().getDay() === 0 ? 'di' : days[new Date().getDay() - 1];
  const handleGenerateDocs = () => {
    showToast("Génération de documents IA — bientôt disponible", 'info');
  };
  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div ref={dialogRef} className="relative bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center">
          <div>
            <h2 id={titleId} className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Briefcase className="text-orange-600" /> {mairie.nom}
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">{mairie.infos.adresse}</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Fermer" className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <UserCheck size={18} /> Décideurs & Contact
              </h3>
              <div className="bg-orange-50 dark:bg-orange-500/10 p-4 rounded-xl space-y-3">
                <div>
                  <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold uppercase tracking-wider">Maire</p>
                  <p className="font-medium text-[var(--text-primary)]">{mairie.infos.maire}</p>
                </div>
                {mairie.contact.nomContact && (
                  <div>
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold uppercase tracking-wider">Gatekeeper / Secrétaire</p>
                    <p className="font-medium text-[var(--text-primary)]">{mairie.contact.nomContact}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{mairie.contact.fonctionContact}</p>
                  </div>
                )}
                <div className="pt-2 border-t border-orange-100 dark:border-orange-500/20 flex gap-3">
                  <a href={`tel:${mairie.contact.tel}`} className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-[var(--bg-card-solid)] py-2 rounded-lg shadow-sm text-sm font-medium text-[var(--text-primary)] hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <Phone size={14} /> Appeler
                  </a>
                  <a href={`mailto:${mairie.contact.email}`} className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-[var(--bg-card-solid)] py-2 rounded-lg shadow-sm text-sm font-medium text-[var(--text-primary)] hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <Mail size={14} /> Email
                  </a>
                </div>
              </div>
              <Tooltip
                comingSoon
                content="L'IA proposera bientôt les documents adaptés à l'étape en cours (Kbis, attestations, courriers types)."
              >
                <button
                  type="button"
                  onClick={handleGenerateDocs}
                  className="w-full mt-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2 font-semibold"
                >
                  <FileText size={18} /> Générer documents
                </button>
              </Tooltip>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2 border-b pb-2">
                <Clock size={18} /> Horaires d'ouverture
              </h3>
              <div className="mt-3 space-y-1">
                {days.map((day) => {
                  const isToday = day === currentDay;
                  const slots = mairie.horaires[day];
                  return (
                    <div
                      key={day}
                      className={`flex justify-between text-sm py-1.5 px-3 rounded-lg ${isToday ? 'bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 font-medium' : ''}`}
                    >
                      <span className={`w-24 ${isToday ? 'text-green-800 dark:text-green-400' : 'text-[var(--text-secondary)]'}`}>
                        {dayLabels[day as keyof typeof dayLabels]}
                      </span>
                      <div className="text-right">
                        {slots
                          ? slots.map((s, i) => (
                              <span key={i} className="block text-[var(--text-primary)]">
                                {s}
                              </span>
                            ))
                          : <span className="text-[var(--text-muted)] italic">Fermé</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
