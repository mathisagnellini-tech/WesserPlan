import React, { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import { useDialogA11y } from '@/hooks/useDialogA11y';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Visual emphasis for the confirm button. */
  variant?: 'danger' | 'warning' | 'primary';
}

// Replaces window.confirm with a styled, accessible dialog. Used for
// destructive actions like deleting a zone or removing a mairie from a
// schedule.
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
}) => {
  const titleId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const { dialogRef } = useDialogA11y({ isOpen, onClose, initialFocusRef: confirmRef });

  if (!isOpen) return null;

  const tones = {
    danger: 'bg-red-600 hover:bg-red-700 shadow-red-200 dark:shadow-red-900/40',
    warning: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200 dark:shadow-amber-900/40',
    primary: 'bg-orange-600 hover:bg-orange-700 shadow-orange-200 dark:shadow-orange-900/40',
  } as const;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        className="relative bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in"
      >
        <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-100 dark:border-amber-500/20 p-5 flex items-start gap-3">
          <div className="bg-white dark:bg-[var(--bg-card-solid)] p-2 rounded-full shrink-0">
            <AlertTriangle className="text-amber-500" size={22} />
          </div>
          <div className="flex-1">
            <h3 id={titleId} className="text-base font-bold text-[var(--text-primary)] mb-1">
              {title}
            </h3>
            <div className="text-sm text-[var(--text-secondary)] leading-relaxed">{message}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="p-1.5 hover:bg-white/60 dark:hover:bg-slate-700 rounded-full text-[var(--text-secondary)]"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-[var(--text-secondary)] hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-sm transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-5 py-2.5 text-white rounded-xl font-bold text-sm shadow-lg transition-all ${tones[variant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
