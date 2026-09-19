/**
 * serviceFigures — the four services' figures as ONE RECORD, drawn in three
 * materials (the 2026-09-19 lab pass on `/test/services-card-face-lab`).
 *
 * ADR-086 drew the constellation in `cardViz.ts` as one cloud with four edge
 * rules, straight into a canvas. This module lifts the RECORD out of the
 * renderer: the same Fibonacci cloud (same count, same tilt, so the node
 * positions are the estate the ADR describes), and a structure per service
 * as points, edges and marks in a unit space — so a canvas raster, a
 * three.js point cloud and an SVG wire can each draw the same figure and the
 * owner judges the MATERIAL, not four different subjects.
 *
 * The four structures, re-solved for the re-cut services:
 *
 *   keynote       THE RADIANT — one source, rays to a room, no edges between
 *                 the receivers (ADR-086, unchanged).
 *   workshop      THE ROUTE — one path walked end to end, both ends marked
 *                 (ADR-086, unchanged).
 *   embedded      THE MESH — near-neighbour triangulation with three marks
 *                 seated in order (ADR-111), PLUS a handful of front nodes the
 *                 mesh deliberately does not reach: the person-led work,
 *                 absorbed from the SURVEY so the advisory claim survives the
 *                 fold of Strategic Advisory into this card (owner, 2026-09-19).
 *   guided-build  THE TABLE — the inverse of the radiant: eight nodes around
 *                 the front pole, every pair joined. Few people, everyone
 *                 talking to everyone. The home session.
 *
 * ⚠ ONE VOCABULARY ACROSS ALL FOUR (ADR-086): square nodes, straight chords,
 * diamond signals, depth carried by fade. A renderer may change the material
 * of those four things and nothing else.
 *
 * ⚠ THE SPACE IS CANVAS-HANDED. `x` right, `y` DOWN, `z` toward the viewer,
 * all in [−1, 1] with the cloud's radius at 1 — exactly how `cardViz.ts`
 * projects the sphere (`py = uy·cos(tilt) − uz·sin(tilt)`), so the raster
 * lands on the constellation's own node positions. A y-up renderer (three.js)
 * negates `y`; nothing else differs between materials.
 *
 * ⚠ PURE, THREE-FREE, DETERMINISTIC. No PRNG: every structure is a function
 * of the cloud and its rule, and the cloud is a closed form. The same slot
 * returns the same figure forever, which is what lets three renderers and a
 * unit test agree on it.
 */

export type FigureSlot = "keynote" | "workshop" | "embedded" | "guided-build";
export type FigureKind = "radiant" | "route" | "mesh" | "table";
export type EdgeKind = "ray" | "route" | "chord" | "table";

export interface FigurePoint {
  /** Right, in R units. */
  x: number;
  /** DOWN, in R units (canvas-handed). */
  y: number;
  /** Toward the viewer, in R units. The fade reads this. */
  z: number;
}

export interface FigureEdge {
  a: number;
  b: number;
  kind: EdgeKind;
}

export interface FigureMark {
  /** The node the diamond sits on. */
  i: number;
  /** Radius in the constellation's own units (`cardViz` at R = 328). */
  r: number;
}

export interface ServiceFigure {
  slot: FigureSlot;
  kind: FigureKind;
  points: readonly FigurePoint[];
  /** The structure reaches this node. Unlit nodes are the rest of the estate. */
  lit: readonly boolean[];
  edges: readonly FigureEdge[];
  marks: readonly FigureMark[];
  /** Nodes the structure deliberately leaves joined to nothing (the mesh's
   *  person-led work). Drawn as OPEN squares by every material. */
  unlinked: readonly number[];
  /** The route's walk, in order (empty elsewhere). */
  path: readonly number[];
  /** The radiant's source (−1 elsewhere). */
  source: number;
}

/** `cardViz.ts`'s own cloud — the count and the tilt are the estate. */
export const CLOUD_N = 128;
export const CLOUD_TILT = 0.42;
/** The radiant's hub clearance in R units — `cardViz`'s 15px at R 328. */
export const RAY_GAP = 15 / 328;
/** The route's rules (ADR-086), in R units. */
export const ROUTE_STEPS = 15;
export const ROUTE_STEP_CAP = 0.55;
export const ROUTE_BACK_PENALTY = 0.3;
/** The mesh's neighbour radius (ADR-086), in R units. */
export const MESH_REACH = 0.3;
/** The table's seats and the band of the front hemisphere they sit on. */
export const TABLE_SEATS = 8;
export const TABLE_Z_MIN = 0.4;
export const TABLE_Z_MAX = 0.9;

export const FIGURE_SLOTS: readonly FigureSlot[] = [
  "keynote",
  "workshop",
  "embedded",
  "guided-build",
];

let cloudCache: readonly FigurePoint[] | null = null;

/**
 * The shared substrate: a Fibonacci sphere, tilted, projected canvas-handed.
 * One array for the whole module — the four figures are drawn OVER it.
 */
export function figureCloud(): readonly FigurePoint[] {
  if (cloudCache) return cloudCache;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const c = Math.cos(CLOUD_TILT);
  const s = Math.sin(CLOUD_TILT);
  const out: FigurePoint[] = [];
  for (let i = 0; i < CLOUD_N; i++) {
    const uy = 1 - (i / (CLOUD_N - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - uy * uy));
    const th = golden * i;
    const ux = Math.cos(th) * r;
    const uz = Math.sin(th) * r;
    out.push({ x: ux, y: uy * c - uz * s, z: uz * c + uy * s });
  }
  cloudCache = out;
  return out;
}

const dist2d = (a: FigurePoint, b: FigurePoint) => Math.hypot(a.x - b.x, a.y - b.y);

function radiant(pts: readonly FigurePoint[]): ServiceFigure {
  let s = 0;
  for (let i = 1; i < pts.length; i++) if (pts[i].z > pts[s].z) s = i;
  const lit = pts.map(() => false);
  const edges: FigureEdge[] = [];
  for (let i = 0; i < pts.length; i++) {
    // Every other node: a room, not a hedgehog (the Fibonacci parity is well
    // spread in angle). The front hemisphere is the room.
    if (i === s || i % 2) continue;
    if (pts[i].z < -0.05) continue;
    lit[i] = true;
    edges.push({ a: s, b: i, kind: "ray" });
  }
  lit[s] = true;
  return {
    slot: "keynote",
    kind: "radiant",
    points: pts,
    lit,
    edges,
    marks: [{ i: s, r: 9 }],
    unlinked: [],
    path: [],
    source: s,
  };
}

function route(pts: readonly FigurePoint[]): ServiceFigure {
  // Enter from the left of the field, so the walk reads as a traverse.
  let cur = 0;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].z < 0.1) continue;
    if (pts[cur].z < 0.1 || pts[i].x < pts[cur].x) cur = i;
  }
  const path = [cur];
  const walked = new Set([cur]);
  for (let step = 1; step < ROUTE_STEPS; step++) {
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < pts.length; i++) {
      if (walked.has(i) || pts[i].z < 0.02) continue;
      const d = dist2d(pts[i], pts[cur]);
      // A hard cap on the step, or the walk is not a walk; a forward bias so
      // it advances instead of doubling back (ADR-086).
      if (d > ROUTE_STEP_CAP) continue;
      const penalty = pts[i].x < pts[cur].x ? ROUTE_BACK_PENALTY : 0;
      if (d + penalty < bestD) {
        bestD = d + penalty;
        best = i;
      }
    }
    if (best < 0) break;
    walked.add(best);
    path.push(best);
    cur = best;
  }
  const edges: FigureEdge[] = [];
  for (let k = 1; k < path.length; k++) edges.push({ a: path[k - 1], b: path[k], kind: "route" });
  return {
    slot: "workshop",
    kind: "route",
    points: pts,
    lit: pts.map((_, i) => walked.has(i)),
    edges,
    // Both ends marked — an entry and an exit is what makes a line a route.
    marks: [
      { i: path[0], r: 7 },
      { i: path[path.length - 1], r: 8 },
    ],
    unlinked: [],
    path,
    source: -1,
  };
}

/** The mesh's three seats: one from each horizontal third of the front twelve,
 *  in order and growing (ADR-111). */
function meshSeats(pts: readonly FigurePoint[]): readonly [number, number, number] {
  const front = pts
    .map((_, i) => i)
    .sort((a, z) => pts[z].z - pts[a].z)
    .slice(0, 12);
  const byX = front.slice().sort((a, z) => pts[a].x - pts[z].x);
  return [byX[1], byX[5], byX[9]];
}

function mesh(pts: readonly FigurePoint[]): ServiceFigure {
  const seats = meshSeats(pts);
  const seatSet = new Set<number>(seats);
  /* THE PERSON-LED WORK. The survey's own idiom, one card over, was "a
     handful of nodes deliberately joined to nothing"; with Advisory folded
     into this card the claim moves here. Every eighth front node that is not
     a seat is left out of the triangulation and drawn open — a body that
     holds itself up, and a few things it does not touch. Deterministic on
     the index, so the same nodes stay open forever. */
  const unlinked: number[] = [];
  let frontCount = 0;
  for (let i = 0; i < pts.length; i++) {
    if (pts[i].z <= 0.05 || seatSet.has(i)) continue;
    if (frontCount % 8 === 3) unlinked.push(i);
    frontCount += 1;
  }
  const open = new Set(unlinked);
  const edges: FigureEdge[] = [];
  for (let i = 0; i < pts.length; i++) {
    if (open.has(i)) continue;
    for (let j = i + 1; j < pts.length; j++) {
      if (open.has(j)) continue;
      if (dist2d(pts[i], pts[j]) > MESH_REACH) continue;
      edges.push({ a: i, b: j, kind: "chord" });
    }
  }
  return {
    slot: "embedded",
    kind: "mesh",
    points: pts,
    lit: pts.map((_, i) => !open.has(i)),
    edges,
    marks: seats.map((i, k) => ({ i, r: 6 + k })),
    unlinked,
    path: [],
    source: -1,
  };
}

function table(pts: readonly FigurePoint[]): ServiceFigure {
  // The candidates: a band of the front hemisphere around the pole — the
  // chairs, seen from the viewer's tilt. Eight of them, spread by bearing.
  const cand: number[] = [];
  for (let i = 0; i < pts.length; i++) {
    if (pts[i].z >= TABLE_Z_MIN && pts[i].z <= TABLE_Z_MAX) cand.push(i);
  }
  const bearing = (i: number) => Math.atan2(pts[i].y, pts[i].x);
  const apart = (a: number, b: number) => {
    const d = Math.abs(a - b);
    return d > Math.PI ? Math.PI * 2 - d : d;
  };
  // A chair is a chair only with air either side of it. Farthest-point
  // selection on bearing: the first chair is the candidate nearest twelve
  // o'clock, each next one the candidate farthest (by bearing) from every
  // chair already taken. Eight picks spread the round as evenly as the band
  // allows, and a target-bearing greedy — tried first — left a sector empty
  // once its neighbours were taken.
  const seats: number[] = [];
  const taken = new Set<number>();
  let first = -1;
  let firstD = Infinity;
  for (const i of cand) {
    const d = apart(bearing(i), -Math.PI / 2);
    if (d < firstD) {
      firstD = d;
      first = i;
    }
  }
  if (first >= 0) {
    seats.push(first);
    taken.add(first);
  }
  while (seats.length < TABLE_SEATS) {
    let best = -1;
    let bestGap = -1;
    for (const i of cand) {
      if (taken.has(i)) continue;
      const b = bearing(i);
      let gap = Infinity;
      for (const s of seats) gap = Math.min(gap, apart(b, bearing(s)));
      if (gap > bestGap) {
        bestGap = gap;
        best = i;
      }
    }
    if (best < 0) break;
    seats.push(best);
    taken.add(best);
  }
  seats.sort((a, z) => bearing(a) - bearing(z));
  const edges: FigureEdge[] = [];
  for (let a = 0; a < seats.length; a++) {
    for (let b = a + 1; b < seats.length; b++)
      edges.push({ a: seats[a], b: seats[b], kind: "table" });
  }
  return {
    slot: "guided-build",
    kind: "table",
    points: pts,
    lit: pts.map((_, i) => taken.has(i)),
    edges,
    marks: seats.map((i) => ({ i, r: 5 })),
    unlinked: [],
    path: seats,
    source: -1,
  };
}

const figureCache = new Map<FigureSlot, ServiceFigure>();

/** The figure for a slot. Cached — the record is immutable and the cloud is shared. */
export function figureFor(slot: FigureSlot): ServiceFigure {
  const hit = figureCache.get(slot);
  if (hit) return hit;
  const pts = figureCloud();
  let fig: ServiceFigure;
  switch (slot) {
    case "keynote":
      fig = radiant(pts);
      break;
    case "workshop":
      fig = route(pts);
      break;
    case "guided-build":
      fig = table(pts);
      break;
    case "embedded":
    default:
      fig = mesh(pts);
      break;
  }
  figureCache.set(slot, fig);
  return fig;
}

/** Is this id a figure slot? The plate ids ARE the slots, but a renderer
 *  takes a string and must not fall through silently. */
export function isFigureSlot(id: string): id is FigureSlot {
  return (FIGURE_SLOTS as readonly string[]).includes(id);
}

/**
 * The ink weights the materials share — ADR-086's own values, so a raster, a
 * cloud and a wire agree on what is loud. Alpha is a function of the node's
 * (or the chord's mean) `z`.
 */
export const FIGURE_INK = {
  node: { lit: (near: number) => 0.42 + near * 0.5, unlit: (near: number) => 0.2 + near * 0.18 },
  nodeR: { lit: (near: number) => 3.1 + near * 2.2, unlit: (near: number) => 2.2 + near * 0.9 },
  ray: { width: 1.5, alpha: (near: number) => 0.12 + near * 0.32 },
  route: { width: 2.6, alpha: () => 0.62 },
  chord: { width: 1.7, alpha: (near: number) => 0.14 + near * 0.34 },
  table: { width: 2.0, alpha: (near: number) => 0.3 + near * 0.3 },
} as const;

export const near = (z: number) => Math.max(0, z);
