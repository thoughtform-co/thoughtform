import { AI_KEYNOTE_ARC } from "./content/ai-keynote";
import { AI_KEYNOTE_V2_ARC } from "./content/ai-keynote-v2";
import { CLAUDE_WORKSHOP_ARC } from "./content/claude-workshop";
import { CLAUDE_WORKSHOP_V2_ARC } from "./content/claude-workshop-v2";
import { PORTFOLIO_ARC } from "./content/portfolio";
import { SURI_PROPOSAL_ARC } from "./content/suri-proposal";
import type { ArcDef } from "./types";

/**
 * The arc registry — single source of truth for the `/arcs` overview
 * grid order and the `[slug]` static params (ADR-052).
 *
 * The terminal-motion cuts (ADR-057) sit after the v1 pages: those are
 * what clients hold links to, so they keep the head of the grid until a
 * v2 is promoted in place. The portfolio (ADR-072) closes the grid — it
 * is a page handed to one reader, not a deck a room was shown.
 *
 * ⚠ THE ORDER IS THE ORDER (ADR-098). Inside a client, newest engagement
 * first: `arcsOf` preserves this array's sequence, and no arc carries a
 * date, because a field that only ever feeds a sort is a second place for
 * the same fact to be wrong.
 */
export const ARCS: readonly ArcDef[] = [
  SURI_PROPOSAL_ARC,
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

/** The engagements of one client, in registry order (ADR-098). */
export function arcsOf(clientSlug: string): ArcDef[] {
  return ARCS.filter((arc) => arc.client === clientSlug);
}

/** The Thoughtform formats — the shapes the practice sells, which belong
 *  to no client (ADR-098). */
export function houseArcs(): ArcDef[] {
  return ARCS.filter((arc) => !arc.client);
}
