"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Lenis from "@studio-freight/lenis";

interface UseLenisReturn {
  scrollProgress: number;
  scrollTo: (target: string | number | HTMLElement) => void;
}

export function useLenis(): UseLenisReturn {
  const lenisRef = useRef<Lenis | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    }

    // Track scroll progress
    const onScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
      setScrollProgress(Math.min(1, Math.max(0, progress)));
    };

    // Pause the Lenis rAF while the tab is hidden — it integrates smooth
    // scroll every frame and is pure background overhead otherwise. The
    // rAF `time` is the document timeline (frozen while hidden), so the
    // first frame after resume gets a continuous timestamp (no teleport);
    // `onScroll()` on resume refreshes progress from the live `scrollY`.
    const start = () => {
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(raf);
        onScroll();
      }
    };
    const stop = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    rafRef.current = requestAnimationFrame(raf);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    onScroll(); // Initial call

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      lenis.destroy();
    };
  }, []);

  const scrollTo = useCallback((target: string | number | HTMLElement) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, { offset: 0 });
    }
  }, []);

  return {
    scrollProgress,
    scrollTo,
  };
}
