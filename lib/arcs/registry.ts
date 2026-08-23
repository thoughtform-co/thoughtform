import { AI_KEYNOTE_ARC } from "./content/ai-keynote";
import { AI_KEYNOTE_V2_ARC } from "./content/ai-keynote-v2";
import { CLAUDE_WORKSHOP_ARC } from "./content/claude-workshop";
import { CLAUDE_WORKSHOP_V2_ARC } from "./content/claude-workshop-v2";
import { PORTFOLIO_ARC } from "./content/portfolio";
import type { ArcDef } from "./types";

/**
 * The arc registry — single source of truth for the `/arcs` overview
 * grid order and the `[slug]` static params (ADR-052).
 *
 * The terminal-motion cuts (ADR-057) sit after the v1 pages: those are
 * what clients hold links to, so they keep the head of the grid until a
 * v2 is promoted in place. The portfolio (ADR-072) closes the grid — it
 * is a page handed to one reader, not a deck a room was shown.
 */
export const ARCS: readonly ArcDef[] = [
  CLAUDE_WORKSHOP_ARC,
  AI_KEYNOTE_ARC,
  CLAUDE_WORKSHOP_V2_ARC,
  AI_KEYNOTE_V2_ARC,
  PORTFOLIO_ARC,
];

export function arcSlugs(): string[] {
  return ARCS.map((arc) => arc.slug);
}

export function getArc(slug: string): ArcDef | undefined {
  return ARCS.find((arc) => arc.slug === slug);
}
