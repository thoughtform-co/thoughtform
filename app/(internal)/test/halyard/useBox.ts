"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * The measured content box of an element, in CSS px. Drawings on this route
 * are laid out in real pixels (viewBox = the box), so type stays at its set
 * size at every viewport and only the geometry scales.
 */
export function useBox<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const r = el.getBoundingClientRect();
      setBox((b) => (Math.abs(b.w - r.width) < 0.5 && Math.abs(b.h - r.height) < 0.5 ? b : { w: r.width, h: r.height }));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, box] as const;
}

/** PT Mono advance (0.6em) plus the label tracking (.08em). */
export function monoWidth(text: string, size = 12, track = 0.08) {
  return text.length * size * (0.6 + track);
}
