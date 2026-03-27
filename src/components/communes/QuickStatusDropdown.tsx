import React, { useState, useEffect, useRef } from 'react';
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
    const triggerRef = useRef<HTMLDivElement>(null);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isOpen) {
            setIsOpen(false);
            return;
        }

        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + 4,
                left: rect.left
            });
            setIsOpen(true);
        }
    };

    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const closeMenu = (e: MouseEvent) => {
            // Don't close if clicking inside the dropdown or trigger
            if (dropdownRef.current?.contains(e.target as Node)) return;
            if (triggerRef.current?.contains(e.target as Node)) return;
            setIsOpen(false);
        };
        const handleScroll = () => setIsOpen(false);
        document.addEventListener("mousedown", closeMenu);
        window.addEventListener("scroll", handleScroll, true);
        window.addEventListener("resize", handleScroll);
        return () => {
            document.removeEventListener("mousedown", closeMenu);
            window.removeEventListener("scroll", handleScroll, true);
            window.removeEventListener("resize", handleScroll);
        };
    }, [isOpen]);

    return (
        <>
            <div ref={triggerRef} className="inline-block">
                <StatusBadge
                    status={currentStatus}
                    interactive={true}
                    onClick={handleToggle}
                />
            </div>

            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    className="fixed z-[9999] bg-white dark:bg-[var(--bg-card-solid)] rounded-xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden min-w-[160px] animate-fade-in"
                    style={{
                        top: coords.top,
                        left: coords.left
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {Object.entries(statusMap).map(([key, conf]) => (
                        <button
                            key={key}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(key as CommuneStatus);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between transition-colors border-b border-slate-50 dark:border-slate-700 last:border-0
                            ${key === currentStatus ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600' : 'text-[var(--text-secondary)]'}`}
                        >
                            <span>{conf.text}</span>
                            {key === currentStatus && <Check size={12}/>}
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </>
    );
};
