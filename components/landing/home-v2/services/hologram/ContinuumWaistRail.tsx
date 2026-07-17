"use client";

/**
 * ContinuumWaistRail — the tool ↔ collaborator spectrum visualized ON the
 * brandmark's waist ring (ADR-049).
 *
 * Mounted as a child of `CorridorArmillary` (so it inherits the parked
 * instrument's pointer-look rig + billboard + scale), a group tilted to
 * the shell-waist ring's exact plane carries:
 *   - three TICK diamonds at the labelled stops (Tool · AI lives here ·
 *     Collaborator), at THUMB_TICK_FRACTIONS;
 *   - a traveling reticle THUMB that ping-pongs the front arc between the
 *     Tool (left) and Collaborator (right) stops — mirroring the DOM
 *     `.crail` reticle's 7s `crailSlideLarge` loop.
 *
 * The thumb rides the SAME ellipse parametrization the waist ring is drawn
 * from — (cos a · r, sin a · r · ecc, 0) inside `rotation={waist.tilt}` —
 * derived from the live shell-waist config so it can never drift off the
 * drawn line. The front arc a = π·(1 − f) keeps f = Tool on the left and
 * f = Collaborator on the right, with sin a > 0 so the whole travel stays
 * on the camera-facing half of the ring.
 *
 * Motion: a useFrame delta accumulator (NEVER a wall clock — a tab-hide
 * must not jump the thumb), advancing only while the continuum approach
 * envelope is open. Every opacity gates on that same approach, so the
 * reticle fades in with the waist re-brighten and out at the runway tail
 * (reversible under scroll, off byte-identical). One small traveling
 * reticle is the sanctioned motion — the DOM crail dot precedent; the mark
 * and rings themselves stay static.
 */

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import { STRUCTURAL_ORBITS } from "./HologramOrbits";
import {
  THUMB_PERIOD_S,
  THUMB_TICK_FRACTIONS,
  continuumApproachT,
  continuumThumbAngle,
  continuumThumbFraction,
} from "@/lib/services-ring/continuumStageMath";
import { continuumStageProgressRef } from "@/lib/services-ring/continuumStageProgressRef";
import { TENSOR_ACCENT } from "@/lib/home-v2/goldPalette";

/** The waist ring — derived from the live config so the thumb rides the
 *  drawn line even if shell-waist is retuned. */
const WAIST = STRUCTURAL_ORBITS.find((o) => o.id === "shell-waist") ?? STRUCTURAL_ORBITS[0];
const WAIST_ECC = WAIST.eccentricity ?? 0.9;

/** Thumb core radius (group-local, pre-scale). Small — one traveling
 *  reticle, not a second instrument. */
const THUMB_R = 0.036;
/** Faint halo sphere around the core. */
const HALO_R = 0.07;
/** Tick diamond half-size (small spheres — the OrbitRing node recipe;
 *  flat sprites would read edge-on on the near-horizontal ring). */
const TICK_R = 0.022;

function ringPoint(f: number, out: THREE.Vector3): THREE.Vector3 {
  const a = continuumThumbAngle(f);
  return out.set(Math.cos(a) * WAIST.radius, Math.sin(a) * WAIST.radius * WAIST_ECC, 0);
}

export function ContinuumWaistRail({ scale = 1 }: { scale?: number }) {
  const thumbRef = useRef<THREE.Group>(null);
  const coreMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const haloMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const tickMatRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const phaseRef = useRef(0);
  const scratch = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const approach = continuumApproachT(continuumStageProgressRef.current.progress);

    // Advance the ping-pong ONLY while the beat is engaged, via a delta
    // accumulator (no wall clock — a tab-hide must not jump the thumb). The
    // delta is CLAMPED (Math.min(0.1, …), the BEST-PRACTICES dt-clamp rule
    // every other integrator follows): a backgrounded tab / frameloop reset
    // can hand back a huge first-frame delta that would otherwise snap the
    // thumb to an arbitrary phase on return.
    if (approach > 0.02) phaseRef.current += Math.min(0.1, delta) / THUMB_PERIOD_S;

    const thumb = thumbRef.current;
    if (thumb) {
      const f = continuumThumbFraction(phaseRef.current);
      thumb.position.copy(ringPoint(f, scratch.current));
      thumb.visible = approach > 0.002;
    }
    // Every opacity gates on the approach — the reticle + ticks fade in
    // with the waist re-brighten and out at the tail (reversible).
    if (coreMatRef.current) coreMatRef.current.opacity = 0.95 * approach;
    if (haloMatRef.current) haloMatRef.current.opacity = 0.32 * approach;
    for (const m of tickMatRefs.current) if (m) m.opacity = 0.5 * approach;
  });

  return (
    <group rotation={WAIST.tilt} scale={scale}>
      {/* Tick diamonds at the three labelled stops. */}
      {THUMB_TICK_FRACTIONS.map((f, i) => {
        const p = ringPoint(f, new THREE.Vector3());
        return (
          <mesh key={i} position={[p.x, p.y, p.z]}>
            <sphereGeometry args={[TICK_R, 10, 10]} />
            <meshBasicMaterial
              ref={(m) => {
                tickMatRefs.current[i] = m;
              }}
              color={TENSOR_ACCENT}
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
              depthWrite={false}
            />
          </mesh>
        );
      })}

      {/* The traveling reticle thumb — a bright core + a faint halo. */}
      <group ref={thumbRef} visible={false}>
        <mesh>
          <sphereGeometry args={[THUMB_R, 16, 16]} />
          <meshBasicMaterial
            ref={coreMatRef}
            color={TENSOR_ACCENT}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[HALO_R, 16, 16]} />
          <meshBasicMaterial
            ref={haloMatRef}
            color={TENSOR_ACCENT}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}
