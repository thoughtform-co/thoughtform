"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { SIGIL_RING_MORPHS } from "@/lib/celestial/orbits";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import {
  STATION_THOUGHTFORM,
  depthOpacityForWorldPosition,
  getThoughtformBootEnvelope,
  getThoughtformCenterOffsetX,
  getThoughtformMobilePhase,
  getThoughtformRingFlythrough,
} from "../sceneGeom";

/** Maximum additive boost to compass linework alphas while the
 *  Thoughtform boot envelope is at full. Kept small (≤ 0.18) so the
 *  rings + bearings read brighter at the parked beat without
 *  thickening any linework — pairs with the `ThoughtformAtmosphere`
 *  boot-glow disk and the `StaticStarfield` boot lift. */
const COMPASS_BOOT_BOOST = 0.18;

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
 * Geometry (2026-06-07 gateway revision — circles → rectangles):
 *
 *   - 4 concentric square portal loops at half-sides [0.75, 0.63, 0.52,
 *     0.39] (= v7 ring radii / 200). Same per-ring opacity + dashing
 *     as the original circular compass — outer loops faint dawn-colour
 *     dashed, inner loops gold with progressively shorter dash patterns.
 *     The circular compass read migrates to `ShellSubstrate` at Navigate.
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
 * The v7 compass has NO bounding diamond outline; the earlier
 * version of this gate that added one has been removed entirely.
 *
 * Visibility + motion envelope (gate self-managed):
 *
 *   - Lateral pan: group.position.x slides from
 *     STATION_THOUGHTFORM.position[0] (off-axis-right) to 0 via
 *     `getThoughtformCenterOffsetX`. Mirrors the offset applied to
 *     the brandmark and copy in sceneGeom.ts. Window is owned by
 *     `THOUGHTFORM_PAN_*` in sceneGeom.
 *   - Ring flythrough: each ring rides its own staggered window via
 *     `getThoughtformRingFlythrough`, translating forward in world
 *     Z. **Inner-first order** —
 *     the innermost ring (index 3, smallest radius) flies FIRST,
 *     the outermost ring (index 0) flies LAST. This guarantees
 *     the small dotted circle around the brandmark has full Z
 *     headroom to sweep visibly past the camera before the
 *     camera catches up; the larger outer rings then follow as
 *     a trailing wave.
 *   - Opacity is governed by camera-space depth via
 *     `depthOpacityForWorldPosition` (ADR-018, 2026-05-24
 *     revision) — rings persist as world objects and fade only
 *     when too far, too near, or behind the camera.
 *   - Phase node markers, connector lines, bearing crosshair,
 *     ticks, and atmosphere dots ride ring 0's Z translation.
 *     Ring 0 is the OUTER frame and now flies LAST, so the
 *     supporting linework holds with the outer-frame chrome
 *     until the final sweep — matching the bearings' visual
 *     association with the outer ring rather than the inner
 *     detail rings.
 */

/** Portal loop half-sides in world units. Scaled from v7 SVG ring radii
 *  by 1/200 — each square is inscribed in the former circle radius. */
const RING_RADII = SIGIL_RING_MORPHS.map((r) => r.ringRadius / 200);

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
/** Camera-space focus window for the compass rings + supporting
 *  linework. After the latent depth spacing pass:
 *    - `near` tightened from 1.15 → 0.55 with `nearFade` from 3.2
 *      → 0.7. The previous values bled the near-fade across more
 *      than 3 world units, so rings visibly thinned long before
 *      they actually crossed the camera plane — the user read
 *      that as "the diagrams just disappear". Now the rings stay
 *      at full opacity right up until ~0.55 in front of the
 *      camera, then fade quickly across 0.7 world units as they
 *      actually pass.
 *    - `far` extended from 9 → 13 with `farFade` from 3 → 5 so
 *      the compass remains optically present further into the
 *      distance during the longer parked Thoughtform beat
 *      (longer scroll dwell on the parked composition). */
const COMPASS_DEPTH_WINDOW = {
  near: 0.55,
  nearFade: 0.7,
  far: 13,
  farFade: 5,
} as const;

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

/** Axis-aligned square portal loop. `halfSide` matches the former
 *  circular ring radius so the gateway occupies the same footprint. */
function buildRectGeometry(halfSide: number): THREE.BufferGeometry {
  const h = halfSide;
  return new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-h, h, 0),
    new THREE.Vector3(h, h, 0),
    new THREE.Vector3(h, -h, 0),
    new THREE.Vector3(-h, -h, 0),
    new THREE.Vector3(-h, h, 0),
  ]);
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
  // Supporting-linework wrapper. All the non-ring instrument
  // elements (bearings, ticks, phase dots + connectors, atmosphere
  // orbit dots) sit inside this group. Per frame we set
  // `group.position.z = ring0.dz` so the supporting structure
  // sweeps PAST the camera together with the outer ring rather
  // than fading in place while the rings fly past it.
  const supportingRef = useRef<THREE.Group>(null);
  // Orbit dot groups — rotation animated per frame so the markers
  // sweep around the compass like the v7 CSS-animated dots.
  const orbitDot1GroupRef = useRef<THREE.Group>(null);
  const orbitDot2GroupRef = useRef<THREE.Group>(null);

  // ── Geometries ────────────────────────────────────────────────
  const ringGeoms = useMemo(() => {
    return RING_RADII.map((r, i) => {
      const g = buildRectGeometry(r);
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
    const {
      paintProgress,
      progress: rawProgress,
      active,
      armed,
    } = useDepthGatewayStore.getState().transform;
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

    // Cinematic centering pan: slide the whole group laterally
    // toward dead-centre during [0.10, 0.16]. Apply this before
    // depth-opacity calculations so world-position samples use the
    // same transform the user sees this frame.
    group.position.x = STATION_THOUGHTFORM.position[0] + getThoughtformCenterOffsetX(progress);

    // Mobile two-moment beat: the whole compass rides the Moment-2
    // slide (up from below-centre) and is gated by `diagramFactor` so
    // it only appears in Moment 2. Both are no-ops on desktop
    // (slideY 0, diagramFactor 1) and once raw progress passes the
    // dwell. Keyed off RAW progress, not paintProgress.
    const { diagramFactor, slideY } = getThoughtformMobilePhase(rawProgress);
    group.position.y = STATION_THOUGHTFORM.position[1] + slideY;

    // Boot envelope — runs alongside the centering pan and the
    // first beat of the parked composition. Painters in this gate
    // use it to add a small additive alpha boost to the rings +
    // supporting linework so the compass reads CLEARER at arrival
    // without any linework actually getting thicker. The atmosphere
    // glow disk + starfield lift in the surrounding components are
    // driven from the same envelope, so the whole gateway powers
    // on as one beat.
    const boot = getThoughtformBootEnvelope(progress);
    // `diagramFactor` (mobile Moment-2 reveal) folds into the shared
    // alpha multiplier so every ring + bearing + phase dot fades in
    // together; ×1 on desktop and past the mobile dwell.
    const bootBoost = (1 + boot * COMPASS_BOOT_BOOST) * diagramFactor;

    // Staggered ring flythrough — each ring rides its own [start, end]
    // window in `FLYTHROUGH_WINDOWS`. Opacity is now derived from
    // camera-space depth, Star Atlas-style: the rings persist as
    // world objects and fade when too near / behind the camera,
    // not because their progress window ended.
    for (let i = 0; i < ringMats.length; i++) {
      const mat = ringMats[i];
      const ring = ringRefs.current[i];
      const { dz } = getThoughtformRingFlythrough(progress, i);
      if (ring) ring.position.z = dz;
      const base = (mat.userData as { baseAlpha: number }).baseAlpha;
      const depthOpacity = depthOpacityForWorldPosition(
        progress,
        [group.position.x, STATION_THOUGHTFORM.position[1], STATION_THOUGHTFORM.position[2] + dz],
        COMPASS_DEPTH_WINDOW
      );
      mat.opacity = Math.min(1, depthOpacity * base * bootBoost);
    }

    // Bearings + ticks + atmosphere dots + phase markers all ride
    // ring 0's flythrough Z. Ring 0 is the OUTER ring and now flies
    // LAST (inner-first stagger, see sceneGeom.ts). The supporting
    // linework holds with the outer-frame chrome through the inner
    // rings' early sweep, then translates forward with ring 0 as
    // the final wave. Opacity is depth-driven, so a single shared
    // sample at the supporting wrapper's world position drives all
    // material alphas.
    const ring0 = getThoughtformRingFlythrough(progress, 0);
    if (supportingRef.current) supportingRef.current.position.z = ring0.dz;
    const supportingDepthOpacity = depthOpacityForWorldPosition(
      progress,
      [
        group.position.x,
        STATION_THOUGHTFORM.position[1],
        STATION_THOUGHTFORM.position[2] + ring0.dz,
      ],
      COMPASS_DEPTH_WINDOW
    );
    bearingsMat.opacity = Math.min(1, supportingDepthOpacity * 0.58 * bootBoost);
    orbitDot1Mat.opacity = Math.min(1, supportingDepthOpacity * ORBIT_DOT_1.opacity * bootBoost);
    orbitDot2Mat.opacity = Math.min(1, supportingDepthOpacity * ORBIT_DOT_2.opacity * bootBoost);

    // Phase node dots + connector lines ride ring 0's envelope
    // too, so the labelled phase markers travel toward the
    // camera with the outer ring before fading.
    for (let i = 0; i < PHASE_NODES.length; i++) {
      const node = PHASE_NODES[i];
      phaseDotMats[i].opacity = Math.min(1, supportingDepthOpacity * node.dotOpacity * bootBoost);
      // Connector lines are slightly stronger than v7's literal
      // dawn-30 so they survive the home-v2 dark stage + grain.
      connectorMats[i].opacity = Math.min(1, supportingDepthOpacity * 0.54 * bootBoost);
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

    // Hairline Z-spin (the v7 compass has a subtle "breath" cue).
    group.rotation.z = state.clock.elapsedTime * 0.012;
  });

  return (
    <group ref={groupRef} position={STATION_THOUGHTFORM.position} visible={false}>
      {/* 4 concentric square portal loops. Outer loops dawn + dashed;
          inner loops gold + dashed (gateway frame). */}
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

      {/* Supporting linework wrapper: ridden by ring 0's
          flythrough so bearings + phase dots + atmosphere orbits
          sweep PAST the camera with the outer ring, instead of
          fading in place while the rings fly past them. */}
      <group ref={supportingRef}>
        {/* Bearing crosshair (4 cardinal stubs). */}
        <lineSegments geometry={crosshairGeom} material={bearingsMat} />

        {/* 8 bearing ticks at non-cardinal angles. */}
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
            clockwise. The rotation refs live on inner groups so
            the supporting wrapper can translate without
            disrupting the atmosphere spin. */}
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
    </group>
  );
}
