"use client";

import { Cartridge } from "@/components/landing/home-v2/services/casefile/map/pda/pdaGlyphs";
import type { CaseMapShape } from "@/lib/cases/types";

import {
  type IclRecord,
  type IclVariantProps,
  type LetterSpec,
  shapeSkills,
  substrateCaption,
  taps,
} from "./variants";

/**
 * THE SCHEMATIC — the configuration as a circuit diagram.
 *
 * The airiest of the four (reference B's rule: a DIFFERENT SILHOUETTE per
 * part): the work is the cartridge with registration marks, the skill is a
 * bracketed LATTICE, the lane an OSCILLATOR, context a STACK of plates, the
 * graph a DASHED node in the adjacent-domain hand, reach a PORT and an
 * APERTURE on the right, the owner a SEAT MARK above. Relations are
 * orthogonal NETS with junction squares and named runs — RUNS, INHERITS,
 * REACHES — and the output net passes a GATE symbol carrying the bar.
 *
 * The substrate is five POWER RAILS along the bottom, one per shape, each
 * with its skills as ticks and its derived count; the work's drops tie into
 * the rails it taps.
 */

export const SCHEMATIC_VIEWBOX = "0 0 1000 760";

/* ⚠ NOTHING UNDER 7.5 in a 1000-wide crop — 7 renders 4.22px at the
   binding meet (0.603), under the smoke's 4.3 floor. */
const FS = { chrome: 7.5, name: 8, value: 8.5, net: 7.5, micro: 7.5 } as const;

const G = {
  chip: { x: 412, y: 232, w: 176, h: 136 },
  railY: (i: number) => 640 + i * 22,
  railX0: 120,
  railX1: 880,
} as const;

/** Every string the schematic letters, with its measure. */
export function schematicLettering(
  pda: IclVariantProps["pda"],
  work: IclVariantProps["work"],
  record: IclRecord
): LetterSpec[] {
  const c = pda.cfg;
  const specs: LetterSpec[] = [
    {
      slot: "schematic.chrome",
      text: "THE CONFIGURATION",
      fs: FS.chrome,
      track: 0.22,
      measure: 300,
    },
    { slot: "schematic.designator", text: pda.id, fs: FS.name, track: 0.08, measure: 120 },
    {
      slot: "schematic.ownerLabel",
      text: "WHO OWNS IT",
      fs: FS.micro,
      track: 0.22,
      measure: 260,
    },
    { slot: "schematic.owner", text: pda.owner, fs: FS.value, track: 0.08, measure: 260 },
    {
      slot: "schematic.decides",
      text: `DECIDES ALONE · ${pda.autonomy}`,
      fs: FS.chrome,
      track: 0.08,
      measure: 220,
    },
    { slot: "schematic.skill", text: c.skill, fs: FS.name, track: 0.08, measure: 130 },
    { slot: "schematic.lane", text: c.laneRun, fs: FS.name, track: 0.08, measure: 130 },
    { slot: "schematic.context", text: c.context, fs: FS.name, track: 0.08, measure: 145 },
    { slot: "schematic.graph", text: c.graph, fs: FS.name, track: 0.08, measure: 145 },
    { slot: "schematic.system", text: c.system, fs: FS.name, track: 0.08, measure: 165 },
    { slot: "schematic.surface", text: c.surface, fs: FS.name, track: 0.08, measure: 165 },
    { slot: "schematic.net.runs", text: "RUNS", fs: FS.net, track: 0.22, measure: 60 },
    { slot: "schematic.net.inh", text: "INHERITS", fs: FS.net, track: 0.22, measure: 90 },
    { slot: "schematic.net.rch", text: "REACHES", fs: FS.net, track: 0.22, measure: 90 },
    { slot: "schematic.net.gat", text: "HELD TO", fs: FS.net, track: 0.22, measure: 90 },
    { slot: "schematic.bar", text: c.bar, fs: FS.name, track: 0.08, measure: 308 },
    {
      slot: "schematic.gateOwner",
      text: c.gatNote.split(" — ")[0],
      fs: FS.chrome,
      track: 0.08,
      measure: 308,
    },
    { slot: "schematic.substrate", text: "SUBSTRATE", fs: FS.chrome, track: 0.22, measure: 200 },
    {
      slot: "schematic.caption",
      text: substrateCaption(record.shapes),
      fs: FS.chrome,
      track: 0.08,
      measure: 300,
    },
  ];
  for (const s of record.shapes) {
    specs.push({
      slot: `schematic.rail.${s.key}`,
      text: s.label.toUpperCase(),
      fs: FS.name,
      track: 0.08,
      measure: 92,
    });
    specs.push({
      slot: `schematic.count.${s.key}`,
      text: `· ${s.skills}`,
      fs: FS.name,
      track: 0.08,
      measure: 64,
    });
  }
  return specs;
}

const J = ({ x, y }: { x: number; y: number }) => (
  <rect x={x - 2} y={y - 2} width="4" height="4" fill="var(--pda-amb)" />
);

function PowerRail({
  shape,
  i,
  tapped,
  record,
}: {
  shape: CaseMapShape;
  i: number;
  tapped: boolean;
  record: IclRecord;
}) {
  const y = G.railY(i);
  const n = shapeSkills(record.skills, shape).length;
  return (
    <g opacity={tapped ? 1 : 0.38}>
      <line
        x1={G.railX0}
        y1={y}
        x2={G.railX1}
        y2={y}
        stroke={tapped ? "var(--pda-grn)" : "var(--pda-amb)"}
        strokeWidth={tapped ? 1.4 : 1}
        opacity={tapped ? 0.7 : 0.4}
      />
      <text
        x={G.railX0 - 8}
        y={y + 3}
        textAnchor="end"
        fontSize={FS.name}
        letterSpacing=".08em"
        fill="var(--pda-txt)"
      >
        {shape.label.toUpperCase()}
      </text>
      {Array.from({ length: n }, (_, j) => (
        <line
          key={j}
          x1={140 + j * 8}
          y1={y - 6}
          x2={140 + j * 8}
          y2={y}
          stroke={tapped ? "var(--pda-grn)" : "var(--pda-txt3)"}
          opacity="0.8"
        />
      ))}
      <text
        x={G.railX1 + 12}
        y={y + 3}
        fontSize={FS.name}
        letterSpacing=".08em"
        fill="var(--pda-txt2)"
      >
        {`· ${shape.skills}`}
      </text>
    </g>
  );
}

export function VariantSchematic({ pda, work, record }: IclVariantProps) {
  const c = pda.cfg;
  const led = !pda.configured;
  const tapKeys = record.shapes.filter((s) => taps(work, s.key)).map((s) => s.key);
  const inkOr = (on: string) => (led ? "var(--pda-txt3)" : on);

  return (
    <>
      <text x="40" y="36" fontSize={FS.chrome} letterSpacing=".22em" fill="var(--pda-txt3)">
        THE CONFIGURATION
      </text>
      <text
        x="960"
        y="36"
        textAnchor="end"
        fontSize={FS.name}
        letterSpacing=".08em"
        fill="var(--pda-txt2)"
      >
        {pda.id}
      </text>

      {/* The seat, above everything. */}
      <text
        x="500"
        y="56"
        textAnchor="middle"
        fontSize={FS.micro}
        letterSpacing=".22em"
        fill="var(--pda-ink)"
      >
        WHO OWNS IT
      </text>
      <text
        x="500"
        y="74"
        textAnchor="middle"
        fontSize={FS.value}
        letterSpacing=".08em"
        fill="var(--pda-txt)"
      >
        {pda.owner}
      </text>
      <path d="M500,85 L507,92 L500,99 L493,92 Z" fill="var(--pda-void)" stroke="var(--pda-hot)" />
      <line x1="500" y1="99" x2="500" y2="232" stroke="var(--pda-dim)" />
      <text x="514" y="170" fontSize={FS.chrome} letterSpacing=".08em" fill="var(--pda-txt3)">
        {`DECIDES ALONE · ${pda.autonomy}`}
      </text>

      {/* The work — the cartridge with registration marks. */}
      <g stroke="var(--pda-txt3)" opacity="0.7" fill="none">
        <path d="M404,232 H396 V224" />
        <path d="M596,232 H604 V224" />
        <path d="M404,368 H396 V376" />
        <path d="M596,368 H604 V376" />
      </g>
      <Cartridge
        x={G.chip.x}
        y={G.chip.y}
        w={G.chip.w}
        h={G.chip.h}
        state={led ? "led" : "hot"}
        work={pda}
      />

      {/* WHAT RUNS IT — the lattice and the oscillator, tied as a pair. */}
      <g stroke={inkOr("var(--pda-grn)")} fill="none">
        <path d="M218,226 H226 M218,226 V234" strokeWidth="1.4" />
        <path d="M262,226 H254 M262,226 V234" strokeWidth="1.4" />
        <path d="M218,262 H226 M218,262 V254" strokeWidth="1.4" />
        <path d="M262,262 H254 M262,262 V254" strokeWidth="1.4" />
      </g>
      <rect x="228" y="230" width="10" height="10" fill={inkOr("var(--pda-grn)")} />
      <rect x="242" y="230" width="10" height="10" fill="none" stroke={inkOr("var(--pda-grn)")} />
      <rect x="228" y="244" width="10" height="10" fill="none" stroke={inkOr("var(--pda-grn)")} />
      <rect x="242" y="244" width="10" height="10" fill={inkOr("var(--pda-grn)")} />
      <text
        x="280"
        y="248"
        fontSize={FS.name}
        letterSpacing=".08em"
        fill={led ? "var(--pda-txt3)" : "var(--pda-grnh)"}
      >
        {c.skill}
      </text>

      <rect x="222" y="402" width="36" height="36" fill="none" stroke={inkOr("var(--pda-amb)")} />
      <path
        d="M240,406 L254,420 L240,434 L226,420 Z"
        fill="none"
        stroke={inkOr("var(--pda-amb)")}
      />
      <text x="280" y="424" fontSize={FS.name} letterSpacing=".08em" fill="var(--pda-txt)">
        {c.laneRun}
      </text>

      {/* The pair tie — two opposed runs between skill and lane. */}
      <g stroke={inkOr("var(--pda-hot)")} fill="none" opacity="0.8">
        <path d="M234,266 V398 M231,395 L234,398 L237,395" />
        <path d="M246,398 V266 M243,269 L246,266 L249,269" />
      </g>

      {/* The runs bus into the chip. */}
      <g stroke="var(--pda-amb)" fill="none" opacity="0.65">
        <path d="M262,240 H340" />
        <path d="M258,420 H340" />
        <path d="M340,240 V420" />
        <path d="M340,270 H412" />
        <path d="M340,330 H412" />
      </g>
      <J x={340} y={240} />
      <J x={340} y={270} />
      <J x={340} y={330} />
      <J x={340} y={420} />
      <text x="376" y="264" fontSize={FS.net} letterSpacing=".22em" fill="var(--pda-txt3)">
        RUNS
      </text>

      {/* WHAT IT INHERITS — the stack and the dashed node, below-left. */}
      {[2, 1, 0].map((i) => (
        <rect
          key={i}
          x={188 + i * 5}
          y={460 - i * 5}
          width="60"
          height="36"
          fill="var(--pda-void)"
          stroke="var(--pda-amb)"
          opacity={i ? 0.55 : 1}
        />
      ))}
      <text x="260" y="482" fontSize={FS.name} letterSpacing=".08em" fill="var(--pda-txt)">
        {c.context}
      </text>
      <rect
        x="188"
        y="520"
        width="44"
        height="36"
        fill="none"
        stroke="var(--pda-txt3)"
        strokeDasharray="5 4"
      />
      <text x="260" y="542" fontSize={FS.name} letterSpacing=".08em" fill="var(--pda-txt2)">
        {c.graph}
      </text>
      <path d="M248,470 H430 V368" fill="none" stroke="var(--pda-amb)" opacity="0.6" />
      <path
        d="M232,538 H418 V368"
        fill="none"
        stroke="var(--pda-txt3)"
        strokeDasharray="5 4"
        opacity="0.7"
      />
      <text x="330" y="464" fontSize={FS.net} letterSpacing=".22em" fill="var(--pda-txt3)">
        INHERITS
      </text>

      {/* WHAT IT CAN REACH — the port and the aperture, right. */}
      <rect x="744" y="228" width="24" height="24" fill="none" stroke="var(--pda-amb)" />
      <path d="M768,240 H800 M794,235 L800,240 L794,245" fill="none" stroke="var(--pda-amb)" />
      <text x="790" y="222" fontSize={FS.name} letterSpacing=".08em" fill="var(--pda-txt)">
        {c.system}
      </text>
      <path d="M752,318 H744 V342 H752" fill="none" stroke="var(--pda-amb)" strokeWidth="1.4" />
      <path d="M768,318 H776 V342 H768" fill="none" stroke="var(--pda-amb)" strokeWidth="1.4" />
      <text x="790" y="334" fontSize={FS.name} letterSpacing=".08em" fill="var(--pda-txt)">
        {c.surface}
      </text>
      <g stroke="var(--pda-amb)" fill="none" opacity="0.65">
        <path d="M588,270 H744" />
        <path d="M588,330 H744" />
      </g>
      <text x="640" y="264" fontSize={FS.net} letterSpacing=".22em" fill="var(--pda-txt3)">
        REACHES
      </text>

      {/* The gate on the output run — seated LEFT so the bar's line has
          room: the longest live bar is 46 characters (W-052). */}
      <path d="M540,368 V500 H560" fill="none" stroke="var(--pda-amb)" opacity="0.65" />
      <rect x="560" y="492" width="36" height="16" fill="var(--pda-void)" stroke="var(--pda-hot)" />
      <path d="M560,508 L596,492" stroke="var(--pda-hot)" fill="none" />
      <path d="M596,500 H640" fill="none" stroke="var(--pda-amb)" opacity="0.65" />
      <text
        x="578"
        y="484"
        textAnchor="middle"
        fontSize={FS.net}
        letterSpacing=".22em"
        fill="var(--pda-txt3)"
      >
        HELD TO
      </text>
      <text x="650" y="504" fontSize={FS.name} letterSpacing=".08em" fill="var(--pda-txt)">
        {c.bar}
      </text>
      <text x="650" y="520" fontSize={FS.chrome} letterSpacing=".08em" fill="var(--pda-txt2)">
        {c.gatNote.split(" — ")[0]}
      </text>

      {/* The power rails — the substrate. */}
      <text x="40" y="620" fontSize={FS.chrome} letterSpacing=".22em" fill="var(--pda-ink)">
        SUBSTRATE
      </text>
      <text
        x="960"
        y="620"
        textAnchor="end"
        fontSize={FS.chrome}
        letterSpacing=".08em"
        fill="var(--pda-txt2)"
      >
        {substrateCaption(record.shapes)}
      </text>

      {/* Drops from the chip into the rails it taps. */}
      {tapKeys.map((key, i) => {
        const si = record.shapes.findIndex((s) => s.key === key);
        const x = 448 + i * 24;
        const y = G.railY(si);
        return (
          <g key={key} stroke="var(--pda-grn)" opacity="0.6">
            <line x1={x} y1={G.chip.y + G.chip.h} x2={x} y2={y} />
            <rect x={x - 2} y={y - 2} width="4" height="4" fill="var(--pda-grn)" stroke="none" />
          </g>
        );
      })}

      {record.shapes.map((s, i) => (
        <PowerRail key={s.key} shape={s} i={i} tapped={taps(work, s.key)} record={record} />
      ))}
    </>
  );
}
