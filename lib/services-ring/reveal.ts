/**
 * reveal — the PORTRAIT RASTER's quiet zones and the hover REVEAL's ramps
 * (lab round four, 2026-09-19; owner: "a variant of raster that fills in most
 * of the card but doesn't make the title and the bottom paragraph illegible …
 * when you hover over it, it reveals the photos … with some sort of pixelated
 * effect").
 *
 * Three-free on purpose: the bake (`cardViz.applyGlyphRaster`), the reveal
 * shader (`hologram/cardReveal.ts`) and the vitest all read ONE set of
 * numbers from here, so the glyphs go quiet exactly where the shader keeps the
 * photograph crisp, and the two cannot drift apart.
 *
 * ⚠ THE RAMPS ARE GLSL's OWN `smoothstep` (3t² − 2t³), NOT `ringMath`'s
 * `smootherstep` (Perlin's quintic). The shader mirrors these functions
 * literally; a test pins the endpoints and the monotonic run, and the lockstep
 * comment in `cardReveal.ts` names this file.
 */

import { BAKE_H } from "@/components/landing/home-v2/services/hologram/ringCtaBox";

/* ── The quiet zones (bake px) ─────────────────────────────────────────────
   Solved against the DISPLAY treatment on the top-centre / foot-centre
   arrangement (the same composition as the proposal): the title's cap top is
   140 and its second line's baseline 258; the paragraph's four lines run
   1113 … 1296 on a last baseline of 1288 at a 50px leading. The scrims on a
   `full` band (top 0 → 260, ground 700 → 1360) are drawn AFTER the raster, so
   they dim the glyphs as well; the quiet multiplier stacks on top of them
   (≈ 13 % at the title's baseline, ≈ 4 % under the paragraph). */

/** Above this y the raster is quiet — the title's band, with 42px to spare. */
export const RASTER_QUIET_HEAD = 300;
/** Below this y the raster is quiet — the paragraph's band, with 53px to spare. */
export const RASTER_QUIET_FOOT = 1060;
/** THE PHONE FACE'S BANDS (ADR-115 U2): its name is two lines of 74/88 from
 *  a cap top of 140 (bottom 280, +40 of ease) and its lede up to five lines
 *  of 50/68 on the same last baseline (block top ≈ 966, −38 of air). The
 *  desktop's two numbers are untouched — `rasterQuiet` is the same function
 *  with them bound, so the shader and every desktop bake are byte-identical. */
export const RASTER_QUIET_HEAD_PHONE = 320;
export const RASTER_QUIET_FOOT_PHONE = 928;
/** The ease INSIDE the loud region, off each quiet edge. */
export const RASTER_QUIET_EASE = 40;
/** What a quiet cell keeps of its alpha. */
export const RASTER_QUIET_LEVEL = 0.25;
/** A cell darker than this (normalised) letters nothing — a LUT'd photograph
 *  carries dark noise the synthetic fields never did. */
export const RASTER_SKIP_LUM = 0.06;

/* ── The lead plate (ADR-126 §4) ────────────────────────────────────────
   The ring's LEAD card takes a FILLED gold plate behind its display name —
   the ADR-029 chip material, the name knocked out — beside three bare names.
   The box is the type's own, padded, and it has to sit INSIDE the raster's
   quiet head so the glyphs never print through the gold; pure here so the
   bake and `services-ring-reveal.test.ts` share one arithmetic. */

/** Air either side of the name on the lead plate (bake px). */
export const LEAD_PLATE_PAD_X = 28;
/** Air above the cap and below the last baseline — the name frame's own
 *  `NAME_FRAME_PAD_Y` (24, `ServicesCardRing`), restated: the plate is that
 *  frame's box, filled. */
export const LEAD_PLATE_PAD_Y = 24;

/** The plate's vertical box for a name whose cap block starts at `capTop`
 *  (bake px), `lines` lines of cap `capH` on a leading `lh`. */
export function leadPlateBox(
  capTop: number,
  capH: number,
  lines: number,
  lh: number
): { top: number; bottom: number } {
  return {
    top: capTop - LEAD_PLATE_PAD_Y,
    bottom: capTop + capH + (lines - 1) * lh + LEAD_PLATE_PAD_Y,
  };
}

/** The raster's alpha multiplier at a bake-space y: the quiet level inside
 *  the two type bands, 1 in the field, eased over `RASTER_QUIET_EASE` at
 *  each edge (the ease sits inside the field, so the bands themselves are
 *  uniformly quiet). */
export function rasterQuiet(y: number): number {
  return rasterQuietAt(y, RASTER_QUIET_HEAD, RASTER_QUIET_FOOT);
}
/** The same multiplier against a face's OWN two bands (the phone's are
 *  `RASTER_QUIET_HEAD_PHONE` / `_FOOT_PHONE`). */
export function rasterQuietAt(y: number, headY: number, footY: number): number {
  const head = smoothstep(headY, headY + RASTER_QUIET_EASE, y);
  const foot = 1 - smoothstep(footY - RASTER_QUIET_EASE, footY, y);
  return RASTER_QUIET_LEVEL + (1 - RASTER_QUIET_LEVEL) * Math.min(head, foot);
}

/* ── The reveal (the veil plane's shader) ─────────────────────────────────── */

/** Damp rate (per second) of the hover level: ≈ 0.49 at 150ms, ≈ 0.98 at
 *  900ms. Slower than the veil's 7 on purpose — the mosaic needs to be seen
 *  refining. Pointer-driven and damped, ADR-021's hover-resolve class. */
export const REVEAL_DAMP_RATE = 4.5;
/** The FIXED pop grid (cols, rows): a cell keeps its identity through the
 *  whole reveal, so cells pop and stay popped while the mosaic under them
 *  refines. 42 × 68 on 840 × 1360 is a 20px square in bake space. */
export const REVEAL_POP_GRID: readonly [number, number] = [42, 68];
/** The COARSEST mosaic (cols, rows) — where the refinement starts. */
export const REVEAL_GRID_MIN: readonly [number, number] = [24, 39];

/** GLSL's `smoothstep`, verbatim. */
export function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/** The share of pop cells that have popped at reveal level `r` — all of them
 *  by 0.85, so the last stretch is the mosaic finishing, not cells arriving. */
export function revealPop(r: number): number {
  return smoothstep(0, 0.85, r);
}

/** How far the mosaic has refined toward full resolution at `r` — it holds
 *  at the coarsest grid through the first 0.15, so the first cells to pop
 *  are visibly blocks. */
export function revealGrid(r: number): number {
  return smoothstep(0.15, 1, r);
}

/** The two type bands in the plane's UV (`flipY`: uv.y = 1 − y / BAKE_H), as
 *  `[lo, hi]`: the photograph is crisp and cross-faded where `uv.y < lo`
 *  (the paragraph) or `uv.y > hi` (the title), and a popping mosaic between. */
export function revealBandsUv(): readonly [number, number] {
  return [1 - RASTER_QUIET_FOOT / BAKE_H, 1 - RASTER_QUIET_HEAD / BAKE_H];
}

/** The bands' ease in UV — the same `RASTER_QUIET_EASE` the bake uses. */
export function revealBandEaseUv(): number {
  return RASTER_QUIET_EASE / BAKE_H;
}
