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
    let observer: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("is-in");
            observer?.unobserve(entry.target);
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
      );
      targets.forEach((t) => observer?.observe(t));
      cleanups.push(() => observer?.disconnect());
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

    // Scroll-based fallback: catches any element IO missed (rapid scroll,
    // scroll restoration, layout shifts from late font/image loads).
    // For [data-m="title"] this matters most — the initial state is
    // clip-path: inset(0 0 100% 0), so a missed is-in means the title
    // stays fully clipped and invisible. Throttled via rAF; detaches
    // itself once every [data-m] has been revealed.
    let fallbackRaf: number | null = null;
    let fallbackAttached = false;
    const fallbackSweep = () => {
      fallbackRaf = null;
      const vh = window.innerHeight;
      const hidden = root.querySelectorAll<HTMLElement>("[data-m]:not(.is-in)");
      if (!hidden.length) {
        if (fallbackAttached) {
          window.removeEventListener("scroll", onScrollFallback);
          fallbackAttached = false;
        }
        return;
      }
      hidden.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // Any meaningful portion of the element is inside the viewport
        if (rect.bottom > 0 && rect.top < vh * 0.94) {
          el.classList.add("is-in");
          observer?.unobserve(el);
        }
      });
    };
    const onScrollFallback = () => {
      if (fallbackRaf !== null) return;
      fallbackRaf = requestAnimationFrame(fallbackSweep);
    };
    window.addEventListener("scroll", onScrollFallback, { passive: true });
    window.addEventListener("resize", onScrollFallback, { passive: true });
    fallbackAttached = true;
    cleanups.push(() => {
      if (fallbackAttached) window.removeEventListener("scroll", onScrollFallback);
      window.removeEventListener("resize", onScrollFallback);
      if (fallbackRaf !== null) cancelAnimationFrame(fallbackRaf);
    });

    // Safety sweep: reveal everything above or near the viewport at timed
    // checkpoints (covers scroll-restored loads where the user lands mid-page).
    const safetySweep = () => {
      const vh = window.innerHeight;
      root.querySelectorAll<HTMLElement>("[data-m]:not(.is-in)").forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < vh * 1.1) {
          el.classList.add("is-in");
          observer?.unobserve(el);
        }
      });
    };
    const t1 = setTimeout(safetySweep, 900);
    const t2 = setTimeout(safetySweep, 2400);
    cleanups.push(() => {
      clearTimeout(t1);
      clearTimeout(t2);
    });
    // Additional sweep on window load — catches late-settling layout
    // shifts from font swap, image decode, or deferred asset loads.
    if (document.readyState !== "complete") {
      const onWindowLoad = () => safetySweep();
      window.addEventListener("load", onWindowLoad, { once: true });
      cleanups.push(() => window.removeEventListener("load", onWindowLoad));
    }

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
