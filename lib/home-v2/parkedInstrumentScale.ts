import { clamp01 } from "@/lib/math";

/**
 * Viewport-aware scale boost for the parked #services instrument
 * (ADR-044 addendum, 2026-07-16).
 *
 * Root cause: `getCameraFov` (sceneGeom) returns a CONSTANT 38° vertical
 * FOV for every landscape aspect, so the parked front card is locked to
 * ~42% of viewport HEIGHT on all desktop sizes — small in absolute
 * pixels on 800–900px-tall laptops, while the card's WIDTH fraction
 * grows as aspect narrows (which is also what crowds the masthead's
 * right paragraph). Rather than touch the camera or the unit-pinned
 * ring math, the parked instrument (mark + orbits + card ring, ONE rig)
 * scales up by this multiplier on MacBook-class viewports only.
 *
 * Applied exclusively to the parked lerp TARGET in
 * `BrandmarkPhysicsCoreActor` (`CENTER_TARGET_SCALE * mul`), so every
 * `recT = 0` frame — the whole corridor and the SVG handoff — is
 * byte-identical to the pre-change render. The ADR-047 deck-flip seat
 * math self-compensates: it divides by the live `matrixWorld` parent
 * scale per frame, so the flipped deck still lands exactly on the DOM
 * portrait slot.
 */
export const PARKED_SCALE_BOOST_MAX = 0.15;

/** Aspect at/above which the boost is fully OFF (16:9 and wider). */
const WIDE_ASPECT_OFF = 16 / 9;
/** Aspect at/below which the aspect term is fully ON (16:10-class). */
const WIDE_ASPECT_ON = 1.62;
/** Guard: below this aspect the boost fades back out — near-square
 *  desktop windows keep today's framing (portrait is handled by the
 *  camera's own FOV widening and never reaches this code path). */
const SQUARE_ASPECT_OFF = 1.3;
const SQUARE_ASPECT_ON = 1.4;
/** Viewport heights (px): full boost at/below 1000, none at/above 1100. */
const SHORT_VH_ON = 1000;
const SHORT_VH_OFF = 1100;

function smooth01(t: number): number {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
}

/**
 * Multiplier for the parked instrument scale. 1 exactly on wide (≥16:9)
 * or tall (≥1100px) viewports and for portrait/invalid input; ramps
 * smoothly to `1 + PARKED_SCALE_BOOST_MAX` (≈1.15) on MacBook-class
 * viewports (aspect ~1.5–1.6, height ≤1000px). Every edge is a
 * smoothstep so window resizes never pop.
 *
 * Pinned by tests/lib/parked-instrument-scale.test.ts:
 *   1440×900, 1280×800, 1512×982 → 1.15
 *   1920×1080, 2560×1440, 2560×1600 → 1.0
 *   1680×1050 → ~1.07 (mid-ramp)
 */
export function getParkedInstrumentScaleMul(aspect: number, viewportHeightPx: number): number {
  if (!Number.isFinite(aspect) || !Number.isFinite(viewportHeightPx) || aspect < 1) return 1;
  const wideFade = smooth01((WIDE_ASPECT_OFF - aspect) / (WIDE_ASPECT_OFF - WIDE_ASPECT_ON));
  const squareFade = smooth01(
    (aspect - SQUARE_ASPECT_OFF) / (SQUARE_ASPECT_ON - SQUARE_ASPECT_OFF)
  );
  const heightFade = smooth01((SHORT_VH_OFF - viewportHeightPx) / (SHORT_VH_OFF - SHORT_VH_ON));
  return 1 + PARKED_SCALE_BOOST_MAX * wideFade * squareFade * heightFade;
}
