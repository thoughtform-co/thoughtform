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

    // Practice cover — exact mirror of hero cover. The chamber
    // (`.approach__chamber`) carries `padding-bottom: 100vh`, which
    // extends the sticky orbit's pin range by one viewport past the
    // phase column's end. #buildQuote follows in normal flow as a
    // `.station--cover` (z:2, opaque, full-bleed) and rises during
    // that runway, covering the still-pinned orbit. The scalar tracks
    // the axiom's top edge against viewport height (identical math to
    // heroCover) and writes `--practice-cover` on `.approach__stage`
    // so the orbit subtly recedes (scale + fade) in lock-step.
    //
    // CSS sticky's pin range always ends `element.height + sticky.top`
    // before the containing block's bottom, so the orbit unpins ~828px
    // before practice ends — leaving the cover playing over an empty
    // viewport above. To match the hero's ALWAYS-VISIBLE under-layer,
    // we compensate with a JS-driven `--practice-cover-translate` that
    // shifts the stage back to its sticky position during the cover.
    // The CSS rule on `.approach__stage` consumes this translate to
    // keep the orbit visually pinned at top:12vh until the cover
    // completes and the axiom fully fills the viewport.
    const stageEl = root.querySelector<HTMLElement>(".approach__stage");
    const chamberEl = root.querySelector<HTMLElement>(".approach__chamber");
    const quoteEl = root.querySelector<HTMLElement>("#buildQuote");
    let practiceCover = 0;
    if (stageEl && chamberEl && quoteEl) {
      const quoteTop = quoteEl.getBoundingClientRect().top;
      practiceCover = Math.max(0, Math.min(1, 1 - quoteTop / vh));
      stageEl.style.setProperty("--practice-cover", practiceCover.toFixed(4));

      // Compute the post-pin scroll position purely from layout (offsetHeight,
      // computed sticky.top, chamber bottom) so the math is independent of the
      // stage's current transform. After CSS sticky unpins (scrollY beyond
      // pinEndScrollY), the stage scrolls naturally and goes offscreen above.
      // The translate brings it back to viewport top:sticky.top during the
      // active cover window, mirroring the always-visible hero under-layer.
      const stickyTopPx = parseFloat(getComputedStyle(stageEl).top) || 0;
      const stageLayoutHeight = stageEl.offsetHeight;
      const chamberRect = chamberEl.getBoundingClientRect();
      const chamberBottomDoc = scrollY + chamberRect.bottom;
      const pinEndScrollY = chamberBottomDoc - stageLayoutHeight - stickyTopPx;
      // Engage the translate the moment CSS sticky stops pinning (so there's
      // no gap where the orbit briefly slides up while quote isn't covering
      // yet) and disengage once the cover has fully completed (so the orbit
      // doesn't keep "ghosting" at viewport top once quote is past).
      if (scrollY > pinEndScrollY && practiceCover < 1) {
        const delta = scrollY - pinEndScrollY;
        stageEl.style.setProperty("--practice-cover-translate", `${delta.toFixed(1)}px`);
      } else {
        stageEl.style.removeProperty("--practice-cover-translate");
      }
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
      if (rafId.current) window.cancelAnimationFrame(rafId.current);
    };
  }, [onScroll]);

  return telemetryRef;
}
