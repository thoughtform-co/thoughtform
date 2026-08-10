// ═══════════════════════════════════════════════════════════════════
// DAEMONIAC — the glyph forge. The mysterious language, synthesized.
//
// THE NAME IS THE SEED: a glyph is forged deterministically from the
// entity's name, so the same lane letters identically on every plate
// and the specimen sheet is an honest catalog, never a re-roll.
// Renaming a record redraws its glyphs — feature, not bug.
//
// The script register is the ONE organic register in the house (curves
// legal, round caps) — distinct from the pixel icon grammar (no curves
// ever) and the celestial instrument grammar. Grammar doc:
// docs/design/daemoniac/GRAMMAR.md.
//
// Anatomy (from the tome references' MAJOR/MINOR alphabets):
//   one SPINE (the written backbone, weight 1)
// + BRANCHES (bars, diagonals, quadratic bowls, hooks — weight 0.7)
// + TERMINALS (rings or tick-bars on free ends — weight 0.5)
// One connected written form; Major reads as a capital (3×5 lattice),
// Minor as a diacritic (3×3).
// ═══════════════════════════════════════════════════════════════════

import { combineSeed, createSeededRandom, hashString } from "@/lib/particle-geometry/rng";

import type { MarkPrimitive } from "./types";

/** Glyph box in glyph-local units; primitives are emitted CENTERED on
 *  the box middle so placement is translate + uniform scale. */
export const GLYPH_BOX = { w: 10, h: 16 } as const;

const COLS = [1, 5, 9] as const;
const MAJOR_ROWS = [1, 4.5, 8, 11.5, 15] as const;
const MINOR_ROWS = [2, 8, 14] as const;

export type GlyphGrade = "major" | "minor";

type Anchor = readonly [col: number, row: number];

interface StrokeGeom {
  /** Lattice anchors this stroke touches (for connectivity + degree). */
  anchors: readonly Anchor[];
  /** Endpoint anchors (degree-bearing); subset of `anchors`. */
  ends: readonly Anchor[];
  descriptor: string;
  primitives: readonly MarkPrimitive[];
}

export interface GlyphSpec {
  name: string;
  grade: GlyphGrade;
  /** Quantized stroke descriptors — the fingerprint's raw material. */
  descriptors: readonly string[];
  /** Centered glyph-local primitives (role "glyph", order 0). */
  primitives: readonly MarkPrimitive[];
  /** Sorted-descriptor identity; the distinguishability guard keys on it. */
  fingerprint: string;
}

const key = (a: Anchor): string => `${a[0]},${a[1]}`;

function rowsFor(grade: GlyphGrade): readonly number[] {
  return grade === "major" ? MAJOR_ROWS : MINOR_ROWS;
}

function pt(grade: GlyphGrade, a: Anchor): readonly [number, number] {
  return [COLS[a[0]], rowsFor(grade)[a[1]]];
}

function line(
  grade: GlyphGrade,
  a: Anchor,
  b: Anchor,
  weight: MarkPrimitive["weight"]
): MarkPrimitive {
  const [x1, y1] = pt(grade, a);
  const [x2, y2] = pt(grade, b);
  return { kind: "line", x1, y1, x2, y2, weight, order: 0, role: "glyph" };
}

/** Quadratic bowl between two anchors; control = midpoint pushed
 *  perpendicular by `bulge · side`. */
function bowl(grade: GlyphGrade, a: Anchor, b: Anchor, bulge: number, side: 1 | -1): MarkPrimitive {
  const [x1, y1] = pt(grade, a);
  const [x2, y2] = pt(grade, b);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const m = Math.hypot(dx, dy) || 1;
  return {
    kind: "quad",
    x1,
    y1,
    cx: mx + (-dy / m) * bulge * side,
    cy: my + (dx / m) * bulge * side,
    x2,
    y2,
    weight: 0.7,
    order: 0,
    role: "glyph",
  };
}

/** Anchors a straight stroke passes through (inclusive). */
function anchorsOnSegment(a: Anchor, b: Anchor): Anchor[] {
  const out: Anchor[] = [];
  const dc = Math.sign(b[0] - a[0]);
  const dr = Math.sign(b[1] - a[1]);
  const steps = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
  // Only pure verticals/horizontals/uniform diagonals pass through
  // lattice anchors; others contribute endpoints alone.
  const uniform = a[0] === b[0] || a[1] === b[1] || Math.abs(b[0] - a[0]) === Math.abs(b[1] - a[1]);
  if (!uniform) return [a, b];
  for (let i = 0; i <= steps; i++) out.push([a[0] + dc * i, a[1] + dr * i]);
  return out;
}

// ── Spine candidates ─────────────────────────────────────────────

interface SpineCandidate {
  descriptor: string;
  a: Anchor;
  b: Anchor;
}

function spineCandidates(grade: GlyphGrade): SpineCandidate[] {
  const lastRow = rowsFor(grade).length - 1;
  const out: SpineCandidate[] = [];
  for (let c = 0; c < COLS.length; c++) {
    out.push({ descriptor: `sp:stem:${c}:0-${lastRow}`, a: [c, 0], b: [c, lastRow] });
  }
  if (grade === "major") {
    // Partial stems keep the tall register without filling the box.
    out.push({ descriptor: "sp:stem:1:0-3", a: [1, 0], b: [1, 3] });
    out.push({ descriptor: "sp:stem:1:1-4", a: [1, 1], b: [1, 4] });
  }
  out.push({ descriptor: `sp:diag:0-${lastRow}`, a: [0, 0], b: [2, lastRow] });
  out.push({ descriptor: `sp:diag:${lastRow}-0`, a: [2, 0], b: [0, lastRow] });
  return out;
}

// ── The forge ────────────────────────────────────────────────────

export function forgeGlyph(name: string, grade: GlyphGrade, seedTag?: string): GlyphSpec {
  const rng = createSeededRandom(
    combineSeed(hashString(name.toLowerCase()), hashString(grade), hashString(seedTag ?? ""))
  );
  const lastRow = rowsFor(grade).length - 1;

  const strokes: StrokeGeom[] = [];
  const used = new Set<string>();
  const degree = new Map<string, number>();

  const commit = (s: StrokeGeom) => {
    strokes.push(s);
    for (const a of s.anchors) {
      used.add(key(a));
      // Pass-through anchors saturate at 2 so they never read as free ends.
      if (!s.ends.some((e) => key(e) === key(a))) {
        degree.set(key(a), (degree.get(key(a)) ?? 0) + 2);
      }
    }
    for (const e of s.ends) degree.set(key(e), (degree.get(key(e)) ?? 0) + 1);
  };

  // 1 · The spine.
  const spine = rng.pick(spineCandidates(grade));
  const spineAnchors = anchorsOnSegment(spine.a, spine.b);
  commit({
    anchors: spineAnchors,
    ends: [spine.a, spine.b],
    descriptor: spine.descriptor,
    primitives: [line(grade, spine.a, spine.b, 1)],
  });

  // 2 · Branches, from enumerated LEGAL candidates only (connectivity +
  //     unseen descriptor) — never an unbounded rejection loop.
  interface BranchCandidate {
    descriptor: string;
    build: () => StrokeGeom;
    addsCol: number[];
  }

  const inBounds = (a: Anchor): boolean =>
    a[0] >= 0 && a[0] < COLS.length && a[1] >= 0 && a[1] <= lastRow;

  const branchCandidates = (): BranchCandidate[] => {
    const out: BranchCandidate[] = [];
    const usedDesc = new Set(strokes.map((s) => s.descriptor));
    const push = (descriptor: string, a: Anchor, b: Anchor, mk: () => MarkPrimitive) => {
      if (usedDesc.has(descriptor)) return;
      if (!used.has(key(a)) && !used.has(key(b))) return;
      out.push({
        descriptor,
        addsCol: [a[0], b[0]].filter((c) => !anyUsedInCol(c)),
        build: () => ({
          anchors: [a, b],
          ends: [a, b],
          descriptor,
          primitives: [mk()],
        }),
      });
    };
    const pushBowl = (geomKey: string, a: Anchor, b: Anchor, side: 1 | -1) => {
      // Committed bowls carry a `:b<bulge>` suffix — match on the
      // geometry prefix or the same curve re-offers with the other bulge.
      for (const d of usedDesc) {
        if (d === geomKey || d.startsWith(`${geomKey}:b`)) return;
      }
      if (!used.has(key(a)) && !used.has(key(b))) return;
      out.push({
        descriptor: geomKey,
        addsCol: [a[0], b[0]].filter((c) => !anyUsedInCol(c)),
        build: () => {
          const bulge = rng.pick([2.2, 3.4]);
          return {
            anchors: [a, b],
            ends: [a, b],
            descriptor: `${geomKey}:b${bulge}`,
            primitives: [bowl(grade, a, b, bulge, side)],
          };
        },
      });
    };
    const anyUsedInCol = (c: number): boolean => [...used].some((k) => k.startsWith(`${c},`));

    for (let r = 0; r <= lastRow; r++) {
      for (let c = 0; c < COLS.length - 1; c++) {
        push(`br:bar:${c}-${c + 1}:${r}`, [c, r], [c + 1, r], () =>
          line(grade, [c, r], [c + 1, r], 0.7)
        );
      }
    }
    for (let r = 0; r < lastRow; r++) {
      for (let c = 0; c < COLS.length; c++) {
        for (const dc of [-1, 1]) {
          const b: Anchor = [c + dc, r + 1];
          if (!inBounds(b)) continue;
          push(`br:diag:${c},${r}-${b[0]},${b[1]}`, [c, r], b, () => line(grade, [c, r], b, 0.7));
        }
      }
    }
    // Bowls: same column 1–2 rows apart, or adjacent column 1 row apart.
    const bowlPairs: (readonly [Anchor, Anchor])[] = [];
    for (let c = 0; c < COLS.length; c++) {
      for (let r = 0; r < lastRow; r++) {
        bowlPairs.push([
          [c, r],
          [c, r + 1],
        ] as const);
        if (r + 2 <= lastRow)
          bowlPairs.push([
            [c, r],
            [c, r + 2],
          ] as const);
        for (const dc of [-1, 1]) {
          const b: Anchor = [c + dc, r + 1];
          if (inBounds(b)) bowlPairs.push([[c, r], b] as const);
        }
      }
    }
    for (const [a, b] of bowlPairs) {
      for (const side of [1, -1] as const) {
        // Candidate dedup keys on geometry alone; the COMMITTED
        // descriptor carries the bulge too — a 2.2 and a 3.4 bowl are
        // visibly different curves, and the fingerprint should know it.
        pushBowl(`br:bowl:${key(a)}-${key(b)}:s${side}`, a, b, side);
      }
    }
    // Hooks: a small exit curl off a used anchor.
    for (const k of used) {
      if ((degree.get(k) ?? 0) > 2) continue;
      const [c, r] = k.split(",").map(Number);
      for (const side of [1, -1] as const) {
        const descriptor = `br:hook:${c},${r}:s${side}`;
        if (new Set(strokes.map((s) => s.descriptor)).has(descriptor)) continue;
        const [ax, ay] = pt(grade, [c, r]);
        out.push({
          descriptor,
          addsCol: [],
          build: () => ({
            anchors: [[c, r]],
            ends: [[c, r]],
            descriptor,
            primitives: [
              {
                kind: "quad",
                x1: ax,
                y1: ay,
                cx: ax + 0.3 * side,
                cy: ay + 2.8,
                x2: ax + 2.6 * side,
                y2: ay + 2.6,
                weight: 0.7,
                order: 0,
                role: "glyph",
              },
            ],
          }),
        });
      }
    }
    return out;
  };

  // Minor at 1 branch was too sparse to letter (and structurally prone
  // to superset-by-one collisions the ≥2-descriptor floor exists to
  // catch) — the references' diacritics carry 3–4 visible strokes.
  const branchCount = grade === "major" ? rng.int(2, 4) : rng.int(2, 3);
  for (let i = 0; i < branchCount; i++) {
    const candidates = branchCandidates();
    if (candidates.length === 0) break;
    commit(rng.pick(candidates).build());
  }

  // 3 · Width floor: the form must span ≥2 columns to read as a letter.
  const colsUsed = new Set([...used].map((k) => Number(k.split(",")[0])));
  if (colsUsed.size < 2) {
    const wideners = branchCandidates().filter((c) => c.addsCol.length > 0);
    if (wideners.length > 0) commit(rng.pick(wideners).build());
  }

  // 4 · The mirrored-bowl pair — the Major entity-grade flourish: two
  //     wings off one center-column anchor.
  if (grade === "major" && rng.bool(0.35)) {
    const centers = [...used]
      .map((k) => k.split(",").map(Number) as unknown as Anchor)
      .filter((a) => a[0] === 1 && a[1] < lastRow);
    if (centers.length > 0) {
      const a = rng.pick(centers);
      const bulge = rng.pick([2.2, 3.4]);
      for (const dc of [-1, 1] as const) {
        const b: Anchor = [1 + dc, a[1] + 1];
        const descriptor = `br:wing:${key(a)}:s${dc}:b${bulge}`;
        if (!strokes.some((s) => s.descriptor === descriptor)) {
          commit({
            anchors: [a, b],
            ends: [a, b],
            descriptor,
            primitives: [bowl(grade, a, b, bulge, dc as 1 | -1)],
          });
        }
      }
    }
  }

  // 5 · Terminals on free ends (degree exactly 1).
  const termMax = grade === "major" ? 2 : 1;
  const termCount = rng.int(0, termMax);
  if (termCount > 0) {
    const freeEnds: Anchor[] = [];
    for (const [k, d] of degree) {
      if (d === 1) freeEnds.push(k.split(",").map(Number) as unknown as Anchor);
    }
    rng.shuffle(freeEnds);
    for (let i = 0; i < Math.min(termCount, freeEnds.length); i++) {
      const end = freeEnds[i];
      const owner = strokes.find((s) => s.ends.some((e) => key(e) === key(end)));
      if (!owner) continue;
      const other = owner.ends.find((e) => key(e) !== key(end)) ?? end;
      const [ex, ey] = pt(grade, end);
      const [ox, oy] = pt(grade, other);
      let dx = ex - ox;
      let dy = ey - oy;
      const m = Math.hypot(dx, dy) || 1;
      dx /= m;
      dy /= m;
      const ring = rng.bool(0.6);
      const descriptor = `tm:${ring ? "ring" : "tick"}:${key(end)}`;
      if (strokes.some((s) => s.descriptor === descriptor)) continue;
      const primitives: MarkPrimitive[] = ring
        ? [
            {
              kind: "circle",
              cx: ex + dx * 2,
              cy: ey + dy * 2,
              r: 1.2,
              phase: 0,
              weight: 0.5,
              order: 0,
              role: "glyph",
            },
          ]
        : [
            {
              kind: "line",
              x1: ex + dx * 1.2 - -dy * 1.6,
              y1: ey + dy * 1.2 - dx * 1.6,
              x2: ex + dx * 1.2 + -dy * 1.6,
              y2: ey + dy * 1.2 + dx * 1.6,
              weight: 0.5,
              order: 0,
              role: "glyph",
            },
          ];
      commit({ anchors: [], ends: [], descriptor, primitives });
    }
  }

  // Center the primitives on the box middle.
  const cx = GLYPH_BOX.w / 2;
  const cy = GLYPH_BOX.h / 2;
  const centered = strokes.flatMap((s) => s.primitives.map((p) => shift(p, -cx, -cy)));

  const descriptors = strokes.map((s) => s.descriptor);
  return {
    name,
    grade,
    descriptors,
    primitives: centered,
    fingerprint: [...descriptors].sort().join("|"),
  };
}

function shift(p: MarkPrimitive, dx: number, dy: number): MarkPrimitive {
  switch (p.kind) {
    case "circle":
    case "arc":
      return { ...p, cx: p.cx + dx, cy: p.cy + dy };
    case "line":
      return { ...p, x1: p.x1 + dx, y1: p.y1 + dy, x2: p.x2 + dx, y2: p.y2 + dy };
    case "quad":
      return {
        ...p,
        x1: p.x1 + dx,
        y1: p.y1 + dy,
        cx: p.cx + dx,
        cy: p.cy + dy,
        x2: p.x2 + dx,
        y2: p.y2 + dy,
      };
  }
}

/** The Scriptorium Anima register: a vertical column of Minor-grade
 *  marks, one per syllable chunk of the name (cap 6). Chunking is
 *  deterministic; each mark seeds from `name::i` so it is still
 *  name-local. */
export function forgeIdeogram(name: string, seedTag?: string): GlyphSpec[] {
  const clean = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const chunks: string[] = [];
  for (let i = 0; i < clean.length && chunks.length < 6; i += 3) {
    chunks.push(clean.slice(i, i + 3));
  }
  if (chunks.length === 0) chunks.push(clean || "x");
  return chunks.map((_, i) => forgeGlyph(`${name}::${i}`, "minor", seedTag));
}
