"use client";

/**
 * BrandmarkPhysicsCoreActor — corridor-side wrapper around
 * `BrandmarkPhysicsCore` (ADR-023). Tracks the brandmark's world
 * position + half-extent every frame, drives the 2D → 3D MORPH from
 * the substrate-wrap gate, and bails out when the stage is
 * off-screen so the GPGPU sim doesn't burn cycles.
 *
 * The morph (rev. 2026-06-17, renderer-ownership pass 2026-06-24): the flat DOM
 * SVG brandmark and the particle core are the SAME mark. At the
 * substrate wrap start, this core covers early while the SVG drops below
 * the R3F canvas, then cuts out once the flat particle cover is established.
 * Only after that cut does this actor ramp `uDepth` from 0 → 1. The
 * particles never swirl — ignite is pinned to assembled and the sim is
 * `seedAtHome`, so the cloud is the brandmark from frame one.
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
 *     The half-extent comes from `getBrandmarkWrapHalfExtent`, the
 *     same helper used by the projected SVG, so the medium blend stays
 *     size-continuous while the mark grows into the wrapping sphere.
 */

import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useDeviceTier } from "@/lib/hooks/useDeviceTier";
import { smoothstep, smootherstep } from "@/lib/home-v2/corridorMap";
import { TENSOR_GOLD, TENSOR_ACCENT } from "@/lib/home-v2/goldPalette";
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
import { sampleBrandmark3D } from "@/lib/brandmark/sampleBrandmark3D";
import {
  rasterizeBrandmarkToWorldPositions,
  worldPositionsToLocal,
} from "@/lib/brandmark/sampleBrandmarkPixels";
import { brandmarkScreenRectRef } from "../brandmarkScreenRectRef";
import { CorridorArmillary } from "./CorridorArmillary";
import { UNIFIED_SERVICES_ARMILLARY } from "../unifiedServicesInstrument";
import { useHologramConnectors } from "@/lib/stores/hologramConnectorStore";
import { SERVICES } from "@/components/landing/home-v2/services/serviceData";
import { getServicePose } from "@/lib/home-v2/servicePose";
import { getSmoothedDissipate, getSmoothedEpilogueProgress } from "./motionFollower";
import {
  BRANDMARK_CORE_BLEND_END,
  BRANDMARK_CORE_DEPTH_END_BLEND,
  BRANDMARK_CORE_DEPTH_START_BLEND,
  BRANDMARK_CORE_HANDOFF_PROGRESS,
  BRANDMARK_CORE_POST_COVER_GATE_END,
  BRANDMARK_CORE_POST_COVER_GATE_START,
  getBrandmarkCoreBlend,
  getBrandmarkWrapHalfExtent,
  getBrandmarkWorldPosition,
} from "./sceneGeom";

/** Shared GLB path — the same volumetric brandmark the #services hologram
 *  renders (VolumetricBrandmarkArtifact). `useGLTF.preload(BRANDMARK_GLB)`
 *  is invoked there, so the corridor consumer hits the loader's cache. */
const BRANDMARK_GLB = "/models/brandmark/brandmark.glb";

/** Ignite is pinned to "assembled" for the corridor. The mark is the
 *  SAME brandmark end-to-end — it must never assemble from a visible
 *  swirl (the morph is a flat → 3D EXTRUDE, not a scatter → gather).
 *  Combined with `seedAtHome` on `BrandmarkPhysicsCore`, the cloud IS
 *  the brandmark silhouette from the first visible frame. */
const ASSEMBLED_IGNITE = 1;

/** Keep the handoff glitch subordinate to the wrap blend. It gives the
 *  dithered particles a small resolving texture without reading as a
 *  hard digital break between the SVG and the 3D core. */
const HANDOFF_GLITCH_INTENSITY = 0.35;

/** SVG to particle renderer-ownership curve (2026-06-24).
 *  The handoff timing still comes from getBrandmarkCoreBlend(progress),
 *  but the media no longer use an opacity dissolve. The flat particle
 *  silhouette reaches full cover early, the DOM SVG cuts out under that
 *  cover, and only then does the core extrude into depth. */

/** The 3D particle core's brightness + speck size. `CORE_OPACITY` is
 *  held bright/solid so the flat silhouette reads densely as it blends
 *  over the crisp SVG — no "stippled vs vector" mismatch at the swap.
 *  Speck size grows slightly as the mark
 *  extrudes into the luminous 3D body nested inside the substrate
 *  sphere (where it must read against the gimbal shell's dots).
 *
 *  Corridor calm-down (2026-06-22b): lowered 0.95 → 0.72 because the corridor
 *  read TOO BRIGHT (additive bloom). 2026-06-24 async-flow follow-up raises it
 *  slightly again: once the SVG is gone and the mark is particle-native, the
 *  in-sphere core needs more presence so the depth-flow doesn't visually drop
 *  out right as the armillary wraps around it.
 *  This is the CORRIDOR brightness only — the Services centerpiece has its own
 *  absolute `CENTER_OPACITY` (decoupled), so lowering this never drags the
 *  centerpiece with it. Lower further to dim the corridor. */
const CORE_OPACITY = 0.84;
// Single-painter morph (2026-06-24): the FLAT resting mark must read as a
// SOLID, near-pixel-perfect silhouette (it replaces the crisp SVG), so the
// flat dots are LARGER to close the inter-particle gaps (lab-verified ~5px +
// full count reads solid; 2-3px reads as sparse dust). As the mark gains depth
// and disperses into the sphere the dots relax to the established luminous-body
// size. So size now goes flat(big/solid) → 3D(smaller/dust), the inverse of the
// prior 3→4 ramp. Paired with the shader's depth-tied `depthKeep` density.
const CORE_POINT_SIZE_FLAT = 5.0;
const CORE_POINT_SIZE_3D = 4.45;

/** Corridor brandmark palette (ADR-023 — unified Tensor gold, 2026-06-25
 *  harmonization follow-up).
 *
 *  The ENTIRE corridor journey now reads in one continuous Tensor gold:
 *  the 2D rest SVG (`ProjectedBrandmarkActor` paints `BrandmarkGlyph` with
 *  `TENSOR_GOLD`), the matched-pixel particle flight (FLAT palette below),
 *  and the landed in-sphere wireframe + #services hologram + orbits (LANDED
 *  palette) are all `TENSOR_*`. The matched-pixel SVG → particle handoff
 *  stays color-seamless because the SVG fill and the particle FLAT color are
 *  the same Tensor gold; the `vWireCrisp` body/accent lerp (`uColor →
 *  uLandedColor` as uDepth → 1) is now an identity no-op on color (its
 *  crisp / size / stillness effects still apply). This removes the earlier
 *  orange interlude where the rest mark + flight sat on the brand gold
 *  `#caa554` and only shifted to yellow at the very end of the dive. */
const FLAT_WIRE_COLOR = TENSOR_GOLD;
const FLAT_WIRE_ACCENT = TENSOR_ACCENT;
const LANDED_WIRE_COLOR = TENSOR_GOLD;
const LANDED_WIRE_ACCENT = TENSOR_ACCENT;

/** PIN the GPGPU sim for the corridor brandmark (2026-06-25 "never warp" fix).
 *  The matched-pixel mark + wireframe target must hold their EXACT shape — the
 *  brandmark may never warp/wobble. The sim's curl-flow + turbulence (even at
 *  the small IGNITE_ON values) animate a coherent swirl that visibly distorts
 *  the matched-pixel grid over time. Zeroing them — while `returnStrength`
 *  stays full (from IGNITE_ON_FORCES) — pins every particle dead-still at its
 *  home, so the SHAPE is pristine. The wind-blown 2D→3D transition is driven
 *  by the VERTEX shader (off the pinned home), not the sim, so the morph is
 *  unaffected. Per-particle brightness "life" (twinkle/pulse) is fragment-only
 *  and never moves a particle, so it stays without warping the shape. */
const PINNED_CORRIDOR_FORCES = { on: { flowStrength: 0, turbulence: 0 } } as const;

/** Target number of particles DRAWN in the corridor (Navigate / Encode /
 *  sphere). The global count is large (6000) to feed a dense parked centerpiece;
 *  the corridor thins back to this via `corridorKeep` so it stays calm.
 *  Raising the global count adds centerpiece density without touching the
 *  corridor (the keep auto-recomputes).
 *
 *  `2600` (was `1600`, 2026-06-25 de-pixelate): at 1600 the landed in-sphere
 *  wireframe (uDepth → 1, keep ≈ 0.27) drew only ~1620 of 6000 particles —
 *  too sparse, so the strokes read as gappy/pixelated dots. 2600 (keep ≈ 0.43,
 *  ~2600 drawn) closes the gaps so the wireframe reads continuous. The airy
 *  #services centerpiece is gated by a SEPARATE `uCleanFieldKeep`, so it is
 *  unchanged. */
const CORRIDOR_DRAW_TARGET = 2600;

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
 *  Current look (2026-06-24, "mark leads" pass): `dome-fill` basis +
 *  `dot` shape + additive blending — the legacy luminous-dust look,
 *  RESTORED from the 2026-06-22 `edge-lattice` + `voxel` "Dither 3" preset.
 *  Rationale: the SVG → core handoff is a MORPH that must keep the mark
 *  legible (ADR-023 Invariant 3 + 12). `dome-fill` samples the FILLED
 *  brandmark paths, so the flat particle silhouette matches the SVG paint
 *  (fill → fill) and the cut is invisible. The `edge-lattice`/`voxel`
 *  preset collapsed the mark to a sparse grid of cells: on its own (once
 *  the SVG cuts) the bare core read as a faint radial dust-burst, NOT the
 *  crosshair — so the medium swap looked like the mark dissolving into a
 *  different object instead of gaining depth. (The voxel look only ever
 *  held together because the SVG covered the core until the substrate
 *  sphere arrived to supply structure; the "mark leads" re-timing exposed
 *  it.) The Services centerpiece therefore returns to luminous dust too —
 *  if a dithered/raster centerpiece is wanted again, drive it via the
 *  per-frame `uShape` mask at the centerpiece (recT) rather than the
 *  mount-time `basis`, so the corridor morph stays fill → fill. */
const PRODUCTION_BASIS: BrandmarkBasis = "dome-fill";
const PRODUCTION_SHAPE: BrandmarkCoreShape = "dot";
const PRODUCTION_GLYPH: BrandmarkCoreGlyph = "plus";
// NORMAL blending (2026-06-25 "too saturated" fix). The dense matched-pixel
// flat mark draws all ~6000 dots at once; under ADDITIVE they ACCUMULATE and
// clip toward a vivid yellow-orange no matter how the alpha is trimmed — the
// mark read over-saturated and hotter than the SVG it replaces. NORMAL
// blending does not accumulate, so overlapping opaque dots settle at the
// TRUE Tensor gold (`#c2af4c`, matching the SVG paint exactly → a perfect
// handoff) and the landed wireframe sits at that same muted Services gold.
// Bonus: it matches the #services hologram, which is also normal-blend, so the
// corridor → Services read is consistent end-to-end. (Was `additive` for the
// legacy luminous-dust look — superseded; the clean faithful shape + on-brand
// gold wins.)
const PRODUCTION_BLENDING: BrandmarkCoreBlending = "normal";
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
const PRODUCTION_CORRIDOR_KEEP: number | null = null;

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

/** Pointer-look amplitude (radians) for the parked UNIFIED instrument — the whole
 *  mark + armillary nudge toward the cursor (ported from ServicesHologramScene so
 *  the in-corridor #services instrument is explorable like the old hologram).
 *  Composes on top of the billboard + gentle drift. Engaged only when parked
 *  (recT high); eases to 0 during the fly-in / dive and on reverse-scroll. */
const POINTER_LOOK_AMP = 0.12;

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
const CENTER_OPACITY = 1.0;

/** Corridor → services baton-pass (2026-06-24): the centerpiece dome fades OUT
 *  across this short, late dissipate window as the `#services` wireframe forms
 *  in over the same screen region. Gated so `dissipate = 0` in the corridor
 *  proper keeps `handoffFade = 1` (byte-identical; ADR-023 Invariant 11). */
const HANDOFF_FADE_START = 0.45;
const HANDOFF_FADE_END = 0.7;

/** Z-stream momentum (retired 2026-06-25 hybrid revision). The wind-blown
 *  morph in the vertex shader subsumes the legacy uStream momentum — the
 *  actor pins streamRef to 0 so the in-shader uStream block is a no-op
 *  while the wind-flow drives the recede. Kept here for legacy reference;
 *  see ADR-023 § 2026-06-25 hybrid revision. */

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
  color = FLAT_WIRE_COLOR,
  accentColor = FLAT_WIRE_ACCENT,
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
  // Pointer-look group: wraps the mark + the (unified) armillary so the whole
  // instrument tilts toward the cursor as ONE object when parked in #services.
  const pointerLookRef = useRef<THREE.Group>(null);
  const pointerTargetRef = useRef({ pitch: 0, yaw: 0 });
  const pointerDampRef = useRef({ pitch: 0, yaw: 0 });
  // Per-service settle: as the scan UI advances the active service, the whole
  // rig (mark + armillary) damps to a distinct BOUNDED pose so each reveal
  // reads as a turn. Target is set from the store-bridged active service; the
  // damp eases to 0 when not parked so the corridor proper stays byte-identical
  // (ADR-023 Invariant 11). See lib/home-v2/servicePose.ts.
  const servicePoseTargetRef = useRef({ pitch: 0, yaw: 0 });
  const servicePoseDampRef = useRef({ pitch: 0, yaw: 0 });
  const activeServiceId = useHologramConnectors((s) => s.activeServiceId);
  useEffect(() => {
    const idx = SERVICES.findIndex((s) => s.id === activeServiceId);
    const pose = getServicePose(Math.max(0, idx), SERVICES.length);
    servicePoseTargetRef.current.pitch = pose.pitch;
    servicePoseTargetRef.current.yaw = pose.yaw;
  }, [activeServiceId]);
  // Scratch for the Services core-shrink (camera-front re-centre) so we
  // don't allocate per frame.
  const fwdScratch = useRef(new THREE.Vector3());
  const frontScratch = useRef(new THREE.Vector3());
  const posScratch = useRef(new THREE.Vector3());
  // Scratch for the centerpiece gentle-drift tilt (avoid per-frame allocs).
  const driftQuatScratch = useRef(new THREE.Quaternion());
  const driftEulerScratch = useRef(new THREE.Euler());
  // ADR-023 2026-06-25 hybrid — matched-pixel handoff state.
  // `seedFromPositions` is React state so changing it re-renders
  // `BrandmarkPhysicsCore`, which then fires its reseed effect against
  // the new buffer. `lastBelowHandoff` tracks edge-crossing of
  // `BRANDMARK_CORE_HANDOFF_PROGRESS` so the rasterise + setState fires
  // EXACTLY ONCE per swap (forward only — reverse-scroll re-entry
  // re-rasterises against the camera state at re-entry).
  const [seedFromPositions, setSeedFromPositions] = useState<Float32Array | null>(null);
  const lastBelowHandoff = useRef(true);
  const igniteRef = useRef(ASSEMBLED_IGNITE);
  const depthRef = useRef(0);
  // Cover-in morph (ADR-023 morph rev.): 0 = particles collapsed at the rect
  // centre, 1 = particles at full home positions. Drives the SVG → particle
  // handoff as a geometric inflation rather than an opacity dissolve. The
  // shader applies a second smoothstep over [0, 0.6] internally, so this
  // ref carries the pre-easing JS clock from `getBrandmarkCoverMorph`.
  const coverMorphRef = useRef(0);
  const glitchRef = useRef(0);
  const streamRef = useRef(0);
  // Clean-field dial: 0 = luminous dust (corridor/sphere), 1 = uniform crisp
  // field (Services centerpiece). Driven from the shrink progress so the
  // mark cleans up exactly as it settles into #services (see shaders).
  const cleanFieldRef = useRef(0);
  const opacityRef = useRef(0);
  const pointSizeRef = useRef(CORE_POINT_SIZE_FLAT);
  const pausedRef = useRef(true);

  // Pointer-look listener for the parked unified instrument (window-level: the
  // canvas is pointer-events:none, so R3F's own pointer never fires here).
  useEffect(() => {
    if (!UNIFIED_SERVICES_ARMILLARY) return;
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1; // -1..1
      const ny = (e.clientY / window.innerHeight) * 2 - 1; // -1..1
      pointerTargetRef.current.pitch = -ny * POINTER_LOOK_AMP * 0.6;
      pointerTargetRef.current.yaw = nx * POINTER_LOOK_AMP;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

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

    // ── ADR-023 2026-06-25 hybrid: matched-pixel swap detection ─────
    // The SVG owns the visible mark while progress < HANDOFF_PROGRESS.
    // The instant progress crosses the threshold from below, rasterise
    // the SVG's live screen rect into world positions that reproject
    // back to those exact pixels, convert to the brandmark group's
    // local space, and hand off to the GPGPU sim via setState (which
    // triggers BrandmarkPhysicsCore's reseed effect). The eye sees no
    // swap because the particles ARE the SVG at the next frame.
    //
    // Reverse-scroll: when progress falls below HANDOFF again, reset
    // `lastBelowHandoff` so a later forward pass re-rasterises against
    // the camera state at re-entry.
    const aboveHandoff = progress >= BRANDMARK_CORE_HANDOFF_PROGRESS;
    if (aboveHandoff && lastBelowHandoff.current) {
      const rectRef = brandmarkScreenRectRef.current;
      if (rectRef.valid && group) {
        // Group must be at its swap-frame world position BEFORE we
        // worldToLocal — otherwise the local positions are wrong.
        // Position/scale below this block in the same frame will move
        // the group, but we read the group's CURRENT (last-frame's)
        // transform here. The SVG actor's tracker runs ahead of this
        // useFrame on the same tick, so `screenRectRef` was just
        // written for THIS frame at THIS camera; placing the group at
        // the swap-frame world pos here keeps everything coherent.
        group.position.set(bx, by, bz);
        const half = getBrandmarkWrapHalfExtent(progress);
        const sphereScale = half * 2 * getEpiloguePlanetScale(getSmoothedEpilogueProgress());
        group.scale.setScalar(sphereScale);
        group.updateMatrixWorld(true);
        const world = rasterizeBrandmarkToWorldPositions({
          rect: rectRef,
          camera: state.camera,
          worldZ: bz,
          viewport: { width: state.size.width, height: state.size.height },
          maxCount: count,
        });
        if (world.count > 0) {
          const local = worldPositionsToLocal(world.positions, world.count, group);
          // Fill all `count` slots. Earlier draft padded the tail with
          // zeros — those orphaned particles seed at the brandmark group
          // origin and read as bright "photons stuck in the middle" of
          // the landed wireframe inside the substrate sphere (user
          // report, 2026-06-25). Wrap the available matched-pixel
          // positions so every particle starts on the SVG silhouette
          // and migrates to its `aTarget3D` wireframe home — no orphans
          // at the centre, just a slightly denser duplicate-stipple of
          // the silhouette (visually indistinguishable, count-honest).
          let padded: Float32Array;
          if (world.count >= count) {
            padded = local;
          } else {
            padded = new Float32Array(count * 3);
            for (let i = 0; i < count; i++) {
              const j = (i % world.count) * 3;
              padded[i * 3] = local[j];
              padded[i * 3 + 1] = local[j + 1];
              padded[i * 3 + 2] = local[j + 2];
            }
          }
          setSeedFromPositions(padded);
        }
      }
      lastBelowHandoff.current = false;
    } else if (!aboveHandoff && !lastBelowHandoff.current) {
      lastBelowHandoff.current = true;
    }

    // ── Services core-shrink (2026-06-20) ────────────────────────────
    // As the user scrolls into #services the dissipate clock ramps 0→1.
    // The core (which fills the sphere at "everyone is racing") shrinks
    // down to a small centred centerpiece and stays the one mark. `recT`
    // is the eased shrink/re-centre progress; 0 = sphere-fill (no change
    // from today), 1 = parked centerpiece. Held at 1 through the services
    // ambient hold (the motion follower pins dissipate at 1).
    const dissipate = t.docked || t.servicesAmbient ? getSmoothedDissipate() : 0;
    const recT = smootherstep(SHRINK_START, SHRINK_END, dissipate);

    // ── SVG → particle MORPH (ADR-023 morph rev., 2026-06-24 cover-in pass) ──
    // Three coupled clocks, all derived from `getBrandmarkCoreBlend(progress)`
    // (the shared 0..1 wrap clock anchored at substrate.start → substrate.peakAt):
    //
    //   1. coverMorph — particles inflate from the rect centre to full home
    //      positions. The shader's `uCoverMorph` reads this; alpha is gated
    //      on the SAME inflation factor (no separate opacity reveal). The
    //      DOM SVG (`ProjectedBrandmarkActor`) fades to 0 over coverMorph
    //      ∈ [0, COVER_HANDOFF_END=0.55] and is `display:none`-cut at
    //      cover completion, so the visible mark at every frame equals the
    //      sum of (fading SVG + inflating particles) — a geometric morph,
    //      not a cross-dissolve.
    //   2. depth — flat 2D silhouette → 3D dome via `uDepth`. Starts AT
    //      the SVG cut (DEPTH_START_BLEND === SVG_CUT_BLEND) and completes
    //      at the wrap peak. Decoupled from the cover-in so the SEQUENCE
    //      reads as: inflate XY → cut SVG → extrude Z. The mark never
    //      simultaneously inflates AND extrudes (which would muddle the
    //      morph into a generic "3D thing growing" read).
    //   3. post-cover gate — stream + glitch dust effects gate ON only
    //      after coverMorph crosses the post-cover threshold, so the
    //      "comet tail" + "scanline tear" never play while the SVG is
    //      still partly visible (those effects would otherwise read as
    //      the SVG mark breaking apart instead of the particles resolving).
    //
    // Ignite is pinned assembled and the sim is `seedAtHome`, so the cloud
    // is the brandmark from frame one — particles never swirl or scatter.
    const handoffProgress = BRANDMARK_CORE_HANDOFF_PROGRESS;
    const handoffBlend = getBrandmarkCoreBlend(progress);
    // Depth ramp = FRONT-LOADED ease-out (2026-06-25 "elegant transition" pass,
    // replacing smootherstep). smootherstep was flat at BOTH ends, so just after
    // the SVG cut the mark dwelled as a flat, grainy 2D crosshair (the "orange-y
    // 2D stage" that killed the flow) before any depth appeared. Ease-out
    // (1-(1-t)^2) has a moderate slope at t=0 — depth is still 0 at the exact
    // cut frame (seamless matched-pixel handoff) but rises promptly after, so
    // the mark peels into the luminous 3D fly-in right away instead of lingering
    // flat. It still reaches depth=1 with zero slope exactly at the wrap peak
    // (t=1), so the wireframe settles smoothly, in sync with the substrate sphere.
    const depthSpan = BRANDMARK_CORE_DEPTH_END_BLEND - BRANDMARK_CORE_DEPTH_START_BLEND;
    const depthT =
      depthSpan > 1e-6
        ? Math.min(1, Math.max(0, (handoffBlend - BRANDMARK_CORE_DEPTH_START_BLEND) / depthSpan))
        : handoffBlend >= BRANDMARK_CORE_DEPTH_END_BLEND
          ? 1
          : 0;
    const depth = 1 - (1 - depthT) * (1 - depthT);

    // Stream + glitch are eased in with the asynchronous particle flow so the
    // extra depth motion joins after the flat mark starts peeling apart.
    const postCoverGate = smoothstep(
      BRANDMARK_CORE_POST_COVER_GATE_START,
      BRANDMARK_CORE_POST_COVER_GATE_END,
      depth
    );

    // Subtle matrix-glitch bell. Bounded inside the wrap blend AND gated by
    // the post-cover ramp so the scanline tear only plays once the particle
    // silhouette has taken over from the SVG. Keeps the bell's sin() shape
    // so the effect still rises and falls inside the gated window.
    let glitch = 0;
    if (progress > handoffProgress && progress < BRANDMARK_CORE_BLEND_END) {
      const t =
        (progress - handoffProgress) / Math.max(1e-6, BRANDMARK_CORE_BLEND_END - handoffProgress);
      glitch = HANDOFF_GLITCH_INTENSITY * Math.sin(t * Math.PI) * postCoverGate;
    }

    // ── Z-stream retired (2026-06-25 hybrid revision) ──────────────
    // The wind-blown morph in the vertex shader handles recession now.
    // Pin streamRef to 0 so the in-shader uStream block stays a no-op.
    streamRef.current = 0;

    igniteRef.current = ASSEMBLED_IGNITE;
    // Keep the forward 3D dome at the parked Services centerpiece (do NOT
    // flatten). `depth` is already 1 well before the shrink begins, so this
    // holds the baked dome (bulge / thickness) — the mark reads as a
    // dimensional 3D object in #services, and the gentle drift below reveals
    // that volume. (Was `depth * (1 - recT)`, which collapsed it to a flat
    // billboard at the centerpiece.) Z-only, so the XY silhouette is preserved.
    depthRef.current = depth;
    // Cover-morph clock: 0 = particles collapsed at rect centre, 1 = full
    // home positions. Saturates at 1 well before the depth ramp begins, so
    // the parked corridor / sphere / centerpiece states see coverMorph = 1
    // (byte-identical to the pre-change render at those frames).
    // Single-painter morph (debug-confirmed 2026-06-24): the particle core IS
    // the corridor mark end-to-end, so it ALWAYS paints the full silhouette
    // (coverMorph = 1). The transition lives entirely in `depth`: each particle
    // peels asynchronously/asymmetrically into its domed in-sphere position.
    coverMorphRef.current = 1;
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
    // Core-shrink handoff (2026-06-20): the core IS the brandmark through the
    // dock — it shrinks to the centred centerpiece. Baton-pass (2026-06-24): the
    // `#services` WIREFRAME hologram now forms over the SAME screen region and
    // takes the foreground, so the dome hands off by fading OUT across a short
    // late window of the dissipate. `dissipate = 0` in the corridor proper →
    // `handoffFade = 1` (byte-identical; ADR-023 Invariant 11). An invisible
    // matched hand-off — the services dome-state is already present at the same
    // size + gold — NOT a cross-dissolve. The ambient shell haze still comes
    // from `mats.particle` in `ShellSubstrateGyro`.
    // Unified instrument (2026-06-25): the core IS the #services centerpiece, so
    // it does NOT fade out at the dive. It holds full through the dock + the
    // services ambient hold, then fades only as #continuum approaches (the
    // `servicesAmbientLevel` envelope from useCorridorExitScroll). With the flag
    // OFF, the legacy baton-pass fade (corridor core out → #services canvas in)
    // is restored. Either way `dissipate = 0` in the corridor proper → fade = 1
    // (byte-identical; ADR-023 Invariant 11).
    const handoffFade = UNIFIED_SERVICES_ARMILLARY
      ? t.docked
        ? 1
        : t.servicesAmbient
          ? t.servicesAmbientLevel
          : 1
      : 1 - smootherstep(HANDOFF_FADE_START, HANDOFF_FADE_END, dissipate);

    // Centerpiece opacity is DECOUPLED from the corridor CORE_OPACITY: it lerps
    // from the corridor brightness to an ABSOLUTE target (CENTER_OPACITY) as the
    // mark parks, so dialing the corridor brightness never drags the centerpiece
    // with it. recT = 0 in the corridor → parkedOpacity = CORE_OPACITY (the
    // corridor is byte-identical).
    const parkedOpacity = CORE_OPACITY + (CENTER_OPACITY - CORE_OPACITY) * recT;

    // Hybrid SVG-rest + matched-pixel handoff visibility (ADR-023, 2026-06-25):
    //   - ARMED pre-pin OR corridor before handoff (`progress < HANDOFF`):
    //     particles invisible. The DOM SVG owns the visible mark there.
    //   - Corridor at or past handoff: particles full opacity. The SVG just
    //     cut to display:none in the same frame the swap seeded the sim
    //     with matched-pixel positions, so the visible mark IS the particle
    //     field from this frame onward.
    //   - Epilogue / dock: particle-owned (unchanged) — handoffFade drives
    //     the centerpiece taper to the Services wireframe.
    const armedOnly = t.armed && !t.active;
    const inEpilogueOrDock = t.docked || t.servicesAmbient || t.epilogueProgress > 1e-3;
    const inSvgRest = !inEpilogueOrDock && progress < BRANDMARK_CORE_HANDOFF_PROGRESS;
    opacityRef.current = armedOnly || inSvgRest ? 0 : parkedOpacity * handoffFade;
    // Crisp small specks for the flat silhouette → slightly larger
    // specks for the luminous 3D body, riding the depth extrude.
    pointSizeRef.current =
      CORE_POINT_SIZE_FLAT + (CORE_POINT_SIZE_3D - CORE_POINT_SIZE_FLAT) * depth;

    // Size: shared with the projected SVG so the medium blend is
    // size-continuous. The 2D mark starts growing during the early
    // fly-in, the renderer switches at the substrate wrap, and the
    // merged mark lands at sphere scale by the wrap peak.
    const half = getBrandmarkWrapHalfExtent(progress);
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

    // Pointer-look (unified instrument): nudge the whole mark + armillary toward
    // the cursor, engaged only when parked (recT high) so the fly-in / dive plays
    // clean and reverse-scroll eases it home. Composes under the group's billboard
    // + drift. recT ≈ 0 in the corridor ⇒ damps to identity (byte-identical).
    const pl = pointerLookRef.current;
    if (pl) {
      const engaged = UNIFIED_SERVICES_ARMILLARY && recT > 0.9;
      const k = Math.min(1, delta * 4);

      // Pointer-look channel — nudge toward the cursor when parked.
      const tgtPitch = engaged ? pointerTargetRef.current.pitch : 0;
      const tgtYaw = engaged ? pointerTargetRef.current.yaw : 0;
      const damp = pointerDampRef.current;
      damp.pitch += (tgtPitch - damp.pitch) * k;
      damp.yaw += (tgtYaw - damp.yaw) * k;

      // Per-service settle channel — hold a distinct bounded pose per active
      // service; eases to frontal when not parked so the dive/corridor are
      // unaffected. Composes additively under the billboard + gentle drift.
      const poseTgtPitch = engaged ? servicePoseTargetRef.current.pitch : 0;
      const poseTgtYaw = engaged ? servicePoseTargetRef.current.yaw : 0;
      const pose = servicePoseDampRef.current;
      pose.pitch += (poseTgtPitch - pose.pitch) * k;
      pose.yaw += (poseTgtYaw - pose.yaw) * k;

      pl.rotation.set(damp.pitch + pose.pitch, damp.yaw + pose.yaw, 0);
    }

    // Keep the sim alive while the corridor is painting so the
    // pre-gateway low-ignite state actually swirls. We still pause
    // immediately when the stage disengages in the early return above.
    pausedRef.current = false;
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Pointer-look wrapper: the mark + the (unified) armillary tilt toward the
          cursor as ONE anchored object when parked in #services. */}
      <group ref={pointerLookRef}>
        {/* ADR-023 2026-06-25 hybrid: the GLB-loading inner component
          suspends until brandmark.glb resolves. The fallback is `null`
          so the rest of the scene keeps painting; the DOM SVG owns the
          visible mark until the GLB lands and the particles take over
          at the swap frame. The GLB is preloaded by
          VolumetricBrandmarkArtifact (services hologram), so this is
          usually a synchronous cache hit. */}
        <Suspense fallback={null}>
          <BrandmarkPhysicsCoreWithGLB
            count={count}
            corridorKeep={corridorKeep}
            igniteRef={igniteRef}
            depthRef={depthRef}
            coverMorphRef={coverMorphRef}
            glitchRef={glitchRef}
            streamRef={streamRef}
            cleanFieldRef={cleanFieldRef}
            opacityRef={opacityRef}
            pointSizeRef={pointSizeRef}
            color={color}
            accentColor={accentColor}
            landedColor={LANDED_WIRE_COLOR}
            landedAccent={LANDED_WIRE_ACCENT}
            pausedRef={pausedRef}
            reducedMotion={reducedMotion}
            seedFromPositions={seedFromPositions}
          />
        </Suspense>
        {/* Unified #services armillary — the orbit rings wrap the parked core in
          the SAME canvas so they depth-interleave (near arcs in front, far arcs
          behind) and move as one instrument. Gated by the flag; the standalone
          ServicesHologramScene remains the lab harness. */}
        {UNIFIED_SERVICES_ARMILLARY ? <CorridorArmillary /> : null}
      </group>
    </group>
  );
}

/** GLB-loading inner: loads `brandmark.glb` (suspends until ready),
 *  samples the volumetric wireframe via `sampleBrandmark3D`, and forwards
 *  the `armHomes` as `targetHomes` to `BrandmarkPhysicsCore`. Split out
 *  so the outer actor's `useFrame` (which writes refs every tick) doesn't
 *  re-mount under suspense — only this leaf does. ADR-023 2026-06-25
 *  hybrid revision. */
interface BrandmarkPhysicsCoreWithGLBProps {
  count: number;
  corridorKeep: number;
  igniteRef: { readonly current: number };
  depthRef: { readonly current: number };
  coverMorphRef: { readonly current: number };
  glitchRef: { readonly current: number };
  streamRef: { readonly current: number };
  cleanFieldRef: { readonly current: number };
  opacityRef: { readonly current: number };
  pointSizeRef: { readonly current: number };
  color: string;
  accentColor: string;
  landedColor: string;
  landedAccent: string;
  pausedRef: { readonly current: boolean };
  reducedMotion: boolean;
  seedFromPositions: Float32Array | null;
}

function BrandmarkPhysicsCoreWithGLB({
  count,
  corridorKeep,
  igniteRef,
  depthRef,
  coverMorphRef,
  glitchRef,
  streamRef,
  cleanFieldRef,
  opacityRef,
  pointSizeRef,
  color,
  accentColor,
  landedColor,
  landedAccent,
  pausedRef,
  reducedMotion,
  seedFromPositions,
}: BrandmarkPhysicsCoreWithGLBProps) {
  // useGLTF suspends until the asset is ready. Shared cache with
  // VolumetricBrandmarkArtifact (services hologram), which preloads the
  // GLB — so the corridor consumer is almost always a cache hit.
  const { scene } = useGLTF(BRANDMARK_GLB);

  // Sample the GLB into wire-only home positions. wireCount = `count`
  // (the sim's particle count) so the pairing is 1:1 — every sim
  // particle has a wireframe destination. surfaceCount / shellCount = 0:
  // the corridor's destination is the wireframe edges ONLY (the user's
  // brief: "land inside the position of our 3D brandmark" — the
  // volumetric wireframe is THE 3D brandmark, not a surrounding shell).
  const targetHomes = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    scene.updateMatrixWorld(true);
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.geometry) return;
      const clone = mesh.geometry.clone();
      clone.applyMatrix4(mesh.matrixWorld);
      geos.push(clone);
    });
    if (geos.length === 0) return null;
    const sample = sampleBrandmark3D(geos, {
      wireCount: count,
      surfaceCount: 0,
      shellCount: 0,
      depthStrutCount: 0,
      // 2026-06-25 unification: lowered 18 → 5 to match the (now-retired)
      // #services centerpiece's finer seams, so the parked mark reads as the
      // richer wireframe the user liked. This also enriches the in-flight
      // corridor wireframe (a deliberate, reviewed look change vs Invariant 11).
      edgeThresholdDeg: 5,
    });
    geos.forEach((g) => g.dispose());
    if (sample.count === 0) return null;
    const arm = sample.armHomes;

    // ── Normalise the wireframe to the flat silhouette's footprint ──
    // sampleBrandmark3D bakes MARK_SCALE = 1.74 (sized for the #services
    // ORBIT footprint), so its armHomes span a half-extent of ~0.87 —
    // 1.74× the [-0.5, 0.5] cube the flat matched-pixel silhouette lives
    // in. Left unscaled the landed 3D mark renders BIGGER than the
    // substrate sphere (user report, 2026-06-25). Measure the wireframe's
    // own XY half-extent and rescale uniformly so the furthest point maps
    // to TARGET_HALF — matching the silhouette, so the morph is in-place
    // (the 2D mark becomes the 3D version of ITSELF at the same size) and
    // the result nests inside the sphere exactly as the old dome-fill did.
    let maxAbs = 1e-6;
    for (let i = 0; i < sample.count; i++) {
      const ax = Math.abs(arm[i * 3]);
      const ay = Math.abs(arm[i * 3 + 1]);
      if (ax > maxAbs) maxAbs = ax;
      if (ay > maxAbs) maxAbs = ay;
    }
    // 0.5 = the group's full half-extent, which by design equals the
    // substrate sphere's apparent radius (`getBrandmarkSphereMatchHalfExtent`
    // → local 0.5 == sphere dotted-shell radius). So the wireframe's furthest
    // points reach the sphere edge — the brandmark's edges ALIGN with the
    // sphere's edges (user request, 2026-06-25) rather than nesting small
    // inside it. Tunable: lower for margin, raise to overshoot the cage.
    const TARGET_HALF = 0.5;
    const k = TARGET_HALF / maxAbs;

    // Fill all `count` slots, WRAPPING the wireframe samples rather than
    // zero-padding the tail. Zero-padding sent surplus particles to the
    // group origin, where they piled up as bright "photons stuck in the
    // middle" of the landed mark (user report, 2026-06-25). Wrapping
    // gives every particle a real wireframe target — a slightly denser
    // duplicate-stipple of the edges, visually indistinguishable.
    const result = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const j = (i % sample.count) * 3;
      result[i * 3] = arm[j] * k;
      result[i * 3 + 1] = arm[j + 1] * k;
      result[i * 3 + 2] = arm[j + 2] * k;
    }
    return result;
  }, [scene, count]);

  return (
    <BrandmarkPhysicsCore
      count={count}
      corridorKeep={corridorKeep}
      igniteRef={igniteRef}
      depthRef={depthRef}
      coverMorphRef={coverMorphRef}
      glitchRef={glitchRef}
      streamRef={streamRef}
      cleanFieldRef={cleanFieldRef}
      seedAtHome
      seedFromPositions={seedFromPositions}
      targetHomes={targetHomes}
      forces={PINNED_CORRIDOR_FORCES}
      opacityRef={opacityRef}
      pointSizeRef={pointSizeRef}
      color={color}
      accentColor={accentColor}
      landedColor={landedColor}
      landedAccent={landedAccent}
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
  );
}

useGLTF.preload(BRANDMARK_GLB);
