"use client";

/* S4·E · SWARM, CLEAR (owner, 2026-10-13: "i still like S4 Swarm … the best;
   can you make some iterations?"). S4 with one thing changed: less.

   The stack is S4's own, dot for dot: the team's crowds, the layer's lattice
   and white-hot core, the agents' perfboard, chip, modules and runners, and
   its motion. Everything that is not the stack is gone: the field of dots
   behind it, the three lists and the dotted runs out to them, the block of
   readings, the count under each name. What falls is fewer and keeps to the
   open ground at the two wings. The drawing is `clear.ts`. */

import type { FormProps } from "../model";
import { PLATES } from "../model";

import { CLEAR } from "./clear";
import { useSwarmCanvas } from "./useSwarmCanvas";

export function SwarmClear({ open, motion }: FormProps) {
  const { wrap, canvas } = useSwarmCanvas(CLEAR, open, motion);
  return (
    <div className="sfs" ref={wrap}>
      <canvas ref={canvas} className="sfs-canvas" aria-hidden />
      <div
        className="sfs-words"
        role="img"
        aria-label="Three square plates stacked, each made only of dots: your team in green, the layer in gold and your agents in bone"
      >
        {PLATES.map((p) => (
          <p key={p.key} className="sfse-name" data-sfse-name data-tone={p.tone}>
            <i aria-hidden />
            <span className="sfse-name__step">{p.step}</span>
            <span className="sfse-name__what">{p.name}</span>
          </p>
        ))}
        <p className="sfse-total">
          <b data-sfse-fact="dots">0</b> dots
        </p>
      </div>
    </div>
  );
}
