import type { ArcImage } from "../../types";

/**
 * The operator's own lines — SHARED EVIDENCE (ADR-072). Hoisted verbatim
 * out of `ai-keynote.ts`; both arcs import them so the portrait, the lead
 * paragraph and the software-for-few line cannot drift between decks.
 */
export const VINCE_PORTRAIT: ArcImage = { src: "/arcs/vince-portrait.png", alt: "Vince Buyssens" };

/** The About read's first paragraph — the practice, in one breath. */
export const VINCE_BIO_LEAD =
  "Vince is a technologist who's been navigating the tides of digital change for over a decade. Through Thoughtform he helps teams navigate AI, encode the judgment that makes their work good, and build tools they own.";

/** Why the team builds its own tools — the keynote's callout subline. */
export const SOFTWARE_FEW_LINE =
  "Most of Loop’s bottlenecks live in software too specific to buy off the shelf, and too small to justify an agency build. That category sat unsolved for years. AI models crossed a threshold at the end of 2025 where the team that owns the problem can now build the tool itself. The Skills above are what those tools run on.";
