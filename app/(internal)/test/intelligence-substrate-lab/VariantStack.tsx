import type { SubstrateSkillPattern } from "./sampleSkills";
import { FS, MODULE, band, housing, type LetterSpec } from "./substrateKit";
import {
  Field,
  type RoundSixMeasures,
  type RoundSixPattern,
  markCountOf,
  patternSpecs,
  patterns,
  ranked,
  totalOf,
} from "./roundSix";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 29 · STACK — one component, five layers, in section.
 *
 * ⚠ THIS REPLACES THE DIAMOND LATTICE, AND THE REASON IS ARITHMETIC. The
 * bio-monitor reference wanted five diamonds sized by area with the NAME
 * inside and the detail on an attached tab. The diamonds themselves fit —
 * `STAKEHOLDER` inside the smallest needs a half-diagonal of 87.8, which puts
 * a touching row of the three heaviest at 801 units against 880 available. The
 * TAB is what cannot be placed: a lattice means edge-touching, and two
 * touching diamonds leave a clear gap of **zero** at their waist, so every
 * side tab overlaps a neighbour. Moving the tabs to a column makes it a third
 * "marks plus ledger", and moving them to a block at the foot makes it a card
 * grid — which round seven exists to get away from. The direction cannot
 * deliver the one thing that distinguished it.
 *
 * So: the substrate in SECTION. One housing, five layers, thickness
 * proportional to the encoded Skills, heaviest at the bottom because a stack
 * reads as bedrock. Every layer carries its own text at FULL PANEL WIDTH,
 * which is what lets this one direction of the three carry no ledger at all —
 * ⚠ the eval method's 195.4 units are the tyrant of every five-across layout
 * on this surface, and a stack simply never asks a column to be narrow.
 *
 * ⚠ THE GRADUATION'S PITCH IS SHARED. One tick per encoded Skill down each
 * layer's inner edge at exactly `unit` — the same unit that sets the layer's
 * thickness — so the marks are the thickness, counted. A per-layer pitch would
 * make five differently-scaled rulers and the thicknesses would stop being
 * comparable by eye.
 */

export const STACK_VIEWBOX = "0 0 932 762";

/* ── The component ──────────────────────────────────────────────────────── */

const HOUSE_X = 26;
const HOUSE_Y = 70;
const HOUSE_W = 880;
const HOUSE_H = 630;
const IN_L = HOUSE_X + MODULE.pad;
const IN_R = HOUSE_X + HOUSE_W - MODULE.pad;

/** The layered interior — everything under the head band. */
const DECK_TOP = HOUSE_Y + MODULE.head;
const DECK_H = HOUSE_Y + HOUSE_H - DECK_TOP;

/* ── The graduation and the two text baselines ──────────────────────────── */

const TICK_X = IN_L;
const TICK_LEN = 16;
const FLAG_LEN = 28;

const NAME_X = IN_L + 46;
const NAME_M = 208;
const COUNT_X = NAME_X + NAME_M + 12;
const COUNT_M = 46;
const RIGHT_X = 350;
const RIGHT_M = IN_R - RIGHT_X;
const EVAL_M = RIGHT_X - NAME_X - 20;

const B1 = 26;
const B2 = 46;
/** The block's ink, relative to the first baseline: the name's ascent above
 *  it, the eval line's descent below. */
const INK_TOP = B1 - 20;
const INK_BOT = B2 + 5;
const INK_H = INK_BOT - INK_TOP;

/**
 * ⚠ THE TEXT IS CENTRED IN ITS LAYER, NOT PERCHED AT THE TOP. Top-anchored,
 * the heaviest layer — the one whose thickness is the whole point — carries
 * 130 units of empty field under four lines of type, which is ADR-070 U14's
 * hole in a new place: a taller layer becomes a layer with a void beneath it,
 * and the drawing stops looking like it meant the thickness.
 */
const inkOffset = (h: number) => Math.max(0, (h - INK_H) / 2) - INK_TOP;
const MARK = 8;
const MARK_GAP = 8;
const FIT_EPS = 0.5;

export interface StackLayer {
  key: string;
  y: number;
  h: number;
}

/** The layers, thinnest at the top. Pure — the drawing and the mass guard read
 *  the same section. */
export function stackLayers(rows: readonly RoundSixPattern[]): StackLayer[] {
  const total = totalOf(rows);
  if (total <= 0) return [];
  const order = [...ranked(rows)].reverse();
  const out: StackLayer[] = [];
  let y = DECK_TOP;
  for (const [i, p] of order.entries()) {
    /* The last layer takes the remainder, so rounding never leaves a seam of
       bare housing at the floor. */
    const h = i === order.length - 1 ? DECK_TOP + DECK_H - y : (DECK_H * p.n) / total;
    out.push({ key: p.key, y, h });
    y += h;
  }
  return out;
}

export function VariantStack({ record }: IslVariantProps) {
  const rows = patterns(record);
  const layers = stackLayers(rows);
  const byKey = new Map(rows.map((p) => [p.key, p]));
  const total = totalOf(rows);
  const unit = total > 0 ? DECK_H / total : 0;
  const d = housing(HOUSE_X, HOUSE_Y, HOUSE_W, HOUSE_H, MODULE.cut);
  const clip = "r7-stack-clip";

  return (
    <>
      <defs>
        <clipPath id={clip}>
          <path d={d} />
        </clipPath>
      </defs>

      <path d={d} fill="var(--pda-void)" />

      <g clipPath={`url(#${clip})`}>
        {layers.map((l, i) => {
          const p = byKey.get(l.key);
          if (!p) return null;
          const b1 = l.y + inkOffset(l.h) + B1;
          const b2 = l.y + inkOffset(l.h) + B2;
          return (
            <g key={l.key}>
              <rect
                x={HOUSE_X}
                y={l.y}
                width={HOUSE_W}
                height={l.h}
                fill="rgba(var(--dawn-rgb), 0.05)"
                fillOpacity={i % 2 === 0 ? 1 : 0.42}
              />
              <Field
                form={l.key as SubstrateSkillPattern}
                x={HOUSE_X}
                y={l.y}
                w={HOUSE_W}
                h={l.h}
                seed={i + 1}
                opacity={0.3}
              />
              <line
                x1={HOUSE_X}
                y1={l.y}
                x2={HOUSE_X + HOUSE_W}
                y2={l.y}
                stroke="var(--pda-hair2)"
              />

              {/* THE GRADUATION — one tick per encoded Skill, at the stack's
                  one shared unit, so the marks ARE the thickness counted. */}
              {p.ordered.map((skill, k) => {
                const ty = l.y + (k + 0.5) * unit;
                const first = k === 0;
                return (
                  <line
                    key={skill.id}
                    x1={TICK_X}
                    y1={ty}
                    x2={TICK_X + (first ? FLAG_LEN : TICK_LEN)}
                    y2={ty}
                    stroke={first ? "var(--pda-grn)" : "var(--pda-amb)"}
                    strokeOpacity={first ? 0.95 : 0.5}
                  />
                );
              })}

              <text
                x={NAME_X}
                y={b1}
                fontSize={FS.name}
                fontWeight={700}
                letterSpacing=".08em"
                fill="var(--pda-txt)"
              >
                {p.name}
              </text>
              <text
                x={COUNT_X}
                y={b1}
                fontSize={FS.key}
                letterSpacing=".18em"
                fill="var(--pda-ink)"
              >
                {p.nn}
              </text>
              <text
                x={RIGHT_X}
                y={b1}
                fontSize={FS.gloss}
                letterSpacing=".08em"
                fill="var(--pda-txt2)"
              >
                {p.gloss}
              </text>
              <text
                x={NAME_X}
                y={b2}
                fontSize={FS.chrome}
                letterSpacing=".14em"
                fill="var(--pda-ink)"
              >
                {p.evalMethod}
              </text>
              {p.flagship ? (
                <g>
                  <rect
                    x={RIGHT_X}
                    y={b2 - MARK}
                    width={MARK}
                    height={MARK}
                    fill="var(--pda-grn)"
                  />
                  <text
                    x={RIGHT_X + MARK + MARK_GAP}
                    y={b2}
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
      </g>

      {/* THE HOUSING'S OWN CHROME, over the clipped deck. */}
      <path
        d={band(HOUSE_X, HOUSE_Y, HOUSE_W, MODULE.head, MODULE.cut)}
        fill="rgba(var(--dawn-rgb), 0.06)"
      />
      <line
        x1={HOUSE_X}
        y1={HOUSE_Y + 1}
        x2={HOUSE_X + HOUSE_W - MODULE.cut}
        y2={HOUSE_Y + 1}
        stroke="var(--pda-hair2)"
        strokeWidth="2"
      />
      <line
        x1={HOUSE_X}
        y1={DECK_TOP}
        x2={HOUSE_X + HOUSE_W}
        y2={DECK_TOP}
        stroke="var(--pda-hair2)"
      />
      <text
        x={IN_L}
        y={HOUSE_Y + 23}
        fontSize={FS.key}
        fontWeight={700}
        letterSpacing=".18em"
        fill="var(--pda-txt)"
      >
        SUBSTRATE
      </text>
      <text
        x={IN_R}
        y={HOUSE_Y + 23}
        textAnchor="end"
        fontSize={FS.chrome}
        letterSpacing=".22em"
        fill="var(--pda-ink)"
      >
        {`${total} ENCODED · IN SECTION`}
      </text>
      <path d={d} fill="none" stroke="var(--pda-hair2)" />
    </>
  );
}

/* ── LETTERING SPEC, MARK COUNT and MASS ────────────────────────────────── */

const M: RoundSixMeasures = {
  name: NAME_M + FIT_EPS,
  count: COUNT_M,
  gloss: RIGHT_M + FIT_EPS,
  evalMethod: EVAL_M + FIT_EPS,
  flagship: RIGHT_M - MARK - MARK_GAP + FIT_EPS,
  glossLines: 1,
};

export const stackLettering = (record: IslRecord): LetterSpec[] => {
  const specs = patternSpecs(record, M);
  const inner = IN_R - IN_L;
  specs.push(
    { slot: "house.name", text: "SUBSTRATE", fs: FS.key, track: 0.18, measure: inner },
    {
      slot: "house.claim",
      text: `${totalOf(patterns(record))} ENCODED · IN SECTION`,
      fs: FS.chrome,
      track: 0.22,
      measure: inner,
    }
  );
  return specs;
};

export const stackMarkCount = (_record: IslRecord, key: string): number => markCountOf(key);

/** LAYER THICKNESS is the count. */
export const stackMass = (record: IslRecord, key: string): number =>
  stackLayers(patterns(record)).find((l) => l.key === key)?.h ?? 0;
