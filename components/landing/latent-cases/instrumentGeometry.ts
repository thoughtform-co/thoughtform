/**
 * Parametric samples for the latent showcase WebGL instrument.
 * Mirrors celestial connector grammar (rings, spokes, diamonds, constellations) as dense point paths.
 */
import { seededRandom } from "@/components/landing/v7/CelestialConnector/shapes/seededRandom";

const FLATTEN = 0.42;

function pushSegment(
  out: number[],
  x0: number,
  y0: number,
  z0: number,
  x1: number,
  y1: number,
  z1: number,
  steps: number
): void {
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    out.push(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z0 + (z1 - z0) * t);
  }
}

/** Rotated square outline in XY at z */
export function sampleDiamond(radius: number, pointsPerEdge: number, z = 0): Float32Array {
  const pts: number[] = [];
  const corners: [number, number][] = [
    [0, radius],
    [radius, 0],
    [0, -radius],
    [-radius, 0],
  ];
  for (let e = 0; e < 4; e++) {
    const [x0, y0] = corners[e]!;
    const [x1, y1] = corners[(e + 1) % 4]!;
    for (let i = 0; i < pointsPerEdge; i++) {
      const t = i / pointsPerEdge;
      pts.push(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z);
    }
  }
  return new Float32Array(pts);
}

/** L-bracket near a diamond vertex (outward + along-edge ticks) */
export function sampleCornerBracket(
  vx: number,
  vy: number,
  z: number,
  tangentIn: [number, number],
  outward: [number, number],
  arm: number
): Float32Array {
  const pts: number[] = [];
  const [tx, ty] = tangentIn;
  const [ox, oy] = outward;
  const nx = vx + ox * arm * 0.15;
  const ny = vy + oy * arm * 0.15;
  pushSegment(pts, vx, vy, z, nx, ny, z, 6);
  pushSegment(pts, vx, vy, z, vx + tx * arm, vy + ty * arm, z, 6);
  return new Float32Array(pts);
}

export function sampleEllipse(
  rx: number,
  ry: number,
  z: number,
  segments: number,
  tiltX = 0,
  tiltZ = 0
): Float32Array {
  const pts: number[] = [];
  const cx = Math.cos(tiltZ);
  const sx = Math.sin(tiltZ);
  const cX = Math.cos(tiltX);
  const sX = Math.sin(tiltX);
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    let x = rx * Math.cos(t);
    let y = ry * Math.sin(t);
    let zz = z;
    // tilt around Z (yaw in plane)
    const x1 = x * cx - y * sx;
    const y1 = x * sx + y * cx;
    x = x1;
    y = y1;
    // tilt around X
    const y2 = y * cX - zz * sX;
    const z2 = y * sX + zz * cX;
    y = y2;
    zz = z2;
    pts.push(x, y, zz);
  }
  return new Float32Array(pts);
}

/** Closed loop for lineLoop (repeat first at end) */
export function sampleEllipseLoop(
  rx: number,
  ry: number,
  z: number,
  segments: number,
  tiltX = 0,
  tiltZ = 0
): Float32Array {
  const arc = sampleEllipse(rx, ry, z, segments, tiltX, tiltZ);
  const out = new Float32Array(arc.length + 3);
  out.set(arc);
  out[arc.length] = arc[0]!;
  out[arc.length + 1] = arc[1]!;
  out[arc.length + 2] = arc[2]!;
  return out;
}

export function sampleSpokes(
  count: number,
  rx: number,
  ry: number,
  z: number,
  innerT: number,
  outerT: number,
  steps: number,
  tiltX = 0,
  tiltZ = 0
): Float32Array {
  const pts: number[] = [];
  const cx = Math.cos(tiltZ);
  const sx = Math.sin(tiltZ);
  const cX = Math.cos(tiltX);
  const sX = Math.sin(tiltX);
  const map = (x: number, y: number, zz: number): [number, number, number] => {
    let mx = x * cx - y * sx;
    let my = x * sx + y * cx;
    x = mx;
    y = my;
    const y2 = y * cX - zz * sX;
    const z2 = y * sX + zz * cX;
    return [x, y2, z2];
  };
  for (let i = 0; i < count; i++) {
    const ang = (i / count) * Math.PI * 2;
    const x0 = rx * innerT * Math.cos(ang);
    const y0 = ry * innerT * Math.sin(ang);
    const x1 = rx * outerT * Math.cos(ang);
    const y1 = ry * outerT * Math.sin(ang);
    const [sx0, sy0, sz0] = map(x0, y0, z);
    const [sx1, sy1, sz1] = map(x1, y1, z);
    pushSegment(pts, sx0, sy0, sz0, sx1, sy1, sz1, steps);
  }
  return new Float32Array(pts);
}

export function sampleCardinalCross(
  rx: number,
  ry: number,
  z: number,
  steps: number,
  tiltX = 0,
  tiltZ = 0
): Float32Array {
  const pts: number[] = [];
  const cx = Math.cos(tiltZ);
  const sx = Math.sin(tiltZ);
  const cX = Math.cos(tiltX);
  const sX = Math.sin(tiltX);
  const map = (x: number, y: number, zz: number): [number, number, number] => {
    let mx = x * cx - y * sx;
    let my = x * sx + y * cx;
    x = mx;
    y = my;
    const y2 = y * cX - zz * sX;
    const z2 = y * sX + zz * cX;
    return [x, y2, z2];
  };
  const segs: [number, number, number, number, number, number][] = [
    [-rx, 0, z, rx, 0, z],
    [0, -ry, z, 0, ry, z],
  ];
  for (const [xa, ya, za, xb, yb, zb] of segs) {
    const [ax, ay, az] = map(xa, ya, za);
    const [bx, by, bz] = map(xb, yb, zb);
    pushSegment(pts, ax, ay, az, bx, by, bz, steps);
  }
  return new Float32Array(pts);
}

export function sampleCourseLines(
  origins: [number, number][],
  headingsDeg: number[],
  length: number,
  steps: number,
  z: number
): Float32Array {
  const pts: number[] = [];
  for (let i = 0; i < origins.length; i++) {
    const [ox, oy] = [origins[i]![0], origins[i]![1]];
    const rad = (headingsDeg[i]! * Math.PI) / 180;
    const dx = Math.cos(rad) * length;
    const dy = Math.sin(rad) * length;
    pushSegment(pts, ox, oy, z, ox + dx, oy + dy, z, steps);
  }
  return new Float32Array(pts);
}

export function sampleConstellation(
  seed: number,
  nodeCount: number,
  edges: [number, number][],
  opts?: { radMin?: number; radSpread?: number }
): Float32Array {
  const rnd = seededRandom(seed);
  const radMin = opts?.radMin ?? 0.55;
  const radSpread = opts?.radSpread ?? 0.48;
  const nodes: [number, number, number][] = [];
  for (let i = 0; i < nodeCount; i++) {
    const ang = rnd() * Math.PI * 2;
    const rad = radMin + rnd() * radSpread;
    const z = rnd() * 0.35;
    nodes.push([rad * Math.cos(ang), rad * FLATTEN * Math.sin(ang), z]);
  }
  const pts: number[] = [];
  for (const [a, b] of edges) {
    if (a >= nodes.length || b >= nodes.length) continue;
    const p0 = nodes[a]!;
    const p1 = nodes[b]!;
    pushSegment(pts, p0[0], p0[1], p0[2], p1[0], p1[1], p1[2], 10);
  }
  const tick = 0.014;
  for (let i = 0; i < Math.min(5, nodeCount); i++) {
    const n = nodes[i]!;
    pushSegment(pts, n[0] - tick, n[1], n[2], n[0] + tick, n[1], n[2], 2);
    pushSegment(pts, n[0], n[1] - tick, n[2], n[0], n[1] + tick, n[2], 2);
  }
  return new Float32Array(pts);
}

export function sampleDiamondMarker(
  cx: number,
  cy: number,
  cz: number,
  side: number
): Float32Array {
  const pts: number[] = [];
  const c = Math.cos(Math.PI / 4);
  const s = Math.sin(Math.PI / 4);
  const corners: [number, number][] = [
    [-side, -side],
    [side, -side],
    [side, side],
    [-side, side],
  ].map(([dx, dy]) => {
    const rx = dx * c - dy * s;
    const ry = dx * s + dy * c;
    return [cx + rx, cy + ry] as [number, number];
  });
  for (let k = 0; k < 4; k++) {
    const a = corners[k]!;
    const b = corners[(k + 1) % 4]!;
    pushSegment(pts, a[0], a[1], cz, b[0], b[1], cz, 5);
  }
  return new Float32Array(pts);
}

export function sampleFieldStars(seed: number, count: number): Float32Array {
  const rnd = seededRandom(seed + 777);
  const pts: number[] = [];
  for (let i = 0; i < count; i++) {
    const ang = rnd() * Math.PI * 2;
    const rad = 0.25 + rnd() * 1.05;
    const z = -0.4 + rnd() * 1.2;
    pts.push(rad * Math.cos(ang), rad * FLATTEN * Math.sin(ang), z);
  }
  return new Float32Array(pts);
}

export interface InstrumentGeometry {
  /** Dawn — celestial overlay (orbits, spokes, course lines, constellation, field stars) */
  dawnPoints: Float32Array;
  /** Gold — cardinal cross + waypoint diamonds (inside portal silhouette) */
  goldPoints: Float32Array;
}

/**
 * Subordinate celestial overlay: no outer diamond frame (v1 `LatentPortalContour` supplies silhouette).
 */
export function buildLatentInstrumentGeometry(): InstrumentGeometry {
  const dawn: number[] = [];

  const orbitZs = [0.06, 0.12, 0.2, 0.28, 0.36];
  const orbitRx = [0.34, 0.4, 0.46, 0.52, 0.62];
  for (let i = 0; i < orbitZs.length; i++) {
    const rx = orbitRx[i]!;
    const ry = rx * FLATTEN;
    const tiltX = (i - 2) * 0.09;
    const tiltZ = (i - 2) * 0.05;
    append(dawn, sampleEllipse(rx, ry, orbitZs[i]!, 48, tiltX, tiltZ));
  }

  append(dawn, sampleSpokes(12, 0.62, 0.62 * FLATTEN, 0.32, 0.12, 1.0, 10, 0.06, 0.04));

  const courseR = 0.72;
  append(
    dawn,
    sampleCourseLines(
      [
        [courseR * 0.92, 0],
        [0, courseR * 0.92],
        [-courseR * 0.92, 0],
        [0, -courseR * 0.92],
      ],
      [42, 138, -48, -132],
      0.42,
      12,
      0.18
    )
  );

  append(
    dawn,
    sampleConstellation(
      4242,
      8,
      [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
        [1, 4],
        [4, 5],
        [5, 6],
        [2, 7],
      ],
      { radMin: 0.3, radSpread: 0.32 }
    )
  );

  append(dawn, sampleFieldStars(2026, 36));

  const gold: number[] = [];
  const hr = 0.7;
  const hry = hr * FLATTEN;

  append(gold, sampleCardinalCross(hr * 0.92, hry * 0.92, 0.34, 14, 0.04, 0.03));

  const markers = 5;
  for (let m = 0; m < markers; m++) {
    const ang = (m / markers) * Math.PI * 2 + 0.35;
    const mx = 0.63 * Math.cos(ang);
    const my = 0.63 * FLATTEN * Math.sin(ang);
    append(gold, sampleDiamondMarker(mx, my, 0.33, 0.028));
  }

  return {
    dawnPoints: new Float32Array(dawn),
    goldPoints: new Float32Array(gold),
  };
}

function append(target: number[], buf: Float32Array): void {
  for (let i = 0; i < buf.length; i++) target.push(buf[i]!);
}
