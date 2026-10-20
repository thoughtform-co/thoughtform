/* The mark is the mind, C4: one drawing from the flat brand mark to the
   drum. Canvas 2D, one call a frame.

   The drum's top face is the mark: the logo's own paths on the top plane. Seen
   straight down with no height (g = 0) the drawing is the flat logo, gold on
   black. As g rises the camera tilts back, the drum grows down from the mark,
   the bars become slots cut through it, the ring thins to the C4 crescent and
   the contents come in. Simplified on purpose (owner, 2026-10-19: "if it's
   too heavy it's not really a brand thing"): a few slices, fine lines, sparse
   rooms and traces, one light. The contents turn with the flywheel. */

import { BRANDMARK_PATHS } from "@/lib/brandmark/brandmarkPaths";
import { BLOCK, CROSSING, H, MARK, R, SLANT, SLICE, circle, crescentOf, inside, isCut, outward, sectorsOf, type P2, type Sector } from "./geometry";

export type Theme = "dark" | "light";

export interface View {
  w: number;
  h: number;
  theme: Theme;
  /** 0 the flat brand mark, 1 the drum */
  g: number;
  /** seconds */
  t: number;
}

/** One turn of the flywheel, seconds. */
const TURN = 90;
/** The camera's elevation at g = 1, degrees. */
const EL = 66;

const TONES = {
  dark: { ground: "#0a0908", ink: "#ebe3d6", gold: "#caa554", lit: "#ffe7a8", green: "#7a9e6a" },
  light: { ground: "#efe9dc", ink: "#2a2214", gold: "#8a6b20", lit: "#b07a12", green: "#466c3a" },
} as const;

const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a: string, b: string, t: number, alpha = 1) => {
  const x = hex(a);
  const y = hex(b);
  return `rgba(${x.map((v, i) => Math.round(v + (y[i]! - v) * t)).join(",")},${alpha})`;
};
const ink = (tone: string, alpha: number) => mix(tone, tone, 0, alpha);
const ease = (a: number, b: number, x: number) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};
const hash = (n: number) => Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1;
const rot = (th: number, [p, q]: P2): P2 => [p * Math.cos(th) - q * Math.sin(th), p * Math.sin(th) + q * Math.cos(th)];

/* ── the contents: a few rooms with people, a few traces and dies; seeded,
      laid out over the disc in the turning frame */
interface Contents {
  walls: [P2, P2][];
  people: P2[];
  traces: P2[][];
  vias: P2[];
  dies: { at: P2; s: number }[];
}
let contents: Contents | null = null;
function contentsOf(): Contents {
  if (contents) return contents;
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const C: Contents = { walls: [], people: [], traces: [], vias: [], dies: [] };
  const CELL = 11;
  const reach = R * 0.86;
  const within = ([x, y]: P2) => Math.hypot(x, y) < reach;
  for (let i = -9; i <= 8; i++) {
    for (let j = -9; j <= 8; j++) {
      const x0 = i * CELL;
      const y0 = j * CELL;
      const c: P2 = [x0 + CELL / 2, y0 + CELL / 2];
      if (!within(c)) continue;
      if (rnd() < 0.8 && within([x0, y0]) && within([x0 + CELL, y0])) C.walls.push([[x0, y0], [x0 + CELL * (rnd() < 0.3 ? 0.55 : 1), y0]]);
      if (rnd() < 0.7 && within([x0, y0]) && within([x0, y0 + CELL])) C.walls.push([[x0, y0], [x0, y0 + CELL * (rnd() < 0.3 ? 0.55 : 1)]]);
      const n = Math.floor(rnd() * 2.6);
      for (let k = 0; k < n; k++) C.people.push([x0 + 3 + rnd() * (CELL - 6), y0 + 3 + rnd() * (CELL - 6)]);
    }
  }
  const dirs: P2[] = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  for (let k = 0; k < 170; k++) {
    const r = Math.sqrt(rnd()) * reach;
    const a = rnd() * Math.PI * 2;
    let p: P2 = [Math.cos(a) * r, Math.sin(a) * r];
    const pts: P2[] = [p];
    let d = Math.floor(rnd() * 4);
    for (let s = 0; s < 3; s++) {
      const len = 6 + rnd() * 14;
      const q: P2 = [p[0] + dirs[d]![0] * len, p[1] + dirs[d]![1] * len];
      if (!within(q)) break;
      pts.push(q);
      p = q;
      d = (d + (rnd() < 0.5 ? 1 : 3)) % 4;
    }
    if (pts.length > 1) {
      C.traces.push(pts);
      C.vias.push(pts[pts.length - 1]!);
    }
  }
  for (let k = 0; k < 9; k++) {
    const r = Math.sqrt(rnd()) * (reach - 14);
    const a = rnd() * Math.PI * 2;
    C.dies.push({ at: [Math.cos(a) * r, Math.sin(a) * r], s: 7 + rnd() * 5 });
  }
  contents = C;
  return C;
}

let sectorCache: Sector[] | null = null;
const bars = BRANDMARK_PATHS.slice(2); // the bars and the stepped block; 0 and 1 are the ring
let barPaths: Path2D[] | null = null;
const crescents = new Map<number, P2[][]>();

export function paintMind(ctx: CanvasRenderingContext2D, { w, h, theme, g, t }: View) {
  const T = TONES[theme];
  const dark = theme === "dark";
  const sectors = (sectorCache ??= sectorsOf("section"));
  barPaths ??= bars.map((d) => new Path2D(d));
  const C = contentsOf();

  // ── the transition, all from g
  const tilt = ease(0, 0.7, g);
  const el = 90 - (90 - EL) * tilt;
  const height = H * ease(0.12, 0.85, g);
  const barGold = 1 - ease(0.3, 0.65, g); // the logo's bars, solid, fade into slots
  const inside3d = ease(0.35, 0.9, g); // the contents, the slots' edges, the spark
  const thin = 1 - 0.68 * ease(0.2, 0.9, g); // the ring thins to the crescent
  const theta = (t / TURN) * Math.PI * 2;

  const e = (el * Math.PI) / 180;
  const sinE = Math.sin(e);
  const cosE = Math.cos(e);
  // fit: the rim, the bar running out above it, the level bar past it, the drum's height
  const topY = -110 * sinE - height * cosE;
  const botY = R * sinE;
  const left = -R - 55 * inside3d;
  const right = 108;
  const k = Math.min((w * 0.86) / (right - left), (h * 0.84) / Math.max(botY - topY, 1));
  const ox = w / 2 - ((left + right) / 2) * k;
  const oy = h / 2 - ((topY + botY) / 2) * k;
  const at = ([u, v]: P2, z: number): P2 => [ox + k * u, oy + k * (v * sinE - z * cosE)];
  const lw = Math.max(0.8, k * 0.2);

  const path = (pts: P2[], z: number, close = true, p: Path2D | CanvasRenderingContext2D = ctx) => {
    pts.forEach((q, i) => {
      const [x, y] = at(q, z);
      if (i) p.lineTo(x, y);
      else p.moveTo(x, y);
    });
    if (close) p.closePath();
  };
  const face = (a: P2, b: P2, z0: number, z1: number) => {
    const p = [at(a, z1), at(b, z1), at(b, z0), at(a, z0)];
    ctx.beginPath();
    ctx.moveTo(p[0]![0], p[0]![1]);
    for (let i = 1; i < 4; i++) ctx.lineTo(p[i]![0], p[i]![1]);
    ctx.closePath();
  };
  const seg = (a: P2, za: number, b: P2, zb: number, p: Path2D | CanvasRenderingContext2D = ctx) => {
    const x = at(a, za);
    const y = at(b, zb);
    p.moveTo(x[0], x[1]);
    p.lineTo(y[0], y[1]);
  };

  const topFill = dark ? mix(T.ground, T.ink, 0.03) : mix(T.ground, "#ffffff", 0.55);
  const wallFill = dark ? mix(T.ground, T.ink, 0.05) : mix(T.ground, "#ffffff", 0.3);
  const edge = ink(T.ink, (dark ? 0.85 : 0.8) * inside3d);
  const sliceLine = ink(T.ink, (dark ? 0.32 : 0.36) * inside3d);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = T.ground;
  ctx.fillRect(0, 0, w, h);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = lw;

  // ── the four sectors, far first: walls, then the top, then what is on it
  for (const s of sectors) {
    const pts = s.poly;
    if (height > 0.3) {
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i]!;
        const b = pts[(i + 1) % pts.length]!;
        const n = outward(pts, a, b);
        if (n[1] <= 1e-6) continue;
        const cut = isCut(a, b);
        face(a, b, 0, height);
        ctx.fillStyle = cut ? T.ground : wallFill;
        ctx.fill();
        ctx.beginPath();
        for (let z = SLICE; z < height - 0.2; z += SLICE) seg(a, z, b, z);
        ctx.strokeStyle = cut ? ink(T.ink, 0.12 * inside3d) : sliceLine;
        ctx.stroke();
        ctx.beginPath();
        seg(a, 0, b, 0);
        if (cut) {
          seg(a, 0, a, height);
          seg(b, 0, b, height);
        }
        ctx.strokeStyle = cut ? ink(T.gold, 0.7 * inside3d) : edge;
        ctx.stroke();
      }
    }
    ctx.beginPath();
    path(pts, height);
    ctx.fillStyle = topFill;
    ctx.globalAlpha = inside3d;
    ctx.fill();
    ctx.globalAlpha = 1;
    // its rim edge in bone, its cut edges in fine gold: the slots
    ctx.beginPath();
    const rim = new Path2D();
    const cuts = new Path2D();
    pts.forEach((a, i) => {
      const b = pts[(i + 1) % pts.length]!;
      seg(a, height, b, height, isCut(a, b) ? cuts : rim);
    });
    ctx.strokeStyle = edge;
    ctx.stroke(rim);
    ctx.strokeStyle = ink(T.gold, 0.95 * inside3d);
    ctx.stroke(cuts);
    if (inside3d > 0.01) onTop(s, height);
  }

  // ── the stepped block: in the logo solid gold, in the drum a notch cut
  //    where the bars cross, gold-edged
  if (inside3d > 0.01) {
    ctx.beginPath();
    path(BLOCK, height);
    ctx.globalAlpha = inside3d;
    ctx.fillStyle = T.ground;
    ctx.fill();
    ctx.strokeStyle = ink(T.gold, 0.95);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // ── the ring: the logo's, thinning to the crescent, laid on the rim
  {
    const key = Math.round(thin * 100);
    let runs = crescents.get(key);
    if (!runs) {
      runs = crescentOf(thin);
      crescents.set(key, runs);
    }
    ctx.beginPath();
    for (const run of runs) path(run, height);
    ctx.fillStyle = T.gold;
    ctx.fill();
  }

  // ── the bars: solid gold where the logo has them, fading into the slots
  //    inside the rim; outside the rim they stay gold, as the logo runs out
  {
    const a = k / MARK.unit;
    const d = (k * sinE) / MARK.unit;
    const onMark = () => ctx.setTransform(a, 0, 0, d, ox - a * MARK.cx, oy - d * MARK.cy - k * cosE * height);
    const rimPath = () => {
      ctx.beginPath();
      path(circle(R * 0.985, 120), height);
    };
    ctx.save();
    rimPath();
    ctx.clip();
    onMark();
    ctx.globalAlpha = barGold;
    ctx.fillStyle = T.gold;
    for (const p of barPaths) ctx.fill(p, "evenodd");
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    path(circle(R * 0.985, 120), height);
    ctx.clip("evenodd");
    onMark();
    ctx.fillStyle = T.gold;
    for (const p of barPaths) ctx.fill(p, "evenodd");
    ctx.restore();
  }

  if (inside3d > 0.01) {
    crossings();
    spark();
    fray();
  }

  // ───────────────────────────────────────────────────────────── helpers

  function onTop(s: Sector, z: number) {
    ctx.save();
    ctx.beginPath();
    path(s.poly, z);
    path(s.poly, z + 6);
    ctx.clip("nonzero");
    ctx.globalAlpha = inside3d;
    ctx.lineWidth = lw * 0.85;
    const here = (p: P2) => inside(s.poly, p);
    if (s.side === "people") {
      const walls = new Path2D();
      for (const [a0, b0] of C.walls) {
        const a = rot(theta, a0);
        const b = rot(theta, b0);
        if (!here([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2])) continue;
        seg(a, z, b, z, walls);
        seg(a, z + 4.5, b, z + 4.5, walls);
        seg(a, z, a, z + 4.5, walls);
        seg(b, z, b, z + 4.5, walls);
      }
      ctx.strokeStyle = ink(T.ink, dark ? 0.85 : 0.8);
      ctx.stroke(walls);
      const people = new Path2D();
      const r = Math.max(lw * 1.1, k * 0.65);
      for (const p0 of C.people) {
        const p = rot(theta, p0);
        if (!here(p)) continue;
        const [x0, y0] = at(p, z);
        const [x1, y1] = at(p, z + 3.4);
        people.moveTo(x0, y0);
        people.lineTo(x1, y1 + r);
        people.moveTo(x1 + r, y1);
        people.arc(x1, y1, r, 0, Math.PI * 2);
      }
      ctx.strokeStyle = ink(T.ink, 0.9);
      ctx.fillStyle = ink(T.ink, 0.95);
      ctx.stroke(people);
      ctx.fill(people);
    } else {
      const traces = new Path2D();
      for (const tr of C.traces) {
        const q = tr.map((p) => rot(theta, p));
        path(q, z, false, traces);
      }
      ctx.strokeStyle = ink(T.gold, 1);
      ctx.stroke(traces);
      const vias = new Path2D();
      const vr = k * 0.7;
      for (const v of C.vias) {
        const [x, y] = at(rot(theta, v), z);
        vias.moveTo(x + vr, y);
        vias.ellipse(x, y, vr, vr * sinE, 0, 0, Math.PI * 2);
      }
      ctx.fillStyle = topFill;
      ctx.fill(vias);
      ctx.stroke(vias);
      for (const d of C.dies) {
        const box = ([[-1, -1], [1, -1], [1, 1], [-1, 1]] as P2[]).map(([x, y]) => rot(theta, [d.at[0] + (x * d.s) / 2, d.at[1] + (y * d.s) / 2]));
        if (!here(rot(theta, d.at))) continue;
        ctx.beginPath();
        path(box, z + 1.6);
        ctx.fillStyle = mix(T.gold, T.ground, dark ? 0.82 : 0.7);
        ctx.fill();
        ctx.strokeStyle = ink(T.gold, 0.95);
        ctx.stroke();
        ctx.beginPath();
        path(box.map((p) => [rot(theta, d.at)[0] + (p[0] - rot(theta, d.at)[0]) * 0.5, rot(theta, d.at)[1] + (p[1] - rot(theta, d.at)[1]) * 0.5] as P2), z + 1.6);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /** Dots crossing the slanted slot as the wheel turns: above the level bar
      from the people into the machine, below it back. */
  function crossings() {
    const dot = Math.max(lw * 1.5, k * 0.7);
    for (let i = 0; i < 70; i++) {
      const h1 = hash(i + 0.5);
      const h2 = hash(i * 7.77 + 1.3);
      const h3 = hash(i * 3.33 + 2.1);
      const s = -R * 0.85 + h1 * R * 1.7;
      // a point on the slot's centre line, s along it
      const p: P2 = [CROSSING[0] + SLANT.normal[1] * s, CROSSING[1] - SLANT.normal[0] * s];
      const r = Math.hypot(p[0], p[1]);
      if (r > R - 4 || Math.abs(p[1] - CROSSING[1]) < 9) continue;
      const into = p[1] < CROSSING[1];
      const f = (((t * (0.3 + h2 * 0.35) + h3) % 1) + 1) % 1;
      const off = (into ? f * 2 - 1 : 1 - f * 2) * SLANT.half * 1.3;
      const q: P2 = [p[0] + SLANT.normal[0] * off, p[1] + SLANT.normal[1] * off];
      const [x, y] = at(q, height - 2 - h2 * height * 0.5);
      ctx.globalAlpha = Math.sin(Math.PI * f) * inside3d;
      ctx.fillStyle = into ? mix(T.ink, T.gold, f) : mix(T.gold, T.ink, f);
      ctx.fillRect(x - dot / 2, y - dot / 2, dot, dot);
    }
    ctx.globalAlpha = 1;
  }

  /** The one light, where the bars cross. */
  function spark() {
    const b = 0.85 + 0.15 * Math.sin(t * 1.3);
    const [x, y] = at(CROSSING, height * 0.55);
    const r = k * 11;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
    glow.addColorStop(0, ink(T.lit, (dark ? 0.95 : 0.6) * b * inside3d));
    glow.addColorStop(0.16, ink(T.lit, (dark ? 0.32 : 0.2) * b * inside3d));
    glow.addColorStop(1, ink(T.lit, 0));
    ctx.save();
    ctx.globalCompositeOperation = dark ? "lighter" : "source-over";
    ctx.fillStyle = glow;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
    const s = k * 1.6;
    ctx.globalAlpha = inside3d;
    ctx.fillStyle = dark ? "#fff6dc" : T.lit;
    ctx.fillRect(x - s, y - s * 0.6, s * 2, s * 1.2);
    ctx.globalAlpha = 1;
  }

  /** A few raster lines leaving the upper left of the rim. */
  function fray() {
    ctx.save();
    ctx.lineWidth = lw * 0.8;
    for (let i = 0; i < 48; i++) {
      const phi = Math.PI * (1.05 + 0.3 * hash(i * 1.7));
      const z = height * (0.35 + 0.65 * hash(i * 2.3));
      const [x0, y0] = at([Math.cos(phi) * R, Math.sin(phi) * R], z);
      const reach = k * (14 + 40 * hash(i * 3.1));
      const drift = (t * (4 + 6 * hash(i)) * k) % (k * 8);
      let x = x0 - drift;
      let on = true;
      let n = 0;
      while (x > x0 - reach) {
        const len = k * (on ? 2 + 5 * hash(i * 9 + n) : 1.5 + 3 * hash(i * 5 + n));
        if (on) {
          ctx.beginPath();
          ctx.moveTo(x, y0);
          ctx.lineTo(x - len, y0);
          ctx.strokeStyle = ink(i % 7 === 0 ? T.green : T.ink, 0.85 * (1 - (x0 - x) / reach) * inside3d);
          ctx.stroke();
        }
        x -= len;
        on = !on;
        n++;
      }
    }
    ctx.restore();
  }

}
