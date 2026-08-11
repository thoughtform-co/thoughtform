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
 * 3 · CONTAINMENT — the hierarchy, drawn as one.
 *
 * Skill → pattern → reuse has always been a tree; this variant stops
 * pretending it is a network. One encoded substrate on the left, branching
 * into five patterns sized by what they hold, each carrying the departments
 * that draw on it as its own leaves.
 *
 * ⚠ REPETITION INSTEAD OF EDGES is the trade, and it is the point. A
 * department that draws on four patterns appears four times as a three-letter
 * code rather than as four curves crossing the field. Thirty runs become
 * thirty codes, nothing crosses anything, and the column read production
 * offered by accident is given up on purpose — this variant answers "what is
 * IN the substrate", where `strata` and `table` answer "who draws on it".
 *
 * ⚠ `CUT BY` STAYS ON THE NODE even though the trenching department's code
 * is already marked in the leaf block. This surface has NO LEGEND by law, so
 * a green code with nothing to decode it would be a mark the reader cannot
 * resolve; the line makes the mark a confirmation rather than the only
 * carrier.
 */

export const TREE_VIEWBOX = SUB_VIEWBOX;

const ROOT = { x: L, w: 204 } as const;
const ROOT_PAD = 14;
const ROOT_MEASURE = ROOT.w - ROOT_PAD * 2;
const SPINE_X = L + ROOT.w / 2;

const NODE = { x: 270, w: 380 } as const;
const NODE_PAD = 14;
const NODE_MEASURE = NODE.w - NODE_PAD * 2;

const LEAF_X = 690;
const LEAF_COLS = 4;
const LEAF_PITCH = (R - LEAF_X) / LEAF_COLS;
const LEAF_ROW = 22;
const LEAF_MEASURE = LEAF_PITCH - 8;

const TOP = 60;
const GAP = 16;
const NODE_BASE = 60;
const NODE_SPAN = 312;

function layout(record: IslRecord) {
  const shapes = byMass(record.shapes);
  const total = totalSkills(record.shapes);
  let y = TOP;
  const nodes = shapes.map((s) => {
    const h = NODE_BASE + (s.skills / total) * NODE_SPAN;
    const node = { s, y, h, cy: y + h / 2 };
    y += h + GAP;
    return node;
  });
  return nodes;
}

export function VariantTree({ record }: IslVariantProps) {
  const nodes = layout(record);
  const total = totalSkills(record.shapes);
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  const rootCy = (first.cy + last.cy) / 2;

  return (
    <>
      <SubstrateHatch />

      {/* THE TRUNK. One substrate, and the only place the total is lettered —
          every other number on this drawing is a part of it. */}
      <path
        d={housing(ROOT.x, rootCy - 34, ROOT.w, 68, 10)}
        fill="var(--pda-void)"
        stroke="var(--pda-amb)"
      />
      <path d={housing(ROOT.x, rootCy - 34, ROOT.w, 68, 10)} fill="url(#isl-hatch)" />
      <text
        x={ROOT.x + ROOT_PAD}
        y={rootCy - 12}
        fontSize={FS.chrome}
        letterSpacing=".14em"
        fill="var(--pda-txt3)"
      >
        ENCODED SUBSTRATE
      </text>
      <text
        x={ROOT.x + ROOT_PAD}
        y={rootCy + 16}
        fontSize={FS.hero}
        fontWeight={700}
        letterSpacing=".02em"
        fill="var(--pda-txt)"
      >
        {`${total} SKILLS`}
      </text>

      {/* The spine, and one orthogonal branch per pattern. Nothing crosses. */}
      <line
        x1={SPINE_X}
        y1={first.cy}
        x2={SPINE_X}
        y2={last.cy}
        stroke="var(--pda-amb)"
        strokeOpacity="0.5"
      />
      {nodes.map(({ s, cy }) => (
        <line
          key={`br-${s.key}`}
          x1={SPINE_X}
          y1={cy}
          x2={NODE.x}
          y2={cy}
          stroke="var(--pda-amb)"
          strokeOpacity="0.5"
        />
      ))}

      {nodes.map(({ s, y, h, cy }) => {
        const leaves = tappers(record.teams, s.key);
        const rows = Math.ceil(leaves.length / LEAF_COLS);
        const firstBase = cy - ((rows - 1) * LEAF_ROW) / 2 + 4;
        return (
          <g key={s.key}>
            <path d={housing(NODE.x, y, NODE.w, h, 12)} fill="var(--pda-void)" />
            <path d={housing(NODE.x, y, NODE.w, h, 12)} fill="url(#isl-hatch)" />
            <path d={housing(NODE.x, y, NODE.w, h, 12)} fill="none" stroke="var(--pda-hair2)" />
            <line
              x1={NODE.x}
              y1={y + 1}
              x2={NODE.x + NODE.w - 12}
              y2={y + 1}
              stroke="var(--pda-amb)"
              strokeWidth="2"
              strokeOpacity="0.55"
            />

            <text
              x={NODE.x + NODE_PAD}
              y={y + 30}
              fontSize={FS.name}
              fontWeight={700}
              letterSpacing=".08em"
              fill="var(--pda-txt)"
            >
              {s.name}
            </text>
            <text
              x={NODE.x + NODE.w - NODE_PAD}
              y={y + 30}
              textAnchor="end"
              fontSize={FS.chrome}
              letterSpacing=".14em"
              fill="var(--pda-grn-ink)"
            >
              {`CUT BY ${s.trenchedBy}`}
            </text>
            <text
              x={NODE.x + NODE_PAD}
              y={y + 52}
              fontSize={FS.gloss}
              letterSpacing=".08em"
              fill="var(--pda-txt2)"
            >
              {s.gloss}
            </text>
            <text
              x={NODE.x + NODE_PAD}
              y={y + 74}
              fontSize={FS.chrome}
              letterSpacing=".14em"
              fill="var(--pda-ink)"
            >
              {`${s.skills} SKILLS`}
            </text>

            {/* The leaves — the departments that draw on this pattern, and
                only those. An absent code is a department that does not. */}
            <line
              x1={NODE.x + NODE.w}
              y1={cy}
              x2={LEAF_X}
              y2={cy}
              stroke="var(--pda-dim)"
              strokeOpacity="0.5"
            />
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
  const nodes = layout(record);
  const total = totalSkills(record.shapes);
  return [
    {
      slot: "root.label",
      text: "ENCODED SUBSTRATE",
      fs: FS.chrome,
      track: TRACK.chrome,
      measure: ROOT_MEASURE,
    },
    {
      slot: "root.total",
      text: `${total} SKILLS`,
      fs: FS.hero,
      track: 0.02,
      measure: ROOT_MEASURE,
    },
    ...nodes.flatMap(({ s }) => [
      /* The name shares its baseline with CUT BY, so they split the node
         between them; the gloss and the Skills line each own one. */
      ...shapeSpecs(s, {
        name: NODE_MEASURE - 110,
        gloss: NODE_MEASURE,
        meta: NODE_MEASURE / 2,
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
