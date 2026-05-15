"use client";

import { useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { IntelligenceLayerStack } from "./IntelligenceLayerStack";
import { useIlayerProgress, useIlayerProgressStore } from "./useIlayerProgress";

interface IntelligenceLayerPortalProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

/**
 * IntelligenceLayerPortal — mounts the layered-stack R3F scene into
 * the `[data-ilayer-stack-root]` placeholder declared inside the v7
 * prototype HTML (rendered into the page via `dangerouslySetInnerHTML`).
 *
 * Mirrors {@link BuildCasesPortal}'s pattern: a single `createRoot`
 * call that owns the placeholder's subtree, with a clean unmount on
 * effect teardown. Also owns the static-fallback gate (writes
 * `data-ilayer-mode="r3f" | "static"` on `.ilayer__stack` based on
 * `prefers-reduced-motion`, viewport width, and WebGL capability)
 * and the scroll-progress trigger ({@link useIlayerProgress}).
 *
 * The static fallback (CSS-3D ellipse stack already in DOM) is the
 * graceful path: when the canvas can't or shouldn't paint, we
 * simply skip mounting it and the SVG fallback inside
 * `.ilayer__stack__fallback` is revealed by CSS via the
 * `data-ilayer-mode="static"` attribute.
 */
export function IntelligenceLayerPortal({ containerRef }: IntelligenceLayerPortalProps) {
  const rootRef = useRef<Root | null>(null);
  const [mountToken, setMountToken] = useState(0);

  // Drive scroll-progress at the parent level so the trigger exists
  // even when the canvas is in static-fallback mode (the
  // annotation clusters' [data-ilayer-state="open"] reveal still
  // depends on it). The hook no-ops when `#intelligence-layer` is
  // absent.
  useIlayerProgress();

  // Static-fallback gate: write data-ilayer-mode on the stack
  // wrapper. Reads `prefers-reduced-motion` and viewport width on
  // mount and on each resize / preference change. The portal then
  // either createRoots an R3F canvas (mode="r3f") or skips the
  // mount entirely (mode="static") and the SVG fallback paints.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const container = containerRef.current;
    if (!container) return;
    const stack = container.querySelector<HTMLElement>(".ilayer__stack");
    if (!stack) return;

    const motionMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sizeMQ = window.matchMedia("(max-width: 767px)");

    /**
     * ADR-012 v5: imperatively hide the SVG dock at the substrate
     * anchor whenever the R3F canvas is the painter. We do this in
     * JS (inline `style.opacity = "0"` with the `!important`
     * priority flag) rather than via a CSS attribute selector
     * because the cascade has historically been brittle around the
     * brandmark dock-state gates (`[data-brand-svg-dock="substrate"]`
     * sets `opacity: 1 !important`); inline `!important` beats
     * stylesheet `!important` of any specificity, so this is the
     * most reliable way to guarantee the SVG dock yields to the R3F
     * particle cloud during the section.
     *
     * Re-applied each evaluate() because Fast Refresh / portal
     * remounts may regenerate the SVG inside the anchor (BrandmarkSystem
     * portals it via createPortal), and the inline style may need
     * to be re-attached.
     */
    const applyR3FDockMask = (mask: boolean): void => {
      const section = container.querySelector<HTMLElement>("#intelligence-layer");
      const anchor = section?.querySelector<HTMLElement>(".ilayer__brandmark-anchor");
      if (!anchor) return;
      // Match both `<img>` (placeholder, normally stripped by v7-parse)
      // and `<svg>` (canonical glyph portal'd by BrandmarkSystem).
      const children = anchor.querySelectorAll<HTMLElement>(":scope > img, :scope > svg");
      for (const child of children) {
        if (mask) {
          child.style.setProperty("opacity", "0", "important");
          child.style.setProperty("transition", "none", "important");
        } else {
          child.style.removeProperty("opacity");
          child.style.removeProperty("transition");
        }
      }
    };

    const evaluate = () => {
      const wantsStatic = motionMQ.matches || sizeMQ.matches || !probeWebGL();
      const next = wantsStatic ? "static" : "r3f";
      // Re-query the section element on every evaluate() call rather
      // than caching it -- HMR / Fast Refresh regenerates the DOM
      // (the v7 prototype is rendered via dangerouslySetInnerHTML)
      // and the cached reference would point at the previous
      // (detached) section, so setAttribute would silently fail to
      // affect the live DOM.
      const section = container.querySelector<HTMLElement>("#intelligence-layer");
      const cur = stack.getAttribute("data-ilayer-mode");
      const sectionCur = section?.getAttribute("data-ilayer-mode");
      // Always write to BOTH if either is stale (a fresh remount may
      // have a cur="r3f" stack but a missing section attr).
      if (cur !== next || sectionCur !== next) {
        stack.setAttribute("data-ilayer-mode", next);
        section?.setAttribute("data-ilayer-mode", next);
        useIlayerProgressStore.getState().setMode(next);
        // Bump mount token so the second effect re-runs and either
        // mounts or unmounts the canvas to match the new mode.
        setMountToken((t) => t + 1);
      }
      // Apply the dock-mask every evaluate, even if mode hasn't
      // changed -- BrandmarkSystem may have re-portal'd the SVG
      // (e.g. on Fast Refresh of an unrelated component), and our
      // inline style would have been lost.
      applyR3FDockMask(next === "r3f");
    };

    evaluate();
    motionMQ.addEventListener("change", evaluate);
    sizeMQ.addEventListener("change", evaluate);

    // Watch for the substrate-anchor's children changing. When
    // BrandmarkSystem re-portals the canonical glyph (e.g. after
    // Fast Refresh, route navigation, admin overlay teardown), we
    // need to re-apply the inline opacity-0 style to the newly
    // created SVG so the R3F particle cloud stays the sole painter.
    const sectionForObs = container.querySelector<HTMLElement>("#intelligence-layer");
    const anchorForObs = sectionForObs?.querySelector<HTMLElement>(".ilayer__brandmark-anchor");
    let dockObserver: MutationObserver | null = null;
    if (anchorForObs) {
      dockObserver = new MutationObserver(() => {
        // Re-apply with the current desired mask state by calling
        // evaluate's mask helper indirectly via re-evaluating mode.
        const wantsStatic = motionMQ.matches || sizeMQ.matches || !probeWebGL();
        applyR3FDockMask(!wantsStatic);
      });
      dockObserver.observe(anchorForObs, { childList: true, subtree: false });
    }

    return () => {
      motionMQ.removeEventListener("change", evaluate);
      sizeMQ.removeEventListener("change", evaluate);
      dockObserver?.disconnect();
      stack.removeAttribute("data-ilayer-mode");
      // Re-query for cleanup too, in case the section element has
      // been replaced since mount.
      const section = container.querySelector<HTMLElement>("#intelligence-layer");
      section?.removeAttribute("data-ilayer-mode");
      // Restore the SVG dock to its CSS-controlled visibility.
      applyR3FDockMask(false);
    };
  }, [containerRef]);

  // Canvas mount / unmount based on the resolved mode. We createRoot
  // into `[data-ilayer-stack-root]` only when mode="r3f"; in static
  // mode we tear down any existing root so the canvas DOM is gone
  // and the SVG fallback reads cleanly.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const slot = container.querySelector<HTMLElement>("[data-ilayer-stack-root]");
    if (!slot) return;

    const mode = useIlayerProgressStore.getState().mode;

    if (mode === "static") {
      const r = rootRef.current;
      rootRef.current = null;
      if (r) r.unmount();
      return;
    }

    let root = rootRef.current;
    if (!root) {
      root = createRoot(slot);
      rootRef.current = root;
    }
    root.render(<IntelligenceLayerStack />);

    return () => {
      const r = rootRef.current;
      rootRef.current = null;
      if (r) r.unmount();
    };
  }, [containerRef, mountToken]);

  return null;
}

/** One-shot WebGL feasibility probe. Returns `true` if a WebGL 2
 *  context (or WebGL 1 fallback) can be acquired. We don't keep the
 *  probe context around — Three creates its own. */
function probeWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const ctx =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");
    return ctx != null;
  } catch {
    return false;
  }
}
