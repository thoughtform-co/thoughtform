/**
 * explodedLayout — one template, exploded (ADR-130 U1).
 *
 * The owner read the workshop's two panels live and called them "glorified
 * PowerPoint panels": more visual, more creative. So the thing the record on
 * the left leads to and the day on the right works on is DRAWN, once, between
 * them — one campaign template lifted into its layers, in the grammar of an
 * exploded 1980s CAD assembly: wireframe plates on thin dashed verticals over
 * a ruled datum, each named off to the side.
 *
 * ⚠ THE LABELS ARE THE DRAWING'S WHOLE COST, and they are what sizes it. A
 * 33-character note at the rendered type needs ~165px, so the label column is
 * 176 units of a 420-unit crop and the stack gets the rest — the plates are
 * small because the words are not. Sizing the plates first and squeezing the
 * words after is how the map city's plaques ended up printing through their
 * own plates.
 *
 * ⚠ PURE. Absolute units, no `transform`, nothing lettered in the SVG.
 */

import {
  ISO_BASIS_CABINET,
  ISO_SEED,
  type IsoFrame,
  type IsoLabel,
  isoDust,
  isoFraction,
  isoGrid,
  isoPath,
  isoPlate,
  isoProject,
  isoLeader,
  type IsoPlatePaths,
  type Pt,
} from "./iso";

export const XP_VB = { w: 360, h: 460 } as const;

export const XP_FRAME: IsoFrame = {
  w: XP_VB.w,
  h: XP_VB.h,
  ox: 28,
  oy: 406,
  k: 80,
  basis: ISO_BASIS_CABINET,
};

/** The template's footprint, its thickness, and the lift between layers. */
export const PLATE = { a: 0, b: 0, w: 1.5, d: 1.15, t: 0.06 } as const;
/* ⚠ THE BASE PLATE FLOATS CLEAR OF THE DATUM. Seated on it, its own label sat
   inside the grid's far-right corner — the one place on this crop where the
   plane reaches further right than the stack does, because depth adds screen
   x as well as screen y. */
export const PLATE_Z0 = 0.5;
export const PLATE_LIFT = 0.82;
/** The corner cut: R4's module rung, not the plate rung (ADR-098 U5). */
export const PLATE_CUT = 0.2;

/** Where the label column starts, and how wide it is. */
export const LABEL_X = 190;
export const LABEL_MEASURE = XP_VB.w - LABEL_X - 8;
/** Honest estimates of the rendered type, in crop units (the fit guard's input). */
export const LABEL_TYPE = 11;
export const NOTE_TYPE = 12;
/** A sans advance against PT Mono's 0.68 — a note is prose, not chrome. */
export const NOTE_ADVANCE = 0.5;

export const plateZ = (i: number) => PLATE_Z0 + i * PLATE_LIFT;

/**
 * The plates, BASE FIRST. SVG has no z-buffer, so the order is the paint
 * order: the top plate drawn last is the top plate in front of the verticals
 * that pass behind it.
 */
export function explodedPlates(count: number): readonly IsoPlatePaths[] {
  return Array.from({ length: count }, (_, i) =>
    isoPlate(
      { a: PLATE.a, b: PLATE.b, w: PLATE.w, d: PLATE.d, z: plateZ(i), h: PLATE.t },
      PLATE_CUT,
      XP_FRAME
    )
  );
}

/** The four verticals the stack is exploded along, floor to the top plate. */
export function explodedTies(count: number): readonly string[] {
  const zTop = plateZ(count - 1) + PLATE.t + 0.24;
  const corners: readonly [number, number][] = [
    [PLATE.a, PLATE.b],
    [PLATE.a + PLATE.w, PLATE.b],
    [PLATE.a + PLATE.w, PLATE.b + PLATE.d],
    [PLATE.a, PLATE.b + PLATE.d],
  ];
  return corners.map(([a, b]) =>
    isoPath([isoProject(a, b, 0, XP_FRAME), isoProject(a, b, zTop, XP_FRAME)])
  );
}

/** The datum, ruled both ways: a little wider than the footprint each side. */
export function explodedGrid() {
  return isoGrid(-0.16, -0.12, PLATE.w + 0.32, PLATE.d + 0.24, 0, 0.4, XP_FRAME);
}

export function explodedDust(): readonly Pt[] {
  return isoDust(ISO_SEED, 22, -0.16, -0.12, PLATE.w + 0.32, PLATE.d + 0.24, 3.2, XP_FRAME);
}

/** How many lines a note wraps to in the label column, at the rendered type. */
export const noteLines = (text: string) =>
  Math.max(1, Math.ceil((text.length * NOTE_TYPE * NOTE_ADVANCE) / LABEL_MEASURE));

export interface ExplodedSeat {
  /** The plate's own index, base first. */
  i: number;
  /** The leader from the plate's screen-right corner to its label. */
  leader: string;
  label: { ax: number; at: number };
}

/**
 * A label sits LEVEL with the corner it names, so the leader is one straight
 * run and the eye does not have to follow a bend to know which plate a word
 * belongs to.
 */
export function explodedSeats(count: number): readonly ExplodedSeat[] {
  return explodedPlates(count).map((plate, i) => ({
    i,
    leader: isoLeader(plate.right, { x: LABEL_X - 8, y: plate.right.y }),
    label: isoFraction({ x: LABEL_X, y: plate.right.y }, XP_FRAME),
  }));
}

/**
 * Everything the drawing names, for the fit guard. The record is top-first and
 * the plates are base-first, so the seat of layer `j` is plate `count-1-j`.
 */
export function explodedLabels(
  layers: readonly { id: string; label: string; note?: string }[]
): readonly IsoLabel[] {
  const seats = explodedSeats(layers.length);
  const out: IsoLabel[] = [];
  layers.forEach((layer, j) => {
    const seat = seats[layers.length - 1 - j];
    out.push({
      id: `${layer.id}-label`,
      text: layer.label,
      ax: seat.label.ax,
      at: seat.label.at,
      anchor: "start",
      vAlign: "bottom",
    });
    if (layer.note) {
      out.push({
        id: `${layer.id}-note`,
        text: layer.note,
        ax: seat.label.ax,
        at: seat.label.at,
        anchor: "start",
        vAlign: "top",
        lines: noteLines(layer.note),
        measure: Math.min(LABEL_MEASURE, layer.note.length * NOTE_TYPE * NOTE_ADVANCE),
      });
    }
  });
  return out;
}

/** Every point the drawing uses, for the fit guard's containment walk. */
export function explodedExtent(count: number): readonly Pt[] {
  const zTop = plateZ(count - 1) + PLATE.t + 0.24;
  return [
    isoProject(-0.16, -0.12, 0, XP_FRAME),
    isoProject(PLATE.w + 0.16, -0.12, 0, XP_FRAME),
    isoProject(PLATE.w + 0.16, PLATE.d + 0.12, zTop, XP_FRAME),
    isoProject(-0.16, PLATE.d + 0.12, zTop, XP_FRAME),
  ];
}
