import type {
  UIComponentPreset,
  StyleConfig,
  WorkspaceTab,
  SurveyItem,
  FoundryVariant,
  FoundryCanvasDocument,
  FoundryCanvasItem,
  FoundryViewport,
} from "../_components/types";
import { DEFAULT_STYLE, EMPTY_FOUNDRY_DOCUMENT } from "../_components/types";
import { getComponentById } from "../catalog";

function sanitizeArgs(args: Record<string, unknown>): Record<string, unknown> {
  // Foundry documents are persisted as JSON (Supabase jsonb + localStorage).
  // Strip any non-serializable values (functions, undefined, etc) defensively.
  try {
    return JSON.parse(JSON.stringify(args)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

// ═══════════════════════════════════════════════════════════════
// STATE TYPE
// ═══════════════════════════════════════════════════════════════

export interface AstrogationState {
  // Selection
  selectedCategory: string | null;
  selectedComponentId: string | null;

  // Workspace
  activeTab: WorkspaceTab;

  // Focus (global + element-level)
  isFocused: boolean;

  // Component editing (legacy single-component mode)
  componentProps: Record<string, unknown>;
  style: StyleConfig;

  // Foundry variants (for comparison grid)
  foundryVariants: FoundryVariant[];

  // ═══════════════════════════════════════════════════════════════
  // FOUNDRY CANVAS STATE (Phase 1)
  // ═══════════════════════════════════════════════════════════════
  /** The full canvas document with multiple items */
  foundryDocument: FoundryCanvasDocument;
  /** Currently selected item ID on the canvas (null = nothing selected) */
  foundrySelectedItemId: string | null;
  /** Track if the document has unsaved changes */
  foundryDocumentDirty: boolean;

  // Presets
  presets: UIComponentPreset[];
  presetName: string;

  // Toast notification
  toast: string | null;

  // Survey state
  surveyCategoryId: string | null;
  surveyComponentKey: string | null;
  surveySelectedItemId: string | null;
  surveyItems: SurveyItem[];
  surveyLoading: boolean;
  surveySearchQuery: string;
  surveyIsSearching: boolean;
}

export const initialState: AstrogationState = {
  selectedCategory: "brand",
  selectedComponentId: null,
  activeTab: "foundry",
  isFocused: false,
  componentProps: {},
  style: DEFAULT_STYLE,
  foundryVariants: [],
  // Foundry canvas defaults
  foundryDocument: EMPTY_FOUNDRY_DOCUMENT,
  foundrySelectedItemId: null,
  foundryDocumentDirty: false,
  // Presets
  presets: [],
  presetName: "",
  toast: null,
  // Survey defaults
  surveyCategoryId: null,
  surveyComponentKey: null,
  surveySelectedItemId: null,
  surveyItems: [],
  surveyLoading: false,
  surveySearchQuery: "",
  surveyIsSearching: false,
};

// ═══════════════════════════════════════════════════════════════
// ACTION TYPES
// ═══════════════════════════════════════════════════════════════

export type AstrogationAction =
  // Selection
  | { type: "SELECT_CATEGORY"; payload: string }
  | { type: "SELECT_COMPONENT"; payload: string | null }

  // Workspace
  | { type: "SET_TAB"; payload: WorkspaceTab }

  // Focus
  | { type: "SET_FOCUS"; payload: boolean }

  // Component editing (legacy single-component mode)
  | { type: "SET_PROPS"; payload: Record<string, unknown> }
  | { type: "SET_STYLE"; payload: StyleConfig }
  | { type: "RESET_PROPS_FOR_COMPONENT"; payload: string }

  // Foundry variants
  | { type: "ADD_FOUNDRY_VARIANT"; payload: FoundryVariant }
  | { type: "REMOVE_FOUNDRY_VARIANT"; payload: string }
  | { type: "CLEAR_FOUNDRY_VARIANTS" }

  // ═══════════════════════════════════════════════════════════════
  // FOUNDRY CANVAS ACTIONS (Phase 1)
  // ═══════════════════════════════════════════════════════════════
  /** Load entire document (from Supabase or localStorage) */
  | { type: "FOUNDRY_LOAD_DOCUMENT"; payload: FoundryCanvasDocument }
  /** Add a new item to the canvas */
  | { type: "FOUNDRY_ADD_ITEM"; payload: FoundryCanvasItem }
  /** Select an item on the canvas (without resetting props) */
  | { type: "FOUNDRY_SELECT_ITEM"; payload: string | null }
  /** Move an item to new position */
  | { type: "FOUNDRY_MOVE_ITEM"; payload: { id: string; x: number; y: number } }
  /** Resize an item */
  | { type: "FOUNDRY_RESIZE_ITEM"; payload: { id: string; w: number; h: number } }
  /** Set item args (args-first source of truth; used by registry + legacy previews) */
  | { type: "FOUNDRY_SET_ITEM_ARGS"; payload: { id: string; args: Record<string, unknown> } }
  /** Update item props */
  | { type: "FOUNDRY_UPDATE_ITEM_PROPS"; payload: { id: string; props: Record<string, unknown> } }
  /** Update item styleVars */
  | {
      type: "FOUNDRY_UPDATE_ITEM_STYLE_VARS";
      payload: { id: string; styleVars: Record<string, string> };
    }
  /** Update item name */
  | { type: "FOUNDRY_RENAME_ITEM"; payload: { id: string; name: string } }
  /** Toggle item lock */
  | { type: "FOUNDRY_TOGGLE_ITEM_LOCK"; payload: string }
  /** Delete an item */
  | { type: "FOUNDRY_DELETE_ITEM"; payload: string }
  /** Duplicate an item */
  | { type: "FOUNDRY_DUPLICATE_ITEM"; payload: string }
  /** Bring item forward (increase z-index) */
  | { type: "FOUNDRY_BRING_FORWARD"; payload: string }
  /** Send item backward (decrease z-index) */
  | { type: "FOUNDRY_SEND_BACKWARD"; payload: string }
  /** Update viewport (pan/zoom) */
  | { type: "FOUNDRY_SET_VIEWPORT"; payload: Partial<FoundryViewport> }
  /** Mark document as clean (after save) */
  | { type: "FOUNDRY_MARK_CLEAN" }

  // Presets
  | { type: "LOAD_PRESETS"; payload: UIComponentPreset[] }
  | { type: "PRESET_SAVED"; payload: UIComponentPreset }
  | { type: "PRESET_DELETED"; payload: string }
  | { type: "SET_PRESET_NAME"; payload: string }
  | { type: "LOAD_PRESET"; payload: UIComponentPreset }

  // Toast
  | { type: "SHOW_TOAST"; payload: string }
  | { type: "HIDE_TOAST" }

  // Survey
  | { type: "SURVEY_SET_CATEGORY"; payload: string | null }
  | { type: "SURVEY_SET_COMPONENT"; payload: string | null }
  | { type: "SURVEY_SELECT_ITEM"; payload: string | null }
  | { type: "SURVEY_LOAD_ITEMS"; payload: SurveyItem[] }
  | { type: "SURVEY_ADD_ITEM"; payload: SurveyItem }
  | { type: "SURVEY_UPDATE_ITEM"; payload: SurveyItem }
  | { type: "SURVEY_DELETE_ITEM"; payload: string }
  | { type: "SURVEY_SET_LOADING"; payload: boolean }
  | { type: "SURVEY_SET_SEARCH_QUERY"; payload: string }
  | { type: "SURVEY_SET_SEARCHING"; payload: boolean };

// ═══════════════════════════════════════════════════════════════
// REDUCER
// ═══════════════════════════════════════════════════════════════

export function astrogationReducer(
  state: AstrogationState,
  action: AstrogationAction
): AstrogationState {
  switch (action.type) {
    // Selection
    case "SELECT_CATEGORY":
      return { ...state, selectedCategory: action.payload };

    case "SELECT_COMPONENT": {
      if (action.payload === state.selectedComponentId) return state;

      // Reset component props when selecting a new component
      const def = action.payload ? getComponentById(action.payload) : null;
      const defaultProps: Record<string, unknown> = {};
      if (def) {
        def.props.forEach((p) => {
          defaultProps[p.name] = p.default;
        });
      }

      return {
        ...state,
        selectedComponentId: action.payload,
        componentProps: defaultProps,
        isFocused: false, // Reset focus when changing component
      };
    }

    // Workspace
    case "SET_TAB":
      return { ...state, activeTab: action.payload };

    // Focus
    case "SET_FOCUS":
      return { ...state, isFocused: action.payload };

    // Component editing
    case "SET_PROPS":
      return { ...state, componentProps: action.payload };

    case "SET_STYLE":
      return { ...state, style: action.payload };

    case "RESET_PROPS_FOR_COMPONENT": {
      const def = getComponentById(action.payload);
      if (!def) return state;

      const defaultProps: Record<string, unknown> = {};
      def.props.forEach((p) => {
        defaultProps[p.name] = p.default;
      });
      return { ...state, componentProps: defaultProps };
    }

    // Foundry variants
    case "ADD_FOUNDRY_VARIANT":
      return {
        ...state,
        foundryVariants: [...state.foundryVariants, action.payload],
      };

    case "REMOVE_FOUNDRY_VARIANT":
      return {
        ...state,
        foundryVariants: state.foundryVariants.filter((v) => v.id !== action.payload),
      };

    case "CLEAR_FOUNDRY_VARIANTS":
      return {
        ...state,
        foundryVariants: [],
      };

    // Presets
    case "LOAD_PRESETS":
      return { ...state, presets: action.payload };

    case "PRESET_SAVED":
      return {
        ...state,
        presets: [...state.presets, action.payload],
        presetName: "",
      };

    case "PRESET_DELETED":
      return {
        ...state,
        presets: state.presets.filter((p) => p.id !== action.payload),
      };

    case "SET_PRESET_NAME":
      return { ...state, presetName: action.payload };

    case "LOAD_PRESET": {
      const { __style, ...props } = action.payload.config as Record<string, unknown>;
      return {
        ...state,
        selectedComponentId: action.payload.component_key,
        componentProps: props,
        style: __style ? (__style as StyleConfig) : state.style,
        activeTab: "foundry", // Switch to foundry when loading a preset
      };
    }

    // Toast
    case "SHOW_TOAST":
      return { ...state, toast: action.payload };

    case "HIDE_TOAST":
      return { ...state, toast: null };

    // ═══════════════════════════════════════════════════════════════
    // FOUNDRY CANVAS REDUCER CASES
    // ═══════════════════════════════════════════════════════════════

    case "FOUNDRY_LOAD_DOCUMENT":
      return {
        ...state,
        foundryDocument: {
          ...action.payload,
          items: (action.payload.items || []).map((item) => ({
            ...item,
            args: item.args ? sanitizeArgs(item.args) : item.args,
            props: sanitizeArgs(item.props || {}),
          })),
        },
        foundrySelectedItemId: null,
        foundryDocumentDirty: false,
      };

    case "FOUNDRY_ADD_ITEM":
      return {
        ...state,
        foundryDocument: {
          ...state.foundryDocument,
          items: [
            ...state.foundryDocument.items,
            {
              ...action.payload,
              args: action.payload.args ? sanitizeArgs(action.payload.args) : action.payload.args,
              props: sanitizeArgs(action.payload.props || {}),
            },
          ],
        },
        foundrySelectedItemId: action.payload.id,
        foundryDocumentDirty: true,
      };

    case "FOUNDRY_SELECT_ITEM":
      // Select without resetting props - just update selection
      return {
        ...state,
        foundrySelectedItemId: action.payload,
      };

    case "FOUNDRY_MOVE_ITEM":
      return {
        ...state,
        foundryDocument: {
          ...state.foundryDocument,
          items: state.foundryDocument.items.map((item) =>
            item.id === action.payload.id
              ? { ...item, frame: { ...item.frame, x: action.payload.x, y: action.payload.y } }
              : item
          ),
        },
        foundryDocumentDirty: true,
      };

    case "FOUNDRY_RESIZE_ITEM":
      return {
        ...state,
        foundryDocument: {
          ...state.foundryDocument,
          items: state.foundryDocument.items.map((item) =>
            item.id === action.payload.id
              ? { ...item, frame: { ...item.frame, w: action.payload.w, h: action.payload.h } }
              : item
          ),
        },
        foundryDocumentDirty: true,
      };

    case "FOUNDRY_SET_ITEM_ARGS":
      return {
        ...state,
        foundryDocument: {
          ...state.foundryDocument,
          items: state.foundryDocument.items.map((item) =>
            item.id === action.payload.id
              ? {
                  ...item,
                  args: sanitizeArgs(action.payload.args),
                  // Keep legacy props in sync for backwards compatibility.
                  // ComponentPreview merges { ...props, ...args }, so args remains canonical.
                  props: sanitizeArgs(action.payload.args),
                }
              : item
          ),
        },
        foundryDocumentDirty: true,
      };

    case "FOUNDRY_UPDATE_ITEM_PROPS":
      return {
        ...state,
        foundryDocument: {
          ...state.foundryDocument,
          items: state.foundryDocument.items.map((item) =>
            item.id === action.payload.id
              ? { ...item, props: { ...item.props, ...action.payload.props } }
              : item
          ),
        },
        foundryDocumentDirty: true,
      };

    case "FOUNDRY_UPDATE_ITEM_STYLE_VARS":
      return {
        ...state,
        foundryDocument: {
          ...state.foundryDocument,
          items: state.foundryDocument.items.map((item) =>
            item.id === action.payload.id
              ? { ...item, styleVars: { ...item.styleVars, ...action.payload.styleVars } }
              : item
          ),
        },
        foundryDocumentDirty: true,
      };

    case "FOUNDRY_RENAME_ITEM":
      return {
        ...state,
        foundryDocument: {
          ...state.foundryDocument,
          items: state.foundryDocument.items.map((item) =>
            item.id === action.payload.id ? { ...item, name: action.payload.name } : item
          ),
        },
        foundryDocumentDirty: true,
      };

    case "FOUNDRY_TOGGLE_ITEM_LOCK":
      return {
        ...state,
        foundryDocument: {
          ...state.foundryDocument,
          items: state.foundryDocument.items.map((item) =>
            item.id === action.payload ? { ...item, locked: !item.locked } : item
          ),
        },
        foundryDocumentDirty: true,
      };

    case "FOUNDRY_DELETE_ITEM":
      return {
        ...state,
        foundryDocument: {
          ...state.foundryDocument,
          items: state.foundryDocument.items.filter((item) => item.id !== action.payload),
        },
        foundrySelectedItemId:
          state.foundrySelectedItemId === action.payload ? null : state.foundrySelectedItemId,
        foundryDocumentDirty: true,
      };

    case "FOUNDRY_DUPLICATE_ITEM": {
      const originalItem = state.foundryDocument.items.find((item) => item.id === action.payload);
      if (!originalItem) return state;

      const newId = crypto.randomUUID();
      const maxZ = Math.max(...state.foundryDocument.items.map((i) => i.frame.z), 0);
      const duplicatedItem: FoundryCanvasItem = {
        ...originalItem,
        id: newId,
        name: `${originalItem.name} (copy)`,
        frame: {
          ...originalItem.frame,
          x: originalItem.frame.x + 20,
          y: originalItem.frame.y + 20,
          z: maxZ + 1,
        },
      };

      return {
        ...state,
        foundryDocument: {
          ...state.foundryDocument,
          items: [...state.foundryDocument.items, duplicatedItem],
        },
        foundrySelectedItemId: newId,
        foundryDocumentDirty: true,
      };
    }

    case "FOUNDRY_BRING_FORWARD": {
      const items = state.foundryDocument.items;
      const targetItem = items.find((i) => i.id === action.payload);
      if (!targetItem) return state;

      const maxZ = Math.max(...items.map((i) => i.frame.z));
      if (targetItem.frame.z >= maxZ) return state; // Already on top

      return {
        ...state,
        foundryDocument: {
          ...state.foundryDocument,
          items: items.map((item) =>
            item.id === action.payload
              ? { ...item, frame: { ...item.frame, z: item.frame.z + 1 } }
              : item.frame.z === targetItem.frame.z + 1
                ? { ...item, frame: { ...item.frame, z: item.frame.z - 1 } }
                : item
          ),
        },
        foundryDocumentDirty: true,
      };
    }

    case "FOUNDRY_SEND_BACKWARD": {
      const items = state.foundryDocument.items;
      const targetItem = items.find((i) => i.id === action.payload);
      if (!targetItem) return state;

      const minZ = Math.min(...items.map((i) => i.frame.z));
      if (targetItem.frame.z <= minZ) return state; // Already at bottom

      return {
        ...state,
        foundryDocument: {
          ...state.foundryDocument,
          items: items.map((item) =>
            item.id === action.payload
              ? { ...item, frame: { ...item.frame, z: item.frame.z - 1 } }
              : item.frame.z === targetItem.frame.z - 1
                ? { ...item, frame: { ...item.frame, z: item.frame.z + 1 } }
                : item
          ),
        },
        foundryDocumentDirty: true,
      };
    }

    case "FOUNDRY_SET_VIEWPORT":
      return {
        ...state,
        foundryDocument: {
          ...state.foundryDocument,
          viewport: { ...state.foundryDocument.viewport, ...action.payload },
        },
        foundryDocumentDirty: true,
      };

    case "FOUNDRY_MARK_CLEAN":
      return {
        ...state,
        foundryDocumentDirty: false,
      };

    // Survey
    case "SURVEY_SET_CATEGORY":
      // ═══════════════════════════════════════════════════════════════
      // SENTINEL WARNING: This action resets surveyComponentKey to null.
      // ═══════════════════════════════════════════════════════════════
      // When updating both category and component, dispatch SURVEY_SET_CATEGORY
      // FIRST, then SURVEY_SET_COMPONENT. Otherwise the component selection
      // will be immediately cleared.
      //
      // See: sentinel/BEST-PRACTICES.md → "Order Matters: Update Dependent State"
      // ═══════════════════════════════════════════════════════════════
      return {
        ...state,
        surveyCategoryId: action.payload,
        surveyComponentKey: null, // Reset component when category changes
        surveySelectedItemId: null, // Clear selected item when filter changes
      };

    case "SURVEY_SET_COMPONENT":
      return {
        ...state,
        surveyComponentKey: action.payload,
        surveySelectedItemId: null, // Clear selected item when filter changes
      };

    case "SURVEY_SELECT_ITEM":
      return { ...state, surveySelectedItemId: action.payload };

    case "SURVEY_LOAD_ITEMS":
      return { ...state, surveyItems: action.payload, surveyLoading: false };

    case "SURVEY_ADD_ITEM":
      return {
        ...state,
        surveyItems: [action.payload, ...state.surveyItems],
        surveySelectedItemId: action.payload.id,
      };

    case "SURVEY_UPDATE_ITEM":
      return {
        ...state,
        surveyItems: state.surveyItems.map((item) =>
          item.id === action.payload.id ? action.payload : item
        ),
      };

    case "SURVEY_DELETE_ITEM":
      return {
        ...state,
        surveyItems: state.surveyItems.filter((item) => item.id !== action.payload),
        surveySelectedItemId:
          state.surveySelectedItemId === action.payload ? null : state.surveySelectedItemId,
      };

    case "SURVEY_SET_LOADING":
      return { ...state, surveyLoading: action.payload };

    case "SURVEY_SET_SEARCH_QUERY":
      return { ...state, surveySearchQuery: action.payload };

    case "SURVEY_SET_SEARCHING":
      return { ...state, surveyIsSearching: action.payload };

    default:
      return state;
  }
}

// ═══════════════════════════════════════════════════════════════
// ACTION CREATORS (optional helpers for cleaner dispatch calls)
// ═══════════════════════════════════════════════════════════════

export const actions = {
  selectCategory: (id: string): AstrogationAction => ({ type: "SELECT_CATEGORY", payload: id }),
  selectComponent: (id: string | null): AstrogationAction => ({
    type: "SELECT_COMPONENT",
    payload: id,
  }),
  setTab: (tab: WorkspaceTab): AstrogationAction => ({ type: "SET_TAB", payload: tab }),
  setFocus: (focused: boolean): AstrogationAction => ({ type: "SET_FOCUS", payload: focused }),
  setProps: (props: Record<string, unknown>): AstrogationAction => ({
    type: "SET_PROPS",
    payload: props,
  }),
  setStyle: (style: StyleConfig): AstrogationAction => ({ type: "SET_STYLE", payload: style }),
  addFoundryVariant: (variant: FoundryVariant): AstrogationAction => ({
    type: "ADD_FOUNDRY_VARIANT",
    payload: variant,
  }),
  removeFoundryVariant: (id: string): AstrogationAction => ({
    type: "REMOVE_FOUNDRY_VARIANT",
    payload: id,
  }),
  clearFoundryVariants: (): AstrogationAction => ({
    type: "CLEAR_FOUNDRY_VARIANTS",
  }),
  loadPresets: (presets: UIComponentPreset[]): AstrogationAction => ({
    type: "LOAD_PRESETS",
    payload: presets,
  }),
  presetSaved: (preset: UIComponentPreset): AstrogationAction => ({
    type: "PRESET_SAVED",
    payload: preset,
  }),
  presetDeleted: (id: string): AstrogationAction => ({ type: "PRESET_DELETED", payload: id }),
  setPresetName: (name: string): AstrogationAction => ({ type: "SET_PRESET_NAME", payload: name }),
  loadPreset: (preset: UIComponentPreset): AstrogationAction => ({
    type: "LOAD_PRESET",
    payload: preset,
  }),
  showToast: (message: string): AstrogationAction => ({ type: "SHOW_TOAST", payload: message }),
  hideToast: (): AstrogationAction => ({ type: "HIDE_TOAST" }),

  // Survey actions
  surveySetCategory: (id: string | null): AstrogationAction => ({
    type: "SURVEY_SET_CATEGORY",
    payload: id,
  }),
  surveySetComponent: (key: string | null): AstrogationAction => ({
    type: "SURVEY_SET_COMPONENT",
    payload: key,
  }),
  surveySelectItem: (id: string | null): AstrogationAction => ({
    type: "SURVEY_SELECT_ITEM",
    payload: id,
  }),
  surveyLoadItems: (items: SurveyItem[]): AstrogationAction => ({
    type: "SURVEY_LOAD_ITEMS",
    payload: items,
  }),
  surveyAddItem: (item: SurveyItem): AstrogationAction => ({
    type: "SURVEY_ADD_ITEM",
    payload: item,
  }),
  surveyUpdateItem: (item: SurveyItem): AstrogationAction => ({
    type: "SURVEY_UPDATE_ITEM",
    payload: item,
  }),
  surveyDeleteItem: (id: string): AstrogationAction => ({
    type: "SURVEY_DELETE_ITEM",
    payload: id,
  }),
  surveySetLoading: (loading: boolean): AstrogationAction => ({
    type: "SURVEY_SET_LOADING",
    payload: loading,
  }),
  surveySetSearchQuery: (query: string): AstrogationAction => ({
    type: "SURVEY_SET_SEARCH_QUERY",
    payload: query,
  }),
  surveySetSearching: (searching: boolean): AstrogationAction => ({
    type: "SURVEY_SET_SEARCHING",
    payload: searching,
  }),

  // ═══════════════════════════════════════════════════════════════
  // FOUNDRY CANVAS ACTION CREATORS
  // ═══════════════════════════════════════════════════════════════

  foundryLoadDocument: (doc: FoundryCanvasDocument): AstrogationAction => ({
    type: "FOUNDRY_LOAD_DOCUMENT",
    payload: doc,
  }),
  foundryAddItem: (item: FoundryCanvasItem): AstrogationAction => ({
    type: "FOUNDRY_ADD_ITEM",
    payload: item,
  }),
  foundrySelectItem: (id: string | null): AstrogationAction => ({
    type: "FOUNDRY_SELECT_ITEM",
    payload: id,
  }),
  foundryMoveItem: (id: string, x: number, y: number): AstrogationAction => ({
    type: "FOUNDRY_MOVE_ITEM",
    payload: { id, x, y },
  }),
  foundryResizeItem: (id: string, w: number, h: number): AstrogationAction => ({
    type: "FOUNDRY_RESIZE_ITEM",
    payload: { id, w, h },
  }),
  foundrySetItemArgs: (id: string, args: Record<string, unknown>): AstrogationAction => ({
    type: "FOUNDRY_SET_ITEM_ARGS",
    payload: { id, args },
  }),
  foundryUpdateItemProps: (id: string, props: Record<string, unknown>): AstrogationAction => ({
    type: "FOUNDRY_UPDATE_ITEM_PROPS",
    payload: { id, props },
  }),
  foundryUpdateItemStyleVars: (
    id: string,
    styleVars: Record<string, string>
  ): AstrogationAction => ({
    type: "FOUNDRY_UPDATE_ITEM_STYLE_VARS",
    payload: { id, styleVars },
  }),
  foundryRenameItem: (id: string, name: string): AstrogationAction => ({
    type: "FOUNDRY_RENAME_ITEM",
    payload: { id, name },
  }),
  foundryToggleItemLock: (id: string): AstrogationAction => ({
    type: "FOUNDRY_TOGGLE_ITEM_LOCK",
    payload: id,
  }),
  foundryDeleteItem: (id: string): AstrogationAction => ({
    type: "FOUNDRY_DELETE_ITEM",
    payload: id,
  }),
  foundryDuplicateItem: (id: string): AstrogationAction => ({
    type: "FOUNDRY_DUPLICATE_ITEM",
    payload: id,
  }),
  foundryBringForward: (id: string): AstrogationAction => ({
    type: "FOUNDRY_BRING_FORWARD",
    payload: id,
  }),
  foundrySendBackward: (id: string): AstrogationAction => ({
    type: "FOUNDRY_SEND_BACKWARD",
    payload: id,
  }),
  foundrySetViewport: (viewport: Partial<FoundryViewport>): AstrogationAction => ({
    type: "FOUNDRY_SET_VIEWPORT",
    payload: viewport,
  }),
  foundryMarkClean: (): AstrogationAction => ({
    type: "FOUNDRY_MARK_CLEAN",
  }),
};
