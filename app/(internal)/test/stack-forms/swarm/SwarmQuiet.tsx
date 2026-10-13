"use client";

/* S4·C · SWARM, QUIET. The least S4 can be (owner, 2026-10-13: "Maybe we
   need to make it a bit more minimalistic").

   One even lattice of equal dots for all three plates. The team and the
   agents are dim; the layer is gold, and the tone is all that lights it.
   What a plate holds is the same dot a little brighter. Three plain labels.
   Nothing falls, nothing drifts, no field, no line. The drawing is
   `quiet.ts`. */

import type { FormProps } from "../model";
import { PLATES } from "../model";

import { QUIET } from "./quiet";
import { useSwarmCanvas } from "./useSwarmCanvas";

export function SwarmQuiet({ open, motion }: FormProps) {
  const { wrap, canvas } = useSwarmCanvas(QUIET, open, motion);
  return (
    <div className="sfs" ref={wrap}>
      <canvas ref={canvas} className="sfs-canvas" aria-hidden />
      <div
        className="sfs-words"
        role="img"
        aria-label="Three square plates stacked, each an even lattice of dots; the layer, in gold, is the one lit"
      >
        {PLATES.map((p) => (
          <p key={p.key} className="sfs-plain" data-sfs-plain data-lit={p.lit ? "" : undefined}>
            <span>{p.n}</span>
            <span>{p.step}</span>
            <span>{p.name}</span>
          </p>
        ))}
      </div>
    </div>
  );
}
