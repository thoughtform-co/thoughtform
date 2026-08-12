/**
 * THE ADVANCE MODEL, and the declaration a fit guard walks.
 *
 * PT Mono's advance is ~0.6 em and TRACKING ADDS TO IT, so the factor is
 * `0.6 + track`: 0.68 at the value tracking (.08em), 0.74 at the header
 * tracking (.14em), 0.82 at the chrome tracking (.22em). `MONO_ADVANCE` in
 * `pdaGlyphs` (0.68) is this formula evaluated at .08em.
 *
 * ⚠ **ONE ADVANCE MODEL FOR THE WHOLE SURFACE.** It was declared in the
 * configuration lab, re-exported by the substrate lab, and unavailable to
 * production — which is part of why reading 03 shipped for months with no fit
 * guard at all. It lives beside the drawings now and both labs import it from
 * here: the advance is a property of the FONT, not of a route, and two copies
 * of it is how one surface starts passing a fit its neighbour would fail.
 *
 * ⚠ **SVG `<text>` DOES NOT WRAP, ELLIPSISE, OR REPORT OVERFLOW.** A label
 * past its measure simply vanishes, with nothing on screen to say so. That is
 * the whole reason a drawing declares what it letters instead of being
 * reviewed by eye.
 */

export const adv = (fs: number, track: number) => fs * (0.6 + track);

/** One lettered string, declared so a fit test can measure the DRAWING'S OWN
 *  inputs rather than re-deriving its own. */
export interface LetterSpec {
  slot: string;
  text: string;
  fs: number;
  /** Tracking in em — the advance model needs it, see `adv`. */
  track: number;
  /** The measure the text must fit, in authoring units. */
  measure: number;
}

export const specWidth = (s: LetterSpec) => s.text.length * adv(s.fs, s.track);
