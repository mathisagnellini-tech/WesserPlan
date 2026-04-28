import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  /** Adds a small "Bientôt disponible" pill above the content for placeholder buttons. */
  comingSoon?: boolean;
  /** Tooltip placement relative to the trigger. Defaults to bottom. */
  placement?: 'bottom' | 'top';
  /** Delay (ms) before showing on hover/focus. Defaults to 250. */
  openDelay?: number;
}

// Lightweight hover/focus tooltip portal'd to document.body so it escapes
// overflow-hidden parents (cards, popups). Uses aria-describedby so screen
// readers announce the help text alongside the trigger.
export const Tooltip: React.FC<TooltipProps> = ({ content, children, comingSoon, placement = 'bottom', openDelay = 250 }) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const tipId = useId();

  const measure = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (placement === 'top') {
      setCoords({ top: r.top - 8, left: r.left + r.width / 2 });
    } else {
      setCoords({ top: r.bottom + 8, left: r.left + r.width / 2 });
    }
  };

  const show = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      measure();
      setOpen(true);
    }, openDelay);
  };

  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onScroll = () => hide();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const trigger = React.cloneElement(children, {
    ref: triggerRef,
    'aria-describedby': open ? tipId : children.props['aria-describedby'],
    onMouseEnter: (e: React.MouseEvent) => {
      children.props.onMouseEnter?.(e);
      show();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      children.props.onMouseLeave?.(e);
      hide();
    },
    onFocus: (e: React.FocusEvent) => {
      children.props.onFocus?.(e);
      show();
    },
    onBlur: (e: React.FocusEvent) => {
      children.props.onBlur?.(e);
      hide();
    },
  });

  return (
    <>
      {trigger}
      {open && coords && createPortal(
        <div
          id={tipId}
          role="tooltip"
          className="fixed z-[10000] -translate-x-1/2 pointer-events-none"
          style={{ top: coords.top, left: coords.left, transform: placement === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)' }}
        >
          <div className="bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-xl border border-slate-800 max-w-[260px] flex flex-col gap-1">
            {comingSoon && (
              <span className="self-start text-[9px] uppercase tracking-wider font-black text-amber-300 bg-amber-500/20 border border-amber-500/30 rounded px-1.5 py-px">
                Bientôt disponible
              </span>
            )}
            <span>{content}</span>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
};
