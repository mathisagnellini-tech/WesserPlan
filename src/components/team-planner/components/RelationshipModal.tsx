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

    const choices = [
        {
            id: 'affinity' as const,
            icon: Handshake,
            label: 'Affinité',
            description: 'Travaillent bien ensemble',
            tone: 'bg-emerald-50 text-emerald-700 ring-emerald-100 hover:bg-emerald-100/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25 dark:hover:bg-emerald-500/22',
            iconBg: 'bg-emerald-100 dark:bg-emerald-500/25',
        },
        {
            id: 'conflict' as const,
            icon: Flame,
            label: 'Conflit',
            description: 'Tensions ou désaccords',
            tone: 'bg-red-50 text-red-700 ring-red-100 hover:bg-red-100/80 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/25 dark:hover:bg-red-500/22',
            iconBg: 'bg-red-100 dark:bg-red-500/25',
        },
        {
            id: 'synergy' as const,
            icon: Zap,
            label: 'Synergie',
            description: 'Productivité exceptionnelle',
            tone: 'bg-orange-50 text-orange-700 ring-orange-100 hover:bg-orange-100/80 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/25 dark:hover:bg-orange-500/22',
            iconBg: 'bg-orange-100 dark:bg-orange-500/25',
        },
    ];

    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="app-surface fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/55 backdrop-blur-sm p-4"
        >
            <div
                ref={dialogRef}
                tabIndex={-1}
                className="modal-shell w-full max-w-sm p-5 animate-in fade-in zoom-in duration-200"
            >
                <h3 id={titleId} className="display text-slate-900 dark:text-white text-xl text-center leading-tight mb-4">
                    Créer une relation
                </h3>
                <div className="flex flex-col gap-2">
                    {choices.map(({ id, icon: Icon, label, description, tone, iconBg }) => (
                        <button
                            key={id}
                            onClick={() => onConfirm(id)}
                            className={`flex items-center gap-3 p-3 rounded-xl ring-1 transition tracking-tight active:translate-y-[1px] text-left ${tone}`}
                        >
                            <div className={`p-2 rounded-full ${iconBg}`}>
                                <Icon size={16} strokeWidth={2.2} />
                            </div>
                            <div className="leading-tight">
                                <div className="text-[13px] font-medium">{label}</div>
                                <div className="text-[11px] opacity-80">{description}</div>
                            </div>
                        </button>
                    ))}
                </div>
                <button
                    ref={cancelRef}
                    onClick={onCancel}
                    className="btn-ghost w-full mt-3 !text-[12px] !text-slate-500 dark:!text-slate-400"
                >
                    Annuler
                </button>
            </div>
        </div>,
        document.body
    );
};
