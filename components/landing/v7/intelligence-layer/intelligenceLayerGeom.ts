/**
 * intelligenceLayerGeom — geometry contract for the orbital triad
 * R3F scene (`OrbitField`) and the substrate-window choreography
 * (`lib/brandmark/journey.ts`).
 *
 * ADR-014: the intelligence layer is no longer a three-coaxial-ring
 * instrument that rotates around a Y axis. It is a front-on TRIAD of
 * three overlapping circular orbits — a space-map composition modelled
 * after Destiny / Astral Frontier celestial diagrams:
 *
 *     [ left orbit ]   [ substrate ring ]   [ right orbit ]
 *      01 sources         02 substrate         03 surfaces
 *
 * The middle ring is the brandmark cloud itself, re-sampled from a
 * ring-only path set during the substrate-engagement window (the
 * cross + horizontal bar dissolve into a clean orbital body — see
 * `lib/brandmark/shapes.ts` + the `uShapeBlend` channel in the
 * painter shader).
 *
 * Side orbits emerge from the substrate centre by sliding outward
 * and scaling up in parallel — at emerge = 0 they're at the origin
 * at scale 0 (completely invisible); at emerge = 1 they sit at
 * their home centres at full scale. The same trapezoid retracts
 * them at section exit so the cloud departs the section in its
 * canonical mark form.
 *
 * Units are scene-space (1.0 ≈ half canvas height; tuned so the
 * substrate ring + both side orbits fit horizontally within the
 * R3F canvas at the front-on camera framing below).
 */

import { create } from "zustand";

// ────────────────────────────────────────────────────────────────────
// Camera — front-on (no Y tilt), wide enough to frame the triad
// ────────────────────────────────────────────────────────────────────

/**
 * Camera framing for `IntelligenceLayerStack`. Front-on: the camera
 * sits on the Z axis looking straight at the origin so the side
 * orbits read as circles, not foreshortened ellipses. (The previous
 * three-ring model used a slight Y elevation so 3D-rotated rings
 * read with depth; the orbital triad has no 3D rotation at all.)
 *
 * `position.z = 4.0` and `fov = 26` give the triad ~80% of the
 * canvas width at 16:9 with comfortable padding for the orbits' top
 * tick marks and diamond pips.
 */
export const CAMERA_PARAMS = {
  fov: 26,
  position: [0, 0, 4.0] as [number, number, number],
  lookAt: [0, 0, 0] as [number, number, number],
  near: 0.1,
  far: 50,
};

// ────────────────────────────────────────────────────────────────────
// Triad geometry — substrate + two side orbits
// ────────────────────────────────────────────────────────────────────

/** Substrate ring — anchored at the origin. The brandmark particle
 *  cloud is what paints here (via the global painter, morphed to the
 *  ring-only shape via `uShapeBlend`); this geometry record exists
 *  so the side orbits know where they emerge from.
 *
 *  Sized to match the static SVG fallback (`r=240` in a `viewBox` of
 *  `1000 × 520`, where 520 maps to the camera's vertical world span
 *  of 1.846 scene units → `radius = 240 / 520 * 1.846 ≈ 0.852`).
 *  Aligning R3F with the static fallback means the chambers, which
 *  anchor on the orbit centres in vh-relative CSS, sit cleanly
 *  inside both rendering paths. */
export const SUBSTRATE_RING = {
  centre: [0, 0, 0] as [number, number, number],
  /** Slightly larger than the side orbits so it reads as the
   *  primary station — Aether's 1.4× middle-column emphasis,
   *  translated into the orbital idiom. */
  radius: 0.852,
};

/**
 * SideOrbit — a single side orbit (left or right) of the triad.
 *
 * Final position is `homeCentre`; final size is `radius`. The orbit
 * EMERGES by lerping both position and scale from origin/0 to
 * homeCentre/1 in parallel, so it visually slides outward AND grows
 * from the substrate's centre.
 *
 * `pips` are angles (degrees, 0 = top of orbit, clockwise) where a
 * small decorative diamond sits on the orbit's rim. The DOM labels
 * use the same angle table to position themselves outside the rim
 * via CSS trig.
 */
export interface SideOrbit {
  id: "left" | "right";
  /** Final scene-space centre. The orbit slides from [0,0,0] to
   *  here as it emerges. */
  homeCentre: [number, number, number];
  /** Final scene-space radius. */
  radius: number;
  /** Hex colour for the LineLoop material. Maps to a CSS token. */
  color: string;
  /** Material opacity for the hairline ring. Side orbits read as
   *  GUIDE lines (lower contrast) so the substrate stays the signal. */
  opacity: number;
  /** Angles (degrees, 0 = top, clockwise) of decorative diamond
   *  pips on the rim. The label angles in the DOM mirror this
   *  table so pips and label dots line up. */
  pipAngles: readonly number[];
}

/** Left orbit — Trusted sources. Sits to the left of the substrate.
 *  Sized + positioned to align with the static SVG fallback
 *  (`cx=-220, r=195` in a `viewBox` of `1000 × 520`):
 *    homeCentre.x = -220 / 520 * 1.846 ≈ -0.781
 *    radius       =  195 / 520 * 1.846 ≈  0.692
 *  The cardinal pips at 0°/90°/180°/270° anchor the celestial
 *  bearing register; the inner halo (drawn separately in
 *  `OrbitField`) reinforces the orbit as a station rather than a
 *  faint guide. */
export const LEFT_ORBIT: SideOrbit = {
  id: "left",
  homeCentre: [-0.781, 0, 0],
  radius: 0.692,
  color: "#caa554", // --gold — equal signal weight with the substrate
  opacity: 0.65,
  // Cardinal pips at top / right / bottom / left of the orbit, plus
  // the inner-cardinal point closest to the substrate intersection.
  pipAngles: [0, 90, 180, 270],
};

/** Right orbit — Headless surfaces. Mirror of the left orbit. */
export const RIGHT_ORBIT: SideOrbit = {
  id: "right",
  homeCentre: [0.781, 0, 0],
  radius: 0.692,
  color: "#caa554",
  opacity: 0.65,
  pipAngles: [0, 90, 180, 270],
};

/** Both side orbits in a single iterable. */
export const SIDE_ORBITS: readonly SideOrbit[] = [LEFT_ORBIT, RIGHT_ORBIT];

// ────────────────────────────────────────────────────────────────────
// Decoration constants
// ────────────────────────────────────────────────────────────────────

/** Diamond marker size in scene units. Same as the previous ringfield. */
export const DIAMOND_SIZE = 0.04;

/** Ring segment count for the LineLoop circle approximation. */
export const RING_SEGMENTS = 96;

/** Sub-orbit autonomous rotation rate (radians per second). Kept
 *  for the optional faint substrate halo (a hairline circle inside
 *  the substrate ring that breathes independently of scroll). */
export const SUB_ORBIT_SPIN_RATE = 0.06;

// ────────────────────────────────────────────────────────────────────
// Envelopes — orbit emerge / retract
// ────────────────────────────────────────────────────────────────────

/**
 * ORBIT_ENVELOPE — section-progress windows for the side orbits
 * (and the substrate shape blend, which the journey transform
 * shares with its own trapezoid).
 *
 *   EMERGE   [0.00 .. 0.18]: orbits slide from origin to home centre
 *                            and scale from 0 to 1 (geometric reveal,
 *                            Principle 4); brandmark blends full → ring.
 *   HOLD     [0.18 .. 0.85]: orbits parked at full; pips visible;
 *                            DOM labels cascade in via --ilayer-progress
 *                            thresholds in landing.css.
 *   RETRACT  [0.85 .. 1.00]: orbits slide back to origin and scale
 *                            to 0; brandmark blends ring → full.
 */
export const ORBIT_ENVELOPE = {
  emerge: { in: 0.0, out: 0.18 },
  retract: { in: 0.85, out: 1.0 },
};

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
 * orbitEmerge — trapezoid envelope for the side-orbit reveal.
 *
 * Ramps 0 → 1 over the EMERGE window, holds at 1 through the read
 * beat, and ramps 1 → 0 over the RETRACT window. Per-frame the
 * OrbitField writes `group.scale.setScalar(orbitEmerge(progress))`
 * AND `group.position.lerpVectors(origin, homeCentre, orbitEmerge)`
 * so the orbit grows AND slides outward together.
 */
export function orbitEmerge(progress: number): number {
  if (progress <= ORBIT_ENVELOPE.emerge.in) return 0;
  if (progress >= ORBIT_ENVELOPE.retract.out) return 0;
  const emergeIn = smoothstep(ORBIT_ENVELOPE.emerge.in, ORBIT_ENVELOPE.emerge.out, progress);
  const retractOut = smoothstep(ORBIT_ENVELOPE.retract.in, ORBIT_ENVELOPE.retract.out, progress);
  return emergeIn * (1 - retractOut);
}

// ────────────────────────────────────────────────────────────────────
// Legacy — deprecated rotation channel
// ────────────────────────────────────────────────────────────────────

/**
 * splitRotation — DEPRECATED (ADR-014 supersedes ADR-012 v5).
 *
 * The orbital triad is front-on; there is no Y-axis rotation arc.
 * Kept exported as a no-op stub so `lib/brandmark/journey.ts` can
 * keep calling it without conditional branches; the painter's
 * `uRotationY` uniform stays at 0 throughout the substrate window.
 *
 * Will be removed once the journey module drops the import.
 */
export function splitRotation(_progress: number): number {
  return 0;
}

// ────────────────────────────────────────────────────────────────────
// Encode-rect channel — retained for back-compat with the static
// fallback measurement path. No longer driven by the R3F scene.
// ────────────────────────────────────────────────────────────────────

/** A reported screen-space rect, in client (CSS) pixels. */
export interface ScreenRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface IlayerGeomState {
  /** Live screen-projected rect of the substrate dock. Retained as
   *  a back-compat channel for any consumer still reading the
   *  pre-ADR-014 encode rect; new code should read the brandmark
   *  journey transform directly. */
  encodeRect: ScreenRect | null;
  setEncodeRect: (rect: ScreenRect | null) => void;
}

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
