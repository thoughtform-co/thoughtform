"use client";

import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ServiceStack } from "./ServiceStack";

interface ServicesPortalProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

/**
 * Mounts {@link ServiceStack} into the `[data-services-root]`
 * placeholder declared inside the `#services` station in the v7
 * prototype HTML (rendered into the page via `dangerouslySetInnerHTML`
 * by `LandingPage`). Cleans up on unmount.
 *
 * Mirrors `components/landing/v7/build-cases/BuildCasesPortal.tsx` —
 * the parsed station markup owns the wrapper + header, the React
 * portal owns the three sticky-stacking terminal cards.
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
    root.render(<ServiceStack />);

    return () => {
      const r = rootRef.current;
      rootRef.current = null;
      if (r) r.unmount();
    };
  }, [containerRef]);

  return null;
}
