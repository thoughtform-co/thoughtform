import { create } from "zustand";
import { generateId, snapToGrid } from "@/lib/utils";
import {
  updateSection as updateSectionDB,
  updateElement as updateElementDB,
  createSection as createSectionDB,
  deleteSection as deleteSectionDB,
  reorderSections as reorderSectionsDB,
  createElement as createElementDB,
  deleteElement as deleteElementDB,
} from "@/lib/queries";
import { DEFAULT_ELEMENT_CONTENT, DEFAULT_ELEMENT_DIMENSIONS } from "@/lib/types";
import type {
  EditorState,
  Page,
  Section,
  Element,
  SectionType,
  ElementType,
  ContainerContent,
} from "@/lib/types";

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function getDefaultContent(type: ElementType) {
  return { ...DEFAULT_ELEMENT_CONTENT[type] };
}

function getDefaultDimensions(type: ElementType) {
  return { ...DEFAULT_ELEMENT_DIMENSIONS[type] };
}

// Debounce helper for auto-save
const debounceTimers: Record<string, NodeJS.Timeout> = {};
function debounceSave(id: string, fn: () => void, delay = 500) {
  if (debounceTimers[id]) {
    clearTimeout(debounceTimers[id]);
  }
  debounceTimers[id] = setTimeout(fn, delay);
}

// Find element by ID across all sections
function findElement(sections: Section[], id: string): Element | undefined {
  for (const section of sections) {
    const element = section.elements?.find((e) => e.id === id);
    if (element) return element;
  }
  return undefined;
}

// Find section containing an element
function findSectionForElement(sections: Section[], elementId: string): Section | undefined {
  return sections.find((s) => s.elements?.some((e) => e.id === elementId));
}

// ═══════════════════════════════════════════════════════════════════
// HISTORY STATE
// ═══════════════════════════════════════════════════════════════════

interface HistoryState {
  sections: Section[];
}

const MAX_HISTORY_LENGTH = 50;

// ═══════════════════════════════════════════════════════════════════
// EXTENDED STATE WITH HISTORY
// ═══════════════════════════════════════════════════════════════════

interface EditorStateWithHistory extends EditorState {
  // History
  past: HistoryState[];
  future: HistoryState[];

  // History actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  saveToHistory: () => void;
}

// ═══════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════

export const useEditorStore = create<EditorStateWithHistory>((set, get) => ({
  // ─────────────────────────────────────────────────────────────────
  // Initial State
  // ─────────────────────────────────────────────────────────────────
  page: null,
  sections: [],
  isEditMode: false,
  selectedSectionId: null,
  selectedElementIds: [],
  isDragging: false,
  gridSize: 24,
  showGrid: true,
  clipboard: null,

  // History state
  past: [],
  future: [],

  // ─────────────────────────────────────────────────────────────────
  // Basic Setters
  // ─────────────────────────────────────────────────────────────────
  setPage: (page) => set({ page }),
  setSections: (sections) => set({ sections }),
  toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),
  setSelectedSection: (id) => set({ selectedSectionId: id, selectedElementIds: [] }),
  setIsDragging: (isDragging) => set({ isDragging }),
  setGridSize: (size) => set({ gridSize: size }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

  // ─────────────────────────────────────────────────────────────────
  // Selection Actions (Multi-Select)
  // ─────────────────────────────────────────────────────────────────
  selectElement: (id) => set({ selectedElementIds: [id] }),

  selectElements: (ids) => set({ selectedElementIds: ids }),

  addToSelection: (id) =>
    set((state) => ({
      selectedElementIds: state.selectedElementIds.includes(id)
        ? state.selectedElementIds
        : [...state.selectedElementIds, id],
    })),

  removeFromSelection: (id) =>
    set((state) => ({
      selectedElementIds: state.selectedElementIds.filter((eid) => eid !== id),
    })),

  selectAllInSection: (sectionId) => {
    const section = get().sections.find((s) => s.id === sectionId);
    if (section?.elements) {
      const ids = section.elements.filter((e) => !e.locked).map((e) => e.id);
      set({ selectedElementIds: ids });
    }
  },

  clearSelection: () => set({ selectedElementIds: [] }),

  // ─────────────────────────────────────────────────────────────────
  // History Actions
  // ─────────────────────────────────────────────────────────────────
  saveToHistory: () => {
    const { sections, past } = get();
    if (sections.length === 0) return;
    if (past.length > 0) {
      const lastState = past[past.length - 1];
      if (JSON.stringify(lastState.sections) === JSON.stringify(sections)) return;
    }

    const newPast = [...past, { sections: JSON.parse(JSON.stringify(sections)) }];
    if (newPast.length > MAX_HISTORY_LENGTH) {
      newPast.shift();
    }
    set({ past: newPast, future: [] });
  },

  undo: () => {
    const { past, sections, future } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);

    set({
      sections: previous.sections,
      past: newPast,
      future: [{ sections: JSON.parse(JSON.stringify(sections)) }, ...future],
    });
  },

  redo: () => {
    const { past, sections, future } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    set({
      sections: next.sections,
      past: [...past, { sections: JSON.parse(JSON.stringify(sections)) }],
      future: newFuture,
    });
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  // ─────────────────────────────────────────────────────────────────
  // Section Actions
  // ─────────────────────────────────────────────────────────────────
  addSection: async (type, index) => {
    const { sections, page } = get();
    if (!page) return;

    const newIndex = index ?? sections.length;
    const minHeight = type === "hero" ? "100vh" : type === "freeform" ? "50vh" : "auto";

    const dbSection = await createSectionDB(page.id, type, newIndex, {}, null, minHeight);

    const newSection: Section = dbSection ?? {
      id: generateId(),
      pageId: page.id,
      type,
      orderIndex: newIndex,
      config: {},
      background: null,
      minHeight,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      elements: [],
    };

    const updatedSections = sections.map((s) =>
      s.orderIndex >= newIndex ? { ...s, orderIndex: s.orderIndex + 1 } : s
    );

    updatedSections.splice(newIndex, 0, { ...newSection, elements: [] });
    updatedSections.sort((a, b) => a.orderIndex - b.orderIndex);

    set({ sections: updatedSections, selectedSectionId: newSection.id });

    if (dbSection) {
      const sectionIds = updatedSections.map((s) => s.id);
      await reorderSectionsDB(page.id, sectionIds);
      console.log("✓ Section created and saved to database");
    }
  },

  updateSection: (id, updates) => {
    get().saveToHistory();

    set((state) => ({
      sections: state.sections.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      ),
    }));

    debounceSave(`section-${id}`, async () => {
      const section = get().sections.find((s) => s.id === id);
      if (section) {
        await updateSectionDB(id, {
          background: section.background,
          minHeight: section.minHeight,
          config: section.config,
        });
        console.log("✓ Section saved to database");
      }
    });
  },

  removeSection: async (id) => {
    const { page } = get();

    set((state) => {
      const filteredSections = state.sections.filter((s) => s.id !== id);
      const reindexed = filteredSections.map((s, i) => ({
        ...s,
        orderIndex: i,
      }));
      return {
        sections: reindexed,
        selectedSectionId: state.selectedSectionId === id ? null : state.selectedSectionId,
      };
    });

    const deleted = await deleteSectionDB(id);
    if (deleted && page) {
      const sectionIds = get().sections.map((s) => s.id);
      await reorderSectionsDB(page.id, sectionIds);
      console.log("✓ Section deleted from database");
    }
  },

  reorderSections: async (fromIndex, toIndex) => {
    const { page } = get();

    set((state) => {
      const sections = [...state.sections];
      const [removed] = sections.splice(fromIndex, 1);
      sections.splice(toIndex, 0, removed);
      return {
        sections: sections.map((s, i) => ({ ...s, orderIndex: i })),
      };
    });

    if (page) {
      const sectionIds = get().sections.map((s) => s.id);
      await reorderSectionsDB(page.id, sectionIds);
      console.log("✓ Section order saved to database");
    }
  },

  // ─────────────────────────────────────────────────────────────────
  // Element Actions
  // ─────────────────────────────────────────────────────────────────
  addElement: async (sectionId, type, position) => {
    const { sections, gridSize } = get();
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    get().saveToHistory();

    const dims = getDefaultDimensions(type);
    const x = position ? snapToGrid(position.x, gridSize) : snapToGrid(100, gridSize);
    const y = position ? snapToGrid(position.y, gridSize) : snapToGrid(100, gridSize);
    const content = getDefaultContent(type);
    const zIndex = (section.elements?.length ?? 0) + 1;

    const dbElement = await createElementDB(
      sectionId,
      type,
      x,
      y,
      content,
      dims.width,
      dims.height,
      zIndex
    );

    const newElement: Element = dbElement ?? {
      id: generateId(),
      sectionId,
      type,
      x,
      y,
      width: dims.width,
      height: dims.height,
      content,
      zIndex,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      sections: state.sections.map((s) =>
        s.id === sectionId ? { ...s, elements: [...(s.elements ?? []), newElement] } : s
      ),
      selectedElementIds: [newElement.id],
    }));

    if (dbElement) {
      console.log("✓ Element created and saved to database");
    }
  },

  updateElement: (id, updates) => {
    set((state) => ({
      sections: state.sections.map((section) => ({
        ...section,
        elements: section.elements?.map((el) =>
          el.id === id ? { ...el, ...updates, updatedAt: new Date().toISOString() } : el
        ),
      })),
    }));

    debounceSave(`element-${id}`, async () => {
      const element = findElement(get().sections, id);
      if (element) {
        await updateElementDB(id, {
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          content: element.content,
          zIndex: element.zIndex,
        });
        console.log("✓ Element saved to database");
      }
    });
  },

  updateElements: (ids, updates) => {
    set((state) => ({
      sections: state.sections.map((section) => ({
        ...section,
        elements: section.elements?.map((el) =>
          ids.includes(el.id) ? { ...el, ...updates, updatedAt: new Date().toISOString() } : el
        ),
      })),
    }));

    // Debounce save for each element
    ids.forEach((id) => {
      debounceSave(`element-${id}`, async () => {
        const element = findElement(get().sections, id);
        if (element) {
          await updateElementDB(id, {
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
            content: element.content,
            zIndex: element.zIndex,
          });
        }
      });
    });
  },

  removeElement: async (id) => {
    set((state) => ({
      sections: state.sections.map((section) => ({
        ...section,
        elements: section.elements?.filter((el) => el.id !== id),
      })),
      selectedElementIds: state.selectedElementIds.filter((eid) => eid !== id),
    }));

    const deleted = await deleteElementDB(id);
    if (deleted) {
      console.log("✓ Element deleted from database");
    }
  },

  removeElements: async (ids) => {
    set((state) => ({
      sections: state.sections.map((section) => ({
        ...section,
        elements: section.elements?.filter((el) => !ids.includes(el.id)),
      })),
      selectedElementIds: state.selectedElementIds.filter((eid) => !ids.includes(eid)),
    }));

    // Delete from database
    await Promise.all(ids.map((id) => deleteElementDB(id)));
    console.log(`✓ ${ids.length} elements deleted from database`);
  },

  moveElement: (id, x, y) => {
    const { gridSize } = get();
    const snappedX = snapToGrid(x, gridSize);
    const snappedY = snapToGrid(y, gridSize);

    set((state) => ({
      sections: state.sections.map((section) => ({
        ...section,
        elements: section.elements?.map((el) =>
          el.id === id
            ? { ...el, x: snappedX, y: snappedY, updatedAt: new Date().toISOString() }
            : el
        ),
      })),
    }));

    debounceSave(`element-pos-${id}`, async () => {
      await updateElementDB(id, { x: snappedX, y: snappedY });
    });
  },

  resizeElement: (id, width, height) => {
    const { gridSize } = get();
    const snappedWidth = snapToGrid(width, gridSize);
    const snappedHeight = snapToGrid(height, gridSize);

    set((state) => ({
      sections: state.sections.map((section) => ({
        ...section,
        elements: section.elements?.map((el) =>
          el.id === id
            ? {
                ...el,
                width: snappedWidth,
                height: snappedHeight,
                updatedAt: new Date().toISOString(),
              }
            : el
        ),
      })),
    }));

    debounceSave(`element-size-${id}`, async () => {
      await updateElementDB(id, { width: snappedWidth, height: snappedHeight });
    });
  },

  // ─────────────────────────────────────────────────────────────────
  // Clipboard Actions
  // ─────────────────────────────────────────────────────────────────
  copyElement: (id) => {
    const element = findElement(get().sections, id);
    if (element) {
      set({ clipboard: JSON.parse(JSON.stringify(element)) });
    }
  },

  copyElements: (ids) => {
    // For simplicity, copy only the first element
    // A more robust implementation would support multiple items
    if (ids.length > 0) {
      const element = findElement(get().sections, ids[0]);
      if (element) {
        set({ clipboard: JSON.parse(JSON.stringify(element)) });
      }
    }
  },

  pasteElement: async (sectionId, position) => {
    const { clipboard, gridSize, sections } = get();
    if (!clipboard) return;

    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    get().saveToHistory();

    const offsetX = position?.x ?? clipboard.x + 20;
    const offsetY = position?.y ?? clipboard.y + 20;
    const x = snapToGrid(offsetX, gridSize);
    const y = snapToGrid(offsetY, gridSize);
    const zIndex = (section.elements?.length ?? 0) + 1;

    const newElement: Element = {
      ...clipboard,
      id: generateId(),
      sectionId,
      x,
      y,
      zIndex,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to database
    const dbElement = await createElementDB(
      sectionId,
      newElement.type,
      x,
      y,
      newElement.content,
      newElement.width ?? undefined,
      newElement.height ?? undefined,
      zIndex
    );

    const finalElement = dbElement ?? newElement;

    set((state) => ({
      sections: state.sections.map((s) =>
        s.id === sectionId ? { ...s, elements: [...(s.elements ?? []), finalElement] } : s
      ),
      selectedElementIds: [finalElement.id],
    }));

    console.log("✓ Element pasted");
  },

  duplicateElement: async (id) => {
    const { sections, gridSize } = get();
    const element = findElement(sections, id);
    if (!element) return;

    const section = findSectionForElement(sections, id);
    if (!section) return;

    get().saveToHistory();

    const x = snapToGrid(element.x + 20, gridSize);
    const y = snapToGrid(element.y + 20, gridSize);
    const zIndex = (section.elements?.length ?? 0) + 1;

    const newElement: Element = {
      ...JSON.parse(JSON.stringify(element)),
      id: generateId(),
      x,
      y,
      zIndex,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const dbElement = await createElementDB(
      section.id,
      newElement.type,
      x,
      y,
      newElement.content,
      newElement.width ?? undefined,
      newElement.height ?? undefined,
      zIndex
    );

    const finalElement = dbElement ?? newElement;

    set((state) => ({
      sections: state.sections.map((s) =>
        s.id === section.id ? { ...s, elements: [...(s.elements ?? []), finalElement] } : s
      ),
      selectedElementIds: [finalElement.id],
    }));

    console.log("✓ Element duplicated");
  },

  duplicateElements: async (ids) => {
    // Duplicate each element
    for (const id of ids) {
      await get().duplicateElement(id);
    }
  },

  // ─────────────────────────────────────────────────────────────────
  // Layer Actions (z-index management)
  // ─────────────────────────────────────────────────────────────────
  bringToFront: (id) => {
    const { sections } = get();
    const section = findSectionForElement(sections, id);
    if (!section?.elements) return;

    const maxZ = Math.max(...section.elements.map((e) => e.zIndex));
    get().updateElement(id, { zIndex: maxZ + 1 });
  },

  sendToBack: (id) => {
    const { sections } = get();
    const section = findSectionForElement(sections, id);
    if (!section?.elements) return;

    const minZ = Math.min(...section.elements.map((e) => e.zIndex));
    get().updateElement(id, { zIndex: Math.max(0, minZ - 1) });
  },

  bringForward: (id) => {
    const element = findElement(get().sections, id);
    if (element) {
      get().updateElement(id, { zIndex: element.zIndex + 1 });
    }
  },

  sendBackward: (id) => {
    const element = findElement(get().sections, id);
    if (element && element.zIndex > 0) {
      get().updateElement(id, { zIndex: element.zIndex - 1 });
    }
  },

  // ─────────────────────────────────────────────────────────────────
  // Lock/Hide Actions
  // ─────────────────────────────────────────────────────────────────
  lockElement: (id) => get().updateElement(id, { locked: true }),
  unlockElement: (id) => get().updateElement(id, { locked: false }),
  hideElement: (id) => get().updateElement(id, { hidden: true }),
  showElement: (id) => get().updateElement(id, { hidden: false }),

  toggleLock: (id) => {
    const element = findElement(get().sections, id);
    if (element) {
      get().updateElement(id, { locked: !element.locked });
    }
  },

  toggleVisibility: (id) => {
    const element = findElement(get().sections, id);
    if (element) {
      get().updateElement(id, { hidden: !element.hidden });
    }
  },

  // ─────────────────────────────────────────────────────────────────
  // Group Actions
  // ─────────────────────────────────────────────────────────────────
  groupElements: async (ids) => {
    if (ids.length < 2) return;

    const { sections, gridSize } = get();

    // Find all elements and their section
    const elements = ids.map((id) => findElement(sections, id)).filter(Boolean) as Element[];
    if (elements.length < 2) return;

    const section = findSectionForElement(sections, ids[0]);
    if (!section) return;

    // Verify all elements are in the same section
    const allSameSection = ids.every(
      (id) => findSectionForElement(sections, id)?.id === section.id
    );
    if (!allSameSection) {
      console.warn("Cannot group elements from different sections");
      return;
    }

    get().saveToHistory();

    // Calculate bounding box for the container
    const minX = Math.min(...elements.map((e) => e.x));
    const minY = Math.min(...elements.map((e) => e.y));
    const maxX = Math.max(...elements.map((e) => e.x + (e.width ?? 0)));
    const maxY = Math.max(...elements.map((e) => e.y + (e.height ?? 0)));

    const containerContent: ContainerContent = {
      children: ids,
      direction: "column",
      alignItems: "start",
      justifyContent: "start",
      gap: 0,
    };

    const container: Element = {
      id: generateId(),
      sectionId: section.id,
      type: "container",
      name: "Group",
      x: snapToGrid(minX, gridSize),
      y: snapToGrid(minY, gridSize),
      width: snapToGrid(maxX - minX, gridSize),
      height: snapToGrid(maxY - minY, gridSize),
      content: containerContent,
      zIndex: (section.elements?.length ?? 0) + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add container to section
    set((state) => ({
      sections: state.sections.map((s) =>
        s.id === section.id ? { ...s, elements: [...(s.elements ?? []), container] } : s
      ),
      selectedElementIds: [container.id],
    }));

    console.log("✓ Elements grouped");
  },

  ungroupElement: (containerId) => {
    const { sections } = get();
    const container = findElement(sections, containerId);
    if (!container || container.type !== "container") return;

    const section = findSectionForElement(sections, containerId);
    if (!section) return;

    get().saveToHistory();

    const containerContent = container.content as ContainerContent;
    const childIds = containerContent.children || [];

    // Remove container, keep children
    set((state) => ({
      sections: state.sections.map((s) =>
        s.id === section.id
          ? {
              ...s,
              elements: s.elements?.filter((e) => e.id !== containerId),
            }
          : s
      ),
      selectedElementIds: childIds,
    }));

    console.log("✓ Container ungrouped");
  },
}));

// ═══════════════════════════════════════════════════════════════════
// SELECTOR HOOKS
// ═══════════════════════════════════════════════════════════════════

export const useIsEditMode = () => useEditorStore((state) => state.isEditMode);
export const useSections = () => useEditorStore((state) => state.sections);
export const useSelectedElementIds = () => useEditorStore((state) => state.selectedElementIds);
export const useClipboard = () => useEditorStore((state) => state.clipboard);

export const useSelectedSection = () => {
  const sections = useEditorStore((state) => state.sections);
  const selectedId = useEditorStore((state) => state.selectedSectionId);
  return sections.find((s) => s.id === selectedId) ?? null;
};

export const useSelectedElements = () => {
  const sections = useEditorStore((state) => state.sections);
  const selectedIds = useEditorStore((state) => state.selectedElementIds);
  const elements: Element[] = [];

  for (const section of sections) {
    for (const element of section.elements ?? []) {
      if (selectedIds.includes(element.id)) {
        elements.push(element);
      }
    }
  }

  return elements;
};

// Legacy selector for single selection (returns first selected)
export const useSelectedElement = () => {
  const sections = useEditorStore((state) => state.sections);
  const selectedIds = useEditorStore((state) => state.selectedElementIds);

  if (selectedIds.length === 0) return null;

  for (const section of sections) {
    const element = section.elements?.find((e) => e.id === selectedIds[0]);
    if (element) return element;
  }
  return null;
};
