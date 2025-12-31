import type { UIComponentPreset, StyleConfig, WorkspaceTab } from "../_components/types";
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

  // Presets
  presets: UIComponentPreset[];
  presetName: string;

  // Toast notification
  toast: string | null;
}

export const initialState: AstrogationState = {
  selectedCategory: "brand",
  selectedComponentId: null,
  activeTab: "foundry",
  isFocused: false,
  componentProps: {},
  style: DEFAULT_STYLE,
  presets: [],
  presetName: "",
  toast: null,
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

  // Presets
  | { type: "LOAD_PRESETS"; payload: UIComponentPreset[] }
  | { type: "PRESET_SAVED"; payload: UIComponentPreset }
  | { type: "PRESET_DELETED"; payload: string }
  | { type: "SET_PRESET_NAME"; payload: string }
  | { type: "LOAD_PRESET"; payload: UIComponentPreset }

  // Toast
  | { type: "SHOW_TOAST"; payload: string }
  | { type: "HIDE_TOAST" };

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
};
