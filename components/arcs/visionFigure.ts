/**
 * visionFigure — the vision in two routes, drawn (the proposal system lab,
 * 2026-10-11; the owner's "different routes" on the section, with the team
 * on it). Pure, server-safe, no react: numbers and path strings, so a test
 * can walk them.
 *
 * Both routes draw the stack's one object (`stackLayout`: the plate, the
 * tiles, the courses' seats) in the framing's one projection (`framing/iso`,
 * `framing/floor`), so the slab here is the slab the console, the run and
 * the plugin draw.
 *
 *   team    the host plate, the layer plate (lit) over it, the four
 *           workstream tiles standing on the layer with a green diamond on
 *           each (a person and nothing else), three dotted connectors
 *           dropping from the host's front-right edge; the words in one
 *           column on the right, each level's block on a leader.
 *   phases  three crops of the same object, one a row: the tile deck with
 *           its four people, the layer with its courses (the skills solid,
 *           the evals dashed), the host with its connectors. The crops share
 *           one height, so the three stages are one box and the flow leader
 *           from a drawing's front corner lands on the next one's back
 *           corner.
 *
 * ⚠ THE SVG LETTERS NOTHING. Every word is DOM beside the drawing, seated by
 * a fraction of the crop (`VisCallout`): `ax` / `at` the vertex its leader
 * meets, `ay` where the words' block is centred, so the leader is one
 * horizontal run and, where a block cannot sit level with its vertex, one
 * vertical run at the vertex's own x, collinear with the box's edge.
 * ⚠ NO `transform` is emitted; every point is in absolute viewBox units.
 */
import { personPath } from "./crewParticles";
import { STAGE_K, frameAround, type Pads, type WorldPt } from "./framing/floor";
import {
  ISO_BASIS_STAGE,
  type IsoBox,
  type IsoFrame,
  type IsoLabel,
  type Pt,
  isoBox,
  isoPath,
  isoPlane,
  isoProject,
} from "./framing/iso";
import { PLATE, plateBox, tileBoxes } from "./stack/stackLayout";

/** The air between the team stack's plates: the console's own (the leverage
 *  passes 3.4), so the stack explodes beside the 2×2 as the plates did. */
export const VIS_GAP = 3.4;
/** The connectors: where they leave the host's front-right bottom edge
 *  (along `a`), and how far they drop, in viewBox units. */
export const CONN_A = [1.5, 3, 4.5] as const;
export const CONN_DROP = 56;
/** A person on a tile: the green diamond's half-diagonal, viewBox units. The
 *  plugin's mark is 3.6 on a crop drawn at ~1.4px a unit; these crops draw
 *  at a third of that, so the mark is larger in units and the same on
 *  screen. It stays inside the tile's top (a 33-unit rhombus). */
export const PERSON_R = 12;
/** The words' column beside a crop, in the crop's units at the binding
 *  scale (~150px at 0.5px a unit): what the collision walk models. */
export const VIS_WORDS_COL = 300;
/**
 * Where each level's word block is centred on the team stack, as a fraction
 * of the crop's height: a floor under the vertex's own seat, so the block
 * above has ended before the next begins at the binding height (the plot is
 * 259px tall at 1280×720: the team's block is six lines, the layer's three,
 * the host's five with its air). Each block below the first sits under its
 * vertex, and its leader drops to it along the plate's own edge.
 */
export const TEAM_WORDS_AT = { team: 0.18, layer: 0.51, host: 0.8 } as const;
/** The rows' word blocks, the same floor: the team's four names cannot
 *  centre on the deck's tip without running out of the crop's top. */
export const ROW_WORDS_AT = [0.36, 0, 0] as const;
/** The rows' connectors drop less, and their crops carry less air: the
 *  three crops share one height and the tallest sets every row's scale. */
export const ROW_DROP = 36;

const PADS: Pads = { l: 24, r: 24, t: 20, b: 24 };
const ROW_PADS: Pads = { l: 16, r: 16, t: 12, b: 12 };

const r1 = (n: number) => Math.round(n * 10) / 10;
const r3 = (n: number) => Math.round(n * 1000) / 1000;

/** The eight corners of a box, for the crop. */
function corners(b: IsoBox): WorldPt[] {
  const out: WorldPt[] = [];
  for (const [a, bb] of [
    [b.a, b.b],
    [b.a + b.w, b.b],
    [b.a + b.w, b.b + b.d],
    [b.a, b.b + b.d],
  ] as const) {
    out.push({ a, b: bb, z: b.z }, { a, b: bb, z: b.z + b.h });
  }
  return out;
}

export interface VisSeat {
  /** Fractions of the crop, for `--ax` / `--at`. */
  ax: number;
  at: number;
}
export interface VisCallout extends VisSeat {
  /** Where the words' block is centred, a fraction of the crop's height. */
  ay: number;
}

const seat = (p: Pt, f: IsoFrame): VisSeat => ({ ax: r3(p.x / f.w), at: r3(p.y / f.h) });
const callout = (p: Pt, f: IsoFrame, floor: number): VisCallout => {
  const s = seat(p, f);
  return { ...s, ay: r3(Math.max(s.at, floor)) };
};

export type VisMarkClass =
  | "deck"
  | "face"
  | "face-lit"
  | "hatch"
  | "side"
  | "side-lit"
  | "hidden"
  | "tile-top"
  | "tile-side"
  | "tile-hidden"
  | "person"
  | "course"
  | "course-eval"
  | "link";

/** One mark, in draw order. */
export interface VisMark {
  cls: VisMarkClass;
  d: string;
}

/** A plate's marks: the hidden edges first, the two front faces, the top. */
function plateMarks(box: IsoBox, f: IsoFrame, lit: boolean): VisMark[] {
  const p = isoBox(box, f);
  const marks: VisMark[] = [
    { cls: "hidden", d: p.hidden },
    { cls: lit ? "side-lit" : "side", d: p.left },
    { cls: lit ? "side-lit" : "side", d: p.right },
    { cls: lit ? "face-lit" : "face", d: p.top },
  ];
  if (lit) marks.push({ cls: "hatch", d: p.top });
  return marks;
}

/** The tiles, farthest first so the nearer paints over it, a person on each. */
function tileMarks(boxes: readonly IsoBox[], f: IsoFrame): VisMark[] {
  return boxes
    .map((b) => isoBox(b, f))
    .sort((x, y) => y.depth - x.depth)
    .flatMap((p) => [
      { cls: "tile-hidden" as const, d: p.hidden },
      { cls: "tile-side" as const, d: p.left },
      { cls: "tile-side" as const, d: p.right },
      { cls: "tile-top" as const, d: p.top },
      {
        cls: "person" as const,
        d: personPath({ cx: r1(p.topCentre.x), cy: r1(p.topCentre.y), r: PERSON_R }),
      },
    ]);
}

/** The connectors: dotted drops from the host's front-right bottom edge. */
function linkMarks(f: IsoFrame, z: number, drop = CONN_DROP): VisMark {
  return {
    cls: "link",
    d: CONN_A.map((a) => {
      const p = isoProject(a, 0, z, f);
      return `M${r1(p.x)} ${r1(p.y)}V${r1(p.y + drop)}`;
    }).join(""),
  };
}

/** The courses on a plate's top, the first at the back (the top of the
 *  list is the top line), from `a` 0.5 to `w − 0.5` (`stackLayout`'s own). */
function courseMarks(count: number, box: IsoBox, skills: number, f: IsoFrame): VisMark[] {
  const z = box.z + box.h;
  const b0 = 2.0;
  const b1 = PLATE.d - 0.6;
  return Array.from({ length: count }, (_, i) => {
    const b = count === 1 ? (b0 + b1) / 2 : b1 - (i * (b1 - b0)) / (count - 1);
    return {
      cls: i < skills ? ("course" as const) : ("course-eval" as const),
      d: isoPath([isoProject(0.5, b, z, f), isoProject(PLATE.w - 0.5, b, z, f)]),
    };
  });
}

/** The right-hand vertex a leader meets: the front-right face's midpoint. */
const rightVertex = (box: IsoBox, f: IsoFrame): Pt =>
  isoProject(box.a + box.w, box.b, box.z + box.h / 2, f);

/* ── The team on the stack ─────────────────────────────────────────── */

export interface VisTeamDrawing {
  vb: { w: number; h: number };
  marks: VisMark[];
  callouts: { team: VisCallout; layer: VisCallout; host: VisCallout };
}

/** The whole drawing: the host, the lit layer, `n` tiles on it, the drops. */
export function teamFigure(n = 4): VisTeamDrawing {
  const gap = VIS_GAP;
  const hostBox = plateBox("host", gap);
  const layerBox = plateBox("layer", gap);
  const tiles = tileBoxes(n, gap);
  const f = frameAround(
    [hostBox, layerBox, ...tiles].flatMap(corners),
    { ...PADS, b: PADS.b + CONN_DROP },
    STAGE_K
  );
  const last = tiles.reduce((m, t) => (t.a > m.a ? t : m), tiles[0]);
  return {
    vb: { w: f.w, h: f.h },
    marks: [
      ...plateMarks(hostBox, f, false),
      linkMarks(f, hostBox.z),
      ...plateMarks(layerBox, f, true),
      ...tileMarks(tiles, f),
    ],
    callouts: {
      team: callout(rightVertex(last, f), f, TEAM_WORDS_AT.team),
      layer: callout(rightVertex(layerBox, f), f, TEAM_WORDS_AT.layer),
      host: callout(rightVertex(hostBox, f), f, TEAM_WORDS_AT.host),
    },
  };
}

/* ── Three phases, read down ───────────────────────────────────────── */

export interface VisRowDrawing {
  vb: { w: number; h: number };
  marks: VisMark[];
  callout: VisCallout;
  /** The flow leader's seats: the drawing's front corner (`fx`, `fb`: its
   *  lowest point, where the leader leaves) and the back corner's top
   *  (`fa`: where the leader from the row above lands), fractions. */
  flow: { fx: number; fb: number; fa: number };
}

/** One plate at the floor, the object every row draws. */
const ONE: IsoBox = { a: 0, b: 0, w: PLATE.w, d: PLATE.d, z: 0, h: PLATE.h };

/**
 * The three rows: the deck with its tiles, the layer with its courses, the
 * host with its connectors. `courses` counts the layer's skills and evals.
 */
export function phaseRows(
  n = 4,
  courses: { skills: number; evals: number } = { skills: 3, evals: 2 }
): [VisRowDrawing, VisRowDrawing, VisRowDrawing] {
  const deckTiles = tileBoxes(n, VIS_GAP).map((t) => ({ ...t, z: 0 }));
  const sets: { pts: WorldPt[]; pads: Pads }[] = [
    { pts: [...corners({ ...ONE, h: 0 }), ...deckTiles.flatMap(corners)], pads: ROW_PADS },
    { pts: corners(ONE), pads: ROW_PADS },
    { pts: corners(ONE), pads: { ...ROW_PADS, b: ROW_PADS.b + ROW_DROP } },
  ];
  /* One height for the three crops: the shorter ones take the difference
     as air above, so the stages are one box and the flow leader lands. */
  const raw = sets.map((s) => frameAround(s.pts, s.pads, STAGE_K));
  const H = Math.max(...raw.map((f) => f.h));
  const frames = sets.map((s, i) =>
    frameAround(s.pts, { ...s.pads, t: s.pads.t + (H - raw[i].h) }, STAGE_K)
  );
  const flow = (f: IsoFrame, bottom: number) => {
    const front = isoProject(0, 0, 0, f);
    const back = isoProject(PLATE.w, PLATE.d, PLATE.h, f);
    return { fx: r3(front.x / f.w), fb: r3((front.y + bottom) / f.h), fa: r3(back.y / f.h) };
  };
  const last = deckTiles.reduce((m, t) => (t.a > m.a ? t : m), deckTiles[0]);
  const nCourses = Math.min(courses.skills + courses.evals, 8);

  const [fDeck, fLayer, fHost] = frames;
  const deck: VisRowDrawing = {
    vb: { w: fDeck.w, h: fDeck.h },
    marks: [
      { cls: "deck", d: isoPlane(0, 0, PLATE.w, PLATE.d, 0, fDeck) },
      ...tileMarks(deckTiles, fDeck),
    ],
    callout: callout(rightVertex(last, fDeck), fDeck, ROW_WORDS_AT[0]),
    flow: flow(fDeck, 0),
  };
  const layer: VisRowDrawing = {
    vb: { w: fLayer.w, h: fLayer.h },
    marks: [
      ...plateMarks(ONE, fLayer, true),
      ...courseMarks(nCourses, ONE, courses.skills, fLayer),
    ],
    callout: callout(rightVertex(ONE, fLayer), fLayer, ROW_WORDS_AT[1]),
    flow: flow(fLayer, 0),
  };
  const host: VisRowDrawing = {
    vb: { w: fHost.w, h: fHost.h },
    marks: [...plateMarks(ONE, fHost, false), linkMarks(fHost, 0, ROW_DROP)],
    callout: callout(rightVertex(ONE, fHost), fHost, ROW_WORDS_AT[2]),
    flow: flow(fHost, ROW_DROP),
  };
  return [deck, layer, host];
}

/* ── The words, for the collision walk ──────────────────────────────── */

/**
 * The word blocks beside a crop as labels in an extended frame (the crop
 * plus the words' column), each centred on its `ay` and `lines` tall, so
 * `labelCollisions` measures the blocks against one another.
 */
export function visionLabels(
  blocks: readonly { id: string; callout: VisCallout; lines: number }[],
  vb: { w: number; h: number }
): { labels: IsoLabel[]; frame: IsoFrame } {
  const frame: IsoFrame = {
    w: vb.w + VIS_WORDS_COL,
    h: vb.h,
    ox: 0,
    oy: 0,
    k: STAGE_K,
    basis: ISO_BASIS_STAGE,
  };
  return {
    frame,
    labels: blocks.map((b) => ({
      id: b.id,
      text: b.id,
      ax: vb.w / frame.w,
      at: b.callout.ay,
      anchor: "start" as const,
      lines: b.lines,
      measure: VIS_WORDS_COL,
    })),
  };
}
