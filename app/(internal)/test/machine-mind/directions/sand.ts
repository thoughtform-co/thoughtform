import { BRAIN_VIEW_ISO, brainIsoBox, type BrainIsoBox, type BrainView } from "@/components/arcs/figures/foundation/brainIso";
import { depthOf, iso, type Flat } from "@/components/arcs/figures/foundation/isoKit";
import { bundle, type Pt } from "@/components/xb-proposal/kit/trace";
import { add3, dot3, makeHull, mindSvg, mix, mul3, occluder, paintOrder, seen, sidesFarFirst, sub3, T_UNIT, unit3, viewVector, type Hull, type Side, type V3 } from "../hull";
import { cd, clip, flat, foldedFacets, indexIn, keyOf, rng, sandLive, split, type Cut } from "./sand.parts";
import type { MindDirection, MindOptions } from "./types";

/**
 * D5 · Sand (machine-mind lab, 2026-10-17). The hero's machine head, as the
 * brain: one smooth hull of layered sediment in one hard raking key from the
 * right, most of it in shadow, the light read off a smoother turned form so
 * it sweeps the dome and the strata carry the texture. Strata are engraved
 * at irregular spacing; the dark flank wears back from the windward
 * silhouette, bed by bed, to the gold circuitry the sediment was laid down
 * over, the die the one lit part, and the traces run out to the edge where
 * the stone breaks into level raster and drifting sand. On the lit side two
 * hairline seams of gold glint through cracks in the strata. The base sits
 * in a dust plain of the same grain (the live layer, `sand.parts.ts`).
 *
 * Owner, 2026-10-17: "transistors … are made from silicon, which is also
 * sand … that transistor metal, gold, beautifully blended with the more
 * sandy, stone-like aesthetic."
 */

// ─── seeded randomness ──────────────────────────────────────────────────────

function hash2(ix: number, iy: number, seed: number): number {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(seed, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Smooth value noise along one axis, −1 … 1. */
function noise1(x: number, seed: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const s = f * f * (3 - 2 * f);
  const a = hash2(i, 0, seed);
  const b = hash2(i + 1, 0, seed);
  return (a + (b - a) * s) * 2 - 1;
}

const TAU = Math.PI * 2;
const wrap = (a: number) => a - TAU * Math.round(a / TAU);

// ─── the strata ─────────────────────────────────────────────────────────────

interface Stratum {
  z: number;
  /** A parting: drawn heavier. */
  heavy: boolean;
}

/** Level lines laid down at irregular spacing: runs of fine beds, then a wide
    one, now and then a heavier parting. */
const STRATA: Stratum[] = (() => {
  const r = rng(29);
  const out: Stratum[] = [];
  let z = -52;
  for (;;) {
    const roll = r();
    z += roll < 0.4 ? 2.4 + r() * 1.8 : roll < 0.78 ? 5 + r() * 4 : 10 + r() * 7;
    if (z >= 142) break;
    out.push({ z, heavy: r() < 0.16 });
  }
  return out;
})();
const STRATA_Z = STRATA.map((s) => s.z);
const bedOf = (z: number) => indexIn(z, STRATA_Z);

/** Each bed's tint, −2 … 2, never two the same in a row. */
const BED_TINT: number[] = (() => {
  const r = rng(41);
  const out: number[] = [];
  for (let i = 0; i <= STRATA.length; i++) {
    let k = Math.floor(r() * 5) - 2;
    if (i && k === out[i - 1]) k = k >= 2 ? k - 1 : k + 1;
    out.push(k);
  }
  return out;
})();

// ─── the erosion ────────────────────────────────────────────────────────────

/** Where the stone has worn away: the near hemisphere's dark flank (its
    lateral side, screen left in both cameras), worn back from the windward
    silhouette, so the stone breaks open exactly where it dissolves into
    raster and the traces under it run out into the streaks. Sediment breaks
    along its bedding: each bed between two strata wears back by its own
    amount, so the worn area's top and bottom are level steps on the strata
    and its far edge a run of short fractures. In (u, w) round that
    hemisphere. */
const ERODE = { side: -1 as Side };

/** The worn area as two lobes, both open past the silhouette (`FAR`): a
    main band low on the flank reaching in toward the light, and a shorter
    one climbing the windward edge. */
const snap = (z: number) => STRATA_Z.reduce((a, s) => (Math.abs(s - z) < Math.abs(a - z) ? s : a));
const FAR = -175;
const LOBES = [
  { lo: snap(24), hi: snap(86), uc: -34, reach: 110, p: 0.9 },
  { lo: snap(62), hi: snap(110), uc: -78, reach: 58, p: 0.8 },
];

interface BedCut {
  /** How far this bed reaches past the worn area's outline, u. */
  dr: number;
  seed: number;
}

/** The worn area's far edge at height z, before any bed's own offset: the
    furthest of the lobes there, each drawing back bed by bed toward its
    partings, so its top and bottom edges are level. */
const Z_LO = Math.min(...LOBES.map((l) => l.lo));
const Z_HI = Math.max(...LOBES.map((l) => l.hi));
function envelopeAt(z: number): [number, number] | null {
  let right = -Infinity;
  LOBES.forEach((lobe, i) => {
    if (z <= lobe.lo || z >= lobe.hi) return;
    const k = (2 * (z - lobe.lo)) / (lobe.hi - lobe.lo) - 1;
    const f = Math.sqrt(1 - Math.abs(k) ** 2.4);
    // the far edge wanders, slowly, as a fracture does
    const wr = 1 + 0.14 * noise1(z / 13 + 5.1 + i * 7, 67);
    right = Math.max(right, lobe.uc + lobe.reach * f ** lobe.p * wr);
  });
  return Number.isFinite(right) ? [FAR, right] : null;
}

const CUTS: (BedCut | null)[] = (() => {
  const r = rng(53);
  const zs = [-60, ...STRATA_Z, 150];
  const cuts = zs.slice(0, -1).map((z0, j) => {
    const z1 = zs[j + 1];
    const zm = (z0 + z1) / 2;
    const dr = (r() * 2 - 1) * 8;
    if (!envelopeAt(zm)) return null;
    return { dr, seed: 100 + j, thin: z1 - z0 < 4.6 };
  });
  // a thin bed never stands proud of both its neighbours: a sliver of stone
  // reaching into the worn area reads as a stray line, not as sediment
  return cuts.map((c, j) => {
    if (!c) return null;
    const a = cuts[j - 1];
    const b = cuts[j + 1];
    if (!c.thin || !a || !b) return { dr: c.dr, seed: c.seed };
    return { dr: Math.max(c.dr, Math.min(a.dr, b.dr)), seed: c.seed };
  });
})();

/** u round the eroded hemisphere, continuous across the window. */
const uOf = (t: number) => wrap(t - 0.2) * T_UNIT + 0.2 * T_UNIT;

/** The worn area's near and far edge in bed `j` at height z: the outline,
    the bed's own offset, a little grain. */
function edgesAt(j: number, z: number): [number, number] | null {
  const c = CUTS[j];
  const env = envelopeAt(z);
  if (!c || !env) return null;
  return [env[0], env[1] + c.dr + 1.1 * noise1(z / 1.8, c.seed + 7)];
}

/** Inside the window, positive; its edge is the zero. */
function erosionAt(j: number, t: number, z: number): number {
  const e = edgesAt(j, z);
  if (!e) return -1;
  const u = uOf(t);
  return Math.min(u - e[0], e[1] - u) / 6;
}

// ─── the tones ──────────────────────────────────────────────────────────────

interface SandTones {
  /** lit → stone, piecewise linear. */
  stone: readonly (readonly [number, string])[];
  /** The worn-out window's floor, dark to its own lit. */
  core: readonly [string, string];
  /** A bed's tint moves the stone toward these. */
  paler: string;
  darker: string;
  /** The engraved line, mixed into the stone it is cut in. */
  groove: string;
  edge: string;
  trace: string;
  die: string;
  dieSide: string;
  dieLow: string;
}

const SAND: Record<"dark" | "light", SandTones> = {
  // white layered sediment in one warm key: deep warm black to dry chalky bone
  dark: {
    stone: [
      [-1, "#13110e"],
      [-0.04, "#171410"],
      [0.05, "#2a231b"],
      [0.18, "#4f4334"],
      [0.36, "#857560"],
      [0.56, "#b2a287"],
      [0.78, "#d1c3a8"],
      [1, "#ddd0b7"],
    ],
    core: ["#060505", "#17130e"],
    paler: "#f2e5c8",
    darker: "#050404",
    groove: "#0a0806",
    // the silhouette in shadow, a breath above the ground, so the dark dome
    // keeps its outline
    edge: "#3a3229",
    trace: "#caa554",
    die: "#f0c86a",
    dieSide: "#9a7a33",
    dieLow: "#5e4a1f",
  },
  // the hero's light plate: the stone turns to matte basalt on pale sand
  light: {
    stone: [
      [-1, "#1c1915"],
      [-0.04, "#211d18"],
      [0.05, "#2f2a23"],
      [0.18, "#433c33"],
      [0.36, "#5b5348"],
      [0.56, "#756b5e"],
      [0.78, "#8d8375"],
      [1, "#9a9082"],
    ],
    core: ["#0a0908", "#1a1713"],
    paler: "#c2b59b",
    darker: "#000000",
    groove: "#050403",
    edge: "#0e0c0a",
    trace: "#a8862f",
    die: "#d9b65c",
    dieSide: "#9a7a33",
    dieLow: "#5e4a1f",
  },
};

/** The stone's bands on light · normal: one flat shadow, then fine steps
    through the terminator so the turn reads smooth. */
const STONE_BANDS = [-0.03, 0.01, 0.05, 0.09, 0.13, 0.18, 0.23, 0.29, 0.35, 0.42, 0.49, 0.57, 0.65, 0.73, 0.82];
const CORE_BANDS = [0, 0.2, 0.45];

function stoneAt(keys: SandTones["stone"], s: number): string {
  if (s <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (s <= keys[i][0]) {
      const [s0, c0] = keys[i - 1];
      const [s1, c1] = keys[i];
      return mix(c0, c1, (s - s0) / (s1 - s0));
    }
  }
  return keys[keys.length - 1][1];
}

/** A band's lit value: its middle (the shadow band, its top). */
function bandMid(bands: readonly number[], b: number): number {
  if (b === 0) return bands[0] - 0.02;
  if (b >= bands.length) return Math.min(1, bands[bands.length - 1] + 0.1);
  return (bands[b - 1] + bands[b]) / 2;
}

interface Palette {
  /** stone[band][bed tint + 2] */
  stone: string[][];
  core: string[];
  wall: string[];
  /** groove[band][heavy] */
  groove: string[][];
  tones: SandTones;
}

const palettes = new Map<boolean, Palette>();
function paletteOf(light: boolean): Palette {
  const known = palettes.get(light);
  if (known) return known;
  const T = SAND[light ? "light" : "dark"];
  const n = STONE_BANDS.length;
  const base = Array.from({ length: n + 1 }, (_, b) => stoneAt(T.stone, bandMid(STONE_BANDS, b)));
  // a bed's tint shows as the stone takes the light; in the shadow it is a
  // breath, so the dark stays dark
  // basalt shows its beds in the dark as well: on paper the dark is the
  // figure, not the void
  const floor = light ? 0.55 : 0.25;
  const tint = light ? 0.065 : 0.04;
  const stone = base.map((c, b) => {
    const amp = floor + (1 - floor) * (b / n);
    return [-2, -1, 0, 1, 2].map((k) => (k > 0 ? mix(c, T.paler, tint * k * amp) : k < 0 ? mix(c, T.darker, 0.08 * -k * amp) : c));
  });
  const core = Array.from({ length: CORE_BANDS.length + 1 }, (_, b) => mix(T.core[0], T.core[1], b / CORE_BANDS.length));
  // a groove reads where the stone is lit, and fades with it
  const groove = base.map((c, b) => {
    const k = Math.min(1, Math.max(light ? 0.45 : 0, (b - 1) / 4));
    return [mix(c, T.groove, 0.36 * k), mix(c, T.groove, 0.58 * k)];
  });
  const p: Palette = { stone, core, wall: base, groove, tones: T };
  palettes.set(light, p);
  return p;
}

// ─── one hemisphere's geometry (theme free, cached per pose) ────────────────

interface Piece {
  /** "s" stone, "c" the window's floor. */
  kind: "s" | "c";
  band: number;
  bed: number;
  d: string;
  folded: boolean;
}
interface Wall {
  band: number;
  d: string;
}
interface Groove {
  band: number;
  heavy: boolean;
  pts: Flat[];
}

interface Circuit {
  traces: Flat[][];
  /** Where a trace runs out over the silhouette: the raster takes it on. */
  exits: Flat[];
  pins: Flat[][];
  vias: { ring: Flat[]; hole: Flat[] }[];
  die: { top: Flat[] | null; seal: Flat[] | null; sides: { band: number; d: string }[] };
}

interface Geometry {
  h: Hull;
  pieces: Piece[];
  walls: Wall[];
  grooves: Groove[];
  circuit: Circuit | null;
  edge: string;
  veins: Vein[];
}

/** Below this the hull stands in the drift: not painted, the sand drawn
    over where it was. */
const Z_BURY = -50;

/** The hull's silhouette above the drift (`silhouetteD`, less the buried
    rows). */
function edgeAbove(h: Hull, zMin: number, open: (t: number, z: number) => boolean): string {
  const C = h.cols;
  const R = h.zs.length - 1;
  const F = (r: number, c: number) => h.facets[r * C + ((c + C) % C)];
  const hidden = occluder(h);
  const segs: Flat[][] = [];
  const seg = (a: { xy: Flat; w: V3; t: number; z: number }, b: { xy: Flat; w: V3; t: number; z: number }) => {
    if (open(a.t, (a.z + b.z) / 2) || open(b.t, (a.z + b.z) / 2)) return;
    const mid: Flat = [(a.xy[0] + b.xy[0]) / 2, (a.xy[1] + b.xy[1]) / 2];
    if (!hidden(mid, depthOf(mul3(add3(a.w, b.w), 0.5), h.P))) segs.push([a.xy, b.xy]);
  };
  for (let r = 0; r < R; r++) {
    if (h.zs[r] < zMin) continue;
    for (let c = 0; c < C; c++) {
      const f = F(r, c);
      if (f.facing !== F(r, c + 1).facing) seg(f.v[1], f.v[2]);
      if (r + 1 < R && f.facing !== F(r + 1, c).facing) seg(f.v[3], f.v[2]);
    }
  }
  return segs.map((q) => cd(q, false)).join("");
}

/** The depth of the stone the window is cut through, brain units. */
const WALL = 1.8;

const geometries = new Map<string, Geometry>();

export function hullOf(side: Side, view: BrainView): Hull {
  return geometryOf(side, view).h;
}

/** Where the traces run out over the silhouette, in picture units. */
export function exitsOf(side: Side, view: BrainView): Flat[] {
  return geometryOf(side, view).circuit?.exits ?? [];
}

function geometryOf(side: Side, view: BrainView): Geometry {
  const key = `${side}:${view.azimuth}:${view.elevation}`;
  const known = geometries.get(key);
  if (known) return known;
  const L = keyOf(view);
  const V = viewVector(view);
  // the light read off a smoother turned form, so the key sweeps the dome in
  // long bands and the strata carry the texture; the drawn shape stays real
  const h = makeHull(side, { view, light: L, lightShape: { fold: 0.3 } });
  const eroded = side === ERODE.side;
  const order = paintOrder(h);
  const folded = foldedFacets(h, order);

  // the stone and the window's floor, facet by facet, back to front; each
  // facet cut first on the strata, so a bed's own cut applies inside it
  const pieces: Piece[] = [];
  const breaks: { a: Cut; b: Cut; bed: number }[] = [];
  for (const f of order) {
    const t0 = f.v[0].t;
    const poly: Cut[] = f.v.map((v) => {
      let t = v.t;
      if (t - t0 > Math.PI) t -= TAU;
      if (t0 - t > Math.PI) t += TAU;
      return { x: v.xy[0], y: v.xy[1], s: v.lit, z: v.z, e: -1, t };
    });
    const fold = folded.has(f);
    // the foot of the belly is buried in the drift (the live layer's sand)
    if (poly.every((p) => p.z <= Z_BURY)) continue;
    const above = poly.some((p) => p.z < Z_BURY) ? clip(poly, "z", Z_BURY, true) : poly;
    if (above.length < 3) continue;
    for (const bed of split(above, "z", STRATA_Z)) {
      let stone = bed.pts;
      let core: Cut[] = [];
      if (eroded && CUTS[bed.i]) {
        const cutPoly = bed.pts.map((p) => ({ ...p, e: erosionAt(bed.i, p.t, p.z), edge: false }));
        stone = clip(cutPoly, "e", 0, false);
        core = clip(cutPoly, "e", 0, true);
      }
      if (core.length >= 3) for (const p of split(core, "s", CORE_BANDS)) pieces.push({ kind: "c", band: p.i, bed: bed.i, d: cd(flat(p.pts), true), folded: fold });
      if (stone.length >= 3) {
        for (const p of split(stone, "s", STONE_BANDS)) pieces.push({ kind: "s", band: p.i, bed: bed.i, d: cd(flat(p.pts), true), folded: fold });
        if (core.length >= 3) {
          for (let i = 0; i < stone.length; i++) {
            const a = stone[i];
            const b = stone[(i + 1) % stone.length];
            if (a.edge && b.edge && (a.x !== b.x || a.y !== b.y)) breaks.push({ a, b, bed: bed.i });
          }
        }
      }
    }
  }

  const o = iso([0, 0, 0], h.P);
  const sinkOf = (n: V3): Flat => {
    const s = iso(mul3(n, -WALL), h.P);
    return [s[0] - o[0], s[1] - o[1]];
  };
  const walls: Wall[] = [];

  // the fractures within a bed: the stone's broken face, where it faces the
  // viewer (the window's far side), lit by its own normal
  for (const { a, b, bed } of breaks) {
    const tm = (a.t + b.t) / 2;
    const zm = (a.z + b.z) / 2;
    const s = h.at(tm, zm);
    if (!seen(h, s)) continue;
    const along = sub3(h.at(b.t, b.z).w, h.at(a.t, a.z).w);
    let n = unit3([s.n[1] * along[2] - s.n[2] * along[1], s.n[2] * along[0] - s.n[0] * along[2], s.n[0] * along[1] - s.n[1] * along[0]]);
    // toward the window: along the erosion's gradient on the surface
    const dt = 0.003;
    const dz = 0.2;
    const Pt = sub3(h.at(tm + dt, zm).w, h.at(tm - dt, zm).w);
    const Pz = sub3(h.at(tm, zm + dz).w, h.at(tm, zm - dz).w);
    const Et = erosionAt(bed, tm + dt, zm) - erosionAt(bed, tm - dt, zm);
    const Ez = erosionAt(bed, tm, zm + dz) - erosionAt(bed, tm, zm - dz);
    const grad = add3(mul3(Pt, Et / Math.max(1e-9, dot3(Pt, Pt))), mul3(Pz, Ez / Math.max(1e-9, dot3(Pz, Pz))));
    if (dot3(n, grad) < 0) n = mul3(n, -1);
    if (dot3(n, V) <= 0.02) continue;
    const [dx, dy] = sinkOf(s.n);
    walls.push({ band: indexIn(dot3(n, L), STONE_BANDS), d: cd([[a.x, a.y], [b.x, b.y], [b.x + dx, b.y + dy], [a.x + dx, a.y + dy]], true) });
  }

  // the steps on the bedding: where one bed is cut back further than the
  // next, the lower one's top (facing up) or the upper one's underside
  if (eroded) {
    for (let j = 0; j < STRATA.length; j++) {
      const z = STRATA_Z[j];
      const below = edgesAt(j, z);
      const above = edgesAt(j + 1, z);
      if (!below && !above) continue;
      const runs: { u0: number; u1: number; up: boolean }[] = [];
      const gap = (x: [number, number] | null, y: [number, number] | null, up: boolean) => {
        // where `y` is cut and `x` is not
        if (!y) return;
        if (!x) {
          runs.push({ u0: y[0], u1: y[1], up });
          return;
        }
        if (y[0] < x[0]) runs.push({ u0: y[0], u1: Math.min(y[1], x[0]), up });
        if (y[1] > x[1]) runs.push({ u0: Math.max(y[0], x[1]), u1: y[1], up });
      };
      gap(below, above, true);
      gap(above, below, false);
      for (const run of runs) {
        if (run.u1 - run.u0 < 0.3) continue;
        const n = Math.max(1, Math.ceil((run.u1 - run.u0) / 1.2));
        let strip: Flat[] = [];
        let band = -1;
        const flush = () => {
          if (strip.length > 1) {
            const [dx, dy] = strip.length ? sinkOf(h.at(uToT(run.u0), z).n) : [0, 0];
            walls.push({ band, d: cd([...strip, ...strip.map(([x, y]): Flat => [x + dx, y + dy]).reverse()], true) });
          }
          strip = [];
        };
        for (let k = 0; k <= n; k++) {
          const u = run.u0 + ((run.u1 - run.u0) * k) / n;
          const s = h.at(uToT(u), z);
          const dz = 0.3;
          let face = unit3(sub3(h.at(uToT(u), z + dz).w, h.at(uToT(u), z - dz).w));
          if (!run.up) face = mul3(face, -1);
          const ok = seen(h, s) && dot3(face, V) > 0.02;
          const b = indexIn(dot3(face, L), STONE_BANDS);
          if (!ok) {
            flush();
            band = -1;
            continue;
          }
          if (b !== band && strip.length) {
            strip.push(s.xy);
            flush();
          }
          band = b;
          strip.push(s.xy);
        }
        flush();
      }
    }
  }

  // the strata, engraved: each level line wrapped on the hull, its tone the
  // stone's where it runs, and never across the window
  const grooves: Groove[] = [];
  const step = 0.02;
  for (let j = 0; j < STRATA.length; j++) {
    const st = STRATA[j];
    if (st.z < Z_BURY + 1) continue;
    let run: Flat[] = [];
    let band = -1;
    const flush = () => {
      if (run.length > 1) grooves.push({ band, heavy: st.heavy, pts: run });
      run = [];
    };
    for (let t = 0; t <= TAU + 1e-9; t += step) {
      const cut = eroded && (erosionAt(j, t, st.z) > -0.05 || erosionAt(j + 1, t, st.z) > -0.05);
      const s = cut ? null : h.at(t, st.z);
      if (!s || !seen(h, s)) {
        flush();
        band = -1;
        continue;
      }
      const b = indexIn(s.lit, STONE_BANDS);
      if (b !== band && run.length) {
        run.push(s.xy);
        flush();
      }
      band = b;
      run.push(s.xy);
    }
    flush();
  }

  const geo: Geometry = { h, pieces, walls, grooves, circuit: eroded ? circuitOf(h, L, V) : null, edge: edgeAbove(h, Z_BURY, (t, z) => eroded && erosionAt(bedOf(z), t, z) > -0.4), veins: veinsOf(h, side) };
  geometries.set(key, geo);
  return geo;
}

/** t at a u on the eroded hemisphere (inverse of `uOf` near the window). */
const uToT = (u: number) => u / T_UNIT;



// ─── gold in the stone ──────────────────────────────────────────────────────

/** The bed the near hemisphere's lit-side vein runs along: the right
    bundle's top trace goes on under the lit stone at this height and glints
    through the cracks in it. */
const VEIN_W = snap(50);

/** Hairline seams of gold along a bed on the lit side, showing only where
    the strata have cracked open: the gold IN the stone, not only behind the
    worn window. Each glint fades into the stone at the ends it does not
    share with the window's edge. */
const VEINS: { side: Side; w: number; u0: number; u1: number; seed: number; open: number }[] = [
  { side: -1, w: VEIN_W, u0: 62, u1: 300, seed: 5, open: -0.18 },
  // on the far hemisphere one long seam across its lit face, closing at
  // both ends
  { side: 1, w: snap(84), u0: 96, u1: 232, seed: 9, open: -0.75 },
];

interface Vein {
  /** The crack: one dark hairline per open run, at the stone's band. */
  crack: { band: number; pts: Flat[] }[];
  /** The gold in it, in steps of how far it has come up (1 … 4). */
  glint: { band: number; level: number; pts: Flat[] }[];
}

function veinsOf(h: Hull, side: Side): Vein[] {
  return VEINS.filter((v) => v.side === side).map((v) => {
    const vein: Vein = { crack: [], glint: [] };
    let run: { xy: Flat; band: number; fromEdge: boolean }[] = [];
    let fromEdge = false;
    const flush = () => {
      if (run.length > 3) {
        const n = run.length - 1;
        const band = run[Math.floor(n / 2)].band;
        vein.crack.push({ band, pts: run.map((p) => p.xy) });
        const ramp = Math.max(2, n * 0.3);
        let piece: Flat[] = [];
        let level = -1;
        run.forEach((p, i) => {
          const rise = run[0].fromEdge ? 1 : Math.min(1, i / ramp);
          const lv = Math.round(4 * Math.min(rise, (n - i) / ramp));
          if (lv !== level && piece.length) {
            piece.push(p.xy);
            if (level > 0 && piece.length > 1) vein.glint.push({ band, level, pts: piece });
            piece = [];
          }
          level = lv;
          piece.push(p.xy);
        });
        if (level > 0 && piece.length > 1) vein.glint.push({ band, level, pts: piece });
      }
      run = [];
    };
    for (let u = v.u0; u <= v.u1; u += 0.8) {
      const s = h.at(uToT(u), v.w);
      const worn = side === ERODE.side && Math.max(erosionAt(bedOf(v.w - 0.01), uToT(u), v.w), erosionAt(bedOf(v.w + 0.01), uToT(u), v.w)) > -0.05;
      if (worn) {
        flush();
        fromEdge = true;
        continue;
      }
      // the crack is open where the bed has parted, and always where the
      // seam leaves the window
      const open = noise1(u / 17 + 0.7, v.seed) > v.open || (fromEdge && run.length && run.length < 14);
      if (!seen(h, s) || !open) {
        flush();
        fromEdge = false;
        continue;
      }
      if (!run.length) run.push({ xy: s.xy, band: indexIn(s.lit, STONE_BANDS), fromEdge });
      else run.push({ xy: s.xy, band: indexIn(s.lit, STONE_BANDS), fromEdge: false });
    }
    flush();
    return vein;
  });
}

// ─── the circuitry under the stone ──────────────────────────────────────────

/** The die, in (u, w) on the window's floor: a package standing `lift` proud,
    its top-right corner cut (the house's one notch). */
const DIE = { u: 4, w: 60, au: 11, aw: 8, pitch: 2.2, lift: 1.5, cut: 3.2 };

function fanout(): { bundles: Pt[][]; vias: Pt[] } {
  const { u: U, w: Wd, au, aw, pitch } = DIE;
  const out: Pt[][] = [];
  const vias: Pt[] = [];
  const nSide = 7;
  const nTop = 9;
  // left: level out of the die, a 45° climb, then level on into the upper
  // lobe toward the silhouette, under the stone where the window ends
  out.push(...bundle([[U - au + 1, Wd], [U - au - 7, Wd], [U - au - 19, Wd + 12], [U - 260, Wd + 12]], nSide, pitch));
  // right: level, a 45° drop, level on under the lit stone
  const drop = Wd - (VEIN_W - (pitch * (nSide - 1)) / 2);
  out.push(...bundle([[U + au - 1, Wd], [U + au + 8, Wd], [U + au + 8 + drop, Wd - drop], [U + 260, Wd - drop]], nSide, pitch));
  // top: plumb, then a 45° turn toward the windward edge and level on out
  // over it, a bed higher than the left bundle
  out.push(...bundle([[U, Wd + aw - 1], [U, Wd + aw + 10], [U - 18, Wd + aw + 28], [U - 300, Wd + aw + 28]], nTop, pitch));
  // bottom: plumb, a lean toward the front; three of its traces stop on
  // vias, staggered, the rest run on
  const bottom = bundle([[U, Wd - aw + 1], [U, Wd - aw - 4], [U + 10, Wd - aw - 14], [U + 10, Wd - 200]], nTop, pitch);
  bottom.forEach((tr, i) => {
    if (i < 3) {
      const stop = tr[2][1] - 3.5 - i * 2.8;
      const x = tr[2][0];
      out.push([tr[0], tr[1], tr[2], [x, stop]]);
      vias.push([x, stop - 1.6]);
    } else out.push(tr);
  });
  // a bus in from under the stone at the lower left, landing on vias
  for (let i = 0; i < 4; i++) {
    const w = Wd - 30 + i * pitch;
    const end = U - 22 + i * 3.2;
    out.push([[U - 260, w], [end, w]]);
    vias.push([end + 1.6, w]);
  }
  return { bundles: out, vias };
}

function insideCut(u: number, w: number, margin: number): boolean {
  return erosionAt(bedOf(w), uToT(u), w) > margin;
}

/** A round pad on the floor at (u, w): its outline, or null if not seen. */
function padAt(h: Hull, u: number, w: number, r: number, n: number): Flat[] | null {
  const pts: Flat[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const s = h.at(uToT(u + r * Math.cos(a)), w + r * Math.sin(a));
    if (!seen(h, s)) return null;
    pts.push(s.xy);
  }
  return pts;
}

/** How far the floor may turn from the viewer before a trace gives way to
    the raster (light · normal against the view, 0 at the silhouette). */
const GRAZE = 0.3;

function circuitOf(h: Hull, L: V3, V: V3): Circuit {
  const { bundles, vias } = fanout();
  const traces: Flat[][] = [];
  const pins: Flat[][] = [];
  const exits: Flat[] = [];
  for (const tr of bundles) {
    // the trace sampled on the floor: drawn where the stone is gone
    let run: Flat[] = [];
    const pin: Flat[] = [];
    for (let i = 0; i < tr.length - 1; i++) {
      const [u0, w0] = tr[i];
      const [u1, w1] = tr[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(u1 - u0, w1 - w0) / 0.8));
      for (let k = i ? 1 : 0; k <= n; k++) {
        const u = u0 + ((u1 - u0) * k) / n;
        const w = w0 + ((w1 - w0) * k) / n;
        const open = insideCut(u, w, 0.02);
        if (!open && !run.length) continue;
        const s = h.at(uToT(u), w);
        // a trace stops where the floor turns away to a grazing angle: past
        // there it would only bunch into the silhouette, and the raster
        // takes it on instead
        const graze = dot3(s.n, V) < GRAZE;
        if (open && !graze && seen(h, s)) {
          run.push(s.xy);
          // the lead: the first units out of the package
          const d = Math.max(Math.abs(u - DIE.u) - DIE.au, Math.abs(w - DIE.w) - DIE.aw);
          if (d < 3.2) pin.push(s.xy);
        } else if (run.length) {
          // still on the worn floor but past the edge of sight: the
          // silhouette, where the stone breaks into streaks
          if (open && graze) exits.push(run[run.length - 1]);
          if (run.length > 1) traces.push(run);
          run = [];
        }
      }
    }
    if (run.length > 1) traces.push(run);
    if (pin.length > 1) pins.push(pin);
  }
  const viaOut: Circuit["vias"] = [];
  for (const [u, w] of vias) {
    if (!insideCut(u, w, 0.3)) continue;
    const ring = padAt(h, u, w, 1.5, 14);
    const hole = padAt(h, u, w, 0.62, 10);
    if (ring && hole) viaOut.push({ ring, hole });
  }

  const lift = (u: number, w: number, by: number): Flat => {
    const s = h.at(uToT(u), w);
    return iso(add3(s.w, mul3(s.n, by)), h.P);
  };
  const { u: U, w: Wd, au, aw, cut } = DIE;
  const outline = (inset: number): Pt[] => [
    [U - au + inset, Wd - aw + inset],
    [U + au - inset, Wd - aw + inset],
    [U + au - inset, Wd + aw - inset - cut],
    [U + au - inset - cut, Wd + aw - inset],
    [U - au + inset, Wd + aw - inset],
  ];
  const sample = (ring: Pt[], by: number): Flat[] => {
    const pts: Flat[] = [];
    for (let i = 0; i < ring.length; i++) {
      const [u0, w0] = ring[i];
      const [u1, w1] = ring[(i + 1) % ring.length];
      const n = Math.max(1, Math.ceil(Math.hypot(u1 - u0, w1 - w0) / 1.2));
      for (let k = 0; k < n; k++) pts.push(lift(u0 + ((u1 - u0) * k) / n, w0 + ((w1 - w0) * k) / n, by));
    }
    return pts;
  };
  const centre = h.at(uToT(U), Wd);
  const sides: { band: number; d: string }[] = [];
  let top: Flat[] | null = null;
  let seal: Flat[] | null = null;
  if (seen(h, centre) && insideCut(U - au, Wd, 0.2) && insideCut(U + au, Wd, 0.2)) {
    const ring = outline(0);
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      const mid: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const out: Pt = [b[1] - a[1], -(b[0] - a[0])];
      const len = Math.hypot(out[0], out[1]) || 1;
      const p0 = h.at(uToT(mid[0]), mid[1]).w;
      const p1 = h.at(uToT(mid[0] + (out[0] / len) * 0.5), mid[1] + (out[1] / len) * 0.5).w;
      const nOut = unit3(sub3(p1, p0));
      if (dot3(nOut, V) <= 0) continue;
      const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 1.2));
      const lo: Flat[] = [];
      const hi: Flat[] = [];
      for (let k = 0; k <= n; k++) {
        const u = a[0] + ((b[0] - a[0]) * k) / n;
        const w = a[1] + ((b[1] - a[1]) * k) / n;
        lo.push(lift(u, w, 0));
        hi.push(lift(u, w, DIE.lift));
      }
      const lit = dot3(nOut, L);
      sides.push({ band: lit > 0.25 ? 2 : lit > 0 ? 1 : 0, d: cd([...lo, ...hi.reverse()], true) });
    }
    top = sample(ring, DIE.lift);
    seal = sample(outline(2.2), DIE.lift);
  }
  return { traces, exits, pins, vias: viaOut, die: { top, seal, sides } };
}

// ─── painting ───────────────────────────────────────────────────────────────

function hemisphereSvg(g: Geometry, P: Palette): string {
  const T = P.tones;
  const out: string[] = [];
  const colourOf = (p: Piece) => (p.kind === "c" ? P.core[Math.min(P.core.length - 1, p.band)] : P.stone[p.band][BED_TINT[p.bed] + 2]);
  const fillPath = (fill: string, d: string) => `<path fill="${fill}" stroke="${fill}" stroke-width=".35" stroke-linejoin="round" d="${d}"/>`;
  const inOrder = (list: Piece[]) => {
    let fill = "";
    let run = "";
    for (const p of list) {
      const c = colourOf(p);
      if (c !== fill) {
        if (run) out.push(fillPath(fill, run));
        fill = c;
        run = "";
      }
      run += p.d;
    }
    if (run) out.push(fillPath(fill, run));
  };

  // the surface: every piece that overlaps nothing gathered by tone, then the
  // folds strictly back to front
  const byTone = new Map<string, string>();
  for (const p of g.pieces) {
    if (p.folded) continue;
    const c = colourOf(p);
    byTone.set(c, (byTone.get(c) ?? "") + p.d);
  }
  for (const [c, d] of byTone) out.push(fillPath(c, d));
  inOrder(g.pieces.filter((p) => p.folded));

  // the circuitry on the window's floor
  const c = g.circuit;
  if (c) {
    if (c.traces.length) out.push(`<path fill="none" stroke="${T.trace}" stroke-width=".62" d="${c.traces.map((r) => cd(r, false)).join("")}"/>`);
    if (c.pins.length) out.push(`<path fill="none" stroke="${T.trace}" stroke-width="1.05" d="${c.pins.map((r) => cd(r, false)).join("")}"/>`);
    if (c.vias.length) {
      out.push(`<path fill="${T.trace}" d="${c.vias.map((v) => cd(v.ring, true)).join("")}"/>`);
      out.push(`<path fill="${P.core[0]}" d="${c.vias.map((v) => cd(v.hole, true)).join("")}"/>`);
    }
    for (const s of c.die.sides) {
      const col = [T.dieLow, T.dieSide, T.dieSide][s.band];
      out.push(fillPath(col, s.d));
    }
    if (c.die.top) out.push(fillPath(T.die, cd(c.die.top, true)));
    if (c.die.seal) out.push(`<path fill="none" stroke="${T.dieSide}" stroke-width=".45" d="${cd(c.die.seal, true)}"/>`);
  }

  // the stone's broken faces
  const byBand = new Map<number, string>();
  for (const w of g.walls) byBand.set(w.band, (byBand.get(w.band) ?? "") + w.d);
  for (const [band, d] of byBand) out.push(fillPath(P.wall[Math.min(P.wall.length - 1, band)], d));

  // the engraved strata
  const lines = new Map<string, string>();
  for (const gr of g.grooves) {
    const k = `${gr.band}:${gr.heavy ? 1 : 0}`;
    lines.set(k, (lines.get(k) ?? "") + cd(gr.pts, false));
  }
  for (const [k, d] of lines) {
    const [band, heavy] = k.split(":").map(Number);
    if (P.groove[band][heavy] === P.wall[band]) continue;
    out.push(`<path fill="none" stroke="${P.groove[band][heavy]}" stroke-width="${heavy ? 0.85 : 0.42}" stroke-linecap="round" d="${d}"/>`);
  }

  // the gold seams glinting through the cracked strata
  for (const v of g.veins) {
    const cracks = new Map<string, string>();
    for (const c of v.crack) {
      const col = mix(P.wall[c.band], T.groove, 0.82);
      cracks.set(col, (cracks.get(col) ?? "") + cd(c.pts, false));
    }
    for (const [col, d] of cracks) out.push(`<path fill="none" stroke="${col}" stroke-width="1.5" stroke-linecap="round" d="${d}"/>`);
    const glints = new Map<string, string>();
    for (const gl of v.glint) {
      const col = mix(P.wall[gl.band], T.trace, gl.level / 4);
      glints.set(col, (glints.get(col) ?? "") + cd(gl.pts, false));
    }
    for (const [col, d] of glints) out.push(`<path fill="none" stroke="${col}" stroke-width=".7" d="${d}"/>`);
  }

  out.push(`<path fill="none" stroke="${T.edge}" stroke-width=".55" d="${g.edge}"/>`);
  return out.join("");
}

// ─── the box ────────────────────────────────────────────────────────────────

/** The brain's own box, widened: room on the left for the raster the eroded
    flank leaves as, and either side for the dust plain to fade out in. */
export function sandBox(view: BrainView = BRAIN_VIEW_ISO): BrainIsoBox {
  const B = brainIsoBox(view);
  const w = B.x1 - B.x0;
  return { x0: B.x0 - 0.3 * w, x1: B.x1 + 0.3 * w, y0: B.y0, y1: B.y1 };
}

export function sandSvg({ view, only, light, tones }: MindOptions): string {
  const P = paletteOf(light);
  const sides = only ? [only] : sidesFarFirst(view);
  const body = sides.map((side) => hemisphereSvg(geometryOf(side, view), P)).join("");
  return mindSvg({ view, light, tones, box: sandBox(view), body: `<g class="sd">${body}</g>`, css: `.sd path{vector-effect:none}` });
}

export const sand: MindDirection = {
  id: "d5",
  round: 1,
  name: "Sand",
  line: "The hero's sediment: a smooth stone brain in one raking light, worn away on its dark flank into raster and sand, gold circuitry beneath and gold seams in its strata.",
  svg: sandSvg,
  box: (o) => sandBox(o.view),
  live: (o) => sandLive(o, { box: sandBox(o.view), hullOf, exits: exitsOf(ERODE.side, o.view), band: [Z_LO, Z_HI], eroded: ERODE.side }),
};
