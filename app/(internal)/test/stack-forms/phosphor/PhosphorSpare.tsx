"use client";

/* S5·C · PHOSPHOR, SPARE (owner, 2026-10-13, on S5·B: "i think this needs not
   the 'evals' as a material; more minimalistic").

   S5 set the layer in blocks ("Lego"), S5·B in its own words, row after row.
   Here no face is filled with anything. Each plate is its outline, in sub-row
   strokes. The team is four outlined workstreams, each named once. The layer
   is a ruled page: lines of writing with the words left out, lying on it in
   the plate's own perspective, its three strata three edges down its walls.
   The agents are ruled frames with the tool's name inside, on a board of dim
   traces. Beside the stack there is a line a plate, the layer's three holds
   set once, the pose and the count; the ladder and the rest are gone.

   `raster.ts` composes it, purely, in its "spare" setting; S5 and S5·B are
   untouched, so the three compare. */

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import type { FormProps } from "../model";

import { CELL, rasterise } from "./raster";

export function PhosphorSpare({ open, motion }: FormProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [grid, setGrid] = useState<{ cols: number; rows: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const cols = Math.floor(entry.contentRect.width / CELL.w);
      const rows = Math.floor(entry.contentRect.height / CELL.h);
      setGrid((g) => (g && g.cols === cols && g.rows === rows ? g : { cols, rows }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pose = useDeferredValue(open);
  const raster = useMemo(
    () => (grid ? rasterise(grid.cols, grid.rows, pose, "spare") : null),
    [grid, pose]
  );

  return (
    <div
      className="sfx sfx--s"
      ref={ref}
      data-motion={motion}
      role="img"
      aria-label="Three square plates stacked, drawn in monospace characters as outlines with nothing filled in: your team as four outlined workstreams, the layer as a page of ruled lines, your agents as ruled frames on a board of traces."
    >
      {raster && (
        <pre className="sfx-grid" aria-hidden style={{ width: raster.cols * CELL.w }}>
          {raster.lines.map((runs, r) => (
            <div key={r} className="sfx-row">
              {runs.map((run, k) =>
                run.cls ? (
                  <span key={k} className={run.cls}>
                    {run.text}
                  </span>
                ) : (
                  run.text
                )
              )}
            </div>
          ))}
        </pre>
      )}
    </div>
  );
}
