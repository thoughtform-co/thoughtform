"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { BODY_POSITIONS, RING_SEGMENTS, orbitEmerge } from "./intelligenceLayerGeom";
import { useBrandmarkJourneyStore } from "@/lib/stores/brandmarkJourneyStore";

/**
 * SystemOrbits — visible planetary orbits for the intelligence-layer
 * triad (Sources / Substrate / Surfaces).
 *
 * The triad reads as three floating spheres without a visible bond
 * between them; the user asked for orbit lines so the side bodies
 * read as planets ON an orbit around the substrate brandmark (the
 * way the diagnostic orbits in `#missing-layer` make the diagnostic
 * pills read as bodies on charts).
 *
 * Two coplanar tilted hairlines, both centred at the substrate:
 *
 *   - **System orbit** (outer): the primary ellipse the side bodies
 *     ride on. Sized to land Sources `[-2.55, ...]` and Surfaces
 *     `[+2.55, ...]` at the apsides (rx = 2.85 gives a tiny "rest"
 *     margin past each body so the orbit appears to wrap them
 *     rather than terminate at them).
 *   - **Inner hairline**: a secondary smaller ellipse tilted the
 *     other direction, so the system reads as a multi-orbit
 *     planetary diagram instead of a single flat ring.
 *
 * Opacity ramps with `ringProgress` through `orbitEmerge` — the same
 * scalar the celestial bodies use — so the orbits fade in as the
 * substrate window opens and retract on the exit.
 */

const DAWN_LINE = new THREE.Color("#ebe3d6");
const GOLD_LINE = new THREE.Color("#caa554");

interface OrbitSpec {
  /** Semi-major axis (along X). */
  rx: number;
  /** Semi-minor axis (along the tilted second axis). */
  ry: number;
  /** Euler rotation in radians applied to the XY ellipse plane so the
   *  orbit reads as horizontal-ish with a slight tip toward the viewer. */
  rotation: readonly [number, number, number];
  color: THREE.Color;
  baseOpacity: number;
}

const DEG = Math.PI / 180;

// Both ellipses are centred at the substrate position. The first
// arg of THREE.EllipseCurve creates a curve in the XY plane; the
// Euler rotation tilts it so the ring sits as a horizontal orbital
// plane with a small camera-facing tilt (-86° around X turns the
// flat ring into a horizontal disk; the small Z rotation gives the
// secondary hairline a different inclination than the primary).
const ORBITS: readonly OrbitSpec[] = [
  // Primary system orbit — bodies ride this. rx = 2.85 sits just
  // outside the side-body X (±2.55) so the bodies visually slot
  // INTO the ring rim.
  {
    rx: 2.85,
    ry: 0.95,
    rotation: [-82 * DEG, 0, 4 * DEG],
    color: GOLD_LINE,
    baseOpacity: 0.42,
  },
  // Secondary inner hairline — smaller, tilted the opposite way,
  // dawn-toned so it recedes behind the gold primary.
  {
    rx: 2.1,
    ry: 0.65,
    rotation: [-84 * DEG, 0, -6 * DEG],
    color: DAWN_LINE,
    baseOpacity: 0.26,
  },
];

function buildEllipseGeometry(rx: number, ry: number): THREE.BufferGeometry {
  const curve = new THREE.EllipseCurve(0, 0, rx, ry, 0, Math.PI * 2, false, 0);
  const pts2d = curve.getPoints(RING_SEGMENTS);
  const positions = new Float32Array(pts2d.length * 3);
  for (let i = 0; i < pts2d.length; i++) {
    positions[i * 3] = pts2d[i].x;
    positions[i * 3 + 1] = pts2d[i].y;
    positions[i * 3 + 2] = 0;
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return geom;
}

export function SystemOrbits() {
  const groupRef = useRef<THREE.Group>(null);

  // One geometry + material per orbit, retained for the lifetime of
  // the scene. The per-frame work is a single `opacity` write per
  // material — no allocation.
  const orbits = useMemo(
    () =>
      ORBITS.map((spec) => {
        const geom = buildEllipseGeometry(spec.rx, spec.ry);
        const mat = new THREE.LineBasicMaterial({
          color: spec.color,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        });
        return { spec, geom, mat };
      }),
    []
  );

  useFrame(() => {
    const progress = useBrandmarkJourneyStore.getState().transform.ringProgress;
    const emerge = orbitEmerge(progress);
    for (const { spec, mat } of orbits) {
      mat.opacity = emerge * spec.baseOpacity;
    }
  });

  const center = BODY_POSITIONS.substrate;

  return (
    <group ref={groupRef} position={[center[0], center[1], center[2]]}>
      {orbits.map(({ spec, geom, mat }, i) => (
        <lineLoop
          key={`system-orbit-${i}`}
          geometry={geom}
          material={mat}
          rotation={spec.rotation as unknown as [number, number, number]}
        />
      ))}
    </group>
  );
}
