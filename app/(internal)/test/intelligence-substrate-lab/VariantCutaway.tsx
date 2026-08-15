import { Cartridge } from "@/components/landing/home-v2/services/casefile/map/pda/pdaGlyphs";

import { SAMPLE_SKILLS, type SampleSkill, type SubstrateSkillPattern } from "./sampleSkills";
import { FS, MODULE, TRACK, band, housing, type LetterSpec } from "./substrateKit";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 14 · SECTION CUTAWAY — the selected card floats above grade; five substrate
 * strata sit beneath it, embedded in the section.
 *
 * The card holds the top-right corner at the same size the other selected-work
 * directions use, so the three directions share one silhouette. A GRADE LINE
 * runs across the crop just below the card; below it, five horizontal strata
 * stack, one per pattern, each seated with its representative Skill plates.
 *
 * Vertical risers drop from the card to the strata the configuration TAPS.
 * A stratum with no riser reads as available substrate the configuration is
 * not drawing on — still visible, still readable, but demonstrably other.
 *
 * ## Trade-offs
 *
 * Strongest substrate metaphor of the three directions ("below grade runs the
 * shared substrate — encoded once for one team, tapped by the next" is the
 * shipped brief line this drawing renders). Least compact: 762 units of crop
 * split between a small floating card and five thin strata leaves little slack
 * for the plates and forces a tight type ladder. That is the named cost.
 */

export const CUTAWAY_VIEWBOX = "0 0 932 762";

/* ── CARD — small, top-right ─────────────────────────────────────────── */
const CORE_K = 1.4; /* Smaller than the backplane's 1.7 — the card is the
                        source, not the centrepiece here. */
const CORE_W = 176 * CORE_K;
const CORE_H = 136 * CORE_K;
const CARD_X = 932 - 26 - CORE_W;
const CARD_Y = 26;

/* ── GRADE + STRATA ──────────────────────────────────────────────────── */
const GRADE_Y = CARD_Y + CORE_H + 24;
const STRATA_TOP = GRADE_Y + 14;
const STRATA_BOTTOM = 762 - 26;
const STRATA_COUNT = 5;
const STRATA_GAP = 8;
const STRATUM_H = (STRATA_BOTTOM - STRATA_TOP - STRATA_GAP * (STRATA_COUNT - 1)) / STRATA_COUNT;

const STRATA_X = 26;
const STRATA_W = 880;

/** The head column on the left of each stratum. */
const HEAD_W = 150;

/** Plate grammar. */
const ACCENT_W = 3;
const LABEL_GAP = 5;
const PLATE_H = 18;
/** ⚠ 180, not 148 — `VSME Reporting` is 14 chars at fs 12 × .08 track = 114u
 *  and the plate's label measure is `PLATE_W - ACCENT_W - LABEL_GAP - 32u
 *  team-tag column`. At 148 the label measure was 108u and the guard
 *  caught it; 180 gives 140u of label measure with 26u of slack. */
const PLATE_W = 180;
const PLATE_GAP = 8;
const PLATES_PER_STRATUM = 3;

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

  while (picks.length < PLATES_PER_STRATUM && rest.length > picks.length - (flagship ? 1 : 0)) {
    const next = rest.find((s) => !picks.includes(s));
    if (!next) break;
    picks.push(next);
  }

  return {
    picks: picks.slice(0, PLATES_PER_STRATUM),
    more: Math.max(0, inPattern.length - picks.length),
  };
}

/* ── THE DRAWING ─────────────────────────────────────────────────────── */

export function VariantCutaway({ record }: IslVariantProps) {
  const work = record.selectedWork;
  const led = !work?.configured;

  /* Where the risers descend from — the card's bottom edge. Two risers,
     spread across the card's width so the tapped strata do not all funnel
     to a single point. */
  const riserAnchors = [CARD_X + CORE_W * 0.28, CARD_X + CORE_W * 0.72];

  return (
    <>
      {/* ── RISERS FIRST — behind everything else ────────────────────── */}
      {work
        ? record.shapes.map((shape, i) => {
            if (!work.taps.includes(shape.key)) return null;
            const y = STRATA_TOP + i * (STRATUM_H + STRATA_GAP);
            const rx = riserAnchors[i % riserAnchors.length];
            /* Jog above grade so the two risers do not overlap on tapped
               strata that share an anchor. */
            const jog = GRADE_Y - 6;
            return (
              <path
                key={`riser-${shape.key}`}
                d={`M${rx} ${CARD_Y + CORE_H} L${rx} ${jog} L${rx} ${y + STRATUM_H / 2}`}
                fill="none"
                stroke="var(--pda-amb)"
                strokeOpacity={0.62}
              />
            );
          })
        : null}

      {/* ── GRADE LINE ─────────────────────────────────────────────── */}
      <line
        x1={STRATA_X}
        y1={GRADE_Y}
        x2={STRATA_X + STRATA_W}
        y2={GRADE_Y}
        stroke="var(--pda-hair2)"
        strokeWidth="1"
      />
      <line
        x1={STRATA_X}
        y1={GRADE_Y + 3}
        x2={STRATA_X + STRATA_W}
        y2={GRADE_Y + 3}
        stroke="var(--pda-hair)"
        strokeDasharray="4 4"
      />
      <text
        x={STRATA_X}
        y={GRADE_Y - 5}
        fontSize={FS.chrome}
        letterSpacing=".22em"
        fill="var(--pda-txt3)"
      >
        GRADE
      </text>

      {/* ── STRATA ──────────────────────────────────────────────────── */}
      {record.shapes.map((shape, i) => {
        const pattern = shape.key as SubstrateSkillPattern;
        const tapped = work ? work.taps.includes(shape.key) : true;
        const y = STRATA_TOP + i * (STRATUM_H + STRATA_GAP);
        const { picks, more } = representatives(pattern);
        const cut = MODULE.cut;

        return (
          <g key={shape.key} data-stratum={shape.key} data-tapped={tapped ? "" : undefined}>
            {/* The stratum's own housing on the canonical diagonal. */}
            <path
              d={housing(STRATA_X, y, STRATA_W, STRATUM_H, cut)}
              fill={tapped ? "rgba(var(--dawn-rgb), 0.05)" : "rgba(var(--dawn-rgb), 0.02)"}
            />
            <path
              d={housing(STRATA_X, y, STRATA_W, STRATUM_H, cut)}
              fill="none"
              stroke={tapped ? "var(--pda-hair2)" : "var(--pda-hair)"}
              strokeDasharray={tapped ? undefined : "5 3"}
            />
            {/* Header band along the top of the stratum. */}
            <path
              d={band(STRATA_X, y, STRATA_W, 26, cut)}
              fill={tapped ? "rgba(var(--dawn-rgb), 0.05)" : "rgba(var(--dawn-rgb), 0.025)"}
            />
            <line
              x1={STRATA_X}
              y1={y + 26}
              x2={STRATA_X + STRATA_W}
              y2={y + 26}
              stroke="var(--pda-hair)"
            />

            {/* Head — pattern name + skills count. */}
            <text
              x={STRATA_X + 16}
              y={y + 18}
              fontSize={FS.key}
              fontWeight={700}
              letterSpacing=".14em"
              fill={tapped ? "var(--pda-txt)" : "var(--pda-txt2)"}
            >
              {shape.name}
            </text>
            <text
              x={STRATA_X + HEAD_W}
              y={y + 18}
              fontSize={FS.chrome}
              letterSpacing=".18em"
              fill={tapped ? "var(--pda-ink)" : "var(--pda-txt3)"}
            >
              {`${String(shape.skills).padStart(2, "0")} SKILLS`}
            </text>

            {/* Plates flow horizontally below the header band. */}
            {picks.map((skill, k) => {
              const first = Boolean(skill.cut);
              const px = STRATA_X + 16 + k * (PLATE_W + PLATE_GAP);
              const py = y + 26 + (STRATUM_H - 26 - PLATE_H) / 2;
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
                    y={py + PLATE_H - 5}
                    fontSize={FS.chrome}
                    letterSpacing=".08em"
                    fill={tapped ? "var(--pda-txt)" : "var(--pda-txt2)"}
                  >
                    {skill.shortTitle}
                  </text>
                  <text
                    x={px + PLATE_W - 4}
                    y={py + PLATE_H - 5}
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
                x={STRATA_X + STRATA_W - cut - 4}
                y={y + 26 + (STRATUM_H - 26) / 2 + 4}
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

      {/* ── THE CARD, drawn last so the risers pass beneath it ──────── */}
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

export function cutawayLettering(record: IslRecord): LetterSpec[] {
  const out: LetterSpec[] = [];

  out.push({ slot: "grade", text: "GRADE", fs: FS.chrome, track: 0.22, measure: 200 });

  for (const shape of record.shapes) {
    const pattern = shape.key as SubstrateSkillPattern;
    const { picks, more } = representatives(pattern);

    out.push({
      slot: `${shape.key}.name`,
      text: shape.name,
      fs: FS.key,
      track: TRACK.chrome,
      measure: HEAD_W - 20,
    });
    out.push({
      slot: `${shape.key}.count`,
      text: `${String(shape.skills).padStart(2, "0")} SKILLS`,
      fs: FS.chrome,
      track: 0.18,
      measure: 180,
    });

    for (const skill of picks) {
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
