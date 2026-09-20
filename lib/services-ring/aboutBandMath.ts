/**
 * aboutBandMath — the phone's about BAND, as numbers (ADR-114).
 *
 * On the ring rung `#about` is a sticky band inside a runway of
 * `ABOUT_BAND_RUNWAY_SVH` viewports: the deck FLIPS to the portrait on
 * ADR-047's own window (`ABOUT_FLIP_WINDOW`, shared with the ring), the name
 * and the role SCRAMBLE in, the first paragraph TYPES in, and the band holds
 * for reading until it unpins. Every window is a fraction of the band's
 * pinned travel, read by ONE writer (`useAboutBandScroll`) and mirrored by
 * nothing — the ring reads the same `aboutStageProgressRef` the desktop
 * stage writes, so the flip needs no phone copy of its clock.
 *
 * Three-free and DOM-free; `tests/lib/about-band-math.test.ts` walks it.
 */

import { clamp01 } from "@/lib/math";

import { ABOUT_FLIP_WINDOW } from "./aboutDeckMath";
import { smootherstep } from "./ringMath";

/** The band's runway in viewport heights (`about-band.css` declares the same
 *  number as `--about-band-runway`; the lockstep test pins them). The band
 *  pins for `RUNWAY − 1` viewports: the flip, the decode, the reading hold. */
export const ABOUT_BAND_RUNWAY_SVH = 2.4;

/** The name and the role scramble in — after the flip has landed. */
export const ABOUT_BAND_NAME_WINDOW: readonly [number, number] = [0.26, 0.4];

/** The first paragraph types in, one typewriter across its lines. */
export const ABOUT_BAND_COPY_WINDOW: readonly [number, number] = [0.4, 0.62];

/** THE READING STATE — the snap seat (ADR-113 §10): a stop near it lands
 *  here, with the portrait on the seat and both texts resolved. */
export const ABOUT_BAND_READ = ABOUT_BAND_COPY_WINDOW[1];

/** The DOM portrait shows from here (the handover's first half) … */
export const ABOUT_BAND_DONE = 0.995;
/** … and the WebGL deck dies here (its second half). Between the two both
 *  paint, pixel-identical; never neither. */
export const ABOUT_BAND_KILL = 0.999;

/** Below this seat height the portrait hides — a stamp is not a portrait.
 *  The chevron's expanded copy takes its height from the seat, so on a
 *  short phone the slot can shrink under it. */
export const ABOUT_BAND_SLOT_MIN_PX = 140;

/** The share of the services band's EXIT clock over which its copy un-types
 *  (the title lines scramble out, the paragraph un-types from its tail); the
 *  rest of the exit is the deck settling alone. */
export const MOBILE_UNTYPE_WINDOW: readonly [number, number] = [0, 0.7];

/** The band's progress from its station's rect: 0 as it pins, 1 as it
 *  releases (`useAboutStageScroll`'s own expression, on the layout viewport). */
export function aboutBandProgress(top: number, height: number, vh: number): number {
  const travel = height - vh;
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
