"use client";

import { useEffect, type RefObject } from "react";
import { ABOUT_DECK_STAGE } from "../unifiedServicesInstrument";
import { corridorExitSpeedRamp } from "@/lib/home-v2/epilogueTimeline";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { clamp01 } from "@/lib/math";

/** Corridor `epilogueProgress` at/after which the live sphere docks as
 *  a fixed backdrop for the corridor-exit zoom-dissipate (ADR-021).
 *  Chosen so the BILLIONS title is essentially up (TITLE_IN ends 0.74)
 *  and the camera has all but landed before the instrument is held. */
const DOCK_ENGAGE_EP = 0.72;
/** Scroll runway (in viewports) over which the dissipate clock fills —
 *  i.e. the "length of road" between the epilogue sphere ("everyone is
 *  racing") and the settled Services centerpiece. EVERYTHING on the seam
 *  is keyed to this single clock (camera fly-in, shell scatter, the core
 *  shrink-to-centre, and the Services copy entrance), so widening it
 *  stretches the whole transition over more scroll WITHOUT changing any
 *  animation curve — the dive just feels less rushed / more spacious.
 *
 *  2026-06-20: lengthened from 0.9 → 1.6 so the core has more road to
 *  shrink in over (the prior 0.9 made the two sections feel jammed
 *  together). This is the single knob for "make the road longer/shorter". */
const DISSIPATE_SCROLL_SPAN_VH = 1.6;
/** Engage the fixed dock slightly BEFORE #services physically enters
 *  the viewport. See ADR-021 history for the rationale. */
const DOCK_PRELOAD_VH = 0.25;
/** Cap on the body veil so the canvas remains visible underneath
 *  through the dock window. The veil ramps from 0 to this cap with
 *  the dissipate clock and never goes higher. */
const VEIL_DOCK_CAP = 0.38;
/** Lower veil cap for the ambient-only Services background. Kept well
 *  below the dock cap so the inside-sphere particle bed stays clearly
 *  visible behind the Services content for the whole section. */
const VEIL_AMBIENT_CAP = 0.12;
/** Start the ambient hold once the surface dissipate is complete. */
const AMBIENT_ENGAGE_RAW = 0.999;
/** Fade the ambient particles as the NEXT station approaches. `#about` is
 *  a pinned TRANSPARENT stage (the deck-flip beat plays over the
 *  still-live canvas), so the ambient hold survives THROUGH #about and
 *  the receded bed finishes dying exactly as the next OPAQUE station's
 *  top reaches the viewport top — cover and canvas death land on the same
 *  edge (the ADR-033 coincide-by-design retune, moved one station down).
 *  ABOUT_DECK_STAGE=false restores #about as the kill target. */
const NEXT_STATION_FADE_START_VH = 0.6;
const NEXT_STATION_FADE_END_VH = 0.0;

// `clamp01` now comes from `@/lib/math` (Phase-5 consolidation).

/**
 * useCorridorExitScroll — single rAF scroll watcher for the
 * production corridor → Services seam (ADR-021, 2026-06-19 amendment).
 *
 * Writes:
 *
 *   - `--corridor-dissipate` (0..1) on `<html>` — the dissipate
 *     clock. CSS reads this for the leading-edge transparency.
 *   - `data-corridor-docked` attribute on `<html>` — promotes
 *     `.home-v2-stage__canvas` to a fixed full-viewport backdrop so
 *     the live R3F scene persists across the seam.
 *   - `data-corridor-exit` attribute + `--corridor-exit-veil` (0..1)
 *     on `<html>` — drives the fixed `body::before` veil that ramps
 *     from 0 → VEIL_DOCK_CAP across the dissipate, then holds at a
 *     lower ambient cap while the inside-sphere particle bed remains
 *     visible behind Services.
 *   - `depthGatewayStore.transform.docked` + `dockProgress` —
 *     `dockProgress` IS the dissipate clock; the camera rig +
 *     substrate painters read it to fly into the sphere + scatter
 *     the surface particles. `ProjectedBrandmarkActor` reads
 *     `dockProgress` to fade the brandmark out across the back half
 *     of the dissipate (instead of re-centring into Services).
 *
 * RETIRED in the 2026-06-19 amendment (Services is now a content
 * section, not a brandmark runway):
 *
 *   - `data-services-brandmark` (`"hold"` / `"fade"`) gate +
 *     `--services-brandmark` opacity var — the brandmark no longer
 *     re-centres / holds inside `#services`.
 *   - `data-services-pixelate` + `--services-pixelate` +
 *     `transform.seamMorph` — the seam pixel field is unmounted;
 *     no late-pixel dissolve in Services.
 *   - `data-services-brandmark` / `data-services-pixelate` remain
 *     retired. `data-services-ambient` is intentionally re-enabled as
 *     a background-only hold: no centred brandmark, no pixel field,
 *     only the interior sphere particles / starfield behind content.
 *
 * For continuity with the surviving store fields, `seamMorph` remains
 * inert at 0; `servicesAmbient` / `servicesAmbientLevel` are the
 * background-only continuation signal.
 *
 * Engages off the corridor's own `epilogueProgress >= DOCK_ENGAGE_EP`
 * (NOT off `#services`'s rect alone) so the dwell at the landed
 * sphere opens BEFORE the user scrolls into the section. Once
 * dissipate ≥ 0.999, the dock releases and the R3F frameloop switches
 * to ambient-only mode until the next station approaches.
 *
 * Single-writer rule (ADR-021 invariant): this hook is the ONLY
 * writer of `docked` / `dockProgress` / `seamMorph` /
 * `servicesAmbient`.
 *
 * Fallback gate (`dockCapable`): on mobile, reduced-motion, or
 * WebGL-fallback the dock never engages — the page reads as a
 * sequential dark cut from the corridor epilogue to the Services
 * section.
 */
export function useCorridorExitScroll(rootRef: RefObject<HTMLDivElement | null>): void {
  useEffect(() => {
    let frame = 0;
    let disposed = false;

    const write = () => {
      frame = 0;
      if (disposed) return;

      const root = rootRef.current;
      if (!root) return;

      const services = root.querySelector<HTMLElement>("#services");
      if (!services) return;

      const vh = window.innerHeight || 1;
      const servicesRect = services.getBoundingClientRect();
      const reducedMotion =
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      const mobile = window.matchMedia?.("(max-width: 960px)").matches ?? false;
      const corridorFallback =
        document.querySelector<HTMLElement>(".home-v2-stage")?.dataset.fallback === "true";
      const dockCapable = !reducedMotion && !mobile && !corridorFallback;

      // Dissipate clock: 0 when #services's top is at the viewport
      // bottom, 1 after the section has risen through a SHORT runway
      // (~0.9 viewport, ADR-021 amendment) so the zoom-dissipate
      // resolves as the section's header reaches the viewport top.
      const rawDissipate = clamp01((vh - servicesRect.top) / (vh * DISSIPATE_SCROLL_SPAN_VH));
      const dissipate = corridorExitSpeedRamp(rawDissipate);
      const sectionNearDock =
        servicesRect.top < vh * (1 + DOCK_PRELOAD_VH) && servicesRect.bottom > 0;
      // The kill target: the ambient fade keys off the first OPAQUE
      // station below the corridor. `#about` is a pinned TRANSPARENT
      // stage the ambient must SURVIVE (the deck-flip beat plays over
      // the still-live canvas), so the kill lands one station down.
      // ABOUT_DECK_STAGE off restores the ADR-033 #about kill
      // byte-identically.
      //
      // ADR-056 retired `#proof`, which used to hold this slot. `#practice`
      // now occupies the SAME scroll position (the removed station was
      // between them), so the seam is unmoved — and it is a plain opaque
      // station, which is the only property this read requires.
      const nextStation = ABOUT_DECK_STAGE
        ? root.querySelector<HTMLElement>("#practice")
        : (root.querySelector<HTMLElement>("#about") ??
          root.querySelector<HTMLElement>("#practice"));
      const nextStationTopVh =
        (nextStation?.getBoundingClientRect().top ?? servicesRect.bottom) / vh;
      // The AMBIENT hold outlives the dock gate (ADR-030 Update 1). The
      // bottom gate must expire WITH the fade envelope — a rect-boundary
      // conjunction (services.bottom > 0, or about.bottom > 0 with the
      // ADR-047 retarget) HARD-CUTS the canvas at exactly the next
      // station's top because adjacent rects share that edge (the ADR-030
      // Update 1 §6 seam bug, recorded twice now). Keying the gate to the
      // SAME next-station top the envelope reads makes the two expire
      // together by construction, spanning the whole pinned #about.
      const sectionNearAmbient =
        servicesRect.top < vh * (1 + DOCK_PRELOAD_VH) &&
        nextStationTopVh > NEXT_STATION_FADE_END_VH;

      // Dock OFF the corridor epilogue (sphere landed + BILLIONS title
      // up), not off this section's scroll position. See ADR-021.
      const ep = useDepthGatewayStore.getState().transform.epilogueProgress;
      const docked = dockCapable && ep >= DOCK_ENGAGE_EP && sectionNearDock && rawDissipate < 0.999;

      services.style.setProperty("--corridor-dissipate", dissipate.toFixed(4));
      document.documentElement.style.setProperty("--corridor-dissipate", dissipate.toFixed(4));
      if (docked) {
        document.documentElement.setAttribute("data-corridor-docked", "true");
      } else {
        document.documentElement.removeAttribute("data-corridor-docked");
      }

      // ── Background-only Services ambient ───────────────────────
      // Keep the "inside the sphere" particle bed alive behind the
      // Services content after the surface dissipate completes. This
      // is deliberately NOT the retired brandmark runway: no centred
      // SVG, no seam pixel field, and no brandmark opacity gate.
      const ambientFadeRaw = clamp01(
        (NEXT_STATION_FADE_START_VH - nextStationTopVh) /
          (NEXT_STATION_FADE_START_VH - NEXT_STATION_FADE_END_VH)
      );
      const ambientLevelRaw = 1 - corridorExitSpeedRamp(ambientFadeRaw);
      const servicesAmbient =
        dockCapable &&
        ep >= DOCK_ENGAGE_EP &&
        sectionNearAmbient &&
        rawDissipate >= AMBIENT_ENGAGE_RAW &&
        ambientLevelRaw > 0.001;
      const servicesAmbientLevel = servicesAmbient ? ambientLevelRaw : 0;

      if (servicesAmbient) {
        document.documentElement.setAttribute("data-services-ambient", "true");
        document.documentElement.style.setProperty(
          "--services-ambient",
          servicesAmbientLevel.toFixed(4)
        );
      } else {
        document.documentElement.removeAttribute("data-services-ambient");
        document.documentElement.style.removeProperty("--services-ambient");
      }

      // ── Body veil ──────────────────────────────────────────────
      // While docked the veil ramps from 0 → VEIL_DOCK_CAP with the
      // dissipate so the canvas stays visible underneath during the
      // zoom-in. In ambient mode it stays low enough for the interior
      // particles to remain visible behind Services copy/cards, then
      // fades with `servicesAmbientLevel` as #continuum approaches.
      const corridorExit = docked || servicesAmbient;
      const veilAlpha = docked
        ? Math.min(VEIL_DOCK_CAP, dissipate * VEIL_DOCK_CAP)
        : servicesAmbient
          ? VEIL_AMBIENT_CAP * servicesAmbientLevel
          : 0;
      if (corridorExit) {
        document.documentElement.setAttribute("data-corridor-exit", "true");
        document.documentElement.style.setProperty("--corridor-exit-veil", veilAlpha.toFixed(4));
      } else {
        document.documentElement.removeAttribute("data-corridor-exit");
        document.documentElement.style.removeProperty("--corridor-exit-veil");
      }

      // Single-writer rule: only own dock / dissipate / inert seam +
      // ambient channels. `useDepthScroll` stays the sole writer of
      // progress / paintProgress / epilogueProgress.
      const store = useDepthGatewayStore.getState();
      const prev = store.transform;
      const nextDockProgress = docked ? dissipate : 0;
      const dockChanged =
        prev.docked !== docked || Math.abs(prev.dockProgress - nextDockProgress) > 0.0005;
      // The seam pixel field is still retired; keep its clock inert.
      // The ambient fields are background-only and intentionally driven
      // so the sphere's interior particles remain visible in Services.
      const seamMorphInert = 0;
      const seamInertChanged = Math.abs(prev.seamMorph - seamMorphInert) > 0.0005;
      const ambientChanged =
        prev.servicesAmbient !== servicesAmbient ||
        Math.abs(prev.servicesAmbientLevel - servicesAmbientLevel) > 0.0005;
      if (dockChanged || seamInertChanged || ambientChanged) {
        store.setTransform({
          ...prev,
          docked,
          dockProgress: nextDockProgress,
          seamMorph: seamMorphInert,
          servicesAmbient,
          servicesAmbientLevel,
        });
      }
    };

    const requestWrite = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(write);
    };

    requestWrite();
    window.addEventListener("scroll", requestWrite, { passive: true });
    window.addEventListener("resize", requestWrite);
    // Tab-return re-sync (2026-07-17): this rAF-throttled watcher freezes
    // while the tab is hidden and no scroll/resize reliably fires on return,
    // so the dissipate / docked / servicesAmbient channels can hold a stale
    // pre-hide read — leaving the brandmark centerpiece un-parked and the
    // #services copy hidden. Force a fresh write from the live #services
    // rect the instant the tab returns (idempotent — the per-property
    // change-guards no-op it when the frozen state was already correct).
    const onVisibility = () => {
      if (!document.hidden) write();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestWrite);
      window.removeEventListener("resize", requestWrite);
      document.removeEventListener("visibilitychange", onVisibility);
      document.documentElement.removeAttribute("data-corridor-docked");
      document.documentElement.removeAttribute("data-corridor-exit");
      document.documentElement.removeAttribute("data-services-ambient");
      document.documentElement.style.removeProperty("--corridor-dissipate");
      document.documentElement.style.removeProperty("--corridor-exit-veil");
      document.documentElement.style.removeProperty("--services-ambient");
      const store = useDepthGatewayStore.getState();
      store.setTransform({
        ...store.transform,
        docked: false,
        dockProgress: 0,
        seamMorph: 0,
        servicesAmbient: false,
        servicesAmbientLevel: 0,
      });
    };
  }, [rootRef]);
}
