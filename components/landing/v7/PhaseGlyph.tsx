"use client";

import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { DiagramSvg } from "./CelestialConnector";
import { PHASE_GLYPH_CONFIGS } from "./phaseGlyphConfigs";

type Phase = keyof typeof PHASE_GLYPH_CONFIGS;
const PHASES = Object.keys(PHASE_GLYPH_CONFIGS) as Phase[];

interface PhaseGlyphPortalsProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

/**
 * Mounts a <DiagramSvg/> into each [data-phase-glyph] placeholder found
 * inside the dangerouslySetInnerHTML container. Same portal pattern as
 * CelestialPortals — clean up on unmount.
 */
export function PhaseGlyphPortals({ containerRef }: PhaseGlyphPortalsProps) {
  const rootsRef = useRef<Map<string, Root>>(new Map());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    for (const phase of PHASES) {
      const el = container.querySelector<HTMLElement>(`[data-phase-glyph="${phase}"]`);
      if (!el) continue;

      let root = rootsRef.current.get(phase);
      if (!root) {
        root = createRoot(el);
        rootsRef.current.set(phase, root);
      }
      root.render(<DiagramSvg config={PHASE_GLYPH_CONFIGS[phase]} />);
    }

    return () => {
      rootsRef.current.forEach((root) => root.unmount());
      rootsRef.current.clear();
    };
  }, [containerRef]);

  return null;
}
