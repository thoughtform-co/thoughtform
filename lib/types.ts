// ═══════════════════════════════════════════════════════════════════
// TYPES RE-EXPORT - Backwards compatibility layer
// ═══════════════════════════════════════════════════════════════════
// This file re-exports from @/types and @/constants for backwards compatibility.
// For new code, import directly from "@/types" or "@/constants" instead.

// Re-export all types
export type {
  // UI Types
  SpacingConfig,
  ShadowConfig,
  Bounds,
  LayoutMode,
  AlignmentType,
  DistributeDirection,
  BackgroundType,
  AnimationPreset,
  BackgroundConfig,
  GridSize,
  // Content Types
  TextContent,
  ImageContent,
  VideoContent,
  ButtonContent,
  ContainerContent,
  DividerContent,
  ElementContent,
  ButtonConfig,
  HeroContent,
  QuoteContent,
  TaglineContent,
  CTAContent,
  ProblemContent,
  ShiftContent,
  ServicesContent,
  AboutContent,
  SectionContent,
  // Database Types
  SectionType,
  ElementType,
  Page,
  Section,
  Element,
  // Editor Types
  EditorState,
  SectionTemplate,
} from "@/types";
