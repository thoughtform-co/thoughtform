/**
 * What the three lab drawings share with the shipped one.
 *
 * ⚠ **THE KIT LIVES IN PRODUCTION NOW** (2026-08-12). It was authored here at
 * reading 02's crop width precisely so that a promoted winner would be a copy
 * rather than a re-fit — and the pin grid is that winner (ADR-070 U15), so
 * `Tap`, `DeptHead`, `housing`, the type ladder and the spec emitters moved to
 * `map/pda/substrateKit` and this file re-exports them. Two copies of a
 * measured drawing is how a lab starts passing what production would fail.
 *
 * ⚠ ONE ADVANCE MODEL FOR BOTH LABS AND THE DRAWING. `adv` / `specWidth` /
 * `LetterSpec` are production's now too (`map/pda/pdaLetters`): PT Mono's
 * advance is a property of the font, not of a route.
 */

import { FS as FS_SHIPPED } from "@/components/landing/home-v2/services/casefile/map/pda/substrateKit";

export {
  DEPT_UNIT,
  DeptHead,
  FS_FLOOR,
  SubstrateHatch,
  Tap,
  TRACK,
  byMass,
  deptSpecs,
  housing,
  shapeSpecs,
  tappers,
  totalSkills,
} from "@/components/landing/home-v2/services/casefile/map/pda/substrateKit";

/**
 * ⚠ `hero` IS THE LAB'S OWN RUNG, and it stays here rather than in production.
 * The crossing table and the containment drawing letter the estate's 47 as a
 * headline; the pin grid does not — its five row counts sum to 47 in plain
 * sight and the proof register beside it already claims the total, so a sixth
 * number would be the surface saying something twice. Production's ladder
 * carries no rung it does not draw.
 */
export const FS = { ...FS_SHIPPED, hero: 22 } as const;

export { adv, specWidth } from "@/components/landing/home-v2/services/casefile/map/pda/pdaLetters";
export type { LetterSpec } from "@/components/landing/home-v2/services/casefile/map/pda/pdaLetters";

/* ── The lab's own crop ─────────────────────────────────────────────────
   ⚠ ONE CROP FOR ALL THREE DIRECTIONS, and it is reading 02's width. The
   comparison is only worth making in the same box, and sharing 932 is what
   let the winner inherit U12's elastic treatment unchanged. 762 is that width
   at the binding preset's field aspect (603 × 493 = 1.223).

   ⚠ THE LAB'S CROP IS STATIC and production's is not any more — the shipped
   baseline mounted here draws at REST. The lab's housing is a fixed preset, so
   there is no field shape for a crop to be derived from. */
export const SUB_VIEWBOX = "0 0 932 762";
export const CROP_W = 932;
export const CROP_H = 762;

/** The width chain. Every variant hangs off these three. */
export const PAD = 26;
export const L = PAD;
export const R = CROP_W - PAD;
export const W = R - L;
