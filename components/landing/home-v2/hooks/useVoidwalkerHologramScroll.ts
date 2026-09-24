"use client";

import { useEffect, useState, type RefObject } from "react";

import {
  voidwalkerHologramEnterT,
  voidwalkerHologramExitT,
  voidwalkerHologramProgressRef,
} from "@/lib/voidwalker/voidwalkerHologramClock";
import {
  ABOUT_VOIDWALKER_HANDOFF_CHANGE_EVENT,
  aboutVoidwalkerHandoffRef,
  invalidateAboutVoidwalkerHandoff,
  isAboutVoidwalkerHandoffReady,
  resolveBottomAlignedPortraitSeat,
  voidwalkerHologramMorphT,
  writeAboutVoidwalkerHandoffMorph,
  writeAboutVoidwalkerHandoffTargets,
  type ViewportRect,
} from "@/lib/voidwalker/aboutVoidwalkerHandoff";
import { clamp01 } from "@/lib/math";
import { layoutViewportHeight } from "@/lib/viewport/layoutViewportHeight";
import {
  VOIDWALKER_PHONE_ERA_BAND,
  voidwalkerEraFromProgress,
  voidwalkerEraPickRef,
  voidwalkerEraScrubRef,
} from "@/lib/voidwalker/voidwalkerHologramClock";

import {
  ABOUT_DECK_STAGE,
  VOIDWALKER_HOLOGRAM_STAGE,
  VOIDWALKER_PHONE_RUNWAY,
  VOIDWALKER_PHONE_RUNWAY_MEDIA,
} from "../unifiedServicesInstrument";

const CAPABLE_QUERY = "(min-width: 1101px) and (prefers-reduced-motion: no-preference)";
const INTERACTIVE_ENTER = 0.58;
const INTERACTIVE_EXIT = 0.82;
const INTERACTIVE_MORPH = 0.92;
const EMPTY_RECT: ViewportRect = { cx: 0, cy: 0, w: 0, h: 0 };

function shouldWriteProgress(next: number, current: number): boolean {
  // Redundant-write suppression must never strand a scroll clock just shy of
  // an endpoint: 0 and 1 are semantic states used by visibility and takeover
  // ownership, not merely visually-close samples.
  if (next === 0 || next === 1) return next !== current;
  return Math.abs(next - current) >= 0.001;
}

/**
 * Resolve an actor's border box in the viewport pose it will occupy when the
 * sticky root is pinned. Offset geometry deliberately ignores every live
 * actor transform, and the root's current document Y is replaced with its
 * authored sticky `top`, so this stays valid while Voidwalker is still below
 * the viewport (ADR-082 U3).
 */
function futurePinnedRect(target: HTMLElement, stickyRoot: HTMLElement): ViewportRect | null {
  const w = target.offsetWidth;
  const h = target.offsetHeight;
  if (w <= 1 || h <= 1) return null;

  let x = 0;
  let y = 0;
  let node: HTMLElement | null = target;
  while (node && node !== stickyRoot) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  if (node !== stickyRoot) return null;

  const rootRect = stickyRoot.getBoundingClientRect();
  const parsedTop = Number.parseFloat(window.getComputedStyle(stickyRoot).top);
  const pinnedTop = Number.isFinite(parsedTop) ? parsedTop : 0;
  return {
    cx: rootRect.left + x + w / 2,
    cy: pinnedTop + y + h / 2,
    w,
    h,
  };
}

/**
 * Single scroll writer for the production Voidwalker hologram.
 *
 * It follows the About-stage contract: progress is derived from the sticky
 * runway on every scroll frame, reveal/exit values are pure functions of that
 * progress, and every disengage returns to a finished static layout. The
 * outer station receives the mode because it owns both the runway geometry
 * and the compositing exception; the inner `.vwh` owns visual motion only.
 */
export function useVoidwalkerHologramScroll(rootRef: RefObject<HTMLElement | null>): boolean {
  const [stageActive, setStageActive] = useState(false);

  useEffect(() => {
    const mountedRoot = rootRef.current;
    let frame = 0;
    let disposed = false;
    let engaged = false;
    let interactive = true;
    let currentEnter = -1;
    let currentExit = -1;
    let currentMorph = -1;
    /* The era the runway last resolved to. It is an INPUT to the next
       derivation, not just a cache — the hysteresis needs to know which side
       of a slice boundary the reader came from. */
    let currentEra = 0;
    let targetsDirty = true;
    let anchorFrame = 0;
    let pendingInitialAnchor = window.location.hash === "#voidwalker";
    let stationEl: HTMLElement | null = null;
    let corridorStage: HTMLElement | null = null;
    let aboutStation: HTMLElement | null = null;
    let observedSlot: HTMLElement | null = null;
    let observedDossier: HTMLElement | null = null;
    let observedTitle: HTMLElement | null = null;
    /* ADR-123 — the phone runway's own state: whether the stamp is on, the
       era the dwell last resolved to (an INPUT to the hysteresis, as
       `currentEra` is above), the last progress written, and whether a tap's
       glide has landed. */
    let phoneEngaged = false;
    let phoneEra = 0;
    let lastPhoneP = -1;
    let pickLanded = false;

    const capableMedia = window.matchMedia(CAPABLE_QUERY);
    const phoneMedia = window.matchMedia(VOIDWALKER_PHONE_RUNWAY_MEDIA);
    const targetResizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            targetsDirty = true;
            requestWrite();
          });
    const eraObserver = new MutationObserver(() => {
      targetsDirty = true;
      requestWrite();
    });

    const stationOf = (root: HTMLElement) => root.closest<HTMLElement>("#voidwalker");
    const settleInitialAnchor = () => {
      if (!pendingInitialAnchor || !stationEl) return;
      if (anchorFrame) window.cancelAnimationFrame(anchorFrame);
      anchorFrame = window.requestAnimationFrame(() => {
        anchorFrame = 0;
        if (window.location.hash !== "#voidwalker" || !stationEl?.isConnected) return;
        // Native hash positioning can run before the async About/Voidwalker
        // portals inflate their runways. Re-seat the requested station after
        // this hook has applied the final capable/fallback geometry.
        // ⚠ THE SEAT, NOT THE STATION (ADR-123): `.vwd` carries
        // `data-station-seat`. On the pinned rungs its static top is the
        // station's own; on the flowing ones the station keeps ~67px of
        // padding and a station-top landing sat the instrument that far down.
        const seatEl = stationEl.querySelector<HTMLElement>("[data-station-seat]") ?? stationEl;
        const top = seatEl.getBoundingClientRect().top + window.scrollY;
        window.scrollTo(0, Math.max(0, Math.round(top)));
      });
    };
    const cancelInitialAnchor = () => {
      pendingInitialAnchor = false;
      if (anchorFrame) {
        window.cancelAnimationFrame(anchorFrame);
        anchorFrame = 0;
      }
    };
    const fallbackActive = () => {
      if (!corridorStage || !corridorStage.isConnected) {
        corridorStage = document.querySelector<HTMLElement>(".home-v2-stage");
      }
      return !corridorStage || corridorStage.dataset.fallback === "true";
    };

    const resetProgress = () => {
      voidwalkerHologramProgressRef.current = {
        progress: 0,
        enter: 1,
        exit: 0,
        morph: 1,
        engaged: false,
      };
    };

    const clearHandoff = () => {
      const wasReady = isAboutVoidwalkerHandoffReady(aboutVoidwalkerHandoffRef.current);
      stationEl?.removeAttribute("data-vw-handoff");
      invalidateAboutVoidwalkerHandoff(false);
      targetsDirty = true;
      observedSlot = null;
      observedDossier = null;
      observedTitle = null;
      targetResizeObserver?.disconnect();
      aboutStation?.style.removeProperty("--about-handoff-morph");
      if (wasReady) window.dispatchEvent(new Event(ABOUT_VOIDWALKER_HANDOFF_CHANGE_EVENT));
    };

    const disengage = (root: HTMLElement | null) => {
      if (stationEl?.dataset.vwMode === "hologram") stationEl.removeAttribute("data-vw-mode");
      clearHandoff();
      eraObserver.disconnect();
      root?.removeAttribute("data-vwh-ready");
      root?.removeAttribute("data-vwh-interactive");
      root?.style.removeProperty("--vwh-in");
      root?.style.removeProperty("--vwh-exit");
      root?.style.removeProperty("--vwh-morph");
      if (root) root.inert = false;
      if (engaged && !disposed) setStageActive(false);
      engaged = false;
      interactive = true;
      currentEnter = currentExit = currentMorph = -1;
      currentEra = 0;
      resetProgress();
    };

    const observeTargets = (
      root: HTMLElement,
      slot: HTMLElement,
      dossier: HTMLElement,
      title: HTMLElement
    ) => {
      if (slot === observedSlot && dossier === observedDossier && title === observedTitle) return;
      targetResizeObserver?.disconnect();
      targetResizeObserver?.observe(root);
      targetResizeObserver?.observe(slot);
      targetResizeObserver?.observe(dossier);
      targetResizeObserver?.observe(title);
      observedSlot = slot;
      observedDossier = dossier;
      observedTitle = title;
    };

    const publishTargets = (root: HTMLElement, capable: boolean) => {
      const slot = root.querySelector<HTMLElement>("[data-vwh-handoff-target='portrait']");
      const dossier = root.querySelector<HTMLElement>("[data-vwh-handoff-target='dossier']");
      const title = root.querySelector<HTMLElement>("[data-vwh-handoff-target='era-title']");
      if (!slot || !dossier || !title) {
        targetResizeObserver?.disconnect();
        observedSlot = null;
        observedDossier = null;
        observedTitle = null;
        writeAboutVoidwalkerHandoffTargets({
          portraitSeat: EMPTY_RECT,
          firstDossierRect: EMPTY_RECT,
          eraTitleRect: EMPTY_RECT,
          capable,
          now: performance.now(),
        });
        stationEl?.removeAttribute("data-vw-handoff");
        window.dispatchEvent(new Event(ABOUT_VOIDWALKER_HANDOFF_CHANGE_EVENT));
        return;
      }

      observeTargets(root, slot, dossier, title);
      const slotRect = futurePinnedRect(slot, root);
      const dossierRect = futurePinnedRect(dossier, root);
      const titleRect = futurePinnedRect(title, root);
      if (!slotRect || !dossierRect || !titleRect) {
        writeAboutVoidwalkerHandoffTargets({
          portraitSeat: EMPTY_RECT,
          firstDossierRect: EMPTY_RECT,
          eraTitleRect: EMPTY_RECT,
          capable,
          now: performance.now(),
        });
        stationEl?.removeAttribute("data-vw-handoff");
        window.dispatchEvent(new Event(ABOUT_VOIDWALKER_HANDOFF_CHANGE_EVENT));
        return;
      }

      writeAboutVoidwalkerHandoffTargets({
        portraitSeat: resolveBottomAlignedPortraitSeat(slotRect),
        firstDossierRect: dossierRect,
        eraTitleRect: titleRect,
        capable,
        now: performance.now(),
      });
      if (isAboutVoidwalkerHandoffReady(aboutVoidwalkerHandoffRef.current)) {
        stationEl?.setAttribute("data-vw-handoff", "ready");
        settleInitialAnchor();
      } else {
        stationEl?.removeAttribute("data-vw-handoff");
      }
      window.dispatchEvent(new Event(ABOUT_VOIDWALKER_HANDOFF_CHANGE_EVENT));
    };

    /* ── ADR-123: THE PHONE RUNWAY ─────────────────────────────────────
       The same listener and the same rAF as the capable branch — ONE writer
       on this station (ADR-082 U1's two-clocks defect is why). On the ≤700
       rung the station is a runway of `100svh + --vw-phone-dwell` with the
       instrument pinned inside it, and the five eras ride the dwell exactly
       as the desktop's do (ADR-082 U10): `p` is the pinned travel, the era
       is derived from it with the same hysteresis, a tap's glide holds its
       era until it lands. It writes the STAMP the sheet keys on and `--vwh-p`
       — never `data-vw-mode`, `data-vwh-ready`, `data-vw-handoff` or the
       hologram progress ref, so §G's choreography, the desktop weld and the
       title decode stay off, as every phone pin (`about-voidwalker-handoff-
       boundaries`, the seams spec's boot) requires. */
    const disengagePhone = () => {
      if (!phoneEngaged) return;
      phoneEngaged = false;
      phoneEra = 0;
      lastPhoneP = -1;
      pickLanded = false;
      voidwalkerEraPickRef.current = null;
      stationEl?.removeAttribute("data-vw-phone");
      rootRef.current?.style.removeProperty("--vwh-p");
    };
    const writePhone = (root: HTMLElement) => {
      const runway = root.parentElement; // .vw--hologram
      if (!runway || !stationEl) return;
      if (!phoneEngaged) {
        phoneEngaged = true;
        stationEl.setAttribute("data-vw-phone", "runway");
      }
      const rr = runway.getBoundingClientRect();
      /* MEASURED, never authored (ADR-115 U1): the band is `100dvh` and the
         runway `svh`, so the travel moves with the bar and the clock follows
         the box the reader is looking at. */
      const travel = rr.height - root.getBoundingClientRect().height;
      const raw = travel > 0 ? clamp01(-rr.top / travel) : 0;
      const p = raw === 0 ? 0 : raw; // never `-0` at the pin (ADR-102)
      if (shouldWriteProgress(p, lastPhoneP)) {
        root.style.setProperty("--vwh-p", p.toFixed(4));
        lastPhoneP = p;
      }
      // Off screen the era HOLDS: a change there glitches a figure nobody sees.
      if (rr.bottom <= 0 || rr.top >= layoutViewportHeight()) return;
      const pick = voidwalkerEraPickRef.current;
      if (pick) {
        phoneEra = pick.era;
        if (!pickLanded && performance.now() - pick.at < 900) return;
        voidwalkerEraPickRef.current = null;
        pickLanded = false;
      }
      const count = root.querySelectorAll("[data-vwh-era-tab]").length || 1;
      const next = voidwalkerEraFromProgress(p, count, phoneEra, VOIDWALKER_PHONE_ERA_BAND);
      if (next !== phoneEra) {
        phoneEra = next;
        voidwalkerEraScrubRef.current?.(next);
      }
    };

    const write = () => {
      frame = 0;
      if (disposed) return;
      const root = rootRef.current;
      if (!root) {
        disengage(null);
        return;
      }

      stationEl = stationOf(root);
      if (!stationEl) return;

      // The surface attribute removes the authored star tile on every
      // hologram path. Static/mobile/PRM remain solid-void; only capable
      // stage mode becomes a transparent window onto the live corridor.
      // Written ONCE: it was rewritten on every scroll frame, on every rung.
      if (stationEl.dataset.vwSurface !== "hologram") {
        stationEl.setAttribute("data-vw-surface", "hologram");
      }

      const capable =
        ABOUT_DECK_STAGE && VOIDWALKER_HOLOGRAM_STAGE && capableMedia.matches && !fallbackActive();
      if (!capable) {
        // On the TRANSITION only — this ran ~10 no-op DOM writes per scroll
        // frame on every phone (the 2026-09-24 review).
        if (engaged) disengage(root);
        if (VOIDWALKER_PHONE_RUNWAY && phoneMedia.matches) {
          writePhone(root);
          settleInitialAnchor();
          return;
        }
        disengagePhone();
        settleInitialAnchor();
        return;
      }
      disengagePhone();

      if (!engaged) {
        engaged = true;
        stationEl.setAttribute("data-vw-mode", "hologram");
        root.setAttribute("data-vwh-ready", "");
        root.removeAttribute("data-vwh-interactive");
        root.inert = true;
        interactive = false;
        eraObserver.observe(root, { attributes: true, attributeFilter: ["data-vwh-era"] });
        setStageActive(true);
      }

      if (targetsDirty) {
        targetsDirty = false;
        publishTargets(root, capable);
      }

      const eraCount = root.querySelectorAll("[data-vwh-era-tab]").length || 1;
      const runway = root.parentElement; // .vw--hologram
      if (!runway) return;
      // The LAYOUT viewport (ADR-113): the runway is in svh, and on a tablet
      // whose toolbar moves, innerHeight would re-scale every clock under the
      // thumb. Identical to innerHeight wherever nothing overlays the frame.
      const vh = layoutViewportHeight();
      const rect = runway.getBoundingClientRect();
      const travel = rect.height - vh;
      const progress = travel > 0 ? clamp01(-rect.top / travel) : 0;
      const enter = voidwalkerHologramEnterT(progress);
      const exit = voidwalkerHologramExitT(progress);
      const parsedStickyTop = Number.parseFloat(window.getComputedStyle(root).top);
      const stickyTop = Number.isFinite(parsedStickyTop) ? parsedStickyTop : 0;
      const pinned = root.getBoundingClientRect().top <= stickyTop;
      // The overlap lets runway progress become fractionally positive just
      // before the sticky actor reaches its seat. Keep the takeover exactly
      // dormant until that seat is pinned so no destination pixel travels up
      // with normal flow (ADR-082 U3/U4).
      const morph = pinned ? voidwalkerHologramMorphT(progress) : 0;

      voidwalkerHologramProgressRef.current = { progress, enter, exit, morph, engaged: true };
      writeAboutVoidwalkerHandoffMorph(morph);

      if (shouldWriteProgress(enter, currentEnter)) {
        root.style.setProperty("--vwh-in", enter.toFixed(4));
        currentEnter = enter;
      }
      if (shouldWriteProgress(exit, currentExit)) {
        root.style.setProperty("--vwh-exit", exit.toFixed(4));
        currentExit = exit;
      }
      if (shouldWriteProgress(morph, currentMorph)) {
        root.style.setProperty("--vwh-morph", morph.toFixed(4));
        if (!aboutStation || !aboutStation.isConnected) {
          aboutStation = document.querySelector<HTMLElement>("#about");
        }
        aboutStation?.style.setProperty("--about-handoff-morph", morph.toFixed(4));
        currentMorph = morph;
      }

      /* ⚠ SCROLL IS THE ERA SELECTOR, and only while the sheet is actually
         interactive. Deriving it here keeps ONE scroll writer on this
         surface — a second listener stepping eras would be the two-clocks
         defect this station has already paid for once (ADR-082 U1). */
      const nextInteractive =
        morph >= INTERACTIVE_MORPH && enter >= INTERACTIVE_ENTER && exit <= INTERACTIVE_EXIT;
      if (nextInteractive) {
        const nextEra = voidwalkerEraFromProgress(progress, eraCount, currentEra);
        if (nextEra !== currentEra) {
          currentEra = nextEra;
          voidwalkerEraScrubRef.current?.(nextEra);
        }
      }
      if (nextInteractive !== interactive) {
        root.inert = !nextInteractive;
        root.toggleAttribute("data-vwh-interactive", nextInteractive);
        interactive = nextInteractive;
      }
    };

    const requestWrite = () => {
      if (!frame) frame = window.requestAnimationFrame(write);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        targetsDirty = true;
        requestWrite();
      }
    };
    const onResize = () => {
      targetsDirty = true;
      requestWrite();
    };
    /* ADR-123: a tap's glide has landed — the era is scroll's again. Where
       the engine never fires `scrollend`, `writePhone`'s 900ms cap stands in. */
    const onScrollEnd = () => {
      if (!voidwalkerEraPickRef.current) return;
      pickLanded = true;
      requestWrite();
    };

    requestWrite();
    window.addEventListener("scroll", requestWrite, { passive: true });
    window.addEventListener("scrollend", onScrollEnd);
    window.addEventListener("resize", onResize);
    phoneMedia.addEventListener?.("change", onResize);
    window.addEventListener("wheel", cancelInitialAnchor, { passive: true });
    window.addEventListener("touchstart", cancelInitialAnchor, { passive: true });
    window.addEventListener("keydown", cancelInitialAnchor);
    document.addEventListener("visibilitychange", onVisibility);
    capableMedia.addEventListener?.("change", onResize);
    const settleA = window.setTimeout(() => {
      onResize();
      settleInitialAnchor();
    }, 600);
    const settleB = window.setTimeout(() => {
      onResize();
      settleInitialAnchor();
      pendingInitialAnchor = false;
    }, 1800);

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      if (anchorFrame) window.cancelAnimationFrame(anchorFrame);
      window.clearTimeout(settleA);
      window.clearTimeout(settleB);
      window.removeEventListener("scroll", requestWrite);
      window.removeEventListener("scrollend", onScrollEnd);
      window.removeEventListener("resize", onResize);
      phoneMedia.removeEventListener?.("change", onResize);
      window.removeEventListener("wheel", cancelInitialAnchor);
      window.removeEventListener("touchstart", cancelInitialAnchor);
      window.removeEventListener("keydown", cancelInitialAnchor);
      document.removeEventListener("visibilitychange", onVisibility);
      capableMedia.removeEventListener?.("change", onResize);
      targetResizeObserver?.disconnect();
      eraObserver.disconnect();
      disengage(mountedRoot);
      disengagePhone();
      if (stationEl?.dataset.vwSurface === "hologram") {
        stationEl.removeAttribute("data-vw-surface");
      }
    };
  }, [rootRef]);

  return stageActive;
}
