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
 * 02 · THE CONFIGURATION — the switchboard, SIMPLIFIED (ADR-070 U1).
 *
 * The wiring IS the picture — that survives. What the 2026-08-10 owner pass
 * changed, against the reference board's own composition (one bright centre,
 * RADIAL fan-out, quiet periphery):
 *
 *   · EVERY RUN IS CENTRE-OUT. The junction blocks, the doubled SYSTEM
 *     wiring and the two full-board ghost ribbons are deleted; each part
 *     connects to the chip by its own short bundle, and everything the
 *     stream reaches passes through ONE gate on ONE output trunk.
 *   · A PART IS A SILHOUETTE, NOT A SQUARE. The six 120×86 rects (owner:
 *     "just simple squares") are now six drawn housings, 176 wide — the
 *     glyph vocabulary scaled up to BE the block: notched plate, chevron
 *     bar, stacked sheets, dashed inset, pinned port, open aperture.
 *   · THE FUNCTION TAG IS THE HEADER. fs 7.5 `--pda-txt3` (owner:
 *     "completely and utterly unacceptable") → fs 10 `--pda-txt2`, top-left,
 *     one ink across all six so the tags read as a system.
 *
 * ⚠ ONE FRAME (owner). The chip IS the reading-01 cartridge grown to
 * `CORE_K`: the lit plate is painted on the cartridge's own notched
 * silhouette and the pin nibs hang off its edges. A carrier housing around
 * it read as a box in a box.
 *
 * ⚠ ONLY WHAT THE RECORD CONNECTS IS DRAWN (owner). The 47 skill-mark cells
 * and the ghosted loom of untapped shapes stay deleted; the substrate row
 * carries the shapes this configuration draws on and nothing else, and
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
 * console at 1280×720) the tight crop buys the whole reading 10 % of type.
 * The trimmed via field still runs to the crop's edge; a mark that leaves
 * the board is the point.
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
 * ⚠ NOTHING LETTERS UNDER 7.5 in this crop (binding meet 0.663 → 4.97px).
 * The U1 scale, derived from the record's own worst strings rather than
 * chosen (probe 2026-08-10):
 *
 *   role      worst string                                   chars  at fs
 *   value     COMPONENT + SUPPLIER FACTS / CONTEXT HELD…       26   10 → wraps 2
 *   tag       SURFACE · CONTEXT                                 7   10 → 57.4u
 *   bar       CONSISTENT EVIDENCE / NO UNSUPPORTED INFERENCE   46   10 → wraps 2
 *   readout   the 96-char why                                  96   11 → 718u ≤ 760
 *
 * The bar CANNOT letter on one line above the gate at anything over 8 (46
 * chars × 6.8 = 313u against a 230u channel), which is why it wraps like a
 * package value instead of shrinking — the owner's complaint was exactly
 * type traded away for layout. The readout must outrank every value
 * (`pda-viewbox`), so values 8 → 10 forces readout 10 → 11.
 */
const FS = { chrome: 7.5, tag: 10, name: 10, readout: 11 } as const;

/** PT Mono's advance plus the tracking — the model `MONO_ADVANCE` evaluates
 *  at .08em, kept general here because this drawing letters at three. */
const adv = (fs: number, track: number) => fs * (0.6 + track);

/** A part block letters into its 176-unit housing less a 13-unit inset. */
const BLOCK_W = 176;
const BLOCK_MEASURE = BLOCK_W - 26;
const BLOCK_CHARS = Math.floor(BLOCK_MEASURE / adv(FS.name, 0.08));

/** The bar letters in the channel above the gate: x 700 to the system
 *  column's clearance. Two lines at value size, never one line at chrome
 *  size — see the FS note. */
const BAR_MEASURE = 230;
const BAR_CHARS = Math.floor(BAR_MEASURE / adv(FS.name, 0.08));

/* ── The substrate row ──────────────────────────────────────────────────
   Slots are authored PER COUNT, not per shape key: a fixed home per shape
   put all three of a record's bars in one corner and left the other half
   empty, so the row derives from HOW MANY there are. The trade is that a
   shape has no constant position across records — which this reading can
   afford, being about one record.

   ⚠ Every `drop` lands ON a bottom nib (449 + 20k), so a trunk leaves the
   chip through a pin rather than out of a blank edge — and since U1 every
   drop is ≥ 549, because the GRAPH block now owns x 360–536 of the bottom
   band and a 449 drop would run straight through it. Ribbon-versus-box
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
    { x: 200, y: 690, drop: 549, lane: 676 },
    { x: 600, y: 656, drop: 649, lane: 644 },
  ],
  3: [
    { x: 180, y: 700, drop: 549, lane: 690 },
    { x: 440, y: 660, drop: 589, lane: 650 },
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
    /* The seam pair shares one baseline since U1: the label ends at 665 and
       the value starts at 677, so their measures are the run each actually
       has — not the generous 190 the old stacked layout spent. */
    { slot: "decides", text: "DECIDES ALONE", fs: FS.chrome, track: 0.22, measure: 90 },
    { slot: "autonomy", text: work.autonomy, fs: FS.name, track: 0.08, measure: 85 },
    { slot: "gateOwner", text: gateSeat(work), fs: FS.chrome, track: 0.08, measure: 230 },
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

  /* A block value WRAPS to two lines. A third would land on the housing's
     bottom edge, so it is declared with a zero measure — the guard fails
     loudly rather than the drawing dropping the tail silently. The bar is
     declared the same way: it wraps in the gate channel since U1. */
  const wrapped = (slot: string, value: string, chars: number, measure: number) =>
    wrapLines(value, chars, 3).forEach((line, i) =>
      specs.push({
        slot: `${slot}.L${i}`,
        text: line,
        fs: FS.name,
        track: 0.08,
        measure: i < 2 ? measure : 0,
      })
    );

  const pkg = (slot: string, tag: string, value: string) => {
    specs.push({ slot: `${slot}.tag`, text: tag, fs: FS.tag, track: 0.22, measure: 70 });
    wrapped(slot, value, BLOCK_CHARS, BLOCK_MEASURE);
  };
  pkg("skill", "SKILL", c.skill);
  pkg("lane", "LANE", c.laneRun);
  pkg("context", "CONTEXT", c.context);
  pkg("graph", "GRAPH", c.graph);
  pkg("system", "SYSTEM", c.system);
  pkg("surface", "SURFACE", c.surface);
  wrapped("bar", c.bar, BAR_CHARS, BAR_MEASURE);

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

/**
 * A part of the configuration, drawn as its OWN HOUSING (ADR-070 U1).
 *
 * The owner's ruling: six identical rects with a 16×16 glyph in the corner
 * were "just simple squares", so the glyph vocabulary is scaled up to BE the
 * block — shape carries role at housing size, and the corner glyphs are
 * deleted with the room they no longer earn.
 *
 *   notch     SKILL    the cartridge family's TL cut + the encoded hatch band
 *   chevron   LANE     a bar whose point feeds the chip — throughput
 *   stack     CONTEXT  offset sheet echoes above the housing — what it carries
 *   dashed    GRAPH    the adjacent domain's dashed hand + an inset
 *   port      SYSTEM   a pinned plug on the inboard edge — what it acts on
 *   aperture  SURFACE  two open brackets — where people meet it
 *
 * ⚠ THE TAG IS THE HEADER NOW: fs 10 in `--pda-txt2`, top-left, one ink
 * across all six. Person-led keeps every silhouette (shape carries role even
 * unbound) and goes dashed `--pda-txt3` — the negative space stays a reading.
 */
type PartKind = "notch" | "chevron" | "stack" | "dashed" | "port" | "aperture";

function Part({
  x,
  y,
  h,
  kind,
  tag,
  value,
  part,
  led,
  green,
  hot,
  onLit,
}: {
  x: number;
  y: number;
  h: number;
  kind: PartKind;
  tag: string;
  value: string;
  part: string;
  led?: boolean;
  green?: boolean;
  /** Lit because its ANSWER is the one the readout is showing. Two parts
   *  share a part key — the Skill and its lane are one answer — so hovering
   *  either lights the pair, which is the reading. */
  hot?: boolean;
  onLit: (k: string | null) => void;
}) {
  const w = BLOCK_W;
  const dashedKind = kind === "dashed";
  const stroke = hot
    ? "var(--pda-hot)"
    : led || dashedKind
      ? "var(--pda-txt3)"
      : green
        ? "var(--pda-grn)"
        : "var(--pda-amb)";
  const dash = led || dashedKind ? "5 4" : undefined;
  const lines = wrapLines(value, BLOCK_CHARS);
  /* The chevron bar loses 16 units to its point, so its centre shifts. */
  const cx = kind === "chevron" ? x + (w - 16) / 2 : x + w / 2;
  const tagX = kind === "aperture" ? x + 24 : x + 13;

  const silhouette: Record<PartKind, ReactNode> = {
    notch: (
      <>
        <path
          d={`M${x + 12},${y} H${x + w} V${y + h} H${x} V${y + 12} Z`}
          fill="var(--pda-void)"
          stroke={stroke}
          strokeDasharray={dash}
        />
        {/* The encoded hatch — the v19 mockup's material band, in SVG. */}
        <g stroke={stroke} opacity="0.45">
          {Array.from({ length: 12 }, (_, i) => (
            <line key={i} x1={x + 6 + i * 14} y1={y + h - 2} x2={x + 13 + i * 14} y2={y + h - 9} />
          ))}
        </g>
      </>
    ),
    chevron: (
      <path
        d={`M${x},${y} H${x + w - 16} L${x + w},${y + h / 2} L${x + w - 16},${y + h} H${x} Z`}
        fill="var(--pda-void)"
        stroke={stroke}
        strokeDasharray={dash}
      />
    ),
    stack: (
      <>
        <line x1={x + 6} y1={y - 5} x2={x + w - 10} y2={y - 5} stroke={stroke} opacity="0.45" />
        <line x1={x + 12} y1={y - 10} x2={x + w - 20} y2={y - 10} stroke={stroke} opacity="0.25" />
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          fill="var(--pda-void)"
          stroke={stroke}
          strokeDasharray={dash}
        />
      </>
    ),
    dashed: (
      <>
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          fill="var(--pda-void)"
          stroke={stroke}
          strokeDasharray="5 4"
        />
        <rect
          x={x + 4}
          y={y + 4}
          width={w - 8}
          height={h - 8}
          fill="none"
          stroke={stroke}
          strokeDasharray="3 2"
          opacity="0.5"
        />
      </>
    ),
    port: (
      <>
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          fill="var(--pda-void)"
          stroke={stroke}
          strokeDasharray={dash}
        />
        {/* The plug on the BOARD-FACING edge — the output riser enters
            THIS, so it sits on the bottom at the riser's own x (936 in
            authoring space; the tab is placed relative to the housing). */}
        <rect x={x + 150} y={y + h} width={24} height={12} fill="var(--pda-void)" stroke={stroke} />
        {[156, 162, 168].map((dx) => (
          <line
            key={dx}
            x1={x + dx}
            y1={y + h + 3}
            x2={x + dx}
            y2={y + h + 9}
            stroke={stroke}
            opacity="0.6"
          />
        ))}
      </>
    ),
    aperture: (
      <>
        <path
          d={`M${x + 18},${y} H${x} V${y + h} H${x + 18}`}
          fill="none"
          stroke={stroke}
          strokeWidth="1.4"
          strokeDasharray={dash}
        />
        <path
          d={`M${x + w - 18},${y} H${x + w} V${y + h} H${x + w - 18}`}
          fill="none"
          stroke={stroke}
          strokeWidth="1.4"
          strokeDasharray={dash}
        />
      </>
    ),
  };

  return (
    <g onMouseEnter={() => onLit(part)} onMouseLeave={() => onLit(null)}>
      {/* The aperture is open by design, so it needs its own hit bed. */}
      <rect x={x} y={y} width={w} height={h} fill="transparent" />
      {silhouette[kind]}
      <text
        x={tagX}
        y={y + 18}
        fontSize={FS.tag}
        letterSpacing=".22em"
        fill={hot ? "var(--pda-hot)" : "var(--pda-txt2)"}
      >
        {tag}
      </text>
      {lines.map((line, i) => (
        <text
          key={i}
          x={cx}
          y={y + (lines.length > 1 ? 38 : 44) + i * 16}
          textAnchor="middle"
          fontSize={FS.name}
          letterSpacing=".08em"
          fill={hot ? "var(--pda-hot)" : led ? "var(--pda-txt3)" : "var(--pda-txt)"}
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
        y={slot.y + 13.4}
        fontSize={FS.name}
        letterSpacing=".08em"
        fill="var(--pda-txt)"
      >
        {`${shape.name} · ${shape.skills}`}
      </text>
    </g>
  );
}

/** Fixed ornament — pure geometry, and it may never fake a record string.
 *  Trimmed 16 → 10 in the U1 declutter; the six that went sat inside the
 *  owner plate, the graph block, the bar band or a live channel. */
const VIAS: readonly Pt[] = [
  [372, 120],
  [340, 480],
  [284, 250],
  [906, 232],
  [186, 420],
  [878, 640],
  [126, 560],
  [960, 400],
  [64, 260],
  [706, 84],
];

/* The arrival, in ms. The chip carries the flight from t=0 (it is the object
   reading 01 handed over), the wires draw on under it, the parts light,
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
  const barLines = wrapLines(work.cfg.bar, BAR_CHARS);

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
      {/* ── Ornament: the trimmed via field and two quiet pad clusters.
              ⚠ THE GHOST RIBBONS ARE DELETED (U1) — two full-board bundles
              behind a drawing the owner read as "too much going on" were
              texture bought at the price of the picture. ─────────────── */}
      <g className={inCls}>
        <g fill="var(--pda-dim)" opacity="0.18">
          {VIAS.map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="2.5" height="2.5" />
          ))}
        </g>
        <g stroke="var(--pda-dim)" opacity="0.2" fill="none">
          {[
            [60, 430],
            [350, 86],
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

      {/* ── The owner, docked above the machine on a FACING PIN SEAM (U1 —
              the v19 mockup's device; the long arrowed wire is deleted).
              Authority faces the machine, pins never touching, and the
              DECIDES ALONE pair shares one baseline beside the seam. ──── */}
      <g className={inCls} style={at(T.owner)}>
        <text
          x="549"
          y="140"
          textAnchor="middle"
          fontSize={FS.chrome}
          letterSpacing=".22em"
          fill="var(--pda-ink)"
        >
          WHO OWNS IT
        </text>
        <Plate cx={549} cy={176} w={240} h={44} hot label={work.owner} />
        <g stroke={led ? "var(--pda-txt3)" : "var(--pda-hot)"} opacity="0.6">
          {[509, 529, 549, 569, 589].map((x) => (
            <line key={x} x1={x} y1={198} x2={x} y2={206} />
          ))}
        </g>
        <text x="585" y="222" fontSize={FS.chrome} letterSpacing=".22em" fill="var(--pda-txt3)">
          DECIDES ALONE
        </text>
        <text x="677" y="222" fontSize={FS.name} letterSpacing=".08em" fill="var(--pda-hot)">
          {work.autonomy}
        </text>
      </g>

      {/* ── The wiring — CENTRE-OUT, one bundle per part (U1). ──────────
              The junction blocks are deleted: the Skill and its lane still
              read as the interdependent pair by landing on ADJACENT pin
              bands and lighting together on hover. */}
      {/* What runs it. ⚠ The skill bundle lands on the 286 nib, not 305:
          at 305 the band's lower conductors clipped the lane chevron's
          top-right diagonal — a sub-unit graze no guard measures. */}
      <Ribbon
        pts={route(bend(320, 186, 401, 291, "v", 14))}
        n={4}
        pitch={3.5}
        stroke={led ? "var(--pda-txt3)" : "var(--pda-grn)"}
        opacity={0.6}
        dashed={led}
        draw={drawAt()}
      />
      <Ribbon
        pts={[
          [350, 327],
          [401, 327],
        ]}
        n={4}
        pitch={3.5}
        stroke={wire}
        dashed={led}
        draw={drawAt()}
      />

      {/* What it inherits. ⚠ THE RUNS TURN UP INTO THE PIN ROW and land ON a
          nib: the first cut ran them horizontally ALONG the nib tips, and
          five conductors crossing a pin row at 45° read as a hatch patch
          rather than as a connection. */}
      <Ribbon
        pts={route(bend(316, 504, 469, 496, "h", 14), [
          [469, 496],
          [469, CHIP_B],
        ])}
        n={5}
        pitch={3.5}
        stroke={wire}
        dashed={led}
        draw={drawAt()}
      />
      <Ribbon
        pts={route(bend(440, 556, 569, 530, "v", 14), [
          [569, 530],
          [569, CHIP_B],
        ])}
        n={5}
        pitch={3.5}
        stroke="var(--pda-txt3)"
        opacity={0.7}
        dashed
        draw={drawAt()}
      />

      {/* What it can reach: ONE output trunk through ONE gate, forking to
          the system and the surface past it — everything the stream reaches
          passes the bar. The doubled top-pin run is deleted (U1).
          ⚠ THE FORK IS FAR RIGHT (x 926), PAST THE BAR'S TEXT CHANNEL. The
          first cut rose at x 750 and the riser sliced straight through the
          bar and the seat — the exact conductor-through-text collision the
          fit guard cannot see, caught on the capture. Both risers stay
          right of x 930; the bar's channel is 700–930 and `BAR_MEASURE`
          is derived from it.
          ⚠ NOTHING LEAVES THE SYSTEM CHIP UPWARD (owner). */}
      <Ribbon
        pts={[
          [CHIP_R, 400],
          [926, 400],
        ]}
        n={8}
        pitch={3.5}
        stroke={wire}
        opacity={0.7}
        dashed={led}
        draw={drawAt()}
      />
      <Ribbon
        pts={[
          [926, 394],
          [932, 394],
          [936, 390],
          [936, 192],
        ]}
        n={4}
        pitch={3.5}
        stroke={wire}
        dashed={led}
        draw={drawAt()}
      />
      <Ribbon
        pts={[
          [926, 406],
          [936, 406],
          [940, 410],
          [940, 470],
        ]}
        n={4}
        pitch={3.5}
        stroke={wire}
        dashed={led}
        draw={drawAt()}
      />

      {/* The gate — an aperture the output physically passes through, with
          the bar WRAPPED ABOVE it at value size (U1: the one-line bar at fs 8
          was the type complaint in miniature) and the seat beneath. */}
      <g onMouseEnter={() => onLit("gat")} onMouseLeave={() => onLit(null)}>
        {[706, 728].map((x) => (
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
        {barLines.map((line, i) => (
          <text
            key={i}
            x="700"
            y={322 + i * 16}
            fontSize={FS.name}
            letterSpacing=".08em"
            fill={lit === "gat" ? "var(--pda-hot)" : "var(--pda-txt)"}
          >
            {line}
          </text>
        ))}
        <text x="700" y="354" fontSize={FS.chrome} letterSpacing=".08em" fill="var(--pda-txt2)">
          {gateSeat(work)}
        </text>
      </g>

      {/* The substrate trunks — one per shape this configuration draws on.
          ⚠ Every drop ≥ 549 since U1: the graph block owns x 360–536. */}
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

      {/* ── The six parts, staggered, each its own housing ────────────── */}
      <g className={inCls} style={at(T.pkg)}>
        <Part
          x={180}
          y={118}
          h={68}
          kind="notch"
          tag="SKILL"
          value={work.cfg.skill}
          part="runs"
          hot={lit === "runs"}
          led={led}
          green={!led}
          onLit={onLit}
        />
      </g>
      <g className={inCls} style={at(T.pkg + T.pkgStep)}>
        <Part
          x={158}
          y={301}
          h={52}
          kind="chevron"
          tag="LANE"
          value={work.cfg.laneRun}
          part="runs"
          hot={lit === "runs"}
          led={led}
          onLit={onLit}
        />
      </g>
      <g className={inCls} style={at(T.pkg + 2 * T.pkgStep)}>
        <Part
          x={140}
          y={474}
          h={68}
          kind="stack"
          tag="CONTEXT"
          value={work.cfg.context}
          part="inh"
          hot={lit === "inh"}
          led={led}
          onLit={onLit}
        />
      </g>
      <g className={inCls} style={at(T.pkg + 3 * T.pkgStep)}>
        <Part
          x={360}
          y={556}
          h={68}
          kind="dashed"
          tag="GRAPH"
          value={work.cfg.graph}
          part="inh"
          hot={lit === "inh"}
          onLit={onLit}
        />
      </g>
      <g className={inCls} style={at(T.pkg + 4 * T.pkgStep)}>
        <Part
          x={774}
          y={112}
          h={68}
          kind="port"
          tag="SYSTEM"
          value={work.cfg.system}
          part="rch"
          hot={lit === "rch"}
          led={led}
          onLit={onLit}
        />
      </g>
      <g className={inCls} style={at(T.pkg + 5 * T.pkgStep)}>
        <Part
          x={774}
          y={470}
          h={68}
          kind="aperture"
          tag="SURFACE"
          value={work.cfg.surface}
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
