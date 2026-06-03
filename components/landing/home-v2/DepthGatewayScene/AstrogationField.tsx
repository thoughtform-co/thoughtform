"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import {
  buildSphereCloudGeometry,
  buildTiltedRingLineLoop,
  pipLocalPosition,
} from "@/components/landing/v7/intelligence-layer/celestialRingUtils";
import { depthOpacityForWorldPosition, type DepthFocusWindow } from "./sceneGeom";

/**
 * AstrogationField — restrained navigational instrumentation seeded
 * through the depth corridor (ADR-018). A handful of tilted orbit
 * "systems" (an elliptical orbit hairline + a small planet body on it)
 * sit OFF the central flight axis and drift past in the periphery as
 * the camera dollies, so the corridor reads as a charted star-system —
 * ambient astrogation, not foreground decoration.
 *
 * Reuses the v7 celestial builders (`buildTiltedRingLineLoop`,
 * `pipLocalPosition`, `buildSphereCloudGeometry`) and the corridor's own
 * camera-space depth fade (`depthOpacityForWorldPosition`) + store-driven
 * `active` gate, so it matches the material language and the
 * engagement-gated frameloop (pauses cleanly off-screen). Subtle by
 * design: low alpha ceilings, gold/dawn hairlines, no labels.
 */

interface AstrogationSystem {
  /** World centre of the system (off the X≈0 flight axis). */
  position: [number, number, number];
  radius: number;
  /** Euler tilt [x,y,z] applied to the orbit plane. */
  tilt: [number, number, number];
  eccentricity: number;
  /** Where the planet sits on the orbit (degrees). */
  planetAngle: number;
  color: string;
  /** Painted alpha = depthOpacity * alphaCeiling (kept faint). */
  alphaCeiling: number;
  /** Z-spin rate (rad/sec); sign alternates for parallax. */
  spinRate: number;
  /** Faint inner companion ring (skipped on mobile). */
  innerRing?: boolean;
}

const GOLD = "#caa554";
const DAWN = "#ebe3d6";

/** Broad camera-space window: systems emerge from depth, hold while the
 *  camera is alongside, recede as they cross behind. */
const FOCUS_WINDOW: DepthFocusWindow = { near: 1.5, nearFade: 1.5, far: 7, farFade: 3 };

/** Seeded systems spread across the corridor Z (~+6 setup → ~−12.5
 *  build), all off-axis (|X| ≥ 3) so they never collide with the gates
 *  (X≈0, halfExtent ≤ 2.2) or the centred copy. X / Z / alphaCeiling and
 *  the focus window are the preview-tuning knobs.
 *
 *  NOTE: these Z positions are ABSOLUTE-Z literals — the one corridor
 *  consumer that does NOT follow `CAMERA_END`. As the dolly was deepened
 *  (-8 → -11.5 → -14) the back seeds were re-spread toward ~-12.5 so the
 *  deeper Build run isn't an empty void. */
const ASTROGATION_SEEDS: AstrogationSystem[] = [
  { position: [-3.6, 1.4, 6.2], radius: 0.9, tilt: [0.9, 0.2, 0.3], eccentricity: 0.82, planetAngle: 40, color: GOLD, alphaCeiling: 0.16, spinRate: 0.05, innerRing: true },
  { position: [4.0, -1.1, 3.8], radius: 0.7, tilt: [1.1, 0.0, -0.4], eccentricity: 0.9, planetAngle: 150, color: DAWN, alphaCeiling: 0.14, spinRate: -0.06 },
  { position: [-4.2, -0.6, 1.0], radius: 1.1, tilt: [0.7, 0.3, 0.5], eccentricity: 0.78, planetAngle: 250, color: GOLD, alphaCeiling: 0.15, spinRate: 0.04, innerRing: true },
  { position: [3.4, 1.8, -2.0], radius: 0.8, tilt: [1.0, -0.2, 0.2], eccentricity: 0.86, planetAngle: 80, color: DAWN, alphaCeiling: 0.14, spinRate: -0.05 },
  { position: [-3.0, 0.9, -4.4], radius: 0.95, tilt: [0.8, 0.1, -0.3], eccentricity: 0.84, planetAngle: 320, color: GOLD, alphaCeiling: 0.15, spinRate: 0.06, innerRing: true },
  { position: [4.3, -1.4, -6.6], radius: 0.7, tilt: [1.2, 0.2, 0.4], eccentricity: 0.9, planetAngle: 200, color: DAWN, alphaCeiling: 0.13, spinRate: -0.04 },
  { position: [-3.8, 1.2, -9.5], radius: 1.0, tilt: [0.9, -0.1, 0.35], eccentricity: 0.8, planetAngle: 120, color: GOLD, alphaCeiling: 0.14, spinRate: 0.045, innerRing: true },
  { position: [3.9, -0.8, -12.5], radius: 0.75, tilt: [1.05, 0.15, -0.3], eccentricity: 0.88, planetAngle: 290, color: DAWN, alphaCeiling: 0.12, spinRate: -0.05 },
];

const RING_SEGMENTS = 96;
const PLANET_POINTS = 36;

function AstrogationSystemMesh({ system, allowInnerRing }: { system: AstrogationSystem; allowInnerRing: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  const { ringGeo, innerGeo, planetGeo, planetPos, lineMat, planetMat } = useMemo(() => {
    const ring = buildTiltedRingLineLoop(system.radius, system.tilt, RING_SEGMENTS, system.eccentricity);
    const inner =
      allowInnerRing && system.innerRing
        ? buildTiltedRingLineLoop(system.radius * 0.55, system.tilt, RING_SEGMENTS, system.eccentricity)
        : null;
    const planet = buildSphereCloudGeometry(system.radius * 0.12, PLANET_POINTS);
    const pos = pipLocalPosition(system.planetAngle, 1, system.radius, system.tilt);
    const line = new THREE.LineBasicMaterial({
      color: new THREE.Color(system.color),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
    });
    const points = new THREE.PointsMaterial({
      color: new THREE.Color(system.color),
      size: 0.05,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
    });
    return { ringGeo: ring, innerGeo: inner, planetGeo: planet, planetPos: pos, lineMat: line, planetMat: points };
  }, [system, allowInnerRing]);

  useEffect(() => {
    return () => {
      ringGeo.dispose();
      innerGeo?.dispose();
      planetGeo.dispose();
      lineMat.dispose();
      planetMat.dispose();
    };
  }, [ringGeo, innerGeo, planetGeo, lineMat, planetMat]);

  useFrame((_state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const { progress, active } = useDepthGatewayStore.getState().transform;
    if (!active) {
      group.visible = false;
      return;
    }
    const opacity = depthOpacityForWorldPosition(progress, system.position, FOCUS_WINDOW);
    if (opacity <= 0.001) {
      group.visible = false;
      return;
    }
    group.visible = true;
    lineMat.opacity = opacity * system.alphaCeiling;
    // Planet body reads a touch brighter than its orbit hairline.
    planetMat.opacity = Math.min(1, opacity * system.alphaCeiling * 2.4);
    group.rotation.z += system.spinRate * Math.min(0.05, delta);
  });

  return (
    <group ref={groupRef} position={system.position} visible={false}>
      <lineLoop geometry={ringGeo} material={lineMat} />
      {innerGeo && <lineLoop geometry={innerGeo} material={lineMat} />}
      <points geometry={planetGeo} material={planetMat} position={[planetPos.x, planetPos.y, planetPos.z]} />
    </group>
  );
}

export function AstrogationField({ isMobile = false }: { isMobile?: boolean }) {
  // Mobile: render a reduced set (every other system, no inner rings) —
  // the corridor is already busy on narrow portrait. Decided at mount.
  const seeds = useMemo(
    () => (isMobile ? ASTROGATION_SEEDS.filter((_, i) => i % 2 === 0) : ASTROGATION_SEEDS),
    [isMobile]
  );

  return (
    <>
      {seeds.map((system, i) => (
        <AstrogationSystemMesh key={i} system={system} allowInnerRing={!isMobile} />
      ))}
    </>
  );
}
