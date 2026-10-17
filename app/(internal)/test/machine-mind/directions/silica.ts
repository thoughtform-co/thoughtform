import { HEMI, LC, W, contour, type BrainView } from "@/components/arcs/figures/foundation/brainIso";
import { depthOf, iso, pathOf, solidSvg, type Flat, type Point3, type Projection } from "@/components/arcs/figures/foundation/isoKit";
import * as G from "../kit/lathe.mjs";
import { tubePieces } from "../kit/tube.mjs";
import { add3, cross3, dot3, facetBands, hullNormal, lineD, makeHull, mindSvg, mul3, occluder, paintOrder, rampOf, sidesFarFirst, silhouetteD, sub3, T_UNIT, unit3, type Hull, type HullGrid, type Side, type UW, type V3 } from "../hull";
import type { MindDirection, MindOptions } from "./types";

/**
 * D4 Silica (machine-mind lab, 2026-10-17; ref 2, the white ceramic head
 * with chip clusters and cable loops; owner: "silica is more white").
 *
 * One smooth casting in a few panels: the act's own hull (its outline and
 * folds exactly today's), lit as a calm turned form, in a dry chalk-white
 * ramp (dark theme) or matte basalt (light theme, the hero's light plate).
 * Three panel seams, each a groove with a lip: the lateral fissure, the
 * central sulcus, and a cap round the crown. Every part sits in a joint: a
 * strip of small packages in the lateral fissure's groove, a bank where the
 * central sulcus meets it, and the core, the one lit part, lidded in gold,
 * where the central sulcus crosses the cap. Gold only where metal touches:
 * the pads, the core's legs, the collars. One rubber cable a hemisphere
 * rises from a collar on the cap, runs down the outer flank resting on the
 * casting and ends at the belly in a gold ferrule seated at one of the
 * act's root points, where its live tendrils take over.
 */

type P3 = Point3;

// ─── materials ──────────────────────────────────────────────────────────────

interface Material {
  ramp: string[];
  bands: number[];
  edge: string;
  css: string;
}

const BANDS = [-0.4, -0.22, -0.04, 0.14, 0.32, 0.5, 0.66];

function materialOf(light: boolean): Material {
  // dark: chalk-white silica, the lit side stopping at dry bone; light: the
  // hero's light plate turns the stone to matte warm basalt
  const ramp = light ? rampOf("#1c1a17", "#69645b", BANDS.length + 1, 0.95) : rampOf("#6a645a", "#e6dfd0", BANDS.length + 1, 0.8);
  const edge = light ? "#12110f" : "#45403a";
  const chip = light
    ? `--anatomy-paper:#d6cfc0;--anatomy-shade-0:#9e978a;--anatomy-shade-1:#b2ab9d;--anatomy-shade-2:#c5beb0;--anatomy-shade-3:#d6d0c3;--anatomy-top:#e4ded2;--anatomy-hi:#3c3833;--anatomy-lo:#8c8579;--anatomy-faint:#a49d90`
    : `--anatomy-paper:#141310;--anatomy-shade-0:#0b0a09;--anatomy-shade-1:#100f0d;--anatomy-shade-2:#161512;--anatomy-shade-3:#1c1a17;--anatomy-top:#25221e;--anatomy-hi:#0a0908;--anatomy-lo:#2f2b26;--anatomy-faint:#26231f`;
  const gold = light
    ? `--anatomy-paper:#7d6122;--anatomy-shade-0:#5e4818;--anatomy-shade-1:#6e5520;--anatomy-shade-2:#86682a;--anatomy-shade-3:#9c7b35;--anatomy-top:#b08d42;--anatomy-hi:#4a3810;--anatomy-lo:#6e5216;--anatomy-faint:#8a6b20`
    : `--anatomy-paper:#6e5826;--anatomy-shade-0:#4f3f1b;--anatomy-shade-1:#655124;--anatomy-shade-2:#7f672e;--anatomy-shade-3:#9c7f3a;--anatomy-top:#caa554;--anatomy-hi:#3a2f14;--anatomy-lo:#7f672e;--anatomy-faint:#9c7f3a`;
  const core = light ? `--anatomy-face:#8a6b20;--anatomy-lit-top:#a88334;--anatomy-lit-shade:#6e5216;--anatomy-lit:#6e5216` : `--anatomy-face:#caa554;--anatomy-lit-top:#f0c86a;--anatomy-lit-shade:#a8873f;--anatomy-lit:#f0c86a`;
  const cable = light
    ? `--anatomy-shade-2:#2b2824;--anatomy-top:#58534b;--anatomy-shade-0:#161412;--anatomy-hi:#0f0e0c`
    : `--anatomy-shade-2:#24211d;--anatomy-top:#504a41;--anatomy-shade-0:#100f0d;--anatomy-hi:#67614f`;
  const pin = light ? "#8a6b20" : "#caa554";
  const css = [
    `.si path,.si circle{vector-effect:none}`,
    `.si-cast path{stroke-width:.9;stroke-linejoin:round}`,
    `.si-cast .si-edge{stroke-width:.7;stroke-linecap:round}`,
    `.si-chip{${chip}}`,
    `.si-gold{${gold}}`,
    `.si-core{${core}}`,
    `.si-cable{${cable}}`,
    `.si-cable .tb-edge{stroke-width:.5}`,
    `.si-pin{fill:none;stroke:${pin};stroke-width:.36;stroke-linecap:butt}`,
    `.si-pad{fill:${pin};stroke:none}`,
    `.si-seam{fill:none;stroke-linecap:round;stroke-linejoin:round}`,
  ].join("");
  return { ramp, bands: BANDS, edge, css };
}

// ─── the shape ──────────────────────────────────────────────────────────────

/** The act's own shape, folds and all (fold 1: the outline is today's),
    lit as a calm turned casting: the light is taken from the hull with its
    gyri at a fifth of their depth (at a quarter, two small tone islands
    stood alone on the left flank), so the tone bands sweep the dome as one designed
    surface instead of breaking into blotches over every gyrus. */
const SHAPE = {};
const LIGHT_SHAPE = { fold: 0.2 };
/** A coarser loft than the lab's default (the tone bands are cut along
    their own iso-lines, so they stay smooth). */
const GRID: HullGrid = { cols: 132, lower: 8, upper: 32 };

const bandOf = (s: number, bands: readonly number[]) => {
  let b = 0;
  while (b < bands.length && s >= bands[b]) b++;
  return b;
};

const U = (t: number) => t * T_UNIT;

interface Frame {
  o: V3;
  n: V3;
  tu: V3;
  tw: V3;
  depth: number;
}

/** The surface's frame at (u, w): the point, its outward normal, and two
    tangents (round the contour, and up the surface). World axes. */
function frameAt(h: Hull, u: number, w: number): Frame {
  const t = u / T_UNIT;
  const s = h.at(t, w);
  const e = 0.004;
  const n = s.n;
  let tu = sub3(h.at(t + e, w).w, h.at(t - e, w).w);
  tu = unit3(sub3(tu, mul3(n, dot3(tu, n))));
  let tw = unit3(cross3(n, tu));
  if (tw[2] < 0) tw = mul3(tw, -1);
  return { o: s.w, n, tu, tw, depth: s.depth };
}

/** The surface point whose foot lies at (x, y) in a frame's tangent plane:
    Newton on (u, w) from the frame's own (u0, w0), the Jacobian taken where
    each step lands (u is far from arc length near the front, where the
    superellipse turns fast). */
function seat(h: Hull, u0: number, w0: number, F: Frame, x: number, y: number): [number, number] {
  const at = (u: number, w: number) => h.at(u / T_UNIT, w).w;
  let u = u0;
  let w = w0;
  for (let k = 0; k < 6; k++) {
    const pu = sub3(at(u + 0.5, w), at(u - 0.5, w));
    const pw = sub3(at(u, w + 0.5), at(u, w - 0.5));
    const a = dot3(pu, F.tu);
    const b = dot3(pw, F.tu);
    const c = dot3(pu, F.tw);
    const d = dot3(pw, F.tw);
    const det = a * d - b * c || 1e-9;
    const p = sub3(at(u, w), F.o);
    const ex = x - dot3(p, F.tu);
    const ey = y - dot3(p, F.tw);
    if (Math.hypot(ex, ey) < 0.01) break;
    u += (d * ex - b * ey) / det;
    w += (-c * ex + a * ey) / det;
  }
  return [u, w];
}

/** A closed polygon as relative path data at a tenth of a unit: the hull's
    pieces are many and small, and relative steps are a third shorter. */
function relD(pts: readonly Flat[]): string {
  let out = "";
  let px = 0;
  let py = 0;
  pts.forEach(([x, y], i) => {
    const rx = Math.round(x * 10);
    const ry = Math.round(y * 10);
    const dx = i ? rx - px : rx;
    const dy = i ? ry - py : ry;
    const num = (v: number) => {
      const t = (v / 10).toString();
      return t.startsWith("0.") ? t.slice(1) : t.startsWith("-0.") ? "-" + t.slice(2) : t;
    };
    const ys = num(dy);
    out += (i ? "l" : "M") + num(dx) + (ys.startsWith("-") ? "" : " ") + ys;
    px = rx;
    py = ry;
  });
  return out + "z";
}

/** The hull painted as the lab's `hullSvg` paints it (back to front, a run
    of one tone as one path, each piece stroked in its own fill), less what
    a nearer fold wholly hides, in relative path data; then its silhouette. */
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
      d += relD(piece.pts);
    }
  }
  flush();
  return `<g class="mm-hull si-cast">${out.join("")}<path class="si-edge" fill="none" stroke="${m.edge}" d="${silhouetteD(h)}"/></g>`;
}

// ─── the seams ──────────────────────────────────────────────────────────────

/** The panel seams, routed in (u, w), level, plumb or 45°: the lateral
    fissure rising from under the temporal pole and running back level, then
    up at 45°; the central sulcus coming down a meridian from the crown onto
    it; the cap round the crown. */
const SYLVIAN: UW[] = [
  [U(1.9), -46],
  [U(1.9), -8],
  [U(1.9) - 36, 28],
  [U(0.1), 28],
  [U(-0.3), 28 + U(0.4)],
  [U(-1.5), 28 + U(0.4)],
];
/** The crown's cap: one level seam all round the dome, a lid the looms plug
    into; the central sulcus crosses it on the crown, and that junction holds
    the core. */
const W_CAP = 120;
const CAP: UW[] = [
  [U(Math.PI * 1.5), W_CAP],
  [U(Math.PI * 3.5), W_CAP],
];
const CENTRAL: UW[][] = [
  [
    [U(0.6), 28],
    [U(0.6), 150],
  ],
  // over the pole and down the far side, into the fissure
  [
    [U(0.6 + Math.PI), 150],
    [U(0.6 + Math.PI), 30],
  ],
];

function seamSvg(h: Hull, legs: readonly (readonly UW[])[], m: Material): string {
  // sample the seam on the surface; split it where its band changes so the
  // groove is always darker than its own ground and the lip lighter
  const hidden = occluder(h);
  const samples: { xy: Flat; band: number; seen: boolean }[] = [];
  // a seam may run as several legs end to end (over the pole, where u
  // jumps by half a turn and the surface does not)
  for (const pts of legs) {
    for (let i = 0; i < pts.length - 1; i++) {
      const [u0, w0] = pts[i];
      const [u1, w1] = pts[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(u1 - u0, w1 - w0) / 1.5));
      for (let k = i || samples.length ? 1 : 0; k <= n; k++) {
        const s = h.at((u0 + ((u1 - u0) * k) / n) / T_UNIT, w0 + ((w1 - w0) * k) / n);
        samples.push({ xy: s.xy, band: bandOf(s.lit, m.bands), seen: s.facing && !hidden(s.xy, s.depth) });
      }
    }
  }
  // the lip sits on the groove's far wall from the light: down and right
  const lip: Flat = [0.4, 0.62];
  const runs: { band: number; pts: Flat[] }[] = [];
  let run: { band: number; pts: Flat[] } | null = null;
  // the last point drawn, shared by the next run so a band change leaves
  // no gap (and so the fragment test below can tell joined runs apart)
  let last: Flat | null = null;
  for (const p of samples) {
    if (!p.seen) {
      run = null;
      last = null;
      continue;
    }
    if (run === null || run.band !== p.band) {
      run = { band: p.band, pts: last ? [last] : [] };
      runs.push(run);
    }
    run.pts.push(p.xy);
    last = p.xy;
  }
  const top = m.ramp.length - 1;
  // a run is kept whole across band changes when deciding whether it is a
  // fragment: a groove glimpsed for a step or two past a fold is dropped
  const keep = new Set<number>();
  let from = 0;
  for (let i = 1; i <= runs.length; i++) {
    const joined = i < runs.length && runs[i].pts[0] === runs[i - 1].pts[runs[i - 1].pts.length - 1];
    if (joined) continue;
    let len = 0;
    for (let k = from; k < i; k++) for (let j = 1; j < runs[k].pts.length; j++) len += Math.hypot(runs[k].pts[j][0] - runs[k].pts[j - 1][0], runs[k].pts[j][1] - runs[k].pts[j - 1][1]);
    if (len > 6) for (let k = from; k < i; k++) keep.add(k);
    from = i;
  }
  runs.splice(0, runs.length, ...runs.filter((_, i) => keep.has(i)));
  const lips = runs.filter((r) => r.pts.length > 1).map((r) => `<path class="si-seam" stroke="${m.ramp[Math.min(top, r.band + 2)]}" stroke-width=".8" d="${lineD(r.pts.map(([x, y]) => [x + lip[0], y + lip[1]] as Flat))}"/>`);
  const grooves = runs.filter((r) => r.pts.length > 1).map((r) => `<path class="si-seam" stroke="${m.ramp[Math.max(0, r.band - 4)]}" stroke-width="1.1" d="${lineD(r.pts)}"/>`);
  return lips.join("") + grooves.join("");
}

// ─── the parts in the joints ────────────────────────────────────────────────

/** A package seated on the casting: its centre at (u, w), its long side laid
    along the surface's `u` (round the contour) or `w` (up it), half sizes
    `a` along and `b` across. Leadless parts show their gold pads as a line
    at the foot; the core is leaded on four sides and lidded in gold, the one
    lit part. */
interface Part {
  u: number;
  w: number;
  a: number;
  b: number;
  along: "u" | "w";
  core?: boolean;
}

const QFN = { a: 3.3, b: 2.3 } as const;

/** A strip of packages in a seam's groove: a straight run of the seam in
    (u, w), the parts centred on it at an even pitch, the groove showing in
    the gaps between them. */
function strip(from: UW, to: UW, count: number): Part[] {
  const along = Math.abs(to[0] - from[0]) >= Math.abs(to[1] - from[1]) ? "u" : "w";
  return Array.from({ length: count }, (_, i) => {
    const k = count > 1 ? i / (count - 1) : 0.5;
    return { u: from[0] + (to[0] - from[0]) * k, w: from[1] + (to[1] - from[1]) * k, ...QFN, along };
  });
}

/** The parts per hemisphere, every one on a seam: a strip in the lateral
    fissure's groove, a bank where the central sulcus meets it (the two
    grooves running on through its gaps), and the core where the central
    sulcus crosses the cap on the crown. */
const PARTS: Record<Side, { strips: Part[]; bank?: UW; core?: UW }> = {
  [-1]: { strips: strip([U(0.98), 28], [U(1.52), 28], 6), bank: [U(0.6), 28], core: [U(0.6), W_CAP] },
  [1]: { strips: strip([U(1.02), 28], [U(1.5), 28], 5) },
} as Record<Side, { strips: Part[]; bank?: UW; core?: UW }>;

const rect = (a: number, b: number): [number, number][] => [
  [-a, -b],
  [a, -b],
  [a, b],
  [-a, b],
];

/** One package as solids on the surface, or null when any of its top
    corners is out of view. */
function partSvg(h: Hull, p: Part, frame?: Frame): { depth: number; svg: string } | null {
  const P = h.P;
  const V = h.toward;
  const hidden = occluder(h);
  const foot = h.at(p.u / T_UNIT, p.w);
  const n = foot.n;
  if (dot3(n, V) < 0.2) return null;
  // the part's row direction: the frame's (a bank keeps its parts square to
  // one another), else the surface's own u or w, laid into the local plane
  const local = frameAt(h, p.u, p.w);
  const ref = frame ? frame.tu : p.along === "u" ? local.tu : local.tw;
  const tu = unit3(sub3(ref, mul3(n, dot3(ref, n))));
  const tw = unit3(cross3(n, tu));
  const ht = p.core ? 1.5 : 1.1;
  const at = (sh: number, x: number, y: number): P3 => add3(add3(add3(foot.w, mul3(n, sh)), mul3(tu, x)), mul3(tw, y)) as P3;
  for (const [sx, sy] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]) {
    const q = at(ht, sx * p.a, sy * p.b);
    if (hidden(iso(q, P), depthOf(q, P))) return null;
  }
  const F = G.frameOf(foot.w, n, tu, tw);
  const body = solidSvg(G.prismOf(F, rect(p.a, p.b), 0, ht, P) as never, { tone: "hi", crease: "lo", className: "si-chip" });
  if (!p.core) {
    const pad = rect(p.a + 0.42, p.b + 0.42).map(([x, y]) => iso(at(0.02, x, y), P));
    return { depth: foot.depth, svg: `<path class="si-pad" d="${pathOf(pad, true)}"/>` + body };
  }
  const near: string[] = [];
  const far: string[] = [];
  const legs = (dir: V3, side: V3, half: number, reach: number) => {
    const count = Math.max(2, Math.round((half * 2) / 1.15));
    const d: string[] = [];
    for (let i = 0; i < count; i++) {
      const x = -half + ((i + 0.5) * 2 * half) / count;
      const p0 = add3(add3(add3(foot.w, mul3(n, ht * 0.45)), mul3(dir, reach)), mul3(side, x)) as P3;
      const p1 = add3(add3(add3(foot.w, mul3(n, -0.05)), mul3(dir, reach + 1.3)), mul3(side, x)) as P3;
      d.push(pathOf([iso(p0, P), iso(p1, P)]));
    }
    (dot3(dir, V) > 0 ? near : far).push(d.join(""));
  };
  legs(tu, tw, p.b * 0.86, p.a);
  legs(mul3(tu, -1), tw, p.b * 0.86, p.a);
  legs(tw, tu, p.a * 0.86, p.b);
  legs(mul3(tw, -1), tu, p.a * 0.86, p.b);
  const lid = solidSvg(G.prismOf(F, rect(p.a * 0.64, p.b * 0.64), ht, ht + 0.6, P) as never, { tone: "hi", crease: "none", lit: true, className: "si-core" });
  return { depth: foot.depth, svg: (far.length ? `<path class="si-pin" d="${far.join("")}"/>` : "") + body + (near.length ? `<path class="si-pin" d="${near.join("")}"/>` : "") + lid };
}

/** The bank at a junction of two grooves: four by two square packages, the
    level groove running between its rows and the plumb one between its
    middle columns, all square to one frame; whole or not drawn. */
function bankParts(h: Hull, [u0, w0]: UW): { parts: Part[]; frame: Frame } {
  const F = frameAt(h, u0, w0);
  const a = 2.7;
  const gap = 1.8;
  const pitch = 2 * a + gap;
  const parts: Part[] = [];
  for (const row of [-0.5, 0.5]) {
    for (const col of [-1.5, -0.5, 0.5, 1.5]) {
      const [u, w] = seat(h, u0, w0, F, col * pitch, row * pitch);
      parts.push({ u, w, a, b: a, along: "u" });
    }
  }
  return { parts, frame: F };
}

function partsSvg(h: Hull, side: Side): string {
  const spec = PARTS[side];
  const items: { depth: number; svg: string }[] = [];
  // a strip may run out of view past a fold or the outline, part by part
  for (const p of spec.strips) {
    const it = partSvg(h, p);
    if (it) items.push(it);
  }
  if (spec.bank) {
    const { parts, frame } = bankParts(h, spec.bank);
    const bank = parts.map((p) => partSvg(h, p, frame));
    if (bank.every(Boolean)) items.push(...(bank as { depth: number; svg: string }[]));
  }
  if (spec.core) {
    const it = partSvg(h, { u: spec.core[0], w: spec.core[1], a: 6, b: 6, along: "u", core: true });
    if (it) items.push(it);
  }
  return items
    .sort((x, y) => x.depth - y.depth)
    .map((i) => i.svg)
    .join("");
}

// ─── the looms ──────────────────────────────────────────────────────────────

const bezier = (p0: V3, p1: V3, p2: V3, p3: V3, n = 32): V3[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const a = (1 - t) ** 3;
    const b = 3 * (1 - t) ** 2 * t;
    const c = 3 * (1 - t) * t * t;
    const d = t ** 3;
    return [p0[0] * a + p1[0] * b + p2[0] * c + p3[0] * d, p0[1] * a + p1[1] * b + p2[1] * c + p3[1] * d, p0[2] * a + p1[2] * b + p2[2] * c + p3[2] * d] as V3;
  });

/** The roots the act's tendrils hang from (brainIso's `brainIsoRoots`,
    before projection): four a side on the underside, each with its contour
    angle and its point in the kit's world. */
function rootsOf(side: Side): { t: number; w: V3 }[] {
  const z = -HEMI.down + 3;
  const ring = contour(side, 0.55, 12, z);
  // `contour` lists a left hemisphere's points reversed
  return [1, 4, 7, 10].map((k) => ({ t: (((side < 0 ? 11 - k : k) / 12) * Math.PI * 2) % (Math.PI * 2), w: W(ring[k][0], ring[k][1], z) as V3 }));
}

/** A cable from the crown to the belly: out of a gold collar seated on the
    cap seam, up a hand's breadth, then down an outer flank resting on the
    casting, round under the belly onto the nearest root's meridian, and
    into a gold ferrule seated at that root, where the act's live tendril
    takes over. Its collar's contour angle (it comes down that meridian) and
    its root's, nearest wins. */
interface Fall {
  t: number;
  root: number;
  /** The heights it drifts from its own meridian onto its root's between. */
  drift: [number, number];
}

/** One per hemisphere, each down an outer flank just inside the outline
    the act's camera sees, so it runs past the outline rather than across
    the face: the near hemisphere's back-lateral flank, the far one's lateral
    flank (its collar in view on the cap, the cable going over the edge). */
const FALLS: Record<Side, Fall[]> = {
  // each to the root on its own side of the belly, so it tucks under the
  // outline it came down
  [-1]: [{ t: 5.66, root: 5.24, drift: [104, -30] }],
  [1]: [{ t: 0.3, root: 0.52, drift: [44, -16] }],
} as Record<Side, Fall[]>;
const CABLE_R = 2.1;

const COLLAR = 3.4;
/** The ferrule at a root: its top and bottom, below the root point along
    the fall (it ends above the hull's floor, z −58). */
const FERRULE: [number, number] = [-1.6, 2.4];

interface TubePiece {
  mid: V3;
  points: V3[];
  body: string;
  shine: string;
  shade: string;
  edges: string;
  wide: boolean;
}

/** Tube pieces painted in depth order, far first (a piece is short, so one
    cable may pass in front of one and behind the next, as the kit sorts its
    chunks); a run of one cable's pieces in that order is one group. */
function tubesSvg(list: { cable: number; depth: number; piece: TubePiece }[]): string {
  const sorted = [...list].sort((a, b) => a.depth - b.depth);
  const out: string[] = [];
  let run: TubePiece[] = [];
  let cable = -1;
  const flush = () => {
    if (!run.length) return;
    const body = run.map((p) => p.body).join("");
    const shine = run.filter((p) => p.wide).map((p) => p.shine).join("");
    const shade = run.filter((p) => p.wide).map((p) => p.shade).join("");
    const edges = run.map((p) => p.edges).join("");
    out.push(`<g class="tb si-cable"><path class="tb-body" d="${body}"/>${shine ? `<path class="tb-shine" d="${shine}"/><path class="tb-shade" d="${shade}"/>` : ""}<path class="iso-line tb-edge" data-tone="hi" d="${edges}"/></g>`);
    run = [];
  };
  for (const item of sorted) {
    if (item.cable !== cable) {
      flush();
      cable = item.cable;
    }
    run.push(item.piece);
  }
  flush();
  return out.join("");
}

function collarSvg(o: V3, n: V3, r: number, P: Projection): string {
  return solidSvg(G.disc(-0.8, COLLAR, r + 0.85, G.frameAlong(o, n), P) as never, { tone: "hi", crease: "lo", className: "si-gold" });
}

/** A cable's route, world points, from its collar to the top of its
    root's ferrule. */
function fallRoute(h: Hull, f: Fall, r: number, root: { t: number; w: V3 }): { pts: V3[]; collar: { o: V3; n: V3 } } {
  const side = h.side;
  const a = h.at(f.t, W_CAP);
  const p0 = add3(a.w, mul3(a.n, COLLAR - 0.5));
  // resting on the casting: on the crests of the folds under it (the cable
  // bridges the sulci), along the calm surface's normal
  const rest = (t: number, z: number): V3 => {
    const s = h.at(t, z);
    const c = W(side * LC, 0, z) as V3;
    const out = (q: V3) => Math.hypot(q[0] - c[0], q[1] - c[1]);
    const base = out(s.w);
    let crest = 0;
    for (let d = -0.08; d <= 0.081; d += 0.02) crest = Math.max(crest, out(h.at(t + d, z).w) - base);
    return add3(s.w, mul3(hullNormal(side, t, z, LIGHT_SHAPE), r + 0.4 + crest));
  };
  // down the flank on its own meridian, drifting round onto the root's
  // (taken the short way round) through the widest point, so where the
  // root lies behind the outline the cable slides behind it lengthwise
  // instead of diving under the belly end on to the camera
  const rt = root.t + Math.PI * 2 * Math.round((f.t - root.t) / (Math.PI * 2));
  const [ZA, ZB] = f.drift;
  const Z_LOW = -48;
  const dome: V3[] = [];
  for (let z = W_CAP - 12; z >= Z_LOW; z -= 3) {
    const k = Math.min(1, Math.max(0, (ZA - z) / (ZA - ZB)));
    dome.push(rest(f.t + (rt - f.t) * k * k * (3 - 2 * k), z));
  }
  const lead = unit3(sub3(dome[1], dome[0]));
  const rise = bezier(p0, add3(p0, mul3(a.n, 9)), sub3(dome[0], mul3(lead, 8)), dome[0], 16);
  // into the ferrule's top, heading down along it
  const last = dome[dome.length - 1];
  const top: V3 = [root.w[0], root.w[1], root.w[2] - FERRULE[0]];
  const tail = unit3(sub3(last, dome[dome.length - 2]));
  const seat = bezier(last, add3(last, mul3(tail, 3)), add3(top, [0, 0, 3]), top, 10);
  return { pts: [...rise, ...dome.slice(1), ...seat.slice(1)], collar: { o: a.w, n: a.n } };
}

/** The ferrule at a root: a gold sleeve seated in the casting, axis down,
    the cable entering its top and the act's tendril leaving its foot. */
function ferruleSvg(root: V3, r: number, P: Projection): string {
  return solidSvg(G.disc(FERRULE[0], FERRULE[1], r + 0.85, G.frameAlong(root, [0, 0, -1]), P) as never, { tone: "hi", crease: "lo", className: "si-gold" });
}

function loomSvg(h: Hull, side: Side): { behind: string; front: string } {
  const P = h.P;
  const hidden = occluder(h);
  const behind: { cable: number; depth: number; piece: TubePiece }[] = [];
  const front: { cable: number; depth: number; piece: TubePiece }[] = [];
  const collars: string[] = [];
  const under: string[] = [];
  for (const [ci, f] of FALLS[side].entries()) {
    const root = rootsOf(side).reduce((best, q) => (Math.cos(q.t - f.root) > Math.cos(best.t - f.root) ? q : best));
    const { pts, collar } = fallRoute(h, f, CABLE_R, root);
    // the cable is cut into pieces where it passes behind the outline, so a
    // piece is wholly in view (painted over the hull) or wholly behind it
    // (painted under the hull, which covers it but for its half-width
    // standing out past the outline)
    const out = (q: V3) => hidden(iso(q as P3, P), depthOf(q as P3, P));
    const breaks: number[] = [];
    let walked = 0;
    for (let i = 1; i < pts.length; i++) {
      const step = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]);
      if (out(pts[i]) !== out(pts[i - 1])) breaks.push(walked + step / 2);
      walked += step;
    }
    const pieces = tubePieces(pts as never, CABLE_R, P, { maxLength: 4, spacing: 1.5, breaks: breaks as never }) as unknown as TubePiece[];
    for (const p of pieces) {
      const depth = depthOf(p.mid as P3, P);
      (out(p.mid) ? behind : front).push({ cable: ci, depth, piece: p });
    }
    collars.push(collarSvg(collar.o, collar.n, CABLE_R, P));
    const ferrule = ferruleSvg(root.w, CABLE_R, P);
    if (hidden(iso(root.w as P3, P), depthOf(root.w as P3, P))) under.push(ferrule);
    else collars.push(ferrule);
  }
  return { behind: tubesSvg(behind) + under.join(""), front: tubesSvg(front) + collars.join("") };
}

// ─── one hemisphere ─────────────────────────────────────────────────────────

function hemisphere(side: Side, view: BrainView, m: Material): string {
  const h = makeHull(side, { view, shape: SHAPE, grid: GRID, lightShape: LIGHT_SHAPE });
  const hull = castSvg(h, m);
  const seams = seamSvg(h, [SYLVIAN], m) + seamSvg(h, CENTRAL, m) + seamSvg(h, [CAP], m);
  const chips = partsSvg(h, side);
  const looms = loomSvg(h, side);
  return `<g class="si">${looms.behind}</g>${hull}<g class="si">${seams}${chips}${looms.front}</g>`;
}

function silicaSvg({ view, only, light, tones }: MindOptions): string {
  const m = materialOf(light);
  const sides = only ? [only] : sidesFarFirst(view);
  const body = sides.map((side) => hemisphere(side, view, m)).join("");
  return mindSvg({ view, light, tones, body, css: m.css });
}

export const silica: MindDirection = {
  id: "d4",
  round: 1,
  name: "Silica",
  line: "A white silica casting in a few panels, chip packages set flush in it and cable looms rising from the crown, gold only where metal touches.",
  svg: silicaSvg,
};
