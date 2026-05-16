"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  DIAMOND_SIZE,
  HALO_DOT_COUNT,
  RING_GEOM,
  RING_KINDS,
  RING_SEGMENTS,
  SUB_ORBIT_RADII,
  SUB_ORBIT_SPIN_RATE,
  TICK_LENGTH,
  splitEmerge,
  splitExtrude,
  type RingKind,
} from "./intelligenceLayerGeom";
import { useBrandmarkJourneyStore } from "@/lib/stores/brandmarkJourneyStore";

/**
 * BrandmarkRingfield — the rings + decorations R3F scene for the
 * intelligence-layer section (ADR-013).
 *
 * Rings-only. The brandmark cloud is owned by the global painter
 * (`BrandmarkParticleStation` inside `BrandmarkParticleCanvas`),
 * which reads the same `BrandmarkTransform` we do here. Both render
 * at the same screen pixels at the substrate keyframe (the painter
 * draws the cloud at `transform.rect`; the scene's encode ring
 * projects to approximately the same area).
 *
 * Single parent group containing:
 *   - three coaxial hairline `LineLoop` rings (Navigate / Encode / Build)
 *   - bearing ticks + diamond markers as children of each ring
 *   - sub-orbits + halo dots around the brandmark centre (Section 02
 *     sigil grammar)
 *   - flow arcs between adjacent rings, geometry rebuilt each frame
 *
 * Each frame the scene reads:
 *   - `transform.rotationY` → parent group `rotation.y` (TRUE 3D
 *     rotation of the rings; the painter applies a 2D squash to the
 *     brandmark cloud reading the same value so they stay coupled)
 *   - `transform.ringsActive` → parent group `visible` (rings ONLY
 *     paint while parked at substrate; outside that window the
 *     brandmark cloud continues but the rings are absent)
 *   - `transform.ringProgress` → `splitExtrude` (ring depth) +
 *     `splitEmerge` (decoration geometric scale) + tick / diamond /
 *     arc geometric reveals
 *
 * NO `material.opacity` writes for decoration appearance — Principle
 * 4 of ADR-013. Every emerge is GEOMETRIC (group.scale.setScalar).
 */

interface RingHandles {
  group: THREE.Group;
  ring: THREE.LineLoop;
  ticks: THREE.LineSegments | null;
  diamondGroup: THREE.Group | null;
}

/**
 * Build a hairline ring as `THREE.LineLoop` of `RING_SEGMENTS`
 * vertices around a circle of `radius` in the XY plane.
 */
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

/**
 * Build a `LineSegments` geometry of N short radial tick marks
 * evenly spaced around a circle of `radius` in the XY plane.
 */
function buildTicksGeometry(
  radius: number,
  count: number,
  tickLength: number
): THREE.BufferGeometry {
  if (count <= 0) {
    return new THREE.BufferGeometry();
  }
  const positions = new Float32Array(count * 2 * 3);
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2;
    const cx = Math.cos(t);
    const cy = Math.sin(t);
    const r0 = radius - tickLength;
    const r1 = radius;
    positions[i * 6] = cx * r0;
    positions[i * 6 + 1] = cy * r0;
    positions[i * 6 + 2] = 0;
    positions[i * 6 + 3] = cx * r1;
    positions[i * 6 + 4] = cy * r1;
    positions[i * 6 + 5] = 0;
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return geom;
}

/**
 * Build a 4-vertex `LineLoop` diamond (rotated square).
 */
function buildDiamondGeometry(size: number): THREE.BufferGeometry {
  const positions = new Float32Array([0, size, 0, size, 0, 0, 0, -size, 0, -size, 0, 0]);
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return geom;
}

/**
 * Build a single ring (Encode / Navigate / Build) as a child group
 * containing: the hairline LineLoop, optional bearing ticks, optional
 * diamond markers. Returns the group + handles for per-frame updates.
 *
 * The whole ring group's `scale` is driven by `splitEmerge` so the
 * ring grows from a point at the brandmark centre to its full
 * radius — a geometric reveal, not an opacity fade.
 */
function buildRing(kind: RingKind): RingHandles {
  const geom = RING_GEOM[kind];
  const group = new THREE.Group();
  group.name = `ring-${kind}`;
  // Start at scale 0 — the splitEmerge envelope grows the ring from
  // the brandmark's centre to its full radius. Per Principle 4 the
  // reveal is geometric: no opacity fades.
  group.scale.setScalar(0);

  const ringGeometry = buildRingGeometry(geom.radius);
  const ringMaterial = new THREE.LineBasicMaterial({
    color: geom.color,
    transparent: true,
    opacity: kind === "build" ? 0.5 : kind === "navigate" ? 0.7 : 0.92,
    depthWrite: false,
  });
  const ringLoop = new THREE.LineLoop(ringGeometry, ringMaterial);
  group.add(ringLoop);

  // Bearing ticks (only on Navigate / Build per RING_GEOM.tickCount).
  // Wrapped in their own group so we can scale them independently
  // (scale grows with the ring's extrude beat after emerge completes).
  let ticks: THREE.LineSegments | null = null;
  if (geom.tickCount > 0) {
    const ticksGeometry = buildTicksGeometry(geom.radius, geom.tickCount, TICK_LENGTH);
    const ticksMaterial = new THREE.LineBasicMaterial({
      color: geom.color,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    ticks = new THREE.LineSegments(ticksGeometry, ticksMaterial);
    ticks.scale.setScalar(0); // start retracted (extrude beat scales them up)
    group.add(ticks);
  }

  // Diamond markers at specified angles. Each is a small LineLoop
  // diamond placed on the ring's outer edge.
  let diamondGroup: THREE.Group | null = null;
  if (geom.diamondAngles.length > 0) {
    diamondGroup = new THREE.Group();
    diamondGroup.scale.setScalar(0); // start retracted
    const diamondGeometry = buildDiamondGeometry(DIAMOND_SIZE);
    const diamondMaterial = new THREE.LineBasicMaterial({
      color: geom.color,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    for (const angleDeg of geom.diamondAngles) {
      const angleRad = (angleDeg * Math.PI) / 180;
      const diamond = new THREE.LineLoop(diamondGeometry, diamondMaterial);
      // 0deg is "top of ring" per RING_GEOM convention; standard
      // trig has 0 = right, so subtract pi/2.
      const t = angleRad - Math.PI / 2;
      diamond.position.set(Math.cos(t) * geom.radius, Math.sin(t) * geom.radius, 0);
      diamondGroup.add(diamond);
    }
    group.add(diamondGroup);
  }

  return { group, ring: ringLoop, ticks, diamondGroup };
}

/**
 * Sub-orbits + halo dots — concentric hairlines around the brandmark
 * cloud, spinning autonomously. Wrapped in a parent group that scales
 * via `splitEmerge` so the sub-orbits + halo grow geometrically from
 * the brandmark's centre when the substrate beat begins.
 */
function buildSubOrbits(): { group: THREE.Group; spin: THREE.Group } {
  const root = new THREE.Group();
  root.name = "sub-orbits";
  // Scale envelope drives the geometric emerge. Per Principle 4.
  root.scale.setScalar(0);

  // Spin group — what we rotate per frame. Parent stays still so its
  // transform composes cleanly with the ringfield's parent group.
  const spin = new THREE.Group();
  root.add(spin);

  const orbitMaterial = new THREE.LineBasicMaterial({
    color: "#a99e8a", // --gold-soft / dawn-deep
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });

  for (const radius of SUB_ORBIT_RADII) {
    const orbit = new THREE.LineLoop(buildRingGeometry(radius), orbitMaterial);
    spin.add(orbit);
  }

  // Halo dots — small diamonds at cardinal points on the OUTERMOST
  // sub-orbit. Match the encode ring's --gold colour so they read as
  // the brandmark's own attendants.
  const haloRadius = SUB_ORBIT_RADII[SUB_ORBIT_RADII.length - 1];
  const haloMaterial = new THREE.LineBasicMaterial({
    color: "#caa554", // --gold
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  const haloGeometry = buildDiamondGeometry(DIAMOND_SIZE * 0.7);
  for (let i = 0; i < HALO_DOT_COUNT; i++) {
    const angle = (i / HALO_DOT_COUNT) * Math.PI * 2 - Math.PI / 2;
    const dot = new THREE.LineLoop(haloGeometry, haloMaterial);
    dot.position.set(Math.cos(angle) * haloRadius, Math.sin(angle) * haloRadius, 0);
    spin.add(dot);
  }

  return { group: root, spin };
}

/**
 * FlowArcs — two `LineSegments` connecting Navigate ⇌ Encode and
 * Encode ⇌ Build. Geometry is rebuilt every frame from the rings'
 * live world positions so the arcs naturally extrude from length 0
 * (when rings are coincident) to full length (when rings are at
 * ±finalZ). NO opacity envelope; the arcs are geometrically absent
 * when rings are coincident.
 */
function buildFlowArcs(): {
  group: THREE.Group;
  inflow: THREE.LineSegments;
  outflow: THREE.LineSegments;
} {
  const group = new THREE.Group();
  group.name = "flow-arcs";

  const inflowGeom = new THREE.BufferGeometry();
  inflowGeom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
  const outflowGeom = new THREE.BufferGeometry();
  outflowGeom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));

  const arcMaterial = new THREE.LineBasicMaterial({
    color: "#caa554", // --gold (signal)
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  });

  const inflow = new THREE.LineSegments(inflowGeom, arcMaterial);
  const outflow = new THREE.LineSegments(outflowGeom, arcMaterial);
  group.add(inflow);
  group.add(outflow);

  return { group, inflow, outflow };
}

/**
 * BrandmarkRingfield — the public component. Mounts the parent
 * group + all children + the per-frame envelope writer.
 */
export function BrandmarkRingfield() {
  const parentGroupRef = useRef<THREE.Group>(null);

  // Build everything once; geometry is shared across renders.
  const { rings, subOrbits, flowArcs } = useMemo(() => {
    const rings: Record<RingKind, RingHandles> = {
      build: buildRing("build"),
      encode: buildRing("encode"),
      navigate: buildRing("navigate"),
    };
    const subOrbits = buildSubOrbits();
    const flowArcs = buildFlowArcs();
    return { rings, subOrbits, flowArcs };
  }, []);

  // Wire built groups into refs we can use in useFrame. We use refs
  // rather than R3F children because the imperative construction
  // above gives us the cleanest control over the material / geometry
  // lifecycle.
  const buildGroupRef = useRef<THREE.Group>(rings.build.group);
  const encodeGroupRef = useRef<THREE.Group>(rings.encode.group);
  const navigateGroupRef = useRef<THREE.Group>(rings.navigate.group);
  const subOrbitsSpinRef = useRef<THREE.Group>(subOrbits.spin);
  const inflowRef = useRef<THREE.LineSegments>(flowArcs.inflow);
  const outflowRef = useRef<THREE.LineSegments>(flowArcs.outflow);

  useFrame((_, dt) => {
    const transform = useBrandmarkJourneyStore.getState().transform;
    const ringProgress = transform.ringProgress;
    const ringsActive = transform.ringsActive;

    // === Parent group: rotation + visibility ===
    // Rotation Y comes from the SAME source the global painter
    // reads — the journey transform — so rings and brandmark cloud
    // stay perfectly coupled. Rings rotate in TRUE 3D; the painter
    // applies a 2D squash that approximates the same Y-axis rotation
    // (ADR-013 Q1).
    const parent = parentGroupRef.current;
    if (parent) {
      parent.rotation.y = transform.rotationY;
      // Rings paint ONLY while parked at the substrate keyframe.
      // Outside that window the global painter continues drawing the
      // brandmark cloud alone (no rings); inside, rings + decorations
      // emerge geometrically around the cloud.
      parent.visible = ringsActive;
    }

    // When rings are inactive, skip the per-frame envelope writes.
    // The sub-orbits' autonomous spin still ticks so the breath
    // looks continuous when the scene comes back into view.
    if (!ringsActive) {
      if (subOrbitsSpinRef.current) {
        subOrbitsSpinRef.current.rotation.z += SUB_ORBIT_SPIN_RATE * dt;
      }
      return;
    }

    // === splitEmerge — geometric decoration reveal (Principle 4) ===
    // Sub-orbits + halo dots + encode ring grow from a point at the
    // brandmark's centre to their full size over the first 8% of
    // progress, then retract to 0 over the last 8%. NEVER an opacity
    // fade — group.scale only.
    const emerge = splitEmerge(ringProgress);
    if (encodeGroupRef.current) encodeGroupRef.current.scale.setScalar(emerge);
    if (subOrbits.group) subOrbits.group.scale.setScalar(emerge);

    // === splitExtrude — side ring depth + tick / diamond scale ===
    // Encode stays at z=0 (anchored centre); navigate and build
    // extrude symmetrically along Z. Side ring groups also use the
    // emerge envelope so they grow from the centre before extruding.
    const extrude = splitExtrude(ringProgress);
    const navZ = RING_GEOM.navigate.finalZ * extrude;
    const bldZ = RING_GEOM.build.finalZ * extrude;
    if (navigateGroupRef.current) {
      navigateGroupRef.current.position.z = navZ;
      navigateGroupRef.current.scale.setScalar(emerge);
    }
    if (buildGroupRef.current) {
      buildGroupRef.current.position.z = bldZ;
      buildGroupRef.current.scale.setScalar(emerge);
    }

    // Bearing ticks + diamond markers scale with the ring's emergence
    // AND the extrude beat — they're only "on the rim" once the ring
    // has emerged AND extruded out. Geometric grow from a point.
    const navHandles = rings.navigate;
    const bldHandles = rings.build;
    if (navHandles.ticks) navHandles.ticks.scale.setScalar(extrude);
    if (navHandles.diamondGroup) navHandles.diamondGroup.scale.setScalar(extrude);
    if (bldHandles.ticks) bldHandles.ticks.scale.setScalar(extrude);
    if (bldHandles.diamondGroup) bldHandles.diamondGroup.scale.setScalar(extrude);

    // Flow arcs — geometry rebuilt from live ring positions. When
    // rings are coincident (extrude = 0), the arcs are 0-length
    // segments at z=0 (geometrically absent). When extruded, they
    // span from one ring's edge to the next ring's edge in Z.
    const inflow = inflowRef.current;
    const outflow = outflowRef.current;
    if (inflow) {
      const pos = inflow.geometry.attributes.position as THREE.BufferAttribute;
      // Navigate -> Encode (front to centre): Navigate's top at +Z to Encode's top at z=0
      pos.setXYZ(0, 0, RING_GEOM.navigate.radius, navZ);
      pos.setXYZ(1, 0, RING_GEOM.encode.radius, 0);
      pos.needsUpdate = true;
    }
    if (outflow) {
      const pos = outflow.geometry.attributes.position as THREE.BufferAttribute;
      // Encode -> Build (centre to back): Encode's top at z=0 to Build's top at -Z
      pos.setXYZ(0, 0, RING_GEOM.encode.radius, 0);
      pos.setXYZ(1, 0, RING_GEOM.build.radius, bldZ);
      pos.needsUpdate = true;
    }

    // Sub-orbits autonomous breath — slow Z-axis rotation independent
    // of scroll, matches Section 02's `.sigil__orbits`.
    if (subOrbitsSpinRef.current) {
      subOrbitsSpinRef.current.rotation.z += SUB_ORBIT_SPIN_RATE * dt;
    }
  });

  // Cleanup geometries / materials on unmount.
  useEffect(() => {
    return () => {
      for (const kind of RING_KINDS) {
        const handles = rings[kind];
        handles.ring.geometry.dispose();
        (handles.ring.material as THREE.Material).dispose();
        handles.ticks?.geometry.dispose();
        if (handles.ticks) (handles.ticks.material as THREE.Material).dispose();
        if (handles.diamondGroup) {
          handles.diamondGroup.children.forEach((child) => {
            const m = child as THREE.LineLoop;
            m.geometry.dispose();
            (m.material as THREE.Material).dispose();
          });
        }
      }
      flowArcs.inflow.geometry.dispose();
      flowArcs.outflow.geometry.dispose();
      (flowArcs.inflow.material as THREE.Material).dispose();
    };
  }, [rings, flowArcs]);

  return (
    <>
      {/* Parent group — one transform applied to everything inside.
          rotation.y written each frame from the journey transform;
          rings' position.z + scale + decorations' scale written per
          child. */}
      <group ref={parentGroupRef}>
        {/* Sub-orbits + halo dots — celestial decoration around the
            brandmark cloud's centre, breathing on its own Z spin. */}
        <primitive object={subOrbits.group} />

        {/* Three coaxial rings. Encode is at z=0 (anchor); navigate
            extrudes forward, build extrudes backward. */}
        <primitive object={rings.encode.group} />
        <primitive object={rings.navigate.group} />
        <primitive object={rings.build.group} />

        {/* Flow arcs — geometry rebuilt each frame from live ring
            positions; length 0 when rings coincident, full length
            at peak split. */}
        <primitive object={flowArcs.group} />
      </group>
    </>
  );
}
