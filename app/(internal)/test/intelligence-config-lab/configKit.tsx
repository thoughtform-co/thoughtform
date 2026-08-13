"use client";

import { wrapLines } from "@/components/landing/home-v2/services/casefile/map/pda/pdaGlyphs";
import type { PdaWork } from "@/components/landing/home-v2/services/casefile/map/pda/pdaRecord";
import {
  type Pt,
  ribbonPaths,
} from "@/components/landing/home-v2/services/casefile/map/pda/ribbon";

import { adv, type LetterSpec } from "./variants";

/**
 * THE REFINEMENT KIT — what the seven quality-of-life variants share.
 *
 * All seven answer ONE brief (owner, 2026-08-11): the board reads cramped,
 * the panels can be smaller, the type must be bigger, and WHO OWNS IT should
 * belong to the centerpiece. They differ in INFORMATION ARCHITECTURE, not in
 * content — so the content lives here, once, and a variant is a LAYOUT.
 *
 * ⚠ THE COMPLAINT IS ARITHMETIC, AND THIS IS THE ARITHMETIC. The shipped
 * sub-card is `SUB_H = 158` units holding an ink band of **51** — a key
 * baseline at +26 and one value line at +62. That is **68 % dead space**, six
 * times over: ~640 of the crop's 912 vertical units spent on nothing while
 * the value letters at 11.5, near its floor. "Cramped" is small type floating
 * in oversized boxes, not too much content.
 *
 * ⚠ AND THE LADDER IS INVERTED. The shipped question header letters at 14,
 * LARGER than the answer at 11.5 — against ADR-069's own words, "the question
 * is chrome, the answer is the record". Every variant here demotes the
 * question and promotes the answer; that single swap is most of the fix.
 *
 * The reference agrees: CP2077's item tooltip runs a ~3× label:value ratio
 * (`950` beside a tiny `ARMOR`), and its target-scan panel pairs small dim
 * keys with large bright values. Hierarchy comes from SIZE CONTRAST INSIDE A
 * TIGHT PANEL, never from panel size.
 */

/* ── The type ladder ────────────────────────────────────────────────────
   One scale, applied at different strengths per variant, in AUTHORING UNITS
   — multiply by the preset's meet (0.540 at p1280, 0.833 at p1920) for
   rendered pixels. */
/**
 * ⚠ **NOTHING LETTERS UNDER 12 (owner, 2026-08-11), AND 10 IS THE THING THAT
 * WAS WRONG.** The first round put the keys at 10 on the CP2077 tooltip's
 * ~3× label:value ratio. That ratio is real, but it was read off a panel
 * rendered at 1:1 — here 10 authoring units is **5.4px** at the binding
 * preset and **8.3px** at 1920, under the 8.5px chrome floor ADR-063 already
 * records as this surface's standing defect. The owner's verdict on the keys
 * — SKILL, MODEL, AGENT, KNOWLEDGE GRAPH — was "utterly illegible", and it
 * is arithmetic, not taste.
 *
 * So the contrast is bought the other way round: the ANSWER comes down and
 * the KEY comes up, until the ratio fits between a floor of 12 and whatever
 * the measure affords. A label nobody can read is not a quiet label, it is
 * an absent one — the same finding ADR-070 U6 made about the seat's dashed
 * line, one type rung down.
 */
export const FS = {
  /** The question — chrome, but it still has to be read. */
  q: 13,
  /** A cell's key — Tensor gold, and one step up from the question it
   *  sits under (owner, 2026-08-11: "the things we've changed to Tensor
   *  Gold, we can make it a bit bigger"). */
  key: 14,
  /** The answer, where the measure is narrow (a two-line cell). */
  v: 15,
  /** The answer, where the measure is wide enough for one line. */
  vWide: 18,
  /** The answer at its largest — a full-width row with nothing beside it. */
  vHero: 22,
  /** The seat. */
  owner: 16,
  /** The seat, fused to a card and sharing its measure. */
  ownerTight: 14,
  autonomy: 13,
  bar: 12,
} as const;

/** The floor the owner set. Asserted by `config-lab-fit`, not just intended. */
export const FS_FLOOR = 12;

export const TRACK = { key: 0.22, q: 0.14, v: 0.08 } as const;

/** Characters that fit a measure at a size — never hard-code this; it stops
 *  matching the type the moment a size moves (`wrapLines` takes a CHARACTER
 *  count, not a width). */
export const charsFor = (measure: number, fs: number, track: number = TRACK.v) =>
  Math.max(1, Math.floor(measure / adv(fs, track)));

/** A line box is ~1.3 em, and EVERY vertical clearance is measured against
 *  it rather than the font size (pdaGlyphs' `MONO_LINE_BOX`). */
export const lineBox = (fs: number) => fs * 1.3;

/**
 * ⚠ THE BASELINE STEP IS NOT THE LINE BOX, AND THE CAPTURE GATE PROVED IT.
 *
 * `lineBox` (1.3 em) is what a line OCCUPIES; stepping consecutive baselines
 * by it makes their glyph boxes abut, and `getBBox` reports a box taller than
 * 1.3 em — so the overlap walk flagged real collisions between the two
 * wrapped lines of one value (`PRODUCT + CLAIM` × `FACTS`) and of THE BAR
 * (`ON-BRAND / CLAIM-SAFE /` × `CHANNEL-READY`) with nothing wrong on screen
 * except that they touched.
 *
 * 1.7 is the house number, and it is not invented here: the shipped drawing
 * steps its values 20 at fs 11.5 (1.74×) and its bar 17 at fs 10 (1.70×).
 * Clearance math keeps `lineBox`; anything that stacks baselines uses this.
 */
export const step = (fs: number) => fs * 1.7;

/* ── The content, once ─────────────────────────────────────────────────── */

export type CellKind = "plain" | "enc" | "gph";

export interface CellDef {
  key: string;
  value: string;
  kind: CellKind;
}

export interface GroupDef {
  /** The question. */
  q: string;
  /** The hover/part key, kept identical to the shipped drawing's. */
  part: "runs" | "rch" | "whr";
  cells: readonly [CellDef, CellDef];
}

/**
 * The three questions and their six answers — the ADR-070 U9 slotting.
 *
 * ⚠ ONE SOURCE FOR ALL SEVEN. A variant that re-types these has stopped being
 * a layout study and started being a content fork; the whole point of the
 * comparison is that only the arrangement differs.
 */
export const groupsOf = (w: PdaWork): readonly GroupDef[] => {
  const c = w.cfg;
  return [
    {
      q: "WHAT RUNS IT",
      part: "runs",
      cells: [
        { key: "SKILL", value: c.skill, kind: "enc" },
        /* ⚠ THE VERBS, NOT THE LANE (owner, 2026-08-11: "model — everyday
           lane? What does everyday lane mean?"). The lane is a GENERIC
           capability tier by law — the map's envelope forbids naming a model
           family and `cases-registry` fails on one — so it cannot be made
           concrete by naming the model. `m[1]` is the concrete thing the
           record already holds. The tier survives in `laneRun` and in the
           hover note; if it should letter here too, it is one line. */
        { key: "MODEL", value: c.laneVerbs, kind: "plain" },
      ],
    },
    {
      q: "WHAT IT CAN REACH",
      part: "rch",
      cells: [
        { key: "KNOWLEDGE GRAPH", value: c.graph, kind: "gph" },
        { key: "CONNECTORS", value: c.system, kind: "plain" },
      ],
    },
    {
      q: "WHERE IT RUNS",
      part: "whr",
      cells: [
        { key: "AGENT", value: c.agent, kind: "plain" },
        { key: "INTERFACE", value: c.surface, kind: "plain" },
      ],
    },
  ];
};

/* ── Colour, by role and material ──────────────────────────────────────── */

/**
 * ⚠ **ONE INK FOR EVERY ANSWER (owner, 2026-08-11).** The first round tinted
 * the Skill green and the graph blue, carrying ADR-062's material grammar
 * (hatched green = Loop's own, blue-grey = the adjacent domain) down onto the
 * type. The owner's read: _"I don't know why brand voice skill is green while
 * the rest isn't"_ — and he is right that it does not survive the move. On
 * the CITY that grammar had a legend's worth of context and applied to
 * SHAPES; here it lands on six words in a row with nothing to decode it, so
 * it reads as emphasis rather than provenance. Colour now carries exactly one
 * distinction on this drawing: gold for the question, ink for the answer.
 *
 * Person-led still collapses to the quiet ink — that is state, not material.
 */
export const valueInk = (_kind: CellKind, led: boolean) =>
  led ? "var(--pda-txt3)" : "var(--pda-txt)";

/** ⚠ AND ONE GROUND. Same ruling: a green wash under one card and a blue one
 *  under another is the same claim made in a second channel. */
export const cellGround = (_kind: CellKind) => "rgba(var(--dawn-rgb), 0.03)";

/* ── Lettering ─────────────────────────────────────────────────────────── */

/**
 * The wrapped lines a value takes, and the ONE past the cap.
 *
 * ⚠ `wrapLines` SLICES at its cap — a third line is discarded with nothing on
 * screen to say so. The house counter-measure is to DECLARE the line past the
 * cap with a ZERO measure, so a sliced tail fails the fit guard loudly
 * instead of vanishing. The renderer draws `cap`; the spec declares `cap + 1`.
 */
export function valueSpecs(
  slot: string,
  value: string,
  fs: number,
  measure: number,
  cap: number
): LetterSpec[] {
  const chars = charsFor(measure, fs);
  return wrapLines(value, chars, cap + 1).map((line, i) => ({
    slot: `${slot}.L${i}`,
    text: line,
    fs,
    track: TRACK.v,
    measure: i < cap ? measure : 0,
  }));
}

/** Draw exactly what `valueSpecs` declared, minus the overflow line. */
export const valueLines = (value: string, fs: number, measure: number, cap: number) =>
  wrapLines(value, charsFor(measure, fs), cap);

export interface CellType {
  keyFs: number;
  valueFs: number;
  /** Measure shared by key and value. */
  measure: number;
  /** Lines the value may take. */
  cap: number;
}

export function cellSpecs(slot: string, cell: CellDef, t: CellType): LetterSpec[] {
  return [
    { slot: `${slot}.k`, text: cell.key, fs: t.keyFs, track: TRACK.key, measure: t.measure },
    ...valueSpecs(`${slot}.v`, cell.value, t.valueFs, t.measure, t.cap),
  ];
}

/** Question + both cells. `qMeasure` is the room the header alone has. */
export function groupSpecs(
  slot: string,
  g: GroupDef,
  qFs: number,
  qMeasure: number,
  t: CellType
): LetterSpec[] {
  return [
    { slot: `${slot}.q`, text: g.q, fs: qFs, track: TRACK.q, measure: qMeasure },
    ...cellSpecs(`${slot}.${g.cells[0].key}`, g.cells[0], t),
    ...cellSpecs(`${slot}.${g.cells[1].key}`, g.cells[1], t),
  ];
}

/**
 * The seat, its autonomy, and what the seat owns.
 *
 * ⚠ `ownerNote` IS `p[1]` and it is optional — person-led has no configured
 * seat to gloss, and its owner line already states the absence in full
 * (ADR-070 U7, the half that went unlettered on four consecutive drawings).
 */
export function ownerSpecs(
  slot: string,
  w: PdaWork,
  opts: { ownerFs: number; measure: number; autoMeasure: number; noteMeasure?: number }
): LetterSpec[] {
  const out: LetterSpec[] = [
    { slot: `${slot}.k`, text: "WHO OWNS IT", fs: FS.key, track: TRACK.key, measure: opts.measure },
    {
      slot: `${slot}.owner`,
      text: w.owner,
      fs: opts.ownerFs,
      track: TRACK.v,
      measure: opts.measure,
    },
    {
      slot: `${slot}.decides`,
      text: "DECIDES ALONE",
      fs: FS.key,
      track: TRACK.key,
      measure: opts.autoMeasure,
    },
    {
      slot: `${slot}.autonomy`,
      text: w.autonomy,
      fs: FS.autonomy,
      track: TRACK.v,
      measure: opts.autoMeasure,
    },
  ];
  if (w.ownerNote && opts.noteMeasure) {
    out.push({
      slot: `${slot}.note`,
      text: w.ownerNote,
      fs: FS.key,
      track: TRACK.v,
      measure: opts.noteMeasure,
    });
  }
  return out;
}

/** THE BAR, drawn by the variant rather than passed to `Cartridge`.
 *  ⚠ THE REASON THIS EXISTS IS GONE (2026-08-13): `Cartridge`'s `bar` prop
 *  hardcoded `fontSize="10"` UNSCALED, so `k` never reached it and a variant
 *  that wanted a legible bar had to draw its own. The prop scales now. */
export function barSpecs(slot: string, bar: string, fs: number, measure: number): LetterSpec[] {
  return [
    { slot: `${slot}.k`, text: "THE BAR", fs: FS.key, track: TRACK.key, measure },
    ...valueSpecs(slot, bar, fs, measure, 2),
  ];
}

/* ── Drawing primitives ────────────────────────────────────────────────── */

/**
 * A multi-conductor bundle — the connection grammar the owner asked to keep
 * ("I definitely like the cable connecting to the centerpiece").
 *
 * ⚠ `Ribbon` is MODULE-PRIVATE to `PdaConfiguration.tsx`, so this is the ~30
 * lines every variant would otherwise re-write. No draw-on class here: the
 * lab's variants are static (they receive no `still`/`entry`), and the
 * capture script disables animations, so a dasharray would only make stills
 * non-deterministic.
 */
export function Wire({
  pts,
  n = 6,
  pitch = 4,
  stroke,
  opacity = 0.62,
  dashed,
}: {
  pts: readonly Pt[];
  n?: number;
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

/** The key + value block, unboxed — the row form. Hairline optional. */
export function Field({
  x,
  y,
  cell,
  t,
  led,
  rule,
  align = "start",
}: {
  x: number;
  y: number;
  cell: CellDef;
  t: CellType;
  led: boolean;
  /** Width of a hairline above the field; omit for none. */
  rule?: number;
  align?: "start" | "end";
}) {
  const anchor = align === "end" ? "end" : undefined;
  return (
    <g>
      {rule ? (
        <line
          x1={align === "end" ? x - rule : x}
          y1={y}
          x2={align === "end" ? x : x + rule}
          y2={y}
          stroke="var(--pda-hair2)"
        />
      ) : null}
      {/* ⚠ THE KEY IS TENSOR GOLD (owner, 2026-08-11) — `--pda-ink`, which is
          `--gold-ink`, the 4.5:1 rung of ADR-063 U2's ramp. NEVER `--gold`
          itself: that is the MARK rung and measures ~1.1:1 as small text on
          the light theme's parchment. `--pda-ink` was declared in pda.css and
          consumed by nothing until now; this is the slot it existed for. */}
      <text
        x={x}
        y={y + 20}
        textAnchor={anchor}
        fontSize={t.keyFs}
        letterSpacing=".22em"
        fill="var(--pda-ink)"
      >
        {cell.key}
      </text>
      {valueLines(cell.value, t.valueFs, t.measure, t.cap).map((line, i) => (
        <text
          key={i}
          x={x}
          y={y + 20 + lineBox(t.keyFs) + step(t.valueFs) * (i + 0.72)}
          textAnchor={anchor}
          fontSize={t.valueFs}
          letterSpacing=".08em"
          fill={valueInk(cell.kind, led)}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

/** The boxed form: a ground, its material, and the field inside it. */
export function Cell({
  x,
  y,
  w,
  h,
  cell,
  t,
  led,
  pad = 12,
  padY = 2,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  cell: CellDef;
  t: CellType;
  led: boolean;
  pad?: number;
  /** Top inset for the field. Breathing room is height, and height is the
   *  one thing a content-sized cell has spare. */
  padY?: number;
}) {
  /* ⚠ THE HATCH BAND AND THE DASHED INSET ARE DELETED (owner, 2026-08-11:
     "those diagonal ticks, I do not want them. I want a clean separation
     between skill and model"). They were ADR-062's material grammar — the
     encoded green and the adjacent-domain blue — and they do not survive
     being applied to a pair of stacked cards: at this size the ticks read as
     a texture bug rather than as provenance. The separation they were doing
     badly is now done properly, by the divider rule the node draws between
     its two cells. */
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={cellGround(cell.kind)} stroke="none" />
      <Field x={x + pad} y={y + padY} cell={cell} t={t} led={led} />
    </g>
  );
}

/** The seat. `fused` drops the housing's own top chamfer so it can weld to
 *  whatever sits under it. */
export function OwnerPlate({
  x,
  y,
  w,
  h,
  work,
  ownerFs,
  led,
  note = true,
  padY = 0,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  work: PdaWork;
  ownerFs: number;
  led: boolean;
  note?: boolean;
  /** Pushes every line down inside the plate — the seat was sitting against
   *  its own ceiling (owner, 2026-08-11). */
  padY?: number;
}) {
  return (
    <g>
      <path
        d={`M${x + 14},${y} H${x + w} V${y + h} H${x} V${y + 14} Z`}
        fill={led ? "rgba(255, 255, 255, 0.02)" : "rgba(126, 159, 102, 0.09)"}
        stroke={led ? "var(--pda-txt3)" : "var(--pda-grn)"}
        strokeDasharray={led ? "5 4" : undefined}
      />
      <text
        x={x + 20}
        y={y + 30 + padY}
        fontSize={FS.key}
        letterSpacing=".22em"
        fill="var(--pda-txt2)"
      >
        WHO OWNS IT
      </text>
      <text
        x={x + 20}
        y={y + 34 + padY + lineBox(ownerFs)}
        fontSize={ownerFs}
        letterSpacing=".08em"
        fill={led ? "var(--pda-txt3)" : "var(--pda-grn)"}
      >
        {work.owner}
      </text>
      {note && work.ownerNote ? (
        <text
          x={x + 20}
          y={y + 40 + padY + lineBox(ownerFs) + lineBox(FS.key)}
          fontSize={FS.key}
          letterSpacing=".08em"
          fill="var(--pda-txt2)"
        >
          {work.ownerNote}
        </text>
      ) : null}
      <text
        x={x + w - 20}
        y={y + 30 + padY}
        textAnchor="end"
        fontSize={FS.key}
        letterSpacing=".22em"
        fill="var(--pda-txt3)"
      >
        DECIDES ALONE
      </text>
      <text
        x={x + w - 20}
        y={y + 34 + padY + lineBox(ownerFs)}
        textAnchor="end"
        fontSize={FS.autonomy}
        letterSpacing=".08em"
        fill="var(--pda-hot)"
      >
        {work.autonomy}
      </text>
    </g>
  );
}

/** THE BAR as its own block, at a size `Cartridge` could not give it until
 *  2026-08-13 — kept because the losing archetypes are a RECORD of what was
 *  measured, and rewiring them onto the fixed prop would restate their numbers. */
export function BarBlock({
  x,
  y,
  measure,
  bar,
  fs,
  led,
}: {
  x: number;
  y: number;
  measure: number;
  bar: string;
  fs: number;
  led: boolean;
}) {
  return (
    <g>
      <text x={x} y={y} fontSize={FS.key} letterSpacing=".22em" fill="var(--pda-txt3)">
        THE BAR
      </text>
      {valueLines(bar, fs, measure, 2).map((line, i) => (
        <text
          key={i}
          x={x}
          y={y + lineBox(FS.key) + step(fs) * (i + 0.72)}
          fontSize={fs}
          letterSpacing=".08em"
          fill={led ? "var(--pda-txt3)" : "var(--pda-txt)"}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

/** A question header with the hairline that carries it. */
export function QLabel({
  x,
  y,
  text,
  rule,
  align = "start",
}: {
  x: number;
  y: number;
  text: string;
  rule?: number;
  align?: "start" | "end";
}) {
  return (
    <g>
      <text
        x={x}
        y={y}
        textAnchor={align === "end" ? "end" : undefined}
        fontSize={FS.q}
        fontWeight={700}
        letterSpacing=".14em"
        fill="var(--pda-txt)"
      >
        {text}
      </text>
      {rule ? (
        <line x1={x} y1={y + 10} x2={x + rule} y2={y + 10} stroke="var(--pda-hair2)" />
      ) : null}
    </g>
  );
}

/** The board's own bounds inside the production crop `36 48 828 912`, inset
 *  24 the way ADR-070 U6 insets it. */
export const BOARD = { x0: 60, x1: 840, y0: 72, y1: 945, mid: 450 } as const;
