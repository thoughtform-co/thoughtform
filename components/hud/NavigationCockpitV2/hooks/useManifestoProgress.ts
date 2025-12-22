"use client";

import { useEffect, useState, useRef, RefObject } from "react";

export interface ManifestoProgressResult {
  /** Scroll progress within manifesto section (0-1) */
  scrollProgress: number;
  /** Whether manifesto is in viewport */
  inView: boolean;
  /** Whether manifesto is fully visible (centered) */
  fullyVisible: boolean;
}

/**
 * Hook that tracks scroll progress within the manifesto section.
 * Uses rAF-throttled scroll listener for performance.
 *
 * @param manifestoRef - Ref to the manifesto section element
 * @returns Progress and visibility states for the manifesto section
 */
export function useManifestoProgress(
  manifestoRef: RefObject<HTMLElement | null>
): ManifestoProgressResult {
  const [state, setState] = useState<ManifestoProgressResult>({
    scrollProgress: 0,
    inView: false,
    fullyVisible: false,
  });

  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!manifestoRef.current) return;

    const updateProgress = () => {
      const element = manifestoRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const sectionHeight = rect.height;

      // Calculate progress: 0 = section top at viewport center, 1 = section scrolled through
      const viewportCenter = windowHeight * 0.5;
      const sectionTop = rect.top;

      // Progress from 0 to 1 as section scrolls from center to bottom
      const scrollRange = sectionHeight + windowHeight;
      const scrollDistance = viewportCenter - sectionTop;
      const progress = Math.max(0, Math.min(1, scrollDistance / scrollRange));

      // Terminal appears immediately when section is in viewport
      const isInView = rect.top < windowHeight && rect.bottom > 0;

      // Terminal is "fully visible" when section is centered
      const isFullyVisible = rect.top < viewportCenter && rect.bottom > viewportCenter;

      setState({
        scrollProgress: progress,
        inView: isInView,
        fullyVisible: isFullyVisible,
      });
    };

    const handleScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateProgress);
    };

    // Initial calculation
    updateProgress();

    // Listen to scroll and resize events
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [manifestoRef]);

  return state;
}
