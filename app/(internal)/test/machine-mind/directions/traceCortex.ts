import { hullPoint, lineD, makeHull, mindSvg, polyD, rampOf, seen, sidesFarFirst, silhouetteD, T_UNIT, type Hull, type HullShape, type Side, type UW } from "../hull";
import { LC, W } from "@/components/arcs/figures/foundation/brainIso";
import { iso, type Flat } from "@/components/arcs/figures/foundation/isoKit";
import { offset } from "@/components/xb-proposal/kit/trace";
import { afOf, crownLine, crownPad, crownTZ, cut, from, gridSampler, inRegions, lengths, pointAt, roundPad, skinSvg, thin, upTo, type Half, type Region, type Skin } from "./traceCortex.parts";
import type { MindDirection, MindOptions } from "./types";

/**
 * D1 · Trace Cortex (machine-mind lab, 2026-10-17; references 4–6: the Great
 * Wave and the face drawn in circuit traces).
 *
 * The brain's own hull in solder mask, shaded as one sculpted form (its
 * light from a gentler fold than the one drawn). The whole form is drawn in
 * gold traces at one pitch running up the fold's crest bands, 45° in
 * (u, w), a bus that falls behind its band jogging level once to catch it
 * up. Density and weight do the shading, as in the face poster: in the
 * light a gyrus carries up to seventeen traces in three buses, its outer
 * traces stepping off in staggered vias; in shadow it thins to a few fine
 * single traces; a sulcus is dark mask with one hairline. The near crown's
 * buses run up into a copper ring round the core die, the one lit part, its
 * pins fanned out to vias on all four sides; the far crown's buses land on
 * vias round a smaller unlit package. Every trace ends in copper or on a
 * via, never on bare mask.
 */

/** The shape drawn (a gentler fold than brainIso's, so the traces run
    clean; the outline reads as today's) and the shape the light is taken
    from (gentler still, so the mask's bands sweep the dome). */
const SHAPE: HullShape = { fold: 0.55 };
const LIGHT: HullShape = { fold: 0.25 };

/** Traces: their pitch, how much shorter each rank out from a bus's centre
    runs at a free end, where they start at the base and where a bus that
    meets no part stops under the crown. */
const PITCH = 3;
const TAPER = 5;
const W_LO = -56;
const W_TB = 126;
/** How squarely a trace must face the viewer to be drawn: past this it
    ends on a via before the limb, rather than running onto the outline. */
const FACING = 0.3;

/** A package in the crown's frame: its centre and half-width, its pins (per
    side, pitch) and their fan-out (splayed to `spread`, ending on vias at
    two staggered distances from the body). */
interface Package {
  a: number;
  f: number;
  half: number;
  pins: number;
  pitch: number;
  spread: number;
  fan: [number, number];
}
/** The core die on the near crown, in a clearance window in its copper
    ring; the far crown's smaller, unlit package, its buses landing on vias
    on a square round it. */
const DIE_SIDE: Side = -1;
const DIE: Package = { a: 32, f: 14, half: 10, pins: 6, pitch: 2.4, spread: 3.4, fan: [11, 15.5] };
const WINDOW = DIE.half + 18;
const RING = { half: WINDOW + 8, cut: 10 };
const CHIP: Package = { a: 18, f: 30, half: 7, pins: 4, pitch: 2.6, spread: 3.4, fan: [8, 11.5] };
const LANDING = CHIP.half + 15;

// ─── the bands and their buses ──────────────────────────────────────────────

/** The crest bands of the ripple's main term, 5t + 0.045z = π/2 + 2πj, as u
    at height w (they climb at du/dw = −1.08); j + ½ is the sulcus between. */
const bandU = (j: number, w: number) => 24 * (Math.PI / 2 + 2 * Math.PI * j) - 1.08 * w;
const BANDS = [-2, -1, 0, 1, 2, 3];

/** A band's route, bottom to top: 45° up the band, a level jog wherever it
    falls more than `JOG` behind it on the folded flank (the bands start out
    of step, so their jogs fall at different heights). */
const JOG = 9;
function routeOf(j: number, w0: number, w1: number): UW[] {
  let u = bandU(j, w0) + JOG * 0.85 * ((((j * 0.618 + 0.3) % 1) + 1) % 1);
  let w = w0;
  const pts: UW[] = [[u, w]];
  while (w < w1) {
    const step = Math.min(1, w1 - w);
    u -= step;
    w += step;
    if (u - bandU(j, w) > JOG && w < 106 && Math.cos(u / T_UNIT) > 0.45) {
      pts.push([u, w]);
      u = bandU(j, w);
      pts.push([u, w]);
    }
  }
  pts.push([u, w]);
  return pts;
}

/** How a trace's top ends: in copper (flush, no via), landed on a part's
    via square (flush, a via) or free under the crown (tapered, a via). */
type Top = "copper" | "land" | "free";

interface Trace {
  pts: UW[];
  /** The sulcus's single hairline. */
  hair?: boolean;
  /** A via at the start, at the end. */
  vias: [boolean, boolean];
}

/** How much light a trace at (u, w) running across (nu, nw) is given. */
type Light = (u: number, w: number, nu: number, nw: number) => number;

/** A bus: `n` traces at one pitch round a centre line `d` off the band's
    route. A trace of rank r (0 at the centre) is drawn along the longest
    run where the light reaches `need[r]`; a free end is `TAPER` shorter per
    rank, so the bus ends in a staggered row of vias. */
function busOf(route: UW[], d: number, n: number, need: readonly number[], light: Light, top: (pts: UW[]) => { pts: UW[]; end: Top }): Trace[] {
  const out: Trace[] = [];
  for (let m = 0; m < n; m++) {
    const rank = Math.abs(m - (n - 1) / 2);
    const { pts: copy, end } = top(from(offset(route, d + (m - (n - 1) / 2) * PITCH) as UW[], W_LO));
    if (copy.length < 2) continue;
    const L = lengths(copy);
    const total = L[L.length - 1] - (end === "free" ? rank * TAPER : 0);
    const s0 = rank * TAPER;
    if (total - s0 < 12) continue;
    const req = need[Math.round(rank)];
    let best: [number, number] | null = null;
    let open: number | null = null;
    const N = Math.ceil((total - s0) / 2);
    for (let i = 0; i <= N; i++) {
      const s = s0 + ((total - s0) * i) / N;
      const p = pointAt(copy, L, s);
      const q = pointAt(copy, L, Math.min(total, s + 0.5));
      const r = pointAt(copy, L, Math.max(0, s - 0.5));
      const len = Math.hypot(q[0] - r[0], q[1] - r[1]) || 1;
      const ok = light(p[0], p[1], -(q[1] - r[1]) / len, (q[0] - r[0]) / len) >= req;
      if (ok && open === null) open = s;
      if ((!ok || i === N) && open !== null) {
        if (!best || s - open > best[1] - best[0]) best = [open, s];
        open = null;
      }
    }
    if (!best || best[1] - best[0] < 24) continue;
    const whole = best[1] >= total - 0.5;
    out.push({ pts: cut(copy, best[0], best[1]), vias: [true, end !== "copper" || !whole] });
  }
  return out;
}

/** Every band's buses on one hemisphere: a centre bus of seven and a bus of
    five either side, the outer traces only where the light falls (the
    flank buses' only on the folded half), so in shadow a band is a few
    single traces; and a hairline down every sulcus. */
function tracesOf(h: Hull): Trace[] {
  // the light a trace is given, less where traces crowd on the screen (a
  // band turning toward the limb, or bunched by the contour's parameter):
  // there a bus thins to its centre. The neighbour's offset is measured
  // square to the trace's own screen direction, since a sheared pair lies
  // closer than the offset's length says.
  const at = gridSampler(h);
  const xyOf = (u: number, w: number) => at(u, w).xy;
  const light: Light = (u, w, nu, nw) => {
    const s = at(u, w);
    const o = xyOf(u + nu, w + nw);
    const q = xyOf(u + nw, w - nu);
    const ax = o[0] - s.xy[0];
    const ay = o[1] - s.xy[1];
    const tx = q[0] - s.xy[0];
    const ty = q[1] - s.xy[1];
    const pitch = (Math.abs(ax * ty - ay * tx) / (Math.hypot(tx, ty) || 1)) * PITCH;
    const room = Math.max(0, Math.min(1, pitch - 1.2));
    return Math.max(0, Math.min(1, s.lit / 0.8)) * room - (1 - room) * 0.5;
  };
  const folded: Light = (u, w, nu, nw) => light(u, w, nu, nw) * Math.max(0, Math.min(1, (Math.cos(u / T_UNIT) - 0.05) / 0.3));
  // a trace climbs until it runs into the crown's part (the die's copper
  // ring, the far package's via square) or, missing it, stops under the
  // crown
  const target = h.side === DIE_SIDE ? ringOf() : [squareOf(CHIP.a, CHIP.f, LANDING, 6)];
  const reach: Top = h.side === DIE_SIDE ? "copper" : "land";
  const top = (pts: UW[]): { pts: UW[]; end: Top } => {
    if (pts.length < 2) return { pts: [], end: "free" };
    const out: UW[] = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const [u0, w0] = pts[i - 1];
      const [u1, w1] = pts[i];
      const n = Math.max(1, Math.ceil(Math.hypot(u1 - u0, w1 - w0)));
      for (let k = 1; k <= n; k++) {
        const u = u0 + ((u1 - u0) * k) / n;
        const w = w0 + ((w1 - w0) * k) / n;
        if (w > W_TB + 26) return { pts: upTo(pts, W_TB), end: "free" };
        if (w > 88 && inRegions(target, ...afOf(h.side, hullPoint(h.side, u / T_UNIT, w, SHAPE)))) {
          out.push([u, w]);
          return { pts: out, end: reach };
        }
      }
      out.push(pts[i]);
    }
    return { pts: upTo(pts, W_TB), end: "free" };
  };
  const out: Trace[] = [];
  for (const j of BANDS) {
    for (const t of busOf(routeOf(j + 0.5, W_LO, W_TB + 40), 0, 1, [-9], light, top)) out.push({ ...t, hair: true });
    const route = routeOf(j, W_LO, W_TB + 40);
    out.push(...busOf(route, 0, 7, [-9, -0.2, 0.35, 0.6], light, top));
    for (const sgn of [-1, 1]) out.push(...busOf(route, sgn * 21, 5, [-9, 0.6, 0.8], folded, top));
  }
  return out;
}

// ─── the crown's parts ──────────────────────────────────────────────────────

/** A square in the crown's frame round (a, f), half-width `half`, its
    corners cut at 45° by `cut`. */
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

/** The die's copper ring: its square less the clearance window, as four
    convex pieces. */
function ringOf(): Region[] {
  const outer = squareOf(DIE.a, DIE.f, RING.half, RING.cut);
  const { a, f } = DIE;
  const edge: Half[] = [
    [0, 1, -(f + WINDOW)],
    [0, -1, f - WINDOW],
    [1, 0, -(a + WINDOW)],
    [-1, 0, a - WINDOW],
  ];
  const band: Half[] = [
    [0, 1, -(f - WINDOW)],
    [0, -1, f + WINDOW],
  ];
  return [
    [...outer, edge[0]],
    [...outer, edge[1]],
    [...outer, edge[2], ...band],
    [...outer, edge[3], ...band],
  ];
}

/** The vias stitching the ring to the plane under it: one fence on the
    ring's centre line, every via wholly in copper. */
function fenceOf(): [number, number][] {
  const ring = ringOf();
  const inside = (a: number, f: number) => [0, Math.PI / 2, Math.PI, Math.PI * 1.5].every((k) => inRegions(ring, a + 2.4 * Math.cos(k), f + 2.4 * Math.sin(k)));
  const r = WINDOW + 4;
  const out: [number, number][] = [];
  for (let s = -r + 6; s <= r - 6; s += 6) out.push([DIE.a + s, DIE.f - r], [DIE.a + s, DIE.f + r], [DIE.a - r, DIE.f + s], [DIE.a + r, DIE.f + s]);
  return out.filter(([a, f]) => inside(a, f));
}

// ─── the paint ──────────────────────────────────────────────────────────────

interface Body {
  top: string;
  walls: [string, string];
  edge: string;
}

interface Paint extends Skin {
  /** Trace tones: in shadow or near the limb, mid, lit. */
  tiers: string[];
  via: string;
  drill: string;
  edge: string;
  die: Body;
  chip: Body;
}

function paintOf(light: boolean, tones: MindOptions["tones"]): Paint {
  const bands = { maskBands: [0.05, 0.35, 0.6], pourBands: [0.45, 0.8] };
  return light
    ? { ...bands, mask: rampOf("#d9d0bd", "#f4efe4", 4), pour: rampOf("#cfb57c", "#e9d6a2", 3), tiers: ["#b39c66", "#a08442", tones.gold], via: tones.gold, drill: "#efe9dc", edge: "#8a8274", die: { top: "#d9b65c", walls: ["#b8963e", "#9a7a2c"], edge: tones.lit }, chip: { top: "#e3d8bf", walls: ["#d2c5a7", "#c2b494"], edge: tones.gold } }
    : { ...bands, mask: rampOf("#100f0c", "#2f2a20", 4), pour: rampOf("#3e3219", "#6b5528", 3), tiers: ["#6a5729", "#9a7e3e", tones.gold], via: tones.gold, drill: "#0d0c0a", edge: "#3a352d", die: { top: "#c9a04a", walls: ["#6a5424", "#4a3c1c"], edge: tones.lit }, chip: { top: "#2c261b", walls: ["#221d15", "#18150f"], edge: tones.gold } };
}

// ─── the packages ───────────────────────────────────────────────────────────

/** A package on the crown: its fan-out on the surface (each pin's trace
    splays to `spread` and ends on a via, the vias in two staggered rows),
    then the body, a block whose flat top stands clear of the crown and
    whose walls run down to it, gull-wing pins along all four walls and the
    house's one notch cut from the top's far corner. */
function packageSvg(h: Hull, p: Package, body: Body, paint: Paint): string {
  const { a: A, f: F, half: D, pins: N, pitch, spread, fan } = p;
  const zOf = (a: number, f: number) => crownTZ(h.side, a, f, h.shape)[1];
  const P3 = (a: number, f: number, z: number) => iso(W(h.side * (LC + a), f, z), h.P);
  const sides = [
    { da: 1, df: 0 },
    { da: -1, df: 0 },
    { da: 0, df: 1 },
    { da: 0, df: -1 },
  ];
  const local = (s: { da: number; df: number }, out: number, along: number): [number, number] => [A + s.da * out - s.df * along, F + s.df * out + s.da * along];
  const traces: string[] = [];
  const pads: string[] = [];
  const drills: string[] = [];
  for (const s of sides) {
    for (let i = 0; i < N; i++) {
      const p0 = (i - (N - 1) / 2) * pitch;
      const p1 = (i - (N - 1) / 2) * spread;
      const bend = D + 4.6;
      const end = D + fan[i % 2];
      traces.push(lineD(thin(crownLine(h, [local(s, D + 3.4, p0), local(s, bend, p0), local(s, bend + Math.abs(p1 - p0), p1), local(s, end, p1)], 0.8), 0.08)));
      const [va, vf] = local(s, end + 1.1, p1);
      pads.push(polyD(crownPad(h, va, vf, 1.25)));
      drills.push(polyD(crownPad(h, va, vf, 0.45, 8)));
    }
  }
  const surface = `<path class="d1-trace" stroke="${paint.tiers[2]}" d="${traces.join("")}"/><path class="d1-via" d="${pads.join("")}"/><path class="d1-drill" d="${drills.join("")}"/>`;

  const top = Math.max(zOf(A - D, F - D), zOf(A + D, F - D), zOf(A + D, F + D), zOf(A - D, F + D), zOf(A, F)) + 3.2;
  const walls: string[] = [];
  const pinsFar: string[] = [];
  const pinsNear: string[] = [];
  for (const s of sides) {
    const nw = W(h.side * s.da, s.df, 0);
    const facing = nw[0] * h.toward[0] + nw[1] * h.toward[1] > 0;
    if (facing) {
      const edge = Array.from({ length: 9 }, (_, i) => local(s, D, -D + (2 * D * i) / 8));
      const lit = nw[0] * h.light[0] + nw[1] * h.light[1] > 0;
      const ring = [...edge.map(([a, f]) => P3(a, f, top)), ...edge.reverse().map(([a, f]) => P3(a, f, zOf(a, f)))];
      walls.push(`<path fill="${body.walls[lit ? 0 : 1]}" stroke="${body.edge}" stroke-width=".45" stroke-linejoin="round" d="${polyD(ring)}"/>`);
    }
    const legs: string[] = [];
    for (let i = 0; i < N; i++) {
      const along = (i - (N - 1) / 2) * pitch;
      const [a0, f0] = local(s, D, along);
      const [a1, f1] = local(s, D + 1.2, along);
      const [a2, f2] = local(s, D + 2.2, along);
      const [a3, f3] = local(s, D + 3.4, along);
      legs.push(lineD([P3(a0, f0, top - 1.6), P3(a1, f1, top - 1.6), P3(a2, f2, zOf(a2, f2) + 0.3), P3(a3, f3, zOf(a3, f3) + 0.2)]));
    }
    (facing ? pinsNear : pinsFar).push(legs.join(""));
  }
  const notch = Math.max(2.5, D * 0.4);
  const ring: [number, number][] = [
    [A - D, F - D],
    [A + D - notch, F - D],
    [A + D, F - D + notch],
    [A + D, F + D],
    [A - D, F + D],
  ];
  const face = ring.map(([a, f]) => P3(a, f, top));
  const lid = ring.map(([a, f]): Flat => P3(A + (a - A) * 0.72, F + (f - F) * 0.72, top));
  return `${surface}<path class="d1-pin" d="${pinsFar.join("")}"/>${walls.join("")}<path fill="${body.top}" stroke="${body.edge}" stroke-width=".6" stroke-linejoin="round" d="${polyD(face)}"/><path fill="none" stroke="${body.edge}" stroke-width=".35" stroke-opacity=".55" d="${polyD(lid)}"/><path class="d1-pin" d="${pinsNear.join("")}"/>`;
}

// ─── the traces on the hull ─────────────────────────────────────────────────

interface Run {
  pts: UW[];
  xy: Flat[];
  lit: number[];
  facing: number[];
  /** Whether each end is the trace's own (or where the limb cut it). */
  own: [boolean, boolean];
}

/** A trace wrapped onto the hull: the runs of it that face the viewer well. */
function seenRuns(h: Hull, pts: UW[]): Run[] {
  const samples: UW[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [u0, w0] = pts[i];
    const [u1, w1] = pts[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(u1 - u0, w1 - w0) / 1.5));
    for (let k = i ? 1 : 0; k <= n; k++) samples.push([u0 + ((u1 - u0) * k) / n, w0 + ((w1 - w0) * k) / n]);
  }
  const out: Run[] = [];
  let cur: Run | null = null;
  const at = gridSampler(h);
  samples.forEach(([u, w], i) => {
    const s = at(u, w);
    const facing = s.facing;
    if (facing >= FACING && s.seen) {
      if (!cur) cur = { pts: [], xy: [], lit: [], facing: [], own: [i === 0, false] };
      cur.pts.push([u, w]);
      cur.xy.push(s.xy);
      cur.lit.push(s.lit);
      cur.facing.push(facing);
      if (i === samples.length - 1) cur.own[1] = true;
    } else if (cur) {
      out.push(cur);
      cur = null;
    }
  });
  if (cur) out.push(cur);
  // a sliver between two cuts is no trace
  return out.filter((r) => r.pts.length > 4);
}

/** A run drawn in tone tiers by the light: fine and dim in shadow and near
    the limb, full weight where it is lit. */
function drawRun(run: Run, tiers: string[][]) {
  let line: Flat[] = [];
  let tier = -1;
  const flush = () => {
    if (line.length > 1 && tier >= 0) tiers[tier].push(lineD(thin(line)));
    line = [];
  };
  run.xy.forEach((xy, i) => {
    const t = run.facing[i] < 0.45 || run.lit[i] < 0.12 ? 0 : run.lit[i] < 0.5 ? 1 : 2;
    if (t !== tier) {
      const join = line[line.length - 1];
      flush();
      if (join) line.push(join);
      tier = t;
    }
    line.push(xy);
  });
  flush();
}

function hemisphereSvg(side: Side, o: MindOptions, paint: Paint): string {
  const h = makeHull(side, { view: o.view, shape: SHAPE, lightShape: LIGHT });
  const die = side === DIE_SIDE;
  const parts: string[] = [skinSvg(h, paint, die ? ringOf() : []), `<path fill="none" stroke="${paint.edge}" stroke-width=".7" d="${silhouetteD(h)}"/>`];
  const tiers: string[][] = paint.tiers.map(() => []);
  const hairs: string[][] = paint.tiers.map(() => []);
  const pads: string[] = [];
  const drills: string[] = [];
  const via = (u: number, w: number) => {
    const pad = roundPad(h, u, w, 1.25, 12);
    if (!pad) return;
    pads.push(polyD(pad));
    drills.push(polyD(roundPad(h, u, w, 0.45, 8) ?? []));
  };
  for (const t of tracesOf(h)) {
    for (const run of seenRuns(h, t.pts)) {
      drawRun(run, t.hair ? hairs : tiers);
      // every end is a via, but an end of the trace's own that lies in copper
      if (!run.own[0] || t.vias[0]) via(...run.pts[0]);
      if (!run.own[1] || t.vias[1]) via(...run.pts[run.pts.length - 1]);
    }
  }
  if (die) {
    for (const [a, f] of fenceOf()) {
      const [t, z] = crownTZ(side, a, f, h.shape);
      if (!seen(h, h.at(t, z))) continue;
      pads.push(polyD(crownPad(h, a, f, 1)));
      drills.push(polyD(crownPad(h, a, f, 0.4, 8)));
    }
  }
  tiers.forEach((d, i) => parts.push(`<path class="d1-trace${i ? "" : " d1-fine"}" stroke="${paint.tiers[i]}" d="${d.join("")}"/>`));
  hairs.forEach((d, i) => parts.push(`<path class="d1-trace d1-hair" stroke="${paint.tiers[Math.max(0, i - 1)]}" d="${d.join("")}"/>`));
  parts.push(`<path class="d1-via" d="${pads.join("")}"/>`, `<path class="d1-drill" d="${drills.join("")}"/>`);
  parts.push(die ? packageSvg(h, DIE, paint.die, paint) : packageSvg(h, CHIP, paint.chip, paint));
  return `<g class="d1">${parts.join("")}</g>`;
}

function svg(o: MindOptions): string {
  const paint = paintOf(o.light, o.tones);
  const sides = o.only ? [o.only] : sidesFarFirst(o.view);
  const body = sides.map((s) => hemisphereSvg(s, o, paint)).join("");
  const css = `.d1 path{vector-effect:none}.d1-trace{fill:none;stroke-width:.85;stroke-linecap:butt;stroke-linejoin:miter}.d1-fine{stroke-width:.55}.d1-hair{stroke-width:.45}.d1-via{fill:${paint.via};stroke:none}.d1-drill{fill:${paint.drill};stroke:none}.d1-pin{fill:none;stroke:${o.tones.gold};stroke-width:.6;stroke-linecap:butt}`;
  return mindSvg({ view: o.view, light: o.light, tones: o.tones, body, css });
}

export const traceCortex: MindDirection = {
  id: "d1",
  round: 1,
  name: "Trace Cortex",
  line: "The whole brain drawn in gold traces on solder mask, dense where the light falls and fine in shadow, wired up into the core die on one crown and a smaller package on the other.",
  svg,
};
