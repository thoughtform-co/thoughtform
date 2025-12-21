// ═══════════════════════════════════════════════════════════════════
// CONTENT TYPES - Section and element content schemas
// ═══════════════════════════════════════════════════════════════════

import type { SpacingConfig } from "./ui";

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
  logoText?: string; // e.g., "THOUGHT + FORM"
  logoImageUrl?: string; // SVG or PNG URL
  logoImageAlt?: string;
  // Headlines
  headline: string;
  subheadline: string;
  // Buttons
  primaryButton: ButtonConfig;
  secondaryButton: ButtonConfig;
  // Layout
  contentAlign: "left" | "center" | "right";
  // Visibility toggles (hide template content to use custom elements)
  showLogo?: boolean;
  showHeadline?: boolean;
  showSubheadline?: boolean;
  showButtons?: boolean;
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
