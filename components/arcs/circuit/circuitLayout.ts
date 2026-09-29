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
 * circuitLayout — THE CIRCUIT's arithmetic (ADR-133 U2). Pure: no React, no DOM.
 *
 * ONE LAYER, EVERY WORKFLOW, AS A MAP. Each of the studio's workflows is a
 * small configuration in the restored board's own shape (ADR-100: the owner
 * above, the context to one side, the work at the centre, where it runs to the
 * other, where it scales below), lettered with its NAME ALONE (owner,
 * 2026-09-29: "I don't think we should see all the texts of the smaller
 * panels … it should just become a high-level map of different nodes"). Three
 * down each side; every one's context plate faces the middle and is wired
 * into the MARKETING OS at the centre (U2, owner: "the center card should have
 * a different type of shape and really represent that marketing OS"), a
 * twelve-sided plate, which plugs, dashed, into the brand system that does not
 * exist yet.
 *
 * ⚠ THE PRIMITIVES ARE SHARED WITH THE CREW (`crewLayout.ts`): the plate
 * paints, the letters, the ribbons and the pose record. ADR-133's first two
 * cuts posed this drawing three ways in a pinned scene; U2 retired the scene,
 * so every part here rests at identity in all three states and the figure is
 * stamped `data-cir-state="a"`, exactly as the crew's is.
 * ⚠ THE LEFT COLUMN IS THE RIGHT COLUMN MIRRORED about the centre, so the gold
 * context plate always faces the shared layer. What mirrors is the SEATING of
 * the blank side plates, never a housing: every cut stays on the lawful TR +
 * BL diagonal (ADR-065).
 * ⚠ FIT IS DECLARED, NOT REVIEWED: every lettered string carries the measure
 * it must fit, and `tests/lib/arc-circuit-fit.test.ts` walks them.
 */

export type CircuitState = "a" | "b" | "c";
export const CIRCUIT_STATES: readonly CircuitState[] = ["a", "b", "c"];

export const CIR_VB = { w: 1400, h: 620 } as const;
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
  /** `"tr"`: the TOP-RIGHT cut alone (`band`), the board chip's silhouette —
   *  the card every configuration's work is drawn as (ADR-100 U4). */
  notch?: "tr";
  /** `"dodecagon"`: a twelve-sided plate inscribed in `rect` (a square), a
   *  vertex at each cardinal — the one object on the map that is not a card. */
  shape?: "dodecagon";
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
const d3 = (a: number, b: number, c: number): Record<CircuitState, number> => ({ a, b, c });

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

/** One small configuration: the work's card at the centre, a plate on each
 *  side, the owner above and where it scales below — the restored board's
 *  cross. ⚠ THE CARD IS THE BOARD'S OWN CARD (owner, 2026-09-29: "we need to
 *  have the exact same cards … all at the same height"): 264 × 104, the
 *  top-right cut alone, the gold wash, the name in mono caps at the board's
 *  name rung over one sans line at its value rung. Both drawings are 1400
 *  units across one text band, so the same units paint the same pixels. The
 *  plates around it keep their size ("the smaller cards around it are fine"). */
export const MINI = {
  card: { w: 264, h: 104, cut: 20 },
  side: { w: 44, h: 52, cut: 6 },
  cap: { w: 110, h: 22, cut: 6 },
  gapX: 14,
  gapY: 10,
  pad: 18,
} as const;
/** The board's card type (`boardLayout`'s `FS.name` / `FS.value`). */
export const CARD_FS = { name: 24, value: 18 } as const;
export const CARD_TRACK = 0.04;
/** The small configuration's footprint: 380 × 168. */
export const MINI_W = MINI.side.w + MINI.gapX + MINI.card.w + MINI.gapX + MINI.side.w;
export const MINI_H = MINI.cap.h + MINI.gapY + MINI.card.h + MINI.gapY + MINI.cap.h;
/** The two columns' centres and the three rows'. */
const COL_CX = [INSET + MINI_W / 2, CIR_VB.w - INSET - MINI_W / 2] as const;
const ROW_GAP = (CIR_VB.h - 2 * INSET - 3 * MINI_H) / 2;
const ROW_CY = [0, 1, 2].map((i) => INSET + i * (MINI_H + ROW_GAP) + MINI_H / 2);

/** THE MARKETING OS: the one object on the map that is not a card — a
 *  twelve-sided plate, the carrier's own housing (ADR-070 U34), because it is
 *  what every card is seated on, not another card. Inscribed in this square. */
export const OS_R = 150;
export const OS: Rect = { x: CIR_VB.w / 2 - OS_R, y: ROW_CY[1] - OS_R, w: 2 * OS_R, h: 2 * OS_R };
const OS_C: Pt = [CIR_VB.w / 2, ROW_CY[1]];
/** A vertex of the plate, at `deg` counter-clockwise from three o'clock. */
export const osVertex = (deg: number, r = OS_R): Pt => [
  OS_C[0] + r * Math.cos((deg * Math.PI) / 180),
  OS_C[1] - r * Math.sin((deg * Math.PI) / 180),
];
/** Where each row's wire meets the plate: at its vertices, left and right. */
const OS_PORTS: Record<1 | -1, readonly number[]> = { 1: [150, 180, 210], [-1]: [30, 0, 330] };
/** The brand system that does not exist yet, under the plate, dashed. */
export const SOCKET: Rect = {
  x: CIR_VB.w / 2 - 110,
  y: OS.y + OS.h + 32,
  w: 220,
  h: CIR_VB.h - INSET - (OS.y + OS.h + 32),
};
export const SOCKET_BAND = 28;

export interface MiniGeom {
  id: string;
  card: Rect;
  owner: Rect;
  context: Rect;
  tools: Rect;
  reach: Rect;
  /** +1 when the context plate sits to the card's right (the left column). */
  facing: 1 | -1;
}

/** The small configuration for workflow `i` (plan order: the left column top
 *  to bottom, then the right). */
export function miniAt(id: string, i: number): MiniGeom {
  const left = i < 3;
  const cx = COL_CX[left ? 0 : 1];
  const cy = ROW_CY[i % 3];
  const card: Rect = {
    x: cx - MINI.card.w / 2,
    y: cy - MINI.card.h / 2,
    w: MINI.card.w,
    h: MINI.card.h,
  };
  const sideY = cy - MINI.side.h / 2;
  const leftSide: Rect = {
    x: card.x - MINI.gapX - MINI.side.w,
    y: sideY,
    w: MINI.side.w,
    h: MINI.side.h,
  };
  const rightSide: Rect = {
    x: card.x + card.w + MINI.gapX,
    y: sideY,
    w: MINI.side.w,
    h: MINI.side.h,
  };
  const owner: Rect = {
    x: cx - MINI.cap.w / 2,
    y: card.y - MINI.gapY - MINI.cap.h,
    w: MINI.cap.w,
    h: MINI.cap.h,
  };
  const reach: Rect = {
    x: cx - MINI.cap.w / 2,
    y: card.y + card.h + MINI.gapY,
    w: MINI.cap.w,
    h: MINI.cap.h,
  };
  // The context plate faces the OS: right of the card on the left.
  return left
    ? { id, card, owner, reach, context: rightSide, tools: leftSide, facing: 1 }
    : { id, card, owner, reach, context: leftSide, tools: rightSide, facing: -1 };
}

const REST: Record<CircuitState, Pose> = { a: ID, b: ID, c: ID };
const NOW = d3(0, 0, 0);
const ON = d3(1, 1, 1);

export function circuitGeom(s: CircuitSection): CircuitGeom {
  const parts: CirPart[] = [];
  const wires: CirWire[] = [];

  /* ── The bed: the board's dot field, the whole crop. */
  parts.push({
    id: "bed",
    group: "bed",
    poses: REST,
    delays: NOW,
    modules: [
      {
        id: "bed",
        rect: { x: INSET, y: INSET, w: CIR_VB.w - 2 * INSET, h: CIR_VB.h - 2 * INSET },
        cut: 0,
        paint: "plate",
      },
    ],
    marks: [],
    letters: [],
  });

  /* ── The six small configurations. The card is the board's card, its
     name and one line; the four plates around it are the configuration's
     shape and nothing else — green is the owner, gold the context the team
     writes, the rest the plate. Short four-wire ribbons tie each to its card. */
  s.configs.forEach((c, i) => {
    const m = miniAt(c.id, i);
    const own = `mini-${c.id}`;
    const cardCx = m.card.x + m.card.w / 2;
    const cardCy = m.card.y + m.card.h / 2;
    const tie = (id: string, pts: Pt[]) =>
      wires.push({ ...wire(`${c.id}-${id}`, pts, "gold", ON, NOW, [own, own], 4), pitch: 3 });
    tie("owner", [
      [cardCx, m.owner.y + m.owner.h],
      [cardCx, m.card.y],
    ]);
    tie("reach", [
      [cardCx, m.card.y + m.card.h],
      [cardCx, m.reach.y],
    ]);
    const ctxEdge = m.facing === 1 ? m.context.x : m.context.x + m.context.w;
    const cardCtx = m.facing === 1 ? m.card.x + m.card.w : m.card.x;
    tie("context", [
      [cardCtx, cardCy],
      [ctxEdge, cardCy],
    ]);
    const toolsEdge = m.facing === 1 ? m.tools.x + m.tools.w : m.tools.x;
    const cardTools = m.facing === 1 ? m.card.x : m.card.x + m.card.w;
    tie("tools", [
      [toolsEdge, cardCy],
      [cardTools, cardCy],
    ]);
    const kx = m.card.x + MINI.pad;
    const km = m.card.w - 2 * MINI.pad;
    parts.push({
      id: own,
      group: "chip",
      poses: REST,
      delays: d3(120 + i * 70, 0, 0),
      modules: [
        { id: `${own}-card`, rect: m.card, cut: MINI.card.cut, notch: "tr", paint: "gold" },
        { id: `${own}-owner`, rect: m.owner, cut: MINI.cap.cut, paint: "green" },
        { id: `${own}-context`, rect: m.context, cut: MINI.side.cut, paint: "gold" },
        { id: `${own}-tools`, rect: m.tools, cut: MINI.side.cut, paint: "plate" },
        { id: `${own}-reach`, rect: m.reach, cut: MINI.cap.cut, paint: "plate" },
      ],
      marks: [
        {
          kind: "person",
          x: m.owner.x + (m.owner.w - 7 * 2) / 2,
          y: m.owner.y + (m.owner.h - 7 * 2) / 2,
          cell: 2,
        },
      ],
      letters: [
        mono(`mini.${c.id}.name`, c.name, CARD_FS.name, CARD_TRACK, km, kx, m.card.y + 44, "ink"),
        ...sans(`mini.${c.id}.line`, c.line, CARD_FS.value, km, kx, m.card.y + 70, "ink", 1, true),
      ],
    });
    /* The context plate's wire into the OS: a level run out of the plate's
       face, a 45° jog to the row's vertex, a level run in. */
    const from = m.facing === 1 ? m.context.x + m.context.w : m.context.x;
    const port = osVertex(OS_PORTS[m.facing][i % 3]);
    wires.push(
      wire(
        `${c.id}-os`,
        jog(from, cardCy, port[0], port[1], m.facing, 18),
        "gold",
        ON,
        d3(700 + i * 60, 0, 0),
        [own, "os"]
      )
    );
  });

  /* ── THE MARKETING OS: a twelve-sided plate with a bezel, its name in the
     board's name rung and one line under it — the one object that is not a
     card, because every card is seated on it. */
  const osLines = wrapAll(s.os.line, Math.floor((OS_R * 1.5) / (SANS_ADV * CARD_FS.value)));
  const osTop = OS_C[1] - 6 - ((osLines.length - 1) * 24) / 2;
  parts.push({
    id: "os",
    group: "layer",
    poses: REST,
    delays: d3(520, 0, 0),
    modules: [{ id: "os", rect: OS, cut: 0, paint: "gold", shape: "dodecagon" }],
    marks: [],
    letters: [
      mono(
        "os.key",
        s.os.key,
        FS.chrome,
        TRACK.chrome,
        OS_R * 1.4,
        OS_C[0],
        osTop - 40,
        "gold-ink",
        "middle"
      ),
      mono(
        "os.name",
        s.os.name,
        CARD_FS.name,
        CARD_TRACK,
        OS_R * 1.6,
        OS_C[0],
        osTop,
        "ink",
        "middle"
      ),
      ...osLines.map((line, i) => ({
        slot: `os.line.${i}`,
        text: line,
        fs: CARD_FS.value,
        track: 0,
        measure: OS_R * 1.5,
        face: "sans" as const,
        x: OS_C[0],
        y: osTop + 32 + i * 24,
        anchor: "middle" as const,
        ink: "ink2" as const,
      })),
    ],
  });

  /* ── The socket: under the OS, dashed — a system that does not exist yet,
     and the OS is what it plugs into. */
  parts.push({
    id: "socket",
    group: "socket",
    poses: REST,
    delays: d3(1100, 0, 0),
    modules: [{ id: "socket", rect: SOCKET, cut: 12, paint: "future", head: SOCKET_BAND }],
    marks: [],
    letters: [
      mono(
        "socket.key",
        s.socket.key,
        FS.chrome,
        TRACK.chrome,
        SOCKET.w - 28,
        SOCKET.x + 14,
        SOCKET.y + 19,
        "ink2"
      ),
      ...sans(
        "socket.name",
        s.socket.name,
        FS.answer,
        // Seventeen characters a line, so the name breaks as a phrase
        // ("a brand system / for all marketing"), not after "for".
        160,
        SOCKET.x + 14,
        SOCKET.y + SOCKET_BAND + 26,
        "ink2",
        2
      ),
    ],
  });
  const bottom = osVertex(270);
  wires.push(
    wire(
      "os-socket",
      [
        [bottom[0], bottom[1]],
        [bottom[0], SOCKET.y],
      ],
      "gold",
      ON,
      d3(1040, 0, 0),
      ["os", "socket"]
    )
  );

  return { vb: { ...CIR_VB }, parts, wires };
}

/** Every lettered string, per part — what the fit test walks. */
export const circuitLettering = (s: CircuitSection) =>
  circuitGeom(s).parts.flatMap((p) => p.letters.map((l) => ({ part: p, letter: l })));
