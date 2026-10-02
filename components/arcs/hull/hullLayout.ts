/**
 * hullLayout — the agent-shaped-work figure's geometry (ADR-139 U1). Pure,
 * zero-import, deterministic: the renderer and the guard read the same
 * numbers, so what the test walks is what the page draws.
 *
 * The picture is Matthew Schwartz's convex hull ("Claude-shaped science",
 * Anthropic): a team's knowledge is JAGGED, deep in a few directions and
 * empty between them. The smallest convex shape around it holds everything
 * within reach of what the team already knows, and the bays between the
 * spikes are where an agent earns its keep: work that crosses fields, uses
 * a method that already exists somewhere, and can be checked.
 *
 *   THE STAR   one spike per role, tip and valley alternating. Lengths and
 *              angles come off fixed patterns, never a random draw, so the
 *              star is the same on every render and every fork.
 *   THE HULL   the convex hull of the star's points (monotone chain). Every
 *              tip is a hull vertex by construction; the guard holds it.
 *   THE FIELD  a jittered grid, seeded, kept only where it is inside the
 *              hull AND outside the star, with clearance from both edges,
 *              so no particle touches a line.
 *
 * ⚠ THE SVG LETTERS NOTHING. Each role's label is a SEAT, a fraction of the
 * crop plus the side it hangs off, and the renderer places DOM there.
 */

/** The longest spike, in crop units. */
const R = 232;
/** The crop is the hull's box plus this much air: wide at the sides, where
 *  a left or right label hangs off its tip, and short above and below. */
export const PAD_X = 112;
export const PAD_Y = 40;

/* Seven entries each, so a team of five to seven reads the first n. The
   lengths alternate long and short, which is what makes it jagged; the
   angle offsets keep it from reading as a compass rose. */
const TIP = [1, 0.7, 0.88, 0.6, 0.8, 0.66, 0.74] as const;
const VALLEY = [0.15, 0.12, 0.17, 0.11, 0.16, 0.13, 0.14] as const;
const TURN = [0, 12, -8, 7, -12, 9, -5] as const;

/** Clearance a particle keeps from the star's edge and the hull's, in units. */
export const STAR_CLEAR = 7;
export const HULL_CLEAR = 3;
const STEP = 8;
const JITTER = 2.6;
const SEED = 0x5c4a11;

export interface HullPoint {
  x: number;
  y: number;
}

export interface HullTip extends HullPoint {
  /** Radians, screen convention (y down), 0 = right. */
  angle: number;
}

export interface HullDot extends HullPoint {
  r: number;
  a: number;
}

export type HullSide = "left" | "right" | "above" | "below";

export interface HullSeat {
  /** Fractions of the crop, 0..1. */
  fx: number;
  fy: number;
  side: HullSide;
}

export interface HullLayout {
  /** The crop, derived from the drawing so it is centred at any team size. */
  w: number;
  h: number;
  tips: readonly HullTip[];
  /** Tip, valley, tip, valley … closed. */
  star: readonly HullPoint[];
  hull: readonly HullPoint[];
  field: readonly HullDot[];
  seats: readonly HullSeat[];
}

const polar = (r: number, angle: number): HullPoint => ({
  x: r * Math.cos(angle),
  y: r * Math.sin(angle),
});

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Mulberry32 — a small seeded generator, so the field never moves. */
function seeded(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const cross = (o: HullPoint, a: HullPoint, b: HullPoint) =>
  (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

/** Andrew's monotone chain. Returns the hull counter-clockwise in screen
 *  space, with no collinear points. */
export function convexHull(points: readonly HullPoint[]): HullPoint[] {
  const p = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  if (p.length < 3) return p;
  const lower: HullPoint[] = [];
  for (const pt of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], pt) <= 0)
      lower.pop();
    lower.push(pt);
  }
  const upper: HullPoint[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const pt = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], pt) <= 0)
      upper.pop();
    upper.push(pt);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/** Even-odd ray cast. */
export function inside(pt: HullPoint, poly: readonly HullPoint[]): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > pt.y !== b.y > pt.y && pt.x < ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y) + a.x) {
      hit = !hit;
    }
  }
  return hit;
}

/** Shortest distance from a point to a closed polygon's edge. */
export function edgeDistance(pt: HullPoint, poly: readonly HullPoint[]): number {
  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[j];
    const b = poly[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    const t =
      len2 === 0 ? 0 : Math.max(0, Math.min(1, ((pt.x - a.x) * dx + (pt.y - a.y) * dy) / len2));
    best = Math.min(best, Math.hypot(pt.x - (a.x + t * dx), pt.y - (a.y + t * dy)));
  }
  return best;
}

/** A closed polygon as path data. */
export function polygonPath(poly: readonly HullPoint[]): string {
  return (
    poly.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ") + " Z"
  );
}

/** Which side of its tip a label hangs off: outward, along the spike. */
function sideOf(angle: number): HullSide {
  const c = Math.cos(angle);
  if (c > 0.34) return "right";
  if (c < -0.34) return "left";
  return Math.sin(angle) < 0 ? "above" : "below";
}

/** Gap between a tip and its label's anchor, in crop units. */
const SEAT_GAP = 12;

export function hullLayout(roles: number): HullLayout {
  const n = Math.max(5, Math.min(7, Math.round(roles)));
  const span = (Math.PI * 2) / n;
  /* Built round the origin first, then moved so the hull's box sits in the
     middle of a crop made from it. */
  const raw: HullTip[] = [];
  const rawStar: HullPoint[] = [];
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + i * span + rad(TURN[i]);
    const tip = polar(R * TIP[i], angle);
    raw.push({ ...tip, angle });
    rawStar.push(tip);
    const next = -Math.PI / 2 + (i + 1) * span + rad(TURN[(i + 1) % n]);
    rawStar.push(polar(R * VALLEY[i], (angle + next) / 2));
  }
  const box = convexHull(rawStar);
  const minX = Math.min(...box.map((p) => p.x));
  const maxX = Math.max(...box.map((p) => p.x));
  const minY = Math.min(...box.map((p) => p.y));
  const maxY = Math.max(...box.map((p) => p.y));
  const ox = PAD_X - minX;
  const oy = PAD_Y - minY;
  const w = maxX - minX + 2 * PAD_X;
  const h = maxY - minY + 2 * PAD_Y;
  const move = (p: HullPoint): HullPoint => ({ x: p.x + ox, y: p.y + oy });

  const tips = raw.map((t) => ({ ...move(t), angle: t.angle }));
  const star = rawStar.map(move);
  const hull = convexHull(star);

  const rand = seeded(SEED);
  const xs = hull.map((p) => p.x);
  const ys = hull.map((p) => p.y);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  const [y0, y1] = [Math.min(...ys), Math.max(...ys)];
  const field: HullDot[] = [];
  for (let gy = y0; gy <= y1; gy += STEP) {
    for (let gx = x0; gx <= x1; gx += STEP) {
      const pt = { x: gx + (rand() * 2 - 1) * JITTER, y: gy + (rand() * 2 - 1) * JITTER };
      const r = 1 + rand() * 1.1;
      const a = 0.55 + rand() * 0.45;
      if (!inside(pt, hull) || inside(pt, star)) continue;
      if (edgeDistance(pt, star) < STAR_CLEAR + r) continue;
      if (edgeDistance(pt, hull) < HULL_CLEAR + r) continue;
      field.push({ x: pt.x, y: pt.y, r, a });
    }
  }

  const seats = tips.map((t, i) => {
    const at = move(polar(R * TIP[i] + SEAT_GAP, t.angle));
    return { fx: at.x / w, fy: at.y / h, side: sideOf(t.angle) };
  });

  return { w, h, tips, star, hull, field, seats };
}
