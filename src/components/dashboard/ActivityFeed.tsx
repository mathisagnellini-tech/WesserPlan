import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Activity, Home, Ban, CheckCircle2, Plus, X } from 'lucide-react';
import { activityService, type ActivityItem } from '@/services/activityService';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { reporter } from '@/lib/observability';
import { buildOccurredAt, formatActivityDate, type DateMode } from '@/lib/activityDate';

const AddEventModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAdd: (e: { type: string; text: string; occurredAt: string }) => Promise<void>;
}> = ({ isOpen, onClose, onAdd }) => {
  const [type, setType] = useState('housing');
  const [text, setText] = useState('');
  const [time, setTime] = useState('09:00');
  const [dateMode, setDateMode] = useState<DateMode>('today');
  const [specificDate, setSpecificDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus management + Escape-to-close + scroll lock + focus trap.
  useEffect(() => {
    if (!isOpen) return;

    previousFocus.current = document.activeElement as HTMLElement | null;
    // Focus the first text input shortly after open so the dialog is keyboard-ready.
    const focusTimer = setTimeout(() => firstInputRef.current?.focus(), 0);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        // Trap focus inside the dialog.
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      previousFocus.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const occurredAt = buildOccurredAt(dateMode, specificDate, time);
      await onAdd({ type, text, occurredAt });
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        className="bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl shadow-xl w-full max-w-sm p-6 relative z-10 animate-fade-in"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-orange-500 rounded"
        >
          <X size={20} />
        </button>
        <h3 id={titleId} className="text-lg font-bold text-[var(--text-primary)] mb-4">
          Ajouter un evenement
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-[var(--input-border)] rounded-lg p-2 text-sm bg-[var(--input-bg)] dark:text-[var(--text-primary)] font-medium"
            >
              <option value="housing">Logement</option>
              <option value="refusal">Refus Mairie</option>
              <option value="done">Mission Terminee</option>
              <option value="info">Information</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Description</label>
            <input
              ref={firstInputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ex: Logement valide a Lyon"
              className="w-full border border-[var(--input-border)] rounded-lg p-2 text-sm bg-[var(--input-bg)] dark:text-[var(--text-primary)] dark:placeholder-[var(--text-muted)]"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Heure</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full border border-[var(--input-border)] rounded-lg p-2 text-sm bg-[var(--input-bg)] dark:text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Jour</label>
              <select
                value={dateMode}
                onChange={(e) => setDateMode(e.target.value as DateMode)}
                className="w-full border border-[var(--input-border)] rounded-lg p-2 text-sm bg-[var(--input-bg)] dark:text-[var(--text-primary)]"
              >
                <option value="today">Aujourd'hui</option>
                <option value="yesterday">Hier</option>
                <option value="specific">Date...</option>
              </select>
            </div>
          </div>
          {dateMode === 'specific' && (
            <div>
              <input
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                className="w-full border border-[var(--input-border)] rounded-lg p-2 text-sm bg-[var(--input-bg)] dark:text-[var(--text-primary)]"
                required
              />
            </div>
          )}
          {submitError && (
            <p role="alert" className="text-xs text-red-600 dark:text-red-400 font-medium">
              {submitError}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-orange-600 text-white font-bold py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
          >
            {submitting ? 'En cours…' : 'Ajouter'}
          </button>
        </form>
      </div>
    </div>
  );
};

export const ActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(() => {
    const ctrl = new AbortController();
    setIsLoading(true);
    setError(null);
    activityService
      .getRecent(20)
      .then((data) => {
        if (ctrl.signal.aborted) return;
        setActivities(data);
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        reporter.error('activities.getRecent failed', err, { source: 'ActivityFeed' });
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setIsLoading(false);
      });
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  const handleAddEvent = async (newEvent: { type: string; text: string; occurredAt: string }) => {
    const created = await activityService.create({
      type: newEvent.type,
      text: newEvent.text,
      author: 'Moi',
      occurredAt: newEvent.occurredAt,
    });
    setActivities((prev) => [created, ...prev]);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'housing':
        return <Home size={14} className="text-orange-600" />;
      case 'refusal':
        return <Ban size={14} className="text-red-600" />;
      case 'done':
        return <CheckCircle2 size={14} className="text-emerald-600" />;
      default:
        return <Activity size={14} className="text-slate-600 dark:text-slate-400" />;
    }
  };

  return (
    <div className="glass-card p-0 flex flex-col h-full overflow-hidden relative">
      <AddEventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddEvent} />

      <div className="p-4 border-b border-[var(--border-subtle)] bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
        <h3 className="font-medium text-[var(--text-primary)] tracking-tight flex items-center gap-2">
          <Activity size={16} strokeWidth={2.2} className="text-orange-600" /> Activité récente
        </h3>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          aria-label="Ajouter un événement"
          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-500/15 active:translate-y-[1px] transition-colors"
        >
          <Plus size={16} strokeWidth={2.2} />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-3">
        {isLoading && <LoadingState fullHeight />}
        {!isLoading && error && (
          <ErrorState
            title="Impossible de charger l'activité"
            error={error}
            onRetry={load}
            fullHeight
          />
        )}
        {!isLoading && !error && activities.length === 0 && (
          <EmptyState
            title="Aucune activité récente"
            message="Les nouveaux évenements apparaitront ici."
          />
        )}
        {!isLoading && !error &&
          activities.map((act) => {
            const { time, date } = formatActivityDate(act.occurredAt);
            return (
              <div key={act.id} className="flex gap-3 items-start group animate-fade-in">
                <div className="flex flex-col items-center gap-1 min-w-[38px]">
                  <span
                    className="text-[11px] font-medium text-[var(--text-secondary)]"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {time}
                  </span>
                  <span className="text-[9px] font-medium text-[var(--text-muted)] tracking-tight">{date}</span>
                  <div className="h-full w-px bg-slate-100 dark:bg-slate-700/60 group-last:hidden"></div>
                </div>
                <div className="bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] p-2.5 rounded-xl shadow-sm flex-grow hover:border-orange-200 dark:hover:border-orange-500/30 hover:shadow-md transition">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`p-1 rounded-md ${
                        act.type === 'refusal'
                          ? 'bg-red-50 dark:bg-red-900/30'
                          : act.type === 'housing'
                          ? 'bg-orange-50 dark:bg-orange-900/30'
                          : act.type === 'done'
                          ? 'bg-emerald-50 dark:bg-emerald-900/30'
                          : 'bg-slate-50 dark:bg-slate-800'
                      }`}
                    >
                      {getIcon(act.type)}
                    </div>
                    <span className="text-xs font-medium text-[var(--text-primary)] tracking-tight">{act.text}</span>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] pl-8">Par {act.author}</p>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
