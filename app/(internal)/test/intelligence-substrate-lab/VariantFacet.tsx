import { wrapLines } from "@/components/landing/home-v2/services/casefile/map/pda/pdaGlyphs";

import { FS, MODULE, adv, housing, type LetterSpec } from "./substrateKit";
import {
  type RoundSixMeasures,
  type RoundSixPattern,
  markCountOf,
  patternSpecs,
  patterns,
  totalOf,
} from "./roundSix";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 26 · FACET — the wheel, cut straight and lettered from the inside.
 *
 * The owner's three notes on 21 (2026-08-15): the claim is right, the circle
 * is not — this brand draws no round shapes but its brand marks — and the
 * labels belong INSIDE the wedges rather than in the corners a circle leaves.
 *
 * ⚠ THE ENCODING HAD TO INVERT, AND THAT IS THE DESIGN RATHER THAN A
 * COMPROMISE. The wheel carries the count as ANGLE, which makes the smallest
 * pattern the narrowest wedge — and a 36° wedge cannot hold a horizontal label
 * at any radius this crop affords (`STAKEHOLDER` alone measures 149.6u, which
 * a 36° wedge only reaches 230 units out, where ~20 units of depth are left).
 * **Inside labels and angle-as-count are arithmetically incompatible** at
 * n = 5 on a 47-Skill estate.
 *
 * So the count is SPLIT between how wide a wedge is and how far it reaches:
 * the angle goes as `√n` and the radius is then solved so the quad's area,
 * `½·sin(θ)·(r² − R0²)`, is exactly the Skill count. Nothing is given up but
 * the disc — **area is what a reader actually reads in a pie**, the angle
 * alone never was the compared quantity, and the wedge that must hold the most
 * text now has the most room.
 *
 * ⚠ THE SPLIT IS WHY THIS IS A ROSETTE AND NOT AN ASTERISK. Putting the whole
 * count in the radius (the first cut) made the small patterns short spikes and
 * the big ones long ones — five points around a hub, which reads as a star
 * rather than as one thing divided, and left the crop's bottom empty. Half the
 * count in each term gives angles of 50°–84° and radii of 312–440 on this
 * record: varied enough to be plainly irregular, even enough that the five
 * still close into a single figure. `SPLIT` is the one dial, and area stays
 * exact at every value of it.
 *
 * ⚠ NOT ONE CURVE IS DRAWN. Every wedge is a straight-edged quadrilateral —
 * two rays, a chord at the hub, a chord at the rim — and the centre is a
 * chamfered `housing()` plate. The rim CHORD is what makes it read machined
 * rather than sliced, and it is the edge whose distance carries the count, so
 * it is the edge that is lit.
 */

export const FACET_VIEWBOX = "0 0 932 762";

/* ── The rosette ────────────────────────────────────────────────────────── */

/**
 * ⚠ EVERY ONE OF THESE FOUR IS SOLVED, NOT PICKED, and they solve together.
 *
 * A label block is an AXIS-ALIGNED rectangle; a wedge is a rotated quad. A
 * rectangle of width W and height H needs roughly `(W + H)/√2` of RADIAL
 * THICKNESS to sit in a wedge rotated 45° — far more than the `max(W, H)` it
 * needs in one aligned to the screen. That is why the first cut failed on
 * whichever pattern happened to land on a diagonal, and why the fix is not a
 * bigger drawing but a SMALLER HUB: thickness is `r − R0`, so lowering R0
 * buys every wedge depth without touching the areas.
 *
 * `START = 20` then puts the thinnest wedge (Stakeholder, five Skills, and the
 * one whose name is longest) pointing straight up, where an axis-aligned block
 * needs the least. A sweep of R0 × R_MAX × START found 11 seating solutions;
 * this is the one whose bounding box fills the crop without touching it.
 */
const R0 = 120;
const R_MAX = 440;
const GAP = 4;
const START = 60;
/** How the count divides between angle and reach. 1 is the wheel (all angle),
 *  0 is the asterisk (all radius); a half each is what closes the five into
 *  one figure. */
const SPLIT = 0.5;
const CROP_W = 932;
const CROP_H = 762;

const rad = (deg: number) => (deg * Math.PI) / 180;
/** ⚠ SHAPE SPACE — the hub is the ORIGIN and the drawing is translated into
 *  the crop at render. That is what lets the composition CENTRE ITSELF from
 *  its own bounding box (ADR-070 U14's law: the margin is derived and split,
 *  never hung off one edge), so changing `R_MAX` or `START` cannot leave the
 *  rosette sitting high in a panel with a hole under it. */
const pt = (r: number, deg: number) => ({ x: r * Math.cos(rad(deg)), y: r * Math.sin(rad(deg)) });

export interface FacetWedge {
  key: string;
  a0: number;
  a1: number;
  mid: number;
  h: number;
  r: number;
}

/**
 * The wedges. Pure — the mass guard, the seating solver and the drawing all
 * read this one geometry.
 *
 * `r² − R0²` is proportional to the Skill count by construction, and a
 * quadrilateral wedge's area is `½·sin(θ)·(r² − R0²)` with θ shared, so AREA
 * is exactly the count. That identity is the only reason the radius is allowed
 * to vary at all — a radius nudged to make a label fit would make the drawing
 * say something the record does not, which is what `facetMass` guards.
 */
export function facetWedges(rows: readonly RoundSixPattern[]): FacetWedge[] {
  const k = rows.length;
  if (k === 0) return [];
  /* The angle takes `n^SPLIT` of the usable sweep… */
  const weights = rows.map((p) => Math.pow(p.n, SPLIT));
  const sum = weights.reduce((a, b) => a + b, 0);
  const usable = 360 - GAP * k;
  const thetas = weights.map((w) => (usable * w) / sum);
  /* …and the radius is SOLVED from it, so the quad's own area — not a
     sector's — is the count. ⚠ `½·sin(θ)·(r² − R0²)`, never `½·θ·r²`: the
     first cut used the sector formula with chord edges and the areas drifted
     ~1.5 % apart, which the mass guard reports as the drawing having stopped
     encoding anything. */
  const shares = rows.map((p, i) => p.n / Math.sin(rad(thetas[i])));
  const maxShare = Math.max(...shares);
  const c = maxShare > 0 ? (R_MAX * R_MAX - R0 * R0) / maxShare : 0;

  let a = START;
  return rows.map((p, i) => {
    const a0 = a;
    const a1 = a0 + thetas[i];
    a = a1 + GAP;
    return {
      key: p.key,
      a0,
      a1,
      mid: a0 + thetas[i] / 2,
      h: thetas[i] / 2,
      r: Math.sqrt(R0 * R0 + c * shares[i]),
    };
  });
}

/** The rosette's own bounding box, in shape space. */
export function facetBounds(wedges: readonly FacetWedge[]) {
  const vs = wedges.flatMap(quad);
  const xs = vs.map((v) => v.x);
  const ys = vs.map((v) => v.y);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

/** Where the hub lands in the crop, so the bounding box centres by
 *  construction rather than by a hand-set pair of coordinates. */
export function facetOrigin(wedges: readonly FacetWedge[]) {
  if (wedges.length === 0) return { x: CROP_W / 2, y: CROP_H / 2 };
  const b = facetBounds(wedges);
  return {
    x: (CROP_W - (b.x1 - b.x0)) / 2 - b.x0,
    y: (CROP_H - (b.y1 - b.y0)) / 2 - b.y0,
  };
}

const quad = (w: FacetWedge) => [pt(R0, w.a0), pt(w.r, w.a0), pt(w.r, w.a1), pt(R0, w.a1)];

/**
 * ⚠ THE ORIGIN IS BAKED INTO EVERY DRAWN COORDINATE, NEVER APPLIED AS A GROUP
 * TRANSFORM. `getBBox()` reports a node's box in its OWN user space, so a
 * `<g transform="translate(...)">` around the drawing leaves the fit readout
 * comparing untranslated glyph boxes against the crop — which reported all 27
 * labels clipped on a drawing that clips none. Geometry and seating stay in
 * shape space (hub at the origin); only the render adds the offset.
 */
const pathOf = (w: FacetWedge, o: { x: number; y: number }) =>
  `${quad(w)
    .map((q, i) => `${i === 0 ? "M" : "L"}${(q.x + o.x).toFixed(2)},${(q.y + o.y).toFixed(2)}`)
    .join(" ")} Z`;

/** Convex containment — all four cross products share a sign. */
function inside(q: readonly { x: number; y: number }[], x: number, y: number) {
  let sign = 0;
  for (let i = 0; i < q.length; i += 1) {
    const a = q[i];
    const b = q[(i + 1) % q.length];
    const cr = (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x);
    if (Math.abs(cr) < 1e-9) continue;
    const s = cr > 0 ? 1 : -1;
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }
  return true;
}

/* ── The block ──────────────────────────────────────────────────────────── */

/**
 * ⚠ THE GLOSS WRAPS PER WEDGE, NOT ONCE FOR THE DRAWING. A single shared wrap
 * width sets one block shape for five differently-shaped holes: at 22
 * characters Stakeholder's definition made a 194-unit line that no 68° wedge
 * of its radius could take, while the same width left Pattern's block short
 * and wide in a wedge with room to spare. The solver tries these widths from
 * widest to narrowest and takes the first that seats, so a deep narrow wedge
 * gets a deep narrow block. ⚠ A wrap that would SLICE is skipped, never used —
 * `wrapLines` truncates silently at its cap.
 */
const GLOSS_PERS = [26, 24, 22, 20, 18] as const;
const GLOSS_MAX_LINES = 3;

const NAME_DY = 0;
const GLOSS_DY = 26;
const GLOSS_STEP = 17;
const EVAL_GAP = 20;
const FLAG_GAP = 18;
/** The name's ascent above its baseline, and the flagship's descent below. */
const BLOCK_TOP = -20;
const BLOCK_BOT = 5;
/** The green mark that precedes the flagship, plus its gutter. */
const MARK = 8;
const MARK_GAP = 8;
/**
 * ⚠ HALF A UNIT, ON THE DECLARED MEASURE ONLY — NEVER ON THE GEOMETRY. This
 * block's measure IS its widest line by construction, so the longest name
 * lands on it EXACTLY, and the guard recomputes that same product in a
 * different association order (`n · fs · (0.6 + track)` against
 * `n · adv(fs, track)`), landing 3e-14 the wrong side. The epsilon reconciles
 * two float orderings and nothing else.
 *
 * ⚠ Adding it to the SEATING width instead cost Voice its seat outright — its
 * block clears its wedge by under half a unit, so half a unit of imaginary
 * width is the difference between seated and not. That fragility is real and
 * the guard is what holds it: a reworded gloss or eval will fail here rather
 * than letter through a rim chord.
 */
const FIT_EPS = 0.5;

export interface FacetBlock {
  per: number;
  glossLines: string[];
  evalDy: number;
  flagDy: number;
  /** The widest line — the block's own measure. */
  w: number;
  top: number;
  bot: number;
}

/** One candidate block shape at a given wrap width, or null if it would slice. */
export function blockAt(p: RoundSixPattern, per: number): FacetBlock | null {
  const glossLines = wrapLines(p.gloss, per, GLOSS_MAX_LINES);
  if (glossLines.join(" ").length < p.gloss.length) return null;
  const evalDy = GLOSS_DY + (glossLines.length - 1) * GLOSS_STEP + EVAL_GAP;
  const flagDy = evalDy + FLAG_GAP;
  const widths = [
    p.name.length * adv(FS.name, 0.08),
    ...glossLines.map((t) => t.length * adv(FS.gloss, 0.08)),
    p.evalMethod.length * adv(FS.chrome, 0.14),
  ];
  if (p.flagship)
    widths.push(p.flagship.shortTitle.length * adv(FS.chrome, 0.08) + MARK + MARK_GAP);
  return {
    per,
    glossLines,
    evalDy,
    flagDy,
    w: Math.max(...widths),
    top: BLOCK_TOP,
    bot: flagDy + BLOCK_BOT,
  };
}

export interface FacetSeat extends FacetBlock {
  x: number;
  y: number;
}

/**
 * Walk the wedge's bounding box and return the first position at which the
 * block's four CORNERS are inside the wedge — which, the wedge being convex,
 * is exactly the condition for the whole block to be inside it.
 *
 * ⚠ THE SEARCH STARTS AT THE WIDEST WRAP AND WALKS NARROWER, and returns null
 * rather than falling back. A drawing that seated a block "anyway" would put a
 * label through a rim chord or across a gap into its neighbour, where it would
 * letter cleanly, collide with nothing, sit inside the crop — and read as
 * somebody else's label.
 */
export function seatBlock(w: FacetWedge, p: RoundSixPattern): FacetSeat | null {
  const q = quad(w);
  const xs = q.map((v) => v.x);
  const ys = q.map((v) => v.y);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);

  /* ⚠ A 2-UNIT STEP, AND THE COARSER ONE WAS A REAL DEFECT. At step 4 the
     search missed Voice entirely: its feasible band is a few units wide, so a
     stride wider than the band steps straight over it and the solver reports
     "cannot seat" for a block that fits. A search granularity is part of the
     arithmetic here, not a performance knob. */
  for (const per of GLOSS_PERS) {
    const b = blockAt(p, per);
    if (!b) continue;
    for (let y = y0; y <= y1; y += 2) {
      for (let x = x0; x <= x1; x += 2) {
        if (
          inside(q, x - b.w / 2, y + b.top) &&
          inside(q, x + b.w / 2, y + b.top) &&
          inside(q, x - b.w / 2, y + b.bot) &&
          inside(q, x + b.w / 2, y + b.bot)
        ) {
          return { ...b, x, y };
        }
      }
    }
  }
  return null;
}

/**
 * Every wedge with its solved seat. One call, so the drawing, the lettering
 * spec and the seating guard cannot disagree about where a label went.
 *
 * ⚠ MEMOISED, because the solve is a grid search and three callers want it per
 * render. The cache is keyed on the record object itself, so a new record
 * re-solves and an unchanged one does not.
 */
const LAYOUTS = new WeakMap<IslRecord, ReturnType<typeof solveLayout>>();

function solveLayout(record: IslRecord) {
  const rows = patterns(record);
  const wedges = facetWedges(rows);
  const byKey = new Map(rows.map((p) => [p.key, p]));
  return wedges.map((w) => {
    const p = byKey.get(w.key);
    return { wedge: w, pattern: p, seat: p ? seatBlock(w, p) : null };
  });
}

export function facetLayout(record: IslRecord) {
  const hit = LAYOUTS.get(record);
  if (hit) return hit;
  const solved = solveLayout(record);
  LAYOUTS.set(record, solved);
  return solved;
}

/* ── The drawing ────────────────────────────────────────────────────────── */

/** ⚠ INSIDE R0. A plate whose corners reached past the hub radius would cover
 *  part of every wedge, and the wedges are the areas that carry the counts. */
const PLATE = { w: 146, h: 64, cut: 12 };

export function VariantFacet({ record }: IslVariantProps) {
  const layout = facetLayout(record);
  const total = totalOf(patterns(record));
  const o = facetOrigin(layout.map((l) => l.wedge));

  return (
    <>
      {layout.map(({ wedge: w, pattern: p, seat: rawSeat }, i) => {
        if (!p || !rawSeat) return null;
        const seat = { ...rawSeat, x: rawSeat.x + o.x, y: rawSeat.y + o.y };
        const d = pathOf(w, o);
        const s0 = pt(w.r, w.a0);
        const s1 = pt(w.r, w.a1);
        const c0 = { x: s0.x + o.x, y: s0.y + o.y };
        const c1 = { x: s1.x + o.x, y: s1.y + o.y };
        /* The rim chord's own frame — ticks run along it and stand inward. */
        const len = Math.hypot(c1.x - c0.x, c1.y - c0.y) || 1;
        const ex = (c1.x - c0.x) / p.n;
        const ey = (c1.y - c0.y) / p.n;
        const nx = -((c1.y - c0.y) / len);
        const ny = (c1.x - c0.x) / len;
        /* The hub is the origin in SHAPE space, so "inward" is the side of the
           chord that the un-offset origin falls on. */
        const infl = -s0.x * nx - s0.y * ny > 0 ? 1 : -1;

        return (
          <g key={w.key}>
            {/* Opaque ground first, so the wedge hit-tests across its face
                and reads as a solid rather than an outline. */}
            <path d={d} fill="var(--pda-void)" />
            <path
              d={d}
              fill="rgba(var(--dawn-rgb), 0.06)"
              fillOpacity={i % 2 === 0 ? 1 : 0.55}
              stroke="var(--pda-hair2)"
            />
            <line
              x1={c0.x}
              y1={c0.y}
              x2={c1.x}
              y2={c1.y}
              stroke="var(--pda-amb)"
              strokeOpacity={0.62}
              strokeWidth="2"
            />

            {/* One tick per encoded Skill, standing inward off the rim. The
                first encode leads and takes green; its NAME stays at full ink
                in the block below. */}
            {p.ordered.map((skill, k) => {
              const first = k === 0;
              const bx = c0.x + ex * (k + 0.5);
              const by = c0.y + ey * (k + 0.5);
              const l = first ? 20 : 12;
              return (
                <line
                  key={skill.id}
                  x1={bx + nx * infl * 6}
                  y1={by + ny * infl * 6}
                  x2={bx + nx * infl * (6 + l)}
                  y2={by + ny * infl * (6 + l)}
                  stroke={first ? "var(--pda-grn)" : "var(--pda-amb)"}
                  strokeOpacity={first ? 0.95 : 0.5}
                />
              );
            })}

            {/* THE BLOCK — inside the wedge, horizontal, at the solved seat. */}
            <text
              x={seat.x}
              y={seat.y + NAME_DY}
              textAnchor="middle"
              fontSize={FS.name}
              fontWeight={700}
              letterSpacing=".08em"
              fill="var(--pda-txt)"
            >
              {p.name}
            </text>
            {seat.glossLines.map((line, k) => (
              <text
                key={line}
                x={seat.x}
                y={seat.y + GLOSS_DY + k * GLOSS_STEP}
                textAnchor="middle"
                fontSize={FS.gloss}
                letterSpacing=".08em"
                fill="var(--pda-txt2)"
              >
                {line}
              </text>
            ))}
            <text
              x={seat.x}
              y={seat.y + seat.evalDy}
              textAnchor="middle"
              fontSize={FS.chrome}
              letterSpacing=".14em"
              fill="var(--pda-ink)"
            >
              {p.evalMethod}
            </text>
            {p.flagship ? (
              <>
                <rect
                  x={
                    seat.x -
                    (p.flagship.shortTitle.length * adv(FS.chrome, 0.08) + MARK + MARK_GAP) / 2
                  }
                  y={seat.y + seat.flagDy - MARK}
                  width={MARK}
                  height={MARK}
                  fill="var(--pda-grn)"
                />
                <text
                  x={seat.x + (MARK + MARK_GAP) / 2}
                  y={seat.y + seat.flagDy}
                  textAnchor="middle"
                  fontSize={FS.chrome}
                  letterSpacing=".08em"
                  fill="var(--pda-txt)"
                >
                  {p.flagship.shortTitle}
                </text>
              </>
            ) : null}
          </g>
        );
      })}

      {/* THE CENTRE — a chamfered plate, never a disc. Drawn last, so it caps
          the five inner chords into one hub. */}
      <path
        d={housing(o.x - PLATE.w / 2, o.y - PLATE.h / 2, PLATE.w, PLATE.h, PLATE.cut)}
        fill="var(--pda-void)"
      />
      <path
        d={housing(o.x - PLATE.w / 2, o.y - PLATE.h / 2, PLATE.w, PLATE.h, PLATE.cut)}
        fill="rgba(var(--dawn-rgb), 0.05)"
        stroke="var(--pda-hair2)"
      />
      <line
        x1={o.x - PLATE.w / 2}
        y1={o.y - PLATE.h / 2 + 1}
        x2={o.x + PLATE.w / 2 - PLATE.cut}
        y2={o.y - PLATE.h / 2 + 1}
        stroke="var(--pda-hair2)"
        strokeWidth="2"
      />
      <text
        x={o.x}
        y={o.y - 1}
        textAnchor="middle"
        fontSize={FS.hero}
        fontWeight={700}
        letterSpacing=".08em"
        fill="var(--pda-txt)"
      >
        {String(total)}
      </text>
      <text
        x={o.x}
        y={o.y + 20}
        textAnchor="middle"
        fontSize={FS.chrome}
        letterSpacing=".22em"
        fill="var(--pda-ink)"
      >
        SUBSTRATE
      </text>
    </>
  );
}

/* ── LETTERING SPEC, MARK COUNT, MASS and SEATING ───────────────────────── */

/** Each wedge declares the measures its own solved block actually used. */
const measuresFor = (record: IslRecord) => {
  const seats = new Map(facetLayout(record).map((l) => [l.wedge.key, l.seat]));
  return (p: RoundSixPattern): RoundSixMeasures => {
    const s = seats.get(p.key);
    const gloss = s ? s.per * adv(FS.gloss, 0.08) + FIT_EPS : 0;
    const w = s ? s.w + FIT_EPS : 0;
    return { name: w, count: w, gloss, evalMethod: w, flagship: w, glossLines: GLOSS_MAX_LINES };
  };
};

export const facetLettering = (record: IslRecord): LetterSpec[] => {
  /* ⚠ THE COUNT IS NOT LETTERED. On every other round-six direction a numeral
     rides beside the name; here the wedge's SIZE is the count and the rim
     ticks are there to be tallied, so a numeral would be this surface's
     said-twice defect — the one that took the console's head, its foot and
     its designator. */
  const specs = patternSpecs(record, measuresFor(record)).filter((s) => !s.slot.endsWith(".count"));
  const total = totalOf(patterns(record));
  const plateM = PLATE.w - MODULE.pad * 2;
  specs.push(
    { slot: "core.total", text: String(total), fs: FS.hero, track: 0.08, measure: plateM },
    { slot: "core.label", text: "SUBSTRATE", fs: FS.chrome, track: 0.22, measure: plateM }
  );
  return specs;
};

export const facetMarkCount = (_record: IslRecord, key: string): number => markCountOf(key);

/**
 * AREA is the count, and since the SPLIT the angle is no longer shared, so the
 * whole trapezoid formula is the guard: `½·sin(θ)·(r² − R0²)`. ⚠ Guarding
 * `r² − R0²` alone would have been correct for equal angles and silently
 * wrong the moment the angles started varying — the exact shape of a guard
 * that keeps passing after the thing it measures has changed.
 */
export const facetMass = (record: IslRecord, key: string): number => {
  const w = facetWedges(patterns(record)).find((x) => x.key === key);
  if (!w) return 0;
  return 0.5 * Math.sin(rad(w.a1 - w.a0)) * (w.r * w.r - R0 * R0);
};

/**
 * ⚠ ITS OWN GUARD, BECAUSE NOTHING ELSE ASKS THIS. The fit guard checks a
 * string against a MEASURE; the capture checks glyph boxes against the crop
 * and against each other. Neither asks whether a label is inside the WEDGE it
 * belongs to.
 */
export const facetSeats = (record: IslRecord) =>
  facetLayout(record).map((l) => ({ key: l.wedge.key, seated: l.seat !== null }));
