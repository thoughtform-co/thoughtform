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
    // ADR-012 v5: also write the attribute on the section element so
    // the v5 hard-swap CSS rule
    // (`#intelligence-layer[data-ilayer-mode="r3f"] .ilayer__brandmark-anchor > svg`)
    // can hide the SVG dock the moment the canvas mounts. The
    // `.ilayer__stack` and `.ilayer__brandmark-anchor` are siblings
    // inside `.ilayer__inner`, so a sibling selector wouldn't reach
    // cleanly across; mirroring the attribute onto the section
    // (which is the brandmark anchor's nearest common ancestor) is
    // the simplest way to gate it.
    const section = container.querySelector<HTMLElement>("#intelligence-layer");

    const motionMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sizeMQ = window.matchMedia("(max-width: 767px)");

    const evaluate = () => {
      const wantsStatic = motionMQ.matches || sizeMQ.matches || !probeWebGL();
      const next = wantsStatic ? "static" : "r3f";
      const cur = stack.getAttribute("data-ilayer-mode");
      if (cur !== next) {
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
