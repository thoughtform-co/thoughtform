"use client";

import { useEffect, useRef, useState } from "react";

/**
 * useReveal — flips `inView` to true the first time the element scrolls
 * into the viewport, then disconnects.
 *
 * The v7 landing reveals static `[data-m]` elements via a single
 * IntersectionObserver set up once in `useRevealMotion`. The Services
 * cards are React-portaled (`ServicesPortal` mounts them AFTER that
 * observer has captured its targets), so the global observer never sees
 * them. This hook gives each card its own one-shot observer; the
 * component reflects `inView` into a `data-in` attribute and
 * `services.css` owns the fade/rise transition (using the same
 * `--m-ease` motion tokens as the rest of the site).
 *
 * Falls back to revealing immediately when IntersectionObserver is
 * unavailable, so content never gets stuck at opacity 0.
 */
export function useReveal<T extends HTMLElement>(): {
  ref: React.RefObject<T | null>;
  inView: boolean;
} {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
            break;
          }
        }
      },
      // Mirrors `useRevealMotion`'s reveal threshold/margin so the cards
      // wake on the same scroll cadence as the rest of the page.
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}
