import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CommuneStatus } from '@/types';
import { statusMap } from '@/constants';
import { Check } from 'lucide-react';
import { StatusBadge } from '@/components/communes/StatusBadge';

export const QuickStatusDropdown: React.FC<{
    currentStatus: CommuneStatus;
    onSelect: (s: CommuneStatus) => void;
}> = ({ currentStatus, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const menuId = useId();

    const open = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({ top: rect.bottom + 4, left: rect.left });
        setIsOpen(true);
    };

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isOpen) setIsOpen(false);
        else open();
    };

    const handleTriggerKey = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!isOpen) open();
            else {
                const first = dropdownRef.current?.querySelector<HTMLButtonElement>('button');
                first?.focus();
            }
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        const closeMenu = (e: MouseEvent) => {
            if (dropdownRef.current?.contains(e.target as Node)) return;
            if (triggerRef.current?.contains(e.target as Node)) return;
            setIsOpen(false);
        };
        const handleScroll = () => setIsOpen(false);
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
                triggerRef.current?.focus();
            }
        };
        document.addEventListener('mousedown', closeMenu);
        document.addEventListener('keydown', handleKey);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleScroll);
        return () => {
            document.removeEventListener('mousedown', closeMenu);
            document.removeEventListener('keydown', handleKey);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, [isOpen]);

    const focusSibling = (currentBtn: HTMLButtonElement, dir: 1 | -1) => {
        const list = dropdownRef.current?.querySelectorAll<HTMLButtonElement>('button[data-status]');
        if (!list) return;
        const buttons: HTMLButtonElement[] = Array.from(list);
        const idx = buttons.indexOf(currentBtn);
        if (idx === -1) return;
        const next = buttons[(idx + dir + buttons.length) % buttons.length];
        next?.focus();
    };

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                onClick={handleToggle}
                onKeyDown={handleTriggerKey}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                aria-controls={menuId}
                className="inline-block bg-transparent border-0 p-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 rounded-full"
            >
                <StatusBadge status={currentStatus} interactive />
            </button>

            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    id={menuId}
                    role="menu"
                    className="modal-shell fixed z-[9999] overflow-hidden min-w-[180px] animate-fade-in"
                    style={{ top: coords.top, left: coords.left }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {Object.entries(statusMap).map(([key, conf]) => (
                        <button
                            key={key}
                            type="button"
                            role="menuitemradio"
                            aria-checked={key === currentStatus}
                            data-status={key}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(key as CommuneStatus);
                                setIsOpen(false);
                                triggerRef.current?.focus();
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'ArrowDown') {
                                    e.preventDefault();
                                    focusSibling(e.currentTarget, 1);
                                } else if (e.key === 'ArrowUp') {
                                    e.preventDefault();
                                    focusSibling(e.currentTarget, -1);
                                }
                            }}
                            className={`w-full text-left px-3.5 py-2.5 text-[13px] font-medium tracking-tight hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-700/50 flex items-center justify-between transition border-b border-[var(--border-subtle)] last:border-0 active:translate-y-[1px]
                            ${key === currentStatus ? 'bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-200' : 'text-[var(--text-secondary)]'}`}
                        >
                            <span>{conf.text}</span>
                            {key === currentStatus && <Check size={12} strokeWidth={2.6} />}
                        </button>
                    ))}
                </div>,
                document.body,
            )}
        </>
    );
};
