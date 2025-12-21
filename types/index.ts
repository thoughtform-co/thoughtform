// ═══════════════════════════════════════════════════════════════════
// TYPES INDEX - Re-exports all types for convenient importing
// ═══════════════════════════════════════════════════════════════════
// Usage: import { Page, Section, EditorState } from "@/types";

// UI Types
export type {
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
} from "./ui";

// Content Types
export type {
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
} from "./content";

// Database Types
export type { SectionType, ElementType, Page, Section, Element } from "./database";

// Editor Types
export type { EditorState, SectionTemplate } from "./editor";
