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

  useEffect(() => {
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
      rootsRef.current.forEach((root) => root.unmount());
      rootsRef.current.clear();
    };
  }, [containerRef]);

  return null;
}
