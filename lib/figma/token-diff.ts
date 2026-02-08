// ═══════════════════════════════════════════════════════════════
// TOKEN DIFF ENGINE
// ═══════════════════════════════════════════════════════════════
// Compares Figma variables against Thoughtform codebase tokens.
// Produces a structured diff for the Bridge UI.

import { figmaColorToHex } from "./client";
import type { FigmaVariable, FigmaVariableCollection } from "./types";

// ═══════════════════════════════════════════════════════════════
// CODEBASE TOKENS (static, from variables.css)
// ═══════════════════════════════════════════════════════════════

export interface CodebaseToken {
  name: string; // CSS variable name (e.g., "--void")
  value: string; // Resolved value (e.g., "#0a0908")
  category: "color" | "spacing" | "typography" | "layout" | "animation";
}

/** Hardcoded codebase tokens from app/styles/variables.css */
export const CODEBASE_TOKENS: CodebaseToken[] = [
  // Colors
  { name: "--void", value: "#0a0908", category: "color" },
  { name: "--void-deep", value: "#050504", category: "color" },
  { name: "--dawn", value: "#ebe3d6", category: "color" },
  { name: "--dawn-90", value: "rgba(235, 227, 214, 0.9)", category: "color" },
  { name: "--dawn-80", value: "rgba(235, 227, 214, 0.8)", category: "color" },
  { name: "--dawn-70", value: "rgba(235, 227, 214, 0.7)", category: "color" },
  { name: "--dawn-60", value: "rgba(235, 227, 214, 0.6)", category: "color" },
  { name: "--dawn-50", value: "rgba(235, 227, 214, 0.5)", category: "color" },
  { name: "--dawn-40", value: "rgba(235, 227, 214, 0.4)", category: "color" },
  { name: "--dawn-30", value: "rgba(235, 227, 214, 0.3)", category: "color" },
  { name: "--dawn-20", value: "rgba(235, 227, 214, 0.2)", category: "color" },
  { name: "--dawn-15", value: "rgba(235, 227, 214, 0.15)", category: "color" },
  { name: "--dawn-10", value: "rgba(235, 227, 214, 0.1)", category: "color" },
  { name: "--dawn-08", value: "rgba(235, 227, 214, 0.08)", category: "color" },
  { name: "--dawn-04", value: "rgba(235, 227, 214, 0.04)", category: "color" },
  { name: "--gold", value: "#caa554", category: "color" },
  { name: "--gold-70", value: "rgba(202, 165, 84, 0.7)", category: "color" },
  { name: "--gold-60", value: "rgba(202, 165, 84, 0.6)", category: "color" },
  { name: "--gold-50", value: "rgba(202, 165, 84, 0.5)", category: "color" },
  { name: "--gold-40", value: "rgba(202, 165, 84, 0.4)", category: "color" },
  { name: "--gold-30", value: "rgba(202, 165, 84, 0.3)", category: "color" },
  { name: "--gold-20", value: "rgba(202, 165, 84, 0.2)", category: "color" },
  { name: "--gold-15", value: "rgba(202, 165, 84, 0.15)", category: "color" },
  { name: "--gold-10", value: "rgba(202, 165, 84, 0.1)", category: "color" },
  { name: "--gold-08", value: "rgba(202, 165, 84, 0.08)", category: "color" },
  { name: "--alert", value: "#ff6b35", category: "color" },

  // Spacing
  { name: "--space-xs", value: "4px", category: "spacing" },
  { name: "--space-sm", value: "8px", category: "spacing" },
  { name: "--space-md", value: "16px", category: "spacing" },
  { name: "--space-lg", value: "24px", category: "spacing" },
  { name: "--space-xl", value: "32px", category: "spacing" },
  { name: "--space-2xl", value: "48px", category: "spacing" },
  { name: "--space-3xl", value: "64px", category: "spacing" },
  { name: "--space-4xl", value: "96px", category: "spacing" },

  // Layout
  { name: "--hud-padding", value: "clamp(32px, 4vw, 64px)", category: "layout" },
  { name: "--rail-width", value: "60px", category: "layout" },
  { name: "--content-max-width", value: "1200px", category: "layout" },
  { name: "--corner-size", value: "40px", category: "layout" },

  // Animation
  { name: "--duration-fast", value: "0.15s", category: "animation" },
  { name: "--duration-normal", value: "0.3s", category: "animation" },
];

// ═══════════════════════════════════════════════════════════════
// DIFF TYPES
// ═══════════════════════════════════════════════════════════════

export type TokenDiffStatus = "matched" | "drifted" | "figma_only" | "code_only";

export interface TokenDiffEntry {
  status: TokenDiffStatus;
  name: string; // Normalized name for comparison
  figmaName?: string; // Original Figma variable name
  codeName?: string; // CSS variable name
  figmaValue?: string; // Figma resolved value
  codeValue?: string; // Codebase value
  category: "color" | "spacing" | "typography" | "layout" | "animation" | "unknown";
  collection?: string; // Figma collection name
}

export interface TokenDiffReport {
  matched: TokenDiffEntry[];
  drifted: TokenDiffEntry[];
  figmaOnly: TokenDiffEntry[];
  codeOnly: TokenDiffEntry[];
  summary: {
    total: number;
    matched: number;
    drifted: number;
    figmaOnly: number;
    codeOnly: number;
  };
}

// ═══════════════════════════════════════════════════════════════
// DIFF ENGINE
// ═══════════════════════════════════════════════════════════════

/**
 * Normalize a variable name for comparison.
 * Strips prefixes (--), lowercases, replaces separators.
 * e.g., "--dawn-50" => "dawn-50", "Dawn/50" => "dawn-50"
 */
function normalizeName(name: string): string {
  return name.replace(/^--/, "").replace(/\//g, "-").replace(/\s+/g, "-").toLowerCase();
}

/**
 * Resolve a Figma variable value to a displayable string.
 */
function resolveFigmaValue(variable: FigmaVariable, defaultModeId: string): string | null {
  const value = variable.valuesByMode[defaultModeId];
  if (value === undefined || value === null) return null;

  switch (variable.resolvedType) {
    case "COLOR": {
      const c = value as { r: number; g: number; b: number; a: number };
      if (c.a !== undefined && c.a < 1) {
        const r = Math.round(c.r * 255);
        const g = Math.round(c.g * 255);
        const b = Math.round(c.b * 255);
        return `rgba(${r}, ${g}, ${b}, ${c.a})`;
      }
      return figmaColorToHex(c);
    }
    case "FLOAT":
      return `${value}px`;
    case "STRING":
      return String(value);
    case "BOOLEAN":
      return String(value);
    default:
      return String(value);
  }
}

/**
 * Guess the category of a Figma variable from its name/collection.
 */
function guessCategory(name: string, collectionName: string): TokenDiffEntry["category"] {
  const lower = (name + " " + collectionName).toLowerCase();
  if (
    lower.includes("color") ||
    lower.includes("fill") ||
    lower.includes("dawn") ||
    lower.includes("gold") ||
    lower.includes("void") ||
    lower.includes("alert") ||
    lower.includes("verde")
  ) {
    return "color";
  }
  if (lower.includes("spacing") || lower.includes("space") || lower.includes("gap")) {
    return "spacing";
  }
  if (lower.includes("font") || lower.includes("type") || lower.includes("text")) {
    return "typography";
  }
  if (lower.includes("layout") || lower.includes("padding") || lower.includes("width")) {
    return "layout";
  }
  if (lower.includes("duration") || lower.includes("ease") || lower.includes("animation")) {
    return "animation";
  }
  return "unknown";
}

/**
 * Compare Figma variables against codebase tokens.
 */
export function diffTokens(
  variables: Record<string, FigmaVariable>,
  collections: Record<string, FigmaVariableCollection>
): TokenDiffReport {
  const matched: TokenDiffEntry[] = [];
  const drifted: TokenDiffEntry[] = [];
  const figmaOnly: TokenDiffEntry[] = [];

  // Build a lookup of codebase tokens by normalized name
  const codeTokenMap = new Map<string, CodebaseToken>();
  const usedCodeTokens = new Set<string>();

  for (const token of CODEBASE_TOKENS) {
    codeTokenMap.set(normalizeName(token.name), token);
  }

  // Iterate Figma variables
  for (const variable of Object.values(variables)) {
    if (variable.hiddenFromPublishing) continue;

    const collection = collections[variable.variableCollectionId];
    const collectionName = collection?.name || "";
    const defaultModeId = collection?.defaultModeId || "";

    const figmaValue = resolveFigmaValue(variable, defaultModeId);
    if (figmaValue === null) continue;

    const normalizedName = normalizeName(variable.name);
    const category = guessCategory(variable.name, collectionName);

    const codeToken = codeTokenMap.get(normalizedName);

    if (codeToken) {
      usedCodeTokens.add(normalizedName);

      // Compare values (normalize for comparison)
      const codeNormalized = codeToken.value.toLowerCase().replace(/\s+/g, "");
      const figmaNormalized = figmaValue.toLowerCase().replace(/\s+/g, "");

      if (codeNormalized === figmaNormalized) {
        matched.push({
          status: "matched",
          name: normalizedName,
          figmaName: variable.name,
          codeName: codeToken.name,
          figmaValue,
          codeValue: codeToken.value,
          category: codeToken.category,
          collection: collectionName,
        });
      } else {
        drifted.push({
          status: "drifted",
          name: normalizedName,
          figmaName: variable.name,
          codeName: codeToken.name,
          figmaValue,
          codeValue: codeToken.value,
          category: codeToken.category,
          collection: collectionName,
        });
      }
    } else {
      figmaOnly.push({
        status: "figma_only",
        name: normalizedName,
        figmaName: variable.name,
        figmaValue,
        category,
        collection: collectionName,
      });
    }
  }

  // Find code-only tokens
  const codeOnly: TokenDiffEntry[] = CODEBASE_TOKENS.filter(
    (t) => !usedCodeTokens.has(normalizeName(t.name))
  ).map((t) => ({
    status: "code_only" as const,
    name: normalizeName(t.name),
    codeName: t.name,
    codeValue: t.value,
    category: t.category,
  }));

  const total = matched.length + drifted.length + figmaOnly.length + codeOnly.length;

  return {
    matched,
    drifted,
    figmaOnly,
    codeOnly,
    summary: {
      total,
      matched: matched.length,
      drifted: drifted.length,
      figmaOnly: figmaOnly.length,
      codeOnly: codeOnly.length,
    },
  };
}
