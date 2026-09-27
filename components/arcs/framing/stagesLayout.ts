/**
 * stagesLayout — the geometry of THE THREE STAGES (ADR-130, redrawn in U1).
 *
 * A prompt, a tool, an agent, standing on one floor. The Moira workshop drew
 * it as an isometric plinth floor; ADR-130 chose the house's flat register
 * instead, and on 2026-09-27 the owner read that live and reversed it — the
 * three beats are to be isometric wireframe machines in the brandworld's own
 * retro-futuristic register. So: a ruled datum, a time axis along its near
 * edge, a true vertical for the work axis, and three wireframe prisms whose
 * FOOTPRINT along the axis is how long each runs without you and whose HEIGHT
 * is how much of the work it holds. The agent's is the drawing's one gold
 * object.
 *
 * ⚠ PURE. No React, no DOM. Every point is in ABSOLUTE viewBox units — no
 * `transform` on any node, because every overlap walk on this surface compares
 * `getBBox`, which is blind to an element's own transform.
 * ⚠ THE SVG LETTERS NOTHING. The three tags and the axis words are DOM, seated
 * by the fractions `stageFraction` emits (the dial's `--ax/--at`), with a
 * leader from each tag to the prism it names — no label on a 30-degree face
 * (`.claude/rules/proof.md` §The BOARD archetype).
 */

import {
  ISO_BASIS_CABINET,
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

/* ⚠ THE CROP IS 460 TALL, NOT 540. The ink runs from the agent's tag down to
   the axis words — 368 units — and a 540 crop spent its whole surplus as a
   band of void ABOVE the drawing, because the stage is width-bound and the
   height is pure letterbox. Trimming the crop does not shrink the drawing; it
   deletes the empty band. */
export const STAGES_VB = { w: 960, h: 460 } as const;

export const STAGES_FRAME: IsoFrame = {
  w: STAGES_VB.w,
  h: STAGES_VB.h,
  ox: 96,
  oy: 410,
  k: 60,
  basis: ISO_BASIS_CABINET,
};

/** The datum: twelve units of time by three of depth, ruled every unit. */
export const FLOOR = { a: 0, b: 0, w: 12, d: 3, pitch: 1 } as const;
/** How high the work axis runs — a head above the tallest prism. */
export const AXIS_TOP = 5;
/** The near edge's graduation. */
export const TICK_PITCH = 1;
export const TICK_LEN = 7;

/**
 * Prompt, tool, agent: each runs longer along the time axis AND holds more of
 * the work than the one before it, which is the whole argument. One depth for
 * all three, so the only two things that change are the two that mean
 * something.
 */
export const STAGE_PRISMS: readonly IsoBox[] = [
  { a: 0.5, b: 0.6, w: 1.6, d: 1.8, z: 0, h: 1 },
  { a: 3.2, b: 0.6, w: 3, d: 1.8, z: 0, h: 2.4 },
  { a: 7, b: 0.6, w: 4.6, d: 1.8, z: 0, h: 4.6 },
];

/** A point as fractions of the crop — what a DOM label is seated by. */
export function stageFraction(x: number, y: number): { ax: number; at: number } {
  return isoFraction({ x, y }, STAGES_FRAME);
}

export function stagesGrid() {
  return isoGrid(FLOOR.a, FLOOR.b, FLOOR.w, FLOOR.d, 0, FLOOR.pitch, STAGES_FRAME);
}

/** The two axes: the near edge of the datum, and a true vertical at its origin. */
export function stagesAxes(): { time: string; work: string; ticks: readonly string[] } {
  const o = isoProject(0, 0, 0, STAGES_FRAME);
  const far = isoProject(FLOOR.w, 0, 0, STAGES_FRAME);
  const ticks: string[] = [];
  for (let a = TICK_PITCH; a <= FLOOR.w; a += TICK_PITCH) {
    const p = isoProject(a, 0, 0, STAGES_FRAME);
    ticks.push(isoPath([p, { x: p.x, y: p.y + TICK_LEN }]));
  }
  return {
    time: isoPath([o, far]),
    work: isoPath([o, isoProject(0, 0, AXIS_TOP, STAGES_FRAME)]),
    ticks,
  };
}

/** The prisms, FARTHEST FIRST: SVG has no z-buffer, so order is the drawing. */
export function stagesBoxes() {
  return STAGE_PRISMS.map((box, i) => ({ i, box, paths: isoBox(box, STAGES_FRAME) })).sort(
    (p, q) => isoDepth(p.box.a, p.box.b) - isoDepth(q.box.a, q.box.b)
  );
}

/** How far above a prism's own top-left corner its tag hangs. */
export const TAG_LIFT = 26;

/** A prism's tag seat, and the leader that joins it to the prism. */
export function stageTagSeat(i: number): { ax: number; at: number } {
  const apex = isoBox(STAGE_PRISMS[i] ?? STAGE_PRISMS[2], STAGES_FRAME).apex;
  return stageFraction(apex.x, apex.y - TAG_LIFT);
}

export function stageLeader(i: number): string {
  const apex = isoBox(STAGE_PRISMS[i] ?? STAGE_PRISMS[2], STAGES_FRAME).apex;
  return isoPath([apex, { x: apex.x, y: apex.y - TAG_LIFT + 5 }]);
}

export function stagesDust(): readonly Pt[] {
  return isoDust(ISO_SEED, 26, FLOOR.a, FLOOR.b, FLOOR.w, FLOOR.d, AXIS_TOP, STAGES_FRAME);
}

/** The axis words' own seats, so the renderer and the fit guard share them. */
export function stagesWordSeats() {
  const near = isoProject(0, 0, 0, STAGES_FRAME);
  const far = isoProject(FLOOR.w, 0, 0, STAGES_FRAME);
  const top = isoProject(0, 0, AXIS_TOP, STAGES_FRAME);
  return {
    time: stageFraction((near.x + far.x) / 2, near.y + 26),
    near: stageFraction(near.x, near.y + 26),
    far: stageFraction(far.x, near.y + 26),
    work: stageFraction(near.x - 30, (near.y + top.y) / 2),
    top: stageFraction(top.x, top.y - 16),
  };
}

/** Everything the drawing names, for the fit guard. */
export function stagesLabels(
  tags: readonly string[],
  axes: { time: string; work: string },
  ends: { near: string; far: string; top: string }
): readonly IsoLabel[] {
  const w = stagesWordSeats();
  return [
    ...tags.map((text, i) => ({
      id: `tag-${i}`,
      text,
      ...stageTagSeat(i),
      anchor: "middle" as const,
      vAlign: "bottom" as const,
    })),
    { id: "time", text: axes.time, ...w.time, anchor: "middle" as const, vAlign: "top" as const },
    { id: "near", text: ends.near, ...w.near, anchor: "start" as const, vAlign: "top" as const },
    { id: "far", text: ends.far, ...w.far, anchor: "end" as const, vAlign: "top" as const },
    { id: "top", text: ends.top, ...w.top, anchor: "middle" as const, vAlign: "bottom" as const },
    // The work axis reads bottom-up (a DOM `rotate`, which is lawful: it is a
    // span, not an SVG node), so its box is its own measure turned on its side.
    {
      id: "work",
      text: axes.work,
      ...w.work,
      anchor: "middle" as const,
      measure: 16,
    },
  ];
}

/** Every point the drawing uses, for the fit guard's containment walk. */
export function stagesExtent(): readonly Pt[] {
  const pts: Pt[] = [
    isoProject(0, 0, 0, STAGES_FRAME),
    isoProject(FLOOR.w, 0, 0, STAGES_FRAME),
    isoProject(FLOOR.w, FLOOR.d, 0, STAGES_FRAME),
    isoProject(0, FLOOR.d, 0, STAGES_FRAME),
    isoProject(0, 0, AXIS_TOP, STAGES_FRAME),
  ];
  for (const box of STAGE_PRISMS) {
    pts.push(
      isoProject(box.a, box.b, box.z, STAGES_FRAME),
      isoProject(box.a + box.w, box.b + box.d, box.z + box.h, STAGES_FRAME),
      isoBox(box, STAGES_FRAME).apex
    );
  }
  return pts;
}
