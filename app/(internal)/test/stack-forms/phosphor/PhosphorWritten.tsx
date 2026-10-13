"use client";

/* S5·B · PHOSPHOR, WRITTEN (owner, 2026-10-13, on S5: "crazy but the middle
   panel looks a bit too much like Lego"; and of every direction, "it would
   be amazing if it would fit the aesthetic of our Arc 3D three.js thing on
   our homepage").

   The same panel of characters, with no shade block left on it. The step the
   layer stands for is Encode: it is what the team wrote down, so it is set
   in running words (context, skills, evals, row after row, a word in six
   white-hot), and its three strata are three rows spelling their own names.
   The agents' chip and modules are ruled frames with the tool's name inside.
   So the three plates are three kinds of writing: loose letters, dense
   running words, ruled frames; all of it finer than S5, nearer the grain of
   the homepage's sphere of gold dots.

   `raster.ts` composes it, purely, in its "written" setting; S5 itself
   (`Phosphor`, the "blocks" setting) is untouched, so the two compare. */

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import type { FormProps } from "../model";

import { CELL, rasterise } from "./raster";

export function PhosphorWritten({ open, motion }: FormProps) {
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
    () => (grid ? rasterise(grid.cols, grid.rows, pose, "written") : null),
    [grid, pose]
  );

  return (
    <div
      className="sfx sfx--w"
      ref={ref}
      data-motion={motion}
      role="img"
      aria-label="Three square plates stacked, set in monospace characters with no solid blocks: your team in letters and dots, the layer in running words (context, skills, evals), your agents as ruled frames on a board of traces."
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
