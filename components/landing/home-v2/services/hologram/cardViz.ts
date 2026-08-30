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
 *   constellation  Indent's wireframe node globe — a graph, chords between nodes
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
   1. CONSTELLATION — a graph. (Indent, "Your intelligent co-worker")
   Points on a sphere, projected flat, near neighbours joined by straight
   chords. Reads as a network with structure rather than a scatter.
   ═══════════════════════════════════════════════════════════════════════════ */
function constellation(
  ctx: CanvasRenderingContext2D,
  b: VizBox,
  pal: VizPalette,
  rand: () => number
): void {
  const N = 108;
  const R = Math.min(b.w, b.h) / 2;
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;

  // Fibonacci sphere — an even distribution with no seams or polar bunching.
  const pts: { x: number; y: number; z: number }[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const zz = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - zz * zz));
    const th = golden * i;
    pts.push({ x: Math.cos(th) * r, y: zz, z: Math.sin(th) * r });
  }
  // A fixed tilt so the distribution never reads as a flat ring.
  const tilt = 0.42;
  const proj = pts.map((p) => ({
    px: cx + p.x * R,
    py: cy + (p.y * Math.cos(tilt) - p.z * Math.sin(tilt)) * R,
    depth: p.z * Math.cos(tilt) + p.y * Math.sin(tilt),
  }));

  // Chords between near neighbours. Straight lines only — the sphere is implied
  // by the point distribution, never drawn as an outline.
  ctx.lineWidth = 1.7;
  for (let i = 0; i < proj.length; i++) {
    for (let j = i + 1; j < proj.length; j++) {
      const dx = proj[i].px - proj[j].px;
      const dy = proj[i].py - proj[j].py;
      const d = Math.hypot(dx, dy);
      if (d > R * 0.3) continue;
      // Depth fades the far side, which is what gives the flat projection volume.
      const near = (proj[i].depth + proj[j].depth) / 2;
      ctx.strokeStyle = pal.ink(0.14 + Math.max(0, near) * 0.34);
      ctx.beginPath();
      ctx.moveTo(proj[i].px, proj[i].py);
      ctx.lineTo(proj[j].px, proj[j].py);
      ctx.stroke();
    }
  }
  proj.forEach((p, i) => {
    const near = Math.max(0, p.depth);
    ctx.fillStyle = pal.ink(0.42 + near * 0.5);
    sq(ctx, p.px, p.py, 3.1 + near * 2.2);
    // A handful of lit nodes, chosen deterministically.
    if (i % 23 === 4) {
      ctx.fillStyle = pal.gold;
      dia(ctx, p.px, p.py, 6);
    }
  });
  void rand;
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

/* ── the registry ──────────────────────────────────────────────────────────── */

const LANGUAGES: Record<
  string,
  (ctx: CanvasRenderingContext2D, b: VizBox, pal: VizPalette, rand: () => number) => void
> = { constellation, dendrite, meridian, nebula, panel, glyph };

export type VizLanguage = keyof typeof LANGUAGES | string;

/**
 * Draw one visualization language into a box, seeded by the service.
 *
 * The SERVICE seeds the figure so the four cards of a set differ from each
 * other; the LANGUAGE decides what kind of drawing it is. That split is what
 * lets a variant be a design direction rather than four unrelated pictures.
 */
export function drawCardViz(
  ctx: CanvasRenderingContext2D,
  language: VizLanguage,
  service: VizKey,
  pal: VizPalette,
  box: VizBox
): void {
  const draw = LANGUAGES[language] ?? constellation;
  draw(ctx, box, pal, prng(seedOf(`${language}:${service}`)));
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
