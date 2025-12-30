// ═══════════════════════════════════════════════════════════════
// BRAND SYSTEM CATALOG - Atomic Design System for Thoughtform
//
// Hierarchy:
// ├── Foundations (Design Tokens)
// │   ├── Colors
// │   ├── Typography
// │   └── Spacing
// ├── Atoms (Smallest building blocks)
// │   ├── Corner Brackets
// │   ├── Rails
// │   ├── Surfaces
// │   └── Brand Marks
// ├── Molecules (Combinations of atoms)
// │   ├── Frames
// │   └── Input Groups
// └── Organisms (Complex UI components)
//     ├── Cards
//     ├── Navigation
//     └── Buttons
// ═══════════════════════════════════════════════════════════════

export type PropType = "string" | "number" | "boolean" | "select" | "color" | "corners";

export type ComponentSource = "thoughtform-ui" | "legacy";

export interface PropDef {
  name: string;
  type: PropType;
  default: unknown;
  options?: string[];
  min?: number;
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
  source?: ComponentSource;
  importPath?: string;
  /** Description for the component */
  description?: string;
}

export interface CategoryDef {
  id: string;
  name: string;
  description?: string;
  subcategories?: { id: string; name: string }[];
}

// ═══════════════════════════════════════════════════════════════
// CATEGORIES - Visual Hierarchy (grouped by complexity)
// ═══════════════════════════════════════════════════════════════

// Hierarchy levels for visual grouping (separators between levels)
export const HIERARCHY_BREAKS = ["typography", "brand", "inputs"]; // Add separator after these

export const CATEGORIES: CategoryDef[] = [
  // --- Level 1: Design Tokens ---
  { id: "colors", name: "Colors" },
  { id: "typography", name: "Typography" },
  // --- Level 2: Brand ---
  { id: "brand", name: "Brand Elements" },
  // --- Level 3: Controls ---
  { id: "buttons", name: "Buttons" },
  { id: "inputs", name: "Inputs" },
  // --- Level 4: Navigation & Layout ---
  { id: "navigation", name: "Navigation" },
];

// ═══════════════════════════════════════════════════════════════
// COLORS - Design Tokens
// ═══════════════════════════════════════════════════════════════

const COLOR_COMPONENTS: ComponentDef[] = [
  {
    id: "color-palette",
    name: "Colors",
    category: "colors",
    description: "Primary and secondary brand colors",
    props: [],
    defaultWidth: 400,
    defaultHeight: 200,
  },
  {
    id: "color-palette-opacity",
    name: "Opacity Scale",
    category: "colors",
    description: "Dawn and Gold at 4%, 8%, 15%, 30%, 50%, 70%",
    props: [],
    defaultWidth: 400,
    defaultHeight: 80,
  },
];

// ═══════════════════════════════════════════════════════════════
// TYPOGRAPHY - Design Tokens
// ═══════════════════════════════════════════════════════════════

const TYPOGRAPHY_COMPONENTS: ComponentDef[] = [
  {
    id: "type-display",
    name: "Display (Mondwest)",
    category: "typography",
    description: "Headlines and hero text",
    props: [{ name: "text", type: "string", default: "THOUGHTFORM" }],
    defaultWidth: 400,
    defaultHeight: 80,
  },
  {
    id: "type-body",
    name: "Body (IBM Plex)",
    category: "typography",
    description: "Paragraphs and UI text",
    props: [
      { name: "text", type: "string", default: "The quick brown fox jumps over the lazy dog." },
    ],
    defaultWidth: 400,
    defaultHeight: 60,
  },
  {
    id: "type-data",
    name: "Data (IBM Plex Mono)",
    category: "typography",
    description: "Numbers, labels, and technical content",
    props: [{ name: "text", type: "string", default: "01 · METRIC · 42.5%" }],
    defaultWidth: 400,
    defaultHeight: 40,
  },
  {
    id: "type-scale",
    name: "Type Scale",
    category: "typography",
    description: "Complete type hierarchy from xs to 4xl",
    props: [],
    defaultWidth: 400,
    defaultHeight: 300,
  },
];

// ═══════════════════════════════════════════════════════════════
// BRAND ELEMENTS
// ═══════════════════════════════════════════════════════════════

const BRAND_COMPONENTS: ComponentDef[] = [
  {
    id: "brand-mark",
    name: "Brand Mark",
    category: "brand",
    description: "Thoughtform diamond logo",
    props: [
      { name: "size", type: "number", default: 64, min: 24, max: 128 },
      { name: "color", type: "color", default: "#caa554" },
    ],
    defaultWidth: 80,
    defaultHeight: 80,
  },
  {
    id: "word-mark",
    name: "Word Mark",
    category: "brand",
    description: "THOUGHTFORM logotype",
    props: [
      { name: "height", type: "number", default: 32, min: 16, max: 64 },
      { name: "color", type: "color", default: "#caa554" },
    ],
    defaultWidth: 280,
    defaultHeight: 48,
  },
  {
    id: "vectors",
    name: "Vectors",
    category: "brand",
    description: "Brand vector elements",
    props: [],
    defaultWidth: 400,
    defaultHeight: 200,
  },
];

// ═══════════════════════════════════════════════════════════════
// NAVIGATION - Navigation, Frames, Cards, HUD
// ═══════════════════════════════════════════════════════════════

const NAVIGATION_COMPONENTS: ComponentDef[] = [
  {
    id: "navbar",
    name: "Navigation Bar",
    category: "navigation",
    description: "Top navigation with logo and title",
    props: [
      { name: "showLogo", type: "boolean", default: true },
      { name: "title", type: "string", default: "ASTROGATION" },
      { name: "corners", type: "corners", default: "four" },
      { name: "borderThickness", type: "number", default: 1.5, min: 0.5, max: 4, step: 0.5 },
      { name: "cornerColor", type: "color", default: "#caa554" },
    ],
    defaultWidth: 600,
    defaultHeight: 64,
  },
  {
    id: "frame-basic",
    name: "Frame (Basic)",
    category: "navigation",
    description: "Surface with optional border and corners",
    props: [
      { name: "corners", type: "corners", default: "four" },
      {
        name: "borderStyle",
        type: "select",
        default: "solid",
        options: ["none", "solid", "dashed"],
      },
      { name: "borderColor", type: "color", default: "rgba(235, 227, 214, 0.08)" },
      { name: "borderThickness", type: "number", default: 1.5, min: 0.5, max: 4, step: 0.5 },
      { name: "cornerColor", type: "color", default: "#caa554" },
      { name: "cornerThickness", type: "number", default: 1.5, min: 0.5, max: 4, step: 0.5 },
    ],
    defaultWidth: 300,
    defaultHeight: 180,
  },
  {
    id: "card-content",
    name: "Card (Content)",
    category: "navigation",
    description: "Content card with index, label, and title",
    props: [
      { name: "title", type: "string", default: "Card Title" },
      { name: "index", type: "string", default: "01" },
      { name: "label", type: "string", default: "Label" },
      { name: "accent", type: "select", default: "none", options: ["none", "top", "left"] },
      { name: "accentColor", type: "select", default: "gold", options: ["gold", "dawn", "verde"] },
      { name: "corners", type: "corners", default: "four" },
      { name: "borderThickness", type: "number", default: 1.5, min: 0.5, max: 4, step: 0.5 },
      { name: "cornerColor", type: "color", default: "#caa554" },
    ],
    defaultWidth: 400,
    defaultHeight: 200,
  },
  {
    id: "card-data",
    name: "Card (Data)",
    category: "navigation",
    description: "Compact metric display card",
    props: [
      { name: "value", type: "string", default: "42" },
      { name: "label", type: "string", default: "Metric" },
      { name: "corners", type: "corners", default: "four" },
      { name: "borderThickness", type: "number", default: 1.5, min: 0.5, max: 4, step: 0.5 },
      { name: "cornerColor", type: "color", default: "#caa554" },
    ],
    defaultWidth: 160,
    defaultHeight: 100,
  },
  {
    id: "hud-frame",
    name: "HUD Frame",
    category: "navigation",
    description: "Full viewport HUD with corners and rails",
    props: [
      { name: "showCorners", type: "boolean", default: true },
      { name: "showRails", type: "boolean", default: true },
      { name: "cornerSize", type: "number", default: 40, min: 20, max: 80 },
      { name: "cornerColor", type: "color", default: "#caa554" },
    ],
    defaultWidth: 400,
    defaultHeight: 300,
  },
];

// ═══════════════════════════════════════════════════════════════
// BUTTONS - Components
// ═══════════════════════════════════════════════════════════════

const BUTTON_COMPONENTS: ComponentDef[] = [
  {
    id: "button",
    name: "Button",
    category: "buttons",
    description: "Interactive button with corner brackets",
    props: [
      { name: "label", type: "string", default: "Button" },
      { name: "variant", type: "select", default: "ghost", options: ["ghost", "solid", "outline"] },
      { name: "size", type: "select", default: "md", options: ["sm", "md", "lg"] },
      { name: "corners", type: "corners", default: "four" },
      { name: "cornerColor", type: "color", default: "#caa554" },
      { name: "cornerThickness", type: "number", default: 1.5, min: 0.5, max: 4, step: 0.5 },
    ],
    defaultWidth: 180,
    defaultHeight: 48,
  },
];

// ═══════════════════════════════════════════════════════════════
// INPUTS - Components
// ═══════════════════════════════════════════════════════════════

const INPUT_COMPONENTS: ComponentDef[] = [
  {
    id: "slider",
    name: "Slider",
    category: "inputs",
    description: "Range slider with diamond handle",
    props: [
      { name: "label", type: "string", default: "Value" },
      { name: "value", type: "number", default: 50, min: 0, max: 100 },
    ],
    defaultWidth: 200,
    defaultHeight: 48,
  },
  {
    id: "toggle",
    name: "Toggle",
    category: "inputs",
    description: "On/off toggle switch",
    props: [
      { name: "label", type: "string", default: "Option" },
      { name: "checked", type: "boolean", default: false },
    ],
    defaultWidth: 140,
    defaultHeight: 32,
  },
];

// ═══════════════════════════════════════════════════════════════
// COMBINED COMPONENTS
// ═══════════════════════════════════════════════════════════════

export const COMPONENTS: ComponentDef[] = [
  ...COLOR_COMPONENTS,
  ...TYPOGRAPHY_COMPONENTS,
  ...BRAND_COMPONENTS,
  ...BUTTON_COMPONENTS,
  ...INPUT_COMPONENTS,
  ...NAVIGATION_COMPONENTS,
];

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

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
      (c.subcategory && c.subcategory.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
  );
}

export function getCategoryById(id: string): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.id === id);
}
