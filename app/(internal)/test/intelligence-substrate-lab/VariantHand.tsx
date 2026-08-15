import { SAMPLE_SKILLS, type SubstrateSkillPattern } from "./sampleSkills";
import { FS, L, PAD, R, TRACK, type LetterSpec } from "./substrateKit";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 15 · HAND — a pattern is a FANNED DECK of plates from a root pivot.
 *
 * The Cyberpunk 2077 attribute-of-the-kitsch reference draws a menu option
 * as a stack of layered cards fanning out from a corner pivot: the deck's
 * spread is the count of options, the front card is the selected one, the
 * rest fall behind at their fan angle. Ports directly to the pattern →
 * skills argument: the pivot is the pattern, each card is one encoded
 * Skill, and the flagship card is pulled forward and lettered horizontally
 * while the rest stay as silhouettes.
 *
 * ⚠ LABELS STAY HORIZONTAL. The plate SILHOUETTES rotate around the pivot;
 * the flagship's label sits on an unrotated foreground element (its plate
 * is drawn straight-up), so the text never inherits the fan's rotation.
 * That is the discipline the isometric city broke on — a rotated text bbox
 * is unmeasurable by the surface's fit guard.
 *
 * ⚠ MARK-COUNT MUST EQUAL `shape.skills`. Every plate is one encoded
 * Skill; a fan of 14 plates is what makes Pattern read heavier than
 * Stakeholder's five. `handMarkCount()` is the pure helper the guard
 * walks, so a fan that drifted from the record would fail before it
 * shipped.
 */

export const HAND_VIEWBOX = "0 0 932 762";

/* ── Five hands across the crop ─────────────────────────────────────── */

const HANDS = 5;
const HAND_PITCH = (R - L) / HANDS; /* 176u per column */
const handX = (i: number) => L + HAND_PITCH * i + HAND_PITCH / 2;

/* ── Pivot + fan geometry ───────────────────────────────────────────── */

/** The pivot's y — where the plates meet. Sits near the crop's floor so the
 *  fan opens UPWARD, into the space that carries the pattern's identity. */
const PIVOT_Y = 660;

/** The plate silhouette — narrow and tall, so a stack of 14 does not blow
 *  a 176u column. */
const PLATE_W = 48;
const PLATE_H = 250;

/** The fan's angular spread. `SPREAD_MAX` at N=14 packs 14 plates across
 *  ~65°; smaller N narrows proportionally so a five-plate fan does not
 *  read as one very-spread hand. Chosen against the record's own max. */
const SPREAD_MAX_DEG = 65;
const SKILLS_MAX = 14; /* Pattern; every larger record would need re-fitting. */

/** The flagship plate is pulled UP from the pivot by this much so the
 *  lettered face clears the deck of silhouettes behind it. */
const FLAGSHIP_LIFT = 8;

/* ── Identity strip at the top of each column ───────────────────────── */

const NAME_Y = 40;
const COUNT_Y = 92;
const IDENT_MEASURE = HAND_PITCH - 24;
/* ⚠ NO GLOSS ON THIS VARIANT. The pattern's plain-language meaning
   ("HOW THE ORGANISATION SOUNDS IN CONTEXT", 38 chars) does not letter at
   a legible size in a 176-unit column, and this cluster is a MASS reading
   — the shape of the fan says what the pattern is more directly than a
   sentence does. The gloss lives on rows in strata/rack and in the foot
   on the shipped cards; those have the horizontal room. */

/** Plate silhouettes and the flagship's lettered face are drawn in this
 *  order, so foreground stays on top. */
export function VariantHand({ record }: IslVariantProps) {
  return (
    <>
      {record.shapes.map((shape, i) => {
        const pattern = shape.key as SubstrateSkillPattern;
        const inPattern = SAMPLE_SKILLS.filter((s) => s.substrate === pattern);
        const flagship = inPattern.find((s) => s.cut);
        const cx = handX(i);
        const n = inPattern.length;
        /* One STEP per pair of plates — the middle plate has step 0, plates
           either side spread outward symmetrically. */
        const spreadDeg = SPREAD_MAX_DEG * (n / SKILLS_MAX);
        const stepDeg = n > 1 ? spreadDeg / (n - 1) : 0;
        const mid = (n - 1) / 2;

        return (
          <g key={shape.key}>
            {/* Identity, above the fan. */}
            <text
              x={cx}
              y={NAME_Y}
              textAnchor="middle"
              fontSize={FS.name}
              fontWeight={700}
              letterSpacing=".14em"
              fill="var(--pda-txt)"
            >
              {shape.name}
            </text>
            <text
              x={cx}
              y={COUNT_Y}
              textAnchor="middle"
              fontSize={FS.name * 1.6}
              letterSpacing=".08em"
              fill="var(--pda-ink)"
            >
              {String(n).padStart(2, "0")}
            </text>

            {/* The pivot dot — where the plates meet. */}
            <rect
              x={cx - 2}
              y={PIVOT_Y - 2}
              width={4}
              height={4}
              transform={`rotate(45 ${cx} ${PIVOT_Y})`}
              fill="var(--pda-hair2)"
            />

            {/* SILHOUETTES first, so the flagship's lettered plate sits on
                top. The flagship is drawn LAST and un-rotated so its label
                never inherits the fan's transform. */}
            {inPattern.map((skill, k) => {
              if (skill.cut) return null;
              const angle = (k - mid) * stepDeg;
              return (
                <rect
                  key={skill.id}
                  x={cx - PLATE_W / 2}
                  y={PIVOT_Y - PLATE_H}
                  width={PLATE_W}
                  height={PLATE_H}
                  transform={`rotate(${angle.toFixed(2)} ${cx} ${PIVOT_Y})`}
                  fill="rgba(var(--dawn-rgb), 0.05)"
                  stroke="var(--pda-hair)"
                />
              );
            })}

            {/* THE FLAGSHIP — drawn straight-up (no rotation), lifted, its
                short label lettered horizontally. Green accent along its
                left edge so the pattern's first-encode grammar carries. */}
            {flagship ? (
              <g>
                <rect
                  x={cx - PLATE_W / 2}
                  y={PIVOT_Y - PLATE_H - FLAGSHIP_LIFT}
                  width={PLATE_W}
                  height={PLATE_H}
                  fill="rgba(var(--dawn-rgb), 0.08)"
                  stroke="var(--pda-hair2)"
                />
                <rect
                  x={cx - PLATE_W / 2}
                  y={PIVOT_Y - PLATE_H - FLAGSHIP_LIFT}
                  width={3}
                  height={PLATE_H}
                  fill="var(--pda-grn)"
                />
                <text
                  x={cx}
                  y={PIVOT_Y - 22}
                  textAnchor="middle"
                  fontSize={FS.chrome}
                  letterSpacing=".08em"
                  fill="var(--pda-grn-ink)"
                >
                  {flagship.shortTitle}
                </text>
              </g>
            ) : null}
          </g>
        );
      })}
    </>
  );
}

/* ── LETTERING SPEC and MARK-COUNT HELPER ────────────────────────────── */

/** How many plate silhouettes this variant draws per pattern — the drawing's
 *  mass claim. `substrate-lab-fit` asserts this equals `shape.skills`. */
export function handMarkCount(_record: IslRecord, key: string): number {
  return SAMPLE_SKILLS.filter((s) => s.substrate === key).length;
}
void PAD; /* re-exported for shared use; keeps the import list stable. */

export function handLettering(record: IslRecord): LetterSpec[] {
  const out: LetterSpec[] = [];
  for (const shape of record.shapes) {
    const pattern = shape.key as SubstrateSkillPattern;
    const inPattern = SAMPLE_SKILLS.filter((s) => s.substrate === pattern);
    const flagship = inPattern.find((s) => s.cut);

    out.push({
      slot: `${shape.key}.name`,
      text: shape.name,
      fs: FS.name,
      track: TRACK.name,
      measure: IDENT_MEASURE,
    });
    out.push({
      slot: `${shape.key}.count`,
      text: String(inPattern.length).padStart(2, "0"),
      fs: FS.name * 1.6,
      track: TRACK.name,
      measure: IDENT_MEASURE,
    });
    if (flagship) {
      /* ⚠ 120u, NOT `PLATE_W + 20`. The flagship label is text-anchored
         MIDDLE at the fan's centre column, so it extends past the 48-unit
         plate on both sides. `shortTitle` caps at 14 chars × 8.16u = 114.24u
         (Legal Risk, VSME Reporting), so 120u handles the widest label at
         the shipped fs floor. */
      out.push({
        slot: `${shape.key}.flagship`,
        text: flagship.shortTitle,
        fs: FS.chrome,
        track: TRACK.name,
        measure: 120,
      });
    }
  }
  return out;
}
