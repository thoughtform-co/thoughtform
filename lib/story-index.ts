// ═══════════════════════════════════════════════════════════════
// STORY INDEX - Runtime access to Storybook argTypes/args
// Phase 2.2: Canonical schema for Foundry inspector
//
// This module provides runtime access to component schemas without
// requiring the full Storybook runtime. It extracts argTypes and
// default args from component definitions for use in Foundry.
// ═══════════════════════════════════════════════════════════════

/**
 * ArgType definition (Storybook-compatible)
 * Describes a single component prop and its editing UI
 */
export interface ArgType {
  name: string;
  description?: string;
  control:
    | { type: "text" }
    | { type: "number"; min?: number; max?: number; step?: number }
    | { type: "boolean" }
    | { type: "select"; options: string[] }
    | { type: "radio"; options: string[] }
    | { type: "color" }
    | { type: "object" }
    | { type: "array" }
    | { type: "range"; min?: number; max?: number; step?: number }
    | { type: "file" }
    | { type: "date" }
    | false; // No control
  table?: {
    type?: { summary: string };
    defaultValue?: { summary: string };
    category?: string;
  };
  if?: {
    arg?: string;
    eq?: unknown;
    neq?: unknown;
    exists?: boolean;
  };
}

/**
 * Component schema (extracted from Storybook story metadata)
 */
export interface ComponentSchema {
  /** Storybook story ID (e.g., "thoughtform-ui-button") */
  id: string;
  /** Component display name */
  name: string;
  /** Component description */
  description?: string;
  /** Category path (e.g., "Thoughtform/UI") */
  category: string;
  /** ArgTypes defining editable props */
  argTypes: Record<string, ArgType>;
  /** Default args for the component */
  defaultArgs: Record<string, unknown>;
  /** Tags (e.g., ["autodocs"]) */
  tags?: string[];
}

// ═══════════════════════════════════════════════════════════════
// STORY INDEX REGISTRY
// Manually maintained to avoid Storybook runtime dependency
// ═══════════════════════════════════════════════════════════════

const STORY_INDEX: Record<string, ComponentSchema> = {
  // ─────────────────────────────────────────────────────────────
  // UI PRIMITIVES
  // ─────────────────────────────────────────────────────────────
  "thoughtform-ui-button": {
    id: "thoughtform-ui-button",
    name: "Button",
    description: "Interactive button with corner brackets and HUD styling",
    category: "Thoughtform/UI",
    argTypes: {
      children: {
        name: "children",
        description: "Button label text",
        control: { type: "text" },
        table: { type: { summary: "ReactNode" } },
      },
      variant: {
        name: "variant",
        description: "Visual style of the button",
        control: { type: "select", options: ["ghost", "solid", "outline"] },
        table: {
          type: { summary: '"ghost" | "solid" | "outline"' },
          defaultValue: { summary: "ghost" },
        },
      },
      size: {
        name: "size",
        description: "Size of the button",
        control: { type: "select", options: ["sm", "md", "lg"] },
        table: {
          type: { summary: '"sm" | "md" | "lg"' },
          defaultValue: { summary: "md" },
        },
      },
      disabled: {
        name: "disabled",
        description: "Disable the button",
        control: { type: "boolean" },
        table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
      },
      href: {
        name: "href",
        description: "If provided, renders as an anchor tag",
        control: { type: "text" },
        table: { type: { summary: "string" } },
      },
    },
    defaultArgs: {
      children: "Button",
      variant: "ghost",
      size: "md",
      disabled: false,
    },
    tags: ["autodocs"],
  },

  "thoughtform-ui-slider": {
    id: "thoughtform-ui-slider",
    name: "Slider",
    description: "Range slider with diamond handle and HUD styling",
    category: "Thoughtform/UI",
    argTypes: {
      label: {
        name: "label",
        description: "Label displayed above the slider",
        control: { type: "text" },
        table: { type: { summary: "string" } },
      },
      value: {
        name: "value",
        description: "Current value",
        control: { type: "range", min: 0, max: 1, step: 0.01 },
        table: { type: { summary: "number" } },
      },
      min: {
        name: "min",
        description: "Minimum value",
        control: { type: "number" },
        table: { type: { summary: "number" }, defaultValue: { summary: "0" } },
      },
      max: {
        name: "max",
        description: "Maximum value",
        control: { type: "number" },
        table: { type: { summary: "number" }, defaultValue: { summary: "1" } },
      },
      step: {
        name: "step",
        description: "Step increment",
        control: { type: "number" },
        table: { type: { summary: "number" }, defaultValue: { summary: "0.01" } },
      },
      showValue: {
        name: "showValue",
        description: "Show current value next to label",
        control: { type: "boolean" },
        table: { type: { summary: "boolean" }, defaultValue: { summary: "true" } },
      },
      disabled: {
        name: "disabled",
        description: "Disable the slider",
        control: { type: "boolean" },
        table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
      },
    },
    defaultArgs: {
      label: "Value",
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      showValue: true,
      disabled: false,
    },
    tags: ["autodocs"],
  },

  "thoughtform-ui-toggle": {
    id: "thoughtform-ui-toggle",
    name: "Toggle",
    description: "On/off toggle switch with HUD styling",
    category: "Thoughtform/UI",
    argTypes: {
      label: {
        name: "label",
        description: "Label displayed next to the toggle",
        control: { type: "text" },
        table: { type: { summary: "string" } },
      },
      checked: {
        name: "checked",
        description: "Whether the toggle is on or off",
        control: { type: "boolean" },
        table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
      },
      disabled: {
        name: "disabled",
        description: "Disable the toggle",
        control: { type: "boolean" },
        table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
      },
    },
    defaultArgs: {
      label: "Option",
      checked: false,
      disabled: false,
    },
    tags: ["autodocs"],
  },

  "thoughtform-ui-select": {
    id: "thoughtform-ui-select",
    name: "Select",
    description: "Select dropdown with HUD styling",
    category: "Thoughtform/UI",
    argTypes: {
      label: {
        name: "label",
        description: "Label displayed above the select",
        control: { type: "text" },
        table: { type: { summary: "string" } },
      },
      value: {
        name: "value",
        description: "Selected option value",
        control: { type: "text" },
        table: { type: { summary: "string" } },
      },
      options: {
        name: "options",
        description: "Selectable options",
        control: { type: "object" },
        table: { type: { summary: "{ value: string; label: string }[]" } },
      },
      disabled: {
        name: "disabled",
        description: "Disable the select",
        control: { type: "boolean" },
        table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
      },
    },
    defaultArgs: {
      label: "Select option",
      options: [
        { value: "option-1", label: "Option 1" },
        { value: "option-2", label: "Option 2" },
        { value: "option-3", label: "Option 3" },
      ],
      value: "option-1",
      disabled: false,
    },
    tags: ["autodocs"],
  },

  "thoughtform-ui-glitch-text": {
    id: "thoughtform-ui-glitch-text",
    name: "GlitchText",
    description: "Text with a glitch transition effect",
    category: "Thoughtform/UI",
    argTypes: {
      initialText: {
        name: "initialText",
        description: "Text shown at progress 0",
        control: { type: "text" },
        table: { type: { summary: "string" } },
      },
      finalText: {
        name: "finalText",
        description: "Text shown at progress 1",
        control: { type: "text" },
        table: { type: { summary: "string" } },
      },
      progress: {
        name: "progress",
        description: "Transition progress (0 → 1)",
        control: { type: "range", min: 0, max: 1, step: 0.01 },
        table: { type: { summary: "number" }, defaultValue: { summary: "0" } },
      },
    },
    defaultArgs: {
      initialText: "THOUGHT",
      finalText: "THOUGHTFORM",
      progress: 0.35,
    },
    tags: ["autodocs"],
  },

  // ─────────────────────────────────────────────────────────────
  // CARDS
  // ─────────────────────────────────────────────────────────────
  "thoughtform-cards-card-frame": {
    id: "thoughtform-cards-card-frame",
    name: "CardFrame",
    description: "Content card with index, label, title, and optional accent",
    category: "Thoughtform/Cards",
    argTypes: {
      tier: {
        name: "tier",
        description: "Card tier/style variant",
        control: { type: "select", options: ["content", "terminal", "data"] },
        table: {
          type: { summary: '"content" | "terminal" | "data"' },
          defaultValue: { summary: "content" },
        },
      },
      index: {
        name: "index",
        description: "Index number displayed at top (e.g., '01')",
        control: { type: "text" },
        table: { type: { summary: "string | number" } },
      },
      label: {
        name: "label",
        description: "Label displayed next to index",
        control: { type: "text" },
        table: { type: { summary: "string" } },
      },
      title: {
        name: "title",
        description: "Card title",
        control: { type: "text" },
        table: { type: { summary: "string" } },
      },
      children: {
        name: "children",
        description: "Card content",
        control: { type: "text" },
        table: { type: { summary: "ReactNode" } },
      },
      accent: {
        name: "accent",
        description: "Accent bar position",
        control: { type: "select", options: ["none", "top", "left"] },
        table: {
          type: { summary: '"none" | "top" | "left"' },
          defaultValue: { summary: "none" },
        },
      },
      accentColor: {
        name: "accentColor",
        description: "Accent bar color",
        control: { type: "select", options: ["gold", "dawn", "verde"] },
        table: {
          type: { summary: '"gold" | "dawn" | "verde"' },
          defaultValue: { summary: "gold" },
        },
      },
    },
    defaultArgs: {
      tier: "content",
      index: "01",
      label: "Label",
      title: "Card Title",
      children: "Card content goes here.",
      accent: "none",
      accentColor: "gold",
    },
    tags: ["autodocs"],
  },

  // ─────────────────────────────────────────────────────────────
  // HUD COMPONENTS
  // ─────────────────────────────────────────────────────────────
  "thoughtform-hud-navigation-bar": {
    id: "thoughtform-hud-navigation-bar",
    name: "NavigationBar",
    description: "Top navigation bar with wordmark and links",
    category: "Thoughtform/HUD",
    argTypes: {
      links: {
        name: "links",
        description: "Navigation links array",
        control: { type: "object" },
        table: { type: { summary: "NavLink[]" } },
      },
      variant: {
        name: "variant",
        description: "Position behavior",
        control: { type: "select", options: ["fixed", "sticky", "static"] },
        table: {
          type: { summary: '"fixed" | "sticky" | "static"' },
          defaultValue: { summary: "fixed" },
        },
      },
    },
    defaultArgs: {
      links: [
        { href: "#", label: "Interface", active: true },
        { href: "#", label: "Manifesto" },
        { href: "#", label: "Services" },
        { href: "#", label: "About" },
      ],
      variant: "static",
    },
    tags: ["autodocs"],
  },

  "thoughtform-hud-hud-frame": {
    id: "thoughtform-hud-hud-frame",
    name: "HUDFrame",
    description: "Full viewport container with HUD-style corners and optional border",
    category: "Thoughtform/HUD",
    argTypes: {
      showCorners: {
        name: "showCorners",
        description: "Show corner brackets",
        control: { type: "boolean" },
        table: { type: { summary: "boolean" }, defaultValue: { summary: "true" } },
      },
      showBorder: {
        name: "showBorder",
        description: "Show subtle border around the viewport",
        control: { type: "boolean" },
        table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
      },
      children: {
        name: "children",
        description: "Content rendered inside the HUD frame",
        control: { type: "text" },
        table: { type: { summary: "ReactNode" } },
      },
    },
    defaultArgs: {
      showCorners: true,
      showBorder: false,
      children: "HUD content",
    },
    tags: ["autodocs"],
  },
};

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * List all available components in the story index
 */
export function listComponents(): ComponentSchema[] {
  return Object.values(STORY_INDEX);
}

/**
 * Get component schema by story ID
 */
export function getComponentSchema(storyId: string): ComponentSchema | undefined {
  return STORY_INDEX[storyId];
}

/**
 * Get argTypes for a component by story ID
 */
export function getArgTypes(storyId: string): Record<string, ArgType> | undefined {
  const schema = STORY_INDEX[storyId];
  return schema?.argTypes;
}

/**
 * Get default args for a component by story ID
 */
export function getDefaultArgs(storyId: string): Record<string, unknown> | undefined {
  const schema = STORY_INDEX[storyId];
  return schema?.defaultArgs;
}

/**
 * Get all story IDs
 */
export function getStoryIds(): string[] {
  return Object.keys(STORY_INDEX);
}

/**
 * Get components by category
 */
export function getComponentsByCategory(category: string): ComponentSchema[] {
  return Object.values(STORY_INDEX).filter((schema) => schema.category === category);
}

/**
 * Get all categories
 */
export function getCategories(): string[] {
  const categories = new Set<string>();
  Object.values(STORY_INDEX).forEach((schema) => categories.add(schema.category));
  return Array.from(categories).sort();
}

/**
 * Search components by name or description
 */
export function searchComponents(query: string): ComponentSchema[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(STORY_INDEX).filter(
    (schema) =>
      schema.name.toLowerCase().includes(lowerQuery) ||
      schema.description?.toLowerCase().includes(lowerQuery) ||
      schema.category.toLowerCase().includes(lowerQuery)
  );
}

// ═══════════════════════════════════════════════════════════════
// REGISTRY KEY → STORY ID MAPPING
// ═══════════════════════════════════════════════════════════════

const REGISTRY_TO_STORY_MAP: Record<string, string> = {
  button: "thoughtform-ui-button",
  slider: "thoughtform-ui-slider",
  toggle: "thoughtform-ui-toggle",
  select: "thoughtform-ui-select",
  "glitch-text": "thoughtform-ui-glitch-text",
  "card-frame": "thoughtform-cards-card-frame",
  "navigation-bar": "thoughtform-hud-navigation-bar",
  "hud-frame": "thoughtform-hud-hud-frame",
};

/**
 * Get story ID from registry key
 */
export function getStoryIdFromRegistryKey(registryKey: string): string | undefined {
  return REGISTRY_TO_STORY_MAP[registryKey];
}

/**
 * Get argTypes for a component by registry key
 */
export function getArgTypesForRegistryKey(
  registryKey: string
): Record<string, ArgType> | undefined {
  const storyId = getStoryIdFromRegistryKey(registryKey);
  return storyId ? getArgTypes(storyId) : undefined;
}

/**
 * Get default args for a component by registry key
 */
export function getDefaultArgsForRegistryKey(
  registryKey: string
): Record<string, unknown> | undefined {
  const storyId = getStoryIdFromRegistryKey(registryKey);
  return storyId ? getDefaultArgs(storyId) : undefined;
}
