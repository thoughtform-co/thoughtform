"use client";

import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { AboutStage } from "./AboutStage";

interface AboutStagePortalProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

/**
 * Mounts {@link AboutStage} into the `[data-about-root]` placeholder
 * declared inside the `#about` station in the v7 prototype HTML (ADR-047).
 * The static `.voidwalker` markup in the same station is the mobile /
 * reduced-motion / WebGL-fallback surface — the stage hides it via
 * `data-about-mode="stage"` only while the capable path is engaged.
 *
 * Deferred-macrotask unmount + root reuse: the `ServicesPortal` recipe
 * verbatim (StrictMode / Fast Refresh safe — see that file's comments).
 */
export function AboutStagePortal({ containerRef }: AboutStagePortalProps) {
  const rootRef = useRef<Root | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const container = containerRef.current;
    if (!container) return;

    const slot = container.querySelector<HTMLElement>("[data-about-root]");
    if (!slot) return;

    let root = rootRef.current;
    if (!root) {
      root = createRoot(slot);
      rootRef.current = root;
    }
    root.render(<AboutStage />);

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
