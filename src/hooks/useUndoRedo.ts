import { useState, useCallback } from 'react';

/**
 * Return type for the {@link useUndoRedo} hook.
 */
export interface UndoRedoResult<T> {
  /** The current state value. */
  present: T;
  /** Stack of past states (oldest first). */
  past: T[];
  /** Stack of future states (for redo). */
  future: T[];
  /** Whether an undo operation is possible. */
  canUndo: boolean;
  /** Whether a redo operation is possible. */
  canRedo: boolean;
  /** Push a new state, clearing the redo stack. */
  pushState: (newState: T) => void;
  /** Revert to the previous state. */
  undo: () => void;
  /** Re-apply the next future state. */
  redo: () => void;
  /** Replace the current state without creating a history entry. */
  resetTo: (state: T) => void;
}

/**
 * Generic undo/redo hook that manages a history stack of states.
 *
 * Mirrors the pattern used in team-planner's `useTeamBoard` where
 * `history.past` and `history.future` arrays track state changes.
 *
 * @param initialState - The starting state value.
 * @param maxHistory - Maximum number of past states to retain (default 50).
 *
 * @example
 * ```tsx
 * const {
 *   present: boardData,
 *   canUndo,
 *   canRedo,
 *   pushState,
 *   undo,
 *   redo,
 * } = useUndoRedo<BoardData>(initialBoardData);
 *
 * // After a drag-and-drop:
 * pushState(newBoardData);
 *
 * // Toolbar buttons:
 * <button disabled={!canUndo} onClick={undo}>Annuler</button>
 * <button disabled={!canRedo} onClick={redo}>Rétablir</button>
 * ```
 */
export function useUndoRedo<T>(initialState: T, maxHistory = 50): UndoRedoResult<T> {
  const [present, setPresent] = useState<T>(initialState);
  const [past, setPast] = useState<T[]>([]);
  const [future, setFuture] = useState<T[]>([]);

  const pushState = useCallback((newState: T) => {
    setPresent((currentPresent) => {
      setPast((prevPast) => [...prevPast, currentPresent].slice(-maxHistory));
      setFuture([]);
      return newState;
    });
  }, [maxHistory]);

  const undo = useCallback(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;
      const previous = prevPast[prevPast.length - 1];
      const newPast = prevPast.slice(0, -1);

      setPresent((currentPresent) => {
        setFuture((prevFuture) => [currentPresent, ...prevFuture]);
        return previous;
      });

      return newPast;
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;
      const next = prevFuture[0];
      const newFuture = prevFuture.slice(1);

      setPresent((currentPresent) => {
        setPast((prevPast) => [...prevPast, currentPresent]);
        return next;
      });

      return newFuture;
    });
  }, []);

  const resetTo = useCallback((state: T) => {
    setPresent(state);
    setPast([]);
    setFuture([]);
  }, []);

  return {
    present,
    past,
    future,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    pushState,
    undo,
    redo,
    resetTo,
  };
}
