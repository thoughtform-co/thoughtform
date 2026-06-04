"use client";

/**
 * IntelligenceArtifact — the R3F scene graph for the intelligence-
 * layer artifact demo. Owns:
 *
 *   - the polygonal deck (3 concentric tracks + tick markers)
 *   - the substrate core (geodesic sphere + brandmark particle cloud)
 *   - the knowledge graph struts (sphere -> deck)
 *   - the trusted sources pips + inbound channels
 *   - the headless surface pylons + endpoint diamonds
 *   - the gateway descent ring (front pass-through during alignment)
 *
 * All geometry is built once in `useMemo` and disposed on unmount.
 * Per-frame work writes material opacities and a few transforms only.
 * Reveal scalars come from `phasePresence(progress, PHASES.x)`.
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { sampleShape } from "@/lib/brandmark/sampleShape";
import { BRANDMARK_FULL_PATHS, BRANDMARK_SHAPE_KEYS } from "@/lib/brandmark/shapes";
import {
  ARTIFACT_LABELS,
  BRANDMARK_HALF_EXTENT,
  BRANDMARK_PARTICLE_COUNT,
  CAMERA_LOOK_AT,
  CAMERA_ORBIT_LIFT,
  CAMERA_ORBIT_PERIOD_SEC,
  CAMERA_ORBIT_RADIUS,
  CAMERA_POSITION,
  COLOR_DAWN,
  COLOR_GOLD,
  COLOR_GOLD_RIM,
  DECK_INNER_RADIUS,
  DECK_INNER_SIDES,
  DECK_LIFT,
  DECK_MID_RADIUS,
  DECK_MID_SIDES,
  DECK_OUTER_RADIUS,
  DECK_OUTER_SIDES,
  GATEWAY_RADIUS,
  GATEWAY_Z_END,
  GATEWAY_Z_START,
  GRAPH_STRUT_COUNT,
  GRAPH_STRUT_ROOT_RADIUS,
  OUTER_TICKS_PER_SIDE,
  PHASES,
  PYLON_CAP_SIZE,
  PYLON_COUNT,
  PYLON_HEIGHT,
  PYLON_ROOT_RADIUS,
  SOURCE_CHANNEL_INNER_RADIUS,
  SOURCE_CHANNEL_MOTE_COUNT,
  SOURCE_PIP_COUNT,
  SUBSTRATE_DETAIL,
  SUBSTRATE_INNER_DETAIL,
  SUBSTRATE_LIFT,
  SUBSTRATE_RADIUS,
  clamp01,
  lerp,
  phasePresence,
  smoothstep,
} from "./artifactGeom";

interface IntelligenceArtifactProps {
  /** Global progress in [0, 1]. Drives every reveal envelope. */
  progress: number;
  /** When true, autonomous motion (clock-driven spin, mote drift) is
   *  damped. Static topology only. */
  reducedMotion?: boolean;
}

// ── Geometry builders ─────────────────────────────────────────────────

/** Closed polygon as a `LineLoop` geometry on the XZ plane. */
function buildPolygonGeometry(radius: number, sides: number, y: number = 0): THREE.BufferGeometry {
  const positions = new Float32Array(sides * 3);
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    positions[i * 3] = Math.cos(a) * radius;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(a) * radius;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

/** Tick markers as outward-pointing `LineSegments` on the XZ plane.
 *  Length is short so they read as bearing ticks, not spokes. */
function buildOuterTicks(
  radius: number,
  count: number,
  length: number,
  y: number = 0
): THREE.BufferGeometry {
  const positions = new Float32Array(count * 2 * 3);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    positions[i * 6] = c * radius;
    positions[i * 6 + 1] = y;
    positions[i * 6 + 2] = s * radius;
    positions[i * 6 + 3] = c * (radius + length);
    positions[i * 6 + 4] = y;
    positions[i * 6 + 5] = s * (radius + length);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

/** Plated segments along a polygon: short arcs that sit inside (or on
 *  top of) the polygon edges, with gaps between them. Reads as
 *  engineered plating rather than a smooth ring. */
function buildPlatedSegments(
  radius: number,
  sides: number,
  segmentFill: number,
  y: number = 0
): THREE.BufferGeometry {
  // 2 vertices per drawn segment, 2 segments per polygon side (a small
  // chord on either half of the side) — gives a clean dashed read.
  const SUBDIVISIONS = 4;
  const positions: number[] = [];
  for (let i = 0; i < sides; i++) {
    const a0 = (i / sides) * Math.PI * 2;
    const a1 = ((i + 1) / sides) * Math.PI * 2;
    for (let s = 0; s < SUBDIVISIONS; s++) {
      const tA = s / SUBDIVISIONS;
      const tB = tA + segmentFill / SUBDIVISIONS;
      if (tB > 1) continue;
      const aA = lerp(a0, a1, tA);
      const aB = lerp(a0, a1, tB);
      positions.push(Math.cos(aA) * radius, y, Math.sin(aA) * radius);
      positions.push(Math.cos(aB) * radius, y, Math.sin(aB) * radius);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return g;
}

/** Diamond (rotated square) as a `LineLoop` on the XY plane — meant to
 *  be billboarded toward the camera. */
function buildDiamondGeometry(size: number): THREE.BufferGeometry {
  const positions = new Float32Array([0, size, 0, size, 0, 0, 0, -size, 0, -size, 0, 0]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

/** Filled diamond as a solid mesh (two triangles). */
function buildFilledDiamondGeometry(size: number): THREE.BufferGeometry {
  const positions = new Float32Array([
    0,
    size,
    0,
    size,
    0,
    0,
    0,
    -size,
    0,
    0,
    size,
    0,
    0,
    -size,
    0,
    -size,
    0,
    0,
  ]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.computeVertexNormals();
  return g;
}

/** Vertical mast for a pylon: a short `LineSegments` from the deck up
 *  to the pylon height. */
function buildPylonMastGeometry(
  height: number,
  rootRadius: number,
  pylonCount: number
): THREE.BufferGeometry {
  const positions = new Float32Array(pylonCount * 2 * 3);
  for (let i = 0; i < pylonCount; i++) {
    const a = (i / pylonCount) * Math.PI * 2;
    const x = Math.cos(a) * rootRadius;
    const z = Math.sin(a) * rootRadius;
    positions[i * 6] = x;
    positions[i * 6 + 1] = DECK_LIFT;
    positions[i * 6 + 2] = z;
    positions[i * 6 + 3] = x;
    positions[i * 6 + 4] = DECK_LIFT + height;
    positions[i * 6 + 5] = z;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

/** Inbound source channels: short radial line segments from outer pips
 *  toward the substrate. Stops short of the substrate so the channels
 *  point at it without crossing the sphere. */
function buildSourceChannelsGeometry(): THREE.BufferGeometry {
  const positions = new Float32Array(SOURCE_PIP_COUNT * 2 * 3);
  for (let i = 0; i < SOURCE_PIP_COUNT; i++) {
    const a = (i / SOURCE_PIP_COUNT) * Math.PI * 2 + Math.PI / SOURCE_PIP_COUNT;
    const c = Math.cos(a);
    const s = Math.sin(a);
    positions[i * 6] = c * DECK_OUTER_RADIUS;
    positions[i * 6 + 1] = DECK_LIFT * 0.5;
    positions[i * 6 + 2] = s * DECK_OUTER_RADIUS;
    positions[i * 6 + 3] = c * SOURCE_CHANNEL_INNER_RADIUS;
    positions[i * 6 + 4] = DECK_LIFT * 0.5;
    positions[i * 6 + 5] = s * SOURCE_CHANNEL_INNER_RADIUS;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

/** Source motes: deterministic dots along the inbound channels. Each
 *  mote carries a per-point phase so the painter can animate them
 *  drifting toward the substrate when not in reduced-motion. */
interface SourceMotes {
  geometry: THREE.BufferGeometry;
  phases: Float32Array;
  channelDirs: Float32Array;
  channelOrigins: Float32Array;
}

function buildSourceMotes(): SourceMotes {
  const total = SOURCE_PIP_COUNT * SOURCE_CHANNEL_MOTE_COUNT;
  const positions = new Float32Array(total * 3);
  const phases = new Float32Array(total);
  const dirs = new Float32Array(SOURCE_PIP_COUNT * 3);
  const origins = new Float32Array(SOURCE_PIP_COUNT * 3);

  for (let i = 0; i < SOURCE_PIP_COUNT; i++) {
    const a = (i / SOURCE_PIP_COUNT) * Math.PI * 2 + Math.PI / SOURCE_PIP_COUNT;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const ox = c * DECK_OUTER_RADIUS;
    const oz = s * DECK_OUTER_RADIUS;
    const ix = c * SOURCE_CHANNEL_INNER_RADIUS;
    const iz = s * SOURCE_CHANNEL_INNER_RADIUS;
    origins[i * 3] = ox;
    origins[i * 3 + 1] = DECK_LIFT * 0.5;
    origins[i * 3 + 2] = oz;
    dirs[i * 3] = ix - ox;
    dirs[i * 3 + 1] = 0;
    dirs[i * 3 + 2] = iz - oz;

    for (let m = 0; m < SOURCE_CHANNEL_MOTE_COUNT; m++) {
      const idx = i * SOURCE_CHANNEL_MOTE_COUNT + m;
      const t = m / SOURCE_CHANNEL_MOTE_COUNT;
      positions[idx * 3] = lerp(ox, ix, t);
      positions[idx * 3 + 1] = DECK_LIFT * 0.5;
      positions[idx * 3 + 2] = lerp(oz, iz, t);
      // Phase offset so each mote enters the channel at a different
      // moment as the drift cycle advances.
      phases[idx] = t;
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return { geometry: g, phases, channelDirs: dirs, channelOrigins: origins };
}

/** Knowledge-graph struts: a fan of short hairlines from the substrate
 *  sphere's lower hemisphere down to the inner deck rim. Reads as
 *  semantic relations binding the substrate to the floor. */
function buildGraphStrutsGeometry(): THREE.BufferGeometry {
  const positions = new Float32Array(GRAPH_STRUT_COUNT * 2 * 3);
  for (let i = 0; i < GRAPH_STRUT_COUNT; i++) {
    const a = (i / GRAPH_STRUT_COUNT) * Math.PI * 2 + Math.PI / GRAPH_STRUT_COUNT;
    const c = Math.cos(a);
    const s = Math.sin(a);
    // Strut root on the deck rim.
    positions[i * 6] = c * GRAPH_STRUT_ROOT_RADIUS;
    positions[i * 6 + 1] = DECK_LIFT * 1.5;
    positions[i * 6 + 2] = s * GRAPH_STRUT_ROOT_RADIUS;
    // Strut tip on the lower equator of the substrate sphere.
    const tipY = SUBSTRATE_LIFT - SUBSTRATE_RADIUS * 0.6;
    const tipR = SUBSTRATE_RADIUS * 0.85;
    positions[i * 6 + 3] = c * tipR;
    positions[i * 6 + 4] = tipY;
    positions[i * 6 + 5] = s * tipR;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

/** Build the brandmark particle cloud as a 2D billboarded `Points`
 *  geometry. The brandmark is sampled face-on at viewBox normalised
 *  coordinates, then scaled to `BRANDMARK_HALF_EXTENT` so it visibly
 *  fills the substrate sphere from the camera's POV. */
interface BrandmarkCloud {
  geometry: THREE.BufferGeometry;
  count: number;
}

function buildBrandmarkCloud(): BrandmarkCloud {
  const sample = sampleShape({
    shapeKey: BRANDMARK_SHAPE_KEYS.full,
    paths: BRANDMARK_FULL_PATHS,
    viewBox: { x: 0, y: 0, width: 430.99, height: 436 },
    count: BRANDMARK_PARTICLE_COUNT,
  });

  const n = sample.count;
  const positions = new Float32Array(Math.max(1, n) * 3);
  if (n > 0) {
    for (let i = 0; i < n; i++) {
      // sampleShape returns home in [-0.5, 0.5] with (0,0) = viewBox
      // centre. Y is screen-down; flip so the brandmark reads upright.
      positions[i * 3] = sample.home[i * 2] * BRANDMARK_HALF_EXTENT * 2;
      positions[i * 3 + 1] = -sample.home[i * 2 + 1] * BRANDMARK_HALF_EXTENT * 2;
      positions[i * 3 + 2] = 0;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return { geometry: g, count: n };
}

// ── Component ────────────────────────────────────────────────────────

export function IntelligenceArtifact({
  progress,
  reducedMotion = false,
}: IntelligenceArtifactProps) {
  const rootRef = useRef<THREE.Group>(null);
  const brandmarkRef = useRef<THREE.Points>(null);
  const sourceMotesRef = useRef<THREE.Points>(null);
  const cameraOrbitT = useRef(0);

  // ── Geometries (built once) ──────────────────────────────────────
  const geoms = useMemo(() => {
    const outerPoly = buildPolygonGeometry(DECK_OUTER_RADIUS, DECK_OUTER_SIDES, 0);
    const midPoly = buildPolygonGeometry(DECK_MID_RADIUS, DECK_MID_SIDES, DECK_LIFT);
    const innerPoly = buildPolygonGeometry(DECK_INNER_RADIUS, DECK_INNER_SIDES, DECK_LIFT * 1.7);
    const outerTicks = buildOuterTicks(
      DECK_OUTER_RADIUS,
      DECK_OUTER_SIDES * OUTER_TICKS_PER_SIDE,
      0.12,
      0
    );
    const midPlates = buildPlatedSegments(DECK_MID_RADIUS, DECK_MID_SIDES, 0.62, DECK_LIFT);
    const innerHalo = buildPolygonGeometry(
      DECK_INNER_RADIUS - 0.18,
      DECK_INNER_SIDES * 2,
      DECK_LIFT * 1.7
    );

    // Substrate
    const icoOuter = new THREE.IcosahedronGeometry(SUBSTRATE_RADIUS, SUBSTRATE_DETAIL);
    const icoOuterEdges = new THREE.EdgesGeometry(icoOuter);
    icoOuter.dispose();
    const icoInner = new THREE.IcosahedronGeometry(SUBSTRATE_RADIUS * 0.62, SUBSTRATE_INNER_DETAIL);
    const icoInnerEdges = new THREE.EdgesGeometry(icoInner);
    icoInner.dispose();

    // Brandmark cloud (face-on, billboard mounted in scene below)
    const brandmark = buildBrandmarkCloud();

    // Knowledge graph + sources + pylons
    const graphStruts = buildGraphStrutsGeometry();
    const sourceChannels = buildSourceChannelsGeometry();
    const sourceMotes = buildSourceMotes();
    const pylonMasts = buildPylonMastGeometry(PYLON_HEIGHT, PYLON_ROOT_RADIUS, PYLON_COUNT);
    const pylonRing = buildPolygonGeometry(PYLON_ROOT_RADIUS, PYLON_COUNT * 4, DECK_LIFT * 1.2);
    const diamondOutline = buildDiamondGeometry(PYLON_CAP_SIZE);
    const diamondFilled = buildFilledDiamondGeometry(PYLON_CAP_SIZE * 0.55);
    const sourceDiamond = buildFilledDiamondGeometry(PYLON_CAP_SIZE * 0.55);
    const gateway = buildPolygonGeometry(GATEWAY_RADIUS, 24, 0);

    return {
      outerPoly,
      midPoly,
      innerPoly,
      outerTicks,
      midPlates,
      innerHalo,
      icoOuterEdges,
      icoInnerEdges,
      brandmark,
      graphStruts,
      sourceChannels,
      sourceMotes,
      pylonMasts,
      pylonRing,
      diamondOutline,
      diamondFilled,
      sourceDiamond,
      gateway,
    };
  }, []);

  // ── Materials (built once) ───────────────────────────────────────
  const mats = useMemo(() => {
    const make = (color: number, op: number, additive = false) =>
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: op,
        depthWrite: false,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      });
    const makeMesh = (color: number, op: number) =>
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: op,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
    const makePoints = (color: number, op: number, size: number, additive = false) =>
      new THREE.PointsMaterial({
        color,
        transparent: true,
        opacity: op,
        depthWrite: false,
        size,
        sizeAttenuation: true,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      });

    return {
      outerPoly: make(COLOR_GOLD, 0, true),
      midPoly: make(COLOR_DAWN, 0),
      innerPoly: make(COLOR_GOLD, 0, true),
      outerTicks: make(COLOR_DAWN, 0),
      midPlates: make(COLOR_GOLD, 0, true),
      innerHalo: make(COLOR_DAWN, 0),
      icoOuter: make(COLOR_GOLD, 0, true),
      icoInner: make(COLOR_DAWN, 0),
      brandmark: makePoints(COLOR_GOLD_RIM, 0, 0.038, true),
      graphStruts: make(COLOR_DAWN, 0),
      sourceChannels: make(COLOR_GOLD, 0, true),
      sourceMotes: makePoints(COLOR_GOLD_RIM, 0, 0.05, true),
      pylonMasts: make(COLOR_DAWN, 0),
      pylonRing: make(COLOR_GOLD, 0, true),
      pylonCapOutline: make(COLOR_GOLD, 0, true),
      pylonCapFilled: makeMesh(COLOR_GOLD_RIM, 0),
      sourcePip: makeMesh(COLOR_GOLD, 0),
      gateway: make(COLOR_GOLD, 0, true),
    };
  }, []);

  // ── Dispose on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      Object.values(geoms).forEach((g) => {
        if (g instanceof THREE.BufferGeometry) g.dispose();
        else if (g && "geometry" in g) g.geometry.dispose();
      });
      Object.values(mats).forEach((m) => m.dispose());
    };
  }, [geoms, mats]);

  // ── Per-frame: reveals + autonomous spin + brandmark billboarding ─
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const p = clamp01(progress);

    // ─ Phase scalars ─
    const gatewayP = phasePresence(p, PHASES.gateway, 0.04);
    const sourcesP = phasePresence(p, PHASES.sources);
    const substrateP = phasePresence(p, PHASES.substrate);
    const graphP = phasePresence(p, PHASES.graph);
    const surfacesP = phasePresence(p, PHASES.surfaces);
    const resolvedP = phasePresence(p, PHASES.resolved);

    // Deck reads slightly faster than any single phase so the floor is
    // always present from very early on. Caps at 1 by `peak`.
    const deckP = smoothstep(0.02, 0.22, p);

    // ─ Deck ─
    mats.outerPoly.opacity = deckP * 0.85;
    mats.midPoly.opacity = deckP * 0.45;
    mats.innerPoly.opacity = deckP * 0.7;
    mats.outerTicks.opacity = deckP * 0.55;
    mats.midPlates.opacity = sourcesP * 0.7 + deckP * 0.1;
    mats.innerHalo.opacity = graphP * 0.35;

    // ─ Substrate core ─
    mats.icoOuter.opacity = substrateP * 0.85;
    mats.icoInner.opacity = substrateP * 0.45;
    mats.brandmark.opacity = substrateP * 0.95;

    // ─ Knowledge graph ─
    mats.graphStruts.opacity = graphP * 0.55;

    // ─ Trusted sources ─
    mats.sourceChannels.opacity = sourcesP * 0.7;
    mats.sourceMotes.opacity = sourcesP * 0.85;
    mats.sourcePip.opacity = sourcesP * 0.95;

    // ─ Headless surface pylons ─
    mats.pylonMasts.opacity = surfacesP * 0.65;
    mats.pylonRing.opacity = surfacesP * 0.6;
    mats.pylonCapOutline.opacity = surfacesP * 0.95;
    mats.pylonCapFilled.opacity = surfacesP * 0.9;

    // ─ Gateway ─
    mats.gateway.opacity = gatewayP * 0.95;

    // ─ Brandmark billboard ─ keep the cloud facing the camera so the
    // mark reads from the artifact's primary angle, not flat on the
    // deck.
    if (brandmarkRef.current) {
      brandmarkRef.current.quaternion.copy(state.camera.quaternion);
    }

    // ─ Source motes drift ─ animate phases along the channel by
    // shifting the position attribute slightly each frame. We keep
    // this O(motes) per frame which is cheap for the count we have.
    if (sourceMotesRef.current && !reducedMotion) {
      const posAttr = geoms.sourceMotes.geometry.getAttribute("position") as THREE.BufferAttribute;
      const phases = geoms.sourceMotes.phases;
      const dirs = geoms.sourceMotes.channelDirs;
      const origins = geoms.sourceMotes.channelOrigins;
      const totalMotes = SOURCE_PIP_COUNT * SOURCE_CHANNEL_MOTE_COUNT;
      const driftCycle = 4.5; // seconds per traversal
      const driftT = (t / driftCycle) % 1;
      for (let i = 0; i < totalMotes; i++) {
        const channelIdx = Math.floor(i / SOURCE_CHANNEL_MOTE_COUNT);
        const phase = phases[i];
        const localT = (phase + driftT) % 1;
        const ox = origins[channelIdx * 3];
        const oy = origins[channelIdx * 3 + 1];
        const oz = origins[channelIdx * 3 + 2];
        const dx = dirs[channelIdx * 3];
        const dy = dirs[channelIdx * 3 + 1];
        const dz = dirs[channelIdx * 3 + 2];
        posAttr.setXYZ(i, ox + dx * localT, oy + dy * localT, oz + dz * localT);
      }
      posAttr.needsUpdate = true;
    }

    // ─ Autonomous rotation ─ a slow scroll-independent spin on the
    // resolved view; muted when reducedMotion is true. The deck spins
    // gently while resolved; the substrate spins faster to feel alive.
    if (rootRef.current) {
      const spin = reducedMotion ? 0 : 0.025 + resolvedP * 0.06;
      rootRef.current.rotation.y += spin * (1 / 60);
    }

    // ─ Camera orbit ─ tiny circular drift at the resolved view so the
    // parked artifact reads as hand-flown. Disabled in reduced motion.
    if (!reducedMotion) {
      cameraOrbitT.current += 1 / 60 / CAMERA_ORBIT_PERIOD_SEC;
      const orbitT = cameraOrbitT.current * Math.PI * 2;
      const orbitMix = resolvedP;
      state.camera.position.x =
        CAMERA_POSITION[0] + Math.sin(orbitT) * CAMERA_ORBIT_RADIUS * orbitMix;
      state.camera.position.y =
        CAMERA_POSITION[1] + Math.cos(orbitT * 0.6) * CAMERA_ORBIT_LIFT * orbitMix;
      state.camera.position.z = CAMERA_POSITION[2];
      state.camera.lookAt(CAMERA_LOOK_AT[0], CAMERA_LOOK_AT[1], CAMERA_LOOK_AT[2]);
    }
  });

  // ── Source pip positions (deterministic at build time) ───────────
  const sourcePipPositions = useMemo(() => {
    const positions: Array<[number, number, number]> = [];
    for (let i = 0; i < SOURCE_PIP_COUNT; i++) {
      const a = (i / SOURCE_PIP_COUNT) * Math.PI * 2 + Math.PI / SOURCE_PIP_COUNT;
      positions.push([
        Math.cos(a) * DECK_OUTER_RADIUS,
        DECK_LIFT * 0.5,
        Math.sin(a) * DECK_OUTER_RADIUS,
      ]);
    }
    return positions;
  }, []);

  const pylonCapPositions = useMemo(() => {
    const positions: Array<[number, number, number]> = [];
    for (let i = 0; i < PYLON_COUNT; i++) {
      const a = (i / PYLON_COUNT) * Math.PI * 2;
      positions.push([
        Math.cos(a) * PYLON_ROOT_RADIUS,
        DECK_LIFT + PYLON_HEIGHT,
        Math.sin(a) * PYLON_ROOT_RADIUS,
      ]);
    }
    return positions;
  }, []);

  // ── Gateway Z (camera-axis travel during alignment) ──────────────
  const gatewayZ = lerp(GATEWAY_Z_START, GATEWAY_Z_END, smoothstep(0, 0.16, progress));
  void ARTIFACT_LABELS;

  return (
    <group ref={rootRef}>
      <ambientLight intensity={0.32} />

      {/* ─ Gateway descent ring ─ */}
      <lineLoop
        geometry={geoms.gateway}
        material={mats.gateway}
        position={[0, 1.0, gatewayZ]}
        rotation={[0, 0, 0]}
        frustumCulled={false}
      />

      {/* ─ Deck ─ */}
      <lineLoop geometry={geoms.outerPoly} material={mats.outerPoly} frustumCulled={false} />
      <lineLoop geometry={geoms.midPoly} material={mats.midPoly} frustumCulled={false} />
      <lineLoop geometry={geoms.innerPoly} material={mats.innerPoly} frustumCulled={false} />
      <lineLoop geometry={geoms.innerHalo} material={mats.innerHalo} frustumCulled={false} />
      <lineSegments geometry={geoms.outerTicks} material={mats.outerTicks} frustumCulled={false} />
      <lineSegments geometry={geoms.midPlates} material={mats.midPlates} frustumCulled={false} />

      {/* ─ Substrate core ─ */}
      <group position={[0, SUBSTRATE_LIFT, 0]}>
        <lineSegments
          geometry={geoms.icoOuterEdges}
          material={mats.icoOuter}
          frustumCulled={false}
        />
        <lineSegments
          geometry={geoms.icoInnerEdges}
          material={mats.icoInner}
          frustumCulled={false}
        />
        {geoms.brandmark.count > 0 && (
          <points
            ref={brandmarkRef}
            geometry={geoms.brandmark.geometry}
            material={mats.brandmark}
            frustumCulled={false}
          />
        )}
      </group>

      {/* ─ Knowledge graph struts ─ */}
      <lineSegments
        geometry={geoms.graphStruts}
        material={mats.graphStruts}
        frustumCulled={false}
      />

      {/* ─ Trusted sources: channels + drifting motes + outer pips ─ */}
      <lineSegments
        geometry={geoms.sourceChannels}
        material={mats.sourceChannels}
        frustumCulled={false}
      />
      <points
        ref={sourceMotesRef}
        geometry={geoms.sourceMotes.geometry}
        material={mats.sourceMotes}
        frustumCulled={false}
      />
      {sourcePipPositions.map((pos, i) => (
        <mesh
          key={`pip-${i}`}
          geometry={geoms.sourceDiamond}
          material={mats.sourcePip}
          position={pos}
          rotation={[-Math.PI / 2, 0, 0]}
          frustumCulled={false}
        />
      ))}

      {/* ─ Headless surface pylons ─ */}
      <lineSegments geometry={geoms.pylonMasts} material={mats.pylonMasts} frustumCulled={false} />
      <lineLoop geometry={geoms.pylonRing} material={mats.pylonRing} frustumCulled={false} />
      {pylonCapPositions.map((pos, i) => (
        <group key={`pylon-cap-${i}`} position={pos}>
          <lineLoop
            geometry={geoms.diamondOutline}
            material={mats.pylonCapOutline}
            frustumCulled={false}
          />
          <mesh
            geometry={geoms.diamondFilled}
            material={mats.pylonCapFilled}
            frustumCulled={false}
          />
        </group>
      ))}
    </group>
  );
}
