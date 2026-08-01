import { AI_KEYNOTE_ARC } from "./ai-keynote";
import type { ArcDef } from "../types";

/**
 * Creative AI keynote arc · V2 — the ADR-057 terminal-motion cut.
 *
 * Sections and hero are shared by reference with v1 (see the note in
 * `claude-workshop-v2.ts` — same doctrine, same registry-test pin). This
 * is the arc that exercises the aperture grammar: it is the only one
 * carrying `media` and `portrait` sections.
 */
export const AI_KEYNOTE_V2_ARC: ArcDef = {
  ...AI_KEYNOTE_ARC,
  slug: "ai-keynote-v2",
  motion: "terminal",
  cardTitle: "The creative AI keynote · V2",
  cardChip: "keynote · v2",
  meta: {
    title: "Creative AI keynote · V2 — Thoughtform",
    description: AI_KEYNOTE_ARC.meta.description,
  },
};
