"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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

    rafRef.current = requestAnimationFrame(raf);

    // Track scroll progress
    const onScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
      setScrollProgress(Math.min(1, Math.max(0, progress)));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // Initial call

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", onScroll);
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
