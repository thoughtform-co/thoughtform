import {
  DeptHead,
  FS,
  L,
  R,
  SUB_VIEWBOX,
  SubstrateHatch,
  TRACK,
  Tap,
  byMass,
  deptSpecs,
  housing,
  shapeSpecs,
  totalSkills,
  type LetterSpec,
} from "./substrateKit";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 1 · STRATA — a pattern is a SEAM, not a card.
 *
 * The brief beside this console says it outright: _"Below grade runs the
 * shared substrate — encoded once for one team, tapped by the next."_ This
 * variant draws that sentence. Five full-width bands stacked under a grade
 * line, each as thick as the Skills it holds; eight department buses running
 * straight down through the stack; a tap wherever a bus crosses a seam it
 * draws on.
 *
 * ⚠ NO LINE CROSSES ANOTHER, which is the whole point. Production joins the
 * two rows with thirty beziers and the reader has to trace one to answer
 * "who draws on Judgment?". Here the buses are parallel verticals and the
 * answer is a row of marks.
 *
 * ⚠ AND THE THICKNESS IS THE HIERARCHY. `h = 50 + (skills/47) × 328` puts
 * PATTERN at 148 units against STAKEHOLDER's 85 — a 1.7× read that no
 * 9px meta line can carry. The band is HATCHED rather than empty so the
 * height is mass rather than a hole: a thicker seam is more substrate, not
 * more air.
 */

export const STRATA_VIEWBOX = SUB_VIEWBOX;

/* The identity gutter, and the ladder field the buses run in. Splitting them
   is what lets the gloss letter at a legible size: a 374-unit gutter holds
   the record's longest gloss (38 chars = 336u at 13) on ONE line, which no
   148-wide module could ever do. */
const GUT = { x: L, w: 374 } as const;
const GUT_PAD = 14;
const GUT_MEASURE = GUT.w - GUT_PAD * 2;
const LAD_X = 420;
const LAD_W = R - LAD_X;
const COLS = 8;
const COL_PITCH = LAD_W / COLS;
const col = (i: number) => LAD_X + COL_PITCH / 2 + i * COL_PITCH;

const HEAD_Y = 24;
const GRADE_Y = 94;
const SEAM_TOP = 110;
const SEAM_GAP = 12;
/** `5 × BASE + SPAN` is the exact span from `SEAM_TOP` to the crop's floor
 *  less the four gaps — so the stack lands on the margin by construction. */
const SEAM_BASE = 50;
const SEAM_SPAN = 328;

const seamH = (skills: number, total: number) => SEAM_BASE + (skills / total) * SEAM_SPAN;

function layout(record: IslRecord) {
  const shapes = byMass(record.shapes);
  const total = totalSkills(record.shapes);
  let y = SEAM_TOP;
  const rows = shapes.map((s) => {
    const h = seamH(s.skills, total);
    const row = { s, y, h };
    y += h + SEAM_GAP;
    return row;
  });
  return { rows, floor: y - SEAM_GAP };
}

export function VariantStrata({ record }: IslVariantProps) {
  const { rows, floor } = layout(record);
  const teams = record.teams;

  return (
    <>
      <SubstrateHatch />

      {/* The departments, over the buses they own. */}
      {teams.map((t, i) => (
        <DeptHead key={t.id} cx={col(i)} y={HEAD_Y} w={52} team={t} />
      ))}
      <text
        x={GUT.x + GUT.w - GUT_PAD}
        y={HEAD_Y + 52}
        textAnchor="end"
        fontSize={FS.chrome}
        letterSpacing=".14em"
        fill="var(--pda-txt3)"
      >
        STREAMS
      </text>

      {/* GRADE. Everything above runs the work; everything below is what the
          work draws on. A rule, not a label — this reading deleted its two
          section titles in 2026-08 and they stay deleted. */}
      <line x1={L} y1={GRADE_Y} x2={R} y2={GRADE_Y} stroke="var(--pda-hair2)" strokeWidth="2" />

      {/* The buses, drawn UNDER the seams so a seam's edge cuts them. */}
      {teams.map((t, i) => (
        <line
          key={`bus-${t.id}`}
          x1={col(i)}
          y1={GRADE_Y}
          x2={col(i)}
          y2={floor}
          stroke="var(--pda-dim)"
          strokeOpacity="0.42"
        />
      ))}

      {rows.map(({ s, y, h }) => (
        <g key={s.key}>
          <path d={housing(L, y, R - L, h, 12)} fill="var(--pda-void)" />
          <path d={housing(L, y, R - L, h, 12)} fill="url(#isl-hatch)" />
          <path d={housing(L, y, R - L, h, 12)} fill="none" stroke="var(--pda-hair2)" />
          {/* The seam's own head rule — R4's 2px top edge, so a band reads as
              a cut face rather than as a filled rectangle. */}
          <line
            x1={L}
            y1={y + 1}
            x2={R - 12}
            y2={y + 1}
            stroke="var(--pda-amb)"
            strokeWidth="2"
            strokeOpacity="0.55"
          />

          <text
            x={GUT.x + GUT_PAD}
            y={y + 28}
            fontSize={FS.name}
            fontWeight={700}
            letterSpacing=".08em"
            fill="var(--pda-txt)"
          >
            {s.name}
          </text>
          <text
            x={GUT.x + GUT_PAD}
            y={y + 50}
            fontSize={FS.gloss}
            letterSpacing=".08em"
            fill="var(--pda-txt2)"
          >
            {s.gloss}
          </text>
          <text
            x={GUT.x + GUT_PAD}
            y={y + 72}
            fontSize={FS.chrome}
            letterSpacing=".14em"
            fill="var(--pda-ink)"
          >
            {`${s.skills} SKILLS`}
          </text>
          <text
            x={GUT.x + GUT.w - GUT_PAD}
            y={y + 72}
            textAnchor="end"
            fontSize={FS.chrome}
            letterSpacing=".14em"
            fill="var(--pda-grn-ink)"
          >
            {`CUT BY ${s.trenchedBy}`}
          </text>

          {teams.map((t, i) => (
            <Tap
              key={`${s.key}-${t.id}`}
              cx={col(i)}
              cy={y + h / 2}
              on={t.taps.includes(s.key)}
              cut={t.trenched === s.key}
            />
          ))}
        </g>
      ))}
    </>
  );
}

export function strataLettering(record: IslRecord): LetterSpec[] {
  const { rows } = layout(record);
  return [
    ...deptSpecs(record.teams, 52),
    { slot: "streams", text: "STREAMS", fs: FS.chrome, track: TRACK.chrome, measure: GUT_MEASURE },
    ...rows.flatMap(({ s }) =>
      shapeSpecs(s, { name: GUT_MEASURE, gloss: GUT_MEASURE, meta: GUT_MEASURE / 2 - 8 })
    ),
  ];
}
