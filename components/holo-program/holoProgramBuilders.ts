/**
 * holoProgramBuilders — the artifact's geometry.
 *
 * Pure builders in the `artifactPrimitives` contract: every function returns
 * a `THREE.BufferGeometry` (or plain point arrays for drei's fat `Line`) and
 * holds no React, no per-frame state and no material. The scene owns
 * lifetime; this file owns shape.
 *
 * ⚠ EVERY RING LIES IN THE XY PLANE, THREADED ALONG Z. That is what gives
 * the object an inside to orbit through. Round 1 strung them along X and saw
 * them near edge-on from every angle it allowed.
 */

import * as THREE from "three";

import {
  ARC_FILL,
  CORE_LINK_DENSITY,
  CORE_NODES,
  CORE_RADIUS,
  DUST_COUNT,
  DUST_SPREAD,
  GRID_EXTENT,
  GRID_SPACING,
  GRID_Y,
  HOLO_SEED,
  RING_SEGMENTS,
  TICK_LEN,
  TICK_MAJOR_EVERY,
  mulberry32,
  tickCount,
  type HoloShell,
} from "./holoProgramGeom";

/** A closed ring in the XY plane at depth `z`. */
export function buildRingPoints(z: number, radius: number, segments = RING_SEGMENTS) {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, z));
  }
  return points;
}

/**
 * Per-vertex front/back brightness for a ring, so it WEAVES through the
 * volume instead of sitting flat on it.
 *
 * Ported verbatim from the corridor's own `HologramOrbits.buildRing`:
 * `0.16 + 0.84 * frontness`. The range is deliberately extreme — a gentle
 * ramp reads as a lighting artifact, this reads as a near side and a far
 * side. ⚠ Our rings lie in XY threaded along Z, so "frontness" is the
 * vertex's own Z within the ring's plane after the rig turns it; we bake the
 * ring's own local depth and let the rig's rotation do the rest.
 */
export function ringDepthColors(
  radius: number,
  color: THREE.Color,
  segments = RING_SEGMENTS
): [number, number, number][] {
  const colors: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    // The ring is drawn in XY; its own "depth" cue is the vertical sweep,
    // which after the rig's raised pose becomes the near/far read.
    const frontness = Math.min(1, Math.max(0, Math.sin(a) * 0.5 + 0.5));
    const b = 0.16 + 0.84 * frontness;
    colors.push([color.r * b, color.g * b, color.b * b]);
  }
  return colors;
}

/**
 * A corner-bracket reticle around a marker — the reference's own label
 * grammar (`fillText` at a projected point, brackets offset from it). Four
 * L-shaped corners with the middle left open, so the thing it frames stays
 * legible through it.
 */
export function buildReticle(
  z: number,
  angle: number,
  radius: number,
  half: number,
  arm: number
): THREE.BufferGeometry {
  const cx = Math.cos(angle) * radius;
  const cy = Math.sin(angle) * radius;
  const pos: number[] = [];
  for (const [sx, sy] of [
    [-1, 1],
    [1, 1],
    [1, -1],
    [-1, -1],
  ] as const) {
    const x = cx + sx * half;
    const y = cy + sy * half;
    // The horizontal arm, then the vertical one — an L per corner.
    pos.push(x, y, z, x - sx * arm, y, z);
    pos.push(x, y, z, x, y - sy * arm, z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

/** Every marker's reticle in ONE buffer, ordered marker by marker so the
 *  intro can reveal them in the record's own date order. */
export function buildReticleField(
  markers: readonly { z: number; angle: number; radius: number }[],
  half = 0.1,
  arm = 0.045
): { geometry: THREE.BufferGeometry; ranges: (readonly [number, number])[] } {
  const pos: number[] = [];
  const ranges: (readonly [number, number])[] = [];
  for (const m of markers) {
    const start = pos.length / 3;
    const g = buildReticle(m.z, m.angle, m.radius, half, arm);
    const p = g.getAttribute("position");
    for (let i = 0; i < p.count; i++) pos.push(p.getX(i), p.getY(i), p.getZ(i));
    g.dispose();
    ranges.push([start, pos.length / 3 - start]);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return { geometry, ranges };
}

/**
 * A PLATED ring: chorded segments with gaps, the "engineered plating"
 * grammar from `artifactPrimitives.buildPlatedSegments`, re-expressed in the
 * XY plane this object threads along Z. Not every ring may be a closed
 * circle — the owner's note, and the reference's own vocabulary.
 */
export function buildPlatedRing(
  z: number,
  radius: number,
  sides: number,
  fill: number
): THREE.BufferGeometry {
  const pos: number[] = [];
  const TAU = Math.PI * 2;
  const step = TAU / sides;
  for (let i = 0; i < sides; i++) {
    const a0 = i * step;
    const span = step * fill;
    const sub = 4;
    for (let s = 0; s < sub; s++) {
      const b0 = a0 + (span * s) / sub;
      const b1 = a0 + (span * (s + 1)) / sub;
      pos.push(Math.cos(b0) * radius, Math.sin(b0) * radius, z);
      pos.push(Math.cos(b1) * radius, Math.sin(b1) * radius, z);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

/** A partial sweep of a ring — the shells' `arc` kind, and the bright
 *  waypoint arc that the bloom lifts and the aberration fringes. */
export function buildArcPoints(
  z: number,
  radius: number,
  from: number,
  sweep: number,
  segments = 64
) {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = from + (i / segments) * sweep;
    points.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, z));
  }
  return points;
}

/** The bright arc for a waypoint ring — `ARC_FILL` of its circumference,
 *  seeded so each ring's arc sits at its own angle and they never line up
 *  into an accidental seam. */
export function buildWaypointArc(z: number, radius: number, index: number) {
  const rnd = mulberry32(HOLO_SEED + index * 977);
  const from = rnd() * Math.PI * 2;
  return buildArcPoints(z, radius, from, Math.PI * 2 * ARC_FILL);
}

/**
 * A tick ring: radial strokes around a ring's rim, every Nth drawn long.
 *
 * A port of the reference's `tickRing` — including its GAP WINDOWS, which
 * are what stop a graduation reading as a solid band. Returns one
 * `LineSegments` buffer.
 */
export function buildTickRing(
  z: number,
  radius: number,
  gaps: readonly (readonly [from: number, width: number])[] = []
): THREE.BufferGeometry {
  const n = tickCount(radius);
  const pos: number[] = [];
  const TAU = Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    if (gaps.some(([from, width]) => (a - from + TAU * 2) % TAU < width)) continue;
    const major = TICK_MAJOR_EVERY > 0 && i % TICK_MAJOR_EVERY === 0;
    const outer = radius + (major ? TICK_LEN * 1.6 : TICK_LEN);
    pos.push(Math.cos(a) * radius, Math.sin(a) * radius, z);
    pos.push(Math.cos(a) * outer, Math.sin(a) * outer, z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

/** Every waypoint's tick ring in ONE buffer, ordered ring by ring so the
 *  intro can populate them per ring with `setDrawRange`. */
export function buildTickField(rings: readonly { z: number; radius: number }[]): {
  geometry: THREE.BufferGeometry;
  ranges: (readonly [number, number])[];
} {
  const pos: number[] = [];
  const ranges: (readonly [number, number])[] = [];
  for (let r = 0; r < rings.length; r++) {
    const start = pos.length / 3;
    const rnd = mulberry32(HOLO_SEED + r * 131);
    const gaps: [number, number][] = [
      [rnd() * Math.PI * 2, 0.3 + rnd() * 0.5],
      [rnd() * Math.PI * 2, 0.2 + rnd() * 0.4],
    ];
    const geom = buildTickRing(rings[r].z, rings[r].radius, gaps);
    const p = geom.getAttribute("position");
    for (let i = 0; i < p.count; i++) pos.push(p.getX(i), p.getY(i), p.getZ(i));
    geom.dispose();
    ranges.push([start, pos.length / 3 - start]);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return { geometry, ranges };
}

/** A dash ring, as `LineSegments` — the shells' `dotted` kind. Cheaper and
 *  more controllable than `LineDashedMaterial`, which needs line distances
 *  and renders nothing without them. */
export function buildDashRing(
  z: number,
  radius: number,
  dashes = 48,
  duty = 0.45
): THREE.BufferGeometry {
  const pos: number[] = [];
  const TAU = Math.PI * 2;
  for (let i = 0; i < dashes; i++) {
    const a0 = (i / dashes) * TAU;
    const a1 = a0 + (TAU / dashes) * duty;
    pos.push(Math.cos(a0) * radius, Math.sin(a0) * radius, z);
    pos.push(Math.cos(a1) * radius, Math.sin(a1) * radius, z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

/** All `dotted` shells merged into one buffer — one draw call for the lot. */
export function buildShellDashes(shells: readonly HoloShell[]): THREE.BufferGeometry {
  const pos: number[] = [];
  const TAU = Math.PI * 2;
  for (const s of shells) {
    if (s.kind !== "dotted") continue;
    const dashes = 40;
    for (let i = 0; i < dashes; i++) {
      const a0 = (i / dashes) * TAU;
      const a1 = a0 + (TAU / dashes) * 0.42;
      pos.push(Math.cos(a0) * s.radius, Math.sin(a0) * s.radius, s.z);
      pos.push(Math.cos(a1) * s.radius, Math.sin(a1) * s.radius, s.z);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

/** The axis itself — a thin spine down the middle of the stack. */
export function buildAxisPoints(halfSpan: number, steps = 64) {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= steps; i++) {
    points.push(new THREE.Vector3(0, 0, -halfSpan + (2 * halfSpan * i) / steps));
  }
  return points;
}

/**
 * The adoption ladder, as a stepped polyline riding the rings' TOP rim down
 * the axis. The one green element — green is the human on this estate — and
 * the record's own curve, drawn in three dimensions.
 */
export function buildLadderPoints(samples: readonly (readonly [z: number, radius: number])[]) {
  const points: THREE.Vector3[] = [];
  let prev: number | null = null;
  for (const [z, radius] of samples) {
    if (prev !== null && prev !== radius) {
      // The riser: step in place, so the ladder never ramps.
      points.push(new THREE.Vector3(0, prev, z));
    }
    points.push(new THREE.Vector3(0, radius, z));
    prev = radius;
  }
  return points;
}

/** A diamond marker on a ring's rim at `angle` — the record's own notation
 *  glyph, sitting exactly where that ring's label is anchored. */
export function buildDiamond(z: number, angle: number, radius: number, size: number) {
  const cx = Math.cos(angle) * radius;
  const cy = Math.sin(angle) * radius;
  return [
    new THREE.Vector3(cx, cy + size, z),
    new THREE.Vector3(cx + size, cy, z),
    new THREE.Vector3(cx, cy - size, z),
    new THREE.Vector3(cx - size, cy, z),
    new THREE.Vector3(cx, cy + size, z),
  ];
}

/** The floor grid, well below the object so it reads as ground. */
export function buildGroundGrid(
  extent = GRID_EXTENT,
  spacing = GRID_SPACING
): THREE.BufferGeometry {
  const pos: number[] = [];
  for (let v = -extent; v <= extent + 1e-6; v += spacing) {
    pos.push(-extent, GRID_Y, v, extent, GRID_Y, v);
    pos.push(v, GRID_Y, -extent, v, GRID_Y, extent);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

/**
 * The wireframe core: seeded nodes inside the stack, linked where the seeded
 * draw falls under `CORE_LINK_DENSITY`. The reference's node network — what
 * gives the middle of the object something to be.
 */
export function buildCoreNetwork(seed = HOLO_SEED): {
  links: THREE.BufferGeometry;
  nodes: THREE.Vector3[];
} {
  const rnd = mulberry32(seed + 7717);
  const nodes: THREE.Vector3[] = [];
  for (let i = 0; i < CORE_NODES; i++) {
    // Rejection-free spherical placement, biased inward so the core reads as
    // a body rather than a shell.
    const theta = rnd() * Math.PI * 2;
    const phi = Math.acos(2 * rnd() - 1);
    const r = CORE_RADIUS * (0.35 + rnd() * 0.65);
    nodes.push(
      new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * r,
        Math.sin(phi) * Math.sin(theta) * r,
        Math.cos(phi) * r * 1.6
      )
    );
  }
  const pos: number[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (rnd() > CORE_LINK_DENSITY) continue;
      pos.push(nodes[i].x, nodes[i].y, nodes[i].z);
      pos.push(nodes[j].x, nodes[j].y, nodes[j].z);
    }
  }
  const links = new THREE.BufferGeometry();
  links.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return { links, nodes };
}

/**
 * The dust — a seeded point cloud filling the volume the object occupies, so
 * the space between rings is not empty. Carries a per-point seed used for
 * the twinkle, so no two motes shimmer together.
 */
export function buildDust(seed = HOLO_SEED, count = DUST_COUNT): THREE.BufferGeometry {
  const rnd = mulberry32(seed + 4242);
  const pos = new Float32Array(count * 3);
  const rand = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    // A flattened cylinder around the axis: wide in Z, tighter across, so the
    // cloud follows the stack instead of being a ball around it.
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * DUST_SPREAD * 0.52;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = Math.sin(a) * r;
    pos[i * 3 + 2] = (rnd() * 2 - 1) * DUST_SPREAD;
    rand[i] = rnd();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));
  return g;
}

/** Dispose a geometry and forget it — the scene calls this on unmount for
 *  everything it built, since none of it is cached by drei. */
export function disposeAll(...items: (THREE.BufferGeometry | THREE.Material | null | undefined)[]) {
  for (const item of items) item?.dispose();
}
