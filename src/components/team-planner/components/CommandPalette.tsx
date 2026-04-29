
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
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <h2 id={titleId} className="sr-only">Palette de commandes</h2>
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            className="flex-1 !bg-transparent !border-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-lg font-medium"
            placeholder="Tapez une commande..."
            value={query}
            onChange={e => {
                setQuery(e.target.value);
                setSelectedIndex(0);
            }}
          />
          <div className="text-xs font-bold text-slate-400 dark:text-slate-400 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded px-1.5 py-0.5">ESC</div>
        </div>

        <div className="max-h-[300px] overflow-y-auto p-2">
            {filteredActions.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">Aucune commande trouvée.</div>
            ) : (
                filteredActions.map((action, index) => (
                    <button
                        key={action.id}
                        onClick={() => { action.perform(); onClose(); }}
                        className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-left transition-colors ${
                            index === selectedIndex ? 'bg-orange-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <action.icon size={18} className={index === selectedIndex ? 'text-white' : 'text-slate-400 dark:text-slate-500'} />
                            <span className="font-medium">{action.label}</span>
                        </div>
                        {action.shortcut && (
                            <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                                index === selectedIndex ? 'bg-orange-500 text-orange-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                            }`}>
                                {action.shortcut}
                            </span>
                        )}
                    </button>
                ))
            )}
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-[10px] text-slate-400 font-medium">
            <span>Command Center v1.0</span>
            <div className="flex gap-2">
                <span>↑↓ pour naviguer</span>
                <span>↵ pour valider</span>
            </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
