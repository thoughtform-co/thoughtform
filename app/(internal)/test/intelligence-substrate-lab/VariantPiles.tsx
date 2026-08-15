import { SAMPLE_SKILLS, type SubstrateSkillPattern } from "./sampleSkills";
import { FS, L, R, TRACK, housing, type LetterSpec } from "./substrateKit";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 16 · PILES — a pattern is a PILE OF SLABS at the crop's floor.
 *
 * The Cyberpunk 2077 quest-log/to-do reference draws a queue as offset
 * dogeared slabs whose stacked depth reads at a glance. Ports directly to
 * pattern → skills: one slab per encoded Skill, offset three units up and
 * to the right of the one under it, so the pile's HEIGHT is the count.
 *
 * ⚠ STRAIGHT-ON 2D, never isometric. Fourteen isometric slabs need
 * fourteen labels to disambiguate — the isometric city died on exactly
 * this. Straight-on offset stacks let the flagship label sit horizontally
 * on the top slab, which is the only slab that letters.
 *
 * ⚠ THE PILE'S TOP IS THE FLAGSHIP. The top slab is one step above the
 * one below it and takes the green accent; it letters the flagship's
 * `shortTitle`. The rest are silhouettes. So the drawing's argument reads
 * as "N encoded, one exemplar named" without a legend.
 */

export const PILES_VIEWBOX = "0 0 932 762";

/* ── Five piles across the crop ────────────────────────────────────── */

const PILES = 5;
const PILE_PITCH = (R - L) / PILES;
const pileX = (i: number) => L + PILE_PITCH * i + PILE_PITCH / 2;

/** Slab silhouette. Wide enough for the flagship's ≤14-char label. */
const SLAB_W = 132;
const SLAB_H = 22;
const SLAB_CUT = 8; /* TR+BL chamfer. */
/** ⚠ 5 UP AND 4 RIGHT per slab — not 3. At 3u the whole n=5 pile shifts
 *  15u and the n=14 pile 42u; against a 22u slab those two piles read as
 *  nearly identical, and the "mass IS depth" claim fails. 5/4 shifts the
 *  14-pile by 70/56u, which is what makes Pattern read visibly taller
 *  than Stakeholder. */
const SLAB_STEP_X = 4;
const SLAB_STEP_Y = 5;

/** The pile's bottom edge — the "floor" of the crop. Everything above it
 *  is pile; everything below is margin. Deep enough to seat a 14-slab
 *  pile at 22 + 13 × 5 = 87u without touching the identity strip above. */
const FLOOR_Y = 700;

/* ── Identity strip above each pile ────────────────────────────────── */

const NAME_Y = 60;
const COUNT_Y = 118;
const IDENT_MEASURE = PILE_PITCH - 24;
/* ⚠ NO GLOSS. Same trade as the hand: a 176-unit column cannot letter a
   38-character sentence at a legible size, and the pile's HEIGHT is the
   more direct answer to "what is a pattern" than a prose line beside it. */

export function VariantPiles({ record }: IslVariantProps) {
  return (
    <>
      {record.shapes.map((shape, i) => {
        const pattern = shape.key as SubstrateSkillPattern;
        const inPattern = SAMPLE_SKILLS.filter((s) => s.substrate === pattern);
        const flagship = inPattern.find((s) => s.cut);
        const others = inPattern.filter((s) => s !== flagship);
        const n = inPattern.length;
        const cx = pileX(i);

        /* The pile draws BOTTOM-UP: silhouettes first, flagship on top.
           Bottom slab sits with its base on the floor; each step shifts
           the next slab UP by SLAB_STEP_Y and RIGHT by SLAB_STEP_X. */
        const baseX = cx - SLAB_W / 2 - ((n - 1) * SLAB_STEP_X) / 2;
        const baseY = FLOOR_Y - SLAB_H;

        return (
          <g key={shape.key}>
            {/* Identity, above the pile. */}
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
              fontSize={FS.name * 1.8}
              letterSpacing=".08em"
              fill="var(--pda-ink)"
            >
              {String(n).padStart(2, "0")}
            </text>

            {/* Silhouettes — one slab per non-flagship encode, bottom-up. */}
            {others.map((skill, k) => {
              const sx = baseX + k * SLAB_STEP_X;
              const sy = baseY - k * SLAB_STEP_Y;
              return (
                <g key={skill.id}>
                  <path d={housing(sx, sy, SLAB_W, SLAB_H, SLAB_CUT)} fill="var(--pda-void)" />
                  <path
                    d={housing(sx, sy, SLAB_W, SLAB_H, SLAB_CUT)}
                    fill="rgba(var(--dawn-rgb), 0.05)"
                    stroke="var(--pda-hair)"
                  />
                </g>
              );
            })}

            {/* THE TOP SLAB — flagship, green accent, lettered. */}
            {flagship
              ? (() => {
                  const topK = n - 1;
                  const sx = baseX + topK * SLAB_STEP_X;
                  const sy = baseY - topK * SLAB_STEP_Y;
                  return (
                    <g>
                      <path d={housing(sx, sy, SLAB_W, SLAB_H, SLAB_CUT)} fill="var(--pda-void)" />
                      <path
                        d={housing(sx, sy, SLAB_W, SLAB_H, SLAB_CUT)}
                        fill="rgba(var(--dawn-rgb), 0.08)"
                        stroke="var(--pda-hair2)"
                      />
                      <rect x={sx} y={sy} width={3} height={SLAB_H} fill="var(--pda-grn)" />
                      <text
                        x={sx + 10}
                        y={sy + SLAB_H - 6}
                        fontSize={FS.chrome}
                        letterSpacing=".08em"
                        fill="var(--pda-grn-ink)"
                      >
                        {flagship.shortTitle}
                      </text>
                    </g>
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

export function pilesMarkCount(_record: IslRecord, key: string): number {
  return SAMPLE_SKILLS.filter((s) => s.substrate === key).length;
}

export function pilesLettering(record: IslRecord): LetterSpec[] {
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
      fs: FS.name * 1.8,
      track: TRACK.name,
      measure: IDENT_MEASURE,
    });
    if (flagship) {
      out.push({
        slot: `${shape.key}.flagship`,
        text: flagship.shortTitle,
        fs: FS.chrome,
        track: TRACK.name,
        measure: SLAB_W - 14,
      });
    }
  }
  return out;
}
