"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { SIGIL_RING_MORPHS } from "@/lib/celestial/orbits";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import {
  STATION_THOUGHTFORM,
  getThoughtformCenterOffsetX,
  getThoughtformRingFlythrough,
} from "../sceneGeom";

/**
 * ThoughtformCompassGate — the v7 sigil compass rendered as a
 * world-rigid 3D group at `STATION_THOUGHTFORM` (ADR-018, world-owned
 * rebuild).
 *
 * This gate is a 1:1 reproduction of the v7 production home page
 * compass (see `public/prototypes/v7/landing-v7-motion.html` lines
 * 4313-4372). All SVG coordinates are scaled by 1/200 to world units
 * and Y is flipped (SVG +Y is down, Three.js +Y is up).
 *
 * Geometry (matches v7 `.sigil__orbits`):
 *
 *   - 4 concentric ring loops at world radii [0.75, 0.63, 0.52, 0.39]
 *     (= [150, 126, 104, 78] / 200). Per-ring opacity + dashing
 *     mirrors the v7 strokes — outer rings faint dawn-colour dashed,
 *     inner rings gold with progressively shorter dash patterns.
 *   - Bearing crosshair: 4 short cardinal stubs from r=0.65 to
 *     r=0.75 at top/right/bottom/left, dawn @ 30% (matching v7's
 *     `<path d="M0 -150 L0 -130 ...">`).
 *   - 8 bearing ticks at non-cardinal angles (30/60/120/150/210/240/
 *     300/330°) from r=0.72 to r=0.75 (matching v7's
 *     `<path transform="rotate(30)">` family).
 *   - 2 atmosphere orbit dots — gold at r=0.52 (180s clockwise) and
 *     dawn at r=0.39 (120s counter-clockwise) — mirroring v7's CSS
 *     `animation: rotate 180s linear infinite` + `rotateRev 120s`.
 *   - 3 phase node markers at compass bearings (~325° navigate,
 *     ~205° encode, ~80° build) — tiny filled gold dots, NOT diamond
 *     outlines, co-located with the `thoughtform.phase.*` COPY_ANCHORS
 *     so the DOM phase labels ride the same world points.
 *   - 3 thin connector lines from each phase dot to the label
 *     anchor — dawn @ 30%, matching v7's `<line>` connector strokes.
 *
 * The v7 compass has NO bounding diamond outline. The earlier
 * version of this gate added one at r=0.79 + 0.85 gold opacity,
 * which dominated the brandmark and broke parity with the production
 * sigil. It has been removed entirely.
 *
 * Visibility + motion envelope (gate self-managed):
 *
 *   - Lateral pan [0.05, 0.18]: group.position.x slides from
 *     STATION_THOUGHTFORM.position[0] (off-axis-right) to 0 via
 *     `getThoughtformCenterOffsetX`. Mirrors the offset applied to
 *     the brandmark and copy in sceneGeom.ts.
 *   - Ring flythrough [0.18, 0.335]: each ring (outer -> inner) gets
 *     its own staggered window via `getThoughtformRingFlythrough`,
 *     translating forward in world Z and fading in the final 30%
 *     of its window. Bearing crosshair, ticks, atmosphere dots, and
 *     phase markers stay parked at gate Z — only the 4 main rings
 *     ride the flythrough (matches v7 behaviour where only the
 *     `.sigil__ring` elements morph; bearings are static reference).
 *   - Phase node markers + connector lines: fade 1 -> 0 across
 *     [0.18, 0.234] so they vanish before the outer ring sweeps
 *     past them.
 *   - Bearing crosshair, ticks, and atmosphere dots track ring 0's
 *     opacity envelope (they're visually paired with the outer ring
 *     frame and atmosphere; they fade away with the rings during
 *     passthrough).
 */

/** Ring radii in world units. Scaled from v7 SVG units by 1/200. */
const RING_RADII = SIGIL_RING_MORPHS.map((r) => r.ringRadius / 200);
const RING_SEGMENTS = 96;

/** Per-ring opacity weight. These are deliberately a notch above the
 *  v7 SVG's literal stroke-opacity values because the R3F lines sit
 *  behind a brighter projected brandmark + grain field in home-v2.
 *  The compass should read as present instrument structure, but the
 *  brandmark remains the dominant gold object. */
const RING_ALPHA_WEIGHTS = [0.32, 0.36, 0.56, 0.76];

/** Per-ring colours — outer two are dawn, inner two are gold. */
const DAWN_HEX = "#ebe3d6";
const GOLD_HEX = "#caa554";
const RING_COLORS = [DAWN_HEX, DAWN_HEX, GOLD_HEX, GOLD_HEX];

/** Per-ring dash pattern (world units), matching v7 SVG dasharrays
 *  scaled 1/200. `null` means solid. */
const RING_DASH: ({ dashSize: number; gapSize: number } | null)[] = [
  { dashSize: 0.005, gapSize: 0.025 }, // v7 "1 5"
  null, // v7 solid
  { dashSize: 0.01, gapSize: 0.035 }, // v7 "2 7"
  { dashSize: 0.005, gapSize: 0.015 }, // v7 "1 3"
];

/**
 * Phase node positions — compass bearings matching v7 SVG
 * `.sigil__phase-labels` (HTML lines 4357-4370). Coordinates scaled
 * from SVG units (1/200); Y is flipped (SVG +Y down → Three.js +Y up).
 *
 *   NAVIGATE: dot SVG (-86, -123) → world (-0.43, +0.615) (compass ~325°)
 *   ENCODE  : dot SVG (-53, +114) → world (-0.265, -0.57) (compass ~205°)
 *   BUILD   : dot SVG (+102, -18) → world (+0.51, +0.09) (compass ~80°)
 *
 * Each phase has a thin connector line from the dot to a point near
 * the label anchor (v7 SVG `<line x1=... x2=... y1=... y2=...>`).
 */
const PHASE_NODES = [
  {
    id: "navigate",
    dot: [-0.43, 0.615, 0.05] as [number, number, number],
    /** Connector line endpoint — v7 SVG (-96, -136) → world. */
    lineEnd: [-0.48, 0.68, 0.05] as [number, number, number],
    /** Dot radius in world units (v7 r=2.5 → 0.0125). */
    dotRadius: 0.0125,
    /** Dot opacity (v7 NAVIGATE marker fill opacity=0.85). */
    dotOpacity: 0.85,
  },
  {
    id: "encode",
    dot: [-0.265, -0.57, 0.05] as [number, number, number],
    /** Connector line endpoint — v7 SVG (-61, +127) → world. */
    lineEnd: [-0.305, -0.635, 0.05] as [number, number, number],
    /** Dot radius (v7 r=2 → 0.010). */
    dotRadius: 0.01,
    /** Dot opacity (v7 ENCODE marker fill opacity=0.7). */
    dotOpacity: 0.7,
  },
  {
    id: "build",
    dot: [0.51, 0.09, 0.05] as [number, number, number],
    /** Connector line endpoint — v7 SVG (+114, -24) → world. */
    lineEnd: [0.57, 0.12, 0.05] as [number, number, number],
    /** Dot radius (v7 r=2 → 0.010). */
    dotRadius: 0.01,
    /** Dot opacity (v7 BUILD marker fill opacity=0.7). */
    dotOpacity: 0.7,
  },
];

/**
 * Bearing crosshair endpoints — 4 short cardinal stubs from r=0.65
 * to r=0.75. Source: v7 SVG path
 * `M0 -150 L0 -130 M0 130 L0 150 M-150 0 L-130 0 M130 0 L150 0`,
 * scaled 1/200 and Y-flipped.
 */
const CROSSHAIR_VERTS: [number, number, number][] = [
  [0, 0.65, 0.02],
  [0, 0.75, 0.02], // top stub
  [0, -0.65, 0.02],
  [0, -0.75, 0.02], // bottom stub
  [-0.65, 0, 0.02],
  [-0.75, 0, 0.02], // left stub
  [0.65, 0, 0.02],
  [0.75, 0, 0.02], // right stub
];

/** 8 bearing ticks at non-cardinal angles (matching v7 SVG
 *  `<path transform="rotate(30)">` family). Each tick spans r=0.72
 *  to r=0.75, just inside the outer ring. */
const TICK_ANGLES_DEG = [30, 60, 120, 150, 210, 240, 300, 330];
const TICK_INNER_R = 0.72;
const TICK_OUTER_R = 0.75;

/** Atmosphere orbit dots — match v7 SVG groups with CSS
 *  `animation: rotate 180s linear infinite` and
 *  `animation: rotateRev 120s linear infinite`. */
const ORBIT_DOT_1 = {
  /** v7 orbit radius 104 / 200 = 0.52. */
  radius: 0.52,
  /** v7 marker radius 2.5 / 200 = 0.0125. */
  size: 0.0125,
  color: GOLD_HEX,
  /** v7 opacity=0.9. */
  opacity: 0.9,
  /** SVG "rotate" is clockwise → negative Z in Three.js. */
  angularVelocity: -((2 * Math.PI) / 180),
};
const ORBIT_DOT_2 = {
  /** v7 orbit radius 78 / 200 = 0.39. */
  radius: 0.39,
  /** v7 marker radius 1.8 / 200 = 0.009. */
  size: 0.009,
  color: DAWN_HEX,
  /** v7 opacity=0.6. */
  opacity: 0.6,
  /** SVG "rotateRev" is counter-clockwise → positive Z in Three.js. */
  angularVelocity: (2 * Math.PI) / 120,
};

function buildCircleGeometry(radius: number, segments: number): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
  }
  return new THREE.BufferGeometry().setFromPoints(points);
}

function buildSegmentsGeometry(verts: [number, number, number][]): THREE.BufferGeometry {
  return new THREE.BufferGeometry().setFromPoints(
    verts.map((v) => new THREE.Vector3(v[0], v[1], v[2]))
  );
}

function buildTickVerts(): [number, number, number][] {
  const verts: [number, number, number][] = [];
  for (const angDeg of TICK_ANGLES_DEG) {
    const a = (angDeg * Math.PI) / 180;
    const cx = Math.cos(a);
    const cy = Math.sin(a);
    verts.push([cx * TICK_INNER_R, cy * TICK_INNER_R, 0.02]);
    verts.push([cx * TICK_OUTER_R, cy * TICK_OUTER_R, 0.02]);
  }
  return verts;
}

/** Compute the per-vertex `lineDistance` attribute that
 *  `THREE.LineDashedMaterial` reads in its vertex shader. The
 *  built-in `Line.computeLineDistances()` does the same thing, but
 *  this helper lets us populate the attribute directly on a
 *  BufferGeometry inside a useMemo (no ref dance). */
function computeLineDistancesOnGeometry(geom: THREE.BufferGeometry): void {
  const positionAttribute = geom.attributes.position;
  const lineDistances: number[] = [0];
  const start = new THREE.Vector3();
  const end = new THREE.Vector3();
  for (let i = 1; i < positionAttribute.count; i++) {
    start.fromBufferAttribute(positionAttribute, i - 1);
    end.fromBufferAttribute(positionAttribute, i);
    lineDistances[i] = lineDistances[i - 1] + start.distanceTo(end);
  }
  geom.setAttribute("lineDistance", new THREE.Float32BufferAttribute(lineDistances, 1));
}

type RingMaterial = THREE.LineBasicMaterial | THREE.LineDashedMaterial;

export function ThoughtformCompassGate() {
  const groupRef = useRef<THREE.Group>(null);
  // Per-ring mesh refs so the flythrough can translate each ring's
  // Z independently (staggered windows + overshoot past the camera).
  const ringRefs = useRef<(THREE.LineLoop | null)[]>([]);
  // Orbit dot groups — rotation animated per frame so the markers
  // sweep around the compass like the v7 CSS-animated dots.
  const orbitDot1GroupRef = useRef<THREE.Group>(null);
  const orbitDot2GroupRef = useRef<THREE.Group>(null);

  // ── Geometries ────────────────────────────────────────────────
  const ringGeoms = useMemo(() => {
    return RING_RADII.map((r, i) => {
      const g = buildCircleGeometry(r, RING_SEGMENTS);
      // LineDashedMaterial requires per-vertex lineDistance. Solid
      // rings (LineBasicMaterial) ignore the attribute, so we only
      // compute it when needed.
      if (RING_DASH[i]) computeLineDistancesOnGeometry(g);
      return g;
    });
  }, []);
  const crosshairGeom = useMemo(() => buildSegmentsGeometry(CROSSHAIR_VERTS), []);
  const ticksGeom = useMemo(() => buildSegmentsGeometry(buildTickVerts()), []);
  const phaseDotGeoms = useMemo(
    () => PHASE_NODES.map((n) => new THREE.CircleGeometry(n.dotRadius, 24)),
    []
  );
  const connectorGeoms = useMemo(
    () => PHASE_NODES.map((n) => buildSegmentsGeometry([n.dot, n.lineEnd])),
    []
  );
  const orbitDot1Geom = useMemo(() => new THREE.CircleGeometry(ORBIT_DOT_1.size, 20), []);
  const orbitDot2Geom = useMemo(() => new THREE.CircleGeometry(ORBIT_DOT_2.size, 20), []);

  // ── Materials ────────────────────────────────────────────────
  const ringMats = useMemo<RingMaterial[]>(() => {
    return RING_ALPHA_WEIGHTS.map((alpha, i) => {
      const dash = RING_DASH[i];
      const color = new THREE.Color(RING_COLORS[i]);
      const mat: RingMaterial = dash
        ? new THREE.LineDashedMaterial({
            color,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            toneMapped: false,
            dashSize: dash.dashSize,
            gapSize: dash.gapSize,
          })
        : new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            toneMapped: false,
          });
      (mat.userData as { baseAlpha: number }).baseAlpha = alpha;
      return mat;
    });
  }, []);

  // Single shared material for the bearing crosshair + 8 ticks
  // (both are `var(--dawn-30)` in v7 — the same colour + alpha).
  const bearingsMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(DAWN_HEX),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );

  // Per-phase connector line material — v7 `stroke="var(--dawn-30)"`.
  const connectorMats = useMemo(
    () =>
      PHASE_NODES.map(
        () =>
          new THREE.LineBasicMaterial({
            color: new THREE.Color(DAWN_HEX),
            transparent: true,
            opacity: 0,
            depthWrite: false,
            toneMapped: false,
          })
      ),
    []
  );

  // Phase dot materials — gold, filled, DoubleSide so they stay
  // visible if the group rotates around the camera-facing plane.
  const phaseDotMats = useMemo(
    () =>
      PHASE_NODES.map(
        () =>
          new THREE.MeshBasicMaterial({
            color: new THREE.Color(GOLD_HEX),
            transparent: true,
            opacity: 0,
            depthWrite: false,
            toneMapped: false,
            side: THREE.DoubleSide,
          })
      ),
    []
  );

  const orbitDot1Mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(ORBIT_DOT_1.color),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    []
  );
  const orbitDot2Mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(ORBIT_DOT_2.color),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    []
  );

  useEffect(() => {
    return () => {
      ringGeoms.forEach((g) => g.dispose());
      crosshairGeom.dispose();
      ticksGeom.dispose();
      phaseDotGeoms.forEach((g) => g.dispose());
      connectorGeoms.forEach((g) => g.dispose());
      orbitDot1Geom.dispose();
      orbitDot2Geom.dispose();
      ringMats.forEach((m) => m.dispose());
      bearingsMat.dispose();
      connectorMats.forEach((m) => m.dispose());
      phaseDotMats.forEach((m) => m.dispose());
      orbitDot1Mat.dispose();
      orbitDot2Mat.dispose();
    };
  }, [
    ringGeoms,
    crosshairGeom,
    ticksGeom,
    phaseDotGeoms,
    connectorGeoms,
    orbitDot1Geom,
    orbitDot2Geom,
    ringMats,
    bearingsMat,
    connectorMats,
    phaseDotMats,
    orbitDot1Mat,
    orbitDot2Mat,
  ]);

  // ── Per-frame motion + visibility ─────────────────────────────
  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;
    const { paintProgress, active, armed } = useDepthGatewayStore.getState().transform;
    // Paint at full opacity while EITHER armed or active. `paint-
    // Progress` is forced to 0 while armed so the parked Thoughtform
    // layout is in place the moment the stage starts rising into
    // view — the second section reads as composed on arrival, not
    // as an empty void that fills in after the user scrolls past
    // the hero.
    if (!active && !armed) {
      group.visible = false;
      return;
    }
    group.visible = true;
    const progress = paintProgress;

    // Staggered ring flythrough — each ring rides its own [start, end]
    // window in `FLYTHROUGH_WINDOWS`. Outer ring (index 0) flies
    // first, inner ring (index 3) last, ~2.5% of scroll apart. Each
    // ring translates +Z by FLYTHROUGH_Z_DISTANCE across its window
    // and fades 1 -> 0 in the final 30%, so the four arches sweep
    // past the camera in tight sequence rather than dimming at
    // distance.
    for (let i = 0; i < ringMats.length; i++) {
      const mat = ringMats[i];
      const ring = ringRefs.current[i];
      const { dz, opacityT } = getThoughtformRingFlythrough(progress, i);
      if (ring) ring.position.z = dz;
      const base = (mat.userData as { baseAlpha: number }).baseAlpha;
      mat.opacity = opacityT * base;
    }

    // Bearing crosshair + ticks + atmosphere dots stay parked at
    // gate Z (matching v7 — bearings are static reference, not part
    // of the flythrough). Their opacity follows ring 0's window so
    // they appear/fade with the outermost ring (which is the visual
    // frame they belong to).
    const ring0 = getThoughtformRingFlythrough(progress, 0);
    bearingsMat.opacity = ring0.opacityT * 0.58;
    orbitDot1Mat.opacity = ring0.opacityT * ORBIT_DOT_1.opacity;
    orbitDot2Mat.opacity = ring0.opacityT * ORBIT_DOT_2.opacity;

    // Phase node dots + connector lines: parked at gate Z. Fade
    // 1 -> 0 across [0.18, 0.234] so they vanish before the outer
    // ring sweeps past them.
    let phaseOpacity = 0;
    if (progress <= 0.18) phaseOpacity = 1;
    else if (progress <= 0.234) phaseOpacity = 1 - (progress - 0.18) / 0.054;
    for (let i = 0; i < PHASE_NODES.length; i++) {
      const node = PHASE_NODES[i];
      phaseDotMats[i].opacity = phaseOpacity * node.dotOpacity;
      // Connector lines are slightly stronger than v7's literal
      // dawn-30 so they survive the home-v2 dark stage + grain.
      connectorMats[i].opacity = phaseOpacity * 0.54;
    }

    // Atmosphere orbit dots — independent continuous rotation
    // (matching v7 CSS `animation: rotate 180s` / `rotateRev 120s`).
    // These rotations COMPOSE with the parent group's breath spin
    // below; the result is close enough to v7 for a subtle ambient
    // motion that the eye reads as "alive".
    if (orbitDot1GroupRef.current) {
      orbitDot1GroupRef.current.rotation.z = state.clock.elapsedTime * ORBIT_DOT_1.angularVelocity;
    }
    if (orbitDot2GroupRef.current) {
      orbitDot2GroupRef.current.rotation.z = state.clock.elapsedTime * ORBIT_DOT_2.angularVelocity;
    }

    // Cinematic centering pan: slide the whole group laterally
    // toward dead-centre during [0.05, 0.18]. Mirrors the same
    // offset applied to the brandmark, copy, and DOM phase labels
    // in sceneGeom.ts. Note: ring Z translation is APPLIED LOCALLY
    // on each mesh, so it composes with this group-level X without
    // interference.
    group.position.x = STATION_THOUGHTFORM.position[0] + getThoughtformCenterOffsetX(progress);

    // Hairline Z-spin (the v7 compass has a subtle "breath" cue).
    group.rotation.z = state.clock.elapsedTime * 0.012;
  });

  return (
    <group ref={groupRef} position={STATION_THOUGHTFORM.position} visible={false}>
      {/* 4 concentric rings. Outer rings dawn + dashed (faint
          atmospheric guide); inner rings gold + dashed (the visible
          instrument). */}
      {ringGeoms.map((g, i) => (
        <lineLoop
          key={`ring-${i}`}
          ref={(el) => {
            ringRefs.current[i] = el;
          }}
          geometry={g}
          material={ringMats[i]}
        />
      ))}

      {/* Bearing crosshair (4 cardinal stubs) — static reference. */}
      <lineSegments geometry={crosshairGeom} material={bearingsMat} />

      {/* 8 bearing ticks at non-cardinal angles — static reference. */}
      <lineSegments geometry={ticksGeom} material={bearingsMat} />

      {/* Phase node dots + connector lines. Dot is a small filled
          gold circle (NOT a diamond outline); connector is a thin
          dawn-30 stroke from the dot to the label anchor area. */}
      {PHASE_NODES.map((node, i) => (
        <group key={`phase-${node.id}`}>
          <mesh geometry={phaseDotGeoms[i]} material={phaseDotMats[i]} position={node.dot} />
          <lineSegments geometry={connectorGeoms[i]} material={connectorMats[i]} />
        </group>
      ))}

      {/* Atmosphere orbiting dots — independent rotation groups.
          Dot 1 starts at +X (radius 0.52) and sweeps clockwise;
          dot 2 starts at -X (radius 0.39) and sweeps counter-
          clockwise. */}
      <group ref={orbitDot1GroupRef}>
        <mesh
          geometry={orbitDot1Geom}
          material={orbitDot1Mat}
          position={[ORBIT_DOT_1.radius, 0, 0.01]}
        />
      </group>
      <group ref={orbitDot2GroupRef}>
        <mesh
          geometry={orbitDot2Geom}
          material={orbitDot2Mat}
          position={[-ORBIT_DOT_2.radius, 0, 0.01]}
        />
      </group>
    </group>
  );
}
