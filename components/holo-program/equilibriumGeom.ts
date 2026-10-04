/**
 * equilibriumGeom — the workshop opener's holographic object (ADR-143 U7),
 * as data.
 *
 * ⚠ A REAL OBJECT IN PERSPECTIVE, NOT A DIAGRAM (owner, 2026-10-04: "I want
 * actual three js 3D object like holo"). The first cut drew a binary star on
 * the workshop's orthographic stage — a technical drawing — and was refused.
 * This is the ADR-080 family instead (`HoloProgramCanvas`'s shell, his
 * holo.ui8.dev reference): a contour-sliced core and two ring systems around
 * it like a gyroscope in balance — UPSTREAM tilted up, DOWNSTREAM tilted
 * down — graduated tick arcs, a few bright arcs, and gold motes: running
 * steadily round the downstream rings, drifting round the upstream one, and
 * falling down the axis from one to the other (what works upstream is
 * encoded and runs downstream).
 *
 * ⚠ THREE-FREE AND PURE. The canvas builds its geometry from here; the route
 * renders the static drawing and seats the DOM words from the SAME numbers,
 * projected through the same rest camera (`eqProject`), so the fallback and
 * the hologram at rest are one picture and the swap moves nothing.
 *
 * World axes are three's: `y` up, the object centred on the origin.
 */

import { mulberry32 } from "./holoProgramGeom";

export type P3 = readonly [number, number, number];
type V = [number, number, number];

const RAD = Math.PI / 180;
const add = (p: P3, q: P3): V => [p[0] + q[0], p[1] + q[1], p[2] + q[2]];
const sub = (p: P3, q: P3): V => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
const mul = (p: P3, s: number): V => [p[0] * s, p[1] * s, p[2] * s];
const dot = (p: P3, q: P3) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
const cross = (p: P3, q: P3): V => [
  p[1] * q[2] - p[2] * q[1],
  p[2] * q[0] - p[0] * q[2],
  p[0] * q[1] - p[1] * q[0],
];
const unit = (p: P3): V => mul(p, 1 / (Math.hypot(p[0], p[1], p[2]) || 1));

/* ── The frame and the camera ──────────────────────────────────────────── */

/** The figure box's aspect, in px at the reference width. The canvas fills a
 *  box of this aspect, so the rest projection here is the canvas's. */
export const EQ_FRAME = { w: 1100, h: 500 } as const;

/** The rest pose: from the front right, a little above. Three's `fov` is
 *  VERTICAL (ADR-080 U3's finding), so the frame's aspect sets the width. */
export const EQ_CAMERA = { azimuthDeg: 24, elevationDeg: 14, distance: 9.4, fovDeg: 26 } as const;

/** How far the reader may turn it, each side of rest (degrees). A held
 *  instrument may be turned, never into a pose that cannot be read. */
export const EQ_DRAG = { azimuthDeg: 24, polarDeg: 7 } as const;

export function eqCameraPosition(): V {
  const az = EQ_CAMERA.azimuthDeg * RAD;
  const el = EQ_CAMERA.elevationDeg * RAD;
  const d = EQ_CAMERA.distance;
  return [d * Math.sin(az) * Math.cos(el), d * Math.sin(el), d * Math.cos(az) * Math.cos(el)];
}

interface CamBasis {
  eye: V;
  right: V;
  up: V;
  /** Into the screen, from the eye toward the target. */
  fwd: V;
}

/** The rest camera's basis, exactly as three's `lookAt(0,0,0)` with `y` up. */
export function eqCameraBasis(eye: V = eqCameraPosition()): CamBasis {
  const fwd = unit(mul(eye, -1));
  const right = unit(cross(fwd, [0, 1, 0]));
  const up = cross(right, fwd);
  return { eye, right, up, fwd };
}

/** A world point on the frame at rest, in the frame's px. */
export function eqProject(
  p: P3,
  frame: { w: number; h: number } = EQ_FRAME,
  cam: CamBasis = eqCameraBasis()
): { x: number; y: number; depth: number } {
  const d = sub(p, cam.eye);
  const xc = dot(d, cam.right);
  const yc = dot(d, cam.up);
  const zc = dot(d, cam.fwd);
  const t = Math.tan((EQ_CAMERA.fovDeg * RAD) / 2);
  const aspect = frame.w / frame.h;
  return {
    x: ((xc / (zc * t * aspect) + 1) / 2) * frame.w,
    y: ((1 - yc / (zc * t)) / 2) * frame.h,
    depth: zc,
  };
}

/* ── The two ring systems ──────────────────────────────────────────────── */

/**
 * A ring system's frame: its centre, its in-plane axes `a` (the ellipse's
 * long axis at rest, tilted on screen by `tilt`) and `b`, and its normal.
 * `open` is how far the ring faces the viewer: the ellipse's short axis is
 * `sin(open)` of its long one. The rings are fixed in the WORLD; the rest
 * camera only decides how they were laid out, so a drag turns real objects.
 */
export interface EqSystem {
  id: "up" | "down";
  centre: V;
  a: V;
  /** The normal: `a`, `n`, `b` is a right-handed basis (local x, y, z). */
  n: V;
  b: V;
}

function systemFrame(id: EqSystem["id"], centre: V, tiltDeg: number, openDeg: number): EqSystem {
  const cam = eqCameraBasis();
  const g = tiltDeg * RAD;
  const o = openDeg * RAD;
  const a = add(mul(cam.right, Math.cos(g)), mul(cam.up, Math.sin(g)));
  const s = add(mul(cam.right, -Math.sin(g)), mul(cam.up, Math.cos(g)));
  const b = unit(add(mul(s, Math.sin(o)), mul(cam.fwd, Math.cos(o))));
  const n = unit(cross(b, a));
  return { id, centre, a, n, b };
}

/** UPSTREAM: above, tilted up to the right, open — the work that explores. */
export const EQ_UP = systemFrame("up", [0, 0.24, 0], 18, 30);
/** DOWNSTREAM: below, tilted down to the right, flatter — the work that runs. */
export const EQ_DOWN = systemFrame("down", [0, -0.24, 0], -18, 22);

/** A local point of a system (x along `a`, y along `n`, z along `b`) in the world. */
export function toWorld(sys: EqSystem, p: P3): V {
  return add(sys.centre, add(mul(sys.a, p[0]), add(mul(sys.n, p[1]), mul(sys.b, p[2]))));
}

/** A ring in a system's own plane, in LOCAL coordinates. */
export function ringLocal(r: number, n = 160, from = 0, to = 360): V[] {
  const out: V[] = [];
  const steps = Math.max(2, Math.round((n * Math.abs(to - from)) / 360));
  for (let i = 0; i <= steps; i++) {
    const th = (from + ((to - from) * i) / steps) * RAD;
    out.push([r * Math.cos(th), 0, r * Math.sin(th)]);
  }
  return out;
}

export interface EqRing {
  id: string;
  r: number;
  width: number;
  opacity: number;
  /** Drawn as dashes (1px segments), the exploratory ring. */
  dashed?: boolean;
  reveal: readonly [number, number];
}

export interface EqTicks {
  id: string;
  r: number;
  /** Arcs the graduation runs along, in degrees. */
  arcs: readonly (readonly [number, number])[];
  step: number;
  majorEvery: number;
  len: number;
  reveal: readonly [number, number];
}

/** A bright arc: the energy, gliding round its ring at `speed` rad/s. */
export interface EqArc {
  id: string;
  r: number;
  span: number;
  start: number;
  speed: number;
}

/** Motes that run round a ring, as a rigid set turning at `speed` rad/s. */
export interface EqMotes {
  id: string;
  r: number;
  /** Angles of the motes at rest, degrees. */
  at: readonly number[];
  speed: number;
}

export interface EqSystemSpec {
  sys: EqSystem;
  rings: readonly EqRing[];
  ticks: readonly EqTicks[];
  arc: EqArc;
  motes: readonly EqMotes[];
}

const evenly = (n: number, offset = 0) =>
  Array.from({ length: n }, (_, i) => offset + (i * 360) / n);

/** Upstream: one ring, a graduated partial band outside it, a dashed ring
 *  wider still; five motes, unevenly spaced, drifting slowly. */
export const EQ_UP_SPEC: EqSystemSpec = {
  sys: EQ_UP,
  rings: [
    { id: "up-main", r: 1.48, width: 1.3, opacity: 0.92, reveal: [0.3, 0.7] },
    { id: "up-wide", r: 1.82, width: 1, opacity: 0.4, dashed: true, reveal: [0.55, 0.85] },
  ],
  ticks: [
    {
      id: "up-ticks",
      r: 1.6,
      arcs: [
        [18, 92],
        [148, 206],
        [252, 318],
      ],
      step: 3,
      majorEvery: 5,
      len: 0.06,
      reveal: [0.55, 0.82],
    },
  ],
  arc: { id: "up-arc", r: 1.48, span: 40, start: 54, speed: 0.07 },
  motes: [{ id: "up-motes", r: 1.48, at: [12, 71, 158, 203, 296], speed: 0.09 }],
};

/** Downstream: three tight rings and a full graduated band; motes evenly
 *  spaced on every ring, running steadily. */
export const EQ_DOWN_SPEC: EqSystemSpec = {
  sys: EQ_DOWN,
  rings: [
    { id: "down-0", r: 1.16, width: 1.1, opacity: 0.8, reveal: [0.14, 0.52] },
    { id: "down-1", r: 1.24, width: 1.2, opacity: 0.9, reveal: [0.2, 0.58] },
    { id: "down-2", r: 1.32, width: 1.1, opacity: 0.8, reveal: [0.26, 0.64] },
  ],
  ticks: [
    {
      id: "down-ticks",
      r: 1.42,
      arcs: [[0, 360]],
      step: 5,
      majorEvery: 6,
      len: 0.055,
      reveal: [0.46, 0.72],
    },
  ],
  arc: { id: "down-arc", r: 1.24, span: 52, start: 200, speed: 0.24 },
  motes: [
    { id: "down-motes-0", r: 1.16, at: evenly(14, 0), speed: 0.3 },
    { id: "down-motes-1", r: 1.24, at: evenly(14, 8), speed: 0.3 },
    { id: "down-motes-2", r: 1.32, at: evenly(14, 16), speed: 0.3 },
  ],
};

export const EQ_SYSTEMS: readonly EqSystemSpec[] = [EQ_DOWN_SPEC, EQ_UP_SPEC];

/** A graduation's tick segments, in LOCAL coordinates (pairs of points). */
export function ticksLocal(t: EqTicks): V[] {
  const out: V[] = [];
  for (const [from, to] of t.arcs) {
    let k = 0;
    for (let deg = from; deg <= to + 1e-6; deg += t.step, k++) {
      const major = k % t.majorEvery === 0;
      const th = deg * RAD;
      const l = major ? t.len * 1.8 : t.len;
      out.push([t.r * Math.cos(th), 0, t.r * Math.sin(th)]);
      out.push([(t.r + l) * Math.cos(th), 0, (t.r + l) * Math.sin(th)]);
    }
  }
  return out;
}

/* ── The core, the axis, the level, the floor, the dust ────────────────── */

/** The thought: a body of horizontal contour slices, its outline wobbling as
 *  holo.ui8's does, seeded so it is the same body on every render. */
export const EQ_CORE = { r: 0.56, slices: 13, segments: 72 } as const;

export function coreSlices(): V[][] {
  const out: V[][] = [];
  const { r, slices, segments } = EQ_CORE;
  for (let k = 0; k < slices; k++) {
    const t = (k + 0.5) / slices;
    const y = (t * 2 - 1) * r * 0.94;
    const base = Math.sqrt(Math.max(0, r * r - y * y));
    const ring: V[] = [];
    for (let i = 0; i <= segments; i++) {
      const th = (i / segments) * Math.PI * 2;
      const wob = 1 + 0.11 * Math.sin(3 * th + 1.7 + 4 * y) + 0.07 * Math.sin(5 * th - 0.9 - 6 * y);
      ring.push([base * wob * Math.cos(th), y, base * wob * Math.sin(th)]);
    }
    out.push(ring);
  }
  return out;
}

/** The axis the motes fall down: from above the upstream ring to below the
 *  downstream one, through the core. */
export const EQ_AXIS = { top: 1.5, bottom: -1.56 } as const;
/** How many motes fall at once, and how long one takes top to bottom (s). */
export const EQ_FALL = { count: 7, period: 5.2 } as const;

/** The level: the plane the two systems balance about, a faint dashed ring. */
export const EQ_LEVEL = { r: 2.06, y: 0 } as const;

/** The floor, faint and wide, fading to nothing toward its rim. */
export const EQ_FLOOR = { y: -1.86, half: 4.2, pitch: 0.46, alpha: 0.075 } as const;

/** Floor segments with each one's fade (0..1), one grid cell long. */
export function floorSegments(): { a: V; b: V; fade: number }[] {
  const out: { a: V; b: V; fade: number }[] = [];
  const { y, half, pitch } = EQ_FLOOR;
  const n = Math.round((2 * half) / pitch);
  for (let i = 0; i <= n; i++) {
    const c = -half + i * pitch;
    for (let j = 0; j < n; j++) {
      const s0 = -half + j * pitch;
      const s1 = s0 + pitch;
      for (const along of ["x", "z"] as const) {
        const a: V = along === "x" ? [s0, y, c] : [c, y, s0];
        const b: V = along === "x" ? [s1, y, c] : [c, y, s1];
        const m = mul(add(a, b), 0.5);
        const r = Math.hypot(m[0], m[2]) / half;
        const fade = Math.max(0, 1 - r * r);
        if (fade > 0.03) out.push({ a, b, fade });
      }
    }
  }
  return out;
}

/** Seeded dust in a shell round the object. */
export function eqDust(count = 320, seed = 4821): V[] {
  const rnd = mulberry32(seed);
  const out: V[] = [];
  while (out.length < count) {
    const x = rnd() * 2 - 1;
    const y = rnd() * 2 - 1;
    const z = rnd() * 2 - 1;
    const l = Math.hypot(x, y, z);
    if (l > 1 || l < 0.2) continue;
    const rr = 2.3 + rnd() * 1.2;
    out.push([(x / l) * rr, (y / l) * rr * 0.7, (z / l) * rr]);
  }
  return out;
}

/* ── The words ─────────────────────────────────────────────────────────── */

/** Where each word's leader lands on the object, in the world. */
export const EQ_ANCHORS: Readonly<Record<"downstream" | "upstream" | "encode", V>> = {
  downstream: toWorld(EQ_DOWN, [-1.46, 0, 0]),
  upstream: toWorld(EQ_UP, [1.62, 0, 0]),
  encode: [0, EQ_AXIS.top, 0],
};

/** How each word sits off its point: the side, and the leader's length (px). */
export const EQ_WORD_SEATS: Readonly<
  Record<keyof typeof EQ_ANCHORS, { anchor: "start" | "end"; dx: number }>
> = {
  downstream: { anchor: "end", dx: -22 },
  upstream: { anchor: "start", dx: 22 },
  encode: { anchor: "end", dx: -22 },
};

/** The words' seats at rest, as fractions of the frame. */
export function seatWords(): { id: keyof typeof EQ_ANCHORS; ax: number; at: number }[] {
  return (Object.keys(EQ_ANCHORS) as (keyof typeof EQ_ANCHORS)[]).map((id) => {
    const p = eqProject(EQ_ANCHORS[id]);
    return { id, ax: p.x / EQ_FRAME.w, at: p.y / EQ_FRAME.h };
  });
}

/* ── The static drawing ────────────────────────────────────────────────── */

export type EqRole = "structure" | "machine" | "gold" | "grid";

export interface EqPolyline {
  id: string;
  /** World points; `segments` lines are drawn pair by pair. */
  points: readonly P3[];
  segments?: boolean;
  role: EqRole;
  width: number;
  opacity: number;
}

/** Every line the object draws, in the world, at rest. */
export function eqPolylines(): EqPolyline[] {
  const out: EqPolyline[] = [];
  for (const s of floorSegments()) {
    out.push({
      id: "floor",
      points: [s.a, s.b],
      role: "grid",
      width: 0.8,
      opacity: EQ_FLOOR.alpha * s.fade,
    });
  }
  out.push({
    id: "level",
    points: ringLocal(EQ_LEVEL.r, 200).map((p) => [p[0], EQ_LEVEL.y, p[2]] as V),
    role: "machine",
    width: 0.8,
    opacity: 0.22,
  });
  coreSlices().forEach((slice, k) =>
    out.push({ id: `core-${k}`, points: slice, role: "structure", width: 0.9, opacity: 0.62 })
  );
  for (const spec of EQ_SYSTEMS) {
    for (const r of spec.rings) {
      out.push({
        id: r.id,
        points: ringLocal(r.r).map((p) => toWorld(spec.sys, p)),
        role: "structure",
        width: r.width,
        opacity: r.dashed ? r.opacity * 0.8 : r.opacity,
      });
    }
    for (const t of spec.ticks) {
      out.push({
        id: t.id,
        points: ticksLocal(t).map((p) => toWorld(spec.sys, p)),
        segments: true,
        role: "structure",
        width: 0.8,
        opacity: 0.5,
      });
    }
    const arc = spec.arc;
    out.push({
      id: arc.id,
      points: ringLocal(arc.r, 160, arc.start, arc.start + arc.span).map((p) =>
        toWorld(spec.sys, p)
      ),
      role: "gold",
      width: 2.4,
      opacity: 1,
    });
  }
  out.push({
    id: "axis",
    points: [
      [0, EQ_AXIS.top, 0],
      [0, EQ_AXIS.bottom, 0],
    ],
    role: "gold",
    width: 1,
    opacity: 0.55,
  });
  return out;
}

const r1 = (v: number) => (Math.round(v * 10) / 10).toString();

/** The static drawing as markup: one `<g>` per role, so the sheet colours each
 *  from the theme's own tokens; the dashed level as a dash array. */
export function eqSvgMarkup(className: string): string {
  const byRole = new Map<EqRole, string[]>();
  for (const l of eqPolylines()) {
    const pts = l.points.map((p) => eqProject(p));
    let d = "";
    if (l.segments) {
      for (let i = 0; i + 1 < pts.length; i += 2) {
        d += `M${r1(pts[i].x)} ${r1(pts[i].y)}L${r1(pts[i + 1].x)} ${r1(pts[i + 1].y)}`;
      }
    } else {
      d = pts.map((q, i) => `${i === 0 ? "M" : "L"}${r1(q.x)} ${r1(q.y)}`).join("");
    }
    const dash = l.id === "level" || l.id === "up-wide" ? ' stroke-dasharray="3 5"' : "";
    const path = `<path d="${d}" stroke-width="${l.width}" stroke-opacity="${Math.round(l.opacity * 1000) / 1000}"${dash}/>`;
    const list = byRole.get(l.role) ?? [];
    list.push(path);
    byRole.set(l.role, list);
  }
  const groups = [...byRole.entries()]
    .map(([role, paths]) => `<g data-role="${role}">${paths.join("")}</g>`)
    .join("");
  return `<svg class="${className}" viewBox="0 0 ${EQ_FRAME.w} ${EQ_FRAME.h}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">${groups}</svg>`;
}

/** Where the drawing (not the floor) runs across the frame, as fractions —
 *  what a phone crops the static figure to. */
export function eqContentSpan(): { x0: number; x1: number } {
  let x0 = Infinity;
  let x1 = -Infinity;
  for (const l of eqPolylines()) {
    if (l.role === "grid") continue;
    for (const p of l.points) {
      const q = eqProject(p);
      x0 = Math.min(x0, q.x);
      x1 = Math.max(x1, q.x);
    }
  }
  return { x0: x0 / EQ_FRAME.w, x1: x1 / EQ_FRAME.w };
}
