"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { probeWebGL } from "@/lib/webgl/probe";
import { IntelligenceLayerStack } from "./IntelligenceLayerStack";
import { useIlayerProgress, useIlayerProgressStore } from "./useIlayerProgress";
import { CelestialLinework } from "./CelestialLinework";

interface IntelligenceLayerPortalProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

/**
 * IntelligenceLayerPortal — mounts the rings-only R3F scene into
 * the `[data-ilayer-stack-root]` placeholder declared inside the v7
 * prototype HTML (rendered via `dangerouslySetInnerHTML`).
 *
 * Owns three concerns:
 *
 *   1. Static-fallback gate: writes `data-ilayer-mode="r3f" | "static"`
 *      on `.ilayer__stack` based on `prefers-reduced-motion`,
 *      viewport width, and WebGL capability.
 *   2. Canvas mount: `createRoot`s the R3F canvas when mode is r3f,
 *      tears it down when mode is static.
 *   3. Progress hook mount: drives the `--ilayer-progress` CSS
 *      variable for the floating annotation labels' fade-in.
 *
 * ADR-013 retirements (Phase 3c):
 *
 *   - `applyR3FDockMask` — the inline `opacity: 0 !important` JS
 *     mask on the substrate SVG dock is gone. With the single-painter
 *     model the global particle painter owns the brandmark cloud
 *     throughout the section; the substrate SVG dock is hidden in
 *     particle mode by a single CSS rule applied to the whole
 *     particle-mode class (`[data-brandmark-mode="particle"]
 *     [data-brand-anchor="substrate"] :where(img, svg)`).
 *   - The `MutationObserver` watching the substrate anchor for
 *     re-portaled SVG glyphs — no longer needed (the CSS rule does
 *     the hiding declaratively).
 *
 * The static fallback (CSS-3D ellipse stack already in DOM) is the
 * graceful path: when the canvas can't or shouldn't paint, we skip
 * mounting it and the SVG fallback inside `.ilayer__stack__fallback`
 * is revealed by CSS via the `data-ilayer-mode="static"` attribute.
 */
export function IntelligenceLayerPortal({ containerRef }: IntelligenceLayerPortalProps) {
  const rootRef = useRef<Root | null>(null);
  const [mountToken, setMountToken] = useState(0);
  const [brandmarkAnchor, setBrandmarkAnchor] = useState<HTMLElement | null>(null);

  // Drive `--ilayer-progress` for the floating-label opacity gates.
  // The hook reads `transform.ringProgress` from `brandmarkJourneyStore`
  // and mirrors it into the CSS variable. No-ops when
  // `#intelligence-layer` is absent.
  useIlayerProgress();

  // Static-fallback gate. Reads `prefers-reduced-motion` and viewport
  // width on mount and on each change. The portal then either
  // createRoots an R3F canvas (mode="r3f") or skips the mount
  // entirely (mode="static") and the SVG fallback paints.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const container = containerRef.current;
    if (!container) return;
    const stack = container.querySelector<HTMLElement>(".ilayer__stack");
    if (!stack) return;

    const motionMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sizeMQ = window.matchMedia("(max-width: 767px)");

    const evaluate = () => {
      const wantsStatic = motionMQ.matches || sizeMQ.matches || !probeWebGL();
      const next = wantsStatic ? "static" : "r3f";
      // Re-query the section element on every evaluate() call rather
      // than caching it -- HMR / Fast Refresh regenerates the DOM
      // (the v7 prototype is rendered via dangerouslySetInnerHTML)
      // and the cached reference would point at the previous
      // (detached) section, so setAttribute would silently fail.
      const section = container.querySelector<HTMLElement>("#intelligence-layer");
      const cur = stack.getAttribute("data-ilayer-mode");
      const sectionCur = section?.getAttribute("data-ilayer-mode");
      if (cur !== next || sectionCur !== next) {
        stack.setAttribute("data-ilayer-mode", next);
        section?.setAttribute("data-ilayer-mode", next);
        useIlayerProgressStore.getState().setMode(next);
        // Bump mount token so the second effect re-runs and either
        // mounts or unmounts the canvas to match the new mode.
        setMountToken((t) => t + 1);
      }
    };

    evaluate();
    motionMQ.addEventListener("change", evaluate);
    sizeMQ.addEventListener("change", evaluate);

    return () => {
      motionMQ.removeEventListener("change", evaluate);
      sizeMQ.removeEventListener("change", evaluate);
      stack.removeAttribute("data-ilayer-mode");
      const section = container.querySelector<HTMLElement>("#intelligence-layer");
      section?.removeAttribute("data-ilayer-mode");
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

  // Discover the substrate brandmark anchor so we can portal the
  // celestial-linework SVG overlay into it. The overlay is a
  // decorative sibling of the canonical brandmark glyph (also
  // portal'd into this anchor by `BrandmarkSystem`); it sits on
  // top of the vector brandmark and adds hairline rings, ticks,
  // and cardinal diamonds — celestial-editor language — driven
  // entirely by the `--ilayer-progress` CSS variable.
  //
  // We share `mountToken` from the mode-probe effect — it bumps
  // whenever the prototype HTML re-mounts, so the anchor lookup
  // runs again post-HMR / Fast-Refresh without needing a separate
  // MutationObserver (which previously fired on every R3F canvas
  // mutation and starved the R3F mount of execution time).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const anchor = container.querySelector<HTMLElement>(".ilayer__brandmark-anchor");
    setBrandmarkAnchor(anchor);
  }, [containerRef, mountToken]);

  if (!brandmarkAnchor) return null;
  return createPortal(<CelestialLinework />, brandmarkAnchor);
}
