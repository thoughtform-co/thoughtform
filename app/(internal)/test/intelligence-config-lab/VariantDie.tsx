"use client";

import type { ReactNode } from "react";

import { Cartridge, Plate } from "@/components/landing/home-v2/services/casefile/map/pda/pdaGlyphs";
import type { CaseMapShape } from "@/lib/cases/types";

import {
  type IclRecord,
  type IclVariantProps,
  type LetterSpec,
  adv,
  hatchTicks,
  hvh,
  shapeSymbols,
  substrateCaption,
  taps,
} from "./variants";

/**
 * THE DIE — the configuration as silicon (reference A, the CP2077 chipset).
 *
 * One board. The work is a large die DOCKED in a pin-grid socket at centre —
 * the same cartridge the grid flies in ADR-069, so the loved morph survives
 * promotion — and every part of the configuration is a different PACKAGE:
 *
 *   memory banks (left)     what it inherits — context solid, graph in the
 *                           adjacent-domain dashed hand
 *   edge connectors (right) what it can reach — gold fingers leaving the
 *                           board through its right edge
 *   dual-chip package       what runs it — skill and lane, two dies in ONE
 *                           housing with a bridged bus (the pair, physical)
 *   test-point strip        what it is held to — the bar beside the pads
 *   the ground plane        THE SUBSTRATE, below a grade rule: five shape
 *                           mains, each clustered with its Skills' 2–4 char
 *                           marks — the 47 symbols' first render anywhere
 *
 * Hierarchy is carried by VALUE (the reference's rule): the docked die is
 * the brightest object; the periphery recedes through `--pda-amb` line work
 * to `--pda-txt3` ghosts. Untapped mains ghost; tapped ones rise by vias
 * into the pair package, because the SKILL is what draws on the substrate.
 */

export const DIE_VIEWBOX = "0 0 1000 760";

/* Type rungs. Values track .08em (advance 0.68); headers .14em (0.74);
   chrome .22em (0.82). At the binding preset the meet is ≈0.6, so 7.4 is the
   floor rung (≈4.44px rendered) and it is spent ONLY on the symbol cells. */
/* ⚠ NOTHING UNDER 7.5 in a 1000-wide crop: the binding meet is 0.603
   (field 603px), so 7 rendered 4.22px — under the smoke's 4.3 floor. The
   sym rung's 7.4 clears at 4.46. */
const FS = { chrome: 7.5, head: 7.5, name: 8, value: 8.5, sym: 7.4, micro: 7.5 } as const;

/* The board, in authoring units. */
const G = {
  socket: { x: 350, y: 206, w: 300, h: 240, ch: 16 },
  die: { x: 368, y: 224, w: 264, h: 204, k: 1.5 },
  bankL: 40,
  bankR: 260,
  ctxY: 220,
  gphY: 324,
  bankH: 72,
  conL: 740,
  conR: 930,
  edge: 960,
  pair: { x: 350, y: 484, w: 300, h: 56, ch: 12 },
  gradeY: 560,
  railY: (i: number) => 588 + i * 34,
  railX0: 40,
  railX1: 960,
  symX0: 150,
} as const;

/* Symbol cells: width derives from the text so a cell always fits its own
   mark BY CONSTRUCTION; what must be asserted is the ROW — see
   `dieClusterFits`. */
const symCellW = (sym: string) => sym.length * adv(FS.sym, 0.08) + 8;
const SYM_GAP = 5;

/** The cluster row's total width vs its measure, per shape — the density
 *  experiment's own guard. The measure ends before the count's column. */
export function dieClusterFits(record: IclRecord) {
  return record.shapes.map((s) => ({
    key: s.key,
    width: shapeSymbols(record.skills, s).reduce((w, sym) => w + symCellW(sym) + SYM_GAP, -SYM_GAP),
    measure: G.railX1 - 60 - G.symX0,
  }));
}

/** Every string the die letters, with its measure — the fit test walks this
 *  for all 27 works. */
export function dieLettering(
  pda: IclVariantProps["pda"],
  work: IclVariantProps["work"],
  record: IclRecord
): LetterSpec[] {
  const c = pda.cfg;
  const specs: LetterSpec[] = [
    { slot: "die.chrome", text: "THE CONFIGURATION", fs: FS.chrome, track: 0.22, measure: 300 },
    { slot: "die.meter", text: "DRAW PER RUN", fs: FS.chrome, track: 0.22, measure: 200 },
    { slot: "die.price", text: "NEVER A PRICE.", fs: FS.micro, track: 0.08, measure: 200 },
    { slot: "die.ownerLabel", text: "WHO OWNS IT", fs: FS.chrome, track: 0.22, measure: 200 },
    { slot: "die.owner", text: pda.owner, fs: 10, track: 0.2, measure: 212 },
    { slot: "die.decides", text: "DECIDES ALONE", fs: FS.chrome, track: 0.22, measure: 190 },
    { slot: "die.autonomy", text: pda.autonomy, fs: FS.value, track: 0.08, measure: 190 },
    { slot: "die.h.inh", text: "WHAT IT INHERITS", fs: FS.head, track: 0.14, measure: 220 },
    { slot: "die.h.rch", text: "WHAT IT CAN REACH", fs: FS.head, track: 0.14, measure: 220 },
    { slot: "die.h.runs", text: "WHAT RUNS IT", fs: FS.head, track: 0.14, measure: 300 },
    { slot: "die.h.gat", text: "WHAT IT IS HELD TO", fs: FS.head, track: 0.14, measure: 300 },
    { slot: "die.context", text: c.context, fs: FS.name, track: 0.08, measure: 220 },
    { slot: "die.graph", text: c.graph, fs: FS.name, track: 0.08, measure: 220 },
    { slot: "die.system", text: c.system, fs: FS.name, track: 0.08, measure: 218 },
    { slot: "die.surface", text: c.surface, fs: FS.name, track: 0.08, measure: 218 },
    { slot: "die.skill", text: c.skill, fs: FS.name, track: 0.08, measure: 124 },
    { slot: "die.lane", text: c.laneRun, fs: FS.name, track: 0.08, measure: 124 },
    { slot: "die.tag.skill", text: "SKILL", fs: FS.micro, track: 0.22, measure: 124 },
    { slot: "die.tag.lane", text: "LANE", fs: FS.micro, track: 0.22, measure: 124 },
    { slot: "die.bar", text: c.bar, fs: FS.name, track: 0.08, measure: 300 },
    {
      slot: "die.gateOwner",
      text: c.gatNote.split(" — ")[0],
      fs: FS.chrome,
      track: 0.08,
      measure: 300,
    },
    { slot: "die.substrate", text: "SUBSTRATE", fs: FS.chrome, track: 0.22, measure: 200 },
    {
      slot: "die.caption",
      text: substrateCaption(record.shapes),
      fs: FS.chrome,
      track: 0.08,
      measure: 300,
    },
  ];
  for (const s of record.shapes) {
    specs.push({
      slot: `die.rail.${s.key}`,
      text: s.label.toUpperCase(),
      fs: FS.name,
      track: 0.08,
      measure: 104,
    });
    specs.push({
      slot: `die.count.${s.key}`,
      text: `· ${s.skills}`,
      fs: FS.name,
      track: 0.08,
      measure: 60,
    });
  }
  return specs;
}

/* ── Small sub-drawings ────────────────────────────────────────────────── */

function MemoryBank({
  x,
  y,
  w,
  h,
  dashed,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  dashed?: boolean;
}) {
  const stroke = dashed ? "var(--pda-txt3)" : "var(--pda-amb)";
  const cells: ReactNode[] = [];
  for (let r = 0; r < 2; r += 1) {
    for (let i = 0; i < 6; i += 1) {
      cells.push(
        <rect
          key={`${r}-${i}`}
          x={x + 8 + i * 35}
          y={y + 10 + r * 24}
          width="28"
          height="16"
          fill="rgba(192, 154, 70, 0.05)"
          stroke={stroke}
          strokeWidth="1"
          opacity={dashed ? 0.6 : 0.75}
        />
      );
    }
  }
  return (
    <>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill="none"
        stroke={stroke}
        strokeDasharray={dashed ? "5 4" : undefined}
      />
      {cells}
    </>
  );
}

function EdgeConnector({ x, y }: { x: number; y: number }) {
  const fingers: ReactNode[] = [];
  for (let i = 0; i < 6; i += 1) {
    fingers.push(
      <line
        key={i}
        x1={G.conR + 2}
        y1={y + 10 + i * 10.5}
        x2={G.edge - 2}
        y2={y + 10 + i * 10.5}
        stroke="var(--pda-hot)"
        strokeWidth="3"
        opacity="0.75"
      />
    );
  }
  return (
    <>
      <rect x={x} y={y} width={G.conR - x} height={G.bankH} fill="none" stroke="var(--pda-amb)" />
      {fingers}
    </>
  );
}

/** A 3-line bus from a package edge into the socket fringe. */
function Bus({
  x1,
  y1,
  x2,
  y2,
  midX,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  midX: number;
}) {
  return (
    <>
      {[-5, 0, 5].map((o) => (
        <path
          key={o}
          d={hvh(x1, y1 + o, x2, y2 + o, midX + o)}
          fill="none"
          stroke="var(--pda-amb)"
          strokeWidth="1"
          opacity="0.55"
        />
      ))}
      <rect x={x2 - 2} y={y2 - 7} width="4" height="14" fill="var(--pda-amb)" opacity="0.7" />
    </>
  );
}

function ClusterRail({
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
  const syms = shapeSymbols(record.skills, shape);
  let x = G.symX0;
  const cells = syms.map((sym, j) => {
    const w = symCellW(sym);
    const cell = (
      <g key={`${sym}-${j}`}>
        <rect
          x={x}
          y={y - 7.5}
          width={w}
          height="15"
          fill="var(--pda-void)"
          stroke={tapped ? "var(--pda-grn)" : "var(--pda-txt3)"}
          strokeWidth="1"
          opacity={tapped ? 0.85 : 0.7}
        />
        <text
          x={x + w / 2}
          y={y + 2.6}
          textAnchor="middle"
          fontSize={FS.sym}
          letterSpacing=".08em"
          fill={tapped ? "var(--pda-grn-ink)" : "var(--pda-txt3)"}
        >
          {sym}
        </text>
      </g>
    );
    x += w + SYM_GAP;
    return cell;
  });

  return (
    <g opacity={tapped ? 1 : 0.38}>
      <line
        x1={G.railX0}
        y1={y}
        x2={G.railX1}
        y2={y}
        stroke="var(--pda-amb)"
        opacity={tapped ? 0.45 : 0.28}
      />
      <text x={G.railX0} y={y - 6} fontSize={FS.name} letterSpacing=".08em" fill="var(--pda-txt)">
        {shape.label.toUpperCase()}
      </text>
      <text
        x={G.railX1}
        y={y - 6}
        textAnchor="end"
        fontSize={FS.name}
        letterSpacing=".08em"
        fill="var(--pda-txt2)"
      >
        {`· ${shape.skills}`}
      </text>
      {cells}
    </g>
  );
}

/* ── The drawing ───────────────────────────────────────────────────────── */

export function VariantDie({ pda, work, record }: IclVariantProps) {
  const c = pda.cfg;
  const led = !pda.configured;
  const tapIdx = record.shapes.filter((s) => taps(work, s.key)).map((s) => s.key);

  /* Pin fringe ticks around the socket cavity. */
  const fringe: ReactNode[] = [];
  for (let x = 372; x <= 628; x += 16) {
    fringe.push(<line key={`t${x}`} x1={x} y1={210} x2={x} y2={219} />);
    fringe.push(<line key={`b${x}`} x1={x} y1={433} x2={x} y2={442} />);
  }
  for (let y = 228; y <= 424; y += 16) {
    fringe.push(<line key={`l${y}`} x1={354} y1={y} x2={363} y2={y} />);
    fringe.push(<line key={`r${y}`} x1={637} y1={y} x2={646} y2={y} />);
  }

  const chev = (i: number) => {
    const x = 832 + i * 26;
    const on = i < pda.draw;
    return (
      <path
        key={i}
        d={`M${x},44 H${x + 16} L${x + 22},51 L${x + 16},58 H${x} Z`}
        fill={on ? "var(--pda-hot)" : "none"}
        stroke={on ? "var(--pda-hot)" : "var(--pda-hair2)"}
      />
    );
  };

  return (
    <>
      {/* Chrome */}
      <text x="40" y="36" fontSize={FS.chrome} letterSpacing=".22em" fill="var(--pda-txt3)">
        THE CONFIGURATION
      </text>
      <text
        x="960"
        y="36"
        textAnchor="end"
        fontSize={FS.chrome}
        letterSpacing=".22em"
        fill="var(--pda-txt3)"
      >
        DRAW PER RUN
      </text>
      {[0, 1, 2, 3, 4].map(chev)}
      <text
        x="958"
        y="74"
        textAnchor="end"
        fontSize={FS.micro}
        letterSpacing=".08em"
        fill="var(--pda-txt3)"
      >
        NEVER A PRICE.
      </text>

      {/* The owner, above the machine (positional law). */}
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
      {/* Autonomy as a DIMENSION — a distance between the owner and the
          machine, not another component. */}
      <line x1="500" y1="90" x2="500" y2="204" stroke="var(--pda-dim)" />
      <path d="M496,94 L500,90 L504,94" fill="none" stroke="var(--pda-dim)" />
      <path d="M496,200 L500,204 L504,200" fill="none" stroke="var(--pda-dim)" />
      <text x="512" y="142" fontSize={FS.chrome} letterSpacing=".22em" fill="var(--pda-txt3)">
        DECIDES ALONE
      </text>
      <text x="512" y="158" fontSize={FS.value} letterSpacing=".08em" fill="var(--pda-hot)">
        {pda.autonomy}
      </text>

      {/* The socket — a machined housing (chamfer TR+BL, children square). */}
      <path
        d={`M${G.socket.x},${G.socket.y} H${G.socket.x + G.socket.w - G.socket.ch} L${G.socket.x + G.socket.w},${G.socket.y + G.socket.ch} V${G.socket.y + G.socket.h} H${G.socket.x + G.socket.ch} L${G.socket.x},${G.socket.y + G.socket.h - G.socket.ch} Z`}
        fill="rgba(192, 154, 70, 0.03)"
        stroke="var(--pda-amb)"
        strokeWidth="1.2"
      />
      <g stroke="var(--pda-amb)" opacity="0.45">
        {fringe}
      </g>

      {/* The docked die — the ADR-069 persistent object, grown. */}
      <Cartridge
        x={G.die.x}
        y={G.die.y}
        w={G.die.w}
        h={G.die.h}
        state={led ? "led" : "hot"}
        work={pda}
        k={G.die.k}
      />

      {/* WHAT IT INHERITS — memory banks, graph in the dashed hand. */}
      <text x={G.bankL} y="208" fontSize={FS.head} letterSpacing=".14em" fill="var(--pda-txt)">
        WHAT IT INHERITS
      </text>
      <MemoryBank x={G.bankL} y={G.ctxY} w={G.bankR - G.bankL} h={G.bankH} />
      <text x={G.bankL} y="308" fontSize={FS.name} letterSpacing=".08em" fill="var(--pda-txt)">
        {c.context}
      </text>
      <MemoryBank x={G.bankL} y={G.gphY} w={G.bankR - G.bankL} h={G.bankH} dashed />
      <text x={G.bankL} y="412" fontSize={FS.name} letterSpacing=".08em" fill="var(--pda-txt2)">
        {c.graph}
      </text>
      <Bus x1={G.bankR} y1={G.ctxY + 36} x2={G.socket.x} y2={296} midX={302} />
      <Bus x1={G.bankR} y1={G.gphY + 36} x2={G.socket.x} y2={352} midX={318} />

      {/* WHAT IT CAN REACH — edge connectors leaving the board. */}
      <text
        x={G.edge}
        y="208"
        textAnchor="end"
        fontSize={FS.head}
        letterSpacing=".14em"
        fill="var(--pda-txt)"
      >
        WHAT IT CAN REACH
      </text>
      <line x1={G.edge} y1="214" x2={G.edge} y2="396" stroke="var(--pda-amb)" opacity="0.4" />
      <EdgeConnector x={G.conL} y={G.ctxY} />
      <text
        x={G.edge - 2}
        y="308"
        textAnchor="end"
        fontSize={FS.name}
        letterSpacing=".08em"
        fill="var(--pda-txt)"
      >
        {c.system}
      </text>
      <EdgeConnector x={G.conL} y={G.gphY} />
      <text
        x={G.edge - 2}
        y="412"
        textAnchor="end"
        fontSize={FS.name}
        letterSpacing=".08em"
        fill="var(--pda-txt)"
      >
        {c.surface}
      </text>
      <Bus x1={G.socket.x + G.socket.w} y1={296} x2={G.conL} y2={G.ctxY + 36} midX={695} />
      <Bus x1={G.socket.x + G.socket.w} y1={352} x2={G.conL} y2={G.gphY + 36} midX={695} />

      {/* WHAT RUNS IT — the dual-chip package: skill ⇄ lane, one housing. */}
      <text x={G.pair.x} y="474" fontSize={FS.head} letterSpacing=".14em" fill="var(--pda-txt)">
        WHAT RUNS IT
      </text>
      <path
        d={`M${G.pair.x},${G.pair.y} H${G.pair.x + G.pair.w - G.pair.ch} L${G.pair.x + G.pair.w},${G.pair.y + G.pair.ch} V${G.pair.y + G.pair.h} H${G.pair.x + G.pair.ch} L${G.pair.x},${G.pair.y + G.pair.h - G.pair.ch} Z`}
        fill="rgba(192, 154, 70, 0.04)"
        stroke="var(--pda-amb)"
      />
      {[0, 1].map((side) => (
        <rect
          key={side}
          x={side ? 506 : 362}
          y={G.pair.y + 8}
          width="132"
          height="40"
          fill="var(--pda-void)"
          stroke={led ? "var(--pda-txt3)" : side ? "var(--pda-amb)" : "var(--pda-grn)"}
          strokeDasharray={led ? "4 3" : undefined}
        />
      ))}
      {[505, 512, 519].map((y) => (
        <line
          key={y}
          x1="494"
          y1={y}
          x2="506"
          y2={y}
          stroke={led ? "var(--pda-txt3)" : "var(--pda-hot)"}
        />
      ))}
      <text
        x="428"
        y="509"
        textAnchor="middle"
        fontSize={FS.name}
        letterSpacing=".08em"
        fill={led ? "var(--pda-txt3)" : "var(--pda-grnh)"}
      >
        {c.skill}
      </text>
      <text
        x="572"
        y="509"
        textAnchor="middle"
        fontSize={FS.name}
        letterSpacing=".08em"
        fill="var(--pda-txt)"
      >
        {c.laneRun}
      </text>
      <text
        x="428"
        y="527"
        textAnchor="middle"
        fontSize={FS.micro}
        letterSpacing=".22em"
        fill="var(--pda-txt3)"
      >
        SKILL
      </text>
      <text
        x="572"
        y="527"
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
          y1={G.socket.y + G.socket.h}
          x2={x}
          y2={G.pair.y}
          stroke="var(--pda-amb)"
          opacity="0.55"
        />
      ))}

      {/* WHAT IT IS HELD TO — the test-point strip, right of the pair. The
          bar gets its OWN line: the longest live bar is 43 characters
          (W-004), which the pads' row cannot share. */}
      <text
        x={G.edge - 2}
        y="442"
        textAnchor="end"
        fontSize={FS.head}
        letterSpacing=".14em"
        fill="var(--pda-txt)"
      >
        WHAT IT IS HELD TO
      </text>
      {[880, 904, 928, 950].map((x) => (
        <rect key={x} x={x} y="450" width="8" height="8" fill="none" stroke="var(--pda-amb)" />
      ))}
      <text
        x={G.edge - 2}
        y="476"
        textAnchor="end"
        fontSize={FS.name}
        letterSpacing=".08em"
        fill="var(--pda-txt)"
      >
        {c.bar}
      </text>
      <text
        x={G.edge - 2}
        y="492"
        textAnchor="end"
        fontSize={FS.chrome}
        letterSpacing=".08em"
        fill="var(--pda-txt2)"
      >
        {c.gatNote.split(" — ")[0]}
      </text>

      {/* The grade rule, and the ground plane below it. */}
      <text x={G.railX0} y="552" fontSize={FS.chrome} letterSpacing=".22em" fill="var(--pda-ink)">
        SUBSTRATE
      </text>
      <text
        x={G.railX1}
        y="552"
        textAnchor="end"
        fontSize={FS.chrome}
        letterSpacing=".08em"
        fill="var(--pda-txt2)"
      >
        {substrateCaption(record.shapes)}
      </text>
      <line
        x1={G.railX0}
        y1={G.gradeY}
        x2={G.railX1}
        y2={G.gradeY}
        stroke="var(--pda-amb)"
        opacity="0.8"
      />
      <g stroke="var(--pda-amb)" opacity="0.3">
        {hatchTicks(G.railX0, G.railX1, G.gradeY + 1, 20, 7).map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />
        ))}
      </g>

      {/* Vias — the pair package drawing on what it taps. */}
      {tapIdx.map((key, i) => {
        const railI = record.shapes.findIndex((s) => s.key === key);
        const x = 470 + i * 30;
        const y = G.railY(railI);
        return (
          <g key={key} stroke="var(--pda-grn)" opacity="0.6">
            <line x1={x} y1={G.pair.y + G.pair.h} x2={x} y2={y} />
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
        <ClusterRail key={s.key} shape={s} i={i} tapped={taps(work, s.key)} record={record} />
      ))}
    </>
  );
}
