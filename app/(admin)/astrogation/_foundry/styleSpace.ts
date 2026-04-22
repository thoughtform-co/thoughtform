// ═══════════════════════════════════════════════════════════════
// STYLESPACE ENGINE
// Mosaic-inspired: interpretable style vectors for mixing/interpolation
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export interface StyleParams {
  motifs: {
    brackets: "none" | "corners" | "full" | "targeting";
    reticles: "none" | "subtle" | "prominent";
    tick_marks: "none" | "sparse" | "dense";
    grids: "none" | "subtle" | "visible" | "prominent";
    scanlines: "none" | "subtle" | "visible";
    label_styles: "minimal" | "technical" | "ornate";
  };
  geometry: {
    sharpness: number;
    chamfer_prevalence: number;
    corner_language: "squared" | "chamfered" | "notched" | "bracketed";
    line_weight: "hairline" | "light" | "medium" | "heavy";
  };
  composition: {
    density: number;
    spacing_rhythm: "tight" | "balanced" | "loose";
    layering_depth: number;
    panel_hierarchy: "flat" | "subtle" | "pronounced";
  };
  texture: {
    noise: number;
    scanlines: number;
    glow: number;
    grain: number;
  };
  color_roles: {
    background: "dark" | "mid" | "light";
    surface: "dark" | "mid" | "light";
    border: "subtle" | "accent" | "prominent";
    accent: "warm" | "cool" | "neutral";
    text: "high-contrast" | "medium" | "low-contrast";
  };
  typography_roles: {
    display: "technical" | "elegant" | "bold" | "minimal";
    body: "readable" | "compact" | "spacious";
    mono: "prominent" | "subtle" | "none";
  };
  brand_projection: {
    background: string;
    surface: string;
    border: string;
    accent: string;
    text: string;
  };
}

export interface StyleSignature {
  id: string;
  survey_item_id: string;
  style_params: StyleParams;
  style_vector?: number[];
  similarity?: number;
}

export interface StyleVariant {
  id: string;
  name: string;
  description: string;
  styleParams: StyleParams;
  styleVars: Record<string, string>;
}

// Motif primitive for shape transfer
export interface MotifPrimitive {
  id: string;
  segmentId: string;
  label: string;
  description?: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  svgPath?: string;
  motifType: "bracket" | "reticle" | "grid" | "icon" | "panel" | "label" | "ornament" | "unknown";
  aspectRatio: number;
  areaFraction: number;
}

// ═══════════════════════════════════════════════════════════════
// ENUM MAPPINGS (for vectorization)
// ═══════════════════════════════════════════════════════════════

const MOTIF_BRACKETS: Record<string, number> = { none: 0, corners: 0.33, full: 0.67, targeting: 1 };
const MOTIF_RETICLES: Record<string, number> = { none: 0, subtle: 0.5, prominent: 1 };
const MOTIF_TICKS: Record<string, number> = { none: 0, sparse: 0.5, dense: 1 };
const MOTIF_GRIDS: Record<string, number> = { none: 0, subtle: 0.33, visible: 0.67, prominent: 1 };
const MOTIF_SCANLINES: Record<string, number> = { none: 0, subtle: 0.5, visible: 1 };
const MOTIF_LABELS: Record<string, number> = { minimal: 0, technical: 0.5, ornate: 1 };

const GEOM_CORNER: Record<string, number> = {
  squared: 0,
  chamfered: 0.33,
  notched: 0.67,
  bracketed: 1,
};
const GEOM_WEIGHT: Record<string, number> = { hairline: 0, light: 0.33, medium: 0.67, heavy: 1 };

const COMP_RHYTHM: Record<string, number> = { tight: 0, balanced: 0.5, loose: 1 };
const COMP_HIERARCHY: Record<string, number> = { flat: 0, subtle: 0.5, pronounced: 1 };

const COLOR_BG: Record<string, number> = { dark: 0, mid: 0.5, light: 1 };
const COLOR_SURFACE: Record<string, number> = { dark: 0, mid: 0.5, light: 1 };
const COLOR_BORDER: Record<string, number> = { subtle: 0, accent: 0.5, prominent: 1 };
const COLOR_ACCENT: Record<string, number> = { warm: 0, cool: 0.5, neutral: 1 };
const COLOR_TEXT: Record<string, number> = { "high-contrast": 1, medium: 0.5, "low-contrast": 0 };

const TYPO_DISPLAY: Record<string, number> = {
  minimal: 0,
  technical: 0.33,
  elegant: 0.67,
  bold: 1,
};
const TYPO_BODY: Record<string, number> = { compact: 0, readable: 0.5, spacious: 1 };
const TYPO_MONO: Record<string, number> = { none: 0, subtle: 0.5, prominent: 1 };

// ═══════════════════════════════════════════════════════════════
// VECTORIZATION
// Convert StyleParams to a 64-dimensional numeric vector
// ═══════════════════════════════════════════════════════════════

/**
 * Convert StyleParams to a 64-dimensional interpretable vector.
 * Each dimension corresponds to a specific style attribute.
 *
 * Dimensions 0-5:   motifs (brackets, reticles, ticks, grids, scanlines, labels)
 * Dimensions 6-9:   geometry (sharpness, chamfer, corner_language, line_weight)
 * Dimensions 10-13: composition (density, rhythm, depth, hierarchy)
 * Dimensions 14-17: texture (noise, scanlines, glow, grain)
 * Dimensions 18-22: color_roles (bg, surface, border, accent, text)
 * Dimensions 23-25: typography (display, body, mono)
 * Dimensions 26-63: reserved for future expansion (filled with 0.5)
 */
export function styleParamsToVector(params: StyleParams): number[] {
  const vector: number[] = new Array(64).fill(0.5); // Default to middle values

  // Motifs (0-5)
  vector[0] = MOTIF_BRACKETS[params.motifs.brackets] ?? 0;
  vector[1] = MOTIF_RETICLES[params.motifs.reticles] ?? 0;
  vector[2] = MOTIF_TICKS[params.motifs.tick_marks] ?? 0;
  vector[3] = MOTIF_GRIDS[params.motifs.grids] ?? 0;
  vector[4] = MOTIF_SCANLINES[params.motifs.scanlines] ?? 0;
  vector[5] = MOTIF_LABELS[params.motifs.label_styles] ?? 0;

  // Geometry (6-9)
  vector[6] = clamp(params.geometry.sharpness);
  vector[7] = clamp(params.geometry.chamfer_prevalence);
  vector[8] = GEOM_CORNER[params.geometry.corner_language] ?? 0;
  vector[9] = GEOM_WEIGHT[params.geometry.line_weight] ?? 0.5;

  // Composition (10-13)
  vector[10] = clamp(params.composition.density);
  vector[11] = COMP_RHYTHM[params.composition.spacing_rhythm] ?? 0.5;
  vector[12] = clamp(params.composition.layering_depth);
  vector[13] = COMP_HIERARCHY[params.composition.panel_hierarchy] ?? 0.5;

  // Texture (14-17)
  vector[14] = clamp(params.texture.noise);
  vector[15] = clamp(params.texture.scanlines);
  vector[16] = clamp(params.texture.glow);
  vector[17] = clamp(params.texture.grain);

  // Color roles (18-22)
  vector[18] = COLOR_BG[params.color_roles.background] ?? 0;
  vector[19] = COLOR_SURFACE[params.color_roles.surface] ?? 0;
  vector[20] = COLOR_BORDER[params.color_roles.border] ?? 0.5;
  vector[21] = COLOR_ACCENT[params.color_roles.accent] ?? 0;
  vector[22] = COLOR_TEXT[params.color_roles.text] ?? 1;

  // Typography (23-25)
  vector[23] = TYPO_DISPLAY[params.typography_roles.display] ?? 0.5;
  vector[24] = TYPO_BODY[params.typography_roles.body] ?? 0.5;
  vector[25] = TYPO_MONO[params.typography_roles.mono] ?? 0.5;

  return vector;
}

// ═══════════════════════════════════════════════════════════════
// MIXING & INTERPOLATION
// ═══════════════════════════════════════════════════════════════

/**
 * Mix multiple style vectors with weights.
 * Returns a weighted average of the input vectors.
 */
export function mixStyleVectors(signatures: Array<{ vector: number[]; weight: number }>): number[] {
  if (signatures.length === 0) {
    return new Array(64).fill(0.5);
  }

  const totalWeight = signatures.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight === 0) {
    return signatures[0].vector;
  }

  const result = new Array(64).fill(0);
  for (const { vector, weight } of signatures) {
    const normalizedWeight = weight / totalWeight;
    for (let i = 0; i < 64; i++) {
      result[i] += (vector[i] ?? 0.5) * normalizedWeight;
    }
  }

  return result;
}

/**
 * Interpolate between two style vectors.
 * t=0 returns vecA, t=1 returns vecB.
 */
export function lerpStyleVectors(vecA: number[], vecB: number[], t: number): number[] {
  const clamped = clamp(t);
  return vecA.map((a, i) => a * (1 - clamped) + (vecB[i] ?? 0.5) * clamped);
}

// ═══════════════════════════════════════════════════════════════
// VARIANT SAMPLING
// Generate coherent variations without LLM calls
// ═══════════════════════════════════════════════════════════════

/**
 * Sample N variants from a style point by perturbing key dimensions.
 * Uses seeded random for reproducibility.
 */
export function sampleVariants(
  baseVector: number[],
  count: number = 4,
  seed: number = Date.now()
): number[][] {
  const variants: number[][] = [];
  const rng = seededRandom(seed);

  // Define which dimensions to vary and by how much
  const variableDimensions = [
    { index: 0, range: 0.3, name: "brackets" },
    { index: 6, range: 0.2, name: "sharpness" },
    { index: 7, range: 0.2, name: "chamfer" },
    { index: 9, range: 0.3, name: "line_weight" },
    { index: 10, range: 0.25, name: "density" },
    { index: 12, range: 0.2, name: "layering" },
    { index: 14, range: 0.15, name: "noise" },
    { index: 15, range: 0.2, name: "scanlines" },
    { index: 16, range: 0.15, name: "glow" },
  ];

  for (let v = 0; v < count; v++) {
    const variant = [...baseVector];

    // Perturb variable dimensions
    for (const dim of variableDimensions) {
      const delta = (rng() - 0.5) * 2 * dim.range;
      variant[dim.index] = clamp((variant[dim.index] ?? 0.5) + delta);
    }

    variants.push(variant);
  }

  return variants;
}

/**
 * Convert a style vector back to StyleParams.
 * Inverse of styleParamsToVector.
 */
export function vectorToStyleParams(vector: number[]): StyleParams {
  return {
    motifs: {
      brackets: nearestEnum(vector[0], MOTIF_BRACKETS) as StyleParams["motifs"]["brackets"],
      reticles: nearestEnum(vector[1], MOTIF_RETICLES) as StyleParams["motifs"]["reticles"],
      tick_marks: nearestEnum(vector[2], MOTIF_TICKS) as StyleParams["motifs"]["tick_marks"],
      grids: nearestEnum(vector[3], MOTIF_GRIDS) as StyleParams["motifs"]["grids"],
      scanlines: nearestEnum(vector[4], MOTIF_SCANLINES) as StyleParams["motifs"]["scanlines"],
      label_styles: nearestEnum(vector[5], MOTIF_LABELS) as StyleParams["motifs"]["label_styles"],
    },
    geometry: {
      sharpness: clamp(vector[6] ?? 0.5),
      chamfer_prevalence: clamp(vector[7] ?? 0.5),
      corner_language: nearestEnum(
        vector[8],
        GEOM_CORNER
      ) as StyleParams["geometry"]["corner_language"],
      line_weight: nearestEnum(vector[9], GEOM_WEIGHT) as StyleParams["geometry"]["line_weight"],
    },
    composition: {
      density: clamp(vector[10] ?? 0.5),
      spacing_rhythm: nearestEnum(
        vector[11],
        COMP_RHYTHM
      ) as StyleParams["composition"]["spacing_rhythm"],
      layering_depth: clamp(vector[12] ?? 0.5),
      panel_hierarchy: nearestEnum(
        vector[13],
        COMP_HIERARCHY
      ) as StyleParams["composition"]["panel_hierarchy"],
    },
    texture: {
      noise: clamp(vector[14] ?? 0),
      scanlines: clamp(vector[15] ?? 0),
      glow: clamp(vector[16] ?? 0),
      grain: clamp(vector[17] ?? 0),
    },
    color_roles: {
      background: nearestEnum(vector[18], COLOR_BG) as StyleParams["color_roles"]["background"],
      surface: nearestEnum(vector[19], COLOR_SURFACE) as StyleParams["color_roles"]["surface"],
      border: nearestEnum(vector[20], COLOR_BORDER) as StyleParams["color_roles"]["border"],
      accent: nearestEnum(vector[21], COLOR_ACCENT) as StyleParams["color_roles"]["accent"],
      text: nearestEnum(vector[22], COLOR_TEXT) as StyleParams["color_roles"]["text"],
    },
    typography_roles: {
      display: nearestEnum(vector[23], TYPO_DISPLAY) as StyleParams["typography_roles"]["display"],
      body: nearestEnum(vector[24], TYPO_BODY) as StyleParams["typography_roles"]["body"],
      mono: nearestEnum(vector[25], TYPO_MONO) as StyleParams["typography_roles"]["mono"],
    },
    brand_projection: projectToBrandTokens({
      background: nearestEnum(vector[18], COLOR_BG) as StyleParams["color_roles"]["background"],
      surface: nearestEnum(vector[19], COLOR_SURFACE) as StyleParams["color_roles"]["surface"],
      border: nearestEnum(vector[20], COLOR_BORDER) as StyleParams["color_roles"]["border"],
      accent: nearestEnum(vector[21], COLOR_ACCENT) as StyleParams["color_roles"]["accent"],
      text: nearestEnum(vector[22], COLOR_TEXT) as StyleParams["color_roles"]["text"],
    }),
  };
}

// ═══════════════════════════════════════════════════════════════
// STYLE VARS GENERATION
// Convert StyleParams to CSS variable overrides
// ═══════════════════════════════════════════════════════════════

/**
 * Generate CSS variable overrides from StyleParams.
 * These can be applied to a component wrapper for ambient styling.
 */
export function styleParamsToVars(params: StyleParams): Record<string, string> {
  const vars: Record<string, string> = {};

  // Brand projection tokens
  vars["--style-background"] = params.brand_projection.background;
  vars["--style-surface"] = params.brand_projection.surface;
  vars["--style-border"] = params.brand_projection.border;
  vars["--style-accent"] = params.brand_projection.accent;
  vars["--style-text"] = params.brand_projection.text;

  // Texture effects (as opacity values)
  vars["--style-noise-opacity"] = String(params.texture.noise * 0.1);
  vars["--style-scanline-opacity"] = String(params.texture.scanlines * 0.15);
  vars["--style-glow-opacity"] = String(params.texture.glow * 0.3);
  vars["--style-grain-opacity"] = String(params.texture.grain * 0.08);

  // Geometry
  vars["--style-border-width"] = lineWeightToPx(params.geometry.line_weight);
  vars["--style-chamfer"] = `${Math.round(params.geometry.chamfer_prevalence * 12)}px`;

  // Composition
  vars["--style-density"] = String(params.composition.density);
  vars["--style-layer-depth"] = String(params.composition.layering_depth);

  return vars;
}

function lineWeightToPx(weight: string): string {
  const map: Record<string, string> = {
    hairline: "0.5px",
    light: "1px",
    medium: "1.5px",
    heavy: "2px",
  };
  return map[weight] || "1px";
}

// ═══════════════════════════════════════════════════════════════
// VARIANT NAME GENERATION
// Create descriptive names for generated variants
// ═══════════════════════════════════════════════════════════════

const VARIANT_PREFIXES = [
  "Horizon",
  "Sector",
  "Vector",
  "Signal",
  "Beacon",
  "Terminus",
  "Meridian",
  "Zenith",
  "Apex",
  "Node",
];

const VARIANT_SUFFIXES = [
  "Scan",
  "Grid",
  "Frame",
  "Panel",
  "Array",
  "Matrix",
  "Field",
  "Zone",
  "Core",
  "Shell",
];

export function generateVariantName(index: number, seed: number): string {
  const rng = seededRandom(seed + index * 1000);
  const prefix = VARIANT_PREFIXES[Math.floor(rng() * VARIANT_PREFIXES.length)];
  const suffix = VARIANT_SUFFIXES[Math.floor(rng() * VARIANT_SUFFIXES.length)];
  return `${prefix} ${suffix}`;
}

export function describeVariant(params: StyleParams): string {
  const parts: string[] = [];

  // Describe key characteristics
  if (params.motifs.brackets !== "none") {
    parts.push(`${params.motifs.brackets} brackets`);
  }
  if (params.geometry.sharpness > 0.7) {
    parts.push("sharp edges");
  }
  if (params.texture.scanlines > 0.3) {
    parts.push("scanline texture");
  }
  if (params.texture.glow > 0.3) {
    parts.push("subtle glow");
  }
  if (params.composition.density > 0.6) {
    parts.push("dense layout");
  } else if (params.composition.density < 0.4) {
    parts.push("spacious layout");
  }

  return parts.length > 0 ? parts.join(", ") : "balanced aesthetic";
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function clamp(value: number, min: number = 0, max: number = 1): number {
  return Math.max(min, Math.min(max, value ?? 0.5));
}

function nearestEnum(value: number, mapping: Record<string, number>): string {
  let nearest = Object.keys(mapping)[0];
  let minDist = Infinity;

  for (const [key, val] of Object.entries(mapping)) {
    const dist = Math.abs((value ?? 0.5) - val);
    if (dist < minDist) {
      minDist = dist;
      nearest = key;
    }
  }

  return nearest;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// ═══════════════════════════════════════════════════════════════
// MOTIF-AWARE VARIANT GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * Suggest motif types to incorporate based on StyleParams.
 * Maps style characteristics to appropriate motif types.
 */
export function suggestMotifsForStyle(params: StyleParams): MotifPrimitive["motifType"][] {
  const suggestions: MotifPrimitive["motifType"][] = [];

  // Brackets based on motif settings
  if (params.motifs.brackets !== "none") {
    suggestions.push("bracket");
  }

  // Reticles for targeting/precision aesthetics
  if (params.motifs.reticles !== "none") {
    suggestions.push("reticle");
  }

  // Grids for technical/dense layouts
  if (params.motifs.grids !== "none" || params.composition.density > 0.6) {
    suggestions.push("grid");
  }

  // Ornaments for detailed aesthetics
  if (params.motifs.tick_marks !== "none" || params.motifs.scanlines !== "none") {
    suggestions.push("ornament");
  }

  // Icons for compact, balanced compositions
  if (params.composition.density < 0.5 && params.composition.spacing_rhythm === "balanced") {
    suggestions.push("icon");
  }

  // Panels for layered compositions
  if (params.composition.layering_depth > 0.5 || params.composition.panel_hierarchy !== "flat") {
    suggestions.push("panel");
  }

  return suggestions.length > 0 ? suggestions : ["bracket", "ornament"];
}

/**
 * Filter motifs to match style profile and return top N.
 */
export function filterMotifsForStyle(
  motifs: MotifPrimitive[],
  params: StyleParams,
  maxCount: number = 5
): MotifPrimitive[] {
  const suggestedTypes = suggestMotifsForStyle(params);

  // Score each motif based on how well it matches
  const scored = motifs.map((motif) => {
    let score = 0;

    // Type match
    if (suggestedTypes.includes(motif.motifType)) {
      score += 10;
    }

    // Size appropriateness
    if (params.composition.density > 0.5) {
      // Dense layouts prefer smaller motifs
      score += motif.areaFraction < 0.05 ? 3 : 0;
    } else {
      // Sparse layouts can use larger motifs
      score += motif.areaFraction > 0.02 ? 2 : 0;
    }

    // Aspect ratio alignment
    const targetAspect = params.composition.spacing_rhythm === "tight" ? 1.5 : 1;
    const aspectDiff = Math.abs(motif.aspectRatio - targetAspect);
    score += aspectDiff < 0.5 ? 2 : 0;

    return { motif, score };
  });

  // Sort by score and return top N
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxCount)
    .map((s) => s.motif);
}

/**
 * Generate CSS for applying a motif as a pseudo-element overlay.
 * Returns CSS variable assignments for a motif layer.
 */
export function motifToOverlayVars(
  motif: MotifPrimitive,
  brandProjection: StyleParams["brand_projection"]
): Record<string, string> {
  const vars: Record<string, string> = {};

  // Motif identification
  vars["--motif-id"] = motif.id;
  vars["--motif-type"] = motif.motifType;

  // Position (as percentage of container)
  vars["--motif-x"] = `${motif.bounds.x * 100}%`;
  vars["--motif-y"] = `${motif.bounds.y * 100}%`;
  vars["--motif-width"] = `${motif.bounds.width * 100}%`;
  vars["--motif-height"] = `${motif.bounds.height * 100}%`;

  // SVG path for clip-path or mask
  if (motif.svgPath) {
    vars["--motif-path"] = `path("${motif.svgPath}")`;
  }

  // Apply brand colors to motif
  vars["--motif-stroke"] = brandProjection.accent;
  vars["--motif-fill"] = "transparent";

  return vars;
}

function projectToBrandTokens(
  colorRoles: StyleParams["color_roles"]
): StyleParams["brand_projection"] {
  const backgroundMap: Record<string, string> = {
    dark: "var(--void)",
    mid: "var(--void-surface, rgba(10, 9, 8, 0.8))",
    light: "var(--dawn-08)",
  };

  const surfaceMap: Record<string, string> = {
    dark: "var(--void)",
    mid: "var(--dawn-08)",
    light: "var(--dawn-15)",
  };

  const borderMap: Record<string, string> = {
    subtle: "var(--dawn-15)",
    accent: "var(--gold-30)",
    prominent: "var(--gold)",
  };

  const accentMap: Record<string, string> = {
    warm: "var(--gold)",
    cool: "var(--dawn-70)",
    neutral: "var(--dawn-50)",
  };

  const textMap: Record<string, string> = {
    "high-contrast": "var(--dawn)",
    medium: "var(--dawn-70)",
    "low-contrast": "var(--dawn-50)",
  };

  return {
    background: backgroundMap[colorRoles.background] || "var(--void)",
    surface: surfaceMap[colorRoles.surface] || "var(--dawn-08)",
    border: borderMap[colorRoles.border] || "var(--dawn-15)",
    accent: accentMap[colorRoles.accent] || "var(--gold)",
    text: textMap[colorRoles.text] || "var(--dawn)",
  };
}
