// ═══════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS - Hook for Astrogation canvas
// ═══════════════════════════════════════════════════════════════

import { useEffect, useCallback } from "react";

interface KeyboardShortcutsOptions {
  onDelete?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onEscape?: () => void;
  onCopy?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onDelete,
  onUndo,
  onRedo,
  onEscape,
  onCopy,
  enabled = true,
}: KeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        // But allow Escape to blur inputs
        if (e.key === "Escape") {
          target.blur();
        }
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      // Delete / Backspace - delete selected instance
      if ((e.key === "Delete" || e.key === "Backspace") && onDelete) {
        e.preventDefault();
        onDelete();
        return;
      }

      // Cmd+Z - Undo
      if (cmdKey && e.key === "z" && !e.shiftKey && onUndo) {
        e.preventDefault();
        onUndo();
        return;
      }

      // Cmd+Shift+Z - Redo
      if (cmdKey && e.key === "z" && e.shiftKey && onRedo) {
        e.preventDefault();
        onRedo();
        return;
      }

      // Cmd+Y - Redo (Windows alternative)
      if (cmdKey && e.key === "y" && onRedo) {
        e.preventDefault();
        onRedo();
        return;
      }

      // Escape - deselect
      if (e.key === "Escape" && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }

      // Cmd+C - Copy code
      if (cmdKey && e.key === "c" && onCopy) {
        e.preventDefault();
        onCopy();
        return;
      }
    },
    [enabled, onDelete, onUndo, onRedo, onEscape, onCopy]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
