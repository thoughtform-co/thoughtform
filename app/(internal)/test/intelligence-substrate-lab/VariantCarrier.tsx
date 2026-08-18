"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import type { CaseMapShapeKey, CaseSkillEntry } from "@/lib/cases/types";

import { wrapLines } from "@/components/landing/home-v2/services/casefile/map/pda/pdaGlyphs";
import { isFormKey } from "@/components/landing/home-v2/services/casefile/map/pda/substrateForms";

import { Field } from "./roundSix";
import { FS, adv, type LetterSpec } from "./substrateKit";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 38 · COMPOUND CARRIER — a dial. Forty-seven cells, each lettered along its
 * own arc; five substrate names lettered along a band between hub and cells.
 *
 * ## Why the labels are rotated, and why they had to be
 *
 * ⚠ **FORTY-SEVEN HORIZONTAL LABELS ARE GEOMETRICALLY IMPOSSIBLE ON THIS
 * PLATE, AND ONE ROTATED LABEL PER CELL IS THE ONLY WAY OUT** (owner,
 * 2026-08-18: _"we have to make sure that the labels for each of these skills
 * are visible"_). The annulus held 299 520 square units, so each of 47 equal
 * cells got 6 373. A 14-character name at `LABEL_FS` 12 measures 108 units;
 * for it to sit HORIZONTAL in a cell **anywhere on the ring** the cell needs
 * 108 units in BOTH directions — because a cell at 3 o'clock is turned ninety
 * degrees from one at 12 — which is 11 664 per cell. That is 1.83× the area
 * that exists. Shrinking type to close the gap drops through the surface's 12
 * floor and lands under 6 px rendered. So the rotation is not a stylistic
 * choice; it is what makes the drawing letter its whole roster at a legible
 * size. Every other rotation on this site is 45° on a shape (ADR-060, ADR-
 * 065). This is the first rotated TYPE on the surface, and it is called out
 * because the next pass looking for consistency will reach for it.
 *
 * ## The course ladder is derived now, not authored
 *
 * ⚠ **U28–U30's LADDER ARGUED THE COUNT CANCELS. IT DID — AND THE NAMES DO
 * NOT.** The old rule was `n >= 10 ? 3 : 2` because the count is the only
 * lever left on grain once cell area is solved for. Once the label needs to
 * fit the cell's arc, `longestChars` breaks the symmetry: the ladder is
 * derived by picking the composition of `n` cells into courses whose inner
 * arc clears the part's own worst name plus 14 units of padding. Inner
 * courses hold FEWER cells now (`[2,3,3,3,3]` for Pattern, `[1,2,2,2,2]` for
 * Validation), so the arc grows inward instead of shrinking, which is exactly
 * the wrong way round for the U28-era ladder and exactly the right way round
 * for lettering.
 *
 * Cell AREA still falls out equal: the course boundaries are still solved for
 * area share, so the honesty claim is untouched. What moves is the ASPECT
 * ratio — a name's target arc no longer cancels the count.
 *
 * ## The substrate name lives in a BAND now, not on a plate
 *
 * ⚠ **THE NAMEPLATE WAS INSIDE ITS PART, WHICH WAS THE RIGHT ANSWER FOR THE
 * WRONG PROBLEM.** U27's plate sat on the part's mid-ray at a shared `R_LAB`,
 * fifteen clearances proven — and the whole affair covered a cell it did not
 * name. With every cell now lettered at rest, a nameplate that sits on top of
 * (say) Pattern-c3 is two labels claiming that region: one big and general,
 * one small and specific. So the substrate name moves off the annulus and
 * into a NEW BAND — carved off the inner edge of the cells, running from
 * `R_HUB` (156) to `R_CELL` (192) — and letters along the band's arc at
 * `BAND_R` (174). That is the same tangent grammar as the cells' labels, one
 * level up: one drawing, one direction, one law about which way type reads
 * on this plate.
 *
 * ## Where the air came from (U32)
 *
 * ⚠ **NOTHING WAS OVERFLOWING; THE PLATE WAS SMALLER THAN ITS OWN FIELD**
 * (owner, 2026-08-18: _"it's very crammed … make sure every label fits inside
 * the frame"_). Measuring each RENDERED label against its OWN cell arc found 24
 * to 79 units of slack and not one spill, so "fits" was never the defect. Three
 * other things were: the plate left 110 units of gutter per side inside its own
 * crop and 74 units of slack above and below it; the crop was STATIC while
 * every production reading is elastic, so two of the three presets letterboxed;
 * and the depth floor let through 24-unit cells holding 14-unit line boxes.
 * Net: label **7.75px → 8.07px** at the binding preset — over the map's
 * banned-under-8 line for the first time on this drawing — and 10.94px →
 * 12.44px at p1920; minimum cell depth 24 → 29 units; worst cell aspect
 * 9.4 → 8.3.
 *
 * ⚠ **THE HUB WAS NOT WHAT THE CELLS WERE SHORT OF**, though it looks like it
 * and the owner offered it. See `R_HUB`: pulling the cells inward shortens the
 * tightest arc on the plate, so the air is bought from the RIM instead. The
 * hub's 8 units went to the BAND, which was the one region genuinely pinched.
 *
 * ⚠ **AND THE TYPE HAD TO STEP WITH THE PLATE.** A thicker annulus grows the
 * crop, and type authored in UNITS shrinks when the crop grows — so `R_OUT` 384
 * and `LABEL_FS` 13 are ONE decision, not two. Either alone makes the drawing
 * worse: the rim alone costs 6 % of the type, the size alone overruns the
 * ladder.
 *
 * ## What is inside the hub, and what left the drawing
 *
 * The hub keeps its U30 fill (soft Tensor gold, `--pda-hub` / `--pda-hub-
 * grain`), still letters the brief at rest and the clicked Skill's identity
 * when pinned. **The hover tag is deleted** — a tag that names the cell under
 * the pointer is redundant once the cell is always named. Hover keeps the LIT
 * cell and the dimming; click still commits the hub.
 */

/* ── The plate ──────────────────────────────────────────────────────────── */

const SIDES = 12;
/** Flat top and floor: vertices straddle the vertical axis by 15°. */
const POLY_ROT = -105;
/** cos(180/SIDES) — a regular polygon's apothem over its circumradius. */
const KAPPA = Math.cos(Math.PI / SIDES);

const CX = 466;
/**
 * The hub's outer edge — the aperture the cells stop short of. Also the band's
 * inner edge, since the band sits between hub and cells.
 *
 * ⚠ **164 → 156, AND THE 8 UNITS GO TO THE BAND, NOT TO THE CELLS.** The
 * intuitive reading of "the plate is crammed, so shrink the middle" is that
 * hub units are cell units in the wrong place. They are not: `R_CELL` is the
 * radius the INNERMOST course letters at, and a course's arc is `R_CELL ×
 * sweep / m`, so pulling the cells inward makes the tightest arc on the plate
 * TIGHTER. Sweeping the whole (hub, cell, rim) space showed air rising
 * monotonically with `R_HUB` — the hub is not what the cells are short of.
 * So the hub gives up 8 units to the BAND (30 → 38 deep, which is where the
 * substrate names were genuinely pinched at 8 units of clearance), and the
 * cells are paid from the RIM instead.
 */
const R_HUB = 156;
/**
 * ⚠ **THE EDGE THAT DOES NOT MOVE.** The band that letters the five substrate
 * names runs from `R_HUB` to `R_CELL`, and the cells run from `R_CELL` outward.
 * This is what pays for the substrate names being on the plate at all — a
 * nameplate that sits ON A CELL claims that region while the cell claims a
 * Skill inside it, and two claims per pixel is one claim too many.
 *
 * ⚠ It barely moved in the U32 re-cut (194 → 192) while BOTH its neighbours
 * did, because it is the one radius constrained from each side: pull it in and
 * the innermost course's arc shortens (that arc is `R_CELL × sweep / m`, the
 * tightest measure on the plate); push it out and the band's own arc grows
 * while the annulus thins. It sits within 4 units of the swept optimum either
 * way, so the band was widened from the HUB's side and the cells from the
 * RIM's, and this edge just held station between them.
 */
const R_CELL = 192;
/**
 * ⚠ **356 → 384: THE CELLS' RADIAL AIR IS BOUGHT HERE, AND IT IS NOT FREE.** A
 * thicker annulus is the only lever that adds radial room without shortening
 * an arc, but the crop grows with it (`2κR + 52`) and type is authored in
 * UNITS — so a bigger plate paints the same label SMALLER. The trade is paid
 * for by raising `LABEL_FS` one step in step with it, which is why both moved
 * in one edit: at `R_OUT` 384 with `LABEL_FS` 13 the label lands at 8.07px
 * against U31's 7.75px, so the type comes out AHEAD while the minimum cell
 * depth goes 24 → 29 units and the worst cell aspect 9.4 → 8.3.
 *
 * ⚠ `κ · 384` = 370.92 against `CY` 397 — the rim sits 26.08 units inside the
 * crop, so the 26-unit pad is spent to within a tenth and there is no cushion
 * left at this rim. Growing it further needs a taller crop, and a taller crop
 * costs type that only another `LABEL_FS` step could win back — and the next
 * step up does not fit the ladder (see `LABEL_FS`).
 */
const R_OUT = 384;

/* ── The crop ───────────────────────────────────────────────────────────── */

/**
 * ⚠ **THE PLATE IS HEIGHT-SCARCE AT EVERY FIELD SHAPE, SO THE HEIGHT IS THE
 * FIXED TERM AND THE WIDTH IS THE ELASTIC ONE.** This is ADR-070 U12's
 * argument, inverted, and it is inverted because the object is different: the
 * R4 board is a wide drawing in a field that runs narrow, so its crop fixes
 * the WIDTH; the carrier is a regular dodecagon, whose aspect is the constant
 * `1/κ` = 1.035, in fields that measure 1.056 (p1920) to 1.148 (p1440) — every
 * one of them wider than the plate. The scarce dimension is therefore always
 * the vertical, at every preset, with no crossover.
 *
 * ⚠ **THE STATIC CROP WAS LETTERBOXING BOTH WAYS AND EVERY GUARD WAS GREEN.**
 * U31's `932 × 762` is aspect 1.223 against p1280's field aspect 1.133, so
 * `meet` took the WIDTH ratio (0.658) and left the height ratio (0.710)
 * unspent — and inside that crop the plate itself left 110 units of gutter per
 * side. The compounded waste put a 12-unit label on screen at 7.89px, under
 * the map's banned-under-8 line, while `minPx` reported it as clearing the 4.3
 * hard floor. **A fit gate that only knows a hard floor cannot see a drawing
 * that is merely half the size it could be** — which is why the guard for this
 * asserts height-boundedness and an 8px label, not a floor.
 *
 * ⚠ **ALL THREE TERMS ARE DERIVED FROM THE PLATE, NOT AUTHORED BESIDE IT.**
 * They were literals for one edit and `CY` immediately drifted 13 units from
 * the raster that measures the material fields. A crop is a consequence of a
 * radius; writing it down twice is writing down a thing that can disagree.
 *
 * ⚠ **26 → 18: THE PAD IS THE ONE PLACE THIS DRAWING BUYS TYPE FOR NOTHING.**
 * Every other lever is a trade — a thicker annulus grows the crop, a bigger
 * `LABEL_FS` re-cuts the ladder, a smaller hub shortens the innermost arc. The
 * pad is different: the fit is height-bound, so `meet` is `field.h / CROP_H`
 * and shrinking `CROP_H` scales EVERY label up without moving one radius. 18
 * takes `CROP_H` 794 → 778 and `meet` 0.6213 → 0.6337 at the binding preset,
 * i.e. **+2.0 % on all 52 strings at once**.
 *
 * ⚠ It is a MARGIN, not slack, which is why it is not spent to zero. `κ·R_OUT`
 * = 370.92 sits 18.08 units inside the crop, and at the binding preset that
 * paints an 11.4px gap between the plate's outer rule and the console field's
 * wall. ADR-064's bleed law is about a CAPTURE filling its bay; a technical
 * drawing whose outermost machined edge touches the housing has lost its
 * margin, so this number has a floor somewhere near here and it is the reason
 * the remaining 8 units were not taken too.
 */
const CROP_PAD = 18;
/** ⚠ EXPORTED BECAUSE THE GUARD HELD IT AS A LITERAL AND IT MOVED — the same
 *  defect `CY` produced one pass earlier, in the same file, for the same
 *  reason. A crop is a consequence of a radius and a pad; anything that
 *  re-states either is a thing that can disagree with the drawing. */
export const CARRIER_CROP_PAD = CROP_PAD;
/** `2κ·R_OUT + 2·pad`, rounded up to even so `CY` is a whole unit. */
export const CARRIER_CROP_H = 2 * Math.ceil(KAPPA * R_OUT + CROP_PAD);
/** The plate's own width plus the pad — the floor the elastic width cannot cross. */
export const CARRIER_CROP_W_MIN = 2 * (R_OUT + CROP_PAD);

const CY = CARRIER_CROP_H / 2;

/**
 * The crop for a field of aspect `w / h`.
 *
 * ⚠ **THE WIDTH GROWS AROUND A FIXED `CX`, VIA THE viewBox's X OFFSET.** The
 * obvious form is a centred crop (`-W/2 -H/2 W H`), and it would mean every
 * coordinate in this file is expressed against a moving origin. Holding `CX`
 * still and sliding the crop's left edge instead leaves all 47 cells, five
 * fields and both label rings written against constants — the elasticity lives
 * in one expression rather than in every path.
 *
 * ⚠ **`floor`, NOT `round`, AND THE DIRECTION IS THE CONTRACT.** Rounding the
 * width UP makes the crop's aspect wider than the field's, which flips `meet`
 * back to the width ratio and re-opens the very letterbox this closes — by
 * 0.014 % at p1280, invisible on screen and exactly the kind of term that
 * makes a contract "mostly" hold. Flooring keeps the crop's aspect at or under
 * the field's, so the fit is height-bound by construction and the surplus
 * lands as honest horizontal gutter.
 */
export function carrierCrop(fieldAspect: number): string {
  const w = Math.max(CARRIER_CROP_W_MIN, Math.floor(CARRIER_CROP_H * fieldAspect));
  return `${CX - w / 2} 0 ${w} ${CARRIER_CROP_H}`;
}

/** The rest crop — the narrowest a field can ask for, used where none is known. */
export const CARRIER_VIEWBOX = carrierCrop(0);

/* ── The rings inside the plate ─────────────────────────────────────────── */

/**
 * The band's mid-radius, where each substrate name letters along its arc. The
 * midpoint of the band is the natural centre; at 38 units deep that is 19
 * units of clearance to either edge against a 14-unit line box, so 12 units of
 * real air per side where U31 had 8.
 */
const BAND_R = (R_HUB + R_CELL) / 2;

/**
 * The hub's grain pitch. ⚠ A flat fill in a drawing where every other region
 * carries a physics field reads as a hole plugged with paint, not as material —
 * so the hub gets a grain too. It is the quietest field on the plate on
 * purpose: this is the one region that is not a substrate shape, so it may have
 * texture without having a pattern.
 */
const GRAIN_PITCH = 5;

/**
 * ⚠ **THE LABEL RUNG, MEASURED — AND 12 → 13 IS WHAT PAYS FOR THE BIGGER
 * RIM.** U31 sat at the surface's 12 floor and rendered 7.75px at the binding
 * preset, under the map's banned-under-8 line. Every lever that adds radial
 * room grows the crop, and a bigger crop paints a unit-authored label smaller,
 * so the only way to buy air AND cross 8px was to step the type with the plate:
 * at `R_OUT` 384 a 13-unit label lands at **8.07px**, over the line for the
 * first time on this drawing.
 *
 * ⚠ **14 DOES NOT FIT AND THAT IS A LADDER FACT, NOT A TASTE ONE.** A step to
 * 14 widens every name by 7.7 %, and `Tracker Check` on `validation`'s sweep
 * already binds at 13 — the ladder would have to re-cut to a coarser
 * composition, which trades the depth this pass just bought straight back. 13
 * is the top of the range this geometry supports.
 *
 * `LABEL_TRACK` stays deliberately low: labels sit ON the arc, so any tracking
 * widens the sagitta a straight-text fallback would have to spend.
 */
const LABEL_FS = 13;
const LABEL_TRACK = 0.02;
/**
 * ⚠ THE ARC HAS TO CLEAR THE NAME PLUS THIS ON EACH END OR THE LADDER RE-CUTS.
 *
 * ⚠ **14 → 12, AND THE AIR STILL WENT UP.** The pad is a FLOOR the ladder
 * solves against, not the clearance the drawing ends up with: raising it forces
 * coarser courses (fewer, wider, SHALLOWER cells), so a bigger pad buys side
 * air the labels did not need by spending radial air they did. At 12 the
 * achieved minimum clearance is 24 units per end — double the floor — because
 * the binding constraint moved to `MIN_CELL_DEPTH`, which is where it belongs.
 */
const LABEL_PAD = 12;

/**
 * How far a line's INK CENTRE sits above its own baseline, in em.
 *
 * ⚠ **`textPath` PUTS THE BASELINE ON THE CURVE, AND A BASELINE IS NOT A
 * CENTRE — SO EVERY LABEL ON THIS PLATE HUGGED ONE WALL.** The arcs are cut at
 * each cell's mid-depth, which centres the thing the renderer is given and not
 * the thing the reader sees: measured on the live face, a Skill's ink runs from
 * `baseline − 0.769em` to `baseline + 0.231em`, so its ink block sat 0.269em
 * (3.5 units at `LABEL_FS` 13) off centre. In a 35-unit course that is 11 units
 * of air against 18 on the far wall — **the label pressed to one side with a
 * corridor of empty material beside it**, which is exactly the reading the
 * owner called crammed.
 *
 * ⚠ **AND THE SIDE IT LEANS ON FLIPS AT THE HORIZON.** The bottom half's arc is
 * traversed in reverse so the type is not upside down (`carrierCellArcPath`),
 * which also reverses the glyphs' up-vector — so the top half leaned OUTWARD
 * and the bottom half INWARD. Nothing collided, every arc measure passed, and
 * the plate still read as unresolved because the same rule produced opposite
 * offsets on the two halves. Correcting it recovers ~3.5 units on whichever
 * wall each label was nearest, at no cost anywhere, and makes one grammar out
 * of two.
 *
 * ⚠ **THE TWO FAMILIES NEED DIFFERENT NUMBERS AND IT IS NOT A TUNING CHOICE.**
 * A Skill is sentence case, so ascenders and descenders both land and the ink is
 * near-symmetric about the em. A substrate name is uppercase, where nothing
 * falls below the baseline at all — its ink runs `baseline − capHeight` to
 * `baseline`, so its centre is a full half cap-height up. Using one constant for
 * both puts the band names 2.3 units low in their own recess.
 */
const LABEL_INK_MID = 0.269;
/** Half of PT Mono's cap height — an uppercase run has no descender to offset. */
const BAND_INK_MID = 0.35;

/**
 * Half the INK's own height, in em — a different metric from `*_INK_MID` and the
 * one the clearances are measured against.
 *
 * ⚠ **THE CENTRE OFFSET AND THE HALF-HEIGHT ARE NOT THE SAME NUMBER, AND
 * CONFLATING THEM IS A GUARD THAT REPORTS A LEAN THAT ISN'T THERE.** For a
 * sentence-case Skill the ink runs `baseline − 0.769em … baseline + 0.231em`:
 * its CENTRE is 0.269em above the baseline (the half-difference) while its
 * HALF-HEIGHT is 0.500em (the half-sum). The first says where to cut the arc,
 * the second says how much wall the block eats. They coincide only for a run
 * with no descender — which is exactly the band's case, and why `BAND_INK_MID`
 * and `BAND_INK_HALF` are the same 0.35 while the Skill's two differ.
 */
const LABEL_INK_HALF = 0.5;
/** Uppercase: the ink IS the cap block, so its half-height is its half-height. */
const BAND_INK_HALF = BAND_INK_MID;

/**
 * The band's own rung. Uppercase substrate names, tracked wider than a Skill —
 * `PATTERN` reads STRUCTURAL where a Skill reads NAMED.
 *
 * ⚠ **12 → 13, AND THE STEP WAS PAID FOR OUT OF THE TRACK, NOT THE ARC.** U32
 * left the band one rung under a Skill and argued the register from CAP HEIGHT
 * — true as far as it goes, and it missed that `BAND_FS` was setting the
 * SMALLEST LETTERING ON THE PLATE. At 12 the band painted **7.46px** at the
 * binding preset while every Skill cleared 8, so the drawing's reported floor
 * was a number no cell was responsible for: the gate said 7.46 and the thing
 * it named was the five region names, which are the most structural strings
 * here. A measured sweep of the whole plate is what surfaced it — reading
 * `minPx` alone tells you the floor moved and never which family owns it.
 *
 * ⚠ **`STAKEHOLDER` IS THE BINDING NAME AND THE TRACK IS THE LEVER THAT FREED
 * IT** — the LONGEST label on the NARROWEST part's 37° sweep, which is 100u of
 * arc after `BAND_PAD`. At 13/0.08 it needs 97u (1.3u per end, a collision
 * waiting for a one-character content edit, which is why U32 refused the step).
 * At 13/**0.05** it needs 93u, i.e. **3.75u per end** — and the plate's
 * smallest lettering goes 7.46 → 8.24px with the crop's own gain compounded in.
 * The chrome grammar is DIRECTION (uppercase, tracked WIDER than a Skill's
 * 0.02), never a specific step, so 0.05 still reads structural against a name.
 *
 * ⚠ It matches `LABEL_FS` now rather than sitting under it, and the register
 * still ranks correctly for the reason U32 got right: uppercase at 13 carries a
 * 9.1u cap height against sentence case's 6.5u x-height, so **the band reads
 * larger than the Skills it heads at the same font size**. Cap height is the
 * perceived size of a tracked uppercase run, and the ranking a reader sees is
 * the one that matters.
 */
const BAND_FS = 13;
const BAND_TRACK = 0.05;
const BAND_PAD = 6;

/**
 * The floor for cell depth — the derived ladder's second constraint, and the
 * reason inner courses hold fewer cells.
 *
 * ⚠ **22 → 26, WHICH IS WHAT "CRAMMED" ACTUALLY MEANT.** At 22 the floor let
 * through cells of 226 × 24 and 227 × 24: a 14-unit line box in a 24-unit band
 * is 5 units of air per side against 21 units at the ends, an aspect of 9.4,
 * and the reader sees a name pressed between two walls with a corridor of empty
 * material beside it. **The arcs were never the problem** — a per-cell
 * measurement of the rendered text against its own arc found 24 to 79 units of
 * slack and not one spill. 26 forbids the shallow cells outright and the ladder
 * re-cuts around it; the achieved minimum is 29, so this is a guard with three
 * units of margin rather than a value the drawing sits exactly on.
 */
const MIN_CELL_DEPTH = 26;

/** Five structural clearances, removed from the 360° sweep before it is split. */
const GROUP_GAP = 2.4;
/** One cell's total angular clearance — 2.2 units of gap at the label rung. */
const CELL_GAP = 0.5;
/** Radial clearance at an INTERNAL course seam. The rim and the inner ring
 *  stay flush: a cell that does not reach the wall it is bounded by reads as
 *  a margin, and this plate has no margin. */
const COURSE_GAP = 1.8;

/** The last seam lands symmetric about the horizontal, by construction. */
const START = -180 + GROUP_GAP / 2;

export const CARRIER_ORDER: readonly CaseMapShapeKey[] = [
  "pattern",
  "judgment",
  "validation",
  "voice",
  "stakeholder",
];

/* ── Polygon geometry ───────────────────────────────────────────────────── */

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Signed angle in [-period/2, period/2). */
const wrapped = (n: number, period: number) =>
  ((((n + period / 2) % period) + period) % period) - period / 2;

/**
 * Distance from the centre to a regular polygon's edge on ray `angle`, for a
 * polygon given by its circumradius and this file's vertex rotation.
 */
export function polygonRayRadius(angle: number, circumradius: number): number {
  const period = 360 / SIDES;
  const edgeNormal0 = POLY_ROT + period / 2;
  return (circumradius * KAPPA) / Math.cos(rad(wrapped(angle - edgeNormal0, period)));
}

/**
 * Half the polygon's width on the HORIZONTAL line `dy` above or below centre.
 *
 * ⚠ `polygonRayRadius` cannot answer this. It measures along a RAY from the
 * centre, and a scanline is a chord — the two coincide only at `dy = 0`. Using
 * the ray radius for a raster gives a screen with a rounded-looking edge that
 * misses the wall by up to 6 % where it matters most.
 *
 * The polygon is symmetric about its vertical axis at this rotation (vertices
 * straddle ±90°), so one half serves both. Each edge is a half-plane `n·p ≤ a`,
 * which for a fixed `y` solves straight to `x ≤ (a − n_y·dy) / nₓ`.
 */
export function hubHalfWidth(dy: number, circumradius: number): number {
  const apothem = KAPPA * circumradius;
  let x = Infinity;
  for (let i = 0; i < SIDES; i += 1) {
    const na = rad(POLY_ROT + 180 / SIDES + (i * 360) / SIDES);
    const nx = Math.cos(na);
    if (nx <= 1e-9) continue;
    x = Math.min(x, (apothem - Math.sin(na) * dy) / nx);
  }
  return Math.max(0, x);
}

export interface CarrierPoint {
  x: number;
  y: number;
}

/**
 * Clear distance from an axis-aligned box to the nearest wall of the hub.
 *
 * ⚠ **THE RAY THROUGH A BOX'S CENTRE IS THE WRONG MEASUREMENT AND IT PASSES.**
 * Backing the half-diagonal off `polygonRayRadius(cornerAngle)` is the intuitive
 * check and it reads the wall at ONE angle, while the corner that actually
 * collides sits at another where the wall can be nearer — U28's tag clamp
 * failed by 0.1 units on exactly this. A box is inside a convex polygon iff it
 * clears every edge, which for an axis-aligned box is one linear test per edge.
 */
function boxClearance(dy: number, hw: number, hh: number, circumradius: number): number {
  const apothem = KAPPA * circumradius;
  let clear = Infinity;
  for (let i = 0; i < SIDES; i += 1) {
    const na = rad(POLY_ROT + 180 / SIDES + (i * 360) / SIDES);
    const nx = Math.cos(na);
    const ny = Math.sin(na);
    clear = Math.min(clear, apothem - ny * dy - Math.abs(nx) * hw - Math.abs(ny) * hh);
  }
  return clear;
}

export function polygonRayPoint(angle: number, circumradius: number): CarrierPoint {
  const r = polygonRayRadius(angle, circumradius);
  return { x: CX + r * Math.cos(rad(angle)), y: CY + r * Math.sin(rad(angle)) };
}

/**
 * The polygon ring between two angles, AS A POLYLINE — every vertex inside
 * the span is emitted.
 *
 * ⚠ A CHORD IS NOT AN EDGE ONCE A PART SPANS MORE THAN ONE OF THEM. Pattern
 * sweeps 103.66°, which is three and a half of the dodecagon's twelve edges;
 * closing that with a single chord cuts 44 units inside the rim and takes the
 * part's area with it. 37 could ignore this because a 7.4° shard never
 * contains more than one vertex.
 */
function ringArc(a0: number, a1: number, r: number): CarrierPoint[] {
  const step = 360 / SIDES;
  const lo = Math.min(a0, a1);
  const hi = Math.max(a0, a1);
  const angles: number[] = [a0, a1];
  for (let i = Math.ceil((lo - POLY_ROT) / step); i <= Math.floor((hi - POLY_ROT) / step); i += 1) {
    const a = POLY_ROT + i * step;
    if (a > lo && a < hi) angles.push(a);
  }
  angles.sort((x, y) => (a1 < a0 ? y - x : x - y));
  return angles.map((a) => polygonRayPoint(a, r));
}

const pt = (p: CarrierPoint, dx = 0, dy = 0) => `${(p.x - dx).toFixed(2)},${(p.y - dy).toFixed(2)}`;

/** A ring segment, closed: outer polyline out, inner polyline back. */
function sectorPath(a0: number, a1: number, r0: number, r1: number, dx = 0, dy = 0): string {
  const ring = [...ringArc(a0, a1, r1), ...ringArc(a1, a0, r0)];
  return `M${ring.map((p) => pt(p, dx, dy)).join(" L")} Z`;
}

/** A regular polygon at the plate's centre. */
export function polygonPath(circumradius: number): string {
  return (
    Array.from({ length: SIDES }, (_, i) => {
      const a = POLY_ROT + (i * 360) / SIDES;
      const p = {
        x: CX + circumradius * Math.cos(rad(a)),
        y: CY + circumradius * Math.sin(rad(a)),
      };
      return `${i === 0 ? "M" : "L"}${pt(p)}`;
    }).join(" ") + " Z"
  );
}

/**
 * The unit polygon's sector area over an angular span — the constant that
 * makes the equal-area claim exact rather than approximate.
 */
export function unitSectorArea(a0: number, a1: number): number {
  /* `ringArc` emits crop coordinates, so the ring is recentred on the origin
     before the shoelace — the sector's apex IS the origin. */
  const arc = ringArc(a0, a1, 1).map((p) => ({ x: p.x - CX, y: p.y - CY }));
  const ring = [{ x: 0, y: 0 }, ...arc, { x: 0, y: 0 }];
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    sum += ring[i].x * ring[i + 1].y - ring[i + 1].x * ring[i].y;
  }
  return Math.abs(sum) / 2;
}

const bboxOf = (pts: readonly CarrierPoint[]) => {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
};

/* ── The course ladder ──────────────────────────────────────────────────── */

/**
 * The advance model both the guard and the drawing letter against. `adv(fs,
 * track)` is `fs × (0.6 + track)` — PT Mono's cell width, plus the tracking
 * `letter-spacing` adds. It is not this file's number: production's
 * `pdaLetters.adv` is what every other substrate variant walks and this drawing
 * mirrors it exactly, so re-tuning the letter model there re-tunes it here.
 */
const labelMeasure = (chars: number) => chars * adv(LABEL_FS, LABEL_TRACK);

/**
 * The minimum inner arc a course must clear to letter its part's longest name
 * with `LABEL_PAD` on each end. The count is not part of it — this is the
 * measure of ONE cell's arc, whichever course it lands on.
 */
export const carrierArcTarget = (longestChars: number): number =>
  labelMeasure(longestChars) + LABEL_PAD * 2;

/**
 * Cells per course, inner → outer — derived from the part's own worst name.
 *
 * ⚠ **THE LADDER IS DERIVED NOW, NOT AUTHORED**. Every previous cut of this
 * drawing hard-coded `n >= 10 ? 3 : 2` on the argument that the count cancels
 * out of every cell-shape derivation, so an authored rule was the only lever
 * left on grain. That argument was right and it is over: `LABEL_MEASURE` does
 * not cancel, because the name has to fit the cell's ARC and inner arcs are
 * shorter than outer ones.
 *
 * The rule: enumerate compositions of `n` into 1..n courses, pick the one that
 * (a) clears `carrierArcTarget(longestChars)` on every course's inner arc, (b)
 * clears `MIN_CELL_DEPTH` on every course's depth, and (c) minimises the max
 * aspect ratio (`arc/depth`) so no cell is a thin slit. Inner courses hold
 * FEWER cells now — [2,3,3,3,3] for Pattern instead of U28's [4,5,5], because
 * that is what stops the innermost cells from choking on a 108-unit name.
 *
 * ⚠ RETURNS `null` IF NO LADDER FITS. The caller falls back to the U28 authored
 * rule, which lets `carrierLayout` still produce a drawing at record shapes the
 * derivation would fail on (a stubbed 47-of-1 fixture, a longer authored name).
 * The lettering guard catches the fallout on the record we actually ship.
 */
export function carrierCourses(
  n: number,
  sweepRad: number,
  longestChars: number,
  R_INNER = R_CELL,
  R_OUTER = R_OUT,
  minDepth = MIN_CELL_DEPTH
): number[] | null {
  if (n < 1) return null;
  const target = carrierArcTarget(longestChars);
  const span = R_OUTER * R_OUTER - R_INNER * R_INNER;
  const holder: { best: { co: number[]; score: number } | null } = { best: null };

  const feasible = (co: readonly number[]): number | null => {
    let cum = 0;
    let prev = R_INNER;
    let score = 0;
    for (const m of co) {
      cum += m;
      const next = cum === n ? R_OUTER : Math.sqrt(R_INNER * R_INNER + (cum / n) * span);
      const arc = prev * (sweepRad / m);
      const dep = next - prev;
      if (arc < target || dep < minDepth) return null;
      score = Math.max(score, arc / dep);
      prev = next;
    }
    return score;
  };

  const walk = (rem: number, courses: number, acc: number[]) => {
    if (courses === 1) {
      if (rem < 1) return;
      const co = [...acc, rem];
      const score = feasible(co);
      if (score !== null && (!holder.best || score < holder.best.score))
        holder.best = { co, score };
      return;
    }
    for (let v = 1; v <= rem - (courses - 1); v += 1) walk(rem - v, courses - 1, [...acc, v]);
  };
  for (let k = 1; k <= n; k += 1) walk(n, k, []);
  return holder.best ? holder.best.co : null;
}

/**
 * ⚠ **THE AUTHORED FALLBACK**. U28's rule, kept as the last resort — a
 * derivation that cannot letter its part still needs a shape the drawing can
 * paint. The lettering guard walks the record on ship and would fail before a
 * capture; this is what stops a stubbed lab record from throwing at render.
 */
export const carrierCoursesAuthored = (n: number): number[] => {
  const c = Math.max(1, Math.min(n, n >= 10 ? 3 : 2));
  const base = Math.floor(n / c);
  const rem = n - base * c;
  return Array.from({ length: c }, (_, i) => base + (i >= c - rem ? 1 : 0));
};

/** Course boundaries whose area shares equal their cell shares. */
export const carrierRadii = (courses: readonly number[], n: number): number[] => {
  const span = R_OUT * R_OUT - R_CELL * R_CELL;
  const out = [R_CELL];
  let cum = 0;
  for (const m of courses) {
    cum += m;
    out.push(Math.sqrt(R_CELL * R_CELL + (cum / n) * span));
  }
  out[out.length - 1] = R_OUT;
  return out;
};

/* ── The layout ─────────────────────────────────────────────────────────── */

export interface CarrierCell {
  skill: CaseSkillEntry;
  key: CaseMapShapeKey;
  /** Ring order, 0 … 46. The roving arrow keys walk this. */
  index: number;
  course: number;
  /** The un-gapped partition, which is what the area guard measures. */
  a0: number;
  a1: number;
  r0: number;
  r1: number;
  d: string;
  /** The drawn outer polyline — the flagship's green provenance rides it. */
  outer: CarrierPoint[];
  area: number;
}

export interface CarrierGroup {
  key: CaseMapShapeKey;
  name: string;
  skills: readonly CaseSkillEntry[];
  a0: number;
  a1: number;
  mid: number;
  courses: number[];
  radii: number[];
  /** The whole part (its material clip). Runs `R_CELL..R_OUT` — the band is
   *  its own region, above the cells. */
  d: string;
  bbox: { x: number; y: number; w: number; h: number };
  /**
   * The field's density multiplier: the bounding box's area over the part's
   * own. See `carrierFieldK`.
   */
  fieldK: number;
  /**
   * The part's longest short name in characters — the input that drives its
   * course ladder, and what the test asserts every cell letters within.
   */
  longestChars: number;
}

const skillsOf = (skills: readonly CaseSkillEntry[], key: CaseMapShapeKey) =>
  skills.filter((s) => s.engine.toLowerCase() === key);

/**
 * ⚠ **A CLIPPED FIELD LOSES ITS DENSITY, AND THE PAINTERS COUNT IN ABSOLUTES.**
 * `substrateForms` paints `260·k` marks into a `w × h` BOX (its own head says
 * the counts are absolute, not per-area) — but a part is a WEDGE inside that
 * box, so every mark outside the wedge is clipped away and the field arrives
 * thinned by exactly the fraction the wedge does not cover. On this plate a
 * part fills 58–67 % of its own bounding box, which is why the first cut's
 * five materials read as one dark texture with a few dots in it: the
 * differentiation was drawn and then thrown away by the clip.
 *
 * So `k` is the RECIPROCAL COVERAGE — box area over part area — and the field
 * lands at the density its painter was authored for. Capped at 3, because
 * beyond that a wedge is thin enough that the honest fix is a bigger box and
 * the dishonest one is a payload of marks nobody can see.
 *
 * ⚠ **COVERAGE DOES NOT RISE WITH SWEEP, IT FALLS.** The intuition that a
 * wider part fills more of its own box is right for a solid pie slice and
 * wrong for an ANNULAR one: widen the sweep and the box grows to enclose the
 * aperture's hole, which the part does not occupy. At the limit a full ring
 * covers 62 % of its square while a thin one approaches a rectangle. A guard
 * was written on the wrong intuition here and the arithmetic corrected it.
 */
export function carrierFieldK(part: number, box: number): number {
  if (part <= 0 || box <= 0) return 1;
  return Math.min(3, Math.max(1, box / part));
}

/**
 * The first encode is placed at the OUTERMOST course's leading slot, so its
 * green mark lands on the plate's own rim rather than on an internal seam —
 * where a green line would read as a divider instead of as provenance.
 */
const ordered = (mine: readonly CaseSkillEntry[], courses: readonly number[]) => {
  const flagship = mine.find((s) => s.flagship);
  if (!flagship) return [...mine];
  const rest = mine.filter((s) => s !== flagship);
  const at = mine.length - courses[courses.length - 1];
  return [...rest.slice(0, at), flagship, ...rest.slice(at)];
};

/**
 * Five contiguous parts and their 47 cells. One derivation feeds the drawing,
 * the interaction, the band labels and every guard.
 */
export function carrierLayout(record: IslRecord): {
  groups: CarrierGroup[];
  cells: CarrierCell[];
} {
  const skills = record.skills ?? [];
  const shapes = new Map(record.shapes.map((s) => [s.key as CaseMapShapeKey, s]));
  const total = CARRIER_ORDER.reduce((n, key) => n + skillsOf(skills, key).length, 0);
  if (total === 0) return { groups: [], cells: [] };

  const step = (360 - GROUP_GAP * CARRIER_ORDER.length) / total;
  const groups: CarrierGroup[] = [];
  const cells: CarrierCell[] = [];
  let cursor = START;

  for (const key of CARRIER_ORDER) {
    const mine = skillsOf(skills, key);
    const n = mine.length;
    const groupA0 = cursor;
    const groupA1 = cursor + step * n;
    const sweepRad = ((groupA1 - groupA0) * Math.PI) / 180;
    const longestChars = mine.reduce((m, s) => Math.max(m, s.short.length), 0);
    /* ⚠ THE LADDER IS DERIVED FROM THE NAMES, WITH THE U28 AUTHORED RULE
       AS A FALLBACK. On the shipped record the derivation always solves;
       the fallback exists so a stubbed lab fixture cannot throw. */
    const courses = carrierCourses(n, sweepRad, longestChars) ?? carrierCoursesAuthored(n);
    const radii = carrierRadii(courses, n);
    const run = ordered(mine, courses);

    let taken = 0;
    for (const [course, m] of courses.entries()) {
      const r0 = radii[course];
      const r1 = radii[course + 1];
      const inner = course === 0 ? r0 : r0 + COURSE_GAP / 2;
      const outer = course === courses.length - 1 ? r1 : r1 - COURSE_GAP / 2;
      const cellSweep = (groupA1 - groupA0) / m;

      for (let i = 0; i < m; i += 1) {
        const a0 = groupA0 + cellSweep * i;
        const a1 = a0 + cellSweep;
        const outerRing = ringArc(a0 + CELL_GAP / 2, a1 - CELL_GAP / 2, outer);
        cells.push({
          skill: run[taken + i],
          key,
          index: cells.length,
          course,
          a0,
          a1,
          r0,
          r1,
          d: sectorPath(a0 + CELL_GAP / 2, a1 - CELL_GAP / 2, inner, outer),
          outer: outerRing,
          area: (r1 * r1 - r0 * r0) * unitSectorArea(a0, a1),
        });
      }
      taken += m;
    }

    const mid = (groupA0 + groupA1) / 2;
    /* ⚠ THE PART RUNS `R_CELL..R_OUT`, NOT `R_HUB..R_OUT`. The band lives
       above the cells (`R_HUB..R_CELL`) and is not the part's material — the
       clip that would otherwise thin the band's substrate name with a physics
       field stops at the cells' inner ring. */
    const d = sectorPath(groupA0, groupA1, R_CELL, R_OUT);
    const bbox = bboxOf([
      ...ringArc(groupA0, groupA1, R_OUT),
      ...ringArc(groupA1, groupA0, R_CELL),
    ]);
    const area = (R_OUT * R_OUT - R_CELL * R_CELL) * unitSectorArea(groupA0, groupA1);
    groups.push({
      key,
      name: shapes.get(key)?.name ?? key.toUpperCase(),
      skills: mine,
      a0: groupA0,
      a1: groupA1,
      mid,
      courses,
      radii,
      d,
      bbox,
      fieldK: carrierFieldK(area, bbox.w * bbox.h),
      longestChars,
    });
    cursor = groupA1 + GROUP_GAP;
  }

  return { groups, cells };
}

/* ── The lettered copy ──────────────────────────────────────────────────── */

/**
 * ⚠ **THE APERTURE EXPLAINS, IT DOES NOT COUNT** (owner, 2026-08-18: _"just
 * give a brief explanation, just one text. Don't talk about 47 encoded
 * skills."_). The socket used to letter `47 / ENCODED SKILLS / 5 RECURRING
 * SHAPES` over a two-line mechanism — four facts, three of them numbers, none
 * of them an answer to _what is this_.
 *
 * ⚠ **IT IS THE SURFACE'S OWN SENTENCE, NOT A NEW ONE.** The casefile brief
 * already publishes _"below grade runs the shared substrate — encoded once for
 * one team, tapped by the next"_, and the city's sheet 03 subtitle is _"what
 * every district drops into"_. This is that claim with the spatial framing
 * dropped, because "below grade" is the SECTION drawing's word and there is no
 * grade on a plate. Sentence case, like `CaseMapShape.meaning` and for the same
 * reason: it is the one thing here meant to be read rather than scanned.
 */
const BRIEF =
  "The judgment this work keeps reusing — encoded once by the team that needed it, then drawn on by every team after.";
const BRIEF_FS = 13;
const BRIEF_TRACK = 0.02;
/**
 * ⚠ DERIVED FROM THE MEASURE, NOT GUESSED. `wrapLines` breaks on CHARACTER
 * count, so the per-line budget has to be the measure divided by this font's
 * own advance — `adv(13, .02)` is 8.06, and 248 / 8.06 is 30.8.
 */
const BRIEF_PER = 30;
/**
 * ⚠ `wrapLines` TRUNCATES AT ITS CAP — it ends `out.slice(0, max)`, so a cap
 * set to the line count the current copy happens to need drops a word silently
 * the moment the copy grows. The cap has slack and `carrierBriefFits` asserts
 * the wrap gave back every word.
 */
const BRIEF_MAX = 6;
/**
 * ⚠ **THE MEASURE IS THE BAND'S NARROWEST POINT, NOT THE APERTURE'S WIDEST.**
 * The text sits in the straight-walled middle where the opening is 158 across,
 * but the rules that fence it sit at `±62`, out where the chamfer has taken the
 * chord down to 147 — and a line wider than the rule above it reads as text
 * escaping its own readout even though nothing is clipping. 248 leaves the
 * rules 30 units proud on each side, which is what makes them read as the
 * band's edge rather than as an underline that came up short.
 */
const BRIEF_MEASURE = 248;
const BRIEF_LINE_H = 19;
/**
 * ⚠ BASELINE-CENTRED TEXT SITS HIGH. A line's ink is mostly ABOVE its baseline,
 * so centring the BASELINES on `CY` centres the wrong thing and leaves the
 * block visibly crowding the head rule. Three units down is the cap-height
 * correction, measured against the two rules rather than against the aperture.
 */
const BRIEF_DROP = 3;

const HUB_META_CHARS = 22;

/* ── The guards' arithmetic ─────────────────────────────────────────────── */

/**
 * The tangent direction for a text set ALONG the arc at angle `midAngleDeg`.
 * Rotated by `midAngle + 90` in the top half and `midAngle - 90` in the bottom
 * so nothing reads upside down — sin > 0 is SVG's bottom half (y down).
 */
export const carrierLabelRotation = (midAngleDeg: number): number =>
  Math.sin(rad(midAngleDeg)) > 0 ? midAngleDeg - 90 : midAngleDeg + 90;

/**
 * The chord sagitta a STRAIGHT text of width `widthU` would carry at radius
 * `midR` — the amount its ends fall away from the arc that carries it.
 * Exported for the guard; not used at render time because the drawing uses
 * `textPath`, which places the text on the arc exactly.
 */
export const carrierChordSagitta = (widthU: number, midR: number): number =>
  (widthU * widthU) / (8 * Math.max(midR, 1));

/**
 * The label's own measure — the inner arc of the cell it letters, minus the
 * per-end padding. This is what the guard walks against `skill.short`.
 */
export const carrierCellMeasure = (cell: CarrierCell): number => {
  const innerSweep = (cell.a1 - cell.a0 - CELL_GAP) * (Math.PI / 180);
  return Math.max(0, cell.r0 * innerSweep - LABEL_PAD * 2);
};

/**
 * The radius a substrate name's arc is actually cut at — `BAND_R` shifted by the
 * ink-centring correction, whose SIGN depends on the arc's direction.
 *
 * ⚠ **THE GUARD HAS TO MEASURE THIS RADIUS, NOT `BAND_R`.** The correction moves
 * the arc by 4.55 units, which is 2.6 % of its length — and it moves it INWARD
 * on `pattern`/`judgment` and OUTWARD on the other three. Measuring the nominal
 * radius would credit the two shortest names with arc they do not have while
 * quietly under-reporting `STAKEHOLDER`, the one name whose slack is worth
 * knowing. One function, two call sites: the drawing and the check.
 */
export const carrierBandArcRadius = (group: CarrierGroup): number => {
  const midA = (group.a0 + group.a1) / 2;
  return BAND_R + (Math.sin(rad(midA)) > 0 ? 1 : -1) * BAND_INK_MID * BAND_FS;
};

/**
 * The band arc that carries a substrate name, minus its own per-end padding.
 */
export const carrierBandMeasure = (group: CarrierGroup): number => {
  const sweep = (group.a1 - group.a0) * (Math.PI / 180);
  return Math.max(0, carrierBandArcRadius(group) * sweep - BAND_PAD * 2);
};

/** The visual count of a part is literally its number of cells. */
export const carrierMarkCount = (record: IslRecord, key: string): number =>
  carrierLayout(record).cells.filter((cell) => cell.key === key).length;

/** Angular sweep, after the five structural clearances are removed. */
export function carrierSweep(record: IslRecord, key: string): number {
  const g = carrierLayout(record).groups.find((x) => x.key === key);
  return g ? g.a1 - g.a0 : 0;
}

/** Every cell's ideal area — the equal-area claim, measurable. */
export const carrierCellAreas = (record: IslRecord): number[] =>
  carrierLayout(record).cells.map((c) => c.area);

/** The brief, wrapped exactly as the drawing wraps it. */
export const carrierBriefLines = (): string[] => wrapLines(BRIEF, BRIEF_PER, BRIEF_MAX);

export interface CarrierPinnedFit {
  /** The worst cell's clear distance from its block to the hub's wall. */
  wall: number;
  /** Which Skill produced it. */
  worst: string;
}

/**
 * The clicked readout's fit, walked across every Skill on the plate.
 *
 * ⚠ **THE HUB IS FIXED AND THE CONTENT IS NOT**, which is the exact shape of
 * defect a single-case check misses. The block grows by 20 units when a Skill
 * is a flagship and by 17 for each meta line the wrap adds, so the worst case
 * is not the Skill anyone would think to open — it is whichever one happens to
 * be both flagship and long-named. Nothing clips when it overruns; the text
 * just walks off the gold onto the cells behind it, and it reads as a rendering
 * bug rather than as a measurement that was never taken.
 */
export function carrierPinnedFits(record: IslRecord): CarrierPinnedFit {
  const { cells } = carrierLayout(record);
  let wall = Infinity;
  let worst = "";
  for (const cell of cells) {
    const meta = wrapLines(`${cell.skill.team} · ${cell.skill.status}`, HUB_META_CHARS, 3);
    const height = (cell.skill.flagship ? 20 : 0) + 12 + 22 + 26 + (meta.length - 1) * 17 + 4;
    const widest = Math.max(
      cell.skill.short.length * adv(17, 0.04),
      ...meta.map((l) => l.length * adv(FS.chrome, 0.08))
    );
    const clear = boxClearance(0, widest / 2, height / 2, R_HUB);
    if (clear < wall) worst = cell.skill.short;
    wall = Math.min(wall, clear);
  }
  return { wall, worst };
}

export interface CarrierBriefFit {
  lines: number;
  /** The widest line's measured width against `BRIEF_MEASURE`. */
  slack: number;
  /** Clear distance from the block's worst corner to the hub's wall. */
  wall: number;
  /** Every word the copy declares survived the wrap. */
  whole: boolean;
}

/**
 * The brief's fit on the hub.
 *
 * ⚠ **THE HUB'S HALF-WIDTH IS NOT CONSTANT DOWN THE BLOCK.** Inside
 * `|y| ≤ R_HUB·sin(15°) = 42.4` the boundary is the vertical edge at `κR_HUB`,
 * and past that it is a chamfer running in — so a block tall enough to leave
 * that band loses width as it grows, and a paragraph measured on the apothem
 * alone passes at four lines and quietly runs off the gold at six.
 * `boxClearance` walks all twelve edges, so the growth is caught wherever it
 * happens to point.
 *
 * ⚠ The ink bounds are the two ends that actually collide — a line's ink runs
 * roughly from `baseline − 0.75em` to `baseline + 0.2em`, so the top of the
 * first line and the tail of the last are not symmetric about the block, and
 * `BRIEF_DROP` is the correction that keeps the SET block centred rather than
 * its baselines.
 */
export function carrierBriefFits(): CarrierBriefFit {
  const lines = carrierBriefLines();
  const widest = Math.max(...lines.map((l) => l.length * adv(BRIEF_FS, BRIEF_TRACK)));
  const first = CY + BRIEF_DROP - ((lines.length - 1) * BRIEF_LINE_H) / 2;
  const last = first + (lines.length - 1) * BRIEF_LINE_H;
  const top = first - 0.75 * BRIEF_FS;
  const bottom = last + 0.2 * BRIEF_FS;
  return {
    lines: lines.length,
    slack: BRIEF_MEASURE - widest,
    wall: boxClearance((top + bottom) / 2 - CY, widest / 2, (bottom - top) / 2, R_HUB),
    whole: lines.join(" ") === BRIEF,
  };
}

/**
 * The radius one cell's label arc is cut at — the cell's mid-depth, shifted so
 * the label's INK lands centred rather than its baseline.
 *
 * ⚠ Ink rises OUTWARD where the arc runs forward and INWARD where it is
 * reversed (see `carrierCellArcPath`), so the baseline has to drop inward on the
 * top half and outward on the bottom. One expression, both halves — and the sign
 * term is the same `flip` the arc's own direction uses, which is why they belong
 * in the same file rather than one being a correction applied later.
 */
export const carrierCellArcRadius = (cell: CarrierCell): number => {
  const midA = (cell.a0 + cell.a1) / 2;
  return (cell.r0 + cell.r1) / 2 + (Math.sin(rad(midA)) > 0 ? 1 : -1) * LABEL_INK_MID * LABEL_FS;
};

/**
 * The arc-following text path for one cell — the invisible curve `textPath`
 * hangs the label off. Runs at the cell's mid-radius, half a `CELL_GAP` inset
 * from each seam so the text does not lie on the divider.
 *
 * ⚠ **`textPath` PLACES TEXT ON THE ARC EXACTLY**, so the sagitta a straight
 * chord would carry falls away — 6.9 units on the innermost course, ~23 % of
 * the depth. Straight rotated text was the plan's first cut and it collided
 * with the cell's outer boundary on the innermost course of Validation.
 *
 * ⚠ **THE ARC IS REVERSED IN THE BOTTOM HALF** so the text does not read
 * upside down. SVG's `sweep-flag` inverts the direction; the endpoints swap
 * too, which is what makes the label's baseline face outward at 6 o'clock the
 * way it faces inward at 12.
 *
 * ⚠ **THE ARC IS CUT OFF-CENTRE ON PURPOSE, SO THE INK LANDS CENTRED.** See
 * `LABEL_INK_MID` — the baseline is not the ink's middle, and the reversal above
 * is also what flips which way the offset points, so the correction has to carry
 * the same `flip` term the direction does. Cutting the arc at the plain
 * mid-depth is what pressed every label against a wall.
 */
export function carrierCellArcPath(cell: CarrierCell): string {
  const midA = (cell.a0 + cell.a1) / 2;
  const flip = Math.sin(rad(midA)) > 0;
  const arcR = carrierCellArcRadius(cell);
  const a0 = cell.a0 + CELL_GAP / 2;
  const a1 = cell.a1 - CELL_GAP / 2;
  const [aStart, aEnd] = flip ? [a1, a0] : [a0, a1];
  const sweepFlag = flip ? 0 : 1;
  const sx = CX + arcR * Math.cos(rad(aStart));
  const sy = CY + arcR * Math.sin(rad(aStart));
  const ex = CX + arcR * Math.cos(rad(aEnd));
  const ey = CY + arcR * Math.sin(rad(aEnd));
  return `M${sx.toFixed(2)},${sy.toFixed(2)} A${arcR.toFixed(2)},${arcR.toFixed(2)} 0 0 ${sweepFlag} ${ex.toFixed(2)},${ey.toFixed(2)}`;
}

/**
 * The band arc for a substrate name. Same rotation grammar as the cell arc,
 * one level in — the whole drawing letters along tangents from one law, and
 * that includes the ink-centring correction (`BAND_INK_MID`, which is the
 * uppercase value: no descender lands, so the offset is a half cap-height).
 */
export function carrierBandArcPath(group: CarrierGroup): string {
  const midA = (group.a0 + group.a1) / 2;
  const flip = Math.sin(rad(midA)) > 0;
  const arcR = carrierBandArcRadius(group);
  const a0 = group.a0 + GROUP_GAP / 2;
  const a1 = group.a1 - GROUP_GAP / 2;
  const [aStart, aEnd] = flip ? [a1, a0] : [a0, a1];
  const sweepFlag = flip ? 0 : 1;
  const sx = CX + arcR * Math.cos(rad(aStart));
  const sy = CY + arcR * Math.sin(rad(aStart));
  const ex = CX + arcR * Math.cos(rad(aEnd));
  const ey = CY + arcR * Math.sin(rad(aEnd));
  return `M${sx.toFixed(2)},${sy.toFixed(2)} A${arcR.toFixed(2)},${arcR.toFixed(2)} 0 0 ${sweepFlag} ${ex.toFixed(2)},${ey.toFixed(2)}`;
}

/** Radial modulation the dodecagonal perimeter introduces against a circle. */
export const carrierRimModulation = (): number => 1 - KAPPA;

/** What a cell announces to a screen reader. Unique across the plate. */
export const carrierCellLabel = (cell: CarrierCell, name: string): string =>
  `${cell.skill.short}, ${name}, ${cell.skill.team}, ${cell.skill.status}`;

export const CARRIER_SIDES = SIDES;
export const CARRIER_BRIEF = BRIEF;
/** ⚠ EXPORTED BECAUSE THE GUARDS HELD IT AS A LITERAL AND IT MOVED. The
 *  material-coverage raster carried `- 381` inline; when `CY` became 394 the
 *  raster sampled a plate 13 units from where the plate is, and reported it as
 *  a compensation error in `carrierLayout`. A centre is not a magic number. */
export const CARRIER_CX = CX;
export const CARRIER_CY = CY;
export const CARRIER_R_IN = R_HUB;
export const CARRIER_R_CELL = R_CELL;
export const CARRIER_R_OUT = R_OUT;
export const CARRIER_BAND_R = BAND_R;
export const CARRIER_BAND_FS = BAND_FS;
export const CARRIER_BAND_TRACK = BAND_TRACK;
export const CARRIER_LABEL_FS = LABEL_FS;
export const CARRIER_LABEL_TRACK = LABEL_TRACK;
export const CARRIER_LABEL_PAD = LABEL_PAD;
export const CARRIER_MIN_CELL_DEPTH = MIN_CELL_DEPTH;
/** The ink-centring corrections, exported so the guard walks the same numbers. */
export const CARRIER_LABEL_INK_MID = LABEL_INK_MID;
export const CARRIER_BAND_INK_MID = BAND_INK_MID;
export const CARRIER_LABEL_INK_HALF = LABEL_INK_HALF;
export const CARRIER_BAND_INK_HALF = BAND_INK_HALF;

/* ── What the drawing letters ───────────────────────────────────────────── */

/**
 * Everything this direction can letter — the resting hub, the five band
 * substrate names, the forty-seven cell labels always visible on the annulus,
 * and every reachable pinned readout state.
 *
 * ⚠ **THE SLOT PREFIX IS THE INTERACTION STATE**, not the substrate key or the
 * anatomical region. `brief.*` and `band.*` and `cell.*` are the RESTING
 * drawing; `pin.*` is what one click adds. The guard reads a slot's prefix to
 * classify it — the previous scheme spent `voice.name` on a substrate name and
 * `tag.{id}` on a hover callout, and the two families were separate objects on
 * two different rungs of the drawing but sat next to each other in the spec
 * list.
 */
export function carrierLettering(record: IslRecord): LetterSpec[] {
  const layout = carrierLayout(record);
  const out: LetterSpec[] = carrierBriefLines().map((line, i) => ({
    slot: `brief.${i}`,
    text: line,
    fs: BRIEF_FS,
    track: BRIEF_TRACK,
    measure: BRIEF_MEASURE,
  }));

  /* The band's five substrate names — one arc each, uppercase, tracked wide
     so they read STRUCTURAL where a Skill reads NAMED. Their measure is the
     band arc minus per-end padding. */
  for (const group of layout.groups) {
    out.push({
      slot: `band.${group.key}`,
      text: group.name.toUpperCase(),
      fs: BAND_FS,
      track: BAND_TRACK,
      measure: carrierBandMeasure(group),
    });
  }

  /* The forty-seven cell labels — each set along its own arc at rest. The
     measure is the cell's INNER arc, which is the binding one since a chord
     is longest at its outer end. */
  for (const cell of layout.cells) {
    out.push({
      slot: `cell.${cell.skill.id}`,
      text: cell.skill.short,
      fs: LABEL_FS,
      track: LABEL_TRACK,
      measure: carrierCellMeasure(cell),
    });
  }

  /* And what the hub letters once the reader COMMITS a cell — the click's
     payload. The resting drawing already names the Skill; the click adds the
     part, the team and the status. */
  for (const cell of layout.cells) {
    out.push({
      slot: `pin.${cell.skill.id}.short`,
      text: cell.skill.short,
      fs: 17,
      track: 0.04,
      measure: BRIEF_MEASURE,
    });
    out.push({
      slot: `pin.${cell.skill.id}.engine`,
      text: cell.key.toUpperCase(),
      fs: FS.chrome,
      track: 0.18,
      measure: BRIEF_MEASURE,
    });
    const meta = wrapLines(`${cell.skill.team} · ${cell.skill.status}`, HUB_META_CHARS, 3);
    for (const [i, line] of meta.entries()) {
      out.push({
        slot: `pin.${cell.skill.id}.meta.${i}`,
        text: line,
        fs: FS.chrome,
        track: 0.08,
        measure: BRIEF_MEASURE,
      });
    }
  }

  return out;
}

/* ── The drawing ────────────────────────────────────────────────────────── */

export function VariantCarrier({ record }: IslVariantProps) {
  const layout = useMemo(() => carrierLayout(record), [record]);
  const [hotId, setHotId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [roving, setRoving] = useState(0);
  const refs = useRef<(SVGGElement | null)[]>([]);

  /**
   * ⚠ **TWO STATES, TWO JOBS — DO NOT COLLAPSE THEM BACK INTO ONE.** `hot` is
   * what the pointer is over and it drives the LIT CELL and the dimming;
   * `pinned` is what the reader chose and it drives THE HUB. The first cut ran
   * the centre off `hot ?? pinned`, which made the click a no-op in every case
   * the reader could see: the hover had already put the identity where the
   * click was going to put it. With the cell always lettered at rest, hover no
   * longer names — the name is on the plate — but the two jobs still split.
   */
  const hot = layout.cells.find((c) => c.skill.id === hotId) ?? null;
  const pinned = layout.cells.find((c) => c.skill.id === pinnedId) ?? null;
  const litKey = hot?.key ?? pinned?.key ?? null;
  const nameOf = (key: CaseMapShapeKey) =>
    layout.groups.find((g) => g.key === key)?.name ?? key.toUpperCase();

  /** Roving arrow keys walk the ring; Escape releases a pinned cell. */
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number, id: string) => {
      const n = layout.cells.length;
      const jump = (delta: number) => {
        const next = (index + delta + n) % n;
        setRoving(next);
        refs.current[next]?.focus();
      };
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          jump(1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          jump(-1);
          break;
        case "Home":
          setRoving(0);
          refs.current[0]?.focus();
          break;
        case "End":
          setRoving(n - 1);
          refs.current[n - 1]?.focus();
          break;
        case "Enter":
        case " ":
          setPinnedId((prev) => (prev === id ? null : id));
          break;
        case "Escape":
          setPinnedId(null);
          return;
        default:
          return;
      }
      event.preventDefault();
    },
    [layout.cells.length]
  );

  return (
    <>
      {/* ⚠ ARC PATHS IN DEFS FIRST. Each cell and each band segment declares an
          invisible curve; `textPath` hangs the label off it. They live before
          any visual so the browser has them before the first `href` fires. */}
      <defs>
        {layout.groups.map((group) => (
          <path
            key={`band-arc-${group.key}`}
            id={`carrier-band-arc-${group.key}`}
            d={carrierBandArcPath(group)}
            fill="none"
          />
        ))}
        {layout.cells.map((cell) => (
          <path
            key={`cell-arc-${cell.skill.id}`}
            id={`carrier-cell-arc-${cell.skill.id}`}
            d={carrierCellArcPath(cell)}
            fill="none"
          />
        ))}
      </defs>

      {/* ONE GROUND. The cell gaps and the course seams reveal this plate
          rather than empty canvas, so the object reads as one machined
          carrier divided rather than as forty-seven pieces collected. */}
      <path d={polygonPath(R_OUT)} fill="var(--pda-void)" />

      {/* THE MATERIAL — one field per part, clipped to the CELLS' annulus. The
          band above them is a machined recess and takes no field.

          ⚠ THE ALPHA IS TUNED FOR TYPE-OVER-MATERIAL (owner, 2026-08-18: all 47
          Skill names sit on top of the field now). U28's 0.8 rested a texture
          that the labels had to fight; 0.55 lets the type read while still
          differentiating the five parts by kind. The dimmed step is halved. */}
      {layout.groups.map((group, i) => (
        <Field
          key={`mat-${group.key}`}
          form={isFormKey(group.key) ? group.key : "pattern"}
          x={group.bbox.x}
          y={group.bbox.y}
          w={group.bbox.w}
          h={group.bbox.h}
          seed={38 + i}
          k={group.fieldK}
          opacity={litKey && litKey !== group.key ? 0.22 : 0.55}
          clip={sectorPath(group.a0, group.a1, R_CELL, R_OUT, group.bbox.x, group.bbox.y)}
        />
      ))}

      {layout.cells.map((cell) => {
        const isHot = cell.skill.id === hotId;
        const isPinned = cell.skill.id === pinnedId;
        const isActive = isHot || isPinned;
        const dimmed = litKey !== null && !isActive && cell.key !== litKey;
        return (
          <g
            key={cell.skill.id}
            ref={(node) => {
              refs.current[cell.index] = node;
            }}
            className="fl-pda-hit"
            role="button"
            tabIndex={cell.index === roving ? 0 : -1}
            aria-pressed={cell.skill.id === pinnedId}
            aria-label={carrierCellLabel(cell, nameOf(cell.key))}
            onMouseEnter={() => setHotId(cell.skill.id)}
            onMouseLeave={() => setHotId(null)}
            onFocus={() => {
              setRoving(cell.index);
              setHotId(cell.skill.id);
            }}
            onBlur={() => setHotId(null)}
            onClick={() => setPinnedId((prev) => (prev === cell.skill.id ? null : cell.skill.id))}
            onKeyDown={(event) => onKeyDown(event, cell.index, cell.skill.id)}
          >
            {/* ⚠ THE HIT PATH FILLS `transparent`, NEVER `none`. SVG events
                fire on visiblePainted by default and `none` reports no paint —
                the hit target has to have a fill for pointer to land on it. */}
            <path d={cell.d} fill="transparent" pointerEvents="all" />
            {/* ⚠ THE CELL LINE IS `dim`, NOT `hair`/`hair2` — IT IS A LINE THAT
                CARRIES THE DRAWING, NOT CHROME (see pda.css's ladder). */}
            <path
              d={cell.d}
              fill={isActive ? "rgba(var(--gold-rgb), 0.28)" : "rgba(var(--dawn-rgb), 0.04)"}
              stroke={isActive ? "var(--pda-hot)" : "var(--pda-dim)"}
              strokeWidth={isActive ? 1.6 : 1.4}
              strokeOpacity={dimmed ? 0.42 : 1}
              opacity={dimmed ? 0.55 : 1}
              pointerEvents="none"
            />
            {/* Green marks provenance and only provenance — the first encode
                of each shape, on the carrier's own rim. */}
            {cell.skill.flagship ? (
              <path
                d={`M${cell.outer.map((p) => pt(p)).join(" L")}`}
                fill="none"
                stroke="var(--pda-grn)"
                strokeWidth="3"
                pointerEvents="none"
              />
            ) : null}
            {/* The label on its own arc, inside the cell's group so the
                pointer stays on the same target. */}
            <text
              pointerEvents="none"
              fontSize={LABEL_FS}
              letterSpacing={`${LABEL_TRACK}em`}
              fill={isActive ? "var(--pda-hot)" : dimmed ? "var(--pda-txt2)" : "var(--pda-txt)"}
              opacity={dimmed ? 0.7 : 1}
            >
              <textPath
                href={`#carrier-cell-arc-${cell.skill.id}`}
                startOffset="50%"
                textAnchor="middle"
              >
                {cell.skill.short}
              </textPath>
            </text>
          </g>
        );
      })}

      {/* Five structural boundaries, running the full depth from the HUB's
          wall through the band to the rim — so the band is subdivided by the
          same seams the cells are, and the whole plate reads as one figure. */}
      {layout.groups.map((group) => {
        const p0 = polygonRayPoint(group.a0, R_HUB);
        const p1 = polygonRayPoint(group.a0, R_OUT);
        return (
          <line
            key={`seam-${group.key}`}
            x1={p0.x}
            y1={p0.y}
            x2={p1.x}
            y2={p1.y}
            stroke={litKey === group.key ? "var(--pda-hot)" : "var(--pda-amb)"}
            strokeWidth="2"
            strokeOpacity={litKey === group.key ? 1 : 0.7}
          />
        );
      })}

      {/* The band's inner and outer rings — hairlines that read the region as
          machined rather than as empty space between rings. `--pda-dim` at 1u
          is the same weight the cells' hairlines carry, so the band belongs
          to the same plate. */}
      <path d={polygonPath(R_CELL)} fill="none" stroke="var(--pda-dim)" strokeWidth="1" />

      {/* The carrier's outer machined edge. ⚠ Its INNER counterpart is not here
          any more — the hub is filled now, so it owns and draws its own rim
          after its material, and a hairline left behind at this point in the
          order would be half-buried under that fill. */}
      <path d={polygonPath(R_OUT)} fill="none" stroke="var(--pda-hair2)" strokeWidth="2" />

      {/* The band's five substrate names, each on its own arc between the hub
          and the cells. Uppercase, tracked wide — chrome, not content. */}
      {layout.groups.map((group) => (
        <text
          key={`band-label-${group.key}`}
          pointerEvents="none"
          fontSize={BAND_FS}
          letterSpacing={`${BAND_TRACK}em`}
          fontWeight={700}
          fill={litKey === group.key ? "var(--pda-hot)" : "var(--pda-txt)"}
        >
          <textPath href={`#carrier-band-arc-${group.key}`} startOffset="50%" textAnchor="middle">
            {group.name.toUpperCase()}
          </textPath>
        </text>
      ))}

      <Aperture cell={pinned} name={pinned ? nameOf(pinned.key) : ""} />
    </>
  );
}

/**
 * What the hub says. At rest, one sentence explaining what a substrate IS;
 * once a cell has been CLICKED, that Skill's identity — because a cell is
 * chunky enough to count and far too small to name.
 *
 * ⚠ **NO HOUSING IS DRAWN HERE.** The lettering sits straight on the hub's
 * material, bounded by the ring the plate already carries. Anything this
 * function adds — a rect, a bracket, a backing wash — puts a second outline
 * back inside the first and is the square returning under a new name.
 */
function Aperture({ cell, name }: { cell: CarrierCell | null; name: string }) {
  return (
    <g pointerEvents="none">
      <Hub />
      {cell ? <PinnedReadout cell={cell} name={name} /> : <BriefReadout />}
    </g>
  );
}

/**
 * The hub — the plate's core, in soft Tensor gold.
 *
 * ⚠ ITS GRAIN IS MEASURED, NOT CLIPPED. Each row is drawn to the length the
 * twelve-sided wall allows at its own height, so the fill's texture ends
 * exactly where the material does. A `clipPath` produces the same picture with
 * a shape that does not know why it stops there — and it would hide the
 * chord-versus-ray error `hubHalfWidth` exists to prevent.
 */
function Hub() {
  const reach = KAPPA * R_HUB;
  const rows: number[] = [];
  for (let dy = -Math.floor(reach / GRAIN_PITCH) * GRAIN_PITCH; dy < reach; dy += GRAIN_PITCH) {
    if (hubHalfWidth(dy, R_HUB) > 4) rows.push(dy);
  }

  return (
    <>
      {/* ⚠ THE VOID GOES DOWN FIRST. The hub sits over the plate's ground and
          the cells' fields stop at its wall, but a translucent gold laid
          straight onto the page would take whatever the console's own bed is
          doing behind it — so the fill is opaque ground plus a gold veil, and
          the tint means the same thing wherever the drawing is placed. */}
      <path d={polygonPath(R_HUB)} fill="var(--pda-void)" />
      <path d={polygonPath(R_HUB)} fill="var(--pda-hub)" />

      {rows.map((dy) => {
        const half = hubHalfWidth(dy, R_HUB);
        return (
          <line
            key={`grain-${dy}`}
            x1={CX - half}
            y1={CY + dy}
            x2={CX + half}
            y2={CY + dy}
            stroke="var(--pda-hub-grain)"
          />
        );
      })}

      {/* The hub's rim, at the plate's own edge weight. ⚠ The five seams land
          on this line — they run from here to the outer rim — so it has to
          read as an EDGE the material stops at, not as a hairline drawn near
          one. Same declaration as the outer rim: two machined edges, one
          grammar. */}
      <path d={polygonPath(R_HUB)} fill="none" stroke="var(--pda-hair2)" strokeWidth="2" />
    </>
  );
}

/**
 * At rest — one sentence, set on the hub.
 *
 * ⚠ THE CARET WENT WITH THE SCREEN. A block cursor was the signature of the
 * readout the middle used to be; on a filled plate it is a stray mark with
 * nothing to mean.
 */
function BriefReadout() {
  const lines = carrierBriefLines();
  const first = CY + BRIEF_DROP - ((lines.length - 1) * BRIEF_LINE_H) / 2;
  return (
    <>
      {lines.map((line, i) => (
        <text
          key={line}
          x={CX}
          y={first + i * BRIEF_LINE_H}
          textAnchor="middle"
          fontSize={BRIEF_FS}
          letterSpacing={`${BRIEF_TRACK}em`}
          fill="var(--pda-txt)"
        >
          {line}
        </text>
      ))}
    </>
  );
}

/** Clicked — the same well, displaying a Skill instead of the explanation. */
function PinnedReadout({ cell, name }: { cell: CarrierCell; name: string }) {
  const meta = wrapLines(`${cell.skill.team} · ${cell.skill.status}`, HUB_META_CHARS, 3);
  /*
   * ⚠ THE BLOCK CENTRES ON ITS OWN HEIGHT, NOT ON FIXED BASELINES. Two things
   * vary here — the flagship mark is there or it is not, and the meta wraps to
   * one line or two — so a stack pinned to `CY` by hard offsets is centred for
   * exactly one Skill and off for the rest. Measuring cap to descender and
   * halving is the same arithmetic the brief does, and it is why the band can
   * be fixed furniture: the content finds the middle of it.
   */
  const mark = cell.skill.flagship ? 20 : 0;
  const height = mark + 12 + 22 + 26 + (meta.length - 1) * 17 + 4;
  const top = CY - height / 2;
  const title = top + mark + 12;
  const part = title + 22;

  return (
    <>
      {cell.skill.flagship ? (
        <rect x={CX - 5} y={top} width="10" height="10" fill="var(--pda-grn)" />
      ) : null}
      <text
        x={CX}
        y={title}
        textAnchor="middle"
        fontSize="17"
        fontWeight={700}
        letterSpacing=".04em"
        fill="var(--pda-txt)"
      >
        {cell.skill.short}
      </text>
      <text
        x={CX}
        y={part}
        textAnchor="middle"
        fontSize={FS.chrome}
        letterSpacing=".18em"
        fill="var(--pda-ink)"
      >
        {name}
      </text>
      {meta.map((line, i) => (
        <text
          key={line}
          x={CX}
          y={part + 26 + i * 17}
          textAnchor="middle"
          fontSize={FS.chrome}
          letterSpacing=".08em"
          fill="var(--pda-txt2)"
        >
          {line}
        </text>
      ))}
    </>
  );
}
