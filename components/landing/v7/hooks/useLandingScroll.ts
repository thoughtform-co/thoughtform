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

// Threshold (px) below which we skip rewriting the pin compensation
// variable. Sub-pixel jitter from getBoundingClientRect on a sticky
// element can otherwise cause the pinned Practice elements to wobble
// during the Quote cover handoff.
const PIN_EPSILON = 0.25;

export function useLandingScroll(rootRef: React.RefObject<HTMLDivElement | null>) {
  const telemetryRef = useRef<ScrollTelemetry>({
    progress: 0,
    activeStation: "hero",
    heroCover: 0,
    practiceCover: 0,
  });
  const rafId = useRef<number | null>(null);
  const lastScrollY = useRef(-1);

  // Cached sticky-top values (resolved px from CSS clamp()). These only
  // change when the viewport resizes, so reading them once per resize
  // instead of once per scroll frame avoids a hot-path getComputedStyle
  // call that was forcing extra style recalcs during scroll.
  const stageStickyTopPx = useRef(0);
  const buildStickyTopPx = useRef(0);

  // Last applied translate values per element. We track these so we can
  // compute "natural top" as `rect.top - lastTranslate` without having to
  // remove the CSS variable every frame to reset the transform — which
  // was causing a double layout reflow per frame and visible micro-drift
  // in the pinned orbit/build elements during the Quote cover transition.
  const lastStageTranslate = useRef(0);
  const lastBuildTranslate = useRef(0);

  const refreshStickyCache = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const stageEl = root.querySelector<HTMLElement>(".approach__stage");
    const buildEl = root.querySelector<HTMLElement>('.approach__phase[data-phase="build"]');
    if (stageEl) {
      const v = parseFloat(getComputedStyle(stageEl).top);
      if (Number.isFinite(v)) stageStickyTopPx.current = v;
    }
    if (buildEl) {
      const v = parseFloat(getComputedStyle(buildEl).top);
      if (Number.isFinite(v)) buildStickyTopPx.current = v;
    }
  }, [rootRef]);

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
    //
    // Pinning compensation: CSS `position: sticky` releases its lock when
    // the parent's bottom edge passes the sticky's top + height window,
    // so without help the orbit and Build phase would scroll out of view
    // before #buildQuote has fully covered them. We compensate by writing
    // `--practice-cover-translate` and `--practice-build-translate` so
    // those elements stay visually pinned until the cover completes.
    //
    // Hardened algorithm: instead of removing+resetting the variable each
    // frame (which forces two layout passes and visible micro-drift), we
    // track the last applied translate in a ref. The element's "natural"
    // top is then `rect.top - lastTranslate` — what its top WOULD be if
    // we applied no translate. We compute the new translate from that
    // and only write it back if the change exceeds PIN_EPSILON. This
    // breaks the translation feedback loop that was causing the pinned
    // elements to appear to move during the Quote cover transition.
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

      const inCoverWindow = quoteTop <= vh * 1.15 && practiceCover < 1;

      // Stage (orbit) compensation. The stage's CSS `position: sticky`
      // engages naturally inside `.approach__chamber` (a CSS grid), so
      // this JS only needs to compensate during the Quote cover window
      // when the parent's bottom edge would otherwise release sticky.
      const stageRect = stageEl.getBoundingClientRect();
      const stageNaturalTop = stageRect.top - lastStageTranslate.current;
      const nextStageTranslate = inCoverWindow
        ? Math.max(0, stageStickyTopPx.current - stageNaturalTop)
        : 0;
      if (Math.abs(nextStageTranslate - lastStageTranslate.current) > PIN_EPSILON) {
        if (nextStageTranslate === 0) {
          stageEl.style.removeProperty("--practice-cover-translate");
        } else {
          stageEl.style.setProperty(
            "--practice-cover-translate",
            `${nextStageTranslate.toFixed(1)}px`
          );
        }
        lastStageTranslate.current = nextStageTranslate;
      }

      // Build phase compensation. The Build phase is declared
      // `position: sticky` but Chrome does not engage sticky on it in
      // this layout: the parent `.approach__copy` is an intrinsically-
      // sized flex column whose height is built from children + a
      // 100vh `padding-bottom` rather than an explicit size. Verified
      // at runtime — temporarily setting `.approach__copy { height: ... }`
      // makes sticky grip; without it, the build phase scrolls past
      // its sticky-top with no engagement at all.
      //
      // As a result, this JS path is the only thing that pins the
      // Build phase. The pin must engage as soon as Build's natural
      // top crosses above its sticky-top — not only when the Quote
      // cover window arrives — otherwise the BUILD title scrolls
      // offscreen for ~1 viewport, then teleports back into view the
      // moment the cover gate (`quoteTop <= vh * 1.15`) flips. The
      // gating below replaces the cover-window gate with the same
      // condition that natural sticky would have used, plus the
      // existing `practiceCover < 1` cap so the pin releases the
      // moment the cover finishes covering.
      const buildRect = buildPhaseEl.getBoundingClientRect();
      const buildNaturalTop = buildRect.top - lastBuildTranslate.current;
      const buildShouldPin = buildNaturalTop < buildStickyTopPx.current && practiceCover < 1;
      const nextBuildTranslate = buildShouldPin
        ? Math.max(0, buildStickyTopPx.current - buildNaturalTop)
        : 0;
      if (Math.abs(nextBuildTranslate - lastBuildTranslate.current) > PIN_EPSILON) {
        if (nextBuildTranslate === 0) {
          buildPhaseEl.style.removeProperty("--practice-build-translate");
        } else {
          buildPhaseEl.style.setProperty(
            "--practice-build-translate",
            `${nextBuildTranslate.toFixed(1)}px`
          );
        }
        lastBuildTranslate.current = nextBuildTranslate;
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

  const onResize = useCallback(() => {
    refreshStickyCache();
    onScroll();
  }, [refreshStickyCache, onScroll]);

  // Run FIRST frame synchronously before paint to prevent hero flash
  useLayoutEffect(() => {
    refreshStickyCache();
    onScrollFrame();
  }, [refreshStickyCache, onScrollFrame]);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.documentElement.removeAttribute("data-quote-active");
      if (rafId.current) window.cancelAnimationFrame(rafId.current);
    };
  }, [onScroll, onResize]);

  return telemetryRef;
}
