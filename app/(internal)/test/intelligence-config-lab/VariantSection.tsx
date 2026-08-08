"use client";

import { Cartridge, Plate } from "@/components/landing/home-v2/services/casefile/map/pda/pdaGlyphs";
import type { CaseMapShape } from "@/lib/cases/types";

import {
  type IclRecord,
  type IclVariantProps,
  type LetterSpec,
  hatchTicks,
  shapeSkills,
  substrateCaption,
  taps,
} from "./variants";

/**
 * THE CUTAWAY — the configuration as a vertical section.
 *
 * One column, read top to bottom the way authority actually runs: the OWNER
 * above everything, autonomy drawn as the DIMENSION between the seat and the
 * machine; the WORK slab framed in brackets; the skill⇄lane pair as one
 * INTERLOCKED dual slab (a tab keys them together — the pair, physical);
 * what it INHERITS as the strata the machine sits in; then the GRADE LINE,
 * and below it THE SUBSTRATE as literal geology — five shape strata, each
 * clustered with its skills, the tapped ones trenched by risers.
 *
 * What it can REACH exits the section to the right, as taps through the
 * frame. The BAR is the bedplate rule the whole machine stands on, and the
 * why-sentence closes the sheet as its specification note.
 */

export const SECTION_VIEWBOX = "0 0 900 760";

const FS = { chrome: 7.5, head: 7.5, name: 8, value: 8.5, why: 8.5, micro: 7 } as const;

const G = {
  slab: { x: 348.8, y: 118, w: 202.4, h: 156.4, k: 1.15 },
  pair: { x: 270, y: 288, w: 360, h: 56, ch: 10 },
  strata: { x: 190, w: 520, ctxY: 368, gphY: 424, h: 44 },
  gradeY: 496,
  bandY: (i: number) => 512 + i * 38,
  bandX0: 60,
  bandX1: 840,
  bedY: 710,
} as const;

/** Every string the section letters, with its measure. */
export function sectionLettering(
  pda: IclVariantProps["pda"],
  work: IclVariantProps["work"],
  record: IclRecord
): LetterSpec[] {
  const c = pda.cfg;
  const specs: LetterSpec[] = [
    { slot: "section.chrome", text: "THE CONFIGURATION", fs: FS.chrome, track: 0.22, measure: 300 },
    { slot: "section.ownerLabel", text: "WHO OWNS IT", fs: FS.chrome, track: 0.22, measure: 200 },
    { slot: "section.owner", text: pda.owner, fs: 10, track: 0.2, measure: 212 },
    { slot: "section.decides", text: "DECIDES ALONE", fs: FS.chrome, track: 0.22, measure: 84 },
    { slot: "section.autonomy", text: pda.autonomy, fs: FS.value, track: 0.08, measure: 84 },
    { slot: "section.h.runs", text: "WHAT RUNS IT", fs: FS.head, track: 0.14, measure: 130 },
    { slot: "section.h.inh", text: "WHAT IT INHERITS", fs: FS.head, track: 0.14, measure: 130 },
    { slot: "section.h.gat", text: "WHAT IT IS HELD TO", fs: FS.head, track: 0.14, measure: 130 },
    { slot: "section.h.rch", text: "WHAT IT CAN REACH", fs: FS.head, track: 0.14, measure: 130 },
    { slot: "section.system", text: c.system, fs: FS.name, track: 0.08, measure: 118 },
    { slot: "section.surface", text: c.surface, fs: FS.name, track: 0.08, measure: 118 },
    { slot: "section.skill", text: c.skill, fs: FS.name, track: 0.08, measure: 156 },
    { slot: "section.lane", text: c.laneRun, fs: FS.name, track: 0.08, measure: 156 },
    { slot: "section.tag.skill", text: "SKILL", fs: FS.micro, track: 0.22, measure: 156 },
    { slot: "section.tag.lane", text: "LANE", fs: FS.micro, track: 0.22, measure: 156 },
    { slot: "section.context", text: c.context, fs: FS.name, track: 0.08, measure: 500 },
    { slot: "section.graph", text: c.graph, fs: FS.name, track: 0.08, measure: 500 },
    { slot: "section.substrate", text: "SUBSTRATE", fs: FS.chrome, track: 0.22, measure: 200 },
    {
      slot: "section.caption",
      text: substrateCaption(record.shapes),
      fs: FS.chrome,
      track: 0.08,
      measure: 300,
    },
    { slot: "section.bar", text: c.bar, fs: FS.name, track: 0.08, measure: 280 },
    {
      slot: "section.gateOwner",
      text: c.gatNote.split(" — ")[0],
      fs: FS.chrome,
      track: 0.08,
      measure: 140,
    },
    { slot: "section.why", text: c.why, fs: FS.why, track: 0.08, measure: 620 },
  ];
  for (const s of record.shapes) {
    specs.push({
      slot: `section.band.${s.key}`,
      text: s.label.toUpperCase(),
      fs: FS.name,
      track: 0.08,
      measure: 150,
    });
    specs.push({
      slot: `section.count.${s.key}`,
      text: `· ${s.skills}`,
      fs: FS.name,
      track: 0.08,
      measure: 60,
    });
  }
  return specs;
}

function Stratum({
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
  const y = G.bandY(i);
  const n = shapeSkills(record.skills, shape).length;
  return (
    <g opacity={tapped ? 1 : 0.38}>
      <rect
        x={G.bandX0}
        y={y}
        width={G.bandX1 - G.bandX0}
        height="30"
        fill={tapped ? "rgba(126, 159, 102, 0.06)" : "none"}
        stroke={tapped ? "var(--pda-grn)" : "var(--pda-amb)"}
        strokeWidth="1"
        opacity={tapped ? 0.7 : 0.4}
      />
      <text
        x={G.bandX0 + 12}
        y={y + 19}
        fontSize={FS.name}
        letterSpacing=".08em"
        fill="var(--pda-txt)"
      >
        {shape.label.toUpperCase()}
      </text>
      {Array.from({ length: n }, (_, j) => (
        <rect
          key={j}
          x={240 + j * 12}
          y={y + 11.5}
          width="7"
          height="7"
          fill={tapped ? "var(--pda-grn)" : "none"}
          stroke={tapped ? "var(--pda-grn)" : "var(--pda-txt3)"}
          strokeWidth="1"
          opacity={tapped ? 0.8 : 0.7}
        />
      ))}
      <text
        x={G.bandX1 - 12}
        y={y + 19}
        textAnchor="end"
        fontSize={FS.name}
        letterSpacing=".08em"
        fill="var(--pda-txt2)"
      >
        {`· ${shape.skills}`}
      </text>
    </g>
  );
}

export function VariantSection({ pda, work, record }: IclVariantProps) {
  const c = pda.cfg;
  const led = !pda.configured;
  const tapKeys = record.shapes.filter((s) => taps(work, s.key)).map((s) => s.key);

  return (
    <>
      <text x="40" y="36" fontSize={FS.chrome} letterSpacing=".22em" fill="var(--pda-txt3)">
        THE CONFIGURATION
      </text>

      {/* The owner, and the autonomy dimension down to the machine. */}
      <text
        x="450"
        y="36"
        textAnchor="middle"
        fontSize={FS.chrome}
        letterSpacing=".22em"
        fill="var(--pda-ink)"
      >
        WHO OWNS IT
      </text>
      <Plate cx={450} cy={64} w={240} h={44} hot label={pda.owner} />
      <line x1="300" y1="90" x2="300" y2="116" stroke="var(--pda-dim)" />
      <line x1="300" y1="90" x2="330" y2="90" stroke="var(--pda-dim)" opacity="0.5" />
      <line x1="300" y1="116" x2="330" y2="116" stroke="var(--pda-dim)" opacity="0.5" />
      <text
        x="288"
        y="100"
        textAnchor="end"
        fontSize={FS.chrome}
        letterSpacing=".22em"
        fill="var(--pda-txt3)"
      >
        DECIDES ALONE
      </text>
      <text
        x="288"
        y="114"
        textAnchor="end"
        fontSize={FS.value}
        letterSpacing=".08em"
        fill="var(--pda-hot)"
      >
        {pda.autonomy}
      </text>

      {/* The work slab, framed in brackets. */}
      <path d="M334,126 H322 V266 H334" fill="none" stroke="var(--pda-amb)" strokeWidth="1.2" />
      <path d="M566,126 H578 V266 H566" fill="none" stroke="var(--pda-amb)" strokeWidth="1.2" />
      <Cartridge
        x={G.slab.x}
        y={G.slab.y}
        w={G.slab.w}
        h={G.slab.h}
        state={led ? "led" : "hot"}
        work={pda}
        k={G.slab.k}
      />

      {/* WHAT IT CAN REACH — taps leaving the section through the frame. */}
      <text
        x="860"
        y="132"
        textAnchor="end"
        fontSize={FS.head}
        letterSpacing=".14em"
        fill="var(--pda-txt)"
      >
        WHAT IT CAN REACH
      </text>
      <line x1="582" y1="160" x2="830" y2="160" stroke="var(--pda-amb)" opacity="0.55" />
      <line x1="582" y1="190" x2="830" y2="190" stroke="var(--pda-amb)" opacity="0.55" />
      <path d="M826,156 L834,160 L826,164" fill="none" stroke="var(--pda-amb)" opacity="0.7" />
      <path d="M826,186 L834,190 L826,194" fill="none" stroke="var(--pda-amb)" opacity="0.7" />
      <text
        x="860"
        y="154"
        textAnchor="end"
        fontSize={FS.name}
        letterSpacing=".08em"
        fill="var(--pda-txt)"
      >
        {c.system}
      </text>
      <text
        x="860"
        y="184"
        textAnchor="end"
        fontSize={FS.name}
        letterSpacing=".08em"
        fill="var(--pda-txt)"
      >
        {c.surface}
      </text>

      {/* The interlocked pair slab. */}
      <text x="40" y="320" fontSize={FS.head} letterSpacing=".14em" fill="var(--pda-txt)">
        WHAT RUNS IT
      </text>
      <path
        d={`M${G.pair.x},${G.pair.y} H${G.pair.x + G.pair.w - G.pair.ch} L${G.pair.x + G.pair.w},${G.pair.y + G.pair.ch} V${G.pair.y + G.pair.h} H${G.pair.x + G.pair.ch} L${G.pair.x},${G.pair.y + G.pair.h - G.pair.ch} Z`}
        fill="rgba(192, 154, 70, 0.04)"
        stroke="var(--pda-amb)"
      />
      <rect
        x="282"
        y={G.pair.y + 8}
        width="164"
        height="40"
        fill="var(--pda-void)"
        stroke={led ? "var(--pda-txt3)" : "var(--pda-grn)"}
        strokeDasharray={led ? "4 3" : undefined}
      />
      <rect
        x="454"
        y={G.pair.y + 8}
        width="164"
        height="40"
        fill="var(--pda-void)"
        stroke={led ? "var(--pda-txt3)" : "var(--pda-amb)"}
        strokeDasharray={led ? "4 3" : undefined}
      />
      {/* The keying tab — the pair, interlocked. */}
      <rect
        x="446"
        y={G.pair.y + 20}
        width="8"
        height="16"
        fill="var(--pda-void)"
        stroke={led ? "var(--pda-txt3)" : "var(--pda-hot)"}
      />
      <text
        x="364"
        y="320"
        textAnchor="middle"
        fontSize={FS.name}
        letterSpacing=".08em"
        fill={led ? "var(--pda-txt3)" : "var(--pda-grnh)"}
      >
        {c.skill}
      </text>
      <text
        x="536"
        y="320"
        textAnchor="middle"
        fontSize={FS.name}
        letterSpacing=".08em"
        fill="var(--pda-txt)"
      >
        {c.laneRun}
      </text>
      <text
        x="364"
        y="358"
        textAnchor="middle"
        fontSize={FS.micro}
        letterSpacing=".22em"
        fill="var(--pda-txt3)"
      >
        SKILL
      </text>
      <text
        x="536"
        y="358"
        textAnchor="middle"
        fontSize={FS.micro}
        letterSpacing=".22em"
        fill="var(--pda-txt3)"
      >
        LANE
      </text>
      {[440, 450, 460].map((x) => (
        <line
          key={x}
          x1={x}
          y1={G.slab.y + G.slab.h}
          x2={x}
          y2={G.pair.y}
          stroke="var(--pda-amb)"
          opacity="0.55"
        />
      ))}

      {/* WHAT IT INHERITS — the strata the machine sits in. */}
      <text x="40" y="402" fontSize={FS.head} letterSpacing=".14em" fill="var(--pda-txt)">
        WHAT IT INHERITS
      </text>
      <rect
        x={G.strata.x}
        y={G.strata.ctxY}
        width={G.strata.w}
        height={G.strata.h}
        fill="rgba(192, 154, 70, 0.03)"
        stroke="var(--pda-amb)"
      />
      <text
        x="450"
        y="393"
        textAnchor="middle"
        fontSize={FS.name}
        letterSpacing=".08em"
        fill="var(--pda-txt)"
      >
        {c.context}
      </text>
      <rect
        x={G.strata.x}
        y={G.strata.gphY}
        width={G.strata.w}
        height={G.strata.h}
        fill="none"
        stroke="var(--pda-txt3)"
        strokeDasharray="5 4"
      />
      <text
        x="450"
        y="449"
        textAnchor="middle"
        fontSize={FS.name}
        letterSpacing=".08em"
        fill="var(--pda-txt2)"
      >
        {c.graph}
      </text>
      {[440, 450, 460].map((x) => (
        <line
          key={`s${x}`}
          x1={x}
          y1={G.pair.y + G.pair.h}
          x2={x}
          y2={G.strata.ctxY}
          stroke="var(--pda-amb)"
          opacity="0.4"
        />
      ))}

      {/* The grade line. */}
      <text x={G.bandX0} y="488" fontSize={FS.chrome} letterSpacing=".22em" fill="var(--pda-ink)">
        SUBSTRATE
      </text>
      <text
        x={G.bandX1}
        y="488"
        textAnchor="end"
        fontSize={FS.chrome}
        letterSpacing=".08em"
        fill="var(--pda-txt2)"
      >
        {substrateCaption(record.shapes)}
      </text>
      <line
        x1={G.bandX0}
        y1={G.gradeY}
        x2={G.bandX1}
        y2={G.gradeY}
        stroke="var(--pda-amb)"
        opacity="0.8"
      />
      <g stroke="var(--pda-amb)" opacity="0.3">
        {hatchTicks(G.bandX0, G.bandX1, G.gradeY + 1, 20, 7).map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />
        ))}
      </g>

      {/* Risers — the machine trenching into what it taps. */}
      {tapKeys.map((key, i) => {
        const si = record.shapes.findIndex((s) => s.key === key);
        const x = 430 + i * 20;
        const y = G.bandY(si);
        return (
          <g key={key} stroke="var(--pda-grn)" opacity="0.6">
            <line x1={x} y1={G.strata.gphY + G.strata.h} x2={x} y2={y} />
            <rect
              x={x - 2.5}
              y={y - 2.5}
              width="5"
              height="5"
              fill="var(--pda-grn)"
              stroke="none"
            />
          </g>
        );
      })}

      {record.shapes.map((s, i) => (
        <Stratum key={s.key} shape={s} i={i} tapped={taps(work, s.key)} record={record} />
      ))}

      {/* The bedplate — what the whole machine is held to. */}
      <text x={G.bandX0} y="732" fontSize={FS.head} letterSpacing=".14em" fill="var(--pda-txt)">
        WHAT IT IS HELD TO
      </text>
      <line x1={G.bandX0} y1={G.bedY} x2={G.bandX1} y2={G.bedY} stroke="var(--pda-amb)" />
      <line
        x1={G.bandX0}
        y1={G.bedY + 4}
        x2={G.bandX1}
        y2={G.bedY + 4}
        stroke="var(--pda-amb)"
        opacity="0.5"
      />
      <text
        x="450"
        y="732"
        textAnchor="middle"
        fontSize={FS.name}
        letterSpacing=".08em"
        fill="var(--pda-txt)"
      >
        {c.bar}
      </text>
      <text
        x={G.bandX1}
        y="732"
        textAnchor="end"
        fontSize={FS.chrome}
        letterSpacing=".08em"
        fill="var(--pda-txt2)"
      >
        {c.gatNote.split(" — ")[0]}
      </text>
      {/* The specification note — why this lane and not a lighter one. */}
      <text
        x="450"
        y="752"
        textAnchor="middle"
        fontSize={FS.why}
        letterSpacing=".08em"
        fill="var(--pda-txt2)"
      >
        {c.why}
      </text>
    </>
  );
}
