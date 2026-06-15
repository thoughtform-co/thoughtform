"use client";
import { useEffect, useLayoutEffect, useRef, useCallback } from "react";

interface ScrollTelemetry {
  progress: number;
  activeStation: string;
  heroCover: number;
}

const SECTORS: Record<string, string> = {
  hero: "Origin",
  definition: "North star",
  missingLayer: "Missing layer",
  askingGap: "Asking gap",
  intelligenceLayer: "Intelligence layer",
  buildQuote: "Axiom",
  continuum: "Continuum",
  practice: "Field",
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

    // Capability gates (cheap matchMedia reads; cached locally so both
    // the hero-flip toggle below and the parallax block at the bottom
    // share a single read per frame). `flipCapable` matches the CSS
    // gate `@media (prefers-reduced-motion: no-preference) and
    // (min-width: 961px)` that wraps the 3D flip treatment.
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const flipCapable = !reduceMotion && window.matchMedia("(min-width: 961px)").matches;

    // Defer HUD rail/coord readouts to the corridor while it's the
    // engaged owner of the depth gauge. `useDepthScroll` (home-v2)
    // sets `data-corridor-engaged="true"` on <html> whenever the
    // depth stage is armed or active; without this gate both hooks
    // would write to `#depthIndicator`, `#hudProgress`, `#coordD`,
    // `#coordT` every frame and the readout would oscillate. The
    // active-station + parallax + heroCover writes below stay live
    // either way — they describe the page's overall scroll state,
    // not the corridor's internal beat.
    const corridorEngaged =
      document.documentElement.getAttribute("data-corridor-engaged") === "true";

    if (!corridorEngaged) {
      // Depth indicator
      const depthEl = root.querySelector<HTMLElement>("#depthIndicator");
      if (depthEl) depthEl.style.top = `${progress * 100}%`;

      // Progress text
      const progressEl = root.querySelector<HTMLElement>("#hudProgress");
      if (progressEl)
        progressEl.textContent = `${String(Math.round(progress * 100)).padStart(2, "0")}%`;

      // Coord readouts (inside nav status)
      const coordD = root.querySelector<HTMLElement>("#coordD");
      const coordT = root.querySelector<HTMLElement>("#coordT");
      if (coordD) coordD.textContent = (0.2 + progress * 0.55).toFixed(2);
      if (coordT)
        coordT.textContent = `${String(Math.round(progress * 359)).padStart(3, "0")}.${String(Math.round((progress * 10) % 10))}\u00b0`;
    }

    // Depth CSS var — always written. Drives reveal/parallax envelopes
    // throughout the page, so it must stay live even while the
    // corridor owns the HUD readouts.
    root.style.setProperty("--depth", Math.min(1, progress * 1.2).toFixed(4));

    // Hero cover — drives `--hero-cover` on #hero so the video/content
    // recede (scale + fade) as the next station rises into view. The
    // mechanic is: hero is `position: sticky; top:0; height:100vh;
    // z-index:1`, and the next station follows in normal flow at
    // z-index:2 with an opaque var(--void) shield. As its top crosses
    // from `vh` to `0` (one viewport of scroll), it visually covers
    // the pinned hero from bottom to top.
    //
    // On the production homepage `#definition` is stripped and replaced
    // by the home-v2 corridor mount (ADR-018), so fall back to the
    // mount placeholder — without it `--hero-cover` is never written
    // and the hero video never zooms/recedes.
    const heroEl = root.querySelector<HTMLElement>("#hero");
    const defEl =
      root.querySelector<HTMLElement>("#definition") ??
      root.querySelector<HTMLElement>("[data-home-corridor-mount]");
    let heroCover = 0;
    if (heroEl && defEl) {
      const defTop = defEl.getBoundingClientRect().top;
      heroCover = Math.max(0, Math.min(1, 1 - defTop / vh));
      // Smootherstep the cover before writing the CSS var so the video
      // zoom eases in and lands gently (zero velocity at both ends)
      // instead of tracking scroll linearly. Raw cover keeps owning
      // the visibility cutoff + telemetry (eased(1) === 1 anyway).
      const eased = heroCover * heroCover * heroCover * (heroCover * (heroCover * 6 - 15) + 10);
      const easedStr = eased.toFixed(4);
      heroEl.style.setProperty("--hero-cover", easedStr);
      heroEl.style.visibility = heroCover >= 1 ? "hidden" : "";

      // Mirror `--hero-cover` to <html> so the sibling Hero Flip deck
      // (`.hero-flip-deck` rendered by `HeroFlipBackface`, mounted
      // outside the parsed v7 `<main>`) reads the same channel via
      // ordinary CSS inheritance. The deck's facade + backdrop are
      // siblings of `#hero`, not descendants — without this mirror they
      // can't see the variable. Single rAF frame, single writer; ADR-022
      // (enclose-then-flip rework).
      document.documentElement.style.setProperty("--hero-cover", easedStr);

      // Hero flip transition (KPR-style enclose-then-flip with a
      // two-faced card; the back face is a Thoughtform facade that
      // crossfades to the live corridor at completion). Active only
      // mid-band on capable devices; the attribute promotes the hero
      // above the corridor host (z:3 → z:6) and reveals the sibling
      // flip deck. CSS owns all phase math; this attribute is a pure
      // capability + band gate. Reduced-motion and narrow viewports
      // fall through to the legacy scale+fade rules (the deck stays
      // `display: none`).
      const inBand = flipCapable && heroCover > 0 && heroCover < 1;
      if (inBand) {
        heroEl.dataset.heroFlip = "1";
        document.documentElement.dataset.heroFlip = "1";
      } else {
        delete heroEl.dataset.heroFlip;
        delete document.documentElement.dataset.heroFlip;
      }
    }

    // The Practice → BuildQuote cover handoff was retired entirely
    // (ADR-021): #buildQuote is now stripped from the production HTML
    // and the corridor-exit seam is owned by `useCorridorExitScroll`.
    // Without #buildQuote, #practice ends naturally and no sticky-pin
    // compensation is needed inside this hook.

    // Active station
    const stations = Array.from(root.querySelectorAll<HTMLElement>(".station"));
    const viewportMid = scrollY + vh / 2;
    let activeStation = stations[0];
    for (const station of stations) {
      const stationTop = scrollY + station.getBoundingClientRect().top;
      if (stationTop <= viewportMid) activeStation = station;
    }
    const activeKey = activeStation?.getAttribute("data-station") || activeStation?.id || "hero";

    // Update nav active states
    const navLinks = root.querySelectorAll<HTMLAnchorElement>("#hudNav a");
    navLinks.forEach((link) => {
      const isActive = link.getAttribute("data-station") === activeKey;
      link.classList.toggle("is-active", isActive);
    });
    if (!corridorEngaged) {
      const sectorEl = root.querySelector<HTMLElement>("#hudSector");
      if (sectorEl) sectorEl.textContent = SECTORS[activeKey] || "Field";
    }

    // Parallax (reuses `reduceMotion` cached at the top of the frame)
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

    telemetryRef.current = { progress, activeStation: activeKey, heroCover };
  }, [rootRef]);

  const onScroll = useCallback(() => {
    if (rafId.current) return;
    rafId.current = window.requestAnimationFrame(onScrollFrame);
  }, [onScrollFrame]);

  const onResize = useCallback(() => {
    onScroll();
  }, [onScroll]);

  // Run FIRST frame synchronously before paint to prevent hero flash
  useLayoutEffect(() => {
    onScrollFrame();
  }, [onScrollFrame]);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (rafId.current) window.cancelAnimationFrame(rafId.current);
    };
  }, [onScroll, onResize]);

  return telemetryRef;
}
