"use client";

/**
 * BrandmarkPhysicsCoreActor — corridor-side wrapper around
 * `BrandmarkPhysicsCore` (ADR-023). Tracks the brandmark's world
 * position + half-extent every frame, drives the 2D → 3D MORPH from
 * the corridor's dolly-release gate, and bails out when the stage is
 * off-screen so the GPGPU sim doesn't burn cycles.
 *
 * The morph (rev. 2026-06-17): the flat DOM SVG brandmark and the
 * particle core are the SAME mark. At the dolly release the SVG is
 * instant-cut to the particle core while the core is held FLAT (its
 * `uDepth` ≈ 0 paints the exact same 2D silhouette at the same screen
 * position), then `depth` ramps 0 → 1 and the flat silhouette EXTRUDES
 * into the 3D domed mark. The particles never swirl — ignite is pinned
 * to assembled and the sim is `seedAtHome`, so the cloud is the
 * brandmark from frame one. This replaced an earlier model that
 * crossfaded a crisp SVG against a SEPARATE swirling cloud.
 *
 * Single-painter rule: this is the ONE in-canvas painter for the
 * corridor brandmark mark itself. The shell layers
 * (`BrandmarkAccretionShell`) wrap it from outside; the DOM
 * `ProjectedBrandmarkActor` only paints during the section-2
 * Thoughtform rest + the epilogue / dock / `#services` handoff.
 *
 * Coordinate handoff:
 *
 *   - The component samples points in normalised `[-0.5, 0.5]`
 *     space (geometry built with `targetSize: 1`).
 *   - This actor scales the wrapping `<group>` by `2 * halfExtent`.
 *     It starts at `getBrandmarkWorldHalfExtent(progress)` for a
 *     size-continuous DOM-SVG handoff, then grows to the full visible
 *     substrate-sphere radius via `getBrandmarkSphereMatchHalfExtent`.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useDeviceTier } from "@/lib/hooks/useDeviceTier";
import {
  CORRIDOR_HANDOFF_CUT_WIDTH,
  DOLLY_HOLD_END,
  GLITCH_BAND_WIDTH,
  smoothstep,
  smootherstep,
  windowFor,
} from "@/lib/home-v2/corridorMap";
import { getEpiloguePlanetScale } from "@/lib/home-v2/epilogueTimeline";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import {
  BrandmarkPhysicsCore,
  BRANDMARK_PHYSICS_CORE_COUNT_DESKTOP,
  BRANDMARK_PHYSICS_CORE_COUNT_MOBILE,
  type BrandmarkBasis,
  type BrandmarkCoreBlending,
  type BrandmarkCoreGlyph,
  type BrandmarkCoreShape,
} from "@/components/brand/BrandmarkPhysicsCore";
import { getSmoothedDissipate, getSmoothedEpilogueProgress } from "./motionFollower";
import {
  getBrandmarkSphereMatchHalfExtent,
  getBrandmarkWorldHalfExtent,
  getBrandmarkWorldPosition,
} from "./sceneGeom";

/** Ignite is pinned to "assembled" for the corridor. The mark is the
 *  SAME brandmark end-to-end — it must never assemble from a visible
 *  swirl (the morph is a flat → 3D EXTRUDE, not a scatter → gather).
 *  Combined with `seedAtHome` on `BrandmarkPhysicsCore`, the cloud IS
 *  the brandmark silhouette from the first visible frame. */
const ASSEMBLED_IGNITE = 1;

/** Width of the 2D → 3D EXTRUDE band (paint-progress). Once the cut has
 *  swapped the crisp SVG for the FLAT particle silhouette, `depth` ramps
 *  0 → 1 across this window and the core's `uDepth` uniform extrudes the
 *  flat mark into its forward-domed 3D self. Wider than the cut so the
 *  extrude reads as a continuous morph rather than a snap. */
const DEPTH_MORPH_WIDTH = 0.05;

/** Size merge completes by the Navigate station start. This decouples
 *  "become the 3D mark" from "grow to sphere dimensions": first the flat
 *  silhouette extrudes into the domed mark at SVG size, then the
 *  assembled 3D mark expands into the full visible sphere envelope
 *  during the gateway approach. */
const SIZE_MERGE_END = windowFor("navigate").start;

/** The 3D particle core's brightness + speck size. `CORE_OPACITY` is
 *  held bright/solid so the FLAT silhouette (the instant the cut fires)
 *  reads as densely as the crisp SVG it replaces — no "stippled vs
 *  vector" mismatch at the swap. Speck size grows slightly as the mark
 *  extrudes into the luminous 3D body nested inside the substrate
 *  sphere (where it must read against the gimbal shell's dots).
 *
 *  Corridor calm-down (2026-06-22b): lowered 0.95 → 0.72 because the corridor
 *  read TOO BRIGHT (additive bloom). Paired with the count dial-back to 1600.
 *  This is the CORRIDOR brightness only — the Services centerpiece has its own
 *  absolute `CENTER_OPACITY` (decoupled), so lowering this never drags the
 *  centerpiece with it. Lower further to dim the corridor. */
const CORE_OPACITY = 0.72;
const CORE_POINT_SIZE_FLAT = 3.0;
const CORE_POINT_SIZE_3D = 4.0;

/** Target number of particles DRAWN in the corridor (Navigate / Encode /
 *  sphere). The global count is large (6000) to feed a dense parked centerpiece;
 *  the corridor thins back to this via `corridorKeep` so it stays calm — ≈ the
 *  prior corridor density. Raising the global count adds centerpiece density
 *  without touching the corridor (the keep auto-recomputes). */
const CORRIDOR_DRAW_TARGET = 1600;

/** ── Production appearance (basis · primitive · blending) ─────────────
 *  These constants pick a particular visual preset for the live corridor
 *  + Services centerpiece. The lab (`/test/brandmark-physics-core`) can
 *  explore alternatives via the "Visual preset" picker; promoting one to
 *  production is a constant edit here. The defaults below reproduce the
 *  legacy luminous-dust look (`dome-fill` + additive `dot`) so the
 *  corridor + parked centerpiece stay byte-identical until the chosen
 *  preset is wired in.
 *
 *  Why these are explicit (not relying on the component's defaults):
 *  the lab can change defaults during prototyping without dragging the
 *  live mark along with it — these pins are the production contract.
 *
 *  Invariant guardrail: changing `PRODUCTION_BASIS` away from
 *  `dome-fill` re-targets the sample silhouette. The SVG → core morph
 *  (ADR-023 Invariant 3) assumes the FLAT particle silhouette matches
 *  the SVG paint at `uDepth = 0`. The `dome-fill` basis samples the
 *  filled paths and matches by definition; `svg-outline` samples points
 *  ALONG the path contours (the outline reads as the mark but the
 *  morph would now be SVG-fill → particle-outline). If a future ADR
 *  promotes `svg-outline`/`model-wire`, either accept that the morph
 *  reads as a fill→outline transition or revise the SVG handoff to
 *  paint the brandmark outline instead of the filled paths.
 *
 *  Current look (2026-06-22, preset `y95do0` "Dither 3"): `edge-lattice`
 *  basis + `voxel` shape + additive blending. The dome-fill silhouette is
 *  quantised to a ~1/60 grid (`PRODUCTION_GRID_SNAP`) and each surviving
 *  cell is painted as a hard gold square (`voxel`, gap `PRODUCTION_SHAPE_STROKE`).
 *  Consequence (accepted by the brief): the SVG → core cut now reads as the
 *  crisp vector mark "pixelating" into a voxel grid (fill → raster), not the
 *  byte-identical fill → fill of the legacy dome-fill/dot look. The lattice
 *  is already a sparse set of cells, so the corridor is NOT additionally
 *  thinned — `PRODUCTION_CORRIDOR_KEEP` overrides the count-based keep to 1.0
 *  (see below). `freezeMotion` stays false (the preset kept the slight
 *  corridor breathing; the centerpiece still calms via `cleanField` → 1). */
const PRODUCTION_BASIS: BrandmarkBasis = "edge-lattice";
const PRODUCTION_SHAPE: BrandmarkCoreShape = "voxel";
const PRODUCTION_GLYPH: BrandmarkCoreGlyph = "plus";
const PRODUCTION_BLENDING: BrandmarkCoreBlending = "additive";
const PRODUCTION_SHAPE_STROKE = 0.12;
const PRODUCTION_PRIMITIVE_ASPECT = 2.4;
const PRODUCTION_LINE_JITTER = 0;

/** Lattice cell size for `PRODUCTION_BASIS = "edge-lattice"` (normalised
 *  units; ~1/60 across the mark). Ignored by the other bases. From preset
 *  `y95do0`. */
const PRODUCTION_GRID_SNAP = 0.0165;

/** Corridor draw-fraction override. `null` → use the count-based
 *  `CORRIDOR_DRAW_TARGET / count` thinning (correct for the dense `dome-fill`
 *  basis). A number pins the corridor keep directly — needed for sparse bases
 *  like `edge-lattice`, where the dome-fill samples are already collapsed to a
 *  small set of unique grid cells, so the count-based 0.27 keep would shred the
 *  voxel grid into a broken scatter. The preset `y95do0` draws the full lattice
 *  (keep 1.0). The centerpiece still thins via `cleanFieldKeep` as `cleanField`
 *  ramps to 1. */
const PRODUCTION_CORRIDOR_KEEP: number | null = 1;

/** Core-shrink handoff into Services (2026-06-20). The in-sphere
 *  particle core IS the brandmark end-to-end — at the Services dive it
 *  doesn't dim out and hand off to a separate mark; it SHRINKS from
 *  sphere-fill down to a small centred centerpiece and stays the one and
 *  only mark. These knobs drive that shrink off the dissipate clock:
 *
 *   - `SHRINK_START/END` — dissipate window the shrink + re-centre runs
 *     over (0 = sphere-fill at "everyone is racing", 1 = parked
 *     centerpiece). Settles before the dock releases into ambient.
 *   - `CENTER_DISTANCE` — how far in front of the live camera the shrunk
 *     core is placed, so the camera fly-in can't carry it off; it lands
 *     dead-centre in the viewport.
 *   - `CENTER_TARGET_SCALE` — world scale (geometry is normalised to 1)
 *     of the parked centerpiece. Combined with `CENTER_DISTANCE` this
 *     sets the on-screen size — tune both so it reads like the Services
 *     centerpiece. */
const SHRINK_START = 0.04;
const SHRINK_END = 0.9;
const CENTER_DISTANCE = 3.2;
const CENTER_TARGET_SCALE = 1.15;

/** Gentle 3D drift at the parked centerpiece — a slow sinusoidal tilt that
 *  reveals the kept dome's depth, so the mark reads as a living 3D object
 *  rather than a flat decal. Kept small-amplitude so it NEVER rotates edge-on
 *  (the brandmark silhouette is shallow-Z; a full spin would collapse it to a
 *  sliver). Different X / Y periods give a slow Lissajous nod, not a metronome.
 *  Set both amplitudes to 0 for a fully still centerpiece. Eased in by `recT`,
 *  so the corridor / sphere are untouched. */
const CENTER_DRIFT_AMP_X_RAD = 0.16; // ~9° pitch
const CENTER_DRIFT_AMP_Y_RAD = 0.21; // ~12° yaw
const CENTER_DRIFT_PERIOD_X_S = 17;
const CENTER_DRIFT_PERIOD_Y_S = 13;

/** ABSOLUTE opacity of the parked Services centerpiece, DECOUPLED from the
 *  corridor `CORE_OPACITY`: the mark lerps from the corridor brightness to this
 *  as `recT` → 1, so dialing the corridor brightness up/down never drags the
 *  centerpiece with it. (The earlier MULTIPLIER coupling, combined with the
 *  count dial-back to 1600, made the centerpiece nearly vanish — this fixes
 *  that.) Tuned so the mark reads as a present-but-soft background element
 *  behind the copy — NOT invisible (it must survive the small centerpiece dots
 *  + the lower 1600 count). Raise for more presence, lower for more recede.
 *  At 0.90 the mark reads clearly but, with its small crisp 2px dots, still
 *  sits softer than the 4px corridor stations (≈⅓ their per-dot ink). */
const CENTER_OPACITY = 0.9;

/** Z-stream momentum (2026-06-17). As the mark flies into the corridor
 *  toward the substrate sphere, particles stream toward the background
 *  (local −Z) so the brandmark reads as flying backward into the sphere
 *  with a comet-tail sense of motion (vs. a rigid block that just
 *  translates). The shader splits this into a base shift (whole
 *  silhouette) + a seed-varied tail (individual particles).
 *
 *  - `STREAM_MAX` — peak backward-Z in normalised local units.
 *  - The envelope is gated to the entry → Navigate-park band and
 *    velocity-modulated: a faster scroll trails further (momentum),
 *    with `STREAM_VEL_BASE` keeping the stream readable on a slow
 *    scroll. It fades to 0 by `SIZE_MERGE_END` so the silhouette is
 *    clean once parked inside the sphere. */
const STREAM_MAX = 0.5;
const STREAM_VEL_SCALE = 3.2;
const STREAM_VEL_BASE = 0.45;
const STREAM_TAU_S = 0.12;
const STREAM_FADE_BAND = 0.08;

interface BrandmarkPhysicsCoreActorProps {
  /** Pass-through tints. The actor doesn't bake in palette decisions
   *  so the consumer keeps the canonical Thoughtform tokens at the
   *  edge. */
  color?: string;
  accentColor?: string;
  /** When true, falls back to the static (non-compute) home-position
   *  render. Set on `mobile` device-tier so phones don't pay the
   *  GPGPU compute cost. */
  forceStatic?: boolean;
}

export function BrandmarkPhysicsCoreActor({
  color = "#caa554",
  accentColor = "#e9c97a",
  forceStatic,
}: BrandmarkPhysicsCoreActorProps) {
  const tier = useDeviceTier();
  const isMobile = tier === "mobile";
  const renderer = useThree((s) => s.gl);
  // Fallback gating (ADR-023):
  //   - desktop + WebGL2  → GPGPU compute core
  //   - mobile / no-WebGL2 → static home-position render (no compute)
  // The corridor-level fallback in `HomeCorridor` already routes
  // reduced-motion / `corridorCapable() === false` to the static text
  // overlay (no canvas), so this actor never mounts in that case.
  const supportsWebGL2 = useMemo(() => {
    return Boolean(renderer.capabilities?.isWebGL2);
  }, [renderer]);
  const reducedMotion = forceStatic ?? (isMobile || !supportsWebGL2);
  const count = isMobile
    ? BRANDMARK_PHYSICS_CORE_COUNT_MOBILE
    : BRANDMARK_PHYSICS_CORE_COUNT_DESKTOP;
  // Corridor draws only a fraction of the (large) global count so it stays calm
  // while the centerpiece draws densely from the same cloud. Desktop:
  // 1600/6000 ≈ 0.27; mobile: min(1, 1600/650) = 1 (no thinning — already low).
  // `PRODUCTION_CORRIDOR_KEEP` overrides this for sparse bases (edge-lattice):
  // the lattice already collapses the cloud to a small set of unique cells, so
  // the count-based 0.27 keep would shred the voxel grid — pin it to 1.0 there.
  const corridorKeep = PRODUCTION_CORRIDOR_KEEP ?? Math.min(1, CORRIDOR_DRAW_TARGET / count);

  const groupRef = useRef<THREE.Group>(null);
  // Scratch for the Services core-shrink (camera-front re-centre) so we
  // don't allocate per frame.
  const fwdScratch = useRef(new THREE.Vector3());
  const frontScratch = useRef(new THREE.Vector3());
  const posScratch = useRef(new THREE.Vector3());
  // Scratch for the centerpiece gentle-drift tilt (avoid per-frame allocs).
  const driftQuatScratch = useRef(new THREE.Quaternion());
  const driftEulerScratch = useRef(new THREE.Euler());
  const igniteRef = useRef(ASSEMBLED_IGNITE);
  const depthRef = useRef(0);
  const glitchRef = useRef(0);
  const streamRef = useRef(0);
  // Clean-field dial: 0 = luminous dust (corridor/sphere), 1 = uniform crisp
  // field (Services centerpiece). Driven from the shrink progress so the
  // mark cleans up exactly as it settles into #services (see shaders).
  const cleanFieldRef = useRef(0);
  const opacityRef = useRef(0);
  const pointSizeRef = useRef(CORE_POINT_SIZE_FLAT);
  const pausedRef = useRef(true);

  // Drive the per-frame transform (position, scale, visibility) AND
  // the in-component refs that read into `BrandmarkPhysicsCore` props
  // on the next render. Position + scale don't need React; they're
  // imperative writes on the group.
  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const t = useDepthGatewayStore.getState().transform;
    // Keep the sim alive through the dock so the in-sphere core fades
    // gradually with the dissipate (see `handoffFade` below). Without
    // `t.docked` the actor would early-return as soon as the corridor
    // released `active`, which read as the interior of the sphere
    // going empty just as the camera flies into it.
    //
    // Also keep painting through the services ambient hold (ADR-021
    // addendum) so the sim's GPU state stays warm if the user
    // reverse-scrolls back into the dock — without it the actor
    // would unmount its render contribution between dock release and
    // ambient release, which costs a re-warm spike on reverse. The
    // core itself is held INVISIBLE during ambient (`handoffFade=0`
    // below) so the centred DOM brandmark + seam pixel field stay
    // the sole foreground marks.
    const painting = t.active || t.armed || t.docked || t.servicesAmbient;
    if (!painting) {
      group.visible = false;
      pausedRef.current = true;
      return;
    }

    // Use `paintProgress` directly so during the armed pre-pin the
    // core sits at the parked Thoughtform position with ignite=0
    // (dispersed cloud, but invisible — see opacity gate below).
    const progress = t.paintProgress;
    const [bx, by, bz] = getBrandmarkWorldPosition(progress);

    // ── Services core-shrink (2026-06-20) ────────────────────────────
    // As the user scrolls into #services the dissipate clock ramps 0→1.
    // The core (which fills the sphere at "everyone is racing") shrinks
    // down to a small centred centerpiece and stays the one mark. `recT`
    // is the eased shrink/re-centre progress; 0 = sphere-fill (no change
    // from today), 1 = parked centerpiece. Held at 1 through the services
    // ambient hold (the motion follower pins dissipate at 1).
    const dissipate = t.docked || t.servicesAmbient ? getSmoothedDissipate() : 0;
    const recT = smootherstep(SHRINK_START, SHRINK_END, dissipate);

    // ── SVG → particle MORPH (ADR-023, rev. 2026-06-17) ───────────
    // The mark is the SAME brandmark end-to-end; only its MEDIUM and
    // its DIMENSION change. Two channels, both anchored at the dolly
    // release — NOT a crossfade between two different-looking things:
    //
    //   1. CUT (`reveal`, `CORRIDOR_HANDOFF_CUT_WIDTH`) — a near-instant
    //      cross-cut from the crisp DOM SVG to the particle core. At
    //      this instant the core is held FLAT (depth ≈ 0) and assembled,
    //      so it paints the EXACT same silhouette at the same screen
    //      position — the swap is invisible. The SVG fade in
    //      `ProjectedBrandmarkActor` rides this same band so the two
    //      swap as one frame-matched event.
    //   2. DEPTH (`depth`, `DEPTH_MORPH_WIDTH`) — once cut over, the
    //      flat silhouette EXTRUDES into the 3D domed mark via the
    //      core's `uDepth` uniform. This is the visible 2D → 3D morph.
    //
    // The particles NEVER swirl: ignite is pinned to assembled and the
    // sim is seeded at home, so the cloud is the brandmark from frame
    // one. Size growth into the sphere happens separately below.
    const reveal = smootherstep(
      DOLLY_HOLD_END,
      DOLLY_HOLD_END + CORRIDOR_HANDOFF_CUT_WIDTH,
      progress
    );
    const depth = smootherstep(DOLLY_HOLD_END, DOLLY_HOLD_END + DEPTH_MORPH_WIDTH, progress);

    // Subtle matrix-glitch BELL (2026-06-17). `sin(t·π)` across
    // `[DOLLY_HOLD_END, DOLLY_HOLD_END + GLITCH_BAND_WIDTH]` so glitch is
    // exactly 0 at both ends (the soft-halo cloud is byte-stable outside
    // the handoff) and peaks at 1 mid-band — right as the flat silhouette
    // extrudes into 3D. The shader keeps the displacement + hue warble
    // small and in-palette, so this reads as the dust briefly
    // destabilising as it gains depth, integrated with the soft-halo
    // look rather than a separate harsh effect.
    let glitch = 0;
    if (progress > DOLLY_HOLD_END && progress < DOLLY_HOLD_END + GLITCH_BAND_WIDTH) {
      const t = (progress - DOLLY_HOLD_END) / GLITCH_BAND_WIDTH;
      glitch = Math.sin(t * Math.PI);
    }

    // ── Z-STREAM momentum envelope (2026-06-17) ──────────────────
    // Active across the entry → Navigate-park "fly into the sphere"
    // leg. Velocity-modulated so a faster scroll trails the particles
    // further back (momentum), with a baseline so the stream still
    // reads on a slow scroll. Fades to 0 by SIZE_MERGE_END so the
    // silhouette is clean once parked inside the sphere. Eased on
    // wall-clock time so the velocity term doesn't jitter frame-to-frame.
    const streamBandIn = smoothstep(DOLLY_HOLD_END, DOLLY_HOLD_END + 0.02, progress);
    const streamBandOut =
      1 - smoothstep(SIZE_MERGE_END - STREAM_FADE_BAND, SIZE_MERGE_END, progress);
    const streamBand = streamBandIn * streamBandOut;
    const velNorm = Math.min(1, Math.abs(t.velocity) * STREAM_VEL_SCALE);
    const streamTarget =
      streamBand * STREAM_MAX * (STREAM_VEL_BASE + (1 - STREAM_VEL_BASE) * velNorm);
    const kStream = 1 - Math.exp(-Math.max(0, delta) / STREAM_TAU_S);
    streamRef.current += (streamTarget - streamRef.current) * kStream;

    igniteRef.current = ASSEMBLED_IGNITE;
    // Keep the forward 3D dome at the parked Services centerpiece (do NOT
    // flatten). `depth` is already 1 well before the shrink begins, so this
    // holds the baked dome (bulge / thickness) — the mark reads as a
    // dimensional 3D object in #services, and the gentle drift below reveals
    // that volume. (Was `depth * (1 - recT)`, which collapsed it to a flat
    // billboard at the centerpiece.) Z-only, so the XY silhouette is preserved.
    depthRef.current = depth;
    // Clean up the particle style (uniform size/brightness, crisp dot, no
    // flicker) in lock-step with the shrink — corridor/sphere stays dust.
    cleanFieldRef.current = recT;
    glitchRef.current = glitch;

    // Corridor → epilogue handoff: the in-canvas core owns the mark
    // while the visitor exits Build and flies through the substrate
    // sphere. Once the dock engages the DOM SVG re-centres into
    // `#services` and owns the readable FOREGROUND mark, so the core
    // yields its foreground role — but instead of the previous hard
    // `t.docked ? 0 : 1` cut, it drops to a low floor for the rest of
    // the dock so the inside of the sphere keeps reading as muted
    // particulate texture while the camera enters the volume. The
    // floor is also nudged down across the dissipate so the soft
    // interior haze fades alongside the dotted-shell scatter and
    // doesn't outlive the rest of the sphere. `dissipateInteriorOpacity`
    // mirrors `mats.particle` in `ShellSubstrateGyro` (same helper, same
    // floor semantics) so the core relaxes in step with the gyro's
    // ambient interior cloud — both read as a single soft volume rather
    // than as two layers on different clocks.
    //
    // Core-shrink handoff (2026-06-20): the core IS the brandmark through
    // the dock + Services ambient — it shrinks to the centred centerpiece
    // and stays the one visible mark (the welded SVG + separate 2D field
    // are retired). So keep it at full brightness the whole way instead of
    // dimming to a floor / forcing 0. The ambient shell haze still comes
    // from `mats.particle` in `ShellSubstrateGyro`.
    const handoffFade = 1;

    // Centerpiece opacity is DECOUPLED from the corridor CORE_OPACITY: it lerps
    // from the corridor brightness to an ABSOLUTE target (CENTER_OPACITY) as the
    // mark parks, so dialing the corridor brightness never drags the centerpiece
    // with it. recT = 0 in the corridor → parkedOpacity = CORE_OPACITY (the
    // corridor is byte-identical).
    const parkedOpacity = CORE_OPACITY + (CENTER_OPACITY - CORE_OPACITY) * recT;

    // Hidden at the section-2 rest (the SVG owns the crisp 2D mark); the cut
    // brings the core to full brightness as the SVG vanishes; it stays
    // bright/solid through the corridor → epilogue → Services shrink, then
    // settles to its own absolute centerpiece opacity at the parked mark.
    opacityRef.current = parkedOpacity * reveal * handoffFade;
    // Crisp small specks for the flat silhouette → slightly larger
    // specks for the luminous 3D body, riding the depth extrude.
    pointSizeRef.current =
      CORE_POINT_SIZE_FLAT + (CORE_POINT_SIZE_3D - CORE_POINT_SIZE_FLAT) * depth;

    // Size: hand off at the DOM-SVG world half-extent (size-continuous
    // cut), then grow the assembled 3D mark into the full visible
    // substrate-sphere dimensions by the Navigate station. Anchored to
    // the depth-morph END so the order reads "extrude into the mark,
    // then grow into the sphere".
    const handoffHalf = getBrandmarkWorldHalfExtent(progress);
    const sphereHalf = getBrandmarkSphereMatchHalfExtent(progress);
    const sizeMerge = smoothstep(DOLLY_HOLD_END + DEPTH_MORPH_WIDTH, SIZE_MERGE_END, progress);
    const half = handoffHalf + (sphereHalf - handoffHalf) * sizeMerge;
    // The substrate sphere composes this exact smoothed epilogue scale
    // in `BrandmarkAccretionShell`. The core is the mark INSIDE that
    // sphere during non-docked epilogue, so it must ride the same
    // clock/multiplier or it appears to lag as the planet grows into
    // the title section.
    const planetScale = getEpiloguePlanetScale(getSmoothedEpilogueProgress());

    // Sphere-fill scale (today's behaviour) → small centerpiece scale as
    // the core shrinks. At recT 0 this is byte-identical to before.
    const sphereScale = half * 2 * planetScale;
    const scale = sphereScale + (CENTER_TARGET_SCALE - sphereScale) * recT;

    // Position: sphere centre (world) → a point dead-centre in front of
    // the LIVE camera, so the camera fly-in can't carry the shrinking mark
    // off-screen. At recT 0 it sits at the sphere centre (unchanged).
    posScratch.current.set(bx, by, bz);
    if (recT > 1e-4) {
      const cam = state.camera;
      fwdScratch.current.set(0, 0, -1).applyQuaternion(cam.quaternion);
      frontScratch.current.copy(cam.position).addScaledVector(fwdScratch.current, CENTER_DISTANCE);
      posScratch.current.lerp(frontScratch.current, recT);
      // Head-on billboard base so the mark faces the viewer at the centerpiece.
      group.quaternion.identity().slerp(cam.quaternion, recT);
      // Gentle 3D drift: a slow, small-amplitude sinusoidal tilt on X / Y (a
      // Lissajous nod, different periods) eased in by recT. It parallax-reveals
      // the kept dome's depth so the mark reads as a living 3D object — WITHOUT
      // ever rotating edge-on (the silhouette is shallow-Z, so a full spin would
      // collapse it to a sliver). Wall-clock phase → continuous on reverse.
      // Amplitudes 0 ⇒ a clean "fully still" centerpiece. recT = 0 in the
      // corridor ⇒ no tilt and the slerp is identity (unchanged).
      const tSec = state.clock.elapsedTime;
      const ax =
        Math.sin((tSec / CENTER_DRIFT_PERIOD_X_S) * Math.PI * 2) * CENTER_DRIFT_AMP_X_RAD * recT;
      const ay =
        Math.sin((tSec / CENTER_DRIFT_PERIOD_Y_S) * Math.PI * 2) * CENTER_DRIFT_AMP_Y_RAD * recT;
      driftEulerScratch.current.set(ax, ay, 0, "XYZ");
      driftQuatScratch.current.setFromEuler(driftEulerScratch.current);
      group.quaternion.multiply(driftQuatScratch.current);
    } else {
      group.quaternion.identity();
    }

    group.visible = true;
    group.position.copy(posScratch.current);
    group.scale.setScalar(scale);

    // Keep the sim alive while the corridor is painting so the
    // pre-gateway low-ignite state actually swirls. We still pause
    // immediately when the stage disengages in the early return above.
    pausedRef.current = false;
  });

  return (
    <group ref={groupRef} visible={false}>
      <BrandmarkPhysicsCore
        count={count}
        corridorKeep={corridorKeep}
        igniteRef={igniteRef}
        depthRef={depthRef}
        glitchRef={glitchRef}
        streamRef={streamRef}
        cleanFieldRef={cleanFieldRef}
        seedAtHome
        opacityRef={opacityRef}
        pointSizeRef={pointSizeRef}
        color={color}
        accentColor={accentColor}
        pausedRef={pausedRef}
        reducedMotion={reducedMotion}
        // ── Production appearance (PRODUCTION_* constants above). These
        // are passed EXPLICITLY rather than relying on the component's
        // default props so the live corridor look can't drift if the lab
        // changes its own defaults. The default values reproduce today's
        // luminous-dust look (dome-fill + additive dot), so the corridor
        // and parked centerpiece are byte-identical until a preset is
        // deliberately promoted into PRODUCTION_*.
        basis={PRODUCTION_BASIS}
        gridSnap={PRODUCTION_GRID_SNAP}
        shape={PRODUCTION_SHAPE}
        glyph={PRODUCTION_GLYPH}
        blending={PRODUCTION_BLENDING}
        shapeStroke={PRODUCTION_SHAPE_STROKE}
        primitiveAspect={PRODUCTION_PRIMITIVE_ASPECT}
        lineJitter={PRODUCTION_LINE_JITTER}
      />
    </group>
  );
}
