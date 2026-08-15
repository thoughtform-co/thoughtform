import { ribbonPaths } from "@/components/landing/home-v2/services/casefile/map/pda/ribbon";

import type { SubstrateSkillPattern } from "./sampleSkills";
import { FS, type LetterSpec } from "./substrateKit";
import { wrapLines } from "@/components/landing/home-v2/services/casefile/map/pda/pdaGlyphs";

import {
  Field,
  type RoundSixMeasures,
  charsFor,
  markCountOf,
  patternSpecs,
  patterns,
  ranked,
  totalOf,
} from "./roundSix";
import type { IslRecord } from "./variants";

/**
 * THE VESSEL RIG — one composition, three silhouettes.
 *
 * Round seven's `tanks` established the register (the substrate is the
 * machine's SUPPLY SIDE, not a chart about it) and the owner kept the idea
 * with two notes:
 *
 *  1. **Make it as visual as the FIELD CARDS.** Direction 6's whole argument
 *     was that each pattern renders its own test — sine baselines for Voice, a
 *     threshold for Judgment, a lattice of present and absent cases for
 *     Validation, reader nodes for Stakeholder, a repeating tiling for Pattern
 *     — and `tanks` had shrunk that to a faint texture inside a small fill box.
 *     Here the field is the CONTENTS: it fills the vessel, clipped to the
 *     vessel's own outline, at the weight the field cards gave it.
 *  2. ⚠ **THE SILHOUETTE MAY NOT BE THE WORK'S.** _"Skills are built on
 *     workflows, but they're different — that's why I can't have them be the
 *     same type of shape, like the square ones."_ A chamfered rectangle on
 *     this surface is a CARTRIDGE: reading 01 is twenty of them and reading 02
 *     seats one at its centre. Any substrate drawn in that outline claims to
 *     be a workstream, which is the same class of error that got round four
 *     rejected — a silhouette here is a proper noun.
 *
 * ⚠ **THE VESSEL IS FULL, AND ITS HEIGHT IS THE COUNT.** `tanks` drew five
 * equal vessels at different fill levels, which reads as capacity — a quantity
 * this record does not publish (ADR-070 U21 named it and let it stand as a
 * shared gauge). Sizing the vessel itself removes the implication entirely AND
 * gives the field the whole body to paint in, which is what note 1 asked for.
 * One store, wholly full, five different sizes.
 *
 * ⚠ **NO TEXT INSIDE A TRANSLATED GROUP.** Each vessel is drawn in its own
 * local space so its silhouette can serve as both outline and clip; `getBBox`
 * reports in that local space, so a label there would report its position
 * un-translated and the capture's clip gate would measure the wrong box (the
 * `facet` lesson). Every string on this rig is absolute, in the ledger.
 */

/* ── The block ──────────────────────────────────────────────────────────── */

/**
 * ⚠ THE VESSEL'S WIDTH IS BOUGHT FROM THE LEDGER, AND THAT IS THE WHOLE
 * TRADE. The first cut gave the stores 76 units across and the ledger 366 —
 * enough for the definition on ONE line, and far too little for a pattern's
 * field to show its character, which is the one thing note 1 asked for. A
 * field card is ~120 wide for a reason. Taking the ledger down to 260 wraps
 * every definition onto a second line and buys 20 units per store; the field
 * is the subject here and a wrapped sentence costs the reading nothing.
 */
const VES_L = 26;
const VES_R = 606;
const VES_PITCH = (VES_R - VES_L) / 5;
export const VES_W = 96;
const vesX = (i: number) => VES_L + VES_PITCH * i + (VES_PITCH - VES_W) / 2;

const FLOOR = 616;
/** The tallest vessel; every other height is this divided by the heaviest
 *  pattern's count and multiplied by its own. */
const H_MAX = 440;

const MANIFOLD_Y = 652;

/* ── The ledger ─────────────────────────────────────────────────────────── */

const LED_X = 646;
const LED_R = 906;
const LED_W = LED_R - LED_X;
const ROW_Y0 = 108;
const ROW_PITCH = 120;

const B_NAME = 22;
const B_GLOSS = 46;
const GLOSS_STEP = 18;
const B_EVAL = 88;
const B_FLAG = 108;
const COUNT_M = 46;
const MARK = 8;
const MARK_GAP = 8;
const FIT_EPS = 0.5;

const CLAIM = (total: number) => `${total} ENCODED · ONE SUPPLY`;

/* ── The silhouettes ────────────────────────────────────────────────────── */

/**
 * Each returns a closed path in the vessel's OWN space — origin at its
 * top-left, `w` across, `h` down. ⚠ Straight edges only (this brand draws no
 * round shapes but its brand marks) and ⚠ not one of them is a rectangle.
 */
export type VesselShape = "flask" | "cell" | "vat";

const NECK_W = 0.36;
const NECK_H = 22;
const SHOULDER = 20;
const HEX_T = 0.2;
const VAT_T = 0.17;

export function vesselPath(shape: VesselShape, w: number, h: number): string {
  if (shape === "flask") {
    /* A necked store: the reading is what a reservoir looks like when you
       have to get material INTO it. */
    const nw = w * NECK_W;
    const l = (w - nw) / 2;
    const r = (w + nw) / 2;
    const s = NECK_H + SHOULDER;
    return `M${l},0 H${r} V${NECK_H} L${w},${s} V${h} H0 V${s} L${l},${NECK_H} Z`;
  }
  if (shape === "cell") {
    /* A hexagonal cell — widest at its waist, flat top and floor so it stands
       on the manifold. Nothing on this surface is drawn this way. */
    const t = w * HEX_T;
    return `M${t},0 H${w - t} L${w},${h / 2} L${w - t},${h} H${t} L0,${h / 2} Z`;
  }
  /* A tapered vat, narrower at the mouth. */
  const t = w * VAT_T;
  return `M${t},0 H${w - t} L${w},${h} H0 Z`;
}

/* ── The rig ────────────────────────────────────────────────────────────── */

export function VesselRig({ record, shape }: { record: IslRecord; shape: VesselShape }) {
  const rows = ranked(patterns(record));
  const total = totalOf(rows);
  const maxN = Math.max(...rows.map((r) => r.n), 1);
  const unit = H_MAX / maxN;

  return (
    <>
      {/* THE MANIFOLD — reading 02's own ribbon grammar, so the supply is made
          of the same wiring as the configuration board. */}
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
        {CLAIM(total)}
      </text>

      {rows.map((p, i) => {
        const x = vesX(i);
        const h = p.n * unit;
        const top = FLOOR - h;
        const d = vesselPath(shape, VES_W, h);
        const cid = `r8-ves-${shape}-${p.key}`;
        const rowY = ROW_Y0 + i * ROW_PITCH;

        return (
          <g key={p.key}>
            {/* THE RISER — every store stands ON the manifold. */}
            {ribbonPaths(
              [
                [x + VES_W / 2, FLOOR],
                [x + VES_W / 2, MANIFOLD_Y],
              ],
              4,
              4
            ).map((rd, k) => (
              <path key={k} d={rd} fill="none" stroke="var(--pda-amb)" strokeOpacity={0.42} />
            ))}

            {/* THE VESSEL — local space, so one path is outline, ground and
                clip. ⚠ Nothing lettered in here. */}
            <g transform={`translate(${x},${top})`}>
              <path d={d} fill="var(--pda-void)" />
              <path d={d} fill="rgba(var(--dawn-rgb), 0.05)" />
            </g>

            {/* THE CONTENTS — the pattern's own test, taking the shape of what
                holds it. This is the field cards' weight, not a texture. */}
            <Field
              form={p.key as SubstrateSkillPattern}
              x={x}
              y={top}
              w={VES_W}
              h={h}
              seed={11 + i * 11}
              p={10}
              opacity={0.9}
              clip={d}
            />

            {/* THE GRADUATION — one mark per encoded Skill at a pitch shared by
                all five, clipped to the body so it follows the wall. */}
            <g transform={`translate(${x},${top})`}>
              <defs>
                <clipPath id={cid}>
                  <path d={d} />
                </clipPath>
              </defs>
              <g clipPath={`url(#${cid})`}>
                {p.ordered.map((skill, k) => {
                  const gy = h - (k + 0.5) * unit;
                  const first = k === 0;
                  return (
                    <line
                      key={skill.id}
                      x1={0}
                      y1={gy}
                      x2={first ? 26 : 15}
                      y2={gy}
                      stroke={first ? "var(--pda-grn)" : "var(--pda-amb)"}
                      strokeOpacity={first ? 0.95 : 0.55}
                    />
                  );
                })}
              </g>
              <path d={d} fill="none" stroke="var(--pda-hair2)" />
            </g>

            {/* THE CALL-OUT — vessels rank left to right and rows top to
                bottom on the same order, so leaders cannot cross. */}
            <line
              x1={x + VES_W}
              y1={top + 10}
              x2={LED_X - 10}
              y2={rowY + B_NAME - 6}
              stroke="var(--pda-hair)"
            />

            {/* THE LEDGER ROW — absolute, never inside a translate. */}
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
            {wrapLines(p.gloss, charsFor(LED_W, FS.gloss, 0.08), 2).map((line, k) => (
              <text
                key={line}
                x={LED_X}
                y={rowY + B_GLOSS + k * GLOSS_STEP}
                fontSize={FS.gloss}
                letterSpacing=".08em"
                fill="var(--pda-txt2)"
              >
                {line}
              </text>
            ))}
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

/* ── LETTERING, MARK COUNT and MASS — shared by all three silhouettes ───── */

const M: RoundSixMeasures = {
  name: LED_W - COUNT_M + FIT_EPS,
  count: COUNT_M,
  gloss: LED_W + FIT_EPS,
  evalMethod: LED_W + FIT_EPS,
  flagship: LED_W - MARK - MARK_GAP + FIT_EPS,
  glossLines: 2,
};

export const vesselLettering = (record: IslRecord): LetterSpec[] => {
  const specs = patternSpecs(record, M);
  specs.push({
    slot: "manifold.claim",
    text: CLAIM(totalOf(patterns(record))),
    fs: FS.chrome,
    track: 0.22,
    measure: VES_R - VES_L,
  });
  return specs;
};

export const vesselMarkCount = (_record: IslRecord, key: string): number => markCountOf(key);

/** VESSEL HEIGHT is the count — one unit of height per encoded Skill, the
 *  same unit on every store, and the store is full. */
export const vesselMass = (record: IslRecord, key: string): number => {
  const rows = patterns(record);
  const maxN = Math.max(...rows.map((r) => r.n), 1);
  return (rows.find((r) => r.key === key)?.n ?? 0) * (H_MAX / maxN);
};
