"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import type { CaseMapShapeKey, CaseSkillEntry } from "@/lib/cases/types";

import type { ChipMorph, PdaEntry } from "./PdaEntry";
import type { FlightRect, FlightVars } from "./pdaFlight";
import { CHIP_FS, SKILL_CHIP_H, SKILL_CHIP_W, wrapLines } from "./pdaGlyphs";
import { type LetterSpec, adv } from "./pdaLetters";
import type { PdaShape, PdaWork } from "./pdaRecord";
import { PlacedField, isFormKey } from "./substrateForms";
import { FS } from "./substrateKit";

/**
 * 03 · THE SUBSTRATE — the COMPOUND CARRIER. A dial: forty-seven cells, each
 * lettered along its own arc, five substrate names lettered along a band
 * between hub and cells, and — at rest — a brief in the hub explaining what
 * a substrate IS. On arrival from reading 02 the stream's SKILL is what
 * flies here, and lands lit on its own cell (ADR-071).
 *
 * ⚠ **THIS IS THE PROMOTION OF LAB DIRECTION 38 (ADR-070 U33, 2026-08-18),
 * REWIRED FOR THE SKILL FLIGHT (ADR-071, 2026-08-19).** U33 seated the WORK
 * card in the hub, but the carrier is an ESTATE-WIDE view of every encoded
 * Skill and a specific stream landing on it read as a claim it does not
 * make. ADR-071 splits the persistent objects: the work card is a 1↔2
 * flight, the skill chip is 2↔3, and the hub is left to explain the reading
 * again.
 *
 * ## Why the labels are rotated, and why they had to be
 *
 * ⚠ **FORTY-SEVEN HORIZONTAL LABELS ARE GEOMETRICALLY IMPOSSIBLE ON THIS
 * PLATE, AND ONE ROTATED LABEL PER CELL IS THE ONLY WAY OUT** (owner,
 * 2026-08-18: _"we have to make sure that the labels for each of these skills
 * are visible"_). The annulus holds 299 520 square units, so each of 47 equal
 * cells gets 6 373. A 14-character name at `LABEL_FS` measures 108 units; for
 * it to sit HORIZONTAL in a cell **anywhere on the ring** the cell needs 108
 * units in BOTH directions — because a cell at 3 o'clock is turned ninety
 * degrees from one at 12 — which is 11 664 per cell. That is 1.83× the area
 * that exists. Shrinking type to close the gap drops through the surface's 12
 * floor and lands under 6 px rendered. So the rotation is not a stylistic
 * choice; it is what makes the drawing letter its whole roster at a legible
 * size. Every other rotation on this site is 45° on a shape (ADR-060, ADR-065).
 * This is the first rotated TYPE on the surface, and it is called out because
 * the next pass looking for consistency will reach for it.
 *
 * ## The skill chip is the flight's second HOME (ADR-071, morph since U1)
 *
 * ⚠ **THE CARRIER HAS NO CARTRIDGE ON IT, BUT NOW IT HAS A CHIP — AND THE
 * CHIP'S ARRIVAL IS A SHAPE MORPH.** The plate's own path interpolates from
 * the config chip's rectangle into the destination cell's ring
 * (`carrierChipMorphIn`), the flying name lands on the arc label at
 * `dk = CARRIER_LABEL_FS / CHIP_FS` (the plate's own rung), and the closing
 * fade removes a layer that is pixel-identical to the lit cell beneath —
 * nothing floats, nothing pops. The cell lights AT TOUCHDOWN (the seat-arm
 * animation holds its resting paint through the morph) and stays lit as
 * "seated", so a reader who has opened a stream sees WHICH SKILL runs it in
 * the estate view without having to click again.
 *
 * ⚠ **THE HUB IS NOT A FLIGHT HOME NOW.** The brief carries the reading's
 * argument — _the judgment this work keeps reusing, encoded once by the team
 * that needed it, then drawn on by every team after_ — and lets the reader
 * click any of the forty-seven cells to see its identity. `Aperture` branches
 * on pinned → brief; there is no seated card any more, and the seat rect / K
 * exports left with it.
 *
 * ## The course ladder is derived, not authored
 *
 * ⚠ **U28–U30's LADDER ARGUED THE COUNT CANCELS. IT DID — AND THE NAMES DO
 * NOT.** The old rule was `n >= 10 ? 3 : 2` because the count is the only lever
 * left on grain once cell area is solved for. Once the label has to fit the
 * cell's arc, `longestChars` breaks the symmetry: the ladder is derived by
 * picking the composition of `n` cells into courses whose inner arc clears the
 * part's own worst name plus `LABEL_PAD` per end. Inner courses hold FEWER
 * cells (`[2,3,3,3,3]` for Pattern), so the arc grows inward instead of
 * shrinking — the wrong way round for the U28-era ladder and the right way
 * round for lettering.
 *
 * Cell AREA still falls out equal: the course boundaries are still solved for
 * area share, so the honesty claim is untouched. What moves is the ASPECT.
 *
 * ## Where the air came from (U32)
 *
 * ⚠ **NOTHING WAS OVERFLOWING; THE PLATE WAS SMALLER THAN ITS OWN FIELD**
 * (owner, 2026-08-18: _"it's very crammed … make sure every label fits inside
 * the frame"_). Measuring each RENDERED label against its OWN cell arc found 24
 * to 79 units of slack and not one spill, so "fits" was never the defect. Three
 * other things were: the plate left 110 units of gutter per side inside its own
 * crop; the crop was STATIC while every production reading is elastic, so two
 * of three presets letterboxed; and the depth floor let through 24-unit cells
 * holding 14-unit line boxes.
 */

/* ── The plate ──────────────────────────────────────────────────────────── */

const SIDES = 12;
/** Flat top and floor: vertices straddle the vertical axis by 15°. */
const POLY_ROT = -105;
/** cos(180/SIDES) — a regular polygon's apothem over its circumradius. */
const KAPPA = Math.cos(Math.PI / SIDES);

const CX = 466;
/**
 * The hub's outer edge — the aperture the cells stop short of, the band's inner
 * edge, and since U33 the wall the seated card has to clear.
 *
 * ⚠ **164 → 156, AND THE 8 UNITS WENT TO THE BAND, NOT TO THE CELLS.** The
 * intuitive reading of "the plate is crammed, so shrink the middle" is that hub
 * units are cell units in the wrong place. They are not: `R_CELL` is the radius
 * the INNERMOST course letters at, and a course's arc is `R_CELL × sweep / m`,
 * so pulling the cells inward makes the tightest arc on the plate TIGHTER.
 * Sweeping the whole (hub, cell, rim) space showed air rising monotonically
 * with `R_HUB` — the hub is not what the cells are short of.
 *
 * ⚠ **AND IT CANNOT NOW BE GROWN TO SUIT THE SEAT EITHER.** Growing it means
 * growing `R_CELL` with it (the band's depth is a lettering measure, not
 * slack), and `R_OUT` is already spent to a tenth of the crop's pad — so the
 * annulus thins and cell depth falls against its own floor, which stands at 29
 * achieved against 26 required. The seat is sized to the hub, not the reverse.
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
 * the innermost course's arc shortens (the tightest measure on the plate); push
 * it out and the band's arc grows while the annulus thins.
 */
const R_CELL = 192;
/**
 * ⚠ **356 → 384: THE CELLS' RADIAL AIR IS BOUGHT HERE, AND IT IS NOT FREE.** A
 * thicker annulus is the only lever that adds radial room without shortening an
 * arc, but the crop grows with it (`2κR + 2·pad`) and type is authored in UNITS
 * — so a bigger plate paints the same label SMALLER. The trade is paid for by
 * raising `LABEL_FS` one step in step with it, which is why both moved in one
 * edit: at `R_OUT` 384 with `LABEL_FS` 13 the label lands at 8.24px against
 * U31's 7.75px, so the type comes out AHEAD while minimum cell depth goes
 * 24 → 29 units and the worst cell aspect 9.4 → 8.3.
 *
 * ⚠ `κ · 384` = 370.92 against `CY` 389 — the rim sits 18.08 units inside the
 * crop, so the pad is spent to within a tenth and there is no cushion left at
 * this rim.
 */
const R_OUT = 384;

/**
 * The rim's APOTHEM — the nearest the outer wall ever comes to the centre, at
 * each of the twelve edge midpoints.
 *
 * ⚠ **THIS IS THE WALL THE OUTERMOST COURSE IS ACTUALLY BOUNDED BY, AND
 * MEASURING IT AT `R_OUT` IS WHAT PUT NINETEEN LABELS THROUGH THEIR OWN EDGE**
 * (U34). The rule the whole pass turns on: a CIRCULAR wall is exact; a
 * POLYGONAL INNER wall is worst at its circumradius (so `R_CELL` is its own
 * bound); a POLYGONAL OUTER wall is worst at its apothem.
 *
 * ⚠ It is EXACT here rather than conservative: every outermost cell sweeps
 * 25.9°–37.0° against facets every 30°, so every one of them contains an edge
 * midpoint and reaches this wall. No cell is being given a corridor smaller
 * than the one it has.
 */
const R_APOTHEM = KAPPA * R_OUT;

/* ── The crop ───────────────────────────────────────────────────────────── */

/**
 * ⚠ **THE PLATE IS HEIGHT-SCARCE AT EVERY FIELD SHAPE, SO THE HEIGHT IS THE
 * FIXED TERM AND THE WIDTH IS THE ELASTIC ONE.** This is ADR-070 U12's
 * argument, inverted, and it is inverted because the object is different: the
 * R4 board is a wide drawing in a field that runs narrow, so its crop fixes the
 * WIDTH; the carrier is a regular dodecagon, whose aspect is the constant
 * `1/κ` = 1.035, in fields that measure 1.056 (p1920) to 1.148 (p1440) — every
 * one of them wider than the plate. The scarce dimension is therefore always
 * the vertical, at every preset, with no crossover.
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
 * sits 18.08 units inside the crop, and at the binding preset that paints an
 * 11.4px gap between the plate's outer rule and the console field's wall.
 * ADR-064's bleed law is about a CAPTURE filling its bay; a technical drawing
 * whose outermost machined edge touches its housing has lost its margin.
 */
const CROP_PAD = 18;
export const CARRIER_CROP_PAD = CROP_PAD;
/** `2κ·R_OUT + 2·pad`, rounded up to even so `CY` is a whole unit. */
export const CARRIER_CROP_H = 2 * Math.ceil(KAPPA * R_OUT + CROP_PAD);
/** The plate's own width plus the pad — the floor the elastic width cannot cross. */
export const CARRIER_CROP_W_MIN = 2 * (R_OUT + CROP_PAD);

const CY = CARRIER_CROP_H / 2;

/** The plate's own aspect with its pad — the hinge the two regimes meet at. */
const CROP_ASPECT_0 = CARRIER_CROP_W_MIN / CARRIER_CROP_H;

/**
 * The crop for a field whose width over height is `fieldWOverH`.
 *
 * ⚠ **BOTH AXES ARE ELASTIC, AND ONLY EVER ONE OF THEM AT A TIME.** The plate is
 * a fixed-aspect polygon, so the crop's job is to take the field's aspect and
 * let `meet` keep the bound-axis ratio it already had — U12's law, and growing a
 * crop on its SLACK axis is free. Which axis is slack depends on the field: at
 * `p1280`–`p1920` the console's field is wider than the plate (1.22–1.12
 * against the plate's 1.033) and the width grows; on a TALL desktop window the
 * field runs 0.89 and the HEIGHT is what is going unspent.
 *
 * ⚠ **THE SECOND REGIME IS NOT HYPOTHETICAL AND ITS ABSENCE WAS 132px OF DEAD
 * PANEL** at 845 × 950 — the owner's own window, and within 5px of the 265px
 * that forced U15's generalisation on reading 03 one drawing earlier. A crop
 * that only grows one way is the same defect in a new place: correct at the
 * viewport it was authored at, letterboxed at the other end, and green
 * throughout, because `minPx` measures the drawing against its own crop.
 *
 * ⚠ **THE PLATE STAYS PUT WHILE THE CROP MOVES AROUND IT, VIA THE viewBox's
 * OFFSETS.** The obvious form is a centred crop (`-W/2 -H/2 W H`), and it would
 * mean every coordinate in this file is expressed against a moving origin.
 * Holding `CX`/`CY` still and sliding the crop's top-left instead leaves all 47
 * cells, five fields, both label rings AND the seated card written against
 * constants — the elasticity lives in one expression rather than in every path.
 * It is also what keeps `CARRIER_SEAT_RECT` a constant, which is what lets the
 * flight's third home be one rect at every field shape.
 *
 * ⚠ **`floor` ON BOTH TERMS, AND THE DIRECTION IS THE CONTRACT.** Each floor
 * keeps the crop on the side of the field's aspect that preserves the bound
 * axis: flooring the width holds the crop at or under the field's aspect, so a
 * wide field stays height-bound; flooring the height holds it at or over, so a
 * tall field stays width-bound. Rounding either one UP crosses the hinge by a
 * fraction of a unit — 0.014 % at p1280, invisible on screen — and re-opens the
 * letterbox this closes, which is exactly the kind of term that makes a contract
 * "mostly" hold.
 */
export function carrierCrop(fieldWOverH: number): string {
  const a = fieldWOverH > 0 ? fieldWOverH : CROP_ASPECT_0;
  /* Mutually exclusive by construction: past the hinge the width grows and the
     height's term falls under its floor, and under it the reverse. */
  const w = Math.max(CARRIER_CROP_W_MIN, Math.floor(CARRIER_CROP_H * a));
  const h = Math.max(CARRIER_CROP_H, Math.floor(CARRIER_CROP_W_MIN / a));
  return `${CX - w / 2} ${CY - h / 2} ${w} ${h}`;
}

/** The rest crop — the narrowest a field can ask for, used where none is known. */
export const CARRIER_VIEWBOX = carrierCrop(0);

/* ── The rings inside the plate ─────────────────────────────────────────── */

/**
 * The band's mid-radius, where each substrate name letters along its arc. The
 * midpoint of the band is the natural centre; at 36 units deep that is 18 units
 * of clearance to either edge against a 14-unit line box.
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
 * so the only way to buy air AND cross 8px was to step the type with the plate.
 *
 * ⚠ **14 DOES NOT FIT AND THAT IS A LADDER FACT, NOT A TASTE ONE.** A step to
 * 14 widens every name by 7.7 %, and `Tracker Check` on `validation`'s sweep
 * already binds at 13 — the ladder would have to re-cut to a coarser
 * composition, trading back the depth this pass bought. 13 is the top of the
 * range this geometry supports.
 *
 * ⚠ **IT IS ALSO THE SEAT'S SCALE NOW** — see `HUB_K`. Moving this rung moves
 * the seated card with it, on purpose: the work's name and the Skills' names
 * are the same rung of the same drawing.
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
 *
 * ⚠ **12 → 10 (U34), AND IT IS THE SAME ARGUMENT A THIRD TIME.** The pad is a
 * floor the LADDER solves against, never the clearance the drawing ends up
 * with. U34 pulls every internal boundary in by `polygonShare` (0.9758–0.9779),
 * which takes `validation`'s second course from a 128.9-unit inner arc to
 * 125.9 against a 128.8-unit target — the part stops solving at 11, on a
 * knife-edge that was already 0.1 units wide before this pass. At 10 the
 * ladders come back byte-identical to what shipped and the binding constraint
 * is `MIN_CELL_DEPTH` again, which is where it belongs.
 */
const LABEL_PAD = 10;

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
 * offsets on the two halves.
 *
 * ⚠ **THE TWO FAMILIES NEED DIFFERENT NUMBERS AND IT IS NOT A TUNING CHOICE.**
 * A Skill is sentence case, so ascenders and descenders both land and the ink is
 * near-symmetric about the em. A substrate name is uppercase, where nothing
 * falls below the baseline at all — its ink runs `baseline − capHeight` to
 * `baseline`, so its centre is a full half cap-height up.
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
 * with no descender — which is exactly the band's case.
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
 * was a number no cell was responsible for: the gate said 7.46 and the thing it
 * named was the five region names, which are the most structural strings here.
 *
 * ⚠ **`STAKEHOLDER` IS THE BINDING NAME AND THE TRACK IS THE LEVER THAT FREED
 * IT** — the LONGEST label on the NARROWEST part's 37° sweep, which is 100u of
 * arc after `BAND_PAD`. At 13/0.08 it needs 97u (1.3u per end, a collision
 * waiting for a one-character content edit). At 13/**0.05** it needs 93u, i.e.
 * **3.75u per end**. The chrome grammar is DIRECTION (uppercase, tracked WIDER
 * than a Skill's 0.02), never a specific step, so 0.05 still reads structural.
 *
 * ⚠ It matches `LABEL_FS` rather than sitting under it, and the register still
 * ranks correctly: uppercase at 13 carries a 9.1u cap height against sentence
 * case's 6.5u x-height, so **the band reads larger than the Skills it heads at
 * the same font size**.
 */
const BAND_FS = 13;
const BAND_TRACK = 0.05;
const BAND_PAD = 6;

/**
 * The floor for cell depth — the derived ladder's second constraint, and the
 * reason inner courses hold fewer cells.
 *
 * ⚠ **22 → 26, WHICH IS WHAT "CRAMMED" ACTUALLY MEANT.** At 22 the floor let
 * through cells of 226 × 24: a 14-unit line box in a 24-unit band is 5 units of
 * air per side against 21 at the ends, an aspect of 9.4, and the reader sees a
 * name pressed between two walls with a corridor of empty material beside it.
 * **The arcs were never the problem.** 26 forbids the shallow cells outright
 * and the ladder re-cuts around it; the achieved minimum is 29, so this is a
 * guard with three units of margin rather than a value the drawing sits on.
 *
 * ⚠ **26 → 23 (U34), BECAUSE THE DEPTH IS MEASURED AGAINST A DIFFERENT WALL
 * NOW, NOT BECAUSE THE FLOOR GOT SOFTER.** The last course's outer wall is the
 * dodecagon, whose worst position is its APOTHEM — so its usable depth is
 * `κ·R_OUT − r0`, which is 13.1 units less than the `R_OUT − r0` this floor
 * used to be handed. `stakeholder`'s outermost course measures 24.5 there, and
 * its only alternative composition (`1,1,1,2`) puts a two-cell course on a
 * 101-unit arc against a 112-unit target. So the number came down by exactly
 * what the measurement changed by, and the ACHIEVED clearance is what to read:
 * 5.4 units of ink air per side at the worst cell, against 5 asserted.
 */
const MIN_CELL_DEPTH = 23;

/** Five structural clearances, removed from the 360° sweep before it is split. */
const GROUP_GAP = 2.4;
/** One cell's total angular clearance — 2.2 units of gap at the label rung. */
const CELL_GAP = 0.5;
/** Radial clearance at an INTERNAL course seam. The rim and the inner ring stay
 *  flush: a cell that does not reach the wall it is bounded by reads as a
 *  margin, and this plate has no margin. */
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
export function boxClearance(dy: number, hw: number, hh: number, circumradius: number): number {
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
 * The polygon ring between two angles, AS A POLYLINE — every vertex inside the
 * span is emitted.
 *
 * ⚠ A CHORD IS NOT AN EDGE ONCE A PART SPANS MORE THAN ONE OF THEM. Pattern
 * sweeps 103.66°, which is three and a half of the dodecagon's twelve edges;
 * closing that with a single chord cuts 44 units inside the rim and takes the
 * part's area with it.
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

/**
 * The CONCENTRIC ring between two angles, as a polyline — the internal course
 * seams (ADR-070 U34).
 *
 * ⚠ **THE DODECAGON IS THE HOUSING; THE DIVISION INSIDE IT IS CONCENTRIC.**
 * Every ring on this plate used to be twelve-sided while every label rode a
 * circle, and a dodecagon's radius dips to `κ·R` at each edge midpoint — 13.1
 * units at `R_OUT`. The wall swung inward and the label did not follow, so **19
 * of 47 labels' ink crossed their cell's outer wall** (worst: `Feedback` −5.0u,
 * `Localization` −3.3u) while every guard reported 7–12 units of air on both
 * sides, because they measured `cell.r0`/`cell.r1` — the nominal radii, not the
 * wall the renderer paints. ADR-065's own law one level up: the housing carries
 * the machined geometry and the things seated inside it do not repeat it. The
 * silhouette, the hub, the band's inner ring and the outermost cells' outer
 * edge are all still twelve-sided; the four internal seams per part are not.
 *
 * ⚠ **IT IS A SAMPLED POLYLINE AND MAY NEVER BECOME AN `A` COMMAND.**
 * ADR-071's arrival morph interpolates the CSS `d` property between the config
 * chip's rectangle and this cell's own ring, which needs ONE command structure
 * (`M` + n×`L` + `Z`) on both ends — `pda-flight` pins it, and a mismatch does
 * not error, it snaps the interpolation discrete with nothing on screen to say
 * why. `SEAM_STEP` 3° puts the chord's sagitta at 0.10 units on a 300-unit
 * radius, i.e. a sixteenth of a device pixel at the binding meet.
 */
const SEAM_STEP = 3;

function circleRing(a0: number, a1: number, r: number): CarrierPoint[] {
  const n = Math.max(1, Math.ceil(Math.abs(a1 - a0) / SEAM_STEP));
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return { x: CX + r * Math.cos(rad(a)), y: CY + r * Math.sin(rad(a)) };
  });
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
 * The unit polygon's sector area over an angular span — the constant that makes
 * the equal-area claim exact rather than approximate.
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

/* ── The skill chip's landing — the flight's second home (ADR-071) ─────── */

/**
 * THE CHIP'S LANDING SCALE — `LABEL_FS / CHIP_FS`, which is 0.9286.
 *
 * ⚠ **THE RULE IS THAT THE SKILL'S NAME LETTERS AT THE PLATE'S OWN LABEL
 * RUNG.** Reading 02's chip letters the skill at `CHIP_FS` (14 units); the
 * carrier's 47 cell labels letter at `LABEL_FS` (13 units). The flight's
 * uniform `dk = 13/14` lands the flown text at the size the 46 names around
 * it sit at, so the moment the flying name hands over to the arc label the
 * reader sees the same text in the same size — continuity by construction
 * rather than by tuning.
 *
 * ⚠ **IT MUST STAY UNDER 1**, which is where the chip would land LARGER than
 * its own home — a shrinking flight, always. Here `13/14` is under 1 and the
 * chip lands a hair smaller than its config home, which is what the reader
 * reads as "arrived and settled".
 */
const CHIP_K = LABEL_FS / CHIP_FS;
export const CARRIER_CHIP_K = CHIP_K;

/**
 * The skill chip's landing rect at one cell — centred on the cell's ARC
 * MIDPOINT (`carrierCellArcRadius` × the angular midpoint), sized to the
 * chip at the label rung.
 *
 * ⚠ **THIS RECT IS THE FLIGHT'S ARITHMETIC ANCHOR, NOT WHAT THE READER
 * SEES LAND** (U1). `pdaFlight` needs a rect pair to compute the pose, and
 * the MORPH projection is anchored on this one — but the plate the reader
 * watches is `carrierChipMorphIn`'s interpolating path, which settles into
 * the CELL'S OWN RING rather than into this box. The name's landing box
 * (`carrierSkillNameRect`) shares this rect's centre, which is how the two
 * instruments stay one journey.
 */
export function carrierSkillDock(cell: CarrierCell): FlightRect {
  const midA = (cell.a0 + cell.a1) / 2;
  const arcR = carrierCellArcRadius(cell);
  const cx = CX + arcR * Math.cos(rad(midA));
  const cy = CY + arcR * Math.sin(rad(midA));
  const w = SKILL_CHIP_W * CHIP_K;
  const h = SKILL_CHIP_H * CHIP_K;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

/**
 * The tangent rotation the chip inherits AT LANDING — the label's own
 * rotation, in degrees, so the chip's plate aligns with the arc it lands on.
 * Baked into the base render via `<g transform="rotate(...)">`; the flight's
 * `dr` compensates so the source pose stays unrotated on the config board.
 */
export const carrierChipRotation = (cell: CarrierCell): number =>
  carrierLabelRotation((cell.a0 + cell.a1) / 2);

/* ── The morph: the plate BECOMES the cell (ADR-071 U1) ─────────────────── */

/**
 * ⚠ **THE FIRST ARRIVAL SHIPPED AS A FLOATING FRAME AND THE OWNER CALLED IT
 * (2026-08-19: "we just see a frame floating, and then it fades away, which
 * is the last thing I want").** A rectangle translated onto a wedge and then
 * faded is two objects pretending to be one — the shapes never agree, so the
 * dissolve is the moment the trick is visible. The honest gesture is a SHAPE
 * MORPH: the plate's outline interpolates into the cell's own outline, so at
 * touchdown the flying object IS the cell and the final fade removes a layer
 * that is pixel-identical to the lit cell beneath it. Nothing "disappears".
 *
 * ## How CSS carries it
 *
 * The `d` property is animatable when both paths share ONE command structure
 * (`M` + n×`L` + `Z` with equal n). Both ends are emitted by the builders
 * below from the same point counts, so the structures match by construction
 * — `pda-flight` asserts the counts, because a mismatch does not fail, it
 * snaps the interpolation to a discrete jump with nothing on screen to say
 * why.
 *
 * ## Point correspondence, and why the rect is sampled the way it is
 *
 * The cell's ring is `outer arc (a0→a1)` then `inner arc (a1→a0)`. The rect
 * is sampled to mirror that anatomy: its TOP edge takes the outer arc's
 * count, its BOTTOM edge (walked backwards) the inner's — so the top bows
 * into the rim-side arc, the bottom into the hub-side arc, and the two
 * verticals become the radial cuts. `flip` keeps the correspondence
 * SCREEN-ALIGNED: when the wedge's a0 end sits to the RIGHT on screen (the
 * dial's left half), the rect samples right-to-left, otherwise the morph
 * crosses itself mid-flight and reads as the plate turning inside out.
 */
const ringPath = (points: readonly CarrierPoint[]): string =>
  `M${points.map((p) => pt(p)).join(" L")} Z`;

/** `n` points from `(x0,y0)` to `(x1,y1)` inclusive — the rect's edge run. */
function sampleEdge(x0: number, y0: number, x1: number, y1: number, n: number): CarrierPoint[] {
  if (n === 1) return [{ x: (x0 + x1) / 2, y: (y0 + y1) / 2 }];
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t };
  });
}

/** The rect as a ring with the CELL's own point counts. */
function rectRing(r: FlightRect, nTop: number, nBottom: number, flip: boolean): CarrierPoint[] {
  const top = flip
    ? sampleEdge(r.x + r.w, r.y, r.x, r.y, nTop)
    : sampleEdge(r.x, r.y, r.x + r.w, r.y, nTop);
  const bottom = flip
    ? sampleEdge(r.x, r.y + r.h, r.x + r.w, r.y + r.h, nBottom)
    : sampleEdge(r.x + r.w, r.y + r.h, r.x, r.y + r.h, nBottom);
  return [...top, ...bottom];
}

export interface ChipMorphPaths {
  /** The pose the plate ENTERS at — same structure as `to`. */
  from: string;
  /** The pose the plate SETTLES into. */
  to: string;
}

/**
 * THE ARRIVING MORPH (2→3), in the CARRIER's own user units.
 *
 * `vars` is the plate flight (`pdaFlight(config chip → carrier dock)`), whose
 * `dx/dy/dk` place the incoming pose: the chip appears where the reader last
 * saw it — the config board's SKILL slot — and the path interpolates from
 * that rectangle into the cell's own ring. No transform is involved; the
 * path itself carries the whole journey, which is what lets the shape change
 * en route.
 */
export function carrierChipMorphIn(cell: CarrierCell, vars: FlightVars): ChipMorphPaths {
  const dock = carrierSkillDock(cell);
  const start: FlightRect = {
    x: dock.x + dock.w / 2 + vars.dx - (dock.w * vars.dk) / 2,
    y: dock.y + dock.h / 2 + vars.dy - (dock.h * vars.dk) / 2,
    w: dock.w * vars.dk,
    h: dock.h * vars.dk,
  };
  const flip = cell.outer[0].x > cell.outer[cell.outer.length - 1].x;
  return {
    from: ringPath(rectRing(start, cell.outer.length, cell.inner.length, flip)),
    to: ringPath([...cell.outer, ...cell.inner]),
  };
}

/**
 * THE DEPARTING MORPH (3→2), in the CONFIG board's user units.
 *
 * The wedge is projected into the config crop through the same affine the
 * flight describes: `vars` is `pdaFlight(carrier dock → config chip)`, whose
 * pose puts the chip's rect at the cell's screen position — so the map that
 * carries the WHOLE wedge across is anchored on those two rects:
 *
 *   `T(p) = chipCentre + (dx, dy) + s · (p − dockCentre)`,  `s = dk · chipW / dockW`
 *
 * ⚠ `s` IS THE CROP-TO-CROP UNIT RATIO, derived rather than free: the flight
 * already had to relate the two crops to compute `dk`, and a second constant
 * for the same relation is one that can disagree with it.
 */
export function carrierChipMorphOut(
  cell: CarrierCell,
  vars: FlightVars,
  chip: FlightRect
): ChipMorphPaths {
  const dock = carrierSkillDock(cell);
  const s = (vars.dk * chip.w) / dock.w;
  const ax = chip.x + chip.w / 2 + vars.dx;
  const ay = chip.y + chip.h / 2 + vars.dy;
  const bx = dock.x + dock.w / 2;
  const by = dock.y + dock.h / 2;
  const project = (p: CarrierPoint): CarrierPoint => ({
    x: ax + s * (p.x - bx),
    y: ay + s * (p.y - by),
  });
  const flip = cell.outer[0].x > cell.outer[cell.outer.length - 1].x;
  return {
    from: ringPath([...cell.outer, ...cell.inner].map(project)),
    to: ringPath(rectRing(chip, cell.outer.length, cell.inner.length, flip)),
  };
}

/**
 * The flying NAME's landing box — centred where the cell's own arc label
 * letters (`carrierCellArcRadius` × the angular midpoint), sized to the
 * label's nominal line box at the plate's rung. The name flies its OWN
 * `pdaFlight` (source = the chip's rendered name box on the config board),
 * so it lifts off exactly where it was and touches down exactly on the arc
 * label it hands over to — the plate's flight cannot serve it because the
 * name is left-anchored in the plate and centre-anchored on the arc.
 */
export function carrierSkillNameRect(cell: CarrierCell, name: string): FlightRect {
  const midA = (cell.a0 + cell.a1) / 2;
  const arcR = carrierCellArcRadius(cell);
  const cx = CX + arcR * Math.cos(rad(midA));
  const cy = CY + arcR * Math.sin(rad(midA));
  const w = name.length * adv(LABEL_FS, LABEL_TRACK);
  const h = LABEL_FS * 1.3;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

export interface CarrierPlate {
  crop: string;
}

/**
 * THE PLATE AT ONE FIELD SHAPE, on the console's own aspect convention.
 *
 * ⚠ **THE CONSOLE MEASURES `height / width` AND THIS CROP IS WRITTEN IN
 * `width / height`.** One reading taking the reciprocal at its own boundary is
 * the whole reason this wrapper exists rather than `carrierCrop` being called
 * directly from `PdaConsole` — an inverted aspect does not throw, it just
 * letterboxes the drawing to a sliver and reads as a rendering fault.
 */
export function carrierPlate(aspect: number): CarrierPlate {
  return { crop: carrierCrop(aspect > 0 ? 1 / aspect : 0) };
}

/* ── The course ladder ──────────────────────────────────────────────────── */

/**
 * The advance model both the guard and the drawing letter against. `adv(fs,
 * track)` is `fs × (0.6 + track)` — PT Mono's cell width plus what the tracking
 * `letter-spacing` adds. It is `pdaLetters`' own, shared with every other
 * lettered thing on this console, so re-tuning the letter model there re-tunes
 * it here.
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
 * The rule: enumerate compositions of `n` into 1..n courses, pick the one that
 * (a) clears `carrierArcTarget(longestChars)` on every course's inner arc, (b)
 * clears `MIN_CELL_DEPTH` on every course's depth, and (c) minimises the max
 * aspect ratio (`arc/depth`) so no cell is a thin slit.
 *
 * ⚠ RETURNS `null` IF NO LADDER FITS. The caller falls back to the U28 authored
 * rule, which lets `carrierLayout` still produce a drawing at record shapes the
 * derivation would fail on (a stubbed fixture, a longer authored name). The
 * lettering guard catches the fallout on the record we actually ship.
 */
export function carrierCourses(
  n: number,
  sweepRad: number,
  longestChars: number,
  R_INNER = R_CELL,
  R_OUTER = R_OUT,
  minDepth = MIN_CELL_DEPTH,
  /**
   * The part's polygon-over-circle radius factor (`carrierPolygonShare`), so the
   * ladder is solved against the boundaries the drawing will actually cut. 1
   * leaves the pre-U34 pure-circular partition, which is what a caller with no
   * part in hand wants.
   */
  share = 1
): number[] | null {
  if (n < 1) return null;
  const target = carrierArcTarget(longestChars);
  const span = R_OUTER * R_OUTER - R_INNER * R_INNER;
  /* ⚠ THE LAST COURSE IS BOUNDED BY THE POLYGON, SO ITS DEPTH ENDS AT THE
     APOTHEM. Measuring it at `R_OUTER` hands the floor 13.1 units the label
     cannot use — which is the U34 defect stated as arithmetic. */
  const outerWall = R_OUTER === R_OUT ? R_APOTHEM : R_OUTER;
  const holder: { best: { co: number[]; score: number } | null } = { best: null };

  const feasible = (co: readonly number[]): number | null => {
    let cum = 0;
    let prev = R_INNER;
    let score = 0;
    for (const [i, m] of co.entries()) {
      cum += m;
      const last = i === co.length - 1;
      const next = last ? R_OUTER : share * Math.sqrt(R_INNER * R_INNER + (cum / n) * span);
      const arc = prev * (sweepRad / m);
      const dep = (last ? outerWall : next) - prev;
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
 * capture; this is what stops a stubbed fixture from throwing at render.
 */
export const carrierCoursesAuthored = (n: number): number[] => {
  const c = Math.max(1, Math.min(n, n >= 10 ? 3 : 2));
  const base = Math.floor(n / c);
  const rem = n - base * c;
  return Array.from({ length: c }, (_, i) => base + (i >= c - rem ? 1 : 0));
};

/**
 * The part's POLYGON-OVER-CIRCLE radius factor — `√(P / C)`, where `P` is the
 * dodecagon's unit sector area over the part's sweep and `C` the circle's
 * (`Δθ/2`).
 *
 * ⚠ **ONE FACTOR IS THE WHOLE CORRECTION, AND IT FALLS OUT OF THE ALGEBRA.**
 * With the first and last courses bounded by polygons and everything between
 * them bounded by circles, the cumulative-area solve is
 * `r_k = √((P/C)·(R_CELL² + (cum/n)·span))` — i.e. exactly the pre-U34
 * expression scaled by this. It measures 0.9758–0.9779 across the five parts,
 * so every internal boundary pulls in by about 2.3 %, which is what pays the
 * outermost course back for the material the rim's facets take off it.
 *
 * ⚠ **THE PART TOTAL IS UNCHANGED** (`P·(R_OUT² − R_CELL²)`), so the
 * equal-area claim still holds at part level by construction rather than by
 * tuning.
 */
export const carrierPolygonShare = (a0: number, a1: number): number =>
  Math.sqrt(unitSectorArea(a0, a1) / (rad(a1 - a0) / 2));

/**
 * The area one wall encloses over a sweep — the polygon's own sector constant
 * where the wall is the housing, the circle's where it is the division.
 */
const sectorTerm = (a0: number, a1: number, r: number, polygonal: boolean): number =>
  (polygonal ? unitSectorArea(a0, a1) : rad(a1 - a0) / 2) * r * r;

/** Course boundaries whose area shares equal their cell shares. */
export const carrierRadii = (courses: readonly number[], n: number, share = 1): number[] => {
  const span = R_OUT * R_OUT - R_CELL * R_CELL;
  const out = [R_CELL];
  let cum = 0;
  for (const m of courses) {
    cum += m;
    out.push(share * Math.sqrt(R_CELL * R_CELL + (cum / n) * span));
  }
  out[out.length - 1] = R_OUT;
  return out;
};

/**
 * ⚠ **A SEAM IS SHARED, SO IT CANNOT BE SOLVED PER CELL** — recorded because
 * the per-cell solve is the obvious next idea and it does not close.
 *
 * With course 0 bounded inward by the polygon at `R_CELL` and the last course
 * bounded outward by it at `R_OUT`, those two courses' cell areas carry the
 * dodecagon's own sector variation (`unitSectorArea` differs cell to cell by
 * where the cell sits against the twelve facets). Solving each polygon-bounded
 * cell's FREE boundary for its exact share would zero that — but that boundary
 * is the neighbouring course's wall, the two courses hold different cell counts
 * so their cells do not align angularly, and the correction just cascades into
 * the next course with a `COURSE_GAP` that now varies by up to a unit.
 *
 * So the seams stay per course, `carrierPolygonShare` makes each part's
 * cumulative areas exact, and the residue is what it has always been on this
 * plate: **the rim's own modulation**, `1 − cos(15°)` = 3.41 %. What changed is
 * that it used to appear at BOTH walls of every cell, where it partly cancelled
 * in `r1² − r0²`, and now appears at one wall of two courses. The area guard's
 * tolerance is set from the measured spread and says so.
 */

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
  /** The DRAWN inner wall's radius — gaps included (U34). It is also its own
   *  worst case: where this wall is the polygon (course 0) the nearest it comes
   *  to the label is its circumradius. */
  r0: number;
  /** The DRAWN outer wall's radius, gaps included. ⚠ NOT the wall a label has
   *  to clear when the wall is the polygon — see `outerWall`. */
  r1: number;
  /**
   * The radius the label must clear OUTWARD: `r1` for a concentric seam,
   * `κ·R_OUT` for the rim.
   *
   * ⚠ **THE FIELD EXISTS BECAUSE ITS ABSENCE PUT NINETEEN LABELS THROUGH THEIR
   * OWN EDGE.** The distance from the centre to a dodecagon's wall is not one
   * number, and every guard on this drawing asked for `r1` — which is the wall
   * only at the twelve vertices.
   */
  outerWall: number;
  d: string;
  /** The drawn outer polyline — the flagship's green provenance rides it. */
  outer: CarrierPoint[];
  /**
   * The drawn inner polyline, running BACK (a1 → a0) so `[...outer, ...inner]`
   * is the cell's closed ring in draw order.
   *
   * ⚠ **STORED SO THE MORPH AND THE DRAWN CELL ARE ONE SOURCE** (ADR-071 U1).
   * The arrival morph interpolates a path INTO this cell's own outline, and a
   * target regenerated by a second builder is a target that can drift a point
   * count away from the drawing — at which point CSS `d` interpolation snaps
   * discrete instead of morphing, with nothing on screen to say why.
   */
  inner: CarrierPoint[];
  area: number;
}

export interface CarrierGroup {
  key: CaseMapShapeKey;
  name: string;
  /**
   * WHAT THE SHAPE MEANS, AS A SENTENCE — `CaseMapShape.meaning`, the record's
   * only prose and the one field its projection does not uppercase.
   *
   * ⚠ **IT LETTERED NOWHERE ON THIS CONSOLE UNTIL THE HUB LEARNED TO ANSWER**
   * (owner, 2026-08-23: _"maybe when you click on for example pattern or voice
   * the center shows what it means"_). U23 put it on the divided plate, U25's
   * SECTION carried it in a stratum head, and the carrier had no room for a
   * paragraph anywhere on its dial — so the field survived two redraws as
   * content the drawing held and never said. The hub is where it fits, because
   * the hub is the one region on this plate sized for reading rather than
   * scanning.
   */
  meaning: string;
  skills: readonly CaseSkillEntry[];
  a0: number;
  a1: number;
  mid: number;
  courses: number[];
  radii: number[];
  /** The whole part (its material clip). Runs `R_CELL..R_OUT` — the band is its
   *  own region, above the cells. */
  d: string;
  bbox: { x: number; y: number; w: number; h: number };
  /** The field's density multiplier. See `carrierFieldK`. */
  fieldK: number;
  /** The part's longest short name in characters — the input that drives its
   *  course ladder, and what the guard asserts every cell letters within. */
  longestChars: number;
}

/**
 * The drawing's own slice of the record.
 *
 * ⚠ `skills` IS OPTIONAL SO A STUBBED FIXTURE STILL TYPES. `carrierLayout`
 * returns an empty drawing rather than throwing on a record with no roster,
 * which is what lets the labs mount partial records and the guards walk them.
 */
export interface CarrierRecord {
  shapes: readonly PdaShape[];
  skills?: readonly CaseSkillEntry[];
}

/**
 * ⚠ `engine` IS THE PATTERN, lowercased. The Skills reservoir types it as a
 * free `string` carrying a `CaseWorkShape` ("Judgment") and the map's shapes key
 * on `"judgment"` — one join, declared once.
 */
const skillsOf = (skills: readonly CaseSkillEntry[], key: CaseMapShapeKey) =>
  skills.filter((s) => s.engine.toLowerCase() === key);

/**
 * ⚠ **A CLIPPED FIELD LOSES ITS DENSITY, AND THE PAINTERS COUNT IN ABSOLUTES.**
 * `substrateForms` paints `260·k` marks into a `w × h` BOX (its own head says
 * the counts are absolute, not per-area) — but a part is a WEDGE inside that
 * box, so every mark outside the wedge is clipped away and the field arrives
 * thinned by exactly the fraction the wedge does not cover. On this plate a part
 * fills 58–67 % of its own bounding box, which is why the first cut's five
 * materials read as one dark texture with a few dots in it: the differentiation
 * was drawn and then thrown away by the clip.
 *
 * So `k` is the RECIPROCAL COVERAGE — box area over part area — and the field
 * lands at the density its painter was authored for. Capped at 3, because beyond
 * that a wedge is thin enough that the honest fix is a bigger box.
 *
 * ⚠ **COVERAGE DOES NOT RISE WITH SWEEP, IT FALLS.** The intuition that a wider
 * part fills more of its own box is right for a solid pie slice and wrong for an
 * ANNULAR one: widen the sweep and the box grows to enclose the aperture's hole,
 * which the part does not occupy.
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
export function carrierLayout(record: CarrierRecord): {
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
    /* ⚠ THE LADDER IS DERIVED FROM THE NAMES, WITH THE U28 AUTHORED RULE AS A
       FALLBACK. On the shipped record the derivation always solves; the fallback
       exists so a stubbed fixture cannot throw. */
    /* ⚠ THE LADDER IS SOLVED AGAINST THE BOUNDARIES THE DRAWING WILL CUT
       (U34) — the part's own polygon share, so the derivation and the
       partition cannot disagree about where a course ends. */
    const share = carrierPolygonShare(groupA0, groupA1);
    const courses =
      carrierCourses(n, sweepRad, longestChars, R_CELL, R_OUT, MIN_CELL_DEPTH, share) ??
      carrierCoursesAuthored(n);
    const radii = carrierRadii(courses, n, share);
    const run = ordered(mine, courses);

    let taken = 0;
    for (const [course, m] of courses.entries()) {
      const first = course === 0;
      const last = course === courses.length - 1;
      /* ⚠ THE WALLS ARE THE DRAWN ONES NOW, GAPS INCLUDED (U34). `r0`/`r1`
         used to carry the NOMINAL partition radii while the ring was cut at
         the gapped ones — which is a second model of the same cell, and the
         label was centred against the model rather than against the material.
         The rim and the band's ring stay flush: only an INTERNAL seam takes a
         gap, because a cell that does not reach the wall it is bounded by
         reads as a margin and this plate has no margin. */
      const inner = first ? radii[course] : radii[course] + COURSE_GAP / 2;
      const outer = last ? radii[course + 1] : radii[course + 1] - COURSE_GAP / 2;
      /* ⚠ AND THE WALL A LABEL CLEARS IS NOT ALWAYS THE WALL'S RADIUS. A
         circular wall is exact; a polygonal INNER wall is worst at its
         circumradius, so `inner` already is its own bound; a polygonal OUTER
         wall is worst at its APOTHEM. Nineteen labels crossed their edge
         because this distinction did not exist. */
      const outerWall = last ? R_APOTHEM : outer;
      const cellSweep = (groupA1 - groupA0) / m;

      for (let i = 0; i < m; i += 1) {
        const a0 = groupA0 + cellSweep * i;
        const a1 = a0 + cellSweep;
        const g0 = a0 + CELL_GAP / 2;
        const g1 = a1 - CELL_GAP / 2;
        /* The housing's walls are polygonal, the division between them is
           concentric — and BOTH are polylines, because the morph interpolates
           this ring's `d` and an `A` command would break its structure. */
        const outerRing = last ? ringArc(g0, g1, outer) : circleRing(g0, g1, outer);
        const innerRing = first ? ringArc(g1, g0, inner) : circleRing(g1, g0, inner);
        cells.push({
          skill: run[taken + i],
          key,
          index: cells.length,
          course,
          a0,
          a1,
          r0: inner,
          r1: outer,
          outerWall,
          /* ⚠ BUILT FROM THE SAME TWO RINGS THE MORPH USES — `sectorPath`
             would produce the identical string, but a second call is a second
             chance to drift. One pair of arrays, three consumers (the drawn
             cell, the flagship's provenance line, the arrival morph). */
          d: `M${[...outerRing, ...innerRing].map((p) => pt(p)).join(" L")} Z`,
          outer: outerRing,
          inner: innerRing,
          /* ⚠ THE AREA IS THE PARTITION'S, NOT THE GAPPED RING'S, AND EACH
             WALL IS INTEGRATED WITH ITS OWN CONSTANT (U34). `CELL_GAP` and
             `COURSE_GAP` are clearances removed from every cell alike, so
             they say nothing about share; but a polygonal wall and a circular
             one enclose different area at the same radius, and one shared
             constant across a mixed ring is the equal-area claim measuring a
             cell the drawing does not cut. */
          area:
            sectorTerm(a0, a1, radii[course + 1], last) - sectorTerm(a0, a1, radii[course], first),
        });
      }
      taken += m;
    }

    const mid = (groupA0 + groupA1) / 2;
    /* ⚠ THE PART RUNS `R_CELL..R_OUT`, NOT `R_HUB..R_OUT`. The band lives above
       the cells (`R_HUB..R_CELL`) and is not the part's material — the clip that
       would otherwise thin the band's substrate name with a physics field stops
       at the cells' inner ring. */
    const d = sectorPath(groupA0, groupA1, R_CELL, R_OUT);
    const bbox = bboxOf([
      ...ringArc(groupA0, groupA1, R_OUT),
      ...ringArc(groupA1, groupA0, R_CELL),
    ]);
    const area = (R_OUT * R_OUT - R_CELL * R_CELL) * unitSectorArea(groupA0, groupA1);
    groups.push({
      key,
      name: shapes.get(key)?.name ?? key.toUpperCase(),
      meaning: shapes.get(key)?.meaning ?? "",
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
 * one team, tapped by the next"_. This is that claim with the spatial framing
 * dropped, because "below grade" was the SECTION drawing's word and there is no
 * grade on a plate. Sentence case, like `CaseMapShape.meaning` and for the same
 * reason: it is the one thing here meant to be read rather than scanned.
 */
const BRIEF =
  "The judgment this work keeps reusing — encoded once by the team that needed it, then drawn on by every team after.";
const BRIEF_FS = 13;
const BRIEF_TRACK = 0.02;
/**
 * ⚠ DERIVED FROM THE MEASURE, NOT GUESSED. `wrapLines` breaks on CHARACTER
 * count, so the per-line budget has to be the measure divided by this font's own
 * advance.
 *
 * ⚠ **THE FACE CHANGED AND THE BUDGET DID NOT** (ADR-085 U2). It was
 * `adv(13, .02)` = 8.06 against the 248 measure, i.e. 30.8. IBM Plex Sans is
 * NARROWER — `hubAdv(13, .02)` is 7.15, which would allow 34 — and 30 is kept
 * deliberately: the extra characters buy nothing the hub needs, the shorter
 * measure sits further inside the chamfered chord, and re-wrapping settled copy
 * to fill a new budget is how a line count changes under a guard that only
 * checks the words all survived. The slack is banked, not spent.
 */
const BRIEF_PER = 30;
/**
 * ⚠ `wrapLines` TRUNCATES AT ITS CAP — it ends `out.slice(0, max)`, so a cap set
 * to the line count the current copy happens to need drops a word silently the
 * moment the copy grows. The cap has slack and `carrierBriefFits` asserts the
 * wrap gave back every word.
 */
const BRIEF_MAX = 6;
/**
 * ⚠ **THE MEASURE IS THE HUB'S NARROWEST USEFUL POINT, NOT ITS WIDEST.** The
 * text sits in the straight-walled middle, but a line wider than the material
 * beside it reads as text escaping its own well even though nothing is
 * clipping. 248 keeps every line inside the chamfered chord.
 */
const BRIEF_MEASURE = 248;
const BRIEF_LINE_H = 19;
/** Title baseline below the block's top — the pinned SKILL readout's own rung,
 *  so the two hub states sit on one ladder rather than two. */
const SHAPE_TITLE_DROP = 22;
/**
 * The sentence's first baseline.
 *
 * ⚠ **THERE IS NO COUNT ROW BETWEEN THEM, AND A GUARD IS WHY.** The first cut
 * of this readout put `14 SKILLS` here, on the pinned SKILL readout's chrome
 * rung — and `substrate-lab-fit` failed it with _"the nameplate's count row came
 * back"_. That assertion exists because U28 removed exactly this row on the
 * owner's ruling (_"just give a brief explanation… don't talk about 47 encoded
 * skills"_), and its comment names the failure mode precisely: **every future
 * pass that wants to say how much reaches for a digit first.** This drawing
 * counts by AREA. The guard caught the author of this line doing it.
 */
const SHAPE_BODY_DROP = 22 + 30;
/**
 * ⚠ BASELINE-CENTRED TEXT SITS HIGH. A line's ink is mostly ABOVE its baseline,
 * so centring the BASELINES on `CY` centres the wrong thing. Three units down is
 * the cap-height correction.
 */
const BRIEF_DROP = 3;

const HUB_META_CHARS = 22;

/**
 * ⚠ **THE HUB'S OWN ADVANCE MODEL — IBM PLEX SANS, MEASURED** (ADR-085 U2).
 *
 * `adv(fs, track)` is `fs × (0.6 + track)`: PT Mono's fixed cell, exact for
 * every other label on this surface and a FICTION for a proportional face.
 * The hub letters in IBM Plex Sans since the owner's 2026-08-29 ruling, and
 * `wrapLines` still counts CHARACTERS — so the budgets need this face's own
 * worst-case mean advance, not the mono one.
 *
 * Measured in the browser that renders them (`document.fonts.ready`, real
 * `getComputedTextLength`), over the drawing's ACTUAL copy — the brief and
 * all five `meaning`s wrapped at their budgets, every shape name, and the
 * record's longest Skill `short`s. Worst case per rung, tracking removed so
 * the `+ track` term stays where the rest of the surface keeps it:
 *
 *   body  13 / .02em / 400   0.5185 em   ← "What good means when the"
 *   caps  17 / .04em / 700   0.6754 em   ← "JUDGMENT"
 *   meta  12 / .08em / 400   0.4882 em   ← "People · Encoded"
 *
 * ⚠ **THE TWO RUNGS MOVE IN OPPOSITE DIRECTIONS, which is why one constant
 * would not do.** Plex's lowercase prose is ~16 % NARROWER than the mono
 * cell (every body budget gains slack for free), while its BOLD CAPS are
 * ~12 % WIDER — so the pinned title is the one string that got tighter, and
 * it is the one the `wall > 16` guard measures. A single averaged constant
 * would have hidden that under the body's surplus.
 *
 * The stored values carry headroom over the measurements; re-measure before
 * moving either (`document.fonts.ready` + `getComputedTextLength`, never a
 * canvas estimate).
 */
const HUB_ADV_BODY = 0.53;
const HUB_ADV_CAPS = 0.69;

/**
 * The hub's advance. `caps` selects the bold-uppercase rung — the pinned
 * Skill name and the shape title, the only two strings set that way.
 *
 * ⚠ Used by the THREE HUB FIT PRODUCERS ONLY. Everything else on all three
 * readings is PT Mono and stays on `adv`.
 */
const hubAdv = (fs: number, track: number, caps = false) =>
  fs * ((caps ? HUB_ADV_CAPS : HUB_ADV_BODY) + track);

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
 * `midR`. Exported for the guard; not used at render time because the drawing
 * uses `textPath`, which places the text on the arc exactly.
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

/** The band arc that carries a substrate name, minus its own per-end padding. */
export const carrierBandMeasure = (group: CarrierGroup): number => {
  const sweep = (group.a1 - group.a0) * (Math.PI / 180);
  return Math.max(0, carrierBandArcRadius(group) * sweep - BAND_PAD * 2);
};

/** The visual count of a part is literally its number of cells. */
export const carrierMarkCount = (record: CarrierRecord, key: string): number =>
  carrierLayout(record).cells.filter((cell) => cell.key === key).length;

/** Angular sweep, after the five structural clearances are removed. */
export function carrierSweep(record: CarrierRecord, key: string): number {
  const g = carrierLayout(record).groups.find((x) => x.key === key);
  return g ? g.a1 - g.a0 : 0;
}

/** Every cell's ideal area — the equal-area claim, measurable. */
export const carrierCellAreas = (record: CarrierRecord): number[] =>
  carrierLayout(record).cells.map((c) => c.area);

/** The brief, wrapped exactly as the drawing wraps it. */
export const carrierBriefLines = (): string[] => wrapLines(BRIEF, BRIEF_PER, BRIEF_MAX);

/**
 * ⚠ **THE SHAPE'S SENTENCE WRAPS AT THE BRIEF'S OWN MEASURE, AND `SHAPE_MAX`
 * IS DELIBERATELY LOOSE.** `wrapLines` SLICES past its cap — quietly, with the
 * tail vanishing from the drawing AND from the lettering declaration, so every
 * per-line assertion still passes (ADR-070 U20's own finding, on `gate`). The
 * longest `meaning` on the record is 92 characters and wraps to four lines at
 * `BRIEF_PER`; the cap is five so the slice cannot bite, and
 * `carrierShapeFits` asserts the wrap is WHOLE rather than trusting it.
 */
const SHAPE_MAX = 5;

/**
 * ⚠ **NARROWER THAN THE BRIEF'S 30, AND THE REASON IS THE HUB'S SHAPE.** This
 * block carries a 17-unit title the brief does not, so it is ~37 units taller —
 * and a dodecagon punishes height and width TOGETHER. Its worst edge normal
 * sits at 30°, where the clearance is
 * `apothem − 0.866·halfWidth − 0.5·halfHeight`: a wide block loses 0.866 of
 * every unit it gains. At the brief's 30 characters `pattern` clears its wall by
 * **17.7 units**; at 27 the run is one character shorter per line, the block
 * stays four lines, and the same corner clears by **35.2**. Squarer beats wider
 * in a round well, and it cost nothing but a wrap constant.
 */
const SHAPE_PER = 27;

export const carrierShapeLines = (meaning: string): string[] =>
  wrapLines(meaning, SHAPE_PER, SHAPE_MAX);

export interface CarrierShapeFit {
  key: string;
  /** Clear distance from the block's worst corner to the hub's twelve-sided wall. */
  wall: number;
  /** The widest line's slack against `BRIEF_MEASURE`. */
  slack: number;
  /** Every word the record's sentence declares survived the wrap. */
  whole: boolean;
}

/**
 * The pinned SHAPE block against the hub, one entry per part.
 *
 * ⚠ Same measurement as `carrierPinnedFits` and for the same reason: the hub is
 * a DODECAGON, so a block is inside it only if it clears every one of twelve
 * edges, and backing a half-diagonal off one ray radius reads the wall at one
 * angle while a different corner collides.
 */
export function carrierShapeFits(record: CarrierRecord): CarrierShapeFit[] {
  return carrierLayout(record).groups.map((group) => {
    const lines = carrierShapeLines(group.meaning);
    const height = SHAPE_BODY_DROP + (lines.length - 1) * BRIEF_LINE_H + 4;
    const widest = Math.max(
      group.name.length * hubAdv(17, 0.04, true),
      ...lines.map((l) => l.length * hubAdv(BRIEF_FS, BRIEF_TRACK))
    );
    return {
      key: group.key,
      wall: boxClearance(0, widest / 2, height / 2, R_HUB),
      slack:
        BRIEF_MEASURE - Math.max(...lines.map((l) => l.length * hubAdv(BRIEF_FS, BRIEF_TRACK))),
      whole: lines.join(" ") === group.meaning,
    };
  });
}

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
 * defect a single-case check misses. The block grows by 20 units when a Skill is
 * a flagship and by 17 for each meta line the wrap adds, so the worst case is
 * not the Skill anyone would think to open — it is whichever one happens to be
 * both flagship and long-named. Nothing clips when it overruns; the text just
 * walks off the gold onto the cells behind it.
 */
export function carrierPinnedFits(record: CarrierRecord): CarrierPinnedFit {
  const { cells } = carrierLayout(record);
  let wall = Infinity;
  let worst = "";
  for (const cell of cells) {
    const meta = wrapLines(`${cell.skill.team} · ${cell.skill.status}`, HUB_META_CHARS, 3);
    const height = (cell.skill.flagship ? 20 : 0) + 12 + 22 + 26 + (meta.length - 1) * 17 + 4;
    const widest = Math.max(
      cell.skill.short.length * hubAdv(17, 0.04, true),
      ...meta.map((l) => l.length * hubAdv(FS.chrome, 0.08))
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
 * `boxClearance` walks all twelve edges.
 */
export function carrierBriefFits(): CarrierBriefFit {
  const lines = carrierBriefLines();
  const widest = Math.max(...lines.map((l) => l.length * hubAdv(BRIEF_FS, BRIEF_TRACK)));
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
 * ⚠ Ink rises OUTWARD where the arc runs forward and INWARD where it is reversed
 * (see `carrierCellArcPath`), so the baseline has to drop inward on the top half
 * and outward on the bottom. One expression, both halves — and the sign term is
 * the same `flip` the arc's own direction uses.
 */
export const carrierCellArcRadius = (cell: CarrierCell): number => {
  const midA = (cell.a0 + cell.a1) / 2;
  /* ⚠ THE CORRIDOR IS BOUNDED BY WHAT IS DRAWN, NOT BY THE PARTITION (U34).
     `outerWall` is `κ·R_OUT` on the rim and `r1` on a concentric seam; `r0` is
     its own worst case either way. Centring on `(r0 + r1)/2` is what leaned
     every outermost label into its own edge. */
  return (
    (cell.r0 + cell.outerWall) / 2 + (Math.sin(rad(midA)) > 0 ? 1 : -1) * LABEL_INK_MID * LABEL_FS
  );
};

/**
 * The arc-following text path for one cell — the invisible curve `textPath`
 * hangs the label off.
 *
 * ⚠ **`textPath` PLACES TEXT ON THE ARC EXACTLY**, so the sagitta a straight
 * chord would carry falls away — 6.9 units on the innermost course, ~23 % of the
 * depth. Straight rotated text was the plan's first cut and it collided with the
 * cell's outer boundary on the innermost course of Validation.
 *
 * ⚠ **THE ARC IS REVERSED IN THE BOTTOM HALF** so the text does not read upside
 * down. SVG's `sweep-flag` inverts the direction; the endpoints swap too.
 *
 * ⚠ **THE ARC IS CUT OFF-CENTRE ON PURPOSE, SO THE INK LANDS CENTRED.** See
 * `LABEL_INK_MID`.
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
 * The band arc for a substrate name. Same rotation grammar as the cell arc, one
 * level in — the whole drawing letters along tangents from one law, and that
 * includes the ink-centring correction (`BAND_INK_MID`, the uppercase value).
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

/** The band segment a tapped substrate lights — `R_HUB..R_CELL` over the part's
 *  own sweep, which is the region between the seated card and that part's
 *  cells. See `TapWash`. */
export const carrierTapPath = (group: CarrierGroup): string =>
  sectorPath(group.a0, group.a1, R_HUB, R_CELL);

/** Radial modulation the dodecagonal perimeter introduces against a circle. */
export const carrierRimModulation = (): number => 1 - KAPPA;

/** What a cell announces to a screen reader. Unique across the plate. */
export const carrierCellLabel = (cell: CarrierCell, name: string): string =>
  `${cell.skill.short}, ${name}, ${cell.skill.team}, ${cell.skill.status}`;

export const CARRIER_SIDES = SIDES;
export const CARRIER_BRIEF = BRIEF;
export const CARRIER_CX = CX;
export const CARRIER_CY = CY;
export const CARRIER_R_IN = R_HUB;
export const CARRIER_R_CELL = R_CELL;
export const CARRIER_R_OUT = R_OUT;
/** The rim's apothem — the wall the outermost course is bounded by (U34). */
export const CARRIER_R_APOTHEM = R_APOTHEM;
export const CARRIER_KAPPA = KAPPA;
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
 * Everything this reading can letter — the resting hub, the five band substrate
 * names, the forty-seven cell labels always visible on the annulus, and every
 * reachable pinned readout state.
 *
 * ⚠ **THE SLOT PREFIX IS THE INTERACTION STATE**, not the substrate key or the
 * anatomical region. `brief.*`, `band.*` and `cell.*` are the RESTING drawing;
 * `pin.*` is what one click adds.
 *
 * ⚠ **THE SEATED CARD DECLARES NOTHING HERE, AND THAT IS DELIBERATE.** Its
 * three rungs are guarded by `pda-card`, whose measures are RATIOS of the card's
 * own box (`cartTitleChars` is asserted scale-invariant), so they hold at
 * `HUB_K` without being restated. Declaring them again would be a second set of
 * numbers for one box — the drift ADR-069 U1 exists to stop.
 */
export function carrierLettering(record: CarrierRecord): LetterSpec[] {
  const layout = carrierLayout(record);
  const out: LetterSpec[] = carrierBriefLines().map((line, i) => ({
    slot: `brief.${i}`,
    text: line,
    fs: BRIEF_FS,
    track: BRIEF_TRACK,
    measure: BRIEF_MEASURE,
  }));

  /* The band's five substrate names — one arc each, uppercase, tracked wide so
     they read STRUCTURAL where a Skill reads NAMED. */
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
     measure is the cell's INNER arc, which is the binding one. */
  for (const cell of layout.cells) {
    out.push({
      slot: `cell.${cell.skill.id}`,
      text: cell.skill.short,
      fs: LABEL_FS,
      track: LABEL_TRACK,
      measure: carrierCellMeasure(cell),
    });
  }

  /* ⚠ AND WHAT THE HUB LETTERS ONCE THE READER COMMITS A SUBSTRATE. The band's
     name is declared twice on purpose — once as the arc label at `BAND_FS`, and
     again here at the hub's own rung, because they are two different strings on
     two different measures and a guard that walked only one would be blind to
     the other overflowing. */
  for (const group of layout.groups) {
    out.push({
      slot: `shape.${group.key}.title`,
      text: group.name.toUpperCase(),
      fs: 17,
      track: 0.04,
      measure: BRIEF_MEASURE,
    });
    for (const [i, line] of carrierShapeLines(group.meaning).entries()) {
      out.push({
        slot: `shape.${group.key}.meaning.${i}`,
        text: line,
        fs: BRIEF_FS,
        track: BRIEF_TRACK,
        measure: BRIEF_MEASURE,
      });
    }
  }

  /* And what the hub letters once the reader COMMITS a cell. */
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

export interface ViewCarrierProps {
  shapes: readonly PdaShape[];
  skills: readonly CaseSkillEntry[];
  /**
   * The stream the reader has open (via the config chip's join, ADR-071).
   *
   * ⚠ **THE STREAM ITSELF NO LONGER LANDS ON THIS PLATE** — the seated card
   * left with U33's promotion; what the reader sees here is the CELL whose
   * skill runs that stream, lit like an isActive cell. `selected` still comes
   * through so the CELL can be found by joining `selected.skillId` against
   * `skill.id`. `null` while nothing has been opened, and no cell is seated.
   *
   * ⚠ **`null` UNTIL READING 02 HAS BEEN SHOWN.** The console's rest state is
   * `shown[0]`, and seating a cell for a record the reader never asked for
   * claims they left it open. The console passes `hasOpened ? selected : null`.
   */
  selected: PdaWork | null;
  /** True once the reader has moved the pointer inside this reading; drops the
   *  arrival classes so a hover does not replay the entrance. */
  still: boolean;
  entry: PdaEntry;
  /**
   * THE SKILL CHIP'S ARRIVAL, only on the 2→3 transition (ADR-071). When
   * `kind === "flight"` the carrier renders the chip AT its destination cell
   * (the seated cell), animating from the config chip's home. Everywhere else
   * the chip does not render on the carrier: the cell's own arc label carries
   * the identity at rest, and the seat card is gone.
   */
  skillEntry?: PdaEntry | null;
  /** Called with the part under the pointer. The console uses it to mark the
   *  reading as interacted-with; reading 02 is what reads the value. */
  onLit?: (key: string | null) => void;
}

export function ViewCarrier({
  shapes,
  skills,
  selected,
  still,
  entry: _entry,
  skillEntry,
  onLit,
}: ViewCarrierProps) {
  const layout = useMemo(() => carrierLayout({ shapes, skills }), [shapes, skills]);
  const [hotId, setHotId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  /**
   * The substrate the reader clicked in the BAND — the hub's third subject.
   *
   * ⚠ **MUTUALLY EXCLUSIVE WITH `pinnedId`, AND ENFORCED AT BOTH SETTERS.** One
   * hub can display one thing; two independent pins would make the priority
   * order in `Aperture` a silent tiebreak the reader cannot see or undo. Each
   * click clears the other, so the hub always shows the last thing chosen.
   */
  const [pinnedShapeKey, setPinnedShapeKey] = useState<CaseMapShapeKey | null>(null);
  const [roving, setRoving] = useState(0);
  const refs = useRef<(SVGGElement | null)[]>([]);

  /**
   * ⚠ **TWO STATES, TWO JOBS — DO NOT COLLAPSE THEM BACK INTO ONE.** `hot` is
   * what the pointer is over and it drives the LIT CELL and the dimming;
   * `pinned` is what the reader chose and it drives THE HUB. The first cut ran
   * the centre off `hot ?? pinned`, which made the click a no-op in every case
   * the reader could see. With the cell always lettered at rest, hover no longer
   * names — the name is on the plate — but the two jobs still split.
   */
  const hot = layout.cells.find((c) => c.skill.id === hotId) ?? null;
  const pinned = layout.cells.find((c) => c.skill.id === pinnedId) ?? null;
  const pinnedShape = layout.groups.find((g) => g.key === pinnedShapeKey) ?? null;

  /** Pin a cell, releasing any pinned substrate — see `pinnedShapeKey`. */
  const pinCell = useCallback((id: string) => {
    setPinnedShapeKey(null);
    setPinnedId((prev) => (prev === id ? null : id));
  }, []);
  /** Pin a substrate, releasing any pinned cell. */
  const pinShape = useCallback((key: CaseMapShapeKey) => {
    setPinnedId(null);
    setPinnedShapeKey((prev) => (prev === key ? null : key));
  }, []);
  const litKey = hot?.key ?? pinned?.key ?? pinnedShapeKey ?? null;
  const nameOf = (key: CaseMapShapeKey) =>
    layout.groups.find((g) => g.key === key)?.name ?? key.toUpperCase();

  /** The parts the seated stream draws on — the click's context, resumed. */
  const taps = useMemo(
    () => new Set<string>(selected?.configured ? selected.taps : []),
    [selected]
  );
  /** The cell the seated stream's skill lands on (ADR-071). `null` while
   *  nothing has been opened, or when the join is missing — the cell is not
   *  seated then, and the drawing letters at rest. */
  const seatedSkillId = selected?.skillId ?? null;
  const seatedCell = useMemo(
    () => (seatedSkillId ? (layout.cells.find((c) => c.skill.id === seatedSkillId) ?? null) : null),
    [layout.cells, seatedSkillId]
  );

  const light = useCallback(
    (id: string | null, key: CaseMapShapeKey | null) => {
      setHotId(id);
      onLit?.(key);
    },
    [onLit]
  );

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
          pinCell(id);
          break;
        case "Escape":
          setPinnedId(null);
          setPinnedShapeKey(null);
          return;
        default:
          return;
      }
      event.preventDefault();
    },
    [layout.cells.length, pinCell]
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

      {/* ONE GROUND. The cell gaps and the course seams reveal this plate rather
          than empty canvas, so the object reads as one machined carrier divided
          rather than as forty-seven pieces collected. */}
      <path d={polygonPath(R_OUT)} fill="var(--pda-void)" />

      {/* THE MATERIAL — one field per part, clipped to the CELLS' annulus. The
          band above them is a machined recess and takes no field.

          ⚠ THE ALPHA IS TUNED FOR TYPE-OVER-MATERIAL (owner, 2026-08-18: all 47
          Skill names sit on top of the field now). U28's 0.8 rested a texture
          the labels had to fight; 0.55 lets the type read while still
          differentiating the five parts by kind. */}
      {layout.groups.map((group, i) => (
        <PlacedField
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

      {/* ⚠ THE BAND'S OWN GROUND, ON ALL FIVE SEGMENTS (U34, owner
          2026-08-23: _"stakeholder and patterns don't have a background like
          the rest do"_). They were not missing one — they are the two regions
          the open stream does NOT draw on, and `TapWash` was filling the other
          three. The band was the only region on this plate with no material of
          its own (the hub has void + veil + grain, the cells their physics
          field), so a signal with no ground under it read as a rendering
          fault. One recess wash on all five, and the tapped three read as LIT
          on top of it instead of as the only ones that exist.

          ⚠ FLAT, NOT GRAINED, AND THE DISTINCTION IS THE OBJECT. The hub's own
          note says a flat fill among fields reads as a hole plugged with paint
          — and answered it with a grain, because the hub is the plate's CORE.
          This is a machined RECESS between two rings, and a recess is a cut
          face.

          ⚠ **0.10, AND THE FIRST CUT AT 0.03 WAS A FIX THAT CHANGED NOTHING.**
          A wash is judged against what it lands on, not against a neighbouring
          number: at 0.03 over `--pda-void` the band measured `rgb(11,10,9)`
          against the plate ground's `rgb(11,9,5)` — inside a value of the
          thing it was supposed to be distinguishable from — while the tapped
          three sat at `rgb(45,37,20)`, a **6× luminance ratio**. The reading
          the owner objected to was completely intact. At 0.10 the band lands
          at `rgb(27,25,23)`, a hair under the hub's own `rgb(35,28,14)`, so
          the core and the recess read as one middle zone with the cells dark
          around them — and the gold tap is a lift ON something.

          ⚠ IT DARKENS IN LIGHT AND THAT IS THE POINT. ADR-058 swaps
          `--dawn-rgb` with `--void-rgb`, so this one rule is a step AWAY from
          the ground in both themes — up from the void, down into the
          parchment. A recess either way. */}
      {layout.groups.map((group) => (
        <path
          key={`band-bed-${group.key}`}
          d={carrierTapPath(group)}
          fill="rgba(var(--dawn-rgb), 0.1)"
          pointerEvents="none"
        />
      ))}

      {/* THE CLICK, RESUMED — the band segments the seated stream draws on. */}
      <TapWash groups={layout.groups} taps={taps} still={still} />

      {layout.cells.map((cell) => {
        const isHot = cell.skill.id === hotId;
        const isPinned = cell.skill.id === pinnedId;
        const isSeated = cell.skill.id === seatedSkillId;
        const isActive = isHot || isPinned || isSeated;
        /* ⚠ SEATED CELLS ESCAPE DIMMING (ADR-071). The stream's chip lands on
           this one cell; if the reader hovers a different part after arrival,
           the seat has to stay lit so the reading keeps naming what runs the
           stream. `isActive` above covers it, but the `cell.key !== litKey`
           branch is defensive — a seated cell in a non-lit part would dim on
           partial hover otherwise. */
        const dimmed = litKey !== null && !isActive && cell.key !== litKey;
        /* ⚠ THE SLOT LIGHTS ON TOUCHDOWN, NOT AT MOUNT (ADR-071 U1). While
           the chip is still in the air, a destination already lit claims the
           arrival before it happens — so an arriving flight ARMS the seated
           cell: a paint-hold animation keeps it at resting values for the
           morph's own duration, and the lit attributes take over the frame
           the plate seats. The pop happens UNDER the opaque morph layer and
           is revealed by its fade. ⚠ Not gated on `still`, same law as the
           dock — a hover mid-flight must not light the slot early. */
        const arming = isSeated && skillEntry?.kind === "flight" && Boolean(skillEntry.morph);
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
            onMouseEnter={() => light(cell.skill.id, cell.key)}
            onMouseLeave={() => light(null, null)}
            onFocus={() => {
              setRoving(cell.index);
              light(cell.skill.id, cell.key);
            }}
            onBlur={() => light(null, null)}
            onClick={() => pinCell(cell.skill.id)}
            onKeyDown={(event) => onKeyDown(event, cell.index, cell.skill.id)}
          >
            {/* ⚠ THE HIT PATH FILLS `transparent`, NEVER `none`. SVG events fire
                on visiblePainted by default and `none` reports no paint — the hit
                target has to have a fill for the pointer to land on it. */}
            <path d={cell.d} fill="transparent" pointerEvents="all" />
            {/* ⚠ THE CELL LINE IS `dim`, NOT `hair`/`hair2` — IT IS A LINE THAT
                CARRIES THE DRAWING, NOT CHROME (see pda.css's ladder). */}
            <path
              className={arming ? "fl-pda-seat-arm" : undefined}
              d={cell.d}
              fill={isActive ? "rgba(var(--gold-rgb), 0.28)" : "rgba(var(--dawn-rgb), 0.04)"}
              stroke={isActive ? "var(--pda-hot)" : "var(--pda-dim)"}
              strokeWidth={isActive ? 1.6 : 1.4}
              strokeOpacity={dimmed ? 0.42 : 1}
              opacity={dimmed ? 0.55 : 1}
              pointerEvents="none"
            />
            {/* Green marks provenance and only provenance — the first encode of
                each shape, on the carrier's own rim. */}
            {cell.skill.flagship ? (
              <path
                d={`M${cell.outer.map((p) => pt(p)).join(" L")}`}
                fill="none"
                stroke="var(--pda-grn)"
                strokeWidth="3"
                pointerEvents="none"
              />
            ) : null}
            {/* The label on its own arc, inside the cell's group so the pointer
                stays on the same target. */}
            <text
              className={arming ? "fl-pda-seat-arm-label" : undefined}
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

      {/* Five structural boundaries, running the full depth from the HUB's wall
          through the band to the rim — so the band is subdivided by the same
          seams the cells are, and the whole plate reads as one figure. */}
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

      {/* The band's inner ring — a hairline that reads the region as machined
          rather than as empty space between rings. */}
      <path d={polygonPath(R_CELL)} fill="none" stroke="var(--pda-dim)" strokeWidth="1" />

      {/* The carrier's outer machined edge. ⚠ Its INNER counterpart is not here
          — the hub is filled, so it owns and draws its own rim after its
          material, and a hairline left behind at this point in the order would
          be half-buried under that fill. */}
      <path d={polygonPath(R_OUT)} fill="none" stroke="var(--pda-hair2)" strokeWidth="2" />

      {/* The band's five substrate names, each on its own arc between the hub
          and the cells. Uppercase, tracked wide — chrome, not content.

          ⚠ **THE WHOLE SEGMENT IS THE TARGET, NOT THE WORD.** A `textPath` run
          is a thin ribbon on a curve, so hit-testing the glyphs would give the
          reader an eleven-character target bent around a corner; the band's own
          recess is the object the name belongs to and it is 36 units deep for
          its whole sweep. The transparent path also has to be a SIBLING drawn
          over the recess rather than a fill on it — the bed and the tap wash
          are painted much earlier, before the cells, and a hit target down
          there would sit under the seams.

          ⚠ THE FILL IS `transparent`, NEVER `none` — SVG events fire on
          `visiblePainted` by default and `none` reports no paint, so the
          pointer would fall straight through (the same trap ADR-069 recorded
          when three person-led cells stopped being clickable). */}
      {layout.groups.map((group) => (
        <g
          key={`band-label-${group.key}`}
          className="fl-pda-hit"
          role="button"
          tabIndex={0}
          aria-pressed={pinnedShapeKey === group.key}
          aria-label={`${group.name}, ${group.skills.length} encoded Skills — ${group.meaning}`}
          onMouseEnter={() => onLit?.(group.key)}
          onMouseLeave={() => onLit?.(null)}
          onFocus={() => onLit?.(group.key)}
          onBlur={() => onLit?.(null)}
          onClick={() => pinShape(group.key)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              pinShape(group.key);
            } else if (event.key === "Escape") {
              setPinnedShapeKey(null);
              setPinnedId(null);
            } else {
              return;
            }
            event.preventDefault();
          }}
        >
          <path d={carrierTapPath(group)} fill="transparent" pointerEvents="all" />
          <text
            pointerEvents="none"
            fontSize={BAND_FS}
            letterSpacing={`${BAND_TRACK}em`}
            fontWeight={700}
            fill={litKey === group.key || taps.has(group.key) ? "var(--pda-hot)" : "var(--pda-txt)"}
          >
            <textPath href={`#carrier-band-arc-${group.key}`} startOffset="50%" textAnchor="middle">
              {group.name.toUpperCase()}
            </textPath>
          </text>
        </g>
      ))}

      <Aperture cell={pinned} name={pinned ? nameOf(pinned.key) : ""} shape={pinnedShape} />

      {/* ── THE CHIP'S ARRIVAL, only on 2→3 (ADR-071 U1). The plate MORPHS —
              its path interpolates from the config chip's rectangle into this
              cell's own ring, so at touchdown the flying object IS the cell
              and the closing fade removes a pixel-identical layer. The name
              flies its own dock and hands over to the arc label beneath. ── */}
      {skillEntry?.kind === "flight" && skillEntry.morph && seatedCell ? (
        <ChipMorphArrival cell={seatedCell} entry={skillEntry} morph={skillEntry.morph} />
      ) : null}
    </>
  );
}

/**
 * THE MORPH ARRIVAL (ADR-071 U1) — three layers, one journey:
 *
 *   · GROUND: the plate's opaque bed, morphing rect → wedge. Opaque because
 *     the chip is a physical object crossing the dial — cells showing through
 *     it mid-flight would read as a ghost.
 *   · SKIN: the same morphing path again, carrying the material change —
 *     the chip's quiet dawn wash and dim hairline anneal into the cell's lit
 *     gold wash and hot stroke, so by touchdown the object already IS a lit
 *     cell.
 *   · NAME: the skill's name on its own dock flight, lifting off exactly
 *     where the chip lettered it and landing centred on the cell's arc label
 *     (same text, same rung — the crossfade is a handoff, not a vanish).
 *
 * ⚠ **THE FINAL FADE IS INVISIBLE BY CONSTRUCTION.** All three layers end
 * pixel-aligned with the seated cell that was beneath them all along — the
 * morph's `to` IS the cell's own `d`, the name's landing box is the arc
 * label's own box. What the owner called "a frame floating, then it fades
 * away" was two shapes that never agreed; these agree exactly, so the
 * closing fade removes a duplicate, not an object.
 *
 * ⚠ **`d` FALLS BACK GRACEFULLY.** The path ATTRIBUTE carries the final
 * shape; browsers that cannot animate the CSS `d` property skip the morph
 * keyframe and show the plate already seated (colour animation still runs).
 * No floating frame on any engine.
 */
function ChipMorphArrival({
  cell,
  entry,
  morph,
}: {
  cell: CarrierCell;
  entry: PdaEntry & { kind: "flight" };
  morph: ChipMorph;
}) {
  const rotation = carrierChipRotation(cell);
  const name = cell.skill.short.toUpperCase();
  const box = carrierSkillNameRect(cell, name);
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const pathVars = {
    "--d-from": `path('${morph.from}')`,
    "--d-to": `path('${morph.to}')`,
  } as React.CSSProperties;
  /* The skin's colour ramp, arriving: the chip's quiet dawn wash and dim
     hairline anneal into the cell's lit gold — by touchdown the object IS a
     lit cell, so the closing fade removes a duplicate, not a thing. */
  const skinVars = {
    ...pathVars,
    "--skin-f0": "rgba(var(--dawn-rgb), 0.05)",
    "--skin-s0": "var(--pda-dim)",
    "--skin-f1": "rgba(var(--gold-rgb), 0.28)",
    "--skin-s1": "var(--pda-hot)",
  } as React.CSSProperties;
  return (
    <g pointerEvents="none" aria-hidden="true">
      <path className="fl-pda-chip-morph" style={pathVars} d={morph.to} fill="var(--pda-void)" />
      <path
        className="fl-pda-chip-morph fl-pda-chip-skin"
        style={skinVars}
        d={morph.to}
        strokeWidth="1.4"
      />
      <g
        className="fl-pda-chip-name"
        style={
          {
            "--dx": `${entry.dx}px`,
            "--dy": `${entry.dy}px`,
            "--dk": entry.dk,
            "--dr": `${entry.dr ?? 0}deg`,
          } as React.CSSProperties
        }
      >
        <g transform={`rotate(${rotation} ${cx} ${cy})`}>
          {/* The bbox anchor — `transform-box: fill-box` measures the dock's
              origin against this group's own box, and a text's ink box drifts
              with ascenders; the nominal rect pins the centre the flight
              arithmetic used. */}
          <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="none" stroke="none" />
          <text
            x={cx}
            y={cy + LABEL_FS * 0.36}
            textAnchor="middle"
            fontSize={LABEL_FS}
            letterSpacing={`${LABEL_TRACK}em`}
            fill="var(--pda-ink)"
          >
            {name}
          </text>
        </g>
      </g>
    </g>
  );
}

/**
 * THE CLICK'S CONTEXT, in the dial's own grammar — a gold wash on the band
 * segments the seated stream's `taps` name.
 *
 * ⚠ **IT IS THE BAND, NOT A RADIAL CONDUCTOR.** SECTION drew a lit stub into
 * each stratum a stream tapped, and the obvious transposition is a conductor
 * running out along each tapped part's mid-ray. That mid-ray is exactly where
 * the substrate name letters (`startOffset="50%"`), so every conductor would
 * cross the middle of the name it points at. Washing the band SEGMENT says the
 * same thing with the region rather than with a line, and collides with
 * nothing.
 *
 * ⚠ **AND IT DOES NOT DIM THE REST.** U25's rule holds — the subject at rest is
 * still the whole layer, so an untapped part is unlit, never suppressed. The
 * wash is the same `rgba(240, 200, 106, 0.14)` the selected estate footprint
 * carried, so the two readings mark a selection with one value.
 */
function TapWash({
  groups,
  taps,
  still,
}: {
  groups: readonly CarrierGroup[];
  taps: ReadonlySet<string>;
  still: boolean;
}) {
  if (taps.size === 0) return null;
  return (
    <g pointerEvents="none" aria-hidden="true">
      {groups
        .filter((g) => taps.has(g.key))
        .map((g, i) => (
          <path
            key={`tap-${g.key}`}
            className={still ? undefined : "fl-pda-in"}
            style={still ? undefined : { animationDelay: `${300 + i * 40}ms` }}
            d={carrierTapPath(g)}
            fill="rgba(240, 200, 106, 0.14)"
          />
        ))}
    </g>
  );
}

/**
 * What the hub says, in priority order:
 *
 *   a CLICKED cell   that Skill's identity — the reader's own action on this
 *                    plate, so it outranks the brief that the plate would
 *                    otherwise letter
 *   neither          one sentence explaining what a substrate IS
 *
 * ⚠ **NO SEATED CARD ANY MORE (ADR-071).** The work-card home moved off the
 * hub with the split flights: the work card is a 1↔2 object and the SKILL
 * chip is the 2↔3 object. The reader who arrived from an opened stream sees
 * WHICH SKILL runs it by the seated cell (lit like an isActive cell), not by
 * a card in the middle.
 *
 * ⚠ **NO HOUSING IS DRAWN HERE.** The lettering sits straight on the hub's
 * material, bounded by the ring the plate already carries. Anything this
 * function adds — a rect, a bracket, a backing wash — puts a second outline
 * back inside the first and is the square returning under a new name.
 */
function Aperture({
  cell,
  name,
  shape,
}: {
  cell: CarrierCell | null;
  name: string;
  shape: CarrierGroup | null;
}) {
  return (
    /* ⚠ **THE HUB IS THE ONE SANS-SERIF INSTRUMENT ON THIS SURFACE** (owner,
       2026-08-29 — ADR-085 U2: _"it feels like a mono type, but we need
       something else"_). Every other label on all three readings stays PT
       Mono; the hub's three readouts are the one place the drawing SPEAKS
       rather than labels, and a sentence meant to be read wants a
       proportional face. `.fl-pda-hub-copy` is the hook — the family is
       declared in pda.css, and the fit arithmetic below runs on `hubAdv`,
       NOT the mono `adv`. */
    <g className="fl-pda-hub-copy" pointerEvents="none">
      <Hub />
      {cell ? (
        <PinnedReadout cell={cell} name={name} />
      ) : shape ? (
        <ShapeReadout group={shape} />
      ) : (
        <BriefReadout />
      )}
    </g>
  );
}

/**
 * The hub — the plate's core, in soft Tensor gold.
 *
 * ⚠ ITS GRAIN IS MEASURED, NOT CLIPPED. Each row is drawn to the length the
 * twelve-sided wall allows at its own height, so the fill's texture ends exactly
 * where the material does. A `clipPath` produces the same picture with a shape
 * that does not know why it stops there — and it would hide the chord-versus-ray
 * error `hubHalfWidth` exists to prevent.
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

      {/* The hub's rim, at the plate's own edge weight. ⚠ The five seams land on
          this line — they run from here to the outer rim — so it has to read as
          an EDGE the material stops at, not as a hairline drawn near one. */}
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
   * exactly one Skill and off for the rest.
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

/**
 * A CLICKED SUBSTRATE — what the shape MEANS, in the one region of this plate
 * sized for reading (owner, 2026-08-23: _"maybe when you click on for example
 * pattern or voice the center shows what it means"_).
 *
 * ⚠ **THE SENTENCE IS THE ANSWER; THE NAME AND THE COUNT ARE THERE TO SAY WHAT
 * IT IS THE ANSWER TO.** `CaseMapShape.meaning` is the record's only prose and
 * it lettered nowhere on this console — U23 put it on a divided plate, U25 in a
 * stratum head, and the dial had no room for a paragraph. It has one now.
 *
 * ⚠ **THE NAME IS SAID TWICE ON PURPOSE, AND THIS SURFACE NORMALLY BANS THAT.**
 * A console head, a foot title and a designator were all deleted for exactly
 * that (ADR-063 U1, ADR-070 U8). The precedent that licenses it is one level
 * down on this same drawing: a pinned CELL letters its Skill's name in the hub
 * while the arc under the pointer letters it too. The band paints at ~8px and
 * the hub at 17 — a pinned readout MAGNIFIES what was clicked, which is how a
 * reader knows the click landed. Restating a label the reader did not choose is
 * the defect; confirming the one they did is the affordance.
 *
 * ⚠ **AND IT LETTERS NO COUNT.** See `SHAPE_BODY_DROP` — the first cut did, and
 * a guard written from the owner's own ruling failed it.
 */
function ShapeReadout({ group }: { group: CarrierGroup }) {
  const lines = carrierShapeLines(group.meaning);
  /* ⚠ THE BLOCK CENTRES ON ITS OWN HEIGHT, like the Skill readout beside it —
     the sentence wraps to three lines or four depending on the part, and a
     stack pinned to `CY` by fixed offsets is centred for exactly one of them. */
  const height = SHAPE_BODY_DROP + (lines.length - 1) * BRIEF_LINE_H + 4;
  const top = CY - height / 2;

  return (
    <>
      <text
        x={CX}
        y={top + SHAPE_TITLE_DROP}
        textAnchor="middle"
        fontSize="17"
        fontWeight={700}
        letterSpacing=".04em"
        fill="var(--pda-txt)"
      >
        {group.name.toUpperCase()}
      </text>
      {lines.map((line, i) => (
        <text
          key={line}
          x={CX}
          y={top + SHAPE_BODY_DROP + i * BRIEF_LINE_H}
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
