import { SAMPLE_SKILLS, type SubstrateSkillPattern } from "./sampleSkills";
import { FS, L, R, TRACK, housing, type LetterSpec } from "./substrateKit";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 19 · LEAVES — each pattern is a SLAB SEEN FORE-EDGE-ON, its long edge a
 * comb of N hairline leaves.
 *
 * The Cyberpunk 2077 item-cells edges reference draws each item's record
 * as a comb of thin hairlines standing off its edge — record depth read
 * as mass without lettering. Ports directly: a pattern is the slab, each
 * leaf is one encoded Skill, the flagship leaf is longer and lettered.
 *
 * ⚠ FIVE SLABS STACKED VERTICALLY. Each slab has an identity strip on the
 * left (name · count · gloss), a hairline slab body across the middle,
 * and a comb of N leaves poking UPWARD from the slab's top edge. The
 * flagship leaf is drawn taller and green; its `shortTitle` letters
 * horizontally above it.
 *
 * ⚠ THE LEAF COUNT IS THE RECORD, not a decorative approximation.
 * `leavesMarkCount()` asserts it against `shape.skills`. A comb of 47
 * hairlines is what makes the estate scan legibly.
 */

export const LEAVES_VIEWBOX = "0 0 932 762";

/* ── FIVE SLABS ─────────────────────────────────────────────────────── */

const SLABS = 5;
const SLAB_TOP = 42;
const SLAB_PITCH = 138; /* slab-to-slab. */
const slabY = (i: number) => SLAB_TOP + i * SLAB_PITCH;

/* ── SLAB GEOMETRY ─────────────────────────────────────────────────── */

const IDENT_W = 260;
const IDENT_X = L;
const COMB_X = L + IDENT_W + 12;
const COMB_W = R - COMB_X;

const SLAB_H = 6;
/** Leaves stand from the slab's top upward. A flagship leaf takes 40u,
 *  the rest 22u — enough to read as a comb of hairlines but too short to
 *  crowd the identity strip above. */
const LEAF_H = 22;
const FLAG_LEAF_H = 40;

const IDENT_MEASURE = IDENT_W - 24;

export function VariantLeaves({ record }: IslVariantProps) {
  return (
    <>
      {record.shapes.map((shape, i) => {
        const pattern = shape.key as SubstrateSkillPattern;
        const inPattern = SAMPLE_SKILLS.filter((s) => s.substrate === pattern);
        const flagshipIdx = inPattern.findIndex((s) => s.cut);
        const flagship = flagshipIdx >= 0 ? inPattern[flagshipIdx] : undefined;
        const n = inPattern.length;
        const y = slabY(i);
        const slabTopY = y + 62; /* below the identity strip. */
        const combBottomY = slabTopY; /* leaves grow up from slab top. */

        return (
          <g key={shape.key}>
            {/* Identity strip on the left. */}
            <text
              x={IDENT_X + 12}
              y={y + 22}
              fontSize={FS.name}
              fontWeight={700}
              letterSpacing=".14em"
              fill="var(--pda-txt)"
            >
              {shape.name}
            </text>
            <text
              x={IDENT_X + IDENT_W - 12}
              y={y + 22}
              textAnchor="end"
              fontSize={FS.name * 1.4}
              letterSpacing=".08em"
              fill="var(--pda-ink)"
            >
              {String(n).padStart(2, "0")}
            </text>

            {/* SLAB — fore-edge-on, one hairline. */}
            <path
              d={housing(COMB_X, slabTopY, COMB_W, SLAB_H, 3)}
              fill="rgba(var(--dawn-rgb), 0.08)"
              stroke="var(--pda-hair2)"
            />

            {/* COMB of N leaves rising upward from the slab. Evenly
                distributed along COMB_W with a 60u INSET on each side —
                ⚠ 60, not 8: at 8u the leftmost leaf's flagship label
                extends into the count column ("NDA Pre-Check" and
                "Variance" both collided with the numeric count above),
                and shifting the whole comb inward keeps the label field
                clear of chrome. */}
            {inPattern.map((skill, k) => {
              const t = n > 1 ? k / (n - 1) : 0.5;
              const x = COMB_X + 60 + t * (COMB_W - 120);
              const isFlag = k === flagshipIdx;
              const h = isFlag ? FLAG_LEAF_H : LEAF_H;
              return (
                <line
                  key={skill.id}
                  x1={x}
                  y1={combBottomY}
                  x2={x}
                  y2={combBottomY - h}
                  stroke={isFlag ? "var(--pda-grn)" : "var(--pda-amb)"}
                  strokeOpacity={isFlag ? 0.95 : 0.5}
                />
              );
            })}

            {/* FLAGSHIP LEAF LABEL — above the tall leaf, unrotated. */}
            {flagship
              ? (() => {
                  const t = n > 1 ? flagshipIdx / (n - 1) : 0.5;
                  const x = COMB_X + 60 + t * (COMB_W - 120);
                  return (
                    <text
                      x={x}
                      y={combBottomY - FLAG_LEAF_H - 6}
                      textAnchor="middle"
                      fontSize={FS.chrome}
                      letterSpacing=".08em"
                      fill="var(--pda-grn-ink)"
                    >
                      {flagship.shortTitle}
                    </text>
                  );
                })()
              : null}
          </g>
        );
      })}
    </>
  );
}

/* ── LETTERING SPEC and MARK-COUNT HELPER ────────────────────────────── */

export function leavesMarkCount(_record: IslRecord, key: string): number {
  return SAMPLE_SKILLS.filter((s) => s.substrate === key).length;
}

export function leavesLettering(record: IslRecord): LetterSpec[] {
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
      measure: IDENT_MEASURE - 40,
    });
    out.push({
      slot: `${shape.key}.count`,
      text: String(inPattern.length).padStart(2, "0"),
      fs: FS.name * 1.4,
      track: TRACK.name,
      measure: 40,
    });
    if (flagship) {
      out.push({
        slot: `${shape.key}.flagship`,
        text: flagship.shortTitle,
        fs: FS.chrome,
        track: TRACK.name,
        measure: 140,
      });
    }
  }
  return out;
}
