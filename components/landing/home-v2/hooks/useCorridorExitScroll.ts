"use client";

import { useEffect, type RefObject } from "react";
import { corridorExitSpeedRamp } from "@/lib/home-v2/epilogueTimeline";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";

/** Corridor `epilogueProgress` at/after which the live sphere docks as
 *  a fixed backdrop for the corridor-exit zoom-dissipate (ADR-021).
 *  Chosen so the BILLIONS title is essentially up (TITLE_IN ends 0.74)
 *  and the camera has all but landed before the instrument is held.
 *  Inherited verbatim from the retired cover-plane sweep
 *  (`DOCK_ENGAGE_EP` in `HandoffOrbitEmbed`) so the dwell at the landed
 *  sphere stays identical — the only thing that changed at the seam is
 *  what plays AFTER the dwell, not when the dwell starts. */
const DOCK_ENGAGE_EP = 0.72;
/** Scroll runway (in viewports) over which the dissipate clock fills.
 *  Widened 1.58 → 2.0 (2026-06-16, ADR-021 follow-up) now that
 *  #services holds a re-centring brandmark instead of header/cards/CTA:
 *  the longer runway lets the welded brandmark recentre lerp resolve
 *  ~1.3 viewports past the section's first reveal instead of right at
 *  it, so the mark doesn't "appear too soon" off the BILLIONS beat. */
const DISSIPATE_SCROLL_SPAN_VH = 2.0;
/** `data-services-brandmark="fade"` ramp window in `continuum.top /
 *  vh` units. At 0.5 the gate is still "hold" (full opacity); at 0.1
 *  the brandmark has fully faded as the next section approaches the
 *  top of the viewport. Tuned around the 200svh #services length so
 *  the hold lasts ~0.5vh of scroll and the fade ~0.4vh — long enough
 *  to read as a deliberate beat, short enough that a fast scroll
 *  still completes the fade before #continuum is fully in. */
const CONTINUUM_FADE_HOLD = 0.5;
const CONTINUUM_FADE_END = 0.1;
/** Engage the fixed dock slightly BEFORE #services physically enters
 *  the viewport. If we wait until `services.top < vh`, the corridor
 *  sticky cell has already started releasing (`sticky.top < 0`), and
 *  promoting the canvas from absolute-in-sticky to fixed-at-viewport
 *  shifts the visible sphere. Preloading the dock while
 *  `services.top` is still ~0.25vh below the viewport keeps sticky.top
 *  at 0 at the promotion moment; `rawDissipate` remains 0 until the
 *  section actually enters, so the fly-in / scatter clock is unchanged. */
const DOCK_PRELOAD_VH = 0.25;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * useCorridorExitScroll — single rAF scroll watcher for the
 * production corridor → Services seam (ADR-021).
 *
 * Replaces the retired `useEmbeddedServicesScroll` from
 * `HandoffOrbitEmbed`. Watches the `#services` section's live rect
 * and writes:
 *
 *   - `--corridor-dissipate` (0..1) on `<html>` — the dissipate
 *     clock. CSS gates (canvas fade, services leading-edge
 *     transparency) read this var.
 *   - `data-corridor-docked` attribute on `<html>` — promotes
 *     `.home-v2-stage__canvas` (and `.home-v2-projected-brandmark`)
 *     to fixed full-viewport backdrops so the live R3F scene + the
 *     re-centring brandmark persist across the seam.
 *   - `depthGatewayStore.transform.docked` + `dockProgress` —
 *     `dockProgress` IS the dissipate clock; the camera rig +
 *     substrate painters read it to fly into the sphere + scatter
 *     the particles. `ProjectedBrandmarkActor` also reads this to
 *     lerp the welded brandmark into the Services centre across
 *     most of the dissipate clock (ADR-021 follow-up).
 *   - `data-services-brandmark` attribute on `<html>` — once the
 *     dock disengages, this gate flips to `"hold"` (mark held fixed-
 *     centred in #services via CSS) and then `"fade"` as #continuum
 *     enters. `--services-brandmark` (0..1) drives the fade opacity.
 *     `ProjectedBrandmarkActor` reads the gate to release the
 *     element to CSS — it stops writing inline transform/opacity
 *     when the gate is `"hold"` or `"fade"`.
 *
 * 2026-06-16 (ADR-021 follow-up): the per-element reveal vars
 * (`--services-header-in`, `--services-grid-in`, `--services-cta-in`)
 * are GONE. Their DOM targets (`.exec__header`, `.exec__grid`,
 * `.practice-cta--funnel`) were stripped from #services in the v7
 * prototype; #services is now a runway for the welded brandmark
 * re-centre. Restore the per-element reveal channels only if those
 * elements come back in a later content pass.
 *
 * Engages off the corridor's own `epilogueProgress >= DOCK_ENGAGE_EP`
 * (NOT off `#services`'s rect alone) so the dwell at the landed
 * sphere opens BEFORE the user scrolls into the section — the
 * instrument is held the moment the landing resolves, and the
 * subsequent #services scroll then ramps the dissipate clock against
 * a stable backdrop. Disengages once the section has fully covered
 * the viewport (dissipate ≥ 0.999) so the R3F frameloop can idle
 * behind the opaque services surface.
 *
 * Single-writer rule (ADR-021 invariant): this hook is the ONLY
 * writer of `docked` / `dockProgress`. `useDepthScroll` stays the
 * sole writer of `progress` / `paintProgress` / `epilogueProgress`;
 * the substrate painters + camera rig read `dockProgress` as the
 * dissipate clock themselves. Two rAF loops writing the same channel
 * fought every frame and made the sphere jitter (see
 * `sentinel/BEST-PRACTICES.md` "Cross-writer scroll state needs an
 * owner and a release guard"); this hook honours the same contract
 * the retired sweep recipe established.
 *
 * Fallback gate (`dockCapable`): on mobile, reduced-motion, or
 * WebGL-fallback the dock never engages — the page reads as a
 * sequential dark cut from the corridor epilogue to the Services
 * section. Mirrors the retired sweep's `dockCapable` so any future
 * recipe that reuses this seam keeps a single fallback contract.
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
      // bottom, 1 after the section has risen through a deliberately
      // longer-than-one-viewport runway. ToyFight's feel comes from
      // a smoothed scroll runtime; here we preserve native scroll/R3F
      // timing and instead stretch/ease only this seam's single clock.
      const rawDissipate = clamp01((vh - servicesRect.top) / (vh * DISSIPATE_SCROLL_SPAN_VH));
      const dissipate = corridorExitSpeedRamp(rawDissipate);
      const sectionNearDock =
        servicesRect.top < vh * (1 + DOCK_PRELOAD_VH) && servicesRect.bottom > 0;

      // Dock OFF the corridor epilogue (sphere landed + BILLIONS title
      // up), not off this section's scroll position. See the function
      // docstring + ADR-021 for the rationale.
      const ep = useDepthGatewayStore.getState().transform.epilogueProgress;
      const docked = dockCapable && ep >= DOCK_ENGAGE_EP && sectionNearDock && rawDissipate < 0.999;

      services.style.setProperty("--corridor-dissipate", dissipate.toFixed(4));
      document.documentElement.style.setProperty("--corridor-dissipate", dissipate.toFixed(4));
      if (docked) {
        document.documentElement.setAttribute("data-corridor-docked", "true");
        document.documentElement.setAttribute("data-corridor-exit", "true");
      } else {
        document.documentElement.removeAttribute("data-corridor-docked");
        document.documentElement.removeAttribute("data-corridor-exit");
      }

      // ── Services brandmark gate ────────────────────────────────
      // After the dock disengages, the brandmark needs to remain on
      // screen — fixed-centred in #services for a beat, then fading
      // out as #continuum enters. The gate is mutually exclusive
      // with `data-corridor-docked` so the post-active rAF in
      // `ProjectedBrandmarkActor` can branch on either flag cleanly
      // (no overlap → no `!important` arms race between the gate
      // CSS and the JS-written rect).
      //
      // States:
      //   - (no attribute) : either we're not in the services
      //     context yet, OR `data-corridor-docked` owns the mark.
      //   - "hold" : dock has released, mark held fixed-centred at
      //     opacity 1.
      //   - "fade" : #continuum is approaching the top of the
      //     viewport. `--services-brandmark` ramps opacity 1 → 0
      //     across the `CONTINUUM_FADE_HOLD → CONTINUUM_FADE_END`
      //     band of `continuum.top / vh`.
      //
      // Released back to (no attribute) once #continuum is fully in
      // OR the user has scrolled back into the dock window — the
      // `docked` branch above re-takes ownership in that case.
      let servicesGate: "hold" | "fade" | null = null;
      let servicesBrandmarkOpacity = 1;
      if (!docked && dockCapable && rawDissipate >= 0.999) {
        // Dock has released. Decide hold vs fade based on the next
        // section's leading edge. The continuum slot used to live
        // here (it was dropped at the seam — `dropTrailingConnectorSlot:
        // "practice-to-about"` in the page route — so #continuum is
        // the next station after #services).
        const continuum = root.querySelector<HTMLElement>("#continuum");
        const continuumRect = continuum?.getBoundingClientRect() ?? null;
        if (!continuumRect || continuumRect.top >= vh * CONTINUUM_FADE_HOLD) {
          servicesGate = "hold";
          servicesBrandmarkOpacity = 1;
        } else if (continuumRect.top <= vh * CONTINUUM_FADE_END) {
          // Fully faded; the next section owns the viewport now.
          // Releasing the gate (rather than holding it at "fade"
          // with opacity 0) lets `.home-v2-projected-brandmark`
          // drop back to its `position: absolute` default so it
          // doesn't keep a fixed layer alive past its usefulness.
          servicesGate = null;
          servicesBrandmarkOpacity = 0;
        } else {
          // Linear fade across the continuum approach band — a
          // CSS-driven opacity ramp on a fixed-centred mark, no
          // position writes from JS (the post-active rAF clears its
          // inline styles when the gate is "fade").
          const t =
            (continuumRect.top - vh * CONTINUUM_FADE_END) /
            (vh * (CONTINUUM_FADE_HOLD - CONTINUUM_FADE_END));
          servicesGate = "fade";
          servicesBrandmarkOpacity = clamp01(t);
        }
      }
      if (servicesGate) {
        document.documentElement.setAttribute("data-services-brandmark", servicesGate);
        document.documentElement.style.setProperty(
          "--services-brandmark",
          servicesBrandmarkOpacity.toFixed(4)
        );
      } else {
        document.documentElement.removeAttribute("data-services-brandmark");
        document.documentElement.style.removeProperty("--services-brandmark");
      }

      // ONLY own the dock channel. The corridor's `useDepthScroll`
      // remains the sole writer of progress / paintProgress /
      // epilogueProgress (single-writer rule). The painters read
      // `dockProgress` (the dissipate clock) and hold a fixed pose
      // themselves, so we never need to overwrite the epilogue scrub
      // here.
      const store = useDepthGatewayStore.getState();
      const prev = store.transform;
      const nextDockProgress = docked ? dissipate : 0;
      if (prev.docked !== docked || Math.abs(prev.dockProgress - nextDockProgress) > 0.0005) {
        store.setTransform({ ...prev, docked, dockProgress: nextDockProgress });
      }
    };

    const requestWrite = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(write);
    };

    requestWrite();
    window.addEventListener("scroll", requestWrite, { passive: true });
    window.addEventListener("resize", requestWrite);

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestWrite);
      window.removeEventListener("resize", requestWrite);
      document.documentElement.removeAttribute("data-corridor-docked");
      document.documentElement.removeAttribute("data-corridor-exit");
      document.documentElement.removeAttribute("data-services-brandmark");
      document.documentElement.style.removeProperty("--corridor-dissipate");
      document.documentElement.style.removeProperty("--services-brandmark");
      const store = useDepthGatewayStore.getState();
      store.setTransform({
        ...store.transform,
        docked: false,
        dockProgress: 0,
      });
    };
  }, [rootRef]);
}
