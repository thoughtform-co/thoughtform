"use client";

import { create } from "zustand";

/**
 * intelligenceLayerGeom — shared geometry contract between the R3F
 * podium scene ({@link IntelligenceLayerStack}) and the brandmark
 * morph hook ({@link useIlayerProgress}).
 *
 * The "podium" is three short vertical-axis cylinders stacked at
 * increasing Y offsets with decreasing radii from bottom to top, read
 * from a slightly elevated perspective camera. Sleep-well-creatives.com
 * style: discs are real 3D objects with rim thickness, not flat
 * ellipses.
 *
 * Units are in scene-space (1.0 ~= half canvas height; tuned so the
 * `build` disc's outer radius reaches the full viewport width once
 * the camera is positioned).
 */

export const DISC_KINDS = ["build", "encode", "navigate"] as const;
export type DiscKind = (typeof DISC_KINDS)[number];

export interface DiscGeom {
  /** Outer radius of the cylinder in scene units. */
  outerR: number;
  /** Vertical thickness of the cylinder in scene units. */
  height: number;
  /** Resting Y position of the cylinder's centre in scene units. */
  y: number;
  /** Hex colour for the standard material. Lit by the warm key + cool fill. */
  color: string;
  /** PBR metalness factor, 0..1. */
  metalness: number;
  /** PBR roughness factor, 0..1. */
  roughness: number;
  /** Final opacity once the reveal envelope is fully open. */
  targetOpacity: number;
  /** Reveal window in section progress (0..1). Outside this window the
   *  disc is collapsed (`scale.y = 0`, `opacity = 0`). Inside it ramps
   *  from `0 → 1` via smoothstep. */
  reveal: { in: number; out: number };
  /** Optional centre hole as a fraction of `outerR` (0 = no hole, 0.55
   *  = a hole 55% of the radius, used by the encode disc to mirror the
   *  reference's "target" hole). */
  holeRatio: number;
}

/**
 * DISC_GEOM — the canonical podium layout. Tuned against the
 * sleep-well-creatives.com section-05 reference:
 *
 *   navigate (top, smallest)      ─── outerR 0.36, y 0.16
 *   encode   (middle, brandmark) ── outerR 0.62, y 0.08
 *   build    (bottom, full width) ─ outerR 1.00, y 0.00
 *
 * Reveal is sequential so the podium "stacks itself" instead of all
 * three discs popping at once: build first, then encode (synced with
 * the brandmark fade-out for the morph), then navigate.
 */
export const DISC_GEOM: Record<DiscKind, DiscGeom> = {
  build: {
    outerR: 1.0,
    height: 0.06,
    y: 0.0,
    color: "#caa554", // --gold
    metalness: 0.15,
    roughness: 0.55,
    targetOpacity: 0.95,
    reveal: { in: 0.18, out: 0.42 },
    holeRatio: 0,
  },
  encode: {
    outerR: 0.62,
    height: 0.07,
    y: 0.08,
    color: "#ece3d6", // --dawn
    metalness: 0.05,
    roughness: 0.4,
    targetOpacity: 1.0,
    reveal: { in: 0.3, out: 0.55 },
    holeRatio: 0,
  },
  navigate: {
    outerR: 0.36,
    height: 0.06,
    y: 0.16,
    color: "#a99e8a", // --gold-soft (dawn-deep)
    metalness: 0.1,
    roughness: 0.5,
    targetOpacity: 0.92,
    reveal: { in: 0.42, out: 0.65 },
    holeRatio: 0.55,
  },
};

/** Camera framing — perspective camera, slight elevation looking down.
 *  These are the head-on values at progress 0; the camera pitches
 *  further as scroll advances (handled by the scene's per-frame
 *  envelope). */
export const CAMERA_PARAMS = {
  fov: 28,
  position: [0, 1.6, 4.2] as [number, number, number],
  lookAt: [0, 0.4, 0] as [number, number, number],
  near: 0.1,
  far: 50,
};

/** Brandmark morph timing windows. The brandmark begins translating /
 *  scaling at `descend.in`, lands on the encode disc rect at
 *  `descend.out`, and crossfades out across `crossfade`. Sequenced so
 *  the encode disc's fill ramp ([0.30..0.55]) overlaps the
 *  brandmark's fade ([0.45..0.60]) — the visual "morph". */
export const BRAND_MORPH = {
  /** Brandmark anchor descent + scale window. */
  descend: { in: 0.2, out: 0.55 },
  /** Brandmark opacity crossfade window (1 → 0). */
  crossfade: { in: 0.45, out: 0.6 },
  /** Maximum X-axis tilt at the envelope's peak (degrees). The R3F
   *  camera carries an equivalent pitch via its own envelope. */
  maxTiltDeg: 24,
};

/** A reported screen-space rect, in client (CSS) pixels. */
export interface ScreenRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface IlayerGeomState {
  /** Live screen-projected rect of the encode disc's *top face*,
   *  written by the R3F scene each frame and read by the progress
   *  hook to compute the brandmark's descent target.
   *
   *  `null` until the scene mounts and projects its first frame, and
   *  any time the canvas is unmounted (static-fallback mode). The
   *  progress hook computes a synthetic rect from the canvas slot's
   *  bbox in that case. */
  encodeRect: ScreenRect | null;
  setEncodeRect: (rect: ScreenRect | null) => void;
}

/**
 * useIlayerGeomStore — the live encode-disc rect channel.
 *
 * Zustand store (not React state) so per-frame writes from R3F do
 * not cascade re-renders. The progress hook subscribes via
 * `getState()` inside its rAF tick.
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
      // Skip identity writes so per-frame setEncodeRect calls from
      // R3F's `useFrame` don't churn React's external store
      // subscribers (the progress hook reads via getState() and
      // doesn't subscribe, but other future consumers might).
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

/**
 * tiltEnvelope — shared envelope shape for the camera pitch (in
 * R3F) and the SVG brandmark's `--ilayer-tilt-deg` (in CSS). Ramps
 * 0 → 1 across [0.10..0.55], holds at 1 across [0.55..0.85], eases
 * back to 0 across [0.85..1.00] so the substrate → rail handoff
 * reads against an axis-aligned brandmark bbox.
 */
export function tiltEnvelope(progress: number): number {
  if (progress <= 0) return 0;
  if (progress >= 1) return 0;
  if (progress < 0.55) return smoothstep(0.1, 0.55, progress);
  if (progress < 0.85) return 1;
  return 1 - smoothstep(0.85, 1.0, progress);
}
