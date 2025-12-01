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
import type {
  EditorState,
  Page,
  Section,
  Element,
  SectionType,
  ElementType,
  TextContent,
  ImageContent,
  VideoContent,
} from "@/lib/types";

// Default content for new elements
const defaultTextContent: TextContent = {
  html: "<p>Click to edit text</p>",
  fontSize: 16,
  fontFamily: "sans",
  color: "dawn-70",
  textAlign: "left",
};

const defaultImageContent: ImageContent = {
  src: "",
  alt: "Image description",
  objectFit: "cover",
};

const defaultVideoContent: VideoContent = {
  src: "",
  type: "url",
  autoplay: false,
  loop: false,
  muted: true,
};

function getDefaultContent(type: ElementType) {
  switch (type) {
    case "text":
      return defaultTextContent;
    case "image":
      return defaultImageContent;
    case "video":
      return defaultVideoContent;
  }
}

function getDefaultDimensions(type: ElementType) {
  const dimensions: Record<ElementType, { width: number; height: number }> = {
    text: { width: 400, height: 100 },
    image: { width: 300, height: 200 },
    video: { width: 560, height: 315 },
  };
  return dimensions[type];
}

// Debounce helper for auto-save
const debounceTimers: Record<string, NodeJS.Timeout> = {};
function debounceSave(id: string, fn: () => void, delay = 500) {
  if (debounceTimers[id]) {
    clearTimeout(debounceTimers[id]);
  }
  debounceTimers[id] = setTimeout(fn, delay);
}

// History state for undo/redo
interface HistoryState {
  sections: Section[];
}

const MAX_HISTORY_LENGTH = 50;

// Extended state with history
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

export const useEditorStore = create<EditorStateWithHistory>((set, get) => ({
  // Initial state
  page: null,
  sections: [],
  isEditMode: false,
  selectedSectionId: null,
  selectedElementId: null,
  isDragging: false,
  gridSize: 24,
  showGrid: true,
  
  // History state
  past: [],
  future: [],

  // Basic setters
  setPage: (page) => set({ page }),
  setSections: (sections) => set({ sections }),
  toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),
  setSelectedSection: (id) => set({ selectedSectionId: id, selectedElementId: null }),
  setSelectedElement: (id) => set({ selectedElementId: id }),
  setIsDragging: (isDragging) => set({ isDragging }),
  setGridSize: (size) => set({ gridSize: size }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  
  // History actions
  saveToHistory: () => {
    const { sections, past } = get();
    // Don't save if sections are empty or same as last history
    if (sections.length === 0) return;
    if (past.length > 0) {
      const lastState = past[past.length - 1];
      if (JSON.stringify(lastState.sections) === JSON.stringify(sections)) return;
    }
    
    const newPast = [...past, { sections: JSON.parse(JSON.stringify(sections)) }];
    // Limit history length
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

  // Section Actions
  addSection: async (type, index) => {
    const { sections, page } = get();
    if (!page) return;

    const newIndex = index ?? sections.length;
    const minHeight = type === "hero" ? "100vh" : type === "freeform" ? "50vh" : "auto";

    // Create in database first
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

    // Update order indices for sections after the insertion point
    const updatedSections = sections.map((s) =>
      s.orderIndex >= newIndex ? { ...s, orderIndex: s.orderIndex + 1 } : s
    );

    // Insert new section
    updatedSections.splice(newIndex, 0, { ...newSection, elements: [] });
    
    // Re-sort by order index
    updatedSections.sort((a, b) => a.orderIndex - b.orderIndex);

    set({ sections: updatedSections, selectedSectionId: newSection.id });

    // Save new order to database
    if (dbSection) {
      const sectionIds = updatedSections.map((s) => s.id);
      await reorderSectionsDB(page.id, sectionIds);
      console.log("✓ Section created and saved to database");
    }
  },

  updateSection: (id, updates) => {
    // Save to history before making changes
    get().saveToHistory();
    
    // Update local state immediately
    set((state) => ({
      sections: state.sections.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      ),
    }));

    // Debounce save to Supabase
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
    
    // Update local state immediately
    set((state) => {
      const filteredSections = state.sections.filter((s) => s.id !== id);
      // Re-index remaining sections
      const reindexed = filteredSections.map((s, i) => ({
        ...s,
        orderIndex: i,
      }));
      return {
        sections: reindexed,
        selectedSectionId: state.selectedSectionId === id ? null : state.selectedSectionId,
      };
    });

    // Delete from database
    const deleted = await deleteSectionDB(id);
    if (deleted && page) {
      // Update order in database
      const sectionIds = get().sections.map((s) => s.id);
      await reorderSectionsDB(page.id, sectionIds);
      console.log("✓ Section deleted from database");
    }
  },

  reorderSections: async (fromIndex, toIndex) => {
    const { page } = get();
    
    // Update local state immediately
    set((state) => {
      const sections = [...state.sections];
      const [removed] = sections.splice(fromIndex, 1);
      sections.splice(toIndex, 0, removed);
      // Re-index all sections
      return {
        sections: sections.map((s, i) => ({ ...s, orderIndex: i })),
      };
    });

    // Save new order to database
    if (page) {
      const sectionIds = get().sections.map((s) => s.id);
      await reorderSectionsDB(page.id, sectionIds);
      console.log("✓ Section order saved to database");
    }
  },

  // Element Actions
  addElement: async (sectionId, type, position) => {
    const { sections, gridSize } = get();
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    const dims = getDefaultDimensions(type);
    const x = position ? snapToGrid(position.x, gridSize) : 50;
    const y = position ? snapToGrid(position.y, gridSize) : 50;
    const content = getDefaultContent(type);
    const zIndex = (section.elements?.length ?? 0) + 1;

    // Create in database first
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
        s.id === sectionId
          ? { ...s, elements: [...(s.elements ?? []), newElement] }
          : s
      ),
      selectedElementId: newElement.id,
    }));

    if (dbElement) {
      console.log("✓ Element created and saved to database");
    }
  },

  updateElement: (id, updates) => {
    // Update local state immediately
    set((state) => ({
      sections: state.sections.map((section) => ({
        ...section,
        elements: section.elements?.map((el) =>
          el.id === id ? { ...el, ...updates, updatedAt: new Date().toISOString() } : el
        ),
      })),
    }));

    // Debounce save to Supabase
    debounceSave(`element-${id}`, async () => {
      let element: Element | undefined;
      for (const section of get().sections) {
        element = section.elements?.find((e) => e.id === id);
        if (element) break;
      }
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

  removeElement: async (id) => {
    // Update local state immediately
    set((state) => ({
      sections: state.sections.map((section) => ({
        ...section,
        elements: section.elements?.filter((el) => el.id !== id),
      })),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    }));

    // Delete from database
    const deleted = await deleteElementDB(id);
    if (deleted) {
      console.log("✓ Element deleted from database");
    }
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

    // Debounce save position
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
            ? { ...el, width: snappedWidth, height: snappedHeight, updatedAt: new Date().toISOString() }
            : el
        ),
      })),
    }));

    // Debounce save size
    debounceSave(`element-size-${id}`, async () => {
      await updateElementDB(id, { width: snappedWidth, height: snappedHeight });
    });
  },
}));

// Selector hooks for common patterns
export const useIsEditMode = () => useEditorStore((state) => state.isEditMode);
export const useSections = () => useEditorStore((state) => state.sections);
export const useSelectedSection = () => {
  const sections = useEditorStore((state) => state.sections);
  const selectedId = useEditorStore((state) => state.selectedSectionId);
  return sections.find((s) => s.id === selectedId) ?? null;
};
export const useSelectedElement = () => {
  const sections = useEditorStore((state) => state.sections);
  const selectedId = useEditorStore((state) => state.selectedElementId);
  for (const section of sections) {
    const element = section.elements?.find((e) => e.id === selectedId);
    if (element) return element;
  }
  return null;
};
