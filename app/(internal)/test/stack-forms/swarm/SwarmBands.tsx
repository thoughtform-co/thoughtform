"use client";

/* S4·B · SWARM, BANDED. S4 in the material of the homepage's Arc sphere
   (owner, 2026-10-13: S4 "looks a bit too much like a Christmas decoration
   … more minimalistic", and "it would be amazing if it would fit the
   aesthetic of our Arc 3D three.js thing on our homepage").

   One hue: gold dots laid in rows, the brightness running along each row,
   a few white-hot; one thin axis down through the three plates and a second
   in the layer's own plane, each with a small solid arrowhead; each plate's
   step in an outlined tag with a diamond where it meets the plate. Nothing
   falls and there is no field behind it. The drawing is `bands.ts`. */

import type { FormProps } from "../model";
import { PLATES } from "../model";

import { BANDS } from "./bands";
import { useSwarmCanvas } from "./useSwarmCanvas";

export function SwarmBands({ open, motion }: FormProps) {
  const { wrap, canvas } = useSwarmCanvas(BANDS, open, motion);
  return (
    <div className="sfs" ref={wrap}>
      <canvas ref={canvas} className="sfs-canvas" aria-hidden />
      <div
        className="sfs-words"
        role="img"
        aria-label="Three square plates stacked on one axis, each made of rows of gold dots: your team, the layer and your agents"
      >
        {PLATES.map((p) => (
          <div key={p.key} className="sfs-tag" data-sfs-tag>
            <span className="sfs-tag__box">{p.step}</span>
            <span className="sfs-tag__name">{p.name}</span>
          </div>
        ))}
        <p className="sfs-total">
          <b data-sfs-fact="dots">0</b> dots, one hue
        </p>
      </div>
    </div>
  );
}
