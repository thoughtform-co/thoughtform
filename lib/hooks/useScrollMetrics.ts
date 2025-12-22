"use client";

import { useEffect, useRef, useState, useCallback, RefObject } from "react";

/**
 * Element metrics captured from getBoundingClientRect
 */
export interface ElementMetrics {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  left: number;
  bottom: number;
  right: number;
}

/**
 * Configuration for an element to track
 */
export interface TrackedElement {
  ref: RefObject<HTMLElement | null>;
  key: string;
}

/**
 * Return type of useScrollMetrics
 */
export interface ScrollMetrics {
  /** Normalized scroll progress (0 at top, 1 at bottom) */
  scrollProgress: number;
  /** Raw scroll position in pixels */
  scrollY: number;
  /** Viewport height */
  viewportHeight: number;
  /** Total scrollable height */
  scrollHeight: number;
  /** Element metrics keyed by the key provided in TrackedElement */
  elements: Record<string, ElementMetrics | null>;
}

/**
 * Hook that batches layout reads into a single requestAnimationFrame loop.
 *
 * This prevents layout thrashing by:
 * 1. Using a single scroll listener for the entire cockpit
 * 2. Reading all element positions in a single rAF callback
 * 3. Batching all reads before any writes
 *
 * @param trackedElements - Array of elements to track positions for
 * @returns Scroll metrics and element positions
 */
export function useScrollMetrics(trackedElements: TrackedElement[] = []): ScrollMetrics {
  const [metrics, setMetrics] = useState<ScrollMetrics>({
    scrollProgress: 0,
    scrollY: 0,
    viewportHeight: typeof window !== "undefined" ? window.innerHeight : 0,
    scrollHeight: 0,
    elements: {},
  });

  const rafRef = useRef<number>(0);
  const isUpdatingRef = useRef(false);

  // Stable callback to update all metrics in a single frame
  const updateMetrics = useCallback(() => {
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;

    rafRef.current = requestAnimationFrame(() => {
      // Read phase - batch all layout reads together
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const scrollHeight = document.documentElement.scrollHeight - viewportHeight;
      const scrollProgress =
        scrollHeight > 0 ? Math.min(1, Math.max(0, scrollY / scrollHeight)) : 0;

      // Read all tracked element positions
      const elements: Record<string, ElementMetrics | null> = {};
      for (const { ref, key } of trackedElements) {
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect();
          elements[key] = {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left,
            bottom: rect.bottom,
            right: rect.right,
          };
        } else {
          elements[key] = null;
        }
      }

      // Write phase - single state update
      setMetrics({
        scrollProgress,
        scrollY,
        viewportHeight,
        scrollHeight,
        elements,
      });

      isUpdatingRef.current = false;
    });
  }, [trackedElements]);

  useEffect(() => {
    // Initial measurement
    updateMetrics();

    // Listen to scroll and resize events
    const handleScroll = () => updateMetrics();
    const handleResize = () => updateMetrics();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [updateMetrics]);

  return metrics;
}

/**
 * Simpler hook that just returns scroll progress.
 * Use this when you don't need to track element positions.
 */
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const updateProgress = () => {
      rafRef.current = requestAnimationFrame(() => {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const newProgress =
          scrollHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollHeight)) : 0;
        setProgress(newProgress);
      });
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", updateProgress);
    };
  }, []);

  return progress;
}
