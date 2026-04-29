import { useState, useCallback } from 'react';

/**
 * A typed hook for reading and writing values to `localStorage`.
 *
 * Values are serialized/deserialized with `JSON.stringify`/`JSON.parse`.
 * If the stored value cannot be parsed, the `initialValue` is returned.
 *
 * Currently WesserPlan stores the theme preference under
 * `'wesserplan-theme'` via the theme store. This hook generalises that
 * pattern for any key.
 *
 * @param key - The localStorage key.
 * @param initialValue - Default value when nothing is stored yet.
 *
 * @returns A tuple of `[storedValue, setValue, removeValue]`.
 *
 * @example
 * ```tsx
 * const [theme, setTheme] = useLocalStorage<'light' | 'dark'>(
 *   'wesserplan-theme',
 *   'light',
 * );
 *
 * // Update:
 * setTheme('dark');
 *
 * // Remove:
 * const [, , removeTheme] = useLocalStorage('wesserplan-theme', 'light');
 * removeTheme();
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value;
        try {
          localStorage.setItem(key, JSON.stringify(nextValue));
        } catch {
          // Storage full or unavailable — state still updates in-memory.
        }
        return nextValue;
      });
    },
    [key],
  );

  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore removal errors.
    }
    setStoredValue(initialValue);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
