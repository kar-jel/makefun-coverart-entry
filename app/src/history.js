// Bounded snapshot history for editor undo and redo.

// Create a history stack with a fixed maximum number of past snapshots.
export function createHistory(limit = 60) {
  const maximum = Math.max(1, Math.floor(Number(limit) || 60));
  const past = [];
  const future = [];

  // Deep-copy snapshots so later editor mutations cannot change history.
  function copy(value) {
    return structuredClone(value);
  }

  // Push a labelled snapshot and invalidate any redo branch.
  function push(snapshot, label = "Change") {
    past.push({ snapshot: copy(snapshot), label: String(label) });
    if (past.length > maximum) past.shift();
    future.length = 0;
    return snapshot;
  }

  // Restore the previous snapshot and preserve the current state for redo.
  function undo(current) {
    if (!past.length) return current;
    future.push({ snapshot: copy(current), label: past[past.length - 1].label });
    return past.pop().snapshot;
  }

  // Restore the next snapshot and preserve the current state for undo.
  function redo(current) {
    if (!future.length) return current;
    past.push({ snapshot: copy(current), label: future[future.length - 1].label });
    if (past.length > maximum) past.shift();
    return future.pop().snapshot;
  }

  // Check whether a previous editor snapshot exists.
  function canUndo() {
    return past.length > 0;
  }

  // Check whether a redo snapshot exists.
  function canRedo() {
    return future.length > 0;
  }

  // Clear past and future snapshots.
  function clear() {
    past.length = 0;
    future.length = 0;
  }

  // Describe stack depth and the next labelled operation.
  function describe() {
    return {
      undo: past.length,
      redo: future.length,
      nextUndo: past.length ? past[past.length - 1].label : null,
      nextRedo: future.length ? future[future.length - 1].label : null,
      limit: maximum,
    };
  }

  return { push, undo, redo, canUndo, canRedo, clear, describe };
}

// Bind standard undo/redo keyboard shortcuts to a history instance.
export function bindHistoryKeys(target, history, getState, restore) {
  const handler = (event) => {
    const modifier = event.ctrlKey || event.metaKey;
    if (!modifier || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key !== "z" && key !== "y") return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName || "")) return;
    const undoAction = key === "z" && !event.shiftKey;
    const redoAction = key === "y" || (key === "z" && event.shiftKey);
    if (!undoAction && !redoAction) return;
    const snapshot = getState();
    const next = undoAction ? history.undo(snapshot) : history.redo(snapshot);
    if (next === snapshot) return;
    event.preventDefault();
    restore(next);
  };
  target.addEventListener("keydown", handler);
  return () => target.removeEventListener("keydown", handler);
}
