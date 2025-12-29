// ═══════════════════════════════════════════════════════════════
// CATALOG - Component definitions for Astrogation
// ═══════════════════════════════════════════════════════════════

export type PropType = "string" | "number" | "boolean" | "select" | "color";

export interface PropDef {
  name: string;
  type: PropType;
  default: unknown;
  options?: string[]; // For select type
  min?: number; // For number type
  max?: number;
  step?: number;
}

export interface ComponentDef {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  props: PropDef[];
  defaultWidth?: number;
  defaultHeight?: number;
}

export interface CategoryDef {
  id: string;
  name: string;
  icon: string;
  subcategories?: { id: string; name: string }[];
}

// ─── CATEGORIES ───
export const CATEGORIES: CategoryDef[] = [
  {
    id: "brand",
    name: "Brand Elements",
    icon: "◆",
  },
  {
    id: "grids",
    name: "Grids",
    icon: "▦",
    subcategories: [{ id: "huds", name: "HUDs" }],
  },
  {
    id: "navbars",
    name: "Navbars",
    icon: "═",
  },
  {
    id: "frames",
    name: "Frames",
    icon: "▢",
    subcategories: [{ id: "terminals", name: "Terminals" }],
  },
  {
    id: "buttons",
    name: "Buttons",
    icon: "▣",
  },
  {
    id: "inputs",
    name: "Inputs",
    icon: "▤",
  },
  {
    id: "typography",
    name: "Typography",
    icon: "T",
  },
];

// ─── COMPONENT DEFINITIONS ───
export const COMPONENTS: ComponentDef[] = [
  // Brand Elements
  {
    id: "brand-mark",
    name: "Brand Mark",
    category: "brand",
    props: [
      { name: "size", type: "number", default: 48, min: 16, max: 256 },
      { name: "color", type: "color", default: "#caa554" },
    ],
    defaultWidth: 64,
    defaultHeight: 64,
  },
  {
    id: "brand-mark-outline",
    name: "Brand Mark (Outline)",
    category: "brand",
    props: [
      { name: "size", type: "number", default: 48, min: 16, max: 256 },
      { name: "color", type: "color", default: "#caa554" },
    ],
    defaultWidth: 64,
    defaultHeight: 64,
  },
  {
    id: "word-mark",
    name: "Word Mark",
    category: "brand",
    props: [
      { name: "size", type: "number", default: 24, min: 12, max: 96 },
      { name: "color", type: "color", default: "#caa554" },
    ],
    defaultWidth: 200,
    defaultHeight: 40,
  },

  // Grids / HUDs
  {
    id: "hud-frame-complete",
    name: "HUD Frame (Complete)",
    category: "grids",
    subcategory: "huds",
    props: [
      { name: "showCorners", type: "boolean", default: true },
      { name: "showRails", type: "boolean", default: true },
      { name: "showTicks", type: "boolean", default: true },
      { name: "cornerSize", type: "number", default: 40, min: 20, max: 80 },
      { name: "cornerColor", type: "color", default: "#caa554" },
      { name: "width", type: "number", default: 400, min: 200, max: 800 },
      { name: "height", type: "number", default: 300, min: 150, max: 600 },
    ],
    defaultWidth: 400,
    defaultHeight: 300,
  },
  {
    id: "hud-corner",
    name: "HUD Corner",
    category: "grids",
    subcategory: "huds",
    props: [
      {
        name: "position",
        type: "select",
        default: "top-left",
        options: ["top-left", "top-right", "bottom-left", "bottom-right"],
      },
      { name: "size", type: "number", default: 40, min: 16, max: 80 },
      { name: "thickness", type: "number", default: 2, min: 1, max: 4 },
      { name: "color", type: "color", default: "#caa554" },
    ],
    defaultWidth: 48,
    defaultHeight: 48,
  },
  {
    id: "hud-rail",
    name: "HUD Rail",
    category: "grids",
    subcategory: "huds",
    props: [
      {
        name: "orientation",
        type: "select",
        default: "vertical",
        options: ["vertical", "horizontal"],
      },
      { name: "showTicks", type: "boolean", default: true },
      { name: "tickCount", type: "number", default: 11, min: 5, max: 21 },
      { name: "length", type: "number", default: 200, min: 100, max: 400 },
      { name: "color", type: "color", default: "#caa554" },
    ],
    defaultWidth: 60,
    defaultHeight: 200,
  },

  // Navbars
  {
    id: "navigation-bar",
    name: "Navigation Bar",
    category: "navbars",
    props: [
      {
        name: "variant",
        type: "select",
        default: "static",
        options: ["fixed", "sticky", "static"],
      },
      { name: "showLogo", type: "boolean", default: true },
      { name: "showBorder", type: "boolean", default: true },
      { name: "borderColor", type: "color", default: "rgba(235, 227, 214, 0.08)" },
      { name: "backgroundColor", type: "color", default: "#0a0908" },
    ],
    defaultWidth: 400,
    defaultHeight: 64,
  },

  // Frames
  {
    id: "card-frame-content",
    name: "Card Frame (Content)",
    category: "frames",
    props: [
      { name: "title", type: "string", default: "Card Title" },
      { name: "index", type: "string", default: "01" },
      { name: "label", type: "string", default: "Label" },
      { name: "accent", type: "select", default: "none", options: ["none", "top", "left"] },
      { name: "accentColor", type: "select", default: "gold", options: ["gold", "dawn", "verde"] },
      {
        name: "borderStyle",
        type: "select",
        default: "solid",
        options: ["none", "solid", "dashed", "dotted"],
      },
      { name: "borderColor", type: "color", default: "rgba(235, 227, 214, 0.08)" },
    ],
    defaultWidth: 280,
    defaultHeight: 180,
  },
  {
    id: "card-frame-terminal",
    name: "Card Frame (Terminal)",
    category: "frames",
    subcategory: "terminals",
    props: [
      { name: "title", type: "string", default: "Terminal Title" },
      { name: "label", type: "string", default: "Terminal" },
      { name: "cornerColor", type: "color", default: "#caa554" },
      { name: "cornerSize", type: "number", default: 16, min: 8, max: 32 },
      {
        name: "borderStyle",
        type: "select",
        default: "solid",
        options: ["none", "solid", "dashed", "dotted"],
      },
      { name: "borderColor", type: "color", default: "rgba(235, 227, 214, 0.15)" },
    ],
    defaultWidth: 320,
    defaultHeight: 220,
  },
  {
    id: "card-frame-data",
    name: "Card Frame (Data)",
    category: "frames",
    props: [
      { name: "title", type: "string", default: "42" },
      { name: "label", type: "string", default: "Metric" },
      {
        name: "borderStyle",
        type: "select",
        default: "solid",
        options: ["none", "solid", "dashed", "dotted"],
      },
      { name: "borderColor", type: "color", default: "rgba(235, 227, 214, 0.08)" },
    ],
    defaultWidth: 160,
    defaultHeight: 100,
  },

  // Buttons
  {
    id: "button",
    name: "Button",
    category: "buttons",
    props: [
      { name: "label", type: "string", default: "Button" },
      { name: "variant", type: "select", default: "ghost", options: ["ghost", "solid", "outline"] },
      { name: "size", type: "select", default: "md", options: ["sm", "md", "lg"] },
    ],
    defaultWidth: 120,
    defaultHeight: 44,
  },

  // Inputs
  {
    id: "slider",
    name: "Slider",
    category: "inputs",
    props: [
      { name: "label", type: "string", default: "Value" },
      { name: "value", type: "number", default: 50, min: 0, max: 100 },
      { name: "min", type: "number", default: 0 },
      { name: "max", type: "number", default: 100 },
      { name: "step", type: "number", default: 1 },
    ],
    defaultWidth: 200,
    defaultHeight: 48,
  },
  {
    id: "toggle",
    name: "Toggle",
    category: "inputs",
    props: [
      { name: "label", type: "string", default: "Option" },
      { name: "checked", type: "boolean", default: false },
    ],
    defaultWidth: 140,
    defaultHeight: 32,
  },
  {
    id: "select",
    name: "Select",
    category: "inputs",
    props: [
      { name: "label", type: "string", default: "Select" },
      { name: "placeholder", type: "string", default: "Choose option..." },
    ],
    defaultWidth: 180,
    defaultHeight: 48,
  },

  // Typography
  {
    id: "glitch-text",
    name: "Glitch Text",
    category: "typography",
    props: [
      { name: "text", type: "string", default: "THOUGHTFORM" },
      { name: "intensity", type: "number", default: 0.5, min: 0, max: 1, step: 0.1 },
    ],
    defaultWidth: 200,
    defaultHeight: 40,
  },
];

// ─── HELPERS ───
export function getComponentsByCategory(
  categoryId: string,
  subcategoryId?: string
): ComponentDef[] {
  return COMPONENTS.filter((c) => {
    if (c.category !== categoryId) return false;
    if (subcategoryId && c.subcategory !== subcategoryId) return false;
    if (!subcategoryId && c.subcategory) return false;
    return true;
  });
}

export function getComponentById(id: string): ComponentDef | undefined {
  return COMPONENTS.find((c) => c.id === id);
}

export function searchComponents(query: string): ComponentDef[] {
  const q = query.toLowerCase();
  return COMPONENTS.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      (c.subcategory && c.subcategory.toLowerCase().includes(q))
  );
}
