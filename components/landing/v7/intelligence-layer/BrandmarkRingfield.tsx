"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { buildBrandmarkParticles } from "./brandmarkParticles";
import {
  DIAMOND_SIZE,
  HALO_DOT_COUNT,
  RING_GEOM,
  RING_KINDS,
  RING_SEGMENTS,
  SUB_ORBIT_RADII,
  SUB_ORBIT_SPIN_RATE,
  TICK_LENGTH,
  splitExtrude,
  splitRotation,
  useIlayerGeomStore,
  type RingKind,
} from "./intelligenceLayerGeom";
import { useIlayerProgressStore } from "./useIlayerProgress";

/**
 * BrandmarkRingfield — the ONE-artifact 3D scene for the
 * intelligence-layer section (ADR-012 v5).
 *
 * Single parent group containing:
 *   - the brandmark particle cloud (sampled from BRANDMARK_FILLED_PATHS,
 *     same data as the global brandmark canvas per ADR-011)
 *   - three coaxial hairline `LineLoop` rings (Navigate / Encode / Build)
 *   - bearing ticks + diamond markers as children of each ring
 *   - sub-orbits + halo dots around the brandmark (Section 02 sigil grammar)
 *   - flow arcs between adjacent rings, geometry rebuilt each frame
 *
 * Single-scalar `splitProgress` (read from `useIlayerProgressStore`)
 * drives:
 *   - parent group `rotation.y` via the piecewise envelope in
 *     `splitRotation(progress)`
 *   - per-ring `position.z` via `splitExtrude(progress) * finalZ`
 *   - tick / diamond `scale.setScalar(extrude)` so they grow / shrink
 *     WITH the ring's emergence (NOT via opacity)
 *   - flow arc geometry rebuilt from live ring positions (length 0
 *     when rings coincident, full length at peak split)
 *
 * NO `material.opacity` writes for major scene elements. Every
 * appearance / disappearance is geometric (translation / scale).
 * Boundary handoffs are HARD SWAPS via the
 * `[data-ilayer-mode="r3f"]` CSS attribute toggle (set by
 * `IntelligenceLayerPortal` on canvas mount); at progress 0 and
 * progress 1 the parent rotation is exactly 0 and the rings are
 * coincident at z=0, so the brandmark cloud is axis-aligned and
 * matches the SVG dock at the boundary instant.
 */

const _projVec = new THREE.Vector3();

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
 * evenly spaced around a circle of `radius` in the XY plane. Each
 * tick is a 2-vertex segment from `(radius - tickLength)` to
 * `radius` along its bearing.
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
 * Build a 4-vertex `LineLoop` diamond (rotated square) — "diamonds
 * not dots" per the brand grammar. Centred at origin in the XY
 * plane.
 */
function buildDiamondGeometry(size: number): THREE.BufferGeometry {
  const positions = new Float32Array([
    0,
    size,
    0, // top
    size,
    0,
    0, // right
    0,
    -size,
    0, // bottom
    -size,
    0,
    0, // left
  ]);
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return geom;
}

/**
 * EncodeRectReporter — projects the encode ring's centre + radius
 * to client (CSS) pixels and writes them into `useIlayerGeomStore`
 * so the substrate dock anchor in DOM can match its size for the
 * boundary HARD SWAP.
 *
 * Reads the encode group's WORLD position (so even if the parent
 * group is rotated, the projection accounts for it). Throttled to
 * once per second on resize-stable frames; updates more often if
 * the canvas size changes.
 */
function EncodeRectReporter({
  encodeGroupRef,
}: {
  encodeGroupRef: React.RefObject<THREE.Group | null>;
}) {
  const { camera, size } = useThree();
  const setEncodeRect = useIlayerGeomStore((s) => s.setEncodeRect);
  const lastWriteRef = useRef(0);
  const lastSizeRef = useRef({ w: 0, h: 0 });

  useFrame(() => {
    const group = encodeGroupRef.current;
    if (!group) return;

    // Update on resize OR every ~500ms (the substrate dock anchor's
    // CSS rect doesn't need higher precision; the rotation envelope
    // moves the projected rect across the section but the anchor's
    // job is just to hold the boundary swap visual position, which
    // is at progress 0 = head-on = static).
    const now = performance.now();
    const sizeChanged =
      lastSizeRef.current.w !== size.width || lastSizeRef.current.h !== size.height;
    if (!sizeChanged && now - lastWriteRef.current < 500) return;
    lastSizeRef.current = { w: size.width, h: size.height };
    lastWriteRef.current = now;

    // Project the encode ring's centre (group origin) to NDC, then
    // to CSS pixel coords. Use the AT-REST ring centre (no parent
    // rotation) by sampling the local origin and applying only the
    // group's own world matrix excluding ancestor rotation. Easiest:
    // since the boundary swap fires at progress 0 (parent rotation
    // = 0), we just project the local origin through the camera.
    _projVec.set(0, 0, 0);
    group.localToWorld(_projVec);
    _projVec.project(camera);
    const cx = (_projVec.x * 0.5 + 0.5) * size.width;
    const cy = (1 - (_projVec.y * 0.5 + 0.5)) * size.height;

    // Project a point at radius along scene-X to derive the disc's
    // projected horizontal radius in pixels.
    _projVec.set(RING_GEOM.encode.radius, 0, 0);
    group.localToWorld(_projVec);
    _projVec.project(camera);
    const edgeX = (_projVec.x * 0.5 + 0.5) * size.width;
    const radiusPx = Math.max(8, Math.abs(edgeX - cx));
    const diameter = radiusPx * 2;

    setEncodeRect({
      x: cx - radiusPx,
      y: cy - radiusPx,
      width: diameter,
      height: diameter,
    });
  });

  return null;
}

/**
 * Build a single ring (Encode / Navigate / Build) as a child group
 * containing: the hairline LineLoop, optional bearing ticks, optional
 * diamond markers. Returns the group + handles for per-frame updates.
 */
function buildRing(kind: RingKind): RingHandles {
  const geom = RING_GEOM[kind];
  const group = new THREE.Group();
  group.name = `ring-${kind}`;

  // Hairline ring. LineBasicMaterial.linewidth is clamped to 1px on
  // most WebGL drivers — that IS the hairline aesthetic per the
  // brand grammar.
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
  // (scale grows with the ring's emergence).
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
    ticks.scale.setScalar(0); // start retracted (rings coincident, ticks invisible)
    group.add(ticks);
  }

  // Diamond markers at specified angles. Each is a small LineLoop
  // diamond placed on the ring's outer edge. Wrapped in a parent
  // group so we can scale them as a unit with the ring's emergence.
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
 * Sub-orbits group — concentric hairline `LineLoop`s around the
 * brandmark cloud, in `--dawn-30` (guide register). Plus halo dot
 * diamonds on the outermost orbit. Spins autonomously on Z (the
 * ambient celestial breath that matches Section 02's `.sigil__orbits`).
 */
function buildSubOrbits(): { group: THREE.Group; spin: THREE.Group } {
  const root = new THREE.Group();
  root.name = "sub-orbits";

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
  // sub-orbit. Match the encode ring's `--gold` colour so they read
  // as the brandmark's own attendants.
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
 * FlowArcs — two `LineSegments` connecting Navigate -> Encode and
 * Encode -> Build. Geometry is rebuilt every frame from the rings'
 * live world positions so the arcs naturally extrude from length 0
 * (when rings are coincident) to full length (when rings are at
 * +/- finalZ). NO opacity envelope; the arcs are geometrically
 * absent when rings are coincident.
 *
 * Drawn as straight line segments for simplicity (the rings are at
 * the same XY position, just different Z, so the arc is a straight
 * line in Z). If we want curved arcs in the future, we can add
 * intermediate vertices.
 */
function buildFlowArcs(): {
  group: THREE.Group;
  inflow: THREE.LineSegments;
  outflow: THREE.LineSegments;
} {
  const group = new THREE.Group();
  group.name = "flow-arcs";

  // Each arc has 2 vertices (start + end). Positions are set per
  // frame from live ring positions.
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

  // Build everything once; geometry is shared across renders. The
  // brandmark particles are sampled inside useMemo so we don't pay
  // the sampling cost on every render.
  const { brandmark, rings, subOrbits, flowArcs } = useMemo(() => {
    const brandmark = buildBrandmarkParticles();
    const rings: Record<RingKind, RingHandles> = {
      build: buildRing("build"),
      encode: buildRing("encode"),
      navigate: buildRing("navigate"),
    };
    const subOrbits = buildSubOrbits();
    const flowArcs = buildFlowArcs();
    return { brandmark, rings, subOrbits, flowArcs };
  }, []);

  // Wire the built groups into refs we can use in useFrame. We use
  // refs rather than R3F children because the imperative
  // construction above gives us the cleanest control over the
  // material / geometry lifecycle.
  const buildGroupRef = useRef<THREE.Group>(rings.build.group);
  const encodeGroupRef = useRef<THREE.Group>(rings.encode.group);
  const navigateGroupRef = useRef<THREE.Group>(rings.navigate.group);
  const subOrbitsSpinRef = useRef<THREE.Group>(subOrbits.spin);
  const inflowRef = useRef<THREE.LineSegments>(flowArcs.inflow);
  const outflowRef = useRef<THREE.LineSegments>(flowArcs.outflow);

  useFrame((_, dt) => {
    const progress = useIlayerProgressStore.getState().progress;

    // Parent group rotation — the SINGLE thing that makes the user
    // read "ONE artifact turning" rather than "compositing layers".
    const parent = parentGroupRef.current;
    if (parent) {
      parent.rotation.y = splitRotation(progress);

      // ADR-012 v5 visibility gate — visible whenever the section
      // is being scrolled through. The progress envelope from the
      // section's ScrollTrigger (`top 80% -> bottom 20%`) starts
      // ramping the moment the section's TOP crosses the viewport's
      // 80% line, so any progress > 0 means the user has scrolled
      // far enough that the section is meaningfully in view.
      //
      // Setting `parent.visible = true` always while the canvas is
      // mounted lets the R3F particle cloud + rings paint inside
      // the section's bounds — and because the canvas's DOM
      // container (`.ilayer__artifact { inset:0 }` inside the
      // section element) naturally clips to the section's box, the
      // brandmark cannot be seen from sections above or below.
      //
      // The SVG dock at the substrate anchor is hidden by
      // IntelligenceLayerPortal's `applyR3FDockMask()` so there is
      // never a frame where two brandmarks paint at the substrate
      // position; the R3F particle cloud is the SOLE painter for
      // the section's read beat.
      parent.visible = true;
    }

    // Per-ring Z extrusion. Encode is anchored at z=0 (it's the
    // centre); navigate and build extrude symmetrically.
    const extrude = splitExtrude(progress);
    const navZ = RING_GEOM.navigate.finalZ * extrude;
    const bldZ = RING_GEOM.build.finalZ * extrude;
    if (navigateGroupRef.current) navigateGroupRef.current.position.z = navZ;
    if (buildGroupRef.current) buildGroupRef.current.position.z = bldZ;

    // Bearing ticks + diamond markers scale with the ring's
    // emergence. NOT opacity — they grow geometrically from a point
    // at the ring's centre to their full position on the rim.
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
    //
    // Sample each arc at the "0deg" position (top of ring) since
    // that's where the diamond markers sit; the arc visually
    // connects diamond to diamond.
    const inflow = inflowRef.current;
    const outflow = outflowRef.current;
    if (inflow) {
      const pos = inflow.geometry.attributes.position as THREE.BufferAttribute;
      // Navigate -> Encode (front to centre): from Navigate's top at +Z to Encode's top at z=0
      pos.setXYZ(0, 0, RING_GEOM.navigate.radius, navZ);
      pos.setXYZ(1, 0, RING_GEOM.encode.radius, 0);
      pos.needsUpdate = true;
    }
    if (outflow) {
      const pos = outflow.geometry.attributes.position as THREE.BufferAttribute;
      // Encode -> Build (centre to back): from Encode's top at z=0 to Build's top at -Z
      pos.setXYZ(0, 0, RING_GEOM.encode.radius, 0);
      pos.setXYZ(1, 0, RING_GEOM.build.radius, bldZ);
      pos.needsUpdate = true;
    }

    // Sub-orbits autonomous breath — slow Z-axis rotation
    // independent of scroll, matches Section 02's `.sigil__orbits`.
    if (subOrbitsSpinRef.current) {
      subOrbitsSpinRef.current.rotation.z += SUB_ORBIT_SPIN_RATE * dt;
    }
  });

  // Cleanup geometries / materials on unmount.
  useEffect(() => {
    return () => {
      brandmark.geometry.dispose();
      brandmark.material.dispose();
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
  }, [brandmark, rings, flowArcs]);

  return (
    <>
      {/* Lighting NOT needed — we use only LineBasicMaterial /
          PointsMaterial which are unlit by design. The brand
          grammar wants flat hairline strokes, no PBR. */}

      {/* Parent group — one transform applied to everything inside.
          rotation.y written each frame; rings' position.z written
          per child; child scales written per child. */}
      <group ref={parentGroupRef}>
        {/* Brandmark particle cloud — the artifact's identity, in 3D
            space at z=0. Rotates with the parent (at edge-on
            becomes a thin vertical line of particles). */}
        <points geometry={brandmark.geometry} material={brandmark.material} frustumCulled={false} />

        {/* Sub-orbits + halo dots — celestial decoration around the
            brandmark, breathing on its own Z spin. */}
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

        {/* Encode rect projector — writes the encode ring's screen
            rect into useIlayerGeomStore so the substrate dock
            anchor in DOM matches its size for the boundary HARD
            SWAP. */}
        <EncodeRectReporter encodeGroupRef={encodeGroupRef} />
      </group>
    </>
  );
}
