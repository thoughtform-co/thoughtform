// ═══════════════════════════════════════════════════════════════
// THOUGHTFORM MATCH API
// Matches design descriptions to components using keyword analysis
// This serves as a bridge to the Thoughtform MCP match_reference tool
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";

// ─── COMPONENT LIBRARY ───
// Embedded component definitions for matching
// These mirror the Thoughtform MCP's component library

interface ComponentEntry {
  component: string;
  repo: string;
  platform: "atlas" | "ledger" | "astrolabe" | "marketing" | "shared";
  keywords: string[];
  patterns: string[];
  tokens: string[];
  description: string;
}

const COMPONENT_LIBRARY: ComponentEntry[] = [
  // Atlas Components
  {
    component: "EntityCard",
    repo: "atlas",
    platform: "atlas",
    keywords: [
      "entity",
      "card",
      "specimen",
      "creature",
      "bestiary",
      "organic",
      "breathing",
      "cosmic",
    ],
    patterns: ["breathing", "cornerBrackets", "glassmorphism"],
    tokens: ["--gold", "--dawn", "--void", "--font-mono"],
    description: "Card for displaying entity specimens with breathing animation",
  },
  {
    component: "Navigation",
    repo: "atlas",
    platform: "atlas",
    keywords: ["navigation", "nav", "menu", "links", "header"],
    patterns: ["particleSystem"],
    tokens: ["--font-mono", "--surface-0", "--dawn", "--gold", "--signal"],
    description: "Navigation component with particle system integration",
  },
  {
    component: "NavigationHUD",
    repo: "atlas",
    platform: "atlas",
    keywords: ["hud", "heads-up", "display", "overlay", "cockpit", "instrument"],
    patterns: ["cornerBrackets", "glassmorphism", "particleSystem"],
    tokens: ["--font-mono", "--dawn-50", "--dawn-30", "--gold", "--void"],
    description: "HUD overlay with corner brackets and glassmorphism",
  },
  {
    component: "SemanticNavigator",
    repo: "atlas",
    platform: "atlas",
    keywords: ["semantic", "search", "navigator", "explore", "discovery"],
    patterns: [],
    tokens: ["--void", "--font-mono", "--dawn-30", "--dawn-50", "--gold"],
    description: "Semantic exploration interface for navigating design space",
  },

  // Astrolabe Components
  {
    component: "InstrumentPanel",
    repo: "brandworld",
    platform: "astrolabe",
    keywords: [
      "instrument",
      "panel",
      "cockpit",
      "readout",
      "gauge",
      "meter",
      "status",
      "aerospace",
    ],
    patterns: ["particleSystem", "breathing"],
    tokens: ["--font-mono", "--dawn-30", "--dawn-04", "--surface-0", "--dawn-08", "--gold"],
    description: "Aerospace-inspired instrument panel with readouts",
  },
  {
    component: "NavigationGrid",
    repo: "brandworld",
    platform: "astrolabe",
    keywords: ["grid", "navigation", "dots", "matrix", "coordinate", "map"],
    patterns: ["cornerBrackets"],
    tokens: ["--gold", "--verde-bright", "--teal", "--dawn", "--font-mono"],
    description: "Dot-matrix navigation grid with coordinate display",
  },
  {
    component: "NavigationCockpit",
    repo: "brandworld",
    platform: "marketing",
    keywords: ["cockpit", "navigation", "hud", "frame", "viewport"],
    patterns: ["cornerBrackets", "particleSystem"],
    tokens: ["--void", "--gold", "--signal", "--ink"],
    description: "Full cockpit navigation frame for marketing pages",
  },

  // Ledger Components
  {
    component: "TerminalContainer",
    repo: "ledger",
    platform: "astrolabe",
    keywords: ["terminal", "crt", "phosphor", "green", "scanline", "retro", "console"],
    patterns: ["scanlines", "phosphorGlow"],
    tokens: ["--verde", "--verde-bright", "--void", "--font-mono"],
    description: "CRT-style terminal container with scanline effects",
  },
  {
    component: "DataReadout",
    repo: "ledger",
    platform: "astrolabe",
    keywords: ["data", "readout", "stats", "metrics", "display", "numbers", "value"],
    patterns: ["dataReadout"],
    tokens: ["--font-mono", "--dawn", "--gold", "--dawn-50"],
    description: "Numeric data display with monospace typography",
  },
  {
    component: "StatCard",
    repo: "ledger",
    platform: "astrolabe",
    keywords: ["stat", "card", "metric", "kpi", "value", "indicator"],
    patterns: ["dataReadout", "statusIndicator"],
    tokens: ["--font-mono", "--dawn", "--gold", "--verde"],
    description: "Statistical card with trend indicators",
  },

  // Shared/UI Components
  {
    component: "Panel",
    repo: "thoughtform-ui",
    platform: "shared",
    keywords: ["panel", "container", "frame", "card", "notch", "chamfer", "ticket", "inspector"],
    patterns: ["ticketNotch", "chamferedCorners", "panelHeader"],
    tokens: ["--gold-30", "--dawn-15", "--void", "--font-mono"],
    description: "Chamfered panel with ticket notch for titles",
  },
  {
    component: "ChamferedFrame",
    repo: "thoughtform-ui",
    platform: "shared",
    keywords: ["chamfer", "frame", "border", "cut-corner", "angled"],
    patterns: ["chamferedCorners"],
    tokens: ["--gold-30", "--dawn-08", "--void"],
    description: "SVG-based frame with configurable chamfered corners",
  },
  {
    component: "CornerBrackets",
    repo: "thoughtform-ui",
    platform: "shared",
    keywords: ["corner", "bracket", "l-shape", "frame", "hud", "targeting"],
    patterns: ["cornerBrackets"],
    tokens: ["--gold", "--dawn"],
    description: "L-shaped corner brackets for HUD frames",
  },
  {
    component: "ToolbarButton",
    repo: "thoughtform-ui",
    platform: "shared",
    keywords: ["toolbar", "button", "icon", "action", "control"],
    patterns: ["toolbarIcons"],
    tokens: ["--dawn-50", "--gold", "--font-mono"],
    description: "Icon button for toolbars with hover states",
  },

  // Retrofuturism-specific
  {
    component: "AmberTerminal",
    repo: "references",
    platform: "astrolabe",
    keywords: ["amber", "orange", "terminal", "alien", "romulus", "industrial", "phosphor", "warm"],
    patterns: ["scanlines", "phosphorGlow", "gridOverlay"],
    tokens: ["--gold", "--signal", "--void", "--font-mono"],
    description: "Amber/orange phosphor terminal inspired by Alien Romulus",
  },
  {
    component: "StarfieldPanel",
    repo: "references",
    platform: "astrolabe",
    keywords: ["starfield", "bethesda", "space", "ship", "systems", "status", "clean"],
    patterns: ["panelHeader", "toolbarIcons", "dataReadout"],
    tokens: ["--dawn", "--teal", "--void", "--font-mono"],
    description: "Clean panel design inspired by Starfield UI",
  },
];

// ─── PATTERN DEFINITIONS ───

const PATTERN_KEYWORDS: Record<string, string[]> = {
  cornerBrackets: ["corner", "bracket", "l-shape", "targeting", "reticle", "hud frame"],
  scanlines: ["scanline", "crt", "phosphor", "interlace", "retro screen"],
  phosphorGlow: ["glow", "phosphor", "neon", "bloom", "luminous", "emissive"],
  gridOverlay: ["grid", "matrix", "dot pattern", "crosshatch", "coordinate"],
  chamferedCorners: ["chamfer", "cut corner", "angled corner", "beveled"],
  ticketNotch: ["notch", "ticket", "step-down", "tab", "inspector"],
  dataReadout: ["readout", "display", "stats", "metrics", "data", "numbers"],
  toolbarIcons: ["toolbar", "icon button", "action bar", "tool strip"],
  panelHeader: ["header", "title bar", "panel title", "label zone", "labeled"],
  statusIndicator: ["status", "indicator", "light", "beacon", "signal"],
  particleSystem: ["particle", "stars", "dots", "points", "floating"],
  breathing: ["breathing", "pulse", "animate", "living", "organic motion"],
  glassmorphism: ["glass", "blur", "frosted", "translucent", "backdrop"],
};

// ─── MATCHING LOGIC ───

function calculateSimilarity(description: string, entry: ComponentEntry): number {
  const descLower = description.toLowerCase();
  let score = 0;
  let maxScore = 0;

  // Keyword matching (weighted heavily)
  for (const keyword of entry.keywords) {
    maxScore += 3;
    if (descLower.includes(keyword.toLowerCase())) {
      score += 3;
    }
  }

  // Pattern keyword matching
  for (const pattern of entry.patterns) {
    const patternKeywords = PATTERN_KEYWORDS[pattern] || [];
    for (const pk of patternKeywords) {
      maxScore += 1;
      if (descLower.includes(pk.toLowerCase())) {
        score += 1;
      }
    }
  }

  // Description similarity (basic word overlap)
  const entryWords = entry.description.toLowerCase().split(/\s+/);
  for (const word of entryWords) {
    if (word.length > 3) {
      maxScore += 0.5;
      if (descLower.includes(word)) {
        score += 0.5;
      }
    }
  }

  return maxScore > 0 ? score / maxScore : 0;
}

function detectPatterns(description: string): string[] {
  const descLower = description.toLowerCase();
  const detected: string[] = [];

  for (const [pattern, keywords] of Object.entries(PATTERN_KEYWORDS)) {
    for (const keyword of keywords) {
      if (descLower.includes(keyword.toLowerCase())) {
        if (!detected.includes(pattern)) {
          detected.push(pattern);
        }
        break;
      }
    }
  }

  return detected;
}

function suggestTokens(description: string): string[] {
  const descLower = description.toLowerCase();
  const tokens: string[] = [];

  // Color detection
  if (descLower.includes("gold") || descLower.includes("amber") || descLower.includes("brass")) {
    tokens.push("--gold");
  }
  if (descLower.includes("dawn") || descLower.includes("cream") || descLower.includes("white")) {
    tokens.push("--dawn");
  }
  if (descLower.includes("void") || descLower.includes("black") || descLower.includes("dark")) {
    tokens.push("--void");
  }
  if (
    descLower.includes("verde") ||
    descLower.includes("green") ||
    descLower.includes("terminal")
  ) {
    tokens.push("--verde");
  }
  if (descLower.includes("teal") || descLower.includes("cyan") || descLower.includes("blue")) {
    tokens.push("--teal");
  }
  if (
    descLower.includes("signal") ||
    descLower.includes("orange") ||
    descLower.includes("warning")
  ) {
    tokens.push("--signal");
  }

  // Typography
  if (
    descLower.includes("mono") ||
    descLower.includes("terminal") ||
    descLower.includes("data") ||
    descLower.includes("technical")
  ) {
    tokens.push("--font-mono");
  }

  // Opacity variants
  if (descLower.includes("subtle") || descLower.includes("faint")) {
    tokens.push("--dawn-30");
  }

  return [...new Set(tokens)];
}

function generateImplementationPath(
  topMatch: ComponentEntry,
  suggestedTokens: string[],
  suggestedPatterns: string[]
): string[] {
  const path: string[] = [];

  path.push(`Start from ${topMatch.component} (${topMatch.repo})`);

  if (suggestedTokens.length > 0) {
    path.push(`Use tokens: ${suggestedTokens.slice(0, 4).join(", ")}`);
  }

  if (suggestedPatterns.length > 0) {
    path.push(`Apply patterns: ${suggestedPatterns.slice(0, 4).join(", ")}`);
  }

  // Add related component suggestions based on patterns
  const related: string[] = [];
  if (suggestedPatterns.includes("panelHeader") || suggestedPatterns.includes("ticketNotch")) {
    related.push("Panel");
  }
  if (suggestedPatterns.includes("dataReadout")) {
    related.push("StatCard", "DataReadout");
  }
  if (suggestedPatterns.includes("cornerBrackets")) {
    related.push("CornerBrackets", "NavigationHUD");
  }

  if (related.length > 0) {
    path.push(`Related components: ${related.join(", ")}`);
  }

  return path;
}

// ─── API HANDLER ───

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, limit = 5, platform } = body;

    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "Missing or invalid description" }, { status: 400 });
    }

    // Filter by platform if specified
    let candidates = COMPONENT_LIBRARY;
    if (platform) {
      candidates = candidates.filter((c) => c.platform === platform || c.platform === "shared");
    }

    // Calculate similarity scores
    const scored = candidates.map((entry) => ({
      ...entry,
      similarity: calculateSimilarity(description, entry),
    }));

    // Sort by similarity and take top N
    scored.sort((a, b) => b.similarity - a.similarity);
    const matches = scored.slice(0, limit).map((entry) => ({
      component: entry.component,
      repo: entry.repo,
      platform: entry.platform,
      similarity: Math.round(entry.similarity * 1000) / 1000,
      patterns: entry.patterns,
      tokens: entry.tokens,
    }));

    // Detect patterns from description
    const suggestedPatterns = detectPatterns(description);

    // Suggest tokens from description
    const suggestedTokens = suggestTokens(description);

    // Generate implementation path from top match
    const implementationPath =
      matches.length > 0
        ? generateImplementationPath(scored[0], suggestedTokens, suggestedPatterns)
        : [];

    return NextResponse.json({
      query: description,
      matchCount: matches.length,
      matches,
      suggestedTokens,
      suggestedPatterns,
      implementationPath,
    });
  } catch (error) {
    console.error("POST /api/thoughtform/match error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
