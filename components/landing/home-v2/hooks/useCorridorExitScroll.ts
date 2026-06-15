"use client";

import { useEffect, type RefObject } from "react";
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
 *     `.home-v2-stage__canvas` to a fixed full-viewport backdrop so
 *     the live R3F scene persists across the seam.
 *   - `depthGatewayStore.transform.docked` + `dockProgress` —
 *     `dockProgress` IS the dissipate clock; the camera rig +
 *     substrate painters read it to fly into the sphere + scatter
 *     the particles.
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
      // bottom, 1 when the section has fully replaced the previous
      // scene. Same shape the retired cover-plane sweep used for
      // `--handoff-cover` — the value is the natural "how far has the
      // section risen over the viewport" metric.
      const dissipate = clamp01((vh - servicesRect.top) / vh);
      const sectionInView = servicesRect.top < vh && servicesRect.bottom > 0;

      // Dock OFF the corridor epilogue (sphere landed + BILLIONS title
      // up), not off this section's scroll position. See the function
      // docstring + ADR-021 for the rationale.
      const ep = useDepthGatewayStore.getState().transform.epilogueProgress;
      const docked = dockCapable && ep >= DOCK_ENGAGE_EP && sectionInView && dissipate < 0.999;

      services.style.setProperty("--corridor-dissipate", dissipate.toFixed(4));
      document.documentElement.style.setProperty("--corridor-dissipate", dissipate.toFixed(4));
      if (docked) {
        document.documentElement.setAttribute("data-corridor-docked", "true");
        document.documentElement.setAttribute("data-corridor-exit", "true");
      } else {
        document.documentElement.removeAttribute("data-corridor-docked");
        document.documentElement.removeAttribute("data-corridor-exit");
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
      document.documentElement.style.removeProperty("--corridor-dissipate");
      const store = useDepthGatewayStore.getState();
      store.setTransform({
        ...store.transform,
        docked: false,
        dockProgress: 0,
      });
    };
  }, [rootRef]);
}
