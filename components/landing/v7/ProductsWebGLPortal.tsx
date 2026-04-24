"use client";

import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";

interface ProductsWebGLPortalProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

export function ProductsWebGLPortal({ containerRef }: ProductsWebGLPortalProps) {
  const rootRef = useRef<Root | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const el = container.querySelector<HTMLElement>("[data-products-webgl]");
    if (!el) return;

    let unmounted = false;

    import("./ProductsWebGLScene").then(({ ProductsWebGLScene }) => {
      if (unmounted) return;

      if (!rootRef.current) {
        rootRef.current = createRoot(el);
      }
      rootRef.current.render(<ProductsWebGLScene containerEl={el} />);
    });

    return () => {
      unmounted = true;
      if (rootRef.current) {
        rootRef.current.unmount();
        rootRef.current = null;
      }
    };
  }, [containerRef]);

  return null;
}
