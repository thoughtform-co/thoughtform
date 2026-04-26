"use client";

import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { BuildCases } from "./BuildCases";

interface BuildCasesPortalProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

/**
 * Mounts {@link BuildCases} into the `[data-build-cases-root]` placeholder
 * that lives inside the v7 prototype HTML (rendered into the page via
 * `dangerouslySetInnerHTML`). Cleans up on unmount, mirroring the pattern
 * used by `CelestialPortals` and `PhaseGlyphPortals`.
 */
export function BuildCasesPortal({ containerRef }: BuildCasesPortalProps) {
  const rootRef = useRef<Root | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const slot = container.querySelector<HTMLElement>("[data-build-cases-root]");
    if (!slot) return;

    let root = rootRef.current;
    if (!root) {
      root = createRoot(slot);
      rootRef.current = root;
    }
    root.render(<BuildCases />);

    return () => {
      const r = rootRef.current;
      rootRef.current = null;
      if (r) r.unmount();
    };
  }, [containerRef]);

  return null;
}
