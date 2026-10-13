"use client";

/* S4·D · SWARM, BANDED, IN TONES (owner, 2026-10-13: "S4·B Swarm, banded but
   use the colors like S4 Swarm … but with the animations").

   S4·B's order: dots in rows, a whole edge to every plate, one axis through
   the three, each step in an outlined tag. S4's colours: the team green, the
   layer gold with a white-hot core, the agents bone. S4's motion, kept to
   the rows: the team's rows sway, dots fall off the front edges and file
   down the axis, runners step along the agents' traces. Nothing is
   scattered and there is no field behind it. The drawing is `tones.ts`. */

import type { FormProps } from "../model";
import { PLATES } from "../model";

import { TONES } from "./tones";
import { useSwarmCanvas } from "./useSwarmCanvas";

export function SwarmTones({ open, motion }: FormProps) {
  const { wrap, canvas } = useSwarmCanvas(TONES, open, motion);
  return (
    <div className="sfs" ref={wrap}>
      <canvas ref={canvas} className="sfs-canvas" aria-hidden />
      <div
        className="sfs-words"
        role="img"
        aria-label="Three square plates stacked on one axis, each made of rows of dots: your team in green, the layer in gold and your agents in bone"
      >
        {PLATES.map((p) => (
          <div key={p.key} className="sfst-tag" data-sfst-tag data-tone={p.tone}>
            <span className="sfst-tag__box">{p.step}</span>
            <span className="sfst-tag__name">{p.name}</span>
          </div>
        ))}
        <p className="sfs-total">
          <b data-sfst-fact="dots">0</b> dots in three plates
        </p>
      </div>
    </div>
  );
}
