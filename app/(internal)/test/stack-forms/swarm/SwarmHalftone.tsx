"use client";

/* S4·G · SWARM, HALFTONE (owner, 2026-10-13: "i still like S4 Swarm … No
   lines at all: density and dot size carry the three plates. … can you make
   some iterations?").

   S4 with one thing changed: dot SIZE carries the three plates, alone. One
   lattice; every site of every plate holds a dot and none ever leaves its
   place; a dot is only larger or smaller, and its tone goes with its size.
   The layer is the light, its core the largest and whitest dots. The team's
   workstreams are four swells; the agents' chip and modules the large dots
   on a board of pinpoints. What moves is size too. The drawing is
   `halftone.ts`. */

import type { FormProps } from "../model";
import { PLATES } from "../model";

import { HALFTONE } from "./halftone";
import { useSwarmCanvas } from "./useSwarmCanvas";

export function SwarmHalftone({ open, motion }: FormProps) {
  const { wrap, canvas } = useSwarmCanvas(HALFTONE, open, motion);
  return (
    <div className="sfs" ref={wrap}>
      <canvas ref={canvas} className="sfs-canvas" aria-hidden />
      <div
        className="sfs-words"
        role="img"
        aria-label="Three square plates stacked, each one lattice of dots that differ only in size: your team in green, the layer in gold with a white-hot core, your agents in bone"
      >
        {PLATES.map((p) => (
          <p key={p.key} className="sfsh-label" data-sfsh-label data-tone={p.tone}>
            <span className="sfsh-label__step">
              {p.n} · {p.step}
            </span>
            <span className="sfsh-label__name">{p.name}</span>
          </p>
        ))}
        <p className="sfsh-fact">
          <b data-sfsh-fact="dots">0</b> dots, each in its place, sized{" "}
          <b data-sfsh-fact="span">0</b>
        </p>
      </div>
    </div>
  );
}
