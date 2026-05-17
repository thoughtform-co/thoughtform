"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import {
  DIAMOND_SIZE,
  RING_SEGMENTS,
  SIDE_ORBITS,
  SUBSTRATE_RING,
  orbitEmerge,
  type SideOrbit,
} from "./intelligenceLayerGeom";
import { useBrandmarkJourneyStore } from "@/lib/stores/brandmarkJourneyStore";

/**
 * OrbitField — the R3F scene for the intelligence-layer triad
 * (ADR-014, simplified to three equal circles).
 *
 * Three coplanar, front-on circles — ONE ring per pillar, all equal
 * in size:
 *
 *   - LEFT (sources):      one hairline LineLoop + cardinal pips.
 *                          Emerges by sliding from origin to
 *                          `LEFT_ORBIT.homeCentre` and scaling 0→1
 *                          in parallel.
 *   - SUBSTRATE (middle):  NOT rendered here. The brandmark particle
 *                          cloud (painted by the global
 *                          `BrandmarkParticleStation`) IS the middle
 *                          circle — once the painter's `uShapeBlend`
 *                          uniform morphs the cloud to ring topology,
 *                          the cloud's outer rim is the substrate
 *                          ring. Drawing a separate guide circle here
 *                          would make the centre read as "smaller
 *                          brandmark inside a bigger ring" — the bug
 *                          we just fixed. Only the meridian pips
 *                          (top + bottom diamonds) sit on the
 *                          substrate's rim as decoration.
 *   - RIGHT (surfaces):    mirror of left.
 *
 * Per-frame the scene reads `transform.ringProgress` from the journey
 * store (the canonical substrate-window progress channel), computes
 * `orbitEmerge(progress)`, and writes:
 *
 *     sideOrbit.group.position.x = homeCentre.x * emerge
 *     sideOrbit.group.scale.setScalar(emerge)
 *
 * NO opacity envelopes for orbit appearance — Principle 4 of
 * ADR-013. NO Y-axis rotation — ADR-014. NO concentric halos or
 * substrate guide ring — three circles, equal weight, one ring per
 * pillar.
 */

interface SideOrbitHandles {
  group: THREE.Group;
  ring: THREE.LineLoop;
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
 *  ring and a group of cardinal diamond pips at `pipAngles`. All
 *  children sit inside the orbit's parent group so a single transform
 *  on the parent drives the emerge slide + scale. ONE ring per side
 *  orbit (no concentric halo) so the triad reads as three circles
 *  total, all equal in size. */
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

  return { group, ring, pipGroup };
}

/** Build the substrate meridian pips only — top + bottom diamonds
 *  sitting on the brandmark ring's rim. The substrate ring itself is
 *  the brandmark particle cloud (drawn by the global painter, morphed
 *  to ring topology via `uShapeBlend`), so we never draw a hairline
 *  guide here. The meridian pips share the same scene-unit radius as
 *  the brandmark cloud's projected screen rect (sized in CSS to match
 *  the side orbits — see `--ilayer-ring-diameter` in landing.css).
 *
 *  ADR-014 v3: pips are positioned relative to `SUBSTRATE_RING.centre`
 *  so they track the shifted-down triad centre (y = -0.111 scene
 *  units, matching CSS `--ilayer-triad-y: 56%`). */
function buildSubstrateMeridianPips(): THREE.Group {
  const pipGroup = new THREE.Group();
  pipGroup.scale.setScalar(0);
  const pipGeometry = buildDiamondGeometry(DIAMOND_SIZE * 1.15);
  const pipMaterial = new THREE.LineBasicMaterial({
    color: "#caa554",
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
  });
  const [cx, cy, cz] = SUBSTRATE_RING.centre;
  for (const angleDeg of [0, 180]) {
    const t = Math.PI / 2 - (angleDeg * Math.PI) / 180;
    const pip = new THREE.LineLoop(pipGeometry, pipMaterial);
    pip.position.set(
      cx + Math.cos(t) * SUBSTRATE_RING.radius,
      cy + Math.sin(t) * SUBSTRATE_RING.radius,
      cz
    );
    pipGroup.add(pip);
  }
  return pipGroup;
}

/**
 * OrbitField — the public component. Mounts the two side orbits +
 * the substrate meridian pips + the per-frame envelope writer.
 */
export function OrbitField() {
  const { sideOrbits, substratePips } = useMemo(() => {
    const sideOrbits = SIDE_ORBITS.map(buildSideOrbit);
    const substratePips = buildSubstrateMeridianPips();
    return { sideOrbits, substratePips };
  }, []);

  useFrame(() => {
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
      if (substratePips.visible) substratePips.visible = false;
      return;
    }
    for (const handles of sideOrbits) {
      if (!handles.group.visible) handles.group.visible = true;
    }
    if (!substratePips.visible) substratePips.visible = true;

    const emerge = orbitEmerge(progress);

    // === Side orbits — slide outward FROM the substrate centre ===
    // X position lerps from substrate centre to homeCentre with the
    // emerge scalar; Y stays anchored at the substrate's centre Y
    // throughout so the side orbit is "born from the substrate's
    // centre" and only travels horizontally. Scale lerps 0 → 1.
    // (Earlier iterations lerped Y from 0 → homeCentre.y, which made
    // the orbits slide diagonally when the triad centre shifted off
    // the canvas origin.)
    const [substrateCx, substrateCy, substrateCz] = SUBSTRATE_RING.centre;
    for (let i = 0; i < sideOrbits.length; i++) {
      const handles = sideOrbits[i];
      const orbit = SIDE_ORBITS[i];
      handles.group.position.set(
        substrateCx + (orbit.homeCentre[0] - substrateCx) * emerge,
        substrateCy,
        substrateCz
      );
      handles.group.scale.setScalar(emerge);
    }

    // === Substrate meridian pips — geometric emerge (no slide) ===
    // The pips stay at origin; they just scale 0 → 1 so the
    // top/bottom diamonds appear in sync with the side orbits.
    substratePips.scale.setScalar(emerge);
  });

  // Cleanup geometries / materials on unmount.
  useEffect(() => {
    return () => {
      for (const handles of sideOrbits) {
        handles.ring.geometry.dispose();
        (handles.ring.material as THREE.Material).dispose();
        handles.pipGroup.children.forEach((child) => {
          const m = child as THREE.LineLoop;
          m.geometry.dispose();
        });
        // Pip material is shared across all pips of one orbit;
        // dispose once from the first child if present.
        const firstPip = handles.pipGroup.children[0] as THREE.LineLoop | undefined;
        if (firstPip) (firstPip.material as THREE.Material).dispose();
      }
      substratePips.children.forEach((child) => {
        const m = child as THREE.LineLoop;
        m.geometry.dispose();
      });
      const firstSubstratePip = substratePips.children[0] as THREE.LineLoop | undefined;
      if (firstSubstratePip) (firstSubstratePip.material as THREE.Material).dispose();
    };
  }, [sideOrbits, substratePips]);

  return (
    <>
      {/* Substrate meridian pips — top + bottom cardinal diamonds
          on the brandmark ring's rim. NO hairline guide ring here —
          the brandmark particle cloud IS the centre ring. */}
      <primitive object={substratePips} />

      {/* Side orbits — emerge from substrate centre by sliding to
          their home centres and scaling up in parallel. Each side
          orbit carries its own primary ring + cardinal pips (built
          inside `buildSideOrbit`). */}
      {sideOrbits.map((handles) => (
        <primitive key={handles.group.name} object={handles.group} />
      ))}
    </>
  );
}
