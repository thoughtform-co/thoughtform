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

// Element Types - Extended for medium feature parity
export type ElementType = "text" | "image" | "video" | "button" | "container" | "divider";

// ═══════════════════════════════════════════════════════════════════
// ELEMENT CONTENT TYPES
// ═══════════════════════════════════════════════════════════════════

export interface TextContent {
  html: string;
  fontSize?: number;
  fontFamily?: "mono" | "sans";
  fontWeight?: "normal" | "medium" | "semibold" | "bold";
  lineHeight?: number;
  letterSpacing?: number;
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

export interface ButtonContent {
  text: string;
  href: string;
  variant: "ghost" | "solid" | "outline";
  size?: "sm" | "md" | "lg";
}

export interface ContainerContent {
  // Child element IDs (for grouping)
  children: string[];
  // Layout direction for flow children
  direction?: "row" | "column";
  // Alignment
  alignItems?: "start" | "center" | "end" | "stretch";
  justifyContent?: "start" | "center" | "end" | "between" | "around";
  // Spacing
  gap?: number;
  padding?: SpacingConfig;
}

export interface DividerContent {
  orientation: "horizontal" | "vertical";
  thickness?: number;
  color?: string;
  style?: "solid" | "dashed" | "dotted";
}

export type ElementContent = 
  | TextContent 
  | ImageContent 
  | VideoContent 
  | ButtonContent 
  | ContainerContent 
  | DividerContent;

// ═══════════════════════════════════════════════════════════════════
// ELEMENT STYLING TYPES
// ═══════════════════════════════════════════════════════════════════

export interface SpacingConfig {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ShadowConfig {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
}

export type LayoutMode = "absolute" | "flow";

export type AlignmentType = 
  | "left" 
  | "center" 
  | "right" 
  | "top" 
  | "middle" 
  | "bottom";

export type DistributeDirection = "horizontal" | "vertical";

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

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
  name?: string;              // User-friendly name for layer panel
  
  // Position & Size
  x: number;
  y: number;
  width: number | null;
  height: number | null;
  
  // Layout
  layoutMode?: LayoutMode;    // "absolute" | "flow"
  flowOrder?: number;         // Order in flow layout
  
  // Content
  content: ElementContent;
  zIndex: number;
  
  // State
  locked?: boolean;           // Prevent selection/editing
  hidden?: boolean;           // Hide in preview mode
  
  // Styling (universal)
  opacity?: number;           // 0-1
  rotation?: number;          // degrees
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  shadow?: ShadowConfig;
  
  // Container-specific (when type === "container")
  padding?: SpacingConfig;
  gap?: number;               // Flex gap for children
  
  // Timestamps
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
  selectedElementIds: string[];           // Multi-select support
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
  updateElements: (ids: string[], updates: Partial<Element>) => void;  // Batch update
  removeElement: (id: string) => void;
  removeElements: (ids: string[]) => void;  // Batch remove
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
  button: { width: 150, height: 44 },
  container: { width: 400, height: 300 },
  divider: { width: 200, height: 2 },
};

// Default content for new elements
export const DEFAULT_ELEMENT_CONTENT: Record<ElementType, ElementContent> = {
  text: {
    html: "<p>Click to edit text</p>",
    fontSize: 16,
    fontFamily: "sans",
    fontWeight: "normal",
    color: "dawn-70",
    textAlign: "left",
  } as TextContent,
  image: {
    src: "",
    alt: "Image description",
    objectFit: "cover",
  } as ImageContent,
  video: {
    src: "",
    type: "url",
    autoplay: false,
    loop: false,
    muted: true,
  } as VideoContent,
  button: {
    text: "CLICK ME",
    href: "#",
    variant: "solid",
    size: "md",
  } as ButtonContent,
  container: {
    children: [],
    direction: "column",
    alignItems: "start",
    justifyContent: "start",
    gap: 16,
    padding: { top: 16, right: 16, bottom: 16, left: 16 },
  } as ContainerContent,
  divider: {
    orientation: "horizontal",
    thickness: 1,
    color: "dawn-15",
    style: "solid",
  } as DividerContent,
};

// Grid snap options
export const GRID_SIZES = [8, 16, 24, 32] as const;
export type GridSize = typeof GRID_SIZES[number];

// ═══════════════════════════════════════════════════════════════════
// SECTION CONTENT SCHEMAS
// Define editable content for each template section type
// ═══════════════════════════════════════════════════════════════════

export interface ButtonConfig {
  text: string;
  href: string;
  variant: "ghost" | "solid" | "outline";
}

export interface HeroContent {
  // Logo can be text or image
  logoType: "text" | "image";
  logoText?: string;           // e.g., "THOUGHT + FORM"
  logoImageUrl?: string;       // SVG or PNG URL
  logoImageAlt?: string;
  // Headlines
  headline: string;
  subheadline: string;
  // Buttons
  primaryButton: ButtonConfig;
  secondaryButton: ButtonConfig;
  // Layout
  contentAlign: "left" | "center" | "right";
}

export interface QuoteContent {
  quote: string;
  attribution?: string;
}

export interface TaglineContent {
  tagline: string;
  subtext?: string;
}

export interface CTAContent {
  headline: string;
  subheadline?: string;
  primaryButton: ButtonConfig;
  secondaryButton?: ButtonConfig;
}

export interface ProblemContent {
  title: string;
  description: string;
  symptoms: Array<{ icon: string; text: string }>;
}

export interface ShiftContent {
  title: string;
  definition: string;
  cards: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
}

export interface ServicesContent {
  title: string;
  services: Array<{
    title: string;
    description: string;
  }>;
}

export interface AboutContent {
  title: string;
  bio: string;
  imageUrl?: string;
  credentials?: string[];
}

// Union type for all section content
export type SectionContent = 
  | HeroContent
  | QuoteContent
  | TaglineContent
  | CTAContent
  | ProblemContent
  | ShiftContent
  | ServicesContent
  | AboutContent;

// Default content for each section type
export const DEFAULT_SECTION_CONTENT: Record<SectionType, SectionContent | null> = {
  hero: {
    logoType: "text",
    logoText: "THOUGHT + FORM",
    headline: "Thoughtform pioneers intuitive human-AI collaboration.",
    subheadline: "We teach teams how to navigate AI for creative and strategic work.",
    primaryButton: { text: "GUIDE ME", href: "#contact", variant: "solid" },
    secondaryButton: { text: "LEARN MORE", href: "#manifesto", variant: "ghost" },
    contentAlign: "left",
  } as HeroContent,
  quote: {
    quote: "The future belongs to those who understand that doing more with less is compassionate, prosperous, and enduring, and thus more intelligent than the opposite.",
    attribution: "— R. Buckminster Fuller",
  } as QuoteContent,
  tagline: {
    tagline: "CLARITY IN COMPLEXITY",
    subtext: "Navigate the noise. Find your signal.",
  } as TaglineContent,
  cta: {
    headline: "Charting a new course.",
    subheadline: "Ready to navigate AI with intention?",
    primaryButton: { text: "SCHEDULE A CALL", href: "#contact", variant: "solid" },
    secondaryButton: { text: "VIEW SERVICES", href: "#services", variant: "ghost" },
  } as CTAContent,
  problem: {
    title: "You're already behind.",
    description: "While you're reading best practices from last quarter, the landscape has already shifted. The old playbooks don't account for a world where AI can draft, design, and decide in seconds.",
    symptoms: [
      { icon: "⬡", text: "Drowning in AI options" },
      { icon: "⬢", text: "Team resistance" },
      { icon: "⬡", text: "Hallucination anxiety" },
      { icon: "⬢", text: "No clear ROI path" },
    ],
  } as ProblemContent,
  shift: {
    title: "THOUGHTFORM",
    definition: "Architecture of intention. How ideas take shape.",
    cards: [
      { icon: "N", title: "NAVIGATE", description: "Map the AI landscape with clarity" },
      { icon: "E", title: "EVALUATE", description: "Test what works for your context" },
      { icon: "S", title: "SYNTHESIZE", description: "Integrate AI into existing workflows" },
    ],
  } as ShiftContent,
  services: {
    title: "Services",
    services: [
      { title: "AI Navigation Sessions", description: "1:1 strategic guidance for leaders" },
      { title: "Team Workshops", description: "Hands-on training for creative teams" },
      { title: "Workflow Audits", description: "Find AI opportunities in your process" },
      { title: "Implementation Support", description: "Ongoing guidance as you scale" },
    ],
  } as ServicesContent,
  about: {
    title: "About",
    bio: "Strategic consultant bridging human creativity and artificial intelligence. Former creative director now helping organizations navigate the AI landscape with intention.",
    credentials: ["10+ years creative direction", "Fortune 500 AI strategy", "Published author on human-AI collaboration"],
  } as AboutContent,
  proof: null,  // Uses logos, handled differently
  musings: null, // Uses blog posts, handled differently
  freeform: null,
};
