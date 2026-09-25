/**
 * aboutBandMath — the phone's about BAND, as numbers (ADR-115).
 *
 * On the ring rung `#about` is a sticky band inside a runway of
 * `ABOUT_BAND_RUNWAY_SVH` viewports: the deck FLIPS to the portrait on
 * ADR-047's own window (`ABOUT_FLIP_WINDOW`, shared with the ring), the name
 * and the role SCRAMBLE in, the first paragraph TYPES in, the rest of the
 * bio UNFOLDS (U2, scrubbed since U3), and the band holds for reading until
 * it unpins. Every window is a fraction of the band's
 * pinned travel, read by ONE writer (`useAboutBandScroll`) and mirrored by
 * nothing — the ring reads the same `aboutStageProgressRef` the desktop
 * stage writes, so the flip needs no phone copy of its clock.
 *
 * Three-free and DOM-free; `tests/lib/about-band-math.test.ts` walks it.
 */

import { clamp01, smoothstep } from "@/lib/math";

import { ABOUT_FLIP_WINDOW } from "./aboutDeckMath";
import { smootherstep } from "./ringMath";

/** The band's runway in viewport heights (`about-band.css` declares the same
 *  number as `--about-band-runway`; the lockstep test pins them). The band
 *  pins for `RUNWAY − 1` viewports: the flip, the decode, the reading hold. */
export const ABOUT_BAND_RUNWAY_SVH = 2.4;

/** The name and the role scramble in — after the flip has landed, and a
 *  hair after the flip's-end snap seat (`ABOUT_BAND_COVER`): a stop pulled
 *  onto that seat must show the portrait alone, not the decode's first
 *  frame (measured: a window opening ON the seat rested on three leaves of
 *  glyph noise). */
export const ABOUT_BAND_NAME_WINDOW: readonly [number, number] = [0.3, 0.41];

/** The first paragraph types in, one typewriter across its lines. (U3 pulled
 *  both decode windows a hundredth or two earlier so the unfold after them
 *  has room; each keeps the scroll the ladder test asks of it.) */
export const ABOUT_BAND_COPY_WINDOW: readonly [number, number] = [0.41, 0.58];

/** THE READING STATE — the snap seat (ADR-113 §10): a stop near it lands
 *  here, with the portrait on the seat and every text resolved, THE REST
 *  OPEN (U2 — the reading state is the expanded one). Past the open's
 *  threshold by enough scroll that a landing a fraction short of it never
 *  rests on a folding rest: 0.62 → 0.70 with U2.
 *  ⚠ `READ × (RUNWAY − 1) < 1` IS A HARD BOUND, MEASURED IN BLINK (U2): the
 *  reading seat is `.voidwalker__snap`, a `start` area one screen tall at
 *  `READ × travel` from the station's top. Once that top sits a whole
 *  viewport or more below the weld frame (READ × travel ≥ vh, i.e. READ ≥
 *  1/(RUNWAY − 1) = 0.714 at 2.4), Blink treats the seat's FIRST-VISIBLE
 *  position (`top − vh`) as a snap position inside the flip's-end covering
 *  range and pulls every rest within ±60px of the WELD onto it — the ring
 *  band's release seated 6.5px down at 844, 7.1 at 932, and both the seams'
 *  weld case and the ring smoke's About case went red. 0.72 was over the
 *  bound by a hair; 0.70 clears it by 24px of travel at 844; the unit test
 *  pins the product under 0.99. Growing the runway TIGHTENS this bound. */
export const ABOUT_BAND_READ = 0.7;

/** THE REST OF THE BIO UNFOLDS WITH THE THUMB (ADR-115 U3, owner 2026-09-25:
 *  "the transition from the full photo to the smaller photo with the full
 *  paragraph seems to have a step in between"). U2 flipped a boolean at
 *  0.65 that started a 420ms front-loaded grid transition ON THE CLOCK,
 *  after the scroll had stopped — the only timed motion in a band where
 *  everything else is scrubbed, so the reader saw the paragraph land, a
 *  hold, then a jolt and a creep. The rest's height is now a function of
 *  `p` across this window: from the paragraph's landing to the reading seat,
 *  so it lands open ON the seat. ⚠ It starts where the copy ends, never
 *  before: the decode layer measures its lines only while a run is live,
 *  and t = 0 on every one of those frames is what lets the writer drop the
 *  timed re-measure U2 needed. */
export const ABOUT_BAND_REST_WINDOW: readonly [number, number] = [
  ABOUT_BAND_COPY_WINDOW[1],
  ABOUT_BAND_READ,
];

/** THE FLIP'S-END SEAT — `.voidwalker__snap-in` is `100svh + COVER × travel`
 *  tall from the station's top and `end`-aligned, so the one position it
 *  names is its bottom on the fold: the flip landed, the portrait alone.
 *  ⚠ MEASURED IN BLINK (about-band.css's header): an aligned position pulls
 *  every stop within ~280px either way and a covering area never overrides
 *  one — so a stop inside the flip completes the flip here, a stop in the
 *  name's window comes back here, and a stop in the copy's window goes on
 *  to the reading seat. Nothing rests mid-decode. A hair past the flip
 *  (`ABOUT_FLIP_WINDOW[1]` 0.22) and short of the name's window. */
export const ABOUT_BAND_COVER = 0.26;

/** THE DECK SQUARES UP before the handover: the four cards' hand-stacked
 *  x/y jitter (ADR-047's `DECK_OFFSETS`) runs to zero over this window, so
 *  what the DOM takes over from is ONE card — the rear three exactly behind
 *  the front, their edges and their portraits gone. Pure motion. */
export const ABOUT_BAND_SQUARE_WINDOW: readonly [number, number] = [ABOUT_BAND_READ, 0.9];

/** The DOM portrait shows from here (the handover's first half) … */
export const ABOUT_BAND_DONE = 0.995;
/** … and the WebGL deck dies here (its second half). Between the two both
 *  paint, pixel-identical; never neither. */
export const ABOUT_BAND_KILL = 0.999;

/** Below this seat height the portrait hides — a stamp is not a portrait.
 *  The rest of the bio takes its height from the seat when it unfolds,
 *  so on a short phone the slot can shrink under it. */
export const ABOUT_BAND_SLOT_MIN_PX = 140;
/** … and a hidden portrait shows again only from here (U3): the unfold is
 *  scrubbed now, so a drag back and forth across one threshold would
 *  flicker the portrait on and off with the thumb. */
export const ABOUT_BAND_SLOT_SHOW_PX = 150;

/** The share of the services band's EXIT clock over which its copy un-types
 *  (the title lines scramble out, the paragraph un-types from its tail); the
 *  rest of the exit is the deck settling alone. */
export const MOBILE_UNTYPE_WINDOW: readonly [number, number] = [0, 0.7];

/** The band's progress from its station's rect: 0 as it pins, 1 as it
 *  releases. `bandH` is the sticky band's OWN height (ADR-115 U1: the band is
 *  100dvh and the station is in svh, so the travel is the difference, and
 *  only the band's measured box knows it in both of Safari's bar states). */
export function aboutBandProgress(top: number, height: number, bandH: number): number {
  const travel = height - bandH;
  const p = travel > 0 ? clamp01(-top / travel) : 0;
  // `-top / travel` at the pin is `-0` (ADR-102's fourth trap): a stamp
  // prints it as "-0.00" and a harness converging on 0 never lands.
  return p === 0 ? 0 : p;
}

export function aboutBandNameT(p: number): number {
  return smootherstep(ABOUT_BAND_NAME_WINDOW[0], ABOUT_BAND_NAME_WINDOW[1], clamp01(p));
}
export function aboutBandCopyT(p: number): number {
  return smootherstep(ABOUT_BAND_COPY_WINDOW[0], ABOUT_BAND_COPY_WINDOW[1], clamp01(p));
}
/** The rest's unfold (U3). `smoothstep`, not `smootherstep`: ~204px of text
 *  opens over ~140px of scroll at 844, and the steeper curve's 1.875× peak
 *  would move the first paragraph up to ~4× the finger's speed; 1.5× keeps
 *  it near 2×. Zero slope at both ends all the same — the paragraph lands,
 *  then the rest grows, then it lands open on the seat. */
export function aboutBandRestT(p: number): number {
  return smoothstep(ABOUT_BAND_REST_WINDOW[0], ABOUT_BAND_REST_WINDOW[1], clamp01(p));
}
export function aboutBandSquareT(p: number): number {
  return smootherstep(ABOUT_BAND_SQUARE_WINDOW[0], ABOUT_BAND_SQUARE_WINDOW[1], clamp01(p));
}
/** The un-type's own clock from the services exit clock, LINEAR: the kernel
 *  and the typewriter ease per character, so an eased envelope on top would
 *  double-ease (ADR-041's lesson). */
export function mobileUntypeT(exit: number): number {
  const [a, b] = MOBILE_UNTYPE_WINDOW;
  return clamp01((clamp01(exit) - a) / (b - a));
}

/** The snap target's offset inside the runway: the reading state's scroll,
 *  measured from the station's top. */
export function aboutBandSnapOffset(runwayPx: number, vh: number): number {
  return ABOUT_BAND_READ * Math.max(0, runwayPx - vh);
}

/** The flip window this band shares with the ring — re-exported so the
 *  writer and the test name one source. */
export const ABOUT_BAND_FLIP_WINDOW = ABOUT_FLIP_WINDOW;
