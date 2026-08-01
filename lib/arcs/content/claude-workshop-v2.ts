import { CLAUDE_WORKSHOP_ARC } from "./claude-workshop";
import type { ArcDef } from "../types";

/**
 * Claude workshop arc · V2 — the ADR-057 terminal-motion cut.
 *
 * SECTIONS AND HERO ARE SHARED BY REFERENCE with v1: this is a
 * presentation fork, not a content fork, so a copy edit lands on both
 * pages for the whole dual-run and there is nothing to reconcile at
 * promotion (which is `motion: "terminal"` on the v1 def and deleting
 * this module). `tests/lib/arcs-registry.test.ts` pins the identity.
 *
 * If one section ever has to diverge, fork that element with `.map()`
 * and move the pin — never copy the array.
 */
export const CLAUDE_WORKSHOP_V2_ARC: ArcDef = {
  ...CLAUDE_WORKSHOP_ARC,
  slug: "claude-workshop-v2",
  motion: "terminal",
  cardTitle: "The Claude workshop · V2",
  cardChip: "workshop · v2",
  meta: {
    title: "Claude workshop · V2 — Thoughtform",
    description: CLAUDE_WORKSHOP_ARC.meta.description,
  },
};
