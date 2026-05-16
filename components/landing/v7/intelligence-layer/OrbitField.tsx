"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  DIAMOND_SIZE,
  RING_SEGMENTS,
  SIDE_ORBITS,
  SUBSTRATE_RING,
  SUB_ORBIT_SPIN_RATE,
  orbitEmerge,
  type SideOrbit,
} from "./intelligenceLayerGeom";
import { useBrandmarkJourneyStore } from "@/lib/stores/brandmarkJourneyStore";

/**
 * OrbitField — the R3F scene for the intelligence-layer triad
 * (ADR-014).
 *
 * Three coplanar, front-on orbits:
 *
 *   - SUBSTRATE (middle):  the brandmark particle cloud, painted
 *                          by the global `BrandmarkParticleStation`
 *                          NOT by this scene. We draw a faint
 *                          hairline guide circle around its rim so
 *                          the substrate reads as a deliberate ring
 *                          alongside the two side orbits.
 *   - LEFT (sources):      hairline LineLoop + decorative diamond
 *                          pips. Emerges by sliding from origin to
 *                          `LEFT_ORBIT.homeCentre` and scaling 0→1
 *                          in parallel.
 *   - RIGHT (surfaces):    mirror of left.
 *
 * Per-frame the scene reads `transform.ringProgress` from the
 * journey store (the canonical substrate-window progress channel),
 * computes `orbitEmerge(progress)`, and writes:
 *
 *     sideOrbit.group.position.x = homeCentre.x * emerge
 *     sideOrbit.group.scale.setScalar(emerge)
 *
 * NO opacity envelopes for orbit appearance — Principle 4 of
 * ADR-013. NO Y-axis rotation — ADR-014 supersedes the previous
 * three-coaxial-ring rotation model.
 *
 * Sub-orbit halo: a single hairline circle inside the substrate
 * ring breathes via slow autonomous Z spin (matches Section 02's
 * `.sigil__orbits` celestial grammar). It is *inside* the substrate
 * ring, not nested around it, so it reads as the substrate's own
 * inner atmosphere rather than another concentric orbit.
 */

interface SideOrbitHandles {
  group: THREE.Group;
  ring: THREE.LineLoop;
  halo: THREE.LineLoop;
  pipGroup: THREE.Group;
}

/** Build a hairline ring as `THREE.LineLoop` of `RING_SEGMENTS`
 *  vertices around a circle of `radius` in the XY plane. */
function buildRingGeometry(radius: number): THREE.BufferGeometry {
  const positions = new Float32Array(RING_SEGMENTS * 3);
  for (let i = 0; i < RING_SEGMENTS; i++) {
    const t = (i / RING_SEGMENTS) * Math.PI * 2;
    positions[i * 3] = Math.cos(t) * radius;
    positions[i * 3 + 1] = Math.sin(t) * radius;
    positions[i * 3 + 2] = 0;
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return geom;
}

/** Build a 4-vertex `LineLoop` diamond (rotated square). */
function buildDiamondGeometry(size: number): THREE.BufferGeometry {
  const positions = new Float32Array([0, size, 0, size, 0, 0, 0, -size, 0, -size, 0, 0]);
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return geom;
}

/** Construct one side orbit (left or right) — its primary hairline
 *  ring, a concentric inner halo (60% radius, dashed/lower-contrast),
 *  and a group of cardinal diamond pips at `pipAngles`. All children
 *  sit inside the orbit's parent group so a single transform on the
 *  parent drives the emerge slide + scale. The inner halo gives each
 *  side orbit comparable visual density to the substrate's brandmark
 *  cloud so the three pillars read as equal stations. */
function buildSideOrbit(orbit: SideOrbit): SideOrbitHandles {
  const group = new THREE.Group();
  group.name = `orbit-${orbit.id}`;
  // Start at origin and scale 0 — the orbitEmerge envelope slides
  // the group to its homeCentre and scales it to 1 in parallel.
  group.position.set(0, 0, 0);
  group.scale.setScalar(0);

  // Primary outer ring — gold hairline at full signal weight.
  const ringMaterial = new THREE.LineBasicMaterial({
    color: orbit.color,
    transparent: true,
    opacity: orbit.opacity,
    depthWrite: false,
  });
  const ring = new THREE.LineLoop(buildRingGeometry(orbit.radius), ringMaterial);
  group.add(ring);

  // Inner halo — concentric dashed-feel hairline at 60% radius.
  // Lower-contrast (dawn) so it reads as instrument detail, not a
  // second primary station. Adds celestial density without competing
  // with the outer ring or the substrate cloud.
  const haloMaterial = new THREE.LineBasicMaterial({
    color: "#a99e8a", // --gold-soft / dawn-deep
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  });
  const halo = new THREE.LineLoop(buildRingGeometry(orbit.radius * 0.6), haloMaterial);
  group.add(halo);

  // Cardinal pips. `pipAngles` are degrees, 0 = top of orbit,
  // clockwise. Convert to standard polar (0 = right, ccw) by
  // `θ_radians = π/2 - degrees * π/180`.
  const pipGroup = new THREE.Group();
  const pipGeometry = buildDiamondGeometry(DIAMOND_SIZE);
  const pipMaterial = new THREE.LineBasicMaterial({
    color: "#caa554", // --gold — pips signal cardinal bearings
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  for (const angleDeg of orbit.pipAngles) {
    const t = Math.PI / 2 - (angleDeg * Math.PI) / 180;
    const pip = new THREE.LineLoop(pipGeometry, pipMaterial);
    pip.position.set(Math.cos(t) * orbit.radius, Math.sin(t) * orbit.radius, 0);
    pipGroup.add(pip);
  }
  group.add(pipGroup);

  return { group, ring, halo, pipGroup };
}

/** Build the substrate guide ring + inner halo + cardinal pips.
 *  The substrate ring frames the brandmark cloud (which paints at
 *  smaller screen pixels via the global painter). The halo is a
 *  concentric hairline that breathes via slow autonomous Z spin.
 *  Cardinal pips at top/bottom anchor the substrate's read direction
 *  so it reads as a navigated station, not just an open ring. */
function buildSubstrateGuide(): {
  ring: THREE.LineLoop;
  halo: THREE.Group;
  pipGroup: THREE.Group;
} {
  // Primary substrate ring — gold hairline at signal weight equal to
  // the side orbits so the three pillars read as balanced stations.
  const ringMaterial = new THREE.LineBasicMaterial({
    color: "#caa554", // --gold
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const ring = new THREE.LineLoop(buildRingGeometry(SUBSTRATE_RING.radius), ringMaterial);
  ring.scale.setScalar(0);

  // Inner halo — single hairline at 60% of substrate radius, slow
  // autonomous rotation so the substrate feels alive even at the
  // hold beat. Parent group is what we scale; the halo itself spins
  // independently.
  const halo = new THREE.Group();
  halo.scale.setScalar(0);
  const haloMaterial = new THREE.LineBasicMaterial({
    color: "#caa554",
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  });
  const haloRing = new THREE.LineLoop(buildRingGeometry(SUBSTRATE_RING.radius * 0.6), haloMaterial);
  halo.add(haloRing);

  // Cardinal pips at the substrate's top + bottom — the meridian
  // anchors of the central station. Match the cardinal pip rhythm
  // on the side orbits so all three pillars share the same bearing
  // grammar. The horizontal cardinals are intentionally omitted so
  // the substrate's left/right intersections with the side orbits
  // stay clean.
  const pipGroup = new THREE.Group();
  pipGroup.scale.setScalar(0);
  const pipGeometry = buildDiamondGeometry(DIAMOND_SIZE * 1.15);
  const pipMaterial = new THREE.LineBasicMaterial({
    color: "#caa554",
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
  });
  for (const angleDeg of [0, 180]) {
    const t = Math.PI / 2 - (angleDeg * Math.PI) / 180;
    const pip = new THREE.LineLoop(pipGeometry, pipMaterial);
    pip.position.set(
      Math.cos(t) * SUBSTRATE_RING.radius,
      Math.sin(t) * SUBSTRATE_RING.radius,
      0
    );
    pipGroup.add(pip);
  }

  return { ring, halo, pipGroup };
}

/**
 * OrbitField — the public component. Mounts the substrate guide +
 * two side orbits + the per-frame envelope writer.
 */
export function OrbitField() {
  const { sideOrbits, substrateRing, substrateHalo, substratePips } = useMemo(() => {
    const sideOrbits = SIDE_ORBITS.map(buildSideOrbit);
    const { ring, halo, pipGroup } = buildSubstrateGuide();
    return {
      sideOrbits,
      substrateRing: ring,
      substrateHalo: halo,
      substratePips: pipGroup,
    };
  }, []);

  // Spin target for the substrate halo's autonomous breath.
  const haloRef = useRef<THREE.Group>(substrateHalo);

  useFrame((_, dt) => {
    const transform = useBrandmarkJourneyStore.getState().transform;
    const ringsActive = transform.ringsActive;
    const progress = transform.ringProgress;

    // Hide everything when the substrate window isn't active. The
    // brandmark cloud is still drawn by the global painter outside
    // this window, but the orbit decorations only exist while
    // we're parked at substrate.
    if (!ringsActive) {
      for (const handles of sideOrbits) {
        if (handles.group.visible) handles.group.visible = false;
      }
      if (substrateRing.visible) substrateRing.visible = false;
      if (substrateHalo.visible) substrateHalo.visible = false;
      if (substratePips.visible) substratePips.visible = false;
      return;
    }
    for (const handles of sideOrbits) {
      if (!handles.group.visible) handles.group.visible = true;
    }
    if (!substrateRing.visible) substrateRing.visible = true;
    if (!substrateHalo.visible) substrateHalo.visible = true;
    if (!substratePips.visible) substratePips.visible = true;

    const emerge = orbitEmerge(progress);

    // === Side orbits — slide outward AND scale up together ===
    // Position lerps from origin to homeCentre with the same emerge
    // scalar; scale lerps 0 → 1. Reads as the orbit being born from
    // the substrate's centre.
    for (let i = 0; i < sideOrbits.length; i++) {
      const handles = sideOrbits[i];
      const orbit = SIDE_ORBITS[i];
      handles.group.position.set(
        orbit.homeCentre[0] * emerge,
        orbit.homeCentre[1] * emerge,
        orbit.homeCentre[2] * emerge
      );
      handles.group.scale.setScalar(emerge);
    }

    // === Substrate ring + halo + pips — geometric emerge (no slide) ===
    // The substrate stays at origin; it just scales 0 → 1 so the
    // hairline guide, inner halo, and meridian pips appear in sync
    // with the side orbits.
    substrateRing.scale.setScalar(emerge);
    substrateHalo.scale.setScalar(emerge);
    substratePips.scale.setScalar(emerge);

    // Halo autonomous spin — slow Z rotation independent of scroll.
    if (haloRef.current) {
      haloRef.current.rotation.z += SUB_ORBIT_SPIN_RATE * dt;
    }
  });

  // Cleanup geometries / materials on unmount.
  useEffect(() => {
    return () => {
      for (const handles of sideOrbits) {
        handles.ring.geometry.dispose();
        (handles.ring.material as THREE.Material).dispose();
        handles.halo.geometry.dispose();
        (handles.halo.material as THREE.Material).dispose();
        handles.pipGroup.children.forEach((child) => {
          const m = child as THREE.LineLoop;
          m.geometry.dispose();
        });
        // Pip material is shared across all pips of one orbit;
        // dispose once from the first child if present.
        const firstPip = handles.pipGroup.children[0] as THREE.LineLoop | undefined;
        if (firstPip) (firstPip.material as THREE.Material).dispose();
      }
      substrateRing.geometry.dispose();
      (substrateRing.material as THREE.Material).dispose();
      substrateHalo.children.forEach((child) => {
        const m = child as THREE.LineLoop;
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      substratePips.children.forEach((child) => {
        const m = child as THREE.LineLoop;
        m.geometry.dispose();
      });
      const firstSubstratePip = substratePips.children[0] as THREE.LineLoop | undefined;
      if (firstSubstratePip) (firstSubstratePip.material as THREE.Material).dispose();
    };
  }, [sideOrbits, substrateRing, substrateHalo, substratePips]);

  return (
    <>
      {/* Substrate guide ring — gold hairline framing the brandmark
          cloud's perimeter. Equal in signal to the side orbits so
          the three pillars read as balanced stations. */}
      <primitive object={substrateRing} />

      {/* Substrate halo — single inner hairline that breathes via
          slow Z spin (Section 02 sigil grammar). */}
      <primitive object={substrateHalo} ref={haloRef} />

      {/* Substrate meridian pips — top + bottom cardinal diamonds. */}
      <primitive object={substratePips} />

      {/* Side orbits — emerge from substrate centre by sliding to
          their home centres and scaling up in parallel. Each side
          orbit carries its own primary ring + inner halo + cardinal
          pips (built inside `buildSideOrbit`). */}
      {sideOrbits.map((handles) => (
        <primitive key={handles.group.name} object={handles.group} />
      ))}
    </>
  );
}
