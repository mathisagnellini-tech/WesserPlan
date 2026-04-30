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
    icon: <Info size={16} strokeWidth={2.2} className="text-sky-300" />,
  },
  success: {
    ring: 'border-emerald-600/50',
    icon: <CheckCircle2 size={16} strokeWidth={2.2} className="text-emerald-300" />,
  },
  error: {
    ring: 'border-red-600/60',
    icon: <AlertTriangle size={16} strokeWidth={2.2} className="text-red-300" />,
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
      className="app-surface fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] animate-fade-in"
    >
      <div className={`bg-slate-900 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 border ${tone.ring}`}>
        {tone.icon}
        <span className="text-[13px] font-medium tracking-tight">{message}</span>
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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="app-surface fixed inset-0 z-[200] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div ref={dialogRef} className="modal-shell relative w-full max-w-md p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-red-50 text-red-600 ring-1 ring-red-100 dark:bg-red-500/15 dark:ring-red-500/25 dark:text-red-300">
            <Ban size={16} strokeWidth={2.2} />
          </div>
          <h3 id={titleId} className="display text-[var(--text-primary)] text-xl tracking-tight leading-tight">
            Motif du refus
          </h3>
        </div>
        <p className="text-[13px] text-[var(--text-secondary)] tracking-tight leading-relaxed mb-4">
          La mairie refuse votre demande ? Une justification écrite est <span className="font-medium text-[var(--text-primary)]">obligatoire</span> pour valider ce statut.
        </p>
        <textarea
          ref={inputRef}
          className="field-input min-h-[100px]"
          placeholder="Ex : pas de disponibilité de salle, refus du maire…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex justify-end gap-3 mt-4">
          <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
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
            className="btn-primary !bg-red-600 hover:!bg-red-700"
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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="app-surface fixed inset-0 z-[200] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div ref={dialogRef} className="modal-shell relative w-full max-w-md p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600 ring-1 ring-amber-100 dark:bg-amber-500/15 dark:ring-amber-500/25 dark:text-amber-300">
            <FileText size={16} strokeWidth={2.2} />
          </div>
          <h3 id={titleId} className="display text-[var(--text-primary)] text-xl tracking-tight leading-tight">
            Documents requis
          </h3>
        </div>
        <p className="text-[13px] text-[var(--text-secondary)] tracking-tight leading-relaxed mb-4">
          Quels documents la mairie demande-t-elle ? (ex : Kbis, assurance…)
        </p>
        <textarea
          ref={inputRef}
          className="field-input min-h-[100px]"
          placeholder="Liste des documents…"
          value={docName}
          onChange={(e) => setDocName(e.target.value)}
        />
        <div className="flex justify-end gap-3 mt-4">
          <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
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
            className="btn-primary"
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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="app-surface fixed inset-0 z-[300] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div ref={dialogRef} className="modal-shell relative w-full max-w-md overflow-hidden animate-fade-in">
        <div className="bg-orange-50 dark:bg-orange-500/10 p-5 border-b border-orange-100 dark:border-orange-500/25 flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-white dark:bg-[var(--bg-card-solid)] text-orange-600 ring-1 ring-orange-100 dark:ring-orange-500/25 shrink-0">
            <AlertTriangle size={16} strokeWidth={2.2} />
          </div>
          <div>
            <h3 id={titleId} className="display text-orange-900 dark:text-orange-200 text-lg tracking-tight leading-tight mb-1">
              Modification sensible
            </h3>
            <p className="text-[12px] text-orange-800/85 dark:text-orange-200/80 leading-relaxed tracking-tight">
              Vous désirez changer le <span className="font-medium">{label}</span> officiel de cette mairie.
              Cette modification est définitive et impactera les fiches de contact pour toute l’équipe.
            </p>
          </div>
        </div>
        <div className="p-5">
          <label className="field-label">Nouveau {field === 'tel' ? 'numéro' : 'email'}</label>
          <input
            ref={inputRef}
            type={field === 'tel' ? 'tel' : 'email'}
            className="field-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <div className="p-4 bg-slate-50/60 dark:bg-slate-800/40 border-t border-[var(--border-subtle)] flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
          <button
            type="button"
            onClick={() => {
              onConfirm(value.trim());
              onClose();
            }}
            disabled={!value.trim() || value === currentValue}
            className="btn-primary"
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
    showToast('Génération de documents IA — bientôt disponible', 'info');
  };
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="app-surface fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div ref={dialogRef} className="modal-shell relative w-full max-w-2xl flex flex-col max-h-[90vh] animate-fade-in">
        <div className="modal-accent-strip px-6 py-4 border-b border-[var(--border-subtle)] flex justify-between items-start gap-3">
          <div className="flex gap-3 items-center min-w-0">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-orange-50 text-orange-600 ring-1 ring-orange-100 dark:bg-orange-500/15 dark:ring-orange-500/25">
              <Briefcase size={18} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h2 id={titleId} className="display text-[var(--text-primary)] text-2xl tracking-tight leading-tight truncate">
                {mairie.nom}
              </h2>
              <p className="text-[12px] text-[var(--text-secondary)] tracking-tight truncate">{mairie.infos.adresse}</p>
            </div>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Fermer" className="btn-ghost !p-2 shrink-0">
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-[13px] font-medium text-[var(--text-primary)] tracking-tight flex items-center gap-2">
                <UserCheck size={15} strokeWidth={2.2} className="text-orange-500" /> Décideurs &amp; contact
              </h3>
              <div className="bg-orange-50 dark:bg-orange-500/10 p-4 rounded-2xl border border-orange-100 dark:border-orange-500/25 space-y-3">
                <div>
                  <p className="eyebrow leading-none">Maire</p>
                  <p className="text-[13px] font-medium text-[var(--text-primary)] tracking-tight mt-1">{mairie.infos.maire}</p>
                </div>
                {mairie.contact.nomContact && (
                  <div>
                    <p className="eyebrow leading-none">Gatekeeper / secrétaire</p>
                    <p className="text-[13px] font-medium text-[var(--text-primary)] tracking-tight mt-1">{mairie.contact.nomContact}</p>
                    <p className="text-[11px] text-[var(--text-secondary)] tracking-tight">{mairie.contact.fonctionContact}</p>
                  </div>
                )}
                <div className="pt-2 border-t border-orange-100 dark:border-orange-500/25 flex gap-2">
                  <a
                    href={`tel:${mairie.contact.tel}`}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white dark:bg-[var(--bg-card-solid)] py-2 rounded-lg shadow-sm text-[12px] font-medium text-[var(--text-primary)] tracking-tight hover:bg-slate-50 dark:hover:bg-slate-700/50 active:translate-y-[1px] transition"
                  >
                    <Phone size={13} strokeWidth={2.2} /> Appeler
                  </a>
                  <a
                    href={`mailto:${mairie.contact.email}`}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white dark:bg-[var(--bg-card-solid)] py-2 rounded-lg shadow-sm text-[12px] font-medium text-[var(--text-primary)] tracking-tight hover:bg-slate-50 dark:hover:bg-slate-700/50 active:translate-y-[1px] transition"
                  >
                    <Mail size={13} strokeWidth={2.2} /> Email
                  </a>
                </div>
              </div>
              <Tooltip
                comingSoon
                content="L'IA proposera bientôt les documents adaptés à l'étape en cours (Kbis, attestations, courriers types)."
              >
                <button type="button" onClick={handleGenerateDocs} className="btn-primary w-full !py-2.5">
                  <FileText size={14} strokeWidth={2.2} /> Générer les documents
                </button>
              </Tooltip>
            </div>
            <div>
              <h3 className="text-[13px] font-medium text-[var(--text-primary)] tracking-tight flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
                <Clock size={15} strokeWidth={2.2} className="text-orange-500" /> Horaires d’ouverture
              </h3>
              <div className="mt-3 space-y-1">
                {days.map((day) => {
                  const isToday = day === currentDay;
                  const slots = mairie.horaires[day];
                  return (
                    <div
                      key={day}
                      className={`flex justify-between text-[13px] py-1.5 px-3 rounded-lg tracking-tight ${
                        isToday
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/25'
                          : ''
                      }`}
                    >
                      <span className={`w-24 ${isToday ? 'text-emerald-800 dark:text-emerald-300 font-medium' : 'text-[var(--text-secondary)]'}`}>
                        {dayLabels[day as keyof typeof dayLabels]}
                      </span>
                      <div className="text-right num">
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
