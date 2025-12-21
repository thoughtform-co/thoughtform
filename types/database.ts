// ═══════════════════════════════════════════════════════════════════
// DATABASE TYPES - Data models for persistence layer
// ═══════════════════════════════════════════════════════════════════

import type { BackgroundConfig, LayoutMode, SpacingConfig, ShadowConfig } from "./ui";
import type { ElementContent } from "./content";

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

// Element Types - Extended for medium feature parity
export type ElementType = "text" | "image" | "video" | "button" | "container" | "divider";

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
  name?: string; // User-friendly name for layer panel

  // Position & Size
  x: number;
  y: number;
  width: number | null;
  height: number | null;

  // Layout
  layoutMode?: LayoutMode; // "absolute" | "flow"
  flowOrder?: number; // Order in flow layout

  // Content
  content: ElementContent;
  zIndex: number;

  // State
  locked?: boolean; // Prevent selection/editing
  hidden?: boolean; // Hide in preview mode

  // Styling (universal)
  opacity?: number; // 0-1
  rotation?: number; // degrees
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  shadow?: ShadowConfig;

  // Container-specific (when type === "container")
  padding?: SpacingConfig;
  gap?: number; // Flex gap for children

  // Timestamps
  createdAt: string;
  updatedAt: string;
}
