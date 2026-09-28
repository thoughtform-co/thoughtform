/**
 * stagesLayout — THE THREE STAGES: a prompt, a tool, an agent (ADR-130 U4).
 *
 * The Moira workshop's own figure (`loop-moira/lib/workshops/stages.ts`), on
 * the house's stage: one floor seen from its front corner, the time axis up
 * the right-hand edge ("how long, without you") and the work up the left-hand
 * edge ("how much of the work"). Each stage stands further along BOTH, with a
 * larger footprint and a taller body, so the build-up is one diagonal the eye
 * reads from the front corner to the back: a small block you check every
 * time, a middle one you operate, and the agent's — the drawing's one gold
 * object — at the back, tallest. The same positions Moira used, as fractions
 * of the edge (0.14, 0.44, 0.80), so nothing about the argument moved.
 *
 * ⚠ U2's DRAWING WAS CUT OFF, and the cause was not the drawing: its live lens
 * was clamped and never checked the projected extremes. Here the crop is
 * derived from every point the drawing uses (`floor.ts`), and the canvas
 * frames exactly that crop, so nothing can leave it.
 *
 * ⚠ PURE. Every point absolute, no `transform` on any SVG node. The SVG
 * letters nothing: the three names and the axis words are DOM spans seated by
 * the fractions below — the names beside each block's right-hand edge
 * (Moira's `plinthSide`), the axis words ALONG their edges.
 */

import {
  ISO_SEED,
  type IsoBox,
  type IsoFrame,
  type IsoLabel,
  type Pt,
  isoBox,
  isoDepth,
  isoDust,
  isoFraction,
  isoGrid,
  isoPath,
  isoProject,
} from "./iso";
import { GRID_PITCH, TIME_A, type WorldPt, besideEdge, floorCorners, frameAround } from "./floor";

/** The floor: the shared time axis by as much of the work, square. */
export const FLOOR = { w: TIME_A, d: TIME_A } as const;

/**
 * Prompt, tool, agent — centred at Moira's fractions of the edge, with her
 * footprints (0.16, 0.22, 0.28 of the edge) and a height that grows with them.
 */
const CENTRES = [
  [0.14, 0.14],
  [0.44, 0.46],
  [0.8, 0.82],
] as const;
const SIDES = [0.16, 0.22, 0.28] as const;
/* ⚠ MOIRA'S HEIGHTS, NOT TALLER. On one diagonal seen from its front corner the
   blocks overlap on screen by construction; at 1.2 / 2.4 / 3.8 the agent sat on
   the tool like a tower (the first live shoot). Her 28 / 44 / 64 px on a 300px
   edge are these, in world units. */
const HEIGHTS = [0.95, 1.5, 2.15] as const;

export const STAGE_PRISMS: readonly IsoBox[] = CENTRES.map(([u, v], i) => {
  const side = SIDES[i] * FLOOR.w;
  return {
    a: u * FLOOR.w - side / 2,
    b: v * FLOOR.d - side / 2,
    w: side,
    d: side,
    z: 0,
    h: HEIGHTS[i],
  };
});

/** How far out from its edge an axis word sits, in viewbox units. */
const AXIS_OUT = 38;
/** How far right of a block's edge its name starts. */
const NAME_GAP = 12;

function worldExtent(): WorldPt[] {
  const pts = floorCorners(FLOOR.w, FLOOR.d);
  for (const b of STAGE_PRISMS) {
    pts.push(
      { a: b.a, b: b.b, z: b.z + b.h },
      { a: b.a + b.w, b: b.b, z: b.z + b.h },
      { a: b.a, b: b.b + b.d, z: b.z + b.h },
      { a: b.a + b.w, b: b.b + b.d, z: b.z + b.h }
    );
  }
  return pts;
}

/* ⚠ THE PADS ARE SYMMETRIC, so the front corner sits on the stage's centre
   line — Moira's rhombus, centred, which is what makes the view read as
   "from the front" rather than from a side. The sides hold the axis words'
   tails; the foot holds "minuten" under the corner. */
export const STAGES_FRAME: IsoFrame = frameAround(worldExtent(), { l: 60, r: 60, t: 16, b: 52 });
export const STAGES_VB = { w: STAGES_FRAME.w, h: STAGES_FRAME.h } as const;

export function stageFraction(p: Pt): { ax: number; at: number } {
  return isoFraction(p, STAGES_FRAME);
}

export function stagesGrid() {
  return isoGrid(0, 0, FLOOR.w, FLOOR.d, 0, GRID_PITCH, STAGES_FRAME);
}

/** The floor's two front edges — the two axes — drawn a rung above the grid. */
export function stagesAxes(): { time: string; work: string } {
  const o = isoProject(0, 0, 0, STAGES_FRAME);
  return {
    time: isoPath([o, isoProject(FLOOR.w, 0, 0, STAGES_FRAME)]),
    work: isoPath([o, isoProject(0, FLOOR.d, 0, STAGES_FRAME)]),
  };
}

/** The blocks, FARTHEST FIRST: SVG has no z-buffer, so order is the drawing. */
export function stagesBoxes() {
  return STAGE_PRISMS.map((box, i) => ({ i, box, paths: isoBox(box, STAGES_FRAME) })).sort(
    (p, q) => isoDepth(q.box.a, q.box.b) - isoDepth(p.box.a, p.box.b)
  );
}

/** Motes inside each block, per unit of volume (ADR-070 U24: never per object). */
export function stagesDust(): readonly Pt[] {
  return STAGE_PRISMS.flatMap((b, i) =>
    isoDust(
      ISO_SEED + i * 97,
      Math.round(b.w * b.d * b.h * 1.6),
      b.a,
      b.b,
      b.w,
      b.d,
      b.h,
      STAGES_FRAME
    )
  );
}

/** Where each block's name starts, and the short tick that joins it. */
export function stageNameSeat(i: number): { ax: number; at: number } {
  const side = isoBox(STAGE_PRISMS[i], STAGES_FRAME).side;
  return stageFraction({ x: side.x + NAME_GAP, y: side.y });
}

export function stageLeader(i: number): string {
  const side = isoBox(STAGE_PRISMS[i], STAGES_FRAME).side;
  return isoPath([side, { x: side.x + NAME_GAP - 3, y: side.y }]);
}

/** Every word's seat, shared by the renderer and the fit guard. */
export function stagesWordSeats() {
  const f = STAGES_FRAME;
  const corner = isoProject(0, 0, 0, f);
  const right = isoProject(FLOOR.w, 0, 0, f);
  const left = isoProject(0, FLOOR.d, 0, f);
  return {
    time: stageFraction(besideEdge("a", FLOOR.w * 0.5, AXIS_OUT, f)),
    work: stageFraction(besideEdge("b", FLOOR.d * 0.5, AXIS_OUT, f)),
    /* The two ends sit UNDER their tips, set back toward the corner: beside a
       tip they would need a pad as wide as the word, which shrinks the whole
       drawing at the binding viewport. */
    far: stageFraction({ x: right.x, y: right.y + 16 }),
    top: stageFraction({ x: left.x, y: left.y + 16 }),
    near: stageFraction({ x: corner.x, y: corner.y + 14 }),
  };
}

/** Everything the drawing names, for the collision walk. */
export function stagesLabels(
  names: readonly string[],
  axes: { time: string; work: string },
  ends: { near: string; far: string; top: string }
): readonly IsoLabel[] {
  const w = stagesWordSeats();
  return [
    ...names.map((text, i) => ({
      id: `name-${i}`,
      text,
      ...stageNameSeat(i),
      anchor: "start" as const,
    })),
    { id: "time", text: `${axes.time} →`, ...w.time, anchor: "middle" as const, rot: -22 },
    { id: "far", text: ends.far, ...w.far, anchor: "end" as const, vAlign: "top" as const },
    { id: "work", text: `← ${axes.work}`, ...w.work, anchor: "middle" as const, rot: 22 },
    { id: "top", text: ends.top, ...w.top, anchor: "start" as const, vAlign: "top" as const },
    { id: "near", text: ends.near, ...w.near, anchor: "middle" as const, vAlign: "top" as const },
  ];
}

/** Every point the drawing uses, for the containment walk. */
export function stagesExtent(): readonly Pt[] {
  return worldExtent().map((p) => isoProject(p.a, p.b, p.z, STAGES_FRAME));
}
