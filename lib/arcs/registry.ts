import { AI_KEYNOTE_ARC } from "./content/ai-keynote";
import { AI_KEYNOTE_V2_ARC } from "./content/ai-keynote-v2";
import { CLAUDE_WORKSHOP_ARC } from "./content/claude-workshop";
import { CLAUDE_WORKSHOP_V2_ARC } from "./content/claude-workshop-v2";
import { PORTFOLIO_ARC } from "./content/portfolio";
import { SURI_PROPOSAL_ARC } from "./content/suri-proposal";
import { PERFECT_TED_PROPOSAL_ARC } from "./content/perfect-ted-proposal";
import { HUNGRY_MINDS_PROPOSAL_ARC } from "./content/hungry-minds-proposal";
import { PANDORA_PROPOSAL_ARC } from "./content/pandora-proposal";
import { PLOPSA_WORKSHOP_ARC } from "./content/plopsa-workshop";
import { SURI_WORKSHOP_ARC } from "./content/suri-workshop";
import { THOUGHTFORM_WORKSHOP_ARC } from "./content/thoughtform-workshop";
import { THOUGHTFORM_WORKSHOP_V2_ARC } from "./content/thoughtform-workshop-v2";
import { THOUGHTFORM_WORKSHOP_V3_ARC } from "./content/thoughtform-workshop-v3";
import { AI_STORYTELLING_ARC } from "./content/ai-storytelling";
import { AI_STORYTELLING_CLASS_1_ARC } from "./content/ai-storytelling-class-1";
import { AP_HOGESCHOOL_ARC } from "./content/ap-hogeschool";
import { arcHref, groupOf } from "./routes";
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
 * first: `arcsOf` preserves this array's sequence. Since ADR-118 every arc
 * also carries a `date` — it feeds the overview's monitor, a PLOT — and
 * `arcs-registry` checks that each client's sequence here agrees with its
 * dates, so the order and the dates cannot tell two stories.
 */
export const ARCS: readonly ArcDef[] = [
  /* The AP Hogeschool guest lecture (ADR-141): the workshop's third cut,
     for a room of students. A client's since ADR-142, the school's. */
  AP_HOGESCHOOL_ARC,
  SURI_WORKSHOP_ARC,
  PLOPSA_WORKSHOP_ARC,
  PANDORA_PROPOSAL_ARC,
  HUNGRY_MINDS_PROPOSAL_ARC,
  PERFECT_TED_PROPOSAL_ARC,
  SURI_PROPOSAL_ARC,
  /* The house formats. THE ARCHETYPE LEADS THEM: the client workshops above
     are cuts of it, so it is the page to read before any of them. */
  THOUGHTFORM_WORKSHOP_ARC,
  /* The second cut (ADR-139), after the v1 the client forks were cut from
     and that a room already holds a link to. One line to move the day it
     is promoted in place. */
  THOUGHTFORM_WORKSHOP_V2_ARC,
  /* The third house cut (ADR-143): the AP lecture's spine with Prompt to
     Loop as its worked example and the economics after its bill. The
     template the next presentations are cut from. */
  THOUGHTFORM_WORKSHOP_V3_ARC,
  AI_STORYTELLING_ARC,
  /* The course's class decks sit beside the course (ADR-136). */
  AI_STORYTELLING_CLASS_1_ARC,
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

/** The arc at `/arcs/<group>/<leaf>` (ADR-142). */
export function getArcAt(group: string, leaf: string): ArcDef | undefined {
  return ARCS.find((arc) => groupOf(arc) === group && arc.leaf === leaf);
}

/** Every arc's address, in registry order. */
export function arcHrefs(): string[] {
  return ARCS.map(arcHref);
}

/** The engagements of one group, in registry order (ADR-098): a client's,
 *  or the house formats for `thoughtform` (ADR-142). */
export function arcsOf(groupSlug: string): ArcDef[] {
  return ARCS.filter((arc) => groupOf(arc) === groupSlug);
}

/** The Thoughtform formats — the shapes the practice sells, which belong
 *  to no client (ADR-098). */
export function houseArcs(): ArcDef[] {
  return ARCS.filter((arc) => !arc.client);
}
