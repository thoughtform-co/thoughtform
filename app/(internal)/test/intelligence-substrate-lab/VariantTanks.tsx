import { ribbonPaths } from "@/components/landing/home-v2/services/casefile/map/pda/ribbon";

import type { SubstrateSkillPattern } from "./sampleSkills";
import { FS, MODULE, band, housing, type LetterSpec } from "./substrateKit";
import {
  Field,
  type RoundSixMeasures,
  markCountOf,
  patternSpecs,
  patterns,
  ranked,
  totalOf,
} from "./roundSix";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 27 · TANKS — five stores on one manifold.
 *
 * ⚠ ROUND SEVEN IS A CHANGE OF REGISTER, NOT OF GEOMETRY. Readings 01 and 02
 * are drawn as PARTS OF A DEVICE — 01 a field of cartridges, 02 a circuit
 * board with hatched ribbon lanes — and every substrate direction through
 * round six was a CHART set into that machine: a pie, a mosaic, bar rows,
 * strata, a straight-edged donut. A chart in the house style is still a chart,
 * and that is the whole of the owner's _"completely out of place"_. The
 * console does not speak data-viz.
 *
 * The record's own vocabulary says what the substrate is in a machine: teams
 * **draw on** it, work is a **draw**, the shapes are a **reservoir**, the
 * layer sits **below grade**, the reading is **extraction**. Supply-side words
 * throughout, while the drawings kept being statistics.
 *
 * So: five vessels standing on one manifold. The fill is the encoded material
 * — height proportional to the Skill count, filled with the pattern's own
 * physics field, closed by a bright meniscus. The wall carries a GRADUATION,
 * one mark per encoded Skill, and ⚠ its pitch is the SAME on all five vessels
 * by construction (`FILL_UNIT`), which is what makes them one instrument
 * rather than five differently-scaled pictures.
 *
 * ⚠ THE TEXT IS A LEDGER, AND THAT IS FORCED BY ONE NUMBER. `KNOWN-FAILURE
 * FIXTURES` measures 195.4u at fs 12 / .14, and five uniform columns of this
 * crop are 176 wide. **The eval method does not fit a five-across layout at
 * any type size this surface allows**, which is what quietly drove round six
 * into corner blocks and full-width rows. So the vessels carry no lettering at
 * all and the reading is called out to a ledger, joined by leaders — which is
 * the reference's own grammar (every CP2077 panel calls out to a side table).
 */

export const TANKS_VIEWBOX = "0 0 932 762";

/* ── The vessels ────────────────────────────────────────────────────────── */

const VES_L = 26;
const VES_R = 500;
const VES_PITCH = (VES_R - VES_L) / 5;
const VES_W = 70;
const vesX = (i: number) => VES_L + VES_PITCH * i + (VES_PITCH - VES_W) / 2;

const VES_TOP = 96;
const FLOOR = 616;
/** The tallest fill, and therefore the graduation's pitch once divided by the
 *  heaviest pattern's count. */
const FILL_MAX = 460;

const MANIFOLD_Y = 652;
const RISER_TOP = FLOOR;

/* ── The ledger ─────────────────────────────────────────────────────────── */

const LED_X = 540;
const LED_R = 906;
const LED_W = LED_R - LED_X;
const ROW_Y0 = 108;
const ROW_PITCH = 120;

const B_NAME = 22;
const B_GLOSS = 46;
const B_EVAL = 70;
const B_FLAG = 90;
const COUNT_M = 46;
const MARK = 8;
const MARK_GAP = 8;
/** ⚠ On the DECLARED measure only — the guard recomputes each width in a
 *  different association order and lands a rounding step the other side. */
const FIT_EPS = 0.5;

export function VariantTanks({ record }: IslVariantProps) {
  const rows = ranked(patterns(record));
  const total = totalOf(rows);
  const maxN = Math.max(...rows.map((r) => r.n), 1);
  const unit = FILL_MAX / maxN;

  return (
    <>
      {/* THE MANIFOLD — reading 02's ribbon grammar, so the supply reads as
          the same wiring the configuration board is made of. */}
      {ribbonPaths(
        [
          [VES_L, MANIFOLD_Y],
          [VES_R, MANIFOLD_Y],
        ],
        6,
        4
      ).map((d, i) => (
        <path key={i} d={d} fill="none" stroke="var(--pda-amb)" strokeOpacity={0.42} />
      ))}
      <text
        x={VES_L}
        y={MANIFOLD_Y + 46}
        fontSize={FS.chrome}
        letterSpacing=".22em"
        fill="var(--pda-ink)"
      >
        {`${total} ENCODED · ONE SUPPLY`}
      </text>

      {rows.map((p, i) => {
        const x = vesX(i);
        const fillH = p.n * unit;
        const meniscus = FLOOR - fillH;
        const rowY = ROW_Y0 + i * ROW_PITCH;
        const d = housing(x, VES_TOP, VES_W, FLOOR - VES_TOP, MODULE.cut);

        return (
          <g key={p.key}>
            {/* THE RISER — each vessel stands ON the manifold. */}
            {ribbonPaths(
              [
                [x + VES_W / 2, RISER_TOP],
                [x + VES_W / 2, MANIFOLD_Y],
              ],
              4,
              4
            ).map((rd, k) => (
              <path key={k} d={rd} fill="none" stroke="var(--pda-amb)" strokeOpacity={0.42} />
            ))}

            {/* THE VESSEL — opaque ground, so it reads as a body rather than
                an outline and hit-tests across its face. */}
            <path d={d} fill="var(--pda-void)" />

            {/* THE FILL — the encoded material itself, in the pattern's own
                physics field, clipped to the fill box. */}
            <rect
              x={x}
              y={meniscus}
              width={VES_W}
              height={fillH}
              fill="rgba(var(--dawn-rgb), 0.05)"
            />
            <Field
              form={p.key as SubstrateSkillPattern}
              x={x}
              y={meniscus}
              w={VES_W}
              h={fillH}
              seed={i + 1}
              opacity={0.4}
            />
            <line
              x1={x}
              y1={meniscus}
              x2={x + VES_W}
              y2={meniscus}
              stroke="var(--pda-amb)"
              strokeOpacity={0.85}
              strokeWidth="2"
            />

            {/* THE GRADUATION — one mark per encoded Skill, at a pitch shared
                by all five vessels. The first encode's mark runs long and
                takes green; its NAME letters at full ink in the ledger. */}
            {p.ordered.map((skill, k) => {
              const gy = FLOOR - (k + 0.5) * unit;
              const first = k === 0;
              return (
                <line
                  key={skill.id}
                  x1={x}
                  y1={gy}
                  x2={x + (first ? 22 : 12)}
                  y2={gy}
                  stroke={first ? "var(--pda-grn)" : "var(--pda-amb)"}
                  strokeOpacity={first ? 0.95 : 0.5}
                />
              );
            })}

            <path d={d} fill="none" stroke="var(--pda-hair2)" />
            <path
              d={band(x, VES_TOP, VES_W, MODULE.head - 12, MODULE.cut)}
              fill="rgba(var(--dawn-rgb), 0.05)"
            />
            {/* ⚠ The top rule STOPS at the cut, or it overshoots into the
                notch and leaves a 2px stub in mid-air. */}
            <line
              x1={x}
              y1={VES_TOP + 1}
              x2={x + VES_W - MODULE.cut}
              y2={VES_TOP + 1}
              stroke="var(--pda-hair2)"
              strokeWidth="2"
            />

            {/* THE CALL-OUT — vessels are ranked left to right and rows top to
                bottom on the same order, so the leaders run parallel and
                cannot cross. */}
            <line
              x1={x + VES_W}
              y1={meniscus}
              x2={LED_X - 10}
              y2={rowY + B_NAME - 6}
              stroke="var(--pda-hair)"
            />

            {/* THE LEDGER ROW. */}
            <text
              x={LED_X}
              y={rowY + B_NAME}
              fontSize={FS.name}
              fontWeight={700}
              letterSpacing=".08em"
              fill="var(--pda-txt)"
            >
              {p.name}
            </text>
            <text
              x={LED_R}
              y={rowY + B_NAME}
              textAnchor="end"
              fontSize={FS.key}
              letterSpacing=".18em"
              fill="var(--pda-ink)"
            >
              {p.nn}
            </text>
            <text
              x={LED_X}
              y={rowY + B_GLOSS}
              fontSize={FS.gloss}
              letterSpacing=".08em"
              fill="var(--pda-txt2)"
            >
              {p.gloss}
            </text>
            <text
              x={LED_X}
              y={rowY + B_EVAL}
              fontSize={FS.chrome}
              letterSpacing=".14em"
              fill="var(--pda-ink)"
            >
              {p.evalMethod}
            </text>
            {p.flagship ? (
              <g>
                <rect
                  x={LED_X}
                  y={rowY + B_FLAG - MARK}
                  width={MARK}
                  height={MARK}
                  fill="var(--pda-grn)"
                />
                <text
                  x={LED_X + MARK + MARK_GAP}
                  y={rowY + B_FLAG}
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

/* ── LETTERING SPEC, MARK COUNT and MASS ────────────────────────────────── */

const M: RoundSixMeasures = {
  name: LED_W - COUNT_M + FIT_EPS,
  count: COUNT_M,
  gloss: LED_W + FIT_EPS,
  evalMethod: LED_W + FIT_EPS,
  flagship: LED_W - MARK - MARK_GAP + FIT_EPS,
  glossLines: 1,
};

export const tanksLettering = (record: IslRecord): LetterSpec[] => {
  const specs = patternSpecs(record, M);
  specs.push({
    slot: "manifold.claim",
    text: `${totalOf(patterns(record))} ENCODED · ONE SUPPLY`,
    fs: FS.chrome,
    track: 0.22,
    measure: VES_R - VES_L,
  });
  return specs;
};

export const tanksMarkCount = (_record: IslRecord, key: string): number => markCountOf(key);

/** FILL HEIGHT is the count — one unit of height per encoded Skill, the same
 *  unit on every vessel. */
export const tanksMass = (record: IslRecord, key: string): number => {
  const rows = patterns(record);
  const maxN = Math.max(...rows.map((r) => r.n), 1);
  const p = rows.find((r) => r.key === key);
  return p ? p.n * (FILL_MAX / maxN) : 0;
};
