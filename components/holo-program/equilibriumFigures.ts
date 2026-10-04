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
  eqContentSpan,
  eqSvgMarkup,
  seatWords,
} from "./equilibriumGeom";
import {
  RIVER_ANCHORS,
  RIVER_CAMERA,
  RIVER_DRAG,
  RIVER_FRAME,
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
  /** How far the reader may turn it either side of rest; an infinite
   *  azimuth is a free turn, all the way round. */
  drag: { azimuthDeg: number; polarDeg: number };
  /** What each word tracks, holo.ui8's way: a bracketed point on the object. */
  anchors: Readonly<Record<EqWordId, P3>>;
  /** The glow on void (paper keeps its threshold above the paper). The
   *  instrument runs holo.ui8's softer, wider bloom (U10). */
  bloom: { intensity: number; radius: number; threshold: number };
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
    bloom: { intensity: 1.05, radius: 0.86, threshold: 0.56 },
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
    bloom: { intensity: 0.6, radius: 0.7, threshold: 0.62 },
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

/** A tracker's readout, holo.ui8's own grammar (`TRK 07 · X0.44 Y0.45 ·
 *  LOCK`): where its point is on the frame, as fractions. One formatter for
 *  the server's seat and the live mount's, so the swap moves no character. */
export function trackerReadout(x: number, y: number): string {
  return ` · X${x.toFixed(2)} Y${y.toFixed(2)} · LOCK`;
}

/** The bearing readout: the eye's azimuth, folded onto 0 to 360, and its
 *  elevation, both to a tenth of a degree. */
export function bearingReadout(azDeg: number, elDeg: number): { az: string; el: string } {
  const a = ((azDeg % 360) + 360) % 360;
  return { az: `${a.toFixed(1).padStart(5, "0")}°`, el: `${elDeg.toFixed(1)}°` };
}
