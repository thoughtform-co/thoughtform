/**
 * The machine mind (ADR-156 U6): a brain built as a machine, part by part.
 *
 * The anatomy method (as the proposal swarm used it): invent the mechanism,
 * name every part, give it true geometry, and let no line end in mid-air;
 * then the house's particles are its texture. It is NOT a brain with folds
 * (owner, 2026-10-15: "not a brain, but something that looks like a machine
 * brain with circuits ... wireframes, low poly, or a particle system").
 *
 *   two cortex shells   low-poly half-ellipsoids, one each side of the groove
 *   cortex dies         chips seated on the shells' upper facets, with pins
 *   traces              circuit runs between dies, along the shells' grid
 *   callosum bus        wires arched over the groove, joining the halves
 *   heatsink            the cerebellum: fins under the back
 *   stem and collars    the brainstem, a column of rings
 *   port and sockets    the plate under the stem; every tendril leaves here
 *
 * Local frame: +x to the front, +y the left hemisphere, +z up. One CAMERA
 * projects it (yaw `psi`, pitch `phi`, orthographic): at psi 45 degrees and
 * phi asin(1/sqrt 3) it is EXACTLY the scene's isometric, so the mind stands
 * on the same projection as the plates; at psi 90 it faces the reader, the
 * two hemispheres side by side.
 *
 * ⚠ PURE: the act paints; this decides.
 */

import type { P2, V3 } from "./scene";

export interface Camera {
  psi: number;
  phi: number;
  /** Pixels per world unit along a screen axis. */
  s: number;
  /** Where the local origin lands, in the viewBox. */
  o: P2;
}

export const ISO_PSI = Math.PI / 4;
export const ISO_PHI = Math.asin(1 / Math.sqrt(3));
/** The scene's U (34) as a camera scale: the isometric foreshortens by sqrt(2/3). */
export const ISO_S = 34 * Math.sqrt(1.5);

export interface Basis {
  ex: P2;
  ey: P2;
  ez: P2;
  /** Toward the viewer, in local space: a face whose normal agrees is lit. */
  view: V3;
}

export function basisOf(c: Camera): Basis {
  const cp = Math.cos(c.psi);
  const sp = Math.sin(c.psi);
  const cf = Math.cos(c.phi);
  const sf = Math.sin(c.phi);
  return {
    ex: { x: cp * c.s, y: sp * sf * c.s },
    ey: { x: -sp * c.s, y: cp * sf * c.s },
    ez: { x: 0, y: -cf * c.s },
    view: { x: sp * cf, y: cp * cf, z: sf },
  };
}

export function projB(p: V3, b: Basis, o: P2): P2 {
  return {
    x: o.x + p.x * b.ex.x + p.y * b.ey.x + p.z * b.ez.x,
    y: o.y + p.x * b.ex.y + p.y * b.ey.y + p.z * b.ez.y,
  };
}

/** Edge kinds, for the paint. */
export const EDGE = { shell: 0, stem: 1, fin: 2, port: 3 } as const;

export interface MindEdge {
  a: number;
  b: number;
  kind: number;
  /** -1 right hemisphere, 1 left, 0 the midline's parts. */
  side: number;
  /** The mean of the faces it bounds (shells), or its own outward (parts). */
  n: V3;
}

export interface MindDot {
  p: V3;
  n: V3;
  side: number;
  /** On an edge (a seam of the low poly) or in a face. */
  seam: boolean;
  /** Its scatter, in screen pixels, before the mind assembles. */
  dx: number;
  dy: number;
  delay: number;
}

export interface MindDie {
  corners: [V3, V3, V3, V3];
  pins: [V3, V3][];
  n: V3;
  side: number;
}

export interface MindModel {
  verts: V3[];
  edges: MindEdge[];
  dots: MindDot[];
  dies: MindDie[];
  /** Circuit runs between dies, on the shells. */
  traces: { pts: V3[]; side: number }[];
  /** The callosum: wires arched over the groove. */
  bus: V3[][];
  /** The port's sockets, where the tendrils leave. */
  sockets: V3[];
  /** Where the middle beat's runs leave each hemisphere's flank. */
  flanks: { tool: V3[]; collab: V3[] };
  /** The anatomy: every named part (the method's list). */
  parts: string[];
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sub = (a: V3, b: V3): V3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const add = (a: V3, b: V3): V3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const scl = (a: V3, k: number): V3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const dot3 = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: V3, b: V3): V3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
const norm = (a: V3): V3 => {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return { x: a.x / l, y: a.y / l, z: a.z / l };
};
const lerp3 = (a: V3, b: V3, t: number): V3 => add(a, scl(sub(b, a), t));

/** The shells' true numbers, in world units (a plate is 8 by 4.5). */
export const SHELL = {
  /** Each hemisphere's centre is this far off the groove. */
  off: 1.95,
  r: { x: 4.4, y: 2.05, z: 3.0 },
  /** The flat inner face, either side of the groove. */
  medial: 0.24,
  /** Under this the shell is pressed flat, as a brain's base is. */
  floor: -1.9,
  rings: 9,
  segs: 18,
} as const;

/** The stem and its port. */
export const STEM = { x: -0.9, r: 0.72, top: -2.05, bottom: -4.5, sides: 8, collars: 4 } as const;
export const PORT = { z: -4.8, r: 1.25, sockets: 6 } as const;

let cache: MindModel | null = null;

export function mindModel(): MindModel {
  if (cache) return cache;
  const rnd = mulberry32(2026);
  const verts: V3[] = [];
  const edges: MindEdge[] = [];
  const dots: MindDot[] = [];
  const dies: MindDie[] = [];
  const traces: { pts: V3[]; side: number }[] = [];
  const parts: string[] = [];
  const scatter = () => {
    const ang = rnd() * Math.PI * 2;
    const rad = 220 + rnd() * 420;
    return { dx: Math.cos(ang) * rad, dy: Math.sin(ang) * rad * 0.7, delay: rnd() * 0.4 };
  };

  // ── The two cortex shells ──────────────────────────────────────────────
  const R = SHELL.rings;
  const S = SHELL.segs;
  for (const side of [1, -1] as const) {
    parts.push(side > 0 ? "left cortex shell" : "right cortex shell");
    const c: V3 = { x: 0, y: side * SHELL.off, z: 0.2 };
    const grid: number[][] = [];
    for (let k = 0; k < R; k++) {
      // Rings from just above the base to just under the crown.
      const lat = -Math.PI / 2 + ((k + 1) / (R + 1)) * Math.PI;
      const row: number[] = [];
      for (let j = 0; j < S; j++) {
        const lon = (j / S) * Math.PI * 2 + (k % 2) * (Math.PI / S);
        const nx = Math.cos(lat) * Math.cos(lon);
        const ny = Math.cos(lat) * Math.sin(lon);
        const nz = Math.sin(lat);
        const jit = 0.93 + rnd() * 0.12;
        let p: V3 = {
          x: c.x + nx * SHELL.r.x * jit * (nx > 0 ? 1.06 : 1),
          y: c.y + ny * SHELL.r.y * jit,
          z: c.z + nz * SHELL.r.z * jit,
        };
        if (side * p.y < SHELL.medial) p = { ...p, y: side * SHELL.medial };
        if (p.z < SHELL.floor) p = { ...p, z: SHELL.floor + (p.z - SHELL.floor) * 0.3 };
        row.push(verts.length);
        verts.push(p);
      }
      grid.push(row);
    }
    const crown = verts.length;
    verts.push({ x: c.x - 0.3, y: c.y + side * 0.2, z: c.z + SHELL.r.z * 1.0 });
    const keel = verts.length;
    verts.push({ x: c.x, y: c.y, z: SHELL.floor - 0.25 });

    // Faces: quads between rings, split on alternating diagonals.
    type Tri = [number, number, number];
    const tris: Tri[] = [];
    for (let k = 0; k < R - 1; k++) {
      for (let j = 0; j < S; j++) {
        const a = grid[k][j];
        const b = grid[k][(j + 1) % S];
        const cc = grid[k + 1][(j + 1) % S];
        const d = grid[k + 1][j];
        if ((j + k) % 2) tris.push([a, b, cc], [a, cc, d]);
        else tris.push([a, b, d], [b, cc, d]);
      }
    }
    for (let j = 0; j < S; j++) {
      tris.push([grid[R - 1][j], grid[R - 1][(j + 1) % S], crown]);
      tris.push([grid[0][(j + 1) % S], grid[0][j], keel]);
    }
    const faceN = tris.map(([a, b, cc]) => {
      let n = norm(cross(sub(verts[b], verts[a]), sub(verts[cc], verts[a])));
      const mid = scl(add(add(verts[a], verts[b]), verts[cc]), 1 / 3);
      if (dot3(n, sub(mid, c)) < 0) n = scl(n, -1);
      return n;
    });
    // Edges, each once, with the mean normal of the faces it bounds.
    const e0 = edges.length;
    const seen = new Map<string, number>();
    tris.forEach((t, ti) => {
      for (let e = 0; e < 3; e++) {
        const a = t[e];
        const b = t[(e + 1) % 3];
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        const at = seen.get(key);
        if (at === undefined) {
          seen.set(key, edges.length);
          edges.push({ a, b, kind: EDGE.shell, side, n: faceN[ti] });
        } else {
          edges[at].n = norm(add(edges[at].n, faceN[ti]));
        }
      }
    });
    // The texture: dots in every face, by its area, and along every seam.
    tris.forEach(([a, b, cc], ti) => {
      const A = verts[a];
      const B = verts[b];
      const C = verts[cc];
      const area = Math.hypot(...Object.values(cross(sub(B, A), sub(C, A)))) / 2;
      const k = Math.round(area * 7);
      for (let m = 0; m < k; m++) {
        let u = rnd();
        let v = rnd();
        if (u + v > 1) {
          u = 1 - u;
          v = 1 - v;
        }
        const p = add(A, add(scl(sub(B, A), u), scl(sub(C, A), v)));
        dots.push({ p, n: faceN[ti], side, seam: false, ...scatter() });
      }
    });
    for (let e = e0; e < edges.length; e++) {
      const ed = edges[e];
      const A = verts[ed.a];
      const B = verts[ed.b];
      const len = Math.hypot(B.x - A.x, B.y - A.y, B.z - A.z);
      const k = Math.max(1, Math.floor(len / 0.2));
      for (let m = 1; m < k; m++) dots.push({ p: lerp3(A, B, m / k), n: ed.n, side, seam: true, ...scatter() });
    }

    // The dies: chips on the upper outer facets, pins to the facet's edges.
    const quadAt = (k: number, j: number) => {
      const q = [grid[k][j], grid[k][(j + 1) % S], grid[k + 1][(j + 1) % S], grid[k + 1][j]].map((i) => verts[i]);
      const mid = scl(add(add(q[0], q[1]), add(q[2], q[3])), 0.25);
      const n = norm(sub(mid, c));
      return { q, mid: add(mid, scl(n, 0.04)), n };
    };
    const seats: [number, number][] = [];
    for (let m = 0; m < 8; m++) {
      const k = 3 + Math.floor(rnd() * (R - 5));
      // The outer half of the ring: lon pointing away from the groove.
      const j = side > 0 ? 1 + Math.floor(rnd() * (S / 2 - 2)) : S / 2 + 1 + Math.floor(rnd() * (S / 2 - 2));
      if (seats.some(([kk, jj]) => Math.abs(kk - k) + Math.abs(jj - j) < 2)) continue;
      seats.push([k, j]);
      const { q, mid, n } = quadAt(k, j);
      const corners = q.map((p) => lerp3(add(p, scl(n, 0.04)), mid, 0.42)) as [V3, V3, V3, V3];
      const pins: [V3, V3][] = [];
      for (let e = 0; e < 4; e++) {
        const a = corners[e];
        const b = corners[(e + 1) % 4];
        for (const t of [0.3, 0.7]) {
          const p = lerp3(a, b, t);
          pins.push([p, lerp3(p, add(lerp3(q[e], q[(e + 1) % 4], t), scl(n, 0.04)), 0.55)]);
        }
      }
      dies.push({ corners, pins, n, side });
      parts.push(`${side > 0 ? "left" : "right"} cortex die ${seats.length}`);
    }
    // Traces: each die to the next along the grid, a ring run then a
    // meridian run, the way a board routes.
    for (let m = 0; m + 1 < seats.length; m++) {
      const [k0, j0] = seats[m];
      const [k1, j1] = seats[m + 1];
      const pts: V3[] = [];
      const dj = j1 >= j0 ? 1 : -1;
      for (let j = j0; j !== j1; j += dj) pts.push(quadAt(k0, j).mid);
      const dk = k1 >= k0 ? 1 : -1;
      for (let k = k0; k !== k1 + dk; k += dk) pts.push(quadAt(k, j1).mid);
      if (pts.length > 1) {
        traces.push({ pts, side });
        parts.push(`${side > 0 ? "left" : "right"} trace ${traces.filter((t) => t.side === side).length}`);
      }
    }
  }

  // ── The callosum bus ───────────────────────────────────────────────────
  const bus: V3[][] = [];
  for (let w = 0; w < 7; w++) {
    const x = -2.4 + w * 0.8;
    const z = 2.0 + 0.3 * Math.cos((w / 6) * Math.PI - Math.PI / 2);
    bus.push([
      { x, y: 1.1, z: z - 0.1 },
      { x, y: 0.55, z: z + 0.45 },
      { x, y: 0, z: z + 0.6 },
      { x, y: -0.55, z: z + 0.45 },
      { x, y: -1.1, z: z - 0.1 },
    ]);
    parts.push(`callosum wire ${w + 1}`);
  }

  // ── The heatsink (the cerebellum) ──────────────────────────────────────
  for (let f = 0; f < 7; f++) {
    const x = -2.5 - f * 0.28;
    const h = 1.0 + 0.35 * Math.sin((f / 6) * Math.PI);
    const w = 1.7 + 0.5 * Math.sin((f / 6) * Math.PI);
    const i = verts.length;
    verts.push(
      { x, y: -w, z: -2.2 },
      { x, y: w, z: -2.2 },
      { x, y: w, z: -2.2 + h },
      { x, y: -w, z: -2.2 + h }
    );
    const n: V3 = { x: -1, y: 0, z: 0 };
    for (let e = 0; e < 4; e++) edges.push({ a: i + e, b: i + ((e + 1) % 4), kind: EDGE.fin, side: 0, n });
    parts.push(`heatsink fin ${f + 1}`);
  }

  // ── The stem, its collars, the port and its sockets ────────────────────
  parts.push("stem");
  const ring = (z: number, r: number, sides: number, cx: number) => {
    const i = verts.length;
    for (let s = 0; s < sides; s++) {
      const a = (s / sides) * Math.PI * 2 + Math.PI / sides;
      verts.push({ x: cx + Math.cos(a) * r, y: Math.sin(a) * r, z });
    }
    return i;
  };
  const rings: number[] = [];
  for (let k = 0; k < STEM.collars; k++) {
    const z = STEM.top + ((STEM.bottom - STEM.top) * k) / (STEM.collars - 1);
    rings.push(ring(z, STEM.r * (k === 0 ? 1.1 : 1), STEM.sides, STEM.x));
    parts.push(`stem collar ${k + 1}`);
  }
  for (let k = 0; k < rings.length; k++) {
    for (let s = 0; s < STEM.sides; s++) {
      const a = rings[k] + s;
      const b = rings[k] + ((s + 1) % STEM.sides);
      const ang = ((s + 0.5) / STEM.sides) * Math.PI * 2 + Math.PI / STEM.sides;
      const n: V3 = { x: Math.cos(ang), y: Math.sin(ang), z: 0 };
      edges.push({ a, b, kind: EDGE.stem, side: 0, n });
      if (k + 1 < rings.length) edges.push({ a, b: rings[k + 1] + s, kind: EDGE.stem, side: 0, n });
    }
  }
  parts.push("port plate");
  const port = ring(PORT.z, PORT.r, 8, STEM.x);
  for (let s = 0; s < 8; s++) {
    edges.push({ a: port + s, b: port + ((s + 1) % 8), kind: EDGE.port, side: 0, n: { x: 0, y: 0, z: 1 } });
    // The stem's last collar seated on the plate.
    edges.push({ a: rings[rings.length - 1] + s, b: port + s, kind: EDGE.port, side: 0, n: { x: 0, y: 0, z: 1 } });
  }
  const sockets: V3[] = [];
  for (let s = 0; s < PORT.sockets; s++) {
    const a = (s / PORT.sockets) * Math.PI * 2 + 0.3;
    sockets.push({ x: STEM.x + Math.cos(a) * PORT.r * 0.66, y: Math.sin(a) * PORT.r * 0.66, z: PORT.z - 0.05 });
    parts.push(`socket ${s + 1}`);
  }

  // ── The flanks: where the middle beat's runs leave each hemisphere ─────
  const flank = (side: number, z: number): V3 => {
    const t = (z - 0.2) / SHELL.r.z;
    const y = SHELL.off + SHELL.r.y * Math.sqrt(Math.max(0, 1 - t * t));
    return { x: 0.4, y: side * y, z };
  };
  const flanks = {
    tool: [1.3, 0.2, -0.9].map((z) => flank(1, z)),
    collab: [1.3, 0.2, -0.9].map((z) => flank(-1, z)),
  };

  cache = { verts, edges, dots, dies, traces, bus, sockets, flanks, parts };
  return cache;
}

export { dot3, lerp3 };
