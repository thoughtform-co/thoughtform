import type { MusingOutline } from "@/lib/musings/outline";

/**
 * Authored OUTLINES for the seven placeholder records (`../musings-row/
 * placeholders.ts`) — the gallery's directions draw an essay's sections, and a
 * placeholder has no body to read them off.
 *
 * ⚠ **LAB COPY, AND IT LIVES HERE AND NOWHERE ELSE** — the placeholders' own
 * law: the site is live, and nothing under `content/musings/` may be invented.
 * The headings are real-shaped (names, not aphorisms; the copy law holds —
 * `musings-gallery.test.ts` walks them through `MUSINGS_COPY_BANS`), and each
 * outline's words agree with its record's reading time at 220 a minute, so a
 * drawing that plots length is plotting a length the kicker also states.
 */
const o = (lead: number, ...sections: [string, number][]): MusingOutline => {
  const all = [
    ...(lead > 0 ? [{ heading: null, words: lead }] : []),
    ...sections.map(([heading, words]) => ({ heading, words })),
  ];
  return { sections: all, words: all.reduce((n, s) => n + s.words, 0) };
};

export const LAB_OUTLINES: Readonly<Record<string, MusingOutline>> = {
  "the-seat-decides-the-lane": o(
    140,
    ["Who owns the outcome", 260],
    ["Lanes follow seats", 310],
    ["When the seat is empty", 170]
  ),
  "what-a-skill-actually-encodes": o(
    180,
    ["Judgment, written down once", 340],
    ["The four parts of a skill", 420],
    ["Holding the model to it", 260],
    ["What a skill is not", 120]
  ),
  "software-for-the-few": o(
    150,
    ["One studio, one briefing agent", 380],
    ["Why platforms flatten", 290],
    ["Building for the room", 280]
  ),
  "reading-the-spend-as-work": o(
    120,
    ["The bill as a record", 290],
    ["Teams thinking with the layer", 250]
  ),
  "the-context-is-the-product": o(
    200,
    ["Where the value sits", 330],
    ["Material, not prompts", 390],
    ["The receipt", 210],
    ["Encoding as the work", 410]
  ),
  "owning-the-loop": o(
    130,
    ["Swapping the model underneath", 360],
    ["Waiting for the vendor", 390]
  ),
  "the-first-beat-of-the-arc": o(
    160,
    ["Automation comes last", 310],
    ["The workflow nobody understood", 380],
    ["Starting with the seat", 250]
  ),
};
