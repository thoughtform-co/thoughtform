import {
  SAMPLE_PATTERNS,
  SAMPLE_SKILLS,
  SAMPLE_TEAMS,
  SAMPLE_TOTALS,
  skillsIn,
  type SubstrateSkillPattern,
} from "./sampleSkills";
import { FS, L, R, SUB_VIEWBOX, TRACK, type LetterSpec } from "./substrateKit";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 10 · TERMINAL — the substrate as a printed session log.
 *
 * Round three, the opposite pole from `registry`. Two mono columns of
 * printed rows (title · team · owner, cutter carries a green ● CUT tag),
 * pattern names sit on horizontal rules between sections. The reader
 * scans top to bottom the way they would read a compiled index or a
 * system dump.
 *
 * ⚠ **TWO COLUMNS ARE FORCED BY THE VERTICAL BUDGET.** A one-column log
 * of 47 rows at fs 12 needs 15 units of line height for the browser's
 * getBBox reader to see the labels as non-overlapping, plus 5 dividers,
 * plus etch — that is 780 units against a 762-unit crop. The lab's fit
 * meter reports every touching pair as a collision, and a printed roster
 * whose meter reads 133 label-on-label is a printed roster the reader
 * cannot trust to be legible. Splitting to two columns halves the row
 * count per column (28 + 19) and every pair of adjacent bboxes clears.
 *
 * ⚠ **NO OWNER FIELD, BY THE SAME BUDGET.** The 428-unit column has room
 * for `title · team · CUT` at fs 12 without wrapping the longest 30-char
 * title (Cost / Feasibility / Portfolio) — but not for owner beside them
 * without either truncating owners heavily or wrapping titles. Owner is
 * the softest field of the four (title, team, substrate implied by
 * divider, cut) so it goes. The lab's third and fourth variants still
 * carry the owner if the reader wants it.
 *
 * ⚠ **NO CHART, NO COLOUR, NO SHAPE.** This is the coldest register on
 * the surface — the type IS the reading. If it works, that is exactly
 * the "minimalistic" the owner asked for. If it doesn't, it's the
 * honest test of whether type alone can carry the substrate claim.
 */

export const TERMINAL_VIEWBOX = SUB_VIEWBOX;

/* ── Two-column layout ───────────────────────────────────────────────── */
const COL_GUTTER = 24;
const COL_W = (R - L - COL_GUTTER) / 2;
const COL_LEFT_X = L;
const COL_RIGHT_X = L + COL_W + COL_GUTTER;

/* ── Row layout ──────────────────────────────────────────────────────── */
const ROW_H = 15;
const DIV_H = 18;

/* ── Column positions within one column (relative to col left edge) ── */
const TITLE_OFFSET = 0;
const TITLE_MEASURE = 280;
const TEAM_OFFSET = TITLE_MEASURE + 12;
const TEAM_MEASURE = 40;
const CUT_MEASURE = 60;

const CUT_MARK = "● CUT";

/* ── Type ──────────────────────────────────────────────────────────── */
const BODY_FS = FS.chrome;
const BODY_TITLE_TRACK = TRACK.name;
const BODY_TEAM_TRACK = TRACK.chrome;
const CUT_TRACK = TRACK.chrome;
const DIV_FS = FS.chrome;
const DIV_LABEL_MEASURE = 120;
const DIV_COUNT_MEASURE = 90;

/**
 * ⚠ THE COLUMN SPLIT IS AT VALIDATION'S END, so the LEFT column carries
 * VOICE + JUDGMENT + VALIDATION (28 skills, 3 dividers) and the RIGHT
 * carries STAKEHOLDER + PATTERN (19 skills, 2 dividers). The taller
 * column (LEFT at 3 × 18 + 28 × 15 = 474u) sets the etch's y-anchor.
 */
const LEFT_PATTERNS: readonly SubstrateSkillPattern[] = ["voice", "judgment", "validation"];
const RIGHT_PATTERNS: readonly SubstrateSkillPattern[] = ["stakeholder", "pattern"];

interface RowSpec {
  type: "div" | "skill";
  y: number;
  pattern?: SubstrateSkillPattern;
  count?: number;
  skill?: (typeof SAMPLE_SKILLS)[number];
}

function layoutColumn(patterns: readonly SubstrateSkillPattern[]): {
  rows: RowSpec[];
  endY: number;
} {
  const rows: RowSpec[] = [];
  let y = 8;
  for (const pattern of patterns) {
    const skills = skillsIn(pattern);
    rows.push({ type: "div", y, pattern, count: skills.length });
    y += DIV_H;
    for (const skill of skills) {
      rows.push({ type: "skill", y, skill });
      y += ROW_H;
    }
  }
  return { rows, endY: y };
}

const ETCH = `${SAMPLE_TOTALS.total} ENCODED SKILLS · ${SAMPLE_TEAMS.length} TEAMS · ${SAMPLE_PATTERNS.length} PATTERNS`;

function patternName(record: IslRecord, key: SubstrateSkillPattern): string {
  const s = record.shapes.find((x) => x.key === key);
  return s ? s.name : key.toUpperCase();
}

function Column({
  record,
  patterns,
  xOffset,
}: {
  record: IslRecord;
  patterns: readonly SubstrateSkillPattern[];
  xOffset: number;
}) {
  const { rows } = layoutColumn(patterns);
  const colRight = xOffset + COL_W;
  const titleX = xOffset + TITLE_OFFSET;
  const teamX = xOffset + TEAM_OFFSET;

  return (
    <>
      {rows.map((row) => {
        if (row.type === "div" && row.pattern) {
          const name = patternName(record, row.pattern);
          return (
            <g key={`div-${row.pattern}`}>
              {/* The rule between sections, with a gap around the label
                  and the count so nothing overprints. */}
              <line
                x1={xOffset + 115}
                y1={row.y + 9}
                x2={colRight - 95}
                y2={row.y + 9}
                stroke="var(--pda-hair2)"
              />
              <text
                x={titleX}
                y={row.y + 13}
                fontSize={DIV_FS}
                letterSpacing=".14em"
                fill="var(--pda-amb)"
              >
                {name}
              </text>
              <text
                x={colRight}
                y={row.y + 13}
                textAnchor="end"
                fontSize={DIV_FS}
                letterSpacing=".14em"
                fill="var(--pda-amb)"
              >
                {`${String(row.count ?? 0).padStart(2, "0")} SKILLS`}
              </text>
            </g>
          );
        }
        if (row.type === "skill" && row.skill) {
          const s = row.skill;
          const cut = Boolean(s.cut);
          const titleFill = cut ? "var(--pda-grn-ink)" : "var(--pda-txt)";
          const teamFill = cut ? "var(--pda-grn-ink)" : "var(--pda-ink)";
          const base = row.y + 12;
          return (
            <g key={s.id}>
              <text
                x={titleX}
                y={base}
                fontSize={BODY_FS}
                letterSpacing={`${BODY_TITLE_TRACK}em`}
                fill={titleFill}
              >
                {s.title}
              </text>
              <text
                x={teamX}
                y={base}
                fontSize={BODY_FS}
                letterSpacing={`${BODY_TEAM_TRACK}em`}
                fill={teamFill}
              >
                {s.team}
              </text>
              {cut ? (
                <text
                  x={colRight}
                  y={base}
                  textAnchor="end"
                  fontSize={BODY_FS}
                  letterSpacing={`${CUT_TRACK}em`}
                  fill="var(--pda-grn-ink)"
                >
                  {CUT_MARK}
                </text>
              ) : null}
            </g>
          );
        }
        return null;
      })}
    </>
  );
}

export function VariantTerminal({ record }: IslVariantProps) {
  const { endY: leftEnd } = layoutColumn(LEFT_PATTERNS);
  const { endY: rightEnd } = layoutColumn(RIGHT_PATTERNS);
  const etchY = Math.max(leftEnd, rightEnd) + 22;

  return (
    <>
      <Column record={record} patterns={LEFT_PATTERNS} xOffset={COL_LEFT_X} />
      <Column record={record} patterns={RIGHT_PATTERNS} xOffset={COL_RIGHT_X} />

      {/* Etch — the total, teams, patterns caption. */}
      <text
        x={L + (R - L) / 2}
        y={etchY}
        textAnchor="middle"
        fontSize={FS.chrome}
        letterSpacing=".26em"
        fill="var(--pda-txt3)"
      >
        {ETCH}
      </text>
    </>
  );
}

export function terminalLettering(record: IslRecord): LetterSpec[] {
  const out: LetterSpec[] = [];

  for (const pattern of SAMPLE_PATTERNS) {
    const skills = skillsIn(pattern);
    out.push({
      slot: `div.${pattern}.name`,
      text: patternName(record, pattern),
      fs: DIV_FS,
      track: 0.14,
      measure: DIV_LABEL_MEASURE,
    });
    out.push({
      slot: `div.${pattern}.count`,
      text: `${String(skills.length).padStart(2, "0")} SKILLS`,
      fs: DIV_FS,
      track: 0.14,
      measure: DIV_COUNT_MEASURE,
    });
    for (const s of skills) {
      out.push({
        slot: `${s.id}.title`,
        text: s.title,
        fs: BODY_FS,
        track: BODY_TITLE_TRACK,
        measure: TITLE_MEASURE,
      });
      out.push({
        slot: `${s.id}.team`,
        text: s.team,
        fs: BODY_FS,
        track: BODY_TEAM_TRACK,
        measure: TEAM_MEASURE,
      });
      if (s.cut) {
        out.push({
          slot: `${s.id}.cut`,
          text: CUT_MARK,
          fs: BODY_FS,
          track: CUT_TRACK,
          measure: CUT_MEASURE,
        });
      }
    }
  }

  out.push({
    slot: "etch",
    text: ETCH,
    fs: FS.chrome,
    track: 0.26,
    measure: R - L,
  });

  return out;
}
