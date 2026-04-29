import { useEffect, useRef, type RefObject } from 'react';

interface UseDialogA11yOptions {
  isOpen: boolean;
  onClose: () => void;
  /** Ref of the first interactive element to focus on open. */
  initialFocusRef?: RefObject<HTMLElement | null>;
}

// Reusable a11y wiring for modal-style dialogs:
//  • Escape-to-close
//  • focus trap (Tab / Shift-Tab cycle within the dialog)
//  • initial focus on the supplied element (defaults to the dialog itself)
//  • document scroll lock while open
//  • focus restore to the previously focused element on close
//
// Caller is responsible for setting the dialog's aria attributes
// (role="dialog" / aria-modal / aria-labelledby) and for placing the
// returned ref on the dialog container.
export function useDialogA11y({ isOpen, onClose, initialFocusRef }: UseDialogA11yOptions) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocus.current = document.activeElement as HTMLElement | null;
    const focusTimer = setTimeout(() => {
      (initialFocusRef?.current ?? dialogRef.current)?.focus();
    }, 0);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
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
  }, [isOpen, onClose, initialFocusRef]);

  return { dialogRef };
}
