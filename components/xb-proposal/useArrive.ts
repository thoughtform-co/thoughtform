"use client";

import { useEffect, useRef } from "react";

/** Stamps `data-in` on the element the first time a third of it is on
    screen: an arrival, played once, never an idle loop. Reduced motion and
    no-JS read the finished drawing (the CSS keys its motion on the stamp's
    ABSENCE being temporary, `[data-arrive]:not([data-in])`). */
export function useArrive<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.setAttribute("data-in", "");
      return;
    }
    el.setAttribute("data-arrive", "");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.setAttribute("data-in", "");
            io.disconnect();
          }
        }
      },
      { threshold: 0.33 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}
