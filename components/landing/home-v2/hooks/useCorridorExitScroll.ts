"use client";

import { useEffect, type RefObject } from "react";
import { ABOUT_DECK_STAGE, VOIDWALKER_EXTENDS_CORRIDOR } from "../unifiedServicesInstrument";
import { corridorDissipateRef } from "@/lib/home-v2/corridorDissipateRef";
import { corridorExitSpeedRamp } from "@/lib/home-v2/epilogueTimeline";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { clamp01 } from "@/lib/math";

/** Lazily-constructed MediaQueryList singletons (2026-07-29 perf pass —
 *  `window.matchMedia()` was being CONSTRUCTED twice per scroll frame;
 *  a `MediaQueryList` is live, so `.matches` per frame is the whole
 *  intent). Module scope survives remounts; created on first frame so
 *  the module stays SSR-safe. */
let prmQuery: MediaQueryList | null = null;
let mobileQuery: MediaQueryList | null = null;

/** Smallest veil/ambient alpha step the compositor can express — the
 *  quantum for the per-frame `<html>` var writes below. Both vars feed
 *  8-bit alpha channels only, so skipping sub-1/255 deltas is
 *  pixel-identical while cutting whole-document style invalidations
 *  from every frame to ~35 across the window. */
const ALPHA_QUANTUM = 1 / 255;

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
/** Fade the ambient particles as the NEXT opaque station approaches. `#about`
 *  is a pinned TRANSPARENT stage, so the ambient hold survives THROUGH it.
 *  In capable hologram mode `#voidwalker` is transparent too and `#practice`
 *  owns the cover/kill edge; static and fallback Voidwalker paths remain
 *  opaque and own that same edge themselves. ABOUT_DECK_STAGE=false restores
 *  #about as the kill target. */
const NEXT_STATION_FADE_START_VH = 0.6;
const NEXT_STATION_FADE_END_VH = 0.0;

// `clamp01` now comes from `@/lib/math` (Phase-5 consolidation).

/**
 * useCorridorExitScroll — single rAF scroll watcher for the
 * production corridor → Services seam (ADR-021, 2026-06-19 amendment).
 *
 * Writes:
 *
 *   - `corridorDissipateRef` (0..1) — the dissipate clock. The clock
 *     has NO CSS consumers (every reader is JS), so since the
 *     2026-07-29 perf pass it travels through the module ref and never
 *     touches the DOM — the old per-frame `<html>` + `#services` var
 *     writes invalidated computed style document-wide for nothing.
 *     Readers go through `readCorridorDissipate(fallback)`, whose
 *     inline-style fallback keeps the lab routes (which drive the var
 *     on `documentElement` themselves) byte-identical.
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
    // Element caches (2026-07-29 perf pass) — re-resolved only when
    // missing or detached, instead of 3 querySelector walks per frame.
    let servicesEl: HTMLElement | null = null;
    let stageEl: HTMLElement | null = null;
    let nextStationEl: HTMLElement | null = null;
    let aboutEl: HTMLElement | null = null;
    let voidwalkerEl: HTMLElement | null = null;
    let practiceEl: HTMLElement | null = null;
    let contactEl: HTMLElement | null = null;
    // Last-written DOM state, so attributes flip only on edges and the
    // two alpha vars only move in ≥1/255 steps — every one of these
    // writes invalidates computed style document-wide, and they were
    // all firing (or same-value re-firing) every frame.
    let lastDocked: boolean | null = null;
    let lastAmbientAttr: boolean | null = null;
    let lastExitAttr: boolean | null = null;
    let lastVeilVar = -1; // -1 ⇒ property currently absent

    const write = () => {
      frame = 0;
      if (disposed) return;

      const root = rootRef.current;
      if (!root) return;

      if (!servicesEl || !servicesEl.isConnected) {
        servicesEl = root.querySelector<HTMLElement>("#services");
      }
      const services = servicesEl;
      if (!services) return;

      const vh = window.innerHeight || 1;
      const servicesRect = services.getBoundingClientRect();
      prmQuery ??= window.matchMedia?.("(prefers-reduced-motion: reduce)") ?? null;
      mobileQuery ??= window.matchMedia?.("(max-width: 960px)") ?? null;
      const reducedMotion = prmQuery?.matches ?? false;
      const mobile = mobileQuery?.matches ?? false;
      if (!stageEl || !stageEl.isConnected) {
        stageEl = document.querySelector<HTMLElement>(".home-v2-stage");
      }
      const corridorFallback = stageEl?.dataset.fallback === "true";
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
      // ADR-074: `#voidwalker` (the career through-line) is the first
      // OPAQUE station below the pinned #about now — a plain normal-flow
      // station, which is the only property this read requires. The slot
      // passed #about → #continuum (ADR-047) → #proof (ADR-054) →
      // #practice (ADR-056) → here; `#practice` survives as a roleless
      // breather and is the defensive fallback.
      // ⚠ Keep this query and home-v2.css's
      // `html[data-corridor-exit="true"] #voidwalker` rule on the SAME
      // station (the ADR-030 §6 seam bug — see the comment below).
      //
      // ⚠ ADR-081 / ADR-082 U2: only an ENGAGED transparent Voidwalker
      // presentation extends the ambient to #practice. This is a runtime
      // mode decision, not merely a build flag: at 961–1100px the corridor
      // can dock while the hologram deliberately remains an opaque static
      // section, so #voidwalker must resume ownership of the kill there.
      // home-v2.css mode-gates the #practice stacking rule the same way.
      if (!aboutEl || !aboutEl.isConnected) aboutEl = root.querySelector<HTMLElement>("#about");
      if (!voidwalkerEl || !voidwalkerEl.isConnected) {
        voidwalkerEl = root.querySelector<HTMLElement>("#voidwalker");
      }
      if (!practiceEl || !practiceEl.isConnected) {
        practiceEl = root.querySelector<HTMLElement>("#practice");
      }
      if (!contactEl || !contactEl.isConnected) {
        contactEl = root.querySelector<HTMLElement>("#contact");
      }
      const voidwalkerMode = voidwalkerEl?.dataset.vwMode;
      const voidwalkerTransparent =
        VOIDWALKER_EXTENDS_CORRIDOR &&
        (voidwalkerMode === "hologram" || voidwalkerMode === "travel");
      const desiredNextStation = ABOUT_DECK_STAGE
        ? voidwalkerTransparent
          ? (practiceEl ?? contactEl ?? voidwalkerEl)
          : (voidwalkerEl ?? practiceEl ?? contactEl)
        : (aboutEl ?? voidwalkerEl ?? practiceEl ?? contactEl);
      if (nextStationEl !== desiredNextStation) nextStationEl = desiredNextStation;
      const nextStationTopVh =
        (nextStationEl?.getBoundingClientRect().top ?? servicesRect.bottom) / vh;
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

      // The dissipate clock leaves through the module ref — no DOM
      // write, no style invalidation (see the header note; every
      // consumer is JS).
      corridorDissipateRef.current.value = dissipate;
      corridorDissipateRef.current.live = true;
      if (docked !== lastDocked) {
        if (docked) {
          document.documentElement.setAttribute("data-corridor-docked", "true");
        } else {
          document.documentElement.removeAttribute("data-corridor-docked");
        }
        lastDocked = docked;
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

      if (servicesAmbient !== lastAmbientAttr) {
        if (servicesAmbient) {
          document.documentElement.setAttribute("data-services-ambient", "true");
        } else {
          document.documentElement.removeAttribute("data-services-ambient");
        }
        lastAmbientAttr = servicesAmbient;
      }
      // (`--services-ambient` is no longer written: the 2026-07-29 perf
      // pass found it had zero CSS or JS consumers — the level travels
      // via `servicesAmbientLevel` on the store. The cleanup removals
      // stay as one-time hygiene for any stale pre-pass value.)

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
      if (corridorExit !== lastExitAttr) {
        if (corridorExit) {
          document.documentElement.setAttribute("data-corridor-exit", "true");
        } else {
          document.documentElement.removeAttribute("data-corridor-exit");
        }
        lastExitAttr = corridorExit;
      }
      if (corridorExit) {
        // The veil feeds one rgba() alpha (home-v2.css body::before), so
        // sub-1/255 moves are invisible by construction — skip them. The
        // regime edge above always flushes, so entry/exit values land
        // exactly.
        if (lastVeilVar < 0 || Math.abs(veilAlpha - lastVeilVar) >= ALPHA_QUANTUM) {
          document.documentElement.style.setProperty("--corridor-exit-veil", veilAlpha.toFixed(4));
          lastVeilVar = veilAlpha;
        }
      } else if (lastVeilVar >= 0) {
        document.documentElement.style.removeProperty("--corridor-exit-veil");
        lastVeilVar = -1;
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
      // Hand the clock back to the inline-style fallback channel (labs,
      // or a remount) — readers see `live: false` and re-derive.
      corridorDissipateRef.current.live = false;
      corridorDissipateRef.current.value = 0;
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
