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
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Cancel a pending teardown from a just-fired cleanup (Strict Mode /
    // Fast Refresh mount→unmount→mount) so we REUSE the existing root
    // instead of tearing it down + recreating on the same node.
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

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
      // Defer the unmount one MACROTASK (setTimeout 0), not synchronously:
      // this root renders its own React tree asynchronously, so a
      // synchronous (or microtask) unmount lands mid-render and triggers
      // "Attempted to synchronously unmount a root while React was already
      // rendering". The effect above cancels this timer on remount and
      // reuses the root, so Strict Mode never tears down a reused root and
      // two roots never share one node. Mirrors useCorridorMount's cleanup.
      timerRef.current = window.setTimeout(() => {
        if (rootRef.current === r) {
          r?.unmount();
          rootRef.current = null;
        }
        timerRef.current = null;
      }, 0);
    };
  }, [containerRef]);

  return null;
}
