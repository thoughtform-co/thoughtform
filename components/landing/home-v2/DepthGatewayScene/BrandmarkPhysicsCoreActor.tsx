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
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import {
  BrandmarkPhysicsCore,
  BRANDMARK_PHYSICS_CORE_COUNT_DESKTOP,
  BRANDMARK_PHYSICS_CORE_COUNT_MOBILE,
} from "@/components/brand/BrandmarkPhysicsCore";
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

    group.visible = true;
    group.position.set(bx, by, bz);
    group.scale.setScalar(half * 2);

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
        color={color}
        accentColor={accentColor}
        pausedRef={pausedRef}
        reducedMotion={reducedMotion}
      />
    </group>
  );
}
