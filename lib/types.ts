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

// ═══════════════════════════════════════════════════════════════════
// SECTION CONTENT SCHEMAS
// Define editable content for each template section type
// ═══════════════════════════════════════════════════════════════════

export interface ButtonConfig {
  text: string;
  href: string;
  variant: "ghost" | "solid";
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
