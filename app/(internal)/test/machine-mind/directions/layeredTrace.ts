import { hullPoint, lineD, makeHull, mindSvg, polyD, rampOf, seen, sidesFarFirst, silhouetteD, sulciLines, sulcusAt, T_UNIT, type Hull, type HullGrid, type HullShape, type Side, type UW } from "../hull";
import type { Flat } from "@/components/arcs/figures/foundation/isoKit";
import { offset } from "@/components/xb-proposal/kit/trace";
import { crownAt, crownPad, fieldOf, layerLevels, loopRuns, packageSvg, route, tierLines, type Body, type Level, type Package } from "./layeredTrace.parts";
import { afOf, gridSampler, inRegions, roundPad, skinSvg, thin, type Half, type Region, type Skin } from "./traceCortex.parts";
import type { MindDirection, MindOptions } from "./types";

/**
 * E1 · Layered Trace (machine-mind round two, 2026-10-17; the owner picked
 * D1 and D4: "what's missing is maybe that layered thing … missing the gold
 * in the layers … let's make sure it looks a bit more like a brain").
 *
 * D1's gray and gold on the brain's form. The hull is the brain, its sulci
 * carved and grooved, shaded as one sculpted form (its light from a gentle
 * fold). The layers come back as engraved lines at even surface spacing, a
 * dark hairline with a lighter lip where the light catches it, and every
 * fourth is a copper layer, a fine gold line that runs the layer. The gold
 * traces belong to the layers: every bus rises out of a copper layer on a
 * row of vias and is routed level, plumb or 45° in (u, w) along the gyri
 * (a sulcus is dear ground to the router, and where a bus must cross one
 * the groove cuts over it), dropping through on a via wherever it crosses
 * another copper layer. Feeders climb to the crown: on the near one into
 * the copper ring round the core die (the one lit part), on the far one to
 * a smaller unlit package; links climb one gyrus to the next copper layer
 * and drop into it. Every trace ends in copper or on a via.
 */

const SHAPE: HullShape = { brain: 1, sulci: 0.045 };
const LIGHT: HullShape = { fold: 0.25, sulci: 0.045 };
const GRID: HullGrid = { cols: 220, lower: 14, upper: 56 };

/** The layers: their spacing in surface distance, and every how many a
    copper one. */
const SPACING = 12;
const COPPER = 4;

/** Traces: their pitch in a bundle, the router's step, and how squarely a
    trace must face the viewer to be drawn (past this it ends on a via before
    the limb). */
const PITCH = 2.4;
const STEP = 3;
const FACING = 0.4;

/** The core die on the near crown, in a clearance window in its copper
    ring; the far crown's smaller, unlit package, its bundles landing on a
    row of vias on a square round it. */
const DIE_SIDE: Side = -1;
const DIE: Package = { a: 30, f: 12, half: 9, pins: 5, pitch: 2.5, spread: 3.4, fan: [10, 14] };
const WINDOW = DIE.half + 16;
const RING = { half: WINDOW + 7, cut: 9 };
const CHIP: Package = { a: 16, f: 24, half: 6.5, pins: 4, pitch: 2.4, spread: 3.2, fan: [7.5, 10.5] };
const LANDING = CHIP.half + 14;

/** The buses on each hemisphere's seen flank, each rising out of a copper
    layer (counted from the floor) at u, from the middle of its gyrus:
    feeders run up to the crown's part (the die's copper ring, the package's
    landing); links climb the gyrus to the next copper layer and drop into
    it, so the traces step through the laminate. */
interface Bus {
  u: number;
  layer: number;
  kind: "feed" | "link";
  /** Traces in it. */
  n: number;
}
const BUSES: Record<string, Bus[]> = {
  "-1": [
    { u: 0, layer: 2, kind: "feed", n: 5 },
    { u: 110, layer: 2, kind: "feed", n: 5 },
    { u: -95, layer: 3, kind: "feed", n: 5 },
    { u: -120, layer: 1, kind: "link", n: 3 },
    { u: -40, layer: 1, kind: "link", n: 3 },
    { u: 60, layer: 1, kind: "link", n: 3 },
    { u: -120, layer: 3, kind: "link", n: 3 },
    { u: 165, layer: 3, kind: "link", n: 3 },
  ],
  "1": [
    { u: 150, layer: 2, kind: "feed", n: 5 },
    { u: 240, layer: 2, kind: "feed", n: 5 },
    { u: 95, layer: 3, kind: "link", n: 3 },
    { u: 300, layer: 3, kind: "link", n: 3 },
  ],
};

// ─── the crown's parts ──────────────────────────────────────────────────────

/** A square in the crown's frame round (a, f), its corners cut at 45°. */
function squareOf(a: number, f: number, half: number, cut: number): Region {
  return [
    [1, 0, -(a - half)],
    [-1, 0, a + half],
    [0, 1, -(f - half)],
    [0, -1, f + half],
    [1, 1, -(a + f - 2 * half + cut)],
    [-1, -1, a + f + 2 * half - cut],
    [1, -1, -(a - f - 2 * half + cut)],
    [-1, 1, a - f + 2 * half - cut],
  ];
}

/** The die's copper ring: its square less the clearance window. */
function ringOf(): Region[] {
  const outer = squareOf(DIE.a, DIE.f, RING.half, RING.cut);
  const { a, f } = DIE;
  const band: Half[] = [
    [0, 1, -(f - WINDOW)],
    [0, -1, f + WINDOW],
  ];
  return [
    [...outer, [0, 1, -(f + WINDOW)]],
    [...outer, [0, -1, f - WINDOW]],
    [...outer, [1, 0, -(a + WINDOW)], ...band],
    [...outer, [-1, 0, a - WINDOW], ...band],
  ];
}

/** The copper the layer lines and sulci end on: the die's ring, its outer
    edge. On the far crown nothing is cut: the package sits on the laminate
    and its fan-out crosses the layer lines as any trace does. */
const zoneOf = (side: Side): Region | null => (side === DIE_SIDE ? squareOf(DIE.a, DIE.f, RING.half, RING.cut) : null);

/** The vias stitching the ring to the plane under it, on its centre line. */
function fenceOf(): [number, number][] {
  const ring = ringOf();
  const inside = (a: number, f: number) => [0, Math.PI / 2, Math.PI, Math.PI * 1.5].every((k) => inRegions(ring, a + 2.2 * Math.cos(k), f + 2.2 * Math.sin(k)));
  const r = WINDOW + 3.5;
  const out: [number, number][] = [];
  for (let s = -r + 5; s <= r - 5; s += 5.5) out.push([DIE.a + s, DIE.f - r], [DIE.a + s, DIE.f + r], [DIE.a - r, DIE.f + s], [DIE.a + r, DIE.f + s]);
  return out.filter(([a, f]) => inside(a, f));
}

// ─── the paint ──────────────────────────────────────────────────────────────

interface Paint extends Skin {
  groove: string;
  layer: string;
  lip: string[];
  /** Gold, in tiers by the light: shadow, mid, lit. */
  gold: string[];
  /** The copper layers' gold, a step quieter than the traces'. */
  copper: string[];
  via: string;
  drill: string;
  edge: string;
  die: Body;
  chip: Body;
}

function paintOf(light: boolean, tones: MindOptions["tones"]): Paint {
  const bands = { maskBands: [0.05, 0.25, 0.45, 0.65], pourBands: [0.45, 0.8] };
  return light
    ? { ...bands, mask: rampOf("#c6c1b6", "#f5f2ec", 5), pour: rampOf("#cfb57c", "#e9d6a2", 3), groove: "#8f8676", layer: "#c2b9a6", lip: ["#f2ede2", "#fbf8f1"], gold: ["#b39c66", "#a08442", tones.gold], copper: ["#d3c29a", "#bba36a", "#a08442"], via: tones.gold, drill: "#efe9dc", edge: "#6e6658", die: { top: "#d9b65c", walls: ["#b8963e", "#9a7a2c"], edge: tones.lit }, chip: { top: "#e3d8bf", walls: ["#d2c5a7", "#c2b494"], edge: tones.gold } }
    : { ...bands, mask: rampOf("#131211", "#45413a", 5), pour: rampOf("#3e3219", "#6b5528", 3), groove: "#0a0908", layer: "#110f0d", lip: ["#3b3832", "#4f4b43"], gold: ["#5e4d27", "#8f753a", tones.gold], copper: ["#3f3420", "#6e5a2e", "#a3843d"], via: tones.gold, drill: "#0d0c0a", edge: "#8a8274", die: { top: "#c9a04a", walls: ["#6a5424", "#4a3c1c"], edge: tones.lit }, chip: { top: "#2c261b", walls: ["#221d15", "#18150f"], edge: tones.gold } };
}

// ─── the bundles ────────────────────────────────────────────────────────────

interface Trace {
  pts: UW[];
  /** Its ends: on a via, or in copper (no via). */
  vias: [boolean, boolean];
}

/** The centre route of every bus on one hemisphere, along the gyri: the
    router's field makes a sulcus dear ground, the limb dearer and a copper
    layer's line a little (a trace crosses it, it does not run along it).
    Each route takes its own width in the field and makes the lane beside it
    cheaper, so the next one runs alongside as one wider bus. */
function routesOf(h: Hull, levels: Level[]): { bus: Bus; centre: UW[] }[] {
  const side = h.side;
  const die = side === DIE_SIDE;
  const at = gridSampler(h);
  const target = die ? ringOf() : [squareOf(CHIP.a, CHIP.f, LANDING, 6)];
  const centre = (die ? crownAt(side, DIE.a, DIE.f, SHAPE) : crownAt(side, CHIP.a, CHIP.f, SHAPE)) ?? [0, 140];
  const goalU = centre[0] * T_UNIT;
  const [u0, u1] = die ? [-320, 320] : [-80, 520];
  const copperZ = levels.filter((_, k) => k % COPPER === COPPER - 1).map((l) => l.z);
  const buses = BUSES[String(side)];
  // the grid is laid in whole steps from the lowest start layer, and each
  // start and each link's goal is snapped onto a row of it
  const low = copperZ[Math.min(...buses.map((b) => b.layer))];
  const w0 = low - Math.floor((low + 52) / STEP) * STEP;
  const snap = (w: number) => w0 + Math.round((w - w0) / STEP) * STEP;
  const F = fieldOf(u0, u1, w0, 146, STEP, (u, w) => {
    const p = at(u, w);
    if (!p.seen || p.facing < 0.2) return 60;
    const s = sulcusAt(side, u / T_UNIT, w);
    const near = Math.min(...copperZ.map((z) => Math.abs(w - z)));
    return 1.6 + 3.5 * Math.exp(-((s / 0.2) ** 2)) + (p.facing < 0.6 ? 10 * (0.6 - p.facing) / 0.4 + 2 : 0) + (near < 2 ? 2 : 0);
  });
  const toPart = (u: number, w: number) => w > 70 && inRegions(target, ...afOf(side, hullPoint(side, u / T_UNIT, w, SHAPE)));
  const out: { bus: Bus; centre: UW[] }[] = [];
  for (const bus of buses) {
    const startW = snap(copperZ[bus.layer]);
    // the start: the middle of the gyrus nearest u, on the layer, where it
    // faces the viewer well
    let start: UW | null = null;
    let bs = -1;
    for (let du = -24; du <= 24; du += STEP) {
      const u = Math.round((bus.u + du - u0) / STEP) * STEP + u0;
      const p = at(u, startW);
      if (!p.seen || p.facing < 0.45) continue;
      const s = Math.abs(sulcusAt(side, u / T_UNIT, startW)) - Math.abs(du) / 200;
      if (s > bs) {
        bs = s;
        start = [u, startW];
      }
    }
    if (!start) continue;
    let r: UW[] | null = null;
    if (bus.kind === "feed") r = route(F, start, toPart, { turn: 10, minW: startW, heuristic: (u, w) => Math.hypot(u - goalU, w - centre[1]) });
    else {
      // a link is one straight run, plumb or 45°, from this copper layer to
      // the next, where it stays clearest of the sulci and in the light
      const top = copperZ[bus.layer + 1];
      if (top === undefined) continue;
      const rise = snap(top) - startW;
      let best = -Infinity;
      for (let du = -24; du <= 24; du += STEP) {
        for (const lean of [0, -1, 1]) {
          const a: UW = [start[0] + du, startW];
          const b: UW = [a[0] + lean * rise, startW + rise];
          // the share of the run clear of a sulcus; a run that leaves the
          // seen, well-facing surface is no candidate
          let score = 0;
          for (let k = 0; k <= 16; k++) {
            const u = a[0] + ((b[0] - a[0]) * k) / 16;
            const w = a[1] + ((b[1] - a[1]) * k) / 16;
            const p = at(u, w);
            if (!p.seen || p.facing < 0.45) {
              score = -Infinity;
              break;
            }
            if (Math.abs(sulcusAt(side, u / T_UNIT, w)) > 0.18) score += 1 / 17;
          }
          score -= Math.abs(du) / 400 + (lean ? 0.05 : 0);
          if (score > best) {
            best = score;
            r = [a, b];
          }
        }
      }
      if (best < 0.5) r = null;
    }
    if (!r) continue;
    // a short first leg that turns at once into the climb reads as a hook:
    // start the bus where its climb, run back, meets the layer instead
    if (r.length >= 3 && Math.hypot(r[1][0] - r[0][0], r[1][1] - r[0][1]) < 12 && r[2][1] > r[1][1]) {
      const k = (r[2][0] - r[1][0]) / (r[2][1] - r[1][1]);
      const u = r[1][0] - k * (r[1][1] - r[0][1]);
      if (at(u, r[0][1]).seen) r = [[u, r[0][1]], ...r.slice(2)];
    }
    out.push({ bus, centre: r });
    for (let i = 1; i < r.length; i++) {
      const [ua, wa] = r[i - 1];
      const [ub, wb] = r[i];
      const n = Math.max(1, Math.round(Math.hypot(ub - ua, wb - wa) / STEP));
      for (let k = 0; k <= n; k++) {
        const qu = Math.round((ua + ((ub - ua) * k) / n - u0) / STEP);
        const qw = Math.round((wa + ((wb - wa) * k) / n - w0) / STEP);
        for (let dq = -5; dq <= 5; dq++)
          for (let dr = -5; dr <= 5; dr++) {
            const q = qu + dq;
            const rr = qw + dr;
            if (q < 0 || rr < 0 || q >= F.cols || rr >= F.rows) continue;
            const d = Math.max(Math.abs(dq), Math.abs(dr));
            const i = rr * F.cols + q;
            if (d <= 3) F.cost[i] += 40;
            else if (F.cost[i] < 20) F.cost[i] = Math.max(1, F.cost[i] - 0.6);
          }
      }
    }
  }
  return out;
}

/** A bus round its centre route: `n` traces at one pitch, rising from vias
    on the copper layer and ending in the die's copper (no via: each trace
    runs on until it is in the ring), on the landing's vias, or on vias where
    a link drops into the next layer. */
function bundleOf(bus: Bus, centre: UW[], inCopper: ((u: number, w: number) => boolean) | null): Trace[] {
  return Array.from({ length: bus.n }, (_, i) => {
    const pts = offset(centre, (i - (bus.n - 1) / 2) * PITCH) as UW[];
    if (bus.kind !== "feed" || !inCopper) return { pts, vias: [true, true] as [boolean, boolean] };
    // run the last leg on, or cut it back, to where it first enters copper
    const [a, b] = [pts[pts.length - 2], pts[pts.length - 1]];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const d: UW = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    for (let s = -len + 0.5; s <= 16; s += 0.5) {
      const p: UW = [b[0] + d[0] * s, b[1] + d[1] * s];
      if (inCopper(p[0], p[1])) {
        const q: UW = [p[0] + d[0] * 1.5, p[1] + d[1] * 1.5];
        return { pts: [...pts.slice(0, -1), q], vias: [true, false] as [boolean, boolean] };
      }
    }
    return { pts, vias: [true, true] as [boolean, boolean] };
  });
}

// ─── drawing on the hull ────────────────────────────────────────────────────

interface Run {
  pts: UW[];
  xy: Flat[];
  lit: number[];
  facing: number[];
  own: [boolean, boolean];
}

/** A trace wrapped onto the hull: the runs of it that face the viewer well. */
function seenRuns(h: Hull, pts: UW[]): Run[] {
  const at = gridSampler(h);
  const samples: UW[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [u0, w0] = pts[i];
    const [u1, w1] = pts[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(u1 - u0, w1 - w0) / 1.5));
    for (let k = i ? 1 : 0; k <= n; k++) samples.push([u0 + ((u1 - u0) * k) / n, w0 + ((w1 - w0) * k) / n]);
  }
  const out: Run[] = [];
  let cur: Run | null = null;
  samples.forEach(([u, w], i) => {
    const s = at(u, w);
    if (s.facing >= FACING && s.seen) {
      if (!cur) cur = { pts: [], xy: [], lit: [], facing: [], own: [i === 0, false] };
      cur.pts.push([u, w]);
      cur.xy.push(s.xy);
      cur.lit.push(s.lit);
      cur.facing.push(s.facing);
      if (i === samples.length - 1) cur.own[1] = true;
    } else if (cur) {
      out.push(cur);
      cur = null;
    }
  });
  if (cur) out.push(cur);
  return out.filter((r) => r.pts.length > 3);
}

function hemisphereSvg(side: Side, o: MindOptions, paint: Paint): string {
  const h = makeHull(side, { view: o.view, shape: SHAPE, lightShape: LIGHT, grid: GRID });
  const die = side === DIE_SIDE;
  const at = gridSampler(h);
  const zone = zoneOf(side);
  const clear = (u: number, w: number) => !zone || w < 70 || !inRegions([zone], ...afOf(side, hullPoint(side, u / T_UNIT, w, SHAPE)));
  const parts: string[] = [skinSvg(h, paint, die ? ringOf() : [])];

  // the layers: an engraved hairline, a lighter lip under it where the light
  // catches; every COPPER-th a copper layer, a fine gold line
  const levels = layerLevels(side, SHAPE, SPACING);
  const layer: string[] = [];
  const lips: string[][] = paint.lip.map(() => []);
  const copper: string[][] = paint.copper.map(() => []);
  levels.forEach((lv, k) => {
    const gold = k % COPPER === COPPER - 1;
    for (const run of loopRuns(at, lv.z, { keep: clear })) {
      if (gold) tierLines(run, (lit) => (lit < 0.1 ? 0 : lit < 0.45 ? 1 : 2), copper);
      else layer.push(lineD(thin(run.xy)));
    }
    if (!gold) for (const run of loopRuns(at, lv.z - 0.7 * lv.dz, { keep: clear })) tierLines(run, (lit) => (lit < 0.3 ? -1 : lit < 0.6 ? 0 : 1), lips);
  });
  lips.forEach((d, i) => parts.push(`<path class="e1-line" stroke="${paint.lip[i]}" stroke-width=".45" d="${d.join("")}"/>`));
  parts.push(`<path class="e1-line" stroke="${paint.layer}" stroke-width=".5" d="${layer.join("")}"/>`);

  // the sulci: a groove line on the carve
  const sulci: string[] = [];
  for (const line of sulciLines(side)) {
    let run: Flat[] = [];
    const flush = () => {
      if (run.length > 1) sulci.push(lineD(thin(run)));
      run = [];
    };
    for (const [t, z] of line) {
      const p = h.at(t, z);
      if (seen(h, p) && clear(t * T_UNIT, z)) run.push(p.xy);
      else flush();
    }
    flush();
  }
  const groove = `<path class="e1-line" stroke="${paint.groove}" stroke-width=".8" d="${sulci.join("")}"/>`;
  copper.forEach((d, i) => parts.push(`<path class="e1-line" stroke="${paint.copper[i]}" stroke-width=".55" d="${d.join("")}"/>`));
  parts.push(`<path fill="none" stroke="${paint.edge}" stroke-width=".6" d="${silhouetteD(h)}"/>`);

  // the bundles, and their vias: at both ends, either side of a tunnel, and
  // where a trace crosses a copper layer
  const copperZ = levels.filter((_, k) => k % COPPER === COPPER - 1).map((l) => l.z);
  const traces: string[][] = paint.gold.map(() => []);
  const pads: string[] = [];
  const drills: string[] = [];
  const via = (u: number, w: number, r = 1.15) => {
    const pad = roundPad(h, u, w, r, 12);
    if (!pad) return;
    pads.push(polyD(pad));
    drills.push(polyD(roundPad(h, u, w, r * 0.38, 8) ?? []));
  };
  const ring = ringOf();
  const inCopper = die ? (u: number, w: number) => w > 70 && inRegions(ring, ...afOf(side, hullPoint(side, u / T_UNIT, w, SHAPE))) : null;
  for (const { bus, centre } of routesOf(h, levels)) {
    for (const t of bundleOf(bus, centre, inCopper)) {
      for (const run of seenRuns(h, t.pts)) {
        tierLines(run, (lit, i) => (run.facing[i] < 0.45 || lit < 0.1 ? 0 : lit < 0.45 ? 1 : 2), traces);
        if (!run.own[0] || t.vias[0]) via(...run.pts[0]);
        if (!run.own[1] || t.vias[1]) via(...run.pts[run.pts.length - 1]);
        for (let i = 1; i < run.pts.length; i++) {
          const [ua, wa] = run.pts[i - 1];
          const [ub, wb] = run.pts[i];
          for (const z of copperZ) if ((wa - z) * (wb - z) < 0) via(ua + ((ub - ua) * (z - wa)) / (wb - wa), z, 0.95);
        }
      }
    }
  }
  traces.forEach((d, i) => parts.push(`<path class="e1-trace" stroke="${paint.gold[i]}" d="${d.join("")}"/>`));
  // the sulci cut over the traces: a bus that crosses one dips under the
  // groove, so the fold stays the stronger line
  parts.push(groove);
  if (die) {
    for (const [a, f] of fenceOf()) {
      const tz = crownAt(side, a, f, SHAPE);
      const pad = tz && seen(h, h.at(tz[0], tz[1])) ? crownPad(h, a, f, 0.95) : null;
      if (!pad) continue;
      pads.push(polyD(pad));
      drills.push(polyD(crownPad(h, a, f, 0.38, 8) ?? []));
    }
  }
  parts.push(`<path fill="${paint.via}" d="${pads.join("")}"/><path fill="${paint.drill}" d="${drills.join("")}"/>`);
  const ink = { trace: paint.gold[2], via: paint.via, drill: paint.drill, pin: o.tones.gold };
  parts.push(die ? packageSvg(h, DIE, paint.die, ink) : packageSvg(h, CHIP, paint.chip, ink));
  return `<g class="e1">${parts.join("")}</g>`;
}

function svg(o: MindOptions): string {
  const paint = paintOf(o.light, o.tones);
  const sides = o.only ? [o.only] : sidesFarFirst(o.view);
  const body = sides.map((s) => hemisphereSvg(s, o, paint)).join("");
  const css = `.e1 path{vector-effect:none}.e1-line,.e1-trace{fill:none;stroke-linecap:round;stroke-linejoin:round}.e1-trace{stroke-width:.8;stroke-linecap:butt;stroke-linejoin:miter}`;
  return mindSvg({ view: o.view, light: o.light, tones: o.tones, body, css });
}

/** Layered Trace (machine-mind round two, 2026-10-17). */
export const layeredTrace: MindDirection = {
  id: "e1",
  round: 2,
  name: "Layered Trace",
  line: "D1's gray and gold on the brain's form: engraved layer lines with gold copper layers among them, and gold buses rising out of those layers along the gyri to the core die.",
  svg,
};
