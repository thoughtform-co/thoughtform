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

export type WorkspaceTab = "vault" | "foundry";

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
