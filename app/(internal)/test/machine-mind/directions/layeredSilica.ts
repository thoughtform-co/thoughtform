import { W, type BrainView } from "@/components/arcs/figures/foundation/brainIso";
import { depthOf, iso, pathOf, solidSvg, type Flat, type Point3 } from "@/components/arcs/figures/foundation/isoKit";
import * as G from "../kit/lathe.mjs";
import { add3, anatomyAt, cross3, dot3, facetBands, hullPoint, makeHull, mindSvg, mix, mul3, occluder, paintOrder, rampOf, sidesFarFirst, sub3, sulciLines, sulcusAt, unit3, Z_CROWN, Z_FLOOR, type Hull, type HullGrid, type HullShape, type Side, type V3, type Vertex } from "../hull";
import type { MindDirection, MindOptions } from "./types";

/**
 * E2 Layered Silica (machine-mind round two, 2026-10-17; owner: "The D4
 * silica is very nice, especially with the shading … it's missing the gold
 * in the layers … let's make sure it looks a bit more like a brain").
 *
 * D4's casting grown into a brain: the brain hull with its sulci carved,
 * lit as a calm form that still carries the grooves, in D4's chalk-white
 * ramp (dark theme) or matte basalt (light theme). Then the layered thing:
 * fine engraved layer lines round the casting at an even surface pitch, as
 * if it were built up in layers, quiet, breaking where a sulcus cuts them.
 * Every fifth layer is a gold inlay running the whole layer, the transistor
 * metal laminated into the silica; one gold trace steps down through the
 * layers on vias, from the crown core to a strip of packages seated in the
 * Sylvian fissure. The core, lidded in gold, is the one lit part. D4's
 * cables are left out: on the folded form they only added a fourth line.
 */

type P3 = Point3;

// ─── the shape ──────────────────────────────────────────────────────────────

const SHAPE: HullShape = { brain: 1, sulci: 0.045 };
/** The light: a calm turned casting that still carries the sulci, so the
    shading itself shows the gyri. */
const LIGHT_SHAPE: HullShape = { fold: 0.25, sulci: 0.04 };
const GRID: HullGrid = { cols: 220, lower: 14, upper: 56 };
/** The shape layers are measured on: the anatomy without the carve, so a
    layer's pitch does not jitter over every groove. */
const MEASURE: HullShape = { brain: 1 };

// ─── materials ──────────────────────────────────────────────────────────────

interface Material {
  light: boolean;
  ramp: string[];
  bands: number[];
  edge: string;
  /** The gold of an inlay at a band of the casting. */
  gold: (band: number) => string;
  css: string;
}

const BANDS = [-0.4, -0.22, -0.04, 0.14, 0.32, 0.5, 0.66];

function materialOf(light: boolean): Material {
  // dark: chalk-white silica, the lit side stopping at dry bone; light: the
  // hero's light plate turns the stone to matte warm basalt
  const ramp = light ? rampOf("#1c1a17", "#69645b", BANDS.length + 1, 0.95) : rampOf("#6a645a", "#e6dfd0", BANDS.length + 1, 0.8);
  const top = ramp.length - 1;
  const edge = light ? "#12110f" : "#45403a";
  // the inlay against its own ground: on chalk the gold deepens where the
  // chalk is brightest, on basalt it stays the bright metal
  const gold = light ? () => "#c7a14c" : (band: number) => mix("#d4a944", "#9c761c", band / top);
  const chip = light
    ? `--anatomy-paper:#d6cfc0;--anatomy-shade-0:#9e978a;--anatomy-shade-1:#b2ab9d;--anatomy-shade-2:#c5beb0;--anatomy-shade-3:#d6d0c3;--anatomy-top:#e4ded2;--anatomy-hi:#3c3833;--anatomy-lo:#8c8579;--anatomy-faint:#a49d90`
    : `--anatomy-paper:#141310;--anatomy-shade-0:#0b0a09;--anatomy-shade-1:#100f0d;--anatomy-shade-2:#161512;--anatomy-shade-3:#1c1a17;--anatomy-top:#25221e;--anatomy-hi:#0a0908;--anatomy-lo:#2f2b26;--anatomy-faint:#26231f`;
  const core = light ? `--anatomy-face:#c7a14c;--anatomy-lit-top:#dcb862;--anatomy-lit-shade:#a8873f;--anatomy-lit:#8a6b20` : `--anatomy-face:#caa554;--anatomy-lit-top:#f0c86a;--anatomy-lit-shade:#a8873f;--anatomy-lit:#f0c86a`;
  const pin = light ? "#c7a14c" : "#a8873f";
  const hole = light ? "#14120f" : "#3d3830";
  const css = [
    `.ls path,.ls circle{vector-effect:none}`,
    `.ls-cast path{stroke-width:.9;stroke-linejoin:round}`,
    `.ls-cast .ls-edge{stroke-width:.7;stroke-linecap:round}`,
    `.ls-line{fill:none;stroke-linecap:round;stroke-linejoin:round}`,
    `.ls-chip{${chip}}`,
    `.ls-core{${core}}`,
    `.ls-pin{fill:none;stroke:${pin};stroke-width:.36;stroke-linecap:butt}`,
    `.ls-pad{fill:${pin};stroke:none}`,
    `.ls-hole{fill:${hole};stroke:none}`,
  ].join("");
  return { light, ramp, bands: BANDS, edge, gold, css };
}

const bandOf = (s: number, bands: readonly number[]) => {
  let b = 0;
  while (b < bands.length && s >= bands[b]) b++;
  return b;
};

// ─── the casting ────────────────────────────────────────────────────────────

const tenth = (v: number) => (Math.round(v * 10) / 10).toString();
const num = (v: number) => {
  const t = (v / 10).toString();
  return t.startsWith("0.") ? t.slice(1) : t.startsWith("-0.") ? "-" + t.slice(2) : t;
};

/** A polyline as relative path data at a tenth of a unit, closed or not. */
function relD(pts: readonly Flat[], closed: boolean, shift: Flat = [0, 0]): string {
  let out = "";
  let px = 0;
  let py = 0;
  pts.forEach(([x, y], i) => {
    const rx = Math.round((x + shift[0]) * 10);
    const ry = Math.round((y + shift[1]) * 10);
    const ys = num(i ? ry - py : ry);
    out += (i ? "l" : "M") + num(i ? rx - px : rx) + (ys.startsWith("-") ? "" : " ") + ys;
    px = rx;
    py = ry;
  });
  return out + (closed ? "z" : "");
}

/** The hull back to front in the ramp's tones (D4's painter: a run of one
    tone as one path, each piece stroked in its own fill, wholly hidden
    facets skipped), then its silhouette. */
function castSvg(h: Hull, m: Material): string {
  const hidden = occluder(h);
  const out: string[] = [];
  let tone = -1;
  let d = "";
  const flush = () => {
    if (d) out.push(`<path fill="${m.ramp[tone]}" stroke="${m.ramp[tone]}" d="${d}"/>`);
    d = "";
  };
  for (const f of paintOrder(h)) {
    if (f.v.every((v) => hidden(v.xy, depthOf(v.w as P3, h.P) + 0.6))) continue;
    for (const piece of facetBands(f, m.bands)) {
      const b = Math.min(m.ramp.length - 1, piece.band);
      if (b !== tone) {
        flush();
        tone = b;
      }
      d += relD(piece.pts, true);
    }
  }
  flush();
  return `<g class="mm-hull ls-cast">${out.join("")}<path class="ls-edge" fill="none" stroke="${m.edge}" d="${outlineD(h)}"/></g>`;
}

/** The hull's outline: the silhouette's grid edges (hull.ts's
    `silhouetteD`) less those inside the figure. The carve turns facets away
    inside a groove seen at a slant, and their edges would draw a dashed
    crease over the casting; an outline edge has open ground on one side. */
function outlineD(h: Hull): string {
  const C = h.cols;
  const R = h.zs.length - 1;
  const F = (r: number, c: number) => h.facets[r * C + ((c + C) % C)];
  const hidden = occluder(h);
  const covered = (xy: Flat) => hidden(xy, -1e9);
  const segs: string[] = [];
  const seg = (a: Vertex, b: Vertex) => {
    const mid: Flat = [(a.xy[0] + b.xy[0]) / 2, (a.xy[1] + b.xy[1]) / 2];
    if (hidden(mid, depthOf(mul3(add3(a.w, b.w), 0.5) as P3, h.P))) return;
    const dx = b.xy[0] - a.xy[0];
    const dy = b.xy[1] - a.xy[1];
    const l = Math.hypot(dx, dy) || 1;
    const off = 1.6;
    const nx = (-dy / l) * off;
    const ny = (dx / l) * off;
    if (covered([mid[0] + nx, mid[1] + ny]) && covered([mid[0] - nx, mid[1] - ny])) return;
    segs.push(`M${tenth(a.xy[0])} ${tenth(a.xy[1])}L${tenth(b.xy[0])} ${tenth(b.xy[1])}`);
  };
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const f = F(r, c);
      if (f.facing !== F(r, c + 1).facing) seg(f.v[1], f.v[2]);
      if (r + 1 < R && f.facing !== F(r + 1, c).facing) seg(f.v[3], f.v[2]);
    }
  }
  return segs.join("");
}

// ─── lines on the casting ───────────────────────────────────────────────────

type Run = { xy: Flat; band: number }[];

/** (t, z) polylines sampled on the surface, split where they turn away or
    a nearer fold covers them; runs shorter than `min` screen units dropped
    (a groove glimpsed past a fold). Each point keeps its band. */
function sample(h: Hull, lines: readonly (readonly [number, number])[][], m: Material, min = 4, facing = 0): Run[] {
  const hidden = occluder(h);
  const out: Run[] = [];
  for (const line of lines) {
    let run: Run = [];
    const flush = () => {
      let len = 0;
      for (let i = 1; i < run.length; i++) len += Math.hypot(run[i].xy[0] - run[i - 1].xy[0], run[i].xy[1] - run[i - 1].xy[1]);
      if (run.length > 1 && len >= min) out.push(run);
      run = [];
    };
    for (const [t, z] of line) {
      const s = h.at(t, z);
      if (!s.facing || dot3(s.n, h.toward) < facing || hidden(s.xy, s.depth)) flush();
      else run.push({ xy: s.xy, band: bandOf(s.lit, m.bands) });
    }
    flush();
  }
  return out;
}

/** Runs drawn as lines, each stretch toned by the band under it: one path
    per colour. */
function strokeSvg(runs: readonly Run[], tone: (band: number) => string, width: number, shift: Flat = [0, 0]): string {
  const byTone = new Map<string, string>();
  for (const run of runs) {
    let i = 0;
    while (i < run.length - 1) {
      const c = tone(run[i + 1].band);
      let j = i + 1;
      while (j + 1 < run.length && tone(run[j + 1].band) === c) j++;
      byTone.set(c, (byTone.get(c) ?? "") + relD(run.slice(i, j + 1).map((p) => p.xy), false, shift));
      i = j;
    }
  }
  return [...byTone].map(([c, d]) => `<path class="ls-line" stroke="${c}" stroke-width="${width}" d="${d}"/>`).join("");
}

// ─── the layers ─────────────────────────────────────────────────────────────

/** The layer pitch along the surface, world units; which layers carry a
    gold inlay (every `GOLD_EVERY`th, from `GOLD_FROM` counted down from the
    crown, so no small gold ring closes round a crown); how near the crown's
    pole the last layer comes (the crown is a cap, the core's seat). */
const PITCH = 7.2;
const GOLD_EVERY = 5;
const GOLD_FROM = 2;
const CAP = 34;

interface Layer {
  z: number;
  gold: boolean;
}

/** The layers (param z), crown first, at an even pitch along the surface:
    equal arc length up the casting's meridians (the mean of a few from the
    lateral side to the front), so the rhythm stays even over the dome
    instead of opening into wide treads near the crown. */
let LAYERS: Layer[] | null = null;
function layers(): Layer[] {
  if (LAYERS) return LAYERS;
  const zs: number[] = [];
  for (let z = Z_FLOOR; z <= Z_CROWN; z += 0.5) zs.push(Math.min(z, Z_CROWN));
  const meridians = [0.15, 0.6, 1.05, 1.45];
  const s = zs.map(() => 0);
  for (const t of meridians) {
    let acc = 0;
    let prev = W(...hullPoint(-1, t, zs[0], MEASURE));
    zs.forEach((z, i) => {
      const p = W(...hullPoint(-1, t, z, MEASURE));
      acc += Math.hypot(p[0] - prev[0], p[1] - prev[1], p[2] - prev[2]);
      prev = p;
      s[i] += acc / meridians.length;
    });
  }
  const total = s[s.length - 1];
  const zAt = (target: number) => {
    let i = 1;
    while (i < s.length - 1 && s[i] < target) i++;
    const k = (target - s[i - 1]) / (s[i] - s[i - 1] || 1);
    return zs[i - 1] + (zs[i] - zs[i - 1]) * k;
  };
  const out: Layer[] = [];
  for (let k = 0; total - CAP - k * PITCH > PITCH * 0.6; k++) out.push({ z: zAt(total - CAP - k * PITCH), gold: k >= GOLD_FROM && (k - GOLD_FROM) % GOLD_EVERY === 0 });
  LAYERS = out;
  return out;
}

const fbOf = (t: number) => Math.sign(Math.sin(t)) * Math.abs(Math.sin(t)) ** (2 / 2.4);

/** Where the Sylvian fissure runs (param z at contour angle t): hull.ts's
    `anatomyAt` groove centre. */
const fissureZ = (t: number) => 6 + 40 * Math.min(1, Math.max(0, (0.62 - fbOf(t)) / 1.05));

/** A layer as (t, z) runs round the hemisphere; with `quiet`, broken where a
    sulcus or the Sylvian fissure cuts the casting (the pale layers keep out
    of the grooves; they end on the groove's edge); `skip` breaks it too. */
function layerRuns(side: Side, z: number, quiet: boolean, skip: (t: number, z: number) => boolean, steps = 300): [number, number][][] {
  const runs: [number, number][][] = [];
  let run: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    let keep = !skip(t, z);
    if (keep && quiet) keep = Math.abs(sulcusAt(side, t, z)) > 0.17 && anatomyAt(t, z, fbOf(t), 1).groove < 0.3;
    if (keep) run.push([t, z]);
    else if (run.length) {
      runs.push(run);
      run = [];
    }
  }
  if (run.length) runs.push(run);
  return runs;
}

// ─── parts ──────────────────────────────────────────────────────────────────

interface Frame {
  o: V3;
  n: V3;
  tu: V3;
  tw: V3;
  depth: number;
}

/** The surface's frame at (t, z), its first tangent laid along `dir`
    (world) as far as the surface lets it. */
function frameAlong(h: Hull, t: number, z: number, dir: V3): Frame {
  const s = h.at(t, z);
  const n = s.n;
  const tu = unit3(sub3(dir, mul3(n, dot3(dir, n))));
  return { o: s.w, n, tu, tw: unit3(cross3(n, tu)), depth: s.depth };
}

const rect = (a: number, b: number): [number, number][] => [
  [-a, -b],
  [a, -b],
  [a, b],
  [-a, b],
];

/** A package on the casting: leadless (gold pads a hair proud of its foot)
    or, the core, leaded on four sides and lidded in gold. Null when any top
    corner is out of view. */
function packageSvg(h: Hull, F: Frame, a: number, b: number, core = false): string | null {
  const P = h.P;
  const V = h.toward;
  const hidden = occluder(h);
  if (dot3(F.n, V) < 0.15) return null;
  const ht = core ? 1.5 : 1.1;
  const at = (sh: number, x: number, y: number): P3 => add3(add3(add3(F.o, mul3(F.n, sh)), mul3(F.tu, x)), mul3(F.tw, y)) as P3;
  for (const [sx, sy] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]) {
    const q = at(ht, sx * a, sy * b);
    if (hidden(iso(q, P), depthOf(q, P))) return null;
  }
  const K = G.frameOf(F.o, F.n, F.tu, F.tw);
  const body = solidSvg(G.prismOf(K, rect(a, b), 0, ht, P) as never, { tone: "hi", crease: "lo", className: "ls-chip" });
  if (!core) return `<path class="ls-pad" d="${pathOf(rect(a + 0.42, b + 0.42).map(([x, y]) => iso(at(0.02, x, y), P)), true)}"/>` + body;
  const near: string[] = [];
  const far: string[] = [];
  const legs = (dir: V3, side: V3, half: number, reach: number) => {
    const count = Math.max(2, Math.round((half * 2) / 1.15));
    const d: string[] = [];
    for (let i = 0; i < count; i++) {
      const x = -half + ((i + 0.5) * 2 * half) / count;
      d.push(pathOf([iso(add3(add3(add3(F.o, mul3(F.n, ht * 0.45)), mul3(dir, reach)), mul3(side, x)) as P3, P), iso(add3(add3(add3(F.o, mul3(F.n, -0.05)), mul3(dir, reach + 1.3)), mul3(side, x)) as P3, P)]));
    }
    (dot3(dir, V) > 0 ? near : far).push(d.join(""));
  };
  legs(F.tu, F.tw, b * 0.86, a);
  legs(mul3(F.tu, -1), F.tw, b * 0.86, a);
  legs(F.tw, F.tu, a * 0.86, b);
  legs(mul3(F.tw, -1), F.tu, a * 0.86, b);
  const lid = solidSvg(G.prismOf(K, rect(a * 0.64, b * 0.64), ht, ht + 0.6, P) as never, { tone: "hi", crease: "none", lit: true, className: "ls-core" });
  return (far.length ? `<path class="ls-pin" d="${far.join("")}"/>` : "") + body + (near.length ? `<path class="ls-pin" d="${near.join("")}"/>` : "") + lid;
}

/** A via: a gold pad seated in the casting at (t, z), its drill hole dark. */
function viaSvg(h: Hull, t: number, z: number, r = 1.25): string {
  const s = h.at(t, z);
  if (!s.facing || occluder(h)(s.xy, s.depth)) return "";
  const F = frameAlong(h, t, z, [0, 0, 1]);
  const ring = (rr: number) => Array.from({ length: 16 }, (_, i) => iso(add3(add3(add3(F.o, mul3(F.n, 0.05)), mul3(F.tu, rr * Math.cos((i / 16) * Math.PI * 2))), mul3(F.tw, rr * Math.sin((i / 16) * Math.PI * 2))) as P3, h.P));
  return `<path class="ls-pad" d="${pathOf(ring(r), true)}"/><path class="ls-hole" d="${pathOf(ring(r * 0.38), true)}"/>`;
}

/** The circuit, on the core's hemisphere: the core on the crown, a strip of
    packages in the Sylvian fissure, and one gold trace between them, plumb
    down the meridian with the fewest sulci, a via wherever it meets an
    inlay (it steps through the layers there). Contour angles are the near
    (left) hemisphere's. */
const TRACE_T = 0.6;
const CORE = { t: TRACE_T, z: 149.35, half: 5.2 };
const STRIP = { t0: 0.6 - 0.085, t1: 0.6 + 2 * 0.085, count: 4, a: 3.1, b: 2.1 };

function circuitSvg(h: Hull, gold: readonly Layer[], m: Material): string {
  const parts: string[] = [];
  const surface: string[] = [];
  // the strip: packages laid along the fissure, centred in its groove
  for (let i = 0; i < STRIP.count; i++) {
    const t = STRIP.t0 + ((STRIP.t1 - STRIP.t0) * i) / (STRIP.count - 1);
    const a = h.at(t - 0.01, fissureZ(t - 0.01)).w;
    const b = h.at(t + 0.01, fissureZ(t + 0.01)).w;
    const svg = packageSvg(h, frameAlong(h, t, fissureZ(t), sub3(b, a)), STRIP.a, STRIP.b);
    if (svg) parts.push(svg);
  }
  // the core on the crown, square to the brain's axes
  const core = packageSvg(h, frameAlong(h, CORE.t, CORE.z, [1, 0, 0]), CORE.half, CORE.half, true);
  // the trace: from past the core's downhill legs to the strip's middle
  // package, landing on its pads
  const zTop = footZ(h, CORE.t, CORE.z, CORE.half + 2.6);
  const zBot = footZ(h, TRACE_T, fissureZ(TRACE_T), -(STRIP.b + 0.5));
  const run = sample(h, [Array.from({ length: 120 }, (_, k) => [TRACE_T, zTop + ((zBot - zTop) * k) / 119] as [number, number])], m, 1);
  surface.push(strokeSvg(run, m.gold, m.light ? 0.75 : 0.88));
  for (const l of gold) if (l.z < zTop - 2 && l.z > zBot + 2) surface.push(viaSvg(h, TRACE_T, l.z));
  return surface.join("") + parts.join("") + (core ?? "");
}

/** Up (or, negative, down) the meridian t from (t, z), the height at which
    the surface is `reach` world units from where it started. */
function footZ(h: Hull, t: number, z: number, reach: number): number {
  const c = h.at(t, z).w;
  const dir = Math.sign(reach) > 0 ? -1 : 1;
  for (let zz = z; Math.abs(zz - z) < 40; zz += dir * 0.05) {
    const p = h.at(t, zz).w;
    if (Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]) > Math.abs(reach)) return zz;
  }
  return z + dir * 40;
}

// ─── one hemisphere ─────────────────────────────────────────────────────────

const CORE_SIDE: Side = -1;

function hemisphere(side: Side, view: BrainView, m: Material): string {
  const h = makeHull(side, { view, shape: SHAPE, lightShape: LIGHT_SHAPE, grid: GRID });
  const top = m.ramp.length - 1;
  const L = layers();
  const noSkip = () => false;
  // the layers end before the limb rather than crowding into the outline
  const pale = sample(h, L.filter((l) => !l.gold).flatMap((l) => layerRuns(side, l.z, true, noSkip)), m, 4, 0.08);
  const goldRuns = sample(h, L.filter((l) => l.gold).flatMap((l) => layerRuns(side, l.z, false, noSkip)), m, 14, 0.05);
  // the sulci fade before the limb, where a groove seen edge on breaks
  // into dashes behind its own folds
  const sulci = sample(h, sulciLines(side), m, 12, 0.22);
  const out = [
    castSvg(h, m),
    // the layers: a fine groove on chalk (its lip is lost in the white), a
    // fine lip on basalt (its groove is lost in the dark)
    strokeSvg(pale, (b) => (m.light ? m.ramp[Math.min(top, b + 2)] : m.ramp[Math.max(0, b - 2)]), 0.45),
    // the sulci, cut deeper
    strokeSvg(sulci, (b) => (m.light ? m.ramp[Math.max(0, b - 3)] : m.ramp[Math.max(1, b - 3)]), 0.8),
    // the gold inlays
    strokeSvg(goldRuns, m.gold, m.light ? 0.7 : 0.82),
    side === CORE_SIDE ? circuitSvg(h, L.filter((l) => l.gold), m) : "",
  ];
  return `<g class="ls">${out.join("")}</g>`;
}

function layeredSilicaSvg({ view, only, light, tones }: MindOptions): string {
  const m = materialOf(light);
  const sides = only ? [only] : sidesFarFirst(view);
  return mindSvg({ view, light, tones, body: sides.map((side) => hemisphere(side, view, m)).join(""), css: m.css });
}

export const layeredSilica: MindDirection = {
  id: "e2",
  round: 2,
  name: "Layered Silica",
  line: "D4's white casting on a brain's form, built up in layers, gold inlaid every few layers.",
  svg: layeredSilicaSvg,
};

