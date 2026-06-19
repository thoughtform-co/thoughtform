"use client";

import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ServicesStage } from "./ServicesStage";

interface ServicesPortalProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

/**
 * Mounts {@link ServicesStage} into the `[data-services-root]`
 * placeholder declared inside the `#services` station in the v7
 * prototype HTML (rendered into the page via `dangerouslySetInnerHTML`
 * by `LandingPage`). Cleans up on unmount.
 *
 * The parsed station markup is now a thin shell (section + corner
 * `.station__idx` only); the React portal owns the whole pinned stage
 * (left service list · centered particle brandmark · right paragraph).
 */
export function ServicesPortal({ containerRef }: ServicesPortalProps) {
  const rootRef = useRef<Root | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const slot = container.querySelector<HTMLElement>("[data-services-root]");
    if (!slot) return;

    let root = rootRef.current;
    if (!root) {
      root = createRoot(slot);
      rootRef.current = root;
    }
    root.render(<ServicesStage />);

    return () => {
      const r = rootRef.current;
      rootRef.current = null;
      if (r) r.unmount();
    };
  }, [containerRef]);

  return null;
}
