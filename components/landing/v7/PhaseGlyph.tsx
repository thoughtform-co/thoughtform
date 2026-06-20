"use client";

import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { PhaseGlyphSvg, type PracticePhaseGlyph } from "./PhaseGlyphSvg";

export type { PracticePhaseGlyph };

export const PRACTICE_PHASE_GLYPHS: readonly PracticePhaseGlyph[] = ["navigate", "encode", "build"];

interface PhaseGlyphPortalsProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

/**
 * Mounts a <PhaseGlyphSvg/> into each [data-phase-glyph] placeholder found
 * inside the dangerouslySetInnerHTML container. Same portal pattern as
 * CelestialPortals — clean up on unmount.
 */
export function PhaseGlyphPortals({ containerRef }: PhaseGlyphPortalsProps) {
  const rootsRef = useRef<Map<string, Root>>(new Map());
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Cancel a pending teardown from a just-fired cleanup (Strict Mode /
    // Fast Refresh mount→unmount→mount) so we REUSE the existing roots.
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const container = containerRef.current;
    if (!container) return;

    for (const phase of PRACTICE_PHASE_GLYPHS) {
      const el = container.querySelector<HTMLElement>(`[data-phase-glyph="${phase}"]`);
      if (!el) continue;

      let root = rootsRef.current.get(phase);
      if (!root) {
        root = createRoot(el);
        rootsRef.current.set(phase, root);
      }
      root.render(<PhaseGlyphSvg phase={phase} />);
    }

    return () => {
      // Defer the unmounts one MACROTASK (setTimeout 0): each glyph root
      // renders its own React tree asynchronously, so a synchronous (or
      // microtask) unmount lands mid-render and triggers "Attempted to
      // synchronously unmount a root while React was already rendering".
      // The effect above cancels this timer on remount so Strict Mode
      // reuses the roots; the guard skips teardown if a remount swapped
      // the map. Mirrors useCorridorMount's cleanup.
      const roots = rootsRef.current;
      timerRef.current = window.setTimeout(() => {
        if (rootsRef.current === roots) {
          roots.forEach((root) => root.unmount());
          rootsRef.current = new Map();
        }
        timerRef.current = null;
      }, 0);
    };
  }, [containerRef]);

  return null;
}
