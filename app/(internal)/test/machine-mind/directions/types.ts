import type { BrainIsoBox, BrainView } from "@/components/arcs/figures/foundation/brainIso";
import type { MindTones, Side } from "../hull";

/** What every direction is drawn from: the camera, one hemisphere or both,
    the theme and its tones. The same options the act hands `brainIsoSvg`, so
    a picked direction drops into the act's `pictureOf`. */
export interface MindOptions {
  view: BrainView;
  /** One hemisphere alone (the layer beat parts the two); absent, both. */
  only?: Side;
  light: boolean;
  tones: MindTones;
}

/**
 * A live layer, painted on the stage's canvas every frame, in the picture's
 * own units: the context is already transformed so one unit is one unit of
 * the picture's box (`brainIsoBox(view)` unless the direction sets `box`).
 *
 *   t    seconds on the clock (frozen by `?t=` for stills); driven by the
 *        clock, never the frame
 *   px   device pixels per unit, to snap a dot to the device grid
 */
export interface MindLive {
  /** Under the picture (a ground the brain stands in). */
  under?(ctx: CanvasRenderingContext2D, t: number, px: number): void;
  /** Over the picture. */
  over?(ctx: CanvasRenderingContext2D, t: number, px: number): void;
}

export interface MindDirection {
  /** `today`, `d1` … `d6`: the `?v=` value. */
  id: string;
  name: string;
  /** One sentence, under the figure. */
  line: string;
  /** The picture: a whole standalone SVG document (`mindSvg`). Pure. */
  svg(o: MindOptions): string;
  /** A live layer, built once per options; absent or null, none. */
  live?(o: MindOptions): MindLive | null;
  /** The picture's box, when it is not the brain's own (`brainIsoBox`). */
  box?(o: MindOptions): BrainIsoBox;
}
