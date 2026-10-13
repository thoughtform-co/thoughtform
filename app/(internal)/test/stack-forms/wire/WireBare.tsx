/* S1·B · WIRE, BARE. S1 taken nearer its reference (owner, 2026-10-13: "I
   love S1 but maybe we can make a variation where it's a bit more wireframe
   like the unsiloed example"), and nearer the homepage's own nested dashed
   frames.

   What is gone: everything drawn ON the plates, the lists, the leaders, the
   facts block. What a plate is now:
     · a sheet (a hairline, a dashed frame set just outside it with a cross
       on each corner, a second dashed frame set well inside it);
     · an edge, the two near walls, deep enough to be lettered: its bracketed
       tag on one, its name on the other;
     · one small cube standing on its middle.
   The layer is the one washed in, and its cube the one solid thing. A
   readout band runs behind the stack at the layer's level and shows on both
   sides of it; a plumb line comes down to the layer's cube.

   Lines and the lettering on the walls are SVG in a 1600 x 1000 sheet (the
   lettering is sized to stay 12px at 1280 wide); the band's words are DOM. */

import { type CSSProperties, useId } from "react";

import {
  boxEdges,
  boxFaces,
  factsOf,
  fitFrame,
  type FormProps,
  leftMatrix,
  pathOf,
  plateFrame,
  PLATES,
  poseAt,
  project,
  type Pt,
  ptsOf,
  rightMatrix,
  SIDE,
  unitOf,
} from "../model";

const W = 1600;
const H = 1000;
const FRAME = fitFrame(W, H, poseAt(1), { pad: 64 });
const U = unitOf(FRAME);

/* a plate's edge, in units: deep enough for lettering that is 12px on a
   1280-wide screen */
const EDGE = 0.74;
const LETTER = 17;
/* the dashed frames: one just outside the sheet, one well inside it */
const OUTSET = 0.34;
const INSET = 1.15;
/* the cube on a plate's middle */
const CUBE = { half: 0.3, tall: 0.62 };
/* the readout band: how far it shows past the stack on each side */
const WING = 292;
const BAND_H = 50;
const METER = 20;

const at = (x: number, y: number): CSSProperties =>
  ({ "--px": (x / W).toFixed(5), "--py": (y / H).toFixed(5) }) as CSSProperties;
const cross = ([x, y]: Pt, r = 6) => `M${x - r} ${y}H${x + r}M${x} ${y - r}V${y + r}`;

export function WireBare({ open }: FormProps) {
  const glow = useId();
  const pose = poseAt(open);
  const facts = factsOf(pose);

  const zLow = pose.lift[2] - EDGE;
  const zHigh = pose.lift[0] + PLATES[0].top;
  const ghost = boxEdges(FRAME, { x0: 0, x1: SIDE, y0: 0, y1: SIDE, z0: zLow, z1: zHigh });

  /* the layer's level: its side corners, half way down its edge */
  const layerF = plateFrame(FRAME, pose, 1);
  const layerTop = PLATES[1].top;
  const lx = project(layerF, 0, SIDE, layerTop)[0];
  const rx = project(layerF, SIDE, 0, layerTop)[0];
  const bandY = project(layerF, SIDE, 0, layerTop - EDGE / 2)[1];
  const lit = Math.round(pose.open * METER);
  const cubeTop = project(layerF, SIDE / 2, SIDE / 2, layerTop + CUBE.tall);

  return (
    <div className="sfw sfwb" data-sf-variant="wire-b">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="sfw-svg"
        role="img"
        aria-label="The stack as a bare wireframe: three sheets in dashed hairline, each lettered on its edge, the layer washed in gold"
      >
        <defs>
          <linearGradient id={glow} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="var(--sf-gold)" stopOpacity="0.05" />
            <stop offset="0.5" stopColor="var(--sf-gold)" stopOpacity="0.34" />
            <stop offset="1" stopColor="var(--sf-gold)" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* the readout band, behind the stack: it shows on both sides */}
        <rect
          className="sfwb-band"
          x={lx - WING}
          y={bandY - BAND_H / 2}
          width={rx - lx + 2 * WING}
          height={BAND_H}
          fill={`url(#${glow})`}
        />
        <path
          className="sfwb-cross sfwb-cross--gold"
          d={(
            [
              [lx - WING, bandY - BAND_H / 2],
              [rx + WING, bandY - BAND_H / 2],
              [rx + WING, bandY + BAND_H / 2],
              [lx - WING, bandY + BAND_H / 2],
            ] as Pt[]
          )
            .map((p) => cross(p, 5))
            .join("")}
        />

        <path className="sfwb-ghost" d={ghost.hidden.map((s) => pathOf(s)).join("")} />

        {[2, 1, 0].map((n) => {
          const plate = PLATES[n];
          const f = plateFrame(FRAME, pose, plate.i);
          const top = plate.key === "layer" ? plate.top : plate.body[0].z1;
          const c = (x: number, y: number, z = top) => project(f, x, y, z);
          const quad = (d: number) => [
            c(-d, -d),
            c(SIDE + d, -d),
            c(SIDE + d, SIDE + d),
            c(-d, SIDE + d),
          ];
          const sheet = quad(0);
          const inner = quad(-INSET);
          /* the dashed frame goes round the whole plate, sheet and edge: its
             far half at the sheet's level, its near half under the edge, so
             it never runs across the lettering */
          const low = top - EDGE;
          const d = OUTSET;
          const outer = [
            c(-d, -d),
            c(SIDE + d, -d),
            c(SIDE + d, -d, low),
            c(SIDE + d, SIDE + d, low),
            c(-d, SIDE + d, low),
            c(-d, SIDE + d),
          ];
          const edge = boxFaces(f, { x0: 0, x1: SIDE, y0: 0, y1: SIDE, z0: top - EDGE, z1: top });
          const m = SIDE / 2;
          const cube = boxFaces(f, {
            x0: m - CUBE.half,
            x1: m + CUBE.half,
            y0: m - CUBE.half,
            y1: m + CUBE.half,
            z0: top,
            z1: top + CUBE.tall,
          });
          /* lettering laid on the two near walls, one sheet px a unit */
          const k = 1 / U;
          const mid = (SIDE * U) / 2;
          const base = (EDGE * U) / 2 + LETTER * 0.34;
          return (
            <g
              key={plate.key}
              className="sfwb-plate"
              data-tone={plate.tone}
              data-lit={plate.lit ? "" : undefined}
            >
              <polygon className="sfwb-wall" points={ptsOf(edge.left)} />
              <polygon className="sfwb-wall" points={ptsOf(edge.right)} />
              <polygon className="sfwb-sheet" points={ptsOf(sheet)} />
              <path className="sfwb-inner" d={pathOf(inner, true)} />
              <path className="sfwb-outer" d={pathOf(outer, true)} />
              <path
                className="sfwb-cross"
                d={[outer[0], outer[1], outer[3], outer[5]].map((p) => cross(p)).join("")}
              />

              <text
                className="sfwb-letter sfwb-letter--tag"
                transform={rightMatrix(f, SIDE, SIDE, top, k)}
                x={mid}
                y={base}
                fontSize={LETTER}
                textAnchor="middle"
              >
                [ {plate.step.toUpperCase()} ]
              </text>
              <text
                className="sfwb-letter"
                transform={leftMatrix(f, 0, SIDE, top, k)}
                x={mid}
                y={base}
                fontSize={LETTER}
                textAnchor="middle"
              >
                {plate.n} · {plate.name.toUpperCase()}
              </text>

              <polygon className="sfwb-cube sfwb-cube--l" points={ptsOf(cube.left)} />
              <polygon className="sfwb-cube sfwb-cube--r" points={ptsOf(cube.right)} />
              <polygon className="sfwb-cube sfwb-cube--t" points={ptsOf(cube.top)} />
            </g>
          );
        })}

        <path className="sfwb-ghost" d={ghost.visible.map((s) => pathOf(s)).join("")} />
        {/* the plumb line: down to the layer's cube, and no further */}
        <path className="sfwb-plumb" d={pathOf([[cubeTop[0], 28], cubeTop])} />

        {Array.from({ length: METER }, (_, n) => (
          <rect
            key={n}
            className="sfwb-meter"
            data-on={n < lit ? "" : undefined}
            x={rx + WING - 20 - (METER - n) * 7}
            y={bandY - 8}
            width={4}
            height={16}
          />
        ))}
      </svg>

      <div className="sfw-words">
        <span className="sfwb-band__l" style={at(lx - WING + 20, bandY)}>
          {facts.plates} plates · {facts.side} × {facts.side}
        </span>
        <span className="sfwb-band__r" style={at(rx + WING - 20 - METER * 7 - 14, bandY)}>
          Open {facts.openPct}%
        </span>
      </div>
    </div>
  );
}
