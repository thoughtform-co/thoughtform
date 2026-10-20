/* The mark is the mind, painted. Canvas 2D, one call a frame.

   Round two of the build (owner, 2026-10-19: "a regression from the GPT
   images … go back to the drawing board and make it as elegant as possible").
   What the studies do and this painter now does:

   - the drum as tall as its radius, seen from higher (58°): the top is nearly
     a true circle, so the mark on it reads undistorted
   - line art on black: every face filled near-black so it hides what is
     behind it, every edge and slice a bright bone hairline; the lines carry
     the drawing, not grey fills
   - the drum's silhouette a circle, and the mark drawn flat over it: the
     logo's ring, thinned, hugging the silhouette; the bars cut as black slots
     straight down top and wall alike, gold hairline edges, solid gold where
     they run out past the rim; the stepped block the one lit spark
   - the front walls tell the story: the people's open in section, a storey a
     slice, people standing on every floor; the machine's in gold die layers
   - rooms and cubicles with real wall height, people standing; dense routed
     buses and two-tier dies
   - the upper left dissolves into the raster lines, the slices themselves
     running out as dashes

   The structure never moves; the contents and the front walls turn with the
   flywheel and show only through their own sectors. Layers that do not turn
   are cached offscreen per size, theme and state. */

import { BRANDMARK_PATHS } from "@/lib/brandmark/brandmarkPaths";
import { contentsOf, type Contents } from "./contents";
import { BLOCK, CROSSING, H, MARK, R, SLICE, crescentOf, inside, isCut, outward, sectorsOf, type P2, type Sector } from "./geometry";

export type Theme = "dark" | "light";
export type FloorsMode = "section" | "terrace";

export interface View {
  /** device px */
  w: number;
  h: number;
  theme: Theme;
  floors: FloorsMode;
  /** the flywheel's angle, radians, clockwise as seen */
  theta: number;
  /** seconds, for the drift of the raster lines and the breath of the spark */
  t: number;
  /** camera elevation, degrees (35.264 is the swarm's true isometric) */
  el: number;
  /** 0 the drum whole, 1 its four sectors pulled apart (the deep view) */
  part?: number;
  /** 1 the offices and circuits drawn, 0 the halves as the swarm's dot fields */
  detail?: number;
}

/** How far each sector moves out along its bisector when parted, plane units. */
const PART = 30;
/** The crescent: the logo's ring thinned to this share of its band. */
const THIN = 0.42;
/** Wall, desk and person heights on a floor. */
const WALL = 3.6;
const DESK = 1.3;
const PERSON = 3.2;
/** How far the raster lines reach left, plane units. */
const FRAY = 58;

const TONES = {
  dark: { ground: "#060505", ink: "#efe7da", gold: "#d1ab5a", lit: "#ffe39a", green: "#7fa86e" },
  light: { ground: "#efe9dc", ink: "#231c10", gold: "#8a6b20", lit: "#5e4410", green: "#466c3a" },
} as const;

const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a: string, b: string, t: number, alpha = 1) => {
  const x = hex(a);
  const y = hex(b);
  const c = x.map((v, i) => Math.round(v + (y[i]! - v) * t));
  return `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
};
const ink = (tone: string, alpha: number) => mix(tone, tone, 0, alpha);

interface Scene {
  sectors: Sector[];
  contents: Contents;
  crescent: P2[][];
  bars: Path2D[];
}
const scenes = new Map<FloorsMode, Scene>();
function sceneOf(floors: FloorsMode): Scene {
  let s = scenes.get(floors);
  if (!s) {
    s = { sectors: sectorsOf(floors), contents: contentsOf(11), crescent: crescentOf(THIN), bars: [2, 3, 4, 5, 6].map((i) => new Path2D(BRANDMARK_PATHS[i])) };
    scenes.set(floors, s);
  }
  return s;
}

interface Cam {
  k: number;
  ox: number;
  oy: number;
  sinE: number;
  cosE: number;
}

function camOf(w: number, h: number, el: number, part = 0): Cam {
  const e = (el * Math.PI) / 180;
  const sinE = Math.sin(e);
  const cosE = Math.cos(e);
  const spread = PART * part;
  // the drawing's bounds in plane units: the rim, the bar running out above
  // it and the level bar past it, the raster lines off the left
  const top = -(R + spread) * sinE - H * cosE - R * 0.16;
  const bottom = (R + spread) * sinE + R * 0.06;
  const left = -R - FRAY - spread * 0.4;
  const right = R * 1.12 + spread;
  const pad = 0.05;
  const k = Math.min((w * (1 - pad * 2)) / (right - left), (h * (1 - pad * 2)) / (bottom - top));
  return { k, sinE, cosE, ox: w / 2 - ((left + right) / 2) * k, oy: h / 2 - ((top + bottom) / 2) * k };
}

/** A plane point at height z, on screen. */
const at = (c: Cam, [u, v]: P2, z: number): P2 => [c.ox + c.k * u, c.oy + c.k * (v * c.sinE - z * c.cosE)];

function poly(ctx: CanvasRenderingContext2D | Path2D, c: Cam, pts: P2[], z: number, close = true) {
  pts.forEach((p, i) => {
    const [x, y] = at(c, p, z);
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  });
  if (close) ctx.closePath();
}

function quad(ctx: CanvasRenderingContext2D | Path2D, c: Cam, a: P2, b: P2, z0: number, z1: number) {
  const p = [at(c, a, z1), at(c, b, z1), at(c, b, z0), at(c, a, z0)];
  ctx.moveTo(p[0]![0], p[0]![1]);
  for (let i = 1; i < 4; i++) ctx.lineTo(p[i]![0], p[i]![1]);
  ctx.closePath();
}

function line(ctx: CanvasRenderingContext2D | Path2D, c: Cam, a: P2, za: number, b: P2, zb: number) {
  const p = at(c, a, za);
  const q = at(c, b, zb);
  ctx.moveTo(p[0], p[1]);
  ctx.lineTo(q[0], q[1]);
}

const rot = (theta: number, [p, q]: P2): P2 => [p * Math.cos(theta) - q * Math.sin(theta), p * Math.sin(theta) + q * Math.cos(theta)];
const hash = (n: number) => Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1;

type Layer = HTMLCanvasElement | OffscreenCanvas;
const layers = new Map<string, { key: string; canvas: Layer }>();
/** A cached offscreen layer, redrawn only when its state changes. */
function layerOf(name: string, key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): Layer {
  const hit = layers.get(name);
  if (hit && hit.key === key) return hit.canvas;
  const canvas: Layer = hit?.canvas ?? (typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(w, h) : Object.assign(document.createElement("canvas"), { width: w, height: h }));
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d") as CanvasRenderingContext2D;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, w, h);
  draw(g);
  layers.set(name, { key, canvas });
  return canvas;
}

export function paintMind(out: CanvasRenderingContext2D, view: View) {
  let ctx: CanvasRenderingContext2D = out;
  const { w, h, theme, floors, theta, t } = view;
  const part = Math.min(1, Math.max(0, view.part ?? 0));
  const detail = Math.min(1, Math.max(0, view.detail ?? 1));
  const T = TONES[theme];
  const dark = theme === "dark";
  const c = camOf(w, h, view.el, part);
  const scene = sceneOf(floors);
  const lw = Math.max(0.9, c.k * 0.26);

  // faces: near-black, a breath of the four side tones lit from the left, so
  // the lines carry the drawing
  const shade = (n: P2) => {
    const lit = (-n[0] + 1) / 2;
    const i = Math.min(3, Math.max(0, Math.floor(lit * 4)));
    return dark ? mix(T.ground, T.ink, [0.012, 0.022, 0.034, 0.048][i]!) : mix(T.ground, "#ffffff", [0.25, 0.4, 0.55, 0.7][i]!);
  };
  const topFill = dark ? mix(T.ground, T.ink, 0.018) : mix(T.ground, "#ffffff", 0.6);
  const edge = ink(T.ink, dark ? 0.95 : 0.9);
  const slice = ink(T.ink, dark ? 0.58 : 0.6);
  const seam = ink(T.ink, dark ? 0.24 : 0.28);
  const fine = ink(T.ink, dark ? 0.72 : 0.72);
  const gold = ink(T.gold, 0.96);

  const seat = (g: CanvasRenderingContext2D, sector: Sector) => {
    const cen = sector.poly.reduce((a, q) => [a[0] + q[0] / sector.poly.length, a[1] + q[1] / sector.poly.length] as P2, [0, 0] as P2);
    const cl = Math.hypot(cen[0], cen[1]) || 1;
    g.translate(c.k * (cen[0] / cl) * PART * part, c.k * c.sinE * (cen[1] / cl) * PART * part);
  };
  const floorsOf = (sector: Sector) => sector.floors.map((f, k) => (k === 0 ? { ...f, z0: f.z0 * (1 - part) } : f));
  const stateKey = [w, h, theme, floors, view.el, part.toFixed(3)].join("|");

  // ── under: the drum's structure, far sector first, each bottom to top
  const under = layerOf("under", stateKey, w, h, (g) => {
    ctx = g;
    style();
    for (const sector of scene.sectors) {
      ctx.save();
      seat(ctx, sector);
      for (const f of floorsOf(sector)) {
        walls(f.poly, f.z0, f.z);
        ctx.beginPath();
        poly(ctx, c, f.poly, f.z);
        ctx.fillStyle = topFill;
        ctx.fill();
        ctx.beginPath();
        f.poly.forEach((a, i) => {
          const b = f.poly[(i + 1) % f.poly.length]!;
          if (!isCut(a, b)) line(ctx, c, a, f.z, b, f.z);
        });
        ctx.strokeStyle = edge;
        ctx.stroke();
      }
      ctx.restore();
    }
  });

  // ── over: the mark, drawn flat over the whole object
  const over = layerOf("over", stateKey, w, h, (g) => {
    ctx = g;
    style();
    screenMark(1 - part);
  });

  // ── the frame
  ctx = out;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = T.ground;
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(under, 0, 0);
  style();
  for (const sector of scene.sectors) {
    ctx.save();
    seat(ctx, sector);
    if (part < 0.5) sideOfSlot(sector.side);
    floorsOf(sector).forEach((f, k) => {
      const upper = sector.floors[k + 1]?.poly;
      fronts(sector, f.poly, f.z0, f.z, upper);
      if (detail > 0.01) {
        ctx.globalAlpha = detail;
        if (sector.side === "people") offices(f.poly, f.z, upper);
        else circuits(f.poly, f.z, upper);
        ctx.globalAlpha = 1;
      }
      if (detail < 0.99) dotField(f.poly, f.z, sector.side, upper, 1 - detail);
    });
    ctx.restore();
  }
  ctx.drawImage(over, 0, 0);
  spark();
  crossings();
  dissolveUpperLeft();
  ctx.globalAlpha = 1 - part;
  if (part < 1) fray();
  ctx.globalAlpha = 1;

  // ───────────────────────────────────────────────────────────── helpers

  /** Clip to one side of the slanted slot as drawn on screen, so the people
      and the machine meet exactly at the gold. */
  function sideOfSlot(side: "people" | "machine") {
    const a = logoAt([238.75, 20]);
    const b = logoAt([169.5, 400]);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const far = (w + h) * 4;
    const p0: P2 = [a[0] - dx * far, a[1] - dy * far];
    const p1: P2 = [a[0] + dx * far, a[1] + dy * far];
    const off = side === "people" ? -far * 10 : far * 10;
    ctx.beginPath();
    ctx.moveTo(p0[0], p0[1]);
    ctx.lineTo(p1[0], p1[1]);
    ctx.lineTo(p1[0] + off, p1[1]);
    ctx.lineTo(p0[0] + off, p0[1]);
    ctx.closePath();
    ctx.clip();
  }

  function style() {
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = lw;
  }

  /** A prism's facing walls: filled dark, sliced every storey, its foot and
      its cut corners in bone. */
  function walls(pts: P2[], z0: number, z1: number) {
    const facing: { a: P2; b: P2; n: P2 }[] = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i]!;
      const b = pts[(i + 1) % pts.length]!;
      const n = outward(pts, a, b);
      if (n[1] > 1e-6) facing.push({ a, b, n });
    }
    // the cut faces are the bars' voids: kept black, their slices faint, so a
    // gap reads as a slot and not a wall
    for (const f of facing) {
      ctx.beginPath();
      quad(ctx, c, f.a, f.b, z0, z1);
      ctx.fillStyle = isCut(f.a, f.b) ? T.ground : shade(f.n);
      ctx.fill();
    }
    for (const cut of [false, true]) {
      ctx.beginPath();
      for (const f of facing) {
        if (isCut(f.a, f.b) !== cut) continue;
        for (let z = Math.ceil((z0 + 0.01) / SLICE) * SLICE; z < z1 - 0.01; z += SLICE) line(ctx, c, f.a, z, f.b, z);
      }
      ctx.strokeStyle = cut ? ink(T.ink, dark ? 0.16 : 0.2) : slice;
      ctx.stroke();
    }
    ctx.beginPath();
    for (const f of facing) {
      line(ctx, c, f.a, z0, f.b, z0);
      if (isCut(f.a, f.b)) {
        line(ctx, c, f.a, z0, f.a, z1);
        line(ctx, c, f.b, z0, f.b, z1);
      }
    }
    ctx.strokeStyle = edge;
    ctx.stroke();
  }

  /** The front walls turn with the drum: the flywheel's seams, and in
      section the people's storeys open with people standing on them, the
      machine's in gold die layers. */
  function fronts(sector: Sector, pts: P2[], z0: number, z1: number, upper?: P2[]) {
    const on = (p: P2) => inside(pts, [p[0] * 0.995, p[1] * 0.995]) && !(upper && inside(upper, [p[0] * 0.995, p[1] * 0.995]));
    const rim = (phi: number): P2 => [Math.cos(phi) * R, Math.sin(phi) * R];
    // the seams, every 10°
    ctx.beginPath();
    for (let k = 0; k < 36; k++) {
      const p = rim((k / 36) * Math.PI * 2 + theta);
      if (p[1] <= 2 || !on(p)) continue;
      line(ctx, c, p, z0, p, z1);
    }
    ctx.strokeStyle = seam;
    ctx.stroke();
    if (floors !== "section") return;
    if (sector.side === "people") {
      // a person every few units round the rim, on every storey, turning
      const stems = new Path2D();
      const heads = new Path2D();
      const desks = new Path2D();
      const r = Math.max(lw * 0.85, c.k * 0.5);
      const STEP = 3.2 / R;
      for (let z = Math.ceil(z0 / SLICE) * SLICE; z < z1 - 1; z += SLICE) {
        const storey = Math.round(z / SLICE);
        for (let k = 0; k < (Math.PI * 2) / STEP; k++) {
          const hk = hash(k * 7.1 + storey * 131.3);
          if (hk < 0.42) continue;
          const phi = k * STEP + theta;
          const p = rim(phi);
          if (p[1] <= 6 || !on(p)) continue;
          const foot = at(c, p, z + 0.8);
          const head = at(c, p, z + 0.8 + PERSON);
          stems.moveTo(foot[0], foot[1]);
          stems.lineTo(head[0], head[1] + r);
          heads.moveTo(head[0] + r, head[1]);
          heads.arc(head[0], head[1], r, 0, Math.PI * 2);
          if (hk > 0.82) {
            const p2 = rim(phi + STEP * 0.6);
            line(desks, c, p, z + 0.8 + DESK, p2, z + 0.8 + DESK);
          }
        }
      }
      ctx.strokeStyle = fine;
      ctx.stroke(desks);
      ctx.strokeStyle = ink(T.ink, dark ? 0.8 : 0.85);
      ctx.stroke(stems);
      ctx.fillStyle = ink(T.ink, dark ? 0.92 : 0.9);
      ctx.fill(heads);
    } else {
      // three gold layers a storey, vias rising between them
      const layer = new Path2D();
      const vias = new Path2D();
      for (let z = Math.ceil(z0 / SLICE) * SLICE; z < z1 - 1; z += SLICE / 3) {
        let prev: P2 | null = null;
        for (let k = 0; k <= 180; k++) {
          const p = rim((k / 180) * Math.PI);
          if (!on(p)) {
            prev = null;
            continue;
          }
          if (prev) line(layer, c, prev, z, p, z);
          prev = p;
        }
      }
      const STEP = 2.2 / R;
      for (let z = Math.ceil(z0 / SLICE) * SLICE; z < z1 - SLICE / 3; z += SLICE / 3) {
        for (let k = 0; k < (Math.PI * 2) / STEP; k++) {
          if (hash(k * 3.3 + z * 1.7) < 0.55) continue;
          const p = rim(k * STEP + theta);
          if (p[1] <= 6 || !on(p)) continue;
          line(vias, c, p, z, p, z + SLICE / 3);
        }
      }
      ctx.strokeStyle = ink(T.gold, dark ? 0.55 : 0.6);
      ctx.stroke(layer);
      ctx.strokeStyle = ink(T.gold, dark ? 0.85 : 0.9);
      ctx.stroke(vias);
    }
  }

  /** Clip to a floor's top, raised enough for walls and people to stand. */
  function clipTop(pts: P2[], z: number, upper?: P2[]) {
    ctx.beginPath();
    poly(ctx, c, pts, z);
    poly(ctx, c, pts, z + WALL + 0.5);
    ctx.clip("nonzero");
    if (upper) {
      // what an upper terrace hides
      ctx.beginPath();
      ctx.rect(0, 0, w, h);
      poly(ctx, c, upper, z + SLICE);
      ctx.clip("evenodd");
    }
  }

  /** The offices: walls of real height, desks, people standing, drawn back to
      front so a wall hides who stands behind it. */
  function offices(pts: P2[], z: number, upper?: P2[]) {
    const C = scene.contents;
    const here = (p: P2) => inside(pts, [p[0] * 0.999, p[1] * 0.999]) && !(upper && inside(upper, p));
    type Item = { v: number; draw: () => void };
    const items: Item[] = [];
    for (const wl of C.walls) {
      const a = rot(theta, wl.a);
      const b = rot(theta, wl.b);
      const m: P2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      if (!here(m)) continue;
      items.push({
        v: m[1],
        draw: () => {
          ctx.beginPath();
          quad(ctx, c, a, b, z, z + WALL);
          ctx.fillStyle = topFill;
          ctx.fill();
          ctx.strokeStyle = fine;
          ctx.stroke();
        },
      });
    }
    for (const d of C.desks) {
      const m = rot(theta, d.at);
      if (!here(m)) continue;
      const hw = d.w / 2;
      const hd = d.d / 2;
      const corners = ([[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]] as P2[]).map(([x, y]) => rot(theta, [d.at[0] + x, d.at[1] + y]));
      items.push({
        v: m[1],
        draw: () => {
          // a low box: its facing sides, then its top
          for (let i = 0; i < 4; i++) {
            const a = corners[i]!;
            const b = corners[(i + 1) % 4]!;
            const n = outward(corners, a, b);
            if (n[1] <= 0) continue;
            ctx.beginPath();
            quad(ctx, c, a, b, z, z + DESK);
            ctx.fillStyle = shade(n);
            ctx.fill();
            ctx.strokeStyle = fine;
            ctx.stroke();
          }
          ctx.beginPath();
          poly(ctx, c, corners, z + DESK);
          ctx.fillStyle = topFill;
          ctx.fill();
          ctx.strokeStyle = fine;
          ctx.stroke();
        },
      });
    }
    const r = Math.max(lw * 0.75, c.k * 0.42);
    for (const p of C.people) {
      const m = rot(theta, p.at);
      if (!here(m)) continue;
      items.push({
        v: m[1] + 0.3,
        draw: () => {
          const foot = at(c, m, z);
          const head = at(c, m, z + PERSON);
          ctx.beginPath();
          ctx.moveTo(foot[0], foot[1]);
          ctx.lineTo(head[0], head[1] + r);
          ctx.strokeStyle = p.live ? T.green : ink(T.ink, dark ? 0.85 : 0.9);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(head[0], head[1], r, 0, Math.PI * 2);
          ctx.fillStyle = p.live ? T.green : T.ink;
          ctx.fill();
        },
      });
    }
    ctx.save();
    clipTop(pts, z, upper);
    ctx.lineWidth = lw * 0.7;
    items.sort((x, y) => x.v - y.v).forEach((it) => it.draw());
    ctx.restore();
  }

  /** The circuits: buses and traces in gold, vias, dies in one or two tiers. */
  function circuits(pts: P2[], z: number, upper?: P2[]) {
    const C = scene.contents;
    ctx.save();
    clipTop(pts, z, upper);
    ctx.lineWidth = lw * 0.85;
    const traces = new Path2D();
    for (const tr of C.traces) poly(traces, c, tr.pts.map((p) => rot(theta, p)), z + 0.05, false);
    ctx.strokeStyle = ink(T.gold, dark ? 0.95 : 0.92);
    ctx.stroke(traces);
    const vias = new Path2D();
    const vr = c.k * 0.45;
    for (const v of C.vias) {
      const [x, y] = at(c, rot(theta, v), z);
      vias.moveTo(x + vr, y);
      vias.ellipse(x, y, vr, vr * c.sinE, 0, 0, Math.PI * 2);
    }
    ctx.fillStyle = topFill;
    ctx.fill(vias);
    ctx.stroke(vias);
    const dies = C.dies
      .map((d) => ({ d, m: rot(theta, d.at) }))
      .filter(({ m }) => inside(pts, m) && !(upper && inside(upper, m)))
      .sort((a, b) => a.m[1] - b.m[1]);
    for (const { d } of dies) {
      const sq = (s: number) => ([[-s, -s], [s, -s], [s, s], [-s, s]] as P2[]).map(([x, y]) => rot(theta, [d.at[0] + x, d.at[1] + y]));
      for (let tier = 0; tier < d.tiers; tier++) {
        const box = sq((d.s / 2) * (tier ? 0.62 : 1));
        const z0 = z + tier * 2.2;
        const z1 = z0 + 2.2;
        for (let i = 0; i < 4; i++) {
          const a = box[i]!;
          const b = box[(i + 1) % 4]!;
          const n = outward(box, a, b);
          if (n[1] <= 1e-6) continue;
          ctx.beginPath();
          quad(ctx, c, a, b, z0, z1);
          ctx.fillStyle = mix(T.gold, T.ground, dark ? 0.86 - (-n[0] + 1) * 0.06 : 0.75);
          ctx.fill();
          ctx.strokeStyle = gold;
          ctx.stroke();
        }
        ctx.beginPath();
        poly(ctx, c, box, z1);
        ctx.fillStyle = mix(T.gold, T.ground, dark ? 0.9 : 0.8);
        ctx.fill();
        ctx.strokeStyle = gold;
        ctx.stroke();
      }
      // a grid of pads on the top tier
      const s = (d.s / 2) * (d.tiers > 1 ? 0.62 : 1) * 0.6;
      const zt = z + d.tiers * 2.2;
      const pads = new Path2D();
      for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
          const [x, y] = at(c, rot(theta, [d.at[0] + (i / 2) * s, d.at[1] + (j / 2) * s]), zt);
          pads.rect(x - lw * 0.7, y - lw * 0.7, lw * 1.4, lw * 1.4);
        }
      }
      ctx.fillStyle = gold;
      ctx.fill(pads);
    }
    ctx.restore();
  }

  /** The section and deep views: a half drawn as the swarm draws its plates,
      square dots on a lattice that turns with the drum. */
  function dotField(pts: P2[], z: number, side: "people" | "machine", upper: P2[] | undefined, alpha: number) {
    const STEP = 3.4;
    const dot = Math.max(lw * 1.6, c.k * 0.8);
    const base = side === "people" ? T.green : T.gold;
    ctx.save();
    for (let i = -30; i <= 30; i++) {
      for (let j = -30; j <= 30; j++) {
        const q: P2 = [i * STEP, j * STEP];
        if (q[0] * q[0] + q[1] * q[1] > (R - 6) * (R - 6)) continue;
        const p = rot(theta, q);
        if (!inside(pts, p) || (upper && inside(upper, p))) continue;
        const hsh = Math.abs(Math.sin(i * 127.1 + j * 311.7) * 43758.5453) % 1;
        if (hsh < 0.18) continue;
        const [x, y] = at(c, p, z);
        ctx.globalAlpha = alpha * (0.6 + 0.4 * hsh);
        ctx.fillStyle = hsh > 0.93 ? T.ink : base;
        ctx.fillRect(x - dot / 2, y - (dot * c.sinE) / 2, dot, dot * c.sinE);
      }
    }
    ctx.restore();
  }

  /** The whole drum's silhouette (it is a circle at the default camera):
      its centre and radius on screen. */
  function silhouette() {
    const top = at(c, [0, 0], H)[1] - c.k * R * c.sinE;
    const bottom = at(c, [0, 0], 0)[1] + c.k * R * c.sinE;
    return { cx: c.ox, cy: (top + bottom) / 2, rx: c.k * R, ry: (bottom - top) / 2 };
  }

  /** The mark drawn flat over the whole object, as the image studies do: the
      logo fitted to the silhouette, its bars cut as black slots right through
      the drum (top and wall alike) with gold hairline edges, running out past
      the rim in solid gold; its ring, thinned, hugging the silhouette. */
  function screenMark(alpha: number) {
    if (alpha <= 0.001) return;
    const S = silhouette();
    const s = (S.rx * 1.035) / 205; // the logo's ring outer edge just outside the drum
    const toLogo = () => ctx.setTransform(s, 0, 0, s * (S.ry / S.rx), S.cx - s * MARK.cx, S.cy - s * (S.ry / S.rx) * MARK.cy);
    const body = (fresh = true) => {
      if (fresh) ctx.beginPath();
      const t0 = at(c, [0, 0], H);
      const b0 = at(c, [0, 0], 0);
      ctx.moveTo(t0[0] - S.rx, t0[1]);
      ctx.ellipse(t0[0], t0[1], S.rx, c.k * R * c.sinE, 0, Math.PI, 0);
      ctx.lineTo(b0[0] + S.rx, b0[1]);
      ctx.ellipse(b0[0], b0[1], S.rx, c.k * R * c.sinE, 0, 0, Math.PI);
      ctx.closePath();
    };
    // the bars as their centre lines (the logo's own bars are too heavy at
    // this size; the studies cut them as fine slots)
    // inside the drum the slots run right through it; outside, only as far as
    // the logo's own bars
    const dx = (169.5 - 238.75) / 380;
    const slots = new Path2D();
    slots.moveTo(238.75 - dx * 200, -180);
    slots.lineTo(169.5 + dx * 300, 700);
    slots.moveTo(-200, 227.6);
    slots.lineTo(431, 227.6);
    const runOut = new Path2D();
    runOut.moveTo(238.75 - dx * 20, 0);
    runOut.lineTo(169.5, 400);
    runOut.moveTo(29.8, 227.6);
    runOut.lineTo(431, 227.6);
    const slotW = (c.k * 6.5) / s; // logo units
    ctx.save();
    ctx.globalAlpha = alpha;
    body();
    ctx.clip();
    toLogo();
    ctx.lineCap = "butt";
    ctx.lineWidth = slotW + (lw * 2.4) / s;
    ctx.strokeStyle = gold;
    ctx.stroke(slots);
    ctx.lineWidth = slotW;
    ctx.strokeStyle = T.ground;
    ctx.stroke(slots);
    ctx.restore();
    // outside the drum: the bars run on as fine gold
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    body(false);
    ctx.clip("evenodd");
    toLogo();
    ctx.lineCap = "butt";
    ctx.lineWidth = slotW * 0.55;
    ctx.strokeStyle = T.gold;
    ctx.stroke(runOut);
    ctx.restore();
    // the ring, thinned, round the silhouette
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const k = (S.rx * 1.035) / R;
    ctx.beginPath();
    for (const run of scene.crescent) {
      run.forEach(([x, y], i) => (i ? ctx.lineTo(S.cx + x * k, S.cy + y * k * (S.ry / S.rx)) : ctx.moveTo(S.cx + x * k, S.cy + y * k * (S.ry / S.rx))));
      ctx.closePath();
    }
    ctx.fillStyle = T.gold;
    ctx.fill();
    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /** Where a point of the logo lands on screen. */
  function logoAt([mx, my]: P2): P2 {
    const S = silhouette();
    const s = (S.rx * 1.035) / 205;
    return [S.cx + (mx - MARK.cx) * s, S.cy + (my - MARK.cy) * s * (S.ry / S.rx)];
  }

  /** The one lit thing: the mark's stepped block, small, at the crossing,
      breathing. */
  function spark() {
    const breath = 0.82 + 0.18 * Math.sin(t * 1.3);
    const toMark = (p: P2): P2 => [MARK.cx + (p[0] - CROSSING[0]) * MARK.unit * 0.95, MARK.cy + (p[1] - CROSSING[1]) * MARK.unit * 0.95];
    const glyph = BLOCK.map((p) => logoAt(toMark(p)));
    const [x, y] = logoAt([MARK.cx, MARK.cy - 1]);
    const r = c.k * 9;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, ink(T.lit, (dark ? 0.95 : 0.5) * breath * (1 - part * 0.6)));
    g.addColorStop(0.18, ink(T.lit, (dark ? 0.3 : 0.16) * breath * (1 - part * 0.6)));
    g.addColorStop(1, ink(T.lit, 0));
    ctx.save();
    ctx.globalCompositeOperation = dark ? "lighter" : "source-over";
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
    ctx.beginPath();
    glyph.forEach(([gx, gy], i) => (i ? ctx.lineTo(gx, gy) : ctx.moveTo(gx, gy)));
    ctx.closePath();
    ctx.fillStyle = dark ? "#fff6dc" : T.lit;
    ctx.fill();
  }

  /** The flywheel's crossing: dots cross the slanted slot. Above the level
      bar they run from the people into the machine (bone to gold), below it
      back (gold to bone). */
  function crossings() {
    const top = logoAt([238.75, 20]);
    const bot = logoAt([169.5, 400]);
    const len = Math.hypot(bot[0] - top[0], bot[1] - top[1]);
    const d: P2 = [(bot[0] - top[0]) / len, (bot[1] - top[1]) / len];
    const n: P2 = [-d[1], d[0]]; // toward the machine side (+x)
    const half = logoAt([MARK.cx + 13, MARK.cy])[0] - logoAt([MARK.cx, MARK.cy])[0];
    const cross = logoAt([MARK.cx, MARK.cy]);
    const S = silhouette();
    const dot = Math.max(lw * 1.6, c.k * 0.62);
    for (let i = 0; i < 160; i++) {
      const h1 = hash(i + 0.5);
      const h2 = hash(i * 7.77 + 1.3);
      const h3 = hash(i * 3.33 + 2.1);
      const s = 0.06 + h1 * 0.88;
      const ax = top[0] + d[0] * len * s;
      const ay = top[1] + d[1] * len * s;
      if (Math.abs(ay - cross[1]) < c.k * 7) continue; // under the block
      if (((ax - S.cx) / S.rx) ** 2 + ((ay - S.cy) / S.ry) ** 2 > 0.9) continue;
      const intoMachine = ay < cross[1];
      const k = (((t * (0.35 + h2 * 0.4) + h3) % 1) + 1) % 1;
      const side = (intoMachine ? k * 2 - 1 : 1 - k * 2) * half * 1.25;
      const x = ax + n[0] * side;
      const y = ay + n[1] * side;
      ctx.globalAlpha = Math.sin(Math.PI * k) * 0.95 * (1 - part);
      ctx.fillStyle = intoMachine ? mix(T.ink, T.gold, k) : mix(T.gold, T.ink, k);
      ctx.fillRect(x - dot / 2, y - dot / 2, dot, dot);
    }
    ctx.globalAlpha = 1;
  }

  /** The upper left gives way: the drum fades into the ground there, so the
      raster lines read as the slices themselves running out. */
  function dissolveUpperLeft() {
    const a = at(c, [-R * 0.55, -R * 0.62], H);
    const b = at(c, [-R * 1.05, -R * 0.66], H * 0.4);
    const g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
    g.addColorStop(0, ink(T.ground, 0));
    g.addColorStop(0.6, ink(T.ground, 0.3 * (1 - part)));
    g.addColorStop(1, ink(T.ground, 0.75 * (1 - part)));
    ctx.save();
    ctx.beginPath();
    // only the upper left quarter of the drawing
    const cx = logoAt([MARK.cx, MARK.cy]);
    ctx.rect(0, 0, cx[0], cx[1]);
    ctx.clip();
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  /** The slices running out of the upper left as raster lines: a dash line at
      every half storey, drifting left and thinning, a few dots between. */
  function fray() {
    const BUCKETS = 6;
    const lines: Path2D[] = Array.from({ length: BUCKETS }, () => new Path2D());
    const greens: Path2D[] = Array.from({ length: BUCKETS }, () => new Path2D());
    const specks: Path2D[] = Array.from({ length: BUCKETS }, () => new Path2D());
    let n = 0;
    for (let z = SLICE * 2; z <= H + 0.1; z += SLICE / 2) {
      for (let j = 0; j < 4; j++, n++) {
        const r1 = hash(n * 1.31 + 0.2);
        const r2 = hash(n * 2.17 + 0.7);
        const phi = Math.PI * (1.02 + 0.16 * r1);
        const p: P2 = [Math.cos(phi) * R, Math.sin(phi) * R];
        const [x0, y0] = at(c, p, z);
        const reach = c.k * (10 + FRAY * (0.35 + 0.65 * r2) * (0.55 + 0.45 * (z / H)));
        const drift = (t * (5 + r2 * 9) * c.k) % (c.k * 6);
        let x = x0 + c.k * 6 - drift;
        let on = true;
        let seg = 0;
        while (x > x0 - reach) {
          const len = c.k * (on ? 1.2 + 4 * hash(n * 5.1 + seg) : 0.8 + 2.6 * hash(n * 3.7 + seg));
          const d = Math.max(0, x0 - x) / reach;
          const bucket = Math.min(BUCKETS - 1, Math.floor(d * BUCKETS));
          if (on) {
            const path = n % 11 === 0 ? greens[bucket]! : lines[bucket]!;
            path.moveTo(x, y0);
            path.lineTo(x - len, y0);
          } else if (seg % 3 === 1) specks[bucket]!.rect(x - lw * 0.9, y0 - lw * 0.9, lw * 1.8, lw * 1.8);
          x -= len;
          on = !on;
          seg++;
        }
      }
    }
    ctx.save();
    ctx.lineWidth = lw;
    const base = ctx.globalAlpha;
    for (let k = 0; k < BUCKETS; k++) {
      const fade = 1 - (k + 0.3) / BUCKETS;
      ctx.globalAlpha = base * 0.75 * fade;
      ctx.strokeStyle = T.ink;
      ctx.stroke(lines[k]!);
      ctx.strokeStyle = T.green;
      ctx.stroke(greens[k]!);
      ctx.fillStyle = T.ink;
      ctx.fill(specks[k]!);
    }
    ctx.restore();
  }
}

/** For a capture or a test: the drawing's box at a size, in device px. */
export const layoutOf = (w: number, h: number, el: number, part = 0) => camOf(w, h, el, part);
