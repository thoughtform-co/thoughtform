// ═══════════════════════════════════════════════════════════════
// HISTORY - Undo/Redo state management for Astrogation canvas
// ═══════════════════════════════════════════════════════════════

const MAX_HISTORY_SIZE = 50;

export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function createHistory<T>(initialState: T): HistoryState<T> {
  return {
    past: [],
    present: initialState,
    future: [],
  };
}

export function pushState<T>(history: HistoryState<T>, newState: T): HistoryState<T> {
  // Don't push if state is identical (shallow compare for objects)
  if (JSON.stringify(history.present) === JSON.stringify(newState)) {
    return history;
  }

  const newPast = [...history.past, history.present];

  // Limit history size
  if (newPast.length > MAX_HISTORY_SIZE) {
    newPast.shift();
  }

  return {
    past: newPast,
    present: newState,
    future: [], // Clear future on new action
  };
}

export function undo<T>(history: HistoryState<T>): HistoryState<T> {
  if (history.past.length === 0) {
    return history;
  }

  const newPast = [...history.past];
  const previousState = newPast.pop()!;

  return {
    past: newPast,
    present: previousState,
    future: [history.present, ...history.future],
  };
}

export function redo<T>(history: HistoryState<T>): HistoryState<T> {
  if (history.future.length === 0) {
    return history;
  }

  const newFuture = [...history.future];
  const nextState = newFuture.shift()!;

  return {
    past: [...history.past, history.present],
    present: nextState,
    future: newFuture,
  };
}

export function canUndo<T>(history: HistoryState<T>): boolean {
  return history.past.length > 0;
}

export function canRedo<T>(history: HistoryState<T>): boolean {
  return history.future.length > 0;
}
