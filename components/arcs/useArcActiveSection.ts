"use client";

import { useEffect, useRef, useState } from "react";

import type { ArcMenuItem } from "./ArcShell";

/**
 * The arc's active section index — ONE observer, one source (ADR-073).
 *
 * Lifted out of the retired `ArcMenu` so the corner readout and anything
 * else that needs "where is the reader" answer from the same watcher
 * rather than two IOs that can disagree by a frame.
 *
 * ⚠ Under terminal motion (ADR-057) a section is a RUNWAY several
 * viewports tall, so watch its sticky STAGE instead: the stage is what
 * the reader is actually looking at, and the flip then lands when the
 * next beat parks rather than half a runway early. Reveal pages have no
 * stage and fall back to the section itself.
 *
 * Never a scroll listener — the arcs' one writer is `useArcScroll`
 * (ADR-002), and an index that changes on section boundaries has no
 * business sampling every frame.
 */
export function useArcActiveSection(items: readonly ArcMenuItem[]): number {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeRef = useRef(0);

  useEffect(() => {
    const watched = new Map<Element, number>();
    items.forEach((item, idx) => {
      const section = document.getElementById(item.id);
      if (!section) return;
      watched.set(section.querySelector(".arc-stage") ?? section, idx);
    });
    if (watched.size === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = watched.get(entry.target);
          if (idx !== undefined && idx !== activeRef.current) {
            activeRef.current = idx;
            setActiveIdx(idx);
          }
        }
      },
      // A thin band at the viewport midline — the section crossing it
      // is the active one.
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    watched.forEach((_, el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  return activeIdx;
}
