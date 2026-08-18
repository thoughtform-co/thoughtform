"use client";

import { useMemo, useState } from "react";

import type { CaseMapShapeKey, CaseSkillEntry } from "@/lib/cases/types";

import { wrapLines } from "@/components/landing/home-v2/services/casefile/map/pda/pdaGlyphs";

import { FS, TRACK, type LetterSpec } from "./substrateKit";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 37 · SKILL FACET — the pie chart's claim, cut into Thoughtform's shape law.
 *
 * The owner's correction to 21 · WHEEL (2026-08-17): keep the immediate
 * part-to-whole read of a pie chart, lose the circle, and make the OBJECT out
 * of the Skills rather than annotating an empty chart with them.
 *
 * ## The object
 *
 * A flat DODECAGONAL ANNULUS — twelve straight outer edges, twelve straight
 * inner edges, no curve anywhere. The annulus contains exactly 47 SHARDS,
 * one per encoded Skill. Five contiguous runs are the five substrate shapes:
 * Pattern 14 · Judgment 12 · Validation 9 · Voice 7 · Stakeholder 5.
 *
 * ⚠ THE ANGLE IS THE COUNT AGAIN, honestly. The five equal group-clearances
 * are removed from the 360° sweep, and every remaining Skill owns one equal
 * angular step. A group with fourteen Skills therefore owns fourteen steps;
 * a group with five owns five. The dodecagonal rim modulates each shard's
 * area slightly (the price of the straight perimeter), but the compared
 * quantity is countable on the face: one shard IS one Skill.
 *
 * ## The 47 names
 *
 * Lettering 47 names into 47 radial shards would put most below the type
 * floor — the outer chord averages ~31 units per Skill while a 14-character
 * `short` needs 114.2u at fs12. Instead every shard is interactive and names
 * itself in the central dodecagonal READOUT on hover/focus. The whole still
 * visibly consists of 47 parts at rest; interaction turns any one part back
 * into its authored Skill name, team and status. The five shape names and
 * counts sit INSIDE their own shard runs — no external labels, leaders or
 * explanatory paragraphs compete with the figure.
 *
 * This is not the Aether donut restyled. The source's useful claim is the
 * part-to-whole read; the implementation here is the PDA's own hand:
 * straight chords, one opaque ground, hairline shards, gold wayfinding,
 * green provenance on the five first encodes, horizontal type, zero legend.
 */

export const SKILL_FACET_VIEWBOX = "0 0 932 762";

const CX = 466;
const CY = 390;
const OUTER_R = 240;
const INNER_R = 102;
const SIDES = 12;
/** Flat top and floor: vertices straddle the vertical axis by 15°. */
const POLY_ROT = -105;
const START = -174;
const GROUP_GAP = 2;
const CELL_GAP = 0.32;

export const SKILL_FACET_ORDER: readonly CaseMapShapeKey[] = [
  "pattern",
  "judgment",
  "validation",
  "voice",
  "stakeholder",
];

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Signed angle in [-period/2, period/2). */
const wrapped = (n: number, period: number) =>
  ((((n + period / 2) % period) + period) % period) - period / 2;

/**
 * Distance from the centre to a regular polygon's edge on ray `angle`.
 * The polygon is specified by its circumradius and vertex rotation.
 */
export function polygonRayRadius(angle: number, circumradius: number): number {
  const period = 360 / SIDES;
  const edgeNormal0 = POLY_ROT + period / 2;
  const delta = wrapped(angle - edgeNormal0, period);
  return (circumradius * Math.cos(rad(180 / SIDES))) / Math.cos(rad(delta));
}

export interface FacetPoint {
  x: number;
  y: number;
}

export function polygonRayPoint(angle: number, circumradius: number): FacetPoint {
  const r = polygonRayRadius(angle, circumradius);
  return { x: CX + r * Math.cos(rad(angle)), y: CY + r * Math.sin(rad(angle)) };
}

const point = (p: FacetPoint) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`;

export interface SkillFacetCell {
  skill: CaseSkillEntry;
  key: CaseMapShapeKey;
  a0: number;
  a1: number;
  mid: number;
  d: string;
  outer0: FacetPoint;
  outer1: FacetPoint;
}

export interface SkillFacetGroup {
  key: CaseMapShapeKey;
  name: string;
  skills: readonly CaseSkillEntry[];
  a0: number;
  a1: number;
  mid: number;
}

const orderedSkills = (skills: readonly CaseSkillEntry[], key: CaseMapShapeKey) => {
  const mine = skills.filter((s) => s.engine.toLowerCase() === key);
  const flagship = mine.find((s) => s.flagship);
  return flagship ? [flagship, ...mine.filter((s) => s !== flagship)] : mine;
};

/**
 * Five contiguous groups and their 47 cells. One derivation feeds drawing,
 * hover, the internal labels and the arithmetic guard.
 */
export function skillFacetLayout(record: IslRecord): {
  groups: SkillFacetGroup[];
  cells: SkillFacetCell[];
} {
  const skills = record.skills ?? [];
  const shapes = new Map(record.shapes.map((s) => [s.key as CaseMapShapeKey, s]));
  const total = SKILL_FACET_ORDER.reduce((n, key) => n + orderedSkills(skills, key).length, 0);
  if (total === 0) return { groups: [], cells: [] };

  const step = (360 - GROUP_GAP * SKILL_FACET_ORDER.length) / total;
  const groups: SkillFacetGroup[] = [];
  const cells: SkillFacetCell[] = [];
  let cursor = START;

  for (const key of SKILL_FACET_ORDER) {
    const shape = shapes.get(key);
    const mine = orderedSkills(skills, key);
    const groupA0 = cursor;

    for (const skill of mine) {
      const a0 = cursor + CELL_GAP / 2;
      const a1 = cursor + step - CELL_GAP / 2;
      const inner0 = polygonRayPoint(a0, INNER_R);
      const outer0 = polygonRayPoint(a0, OUTER_R);
      const outer1 = polygonRayPoint(a1, OUTER_R);
      const inner1 = polygonRayPoint(a1, INNER_R);
      cells.push({
        skill,
        key,
        a0,
        a1,
        mid: (a0 + a1) / 2,
        d: `M${point(inner0)} L${point(outer0)} L${point(outer1)} L${point(inner1)} Z`,
        outer0,
        outer1,
      });
      cursor += step;
    }

    const groupA1 = cursor;
    groups.push({
      key,
      name: shape?.name ?? key.toUpperCase(),
      skills: mine,
      a0: groupA0,
      a1: groupA1,
      mid: (groupA0 + groupA1) / 2,
    });
    cursor += GROUP_GAP;
  }

  return { groups, cells };
}

/** A regular polygon path at the configured centre. */
export function polygonPath(radius: number): string {
  return (
    Array.from({ length: SIDES }, (_, i) => {
      const a = POLY_ROT + (i * 360) / SIDES;
      const p = { x: CX + radius * Math.cos(rad(a)), y: CY + radius * Math.sin(rad(a)) };
      return `${i === 0 ? "M" : "L"}${point(p)}`;
    }).join(" ") + " Z"
  );
}

/**
 * The five labels sit at one shared radial rung, inside the annulus.
 *
 * ⚠ 14 IS SET BY STAKEHOLDER, the longest shape name: 11 × 14 × .68 =
 * 104.7u against a 112u measure in the narrowest five-shard run. The count
 * goes on its own line, so every group gets the same compact two-line mark.
 */
const GROUP_LABEL_R = 174;
const GROUP_LABEL_FS = 14;
const GROUP_LABEL_MEASURE = 112;

const groupTone = (key: CaseMapShapeKey) => {
  const i = SKILL_FACET_ORDER.indexOf(key);
  return 0.035 + i * 0.01;
};

export function VariantSkillFacet({ record }: IslVariantProps) {
  const layout = useMemo(() => skillFacetLayout(record), [record]);
  const [hotId, setHotId] = useState<string | null>(null);
  const hot = layout.cells.find((c) => c.skill.id === hotId) ?? null;
  const hotKey = hot?.key ?? null;
  const total = layout.cells.length;

  return (
    <>
      {/* ONE GROUND behind the shards. The gaps reveal this plate rather than
          empty canvas, so the object reads as one instrument divided. */}
      <path d={polygonPath(OUTER_R)} fill="var(--pda-void)" />

      {layout.cells.map((cell) => {
        const isHot = cell.skill.id === hotId;
        const dimmed = hotId !== null && !isHot && cell.key !== hotKey;
        return (
          <g
            key={cell.skill.id}
            className="fl-pda-hit"
            role="button"
            tabIndex={0}
            aria-label={`${cell.skill.short}, ${cell.key}, ${cell.skill.team}, ${cell.skill.status}`}
            onMouseEnter={() => setHotId(cell.skill.id)}
            onMouseLeave={() => setHotId(null)}
            onFocus={() => setHotId(cell.skill.id)}
            onBlur={() => setHotId(null)}
          >
            <path d={cell.d} fill="transparent" />
            <path
              d={cell.d}
              fill={
                isHot
                  ? "rgba(240, 200, 106, 0.22)"
                  : `rgba(var(--dawn-rgb), ${groupTone(cell.key).toFixed(3)})`
              }
              stroke={isHot ? "var(--pda-hot)" : "var(--pda-hair)"}
              strokeOpacity={dimmed ? 0.28 : 1}
              opacity={dimmed ? 0.42 : 1}
            />
            {/* Green marks provenance, and only provenance: the five first
                encodes light their OUTER CHORD, not the whole shard. */}
            {cell.skill.flagship ? (
              <line
                x1={cell.outer0.x}
                y1={cell.outer0.y}
                x2={cell.outer1.x}
                y2={cell.outer1.y}
                stroke="var(--pda-grn)"
                strokeWidth="3"
              />
            ) : null}
          </g>
        );
      })}

      {/* Group seams — five structural boundaries, stronger than the 47
          shard hairlines. */}
      {layout.groups.map((group) => {
        const p0 = polygonRayPoint(group.a0, INNER_R);
        const p1 = polygonRayPoint(group.a0, OUTER_R);
        return (
          <line
            key={`seam-${group.key}`}
            x1={p0.x}
            y1={p0.y}
            x2={p1.x}
            y2={p1.y}
            stroke={hotKey === group.key ? "var(--pda-hot)" : "var(--pda-amb)"}
            strokeWidth="2"
            strokeOpacity={hotKey === group.key ? 1 : 0.7}
          />
        );
      })}

      {/* Crisp polygonal boundaries, never circles. */}
      <path d={polygonPath(OUTER_R)} fill="none" stroke="var(--pda-hair2)" strokeWidth="2" />
      <path d={polygonPath(INNER_R)} fill="var(--pda-void)" stroke="var(--pda-hair2)" />

      {/* THE READOUT — rest shows the estate; hover/focus names one of the
          47 shards without trying to letter inside a 31u outer chord. */}
      <HubReadout hot={hot} total={total} />

      {/* Five compact labels seated inside their own shard runs. */}
      {layout.groups.map((group) => (
        <GroupLabel key={group.key} group={group} hot={hotKey === group.key} />
      ))}
    </>
  );
}

function HubReadout({ hot, total }: { hot: SkillFacetCell | null; total: number }) {
  if (!hot) {
    return (
      <g pointerEvents="none">
        <text
          x={CX}
          y={CY - 15}
          textAnchor="middle"
          fontSize="30"
          fontWeight={700}
          letterSpacing=".08em"
          fill="var(--pda-txt)"
        >
          {total}
        </text>
        <text
          x={CX}
          y={CY + 10}
          textAnchor="middle"
          fontSize={FS.chrome}
          letterSpacing=".18em"
          fill="var(--pda-ink)"
        >
          ENCODED SKILLS
        </text>
        <text
          x={CX}
          y={CY + 32}
          textAnchor="middle"
          fontSize={FS.chrome}
          letterSpacing=".14em"
          fill="var(--pda-txt2)"
        >
          5 SUBSTRATES
        </text>
      </g>
    );
  }

  const meta = wrapLines(`${hot.skill.team} · ${hot.skill.status}`, 18, 3);
  return (
    <g pointerEvents="none">
      {hot.skill.flagship ? (
        <rect x={CX - 4} y={CY - 58} width="8" height="8" fill="var(--pda-grn)" />
      ) : null}
      <text
        x={CX}
        y={CY - 25}
        textAnchor="middle"
        fontSize={FS.name}
        fontWeight={700}
        letterSpacing=".04em"
        fill="var(--pda-txt)"
      >
        {hot.skill.short}
      </text>
      <text
        x={CX}
        y={CY + 2}
        textAnchor="middle"
        fontSize={FS.chrome}
        letterSpacing=".18em"
        fill="var(--pda-ink)"
      >
        {hot.key.toUpperCase()}
      </text>
      {meta.map((line, i) => (
        <text
          key={line}
          x={CX}
          y={CY + 25 + i * 17}
          textAnchor="middle"
          fontSize={FS.chrome}
          letterSpacing=".08em"
          fill="var(--pda-txt2)"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function GroupLabel({ group, hot }: { group: SkillFacetGroup; hot: boolean }) {
  const p = polygonRayPoint(group.mid, GROUP_LABEL_R);
  return (
    <g pointerEvents="none">
      <text
        x={p.x}
        y={p.y}
        textAnchor="middle"
        fontSize={GROUP_LABEL_FS}
        fontWeight={700}
        letterSpacing=".08em"
        stroke="var(--pda-void)"
        strokeWidth="6"
        paintOrder="stroke"
        fill={hot ? "var(--pda-hot)" : "var(--pda-txt)"}
      >
        {group.name}
      </text>
      <text
        x={p.x}
        y={p.y + 20}
        textAnchor="middle"
        fontSize={FS.chrome}
        letterSpacing=".18em"
        stroke="var(--pda-void)"
        strokeWidth="5"
        paintOrder="stroke"
        fill="var(--pda-ink)"
      >
        {String(group.skills.length).padStart(2, "0")}
      </text>
    </g>
  );
}

/**
 * Everything this direction can letter — five internal group marks, the rest
 * readout and every possible interactive hub state.
 */
export function skillFacetLettering(record: IslRecord): LetterSpec[] {
  const layout = skillFacetLayout(record);
  const out: LetterSpec[] = [
    { slot: "hub.total", text: String(layout.cells.length), fs: 30, track: 0.08, measure: 150 },
    { slot: "hub.label", text: "ENCODED SKILLS", fs: FS.chrome, track: 0.18, measure: 180 },
    { slot: "hub.groups", text: "5 SUBSTRATES", fs: FS.chrome, track: 0.14, measure: 180 },
  ];

  for (const group of layout.groups) {
    out.push({
      slot: `${group.key}.name`,
      text: group.name,
      fs: GROUP_LABEL_FS,
      track: TRACK.name,
      measure: GROUP_LABEL_MEASURE,
    });
    out.push({
      slot: `${group.key}.count`,
      text: String(group.skills.length).padStart(2, "0"),
      fs: FS.chrome,
      track: TRACK.key,
      measure: GROUP_LABEL_MEASURE,
    });
  }

  for (const cell of layout.cells) {
    out.push({
      slot: `skill.${cell.skill.id}.short`,
      text: cell.skill.short,
      fs: FS.name,
      track: 0.04,
      measure: 180,
    });
    out.push({
      slot: `skill.${cell.skill.id}.engine`,
      text: cell.key.toUpperCase(),
      fs: FS.chrome,
      track: 0.18,
      measure: 180,
    });
    const meta = wrapLines(`${cell.skill.team} · ${cell.skill.status}`, 18, 3);
    for (const [i, line] of meta.entries()) {
      out.push({
        slot: `skill.${cell.skill.id}.meta.${i}`,
        text: line,
        fs: FS.chrome,
        track: 0.08,
        measure: 180,
      });
    }
  }

  return out;
}

/** The visual count of a group is literally its number of shards. */
export const skillFacetMarkCount = (record: IslRecord, key: string): number =>
  skillFacetLayout(record).cells.filter((cell) => cell.key === key).length;

/** Angular sweep after the five equal group clearances are removed. */
export function skillFacetSweep(record: IslRecord, key: string): number {
  const group = skillFacetLayout(record).groups.find((g) => g.key === key);
  return group ? group.a1 - group.a0 : 0;
}

/** Maximum radial modulation introduced by the dodecagonal perimeter. */
export function skillFacetRimModulation(): number {
  const apothem = OUTER_R * Math.cos(rad(180 / SIDES));
  return (OUTER_R - apothem) / OUTER_R;
}

/** Exported for the guard that holds the straight-edge contract. */
export const SKILL_FACET_SIDES = SIDES;
