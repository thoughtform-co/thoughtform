"use client";

import type { ReactNode } from "react";

import type { CaseMapShapeKey } from "@/lib/cases/types";

import { PDA_FLIGHT_MS } from "./pdaFlight";
import type { FlightRect } from "./pdaFlight";
import { Cartridge, Plate, wrapLines } from "./pdaGlyphs";
import type { PdaEntry } from "./PdaEntry";
import type { PdaShape, PdaWork } from "./pdaRecord";
import { type Pt, bend, polylineLength, ribbonPaths, route } from "./ribbon";

/**
 * 02 · THE CONFIGURATION — the switchboard.
 *
 * The wiring IS the picture. Promoted from `/test/intelligence-config-lab`
 * (2026-08-09) after four archetypes were judged there against the reading
 * this replaces; the owner's read on that set was that they were safe
 * iterations of the drawing they were meant to challenge, because each kept
 * its skeleton — four question-headers around a centred core — and borrowed
 * the reference's PARTS rather than its COMPOSITION. What the reference
 * actually does:
 *
 *   · most of the ink is RIBBONS — 3–8 parallel conductors holding pitch
 *     through 45° bends, landing on pin rows (`ribbon.ts`, unit-pinned)
 *   · ONE bright object, and hierarchy carried by VALUE rather than by
 *     position: the work chip is lit, the periphery recedes to ghosted
 *   · staggered, asymmetric placement — no centred cross, no header
 *     skeleton; each part package carries a tiny function tag instead
 *   · a ghost routing layer and unlettered ornament behind the live board
 *     (pure geometry — ornament may never fake a record string)
 *
 * ⚠ ONE FRAME (owner). The chip IS the reading-01 cartridge grown to
 * `CORE_K`: the lit plate is painted on the cartridge's own notched
 * silhouette and the pin nibs hang off its edges. A carrier housing around
 * it read as a box in a box.
 *
 * ⚠ ONLY WHAT THE RECORD CONNECTS IS DRAWN (owner). The 47 skill-mark cells
 * and the ghosted loom of untapped shapes are both deleted: the substrate
 * row carries the shapes this configuration draws on and nothing else, and
 * reading 03 is where the whole estate lives. Nothing leaves the system chip
 * upward either — a system a stream acts on is a terminus here, not a
 * transit.
 */

/**
 * THE CROP, tightened onto what the board draws.
 *
 * The drawing is authored in 1000×760 and its lettered content spans
 * x 60…962 / y 28…755, so the crop is that box plus a hair. `xMidYMid meet`
 * scales by the MINIMUM ratio, and at the binding field (603×493, the real
 * console at 1280×720) the tight crop buys the whole reading 10 % of type —
 * 4.5 → 4.97 px on the smallest rung. The ghost ribbons deliberately run off
 * all four edges; a wire that leaves the board is the point.
 */
export const CONFIG_VIEWBOX = "56 20 910 740";

/** The chip, and the flight's second home. `CORE_K` × the 176×136 cartridge,
 *  so the two rects are EXACTLY similar and one uniform scale carries the
 *  morph without the object changing proportion on the way. */
export const CORE_K = 1.6;
const CHIP = { x: 409, y: 247, w: 176 * CORE_K, h: 136 * CORE_K } as const;
export const CORE_RECT: FlightRect = { ...CHIP };

const CHIP_NOTCH = 14 * CORE_K;
const CHIP_R = CHIP.x + CHIP.w;
const CHIP_B = CHIP.y + CHIP.h;

/**
 * ⚠ NOTHING LETTERS UNDER 7.5 in this crop. The binding meet is 0.663, so
 * 7 renders 4.64 px — over the smoke's 4.3 floor but under the 5 px this
 * reading held before, and the reading that answers the offer should not be
 * the surface's smallest type. Values track .08em (advance 0.68), function
 * tags and chrome .22em (0.82).
 */
const FS = { chrome: 7.5, tag: 7.5, name: 8, value: 8.5, readout: 10 } as const;

/** PT Mono's advance plus the tracking — the model `MONO_ADVANCE` evaluates
 *  at .08em, kept general here because this drawing letters at three. */
const adv = (fs: number, track: number) => fs * (0.6 + track);

/** A part package letters into its 120-unit box less an 8-unit inset. */
const CHIP_CHARS = Math.floor(104 / adv(FS.name, 0.08));

/* ── The substrate row ──────────────────────────────────────────────────
   Slots are authored PER COUNT, not per shape key: a fixed home per shape
   put all three of a record's bars in one corner and left the other half
   empty, so the row derives from HOW MANY there are. The trade is that a
   shape has no constant position across records — which this reading can
   afford, being about one record.

   ⚠ Every `drop` lands ON a bottom nib (449 + 20k), so a trunk leaves the
   chip through a pin rather than out of a blank edge. Ribbon-versus-box
   clearance is hand-checked here: the fit guard and the smoke both measure
   TEXT, and neither can see a conductor crossing a package. */
const BAR_W = 150;
const BAR_H = 18;

interface BarSlot {
  x: number;
  y: number;
  drop: number;
  /** The horizontal lane it crosses on, below every box it passes. */
  lane: number;
}

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

/** The most bars the row can seat. The record's own maximum is three, and
 *  `pda-viewbox` fails loudly if a stream ever taps more. */
export const CONFIG_MAX_BARS = 3;

/** The shapes this configuration draws on, in the record's own order. */
export const drawnShapes = (work: PdaWork, shapes: readonly PdaShape[]): readonly PdaShape[] =>
  shapes.filter((s) => work.taps.includes(s.key as CaseMapShapeKey));

/**
 * Both numbers DERIVED, and the estate's own total stays off this reading:
 * three bars reading 12, 9 and 14 sum to 35, so a caption claiming 47 beside
 * them would publish two totals a reader can subtract. Reading 03 owns the
 * reservoir.
 */
export const substrateReach = (work: PdaWork, shapes: readonly PdaShape[]) =>
  `DRAWS ON ${drawnShapes(work, shapes).length} OF ${shapes.length} SHAPES`;

/* ── The readout ────────────────────────────────────────────────────────
   ADR-069's contract survives the redraw: the drawing letters the NAME and
   ONE reactive line carries the SENTENCE. It rests on why-this-lane and
   swaps to the hovered part's note. Left-anchored so it never meets the
   derived caption on the same baseline. */
const READOUT = { x: 60, y: 752, measure: 760 } as const;
export const readoutMeasure = () => READOUT.measure;
export const READOUT_TYPE = FS.readout;

/** Which note a part hands to the readout. Two packages share a note — the
 *  Skill and its lane are one answer, and so are the context and the graph. */
const NOTE: Record<string, (w: PdaWork) => string> = {
  runs: (w) => w.cfg.runsNote,
  rch: (w) => w.cfg.rchNote,
  inh: (w) => w.cfg.inhNote,
  gat: (w) => w.cfg.gatNote,
};

/* ── The fit declaration ────────────────────────────────────────────────
   Every string this drawing letters, with the measure it has to fit in.
   `pda-viewbox` walks it for all twenty-seven streams: SVG `<text>` neither
   wraps nor reports overflow, so a value past its box vanishes at the edge
   with nothing on screen to say so. A lettered string missing from here is a
   defect in the drawing, not a gap in the guard. */
export interface ConfigLetterSpec {
  slot: string;
  text: string;
  fs: number;
  /** Tracking in em — the advance model needs it. */
  track: number;
  measure: number;
}

export const configSpecWidth = (s: ConfigLetterSpec) => s.text.length * adv(s.fs, s.track);

export function configurationLettering(
  work: PdaWork,
  shapes: readonly PdaShape[]
): ConfigLetterSpec[] {
  const c = work.cfg;
  const specs: ConfigLetterSpec[] = [
    { slot: "chrome", text: "THE CONFIGURATION", fs: FS.chrome, track: 0.22, measure: 300 },
    { slot: "designator", text: work.id, fs: FS.name, track: 0.08, measure: 120 },
    { slot: "meter", text: "DRAW PER RUN", fs: FS.chrome, track: 0.22, measure: 200 },
    { slot: "price", text: "NEVER A PRICE.", fs: FS.chrome, track: 0.08, measure: 200 },
    { slot: "ownerLabel", text: "WHO OWNS IT", fs: FS.chrome, track: 0.22, measure: 200 },
    { slot: "owner", text: work.owner, fs: 10, track: 0.2, measure: 212 },
    { slot: "decides", text: "DECIDES ALONE", fs: FS.chrome, track: 0.22, measure: 190 },
    { slot: "autonomy", text: work.autonomy, fs: FS.value, track: 0.08, measure: 190 },
    { slot: "bar", text: c.bar, fs: FS.name, track: 0.08, measure: 260 },
    { slot: "gateOwner", text: gateSeat(work), fs: FS.chrome, track: 0.08, measure: 260 },
    {
      slot: "caption",
      text: substrateReach(work, shapes),
      fs: FS.chrome,
      track: 0.08,
      measure: 300,
    },
    /* The readout at rest, and every state it can swap to. */
    { slot: "readout.rest", text: c.why, fs: FS.readout, track: 0.08, measure: READOUT.measure },
    ...Object.entries(NOTE).map(([k, note]) => ({
      slot: `readout.${k}`,
      text: note(work),
      fs: FS.readout,
      track: 0.08,
      measure: READOUT.measure,
    })),
  ];

  /* A package value WRAPS to two lines. A third would land on the box's
     bottom edge, so it is declared with a zero measure — the guard fails
     loudly rather than the drawing dropping the tail silently. */
  const pkg = (slot: string, tag: string, value: string) => {
    specs.push({ slot: `${slot}.tag`, text: tag, fs: FS.tag, track: 0.22, measure: 62 });
    wrapLines(value, CHIP_CHARS, 3).forEach((line, i) =>
      specs.push({
        slot: `${slot}.L${i}`,
        text: line,
        fs: FS.name,
        track: 0.08,
        measure: i < 2 ? 104 : 0,
      })
    );
  };
  pkg("skill", "SKILL", c.skill);
  pkg("lane", "LANE", c.laneRun);
  pkg("context", "CONTEXT", c.context);
  pkg("graph", "GRAPH", c.graph);
  pkg("system", "SYSTEM", c.system);
  pkg("surface", "SURFACE", c.surface);

  for (const s of drawnShapes(work, shapes)) {
    specs.push({
      slot: `bus.${s.key}`,
      text: `${s.name} · ${s.skills}`,
      fs: FS.name,
      track: 0.08,
      measure: BAR_W - 16,
    });
  }
  return specs;
}

/** Who answers for the gate — the head of `gatNote`, which pairs that seat
 *  with how the gate is checked. The seat letters on the board; the whole
 *  sentence goes to the readout. */
const gateSeat = (work: PdaWork) => work.cfg.gatNote.split(" — ")[0];

/* ── Sub-drawings ──────────────────────────────────────────────────────── */

function Ribbon({
  pts,
  n,
  pitch = 4,
  stroke,
  opacity = 0.65,
  dashed,
  draw,
}: {
  pts: readonly Pt[];
  n: number;
  pitch?: number;
  stroke: string;
  opacity?: number;
  dashed?: boolean;
  /** Draw-on delay in ms, or `null` to sit at rest. */
  draw: number | null;
}) {
  /* ⚠ The class goes on each PATH, not the group: `fl-pda-wire` animates
     `stroke-dashoffset`, and reading 03 proves the per-path form. */
  const len = draw === null ? 0 : polylineLength(pts);
  return (
    <g stroke={stroke} opacity={opacity} fill="none" strokeWidth="1">
      {ribbonPaths(pts, n, pitch).map((d, i) => (
        <path
          key={i}
          d={d}
          strokeDasharray={dashed ? "4 3" : undefined}
          className={draw === null ? undefined : "fl-pda-wire"}
          style={
            draw === null
              ? undefined
              : ({ "--l": len, animationDelay: `${draw}ms` } as React.CSSProperties)
          }
        />
      ))}
    </g>
  );
}

/** A part package: dark slab, a drawn glyph, its function tag, and the
 *  record's own value in up to two lines. */
function Package({
  x,
  y,
  tag,
  value,
  glyph,
  part,
  dashed,
  led,
  accent,
  hot,
  onLit,
}: {
  x: number;
  y: number;
  tag: string;
  value: string;
  glyph: ReactNode;
  part: string;
  dashed?: boolean;
  led?: boolean;
  accent?: string;
  /** Lit because its ANSWER is the one the readout is showing. Two packages
   *  share a part key — the Skill and its lane are one answer — so hovering
   *  either lights the pair, which is the reading. */
  hot?: boolean;
  onLit: (k: string | null) => void;
}) {
  const stroke = hot
    ? "var(--pda-hot)"
    : led || dashed
      ? "var(--pda-txt3)"
      : (accent ?? "var(--pda-amb)");
  const lines = wrapLines(value, CHIP_CHARS);
  return (
    <g onMouseEnter={() => onLit(part)} onMouseLeave={() => onLit(null)}>
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

/** A shape of judgment, as a labelled bus bar inline on its own trunk. */
function BusBar({ shape, slot, led }: { shape: PdaShape; slot: BarSlot; led: boolean }) {
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
        {`${shape.name} · ${shape.skills}`}
      </text>
    </g>
  );
}

/* Drawn glyphs, 16×16 in their own local space. A different silhouette per
   part is the reference's rule: shape carries role. */
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

/** Fixed ornament — pure geometry, and it may never fake a record string. */
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

/* The arrival, in ms. The chip carries the flight from t=0 (it is the object
   reading 01 handed over), the wires draw on under it, the packages light,
   and the substrate row seats last — so the board assembles outward from the
   record rather than fading in as one picture. */
const T = {
  owner: 60,
  wire: 220,
  wireStep: 45,
  pkg: 300,
  pkgStep: 55,
  bar: 560,
  barStep: 70,
  foot: 740,
} as const;

export function ViewConfiguration({
  work,
  shapes,
  lit,
  onLit,
  still,
  entry,
}: {
  work: PdaWork;
  shapes: readonly PdaShape[];
  lit: string | null;
  onLit: (k: string | null) => void;
  still: boolean;
  entry: PdaEntry;
}) {
  const led = !work.configured;
  const wire = led ? "var(--pda-txt3)" : "var(--pda-amb)";
  const drawn = drawnShapes(work, shapes).slice(0, CONFIG_MAX_BARS);
  const slots = BAR_SLOTS[Math.min(CONFIG_MAX_BARS, Math.max(1, drawn.length)) as 1 | 2 | 3];

  /* Every animated group drops its class once the pointer has moved, so a
     hover repaints without replaying the entrance. The DOCK is the one
     exception and it lives in state — see pda.css. */
  const inCls = still ? undefined : "fl-pda-in";
  const at = (ms: number) => (still ? undefined : { animationDelay: `${ms}ms` });
  let wireN = 0;
  const drawAt = () => (still ? null : T.wire + wireN++ * T.wireStep);

  const note = (lit && NOTE[lit]?.(work)) || work.cfg.why;

  const chev = (i: number) => {
    const x = 832 + i * 26;
    const on = i < work.draw;
    return (
      <path
        key={i}
        d={`M${x},44 H${x + 16} L${x + 22},51 L${x + 16},58 H${x} Z`}
        fill={on ? "var(--pda-hot)" : "none"}
        stroke={on ? "var(--pda-hot)" : "var(--pda-hair2)"}
      />
    );
  };

  /* Pin nibs, hung directly off the chip's edges; the top and left runs
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

  return (
    <>
      {/* ── Ghost routing, vias and unlettered clusters ───────────────── */}
      <g className={inCls}>
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
          draw={null}
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
          draw={null}
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
      </g>

      {/* ── Chrome ───────────────────────────────────────────────────── */}
      <g className={inCls}>
        <text x="60" y="36" fontSize={FS.chrome} letterSpacing=".22em" fill="var(--pda-txt3)">
          THE CONFIGURATION
        </text>
        <text x="60" y="54" fontSize={FS.name} letterSpacing=".08em" fill="var(--pda-txt2)">
          {work.id}
        </text>
        <text
          x="958"
          y="36"
          textAnchor="end"
          fontSize={FS.chrome}
          letterSpacing=".22em"
          fill="var(--pda-txt3)"
        >
          DRAW PER RUN
        </text>
        {[0, 1, 2, 3, 4].map(chev)}
        {/* Read against the workload. NEVER a price, on any surface. */}
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
      </g>

      {/* ── The owner, above the machine, on a single thin wire. The seat
              is authority, not data — it never gets a ribbon. ────────── */}
      <g className={inCls} style={at(T.owner)}>
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
        <Plate cx={500} cy={64} w={240} h={44} hot label={work.owner} />
        <line x1="500" y1="90" x2="500" y2="243" stroke="var(--pda-dim)" />
        <path d="M496,94 L500,90 L504,94" fill="none" stroke="var(--pda-dim)" />
        <path d="M496,239 L500,243 L504,239" fill="none" stroke="var(--pda-dim)" />
        <text x="512" y="146" fontSize={FS.chrome} letterSpacing=".22em" fill="var(--pda-txt3)">
          DECIDES ALONE
        </text>
        <text x="512" y="162" fontSize={FS.value} letterSpacing=".08em" fill="var(--pda-hot)">
          {work.autonomy}
        </text>
      </g>

      {/* ── The wiring, under the packages and the chip ───────────────── */}
      {/* What runs it: the Skill and its lane marry at a junction block and
          enter the chip as one trunk — the interdependent pair, physical. */}
      <Ribbon
        pts={bend(300, 163, 332, 308, "h", 14)}
        n={4}
        stroke={led ? "var(--pda-txt3)" : "var(--pda-grn)"}
        opacity={0.6}
        dashed={led}
        draw={drawAt()}
      />
      <Ribbon
        pts={bend(240, 343, 332, 308, "h", 14)}
        n={4}
        stroke={wire}
        dashed={led}
        draw={drawAt()}
      />
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
        draw={drawAt()}
      />

      {/* What it inherits. ⚠ THE RUNS TURN UP INTO THE PIN ROW and land ON a
          nib (449 + 20k): the first cut ran them horizontally ALONG the nib
          tips, and five conductors crossing a pin row at 45° read as a hatch
          patch rather than as a connection. */}
      <Ribbon
        pts={route(bend(270, 513, 469, 496, "h", 14), [
          [469, 496],
          [469, CHIP_B],
        ])}
        n={5}
        stroke={wire}
        dashed={led}
        draw={drawAt()}
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
        draw={drawAt()}
      />

      {/* What it can reach. ⚠ NOTHING LEAVES THE SYSTEM CHIP UPWARD — the
          off-board continuation is deleted (owner). */}
      <Ribbon
        pts={bend(649, CHIP.y, 760, 173, "v", 16)}
        n={4}
        stroke={wire}
        dashed={led}
        draw={drawAt()}
      />

      {/* The output run: chip → the gate it passes through → the surfaces. */}
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
        draw={drawAt()}
      />
      <rect x="796" y="380" width="12" height="40" fill="var(--pda-void)" stroke={wire} />
      <Ribbon
        pts={bend(808, 388, 820, 216, "h", 10)}
        n={4}
        stroke={wire}
        dashed={led}
        draw={drawAt()}
      />
      <Ribbon
        pts={bend(808, 412, 900, 470, "h", 14)}
        n={4}
        stroke={wire}
        dashed={led}
        draw={drawAt()}
      />

      {/* The gate — an aperture the output physically passes through, with
          the bar lettered on it and the seat that answers for it beneath. */}
      <g onMouseEnter={() => onLit("gat")} onMouseLeave={() => onLit(null)}>
        {[740, 762].map((x) => (
          <g
            key={x}
            stroke="var(--pda-hot)"
            fill="var(--pda-void)"
            strokeWidth={lit === "gat" ? 1.6 : 1}
          >
            <rect x={x} y="364" width="8" height="24" />
            <rect x={x} y="412" width="8" height="24" />
          </g>
        ))}
        <text
          x="698"
          y="340"
          fontSize={FS.name}
          letterSpacing=".08em"
          fill={lit === "gat" ? "var(--pda-hot)" : "var(--pda-txt)"}
        >
          {work.cfg.bar}
        </text>
        <text x="698" y="356" fontSize={FS.chrome} letterSpacing=".08em" fill="var(--pda-txt2)">
          {gateSeat(work)}
        </text>
      </g>

      {/* The substrate trunks — one per shape this configuration draws on. */}
      {drawn.map((s, i) => {
        const slot = slots[i];
        const cx = slot.x + BAR_W / 2;
        return (
          <Ribbon
            key={s.key}
            pts={route(bend(slot.drop, CHIP_B, cx, slot.lane, "v", 14), [
              [cx, slot.lane] as Pt,
              [cx, slot.y] as Pt,
            ])}
            n={3}
            pitch={3.5}
            stroke={led ? "var(--pda-txt3)" : "var(--pda-grn)"}
            opacity={0.55}
            dashed={led}
            draw={still ? null : T.bar + i * T.barStep - 120}
          />
        );
      })}

      {/* ── The part packages, staggered ─────────────────────────────── */}
      <g className={inCls} style={at(T.pkg)}>
        <Package
          x={180}
          y={120}
          tag="SKILL"
          value={work.cfg.skill}
          glyph={GLYPHS.lattice}
          part="runs"
          hot={lit === "runs"}
          led={led}
          accent={led ? undefined : "var(--pda-grn)"}
          onLit={onLit}
        />
      </g>
      <g className={inCls} style={at(T.pkg + T.pkgStep)}>
        <Package
          x={120}
          y={300}
          tag="LANE"
          value={work.cfg.laneRun}
          glyph={GLYPHS.osc}
          part="runs"
          hot={lit === "runs"}
          led={led}
          onLit={onLit}
        />
      </g>
      <g className={inCls} style={at(T.pkg + 2 * T.pkgStep)}>
        <Package
          x={150}
          y={470}
          tag="CONTEXT"
          value={work.cfg.context}
          glyph={GLYPHS.tray}
          part="inh"
          hot={lit === "inh"}
          led={led}
          onLit={onLit}
        />
      </g>
      <g className={inCls} style={at(T.pkg + 3 * T.pkgStep)}>
        <Package
          x={330}
          y={556}
          tag="GRAPH"
          value={work.cfg.graph}
          glyph={GLYPHS.node}
          part="inh"
          hot={lit === "inh"}
          dashed
          onLit={onLit}
        />
      </g>
      <g className={inCls} style={at(T.pkg + 4 * T.pkgStep)}>
        <Package
          x={760}
          y={130}
          tag="SYSTEM"
          value={work.cfg.system}
          glyph={GLYPHS.port}
          part="rch"
          hot={lit === "rch"}
          led={led}
          onLit={onLit}
        />
      </g>
      <g className={inCls} style={at(T.pkg + 5 * T.pkgStep)}>
        <Package
          x={840}
          y={470}
          tag="SURFACE"
          value={work.cfg.surface}
          glyph={GLYPHS.aperture}
          part="rch"
          hot={lit === "rch"}
          led={led}
          onLit={onLit}
        />
      </g>

      {/* ── The one bright object. The plate fill is painted on the
              cartridge's own silhouette; the cartridge draws the only
              outline, and the nibs are a SIBLING so the dock's fill-box
              origin stays the cartridge's own. ─────────────────────────── */}
      <g className={inCls} style={at(T.owner)} stroke="var(--pda-hot)" opacity={led ? 0.35 : 0.55}>
        {nibs}
      </g>
      <g
        className={entry.kind === "flight" ? "fl-pda-dock" : still ? undefined : "fl-pda-bloom"}
        style={
          entry.kind === "flight"
            ? ({
                "--dx": `${entry.dx}px`,
                "--dy": `${entry.dy}px`,
                "--dk": entry.dk,
              } as React.CSSProperties)
            : undefined
        }
      >
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
          work={work}
          k={CORE_K}
        />
      </g>

      {/* ── The substrate row ────────────────────────────────────────── */}
      {drawn.map((s, i) => (
        <g key={s.key} className={inCls} style={at(T.bar + i * T.barStep)}>
          <BusBar shape={s} slot={slots[i]} led={led} />
        </g>
      ))}

      {/* ── The readout, and the derived reach ───────────────────────────
              ⚠ NO `data-fl-text` on the readout: the casefile's decoder
              caches its targets once per client and would strand a stale
              sentence after the first directory switch (ADR-069). */}
      <g className={inCls} style={at(T.foot)}>
        <text
          x={READOUT.x}
          y={READOUT.y}
          fontSize={FS.readout}
          letterSpacing=".08em"
          fill="var(--pda-txt2)"
        >
          {note}
        </text>
        <text
          x="958"
          y={READOUT.y}
          textAnchor="end"
          fontSize={FS.chrome}
          letterSpacing=".08em"
          fill="var(--pda-txt3)"
        >
          {substrateReach(work, shapes)}
        </text>
      </g>
    </>
  );
}

/** Re-exported so `pda.css`'s dock duration and this drawing stay one pair. */
export { PDA_FLIGHT_MS };
