"use client";

import { useEffect, type RefObject } from "react";
import { corridorExitSpeedRamp } from "@/lib/home-v2/epilogueTimeline";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";

/** Corridor `epilogueProgress` at/after which the live sphere docks as
 *  a fixed backdrop for the corridor-exit zoom-dissipate (ADR-021).
 *  Chosen so the BILLIONS title is essentially up (TITLE_IN ends 0.74)
 *  and the camera has all but landed before the instrument is held. */
const DOCK_ENGAGE_EP = 0.72;
/** Scroll runway (in viewports) over which the dissipate clock fills.
 *
 *  ADR-021 amendment (2026-06-19): retired the in-#services brandmark
 *  re-centre / hold / pixel-field / ambient beats — `#services` is now
 *  a content section (Keynote / Workshop / Embedded terminal cards),
 *  NOT a brandmark runway. The dissipate is intentionally SHORT so
 *  the sphere zoom-in resolves as the section's header reaches the
 *  viewport top; the brandmark fades out with the dissipating sphere
 *  rather than re-centring into the section. */
const DISSIPATE_SCROLL_SPAN_VH = 0.9;
/** Engage the fixed dock slightly BEFORE #services physically enters
 *  the viewport. See ADR-021 history for the rationale. */
const DOCK_PRELOAD_VH = 0.25;
/** Cap on the body veil so the canvas remains visible underneath
 *  through the dock window. The veil ramps from 0 to this cap with
 *  the dissipate clock and never goes higher — once `#services`'s
 *  opaque void shield takes over the dark backing, the veil clears. */
const VEIL_DOCK_CAP = 0.55;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

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
 *     from 0 → VEIL_DOCK_CAP across the dissipate. The veil clears
 *     once the dock releases (the section's opaque `--void` shield
 *     takes over from there).
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
 *   - `data-services-ambient` + `--services-ambient` +
 *     `transform.servicesAmbient` / `servicesAmbientLevel` — no
 *     ambient interior haze through Services; the section's `--void`
 *     shield owns the dark backing once dissipate completes.
 *
 * For continuity with the surviving store fields (`seamMorph`,
 * `servicesAmbient`, `servicesAmbientLevel`) the hook still writes
 * them — always to their inert values (0 / false / 0). The downstream
 * R3F painters branch off the flags and gracefully no-op.
 *
 * Engages off the corridor's own `epilogueProgress >= DOCK_ENGAGE_EP`
 * (NOT off `#services`'s rect alone) so the dwell at the landed
 * sphere opens BEFORE the user scrolls into the section. Disengages
 * once dissipate ≥ 0.999 so the R3F frameloop can idle behind the
 * opaque services surface.
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

      // ── Body veil ──────────────────────────────────────────────
      // While docked the veil ramps from 0 → VEIL_DOCK_CAP with the
      // dissipate so the canvas stays visible underneath during the
      // zoom-in. Once the dock releases, the veil clears entirely —
      // `#services`'s own opaque `--void` shield owns the dark
      // backing for the rest of the section.
      const corridorExit = docked;
      const veilAlpha = docked ? Math.min(VEIL_DOCK_CAP, dissipate * VEIL_DOCK_CAP) : 0;
      if (corridorExit) {
        document.documentElement.setAttribute("data-corridor-exit", "true");
        document.documentElement.style.setProperty("--corridor-exit-veil", veilAlpha.toFixed(4));
      } else {
        document.documentElement.removeAttribute("data-corridor-exit");
        document.documentElement.style.removeProperty("--corridor-exit-veil");
      }

      // Single-writer rule: only own dock / dissipate / inert
      // seam+ambient channels. `useDepthScroll` stays the sole writer
      // of progress / paintProgress / epilogueProgress.
      const store = useDepthGatewayStore.getState();
      const prev = store.transform;
      const nextDockProgress = docked ? dissipate : 0;
      const dockChanged =
        prev.docked !== docked || Math.abs(prev.dockProgress - nextDockProgress) > 0.0005;
      // The seam / ambient store fields stay alive in the type for
      // R3F painter source-compat, but they are no longer driven
      // here. Force them inert if any other writer ever set them.
      const seamMorphInert = 0;
      const ambientInert = false;
      const ambientLevelInert = 0;
      const seamInertChanged = Math.abs(prev.seamMorph - seamMorphInert) > 0.0005;
      const ambientInertChanged =
        prev.servicesAmbient !== ambientInert ||
        Math.abs(prev.servicesAmbientLevel - ambientLevelInert) > 0.0005;
      if (dockChanged || seamInertChanged || ambientInertChanged) {
        store.setTransform({
          ...prev,
          docked,
          dockProgress: nextDockProgress,
          seamMorph: seamMorphInert,
          servicesAmbient: ambientInert,
          servicesAmbientLevel: ambientLevelInert,
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

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestWrite);
      window.removeEventListener("resize", requestWrite);
      document.documentElement.removeAttribute("data-corridor-docked");
      document.documentElement.removeAttribute("data-corridor-exit");
      document.documentElement.style.removeProperty("--corridor-dissipate");
      document.documentElement.style.removeProperty("--corridor-exit-veil");
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
