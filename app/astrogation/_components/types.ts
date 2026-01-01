// ═══════════════════════════════════════════════════════════════
// ASTROGATION TYPES
// ═══════════════════════════════════════════════════════════════

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
}

export type WorkspaceTab = "vault" | "foundry" | "survey";

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
}

export interface SurveyItem {
  id: string;
  category_id: string | null;
  component_key: string | null;
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
};
