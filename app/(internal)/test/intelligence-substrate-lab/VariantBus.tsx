import { Cartridge } from "@/components/landing/home-v2/services/casefile/map/pda/pdaGlyphs";

import { SAMPLE_SKILLS, type SampleSkill, type SubstrateSkillPattern } from "./sampleSkills";
import { FS, MODULE, TRACK, housing, type LetterSpec } from "./substrateKit";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 13 · UNFOLDED BUS — the selected card at the top-left, five substrate rails
 * unfolding across the crop below it.
 *
 * The selected work card holds the top-left corner at reading 02's core size.
 * Below it, the five substrate patterns letter as horizontal rails from the
 * left wall to the right wall — one per pattern, tapped rails gold, untapped
 * rails dim.
 *
 * Each rail seats:
 *   - the pattern name at the left,
 *   - the pattern's tap count as a small chrome numeral beside the name,
 *   - two representative skill plates flowing horizontally,
 *   - `+N MORE` right-aligned as the honest remainder.
 *
 * Compared with the BACKPLANE, this direction ranks strongly for SCANABILITY:
 * five parallel lines, one type ladder, zero crossings. It ranks weaker on
 * geometric continuity with the R4 board, because the layout rearranges
 * modules into strips rather than replacing R4's docks with bays.
 */

export const BUS_VIEWBOX = "0 0 932 762";

/* ── CARD ────────────────────────────────────────────────────────────── */
const CORE_K = 1.7;
const CORE_W = 176 * CORE_K;
const CORE_H = 136 * CORE_K;
const CARD_X = 26;
const CARD_Y = 26;

/* ── RAILS ───────────────────────────────────────────────────────────── */
const RAIL_X = 26;
const RAIL_W = 880;
const RAIL_TOP = CARD_Y + CORE_H + 34; /* Card bottom + gutter */
const RAIL_COUNT = 5;
const RAIL_GAP = 10;
const RAILS_H = 762 - RAIL_TOP - 30; /* Crop bottom less bottom margin */
const RAIL_H = (RAILS_H - RAIL_GAP * (RAIL_COUNT - 1)) / RAIL_COUNT;

/** The rail's header — pattern name + count on the left. */
const HEAD_W = 160;
const HEAD_INNER_PAD = 16;

/** Plate grammar — same slab as the backplane. */
const ACCENT_W = 3;
const LABEL_GAP = 6;
const PLATE_H = 22;
const PLATE_W = 172;
const PLATE_GAP = 12;
const PLATES_PER_RAIL = 3;

/* ── REPRESENTATIVE PICKER ───────────────────────────────────────────── */

function representatives(pattern: SubstrateSkillPattern): {
  picks: readonly SampleSkill[];
  more: number;
} {
  const inPattern = SAMPLE_SKILLS.filter((s) => s.substrate === pattern);
  const flagship = inPattern.find((s) => s.cut);
  const rest = inPattern.filter((s) => s !== flagship);

  const picks: SampleSkill[] = [];
  if (flagship) picks.push(flagship);
  const seenTeams = new Set(picks.map((p) => p.team));
  const distinct = rest.find((s) => !seenTeams.has(s.team));
  if (distinct) picks.push(distinct);
  else if (rest[0]) picks.push(rest[0]);

  while (picks.length < PLATES_PER_RAIL && rest.length > picks.length - (flagship ? 1 : 0)) {
    const next = rest.find((s) => !picks.includes(s));
    if (!next) break;
    picks.push(next);
  }

  return {
    picks: picks.slice(0, PLATES_PER_RAIL),
    more: Math.max(0, inPattern.length - picks.length),
  };
}

/* ── THE DRAWING ─────────────────────────────────────────────────────── */

export function VariantBus({ record }: IslVariantProps) {
  const work = record.selectedWork;
  const led = !work?.configured;

  return (
    <>
      {/* Connection from the card's bottom-right corner down to the top
          rail. A single hairline column, so tapped rails read as one bus
          coming from the card. Untapped rails still draw their content
          but the column terminates on each; no ribbon reaches them. */}
      {work ? (
        <line
          x1={CARD_X + CORE_W - 20}
          y1={CARD_Y + CORE_H}
          x2={CARD_X + CORE_W - 20}
          y2={RAIL_TOP - 12}
          stroke="var(--pda-amb)"
          strokeOpacity={0.6}
        />
      ) : null}

      {/* ── RAILS ─────────────────────────────────────────────────────── */}
      {record.shapes.map((shape, i) => {
        const pattern = shape.key as SubstrateSkillPattern;
        const tapped = work ? work.taps.includes(shape.key) : true;
        const y = RAIL_TOP + i * (RAIL_H + RAIL_GAP);
        const { picks, more } = representatives(pattern);

        return (
          <g key={shape.key} data-rail={shape.key} data-tapped={tapped ? "" : undefined}>
            {/* The rail itself — R4 housing on the canonical diagonal. */}
            <path
              d={housing(RAIL_X, y, RAIL_W, RAIL_H, MODULE.cut)}
              fill={tapped ? "rgba(var(--dawn-rgb), 0.04)" : "rgba(var(--dawn-rgb), 0.015)"}
            />
            <path
              d={housing(RAIL_X, y, RAIL_W, RAIL_H, MODULE.cut)}
              fill="none"
              stroke={tapped ? "var(--pda-hair2)" : "var(--pda-hair)"}
              strokeDasharray={tapped ? undefined : "5 4"}
            />

            {/* Left-hand HEAD column: name + count. */}
            <line
              x1={RAIL_X + HEAD_W}
              y1={y}
              x2={RAIL_X + HEAD_W}
              y2={y + RAIL_H}
              stroke="var(--pda-hair)"
            />
            <text
              x={RAIL_X + HEAD_INNER_PAD}
              y={y + RAIL_H / 2 - 6}
              fontSize={FS.key}
              fontWeight={700}
              letterSpacing=".14em"
              fill={tapped ? "var(--pda-txt)" : "var(--pda-txt2)"}
            >
              {shape.name}
            </text>
            <text
              x={RAIL_X + HEAD_INNER_PAD}
              y={y + RAIL_H / 2 + 12}
              fontSize={FS.chrome}
              letterSpacing=".18em"
              fill={tapped ? "var(--pda-ink)" : "var(--pda-txt3)"}
            >
              {`${String(shape.skills).padStart(2, "0")} SKILLS`}
            </text>

            {/* PLATES — flowed horizontally. */}
            {picks.map((skill, k) => {
              const first = Boolean(skill.cut);
              const px = RAIL_X + HEAD_W + 16 + k * (PLATE_W + PLATE_GAP);
              const py = y + (RAIL_H - PLATE_H) / 2;
              return (
                <g key={skill.id}>
                  <rect
                    x={px}
                    y={py}
                    width={PLATE_W}
                    height={PLATE_H}
                    fill={tapped ? "rgba(var(--dawn-rgb), 0.06)" : "rgba(var(--dawn-rgb), 0.03)"}
                  />
                  <rect
                    x={px}
                    y={py}
                    width={ACCENT_W}
                    height={PLATE_H}
                    fill={first ? "var(--pda-grn)" : "var(--pda-amb)"}
                    fillOpacity={tapped ? (first ? 1 : 0.6) : 0.35}
                  />
                  <text
                    x={px + ACCENT_W + LABEL_GAP}
                    y={py + PLATE_H - 7}
                    fontSize={FS.chrome}
                    letterSpacing=".08em"
                    fill={tapped ? "var(--pda-txt)" : "var(--pda-txt2)"}
                  >
                    {skill.shortTitle}
                  </text>
                  <text
                    x={px + PLATE_W - 4}
                    y={py + PLATE_H - 7}
                    textAnchor="end"
                    fontSize={FS.chrome}
                    letterSpacing=".14em"
                    fill="var(--pda-txt3)"
                  >
                    {skill.team}
                  </text>
                </g>
              );
            })}

            {/* +N MORE — right-aligned tail. */}
            {more > 0 ? (
              <text
                x={RAIL_X + RAIL_W - MODULE.cut - 4}
                y={y + RAIL_H / 2 + 4}
                textAnchor="end"
                fontSize={FS.chrome}
                letterSpacing=".14em"
                fill={tapped ? "var(--pda-ink)" : "var(--pda-txt3)"}
              >
                {`+${more} MORE`}
              </text>
            ) : null}
          </g>
        );
      })}

      {/* ── THE CARD, drawn last so the bus terminates cleanly under it ── */}
      {work ? (
        <Cartridge
          x={CARD_X}
          y={CARD_Y}
          w={CORE_W}
          h={CORE_H}
          k={CORE_K}
          work={work}
          state={led ? "led" : "cfg"}
          sel
        />
      ) : (
        <path
          d={housing(CARD_X, CARD_Y, CORE_W, CORE_H, 14 * CORE_K)}
          fill="var(--pda-void)"
          stroke="var(--pda-hair2)"
          strokeDasharray="5 4"
        />
      )}
    </>
  );
}

/* ── LETTERING SPEC ──────────────────────────────────────────────────── */

export function busLettering(record: IslRecord): LetterSpec[] {
  const out: LetterSpec[] = [];

  for (const shape of record.shapes) {
    const pattern = shape.key as SubstrateSkillPattern;
    const { picks, more } = representatives(pattern);

    out.push({
      slot: `${shape.key}.name`,
      text: shape.name,
      fs: FS.key,
      track: TRACK.chrome,
      measure: HEAD_W - HEAD_INNER_PAD * 2,
    });
    out.push({
      slot: `${shape.key}.count`,
      text: `${String(shape.skills).padStart(2, "0")} SKILLS`,
      fs: FS.chrome,
      track: 0.18,
      measure: HEAD_W - HEAD_INNER_PAD * 2,
    });

    for (const skill of picks) {
      /* Plate inner width less accent, gap, team tag column and margins. */
      const measure = PLATE_W - ACCENT_W - LABEL_GAP - 32;
      out.push({
        slot: `skill.${skill.id}.label`,
        text: skill.shortTitle,
        fs: FS.chrome,
        track: TRACK.name,
        measure,
      });
      out.push({
        slot: `skill.${skill.id}.team`,
        text: skill.team,
        fs: FS.chrome,
        track: TRACK.chrome,
        measure: 30,
      });
    }

    if (more > 0) {
      out.push({
        slot: `${shape.key}.more`,
        text: `+${more} MORE`,
        fs: FS.chrome,
        track: TRACK.chrome,
        measure: 90,
      });
    }
  }

  return out;
}
