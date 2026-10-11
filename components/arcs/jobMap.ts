import type { ArcJobMap, ArcJobMapLabel } from "@/lib/arcs/types";

import { type CrewGrain, grainPaths } from "./crewParticles";

/**
 * THE DRIVE JOB'S FIGURE: THE MAP ITSELF, DRAWN (ADR-153 U4's ops job, owner
 * 2026-10-11: "we have an actual cluster, an actual visual map of these
 * things, why can't we use it here?"). The record (`shared/suriDriveMap.ts`)
 * is the mapped Drive reduced to a total, sixty groups and a seeded sample
 * of the items; this module turns it into the house's grain field, one grain
 * per sample point, in a square crop the job card's frame draws under
 * `xMidYMid meet`.
 *
 *   the ramp   gold by DENSITY, the one thing the map says: the densest
 *              cores in `--gold`, the body in the gold line, the sparse rest
 *              in dawn. Density is the sample's own (a 48 × 48 grid, each
 *              point's 3 × 3 neighbourhood), ranked, so the three tiers are
 *              shares of the sample and no threshold is tuned by hand.
 *   callouts   at most four GENERIC words, seated in the crop's CORNERS with
 *              a dawn hairline to a hollow node on the group each names
 *              (ADR-103's callout grammar). The largest groups all sit in the
 *              cloud's middle, so a label on its centroid would print through
 *              its neighbours; the corners are clear by construction and
 *              `tests/lib/arc-job-map.test.ts` walks `labelCollisions` anyway.
 *              Each label goes to the corner nearest its group (the assignment
 *              with the shortest leaders, over every permutation).
 *
 * ⚠ A GRAIN IS AT LEAST 2px ON SCREEN AT 1280 × 720. The frame there is about
 * 330px square, so a crop unit paints ~1.375px and the smallest grain,
 * `MAP_MIN_GRAIN`, is 2.06px; a field that goes sub-pixel reads as a smear.
 *
 * ⚠ THE LABEL IS DOM, NOT `<text>`: it keeps the page's type size while the
 * SVG scales, which is why its seat is a FRACTION of the crop and the leader
 * meets it at a CORNER of its box (the one edge whose position does not
 * depend on the rendered text's width). `MAP_LABEL_TYPE` is the label's em
 * in crop units at the binding viewport (14.56px over 1.383px a unit, the
 * live measurement), the estimate the collision walk measures with; it
 * reproduces the rendered boxes to within a unit.
 *
 * ⚠ PURE AND SEEDED: numbers in, numbers out, no React, no three; the one
 * random term (a grain's alpha within its tier) rides the house PRNG, so a
 * render is the same drawing every time. Nothing here reads a name.
 */

/** The crop, square, in viewBox units. */
export const MAP_VB = 240;
/** The cloud's inset from the crop's edge: past the callouts' rows (a label
 *  sits inside `MAP_CORNER + MAP_LABEL_H` = 22 units of either edge), so the
 *  cloud's sparse rim never prints under a word. */
export const MAP_INSET = 28;
/** The callouts' inset from the crop's corner. */
export const MAP_CORNER = 8;
/** A label's line box in crop units at 1280 × 720 (13px × 1.4 / 1.375). */
export const MAP_LABEL_H = 14;
/** The label's em in crop units at 1280 × 720: `--type-base` is 14.56px
 *  there over a 332px map, 1.383px a unit (measured live, 2026-10-11). */
export const MAP_LABEL_TYPE = 10.5;
/** PT Mono's advance plus the eyebrow rung's tracking (0.6 + 0.15). */
export const MAP_LABEL_ADVANCE = 0.75;
export const MAP_LABEL_LINE = 1.4;
/** The smallest grain, 2px at 1280 × 720. */
export const MAP_MIN_GRAIN = 1.5;
/** The hollow node on a named group, its side. */
export const MAP_NODE = 5;
/** At most this many callouts. */
export const MAP_MAX_LABELS = 4;

const GRID = 48;
const CORE_SHARE = 0.12;
const BODY_SHARE = 0.48;

export const MAP_TIERS = ["sparse", "body", "core"] as const;
export type MapTier = (typeof MAP_TIERS)[number];

const GRAIN_SIDE: Record<MapTier, number> = { sparse: 1.6, body: 1.8, core: 2.2 };

export interface MapGrain extends CrewGrain {
  tier: MapTier;
  /** The group the point belongs to. */
  c: number;
}

export interface MapCallout {
  /** The corner: `tl` · `tr` · `bl` · `br`. */
  id: string;
  text: string;
  group: number;
  /** The label's seat, as fractions of the crop. */
  ax: number;
  at: number;
  anchor: "start" | "end";
  vAlign: "top" | "bottom";
  /** The hairline from the label's corner to the group's node, and the node. */
  leader: string;
  node: string;
}

export interface JobMapDrawing {
  vb: number;
  grains: readonly MapGrain[];
  /** The grains as paths, grouped by tier and then by alpha. */
  tiers: readonly { tier: MapTier; paths: readonly { a: number; d: string }[] }[];
  callouts: readonly MapCallout[];
}

/** The owner's mockup PRNG (`substrateForms.tsx`, `crewParticles.ts`), unchanged. */
function rng(seed: number) {
  let t = seed;
  return function next() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const unit = (v: number) => MAP_INSET + v * (MAP_VB - 2 * MAP_INSET);

/** Each point's density: the sample's count in its 3 × 3 grid neighbourhood. */
function densities(points: ArcJobMap["points"]): number[] {
  const cells = new Uint16Array(GRID * GRID);
  const cell = (v: number) => Math.min(GRID - 1, Math.max(0, Math.floor(v * GRID)));
  for (const p of points) cells[cell(p.y) * GRID + cell(p.x)] += 1;
  return points.map((p) => {
    const cx = cell(p.x);
    const cy = cell(p.y);
    let sum = 0;
    for (let dy = -1; dy <= 1; dy += 1) {
      const y = cy + dy;
      if (y < 0 || y >= GRID) continue;
      for (let dx = -1; dx <= 1; dx += 1) {
        const x = cx + dx;
        if (x < 0 || x >= GRID) continue;
        sum += cells[y * GRID + x];
      }
    }
    return sum;
  });
}

/** Every point's tier, by its rank in the sample's density. */
export function mapTiers(points: ArcJobMap["points"]): MapTier[] {
  const d = densities(points);
  const order = points.map((_, i) => i).sort((p, q) => d[q] - d[p] || p - q);
  const cores = Math.ceil(points.length * CORE_SHARE);
  const bodies = Math.floor(points.length * BODY_SHARE);
  const tiers: MapTier[] = new Array(points.length).fill("sparse");
  order.forEach((i, rank) => {
    if (rank < cores) tiers[i] = "core";
    else if (rank < cores + bodies) tiers[i] = "body";
  });
  return tiers;
}

interface Corner {
  id: string;
  ax: number;
  at: number;
  anchor: "start" | "end";
  vAlign: "top" | "bottom";
  /** Where the leader leaves the label's box, in crop units. */
  sx: number;
  sy: number;
}

const CORNERS: readonly Corner[] = [
  {
    id: "tl",
    ax: MAP_CORNER / MAP_VB,
    at: (MAP_CORNER + MAP_LABEL_H) / MAP_VB,
    anchor: "start",
    vAlign: "bottom",
    sx: MAP_CORNER,
    sy: MAP_CORNER + MAP_LABEL_H + 2,
  },
  {
    id: "tr",
    ax: 1 - MAP_CORNER / MAP_VB,
    at: (MAP_CORNER + MAP_LABEL_H) / MAP_VB,
    anchor: "end",
    vAlign: "bottom",
    sx: MAP_VB - MAP_CORNER,
    sy: MAP_CORNER + MAP_LABEL_H + 2,
  },
  {
    id: "bl",
    ax: MAP_CORNER / MAP_VB,
    at: 1 - (MAP_CORNER + MAP_LABEL_H) / MAP_VB,
    anchor: "start",
    vAlign: "top",
    sx: MAP_CORNER,
    sy: MAP_VB - MAP_CORNER - MAP_LABEL_H - 2,
  },
  {
    id: "br",
    ax: 1 - MAP_CORNER / MAP_VB,
    at: 1 - (MAP_CORNER + MAP_LABEL_H) / MAP_VB,
    anchor: "end",
    vAlign: "top",
    sx: MAP_VB - MAP_CORNER,
    sy: MAP_VB - MAP_CORNER - MAP_LABEL_H - 2,
  },
];

/** Every injective assignment of `n` labels to the four corners. */
function assignments(n: number): number[][] {
  const out: number[][] = [];
  const walk = (used: number[]) => {
    if (used.length === n) {
      out.push(used);
      return;
    }
    for (let c = 0; c < CORNERS.length; c += 1) {
      if (!used.includes(c)) walk([...used, c]);
    }
  };
  walk([]);
  return out;
}

/** The callouts: each label in the corner that gives the shortest leaders. */
function callouts(map: ArcJobMap, labels: readonly ArcJobMapLabel[]): MapCallout[] {
  const named = labels.slice(0, MAP_MAX_LABELS);
  if (!named.length) return [];
  const seats = named.map((l) => {
    const g = map.clusters[l.group];
    if (!g) throw new Error(`jobMap: no group ${l.group} to letter "${l.text}" on`);
    return { x: unit(g.x), y: unit(g.y) };
  });
  let best: number[] = [];
  let bestCost = Infinity;
  for (const a of assignments(named.length)) {
    const cost = a.reduce((sum, c, i) => {
      const dx = seats[i].x - CORNERS[c].sx;
      const dy = seats[i].y - CORNERS[c].sy;
      return sum + dx * dx + dy * dy;
    }, 0);
    if (cost < bestCost) {
      bestCost = cost;
      best = a;
    }
  }
  return named.map((l, i) => {
    const corner = CORNERS[best[i]];
    const { x, y } = seats[i];
    const dx = x - corner.sx;
    const dy = y - corner.sy;
    const len = Math.hypot(dx, dy);
    const end = Math.max(0, len - (MAP_NODE / 2 + 1.5));
    const ex = corner.sx + (dx / len) * end;
    const ey = corner.sy + (dy / len) * end;
    const h = MAP_NODE / 2;
    return {
      id: corner.id,
      text: l.text,
      group: l.group,
      ax: corner.ax,
      at: corner.at,
      anchor: corner.anchor,
      vAlign: corner.vAlign,
      leader: `M${r1(corner.sx)} ${r1(corner.sy)}L${r1(ex)} ${r1(ey)}`,
      node: `M${r1(x - h)} ${r1(y - h)}h${MAP_NODE}v${MAP_NODE}h-${MAP_NODE}z`,
    };
  });
}

/** The map as grains and callouts, the same drawing every render for one seed. */
export function jobMap(
  map: ArcJobMap,
  labels: readonly ArcJobMapLabel[],
  seed: number
): JobMapDrawing {
  const R = rng(seed);
  const tiers = mapTiers(map.points);
  const grains: MapGrain[] = map.points.map((p, i) => {
    const tier = tiers[i];
    const s = GRAIN_SIDE[tier];
    const a =
      tier === "core" ? 0.9 + R() * 0.1 : tier === "body" ? 0.7 + R() * 0.25 : 0.5 + R() * 0.2;
    return {
      x: r1(unit(p.x) - s / 2),
      y: r1(unit(p.y) - s / 2),
      s,
      a: Math.min(1, a),
      tier,
      c: p.c,
    };
  });
  return {
    vb: MAP_VB,
    grains,
    tiers: MAP_TIERS.map((tier) => ({
      tier,
      paths: grainPaths(grains.filter((g) => g.tier === tier)),
    })),
    callouts: callouts(map, labels),
  };
}
