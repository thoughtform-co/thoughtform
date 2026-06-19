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
import {
  dissipateInteriorOpacityMultiplier,
  getEpiloguePlanetScale,
} from "@/lib/home-v2/epilogueTimeline";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import {
  BrandmarkPhysicsCore,
  BRANDMARK_PHYSICS_CORE_COUNT_DESKTOP,
  BRANDMARK_PHYSICS_CORE_COUNT_MOBILE,
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
 *  sphere (where it must read against the gimbal shell's dots). */
const CORE_OPACITY = 0.95;
const CORE_POINT_SIZE_FLAT = 3.0;
const CORE_POINT_SIZE_3D = 4.0;

/** Opacity floor for the in-canvas core during dock / dissipate. The
 *  DOM SVG (`ProjectedBrandmarkActor`) owns the readable mark while the
 *  visitor enters Services, so the core can't sit at full brightness
 *  (it would paint a duplicate silhouette over the welded SVG). But
 *  hiding it entirely (the previous `handoffFade = t.docked ? 0 : 1`
 *  hard-cut) reads as the interior of the sphere going empty just as
 *  the camera flies into it. Holding the core at this low fraction of
 *  `CORE_OPACITY` keeps a soft particulate hint inside the volume —
 *  the narrative is "we have entered the sphere", and that should
 *  show as muted texture in the background, not as a visible foreground
 *  mark. */
const CORE_DOCKED_OPACITY_FLOOR = 0.12;

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

  const groupRef = useRef<THREE.Group>(null);
  const igniteRef = useRef(ASSEMBLED_IGNITE);
  const depthRef = useRef(0);
  const glitchRef = useRef(0);
  const streamRef = useRef(0);
  const opacityRef = useRef(0);
  const pointSizeRef = useRef(CORE_POINT_SIZE_FLAT);
  const pausedRef = useRef(true);

  // Drive the per-frame transform (position, scale, visibility) AND
  // the in-component refs that read into `BrandmarkPhysicsCore` props
  // on the next render. Position + scale don't need React; they're
  // imperative writes on the group.
  useFrame((_state, delta) => {
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
    depthRef.current = depth;
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
    // During the services ambient hold (ADR-021 addendum), the dock
    // has released and the welded DOM brandmark + seam pixel field own
    // the foreground. Force the core to 0 so it never reads as a
    // second mark behind the SVG; the ambient haze is provided by
    // `mats.particle` in `ShellSubstrateGyro` instead.
    const handoffFade = t.servicesAmbient
      ? 0
      : t.docked
        ? CORE_DOCKED_OPACITY_FLOOR *
          dissipateInteriorOpacityMultiplier(getSmoothedDissipate(), 0.5)
        : 1;

    // Hidden at the section-2 rest (the SVG owns the crisp 2D mark);
    // the cut brings the core to full brightness as the SVG vanishes.
    // Bright/solid through the corridor + epilogue so the silhouette
    // reads as densely as the SVG it replaces; dropped to the muted
    // floor at dock engage so it reads as interior texture under the
    // welded SVG, not a duplicate mark.
    opacityRef.current = CORE_OPACITY * reveal * handoffFade;
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

    group.visible = true;
    group.position.set(bx, by, bz);
    group.scale.setScalar(half * 2 * planetScale);

    // Keep the sim alive while the corridor is painting so the
    // pre-gateway low-ignite state actually swirls. We still pause
    // immediately when the stage disengages in the early return above.
    pausedRef.current = false;
  });

  return (
    <group ref={groupRef} visible={false}>
      <BrandmarkPhysicsCore
        count={count}
        igniteRef={igniteRef}
        depthRef={depthRef}
        glitchRef={glitchRef}
        streamRef={streamRef}
        seedAtHome
        opacityRef={opacityRef}
        pointSizeRef={pointSizeRef}
        color={color}
        accentColor={accentColor}
        pausedRef={pausedRef}
        reducedMotion={reducedMotion}
      />
    </group>
  );
}
