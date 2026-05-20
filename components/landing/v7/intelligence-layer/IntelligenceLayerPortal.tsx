"use client";

import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { probeWebGL } from "@/lib/webgl/probe";
import { IntelligenceLayerStack } from "./IntelligenceLayerStack";
import { useIlayerProgress, useIlayerProgressStore } from "./useIlayerProgress";

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

  // Drive `--ilayer-progress` for the floating-label opacity gates.
  // The hook reads `transform.ringProgress` from `brandmarkJourneyStore`
  // and mirrors it into the CSS variable. No-ops when
  // `#intelligence-layer` is absent.
  useIlayerProgress();

  // Single combined effect — owns: static-fallback gate (MQ listeners
  // + writes `data-ilayer-mode` attribute), a SINGLE persistent
  // `createRoot` against `[data-ilayer-stack-root]`, and a mode
  // subscription that re-renders that root with either the R3F
  // stack or `null` (static fallback) as the mode changes.
  //
  // Previous shape used two effects + a `mountToken` to re-trigger
  // mount/unmount on mode flips. That created two failure modes:
  //   1. Calling `root.unmount()` synchronously inside an effect
  //      cleanup that fired during a parent render triggered
  //      "Attempted to synchronously unmount a root while React was
  //      already rendering".
  //   2. Deferring the unmount via `queueMicrotask` let the next
  //      effect run `createRoot(slot)` on the same container before
  //      the queued unmount executed — "You are calling
  //      ReactDOMClient.createRoot() on a container that has already
  //      been passed to createRoot() before".
  //
  // The single-root model sidesteps both: we createRoot exactly once
  // per component mount, switch its children via `root.render()`
  // (which `null` correctly handles by unmounting children but
  // keeping the root alive), and unmount only on real component
  // unmount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const container = containerRef.current;
    if (!container) return;
    const stack = container.querySelector<HTMLElement>(".ilayer__stack");
    if (!stack) return;
    const slot = container.querySelector<HTMLElement>("[data-ilayer-stack-root]");
    if (!slot) return;

    const root = createRoot(slot);
    rootRef.current = root;

    const renderForMode = (mode: "r3f" | "static") => {
      root.render(mode === "static" ? null : <IntelligenceLayerStack />);
    };

    const motionMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sizeMQ = window.matchMedia("(max-width: 767px)");

    const evaluate = () => {
      const wantsStatic = motionMQ.matches || sizeMQ.matches || !probeWebGL();
      const next: "r3f" | "static" = wantsStatic ? "static" : "r3f";
      const section = container.querySelector<HTMLElement>("#intelligence-layer");
      const cur = stack.getAttribute("data-ilayer-mode");
      const sectionCur = section?.getAttribute("data-ilayer-mode");
      if (cur !== next || sectionCur !== next) {
        stack.setAttribute("data-ilayer-mode", next);
        section?.setAttribute("data-ilayer-mode", next);
        useIlayerProgressStore.getState().setMode(next);
        renderForMode(next);
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
      // Defer the unmount: this cleanup can run during a parent
      // re-render (e.g. StrictMode's double-invoke, HMR), and a
      // synchronous `root.unmount()` then races React's render
      // commit. Microtask scheduling lets the current commit flush
      // before the root is torn down.
      rootRef.current = null;
      queueMicrotask(() => root.unmount());
    };
  }, [containerRef]);

  // ADR-014 v5: CelestialLinework no longer portals into the
  // substrate anchor. Its role (dashed outer ring + bearing ticks +
  // cardinal diamonds around the brandmark) is now subsumed by the
  // mid OrbitalCluster inside the R3F scene — same visual
  // vocabulary, but rendered as part of the three-cluster triad so
  // all three pillars share the same decorative grammar. The
  // brandmark itself dissolves at end of the HANDOFF phase, so the
  // linework's reason to exist (decorate the brandmark) is gone.

  return null;
}
