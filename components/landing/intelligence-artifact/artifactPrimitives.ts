/**
 * artifactPrimitives — pure geometry builders shared across every
 * artifact variant.
 *
 * No React, no R3F, no per-frame state. Each builder returns a
 * `THREE.BufferGeometry` or a structured value containing one. The
 * variant components own the materials, the per-frame opacity
 * envelopes, and the JSX mounts.
 *
 * Keeping the builders here means the three structural metaphors
 * (`ArmillaryDeck`, `NestedShellSphere`, `OrbitalSystem`) can pick the
 * same hairline polygon, diamond, geodesic-edge, and source-mote
 * primitives without redefining them — the artifact language stays
 * consistent across forms.
 */

import * as THREE from "three";
import { lerp } from "./artifactGeom";

// ── Polygon + ticks ──────────────────────────────────────────────────

/** Closed polygon as a `LineLoop` geometry on the XZ plane (Y up). */
export function buildPolygonGeometry(
  radius: number,
  sides: number,
  y: number = 0
): THREE.BufferGeometry {
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

/** Closed polygon as a `LineLoop` on the XY plane (Z = depth). Used by
 *  the shell + orbital variants where rings are tilted around Z. */
export function buildXYPolygonGeometry(
  radius: number,
  sides: number,
  z: number = 0
): THREE.BufferGeometry {
  const positions = new Float32Array(sides * 3);
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    positions[i * 3] = Math.cos(a) * radius;
    positions[i * 3 + 1] = Math.sin(a) * radius;
    positions[i * 3 + 2] = z;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

/** Tick markers as outward-pointing `LineSegments` on the XZ plane. */
export function buildOuterTicks(
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

/** Plated segments: short chord arcs along a polygon with gaps between
 *  them. Reads as engineered plating rather than a continuous ring. */
export function buildPlatedSegments(
  radius: number,
  sides: number,
  segmentFill: number,
  y: number = 0
): THREE.BufferGeometry {
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

// ── Diamond glyphs ───────────────────────────────────────────────────

/** Diamond outline (4-vertex `LineLoop`) on the XY plane. Billboarded
 *  by mounting at the camera-facing position. */
export function buildDiamondGeometry(size: number): THREE.BufferGeometry {
  const positions = new Float32Array([0, size, 0, size, 0, 0, 0, -size, 0, -size, 0, 0]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

/** Filled diamond (2 triangles). */
export function buildFilledDiamondGeometry(size: number): THREE.BufferGeometry {
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

// ── Geodesic edges ───────────────────────────────────────────────────

/** Icosahedron edge wireframe at the given radius + detail. */
export function buildGeodesicEdges(radius: number, detail: number): THREE.BufferGeometry {
  const ico = new THREE.IcosahedronGeometry(radius, detail);
  const edges = new THREE.EdgesGeometry(ico);
  ico.dispose();
  return edges;
}

// ── Pylon masts (Armillary variant) ──────────────────────────────────

/** Vertical mast segments rising from the deck Y plane to a fixed
 *  height at evenly-spaced radial positions. */
export function buildPylonMastGeometry(
  height: number,
  rootRadius: number,
  pylonCount: number,
  baseY: number = 0
): THREE.BufferGeometry {
  const positions = new Float32Array(pylonCount * 2 * 3);
  for (let i = 0; i < pylonCount; i++) {
    const a = (i / pylonCount) * Math.PI * 2;
    const x = Math.cos(a) * rootRadius;
    const z = Math.sin(a) * rootRadius;
    positions[i * 6] = x;
    positions[i * 6 + 1] = baseY;
    positions[i * 6 + 2] = z;
    positions[i * 6 + 3] = x;
    positions[i * 6 + 4] = baseY + height;
    positions[i * 6 + 5] = z;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

// ── Source channels + motes (Armillary variant) ──────────────────────

/** Inbound source channels: radial `LineSegments` from the outer rim
 *  toward an inner radius. Stops short of the centre so the channels
 *  point at it without crossing the substrate. */
export function buildSourceChannelsGeometry(
  count: number,
  outerRadius: number,
  innerRadius: number,
  y: number = 0,
  angleOffset: number = 0
): THREE.BufferGeometry {
  const positions = new Float32Array(count * 2 * 3);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + angleOffset;
    const c = Math.cos(a);
    const s = Math.sin(a);
    positions[i * 6] = c * outerRadius;
    positions[i * 6 + 1] = y;
    positions[i * 6 + 2] = s * outerRadius;
    positions[i * 6 + 3] = c * innerRadius;
    positions[i * 6 + 4] = y;
    positions[i * 6 + 5] = s * innerRadius;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

/** Deterministic source-mote particle field. Used both by the
 *  armillary deck (inbound channel drift) and by the orbital variant
 *  (planar drift around the substrate). */
export interface SourceMotesData {
  geometry: THREE.BufferGeometry;
  phases: Float32Array;
  channelDirs: Float32Array;
  channelOrigins: Float32Array;
  channelCount: number;
  motesPerChannel: number;
}

export function buildSourceMotes(
  channelCount: number,
  motesPerChannel: number,
  outerRadius: number,
  innerRadius: number,
  y: number = 0,
  angleOffset: number = 0
): SourceMotesData {
  const total = channelCount * motesPerChannel;
  const positions = new Float32Array(total * 3);
  const phases = new Float32Array(total);
  const dirs = new Float32Array(channelCount * 3);
  const origins = new Float32Array(channelCount * 3);

  for (let i = 0; i < channelCount; i++) {
    const a = (i / channelCount) * Math.PI * 2 + angleOffset;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const ox = c * outerRadius;
    const oz = s * outerRadius;
    const ix = c * innerRadius;
    const iz = s * innerRadius;
    origins[i * 3] = ox;
    origins[i * 3 + 1] = y;
    origins[i * 3 + 2] = oz;
    dirs[i * 3] = ix - ox;
    dirs[i * 3 + 1] = 0;
    dirs[i * 3 + 2] = iz - oz;

    for (let m = 0; m < motesPerChannel; m++) {
      const idx = i * motesPerChannel + m;
      const t = m / motesPerChannel;
      positions[idx * 3] = lerp(ox, ix, t);
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = lerp(oz, iz, t);
      phases[idx] = t;
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return {
    geometry: g,
    phases,
    channelDirs: dirs,
    channelOrigins: origins,
    channelCount,
    motesPerChannel,
  };
}

/** Step the source motes one frame. Mutates the geometry's position
 *  attribute in place; caller must set `needsUpdate = true`. */
export function advanceSourceMotes(motes: SourceMotesData, driftT: number): void {
  const posAttr = motes.geometry.getAttribute("position") as THREE.BufferAttribute;
  const { phases, channelDirs, channelOrigins, channelCount, motesPerChannel } = motes;
  const totalMotes = channelCount * motesPerChannel;
  for (let i = 0; i < totalMotes; i++) {
    const channelIdx = Math.floor(i / motesPerChannel);
    const phase = phases[i];
    const localT = (phase + driftT) % 1;
    const ox = channelOrigins[channelIdx * 3];
    const oy = channelOrigins[channelIdx * 3 + 1];
    const oz = channelOrigins[channelIdx * 3 + 2];
    const dx = channelDirs[channelIdx * 3];
    const dy = channelDirs[channelIdx * 3 + 1];
    const dz = channelDirs[channelIdx * 3 + 2];
    posAttr.setXYZ(i, ox + dx * localT, oy + dy * localT, oz + dz * localT);
  }
  posAttr.needsUpdate = true;
}

// ── Knowledge-graph struts (Armillary variant) ───────────────────────

/** Fan of hairlines from a deck radius up to the lower hemisphere of
 *  the substrate sphere. Reads as semantic relations binding the
 *  substrate to the floor. */
export function buildGraphStrutsGeometry(
  count: number,
  rootRadius: number,
  rootY: number,
  tipRadius: number,
  tipY: number,
  angleOffset: number = 0
): THREE.BufferGeometry {
  const positions = new Float32Array(count * 2 * 3);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + angleOffset;
    const c = Math.cos(a);
    const s = Math.sin(a);
    positions[i * 6] = c * rootRadius;
    positions[i * 6 + 1] = rootY;
    positions[i * 6 + 2] = s * rootRadius;
    positions[i * 6 + 3] = c * tipRadius;
    positions[i * 6 + 4] = tipY;
    positions[i * 6 + 5] = s * tipRadius;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

// ── Ring of pip diamond positions ────────────────────────────────────

/** Compute evenly-distributed 3D positions on a ring, used by every
 *  variant for pip / port placement. */
export function ringPositions(
  count: number,
  radius: number,
  y: number = 0,
  angleOffset: number = 0
): Array<[number, number, number]> {
  const out: Array<[number, number, number]> = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + angleOffset;
    out.push([Math.cos(a) * radius, y, Math.sin(a) * radius]);
  }
  return out;
}

// ── Material factories (shared) ──────────────────────────────────────

/** Hairline line material. Use `additive = true` for accent lines, leave
 *  false for body lines so they don't blow out at intersections. */
export function makeLineMaterial(
  color: number,
  opacity: number,
  additive: boolean = false
): THREE.LineBasicMaterial {
  return new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
}

/** Filled mesh material, double-sided + transparent. */
export function makeMeshMaterial(color: number, opacity: number): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

/** Points material. Set `additive = true` only for very low-density
 *  fields where overlap risk is minimal — otherwise normal blending
 *  prevents the gold blow-out the artifact's first iteration had. */
export function makePointsMaterial(
  color: number,
  opacity: number,
  size: number,
  additive: boolean = false
): THREE.PointsMaterial {
  return new THREE.PointsMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    size,
    sizeAttenuation: true,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
}

// ── Slab edge (Strata variant) ───────────────────────────────────────

/** Rectangular hairline frame on the XZ plane (Y up), used as the
 *  edge of a stratum slab. Optional internal subdivision lines give
 *  the slab a "tile / floor" register. */
export function buildSlabEdgeGeometry(
  halfWidth: number,
  halfDepth: number,
  y: number,
  subdivisions: number = 0
): THREE.BufferGeometry {
  const positions: number[] = [];
  // Outer frame (closed LineLoop equivalent rendered as LineSegments).
  const corners: Array<[number, number]> = [
    [-halfWidth, -halfDepth],
    [halfWidth, -halfDepth],
    [halfWidth, halfDepth],
    [-halfWidth, halfDepth],
  ];
  for (let i = 0; i < 4; i++) {
    const [ax, az] = corners[i];
    const [bx, bz] = corners[(i + 1) % 4];
    positions.push(ax, y, az, bx, y, bz);
  }
  // Internal grid lines for the "floor tile" feel.
  for (let i = 1; i < subdivisions; i++) {
    const t = i / subdivisions;
    const x = lerp(-halfWidth, halfWidth, t);
    positions.push(x, y, -halfDepth, x, y, halfDepth);
    const z = lerp(-halfDepth, halfDepth, t);
    positions.push(-halfWidth, y, z, halfWidth, y, z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return g;
}

/** Four corner pillars connecting two slab Y planes. Used by the
 *  Strata variant to bind the top / middle / bottom slabs into one
 *  cross-section structure. */
export function buildSlabPillarsGeometry(
  halfWidth: number,
  halfDepth: number,
  yBottom: number,
  yTop: number
): THREE.BufferGeometry {
  const corners: Array<[number, number]> = [
    [-halfWidth, -halfDepth],
    [halfWidth, -halfDepth],
    [halfWidth, halfDepth],
    [-halfWidth, halfDepth],
  ];
  const positions = new Float32Array(corners.length * 2 * 3);
  for (let i = 0; i < corners.length; i++) {
    const [x, z] = corners[i];
    positions[i * 6] = x;
    positions[i * 6 + 1] = yBottom;
    positions[i * 6 + 2] = z;
    positions[i * 6 + 3] = x;
    positions[i * 6 + 4] = yTop;
    positions[i * 6 + 5] = z;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

/** Evenly-distributed grid positions on the XZ plane (Y constant). */
export function gridPositions(
  cols: number,
  rows: number,
  halfWidth: number,
  halfDepth: number,
  y: number = 0
): Array<[number, number, number]> {
  const out: Array<[number, number, number]> = [];
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const tx = cols === 1 ? 0.5 : i / (cols - 1);
      const tz = rows === 1 ? 0.5 : j / (rows - 1);
      out.push([lerp(-halfWidth, halfWidth, tx), y, lerp(-halfDepth, halfDepth, tz)]);
    }
  }
  return out;
}

// ── Scattered stars (Constellation variant) ──────────────────────────

/** Mulberry32-style deterministic PRNG. Seeded by a 32-bit integer so
 *  the same seed always yields the same scatter — important for
 *  testability and HMR stability. */
function makePrng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generate a deterministic scatter of star positions inside a
 *  hemisphere (Y > 0 if `upper`, Y < 0 otherwise). Used by the
 *  Constellation variant to place Sources / Surfaces stars around the
 *  central substrate. Returns local positions in scene units. */
export function scatterHemisphereStars(
  count: number,
  radius: number,
  upper: boolean,
  seed: number,
  minTilt: number = 0.18
): Array<[number, number, number]> {
  const prng = makePrng(seed);
  const out: Array<[number, number, number]> = [];
  for (let i = 0; i < count; i++) {
    // Stratified azimuth so we don't get clumps.
    const az = (i / count) * Math.PI * 2 + prng() * 0.6;
    // Elevation biased toward the equator with a minimum tilt so no
    // star sits exactly on the equator (which would look like a ring).
    const elevation = minTilt + prng() * (Math.PI / 2 - minTilt) * 0.85;
    const r = radius * (0.85 + prng() * 0.3);
    const horiz = Math.cos(elevation) * r;
    const vert = Math.sin(elevation) * r * (upper ? 1 : -1);
    out.push([Math.cos(az) * horiz, vert, Math.sin(az) * horiz]);
  }
  return out;
}

/** A short bezier curve hairline from `start` to `end`, dipping toward
 *  the origin by `dip` units at its midpoint. Used by the Constellation
 *  variant to draw inbound / outbound trajectories that visibly curve
 *  through the artifact's interior. */
export function buildBezierCurveGeometry(
  start: readonly [number, number, number],
  end: readonly [number, number, number],
  dip: number,
  segments: number = 24
): THREE.BufferGeometry {
  const positions = new Float32Array((segments + 1) * 3);
  const mx = (start[0] + end[0]) / 2;
  const my = (start[1] + end[1]) / 2;
  const mz = (start[2] + end[2]) / 2;
  // Pull the midpoint toward origin by `dip` so the curve bows inward.
  const midLen = Math.hypot(mx, my, mz);
  const cx = midLen > 1e-4 ? mx * (1 - dip / midLen) : mx;
  const cy = midLen > 1e-4 ? my * (1 - dip / midLen) : my;
  const cz = midLen > 1e-4 ? mz * (1 - dip / midLen) : mz;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const inv = 1 - t;
    // Quadratic bezier with single control point (cx, cy, cz).
    const x = inv * inv * start[0] + 2 * inv * t * cx + t * t * end[0];
    const y = inv * inv * start[1] + 2 * inv * t * cy + t * t * end[1];
    const z = inv * inv * start[2] + 2 * inv * t * cz + t * t * end[2];
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

// ── Lane geometry (Funnel variant) ───────────────────────────────────

/** Lateral lane lines from `startX` to `endX` at evenly-spaced Y
 *  positions. Reads as the channels of a horizontal flow pipeline. */
export function buildLaneLinesGeometry(
  laneCount: number,
  startX: number,
  endX: number,
  yRange: number,
  z: number = 0
): THREE.BufferGeometry {
  const positions = new Float32Array(laneCount * 2 * 3);
  for (let i = 0; i < laneCount; i++) {
    const t = laneCount === 1 ? 0.5 : i / (laneCount - 1);
    const y = lerp(-yRange, yRange, t);
    positions[i * 6] = startX;
    positions[i * 6 + 1] = y;
    positions[i * 6 + 2] = z;
    positions[i * 6 + 3] = endX;
    positions[i * 6 + 4] = y;
    positions[i * 6 + 5] = z;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

/** Diverging fan: a set of lines all starting at `origin` and ending
 *  at the supplied destination points. Used for the Funnel's Surfaces
 *  output rays. */
export function buildFanLinesGeometry(
  origin: readonly [number, number, number],
  destinations: ReadonlyArray<readonly [number, number, number]>
): THREE.BufferGeometry {
  const positions = new Float32Array(destinations.length * 2 * 3);
  for (let i = 0; i < destinations.length; i++) {
    positions[i * 6] = origin[0];
    positions[i * 6 + 1] = origin[1];
    positions[i * 6 + 2] = origin[2];
    positions[i * 6 + 3] = destinations[i][0];
    positions[i * 6 + 4] = destinations[i][1];
    positions[i * 6 + 5] = destinations[i][2];
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

/** Linear flow motes: deterministic dot positions along a straight
 *  segment from `start` to `end`, each carrying a phase so the painter
 *  can drift them along the segment. Used by the Funnel for the
 *  Sources -> Substrate -> Surfaces flow. */
export interface LinearMotesData {
  geometry: THREE.BufferGeometry;
  phases: Float32Array;
  starts: Float32Array; // length count*3 — per-mote start
  dirs: Float32Array; // length count*3 — per-mote (end - start)
}

export function buildLinearMotes(
  laneStarts: ReadonlyArray<readonly [number, number, number]>,
  laneEnds: ReadonlyArray<readonly [number, number, number]>,
  motesPerLane: number
): LinearMotesData {
  if (laneStarts.length !== laneEnds.length) {
    throw new Error("laneStarts and laneEnds must have the same length");
  }
  const laneCount = laneStarts.length;
  const total = laneCount * motesPerLane;
  const positions = new Float32Array(total * 3);
  const phases = new Float32Array(total);
  const starts = new Float32Array(total * 3);
  const dirs = new Float32Array(total * 3);

  for (let i = 0; i < laneCount; i++) {
    const [sx, sy, sz] = laneStarts[i];
    const [ex, ey, ez] = laneEnds[i];
    for (let m = 0; m < motesPerLane; m++) {
      const idx = i * motesPerLane + m;
      const t = m / motesPerLane;
      positions[idx * 3] = lerp(sx, ex, t);
      positions[idx * 3 + 1] = lerp(sy, ey, t);
      positions[idx * 3 + 2] = lerp(sz, ez, t);
      phases[idx] = t;
      starts[idx * 3] = sx;
      starts[idx * 3 + 1] = sy;
      starts[idx * 3 + 2] = sz;
      dirs[idx * 3] = ex - sx;
      dirs[idx * 3 + 1] = ey - sy;
      dirs[idx * 3 + 2] = ez - sz;
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return { geometry: g, phases, starts, dirs };
}

/** Step the linear motes one frame. Mutates the geometry. */
export function advanceLinearMotes(motes: LinearMotesData, driftT: number): void {
  const posAttr = motes.geometry.getAttribute("position") as THREE.BufferAttribute;
  const { phases, starts, dirs } = motes;
  const total = phases.length;
  for (let i = 0; i < total; i++) {
    const localT = (phases[i] + driftT) % 1;
    const sx = starts[i * 3];
    const sy = starts[i * 3 + 1];
    const sz = starts[i * 3 + 2];
    const dx = dirs[i * 3];
    const dy = dirs[i * 3 + 1];
    const dz = dirs[i * 3 + 2];
    posAttr.setXYZ(i, sx + dx * localT, sy + dy * localT, sz + dz * localT);
  }
  posAttr.needsUpdate = true;
}
