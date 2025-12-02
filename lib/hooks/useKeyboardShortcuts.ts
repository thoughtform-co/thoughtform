"use client";

import { useEffect, useCallback } from "react";
import { useEditorStore, useSelectedElementIds, useSelectedSection } from "@/store/editor-store";
import { alignElements, distributeElements } from "@/lib/layout-engine";

// ═══════════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS HOOK
// Provides keyboard shortcuts for the editor
// ═══════════════════════════════════════════════════════════════════

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;  // Cmd on Mac
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  category: "selection" | "edit" | "clipboard" | "layer" | "navigation" | "view";
}

export function useKeyboardShortcuts() {
  const selectedElementIds = useSelectedElementIds();
  const selectedSection = useSelectedSection();
  
  const {
    // State
    isEditMode,
    sections,
    gridSize,
    
    // Selection
    selectElement,
    selectAllInSection,
    clearSelection,
    
    // Element actions
    removeElements,
    updateElement,
    moveElement,
    
    // Clipboard
    copyElements,
    pasteElement,
    duplicateElements,
    
    // Layer
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    
    // Lock/visibility
    toggleLock,
    toggleVisibility,
    
    // History
    undo,
    redo,
    canUndo,
    canRedo,
    
    // Group
    groupElements,
    ungroupElement,
  } = useEditorStore();

  // Helper to find elements by IDs
  const findElements = useCallback(() => {
    const elements: import("@/lib/types").Element[] = [];
    for (const section of sections) {
      for (const element of section.elements ?? []) {
        if (selectedElementIds.includes(element.id)) {
          elements.push(element);
        }
      }
    }
    return elements;
  }, [sections, selectedElementIds]);

  // ─────────────────────────────────────────────────────────────────
  // SHORTCUT HANDLERS
  // ─────────────────────────────────────────────────────────────────

  // Delete selected elements
  const handleDelete = useCallback(() => {
    if (selectedElementIds.length > 0) {
      removeElements(selectedElementIds);
    }
  }, [selectedElementIds, removeElements]);

  // Copy selected elements
  const handleCopy = useCallback(() => {
    if (selectedElementIds.length > 0) {
      copyElements(selectedElementIds);
    }
  }, [selectedElementIds, copyElements]);

  // Paste from clipboard
  const handlePaste = useCallback(() => {
    if (selectedSection) {
      pasteElement(selectedSection.id);
    }
  }, [selectedSection, pasteElement]);

  // Duplicate selected elements
  const handleDuplicate = useCallback(() => {
    if (selectedElementIds.length > 0) {
      duplicateElements(selectedElementIds);
    }
  }, [selectedElementIds, duplicateElements]);

  // Select all in section
  const handleSelectAll = useCallback(() => {
    if (selectedSection) {
      selectAllInSection(selectedSection.id);
    }
  }, [selectedSection, selectAllInSection]);

  // Nudge elements with arrow keys
  const handleNudge = useCallback((dx: number, dy: number, useGrid: boolean) => {
    const elements = findElements();
    const step = useGrid ? gridSize : 1;
    
    for (const element of elements) {
      moveElement(element.id, element.x + dx * step, element.y + dy * step);
    }
  }, [findElements, gridSize, moveElement]);

  // Layer ordering
  const handleBringToFront = useCallback(() => {
    if (selectedElementIds.length === 1) {
      bringToFront(selectedElementIds[0]);
    }
  }, [selectedElementIds, bringToFront]);

  const handleSendToBack = useCallback(() => {
    if (selectedElementIds.length === 1) {
      sendToBack(selectedElementIds[0]);
    }
  }, [selectedElementIds, sendToBack]);

  const handleBringForward = useCallback(() => {
    if (selectedElementIds.length === 1) {
      bringForward(selectedElementIds[0]);
    }
  }, [selectedElementIds, bringForward]);

  const handleSendBackward = useCallback(() => {
    if (selectedElementIds.length === 1) {
      sendBackward(selectedElementIds[0]);
    }
  }, [selectedElementIds, sendBackward]);

  // Lock/unlock
  const handleToggleLock = useCallback(() => {
    for (const id of selectedElementIds) {
      toggleLock(id);
    }
  }, [selectedElementIds, toggleLock]);

  // Hide/show
  const handleToggleVisibility = useCallback(() => {
    for (const id of selectedElementIds) {
      toggleVisibility(id);
    }
  }, [selectedElementIds, toggleVisibility]);

  // Group/ungroup
  const handleGroup = useCallback(() => {
    if (selectedElementIds.length >= 2) {
      groupElements(selectedElementIds);
    }
  }, [selectedElementIds, groupElements]);

  const handleUngroup = useCallback(() => {
    if (selectedElementIds.length === 1) {
      const element = findElements()[0];
      if (element?.type === "container") {
        ungroupElement(element.id);
      }
    }
  }, [selectedElementIds, findElements, ungroupElement]);

  // Alignment shortcuts
  const handleAlign = useCallback((alignment: import("@/lib/types").AlignmentType) => {
    const elements = findElements();
    if (elements.length < 2) return;
    
    const newPositions = alignElements(elements, alignment, "selection");
    for (const [id, pos] of newPositions) {
      updateElement(id, { x: pos.x, y: pos.y });
    }
  }, [findElements, updateElement]);

  // Distribution shortcuts
  const handleDistribute = useCallback((direction: import("@/lib/types").DistributeDirection) => {
    const elements = findElements();
    if (elements.length < 3) return;
    
    const newPositions = distributeElements(elements, direction);
    for (const [id, pos] of newPositions) {
      updateElement(id, { x: pos.x, y: pos.y });
    }
  }, [findElements, updateElement]);

  // ─────────────────────────────────────────────────────────────────
  // MAIN KEYBOARD HANDLER
  // ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isEditMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // ───────────────────────────────────────────────────────────
      // CLIPBOARD SHORTCUTS
      // ───────────────────────────────────────────────────────────
      
      // Copy: Cmd/Ctrl + C
      if (cmdOrCtrl && e.key === "c" && !e.shiftKey) {
        e.preventDefault();
        handleCopy();
        return;
      }

      // Paste: Cmd/Ctrl + V
      if (cmdOrCtrl && e.key === "v" && !e.shiftKey) {
        e.preventDefault();
        handlePaste();
        return;
      }

      // Cut: Cmd/Ctrl + X
      if (cmdOrCtrl && e.key === "x" && !e.shiftKey) {
        e.preventDefault();
        handleCopy();
        handleDelete();
        return;
      }

      // Duplicate: Cmd/Ctrl + D
      if (cmdOrCtrl && e.key === "d" && !e.shiftKey) {
        e.preventDefault();
        handleDuplicate();
        return;
      }

      // ───────────────────────────────────────────────────────────
      // SELECTION SHORTCUTS
      // ───────────────────────────────────────────────────────────

      // Select All: Cmd/Ctrl + A
      if (cmdOrCtrl && e.key === "a" && !e.shiftKey) {
        e.preventDefault();
        handleSelectAll();
        return;
      }

      // Deselect: Escape
      if (e.key === "Escape") {
        e.preventDefault();
        clearSelection();
        return;
      }

      // ───────────────────────────────────────────────────────────
      // DELETE
      // ───────────────────────────────────────────────────────────

      // Delete: Backspace or Delete
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        handleDelete();
        return;
      }

      // ───────────────────────────────────────────────────────────
      // UNDO/REDO
      // ───────────────────────────────────────────────────────────

      // Undo: Cmd/Ctrl + Z
      if (cmdOrCtrl && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) {
          undo();
        }
        return;
      }

      // Redo: Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y
      if ((cmdOrCtrl && e.key === "z" && e.shiftKey) || (cmdOrCtrl && e.key === "y")) {
        e.preventDefault();
        if (canRedo()) {
          redo();
        }
        return;
      }

      // ───────────────────────────────────────────────────────────
      // NUDGE WITH ARROW KEYS
      // ───────────────────────────────────────────────────────────

      if (e.key === "ArrowUp") {
        e.preventDefault();
        handleNudge(0, -1, e.shiftKey);
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        handleNudge(0, 1, e.shiftKey);
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleNudge(-1, 0, e.shiftKey);
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNudge(1, 0, e.shiftKey);
        return;
      }

      // ───────────────────────────────────────────────────────────
      // LAYER ORDERING
      // ───────────────────────────────────────────────────────────

      // Bring to Front: Cmd/Ctrl + Shift + ]
      if (cmdOrCtrl && e.shiftKey && e.key === "]") {
        e.preventDefault();
        handleBringToFront();
        return;
      }

      // Send to Back: Cmd/Ctrl + Shift + [
      if (cmdOrCtrl && e.shiftKey && e.key === "[") {
        e.preventDefault();
        handleSendToBack();
        return;
      }

      // Bring Forward: Cmd/Ctrl + ]
      if (cmdOrCtrl && e.key === "]" && !e.shiftKey) {
        e.preventDefault();
        handleBringForward();
        return;
      }

      // Send Backward: Cmd/Ctrl + [
      if (cmdOrCtrl && e.key === "[" && !e.shiftKey) {
        e.preventDefault();
        handleSendBackward();
        return;
      }

      // ───────────────────────────────────────────────────────────
      // LOCK/VISIBILITY
      // ───────────────────────────────────────────────────────────

      // Lock: Cmd/Ctrl + L
      if (cmdOrCtrl && e.key === "l" && !e.shiftKey) {
        e.preventDefault();
        handleToggleLock();
        return;
      }

      // Hide: Cmd/Ctrl + H (Note: On Mac, this minimizes the window, so we use Cmd+Shift+H)
      if (cmdOrCtrl && e.key === "h" && e.shiftKey) {
        e.preventDefault();
        handleToggleVisibility();
        return;
      }

      // ───────────────────────────────────────────────────────────
      // GROUP/UNGROUP
      // ───────────────────────────────────────────────────────────

      // Group: Cmd/Ctrl + G
      if (cmdOrCtrl && e.key === "g" && !e.shiftKey) {
        e.preventDefault();
        handleGroup();
        return;
      }

      // Ungroup: Cmd/Ctrl + Shift + G
      if (cmdOrCtrl && e.key === "g" && e.shiftKey) {
        e.preventDefault();
        handleUngroup();
        return;
      }

      // ───────────────────────────────────────────────────────────
      // ALIGNMENT (with Alt/Option key)
      // ───────────────────────────────────────────────────────────

      if (e.altKey && !cmdOrCtrl) {
        switch (e.key) {
          case "a": // Align Left
            e.preventDefault();
            handleAlign("left");
            return;
          case "d": // Align Right
            e.preventDefault();
            handleAlign("right");
            return;
          case "s": // Align Center (horizontal)
            e.preventDefault();
            handleAlign("center");
            return;
          case "w": // Align Top
            e.preventDefault();
            handleAlign("top");
            return;
          case "x": // Align Bottom
            e.preventDefault();
            handleAlign("bottom");
            return;
          case "e": // Align Middle (vertical)
            e.preventDefault();
            handleAlign("middle");
            return;
          case "h": // Distribute Horizontally
            e.preventDefault();
            handleDistribute("horizontal");
            return;
          case "v": // Distribute Vertically
            e.preventDefault();
            handleDistribute("vertical");
            return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isEditMode,
    handleCopy,
    handlePaste,
    handleDelete,
    handleDuplicate,
    handleSelectAll,
    clearSelection,
    canUndo,
    canRedo,
    undo,
    redo,
    handleNudge,
    handleBringToFront,
    handleSendToBack,
    handleBringForward,
    handleSendBackward,
    handleToggleLock,
    handleToggleVisibility,
    handleGroup,
    handleUngroup,
    handleAlign,
    handleDistribute,
  ]);
}

// ═══════════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS REFERENCE
// ═══════════════════════════════════════════════════════════════════

export const KEYBOARD_SHORTCUTS = [
  // Clipboard
  { keys: ["⌘/Ctrl", "C"], action: "Copy", category: "Clipboard" },
  { keys: ["⌘/Ctrl", "V"], action: "Paste", category: "Clipboard" },
  { keys: ["⌘/Ctrl", "X"], action: "Cut", category: "Clipboard" },
  { keys: ["⌘/Ctrl", "D"], action: "Duplicate", category: "Clipboard" },
  
  // Selection
  { keys: ["⌘/Ctrl", "A"], action: "Select All", category: "Selection" },
  { keys: ["Esc"], action: "Deselect", category: "Selection" },
  { keys: ["Shift", "Click"], action: "Multi-select", category: "Selection" },
  
  // Edit
  { keys: ["Delete/⌫"], action: "Delete", category: "Edit" },
  { keys: ["⌘/Ctrl", "Z"], action: "Undo", category: "Edit" },
  { keys: ["⌘/Ctrl", "⇧", "Z"], action: "Redo", category: "Edit" },
  
  // Move
  { keys: ["↑↓←→"], action: "Nudge 1px", category: "Move" },
  { keys: ["⇧", "↑↓←→"], action: "Nudge by grid", category: "Move" },
  
  // Layer
  { keys: ["⌘/Ctrl", "]"], action: "Bring Forward", category: "Layer" },
  { keys: ["⌘/Ctrl", "["], action: "Send Backward", category: "Layer" },
  { keys: ["⌘/Ctrl", "⇧", "]"], action: "Bring to Front", category: "Layer" },
  { keys: ["⌘/Ctrl", "⇧", "["], action: "Send to Back", category: "Layer" },
  
  // Lock/Hide
  { keys: ["⌘/Ctrl", "L"], action: "Lock/Unlock", category: "Lock" },
  { keys: ["⌘/Ctrl", "⇧", "H"], action: "Hide/Show", category: "Lock" },
  
  // Group
  { keys: ["⌘/Ctrl", "G"], action: "Group", category: "Group" },
  { keys: ["⌘/Ctrl", "⇧", "G"], action: "Ungroup", category: "Group" },
  
  // Align (with Alt/Option)
  { keys: ["⌥", "A"], action: "Align Left", category: "Align" },
  { keys: ["⌥", "D"], action: "Align Right", category: "Align" },
  { keys: ["⌥", "S"], action: "Align Center", category: "Align" },
  { keys: ["⌥", "W"], action: "Align Top", category: "Align" },
  { keys: ["⌥", "X"], action: "Align Bottom", category: "Align" },
  { keys: ["⌥", "E"], action: "Align Middle", category: "Align" },
  { keys: ["⌥", "H"], action: "Distribute H", category: "Align" },
  { keys: ["⌥", "V"], action: "Distribute V", category: "Align" },
] as const;

export default useKeyboardShortcuts;

