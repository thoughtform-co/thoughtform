/**
 * serviceWire — the services' figures as LINE WORK: SVG path data, emitted
 * once, rendered twice (the W · Wire direction, 2026-09-19).
 *
 * The house's own ring register is the housing — six rings on an alternating
 * dash ladder, a rim graduated every 15° off the cardinals, four cardinal
 * stubs (the About drawing, `AboutStage.tsx`, as `components/arcs/steps/
 * dialLayout.ts` ported it for ADR-106) — and the figure from
 * `serviceFigures` is drawn ON it in hairline. "A technical illustrated line
 * object, not a brighter additive glow" (ADR-025 U4).
 *
 * ⚠ COPIED BY HAND, NEVER IMPORTED. `CelestialConnector` / `DiagramSvg` /
 * `shapes/**` letter in raw tokens, carry a `transform` on every tick and
 * drag Supabase in through `@/lib/celestial`'s barrel (ADR-106's ruling);
 * `dialLayout.ts` is an arcs module. This file has the same idiom and no
 * imports but the figure record.
 *
 * ⚠ ABSOLUTE COORDINATES, NEVER A `transform`. Every path is emitted in one
 * viewBox so the same string rasterises into a canvas bake through `Path2D`
 * (the card face) and renders as an inline `<svg>` (the lab strip, the future
 * mobile plate) with nothing recomputed between the two.
 *
 * ⚠ THE SVG LETTERS NOTHING. No `<text>` here — the card's type is the bake's
 * and a DOM strip's labels are DOM.
 */

import { FIGURE_INK, figureFor, near, type FigureSlot, type ServiceFigure } from "./serviceFigures";

/** The crop — the celestial kit's own square, centred on the origin. */
export const WIRE_VB = { x: -120, y: -120, w: 240, h: 240 } as const;
/** The rim and the ladder inside it (dialLayout's set). */
export const WIRE_RIM = 115;
export const WIRE_OUTER = 103;
export const WIRE_TRACK = 74;
export const WIRE_CORE = 49;
/** The cloud's radius on this crop — inside the rim with the ticks clear. */
export const WIRE_R = 92;

/** A stroke role. The two renderers map a role to a colour; the record only
 *  knows which of the two inks and how loud. */
export type WireInk =
  | "line" // the housing's dawn hairline
  | "line2" // the housing's inner, quieter hairline
  | "tick" // the rim's graduation
  | "stub" // the four cardinals
  | "gold-soft" // the gold ring, dashed
  | "chord" // a figure edge (any kind)
  | "node" // an unlit estate node, filled
  | "node-lit" // a lit node, filled
  | "open" // an unlinked node, stroked open
  | "mark"; // a diamond, gold, filled

export interface WirePath {
  id: string;
  d: string;
  ink: WireInk;
  /** Stroke width in viewBox units (a fill ignores it). */
  width: number;
  /** 0..1, the depth fade — the material multiplies its own alpha by this. */
  alpha: number;
  dash?: string;
  fill: boolean;
}

export interface WireDrawing {
  slot: FigureSlot;
  vb: typeof WIRE_VB;
  housing: readonly WirePath[];
  figure: readonly WirePath[];
}

const RAD = Math.PI / 180;
const f = (n: number) => (Math.round(n * 100) / 100).toString();
const pt = (deg: number, r: number) => ({
  x: r * Math.sin(deg * RAD),
  y: -r * Math.cos(deg * RAD),
});

function circle(r: number): string {
  // A closed circle as an explicit two-arc path starting at twelve o'clock —
  // never a `<circle>` (dialLayout's own reason: the start point is a fact).
  return `M 0 ${f(-r)} A ${r} ${r} 0 0 1 0 ${f(r)} A ${r} ${r} 0 0 1 0 ${f(-r)}`;
}

function seg(deg: number, from: number, to: number): string {
  const a = pt(deg, from);
  const b = pt(deg, to);
  return `M ${f(a.x)} ${f(a.y)} L ${f(b.x)} ${f(b.y)}`;
}

let housingCache: readonly WirePath[] | null = null;

/** The housing every card shares — built once, the same object four times. */
export function wireHousing(): readonly WirePath[] {
  if (housingCache) return housingCache;
  const out: WirePath[] = [
    { id: "rim", d: circle(WIRE_RIM), ink: "line", width: 0.6, alpha: 1, dash: "1 4", fill: false },
    { id: "outer", d: circle(WIRE_OUTER), ink: "line2", width: 0.5, alpha: 1, fill: false },
    {
      id: "track",
      d: circle(WIRE_TRACK),
      ink: "gold-soft",
      width: 0.6,
      alpha: 1,
      dash: "2 5",
      fill: false,
    },
    {
      id: "core",
      d: circle(WIRE_CORE),
      ink: "line2",
      width: 0.5,
      alpha: 1,
      dash: "1 3",
      fill: false,
    },
  ];
  for (let deg = 0; deg < 360; deg += 15) {
    if (deg % 90 === 0) continue;
    out.push({
      id: `t${deg}`,
      d: seg(deg, WIRE_RIM, WIRE_RIM - 6),
      ink: "tick",
      width: 0.6,
      alpha: 1,
      fill: false,
    });
  }
  for (const deg of [0, 90, 180, 270]) {
    out.push({
      id: `s${deg}`,
      d: seg(deg, WIRE_RIM, WIRE_RIM - 11),
      ink: "stub",
      width: 0.9,
      alpha: 1,
      fill: false,
    });
  }
  housingCache = out;
  return out;
}

function square(x: number, y: number, r: number): string {
  return `M ${f(x - r)} ${f(y - r)} L ${f(x + r)} ${f(y - r)} L ${f(x + r)} ${f(y + r)} L ${f(x - r)} ${f(y + r)} Z`;
}

function diamond(x: number, y: number, r: number): string {
  return `M ${f(x)} ${f(y - r)} L ${f(x + r)} ${f(y)} L ${f(x)} ${f(y + r)} L ${f(x - r)} ${f(y)} Z`;
}

/** The figure's line work on this crop. Node radii and widths are the
 *  constellation's (R 328) scaled to WIRE_R, so the three materials agree. */
export function wireFigure(fig: ServiceFigure): readonly WirePath[] {
  const k = WIRE_R / 328;
  const P = fig.points.map((p) => ({ x: p.x * WIRE_R, y: p.y * WIRE_R, z: p.z }));
  const out: WirePath[] = [];
  const open = new Set(fig.unlinked);

  // Edges first so nodes print over them.
  fig.edges.forEach((e, n) => {
    const a = P[e.a];
    const b = P[e.b];
    const mean = near((a.z + b.z) / 2);
    const ink = FIGURE_INK[e.kind];
    out.push({
      id: `e${n}`,
      d: `M ${f(a.x)} ${f(a.y)} L ${f(b.x)} ${f(b.y)}`,
      ink: "chord",
      width: ink.width * k * 1.35,
      alpha: ink.alpha(mean),
      fill: false,
    });
  });

  P.forEach((p, i) => {
    const nz = near(p.z);
    if (open.has(i)) {
      out.push({
        id: `n${i}`,
        d: square(p.x, p.y, 4.2 * k + 1.2),
        ink: "open",
        width: 0.7,
        alpha: 0.55 + nz * 0.35,
        fill: false,
      });
      return;
    }
    const lit = fig.lit[i];
    const r = (lit ? FIGURE_INK.nodeR.lit(nz) : FIGURE_INK.nodeR.unlit(nz)) * k;
    out.push({
      id: `n${i}`,
      d: square(p.x, p.y, r),
      ink: lit ? "node-lit" : "node",
      width: 0,
      alpha: lit ? FIGURE_INK.node.lit(nz) : FIGURE_INK.node.unlit(nz),
      fill: true,
    });
  });

  for (const m of fig.marks) {
    const p = P[m.i];
    out.push({
      id: `m${m.i}`,
      d: diamond(p.x, p.y, m.r * k * 1.15),
      ink: "mark",
      width: 0,
      alpha: 1,
      fill: true,
    });
  }
  return out;
}

const drawingCache = new Map<FigureSlot, WireDrawing>();

export function wireFor(slot: FigureSlot): WireDrawing {
  const hit = drawingCache.get(slot);
  if (hit) return hit;
  const drawing: WireDrawing = {
    slot,
    vb: WIRE_VB,
    housing: wireHousing(),
    figure: wireFigure(figureFor(slot)),
  };
  drawingCache.set(slot, drawing);
  return drawing;
}

/** What a stroke role is made of: which ink, and at what base alpha. The
 *  canvas bake and the DOM strip both read this so the two cannot drift. */
export function wireInk(ink: WireInk): { role: "ink" | "gold"; alpha: number } {
  switch (ink) {
    case "line":
      return { role: "ink", alpha: 0.28 };
    case "line2":
      return { role: "ink", alpha: 0.16 };
    case "tick":
      return { role: "ink", alpha: 0.34 };
    case "stub":
      return { role: "ink", alpha: 0.5 };
    case "gold-soft":
      return { role: "gold", alpha: 0.32 };
    case "chord":
      return { role: "ink", alpha: 1 };
    case "node":
      return { role: "ink", alpha: 1 };
    case "node-lit":
      return { role: "ink", alpha: 1 };
    case "open":
      return { role: "ink", alpha: 1 };
    case "mark":
      return { role: "gold", alpha: 1 };
  }
}
