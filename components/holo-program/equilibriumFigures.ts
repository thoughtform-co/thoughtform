/**
 * equilibriumFigures — the opener's figures, one record each (ADR-143 U8/U9).
 *
 *   instrument  one axis read left to right: the thought, the gold gate, the
 *               stack of toothed rings (`equilibriumGeom.ts`, U8).
 *   river       a river of data through an isolated diorama: the high ground,
 *               the gate, the ruled plain (`equilibriumRiverGeom.ts`, U9).
 *
 * ⚠ THREE-FREE. The station's markup (server), the canvas's camera and the
 * tests all read a figure through this record, so a figure is one set of
 * numbers in every reader. The three words are the same three on both.
 */

import type { EqCameraSpec, P3 } from "./eqCamera";
import {
  EQ_ANCHORS,
  EQ_CAMERA,
  EQ_DRAG,
  EQ_FRAME,
  EQ_WORD_SEATS,
  eqContentSpan,
  eqSvgMarkup,
  seatWords,
} from "./equilibriumGeom";
import {
  RIVER_ANCHORS,
  RIVER_CAMERA,
  RIVER_DRAG,
  RIVER_FRAME,
  RIVER_WORD_SEATS,
  riverContentSpan,
  riverSeatWords,
  riverSvgMarkup,
} from "./equilibriumRiverGeom";

export type EqWordId = "upstream" | "encode" | "downstream";
export type EqFigureId = "instrument" | "river";

export interface EqFigure {
  id: EqFigureId;
  frame: { w: number; h: number };
  camera: EqCameraSpec;
  drag: { azimuthDeg: number; polarDeg: number };
  anchors: Readonly<Record<EqWordId, P3>>;
  seats: Readonly<Record<EqWordId, { anchor: "start" | "end"; dx: number }>>;
  seatWords: () => { id: EqWordId; ax: number; at: number }[];
  svgMarkup: (className: string) => string;
  contentSpan: () => { x0: number; x1: number };
}

export const EQ_FIGURES: Readonly<Record<EqFigureId, EqFigure>> = {
  instrument: {
    id: "instrument",
    frame: EQ_FRAME,
    camera: EQ_CAMERA,
    drag: EQ_DRAG,
    anchors: EQ_ANCHORS,
    seats: EQ_WORD_SEATS,
    seatWords,
    svgMarkup: eqSvgMarkup,
    contentSpan: eqContentSpan,
  },
  river: {
    id: "river",
    frame: RIVER_FRAME,
    camera: RIVER_CAMERA,
    drag: RIVER_DRAG,
    anchors: RIVER_ANCHORS,
    seats: RIVER_WORD_SEATS,
    seatWords: riverSeatWords,
    svgMarkup: riverSvgMarkup,
    contentSpan: riverContentSpan,
  },
};

/** The figure the live page shows. The river is look-dev until it is picked
 *  (`/test/equilibrium-lab?v=river`). */
export const EQ_FIGURE_LIVE: EqFigureId = "instrument";

export function isEqFigureId(v: unknown): v is EqFigureId {
  return v === "instrument" || v === "river";
}
