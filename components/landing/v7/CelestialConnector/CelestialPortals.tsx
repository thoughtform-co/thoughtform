"use client";

import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { SlotsMap } from "@/lib/celestial/schema";
import { CelestialConnector } from "./CelestialConnector";

interface CelestialPortalsProps {
  slots: SlotsMap;
  containerRef: React.RefObject<HTMLElement | null>;
}

/**
 * Mounts a <CelestialConnector/> into each [data-celestial-slot] placeholder
 * found inside the dangerouslySetInnerHTML container. Cleans up on unmount.
 *
 * Reveal is handled inside <CelestialConnector/> itself via a callback ref,
 * so portal-mounted connectors are observed independently of the global
 * useRevealMotion hook (which ran before they existed).
 */
export function CelestialPortals({ slots, containerRef }: CelestialPortalsProps) {
  const rootsRef = useRef<Map<string, Root>>(new Map());
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Cancel a pending teardown from a just-fired cleanup (Strict Mode /
    // Fast Refresh mount→unmount→mount) so we REUSE the existing roots.
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const container = containerRef.current;
    if (!container) return;

    const slotEls = container.querySelectorAll<HTMLElement>("[data-celestial-slot]");

    slotEls.forEach((el) => {
      const slotId = el.dataset.celestialSlot;
      if (!slotId) return;
      const assignment = slots[slotId];
      if (!assignment || !assignment.enabled) return;

      let root = rootsRef.current.get(slotId);
      if (!root) {
        root = createRoot(el);
        rootsRef.current.set(slotId, root);
      }
      root.render(<CelestialConnector config={assignment.config} slotId={slotId} />);
    });

    return () => {
      // Defer the unmounts one MACROTASK (setTimeout 0): each connector
      // root renders its own React tree asynchronously, so a synchronous
      // (or microtask) unmount lands mid-render and triggers "Attempted to
      // synchronously unmount a root while React was already rendering".
      // The effect above cancels this timer on remount so Strict Mode
      // reuses the roots; the guard skips teardown if a remount swapped
      // the map. Mirrors useCorridorMount's cleanup.
      const roots = rootsRef.current;
      timerRef.current = window.setTimeout(() => {
        if (rootsRef.current === roots) {
          roots.forEach((root) => root.unmount());
          rootsRef.current = new Map();
        }
        timerRef.current = null;
      }, 0);
    };
  }, [slots, containerRef]);

  return null;
}
