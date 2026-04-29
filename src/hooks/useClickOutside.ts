import { useEffect, type RefObject } from 'react';

/**
 * Calls `handler` when a click (mousedown) occurs outside the element
 * referenced by `ref`.
 *
 * This pattern is used in several places across WesserPlan:
 * - TopNavbar "more" dropdown
 * - MultiSelectFilter / MultiSelectDropdown
 * - MairieWidgets (WeekRatioSelector)
 * - ZoneCard search popover
 *
 * @param ref - React ref attached to the container element.
 * @param handler - Callback invoked with the MouseEvent when an outside click is detected.
 * @param enabled - Optional flag to enable/disable the listener (default `true`).
 *
 * @example
 * ```tsx
 * const dropdownRef = useRef<HTMLDivElement>(null);
 * const [isOpen, setIsOpen] = useState(false);
 *
 * useClickOutside(dropdownRef, () => setIsOpen(false), isOpen);
 *
 * return (
 *   <div ref={dropdownRef}>
 *     {isOpen && <DropdownMenu />}
 *   </div>
 * );
 * ```
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: MouseEvent) => void,
  enabled: boolean = true,
): void {
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler(event);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref, handler, enabled]);
}
