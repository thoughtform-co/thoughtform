import {
  adv,
  type LetterSpec,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaLetters";
import {
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
 *      drop, the model, the context and the evaluations to its left, what it
 *      reaches and where you meet it to its right. Two kinds of object — a
 *      lone plate and a wired board — and nothing about today drawn as a gap.
 *   b  THE TEAM OWNS IT. The lone plate closes; the owner and the two written
 *      plates come forward and the rest recedes: the owner's bus feeds what
 *      the team writes, and what the team writes feeds the work.
 *   c  THE LARGER WHOLE. The work shrinks to a chip among the studio's other
 *      workflows, six small circuits in a ring, every one wired to the same
 *      two shared plates at the centre — written once, owned by the team.
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
  return { id, pts, wires, pitch: 4, paint, len: polylineLength(pts), on, delays, ends };
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

/** State a: the lone plate on the left, the board on the right. */
export const TODAY_COL = { x: INSET, w: 376 } as const;
export const BOARD = { x: 440, right: CIR_VB.w - INSET } as const;
export const BOARD_CX = (BOARD.x + BOARD.right) / 2; // 908
/** State b centres the board in the crop once the lone plate has closed. */
export const B_SHIFT = CIR_VB.w / 2 - BOARD_CX; // -208

export const CORE: Rect = { x: BOARD_CX - 150, y: 188, w: 300, h: 200 };
export const CORE_CUT = 18;
export const TODAY_CARD: Rect = { x: TODAY_COL.x + 38, y: CORE.y, w: 300, h: CORE.h };
export const OWNER: Rect = { x: BOARD_CX - 150, y: 24, w: 300, h: 92 };
export const PLATE = { w: 248, h: 96, band: 30 } as const;
export const LEFT_X = BOARD.x + 10; // 450
export const RIGHT_X = BOARD.right - 10 - PLATE.w; // 1118
export const LEFT_TOPS = [116, 252, 372] as const; // model · context · evals
export const RIGHT_TOPS = [190, 310] as const; // reach · interface
/** Where the left column's ribbons meet the work, top to bottom. */
const LEFT_PORTS = [220, 296, 364] as const;
const RIGHT_PORTS = [262, 330] as const;

/** State c: six chips in a ring around the two shared plates. */
export const CHIP = { w: 200, h: 56, cut: 10 } as const;
export const SHARED: Rect = { x: 540, y: 224, w: 320, h: 66 };
export const SHARED_BAND = 24;
const RING: readonly Rect[] = [
  { x: 300, y: 64, w: CHIP.w, h: CHIP.h },
  { x: 900, y: 64, w: CHIP.w, h: CHIP.h },
  { x: 120, y: 258, w: CHIP.w, h: CHIP.h },
  { x: 1080, y: 258, w: CHIP.w, h: CHIP.h },
  { x: 300, y: 436, w: CHIP.w, h: CHIP.h },
  { x: 900, y: 436, w: CHIP.w, h: CHIP.h },
];

export function circuitGeom(s: CircuitSection): CircuitGeom {
  const parts: CirPart[] = [];
  const wires: CirWire[] = [];
  const byId = Object.fromEntries(s.questions.map((q) => [q.id, q])) as Record<
    string,
    (typeof s.questions)[number]
  >;
  const configIds = s.machine.configs.map((c) => c.id);
  const ringOf = new Map<string, Rect>();
  configIds.forEach((id, i) => ringOf.set(id, RING[i % RING.length]));
  const coreC = ringOf.get(s.work.id);
  if (!coreC) throw new Error(`circuit: the work "${s.work.id}" is not one of the workflows`);

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
        TODAY_CARD.y + 34,
        "ink2"
      ),
      ...sans(
        "today.name",
        s.work.name,
        FS.name,
        TODAY_CARD.w - 40,
        TODAY_CARD.x + 20,
        TODAY_CARD.y + 74,
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
        TODAY_CARD.y + 110,
        "ink2",
        3
      ),
    ],
  });

  /* ── The ghost die around the work, and its vias. */
  const die: Rect = { x: CORE.x - 18, y: CORE.y - 16, w: CORE.w + 36, h: CORE.h + 32 };
  const vias: CirMark[] = [];
  for (const [sx, sy] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ] as const) {
    const cx = sx < 0 ? die.x - 14 : die.x + die.w + 14;
    const cy = sy < 0 ? die.y + 10 : die.y + die.h - 10;
    vias.push({ kind: "via", cx, cy, r: 2.6 });
    vias.push({ kind: "via", cx, cy: cy - sy * 12, r: 2.6 });
  }
  parts.push({
    id: "die",
    group: "die",
    poses: { a: ID, b: at(B_SHIFT, 0), c: HIDE },
    delays: d3(440, 200, 0),
    modules: [{ id: "die", rect: die, cut: 28, paint: "die" }],
    marks: vias,
    letters: [],
  });

  /* ── The six plates. Each: a head band with the plate's name, the
     question under it, this work's answer. The two the team writes are
     gold; the owner is green; the other three are the plate. */
  const plateRect = (id: string): Rect => {
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
  /* State b re-seats the left column: the owner comes down to head it, the
     two written plates follow, and the model joins the right column's foot
     — so the team and what it writes are one lit column and everything the
     work merely runs on is the other, receded. */
  const B_LEFT_TOPS: Record<string, number> = { owner: 96, context: 216, evals: 336 };
  const B_COL_X = LEFT_X - 20;
  const B_RIGHT: Record<string, Rect> = {
    reach: { x: RIGHT_X, y: 170, w: PLATE.w, h: PLATE.h },
    interface: { x: RIGHT_X, y: 278, w: PLATE.w, h: PLATE.h },
    model: { x: RIGHT_X, y: 380, w: PLATE.w, h: PLATE.h },
  };
  const B_RIGHT_PORTS = [262, 330, 380] as const;
  const written = new Set(["context", "evals"]);
  const bRect = (id: string): Rect =>
    id in B_LEFT_TOPS
      ? { x: B_COL_X, y: B_LEFT_TOPS[id], w: OWNER.w, h: id === "owner" ? OWNER.h : PLATE.h }
      : B_RIGHT[id];
  const bPose = (id: string): Pose => {
    const home = plateRect(id);
    const to = bRect(id);
    const lit = id === "owner" || written.has(id);
    // The left column keeps its width in b (the owner's plate is wider than
    // a question plate); a pose is a translate, so the owner lands at the
    // column's x and the written plates under its left edge.
    return at(B_SHIFT + to.x - home.x, to.y - home.y, lit ? 1 : 0.32);
  };

  /* ── The frame and tag on the two written plates (Moira's frame). */
  const cR = plateRect("context");
  const eR = plateRect("evals");
  const frame: Rect = { x: cR.x - 10, y: cR.y - 10, w: cR.w + 20, h: eR.y + eR.h - cR.y + 20 };
  const tagW = monoWidth(s.tag, FS.chrome, TRACK.key) + 24;
  parts.push({
    id: "frame",
    group: "frame",
    poses: { a: ID, b: at(B_SHIFT - 20, B_LEFT_TOPS.context - cR.y), c: HIDE },
    delays: d3(1100, 600, 0),
    modules: [
      { id: "frame", rect: frame, cut: 0, paint: "frame" },
      {
        id: "tag",
        rect: { x: frame.x + 12, y: frame.y - 16, w: tagW, h: 26 },
        cut: 0,
        paint: "gold-fill",
      },
    ],
    marks: [],
    letters: [
      mono("tag", s.tag, FS.chrome, TRACK.key, tagW - 20, frame.x + 22, frame.y + 2, "on-gold"),
    ],
  });

  s.questions.forEach((q, i) => {
    const r = plateRect(q.id);
    const paint: Paint = q.id === "owner" ? "green" : written.has(q.id) ? "gold" : "plate";
    const answerInk: Ink = q.id === "owner" ? "green-ink" : "ink";
    parts.push({
      id: `plate-${q.id}`,
      group: "plate",
      poses: { a: ID, b: bPose(q.id), c: toward(center(r), center(coreC), 0.3, 0) },
      delays: d3(560 + i * 70, q.id === "owner" ? 0 : written.has(q.id) ? 520 : 200, 0),
      modules: [{ id: `plate-${q.id}`, rect: r, cut: 12, paint, head: PLATE.band }],
      marks: [],
      letters: [
        mono(
          `plate.${q.id}.key`,
          q.key,
          FS.chrome,
          TRACK.chrome,
          r.w - 28,
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
        ...sans(
          `plate.${q.id}.a`,
          q.answer,
          FS.answer,
          r.w - 28,
          r.x + 14,
          r.y + PLATE.band + 48,
          answerInk,
          1,
          true
        ),
      ],
    });
  });

  /* ── Their ribbons to the work: the owner's green drop from above; the
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
    const r = plateRect(id);
    wires.push(
      wire(
        `w-${id}`,
        jog(r.x + r.w, r.y + r.h / 2, CORE.x, LEFT_PORTS[i], 1, 4),
        "gold",
        onA,
        d3(820 + i * 60, written.has(id) ? 700 : 200, 0),
        [`plate-${id}`, "core"]
      )
    );
  });
  (["reach", "interface"] as const).forEach((id, i) => {
    const r = plateRect(id);
    wires.push(
      wire(
        `w-${id}`,
        jog(r.x, r.y + r.h / 2, CORE.x + CORE.w, RIGHT_PORTS[i], -1),
        "gold",
        onA,
        d3(900 + i * 60, 200, 0),
        [`plate-${id}`, "core"]
      )
    );
  });

  /* ── THE WORK: the plate that morphs, the name that travels, the rest
     that withdraws. */
  const coreB: Rect = { x: CORE.x + B_SHIFT, y: CORE.y, w: CORE.w, h: CORE.h };
  const namePose = (to: Rect, k: number): Pose =>
    toward([CORE.x + 20, CORE.y + 74], [to.x + 16, to.y + 36], k, 1);
  parts.push({
    id: "core",
    group: "core",
    poses: { a: ID, b: ID, c: ID },
    delays: d3(240, 240, 260),
    modules: [{ id: "core", rect: CORE, cut: CORE_CUT, paint: "gold" }],
    marks: [],
    letters: [],
    morph: {
      a: housing(CORE.x, CORE.y, CORE.w, CORE.h, CORE_CUT),
      b: housing(coreB.x, coreB.y, coreB.w, coreB.h, CORE_CUT),
      c: housing(coreC.x, coreC.y, coreC.w, coreC.h, CHIP.cut),
    },
  });
  parts.push({
    id: "core-name",
    group: "core-name",
    poses: { a: ID, b: at(B_SHIFT, 0), c: namePose(coreC, FS.answer / FS.name) },
    delays: d3(240, 240, 260),
    modules: [],
    marks: [],
    letters: sans(
      "core.name",
      s.work.name,
      FS.name,
      ((CHIP.w - 32) * FS.name) / FS.answer,
      CORE.x + 20,
      CORE.y + 74,
      "ink",
      1,
      true
    ),
  });
  parts.push({
    id: "core-x",
    group: "core-x",
    poses: { a: ID, b: at(B_SHIFT, 0), c: { ...namePose(coreC, FS.answer / FS.name), o: 0 } },
    delays: d3(600, 240, 0),
    modules: [],
    marks: [
      {
        kind: "rule",
        x1: CORE.x + 20,
        y1: CORE.y + 96,
        x2: CORE.x + CORE.w - 20,
        y2: CORE.y + 96,
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
        CORE.y + 34,
        "gold-ink"
      ),
      mono(
        "core.goodkey",
        "Good looks like",
        FS.chrome,
        TRACK.chrome,
        CORE.w - 40,
        CORE.x + 20,
        CORE.y + 126,
        "gold-ink"
      ),
      ...sans(
        "core.good",
        s.work.good,
        FS.answer,
        CORE.w - 40,
        CORE.x + 20,
        CORE.y + 154,
        "ink",
        2
      ),
    ],
  });

  /* ── b · THE TEAM'S BUS: the owner's plate feeds the two written plates,
     under them (an opaque plate hides a wire's passage, R4's order), and
     those feed the work. Drawn in b's own coordinates: the wires are not
     posed, so each state's wires are their own. */
  const bOwner = { x: B_COL_X + B_SHIFT, y: B_LEFT_TOPS.owner, w: OWNER.w, h: OWNER.h };
  const bx = bOwner.x + 30;
  wires.push(
    wire(
      "b-bus",
      [
        [bx, bOwner.y + bOwner.h],
        [bx, B_LEFT_TOPS.evals + PLATE.h / 2],
      ],
      "green",
      d3(0, 1, 0),
      d3(0, 380, 0),
      ["plate-owner", "plate-evals"]
    )
  );
  (["context", "evals"] as const).forEach((id, i) => {
    const y = B_LEFT_TOPS[id] + PLATE.h / 2;
    wires.push(
      wire(
        `b-${id}`,
        jog(B_COL_X + B_SHIFT + PLATE.w, y, coreB.x, LEFT_PORTS[i + 1], 1),
        "gold",
        d3(0, 1, 0),
        d3(0, 900 + i * 120, 0),
        [`plate-${id}`, "core"]
      )
    );
  });
  (["reach", "interface", "model"] as const).forEach((id, i) => {
    const r = B_RIGHT[id];
    wires.push(
      wire(
        `b-${id}`,
        jog(r.x + B_SHIFT, r.y + r.h / 2, coreB.x + coreB.w, B_RIGHT_PORTS[i], -1),
        "gold",
        d3(0, 0.32, 0),
        d3(0, 200, 0),
        [`plate-${id}`, "core"]
      )
    );
  });

  /* ── c · THE OTHER WORKFLOWS, chips in the ring; the two shared plates
     at the centre; the one socket outside. */
  const names = new Map(s.machine.configs.map((c) => [c.id, c.name]));
  configIds.forEach((id, i) => {
    if (id === s.work.id) return;
    const r = ringOf.get(id) ?? RING[i];
    parts.push({
      id: `chip-${id}`,
      group: "chip",
      poses: {
        a: toward(center(r), center(CORE), 0.4, 0),
        b: toward(center(r), center(coreB), 0.4, 0),
        c: ID,
      },
      delays: d3(0, 0, 420 + i * 60),
      modules: [{ id: `chip-${id}`, rect: r, cut: CHIP.cut, paint: "gold" }],
      marks: [],
      letters: sans(
        `chip.${id}`,
        names.get(id) ?? id,
        FS.answer,
        CHIP.w - 32,
        r.x + 16,
        r.y + 36,
        "ink",
        1,
        true
      ),
    });
  });
  const ctxR: Rect = { ...SHARED };
  const evR: Rect = { ...SHARED, y: SHARED.y + SHARED.h + 14 };
  parts.push({
    id: "layer",
    group: "layer",
    poses: { a: SHUT, b: SHUT, c: ID },
    delays: d3(0, 0, 800),
    modules: [{ id: "shared-context", rect: ctxR, cut: 10, paint: "gold", head: SHARED_BAND }],
    marks: [],
    letters: [
      mono(
        "layer.ctx.key",
        byId.context?.key ?? "The context",
        FS.chrome,
        TRACK.chrome,
        ctxR.w - 28,
        ctxR.x + 14,
        ctxR.y + 17,
        "gold-ink"
      ),
      ...sans(
        "layer.ctx",
        s.machine.layer.context,
        FS.chrome,
        ctxR.w - 28,
        ctxR.x + 14,
        ctxR.y + SHARED_BAND + 26,
        "ink",
        1,
        true
      ),
    ],
  });
  parts.push({
    id: "layer-ev",
    group: "layer",
    poses: { a: SHUT, b: SHUT, c: ID },
    delays: d3(0, 0, 900),
    modules: [{ id: "shared-evals", rect: evR, cut: 10, paint: "gold", head: SHARED_BAND }],
    marks: [],
    letters: [
      mono(
        "layer.ev.key",
        byId.evals?.key ?? "The evaluations",
        FS.chrome,
        TRACK.chrome,
        evR.w - 28,
        evR.x + 14,
        evR.y + 17,
        "gold-ink"
      ),
      ...sans(
        "layer.ev",
        s.machine.layer.evals,
        FS.chrome,
        evR.w - 28,
        evR.x + 14,
        evR.y + SHARED_BAND + 26,
        "ink",
        1,
        true
      ),
    ],
  });
  // Every chip's two taps into the shared pair, from the ring.
  configIds.forEach((id, i) => {
    const r = ringOf.get(id) ?? RING[i];
    const [cx, cy] = center(r);
    const left = cx < SHARED.x;
    const x0 = left ? r.x + r.w : r.x;
    const x1 = left ? SHARED.x : SHARED.x + SHARED.w;
    const dir: 1 | -1 = left ? 1 : -1;
    const end = id === s.work.id ? "core" : `chip-${id}`;
    // The top row into the context, the bottom row into the evaluations,
    // the middle row level into the seam between the two.
    const row = cy < SHARED.y ? "top" : cy > evR.y + evR.h ? "bottom" : "mid";
    const ty =
      row === "top"
        ? ctxR.y + ctxR.h / 2
        : row === "bottom"
          ? evR.y + evR.h / 2
          : (ctxR.y + ctxR.h + evR.y) / 2;
    const plate = row === "bottom" ? "layer-ev" : "layer";
    wires.push(
      wire(
        `c-${id}`,
        jog(x0, cy, x1, ty, dir, 8),
        "gold",
        d3(0, 0, 1),
        d3(0, 0, 900 + i * 40),
        [end, plate],
        4
      )
    );
  });
  // The socket: below the centre, dashed — a system that does not exist yet.
  const sock: Rect = { x: 530, y: 470, w: 340, h: 66 };
  parts.push({
    id: "socket",
    group: "socket",
    poses: { a: at(0, 24, 0), b: at(0, 24, 0), c: ID },
    delays: d3(0, 0, 1300),
    modules: [{ id: "socket", rect: sock, cut: 10, paint: "future", head: 26 }],
    marks: [],
    letters: [
      mono(
        "socket.key",
        s.machine.socket.key,
        FS.chrome,
        TRACK.chrome,
        sock.w - 28,
        sock.x + 14,
        sock.y + 18,
        "ink2"
      ),
      ...sans(
        "socket.name",
        s.machine.socket.name,
        FS.answer,
        sock.w - 28,
        sock.x + 14,
        sock.y + 52,
        "ink2"
      ),
    ],
  });
  wires.push(
    wire(
      "c-socket",
      [
        [SHARED.x + SHARED.w / 2, evR.y + evR.h],
        [SHARED.x + SHARED.w / 2, sock.y],
      ],
      "gold",
      d3(0, 0, 1),
      d3(0, 0, 1250),
      ["layer-ev", "socket"],
      4
    )
  );

  /* The work paints LAST: it is the one object that travels across the
     others, and a traveller under its own siblings reads as a layering
     fault mid-flight. */
  const work = new Set<PartGroup>(["core", "core-name", "core-x"]);
  parts.sort((p, q) => Number(work.has(p.group)) - Number(work.has(q.group)));
  return { vb: { ...CIR_VB }, parts, wires };
}

/** Every lettered string, per part — what the fit test walks. */
export const circuitLettering = (s: CircuitSection) =>
  circuitGeom(s).parts.flatMap((p) => p.letters.map((l) => ({ part: p, letter: l })));
