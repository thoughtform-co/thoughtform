// ═══════════════════════════════════════════════════════════════
// ASTROGATION TYPES
// ═══════════════════════════════════════════════════════════════

// Re-export vector editor types
export type { VectorDocument } from "./vector-editor/types";

export interface UIComponentPreset {
  id: string;
  name: string;
  component_key: string;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface StyleConfig {
  // Border
  borderStyle: "none" | "solid" | "dashed" | "dotted" | "double";
  borderWidth: number;
  borderColor: string;
  // Fill
  fillType: "none" | "solid" | "gradient";
  fillColor: string;
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number;
  // Custom props
  props: Record<string, unknown>;
  // StyleSpace CSS variable overrides (applied to wrapper element)
  styleVars?: Record<string, string>;
}

export type WorkspaceTab = "vault" | "foundry" | "survey";

// ═══════════════════════════════════════════════════════════════
// SLIDE TEMPLATE TYPES (Arc Editor Format - 16:9, 1920x1080)
// ═══════════════════════════════════════════════════════════════

export const SLIDE_WIDTH = 1920;
export const SLIDE_HEIGHT = 1080;

export interface SlideTextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: "normal" | "bold" | "light";
  fontStyle: "normal" | "italic";
  textDecoration: "none" | "underline" | "strikethrough";
  color: string;
  textAlign: "left" | "center" | "right";
  lineHeight: number;
  letterSpacing: number;
}

export interface SlideBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SlideTextElement {
  id: string;
  type: "text";
  name: string;
  bounds: SlideBounds;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  zIndex: number;
  content: string;
  style: SlideTextStyle;
}

export interface SlideImageElement {
  id: string;
  type: "image";
  name: string;
  bounds: SlideBounds;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  zIndex: number;
  src?: string;
  fit: "fill" | "contain" | "cover" | "none";
  isBackground?: boolean;
}

export interface SlideShapeElement {
  id: string;
  type: "shape";
  name: string;
  bounds: SlideBounds;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  zIndex: number;
  shapeType: "rectangle" | "ellipse" | "line";
  fill: string;
  stroke: string;
  strokeWidth: number;
  borderRadius?: number;
}

export type SlideElement = SlideTextElement | SlideImageElement | SlideShapeElement;

export interface SlideData {
  mode: "standard" | "interactive";
  backgroundColor: string;
  backgroundImage?: {
    src: string;
    fit: "fill" | "contain" | "cover" | "none";
    opacity: number;
  };
  elements: SlideElement[];
  notes: string;
}

export interface SlideTemplate {
  id: string;
  name: string;
  category:
    | "title"
    | "content"
    | "quote"
    | "image"
    | "two-column"
    | "data"
    | "section"
    | "closing"
    | "custom";
  thumbnail?: string;
  slide: SlideData;
  hudConfig?: HUDConfig;
  createdAt: string;
  isBuiltIn: boolean;
}

// ═══════════════════════════════════════════════════════════════
// HUD CONFIG TYPES (Navigation Grid - from Astrolabe Arc Editor)
// ═══════════════════════════════════════════════════════════════

export interface HUDConfig {
  /** Show corner brackets */
  cornerBrackets: boolean;
  /** Corner bracket size in pixels */
  cornerSize: number;
  /** Show left rail */
  leftRail: boolean;
  /** Show right rail */
  rightRail: boolean;
  /** Rail width */
  railWidth: number;
  /** HUD padding from edges */
  hudPadding: number;
  /** Show tick marks on rails */
  tickMarks: boolean;
  /** Number of tick marks */
  tickCount: number;
  /** Show position indicator (diamond) */
  positionIndicator: boolean;
  /** Show coordinate readout */
  coordinateReadout: boolean;
  /** Custom readouts */
  readouts: Array<{
    label: string;
    value: string;
    highlight?: boolean;
    pulse?: boolean;
  }>;
  /** Location label (bottom-left) */
  location?: string;
  /** Status label (top-right) */
  status?: string;
  /** Title (near left rail) */
  title?: string;
  /** Subtitle */
  subtitle?: string;
  /** Rail color (CSS color) */
  railColor: string;
  /** Rail opacity (0-1) */
  railOpacity: number;
  /** Bracket color */
  bracketColor: string;
  /** Animation: breathing effect */
  breathing: boolean;
  /** Animation speed */
  animationSpeed: number;
}

export const DEFAULT_HUD_CONFIG: HUDConfig = {
  cornerBrackets: true,
  cornerSize: 40,
  leftRail: true,
  rightRail: true,
  railWidth: 60,
  hudPadding: 48,
  tickMarks: true,
  tickCount: 20,
  positionIndicator: true,
  coordinateReadout: false,
  readouts: [],
  railColor: "rgba(202, 165, 84, 0.5)",
  railOpacity: 0.5,
  bracketColor: "#CAA554",
  breathing: false,
  animationSpeed: 1,
};

export const EMPTY_HUD_CONFIG: HUDConfig = {
  cornerBrackets: false,
  cornerSize: 40,
  leftRail: false,
  rightRail: false,
  railWidth: 60,
  hudPadding: 48,
  tickMarks: false,
  tickCount: 20,
  positionIndicator: false,
  coordinateReadout: false,
  readouts: [],
  railColor: "rgba(202, 165, 84, 0.5)",
  railOpacity: 0.5,
  bracketColor: "#CAA554",
  breathing: false,
  animationSpeed: 1,
};

// ═══════════════════════════════════════════════════════════════
// FOUNDRY COMPONENT CATEGORIES
// Defines which components support which frame/stroke features
// ═══════════════════════════════════════════════════════════════

// Components that support the notch feature (Panel-style ticket notch)
export const NOTCH_ENABLED_COMPONENTS = [
  "panel",
  "card-landscape",
  "card-data",
  "frame-basic",
] as const;

// Components that should NOT show chamfer/corner options
// (Brand Elements, Colors, Typography)
export const NO_FRAME_CONTROLS_COMPONENTS = [
  // Colors
  "color-palette",
  "color-palette-opacity",
  // Typography
  "type-display",
  "type-body",
  "type-data",
  "type-scale",
  // Brand Elements
  "brand-mark",
  "word-mark",
  "vectors",
] as const;

// Chamfer position options
export type ChamferPosition = "top-right" | "top-left" | "bottom-right" | "bottom-left";

export const CHAMFER_POSITIONS: { value: ChamferPosition; label: string }[] = [
  { value: "top-right", label: "Top Right" },
  { value: "top-left", label: "Top Left" },
  { value: "bottom-right", label: "Bottom Right" },
  { value: "bottom-left", label: "Bottom Left" },
];

// ═══════════════════════════════════════════════════════════════
// FOUNDRY VARIANT - For comparison grid
// ═══════════════════════════════════════════════════════════════

export interface FoundryVariant {
  id: string;
  name: string;
  description: string;
  componentId: string;
  props: Record<string, unknown>;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════
// FOUNDRY CANVAS TYPES - Multi-mockup canvas document
// ═══════════════════════════════════════════════════════════════

/** Viewport state for pan/zoom */
export interface FoundryViewport {
  panX: number;
  panY: number;
  zoom: number;
}

/** Frame position and dimensions for a canvas item */
export interface FoundryItemFrame {
  x: number;
  y: number;
  w: number;
  h: number;
  z: number; // z-index for layering
}

/** A single item on the Foundry canvas */
export interface FoundryCanvasItem {
  id: string;
  name: string;
  componentId: string; // maps to catalog.ts component key
  props: Record<string, unknown>;
  styleVars?: Record<string, string>;
  frame: FoundryItemFrame;
  locked?: boolean;
}

/** The full canvas document (persisted per-user) */
export interface FoundryCanvasDocument {
  version: number;
  viewport: FoundryViewport;
  items: FoundryCanvasItem[];
}

/** Default empty canvas document */
export const EMPTY_FOUNDRY_DOCUMENT: FoundryCanvasDocument = {
  version: 1,
  viewport: { panX: 0, panY: 0, zoom: 1 },
  items: [],
};

/** A saved template (draft, before Vault approval) */
export interface FoundryTemplate {
  id: string;
  user_id?: string;
  name: string;
  component_key: string;
  category_id?: string;
  config: Record<string, unknown>; // props + styleVars + frame preferences
  thumbnail?: string;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════
// SURVEY TYPES
// ═══════════════════════════════════════════════════════════════

export interface SurveyItemSource {
  label: string;
  url?: string;
  note?: string;
}

export interface SurveyAnalysis {
  suggestedCategoryId?: string;
  suggestedComponentKey?: string;
  tags?: string[];
  layout?: {
    columns?: number;
    gutters?: string;
    baselineRhythm?: string;
    notes?: string;
  };
  informationArchitecture?: {
    modules?: string[];
    hierarchy?: string;
    notes?: string;
  };
  interactionPatterns?: {
    hudAffordances?: string[];
    frames?: string[];
    notes?: string;
  };
  transferNotes?: string;
  summary?: string;
  history?: Array<{
    timestamp: string;
    analysis: Omit<SurveyAnalysis, "history">;
  }>;
}

export interface SurveyAnnotation {
  id: string;
  x: number; // Percentage of image width (0-100)
  y: number; // Percentage of image height (0-100)
  width: number; // Percentage of image width (0-100)
  height: number; // Percentage of image height (0-100)
  note: string;
  created_at: string;
  // Crop screenshot (populated after annotation is saved)
  crop_path?: string; // Storage path for cropped image
  crop_url?: string; // Signed URL (injected at fetch time)
  crop_mime?: string;
  crop_width?: number;
  crop_height?: number;
  crop_caption?: string; // AI-generated caption for embeddings
}

export interface SurveySegment {
  id: string;
  survey_item_id: string;
  segment_index: number;
  // Bounding box in pixels
  bbox_x: number;
  bbox_y: number;
  bbox_width: number;
  bbox_height: number;
  // Crop bbox with padding
  crop_x: number;
  crop_y: number;
  crop_width: number;
  crop_height: number;
  // Metrics
  area: number;
  predicted_iou: number;
  stability_score: number;
  // Labels
  label: string | null;
  ai_label: string | null;
  ai_description: string | null;
  // State
  is_visible: boolean;
  is_selected: boolean;
  created_at: string;
  updated_at: string;
}

export interface SurveyCollection {
  id: string;
  name: string;
  description: string | null;
  color: string | null; // Optional accent color for visual distinction
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SurveyItem {
  id: string;
  category_id: string | null;
  component_key: string | null;
  collection_id: string | null; // Link to collection (same brand/website/campaign)
  title: string | null;
  notes: string | null;
  description: string | null; // AI-generated visual analysis
  briefing: string | null; // AI-generated implementation brief
  briefing_updated_at: string | null;
  sources: SurveyItemSource[];
  tags: string[];
  image_path: string;
  image_mime: string | null;
  image_width: number | null;
  image_height: number | null;
  analysis: SurveyAnalysis | null;
  annotations: SurveyAnnotation[] | null;
  embedding_model: string | null;
  embedding_text: string | null;
  briefing_embedding_model: string | null;
  briefing_embedding_text: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  // Client-side additions
  image_url?: string; // Signed URL for display
  has_full_data?: boolean; // Indicates large text fields have been fetched at least once
  has_segments?: boolean;
  segments?: SurveySegment[]; // Loaded on demand
  collection?: SurveyCollection; // Loaded on demand with item
}

// ═══════════════════════════════════════════════════════════════
// SURVEY PROPS BUNDLE - Reduces prop plumbing through components
// ═══════════════════════════════════════════════════════════════

export interface SurveyViewBundledProps {
  items: SurveyItem[];
  selectedItemId: string | null;
  selectedAnnotationId?: string | null;
  loading: boolean;
  searchQuery: string;
  isSearching: boolean;
  onSelectItem: (id: string | null) => void;
  onUpload: (file: File) => Promise<void>;
  onSearchQueryChange: (query: string) => void;
  onSearch: (query: string) => Promise<void>;
  onAnnotationsChange: (annotations: SurveyAnnotation[]) => void;
  onAnnotationSelect?: (annotationId: string | null) => void;
  onResizingChange: (isResizing: boolean) => void;
  // Segmentation
  segments?: SurveySegment[];
  showSegments?: boolean;
  isSegmenting?: boolean;
  onGenerateSegments?: () => void;
  onToggleSegments?: () => void;
  onUpdateSegmentLabel?: (segmentId: string, label: string) => void;
  onDeleteSegment?: (segmentId: string) => Promise<void>;
}

// Primary brand colors for dials - only core colors, no secondary
export const BRAND_COLORS = [
  { name: "Gold", value: "#caa554", variable: "--gold" },
  { name: "Dawn", value: "#ebe3d6", variable: "--dawn" },
  { name: "Void", value: "#0a0908", variable: "--void" },
  { name: "Dawn 50%", value: "rgba(235, 227, 214, 0.5)", variable: "--dawn-50" },
  { name: "Gold 50%", value: "rgba(202, 165, 84, 0.5)", variable: "--gold-50" },
] as const;

// Subtle border colors (low opacity for frames)
export const BORDER_COLORS = [
  { name: "Dawn 8%", value: "rgba(235, 227, 214, 0.08)", variable: "--dawn-08" },
  { name: "Dawn 15%", value: "rgba(235, 227, 214, 0.15)", variable: "--dawn-15" },
  { name: "Dawn 30%", value: "rgba(235, 227, 214, 0.30)", variable: "--dawn-30" },
  { name: "Gold 15%", value: "rgba(202, 165, 84, 0.15)", variable: "--gold-15" },
  { name: "Gold 30%", value: "rgba(202, 165, 84, 0.30)", variable: "--gold-30" },
  { name: "Dawn", value: "#ebe3d6", variable: "--dawn" },
  { name: "Gold", value: "#caa554", variable: "--gold" },
] as const;

// Default style configuration
export const DEFAULT_STYLE: StyleConfig = {
  borderStyle: "none",
  borderWidth: 1,
  borderColor: "#caa554",
  fillType: "none",
  fillColor: "#0a0908",
  gradientFrom: "#caa554",
  gradientTo: "#0a0908",
  gradientAngle: 135,
  props: {},
  styleVars: {},
};
