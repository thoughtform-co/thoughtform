"use client";

/* S5 · PHOSPHOR. The stack set in type: every mark on the panel is one
   monospace character, lit like a beam on glass (after the owner's amber
   terminal, the white ASCII hand and the Romulus panels).

   The three plates are three FAMILIES of glyph (punctuation and letters,
   shade blocks, box-drawing), so they differ in kind before they differ in
   tone; a dotted column drops through each gap; a ladder gives each plate's
   true height; a line a plate is typed level with it, and under it what the
   plate holds. `raster.ts` composes the whole panel as one buffer of
   characters, purely, from the model.

   No bezel and no screen edge: the glyphs sit on the page's own ground. The
   one thing that moves is the cursor, and only while this is on screen. */

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import type { FormProps } from "../model";

import { CELL, rasterise } from "./raster";

export function Phosphor({ open, motion }: FormProps) {
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

  /* dragging the slider stays smooth: the panel follows a beat behind */
  const pose = useDeferredValue(open);
  const raster = useMemo(() => (grid ? rasterise(grid.cols, grid.rows, pose) : null), [grid, pose]);

  return (
    <div
      className="sfx"
      ref={ref}
      data-motion={motion}
      role="img"
      aria-label="Three square plates stacked, set in monospace characters: your team in letters and dots, the layer in solid blocks, your agents as a board of traces."
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
