/**
 * The crossroads head (ADR-156 U3): an ANONYMOUS head, built from nothing
 * but solids, so it is nobody's face (owner, 2026-10-15: "an anonymous
 * head"). No photograph and no image model; this seat may not open the
 * shared keys, and a procedural head needs none.
 *
 * THE METHOD (the anatomy skill's: a real object, its parts listed):
 * · a SIGNED-DISTANCE head, smooth unions of a cranium, a jaw, a chin, two
 *   cheekbones, a brow ridge, a nose, lips and a neck, the eye sockets
 *   carved out, two ears added (`HEAD_PARTS`);
 * · seen from three-quarters (`YAW`), orthographic, and RAYMARCHED on a grid
 *   into a depth field;
 * · drawn as SCANLINES displaced by the relief, the contour-line head of the
 *   owner's reference, split down the nose line: the left half a stipple of
 *   particles (the human), the right half continuous lines (the machine).
 *
 * ⚠ PURE AND DETERMINISTIC, memoised: the server and the test draw the same
 * head. Units: the head is about 2.4 tall, facing +z before the turn.
 */

type V3 = readonly [number, number, number];

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a: V3) => Math.sqrt(dot(a, a));

function sdEllipsoid(p: V3, c: V3, r: V3): number {
  const q: V3 = [(p[0] - c[0]) / r[0], (p[1] - c[1]) / r[1], (p[2] - c[2]) / r[2]];
  const k0 = len(q);
  const q2: V3 = [q[0] / r[0], q[1] / r[1], q[2] / r[2]];
  const k1 = len(q2);
  return k1 === 0 ? -Math.min(...r) : (k0 * (k0 - 1)) / k1;
}
function sdCapsule(p: V3, a: V3, b: V3, r: number): number {
  const pa = sub(p, a);
  const ba = sub(b, a);
  const h = Math.max(0, Math.min(1, dot(pa, ba) / dot(ba, ba)));
  return len(sub(pa, [ba[0] * h, ba[1] * h, ba[2] * h])) - r;
}
const sdSphere = (p: V3, c: V3, r: number) => len(sub(p, c)) - r;
function smin(a: number, b: number, k: number): number {
  const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (b - a)) / k));
  return b + (a - b) * h - k * h * (1 - h);
}
function smax(a: number, b: number, k: number): number {
  return -smin(-a, -b, k);
}

/** The parts list: what the head is made of, for the test and the record. */
export const HEAD_PARTS = [
  "cranium",
  "jaw",
  "chin",
  "cheekbone-left",
  "cheekbone-right",
  "brow-ridge",
  "nose",
  "nose-tip",
  "nose-wings",
  "lips-upper",
  "lips-lower",
  "lips-line",
  "eye-socket-left",
  "eye-socket-right",
  "eyelid-left",
  "eyelid-right",
  "ear-left",
  "ear-right",
  "neck",
] as const;

export function headSdf(p: V3): number {
  let d = sdEllipsoid(p, [0, 0.4, -0.06], [0.76, 0.95, 0.9]);
  d = smin(d, sdEllipsoid(p, [0, -0.3, 0.18], [0.58, 0.74, 0.66]), 0.26);
  d = smin(d, sdSphere(p, [0, -0.95, 0.42], 0.24), 0.16);
  d = smin(d, sdSphere(p, [0.42, -0.02, 0.5], 0.25), 0.14);
  d = smin(d, sdSphere(p, [-0.42, -0.02, 0.5], 0.25), 0.14);
  d = smin(d, sdCapsule(p, [-0.32, 0.36, 0.7], [0.32, 0.36, 0.7], 0.12), 0.1);
  // The nose: a ridge from the brow to the tip, and its wings.
  d = smin(d, sdCapsule(p, [0, 0.24, 0.8], [0, -0.24, 1.06], 0.11), 0.07);
  d = smin(d, sdSphere(p, [0, -0.26, 1.02], 0.13), 0.06);
  d = smin(d, sdSphere(p, [0.12, -0.3, 0.92], 0.09), 0.05);
  d = smin(d, sdSphere(p, [-0.12, -0.3, 0.92], 0.09), 0.05);
  // The lips, upper and lower.
  d = smin(d, sdCapsule(p, [-0.2, -0.5, 0.86], [0.2, -0.5, 0.86], 0.07), 0.05);
  d = smin(d, sdCapsule(p, [-0.17, -0.63, 0.83], [0.17, -0.63, 0.83], 0.075), 0.05);
  d = smax(d, -sdCapsule(p, [-0.2, -0.565, 0.92], [0.2, -0.565, 0.92], 0.025), 0.02);
  // The eyes: sockets carved, a lid in each.
  d = smax(d, -sdSphere(p, [0.28, 0.16, 0.88], 0.15), 0.06);
  d = smax(d, -sdSphere(p, [-0.28, 0.16, 0.88], 0.15), 0.06);
  d = smin(d, sdSphere(p, [0.28, 0.15, 0.76], 0.1), 0.03);
  d = smin(d, sdSphere(p, [-0.28, 0.15, 0.76], 0.1), 0.03);
  d = Math.min(d, sdEllipsoid(p, [0.79, 0.06, -0.06], [0.09, 0.22, 0.14]));
  d = Math.min(d, sdEllipsoid(p, [-0.79, 0.06, -0.06], [0.09, 0.22, 0.14]));
  d = smin(d, sdCapsule(p, [0, -0.85, -0.12], [0, -1.75, -0.22], 0.42), 0.22);
  return d;
}

/** A little off frontal: enough turn for the nose and the lips to break the
 *  scanlines, little enough that both halves of the face are seen. */
export const YAW = (12 * Math.PI) / 180;
const PITCH = (-6 * Math.PI) / 180;

/** The camera's basis: forward looks into the head. */
function camera() {
  const cy = Math.cos(YAW);
  const sy = Math.sin(YAW);
  const cp = Math.cos(PITCH);
  const spp = Math.sin(PITCH);
  // The viewer sits at +z rotated by the yaw, looking back at the origin.
  const fwd: V3 = [-sy * cp, spp, -cy * cp];
  const right: V3 = [cy, 0, -sy];
  const up: V3 = [-(fwd[1] * right[2] - fwd[2] * right[1]), -(fwd[2] * right[0] - fwd[0] * right[2]), -(fwd[0] * right[1] - fwd[1] * right[0])];
  return { fwd, right, up };
}

export const HEAD_GRID = { cols: 150, rows: 190 } as const;
/** The window on the camera plane, in head units. */
const WIN = { u0: -1.35, u1: 1.35, v0: -1.85, v1: 1.5 } as const;
const FAR = 6;

export interface HeadField {
  cols: number;
  rows: number;
  /** Depth along the view per cell, `NaN` where the ray misses. Row 0 is the top. */
  depth: Float32Array;
  /** The nose line's column: where the human half becomes the machine. */
  seam: number;
}

let cached: HeadField | null = null;

/** The depth field, raymarched once and kept. */
export function headField(): HeadField {
  if (cached) return cached;
  const { cols, rows } = HEAD_GRID;
  const { fwd, right, up } = camera();
  const depth = new Float32Array(cols * rows);
  const back = 3;
  for (let r = 0; r < rows; r++) {
    const v = WIN.v1 - ((WIN.v1 - WIN.v0) * r) / (rows - 1);
    for (let c = 0; c < cols; c++) {
      const u = WIN.u0 + ((WIN.u1 - WIN.u0) * c) / (cols - 1);
      const o: V3 = [
        u * right[0] + v * up[0] - fwd[0] * back,
        u * right[1] + v * up[1] - fwd[1] * back,
        u * right[2] + v * up[2] - fwd[2] * back,
      ];
      let t = 0;
      let hit = NaN;
      for (let i = 0; i < 96 && t < FAR; i++) {
        const p: V3 = [o[0] + fwd[0] * t, o[1] + fwd[1] * t, o[2] + fwd[2] * t];
        const d = headSdf(p);
        if (d < 0.002) {
          hit = t;
          break;
        }
        t += Math.max(d * 0.9, 0.002);
      }
      depth[r * cols + c] = hit;
    }
  }
  // The nose line: the column of the nearest point in the face's band.
  let best = Infinity;
  let seam = Math.round(cols / 2);
  for (let r = Math.round(rows * 0.35); r < Math.round(rows * 0.55); r++) {
    for (let c = 0; c < cols; c++) {
      const d = depth[r * cols + c];
      if (Number.isFinite(d) && d < best) {
        best = d;
        seam = c;
      }
    }
  }
  cached = { cols, rows, depth, seam };
  return cached;
}

export interface HeadDrawing {
  /** In a `w` x `h` viewBox. */
  w: number;
  h: number;
  /** The machine half: displaced scanlines, as path data. */
  lines: string[];
  /** The human half: stipple particles. */
  dots: { x: number; y: number; r: number }[];
  /** The seam's x, for the crossroads' tick. */
  seamX: number;
}

const LINE_EVERY = 3;
/** How far the relief lifts a scanline, in viewBox units per head unit: the
 *  bend over the nose, the brow and the lips is what reads as a face. */
const RELIEF = 64;

const n1 = (v: number) => (Math.round(v * 10) / 10).toString();

/** The drawing: scanlines on the machine half, particles on the human half. */
export function headDrawing(w = 600, h = 760): HeadDrawing {
  const f = headField();
  const sx = w / (f.cols - 1);
  const sy = h / (f.rows - 1);
  let dmax = -Infinity;
  for (const d of f.depth) if (Number.isFinite(d) && d > dmax) dmax = d;
  const lines: string[] = [];
  const dots: HeadDrawing["dots"] = [];
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let r = 0; r < f.rows; r += LINE_EVERY) {
    let run: string[] = [];
    const flush = () => {
      if (run.length > 1) lines.push(`M${run.join(" L")}`);
      run = [];
    };
    for (let c = 0; c < f.cols; c++) {
      const d = f.depth[r * f.cols + c];
      if (!Number.isFinite(d)) {
        flush();
        continue;
      }
      const lift = (dmax - d) * RELIEF;
      const x = c * sx;
      const y = r * sy - lift;
      if (c >= f.seam) {
        run.push(`${n1(x)} ${n1(y)}`);
      } else {
        flush();
        // The human half: particles along the same scanline, sparser where
        // the surface turns away (a lit face reads denser, nearer).
        const near = (dmax - d) / 1.2;
        if (rnd() < 0.55 + 0.4 * Math.min(1, near)) {
          dots.push({ x: x + (rnd() - 0.5) * sx, y: y + (rnd() - 0.5) * sy, r: 0.9 + rnd() * 0.7 });
        }
      }
    }
    flush();
  }
  return { w, h, lines, dots, seamX: f.seam * sx };
}
