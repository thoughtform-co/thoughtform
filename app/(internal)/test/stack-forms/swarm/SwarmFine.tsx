"use client";

/* S4·F · SWARM, FINE (owner, 2026-10-13: "i still like S4 Swarm … the best;
   can you make some iterations?").

   S4 with one thing changed: more. The same three populations and the same
   three tones on the finest lattice whole pixels allow, so a plate stops
   being a dotted outline and becomes a lit surface, and the stack stands as
   tall as the frame lets the opened pose stand. Nothing is behind it. A name
   a plate and one line of figures are all the words. The drawing is
   `fine.ts`. */

import type { FormProps } from "../model";
import { PLATES } from "../model";

import { FINE } from "./fine";
import { useSwarmCanvas } from "./useSwarmCanvas";

export function SwarmFine({ open, motion }: FormProps) {
  const { wrap, canvas } = useSwarmCanvas(FINE, open, motion);
  return (
    <div className="sfs" ref={wrap}>
      <canvas ref={canvas} className="sfs-canvas" aria-hidden />
      <div
        className="sfs-words"
        role="img"
        aria-label="Three square plates stacked, each made only of fine dots: your team in green, the layer in gold with a white-hot core, and your agents in bone"
      >
        {PLATES.map((p) => (
          <div key={p.key} className="sfsf-name" data-sfsf-name data-tone={p.tone}>
            <span className="sfsf-name__step">{p.step}</span>
            <span className="sfsf-name__what">{p.name}</span>
          </div>
        ))}
        <p className="sfsf-total">
          <span>
            <b data-sfsf-fact="dots">0</b> dots in three plates
          </span>
          <span>
            lattice <i data-sfsf-fact="grid">0</i>
          </span>
        </p>
      </div>
    </div>
  );
}
