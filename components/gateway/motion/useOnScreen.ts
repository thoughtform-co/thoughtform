"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * IntersectionObserver visibility flag for a stage element. Treatments
 * gate their render loops on this (frameloop "demand" / paused rAF when
 * the stage is off-screen), mirroring the DepthGatewayScene engagement
 * pattern without the corridor store.
 */
export function useOnScreen(ref: RefObject<Element | null>, rootMargin = "10%"): boolean {
  // Default VISIBLE: a hidden/background tab freezes IntersectionObserver
  // callbacks entirely, and "assume on screen until told otherwise" degrades
  // to extra rendering rather than a blank stage.
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setOnScreen(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      rootMargin,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin]);

  return onScreen;
}
