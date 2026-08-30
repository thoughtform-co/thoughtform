/**
 * cardEmblem — a per-service particle emblem for the card face's middle third.
 *
 * The EMBLEM face variant answers a question the reference set asked of us: across
 * ~40 poster-grade cards in the Brand Codex, not one puts a photograph of the
 * practitioner at the centre. The subject is always THE WORK — a rendered object, a
 * computed field, a diagram. A portrait answers "who does it"; a services card has
 * to answer "what is it", and four cards carrying the same face answer it four
 * times with the same picture. See docs/design/card-reference-analysis.md.
 *
 * So each service gets its own generative figure, and the figures are drawn rather
 * than photographed — which is also the register every OTHER instrument in this
 * house already speaks in (the map, the wireframes, the carrier).
 *
 * THE GRAMMAR (references/particle-icon-grammar.md, at card scale):
 *   skeleton  the readable form            dawn, α .85          human intent
 *   signal    1–3 accent marks             gold, α 1            "you are here"
 *   drift     a few displaced duplicates   dawn, α .28          machine reading
 *
 * ⚠ THREE-FREE and canvas-2D only, like ringCtaBox — it is called from inside the
 * bake and must not drag anything into the DOM side's import graph.
 *
 * ⚠ DETERMINISTIC. A seeded PRNG, never Math.random: the bake runs once per card
 * per theme flip, and an emblem that reshuffled on a re-bake would read as a
 * glitch. Same service, same figure, forever.
 *
 * ⚠ EACH FIGURE IS THE SERVICE'S MEANING, not decoration — mapped through the
 * semantic anchors (references/semantic-anchors.md):
 *   keynote        SIGNAL       one source, many receivers: a radial broadcast
 *   workshop       INSTRUMENT   a working lattice, lit where work landed
 *   embedded       THRESHOLD    two fields interpenetrating across a boundary
 *   guided-build   NAVIGATION   waypoints on a course, with the route drawn
 */

/** The four service slots. Kept as a widened string so a fifth needs no edit here. */
export type EmblemKey = "keynote" | "workshop" | "embedded" | "guided-build" | string;

/**
 * Structurally the subset of `FacePalette` this needs, so the bake passes its own
 * palette straight through and the emblem cannot drift from the face's theme.
 */
export interface EmblemPalette {
  /** Reading ink at an alpha — dawn on dark, latent night on parchment. */
  ink: (a: number) => string;
  /** The accent, already theme-resolved (#caa554 in both themes, ADR-058 U2). */
  gold: string;
}

/** The emblem's box inside the 840×1360 bake — the middle third, per the STACK archetype. */
export const EMBLEM_BOX = { x: 92, y: 386, w: 656, h: 656 } as const;

/* Mark half-sizes, in bake pixels.
   ⚠ Sized so the marks READ AS SQUARE at display scale, not merely BE square.
   The card renders ~400px wide against an 840px bake, so a mark is roughly half
   its value here in device pixels: below ~4 the corners stop resolving and a
   rect reads as a dot, which delivers none of the sharp-geometry law it obeys
   in code. The design eval called them circular at 3.9 and it was right about
   the read even though the code was already rects. R_SIG is larger again: a
   signal has to land at a glance. */
const R_SKEL = 4.7;
const R_SIG = 6.2;
const R_DRIFT = 3.6;

/** One grid unit — everything lands on integer multiples, so nothing is off-lattice. */
const U = 24;

/** Mulberry32 — small, fast, and stable across engines. */
function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A stable integer seed from the service id — no hashing library for four strings. */
function seedOf(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

interface Dot {
  x: number;
  y: number;
  /** skeleton | signal | drift */
  k: 0 | 1 | 2;
}

/* ── The marks are SQUARE, and that is law, not taste ──────────────────────────
   The particle-icon grammar is pixel art built from rects: "sharp geometry only
   — no circular or curved constructions", and the shape law says diamonds
   replace circles for every marker, bullet and indicator.

   The first cut of this file drew `ctx.arc()` dots and the design eval flagged
   it `circular-indicator` on its very first run against a real candidate. Kept
   as a note because the mistake is an easy one: at this size a small circle and
   a small square look near-identical in isolation, and the law is about the
   SYSTEM reading as one thing, not about any single mark. */

/** A skeleton/drift mark: an axis-aligned square, centred. */
function square(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

/** A signal mark: a diamond — the house's marker, a 45° square. */
function diamond(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();
}

// ── the four figures ─────────────────────────────────────────────────────────
// Each returns dots in a 0..1 unit square; the painter maps them into EMBLEM_BOX.
// Working in unit space keeps the compositions readable and box-independent.

/**
 * KEYNOTE — SIGNAL. One source, many receivers: a wave propagating outward.
 *
 * ⚠ The rings are DIAMONDS, not circles — the L1 (taxicab) norm `|dx| + |dy| = r`
 * rather than the Euclidean one. The first cut used `Math.cos/sin` on concentric
 * circles and the design eval flagged it `circular-indicator` twice: once for the
 * marks, and again for the FIGURE after the marks were squared off. Both reads
 * were right. "No circular or curved constructions" governs the composition, not
 * only the dots inside it — and a diamond expanding outward is the same claim in
 * this system's own geometry.
 */
function keynote(rand: () => number): Dot[] {
  const dots: Dot[] = [];
  const cx = 0.5;
  const cy = 0.5;
  dots.push({ x: cx, y: cy, k: 1 }); // the source
  // Seven fronts; density falls as the wave travels, which is the whole claim.
  const rings = [0.09, 0.155, 0.22, 0.285, 0.35, 0.415, 0.48];
  rings.forEach((r, ri) => {
    const n = 8 + ri * 7;
    for (let i = 0; i < n; i++) {
      // Walk the diamond's perimeter in four straight legs. `t` is the
      // fractional position around it; each quadrant is a linear run, which is
      // what keeps the construction sharp.
      const t = (i / n + ri * 0.037) % 1; // per-ring offset breaks up spokes
      const q = Math.floor(t * 4);
      const f = t * 4 - q;
      const jitter = 1 + (rand() - 0.5) * 0.05;
      const rr = r * jitter;
      // q0: +x→+y, q1: +y→−x, q2: −x→−y, q3: −y→+x
      const legs: [number, number][] = [
        [rr * (1 - f), rr * f],
        [-rr * f, rr * (1 - f)],
        [-rr * (1 - f), -rr * f],
        [rr * f, -rr * (1 - f)],
      ];
      const [dx, dy] = legs[q];
      dots.push({ x: cx + dx, y: cy + dy, k: 0 });
    }
  });
  // Two receivers that caught it, on the outermost front's own corners.
  dots.push({ x: cx + 0.48, y: cy, k: 1 });
  dots.push({ x: cx - 0.34, y: cy + 0.34, k: 1 });
  return dots;
}

/** WORKSHOP — INSTRUMENT. A working lattice, lit where the work actually landed. */
function workshop(rand: () => number): Dot[] {
  const dots: Dot[] = [];
  const n = 13;
  const lit = new Set<string>();
  // A contiguous run of lit cells: work spreads from where it started, it does
  // not appear at random points on a grid.
  let cx = 5;
  let cy = 7;
  for (let s = 0; s < 13; s++) {
    lit.add(`${cx},${cy}`);
    const dir = Math.floor(rand() * 4);
    if (dir === 0) cx = Math.min(n - 2, cx + 1);
    else if (dir === 1) cy = Math.min(n - 2, cy + 1);
    else if (dir === 2) cx = Math.max(1, cx - 1);
    else cy = Math.max(1, cy - 1);
  }
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const x = c / (n - 1);
      const y = r / (n - 1);
      dots.push({ x, y, k: lit.has(`${c},${r}`) ? 1 : 0 });
    }
  }
  return dots;
}

/** EMBEDDED — THRESHOLD. Two fields interpenetrating; the boundary is the subject. */
function embedded(rand: () => number): Dot[] {
  const dots: Dot[] = [];
  const rows = 17;
  const cols = 17;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c / (cols - 1);
      const y = r / (rows - 1);
      // The seam runs on a diagonal; each side's density falls off toward it,
      // so the two fields visibly INTERLEAVE rather than abut.
      const d = x - y; // signed distance from the seam
      const pLeft = 1 - Math.min(1, Math.max(0, (d + 0.42) / 0.84));
      const keep = rand() < (d < 0 ? pLeft : 1 - pLeft) * 1.25;
      if (!keep) continue;
      // Cells that sit ON the seam are where the two actually meet.
      dots.push({ x, y, k: Math.abs(d) < 0.055 ? 1 : 0 });
    }
  }
  return dots;
}

/** GUIDED BUILD — NAVIGATION. Waypoints on a course, the route drawn between them. */
function guidedBuild(rand: () => number): Dot[] {
  const dots: Dot[] = [];
  // Five waypoints climbing left-to-right: a build goes somewhere.
  const wp = [
    { x: 0.08, y: 0.82 },
    { x: 0.3, y: 0.66 },
    { x: 0.5, y: 0.5 },
    { x: 0.72, y: 0.3 },
    { x: 0.92, y: 0.14 },
  ];
  // The course: dots along each leg, so the route is a run of marks rather
  // than a drawn line — this surface counts marks, it does not stroke paths.
  for (let i = 0; i < wp.length - 1; i++) {
    const a = wp[i];
    const b = wp[i + 1];
    const steps = 13;
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      dots.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, k: 0 });
    }
  }
  // Scatter either side of the course — the space the route was chosen THROUGH.
  for (let i = 0; i < 90; i++) {
    const x = rand();
    const y = rand();
    // Keep the corridor itself clear so the route stays the figure.
    const onCourse = Math.abs(y - (0.86 - x * 0.76)) < 0.1;
    if (onCourse) continue;
    dots.push({ x, y, k: 0 });
  }
  // The waypoints themselves carry the signal.
  wp.forEach((p, i) => dots.push({ x: p.x, y: p.y, k: i === 2 ? 1 : 1 }));
  return dots;
}

const FIGURES: Record<string, (rand: () => number) => Dot[]> = {
  keynote,
  workshop,
  embedded,
  "guided-build": guidedBuild,
};

/**
 * Paint one service's emblem into the bake canvas.
 *
 * Called from `bakeCardFace` in place of the photo draw. Everything ELSE about
 * the face — scrims, chamfer, shell stroke, framed name, chit, lede — is
 * unchanged, which is the point: this swaps the FIELD, not the composition.
 */
export function drawCardEmblem(
  ctx: CanvasRenderingContext2D,
  key: EmblemKey,
  pal: EmblemPalette
): void {
  const figure = FIGURES[key] ?? keynote;
  const rand = prng(seedOf(String(key)));
  const dots = figure(rand);

  const { x: bx, y: by, w, h } = EMBLEM_BOX;
  const px = (u: number) => bx + u * w;
  const py = (u: number) => by + u * h;

  // DRIFT first, so it sits UNDER the skeleton — the machine's reading is
  // behind the human's intent, never over it.
  ctx.fillStyle = pal.ink(0.28);
  for (const d of dots) {
    if (d.k === 2) continue;
    // Every third mark leaves a trace, displaced exactly ONE grid unit on a
    // single axis (the grammar's rule — never a free offset, never both axes).
    if (rand() > 0.34) continue;
    const axis = rand() < 0.5;
    square(ctx, px(d.x) + (axis ? U : 0), py(d.y) + (axis ? 0 : U), R_DRIFT);
  }

  // SKELETON.
  ctx.fillStyle = pal.ink(0.85);
  for (const d of dots) {
    if (d.k !== 0) continue;
    square(ctx, px(d.x), py(d.y), R_SKEL);
  }

  // SIGNAL last and on top — the one thing the eye must land on, and a
  // DIAMOND, which is what this system's markers are.
  ctx.fillStyle = pal.gold;
  for (const d of dots) {
    if (d.k !== 1) continue;
    diamond(ctx, px(d.x), py(d.y), R_SIG);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   The other two fields a card can carry.

   The reference set does not have ONE answer for the middle of a card, it has a
   handful, and the archetypes are what tell them apart (see
   docs/design/card-reference-analysis.md). `drawCardEmblem` above is the
   generative figure. These two are the other directions worth a variant:

     applyHalftone   the PHOTOGRAPH, processed into the grammar rather than
                     printed — the reference set's own answer for when a human
                     stays in the frame
     drawSpecReadout the field IS a readout — the INSTRUMENT archetype, the
                     family every other Thoughtform instrument already belongs to
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Re-screen whatever is already on the canvas as a halftone of square cells.
 *
 * Run AFTER the photo and its LUT, so it screens the toned plate rather than the
 * raw image. This is the move the reference set makes when a person does stay in
 * the frame: the photograph becomes MATERIAL — dithered, perforated, obviously
 * processed — instead of reading as a headshot dropped into a card.
 *
 * ⚠ Cells are SQUARES on a fixed lattice, not dots: same sharp-geometry law the
 * emblems obey, and a round-dot halftone would read as newsprint rather than as
 * this system's own pixel grammar.
 */
export function applyHalftone(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pal: EmblemPalette & { ground: string }
): void {
  const CELL = 9;
  const src = ctx.getImageData(0, 0, w, h);
  const px = src.data;

  ctx.fillStyle = pal.ground;
  ctx.fillRect(0, 0, w, h);

  for (let cy = 0; cy < h; cy += CELL) {
    for (let cx = 0; cx < w; cx += CELL) {
      // Mean luminance of the cell. Sampling every other pixel is
      // indistinguishable at this cell size and quarters the work.
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
      // Size carries the value. A slight gamma keeps the mid-tones open —
      // linear size on a dark plate crushes the whole face to near-solid.
      const size = Math.pow(lum, 0.72) * (CELL - 1.1);
      if (size < 0.6) continue;
      const off = (CELL - size) / 2;
      ctx.fillStyle = pal.ink(Math.min(0.92, 0.34 + lum * 0.62));
      ctx.fillRect(cx + off, cy + off, size, size);
    }
  }
}

/** One row of the spec readout. */
export interface SpecRow {
  label: string;
  value: string;
}

/**
 * THE INSTRUMENT ARCHETYPE — the field is a readout a reader can check.
 *
 * The strongest Thoughtform-native direction of the five, and the one the
 * services ring is currently the house's ONLY surface not to use: the casefile
 * console, the intelligence map and the authored wireframes all draw records.
 * Here the record is the engagement's own shape — duration, group size, format,
 * language — which today is hidden inside the drawer.
 *
 * ⚠ NO INVENTED FIGURES. Every row is a `ServiceSpec` field the site already
 * publishes; the meter is a categorical position on a named scale, not a
 * measurement. This surface does not publish numbers it cannot stand behind.
 */
export function drawSpecReadout(
  ctx: CanvasRenderingContext2D,
  rows: SpecRow[],
  pal: EmblemPalette,
  box: { x: number; y: number; w: number; h: number },
  fonts: { mono: string; sans: string }
): void {
  const label = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  const shown = rows.slice(0, 4);
  const pitch = box.h / shown.length;

  ctx.textBaseline = "alphabetic";
  shown.forEach((row, i) => {
    const top = box.y + i * pitch;

    // A hairline above every row — course lines, the ruled-record read.
    ctx.strokeStyle = pal.ink(0.16);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(box.x, top);
    ctx.lineTo(box.x + box.w, top);
    ctx.stroke();

    // The row's index mark, in the margin: a diamond, and the ONE gold thing.
    ctx.fillStyle = pal.gold;
    ctx.save();
    ctx.translate(box.x + 7, top + 34);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();

    // LABEL — mono chrome, tracked, quiet.
    label.letterSpacing = "3px";
    ctx.font = `400 20px ${fonts.mono}`;
    ctx.fillStyle = pal.ink(0.44);
    ctx.fillText(row.label.toUpperCase(), box.x + 34, top + 42);

    // VALUE — the record, in prose, at reading weight.
    label.letterSpacing = "0px";
    ctx.font = `400 30px ${fonts.sans}`;
    ctx.fillStyle = pal.ink(0.9);
    ctx.fillText(row.value, box.x + 34, top + 86);
  });
  label.letterSpacing = "0px";
}

/** Mark counts, for the eval harness and for a fit test. */
export function emblemMarkCount(key: EmblemKey): { skeleton: number; signal: number } {
  const figure = FIGURES[key] ?? keynote;
  const dots = figure(prng(seedOf(String(key))));
  return {
    skeleton: dots.filter((d) => d.k === 0).length,
    signal: dots.filter((d) => d.k === 1).length,
  };
}
