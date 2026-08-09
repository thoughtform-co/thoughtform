"use client";

import type { ReactNode } from "react";

import {
  Cartridge,
  Plate,
  wrapLines,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaGlyphs";
import type { CaseMapShape } from "@/lib/cases/types";

import { type Pt, bend, ribbonPaths, route } from "./ribbon";
import { type IclRecord, type IclVariantProps, type LetterSpec, adv, taps } from "./variants";

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
const FS = { chrome: 7.5, tag: 7.5, name: 8, value: 8.5 } as const;

/** Chip value lines wrap at this measure (120-wide package, 8u inset). */
const CHIP_CHARS = Math.floor(104 / adv(FS.name, 0.08));

/* ⚠ ONE FRAME (owner, 2026-08-08): the work chip IS the cartridge, grown —
   no carrier housing around it. The bright plate is painted on the
   cartridge's OWN notched silhouette and the pin nibs hang off its edges,
   so the centre reads as a single component, not a box in a box. */
const CHIP = { x: 409, y: 247, w: 281.6, h: 217.6, k: 1.6 } as const;
const CHIP_NOTCH = 14 * CHIP.k;
const CHIP_R = CHIP.x + CHIP.w;
const CHIP_B = CHIP.y + CHIP.h;

/**
 * THE SUBSTRATE ROW — only the shapes this work DRAWS ON (owner,
 * 2026-08-08: "remove voice and stakeholder", on a record that taps
 * neither, and the terminal symbol banks with them).
 *
 * The ghosted loom of untapped shapes and the 47 skill-mark cells are both
 * gone: reading 03 is where the whole estate lives, and this reading is
 * about ONE configuration. The bar still carries its shape's own skill
 * count, so the substrate's depth survives the simplification.
 *
 * ⚠ SLOTS ARE AUTHORED PER COUNT, not per shape key. Keeping a fixed home
 * per shape put all three of W-004's bars in one corner and left the other
 * half empty; deriving the row from HOW MANY there are keeps it balanced at
 * one, two or three. The trade is that a shape has no constant position
 * across works — which reading 02 can afford, being about one work.
 *
 * Every trunk is routed by hand against the part chips' boxes (GRAPH sits
 * at 330–450 × 556–642 and is what the leftward runs have to clear). The
 * readout measures TEXT collisions only, so ribbon-versus-box is checked
 * here in the geometry, not by the guard.
 */
const BAR_W = 150;
const BAR_H = 18;

interface BarSlot {
  x: number;
  y: number;
  /** Where the trunk leaves the chip's bottom edge. */
  drop: number;
  /** The horizontal lane it crosses on, below every box it passes. */
  lane: number;
}

/** ⚠ Every `drop` lands ON a bottom nib (449 + 20k), so a trunk leaves the
 *  chip through a pin rather than out of its blank edge. */
const BAR_SLOTS: Record<1 | 2 | 3, readonly BarSlot[]> = {
  1: [{ x: 420, y: 676, drop: 549, lane: 660 }],
  2: [
    { x: 220, y: 690, drop: 449, lane: 676 },
    { x: 600, y: 656, drop: 649, lane: 640 },
  ],
  3: [
    { x: 180, y: 700, drop: 449, lane: 690 },
    { x: 440, y: 660, drop: 569, lane: 650 },
    { x: 700, y: 700, drop: 669, lane: 682 },
  ],
};

/** The most bars the row can seat. The record's own maximum is three;
 *  `config-lab-fit` fails loudly if a work ever taps more. */
export const SWITCHBOARD_MAX_BARS = 3;

const barSlots = (n: number): readonly BarSlot[] =>
  BAR_SLOTS[Math.min(SWITCHBOARD_MAX_BARS, Math.max(1, n)) as 1 | 2 | 3];

/** The shapes this configuration draws on, in the record's own order. */
export const tappedShapes = (
  work: IclVariantProps["work"],
  record: IclRecord
): readonly CaseMapShape[] => record.shapes.filter((s) => taps(work, s.key));

/**
 * Both numbers DERIVED, and the estate's own total stays out of it: the row
 * draws three of five shapes, so printing `47 SKILLS` beside three bars that
 * sum to 35 would publish two totals a reader can subtract.
 */
export const substrateReach = (work: IclVariantProps["work"], record: IclRecord) =>
  `DRAWS ON ${tappedShapes(work, record).length} OF ${record.shapes.length} SHAPES`;

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
      text: substrateReach(work, record),
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
  for (const s of tappedShapes(work, record)) {
    specs.push({
      slot: `sb.bus.${s.key}`,
      text: `${s.label.toUpperCase()} · ${s.skills}`,
      fs: FS.name,
      track: 0.08,
      measure: BAR_W - 16,
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

/** A shape of judgment, as a labelled bus bar inline on its trunk. */
function BusBar({ shape, slot, led }: { shape: CaseMapShape; slot: BarSlot; led: boolean }) {
  const stroke = led ? "var(--pda-txt3)" : "var(--pda-grn)";
  return (
    <g>
      <rect
        x={slot.x}
        y={slot.y}
        width={BAR_W}
        height={BAR_H}
        fill="var(--pda-void)"
        stroke={stroke}
        strokeDasharray={led ? "5 4" : undefined}
      />
      {/* The bar's own underline — the reference's distribution rail. */}
      <line
        x1={slot.x + 4}
        y1={slot.y + BAR_H}
        x2={slot.x + BAR_W - 4}
        y2={slot.y + BAR_H}
        stroke={stroke}
        opacity="0.4"
      />
      <text
        x={slot.x + 8}
        y={slot.y + 12.6}
        fontSize={FS.name}
        letterSpacing=".08em"
        fill="var(--pda-txt)"
      >
        {`${shape.label.toUpperCase()} · ${shape.skills}`}
      </text>
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
  const drawn = tappedShapes(work, record).slice(0, SWITCHBOARD_MAX_BARS);
  const slots = barSlots(drawn.length);

  /* Pin nibs, hung directly off the chip's edges. The top and left runs
     start clear of the notch. */
  const nibs: ReactNode[] = [];
  for (let x = 449; x <= 669; x += 20) {
    nibs.push(<line key={`t${x}`} x1={x} y1={CHIP.y - 8} x2={x} y2={CHIP.y} />);
    nibs.push(<line key={`b${x}`} x1={x} y1={CHIP_B} x2={x} y2={CHIP_B + 8} />);
  }
  for (let y = 286; y <= 450; y += 19) {
    nibs.push(<line key={`l${y}`} x1={CHIP.x - 8} y1={y} x2={CHIP.x} y2={y} />);
    nibs.push(<line key={`r${y}`} x1={CHIP_R} y1={y} x2={CHIP_R + 8} y2={y} />);
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
          bend(1000, 120, 716, 176, "h", 22),
          [
            [716, 176],
            [706, 186],
          ],
          [
            [706, 186],
            [706, 760],
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
      <line x1="500" y1="90" x2="500" y2="243" stroke="var(--pda-dim)" />
      <path d="M496,94 L500,90 L504,94" fill="none" stroke="var(--pda-dim)" />
      <path d="M496,239 L500,243 L504,239" fill="none" stroke="var(--pda-dim)" />
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
          [CHIP.x, 320],
        ]}
        n={8}
        pitch={3.5}
        stroke={led ? "var(--pda-txt3)" : "var(--pda-dim)"}
        opacity={0.8}
        dashed={led}
      />
      {/* inherits in, bottom-left. ⚠ THE RUNS TURN UP INTO THE PIN ROW and
          land ON a nib (449 + 20k) — the first cut ran them HORIZONTALLY
          along the nib tips at y 473, and five conductors crossing a row of
          pins at 45° read as a hatch patch rather than as a connection. */}
      <Ribbon
        pts={route(bend(270, 513, 469, 496, "h", 14), [
          [469, 496],
          [469, CHIP_B],
        ])}
        n={5}
        stroke={wire}
        dashed={led}
      />
      <Ribbon
        pts={route(bend(390, 556, 549, 496, "v", 14), [
          [549, 496],
          [549, CHIP_B],
        ])}
        n={5}
        stroke="var(--pda-txt3)"
        opacity={0.7}
        dashed
      />
      {/* reach out, top-right. ⚠ NOTHING LEAVES THE SYSTEM CHIP UPWARD
          (owner, 2026-08-08) — the off-board continuation is deleted; a
          system a stream acts on is a terminus on this reading, not a
          transit. */}
      <Ribbon pts={bend(649, CHIP.y, 760, 173, "v", 16)} n={4} stroke={wire} dashed={led} />
      {/* the output run: chip → gate → junction → system + surface */}
      <Ribbon
        pts={[
          [CHIP_R, 400],
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

      {/* substrate trunks — one per shape this configuration draws on. */}
      {drawn.map((s, i) => {
        const slot = slots[i];
        const cx = slot.x + BAR_W / 2;
        const pts = route(bend(slot.drop, CHIP_B, cx, slot.lane, "v", 14), [
          [cx, slot.lane] as Pt,
          [cx, slot.y] as Pt,
        ]);
        return (
          <Ribbon
            key={s.key}
            pts={pts}
            n={3}
            pitch={3.5}
            stroke={led ? "var(--pda-txt3)" : "var(--pda-grn)"}
            opacity={0.55}
            dashed={led}
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

      {/* ── Tier 1: the one bright object — ONE frame. The plate fill is
          painted on the cartridge's own silhouette; the cartridge draws the
          only outline. */}
      <g stroke="var(--pda-hot)" opacity={led ? 0.35 : 0.55}>
        {nibs}
      </g>
      <path
        d={`M${CHIP.x + CHIP_NOTCH},${CHIP.y} H${CHIP_R} V${CHIP_B} H${CHIP.x} V${CHIP.y + CHIP_NOTCH} Z`}
        fill={led ? "rgba(var(--dawn-rgb), 0.04)" : "rgba(var(--dawn-rgb), 0.09)"}
        stroke="none"
      />
      <Cartridge
        x={CHIP.x}
        y={CHIP.y}
        w={CHIP.w}
        h={CHIP.h}
        state={led ? "led" : "hot"}
        work={pda}
        k={CHIP.k}
      />

      {/* ── Tier 3: the bus bars ─────────────────────────────────────── */}
      {drawn.map((s, i) => (
        <BusBar key={s.key} shape={s} slot={slots[i]} led={led} />
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
        {substrateReach(work, record)}
      </text>
    </>
  );
}
