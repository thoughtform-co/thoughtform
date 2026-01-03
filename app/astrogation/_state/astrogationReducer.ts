import type {
  UIComponentPreset,
  StyleConfig,
  WorkspaceTab,
  SurveyItem,
  FoundryVariant,
} from "../_components/types";
import { DEFAULT_STYLE } from "../_components/types";
import { getComponentById } from "../catalog";

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

  // Component editing
  componentProps: Record<string, unknown>;
  style: StyleConfig;

  // Foundry variants (for comparison grid)
  foundryVariants: FoundryVariant[];

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

  // Component editing
  | { type: "SET_PROPS"; payload: Record<string, unknown> }
  | { type: "SET_STYLE"; payload: StyleConfig }
  | { type: "RESET_PROPS_FOR_COMPONENT"; payload: string }

  // Foundry variants
  | { type: "ADD_FOUNDRY_VARIANT"; payload: FoundryVariant }
  | { type: "REMOVE_FOUNDRY_VARIANT"; payload: string }
  | { type: "CLEAR_FOUNDRY_VARIANTS" }

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
};
