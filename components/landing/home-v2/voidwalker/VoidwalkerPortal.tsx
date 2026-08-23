"use client";

import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { VoidwalkerStation } from "./VoidwalkerStation";

interface VoidwalkerPortalProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

/**
 * Mounts {@link VoidwalkerStation} into the `[data-voidwalker-root]`
 * placeholder declared inside the `#voidwalker` station in the v7
 * prototype HTML (ADR-074). The station is plain DOM on every viewport —
 * there is no media gate and no static fallback markup; the rest state
 * (no `data-vw-ready`) IS the finished page.
 *
 * Deferred-macrotask unmount + root reuse: the `ServicesPortal` /
 * `AboutStagePortal` recipe verbatim (StrictMode / Fast Refresh safe — see
 * those files' comments).
 */
export function VoidwalkerPortal({ containerRef }: VoidwalkerPortalProps) {
  const rootRef = useRef<Root | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const container = containerRef.current;
    if (!container) return;

    const slot = container.querySelector<HTMLElement>("[data-voidwalker-root]");
    if (!slot) return;

    let root = rootRef.current;
    if (!root) {
      root = createRoot(slot);
      rootRef.current = root;
    }
    root.render(<VoidwalkerStation />);

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
