"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { buildTiltedRingLineLoop } from "@/components/landing/v7/intelligence-layer/celestialRingUtils";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { BRANDMARK_REST, RING_RADII, RING_TILTS, getRingEmerge } from "../sceneGeom";

/**
 * DiagnosticChamber — four orbital rings that emerge around the
 * brandmark cloud during Chamber B of the depth gateway.
 *
 * Each ring is a tilted ellipse (`buildTiltedRingLineLoop` from the
 * intelligence-layer toolkit, so the visual register matches the
 * production triad) with its own staggered fade-in driven by
 * `getRingEmerge(ringIndex, chamberB)`. The whole assembly is parked
 * at `BRANDMARK_REST` (the brandmark's settled position from late
 * Chamber A onward), so the rings appear to materialise around the
 * brandmark in place — no positional handoff needed.
 *
 * Rings rotate slowly in scene-space to give a subtle living feel
 * during Chamber B. The rotation rate is shared across all four
 * rings to keep the constellation cohesive.
 *
 * In Chamber C the rings linger but fade so the L/R celestial
 * bodies + substrate morph take focus.
 */
export function DiagnosticChamber() {
  const groupRef = useRef<THREE.Group>(null);

  // Pre-built ring geometries — created once and never disposed
  // (component lives for the lifetime of the page; the parent
  // canvas dispose handles WebGL teardown on unmount).
  const ringGeoms = useMemo(
    () => RING_RADII.map((r, i) => buildTiltedRingLineLoop(r, RING_TILTS[i] ?? RING_TILTS[0]!)),
    []
  );

  const ringMats = useMemo(
    () =>
      ringGeoms.map(
        (_, i) =>
          new THREE.LineBasicMaterial({
            // Alternate gold / dawn between consecutive rings so the
            // constellation reads as a registered set rather than
            // four identical loops.
            color: i % 2 === 0 ? new THREE.Color("#caa554") : new THREE.Color("#ebe3d6"),
            transparent: true,
            opacity: 0,
            depthWrite: false,
          })
      ),
    [ringGeoms]
  );

  useEffect(() => {
    return () => {
      ringGeoms.forEach((g) => g.dispose());
      ringMats.forEach((m) => m.dispose());
    };
  }, [ringGeoms, ringMats]);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;

    const { chamberB, chamberC, active } = useDepthGatewayStore.getState().transform;
    if (!active) {
      group.visible = false;
      return;
    }
    group.visible = true;

    const t = state.clock.elapsedTime;
    // Gentle shared rotation. The rings spin slowly enough to feel
    // alive without distracting from the brandmark.
    group.rotation.y = t * 0.06;
    group.rotation.x = Math.sin(t * 0.04) * 0.02;

    // Per-ring opacity envelope:
    //   - Chamber B drives emergence (per-ring stagger).
    //   - Chamber C dims the rings to ~30% so the L/R bodies take
    //     visual priority but the orbital constellation is still
    //     present in the frame.
    const cCFade = 1 - chamberC * 0.7;
    ringMats.forEach((mat, i) => {
      const emerge = getRingEmerge(i, chamberB);
      const baseOpacity = i % 2 === 0 ? 0.55 : 0.4;
      mat.opacity = emerge * baseOpacity * cCFade;
    });
  });

  return (
    <group ref={groupRef} position={BRANDMARK_REST}>
      {ringGeoms.map((geom, i) => (
        <lineLoop key={`ring-${i}`} geometry={geom} material={ringMats[i]} />
      ))}
    </group>
  );
}
