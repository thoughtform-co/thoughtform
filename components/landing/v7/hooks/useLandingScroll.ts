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

/** The hero scrolls on NATIVE (compositor) scroll — no JS wheel
 *  hijack. A main-thread scroll follower fought the corridor R3F
 *  render and read "heavy/laggy"; native compositor scroll stays
 *  smooth. This hook only flips hero visibility off once it has
 *  lifted clear of the viewport. */
const HERO_CURTAIN_RELEASE_VH = 1.35;

export function useLandingScroll(rootRef: React.RefObject<HTMLDivElement | null>) {
  const telemetryRef = useRef<ScrollTelemetry>({
    progress: 0,
    activeStation: "hero",
    heroCover: 0,
  });
  const rafId = useRef<number | null>(null);
  const lastScrollY = useRef(-1);

  const writeHeroCurtainLift = useCallback((heroEl: HTMLElement, vh: number) => {
    heroEl.style.transform = "";
    const scrollY = window.scrollY;
    heroEl.style.visibility =
      scrollY >= vh - 0.5 || scrollY > vh * HERO_CURTAIN_RELEASE_VH ? "hidden" : "";
  }, []);

  // Corridor entry state is toggled synchronously on scroll because the
  // CSS uses it as a layer-mode switch (`sticky` -> fixed viewport hold)
  // for the hero curtain reveal.
  const syncCorridorEntryState = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;

    const defEl =
      root.querySelector<HTMLElement>("#definition") ??
      root.querySelector<HTMLElement>("[data-home-corridor-mount]");
    if (!defEl) return;

    const docEl = document.documentElement;
    const defTop = defEl.getBoundingClientRect().top;
    // Engage entry-hold on ANY positive defTop (cell unpinned / not
    // yet pinned) so the fixed→sticky handoff has no vertical gap on
    // the reverse-scroll side: when the user scrolls back up across
    // the seam, the moment sticky releases (defTop > 0) fixed-hold
    // takes over, freezing the cell at viewport top instead of letting
    // it briefly drop into natural flow before the previous 0.5px
    // threshold engaged.
    if (defTop > 0) {
      if (docEl.dataset.corridorEntry !== "1") docEl.dataset.corridorEntry = "1";
    } else {
      delete docEl.dataset.corridorEntry;
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

    // Capability gate (single matchMedia read per frame, reused by the
    // parallax block at the bottom of the frame). The hero -> corridor
    // seam is a fixed-entry curtain reveal (ADR-022 v8): no portalled
    // proxy plane, no held hero, no `--hero-cover` transform channel.
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
    //   CSS temporarily makes the sticky cell `position: fixed` ONLY
    //   while `data-corridor-entry` is set, so the frame sits frozen at
    //   viewport top without scroll-linked counter-transforms. At
    //   defTop <= 0 (stage reached the top) the flag clears and the
    //   corridor's own sticky pin + flythrough take over untouched. The
    //   stage rect that `useDepthScroll` reads is never transformed, so
    //   corridor timing is unaffected.
    //
    // On the production homepage `#definition` is stripped and replaced
    // by the home-v2 corridor mount (ADR-018), so fall back to the
    // mount placeholder — without it the entry state is never toggled.
    const heroEl = root.querySelector<HTMLElement>("#hero");
    const defEl =
      root.querySelector<HTMLElement>("#definition") ??
      root.querySelector<HTMLElement>("[data-home-corridor-mount]");
    let heroCover = 0;
    if (heroEl && defEl) {
      // Progress of the hero scrolling off its own 100vh. Measured from
      // scrollY (not the corridor mount's rect — that mount is
      // `position: fixed` during the entry band, so its top reads ~0 even
      // at scrollY 0 and can't drive the hero's own exit).
      const raw = Math.max(0, Math.min(1, scrollY / vh));
      // smootherstep so the hero eases away rather than tracking the
      // wheel 1:1 — this is the "soft dissolve" exit feel.
      heroCover = raw * raw * raw * (raw * (raw * 6 - 15) + 10);
      // Hero-only exit channel (ADR-022 v8): CSS reads `--hero-cover` to
      // drift the card up + fade the copy. Background image stays opaque
      // (gateway shield) and the corridor channels are untouched. Skipped
      // under reduced motion (the CSS is gated the same way).
      if (reduceMotion) {
        heroEl.style.removeProperty("--hero-cover");
      } else {
        heroEl.style.setProperty("--hero-cover", heroCover.toFixed(4));
      }
      // Entry layer state (`data-corridor-entry`) is written synchronously
      // in `syncCorridorEntryState` on every scroll event so the fixed
      // hold clears exactly when native sticky takes over. The hero rides
      // native compositor scroll; this is visibility cleanup only.
      writeHeroCurtainLift(heroEl, vh);
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

    // Rail station label bridge (ADR-030 Update 1): publish the active
    // station on <html> so the RailStationLabel's MutationObserver can
    // react (it gates itself on data-corridor-engaged separately).
    // Delta-gated — single writer, same cadence as the nav toggles.
    const docEl = document.documentElement;
    if (docEl.getAttribute("data-active-station") !== activeKey) {
      docEl.setAttribute("data-active-station", activeKey);
    }

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
  }, [rootRef, writeHeroCurtainLift]);

  const onScroll = useCallback(() => {
    syncCorridorEntryState();
    if (rafId.current) return;
    rafId.current = window.requestAnimationFrame(onScrollFrame);
  }, [onScrollFrame, syncCorridorEntryState]);

  const onResize = useCallback(() => {
    onScroll();
  }, [onScroll]);

  // Run FIRST frame synchronously before paint to prevent hero flash
  useLayoutEffect(() => {
    syncCorridorEntryState();
    onScrollFrame();
  }, [onScrollFrame, syncCorridorEntryState]);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (rafId.current) window.cancelAnimationFrame(rafId.current);
      // Don't leave the corridor entry hold engaged if the hook unmounts
      // mid-band.
      const docEl = document.documentElement;
      delete docEl.dataset.corridorEntry;
    };
  }, [onScroll, onResize]);

  return telemetryRef;
}
