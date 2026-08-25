/**
 * holoProgramBuilders — the trajectory instrument's geometry.
 *
 * Pure builders in the `artifactPrimitives` contract: every function returns
 * a `THREE.BufferGeometry` (or plain point arrays for drei's fat `Line`) and
 * holds no React, no per-frame state and no material. The scene owns
 * lifetime; this file owns shape.
 *
 * ⚠ The DEPTH READ comes from per-vertex colour, not from a shader. A ring's
 * near arc is bright and its far arc dim (`HologramOrbits`' own bake), which
 * is what makes a flat line loop read as a body the axis passes through.
 */

import * as THREE from "three";

import {
  AXIS_Y,
  GROUND_Y,
  RING_SEGMENTS,
  TICK_LEN,
  tickCount,
  type HoloLayout,
} from "./holoProgramGeom";

/** Front/back contrast, verbatim from the corridor's rings so the two
 *  instruments weave the same way. */
function frontness(z: number, radius: number): number {
  const t = (z / Math.max(radius, 1e-6)) * 0.5 + 0.5;
  return 0.16 + 0.84 * Math.min(1, Math.max(0, t));
}

export interface RingPoints {
  points: THREE.Vector3[];
  colors: [number, number, number][];
}

/**
 * One waypoint's ring: a closed loop in the plane PERPENDICULAR to the time
 * axis, centred on the axis at `x`.
 *
 * ⚠ VERTEX 0 SITS AT THE TOP, which is where the DOM station's stem points.
 * The stroke draw-on runs from vertex 0, so a ring appears to grow from
 * under its own label rather than from an arbitrary side.
 */
export function buildRingPoints(x: number, radius: number, color: THREE.Color): RingPoints {
  const points: THREE.Vector3[] = [];
  const colors: [number, number, number][] = [];
  for (let i = 0; i <= RING_SEGMENTS; i++) {
    // Start at the top (+y) and run around; z carries the depth read.
    const a = Math.PI / 2 + (i / RING_SEGMENTS) * Math.PI * 2;
    const y = AXIS_Y + Math.sin(a) * radius;
    const z = Math.cos(a) * radius;
    points.push(new THREE.Vector3(x, y, z));
    const b = frontness(z, radius);
    colors.push([color.r * b, color.g * b, color.b * b]);
  }
  return { points, colors };
}

/**
 * Every ring's rim ticks in ONE buffer, ordered ring by ring.
 *
 * The ordering is load-bearing: the arrival populates a ring's ticks with
 * `setDrawRange` just after that ring's stroke closes, which is only
 * possible while one ring's ticks are contiguous. Returns the per-ring
 * segment offsets alongside the geometry.
 */
export function buildTickField(layout: HoloLayout): {
  geometry: THREE.BufferGeometry;
  /** [startVertex, vertexCount] per ring, in layout order. */
  ranges: (readonly [number, number])[];
} {
  const positions: number[] = [];
  const ranges: (readonly [number, number])[] = [];
  for (const ring of layout.rings) {
    const start = positions.length / 3;
    const n = tickCount(ring.radius);
    for (let i = 0; i < n; i++) {
      const a = Math.PI / 2 + (i / n) * Math.PI * 2;
      const sy = Math.sin(a);
      const sz = Math.cos(a);
      const outer = ring.radius;
      const inner = ring.radius - TICK_LEN;
      positions.push(ring.x, AXIS_Y + sy * outer, sz * outer);
      positions.push(ring.x, AXIS_Y + sy * inner, sz * inner);
    }
    ranges.push([start, positions.length / 3 - start]);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return { geometry, ranges };
}

/**
 * The time axis rail, as fat-line points.
 *
 * ⚠ SUBDIVIDED, and that is not decoration. A fat line renders one instance
 * per SEGMENT and the stroke draw-on works by capping `instanceCount`, so a
 * two-point rail can only ever appear all at once. The subdivision is the
 * draw-on's resolution.
 */
export function buildAxisPoints(from: number, to: number, steps = 96): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= steps; i++) {
    points.push(new THREE.Vector3(from + ((to - from) * i) / steps, AXIS_Y, 0));
  }
  return points;
}

/**
 * The adoption ladder: the rings' upper-rim envelope, drawn as risers and
 * runs. It is the flat board's own step curve in world space — same treads,
 * same rise, one encoding drawn twice.
 */
export function buildLadderPoints(layout: HoloLayout): THREE.Vector3[] {
  return layout.ladder.map(([x, y]) => new THREE.Vector3(x, y, 0));
}

/**
 * The drop stems: one hairline from each ring's lowest rim point to the
 * ground plane. The reference's "grid sticks", placed at the seven real
 * dates rather than scattered for texture.
 */
export function buildDropStems(layout: HoloLayout): THREE.BufferGeometry {
  const positions: number[] = [];
  for (const ring of layout.rings) {
    const foot = AXIS_Y - ring.radius;
    positions.push(ring.x, foot, 0);
    positions.push(ring.x, GROUND_Y, 0);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

/**
 * The graticule: a faint ground grid under the instrument. Chrome — it
 * carries no reading, and nothing is measured against it.
 */
export function buildGroundGrid(
  from: number,
  to: number,
  depth = 2.6,
  stepX = 0.42,
  stepZ = 0.52
): THREE.BufferGeometry {
  const positions: number[] = [];
  const halfZ = depth / 2;
  for (let x = Math.ceil(from / stepX) * stepX; x <= to; x += stepX) {
    positions.push(x, GROUND_Y, -halfZ, x, GROUND_Y, halfZ);
  }
  for (let z = -halfZ; z <= halfZ + 1e-6; z += stepZ) {
    positions.push(from, GROUND_Y, z, to, GROUND_Y, z);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

/** The parallel platform rail — ONE dashed line under the axis, because the
 *  record gives one log row. Inventing segment boundaries here would be
 *  publishing a structure the record does not have. */
export function buildParallelPoints(from: number, to: number, dy: number): THREE.Vector3[] {
  return [new THREE.Vector3(from, AXIS_Y + dy, 0), new THREE.Vector3(to, AXIS_Y + dy, 0)];
}

/**
 * A prior: a small outline diamond on the axis. The priors are NOT rings —
 * a ring radius would claim an adoption level the record never gives them.
 */
export function buildPriorDiamond(x: number, size = 0.086): THREE.Vector3[] {
  return [
    new THREE.Vector3(x, AXIS_Y + size, 0),
    new THREE.Vector3(x + size, AXIS_Y, 0),
    new THREE.Vector3(x, AXIS_Y - size, 0),
    new THREE.Vector3(x - size, AXIS_Y, 0),
    new THREE.Vector3(x, AXIS_Y + size, 0),
  ];
}

/**
 * A bright accent arc on a ring's upper rim — the bloom donor whose fringe
 * the chromatic aberration smears. Exactly three exist on the whole
 * instrument; more and it stops being an instrument and starts being a
 * light show.
 */
export function buildAccentArc(
  x: number,
  radius: number,
  spanRad: number,
  centreRad = Math.PI / 2
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const steps = 48;
  for (let i = 0; i <= steps; i++) {
    const a = centreRad - spanRad / 2 + (i / steps) * spanRad;
    points.push(new THREE.Vector3(x, AXIS_Y + Math.sin(a) * radius, Math.cos(a) * radius));
  }
  return points;
}

/** Dispose a geometry and forget it — the scene calls this on unmount for
 *  everything it built, since none of it is cached by drei. */
export function disposeAll(...items: (THREE.BufferGeometry | THREE.Material | null | undefined)[]) {
  for (const item of items) item?.dispose();
}
