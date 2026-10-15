/**
 * The machine brain (ADR-156 U9): a glass brain with a machine inside it,
 * seen face on, after the owner's references (2026-10-15): two hemispheres
 * of thick glass, their swirls read as glass, not folds; inside each a
 * mechanism of boards, chips, lenses and ribbed tubes; a corrugated spine
 * down the fissure; the temporal lobes as two glass pods with a lens in
 * each; under it a connector block and a manifold from which the cables
 * hang. It stands still; only its signals move.
 *
 * The anatomy method: every part named, true sizes in its own units (the
 * brain is 430 wide), no line ending in mid-air: every trace runs chip to
 * chip, every cable leaves a port.
 *
 *   glass        each hemisphere's outline, two inner walls, five swirls
 *   pods         the temporal lobes, a lens in each
 *   boards       chip packages inside, their pins, the traces between them
 *   lenses       ringed optics among the boards
 *   coils        a ribbed tube in each hemisphere
 *   spine        the corrugated tube down the fissure
 *   block        the connector block under the spine, and its manifold
 *   ports        the manifold's ports: every cable leaves one
 *
 * Local units, origin at the brain's centre, +x right, +y DOWN (screen).
 *
 * ⚠ PURE: the act paints; this decides.
 */

export interface Pt {
  x: number;
  y: number;
}

export interface Board {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Pins as short segments off its edges. */
  pins: [Pt, Pt][];
}

export interface BrainModel {
  /** Each hemisphere's glass: the outline, its inner walls, and the glass
      tubes that swoop through it (centre lines, with their widths). */
  glass: { outline: Pt[]; walls: Pt[][]; swirls: Pt[][]; tubes: { path: Pt[]; w: number }[] }[];
  pods: { outline: Pt[]; lens: { c: Pt; r: number[] } }[];
  boards: Board[];
  /** Traces between boards, squared, as polylines. */
  traces: Pt[][];
  lenses: { c: Pt; r: number[] }[];
  /** Ribbed tubes: the spine of each, and its ribs. */
  coils: { path: Pt[]; ribs: [Pt, Pt][] }[];
  spine: { left: Pt[]; right: Pt[]; ribs: Pt[][] };
  block: { rects: { x: number; y: number; w: number; h: number }[] };
  ports: Pt[];
  /** The cables hanging from the ports, each with its ferrules. */
  cables: { path: Pt[]; w: number; ferrules: number[] }[];
  /** The fine circuitry behind it all: short squared runs, dim. */
  micro: [Pt, Pt][];
  /** Particles on the glass, for the house's texture. */
  dust: Pt[];
  parts: string[];
}

/** The brain's true numbers, in its own units. */
export const BRAIN = { width: 430, top: -186, podBottom: 186, ports: 7 } as const;

/** A closed Catmull-Rom spline through `pts`, `k` samples a span. */
function spline(pts: Pt[], k = 14, closed = true): Pt[] {
  const out: Pt[] = [];
  const n = pts.length;
  const at = (i: number) => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  const spans = closed ? n : n - 1;
  for (let i = 0; i < spans; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    for (let j = 0; j < k; j++) {
      const t = j / k;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  if (closed) out.push(out[0]);
  else out.push(pts[n - 1]);
  return out;
}

const mirror = (p: Pt): Pt => ({ x: -p.x, y: p.y });
const scaleAbout = (pts: Pt[], c: Pt, s: number): Pt[] => pts.map((p) => ({ x: c.x + (p.x - c.x) * s, y: c.y + (p.y - c.y) * s }));
/** A share of a closed polyline, from `a` to `b` (0 to 1). */
const part = (pts: Pt[], a: number, b: number): Pt[] => {
  const n = pts.length - 1;
  const out: Pt[] = [];
  for (let i = Math.floor(a * n); i <= Math.ceil(b * n); i++) out.push(pts[((i % n) + n) % n]);
  return out;
};

/** The left hemisphere's outline, through its landmarks. */
const LEFT: Pt[] = [
  { x: -12, y: -186 },
  { x: -48, y: -204 },
  { x: -104, y: -204 },
  { x: -158, y: -178 },
  { x: -200, y: -130 },
  { x: -222, y: -66 },
  { x: -226, y: 0 },
  { x: -214, y: 58 },
  { x: -186, y: 102 },
  { x: -146, y: 120 },
  { x: -104, y: 106 },
  { x: -64, y: 112 },
  { x: -30, y: 108 },
  { x: -14, y: 76 },
  { x: -12, y: -40 },
  { x: -12, y: -140 },
];
const CENTRE_L: Pt = { x: -112, y: -44 };

/** The glass tubes of the left hemisphere: centre lines through landmarks,
    and their widths; they swoop as a glass brain's ridges do. */
const TUBES_L: { pts: Pt[]; w: number }[] = [
  { pts: [{ x: -34, y: -178 }, { x: -96, y: -190 }, { x: -160, y: -160 }, { x: -200, y: -100 }, { x: -210, y: -24 }], w: 13 },
  { pts: [{ x: -206, y: 18 }, { x: -192, y: 70 }, { x: -150, y: 98 }, { x: -100, y: 88 }, { x: -70, y: 54 }], w: 12 },
  { pts: [{ x: -54, y: -150 }, { x: -118, y: -150 }, { x: -168, y: -110 }, { x: -170, y: -62 }, { x: -136, y: -44 }, { x: -104, y: -66 }], w: 10 },
  { pts: [{ x: -186, y: -30 }, { x: -168, y: 12 }, { x: -128, y: 26 }, { x: -96, y: 8 }], w: 9 },
  { pts: [{ x: -30, y: 84 }, { x: -64, y: 96 }, { x: -110, y: 92 }], w: 8 },
];

function ellipse(c: Pt, rx: number, ry: number, rot = 0, k = 64): Pt[] {
  const out: Pt[] = [];
  for (let j = 0; j <= k; j++) {
    const t = (j / k) * Math.PI * 2;
    const x = Math.cos(t) * rx;
    const y = Math.sin(t) * ry;
    out.push({ x: c.x + x * Math.cos(rot) - y * Math.sin(rot), y: c.y + x * Math.sin(rot) + y * Math.cos(rot) });
  }
  return out;
}

let cache: BrainModel | null = null;

export function brainModel(): BrainModel {
  if (cache) return cache;
  const parts: string[] = [];
  let seed = 31;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // ── The glass ──────────────────────────────────────────────────────────
  const outlineL = spline(LEFT, 16);
  const glassFor = (o: Pt[], c: Pt) => ({
    outline: o,
    // The glass's thickness: an inner wall close under the outline, in part.
    walls: [part(scaleAbout(o, c, 0.955), 0.02, 0.46), part(scaleAbout(o, c, 0.94), 0.5, 0.86)],
    swirls: [] as Pt[][],
    tubes: TUBES_L.map((t) => ({ path: spline(t.pts, 12, false), w: t.w })),
  });
  const gL = glassFor(outlineL, CENTRE_L);
  const mirrorAll = (pts: Pt[]) => pts.map(mirror);
  const glass = [
    gL,
    {
      outline: mirrorAll(gL.outline),
      walls: gL.walls.map(mirrorAll),
      swirls: [] as Pt[][],
      tubes: gL.tubes.map((t) => ({ path: mirrorAll(t.path), w: t.w })),
    },
  ];
  parts.push("left hemisphere glass", "right hemisphere glass");

  // ── The pods: the temporal lobes, a lens in each ───────────────────────
  const podL = { outline: ellipse({ x: -96, y: 150 }, 64, 34, -0.12), lens: { c: { x: -96, y: 150 }, r: [20, 14, 8, 3] } };
  const pods = [podL, { outline: podL.outline.map(mirror), lens: { c: mirror(podL.lens.c), r: podL.lens.r } }];
  parts.push("left temporal pod", "right temporal pod", "left lens", "right lens");

  // ── The boards: chip packages, mirrored across the fissure ─────────────
  const B: { x: number; y: number; w: number; h: number }[] = [
    // The column by the spine: thin boards stacked down it.
    { x: -44, y: -150, w: 24, h: 52 },
    { x: -48, y: -90, w: 28, h: 64 },
    { x: -44, y: -18, w: 24, h: 52 },
    { x: -48, y: 42, w: 28, h: 40 },
    // Packages among the tubes.
    { x: -104, y: -118, w: 36, h: 26 },
    { x: -150, y: -20, w: 28, h: 30 },
    { x: -100, y: 30, w: 34, h: 22 },
    { x: -190, y: -96, w: 22, h: 30 },
  ];
  const boardOf = (r: { x: number; y: number; w: number; h: number }): Board => {
    const pins: [Pt, Pt][] = [];
    const n = 4;
    for (let i = 1; i < n; i++) {
      const x = r.x + (r.w * i) / n;
      const y = r.y + (r.h * i) / n;
      pins.push([{ x, y: r.y }, { x, y: r.y - 5 }], [{ x, y: r.y + r.h }, { x, y: r.y + r.h + 5 }]);
      pins.push([{ x: r.x, y }, { x: r.x - 5, y }], [{ x: r.x + r.w, y }, { x: r.x + r.w + 5, y }]);
    }
    return { ...r, pins };
  };
  const boardsL = B.map(boardOf);
  const boards = [...boardsL, ...boardsL.map((b) => boardOf({ x: -b.x - b.w, y: b.y, w: b.w, h: b.h }))];
  boards.forEach((_, i) => parts.push(`board ${i + 1}`));

  // ── Traces: each board to the next, squared, as a board routes ─────────
  const mid = (b: Board): Pt => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
  const tracesL: Pt[][] = [];
  const pairs: [number, number][] = [
    [4, 0], [4, 1], [5, 2], [6, 3], [7, 4], [5, 1], [6, 2],
  ];
  for (const [a, b] of pairs) {
    const p = mid(boardsL[a]);
    const q = mid(boardsL[b]);
    tracesL.push([p, { x: q.x, y: p.y }, q]);
  }
  // Out to the spine: the hemisphere's bus.
  for (const i of [0, 1, 2, 3]) tracesL.push([mid(boardsL[i]), { x: -14, y: mid(boardsL[i]).y }]);
  const traces = [...tracesL, ...tracesL.map((t) => t.map(mirror))];
  parts.push("left bus", "right bus");

  // ── Lenses among the boards ────────────────────────────────────────────
  const lensesL = [
    { c: { x: -132, y: -84 }, r: [12, 7, 3] },
    { c: { x: -164, y: 58 }, r: [10, 5] },
  ];
  const lenses = [...lensesL, ...lensesL.map((l) => ({ c: mirror(l.c), r: l.r }))];
  lenses.forEach((_, i) => parts.push(`lens ${i + 1}`));

  // ── Coils: a ribbed tube through each hemisphere ───────────────────────
  const coilPathL = spline([{ x: -20, y: -60 }, { x: -62, y: -50 }, { x: -96, y: -30 }, { x: -118, y: 6 }, { x: -150, y: 26 }, { x: -186, y: 22 }], 10, false);
  const ribsOf = (path: Pt[], every = 2, half = 6): [Pt, Pt][] => {
    const out: [Pt, Pt][] = [];
    for (let i = 1; i < path.length - 1; i += every) {
      const a = path[i - 1];
      const b = path[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const l = Math.hypot(dx, dy) || 1;
      const nx = -dy / l;
      const ny = dx / l;
      out.push([{ x: path[i].x + nx * half, y: path[i].y + ny * half }, { x: path[i].x - nx * half, y: path[i].y - ny * half }]);
    }
    return out;
  };
  const coilL = { path: coilPathL, ribs: ribsOf(coilPathL) };
  const coils = [coilL, { path: coilL.path.map(mirror), ribs: coilL.ribs.map(([a, b]) => [mirror(a), mirror(b)] as [Pt, Pt]) }];
  parts.push("left coil", "right coil");

  // ── The spine: a corrugated tube down the fissure ──────────────────────
  const sTop = -176;
  const sBottom = 118;
  const ribs: Pt[][] = [];
  for (let y = sTop + 4; y < sBottom; y += 7) {
    const arc: Pt[] = [];
    for (let j = 0; j <= 8; j++) {
      const t = -1 + (2 * j) / 8;
      arc.push({ x: t * 8, y: y + 2.5 * (1 - t * t) });
    }
    ribs.push(arc);
  }
  const spine = {
    left: [{ x: -8, y: sTop }, { x: -8, y: sBottom }],
    right: [{ x: 8, y: sTop }, { x: 8, y: sBottom }],
    ribs,
  };
  parts.push("spine");

  // ── The block and its manifold, the ports ──────────────────────────────
  const block = {
    rects: [
      { x: -22, y: 118, w: 44, h: 30 },
      { x: -16, y: 124, w: 12, h: 18 },
      { x: 4, y: 124, w: 12, h: 18 },
      { x: -30, y: 148, w: 60, h: 34 },
      { x: -58, y: 182, w: 116, h: 14 },
    ],
  };
  parts.push("connector block", "manifold");
  const ports: Pt[] = [];
  for (let i = 0; i < BRAIN.ports; i++) {
    ports.push({ x: -48 + (96 * i) / (BRAIN.ports - 1), y: 196 });
    parts.push(`port ${i + 1}`);
  }
  // The cables hang from the ports, the outer two heavier hoses that bow
  // out first, each with its ferrules.
  const cables = ports.map((p, i) => {
    const outer = i === 0 || i === ports.length - 1;
    const dir = p.x < 0 ? -1 : 1;
    const path = outer
      ? spline([p, { x: p.x + dir * 30, y: p.y + 40 }, { x: p.x + dir * 44, y: p.y + 120 }, { x: p.x + dir * 44, y: p.y + 260 }], 10, false)
      : [p, { x: p.x, y: p.y + 210 + (i % 3) * 30 }];
    return { path, w: outer ? 3.2 : 1.2 + (i % 2) * 0.8, ferrules: outer ? [0.35, 0.7] : [0.3 + (i % 3) * 0.12] };
  });
  parts.push("cable loom");

  // ── The texture: particles on the glass ────────────────────────────────
  const dust: Pt[] = [];
  for (const g of glass) {
    for (const line of [g.outline, ...g.walls, ...g.tubes.map((t) => t.path)]) {
      for (let i = 0; i + 1 < line.length; i++) {
        const a = line[i];
        const b = line[i + 1];
        const l = Math.hypot(b.x - a.x, b.y - a.y);
        for (let s = 0; s < l; s += 3.2) {
          const t = s / l;
          dust.push({ x: a.x + (b.x - a.x) * t + (rnd() - 0.5) * 1.6, y: a.y + (b.y - a.y) * t + (rnd() - 0.5) * 1.6 });
        }
      }
    }
  }

  // ── The fine circuitry: a board's back layer, inside the glass, clear of
  //    the packages, squared on a nine-unit pitch.
  const microL: [Pt, Pt][] = [];
  const inner = scaleAbout(outlineL, CENTRE_L, 0.9);
  const clear = (p: Pt) => !boardsL.some((b) => p.x > b.x - 4 && p.x < b.x + b.w + 4 && p.y > b.y - 4 && p.y < b.y + b.h + 4);
  for (let y = -186; y <= 100; y += 9) {
    for (let x = -216; x <= -24; x += 9) {
      if (rnd() > 0.34) continue;
      const len = 1 + Math.floor(rnd() * 3);
      const horiz = rnd() < 0.5;
      const a = { x, y };
      const b = horiz ? { x: x + 9 * len, y } : { x, y: y + 9 * len };
      if (inside(a, inner) && inside(b, inner) && clear(a) && clear(b)) microL.push([a, b]);
    }
  }
  const micro = [...microL, ...microL.map(([a, b]) => [mirror(a), mirror(b)] as [Pt, Pt])];
  parts.push("left back circuitry", "right back circuitry");

  cache = { glass, pods, boards, traces, lenses, coils, spine, block, ports, cables, micro, dust, parts };
  return cache;
}

/** Inside a hemisphere's outline: even-odd over the polyline. */
export function inside(p: Pt, poly: Pt[]): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}
