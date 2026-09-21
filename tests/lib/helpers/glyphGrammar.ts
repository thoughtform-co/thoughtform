/**
 * The particle-icon grammar's mechanical rules, as functions a suite can run
 * over any 7×7 glyph table
 * (`.claude/skills/thoughtform-design/references/particle-icon-grammar.md`).
 *
 * `proof-glyphs.test.ts` states these inline over the casefile's sixteen;
 * the arcs log's five (ADR-118 U2, `lib/sheet/logGlyphs.ts`) are a second
 * table under the same grammar, so the rules are lifted here rather than
 * restated a second time by hand. Each returns the violations, readable;
 * empty is lawful.
 */

export type Pixel = readonly [number, number];
export interface Glyph {
  sk: readonly Pixel[];
  sig: readonly Pixel[];
  dr: readonly Pixel[];
}

export const GRID = 7;
/** Restraint: never more than 16 skeleton + signal pixels. */
export const MAX_FORM_PIXELS = 16;

const key = (p: Pixel) => `${p[0]},${p[1]}`;
const layers = (g: Glyph) =>
  [
    ["sk", g.sk],
    ["sig", g.sig],
    ["dr", g.dr],
  ] as const;

export function grammarViolations(name: string, g: Glyph): string[] {
  const out: string[] = [];
  for (const [layer, pixels] of layers(g)) {
    for (const [c, r] of pixels)
      if (!Number.isInteger(c) || !Number.isInteger(r) || c < 0 || r < 0 || c >= GRID || r >= GRID)
        out.push(`${name}.${layer} [${c},${r}] is off the lattice`);
    const seen = pixels.map(key);
    if (new Set(seen).size !== seen.length) out.push(`${name}.${layer} repeats a pixel`);
  }
  const form = g.sk.length + g.sig.length;
  if (form < 1 || form > MAX_FORM_PIXELS) out.push(`${name} draws ${form} form pixels (1–16)`);
  if (g.sig.length < 1 || g.sig.length > 3)
    out.push(`${name} carries ${g.sig.length} signal (1–3)`);
  if (g.dr.length < 1 || g.dr.length > 2) out.push(`${name} carries ${g.dr.length} drift (1–2)`);
  const formSet = new Set([...g.sk, ...g.sig].map(key));
  const skSet = new Set(g.sk.map(key));
  for (const p of g.sig)
    if (skSet.has(key(p))) out.push(`${name} signal [${key(p)}] sits on the skeleton`);
  for (const p of g.dr) {
    if (formSet.has(key(p))) out.push(`${name} drift [${key(p)}] sits on a form pixel`);
    // Exactly one unit along ONE axis from a SKELETON pixel — a diagonal
    // neighbour reads as a second form pixel, not as the same one nudged.
    const adjacent = g.sk.some(([c, r]) => Math.abs(c - p[0]) + Math.abs(r - p[1]) === 1);
    if (!adjacent) out.push(`${name} drift [${key(p)}] is not one axis-step from the skeleton`);
  }
  return out;
}

/** Every pixel of a glyph as one fingerprint, for the distinguishability floor. */
export function fingerprint(g: Glyph): string {
  return layers(g)
    .map(([layer, pixels]) => `${layer}:${[...pixels.map(key)].sort().join("|")}`)
    .join(" ");
}

/** How much of two glyphs' form overlaps (Jaccard over skeleton + signal). */
export function formOverlap(a: Glyph, b: Glyph): number {
  const A = new Set([...a.sk, ...a.sig].map(key));
  const B = new Set([...b.sk, ...b.sig].map(key));
  const both = [...A].filter((p) => B.has(p)).length;
  return both / new Set([...A, ...B]).size;
}
