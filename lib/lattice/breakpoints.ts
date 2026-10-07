/**
 * The lattice's breakpoint ladder (ADR-149).
 *
 * CSS cannot tokenise an `@media` condition (no `@custom-media` without
 * postcss-preset-env, which this toolchain does not carry), so the ladder is
 * declared HERE, repeated as a comment table in `app/styles/lattice.css`, and
 * enforced by `tests/lib/lattice-ratchet.test.ts`, which counts every `@media`
 * width or height outside this set per production sheet and only lets the
 * count go down.
 *
 * LAW: the `max-` side is the even number, the `min-` side is max + 1. A pair
 * written 960 / 980, 1100 / 1101 / 1099 or 759 / 759.98 / 760 is one rung
 * declared three ways, and that is how two surfaces split one pixel apart.
 *
 * Zero imports. Read by the ratchet and by the lab's TYPE board.
 */

export type LatticeRung = {
  /** the name a rule may cite in a comment */
  name: string;
  /** the `max-*` value; the `min-*` side is max + 1 */
  max: number;
  axis: "width" | "height";
  /** what crosses it, measured on 2026-10-06 */
  role: string;
};

export const LATTICE_BREAKPOINTS: readonly LatticeRung[] = [
  { name: "narrow", max: 1100, axis: "width", role: "the rail labels hide" },
  {
    name: "phone",
    max: 960,
    axis: "width",
    role: "the rails and the brandmark stand down; --hud-content-inset flips",
  },
  { name: "stack", max: 900, axis: "width", role: "the arcs' heads stack" },
  { name: "tight", max: 700, axis: "width", role: "connector and mobile overrides" },
  { name: "mini", max: 640, axis: "width", role: "the title scale steps down" },
  { name: "short", max: 680, axis: "height", role: "the frame's motion stops" },
  { name: "compact", max: 760, axis: "height", role: "the casefile compacts" },
];

/** Every number a `@media` may cite on an axis: the max side and its min side. */
export function lawfulThresholds(axis: "width" | "height"): ReadonlySet<number> {
  const out = new Set<number>();
  for (const r of LATTICE_BREAKPOINTS) {
    if (r.axis !== axis) continue;
    out.add(r.max);
    out.add(r.max + 1);
  }
  return out;
}
