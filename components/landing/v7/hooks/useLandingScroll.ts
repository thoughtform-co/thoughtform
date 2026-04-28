"use client";
import { useEffect, useLayoutEffect, useRef, useCallback } from "react";

interface ScrollTelemetry {
  progress: number;
  activeStation: string;
  heroCover: number;
  practiceCover: number;
}

const SECTORS: Record<string, string> = {
  hero: "Origin",
  definition: "North star",
  continuum: "Continuum",
  practice: "Field",
  buildQuote: "Axiom",
  build: "Build",
  services: "Roadmap",
  about: "Story",
  products: "Fleet",
  contact: "Horizon",
};

export function useLandingScroll(rootRef: React.RefObject<HTMLDivElement | null>) {
  const telemetryRef = useRef<ScrollTelemetry>({
    progress: 0,
    activeStation: "hero",
    heroCover: 0,
    practiceCover: 0,
  });
  const rafId = useRef<number | null>(null);
  const lastScrollY = useRef(-1);

  const onScrollFrame = useCallback(() => {
    rafId.current = null;
    const root = rootRef.current;
    if (!root) return;

    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    const scrollMax = Math.max(1, document.documentElement.scrollHeight - vh);
    const progress = Math.max(0, Math.min(1, scrollY / scrollMax));

    // Depth indicator
    const depthEl = root.querySelector<HTMLElement>("#depthIndicator");
    if (depthEl) depthEl.style.top = `${progress * 100}%`;

    // Progress text
    const progressEl = root.querySelector<HTMLElement>("#hudProgress");
    if (progressEl)
      progressEl.textContent = `${String(Math.round(progress * 100)).padStart(2, "0")}%`;

    // Depth CSS var
    root.style.setProperty("--depth", Math.min(1, progress * 1.2).toFixed(4));

    // Coord readouts (inside nav status)
    const coordD = root.querySelector<HTMLElement>("#coordD");
    const coordT = root.querySelector<HTMLElement>("#coordT");
    if (coordD) coordD.textContent = (0.2 + progress * 0.55).toFixed(2);
    if (coordT)
      coordT.textContent = `${String(Math.round(progress * 359)).padStart(3, "0")}.${String(Math.round((progress * 10) % 10))}\u00b0`;

    // Hero cover — drives `--hero-cover` on #hero so the video/content
    // recede (scale + fade) as #definition rises into view. The
    // mechanic is: hero is `position: sticky; top:0; height:100vh;
    // z-index:1`, and #definition follows in normal flow at z-index:2
    // with an opaque var(--void) shield. As #definition.top crosses
    // from `vh` to `0` (one viewport of scroll), it visually covers
    // the pinned hero from bottom to top.
    const heroEl = root.querySelector<HTMLElement>("#hero");
    const defEl = root.querySelector<HTMLElement>("#definition");
    let heroCover = 0;
    if (heroEl && defEl) {
      const defTop = defEl.getBoundingClientRect().top;
      heroCover = Math.max(0, Math.min(1, 1 - defTop / vh));
      heroEl.style.setProperty("--hero-cover", heroCover.toFixed(4));
      heroEl.style.visibility = heroCover >= 1 ? "hidden" : "";
    }

    // Practice cover — exact mirror of hero cover, but applied to the
    // original final state inside #practice. The Build phase + orbit pin
    // through the last viewport of #practice; #buildQuote follows as a
    // higher-z opaque cover. As #buildQuote.top moves from `vh` to `0`,
    // it covers the original pinned Practice state from bottom to top.
    const practiceEl = root.querySelector<HTMLElement>("#practice");
    const stageEl = root.querySelector<HTMLElement>(".approach__stage");
    const chamberEl = root.querySelector<HTMLElement>(".approach__chamber");
    const buildPhaseEl = root.querySelector<HTMLElement>('.approach__phase[data-phase="build"]');
    const quoteEl = root.querySelector<HTMLElement>("#buildQuote");
    let practiceCover = 0;
    if (practiceEl && stageEl && chamberEl && buildPhaseEl && quoteEl) {
      const quoteRect = quoteEl.getBoundingClientRect();
      const quoteTop = quoteRect.top;
      const quoteActive = quoteRect.top < vh && quoteRect.bottom > 0;
      root.setAttribute("data-quote-active", quoteActive ? "true" : "false");
      document.documentElement.setAttribute("data-quote-active", quoteActive ? "true" : "false");
      practiceCover = Math.max(0, Math.min(1, 1 - quoteTop / vh));
      practiceEl.style.setProperty("--practice-cover", practiceCover.toFixed(4));

      const stickyTopPx = parseFloat(getComputedStyle(stageEl).top) || 0;
      const shouldPinPracticeStage = quoteTop <= vh * 1.15 && practiceCover < 1;
      if (shouldPinPracticeStage) {
        stageEl.style.removeProperty("--practice-cover-translate");
        const stageRect = stageEl.getBoundingClientRect();
        const delta = Math.max(0, stickyTopPx - stageRect.top);
        stageEl.style.setProperty("--practice-cover-translate", `${delta.toFixed(1)}px`);
      } else {
        stageEl.style.removeProperty("--practice-cover-translate");
      }

      // Keep the *original* Build phase visible during the cover. CSS sticky
      // still has container-end limits, so once the axiom is close enough to
      // enter we directly compensate the Build phase's Y position back to its
      // intended sticky top. This is not a duplicate frame; it preserves the
      // original DOM node while the quote covers it.
      const buildStickyTopPx = parseFloat(getComputedStyle(buildPhaseEl).top) || 0;
      const shouldPinBuild = quoteTop <= vh * 1.15 && practiceCover < 1;
      if (shouldPinBuild) {
        buildPhaseEl.style.removeProperty("--practice-build-translate");
        const buildRect = buildPhaseEl.getBoundingClientRect();
        const delta = Math.max(0, buildStickyTopPx - buildRect.top);
        buildPhaseEl.style.setProperty("--practice-build-translate", `${delta.toFixed(1)}px`);
      } else {
        buildPhaseEl.style.removeProperty("--practice-build-translate");
      }
    } else {
      root.setAttribute("data-quote-active", "false");
      document.documentElement.setAttribute("data-quote-active", "false");
    }

    // Active station
    const stations = Array.from(root.querySelectorAll<HTMLElement>(".station"));
    const viewportMid = scrollY + vh / 2;
    let activeStation = stations[0];
    for (const station of stations) {
      if (station.offsetTop <= viewportMid) activeStation = station;
    }
    const activeKey = activeStation?.getAttribute("data-station") || activeStation?.id || "hero";

    // Update nav active states
    const navLinks = root.querySelectorAll<HTMLAnchorElement>("#hudNav a");
    navLinks.forEach((link) => {
      const isActive = link.getAttribute("data-station") === activeKey;
      link.classList.toggle("is-active", isActive);
    });
    const sectorEl = root.querySelector<HTMLElement>("#hudSector");
    if (sectorEl) sectorEl.textContent = SECTORS[activeKey] || "Field";

    // Parallax
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduceMotion && scrollY !== lastScrollY.current) {
      lastScrollY.current = scrollY;
      const viewportCenter = scrollY + vh / 2;
      root.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
        const speed = parseFloat(el.dataset.parallax || "0") || 0;
        const rect = el.getBoundingClientRect();
        const elCenter = scrollY + rect.top + rect.height / 2;
        el.style.setProperty("--py", `${(-(elCenter - viewportCenter) * speed).toFixed(1)}px`);
      });
    }

    telemetryRef.current = { progress, activeStation: activeKey, heroCover, practiceCover };
  }, [rootRef]);

  const onScroll = useCallback(() => {
    if (rafId.current) return;
    rafId.current = window.requestAnimationFrame(onScrollFrame);
  }, [onScrollFrame]);

  // Run FIRST frame synchronously before paint to prevent hero flash
  useLayoutEffect(() => {
    onScrollFrame();
  }, [onScrollFrame]);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.documentElement.removeAttribute("data-quote-active");
      if (rafId.current) window.cancelAnimationFrame(rafId.current);
    };
  }, [onScroll]);

  return telemetryRef;
}
