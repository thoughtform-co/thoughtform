"use client";

/**
 * BrandmarkPhysicsCoreActor — corridor-side wrapper around
 * `BrandmarkPhysicsCore` (ADR-023). Tracks the brandmark's world
 * position + half-extent every frame, drives the `ignite` envelope
 * from the corridor's dolly-release gate, and bails out when the
 * stage is off-screen so the GPGPU sim doesn't burn cycles.
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
 *   - This actor scales the wrapping `<group>` by
 *     `2 * getBrandmarkWorldHalfExtent(progress)` so the cloud lands
 *     at the same world rect the shell linework wraps around — same
 *     scale convention as the legacy `BRANDMARK_HALF_EXTENT` math
 *     in `intelligence-artifact/SubstrateBrandmark`.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useDeviceTier } from "@/lib/hooks/useDeviceTier";
import { DOLLY_HOLD_END, smoothstep } from "@/lib/home-v2/corridorMap";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import {
  BrandmarkPhysicsCore,
  BRANDMARK_PHYSICS_CORE_COUNT_DESKTOP,
  BRANDMARK_PHYSICS_CORE_COUNT_MOBILE,
} from "@/components/brand/BrandmarkPhysicsCore";
import { getBrandmarkWorldHalfExtent, getBrandmarkWorldPosition } from "./sceneGeom";

/** Width of the dolly-release ignite ramp in `paintProgress` units.
 *  Matches the `enterFly` band the accretion shell uses for pointer /
 *  drift / static-tilt activation, so the core ignites WITH the same
 *  beat the user feels the camera start moving. */
const IGNITE_RAMP_WIDTH = 0.06;

/** Lower threshold (in `paintProgress` units) below which the GPGPU
 *  sim is paused. Below this point the ignite envelope is at 0 anyway
 *  and the cloud is invisible (its container scale is also 0); pausing
 *  saves the per-frame compute pass. A small floor above 0 keeps the
 *  sim warming up just BEFORE the ramp starts so the very first
 *  visible frame already shows the dispersed cloud rather than its
 *  initial scattered-buffer state. */
const SIM_WARMUP_LEAD = 0.02;

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
    const half = getBrandmarkWorldHalfExtent(progress);

    group.visible = true;
    group.position.set(bx, by, bz);
    group.scale.setScalar(half * 2);

    // Ignite ramps from 0 → 1 across the dolly-release band, the
    // same gate `BrandmarkAccretionShell` uses for pointer/drift
    // activation. Below the ramp start, the core is dispersed (and
    // its inner opacity gate keeps it invisible until the SVG has
    // begun fading); above the ramp end, it's fully assembled.
    const ignite = smoothstep(DOLLY_HOLD_END, DOLLY_HOLD_END + IGNITE_RAMP_WIDTH, progress);
    igniteRef.current = ignite;

    // Pause the sim until just BEFORE the ignite ramp starts. This
    // lets the dispersed cloud warm up off-screen so the first
    // visible frame at the ramp edge already shows the cloud at its
    // steady-state scattered radius rather than the literal initial
    // scatter buffer.
    pausedRef.current = progress < DOLLY_HOLD_END - SIM_WARMUP_LEAD;
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
