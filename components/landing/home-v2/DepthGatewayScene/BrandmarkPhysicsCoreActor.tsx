"use client";

/**
 * BrandmarkPhysicsCoreActor — corridor-side wrapper around
 * `BrandmarkPhysicsCore` (ADR-023). Tracks the brandmark's world
 * position + half-extent every frame, drives the low-swirl →
 * collapse envelope from the corridor's dolly-release gate, and bails
 * out when the stage is off-screen so the GPGPU sim doesn't burn cycles.
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
import { DOLLY_HOLD_END, smoothstep, windowFor } from "@/lib/home-v2/corridorMap";
import { getEpiloguePlanetScale } from "@/lib/home-v2/epilogueTimeline";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import {
  BrandmarkPhysicsCore,
  BRANDMARK_PHYSICS_CORE_COUNT_DESKTOP,
  BRANDMARK_PHYSICS_CORE_COUNT_MOBILE,
} from "@/components/brand/BrandmarkPhysicsCore";
import { getSmoothedEpilogueProgress } from "./motionFollower";
import {
  getBrandmarkSphereMatchHalfExtent,
  getBrandmarkWorldHalfExtent,
  getBrandmarkWorldPosition,
} from "./sceneGeom";

/** Low pre-gateway ignite keeps the mark as a living swirl while the
 *  section-2 Thoughtform read is still parked. `0` is too dead/static;
 *  values above ~0.18 start looking like an already-collapsed mark. */
const PRE_GATE_SWIRL_IGNITE = 0.08;

/** Collapse window after the camera dolly releases. Deliberately much
 *  narrower than the old `0.06` ignite ramp: the moment the visitor
 *  scrolls into the gateway, the particle cloud should snap into the
 *  proper brandmark state rather than staying fuzzy through the fly-in. */
const COLLAPSE_RAMP_WIDTH = 0.018;

/** Size merge completes by the Navigate station start. This decouples
 *  "become the real mark" from "grow to sphere dimensions": first the
 *  particles collapse into the mark, then the assembled mark expands
 *  into the full visible sphere envelope during the gateway approach. */
const SIZE_MERGE_END = windowFor("navigate").start;

/** The corridor brandmark core ramps from a subtle PARKED baseline (a
 *  low-ignite swirl sitting behind the crisp SVG Thoughtform mark at
 *  the section-2 rest) up to a brighter, larger-speck FLY-IN body as
 *  the camera dives into the substrate sphere — so the particle mark
 *  reads as the luminous CENTRE of the intelligence-layer artifact
 *  instead of nearly vanishing inside the denser gimbal shell (9600
 *  dots at ~4.8px). The ramp rides the same `collapseT` gate as
 *  ignite, so brightness + assembly arrive together the instant the
 *  dolly releases; the parked read stays clean. Parked values match
 *  the `BrandmarkPhysicsCore` DEFAULT_* baselines. */
const CORE_OPACITY_PARKED = 0.78;
const CORE_OPACITY_FLYIN = 0.95;
const CORE_POINT_SIZE_PARKED = 2.8;
const CORE_POINT_SIZE_FLYIN = 4.0;

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
  const igniteRef = useRef(0);
  const opacityRef = useRef(CORE_OPACITY_PARKED);
  const pointSizeRef = useRef(CORE_POINT_SIZE_PARKED);
  const pausedRef = useRef(true);

  // Drive the per-frame transform (position, scale, visibility) AND
  // the in-component refs that read into `BrandmarkPhysicsCore` props
  // on the next render. Position + scale don't need React; they're
  // imperative writes on the group.
  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    const t = useDepthGatewayStore.getState().transform;
    const painting = t.active || t.armed;
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

    // Ignite is intentionally DECOUPLED from size now:
    //
    //   1. Pre-gateway (`progress <= DOLLY_HOLD_END`): keep a low
    //      ignite value so the core reads as swirling particles behind
    //      / with the SVG Thoughtform mark.
    //   2. Gateway entry: collapse very quickly to ignite=1, so the
    //      moment the camera flies in the cloud becomes the proper
    //      brandmark instead of staying fuzzy.
    //   3. Size merge happens separately below — assembled mark first,
    //      sphere dimensions second.
    const collapseT = smoothstep(DOLLY_HOLD_END, DOLLY_HOLD_END + COLLAPSE_RAMP_WIDTH, progress);
    const ignite = PRE_GATE_SWIRL_IGNITE + (1 - PRE_GATE_SWIRL_IGNITE) * collapseT;
    igniteRef.current = ignite;

    // Brightness + speck-size ramp rides the same collapse gate as
    // ignite: subtle parked swirl behind the SVG mark → luminous
    // fly-in core that merges with the substrate sphere.
    const flyInOpacity =
      CORE_OPACITY_PARKED + (CORE_OPACITY_FLYIN - CORE_OPACITY_PARKED) * collapseT;

    // Corridor → epilogue handoff: the in-canvas core continues to own
    // the mark while the visitor exits Build and flies through the
    // substrate sphere. It yields only once the later dock / Services
    // handoff owns the mark and the DOM SVG is allowed back in.
    const handoffFade = t.docked ? 0 : 1;

    opacityRef.current = flyInOpacity * handoffFade;
    pointSizeRef.current =
      CORE_POINT_SIZE_PARKED + (CORE_POINT_SIZE_FLYIN - CORE_POINT_SIZE_PARKED) * collapseT;

    // Size (2026-06-16): hand off from the DOM SVG at its own world
    // half-extent so the pre-gateway overlap is size-continuous. After
    // the quick collapse has completed, grow the now-assembled mark
    // into the full visible substrate-sphere dimensions by the time
    // the Navigate station begins. This preserves the low-ignite swirl
    // at the setup beat without letting fuzzy particles linger inside
    // the gateway.
    const handoffHalf = getBrandmarkWorldHalfExtent(progress);
    const sphereHalf = getBrandmarkSphereMatchHalfExtent(progress);
    const sizeMerge = smoothstep(DOLLY_HOLD_END + COLLAPSE_RAMP_WIDTH, SIZE_MERGE_END, progress);
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
