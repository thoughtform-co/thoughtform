import { HEMI, W } from "@/components/arcs/figures/foundation/brainIso";
import { depthOf, iso, type Flat } from "@/components/arcs/figures/foundation/isoKit";
import { bundle } from "@/components/xb-proposal/kit/trace";
import { bandsFor, makeHull, mindSvg, mix, mouthD, occluder, rampOf, sidesFarFirst, silhouetteD, T_UNIT, U_ROUND, type Hull, type MindTones, type Side } from "../hull";
import { Ink, inset, lane, lateralAt, LIGHT_SHAPE, paintPiece, paintPlan, patchPieces, rectPoly, wholeOn, type Cut, type Fn, type P2, type Pt3, type Region, type Stroke, type Texture, type WorldPlan } from "./floorplan.parts";
import type { MindDirection, MindOptions } from "./types";

/**
 * Floorplan (machine-mind lab, D2; owner, 2026-10-17: "How can we use the
 * aesthetic of circuit boards and machines to make something look really
 * elegant?"). The brain's map is the chip's map: the cortex is a die's
 * floorplan laid onto the smooth hull, read the way a die shot reads from a
 * distance, blocks and channels first, the cells inside second.
 *
 * The plan is drawn in the brain's own space, not on a chart: every channel
 * is the hull cut by a plane, so it runs straight across the crown (seen
 * from above, squared to the stage's axes) and plumb, level or at 45° down
 * the sides, with no seam where one becomes the other. Every block is the
 * surface between channels, and its cells are a family of parallel cuts.
 *
 *   channels  the sulci: the central sulcus across the crown and down the
 *             flank, bending to 45° to meet the Sylvian fissure, which runs
 *             level and rises at 45° to the back; the parieto-occipital
 *             across the crown and down the flank, jogging back at 45°; the
 *             temporal pole's edge; thin secondary ones (superior frontal,
 *             superior temporal, the parietal's own, seen from above) and a
 *             45° cut at the frontal corner. No channel runs round the dome.
 *   blocks    a few large ones, told apart by their ground first and by
 *             three kinds of cells second: a fine hatch (logic: frontal,
 *             temporal), a fine lattice in faint banks (SRAM: parietal,
 *             squared to the crown on the crown, plumb and level on the
 *             flank), identical small tiles (array: occipital)
 *   core      the one lit block, flush in the parietal SRAM: a keep-out ring
 *             of bond pads round it, a seal ring and cells inside, one gold
 *             bus out along a spur and down the central sulcus to the
 *             Sylvian fissure
 *   pads      the I/O ring on each belly; a pair of bond wires drops straight
 *             from it at a root the act's tendrils hang from, ending on vias
 *
 * The light comes from the hull eased to a quarter fold (`LIGHT_SHAPE`), so
 * the tone bands sweep the dome; every ink rides them and fades as the
 * surface turns away.
 */

// ─── the plan, in the brain's space (X across, lateral +; Y front; Z up) ──

/** Half a main channel, and half a secondary one. */
const H = 1.9;
const H2 = 0.9;
const S2 = Math.SQRT2;
/** The floorplan's floor (the pad ring is under it). */
const Z_FLOOR = -16.5;
/** The sulci, seen from the side (Y, Z): the central sulcus at Y_C, plumb
    down to Z_K, then 45° forward to the Sylvian fissure at Z_SYL, which
    bends up at 45° behind Y_SB; the parieto-occipital at Y_P; the temporal
    pole's edge at Y_TP; the superior temporal at Z_STS. */
const Y_C = 12;
const Z_K = 70;
const Z_SYL = 30;
const Y_SB = -12;
const Y_P = -58;
/** The parieto-occipital's 45° jog back, between Z_PO and Z_PO - JOG. */
const Z_PO = 75;
const JOG = 30;
const Y_TP = 76;
const Z_STS = 4;
/** Seen from above (X, Y): the superior frontal sulcus at X_SF, from the
    central sulcus forward, and the 45° cut at the frontal corner from
    (X_SF, Y_D). */
const X_SF = 14;
const Y_D = 40;
/** The parietal's own secondary channel, seen from above at X_IP, between
    the two sulci: the crown's SRAM on one side, the flank's on the other. */
const X_IP = 80;
const DIAG = X_SF - Y_D;
/** The core, its keep-out ring, its bus's run, on the crown. */
const CORE = { x0: 10, x1: 40, y0: -38, y1: -8 };
const KEEP = 6;
const BUS_X = 25;
const Z_CROWN_ZONE = 100;
/** The pad ring under the floorplan, and the roots' height. */
const PADS = { w0: -25.5, w1: -21.5, size: 3.6, count: 104 };
const Z_ROOT = -HEMI.down + 3;

const centralY = (z: number) => Y_C + Math.max(0, Z_K - z);
const occipitalY = (z: number) => Y_P - Math.min(JOG, Math.max(0, Z_PO - z));
const sylvianZ = (y: number) => Z_SYL + Math.max(0, Y_SB - y);
const NOTCH = 7;
const insideCore = (X: number, Y: number) => X >= CORE.x0 && X <= CORE.x1 && Y >= CORE.y0 && Y <= CORE.y1 && X + Y >= CORE.x0 + CORE.y0 + NOTCH;
const CORE_IN = 3.4;
const insideCoreIn = (X: number, Y: number) =>
  X >= CORE.x0 + CORE_IN && X <= CORE.x1 - CORE_IN && Y >= CORE.y0 + CORE_IN && Y <= CORE.y1 - CORE_IN && X + Y >= CORE.x0 + CORE.y0 + NOTCH + CORE_IN * S2;
const K = { x0: CORE.x0 - KEEP, x1: CORE.x1 + KEEP, y0: CORE.y0 - KEEP, y1: CORE.y1 + KEEP };
/** The bond pads round the core: small squares midway across the keep-out,
    none where the bus leaves. */
const BOND: P2[] = (() => {
  const out: P2[] = [];
  const r = 3;
  for (let x = CORE.x0 + 2; x <= CORE.x1 - 2 + 1e-9; x += 3.25) {
    out.push([x, CORE.y0 - r]);
    if (Math.abs(x - BUS_X) > 2.6) out.push([x, CORE.y1 + r]);
  }
  for (let y = CORE.y0 + 2; y <= CORE.y1 - 2 + 1e-9; y += 3.25) out.push([CORE.x0 - r, y], [CORE.x1 + r, y]);
  return out;
})();
const BOND_HALF = 0.9;

type Kind = keyof typeof LOOK;

interface Lanes {
  cuts: Cut[];
  holds: (P: Pt3) => boolean;
}

function lanesOf(): Lanes {
  const all = [
    lane("YZ", [[Y_C, 400], [Y_C, Z_K], [Y_C + (Z_K - Z_SYL), Z_SYL]], H),
    lane("YZ", [[Y_P, Z_SYL + (Y_SB - Y_P)], [Y_SB, Z_SYL], [Y_TP, Z_SYL]], H),
    lane("YZ", [[Y_P, 400], [Y_P, Z_PO], [Y_P - JOG, Z_PO - JOG], [Y_P - JOG, Z_FLOOR]], H),
    lane("YZ", [[Y_TP, Z_SYL], [Y_TP, Z_FLOOR]], H),
    lane("YZ", [[Y_P - JOG, Z_STS], [Y_TP, Z_STS]], H2),
    lane("XY", [[X_SF, Y_C], [X_SF, 400]], H2),
    lane("XY", [[X_SF, Y_D], [X_SF + 300, Y_D + 300]], H2),
    lane("XY", [[X_IP, Y_P], [X_IP, Y_C]], H2),
  ];
  return { cuts: all.flatMap((l) => l.cuts), holds: (P) => all.some((l) => l.holds(P)) };
}

/** Linear functions of a point, for the cuts. */
const fX: Fn = (P) => P[0];
const fY: Fn = (P) => P[1];
const fZ: Fn = (P) => P[2];
const fXY: Fn = (P) => P[0] + P[1];

let known: { core: boolean; lanes: Lanes; cuts: Cut[]; classify: (P: Pt3) => string } | null = null;
let knownSide: { core: boolean; lanes: Lanes; cuts: Cut[]; classify: (P: Pt3) => string } | null = null;

/** The plan's cuts and its classifier, for the side with the core or not. */
function planOf(core: boolean) {
  const cache = core ? known : knownSide;
  if (cache) return cache;
  const lanes = lanesOf();
  const cuts: Cut[] = [{ f: fZ, th: Z_FLOOR }, ...lanes.cuts];
  if (core) {
    const box: [Pt3, Pt3] = [
      [K.x0 - 1, K.y0 - 1, Z_CROWN_ZONE - 5],
      [K.x1 + 1, Y_C + 1, 999],
    ];
    const local: Cut[] = [];
    local.push(
      { f: fX, th: CORE.x0 },
      { f: fX, th: CORE.x1 },
      { f: fY, th: CORE.y0 },
      { f: fY, th: CORE.y1 },
      { f: fXY, th: CORE.x0 + CORE.y0 + NOTCH },
      { f: fX, th: CORE.x0 + CORE_IN },
      { f: fX, th: CORE.x1 - CORE_IN },
      { f: fY, th: CORE.y0 + CORE_IN },
      { f: fY, th: CORE.y1 - CORE_IN },
      { f: fXY, th: CORE.x0 + CORE.y0 + NOTCH + CORE_IN * S2 },
      { f: fX, th: K.x0 },
      { f: fX, th: K.x1 },
      { f: fY, th: K.y0 },
      { f: fY, th: K.y1 },
      { f: fX, th: BUS_X - H },
      { f: fX, th: BUS_X + H }
    );
    for (const [x, y] of BOND) {
      const pad: [Pt3, Pt3] = [
        [x - 1.5, y - 1.5, Z_CROWN_ZONE - 5],
        [x + 1.5, y + 1.5, 999],
      ];
      for (const cut of [
        { f: fX, th: x - BOND_HALF },
        { f: fX, th: x + BOND_HALF },
        { f: fY, th: y - BOND_HALF },
        { f: fY, th: y + BOND_HALF },
      ])
        cuts.push({ ...cut, box: pad });
    }
    for (const cut of local) cuts.push({ ...cut, box });
  }
  const classify = (P: Pt3): string => {
    const [X, Y, Z] = P;
    if (Z < Z_FLOOR) return "bare";
    if (core && Z > Z_CROWN_ZONE) {
      if (insideCoreIn(X, Y)) return "coreIn";
      if (insideCore(X, Y)) return "coreRim";
      if (X >= K.x0 && X <= K.x1 && Y >= K.y0 && Y <= K.y1) {
        return BOND.some(([bx, by]) => Math.abs(X - bx) <= BOND_HALF && Math.abs(Y - by) <= BOND_HALF) ? "pad" : "bare";
      }
      if (Math.abs(X - BUS_X) < H && Y > K.y1 && Y < Y_C) return "bare";
    }
    if (lanes.holds(P)) return "bare";
    if (Y < occipitalY(Z)) return "occipital";
    const frontal = () => (X < X_SF ? "frontalMedial" : X - Y < DIAG ? "frontalFront" : "frontalSide");
    if (Z < sylvianZ(Y)) return Y < Y_TP ? (Z < Z_STS ? "temporalLo" : "temporalHi") : frontal();
    if (Y > centralY(Z)) return frontal();
    return X < X_IP ? "parietalCrown" : "parietalSide";
  };
  const plan = { core, lanes, cuts, classify };
  if (core) known = plan;
  else knownSide = plan;
  return plan;
}

// ─── the materials ──────────────────────────────────────────────────────────

const TONES_N = 6;
const BANDS = bandsFor(TONES_N);
/** The hull's grid the plan is painted on. */
const GRID = { cols: 156, lower: 9, upper: 38 };
/** Each kind's ground (a lift of the silicon toward the ink) and its cells'
    ink over that ground; the blocks' edges along the channels; the pads. */
const LOOK = {
  frontal: { ground: 0.055, ink: 0.12 },
  temporal: { ground: 0.04, ink: 0.12 },
  sram: { ground: 0.11, ink: 0.09 },
  array: { ground: 0.02, ink: 0.22 },
} as const;
const OUTLINE = 0.22;
const PAD = 0.25;

interface Material {
  silicon: string[];
  core: string[];
  ink: string;
  ground: string;
  lit: string;
  gold: string;
  edge: string;
  /** Ink strength, scaled per theme (dark ink on paper reads weaker). */
  k: number;
}

function materialOf(light: boolean, tones: MindTones): Material {
  const base = { ink: tones.ink, ground: tones.ground, lit: tones.lit, gold: tones.gold };
  if (light) return { ...base, silicon: rampOf("#bab3a3", "#f5f0e5", TONES_N), core: rampOf("#c09848", "#ead293", TONES_N), edge: "#6e6658", k: 1.3 };
  return { ...base, silicon: rampOf("#0b0b0a", "#36332d", TONES_N), core: rampOf("#36290f", "#94742f", TONES_N), edge: "#8a8274", k: 1.45 };
}

const lift = (m: Material, k: number) => m.silicon.map((c) => mix(c, m.ink, k * m.k));

function regionsOf(m: Material): Record<string, Region> {
  const block = (kind: Kind, textures: Texture[]): Region => ({ ramp: lift(m, LOOK[kind].ground), textures, outline: OUTLINE * m.k, to: m.ink });
  const hatch = (f: Fn, kind: "frontal" | "temporal", pitch = 2): Texture => ({ f, pitch, width: 0.26, ink: LOOK[kind].ink * m.k });
  // SRAM: a fine lattice in faint banks, squared to the crown on the crown
  // and plumb and level on the flank
  const sram = (f: Fn, g: Fn): Texture[] => [
    { f, pitch: 2.2, width: 0.24, ink: LOOK.sram.ink * m.k, bank: { every: 12, g, pitch: 2.2 } },
    { f: g, pitch: 2.2, width: 0.24, ink: LOOK.sram.ink * m.k, bank: { every: 12, g: f, pitch: 2.2 } },
  ];
  // identical tiles: each edge a dashed family, two either way
  const tile = 4.8;
  const pitch = 6.4;
  const edge = (f: Fn, g: Fn, shift: number): Texture => ({ f: (P) => f(P) - shift, pitch, width: 0.3, ink: LOOK.array.ink * m.k, dash: { g, pitch, on: tile } });
  const tiles = [edge(fX, fY, 0), edge(fX, fY, tile), edge(fY, fX, 0), edge(fY, fX, tile)];
  return {
    bare: { ramp: m.silicon },
    frontalMedial: block("frontal", [hatch(fX, "frontal")]),
    frontalFront: block("frontal", [hatch(fX, "frontal")]),
    frontalSide: block("frontal", [hatch(fY, "frontal")]),
    temporalHi: block("temporal", [hatch(fZ, "temporal", 2.3)]),
    temporalLo: block("temporal", [hatch(fZ, "temporal", 2.3)]),
    parietalCrown: block("sram", sram(fX, fY)),
    parietalSide: block("sram", sram(fY, fZ)),
    occipital: block("array", tiles),
    coreRim: { ramp: m.core, outline: 1, to: m.lit },
    coreIn: { ramp: m.core, textures: [cells(fX), cells(fY)], to: m.lit },
    pad: { ramp: lift(m, PAD) },
  };
}

/** The core's cells, a lattice inked toward the lit gold. */
const cells = (f: Fn): Texture => ({ f, pitch: 2.6, width: 0.26, ink: 0.32 });

/** The strokes: the core's seal ring, and its gold bus, three lines out of
    its front edge, along a spur, a 45° turn into the central sulcus, across
    the crown and down the sulcus to the Sylvian fissure. */
function strokesOf(m: Material): { strokes: Stroke[]; ends: { Y: number; Z: number }[] } {
  const strokes: Stroke[] = [];
  const onCrown = { f: fZ, lo: Z_CROWN_ZONE, hi: 999 };
  // a segment seen from above, as a stroke
  const planSeg = (a: P2, b: P2, colour: Stroke["colour"], width: number, extra: Stroke["limits"] = []): Stroke => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const d: P2 = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    return {
      f: (P) => d[0] * (P[1] - a[1]) - d[1] * (P[0] - a[0]),
      limits: [{ f: (P) => (P[0] - a[0]) * d[0] + (P[1] - a[1]) * d[1], lo: 0, hi: len }, onCrown, ...extra],
      width,
      colour,
    };
  };
  // the seal ring, inside the core's edge, cut at the same corner
  const ring: P2[] = [
    [CORE.x0 + NOTCH, CORE.y0],
    [CORE.x1, CORE.y0],
    [CORE.x1, CORE.y1],
    [CORE.x0, CORE.y1],
    [CORE.x0, CORE.y0 + NOTCH],
  ];
  const seal = inset(ring, 1.7);
  const sealColour: Stroke["colour"] = (band, fade) => mix(m.core[Math.min(m.core.length - 1, band)], m.lit, 0.75 * Math.max(0.35, fade));
  seal.forEach((a, i) => strokes.push(planSeg(a, seal[(i + 1) % seal.length], sealColour, 0.4)));
  // the bus
  const gold: Stroke["colour"] = () => m.gold;
  const ends: { Y: number; Z: number }[] = [];
  for (const line of bundle(
    [
      [BUS_X, CORE.y1],
      [BUS_X, Y_C - 2],
      [BUS_X + 2, Y_C],
      [BUS_X + 3, Y_C],
    ],
    3,
    1
  )) {
    const p = line as P2[];
    strokes.push(planSeg(p[0], p[1], gold, 0.34), planSeg(p[1], p[2], gold, 0.34));
    // along the sulcus: plumb (a cut at constant Y) down to its bend, then
    // the 45° cut, its offset in the lane kept, to the Sylvian fissure
    const o = p[2][1] - Y_C;
    const zBend = Z_K + (S2 - 1) * o;
    strokes.push({ f: (P) => P[1] - (Y_C + o), limits: [{ f: fX, lo: p[2][0], hi: 999 }, { f: fZ, lo: zBend, hi: 999 }], width: 0.34, colour: gold });
    const c = Y_C + Z_K + S2 * o;
    strokes.push({ f: (P) => P[1] + P[2] - c, limits: [{ f: fX, lo: 0, hi: 999 }, { f: fZ, lo: Z_SYL, hi: zBend }], width: 0.34, colour: gold });
    ends.push({ Y: c - Z_SYL, Z: Z_SYL });
  }
  return { strokes, ends };
}

// ─── the pad ring and the bond wires ────────────────────────────────────────

/** The contour angles of the hemisphere's roots (brainIso's
    `brainIsoRoots`: four points on its underside, at 30°, 120°, 210° and
    300°), where the act's tendrils hang. */
const ROOTS_T = [1, 4, 7, 10].map((k) => (k / 12) * Math.PI * 2);
const EVERY = () => true;

/** The pad ring round the belly, a row of small square pads, each a part
    (drawn whole or not at all), and a pair of bond wires from the pads over
    each root in sight, each straight down to the roots' height, ending on a
    via (the owner's sixth reference: traces drip from the chin and end in
    vias). */
function drawPads(ink: Ink, h: Hull, m: Material) {
  const pitch = U_ROUND / PADS.count;
  const padRamp = lift(m, PAD);
  const shown = new Set<number>();
  for (let k = 0; k < PADS.count; k++) {
    const u = (k + 0.5) * pitch;
    const poly = rectPoly(u - PADS.size / 2, u + PADS.size / 2, PADS.w0, PADS.w1);
    if (!wholeOn(h, poly, EVERY)) continue;
    shown.add(k);
    for (const piece of patchPieces(h, poly, EVERY, 4)) paintPiece(ink, piece, padRamp, BANDS);
  }
  const hidden = occluder(h);
  const P = h.P;
  const pw = (PADS.w0 + PADS.w1) / 2;
  for (const t of ROOTS_T) {
    const k0 = Math.floor((t * T_UNIT) / pitch - 0.5);
    const drops: { top: Flat; end: Flat }[] = [];
    for (const kk of [k0, k0 + 1]) {
      const k = ((kk % PADS.count) + PADS.count) % PADS.count;
      if (!shown.has(k)) break;
      const top = h.at(((k + 0.5) * pitch) / T_UNIT, pw);
      const [l, f] = [-top.w[1], top.w[0]];
      const at = (z: number) => {
        const wpt = W(l, f, z);
        return { xy: iso(wpt, P), d: depthOf(wpt, P) };
      };
      // a drop counts only when it is in sight from pad to via
      let clear = true;
      for (let z = pw; z >= Z_ROOT && clear; z -= 1.5) {
        const q = at(z);
        clear = !hidden(q.xy, q.d);
      }
      if (!clear) break;
      drops.push({ top: top.xy, end: at(Z_ROOT).xy });
    }
    // a pair, or nothing
    if (drops.length < 2) continue;
    for (const { top, end } of drops) {
      ink.line(m.gold, 0.5, [top, end]);
      const ring = Array.from({ length: 17 }, (_, i): Flat => [end[0] + 1.25 * Math.cos((i / 16) * Math.PI * 2), end[1] + 1.25 * Math.sin((i / 16) * Math.PI * 2)]);
      ink.fill(m.ground, ring);
      ink.line(m.gold, 0.5, ring);
    }
  }
}

// ─── the picture ────────────────────────────────────────────────────────────

function hemisphere(side: Side, o: MindOptions, m: Material): string {
  const h = makeHull(side, { view: o.view, grid: GRID, lightShape: LIGHT_SHAPE });
  const core = side === -1;
  const plan = planOf(core);
  const bus = core ? strokesOf(m) : { strokes: [], ends: [] };
  const world: WorldPlan = { cuts: plan.cuts, classify: plan.classify, regions: regionsOf(m), strokes: bus.strokes };
  const ink = new Ink();
  // the bus ends on three vias in the Sylvian fissure
  for (const e of bus.ends) {
    const xy = lateralAt(h, e.Y, e.Z);
    if (xy) ink.fill(m.gold, Array.from({ length: 12 }, (_, i): Flat => [xy[0] + 0.6 * Math.cos((i / 12) * Math.PI * 2), xy[1] + 0.6 * Math.sin((i / 12) * Math.PI * 2)]));
  }
  drawPads(ink, h, m);
  return `<g class="mm-fp">${paintPlan(h, world, BANDS)}${ink.svg()}</g><path class="mm-fp-edge" fill="none" stroke="${m.edge}" stroke-width="0.6" stroke-linecap="round" d="${silhouetteD(h)}${mouthD(h)}"/>`;
}

export function floorplanSvg(o: MindOptions): string {
  const m = materialOf(o.light, o.tones);
  const sides = o.only ? [o.only] : sidesFarFirst(o.view);
  const body = sides.map((side) => hemisphere(side, o, m)).join("");
  return mindSvg({ view: o.view, light: o.light, tones: o.tones, body, css: ".mm-fp path,.mm-fp-edge{vector-effect:none}" });
}

/** Floorplan (machine-mind lab, 2026-10-17). */
export const floorplan: MindDirection = {
  id: "d2",
  round: 1,
  name: "Floorplan",
  line: "The cortex laid out as a die: a few large blocks, channels in the sulci, a pad ring round the base and one lit core wired into the network.",
  svg: floorplanSvg,
};
