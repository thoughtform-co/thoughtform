import type { SubstrateSkillPattern } from "./sampleSkills";
import { CROP_H, FS, L, MODULE, W, housing, type LetterSpec } from "./substrateKit";
import {
  Field,
  type RoundSixMeasures,
  type RoundSixPattern,
  charsFor,
  markCountOf,
  patternSpecs,
  patterns,
  ranked,
  totalOf,
} from "./roundSix";
import { wrapLines } from "@/components/landing/home-v2/services/casefile/map/pda/pdaGlyphs";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 22 · MOSAIC — one plate divided, not five cards collected.
 *
 * ⚠ THE ABSENCE OF GUTTERS IS THE ENTIRE DIRECTION. Production's reading 03
 * is five `housing()` cards in a row with 20 units between them, which is
 * reading 01's grid at n=5 — and the owner's standing constraint is that this
 * reading may not look like the work tab. Take the gutters away and the same
 * five rectangles stop being objects and become REGIONS of one surface, which
 * is the claim the reading is actually making: one intelligence layer, five
 * recurring shapes. A gutter is not a spacing decision here, it is a
 * statement about how many things there are.
 *
 * Area is the Skill count, so Pattern's fourteen occupies almost three times
 * Stakeholder's five and no numeral is doing that work. Each region letters
 * its name, its count, its definition, its eval method as a gold key and one
 * exemplar, over its own physics field at low alpha.
 *
 * ⚠ ONE CUT, ON THE OUTER BOUNDARY ONLY. Chamfering each region would put
 * five machined housings back on the surface and undo the paragraph above;
 * the mosaic is clipped to a single TR+BL housing and every internal edge is
 * a hairline. ADR-065's grammar reads the whole mosaic as the one object.
 *
 * ⚠ AND THE PARTITION IS DERIVED, NEVER AUTHORED. The split is slice-and-dice
 * over the mass ranking: the heaviest patterns fill the left column until the
 * running sum passes half the estate, the rest take the right. Hardcoding
 * "pattern and judgment go left" would silently mis-draw the moment a Skill
 * moves between shapes, and the areas would stop being the counts.
 */

export const MOSAIC_VIEWBOX = "0 0 932 762";

/* ── The box ────────────────────────────────────────────────────────────── */

const BOX = { x: L, y: 26, w: W, h: CROP_H - 52 };
/** The outer cut. Larger than `MODULE.cut` because it reads at the scale of
 *  the whole panel rather than of one card. */
const OUTER_CUT = 26;
const PAD_IN = 16;

export interface MosaicBlock {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Slice and dice. Pure, so the fit test walks the same rectangles the drawing
 * paints, and the mass guard can check area against count directly.
 */
export function mosaicBlocks(rows: readonly RoundSixPattern[]): MosaicBlock[] {
  const order = ranked(rows);
  const total = totalOf(order);
  if (total <= 0 || order.length === 0) return [];

  /* The column split: the heaviest patterns take the left until the running
     sum passes half the estate. On this record that is 14 + 12 against
     9 + 7 + 5, which is also the split that keeps both columns near-square. */
  let run = 0;
  let cut = 1;
  for (let i = 0; i < order.length; i += 1) {
    run += order[i].n;
    if (run * 2 >= total) {
      cut = i + 1;
      break;
    }
  }
  const left = order.slice(0, cut);
  const right = order.slice(cut);
  const leftN = totalOf(left);
  const leftW = right.length === 0 ? BOX.w : (BOX.w * leftN) / total;

  const out: MosaicBlock[] = [];
  const stack = (col: readonly RoundSixPattern[], x: number, w: number) => {
    const n = totalOf(col);
    let y = BOX.y;
    for (const [i, p] of col.entries()) {
      /* The last block takes the remainder, so rounding never leaves a
         one-unit seam of bed showing through the mosaic. */
      const h = i === col.length - 1 ? BOX.y + BOX.h - y : (BOX.h * p.n) / n;
      out.push({ key: p.key, x, y, w, h });
      y += h;
    }
  };
  stack(left, BOX.x, leftW);
  if (right.length > 0) stack(right, BOX.x + leftW, BOX.w - leftW);
  return out;
}

/** A block's own text column. */
const measureOf = (b: MosaicBlock) => b.w - PAD_IN * 2;

/* Baselines from a block's top edge. */
const B_NAME = 36;
const B_GLOSS = 64;
const B_EVAL = 88;
const B_FLAG = 114;

export function VariantMosaic({ record }: IslVariantProps) {
  const rows = patterns(record);
  const blocks = mosaicBlocks(rows);
  const byKey = new Map(rows.map((p) => [p.key, p]));
  const outer = housing(BOX.x, BOX.y, BOX.w, BOX.h, OUTER_CUT);

  return (
    <>
      <defs>
        <clipPath id="r6-mosaic-outer">
          <path d={outer} />
        </clipPath>
      </defs>

      {/* THE PLATE — one opaque ground under the whole mosaic, so the regions
          sit on one surface rather than each carrying its own. */}
      <path d={outer} fill="var(--pda-void)" />

      <g clipPath="url(#r6-mosaic-outer)">
        {blocks.map((b, i) => {
          const p = byKey.get(b.key);
          if (!p) return null;
          const m = measureOf(b);
          const glossLines = wrapLines(p.gloss, charsFor(m, FS.gloss, 0.08), 2);
          const fieldTop = b.y + B_FLAG + 18;
          return (
            <g key={b.key}>
              {/* The region's own lift — alternating by rank so neighbouring
                  regions are separable without a border between them. */}
              <rect
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                fill="rgba(var(--dawn-rgb), 0.03)"
                fillOpacity={i % 2 === 0 ? 1 : 0.45}
              />
              <Field
                form={b.key as SubstrateSkillPattern}
                x={b.x + PAD_IN}
                y={fieldTop}
                w={b.w - PAD_IN * 2}
                h={Math.max(0, b.y + b.h - PAD_IN - fieldTop)}
                seed={i + 1}
                opacity={0.34}
              />

              <text
                x={b.x + PAD_IN}
                y={b.y + B_NAME}
                fontSize={FS.name}
                fontWeight={700}
                letterSpacing=".08em"
                fill="var(--pda-txt)"
              >
                {p.name}
              </text>
              <text
                x={b.x + b.w - PAD_IN}
                y={b.y + B_NAME}
                textAnchor="end"
                fontSize={FS.key}
                letterSpacing=".18em"
                fill="var(--pda-ink)"
              >
                {p.nn}
              </text>
              {glossLines.map((line, k) => (
                <text
                  key={line}
                  x={b.x + PAD_IN}
                  y={b.y + B_GLOSS + k * 18}
                  fontSize={FS.gloss}
                  letterSpacing=".08em"
                  fill="var(--pda-txt2)"
                >
                  {line}
                </text>
              ))}
              <text
                x={b.x + PAD_IN}
                y={b.y + B_EVAL + (glossLines.length - 1) * 18}
                fontSize={FS.chrome}
                letterSpacing=".14em"
                fill="var(--pda-ink)"
              >
                {p.evalMethod}
              </text>
              {p.flagship ? (
                <g>
                  <rect
                    x={b.x + PAD_IN}
                    y={b.y + B_FLAG + (glossLines.length - 1) * 18 - 8}
                    width={8}
                    height={8}
                    fill="var(--pda-grn)"
                  />
                  <text
                    x={b.x + PAD_IN + 16}
                    y={b.y + B_FLAG + (glossLines.length - 1) * 18}
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

        {/* THE INTERNAL EDGES — hairlines, never borders. A region is a
            division of the plate, so its edge is a rule, not a frame. */}
        {blocks.map((b) => (
          <g key={`e-${b.key}`}>
            <line x1={b.x} y1={b.y} x2={b.x + b.w} y2={b.y} stroke="var(--pda-hair)" />
            <line x1={b.x} y1={b.y} x2={b.x} y2={b.y + b.h} stroke="var(--pda-hair)" />
          </g>
        ))}
      </g>

      {/* The one cut, stroked over the clip so the outer edge stays crisp. */}
      <path d={outer} fill="none" stroke="var(--pda-hair2)" />
      <line
        x1={BOX.x}
        y1={BOX.y + 1}
        x2={BOX.x + BOX.w - OUTER_CUT}
        y2={BOX.y + 1}
        stroke="var(--pda-hair2)"
        strokeWidth="2"
      />
    </>
  );
}

/* ── LETTERING SPEC and MASS ────────────────────────────────────────────── */

const measuresFor = (rows: readonly RoundSixPattern[]) => {
  const blocks = new Map(mosaicBlocks(rows).map((b) => [b.key, b]));
  return (p: RoundSixPattern): RoundSixMeasures => {
    const m = measureOf(blocks.get(p.key) ?? { key: p.key, x: 0, y: 0, w: 0, h: 0 });
    return {
      name: m - 44,
      count: 44,
      gloss: m,
      evalMethod: m,
      flagship: m - 16,
      glossLines: 2,
    };
  };
};

export const mosaicLettering = (record: IslRecord): LetterSpec[] =>
  patternSpecs(record, measuresFor(patterns(record)));

/**
 * AREA is the count. The mass guard divides this by the Skill count and
 * asserts every pattern lands on the same unit area — the only way to check a
 * continuous encoding, since there are no marks to tally.
 *
 * ⚠ NO `markCount` HERE. The mosaic draws no per-Skill mark at all — its whole
 * claim is carried by area — so a mark guard would be checking the fixture
 * against itself and reporting green on a drawing that had stopped encoding
 * anything.
 */
export const mosaicMass = (record: IslRecord, key: string): number => {
  const b = mosaicBlocks(patterns(record)).find((x) => x.key === key);
  return b ? b.w * b.h : 0;
};
