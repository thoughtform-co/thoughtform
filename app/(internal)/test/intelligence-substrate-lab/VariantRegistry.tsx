import { wrapLines } from "@/components/landing/home-v2/services/casefile/map/pda/pdaGlyphs";

import {
  SAMPLE_PATTERNS,
  SAMPLE_TEAMS,
  SAMPLE_TOTALS,
  skillsIn,
  type SubstrateSkillPattern,
} from "./sampleSkills";
import { FS, L, R, SUB_VIEWBOX, TRACK, type LetterSpec } from "./substrateKit";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 9 · REGISTRY — the substrate as a printed index.
 *
 * Round three, the direct answer to the owner's brief on the third tab:
 * _"the specific skill should be visible"_. The shipped pin grid draws
 * TAPS, the rack draws PIPS, the gallery draws PHYSICS. All three show the
 * shape of the substrate but not the atoms it is made of. This variant
 * prints the 47 encoded Skills BY NAME, grouped by pattern, in the
 * Thoughtform HUD's own book-index register.
 *
 * Five equal columns side by side, one per pattern (VOICE · JUDGMENT ·
 * VALIDATION · STAKEHOLDER · PATTERN). Each column head is the pattern
 * name and its count. Below the head, the pattern's Skills print
 * vertically: title (wrapped to two lines where needed) then team code.
 * The pattern's flagship encode — the Skill that was CUT FIRST for its
 * substrate — prints in green ink, the shipped surface's own cutter
 * grammar carried down from the district level to the Skill level.
 *
 * ⚠ **NO SOCKET HOUSING, ON PURPOSE.** The pin grid, strata and tree draw
 * a chamfered outer housing because they are MACHINED INSTRUMENTS. This
 * reading is a PRINTED INDEX — a masthead, a rule under each column head,
 * and hairline dividers between columns are all the structure the type
 * needs. The console frame is the container.
 *
 * ⚠ **THE ATOMS ARE LOOP TEAMS, NOT THOUGHTFORM DISTRICTS.** The shipped
 * pin grid abscissa is 8 districts (CRE · ECM · LEG · FIN · DES · ENG ·
 * PRG · OPS); Loop's real org has 14 teams. The lab honours the source
 * data — the SAMPLE_TEAMS list mirrors the /claude-adoption page. A
 * promotion pass would decide whether to collapse to the district set or
 * expand the shipped abscissa.
 */

export const REGISTRY_VIEWBOX = SUB_VIEWBOX;

/* ── The width chain ────────────────────────────────────────────────────
   Five columns of exactly 176 units, abutting; a hairline vertical
   divider marks each seam. NO internal padding on the columns — the
   divider IS the boundary. */
const COLS = 5;
const COL_W = (R - L) / COLS;

/* ── The vertical chain ─────────────────────────────────────────────── */
const HEAD_Y = 20;
/**
 * ⚠ THE HEAD IS TWO LINES, NOT ONE. Pattern names run 5–11 characters at
 * FS.name and the count runs 8–9 characters at FS.chrome; on a 164u inner
 * width "STAKEHOLDER" + "5 SKILLS" want 212u together, so a same-baseline
 * head collides on the four longer names. Stacking count under name uses
 * the whole 164u each, and matches the book-index cadence where the
 * section number sits under the section title anyway.
 */
const HEAD_NAME_BASE = 40;
const HEAD_COUNT_BASE = 60;
const HEAD_RULE_Y = 68;
const BODY_TOP = 76;

const TITLE_FS = 13;
/**
 * ⚠ TIGHTER TRACKING THAN THE HOUSE .08 — a 176-unit column can only host
 * so much text. At .05 tracking `fs × (0.6 + track) = 8.45u/char`; with
 * 6u of side padding the measure is 164u, so wrap CAPS at 19 characters
 * (160.55u, 3.5u slack). PT Mono at .05 still reads; below .04 it starts
 * feeling cramped. `pdaLetters.adv` uses `fs × (0.6 + track)`, so the
 * guard sees the honest advance either way.
 *
 * ⚠ TITLE_PER = 19 IS CHOSEN AGAINST THE FIXTURE, not by round number.
 * Loop's longest single-word substring is "Sustainability" (14), and the
 * hardest wrap is "Cost / Feasibility /" — at per=20 the first line is
 * 20 chars = 169u = past the measure. At per=19 the split lands on "Cost
 * / Feasibility" (18) + "/ Portfolio" (11), both under the measure.
 */
const TITLE_TRACK = 0.05;
const TITLE_PER = 19;
/**
 * ⚠ 17 UNITS OF LEAD BETWEEN WRAPPED TITLE LINES. At fs 13 the glyph box
 * spans ~15u (cap-top to descender); 15u line-height puts adjacent line
 * bboxes edge-to-edge and getBBox-based collision readers report every
 * wrapped title as one collision. 17u gives 2u of gap, which is what the
 * lab's fit meter needs to read the pair as separate labels.
 */
const TITLE_LINE_BOX = 17;

const TEAM_FS = FS.chrome;
const TEAM_TRACK = TRACK.chrome;
const TEAM_LINE_BOX = 14;

const TITLE_TO_TEAM_GAP = 4;
/**
 * ⚠ 4 UNITS BETWEEN SKILLS. Pattern's column at TITLE_LINE_BOX=17 already
 * runs 8 × (17+4+14+4) + 6 × (34+4+14+4) = 648u before the head, and
 * `Pattern` is the tallest column by construction. Any larger gap and
 * the last skills clip the etch; any smaller and the previous team code
 * bbox brushes the next skill's title bbox.
 */
const SKILL_GAP = 4;

const colX = (i: number) => L + i * COL_W;

const skillRowH = (lineCount: number) =>
  lineCount * TITLE_LINE_BOX + TITLE_TO_TEAM_GAP + TEAM_LINE_BOX + SKILL_GAP;

/** The etch beneath every column, so the totals the columns imply are
 *  named explicitly. Derived so a fixture edit cannot leave the caption
 *  claiming a number the drawing no longer shows. */
const etchOf = () =>
  `${SAMPLE_TOTALS.total} ENCODED SKILLS · ${SAMPLE_TEAMS.length} TEAMS · ${SAMPLE_PATTERNS.length} PATTERNS`;
/** ⚠ CHOSEN AGAINST THE TALLEST COLUMN. Pattern's 14 skills at the row
 *  budget above end at y = BODY_TOP + 648 = 724; the etch sits 20u
 *  below with 18u of crop still under it. */
const B_ETCH = 748;

function shapeName(record: IslRecord, key: SubstrateSkillPattern): string {
  const s = record.shapes.find((x) => x.key === key);
  return s ? s.name : key.toUpperCase();
}

export function VariantRegistry({ record }: IslVariantProps) {
  return (
    <>
      {/* Column dividers — thin hairlines at each column boundary, and
          two edge rules at the outer walls so the register reads as one
          bounded printed field. */}
      {Array.from({ length: COLS + 1 }, (_, i) => (
        <line
          key={`div-${i}`}
          x1={colX(i)}
          y1={HEAD_Y}
          x2={colX(i)}
          y2={720}
          stroke="var(--pda-hair)"
          strokeOpacity={i === 0 || i === COLS ? 0.9 : 0.5}
        />
      ))}

      {SAMPLE_PATTERNS.map((key, ci) => {
        const skills = skillsIn(key);
        const x = colX(ci);
        const cInner = x + 6;
        const cRight = x + COL_W - 6;
        let cursor = BODY_TOP;

        return (
          <g key={key}>
            {/* Pattern name — the head that identifies the column. */}
            <text
              x={cInner}
              y={HEAD_NAME_BASE}
              fontSize={FS.name}
              letterSpacing=".08em"
              fill="var(--pda-txt)"
            >
              {shapeName(record, key)}
            </text>
            {/* Count — one line below the name, at chrome tracking, gold
                ink. On a 164u inner width the pattern name alone eats
                most of the room ("STAKEHOLDER" is 149.6u at fs 20), so a
                same-baseline "N SKILLS" would clip the name on the four
                longer patterns. Stacking gives each element its own
                measure, and matches the book-index cadence anyway. */}
            <text
              x={cInner}
              y={HEAD_COUNT_BASE}
              fontSize={FS.chrome}
              letterSpacing=".14em"
              fill="var(--pda-ink)"
            >
              {`${skills.length} SKILLS`}
            </text>
            {/* The rule under the head — the book-index seam. */}
            <line
              x1={cInner - 2}
              y1={HEAD_RULE_Y}
              x2={cRight + 2}
              y2={HEAD_RULE_Y}
              stroke="var(--pda-hair2)"
            />

            {/* Skill entries, stacked. */}
            {skills.map((skill) => {
              const lines = wrapLines(skill.title, TITLE_PER, 2);
              const rowY = cursor;
              cursor += skillRowH(lines.length);
              const titleFill = skill.cut ? "var(--pda-grn-ink)" : "var(--pda-txt)";
              const teamFill = skill.cut ? "var(--pda-grn-ink)" : "var(--pda-ink)";
              const teamBaseY =
                rowY + lines.length * TITLE_LINE_BOX + TITLE_TO_TEAM_GAP + TEAM_LINE_BOX - 3;
              return (
                <g key={skill.id}>
                  {lines.map((line, li) => (
                    <text
                      key={li}
                      x={cInner}
                      y={rowY + TITLE_LINE_BOX * (li + 1) - 3}
                      fontSize={TITLE_FS}
                      letterSpacing={`${TITLE_TRACK}em`}
                      fill={titleFill}
                    >
                      {line}
                    </text>
                  ))}
                  <text
                    x={cInner}
                    y={teamBaseY}
                    fontSize={TEAM_FS}
                    letterSpacing={`${TEAM_TRACK}em`}
                    fill={teamFill}
                  >
                    {skill.team}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Etch — total, teams, patterns. One caption for the whole register. */}
      <text
        x={L + (R - L) / 2}
        y={B_ETCH}
        textAnchor="middle"
        fontSize={FS.chrome}
        letterSpacing=".26em"
        fill="var(--pda-txt3)"
      >
        {etchOf()}
      </text>
    </>
  );
}

export function registryLettering(record: IslRecord): LetterSpec[] {
  const out: LetterSpec[] = [];
  const measure = COL_W - 12;

  for (const key of SAMPLE_PATTERNS) {
    const skills = skillsIn(key);
    out.push({
      slot: `${key}.name`,
      text: shapeName(record, key),
      fs: FS.name,
      track: TRACK.name,
      measure,
    });
    out.push({
      slot: `${key}.count`,
      text: `${skills.length} SKILLS`,
      fs: FS.chrome,
      track: TRACK.chrome,
      measure,
    });
    for (const skill of skills) {
      const lines = wrapLines(skill.title, TITLE_PER, 2);
      lines.forEach((line, li) => {
        out.push({
          slot: `${skill.id}.title.${li}`,
          text: line,
          fs: TITLE_FS,
          track: TITLE_TRACK,
          measure,
        });
      });
      out.push({
        slot: `${skill.id}.team`,
        text: skill.team,
        fs: TEAM_FS,
        track: TEAM_TRACK,
        measure,
      });
    }
  }

  out.push({
    slot: "etch",
    text: etchOf(),
    fs: FS.chrome,
    track: 0.26,
    measure: R - L,
  });

  return out;
}
