// ═══════════════════════════════════════════════════════════════════
// THOUGHTFORM EDITOR TYPES
// ═══════════════════════════════════════════════════════════════════

// Section Types
export type SectionType =
  | "hero"
  | "problem"
  | "quote"
  | "shift"
  | "proof"
  | "tagline"
  | "services"
  | "about"
  | "musings"
  | "cta"
  | "freeform";

// Background Types
export type BackgroundType = "none" | "image" | "video" | "animation";

// All animation presets (2D canvas + 3D Three.js unified)
export type AnimationPreset = 
  // Featured
  | "gateway-cardinal"  // Gateway with Halvorsen flow (default)
  | "gateway"           // Gateway torus with terrain
  // 2D Canvas
  | "torus"             // Rotating geometric ring
  | "attractor"         // Chaotic motion lines
  | "wave"              // Flowing wave patterns
  // 3D Three.js
  | "starfield"         // Rotating star sphere
  | "particles"         // Wave-motion particles
  | "geometric"         // Wireframe torus points
  | "nebula"            // Colorful particle cloud
  | "grid"              // Rolling wave grid
  | "spiral"            // DNA double helix
  | "vortex"            // Swirling tunnel
  | "custom";           // Custom code

export interface BackgroundConfig {
  type: BackgroundType;
  // Image background
  imageUrl?: string;
  imagePosition?: "cover" | "contain" | "center";
  imageOpacity?: number;
  // Video background
  videoUrl?: string;
  videoOpacity?: number;
  videoMuted?: boolean;
  videoLoop?: boolean;
  // Animation background (unified 2D/3D)
  animationPreset?: AnimationPreset;
  animationOpacity?: number;
  // Custom animation code
  customCode?: string;
}

// Element Types
export type ElementType = "text" | "image" | "video";

export interface TextContent {
  html: string;
  fontSize?: number;
  fontFamily?: "mono" | "sans";
  color?: string;
  textAlign?: "left" | "center" | "right";
}

export interface ImageContent {
  src: string;
  alt: string;
  objectFit?: "cover" | "contain" | "fill";
}

export interface VideoContent {
  src: string;
  type: "url" | "youtube" | "vimeo";
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

export type ElementContent = TextContent | ImageContent | VideoContent;

// Database Models
export interface Page {
  id: string;
  slug: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: string;
  pageId: string;
  type: SectionType;
  orderIndex: number;
  config: Record<string, unknown>;
  background: BackgroundConfig | null;
  minHeight: string;
  createdAt: string;
  updatedAt: string;
  // Populated in app
  elements?: Element[];
}

export interface Element {
  id: string;
  sectionId: string;
  type: ElementType;
  x: number;
  y: number;
  width: number | null;
  height: number | null;
  content: ElementContent;
  zIndex: number;
  createdAt: string;
  updatedAt: string;
}

// Editor State Types
export interface EditorState {
  // Data
  page: Page | null;
  sections: Section[];
  
  // UI State
  isEditMode: boolean;
  selectedSectionId: string | null;
  selectedElementId: string | null;
  isDragging: boolean;
  gridSize: number;
  showGrid: boolean;
  
  // Actions
  setPage: (page: Page | null) => void;
  setSections: (sections: Section[]) => void;
  toggleEditMode: () => void;
  setSelectedSection: (id: string | null) => void;
  setSelectedElement: (id: string | null) => void;
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
  removeElement: (id: string) => void;
  moveElement: (id: string, x: number, y: number) => void;
  resizeElement: (id: string, width: number, height: number) => void;
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

export const SECTION_TEMPLATES: SectionTemplate[] = [
  {
    type: "hero",
    label: "Hero",
    description: "Full-screen hero with headline and CTA",
    icon: "◆",
    defaultConfig: {},
    defaultMinHeight: "100vh",
    isTemplate: true,
  },
  {
    type: "problem",
    label: "Problem",
    description: "Two-column manifesto layout",
    icon: "◇",
    defaultConfig: {},
    defaultMinHeight: "auto",
    isTemplate: true,
  },
  {
    type: "quote",
    label: "Quote",
    description: "Centered quote with background",
    icon: "❝",
    defaultConfig: {},
    defaultMinHeight: "auto",
    isTemplate: true,
  },
  {
    type: "shift",
    label: "Shift",
    description: "Three-card feature section",
    icon: "△",
    defaultConfig: {},
    defaultMinHeight: "auto",
    isTemplate: true,
  },
  {
    type: "proof",
    label: "Proof",
    description: "Logo bar / social proof",
    icon: "★",
    defaultConfig: {},
    defaultMinHeight: "auto",
    isTemplate: true,
  },
  {
    type: "tagline",
    label: "Tagline",
    description: "Simple centered tagline",
    icon: "—",
    defaultConfig: {},
    defaultMinHeight: "auto",
    isTemplate: true,
  },
  {
    type: "services",
    label: "Services",
    description: "Service cards grid",
    icon: "▤",
    defaultConfig: {},
    defaultMinHeight: "auto",
    isTemplate: true,
  },
  {
    type: "about",
    label: "About",
    description: "Bio with portrait",
    icon: "○",
    defaultConfig: {},
    defaultMinHeight: "auto",
    isTemplate: true,
  },
  {
    type: "musings",
    label: "Musings",
    description: "Blog posts grid",
    icon: "✎",
    defaultConfig: {},
    defaultMinHeight: "auto",
    isTemplate: true,
  },
  {
    type: "cta",
    label: "CTA",
    description: "Call-to-action section",
    icon: "→",
    defaultConfig: {},
    defaultMinHeight: "auto",
    isTemplate: true,
  },
  {
    type: "freeform",
    label: "Freeform",
    description: "Blank canvas for custom layouts",
    icon: "☐",
    defaultConfig: {},
    defaultMinHeight: "50vh",
    isTemplate: false,
  },
];

// Default element dimensions
export const DEFAULT_ELEMENT_DIMENSIONS: Record<ElementType, { width: number; height: number }> = {
  text: { width: 400, height: 100 },
  image: { width: 300, height: 200 },
  video: { width: 560, height: 315 },
};

// Grid snap options
export const GRID_SIZES = [8, 16, 24, 32] as const;
export type GridSize = typeof GRID_SIZES[number];

