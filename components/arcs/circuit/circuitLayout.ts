import {
  adv,
  type LetterSpec,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaLetters";
import {
  bend,
  polylineLength,
  type Pt,
} from "@/components/landing/home-v2/services/casefile/map/pda/ribbon";
import type { ArcSectionOf } from "@/lib/arcs/types";

import type { CircuitGlyphKey } from "./circuitGlyphData";

/**
 * circuitLayout — THE CIRCUIT's arithmetic (ADR-133). Pure: no React, no DOM.
 *
 * ONE drawing, THREE states, every object ONE element posed three ways — the
 * configuration TRAVELS (owner: "that center card … needs to travel through
 * those two other sections"). The composition is the Moira workshop's board
 * (one piece of work in the middle, six questions around it, the two the team
 * writes lit) drawn in the proof's R4 material (opaque chamfered plates, a
 * head band, eight-wire ribbons, a ghost die around the work) — the reading
 * the owner called "super clear" on the proof card.
 *
 *   a  TODAY, AND CONFIGURED. Left, the work alone on a plain plate: typed up
 *      by hand. Right, the same work wired: the owner above it on a green
 *      drop, the model, the context and the evaluations to its left, the
 *      connectors and the interface to its right. Two kinds of object — a
 *      lone plate and a wired board — and nothing about today drawn as a gap.
 *   b  THE TEAM OWNS IT. ONE COLUMN headed by the owner: the two plates the
 *      team writes open under it, the three it is given FOLD to their bands
 *      under those, and the work stays where it was. The owner's drop feeds
 *      what the team writes, that feeds the work, and the draft runs back up
 *      to the owner, who sits above the loop.
 *   c  THE LARGER WHOLE. The work shrinks to a chip among the studio's other
 *      workflows, six small circuits in a ring, every one wired to the same
 *      two shared plates at the centre — written once, owned by the team.
 *
 * ⚠ THE DOCTRINE IS THE RECORD (intelligence-architect, thoughtform-strategy):
 * a configuration is one piece of work and five things — what runs it, what
 * it inherits, what it can reach, how much it decides alone, who owns it.
 * Moira's board says it in six plates; the fifth field rides the OWNER's
 * plate as its second line ("it drafts, the PM sends"), as Moira's does. And
 * "evals carry what good looks like", so the bar is the EVALUATIONS' answer
 * and never the card's: the second cut printed it on the work and the owner
 * sent it back.
 *
 * ⚠ A POSE IS `translate(tx, ty) scale(k)` ABOUT THE VIEWBOX ORIGIN on the
 * object's HOME geometry; identity at its home state, where the guard reads.
 * ⚠ THE WORK CHANGES SHAPE (320 × 200 → 200 × 56), so its PLATE morphs on CSS
 * `d` (one `housing()` command structure at every state) while its name rides
 * a uniform scale and the rest of its lettering withdraws.
 * ⚠ FIT IS DECLARED, NOT REVIEWED: every lettered string carries the measure
 * it must fit, and `tests/lib/arc-circuit-fit.test.ts` walks every state.
 * ⚠ FEWER THAN A DOZEN OBJECTS A BEAT, by owner ruling: the first cut of this
 * kind carried forty lettered things in one state and he could not say what
 * the section was about.
 */

export type CircuitState = "a" | "b" | "c";
export const CIRCUIT_STATES: readonly CircuitState[] = ["a", "b", "c"];

export const CIR_VB = { w: 1400, h: 560 } as const;
export const INSET = 24;

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
  | "frame"
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
  /** Shown (1), receded (a fraction) or withdrawn (0). */
  o: number;
  /** Closed on its centre-out aperture (the caption card's, ADR-097 U12). */
  shut?: true;
  /** FOLDED to its head band: the fraction of its height it keeps. A fold
   *  is present and legible, where a recede reads as disabled. */
  fold?: number;
}

export type PartGroup =
  | "bed"
  | "today"
  | "die"
  | "plate"
  | "frame"
  | "core"
  | "core-name"
  | "core-x"
  | "core-pads"
  | "chip"
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
  /** The first module's outline per state — the work's shape change. */
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
  /** Drawn (1), receded (a fraction) or undrawn (0), per state. */
  on: Record<CircuitState, number>;
  delays: Record<CircuitState, number>;
  /** The objects it must land on, for the fit test. */
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
export const monoWidth = (text: string, fs: number, track: number) => text.length * adv(fs, track);
export const sansWidth = (text: string, fs: number) => text.length * SANS_ADV * fs;
export const letterWidth = (l: CirLetter) =>
  l.face === "mono" ? monoWidth(l.text, l.fs, l.track) : sansWidth(l.text, l.fs);

/** The machined housing — ADR-065's TR + BL pair (substrateKit's `housing`,
 *  restated here so the morph's command structure is this file's own). */
export const housing = (x: number, y: number, w: number, h: number, c: number) =>
  `M${x},${y} H${x + w - c} L${x + w},${y + c} V${y + h} H${x + c} L${x},${y + h - c} Z`;

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
  step = 22
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
const at = (tx: number, ty: number, o = 1, k = 1): Pose => ({ tx, ty, k, o });
/** The pose that carries home point `p0` to `p1` at scale `k`. */
const toward = (p0: Pt, p1: Pt, k: number, o: number): Pose => ({
  tx: p1[0] - k * p0[0],
  ty: p1[1] - k * p0[1],
  k,
  o,
});
const d3 = (a: number, b: number, c: number): Record<CircuitState, number> => ({ a, b, c });
const center = (r: Rect): Pt => [r.x + r.w / 2, r.y + r.h / 2];

function wire(
  id: string,
  pts: readonly Pt[],
  paint: CirWire["paint"],
  on: Record<CircuitState, number>,
  delays: Record<CircuitState, number>,
  ends: readonly [string, string],
  wires = 8
): CirWire {
  /* ⚠ `--l` IS PADDED BY THE RIBBON'S WIDTH: an outer conductor runs longer
     than the base path at every bend, and a dash sized to the base leaves
     that conductor's tail painted on an undrawn wire — a stray tick where
     no wire is (found on the still, beside the owner). */
  const len = polylineLength(pts) + wires * 4;
  return { id, pts, wires, pitch: 4, paint, len, on, delays, ends };
}

/** A level stub off one edge, a 45° jog to the target's height, a level run
 *  in — Moira's own trace. `dir` is +1 rightward. */
function jog(x0: number, y0: number, x1: number, y1: number, dir: 1 | -1, stub = 10): Pt[] {
  if (Math.abs(y1 - y0) < 1) {
    return [
      [x0, y0],
      [x1, y1],
    ];
  }
  const a = x0 + dir * stub;
  const b = a + dir * Math.abs(y1 - y0);
  return [
    [x0, y0],
    [a, y0],
    [b, y1],
    [x1, y1],
  ];
}

/* ── The geometry ─────────────────────────────────────────────────────── */

/** ONE WIDTH for the owner, the six plates and the work: Moira's board has
 *  one plate size, and a board whose plates are three sizes reads as three
 *  kinds of thing. */
export const W = 304;

/** State a: the lone plate on the left, the board on the right. */
export const TODAY_CARD: Rect = { x: 34, y: 188, w: 260, h: 200 };
export const BOARD = { x: 330, right: CIR_VB.w - INSET } as const;
export const LEFT_X = 340;
export const RIGHT_X = 1072;
export const CORE: Rect = { x: 708, y: 188, w: W, h: 200 };
export const CORE_CUT = 18;
export const BOARD_CX = CORE.x + CORE.w / 2; // 860
export const OWNER: Rect = { x: CORE.x, y: 24, w: W, h: 116 };
export const PLATE = { w: W, h: 104, band: 30 } as const;
export const LEFT_TOPS = [124, 256, 372] as const; // model · context · evals
export const RIGHT_TOPS = [190, 308] as const; // connectors · interface
/** Where the left column's ribbons meet the work, top to bottom. */
const LEFT_PORTS = [214, 300, 368] as const;
const RIGHT_PORTS = [262, 340] as const;
/** Where the work's name sits on the card — the one line that travels. */
const NAME_DY = 94;

/** What a folded plate keeps: its head band and the rule under it. */
export const FOLD = (PLATE.band + 1) / PLATE.h;

/** State b: TWO COLUMNS (owner: "highlight who owns it; the other elements
 *  … go into the background or collapse under it"). Left, the person's side:
 *  the owner at the head, LARGER than anything else in the beat, and under
 *  it the two plates the team writes, open, in their frame. Right, the
 *  machine's side: the work, and under it the three plates the team is
 *  given, FOLDED to their bands — the model, the data and the tools are set
 *  up once; what it knows and what good looks like can only come from the
 *  team (Moira's leverage beat). */
export const B_OWNER_K = 1.15;
const B_LEFT_CX = 420;
const B_WORK_DX = 120;
const B_TOP = {
  owner: 36,
  context: 214,
  evals: 330,
  model: 412,
  reach: 448,
  interface: 484,
} as const;

/** State c: THE BACKPLANE. Every workflow is a chip carrying its own six
 *  answers as six pads; the two the team writes are gold and wire into the
 *  same two shared bars, which run out to one dashed socket. A bus, where a
 *  is a hub and b a column: three beats, three shapes, one record. */
export const CHIP = { w: 212, h: 84, cut: 10 } as const;
const CHIP_CX = [215, 565, 915] as const;
const CHIP_TOP = 44;
const CHIP_BOTTOM = 432;
export const CTX_BAR: Rect = { x: 40, y: 200, w: 1050, h: 62 };
export const EV_BAR: Rect = { x: 40, y: 290, w: 1050, h: 62 };
export const BAR_BAND = 24;
export const SOCKET: Rect = { x: 1134, y: 228, w: 242, h: 96 };
const chipAt = (i: number): Rect => ({
  x: CHIP_CX[i % 3] - CHIP.w / 2,
  y: i < 3 ? CHIP_TOP : CHIP_BOTTOM,
  w: CHIP.w,
  h: CHIP.h,
});
/** The six pads on a chip, in the questions' order. */
const PAD = 14;
const padRect = (chip: Rect, i: number): Rect => ({
  x: chip.x + 16 + i * (PAD + 8),
  y: chip.y + 52,
  w: PAD,
  h: PAD,
});
const PAD_TONE: Record<string, PadTone> = {
  owner: "green",
  context: "gold",
  evals: "gold",
  model: "ring-dawn",
  reach: "ring-dawn",
  interface: "ring-dawn",
};

export function circuitGeom(s: CircuitSection): CircuitGeom {
  const parts: CirPart[] = [];
  const wires: CirWire[] = [];
  const byId = Object.fromEntries(s.questions.map((q) => [q.id, q])) as Record<
    string,
    (typeof s.questions)[number]
  >;
  const qIds = s.questions.map((q) => q.id);
  const configIds = s.machine.configs.map((c) => c.id);
  const chipOf = new Map<string, Rect>();
  configIds.forEach((id, i) => chipOf.set(id, chipAt(i)));
  const coreC = chipOf.get(s.work.id);
  if (!coreC) throw new Error(`circuit: the work "${s.work.id}" is not one of the workflows`);
  const pads = (chip: Rect): CirMark[] =>
    qIds.map((id, i) => {
      const r = padRect(chip, i);
      return { kind: "pad", x: r.x, y: r.y, w: r.w, h: r.h, tone: PAD_TONE[id] };
    });

  /* ── The bed: the board's dot field; the whole crop's in b and c. */
  parts.push({
    id: "bed",
    group: "bed",
    poses: { a: ID, b: ID, c: ID },
    delays: d3(0, 0, 0),
    modules: [
      {
        id: "bed",
        rect: { x: BOARD.x, y: INSET, w: BOARD.right - BOARD.x, h: CIR_VB.h - 2 * INSET },
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
    delays: d3(0, 400, 0),
    modules: [
      {
        id: "bed-left",
        rect: { x: INSET, y: INSET, w: BOARD.x - INSET, h: CIR_VB.h - 2 * INSET },
        cut: 0,
        paint: "plate",
      },
    ],
    marks: [],
    letters: [],
  });

  /* ── a · TODAY: the work alone, on a plain plate. Neutral, and connected
     to nothing: the absence being drawn is connection, not order. */
  parts.push({
    id: "today",
    group: "today",
    poses: { a: ID, b: SHUT, c: SHUT },
    delays: d3(500, 0, 0),
    modules: [{ id: "today", rect: TODAY_CARD, cut: CORE_CUT, paint: "plate" }],
    marks: [],
    letters: [
      mono(
        "today.kicker",
        "Today",
        FS.chrome,
        TRACK.chrome,
        TODAY_CARD.w - 40,
        TODAY_CARD.x + 20,
        TODAY_CARD.y + 50,
        "ink2"
      ),
      ...sans(
        "today.name",
        s.work.name,
        FS.name,
        TODAY_CARD.w - 40,
        TODAY_CARD.x + 20,
        TODAY_CARD.y + NAME_DY,
        "ink",
        1,
        true
      ),
      ...sans(
        "today.line",
        s.work.today,
        FS.answer,
        TODAY_CARD.w - 40,
        TODAY_CARD.x + 20,
        TODAY_CARD.y + NAME_DY + 38,
        "ink2",
        3
      ),
    ],
  });

  /* ── The ghost die around the work; it rides with the work in b. */
  const die: Rect = { x: CORE.x - 18, y: CORE.y - 16, w: CORE.w + 36, h: CORE.h + 32 };
  parts.push({
    id: "die",
    group: "die",
    poses: { a: ID, b: at(B_WORK_DX, 0), c: HIDE },
    delays: d3(440, 300, 0),
    modules: [{ id: "die", rect: die, cut: 28, paint: "die" }],
    marks: [],
    letters: [],
  });

  /* ── The six plates. Each: a head band with the plate's name and its
     mark, the question under it, this work's answer. The two the team
     writes are gold; the owner is green; the three the team is given are
     the plate. */
  const home = (id: string): Rect => {
    switch (id) {
      case "owner":
        return OWNER;
      case "model":
        return { x: LEFT_X, y: LEFT_TOPS[0], w: PLATE.w, h: PLATE.h };
      case "context":
        return { x: LEFT_X, y: LEFT_TOPS[1], w: PLATE.w, h: PLATE.h };
      case "evals":
        return { x: LEFT_X, y: LEFT_TOPS[2], w: PLATE.w, h: PLATE.h };
      case "reach":
        return { x: RIGHT_X, y: RIGHT_TOPS[0], w: PLATE.w, h: PLATE.h };
      default:
        return { x: RIGHT_X, y: RIGHT_TOPS[1], w: PLATE.w, h: PLATE.h };
    }
  };
  const written = new Set(["context", "evals"]);
  const given = new Set(["model", "reach", "interface"]);
  const coreB: Rect = { ...CORE, x: CORE.x + B_WORK_DX };
  const bLeft = (w: number) => B_LEFT_CX - w / 2;
  const bPose = (id: keyof typeof B_TOP): Pose => {
    const r = home(id);
    if (id === "owner") {
      const k = B_OWNER_K;
      return { tx: bLeft(r.w * k) - k * r.x, ty: B_TOP.owner - k * r.y, k, o: 1 };
    }
    const x = given.has(id) ? coreB.x : bLeft(r.w);
    const p = at(x - r.x, B_TOP[id] - r.y);
    return given.has(id) ? { ...p, fold: FOLD } : p;
  };
  /* The evolution into b, in order: the lone plate closes and the three
     given plates fold and drop under the work; the owner comes across to
     head the person's side and grows; the written pair rises under it; then
     the wiring draws, the owner's drop first and the draft's return last. */
  const bDelay: Record<keyof typeof B_TOP, number> = {
    owner: 420,
    model: 120,
    context: 560,
    evals: 600,
    reach: 180,
    interface: 240,
  };
  const bOwner: Rect = {
    x: bLeft(OWNER.w * B_OWNER_K),
    y: B_TOP.owner,
    w: OWNER.w * B_OWNER_K,
    h: OWNER.h * B_OWNER_K,
  };

  /* ── The frame and tag on the two written plates (Moira's frame). The tag
     hangs on the frame's FLOOR, where nothing is seated against it: on its
     top it printed into the plate above. */
  const cR = home("context");
  const eR = home("evals");
  const frame: Rect = { x: cR.x - 10, y: cR.y - 10, w: cR.w + 20, h: eR.y + eR.h - cR.y + 20 };
  const tagW = monoWidth(s.tag, FS.chrome, TRACK.key) + 24;
  const tag: Rect = { x: frame.x + 12, y: frame.y + frame.h - 13, w: tagW, h: 26 };
  const frameB = at(bLeft(PLATE.w) - cR.x, B_TOP.context - cR.y);
  parts.push({
    id: "frame",
    group: "frame",
    poses: { a: ID, b: frameB, c: HIDE },
    delays: d3(1100, bDelay.context, 0),
    modules: [
      { id: "frame", rect: frame, cut: 0, paint: "frame" },
      { id: "tag", rect: tag, cut: 0, paint: "gold-fill" },
    ],
    marks: [],
    letters: [
      mono("tag", s.tag, FS.chrome, TRACK.key, tagW - 20, tag.x + 10, tag.y + 18, "on-gold"),
    ],
  });

  s.questions.forEach((q, i) => {
    const r = home(q.id);
    const isOwner = q.id === "owner";
    const paint: Paint = isOwner ? "green" : written.has(q.id) ? "gold" : "plate";
    const glyph: CirMark = isOwner
      ? { kind: "person", x: r.x + r.w - 14 - 7 * 3, y: r.y + 4.5, cell: 3 }
      : { kind: "glyph", key: q.id, x: r.x + r.w - 14 - 7 * 3, y: r.y + 4.5, cell: 3 };
    const answer = sans(
      `plate.${q.id}.a`,
      q.answer,
      FS.answer,
      r.w - 28,
      r.x + 14,
      r.y + PLATE.band + 48,
      isOwner ? "green-ink" : "ink",
      1,
      true
    );
    const detail = q.detail
      ? sans(
          `plate.${q.id}.d`,
          q.detail,
          FS.answer,
          r.w - 28,
          r.x + 14,
          r.y + PLATE.band + 48 + 22,
          "ink2"
        )
      : [];
    /* c: each plate flies into ITS OWN PAD on the work's chip — the board
       compressed into the chip's six answers, so the leitmotif arrives in
       the network still carrying its configuration. */
    const pad = padRect(coreC, i);
    parts.push({
      id: `plate-${q.id}`,
      group: "plate",
      poses: {
        a: ID,
        b: bPose(q.id),
        c: {
          ...toward(center(r), center(pad), 0.06, 0),
          ...(given.has(q.id) ? { fold: FOLD } : {}),
        },
      },
      delays: d3(560 + i * 70, bDelay[q.id], 120 + i * 40),
      modules: [{ id: `plate-${q.id}`, rect: r, cut: 12, paint, head: PLATE.band }],
      marks: [glyph],
      letters: [
        mono(
          `plate.${q.id}.key`,
          q.key,
          FS.chrome,
          TRACK.chrome,
          r.w - 28 - 7 * 3 - 12,
          r.x + 14,
          r.y + 20,
          "ink"
        ),
        ...sans(
          `plate.${q.id}.q`,
          q.question,
          FS.chrome,
          r.w - 28,
          r.x + 14,
          r.y + PLATE.band + 22,
          "ink2"
        ),
        ...answer,
        ...detail,
      ],
    });
  });

  /* ── a · the ribbons to the work: the owner's green drop from above; the
     left column's gold runs in; the right column's out. */
  const onA = d3(1, 0, 0);
  wires.push(
    wire(
      "w-owner",
      [
        [BOARD_CX, OWNER.y + OWNER.h],
        [BOARD_CX, CORE.y],
      ],
      "green",
      onA,
      d3(760, 0, 0),
      ["plate-owner", "core"]
    )
  );
  (["model", "context", "evals"] as const).forEach((id, i) => {
    const r = home(id);
    wires.push(
      wire(
        `w-${id}`,
        jog(r.x + r.w, r.y + r.h / 2, CORE.x, LEFT_PORTS[i], 1, 4),
        "gold",
        onA,
        d3(820 + i * 60, 0, 0),
        [`plate-${id}`, "core"]
      )
    );
  });
  (["reach", "interface"] as const).forEach((id, i) => {
    const r = home(id);
    wires.push(
      wire(
        `w-${id}`,
        jog(r.x, r.y + r.h / 2, CORE.x + CORE.w, RIGHT_PORTS[i], -1),
        "gold",
        onA,
        d3(900 + i * 60, 0, 0),
        [`plate-${id}`, "core"]
      )
    );
  });

  /* ── b · the wiring of the two sides, in b's own coordinates (wires are
     not posed): the owner's green drop onto what the team writes; the two
     written plates across into the work; one short stub from the work down
     into its folded three; and the draft back UP to the owner, who sits
     above the loop. */
  const frameTopB = frame.y + frameB.ty;
  const pairR = bLeft(PLATE.w) + PLATE.w;
  wires.push(
    wire(
      "b-owner",
      [
        [B_LEFT_CX, bOwner.y + bOwner.h],
        [B_LEFT_CX, frameTopB],
      ],
      "green",
      d3(0, 1, 0),
      d3(0, 1400, 0),
      ["plate-owner", "frame"]
    )
  );
  (["context", "evals"] as const).forEach((id, i) => {
    const y = B_TOP[id] + PLATE.h / 2;
    const port = id === "context" ? 250 : 350;
    wires.push(
      wire(
        `b-${id}`,
        jog(pairR, y, coreB.x, port, 1, 120),
        "gold",
        d3(0, 1, 0),
        d3(0, 1560 + i * 90, 0),
        [`plate-${id}`, "core"]
      )
    );
  });
  wires.push(
    wire(
      "b-given",
      [
        [coreB.x + coreB.w / 2, coreB.y + coreB.h],
        [coreB.x + coreB.w / 2, B_TOP.model],
      ],
      "gold",
      d3(0, 0.55, 0),
      d3(0, 1760, 0),
      ["core", "plate-model"],
      4
    )
  );
  const retX = coreB.x + coreB.w - 48;
  const retY = bOwner.y + bOwner.h / 2;
  wires.push(
    wire(
      "b-return",
      bend(retX, coreB.y, bOwner.x + bOwner.w, retY, "v", 12),
      "green",
      d3(0, 1, 0),
      d3(0, 1900, 0),
      ["core", "plate-owner"],
      4
    )
  );

  /* ── THE WORK: the plate that morphs, the name that travels, the rest
     that withdraws. ⚠ THE CARD CARRIES THE WORK AND NOTHING ELSE: its name
     and when it runs. What good looks like is the EVALUATIONS' answer
     (doctrine: "evals carry what good looks like"); printed on the card it
     is said twice, on the wrong object. */
  parts.push({
    id: "core",
    group: "core",
    poses: { a: ID, b: ID, c: ID },
    delays: d3(240, 300, 260),
    modules: [{ id: "core", rect: CORE, cut: CORE_CUT, paint: "gold" }],
    marks: [],
    letters: [],
    morph: {
      a: housing(CORE.x, CORE.y, CORE.w, CORE.h, CORE_CUT),
      b: housing(coreB.x, coreB.y, coreB.w, coreB.h, CORE_CUT),
      c: housing(coreC.x, coreC.y, coreC.w, coreC.h, CHIP.cut),
    },
  });
  const namePose = (to: Rect, k: number): Pose =>
    toward([CORE.x + 20, CORE.y + NAME_DY], [to.x + 16, to.y + 34], k, 1);
  parts.push({
    id: "core-name",
    group: "core-name",
    poses: { a: ID, b: at(B_WORK_DX, 0), c: namePose(coreC, FS.answer / FS.name) },
    delays: d3(240, 300, 260),
    modules: [],
    marks: [],
    letters: sans(
      "core.name",
      s.work.name,
      FS.name,
      ((CHIP.w - 32) * FS.name) / FS.answer,
      CORE.x + 20,
      CORE.y + NAME_DY,
      "ink",
      1,
      true
    ),
  });
  parts.push({
    id: "core-x",
    group: "core-x",
    poses: {
      a: ID,
      b: at(B_WORK_DX, 0),
      c: { ...namePose(coreC, FS.answer / FS.name), o: 0 },
    },
    delays: d3(600, 300, 0),
    modules: [],
    marks: [
      {
        kind: "rule",
        x1: CORE.x + 20,
        y1: CORE.y + NAME_DY + 22,
        x2: CORE.x + CORE.w - 20,
        y2: CORE.y + NAME_DY + 22,
        tone: "line",
      },
    ],
    letters: [
      mono(
        "core.kicker",
        "The work",
        FS.chrome,
        TRACK.chrome,
        CORE.w - 40,
        CORE.x + 20,
        CORE.y + 50,
        "gold-ink"
      ),
      ...sans(
        "core.when",
        s.work.when,
        FS.answer,
        CORE.w - 40,
        CORE.x + 20,
        CORE.y + NAME_DY + 54,
        "ink2"
      ),
    ],
  });
  /* The work's own six pads, arriving on its chip as its six plates land.
     ⚠ AFTER THE MORPH ENDS (260 + 900ms): earlier, the pads printed at the
     chip's seat while the card was still in flight beside it. */
  parts.push({
    id: "core-pads",
    group: "core-pads",
    poses: { a: HIDE, b: HIDE, c: ID },
    delays: d3(0, 0, 1180),
    modules: [],
    marks: pads(coreC),
    letters: [],
  });

  /* ── c · THE OTHER WORKFLOWS, each a chip with its own six pads; the two
     shared bars they all wire into; the one socket at the bars' end. */
  const names = new Map(s.machine.configs.map((c) => [c.id, c.name]));
  configIds.forEach((id, i) => {
    if (id === s.work.id) return;
    const r = chipOf.get(id) ?? chipAt(i);
    const from = toward(center(r), center(CORE), 0.4, 0);
    parts.push({
      id: `chip-${id}`,
      group: "chip",
      poses: { a: from, b: from, c: ID },
      delays: d3(0, 0, 420 + i * 60),
      modules: [{ id: `chip-${id}`, rect: r, cut: CHIP.cut, paint: "gold" }],
      marks: pads(r),
      letters: sans(
        `chip.${id}`,
        names.get(id) ?? id,
        FS.answer,
        CHIP.w - 32,
        r.x + 16,
        r.y + 34,
        "ink",
        1,
        true
      ),
    });
  });
  const bar = (
    id: string,
    part: string,
    r: Rect,
    key: string,
    line: string,
    delay: number
  ): CirPart => ({
    id: part,
    group: "layer",
    poses: { a: SHUT, b: SHUT, c: ID },
    delays: d3(0, 0, delay),
    modules: [{ id, rect: r, cut: 12, paint: "gold", head: BAR_BAND }],
    marks: [],
    letters: [
      mono(`${part}.key`, key, FS.chrome, TRACK.chrome, 360, r.x + 14, r.y + 17, "gold-ink"),
      ...sans(`${part}.line`, line, FS.answer, 560, r.x + 14, r.y + BAR_BAND + 26, "ink", 1, true),
    ],
  });
  parts.push(
    bar(
      "shared-context",
      "layer",
      CTX_BAR,
      byId.context?.key ?? "The context",
      s.machine.layer.context,
      700
    ),
    bar(
      "shared-evals",
      "layer-ev",
      EV_BAR,
      byId.evals?.key ?? "The evaluations",
      s.machine.layer.evals,
      780
    )
  );
  /* Every chip's two gold pads tap the two bars: a top chip drops into the
     context and on, behind it, into the evaluations; a bottom chip rises
     into the evaluations and on into the context. */
  const ctxI = qIds.indexOf("context");
  const evI = qIds.indexOf("evals");
  configIds.forEach((id, i) => {
    const r = chipOf.get(id) ?? chipAt(i);
    const top = r.y < CTX_BAR.y;
    const end = id === s.work.id ? "core" : `chip-${id}`;
    const px = (k: number) => padRect(r, k).x + PAD / 2;
    const y0 = top ? r.y + r.h : r.y;
    const ctxY = top ? CTX_BAR.y : CTX_BAR.y + CTX_BAR.h;
    const evY = top ? EV_BAR.y : EV_BAR.y + EV_BAR.h;
    wires.push(
      wire(
        `c-${id}-ctx`,
        [
          [px(ctxI), y0],
          [px(ctxI), ctxY],
        ],
        "gold",
        d3(0, 0, 1),
        d3(0, 0, 980 + i * 50),
        [end, "layer"],
        2
      ),
      wire(
        `c-${id}-ev`,
        [
          [px(evI), y0],
          [px(evI), evY],
        ],
        "gold",
        d3(0, 0, 1),
        d3(0, 0, 1010 + i * 50),
        [end, "layer-ev"],
        2
      )
    );
  });
  // The socket: at the bars' end, dashed — a system that does not exist yet.
  parts.push({
    id: "socket",
    group: "socket",
    poses: { a: at(24, 0, 0), b: at(24, 0, 0), c: ID },
    delays: d3(0, 0, 1300),
    modules: [{ id: "socket", rect: SOCKET, cut: 12, paint: "future", head: 26 }],
    marks: [],
    letters: [
      mono(
        "socket.key",
        s.machine.socket.key,
        FS.chrome,
        TRACK.chrome,
        SOCKET.w - 28,
        SOCKET.x + 14,
        SOCKET.y + 18,
        "ink2"
      ),
      ...sans(
        "socket.name",
        s.machine.socket.name,
        FS.answer,
        // Seventeen characters a line, so the name breaks as a phrase
        // ("a brand system / for all marketing"), not after "all".
        160,
        SOCKET.x + 14,
        SOCKET.y + 52,
        "ink2",
        2
      ),
    ],
  });
  const seamY = (CTX_BAR.y + CTX_BAR.h + EV_BAR.y) / 2;
  wires.push(
    wire(
      "c-socket",
      [
        [CTX_BAR.x + CTX_BAR.w, seamY],
        [SOCKET.x, seamY],
      ],
      "gold",
      d3(0, 0, 1),
      d3(0, 0, 1250),
      ["layer", "socket"]
    )
  );

  /* The work paints LAST: it is the one object that travels across the
     others, and a traveller under its own siblings reads as a layering
     fault mid-flight. */
  const work = new Set<PartGroup>(["core", "core-name", "core-x", "core-pads"]);
  parts.sort((p, q) => Number(work.has(p.group)) - Number(work.has(q.group)));
  return { vb: { ...CIR_VB }, parts, wires };
}

/** Every lettered string, per part — what the fit test walks. */
export const circuitLettering = (s: CircuitSection) =>
  circuitGeom(s).parts.flatMap((p) => p.letters.map((l) => ({ part: p, letter: l })));
