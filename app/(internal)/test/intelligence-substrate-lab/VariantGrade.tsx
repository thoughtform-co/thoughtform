import type { SubstrateSkillPattern } from "./sampleSkills";
import { CROP_H, FS, L, R, W, type LetterSpec } from "./substrateKit";
import {
  Field,
  type RoundSixMeasures,
  type RoundSixPattern,
  patternSpecs,
  patterns,
  ranked,
  totalOf,
} from "./roundSix";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 25 · GRADE — the ground the work stands on.
 *
 * The only direction of round six that draws the relation UPWARD to the other
 * two readings, and it does it without borrowing either one's silhouette —
 * which is what got round four rejected. One rule across the upper third.
 * Above it, the estate's encoded Skills as a flat unsorted run. Below it, the
 * same Skills resolved into five strata whose DEPTH is their count.
 *
 * ⚠ THE RUN ABOVE AND THE STRATA BELOW ARE THE SAME 47, AND THAT IS THE
 * ARGUMENT. Not a decoration standing in for "the work": every tick above the
 * line is an encoded Skill, and every one of them is also somewhere in a band
 * below. The drawing says sorting, which is the one thing a substrate reading
 * has to say. A row of ticks that merely SUGGESTED the work would be marks a
 * reader can count standing for a number the record never published — the
 * failure mode this surface bans.
 *
 * ⚠ DEPTH IS PURE, WITH NO FLOOR, AND THE LAYOUT PAYS FOR IT. A minimum band
 * depth with the remainder redistributed was the obvious way to seat
 * Stakeholder's five, and it costs the drawing its whole point: at a 58-unit
 * floor the deepest band is 1.5× the shallowest where the record says 2.8×.
 * So the depth stays exactly proportional and the BAND'S OWN LAYOUT is what
 * shrinks — two baselines, not four, with the name and its definition sharing
 * the first. Stakeholder's 59 units against 47 of ink is the binding case for
 * this direction and `substrate-lab-fit` holds it.
 *
 * ⚠ STRATIGRAPHY RUNS THE RIGHT WAY UP. Thinnest seam under the rule, the
 * heaviest at the bottom, so the drawing reads as bedrock rather than as a
 * bar chart lying on its side.
 */

export const GRADE_VIEWBOX = "0 0 932 762";

/* ── The chain ──────────────────────────────────────────────────────────── */

/** The unsorted run — one tick per encoded Skill, above the line. */
const RUN_TOP = 96;
const RUN_H = 34;
const TICK_W = 4;

const GRADE_Y = 176;
const STRATA_TOP = 196;
const STRATA_H = CROP_H - 10 - STRATA_TOP;

const PAD_IN = 16;
const NAME_M = 200;
const COUNT_X = L + PAD_IN + NAME_M + 10;
const COUNT_M = 40;
const RIGHT_X = L + 290;
const RIGHT_M = R - PAD_IN - RIGHT_X;
const EVAL_M = 240;

const B1 = 24;
const B2 = 44;

export interface GradeBand {
  key: string;
  y: number;
  h: number;
}

/** The seams, thinnest under the rule. Pure — the fit test and the mass guard
 *  read the same bands the drawing paints. */
export function gradeBands(rows: readonly RoundSixPattern[]): GradeBand[] {
  const order = [...ranked(rows)].reverse();
  const total = totalOf(order);
  if (total <= 0) return [];
  const out: GradeBand[] = [];
  let y = STRATA_TOP;
  for (const [i, p] of order.entries()) {
    const h = i === order.length - 1 ? STRATA_TOP + STRATA_H - y : (STRATA_H * p.n) / total;
    out.push({ key: p.key, y, h });
    y += h;
  }
  return out;
}

export function VariantGrade({ record }: IslVariantProps) {
  const rows = patterns(record);
  const bands = gradeBands(rows);
  const byKey = new Map(rows.map((p) => [p.key, p]));
  const total = totalOf(rows);
  const tickPitch = total > 0 ? W / total : 0;

  return (
    <>
      {/* THE RUN ABOVE — the estate, unsorted. Uniform ink on purpose: the
          moment a tick up here takes its pattern's colour the drawing needs a
          legend, and the sorting below stops being the thing it shows. */}
      {Array.from({ length: total }, (_, k) => (
        <rect
          key={k}
          x={L + k * tickPitch}
          y={RUN_TOP}
          width={TICK_W}
          height={RUN_H}
          fill="var(--pda-amb)"
          fillOpacity={0.34}
        />
      ))}

      {/* THE GRADE LINE. */}
      <line x1={L} y1={GRADE_Y} x2={R} y2={GRADE_Y} stroke="var(--pda-hair2)" strokeWidth="2" />
      <text x={L} y={GRADE_Y - 14} fontSize={FS.chrome} letterSpacing=".22em" fill="var(--pda-ink)">
        {`${total} ENCODED · ONE LAYER`}
      </text>

      {bands.map((b, i) => {
        const p = byKey.get(b.key);
        if (!p) return null;
        return (
          <g key={b.key}>
            <rect
              x={L}
              y={b.y}
              width={W}
              height={b.h}
              fill="rgba(var(--dawn-rgb), 0.05)"
              fillOpacity={i % 2 === 0 ? 1 : 0.35}
            />
            <Field
              form={b.key as SubstrateSkillPattern}
              x={L}
              y={b.y}
              w={W}
              h={b.h}
              seed={i + 1}
              opacity={0.3}
            />
            {/* ⚠ THE DEPTH GAUGE — a solid column at the seam's left edge,
                and the direction does not read without it. Depth alone is
                carried by two hairlines and a 5 % wash, which at this meet is
                a boundary the eye has to hunt for: the first cut drew the
                bands correctly proportioned and the 2.8× between Pattern and
                Stakeholder was simply not visible. A common left edge with a
                solid bar against it turns the same arithmetic into a
                comparison, without adding a second encoding. */}
            <rect
              x={L}
              y={b.y + 1}
              width={5}
              height={Math.max(0, b.h - 2)}
              fill="var(--pda-amb)"
              fillOpacity={0.55}
            />
            <line x1={L} y1={b.y} x2={R} y2={b.y} stroke="var(--pda-hair2)" />

            <text
              x={L + PAD_IN}
              y={b.y + B1}
              fontSize={FS.name}
              fontWeight={700}
              letterSpacing=".08em"
              fill="var(--pda-txt)"
            >
              {p.name}
            </text>
            <text
              x={COUNT_X}
              y={b.y + B1}
              fontSize={FS.key}
              letterSpacing=".18em"
              fill="var(--pda-ink)"
            >
              {p.nn}
            </text>
            <text
              x={RIGHT_X}
              y={b.y + B1}
              fontSize={FS.gloss}
              letterSpacing=".08em"
              fill="var(--pda-txt2)"
            >
              {p.gloss}
            </text>
            <text
              x={L + PAD_IN}
              y={b.y + B2}
              fontSize={FS.chrome}
              letterSpacing=".14em"
              fill="var(--pda-ink)"
            >
              {p.evalMethod}
            </text>
            {p.flagship ? (
              <g>
                <rect x={RIGHT_X} y={b.y + B2 - 8} width={8} height={8} fill="var(--pda-grn)" />
                <text
                  x={RIGHT_X + 16}
                  y={b.y + B2}
                  fontSize={FS.chrome}
                  letterSpacing=".08em"
                  fill="var(--pda-txt)"
                >
                  {p.flagship.shortTitle}
                </text>
              </g>
            ) : null}
          </g>
        );
      })}
    </>
  );
}

/* ── LETTERING SPEC and MASS ────────────────────────────────────────────── */

const M: RoundSixMeasures = {
  name: NAME_M,
  count: COUNT_M,
  gloss: RIGHT_M,
  evalMethod: EVAL_M,
  flagship: RIGHT_M - 16,
  glossLines: 1,
};

export const gradeLettering = (record: IslRecord): LetterSpec[] => patternSpecs(record, M);

/** DEPTH is the count.
 *
 * ⚠ AND THERE IS NO `markCount` HERE, DELIBERATELY. The run above the line is
 * one tick per encoded Skill but it is UNGROUPED — 47 ticks at one pitch,
 * which is the whole point of drawing it above the sort. A per-pattern mark
 * guard would assert a grouping this drawing does not make, and would pass by
 * measuring the fixture rather than the picture. Depth is what carries mass
 * here, so depth is what gets checked. */
export const gradeMass = (record: IslRecord, key: string): number =>
  gradeBands(patterns(record)).find((b) => b.key === key)?.h ?? 0;

/** The estate's tick run — asserted against the sum, not against a pattern. */
export const gradeTicks = (record: IslRecord): number => totalOf(patterns(record));
