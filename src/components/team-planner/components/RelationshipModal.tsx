
import React, { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Handshake, Flame, Zap } from 'lucide-react';
import { useDialogA11y } from '@/hooks/useDialogA11y';

interface RelationshipModalProps {
    onConfirm: (type: 'affinity' | 'conflict' | 'synergy') => void;
    onCancel: () => void;
}

export const RelationshipModal: React.FC<RelationshipModalProps> = ({ onConfirm, onCancel }) => {
    const titleId = useId();
    const cancelRef = useRef<HTMLButtonElement>(null);
    const { dialogRef } = useDialogA11y({ isOpen: true, onClose: onCancel, initialFocusRef: cancelRef });

    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
            <div
                ref={dialogRef}
                tabIndex={-1}
                className="bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl p-6 shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200"
            >
                <h3 id={titleId} className="text-lg font-black text-slate-900 dark:text-white mb-4 text-center">Créer une Relation</h3>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => onConfirm('affinity')}
                        className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors font-bold"
                    >
                        <div className="p-2 bg-emerald-200 rounded-full"><Handshake size={20} /></div>
                        <div>
                            <div className="text-sm">Affinité</div>
                            <div className="text-[10px] opacity-70">Ils travaillent bien ensemble</div>
                        </div>
                    </button>
                    <button
                        onClick={() => onConfirm('conflict')}
                        className="flex items-center gap-3 p-3 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors font-bold"
                    >
                        <div className="p-2 bg-red-200 rounded-full"><Flame size={20} /></div>
                        <div>
                            <div className="text-sm">Conflit</div>
                            <div className="text-[10px] opacity-70">Tensions ou désaccords</div>
                        </div>
                    </button>
                    <button
                        onClick={() => onConfirm('synergy')}
                        className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors font-bold"
                    >
                        <div className="p-2 bg-orange-200 rounded-full"><Zap size={20} /></div>
                        <div>
                            <div className="text-sm">Synergie Pure</div>
                            <div className="text-[10px] opacity-70">Productivité exceptionnelle</div>
                        </div>
                    </button>
                </div>
                <button
                    ref={cancelRef}
                    onClick={onCancel}
                    className="mt-4 w-full py-2 text-slate-500 dark:text-slate-400 font-bold text-xs hover:text-slate-600 dark:hover:text-slate-300"
                >
                    Annuler
                </button>
            </div>
        </div>,
        document.body
    );
};
