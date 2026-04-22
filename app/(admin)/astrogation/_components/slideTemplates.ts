// ═══════════════════════════════════════════════════════════════
// SLIDE TEMPLATES - Arc Editor Format (16:9 aspect ratio, 1920x1080)
// Based on Astrolabe Arc Editor templates
// Single source of truth for Thoughtform brand slide templates
// ═══════════════════════════════════════════════════════════════

import type { SlideTemplate, HUDConfig } from "./types";

// Default HUD configuration for Thoughtform slides
// Matches the production NavigationGrid HUD from Astrolabe
export const THOUGHTFORM_HUD_CONFIG: HUDConfig = {
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

export const BUILT_IN_SLIDE_TEMPLATES: SlideTemplate[] = [
  {
    id: "builtin-main",
    name: "Main Slide",
    category: "custom",
    isBuiltIn: true,
    createdAt: "2024-01-01T00:00:00Z",
    hudConfig: THOUGHTFORM_HUD_CONFIG,
    slide: {
      mode: "standard",
      backgroundColor: "#070604",
      elements: [],
      notes: "",
    },
  },
];

// Template categories for filtering
export type SlideTemplateCategory = SlideTemplate["category"];

export const SLIDE_TEMPLATE_CATEGORIES: { id: SlideTemplateCategory; name: string }[] = [
  { id: "custom", name: "Custom" },
];

// Helper to get templates by category
export function getSlideTemplatesByCategory(category?: SlideTemplateCategory): SlideTemplate[] {
  if (!category) return BUILT_IN_SLIDE_TEMPLATES;
  return BUILT_IN_SLIDE_TEMPLATES.filter((t) => t.category === category);
}

// Helper to get a template by ID
export function getSlideTemplateById(id: string): SlideTemplate | undefined {
  return BUILT_IN_SLIDE_TEMPLATES.find((t) => t.id === id);
}
