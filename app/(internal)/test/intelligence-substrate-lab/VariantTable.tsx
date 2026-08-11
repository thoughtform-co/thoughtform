import {
  DeptHead,
  FS,
  L,
  R,
  SUB_VIEWBOX,
  SubstrateHatch,
  TRACK,
  Tap,
  deptSpecs,
  shapeSpecs,
  totalSkills,
  type LetterSpec,
} from "./substrateKit";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 2 · THE CROSSING TABLE — stop drawing the relation and tabulate it.
 *
 * Five rows, eight columns, one mark per intersection. A filled cell is a
 * department drawing on a pattern; a cut cell is the one that paid to encode
 * it. Thirty beziers become thirty marks on a grid, and the two questions the
 * reading exists to answer — "what does Legal draw on?" and "who draws on
 * Judgment?" — become a column read and a row read.
 *
 * ⚠ MAGNITUDE IS STILL STRUCTURAL, in the row header's mass bar. A table
 * that only tabulated would have thrown away the thing production also threw
 * away: that Pattern holds 14 Skills and Stakeholder 5.
 *
 * ⚠ THE ORDER IS THE RECORD'S, deliberately. `strata` and `tree` rank by
 * mass because ranking IS their argument; this variant's argument is the
 * relation, and a table that also re-ranked would be claiming both at once.
 */

export const TABLE_VIEWBOX = SUB_VIEWBOX;

const HEAD_Y = 26;
const GRID_TOP = 96;
const ROW_GAP = 8;
const HDR = { x: L, w: 374 } as const;
const HDR_PAD = 14;
const HDR_MEASURE = HDR.w - HDR_PAD * 2;
const LAD_X = 420;
const LAD_W = R - LAD_X;
const COLS = 8;
const COL_PITCH = LAD_W / COLS;
const col = (i: number) => LAD_X + COL_PITCH / 2 + i * COL_PITCH;

/** The mass bar's full length at the heaviest pattern on record. */
const BAR_MAX = 190;
const BAR_H = 7;

function layout(record: IslRecord) {
  const rows = record.shapes.length;
  const h = (762 - 26 - GRID_TOP - ROW_GAP * (rows - 1)) / rows;
  return record.shapes.map((s, i) => ({ s, y: GRID_TOP + i * (h + ROW_GAP), h }));
}

export function VariantTable({ record }: IslVariantProps) {
  const grid = layout(record);
  const teams = record.teams;
  const total = totalSkills(record.shapes);
  const heaviest = Math.max(...record.shapes.map((s) => s.skills));

  return (
    <>
      <SubstrateHatch />

      {teams.map((t, i) => (
        <DeptHead key={t.id} cx={col(i)} y={HEAD_Y} w={52} team={t} />
      ))}
      <text
        x={HDR.x + HDR.w - HDR_PAD}
        y={HEAD_Y + 52}
        textAnchor="end"
        fontSize={FS.chrome}
        letterSpacing=".14em"
        fill="var(--pda-txt3)"
      >
        STREAMS
      </text>
      {/* The one total the reading is about, in the header's own gutter. */}
      <text
        x={HDR.x + HDR_PAD}
        y={HEAD_Y + 30}
        fontSize={FS.hero}
        fontWeight={700}
        letterSpacing=".02em"
        fill="var(--pda-txt)"
      >
        {`${total} SKILLS`}
      </text>

      <line x1={L} y1={GRID_TOP - 12} x2={R} y2={GRID_TOP - 12} stroke="var(--pda-hair2)" />

      {/* Column rules, so a reader can run a finger down one department. */}
      {teams.map((t, i) => (
        <line
          key={`rule-${t.id}`}
          x1={col(i)}
          y1={GRID_TOP - 12}
          x2={col(i)}
          y2={GRID_TOP + (grid.at(-1)?.h ?? 0) + (grid.at(-1)?.y ?? 0) - GRID_TOP}
          stroke="var(--pda-dim)"
          strokeOpacity="0.3"
        />
      ))}

      {grid.map(({ s, y, h }) => (
        <g key={s.key}>
          <line x1={L} y1={y + h} x2={R} y2={y + h} stroke="var(--pda-hair)" />

          <text
            x={HDR.x + HDR_PAD}
            y={y + 30}
            fontSize={FS.name}
            fontWeight={700}
            letterSpacing=".08em"
            fill="var(--pda-txt)"
          >
            {s.name}
          </text>
          <text
            x={HDR.x + HDR.w - HDR_PAD}
            y={y + 30}
            textAnchor="end"
            fontSize={FS.chrome}
            letterSpacing=".14em"
            fill="var(--pda-grn-ink)"
          >
            {`CUT BY ${s.trenchedBy}`}
          </text>
          <text
            x={HDR.x + HDR_PAD}
            y={y + 52}
            fontSize={FS.gloss}
            letterSpacing=".08em"
            fill="var(--pda-txt2)"
          >
            {s.gloss}
          </text>

          {/* THE MASS BAR — the one thing a pure table would have lost. */}
          <rect
            x={HDR.x + HDR_PAD}
            y={y + 64}
            width={BAR_MAX}
            height={BAR_H}
            fill="none"
            stroke="var(--pda-hair)"
          />
          <rect
            x={HDR.x + HDR_PAD}
            y={y + 64}
            width={(s.skills / heaviest) * BAR_MAX}
            height={BAR_H}
            fill="url(#isl-hatch)"
            stroke="var(--pda-amb)"
            strokeOpacity="0.7"
          />
          <text
            x={HDR.x + HDR_PAD + BAR_MAX + 12}
            y={y + 71}
            fontSize={FS.chrome}
            letterSpacing=".14em"
            fill="var(--pda-ink)"
          >
            {`${s.skills} SKILLS`}
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

export function tableLettering(record: IslRecord): LetterSpec[] {
  return [
    ...deptSpecs(record.teams, 52),
    { slot: "streams", text: "STREAMS", fs: FS.chrome, track: TRACK.chrome, measure: HDR_MEASURE },
    {
      slot: "total",
      text: `${totalSkills(record.shapes)} SKILLS`,
      fs: FS.hero,
      track: 0.02,
      measure: HDR_MEASURE,
    },
    ...record.shapes.flatMap((s) =>
      shapeSpecs(s, {
        /* The name shares its baseline with CUT BY, so they split the header
           between them; the gloss and the bar's label each own a line. */
        name: HDR_MEASURE - 100,
        gloss: HDR_MEASURE,
        meta: HDR_MEASURE - BAR_MAX - 12,
      })
    ),
  ];
}
