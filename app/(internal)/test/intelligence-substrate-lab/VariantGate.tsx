import { FS, L, R, MODULE, housing, type LetterSpec } from "./substrateKit";
import { type RoundSixMeasures, markCountOf, patternSpecs, patterns, ranked } from "./roundSix";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 23 · GATE — a substrate is the TEST work is checked against.
 *
 * The only direction of round six whose COMPOSITION is an argument about
 * evaluation rather than about quantity, and the furthest of the five from
 * readings 01 and 02. Five gates down the crop. Each row reads left to right
 * as a sentence: a run of marks arrives — one per encoded Skill, the flagship
 * first and green — and meets a chamfered THRESHOLD PLATE whose face letters
 * the eval method; the gloss sits past it as the criterion the plate enforces.
 *
 * ⚠ THE PLATE IS THE SUBJECT, WHICH IS WHY THE MARKS ARE UPSTREAM OF IT. Draw
 * the marks after the plate and the row becomes a bar chart with a caption;
 * draw them before it and the plate is a thing work passes THROUGH. The
 * direction only exists in the second reading.
 *
 * ⚠ AND THE GATE IS NOT A GAUGE. Nothing here is filled to a level, nothing
 * is scored, no mark is drawn as passing or failing — the record publishes no
 * per-Skill eval result and the map's envelope would not let it. What the row
 * says is "these N are held to this method", which is exactly what is on
 * record. A gate drawn with a threshold POSITION would be claiming data this
 * case does not have.
 */

export const GATE_VIEWBOX = "0 0 932 762";

/* ── The row chain ──────────────────────────────────────────────────────── */

const ROW_Y0 = 44;
const ROW_PITCH = 142;
const rowY = (i: number) => ROW_Y0 + i * ROW_PITCH;

/** The approach — where the marks arrive from. Sized off the densest pattern
 *  so all five share one pitch; a run that rescaled per row would read as five
 *  different populations rather than one estate. */
const MAX_N = 14;
const RUN_X = L;
/** ⚠ 140, AND THE ROW'S WHOLE WIDTH BUDGET IS SET FROM THE RIGHT-HAND END.
 *  The criterion is a 38-character sentence that has to letter on ONE line at
 *  fs 13 / .08 — 335.9u — and it is the LAST column, so every unit the
 *  approach and the plate take comes out of it. The first cut gave the run 186
 *  and the plate 300, which left the criterion 316 and sliced the word
 *  `CONTEXT` off the end of Voice's definition — caught by the guard, not by
 *  the eye, because SVG text neither wraps nor reports overflow. A 10-unit
 *  mark pitch is still countable; a sentence missing its last word is not a
 *  sentence. */
const RUN_W = 140;
const MARK_PITCH = RUN_W / MAX_N;
const MARK_W = 4;
const MARK_H = 30;

/** The threshold plate. ⚠ 296 wide because `KNOWN-FAILURE FIXTURES` is 22
 *  characters at fs 12 / .14 = 195.4u, and the plate's own `MODULE.pad`
 *  takes 12 from each side — 272 of usable face against 195.4 of demand. */
const PLATE_X = RUN_X + RUN_W + 36;
const PLATE_W = 296;
const PLATE_H = 92;
const PLATE_IN = PLATE_X + MODULE.pad;
const PLATE_M = PLATE_W - MODULE.pad * 2;

/** The criterion, past the gate. 378u against the longest gloss's 335.9 —
 *  about four characters of headroom, which is what a copy edit gets here. */
const GLOSS_X = PLATE_X + PLATE_W + 30;
const GLOSS_M = R - GLOSS_X;

const B_NAME = 32;
const B_EVAL = 62;

export function VariantGate({ record }: IslVariantProps) {
  return (
    <>
      {ranked(patterns(record)).map((p, i) => {
        const y = rowY(i);
        const plateY = y + 6;
        const mid = plateY + PLATE_H / 2;
        const d = housing(PLATE_X, plateY, PLATE_W, PLATE_H, MODULE.cut);

        return (
          <g key={p.key}>
            {/* THE APPROACH — one mark per encoded Skill, arriving. */}
            {p.ordered.map((skill, k) => {
              const first = k === 0;
              return (
                <rect
                  key={skill.id}
                  x={RUN_X + k * MARK_PITCH}
                  y={mid - MARK_H / 2}
                  width={MARK_W}
                  height={MARK_H}
                  fill={first ? "var(--pda-grn)" : "var(--pda-amb)"}
                  fillOpacity={first ? 0.95 : 0.42}
                />
              );
            })}
            {/* The lead-in to the gate, so the marks read as arriving rather
                than as a bar that happens to end there. */}
            <line
              x1={RUN_X}
              y1={mid}
              x2={PLATE_X}
              y2={mid}
              stroke="var(--pda-hair2)"
              strokeDasharray="3 4"
            />
            {p.flagship ? (
              <text
                x={RUN_X}
                y={mid + MARK_H / 2 + 20}
                fontSize={FS.chrome}
                letterSpacing=".08em"
                fill="var(--pda-txt)"
              >
                {p.flagship.shortTitle}
              </text>
            ) : null}

            {/* THE THRESHOLD PLATE. Opaque ground first — an unfilled shape
                hit-tests on its stroke alone and reads as a wireframe against
                the bed. */}
            <path d={d} fill="var(--pda-void)" />
            <path d={d} fill="rgba(var(--dawn-rgb), 0.05)" />
            <path d={d} fill="none" stroke="var(--pda-hair2)" />
            {/* ⚠ THE TOP RULE STOPS AT THE CUT, or it overshoots into the
                notch and draws a 2px stub in mid-air. */}
            <line
              x1={PLATE_X}
              y1={plateY + 1}
              x2={PLATE_X + PLATE_W - MODULE.cut}
              y2={plateY + 1}
              stroke="var(--pda-hair2)"
              strokeWidth="2"
            />
            <text
              x={PLATE_IN}
              y={plateY + B_NAME}
              fontSize={FS.name}
              fontWeight={700}
              letterSpacing=".08em"
              fill="var(--pda-txt)"
            >
              {p.name}
            </text>
            <text
              x={PLATE_X + PLATE_W - MODULE.pad}
              y={plateY + B_NAME}
              textAnchor="end"
              fontSize={FS.key}
              letterSpacing=".18em"
              fill="var(--pda-ink)"
            >
              {p.nn}
            </text>
            <line
              x1={PLATE_IN}
              y1={plateY + B_NAME + 12}
              x2={PLATE_X + PLATE_W - MODULE.pad}
              y2={plateY + B_NAME + 12}
              stroke="var(--pda-hair)"
            />
            {/* THE METHOD — the plate's face, and the reason the plate is here. */}
            <text
              x={PLATE_IN}
              y={plateY + B_EVAL + 12}
              fontSize={FS.chrome}
              letterSpacing=".14em"
              fill="var(--pda-ink)"
            >
              {p.evalMethod}
            </text>

            {/* THE CRITERION — what the gate is enforcing, in the record's
                own words. */}
            <text
              x={GLOSS_X}
              y={mid + 5}
              fontSize={FS.gloss}
              letterSpacing=".08em"
              fill="var(--pda-txt2)"
            >
              {p.gloss}
            </text>
          </g>
        );
      })}
    </>
  );
}

/* ── LETTERING SPEC and MARK COUNT ──────────────────────────────────────── */

const M: RoundSixMeasures = {
  name: PLATE_M - 40,
  count: 40,
  gloss: GLOSS_M,
  evalMethod: PLATE_M,
  flagship: RUN_W + 40,
  glossLines: 1,
};

export const gateLettering = (record: IslRecord): LetterSpec[] => patternSpecs(record, M);

export const gateMarkCount = (_record: IslRecord, key: string): number => markCountOf(key);
