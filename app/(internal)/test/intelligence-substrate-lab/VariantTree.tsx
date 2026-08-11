import {
  FS,
  L,
  R,
  SUB_VIEWBOX,
  SubstrateHatch,
  TRACK,
  byMass,
  housing,
  shapeSpecs,
  tappers,
  totalSkills,
  type LetterSpec,
} from "./substrateKit";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 3 · CONTAINMENT — the hierarchy, drawn as one. (Round two.)
 *
 * Skill → pattern → reuse has always been a tree; this variant stops
 * pretending it is a network. Round one drew that as a trunk with five
 * branches. Three things were wrong with it, and all three are fixed here:
 *
 * ⚠ **THE BRANCHES CARRIED NO INFORMATION.** Every node hung off the same
 * single root, and there is no case where a pattern is NOT in the substrate —
 * so five lines from one trunk said nothing five times. **Nesting is the same
 * statement with no ink**: one frame around five blocks, and the relation is
 * the containment itself. The spine, the elbows and the leaf runs are gone.
 *
 * ⚠ **THE NODE BODIES WERE EMPTY.** Height was proportional to Skills and the
 * space below the gloss was blank hatch, which is the hole ADR-070 U14 just
 * finished removing from reading 02 — a taller box with nothing in it reads
 * as a gap, not as mass. The height is now EXACTLY its contents: a core
 * sample down the block's left edge, **one pip per Skill**, and the block is
 * `28 + skills × 8.9` tall because that is how tall its pips are. Fourteen
 * against five is a 2.1× read you can also count.
 *
 * ⚠ **THE LEFT THIRD WAS DEAD.** The trunk plate floated in it with the spine
 * beside it. The total is a header now, so the blocks take the full width and
 * the gloss — 38 characters at the record's longest — has 528 units instead
 * of 352.
 *
 * What survives from round one: departments are REPEATED as codes under every
 * pattern they draw on rather than wired to it, so nothing crosses anything;
 * and `CUT BY` stays lettered even though the cutting department's code is
 * marked, because this surface has NO LEGEND by law and a green code with
 * nothing to decode it is a mark the reader cannot resolve.
 */

export const TREE_VIEWBOX = SUB_VIEWBOX;

/* The one frame everything is inside. */
const FRAME = { x: L, y: 26, w: R - L, h: 710 } as const;
const IN_PAD = 18;
const IN_L = FRAME.x + IN_PAD;
const IN_R = FRAME.x + FRAME.w - IN_PAD;

const HEAD_H = 66;
const BODY_TOP = FRAME.y + HEAD_H + 8;

/** The core sample: one pip per Skill, down the block's left edge. */
const PIP = { col: 20, size: 7, pitch: 8.9, top: 16 } as const;
const BLOCK_PAD = 28;
const GAP = 14;

const ID_X = IN_L + PIP.col + 8;
const ID_R = 600;
const ID_MEASURE = ID_R - ID_X;
/** The right column of each row is a pinned pair, so the two share the width
 *  between them and the gap in the middle is what stops them meeting. */
const META_MEASURE = 150;

const LEAF_X = 620;
const LEAF_COLS = 3;
const LEAF_PITCH = (IN_R - LEAF_X) / LEAF_COLS;
const LEAF_ROW = 22;
const LEAF_MEASURE = LEAF_PITCH - 8;

const blockH = (skills: number) => BLOCK_PAD + skills * PIP.pitch;

function layout(record: IslRecord) {
  const shapes = byMass(record.shapes);
  let y = BODY_TOP;
  return shapes.map((s) => {
    const h = blockH(s.skills);
    const block = { s, y, h, cy: y + h / 2 };
    y += h + GAP;
    return block;
  });
}

export function VariantTree({ record }: IslVariantProps) {
  const blocks = layout(record);
  const total = totalSkills(record.shapes);

  return (
    <>
      <SubstrateHatch />

      {/* THE SUBSTRATE — one frame, and everything on the reading is inside
          it. This is the relation round one spent five lines on. */}
      <path d={housing(FRAME.x, FRAME.y, FRAME.w, FRAME.h, 14)} fill="var(--pda-void)" />
      <path d={housing(FRAME.x, FRAME.y, FRAME.w, FRAME.h, 14)} fill="url(#isl-hatch)" />
      <path
        d={housing(FRAME.x, FRAME.y, FRAME.w, FRAME.h, 14)}
        fill="none"
        stroke="var(--pda-amb)"
      />
      <line
        x1={FRAME.x}
        y1={FRAME.y + 1}
        x2={FRAME.x + FRAME.w - 14}
        y2={FRAME.y + 1}
        stroke="var(--pda-amb)"
        strokeWidth="2"
      />

      <text
        x={IN_L}
        y={FRAME.y + 26}
        fontSize={FS.chrome}
        letterSpacing=".14em"
        fill="var(--pda-txt3)"
      >
        ENCODED SUBSTRATE
      </text>
      <text
        x={IN_L}
        y={FRAME.y + 56}
        fontSize={FS.hero}
        fontWeight={700}
        letterSpacing=".02em"
        fill="var(--pda-txt)"
      >
        {`${total} SKILLS`}
      </text>
      {/* ⚠ ONE CAPTION FOR ALL FIVE ROWS. The codes on the right would
          otherwise be an unlabelled mark, and there is no legend on this
          surface to resolve one. */}
      <text
        x={IN_R}
        y={FRAME.y + 56}
        textAnchor="end"
        fontSize={FS.chrome}
        letterSpacing=".14em"
        fill="var(--pda-txt3)"
      >
        DRAWN ON BY
      </text>
      <line
        x1={IN_L}
        y1={FRAME.y + HEAD_H}
        x2={IN_R}
        y2={FRAME.y + HEAD_H}
        stroke="var(--pda-hair2)"
      />

      {blocks.map(({ s, y, h, cy }) => {
        const leaves = tappers(record.teams, s.key);
        const rows = Math.ceil(leaves.length / LEAF_COLS);
        const firstBase = cy - ((rows - 1) * LEAF_ROW) / 2 + 4;
        return (
          <g key={s.key}>
            <path d={housing(IN_L, y, IN_R - IN_L, h, 10)} fill="var(--pda-void)" />
            <path d={housing(IN_L, y, IN_R - IN_L, h, 10)} fill="none" stroke="var(--pda-hair2)" />

            {/* THE CORE SAMPLE — one pip per Skill. The block is exactly as
                tall as this column, so the height is the count rather than a
                proportion of it. */}
            {Array.from({ length: s.skills }, (_, k) => (
              <rect
                key={k}
                x={IN_L + PIP.col / 2 - PIP.size / 2}
                y={y + PIP.top + k * PIP.pitch}
                width={PIP.size}
                height={PIP.size}
                fill="var(--pda-amb)"
                fillOpacity="0.55"
              />
            ))}

            <text
              x={ID_X}
              y={y + 32}
              fontSize={FS.name}
              fontWeight={700}
              letterSpacing=".08em"
              fill="var(--pda-txt)"
            >
              {s.name}
            </text>
            <text
              x={ID_R}
              y={y + 32}
              textAnchor="end"
              fontSize={FS.chrome}
              letterSpacing=".14em"
              fill="var(--pda-ink)"
            >
              {`${s.skills} SKILLS`}
            </text>
            <text
              x={ID_X}
              y={y + 56}
              fontSize={FS.gloss}
              letterSpacing=".08em"
              fill="var(--pda-txt2)"
            >
              {s.gloss}
            </text>
            <text
              x={ID_R}
              y={y + 56}
              textAnchor="end"
              fontSize={FS.chrome}
              letterSpacing=".14em"
              fill="var(--pda-grn-ink)"
            >
              {`CUT BY ${s.trenchedBy}`}
            </text>

            {/* The departments that draw on this pattern, and only those. An
                absent code is a department that does not. */}
            {leaves.map((t, k) => {
              const cutter = t.trenched === s.key;
              return (
                <text
                  key={`${s.key}-${t.id}`}
                  x={LEAF_X + LEAF_PITCH / 2 + (k % LEAF_COLS) * LEAF_PITCH}
                  y={firstBase + Math.floor(k / LEAF_COLS) * LEAF_ROW}
                  textAnchor="middle"
                  fontSize={FS.key}
                  letterSpacing=".18em"
                  fill={cutter ? "var(--pda-grn-ink)" : "var(--pda-txt2)"}
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

export function treeLettering(record: IslRecord): LetterSpec[] {
  const blocks = layout(record);
  const total = totalSkills(record.shapes);
  return [
    {
      slot: "root.label",
      text: "ENCODED SUBSTRATE",
      fs: FS.chrome,
      track: TRACK.chrome,
      measure: 300,
    },
    { slot: "root.total", text: `${total} SKILLS`, fs: FS.hero, track: 0.02, measure: 300 },
    {
      slot: "root.caption",
      text: "DRAWN ON BY",
      fs: FS.chrome,
      track: TRACK.chrome,
      measure: IN_R - LEAF_X,
    },
    ...blocks.flatMap(({ s }) => [
      ...shapeSpecs(s, {
        /* The name and the gloss each share their baseline with a pinned
           right-hand fact, so the identity column is what is left of the row
           once that pair has taken its measure. */
        name: ID_MEASURE - META_MEASURE,
        gloss: ID_MEASURE - META_MEASURE,
        meta: META_MEASURE,
      }),
      ...tappers(record.teams, s.key).map((t) => ({
        slot: `${s.key}.leaf.${t.id}`,
        text: t.ab,
        fs: FS.key,
        track: TRACK.code,
        measure: LEAF_MEASURE,
      })),
    ]),
  ];
}
