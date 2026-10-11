import { path, seg, type IsoFrame, type Vec3 } from "./iso";

/**
 * THE LAYER. One isometric board in gold line work: three ruled lanes etched
 * on its top face (Context · Skills · Evals once section 2 opens it), a single
 * cut on its plan's far corner, and a short edge connector, the plug.
 *
 * Every direction on this route draws this exact object, and section 2 opens
 * the same geometry, so the page reads as one system. The board is long along
 * world y; the lanes run along it.
 */

export interface LayerProps {
  f: IsoFrame;
  /** World position of the board's back corner (min x, min y, base z). */
  at: Vec3;
  /** x-extent (short side), y-extent (long side), thickness. */
  w?: number;
  d?: number;
  t?: number;
  /** Which face carries the plug. */
  plug?: "x" | "y" | "none";
  /** Section 2 will add "open". */
  state?: "closed";
  className?: string;
}

/* Ruled marks per lane: lengths as fractions of the lane's run, three rows a
   lane. Fixed, so every render draws the same writing. */
const MARKS: readonly (readonly number[])[] = [
  [0.22, 0.12, 0.3, 0.16],
  [0.34, 0.1, 0.2],
  [0.14, 0.26, 0.12, 0.18],
  [0.28, 0.18, 0.24],
  [0.12, 0.3, 0.16, 0.1],
  [0.2, 0.14, 0.32],
  [0.3, 0.12, 0.22],
  [0.16, 0.24, 0.14, 0.12],
  [0.24, 0.1, 0.28],
];

export function Layer({ f, at, w = 96, d = 240, t = 9, plug = "x", className }: LayerProps) {
  const [X, Y, Z] = at;
  const c = Math.min(w, d) * 0.2; // the cut
  const top = Z + t;

  const P = (x: number, y: number, z: number): Vec3 => [X + x, Y + y, Z + z];

  const topFace = path(f, [P(0, 0, t), P(w - c, 0, t), P(w, c, t), P(w, d, t), P(0, d, t)]);
  const faceX = path(f, [P(w, c, t), P(w, d, t), P(w, d, 0), P(w, c, 0)]);
  const faceY = path(f, [P(0, d, t), P(w, d, t), P(w, d, 0), P(0, d, 0)]);

  /* Lanes: two separators split the short side in three; marks run along y. */
  const inset = 10;
  const laneW = (w - inset * 2) / 3;
  const runY0 = inset + c * 0.4;
  const runY1 = d - inset;
  const run = runY1 - runY0;
  const seps = [1, 2].map((i) =>
    seg(f, P(inset + laneW * i, runY0 - 4, t), P(inset + laneW * i, runY1, t))
  );
  const marks: string[] = [];
  for (let lane = 0; lane < 3; lane++) {
    for (let row = 0; row < 3; row++) {
      const x = inset + laneW * lane + (laneW * (row + 1)) / 4;
      const pattern = MARKS[(lane * 3 + row) % MARKS.length];
      let y = runY0 + 2;
      for (const frac of pattern) {
        const len = frac * run * 0.62;
        if (y + len > runY1) break;
        marks.push(seg(f, P(x, y, t), P(x, y + len, t)));
        y += len + run * 0.05;
      }
    }
  }

  /* The plug: a short tab off one face, with three pins on its top. */
  let plugNode: React.ReactNode = null;
  if (plug !== "none") {
    const pt = t * 0.62;
    const reach = 18;
    if (plug === "x") {
      const y0 = d * 0.42;
      const y1 = d * 0.58;
      const tabTop = path(f, [
        P(w, y0, pt),
        P(w + reach, y0, pt),
        P(w + reach, y1, pt),
        P(w, y1, pt),
      ]);
      const tabFront = path(f, [
        P(w + reach, y0, pt),
        P(w + reach, y1, pt),
        P(w + reach, y1, 0),
        P(w + reach, y0, 0),
      ]);
      const tabSide = path(f, [
        P(w, y1, pt),
        P(w + reach, y1, pt),
        P(w + reach, y1, 0),
        P(w, y1, 0),
      ]);
      const pins = [0.25, 0.5, 0.75].map((q) => {
        const y = y0 + (y1 - y0) * q;
        return seg(f, P(w + 3, y, pt), P(w + reach - 3, y, pt));
      });
      plugNode = (
        <g className="hy-layer__plug">
          <path d={tabFront} className="hy-gold-face" />
          <path d={tabSide} className="hy-gold-face" />
          <path d={tabTop} className="hy-gold-top" />
          <path d={pins.join(" ")} className="hy-gold-mark" />
        </g>
      );
    } else {
      const x0 = w * 0.3;
      const x1 = w * 0.7;
      const tabTop = path(f, [
        P(x0, d, pt),
        P(x1, d, pt),
        P(x1, d + reach, pt),
        P(x0, d + reach, pt),
      ]);
      const tabFront = path(f, [
        P(x0, d + reach, pt),
        P(x1, d + reach, pt),
        P(x1, d + reach, 0),
        P(x0, d + reach, 0),
      ]);
      const tabSide = path(f, [
        P(x1, d, pt),
        P(x1, d + reach, pt),
        P(x1, d + reach, 0),
        P(x1, d, 0),
      ]);
      const pins = [0.25, 0.5, 0.75].map((q) => {
        const x = x0 + (x1 - x0) * q;
        return seg(f, P(x, d + 3, pt), P(x, d + reach - 3, pt));
      });
      plugNode = (
        <g className="hy-layer__plug">
          <path d={tabFront} className="hy-gold-face" />
          <path d={tabSide} className="hy-gold-face" />
          <path d={tabTop} className="hy-gold-top" />
          <path d={pins.join(" ")} className="hy-gold-mark" />
        </g>
      );
    }
  }

  return (
    <g className={`hy-layer ${className ?? ""}`} data-top={top}>
      <path d={faceX} className="hy-gold-face" />
      <path d={faceY} className="hy-gold-face" />
      <path d={topFace} className="hy-gold-top" />
      <path d={seps.join(" ")} className="hy-gold-sep" />
      <path d={marks.join(" ")} className="hy-gold-mark" />
      {plugNode}
    </g>
  );
}
