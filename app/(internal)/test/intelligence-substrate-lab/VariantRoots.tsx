import { SAMPLE_SKILLS, type SubstrateSkillPattern } from "./sampleSkills";
import { FS, L, R, TRACK, housing, type LetterSpec } from "./substrateKit";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 20 · ROOTS — five trunks rise from ONE shared substrate bus.
 *
 * The Cyberpunk 2077 industrial monitors reference draws a distribution
 * bus at the base with modules rising above it — the bus is what powers
 * the record, the modules are what draws on it. Ports directly to the
 * substrate: the bus IS the shared substrate, the trunks are patterns,
 * the branches are encoded skills. The claim the reading exists to make
 * (encoded once, tapped by many) is drawn explicitly by the trunks
 * sharing one bus.
 *
 * ⚠ FIVE TRUNKS RISE FROM ONE BUS. The bus is a hairline across the
 * crop's floor; each trunk plants on it at an evenly-spaced x. Branch
 * stubs alternate left and right of the trunk so a fourteen-branch trunk
 * does not visually crash into its neighbour. Trunk HEIGHT is proportional
 * to the branch count — a fourteen is visibly taller than a five — but
 * the bus is at a single y for all five, since the shared bus is the
 * whole argument.
 *
 * ⚠ THE FLAGSHIP BRANCH IS LONGER AND LETTERED. Its stub extends past
 * the neighbouring stubs by half a stub length, takes green, and its
 * `shortTitle` letters horizontally at its far end. The rest are silent
 * silhouettes, so the reading is (as ever on this surface) "how much"
 * plus "an example".
 */

export const ROOTS_VIEWBOX = "0 0 932 762";

/* ── FIVE TRUNKS on ONE bus ────────────────────────────────────────── */

const TRUNKS = 5;
const BUS_Y = 690;
const TRUNK_PITCH = (R - L) / TRUNKS;
const trunkX = (i: number) => L + TRUNK_PITCH * i + TRUNK_PITCH / 2;

/** Trunk height per branch. A trunk with 14 branches rises 14 × 22 + head =
 *  ~350u, a trunk with 5 rises ~130u. Distinguishable at a glance. */
const BRANCH_PITCH = 22;
const TRUNK_TOP_PAD = 60; /* head plate + gap above the top branch. */

/** Branch stubs — thin, alternating sides. */
const STUB_LEN = 44;
const FLAG_STUB_LEN = STUB_LEN + 26;

/* ── HEAD PLATE at each trunk's top ────────────────────────────────── */

/** ⚠ 156, NOT 132. `VALIDATION` at fs 12.5 track .14 is 92.5u; the head's
 *  name column needs at least that plus a 30u count column plus a 20u
 *  internal pad. 156 gives 106u of name column against 92.5 of demand. */
const HEAD_W = 156;
const HEAD_H = 30;
const IDENT_MEASURE = HEAD_W - 20;

export function VariantRoots({ record }: IslVariantProps) {
  return (
    <>
      {/* THE BUS — the shared substrate, one hairline the width of the crop. */}
      <line x1={L} y1={BUS_Y} x2={R} y2={BUS_Y} stroke="var(--pda-hair2)" strokeWidth="2" />
      <text x={L} y={BUS_Y + 22} fontSize={FS.chrome} letterSpacing=".22em" fill="var(--pda-txt3)">
        SUBSTRATE · ENCODED ONCE
      </text>

      {record.shapes.map((shape, i) => {
        const pattern = shape.key as SubstrateSkillPattern;
        const inPattern = SAMPLE_SKILLS.filter((s) => s.substrate === pattern);
        const flagshipIdx = inPattern.findIndex((s) => s.cut);
        const flagship = flagshipIdx >= 0 ? inPattern[flagshipIdx] : undefined;
        const n = inPattern.length;
        const cx = trunkX(i);
        /* ⚠ FLAGSHIP LABELS TURN INWARD. On the rightmost trunks a label
           extending right past the flagship stub runs off the crop (14
           chars × 8.16u = 114u past the stub); the fix is to letter the
           flagship on the side that FACES THE CENTRE, so its label always
           extends into the crop's interior. Left half → flagship on the
           right; right half → flagship on the left. */
        const flagSide = i < TRUNKS / 2 ? 1 : -1;
        const trunkH = n * BRANCH_PITCH + TRUNK_TOP_PAD;
        const trunkTop = BUS_Y - trunkH;
        const headTop = trunkTop - HEAD_H;

        return (
          <g key={shape.key}>
            {/* THE TRUNK — vertical hairline from bus to head plate. */}
            <line x1={cx} y1={BUS_Y} x2={cx} y2={trunkTop} stroke="var(--pda-hair2)" />

            {/* BRANCHES — one stub per encoded Skill. Alternating sides
                lets a fourteen-branch trunk not visually crash its
                neighbour. The FLAGSHIP always sits on the inward side
                (`flagSide`), overriding the alternation — otherwise a
                rightmost trunk's flagship label runs off the crop. */}
            {inPattern.map((skill, k) => {
              const stubY = BUS_Y - 30 - k * BRANCH_PITCH;
              const isFlag = k === flagshipIdx;
              const side = isFlag ? flagSide : k % 2 === 0 ? -1 : 1;
              const len = isFlag ? FLAG_STUB_LEN : STUB_LEN;
              const stroke = isFlag ? "var(--pda-grn)" : "var(--pda-amb)";
              const alpha = isFlag ? 0.95 : 0.5;
              return (
                <g key={skill.id}>
                  <line
                    x1={cx}
                    y1={stubY}
                    x2={cx + side * len}
                    y2={stubY}
                    stroke={stroke}
                    strokeOpacity={alpha}
                  />
                  {isFlag && flagship ? (
                    <text
                      x={cx + side * (len + 4)}
                      y={stubY + 4}
                      textAnchor={side < 0 ? "end" : "start"}
                      fontSize={FS.chrome}
                      letterSpacing=".08em"
                      fill="var(--pda-grn-ink)"
                    >
                      {flagship.shortTitle}
                    </text>
                  ) : null}
                </g>
              );
            })}

            {/* HEAD PLATE — pattern name, count, gloss. */}
            <path
              d={housing(cx - HEAD_W / 2, headTop, HEAD_W, HEAD_H, 10)}
              fill="var(--pda-void)"
            />
            <path
              d={housing(cx - HEAD_W / 2, headTop, HEAD_W, HEAD_H, 10)}
              fill="rgba(var(--dawn-rgb), 0.05)"
              stroke="var(--pda-hair2)"
            />
            <text
              x={cx - HEAD_W / 2 + 10}
              y={headTop + 20}
              fontSize={FS.key}
              fontWeight={700}
              letterSpacing=".14em"
              fill="var(--pda-txt)"
            >
              {shape.name}
            </text>
            <text
              x={cx + HEAD_W / 2 - 10}
              y={headTop + 20}
              textAnchor="end"
              fontSize={FS.key}
              letterSpacing=".14em"
              fill="var(--pda-ink)"
            >
              {String(n).padStart(2, "0")}
            </text>
          </g>
        );
      })}
    </>
  );
}

/* ── LETTERING SPEC and MARK-COUNT HELPER ────────────────────────────── */

export function rootsMarkCount(_record: IslRecord, key: string): number {
  return SAMPLE_SKILLS.filter((s) => s.substrate === key).length;
}

export function rootsLettering(record: IslRecord): LetterSpec[] {
  const out: LetterSpec[] = [];
  out.push({
    slot: "bus.claim",
    text: "SUBSTRATE · ENCODED ONCE",
    fs: FS.chrome,
    track: 0.22,
    measure: R - L,
  });
  for (const shape of record.shapes) {
    const pattern = shape.key as SubstrateSkillPattern;
    const inPattern = SAMPLE_SKILLS.filter((s) => s.substrate === pattern);
    const flagship = inPattern.find((s) => s.cut);
    out.push({
      slot: `${shape.key}.name`,
      text: shape.name,
      fs: FS.key,
      track: TRACK.chrome,
      measure: IDENT_MEASURE - 30,
    });
    out.push({
      slot: `${shape.key}.count`,
      text: String(inPattern.length).padStart(2, "0"),
      fs: FS.key,
      track: TRACK.chrome,
      measure: 30,
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
