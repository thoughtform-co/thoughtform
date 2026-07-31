/**
 * The v2 station silhouettes — DRAWN, not iconified.
 *
 * The recipe is the casefile's `.fl-row__glyph` (`casefile.css`): a small
 * bordered box whose shape comes from a `clip-path` cutting the border with
 * it. `proof` is literally the casefile's own `doc` cut, reused rather than
 * redrawn.
 *
 * Two rows carry no cut and take an inner rule instead (see the
 * `[data-glyph]` rules in the lab sheet): `services` gets a three-bar stack
 * for the plate cluster, `practice` gets a single baseline.
 *
 * ⚠ This set exists to be JUDGED, and my read is that it fails: this
 * codebase has deliberately never had an icon vocabulary, and at 14×10 the
 * marks stop reading as instrument geometry and start reading as app icons
 * — `contact` in particular can only ever become an envelope. Looking
 * settles that faster than arguing about it.
 */

/**
 * Keyed by `READOUT_SECTIONS` row id. A `null` cut means "box + inner rule".
 *
 * Cuts are deliberately DEEP. The first pass kept them under 4px on a 14×10
 * box, which is barely more than the 1px border is thick — every silhouette
 * collapsed to the same rectangle. On an 18×12 box these each remove enough
 * of the outline to change its shape, which is the only way the approach
 * gets a fair hearing.
 */
export const ROW_GLYPH_CLIPS: Readonly<Record<string, string | null>> = {
  // A heading vector — the box drawn to a point, the Arc as a direction.
  arc: "polygon(0 0, 8px 0, 100% 50%, 8px 100%, 0 100%)",
  // The casefile's own file-with-a-folded-corner, deepened.
  proof: "polygon(0 0, 11px 0, 100% 7px, 100% 100%, 0 100%)",
  // Plate cluster — box + three bars.
  services: null,
  // A card with a notched head — the deck-flip portrait.
  about: "polygon(0 0, 5px 0, 9px 5px, 13px 0, 100% 0, 100% 100%, 0 100%)",
  // A baseline — box + one rule.
  practice: null,
  // An aperture cut from the head.
  contact: "polygon(0 0, 9px 7px, 100% 0, 100% 100%, 0 100%)",
};
