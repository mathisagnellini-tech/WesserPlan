import { useState, useEffect } from 'react';

/**
 * Returns a debounced version of `value` that only updates after `delay`
 * milliseconds of inactivity.
 *
 * Useful for search inputs where you want to avoid firing expensive
 * filtering or API calls on every keystroke.
 *
 * @param value - The value to debounce.
 * @param delay - Debounce delay in milliseconds (default 300).
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 *
 * useEffect(() => {
 *   // Only fires 300ms after the user stops typing
 *   filterCommunes(debouncedSearch);
 * }, [debouncedSearch]);
 *
 * return <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />;
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
