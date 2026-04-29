import { useEffect, useCallback } from 'react';

/**
 * Describes a keyboard shortcut combination.
 *
 * @example
 * { key: 'k', ctrl: true }           // Ctrl+K (or Cmd+K on Mac)
 * { key: 'Escape' }                  // Escape key alone
 * { key: 'z', ctrl: true, shift: true } // Ctrl+Shift+Z
 */
export interface KeyCombo {
  /** The `KeyboardEvent.key` value to match (case-sensitive). */
  key: string;
  /** When true, requires Ctrl (Windows/Linux) or Cmd (Mac). */
  ctrl?: boolean;
  /** When true, requires the Shift modifier. */
  shift?: boolean;
  /** When true, requires the Alt modifier. */
  alt?: boolean;
}

/**
 * Registers a global keyboard shortcut that calls `callback` when the
 * specified key combination is pressed.
 *
 * The listener is attached to `window` and automatically cleaned up
 * on unmount or when dependencies change.
 *
 * @param combo - The key combination to listen for.
 * @param callback - Function to invoke when the shortcut fires.
 * @param enabled - Optional flag to enable/disable the shortcut (default `true`).
 *
 * @example
 * ```tsx
 * // Open command palette with Ctrl+K
 * useKeyboardShortcut(
 *   { key: 'k', ctrl: true },
 *   () => setIsCommandOpen(prev => !prev),
 * );
 *
 * // Close modal on Escape
 * useKeyboardShortcut(
 *   { key: 'Escape' },
 *   () => setIsOpen(false),
 *   isOpen, // only active when modal is open
 * );
 * ```
 */
export function useKeyboardShortcut(
  combo: KeyCombo,
  callback: (event: KeyboardEvent) => void,
  enabled: boolean = true,
): void {
  const stableCallback = useCallback(callback, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const ctrlMatch = combo.ctrl
        ? event.metaKey || event.ctrlKey
        : true;
      const shiftMatch = combo.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = combo.alt ? event.altKey : !event.altKey;

      if (event.key === combo.key && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault();
        stableCallback(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [combo.key, combo.ctrl, combo.shift, combo.alt, stableCallback, enabled]);
}
