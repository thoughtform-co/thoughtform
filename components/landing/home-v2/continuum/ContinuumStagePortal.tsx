"use client";

import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ContinuumStage } from "./ContinuumStage";

interface ContinuumStagePortalProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

/**
 * Mounts {@link ContinuumStage} into the `[data-continuum-root]`
 * placeholder declared inside the `#continuum` station in the v7 prototype
 * HTML (ADR-049). The static `.continuum` / `.crail` markup in the same
 * station is the mobile / reduced-motion / WebGL-fallback surface — the
 * stage hides it via `data-continuum-mode="stage"` only while the capable
 * path is engaged.
 *
 * Deferred-macrotask unmount + root reuse: the `AboutStagePortal` /
 * `ServicesPortal` recipe verbatim (StrictMode / Fast Refresh safe — see
 * those files' comments).
 */
export function ContinuumStagePortal({ containerRef }: ContinuumStagePortalProps) {
  const rootRef = useRef<Root | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const container = containerRef.current;
    if (!container) return;

    const slot = container.querySelector<HTMLElement>("[data-continuum-root]");
    if (!slot) return;

    let root = rootRef.current;
    if (!root) {
      root = createRoot(slot);
      rootRef.current = root;
    }
    root.render(<ContinuumStage />);

    return () => {
      const r = rootRef.current;
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
