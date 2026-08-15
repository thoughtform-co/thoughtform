import { SAMPLE_SKILLS, type SubstrateSkillPattern } from "./sampleSkills";
import { FS, L, R, TRACK, housing, type LetterSpec } from "./substrateKit";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 18 · LOOM — five pattern chips on the LEFT braid into ONE shared
 * substrate chip on the right, one wire per encoded Skill.
 *
 * The Cyberpunk 2077 citizens-database reference draws two chips joined
 * by a fan of ribbon wires — the count is the connection's weight, not
 * a number beside a label. Ports directly to the substrate's argument:
 * every pattern hands over N conductors, they braid at the crop's centre,
 * they land on the SUBSTRATE chip together. Forty-seven wires arriving on
 * one thing is exactly the encoded-once-tapped-by-many claim, drawn.
 *
 * ⚠ THE CONVERGENCE IS THE READING. The wires are the drawing's mass and
 * the reader answers "how much Judgment?" by looking, not by adding.
 * Twelve wires braid visibly heavier than five; a five-wire pattern reads
 * thin against a fourteen-wire.
 *
 * ⚠ THE FLAGSHIP WIRE IS GREEN. One wire per pattern lettered by
 * proximity to the label — the flagship's `shortTitle` sits at the
 * pattern chip's face, aligned to the green wire's departure point.
 *
 * ⚠ THE RIGHT CHIP LABELS ITSELF SUBSTRATE. It does NOT letter the total:
 * this reading already argues that everything is one substrate, and a
 * numeral on top of the argument is the argument said twice.
 */

export const LOOM_VIEWBOX = "0 0 932 762";

/* ── LEFT (per-pattern) chips ──────────────────────────────────────── */

const PATTERNS = 5;
const LEFT_X = L;
const LEFT_W = 224;
const CHIP_H = 116;
const CHIP_GAP = 20;
const LEFT_STACK_TOP = 24;
const LEFT_STACK_H = PATTERNS * CHIP_H + (PATTERNS - 1) * CHIP_GAP;

const leftChipY = (i: number) => LEFT_STACK_TOP + i * (CHIP_H + CHIP_GAP);

/* ── RIGHT (shared substrate) chip ─────────────────────────────────── */

const RIGHT_W = 176;
const RIGHT_X = R - RIGHT_W;
const RIGHT_Y = LEFT_STACK_TOP + 40;
const RIGHT_H = LEFT_STACK_H - 80;

/* ── WIRE FIELD ────────────────────────────────────────────────────── */

const WIRE_ORIGIN_X = LEFT_X + LEFT_W;
const WIRE_TERM_X = RIGHT_X;
/** Half-way across the crop, the wires braid into one bus. */
const BRAID_X = (WIRE_ORIGIN_X + WIRE_TERM_X) / 2;

/** The wires leave the pattern chip's right edge in a vertical spread and
 *  land on the substrate chip's left edge in a matching vertical spread. */
const CHIP_WIRE_PAD = 10;
function wireOriginY(chipTop: number, k: number, count: number): number {
  const inset = 12;
  const usable = CHIP_H - inset * 2;
  const step = count > 1 ? usable / (count - 1) : 0;
  return chipTop + inset + k * step + (count === 1 ? usable / 2 : 0);
}

/** All 47 wires land on the right chip; each pattern's wires arrive in a
 *  contiguous band, so the substrate chip visually reads five clusters. */
function wireTermY(patternIdx: number, k: number, counts: readonly number[]): number {
  const total = counts.reduce((a, b) => a + b, 0);
  let offset = 0;
  for (let p = 0; p < patternIdx; p += 1) offset += counts[p];
  const cumulative = offset + k;
  const inset = 14;
  const usable = RIGHT_H - inset * 2;
  return RIGHT_Y + inset + (cumulative / Math.max(1, total - 1)) * usable;
}

/** One wire's path: origin → braid handle → termination. Uses a Bézier
 *  so the ribbon reads soft in the middle without straying from a bus. */
function wirePath(o: { x: number; y: number }, t: { x: number; y: number }): string {
  const c1x = BRAID_X - 20;
  const c2x = BRAID_X + 20;
  return `M${o.x} ${o.y} C${c1x} ${o.y} ${c2x} ${t.y} ${t.x} ${t.y}`;
}

export function VariantLoom({ record }: IslVariantProps) {
  const counts = record.shapes.map(
    (s) => SAMPLE_SKILLS.filter((sk) => sk.substrate === s.key).length
  );

  return (
    <>
      {/* WIRES FIRST, so the chips overpaint their departure points. */}
      {record.shapes.map((shape, i) => {
        const pattern = shape.key as SubstrateSkillPattern;
        const inPattern = SAMPLE_SKILLS.filter((sk) => sk.substrate === pattern);
        const flagshipIdx = inPattern.findIndex((sk) => sk.cut);
        const chipTop = leftChipY(i);
        return (
          <g key={`wires-${shape.key}`}>
            {inPattern.map((skill, k) => {
              const o = {
                x: WIRE_ORIGIN_X + CHIP_WIRE_PAD,
                y: wireOriginY(chipTop, k, inPattern.length),
              };
              const t = { x: WIRE_TERM_X - CHIP_WIRE_PAD, y: wireTermY(i, k, counts) };
              const isFlag = k === flagshipIdx;
              return (
                <path
                  key={skill.id}
                  d={wirePath(o, t)}
                  fill="none"
                  stroke={isFlag ? "var(--pda-grn)" : "var(--pda-amb)"}
                  strokeOpacity={isFlag ? 0.9 : 0.4}
                />
              );
            })}
          </g>
        );
      })}

      {/* LEFT CHIPS — one per pattern. */}
      {record.shapes.map((shape, i) => {
        const pattern = shape.key as SubstrateSkillPattern;
        const inPattern = SAMPLE_SKILLS.filter((sk) => sk.substrate === pattern);
        const flagship = inPattern.find((sk) => sk.cut);
        const y = leftChipY(i);
        return (
          <g key={`chip-${shape.key}`}>
            <path d={housing(LEFT_X, y, LEFT_W, CHIP_H, 12)} fill="var(--pda-void)" />
            <path
              d={housing(LEFT_X, y, LEFT_W, CHIP_H, 12)}
              fill="rgba(var(--dawn-rgb), 0.05)"
              stroke="var(--pda-hair2)"
            />
            <text
              x={LEFT_X + 14}
              y={y + 24}
              fontSize={FS.key}
              fontWeight={700}
              letterSpacing=".14em"
              fill="var(--pda-txt)"
            >
              {shape.name}
            </text>
            <text
              x={LEFT_X + LEFT_W - 14}
              y={y + 24}
              textAnchor="end"
              fontSize={FS.key}
              letterSpacing=".14em"
              fill="var(--pda-ink)"
            >
              {String(inPattern.length).padStart(2, "0")}
            </text>
            {flagship ? (
              <>
                <rect x={LEFT_X + 14} y={y + 50} width={3} height={14} fill="var(--pda-grn)" />
                <text
                  x={LEFT_X + 24}
                  y={y + 62}
                  fontSize={FS.chrome}
                  letterSpacing=".08em"
                  fill="var(--pda-grn-ink)"
                >
                  {flagship.shortTitle}
                </text>
              </>
            ) : null}
          </g>
        );
      })}

      {/* RIGHT CHIP — the one shared substrate. */}
      <path d={housing(RIGHT_X, RIGHT_Y, RIGHT_W, RIGHT_H, 12)} fill="var(--pda-void)" />
      <path
        d={housing(RIGHT_X, RIGHT_Y, RIGHT_W, RIGHT_H, 12)}
        fill="rgba(var(--dawn-rgb), 0.06)"
        stroke="var(--pda-hair2)"
      />
      <text
        x={RIGHT_X + RIGHT_W / 2}
        y={RIGHT_Y + 32}
        textAnchor="middle"
        fontSize={FS.name}
        fontWeight={700}
        letterSpacing=".18em"
        fill="var(--pda-txt)"
      >
        SUBSTRATE
      </text>
      <text
        x={RIGHT_X + RIGHT_W / 2}
        y={RIGHT_Y + RIGHT_H - 24}
        textAnchor="middle"
        fontSize={FS.chrome}
        letterSpacing=".14em"
        fill="var(--pda-txt2)"
      >
        ENCODED ONCE
      </text>
      <text
        x={RIGHT_X + RIGHT_W / 2}
        y={RIGHT_Y + RIGHT_H - 8}
        textAnchor="middle"
        fontSize={FS.chrome}
        letterSpacing=".14em"
        fill="var(--pda-txt2)"
      >
        TAPPED BY THE NEXT
      </text>
    </>
  );
}

/* ── LETTERING SPEC and MARK-COUNT HELPER ────────────────────────────── */

export function loomMarkCount(_record: IslRecord, key: string): number {
  return SAMPLE_SKILLS.filter((s) => s.substrate === key).length;
}

export function loomLettering(record: IslRecord): LetterSpec[] {
  const out: LetterSpec[] = [];
  for (const shape of record.shapes) {
    const pattern = shape.key as SubstrateSkillPattern;
    const inPattern = SAMPLE_SKILLS.filter((s) => s.substrate === pattern);
    const flagship = inPattern.find((s) => s.cut);
    out.push({
      slot: `${shape.key}.name`,
      text: shape.name,
      fs: FS.key,
      track: TRACK.chrome,
      measure: LEFT_W - 60,
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
        measure: LEFT_W - 40,
      });
    }
  }
  out.push({
    slot: "substrate.name",
    text: "SUBSTRATE",
    fs: FS.name,
    track: 0.18,
    measure: RIGHT_W - 16,
  });
  out.push({
    slot: "substrate.claim1",
    text: "ENCODED ONCE",
    fs: FS.chrome,
    track: TRACK.chrome,
    measure: RIGHT_W - 12,
  });
  out.push({
    slot: "substrate.claim2",
    text: "TAPPED BY THE NEXT",
    fs: FS.chrome,
    track: TRACK.chrome,
    measure: RIGHT_W - 12,
  });
  return out;
}
