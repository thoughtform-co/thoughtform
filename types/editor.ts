// ═══════════════════════════════════════════════════════════════════
// EDITOR TYPES - Editor state and section templates
// ═══════════════════════════════════════════════════════════════════

import type { Page, Section, Element, SectionType, ElementType } from "./database";

// Editor State Types
export interface EditorState {
  // Data
  page: Page | null;
  sections: Section[];

  // UI State
  isEditMode: boolean;
  selectedSectionId: string | null;
  selectedElementIds: string[]; // Multi-select support
  isDragging: boolean;
  gridSize: number;
  showGrid: boolean;

  // Clipboard
  clipboard: Element | null;

  // Actions
  setPage: (page: Page | null) => void;
  setSections: (sections: Section[]) => void;
  toggleEditMode: () => void;
  setSelectedSection: (id: string | null) => void;

  // Selection Actions (multi-select)
  selectElement: (id: string) => void;
  selectElements: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  selectAllInSection: (sectionId: string) => void;
  clearSelection: () => void;

  setIsDragging: (isDragging: boolean) => void;
  setGridSize: (size: number) => void;
  toggleGrid: () => void;

  // Section Actions
  addSection: (type: SectionType, index?: number) => void;
  updateSection: (id: string, updates: Partial<Section>) => void;
  removeSection: (id: string) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;

  // Element Actions
  addElement: (sectionId: string, type: ElementType, position?: { x: number; y: number }) => void;
  updateElement: (id: string, updates: Partial<Element>) => void;
  updateElements: (ids: string[], updates: Partial<Element>) => void; // Batch update
  removeElement: (id: string) => void;
  removeElements: (ids: string[]) => void; // Batch remove
  moveElement: (id: string, x: number, y: number) => void;
  resizeElement: (id: string, width: number, height: number) => void;

  // Clipboard Actions
  copyElement: (id: string) => void;
  copyElements: (ids: string[]) => void;
  pasteElement: (sectionId: string, position?: { x: number; y: number }) => void;
  duplicateElement: (id: string) => void;
  duplicateElements: (ids: string[]) => void;

  // Layer Actions
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;

  // Lock/Hide Actions
  lockElement: (id: string) => void;
  unlockElement: (id: string) => void;
  hideElement: (id: string) => void;
  showElement: (id: string) => void;
  toggleLock: (id: string) => void;
  toggleVisibility: (id: string) => void;

  // Group Actions
  groupElements: (ids: string[]) => void;
  ungroupElement: (containerId: string) => void;
}

// Section Template Configuration
export interface SectionTemplate {
  type: SectionType;
  label: string;
  description: string;
  icon: string;
  defaultConfig: Record<string, unknown>;
  defaultMinHeight: string;
  isTemplate: boolean;
}
