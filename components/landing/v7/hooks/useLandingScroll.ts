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

    // Capability gate (single matchMedia read per frame, reused by the
    // parallax block at the bottom of the frame). The hero -> corridor
    // seam is a direct parallax reveal (ADR-022 v7): no portalled proxy
    // plane, no `data-hero-handoff` band gate, no `<html>` mirrors.
    // CSS reads `--hero-cover` written below to drift + fade the held
    // hero while the live `.home-corridor-host` (z:3) rises over it.
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    // Hero → corridor CURTAIN reveal (ADR-022 v8, ToyFight-class).
    //
    // The hero is the TOP, MOVING layer (`.hero`, position:relative,
    // z:4): it scrolls straight up and off over the first viewport. The
    // home-v2 corridor mount follows in normal flow at z:3 and, while
    // `armed`, paints its real parked Thoughtform frame at
    // paintProgress 0. To make the hero lift off a FROZEN second
    // section (rather than the corridor rising into view), we hold the
    // corridor's parked frame still at viewport top during the band:
    //
    //   `defTop` = the corridor mount's viewport top = the amount the
    //   corridor's `.home-v2-stage__sticky` cell has NOT yet pinned
    //   (it equals (100vh - scrollY) until the stage reaches the top).
    //   CSS counter-translates the sticky cell up by `--corridor-pin`
    //   px (= defTop) ONLY while `data-corridor-entry` is set, cancelling
    //   the rise so the frame sits frozen at viewport top. At defTop <= 0
    //   (stage reached the top) the flag clears, the transform reverts to
    //   `none`, and the corridor's own sticky pin + flythrough take over
    //   untouched. The stage rect that `useDepthScroll` reads is never
    //   transformed, so corridor timing is unaffected.
    //
    // On the production homepage `#definition` is stripped and replaced
    // by the home-v2 corridor mount (ADR-018), so fall back to the
    // mount placeholder — without it the pin is never written.
    const heroEl = root.querySelector<HTMLElement>("#hero");
    const defEl =
      root.querySelector<HTMLElement>("#definition") ??
      root.querySelector<HTMLElement>("[data-home-corridor-mount]");
    let heroCover = 0;
    const docEl = document.documentElement;
    if (heroEl && defEl) {
      const defTop = defEl.getBoundingClientRect().top;
      heroCover = Math.max(0, Math.min(1, 1 - defTop / vh));
      // The pin (px) is the exact distance the sticky cell must be
      // counter-translated to stay frozen at viewport top. Clamp at 0:
      // once the stage has reached the top (defTop <= 0) the corridor's
      // natural sticky pin owns it and the transform must be gone.
      const pin = Math.max(0, defTop);
      // Entry band = while the corridor's parked frame is still being
      // uncovered by the departing hero (stage top below the viewport
      // top). The flag GATES the counter-transform so it is `none`
      // everywhere else — critical so the docked-exit `position: fixed`
      // canvas (ADR-021) is never captured by a transformed ancestor.
      if (defTop > 0.5) {
        docEl.style.setProperty("--corridor-pin", pin.toFixed(1));
        docEl.dataset.corridorEntry = "1";
      } else {
        delete docEl.dataset.corridorEntry;
        docEl.style.removeProperty("--corridor-pin");
      }
      // Belt-and-braces visibility cleanup: once the hero has fully
      // scrolled off (cover 1), hide it so it can never paint under
      // later sections during scroll-back-into-band edge cases.
      heroEl.style.visibility = heroCover >= 1 ? "hidden" : "";
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
      // Don't leave the corridor entry-pin engaged if the hook unmounts
      // mid-band — a stale transform on the sticky cell would capture
      // the docked-exit fixed canvas.
      const docEl = document.documentElement;
      delete docEl.dataset.corridorEntry;
      docEl.style.removeProperty("--corridor-pin");
    };
  }, [onScroll, onResize]);

  return telemetryRef;
}
