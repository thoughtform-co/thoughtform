/* S1 · WIRE. The stack as a drafting sheet (after unsiloed.ai: flat sheets
   in dashed and solid hairline, a registration cross on every corner, guides
   run past the corners, a ghost box round the whole, one sheet washed in, a
   readout band, bracketed tags).

   What the plates are made of: HAIRLINE AND WASH. No plate has a thickness.
   They differ in kind, not in fill:
     · the team is one sheet with four windows cut in it and a ruled margin;
     · the layer is three leaves, one a stratum, the top one washed gold;
     · the agents are one sheet with a chip, four modules and their traces.
   A plumb line runs down through all three and marks where it pierces each.
   The ghost box and its four posts make the three one stack.

   Every number lettered is the stack's own (`factsOf`), and every word is the
   proposal's. Lines are SVG in a 1600 x 1000 sheet; words are DOM seated in
   percent of it, so they never fall under 12px. */

import type { CSSProperties } from "react";

import {
  boxEdges,
  factsOf,
  fitFrame,
  type FormProps,
  lifted,
  pathOf,
  plateFrame,
  PLATES,
  poseAt,
  project,
  type Pt,
  ptsOf,
  SIDE,
} from "../model";

const W = 1600;
const H = 1000;
/* seated for the opened pose, in the middle: what each plate holds stands on
   its left, its tag on its right */
const FRAME = fitFrame(W, H, poseAt(1), { pad: 62 });
/* how far off the stack's corners the words start, and the readout band's
   reach past the stack */
const REACH = 64;
const TAG_X = project(FRAME, SIDE, 0, 0)[0] + REACH;
const HOLDS_X = project(FRAME, 0, SIDE, 0)[0] - REACH;
/* the band stops short of the stack's side corners, so no plate's leader
   ever runs along it */
const BAND = { inset: 44, h: 54 };
const METER = 20;

const at = (x: number, y: number): CSSProperties =>
  ({ "--px": (x / W).toFixed(5), "--py": (y / H).toFixed(5) }) as CSSProperties;

/** An upright registration cross. */
const cross = ([x, y]: Pt, r = 7) => `M${x - r} ${y}H${x + r}M${x} ${y - r}V${y + r}`;

/** A segment run past both its ends by `d` px. */
function past(a: Pt, b: Pt, d: number): [Pt, Pt] {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const ux = ((b[0] - a[0]) / len) * d;
  const uy = ((b[1] - a[1]) / len) * d;
  return [
    [a[0] - ux, a[1] - uy],
    [b[0] + ux, b[1] + uy],
  ];
}

/* the sheet's own field: a small cross every 100, quiet */
const FIELD = Array.from({ length: 15 }, (_, i) =>
  Array.from({ length: 9 }, (_, j) => cross([100 + i * 100, 100 + j * 100], 4)).join("")
).join("");

export function Wire({ open }: FormProps) {
  const pose = poseAt(open);
  const facts = factsOf(pose);

  /* the whole stack's box: the agents' floor to the team's top */
  const zLow = pose.lift[2];
  const zHigh = pose.lift[0] + PLATES[0].top;
  const ghost = boxEdges(FRAME, { x0: 0, x1: SIDE, y0: 0, y1: SIDE, z0: zLow, z1: zHigh });
  const hi = lifted(FRAME, zHigh);
  const lo = lifted(FRAME, zLow);
  const ghostCorners: Pt[] = [
    project(hi, 0, 0, 0),
    project(hi, SIDE, 0, 0),
    project(hi, SIDE, SIDE, 0),
    project(hi, 0, SIDE, 0),
    project(lo, SIDE, 0, 0),
    project(lo, SIDE, SIDE, 0),
    project(lo, 0, SIDE, 0),
  ];
  const plumb: [Pt, Pt] = [
    project(FRAME, SIDE / 2, SIDE / 2, zHigh + 2.4),
    project(FRAME, SIDE / 2, SIDE / 2, zLow - 1.5),
  ];

  /* the readout band: screen-level, across the layer's near corner */
  const layerF = plateFrame(FRAME, pose, 1);
  const near = project(layerF, SIDE, SIDE, PLATES[1].top);
  const band = {
    x0: project(layerF, 0, SIDE, 0)[0] + BAND.inset,
    x1: project(layerF, SIDE, 0, 0)[0] - BAND.inset,
    y0: near[1] - BAND.h / 2,
    y1: near[1] + BAND.h / 2,
  };
  const bandCorners: Pt[] = [
    [band.x0, band.y0],
    [band.x1, band.y0],
    [band.x1, band.y1],
    [band.x0, band.y1],
  ];
  const lit = Math.round(pose.open * METER);

  return (
    <div className="sfw" data-sf-variant="wire">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="sfw-svg"
        role="img"
        aria-label="The stack as a drafting sheet: three flat plates in hairline, the layer washed in gold"
      >
        <path className="sfw-field" d={FIELD} />

        {/* the ghost box: far edges first, behind everything */}
        <path className="sfw-ghost" d={ghost.hidden.map((s) => pathOf(s)).join("")} />

        {[2, 1, 0].map((n) => {
          const plate = PLATES[n];
          const f = plateFrame(FRAME, pose, plate.i);
          /* the plate's leaves: one sheet, or the layer's three strata */
          const leaves = plate.key === "layer" ? plate.body.map((b) => b.z1) : [plate.body[0].z1];
          const top = leaves[leaves.length - 1];
          const c = (x: number, y: number, z = top) => project(f, x, y, z);
          const corners = [c(0, 0), c(SIDE, 0), c(SIDE, SIDE), c(0, SIDE)];
          const mid = SIDE / 2;
          return (
            <g
              key={plate.key}
              className="sfw-plate"
              data-tone={plate.tone}
              data-lit={plate.lit ? "" : undefined}
            >
              {leaves.map((z, k) => {
                const q = [c(0, 0, z), c(SIDE, 0, z), c(SIDE, SIDE, z), c(0, SIDE, z)];
                const isTop = k === leaves.length - 1;
                return (
                  <g key={k}>
                    <polygon
                      className={isTop ? "sfw-sheet sfw-sheet--top" : "sfw-sheet"}
                      points={ptsOf(q)}
                    />
                    {/* far edges dashed, near edges solid */}
                    <path className="sfw-far" d={pathOf([q[3], q[0], q[1]])} />
                    <path className="sfw-near" d={pathOf([q[1], q[2], q[3]])} />
                  </g>
                );
              })}

              {/* guides: every edge of the top leaf run past its corners */}
              <path
                className="sfw-guide"
                d={corners.map((p, k) => pathOf(past(p, corners[(k + 1) % 4], 30))).join("")}
              />

              {/* what the plate holds, drawn in its plane */}
              {plate.features.map((ft) => {
                const b = ft.box;
                if (ft.kind === "stratum") return null;
                if (ft.kind === "rail")
                  return (
                    <path
                      key={ft.id}
                      className="sfw-rule"
                      d={Array.from({ length: 11 }, (_, k) => {
                        const y = b.y0 + 0.2 + k * 0.68;
                        return pathOf([c(b.x0, y), c(b.x1, y)]);
                      }).join("")}
                    />
                  );
                const q = [c(b.x0, b.y0), c(b.x1, b.y0), c(b.x1, b.y1), c(b.x0, b.y1)];
                return (
                  <g key={ft.id}>
                    <polygon className={`sfw-part sfw-part--${ft.kind}`} points={ptsOf(q)} />
                    <path
                      className="sfw-tick"
                      d={cross(c((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2), 4)}
                    />
                  </g>
                );
              })}
              {plate.traces.map((t) => (
                <path key={t.id} className="sfw-trace" d={pathOf(t.pts.map(([x, y]) => c(x, y)))} />
              ))}

              {/* a cross on every corner, and where the plumb line pierces */}
              <path className="sfw-cross" d={corners.map((p) => cross(p)).join("")} />
              <polygon
                className="sfw-pierce"
                points={ptsOf([
                  c(mid - 0.22, mid - 0.22),
                  c(mid + 0.22, mid - 0.22),
                  c(mid + 0.22, mid + 0.22),
                  c(mid - 0.22, mid + 0.22),
                ])}
              />

              {/* the two leaders, off the plate's side corners */}
              <path className="sfw-leader" d={pathOf([c(SIDE, 0), [TAG_X - 16, c(SIDE, 0)[1]]])} />
              <path
                className="sfw-leader"
                d={pathOf([c(0, SIDE), [HOLDS_X + 16, c(0, SIDE)[1]]])}
              />
            </g>
          );
        })}

        {/* the ghost box's near edges and corners, over the plates */}
        <path className="sfw-ghost" d={ghost.visible.map((s) => pathOf(s)).join("")} />
        <path
          className="sfw-cross sfw-cross--ghost"
          d={ghostCorners.map((p) => cross(p, 5)).join("")}
        />
        <path className="sfw-plumb" d={pathOf(plumb)} />

        {/* the readout band, and its meter: one tick lit a twentieth opened */}
        <rect
          className="sfw-band"
          x={band.x0}
          y={band.y0}
          width={band.x1 - band.x0}
          height={BAND.h}
        />
        <path
          className="sfw-cross sfw-cross--band"
          d={bandCorners.map((p) => cross(p, 5)).join("")}
        />
        {Array.from({ length: METER }, (_, k) => (
          <rect
            key={k}
            className="sfw-meter"
            data-on={k < lit ? "" : undefined}
            x={band.x1 - 22 - (METER - k) * 7}
            y={near[1] - 8}
            width={4}
            height={16}
          />
        ))}
      </svg>

      {/* every word, seated in the sheet */}
      <div className="sfw-words">
        {PLATES.map((plate) => {
          const f = plateFrame(FRAME, pose, plate.i);
          const z = plate.key === "layer" ? plate.top : plate.body[0].z1;
          const y = project(f, SIDE, 0, z)[1];
          return [
            <p key={plate.key} className="sfw-tag" data-tone={plate.tone} style={at(TAG_X, y)}>
              <span className="sfw-tag__n">
                {plate.n} <b>[ {plate.step} ]</b>
              </span>
              <span className="sfw-tag__name">{plate.name}</span>
            </p>,
            /* what it holds, by name, off its other corner */
            <ul
              key={`${plate.key}-holds`}
              className="sfw-holds"
              data-tone={plate.tone}
              style={at(HOLDS_X, y)}
            >
              {plate.holds.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>,
          ];
        })}

        <span className="sfw-band__l" style={at(band.x0 + 18, near[1])}>
          [ {PLATES[1].step} ]
        </span>
        <span className="sfw-band__r" style={at(band.x1 - 22 - METER * 7 - 14, near[1])}>
          Open {facts.openPct}%
        </span>

        <dl className="sfw-block" style={at(62, H - 62)}>
          <div>
            <dt>Plates</dt>
            <dd>{facts.plates}</dd>
          </div>
          <div>
            <dt>Side</dt>
            <dd>
              {facts.side} × {facts.side}
            </dd>
          </div>
          <div>
            <dt>Pitch</dt>
            <dd>{facts.pitch.toFixed(2)}</dd>
          </div>
          <div>
            <dt>Height</dt>
            <dd>{facts.height.toFixed(2)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
