import {
  adv,
  type LetterSpec,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaLetters";
import {
  polylineLength,
  type Pt,
} from "@/components/landing/home-v2/services/casefile/map/pda/ribbon";
import { housing } from "@/components/landing/home-v2/services/casefile/map/pda/substrateKit";
import type { ArcSectionOf, CircuitTeam } from "@/lib/arcs/types";

import type { CircuitGlyphKey } from "./circuitGlyphData";

/**
 * circuitLayout — THE CIRCUIT's arithmetic (ADR-133). Pure: no React, no DOM.
 *
 * ONE drawing, THREE states, and every object in it is ONE element posed three
 * ways. That is the whole contract, and it is what makes the configuration
 * TRAVEL rather than be redrawn (owner, 2026-09-28: "I really want to use our
 * configuration visual to have it evolve or travel through these two other
 * sections"):
 *
 *   a  THE STUDIO TODAY, AND CONFIGURED — a ruled LEDGER (the studio as it
 *      runs: seven facts written down and connected to nothing) beside ONE
 *      PIECE OF WORK with its six questions wired around it. The Cyberpunk
 *      inventory board's vocabulary in the house's law: a filled core, six
 *      chips with a glyph well and a value plate, two item rails on the
 *      flanks, eight-wire ribbons, a dot bed and a ghost die.
 *   b  YOUR PEOPLE DO MORE — the ledger closes on its aperture, the six chips
 *      fold into the core, and the core SHRINKS into the one configuration it
 *      is (the review recap) while its siblings peel off it into the columns
 *      of the teams they give time back to: a person (green), their
 *      configurations (gold), and what they are freed for (green).
 *   c  THE LARGER MACHINE — the configurations line up on one shared layer,
 *      the studio's AI capability, and the layer plugs into what is around
 *      the studio: the DAM, the projects, the adaptation agency, the rest of
 *      marketing, and a brand system for all of it (drawn dashed: it does not
 *      exist yet).
 *
 * ⚠ A POSE IS `translate(tx, ty) scale(k)` ABOUT THE VIEWBOX ORIGIN, applied
 * to the object's HOME geometry (the state it is drawn for). The CSS resolves
 * lengths on an SVG element in user units, so the pose is the same number in
 * the layout, the markup and the fit test. The home of an object is the state
 * where it is at rest and read: the ledger, the chips and the core at `a`, the
 * teams and the cartridges at `b`, the layer and the sockets at `c`.
 *
 * ⚠ THE CORE CHANGES SHAPE, AND A UNIFORM SCALE CANNOT CARRY THAT: 320 × 184
 * becomes 212 × 56. So its PLATE morphs (CSS `d`, one `housing()` command
 * structure at both ends — ADR-071's law: a mismatch does not error, it snaps)
 * while its NAME rides a uniform pose (24 → 16.6 units, the cartridges' own
 * rung) and everything else on it withdraws.
 *
 * ⚠ FIT IS DECLARED, NOT REVIEWED (the board's idiom, ADR-100). SVG `<text>`
 * neither wraps nor reports overflow, so every lettered string is emitted with
 * the measure it must fit; `tests/lib/arc-circuit-fit.test.ts` walks every
 * state: widths, the longest word, the rendered floor (fs × k × meet), each
 * letter inside the crop and no two letters on one another.
 */

export type CircuitState = "a" | "b" | "c";
export const CIRCUIT_STATES: readonly CircuitState[] = ["a", "b", "c"];

export const CIR_VB = { w: 1400, h: 560 } as const;
export const INSET = 24;
export const FLOOR = CIR_VB.h - INSET;

/** The type ladder, in units — the board's ranking (ADR-100). */
export const FS = {
  name: 24,
  value: 18,
  answer: 16.6,
  head: 16.6,
  key: 15.8,
  chrome: 15.3,
} as const;
export const FS_FLOOR = 15.3;
export const TRACK = { head: 0.14, key: 0.18, chrome: 0.2 } as const;
/** PP Neue Montreal's measured average advance, as a conservative cell. */
export const SANS_ADV = 0.55;

/** The text band the drawing renders into — the board's own measures. */
export const BAND_PX = {
  "1280x720": 1022,
  "1440x800": 1151,
  "1920x1080": 1200,
  "1920x1247": 1200,
} as const;
export const renderedPx = (fs: number, k: number, bandPx: number) => (fs * k * bandPx) / CIR_VB.w;

/* ── The pieces ───────────────────────────────────────────────────────── */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export type Face = "mono" | "sans";
export type Ink = "ink" | "ink2" | "ink3" | "gold-ink" | "green-ink" | "on-gold" | "on-gold-2";

export interface CirLetter extends LetterSpec {
  face: Face;
  x: number;
  y: number;
  anchor: "start" | "middle";
  ink: Ink;
  /** `--weight-lit`, the ceiling. */
  lit?: boolean;
}

/**
 * How a plate is painted. `row` is the LEDGER's: a hairline and nothing else,
 * because the studio as it runs today is an inventory, not a machine
 * (ADR-100 U2's law: a before and an after are two KINDS of object).
 */
export type Paint =
  | "row"
  | "plate"
  | "gold"
  | "gold-fill"
  | "green"
  | "future"
  | "well"
  | "well-gold"
  | "gold-future"
  | "die";

export interface CirModule {
  id: string;
  rect: Rect;
  cut: number;
  paint: Paint;
  /** A head band of this height, ruled at its floor. */
  head?: number;
}

/** A pad's paint: a filled mark, or a ring (an outlined cell). */
export type PadTone = "gold" | "dawn" | "on-gold" | "green" | "ring-gold" | "ring-dawn";

export type CirMark =
  | { kind: "glyph"; key: CircuitGlyphKey; x: number; y: number; cell: number }
  | { kind: "pad"; x: number; y: number; w: number; h: number; tone: PadTone }
  | { kind: "person"; x: number; y: number; cell: number }
  | { kind: "rule"; x1: number; y1: number; x2: number; y2: number; tone: "line" | "on-gold" }
  | { kind: "via"; cx: number; cy: number; r: number };

export interface Pose {
  tx: number;
  ty: number;
  k: number;
  /** Shown (1) or withdrawn (0). */
  o: 0 | 1;
  /** Closed on its centre-out aperture (the caption card's, ADR-097 U12). */
  shut?: true;
}

export type PartGroup =
  | "ledger"
  | "bed"
  | "die"
  | "sat"
  | "rail"
  | "core"
  | "core-name"
  | "core-x"
  | "cart"
  | "seat"
  | "freed"
  | "layer"
  | "socket";

export interface CirPart {
  id: string;
  group: PartGroup;
  poses: Record<CircuitState, Pose>;
  /** The transition delay INTO each state, ms. */
  delays: Record<CircuitState, number>;
  modules: CirModule[];
  marks: CirMark[];
  letters: CirLetter[];
  /** The first module's outline per state — the core's shape change. */
  morph?: Record<CircuitState, string>;
}

export interface CirWire {
  id: string;
  pts: readonly Pt[];
  wires: number;
  pitch: number;
  paint: "gold" | "green";
  /** `polylineLength` of the base path — the draw-on's `--l`. */
  len: number;
  on: Record<CircuitState, boolean>;
  delays: Record<CircuitState, number>;
  /** The endpoints it must land on, for the fit test. */
  ends: readonly [string, string];
}

export interface CircuitGeom {
  vb: { w: number; h: number };
  parts: CirPart[];
  wires: CirWire[];
}

type CircuitSection = ArcSectionOf<"circuit">;

/* ── Helpers ──────────────────────────────────────────────────────────── */

const up = (s: string) => s.toUpperCase();
const center = (r: Rect): Pt => [r.x + r.w / 2, r.y + r.h / 2];
export const monoWidth = (text: string, fs: number, track: number) => text.length * adv(fs, track);
export const sansWidth = (text: string, fs: number) => text.length * SANS_ADV * fs;
export const letterWidth = (l: CirLetter) =>
  l.face === "mono" ? monoWidth(l.text, l.fs, l.track) : sansWidth(l.text, l.fs);

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

function mono(
  slot: string,
  text: string,
  fs: number,
  track: number,
  measure: number,
  x: number,
  y: number,
  ink: Ink,
  anchor: CirLetter["anchor"] = "start"
): CirLetter {
  return { slot, text: up(text), fs, track, measure, face: "mono", x, y, anchor, ink };
}

/** A sans string wrapped to its measure; lines past `max` are declared at
 *  measure 0 so a sliced tail fails the guard rather than vanishing. */
function sans(
  slot: string,
  text: string,
  fs: number,
  measure: number,
  x: number,
  y0: number,
  ink: Ink,
  max = 1,
  lit?: boolean,
  step = 24
): CirLetter[] {
  const per = Math.floor(measure / (SANS_ADV * fs));
  return wrapAll(text, per).map((line, i) => ({
    slot: `${slot}.${i}`,
    text: line,
    fs,
    track: 0,
    measure: i < max ? measure : 0,
    face: "sans" as const,
    x,
    y: y0 + i * step,
    anchor: "start" as const,
    ink,
    lit,
  }));
}

const ID: Pose = { tx: 0, ty: 0, k: 1, o: 1 };
const HIDE: Pose = { tx: 0, ty: 0, k: 1, o: 0 };
const SHUT: Pose = { tx: 0, ty: 0, k: 1, o: 0, shut: true };
const shift = (tx: number, ty: number, o: 0 | 1 = 1): Pose => ({ tx, ty, k: 1, o });
/** The pose that carries home point `p0` to `p1` at scale `k`. */
export const toward = (p0: Pt, p1: Pt, k: number, o: 0 | 1): Pose => ({
  tx: p1[0] - k * p0[0],
  ty: p1[1] - k * p0[1],
  k,
  o,
});
const d3 = (a: number, b: number, c: number): Record<CircuitState, number> => ({ a, b, c });
const on3 = (a: boolean, b: boolean, c: boolean): Record<CircuitState, boolean> => ({ a, b, c });

/** An eight-wire ribbon, or a four-wire tap, with its draw-on length. */
function wire(
  id: string,
  pts: readonly Pt[],
  paint: CirWire["paint"],
  on: Record<CircuitState, boolean>,
  delays: Record<CircuitState, number>,
  ends: readonly [string, string],
  wires = 8
): CirWire {
  return { id, pts, wires, pitch: 4, paint, len: polylineLength(pts), on, delays, ends };
}

/* ── State a: the ledger and the board ────────────────────────────────── */

/** The ledger's box: seven ruled rows off the crop's own inset. */
export const LEDGER = { x: INSET, w: 480, valueX: 208, rows: 7 } as const;
export const LEDGER_ROW_H = (FLOOR - INSET) / LEDGER.rows;
/** The board's region — right of the ledger and a 40-unit seam. */
export const BOARD = { x: LEDGER.x + LEDGER.w + 40, right: CIR_VB.w - INSET } as const;
export const BOARD_CX = (BOARD.x + BOARD.right) / 2;

/** The six chips: three above the work, three below, 256 × 116. */
export const SAT = { w: 256, h: 116, gap: 16, band: 36 } as const;
const SAT_ROW_W = 3 * SAT.w + 2 * SAT.gap;
const SAT_X0 = BOARD_CX - SAT_ROW_W / 2;
export const SAT_TOP_Y = INSET;
export const SAT_BOT_Y = FLOOR - SAT.h;

/** The work — the one FILLED object on the plate (ADR-089 U4). */
export const CORE: Rect = { x: BOARD_CX - 160, y: CIR_VB.h / 2 - 92, w: 320, h: 184 };
export const CORE_CUT = 20;
/** Where the three ribbons of each row land on the core, left to right. */
const CORE_PORTS = [BOARD_CX - 80, BOARD_CX, BOARD_CX + 80] as const;
/** The item rails on the flanks, 208 × 140. */
export const RAIL = { w: 208, h: 140 } as const;

/* ── State b: the teams ──────────────────────────────────────────────── */

export const COL = { w: 316, n: 4 } as const;
const COL_GAP = (CIR_VB.w - 2 * INSET - COL.n * COL.w) / (COL.n - 1);
export const colX = (i: number) => INSET + i * (COL.w + COL_GAP);
export const SEAT_H = 84;
export const FREED = { y: 448, h: FLOOR - 448 } as const;
export const CART = { w: 212, h: 56, cut: 12 } as const;
/** The first cartridge slot, and the pitch between slots. */
export const SLOT_Y = 156;
export const SLOT_PITCH = 68;
/** The bus's offset from its column's edge, and a cartridge's from the bus. */
const BUS_IN = 30;
const CART_IN = 76;

/* ── State c: the larger machine ──────────────────────────────────────── */

export const ROW_C = { y: 156, gap: 16 } as const;
export const LAYER: Rect = { x: INSET, y: 256, w: CIR_VB.w - 2 * INSET, h: 84 };
export const SOCKET = { y: 432, h: FLOOR - 432, gap: 18 } as const;

/* ── The geometry ─────────────────────────────────────────────────────── */

/** Which configurations sit in which column in beat b, and where. */
export interface CartSeat {
  id: string;
  rect: Rect;
  /** The teams whose bus taps it (one, or two adjacent). */
  teams: number[];
}

/** Beat b's cartridge placement: a team's own configurations stack down its
 *  column; a configuration two ADJACENT teams share sits between their two
 *  buses, on the first slot free in both. */
export function cartSeats(teams: readonly CircuitTeam[]): CartSeat[] {
  const n = teams.length;
  const busX = (i: number) => (i === n - 1 ? colX(i) + COL.w - BUS_IN : colX(i) + BUS_IN);
  const owners = new Map<string, number[]>();
  teams.forEach((t, i) =>
    t.configs.forEach((id) => owners.set(id, [...(owners.get(id) ?? []), i]))
  );
  // A short stack starts lower on the same slot grid, so a column with one
  // configuration holds it near the band's middle rather than under its seat.
  const counts = teams.map((t) => t.configs.length);
  const tallest = Math.max(...counts);
  const next = counts.map((n) => Math.floor((tallest - n) / 2));
  const out: CartSeat[] = [];
  const seen = new Set<string>();
  teams.forEach((t, i) => {
    t.configs.forEach((id) => {
      if (seen.has(id)) return;
      seen.add(id);
      const who = owners.get(id) ?? [i];
      if (who.length === 1) {
        const slot = next[i]++;
        const x = i === n - 1 ? colX(i) + COL.w - CART_IN - CART.w : colX(i) + CART_IN;
        out.push({ id, rect: { x, y: SLOT_Y + slot * SLOT_PITCH, ...wh() }, teams: who });
      } else {
        const [a, b] = who as [number, number];
        const slot = Math.max(next[a], next[b], Math.floor((tallest - 1) / 2));
        next[a] = slot + 1;
        next[b] = slot + 1;
        const mid = (busX(a) + busX(b)) / 2;
        out.push({
          id,
          rect: { x: mid - CART.w / 2, y: SLOT_Y + slot * SLOT_PITCH, ...wh() },
          teams: who,
        });
      }
    });
  });
  return out;
}
const wh = () => ({ w: CART.w, h: CART.h });

/** Beat c's row: every configuration in the plan's order. */
export function rowSeats(ids: readonly string[]): Map<string, Rect> {
  const w = (CIR_VB.w - 2 * INSET - (ids.length - 1) * ROW_C.gap) / ids.length;
  return new Map(
    ids.map((id, j) => [id, { x: INSET + j * (w + ROW_C.gap), y: ROW_C.y, w, h: CART.h }])
  );
}

export function circuitGeom(s: CircuitSection): CircuitGeom {
  const parts: CirPart[] = [];
  const wires: CirWire[] = [];
  const configIds = s.machine.configs.map((c) => c.id);
  const cartB = cartSeats(s.people.teams);
  const cartC = rowSeats(configIds);
  const recapB = cartB.find((c) => c.id === s.work.id)?.rect;
  const recapC = cartC.get(s.work.id);
  if (!recapB || !recapC) throw new Error(`circuit: the work "${s.work.id}" is not seated`);

  /* ── The bed: dots under the board, and under the whole plate in b/c. */
  parts.push({
    id: "bed-board",
    group: "bed",
    poses: { a: ID, b: ID, c: ID },
    delays: d3(0, 0, 0),
    modules: [
      {
        id: "bed-board",
        rect: { x: BOARD.x, y: INSET, w: BOARD.right - BOARD.x, h: FLOOR - INSET },
        cut: 0,
        paint: "plate",
      },
    ],
    marks: [],
    letters: [],
  });
  parts.push({
    id: "bed-left",
    group: "bed",
    poses: { a: HIDE, b: ID, c: ID },
    delays: d3(0, 500, 0),
    modules: [
      {
        id: "bed-left",
        rect: { x: INSET, y: INSET, w: BOARD.x - INSET, h: FLOOR - INSET },
        cut: 0,
        paint: "plate",
      },
    ],
    marks: [],
    letters: [],
  });

  /* ── a · THE LEDGER — the studio as it runs today. */
  const ledgerRows: { key: string; value: string }[] = [
    { key: "The work", value: s.work.today },
    ...s.questions.map((q) => ({ key: q.key, value: q.today })),
  ];
  const ledger: CirPart = {
    id: "ledger",
    group: "ledger",
    poses: { a: ID, b: SHUT, c: SHUT },
    delays: d3(650, 0, 0),
    modules: [],
    marks: [],
    letters: [],
  };
  ledgerRows.forEach((row, i) => {
    const y = INSET + i * LEDGER_ROW_H;
    ledger.modules.push({
      id: `ledger-${i}`,
      rect: { x: LEDGER.x, y, w: LEDGER.w, h: LEDGER_ROW_H },
      cut: 0,
      paint: "row",
    });
    const base = y + LEDGER_ROW_H / 2 + 6;
    ledger.letters.push(
      mono(
        `ledger.${i}.key`,
        row.key,
        FS.key,
        TRACK.key,
        LEDGER.valueX - LEDGER.x - 12,
        LEDGER.x,
        base,
        "ink2"
      )
    );
    ledger.letters.push(
      ...sans(
        `ledger.${i}.value`,
        row.value,
        FS.value,
        LEDGER.x + LEDGER.w - LEDGER.valueX,
        LEDGER.valueX,
        base,
        "ink"
      )
    );
  });
  parts.push(ledger);

  /* ── a · the ghost die and its vias — the board's own substrate. */
  const die: Rect = { x: CORE.x - 18, y: CORE.y - 16, w: CORE.w + 36, h: CORE.h + 32 };
  const vias: CirMark[] = [];
  const viaAt = (x: number, y: number) => vias.push({ kind: "via", cx: x, cy: y, r: 2.6 });
  for (const [sx, sy] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ] as const) {
    const cx = sx < 0 ? die.x - 14 : die.x + die.w + 14;
    const cy = sy < 0 ? die.y + 10 : die.y + die.h - 10;
    viaAt(cx, cy);
    viaAt(cx, cy - sy * 12);
    viaAt(cx - sx * 12, cy - sy * 12);
  }
  parts.push({
    id: "die",
    group: "die",
    poses: { a: ID, b: HIDE, c: HIDE },
    delays: d3(500, 0, 0),
    modules: [{ id: "die", rect: die, cut: 30, paint: "die" }],
    marks: vias,
    letters: [],
  });

  /* ── a · THE SIX CHIPS. Above the work: what the team writes (the
     context, the evals, gold) and who answers for it (the owner, green).
     Below: what it runs on. */
  const satRect = (i: number): Rect => ({
    x: SAT_X0 + (i % 3) * (SAT.w + SAT.gap),
    y: i < 3 ? SAT_TOP_Y : SAT_BOT_Y,
    w: SAT.w,
    h: SAT.h,
  });
  s.questions.forEach((q, i) => {
    const r = satRect(i);
    const paint: Paint = q.id === "owner" ? "green" : i < 3 ? "gold" : "plate";
    const marks: CirMark[] = [{ kind: "glyph", key: q.id, x: r.x + 11, y: r.y + 7.5, cell: 3 }];
    let keyMeasure = r.w - 40 - 12;
    if (q.id === "model") {
      // The lane meter — fast · everyday · frontier, the middle one lit.
      // Three cells in the head band's right end: the answer names the lane.
      for (let c = 0; c < 3; c += 1) {
        marks.push({
          kind: "pad",
          x: r.x + r.w - 12 - (3 - c) * 18 + 2,
          y: r.y + 14,
          w: 14,
          h: 8,
          tone: c === 1 ? "gold" : "dawn",
        });
      }
      keyMeasure = r.w - 40 - 12 - 3 * 18 - 8;
    }
    const answerInk: Ink = q.id === "owner" ? "green-ink" : "ink";
    parts.push({
      id: `sat-${q.id}`,
      group: "sat",
      poses: { a: ID, b: toward(center(r), center(CORE), 0.3, 0), c: HIDE },
      delays: d3(520 + i * 60, 60, 0),
      modules: [
        { id: `sat-${q.id}`, rect: r, cut: 12, paint, head: SAT.band },
        {
          id: `sat-${q.id}-plate`,
          rect: { x: r.x + 10, y: r.y + 70, w: r.w - 20, h: 34 },
          cut: 0,
          paint: q.id === "owner" ? "well" : i < 3 ? "well-gold" : "well",
        },
      ],
      marks,
      letters: [
        mono(`sat.${q.id}.key`, q.key, FS.key, TRACK.key, keyMeasure, r.x + 40, r.y + 24, "ink"),
        ...sans(`sat.${q.id}.q`, q.question, FS.chrome, r.w - 28, r.x + 14, r.y + 58, "ink2"),
        ...sans(
          `sat.${q.id}.a`,
          q.answer,
          FS.answer,
          r.w - 40,
          r.x + 20,
          r.y + 93,
          answerInk,
          1,
          true
        ),
      ],
    });

    // Its ribbon to the work: straight for the middle chip, a stub, a 45°
    // step, a level run and a 45° step down for the outer two.
    const [sx] = center(r);
    const port = CORE_PORTS[i % 3];
    const top = i < 3;
    const y0 = top ? r.y + r.h : r.y;
    const y1 = top ? CORE.y : CORE.y + CORE.h;
    const dir = top ? 1 : -1;
    const run = top ? y0 + 24 : y0 - 24;
    const pts: Pt[] =
      Math.abs(sx - port) < 1
        ? [
            [sx, y0],
            [port, y1],
          ]
        : [
            [sx, y0],
            [sx, run - dir * 14],
            [sx + Math.sign(port - sx) * 14, run],
            [port - Math.sign(port - sx) * 14, run],
            [port, run + dir * 14],
            [port, y1],
          ];
    wires.push(
      wire(
        `sat-${q.id}`,
        pts,
        q.id === "owner" ? "green" : "gold",
        on3(true, false, false),
        d3(720 + i * 50, 0, 0),
        [`sat-${q.id}`, "core"]
      )
    );
  });

  /* ── a · THE TWO ITEM RAILS on the flanks: what the context holds, and
     what the evals check, each under its own chip. */
  const railFor = (qid: "context" | "evals", side: -1 | 1): void => {
    const q = s.questions.find((x) => x.id === qid);
    if (!q) return;
    const items = qid === "context" ? s.rails.context : s.rails.evals;
    const x = side < 0 ? CORE.x - 32 - RAIL.w : CORE.x + CORE.w + 32;
    const r: Rect = { x, y: CIR_VB.h / 2 - RAIL.h / 2, w: RAIL.w, h: RAIL.h };
    const letters: CirLetter[] = [];
    const marks: CirMark[] = [];
    items.forEach((item, j) => {
      const top = r.y + 14 + j * 42;
      marks.push({ kind: "pad", x: r.x + 14, y: top + 5, w: 11, h: 11, tone: "gold" });
      letters.push(
        mono(
          `rail.${qid}.${j}.key`,
          item.key,
          FS.chrome,
          TRACK.chrome,
          r.w - 34 - 12,
          r.x + 34,
          top + 15,
          "gold-ink"
        )
      );
      letters.push(
        ...sans(
          `rail.${qid}.${j}.value`,
          item.value,
          FS.chrome,
          r.w - 34 - 12,
          r.x + 34,
          top + 34,
          "ink2"
        )
      );
    });
    parts.push({
      id: `rail-${qid}`,
      group: "rail",
      poses: { a: ID, b: toward(center(r), center(CORE), 0.3, 0), c: HIDE },
      delays: d3(820, 0, 0),
      modules: [{ id: `rail-${qid}`, rect: r, cut: 12, paint: "plate" }],
      marks,
      letters,
    });
    const chip = satRect(s.questions.indexOf(q));
    const wx = side < 0 ? chip.x + 40 : chip.x + chip.w - 40;
    wires.push(
      wire(
        `rail-${qid}`,
        [
          [wx, chip.y + chip.h],
          [wx, r.y],
        ],
        "gold",
        on3(true, false, false),
        d3(980, 0, 0),
        [`sat-${qid}`, `rail-${qid}`],
        4
      )
    );
  };
  railFor("context", -1);
  railFor("evals", 1);

  /* ── THE WORK — the plate that morphs, the name that travels, and the
     rest of it, which withdraws. */
  const namePose = (to: Rect): Pose =>
    toward([CORE.x + 20, CORE.y + 68], [to.x + 16, to.y + 35], FS.answer / FS.name, 1);
  parts.push({
    id: "core",
    group: "core",
    poses: { a: ID, b: ID, c: ID },
    delays: d3(260, 260, 280),
    modules: [{ id: "core", rect: CORE, cut: CORE_CUT, paint: "gold-fill" }],
    marks: [],
    letters: [],
    morph: {
      a: housing(CORE.x, CORE.y, CORE.w, CORE.h, CORE_CUT),
      b: housing(recapB.x, recapB.y, recapB.w, recapB.h, CART.cut),
      c: housing(recapC.x, recapC.y, recapC.w, recapC.h, CART.cut),
    },
  });
  parts.push({
    id: "core-name",
    group: "core-name",
    poses: { a: ID, b: namePose(recapB), c: namePose(recapC) },
    delays: d3(260, 260, 280),
    modules: [],
    marks: [],
    // Its measure is the CARTRIDGE's, in the core's own units: the name rides
    // a uniform scale down to 16.6 and must fit where it lands.
    letters: sans(
      "core.name",
      s.work.name,
      FS.name,
      ((CART.w - 32) * FS.name) / FS.answer,
      CORE.x + 20,
      CORE.y + 68,
      "on-gold",
      1,
      true
    ),
  });
  const pins: CirMark[] = [];
  for (let x = CORE.x + 14; x <= CORE.x + CORE.w - 20; x += 10) {
    if (CORE_PORTS.some((p) => Math.abs(p - x) < 20)) continue;
    pins.push({ kind: "pad", x, y: CORE.y - 7, w: 3, h: 7, tone: "gold" });
    pins.push({ kind: "pad", x, y: CORE.y + CORE.h, w: 3, h: 7, tone: "gold" });
  }
  parts.push({
    id: "core-x",
    group: "core-x",
    poses: {
      a: ID,
      b: { ...namePose(recapB), o: 0 },
      c: { ...namePose(recapC), o: 0 },
    },
    delays: d3(700, 80, 0),
    modules: [],
    marks: [
      {
        kind: "rule",
        x1: CORE.x + 20,
        y1: CORE.y + 90,
        x2: CORE.x + CORE.w - 20,
        y2: CORE.y + 90,
        tone: "on-gold",
      },
      ...pins,
    ],
    letters: [
      mono(
        "core.kicker",
        "The work",
        FS.chrome,
        TRACK.chrome,
        CORE.w - 40,
        CORE.x + 20,
        CORE.y + 34,
        "on-gold-2"
      ),
      mono(
        "core.goodkey",
        "Good looks like",
        FS.chrome,
        TRACK.chrome,
        CORE.w - 40,
        CORE.x + 20,
        CORE.y + 122,
        "on-gold-2"
      ),
      ...sans(
        "core.good",
        s.work.good,
        FS.answer,
        CORE.w - 40,
        CORE.x + 20,
        CORE.y + 150,
        "on-gold"
      ),
    ],
  });

  /* ── b · THE CARTRIDGES — the work's siblings, peeling off it. */
  const names = new Map(s.machine.configs.map((c) => [c.id, c.name]));
  cartB.forEach((seat, j) => {
    if (seat.id === s.work.id) return;
    const r = seat.rect;
    const to = cartC.get(seat.id) ?? r;
    parts.push({
      id: `cart-${seat.id}`,
      group: "cart",
      poses: {
        a: toward(center(r), center(CORE), 0.5, 0),
        b: ID,
        c: shift(to.x - r.x, to.y - r.y),
      },
      delays: d3(0, 460 + j * 60, 260 + j * 40),
      modules: [{ id: `cart-${seat.id}`, rect: r, cut: CART.cut, paint: "gold" }],
      marks: [],
      letters: sans(
        `cart.${seat.id}`,
        names.get(seat.id) ?? seat.id,
        FS.answer,
        CART.w - 32,
        r.x + 16,
        r.y + 35,
        "ink",
        1,
        true
      ),
    });
  });

  /* ── b · THE TEAMS: a seat, a bus down its column, the taps into its
     configurations, and what it is freed for at the foot. */
  const nT = s.people.teams.length;
  s.people.teams.forEach((t, i) => {
    const x = colX(i);
    const seat: Rect = { x, y: INSET, w: COL.w, h: SEAT_H };
    const freed: Rect = { x, y: FREED.y, w: COL.w, h: FREED.h };
    parts.push({
      id: `seat-${t.id}`,
      group: "seat",
      poses: { a: shift(0, -24, 0), b: ID, c: ID },
      delays: d3(0, 720 + i * 80, 0),
      modules: [{ id: `seat-${t.id}`, rect: seat, cut: 12, paint: "green" }],
      marks: [{ kind: "glyph", key: "owner", x: x + COL.w - 38, y: INSET + 16, cell: 3 }],
      letters: [
        ...sans(
          `seat.${t.id}.name`,
          t.name,
          FS.value,
          COL.w - 36 - 40,
          x + 18,
          INSET + 34,
          "green-ink",
          1,
          true
        ),
        mono(
          `seat.${t.id}.hand`,
          t.hand,
          FS.chrome,
          TRACK.chrome,
          COL.w - 36,
          x + 18,
          INSET + 64,
          "ink2"
        ),
      ],
    });
    parts.push({
      id: `freed-${t.id}`,
      group: "freed",
      poses: { a: shift(0, 24, 0), b: ID, c: shift(0, 24, 0) },
      delays: d3(0, 1320 + i * 80, 0),
      modules: [{ id: `freed-${t.id}`, rect: freed, cut: 12, paint: "plate", head: 0 }],
      marks: [],
      letters: [
        mono(
          `freed.${t.id}.key`,
          s.people.freedKey,
          FS.chrome,
          TRACK.chrome,
          COL.w - 36,
          x + 18,
          FREED.y + 32,
          "ink2"
        ),
        ...sans(
          `freed.${t.id}.value`,
          t.freed,
          FS.value,
          COL.w - 36,
          x + 18,
          FREED.y + 64,
          "green-ink",
          1,
          true
        ),
      ],
    });
    const bx = i === nT - 1 ? x + COL.w - BUS_IN : x + BUS_IN;
    wires.push(
      wire(
        `bus-${t.id}`,
        [
          [bx, INSET + SEAT_H],
          [bx, FREED.y],
        ],
        "green",
        on3(false, true, false),
        d3(0, 1040 + i * 80, 0),
        [`seat-${t.id}`, `freed-${t.id}`]
      )
    );
    cartB
      .filter((c) => c.teams.includes(i))
      .forEach((c) => {
        const cy = c.rect.y + c.rect.h / 2;
        const right = c.rect.x > bx;
        const from = right ? bx + 14 : bx - 14;
        const to = right ? c.rect.x : c.rect.x + c.rect.w;
        wires.push(
          wire(
            `tap-${t.id}-${c.id}`,
            [
              [from, cy],
              [to, cy],
            ],
            "gold",
            on3(false, true, false),
            d3(0, 1220, 0),
            [`bus-${t.id}`, c.id === s.work.id ? "core" : `cart-${c.id}`],
            4
          )
        );
      });
  });

  /* ── c · THE LAYER — the studio's AI capability, written once. */
  const chipW = 240;
  const chipGap = 12;
  const chipX0 = LAYER.x + LAYER.w - 20 - 3 * chipW - 2 * chipGap;
  parts.push({
    id: "layer",
    group: "layer",
    poses: { a: SHUT, b: SHUT, c: ID },
    delays: d3(0, 0, 900),
    modules: [
      { id: "layer", rect: LAYER, cut: 16, paint: "gold" },
      ...s.machine.layer.chips.map((_, k) => ({
        id: `layer-chip-${k}`,
        rect: { x: chipX0 + k * (chipW + chipGap), y: LAYER.y + 24, w: chipW, h: 36 },
        cut: 0,
        paint: "well-gold" as const,
      })),
    ],
    marks: [],
    letters: [
      mono(
        "layer.name",
        s.machine.layer.name,
        FS.head,
        TRACK.head,
        chipX0 - LAYER.x - 40,
        LAYER.x + 20,
        LAYER.y + 34,
        "ink"
      ),
      ...sans(
        "layer.line",
        s.machine.layer.line,
        FS.chrome,
        chipX0 - LAYER.x - 40,
        LAYER.x + 20,
        LAYER.y + 64,
        "ink2"
      ),
      ...s.machine.layer.chips.map((chip, k) =>
        mono(
          `layer.chip.${k}`,
          chip,
          FS.chrome,
          TRACK.key,
          chipW - 16,
          chipX0 + k * (chipW + chipGap) + chipW / 2,
          LAYER.y + 47,
          "gold-ink",
          "middle"
        )
      ),
    ],
  });
  cartC.forEach((r, id) => {
    const cx = r.x + r.w / 2;
    wires.push(
      wire(
        `drop-${id}`,
        [
          [cx, r.y + r.h],
          [cx, LAYER.y],
        ],
        "gold",
        on3(false, false, true),
        d3(0, 0, 1160 + configIds.indexOf(id) * 40),
        [id === s.work.id ? "core" : `cart-${id}`, "layer"]
      )
    );
  });

  /* ── c · THE PEOPLE STEER THE LAYER. Each seat drops a thin green run
     through the nearest gap in the row of configurations into the layer:
     the drawing's own answer to "adoption first" — the layer is written and
     steered by the people who do the work, and nothing reaches it except
     through them. Four conductors at pitch 3, so a run fits a 16-unit gap. */
  const rowIds = configIds;
  const gaps = rowIds.slice(1).map((id) => {
    const r = cartC.get(id);
    return r ? r.x - ROW_C.gap / 2 : 0;
  });
  s.people.teams.forEach((t, i) => {
    const cx = colX(i) + COL.w / 2;
    const gx = gaps.reduce(
      (best, g) => (Math.abs(g - cx) < Math.abs(best - cx) ? g : best),
      gaps[0]
    );
    const sgn = Math.sign(gx - cx) || 1;
    const runY = INSET + SEAT_H + 24;
    const pts: Pt[] =
      Math.abs(gx - cx) < 1
        ? [
            [cx, INSET + SEAT_H],
            [cx, LAYER.y],
          ]
        : [
            [cx, INSET + SEAT_H],
            [cx, runY - 6],
            [cx + sgn * 6, runY],
            [gx - sgn * 6, runY],
            [gx, runY + 6],
            [gx, LAYER.y],
          ];
    wires.push({
      ...wire(
        `steer-${t.id}`,
        pts,
        "green",
        on3(false, false, true),
        d3(0, 0, 1250 + i * 60),
        [`seat-${t.id}`, "layer"],
        4
      ),
      pitch: 3,
    });
  });

  /* ── c · THE SOCKETS — what the layer plugs into. */
  const nS = s.machine.sockets.length;
  const sockW = (CIR_VB.w - 2 * INSET - (nS - 1) * SOCKET.gap) / nS;
  s.machine.sockets.forEach((sock, k) => {
    const r: Rect = { x: INSET + k * (sockW + SOCKET.gap), y: SOCKET.y, w: sockW, h: SOCKET.h };
    parts.push({
      id: `socket-${sock.id}`,
      group: "socket",
      poses: { a: shift(0, 24, 0), b: shift(0, 24, 0), c: ID },
      delays: d3(0, 0, 1320 + k * 60),
      modules: [
        {
          id: `socket-${sock.id}`,
          rect: r,
          cut: 12,
          paint: sock.future ? "future" : "plate",
          head: 36,
        },
      ],
      marks: [],
      letters: [
        mono(
          `socket.${sock.id}.key`,
          sock.key,
          FS.key,
          TRACK.key,
          r.w - 28,
          r.x + 14,
          r.y + 24,
          sock.future ? "ink2" : "ink"
        ),
        ...sans(
          `socket.${sock.id}.name`,
          sock.name,
          FS.answer,
          r.w - 28,
          r.x + 14,
          r.y + 64,
          sock.future ? "ink2" : "ink",
          2
        ),
      ],
    });
    const cx = r.x + r.w / 2;
    wires.push(
      wire(
        `plug-${sock.id}`,
        [
          [cx, LAYER.y + LAYER.h],
          [cx, r.y],
        ],
        "gold",
        on3(false, false, true),
        d3(0, 0, 1460 + k * 50),
        ["layer", `socket-${sock.id}`]
      )
    );
  });

  /* The work paints LAST: it is the one object that travels across the
     others, and a traveller that passes under its own siblings reads as a
     layering fault mid-flight. */
  const work = new Set<PartGroup>(["core", "core-name", "core-x"]);
  parts.sort((p, q) => Number(work.has(p.group)) - Number(work.has(q.group)));
  return { vb: { ...CIR_VB }, parts, wires };
}

/** Every lettered string, per part — what the fit test walks. */
export const circuitLettering = (s: CircuitSection) =>
  circuitGeom(s).parts.flatMap((p) => p.letters.map((l) => ({ part: p, letter: l })));
