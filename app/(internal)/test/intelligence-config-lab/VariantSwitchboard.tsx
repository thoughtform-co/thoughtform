"use client";

import type { ReactNode } from "react";

import {
  Cartridge,
  Plate,
  wrapLines,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaGlyphs";
import type { CaseMapShape, CaseMapShapeKey } from "@/lib/cases/types";

import { type Pt, bend, ribbonPaths, route } from "./ribbon";
import {
  type IclRecord,
  type IclVariantProps,
  type LetterSpec,
  adv,
  shapeSymbols,
  skillsTotal,
  taps,
} from "./variants";

/**
 * THE SWITCHBOARD — the wiring IS the picture.
 *
 * Built after the owner's read that the first four archetypes were safe
 * iterations of the shipped layout. This one adopts the reference board's
 * COMPOSITION, not its parts catalog:
 *
 *   · ~two-thirds of the ink is RIBBONS — 3–8 parallel conductors that stay
 *     at pitch through 45° bends, pinch into pin rows, and cross each other
 *     where they need to (`ribbon.ts`)
 *   · a CASCADE three levels deep, which is the record's own shape:
 *     the work chip → five shape BUS BARS inline on the runs (`VOICE · 7`)
 *     → terminal BANKS of skill-symbol microchips at the periphery
 *   · ONE bright object (the docked work carrier); everything else recedes
 *     by value through amb line work to ghosted estate
 *   · staggered, asymmetric placement — no question-header skeleton, no
 *     centered cross; the part chips carry tiny function tags instead
 *   · a ghost routing layer, vias and unlettered component clusters behind
 *     (pure geometry — ornament may never fake a record string)
 *
 * The reach runs LEAVE the board (system's continuation exits the crop);
 * the output physically passes the gate aperture with the bar lettered
 * along the run. Person-led flips every ribbon to the dashed hand — the
 * whole switchboard hand-carried.
 */

export const SWITCHBOARD_VIEWBOX = "0 0 1000 760";

/* ⚠ NOTHING UNDER 7.5 in a 1000-wide crop (meet 0.603 → 4.52px); the
   symbol cells' 7.4 clears at 4.46. */
const FS = { chrome: 7.5, tag: 7.5, name: 8, value: 8.5, sym: 7.4 } as const;

/** Chip value lines wrap at this measure (120-wide package, 8u inset). */
const CHIP_CHARS = Math.floor(104 / adv(FS.name, 0.08));

const CARRIER = { x: 400, y: 240, w: 300, h: 230, ch: 16 } as const;

/** The five bus bars + banks, staggered like the reference's BLADES rows. */
const BARS: Record<
  CaseMapShapeKey,
  {
    x: number;
    y: number;
    w: number;
    bank: { x: number; y: number; perRow: number };
    drop: number;
    lane: number;
    enter: "l" | "r";
  }
> = {
  validation: {
    x: 770,
    y: 566,
    w: 150,
    bank: { x: 774, y: 592, perRow: 5 },
    drop: 585,
    lane: 575,
    enter: "l",
  },
  voice: {
    x: 80,
    y: 640,
    w: 150,
    bank: { x: 84, y: 666, perRow: 4 },
    drop: 445,
    lane: 649,
    enter: "r",
  },
  judgment: {
    x: 560,
    y: 636,
    w: 150,
    bank: { x: 720, y: 628, perRow: 6 },
    drop: 515,
    lane: 645,
    enter: "l",
  },
  stakeholder: {
    x: 300,
    y: 700,
    w: 150,
    bank: { x: 304, y: 724, perRow: 5 },
    drop: 480,
    lane: 709,
    enter: "r",
  },
  pattern: {
    x: 600,
    y: 700,
    w: 150,
    bank: { x: 760, y: 684, perRow: 7 },
    drop: 550,
    lane: 709,
    enter: "l",
  },
};

const symCellW = (sym: string) => sym.length * adv(FS.sym, 0.08) + 8;
const SYM_GAP = 5;

/** Widest bank row vs the room its corner of the board affords. */
export function switchboardBankFits(record: IclRecord) {
  const ROOM: Record<CaseMapShapeKey, number> = {
    validation: 150,
    voice: 150,
    judgment: 170,
    stakeholder: 150,
    pattern: 200,
  };
  return record.shapes.map((s) => {
    const syms = shapeSymbols(record.skills, s);
    const per = BARS[s.key].bank.perRow;
    let widest = 0;
    for (let r = 0; r * per < syms.length; r += 1) {
      const row = syms.slice(r * per, (r + 1) * per);
      widest = Math.max(
        widest,
        row.reduce((w, sym) => w + symCellW(sym) + SYM_GAP, -SYM_GAP)
      );
    }
    return { key: s.key, width: widest, measure: ROOM[s.key] };
  });
}

/** Every string the switchboard letters, with its measure. Chip values are
 *  emitted PER WRAPPED LINE; a third line gets measure 0 so it fails loudly
 *  instead of silently dropping (wrapLines truncates at its cap). */
export function switchboardLettering(
  pda: IclVariantProps["pda"],
  work: IclVariantProps["work"],
  record: IclRecord
): LetterSpec[] {
  const c = pda.cfg;
  const specs: LetterSpec[] = [
    { slot: "sb.chrome", text: "THE CONFIGURATION", fs: FS.chrome, track: 0.22, measure: 300 },
    { slot: "sb.designator", text: pda.id, fs: FS.name, track: 0.08, measure: 120 },
    { slot: "sb.meter", text: "DRAW PER RUN", fs: FS.chrome, track: 0.22, measure: 200 },
    { slot: "sb.price", text: "NEVER A PRICE.", fs: FS.chrome, track: 0.08, measure: 200 },
    { slot: "sb.ownerLabel", text: "WHO OWNS IT", fs: FS.chrome, track: 0.22, measure: 200 },
    { slot: "sb.owner", text: pda.owner, fs: 10, track: 0.2, measure: 212 },
    { slot: "sb.decides", text: "DECIDES ALONE", fs: FS.chrome, track: 0.22, measure: 190 },
    { slot: "sb.autonomy", text: pda.autonomy, fs: FS.value, track: 0.08, measure: 190 },
    { slot: "sb.bar", text: c.bar, fs: FS.name, track: 0.08, measure: 260 },
    {
      slot: "sb.gateOwner",
      text: c.gatNote.split(" — ")[0],
      fs: FS.chrome,
      track: 0.08,
      measure: 260,
    },
    { slot: "sb.why", text: c.why, fs: FS.name, track: 0.08, measure: 620 },
    {
      slot: "sb.caption",
      text: `${skillsTotal(record.shapes)} SKILLS · ${record.shapes.length} SHAPES`,
      fs: FS.chrome,
      track: 0.08,
      measure: 300,
    },
  ];
  const chip = (slot: string, tag: string, value: string) => {
    specs.push({ slot: `sb.${slot}.tag`, text: tag, fs: FS.tag, track: 0.22, measure: 62 });
    wrapLines(value, CHIP_CHARS, 3).forEach((line, i) =>
      specs.push({
        slot: `sb.${slot}.L${i}`,
        text: line,
        fs: FS.name,
        track: 0.08,
        measure: i < 2 ? 104 : 0,
      })
    );
  };
  chip("skill", "SKILL", c.skill);
  chip("lane", "LANE", c.laneRun);
  chip("context", "CONTEXT", c.context);
  chip("graph", "GRAPH", c.graph);
  chip("system", "SYSTEM", c.system);
  chip("surface", "SURFACE", c.surface);
  for (const s of record.shapes) {
    specs.push({
      slot: `sb.bus.${s.key}`,
      text: `${s.label.toUpperCase()} · ${s.skills}`,
      fs: FS.name,
      track: 0.08,
      measure: 134,
    });
  }
  return specs;
}

/* ── Sub-drawings ──────────────────────────────────────────────────────── */

function Ribbon({
  pts,
  n,
  pitch = 4,
  stroke,
  opacity = 0.65,
  dashed,
}: {
  pts: readonly Pt[];
  n: number;
  pitch?: number;
  stroke: string;
  opacity?: number;
  dashed?: boolean;
}) {
  return (
    <g stroke={stroke} opacity={opacity} fill="none" strokeWidth="1">
      {ribbonPaths(pts, n, pitch).map((d, i) => (
        <path key={i} d={d} strokeDasharray={dashed ? "4 3" : undefined} />
      ))}
    </g>
  );
}

/** A mid-tier part package: dark slab, tiny drawn glyph, function tag,
 *  the VALUE in up to two wrapped lines. */
function PartChip({
  x,
  y,
  tag,
  value,
  glyph,
  dashed,
  led,
  accent,
}: {
  x: number;
  y: number;
  tag: string;
  value: string;
  glyph: ReactNode;
  dashed?: boolean;
  led?: boolean;
  accent?: string;
}) {
  const stroke = led || dashed ? "var(--pda-txt3)" : (accent ?? "var(--pda-amb)");
  const lines = wrapLines(value, CHIP_CHARS);
  return (
    <g>
      <rect
        x={x}
        y={y}
        width="120"
        height="86"
        fill="var(--pda-void)"
        stroke={stroke}
        strokeDasharray={dashed || led ? "5 4" : undefined}
      />
      <g transform={`translate(${x + 10}, ${y + 10})`}>{glyph}</g>
      <text
        x={x + 110}
        y={y + 21}
        textAnchor="end"
        fontSize={FS.tag}
        letterSpacing=".22em"
        fill="var(--pda-txt3)"
      >
        {tag}
      </text>
      {lines.map((line, i) => (
        <text
          key={i}
          x={x + 60}
          y={y + (lines.length > 1 ? 54 : 60) + i * 14}
          textAnchor="middle"
          fontSize={FS.name}
          letterSpacing=".08em"
          fill={led ? "var(--pda-txt3)" : "var(--pda-txt)"}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function BusBar({
  shape,
  tapped,
  led,
  record,
}: {
  shape: CaseMapShape;
  tapped: boolean;
  led: boolean;
  record: IclRecord;
}) {
  const b = BARS[shape.key];
  const syms = shapeSymbols(record.skills, shape);
  const stroke = tapped && !led ? "var(--pda-grn)" : "var(--pda-amb)";

  const cells: ReactNode[] = [];
  let cx = b.bank.x;
  let row = 0;
  syms.forEach((sym, i) => {
    if (i > 0 && i % b.bank.perRow === 0) {
      row += 1;
      cx = b.bank.x;
    }
    const w = symCellW(sym);
    const cy = b.bank.y + row * 17;
    cells.push(
      <g key={`${sym}-${i}`}>
        <rect
          x={cx}
          y={cy}
          width={w}
          height="15"
          fill="var(--pda-void)"
          stroke={tapped && !led ? "var(--pda-grn)" : "var(--pda-txt3)"}
          strokeWidth="1"
          opacity={tapped ? 0.85 : 0.7}
        />
        <text
          x={cx + w / 2}
          y={cy + 10.1}
          textAnchor="middle"
          fontSize={FS.sym}
          letterSpacing=".08em"
          fill={tapped && !led ? "var(--pda-grn-ink)" : "var(--pda-txt3)"}
        >
          {sym}
        </text>
      </g>
    );
    cx += w + SYM_GAP;
  });

  /* The bar → bank feeder stub. */
  const stub: Pt[] =
    b.bank.y > b.y + 18
      ? [
          [b.x + b.w / 2, b.y + 18],
          [b.x + b.w / 2, b.bank.y],
        ]
      : [
          [b.x + b.w, b.y + 9],
          [b.bank.x - 4, b.y + 9],
        ];

  return (
    <g opacity={tapped ? 1 : 0.38}>
      <rect x={b.x} y={b.y} width={b.w} height="18" fill="var(--pda-void)" stroke={stroke} />
      <line
        x1={b.x + 4}
        y1={b.y + 18}
        x2={b.x + b.w - 4}
        y2={b.y + 18}
        stroke={stroke}
        opacity="0.4"
      />
      <text
        x={b.x + 8}
        y={b.y + 12.6}
        fontSize={FS.name}
        letterSpacing=".08em"
        fill="var(--pda-txt)"
      >
        {`${shape.label.toUpperCase()} · ${shape.skills}`}
      </text>
      <Ribbon pts={stub} n={3} pitch={3.5} stroke={stroke} opacity={0.5} dashed={led} />
      {cells}
    </g>
  );
}

/* Tiny drawn glyphs (16×16 local space). */
const GLYPHS: Record<string, ReactNode> = {
  lattice: (
    <>
      <rect x="0" y="0" width="6" height="6" fill="var(--pda-grn)" />
      <rect x="9" y="0" width="6" height="6" fill="none" stroke="var(--pda-grn)" />
      <rect x="0" y="9" width="6" height="6" fill="none" stroke="var(--pda-grn)" />
      <rect x="9" y="9" width="6" height="6" fill="var(--pda-grn)" />
    </>
  ),
  osc: (
    <>
      <rect x="0" y="0" width="15" height="15" fill="none" stroke="var(--pda-amb)" />
      <path d="M7.5,2 L13,7.5 L7.5,13 L2,7.5 Z" fill="none" stroke="var(--pda-amb)" />
    </>
  ),
  tray: (
    <>
      <rect x="4" y="0" width="11" height="4" fill="none" stroke="var(--pda-amb)" />
      <rect x="2" y="5.5" width="11" height="4" fill="none" stroke="var(--pda-amb)" />
      <rect x="0" y="11" width="11" height="4" fill="none" stroke="var(--pda-amb)" />
    </>
  ),
  node: (
    <rect
      x="1"
      y="1"
      width="13"
      height="13"
      fill="none"
      stroke="var(--pda-txt3)"
      strokeDasharray="3 2"
    />
  ),
  port: (
    <>
      <rect x="0" y="3" width="9" height="9" fill="none" stroke="var(--pda-amb)" />
      <path d="M9,7.5 H16 M13,4.5 L16,7.5 L13,10.5" fill="none" stroke="var(--pda-amb)" />
    </>
  ),
  aperture: (
    <>
      <path d="M5,0 H0 V15 H5" fill="none" stroke="var(--pda-amb)" strokeWidth="1.4" />
      <path d="M11,0 H16 V15 H11" fill="none" stroke="var(--pda-amb)" strokeWidth="1.4" />
    </>
  ),
};

/* Fixed ornament coordinates (pure geometry — never fake text). */
const VIAS: readonly Pt[] = [
  [372, 120],
  [340, 480],
  [612, 180],
  [742, 300],
  [284, 250],
  [530, 128],
  [906, 232],
  [186, 420],
  [660, 540],
  [420, 610],
  [878, 640],
  [126, 560],
  [960, 400],
  [64, 260],
  [706, 84],
  [244, 686],
];

export function VariantSwitchboard({ pda, work, record }: IclVariantProps) {
  const c = pda.cfg;
  const led = !pda.configured;
  const wire = led ? "var(--pda-txt3)" : "var(--pda-amb)";

  /* Carrier pin nibs, all four edges. */
  const nibs: ReactNode[] = [];
  for (let x = 420; x <= 680; x += 20) {
    nibs.push(<line key={`t${x}`} x1={x} y1={CARRIER.y - 8} x2={x} y2={CARRIER.y} />);
    nibs.push(
      <line key={`b${x}`} x1={x} y1={CARRIER.y + CARRIER.h} x2={x} y2={CARRIER.y + CARRIER.h + 8} />
    );
  }
  for (let y = 262; y <= 448; y += 19) {
    nibs.push(<line key={`l${y}`} x1={CARRIER.x - 8} y1={y} x2={CARRIER.x} y2={y} />);
    nibs.push(
      <line key={`r${y}`} x1={CARRIER.x + CARRIER.w} y1={y} x2={CARRIER.x + CARRIER.w + 8} y2={y} />
    );
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
      {/* ── Ghost routing layer + vias + unlettered clusters ─────────── */}
      <Ribbon
        pts={route(
          bend(80, 0, 80, 180, "v", 0),
          bend(80, 180, 880, 220, "h", 24),
          [
            [880, 220],
            [920, 260],
          ],
          [
            [920, 260],
            [920, 760],
          ]
        )}
        n={8}
        pitch={5}
        stroke="var(--pda-dim)"
        opacity={0.07}
      />
      <Ribbon
        pts={route(
          bend(1000, 120, 700, 176, "h", 22),
          [
            [700, 176],
            [690, 186],
          ],
          [
            [690, 186],
            [690, 760],
          ]
        )}
        n={6}
        pitch={5}
        stroke="var(--pda-dim)"
        opacity={0.06}
      />
      <g fill="var(--pda-dim)" opacity="0.18">
        {VIAS.map(([x, y], i) => (
          <rect key={i} x={x} y={y} width="2.5" height="2.5" />
        ))}
      </g>
      <g stroke="var(--pda-dim)" opacity="0.2" fill="none">
        {[
          [60, 430],
          [350, 86],
          [610, 540],
        ].map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <rect x={x} y={y} width="10" height="7" />
            <rect x={x + 14} y={y} width="10" height="7" />
            <rect x={x + 28} y={y} width="10" height="7" />
          </g>
        ))}
      </g>

      {/* ── Chrome ───────────────────────────────────────────────────── */}
      <text x="40" y="36" fontSize={FS.chrome} letterSpacing=".22em" fill="var(--pda-txt3)">
        THE CONFIGURATION
      </text>
      <text x="40" y="54" fontSize={FS.name} letterSpacing=".08em" fill="var(--pda-txt2)">
        {pda.id}
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
        fontSize={FS.chrome}
        letterSpacing=".08em"
        fill="var(--pda-txt3)"
      >
        NEVER A PRICE.
      </text>

      {/* ── The owner, above; a single thin wire — authority, not data. ── */}
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
      <line x1="500" y1="90" x2="500" y2="238" stroke="var(--pda-dim)" />
      <path d="M496,94 L500,90 L504,94" fill="none" stroke="var(--pda-dim)" />
      <path d="M496,234 L500,238 L504,234" fill="none" stroke="var(--pda-dim)" />
      <text x="512" y="146" fontSize={FS.chrome} letterSpacing=".22em" fill="var(--pda-txt3)">
        DECIDES ALONE
      </text>
      <text x="512" y="162" fontSize={FS.value} letterSpacing=".08em" fill="var(--pda-hot)">
        {pda.autonomy}
      </text>

      {/* ── Tier-2 wiring (under the chips and carrier) ──────────────── */}
      {/* skill + lane marry at a junction block, one trunk into the work. */}
      <Ribbon
        pts={bend(300, 163, 332, 308, "h", 14)}
        n={4}
        stroke={led ? "var(--pda-txt3)" : "var(--pda-grn)"}
        opacity={0.6}
        dashed={led}
      />
      <Ribbon pts={bend(240, 343, 332, 308, "h", 14)} n={4} stroke={wire} dashed={led} />
      <rect
        x="326"
        y="300"
        width="12"
        height="40"
        fill="var(--pda-void)"
        stroke={led ? "var(--pda-txt3)" : "var(--pda-hot)"}
      />
      <Ribbon
        pts={[
          [338, 320],
          [400, 320],
        ]}
        n={8}
        pitch={3.5}
        stroke={led ? "var(--pda-txt3)" : "var(--pda-dim)"}
        opacity={0.8}
        dashed={led}
      />
      {/* inherits in, bottom-left — runs arrive PERPENDICULAR to the pin
          edge and stop a nib short, so the fringe carries the last step. */}
      <Ribbon pts={bend(270, 513, 450, 478, "h", 16)} n={5} stroke={wire} dashed={led} />
      <Ribbon
        pts={[
          [390, 556],
          [390, 492],
          [404, 478],
          [500, 478],
        ]}
        n={5}
        stroke="var(--pda-txt3)"
        opacity={0.7}
        dashed
      />
      {/* reach out, top-right — and OFF the board */}
      <Ribbon pts={bend(650, 240, 760, 173, "v", 16)} n={4} stroke={wire} dashed={led} />
      <Ribbon
        pts={[
          [820, 130],
          [820, 0],
        ]}
        n={4}
        stroke={wire}
        opacity={0.35}
        dashed={led}
      />
      {/* the output run: carrier → gate → junction → system + surface */}
      <Ribbon
        pts={[
          [700, 400],
          [796, 400],
        ]}
        n={8}
        pitch={3.5}
        stroke={wire}
        opacity={0.7}
        dashed={led}
      />
      <rect x="796" y="380" width="12" height="40" fill="var(--pda-void)" stroke={wire} />
      <Ribbon pts={bend(808, 388, 820, 216, "h", 10)} n={4} stroke={wire} dashed={led} />
      <Ribbon pts={bend(808, 412, 900, 470, "h", 14)} n={4} stroke={wire} dashed={led} />
      {/* the gate aperture the run passes through */}
      {[740, 762].map((x) => (
        <g key={x} stroke="var(--pda-hot)" fill="var(--pda-void)">
          <rect x={x} y="364" width="8" height="24" />
          <rect x={x} y="412" width="8" height="24" />
        </g>
      ))}
      <text x="698" y="340" fontSize={FS.name} letterSpacing=".08em" fill="var(--pda-txt)">
        {c.bar}
      </text>
      <text x="698" y="356" fontSize={FS.chrome} letterSpacing=".08em" fill="var(--pda-txt2)">
        {c.gatNote.split(" — ")[0]}
      </text>

      {/* substrate trunks — the whole estate is WIRED; the streams this
          work draws on run live, the rest sit ghosted in the loom. */}
      {record.shapes.map((s) => {
        const tapped = taps(work, s.key);
        const b = BARS[s.key];
        const entry: Pt = b.enter === "l" ? [b.x, b.y + 9] : ([b.x + b.w, b.y + 9] as Pt);
        const pts = route(bend(b.drop, CARRIER.y + CARRIER.h, entry[0], b.lane, "v", 14), [
          [entry[0], b.lane] as Pt,
          entry,
        ]);
        return (
          <Ribbon
            key={s.key}
            pts={pts}
            n={tapped ? 3 : 2}
            pitch={3.5}
            stroke={tapped ? (led ? "var(--pda-txt3)" : "var(--pda-grn)") : "var(--pda-dim)"}
            opacity={tapped ? 0.55 : 0.14}
            dashed={led && tapped}
          />
        );
      })}

      {/* ── Tier 2: the part chips, staggered ────────────────────────── */}
      <PartChip
        x={180}
        y={120}
        tag="SKILL"
        value={c.skill}
        glyph={GLYPHS.lattice}
        led={led}
        accent={led ? undefined : "var(--pda-grn)"}
      />
      <PartChip x={120} y={300} tag="LANE" value={c.laneRun} glyph={GLYPHS.osc} led={led} />
      <PartChip x={150} y={470} tag="CONTEXT" value={c.context} glyph={GLYPHS.tray} led={led} />
      <PartChip x={330} y={556} tag="GRAPH" value={c.graph} glyph={GLYPHS.node} dashed />
      <PartChip x={760} y={130} tag="SYSTEM" value={c.system} glyph={GLYPHS.port} led={led} />
      <PartChip x={840} y={470} tag="SURFACE" value={c.surface} glyph={GLYPHS.aperture} led={led} />

      {/* ── Tier 1: the one bright object ────────────────────────────── */}
      <g stroke="var(--pda-hot)" opacity={led ? 0.35 : 0.55}>
        {nibs}
      </g>
      <path
        d={`M${CARRIER.x},${CARRIER.y} H${CARRIER.x + CARRIER.w - CARRIER.ch} L${CARRIER.x + CARRIER.w},${CARRIER.y + CARRIER.ch} V${CARRIER.y + CARRIER.h} H${CARRIER.x + CARRIER.ch} L${CARRIER.x},${CARRIER.y + CARRIER.h - CARRIER.ch} Z`}
        fill={led ? "rgba(var(--dawn-rgb), 0.04)" : "rgba(var(--dawn-rgb), 0.09)"}
        stroke={led ? "var(--pda-txt3)" : "var(--pda-hot)"}
        strokeWidth="1.2"
      />
      <Cartridge
        x={425}
        y={258.5}
        w={250}
        h={193}
        state={led ? "led" : "hot"}
        work={pda}
        k={1.42}
      />

      {/* ── Tier 3: the bus bars and their banks ─────────────────────── */}
      {record.shapes.map((s) => (
        <BusBar key={s.key} shape={s} tapped={taps(work, s.key)} led={led} record={record} />
      ))}

      {/* The specification note + the derived totals. */}
      <text
        x="500"
        y="752"
        textAnchor="middle"
        fontSize={FS.name}
        letterSpacing=".08em"
        fill="var(--pda-txt2)"
      >
        {c.why}
      </text>
      <text
        x="958"
        y="752"
        textAnchor="end"
        fontSize={FS.chrome}
        letterSpacing=".08em"
        fill="var(--pda-txt3)"
      >
        {`${skillsTotal(record.shapes)} SKILLS · ${record.shapes.length} SHAPES`}
      </text>
    </>
  );
}
