/* The stack with no manner at all: each plate's solids as three flat faces.
   It proves the contract (`model/`) and stands in for a direction that is
   not drawn yet. It is not one of the five. */

import {
  boxFaces,
  fitFrame,
  type FormProps,
  over,
  plateFrame,
  PLATES,
  poseAt,
  ptsOf,
  toneVar,
} from "./model";

const W = 1600;
const H = 1000;
/* seated for the opened pose, so opening the stack never rescales it */
const FRAME = fitFrame(W, H, poseAt(1), { pad: 90 });

export function Plain({ open }: FormProps) {
  const pose = poseAt(open);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="sf-svg" role="img" aria-label="The stack, undrawn">
      {[2, 1, 0].map((n) => {
        const plate = PLATES[n];
        const f = plateFrame(FRAME, pose, plate.i);
        return (
          <g key={plate.key} stroke={toneVar(plate.tone)} strokeWidth={1}>
            {plate.body.map((b, k) => {
              const faces = boxFaces(f, b);
              return (
                <g key={k}>
                  <polygon points={ptsOf(faces.left)} fill={over(plate.tone, 0.1)} />
                  <polygon points={ptsOf(faces.right)} fill={over(plate.tone, 0.06)} />
                  <polygon points={ptsOf(faces.top)} fill={over(plate.tone, 0.16)} />
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
