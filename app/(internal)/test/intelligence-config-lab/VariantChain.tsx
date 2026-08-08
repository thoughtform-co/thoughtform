"use client";

import type { ReactNode } from "react";

import { Cartridge, Plate } from "@/components/landing/home-v2/services/casefile/map/pda/pdaGlyphs";
import type { CaseMapShape } from "@/lib/cases/types";

import {
  type IclRecord,
  type IclVariantProps,
  type LetterSpec,
  chainNeighbours,
  hvh,
  neighbourLine,
  shapeSkills,
  substrateCaption,
  taps,
} from "./variants";

/**
 * THE SIGNAL CHAIN — the configuration as a signal path.
 *
 * A left→right reading the radial layout cannot give: what the stream
 * INHERITS enters on the left (context as a feed tray, the graph in the
 * dashed adjacent-domain hand), the work processes in the middle with its
 * skill⇄lane twin module bridged beneath it, and the output physically
 * PASSES THROUGH THE GATE — an aperture in the line — before it reaches the
 * systems and surfaces on the right edge. The bar is lettered on the gate;
 * the seat that answers for it sits beneath.
 *
 * The substrate is a PATCH BAY along the bottom: five shape sockets, each
 * with its skills clustered as pips, the tapped ones patched up into the
 * twin module — the skill is what draws on the bay.
 *
 * MAP_CHAINS letter the edges: FROM the upstream neighbour, TO the
 * downstream one, for the 7 works on record — the run a reader can follow
 * across the estate — with the honest empty state everywhere else.
 */

export const CHAIN_VIEWBOX = "0 0 1000 760";

/* ⚠ NOTHING UNDER 7.5 in a 1000-wide crop — 7 renders 4.22px at the
   binding meet (0.603), under the smoke's 4.3 floor. */
const FS = { chrome: 7.5, head: 7.5, name: 8, value: 8.5, micro: 7.5 } as const;

const G = {
  proc: { x: 380, y: 208, w: 240, h: 192, ch: 14 },
  twin: { x: 350, y: 412, w: 300, h: 50, ch: 10 },
  trayX: 60,
  trayW: 180,
  gate: { cx: 720, top: 264, bot: 376, railY: 320, gap: 20 },
  jackX: 850,
  edge: 960,
  bayY: 560,
  socketCx: (i: number) => 140 + i * 180,
} as const;

/** Every string the chain letters, with its measure. */
export function chainLettering(
  pda: IclVariantProps["pda"],
  work: IclVariantProps["work"],
  record: IclRecord
): LetterSpec[] {
  const c = pda.cfg;
  const n = chainNeighbours(record.chains, record.works, work.id);
  const specs: LetterSpec[] = [
    { slot: "chain.chrome", text: "THE CONFIGURATION", fs: FS.chrome, track: 0.22, measure: 300 },
    { slot: "chain.fromLabel", text: "FROM", fs: FS.micro, track: 0.22, measure: 270 },
    { slot: "chain.toLabel", text: "TO", fs: FS.micro, track: 0.22, measure: 270 },
    {
      slot: "chain.from",
      text: neighbourLine(n.from, "in", n.inChain),
      fs: FS.name,
      track: 0.08,
      measure: 270,
    },
    {
      slot: "chain.to",
      text: neighbourLine(n.to, "out", n.inChain),
      fs: FS.name,
      track: 0.08,
      measure: 270,
    },
    { slot: "chain.ownerLabel", text: "WHO OWNS IT", fs: FS.chrome, track: 0.22, measure: 200 },
    { slot: "chain.owner", text: pda.owner, fs: 10, track: 0.2, measure: 212 },
    { slot: "chain.decides", text: "DECIDES ALONE", fs: FS.chrome, track: 0.22, measure: 190 },
    { slot: "chain.autonomy", text: pda.autonomy, fs: FS.value, track: 0.08, measure: 190 },
    { slot: "chain.h.inh", text: "WHAT IT INHERITS", fs: FS.head, track: 0.14, measure: 220 },
    { slot: "chain.h.rch", text: "WHAT IT CAN REACH", fs: FS.head, track: 0.14, measure: 220 },
    { slot: "chain.h.runs", text: "WHAT RUNS IT", fs: FS.head, track: 0.14, measure: 220 },
    { slot: "chain.h.gat", text: "WHAT IT IS HELD TO", fs: FS.head, track: 0.14, measure: 160 },
    { slot: "chain.context", text: c.context, fs: FS.name, track: 0.08, measure: 210 },
    { slot: "chain.graph", text: c.graph, fs: FS.name, track: 0.08, measure: 210 },
    { slot: "chain.system", text: c.system, fs: FS.name, track: 0.08, measure: 240 },
    { slot: "chain.surface", text: c.surface, fs: FS.name, track: 0.08, measure: 240 },
    { slot: "chain.skill", text: c.skill, fs: FS.name, track: 0.08, measure: 124 },
    { slot: "chain.lane", text: c.laneRun, fs: FS.name, track: 0.08, measure: 124 },
    { slot: "chain.tag.skill", text: "SKILL", fs: FS.micro, track: 0.22, measure: 124 },
    { slot: "chain.tag.lane", text: "LANE", fs: FS.micro, track: 0.22, measure: 124 },
    { slot: "chain.bar", text: c.bar, fs: FS.name, track: 0.08, measure: 260 },
    {
      slot: "chain.gateOwner",
      text: c.gatNote.split(" — ")[0],
      fs: FS.chrome,
      track: 0.08,
      measure: 160,
    },
    { slot: "chain.substrate", text: "SUBSTRATE", fs: FS.chrome, track: 0.22, measure: 200 },
    {
      slot: "chain.caption",
      text: substrateCaption(record.shapes),
      fs: FS.chrome,
      track: 0.08,
      measure: 300,
    },
  ];
  for (const s of record.shapes) {
    specs.push({
      slot: `chain.socket.${s.key}`,
      text: s.label.toUpperCase(),
      fs: FS.name,
      track: 0.08,
      measure: 170,
    });
    specs.push({
      slot: `chain.count.${s.key}`,
      text: `· ${s.skills}`,
      fs: FS.name,
      track: 0.08,
      measure: 170,
    });
  }
  return specs;
}

/** A feed tray — three stacked plates, drawn back to front. */
function FeedTray({ x, y, dashed }: { x: number; y: number; dashed?: boolean }) {
  const stroke = dashed ? "var(--pda-txt3)" : "var(--pda-amb)";
  return (
    <>
      {[2, 1, 0].map((i) => (
        <rect
          key={i}
          x={x + i * 6}
          y={y - i * 6}
          width={G.trayW}
          height="44"
          fill="var(--pda-void)"
          stroke={stroke}
          strokeDasharray={dashed ? "5 4" : undefined}
          opacity={i ? 0.55 : 1}
        />
      ))}
    </>
  );
}

function PatchSocket({
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
  const cx = G.socketCx(i);
  const n = shapeSkills(record.skills, shape).length;
  const pips: ReactNode[] = [];
  for (let j = 0; j < n; j += 1) {
    const row = Math.floor(j / 5);
    const inRow = Math.min(5, n - row * 5);
    const x0 = cx - (inRow * 10 - 4) / 2;
    pips.push(
      <rect
        key={j}
        x={x0 + (j % 5) * 10}
        y={646 + row * 10}
        width="6"
        height="6"
        fill={tapped ? "var(--pda-grn)" : "none"}
        stroke={tapped ? "var(--pda-grn)" : "var(--pda-txt3)"}
        strokeWidth="1"
        opacity={tapped ? 0.85 : 0.7}
      />
    );
  }
  return (
    <g opacity={tapped ? 1 : 0.38}>
      <rect
        x={cx - 14}
        y="578"
        width="28"
        height="36"
        fill="var(--pda-void)"
        stroke={tapped ? "var(--pda-grn)" : "var(--pda-amb)"}
      />
      {[588, 596, 604].map((y) => (
        <line
          key={y}
          x1={cx - 7}
          y1={y}
          x2={cx + 7}
          y2={y}
          stroke={tapped ? "var(--pda-grn)" : "var(--pda-amb)"}
          opacity="0.7"
        />
      ))}
      <text
        x={cx}
        y="632"
        textAnchor="middle"
        fontSize={FS.name}
        letterSpacing=".08em"
        fill="var(--pda-txt)"
      >
        {shape.label.toUpperCase()}
      </text>
      {pips}
      <text
        x={cx}
        y="694"
        textAnchor="middle"
        fontSize={FS.name}
        letterSpacing=".08em"
        fill="var(--pda-txt2)"
      >
        {`· ${shape.skills}`}
      </text>
    </g>
  );
}

export function VariantChain({ pda, work, record }: IclVariantProps) {
  const c = pda.cfg;
  const led = !pda.configured;
  const n = chainNeighbours(record.chains, record.works, work.id);
  const tapKeys = record.shapes.filter((s) => taps(work, s.key)).map((s) => s.key);

  return (
    <>
      {/* Chrome + the run's edges. */}
      <text x="40" y="36" fontSize={FS.chrome} letterSpacing=".22em" fill="var(--pda-txt3)">
        THE CONFIGURATION
      </text>
      <text x="40" y="176" fontSize={FS.micro} letterSpacing=".22em" fill="var(--pda-ink)">
        FROM
      </text>
      <text
        x="40"
        y="192"
        fontSize={FS.name}
        letterSpacing=".08em"
        fill={n.from ? "var(--pda-txt)" : "var(--pda-txt3)"}
      >
        {neighbourLine(n.from, "in", n.inChain)}
      </text>
      <text
        x={G.edge}
        y="176"
        textAnchor="end"
        fontSize={FS.micro}
        letterSpacing=".22em"
        fill="var(--pda-ink)"
      >
        TO
      </text>
      <text
        x={G.edge}
        y="192"
        textAnchor="end"
        fontSize={FS.name}
        letterSpacing=".08em"
        fill={n.to ? "var(--pda-txt)" : "var(--pda-txt3)"}
      >
        {neighbourLine(n.to, "out", n.inChain)}
      </text>

      {/* The owner, above; autonomy as the dimension down to the machine. */}
      <text
        x="500"
        y="36"
        textAnchor="middle"
        fontSize={FS.chrome}
        letterSpacing=".22em"
        fill="var(--pda-ink)"
      >
        WHO OWNS IT
      </text>
      <Plate cx={500} cy={64} w={240} h={44} hot label={pda.owner} />
      <line x1="500" y1="90" x2="500" y2="204" stroke="var(--pda-dim)" />
      <path d="M496,94 L500,90 L504,94" fill="none" stroke="var(--pda-dim)" />
      <path d="M496,200 L500,204 L504,200" fill="none" stroke="var(--pda-dim)" />
      <text x="512" y="142" fontSize={FS.chrome} letterSpacing=".22em" fill="var(--pda-txt3)">
        DECIDES ALONE
      </text>
      <text x="512" y="158" fontSize={FS.value} letterSpacing=".08em" fill="var(--pda-hot)">
        {pda.autonomy}
      </text>

      {/* WHAT IT INHERITS — the input stage. */}
      <text x={G.trayX} y="236" fontSize={FS.head} letterSpacing=".14em" fill="var(--pda-txt)">
        WHAT IT INHERITS
      </text>
      <FeedTray x={G.trayX} y={260} />
      <text x={G.trayX} y="322" fontSize={FS.name} letterSpacing=".08em" fill="var(--pda-txt)">
        {c.context}
      </text>
      <FeedTray x={G.trayX} y={348} dashed />
      <text x={G.trayX} y="410" fontSize={FS.name} letterSpacing=".08em" fill="var(--pda-txt2)">
        {c.graph}
      </text>
      <path
        d={hvh(G.trayX + G.trayW, 282, G.proc.x, 300, 310)}
        fill="none"
        stroke="var(--pda-amb)"
        strokeWidth="1.4"
        opacity="0.6"
      />
      <path
        d={hvh(G.trayX + G.trayW, 370, G.proc.x, 340, 330)}
        fill="none"
        stroke="var(--pda-txt3)"
        strokeWidth="1.4"
        strokeDasharray="5 4"
        opacity="0.7"
      />

      {/* The processor — the docked work, with the twin module beneath. */}
      <path
        d={`M${G.proc.x},${G.proc.y} H${G.proc.x + G.proc.w - G.proc.ch} L${G.proc.x + G.proc.w},${G.proc.y + G.proc.ch} V${G.proc.y + G.proc.h} H${G.proc.x + G.proc.ch} L${G.proc.x},${G.proc.y + G.proc.h - G.proc.ch} Z`}
        fill="rgba(192, 154, 70, 0.03)"
        stroke="var(--pda-amb)"
        strokeWidth="1.2"
      />
      <Cartridge
        x={500 - 105.6}
        y={218}
        w={211.2}
        h={163.2}
        state={led ? "led" : "hot"}
        work={pda}
        k={1.2}
      />
      <text x={G.twin.x} y="408" fontSize={FS.head} letterSpacing=".14em" fill="var(--pda-txt)">
        WHAT RUNS IT
      </text>
      <path
        d={`M${G.twin.x},${G.twin.y} H${G.twin.x + G.twin.w - G.twin.ch} L${G.twin.x + G.twin.w},${G.twin.y + G.twin.ch} V${G.twin.y + G.twin.h} H${G.twin.x + G.twin.ch} L${G.twin.x},${G.twin.y + G.twin.h - G.twin.ch} Z`}
        fill="rgba(192, 154, 70, 0.04)"
        stroke="var(--pda-amb)"
      />
      {[0, 1].map((side) => (
        <rect
          key={side}
          x={side ? 506 : 362}
          y={G.twin.y + 8}
          width="132"
          height="34"
          fill="var(--pda-void)"
          stroke={led ? "var(--pda-txt3)" : side ? "var(--pda-amb)" : "var(--pda-grn)"}
          strokeDasharray={led ? "4 3" : undefined}
        />
      ))}
      {/* The pair, drawn: two opposed feeds between the cells. */}
      <path
        d="M494,431 H504 M501,428 L504,431 L501,434"
        fill="none"
        stroke={led ? "var(--pda-txt3)" : "var(--pda-hot)"}
      />
      <path
        d="M506,443 H496 M499,440 L496,443 L499,446"
        fill="none"
        stroke={led ? "var(--pda-txt3)" : "var(--pda-hot)"}
      />
      <text
        x="428"
        y="440"
        textAnchor="middle"
        fontSize={FS.name}
        letterSpacing=".08em"
        fill={led ? "var(--pda-txt3)" : "var(--pda-grnh)"}
      >
        {c.skill}
      </text>
      <text
        x="572"
        y="440"
        textAnchor="middle"
        fontSize={FS.name}
        letterSpacing=".08em"
        fill="var(--pda-txt)"
      >
        {c.laneRun}
      </text>
      <text
        x="428"
        y="478"
        textAnchor="middle"
        fontSize={FS.micro}
        letterSpacing=".22em"
        fill="var(--pda-txt3)"
      >
        SKILL
      </text>
      <text
        x="572"
        y="478"
        textAnchor="middle"
        fontSize={FS.micro}
        letterSpacing=".22em"
        fill="var(--pda-txt3)"
      >
        LANE
      </text>
      {[490, 500, 510].map((x) => (
        <line
          key={x}
          x1={x}
          y1={G.proc.y + G.proc.h}
          x2={x}
          y2={G.twin.y}
          stroke="var(--pda-amb)"
          opacity="0.55"
        />
      ))}

      {/* The gate — an aperture the output physically passes through. */}
      <text
        x={G.gate.cx}
        y="246"
        textAnchor="middle"
        fontSize={FS.head}
        letterSpacing=".14em"
        fill="var(--pda-txt)"
      >
        WHAT IT IS HELD TO
      </text>
      <line
        x1={G.proc.x + G.proc.w}
        y1={G.gate.railY}
        x2={G.gate.cx - 20}
        y2={G.gate.railY}
        stroke="var(--pda-amb)"
        strokeWidth="1.4"
        opacity="0.7"
      />
      {[G.gate.cx - 20, G.gate.cx + 12].map((x) => (
        <g key={x}>
          <rect
            x={x}
            y={G.gate.top}
            width="8"
            height={G.gate.railY - G.gate.gap / 2 - G.gate.top}
            fill="var(--pda-void)"
            stroke="var(--pda-hot)"
            opacity="0.9"
          />
          <rect
            x={x}
            y={G.gate.railY + G.gate.gap / 2}
            width="8"
            height={G.gate.bot - G.gate.railY - G.gate.gap / 2}
            fill="var(--pda-void)"
            stroke="var(--pda-hot)"
            opacity="0.9"
          />
        </g>
      ))}
      <line
        x1={G.gate.cx + 20}
        y1={G.gate.railY}
        x2="800"
        y2={G.gate.railY}
        stroke="var(--pda-amb)"
        strokeWidth="1.4"
        opacity="0.7"
      />
      <text
        x={G.gate.cx}
        y="396"
        textAnchor="middle"
        fontSize={FS.name}
        letterSpacing=".08em"
        fill="var(--pda-txt)"
      >
        {c.bar}
      </text>
      <text
        x={G.gate.cx}
        y="412"
        textAnchor="middle"
        fontSize={FS.chrome}
        letterSpacing=".08em"
        fill="var(--pda-txt2)"
      >
        {c.gatNote.split(" — ")[0]}
      </text>

      {/* WHAT IT CAN REACH — the output jacks on the right edge. */}
      <text
        x={G.edge}
        y="236"
        textAnchor="end"
        fontSize={FS.head}
        letterSpacing=".14em"
        fill="var(--pda-txt)"
      >
        WHAT IT CAN REACH
      </text>
      <rect x="798" y="318" width="4" height="4" fill="var(--pda-amb)" />
      <path
        d="M800,320 V290 H850"
        fill="none"
        stroke="var(--pda-amb)"
        strokeWidth="1.4"
        opacity="0.7"
      />
      <path
        d="M800,320 V350 H850"
        fill="none"
        stroke="var(--pda-amb)"
        strokeWidth="1.4"
        opacity="0.7"
      />
      {[280, 340].map((y) => (
        <rect
          key={y}
          x={G.jackX}
          y={y}
          width="20"
          height="20"
          fill="var(--pda-void)"
          stroke="var(--pda-amb)"
        />
      ))}
      <line x1="870" y1="290" x2="958" y2="290" stroke="var(--pda-amb)" opacity="0.45" />
      <line x1="870" y1="350" x2="958" y2="350" stroke="var(--pda-amb)" opacity="0.45" />
      <line x1={G.edge} y1="260" x2={G.edge} y2="380" stroke="var(--pda-amb)" opacity="0.4" />
      <text
        x={G.edge}
        y="272"
        textAnchor="end"
        fontSize={FS.name}
        letterSpacing=".08em"
        fill="var(--pda-txt)"
      >
        {c.system}
      </text>
      <text
        x={G.edge}
        y="332"
        textAnchor="end"
        fontSize={FS.name}
        letterSpacing=".08em"
        fill="var(--pda-txt)"
      >
        {c.surface}
      </text>

      {/* The patch bay. */}
      <text x="40" y="552" fontSize={FS.chrome} letterSpacing=".22em" fill="var(--pda-ink)">
        SUBSTRATE
      </text>
      <text
        x={G.edge}
        y="552"
        textAnchor="end"
        fontSize={FS.chrome}
        letterSpacing=".08em"
        fill="var(--pda-txt2)"
      >
        {substrateCaption(record.shapes)}
      </text>
      <line x1="40" y1={G.bayY} x2={G.edge} y2={G.bayY} stroke="var(--pda-amb)" opacity="0.8" />

      {/* Patch cords — the skill drawing on what it taps. */}
      {tapKeys.map((key, i) => {
        const si = record.shapes.findIndex((s) => s.key === key);
        const cx = G.socketCx(si);
        const laneY = 508 + i * 10;
        const tx = 420 + i * 40;
        return (
          <g key={key} stroke="var(--pda-grn)" opacity="0.6" fill="none">
            <path d={`M${cx},578 V${laneY} H${tx} V${G.twin.y + G.twin.h}`} />
            <rect x={cx - 2} y="574" width="4" height="4" fill="var(--pda-grn)" stroke="none" />
            <rect
              x={tx - 2}
              y={G.twin.y + G.twin.h}
              width="4"
              height="4"
              fill="var(--pda-grn)"
              stroke="none"
            />
          </g>
        );
      })}

      {record.shapes.map((s, i) => (
        <PatchSocket key={s.key} shape={s} i={i} tapped={taps(work, s.key)} record={record} />
      ))}
    </>
  );
}
