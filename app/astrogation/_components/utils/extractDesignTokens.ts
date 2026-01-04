// ═══════════════════════════════════════════════════════════════
// DESIGN TOKEN EXTRACTION
// Parses Survey analysis into actionable design tokens for component generation
// Inspired by GitHub Next's Mosaic project approach
// ═══════════════════════════════════════════════════════════════

import type { SurveyItem, SurveyAnalysis, SurveyAnnotation } from "../types";

// ─── EXTRACTED TOKEN TYPES ───

export interface ExtractedColors {
  primary: string | null;
  accent: string | null;
  background: string | null;
  text: string | null;
  border: string | null;
  // Mapped to Thoughtform tokens when possible
  tokenMappings: {
    primary?: string; // e.g., "--gold"
    accent?: string; // e.g., "--dawn"
    background?: string; // e.g., "--void"
  };
}

export interface ExtractedTypography {
  family: string | null; // "monospace", "sans-serif", "display"
  weight: string | null; // "light", "regular", "bold"
  style: string | null; // "technical", "editorial", "industrial"
  size: string | null; // "small", "medium", "large"
  letterSpacing: string | null; // "tight", "normal", "wide"
  casing: string | null; // "uppercase", "lowercase", "mixed"
}

export interface ExtractedGeometry {
  borderRadius: string; // "none", "sm", "md", "lg"
  chamferAngle: number | null; // Angle in degrees for chamfered corners
  chamferCorners: string[]; // ["top-right", "bottom-left"]
  borderWidth: string; // "thin", "medium", "thick"
  hasNotch: boolean;
  notchPosition: string | null; // "top-left", "top-right"
}

export interface ExtractedPatterns {
  // Visual patterns detected
  patterns: string[];
  // Confidence scores for each pattern (0-1)
  confidence: Record<string, number>;
}

export interface ExtractedMood {
  primary: string; // "industrial", "organic", "retrofuturist", "minimal", "dense"
  secondary: string[];
  warmth: number; // -1 (cool) to 1 (warm)
  density: number; // -1 (minimal) to 1 (dense)
  animation: number; // -1 (static) to 1 (animated)
}

export interface ExtractedTokens {
  colors: ExtractedColors;
  typography: ExtractedTypography;
  geometry: ExtractedGeometry;
  patterns: ExtractedPatterns;
  mood: ExtractedMood;
  // Raw source data for debugging/refinement
  sourceFields: {
    tags: string[];
    summary: string | null;
    transferNotes: string | null;
    hudAffordances: string[];
    frames: string[];
    annotationNotes: string[];
  };
}

// ─── PATTERN KEYWORDS ───

const PATTERN_KEYWORDS: Record<string, string[]> = {
  cornerBrackets: ["corner bracket", "l-bracket", "corner marks", "corner frame", "bracket"],
  scanlines: ["scanline", "scan line", "crt", "phosphor", "interlace"],
  phosphorGlow: ["glow", "phosphor", "neon", "bloom", "luminous", "emissive"],
  gridOverlay: ["grid", "matrix", "dot pattern", "crosshatch"],
  chamferedCorners: ["chamfer", "cut corner", "angled corner", "beveled"],
  ticketNotch: ["notch", "ticket", "step-down", "tab"],
  dataReadout: ["readout", "display", "stats", "metrics", "data"],
  toolbarIcons: ["toolbar", "icon button", "action bar", "tool strip"],
  panelHeader: ["header", "title bar", "panel title", "label zone"],
  statusIndicator: ["status", "indicator", "light", "beacon"],
};

// ─── COLOR MAPPING ───

const THOUGHTFORM_COLORS: Record<string, { hex: string; variable: string }> = {
  gold: { hex: "#caa554", variable: "--gold" },
  dawn: { hex: "#ebe3d6", variable: "--dawn" },
  void: { hex: "#0a0908", variable: "--void" },
  verde: { hex: "#2b4e40", variable: "--verde" },
  teal: { hex: "#4a9c8c", variable: "--teal" },
  signal: { hex: "#ff6b35", variable: "--signal" },
  ink: { hex: "#1a1a2e", variable: "--ink" },
};

const COLOR_KEYWORDS: Record<string, string[]> = {
  gold: ["gold", "amber", "yellow", "brass", "warm yellow", "ochre"],
  dawn: ["cream", "off-white", "ivory", "warm white", "parchment", "beige"],
  void: ["black", "dark", "deep black", "void", "charcoal"],
  verde: ["green", "terminal green", "matrix green", "forest"],
  teal: ["teal", "cyan", "turquoise", "aqua", "blue-green"],
  signal: ["orange", "warning", "alert", "signal", "coral"],
  ink: ["navy", "deep blue", "midnight", "dark blue"],
};

// ─── MOOD KEYWORDS ───

const MOOD_KEYWORDS: Record<string, string[]> = {
  industrial: ["industrial", "mechanical", "factory", "utilitarian", "functional", "brutalist"],
  organic: ["organic", "natural", "flowing", "soft", "breathing", "alive"],
  retrofuturist: [
    "retro",
    "retrofutur",
    "vintage sci-fi",
    "analog",
    "crt",
    "terminal",
    "70s",
    "80s",
  ],
  minimal: ["minimal", "clean", "simple", "sparse", "whitespace", "empty"],
  dense: ["dense", "complex", "detailed", "rich", "layered", "busy"],
  technical: ["technical", "data", "precision", "instrument", "gauge", "readout"],
  cinematic: ["cinematic", "dramatic", "atmospheric", "moody", "noir"],
};

// ─── EXTRACTION FUNCTIONS ───

function extractColors(
  analysis: SurveyAnalysis | null,
  description: string | null,
  tags: string[]
): ExtractedColors {
  const result: ExtractedColors = {
    primary: null,
    accent: null,
    background: null,
    text: null,
    border: null,
    tokenMappings: {},
  };

  const textToSearch = [
    description || "",
    analysis?.summary || "",
    analysis?.transferNotes || "",
    ...tags,
  ]
    .join(" ")
    .toLowerCase();

  // Find color mappings
  for (const [colorName, keywords] of Object.entries(COLOR_KEYWORDS)) {
    for (const keyword of keywords) {
      if (textToSearch.includes(keyword)) {
        const colorInfo = THOUGHTFORM_COLORS[colorName];
        if (colorInfo) {
          // Assign based on context
          if (
            keyword.includes("background") ||
            keyword.includes("dark") ||
            keyword.includes("void")
          ) {
            result.background = colorInfo.hex;
            result.tokenMappings.background = colorInfo.variable;
          } else if (
            keyword.includes("accent") ||
            keyword.includes("highlight") ||
            colorName === "gold" ||
            colorName === "signal"
          ) {
            result.accent = colorInfo.hex;
            result.tokenMappings.accent = colorInfo.variable;
          } else {
            if (!result.primary) {
              result.primary = colorInfo.hex;
              result.tokenMappings.primary = colorInfo.variable;
            }
          }
        }
        break;
      }
    }
  }

  // Default mappings if not found
  if (!result.background) {
    result.background = THOUGHTFORM_COLORS.void.hex;
    result.tokenMappings.background = THOUGHTFORM_COLORS.void.variable;
  }
  if (!result.accent) {
    result.accent = THOUGHTFORM_COLORS.gold.hex;
    result.tokenMappings.accent = THOUGHTFORM_COLORS.gold.variable;
  }
  if (!result.text) {
    result.text = THOUGHTFORM_COLORS.dawn.hex;
  }
  if (!result.border) {
    result.border = "rgba(202, 165, 84, 0.3)"; // --gold-30
  }

  return result;
}

function extractTypography(
  analysis: SurveyAnalysis | null,
  description: string | null,
  tags: string[]
): ExtractedTypography {
  const result: ExtractedTypography = {
    family: null,
    weight: null,
    style: null,
    size: null,
    letterSpacing: null,
    casing: null,
  };

  const textToSearch = [
    description || "",
    analysis?.summary || "",
    analysis?.transferNotes || "",
    ...tags,
  ]
    .join(" ")
    .toLowerCase();

  // Family detection
  if (
    textToSearch.includes("mono") ||
    textToSearch.includes("terminal") ||
    textToSearch.includes("code") ||
    textToSearch.includes("data")
  ) {
    result.family = "monospace";
  } else if (
    textToSearch.includes("display") ||
    textToSearch.includes("heading") ||
    textToSearch.includes("title")
  ) {
    result.family = "display";
  } else if (textToSearch.includes("sans") || textToSearch.includes("clean")) {
    result.family = "sans-serif";
  }

  // Weight detection
  if (
    textToSearch.includes("bold") ||
    textToSearch.includes("heavy") ||
    textToSearch.includes("strong")
  ) {
    result.weight = "bold";
  } else if (textToSearch.includes("light") || textToSearch.includes("thin")) {
    result.weight = "light";
  } else {
    result.weight = "regular";
  }

  // Style detection
  if (
    textToSearch.includes("technical") ||
    textToSearch.includes("data") ||
    textToSearch.includes("readout")
  ) {
    result.style = "technical";
  } else if (textToSearch.includes("industrial") || textToSearch.includes("military")) {
    result.style = "industrial";
  } else if (textToSearch.includes("editorial") || textToSearch.includes("readable")) {
    result.style = "editorial";
  }

  // Casing detection
  if (
    textToSearch.includes("uppercase") ||
    textToSearch.includes("all caps") ||
    textToSearch.includes("capital")
  ) {
    result.casing = "uppercase";
  } else if (textToSearch.includes("lowercase")) {
    result.casing = "lowercase";
  }

  // Letter spacing
  if (
    textToSearch.includes("spaced") ||
    textToSearch.includes("tracking") ||
    textToSearch.includes("wide")
  ) {
    result.letterSpacing = "wide";
  } else if (textToSearch.includes("tight") || textToSearch.includes("condensed")) {
    result.letterSpacing = "tight";
  }

  return result;
}

function extractGeometry(
  analysis: SurveyAnalysis | null,
  description: string | null,
  tags: string[]
): ExtractedGeometry {
  const result: ExtractedGeometry = {
    borderRadius: "none",
    chamferAngle: null,
    chamferCorners: [],
    borderWidth: "thin",
    hasNotch: false,
    notchPosition: null,
  };

  const textToSearch = [
    description || "",
    analysis?.summary || "",
    analysis?.transferNotes || "",
    ...(analysis?.interactionPatterns?.frames || []),
    ...tags,
  ]
    .join(" ")
    .toLowerCase();

  // Border radius
  if (textToSearch.includes("rounded") || textToSearch.includes("soft corner")) {
    if (textToSearch.includes("very") || textToSearch.includes("pill")) {
      result.borderRadius = "lg";
    } else {
      result.borderRadius = "md";
    }
  } else if (textToSearch.includes("slight") || textToSearch.includes("subtle")) {
    result.borderRadius = "sm";
  }

  // Chamfer detection
  if (
    textToSearch.includes("chamfer") ||
    textToSearch.includes("cut corner") ||
    textToSearch.includes("angled corner")
  ) {
    result.chamferAngle = 45;
    // Try to detect which corners
    if (textToSearch.includes("top-right") || textToSearch.includes("top right")) {
      result.chamferCorners.push("top-right");
    }
    if (textToSearch.includes("top-left") || textToSearch.includes("top left")) {
      result.chamferCorners.push("top-left");
    }
    if (textToSearch.includes("bottom-right") || textToSearch.includes("bottom right")) {
      result.chamferCorners.push("bottom-right");
    }
    if (textToSearch.includes("bottom-left") || textToSearch.includes("bottom left")) {
      result.chamferCorners.push("bottom-left");
    }
    // Default to top-left if not specified
    if (result.chamferCorners.length === 0) {
      result.chamferCorners = ["top-left"];
    }
  }

  // Notch detection
  if (
    textToSearch.includes("notch") ||
    textToSearch.includes("ticket") ||
    textToSearch.includes("step-down") ||
    textToSearch.includes("tab")
  ) {
    result.hasNotch = true;
    if (textToSearch.includes("top-left") || textToSearch.includes("left")) {
      result.notchPosition = "top-left";
    } else {
      result.notchPosition = "top-left"; // Default
    }
  }

  // Border width
  if (textToSearch.includes("thick") || textToSearch.includes("heavy border")) {
    result.borderWidth = "thick";
  } else if (textToSearch.includes("medium") || textToSearch.includes("standard")) {
    result.borderWidth = "medium";
  }

  return result;
}

function extractPatterns(
  analysis: SurveyAnalysis | null,
  description: string | null,
  annotations: SurveyAnnotation[] | null,
  tags: string[]
): ExtractedPatterns {
  const result: ExtractedPatterns = {
    patterns: [],
    confidence: {},
  };

  const textToSearch = [
    description || "",
    analysis?.summary || "",
    analysis?.transferNotes || "",
    ...(analysis?.interactionPatterns?.hudAffordances || []),
    ...(analysis?.interactionPatterns?.frames || []),
    ...(annotations?.map((a) => a.note) || []),
    ...tags,
  ]
    .join(" ")
    .toLowerCase();

  // Check each pattern
  for (const [pattern, keywords] of Object.entries(PATTERN_KEYWORDS)) {
    let matchCount = 0;
    for (const keyword of keywords) {
      if (textToSearch.includes(keyword)) {
        matchCount++;
      }
    }
    if (matchCount > 0) {
      result.patterns.push(pattern);
      // Confidence based on number of keyword matches
      result.confidence[pattern] = Math.min(1, matchCount / 3);
    }
  }

  return result;
}

function extractMood(
  analysis: SurveyAnalysis | null,
  description: string | null,
  tags: string[]
): ExtractedMood {
  const result: ExtractedMood = {
    primary: "industrial", // Default
    secondary: [],
    warmth: 0,
    density: 0,
    animation: 0,
  };

  const textToSearch = [
    description || "",
    analysis?.summary || "",
    analysis?.transferNotes || "",
    ...tags,
  ]
    .join(" ")
    .toLowerCase();

  // Detect moods
  const detectedMoods: { mood: string; count: number }[] = [];
  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
    let matchCount = 0;
    for (const keyword of keywords) {
      if (textToSearch.includes(keyword)) {
        matchCount++;
      }
    }
    if (matchCount > 0) {
      detectedMoods.push({ mood, count: matchCount });
    }
  }

  // Sort by match count
  detectedMoods.sort((a, b) => b.count - a.count);

  if (detectedMoods.length > 0) {
    result.primary = detectedMoods[0].mood;
    result.secondary = detectedMoods.slice(1, 4).map((m) => m.mood);
  }

  // Calculate warmth (-1 to 1)
  const warmKeywords = ["warm", "gold", "amber", "orange", "yellow", "brass"];
  const coolKeywords = ["cool", "teal", "cyan", "blue", "verde", "green"];
  let warmScore = 0;
  let coolScore = 0;
  for (const keyword of warmKeywords) {
    if (textToSearch.includes(keyword)) warmScore++;
  }
  for (const keyword of coolKeywords) {
    if (textToSearch.includes(keyword)) coolScore++;
  }
  if (warmScore + coolScore > 0) {
    result.warmth = (warmScore - coolScore) / (warmScore + coolScore);
  }

  // Calculate density (-1 to 1)
  const minimalKeywords = ["minimal", "clean", "simple", "sparse", "empty"];
  const denseKeywords = ["dense", "complex", "detailed", "rich", "layered", "busy"];
  let minScore = 0;
  let denseScore = 0;
  for (const keyword of minimalKeywords) {
    if (textToSearch.includes(keyword)) minScore++;
  }
  for (const keyword of denseKeywords) {
    if (textToSearch.includes(keyword)) denseScore++;
  }
  if (minScore + denseScore > 0) {
    result.density = (denseScore - minScore) / (minScore + denseScore);
  }

  // Calculate animation (-1 to 1)
  const staticKeywords = ["static", "still", "fixed", "solid"];
  const animatedKeywords = ["animated", "moving", "pulsing", "breathing", "glow", "flicker"];
  let staticScore = 0;
  let animScore = 0;
  for (const keyword of staticKeywords) {
    if (textToSearch.includes(keyword)) staticScore++;
  }
  for (const keyword of animatedKeywords) {
    if (textToSearch.includes(keyword)) animScore++;
  }
  if (staticScore + animScore > 0) {
    result.animation = (animScore - staticScore) / (staticScore + animScore);
  }

  return result;
}

// ─── MAIN EXTRACTION FUNCTION ───

/**
 * Extracts design tokens from a Survey item's analysis, description, and annotations.
 * These tokens can be used to generate or modify components in the Foundry.
 */
export function extractDesignTokens(item: SurveyItem): ExtractedTokens {
  const { analysis, description, tags, annotations } = item;

  return {
    colors: extractColors(analysis, description, tags),
    typography: extractTypography(analysis, description, tags),
    geometry: extractGeometry(analysis, description, tags),
    patterns: extractPatterns(analysis, description, annotations, tags),
    mood: extractMood(analysis, description, tags),
    sourceFields: {
      tags,
      summary: analysis?.summary || null,
      transferNotes: analysis?.transferNotes || null,
      hudAffordances: analysis?.interactionPatterns?.hudAffordances || [],
      frames: analysis?.interactionPatterns?.frames || [],
      annotationNotes: annotations?.map((a) => a.note) || [],
    },
  };
}

/**
 * Generates a natural language description from extracted tokens.
 * Useful for querying the Thoughtform MCP with match_reference.
 */
export function tokensToDescription(tokens: ExtractedTokens): string {
  const parts: string[] = [];

  // Mood
  parts.push(`${tokens.mood.primary} aesthetic`);
  if (tokens.mood.secondary.length > 0) {
    parts.push(`with ${tokens.mood.secondary.slice(0, 2).join(" and ")} influences`);
  }

  // Colors
  if (tokens.colors.tokenMappings.primary) {
    parts.push(`using ${tokens.colors.tokenMappings.primary.replace("--", "")} as primary color`);
  }
  if (tokens.colors.tokenMappings.accent) {
    parts.push(`${tokens.colors.tokenMappings.accent.replace("--", "")} accents`);
  }

  // Patterns
  if (tokens.patterns.patterns.length > 0) {
    const topPatterns = tokens.patterns.patterns.slice(0, 3);
    parts.push(`featuring ${topPatterns.join(", ")}`);
  }

  // Geometry
  if (tokens.geometry.hasNotch) {
    parts.push("with ticket notch panel style");
  }
  if (tokens.geometry.chamferCorners.length > 0) {
    parts.push(`chamfered ${tokens.geometry.chamferCorners.join(" and ")} corners`);
  }

  // Typography
  if (tokens.typography.family) {
    parts.push(`${tokens.typography.family} typography`);
  }
  if (tokens.typography.casing === "uppercase") {
    parts.push("uppercase text");
  }

  return parts.join(", ");
}

/**
 * Maps extracted tokens to component props that can be applied in Foundry.
 */
export function tokensToComponentProps(
  tokens: ExtractedTokens,
  componentId: string
): Record<string, unknown> {
  const props: Record<string, unknown> = {};

  // Apply geometry
  if (tokens.geometry.hasNotch) {
    props.shape = "inspectorTicket";
  } else if (tokens.geometry.chamferCorners.length > 0) {
    props.shape = "cutCornersSm";
  }

  // Apply colors
  if (tokens.colors.border) {
    props.strokeColor = tokens.colors.border;
  }
  if (tokens.colors.background) {
    props.fillColor =
      tokens.colors.background === "#0a0908" ? "rgba(10, 9, 8, 0.4)" : tokens.colors.background;
  }

  // Apply border width
  switch (tokens.geometry.borderWidth) {
    case "thick":
      props.strokeWidth = 2;
      break;
    case "medium":
      props.strokeWidth = 1.5;
      break;
    default:
      props.strokeWidth = 1;
  }

  // Component-specific mappings
  switch (componentId) {
    case "panel":
    case "card-landscape":
    case "card-data":
      if (tokens.geometry.hasNotch) {
        props.shape = "inspectorTicket";
        props.notchWidthPx = 220;
        props.notchHeightPx = 32;
      }
      break;
  }

  return props;
}
