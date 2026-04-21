"use client";
import { useEffect } from "react";

export function useRevealMotion(rootRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const cleanups: Array<() => void> = [];

    // Tag elements with stagger indices
    root.querySelectorAll<HTMLElement>("[data-m-group]").forEach((group) => {
      let index = 0;
      group.querySelectorAll<HTMLElement>(":scope > [data-m]").forEach((el) => {
        el.style.setProperty("--m-i", String(index));
        index += 1;
      });
    });

    // IntersectionObserver reveal
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-m]"));
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
      );
      targets.forEach((t) => observer.observe(t));
      cleanups.push(() => observer.disconnect());
    } else {
      targets.forEach((t) => t.classList.add("is-in"));
    }

    // Hero reveals immediately
    const heroRaf = requestAnimationFrame(() => {
      root
        .querySelectorAll<HTMLElement>(".hero [data-m]")
        .forEach((el) => el.classList.add("is-in"));
    });
    cleanups.push(() => cancelAnimationFrame(heroRaf));

    // Safety sweep
    const safetySweep = () => {
      const vh = window.innerHeight;
      root.querySelectorAll<HTMLElement>("[data-m]:not(.is-in)").forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < vh * 1.1) el.classList.add("is-in");
      });
    };
    const t1 = setTimeout(safetySweep, 900);
    const t2 = setTimeout(safetySweep, 2400);
    cleanups.push(() => {
      clearTimeout(t1);
      clearTimeout(t2);
    });

    // Offscreen pause
    const stations = Array.from(root.querySelectorAll<HTMLElement>(".station"));
    if ("IntersectionObserver" in window && stations.length) {
      const stationObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries)
            entry.target.classList.toggle("is-offscreen", !entry.isIntersecting);
        },
        { threshold: 0, rootMargin: "30% 0px 30% 0px" }
      );
      stations.forEach((s) => stationObserver.observe(s));
      cleanups.push(() => stationObserver.disconnect());
    }

    return () => cleanups.reverse().forEach((fn) => fn());
  }, [rootRef]);
}
