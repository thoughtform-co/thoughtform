import { wrapLines } from "@/components/landing/home-v2/services/casefile/map/pda/pdaGlyphs";

import { FS, type LetterSpec } from "./substrateKit";
import {
  type RoundSixMeasures,
  type RoundSixPattern,
  charsFor,
  markCountOf,
  patternSpecs,
  patterns,
  totalOf,
} from "./roundSix";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 21 · WHEEL — the owner's own reference, ported honestly.
 *
 * Aether's `/claude-adoption` substrate donut is the picture this whole
 * reading has been trying to be: five wedges sized by Skill count, each
 * carrying a name, a count and a ONE-LINE DEFINITION, around a centre that
 * letters the estate's total. Its claim is PROPORTION OF ONE WHOLE — not five
 * things collected, one thing divided five ways — and that is the claim
 * reading 03 exists to make.
 *
 * ⚠ WHAT IS ADAPTED, AND WHY EACH IS FORCED:
 *
 *   the rim chips   Aether names all 47 Skills on leader lines around the
 *                   rim. At this panel's meet a chip letters ~7.8px and 47 of
 *                   them need a circumference this crop does not have — and
 *                   the chips carry an OWNER field, which the map's envelope
 *                   has refused since ADR-056. So the roster becomes TICK
 *                   MASS: one tick per encoded Skill inside its own wedge,
 *                   countable, nobody named. The one exemplar per pattern
 *                   letters in the block instead
 *   the label ring  chips sit at their own angle in the reference, which puts
 *                   text on five different baselines. Labels stay HORIZONTAL
 *                   here — the isometric city died on skewed labels — so the
 *                   five blocks take fixed anchors in the corners the circle
 *                   leaves, joined to their wedge by a leader
 *   the axis toggle BY SUBSTRATE / BY TEAM is the reference's second cut, and
 *                   a team axis cannot exist on this surface: departments are
 *                   not lettered on the map at all
 *
 * ⚠ THE ANCHORS ARE ASSIGNED BY MIDANGLE, NOT HARDCODED. Each wedge takes the
 * nearest unused anchor, so a record edit that changes a Skill count
 * re-assigns the blocks instead of silently crossing every leader.
 */

export const WHEEL_VIEWBOX = "0 0 932 762";

/* ── The ring ───────────────────────────────────────────────────────────── */

const CX = 466;
const CY = 330;
const R_IN = 96;
const R_OUT = 186;
const TICK_R0 = 190;
const TICK_R1 = 208;
const FLAG_R1 = 220;
const LEAD_R = 212;
/** One gap per wedge, so five wedges are five objects rather than a striped
 *  disc. The reference's own value. */
const GAP_DEG = 4;
const START_DEG = -90;

const rad = (deg: number) => (deg * Math.PI) / 180;
const px = (r: number, deg: number) => CX + r * Math.cos(rad(deg));
const py = (r: number, deg: number) => CY + r * Math.sin(rad(deg));

/** An annular sector. */
function sector(r0: number, r1: number, a0: number, a1: number) {
  const large = a1 - a0 > 180 ? 1 : 0;
  return [
    `M${px(r1, a0)},${py(r1, a0)}`,
    `A${r1},${r1} 0 ${large} 1 ${px(r1, a1)},${py(r1, a1)}`,
    `L${px(r0, a1)},${py(r0, a1)}`,
    `A${r0},${r0} 0 ${large} 0 ${px(r0, a0)},${py(r0, a0)}`,
    "Z",
  ].join(" ");
}

export interface WheelWedge {
  key: string;
  a0: number;
  a1: number;
  mid: number;
}

/** The wedges. Pure — the mass guard reads the same angles the drawing paints. */
export function wheelWedges(rows: readonly RoundSixPattern[]): WheelWedge[] {
  const total = totalOf(rows);
  if (total <= 0) return [];
  const usable = 360 - GAP_DEG * rows.length;
  const out: WheelWedge[] = [];
  let a = START_DEG;
  for (const p of rows) {
    const span = (usable * p.n) / total;
    out.push({ key: p.key, a0: a, a1: a + span, mid: a + span / 2 });
    a += span + GAP_DEG;
  }
  return out;
}

/* ── The label blocks ───────────────────────────────────────────────────── */

/** ⚠ 220, AND IT IS SET BY THE EVAL METHOD. `KNOWN-FAILURE FIXTURES` measures
 *  195.4u at fs 12 / .14; the corner a 208-radius ring leaves at mid-height is
 *  246 units wide, so 220 clears the eval line by 24 and the ring by 26. */
const BLOCK_M = 220;

interface Anchor {
  x: number;
  y: number;
  /** Where the leader meets the block. */
  ax: number;
  ay: number;
  /** The anchor's own bearing from the ring's centre, for assignment. */
  deg: number;
}

const ANCHORS: readonly Anchor[] = [
  { x: 26, y: 60, ax: 246, ay: 106, deg: -135 },
  { x: 686, y: 60, ax: 686, ay: 106, deg: -45 },
  { x: 26, y: 258, ax: 246, ay: 304, deg: 180 },
  { x: 686, y: 258, ax: 686, ay: 304, deg: 0 },
  { x: 356, y: 596, ax: 466, ay: 596, deg: 90 },
];

const arc = (a: number, b: number) => {
  const d = Math.abs(((a - b) % 360) + 360) % 360;
  return d > 180 ? 360 - d : d;
};

/** Nearest unused anchor per wedge. Pure and deterministic. */
export function wheelAnchors(wedges: readonly WheelWedge[]): Map<string, Anchor> {
  const taken = new Set<number>();
  const out = new Map<string, Anchor>();
  for (const w of wedges) {
    let best = -1;
    let bestD = Infinity;
    for (const [i, a] of ANCHORS.entries()) {
      if (taken.has(i)) continue;
      const d = arc(w.mid, a.deg);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    if (best >= 0) {
      taken.add(best);
      out.set(w.key, ANCHORS[best]);
    }
  }
  return out;
}

const B_NAME = 22;
const B_GLOSS = 44;
const B_EVAL = 84;

export function VariantWheel({ record }: IslVariantProps) {
  const rows = patterns(record);
  const wedges = wheelWedges(rows);
  const anchors = wheelAnchors(wedges);
  const byKey = new Map(rows.map((p) => [p.key, p]));
  const total = totalOf(rows);

  return (
    <>
      {/* THE CENTRE — the estate, once. */}
      <circle cx={CX} cy={CY} r={R_IN} fill="var(--pda-void)" />
      <circle cx={CX} cy={CY} r={R_IN} fill="none" stroke="var(--pda-hair)" />
      <text
        x={CX}
        y={CY - 2}
        textAnchor="middle"
        fontSize={FS.hero}
        fontWeight={700}
        letterSpacing=".08em"
        fill="var(--pda-txt)"
      >
        {String(total)}
      </text>
      <text
        x={CX}
        y={CY + 24}
        textAnchor="middle"
        fontSize={FS.chrome}
        letterSpacing=".22em"
        fill="var(--pda-ink)"
      >
        SUBSTRATE
      </text>

      {wedges.map((w, i) => {
        const p = byKey.get(w.key);
        const anchor = anchors.get(w.key);
        if (!p || !anchor) return null;
        const glossLines = wrapLines(p.gloss, charsFor(BLOCK_M, FS.gloss, 0.08), 2);

        return (
          <g key={w.key}>
            {/* THE WEDGE — angle is the count. */}
            {/* ⚠ THE ALTERNATION IS WHAT MAKES FIVE WEDGES FIVE. At a flat
                5 % wash with a 4° gap the ring reads as one grey annulus with
                nicks in it — the gap is 6 units of arc at this meet, which is
                under two device pixels. Two steps of wash and a lit outer arc
                per wedge separate them without introducing a per-wedge colour,
                which this surface has no legend to explain. */}
            <path
              d={sector(R_IN + 8, R_OUT, w.a0, w.a1)}
              fill="rgba(var(--dawn-rgb), 0.09)"
              fillOpacity={i % 2 === 0 ? 1 : 0.4}
              stroke="var(--pda-hair2)"
            />
            <path
              d={`M${px(R_OUT, w.a0)},${py(R_OUT, w.a0)} A${R_OUT},${R_OUT} 0 ${
                w.a1 - w.a0 > 180 ? 1 : 0
              } 1 ${px(R_OUT, w.a1)},${py(R_OUT, w.a1)}`}
              fill="none"
              stroke="var(--pda-amb)"
              strokeOpacity={0.6}
              strokeWidth="2"
            />

            {/* THE RIM — one tick per encoded Skill, distributed inside its
                own wedge. The flagship's tick runs longer and takes green;
                its NAME letters in the block, at full ink. */}
            {p.ordered.map((skill, k) => {
              const t = p.n === 1 ? 0.5 : (k + 0.5) / p.n;
              const deg = w.a0 + t * (w.a1 - w.a0);
              const first = k === 0;
              const r1 = first ? FLAG_R1 : TICK_R1;
              return (
                <line
                  key={skill.id}
                  x1={px(TICK_R0, deg)}
                  y1={py(TICK_R0, deg)}
                  x2={px(r1, deg)}
                  y2={py(r1, deg)}
                  stroke={first ? "var(--pda-grn)" : "var(--pda-amb)"}
                  strokeOpacity={first ? 0.95 : 0.5}
                />
              );
            })}

            {/* THE LEADER — what makes a corner block belong to a wedge. */}
            <line
              x1={px(LEAD_R, w.mid)}
              y1={py(LEAD_R, w.mid)}
              x2={anchor.ax}
              y2={anchor.ay}
              stroke="var(--pda-hair)"
            />

            {/* THE BLOCK — name, definition, method, exemplar. */}
            <text
              x={anchor.x}
              y={anchor.y + B_NAME}
              fontSize={FS.name}
              fontWeight={700}
              letterSpacing=".08em"
              fill="var(--pda-txt)"
            >
              {p.name}
            </text>
            <text
              x={anchor.x + BLOCK_M}
              y={anchor.y + B_NAME}
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
                x={anchor.x}
                y={anchor.y + B_GLOSS + k * 17}
                fontSize={FS.gloss}
                letterSpacing=".08em"
                fill="var(--pda-txt2)"
              >
                {line}
              </text>
            ))}
            <text
              x={anchor.x}
              y={anchor.y + B_EVAL}
              fontSize={FS.chrome}
              letterSpacing=".14em"
              fill="var(--pda-ink)"
            >
              {p.evalMethod}
            </text>
            {p.flagship ? (
              <g>
                <rect
                  x={anchor.x}
                  y={anchor.y + B_EVAL + 12}
                  width={8}
                  height={8}
                  fill="var(--pda-grn)"
                />
                <text
                  x={anchor.x + 16}
                  y={anchor.y + B_EVAL + 20}
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
  name: BLOCK_M - 40,
  count: 40,
  gloss: BLOCK_M,
  evalMethod: BLOCK_M,
  flagship: BLOCK_M - 16,
  glossLines: 2,
};

export const wheelLettering = (record: IslRecord): LetterSpec[] => {
  const specs = patternSpecs(record, M);
  const total = totalOf(patterns(record));
  specs.push(
    { slot: "core.total", text: String(total), fs: FS.hero, track: 0.08, measure: R_IN * 2 - 24 },
    { slot: "core.label", text: "SUBSTRATE", fs: FS.chrome, track: 0.22, measure: R_IN * 2 - 24 }
  );
  return specs;
};

export const wheelMarkCount = (_record: IslRecord, key: string): number => markCountOf(key);

/** ANGLE is the count. */
export const wheelMass = (record: IslRecord, key: string): number => {
  const w = wheelWedges(patterns(record)).find((x) => x.key === key);
  return w ? w.a1 - w.a0 : 0;
};
