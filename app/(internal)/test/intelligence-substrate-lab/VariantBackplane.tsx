import { Cartridge } from "@/components/landing/home-v2/services/casefile/map/pda/pdaGlyphs";
import type { PdaShape } from "@/components/landing/home-v2/services/casefile/map/pda/pdaRecord";

import { SAMPLE_SKILLS, type SampleSkill, type SubstrateSkillPattern } from "./sampleSkills";
import { FS, MODULE, TRACK, band, housing, type LetterSpec } from "./substrateKit";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 12 · BACKPLANE — the selected card at centre, five substrate bays around it.
 *
 * The reader arrives on this reading having just opened one configuration. The
 * shipped reading 03 threw that context away — the same 47 plates whichever
 * work was selected. This direction keeps the SELECTED CARD on screen at the
 * R4 core position (byte-identical rectangle), and lets the five substrate
 * patterns sit around it in the same housing grammar reading 02 uses.
 *
 * ## Layout
 *
 * The bay positions ARE the R4 handoff's four module positions plus a split
 * base. Reading 02's OWNER plate (top-wide) becomes VOICE, its LEFT node
 * becomes JUDGMENT, its RIGHT becomes VALIDATION, and its BASE splits into
 * STAKEHOLDER (base-left) and PATTERN (base-right). Same silhouettes, same
 * pad, same 45° cuts, same header band — the drawing that arrives from
 * reading 02 does not have to redraw its language, only its content.
 *
 * ## Ribbon lighting
 *
 * A bay whose pattern the SELECTED work `taps` gets a hatched ribbon from the
 * card edge, the same grammar reading 02 uses for its own docks. A bay it
 * does NOT tap still draws its skills but stays dim (amber accent instead of
 * gold, no ribbon). The reader sees BOTH the shape of the shared layer AND
 * what THIS configuration paid for.
 *
 * ## Representative selection
 *
 * Each bay letters 2 skill plates: the pattern's `flagship` first (green
 * accent, ADR-070 U16 rule), then one further skill (preferring a different
 * team so the reader sees range). Any remainder shows as `+N MORE`. Never a
 * full list — that is the shipped reading, and it dropped the selected
 * context.
 *
 * ⚠ **NO OWNER NAMES.** `CaseSkillEntry` refuses that field since ADR-056;
 * the `SampleSkill` fixture carries client staff names, and this drawing
 * letters `shortTitle` only. Team codes are optional and appear as a small
 * chrome tag beside the label — code, not name, since the code was already
 * publishable on the R4 seat.
 */

export const BACKPLANE_VIEWBOX = "0 0 932 762";

/* ── R4 GEOMETRY, PORTED VERBATIM ────────────────────────────────────────
   These are `configLayout(0)`'s own rectangles — the reading-02 board at
   rest, in the R4 handoff's own 888×744 stage coordinates offset into the
   932×762 lab crop. Same numbers on both readings is the point. */
const OWNER = { x: 232, y: 20, w: 424, h: 108 } as const;
const SAT = { w: 204, h: 218 } as const;
const LEFT = { x: 4, y: 192, w: SAT.w, h: SAT.h } as const;
const RIGHT = { x: 680, y: 192, w: SAT.w, h: SAT.h } as const;

/** R4's BASE is 400 wide starting at x=244. Split into two bays with a
 *  10-unit gutter so the two halves letter independently. */
const BASE_Y = 532;
const BASE_H = 128;
const BASE_GUTTER = 10;
const BASE_L = { x: 244, y: BASE_Y, w: (400 - BASE_GUTTER) / 2, h: BASE_H } as const;
const BASE_R = { x: 244 + BASE_L.w + BASE_GUTTER, y: BASE_Y, w: BASE_L.w, h: BASE_H } as const;

/** The card. `pdaGlyphs.Cartridge` at CORE_K, centred on R4's core centre.
 *  Same rectangle reading 02 draws in. */
const CORE_K = 1.7;
const CORE_W = 176 * CORE_K;
const CORE_H = 136 * CORE_K;
const CORE_CX = 444;
const CORE_CY = 300;
const CORE_X = CORE_CX - CORE_W / 2;
const CORE_Y = CORE_CY - CORE_H / 2;

/* ── BAY SLOTS, ONE PER PATTERN ──────────────────────────────────────────
   Ordered by `MAP_SHAPES` so a slot's INDEX picks its pattern deterministically
   and the mapping cannot drift between the drawing and its declaration. */
type Bay = { readonly x: number; readonly y: number; readonly w: number; readonly h: number };
const BAYS: readonly Bay[] = [OWNER, LEFT, RIGHT, BASE_L, BASE_R];

/* ── PLATE GRAMMAR ───────────────────────────────────────────────────────
   Same slab-with-accent grammar the shipped cards use (ADR-070 U16). The
   accent survives the meet where a 1-unit spine does not (U11's alpha
   ceiling). */
const ACCENT_W = 3;
const LABEL_GAP = 6;
const PLATE_H = 18;
const PLATE_GAP = 2;
const PLATE_PITCH = PLATE_H + PLATE_GAP;

/** How many representative plates per bay. Set here so the guard and the
 *  drawing agree, and so a future edit changing one changes both. */
const PLATES_PER_BAY = 2;

/** Where a bay's stack starts, below its header band. */
const STACK_TOP_GAP = 6;

/* ── REPRESENTATIVE PICKER ───────────────────────────────────────────────
   The reader does not need all 47 plates. What they need to see, in order:
     1. The flagship encode — the Skill that CUT this pattern first.
     2. One more Skill from a DIFFERENT team, so the bay reads as multi-team.
     3. Everything else, counted as `+N MORE`.
   Pure, so `pda-substrate-fit` can walk the same picks. */
function representatives(pattern: SubstrateSkillPattern): {
  picks: readonly SampleSkill[];
  more: number;
} {
  const inPattern = SAMPLE_SKILLS.filter((s) => s.substrate === pattern);
  const flagship = inPattern.find((s) => s.cut);
  const rest = inPattern.filter((s) => s !== flagship);

  const picks: SampleSkill[] = [];
  if (flagship) picks.push(flagship);
  /* Prefer a Skill from a DIFFERENT team than the flagship's, so the two
     plates carry more than one team-code between them. Falls back to the
     first remaining if every Skill in the pattern shares a team. */
  const seenTeams = new Set(picks.map((p) => p.team));
  const distinct = rest.find((s) => !seenTeams.has(s.team));
  if (distinct) picks.push(distinct);
  else if (rest[0]) picks.push(rest[0]);

  while (picks.length < PLATES_PER_BAY && rest.length > picks.length - (flagship ? 1 : 0)) {
    const next = rest.find((s) => !picks.includes(s));
    if (!next) break;
    picks.push(next);
  }

  const more = Math.max(0, inPattern.length - picks.length);
  return { picks: picks.slice(0, PLATES_PER_BAY), more };
}

/** The card's edge point closest to a bay — where a ribbon meets the card.
 *  Simple approximation: pick the closest of four midpoints. */
function cardAnchor(bay: Bay): { x: number; y: number } {
  const bx = bay.x + bay.w / 2;
  const by = bay.y + bay.h / 2;
  const dx = bx - CORE_CX;
  const dy = by - CORE_CY;
  /* Which side wins is which axis's absolute delta is larger, scaled by
     the card's own aspect. A bay directly above wants the top edge; a bay
     mostly to the side wants a side edge. */
  const ratio = Math.abs(dx) / (CORE_W / 2) - Math.abs(dy) / (CORE_H / 2);
  if (ratio > 0) {
    return { x: dx > 0 ? CORE_X + CORE_W : CORE_X, y: CORE_CY };
  }
  return { x: CORE_CX, y: dy > 0 ? CORE_Y + CORE_H : CORE_Y };
}

/** The bay's edge point closest to the card. Mirror of `cardAnchor`. */
function bayAnchor(bay: Bay): { x: number; y: number } {
  const bx = bay.x + bay.w / 2;
  const by = bay.y + bay.h / 2;
  const dx = CORE_CX - bx;
  const dy = CORE_CY - by;
  const ratio = Math.abs(dx) / (bay.w / 2) - Math.abs(dy) / (bay.h / 2);
  if (ratio > 0) {
    return { x: dx > 0 ? bay.x + bay.w : bay.x, y: by };
  }
  return { x: bx, y: dy > 0 ? bay.y + bay.h : bay.y };
}

/** A hatched ribbon between two points, the R4 grammar. Simple L-jog
 *  where the two anchors do not share an axis. */
function ribbonBetween(from: { x: number; y: number }, to: { x: number; y: number }): string {
  if (Math.abs(from.x - to.x) < 0.5 || Math.abs(from.y - to.y) < 0.5) {
    return `M${from.x} ${from.y} L${to.x} ${to.y}`;
  }
  return `M${from.x} ${from.y} L${to.x} ${from.y} L${to.x} ${to.y}`;
}

/* ── THE DRAWING ─────────────────────────────────────────────────────── */

export function VariantBackplane({ record }: IslVariantProps) {
  /* ⚠ `selectedWork` is optional on IslRecord; the lab always passes one,
     but a variant that assumes it would break the shell's other directions.
     We render a placeholder card if it is absent, so the drawing still
     communicates its composition. */
  const work = record.selectedWork;
  const led = !work?.configured;

  return (
    <>
      {/* Hatch patterns for the ribbons — one gold (tapped), one dim (not).
          Ids are stable because the fragment unmounts with the reading. */}
      <defs>
        <pattern id="isl-bp-hatch-au" width="7" height="7" patternUnits="userSpaceOnUse">
          <path d="M0 7L7 0" stroke="var(--pda-amb)" strokeOpacity="0.32" strokeWidth="1" />
        </pattern>
        <pattern id="isl-bp-hatch-dim" width="7" height="7" patternUnits="userSpaceOnUse">
          <path d="M0 7L7 0" stroke="var(--pda-dim)" strokeOpacity="0.22" strokeWidth="1" />
        </pattern>
      </defs>

      {/* ── RIBBONS FIRST, SO THE BAYS OVERPAINT THEIR ENDPOINTS ─────── */}
      {record.shapes.map((shape, i) => {
        const bay = BAYS[i];
        if (!bay) return null;
        const tapped = work ? work.taps.includes(shape.key) : false;
        const from = cardAnchor(bay);
        const to = bayAnchor(bay);
        const d = ribbonBetween(from, to);
        return (
          <path
            key={`rib-${shape.key}`}
            d={d}
            fill="none"
            stroke={tapped ? "var(--pda-amb)" : "var(--pda-dim)"}
            strokeOpacity={tapped ? 0.72 : 0.28}
            strokeWidth={tapped ? 2 : 1}
            strokeDasharray={tapped ? undefined : "4 3"}
          />
        );
      })}

      {/* ── BAYS ─────────────────────────────────────────────────────── */}
      {record.shapes.map((shape, i) => {
        const bay = BAYS[i];
        if (!bay) return null;
        const tapped = work ? work.taps.includes(shape.key) : true;
        return (
          <Bay
            key={shape.key}
            bay={bay}
            shape={shape}
            tapped={tapped}
            pattern={shape.key as SubstrateSkillPattern}
          />
        );
      })}

      {/* ── THE CARD ─────────────────────────────────────────────────── */}
      {work ? (
        <g>
          <Cartridge
            x={CORE_X}
            y={CORE_Y}
            w={CORE_W}
            h={CORE_H}
            k={CORE_K}
            work={work}
            state={led ? "led" : "cfg"}
            sel
          />
        </g>
      ) : (
        /* No work selected — a bare housing so the composition still reads.
           Deliberately not lettered so the reader sees the shape and no
           invented content. */
        <path
          d={housing(CORE_X, CORE_Y, CORE_W, CORE_H, 14 * CORE_K)}
          fill="var(--pda-void)"
          stroke="var(--pda-hair2)"
          strokeDasharray="5 4"
        />
      )}
    </>
  );
}

function Bay({
  bay,
  shape,
  tapped,
  pattern,
}: {
  bay: Bay;
  shape: PdaShape;
  tapped: boolean;
  pattern: SubstrateSkillPattern;
}) {
  const { picks, more } = representatives(pattern);
  const d = housing(bay.x, bay.y, bay.w, bay.h, MODULE.cut);
  const bandD = band(bay.x, bay.y, bay.w, MODULE.head, MODULE.cut);
  const stackTop = bay.y + MODULE.head + STACK_TOP_GAP;
  const bodyX = bay.x + MODULE.pad;
  const innerW = bay.w - MODULE.pad * 2;
  const nameFill = tapped ? "var(--pda-txt)" : "var(--pda-txt2)";
  const countFill = tapped ? "var(--pda-ink)" : "var(--pda-txt3)";

  return (
    <g data-bay={shape.key} data-tapped={tapped ? "" : undefined}>
      <path d={d} fill="var(--pda-void)" />
      <path d={d} fill={tapped ? "rgba(var(--dawn-rgb), 0.05)" : "rgba(var(--dawn-rgb), 0.02)"} />
      <path
        d={d}
        fill="none"
        stroke={tapped ? "var(--pda-hair2)" : "var(--pda-hair)"}
        strokeDasharray={tapped ? undefined : "5 3"}
      />

      {/* Header band + 2px top rule + closing hairline — R4 grammar. */}
      <path
        d={bandD}
        fill={tapped ? "rgba(var(--dawn-rgb), 0.06)" : "rgba(var(--dawn-rgb), 0.03)"}
      />
      <line
        x1={bay.x}
        y1={bay.y + 1}
        x2={bay.x + bay.w - MODULE.cut}
        y2={bay.y + 1}
        stroke={tapped ? "var(--pda-hair2)" : "var(--pda-hair)"}
        strokeWidth="2"
      />
      <line
        x1={bay.x}
        y1={bay.y + MODULE.head}
        x2={bay.x + bay.w}
        y2={bay.y + MODULE.head}
        stroke="var(--pda-hair)"
      />
      <text
        x={bodyX}
        y={bay.y + 23}
        fontSize={FS.key}
        fontWeight={700}
        letterSpacing=".14em"
        fill={nameFill}
      >
        {shape.name}
      </text>
      <text
        x={bay.x + bay.w - MODULE.pad}
        y={bay.y + 23}
        textAnchor="end"
        fontSize={FS.key}
        letterSpacing=".14em"
        fill={countFill}
      >
        {String(shape.skills).padStart(2, "0")}
      </text>

      {/* Representative plates — flagship first (green accent), then one
          more from a different team. */}
      {picks.map((skill, k) => {
        const py = stackTop + k * PLATE_PITCH;
        if (py + PLATE_H > bay.y + bay.h - 18) return null; /* Won't fit. */
        const first = Boolean(skill.cut);
        return (
          <g key={skill.id}>
            <rect
              x={bodyX}
              y={py}
              width={innerW}
              height={PLATE_H}
              fill={tapped ? "rgba(var(--dawn-rgb), 0.06)" : "rgba(var(--dawn-rgb), 0.03)"}
            />
            <rect
              x={bodyX}
              y={py}
              width={ACCENT_W}
              height={PLATE_H}
              fill={first ? "var(--pda-grn)" : "var(--pda-amb)"}
              fillOpacity={tapped ? (first ? 1 : 0.6) : 0.35}
            />
            <text
              x={bodyX + ACCENT_W + LABEL_GAP}
              y={py + PLATE_H - 5}
              fontSize={FS.chrome}
              letterSpacing=".08em"
              fill={tapped ? "var(--pda-txt)" : "var(--pda-txt2)"}
            >
              {skill.shortTitle}
            </text>
            {/* Team code, right-aligned — small chrome tag. */}
            <text
              x={bodyX + innerW - 2}
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

      {/* + N MORE — the honest remainder. Sits below the last plate that
          fitted, at the bay's own bottom edge. */}
      {more > 0 ? (
        <text
          x={bodyX}
          y={bay.y + bay.h - 8}
          fontSize={FS.chrome}
          letterSpacing=".14em"
          fill={tapped ? "var(--pda-ink)" : "var(--pda-txt3)"}
        >
          {`+${more} MORE`}
        </text>
      ) : null}
    </g>
  );
}

/* ── LETTERING SPEC (the fit guard walks this) ─────────────────────────── */

export function backplaneLettering(record: IslRecord): LetterSpec[] {
  const out: LetterSpec[] = [];

  for (let i = 0; i < record.shapes.length; i += 1) {
    const shape = record.shapes[i];
    const bay = BAYS[i];
    if (!bay) continue;
    const pattern = shape.key as SubstrateSkillPattern;
    const { picks, more } = representatives(pattern);

    const innerW = bay.w - MODULE.pad * 2;
    const nameMeasure = innerW - 32; /* 32u for the right-aligned count column */
    const plateInnerW = innerW - ACCENT_W - LABEL_GAP - 4;
    /* Plate row seats a team code on the right at chrome tracking; the
       label's measure is the remainder. Estimate the team code at 3 chars
       × 8.16u/char ≈ 24.5u. */
    const labelMeasure = plateInnerW - 28;

    out.push({
      slot: `${shape.key}.name`,
      text: shape.name,
      fs: FS.key,
      track: TRACK.chrome,
      measure: nameMeasure,
    });
    out.push({
      slot: `${shape.key}.count`,
      text: String(shape.skills).padStart(2, "0"),
      fs: FS.key,
      track: TRACK.chrome,
      measure: 30,
    });

    for (const skill of picks) {
      out.push({
        slot: `skill.${skill.id}.label`,
        text: skill.shortTitle,
        fs: FS.chrome,
        track: TRACK.name,
        measure: labelMeasure,
      });
      out.push({
        slot: `skill.${skill.id}.team`,
        text: skill.team,
        fs: FS.chrome,
        track: TRACK.chrome,
        measure: 32,
      });
    }

    if (more > 0) {
      out.push({
        slot: `${shape.key}.more`,
        text: `+${more} MORE`,
        fs: FS.chrome,
        track: TRACK.chrome,
        measure: innerW,
      });
    }
  }

  return out;
}

/* Re-exports for tests that want the picker without importing the drawing. */
export { representatives };
