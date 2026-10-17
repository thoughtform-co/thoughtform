/**
 * D6 · Signal Field (machine-mind lab, 2026-10-17; owner: "our leitmotif is
 * the particle system diagrams"; "it feels a bit more like particles … like
 * nanobots").
 *
 * The brain as the swarm engine draws a thing: square dots on one isometric
 * lattice (11:6 on a large screen, then `dots.ts`'s 9:5, 7:4 or 5:3),
 * snapped to the device's pixels, opaque mixes over the ground and no alpha
 * anywhere. Every site the hull covers holds a dot, and the dot's SIZE is
 * the hull's light there (taken from the hull with its gyri eased, so it
 * sweeps the dome; the folds a gentle swell on top), dithered between sizes
 * in the lattice's own axes: dense on the lit flank, sparse in shadow, the
 * silhouette and the near hemisphere's edge a crisp file of rim dots. The
 * shape is the hull's, sampled where the camera meets it, so the outline is
 * today's.
 *
 * On it a few nuclei and the routes between them, level, plumb or at 45
 * degrees in (u, w) on the surface, each a file of the field's own dots a
 * little brighter. Signals walk the routes as short gold runs, site by
 * site; a nucleus swells as one arrives, the way the swarm's layer swells to
 * its hot core. The hub stands swollen, its core the one lit thing.
 * Clock-driven, so `?t=` freezes it.
 *
 * The picture's SVG carries no dots: the field is painted on the stage's
 * canvas in `live().over`, because a dot is only crisp when it is snapped to
 * the device grid, and only the canvas knows `px`.
 */

import { BRAIN_VIEW_ISO, brainIsoBox, type BrainView } from "@/components/arcs/figures/foundation/brainIso";
import { depthOf } from "@/components/arcs/figures/foundation/isoKit";
import { elbow } from "@/components/xb-proposal/kit/trace";
import { bayer, hash2 } from "../../stack-forms/model/draw";
import { foldAt, lightVector, makeHull, mindSvg, mix, sidesFarFirst, T_UNIT, type Hull, type MindTones, type Side } from "../hull";
import type { MindDirection, MindLive, MindOptions } from "./types";

// ─── the knobs ──────────────────────────────────────────────────────────────

/** The lattices, a site step of (a, b) grains, coarsest first: the swarm's
    three (`dots.ts`) under one coarser step of the same angle, so on a large
    screen a dot reads as a particle rather than as a halftone. */
const LATTICES: readonly (readonly [number, number])[] = [
  [11, 6],
  [9, 5],
  [7, 4],
  [5, 3],
];
/** Columns of the lattice across the brain's width: the coarsest lattice
    that gives at least this many is used, so a dot keeps its size on a
    large screen and the form, not the dot, shrinks on a small one. */
const COLUMNS = 70;
/** The light is taken from the hull with its gyri eased to this share, so
    the density sweeps the dome in one gradient; the folds come back as a
    gentle swell of the dots on each crest (`FOLDS`), never as holes. */
const LIGHT_FOLD = 0.25;
const FOLDS = 0.18;
/** The kit's light from the upper left, turned this far toward the viewer,
    so the faces the camera sees run lit to shadow across the form and the
    shadow gathers at the far edges. */
const TOWARD = 0.25;
/** Light · normal mapped onto the dots: below `LO` a site is empty, at `HI`
    its dot is the largest the body takes; `CURVE` over 1 keeps the middle
    of the surface small, so only the lit flank is dense. */
const LO = -0.1;
const HI = 0.85;
const CURVE = 2.1;
/** The body's shares of ink over the ground, smallest dot first. */
const INK = [0.22, 0.34, 0.5, 0.76] as const;
const INK_LIGHT = [0.3, 0.42, 0.56, 0.74] as const;
/** The rim's share. */
const RIM = 0.5;
/** A route's standing file: the field's own dots a little brighter, so the
    trace a signal walks is felt more than drawn. */
const FILE_LIFT = 0.34;
/** A depth step this large between neighbours is an edge (a fold or the
    near hemisphere standing in front of the far one), brain units. */
const EDGE = 14;

/** Sites a second a signal covers. */
const PACE = 7.5;
/** How long a nucleus stays bright after a signal arrives, seconds. */
const AFTERGLOW = 1.1;
/** A signal: its head and the tail behind it, as (sites back, size tier,
    tenths of gold). */
const COMET: readonly (readonly [number, number, number])[] = [
  [0, 4, 10],
  [1, 3, 10],
  [2, 3, 9],
  [3, 3, 8],
  [4, 2, 8],
  [5, 2, 7],
  [6, 2, 6],
  [7, 1, 6],
  [8, 1, 5],
  [9, 0, 4],
];

// ─── the lattice ────────────────────────────────────────────────────────────

interface Lat {
  /** Device px per site step along a column (a) and a row (b). */
  A: number;
  B: number;
  /** Dot sizes in device px, tiers 0 … 4 (`dots.ts` `tierSizes`). */
  sizes: number[];
}

function latticeFor(px: number, dpr: number, brainUnits: number): Lat {
  const g = Math.max(1, Math.round(dpr));
  const css = (brainUnits * px) / dpr;
  let pick = LATTICES[LATTICES.length - 1];
  for (const l of LATTICES) {
    if (css / l[0] >= COLUMNS) {
      pick = l;
      break;
    }
  }
  const [a, b] = pick;
  return { A: a * g, B: b * g, sizes: [Math.max(1, b - 3) * g, Math.max(2, b - 2) * g, Math.max(2, b - 1) * g, b * g, (a - 2) * g] };
}

// ─── the field ──────────────────────────────────────────────────────────────

interface Grid {
  p0: number;
  q0: number;
  w: number;
  h: number;
  /** 0 empty, else the hemisphere (−1 / +1). */
  side: Int8Array;
  depth: Float32Array;
  lit: Float32Array;
  t: Float32Array;
  z: Float32Array;
}

interface Run {
  /** Device offsets from the anchor, per site. */
  x: Int32Array;
  y: Int32Array;
  /** Whether the site is seen. */
  seen: Uint8Array;
  /** The nucleus it leaves and the one it reaches. */
  from: number;
  to: number;
  phase: number;
  /** Sites of rest after each arrival. */
  rest: number;
}

interface Nucleus {
  /** The sites round its centre out to `REACH`, device offsets, and each
      one's distance from the centre in site steps (0 the centre). */
  x: Int32Array;
  y: Int32Array;
  d: Float32Array;
  hub: boolean;
}

interface Field {
  lat: Lat;
  /** The picture point the lattice is anchored on. */
  cx: number;
  cy: number;
  body: Body;
  /** The body prerendered (null until the first frame; false where no
      canvas can be made) and where the anchor sits in it. */
  canvas: CanvasImageSource | null | false;
  ox: number;
  oy: number;
  runs: Run[];
  nuclei: Nucleus[];
  palette: Palette;
}

/** The body's dots, packed by colour: device offsets from the anchor. */
interface Body {
  x: Int32Array;
  y: Int32Array;
  size: Uint8Array;
  colour: string[];
}

interface Palette {
  ground: string;
  /** Gold at a share of itself over the ground, 0 … 10 tenths. */
  gold: string[];
  lit: string;
}

const paletteOf = (tones: MindTones): Palette => ({
  ground: tones.ground,
  gold: Array.from({ length: 11 }, (_, i) => mix(tones.ground, tones.gold, i / 10)),
  lit: tones.lit,
});

/** The hemispheres a picture draws, far first. */
const sidesOf = (o: MindOptions): Side[] => (o.only ? [o.only] : sidesFarFirst(o.view));

/** The hub's hemisphere: the near one, so a parted picture still has one
    lit thing. */
const hubSide = (view: BrainView): Side => sidesFarFirst(view)[1];

/** Every site the hull covers, nearest surface wins: the hemispheres'
    facing facets rasterised into the lattice, each with its light. */
function rasterise(o: MindOptions, hulls: Map<Side, Hull>, lat: Lat, px: number, cx: number, cy: number): Grid {
  const B = brainIsoBox(o.view);
  const sx = lat.A / px;
  const sy = lat.B / px;
  const p0 = Math.floor((B.x0 - cx) / sx) - 2;
  const p1 = Math.ceil((B.x1 - cx) / sx) + 2;
  const q0 = Math.floor((B.y0 - cy) / sy) - 2;
  const q1 = Math.ceil((B.y1 - cy) / sy) + 2;
  const w = p1 - p0 + 1;
  const h = q1 - q0 + 1;
  const G: Grid = { p0, q0, w, h, side: new Int8Array(w * h), depth: new Float32Array(w * h).fill(-1e9), lit: new Float32Array(w * h), t: new Float32Array(w * h), z: new Float32Array(w * h) };
  for (const [side, hull] of hulls) {
    for (const f of hull.facets) {
      if (!f.facing) continue;
      const lv = f.v.map((v) => v.lit);
      const t0 = f.v[0].t;
      const ts = f.v.map((v) => (v.t - t0 > Math.PI ? v.t - Math.PI * 2 : t0 - v.t > Math.PI ? v.t + Math.PI * 2 : v.t));
      const ds = f.v.map((v) => depthOf(v.w, hull.P));
      for (const [a, b, d] of [
        [0, 1, 2],
        [0, 2, 3],
      ] as const) {
        const [xa, ya] = f.v[a].xy;
        const [xb, yb] = f.v[b].xy;
        const [xc, yc] = f.v[d].xy;
        const den = (yb - yc) * (xa - xc) + (xc - xb) * (ya - yc);
        if (Math.abs(den) < 1e-9) continue;
        const qa = Math.ceil((Math.min(ya, yb, yc) - cy) / sy);
        const qb = Math.floor((Math.max(ya, yb, yc) - cy) / sy);
        const pa = Math.ceil((Math.min(xa, xb, xc) - cx) / sx);
        const pb = Math.floor((Math.max(xa, xb, xc) - cx) / sx);
        for (let q = qa; q <= qb; q++) {
          const y = cy + q * sy;
          for (let p = pa + (((pa + q) % 2) + 2) % 2; p <= pb; p += 2) {
            const x = cx + p * sx;
            const w1 = ((yb - yc) * (x - xc) + (xc - xb) * (y - yc)) / den;
            const w2 = ((yc - ya) * (x - xc) + (xa - xc) * (y - yc)) / den;
            const w3 = 1 - w1 - w2;
            if (w1 < -1e-6 || w2 < -1e-6 || w3 < -1e-6) continue;
            const depth = w1 * ds[a] + w2 * ds[b] + w3 * ds[d];
            const k = (q - q0) * w + (p - p0);
            if (depth <= G.depth[k]) continue;
            G.depth[k] = depth;
            G.side[k] = side;
            G.lit[k] = w1 * lv[a] + w2 * lv[b] + w3 * lv[d];
            G.t[k] = w1 * ts[a] + w2 * ts[b] + w3 * ts[d];
            G.z[k] = w1 * f.v[a].z + w2 * f.v[b].z + w3 * f.v[d].z;
          }
        }
      }
    }
  }
  return G;
}

const cellOf = (G: Grid, p: number, q: number) => (p < G.p0 || q < G.q0 || p >= G.p0 + G.w || q >= G.q0 + G.h ? -1 : (q - G.q0) * G.w + (p - G.p0));

/** The nearest site of the lattice to a picture point. */
function siteOf(x: number, y: number, sx: number, sy: number, cx: number, cy: number): [number, number] {
  const fp = (x - cx) / sx;
  const fq = (y - cy) / sy;
  let p = Math.round(fp);
  let q = Math.round(fq);
  if ((((p + q) % 2) + 2) % 2) {
    // off the lattice: the nearer of the two neighbours that are on it
    const dp = fp - p;
    const dq = fq - q;
    if (Math.abs(dp) * sx > Math.abs(dq) * sy) p += Math.sign(dp) || 1;
    else q += Math.sign(dq) || 1;
  }
  return [p, q];
}

/** A hemisphere's network: where its nuclei sit in (t, z) and the routes
    between them, nucleus to nucleus, with the leg that runs first. The near
    hemisphere's first nucleus is the hub, the one lit thing; the far one's
    network keeps to the crown and the front, which the camera sees. Only
    the nuclei the camera sees are kept, and only routes between them. */
interface Network {
  nuclei: readonly (readonly [number, number])[];
  routes: readonly (readonly [number, number, "h" | "v"])[];
}
const NEAR: Network = {
  nuclei: [
    [0.32 * Math.PI, 90],
    [-0.12 * Math.PI, 96],
    [0.22 * Math.PI, 138],
    [0.56 * Math.PI, 30],
    [0.08 * Math.PI, -10],
  ],
  routes: [
    [0, 1, "h"],
    [0, 2, "v"],
    [0, 3, "v"],
    [0, 4, "h"],
    [2, 1, "h"],
    [4, 3, "v"],
  ],
};
const FAR: Network = {
  nuclei: [
    [0.95 * Math.PI, 118],
    [0.6 * Math.PI, 132],
    [1.25 * Math.PI, 108],
    [0.05 * Math.PI, 146],
  ],
  routes: [
    [0, 1, "h"],
    [0, 2, "h"],
    [0, 3, "v"],
  ],
};
/** Face on, both hemispheres show their fronts and crowns: one network,
    mirrored, the hub on one side. */
const FRONT: Network = {
  nuclei: [
    [0.5 * Math.PI, 92],
    [0.3 * Math.PI, 20],
    [0.72 * Math.PI, 30],
    [0.34 * Math.PI, 136],
    [0.8 * Math.PI, 126],
  ],
  routes: [
    [0, 1, "v"],
    [0, 2, "v"],
    [0, 3, "h"],
    [3, 4, "h"],
    [1, 2, "h"],
  ],
};
/** How far a nucleus swells when a signal reaches it, and how far the hub
    stands swollen, in site steps. */
const REACH = 2.05;
const HUB_REACH = 3.8;

function buildField(o: MindOptions, px: number, dpr: number): Field {
  const view = o.view;
  const sides = sidesOf(o);
  const hulls = new Map<Side, Hull>();
  const light = lightVector(view, -1, 1.2, TOWARD);
  for (const s of sides) hulls.set(s, makeHull(s, { view, light, lightShape: { fold: LIGHT_FOLD } }));
  let x0 = Infinity;
  let x1 = -Infinity;
  for (const h of hulls.values())
    for (const row of h.vertices)
      for (const v of row) {
        x0 = Math.min(x0, v.xy[0]);
        x1 = Math.max(x1, v.xy[0]);
      }
  const lat = latticeFor(px, dpr, (x1 - x0) * (o.only ? 2 : 1));
  const box = brainIsoBox(view);
  const cx = (box.x0 + box.x1) / 2;
  const cy = (box.y0 + box.y1) / 2;
  const sx = lat.A / px;
  const sy = lat.B / px;
  const G = rasterise(o, hulls, lat, px, cx, cy);
  const ink = o.light ? INK_LIGHT : INK;
  const inkOf = (share: number) => mix(o.tones.ground, o.tones.ink, share);

  // nuclei first: their cells take no body dot
  const hub = hubSide(view);
  const nuclei: Nucleus[] = [];
  const nucleusAt = new Map<string, number>();
  const taken = new Set<number>();
  const seenAt = (side: Side, t: number, z: number) => {
    const s = hulls.get(side)!.at(t, z);
    if (!s.facing) return null;
    const [p, q] = siteOf(s.xy[0], s.xy[1], sx, sy, cx, cy);
    const k = cellOf(G, p, q);
    if (k < 0 || G.side[k] !== side || Math.abs(G.depth[k] - s.depth) > EDGE * 0.6) return null;
    return [p, q] as const;
  };
  const faceOn = Math.abs(Math.sin((view.azimuth * Math.PI) / 180)) < 0.2;
  const nets = new Map<Side, Network>(sides.map((side) => [side, faceOn ? FRONT : side === hub ? NEAR : FAR]));
  const nr = Math.ceil(HUB_REACH);
  for (const side of sides) {
    nets.get(side)!.nuclei.forEach(([t, z], n) => {
      const at = seenAt(side, t, z);
      if (!at) return;
      const [p, q] = at;
      const xs: number[] = [];
      const ys: number[] = [];
      const ds: number[] = [];
      for (let dq = -nr * 2; dq <= nr * 2; dq++) {
        for (let dp = -nr * 2; dp <= nr * 2; dp++) {
          if ((dp + dq) & 1) continue;
          const d = Math.hypot(dp * lat.A, dq * lat.B) / Math.hypot(lat.A, lat.B);
          if (d > (side === hub && n === 0 ? HUB_REACH : REACH)) continue;
          const c = cellOf(G, p + dp, q + dq);
          if (c < 0 || G.side[c] !== side) continue;
          // the core takes no body dot; the rings cover theirs when lit
          if (d < 1.01) taken.add(c);
          xs.push(Math.round((p + dp) * lat.A));
          ys.push(Math.round((q + dq) * lat.B));
          ds.push(d);
        }
      }
      nucleusAt.set(`${side}:${n}`, nuclei.length);
      nuclei.push({ x: Int32Array.from(xs), y: Int32Array.from(ys), d: Float32Array.from(ds), hub: side === hub && n === 0 });
    });
  }

  // the routes: (u, w) polylines, level, plumb or 45°, wrapped onto the hull
  // and snapped to the lattice, site by site
  const runs: Run[] = [];
  const files = new Set<number>();
  for (const side of sides) {
    const hull = hulls.get(side)!;
    const net = nets.get(side)!;
    net.routes.forEach(([a, b, first], n) => {
      const from = nucleusAt.get(`${side}:${a}`);
      const to = nucleusAt.get(`${side}:${b}`);
      if (from === undefined || to === undefined) return;
      const A = [net.nuclei[a][0] * T_UNIT, net.nuclei[a][1]] as const;
      const Bp = [net.nuclei[b][0] * T_UNIT, net.nuclei[b][1]] as const;
      const pts = elbow(A, Bp, first, Math.min(Math.abs(Bp[0] - A[0]), Math.abs(Bp[1] - A[1])));
      const xs: number[] = [];
      const ys: number[] = [];
      const seen: number[] = [];
      let last = "";
      for (let i = 0; i < pts.length - 1; i++) {
        const [u0, w0] = pts[i];
        const [u1, w1] = pts[i + 1];
        const steps = Math.max(1, Math.ceil(Math.hypot(u1 - u0, w1 - w0) / 0.5));
        for (let k = i ? 1 : 0; k <= steps; k++) {
          const u = u0 + ((u1 - u0) * k) / steps;
          const w = w0 + ((w1 - w0) * k) / steps;
          const s = hull.at(u / T_UNIT, w);
          const [p, q] = siteOf(s.xy[0], s.xy[1], sx, sy, cx, cy);
          const key = `${p},${q}`;
          if (key === last) continue;
          last = key;
          const c = cellOf(G, p, q);
          const ok = s.facing && c >= 0 && G.side[c] === side && Math.abs(G.depth[c] - s.depth) < EDGE * 0.6;
          if (ok && !taken.has(c)) files.add(c);
          xs.push(Math.round(p * lat.A));
          ys.push(Math.round(q * lat.B));
          seen.push(ok ? 1 : 0);
        }
      }
      if (xs.length < 4) return;
      runs.push({ x: Int32Array.from(xs), y: Int32Array.from(ys), seen: Uint8Array.from(seen), from, to, phase: hash2(n, side + 3, 41), rest: Math.round(xs.length * (0.15 + 0.3 * hash2(n, side + 3, 43))) });
    });
  }

  // the body: every covered site, its size its light
  const dots: { x: number; y: number; size: number; colour: string }[] = [];
  const rimColour = inkOf(RIM);
  const fileColours = ink.map((share) => inkOf(Math.min(1, share + FILE_LIFT)));
  const bodyColours = ink.map(inkOf);
  for (let q = G.q0; q < G.q0 + G.h; q++) {
    for (let p = G.p0 + (((G.p0 + q) % 2) + 2) % 2; p < G.p0 + G.w; p += 2) {
      const k = cellOf(G, p, q);
      const side = G.side[k];
      if (!side || taken.has(k)) continue;
      // the silhouette, the near hemisphere's edge over the far one and a
      // fold's edge over what it hides are rims; the far hemisphere keeps a
      // site clear of the near one's edge, so the fissure reads
      let rim = false;
      let gap = false;
      for (const [dp, dq] of [
        [1, 1],
        [-1, 1],
        [1, -1],
        [-1, -1],
      ] as const) {
        const n = cellOf(G, p + dp, q + dq);
        if (n < 0 || !G.side[n]) rim = true;
        else if (G.side[n] !== side) {
          if (G.depth[n] < G.depth[k]) rim = true;
          else gap = true;
        } else if (G.depth[n] < G.depth[k] - EDGE) rim = true;
      }
      if (gap && !rim) continue;
      const x = Math.round(p * lat.A);
      const y = Math.round(q * lat.B);
      if (rim) {
        dots.push({ x, y, size: lat.sizes[1], colour: rimColour });
        continue;
      }
      // the smooth light, the folds a gentle swell on it; one density map in
      // both themes, so the object is the same object on paper
      const lit = Math.min(1, Math.max(0, (G.lit[k] - LO) / (HI - LO) + FOLDS * foldAt(G.t[k], G.z[k])));
      const level = lit ** CURVE * 4;
      // dithered between tiers in the lattice's own axes, so a gradient
      // never bands
      const tier = Math.min(4, Math.floor(level) + (bayer((p + q) >> 1, (q - p) >> 1) < level - Math.floor(level) ? 1 : 0));
      // a route's file: never smaller than the field round it, always
      // brighter, so the trace reads in the light and in the shadow
      if (files.has(k)) {
        const ft = Math.max(2, tier);
        dots.push({ x, y, size: lat.sizes[ft - 1], colour: fileColours[ft - 1] });
        continue;
      }
      if (tier <= 0) continue;
      dots.push({ x, y, size: lat.sizes[tier - 1], colour: bodyColours[tier - 1] });
    }
  }

  // packed by colour, so a prerender changes paint rarely
  dots.sort((a, b) => (a.colour < b.colour ? -1 : a.colour > b.colour ? 1 : 0));
  const body: Body = { x: Int32Array.from(dots.map((d) => d.x)), y: Int32Array.from(dots.map((d) => d.y)), size: Uint8Array.from(dots.map((d) => d.size)), colour: dots.map((d) => d.colour) };
  return { lat, cx, cy, body, canvas: null, ox: 0, oy: 0, runs, nuclei, palette: paletteOf(o.tones) };
}

/** The body painted once into a canvas of its own, at whole device pixels;
    null where no canvas can be made (the field is then painted dot by dot). */
function prerender(F: Field): CanvasImageSource | null {
  const { body, lat } = F;
  if (!body.x.length) return null;
  const pad = lat.sizes[4] + 2;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < body.x.length; i++) {
    minX = Math.min(minX, body.x[i]);
    minY = Math.min(minY, body.y[i]);
    maxX = Math.max(maxX, body.x[i]);
    maxY = Math.max(maxY, body.y[i]);
  }
  const W = maxX - minX + pad * 2;
  const H = maxY - minY + pad * 2;
  const canvas = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(W, H) : typeof document !== "undefined" ? Object.assign(document.createElement("canvas"), { width: W, height: H }) : null;
  const c2 = canvas?.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null | undefined;
  if (!canvas || !c2) return null;
  F.ox = pad - minX;
  F.oy = pad - minY;
  bodyDots(c2, F, F.ox, F.oy);
  return canvas;
}

function bodyDots(c2: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, F: Field, ox: number, oy: number) {
  const { body } = F;
  let colour = "";
  for (let i = 0; i < body.x.length; i++) {
    if (body.colour[i] !== colour) {
      colour = body.colour[i];
      c2.fillStyle = colour;
    }
    const s = body.size[i];
    c2.fillRect(body.x[i] + ox - (s >> 1), body.y[i] + oy - (s >> 1), s, s);
  }
}

// ─── the clock ──────────────────────────────────────────────────────────────

/** One frame: the body, the nuclei and the signals walking. */
function paintField(ctx: CanvasRenderingContext2D, F: Field, t: number) {
  const m = ctx.getTransform();
  const ax = Math.round(m.e + F.cx * m.a);
  const ay = Math.round(m.f + F.cy * m.d);
  const { sizes } = F.lat;
  const P = F.palette;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (F.canvas === null) F.canvas = prerender(F) ?? false;
  if (F.canvas) ctx.drawImage(F.canvas, ax - F.ox, ay - F.oy);
  else bodyDots(ctx, F, ax, ay);
  const dot = (x: number, y: number, size: number, colour: string) => {
    ctx.fillStyle = P.ground;
    ctx.fillRect(ax + x - (sizes[4] >> 1), ay + y - (sizes[4] >> 1), sizes[4], sizes[4]);
    ctx.fillStyle = colour;
    ctx.fillRect(ax + x - (size >> 1), ay + y - (size >> 1), size, size);
  };

  // each run's signal, and when it last arrived
  const glow = new Float32Array(F.nuclei.length);
  for (const r of F.runs) {
    const n = r.x.length;
    const period = n + r.rest;
    const pos = (((t * PACE + r.phase * period) % period) + period) % period;
    const since = (pos >= n - 1 ? pos - (n - 1) : pos + period - (n - 1)) / PACE;
    glow[r.to] = Math.max(glow[r.to], Math.max(0, 1 - since / AFTERGLOW));
    const head = Math.floor(pos);
    for (const [back, tier, share] of COMET) {
      const i = head - back;
      if (i < 0 || i >= n || !r.seen[i]) continue;
      dot(r.x[i], r.y[i], sizes[tier], P.gold[share]);
    }
  }
  // a nucleus swells as a signal reaches it, size falling off from its core
  // the way the swarm's layer swells to its hot core; the hub stays swollen
  // and its core is the lit tone
  F.nuclei.forEach((nu, i) => {
    const level = nu.hub ? 1 : glow[i];
    const reach = nu.hub ? HUB_REACH : 1.01 + (REACH - 1.01) * level;
    for (let c = 0; c < nu.x.length; c++) {
      const d = nu.d[c];
      if (d > reach + 1e-3) continue;
      const core = d < 0.01;
      const ring = d < 1.01;
      // the hub: a hot core in the lit tone, swollen rings of gold; any
      // other nucleus stays a size under it however bright it gets
      const tier = nu.hub ? (ring ? 4 : d < 2.01 ? 3 : d < 2.71 ? 2 : 1) : core ? 3 : ring ? (level > 0.4 ? 2 : 1) : 1;
      const tenths = nu.hub ? (ring ? 10 : d < 2.01 ? 9 : d < 2.71 ? 7 : 5) : core ? 8 + 2 * level : ring ? 5 + 4 * level : 4 + 3 * level;
      dot(nu.x[c], nu.y[c], sizes[tier], nu.hub && core ? P.lit : P.gold[Math.round(tenths)]);
    }
  });
  ctx.restore();
}

// ─── the direction ──────────────────────────────────────────────────────────

function live(o: MindOptions): MindLive {
  let field: Field | null = null;
  let key = "";
  return {
    over(ctx, t, px) {
      const dpr = Math.min(2, typeof window === "undefined" ? 1 : window.devicePixelRatio || 1);
      const k = `${px.toFixed(4)}:${dpr}`;
      if (!field || k !== key) {
        field = buildField(o, px, dpr);
        key = k;
      }
      paintField(ctx, field, t);
    },
  };
}

export const signalField: MindDirection = {
  id: "d6",
  round: 1,
  name: "Signal Field",
  line: "The brain as square particles on one lattice, each sized by the light, with gold signals walking level and plumb routes between a few nuclei.",
  // the dots live on the canvas (`live`), snapped to the device grid; the
  // picture itself is the kit's sheet over the act's box and nothing else
  svg: ({ view = BRAIN_VIEW_ISO, light, tones }) => mindSvg({ view, light, tones, body: `<g class="mm-signal-field"></g>` }),
  live,
};
