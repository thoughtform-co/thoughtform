import { AI_KEYNOTE_ARC } from "./content/ai-keynote";
import { CLAUDE_WORKSHOP_ARC } from "./content/claude-workshop";
import type { ArcDef } from "./types";

/**
 * The arc registry — single source of truth for the `/arcs` overview
 * grid order and the `[slug]` static params (ADR-052).
 */
export const ARCS: readonly ArcDef[] = [CLAUDE_WORKSHOP_ARC, AI_KEYNOTE_ARC];

export function arcSlugs(): string[] {
  return ARCS.map((arc) => arc.slug);
}

export function getArc(slug: string): ArcDef | undefined {
  return ARCS.find((arc) => arc.slug === slug);
}
