"use client";

import { useEffect, useState } from "react";

import { computeRowDetents } from "../rowDetents";

/**
 * The readout-row detent table, rebuilt on mount / resize / layout only.
 *
 * NEVER per scroll frame — same invariant the production rail carries
 * (ADR-031 "no scroll writer"): a mark's position is a pure function of the
 * table plus the active row; scroll only re-resolves WHICH row is active.
 *
 * `ready` gates the bracket's glide, mirroring `RailManifestController`'s
 * `data-ready`: it flips one frame after the first measured position is
 * flushed, so a mid-page reload paints AT its detent instead of sliding
 * down from the top of the rail.
 */
export function useRowDetents(): { detents: (number | null)[]; ready: boolean } {
  const [detents, setDetents] = useState<(number | null)[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const next = computeRowDetents();
      setDetents((prev) =>
        prev.length === next.length && prev.every((v, i) => v === next[i]) ? prev : next
      );
    };
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(measure);
    };

    measure();
    // Enable the glide only after the first measured position is flushed.
    const readyRaf = requestAnimationFrame(() => setReady(true));

    window.addEventListener("resize", schedule);
    window.addEventListener("load", schedule);
    const ro = new ResizeObserver(schedule);
    ro.observe(document.body);

    return () => {
      window.removeEventListener("resize", schedule);
      window.removeEventListener("load", schedule);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      cancelAnimationFrame(readyRaf);
    };
  }, []);

  return { detents, ready };
}
