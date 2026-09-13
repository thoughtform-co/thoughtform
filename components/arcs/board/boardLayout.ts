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
 * boardLayout — THE BOARD's arithmetic (ADR-100). Pure: no React, no DOM.
 *
 * Two crops, one height. The dormant board is 620 wide, the lit one 900,
 * with a 40-unit seam between them, so the row is 1560 × 630 units and
 * every share is a fraction of 1560 — which is what makes `meet` the SAME on
 * both boards at every viewport (`W / 1560`) and puts both head strips and
 * both foot rows on one datum. The vertical chain is shared too: the same
 * seat, the same band, the same cell pitch, so the eye maps cell to cell.
 *
 * ⚠ THE CROP IS HEIGHT-ELASTIC (ADR-070 U12, the lesson this drawing's
 * family paid for three updates running). `chain(e)` takes an extension in
 * authoring units and spends it the way R4 does — the cable, the cells and
 * the drops grow, the margin is the remainder split — so a tall window gets
 * a taller board rather than a hole under it. Every function here takes `e`;
 * `EXT_MAX` is the honest clamp past which the row letterboxes on purpose.
 *
 * ⚠ THE TYPE IS SET AGAINST THE RENDERED SIZE, NOT 1:1. At the binding band
 * (1022px, 1280×720) `meet` is 0.655, so the chrome rung of 15.3 units paints
 * 10.02px — the surface's control floor. R4's RANKING is kept (name > value >
 * head > key > chrome) and its rungs lifted ~1.27×; the range that lost is
 * bought back in ink alpha, which does not shrink with `meet`.
 *
 * ⚠ FIT IS DECLARED, NOT REVIEWED. SVG `<text>` neither wraps nor reports
 * overflow, so `boardGeom` emits every lettered string WITH the measure it
 * must fit, and `tests/lib/arc-board-fit.test.ts` walks that list — mono via
 * `adv`, sans via a measured 0.55 em cell — plus the longest WORD, the type
 * floor, the rule-stops-at-the-cut law and the chain's closure. A wrapped
 * string past its cap is declared at measure 0 so a sliced tail fails loudly
 * (the `PdaConfiguration` idiom).
 */

export const VB = { h: 630, w: { today: 620, configured: 900 }, seam: 40, row: 1560 } as const;
/** Past this the row letterboxes on purpose (2560×1440 would want ~477). */
export const EXT_MAX = 320;
/** The side inset — R4's "the crop is the frame, not the stage". */
export const INSET = 24;
export const DATUM_Y = 26;
export const SEAT_H = 88;
export const CELL_H0 = 89;
export const CELL_H_MAX = 130;
export const ITEM_H0 = 64;
export const HEAD_H = { layer: 62, tools: 40 } as const;
/** The corner cuts, by object: modules take R4's own, the card the plate rung. */
export const CUT = { module: MODULE.cut, card: 20, socket: 8, island: 6 } as const;
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
/** The kickers' minimum air, and the diamond's room before each. */
export const FOOT_GAP = 40;
export const FOOT_MARK = 14;

/** The band widths the row renders into at the reference shapes — derived
 *  from landing.css's inset chain (hud margin + rail + the third term, or
 *  the 1440 instrument cap). The smoke measures the live ones; this is what
 *  the fit test pins the floor against. */
export const BAND_PX = {
  "1280x720": 1022,
  "1440x800": 1151,
  "1920x1080": 1440,
  "1920x1247": 1440,
} as const;
export const boardFloorPx = (bandPx: number) => (FS_FLOOR * bandPx) / VB.row;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export type Face = "mono" | "sans";
export type Ink = "ink" | "ink2" | "ink3" | "gold-ink" | "gold-ink-lit" | "green-ink";
export type Role = "head" | "seat" | "layer" | "card" | "tools" | "sockets" | "foot";

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
export type ModulePaint =
  | "module"
  | "dormant"
  | "card-lit"
  | "card-led"
  | "seat-lit"
  | "socket"
  | "island";
export interface BoardModule {
  id: string;
  role: Role;
  rect: Rect;
  cut: number;
  paint: ModulePaint;
  /** A head band of this height, ruled at its floor. */
  head?: number;
  /** Interior rules, as absolute y. */
  rules?: readonly number[];
}
export interface BoardLane {
  id: "seat" | "layer" | "tools" | "drop-l" | "drop-r";
  pts: readonly Pt[];
  wires: number;
  dashed: boolean;
  paint: "gold" | "green";
  hatch?: Rect;
  /** `polylineLength` of the base path — the draw-on's `--l`. */
  len: number;
}
export interface BoardDiamond {
  id: string;
  role: Role;
  x: number;
  y: number;
  r: number;
  paint: "gold-line" | "green" | "gold" | "line";
  filled: boolean;
}
export interface BoardBed {
  die: Rect;
  meanders: readonly string[];
  passives: readonly Pt[];
  vias: readonly Pt[];
}
export interface BoardGeom {
  mode: BoardMode;
  vb: { w: number; h: number };
  datum: { y: number; x1: number; x2: number };
  foot: { y: number; x1: number; x2: number };
  modules: BoardModule[];
  letters: BoardLetter[];
  lanes: BoardLane[];
  diamonds: BoardDiamond[];
  bed: BoardBed | null;
}

/**
 * The shared vertical chain. `e` is the extension in units, 0 at rest.
 *
 *   26 + m + 88 + gap1 + band + m + 26 === 630 + e   at every e
 *
 * The block takes .80 of e (gap1 .35, the band .45 — .1125 per cell), the
 * air .20 split above and below, so the margin can never go negative and the
 * board is centred by construction.
 */
export function chain(e: number) {
  const m = 14 + 0.1 * e;
  const seatY = DATUM_Y + m;
  const gap1 = 44 + 0.35 * e;
  const bandY = seatY + SEAT_H + gap1;
  const cellH = Math.min(CELL_H0 + 0.1125 * e, CELL_H_MAX);
  const bandH = HEAD_H.layer + 4 * cellH;
  const bandFloor = bandY + bandH;
  const footY = bandFloor + m;
  const cropH = footY + DATUM_Y;
  return { m, seatY, gap1, bandY, cellH, bandH, bandFloor, footY, cropH };
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
/** The same wrap capped — what the drawing letters. */
export const wrapLines = (text: string, per: number, max = 2) => wrapAll(text, per).slice(0, max);

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
  anchor: BoardLetter["anchor"] = "start",
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
    anchor,
    ink,
    lit,
  }));
}

/**
 * The foot row: up to three kickers seated start · centre · end on the
 * terminus hairline, a diamond before each. Each kicker's MEASURE is the run
 * to its neighbour less the gap, so the guard fails when three kickers can no
 * longer share the row rather than when one of them overruns the crop.
 */
function foot(
  labels: readonly string[],
  x1: number,
  x2: number,
  base: number,
  paint: BoardDiamond["paint"]
): { letters: BoardLetter[]; diamonds: BoardDiamond[] } {
  const texts = labels.map(up);
  const widths = texts.map((t) => monoW(t, FS.chrome, TRACK.chrome));
  const starts: number[] = [];
  const n = texts.length;
  for (let i = 0; i < n; i += 1) {
    if (n === 1 || i === 0) starts.push(x1 + FOOT_MARK);
    else if (i === n - 1) starts.push(x2 - widths[i]);
    else starts.push((x1 + x2) / 2 - widths[i] / 2);
  }
  const letters = texts.map((t, i) => {
    const nextStart = i < n - 1 ? starts[i + 1] - FOOT_GAP - FOOT_MARK : x2;
    return mono(
      "foot",
      `foot.${i}`,
      t,
      FS.chrome,
      TRACK.chrome,
      nextStart - starts[i],
      starts[i],
      base,
      "ink2"
    );
  });
  const diamonds = starts.map((x, i) => ({
    id: `foot.${i}`,
    role: "foot" as const,
    x: x - FOOT_MARK + 5,
    y: base - 5,
    r: 4,
    paint,
    filled: true,
  }));
  return { letters, diamonds };
}

function configuredGeom(s: BoardState<"configured">, e: number): BoardGeom {
  const c = chain(e);
  const W = VB.w.configured;
  const cx = 490;
  const seat: Rect = { x: cx - 172, y: c.seatY, w: 344, h: SEAT_H };
  const layer: Rect = { x: INSET, y: c.bandY, w: 268, h: c.bandH };
  const card: Rect = { x: 340, y: c.bandY, w: 300, h: 270 };
  const itemH = ITEM_H0 + 0.15 * e;
  const tools: Rect = { x: 688, y: c.bandY, w: 188, h: HEAD_H.tools + 3 * itemH };
  const socketsTop = c.bandFloor - 28 - 80;
  const socketRects: Rect[] = [
    { x: 304, y: socketsTop, w: 180, h: 80 },
    { x: 496, y: socketsTop, w: 180, h: 80 },
  ];
  const cy = card.y + 135;
  const cardBottom = card.y + card.h;

  const letters: BoardLetter[] = [];
  const diamonds: BoardDiamond[] = [];
  const modules: BoardModule[] = [];

  // The head strip.
  letters.push(
    mono("head", "label", s.label, FS.chrome, TRACK.chrome, W - 2 * INSET, INSET, 16, "ink2")
  );

  // The seat — the human, in green.
  modules.push({ id: "seat", role: "seat", rect: seat, cut: CUT.module, paint: "seat-lit" });
  const sx = seat.x + PAD.seat;
  const sm = seat.w - 2 * PAD.seat;
  letters.push(mono("seat", "seat.q", s.seat.q, FS.key, TRACK.seat, sm, sx, seat.y + 22, "ink2"));
  letters.push(
    ...sans(
      "seat",
      "seat.a",
      s.seat.a,
      FS.value,
      sm,
      sx,
      seat.y + 45,
      "green-ink",
      "start",
      1,
      true
    )
  );
  if (s.seat.note)
    letters.push(
      ...sans("seat", "seat.note", s.seat.note, FS.value, sm, sx, seat.y + 69, "ink", "start", 1)
    );

  // The layer — four cells, each a tag and its sentence.
  const cellRules = [1, 2, 3].map((i) => layer.y + HEAD_H.layer + i * c.cellH);
  modules.push({
    id: "layer",
    role: "layer",
    rect: layer,
    cut: CUT.module,
    paint: "module",
    head: HEAD_H.layer,
    rules: cellRules,
  });
  const lx = layer.x + PAD.module;
  const lm = layer.w - 2 * PAD.module;
  letters.push(
    mono("layer", "layer.label", s.layer.label, FS.head, TRACK.head, lm, lx, layer.y + 24, "ink")
  );
  if (s.layer.sub)
    letters.push(
      ...sans(
        "layer",
        "layer.sub",
        s.layer.sub,
        FS.sub,
        lm,
        lx,
        layer.y + 46,
        "gold-ink",
        "start",
        1
      )
    );
  s.layer.rows.forEach((row, i) => {
    const top = layer.y + HEAD_H.layer + i * c.cellH;
    // ⚠ THE ADDED AIR IS SPLIT, NOT POOLED (R4's own rule): half of a
    // taller cell's growth goes above its content.
    const dy = (c.cellH - CELL_H0) / 2;
    letters.push(
      mono(
        "layer",
        `layer.${row.id}.tag`,
        row.tag,
        FS.key,
        TRACK.key,
        lm,
        lx,
        top + dy + 21,
        "gold-ink"
      )
    );
    if (row.name)
      letters.push(
        ...sans("layer", `layer.${row.id}.name`, row.name, FS.value, lm, lx, top + dy + 44, "ink")
      );
  });

  // The card — the one lit object.
  modules.push({ id: "card", role: "card", rect: card, cut: CUT.card, paint: "card-lit" });
  const kx = card.x + PAD.card;
  const km = card.w - 2 * PAD.card;
  diamonds.push({
    id: "card.mark",
    role: "card",
    x: card.x + 26,
    y: card.y + 17,
    r: 8,
    paint: "gold-line",
    filled: true,
  });
  letters.push(
    mono("card", "card.name", s.card.name, FS.name, TRACK.name, km, kx, card.y + 62, "ink")
  );
  if (s.card.work)
    letters.push(...sans("card", "card.work", s.card.work, FS.value, km, kx, card.y + 88, "ink"));
  (s.card.rows ?? []).forEach((row, i) => {
    const base = card.y + 120 + i * 81;
    letters.push(
      mono("card", `card.row.${i}.q`, row.q, FS.key, TRACK.key, km, kx, base, "gold-ink")
    );
    letters.push(...sans("card", `card.row.${i}.a`, row.a, FS.value, km, kx, base + 23, "ink"));
  });

  // The tools — where it runs.
  modules.push({
    id: "tools",
    role: "tools",
    rect: tools,
    cut: CUT.module,
    paint: "module",
    head: HEAD_H.tools,
  });
  const tx = tools.x + PAD.module;
  const tm = tools.w - 2 * PAD.module;
  if (s.tools.label)
    letters.push(
      mono("tools", "tools.label", s.tools.label, FS.head, TRACK.head, tm, tx, tools.y + 26, "ink")
    );
  s.tools.items.forEach((item, i) => {
    const top = tools.y + HEAD_H.tools + i * itemH;
    const dy = (itemH - ITEM_H0) / 2;
    if (item.lit) {
      diamonds.push({
        id: `tools.${item.id}.mark`,
        role: "tools",
        x: tx + 5,
        y: top + dy + 16,
        r: 5,
        paint: "gold-line",
        filled: true,
      });
      letters.push(
        mono(
          "tools",
          `tools.${item.id}.name`,
          item.name,
          FS.key,
          TRACK.key,
          tm - 18,
          tx + 18,
          top + dy + 21,
          "gold-ink-lit"
        )
      );
    } else {
      letters.push(
        mono(
          "tools",
          `tools.${item.id}.name`,
          item.name,
          FS.key,
          TRACK.key,
          tm,
          tx,
          top + dy + 21,
          "gold-ink"
        )
      );
    }
    if (item.note)
      letters.push(
        ...sans(
          "tools",
          `tools.${item.id}.note`,
          item.note,
          FS.value,
          tm,
          tx,
          top + dy + 44,
          "ink",
          "start",
          1
        )
      );
  });

  // The sockets — the next workstreams, on the card's own outline.
  const sockets = s.sockets;
  if (sockets) {
    sockets.items.slice(0, 2).forEach((item, i) => {
      const r = socketRects[i];
      modules.push({
        id: `socket.${i}`,
        role: "sockets",
        rect: r,
        cut: CUT.socket,
        paint: "socket",
      });
      letters.push(
        mono(
          "sockets",
          `socket.${i}.name`,
          item.name,
          FS.chrome,
          TRACK.key,
          r.w - 2 * PAD.module,
          r.x + PAD.module,
          r.y + 24,
          "ink2"
        )
      );
    });
    if (sockets.note)
      letters.push(
        ...sans(
          "sockets",
          "sockets.note",
          sockets.note,
          FS.value,
          300,
          cx,
          c.bandFloor - 6,
          "ink3",
          "middle",
          1
        )
      );
  }

  // The ribbons: the seat's authority drop in green, the gold runs to the
  // layer and the tools, and two dashed drops into the sockets.
  const dropLen = socketsTop - cardBottom;
  const leg = (dropLen - 28) / 2;
  const lanes: BoardLane[] = [
    lane(
      "seat",
      [
        [cx, seat.y + seat.h],
        [cx, card.y],
      ],
      8,
      false,
      "green",
      { x: cx - 14, y: seat.y + seat.h, w: 28, h: c.gap1 }
    ),
    lane(
      "layer",
      [
        [card.x, cy],
        [layer.x + layer.w, cy],
      ],
      8,
      false,
      "gold",
      { x: layer.x + layer.w, y: cy - 14, w: 48, h: 28 }
    ),
    lane(
      "tools",
      [
        [card.x + card.w, cy],
        [tools.x, cy],
      ],
      8,
      false,
      "gold",
      { x: card.x + card.w, y: cy - 14, w: 48, h: 28 }
    ),
    lane(
      "drop-l",
      [
        [cx - 68, cardBottom],
        [cx - 68, cardBottom + leg],
        [cx - 96, cardBottom + leg + 28],
        [cx - 96, socketsTop],
      ],
      4,
      true,
      "gold"
    ),
    lane(
      "drop-r",
      [
        [cx + 68, cardBottom],
        [cx + 68, cardBottom + leg],
        [cx + 96, cardBottom + leg + 28],
        [cx + 96, socketsTop],
      ],
      4,
      true,
      "gold"
    ),
  ];

  // The bed — R4's substrate, spread over the whole crop (y scaled), the
  // ghost die twenty proud of the card. Authored positions, never random.
  const k = c.cropH / VB.h;
  const at = (y: number) => y * k;
  const bed: BoardBed = {
    die: { x: card.x - 20, y: card.y - 20, w: card.w + 40, h: card.h + 40 },
    meanders: [
      `M40 ${at(70)}H240L280 ${at(70) + 40}V${at(150)}`,
      `M862 ${at(430)}V${at(540)}L818 ${at(540) + 44}H720`,
    ],
    passives: [
      [60, at(96)],
      [830, at(64)],
      [720, at(470)],
      [60, at(560)],
    ],
    vias: [
      [110, at(60)],
      [200, at(110)],
      [700, at(100)],
      [760, at(60)],
      [850, at(120)],
      [300, at(600)],
      [730, at(520)],
      [810, at(580)],
      [200, at(600)],
      [640, at(560)],
    ],
  };

  const kick = foot(s.foot, INSET, W - INSET, c.footY + 18, "gold");
  letters.push(...kick.letters);
  diamonds.push(...kick.diamonds);

  return {
    mode: "configured",
    vb: { w: W, h: c.cropH },
    datum: { y: DATUM_Y, x1: INSET, x2: W - INSET },
    foot: { y: c.footY, x1: INSET, x2: W - INSET },
    modules,
    letters,
    lanes,
    diamonds,
    bed,
  };
}

function todayGeom(s: BoardState<"today">, e: number): BoardGeom {
  const c = chain(e);
  const W = VB.w.today;
  const cx = 359;
  const seat: Rect = { x: cx - 172, y: c.seatY, w: 344, h: SEAT_H };
  const layer: Rect = { x: INSET, y: c.bandY, w: 194, h: c.bandH };
  const card: Rect = { x: 245, y: c.bandY, w: 228, h: 140 };

  const letters: BoardLetter[] = [];
  const diamonds: BoardDiamond[] = [];
  const modules: BoardModule[] = [];

  letters.push(
    mono("head", "label", s.label, FS.chrome, TRACK.chrome, W - 2 * INSET, INSET, 16, "ink2")
  );

  // The seat, empty: dashed, no green — no one owns it.
  modules.push({ id: "seat", role: "seat", rect: seat, cut: CUT.module, paint: "dormant" });
  const sx = seat.x + PAD.seat;
  const sm = seat.w - 2 * PAD.seat;
  letters.push(mono("seat", "seat.q", s.seat.q, FS.key, TRACK.seat, sm, sx, seat.y + 22, "ink2"));
  letters.push(
    ...sans("seat", "seat.a", s.seat.a, FS.value, sm, sx, seat.y + 45, "ink2", "start", 1)
  );
  if (s.seat.note)
    letters.push(
      ...sans("seat", "seat.note", s.seat.note, FS.value, sm, sx, seat.y + 69, "ink3", "start", 1)
    );

  // The layer as dashed room: the tags stand, the sentences are absent.
  const cellRules = [1, 2, 3].map((i) => layer.y + HEAD_H.layer + i * c.cellH);
  modules.push({
    id: "layer",
    role: "layer",
    rect: layer,
    cut: CUT.module,
    paint: "dormant",
    head: HEAD_H.layer,
    rules: cellRules,
  });
  const lx = layer.x + PAD.module;
  const lm = layer.w - 2 * PAD.module;
  letters.push(
    mono("layer", "layer.label", s.layer.label, FS.head, TRACK.head, lm, lx, layer.y + 24, "ink2")
  );
  if (s.layer.sub)
    letters.push(
      ...sans("layer", "layer.sub", s.layer.sub, FS.sub, lm, lx, layer.y + 46, "ink3", "start", 1)
    );
  s.layer.rows.forEach((row, i) => {
    const top = layer.y + HEAD_H.layer + i * c.cellH;
    const dy = (c.cellH - CELL_H0) / 2;
    letters.push(
      mono(
        "layer",
        `layer.${row.id}.tag`,
        row.tag,
        FS.key,
        TRACK.key,
        lm,
        lx,
        top + dy + 21,
        "gold-ink"
      )
    );
    if (row.name)
      letters.push(
        ...sans("layer", `layer.${row.id}.name`, row.name, FS.value, lm, lx, top + dy + 44, "ink3")
      );
  });

  // The card, green: the work is the people's, all of it.
  modules.push({ id: "card", role: "card", rect: card, cut: CUT.card, paint: "card-led" });
  const kx = card.x + PAD.card;
  const km = card.w - 2 * PAD.card;
  diamonds.push({
    id: "card.mark",
    role: "card",
    x: card.x + 26,
    y: card.y + 17,
    r: 8,
    paint: "green",
    filled: false,
  });
  letters.push(
    mono("card", "card.name", s.card.name, FS.name, TRACK.name, km, kx, card.y + 62, "ink")
  );
  if (s.card.work)
    letters.push(...sans("card", "card.work", s.card.work, FS.value, km, kx, card.y + 88, "ink"));
  (s.card.rows ?? []).forEach((row, i) => {
    const base = card.y + 120 + i * 81;
    letters.push(
      mono("card", `card.row.${i}.q`, row.q, FS.key, TRACK.key, km, kx, base, "gold-ink")
    );
    letters.push(...sans("card", `card.row.${i}.a`, row.a, FS.value, km, kx, base + 23, "ink"));
  });

  // The tools as islands: present, unwired.
  s.tools.items.forEach((item, i) => {
    const r: Rect = { x: 500, y: c.bandY + i * 52, w: 96, h: 36 };
    modules.push({
      id: `island.${item.id}`,
      role: "tools",
      rect: r,
      cut: CUT.island,
      paint: "island",
    });
    letters.push(
      mono(
        "tools",
        `tools.${item.id}.name`,
        item.name,
        FS.key,
        TRACK.key,
        r.w - 12,
        r.x + r.w / 2,
        r.y + 24,
        "gold-ink",
        "middle"
      )
    );
  });
  if (s.tools.note) {
    // Under the card's floor, so its measure runs from the card's left wall
    // to the crop's inset — 351 units, right-aligned under the islands.
    letters.push(
      ...sans(
        "tools",
        "tools.note",
        s.tools.note,
        FS.value,
        W - INSET - card.x,
        W - INSET,
        c.bandY + 168,
        "ink3",
        "end",
        1
      )
    );
  }

  const kick = foot(s.foot, INSET, W - INSET, c.footY + 18, "line");
  letters.push(...kick.letters);
  diamonds.push(...kick.diamonds);

  return {
    mode: "today",
    vb: { w: W, h: c.cropH },
    datum: { y: DATUM_Y, x1: INSET, x2: W - INSET },
    foot: { y: c.footY, x1: INSET, x2: W - INSET },
    modules,
    letters,
    lanes: [],
    diamonds,
    bed: null,
  };
}

function lane(
  id: BoardLane["id"],
  pts: readonly Pt[],
  wires: number,
  dashed: boolean,
  paint: BoardLane["paint"],
  hatch?: Rect
): BoardLane {
  return { id, pts, wires, dashed, paint, hatch, len: polylineLength(pts) };
}

/** One board's whole drawing, for one state at one extension. */
export function boardGeom(state: BoardState, e = 0): BoardGeom {
  return state.mode === "today"
    ? todayGeom(state as BoardState<"today">, e)
    : configuredGeom(state as BoardState<"configured">, e);
}

/** The lettering a fit guard walks — every `<text>` the board draws. */
export const boardLettering = (state: BoardState, e = 0): BoardLetter[] =>
  boardGeom(state, e).letters;

/** A letter's width under the surface's advance model. */
export const letterWidth = (l: BoardLetter) =>
  l.face === "mono" ? monoW(l.text, l.fs, l.track) : l.text.length * SANS_ADV * l.fs;
