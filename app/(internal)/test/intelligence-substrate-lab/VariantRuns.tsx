import { FS, L, R, type LetterSpec } from "./substrateKit";
import { type RoundSixMeasures, markCountOf, patternSpecs, patterns, ranked } from "./roundSix";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 24 · RUNS — five rows, ranked, each a run of cells.
 *
 * The calmest of round six and the one most likely to survive the binding
 * viewport intact: nothing here is radial, nested or diagonal, so nothing
 * degrades when `meet` drops to 0.647. Five full-width rows ranked heaviest
 * first. Each carries its name and its definition as one block on the left,
 * its eval method as a gold key under them, and a RUN OF CELLS to the right —
 * one cell per encoded Skill, so fourteen against five is a length you can
 * also count.
 *
 * ⚠ THE DEFINITION SITS BESIDE THE NAME, NOT UNDER THE RUN. That placement is
 * the whole of round six's law in one decision: the incumbent puts the gloss
 * last, in a foot, at the type floor, and the reader never reaches it. Here it
 * is the second thing on the row and it letters at the `gloss` rung, which at
 * this crop's meet is 8.4px against the run's chrome at 7.8.
 *
 * ⚠ AND THE ROW IS RANKED, WHICH THE INCUMBENT IS NOT. Production draws the
 * five in record order, so the mass argument has to be read off fourteen
 * stacked plates against five. Sorting by mass makes the ladder the
 * composition rather than something the reader assembles.
 */

export const RUNS_VIEWBOX = "0 0 932 762";

/* ── The row chain ──────────────────────────────────────────────────────── */

const ROWS = 5;
const ROW_Y0 = 46;
const ROW_PITCH = 138;
const rowY = (i: number) => ROW_Y0 + i * ROW_PITCH;

/** The left block — name over gloss over the eval key. ⚠ 420 is what lets the
 *  38-character voice gloss letter on ONE line (47 characters fit at fs 13 /
 *  .08); at 340 it wraps and the row grows a fourth baseline. */
const BLOCK_W = 420;
const NAME_M = 210;
const COUNT_M = 40;

/** The run. Ends short of the wall so the count has a column of its own. */
const RUN_X = L + BLOCK_W + 30;
const COUNT_X = R;
const RUN_W = COUNT_X - 46 - RUN_X;

/** Cell geometry, sized off the DENSEST pattern so all five share one pitch —
 *  a run whose pitch changed per row would read as five different scales. */
const MAX_N = 14;
const CELL_PITCH = RUN_W / MAX_N;
const CELL_W = CELL_PITCH - 5;
const CELL_H = 34;

/* Baselines inside a row. The name is the `name` rung (line box 26), so its
   cap sits 20.8 above its baseline — 24 clears the row's top edge by 3. */
const B_NAME = 24;
const B_GLOSS = 50;
const B_EVAL = 72;
const RULE_Y = 104;

export function VariantRuns({ record }: IslVariantProps) {
  return (
    <>
      {ranked(patterns(record)).map((p, i) => {
        const y = rowY(i);
        return (
          <g key={p.key}>
            {/* THE NAME AND ITS DEFINITION — one block, in that order. */}
            <text
              x={L}
              y={y + B_NAME}
              fontSize={FS.name}
              fontWeight={700}
              letterSpacing=".08em"
              fill="var(--pda-txt)"
            >
              {p.name}
            </text>
            <text
              x={L + NAME_M + 10}
              y={y + B_NAME}
              fontSize={FS.key}
              letterSpacing=".18em"
              fill="var(--pda-ink)"
            >
              {p.nn}
            </text>
            <text
              x={L}
              y={y + B_GLOSS}
              fontSize={FS.gloss}
              letterSpacing=".08em"
              fill="var(--pda-txt2)"
            >
              {p.gloss}
            </text>
            {/* THE EVAL METHOD — gold, because gold is wayfinding and this is
                the field the reading is navigated by. */}
            <text
              x={L}
              y={y + B_EVAL}
              fontSize={FS.chrome}
              letterSpacing=".14em"
              fill="var(--pda-ink)"
            >
              {p.evalMethod}
            </text>

            {/* THE RUN — one cell per encoded Skill, all five rows on one
                pitch. The flagship takes the green FILL; its label stays at
                full ink (see roundSix). */}
            {p.ordered.map((skill, k) => {
              const first = k === 0;
              return (
                <rect
                  key={skill.id}
                  x={RUN_X + k * CELL_PITCH}
                  y={y + 18}
                  width={CELL_W}
                  height={CELL_H}
                  fill={first ? "var(--pda-grn)" : "var(--pda-amb)"}
                  fillOpacity={first ? 0.95 : 0.34}
                />
              );
            })}
            {p.flagship ? (
              <text
                x={RUN_X}
                y={y + B_EVAL}
                fontSize={FS.chrome}
                letterSpacing=".08em"
                fill="var(--pda-txt)"
              >
                {p.flagship.shortTitle}
              </text>
            ) : null}

            {/* The row's own rule — the instrument read, and what stops five
                rows of text becoming a list. */}
            <line x1={L} y1={y + RULE_Y} x2={R} y2={y + RULE_Y} stroke="var(--pda-hair)" />
          </g>
        );
      })}
    </>
  );
}

/* ── LETTERING SPEC and MARK COUNT ──────────────────────────────────────── */

const M: RoundSixMeasures = {
  name: NAME_M,
  count: COUNT_M,
  gloss: BLOCK_W,
  evalMethod: BLOCK_W,
  /* The flagship letters over the run, so its measure is the run's width. */
  flagship: RUN_W,
  glossLines: 1,
};

export const runsLettering = (record: IslRecord): LetterSpec[] => patternSpecs(record, M);

export const runsMarkCount = (_record: IslRecord, key: string): number => markCountOf(key);

/** Every row shares ONE cell pitch, so a run's drawn LENGTH is its count —
 *  which is what the mass guard checks when the marks are not countable by
 *  eye at this meet. */
export const runsMass = (_record: IslRecord, key: string): number => markCountOf(key) * CELL_PITCH;

export { ROWS };
