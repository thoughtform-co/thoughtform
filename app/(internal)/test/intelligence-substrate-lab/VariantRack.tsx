import {
  DEPT_UNIT,
  FS,
  L,
  R,
  SUB_VIEWBOX,
  TRACK,
  housing,
  shapeSpecs,
  tappers,
  totalSkills,
  type LetterSpec,
} from "./substrateKit";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 7 · SKILL RACK — the atom becomes the Skill.
 *
 * Round three. The owner's brief on the third tab is _"show the shared
 * SUBSTRATES between the different SKILLS"_ — and every variant before this
 * one drew the crossing (departments × patterns) or a card (a pattern by
 * itself). None of them drew the atom the sentence names. This one does.
 *
 * The band structure is the pin grid's, VERBATIM, so the reader who has
 * already scanned reading 03 recognises the identity strip in place: name at
 * FS.name with `{n} SKILLS` pinned right, gloss at FS.gloss, `CUT BY {ab}`
 * at FS.chrome in green ink. The 374-unit identity gutter carries the
 * record's longest gloss (38 chars) on one line at the surface's floor.
 *
 * INSIDE THE SOCKET, THE ATOMS CHANGE:
 *
 *   - ONE PIP PER ENCODED SKILL, on a SHARED pitch — Pattern's 14 pips span
 *     ~70 % of the rack, Stakeholder's 5 stop a third of the way across.
 *     A row of fourteen is drawn as 2.8× a row of five, because that is
 *     what the record says the mass ratio is. The pin grid carries this
 *     ratio only in the 12px "{n} SKILLS" line — here it is the length of
 *     the row you can count.
 *   - Under each rack, the TAPPING DEPARTMENTS lettered as codes at their
 *     PIN-GRID column positions (CRE·ECM·LEG·FIN·DES·ENG·PRG·OPS) — an
 *     empty column is a department that does not draw on this pattern.
 *     The cutter's code is in green so the identity gutter's `CUT BY {ab}`
 *     and this row's green code point at the same fact from two sides.
 *
 * ⚠ THE PITCH IS SHARED, NOT NORMALISED. Normalising to fill each row would
 * have made Voice's 7 skills look as heavy as Pattern's 14 — the drawing
 * would be counting instead of massing. `pdaLetters`' measure model uses a
 * flat advance, so `chars × fs × (0.6 + track)` is what the guard walks,
 * and the rack's pip pitch is independent of type.
 *
 * ⚠ ONE INK ON THE PIPS. A per-department palette on skills would claim
 * ownership the record does not carry: the record binds Skill to PATTERN,
 * and departments tap the pattern rather than the individual skills.
 */

export const RACK_VIEWBOX = SUB_VIEWBOX;

/* ── The width chain ─────────────────────────────────────────────────────
   Every horizontal number is derived from these six; move one and the two
   halves stay aligned.

   ⚠ THE IDENTITY GUTTER IS THE PIN GRID'S 374, and the socket's own inner
   pad is 14, so `RACK_X = 434` is the pin grid's `SOCK_X + 14`. Reading 03
   is the parent geometry this variant inherits. */
const GUT_W = 374;
const SOCK_X = L + GUT_W + 20;
const SOCK_W = R - SOCK_X;
const SOCK_PAD = 14;
const RACK_X = SOCK_X + SOCK_PAD;
const RACK_W = SOCK_W - SOCK_PAD * 2;

/** THE COLUMN STRIP UNDER EACH RACK. Pinned to eight, so the codes appear
 *  under the same abscissa the pin grid uses. An added department would
 *  fail this variant AND the pin grid together, which is the coupling this
 *  variant deliberately inherits (the substrate-lab-fit guard also
 *  asserts `.teams` is eight, on the record). */
const COLS = 8;
const COL_PITCH = RACK_W / COLS;

/** THE PIP LADDER'S PITCH.
 *
 * Chosen from the record: the heaviest row is Pattern at 14 skills, and it
 * must fit inside `RACK_W = 458`. At pitch 24 with pip 8, Pattern spans
 * `13 × 24 + 8 = 320`, leaving 138 units of RACK to the right — which is
 * the drawing's own honest slack, the space Pattern DOES NOT USE relative
 * to a hypothetical 20-skill maximum. Never the strip's full width, or the
 * eye stops reading mass. */
const PIP = 8;
const PITCH = 24;

/* ── The vertical chain ─────────────────────────────────────────────── */
const HEAD_Y = 26;
const HEAD_H = 70;
const SOCK_Y = HEAD_Y + HEAD_H;
const ROW_H = 112;
const SOCK_H = 5 * ROW_H;

/** Baselines inside a row, from its top. The identity strip and the rack
 *  live at different x, so their y-baselines can overlap without
 *  colliding — every collision the fit readout catches is bbox-on-bbox. */
const B_NAME = 30;
const B_GLOSS = 52;
const B_CUT = 74;
const RACK_CY = 44;
const B_CODES = 96;

/* ── Identity gutter measures ───────────────────────────────────────── */
const META_MEASURE = 120;
const GUT_INNER = GUT_W - 20;
const NAME_MEASURE = GUT_INNER - META_MEASURE;

/* ── The head strip ─────────────────────────────────────────────────── */
const HEAD_LABEL = "ENCODED SUBSTRATE";
const subtitleOf = (record: IslRecord) => `SHARED ACROSS ${record.teams.length} ${DEPT_UNIT}`;

const rowY = (j: number) => SOCK_Y + ROW_H * j;

export function VariantRack({ record }: IslVariantProps) {
  const shapes = record.shapes;
  const teams = record.teams;
  const total = totalSkills(shapes);
  const subtitle = subtitleOf(record);

  return (
    <>
      {/* HEAD — one caption and one total. The pin grid deliberately has
          no head (owner: everything removed was height, and height is the
          only currency this drawing spends); this variant restores it
          because "47 encoded skills" IS the argument, and letter it once
          is the honest way to make it. */}
      <text x={L} y={HEAD_Y + 22} fontSize={FS.chrome} letterSpacing=".14em" fill="var(--pda-txt3)">
        {HEAD_LABEL}
      </text>
      <text
        x={L}
        y={HEAD_Y + 54}
        fontSize={FS.hero}
        fontWeight={700}
        letterSpacing=".02em"
        fill="var(--pda-txt)"
      >
        {`${total} SKILLS`}
      </text>
      <text
        x={R}
        y={HEAD_Y + 54}
        textAnchor="end"
        fontSize={FS.chrome}
        letterSpacing=".14em"
        fill="var(--pda-txt3)"
      >
        {subtitle}
      </text>

      {/* ONE SOCKET — the substrate as a machined housing. TR + BL cut
          (ADR-065's canonical diagonal, via `housing`). */}
      <path
        d={housing(SOCK_X, SOCK_Y, SOCK_W, SOCK_H, 12)}
        fill="var(--pda-void)"
        stroke="var(--pda-hair2)"
      />

      {/* Band rules — the pin grid's, so a row reads as a band rather than
          as two rows sharing a gap. Four internal rules for five bands. */}
      {shapes.slice(1).map((s, j) => (
        <line
          key={`band-${s.key}`}
          x1={SOCK_X}
          x2={SOCK_X + SOCK_W}
          y1={SOCK_Y + ROW_H * (j + 1)}
          y2={SOCK_Y + ROW_H * (j + 1)}
          stroke="var(--pda-hair)"
        />
      ))}

      {shapes.map((s, j) => {
        const y = rowY(j);
        const rackCy = y + RACK_CY;

        return (
          <g key={s.key}>
            {/* IDENTITY GUTTER — pin grid's, verbatim. */}
            <text
              x={L}
              y={y + B_NAME}
              fontSize={FS.name}
              letterSpacing=".08em"
              fill="var(--pda-txt)"
            >
              {s.name}
            </text>
            <text
              x={L + GUT_W}
              y={y + B_NAME}
              textAnchor="end"
              fontSize={FS.chrome}
              letterSpacing=".14em"
              fill="var(--pda-ink)"
            >
              {`${s.skills} SKILLS`}
            </text>
            <text
              x={L}
              y={y + B_GLOSS}
              fontSize={FS.gloss}
              letterSpacing=".08em"
              fill="var(--pda-txt2)"
            >
              {s.gloss}
            </text>
            <text
              x={L}
              y={y + B_CUT}
              fontSize={FS.chrome}
              letterSpacing=".14em"
              fill="var(--pda-grn-ink)"
            >
              {`CUT BY ${s.trenchedBy}`}
            </text>

            {/* THE SHARED BASELINE — one hair rule under every rack, the
                full width of the strip, so the eye reads mass across rows.
                A row that stops short of it is the mass argument drawn. */}
            <line
              x1={RACK_X}
              y1={rackCy + PIP / 2 + 4}
              x2={RACK_X + RACK_W}
              y2={rackCy + PIP / 2 + 4}
              stroke="var(--pda-hair)"
            />

            {/* THE RACK — one pip per Skill, on the shared pitch. */}
            {Array.from({ length: s.skills }, (_, k) => (
              <rect
                key={k}
                x={RACK_X + k * PITCH}
                y={rackCy - PIP / 2}
                width={PIP}
                height={PIP}
                fill="var(--pda-amb)"
                fillOpacity="0.72"
              />
            ))}

            {/* TAPPING DEPARTMENTS — codes only, at pin-grid column
                positions. Empty columns are honest; nothing floats. */}
            {teams.map((t, i) => {
              if (!t.taps.includes(s.key)) return null;
              const cx = RACK_X + (i + 0.5) * COL_PITCH;
              const isCutter = s.trenchedBy === t.ab;
              return (
                <text
                  key={t.id}
                  x={cx}
                  y={y + B_CODES}
                  textAnchor="middle"
                  fontSize={FS.key}
                  letterSpacing=".18em"
                  fill={isCutter ? "var(--pda-grn-ink)" : "var(--pda-txt2)"}
                >
                  {t.ab}
                </text>
              );
            })}
          </g>
        );
      })}
    </>
  );
}

/** The department-code cell's measure, so a spec and its `<text>` cannot
 *  disagree — one pin-grid column, minus 6 for gutter breathing room. */
const CODE_MEASURE = COL_PITCH - 6;

export function rackLettering(record: IslRecord): LetterSpec[] {
  return [
    { slot: "head.label", text: HEAD_LABEL, fs: FS.chrome, track: TRACK.chrome, measure: GUT_W },
    {
      slot: "head.total",
      text: `${totalSkills(record.shapes)} SKILLS`,
      fs: FS.hero,
      track: 0.02,
      measure: GUT_W,
    },
    {
      slot: "head.sub",
      text: subtitleOf(record),
      fs: FS.chrome,
      track: TRACK.chrome,
      measure: SOCK_W,
    },
    ...record.shapes.flatMap((s) =>
      shapeSpecs(s, {
        name: NAME_MEASURE,
        gloss: GUT_INNER,
        meta: META_MEASURE,
      })
    ),
    ...record.shapes.flatMap((s) =>
      tappers(record.teams, s.key).map((t) => ({
        slot: `${s.key}.dept.${t.id}`,
        text: t.ab,
        fs: FS.key,
        track: TRACK.code,
        measure: CODE_MEASURE,
      }))
    ),
  ];
}
