/**
 * cardViz — the visualization languages a services card can carry.
 *
 * A card is THREE components and no more (owner, 2026-08-30): **a title, a
 * paragraph, and a visualization.** No spec rows, no meters, no fourth register.
 * This module owns the third one.
 *
 * ⚠ THE POINT IS THAT THESE ARE DIFFERENT LANGUAGES, NOT ONE FIGURE RESEEDED.
 * The first pass shipped a single dot-lattice under four names and called it an
 * exploration; the reference board it was drawn from does the opposite — every
 * card invents its visual from scratch. What varies here is the KIND of drawing:
 * a graph, a growth, a body, a field, a structure, an encoding. Each one is a
 * different claim about what a service IS, which is the only reason to have six.
 *
 * Each language reads its own reference on the Brand Codex board:
 *
 *   constellation  Indent's wireframe node globe — a graph; FOUR graphs, one
 *                  per service, over one shared cloud (see §1)
 *   dendrite       "We're manufacturing biology" — growth branching from a spine
 *   meridian       the orange brain — a body drawn in fine concentric section
 *   nebula         "This isn't space, it's your brain" — density as the subject
 *   panel          Adaptive's green rule grid — NO imagery; structure IS the viz
 *   glyph          Marketing Memory's pixel block — the encoded, machine-read
 *
 * ⚠ THREE-FREE and canvas-2D only. Called from inside the bake; must not drag
 * anything into the DOM side's import graph.
 *
 * ⚠ DETERMINISTIC — a seeded PRNG keyed on the service id, never Math.random.
 * The bake reruns on a theme flip, and a figure that reshuffled would read as a
 * glitch. Same service, same drawing, forever.
 */

import { sampleShape } from "@/lib/brandmark/sampleShape";
import { BRANDMARK_FULL_PATHS, BRANDMARK_SHAPE_KEYS } from "@/lib/brandmark/shapes";

export type VizKey = string;

/** Structurally the subset of `FacePalette` these need. */
export interface VizPalette {
  /** Reading ink at an alpha — dawn on dark, latent night on parchment. */
  ink: (a: number) => string;
  /** Chrome gold at an alpha. */
  goldA: (a: number) => string;
  /** Solid accent (#caa554 in both themes, ADR-058 U2). */
  gold: string;
  /** Opaque page ground. */
  ground: string;
}

export interface VizBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/* ── deterministic noise ───────────────────────────────────────────────────── */

function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedOf(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A node mark: an axis-aligned square. Sharp geometry, per the shape law. */
function sq(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

/** A signal mark: a diamond — this system's marker, a 45° square. */
function dia(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();
}

/* ═══════════════════════════════════════════════════════════════════════════
   1. CONSTELLATION — a graph, and FOUR graphs. (Indent, "Your intelligent
   co-worker")

   ⚠ ONE CLOUD, FOUR EDGE RULES (owner, 2026-08-30: "each of them should be
   different, corresponding to the type of service"). The NODE POSITIONS ARE
   IDENTICAL on all four cards — same Fibonacci sphere, same tilt, same count —
   because they stand for the same thing: a client's estate of work, which does
   not change with which engagement is bought. What changes is the STRUCTURE
   drawn over it, and that is exactly what a service does.

     keynote       THE RADIANT — one source, rays out to a room, and no edges
                   between the receivers. A frame arrives; the room is not
                   wired to itself yet.
     workshop      THE ROUTE — one path walked end to end through the field,
                   both ends marked, everything else left untouched. One real
                   workflow, picked out of all of them.
     embedded      THE MESH — near-neighbour triangulation across the whole
                   cloud, with the marks seated INSIDE it. A capability that
                   holds itself up and depends on no single node.
     guided-build  THE SURVEY — the estate divided into five regions, each
                   linked internally, one dashed gold traverse across their
                   marks, and a handful of nodes deliberately joined to
                   nothing: the person-led work, which this house draws
                   rather than omits.

   ⚠ ONE VOCABULARY ACROSS ALL FOUR — square nodes, straight chords, diamond
   signals, depth carried by fade alone. Varying the vocabulary as well would
   give four unrelated pictures, which is the failure this file already made
   once; varying only the edges is what makes a SET.
   ═══════════════════════════════════════════════════════════════════════════ */

interface CloudPoint {
  /** Unit vector on the sphere — kept for angular tests (regions, reach). */
  ux: number;
  uy: number;
  uz: number;
  /** Projected position, canvas space. */
  px: number;
  py: number;
  /** Toward the viewer, [-1, 1]. Fading by this is what gives a flat projection volume. */
  depth: number;
}

const CLOUD_N = 128;
/** A fixed tilt, so the distribution never reads as a flat ring. */
const CLOUD_TILT = 0.42;

/** The shared substrate: a Fibonacci sphere — even, with no seams or polar bunching. */
function sphereCloud(b: VizBox): CloudPoint[] {
  const R = Math.min(b.w, b.h) / 2;
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const out: CloudPoint[] = [];
  for (let i = 0; i < CLOUD_N; i++) {
    const uy = 1 - (i / (CLOUD_N - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - uy * uy));
    const th = golden * i;
    const ux = Math.cos(th) * r;
    const uz = Math.sin(th) * r;
    out.push({
      ux,
      uy,
      uz,
      px: cx + ux * R,
      py: cy + (uy * Math.cos(CLOUD_TILT) - uz * Math.sin(CLOUD_TILT)) * R,
      depth: uz * Math.cos(CLOUD_TILT) + uy * Math.sin(CLOUD_TILT),
    });
  }
  return out;
}

/** One node of the cloud. `lit` = the structure reaches it; unlit stays present but quiet. */
function cloudNode(
  ctx: CanvasRenderingContext2D,
  pal: VizPalette,
  p: CloudPoint,
  lit: boolean
): void {
  const near = Math.max(0, p.depth);
  /* ⚠ The unlit rung is not decoration — on the radiant and the route it is the
     REST OF THE ESTATE, and a claim like "one workflow out of all of them" only
     lands if the ones not chosen are visible. Measured up from .13, where the
     field vanished against the card ground and the route read as floating. */
  ctx.fillStyle = lit ? pal.ink(0.42 + near * 0.5) : pal.ink(0.2 + near * 0.18);
  sq(ctx, p.px, p.py, lit ? 3.1 + near * 2.2 : 2.2 + near * 0.9);
}

/** KEYNOTE — the radiant. One source reaches a room; the room has no edges yet. */
function radiant(ctx: CanvasRenderingContext2D, pts: CloudPoint[], pal: VizPalette): void {
  // The source is the node nearest the viewer — the front pole projects at the
  // centre of the field, so the fan opens from the middle.
  let s = 0;
  for (let i = 1; i < pts.length; i++) if (pts[i].depth > pts[s].depth) s = i;
  const src = pts[s];

  const reached = new Set<number>();
  ctx.lineWidth = 1.5;
  for (let i = 0; i < pts.length; i++) {
    // Every other node: a room, not a hedgehog. Parity on the Fibonacci index
    // is well spread in angle, so the thinning leaves no gap.
    if (i === s || i % 2) continue;
    const p = pts[i];
    if (p.depth < -0.05) continue; // the front hemisphere is the room
    reached.add(i);
    const dx = p.px - src.px;
    const dy = p.py - src.py;
    const d = Math.hypot(dx, dy) || 1;
    // Start each ray clear of the source, or the hub becomes a blot instead of
    // a mark — thirty lines meeting at a point is an ink well.
    const GAP = 15;
    ctx.strokeStyle = pal.ink(0.12 + Math.max(0, p.depth) * 0.32);
    ctx.beginPath();
    ctx.moveTo(src.px + (dx / d) * GAP, src.py + (dy / d) * GAP);
    ctx.lineTo(p.px, p.py);
    ctx.stroke();
  }

  pts.forEach((p, i) => cloudNode(ctx, pal, p, reached.has(i)));
  ctx.fillStyle = pal.gold;
  dia(ctx, src.px, src.py, 9);
}

/** WORKSHOP — the route. One workflow walked end to end. */
function route(ctx: CanvasRenderingContext2D, pts: CloudPoint[], pal: VizPalette, R: number): void {
  const STEPS = 15;
  // Enter from the left of the field, so the walk reads as a traverse rather
  // than a knot.
  let cur = 0;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].depth < 0.1) continue;
    if (pts[cur].depth < 0.1 || pts[i].px < pts[cur].px) cur = i;
  }
  const path = [cur];
  const walked = new Set([cur]);
  for (let step = 1; step < STEPS; step++) {
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < pts.length; i++) {
      if (walked.has(i) || pts[i].depth < 0.02) continue;
      const d = Math.hypot(pts[i].px - pts[cur].px, pts[i].py - pts[cur].py);
      /* A HARD CAP ON THE STEP, or the walk is not a walk. Without it the greedy
         rule happily jumps a third of the field to satisfy the forward bias, and
         a path made of long hops reads as a plotted line rather than as a route
         through the nodes around it. */
      if (d > R * 0.55) continue;
      // Forward bias: a route advances across the field instead of doubling
      // back into the nodes it just left.
      const penalty = pts[i].px < pts[cur].px ? R * 0.3 : 0;
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

  // The walk is HEAVIER than any other chord on these four cards: it is the one
  // workflow, and the weight is what picks it out of the field around it.
  ctx.lineWidth = 2.6;
  ctx.lineJoin = "round";
  ctx.strokeStyle = pal.ink(0.62);
  ctx.beginPath();
  path.forEach((i, k) => (k ? ctx.lineTo(pts[i].px, pts[i].py) : ctx.moveTo(pts[i].px, pts[i].py)));
  ctx.stroke();
  ctx.lineJoin = "miter";

  pts.forEach((p, i) => cloudNode(ctx, pal, p, walked.has(i)));

  // BOTH ends marked — an entry and an exit is what makes a line a route rather
  // than a tail.
  const head = pts[path[0]];
  const tail = pts[path[path.length - 1]];
  ctx.fillStyle = pal.gold;
  dia(ctx, head.px, head.py, 7);
  dia(ctx, tail.px, tail.py, 8);
}

/** EMBEDDED — the mesh. A body that holds itself up. */
function mesh(ctx: CanvasRenderingContext2D, pts: CloudPoint[], pal: VizPalette, R: number): void {
  // Chords between near neighbours. Straight lines only — the sphere is implied
  // by the point distribution, never drawn as an outline.
  ctx.lineWidth = 1.7;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i].px - pts[j].px, pts[i].py - pts[j].py);
      if (d > R * 0.3) continue;
      const near = (pts[i].depth + pts[j].depth) / 2;
      ctx.strokeStyle = pal.ink(0.14 + Math.max(0, near) * 0.34);
      ctx.beginPath();
      ctx.moveTo(pts[i].px, pts[i].py);
      ctx.lineTo(pts[j].px, pts[j].py);
      ctx.stroke();
    }
  }
  pts.forEach((p) => cloudNode(ctx, pal, p, true));

  // The marks are SEATED — the nodes nearest the viewer, i.e. inside the body
  // rather than on its rim. An owned layer sits in the middle of a team, and
  // spacing them through the front twelve keeps three marks from clumping.
  const byDepth = pts.map((_, i) => i).sort((a, z) => pts[z].depth - pts[a].depth);
  ctx.fillStyle = pal.gold;
  for (let k = 0; k < 12; k += 4) dia(ctx, pts[byDepth[k]].px, pts[byDepth[k]].py, 6);
}

/** ADVISORY — the survey. The whole estate read across, including what is not built. */
function survey(
  ctx: CanvasRenderingContext2D,
  pts: CloudPoint[],
  pal: VizPalette,
  R: number,
  b: VizBox
): void {
  /* THE REGIONS ARE SOLVED IN THE PROJECTION, NOT ON THE SPHERE, and the first
     cut solved them on the sphere where they are invisible: five directions
     partition a sphere correctly, then the flat projection lays the far half
     straight over the near half, so every region interleaves with the one
     behind it and the whole drawing reads as a mesh with holes in it. A
     division has to happen in the plane the reader is looking at.

     AND THE SEEDS ARE IRREGULAR ON PURPOSE. Five equal sectors around the
     centre would partition the disc perfectly well and read as a PIE, i.e. a
     circular indicator, which this system does not draw. Irregular seeds give
     irregular regions: a surveyed estate rather than a chart of one. */
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const SEEDS: readonly (readonly [number, number])[] = [
    [-0.56, -0.42],
    [0.08, -0.63],
    [0.63, -0.06],
    [0.28, 0.56],
    [-0.47, 0.36],
  ];
  const seeds = SEEDS.map(([sx, sy]) => ({ x: cx + sx * R, y: cy + sy * R }));

  /* ⚠ THE UNLINKED NODES ARE THE POINT, NOT AN OMISSION. The advisory read
     names what should stay person-led, so the drawing has to be able to say it
     — the Intelligence Map's own rule, one surface over: a map that shows only
     what was configured shows what was built and hides what was not. */
  const held = (i: number) => i % 19 === 3;

  const region = pts.map((p, i) => {
    if (held(i)) return -1;
    let best = 0;
    let bestD = Infinity;
    seeds.forEach((s, k) => {
      const d = Math.hypot(p.px - s.x, p.py - s.y);
      if (d < bestD) {
        bestD = d;
        best = k;
      }
    });
    return best;
  });

  // Inside a region only, so the estate reads as DIVIDED before anything
  // crosses it.
  ctx.lineWidth = 1.5;
  for (let i = 0; i < pts.length; i++) {
    if (region[i] < 0) continue;
    for (let j = i + 1; j < pts.length; j++) {
      if (region[j] !== region[i]) continue;
      const d = Math.hypot(pts[i].px - pts[j].px, pts[i].py - pts[j].py);
      if (d > R * 0.29) continue;
      const near = (pts[i].depth + pts[j].depth) / 2;
      ctx.strokeStyle = pal.ink(0.13 + Math.max(0, near) * 0.3);
      ctx.beginPath();
      ctx.moveTo(pts[i].px, pts[i].py);
      ctx.lineTo(pts[j].px, pts[j].py);
      ctx.stroke();
    }
  }

  // One mark per region: the member closest to its own seed direction.
  const marks: number[] = [];
  seeds.forEach((s, k) => {
    let best = -1;
    let bestD = Infinity;
    pts.forEach((p, i) => {
      if (region[i] !== k) return;
      const d = Math.hypot(p.px - s.x, p.py - s.y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best >= 0) marks.push(best);
  });

  /* The traverse. GOLD IS WAYFINDING — this is the one line that crosses the
     whole estate, and it is the only thing on the card entitled to the accent
     as a LINE. Sorted left to right so it reads as a single pass rather than a
     circuit. */
  marks.sort((a, z) => pts[a].px - pts[z].px);
  ctx.setLineDash([6, 7]);
  ctx.strokeStyle = pal.goldA(0.55);
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  marks.forEach((i, k) =>
    k ? ctx.lineTo(pts[i].px, pts[i].py) : ctx.moveTo(pts[i].px, pts[i].py)
  );
  ctx.stroke();
  ctx.setLineDash([]);

  pts.forEach((p, i) => {
    if (region[i] >= 0) {
      cloudNode(ctx, pal, p, true);
      return;
    }
    // Person-led: an OPEN square, joined to nothing. Hollow because it is
    // present and unencoded, not because it is absent.
    ctx.strokeStyle = pal.ink(0.34 + Math.max(0, p.depth) * 0.28);
    ctx.lineWidth = 1.6;
    ctx.strokeRect(p.px - 4, p.py - 4, 8, 8);
  });

  ctx.fillStyle = pal.gold;
  marks.forEach((i) => dia(ctx, pts[i].px, pts[i].py, 6));
}

function constellation(
  ctx: CanvasRenderingContext2D,
  b: VizBox,
  pal: VizPalette,
  rand: () => number,
  service: VizKey
): void {
  const pts = sphereCloud(b);
  const R = Math.min(b.w, b.h) / 2;
  switch (service) {
    case "keynote":
      return radiant(ctx, pts, pal);
    case "workshop":
      return route(ctx, pts, pal, R);
    case "guided-build":
      return survey(ctx, pts, pal, R, b);
    // `embedded`, and the safe default for any id this file does not know.
    default:
      return mesh(ctx, pts, pal, R);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. DENDRITE — growth. ("We're manufacturing biology")
   A spine with branches, each branch spawning finer ones, marks at every
   junction. Recursive, so the figure is built by a RULE rather than placed.
   ═══════════════════════════════════════════════════════════════════════════ */
function dendrite(
  ctx: CanvasRenderingContext2D,
  b: VizBox,
  pal: VizPalette,
  rand: () => number
): void {
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const tips: { x: number; y: number; gen: number }[] = [];

  const grow = (x: number, y: number, ang: number, len: number, gen: number): void => {
    if (gen > 4 || len < 12) {
      tips.push({ x, y, gen });
      return;
    }
    const ex = x + Math.cos(ang) * len;
    const ey = y + Math.sin(ang) * len;
    ctx.strokeStyle = pal.ink(0.5 - gen * 0.07);
    ctx.lineWidth = Math.max(1, 4.4 - gen * 0.9);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    // A junction mark at every branch point — the thing a reader counts.
    ctx.fillStyle = pal.ink(0.62);
    sq(ctx, ex, ey, Math.max(1.8, 4 - gen * 0.6));

    const forks = gen < 2 ? 3 : 2;
    for (let i = 0; i < forks; i++) {
      const spread = 0.95 - gen * 0.12;
      const a = ang + (i - (forks - 1) / 2) * spread + (rand() - 0.5) * 0.3;
      grow(ex, ey, a, len * (0.6 + rand() * 0.16), gen + 1);
    }
  };

  // Six primaries from the centre, so the figure fills its box rather than
  // reaching in one direction.
  for (let i = 0; i < 6; i++) {
    grow(cx, cy, (i / 6) * Math.PI * 2 + 0.3, b.h * 0.19, 0);
  }
  // The tips carry the signal: growth is legible at its edge, not its root.
  ctx.fillStyle = pal.gold;
  tips.filter((_, i) => i % 9 === 0).forEach((t) => dia(ctx, t.x, t.y, 5));
  ctx.fillStyle = pal.ink(0.9);
  sq(ctx, cx, cy, 6);
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. MERIDIAN — a body in section. (the orange "brain is an unexplored canvas")
   Fine longitude arcs sweeping pole to pole. The one language here built from
   CURVES, and it is the site's own armillary vocabulary rather than a borrowed
   one — the corridor's orbit rings are the same construction.
   ═══════════════════════════════════════════════════════════════════════════ */
function meridian(
  ctx: CanvasRenderingContext2D,
  b: VizBox,
  pal: VizPalette,
  rand: () => number
): void {
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const R = Math.min(b.w, b.h) / 2;
  const LINES = 26;

  ctx.lineWidth = 1.1;
  for (let i = 0; i < LINES; i++) {
    const t = i / (LINES - 1);
    // Ellipse width sweeps −1 → 1, so the meridians crowd at the silhouette's
    // edges exactly as they do on a globe.
    const k = Math.cos(t * Math.PI);
    ctx.strokeStyle = pal.goldA(0.16 + Math.abs(k) * 0.3);
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.abs(k) * R, R, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // One waist ring, brighter — the equator that tells you it is a body and not
  // a stack of ellipses.
  ctx.strokeStyle = pal.goldA(0.5);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(cx, cy, R, R * 0.26, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Two marks on the waist, at the silhouette.
  ctx.fillStyle = pal.gold;
  dia(ctx, cx - R, cy, 6);
  dia(ctx, cx + R, cy, 6);
  void rand;
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. NEBULA — density as the subject. ("This isn't space, it's your brain")
   No outline at all: a lobe emerges only because the marks are denser inside
   it. The figure is the STATISTICS of the field.
   ═══════════════════════════════════════════════════════════════════════════ */
function nebula(
  ctx: CanvasRenderingContext2D,
  b: VizBox,
  pal: VizPalette,
  rand: () => number
): void {
  const cx = b.x + b.w * 0.52;
  const cy = b.y + b.h * 0.5;
  const R = Math.min(b.w, b.h) * 0.58;

  // A closed lobe in polar form, so the boundary is a rule rather than a path.
  const lobe = (a: number): number =>
    R * (0.62 + 0.3 * Math.sin(a * 2 + 0.6) + 0.12 * Math.sin(a * 3 - 1.1));

  for (let i = 0; i < 1500; i++) {
    const a = rand() * Math.PI * 2;
    const edge = lobe(a);
    // Bias outward: the rim is where a density field is legible.
    const rr = Math.pow(rand(), 0.55) * edge * 1.16;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr * 0.86;
    if (x < b.x || x > b.x + b.w || y < b.y || y > b.y + b.h) continue;
    // Falling off past the rim is what makes the shape read without an outline.
    const d = rr / edge;
    const p = d < 1 ? 1 : Math.max(0, 1 - (d - 1) * 5.5);
    if (rand() > p) continue;
    const near = 1 - Math.min(1, d);
    ctx.fillStyle = pal.ink(0.26 + near * 0.56);
    sq(ctx, x, y, 2 + near * 2.2);
  }
  // A short gold run along one flank — the reading the eye is meant to take.
  ctx.fillStyle = pal.gold;
  for (let i = 0; i < 7; i++) {
    const a = 0.55 + i * 0.14;
    dia(ctx, cx + Math.cos(a) * lobe(a), cy + Math.sin(a) * lobe(a) * 0.86, 4.6);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. PANEL — structure IS the visualization. (Adaptive, "take action across
   every inbox")
   NO imagery whatsoever: hairlines divide the field into asymmetric panels and
   ONE cell is filled. The most restrained language on the board, and the one
   closest to what this house already draws — the map's divided plate.
   ═══════════════════════════════════════════════════════════════════════════ */
function panel(
  ctx: CanvasRenderingContext2D,
  b: VizBox,
  pal: VizPalette,
  rand: () => number
): void {
  // A slice-and-dice partition, deterministic per service. Cuts alternate axis
  // so no cell degenerates into a sliver.
  interface Cell {
    x: number;
    y: number;
    w: number;
    h: number;
  }
  let cells: Cell[] = [{ x: b.x, y: b.y, w: b.w, h: b.h }];
  for (let pass = 0; pass < 4; pass++) {
    const next: Cell[] = [];
    for (const c of cells) {
      // Only cut the larger cells — a partition that cuts everything evenly is
      // a grid, and a grid says nothing.
      if ((pass > 1 && rand() < 0.45) || c.w < 90 || c.h < 90) {
        next.push(c);
        continue;
      }
      const vertical = c.w > c.h;
      const f = 0.34 + rand() * 0.32;
      if (vertical) {
        next.push({ ...c, w: c.w * f }, { ...c, x: c.x + c.w * f, w: c.w * (1 - f) });
      } else {
        next.push({ ...c, h: c.h * f }, { ...c, y: c.y + c.h * f, h: c.h * (1 - f) });
      }
    }
    cells = next;
  }

  ctx.strokeStyle = pal.ink(0.34);
  ctx.lineWidth = 2.2;
  for (const c of cells) ctx.strokeRect(c.x, c.y, c.w, c.h);

  // ONE filled cell, and it is the accent's whole budget on this card.
  const byArea = [...cells].sort((a, b) => a.w * a.h - b.w * b.h);
  const lit = byArea[Math.floor(byArea.length * 0.45)] ?? cells[0];
  ctx.fillStyle = pal.gold;
  ctx.fillRect(lit.x, lit.y, lit.w, lit.h);
}

/* ═══════════════════════════════════════════════════════════════════════════
   6. GLYPH — the encoded. (The Marketing Memory Co.)
   A blocky mark on a coarse lattice, with a dither spray eroding its edge:
   something machine-written, being read.
   ═══════════════════════════════════════════════════════════════════════════ */
function glyph(
  ctx: CanvasRenderingContext2D,
  b: VizBox,
  pal: VizPalette,
  rand: () => number
): void {
  const N = 9;
  const cell = Math.min(b.w, b.h) / N;
  const ox = b.x + (b.w - cell * N) / 2;
  const oy = b.y + (b.h - cell * N) / 2;

  // Built on the LEFT half and mirrored: bilateral symmetry is what separates a
  // glyph from noise, and it is how the reference's block mark reads.
  const on: boolean[][] = Array.from({ length: N }, () => Array<boolean>(N).fill(false));
  const half = Math.ceil(N / 2);
  /* GROWN, not sampled. A per-cell coin flip produces static — the eye reads
     noise and stops. A seeded walk over the left half keeps the ON cells
     CONNECTED, so the mirrored result is a form with limbs rather than a
     speckle field, which is what makes the reference's block mark legible. */
  let wx = half - 1;
  let wy = Math.floor(N / 2);
  const set = (x: number, y: number) => {
    if (x < 0 || x >= half || y < 0 || y >= N) return;
    on[y][x] = true;
    on[y][N - 1 - x] = true;
  };
  set(wx, wy);
  for (let step = 0; step < 26; step++) {
    const d = Math.floor(rand() * 4);
    if (d === 0) wy = Math.max(0, wy - 1);
    else if (d === 1) wy = Math.min(N - 1, wy + 1);
    else if (d === 2) wx = Math.max(0, wx - 1);
    else wx = Math.min(half - 1, wx + 1);
    set(wx, wy);
    // Thicken occasionally, so limbs read as blocks rather than as a 1-cell line.
    if (rand() < 0.5) set(wx, wy + 1);
    if (rand() < 0.32) set(wx + 1, wy);
  }

  ctx.fillStyle = pal.gold;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (on[r][c]) ctx.fillRect(ox + c * cell + 1, oy + r * cell + 1, cell - 2, cell - 2);
    }
  }

  // Dither spray at the edge — the mark eroding into the field it was read from.
  const sub = cell / 3;
  ctx.fillStyle = pal.ink(0.4);
  for (let i = 0; i < 460; i++) {
    const gx = Math.floor(rand() * N * 3);
    const gy = Math.floor(rand() * N * 3);
    const cc = Math.floor(gx / 3);
    const rr = Math.floor(gy / 3);
    if (on[rr]?.[cc]) continue;
    // Denser near an ON cell, so the spray reads as erosion rather than noise.
    const near =
      (on[rr]?.[cc - 1] ? 1 : 0) +
      (on[rr]?.[cc + 1] ? 1 : 0) +
      (on[rr - 1]?.[cc] ? 1 : 0) +
      (on[rr + 1]?.[cc] ? 1 : 0);
    if (rand() > near * 0.3) continue;
    ctx.fillRect(ox + gx * sub, oy + gy * sub, sub - 1, sub - 1);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   THE HOUSE'S OWN INSTRUMENTS

   The six languages above are read off the reference board — other people's
   cards, translated. These three are drawn from THIS SITE: the brandmark's own
   particle sampler, the celestial-connector primitive set, and the crystal
   facet. Owner, 2026-08-30: "tap into our particle system, our glyphs, whatever,
   our diagrams, to really create super cool but elegant, minimalistic visuals."

   They are the stronger answer for the same reason the casefile instruments are
   — a drawing assembled from vocabulary the site already speaks cannot look
   borrowed, and it inherits every decision that vocabulary already made.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * SIGIL — the Thoughtform brandmark itself, as a stratified point cloud.
 *
 * Not a picture OF the mark: `sampleShape` is the same sampler the landing's
 * particle painter runs, hit-testing the real `BRANDMARK_FULL_PATHS` with
 * Path2D + isPointInPath, so this cloud and the corridor's brandmark are the
 * same artifact at two densities. ADR-011's claim, literally — the mark is a
 * runtime substrate rather than a finished asset.
 *
 * Each service takes a different DENSITY TIER off that ADR's own ladder: the
 * mark resolves for one service and disperses for another, and THAT is the
 * variation. The shape never changes, because it is the brandmark.
 */
function sigil(
  ctx: CanvasRenderingContext2D,
  b: VizBox,
  pal: VizPalette,
  rand: () => number
): void {
  const sample = sampleShape({
    shapeKey: BRANDMARK_SHAPE_KEYS.full,
    paths: BRANDMARK_FULL_PATHS,
    viewBox: { x: 0, y: 0, width: 430.99, height: 436 },
    count: 2600,
  });
  if (!sample.count) return;

  // Square the box: the mark's viewBox is near-square, and a stretched
  // brandmark is the one thing this may never be.
  const s = Math.min(b.w, b.h);
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;

  const density = 0.55 + rand() * 0.45;
  const dispersion = (1 - density) * 0.55;
  const keep = Math.floor(sample.count * density);

  for (let i = 0; i < sample.count; i++) {
    // Rank-clip rather than slice: the sampler shuffles rank, so clipping by it
    // thins the cloud UNIFORMLY instead of eating one region of the mark.
    if (sample.rank[i] >= keep) continue;
    const hx = sample.home[i * 2];
    const hy = sample.home[i * 2 + 1];
    const sx = sample.seed[i * 2];
    const sy = sample.seed[i * 2 + 1];
    // Wander scaled by the tier — the sinusoidal drift the shader applies.
    const wob = dispersion * s * 0.09;
    const x = cx + hx * s + Math.sin(sx * 6.28) * wob;
    const y = cy + hy * s + Math.cos(sy * 6.28) * wob;
    ctx.fillStyle = pal.goldA(0.34 + (1 - dispersion) * 0.42);
    ctx.fillRect(x, y, 2.5, 2.5);
  }
}

/**
 * ARMILLARY — the celestial-connector vocabulary, composed.
 *
 * Rings + BearingTicks + OrbitalNodes + Reticle, ported from
 * `components/landing/v7/CelestialConnector/shapes/**` at their own radii and
 * alphas. That set is already the site's diagram language between sections;
 * this is the same instrument at card scale.
 *
 * ⚠ The primitives are React/SVG and cannot mount inside a canvas bake, so the
 * GEOMETRY is ported while the components stay the source of truth. The radii
 * ladder (110/92/74/56/38), the dash patterns and the per-ring alphas are
 * reproduced exactly — if that ladder moves there, move it here.
 */
function armillary(
  ctx: CanvasRenderingContext2D,
  b: VizBox,
  pal: VizPalette,
  rand: () => number
): void {
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  // The primitive set is authored against a 110-unit outer radius.
  const k = (Math.min(b.w, b.h) / 2 / 110) * 0.94;
  const R = (u: number) => u * k;

  // Rings — the five-radius ladder and its per-ring style, verbatim.
  const RINGS: [number, string, number[]][] = [
    [110, "dawn-dash", [1, 5]],
    [92, "dawn", []],
    [74, "gold22", [2, 6]],
    [56, "gold35", []],
    [38, "gold15", [1, 3]],
  ];
  ctx.lineWidth = 1.4;
  for (const [r, tone, dash] of RINGS) {
    ctx.setLineDash(dash.map((d) => d * k * 1.6));
    ctx.strokeStyle =
      tone === "dawn-dash"
        ? pal.ink(0.15)
        : tone === "dawn"
          ? pal.ink(0.1)
          : pal.goldA(tone === "gold22" ? 0.22 : tone === "gold35" ? 0.35 : 0.15);
    ctx.beginPath();
    ctx.arc(cx, cy, R(r), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // BearingTicks — a graduated rim: the instrument's own scale.
  ctx.strokeStyle = pal.ink(0.3);
  ctx.lineWidth = 1.2;
  const TICKS = 36;
  for (let i = 0; i < TICKS; i++) {
    const a = (i / TICKS) * Math.PI * 2 - Math.PI / 2;
    const len = R(i % 9 === 0 ? 14 : 8);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * R(110), cy + Math.sin(a) * R(110));
    ctx.lineTo(cx + Math.cos(a) * (R(110) - len), cy + Math.sin(a) * (R(110) - len));
    ctx.stroke();
  }

  // OrbitalNodes — tilted elliptical paths carrying evenly spaced nodes.
  const orbits = [
    { rx: 100, ry: 34, tilt: -18, n: 3 },
    { rx: 78, ry: 62, tilt: 24, n: 2 },
  ];
  for (const o of orbits) {
    const t = (o.tilt * Math.PI) / 180;
    ctx.setLineDash([2 * k * 2.4, 5 * k * 2.4]);
    ctx.strokeStyle = pal.goldA(0.26);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, R(o.rx), R(o.ry), t, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    // Nodes ride the ellipse's own parametric angle, then rotate with the tilt.
    const phase = rand() * Math.PI * 2;
    for (let i = 0; i < o.n; i++) {
      const p = phase + (i / o.n) * Math.PI * 2;
      const ex = Math.cos(p) * R(o.rx);
      const ey = Math.sin(p) * R(o.ry);
      ctx.fillStyle = pal.gold;
      dia(
        ctx,
        cx + ex * Math.cos(t) - ey * Math.sin(t),
        cy + ex * Math.sin(t) + ey * Math.cos(t),
        5
      );
    }
  }

  // Reticle — the crosshair and the centre.
  ctx.strokeStyle = pal.goldA(0.4);
  ctx.lineWidth = 1.2;
  for (const [a, bb] of [
    [-56, -18],
    [18, 56],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(cx + R(a), cy);
    ctx.lineTo(cx + R(bb), cy);
    ctx.moveTo(cx, cy + R(a));
    ctx.lineTo(cx, cy + R(bb));
    ctx.stroke();
  }
  // An OPAQUE disc under the mark, so the orbits pass BEHIND it rather than
  // through it — the primitive fills with --void for the same reason.
  ctx.fillStyle = pal.ground;
  ctx.beginPath();
  ctx.arc(cx, cy, R(14), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = pal.goldA(0.7);
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = pal.gold;
  dia(ctx, cx, cy, R(7));
}

/**
 * CRYSTAL — the faceted skill symbol (`CrystalFacet`).
 *
 * Outer N-gon, a rotated inner N-gon at half a step, and a facet line from each
 * outer vertex to its two nearest inner ones. The primitive's own note calls it
 * "on-brand: sharp geometry, diamonds not circles, zero border-radius" — it is
 * the most minimal drawing the house owns.
 *
 * The per-service variable is the FACET COUNT, so each card is a different
 * SOLID rather than a different noise. That is the difference between a set and
 * four renders of one idea.
 */
function crystal(
  ctx: CanvasRenderingContext2D,
  b: VizBox,
  pal: VizPalette,
  rand: () => number
): void {
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const outerR = (Math.min(b.w, b.h) / 2) * 0.9;
  const facets = [4, 5, 6, 8][Math.floor(rand() * 4)];
  const innerR = outerR * 0.44;
  const half = Math.PI / facets;

  const poly = (n: number, r: number, rot: number) =>
    Array.from({ length: n }, (_, i) => {
      const a = rot + (i / n) * Math.PI * 2;
      return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
    });
  const outer = poly(facets, outerR, -Math.PI / 2);
  const inner = poly(facets, innerR, -Math.PI / 2 + half);
  const trace = (pts: { x: number; y: number }[]) => {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
  };

  // Inner facet fill — the primitive's gold-15, and the drawing's only mass.
  ctx.fillStyle = pal.goldA(0.15);
  trace(inner);
  ctx.fill();

  // Faceting: every outer vertex to its two nearest inner vertices.
  ctx.strokeStyle = pal.goldA(0.34);
  ctx.lineWidth = 1.3;
  outer.forEach((op, i) => {
    for (const ip of [inner[i], inner[(i + facets - 1) % facets]]) {
      ctx.beginPath();
      ctx.moveTo(op.x, op.y);
      ctx.lineTo(ip.x, ip.y);
      ctx.stroke();
    }
  });

  ctx.strokeStyle = pal.goldA(0.62);
  ctx.lineWidth = 1.8;
  trace(outer);
  ctx.stroke();
  ctx.strokeStyle = pal.goldA(0.5);
  ctx.lineWidth = 1.4;
  trace(inner);
  ctx.stroke();

  // One signal, on the topmost vertex of the solid.
  ctx.fillStyle = pal.gold;
  dia(ctx, outer[0].x, outer[0].y, 6);
}

/* ── the registry ──────────────────────────────────────────────────────────── */

/**
 * A language's signature.
 *
 * ⚠ THE SERVICE ARRIVES TWICE, AND THE TWO USES ARE DIFFERENT. `rand` is the
 * service-seeded stream — enough when the four cards may differ only in their
 * NOISE. `service` is the key itself, for a language whose four cards differ in
 * STRUCTURE: constellation draws a different figure per service, which a seed
 * cannot express (owner, 2026-08-30). Most languages ignore it, and a
 * four-parameter function assigns to this type unchanged.
 */
type VizDraw = (
  ctx: CanvasRenderingContext2D,
  b: VizBox,
  pal: VizPalette,
  rand: () => number,
  service: VizKey
) => void;

const LANGUAGES: Record<string, VizDraw> = {
  constellation,
  dendrite,
  meridian,
  nebula,
  panel,
  glyph,
  sigil,
  armillary,
  crystal,
};

export type VizLanguage = keyof typeof LANGUAGES | string;

/**
 * Draw one visualization language into a box, for one service.
 *
 * The LANGUAGE decides what kind of drawing it is; the SERVICE decides which
 * drawing of that kind. That split is what lets a variant be a design direction
 * rather than four unrelated pictures.
 */
export function drawCardViz(
  ctx: CanvasRenderingContext2D,
  language: VizLanguage,
  service: VizKey,
  pal: VizPalette,
  box: VizBox
): void {
  const draw = LANGUAGES[language] ?? constellation;
  draw(ctx, box, pal, prng(seedOf(`${language}:${service}`)), service);
}

/* ═══════════════════════════════════════════════════════════════════════════
   The photograph, kept but processed.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Re-screen whatever is already on the canvas as a halftone of square cells.
 *
 * Run AFTER the photo and its LUT, so it screens the toned plate rather than the
 * raw image. This is the move the reference board makes when a person does stay
 * in the frame: the photograph becomes MATERIAL — dithered, obviously processed
 * — instead of reading as a headshot dropped into a card.
 *
 * ⚠ Cells are SQUARES on a fixed lattice, not dots: the same sharp-geometry law
 * everything else here obeys, and a round-dot screen would read as newsprint
 * rather than as this system's own pixel grammar.
 */
export function applyHalftone(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pal: VizPalette
): void {
  const CELL = 9;
  const src = ctx.getImageData(0, 0, w, h);
  const px = src.data;

  ctx.fillStyle = pal.ground;
  ctx.fillRect(0, 0, w, h);

  for (let cy = 0; cy < h; cy += CELL) {
    for (let cx = 0; cx < w; cx += CELL) {
      // Sampling every other pixel is indistinguishable at this cell size and
      // quarters the work.
      let sum = 0;
      let n = 0;
      for (let y = cy; y < Math.min(cy + CELL, h); y += 2) {
        for (let x = cx; x < Math.min(cx + CELL, w); x += 2) {
          const i = (y * w + x) * 4;
          sum += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
          n++;
        }
      }
      if (!n) continue;
      const lum = sum / n / 255;
      // A slight gamma keeps the mid-tones open — linear size on a dark plate
      // crushes the whole face to near-solid.
      const size = Math.pow(lum, 0.72) * (CELL - 1.1);
      if (size < 0.6) continue;
      const off = (CELL - size) / 2;
      ctx.fillStyle = pal.ink(Math.min(0.92, 0.34 + lum * 0.62));
      ctx.fillRect(cx + off, cy + off, size, size);
    }
  }
}
