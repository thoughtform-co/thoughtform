"use client";

/**
 * BrandmarkPhysicsCore — luminous 3D particle core for the corridor
 * brandmark (ADR-023). Owns a `GPGPUParticleSimulation` seeded with
 * silhouette-sampled home points (with a forward dome + per-particle
 * jitter for depth), plus an additive gold-tinted `<points>` mesh
 * that draws every frame from the sim's position texture.
 *
 * Visual states:
 *
 *   - `ignite = 0` — particles wander loosely inside a sphere of dust
 *     around origin (high turbulence + weak return-to-home).
 *   - `ignite = 1` — particles snap onto the brandmark home points
 *     (low turbulence + strong return-to-home).
 *   - `0 < ignite < 1` — continuously interpolated; the cloud
 *     visibly assembles into the brandmark as the camera flies into
 *     the corridor.
 *
 * The component is shape-only — opacity / per-frame world position /
 * per-frame world scale are owned by the consumer, who wraps the
 * mesh in a `<group>` and sets `position` / `scale` from the
 * corridor's `getBrandmarkWorldPosition()` +
 * `getBrandmarkWrapHalfExtent()`.
 *
 * Sampling note: an earlier draft sampled the beveled `ExtrudeGeometry`
 * mesh with `MeshSurfaceSampler`. That gave true 3D depth but
 * distributed particles by face area across the front cap / back cap /
 * side walls — combined with additive blending, it saturated into a
 * blob. This implementation samples the 2D silhouette (matches v7
 * `BrandmarkSilhouettePoints`) and adds depth via dome + jitter
 * (matches `intelligence-artifact/SubstrateBrandmark`). The brandmark
 * silhouette is guaranteed to read.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
// `BrandmarkParticleSample` is referenced via the `useMemo` return
// type; keeping the named import makes that explicit.
import * as THREE from "three";
import { createParticleUVs, GPGPUParticleSimulation } from "@/lib/key-visual/gpgpu-simulation";
import {
  sampleBrandmarkParticles,
  type BrandmarkBasis,
  type BrandmarkParticleSample,
} from "@/lib/brandmark/sampleBrandmarkParticles";
import { brandmarkCoreFragmentShader, brandmarkCoreVertexShader } from "./shaders";

/** Force coefficients tuned per ignite state. */
export interface BrandmarkPhysicsCoreForces {
  /** Pull toward home, in world units per second per unit displacement. */
  returnStrength: number;
  /** Curl-noise flow amplitude. */
  flowStrength: number;
  /** Per-particle random wander amplitude. */
  turbulence: number;
}

/** Force coefficients applied at `ignite = 0` (dispersed cloud).
 *
 *  - `returnStrength: 0.4` — gentle pull toward home; just enough to
 *    keep the cloud centred near the brandmark rather than drifting.
 *  - `flowStrength: 0.06` — slow curl wrap so dispersed particles
 *    drift rather than sit still.
 *  - `turbulence: 0.32` — large wander so the cloud reads as DUST
 *    instead of a stationary copy of the home points.
 */
const IGNITE_OFF_FORCES: BrandmarkPhysicsCoreForces = {
  returnStrength: 0.4,
  flowStrength: 0.06,
  turbulence: 0.32,
};

/** Force coefficients applied at `ignite = 1` (assembled core).
 *
 *  - `returnStrength: 6.0` — strong pull; particles close a 1-unit
 *    gap in roughly 0.17s.
 *  - `flowStrength: 0.012` — curl barely registers; the home grip
 *    dominates.
 *  - `turbulence: 0.012` — tiny breathing wobble around home so the
 *    assembled core visibly lives instead of looking frozen.
 */
const IGNITE_ON_FORCES: BrandmarkPhysicsCoreForces = {
  returnStrength: 6.0,
  flowStrength: 0.012,
  turbulence: 0.012,
};

/** Fraction of the sim's MOTION forces (turbulence + flow) retained at the
 *  parked Services centerpiece (cleanField → 1). 0 = dead still: the strong
 *  return-to-home grip pins every particle exactly at home, killing the fast
 *  per-particle "wobble"; ~0.04–0.08 would leave a barely-there shimmer. The
 *  complaint was the fast jitter, so this defaults to 0. Range 0..0.15.
 *  Gated by cleanField, so the corridor / sphere (cleanField = 0) keep the full
 *  IGNITE_ON breathing — byte-identical. `returnStrength` is never damped, so
 *  the cloud is HELD at home rather than loosened. */
const CLEAN_FIELD_FORCE_FLOOR = 0;

/** Default desktop / mobile particle counts.
 *
 *  Density rev. (2026-06-22): bumped 1300 → 3600 so the mark reads as a
 *  FINE, EVENLY-SPREAD particle field rather than a sparse scatter of fat
 *  "Christmas-light" beads — the Services centerpiece reference is a dense
 *  stipple (vos9x.com), and the clean-field path (`uCleanField`) shrinks the
 *  dots there, which only reads well once enough points carry the fill.
 *
 *  Free GPU compute: `GPGPUParticleSimulation` rounds the particle count up
 *  to a power-of-two texture (1300 already allocates a 64×64 = 4096-texel
 *  sim and the compute pass runs over ALL 4096 texels regardless). Drawing
 *  3600 instead of 1300 just renders more of the particles the sim is
 *  already integrating — no extra compute, only ~2300 more cheap point
 *  verts. Anything up to 4096 is free on desktop; keep a little headroom.
 *
 *  Composition balance is preserved: 3600 still sits well under the
 *  surrounding gimbal's dotted shell (9600 dots, see
 *  `SUBSTRATE_GYRO_DOTTED_SHELL_COUNT_DESKTOP`), so the brandmark stays the
 *  lighter luminous core nested inside the heavier cage during the
 *  corridor / sphere phase.
 *
 *  Mobile 650 → 1000 stays inside the 32×32 = 1024-texel sim (same
 *  free-compute logic); going past 1024 would jump it to a 64×64 sim
 *  (4× the compute) on phones, so it's held under that ceiling.
 *
 *  Density decoupling (2026-06-22c): the count is the GLOBAL particle budget,
 *  shared by the corridor AND the parked centerpiece. To make the Services
 *  centerpiece DENSE while keeping the corridor (Navigate / Encode / sphere)
 *  CALM, the count is large (6000) and the CORRIDOR draws only a fraction of it
 *  via the `corridorKeep` rank-clip — the actor passes ~0.27
 *  (`CORRIDOR_DRAW_TARGET / count`), so the corridor still draws ~1600 (calm, ≈
 *  the prior look) — while the parked centerpiece draws `cleanFieldKeep` (~0.65)
 *  ≈ 3900. So raise the count to add centerpiece density; the corridor
 *  self-corrects via `corridorKeep`. NOTE: 6000 crosses the GPGPU sim texture
 *  from 64×64 (4096) to 128×128 (16384) — ~4× the per-frame compute (a tiny
 *  offscreen render), desktop only. Mobile (650) stays in 32×32 and its WebGL
 *  core is only the reduced-motion fallback (corridorKeep resolves to 1). */
export const BRANDMARK_PHYSICS_CORE_COUNT_DESKTOP = 6000;
export const BRANDMARK_PHYSICS_CORE_COUNT_MOBILE = 650;

/** Default per-particle CSS pixel size — the PARKED BASELINE (the
 *  low-ignite swirl behind the crisp SVG mark at the section-2
 *  Thoughtform rest). Kept small so each particle reads as a discrete
 *  speck with visible negative space, and the swirl stays subtle
 *  behind the SVG. The corridor actor ramps this UP (-> ~4.0) via
 *  `pointSizeRef` as the mark ignites and flies into the substrate
 *  sphere, where the core must read as a luminous body against the
 *  denser gimbal shell (9600 dots at ~4.8px). See
 *  `BrandmarkPhysicsCoreActor`. */
const DEFAULT_POINT_SIZE_PX = 2.8;

/** Default per-particle opacity — the PARKED BASELINE (see point-size
 *  note above). Tuned subtle so the parked swirl doesn't compete with
 *  the crisp SVG Thoughtform read; the corridor actor ramps this UP
 *  (-> ~0.95) via `opacityRef` during the fly-in so the brandmark
 *  merges into the sphere as a clearly-visible bright body rather than
 *  an almost-invisible wisp. */
const DEFAULT_OPACITY = 0.78;

/** Read-only ref shape for the live-value props. `MutableRefObject`
 *  (which is what `useRef` returns) is structurally compatible — we
 *  only ever read `.current`. */
type ReadonlyRef<T> = { readonly current: T };

/** Render-mode + symbol identifiers for the lab particle-type switch
 *  (ADR-023 addendum). Encoded to the `int` shader uniforms below.
 *
 *  Eight modes today — `dot` is the historical default (byte-identical
 *  to the corridor / parked centerpiece). The newer modes (`dash`,
 *  `cell`, `bracket`, `scan`) rotate the point sprite by the particle's
 *  `aAngle` so oriented primitives align with the SVG-outline tangent
 *  when the new `svg-outline` / `model-wire` bases are in use. With the
 *  legacy `dome-fill` basis the angles are 0, so those modes degenerate
 *  to axis-aligned variants — still useful as a more tactical look. */
export type BrandmarkCoreShape =
  | "dot"
  | "dither"
  | "voxel"
  | "glyph"
  | "dash"
  | "cell"
  | "bracket"
  | "scan";
export type BrandmarkCoreGlyph = "plus" | "cross" | "square" | "ring" | "diamond" | "asterisk";
export type BrandmarkCoreBlending = "additive" | "normal";

const SHAPE_TO_INT: Record<BrandmarkCoreShape, number> = {
  dot: 0,
  dither: 1,
  voxel: 2,
  glyph: 3,
  dash: 4,
  cell: 5,
  bracket: 6,
  scan: 7,
};
const GLYPH_TO_INT: Record<BrandmarkCoreGlyph, number> = {
  plus: 0,
  cross: 1,
  square: 2,
  ring: 3,
  diamond: 4,
  asterisk: 5,
};

export interface BrandmarkPhysicsCoreForceOverrides {
  /** Force values at `ignite = 0`. Partial overrides — anything not
   *  specified falls back to `IGNITE_OFF_FORCES`. */
  off?: Partial<BrandmarkPhysicsCoreForces>;
  /** Force values at `ignite = 1`. Partial overrides — anything not
   *  specified falls back to `IGNITE_ON_FORCES`. */
  on?: Partial<BrandmarkPhysicsCoreForces>;
}

export interface BrandmarkPhysicsCoreProps {
  /** Particle count. Capped to a power-of-two texture by the sim. */
  count?: number;
  /** 0 = dispersed cloud, 1 = assembled core. The component
   *  interpolates forces between `IGNITE_OFF_FORCES` and
   *  `IGNITE_ON_FORCES`. */
  ignite?: number;
  /** Live ref for `ignite`. Read every frame inside `useFrame` so the
   *  parent can drive the value imperatively without re-rendering.
   *  Wins over the static `ignite` prop when both are provided. */
  igniteRef?: ReadonlyRef<number>;
  /** 2D → 3D morph dial. `0` collapses the cloud to the FLAT brandmark
   *  silhouette (z = 0, pixel-identical to the SVG it replaces); `1` is
   *  the full forward-domed 3D mark. The XY silhouette is preserved at
   *  every value (the dome only ever lives in Z), so the brandmark reads
   *  as the SAME mark gaining depth. Default `1` (full 3D) for lab /
   *  simple consumers. */
  depth?: number;
  /** Live ref for `depth`. Read every frame inside `useFrame` so the
   *  corridor actor can drive the flat → 3D morph imperatively without
   *  re-rendering. Wins over the static `depth` prop when provided. */
  depthRef?: ReadonlyRef<number>;
  /** Subtle matrix-glitch amplitude (0..1). Drives a gentle scanline-band
   *  displacement + in-palette hue warble in the shader. Default 0 (no
   *  glitch). The corridor actor ramps this as a bell across the 2D → 3D
   *  handoff so the mark briefly destabilises as it gains depth. */
  glitch?: number;
  /** Live ref for `glitch`. Read every frame inside `useFrame` so the
   *  corridor actor can drive the bell imperatively without re-rendering.
   *  Wins over the static `glitch` prop when provided. */
  glitchRef?: ReadonlyRef<number>;
  /** Backward-Z stream amplitude (normalised local units). Pushes
   *  particles toward the background for a flying-into-depth momentum;
   *  a base component shifts the whole silhouette, a seed-varied
   *  component trails individual particles. Default 0. The corridor
   *  actor drives this from a scroll/velocity envelope across the
   *  entry → sphere band. */
  stream?: number;
  /** Live ref for `stream`. Read every frame inside `useFrame` so the
   *  corridor actor can drive the momentum imperatively without
   *  re-rendering. Wins over the static `stream` prop when provided. */
  streamRef?: ReadonlyRef<number>;
  /** Clean-field dial (0..1). 0 = luminous "dust" (the corridor / sphere
   *  look: per-particle brightness + size variance, soft halo, organic
   *  flicker); 1 = clean uniform field (the Services centerpiece: uniform
   *  size + brightness, crisp dot, no flicker, even gold tone). Default 0.
   *  The corridor actor ramps this with the shrink-in so the sphere is
   *  untouched and the mark cleans up as it settles into #services. */
  cleanField?: number;
  /** Live ref for `cleanField`. Read every frame inside `useFrame`. Wins
   *  over the static `cleanField` prop when provided. */
  cleanFieldRef?: ReadonlyRef<number>;
  /** Surviving particle fraction in the CORRIDOR (`cleanField` = 0). 1 = no
   *  thinning (default — lab + other consumers unchanged). Production sets this
   *  < 1 to thin a LARGE global count back down so Navigate / Encode / sphere
   *  stay calm while the centerpiece draws densely from the same cloud. */
  corridorKeep?: number;
  /** Surviving particle fraction at the parked centerpiece (`cleanField` = 1).
   *  1 = no thinning. Production default 0.65. Tunable so the lab can dial the
   *  centerpiece spacing without touching the corridor (gated by cleanField). */
  cleanFieldKeep?: number;
  /** Dot-size multiplier at the parked centerpiece (`cleanField` = 1).
   *  Production default 0.50 (fine dots). */
  cleanFieldDotScale?: number;
  /** Dot-falloff inner edge at the parked centerpiece (`cleanField` = 1) —
   *  higher = crisper / tighter dots. Production default 0.40. */
  cleanFieldEdge?: number;
  /** When true, the GPGPU sim is seeded with the particles already AT
   *  their home positions (instead of a scattered sphere of dust). Use
   *  for the corridor morph, where the mark must read as the brandmark
   *  from the first visible frame — never assemble from a swirl. The
   *  scattered seed is the lab default (false). */
  seedAtHome?: boolean;
  /** Per-particle CSS pixel size. Default `DEFAULT_POINT_SIZE_PX`. */
  pointSize?: number;
  /** Live ref for `pointSize`. Read every frame inside `useFrame` so
   *  the corridor actor can ramp the speck size as the mark ignites /
   *  flies in without re-rendering. Wins over the static `pointSize`
   *  prop when provided. */
  pointSizeRef?: ReadonlyRef<number>;
  /** Primary tint — body of the cloud. */
  color?: string;
  /** Accent tint — rim particles (high `edgeWeight`) blend toward
   *  this. Pick brighter than `color` for a "hot rim". */
  accentColor?: string;
  /** Additional alpha multiplier (0..1). */
  opacity?: number;
  /** Live ref for `opacity`. Read every frame inside `useFrame` so the
   *  corridor actor can ramp brightness as the mark ignites / flies in
   *  without re-rendering. Wins over the static `opacity` prop when
   *  provided. */
  opacityRef?: ReadonlyRef<number>;
  /** Initial scatter radius in NORMALISED units (the cloud lives in
   *  a [-0.5, 0.5] cube). 0.5 produces an initial sphere of dust
   *  the size of the brandmark itself. */
  scatterRadius?: number;
  /** Forward dome amplitude (normalised). Default 0.18. */
  bulge?: number;
  /** Per-particle Z jitter (normalised). Default 0.06. */
  thickness?: number;
  /** When true, the GPGPU compute pass is skipped — particles render
   *  at their last-computed positions. Set when the corridor stage
   *  is off-screen so the GPU idles. */
  paused?: boolean;
  /** Live ref for `paused`. Same imperative-write pattern as
   *  `igniteRef`. Wins over the static `paused` prop when both are
   *  provided. */
  pausedRef?: ReadonlyRef<boolean>;
  /** When true, particles render at home positions (no compute, no
   *  motion). Mobile / no-WebGL2 fallback path. */
  reducedMotion?: boolean;
  /** Per-state force overrides for live tuning. */
  forces?: BrandmarkPhysicsCoreForceOverrides;
  /** Lab-only: enable depthWrite. Default false (additive on,
   *  depthWrite off — the standard "luminous" path). */
  depthWrite?: boolean;
  /** Per-particle render shape (lab; ADR-023 addendum). Default "dot" so the
   *  corridor + parked centerpiece are byte-identical. Other modes rewrite
   *  only the fragment-shader coverage mask. */
  shape?: BrandmarkCoreShape;
  /** Symbol drawn when `shape === "glyph"`. Default "plus". */
  glyph?: BrandmarkCoreGlyph;
  /** Stroke half-width (glyph) / gap (voxel) / shape-weight knob. Default 0.12. */
  shapeStroke?: number;
  /** Length:width ratio for oriented primitives (`dash` / `scan`). 1 = square;
   *  >1 = elongated along the contour tangent. Default 2.4 — long enough to
   *  read as a stroke, short enough to keep the contour broken into discrete
   *  marks rather than dissolving into a solid line. */
  primitiveAspect?: number;
  /** Perpendicular jitter on oriented primitives (0..1). 0 = clean
   *  parallel strokes; 0.3 = a touch of life so neighbouring dashes
   *  don't merge into a solid bar. Default 0. */
  lineJitter?: number;
  /** When true, the cloud reads as a STATIC render: the GPGPU sim's
   *  per-particle wobble (turbulence + flow) is damped to zero AND the
   *  fragment-shader pulse + brightness twinkle are flattened. Decoupled
   *  from `cleanField` so a corridor-look dither / raster / wire preset
   *  can stay still without dragging the rest of the centerpiece colour /
   *  density treatment with it (which is what `cleanField` does). Default
   *  false — production keeps the breathing corridor character. */
  freezeMotion?: boolean;
  /** Live ref for `freezeMotion`. Same imperative-write pattern as
   *  `pausedRef`. Wins over the static `freezeMotion` prop when both
   *  are provided. */
  freezeMotionRef?: ReadonlyRef<boolean>;
  /** Blend mode of the points material. "additive" (default) is the luminous
   *  glow; "normal" flattens it into a crisp retro field (kills the bloom that
   *  reads as "Christmas lights"). */
  blending?: BrandmarkCoreBlending;
  /** Which particle basis to sample (where particles LIVE, separate from
   *  what each particle DRAWS). Default "dome-fill" (legacy — the filled
   *  silhouette + shallow dome). "svg-outline" lays particles along the
   *  brandmark's path contours with per-particle tangent angles;
   *  "edge-lattice" snaps the dome-fill to a regular grid (raster /
   *  halftone read); "model-wire" extends svg-outline with per-path Z so
   *  the contours fan into a wire-frame 3D artifact. See
   *  `lib/brandmark/sampleBrandmarkParticles.ts` for the recipe. */
  basis?: BrandmarkBasis;
  /** Lattice cell size for the `edge-lattice` basis, in normalised units.
   *  Smaller = finer raster, larger = chunkier pixel grid. Default ~1/32. */
  gridSnap?: number;
  /** Stable seed for the deterministic scatter PRNG. */
  prngSeed?: number;
  /** Render order, forwarded to the underlying `<points>`. */
  renderOrder?: number;
}

interface SimResources {
  /** GPGPU sim — present on the dynamic path only. The
   *  reduced-motion path skips construction entirely. */
  sim: GPGPUParticleSimulation | null;
  /** Static home-position texture — present on the reduced-motion
   *  path so the render shader can sample homes directly without a
   *  compute pass. Owned by this component; disposed on unmount. */
  homeTexture: THREE.DataTexture | null;
  uvs: Float32Array;
  homes: Float32Array;
  edgeWeights: Float32Array;
  seeds: Float32Array;
  /** Per-particle orientation (radians). Drives oriented primitives
   *  (dash / bracket / scan) via the `aAngle` vertex attribute. 0 for
   *  the legacy `dome-fill` / `edge-lattice` bases. */
  angles: Float32Array;
  count: number;
  textureSize: number;
}

/** Mulberry32 PRNG. */
function makePrng(seed: number): () => number {
  let state = (seed | 0) >>> 0 || 0x9e3779b9;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generate a uniformly-distributed cloud of dust inside a sphere of
 *  radius `scatterRadius`. Cube-root on the radius keeps the density
 *  uniform inside the sphere. */
function buildScatteredInitial(
  count: number,
  scatterRadius: number,
  random: () => number
): Float32Array {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    const r = scatterRadius * Math.cbrt(random());
    out[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    out[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    out[i * 3 + 2] = r * Math.cos(phi);
  }
  return out;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

/** Pack home positions into a 1×1 padded RGBA Float32 DataTexture
 *  matching the GPGPU sim's textureSize convention. Used by the
 *  reduced-motion path. */
function makeHomePositionTexture(homes: Float32Array, textureSize: number): THREE.DataTexture {
  const total = textureSize * textureSize;
  const data = new Float32Array(total * 4);
  const count = Math.min(homes.length / 3, total);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const i4 = i * 4;
    data[i4] = homes[i3];
    data[i4 + 1] = homes[i3 + 1];
    data[i4 + 2] = homes[i3 + 2];
    data[i4 + 3] = 1;
  }
  const tex = new THREE.DataTexture(
    data,
    textureSize,
    textureSize,
    THREE.RGBAFormat,
    THREE.FloatType
  );
  tex.needsUpdate = true;
  return tex;
}

export function BrandmarkPhysicsCore({
  count = BRANDMARK_PHYSICS_CORE_COUNT_DESKTOP,
  ignite = 0,
  igniteRef,
  depth = 1,
  depthRef,
  glitch = 0,
  glitchRef,
  stream = 0,
  streamRef,
  cleanField = 0,
  cleanFieldRef,
  corridorKeep = 1,
  cleanFieldKeep = 0.65,
  cleanFieldDotScale = 0.5,
  cleanFieldEdge = 0.4,
  seedAtHome = false,
  pointSize = DEFAULT_POINT_SIZE_PX,
  pointSizeRef,
  color = "#caa554",
  accentColor = "#e9c97a",
  opacity = DEFAULT_OPACITY,
  opacityRef,
  scatterRadius = 0.55,
  bulge,
  thickness,
  paused = false,
  pausedRef,
  reducedMotion = false,
  forces,
  depthWrite = false,
  shape = "dot",
  glyph = "plus",
  shapeStroke = 0.12,
  primitiveAspect = 2.4,
  lineJitter = 0,
  freezeMotion = false,
  freezeMotionRef,
  blending = "additive",
  basis = "dome-fill",
  gridSnap,
  prngSeed = 0xc0ffeeed,
  renderOrder = 1,
}: BrandmarkPhysicsCoreProps) {
  const renderer = useThree((s) => s.gl);
  const gl = useThree((s) => s.gl);
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // ── Sample the brandmark silhouette + depth ─────────────────
  // Synchronous on the client; returns null server-side. The
  // `sampleShape` primitive memoises by `(shapeKey, count)` so
  // re-mounts at the same options reuse the same buffers without
  // re-rasterising.
  const sample = useMemo<BrandmarkParticleSample | null>(() => {
    if (typeof document === "undefined") return null;
    const s = sampleBrandmarkParticles({ count, bulge, thickness, basis, gridSnap });
    return s.count > 0 ? s : null;
  }, [count, bulge, thickness, basis, gridSnap]);

  // Resources travel through state (not a ref) so the geometry memo
  // and per-frame writer both see the same simulation instance React
  // committed for this render. A ref alone would race the memo on the
  // first render with a fresh sample.
  const [resources, setResources] = useState<SimResources | null>(null);

  // ── Build sim + resources once the sample is in ─────────────
  // Two paths fork on `reducedMotion`. The dynamic path constructs a
  // GPGPU sim with scattered initial positions; the reduced-motion
  // path packs the home points into a one-shot DataTexture and binds
  // it directly so we skip the entire compute pipeline.
  useEffect(() => {
    if (!sample) return;
    let textureSize: number;
    let sim: GPGPUParticleSimulation | null = null;
    let homeTexture: THREE.DataTexture | null = null;

    if (reducedMotion) {
      // Round to power-of-two for parity with the GPGPU path's
      // texture sizing — keeps `aUV` math identical across modes.
      textureSize = Math.pow(2, Math.ceil(Math.log2(Math.ceil(Math.sqrt(sample.count)))));
      homeTexture = makeHomePositionTexture(sample.homes, textureSize);
    } else {
      const random = makePrng(prngSeed ^ 0x77665544);
      // Corridor morph (`seedAtHome`): start the particles already AT
      // the brandmark home positions so the mark reads as the brandmark
      // from frame one — it must never assemble from a visible swirl
      // (the morph is a flat → 3D extrude, not a scatter → gather). The
      // lab default is a scattered sphere of dust for the assemble demo.
      const initial = seedAtHome
        ? sample.homes.slice()
        : buildScatteredInitial(sample.count, scatterRadius, random);
      sim = new GPGPUParticleSimulation({
        renderer,
        particleCount: sample.count,
        initialPositions: initial,
        homePositions: sample.homes,
      });
      textureSize = sim.getTextureSize();

      // Seed the position shader with the force coefficients matching
      // the seed: assembled (home) forces when `seedAtHome`, dispersed
      // forces otherwise, so the very first compute step doesn't kick
      // the particles away from where they started.
      const seedForces = seedAtHome ? IGNITE_ON_FORCES : IGNITE_OFF_FORCES;
      sim.updateUniforms({
        flowStrength: seedForces.flowStrength,
        returnStrength: seedForces.returnStrength,
        turbulence: seedForces.turbulence,
        pointerStrength: 0,
      });
    }

    const uvs = createParticleUVs(textureSize);
    const next: SimResources = {
      sim,
      homeTexture,
      uvs,
      homes: sample.homes,
      edgeWeights: sample.edgeWeights,
      seeds: sample.seeds,
      angles: sample.angles,
      count: sample.count,
      textureSize,
    };
    // Publish the freshly-built sim into the render tree so the
    // geometry memo + per-frame writer see it on the next render.
    // The cascading-render concern the lint rule guards against
    // doesn't apply: this only fires when the underlying SAMPLE /
    // tier changes, which is rare and bounded.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResources(next);
    return () => {
      sim?.dispose();
      homeTexture?.dispose();
      // Clear from state too, so a stale-resources reference doesn't
      // outlive the GPU buffers it owns.
      setResources((current) => (current === next ? null : current));
    };
  }, [sample, renderer, scatterRadius, prngSeed, reducedMotion, seedAtHome]);

  // ── Build the render geometry from the sample ───────────────
  const geometry = useMemo(() => {
    if (!resources) return null;
    const { uvs, edgeWeights, seeds, angles, count: cnt } = resources;

    const geo = new THREE.BufferGeometry();
    // `position` is required by three.js to size the draw call; it is
    // overridden every frame in the vertex shader by sampling
    // `uPositionTexture` at `aUV`, so the actual values are unused.
    const positions = new Float32Array(cnt * 3);
    const perParticleUVs = new Float32Array(cnt * 2);
    const aLuma = new Float32Array(cnt);
    const aEdgeWeight = new Float32Array(cnt);
    const aAngle = new Float32Array(cnt);
    for (let i = 0; i < cnt; i++) {
      aLuma[i] = seeds[i];
      aEdgeWeight[i] = edgeWeights[i];
      aAngle[i] = angles[i];
      // Particle `i` reads from texel `(i % size, floor(i / size))` —
      // identical to the layout `createParticleUVs(textureSize)`
      // writes. Slicing the first `cnt * 2` entries gives a 1:1
      // attribute array.
      perParticleUVs[i * 2] = uvs[i * 2];
      perParticleUVs[i * 2 + 1] = uvs[i * 2 + 1];
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aUV", new THREE.BufferAttribute(perParticleUVs, 2));
    geo.setAttribute("aLuma", new THREE.BufferAttribute(aLuma, 1));
    geo.setAttribute("aEdgeWeight", new THREE.BufferAttribute(aEdgeWeight, 1));
    geo.setAttribute("aAngle", new THREE.BufferAttribute(aAngle, 1));

    return geo;
  }, [resources]);

  // ── Material ───────────────────────────────────────────────
  const material = useMemo(() => {
    const dpr = typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    return new THREE.ShaderMaterial({
      uniforms: {
        uPositionTexture: { value: null },
        uPointSize: { value: pointSize },
        uPixelRatio: { value: dpr },
        uColor: { value: new THREE.Color(color) },
        uAccentColor: { value: new THREE.Color(accentColor) },
        uOpacity: { value: opacity },
        uDepth: { value: depth },
        uGlitch: { value: glitch },
        uStream: { value: stream },
        uCleanField: { value: cleanField },
        uCorridorKeep: { value: corridorKeep },
        uCleanFieldKeep: { value: cleanFieldKeep },
        uCleanFieldDotScale: { value: cleanFieldDotScale },
        uCleanFieldEdge: { value: cleanFieldEdge },
        uShape: { value: SHAPE_TO_INT[shape] },
        uGlyph: { value: GLYPH_TO_INT[glyph] },
        uShapeStroke: { value: shapeStroke },
        uPrimitiveAspect: { value: primitiveAspect },
        uLineJitter: { value: lineJitter },
        uFreezeMotion: { value: freezeMotion ? 1 : 0 },
        uTime: { value: 0 },
      },
      vertexShader: brandmarkCoreVertexShader,
      fragmentShader: brandmarkCoreFragmentShader,
      transparent: true,
      depthWrite,
      blending: blending === "normal" ? THREE.NormalBlending : THREE.AdditiveBlending,
    });
    // `color` / `accentColor` updates are routed through the per-frame
    // uniform writes below so re-creating the material isn't necessary
    // for those — that's why they're not in the deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep refs in sync so per-frame writes hit the live material.
  useEffect(() => {
    materialRef.current = material;
  }, [material]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  // Swap the points blend mode when the lab toggles it. Fires only on change
  // (never per frame); needsUpdate forces three.js to refresh the GL state.
  // Default "additive" keeps the luminous look; "normal" flattens the field.
  // Routed through materialRef (set in the effect above) rather than mutating
  // the memoised `material` directly, so it stays the single mutable handle.
  useEffect(() => {
    const mat = materialRef.current;
    if (!mat) return;
    mat.blending = blending === "normal" ? THREE.NormalBlending : THREE.AdditiveBlending;
    mat.needsUpdate = true;
  }, [blending]);

  // Dispose the captured geometry when it's swapped out / unmounted.
  useEffect(() => {
    if (!geometry) return;
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  // Keep the pixel ratio uniform in step with viewport changes.
  useEffect(() => {
    if (typeof window === "undefined" || !materialRef.current) return;
    const onResize = () => {
      const mat = materialRef.current;
      if (!mat) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      mat.uniforms.uPixelRatio.value = dpr;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [gl]);

  // ── Per-frame: drive forces, run sim, write material uniforms ─
  useFrame((state, delta) => {
    const mat = materialRef.current;
    if (!mat || !resources) return;

    // Live size / brightness: prefer the refs so the corridor actor can
    // ramp the core from its parked baseline up to the bright fly-in
    // body without re-rendering this tree. Static props are the
    // fallback for simple lab usage.
    const resolvedPointSize = pointSizeRef ? pointSizeRef.current : pointSize;
    const resolvedOpacity = opacityRef ? opacityRef.current : opacity;
    const resolvedDepth = depthRef ? depthRef.current : depth;
    const resolvedGlitch = glitchRef ? glitchRef.current : glitch;
    const resolvedStream = streamRef ? streamRef.current : stream;
    const resolvedCleanField = cleanFieldRef ? cleanFieldRef.current : cleanField;
    const resolvedFreezeMotion = freezeMotionRef ? freezeMotionRef.current : freezeMotion;

    // Reduced-motion / static path. The home texture was bound once
    // when resources were built; we just keep tint / opacity / depth /
    // time in step here. No compute, no GPU writes from this component.
    // The uDepth morph still applies — the static silhouette flattens /
    // extrudes exactly like the dynamic core.
    if (reducedMotion || !resources.sim) {
      if (resources.homeTexture) {
        mat.uniforms.uPositionTexture.value = resources.homeTexture;
      }
      mat.uniforms.uColor.value.set(color);
      mat.uniforms.uAccentColor.value.set(accentColor);
      mat.uniforms.uPointSize.value = resolvedPointSize;
      mat.uniforms.uOpacity.value = resolvedOpacity;
      mat.uniforms.uDepth.value = resolvedDepth;
      mat.uniforms.uGlitch.value = resolvedGlitch;
      mat.uniforms.uStream.value = resolvedStream;
      mat.uniforms.uCleanField.value = resolvedCleanField;
      mat.uniforms.uCorridorKeep.value = corridorKeep;
      mat.uniforms.uCleanFieldKeep.value = cleanFieldKeep;
      mat.uniforms.uCleanFieldDotScale.value = cleanFieldDotScale;
      mat.uniforms.uCleanFieldEdge.value = cleanFieldEdge;
      mat.uniforms.uShape.value = SHAPE_TO_INT[shape];
      mat.uniforms.uGlyph.value = GLYPH_TO_INT[glyph];
      mat.uniforms.uShapeStroke.value = shapeStroke;
      mat.uniforms.uPrimitiveAspect.value = primitiveAspect;
      mat.uniforms.uLineJitter.value = lineJitter;
      mat.uniforms.uFreezeMotion.value = resolvedFreezeMotion ? 1 : 0;
      mat.uniforms.uTime.value = state.clock.elapsedTime;
      return;
    }

    const { sim } = resources;
    // Live values: prefer the ref if provided so the consumer can
    // drive ignite / paused imperatively without re-rendering this
    // tree. Static props are the fallback for simple lab usage.
    const igniteValue = igniteRef ? igniteRef.current : ignite;
    const pausedValue = pausedRef ? pausedRef.current : paused;
    if (!pausedValue) {
      // Interpolate forces between the OFF and ON tables. The lab can
      // override either side per-mount; missing fields fall back to
      // the canonical defaults so partial overrides stay safe.
      const t = clamp01(igniteValue);
      const offForces = { ...IGNITE_OFF_FORCES, ...forces?.off };
      const onForces = { ...IGNITE_ON_FORCES, ...forces?.on };
      // Centerpiece calm: as the mark settles into #services (cleanField → 1)
      // damp the MOTION forces (turbulence + flow) toward CLEAN_FIELD_FORCE_FLOOR
      // so the unchanged return-to-home grip holds every particle dead-still —
      // this kills the fast per-particle wobble without loosening the cloud.
      // Corridor / sphere: cleanField = 0 → calm = 1 → forces are the exact
      // pre-change lerp (byte-identical).
      //
      // `freezeMotion` is an INDEPENDENT stillness channel: when true the
      // forces collapse to 0 regardless of cleanField, so a corridor-look
      // dither / raster preset can run without the "wobble like liquid" the
      // sim micro-jitter produces on hard pixel cells. The returnStrength is
      // never damped (the cloud is held at home, not loosened).
      const cleanCalm = 1 - (1 - CLEAN_FIELD_FORCE_FLOOR) * clamp01(resolvedCleanField);
      const calm = resolvedFreezeMotion ? 0 : cleanCalm;
      sim.updateUniforms({
        time: state.clock.elapsedTime,
        deltaTime: Math.min(0.05, Math.max(0.001, delta)),
        flowStrength: lerp(offForces.flowStrength, onForces.flowStrength, t) * calm,
        returnStrength: lerp(offForces.returnStrength, onForces.returnStrength, t),
        turbulence: lerp(offForces.turbulence, onForces.turbulence, t) * calm,
        pointerStrength: 0,
      });
      sim.compute();
    }

    mat.uniforms.uPositionTexture.value = sim.getPositionTexture();
    mat.uniforms.uColor.value.set(color);
    mat.uniforms.uAccentColor.value.set(accentColor);
    mat.uniforms.uPointSize.value = resolvedPointSize;
    mat.uniforms.uOpacity.value = resolvedOpacity;
    mat.uniforms.uDepth.value = resolvedDepth;
    mat.uniforms.uGlitch.value = resolvedGlitch;
    mat.uniforms.uStream.value = resolvedStream;
    mat.uniforms.uCleanField.value = resolvedCleanField;
    mat.uniforms.uCorridorKeep.value = corridorKeep;
    mat.uniforms.uCleanFieldKeep.value = cleanFieldKeep;
    mat.uniforms.uCleanFieldDotScale.value = cleanFieldDotScale;
    mat.uniforms.uCleanFieldEdge.value = cleanFieldEdge;
    mat.uniforms.uShape.value = SHAPE_TO_INT[shape];
    mat.uniforms.uGlyph.value = GLYPH_TO_INT[glyph];
    mat.uniforms.uShapeStroke.value = shapeStroke;
    mat.uniforms.uPrimitiveAspect.value = primitiveAspect;
    mat.uniforms.uLineJitter.value = lineJitter;
    mat.uniforms.uFreezeMotion.value = resolvedFreezeMotion ? 1 : 0;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
  });

  if (!geometry) return null;

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      renderOrder={renderOrder}
      frustumCulled={false}
    />
  );
}
