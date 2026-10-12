"use client";

import { useState } from "react";

import type { ArcListGroup } from "@/lib/arcs/types";

import { Lead, PhaseFoot, PhaseItems, label } from "./parts";

/** E · one frame, voidzero's index: the phases listed on the left, the
    chosen one open beside it, done when in its own cell. */
export function WeeksIndexBody({ groups }: { groups: readonly ArcListGroup[] }) {
  const [on, setOn] = useState(0);
  const g = groups[on];
  return (
      <div className="xf-frame xf-index">
        <nav className="xf-cell xf-index__nav" aria-label="Phases">
          {groups.map((x, i) => (
            <button
              key={x.id}
              type="button"
              className="xf-index__btn"
              aria-pressed={i === on}
              onClick={() => setOn(i)}
            >
              <span className="xf-mono">{label(x.label)}</span>
              <span className="xf-index__name">{x.blurb}</span>
            </button>
          ))}
        </nav>
        <div className="xf-cell xf-index__body">
          <span className="xf-mono">{label(g.label)}</span>
          <Lead lead={`${g.blurb}.`} />
          <PhaseItems g={g} n={on + 1} />
        </div>
        <div className="xf-cell xf-index__foot">
          <PhaseFoot g={g} />
        </div>
      </div>
  );
}

