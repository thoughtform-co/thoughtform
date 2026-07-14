// Arc Cases Card — placement geometry for the in-canvas portrait tools
// card (ADR-036, supersedes the ADR-035 DOM overlay reveal).
//
// The card is ONE 3D device slab (the ADR-029/033 tools-card grammar)
// mounted between the two stack columns in front of the Build-park
// sphere, inside the `gyroAssembly` group — the SAME transform space as
// `ShellStack`'s source/surface stream groups. So every length here is in
// SHELL-LOCAL units (world = local × GYRO_ASSEMBLY_SCALE 1.18), and the
// source/surface node streams fold onto the slab's own left/right side
// walls by DIRECT local-space math — no viewport unprojection, no panel
// rect, no per-frame camera re-solve (that was the ADR-035 DOM overlay's
// machinery; retired with the overlay). Because the card and the streams
// share this space, when the assembly banks with the pointer the card and
// the folded lines bank together and the latch stays welded for free.
//
// Kept free of DOM/three so it stays unit-testable
// (tests/lib/arc-cases-card-layout.test.ts). The slab proportions carry
// verbatim from `lib/services-ring/ringMath.ts` (portrait aspect, bezel,
// chamfer fraction, depth, content lift) — the fractions are scale-free,
// so they transfer from the ring's orbit-config space to this shell-local
// space unchanged.

import {
  RING_CARD_ASPECT,
  RING_CONTENT_LIFT,
  RING_SLAB_BEZEL,
  RING_SLAB_CHAMFER_FRAC,
  RING_SLAB_DEPTH,
} from "@/lib/services-ring/ringMath";

/** Card centre X in shell-local coords — dead centre between the two
 *  columns, on the optical axis. The camera parks on-axis (x = 0) at the
 *  Build park, so the card faces it dead-on; the pointer bank (carried by
 *  the gyro assembly) supplies the life. */
export const CARD_CENTER_X = 0;

/** Card centre Y in shell-local coords. The sphere + both lane fans are
 *  symmetric about y = 0, so centring the card there keeps the fold's
 *  top-to-bottom attach distribution symmetric with the pips. */
export const CARD_CENTER_Y = 0;

/** Card face Z in shell-local coords — in FRONT of the sphere toward the
 *  camera. The visible dotted shell sits at local radius ≈ 0.95 (its front
 *  face at z ≈ 0.95) and the gimbal rings reach ~1.05, so 1.2 floats the
 *  card clear of both while staying well short of the camera (parked at
 *  local z ≈ 5.25 = PARK_CAM_Z − INT_Z over the assembly scale). The
 *  source/surface pips sit on the z = 0 plane, so the streams fold FORWARD
 *  out of that plane onto the card edges — the nodes reach out and grab
 *  the floating screen. */
export const CARD_Z = 1.2;

/** Half-width target as a fraction of the column half-span (colX). The
 *  slab's side walls should sit clearly INSIDE the pip columns so the
 *  folded streams have a visible run. This is the aspirational upper knob;
 *  in practice the portrait aspect + the height clamp below dominate on
 *  every desktop aspect (see `getCardGeometry`), so the realised half-width
 *  lands nearer ~0.33–0.45 × colX — the owner's "a bit less wide, more
 *  compact" reading, a compact portrait card between the columns. */
export const CARD_WIDTH_COL_FRAC = 0.62;

/** Floor on the half-width so a pathologically tight frustum still yields
 *  a legible card. */
export const CARD_MIN_HALF_WIDTH = 0.5;

/** Hard clamp on the card's content half-height — it must fit WITHIN the
 *  lane vertical spread (source lanes ±0.95, surface fan ±1.05 shell-local)
 *  so the card never towers over the sphere. On every desktop aspect the
 *  portrait height would exceed this (the columns sit wide), so this clamp
 *  is what actually sizes the card — making it effectively a fixed compact
 *  portrait rectangle while the pip columns move in/out with the aspect and
 *  the fold run adapts. Just inside the source range so both fans clear it. */
export const CARD_MAX_HALF_HEIGHT = 0.95;

/** Land the docked line a hair INBOARD of the slab side wall so its tip
 *  meets the gold lip from the front instead of poking through it. */
export const CARD_EDGE_INSET = 0.012;

export interface CardGeometry {
  /** Content plane width (the baked face), shell-local. */
  contentWidth: number;
  /** Content plane height, shell-local. */
  contentHeight: number;
  /** Content half-width. */
  halfWidth: number;
  /** Content half-height — the fold's attach points span
   *  `[centerY − halfHeight, centerY + halfHeight]`. */
  halfHeight: number;
  /** Extruded glass slab width (content + bezel both sides). */
  slabWidth: number;
  /** Extruded glass slab height. */
  slabHeight: number;
  /** Slab extrude depth. */
  slabDepth: number;
  /** Chamfer cut (top-right + bottom-left), shell-local. */
  chamfer: number;
  /** Content-plane lift above the slab front cap. */
  contentLift: number;
  /** Card face Z. */
  z: number;
  /** Card centre Y. */
  centerY: number;
  /** Left slab side-wall X (negative) — where source streams latch. */
  leftEdgeX: number;
  /** Right slab side-wall X (positive) — where surface streams latch. */
  rightEdgeX: number;
}

/**
 * Card slab geometry for a given column half-span `colX` (the shell-local
 * X of the source/surface columns — `getStackColumnLocalX(aspect)`).
 *
 * Half-width TARGETS a fraction of `colX` so the card stays proportional to
 * the node span across aspects; the portrait height then follows the aspect
 * but is CLAMPED to the lane spread so the card never towers over the
 * sphere. On desktop the clamp dominates (the height would otherwise blow
 * past the lanes), so the realised card is a fixed compact portrait that
 * sits clearly inside both columns — the invariant the layout pins assert.
 */
export function getCardGeometry(colX: number): CardGeometry {
  const safeColX = Number.isFinite(colX) && colX > 0 ? colX : 1.6;
  let contentWidth = 2 * Math.max(CARD_MIN_HALF_WIDTH, CARD_WIDTH_COL_FRAC * safeColX);
  // Portrait: height = width / aspect (RING_CARD_ASPECT is width/height).
  let contentHeight = contentWidth / RING_CARD_ASPECT;
  if (contentHeight / 2 > CARD_MAX_HALF_HEIGHT) {
    contentHeight = CARD_MAX_HALF_HEIGHT * 2;
    contentWidth = contentHeight * RING_CARD_ASPECT;
  }
  const halfWidth = contentWidth / 2;
  const halfHeight = contentHeight / 2;
  const slabWidth = contentWidth + RING_SLAB_BEZEL * 2;
  const slabHeight = contentHeight + RING_SLAB_BEZEL * 2;
  return {
    contentWidth,
    contentHeight,
    halfWidth,
    halfHeight,
    slabWidth,
    slabHeight,
    slabDepth: RING_SLAB_DEPTH,
    chamfer: slabWidth * RING_SLAB_CHAMFER_FRAC,
    contentLift: RING_CONTENT_LIFT,
    z: CARD_Z,
    centerY: CARD_CENTER_Y,
    leftEdgeX: CARD_CENTER_X - slabWidth / 2,
    rightEdgeX: CARD_CENTER_X + slabWidth / 2,
  };
}
