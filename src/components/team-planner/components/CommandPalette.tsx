
import React, { useEffect, useId, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search } from 'lucide-react';
import { useDialogA11y } from '@/hooks/useDialogA11y';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  actions: {
    id: string;
    label: string;
    icon: React.ElementType;
    shortcut?: string;
    perform: () => void;
  }[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, actions }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  const filteredActions = actions.filter(action =>
    action.label.toLowerCase().includes(query.toLowerCase())
  );

  // Refs to read latest values inside the keydown handler without re-subscribing.
  const filteredActionsRef = useRef(filteredActions);
  const selectedIndexRef = useRef(selectedIndex);
  filteredActionsRef.current = filteredActions;
  selectedIndexRef.current = selectedIndex;

  const { dialogRef } = useDialogA11y({ isOpen, onClose, initialFocusRef: inputRef });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const list = filteredActionsRef.current;
      const idx = selectedIndexRef.current;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (list.length > 0) setSelectedIndex((idx + 1) % list.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (list.length > 0) setSelectedIndex((idx - 1 + list.length) % list.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (list[idx]) {
          list[idx].perform();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="app-surface fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/55 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <h2 id={titleId} className="sr-only">Palette de commandes</h2>
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="modal-shell w-full max-w-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-subtle)]">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-orange-50 text-orange-600 ring-1 ring-orange-100 dark:bg-orange-500/15 dark:ring-orange-500/25 shrink-0">
            <Search size={16} strokeWidth={2.2} />
          </div>
          <input
            ref={inputRef}
            className="cmd-input flex-1 outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-[15px] font-medium tracking-tight"
            placeholder="Tapez une commande…"
            value={query}
            onChange={e => {
                setQuery(e.target.value);
                setSelectedIndex(0);
            }}
          />
          <kbd className="num text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-[var(--border-subtle)] rounded-md px-2 py-1 tracking-tight">
            ESC
          </kbd>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
            {filteredActions.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-[13px] tracking-tight">
                    Aucune commande trouvée.
                </div>
            ) : (
                filteredActions.map((action, index) => {
                    const active = index === selectedIndex;
                    return (
                        <button
                            key={action.id}
                            onClick={() => { action.perform(); onClose(); }}
                            className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-left transition active:translate-y-[1px] ${
                                active
                                    ? 'bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-200 ring-1 ring-orange-100 dark:ring-orange-500/25'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${
                                    active
                                        ? 'bg-orange-100/70 text-orange-700 dark:bg-orange-500/25 dark:text-orange-200'
                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                    <action.icon size={14} strokeWidth={2.2} />
                                </div>
                                <span className="text-[14px] font-medium tracking-tight">{action.label}</span>
                            </div>
                            {action.shortcut && (
                                <kbd className={`num text-[10px] font-medium px-1.5 py-0.5 rounded-md tracking-tight ${
                                    active
                                        ? 'bg-orange-100/70 text-orange-700 dark:bg-orange-500/25 dark:text-orange-200'
                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-[var(--border-subtle)]'
                                }`}>
                                    {action.shortcut}
                                </kbd>
                            )}
                        </button>
                    );
                })
            )}
        </div>

        <div className="bg-slate-50/60 dark:bg-slate-800/40 px-4 py-2 border-t border-[var(--border-subtle)] flex justify-between items-center">
            <span className="eyebrow leading-none">Command center</span>
            <div className="flex gap-3 eyebrow leading-none">
                <span>↑↓ naviguer</span>
                <span>↵ valider</span>
            </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
