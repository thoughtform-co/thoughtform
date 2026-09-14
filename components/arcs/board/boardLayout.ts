import {
  adv,
  type LetterSpec,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaLetters";
import {
  polylineLength,
  type Pt,
} from "@/components/landing/home-v2/services/casefile/map/pda/ribbon";
import { MODULE } from "@/components/landing/home-v2/services/casefile/map/pda/substrateKit";
import type { BoardMode, BoardState } from "@/lib/arcs/types";

/**
 * boardLayout — THE BOARD's arithmetic (ADR-100 U2). Pure: no React, no DOM.
 *
 * Two crops, one height, ONE record drawn twice. The dormant side is 560
 * wide, the lit one 800, with a 40-unit seam, so the row is 1400 × 548 units
 * and every share is a fraction of 1400 — which is what makes `meet` the
 * SAME on both at every viewport (`W / 1400`) and lands both drawings on
 * one top and one floor.
 *
 * ⚠ THE TWO DRAWINGS ARE DIFFERENT KINDS OF OBJECT, AND THAT IS THE POINT
 * (U2, owner: the left "should look less connected … a contrast like before
 * and after, but without implying they're unorganized"). LEFT is a ruled
 * LEDGER — five rows, a key and a value, hairlines and nothing else: the
 * facts written down, unconnected, and perfectly in order. RIGHT is the
 * BOARD — the same five assembled. U1 drew the left as the right's own
 * modules greyed out, which read as one picture at two brightnesses rather
 * than as a before.
 *
 * ⚠ THE BOARD IS A CROSS ON THE CHIP (U4). The seat drops onto it in green
 * from above and WHERE IT SCALES hangs off its floor in gold below, on runs
 * of the SAME length, with the context and the tools at its sides — so the
 * one lit object is the centre of the drawing by construction rather than by
 * placement. The fifth fact is what the beat is for (owner: the capability
 * "can be scaled and plugged into other parts of the business, because
 * that's the entire thing"), and it reads last on both sides.
 *
 * ⚠ BOTH SIDES SHARE THE TOP AND THE FLOOR — one inset (24) on all four
 * sides of both crops, the ledger's first row and the seat starting on it,
 * and the last rule landing on the node's floor (y 524). The head STRIPS and
 * the datum rule under them are deleted (U4, owner: "I don't think we need
 * the lines as it runs today with the configuration or the dividers"); the
 * head's own dek names the two sides.
 *
 * ⚠ THE TYPE IS SET AGAINST THE RENDERED SIZE, NOT 1:1. At the binding band
 * (1022px, 1280×720) `meet` is 0.73, so the chrome rung of 15.3 units paints
 * 11.2px — above the surface's 10px control floor. R4's RANKING is kept
 * (name > value > head > key > chrome).
 *
 * ⚠ AND THE BAND IS THE TEXT BAND SINCE U4, NOT THE INSTRUMENT BAND. The
 * drawing ran 120px wider per side than its own head at 1920×1247
 * (240—1680 against 360—1560) while every plate beat below sits flush with
 * its head — which is what the owner read as the head being "a bit more
 * centered versus the other sections". The cost is 13.1px at the chrome rung
 * there instead of 15.7; below the ~1503px band crossover the two bands
 * coincide and nothing moves.
 *
 * ⚠ FIT IS DECLARED, NOT REVIEWED. SVG `<text>` neither wraps nor reports
 * overflow, so `boardGeom` emits every lettered string WITH the measure it
 * must fit, and `tests/lib/arc-board-fit.test.ts` walks that list — mono via
 * `adv`, sans via a measured 0.55 em cell — plus the longest WORD, the type
 * floor, each letter inside its own object and the chain's closure. A
 * wrapped string past its cap is declared at measure 0 so a sliced tail
 * fails loudly (the `PdaConfiguration` idiom).
 *
 * ⚠ FIXED CROP, BY OWNER RULING ("radically simplify it", U1). The elastic
 * chain, the bed, the sockets and the foot rows are two commits back in git.
 */

export const VB = { h: 548, w: { today: 560, configured: 800 }, seam: 40, row: 1400 } as const;
/** The inset — R4's "the crop is the frame, not the stage", on all four
 *  sides since U4 deleted the head strips and the datum rule under them. */
export const INSET = 24;
/** Where both drawings START: the ledger's first row, and the seat. */
export const TOP_Y = INSET;
export const SEAT_H = 92;
/** The seat's cable — the run from the seat's floor to the chip. */
export const GAP1 = 52;
export const BAND_Y = TOP_Y + SEAT_H + GAP1;
export const MODULE_H = 216;
/** The chip's own cable DOWN, the same run as the seat's — which is what
 *  makes the board a cross centred on the one lit object (U4). */
export const GAP2 = GAP1;
export const NODE_Y = BAND_Y + MODULE_H + GAP2;
export const NODE_H = 88;
/** The floor both drawings end on: the node's, and the ledger's last rule. */
export const FLOOR_Y = NODE_Y + NODE_H;
/** A module's head band, ruled at its floor. */
export const HEAD_H = 40;
export const TAG_PITCH = 44;
/** The record's facts — the ledger's rows, and the board's objects. */
export const FACTS = 5;
/** The ledger's row pitch — five rows from the top inset to the floor. */
export const ROW_H = (FLOOR_Y - TOP_Y) / FACTS;
/** The ledger's value column, off the crop's own inset. */
export const LEDGER_VALUE_X = 224;
/** The corner cuts, by object: modules take R4's own, the chip the plate rung. */
export const CUT = { module: MODULE.cut, card: 20 } as const;
export const PAD = { module: MODULE.pad, card: 18, seat: 18 } as const;

/** The type ladder, in units. See the header for the px it renders. */
export const FS = { name: 24, value: 18, head: 16.6, key: 15.8, chrome: 15.3, sub: 15.3 } as const;
export const FS_FLOOR = 15.3;
export const TRACK = { name: 0.04, head: 0.14, key: 0.18, seat: 0.2, chrome: 0.2 } as const;
/** PP Neue Montreal's measured average advance, as a conservative cell. */
export const SANS_ADV = 0.55;
/** The sans baseline step — a PP Neue Montreal glyph box is ~1.2 em, so 26
 *  at 18 leaves 3.6 units clear between wrapped lines. */
export const STEP = 26;

/** The band widths the row renders into at the reference shapes — derived
 *  from landing.css's inset chain (hud margin + rail + the third term, or
 *  `--band-max` 1200 above the crossover). The smoke measures the live
 *  ones; this is what the fit test pins the floor against.
 *  ⚠ THE TEXT BAND SINCE U4, never the instrument band's 1440. */
export const BAND_PX = {
  "1280x720": 1022,
  "1440x800": 1151,
  "1920x1080": 1200,
  "1920x1247": 1200,
} as const;
export const boardFloorPx = (bandPx: number) => (FS_FLOOR * bandPx) / VB.row;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export type Face = "mono" | "sans";
export type Ink = "ink" | "ink2" | "ink3" | "gold-ink" | "green-ink";
export type Role = "seat" | "layer" | "card" | "tools" | "reach";

export interface BoardLetter extends LetterSpec {
  role: Role;
  face: Face;
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
  ink: Ink;
  /** The lit seat's answer alone takes `--weight-lit`, the ceiling. */
  lit?: boolean;
}
/**
 * How an object is painted. `row` is the LEDGER's — a hairline at its top and
 * nothing else, so the dormant side owns no plate, no outline and no cut.
 */
export type ModulePaint = "module" | "row" | "card-lit" | "seat-lit";
export interface BoardModule {
  id: string;
  role: Role;
  rect: Rect;
  cut: number;
  /** Which corners the cut takes. Absent ⇒ ADR-065's canonical TR + BL
   *  pair, a machined housing. `"tr"` ⇒ the TOP-RIGHT alone, and only on
   *  the chip: it is the one object the ribbons meet (a single notch MEANS
   *  oriented or connected) and the one that becomes the offer's phase
   *  plates, which carry that same corner (ADR-098 U5). */
  notch?: "tr";
  paint: ModulePaint;
  /** A head band of this height, ruled at its floor. */
  head?: number;
  /** Which edge a `row` rules. The head's datum opens the ledger, so every
   *  row rules its own BOTTOM and the last closes on the board's floor. */
  rule?: "bottom";
}
export interface BoardLane {
  id: "seat" | "layer" | "tools" | "reach";
  pts: readonly Pt[];
  wires: number;
  paint: "gold" | "green";
  /** `polylineLength` of the base path — the draw-on's `--l`. */
  len: number;
}
export interface BoardGeom {
  mode: BoardMode;
  vb: { w: number; h: number };
  modules: BoardModule[];
  letters: BoardLetter[];
  lanes: BoardLane[];
}

/** Greedy wrap to a character measure, every line kept. */
export function wrapAll(text: string, per: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > per && line) {
      out.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) out.push(line);
  return out;
}

const up = (s: string) => s.toUpperCase();
const monoW = (text: string, fs: number, track: number) => text.length * adv(fs, track);

function mono(
  role: Role,
  slot: string,
  text: string,
  fs: number,
  track: number,
  measure: number,
  x: number,
  y: number,
  ink: Ink,
  anchor: BoardLetter["anchor"] = "start"
): BoardLetter {
  return { role, slot, text: up(text), fs, track, measure, face: "mono", x, y, anchor, ink };
}

/**
 * A sans string wrapped to its measure: one letter per line, the lines past
 * `max` declared at measure 0 so the guard fails on a tail the drawing would
 * otherwise slice in silence.
 */
function sans(
  role: Role,
  slot: string,
  text: string,
  fs: number,
  measure: number,
  x: number,
  y0: number,
  ink: Ink,
  max = 2,
  lit?: boolean
): BoardLetter[] {
  const per = Math.floor(measure / (SANS_ADV * fs));
  return wrapAll(text, per).map((line, i) => ({
    role,
    slot: `${slot}.${i}`,
    text: line,
    fs,
    track: 0,
    measure: i < max ? measure : 0,
    face: "sans",
    x,
    y: y0 + i * STEP,
    anchor: "start",
    ink,
    lit,
  }));
}

function lane(id: BoardLane["id"], pts: readonly Pt[], paint: BoardLane["paint"]): BoardLane {
  return { id, pts, wires: 8, paint, len: polylineLength(pts) };
}

/** The five facts, in the order both drawings read them. */
const facts = (s: BoardState) =>
  [
    { role: "seat" as const, key: s.seat.q, value: s.seat.a },
    { role: "layer" as const, key: s.layer.label, value: s.layer.sub ?? "" },
    { role: "card" as const, key: s.card.name, value: s.card.work },
    {
      role: "tools" as const,
      key: s.tools.label,
      value: s.tools.items.map((t) => t.name).join(", "),
    },
    { role: "reach" as const, key: s.reach.label, value: s.reach.value },
  ] as const;

/**
 * THE LEDGER — the dormant side. Five ruled rows off the crop's own inset:
 * a mono key, a sans value, and a hairline under each, the last closing on
 * the board's own floor. No plate, no outline, no cut, no colour: nothing
 * here is built yet, and an inventory is the one drawing that says so
 * without saying "disorganised".
 */
function todayGeom(s: BoardState<"today">): BoardGeom {
  const W = VB.w.today;
  const x0 = INSET;
  const w = W - 2 * INSET;
  const letters: BoardLetter[] = [];
  const modules: BoardModule[] = [];
  const keyM = LEDGER_VALUE_X - x0 - 10;
  const valM = W - INSET - LEDGER_VALUE_X;

  facts(s).forEach((f, i) => {
    const y = TOP_Y + i * ROW_H;
    modules.push({
      id: f.role,
      role: f.role,
      rect: { x: x0, y, w, h: ROW_H },
      cut: 0,
      paint: "row",
      /* ⚠ EVERY ROW RULES ITS BOTTOM, and the ledger opens UNRULED. With the
         datum gone (U4) the first row has nothing above it to double
         against, and a rule at the crop's own top would be a line with no
         object over it. The last row's closes on the board's own floor,
         which is the one horizontal the two drawings share. */
      rule: "bottom",
    });
    letters.push(mono(f.role, `${f.role}.key`, f.key, FS.key, TRACK.key, keyM, x0, y + 56, "ink2"));
    if (f.value) {
      letters.push(
        ...sans(
          f.role,
          `${f.role}.value`,
          f.value,
          FS.value,
          valM,
          LEDGER_VALUE_X,
          y + 56,
          "ink",
          1
        )
      );
    }
  });

  return {
    mode: "today",
    vb: { w: W, h: VB.h },
    modules,
    letters,
    lanes: [],
  };
}

/**
 * THE BOARD — the lit side, a CROSS on the chip. The seat drops onto it in
 * green from above and WHERE IT SCALES hangs off its floor in gold below on
 * a run of the same length; the context is at its left, the tools at its
 * right. Four eight-wire ribbons, all meeting the one lit object.
 */
function configuredGeom(s: BoardState<"configured">): BoardGeom {
  const W = VB.w.configured;
  // 24 | context 220 | 40 | chip 264 | 40 | tools 188 | 24 = 800 — one chain.
  const layer: Rect = { x: INSET, y: BAND_Y, w: 220, h: MODULE_H };
  const card: Rect = { x: layer.x + layer.w + 40, y: BAND_Y + 56, w: 264, h: 104 };
  const tools: Rect = { x: layer.x + layer.w + 40 + 264 + 40, y: BAND_Y, w: 188, h: MODULE_H };
  const cx = card.x + card.w / 2;
  const cy = card.y + card.h / 2;
  const seat: Rect = { x: cx - 172, y: TOP_Y, w: 344, h: SEAT_H };
  /* The node takes the SEAT's own box, mirrored below the chip: the two
     objects the cross answers to are the same width, on the same centre. */
  const node: Rect = { x: seat.x, y: NODE_Y, w: seat.w, h: NODE_H };
  const letters: BoardLetter[] = [];
  const modules: BoardModule[] = [
    { id: "seat", role: "seat", rect: seat, cut: CUT.module, paint: "seat-lit" },
  ];

  // The seat — green is the human and nothing else. ONE sentence under it.
  const sx = seat.x + PAD.seat;
  const sm = seat.w - 2 * PAD.seat;
  letters.push(mono("seat", "seat.q", s.seat.q, FS.key, TRACK.seat, sm, sx, seat.y + 24, "ink2"));
  letters.push(
    ...sans("seat", "seat.a", s.seat.a, FS.value, sm, sx, seat.y + 50, "green-ink", 2, true)
  );

  // The context they own — its label over four tags.
  modules.push({
    id: "layer",
    role: "layer",
    rect: layer,
    cut: CUT.module,
    paint: "module",
    head: HEAD_H,
  });
  const lx = layer.x + PAD.module;
  const lm = layer.w - 2 * PAD.module;
  letters.push(
    mono("layer", "layer.label", s.layer.label, FS.head, TRACK.head, lm, lx, layer.y + 26, "ink")
  );
  s.layer.rows.forEach((row, i) => {
    letters.push(
      mono(
        "layer",
        `layer.${row.id}`,
        row.tag,
        FS.key,
        TRACK.key,
        lm,
        lx,
        layer.y + HEAD_H + 28 + i * TAG_PITCH,
        "gold-ink"
      )
    );
  });

  /* The chip — the one lit object, and the one thing every ribbon meets.
     ⚠ TOP-RIGHT ONLY (U4, owner: "the AI capability card has a notch in the
     bottom-left corner. We don't need that because the cards in the
     subsequent section don't have it either"). Lawful as a single notch
     because a single notch MEANS oriented-or-connected (ADR-065 rule 5) and
     this is the object four ribbons meet — and because it is the one that
     becomes the offer's phase plates, which carry that same corner and
     nothing else (ADR-098 U5). Every housing around it keeps the pair. */
  modules.push({
    id: "card",
    role: "card",
    rect: card,
    cut: CUT.card,
    notch: "tr",
    paint: "card-lit",
  });
  const kx = card.x + PAD.card;
  const km = card.w - 2 * PAD.card;
  letters.push(
    mono("card", "card.name", s.card.name, FS.name, TRACK.name, km, kx, card.y + 44, "ink")
  );
  /* ⚠ THE CHIP'S SECOND LINE IS LIT (500), like the seat's answer. It is
     what the plates' NAME is set in one beat later, and PP Neue Montreal is
     a static family — a weight that has to change mid-flight snaps. */
  letters.push(
    ...sans("card", "card.work", s.card.work, FS.value, km, kx, card.y + 70, "ink", 1, true)
  );

  // Where it runs — four peers at the context's own pitch.
  modules.push({
    id: "tools",
    role: "tools",
    rect: tools,
    cut: CUT.module,
    paint: "module",
    head: HEAD_H,
  });
  const tx = tools.x + PAD.module;
  const tm = tools.w - 2 * PAD.module;
  letters.push(
    mono("tools", "tools.label", s.tools.label, FS.head, TRACK.head, tm, tx, tools.y + 26, "ink")
  );
  s.tools.items.forEach((item, i) => {
    letters.push(
      mono(
        "tools",
        `tools.${item.id}`,
        item.name,
        FS.key,
        TRACK.key,
        tm,
        tx,
        tools.y + HEAD_H + 28 + i * TAG_PITCH,
        "gold-ink"
      )
    );
  });

  /* WHERE IT SCALES — the fifth fact, and the beat's whole point (U4). A
     module the seat's own width under the chip, on the gold run out of its
     floor: what the capability reaches once it exists. */
  modules.push({
    id: "reach",
    role: "reach",
    rect: node,
    cut: CUT.module,
    paint: "module",
    head: HEAD_H,
  });
  const nx = node.x + PAD.module;
  const nm = node.w - 2 * PAD.module;
  letters.push(
    mono("reach", "reach.label", s.reach.label, FS.head, TRACK.head, nm, nx, node.y + 26, "ink")
  );
  letters.push(
    ...sans("reach", "reach.value", s.reach.value, FS.value, nm, nx, node.y + HEAD_H + 28, "ink", 1)
  );

  // Four ribbons: the seat's authority drop in green from above, the gold run
  // OUT of the chip's floor below, and the gold runs to the context and the
  // tools. They run wall to wall; the modules paint over their entries, R4's
  // own order.
  const lanes: BoardLane[] = [
    lane(
      "seat",
      [
        [cx, seat.y + seat.h],
        [cx, card.y],
      ],
      "green"
    ),
    lane(
      "layer",
      [
        [card.x, cy],
        [layer.x + layer.w, cy],
      ],
      "gold"
    ),
    lane(
      "tools",
      [
        [card.x + card.w, cy],
        [tools.x, cy],
      ],
      "gold"
    ),
    lane(
      "reach",
      [
        [cx, card.y + card.h],
        [cx, node.y],
      ],
      "gold"
    ),
  ];

  return {
    mode: "configured",
    vb: { w: W, h: VB.h },
    modules,
    letters,
    lanes,
  };
}

/** One side's whole drawing, for one state. */
export function boardGeom(state: BoardState): BoardGeom {
  return state.mode === "today"
    ? todayGeom(state as BoardState<"today">)
    : configuredGeom(state as BoardState<"configured">);
}

/** The lettering a fit guard walks — every `<text>` the drawing draws. */
export const boardLettering = (state: BoardState): BoardLetter[] => boardGeom(state).letters;

/** A letter's width under the surface's advance model. */
export const letterWidth = (l: BoardLetter) =>
  l.face === "mono" ? monoW(l.text, l.fs, l.track) : l.text.length * SANS_ADV * l.fs;
