import { SAMPLE_SKILLS, type SubstrateSkillPattern } from "./sampleSkills";
import { FS, MODULE, TRACK, housing, type LetterSpec } from "./substrateKit";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 17 · CONSTELLATION — five pattern nodes ring a central total hub.
 *
 * The Cyberpunk 2077 character-attribute wheel draws five attributes as
 * chamfered nodes around a central level readout, each connected to the
 * centre by a braided trunk whose visual weight reads as investment. Ports
 * to substrate → patterns → skills: the hub letters the estate's derived
 * total (47), each of five nodes letters one pattern, and the hub-to-node
 * trunk carries ONE conductor per encoded Skill — so Pattern's fourteen
 * arrives braided against Stakeholder's five.
 *
 * ⚠ THE HUB'S TOTAL IS DERIVED, NEVER TYPED. `hubTotal(record)` sums
 * `record.shapes[k].skills`; a hand-typed 47 would be true at one field
 * shape and wrong forever after.
 *
 * ⚠ THE NODES SEAT ON A PENTAGON, and their positions are ANCHORED at the
 * top by construction: `angleFor(0) = -90°`, so Voice is always on top.
 * Rotating the pentagon would drift the reading order between renders.
 *
 * ⚠ THE MARK COUNT IS THE CONDUCTOR COUNT — a bundle of N line elements,
 * spaced by pitch — so the substrate-lab-fit guard can walk the wires and
 * assert they equal `shape.skills`. A gap between wires wide enough to
 * count would let the reader answer "how much Judgment" by looking.
 */

export const CONSTELLATION_VIEWBOX = "0 0 932 762";

/* ── HUB + PENTAGON ────────────────────────────────────────────────── */

const CX = 466;
const CY = 381;
const HUB_R = 66;
const PENT_R = 260;
const NODE_W = 172;
const NODE_H = 88;

/** Angle of the i-th vertex, with 0 at the top (Voice). */
function angleFor(i: number, n: number): number {
  return -Math.PI / 2 + (i * 2 * Math.PI) / n;
}

/** Pentagon vertex position for node i. */
function nodePos(i: number, n: number): { x: number; y: number } {
  const a = angleFor(i, n);
  return { x: CX + Math.cos(a) * PENT_R, y: CY + Math.sin(a) * PENT_R };
}

/** Where the trunk lands on a node — the node's INNER wall, facing the hub. */
function nodeAnchor(i: number, n: number): { x: number; y: number } {
  const pos = nodePos(i, n);
  const dx = CX - pos.x;
  const dy = CY - pos.y;
  const dist = Math.hypot(dx, dy);
  return { x: pos.x + (dx / dist) * (NODE_W / 2), y: pos.y + (dy / dist) * (NODE_H / 2) };
}

/** The point on the hub's edge nearest a given node. */
function hubAnchor(i: number, n: number): { x: number; y: number } {
  const a = angleFor(i, n);
  return { x: CX + Math.cos(a) * HUB_R, y: CY + Math.sin(a) * HUB_R };
}

/* ── CONDUCTOR BUNDLE ──────────────────────────────────────────────── */

/** Bundle spread in units, perpendicular to the trunk's direction. */
const BUNDLE_SPREAD_MAX = 44;
const BUNDLE_SPREAD_MIN = 12;

function bundlePaths(
  i: number,
  n: number,
  count: number
): { paths: string[]; flagshipIdx: number } {
  const p1 = hubAnchor(i, n);
  const p2 = nodeAnchor(i, n);
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy);
  const nx = -dy / dist; /* Perpendicular. */
  const ny = dx / dist;

  const spread = Math.min(BUNDLE_SPREAD_MAX, BUNDLE_SPREAD_MIN + count * 2.5);
  const step = count > 1 ? spread / (count - 1) : 0;
  const mid = (count - 1) / 2;
  const flagshipIdx = Math.round(mid); /* Middle conductor takes green. */

  const paths: string[] = [];
  for (let k = 0; k < count; k += 1) {
    const off = (k - mid) * step;
    const ax = p1.x + nx * off;
    const ay = p1.y + ny * off;
    const bx = p2.x + nx * off;
    const by = p2.y + ny * off;
    paths.push(`M${ax} ${ay} L${bx} ${by}`);
  }
  return { paths, flagshipIdx };
}

/* ── LETTERING SLOTS ────────────────────────────────────────────────── */

/** The node's identity block — name, count numeral, gloss. */
const NODE_MEASURE = NODE_W - 20;

/** How many patterns the drawing draws — the pentagon's vertex count. */
export const CONSTELLATION_N = 5;

export function VariantConstellation({ record }: IslVariantProps) {
  const hubTotalStr = record.shapes.reduce((n, s) => n + s.skills, 0);
  return (
    <>
      {/* CONDUCTORS FIRST, so nodes sit on top of their ends. */}
      {record.shapes.map((shape, i) => {
        const pattern = shape.key as SubstrateSkillPattern;
        const inPattern = SAMPLE_SKILLS.filter((s) => s.substrate === pattern);
        const { paths, flagshipIdx } = bundlePaths(i, CONSTELLATION_N, inPattern.length);
        return (
          <g key={`bundle-${shape.key}`}>
            {paths.map((d, k) => (
              <path
                key={k}
                d={d}
                fill="none"
                stroke={k === flagshipIdx ? "var(--pda-grn)" : "var(--pda-amb)"}
                strokeOpacity={k === flagshipIdx ? 0.9 : 0.42}
              />
            ))}
          </g>
        );
      })}

      {/* THE HUB — a chamfered diamond that letters the total. */}
      <g>
        <rect
          x={CX - HUB_R}
          y={CY - HUB_R}
          width={HUB_R * 2}
          height={HUB_R * 2}
          transform={`rotate(45 ${CX} ${CY})`}
          fill="var(--pda-void)"
          stroke="var(--pda-hair2)"
        />
        <text
          x={CX}
          y={CY - 6}
          textAnchor="middle"
          fontSize={FS.name * 1.6}
          letterSpacing=".08em"
          fill="var(--pda-ink)"
        >
          {String(hubTotalStr).padStart(2, "0")}
        </text>
        <text
          x={CX}
          y={CY + 22}
          textAnchor="middle"
          fontSize={FS.chrome}
          letterSpacing=".22em"
          fill="var(--pda-txt3)"
        >
          SUBSTRATE
        </text>
      </g>

      {/* NODES — one per pattern, ringed. */}
      {record.shapes.map((shape, i) => {
        const pos = nodePos(i, CONSTELLATION_N);
        const pattern = shape.key as SubstrateSkillPattern;
        const inPattern = SAMPLE_SKILLS.filter((s) => s.substrate === pattern);
        const flagship = inPattern.find((s) => s.cut);
        const nx = pos.x - NODE_W / 2;
        const ny = pos.y - NODE_H / 2;
        return (
          <g key={`node-${shape.key}`}>
            <path d={housing(nx, ny, NODE_W, NODE_H, MODULE.cut)} fill="var(--pda-void)" />
            <path
              d={housing(nx, ny, NODE_W, NODE_H, MODULE.cut)}
              fill="rgba(var(--dawn-rgb), 0.05)"
              stroke="var(--pda-hair2)"
            />
            <text
              x={nx + 10}
              y={ny + 22}
              fontSize={FS.key}
              fontWeight={700}
              letterSpacing=".14em"
              fill="var(--pda-txt)"
            >
              {shape.name}
            </text>
            <text
              x={nx + NODE_W - 10}
              y={ny + 22}
              textAnchor="end"
              fontSize={FS.key}
              letterSpacing=".14em"
              fill="var(--pda-ink)"
            >
              {String(inPattern.length).padStart(2, "0")}
            </text>
            {flagship ? (
              <>
                <rect x={nx + 10} y={ny + 36} width={3} height={14} fill="var(--pda-grn)" />
                <text
                  x={nx + 20}
                  y={ny + 48}
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
    </>
  );
}

/* ── LETTERING SPEC and MARK-COUNT HELPER ────────────────────────────── */

export function constellationMarkCount(_record: IslRecord, key: string): number {
  return SAMPLE_SKILLS.filter((s) => s.substrate === key).length;
}

export function constellationLettering(record: IslRecord): LetterSpec[] {
  const out: LetterSpec[] = [];
  const total = record.shapes.reduce((n, s) => n + s.skills, 0);

  out.push({
    slot: "hub.total",
    text: String(total).padStart(2, "0"),
    fs: FS.name * 1.6,
    track: TRACK.name,
    measure: HUB_R * 1.6,
  });
  out.push({
    slot: "hub.label",
    text: "SUBSTRATE",
    fs: FS.chrome,
    track: 0.22,
    measure: HUB_R * 1.8,
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
      measure: NODE_MEASURE - 30,
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
        measure: NODE_MEASURE - 10,
      });
    }
  }
  return out;
}
