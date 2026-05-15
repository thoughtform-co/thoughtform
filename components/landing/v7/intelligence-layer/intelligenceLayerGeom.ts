"use client";

import { create } from "zustand";

/**
 * intelligenceLayerGeom — shared geometry contract between the R3F
 * ringfield scene ({@link IntelligenceLayerStack}) and the section
 * progress hook ({@link useIlayerProgress}).
 *
 * ADR-012 v5: the artifact is ONE pure-code brandmark that physically
 * transforms in 3D space — particles sampled from
 * `BRANDMARK_FILLED_PATHS` (same data source as the global brandmark
 * canvas, per ADR-011), surrounded by three coaxial hairline rings
 * that emerge from the brandmark's centre by extruding to +/- Z.
 * Every visible element transforms via translation / scale / rotation
 * only — opacity ramps are forbidden for paint-source swaps and for
 * the appearance of major scene elements. Boundary handoffs are HARD
 * SWAPS via the `[data-ilayer-mode="r3f"]` CSS attribute toggle, with
 * matched visual states so the swap reads as visual continuity.
 *
 * Units are scene-space (1.0 ~= half canvas height; tuned so the
 * `build` ring's outer radius reaches ~80% of the canvas width once
 * the camera is positioned).
 */

export const RING_KINDS = ["build", "encode", "navigate"] as const;
export type RingKind = (typeof RING_KINDS)[number];

export interface RingGeom {
  /** Outer radius of the hairline ring in scene units. */
  radius: number;
  /** Hex colour for the LineBasicMaterial / LineDashedMaterial.
   *  Maps to `--gold` (signal), `--dawn-30` (guide), or `--gold-soft`. */
  color: string;
  /** Number of bearing tick marks evenly spaced around the ring.
   *  Quantised to 0 / 4 / 8 / 12 / 16 per the celestial-diagram
   *  grammar (`celestial-diagram-grammar.md` § BearingTicks). */
  tickCount: number;
  /** Angles (degrees, 0 = top of ring, clockwise) at which a small
   *  diamond marker sits on the ring's outer edge. "Diamonds, not
   *  dots" per the brand grammar. */
  diamondAngles: readonly number[];
  /** Resting Z position of the ring's centre in scene units, AT
   *  FULL EXTRUSION. The actual `position.z` is interpolated by the
   *  EXTRUDE / RETRACT envelope: `extrude * (1 - retract) * finalZ`.
   *  Encode is anchored at z=0 (it's the centre); navigate extrudes
   *  forward (+Z), build extrudes backward (-Z). */
  finalZ: number;
}

/**
 * RING_GEOM — the canonical ringfield layout. Three coaxial rings,
 * all initially coincident at z=0 (so they read as ONE artifact at
 * progress 0). Side rings emerge symmetrically from the centre.
 *
 *   navigate (front, +Z, smaller, gold-soft accent)
 *   encode   (centre, anchored at z=0, --gold, holds the brandmark cloud inside)
 *   build    (back, -Z, larger, dawn-30 guide)
 */
export const RING_GEOM: Record<RingKind, RingGeom> = {
  build: {
    radius: 1.06,
    color: "#ece3d6", // --dawn (drawn at low alpha via material opacity for the guide register)
    tickCount: 8,
    diamondAngles: [0, 90, 180, 270],
    finalZ: -0.32,
  },
  encode: {
    radius: 0.78,
    color: "#caa554", // --gold (signal — the brandmark's own ring)
    tickCount: 0,
    diamondAngles: [],
    finalZ: 0.0,
  },
  navigate: {
    radius: 0.92,
    color: "#a99e8a", // --gold-soft / dawn-deep (guide accent above the brandmark)
    tickCount: 4,
    diamondAngles: [0],
    finalZ: 0.32,
  },
};

/** Camera framing — perspective camera at slight elevation looking
 *  down at the ringfield. Gentler elevation than v4 so the 3/4 view
 *  reads with depth without exaggerating the perspective. The camera
 *  is STATIC; rotation lives on the parent group. */
export const CAMERA_PARAMS = {
  fov: 32,
  position: [0, 0.6, 3.4] as [number, number, number],
  lookAt: [0, 0, 0] as [number, number, number],
  near: 0.1,
  far: 50,
};

/**
 * SPLIT_ENVELOPE — section-progress windows for the single-scalar
 * splitProgress arc. All windows are smoothstep edges keyed off the
 * scroll trigger's `progress` (0..1).
 *
 *   ROTATE   [0.00..0.30]: parent rotation 0 → -45deg
 *   EXTRUDE  [0.30..0.55]: side rings translate to ±finalZ; rotation 45 → 70deg
 *   SETTLE   [0.55..0.85]: rotation eases 70 → 25deg; rings hold at split
 *   HOLD     [0.85..0.92]: rotation held at 25deg (the read beat)
 *   RETRACT  [0.92..0.98]: side rings retract back to z=0; ticks/diamonds/arcs collapse
 *   HANDOFF  [0.98..1.00]: rotation eases 25 → 0deg; brandmark cloud axis-aligned for rail morph
 */
export const SPLIT_ENVELOPE = {
  /** Parent rotation peak (radians, negative so the right side of
   *  the ring tips away from the camera). 70deg ~ 1.222 rad. */
  rotationPeakRad: -1.222,
  /** Held rotation during the SETTLE / HOLD beats (radians). 25deg ~ 0.436 rad. */
  rotationHoldRad: -0.436,
  /** EXTRUDE window — side rings translate to their finalZ. */
  extrude: { in: 0.3, out: 0.55 },
  /** RETRACT window — side rings unwind back to z=0. */
  retract: { in: 0.92, out: 0.98 },
  /** Rotation segments. Each piecewise lerp uses smoothstep within
   *  its window. */
  rotation: {
    rotateOnly: { in: 0.0, out: 0.3 }, // 0 → rotationHoldRad/2 (~ -22deg)
    extrude: { in: 0.3, out: 0.55 }, // -22deg → -70deg
    settle: { in: 0.55, out: 0.85 }, // -70deg → -25deg
    handoff: { in: 0.92, out: 1.0 }, // -25deg → 0deg
  },
};

/** Sub-orbit hairlines around the brandmark cloud (Section 02 sigil
 *  grammar). Concentric `LineLoop`s at fractional radii of the encode
 *  ring. They breathe via autonomous slow rotation independent of
 *  scroll. */
export const SUB_ORBIT_RADII = [0.32, 0.42] as const;

/** Number of halo dot diamonds on the outermost sub-orbit (cardinal
 *  positions + optional half-cardinal). 4 = N/E/S/W. */
export const HALO_DOT_COUNT = 4;

/** Brandmark particle count per ringfield render. Matches the global
 *  `BrandmarkParticleStation` desktop budget so the boundary HARD
 *  SWAP from the global painter to the local ringfield renderer
 *  preserves visual density. */
export const PARTICLE_COUNT = 3200;
export const PARTICLE_COUNT_MOBILE = 1800;

/** Brandmark particle colour — `--gold`. Matches the global station's
 *  default tint. */
export const BRAND_PARTICLE_COLOR = "#caa554";

/** Brandmark particle size in pixels (sizeAttenuation off). Tuned so
 *  the cloud reads at the same density as the global station's
 *  particles when the encode ring projects to ~400px diameter. */
export const BRAND_PARTICLE_SIZE_PX = 2.6;

/** BRAND_SCALE — half-width / half-height of the brandmark cloud in
 *  scene units. Equal to the encode ring's radius so the cloud fits
 *  cleanly inside the encode ring. */
export const BRAND_SCALE = RING_GEOM.encode.radius;

/** Diamond marker size in scene units (edge of the rotated square). */
export const DIAMOND_SIZE = 0.04;

/** Bearing tick length in scene units (radial). */
export const TICK_LENGTH = 0.045;

/** Ring segment count for the LineLoop circle approximation. 96 is
 *  smooth enough at the camera framing without being wasteful. */
export const RING_SEGMENTS = 96;

/** Sub-orbit autonomous rotation rate (radians per second). Matches
 *  the slow celestial breath of Section 02's `.sigil__orbits` —
 *  reads as ambient motion, not as a deliberate animation. */
export const SUB_ORBIT_SPIN_RATE = 0.06;

/** A reported screen-space rect, in client (CSS) pixels. */
export interface ScreenRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface IlayerGeomState {
  /** Live screen-projected rect of the encode ring's centre + radius,
   *  written by the R3F scene each frame and read by the progress
   *  hook on init / resize so the substrate dock anchor in DOM lands
   *  on the same pixels as the R3F brandmark cloud (the precondition
   *  for an invisible HARD SWAP at section boundaries).
   *
   *  `null` until the scene mounts and projects its first frame, and
   *  any time the canvas is unmounted (static-fallback mode). The
   *  progress hook computes a synthetic rect from the canvas slot's
   *  bbox in that case. */
  encodeRect: ScreenRect | null;
  setEncodeRect: (rect: ScreenRect | null) => void;
}

/**
 * useIlayerGeomStore — the live encode-rect channel.
 *
 * Zustand store (not React state) so per-frame writes from R3F do
 * not cascade re-renders. The progress hook subscribes via
 * `getState()` only — never via the React selector — so per-frame
 * writes don't trigger re-renders anywhere.
 *
 * Why a store and not a ref-passing chain? The R3F canvas is
 * createRoot'd into a placeholder by `IntelligenceLayerPortal`, so
 * the React tree that owns the scene is *separate* from the tree
 * that owns the progress hook. A module-scoped Zustand store is the
 * cleanest way to bridge them without leaking refs through the
 * portal boundary.
 */
export const useIlayerGeomStore = create<IlayerGeomState>((set) => ({
  encodeRect: null,
  setEncodeRect: (rect) =>
    set((state) => {
      const prev = state.encodeRect;
      if (
        prev &&
        rect &&
        prev.x === rect.x &&
        prev.y === rect.y &&
        prev.width === rect.width &&
        prev.height === rect.height
      ) {
        return state;
      }
      return { encodeRect: rect };
    }),
}));

/** Smoothstep — same shape as the GLSL builtin. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Linear interpolation. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * splitRotation — single-piecewise envelope for the parent group's
 * rotation.y. Returns rotation in radians (negative so the right
 * side of the ring tips away from the camera, exposing depth).
 *
 *   [0.00..0.30] lerp  0 → rotationHoldRad/2  (rotate-only beat)
 *   [0.30..0.55] lerp  rotationHoldRad/2 → rotationPeakRad  (extrude beat)
 *   [0.55..0.85] lerp  rotationPeakRad → rotationHoldRad    (settle beat)
 *   [0.85..0.92] hold  rotationHoldRad                       (read beat)
 *   [0.92..1.00] lerp  rotationHoldRad → 0                   (handoff beat)
 *
 * At progress 0 and progress 1 the rotation is exactly 0, so the
 * brandmark cloud is axis-aligned for both HARD SWAPs (entry +
 * exit) — this is the precondition for the swap to be invisible.
 */
export function splitRotation(progress: number): number {
  const { rotation, rotationPeakRad, rotationHoldRad } = SPLIT_ENVELOPE;
  if (progress <= rotation.rotateOnly.in) return 0;
  if (progress < rotation.rotateOnly.out) {
    const t = smoothstep(rotation.rotateOnly.in, rotation.rotateOnly.out, progress);
    return lerp(0, rotationHoldRad / 2, t);
  }
  if (progress < rotation.extrude.out) {
    const t = smoothstep(rotation.extrude.in, rotation.extrude.out, progress);
    return lerp(rotationHoldRad / 2, rotationPeakRad, t);
  }
  if (progress < rotation.settle.out) {
    const t = smoothstep(rotation.settle.in, rotation.settle.out, progress);
    return lerp(rotationPeakRad, rotationHoldRad, t);
  }
  if (progress < rotation.handoff.in) {
    return rotationHoldRad;
  }
  if (progress < rotation.handoff.out) {
    const t = smoothstep(rotation.handoff.in, rotation.handoff.out, progress);
    return lerp(rotationHoldRad, 0, t);
  }
  return 0;
}

/**
 * splitExtrude — extrude/retract scalar in [0..1]. Side rings'
 * `position.z = finalZ * splitExtrude(progress)`. Bearing ticks,
 * diamond markers, and flow arcs all use the same scalar for their
 * `scale.setScalar(...)` so they grow/shrink with the rings.
 *
 *   [0.00..0.30] = 0       (rings coincident)
 *   [0.30..0.55] ramps 0→1 (EXTRUDE)
 *   [0.55..0.92] = 1       (held at full split)
 *   [0.92..0.98] ramps 1→0 (RETRACT)
 *   [0.98..1.00] = 0       (back to coincident for HANDOFF)
 */
export function splitExtrude(progress: number): number {
  const extrudeIn = smoothstep(SPLIT_ENVELOPE.extrude.in, SPLIT_ENVELOPE.extrude.out, progress);
  const retractOut = smoothstep(SPLIT_ENVELOPE.retract.in, SPLIT_ENVELOPE.retract.out, progress);
  return extrudeIn * (1 - retractOut);
}
