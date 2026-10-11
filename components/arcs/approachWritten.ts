/**
 * approachWritten — the layer, written, read whole (the approach's lab
 * direction `written`, 2026-10-11). Pure, server-safe, no react, no three.
 *
 * The vision's own object one altitude down: the stack at its WRITTEN state,
 * static. The organisation's slab, the gold layer with its courses drawn (the
 * skills, then the evals), the workstream tiles on a deck one course higher
 * than the vision's (the team moved upstream: altitude, not a circle), one
 * green diamond over each tile (the team), Claude's beads along the layer's
 * front edge, ending at one diamond past its tip (the agent asks the
 * workstream's owner once).
 *
 * Every world number is `stackLayout`'s, never restated; the projection is
 * `framing/iso`'s one basis. The crop is DERIVED (`frameAround`) and then
 * widened for the words: the layer's words to the left, the three passes to
 * the right, every one a DOM span seated at a fraction of the crop on a 1px
 * DOM leader to the mark it names.
 *
 * ⚠ THE SVG LETTERS NOTHING. ⚠ NO LABEL SITS ON A FACE: the layer's words
 * hang off its left tip, the host's under its nose, the passes in a column
 * past the drawing's right edge, and `writtenLabels` hands the seats to the
 * collision walk. ⚠ SEEDED, never `Math.random()`. The PRNG is COPIED from
 * `crewParticles` (`configRun`'s rule); `crewSeed`, `grainPaths` and
 * `personPath` are its public exports and are imported.
 */
import { crewSeed, grainPaths, personPath } from "./crewParticles";
import type { CrewGrain } from "./crewParticles";
import { STAGE_K, frameAround, type WorldPt } from "./framing/floor";
import { isoBox, isoProject, type IsoBox, type IsoFrame, type IsoLabel } from "./framing/iso";
import { PLATE, courseLines, plateBox, tileBoxes, type StackTier } from "./stack/stackLayout";

export const WRITTEN_TIERS: readonly StackTier[] = ["host", "layer", "tiles"];

/** The deck one course higher than the vision's: a course pitch of the
 *  layer's own ladder (`courseLines`: 3.4 units of depth over four steps),
 *  spent as altitude. */
export const DECK_LIFT = 0.85;
/** A diamond's height over its tile's top, world units. */
const PERSON_Z = 0.6;
/** A diamond's half-diagonal, viewBox units. */
export const PERSON_R = 6;
/** The beads ride just over the layer's front edge. */
const BEAD_Z = 0.14;
/** The run's extent along the front edge, and the owner past its tip. */
const BEAD_A0 = 0.25;
const BEAD_A1 = PLATE.w + 0.45;
export const ASK_A = PLATE.w + 0.95;
/** A bead's side: 3.4 units paints 2px at the binding viewport's scale. */
const BEAD_S = 3.4;
const BEAD_STEP = 0.19;

/** The words' columns either side of the drawing, viewBox units. */
export const WORDS_L = 300;
export const WORDS_R = 520;
/** A leader's run from a word to its mark, and the air at either end. */
const LEAD = 36;
const LEAD_AIR = 4;
/** The pass blocks: a key line over up to three sans lines, reserved at the
 *  binding viewport's scale, and the air between two blocks. */
const PASS_H = 126;
const PASS_GAP = 18;
const KEY_HALF = 11;
/** The crop's room around the drawing: the diamonds' halo above, the owner's
 *  diamond to the right, the host's two-line tag under the nose. */
const PADS = { l: 16, r: 16, t: 28, b: 76 } as const;

export interface AprBox {
  top: string;
  left: string;
  right: string;
  hidden: string;
}
export interface AprSeat {
  /** Fractions of the crop, for `--ax` / `--at`. */
  ax: number;
  at: number;
}
/** A 1px DOM leader: a run (`aw`) or a drop (`ah`), fractions of the crop. */
export interface AprLead {
  ax: number;
  at: number;
  aw: number;
  ah: number;
}

export interface WrittenDrawing {
  vb: { w: number; h: number };
  host: AprBox;
  layer: AprBox;
  /** Farthest first, so the nearer tile paints over the farther. */
  tiles: (AprBox & { lit: boolean })[];
  courses: { d: string; kind: "skill" | "eval" }[];
  /** The layer's front edge, where the beads travel. */
  run: string;
  beads: { a: number; d: string }[];
  /** One diamond over each tile: the team. */
  people: string[];
  /** The owner, past the run's tip: asked once. */
  ask: string;
  seats: {
    layer: AprSeat;
    host: AprSeat;
    passes: readonly [AprSeat, AprSeat, AprSeat];
  };
  leads: {
    layer: AprLead;
    passes: readonly [readonly AprLead[], readonly AprLead[], readonly AprLead[]];
  };
  /** The pass column's width, a fraction of the crop. */
  passW: number;
  /** Where pass 02's leader meets the layer's back-right edge, in depth
   *  units: the test pins it inside the courses' own range. */
  courseB: number;
}

/** The pass column's width, viewBox units. */
export const PASS_COL = WORDS_R - 4 * 3 - 16;

/* ── The helpers, copied from `crewParticles` ──────────────────────────── */

function rng(seed: number) {
  let t = seed;
  return function next() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const r4 = (n: number) => Math.round(n * 10000) / 10000;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

function grain(cx: number, cy: number, s: number, a: number): CrewGrain {
  const side = r1(s);
  return { x: r1(cx - side / 2), y: r1(cy - side / 2), s: side, a: clamp(a, 0, 1) };
}

function corners(b: IsoBox): WorldPt[] {
  const out: WorldPt[] = [];
  for (const [a, bb] of [
    [b.a, b.b],
    [b.a + b.w, b.b],
    [b.a + b.w, b.b + b.d],
    [b.a, b.b + b.d],
  ]) {
    out.push({ a, b: bb, z: b.z }, { a, b: bb, z: b.z + b.h });
  }
  return out;
}

function box(b: IsoBox, f: IsoFrame): AprBox {
  const p = isoBox(b, f);
  return { top: p.top, left: p.left, right: p.right, hidden: p.hidden };
}

/**
 * The whole drawing. `tiles` is the layer's workstreams in the record's
 * order (the first stands at the back, as the stack's own deck seats them);
 * `skills` and `evals` the courses' counts, the skills drawn first.
 */
export function writtenDrawing(
  seedId: string,
  o: { tiles: readonly { lit?: boolean }[]; skills: number; evals: number }
): WrittenDrawing {
  const R = rng(crewSeed(seedId));
  const host = plateBox("host");
  const layer = plateBox("layer");
  const top = layer.z + layer.h;
  const tiles = tileBoxes(Math.max(1, o.tiles.length)).map((b) => ({ ...b, z: b.z + DECK_LIFT }));
  const people: WorldPt[] = tiles.map((b) => ({
    a: b.a + b.w / 2,
    b: b.b + b.d / 2,
    z: b.z + b.h + PERSON_Z,
  }));
  const ask: WorldPt = { a: ASK_A, b: 0, z: top + BEAD_Z };

  /* The crop: derived around every point the drawing reaches, then widened
     for the words either side. */
  const inner = frameAround(
    [
      ...corners(host),
      ...corners(layer),
      ...tiles.flatMap(corners),
      ...people,
      ask,
      { a: BEAD_A0, b: 0, z: top + BEAD_Z },
      { a: BEAD_A1, b: 0, z: top + BEAD_Z },
    ],
    PADS,
    STAGE_K
  );
  const F: IsoFrame = { ...inner, w: WORDS_L + inner.w + WORDS_R, ox: inner.ox + WORDS_L };
  const vb = { w: F.w, h: F.h };
  const P = (p: WorldPt) => isoProject(p.a, p.b, p.z, F);
  const seat = (x: number, y: number): AprSeat => ({ ax: r4(x / vb.w), at: r4(y / vb.h) });
  const run = (x0: number, x1: number, y: number): AprLead => ({
    ax: r4(Math.min(x0, x1) / vb.w),
    at: r4(y / vb.h),
    aw: r4(Math.abs(x1 - x0) / vb.w),
    ah: 0,
  });
  const drop = (x: number, y0: number, y1: number): AprLead => ({
    ax: r4(x / vb.w),
    at: r4(Math.min(y0, y1) / vb.h),
    aw: 0,
    ah: r4(Math.abs(y1 - y0) / vb.h),
  });

  /* The tiles: farthest first (the iso law: a larger a + b is farther). */
  const tileDepth = tiles.map((b, i) => ({ i, depth: b.a + b.w / 2 + b.b + b.d / 2 }));
  tileDepth.sort((p, q) => q.depth - p.depth);
  const tilePaths = tileDepth.map(({ i }) => ({
    ...box(tiles[i], F),
    lit: o.tiles[i]?.lit === true,
  }));

  /* The courses on the layer's top, the skills then the evals. */
  const count = o.skills + o.evals;
  const courses = courseLines(count).map((pts, i) => ({
    d: pts.map((p, k) => `${k ? "L" : "M"}${r1(P(p).x)} ${r1(P(p).y)}`).join(""),
    kind: i < o.skills ? ("skill" as const) : ("eval" as const),
  }));

  /* The run along the front edge, and Claude's beads riding it. */
  const e0 = P({ a: 0, b: 0, z: top });
  const e1 = P({ a: PLATE.w, b: 0, z: top });
  const runPath = `M${r1(e0.x)} ${r1(e0.y)}L${r1(e1.x)} ${r1(e1.y)}`;
  const beads: CrewGrain[] = [];
  for (let a = BEAD_A0; a <= BEAD_A1; a += BEAD_STEP) {
    const t = (a - BEAD_A0) / (BEAD_A1 - BEAD_A0);
    const p = P({ a, b: (R() - 0.5) * 0.06, z: top + BEAD_Z + (R() - 0.5) * 0.03 });
    beads.push(grain(p.x, p.y, BEAD_S + R() * 0.6, 0.5 + 0.45 * t));
  }

  /* The team over the deck, and the owner past the tip. */
  const peoplePaths = tileDepth.map(({ i }) => {
    const p = P(people[i]);
    return personPath({ cx: r1(p.x), cy: r1(p.y), r: PERSON_R });
  });
  const askP = P(ask);
  const askPath = personPath({ cx: r1(askP.x), cy: r1(askP.y), r: PERSON_R });

  /* ── The words ─────────────────────────────────────────────────────── */

  /* The layer's words hang off its left tip (the `b` tip at half height),
     the label level with the tip, the courses under it. */
  const layerTip = P({ a: 0, b: PLATE.d, z: layer.z + layer.h / 2 });
  const layerSeat = seat(layerTip.x - LEAD - LEAD_AIR, layerTip.y);
  const layerLead = run(layerTip.x - LEAD, layerTip.x - 2, layerTip.y);

  /* The host's words sit under the slab's nose, centred (the plugin's own
     seat), clear of the layer's column. */
  const nose = P({ a: 0, b: 0, z: 0 });
  const hostSeat = seat(nose.x, nose.y + 8);

  /* The passes: a column past the drawing's right edge. 01 level with the
     team's farthest diamond (the largest `a` stands top-right on screen,
     the row's highest point); 02 level with the courses, its leader meeting
     the layer's back-right edge inside their depth range; 03 at the owner's
     diamond, dropped to it when its block cannot sit level. */
  const colX = WORDS_L + inner.w + LEAD_AIR * 3;
  const far = tileDepth[0].i;
  const p1 = P(people[far]);
  const y1 = p1.y;
  const y2 = Math.max(
    P({ a: PLATE.w, b: 3.7, z: top }).y,
    y1 - KEY_HALF + PASS_H + PASS_GAP + KEY_HALF
  );
  const y3 = y2 - KEY_HALF + PASS_H + PASS_GAP + KEY_HALF;
  const T = P({ a: PLATE.w, b: 0, z: top });
  const Rb = P({ a: PLATE.w, b: PLATE.d, z: top });
  const courseB = clamp((PLATE.d * (y2 - T.y)) / (Rb.y - T.y), 0.6, PLATE.d - 0.6);
  const edge = P({ a: PLATE.w, b: courseB, z: top });
  const passSeats = [
    seat(colX, y1 - KEY_HALF),
    seat(colX, y2 - KEY_HALF),
    seat(colX, y3 - KEY_HALF),
  ] as const;
  const lead1 = [run(p1.x + PERSON_R + LEAD_AIR, colX - LEAD_AIR, y1)];
  const lead2 = [run(edge.x + 2, colX - LEAD_AIR, y2)];
  const lead3 =
    y3 <= askP.y + PERSON_R
      ? [run(askP.x + PERSON_R + LEAD_AIR, colX - LEAD_AIR, y3)]
      : [run(askP.x, colX - LEAD_AIR, y3), drop(askP.x, askP.y + PERSON_R + LEAD_AIR, y3)];

  return {
    vb,
    host: box(host, F),
    layer: box(layer, F),
    tiles: tilePaths,
    courses,
    run: runPath,
    beads: grainPaths(beads),
    people: peoplePaths,
    ask: askPath,
    seats: { layer: layerSeat, host: hostSeat, passes: passSeats },
    leads: { layer: layerLead, passes: [lead1, lead2, lead3] },
    passW: r4(PASS_COL / vb.w),
    courseB: r1(courseB),
  };
}

/**
 * The seats as labels for the collision walk (`labelCollisions`): the
 * layer's block (its label and the courses), the host's tag, the three
 * passes. `lines` is each block's height in line boxes at the binding
 * viewport, so the walk measures blocks, never a single line.
 */
export function writtenLabels(
  d: WrittenDrawing,
  words: { layer: string; host: string; courses: number; keys: readonly string[] }
): IsoLabel[] {
  const col = PASS_COL;
  return [
    {
      id: "layer",
      text: words.layer,
      ax: d.seats.layer.ax,
      at: d.seats.layer.at,
      anchor: "end",
      vAlign: "top",
      lines: 1 + words.courses,
      measure: WORDS_L - LEAD - LEAD_AIR * 2,
    },
    {
      id: "host",
      text: words.host,
      ax: d.seats.host.ax,
      at: d.seats.host.at,
      anchor: "middle",
      vAlign: "top",
      lines: 2,
      measure: 240,
    },
    ...d.seats.passes.map((s, i) => ({
      id: `pass-${i}`,
      text: words.keys[i] ?? "",
      ax: s.ax,
      at: s.at,
      anchor: "start" as const,
      vAlign: "top" as const,
      lines: 4,
      measure: col,
    })),
  ];
}
